using System;
using System.Data;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using WebApi_TransporteSanchez.Security;

namespace WebApi_TransporteSanchez.Controllers
{
    [Route("api/login")]
    public class LoginController : ApiController
    {
        public sealed class LoginRequestDTO
        {
            public string Nombre_Usuario { get; set; }
            public string Contraseña { get; set; }
        }

        public sealed class LoginResponseDTO
        {
            public string Token { get; set; }
            public string Nombre_Usuario { get; set; }
            public string Nombre { get; set; }
            public string Apellido { get; set; }
            public string Rol { get; set; }
        }

        [HttpPost, AllowAnonymous]
        public async Task<IHttpActionResult> Login(
            LoginRequestDTO entrada,
            CancellationToken ct)
        {
            if (entrada == null ||
                string.IsNullOrWhiteSpace(entrada.Nombre_Usuario) ||
                entrada.Nombre_Usuario.Trim().Length > 50 ||
                string.IsNullOrEmpty(entrada.Contraseña) ||
                entrada.Contraseña.Length > 1024)
            {
                return Content(
                    HttpStatusCode.BadRequest,
                    new
                    {
                        error = "Ingresá el usuario y la contraseña."
                    });
            }

            var ip = HttpContext.Current == null
                ? "sin-ip"
                : HttpContext.Current.Request.UserHostAddress;

            if (!LimitesAcceso.Permitir("login:global", 300) ||
                !LimitesAcceso.Permitir("login:ip:" + ip, 30))
            {
                return Content(
                    (HttpStatusCode)429,
                    new
                    {
                        error = "Esperá unos minutos antes de volver a intentar."
                    });
            }

            try
            {
                using (var db = SeguridadSql.Abrir())
                {
                    var candidatos = await db.Database
                        .SqlQuery<UsuarioAcceso>(
                            SeguridadSql.Usuario +
                            "WHERE LOWER(Nombre_Usuario)=LOWER(@nombre);",
                            SeguridadSql.P(
                                "@nombre",
                                SqlDbType.NVarChar,
                                entrada.Nombre_Usuario.Trim(),
                                50))
                        .ToListAsync(ct);

                    var usuario = candidatos.Count == 1
                        ? candidatos[0]
                        : null;

                    if (usuario == null)
                    {
                        ClavesSeguras.SimularVerificacion(
                            entrada.Contraseña);

                        return CredencialesIncorrectas();
                    }

                    // Durante la transición, una cuenta en texto plano
                    // también realiza trabajo PBKDF2.
                    if (ClavesSeguras.RequiereActualizar(usuario.Clave))
                    {
                        ClavesSeguras.SimularVerificacion(
                            entrada.Contraseña);
                    }

                    bool correcta = ClavesSeguras.Verificar(
                        entrada.Contraseña,
                        usuario.Clave);

                    if (!correcta ||
                        !string.Equals(
                            usuario.EstadoUsuario,
                            "Activo",
                            StringComparison.OrdinalIgnoreCase))
                    {
                        return CredencialesIncorrectas();
                    }

                    if (ClavesSeguras.RequiereActualizar(usuario.Clave))
                    {
                        var hash = ClavesSeguras.Crear(
                            entrada.Contraseña);

                        int filas = await db.Database
                            .ExecuteSqlCommandAsync(
                             @"UPDATE dbo.USUARIOS
                             SET Contraseña = @nueva, VersionSesion = VersionSesion + 1
                             WHERE Usuario_ID = @id
                             AND VersionSesion = @version
                             AND EstadoUsuario = 'Activo'
                             AND Contraseña COLLATE Latin1_General_100_BIN2 = @anterior COLLATE Latin1_General_100_BIN2
                             AND DATALENGTH(Contraseña) = DATALENGTH(@anterior);",
                                ct,
                                SeguridadSql.P(
                                    "@nueva",
                                    SqlDbType.NVarChar,
                                    hash,
                                    255),
                                SeguridadSql.P(
                                    "@id",
                                    SqlDbType.Int,
                                    usuario.Usuario_ID),
                                SeguridadSql.P(
                                    "@version",
                                    SqlDbType.BigInt,
                                    usuario.VersionSesion),
                                SeguridadSql.P(
                                    "@anterior",
                                    SqlDbType.NVarChar,
                                    usuario.Clave,
                                    255));

                        if (filas != 1)
                        {
                            return CredencialesIncorrectas();
                        }

                        usuario.Clave = hash;
                        usuario.VersionSesion++;
                    }
                    // Un cambio simultáneo de contraseña, estado o rol
                    // impide emitir una sesión con los datos anteriores.
                    var vigentes = await db.Database
                        .SqlQuery<UsuarioAcceso>(
                            SeguridadSql.Usuario +
                            @"WHERE Usuario_ID = @id
                            AND VersionSesion = @version
                            AND EstadoUsuario = 'Activo'
                            AND Contraseña COLLATE Latin1_General_100_BIN2 = @clave COLLATE Latin1_General_100_BIN2
                            AND DATALENGTH(Contraseña) = DATALENGTH(@clave);",
                            SeguridadSql.P(
                                "@id",
                                SqlDbType.Int,
                                usuario.Usuario_ID),
                            SeguridadSql.P(
                                "@version",
                                SqlDbType.BigInt,
                                usuario.VersionSesion),
                            SeguridadSql.P(
                                "@clave",
                                SqlDbType.NVarChar,
                                usuario.Clave,
                                255))
                        .ToListAsync(ct);

                    if (vigentes.Count != 1)
                    {
                        return CredencialesIncorrectas();
                    }

                    usuario = vigentes[0];

                    var token = SesionSegura.Emitir(usuario);

                    SeguridadSql.Auditar(
                        usuario.Nombre_Usuario,
                        "LOGIN",
                        usuario.Usuario_ID);

                    return Ok(new LoginResponseDTO
                    {
                        Token = token,
                        Nombre_Usuario = usuario.Nombre_Usuario,
                        Nombre = usuario.Nombre,
                        Apellido = usuario.Apellido,
                        Rol = usuario.Rol
                    });
                }
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch
            {
                return Content(
                    HttpStatusCode.InternalServerError,
                    new
                    {
                        error = "No se pudo iniciar sesión."
                    });
            }
        }

        private IHttpActionResult CredencialesIncorrectas()
        {
            return Content(
                HttpStatusCode.Unauthorized,
                new
                {
                    General = "Usuario o contraseña incorrectos."
                });
        }
    }
}