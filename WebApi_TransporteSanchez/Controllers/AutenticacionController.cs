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

        [HttpPost]
        public IHttpActionResult Login(LoginRequestDTO userLogin)
        {
            var validationErrors = new List<string>();

            // Validación básica de los campos de entrada
            if (userLogin == null)
            {
                validationErrors.Add("Error: El objeto de solicitud es nulo.");
            }
            else
            {
                if (string.IsNullOrEmpty(userLogin.Nombre_Usuario))
                    validationErrors.Add("Propiedad: Nombre_Usuario, Error: El nombre de usuario es obligatorio.");

                if (string.IsNullOrEmpty(userLogin.Contraseña))
                    validationErrors.Add("Propiedad: Contraseña, Error: La contraseña es obligatoria.");
            }

            if (validationErrors.Count > 0)
            {
                return Content(HttpStatusCode.BadRequest, validationErrors);
            }

            var user = Authenticate(userLogin);

            if (user != null)
            {
                try
                {
                    // Crear el Token
                    var token = Generate(user);

                    return Ok("Usuario logueado. Token: " + token);
                }
                catch (ArgumentException ex)
                {
                    validationErrors.Add($"Propiedad: SymmetricSecurityKey, Error: {ex.Message}");
                    return Content(HttpStatusCode.BadRequest, validationErrors);
                }
                catch (Exception ex)
                {
                    validationErrors.Add($"Error inesperado: {ex.Message}");
                    return Content(HttpStatusCode.InternalServerError, validationErrors);
                }
            }

            return Content(HttpStatusCode.NotFound, new List<string> { "Usuario no encontrado" });
        }

        private USUARIOS Authenticate(LoginRequestDTO userLogin)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            using (var db = new DbContext(connectionString))
            {
                // Buscar al usuario por Nombre_Usuario y Contraseña
                var currentUser = db.Set<USUARIOS>()
                    .FirstOrDefault(user => user.Nombre_Usuario.ToLower() == userLogin.Nombre_Usuario.ToLower()
                    && user.Contraseña == userLogin.Contraseña);

                return currentUser;
            }
        }

        private string Generate(USUARIOS user)
        {
            var validationErrors = new List<string>(); // Lista para almacenar errores de validación

            // Validar que la clave de JWT no esté vacía o sea nula
            if (string.IsNullOrEmpty(JwtConfig.SecretKey))
            {
                validationErrors.Add("Propiedad: Jwt:key, Error: La clave JWT no está configurada o es nula.");
            }

            if (validationErrors.Count > 0)
            {
                throw new ArgumentException(string.Join(", ", validationErrors));
            }

            // Crear la clave de seguridad
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

            // Crear el Token
            var token = new JwtSecurityToken(
                            _config["Jwt:Issuer"],
                            _config["Jwt:Audience"],
                            claims,
                            expires: DateTime.Now.AddMinutes(JwtConfig.ExpirationMinutes),
                            signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}