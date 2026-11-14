using System.Data.Entity;
using System.Linq;
namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public sealed class ConfiguracionEnvioWhatsApp
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
        public bool ListaParaEnviar
        {
            get
            {
                return Enabled
                    && !string.IsNullOrWhiteSpace(AccessToken)
                    && !string.IsNullOrWhiteSpace(PhoneNumberId);
            }
        }
        public static ConfiguracionEnvioWhatsApp Leer()
        {
            try
            {
                using (var db = new SGTLAuditContext(ConnectionStringHelper.GetConnectionString("SGTLEntities")))
                {
                    const string sql = @"
SELECT TOP (1) Enabled, AccessToken, PhoneNumberId, ApiVersion, TemplateName,
       TemplateCancelado, TemplateDesasignado, TemplateLanguage, DefaultCountryCode
FROM dbo.WHATSAPP_CONFIG
WHERE WhatsAppConfig_ID = 1;";
                    var fila = db.Database.SqlQuery<ConfiguracionEnvioWhatsApp>(sql).FirstOrDefault();
                    if (fila == null) return Apagada();
                    fila.ApiVersion = Texto(fila.ApiVersion, "v21.0");
                    fila.TemplateName = Texto(fila.TemplateName, "viaje_asignado");
                    fila.TemplateCancelado = Texto(fila.TemplateCancelado, "viaje_cancelado");
                    fila.TemplateDesasignado = Texto(fila.TemplateDesasignado, "viaje_desasignado");
                    fila.TemplateLanguage = Texto(fila.TemplateLanguage, "es_AR");
                    fila.DefaultCountryCode = Texto(fila.DefaultCountryCode, "54");
                    fila.AccessToken = fila.AccessToken ?? "";
                    fila.PhoneNumberId = fila.PhoneNumberId ?? "";
                    return fila;
                }
            }
            catch
            {
                return Apagada();
            }
        }
        private static ConfiguracionEnvioWhatsApp Apagada()
        {
            return new ConfiguracionEnvioWhatsApp
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
        private static string Texto(string valor, string fabrica)
        {
            return string.IsNullOrWhiteSpace(valor) ? fabrica : valor.Trim();
        }
    }
}