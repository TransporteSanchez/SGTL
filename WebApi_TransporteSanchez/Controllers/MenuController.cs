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
    public class MenuController : ApiController
    {

        public class MenuDto
        {
            public int Menu_ID { get; set; }
            public string Menu_Nombre { get; set; }
            public int Menu_Principal { get; set; }

        }

        // GET: api/MENU
        public IHttpActionResult Get()
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var menu = db.Set<MENU>().Select(u => new MenuDto
                    {
                        Menu_ID = u.Menu_ID,
                        Menu_Nombre = u.Menu_Nombre,
                        Menu_Principal = u.Menu_Principal,
                    }).ToList();

                    return Ok(menu); // Retorna 200 con la lista de menús
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

        // GET: api/MENU/5
        public IHttpActionResult Get(int id)
        {
            // Lógica futura aquí, pero agrega la conexión dinámica y el manejo de errores como en el método anterior
            return Ok("value");
        }

        // POST: api/MENU
        public IHttpActionResult Post([FromBody] string value)
        {
            // Lógica futura aquí, pero agrega la conexión dinámica y el manejo de errores como en el método anterior
            return Ok();
        }

        // PUT: api/MENU/5
        public IHttpActionResult Put(int id, [FromBody] MENU value)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    MENU oitem = db.Set<MENU>().Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el menú con el ID especificado
                    }

                    oitem.Menu_Nombre = value.Menu_Nombre;

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

        // DELETE: api/MENU/5
        public IHttpActionResult Delete(int id)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    // Buscar el MENU por ID
                    MENU oitem = db.Set<MENU>().Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el MENU con el ID especificado
                    }

                    // Eliminar el MENU encontrado
                    db.Set<MENU>().Remove(oitem);
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
