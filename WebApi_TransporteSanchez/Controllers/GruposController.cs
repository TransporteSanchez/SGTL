using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using static WebApi_TransporteSanchez.Controllers.GruposController;


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

        // GET: api/Grupos
        public IHttpActionResult Get()
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    // Primero traemos los datos como entidades
                    var entidadesGrupos = db.Set<GRUPOS>().ToList();

                    // Después hacemos la proyección a DTO en memoria
                    var grupos = entidadesGrupos.Select(g => new GruposDto
                    {
                        Grupo_ID = g.Grupo_ID,
                        Grupo_Nombre = g.Grupo_Nombre
                        
                    }).ToList();

                    return Ok(grupos);
                }
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = new List<string>();

                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }

                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Grupos/{id}
        public IHttpActionResult Get(int id)
        {
            try
            {
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new DbContext(connectionString))
                {
                    // Primero traemos los datos como entidades
                
                    var grupo = db.Set<GRUPOS>().Find(id);

                    if (grupo == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra
                    }

                    // Mapear a DTO
                    var gruposDto = new GruposDto
                    {
                        Grupo_ID = grupo.Grupo_ID,
                        Grupo_Nombre = grupo.Grupo_Nombre?.Trim()
                    };

                    return Ok(gruposDto); // Retorna 200 con el grupo encontrado
                }
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception("Error al acceder a la base de datos.", ex));
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = new List<string>();

                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }

                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/Grupos
        public IHttpActionResult Post([FromBody] GruposDto gruposDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState); // Retorna 400 si el modelo no es válido
            }

            try
            {
                // Obtener la cadena de conexión dinámica
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new DbContext(connectionString))
                {
                    // Crear una nueva entidad GRUPOS y asignar valores desde GrupoDTO
                    var grupo = new GRUPOS
                    {
                        Grupo_ID = gruposDto.Grupo_ID,
                        Grupo_Nombre = gruposDto.Grupo_Nombre.Trim(), // Trim para eliminar espacios en blanco
                        Usu_Alta = gruposDto.Usu_Alta,
                        Fecha_Alta = DateTime.Now,
                        Usu_Modi = gruposDto.Usu_Modi,
                        Fecha_Modi = DateTime.Now
                    };

                    // Agregar la entidad al contexto y guardar cambios
                    db.Set<GRUPOS>().Add(grupo);

                    try
                    {
                        db.SaveChanges();
                        return Ok(); // Retorna 200 OK si fue exitosa
                    }
                    catch (DbEntityValidationException ex)
                    {
                        // Crear una lista para almacenar los errores de validación
                        var validationErrors = new List<string>();

                        foreach (var validationResult in ex.EntityValidationErrors)
                        {
                            foreach (var error in validationResult.ValidationErrors)
                            {
                                // Agregar el error a la lista
                                validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                            }
                        }

                        // Devolver la lista de errores como respuesta con estado 400 (Bad Request)
                        return Content(HttpStatusCode.BadRequest, validationErrors);
                    }
                    catch (DbUpdateException ex)
                    {
                        // Manejo de otros errores relacionados con la base de datos
                        return InternalServerError(ex); // Retorna 500 en caso de error interno
                    }
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }


        // PUT: api/Grupos/{id}
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

        // DELETE: api/Grupos/{id}
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
