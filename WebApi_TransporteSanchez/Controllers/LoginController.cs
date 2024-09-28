using System;
using System.Linq;
using System.Collections.Generic;
using System.Text;
using System.Net;
using System.Web.Http;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/login")]  // Configuración de la ruta base
    public class Login2Controller : ApiController
    {
        // Clase que representa la solicitud de inicio de sesión
        public class Login2RequestDTO
        {
            public string Nombre_Usuario { get; set; }
            public string Contraseña { get; set; }
        }

        [HttpPost]
        [Route("login")]
        public IHttpActionResult Login([FromBody] Login2RequestDTO request)
        {
            if (request == null || string.IsNullOrEmpty(request.Nombre_Usuario) || string.IsNullOrEmpty(request.Contraseña))
            {
                return BadRequest("Usuario o contraseña no pueden estar vacíos.");
            }

            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    // Buscar al usuario por Nombre_Usuario y Contraseña (debe ser comparado de manera segura si está cifrado)
                    var usuario = db.Set<USUARIOS>().SingleOrDefault(u => u.Nombre_Usuario == request.Nombre_Usuario && u.Contraseña == request.Contraseña);

                    if (usuario == null)
                    {
                        return Unauthorized();  // Usuario o contraseña incorrectos
                    }

                    // Mapea el usuario a UsuariosDTO
                    var UsuariosDto = new
                    {
                        Usuario_ID = usuario.Usuario_ID,
                        Nombre_Usuario = usuario.Nombre_Usuario,
                        // Asigna otras propiedades necesarias
                    };

                    // Retornar un resultado exitoso con los detalles del usuario (sin incluir la entidad directamente)
                    return Ok(new { message = "Inicio de sesión exitoso" });
                }
            }
            catch (DbUpdateException ex)
            {
                // Manejo de errores relacionados con la base de datos
                return InternalServerError(new Exception("Error al acceder a la base de datos.", ex)); // Retorna 500 en caso de error interno
            }
            catch (DbEntityValidationException ex)
            {
                // Manejo de errores de validación
                var validationErrors = new List<string>();

                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }

                return Content(HttpStatusCode.BadRequest, validationErrors); // Retorna 400 Bad Request con errores de validación
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }
    }
}
