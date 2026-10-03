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
            public bool Activo { get; set; }
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
            public DateTime Fecha { get; set; }
            public string Tipo { get; set; }
            public string Comprobante { get; set; }
            public string Concepto { get; set; }
            public decimal Debe { get; set; }
            public decimal Haber { get; set; }
            public decimal Saldo { get; set; }
            public string Estado { get; set; }
            public string Origen { get; set; }
        }

        public class PendienteCuentaDto
        {
            public int ComprobanteID { get; set; }
            public string Tipo { get; set; }
            public string Comprobante { get; set; }
            public DateTime FechaEmision { get; set; }
            public DateTime FechaVencimiento { get; set; }
            public decimal ImporteOriginal { get; set; }
            public decimal ImporteAplicado { get; set; }
            public decimal SaldoPendiente { get; set; }
            public string Situacion { get; set; }
            public string Estado { get; set; }
            public string Origen { get; set; }
        }

        private static string Cn()
        {
            return ConnectionStringHelper.GetConnectionString("SGTLEntities");
        }

        private static SqlParameter P(string name, object value)
        {
            return new SqlParameter(name, value ?? DBNull.Value);
        }

        private static bool ClienteExiste(DbContext db, int clienteId)
        {
            return db.Database.SqlQuery<int>(
                "SELECT COUNT(1) FROM dbo.CLIENTES WHERE Cliente_ID=@clienteId",
                P("@clienteId", clienteId)).First() > 0;
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
       c.CUIT_Cliente AS CUIT, c.Activo,
       CAST(COALESCE(SUM(CASE WHEN m.Impacto='D' THEN m.Importe ELSE -m.Importe END),0) AS decimal(18,2)) AS Saldo
FROM dbo.CLIENTES c
LEFT JOIN dbo.CUENTA_CORRIENTE_MOVIMIENTOS m ON m.ClienteID=c.Cliente_ID
WHERE (@buscar IS NULL OR c.Razon_Social LIKE @buscar OR c.CUIT_Cliente LIKE @buscar)
GROUP BY c.Cliente_ID,c.Razon_Social,c.CUIT_Cliente,c.Activo
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
    SELECT c.Comprobante_ID,c.ClienteID,c.Tipo,c.NumeroCorrelativo,c.FechaVencimiento,c.Total,
           c.Total-COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) AS Pendiente
    FROM dbo.COMPROBANTES c
    LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteDeudaID=c.Comprobante_ID
    WHERE c.ClienteID=@clienteId AND c.Estado='EMITIDO' AND c.Impacto='D'
    GROUP BY c.Comprobante_ID,c.ClienteID,c.Tipo,c.NumeroCorrelativo,c.FechaVencimiento,c.Total
), Proximo AS (
    SELECT TOP (1) FechaVencimiento,
           Tipo+'-'+RIGHT('00000000'+CONVERT(varchar(8),NumeroCorrelativo),8) AS Comprobante,
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
        [Route("clientes/{clienteId:int}/cuenta-corriente")]
        public IHttpActionResult ObtenerMovimientos(int clienteId, DateTime? desde = null, DateTime? hasta = null,
            string tipo = null, string estado = null, int page = 1, int pageSize = 50)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 200) pageSize = 50;
            if (desde.HasValue && hasta.HasValue && desde.Value.Date > hasta.Value.Date)
                return BadRequest("La fecha desde no puede ser posterior a la fecha hasta.");

            try
            {
                using (var db = new DbContext(Cn()))
                {
                    if (!ClienteExiste(db, clienteId)) return NotFound();
                    var parameters = new[]
                    {
                        P("@clienteId", clienteId), P("@desde", desde.HasValue ? (object)desde.Value.Date : null),
                        P("@hasta", hasta.HasValue ? (object)hasta.Value.Date : null),
                        P("@tipo", string.IsNullOrWhiteSpace(tipo) ? null : tipo.Trim().ToUpperInvariant()),
                        P("@estado", string.IsNullOrWhiteSpace(estado) ? null : estado.Trim()),
                        P("@offset", (page - 1) * pageSize), P("@pageSize", pageSize)
                    };
                    const string cte = @"
WITH Aplicado AS (
    SELECT ComprobanteDeudaID AS ComprobanteID,SUM(Importe) AS Importe
    FROM dbo.CUENTA_CORRIENTE_APLICACIONES WHERE Vigente=1 GROUP BY ComprobanteDeudaID
), Movimientos AS (
    SELECT m.Movimiento_ID,m.ComprobanteID,m.FechaContable,m.Tipo,m.Concepto,m.Impacto,m.Importe,
           c.NumeroCorrelativo,c.Estado AS EstadoDocumental,c.Total,
           SUM(CASE WHEN m.Impacto='D' THEN m.Importe ELSE -m.Importe END)
               OVER (ORDER BY m.FechaContable,m.Movimiento_ID ROWS UNBOUNDED PRECEDING) AS Saldo,
           CASE WHEN c.Estado='ANULADO' THEN 'Anulado'
                WHEN c.Impacto='D' AND COALESCE(a.Importe,0)=0 THEN 'Pendiente'
                WHEN c.Impacto='D' AND COALESCE(a.Importe,0)<c.Total THEN 'Parcial'
                WHEN c.Impacto='D' THEN 'Cancelado'
                ELSE 'Aplicado' END AS EstadoFinanciero,
           (SELECT TOP (1) 'Proforma '+p.Numero FROM dbo.COMPROBANTES_PROFORMAS cp
            JOIN dbo.PROFORMAS p ON p.Proforma_ID=cp.ProformaID
            WHERE cp.ComprobanteID=c.Comprobante_ID ORDER BY cp.ComprobanteProforma_ID DESC) AS Origen
    FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS m
    JOIN dbo.COMPROBANTES c ON c.Comprobante_ID=m.ComprobanteID
    LEFT JOIN Aplicado a ON a.ComprobanteID=c.Comprobante_ID
    WHERE m.ClienteID=@clienteId
), Filtrados AS (
    SELECT * FROM Movimientos
    WHERE (@desde IS NULL OR FechaContable>=@desde) AND (@hasta IS NULL OR FechaContable<=@hasta)
      AND (@tipo IS NULL OR Tipo=@tipo) AND (@estado IS NULL OR EstadoFinanciero=@estado)
) ";
                    string sql = cte + @"
SELECT Movimiento_ID AS MovimientoID,ComprobanteID,FechaContable AS Fecha,Tipo,
       Tipo+'-'+RIGHT('00000000'+CONVERT(varchar(8),NumeroCorrelativo),8) AS Comprobante,
       Concepto,CAST(CASE WHEN Impacto='D' THEN Importe ELSE 0 END AS decimal(18,2)) AS Debe,
       CAST(CASE WHEN Impacto='C' THEN Importe ELSE 0 END AS decimal(18,2)) AS Haber,
       CAST(Saldo AS decimal(18,2)) AS Saldo,EstadoFinanciero AS Estado,
       COALESCE(Origen,'Comprobante directo') AS Origen
FROM Filtrados ORDER BY FechaContable,Movimiento_ID
OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;";
                    var items = db.Database.SqlQuery<MovimientoCuentaDto>(sql, parameters).ToList();

                    var countParameters = parameters.Take(5).Select(x => P(x.ParameterName, x.Value == DBNull.Value ? null : x.Value)).ToArray();
                    int total = db.Database.SqlQuery<int>(cte + "SELECT COUNT(1) FROM Filtrados;", countParameters).First();
                    decimal saldoAnterior = 0;
                    if (desde.HasValue)
                    {
                        saldoAnterior = db.Database.SqlQuery<decimal>(@"
SELECT CAST(COALESCE(SUM(CASE WHEN Impacto='D' THEN Importe ELSE -Importe END),0) AS decimal(18,2))
FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS WHERE ClienteID=@clienteId AND FechaContable<@desde;",
                            P("@clienteId", clienteId), P("@desde", desde.Value.Date)).First();
                    }
                    decimal saldoActual = db.Database.SqlQuery<decimal>(@"
SELECT CAST(COALESCE(SUM(CASE WHEN Impacto='D' THEN Importe ELSE -Importe END),0) AS decimal(18,2))
FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS WHERE ClienteID=@clienteId;", P("@clienteId", clienteId)).First();

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
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    if (!ClienteExiste(db, clienteId)) return NotFound();
                    const string sql = @"
WITH Deudas AS (
    SELECT c.Comprobante_ID,c.Tipo,c.NumeroCorrelativo,c.FechaEmision,c.FechaVencimiento,c.Total,
           COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) AS Aplicado,
           (SELECT TOP (1) 'Proforma '+p.Numero FROM dbo.COMPROBANTES_PROFORMAS cp
            JOIN dbo.PROFORMAS p ON p.Proforma_ID=cp.ProformaID
            WHERE cp.ComprobanteID=c.Comprobante_ID ORDER BY cp.ComprobanteProforma_ID DESC) AS Origen
    FROM dbo.COMPROBANTES c
    LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteDeudaID=c.Comprobante_ID
    WHERE c.ClienteID=@clienteId AND c.Estado='EMITIDO' AND c.Impacto='D'
    GROUP BY c.Comprobante_ID,c.Tipo,c.NumeroCorrelativo,c.FechaEmision,c.FechaVencimiento,c.Total
)
SELECT Comprobante_ID AS ComprobanteID,Tipo,
       Tipo+'-'+RIGHT('00000000'+CONVERT(varchar(8),NumeroCorrelativo),8) AS Comprobante,
       FechaEmision,FechaVencimiento,CAST(Total AS decimal(18,2)) AS ImporteOriginal,
       CAST(Aplicado AS decimal(18,2)) AS ImporteAplicado,
       CAST(Total-Aplicado AS decimal(18,2)) AS SaldoPendiente,
       CASE WHEN FechaVencimiento<CONVERT(date,GETDATE())
            THEN 'Vencido '+CONVERT(varchar(12),DATEDIFF(day,FechaVencimiento,CONVERT(date,GETDATE())))+' días'
            ELSE 'Vigente' END AS Situacion,
       CASE WHEN Aplicado=0 THEN 'Pendiente' ELSE 'Parcial' END AS Estado,
       COALESCE(Origen,'Comprobante directo') AS Origen
FROM Deudas WHERE Total-Aplicado>0
ORDER BY FechaVencimiento,Comprobante_ID;";
                    return Ok(db.Database.SqlQuery<PendienteCuentaDto>(sql, P("@clienteId", clienteId)).ToList());
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
