using System;
using System.Data.Entity;
using System.Linq;
using System.Web.Http;
using WebApi_TransporteSanchez;

namespace WebApi_TransporteSanchez.Controllers
{
    public class TarifasFijasController : ApiController
    {
        /// <summary>
        /// Devuelve la tarifa fija vigente para cliente, origen y destino (rango de fechas que incluye hoy; si no hay, la más reciente por FechaDesde).
        /// </summary>
        [HttpGet]
        [Route("api/TarifasFijas/PorRuta")]
        public IHttpActionResult PorRuta(int clienteId, int origenId, int destinoId)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
            var hoy = DateTime.Today;

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    var query = db.Set<TARIFAS_FIJAS>()
                        .Where(t => t.ClienteID == clienteId && t.OrigenID == origenId && t.DestinoID == destinoId);

                    var vigente = query
                        .Where(t => t.FechaDesde <= hoy && t.FechaHasta >= hoy)
                        .OrderByDescending(t => t.FechaDesde)
                        .Select(t => new
                        {
                            t.TarifaFija_ID,
                            t.ValorRuta,
                            t.ValorVueltaVacio,
                            t.ValorFijoNeto
                        })
                        .FirstOrDefault();

                    if (vigente != null)
                        return Ok(vigente);

                    var ultima = query
                        .OrderByDescending(t => t.FechaDesde)
                        .Select(t => new
                        {
                            t.TarifaFija_ID,
                            t.ValorRuta,
                            t.ValorVueltaVacio,
                            t.ValorFijoNeto
                        })
                        .FirstOrDefault();

                    if (ultima == null)
                        return NotFound();

                    return Ok(ultima);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
