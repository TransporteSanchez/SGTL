using System;
using System.Linq;

namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    /// <summary>
    /// Credenciales y opciones de WhatsApp Cloud API.
    /// Fuente: tabla WHATSAPP_CONFIG (pantalla configuracion-whatsapp.html).
    /// Plantilla body: {{1}} nombre, {{2}} id viaje, {{3}} origen, {{4}} destino,
    /// {{5}} fecha, {{6}} remito/entrega, {{7}} URL Maps.
    /// </summary>
    public class WhatsAppSettings
    {
        public bool Enabled { get; set; }
        public string AccessToken { get; set; }
        public string PhoneNumberId { get; set; }
        public string ApiVersion { get; set; }
        public string TemplateName { get; set; }
        public string TemplateLanguage { get; set; }
        /// <summary>Código país sin + (Argentina = 54).</summary>
        public string DefaultCountryCode { get; set; }

        private class WhatsAppConfigRow
        {
            public bool Enabled { get; set; }
            public string AccessToken { get; set; }
            public string PhoneNumberId { get; set; }
            public string ApiVersion { get; set; }
            public string TemplateName { get; set; }
            public string TemplateLanguage { get; set; }
            public string DefaultCountryCode { get; set; }
        }

        /// <summary>Carga desde WHATSAPP_CONFIG. Si no hay fila, defaults deshabilitados.</summary>
        public static WhatsAppSettings Load()
        {
            try
            {
                var fromDb = TryLoadFromDatabase();
                if (fromDb != null)
                    return fromDb;
            }
            catch
            {
                // Tabla ausente o error de conexión.
            }

            return DisabledDefaults();
        }

        public static WhatsAppSettings DisabledDefaults()
        {
            return new WhatsAppSettings
            {
                Enabled = false,
                AccessToken = "",
                PhoneNumberId = "",
                ApiVersion = "v21.0",
                TemplateName = "viaje_asignado",
                TemplateLanguage = "es_AR",
                DefaultCountryCode = "54"
            };
        }

        private static WhatsAppSettings TryLoadFromDatabase()
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
            using (var db = new SGTLAuditContext(connectionString))
            {
                var row = db.Database.SqlQuery<WhatsAppConfigRow>(
                    "SELECT TOP 1 Enabled, AccessToken, PhoneNumberId, ApiVersion, " +
                    "TemplateName, TemplateLanguage, DefaultCountryCode " +
                    "FROM WHATSAPP_CONFIG WHERE WhatsAppConfig_ID = 1").FirstOrDefault();

                if (row == null)
                    return null;

                return new WhatsAppSettings
                {
                    Enabled = row.Enabled,
                    AccessToken = row.AccessToken ?? "",
                    PhoneNumberId = row.PhoneNumberId ?? "",
                    ApiVersion = string.IsNullOrWhiteSpace(row.ApiVersion) ? "v21.0" : row.ApiVersion.Trim(),
                    TemplateName = string.IsNullOrWhiteSpace(row.TemplateName) ? "viaje_asignado" : row.TemplateName.Trim(),
                    TemplateLanguage = string.IsNullOrWhiteSpace(row.TemplateLanguage) ? "es_AR" : row.TemplateLanguage.Trim(),
                    DefaultCountryCode = string.IsNullOrWhiteSpace(row.DefaultCountryCode) ? "54" : row.DefaultCountryCode.Trim()
                };
            }
        }

        public bool IsConfigured()
        {
            return Enabled
                && !string.IsNullOrWhiteSpace(AccessToken)
                && !string.IsNullOrWhiteSpace(PhoneNumberId)
                && !string.IsNullOrWhiteSpace(TemplateName);
        }
    }
}
