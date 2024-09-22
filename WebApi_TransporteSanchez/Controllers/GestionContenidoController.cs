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
                var errorMessages = ex.EntityValidationErrors
                    .SelectMany(validationResult => validationResult.ValidationErrors
                        .Select(validationError => $"Propiedad: {validationError.PropertyName}, Error: {validationError.ErrorMessage}"));

                // Opcional: Puedes registrar los mensajes de error aquí
                foreach (var errorMessage in errorMessages)
                {
                    Console.WriteLine(errorMessage);
                }

                return BadRequest($"Error de validación en los datos enviados: {string.Join("; ", errorMessages)}"); // 400 Bad Request
            }
            catch (Exception ex)
            {
                // Manejo de errores generales
                return InternalServerError(ex); // 500 Internal Server Error
            }
        }



    }
}
