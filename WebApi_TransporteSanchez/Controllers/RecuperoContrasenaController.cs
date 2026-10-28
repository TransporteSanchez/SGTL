using System;
using System.Collections.Generic;
using System.Net;
using System.Threading;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using WebApi_TransporteSanchez.Security;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/recupero-contrasena")]
    public class RecuperoContrasenaController : ApiController
    {
        public sealed class SolicitarDto { public string Email { get; set; } }
        public sealed class RestablecerDto
        {
            public string Token { get; set; }
            public string ContrasenaNueva { get; set; }
            public string RepetirContrasena { get; set; }
        }

        private static int pendientes;
        private static readonly object candado = new object();
        private static readonly Dictionary<string, Tuple<DateTime, int>> limites = new Dictionary<string, Tuple<DateTime, int>>();

        [HttpGet, Route("~/api/sesion")]
        public IHttpActionResult VerificarSesion()
        {
            try
            {
                if (SesionesRecupero.Vigente(SesionesRecupero.Leer(Request))) return Ok();
                return Content(HttpStatusCode.Unauthorized, new { error = "Tu sesión venció. Volvé a iniciar sesión." });
            }
            catch (Microsoft.IdentityModel.Tokens.SecurityTokenException)
            { return Content(HttpStatusCode.Unauthorized, new { error = "Tu sesión venció. Volvé a iniciar sesión." }); }
            catch
            { return Content(HttpStatusCode.ServiceUnavailable, new { error = "No se pudo verificar la sesión. Probá de nuevo." }); }
        }

        internal static bool Permitir(string clave, int maximo)
        {
            lock (candado)
            {
                var ahora = DateTime.UtcNow;
                if (limites.Count > 2000)
                {
                    var vencidas = new List<string>();
                    foreach (var par in limites) if (par.Value.Item1 <= ahora) vencidas.Add(par.Key);
                    foreach (var vencida in vencidas) limites.Remove(vencida);
                    if (limites.Count > 10000) return false;
                }
                Tuple<DateTime, int> actual;
                if (!limites.TryGetValue(clave, out actual) || actual.Item1 <= ahora)
                    actual = Tuple.Create(ahora.AddMinutes(15), 0);
                limites[clave] = Tuple.Create(actual.Item1, actual.Item2 + 1);
                return actual.Item2 < maximo;
            }
        }

        [HttpPost, Route("solicitar")]
        public IHttpActionResult Solicitar(SolicitarDto value)
        {
            string email;
            try { email = RecuperoContrasena.NormalizarEmail(value == null ? null : value.Email); }
            catch (ArgumentException) { return Content(HttpStatusCode.BadRequest, new { error = "Escribí un e-mail válido." }); }
            var ip = HttpContext.Current == null ? "sin-ip" : HttpContext.Current.Request.UserHostAddress;
            if (Permitir("global-solicitar", 120) && Permitir("solicitar:" + ip, 10))
            {
                if (Interlocked.Increment(ref pendientes) <= 32)
                {
                    try
                    {
                        // La respuesta no depende de si existe la cuenta ni del tiempo del servidor SMTP.
                        HostingEnvironment.QueueBackgroundWorkItem(cancelacion =>
                        {
                            try
                            {
                                if (!cancelacion.IsCancellationRequested)
                                    new RecuperoContrasena(new RepositorioRecuperoSql(), new CorreoRecupero()).Solicitar(email);
                            }
                            catch { System.Diagnostics.Trace.TraceWarning("No se pudo procesar una solicitud de recupero de contraseña."); }
                            finally { Interlocked.Decrement(ref pendientes); }
                        });
                    }
                    catch { Interlocked.Decrement(ref pendientes); }
                }
                else Interlocked.Decrement(ref pendientes);
            }
            return Ok(new { mensaje = RecuperoContrasena.MensajeSolicitud });
        }

        [HttpPost, Route("restablecer")]
        public IHttpActionResult Restablecer(RestablecerDto value)
        {
            var ip = HttpContext.Current == null ? "sin-ip" : HttpContext.Current.Request.UserHostAddress;
            if (!Permitir("global-restablecer", 300) || !Permitir("restablecer:" + ip, 30))
                return Content((HttpStatusCode)429, new { error = "Se hicieron varios intentos. Esperá unos minutos y probá de nuevo." });
            if (value == null) return Content(HttpStatusCode.BadRequest, new { error = RecuperoContrasena.EnlaceInvalido });
            try
            {
                string mensaje;
                var bien = new RecuperoContrasena(new RepositorioRecuperoSql(), new CorreoRecupero())
                    .Restablecer(value.Token, value.ContrasenaNueva, value.RepetirContrasena, out mensaje);
                return bien ? (IHttpActionResult)Ok(new { mensaje }) : Content(HttpStatusCode.BadRequest, new { error = mensaje });
            }
            catch { return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo restablecer la contraseña. Probá de nuevo." }); }
        }
    }
}
