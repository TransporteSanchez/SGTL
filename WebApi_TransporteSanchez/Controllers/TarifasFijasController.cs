using System;
using System.Data.Entity;
using System.Globalization;
using System.Linq;
using System.Web.Http;
using WebApi_TransporteSanchez;

namespace WebApi_TransporteSanchez.Controllers
{
    public class TarifasFijasController : ApiController
    {
        /// <summary>
        /// Devuelve la tarifa fija de cliente, origen y destino vigente en la fecha de inicio del viaje (AAAA-MM-DD;
        /// sin fecha, hoy). Si ese día no hay ninguna, 404: no se toma otra vencida o futura (decisión de Rocío, 23/10).
        /// </summary>
        [HttpGet]
        [Route("api/TarifasFijas/PorRuta")]
        public IHttpActionResult PorRuta(int clienteId, int origenId, int destinoId, string fecha = null)
        {
            DateTime dia = DateTime.Today;
            if (!string.IsNullOrWhiteSpace(fecha))
            {
                var texto = fecha.Trim();
                if (texto.Length > 10) texto = texto.Substring(0, 10);
                if (!DateTime.TryParseExact(texto, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out dia))
                    return BadRequest("La fecha de inicio del viaje no es válida.");
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var vigente = db.Set<TARIFAS_FIJAS>()
                        .Where(t => t.ClienteID == clienteId && t.OrigenID == origenId && t.DestinoID == destinoId
                                 && t.FechaDesde <= dia && t.FechaHasta >= dia)
                        .OrderByDescending(t => t.FechaDesde)
                        .Select(t => new
                        {
                            t.TarifaFija_ID,
                            t.ValorRuta,
                            t.ValorVueltaVacio,
                            t.ValorFijoNeto
                        })
                        .FirstOrDefault();

                    if (vigente == null)
                        return NotFound();

                    return Ok(vigente);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
