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
    public class FacturasController : ApiController
    {
        public class EmitirFacturaRequest
        {
            public Guid ClaveOperacion { get; set; }
            public string VersionProforma { get; set; }
            public DateTime? FechaEmision { get; set; }
            public DateTime? FechaVencimiento { get; set; }
            public string Letra { get; set; }
            public string Sucursal { get; set; }
            public string Observaciones { get; set; }
        }

        private class UsuarioSesion
        {
            public int UsuarioID { get; set; }
            public string NombreUsuario { get; set; }
        }

        private class ProformaFactura
        {
            public int ProformaID { get; set; }
            public int ClienteID { get; set; }
            public string Numero { get; set; }
            public string Estado { get; set; }
            public string Moneda { get; set; }
            public string RazonSocial { get; set; }
            public string CUIT { get; set; }
            public string Domicilio { get; set; }
            public string CondicionFiscal { get; set; }
            public string CondicionComercial { get; set; }
            public string TipoServicio { get; set; }
            public string Origen { get; set; }
            public string Destino { get; set; }
            public string Observaciones { get; set; }
            public DateTime? FechaEmisionProforma { get; set; }
            public DateTime? FechaVencimientoProforma { get; set; }
            public decimal Subtotal { get; set; }
            public decimal Descuentos { get; set; }
            public decimal Neto { get; set; }
            public decimal IVA { get; set; }
            public decimal OtrosImpuestos { get; set; }
            public decimal Total { get; set; }
            public decimal ImporteTotal { get; set; }
            public bool ClienteHabilitado { get; set; }
            public byte[] Version { get; set; }
        }

        private class ProformaDetalleFactura
        {
            public int DetalleID { get; set; }
            public int Orden { get; set; }
            public string Codigo { get; set; }
            public string Concepto { get; set; }
            public string Descripcion { get; set; }
            public decimal Cantidad { get; set; }
            public string Unidad { get; set; }
            public decimal PrecioUnitario { get; set; }
            public decimal DescuentoPct { get; set; }
            public decimal IvaPct { get; set; }
            public decimal SubtotalProforma { get; set; }
            public decimal Subtotal { get; set; }
            public decimal DescuentoImporte { get; set; }
            public decimal Neto { get; set; }
            public decimal IVA { get; set; }
            public decimal Total { get; set; }
        }

        private class TotalesFactura
        {
            public decimal Subtotal { get; set; }
            public decimal Descuentos { get; set; }
            public decimal Neto { get; set; }
            public decimal IVA { get; set; }
            public decimal OtrosImpuestos { get; set; }
            public decimal Total { get; set; }
        }

        private class FacturaExistente
        {
            public int ComprobanteID { get; set; }
            public int ClienteID { get; set; }
            public int ProformaID { get; set; }
            public string Tipo { get; set; }
            public int NumeroCorrelativo { get; set; }
            public DateTime FechaEmision { get; set; }
            public DateTime? FechaVencimiento { get; set; }
            public string Letra { get; set; }
            public string Sucursal { get; set; }
            public string Observaciones { get; set; }
            public Guid ClaveOperacion { get; set; }
            public decimal Total { get; set; }
        }

        private class ComprobanteImpresion
        {
            public int ComprobanteID { get; set; }
            public int ClienteID { get; set; }
            public string Tipo { get; set; }
            public string Numero { get; set; }
            public DateTime FechaEmision { get; set; }
            public DateTime? FechaVencimiento { get; set; }
            public string Moneda { get; set; }
            public string EstadoDocumental { get; set; }
            public string EstadoFinanciero { get; set; }
            public string RazonSocial { get; set; }
            public string CUIT { get; set; }
            public string Domicilio { get; set; }
            public string CondicionFiscal { get; set; }
            public string CondicionComercial { get; set; }
            public decimal Subtotal { get; set; }
            public decimal Descuentos { get; set; }
            public decimal Neto { get; set; }
            public decimal IVA { get; set; }
            public decimal OtrosImpuestos { get; set; }
            public decimal Total { get; set; }
            public decimal ImporteAplicado { get; set; }
            public decimal SaldoPendiente { get; set; }
            public string Concepto { get; set; }
            public string Observaciones { get; set; }
            public string ProformaNumero { get; set; }
            public string ComprobanteReferenciaNumero { get; set; }
            public List<ComprobanteCanceladoImpresion> ComprobantesCancelados { get; set; }
            public List<ComprobanteDetalleImpresion> Detalle { get; set; }
        }

        private class ComprobanteCanceladoImpresion
        {
            public int ComprobanteID { get; set; }
            public string Numero { get; set; }
            public DateTime FechaEmision { get; set; }
            public string Concepto { get; set; }
            public decimal ImporteAplicado { get; set; }
        }

        private class ComprobanteDetalleImpresion
        {
            public int Orden { get; set; }
            public string Codigo { get; set; }
            public string Concepto { get; set; }
            public string Descripcion { get; set; }
            public decimal Cantidad { get; set; }
            public string Unidad { get; set; }
            public decimal PrecioUnitario { get; set; }
            public decimal DescuentoPct { get; set; }
            public decimal IvaPct { get; set; }
            public decimal Subtotal { get; set; }
            public decimal DescuentoImporte { get; set; }
            public decimal Neto { get; set; }
            public decimal IVA { get; set; }
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

        private string ObtenerNombreUsuarioToken()
        {
            var authorization = Request != null ? Request.Headers.Authorization : null;
            if (authorization == null || !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(authorization.Parameter))
                throw new AccesoException(HttpStatusCode.Unauthorized, "Debe iniciar sesión.");

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
                    throw new SecurityTokenException("Token sin usuario.");
                return claim.Value;
            }
            catch (Exception ex) when (!(ex is AccesoException))
            {
                throw new AccesoException(HttpStatusCode.Unauthorized, "La sesión no es válida o ha vencido.");
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
                    int usuarioId = reader.GetInt32(0);
                    bool autorizado = reader.GetInt32(1) == 1;
                    if (!autorizado)
                        throw new AccesoException(HttpStatusCode.Forbidden, "No tiene permiso para realizar esta operación.");
                    return new UsuarioSesion { UsuarioID = usuarioId, NombreUsuario = nombreUsuario };
                }
            }
        }

        private static ProformaFactura LeerProforma(SqlConnection connection, SqlTransaction transaction, int id, bool bloquear)
        {
            string hint = bloquear ? " WITH (UPDLOCK,HOLDLOCK)" : string.Empty;
            string sql = @"
SELECT p.Proforma_ID AS ProformaID,ISNULL(p.ClienteID,0) AS ClienteID,p.Numero,p.Estado,p.Moneda,
       COALESCE(NULLIF(p.Cli_RazonSocial,''),c.Razon_Social) AS RazonSocial,
       COALESCE(NULLIF(p.Cli_CUIT,''),c.CUIT_Cliente) AS CUIT,
       COALESCE(NULLIF(p.Cli_Direccion,''),LTRIM(RTRIM(COALESCE(c.Calle,'')+' '+COALESCE(c.AlturaCalle,'')))) AS Domicilio,
       COALESCE(CASE UPPER(NULLIF(LTRIM(RTRIM(p.Cli_CondIVA)),''))
           WHEN '1' THEN N'Responsable Inscripto'
           WHEN 'RI' THEN N'Responsable Inscripto'
           WHEN '2' THEN N'Monotributista'
           WHEN 'MT' THEN N'Monotributista'
           WHEN '3' THEN N'Exento'
           WHEN 'EX' THEN N'Exento'
           ELSE NULLIF(LTRIM(RTRIM(p.Cli_CondIVA)),'')
       END,CASE c.Cond_Fiscal
           WHEN 1 THEN N'Responsable Inscripto'
           WHEN 2 THEN N'Monotributista'
           WHEN 3 THEN N'Exento'
       END) AS CondicionFiscal,
       NULLIF(LTRIM(RTRIM(COALESCE(p.FormaPago,'')+' '+COALESCE(p.PlazoPago,''))),'') AS CondicionComercial,
       p.TipoServicio,p.Origen,p.Destino,p.Observaciones,
       p.FechaEmision AS FechaEmisionProforma,p.FechaVencimiento AS FechaVencimientoProforma,
       ISNULL(p.Subtotal,0) AS Subtotal,ISNULL(p.Descuentos,0) AS Descuentos,
       ISNULL(p.SubtotalNeto,0) AS Neto,ISNULL(p.IVA,0) AS IVA,
       ISNULL(p.OtrosImpuestos,0) AS OtrosImpuestos,ISNULL(p.TotalGeneral,0) AS Total,
       ISNULL(p.ImporteTotal,0) AS ImporteTotal,CONVERT(bit,ISNULL(c.EstadoCliente,0)) AS ClienteHabilitado,p.VersionCuentaCorriente AS Version
FROM dbo.PROFORMAS p" + hint + @"
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID=p.ClienteID
WHERE p.Proforma_ID=@id;";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@id", id));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) return null;
                    return new ProformaFactura
                    {
                        ProformaID = reader.GetInt32(reader.GetOrdinal("ProformaID")),
                        ClienteID = reader.GetInt32(reader.GetOrdinal("ClienteID")),
                        Numero = reader["Numero"] as string,
                        Estado = reader["Estado"] as string,
                        Moneda = reader["Moneda"] as string,
                        RazonSocial = reader["RazonSocial"] as string,
                        CUIT = reader["CUIT"] as string,
                        Domicilio = reader["Domicilio"] as string,
                        CondicionFiscal = reader["CondicionFiscal"] as string,
                        CondicionComercial = reader["CondicionComercial"] as string,
                        TipoServicio = reader["TipoServicio"] as string,
                        Origen = reader["Origen"] as string,
                        Destino = reader["Destino"] as string,
                        Observaciones = reader["Observaciones"] as string,
                        FechaEmisionProforma = reader["FechaEmisionProforma"] == DBNull.Value
                            ? (DateTime?)null : (DateTime)reader["FechaEmisionProforma"],
                        FechaVencimientoProforma = reader["FechaVencimientoProforma"] == DBNull.Value
                            ? (DateTime?)null : (DateTime)reader["FechaVencimientoProforma"],
                        Subtotal = (decimal)reader["Subtotal"],
                        Descuentos = (decimal)reader["Descuentos"],
                        Neto = (decimal)reader["Neto"],
                        IVA = (decimal)reader["IVA"],
                        OtrosImpuestos = (decimal)reader["OtrosImpuestos"],
                        Total = (decimal)reader["Total"],
                        ImporteTotal = (decimal)reader["ImporteTotal"],
                        ClienteHabilitado = (bool)reader["ClienteHabilitado"],
                        Version = (byte[])reader["Version"]
                    };
                }
            }
        }

        private static List<ProformaDetalleFactura> LeerDetalles(SqlConnection connection, SqlTransaction transaction, int id)
        {
            const string sql = @"
SELECT Detalle_ID,Orden,Codigo,Concepto,Descripcion,Cantidad,Unidad,PrecioUnitario,
       DescuentoPct,IvaPct,Subtotal
FROM dbo.PROFORMA_DETALLE WITH (HOLDLOCK)
WHERE Proforma_ID=@id ORDER BY Orden,Detalle_ID;";
            var result = new List<ProformaDetalleFactura>();
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@id", id));
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        result.Add(new ProformaDetalleFactura
                        {
                            DetalleID = (int)reader["Detalle_ID"],
                            Orden = (int)reader["Orden"],
                            Codigo = reader["Codigo"] as string,
                            Concepto = reader["Concepto"] as string,
                            Descripcion = reader["Descripcion"] as string,
                            Cantidad = (decimal)reader["Cantidad"],
                            Unidad = reader["Unidad"] as string,
                            PrecioUnitario = (decimal)reader["PrecioUnitario"],
                            DescuentoPct = (decimal)reader["DescuentoPct"],
                            IvaPct = (decimal)reader["IvaPct"],
                            SubtotalProforma = (decimal)reader["Subtotal"]
                        });
                    }
                }
            }
            return result;
        }

        private static TotalesFactura CalcularTotales(ProformaFactura proforma,
            IList<ProformaDetalleFactura> detalles, IList<string> errores)
        {
            decimal subtotalSinRedondear = 0m, descuentosSinRedondear = 0m, ivaSinRedondear = 0m;
            var ordenes = new HashSet<int>();
            foreach (var detalle in detalles)
            {
                if (detalle.Orden <= 0 || !ordenes.Add(detalle.Orden)) errores.Add("Los órdenes de detalle son inválidos o están repetidos.");
                if (detalle.Cantidad <= 0) errores.Add("La cantidad de cada concepto debe ser mayor que cero.");
                if (detalle.PrecioUnitario < 0) errores.Add("El precio unitario no puede ser negativo.");
                if (detalle.DescuentoPct < 0 || detalle.DescuentoPct > 100) errores.Add("El descuento debe estar entre 0 y 100.");
                if (detalle.IvaPct < 0 || detalle.IvaPct > 100) errores.Add("El IVA debe estar entre 0 y 100.");
                if (string.IsNullOrWhiteSpace(detalle.Concepto)) errores.Add("Todos los conceptos deben tener una descripción.");

                decimal subtotalRaw = detalle.Cantidad * detalle.PrecioUnitario;
                decimal descuentoRaw = subtotalRaw * detalle.DescuentoPct / 100m;
                decimal netoRaw = subtotalRaw - descuentoRaw;
                decimal ivaRaw = netoRaw * detalle.IvaPct / 100m;
                detalle.Subtotal = Redondear(subtotalRaw);
                detalle.DescuentoImporte = Redondear(descuentoRaw);
                detalle.Neto = detalle.Subtotal - detalle.DescuentoImporte;
                detalle.IVA = Redondear(ivaRaw);
                detalle.Total = detalle.Neto + detalle.IVA;
                if (detalle.SubtotalProforma != Redondear(netoRaw))
                    errores.Add("El subtotal guardado de un concepto no coincide con sus cantidades y porcentajes.");
                subtotalSinRedondear += subtotalRaw;
                descuentosSinRedondear += descuentoRaw;
                ivaSinRedondear += ivaRaw;
            }
            var totales = new TotalesFactura
            {
                Subtotal = Redondear(subtotalSinRedondear),
                Descuentos = Redondear(descuentosSinRedondear),
                IVA = Redondear(ivaSinRedondear),
                OtrosImpuestos = proforma.OtrosImpuestos
            };
            totales.Neto = totales.Subtotal - totales.Descuentos;
            totales.Total = totales.Neto + totales.IVA + totales.OtrosImpuestos;
            return totales;
        }

        private static List<string> ValidarFacturacion(ProformaFactura proforma,
            IList<ProformaDetalleFactura> detalles, out TotalesFactura totales)
        {
            var errores = new List<string>();
            totales = new TotalesFactura();
            if (proforma == null) return errores;
            if (!string.Equals(proforma.Estado, "Aceptada", StringComparison.OrdinalIgnoreCase))
                errores.Add("La Proforma debe estar en estado Aceptada.");
            if (!string.Equals(proforma.Moneda, "ARS", StringComparison.OrdinalIgnoreCase))
                errores.Add("La Proforma debe estar expresada en ARS.");
            if (proforma.ClienteID <= 0) errores.Add("La Proforma no tiene un cliente válido.");
            if (!proforma.ClienteHabilitado) errores.Add("El cliente está inactivo para nuevas Facturas.");
            if (string.IsNullOrWhiteSpace(proforma.RazonSocial) || string.IsNullOrWhiteSpace(proforma.CUIT))
                errores.Add("Faltan los datos fiscales del cliente.");
            if (detalles.Count == 0) errores.Add("La Proforma no tiene conceptos para facturar.");
            if (proforma.OtrosImpuestos < 0) errores.Add("Los otros impuestos no pueden ser negativos.");
            totales = CalcularTotales(proforma, detalles, errores);
            if (proforma.Subtotal != totales.Subtotal || proforma.Descuentos != totales.Descuentos
                || proforma.Neto != totales.Neto || proforma.IVA != totales.IVA
                || proforma.Total != totales.Total || proforma.ImporteTotal != totales.Total)
                errores.Add("Los totales de la Proforma no coinciden con el recálculo de sus conceptos.");
            if (totales.Total <= 0) errores.Add("El total a facturar debe ser mayor que cero.");
            return errores.Distinct().ToList();
        }

        private static FacturaExistente BuscarFacturaPorProforma(SqlConnection connection, SqlTransaction transaction, int proformaId)
        {
            const string sql = @"
SELECT TOP (1) c.Comprobante_ID AS ComprobanteID,c.ClienteID,cp.ProformaID,c.Tipo,
       c.NumeroCorrelativo,c.FechaEmision,c.FechaVencimiento,c.Letra,c.Sucursal,c.Observaciones,c.ClaveOperacion,c.Total
FROM dbo.COMPROBANTES_PROFORMAS cp WITH (UPDLOCK,HOLDLOCK)
JOIN dbo.COMPROBANTES c ON c.Comprobante_ID=cp.ComprobanteID
WHERE cp.ProformaID=@proformaId AND cp.Vigente=1
ORDER BY cp.ComprobanteProforma_ID DESC;";
            return LeerFactura(connection, transaction, sql, P("@proformaId", proformaId));
        }

        private static FacturaExistente BuscarFacturaPorClave(SqlConnection connection, SqlTransaction transaction, Guid clave)
        {
            const string sql = @"
SELECT TOP (1) c.Comprobante_ID AS ComprobanteID,c.ClienteID,ISNULL(cp.ProformaID,0) AS ProformaID,
       c.Tipo,c.NumeroCorrelativo,c.FechaEmision,c.FechaVencimiento,c.Letra,c.Sucursal,c.Observaciones,c.ClaveOperacion,c.Total
FROM dbo.COMPROBANTES c WITH (UPDLOCK,HOLDLOCK)
LEFT JOIN dbo.COMPROBANTES_PROFORMAS cp ON cp.ComprobanteID=c.Comprobante_ID AND cp.Vigente=1
WHERE c.ClaveOperacion=@clave;";
            return LeerFactura(connection, transaction, sql, P("@clave", clave));
        }

        private static FacturaExistente LeerFactura(SqlConnection connection, SqlTransaction transaction,
            string sql, SqlParameter parameter)
        {
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(parameter);
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) return null;
                    return new FacturaExistente
                    {
                        ComprobanteID = (int)reader["ComprobanteID"],
                        ClienteID = (int)reader["ClienteID"],
                        ProformaID = (int)reader["ProformaID"],
                        Tipo = (string)reader["Tipo"],
                        NumeroCorrelativo = (int)reader["NumeroCorrelativo"],
                        FechaEmision = (DateTime)reader["FechaEmision"],
                        FechaVencimiento = reader["FechaVencimiento"] == DBNull.Value ? (DateTime?)null : (DateTime)reader["FechaVencimiento"],
                        Letra = reader["Letra"] as string,
                        Sucursal = reader["Sucursal"] as string,
                        Observaciones = reader["Observaciones"] as string,
                        ClaveOperacion = (Guid)reader["ClaveOperacion"],
                        Total = (decimal)reader["Total"]
                    };
                }
            }
        }

        private static string NumeroFactura(int numero)
        {
            return "FAC-" + numero.ToString("D8", CultureInfo.InvariantCulture);
        }

        [HttpGet]
        [Route("comprobantes/{id:int}")]
        public IHttpActionResult ObtenerComprobante(int id)
        {
            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    ValidarAcceso(connection, null, "CC_CONSULTAR");
                    ComprobanteImpresion comprobante = null;
                    const string sql = @"
SELECT c.Comprobante_ID,c.ClienteID,c.Tipo,
       c.Tipo+'-'+RIGHT('00000000'+CONVERT(varchar(8),c.NumeroCorrelativo),8) AS Numero,
       c.FechaEmision,c.FechaVencimiento,c.Moneda,c.Estado AS EstadoDocumental,
       CASE WHEN c.Estado='ANULADO' THEN 'Anulado'
            WHEN c.Impacto='D' AND COALESCE(a.ImporteAplicado,0)=0 THEN 'Pendiente'
            WHEN c.Impacto='D' AND COALESCE(a.ImporteAplicado,0)<c.Total THEN 'Parcial'
            WHEN c.Impacto='D' THEN 'Cancelado'
            ELSE c.Estado END AS EstadoFinanciero,
       c.RazonSocial,c.CUIT,c.Domicilio,c.CondicionFiscal,c.CondicionComercial,
       c.Subtotal,c.Descuentos,c.Neto,c.IVA,c.OtrosImpuestos,c.Total,
       COALESCE(a.ImporteAplicado,0) AS ImporteAplicado,
       CASE WHEN c.Impacto='D' THEN c.Total-COALESCE(a.ImporteAplicado,0) ELSE 0 END AS SaldoPendiente,
       c.Concepto,c.Observaciones,
       (SELECT TOP (1) p.Numero FROM dbo.COMPROBANTES_PROFORMAS cp
        JOIN dbo.PROFORMAS p ON p.Proforma_ID=cp.ProformaID
        WHERE cp.ComprobanteID=c.Comprobante_ID AND cp.Vigente=1
         ORDER BY cp.ComprobanteProforma_ID DESC) AS ProformaNumero,
        (SELECT r.Tipo+'-'+RIGHT('00000000'+CONVERT(varchar(8),r.NumeroCorrelativo),8)
         FROM dbo.COMPROBANTES r WHERE r.Comprobante_ID=c.ComprobanteReferenciaID) AS ComprobanteReferenciaNumero
FROM dbo.COMPROBANTES c
OUTER APPLY (SELECT SUM(ap.Importe) AS ImporteAplicado
             FROM dbo.CUENTA_CORRIENTE_APLICACIONES ap
             WHERE ap.ComprobanteDeudaID=c.Comprobante_ID AND ap.Vigente=1) a
WHERE c.Comprobante_ID=@id;";
                    using (var command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.Add(P("@id", id));
                        using (var reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                comprobante = new ComprobanteImpresion
                                {
                                    ComprobanteID = (int)reader["Comprobante_ID"],
                                    ClienteID = (int)reader["ClienteID"],
                                    Tipo = (string)reader["Tipo"],
                                    Numero = (string)reader["Numero"],
                                    FechaEmision = (DateTime)reader["FechaEmision"],
                                    FechaVencimiento = reader["FechaVencimiento"] == DBNull.Value ? (DateTime?)null : (DateTime)reader["FechaVencimiento"],
                                    Moneda = (string)reader["Moneda"],
                                    EstadoDocumental = (string)reader["EstadoDocumental"],
                                    EstadoFinanciero = (string)reader["EstadoFinanciero"],
                                    RazonSocial = (string)reader["RazonSocial"],
                                    CUIT = (string)reader["CUIT"],
                                    Domicilio = reader["Domicilio"] as string,
                                    CondicionFiscal = reader["CondicionFiscal"] as string,
                                    CondicionComercial = reader["CondicionComercial"] as string,
                                    Subtotal = (decimal)reader["Subtotal"],
                                    Descuentos = (decimal)reader["Descuentos"],
                                    Neto = (decimal)reader["Neto"],
                                    IVA = (decimal)reader["IVA"],
                                    OtrosImpuestos = (decimal)reader["OtrosImpuestos"],
                                    Total = (decimal)reader["Total"],
                                    ImporteAplicado = (decimal)reader["ImporteAplicado"],
                                    SaldoPendiente = (decimal)reader["SaldoPendiente"],
                                    Concepto = (string)reader["Concepto"],
                                    Observaciones = reader["Observaciones"] as string,
                                    ProformaNumero = reader["ProformaNumero"] as string,
                                    ComprobanteReferenciaNumero = reader["ComprobanteReferenciaNumero"] as string,
                                    ComprobantesCancelados = new List<ComprobanteCanceladoImpresion>(),
                                    Detalle = new List<ComprobanteDetalleImpresion>()
                                };
                            }
                        }
                    }
                    if (comprobante == null) return NotFound();

                    const string sqlDetalle = @"
SELECT Orden,Codigo,Concepto,Descripcion,Cantidad,Unidad,PrecioUnitario,DescuentoPct,IvaPct,
       Subtotal,DescuentoImporte,Neto,IVA,Total
FROM dbo.COMPROBANTES_DETALLE
WHERE ComprobanteID=@id ORDER BY Orden,Detalle_ID;";
                    using (var command = new SqlCommand(sqlDetalle, connection))
                    {
                        command.Parameters.Add(P("@id", id));
                        using (var reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                comprobante.Detalle.Add(new ComprobanteDetalleImpresion
                                {
                                    Orden = (int)reader["Orden"],
                                    Codigo = reader["Codigo"] as string,
                                    Concepto = (string)reader["Concepto"],
                                    Descripcion = reader["Descripcion"] as string,
                                    Cantidad = (decimal)reader["Cantidad"],
                                    Unidad = reader["Unidad"] as string,
                                    PrecioUnitario = (decimal)reader["PrecioUnitario"],
                                    DescuentoPct = (decimal)reader["DescuentoPct"],
                                    IvaPct = (decimal)reader["IvaPct"],
                                    Subtotal = (decimal)reader["Subtotal"],
                                    DescuentoImporte = (decimal)reader["DescuentoImporte"],
                                    Neto = (decimal)reader["Neto"],
                                    IVA = (decimal)reader["IVA"],
                                    Total = (decimal)reader["Total"]
                                });
                            }
                        }
                    }
                    const string sqlCancelados = @"
SELECT deuda.Comprobante_ID AS ComprobanteID,
       deuda.Tipo+'-'+RIGHT('00000000'+CONVERT(varchar(8),deuda.NumeroCorrelativo),8) AS Numero,
       deuda.FechaEmision,deuda.Concepto,CAST(ap.Importe AS decimal(18,2)) AS ImporteAplicado
FROM dbo.CUENTA_CORRIENTE_APLICACIONES ap
JOIN dbo.COMPROBANTES deuda ON deuda.Comprobante_ID=ap.ComprobanteDeudaID
WHERE ap.ComprobanteCreditoID=@id AND ap.Vigente=1
ORDER BY ap.Aplicacion_ID;";
                    using (var command = new SqlCommand(sqlCancelados, connection))
                    {
                        command.Parameters.Add(P("@id", id));
                        using (var reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                comprobante.ComprobantesCancelados.Add(new ComprobanteCanceladoImpresion
                                {
                                    ComprobanteID = (int)reader["ComprobanteID"],
                                    Numero = (string)reader["Numero"],
                                    FechaEmision = (DateTime)reader["FechaEmision"],
                                    Concepto = reader["Concepto"] as string,
                                    ImporteAplicado = (decimal)reader["ImporteAplicado"]
                                });
                            }
                        }
                    }
                    return Ok(comprobante);
                }
            }
            catch (AccesoException ex)
            {
                return Content(ex.StatusCode, new { error = ex.Message });
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudo obtener el detalle del comprobante." });
            }
        }

        [HttpGet]
        [Route("proformas/{id:int}/facturacion")]
        public IHttpActionResult ConsultarFacturacion(int id)
        {
            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    ValidarAcceso(connection, null, "CC_CONSULTAR");
                    var proforma = LeerProforma(connection, null, id, false);
                    if (proforma == null) return NotFound();
                    var factura = BuscarFacturaPorProforma(connection, null, id);
                    var detalles = LeerDetalles(connection, null, id);
                    TotalesFactura totales;
                    var errores = ValidarFacturacion(proforma, detalles, out totales);
                    if (factura != null) errores.Insert(0, "La Proforma ya posee una Factura vigente.");
                    return Ok(new
                    {
                        ProformaID = id,
                        proforma.Numero,
                        Facturable = errores.Count == 0,
                        MotivoBloqueo = errores.FirstOrDefault(),
                        Errores = errores,
                        FacturaVigente = factura == null ? null : new
                        {
                            factura.ComprobanteID,
                            Numero = NumeroFactura(factura.NumeroCorrelativo),
                            factura.Total
                        },
                        VersionProforma = Convert.ToBase64String(proforma.Version),
                        TotalCalculado = totales.Total,
                        FechaEmisionProforma = proforma.FechaEmisionProforma,
                        FechaVencimientoSugerida = proforma.FechaVencimientoProforma,
                        Moneda = "ARS"
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
                    new { error = "No se pudo validar la facturación de la Proforma." });
            }
        }

        [HttpPost]
        [Route("facturas/desde-proforma/{id:int}")]
        public IHttpActionResult EmitirDesdeProforma(int id, [FromBody] EmitirFacturaRequest request)
        {
            if (request == null) return BadRequest("Faltan los datos de emisión.");
            if (request.ClaveOperacion == Guid.Empty) return BadRequest("ClaveOperacion es obligatoria.");
            if (!request.FechaEmision.HasValue || !request.FechaVencimiento.HasValue)
                return BadRequest("FechaEmision y FechaVencimiento son obligatorias.");
            DateTime fechaEmision = request.FechaEmision.Value.Date;
            DateTime fechaVencimiento = request.FechaVencimiento.Value.Date;
            if (fechaVencimiento < fechaEmision)
                return BadRequest("FechaVencimiento no puede ser anterior a FechaEmision.");
            if (fechaEmision > FechaArgentina())
                return BadRequest("No se admite una fecha de emisión futura.");
            byte[] versionEsperada;
            try
            {
                versionEsperada = Convert.FromBase64String(request.VersionProforma ?? string.Empty);
                if (versionEsperada.Length != 8) throw new FormatException();
            }
            catch (FormatException)
            {
                return BadRequest("VersionProforma no es válida.");
            }

            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    using (var transaction = connection.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            var usuario = ValidarAcceso(connection, transaction, "FAC_EMITIR");
                            var configuracion = FacturacionComprobantesConfiguracion.Obtener(connection, transaction, "FAC");
                            var letra = request.Letra;
                            var sucursal = request.Sucursal;
                            FacturacionComprobantesConfiguracion.ValidarDatos(connection, transaction, ref letra, ref sucursal, configuracion);
                            request.Letra = letra;
                            request.Sucursal = sucursal;
                            var proforma = LeerProforma(connection, transaction, id, true);
                            if (proforma == null)
                            {
                                transaction.Rollback();
                                return NotFound();
                            }
                            var porClave = BuscarFacturaPorClave(connection, transaction, request.ClaveOperacion);
                            if (porClave != null)
                            {
                                bool mismaOperacion = porClave.Tipo == "FAC" && porClave.ProformaID == id
                                    && porClave.FechaEmision.Date == fechaEmision
                                    && porClave.FechaVencimiento.HasValue && porClave.FechaVencimiento.Value.Date == fechaVencimiento
                                    && string.Equals(porClave.Letra ?? string.Empty, request.Letra ?? string.Empty, StringComparison.Ordinal)
                                    && string.Equals(porClave.Sucursal ?? string.Empty, request.Sucursal ?? string.Empty, StringComparison.Ordinal)
                                    && string.Equals(porClave.Observaciones ?? string.Empty, request.Observaciones ?? string.Empty, StringComparison.Ordinal);
                                if (!mismaOperacion)
                                {
                                    transaction.Rollback();
                                    return Content(HttpStatusCode.Conflict,
                                        new { error = "ClaveOperacion ya fue utilizada con datos diferentes." });
                                }
                                transaction.Commit();
                                return Ok(new
                                {
                                    porClave.ComprobanteID,
                                    porClave.ClienteID,
                                    Numero = NumeroFactura(porClave.NumeroCorrelativo),
                                    porClave.Total,
                                    Estado = "EMITIDO",
                                    Reintento = true
                                });
                            }

                            if (!proforma.Version.SequenceEqual(versionEsperada))
                            {
                                transaction.Rollback();
                                return Content(HttpStatusCode.Conflict,
                                    new { error = "La Proforma fue modificada. Vuelva a consultar antes de facturar." });
                            }
                            var existente = BuscarFacturaPorProforma(connection, transaction, id);
                            if (existente != null)
                            {
                                transaction.Rollback();
                                return Content(HttpStatusCode.Conflict, new
                                {
                                    error = "La Proforma ya posee una Factura vigente.",
                                    ComprobanteID = existente.ComprobanteID,
                                    Numero = NumeroFactura(existente.NumeroCorrelativo)
                                });
                            }
                            var detalles = LeerDetalles(connection, transaction, id);
                            TotalesFactura totales;
                            var errores = ValidarFacturacion(proforma, detalles, out totales);
                            if (errores.Count > 0)
                            {
                                transaction.Rollback();
                                return Content(HttpStatusCode.BadRequest, new { error = errores[0], errores });
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
                                    throw new InvalidOperationException("El numerador de Facturas no existe o está agotado.");
                                correlativo = Convert.ToInt32(value, CultureInfo.InvariantCulture);
                            }

                            int comprobanteId;
                            string concepto = !string.IsNullOrWhiteSpace(proforma.TipoServicio)
                                ? proforma.TipoServicio.Trim()
                                : "Servicio según Proforma " + (proforma.Numero ?? id.ToString(CultureInfo.InvariantCulture));
                            if (!string.IsNullOrWhiteSpace(proforma.Origen) || !string.IsNullOrWhiteSpace(proforma.Destino))
                                concepto += " " + (proforma.Origen ?? string.Empty).Trim() + " → " + (proforma.Destino ?? string.Empty).Trim();
                            using (var command = new SqlCommand(@"
INSERT dbo.COMPROBANTES
 (ClienteID,Tipo,Impacto,NumeroCorrelativo,FechaEmision,FechaVencimiento,Moneda,Estado,
  RazonSocial,CUIT,Domicilio,CondicionFiscal,CondicionComercial,Letra,Sucursal,NumeroComprobante,Subtotal,Descuentos,Neto,IVA,
  OtrosImpuestos,Total,Concepto,Observaciones,ClaveOperacion,UsuarioAltaID,UsuarioEmisionID,FechaEmisionRegistro)
OUTPUT INSERTED.Comprobante_ID
VALUES
 (@cliente,'FAC','D',@numero,@emision,@vencimiento,'ARS','EMITIDO',@razon,@cuit,@domicilio,
  @condFiscal,@condComercial,@letra,@sucursal,@numeroComprobante,@subtotal,@descuentos,@neto,@iva,@otros,@total,@concepto,@observaciones,
  @clave,@usuario,@usuario,SYSUTCDATETIME());", connection, transaction))
                            {
                                command.Parameters.AddRange(new[]
                                {
                                    P("@cliente", proforma.ClienteID),P("@numero", correlativo),P("@emision", fechaEmision),
                                    P("@vencimiento", fechaVencimiento),P("@razon", proforma.RazonSocial),P("@cuit", proforma.CUIT),
                                    P("@domicilio", proforma.Domicilio),P("@condFiscal", proforma.CondicionFiscal),
                                    P("@condComercial", proforma.CondicionComercial),P("@letra", request.Letra),P("@sucursal", request.Sucursal),
                                    P("@numeroComprobante", FacturacionComprobantesConfiguracion.NumeroVisible(correlativo)),P("@subtotal", totales.Subtotal),
                                    P("@descuentos", totales.Descuentos),P("@neto", totales.Neto),P("@iva", totales.IVA),
                                    P("@otros", totales.OtrosImpuestos),P("@total", totales.Total),P("@concepto", concepto),
                                    P("@observaciones", request.Observaciones),P("@clave", request.ClaveOperacion),P("@usuario", usuario.UsuarioID)
                                });
                                comprobanteId = Convert.ToInt32(command.ExecuteScalar(), CultureInfo.InvariantCulture);
                            }

                            foreach (var detalle in detalles)
                            {
                                using (var command = new SqlCommand(@"
INSERT dbo.COMPROBANTES_DETALLE
 (ComprobanteID,Orden,ProformaDetalleID,Codigo,Concepto,Descripcion,Cantidad,Unidad,PrecioUnitario,
  DescuentoPct,IvaPct,Subtotal,DescuentoImporte,Neto,IVA,Total)
VALUES
 (@comprobante,@orden,@proformaDetalle,@codigo,@concepto,@descripcion,@cantidad,@unidad,@precio,
  @descuentoPct,@ivaPct,@subtotal,@descuentoImporte,@neto,@iva,@total);", connection, transaction))
                                {
                                    command.Parameters.AddRange(new[]
                                    {
                                        P("@comprobante", comprobanteId),P("@orden", detalle.Orden),P("@proformaDetalle", detalle.DetalleID),
                                        P("@codigo", detalle.Codigo),P("@concepto", detalle.Concepto),P("@descripcion", detalle.Descripcion),
                                        P("@cantidad", detalle.Cantidad),P("@unidad", detalle.Unidad),P("@precio", detalle.PrecioUnitario),
                                        P("@descuentoPct", detalle.DescuentoPct),P("@ivaPct", detalle.IvaPct),P("@subtotal", detalle.Subtotal),
                                        P("@descuentoImporte", detalle.DescuentoImporte),P("@neto", detalle.Neto),P("@iva", detalle.IVA),
                                        P("@total", detalle.Total)
                                    });
                                    command.ExecuteNonQuery();
                                }
                            }

                            using (var command = new SqlCommand(@"
INSERT dbo.COMPROBANTES_PROFORMAS
 (ComprobanteID,ProformaID,ClienteID,TipoFactura,Vigente,UsuarioAltaID)
VALUES (@comprobante,@proforma,@cliente,'FAC',1,@usuario);

UPDATE dbo.PROFORMAS
SET Estado='Facturada',Usu_Modi=@nombreUsuario,Fecha_Modi=GETDATE()
WHERE Proforma_ID=@proforma AND Estado='Aceptada';
IF @@ROWCOUNT<>1
    THROW 51020, 'No se pudo marcar la Proforma como Facturada.', 1;

-- Los viajes de la Proforma pasan a Facturado al emitirse la Factura (no al generar la Proforma).
UPDATE v SET Estado='Facturado',Usu_Modi=LEFT(@nombreUsuario,20),Fecha_Modi=GETDATE()
FROM dbo.VIAJES v
WHERE (EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID=@proforma AND pv.ViajeID=v.Viaje_ID)
    OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd WHERE pd.Proforma_ID=@proforma
               AND UPPER(LTRIM(RTRIM(ISNULL(pd.Codigo,''))))='V'+CONVERT(varchar(11),v.Viaje_ID)));

INSERT dbo.CUENTA_CORRIENTE_MOVIMIENTOS
 (ComprobanteID,ClienteID,Tipo,Clase,Impacto,Importe,FechaContable,Concepto,UsuarioAltaID)
VALUES (@comprobante,@cliente,'FAC','EMISION','D',@total,@fecha,@concepto,@usuario);

INSERT dbo.AUDITORIA
 (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen)
VALUES
 (GETDATE(),@nombreUsuario,'EMITIR','COMPROBANTES',@claveAuditoria,NULL,@detalleAuditoria,'Cuenta Corriente'),
 (GETDATE(),@nombreUsuario,'ESTADO','PROFORMAS',@claveProformaAuditoria,'Estado=Aceptada','Estado=Facturada','Facturacion');", connection, transaction))
                            {
                                command.Parameters.AddRange(new[]
                                {
                                    P("@comprobante", comprobanteId),P("@proforma", id),P("@cliente", proforma.ClienteID),
                                    P("@usuario", usuario.UsuarioID),P("@total", totales.Total),P("@fecha", fechaEmision),
                                    P("@concepto", concepto),P("@nombreUsuario", usuario.NombreUsuario),
                                    P("@claveAuditoria", "Comprobante_ID=" + comprobanteId),
                                    P("@claveProformaAuditoria", "Proforma_ID=" + id),
                                    P("@detalleAuditoria", "Factura " + NumeroFactura(correlativo) + " desde Proforma_ID=" + id)
                                });
                                command.ExecuteNonQuery();
                            }

                            transaction.Commit();
                            return Content(HttpStatusCode.Created, new
                            {
                                ComprobanteID = comprobanteId,
                                Numero = NumeroFactura(correlativo),
                                Tipo = "FAC",
                                Estado = "EMITIDO",
                                ClienteID = proforma.ClienteID,
                                ProformaID = id,
                                FechaEmision = fechaEmision,
                                FechaVencimiento = fechaVencimiento,
                                Total = totales.Total,
                                Moneda = "ARS"
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
                    new { error = "La Factura ya fue creada o la operación se procesó en paralelo." });
            }
            catch (InvalidOperationException ex)
            {
                return Content(HttpStatusCode.Conflict, new { error = ex.Message });
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudo emitir la Factura. Ningún cambio fue confirmado." });
            }
        }
    }
}
