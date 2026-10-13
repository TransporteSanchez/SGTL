using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Text;
using System.Web.Http;
using WebApi_TransporteSanchez.Services.WhatsApp;

namespace WebApi_TransporteSanchez.Controllers
{
    /// <summary>
    /// Configuración WhatsApp Cloud API (fila única id=1 en WHATSAPP_CONFIG).
    /// </summary>
    [RoutePrefix("api/WhatsAppConfig")]
    public class WhatsAppConfigController : ApiController
    {
        public class WhatsAppConfigDto
        {
            public int WhatsAppConfig_ID { get; set; }
            public bool Enabled { get; set; }
            public string AccessToken { get; set; }
            public string PhoneNumberId { get; set; }
            public string ApiVersion { get; set; }
            public string TemplateName { get; set; }
            public string TemplateLanguage { get; set; }
            public string DefaultCountryCode { get; set; }
            public DateTime? Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }
        }

        private class WhatsAppConfigRow
        {
            public int WhatsAppConfig_ID { get; set; }
            public bool Enabled { get; set; }
            public string AccessToken { get; set; }
            public string PhoneNumberId { get; set; }
            public string ApiVersion { get; set; }
            public string TemplateName { get; set; }
            public string TemplateLanguage { get; set; }
            public string DefaultCountryCode { get; set; }
            public DateTime? Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }
        }

        // GET: api/WhatsAppConfig/1
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult Get(int id)
        {
            if (id != 1)
                return BadRequest("Solo se permite el ID 1.");

            try
            {
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
                using (var db = new SGTLAuditContext(connectionString))
                {
                    EnsureRowExists(db);

                    var row = db.Database.SqlQuery<WhatsAppConfigRow>(
                        "SELECT WhatsAppConfig_ID, Enabled, AccessToken, PhoneNumberId, ApiVersion, " +
                        "TemplateName, TemplateLanguage, DefaultCountryCode, Fecha_Modi, Usu_Modi " +
                        "FROM WHATSAPP_CONFIG WHERE WhatsAppConfig_ID = @id",
                        new SqlParameter("@id", id)).FirstOrDefault();

                    if (row == null)
                        return NotFound();

                    return Ok(ToPublicDto(row));
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    Message = "No se pudo leer la configuración de WhatsApp. Verificá que exista la tabla WHATSAPP_CONFIG.",
                    Detail = ex.Message
                });
            }
        }

        // PUT: api/WhatsAppConfig/1
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Put(int id, [FromBody] WhatsAppConfigDto value)
        {
            if (id != 1)
                return BadRequest("Solo se permite el ID 1.");

            if (value == null)
                return BadRequest("Datos inválidos.");

            try
            {
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
                using (var db = new SGTLAuditContext(connectionString))
                {
                    EnsureRowExists(db);

                    var actual = db.Database.SqlQuery<WhatsAppConfigRow>(
                        "SELECT WhatsAppConfig_ID, Enabled, AccessToken, PhoneNumberId, ApiVersion, " +
                        "TemplateName, TemplateLanguage, DefaultCountryCode, Fecha_Modi, Usu_Modi " +
                        "FROM WHATSAPP_CONFIG WHERE WhatsAppConfig_ID = @id",
                        new SqlParameter("@id", id)).FirstOrDefault();

                    if (actual == null)
                        return NotFound();

                    var token = (value.AccessToken ?? "").Trim();

                    var apiVersion = string.IsNullOrWhiteSpace(value.ApiVersion) ? "v21.0" : value.ApiVersion.Trim();
                    var templateName = string.IsNullOrWhiteSpace(value.TemplateName) ? "viaje_asignado" : value.TemplateName.Trim();
                    var templateLang = string.IsNullOrWhiteSpace(value.TemplateLanguage) ? "es_AR" : value.TemplateLanguage.Trim();
                    var country = string.IsNullOrWhiteSpace(value.DefaultCountryCode) ? "54" : value.DefaultCountryCode.Trim();
                    var phoneId = (value.PhoneNumberId ?? "").Trim();
                    var usu = string.IsNullOrWhiteSpace(value.Usu_Modi) ? "sistema" : value.Usu_Modi.Trim();
                    var fecha = DateTime.Now;

                    int filas = db.Database.ExecuteSqlCommand(
                        "UPDATE WHATSAPP_CONFIG SET Enabled = @en, AccessToken = @tok, PhoneNumberId = @pid, " +
                        "ApiVersion = @ver, TemplateName = @tn, TemplateLanguage = @tl, DefaultCountryCode = @cc, " +
                        "Fecha_Modi = @fecha, Usu_Modi = @usu WHERE WhatsAppConfig_ID = @id",
                        new SqlParameter("@en", value.Enabled),
                        new SqlParameter("@tok", (object)token ?? DBNull.Value),
                        new SqlParameter("@pid", string.IsNullOrEmpty(phoneId) ? (object)DBNull.Value : phoneId),
                        new SqlParameter("@ver", apiVersion),
                        new SqlParameter("@tn", templateName),
                        new SqlParameter("@tl", templateLang),
                        new SqlParameter("@cc", country),
                        new SqlParameter("@fecha", fecha),
                        new SqlParameter("@usu", usu),
                        new SqlParameter("@id", id));

                    if (filas == 0)
                        return NotFound();

                    try
                    {
                        var antes = new Dictionary<string, string>();
                        var despues = new Dictionary<string, string>();
                        AgregarCambio(antes, despues, "Enabled", actual.Enabled.ToString(), value.Enabled.ToString());
                        AgregarCambio(antes, despues, "PhoneNumberId", actual.PhoneNumberId, phoneId);
                        AgregarCambio(antes, despues, "ApiVersion", actual.ApiVersion, apiVersion);
                        AgregarCambio(antes, despues, "TemplateName", actual.TemplateName, templateName);
                        AgregarCambio(antes, despues, "TemplateLanguage", actual.TemplateLanguage, templateLang);
                        AgregarCambio(antes, despues, "DefaultCountryCode", actual.DefaultCountryCode, country);
                        if (!string.Equals(actual.AccessToken ?? "", token ?? "", StringComparison.Ordinal))
                        {
                            antes["AccessToken"] = string.IsNullOrEmpty(actual.AccessToken) ? "(vacío)" : "***";
                            despues["AccessToken"] = string.IsNullOrEmpty(token) ? "(vacío)" : "***";
                        }

                        if (antes.Count > 0)
                        {
                            db.Database.ExecuteSqlCommand(
                                "INSERT INTO AUDITORIA (Fecha, Usuario, Accion, Entidad, Clave, Valores_Anteriores, Valores_Nuevos, Origen) " +
                                "VALUES (GETDATE(), @usu, 'UPDATE', 'WHATSAPP_CONFIG', @clave, @ant, @nue, NULL)",
                                new SqlParameter("@usu", usu),
                                new SqlParameter("@clave", "WhatsAppConfig_ID=" + id),
                                new SqlParameter("@ant", (object)ToJson(antes) ?? DBNull.Value),
                                new SqlParameter("@nue", (object)ToJson(despues) ?? DBNull.Value));
                        }
                    }
                    catch { }

                    var updated = db.Database.SqlQuery<WhatsAppConfigRow>(
                        "SELECT WhatsAppConfig_ID, Enabled, AccessToken, PhoneNumberId, ApiVersion, " +
                        "TemplateName, TemplateLanguage, DefaultCountryCode, Fecha_Modi, Usu_Modi " +
                        "FROM WHATSAPP_CONFIG WHERE WhatsAppConfig_ID = @id",
                        new SqlParameter("@id", id)).FirstOrDefault();

                    return Ok(new
                    {
                        Message = "Configuración de WhatsApp actualizada.",
                        Config = ToPublicDto(updated)
                    });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    Message = "No se pudo guardar la configuración de WhatsApp.",
                    Detail = ex.Message
                });
            }
        }

        private static WhatsAppConfigDto ToPublicDto(WhatsAppConfigRow row)
        {
            if (row == null) return null;
            return new WhatsAppConfigDto
            {
                WhatsAppConfig_ID = row.WhatsAppConfig_ID,
                Enabled = row.Enabled,
                AccessToken = row.AccessToken ?? "",
                PhoneNumberId = row.PhoneNumberId ?? "",
                ApiVersion = row.ApiVersion ?? "v21.0",
                TemplateName = row.TemplateName ?? "viaje_asignado",
                TemplateLanguage = row.TemplateLanguage ?? "es_AR",
                DefaultCountryCode = row.DefaultCountryCode ?? "54",
                Fecha_Modi = row.Fecha_Modi,
                Usu_Modi = row.Usu_Modi
            };
        }

        /// <summary>
        /// Si no hay fila, la crea con defaults deshabilitados (sin credenciales).
        /// </summary>
        private static void EnsureRowExists(SGTLAuditContext db)
        {
            var count = db.Database.SqlQuery<int>(
                "SELECT COUNT(1) FROM WHATSAPP_CONFIG WHERE WhatsAppConfig_ID = 1").FirstOrDefault();
            if (count > 0)
                return;

            var defaults = WhatsAppSettings.DisabledDefaults();
            db.Database.ExecuteSqlCommand(
                "INSERT INTO WHATSAPP_CONFIG " +
                "(WhatsAppConfig_ID, Enabled, AccessToken, PhoneNumberId, ApiVersion, TemplateName, " +
                "TemplateLanguage, DefaultCountryCode, Fecha_Alta, Usu_Alta, Fecha_Modi, Usu_Modi) " +
                "VALUES (1, 0, NULL, NULL, @ver, @tn, @tl, @cc, GETDATE(), 'sistema', GETDATE(), 'sistema')",
                new SqlParameter("@ver", defaults.ApiVersion ?? "v21.0"),
                new SqlParameter("@tn", defaults.TemplateName ?? "viaje_asignado"),
                new SqlParameter("@tl", defaults.TemplateLanguage ?? "es_AR"),
                new SqlParameter("@cc", defaults.DefaultCountryCode ?? "54"));
        }

        private static void AgregarCambio(Dictionary<string, string> antes, Dictionary<string, string> despues,
            string campo, string oldVal, string newVal)
        {
            oldVal = oldVal ?? "";
            newVal = newVal ?? "";
            if (!string.Equals(oldVal, newVal, StringComparison.Ordinal))
            {
                antes[campo] = oldVal;
                despues[campo] = newVal;
            }
        }

        private static string ToJson(Dictionary<string, string> dict)
        {
            if (dict == null || dict.Count == 0) return null;
            var sb = new StringBuilder();
            sb.Append("{");
            bool first = true;
            foreach (var kv in dict)
            {
                if (!first) sb.Append(",");
                first = false;
                sb.Append("\"").Append(Escape(kv.Key)).Append("\":\"")
                  .Append(Escape(kv.Value)).Append("\"");
            }
            sb.Append("}");
            return sb.ToString();
        }

        private static string Escape(string s)
        {
            return (s ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"");
        }
    }
}
