using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Web.Http;


namespace WebApi_TransporteSanchez.Controllers
{

    [RoutePrefix("api/auth")]  // Configuración de la ruta base
    public class AutenticacionController : ApiController
    {

        // Clase que representa la solicitud de inicio de sesión
        public class LoginRequestDTO
        {
            public string Nombre_Usuario { get; set; }
            public string Contraseña { get; set; }
        }


        // Acción para el inicio de sesión
        [HttpPost]
        [Route("login")]  // Ruta específica para la acción de login

        public IHttpActionResult Login([FromBody] LoginRequestDTO request)
        {

            if (request == null || string.IsNullOrEmpty(request.Nombre_Usuario) || string.IsNullOrEmpty(request.Contraseña))
            {
                return BadRequest("Usuario o contraseña no pueden estar vacíos.");
            }

            // Buscar al usuario por Nombre_Usuario en la base de datos

            // Usar el contexto de la base de datos para buscar al usuario

            using (SGTLEntities db = new SGTLEntities())
            {
                var usuario = db.USUARIOS.SingleOrDefault(u => u.Nombre_Usuario == request.Nombre_Usuario);
                //var usuario = db.USUARIOS.SingleOrDefault(u => u.Nombre_Usuario == request.Nombre_Usuario && u.Contraseña == request.Contraseña);

                // Usuario no encontrado

                if (usuario == null)
                {
                    return Content(HttpStatusCode.Unauthorized, "Usuario no encontrado.");
                }

                // Verificar la contraseña (suponiendo que la contraseña está almacenada en un formato cifrado)
                if (!VerifyPassword(request.Contraseña, usuario.Contraseña))

                // Contraseña incorrecta
                {
                    return Content(HttpStatusCode.Unauthorized, "Contraseña incorrecta.");
                }

                // Retornar un resultado exitoso con los detalles del usuario
                return Ok(new { message = "Inicio de sesión exitoso", usuario = usuario });

            }

        }

        // Método para verificar la contraseña cifrada
        private bool VerifyPassword(string password, string hashedPassword)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedInputPassword = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(password)));
                return hashedInputPassword == hashedPassword;
            }
        }
    }
}

