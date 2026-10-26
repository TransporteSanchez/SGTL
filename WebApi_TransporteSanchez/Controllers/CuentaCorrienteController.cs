using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api")]
    public class CuentaCorrienteController : ApiController
    {
        public class ClienteCuentaDto
        {
            public int ClienteID { get; set; }
            public string RazonSocial { get; set; }
            public string CUIT { get; set; }
            public bool EstadoCliente { get; set; }
            public decimal Saldo { get; set; }
        }

        public class SaldoCuentaDto
        {
            public int ClienteID { get; set; }
            public string RazonSocial { get; set; }
            public string CUIT { get; set; }
            public decimal SaldoActual { get; set; }
            public decimal DeudaVencida { get; set; }
            public int CantidadVencidos { get; set; }
            public DateTime? ProximoVencimiento { get; set; }
            public string ProximoComprobante { get; set; }
            public decimal? ProximoImporte { get; set; }
            public string Moneda { get; set; }
            public DateTime FechaConsulta { get; set; }
        }

        public class MovimientoCuentaDto
        {
            public int MovimientoID { get; set; }
            public int ComprobanteID { get; set; }
            public int ClienteID { get; set; }
            public string Cliente { get; set; }
            public DateTime Fecha { get; set; }
            public string Tipo { get; set; }
            public string Comprobante { get; set; }
            public string Concepto { get; set; }
            public decimal Debe { get; set; }
            public decimal Haber { get; set; }
            public decimal Cancelado { get; set; }
            public decimal Saldo { get; set; }
            public string Estado { get; set; }
            public string EstadoComprobante { get; set; }
            public string Origen { get; set; }
            public List<AplicacionCuentaDto> Aplicaciones { get; set; }
        }

        public class AplicacionCuentaDto
        {
            public int AplicacionID { get; set; }
            public int ComprobanteDeudaID { get; set; }
            public int ComprobanteID { get; set; }
            public int ClienteID { get; set; }
            public string Cliente { get; set; }
            public DateTime Fecha { get; set; }
            public string Tipo { get; set; }
            public string Comprobante { get; set; }
            public string Concepto { get; set; }
            public decimal Importe { get; set; }
            public string Estado { get; set; }
            public string EstadoComprobante { get; set; }
        }

        public class PendienteCuentaDto
        {
            public int ComprobanteID { get; set; }
            public int ClienteID { get; set; }
            public string Cliente { get; set; }
            public string Tipo { get; set; }
            public string Comprobante { get; set; }
            public DateTime FechaEmision { get; set; }
            public DateTime? FechaVencimiento { get; set; }
            public decimal ImporteOriginal { get; set; }
            public decimal ImporteAplicado { get; set; }
            public decimal SaldoPendiente { get; set; }
            public string Situacion { get; set; }
            public string Estado { get; set; }
            public string Origen { get; set; }
        }

        public class TopClienteFacturacionDto
        {
            public int ClienteID { get; set; }
            public string RazonSocial { get; set; }
            public decimal Facturacion { get; set; }
        }

        private static string Cn()
        {
            return ConnectionStringHelper.GetConnectionString("SGTLEntities");
        }

        private static SqlParameter P(string name, object value)
        {
            return new SqlParameter(name, value ?? DBNull.Value);
        }

        private static SqlParameter PEntero(string name, int? value)
        {
            return new SqlParameter(name, System.Data.SqlDbType.Int)
            {
                Value = value.HasValue ? (object)value.Value : DBNull.Value
            };
        }

        private static bool ClienteExiste(DbContext db, int clienteId)
        {
            return db.Database.SqlQuery<int>(
                "SELECT COUNT(1) FROM dbo.CLIENTES WHERE Cliente_ID=@clienteId AND ISNULL(EstadoCliente,0)=1",
                P("@clienteId", clienteId)).First() > 0;
        }

        [HttpGet]
        [Route("dashboard/top-clientes-facturacion")]
        public IHttpActionResult ObtenerTopClientesFacturacion(int cantidad = 5)
        {
            try
            {
                cantidad = Math.Max(1, Math.Min(cantidad, 20));

                using (var db = new DbContext(Cn()))
                {
                    const string sql = @"
SELECT TOP (@cantidad)
       c.Cliente_ID AS ClienteID,
       COALESCE(NULLIF(LTRIM(RTRIM(c.Razon_Social)), ''), 'Sin nombre') AS RazonSocial,
       CONVERT(decimal(18,2), SUM(CASE WHEN comp.Tipo = 'NC' THEN -comp.Total ELSE comp.Total END)) AS Facturacion
FROM dbo.COMPROBANTES comp
JOIN dbo.CLIENTES c ON c.Cliente_ID = comp.ClienteID
WHERE comp.Estado = 'EMITIDO'
  AND comp.Tipo IN ('FAC', 'ND', 'NC')
GROUP BY c.Cliente_ID, c.Razon_Social
ORDER BY Facturacion DESC, RazonSocial;";

                    return Ok(db.Database.SqlQuery<TopClienteFacturacionDto>(sql, P("@cantidad", cantidad)).ToList());
                }
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudo calcular el ranking de clientes facturados." });
            }
        }

        [HttpGet]
        [Route("cuenta-corriente/clientes")]
        public IHttpActionResult ListarClientes(string buscar = null)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var texto = string.IsNullOrWhiteSpace(buscar) ? null : "%" + buscar.Trim() + "%";
                    const string sql = @"
SELECT c.Cliente_ID AS ClienteID, c.Razon_Social AS RazonSocial,
       c.CUIT_Cliente AS CUIT, c.EstadoCliente AS EstadoCliente,
       CAST(COALESCE(SUM(CASE WHEN m.Impacto='D' THEN m.Importe ELSE -m.Importe END),0) AS decimal(18,2)) AS Saldo
FROM dbo.CLIENTES c
LEFT JOIN dbo.CUENTA_CORRIENTE_MOVIMIENTOS m ON m.ClienteID=c.Cliente_ID
WHERE ISNULL(c.EstadoCliente,0)=1
  AND (@buscar IS NULL OR c.Razon_Social LIKE @buscar OR c.CUIT_Cliente LIKE @buscar)
GROUP BY c.Cliente_ID,c.Razon_Social,c.CUIT_Cliente,c.EstadoCliente
ORDER BY c.Razon_Social;";
                    return Ok(db.Database.SqlQuery<ClienteCuentaDto>(sql, P("@buscar", texto)).ToList());
                }
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudieron listar los clientes." });
            }
        }

        [HttpGet]
        [Route("clientes/{clienteId:int}/saldo")]
        public IHttpActionResult ObtenerSaldo(int clienteId)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    if (!ClienteExiste(db, clienteId)) return NotFound();

                    const string sql = @"
WITH Deudas AS (
    SELECT c.Comprobante_ID,c.ClienteID,c.Tipo,c.NumeroCorrelativo,c.Letra,c.Sucursal,c.FechaVencimiento,c.Total,
           c.Total-COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) AS Pendiente
    FROM dbo.COMPROBANTES c
    JOIN dbo.CLIENTES cl ON cl.Cliente_ID=c.ClienteID AND ISNULL(cl.EstadoCliente,0)=1
    LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteDeudaID=c.Comprobante_ID
    WHERE c.ClienteID=@clienteId AND c.Estado='EMITIDO' AND c.Impacto='D'
    GROUP BY c.Comprobante_ID,c.ClienteID,c.Tipo,c.NumeroCorrelativo,c.Letra,c.Sucursal,c.FechaVencimiento,c.Total
), Proximo AS (
    SELECT TOP (1) FechaVencimiento,
           Tipo+'-'+Letra+'-'+Sucursal+'-'+RIGHT('00000000'+CONVERT(varchar(8),NumeroCorrelativo),8) AS Comprobante,
           Pendiente
    FROM Deudas WHERE Pendiente>0 AND FechaVencimiento>=CONVERT(date,GETDATE())
    ORDER BY FechaVencimiento,Comprobante_ID
)
SELECT c.Cliente_ID AS ClienteID,c.Razon_Social AS RazonSocial,c.CUIT_Cliente AS CUIT,
       CAST(COALESCE((SELECT SUM(CASE WHEN Impacto='D' THEN Importe ELSE -Importe END)
                              FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS WHERE ClienteID=c.Cliente_ID),0) AS decimal(18,2)) AS SaldoActual,
       CAST(COALESCE((SELECT SUM(Pendiente) FROM Deudas
                      WHERE Pendiente>0 AND FechaVencimiento<CONVERT(date,GETDATE())),0) AS decimal(18,2)) AS DeudaVencida,
       (SELECT COUNT(1) FROM Deudas WHERE Pendiente>0 AND FechaVencimiento<CONVERT(date,GETDATE())) AS CantidadVencidos,
       p.FechaVencimiento AS ProximoVencimiento,p.Comprobante AS ProximoComprobante,
       CAST(p.Pendiente AS decimal(18,2)) AS ProximoImporte,'ARS' AS Moneda,GETDATE() AS FechaConsulta
FROM dbo.CLIENTES c OUTER APPLY (SELECT * FROM Proximo) p
WHERE c.Cliente_ID=@clienteId;";
                    var result = db.Database.SqlQuery<SaldoCuentaDto>(sql, P("@clienteId", clienteId)).First();
                    return Ok(result);
                }
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudo calcular el saldo del cliente." });
            }
        }

        [HttpGet]
        [Route("cuenta-corriente/saldo")]
        public IHttpActionResult ObtenerSaldoGeneral()
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    const string sql = @"
WITH Deudas AS (
    SELECT c.Comprobante_ID,c.ClienteID,c.Tipo,c.NumeroCorrelativo,c.Letra,c.Sucursal,c.FechaVencimiento,c.Total,
           c.Total-COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) AS Pendiente
    FROM dbo.COMPROBANTES c
    JOIN dbo.CLIENTES cliente ON cliente.Cliente_ID=c.ClienteID AND ISNULL(cliente.EstadoCliente,0)=1
    LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteDeudaID=c.Comprobante_ID
    WHERE c.Estado='EMITIDO' AND c.Impacto='D'
    GROUP BY c.Comprobante_ID,c.ClienteID,c.Tipo,c.NumeroCorrelativo,c.Letra,c.Sucursal,c.FechaVencimiento,c.Total
), Proximo AS (
    SELECT TOP (1) d.FechaVencimiento,
           cl.Razon_Social+' · '+d.Tipo+'-'+d.Letra+'-'+d.Sucursal+'-'+RIGHT('00000000'+CONVERT(varchar(8),d.NumeroCorrelativo),8) AS Comprobante,
           d.Pendiente
    FROM Deudas d
    JOIN dbo.CLIENTES cl ON cl.Cliente_ID=d.ClienteID AND ISNULL(cl.EstadoCliente,0)=1
    WHERE d.Pendiente>0 AND d.FechaVencimiento>=CONVERT(date,GETDATE())
    ORDER BY d.FechaVencimiento,d.Comprobante_ID
)
SELECT CAST(0 AS int) AS ClienteID,'Todos los clientes' AS RazonSocial,NULL AS CUIT,
       CAST(COALESCE((SELECT SUM(CASE WHEN Impacto='D' THEN Importe ELSE -Importe END)
                      FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS m
                      JOIN dbo.CLIENTES cl ON cl.Cliente_ID=m.ClienteID
                      WHERE ISNULL(cl.EstadoCliente,0)=1),0) AS decimal(18,2)) AS SaldoActual,
       CAST(COALESCE((SELECT SUM(Pendiente) FROM Deudas
                      WHERE Pendiente>0 AND FechaVencimiento<CONVERT(date,GETDATE())),0) AS decimal(18,2)) AS DeudaVencida,
       (SELECT COUNT(1) FROM Deudas WHERE Pendiente>0 AND FechaVencimiento<CONVERT(date,GETDATE())) AS CantidadVencidos,
       p.FechaVencimiento AS ProximoVencimiento,p.Comprobante AS ProximoComprobante,
       CAST(p.Pendiente AS decimal(18,2)) AS ProximoImporte,'ARS' AS Moneda,GETDATE() AS FechaConsulta
FROM (SELECT 1 AS Valor) x
OUTER APPLY (SELECT * FROM Proximo) p;";
                    return Ok(db.Database.SqlQuery<SaldoCuentaDto>(sql).First());
                }
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudo calcular el saldo general." });
            }
        }

        [HttpGet]
        [Route("clientes/{clienteId:int}/cuenta-corriente")]
        public IHttpActionResult ObtenerMovimientos(int clienteId, DateTime? desde = null, DateTime? hasta = null,
            string tipo = null, string estado = null, int page = 1, int pageSize = 50)
        {
            return ConsultarMovimientos(clienteId, desde, hasta, tipo, estado, page, pageSize);
        }

        [HttpGet]
        [Route("cuenta-corriente/movimientos")]
        public IHttpActionResult ObtenerMovimientosGenerales(DateTime? desde = null, DateTime? hasta = null,
            string tipo = null, string estado = null, int page = 1, int pageSize = 50)
        {
            return ConsultarMovimientos(null, desde, hasta, tipo, estado, page, pageSize);
        }

        private IHttpActionResult ConsultarMovimientos(int? clienteId, DateTime? desde, DateTime? hasta,
            string tipo, string estado, int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 0 || pageSize > 200) pageSize = 50;
            if (desde.HasValue && hasta.HasValue && desde.Value.Date > hasta.Value.Date)
                return BadRequest("La fecha desde no puede ser posterior a la fecha hasta.");

            try
            {
                using (var db = new DbContext(Cn()))
                {
                    if (clienteId.HasValue && !ClienteExiste(db, clienteId.Value)) return NotFound();
                    var parameters = new[]
                    {
                        PEntero("@clienteId", clienteId), P("@desde", desde.HasValue ? (object)desde.Value.Date : null),
                        P("@hasta", hasta.HasValue ? (object)hasta.Value.Date : null),
                        P("@tipo", string.IsNullOrWhiteSpace(tipo) ? null : tipo.Trim().ToUpperInvariant()),
                        P("@estado", string.IsNullOrWhiteSpace(estado) ? null : estado.Trim()),
                        P("@offset", (page - 1) * pageSize), P("@pageSize", pageSize)
                    };
                    const string cte = @"
WITH Aplicado AS (
    SELECT ComprobanteDeudaID AS ComprobanteID,SUM(Importe) AS Importe
    FROM dbo.CUENTA_CORRIENTE_APLICACIONES WHERE Vigente=1 GROUP BY ComprobanteDeudaID
), Documentos AS (
    SELECT m.Movimiento_ID,m.ComprobanteID,m.ClienteID,cl.Razon_Social AS Cliente,
           m.FechaContable,m.Tipo,m.Concepto,c.NumeroCorrelativo,c.Letra,c.Sucursal,c.Total,c.Estado AS EstadoComprobante,c.Impacto,
           COALESCE(a.Importe,0) AS Cancelado,c.Total-COALESCE(a.Importe,0) AS Saldo,
           CASE WHEN c.Estado='ANULADO' THEN 'Anulado'
                WHEN c.Impacto='D' AND COALESCE(a.Importe,0)=0 THEN 'Pendiente'
                WHEN c.Impacto='D' AND COALESCE(a.Importe,0)<c.Total THEN 'Parcial'
                WHEN c.Impacto='D' THEN 'Cancelado'
                ELSE 'Aplicado' END AS EstadoFinanciero,
           COALESCE((SELECT TOP (1) 'Proforma '+p.Numero FROM dbo.COMPROBANTES_PROFORMAS cp
                     JOIN dbo.PROFORMAS p ON p.Proforma_ID=cp.ProformaID
                     WHERE cp.ComprobanteID=c.Comprobante_ID ORDER BY cp.ComprobanteProforma_ID DESC),
                    (SELECT 'Relacionado con '+r.Tipo+'-'+r.Letra+'-'+r.Sucursal+'-'+RIGHT('00000000'+CONVERT(varchar(8),r.NumeroCorrelativo),8)
                     FROM dbo.COMPROBANTES r WHERE r.Comprobante_ID=c.ComprobanteReferenciaID)) AS Origen
    FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS m
    JOIN dbo.COMPROBANTES c ON c.Comprobante_ID=m.ComprobanteID
    JOIN dbo.CLIENTES cl ON cl.Cliente_ID=m.ClienteID AND ISNULL(cl.EstadoCliente,0)=1
    LEFT JOIN Aplicado a ON a.ComprobanteID=c.Comprobante_ID
    WHERE (@clienteId IS NULL OR m.ClienteID=@clienteId) AND m.Clase='EMISION'
      AND (c.Impacto='D' OR (c.Tipo='REC' AND c.Estado='ANULADO'))
), Filtrados AS (
    SELECT * FROM Documentos d
    WHERE (@desde IS NULL OR FechaContable>=@desde) AND (@hasta IS NULL OR FechaContable<=@hasta)
      AND (@tipo IS NULL OR Tipo=@tipo OR EXISTS (
          SELECT 1 FROM dbo.CUENTA_CORRIENTE_APLICACIONES ap
          JOIN dbo.COMPROBANTES credito ON credito.Comprobante_ID=ap.ComprobanteCreditoID
          WHERE ap.ComprobanteDeudaID=d.ComprobanteID AND ap.Vigente=1 AND credito.Tipo=@tipo
      ))
      AND (@estado IS NULL OR EstadoFinanciero=@estado)
) ";
                    var countParameters = new[]
                    {
                        PEntero("@clienteId", clienteId),
                        P("@desde", desde.HasValue ? (object)desde.Value.Date : null),
                        P("@hasta", hasta.HasValue ? (object)hasta.Value.Date : null),
                        P("@tipo", string.IsNullOrWhiteSpace(tipo) ? null : tipo.Trim().ToUpperInvariant()),
                        P("@estado", string.IsNullOrWhiteSpace(estado) ? null : estado.Trim())
                    };
                    int total = db.Database.SqlQuery<int>(cte + "SELECT COUNT(1) FROM Filtrados;", countParameters).First();
                    if (pageSize == 0)
                    {
                        page = 1;
                        pageSize = Math.Max(total, 1);
                        parameters[5].Value = 0;
                        parameters[6].Value = pageSize;
                    }
                    string sql = cte + @"
SELECT Movimiento_ID AS MovimientoID,ComprobanteID,ClienteID,Cliente,FechaContable AS Fecha,Tipo,
       Tipo+'-'+Letra+'-'+Sucursal+'-'+RIGHT('00000000'+CONVERT(varchar(8),NumeroCorrelativo),8) AS Comprobante,
       Concepto,CAST(Total AS decimal(18,2)) AS Debe,CAST(0 AS decimal(18,2)) AS Haber,
       CAST(CASE WHEN Impacto='C' THEN Total ELSE Cancelado END AS decimal(18,2)) AS Cancelado,
       CAST(CASE WHEN Impacto='C' THEN 0 ELSE Saldo END AS decimal(18,2)) AS Saldo,
       EstadoFinanciero AS Estado,EstadoComprobante,
       COALESCE(Origen,'Comprobante directo') AS Origen
FROM Filtrados ORDER BY FechaContable,Movimiento_ID
OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;";
                    var items = db.Database.SqlQuery<MovimientoCuentaDto>(sql, parameters).ToList();

                    var aplicaciones = db.Database.SqlQuery<AplicacionCuentaDto>(@"
SELECT a.Aplicacion_ID AS AplicacionID,a.ComprobanteDeudaID,
       credito.Comprobante_ID AS ComprobanteID,credito.ClienteID,cl.Razon_Social AS Cliente,
       a.FechaAplicacion AS Fecha,credito.Tipo,
       credito.Tipo+'-'+credito.Letra+'-'+credito.Sucursal+'-'+RIGHT('00000000'+CONVERT(varchar(8),credito.NumeroCorrelativo),8) AS Comprobante,
       credito.Concepto,CAST(a.Importe AS decimal(18,2)) AS Importe,'Aplicado' AS Estado,credito.Estado AS EstadoComprobante
FROM dbo.CUENTA_CORRIENTE_APLICACIONES a
JOIN dbo.COMPROBANTES credito ON credito.Comprobante_ID=a.ComprobanteCreditoID
JOIN dbo.CLIENTES cl ON cl.Cliente_ID=credito.ClienteID
WHERE (@clienteId IS NULL OR a.ClienteID=@clienteId) AND a.Vigente=1 AND ISNULL(cl.EstadoCliente,0)=1
ORDER BY a.FechaAplicacion,a.Aplicacion_ID;", PEntero("@clienteId", clienteId)).ToList();
                    foreach (var item in items)
                    {
                        item.Aplicaciones = aplicaciones
                            .Where(x => x.ComprobanteDeudaID == item.ComprobanteID)
                            .ToList();
                    }

                    decimal saldoAnterior = 0;
                    if (desde.HasValue)
                    {
                        saldoAnterior = db.Database.SqlQuery<decimal>(@"
SELECT CAST(COALESCE(SUM(CASE WHEN Impacto='D' THEN Importe ELSE -Importe END),0) AS decimal(18,2))
FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS m
JOIN dbo.CLIENTES cl ON cl.Cliente_ID=m.ClienteID
WHERE (@clienteId IS NULL OR m.ClienteID=@clienteId) AND ISNULL(cl.EstadoCliente,0)=1 AND m.FechaContable<@desde;",
                            PEntero("@clienteId", clienteId), P("@desde", desde.Value.Date)).First();
                    }
                    decimal saldoActual = db.Database.SqlQuery<decimal>(@"
SELECT CAST(COALESCE(SUM(CASE WHEN Impacto='D' THEN Importe ELSE -Importe END),0) AS decimal(18,2))
FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS m
JOIN dbo.CLIENTES cl ON cl.Cliente_ID=m.ClienteID
WHERE (@clienteId IS NULL OR m.ClienteID=@clienteId) AND ISNULL(cl.EstadoCliente,0)=1;", PEntero("@clienteId", clienteId)).First();

                    return Ok(new
                    {
                        items,
                        total,
                        page,
                        pageSize,
                        totalPages = (int)Math.Ceiling(total / (double)pageSize),
                        saldoAnterior,
                        saldoActual,
                        moneda = "ARS"
                    });
                }
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudo consultar la cuenta corriente." });
            }
        }

        [HttpGet]
        [Route("clientes/{clienteId:int}/comprobantes-pendientes")]
        public IHttpActionResult ObtenerPendientes(int clienteId)
        {
            return ConsultarPendientes(clienteId);
        }

        [HttpGet]
        [Route("cuenta-corriente/pendientes")]
        public IHttpActionResult ObtenerPendientesGenerales()
        {
            return ConsultarPendientes(null);
        }

        private IHttpActionResult ConsultarPendientes(int? clienteId)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    if (clienteId.HasValue && !ClienteExiste(db, clienteId.Value)) return NotFound();
                    const string sql = @"
WITH SinRelacionar AS (
    SELECT c.Comprobante_ID,c.ClienteID,cl.Razon_Social AS Cliente,c.Tipo,c.NumeroCorrelativo,c.Letra,c.Sucursal,c.FechaEmision,c.FechaVencimiento,c.Total,
           COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) AS Aplicado,
           COALESCE((SELECT TOP (1) 'Proforma '+p.Numero FROM dbo.COMPROBANTES_PROFORMAS cp
                     JOIN dbo.PROFORMAS p ON p.Proforma_ID=cp.ProformaID
                     WHERE cp.ComprobanteID=c.Comprobante_ID ORDER BY cp.ComprobanteProforma_ID DESC),
                    (SELECT 'Relacionado con '+r.Tipo+'-'+r.Letra+'-'+r.Sucursal+'-'+RIGHT('00000000'+CONVERT(varchar(8),r.NumeroCorrelativo),8)
                     FROM dbo.COMPROBANTES r WHERE r.Comprobante_ID=c.ComprobanteReferenciaID)) AS Origen
    FROM dbo.COMPROBANTES c
    JOIN dbo.CLIENTES cl ON cl.Cliente_ID=c.ClienteID AND ISNULL(cl.EstadoCliente,0)=1
    LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteDeudaID=c.Comprobante_ID
    WHERE (@clienteId IS NULL OR c.ClienteID=@clienteId) AND c.Estado='EMITIDO' AND c.Impacto='D'
    GROUP BY c.Comprobante_ID,c.ClienteID,cl.Razon_Social,c.Tipo,c.NumeroCorrelativo,c.Letra,c.Sucursal,c.FechaEmision,c.FechaVencimiento,c.Total,
             c.ComprobanteReferenciaID
    UNION ALL
    SELECT c.Comprobante_ID,c.ClienteID,cl.Razon_Social AS Cliente,c.Tipo,c.NumeroCorrelativo,c.Letra,c.Sucursal,c.FechaEmision,c.FechaVencimiento,c.Total,
           COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) AS Aplicado,
           CAST(NULL AS varchar(200)) AS Origen
    FROM dbo.COMPROBANTES c
    JOIN dbo.CLIENTES cl ON cl.Cliente_ID=c.ClienteID AND ISNULL(cl.EstadoCliente,0)=1
    LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteCreditoID=c.Comprobante_ID
    WHERE (@clienteId IS NULL OR c.ClienteID=@clienteId) AND c.Estado='EMITIDO'
      AND c.Tipo='REC' AND c.Impacto='C'
    GROUP BY c.Comprobante_ID,c.ClienteID,cl.Razon_Social,c.Tipo,c.NumeroCorrelativo,c.Letra,c.Sucursal,c.FechaEmision,c.FechaVencimiento,c.Total
)
SELECT Comprobante_ID AS ComprobanteID,ClienteID,Cliente,Tipo,
       Tipo+'-'+Letra+'-'+Sucursal+'-'+RIGHT('00000000'+CONVERT(varchar(8),NumeroCorrelativo),8) AS Comprobante,
       FechaEmision,FechaVencimiento,CAST(Total AS decimal(18,2)) AS ImporteOriginal,
       CAST(Aplicado AS decimal(18,2)) AS ImporteAplicado,
       CAST(Total-Aplicado AS decimal(18,2)) AS SaldoPendiente,
       CASE WHEN Tipo='REC' AND Aplicado=0 THEN 'Sin imputar'
            WHEN Tipo='REC' THEN 'Parcialmente imputado'
            WHEN FechaVencimiento<CONVERT(date,GETDATE())
            THEN 'Vencido '+CONVERT(varchar(12),DATEDIFF(day,FechaVencimiento,CONVERT(date,GETDATE())))+' días'
            ELSE 'Vigente' END AS Situacion,
       CASE WHEN Aplicado=0 THEN 'Pendiente' ELSE 'Parcial' END AS Estado,
       COALESCE(Origen,'Comprobante directo') AS Origen
FROM SinRelacionar WHERE Total-Aplicado>0
ORDER BY CASE WHEN Tipo='REC' THEN 1 ELSE 0 END,FechaVencimiento,FechaEmision,Comprobante_ID;";
                    return Ok(db.Database.SqlQuery<PendienteCuentaDto>(sql, PEntero("@clienteId", clienteId)).ToList());
                }
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudieron consultar los comprobantes pendientes." });
            }
        }
    }
}
