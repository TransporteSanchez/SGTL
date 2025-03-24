using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Validation;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class GruposController : ApiController
    {

        public class GruposDto
        {
            public int Grupo_ID { get; set; }
            public string Grupo_Nombre { get; set; }
            public System.DateTime Fecha_Alta { get; set; }
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
                    var grupos = db.Set<GRUPOS>().Select(u => new GruposDto
                    {
                        Grupo_ID = u.Grupo_ID,
                        Grupo_Nombre = u.Grupo_Nombre,
                        Fecha_Alta = u.Fecha_Alta,
                        Usu_Alta = u.Usu_Alta,
                        Fecha_Modi = u.Fecha_Modi,
                        Usu_Modi = u.Usu_Modi
                    }).ToList();

                    return Ok(grupos); // Retorna 200 con la lista de grupos
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
            // Lógica futura aquí, pero agrega la conexión dinámica y el manejo de errores como en el método anterior
            return Ok("value");
        }

        // POST: api/Usuarios
        public IHttpActionResult Post([FromBody] string value)
        {
            // Lógica futura aquí, pero agrega la conexión dinámica y el manejo de errores como en el método anterior
            return Ok();
        }

        // PUT: api/Usuarios/{id}
        public IHttpActionResult Put(int id, [FromBody] GRUPOS value)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    GRUPOS oitem = db.Set<GRUPOS>().Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el grupo con el ID especificado
                    }

                    oitem.Grupo_Nombre = value.Grupo_Nombre;

                    db.Entry(oitem).State = System.Data.Entity.EntityState.Modified;
                    db.SaveChanges();

                    return Ok(); // Retorna 200 OK si la actualización fue exitosa
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
                    // Buscar el Grupo por ID
                    GRUPOS oitem = db.Set<GRUPOS>().Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el GRUPO con el ID especificado
                    }

                    // Eliminar el GRUPO encontrado
                    db.Set<GRUPOS>().Remove(oitem);
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
