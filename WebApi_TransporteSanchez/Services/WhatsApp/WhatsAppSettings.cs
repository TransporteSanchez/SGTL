using System;
using System.Linq;

namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    /// <summary>
    /// Credenciales y opciones de WhatsApp Cloud API.
    /// Fuente: tabla WHATSAPP_CONFIG (pantalla configuracion-whatsapp.html).
    /// Plantillas:
    /// - Asignado (7 vars): nombre, id, origen, destino, fecha, remito/entrega, URL Maps.
    /// - Cancelado / Desasignado (6 vars): nombre, id, origen, destino, fecha, hora.
    /// </summary>
    public class WhatsAppSettings
    {
        public bool Enabled { get; set; }
        public string AccessToken { get; set; }
        public string PhoneNumberId { get; set; }
        public string ApiVersion { get; set; }
        public string TemplateName { get; set; }
        public string TemplateCancelado { get; set; }
        public string TemplateDesasignado { get; set; }
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
            public string TemplateCancelado { get; set; }
            public string TemplateDesasignado { get; set; }
            public string TemplateLanguage { get; set; }
            public string DefaultCountryCode { get; set; }
        }

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
                // Tabla ausente, columnas nuevas sin migrar, o error de conexión.
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
                TemplateCancelado = "viaje_cancelado",
                TemplateDesasignado = "viaje_desasignado",
                TemplateLanguage = "es_AR",
                DefaultCountryCode = "54"
            };
        }

        private static WhatsAppSettings TryLoadFromDatabase()
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
            using (var db = new SGTLAuditContext(connectionString))
            {
                var tieneCancelado = ColumnaExiste(db, "TemplateCancelado");
                var tieneDesasignado = ColumnaExiste(db, "TemplateDesasignado");
                var sql =
                    "SELECT TOP 1 Enabled, AccessToken, PhoneNumberId, ApiVersion, TemplateName, TemplateLanguage, DefaultCountryCode, " +
                    (tieneCancelado ? "TemplateCancelado" : "CAST(NULL AS nvarchar(100)) AS TemplateCancelado") + ", " +
                    (tieneDesasignado ? "TemplateDesasignado" : "CAST(NULL AS nvarchar(100)) AS TemplateDesasignado") +
                    " FROM WHATSAPP_CONFIG WHERE WhatsAppConfig_ID = 1";

                var row = db.Database.SqlQuery<WhatsAppConfigRow>(sql).FirstOrDefault();
                if (row == null)
                    return null;

                return new WhatsAppSettings
                {
                    Enabled = row.Enabled,
                    AccessToken = row.AccessToken ?? "",
                    PhoneNumberId = row.PhoneNumberId ?? "",
                    ApiVersion = string.IsNullOrWhiteSpace(row.ApiVersion) ? "v21.0" : row.ApiVersion.Trim(),
                    TemplateName = string.IsNullOrWhiteSpace(row.TemplateName) ? "viaje_asignado" : row.TemplateName.Trim(),
                    TemplateCancelado = string.IsNullOrWhiteSpace(row.TemplateCancelado) ? "viaje_cancelado" : row.TemplateCancelado.Trim(),
                    TemplateDesasignado = string.IsNullOrWhiteSpace(row.TemplateDesasignado) ? "viaje_desasignado" : row.TemplateDesasignado.Trim(),
                    TemplateLanguage = string.IsNullOrWhiteSpace(row.TemplateLanguage) ? "es_AR" : row.TemplateLanguage.Trim(),
                    DefaultCountryCode = string.IsNullOrWhiteSpace(row.DefaultCountryCode) ? "54" : row.DefaultCountryCode.Trim()
                };
            }
        }

        private static bool ColumnaExiste(SGTLAuditContext db, string columna)
        {
            // Solo se llama con nombres fijos del código (TemplateCancelado / TemplateDesasignado).
            return db.Database.SqlQuery<int>(
                "SELECT CASE WHEN COL_LENGTH('dbo.WHATSAPP_CONFIG','" + columna + "') IS NULL THEN 0 ELSE 1 END").First() == 1;
        }

        /// <summary>Credenciales listas (sin exigir una plantilla concreta).</summary>
        public bool IsConfiguredBase()
        {
            return Enabled
                && !string.IsNullOrWhiteSpace(AccessToken)
                && !string.IsNullOrWhiteSpace(PhoneNumberId);
        }

        public bool IsConfigured()
        {
            return IsConfiguredBase() && !string.IsNullOrWhiteSpace(TemplateName);
        }
    }
}
