using System;
using System.Globalization;
using System.Linq;
namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public sealed class ViajeWhatsAppDispatcher
    {
        private readonly WhatsAppCloudApiNotifier envio;
        public ViajeWhatsAppDispatcher()
            : this(new WhatsAppCloudApiNotifier())
        {
        }
        public ViajeWhatsAppDispatcher(WhatsAppCloudApiNotifier envio)
        {
            this.envio = envio ?? new WhatsAppCloudApiNotifier();
        }
        public WhatsAppNotifyResult TryNotifyViajeAsignado(SGTLAuditContext db, VIAJES viaje)
        {
            return Avisar(db, viaje, 0, true);
        }
        public WhatsAppNotifyResult TryNotifyViajeCancelado(SGTLAuditContext db, VIAJES viaje)
        {
            return Avisar(db, viaje, 0, false);
        }
        public WhatsAppNotifyResult TryNotifyViajeDesasignado(SGTLAuditContext db, VIAJES viaje, int choferId)
        {
            if (choferId <= 0)
                return WhatsAppNotifyResult.Fallo("payload_error", "Sin chofer para desasignar.", null);
            return Avisar(db, viaje, choferId, false);
        }
        private WhatsAppNotifyResult Avisar(SGTLAuditContext db, VIAJES viaje, int choferFijo, bool asignado)
        {
            if (db == null || viaje == null)
                return WhatsAppNotifyResult.Fallo("invalid_input", "No hay viaje para avisar.", null);
            var config = ConfiguracionEnvioWhatsApp.Leer();
            if (!config.ListaParaEnviar)
            {
                RegistroEnviosWhatsApp.Anotar("viaje=" + viaje.Viaje_ID + " omitido: la configuración no está lista.");
                return WhatsAppNotifyResult.Fallo("not_configured", "La integración de WhatsApp no está configurada.", null);
            }
            try
            {
                int choferId = choferFijo > 0 ? choferFijo : viaje.ChoferID;
                var datos = Armar(db, viaje, choferId, config);
                if (datos == null)
                {
                    RegistroEnviosWhatsApp.Anotar("viaje=" + viaje.Viaje_ID + " omitido: no se pudo armar el teléfono o el chofer.");
                    return WhatsAppNotifyResult.Fallo("payload_error", "No se pudo armar el aviso del viaje.", null);
                }
                string plantilla = asignado ? config.TemplateName : (choferFijo > 0 ? config.TemplateDesasignado : config.TemplateCancelado);
                string[] parametros = asignado
                    ? new[] { datos.Nombre, datos.ViajeId, datos.Origen, datos.Destino, datos.FechaHora, datos.Remito, datos.Mapa }
                    : new[] { datos.Nombre, datos.ViajeId, datos.Origen, datos.Destino, datos.Fecha, datos.Hora };
                if (string.IsNullOrWhiteSpace(plantilla))
                    return WhatsAppNotifyResult.Fallo("not_configured", "Falta el nombre de la plantilla.", datos.Telefono);
                return envio.NotifyTemplateAsync(datos.Telefono, viaje.Viaje_ID, plantilla, config.TemplateLanguage, parametros)
                    .ConfigureAwait(false).GetAwaiter().GetResult();
            }
            catch (Exception)
            {
                RegistroEnviosWhatsApp.Anotar("viaje=" + viaje.Viaje_ID + " falló al armar el aviso.");
                return WhatsAppNotifyResult.Fallo("exception", "No se pudo enviar el WhatsApp.", null);
            }
        }
        private static DatosAviso Armar(SGTLAuditContext db, VIAJES viaje, int choferId, ConfiguracionEnvioWhatsApp config)
        {
            if (choferId <= 0) return null;
            var chofer = db.Set<CHOFERES>().FirstOrDefault(c => c.Chofer_ID == choferId);
            if (chofer == null) return null;
            string telefono = TelefonosWhatsApp.ParaEnvio(chofer.TelefonoCelular, config.DefaultCountryCode);
            if (!TelefonosWhatsApp.EsValido(telefono)) return null;
            var origen = (
                from o in db.Set<ORIGEN>()
                join loc in db.Set<LOCALIDADES>() on o.LocID equals loc.Loc_ID into lugares
                from loc in lugares.DefaultIfEmpty()
                join prov in db.Set<PROVINCIAS>() on o.ProvID equals prov.Prov_ID into provincias
                from prov in provincias.DefaultIfEmpty()
                where o.Origen_ID == viaje.OrigenID
                select new { o.Descripcion, o.Calle, o.AlturaCalle, Localidad = loc.Nombre_Localidad, Provincia = prov.Nombre_Provincia }
            ).FirstOrDefault();
            var destino = (
                from d in db.Set<DESTINO>()
                join loc in db.Set<LOCALIDADES>() on d.LocID equals loc.Loc_ID into lugares
                from loc in lugares.DefaultIfEmpty()
                join prov in db.Set<PROVINCIAS>() on d.ProvID equals prov.Prov_ID into provincias
                from prov in provincias.DefaultIfEmpty()
                where d.Destino_ID == viaje.DestinoID
                select new { d.Descripcion, d.Calle, d.AlturaCalle, Localidad = loc.Nombre_Localidad, Provincia = prov.Nombre_Provincia }
            ).FirstOrDefault();
            string dirOrigen = origen == null ? "" : EnlacesMapa.Direccion(origen.Calle, origen.AlturaCalle, origen.Localidad, origen.Provincia);
            string dirDestino = destino == null ? "" : EnlacesMapa.Direccion(destino.Calle, destino.AlturaCalle, destino.Localidad, destino.Provincia);
            string mapa = EnlacesMapa.Recorrido(dirOrigen, dirDestino);
            string fechaHora = viaje.Fecha_Inicio.ToString("dd/MM/yyyy HH:mm", CultureInfo.GetCultureInfo("es-AR"));
            string[] partesFecha = fechaHora.Split(new[] { ' ' }, 2);
            string nombre = ((chofer.Nombre ?? "").Trim() + " " + (chofer.Apellido ?? "").Trim()).Trim();
            return new DatosAviso
            {
                Telefono = telefono,
                Nombre = nombre.Length == 0 ? "Chofer" : nombre,
                ViajeId = viaje.Viaje_ID.ToString(CultureInfo.InvariantCulture),
                Origen = Texto(origen == null ? null : origen.Descripcion, dirOrigen),
                Destino = Texto(destino == null ? null : destino.Descripcion, dirDestino),
                FechaHora = fechaHora,
                Fecha = partesFecha.Length > 0 ? partesFecha[0] : "-",
                Hora = partesFecha.Length > 1 ? partesFecha[1] : "-",
                Remito = Remito(viaje.Num_Remito, viaje.Num_de_Carga),
                Mapa = mapa.Length == 0 ? "-" : mapa
            };
        }
        private static string Remito(string remito, string carga)
        {
            remito = (remito ?? "").Trim();
            carga = (carga ?? "").Trim();
            if (remito.Length > 0 && carga.Length > 0) return "Remito " + remito + " / Entrega " + carga;
            if (remito.Length > 0) return "Remito " + remito;
            if (carga.Length > 0) return "Entrega " + carga;
            return "-";
        }
        private static string Texto(string preferido, string respaldo)
        {
            if (!string.IsNullOrWhiteSpace(preferido)) return preferido.Trim();
            return string.IsNullOrWhiteSpace(respaldo) ? "-" : respaldo;
        }
        private sealed class DatosAviso
        {
            public string Telefono { get; set; }
            public string Nombre { get; set; }
            public string ViajeId { get; set; }
            public string Origen { get; set; }
            public string Destino { get; set; }
            public string FechaHora { get; set; }
            public string Fecha { get; set; }
            public string Hora { get; set; }
            public string Remito { get; set; }
            public string Mapa { get; set; }
        }
    }
}