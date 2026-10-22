using System;
using System.Linq;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using System.Web.Http;
using System.Net;
using WebApi_TransporteSanchez.Security;

namespace WebApi_TransporteSanchez.Controllers
{
    [Route("api/login")]
    public class LoginController : ApiController
    {
        private readonly IConfiguration _config;

        public LoginController(IConfiguration config)
        {
            _config = config;
        }

        public class LoginRequestDTO
        {
            public string Nombre_Usuario { get; set; }
            public string Contraseña { get; set; }
        }

        public class LoginResponseDTO
        {
            public string Token { get; set; }
            public string Nombre_Usuario { get; set; }
            public string Nombre { get; set; }
            public string Apellido { get; set; }
            public string Rol { get; set; }
        }

        [HttpPost]
        public IHttpActionResult Login(LoginRequestDTO userLogin)
        {
            if (userLogin == null || string.IsNullOrWhiteSpace(userLogin.Nombre_Usuario) || string.IsNullOrEmpty(userLogin.Contraseña))
                return Content(HttpStatusCode.BadRequest, new { error = "El usuario y la contraseña son obligatorios." });

            try
            {
                var connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var nombreUsuario = userLogin.Nombre_Usuario.Trim();
                    var usuario = db.Set<USUARIOS>().FirstOrDefault(u => u.Nombre_Usuario.ToLower() == nombreUsuario.ToLower());

                    if (usuario == null ||
                        !string.Equals(usuario.EstadoUsuario, "Activo", StringComparison.OrdinalIgnoreCase) ||
                        !ContrasenasSeguras.Verificar(userLogin.Contraseña, usuario.Contraseña))
                    {
                        return Content(HttpStatusCode.Unauthorized, new { General = "Usuario o contraseña incorrectos." });
                    }

                    if (!ContrasenasSeguras.EsHashVigente(usuario.Contraseña))
                    {
                        var valorHeredado = usuario.Contraseña;
                        var hash = ContrasenasSeguras.CrearHash(userLogin.Contraseña);
                        var filasActualizadas = db.Database.ExecuteSqlCommand(
                            "UPDATE dbo.USUARIOS SET Contraseña = @p0 WHERE Usuario_ID = @p1 AND Contraseña = @p2",
                            new SqlParameter("@p0", hash),
                            new SqlParameter("@p1", usuario.Usuario_ID),
                            new SqlParameter("@p2", valorHeredado));

                        if (filasActualizadas != 1)
                            return Content(HttpStatusCode.Unauthorized, new { General = "Usuario o contraseña incorrectos." });

                        usuario.Contraseña = hash;
                    }

                    RegistrarInicioSesion(db, usuario);
                    return Ok(new LoginResponseDTO
                    {
                        Token = Generate(usuario),
                        Nombre_Usuario = usuario.Nombre_Usuario,
                        Nombre = usuario.Nombre,
                        Apellido = usuario.Apellido,
                        Rol = usuario.Rol
                    });
                }
            }
            catch
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo iniciar sesión." });
            }
        }

        private static void RegistrarInicioSesion(SGTLAuditContext db, USUARIOS usuario)
        {
            try
            {
                string origenIp = null;
                try { origenIp = System.Web.HttpContext.Current?.Request?.UserHostAddress; } catch { }
                db.Database.ExecuteSqlCommand(
                    "INSERT INTO AUDITORIA (Fecha, Usuario, Accion, Entidad, Clave, Valores_Anteriores, Valores_Nuevos, Origen) " +
                    "VALUES (GETDATE(), @usu, 'LOGIN', 'USUARIOS', @clave, NULL, @detalle, @origen)",
                    new SqlParameter("@usu", (object)usuario.Nombre_Usuario ?? DBNull.Value),
                    new SqlParameter("@clave", "Usuario_ID=" + usuario.Usuario_ID),
                    new SqlParameter("@detalle", "Inicio de sesión"),
                    new SqlParameter("@origen", (object)origenIp ?? DBNull.Value));
            }
            catch
            {
                // La auditoría no debe impedir el inicio de sesión.
            }
        }

        private string Generate(USUARIOS user)
        {
            if (string.IsNullOrEmpty(JwtConfig.SecretKey))
                throw new ArgumentException("La clave JWT no está configurada.");

            var securitykey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey));
            var credentials = new SigningCredentials(securitykey, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Nombre_Usuario),
                new Claim(ClaimTypes.Name, user.Nombre),
                new Claim(ClaimTypes.Surname, user.Apellido),
                new Claim(ClaimTypes.Role, user.Rol)
            };

            var token = new JwtSecurityToken(
                JwtConfig.Issuer,
                JwtConfig.Audience,
                claims,
                expires: DateTime.Now.AddMinutes(JwtConfig.ExpirationMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
