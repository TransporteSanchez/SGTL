using System;
using System.Collections.Generic;
using System.Data.Entity.Validation;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

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
                            Fecha_Alta = u.Fecha_Alta
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
                            Fecha_Alta = u.Fecha_Alta
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
