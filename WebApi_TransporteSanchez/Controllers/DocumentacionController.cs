using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Web.Http;
using Microsoft.IdentityModel.Tokens;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/Documentacion")]
    public class DocumentacionController : ApiController
    {
        private static SqlConnection Conexion()
        {
            return new SqlConnection(new EntityConnectionStringBuilder(
                ConnectionStringHelper.GetConnectionString("SGTLEntities")).ProviderConnectionString);
        }

        // Solo los usuarios con sesión válida y activos pueden consultar los documentos.
        private void ValidarUsuario(SqlConnection cn)
        {
            var auth = Request.Headers.Authorization;
            if (auth == null || !string.Equals(auth.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(auth.Parameter)) throw new UnauthorizedAccessException();
            string nombre;
            try
            {
                SecurityToken token;
                var principal = new JwtSecurityTokenHandler().ValidateToken(auth.Parameter, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                    ValidateIssuer = true, ValidIssuer = JwtConfig.Issuer, ValidateAudience = true, ValidAudience = JwtConfig.Audience,
                    ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1)
                }, out token);
                var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
                nombre = claim == null ? null : claim.Value;
            }
            catch { throw new UnauthorizedAccessException(); }
            if (string.IsNullOrWhiteSpace(nombre)) throw new UnauthorizedAccessException();
            using (var cmd = new SqlCommand("SELECT 1 FROM dbo.USUARIOS WHERE Nombre_Usuario=@nombre AND EstadoUsuario='Activo'", cn))
            {
                cmd.Parameters.Add("@nombre", SqlDbType.NVarChar, 256).Value = nombre;
                if (cmd.ExecuteScalar() == null) throw new UnauthorizedAccessException();
            }
        }

        private IHttpActionResult Error(Exception ex)
        {
            if (ex is UnauthorizedAccessException) return Content(HttpStatusCode.Unauthorized, new { message = "La sesión no es válida. Iniciá sesión nuevamente." });
            return Content(HttpStatusCode.InternalServerError, new { message = "No se pudo procesar la documentación. Verificá la conexión y la instalación de las tablas." });
        }

        // El login muestra solo el número de la última versión registrada, sin exponer los PDF.
        [AllowAnonymous, HttpGet, Route("version-actual")]
        public IHttpActionResult VersionActual()
        {
            try
            {
                using (var cn = Conexion())
                using (var cmd = new SqlCommand("SELECT TOP (1) NumeroVersion FROM dbo.VERSIONES ORDER BY Version_ID DESC", cn))
                {
                    cn.Open();
                    var version = cmd.ExecuteScalar() as string;
                    if (version == null) return NotFound();
                    var response = Request.CreateResponse(HttpStatusCode.OK, new { version = version });
                    response.Headers.CacheControl = new CacheControlHeaderValue { NoCache = true, NoStore = true, MustRevalidate = true };
                    return ResponseMessage(response);
                }
            }
            catch (Exception ex) { return Error(ex); }
        }

        [HttpGet, Route("manual")]
        public IHttpActionResult Manual()
        {
            try
            {
                using (var cn = Conexion())
                {
                    cn.Open(); ValidarUsuario(cn);
                    using (var cmd = new SqlCommand("SELECT FechaPublicacion, UsuarioPublicacion FROM dbo.MANUAL_USUARIO WHERE ManualUsuario_ID=1", cn))
                    using (var r = cmd.ExecuteReader())
                        return r.Read() ? Ok(new { fechaPublicacion = r.GetDateTime(0), usuarioPublicacion = r.GetString(1) }) : (IHttpActionResult)NotFound();
                }
            }
            catch (Exception ex) { return Error(ex); }
        }

        [HttpGet, Route("versiones")]
        public IHttpActionResult Versiones()
        {
            try
            {
                var lista = new List<object>();
                using (var cn = Conexion())
                {
                    cn.Open(); ValidarUsuario(cn);
                    using (var cmd = new SqlCommand("SELECT Version_ID, NumeroVersion, FechaVersion FROM dbo.VERSIONES ORDER BY FechaVersion DESC, Version_ID DESC", cn))
                    using (var r = cmd.ExecuteReader())
                        while (r.Read()) lista.Add(new { id = r.GetInt32(0), version = r.GetString(1), fecha = r.GetDateTime(2).ToString("yyyy-MM-dd") });
                }
                return Ok(lista);
            }
            catch (Exception ex) { return Error(ex); }
        }

        [HttpGet, Route("manual/pdf")]
        public IHttpActionResult PdfManual() { return Pdf(null); }

        [HttpGet, Route("versiones/{id:int}/pdf")]
        public IHttpActionResult PdfVersion(int id) { return Pdf(id); }

        private IHttpActionResult Pdf(int? id)
        {
            try
            {
                using (var cn = Conexion())
                {
                    cn.Open(); ValidarUsuario(cn);
                    using (var cmd = new SqlCommand(id.HasValue ? "SELECT Pdf FROM dbo.VERSIONES WHERE Version_ID=@id" : "SELECT Pdf FROM dbo.MANUAL_USUARIO WHERE ManualUsuario_ID=1", cn))
                    {
                        if (id.HasValue) cmd.Parameters.Add("@id", SqlDbType.Int).Value = id.Value;
                        var pdf = cmd.ExecuteScalar() as byte[];
                        if (pdf == null) return NotFound();
                        var response = new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(pdf) };
                        response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
                        response.Headers.CacheControl = new CacheControlHeaderValue { NoStore = true };
                        response.Headers.Add("X-Content-Type-Options", "nosniff");
                        return ResponseMessage(response);
                    }
                }
            }
            catch (Exception ex) { return Error(ex); }
        }

    }
}
