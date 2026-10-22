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
    public class ComprobantesController : ApiController
    {
        public class EmitirComprobanteRequest
        {
            public Guid ClaveOperacion { get; set; }
            public int ClienteID { get; set; }
            public string Tipo { get; set; }
            public string Letra { get; set; }
            public string Sucursal { get; set; }
            public DateTime? FechaEmision { get; set; }
            public DateTime? FechaVencimiento { get; set; }
            public int? ComprobanteReferenciaID { get; set; }
            // Cuando se informa, la NC solo puede cancelar la Factura vigente de esta Proforma.
            public int? ProformaID { get; set; }
            public string Concepto { get; set; }
            public decimal Neto { get; set; }
            public decimal IvaPct { get; set; }
            public decimal? IVA { get; set; }
            public decimal OtrosImpuestos { get; set; }
            public string Observaciones { get; set; }
            public List<AplicacionComprobanteRequest> Aplicaciones { get; set; }
        }

        public class AplicacionComprobanteRequest
        {
            public int ComprobanteID { get; set; }
            public decimal Importe { get; set; }
        }

        public class FacturaReferenciaDto
        {
            public int ComprobanteID { get; set; }
            public string Numero { get; set; }
            public DateTime FechaEmision { get; set; }
            public DateTime? FechaVencimiento { get; set; }
            public decimal Total { get; set; }
            public decimal ImporteAplicado { get; set; }
            public decimal SaldoPendiente { get; set; }
            public decimal NetoPendiente { get; set; }
            public decimal IVAPendiente { get; set; }
            public decimal OtrosImpuestosPendiente { get; set; }
            public decimal IvaPct { get; set; }
        }

        private class UsuarioSesion
        {
            public int UsuarioID { get; set; }
            public string NombreUsuario { get; set; }
        }

        private class ClienteComprobante
        {
            public int ClienteID { get; set; }
            public string RazonSocial { get; set; }
            public string CUIT { get; set; }
            public string Domicilio { get; set; }
            public string CondicionFiscal { get; set; }
            public bool EstadoCliente { get; set; }
        }

        private class FacturaReferencia
        {
            public int ComprobanteID { get; set; }
            public int ClienteID { get; set; }
            public int NumeroCorrelativo { get; set; }
            public DateTime FechaEmision { get; set; }
            public DateTime? FechaVencimiento { get; set; }
            public string Estado { get; set; }
            public decimal Neto { get; set; }
            public decimal IVA { get; set; }
            public decimal OtrosImpuestos { get; set; }
            public decimal Total { get; set; }
            public decimal Aplicado { get; set; }
            public decimal Pendiente { get { return Total - Aplicado; } }
        }

        private class AplicacionNotaCredito
        {
            public FacturaReferencia Factura { get; set; }
            public decimal Importe { get; set; }
            public decimal Neto { get; set; }
            public decimal IVA { get; set; }
            public decimal OtrosImpuestos { get; set; }
        }

        private class FacturaCancelatoriaProforma
        {
            public int ProformaID { get; set; }
            public string ProformaNumero { get; set; }
            public int FacturaID { get; set; }
            public int ClienteID { get; set; }
            public int NumeroCorrelativo { get; set; }
            public DateTime FechaFactura { get; set; }
            public string EstadoFactura { get; set; }
            public string Cliente { get; set; }
            public string CUIT { get; set; }
            public decimal Neto { get; set; }
            public decimal IVA { get; set; }
            public decimal OtrosImpuestos { get; set; }
            public decimal Total { get; set; }
            public decimal Aplicado { get; set; }
        }

        private class ComprobanteExistente
        {
            public int ComprobanteID { get; set; }
            public int ClienteID { get; set; }
            public string Tipo { get; set; }
            public int NumeroCorrelativo { get; set; }
            public DateTime FechaEmision { get; set; }
            public DateTime? FechaVencimiento { get; set; }
            public string Letra { get; set; }
            public string Sucursal { get; set; }
            public int? ReferenciaID { get; set; }
            public string Concepto { get; set; }
            public string Observaciones { get; set; }
            public decimal Neto { get; set; }
            public decimal IVA { get; set; }
            public decimal OtrosImpuestos { get; set; }
            public decimal Total { get; set; }
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

        private static void CalcularComposicionPendiente(FacturaReferencia factura,
            out decimal neto, out decimal iva, out decimal otros)
        {
            if (factura.Pendiente <= 0 || factura.Total <= 0)
            {
                neto = 0;
                iva = 0;
                otros = 0;
                return;
            }
            if (factura.Pendiente == factura.Total)
            {
                neto = factura.Neto;
                iva = factura.IVA;
                otros = factura.OtrosImpuestos;
                return;
            }

            decimal proporcion = factura.Pendiente / factura.Total;
            neto = Redondear(factura.Neto * proporcion);
            otros = Redondear(factura.OtrosImpuestos * proporcion);
            iva = factura.Pendiente - neto - otros;
            if (iva < 0)
            {
                neto += iva;
                iva = 0;
            }
        }

        private static void CalcularComposicionAplicacion(FacturaReferencia factura, decimal importe,
            out decimal neto, out decimal iva, out decimal otros)
        {
            decimal netoPendiente;
            decimal ivaPendiente;
            decimal otrosPendientes;
            CalcularComposicionPendiente(factura, out netoPendiente, out ivaPendiente, out otrosPendientes);
            if (importe <= 0 || factura.Pendiente <= 0)
            {
                neto = 0;
                iva = 0;
                otros = 0;
                return;
            }
            if (importe == factura.Pendiente)
            {
                neto = netoPendiente;
                iva = ivaPendiente;
                otros = otrosPendientes;
                return;
            }

            decimal proporcion = importe / factura.Pendiente;
            neto = Math.Min(importe, Redondear(netoPendiente * proporcion));
            otros = Math.Min(importe - neto, Redondear(otrosPendientes * proporcion));
            iva = importe - neto - otros;
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

        private static string Numero(string tipo, int numero)
        {
            return tipo + "-" + numero.ToString("D8", CultureInfo.InvariantCulture);
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

        private UsuarioSesion ValidarAcceso(SqlConnection connection, SqlTransaction transaction, string permiso)
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
                        throw new AccesoException(HttpStatusCode.Forbidden, "No tenés permiso para emitir este comprobante.");
                    return new UsuarioSesion { UsuarioID = reader.GetInt32(0), NombreUsuario = nombreUsuario };
                }
            }
        }

        private static ClienteComprobante LeerCliente(SqlConnection connection, SqlTransaction transaction, int clienteId)
        {
            const string sql = @"
SELECT c.Cliente_ID,c.Razon_Social,c.CUIT_Cliente,
       NULLIF(LTRIM(RTRIM(COALESCE(c.Calle,'')+' '+COALESCE(c.AlturaCalle,''))),'') AS Domicilio,
       CASE c.Cond_Fiscal
           WHEN 1 THEN N'Responsable Inscripto'
           WHEN 2 THEN N'Monotributista'
           WHEN 3 THEN N'Exento'
       END AS CondicionFiscal,CONVERT(bit,ISNULL(c.EstadoCliente,0)) AS EstadoCliente
FROM dbo.CLIENTES c WITH (UPDLOCK,HOLDLOCK) WHERE c.Cliente_ID=@id;";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@id", clienteId));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) return null;
                    return new ClienteComprobante
                    {
                        ClienteID = (int)reader["Cliente_ID"], RazonSocial = (string)reader["Razon_Social"],
                        CUIT = (string)reader["CUIT_Cliente"], Domicilio = reader["Domicilio"] as string,
                        CondicionFiscal = reader["CondicionFiscal"] as string, EstadoCliente = (bool)reader["EstadoCliente"]
                    };
                }
            }
        }

        private static FacturaReferencia LeerFacturaReferencia(SqlConnection connection, SqlTransaction transaction, int id)
        {
            const string sql = @"
SELECT c.Comprobante_ID,c.ClienteID,c.NumeroCorrelativo,c.FechaEmision,c.FechaVencimiento,c.Estado,
       c.Neto,c.IVA,c.OtrosImpuestos,c.Total,
       COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) AS Aplicado
FROM dbo.COMPROBANTES c WITH (UPDLOCK,HOLDLOCK)
LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a WITH (UPDLOCK,HOLDLOCK)
       ON a.ComprobanteDeudaID=c.Comprobante_ID
WHERE c.Comprobante_ID=@id AND c.Tipo='FAC' AND c.Impacto='D'
GROUP BY c.Comprobante_ID,c.ClienteID,c.NumeroCorrelativo,c.FechaEmision,c.FechaVencimiento,c.Estado,
         c.Neto,c.IVA,c.OtrosImpuestos,c.Total;";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@id", id));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) return null;
                    return new FacturaReferencia
                    {
                        ComprobanteID = (int)reader["Comprobante_ID"], ClienteID = (int)reader["ClienteID"],
                        NumeroCorrelativo = (int)reader["NumeroCorrelativo"], FechaEmision = (DateTime)reader["FechaEmision"],
                        FechaVencimiento = reader["FechaVencimiento"] == DBNull.Value ? (DateTime?)null : (DateTime)reader["FechaVencimiento"],
                        Estado = (string)reader["Estado"], Neto = (decimal)reader["Neto"], IVA = (decimal)reader["IVA"],
                        OtrosImpuestos = (decimal)reader["OtrosImpuestos"], Total = (decimal)reader["Total"],
                        Aplicado = (decimal)reader["Aplicado"]
                    };
                }
            }
        }

        private static bool EsFacturaVigenteDeProforma(SqlConnection connection, SqlTransaction transaction,
            int proformaId, int facturaId)
        {
            const string sql = @"
SELECT COUNT(*)
FROM dbo.COMPROBANTES_PROFORMAS cp WITH (UPDLOCK,HOLDLOCK)
JOIN dbo.COMPROBANTES c WITH (UPDLOCK,HOLDLOCK) ON c.Comprobante_ID=cp.ComprobanteID
WHERE cp.ProformaID=@proforma AND cp.ComprobanteID=@factura AND cp.Vigente=1
  AND c.Tipo='FAC' AND c.Estado='EMITIDO';";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@proforma", proformaId));
                command.Parameters.Add(P("@factura", facturaId));
                return Convert.ToInt32(command.ExecuteScalar(), CultureInfo.InvariantCulture) == 1;
            }
        }

        private static ComprobanteExistente BuscarPorClave(SqlConnection connection, SqlTransaction transaction, Guid clave)
        {
            const string sql = @"
SELECT TOP (1) Comprobante_ID,ClienteID,Tipo,NumeroCorrelativo,FechaEmision,FechaVencimiento,Letra,Sucursal,
       ComprobanteReferenciaID,Concepto,Observaciones,Neto,IVA,OtrosImpuestos,Total
FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK) WHERE ClaveOperacion=@clave;";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@clave", clave));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) return null;
                    return new ComprobanteExistente
                    {
                        ComprobanteID = (int)reader["Comprobante_ID"], ClienteID = (int)reader["ClienteID"],
                        Tipo = (string)reader["Tipo"], NumeroCorrelativo = (int)reader["NumeroCorrelativo"],
                        FechaEmision = (DateTime)reader["FechaEmision"],
                        FechaVencimiento = reader["FechaVencimiento"] == DBNull.Value ? (DateTime?)null : (DateTime)reader["FechaVencimiento"],
                        Letra = reader["Letra"] as string, Sucursal = reader["Sucursal"] as string,
                        ReferenciaID = reader["ComprobanteReferenciaID"] == DBNull.Value ? (int?)null : (int)reader["ComprobanteReferenciaID"],
                        Concepto = (string)reader["Concepto"], Observaciones = reader["Observaciones"] as string,
                        Neto = (decimal)reader["Neto"], IVA = (decimal)reader["IVA"],
                        OtrosImpuestos = (decimal)reader["OtrosImpuestos"], Total = (decimal)reader["Total"]
                    };
                }
            }
        }

        private static bool CoincideEncabezado(ComprobanteExistente actual, EmitirComprobanteRequest request,
            DateTime emision, DateTime? vencimiento)
        {
            return actual.ClienteID == request.ClienteID && actual.Tipo == request.Tipo
                && actual.FechaEmision.Date == emision && actual.FechaVencimiento == vencimiento
                && actual.ReferenciaID == request.ComprobanteReferenciaID
                && actual.Concepto == request.Concepto
                && string.Equals(actual.Letra ?? string.Empty, request.Letra ?? string.Empty, StringComparison.Ordinal)
                && string.Equals(actual.Sucursal ?? string.Empty, request.Sucursal ?? string.Empty, StringComparison.Ordinal)
                && string.Equals(actual.Observaciones ?? string.Empty, request.Observaciones ?? string.Empty, StringComparison.Ordinal);
        }

        private static bool Coincide(ComprobanteExistente actual, EmitirComprobanteRequest request,
            DateTime emision, DateTime? vencimiento, decimal iva, decimal total)
        {
            return CoincideEncabezado(actual, request, emision, vencimiento)
                && actual.Neto == request.Neto && actual.IVA == iva
                && actual.OtrosImpuestos == request.OtrosImpuestos && actual.Total == total;
        }

        private static bool CoincideReintentoNotaCreditoCorriente(ComprobanteExistente actual,
            EmitirComprobanteRequest request, DateTime emision, DateTime? vencimiento)
        {
            return CoincideEncabezado(actual, request, emision, vencimiento)
                && actual.ReferenciaID == null;
        }

        private static bool CoincidenAplicaciones(SqlConnection connection, SqlTransaction transaction,
            int comprobanteId, List<AplicacionComprobanteRequest> aplicaciones)
        {
            var guardadas = new Dictionary<int, decimal>();
            const string sql = @"
SELECT ComprobanteDeudaID,Importe
FROM dbo.CUENTA_CORRIENTE_APLICACIONES WITH (UPDLOCK,HOLDLOCK)
WHERE ComprobanteCreditoID=@credito AND Vigente=1;";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@credito", comprobanteId));
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read()) guardadas[(int)reader["ComprobanteDeudaID"]] = (decimal)reader["Importe"];
                }
            }
            return guardadas.Count == aplicaciones.Count
                && aplicaciones.All(x => guardadas.ContainsKey(x.ComprobanteID)
                    && guardadas[x.ComprobanteID] == x.Importe);
        }

        [HttpGet]
        [Route("clientes/{clienteId:int}/facturas-referencia")]
        public IHttpActionResult ListarFacturasReferencia(int clienteId)
        {
            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    ValidarAcceso(connection, null, "CC_CONSULTAR");
                    const string sql = @"
SELECT c.Comprobante_ID,c.NumeroCorrelativo,c.FechaEmision,c.FechaVencimiento,c.Neto,c.IVA,c.OtrosImpuestos,c.Total,
       COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) AS Aplicado
FROM dbo.COMPROBANTES c
LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteDeudaID=c.Comprobante_ID
WHERE c.ClienteID=@cliente AND c.Tipo='FAC' AND c.Estado='EMITIDO'
GROUP BY c.Comprobante_ID,c.NumeroCorrelativo,c.FechaEmision,c.FechaVencimiento,c.Neto,c.IVA,c.OtrosImpuestos,c.Total
ORDER BY c.FechaVencimiento,c.FechaEmision,c.Comprobante_ID;";
                    var facturas = new List<FacturaReferenciaDto>();
                    using (var command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.Add(P("@cliente", clienteId));
                        using (var reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                decimal total = (decimal)reader["Total"];
                                decimal aplicado = (decimal)reader["Aplicado"];
                                var factura = new FacturaReferencia
                                {
                                    Neto = (decimal)reader["Neto"], IVA = (decimal)reader["IVA"],
                                    OtrosImpuestos = (decimal)reader["OtrosImpuestos"], Total = total,
                                    Aplicado = aplicado
                                };
                                decimal netoPendiente;
                                decimal ivaPendiente;
                                decimal otrosPendientes;
                                CalcularComposicionPendiente(factura, out netoPendiente, out ivaPendiente, out otrosPendientes);
                                facturas.Add(new FacturaReferenciaDto
                                {
                                    ComprobanteID = (int)reader["Comprobante_ID"],
                                    Numero = Numero("FAC", (int)reader["NumeroCorrelativo"]),
                                    FechaEmision = (DateTime)reader["FechaEmision"],
                                    FechaVencimiento = reader["FechaVencimiento"] == DBNull.Value ? (DateTime?)null : (DateTime)reader["FechaVencimiento"],
                                    Total = total, ImporteAplicado = aplicado, SaldoPendiente = total - aplicado,
                                    NetoPendiente = netoPendiente, IVAPendiente = ivaPendiente,
                                    OtrosImpuestosPendiente = otrosPendientes,
                                    IvaPct = netoPendiente > 0 ? Redondear(ivaPendiente * 100m / netoPendiente) : 0
                                });
                            }
                        }
                    }
                    return Ok(facturas);
                }
            }
            catch (AccesoException ex)
            {
                return Content(ex.StatusCode, new { error = ex.Message });
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudieron consultar las facturas de referencia." });
            }
        }

        [HttpGet]
        [Route("proformas/{proformaId:int}/factura-cancelatoria")]
        public IHttpActionResult ObtenerFacturaCancelatoria(int proformaId)
        {
            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    ValidarAcceso(connection, null, "NC_EMITIR");
                    const string sql = @"
SELECT TOP (1)
       p.Proforma_ID AS ProformaID,p.Numero AS ProformaNumero,
       c.Comprobante_ID AS FacturaID,c.ClienteID,c.NumeroCorrelativo,c.FechaEmision AS FechaFactura,c.Estado AS EstadoFactura,
       COALESCE(NULLIF(c.RazonSocial,''),p.Cli_RazonSocial) AS Cliente,c.CUIT,
       c.Neto,c.IVA,c.OtrosImpuestos,c.Total,
       COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) AS Aplicado
FROM dbo.PROFORMAS p
JOIN dbo.COMPROBANTES_PROFORMAS cp ON cp.ProformaID=p.Proforma_ID AND cp.Vigente=1
JOIN dbo.COMPROBANTES c ON c.Comprobante_ID=cp.ComprobanteID AND c.Tipo='FAC'
LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteDeudaID=c.Comprobante_ID
WHERE p.Proforma_ID=@proforma
GROUP BY p.Proforma_ID,p.Numero,c.Comprobante_ID,c.ClienteID,c.NumeroCorrelativo,c.FechaEmision,c.Estado,
         c.RazonSocial,p.Cli_RazonSocial,c.CUIT,c.Neto,c.IVA,c.OtrosImpuestos,c.Total
ORDER BY c.Comprobante_ID DESC;";
                    FacturaCancelatoriaProforma factura = null;
                    using (var command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.Add(P("@proforma", proformaId));
                        using (var reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                factura = new FacturaCancelatoriaProforma
                                {
                                    ProformaID = (int)reader["ProformaID"], ProformaNumero = reader["ProformaNumero"] as string,
                                    FacturaID = (int)reader["FacturaID"], ClienteID = (int)reader["ClienteID"],
                                    NumeroCorrelativo = (int)reader["NumeroCorrelativo"], FechaFactura = (DateTime)reader["FechaFactura"],
                                    EstadoFactura = reader["EstadoFactura"] as string, Cliente = reader["Cliente"] as string,
                                    CUIT = reader["CUIT"] as string, Neto = (decimal)reader["Neto"], IVA = (decimal)reader["IVA"],
                                    OtrosImpuestos = (decimal)reader["OtrosImpuestos"], Total = (decimal)reader["Total"],
                                    Aplicado = (decimal)reader["Aplicado"]
                                };
                            }
                        }
                    }
                    if (factura == null)
                        return Content(HttpStatusCode.BadRequest,
                            new { error = "La proforma no tiene una factura vigente para anular." });

                    string motivo = null;
                    if (factura.EstadoFactura != "EMITIDO")
                        motivo = "La factura vinculada no está emitida.";
                    else if (factura.Aplicado != 0)
                        motivo = "La factura tiene movimientos en la cuenta corriente y no admite una nota de crédito cancelatoria por el total.";
                    else if (factura.Total <= 0)
                        motivo = "La factura vinculada no tiene un importe válido para cancelar.";

                    return Ok(new
                    {
                        factura.ProformaID,
                        factura.ProformaNumero,
                        factura.FacturaID,
                        FacturaNumero = Numero("FAC", factura.NumeroCorrelativo),
                        factura.ClienteID,
                        factura.Cliente,
                        factura.CUIT,
                        factura.FechaFactura,
                        factura.Neto,
                        factura.IVA,
                        factura.OtrosImpuestos,
                        factura.Total,
                        IvaPct = factura.Neto > 0 ? Redondear(factura.IVA * 100m / factura.Neto) : 0,
                        Cancelable = motivo == null,
                        MotivoBloqueo = motivo
                    });
                }
            }
            catch (AccesoException ex)
            {
                return Content(ex.StatusCode, new { error = ex.Message });
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudo obtener la factura vinculada a la proforma." });
            }
        }

        [HttpPost]
        [Route("comprobantes")]
        public IHttpActionResult Emitir([FromBody] EmitirComprobanteRequest request)
        {
            if (request == null) return BadRequest("Faltan los datos del comprobante.");
            request.Tipo = (request.Tipo ?? string.Empty).Trim().ToUpperInvariant();
            request.Concepto = (request.Concepto ?? string.Empty).Trim();
            request.Observaciones = string.IsNullOrWhiteSpace(request.Observaciones) ? null : request.Observaciones.Trim();
            if (request.ClaveOperacion == Guid.Empty) return BadRequest("Falta la clave de la operación. Cerrá el formulario y volvé a abrirlo.");
            if (request.Tipo != "FAC" && request.Tipo != "NC" && request.Tipo != "ND")
                return BadRequest("El tipo de comprobante no es válido.");
            if (request.ClienteID <= 0) return BadRequest("Seleccioná un cliente.");
            if (!request.FechaEmision.HasValue) return BadRequest("La fecha de emisión es obligatoria.");
            DateTime emision = request.FechaEmision.Value.Date;
            if (emision > FechaArgentina()) return BadRequest("No se admite una fecha de emisión futura.");
            DateTime? vencimiento = request.Tipo == "NC" ? null : request.FechaVencimiento.HasValue
                ? request.FechaVencimiento.Value.Date : (DateTime?)null;
            if (request.Tipo != "NC" && !vencimiento.HasValue)
                return BadRequest("La fecha de vencimiento es obligatoria.");
            if (vencimiento.HasValue && vencimiento.Value < emision)
                return BadRequest("El vencimiento no puede ser anterior a la emisión.");
            request.Aplicaciones = request.Aplicaciones ?? new List<AplicacionComprobanteRequest>();
            if (request.Aplicaciones.Count > 200)
                return BadRequest("La nota de crédito supera la cantidad máxima de facturas aplicables.");
            if (request.Aplicaciones.Any(x => x == null || x.ComprobanteID <= 0 || x.Importe <= 0 || x.Importe != Redondear(x.Importe)))
                return BadRequest("Las aplicaciones deben tener importes positivos con hasta dos decimales.");
            if (request.Aplicaciones.GroupBy(x => x.ComprobanteID).Any(x => x.Count() > 1))
                return BadRequest("No se puede aplicar dos veces la misma factura.");
            bool notaCreditoCorriente = request.Tipo == "NC" && !request.ProformaID.HasValue;
            if (notaCreditoCorriente && request.ComprobanteReferenciaID.HasValue)
                return BadRequest("La nota de crédito corriente no admite una única factura de referencia.");
            if (notaCreditoCorriente && request.Aplicaciones.Count == 0)
                return BadRequest("La nota de crédito debe aplicarse a una o más facturas.");
            if (request.Tipo == "NC" && request.ProformaID.HasValue && !request.ComprobanteReferenciaID.HasValue)
                return BadRequest("La nota de crédito cancelatoria debe relacionarse con la factura de la proforma.");
            if (request.Tipo == "NC" && request.ProformaID.HasValue && request.Aplicaciones.Count > 0)
                return BadRequest("La nota de crédito cancelatoria no admite distribución múltiple.");
            if (request.Tipo != "NC" && request.ComprobanteReferenciaID.HasValue)
                return BadRequest("Solo la nota de crédito admite una factura de referencia.");
            if (request.Tipo != "NC" && request.Aplicaciones.Count > 0)
                return BadRequest("Solo la nota de crédito admite aplicaciones a facturas.");
            if (request.ProformaID.HasValue && request.Tipo != "NC")
                return BadRequest("La proforma solo se puede indicar al emitir una nota de crédito cancelatoria.");
            if (request.Concepto.Length == 0 || request.Concepto.Length > 200)
                return BadRequest("El concepto es obligatorio y no puede superar los 200 caracteres.");
            if ((request.Observaciones ?? string.Empty).Length > 2000)
                return BadRequest("Las observaciones no pueden superar los 2000 caracteres.");
            if (!notaCreditoCorriente)
            {
                if (request.Neto <= 0 || request.Neto != Redondear(request.Neto))
                    return BadRequest("El importe neto debe ser mayor que cero y tener hasta dos decimales.");
                if (request.IvaPct < 0 || request.IvaPct > 100 || request.IvaPct != Redondear(request.IvaPct))
                    return BadRequest("El porcentaje de IVA debe estar entre 0 y 100.");
                if (request.Tipo == "NC" && (!request.IVA.HasValue || request.IVA.Value < 0
                    || request.IVA.Value != Redondear(request.IVA.Value)))
                    return BadRequest("El importe de IVA de la nota de crédito no es válido.");
                if (request.OtrosImpuestos < 0 || request.OtrosImpuestos != Redondear(request.OtrosImpuestos))
                    return BadRequest("Otros impuestos no puede ser negativo y debe tener hasta dos decimales.");
            }

            decimal iva = notaCreditoCorriente ? 0 : (request.Tipo == "NC" ? request.IVA.Value : Redondear(request.Neto * request.IvaPct / 100m));
            decimal total = notaCreditoCorriente ? 0 : request.Neto + iva + request.OtrosImpuestos;
            string impacto = request.Tipo == "NC" ? "C" : "D";
            string permiso = request.Tipo + "_EMITIR";

            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    using (var transaction = connection.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            var usuario = ValidarAcceso(connection, transaction, permiso);
                            var configuracion = FacturacionComprobantesConfiguracion.Obtener(connection, transaction, request.Tipo);
                            var letra = request.Letra;
                            var sucursal = request.Sucursal;
                            FacturacionComprobantesConfiguracion.ValidarDatos(connection, transaction, ref letra, ref sucursal, configuracion);
                            request.Letra = letra;
                            request.Sucursal = sucursal;
                            var existente = BuscarPorClave(connection, transaction, request.ClaveOperacion);
                            if (existente != null)
                            {
                                bool coincide = notaCreditoCorriente
                                    ? CoincideReintentoNotaCreditoCorriente(existente, request, emision, vencimiento)
                                        && CoincidenAplicaciones(connection, transaction, existente.ComprobanteID, request.Aplicaciones)
                                    : Coincide(existente, request, emision, vencimiento, iva, total);
                                if (!coincide)
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.Conflict,
                                        new { error = "Esta operación ya se registró con otros datos. Cerrá el formulario y volvé a abrirlo." });
                                }
                                transaction.Commit();
                                return Ok(new
                                {
                                    existente.ComprobanteID, existente.ClienteID,
                                    Numero = Numero(existente.Tipo, existente.NumeroCorrelativo),
                                    existente.Tipo, existente.Total, Estado = "EMITIDO", Reintento = true
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

                            var aplicacionesNotaCredito = new List<AplicacionNotaCredito>();
                            FacturaReferencia referencia = null;
                            if (request.Tipo == "NC" && request.ProformaID.HasValue)
                            {
                                referencia = LeerFacturaReferencia(connection, transaction, request.ComprobanteReferenciaID.Value);
                                if (referencia == null || referencia.ClienteID != request.ClienteID || referencia.Estado != "EMITIDO")
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.BadRequest,
                                        new { error = "La factura de referencia no es válida para este cliente." });
                                }
                                if (emision < referencia.FechaEmision.Date || referencia.Pendiente <= 0)
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.Conflict,
                                        new { error = "La factura relacionada ya no admite una nota de crédito cancelatoria." });
                                }
                                decimal netoPendiente;
                                decimal ivaPendiente;
                                decimal otrosPendientes;
                                CalcularComposicionPendiente(referencia, out netoPendiente, out ivaPendiente, out otrosPendientes);
                                if (request.Neto != netoPendiente || iva != ivaPendiente
                                    || request.OtrosImpuestos != otrosPendientes || total != referencia.Pendiente)
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.Conflict, new
                                    {
                                        error = "Los importes de la factura cambiaron. Volvé a seleccionarla para actualizar el neto, el IVA y los impuestos."
                                    });
                                }
                                if (!EsFacturaVigenteDeProforma(connection, transaction,
                                    request.ProformaID.Value, referencia.ComprobanteID))
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.BadRequest,
                                        new { error = "La factura indicada no es la factura vigente de la proforma." });
                                }
                                if (referencia.Aplicado != 0)
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.Conflict,
                                        new { error = "La factura tiene movimientos en cuenta corriente y no puede cancelarse por el total." });
                                }
                                aplicacionesNotaCredito.Add(new AplicacionNotaCredito
                                {
                                    Factura = referencia, Importe = total, Neto = netoPendiente,
                                    IVA = ivaPendiente, OtrosImpuestos = otrosPendientes
                                });
                                if (request.Tipo == "NC" && request.ProformaID.HasValue && aplicacionesNotaCredito.Count != 1)
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.BadRequest,
                                        new { error = "La nota de crédito cancelatoria debe aplicarse a una única factura." });
                                }
                            }
                            else if (notaCreditoCorriente)
                            {
                                foreach (var aplicacion in request.Aplicaciones)
                                {
                                    var factura = LeerFacturaReferencia(connection, transaction, aplicacion.ComprobanteID);
                                    if (factura == null || factura.ClienteID != request.ClienteID || factura.Estado != "EMITIDO")
                                    {
                                        transaction.Rollback();
                                        return Content(HttpStatusCode.BadRequest,
                                            new { error = "Una factura aplicada no es válida para este cliente." });
                                    }
                                    if (emision < factura.FechaEmision.Date)
                                    {
                                        transaction.Rollback();
                                        return Content(HttpStatusCode.BadRequest,
                                            new { error = "La fecha de la nota de crédito no puede ser anterior a la factura aplicada." });
                                    }
                                    if (aplicacion.Importe > factura.Pendiente)
                                    {
                                        transaction.Rollback();
                                        return Content(HttpStatusCode.Conflict, new
                                        {
                                            error = "El importe aplicado supera el saldo de la factura "
                                                + Numero("FAC", factura.NumeroCorrelativo) + "."
                                        });
                                    }
                                    decimal netoAplicado;
                                    decimal ivaAplicado;
                                    decimal otrosAplicados;
                                    CalcularComposicionAplicacion(factura, aplicacion.Importe,
                                        out netoAplicado, out ivaAplicado, out otrosAplicados);
                                    aplicacionesNotaCredito.Add(new AplicacionNotaCredito
                                    {
                                        Factura = factura, Importe = aplicacion.Importe, Neto = netoAplicado,
                                        IVA = ivaAplicado, OtrosImpuestos = otrosAplicados
                                    });
                                }
                                request.Neto = aplicacionesNotaCredito.Sum(x => x.Neto);
                                iva = aplicacionesNotaCredito.Sum(x => x.IVA);
                                request.IVA = iva;
                                request.OtrosImpuestos = aplicacionesNotaCredito.Sum(x => x.OtrosImpuestos);
                                total = aplicacionesNotaCredito.Sum(x => x.Importe);
                                request.IvaPct = request.Neto > 0 ? Redondear(iva * 100m / request.Neto) : 0;
                            }

                            int correlativo;
                            using (var command = new SqlCommand(@"
UPDATE dbo.FACTURACION_NUMERADORES WITH (UPDLOCK,HOLDLOCK)
SET UltimoNumero=UltimoNumero+1 OUTPUT INSERTED.UltimoNumero
WHERE Numerador_ID=@tipo AND Activo=1 AND UltimoNumero<99999999;", connection, transaction))
                            {
                                command.Parameters.Add(P("@tipo", configuracion.NumeradorID));
                                object value = command.ExecuteScalar();
                                if (value == null) throw new InvalidOperationException("El numerador del comprobante no existe o está agotado.");
                                correlativo = Convert.ToInt32(value, CultureInfo.InvariantCulture);
                            }

                            int comprobanteId;
                            using (var command = new SqlCommand(@"
INSERT dbo.COMPROBANTES
 (ClienteID,Tipo,Impacto,NumeroCorrelativo,FechaEmision,FechaVencimiento,Moneda,Estado,
  RazonSocial,CUIT,Domicilio,CondicionFiscal,CondicionComercial,Letra,Sucursal,NumeroComprobante,Subtotal,Descuentos,Neto,IVA,
  OtrosImpuestos,Total,Concepto,Observaciones,ComprobanteReferenciaID,TipoReferencia,ClaveOperacion,
  UsuarioAltaID,UsuarioEmisionID,FechaEmisionRegistro)
OUTPUT INSERTED.Comprobante_ID
VALUES
 (@cliente,@tipo,@impacto,@numero,@emision,@vencimiento,'ARS','EMITIDO',@razon,@cuit,@domicilio,
  @condFiscal,NULL,@letra,@sucursal,@numeroComprobante,@neto,0,@neto,@iva,@otros,@total,@concepto,@observaciones,@referencia,@tipoReferencia,
  @clave,@usuario,@usuario,SYSUTCDATETIME());", connection, transaction))
                            {
                                command.Parameters.AddRange(new[]
                                {
                                    P("@cliente", request.ClienteID),P("@tipo", request.Tipo),P("@impacto", impacto),
                                    P("@numero", correlativo),P("@emision", emision),P("@vencimiento", vencimiento),
                                    P("@razon", cliente.RazonSocial),P("@cuit", cliente.CUIT),P("@domicilio", cliente.Domicilio),
                                    P("@condFiscal", cliente.CondicionFiscal),P("@letra", request.Letra),P("@sucursal", request.Sucursal),
                                    P("@numeroComprobante", FacturacionComprobantesConfiguracion.NumeroVisible(correlativo)),P("@neto", request.Neto),P("@iva", iva),
                                    P("@otros", request.OtrosImpuestos),P("@total", total),P("@concepto", request.Concepto),
                                    P("@observaciones", request.Observaciones),P("@referencia", request.ComprobanteReferenciaID),
                                    P("@tipoReferencia", request.ComprobanteReferenciaID.HasValue ? "FAC" : null),
                                    P("@clave", request.ClaveOperacion),P("@usuario", usuario.UsuarioID)
                                });
                                comprobanteId = Convert.ToInt32(command.ExecuteScalar(), CultureInfo.InvariantCulture);
                            }

                            using (var command = new SqlCommand(@"
INSERT dbo.COMPROBANTES_DETALLE
 (ComprobanteID,Orden,ProformaDetalleID,Codigo,Concepto,Descripcion,Cantidad,Unidad,PrecioUnitario,
  DescuentoPct,IvaPct,Subtotal,DescuentoImporte,Neto,IVA,Total)
VALUES
 (@comprobante,1,NULL,NULL,@concepto,NULL,1,'UN',@neto,0,@ivaPct,@neto,0,@neto,@iva,@totalDetalle);

INSERT dbo.CUENTA_CORRIENTE_MOVIMIENTOS
 (ComprobanteID,ClienteID,Tipo,Clase,Impacto,Importe,FechaContable,Concepto,UsuarioAltaID)
VALUES (@comprobante,@cliente,@tipo,'EMISION',@impacto,@total,@emision,@concepto,@usuario);",
                                connection, transaction))
                            {
                                command.Parameters.AddRange(new[]
                                {
                                    P("@comprobante", comprobanteId),P("@cliente", request.ClienteID),P("@tipo", request.Tipo),
                                    P("@impacto", impacto),P("@total", total),P("@emision", emision),P("@concepto", request.Concepto),
                                    P("@usuario", usuario.UsuarioID),P("@neto", request.Neto),P("@ivaPct", request.IvaPct),
                                    P("@iva", iva),P("@totalDetalle", request.Neto + iva)
                                });
                                command.ExecuteNonQuery();
                            }

                            if (request.Tipo == "NC")
                            {
                                foreach (var aplicacion in aplicacionesNotaCredito)
                                {
                                    using (var command = new SqlCommand(@"
INSERT dbo.CUENTA_CORRIENTE_APLICACIONES
 (ClienteID,ComprobanteCreditoID,ImpactoCredito,ComprobanteDeudaID,ImpactoDeuda,Importe,
  FechaAplicacion,Vigente,UsuarioAltaID)
VALUES (@cliente,@credito,'C',@deuda,'D',@importe,@fecha,1,@usuario);", connection, transaction))
                                    {
                                        command.Parameters.AddRange(new[]
                                        {
                                            P("@cliente", request.ClienteID),P("@credito", comprobanteId),
                                            P("@deuda", aplicacion.Factura.ComprobanteID),P("@importe", aplicacion.Importe),P("@fecha", emision),
                                            P("@usuario", usuario.UsuarioID)
                                        });
                                        command.ExecuteNonQuery();
                                    }
                                }
                            }

                            // Nota de Credito cancelatoria de la Factura de una Proforma: desvincula la Factura,
                            // anula la Proforma y libera sus viajes (vuelven a Listo para facturar / Entregado)
                            // para que puedan incluirse en otra Proforma y volver a facturarse.
                            if (request.Tipo == "NC" && request.ProformaID.HasValue)
                            {
                                using (var command = new SqlCommand(@"
UPDATE dbo.COMPROBANTES_PROFORMAS
SET Vigente=0,UsuarioAnulacionID=@usuario,FechaAnulacion=SYSUTCDATETIME(),MotivoAnulacion=@motivo
WHERE ProformaID=@proforma AND ComprobanteID=@factura AND Vigente=1;
IF @@ROWCOUNT<>1
    THROW 51060, 'No se pudo desvincular la Factura de la Proforma.', 1;

UPDATE v SET Estado=CASE WHEN EXISTS (SELECT 1 FROM dbo.CLIENTES c WHERE c.Cliente_ID=v.ClienteID AND c.Tipo_Cliente='Con_plataforma')
                         THEN 'Listo_para_facturar' ELSE 'Entregado' END,
             Usu_Modi=LEFT(@nombreUsuario,20),Fecha_Modi=GETDATE()
FROM dbo.VIAJES v
WHERE v.Estado='Facturado' AND (EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID=@proforma AND pv.ViajeID=v.Viaje_ID)
    OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd WHERE pd.Proforma_ID=@proforma
               AND UPPER(LTRIM(RTRIM(ISNULL(pd.Codigo,''))))='V'+CONVERT(varchar(11),v.Viaje_ID)));

DELETE FROM dbo.PROFORMAS_VIAJES WHERE ProformaID=@proforma;

UPDATE dbo.PROFORMAS SET Estado='Anulada',Usu_Modi=@nombreUsuario,Fecha_Modi=GETDATE() WHERE Proforma_ID=@proforma;

INSERT dbo.AUDITORIA
 (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen)
VALUES
 (GETDATE(),@nombreUsuario,'ANULAR','PROFORMAS',@claveProforma,'Estado=Facturada',@detalleProforma,'Cuenta Corriente');",
                                    connection, transaction))
                                {
                                    string motivo = "Nota de Credito " + Numero(request.Tipo, correlativo) + ": " + request.Concepto;
                                    command.Parameters.AddRange(new[]
                                    {
                                        P("@usuario", usuario.UsuarioID),P("@motivo", motivo.Length > 500 ? motivo.Substring(0, 500) : motivo),
                                        P("@proforma", request.ProformaID.Value),P("@factura", referencia.ComprobanteID),
                                        P("@nombreUsuario", usuario.NombreUsuario),P("@claveProforma", "Proforma_ID=" + request.ProformaID.Value),
                                        P("@detalleProforma", "Estado=Anulada; " + motivo + "; viajes liberados")
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
                                    P("@detalleAuditoria", Numero(request.Tipo, correlativo) + " por "
                                        + total.ToString("0.00", CultureInfo.InvariantCulture))
                                });
                                command.ExecuteNonQuery();
                            }

                            transaction.Commit();
                            return Content(HttpStatusCode.Created, new
                            {
                                ComprobanteID = comprobanteId, ClienteID = request.ClienteID,
                                Numero = Numero(request.Tipo, correlativo), request.Tipo, Estado = "EMITIDO",
                                FechaEmision = emision, FechaVencimiento = vencimiento, Neto = request.Neto,
                                IVA = iva, OtrosImpuestos = request.OtrosImpuestos, Total = total, Moneda = "ARS",
                                ComprobanteReferenciaID = request.ComprobanteReferenciaID
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
                    new { error = "El comprobante ya fue creado o la operación se procesó en paralelo." });
            }
            catch (InvalidOperationException ex)
            {
                return Content(HttpStatusCode.Conflict, new { error = ex.Message });
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudo emitir el comprobante. No se guardó ningún cambio." });
            }
        }
    }
}
