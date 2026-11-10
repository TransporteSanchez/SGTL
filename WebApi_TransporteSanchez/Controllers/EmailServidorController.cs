using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/EmailServidor")]
    public sealed class EmailServidorController : ApiController
    {
        private readonly IGestionPerfilesEmail perfiles;
        private readonly IAccesoEmail acceso;

        public EmailServidorController(IGestionPerfilesEmail perfiles, IAccesoEmail acceso)
        {
            this.perfiles = perfiles;
            this.acceso = acceso;
        }

        [HttpGet, Route("")]
        public Task<IHttpActionResult> Listar(CancellationToken ct)
        {
            return Ejecutar(async usuario => Ok(await perfiles.ListarAsync(ct)), ct);
        }

        [HttpGet, Route("{id:int}", Name = "EmailServidorPorId")]
        public Task<IHttpActionResult> Obtener(int id, CancellationToken ct)
        {
            return Ejecutar(async usuario =>
            {
                if (!IdValido(id)) return BadRequest("El identificador no es válido.");

                var perfil = await perfiles.ObtenerAsync(id, ct);
                if (perfil == null) return NotFound();
                return Ok(perfil);
            }, ct);
        }

        [HttpPost, Route("")]
        public Task<IHttpActionResult> Crear([FromBody] PerfilEmailEntrada entrada, CancellationToken ct)
        {
            return Ejecutar(async usuario =>
            {
                if (entrada == null) return BadRequest("Completá los datos del perfil.");
                if (!ModelState.IsValid) return BadRequest(ModelState);
                if (string.IsNullOrWhiteSpace(entrada.CredentialFromMailPass))
                    return BadRequest("Ingresá la contraseña SMTP para crear el perfil.");

                var perfil = await perfiles.CrearAsync(entrada, usuario, ct);
                return CreatedAtRoute("EmailServidorPorId", new { id = perfil.Es_id }, perfil);
            }, ct);
        }

        [HttpPut, Route("{id:int}")]
        public Task<IHttpActionResult> Editar(int id, [FromBody] PerfilEmailEntrada entrada, CancellationToken ct)
        {
            return Ejecutar(async usuario =>
            {
                if (!IdValido(id)) return BadRequest("El identificador no es válido.");
                if (entrada == null) return BadRequest("Completá los datos del perfil.");
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var perfil = await perfiles.EditarAsync(id, entrada, usuario, ct);
                if (perfil == null) return NotFound();
                return Ok(perfil);
            }, ct);
        }

        [HttpDelete, Route("{id:int}")]
        public Task<IHttpActionResult> Eliminar(int id, CancellationToken ct)
        {
            return Ejecutar(async usuario =>
            {
                if (!IdValido(id)) return BadRequest("El identificador no es válido.");
                if (!await perfiles.EliminarAsync(id, usuario, ct)) return NotFound();
                return StatusCode(HttpStatusCode.NoContent);
            }, ct);
        }

        [HttpGet, Route("asignaciones/{modulo}")]
        public Task<IHttpActionResult> ObtenerAsignacion(string modulo, CancellationToken ct)
        {
            return Ejecutar(async usuario =>
            {
                var codigo = CodigoModulo(modulo);
                if (codigo == null) return NotFound();

                var asignacion = await perfiles.ObtenerAsignacionAsync(codigo, ct);
                if (asignacion == null) return NotFound();
                return Ok(asignacion);
            }, ct);
        }

        [HttpPut, Route("asignaciones/{modulo}")]
        public Task<IHttpActionResult> GuardarAsignacion(
            string modulo, [FromBody] AsignacionEmailEntrada entrada, CancellationToken ct)
        {
            return Ejecutar(async usuario =>
            {
                var codigo = CodigoModulo(modulo);
                if (codigo == null) return NotFound();
                if (entrada == null || !entrada.Service.HasValue || entrada.Service.Value < 1)
                    return BadRequest("Seleccioná un perfil SMTP válido.");
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var asignacion = await perfiles.GuardarAsignacionAsync(
                    codigo, entrada.Service.Value, usuario, ct);
                if (asignacion == null) return BadRequest("El perfil SMTP seleccionado ya no existe.");
                return Ok(asignacion);
            }, ct);
        }

        [HttpPost, Route("{id:int}/probar")]
        public Task<IHttpActionResult> Probar(int id, [FromBody] PruebaEmailEntrada entrada, CancellationToken ct)
        {
            return Ejecutar(async usuario =>
            {
                if (!IdValido(id)) return BadRequest("El identificador no es válido.");
                if (entrada == null || string.IsNullOrWhiteSpace(entrada.EmailDestino))
                    return BadRequest("Ingresá un correo de destino.");
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var destino = entrada.EmailDestino.Trim();
                if (!await perfiles.EnviarPruebaAsync(id, destino, usuario, ct)) return NotFound();
                return Ok(new { mensaje = "Correo de prueba enviado a " + destino + "." });
            }, ct);
        }

        private async Task<IHttpActionResult> Ejecutar(
            Func<string, Task<IHttpActionResult>> operacion, CancellationToken ct)
        {
            try
            {
                var usuario = await acceso.AutenticarAsync(Request.Headers.Authorization, ct);
                if (usuario == null || string.IsNullOrWhiteSpace(usuario.Nombre)) return Unauthorized();
                if (!usuario.EsAdministrador)
                    return Content(HttpStatusCode.Forbidden, new { error = "Solo un administrador puede gestionar e-mail." });

                return await operacion(usuario.Nombre);
            }
            catch (ValidacionEmailException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (PerfilEmailEnUsoException)
            {
                return Content(HttpStatusCode.Conflict, new { error = "El perfil está asignado o tiene envíos registrados." });
            }
            catch (EnvioSmtpException)
            {
                return Content(HttpStatusCode.BadGateway, new { error = "Falló el envío SMTP. Revisá el servidor, el puerto, la seguridad y las credenciales." });
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                Trace.TraceError("Gestión de e-mail: {0}", ex.GetType().FullName);
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo completar la operación de e-mail." });
            }
        }

        private static bool IdValido(int id)
        {
            return id > 0 && id <= short.MaxValue;
        }

        private static string CodigoModulo(string modulo)
        {
            var codigo = (modulo ?? string.Empty).ToUpperInvariant();
            return codigo == "FACTURACION" || codigo == "PRESUPUESTOS" ? codigo : null;
        }
    }

    public sealed class PerfilEmailEntrada
    {
        [Required, StringLength(100)]
        public string Name { get; set; }

        [Required, StringLength(100)]
        public string SmtpHost { get; set; }

        [Required, Range(1, 65535)]
        public int? SmtpPort { get; set; }

        [Required, RegularExpression("^(StartTls|SslOnConnect)$")]
        public string ModoSeguridad { get; set; }

        [Required, EmailAddress, StringLength(100)]
        public string CredentialFromMailAddres { get; set; }

        [StringLength(180)]
        public string CredentialFromMailPass { get; set; }

        [StringLength(250)]
        public string Asunto { get; set; }

        public string CuerpoHtml { get; set; }
    }

    public sealed class PerfilEmailSalida
    {
        public short Es_id { get; set; }
        public short Service { get; set; }
        public string Name { get; set; }
        public string SmtpHost { get; set; }
        public int? SmtpPort { get; set; }
        public string ModoSeguridad { get; set; }
        public string CredentialFromMailAddres { get; set; }
        public string Asunto { get; set; }
        public string CuerpoHtml { get; set; }
        public bool TienePassword { get; set; }
    }

    public sealed class AsignacionEmailEntrada
    {
        public short? Service { get; set; }
    }

    public sealed class AsignacionEmailSalida
    {
        public string Modulo { get; set; }
        public short Service { get; set; }
        public short EmailServidorID { get; set; }
        public string Perfil { get; set; }
        public string Remitente { get; set; }
    }

    public sealed class PruebaEmailEntrada
    {
        [Required, EmailAddress, StringLength(254)]
        public string EmailDestino { get; set; }
    }

    public sealed class UsuarioEmailAutenticado
    {
        public string Nombre { get; set; }
        public bool EsAdministrador { get; set; }
    }

    public interface IAccesoEmail
    {
        Task<UsuarioEmailAutenticado> AutenticarAsync(AuthenticationHeaderValue encabezado, CancellationToken ct);
    }

    public interface IGestionPerfilesEmail
    {
        Task<IReadOnlyList<PerfilEmailSalida>> ListarAsync(CancellationToken ct);
        Task<PerfilEmailSalida> ObtenerAsync(int id, CancellationToken ct);
        Task<PerfilEmailSalida> CrearAsync(PerfilEmailEntrada entrada, string usuario, CancellationToken ct);
        Task<PerfilEmailSalida> EditarAsync(int id, PerfilEmailEntrada entrada, string usuario, CancellationToken ct);
        Task<bool> EliminarAsync(int id, string usuario, CancellationToken ct);
        Task<AsignacionEmailSalida> ObtenerAsignacionAsync(string modulo, CancellationToken ct);
        Task<AsignacionEmailSalida> GuardarAsignacionAsync(string modulo, short service, string usuario, CancellationToken ct);
        Task<bool> EnviarPruebaAsync(int id, string destino, string usuario, CancellationToken ct);
    }

    public sealed class ValidacionEmailException : Exception
    {
        public ValidacionEmailException(string mensaje) : base(mensaje) { }
    }

    public sealed class PerfilEmailEnUsoException : Exception { }

    public sealed class EnvioSmtpException : Exception
    {
        public EnvioSmtpException(Exception causa) : base("Falló el envío SMTP.", causa) { }
    }
}