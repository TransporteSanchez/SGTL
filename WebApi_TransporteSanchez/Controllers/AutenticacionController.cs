using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Data.Entity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using System.Web.Http;
using System.Net;

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

        // Clase que representa la solicitud de inicio de sesión
        public class LoginRequestDTO
        {
            public string Nombre_Usuario { get; set; }
            public string Contraseña { get; set; }
        }

        // Clase que representa la respuesta de inicio de sesión
        public class LoginResponseDTO
        {
            public string Token { get; set; }
            public string Nombre_Usuario { get; set; }
            public string Rol { get; set; }
        }

        [HttpPost]
        public IHttpActionResult Login(LoginRequestDTO userLogin)
        {
            // Validar que el objeto de solicitud y los campos no sean nulos o vacíos
            if (userLogin == null || string.IsNullOrEmpty(userLogin.Nombre_Usuario) || string.IsNullOrEmpty(userLogin.Contraseña))
            {
                return Content(HttpStatusCode.BadRequest, new { error = "El nombre de usuario y la contraseña son obligatorios." });
            }

            var validationErrors = new Dictionary<string, string>();

            // Verificar si el usuario existe en la base de datos
            var userExists = UserExists(userLogin.Nombre_Usuario);

            // Verificar si la contraseña es correcta (independientemente del usuario)
            var isPasswordValid = IsPasswordValid(userLogin.Contraseña);

            if (!userExists)
            {
                // Caso: Usuario no existe
                if (isPasswordValid)
                {
                    // La contraseña es correcta, pero el usuario es incorrecto
                    validationErrors["Nombre_Usuario"] = "Usuario incorrecto";
                }
                else
                {
                    // Ambos son incorrectos
                    validationErrors["General"] = "Usuario y contraseña incorrectos";
                }
            }
            else
            {
                // Usuario existe, verificar si la contraseña coincide con este usuario específico
                var user = Authenticate(userLogin);
                if (user == null)
                {
                    // Usuario existe pero la contraseña es incorrecta
                    validationErrors["Contraseña"] = "Contraseña incorrecta";
                }
                else
                {
                    // Usuario y contraseña son correctos, generar el token
                    try
                    {
                        var token = Generate(user);

                        var response = new LoginResponseDTO
                        {
                            Token = token,
                            Nombre_Usuario = user.Nombre_Usuario,
                            Rol = user.Rol
                        };

                        return Ok(response);
                    }
                    catch (Exception ex)
                    {
                        return Content(HttpStatusCode.InternalServerError, new { error = $"Error inesperado: {ex.Message}" });
                    }
                }
            }

            // Devolver los errores de validación con un estado 401 Unauthorized
            if (validationErrors.Count > 0)
            {
                return Content(HttpStatusCode.Unauthorized, validationErrors);
            }

            return Ok();
        }

        // Método para verificar si el usuario existe en la base de datos
        private bool UserExists(string nombreUsuario)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
            using (var db = new DbContext(connectionString))
            {
                return db.Set<USUARIOS>().Any(user => user.Nombre_Usuario.ToLower() == nombreUsuario.ToLower());
            }
        }

        // Método para verificar si la contraseña es correcta para algún usuario (sin importar el nombre de usuario)
        private bool IsPasswordValid(string password)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
            using (var db = new DbContext(connectionString))
            {
                return db.Set<USUARIOS>().Any(user => user.Contraseña == password);
            }
        }

        // Método para autenticar un usuario específico por nombre de usuario y contraseña
        private USUARIOS Authenticate(LoginRequestDTO userLogin)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
            using (var db = new DbContext(connectionString))
            {
                return db.Set<USUARIOS>().FirstOrDefault(user =>
                    user.Nombre_Usuario.ToLower() == userLogin.Nombre_Usuario.ToLower() &&
                    user.Contraseña == userLogin.Contraseña);
            }
        }

        private string Generate(USUARIOS user)
        {
            if (string.IsNullOrEmpty(JwtConfig.SecretKey))
                throw new ArgumentException("La clave JWT no está configurada o es nula.");

            var securitykey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey));
            var credentials = new SigningCredentials(securitykey, SecurityAlgorithms.HmacSha256);

            // Crear los Claims
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
