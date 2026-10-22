using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api")]
    public class RecibosController : ApiController
    {
        public class AplicacionReciboRequest
        {
            public int ComprobanteID { get; set; }
            public decimal Importe { get; set; }
        }

        public class EmitirReciboRequest
        {
            public Guid ClaveOperacion { get; set; }
            public int ClienteID { get; set; }
            public DateTime? Fecha { get; set; }
            public string Letra { get; set; }
            public string Sucursal { get; set; }
            public decimal Total { get; set; }
            public string FormaPago { get; set; }
            public string Referencia { get; set; }
            public decimal ImporteFormaPago { get; set; }
            public string Observaciones { get; set; }
            public List<AplicacionReciboRequest> Aplicaciones { get; set; }
        }

        public class EditarReciboRequest
        {
            public DateTime? Fecha { get; set; }
            public string Letra { get; set; }
            public string Sucursal { get; set; }
            public string FormaPago { get; set; }
            public string Referencia { get; set; }
            public string Observaciones { get; set; }
        }

        public class AnularReciboRequest
        {
            public string Motivo { get; set; }
        }

        private class UsuarioSesion
        {
            public int UsuarioID { get; set; }
            public string NombreUsuario { get; set; }
        }

        private class ClienteRecibo
        {
            public int ClienteID { get; set; }
            public string RazonSocial { get; set; }
            public string CUIT { get; set; }
            public string Domicilio { get; set; }
            public string CondicionFiscal { get; set; }
            public bool EstadoCliente { get; set; }
        }

        private class DeudaRecibo
        {
            public int ComprobanteID { get; set; }
            public int ClienteID { get; set; }
            public string Tipo { get; set; }
            public int NumeroCorrelativo { get; set; }
            public string Estado { get; set; }
            public string Impacto { get; set; }
            public DateTime FechaEmision { get; set; }
            public decimal Total { get; set; }
            public decimal Aplicado { get; set; }
            public decimal Pendiente { get { return Total - Aplicado; } }
        }

        private class ReciboExistente
        {
            public int ComprobanteID { get; set; }
            public int ClienteID { get; set; }
            public int NumeroCorrelativo { get; set; }
            public DateTime FechaEmision { get; set; }
            public string Letra { get; set; }
            public string Sucursal { get; set; }
            public string NumeroComprobante { get; set; }
            public decimal Total { get; set; }
            public string Observaciones { get; set; }
        }

        private class AccesoException : Exception
        {
            public HttpStatusCode StatusCode { get; private set; }
            public AccesoException(HttpStatusCode statusCode, string message) : base(message)
            {
                StatusCode = statusCode;
            }
        }

        private static string SqlConnectionString()
        {
            var entity = new EntityConnectionStringBuilder(
                ConnectionStringHelper.GetConnectionString("SGTLEntities"));
            return entity.ProviderConnectionString;
        }

        private static SqlParameter P(string name, object value)
        {
            return new SqlParameter(name, value ?? DBNull.Value);
        }

        private static decimal Redondear(decimal value)
        {
            return decimal.Round(value, 2, MidpointRounding.AwayFromZero);
        }

        private static string NormalizarCampoComprobante(string valor)
        {
            return string.IsNullOrWhiteSpace(valor) ? null : valor.Trim().ToUpperInvariant();
        }

        private static bool SoloDigitos(string valor)
        {
            return string.IsNullOrEmpty(valor) || valor.All(char.IsDigit);
        }

        private static DateTime FechaArgentina()
        {
            try
            {
                var zona = TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zona).Date;
            }
            catch (TimeZoneNotFoundException)
            {
                return DateTime.UtcNow.AddHours(-3).Date;
            }
        }

        private static string NumeroRecibo(int numero)
        {
            return "REC-" + numero.ToString("D8", CultureInfo.InvariantCulture);
        }

        private string ObtenerNombreUsuarioToken()
        {
            var authorization = Request != null ? Request.Headers.Authorization : null;
            if (authorization == null || !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(authorization.Parameter))
                throw new AccesoException(HttpStatusCode.Unauthorized, "Iniciá sesión para continuar.");

            try
            {
                var handler = new JwtSecurityTokenHandler();
                SecurityToken validatedToken;
                var principal = handler.ValidateToken(authorization.Parameter, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                    ValidateIssuer = true,
                    ValidIssuer = JwtConfig.Issuer,
                    ValidateAudience = true,
                    ValidAudience = JwtConfig.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                }, out validatedToken);
                var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
                if (claim == null || string.IsNullOrWhiteSpace(claim.Value))
                    throw new SecurityTokenException("La sesión no es válida. Volvé a iniciar sesión.");
                return claim.Value;
            }
            catch (Exception ex) when (!(ex is AccesoException))
            {
                throw new AccesoException(HttpStatusCode.Unauthorized, "Tu sesión venció. Volvé a iniciar sesión.");
            }
        }

        private UsuarioSesion ValidarAcceso(SqlConnection connection, SqlTransaction transaction, string permiso = "REC_EMITIR")
        {
            string nombreUsuario = ObtenerNombreUsuarioToken();
            const string sql = @"
SELECT TOP (1) u.Usuario_ID,
       CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(u.Rol,''))))='admin' OR EXISTS (
           SELECT 1 FROM dbo.GRUPOS_USUARIOS gu
           JOIN dbo.GRUPOS_PERMISOS gp ON gp.GrupoID=gu.GrupoID
           JOIN dbo.PERMISOS p ON p.Permiso_ID=gp.PermisoID
           WHERE gu.UsuarioID=u.Usuario_ID AND p.Codigo=@permiso) THEN 1 ELSE 0 END AS Autorizado
FROM dbo.USUARIOS u
WHERE u.Nombre_Usuario=@usuario AND u.EstadoUsuario='Activo';";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@usuario", nombreUsuario));
                command.Parameters.Add(P("@permiso", permiso));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read())
                        throw new AccesoException(HttpStatusCode.Unauthorized, "El usuario no existe o está inactivo.");
                    if (reader.GetInt32(1) != 1)
                        throw new AccesoException(HttpStatusCode.Forbidden, "No tenés permiso para hacer esta acción sobre recibos.");
                    return new UsuarioSesion { UsuarioID = reader.GetInt32(0), NombreUsuario = nombreUsuario };
                }
            }
        }

        private static ClienteRecibo LeerCliente(SqlConnection connection, SqlTransaction transaction, int clienteId)
        {
            const string sql = @"
SELECT c.Cliente_ID,c.Razon_Social,c.CUIT_Cliente,
       NULLIF(LTRIM(RTRIM(COALESCE(c.Calle,'')+' '+COALESCE(c.AlturaCalle,''))),'') AS Domicilio,
       CASE c.Cond_Fiscal
           WHEN 1 THEN N'Responsable Inscripto'
           WHEN 2 THEN N'Monotributista'
           WHEN 3 THEN N'Exento'
       END AS CondicionFiscal,CONVERT(bit,ISNULL(c.EstadoCliente,0)) AS EstadoCliente
FROM dbo.CLIENTES c WITH (UPDLOCK,HOLDLOCK)
WHERE c.Cliente_ID=@clienteId;";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@clienteId", clienteId));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) return null;
                    return new ClienteRecibo
                    {
                        ClienteID = (int)reader["Cliente_ID"],
                        RazonSocial = (string)reader["Razon_Social"],
                        CUIT = (string)reader["CUIT_Cliente"],
                        Domicilio = reader["Domicilio"] as string,
                        CondicionFiscal = reader["CondicionFiscal"] as string,
                        EstadoCliente = (bool)reader["EstadoCliente"]
                    };
                }
            }
        }

        private static DeudaRecibo LeerDeuda(SqlConnection connection, SqlTransaction transaction, int comprobanteId)
        {
            const string sql = @"
SELECT c.Comprobante_ID,c.ClienteID,c.Tipo,c.NumeroCorrelativo,c.Estado,c.Impacto,c.FechaEmision,c.Total,
       COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) AS Aplicado
FROM dbo.COMPROBANTES c WITH (UPDLOCK,HOLDLOCK)
LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a WITH (UPDLOCK,HOLDLOCK)
       ON a.ComprobanteDeudaID=c.Comprobante_ID
WHERE c.Comprobante_ID=@id
GROUP BY c.Comprobante_ID,c.ClienteID,c.Tipo,c.NumeroCorrelativo,c.Estado,c.Impacto,c.FechaEmision,c.Total;";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@id", comprobanteId));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) return null;
                    return new DeudaRecibo
                    {
                        ComprobanteID = (int)reader["Comprobante_ID"],
                        ClienteID = (int)reader["ClienteID"],
                        Tipo = (string)reader["Tipo"],
                        NumeroCorrelativo = (int)reader["NumeroCorrelativo"],
                        Estado = (string)reader["Estado"],
                        Impacto = (string)reader["Impacto"],
                        FechaEmision = (DateTime)reader["FechaEmision"],
                        Total = (decimal)reader["Total"],
                        Aplicado = (decimal)reader["Aplicado"]
                    };
                }
            }
        }

        private static ReciboExistente BuscarReciboPorClave(SqlConnection connection, SqlTransaction transaction, Guid clave)
        {
            const string sql = @"
SELECT TOP (1) Comprobante_ID,ClienteID,NumeroCorrelativo,FechaEmision,Letra,Sucursal,NumeroComprobante,Total,Observaciones
FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK)
WHERE ClaveOperacion=@clave AND Tipo='REC';";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@clave", clave));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) return null;
                    return new ReciboExistente
                    {
                        ComprobanteID = (int)reader["Comprobante_ID"],
                        ClienteID = (int)reader["ClienteID"],
                        NumeroCorrelativo = (int)reader["NumeroCorrelativo"],
                        FechaEmision = (DateTime)reader["FechaEmision"],
                        Letra = reader["Letra"] as string,
                        Sucursal = reader["Sucursal"] as string,
                        NumeroComprobante = reader["NumeroComprobante"] as string,
                        Total = (decimal)reader["Total"],
                        Observaciones = reader["Observaciones"] as string
                    };
                }
            }
        }

        private static bool CoincideReintento(SqlConnection connection, SqlTransaction transaction,
            ReciboExistente existente, EmitirReciboRequest request, string forma)
        {
            if (existente.ClienteID != request.ClienteID || existente.FechaEmision.Date != request.Fecha.Value.Date
                || existente.Total != request.Total
                || !string.Equals(existente.Letra ?? string.Empty, request.Letra ?? string.Empty, StringComparison.Ordinal)
                || !string.Equals(existente.Sucursal ?? string.Empty, request.Sucursal ?? string.Empty, StringComparison.Ordinal)
                || !string.Equals(existente.Observaciones ?? string.Empty, request.Observaciones ?? string.Empty, StringComparison.Ordinal))
                return false;

            using (var command = new SqlCommand(@"
SELECT Forma,Referencia,Importe FROM dbo.RECIBOS_FORMAS_PAGO
WHERE ComprobanteID=@id ORDER BY FormaPago_ID;", connection, transaction))
            {
                command.Parameters.Add(P("@id", existente.ComprobanteID));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) return false;
                    bool coincide = string.Equals((string)reader["Forma"], forma, StringComparison.Ordinal)
                        && string.Equals(reader["Referencia"] as string ?? string.Empty,
                            request.Referencia ?? string.Empty, StringComparison.Ordinal)
                        && (decimal)reader["Importe"] == request.ImporteFormaPago;
                    if (reader.Read()) coincide = false;
                    if (!coincide) return false;
                }
            }

            var guardadas = new Dictionary<int, decimal>();
            using (var command = new SqlCommand(@"
SELECT ComprobanteDeudaID,Importe FROM dbo.CUENTA_CORRIENTE_APLICACIONES
WHERE ComprobanteCreditoID=@id AND Vigente=1;", connection, transaction))
            {
                command.Parameters.Add(P("@id", existente.ComprobanteID));
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read()) guardadas.Add((int)reader[0], (decimal)reader[1]);
                }
            }
            return guardadas.Count == request.Aplicaciones.Count
                && request.Aplicaciones.All(x => guardadas.ContainsKey(x.ComprobanteID)
                    && guardadas[x.ComprobanteID] == x.Importe);
        }

        [HttpPost]
        [Route("recibos")]
        public IHttpActionResult Emitir([FromBody] EmitirReciboRequest request)
        {
            if (request == null) return BadRequest("Faltan los datos del recibo.");
            if (request.ClaveOperacion == Guid.Empty) return BadRequest("Falta la clave de la operación. Cerrá el formulario y volvé a abrirlo.");
            if (request.ClienteID <= 0) return BadRequest("Seleccioná un cliente.");
            if (!request.Fecha.HasValue) return BadRequest("Completá la fecha del recibo.");
            DateTime fecha = request.Fecha.Value.Date;
            if (fecha > FechaArgentina()) return BadRequest("La fecha del recibo no puede ser futura.");
            if (request.Total <= 0 || request.Total != Redondear(request.Total))
                return BadRequest("El total debe ser mayor que cero y tener hasta dos decimales.");
            if (request.ImporteFormaPago != request.Total)
                return BadRequest("El importe de la forma de pago tiene que coincidir con el total del recibo.");
            if (request.Aplicaciones == null)
                request.Aplicaciones = new List<AplicacionReciboRequest>();
            if (request.Aplicaciones.Count > 200)
                return BadRequest("El recibo supera la cantidad máxima de comprobantes que se le pueden aplicar.");
            if (request.Aplicaciones.Any(x => x.ComprobanteID <= 0 || x.Importe <= 0 || x.Importe != Redondear(x.Importe)))
                return BadRequest("Las aplicaciones deben tener importes positivos con hasta dos decimales.");
            if (request.Aplicaciones.GroupBy(x => x.ComprobanteID).Any(x => x.Count() > 1))
                return BadRequest("No se puede aplicar dos veces el mismo comprobante.");
            if (request.Aplicaciones.Sum(x => x.Importe) > request.Total)
                return BadRequest("La suma aplicada no puede superar el total del recibo.");
            request.Letra = NormalizarCampoComprobante(request.Letra);
            request.Sucursal = NormalizarCampoComprobante(request.Sucursal);
            if ((request.Letra ?? string.Empty).Length > 1) return BadRequest("La letra no puede superar un carácter.");
            if ((request.Sucursal ?? string.Empty).Length > 4) return BadRequest("La sucursal no puede superar cuatro caracteres.");
            if (!SoloDigitos(request.Sucursal)) return BadRequest("La sucursal solo puede contener números.");
            if ((request.Referencia ?? string.Empty).Length > 120)
                return BadRequest("La referencia no puede superar los 120 caracteres.");
            if ((request.Observaciones ?? string.Empty).Length > 2000)
                return BadRequest("Las observaciones no pueden superar los 2000 caracteres.");

            string forma = (request.FormaPago ?? string.Empty).Trim().ToUpperInvariant();
            if (!new[] { "EFECTIVO", "TRANSFERENCIA", "CHEQUE", "OTRO" }.Contains(forma))
                return BadRequest("La forma de pago no es válida.");
            if ((forma == "TRANSFERENCIA" || forma == "CHEQUE") && string.IsNullOrWhiteSpace(request.Referencia))
                return BadRequest("La referencia es obligatoria para transferencias y cheques.");
            request.Referencia = string.IsNullOrWhiteSpace(request.Referencia) ? null : request.Referencia.Trim();
            request.Observaciones = string.IsNullOrWhiteSpace(request.Observaciones) ? null : request.Observaciones.Trim();

            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    using (var transaction = connection.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            var usuario = ValidarAcceso(connection, transaction);
                            var configuracion = FacturacionComprobantesConfiguracion.Obtener(connection, transaction, "REC");
                            var letra = request.Letra;
                            var sucursal = request.Sucursal;
                            FacturacionComprobantesConfiguracion.ValidarDatos(connection, transaction, ref letra, ref sucursal, configuracion);
                            request.Letra = letra;
                            request.Sucursal = sucursal;
                            var existente = BuscarReciboPorClave(connection, transaction, request.ClaveOperacion);
                            if (existente != null)
                            {
                                if (!CoincideReintento(connection, transaction, existente, request, forma))
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.Conflict,
                                        new { error = "Esta operación ya se registró con otros datos. Cerrá el formulario y volvé a abrirlo." });
                                }
                                transaction.Commit();
                                return Ok(new
                                {
                                    existente.ComprobanteID,
                                    existente.ClienteID,
                                    Numero = NumeroRecibo(existente.NumeroCorrelativo),
                                    existente.Total,
                                    Estado = "EMITIDO",
                                    Reintento = true
                                });
                            }

                            var cliente = LeerCliente(connection, transaction, request.ClienteID);
                            if (cliente == null)
                            {
                                transaction.Rollback();
                                return NotFound();
                            }
                            if (!cliente.EstadoCliente)
                            {
                                transaction.Rollback();
                                return Content(HttpStatusCode.BadRequest, new { error = "El cliente está inactivo." });
                            }

                            foreach (var aplicacion in request.Aplicaciones.OrderBy(x => x.ComprobanteID))
                            {
                                var deuda = LeerDeuda(connection, transaction, aplicacion.ComprobanteID);
                                if (deuda == null || deuda.ClienteID != request.ClienteID)
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.BadRequest,
                                        new { error = "Uno de los comprobantes no pertenece al cliente." });
                                }
                                if (deuda.Estado != "EMITIDO" || deuda.Impacto != "D" || deuda.Tipo != "FAC")
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.BadRequest,
                                        new { error = "Los recibos solo se pueden aplicar a facturas emitidas." });
                                }
                                if (fecha < deuda.FechaEmision.Date)
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.BadRequest,
                                        new { error = "La fecha del recibo no puede ser anterior al comprobante aplicado." });
                                }
                                if (aplicacion.Importe > deuda.Pendiente)
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.Conflict, new
                                    {
                                        error = "El importe aplicado supera el saldo pendiente de "
                                            + deuda.Tipo + "-" + deuda.NumeroCorrelativo.ToString("D8", CultureInfo.InvariantCulture) + "."
                                    });
                                }
                            }

                            int correlativo;
                            using (var command = new SqlCommand(@"
UPDATE dbo.FACTURACION_NUMERADORES WITH (UPDLOCK,HOLDLOCK)
SET UltimoNumero=UltimoNumero+1 OUTPUT INSERTED.UltimoNumero
WHERE Numerador_ID=@numerador AND Activo=1 AND UltimoNumero<99999999;", connection, transaction))
                            {
                                command.Parameters.Add(P("@numerador", configuracion.NumeradorID));
                                object value = command.ExecuteScalar();
                                if (value == null)
                                    throw new InvalidOperationException("El numerador de recibos no existe o está agotado.");
                                correlativo = Convert.ToInt32(value, CultureInfo.InvariantCulture);
                            }

                            int comprobanteId;
                            string concepto = request.Aplicaciones.Count == 0 ? "Cobranza sin imputaciÃ³n"
                                : request.Aplicaciones.Count == 1 ? "Cobranza de 1 comprobante"
                                : "Cobranza de " + request.Aplicaciones.Count + " comprobantes";
                            using (var command = new SqlCommand(@"
INSERT dbo.COMPROBANTES
 (ClienteID,Tipo,Impacto,NumeroCorrelativo,FechaEmision,FechaVencimiento,Moneda,Estado,
  RazonSocial,CUIT,Domicilio,CondicionFiscal,CondicionComercial,Letra,Sucursal,NumeroComprobante,Subtotal,Descuentos,Neto,IVA,
  OtrosImpuestos,Total,Concepto,Observaciones,ClaveOperacion,UsuarioAltaID,UsuarioEmisionID,FechaEmisionRegistro)
OUTPUT INSERTED.Comprobante_ID
VALUES
 (@cliente,'REC','C',@numero,@fecha,NULL,'ARS','EMITIDO',@razon,@cuit,@domicilio,
  @condFiscal,NULL,@letra,@sucursal,@numeroComprobante,@total,0,@total,0,0,@total,@concepto,@observaciones,@clave,@usuario,@usuario,SYSUTCDATETIME());",
                                connection, transaction))
                            {
                                command.Parameters.AddRange(new[]
                                {
                                    P("@cliente", request.ClienteID),P("@numero", correlativo),P("@fecha", fecha),
                                    P("@razon", cliente.RazonSocial),P("@cuit", cliente.CUIT),P("@domicilio", cliente.Domicilio),
                                    P("@condFiscal", cliente.CondicionFiscal),P("@letra", request.Letra),P("@sucursal", request.Sucursal),
                                    P("@numeroComprobante", FacturacionComprobantesConfiguracion.NumeroVisible(correlativo)),P("@total", request.Total),P("@concepto", concepto),
                                    P("@observaciones", request.Observaciones),P("@clave", request.ClaveOperacion),P("@usuario", usuario.UsuarioID)
                                });
                                comprobanteId = Convert.ToInt32(command.ExecuteScalar(), CultureInfo.InvariantCulture);
                            }

                            using (var command = new SqlCommand(@"
INSERT dbo.RECIBOS_FORMAS_PAGO
 (ComprobanteID,ClienteID,TipoRecibo,Forma,Referencia,Banco,FechaOperacion,FechaPago,Importe)
VALUES (@comprobante,@cliente,'REC',@forma,@referencia,NULL,@fecha,@fecha,@importe);

INSERT dbo.CUENTA_CORRIENTE_MOVIMIENTOS
 (ComprobanteID,ClienteID,Tipo,Clase,Impacto,Importe,FechaContable,Concepto,UsuarioAltaID)
VALUES (@comprobante,@cliente,'REC','EMISION','C',@importe,@fecha,@concepto,@usuario);",
                                connection, transaction))
                            {
                                command.Parameters.AddRange(new[]
                                {
                                    P("@comprobante", comprobanteId),P("@cliente", request.ClienteID),P("@forma", forma),
                                    P("@referencia", request.Referencia),P("@fecha", fecha),P("@importe", request.Total),
                                    P("@concepto", concepto),P("@usuario", usuario.UsuarioID)
                                });
                                command.ExecuteNonQuery();
                            }

                            foreach (var aplicacion in request.Aplicaciones)
                            {
                                using (var command = new SqlCommand(@"
INSERT dbo.CUENTA_CORRIENTE_APLICACIONES
 (ClienteID,ComprobanteCreditoID,ImpactoCredito,ComprobanteDeudaID,ImpactoDeuda,Importe,
  FechaAplicacion,Vigente,UsuarioAltaID)
VALUES (@cliente,@recibo,'C',@deuda,'D',@importe,@fecha,1,@usuario);", connection, transaction))
                                {
                                    command.Parameters.AddRange(new[]
                                    {
                                        P("@cliente", request.ClienteID),P("@recibo", comprobanteId),
                                        P("@deuda", aplicacion.ComprobanteID),P("@importe", aplicacion.Importe),
                                        P("@fecha", fecha),P("@usuario", usuario.UsuarioID)
                                    });
                                    command.ExecuteNonQuery();
                                }
                            }

                            using (var command = new SqlCommand(@"
INSERT dbo.AUDITORIA
 (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen)
VALUES
 (GETDATE(),@nombreUsuario,'EMITIR','COMPROBANTES',@claveAuditoria,NULL,@detalleAuditoria,'Cuenta Corriente');",
                                connection, transaction))
                            {
                                command.Parameters.AddRange(new[]
                                {
                                    P("@nombreUsuario", usuario.NombreUsuario),P("@claveAuditoria", "Comprobante_ID=" + comprobanteId),
                                    P("@detalleAuditoria", "Recibo " + NumeroRecibo(correlativo) + " por "
                                        + request.Total.ToString("0.00", CultureInfo.InvariantCulture))
                                });
                                command.ExecuteNonQuery();
                            }

                            transaction.Commit();
                            return Content(HttpStatusCode.Created, new
                            {
                                ComprobanteID = comprobanteId,
                                ClienteID = request.ClienteID,
                                Numero = NumeroRecibo(correlativo),
                                Tipo = "REC",
                                Estado = "EMITIDO",
                                Fecha = fecha,
                                Total = request.Total,
                                Moneda = "ARS",
                                Aplicaciones = request.Aplicaciones.Count
                            });
                        }
                        catch
                        {
                            if (transaction.Connection != null) transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (AccesoException ex)
            {
                return Content(ex.StatusCode, new { error = ex.Message });
            }
            catch (SqlException ex) when (ex.Number == 2601 || ex.Number == 2627)
            {
                return Content(HttpStatusCode.Conflict,
                    new { error = "El recibo ya fue creado o la operación se procesó en paralelo." });
            }
            catch (InvalidOperationException ex)
            {
                return Content(HttpStatusCode.Conflict, new { error = ex.Message });
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudo emitir el recibo. No se guardó ningún cambio." });
            }
        }

        [HttpGet]
        [Route("recibos/{id:int}")]
        public IHttpActionResult Obtener(int id)
        {
            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    using (var transaction = connection.BeginTransaction(IsolationLevel.ReadCommitted))
                    {
                        var usuario = ValidarAcceso(connection, transaction, "REC_EMITIR");
                        int clienteId;
                        int numero;
                        string estado;
                        DateTime fecha;
                        string letra;
                        string sucursal;
                        string numeroComprobante;
                        decimal total;
                        string observaciones;
                        string razonSocial;
                        string cuit;
                        string forma;
                        string referencia;

                        using (var command = new SqlCommand(@"
SELECT c.ClienteID,c.NumeroCorrelativo,c.Estado,c.FechaEmision,c.Letra,c.Sucursal,c.NumeroComprobante,c.Total,c.Observaciones,
       c.RazonSocial,c.CUIT,p.Forma,p.Referencia
FROM dbo.COMPROBANTES c
OUTER APPLY (SELECT TOP (1) Forma,Referencia FROM dbo.RECIBOS_FORMAS_PAGO WHERE ComprobanteID=c.Comprobante_ID ORDER BY FormaPago_ID) p
WHERE c.Comprobante_ID=@id AND c.Tipo='REC';", connection, transaction))
                        {
                            command.Parameters.Add(P("@id", id));
                            using (var reader = command.ExecuteReader())
                            {
                                if (!reader.Read())
                                {
                                    transaction.Rollback();
                                    return NotFound();
                                }
                                clienteId = (int)reader["ClienteID"];
                                numero = (int)reader["NumeroCorrelativo"];
                                estado = (string)reader["Estado"];
                                fecha = (DateTime)reader["FechaEmision"];
                                letra = reader["Letra"] as string;
                                sucursal = reader["Sucursal"] as string;
                                numeroComprobante = reader["NumeroComprobante"] as string;
                                total = (decimal)reader["Total"];
                                observaciones = reader["Observaciones"] as string;
                                razonSocial = reader["RazonSocial"] as string;
                                cuit = reader["CUIT"] as string;
                                forma = reader["Forma"] as string;
                                referencia = reader["Referencia"] as string;
                            }
                        }

                        var aplicaciones = new List<object>();
                        using (var command = new SqlCommand(@"
SELECT a.ComprobanteDeudaID, d.Tipo+'-'+RIGHT(REPLICATE('0',8)+CONVERT(varchar(8),d.NumeroCorrelativo),8) AS Comprobante,
       d.FechaVencimiento,d.Total AS ImporteOriginal,a.Importe
FROM dbo.CUENTA_CORRIENTE_APLICACIONES a
JOIN dbo.COMPROBANTES d ON d.Comprobante_ID=a.ComprobanteDeudaID
WHERE a.ComprobanteCreditoID=@id AND a.Vigente=1
ORDER BY d.FechaEmision,d.Comprobante_ID;", connection, transaction))
                        {
                            command.Parameters.Add(P("@id", id));
                            using (var reader = command.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    aplicaciones.Add(new
                                    {
                                        ComprobanteID = (int)reader["ComprobanteDeudaID"],
                                        Comprobante = (string)reader["Comprobante"],
                                        FechaVencimiento = reader.IsDBNull(reader.GetOrdinal("FechaVencimiento"))
                                            ? (DateTime?)null : (DateTime)reader["FechaVencimiento"],
                                        ImporteOriginal = (decimal)reader["ImporteOriginal"],
                                        Importe = (decimal)reader["Importe"]
                                    });
                                }
                            }
                        }
                        transaction.Commit();
                        return Ok(new
                        {
                            ComprobanteID = id,
                            ClienteID = clienteId,
                            Numero = NumeroRecibo(numero),
                            Estado = estado,
                            Fecha = fecha,
                            Letra = letra,
                            Sucursal = sucursal,
                            NumeroComprobante = numeroComprobante,
                            Total = total,
                            RazonSocial = razonSocial,
                            CUIT = cuit,
                            FormaPago = forma,
                            Referencia = referencia,
                            Observaciones = observaciones,
                            Aplicaciones = aplicaciones
                        });
                    }
                }
            }
            catch (AccesoException ex) { return Content(ex.StatusCode, new { error = ex.Message }); }
            catch (Exception) { return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo obtener el recibo." }); }
        }

        [HttpPut]
        [Route("recibos/{id:int}")]
        public IHttpActionResult Editar(int id, [FromBody] EditarReciboRequest request)
        {
            if (request == null || !request.Fecha.HasValue) return BadRequest("Completá la fecha del recibo.");
            DateTime fecha = request.Fecha.Value.Date;
            if (fecha > FechaArgentina()) return BadRequest("La fecha del recibo no puede ser futura.");
            request.Letra = NormalizarCampoComprobante(request.Letra);
            request.Sucursal = NormalizarCampoComprobante(request.Sucursal);
            if ((request.Letra ?? string.Empty).Length > 1) return BadRequest("La letra no puede superar un carácter.");
            if ((request.Sucursal ?? string.Empty).Length > 4) return BadRequest("La sucursal no puede superar cuatro caracteres.");
            if (!SoloDigitos(request.Sucursal)) return BadRequest("La sucursal solo puede contener números.");
            if ((request.Referencia ?? string.Empty).Length > 120) return BadRequest("La referencia no puede superar los 120 caracteres.");
            if ((request.Observaciones ?? string.Empty).Length > 2000) return BadRequest("Las observaciones no pueden superar los 2000 caracteres.");
            string forma = (request.FormaPago ?? string.Empty).Trim().ToUpperInvariant();
            if (!new[] { "EFECTIVO", "TRANSFERENCIA", "CHEQUE", "OTRO" }.Contains(forma)) return BadRequest("La forma de pago no es válida.");
            if ((forma == "TRANSFERENCIA" || forma == "CHEQUE") && string.IsNullOrWhiteSpace(request.Referencia))
                return BadRequest("La referencia es obligatoria para transferencias y cheques.");

            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    using (var transaction = connection.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            var usuario = ValidarAcceso(connection, transaction, "REC_EMITIR");
                            var configuracion = FacturacionComprobantesConfiguracion.Obtener(connection, transaction, "REC");
                            var letra = request.Letra;
                            var sucursal = request.Sucursal;
                            FacturacionComprobantesConfiguracion.ValidarDatos(connection, transaction, ref letra, ref sucursal, configuracion);
                            request.Letra = letra;
                            request.Sucursal = sucursal;
                            int clienteId;
                            int numero;
                            string estado;
                            using (var command = new SqlCommand(@"
SELECT ClienteID,NumeroCorrelativo,Estado FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK)
WHERE Comprobante_ID=@id AND Tipo='REC';", connection, transaction))
                            {
                                command.Parameters.Add(P("@id", id));
                                using (var reader = command.ExecuteReader())
                                {
                                    if (!reader.Read()) { transaction.Rollback(); return NotFound(); }
                                    clienteId = (int)reader["ClienteID"];
                                    numero = (int)reader["NumeroCorrelativo"];
                                    estado = (string)reader["Estado"];
                                }
                            }
                            if (estado != "EMITIDO") { transaction.Rollback(); return Content(HttpStatusCode.Conflict, new { error = "Solo se pueden editar recibos emitidos." }); }

                            using (var command = new SqlCommand(@"
SELECT MAX(d.FechaEmision)
FROM dbo.CUENTA_CORRIENTE_APLICACIONES a WITH (UPDLOCK,HOLDLOCK)
JOIN dbo.COMPROBANTES d ON d.Comprobante_ID=a.ComprobanteDeudaID
WHERE a.ComprobanteCreditoID=@id AND a.Vigente=1;", connection, transaction))
                            {
                                command.Parameters.Add(P("@id", id));
                                object fechaMinima = command.ExecuteScalar();
                                if (fechaMinima != null && fechaMinima != DBNull.Value && fecha < Convert.ToDateTime(fechaMinima).Date)
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.BadRequest, new { error = "La fecha del recibo no puede ser anterior a los comprobantes aplicados." });
                                }
                            }

                            string referencia = string.IsNullOrWhiteSpace(request.Referencia) ? null : request.Referencia.Trim();
                            string observaciones = string.IsNullOrWhiteSpace(request.Observaciones) ? null : request.Observaciones.Trim();
                            using (var command = new SqlCommand(@"
UPDATE dbo.COMPROBANTES SET FechaEmision=@fecha,Letra=@letra,Sucursal=@sucursal,Observaciones=@observaciones,
       UsuarioModificacionID=@usuario,FechaModificacion=SYSUTCDATETIME()
WHERE Comprobante_ID=@id;
UPDATE dbo.RECIBOS_FORMAS_PAGO SET Forma=@forma,Referencia=@referencia,FechaOperacion=@fecha,FechaPago=@fecha
WHERE ComprobanteID=@id;
UPDATE dbo.CUENTA_CORRIENTE_MOVIMIENTOS SET FechaContable=@fecha
WHERE ComprobanteID=@id AND Clase='EMISION';
UPDATE dbo.CUENTA_CORRIENTE_APLICACIONES SET FechaAplicacion=@fecha
WHERE ComprobanteCreditoID=@id AND Vigente=1;
INSERT dbo.AUDITORIA (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen)
VALUES (GETDATE(),@nombre,'EDITAR','COMPROBANTES',@clave,NULL,@detalle,'Cuenta Corriente');", connection, transaction))
                            {
                                command.Parameters.AddRange(new[]
                                {
                                    P("@fecha", fecha), P("@letra", request.Letra), P("@sucursal", request.Sucursal),
                                    P("@observaciones", observaciones), P("@usuario", usuario.UsuarioID),
                                    P("@forma", forma), P("@referencia", referencia), P("@id", id),
                                    P("@nombre", usuario.NombreUsuario), P("@clave", "Comprobante_ID=" + id),
                                    P("@detalle", "Recibo " + NumeroRecibo(numero) + " editado")
                                });
                                command.ExecuteNonQuery();
                            }
                            transaction.Commit();
                            return Ok(new { ComprobanteID = id, Numero = NumeroRecibo(numero), Fecha = fecha, Estado = "EMITIDO", ClienteID = clienteId });
                        }
                        catch { if (transaction.Connection != null) transaction.Rollback(); throw; }
                    }
                }
            }
            catch (AccesoException ex) { return Content(ex.StatusCode, new { error = ex.Message }); }
            catch (Exception) { return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo editar el recibo. No se guardó ningún cambio." }); }
        }

        [HttpPost]
        [Route("recibos/{id:int}/anular")]
        public IHttpActionResult Anular(int id, [FromBody] AnularReciboRequest request)
        {
            string motivo = request == null ? null : (request.Motivo ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(motivo)) return BadRequest("El motivo de anulación es obligatorio.");
            if (motivo.Length > 500) return BadRequest("El motivo de anulación no puede superar los 500 caracteres.");
            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    using (var transaction = connection.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            var usuario = ValidarAcceso(connection, transaction, "REC_ANULAR");
                            int clienteId;
                            int numero;
                            decimal total;
                            string estado;
                            using (var command = new SqlCommand(@"
SELECT ClienteID,NumeroCorrelativo,Total,Estado FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK)
WHERE Comprobante_ID=@id AND Tipo='REC';", connection, transaction))
                            {
                                command.Parameters.Add(P("@id", id));
                                using (var reader = command.ExecuteReader())
                                {
                                    if (!reader.Read()) { transaction.Rollback(); return NotFound(); }
                                    clienteId = (int)reader["ClienteID"];
                                    numero = (int)reader["NumeroCorrelativo"];
                                    total = (decimal)reader["Total"];
                                    estado = (string)reader["Estado"];
                                }
                            }
                            if (estado != "EMITIDO") { transaction.Rollback(); return Content(HttpStatusCode.Conflict, new { error = "Solo se pueden anular recibos emitidos." }); }
                            int movimientoOriginal;
                            using (var command = new SqlCommand(@"
SELECT Movimiento_ID FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS WITH (UPDLOCK,HOLDLOCK)
WHERE ComprobanteID=@id AND Clase='EMISION';", connection, transaction))
                            {
                                command.Parameters.Add(P("@id", id));
                                object valor = command.ExecuteScalar();
                                if (valor == null) throw new InvalidOperationException("El recibo no tiene movimiento en la cuenta corriente.");
                                movimientoOriginal = Convert.ToInt32(valor, CultureInfo.InvariantCulture);
                            }
                            DateTime fechaAnulacion = FechaArgentina();
                            using (var command = new SqlCommand(@"
UPDATE dbo.CUENTA_CORRIENTE_APLICACIONES SET Vigente=0,UsuarioAnulacionID=@usuario,
       FechaAnulacion=SYSUTCDATETIME(),MotivoAnulacion=@motivo
WHERE ComprobanteCreditoID=@id AND Vigente=1;
INSERT dbo.CUENTA_CORRIENTE_MOVIMIENTOS
 (ComprobanteID,ClienteID,Tipo,Clase,Impacto,Importe,FechaContable,Concepto,MovimientoOriginalID,UsuarioAltaID)
VALUES (@id,@cliente,'REC','REVERSO','D',@total,@fecha,@concepto,@movimiento,@usuario);
UPDATE dbo.COMPROBANTES SET Estado='ANULADO',UsuarioAnulacionID=@usuario,
       FechaAnulacion=SYSUTCDATETIME(),MotivoAnulacion=@motivo WHERE Comprobante_ID=@id;
INSERT dbo.AUDITORIA (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen)
VALUES (GETDATE(),@nombre,'ANULAR','COMPROBANTES',@clave,NULL,@detalle,'Cuenta Corriente');", connection, transaction))
                            {
                                command.Parameters.AddRange(new[]
                                {
                                    P("@usuario", usuario.UsuarioID),P("@motivo", motivo),P("@id", id),P("@cliente", clienteId),
                                    P("@total", total),P("@fecha", fechaAnulacion),P("@concepto", "Anulación de " + NumeroRecibo(numero)),
                                    P("@movimiento", movimientoOriginal),P("@nombre", usuario.NombreUsuario),
                                    P("@clave", "Comprobante_ID=" + id),P("@detalle", "Recibo " + NumeroRecibo(numero) + " anulado: " + motivo)
                                });
                                command.ExecuteNonQuery();
                            }
                            transaction.Commit();
                            return Ok(new { ComprobanteID = id, Numero = NumeroRecibo(numero), Estado = "ANULADO" });
                        }
                        catch { if (transaction.Connection != null) transaction.Rollback(); throw; }
                    }
                }
            }
            catch (AccesoException ex) { return Content(ex.StatusCode, new { error = ex.Message }); }
            catch (InvalidOperationException ex) { return Content(HttpStatusCode.Conflict, new { error = ex.Message }); }
            catch (Exception) { return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo anular el recibo. No se guardó ningún cambio." }); }
        }

        [HttpDelete]
        [Route("recibos/{id:int}")]
        public IHttpActionResult Eliminar(int id)
        {
            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    using (var transaction = connection.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            var usuario = ValidarAcceso(connection, transaction, "REC_ANULAR");
                            int numero;
                            string tipo;
                            string estado;
                            using (var command = new SqlCommand(@"
SELECT Tipo,NumeroCorrelativo,Estado FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK)
WHERE Comprobante_ID=@id;", connection, transaction))
                            {
                                command.Parameters.Add(P("@id", id));
                                using (var reader = command.ExecuteReader())
                                {
                                    if (!reader.Read()) { transaction.Rollback(); return NotFound(); }
                                    tipo = (string)reader["Tipo"];
                                    numero = (int)reader["NumeroCorrelativo"];
                                    estado = (string)reader["Estado"];
                                }
                            }
                            if (tipo != "REC") { transaction.Rollback(); return Content(HttpStatusCode.BadRequest, new { error = "Solo se pueden eliminar recibos. Las facturas y las notas de crédito y débito no se eliminan." }); }
                            if (estado != "ANULADO") { transaction.Rollback(); return Content(HttpStatusCode.Conflict, new { error = "Solo se pueden eliminar recibos anulados." }); }
                            using (var command = new SqlCommand(@"
DELETE FROM dbo.RECIBOS_FORMAS_PAGO WHERE ComprobanteID=@id;
DELETE FROM dbo.CUENTA_CORRIENTE_APLICACIONES WHERE ComprobanteCreditoID=@id;
DELETE FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS WHERE ComprobanteID=@id AND Clase='REVERSO';
DELETE FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS WHERE ComprobanteID=@id AND Clase='EMISION';
DELETE FROM dbo.COMPROBANTES_DETALLE WHERE ComprobanteID=@id;
DELETE FROM dbo.COMPROBANTES WHERE Comprobante_ID=@id;
INSERT dbo.AUDITORIA (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen)
VALUES (GETDATE(),@nombre,'ELIMINAR','COMPROBANTES',@clave,NULL,@detalle,'Cuenta Corriente');", connection, transaction))
                            {
                                command.Parameters.AddRange(new[]
                                {
                                    P("@id", id),P("@nombre", usuario.NombreUsuario),P("@clave", "Comprobante_ID=" + id),
                                    P("@detalle", "Recibo " + NumeroRecibo(numero) + " eliminado luego de su anulación")
                                });
                                command.ExecuteNonQuery();
                            }
                            transaction.Commit();
                            return Ok(new { ComprobanteID = id, Numero = NumeroRecibo(numero), Eliminado = true });
                        }
                        catch { if (transaction.Connection != null) transaction.Rollback(); throw; }
                    }
                }
            }
            catch (AccesoException ex) { return Content(ex.StatusCode, new { error = ex.Message }); }
            catch (Exception) { return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo eliminar el recibo. No se guardó ningún cambio." }); }
        }
    }
}
