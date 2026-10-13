using System;
using System.Diagnostics;
using System.Linq;
using System.Globalization;

namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    /// <summary>
    /// Arma el payload de notificación a partir del viaje ya persistido.
    /// </summary>
    public class ViajeWhatsAppDispatcher
    {
        private readonly IWhatsAppNotifier _notifier;

        public ViajeWhatsAppDispatcher(IWhatsAppNotifier notifier)
        {
            _notifier = notifier ?? throw new ArgumentNullException(nameof(notifier));
        }

        /// <summary>
        /// Intenta notificar. Nunca lanza: el alta del viaje no debe fallar por WhatsApp.
        /// </summary>
        public WhatsAppNotifyResult TryNotifyViajeAsignado(SGTLAuditContext db, VIAJES viaje)
        {
            if (db == null || viaje == null)
                return WhatsAppNotifyResult.Fail("invalid_input", "Contexto o viaje nulo.");

            var settings = WhatsAppSettings.Load();
            if (!settings.IsConfigured())
            {
                var msg = "omitido (no configurado). Viaje " + viaje.Viaje_ID;
                Trace.TraceInformation("WhatsApp: {0}", msg);
                WhatsAppFileLogger.Write(msg);
                return WhatsAppNotifyResult.Fail("not_configured", msg);
            }

            try
            {
                var payload = BuildPayload(db, viaje, settings);
                if (payload == null)
                {
                    var msg = "No se pudo armar payload (chofer/teléfono). Viaje " + viaje.Viaje_ID;
                    WhatsAppFileLogger.Write(msg);
                    return WhatsAppNotifyResult.Fail("payload_error", msg);
                }

                return _notifier.NotifyViajeAsignadoAsync(payload).ConfigureAwait(false).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                var msg = "fallo al notificar viaje " + viaje.Viaje_ID + ": " + ex.Message;
                Trace.TraceError("WhatsApp: {0}", msg);
                WhatsAppFileLogger.Write(msg);
                return WhatsAppNotifyResult.Fail("exception", ex.Message);
            }
        }

        public ViajeWhatsAppPayload BuildPayload(SGTLAuditContext db, VIAJES viaje, WhatsAppSettings settings = null)
        {
            settings = settings ?? WhatsAppSettings.Load();

            var chofer = db.Set<CHOFERES>().FirstOrDefault(c => c.Chofer_ID == viaje.ChoferID);
            if (chofer == null)
            {
                Trace.TraceWarning("WhatsApp: chofer {0} no encontrado para viaje {1}", viaje.ChoferID, viaje.Viaje_ID);
                return null;
            }

            var telefono = PhoneNumberHelper.ToE164(chofer.TelefonoCelular, settings.DefaultCountryCode);
            if (!PhoneNumberHelper.IsValidE164(telefono))
            {
                Trace.TraceWarning(
                    "WhatsApp: celular inválido del chofer {0} ('{1}') para viaje {2}",
                    chofer.Chofer_ID,
                    chofer.TelefonoCelular,
                    viaje.Viaje_ID);
                return null;
            }

            var origenInfo = (
                from o in db.Set<ORIGEN>()
                join loc in db.Set<LOCALIDADES>() on o.LocID equals loc.Loc_ID into lj
                from loc in lj.DefaultIfEmpty()
                join prov in db.Set<PROVINCIAS>() on o.ProvID equals prov.Prov_ID into pj
                from prov in pj.DefaultIfEmpty()
                where o.Origen_ID == viaje.OrigenID
                select new
                {
                    o.Descripcion,
                    o.Calle,
                    o.AlturaCalle,
                    Localidad = loc != null ? loc.Nombre_Localidad : "",
                    Provincia = prov != null ? prov.Nombre_Provincia : ""
                }).FirstOrDefault();

            var destinoInfo = (
                from d in db.Set<DESTINO>()
                join loc in db.Set<LOCALIDADES>() on d.LocID equals loc.Loc_ID into lj
                from loc in lj.DefaultIfEmpty()
                join prov in db.Set<PROVINCIAS>() on d.ProvID equals prov.Prov_ID into pj
                from prov in pj.DefaultIfEmpty()
                where d.Destino_ID == viaje.DestinoID
                select new
                {
                    d.Descripcion,
                    d.Calle,
                    d.AlturaCalle,
                    Localidad = loc != null ? loc.Nombre_Localidad : "",
                    Provincia = prov != null ? prov.Nombre_Provincia : ""
                }).FirstOrDefault();

            var dirOrigen = origenInfo == null
                ? ""
                : GoogleMapsLinkBuilder.BuildAddress(origenInfo.Calle, origenInfo.AlturaCalle, origenInfo.Localidad, origenInfo.Provincia);
            var dirDestino = destinoInfo == null
                ? ""
                : GoogleMapsLinkBuilder.BuildAddress(destinoInfo.Calle, destinoInfo.AlturaCalle, destinoInfo.Localidad, destinoInfo.Provincia);

            var mapsUrl = GoogleMapsLinkBuilder.BuildDrivingDirections(dirOrigen, dirDestino);

            var origenLabel = !string.IsNullOrWhiteSpace(origenInfo?.Descripcion)
                ? origenInfo.Descripcion.Trim()
                : dirOrigen;
            var destinoLabel = !string.IsNullOrWhiteSpace(destinoInfo?.Descripcion)
                ? destinoInfo.Descripcion.Trim()
                : dirDestino;

            var remito = (viaje.Num_Remito ?? "").Trim();
            var carga = (viaje.Num_de_Carga ?? "").Trim();
            string remitoOCarga;
            if (!string.IsNullOrEmpty(remito) && !string.IsNullOrEmpty(carga))
                remitoOCarga = "Remito " + remito + " / Carga " + carga;
            else if (!string.IsNullOrEmpty(remito))
                remitoOCarga = "Remito " + remito;
            else if (!string.IsNullOrEmpty(carga))
                remitoOCarga = "Carga " + carga;
            else
                remitoOCarga = "-";

            var nombre = ((chofer.Nombre ?? "").Trim() + " " + (chofer.Apellido ?? "").Trim()).Trim();
            if (string.IsNullOrEmpty(nombre))
                nombre = "Chofer";

            return new ViajeWhatsAppPayload
            {
                TelefonoE164 = telefono,
                NombreChofer = nombre,
                ViajeId = viaje.Viaje_ID,
                Origen = origenLabel,
                Destino = destinoLabel,
                FechaInicio = viaje.Fecha_Inicio.ToString("dd/MM/yyyy HH:mm", CultureInfo.GetCultureInfo("es-AR")),
                RemitoOCarga = remitoOCarga,
                MapsUrl = string.IsNullOrEmpty(mapsUrl) ? "-" : mapsUrl
            };
        }
    }
}
