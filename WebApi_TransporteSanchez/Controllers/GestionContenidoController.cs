using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity;
using System.Data.Entity.Validation;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class GestionContenidoController : ApiController
    {

        public class GestionContenidoDto
        {
            public int GestionContenido_ID { get; set; }
            public string Logo { get; set; } // Se puede dejar como null
            public string ColorFondo { get; set; } // Se puede dejar como null
            public string ColorBotonesMenu { get; set; } // Se puede dejar como null
            public string ContenidoPiePagina { get; set; } // Se puede dejar como null
            public DateTime? Fecha_Modi { get; set; } // Esto puede seguir como nullable
            public string Usu_Modi { get; set; } // Se puede dejar como null
        }



        // GET: api/GestionContenido
        public IHttpActionResult Get()
        {
            try
            {
                // Obtener la cadena de conexión dinámica
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var olist = db.Set<GESTION_CONTENIDO>().Select(c => new GestionContenidoDto
                    {
                        GestionContenido_ID = c.GestionContenido_ID,
                        Logo = c.Logo, // Se permite nulo
                        ColorFondo = c.ColorFondo, // Se permite nulo
                        ColorBotonesMenu = c.ColorBotonesMenu, // Se permite nulo
                        ContenidoPiePagina = c.ContenidoPiePagina, // Se permite nulo
                        Fecha_Modi = c.Fecha_Modi, // Se permite nulo
                        Usu_Modi = c.Usu_Modi // Se permite nulo
                    }).ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound(); // 404 si no hay contenido
                    }

                    return Ok(olist); // 200 OK con la lista de contenido
                }
            }
            catch (Exception ex)
            {
                // Manejo de errores generales
                return InternalServerError(ex); // 500 Internal Server Error
            }
        }

        // GET: api/GestionContenido/1
        public IHttpActionResult Get(int id)
        {
            try
            {
                // Validar que el ID sea 1
                if (id != 1)
                {
                    return BadRequest("Solo se permite el ID 1."); // 400 Bad Request
                }

                // Obtener la cadena de conexión dinámica
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    // Buscar el contenido basado en el ID
                    var content = db.Set<GESTION_CONTENIDO>()
                                    .Where(c => c.GestionContenido_ID == id)
                                    .Select(c => new GestionContenidoDto
                                    {
                                        GestionContenido_ID = c.GestionContenido_ID,
                                        Logo = c.Logo, // Se permite nulo
                                        ColorFondo = c.ColorFondo, // Se permite nulo
                                        ColorBotonesMenu = c.ColorBotonesMenu, // Se permite nulo
                                        ContenidoPiePagina = c.ContenidoPiePagina, // Se permite nulo
                                        Fecha_Modi = c.Fecha_Modi, // Se permite nulo
                                        Usu_Modi = c.Usu_Modi // Se permite nulo
                                    }).FirstOrDefault();

                    if (content == null)
                    {
                        return NotFound(); // 404 si no se encuentra el contenido
                    }

                    return Ok(content); // 200 OK con el contenido encontrado
                }
            }
            catch (Exception ex)
            {
                // Manejo de errores generales
                return InternalServerError(ex); // 500 Internal Server Error
            }
        }


        // PUT: api/GestionContenido/{id}
        public IHttpActionResult Put(int id, [FromBody] GESTION_CONTENIDO value)
        {
            if (value == null)
            {
                return BadRequest("Datos inválidos."); // 400 Bad Request si el cuerpo está vacío o es incorrecto
            }

            try
            {
                // Obtener la cadena de conexión dinámica
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    // Buscar el registro por ID
                    var oitem = db.Set<GESTION_CONTENIDO>().Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // 404 si no se encuentra el contenido
                    }

                    // Actualizar los campos
                    oitem.Logo = value.Logo;
                    oitem.ColorFondo = value.ColorFondo;
                    oitem.ColorBotonesMenu = value.ColorBotonesMenu;
                    oitem.ContenidoPiePagina = value.ContenidoPiePagina;

                    // Asegúrate de que Fecha_Modi no se asigne como nulo
                    if (value.Fecha_Modi != default(DateTime)) // Verifica que no sea el valor por defecto
                    {
                        oitem.Fecha_Modi = value.Fecha_Modi;
                    }
                    else
                    {
                        // Establecer una fecha actual si se envía nulo
                        oitem.Fecha_Modi = DateTime.Now;
                    }

                    oitem.Usu_Modi = value.Usu_Modi;

                    // Guardar los cambios
                    db.Entry(oitem).State = System.Data.Entity.EntityState.Modified;

                    // Intenta guardar los cambios
                    db.SaveChanges();

                    return Ok("Actualización exitosa."); // 200 OK si la actualización fue exitosa
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
                        validationErrors.Add($"Propiedad: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }

                // Registrar errores
                foreach (var validationError in validationErrors)
                {
                    Console.WriteLine(validationError); // Puedes registrar el error en logs, si lo prefieres
                }

                // Retornar los errores de validación como respuesta 400 Bad Request
                return Content(HttpStatusCode.BadRequest, validationErrors); // 400 Bad Request con listado de errores de validación
            }
            catch (Exception ex)
            {
                // Manejo de errores generales
                return InternalServerError(ex); // 500 Internal Server Error para otros errores no esperados
            }
        }




    }
}
