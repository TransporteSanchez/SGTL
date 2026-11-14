using System;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/WhatsAppConfig")]
    public sealed class WhatsAppConfigController : ApiController
    {
        private readonly string conexion = ConnectionStringHelper.GetConnectionString("SGTLEntities");
        private const string SqlLeer = @"
SELECT WhatsAppConfig_ID, Enabled, PhoneNumberId, ApiVersion, TemplateName,
       TemplateCancelado, TemplateDesasignado, TemplateLanguage, DefaultCountryCode,
       Fecha_Modi, Usu_Modi,
       CAST(CASE WHEN NULLIF(LTRIM(RTRIM(AccessToken)), N'') IS NULL THEN 0 ELSE 1 END AS bit) AS TieneToken
FROM dbo.WHATSAPP_CONFIG
WHERE WhatsAppConfig_ID = @id;";
        private const string SqlGuardar = @"
IF NOT EXISTS (SELECT 1 FROM dbo.WHATSAPP_CONFIG WHERE WhatsAppConfig_ID = 1)
    INSERT INTO dbo.WHATSAPP_CONFIG
        (WhatsAppConfig_ID, Enabled, AccessToken, PhoneNumberId, ApiVersion, TemplateName,
         TemplateCancelado, TemplateDesasignado, TemplateLanguage, DefaultCountryCode,
         Fecha_Alta, Usu_Alta, Fecha_Modi, Usu_Modi)
    VALUES
        (1, @en, @tok, @pid, @ver, @tn, @tc, @td, @tl, @cc, @fecha, @usu, @fecha, @usu);
ELSE
    UPDATE dbo.WHATSAPP_CONFIG
    SET Enabled = @en,
        AccessToken = CASE WHEN @tok IS NULL THEN AccessToken ELSE @tok END,
        PhoneNumberId = @pid,
        ApiVersion = @ver,
        TemplateName = @tn,
        TemplateCancelado = @tc,
        TemplateDesasignado = @td,
        TemplateLanguage = @tl,
        DefaultCountryCode = @cc,
        Fecha_Modi = @fecha,
        Usu_Modi = @usu
    WHERE WhatsAppConfig_ID = 1;";
        [HttpGet, Route("{id:int}")]
        public async Task<IHttpActionResult> Get(int id, CancellationToken ct)
        {
            if (id != 1) return BadRequest("Solo se permite el ID 1.");
            var sesion = await new AccesoEmail().AutenticarAsync(Request.Headers.Authorization, ct);
            if (sesion == null || string.IsNullOrWhiteSpace(sesion.Nombre)) return Unauthorized();
            if (!sesion.EsAdministrador)
                return Content(HttpStatusCode.Forbidden, new { mensaje = "Solo un administrador puede ver la configuración de WhatsApp." });
            using (var db = new SGTLAuditContext(conexion))
            {
                var fila = await db.Database.SqlQuery<ConfiguracionWhatsApp>(SqlLeer,
                    new SqlParameter("@id", id)).FirstOrDefaultAsync(ct);
                if (fila == null) return Ok(ValoresDeFabrica());
                return Ok(fila);
            }
        }
        [HttpPut, Route("{id:int}")]
        public async Task<IHttpActionResult> Put(int id, [FromBody] ConfiguracionWhatsAppEntrada datos, CancellationToken ct)
        {
            if (id != 1) return BadRequest("Solo se permite el ID 1.");
            if (datos == null) return BadRequest("Completá la configuración de WhatsApp.");
            string error = Validar(datos);
            if (error != null) return BadRequest(error);
            var sesion = await new AccesoEmail().AutenticarAsync(Request.Headers.Authorization, ct);
            if (sesion == null || string.IsNullOrWhiteSpace(sesion.Nombre)) return Unauthorized();
            if (!sesion.EsAdministrador)
                return Content(HttpStatusCode.Forbidden, new { mensaje = "Solo un administrador puede modificar la configuración de WhatsApp." });
            string token = string.IsNullOrWhiteSpace(datos.AccessToken) ? null : datos.AccessToken.Trim();
            using (var db = new SGTLAuditContext(conexion))
            {
                await db.Database.ExecuteSqlCommandAsync(SqlGuardar,
                    new SqlParameter("@en", datos.Enabled),
                    new SqlParameter("@tok", SqlDbType.NVarChar, -1) { Value = (object)token ?? DBNull.Value },
                    new SqlParameter("@pid", (object)Limpiar(datos.PhoneNumberId) ?? DBNull.Value),
                    new SqlParameter("@ver", Valor(datos.ApiVersion, "v21.0")),
                    new SqlParameter("@tn", Valor(datos.TemplateName, "viaje_asignado")),
                    new SqlParameter("@tc", Valor(datos.TemplateCancelado, "viaje_cancelado")),
                    new SqlParameter("@td", Valor(datos.TemplateDesasignado, "viaje_desasignado")),
                    new SqlParameter("@tl", Valor(datos.TemplateLanguage, "es_AR")),
                    new SqlParameter("@cc", Valor(datos.DefaultCountryCode, "54")),
                    new SqlParameter("@fecha", SqlDbType.DateTime) { Value = AhoraArgentina() },
                    new SqlParameter("@usu", sesion.Nombre));
                var fila = await db.Database.SqlQuery<ConfiguracionWhatsApp>(SqlLeer,
                    new SqlParameter("@id", id)).FirstOrDefaultAsync(ct);
                return Ok(fila);
            }
        }
        private static ConfiguracionWhatsApp ValoresDeFabrica()
        {
            return new ConfiguracionWhatsApp
            {
                WhatsAppConfig_ID = 1,
                Enabled = false,
                TieneToken = false,
                PhoneNumberId = "",
                ApiVersion = "v21.0",
                TemplateName = "viaje_asignado",
                TemplateCancelado = "viaje_cancelado",
                TemplateDesasignado = "viaje_desasignado",
                TemplateLanguage = "es_AR",
                DefaultCountryCode = "54"
            };
        }
        private static string Validar(ConfiguracionWhatsAppEntrada datos)
        {
            if (Largo(datos.PhoneNumberId) > 50) return "El ID del número admite hasta 50 caracteres.";
            if (Largo(datos.ApiVersion) > 20) return "La versión de la API admite hasta 20 caracteres.";
            if (Largo(datos.TemplateName) > 100 || Largo(datos.TemplateCancelado) > 100 || Largo(datos.TemplateDesasignado) > 100)
                return "El nombre de la plantilla admite hasta 100 caracteres.";
            if (Largo(datos.TemplateLanguage) > 20) return "El idioma admite hasta 20 caracteres.";
            string pais = Limpiar(datos.DefaultCountryCode);
            if (pais != null && (pais.Length > 10 || !pais.All(char.IsDigit)))
                return "El código de país tiene que ser numérico y admite hasta 10 dígitos.";
            return null;
        }
        private static string Valor(string texto, string fabrica)
        {
            return string.IsNullOrWhiteSpace(texto) ? fabrica : texto.Trim();
        }
        private static string Limpiar(string texto)
        {
            return string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
        }
        private static int Largo(string texto)
        {
            return string.IsNullOrWhiteSpace(texto) ? 0 : texto.Trim().Length;
        }
        private static DateTime AhoraArgentina()
        {
            try
            {
                var zona = TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zona);
            }
            catch (TimeZoneNotFoundException)
            {
                return DateTime.UtcNow.AddHours(-3);
            }
        }
    }
    public sealed class ConfiguracionWhatsApp
    {
        public int WhatsAppConfig_ID { get; set; }
        public bool Enabled { get; set; }
        public bool TieneToken { get; set; }
        public string PhoneNumberId { get; set; }
        public string ApiVersion { get; set; }
        public string TemplateName { get; set; }
        public string TemplateCancelado { get; set; }
        public string TemplateDesasignado { get; set; }
        public string TemplateLanguage { get; set; }
        public string DefaultCountryCode { get; set; }
        public DateTime? Fecha_Modi { get; set; }
        public string Usu_Modi { get; set; }
    }
    public sealed class ConfiguracionWhatsAppEntrada
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
}