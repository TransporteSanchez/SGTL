using System;
using System.Collections.Generic;
using System.Data.Entity.Validation;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using static WebApi_TransporteSanchez.Controllers.ChoferesController;
using System.Data.Entity.Infrastructure;
using System.Web.UI.WebControls;
using System.ComponentModel.DataAnnotations;

namespace WebApi_TransporteSanchez.Controllers
{
    public class UsuariosController : ApiController
    {

        public class UsuariosDto
        {
            public int Usuario_ID { get; set; }
            public string Nombre { get; set; }
            public string Apellido { get; set; }
            public string Nombre_Usuario { get; set; }
            public string Contraseña { get; set; }
            public DateTime Fecha_Alta { get; set; }
            public string Rol { get; set; }
            public string EstadoUsuario { get; set; }
            public string Usu_Alta { get; set; }
            public System.DateTime Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }

        }

        // GET: api/Usuarios
        public IHttpActionResult Get()
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var usuarios = db.Set<USUARIOS>()
                        .Select(u => new UsuariosDto
                        {
                            Usuario_ID = u.Usuario_ID,
                            Nombre = u.Nombre,
                            Apellido = u.Apellido,
                            Nombre_Usuario = u.Nombre_Usuario,
                            Contraseña = u.Contraseña,
                            Fecha_Alta = u.Fecha_Alta,
                            Usu_Alta = u.Usu_Alta,
                            Rol = u.Rol,
                            EstadoUsuario = u.EstadoUsuario,
                            Usu_Modi = u.Usu_Modi,
                            Fecha_Modi = u.Fecha_Modi

                        })
                        .ToList();

                    if (usuarios == null || !usuarios.Any())
                    {
                        return NotFound(); // Retorna 404 si no se encuentran usuarios
                    }

                    return Ok(usuarios); // Retorna 200 con la lista de usuarios
                }
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


        // GET: api/Usuarios/Buscar
        [HttpGet]
        [Route("api/Usuarios/Buscar")]
        public IHttpActionResult Buscar(string nombre = null, string apellido = null, string nombreusuario = null, string EstadoUsuario = null, int page = 1, int pageSize = 8)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                // Usar DbContext directamente con la cadena de conexión personalizada
                using (var db = new DbContext(connectionString))
                {
                    // Consultar los choferes en la base de datos
                    var query = db.Set<USUARIOS>().AsQueryable();

                    if (!string.IsNullOrEmpty(nombre))
                    {
                        query = query.Where(u => u.Nombre.Contains(nombre));
                    }

                    if (!string.IsNullOrEmpty(apellido))
                    {
                        query = query.Where(u => u.Apellido.Contains(apellido));
                    }

                    if (!string.IsNullOrEmpty(nombreusuario))
                    {
                        query = query.Where(u => u.Nombre_Usuario.Contains(nombreusuario));
                    }

                    if (!string.IsNullOrEmpty(EstadoUsuario))
                    {
                        var estados = EstadoUsuario.Split(',');
                        query = query.Where(c => estados.Contains(c.EstadoUsuario));
                    }

                    var totalRecords = query.Count();
                    var results = query
                        .OrderBy(u => u.Nombre)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(u => new UsuariosDto
                        {
                            Usuario_ID = u.Usuario_ID,
                            Nombre = u.Nombre,
                            Apellido = u.Apellido,
                            Nombre_Usuario = u.Nombre_Usuario,
                            Contraseña = u.Contraseña,
                            EstadoUsuario = u.EstadoUsuario,
                            Fecha_Alta = u.Fecha_Alta,
                            Usu_Alta = u.Usu_Alta,
                            Rol = u.Rol,
                            Fecha_Modi = u.Fecha_Modi,
                            Usu_Modi = u.Usu_Modi,   

                        })
                        .ToList();

                    return Ok(new
                    {
                        TotalRecords = totalRecords,
                        Results = results
                    });
                }
            }
            catch (DbUpdateException ex)
            {
                // Manejo de errores relacionados con la base de datos
                return InternalServerError(new Exception("Error al acceder a la base de datos durante la búsqueda.", ex)); // Retorna 500 en caso de error interno
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

        // PUT: api/Usuarios/EstadoUsuario/{id}
        [HttpPut]
        [Route("api/Usuarios/EstadoUsuario/{id}")]
        public IHttpActionResult PutEstadoUsuario(int id, [FromBody] EstadoUsuarioUpdateModel model)
        {
            // Verificar si el modelo es válido
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState); // Retorna 400 si el modelo no es válido
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    // Buscar la entidad USUARIOS por id
                    var usuario = db.Set<USUARIOS>().Find(id);

                    if (usuario == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el usuario con el id especificado
                    }

                    // Actualizar solo el campo EstadoUsuario
                    usuario.EstadoUsuario = model.EstadoUsuario;

                    // Deshabilitar validaciones automáticas para otras propiedades
                    db.Configuration.ValidateOnSaveEnabled = false;

                    // Intentar guardar los cambios en la base de datos
                    db.SaveChanges();
                    return Ok(); // Retorna 200 OK si la actualización fue exitosa
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                // Manejo de errores de concurrencia
                return Content(HttpStatusCode.Conflict, new { Message = "La actualización falló debido a un conflicto de concurrencia.", Details = ex.Message }); // Retorna 409 en caso de conflicto
            }
            catch (DbEntityValidationException ex)
            {
                // Manejo de errores de validación de entidad
                var validationErrors = ex.EntityValidationErrors
                    .SelectMany(e => e.ValidationErrors)
                    .Select(e => new { e.PropertyName, e.ErrorMessage });

                return Content(HttpStatusCode.BadRequest, validationErrors); // Retorna 400 con los errores de validación
            }
            catch (DbUpdateException ex)
            {
                // Manejo de errores de actualización en la base de datos
                var errorMessage = ex.InnerException?.Message ?? ex.Message; // Captura el mensaje de error detallado

                return InternalServerError(new Exception("Error al actualizar la base de datos.", new Exception(errorMessage))); // Retorna 500 en caso de error de actualización
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }


        // Modelo para la actualización de EstadoUsuario
        public class EstadoUsuarioUpdateModel
        {
            [Required]
            public string EstadoUsuario { get; set; }
        }


        // GET: api/Usuarios/{id}
        public IHttpActionResult Get(int id)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var usuario = db.Set<USUARIOS>()
                        .Where(u => u.Usuario_ID == id)
                        .Select(u => new UsuariosDto
                        {
                            Usuario_ID = u.Usuario_ID,
                            Nombre = u.Nombre,
                            Apellido = u.Apellido,
                            Nombre_Usuario = u.Nombre_Usuario,
                            Contraseña = u.Contraseña,
                            Fecha_Alta = u.Fecha_Alta,
                            Usu_Alta = u.Usu_Alta,
                            Rol = u.Rol,
                            EstadoUsuario = u.EstadoUsuario,
                            Usu_Modi = u.Usu_Modi,
                            Fecha_Modi = u.Fecha_Modi


                        })
                        .FirstOrDefault();

                    if (usuario == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el usuario
                    }

                    return Ok(usuario); // Retorna 200 con el usuario encontrado
                }
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

        // POST: api/Usuarios
        public IHttpActionResult Post([FromBody] USUARIOS value)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    db.Set<USUARIOS>().Add(value);
                    db.SaveChanges();

                    return CreatedAtRoute("DefaultApi", new { id = value.Usuario_ID }, value); // Retorna 201 Created
                }
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

        // PUT: api/Usuarios/{id}
        public IHttpActionResult Put(int id, [FromBody] USUARIOS value)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    USUARIOS oitem = db.Set<USUARIOS>().Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el usuario
                    }

                    oitem.Nombre = value.Nombre;
                    oitem.Apellido = value.Apellido;
                    oitem.Nombre_Usuario = value.Nombre_Usuario;
                    oitem.Contraseña = value.Contraseña;
                    oitem.Fecha_Alta = value.Fecha_Alta;

                    db.Entry(oitem).State = System.Data.Entity.EntityState.Modified;
                    db.SaveChanges();

                    return Ok(oitem); // Retorna 200 OK si la actualización fue exitosa
                }
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

        // DELETE: api/Usuarios/{id}
        public IHttpActionResult Delete(int id)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    // Buscar el Usuario por ID
                    USUARIOS oitem = db.Set<USUARIOS>().Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el usuario con el ID especificado
                    }

                    // Eliminar el usuario encontrado
                    db.Set<USUARIOS>().Remove(oitem);
                    db.SaveChanges();

                    return Ok(); // Retorna 200 OK si la eliminación fue exitosa
                }
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
