using System;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Http;
using System.Web.Security;
using MailKit.Security;
using Microsoft.IdentityModel.Tokens;
using MimeKit;
using Newtonsoft.Json.Linq;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/Presupuestos")]
    public class EnviosPresupuestosController : ApiController
    {
        private static readonly string[] Proposito = { "SGTL", "EmailServidor", "SMTP-password", "v1" };
        public class EnvioRequest { public string Destinatario { get; set; } public string PdfBase64 { get; set; } public string Version { get; set; } }
        private class Perfil { public short Service; public string Nombre, Remitente, NombreRemitente, Host, Password, Asunto, Cuerpo; public int? Puerto; public short? Seguridad; public bool Ssl, Tls12; }
        internal class AccesoException : Exception { public HttpStatusCode Codigo; public AccesoException(HttpStatusCode codigo, string mensaje) : base(mensaje) { Codigo = codigo; } }
        private static string Conexion() { return new EntityConnectionStringBuilder(ConnectionStringHelper.GetConnectionString("SGTLEntities")).ProviderConnectionString; }
        private static SqlParameter P(string nombre, object valor) { return new SqlParameter(nombre, valor ?? DBNull.Value); }
        internal static string ValidarUsuario(HttpRequestMessage request, SqlConnection cn)
        {
            var auth = request == null ? null : request.Headers.Authorization;
            if (auth == null || !string.Equals(auth.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(auth.Parameter)) throw new AccesoException(HttpStatusCode.Unauthorized, "Iniciá sesión nuevamente.");
            string usuario;
            try {
                SecurityToken token;
                var principal = new JwtSecurityTokenHandler().ValidateToken(auth.Parameter, new TokenValidationParameters { ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)), ValidateIssuer = true, ValidIssuer = JwtConfig.Issuer, ValidateAudience = true, ValidAudience = JwtConfig.Audience, ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1) }, out token);
                var claim = principal.FindFirst(ClaimTypes.NameIdentifier); usuario = claim == null ? null : claim.Value;
                if (string.IsNullOrWhiteSpace(usuario)) throw new SecurityTokenException();
            } catch { throw new AccesoException(HttpStatusCode.Unauthorized, "La sesión no es válida o ha vencido."); }
            using (var cmd = new SqlCommand(@"SELECT TOP (1) CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(u.Rol,''))))='admin' OR EXISTS (
SELECT 1 FROM dbo.GRUPOS_USUARIOS gu JOIN dbo.GRUPOS_MENU gm ON gm.GrupoID=gu.GrupoID JOIN dbo.MENU m ON m.Menu_ID=gm.MenuID
WHERE gu.UsuarioID=u.Usuario_ID AND m.Menu_Nombre COLLATE Latin1_General_CI_AI IN ('Gestion de viajes','Presupuestos')) THEN 1 ELSE 0 END
FROM dbo.USUARIOS u WHERE u.Nombre_Usuario=@usuario AND u.EstadoUsuario='Activo'", cn)) {
                cmd.Parameters.Add(P("@usuario", usuario)); var autorizado = cmd.ExecuteScalar();
                if (autorizado == null) throw new AccesoException(HttpStatusCode.Unauthorized, "El usuario no existe o está inactivo.");
                if (Convert.ToInt32(autorizado) != 1) throw new AccesoException(HttpStatusCode.Forbidden, "No tenés acceso a Presupuestos.");
            }
            return usuario;
        }
        private static string LeerDatos(SqlConnection cn, int id) { using (var cmd = new SqlCommand("SELECT Datos FROM dbo.PRESUPUESTOS WHERE Presupuesto_ID=@id", cn)) { cmd.Parameters.Add(P("@id", id)); return cmd.ExecuteScalar() as string; } }
        private static string Version(string datos) { using (var sha = SHA256.Create()) return Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(datos))); }
        private static Perfil LeerPerfil(SqlConnection cn)
        {
            using (var cmd = new SqlCommand(@"SELECT e.[Service],e.[Name],e.CredentialFromMailAddres,e.NombreRemitente,e.SmtpHost,e.SmtpPort,e.SecureSocketOption,e.UsaSsl,e.UsaTLS12,e.CredentialFromMailPassProtegida,e.Asunto,e.CuerpoHtml
FROM dbo.CONFIGURACION_EMAIL_MODULO m JOIN dbo.EmailServidor e ON e.[Service]=m.[Service] WHERE m.Modulo='PRESUPUESTOS'", cn))
            using (var r = cmd.ExecuteReader()) {
                if (!r.Read()) return null;
                return new Perfil { Service=(short)r[0], Nombre=r[1] as string, Remitente=r[2] as string, NombreRemitente=r[3] as string, Host=r[4] as string, Puerto=r.IsDBNull(5) ? (int?)null : Convert.ToInt32(r[5]), Seguridad=r.IsDBNull(6) ? (short?)null : Convert.ToInt16(r[6]), Ssl=!r.IsDBNull(7) && Convert.ToBoolean(r[7]), Tls12=!r.IsDBNull(8) && Convert.ToBoolean(r[8]), Password=r[9] as string, Asunto=r[10] as string, Cuerpo=r[11] as string };
            }
        }
        [HttpGet, Route("{id:int}/email")]
        public IHttpActionResult Preparar(int id)
        {
            try { using (var cn = new SqlConnection(Conexion())) { cn.Open(); ValidarUsuario(Request, cn); var datos=LeerDatos(cn,id); if (datos==null) return NotFound(); var perfil=LeerPerfil(cn); var presupuesto=JObject.Parse(datos); presupuesto["id"]=id; return Ok(new { Presupuesto=presupuesto, Version=Version(datos), Configurado=perfil!=null, Service=perfil==null ? (short?)null : perfil.Service, Perfil=perfil==null ? null : perfil.Nombre, Remitente=perfil==null ? null : perfil.Remitente }); } }
            catch (AccesoException ex) { return Content(ex.Codigo, new { error=ex.Message }); }
            catch { return Content(HttpStatusCode.InternalServerError, new { error="No se pudo preparar el envío del presupuesto." }); }
        }
        [HttpPost, Route("{id:int}/email")]
        public IHttpActionResult Enviar(int id, [FromBody] EnvioRequest request)
        {
            if (request==null || !EmailValido((request.Destinatario ?? "").Trim())) return BadRequest("Indicá un correo de destino válido.");
            byte[] pdf; try { if (string.IsNullOrWhiteSpace(request.PdfBase64) || request.PdfBase64.Length > 13981024) throw new ArgumentException(); pdf=Convert.FromBase64String(request.PdfBase64); if (pdf.Length<5 || pdf.Length>10485760 || Encoding.ASCII.GetString(pdf,0,5)!="%PDF-") throw new ArgumentException(); } catch { return BadRequest("El adjunto debe ser un PDF válido de hasta 10 MB."); }
            try {
                Perfil perfil; string datos, usuario;
                using (var cn = new SqlConnection(Conexion())) { cn.Open(); usuario=ValidarUsuario(Request, cn); datos=LeerDatos(cn,id); if (datos==null) return NotFound(); if (Version(datos)!=request.Version) return Content(HttpStatusCode.Conflict, new { error="El presupuesto fue modificado. Volvé a abrir el envío para actualizar el PDF." }); perfil=LeerPerfil(cn); }
                if (perfil==null) return BadRequest("No hay un perfil SMTP asignado a Presupuestos. Configuralo en Configuración > E-mail.");
                if (string.IsNullOrWhiteSpace(perfil.Host) || !perfil.Puerto.HasValue || perfil.Puerto<1 || perfil.Puerto>65535 || !EmailValido(perfil.Remitente) || string.IsNullOrWhiteSpace(perfil.Password)) return BadRequest("El perfil SMTP de Presupuestos está incompleto. Revisalo en Configuración > E-mail.");
                string password; try { var bytes=MachineKey.Unprotect(Convert.FromBase64String(perfil.Password), Proposito); password=bytes==null ? null : Encoding.UTF8.GetString(bytes); } catch { password=null; }
                if (string.IsNullOrEmpty(password)) return BadRequest("No se pudo leer la contraseña del perfil SMTP. Volvé a guardarla en Configuración > E-mail.");
                var presupuesto=JObject.Parse(datos); string cliente=(string)presupuesto["cliente"] ?? "cliente"; string numero=id.ToString();
                Func<string,bool,string> plantilla=(valor, html) => (valor ?? "").Replace("{{CLIENTE}}", html ? HttpUtility.HtmlEncode(cliente) : cliente).Replace("{{NUMERO_PRESUPUESTO}}", numero);
                var mensaje=new MimeMessage(); mensaje.From.Add(new MailboxAddress(string.IsNullOrWhiteSpace(perfil.NombreRemitente) ? perfil.Nombre : perfil.NombreRemitente, perfil.Remitente)); mensaje.To.Add(MailboxAddress.Parse(request.Destinatario.Trim()));
                mensaje.Subject=plantilla(string.IsNullOrWhiteSpace(perfil.Asunto) ? "Presupuesto #{{NUMERO_PRESUPUESTO}}" : perfil.Asunto, false).Replace("\r", " ").Replace("\n", " ");
                var cuerpo=new BodyBuilder { HtmlBody=plantilla(string.IsNullOrWhiteSpace(perfil.Cuerpo) ? "<p>Hola {{CLIENTE}},</p><p>Adjuntamos el presupuesto #{{NUMERO_PRESUPUESTO}}.</p>" : perfil.Cuerpo, true) }; cuerpo.Attachments.Add("Presupuesto_"+numero+".pdf",pdf,new ContentType("application","pdf")); mensaje.Body=cuerpo.ToMessageBody();
                if (perfil.Tls12) ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
                using (var smtp=new MailKit.Net.Smtp.SmtpClient()) { smtp.Timeout=30000; smtp.Connect(perfil.Host,perfil.Puerto.Value,perfil.Seguridad.HasValue ? (SecureSocketOptions)perfil.Seguridad.Value : (perfil.Ssl ? SecureSocketOptions.StartTls : SecureSocketOptions.None)); smtp.Authenticate(perfil.Remitente,password); smtp.Send(mensaje); try { smtp.Disconnect(true); } catch { } }
                try { SGTLAuditContext.RegistrarEvento(ConnectionStringHelper.GetConnectionString("SGTLEntities"), usuario, "EMAIL_SEND", "PRESUPUESTOS", "Presupuesto_ID="+id, "Enviado a "+request.Destinatario.Trim()+" mediante Service="+perfil.Service, "Presupuestos"); } catch { }
                return Ok(new { mensaje="Presupuesto enviado a " + request.Destinatario.Trim() + "." });
            } catch (AccesoException ex) { return Content(ex.Codigo, new { error=ex.Message }); }
            catch { return Content(HttpStatusCode.BadGateway, new { error="No se pudo enviar el correo. Revisá la conexión y el perfil SMTP asignado a Presupuestos." }); }
        }
        private static bool EmailValido(string valor) { try { var a=new System.Net.Mail.MailAddress(valor ?? ""); return string.Equals(a.Address, valor, StringComparison.OrdinalIgnoreCase); } catch { return false; } }
    }
}
