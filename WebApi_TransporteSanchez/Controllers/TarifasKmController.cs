using System;
using System.Data.Entity;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using WebApi_TransporteSanchez;

namespace WebApi_TransporteSanchez.Controllers
{
    /// <summary>
    /// Tarifas por kilómetro (tabla TARIFAS_KM).
    /// </summary>
    public class TarifasKmController : ApiController
    {
        /// <summary>
        /// Busca una tarifa vigente para el viaje: el periodo calendario del viaje (desde/hasta) debe quedar cubierto
        /// por FechaDesde–FechaHasta de la fila, y los km del viaje deben estar entre MinKm y MaxKm.
        /// Monto = ValorKm × km.
        /// </summary>
        [HttpGet]
        [Route("api/TarifasKm/Calcular")]
        public IHttpActionResult Calcular(string fechaInicio, string fechaFin, decimal km)
        {
            if (string.IsNullOrWhiteSpace(fechaInicio) || string.IsNullOrWhiteSpace(fechaFin))
                return BadRequest("Indicá fecha y hora de inicio y de fin del viaje.");

            DateTime dtIni;
            if (!DateTime.TryParse(fechaInicio, CultureInfo.InvariantCulture, DateTimeStyles.None, out dtIni)
                && !DateTime.TryParse(fechaInicio, CultureInfo.CurrentCulture, DateTimeStyles.None, out dtIni))
                return BadRequest("La fecha de inicio no es válida.");

            DateTime dtFin;
            if (!DateTime.TryParse(fechaFin, CultureInfo.InvariantCulture, DateTimeStyles.None, out dtFin)
                && !DateTime.TryParse(fechaFin, CultureInfo.CurrentCulture, DateTimeStyles.None, out dtFin))
                return BadRequest("La fecha de fin no es válida.");

            if (dtFin < dtIni)
                return BadRequest("La fecha de fin no puede ser anterior a la de inicio.");

            if (km < 0)
                return BadRequest("Los kilómetros no pueden ser negativos.");

            var dIni = dtIni.Date;
            var dFin = dtFin.Date;

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    // Vigencia: la tarifa aplica al viaje si el rango del viaje (por fecha) está dentro del rango de la tarifa.
                    var candidatos = db.Set<TARIFAS_KM>()
                        .Where(t => t.FechaDesde <= dIni && t.FechaHasta >= dFin)
                        .ToList();

                    TARIFAS_KM elegido = null;
                    decimal mejorAncho = decimal.MaxValue;

                    foreach (var t in candidatos)
                    {
                        if (!TryParseKm(t.MinKm, out var minKm) || !TryParseKm(t.MaxKm, out var maxKm))
                            continue;

                        if (minKm > maxKm)
                            continue;

                        if (km < minKm || km > maxKm)
                            continue;

                        var ancho = maxKm - minKm;
                        if (ancho < mejorAncho || (ancho == mejorAncho && (elegido == null || t.TarifaKm_ID > elegido.TarifaKm_ID)))
                        {
                            mejorAncho = ancho;
                            elegido = t;
                        }
                    }

                    if (elegido == null)
                    {
                        var resp = Request.CreateResponse(HttpStatusCode.NotFound, new
                        {
                            Mensaje = "No hay tarifa registrada para ese periodo de viaje y cantidad de kilómetros."
                        });
                        return ResponseMessage(resp);
                    }

                    var monto = decimal.Round(elegido.ValorKm * km, 2, MidpointRounding.AwayFromZero);

                    return Ok(new
                    {
                        elegido.TarifaKm_ID,
                        elegido.ValorKm,
                        Kilometros = km,
                        MontoCalculado = monto
                    });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        private static bool TryParseKm(string raw, out decimal value)
        {
            value = 0;
            if (string.IsNullOrWhiteSpace(raw))
                return false;

            var s = raw.Trim().Replace(',', '.');
            return decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out value);
        }
    }
}
