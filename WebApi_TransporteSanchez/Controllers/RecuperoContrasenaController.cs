using System;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using WebApi_TransporteSanchez.Security;

namespace WebApi_TransporteSanchez.Controllers
{
    [AllowAnonymous, RoutePrefix("api/recupero-contrasena")]
    public sealed class RecuperoContrasenaController : ApiController
    {
        private static int pendientes;

        public sealed class SolicitarEntrada
        {
            public string Email { get; set; }
        }

        public sealed class RestablecerEntrada
        {
            public string Token { get; set; }
            public string ContrasenaNueva { get; set; }
            public string RepetirContrasena { get; set; }
        }

        [HttpGet, Route("~/api/sesion")]
        public async Task<IHttpActionResult> Sesion(CancellationToken ct)
        {
            try
            {
                var usuario = await SesionSegura.VerificarAsync(Request, ct);

                if (usuario == null)
                    return Responder(HttpStatusCode.Unauthorized,
                        new
                        {
                            error = "Tu sesión venció. Volvé a iniciar sesión."
                        });

                return Responder(
                    HttpStatusCode.OK, new { vigente = true });
            }
            catch (OperationCanceledException)
                when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch
            {
                return Responder(HttpStatusCode.ServiceUnavailable,
                    new
                    {
                        error = "No se pudo verificar la sesión. Probá de nuevo."
                    });
            }
        }

        [HttpPost, Route("solicitar")]
        public IHttpActionResult Solicitar(
            [FromBody] SolicitarEntrada entrada)
        {
            string email;

            try
            {
                email = RecuperoContrasena.NormalizarEmail(
                    entrada == null ? null : entrada.Email);
            }
            catch (ArgumentException)
            {
                return Responder(HttpStatusCode.BadRequest,
                    new { error = "Ingresá un e-mail válido." });
            }

            if (!ModelState.IsValid)
                return Responder(HttpStatusCode.BadRequest,
                    new { error = "Ingresá un e-mail válido." });

            var ip =
                HttpContext.Current?.Request.UserHostAddress ?? "sin-ip";

            if (LimitesAcceso.Permitir("recupero:global", 120) &&
                LimitesAcceso.Permitir("recupero:ip:" + ip, 10))
            {
                Encolar(ct =>
                    new RecuperoContrasena(new GestionPerfilesEmail())
                        .SolicitarAsync(email, ct));
            }

            return Responder(HttpStatusCode.OK,
                new
                {
                    mensaje = RecuperoContrasena.MensajeSolicitud
                });
        }

        [HttpPost, Route("restablecer")]
        public async Task<IHttpActionResult> Restablecer(
            [FromBody] RestablecerEntrada entrada,
            CancellationToken ct)
        {
            var ip =
                HttpContext.Current?.Request.UserHostAddress ?? "sin-ip";

            if (!LimitesAcceso.Permitir("restablecer:global", 300) ||
                !LimitesAcceso.Permitir("restablecer:ip:" + ip, 30))
            {
                return Responder((HttpStatusCode)429,
                    new
                    {
                        error = "Esperá unos minutos antes de volver a intentar."
                    });
            }

            if (entrada == null || !ModelState.IsValid ||
                !RecuperoContrasena.TokenValido(entrada.Token))
            {
                return Responder(HttpStatusCode.BadRequest,
                    new
                    {
                        error = RecuperoContrasena.EnlaceInvalido
                    });
            }

            string error;

            if (!ClavesSeguras.Validar(
                entrada.ContrasenaNueva, out error))
            {
                return Responder(
                    HttpStatusCode.BadRequest, new { error });
            }

            if (!string.Equals(
                entrada.ContrasenaNueva,
                entrada.RepetirContrasena,
                StringComparison.Ordinal))
            {
                return Responder(HttpStatusCode.BadRequest,
                    new { error = "Las contraseñas no coinciden." });
            }

            try
            {
                var email =
                    await new RecuperoContrasena(new GestionPerfilesEmail())
                        .RestablecerAsync(
                            entrada.Token,
                            entrada.ContrasenaNueva,
                            ct);

                if (email == null)
                    return Responder(HttpStatusCode.BadRequest,
                        new
                        {
                            error = RecuperoContrasena.EnlaceInvalido
                        });

                Encolar(cancelacion =>
                    new GestionPerfilesEmail().EnviarRecuperoAsync(
                        email,
                        "Contraseña restablecida",
                        "<p>Tu contraseña se restableció. Ingresá con tu contraseña nueva.</p>" +
                        "<p>Si no hiciste este cambio, comunicate con el área que administra tus accesos.</p>",
                        cancelacion));

                return Responder(HttpStatusCode.OK,
                    new
                    {
                        mensaje = "Contraseña restablecida. Ingresá con tu contraseña nueva."
                    });
            }
            catch (OperationCanceledException)
                when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                Trace.TraceError(
                    "Restablecer contraseña: {0}", ex.GetType().Name);

                return Responder(HttpStatusCode.InternalServerError,
                    new
                    {
                        error = "No se pudo restablecer la contraseña. Probá de nuevo."
                    });
            }
        }

        private static void Encolar(
            Func<CancellationToken, Task> trabajo)
        {
            if (Interlocked.Increment(ref pendientes) > 32)
            {
                Interlocked.Decrement(ref pendientes);
                return;
            }

            try
            {
                HostingEnvironment.QueueBackgroundWorkItem(async ct =>
                {
                    try
                    {
                        await trabajo(ct);
                    }
                    catch (OperationCanceledException)
                        when (ct.IsCancellationRequested)
                    {
                    }
                    catch (Exception ex)
                    {
                        Trace.TraceWarning(
                            "Recupero de contraseña: {0}",
                            ex.GetType().Name);
                    }
                    finally
                    {
                        Interlocked.Decrement(ref pendientes);
                    }
                });
            }
            catch
            {
                Interlocked.Decrement(ref pendientes);

                Trace.TraceWarning(
                    "No se pudo encolar un correo de recupero.");
            }
        }

        private IHttpActionResult Responder(
            HttpStatusCode estado, object datos)
        {
            var respuesta = Request.CreateResponse(estado, datos);

            respuesta.Headers.CacheControl =
                new CacheControlHeaderValue
                {
                    NoStore = true,
                    NoCache = true
                };

            return ResponseMessage(respuesta);
        }
    }
}