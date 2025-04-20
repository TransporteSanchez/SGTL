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

namespace WebApi_TransporteSanchez.Controllers
{
    public class ChoferesController : ApiController
    {
        public class ChoferDto
        {
            public int Chofer_ID { get; set; }
            public string DNI { get; set; }
            public string CUIL { get; set; }
            public string Nombre { get; set; }
            public string Apellido { get; set; }
            public string TelefonoFijo { get; set; }
            public string TelefonoCelular { get; set; }
            public string Email { get; set; }
            public int ProvID { get; set; }
            public int LocID { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
            public string EstadoChofer { get; set; }
            public DateTime Fecha_Alta { get; set; } 
            public string Usu_Alta { get; set; }
            public DateTime Fecha_Modi { get; set; } 
            public string Usu_Modi { get; set; }
        }

        // GET: api/Choferes
        public IHttpActionResult Get()
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    var olist = db.Set<CHOFERES>()
                                  .Where(c => c.EstadoChofer != "Eliminado") // No se devuelven los choferes eliminados
                                  .Select(c => new ChoferDto
                                  {
                                      Chofer_ID = c.Chofer_ID,
                                      DNI = c.DNI,
                                      CUIL = c.CUIL,
                                      Nombre = c.Nombre,
                                      Apellido = c.Apellido,
                                      TelefonoFijo = c.TelefonoFijo,
                                      TelefonoCelular = c.TelefonoCelular,
                                      Email = c.Email,
                                      ProvID = c.ProvID,
                                      LocID = c.LocID,
                                      Calle = c.Calle,
                                      AlturaCalle = c.AlturaCalle.Trim(),
                                      EstadoChofer = c.EstadoChofer,
                                      Fecha_Alta = c.Fecha_Alta,
                                      Usu_Alta = c.Usu_Alta,
                                      Fecha_Modi = c.Fecha_Modi,
                                      Usu_Modi = c.Usu_Modi,
                                  }).ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound();
                    }

                    return Ok(olist);
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


        // GET: api/Choferes/{id}
        public IHttpActionResult Get(int id)
        {
            try
            {
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new DbContext(connectionString))
                {
                    var chofer = db.Set<CHOFERES>()
                                   .Where(c => c.Chofer_ID == id && c.EstadoChofer != "Eliminado") 
                                   .Select(c => new ChoferDto
                                   {
                                       Chofer_ID = c.Chofer_ID,
                                       DNI = c.DNI,
                                       CUIL = c.CUIL,
                                       Nombre = c.Nombre,
                                       Apellido = c.Apellido,
                                       TelefonoFijo = c.TelefonoFijo,
                                       TelefonoCelular = c.TelefonoCelular,
                                       Email = c.Email,
                                       ProvID = c.ProvID,
                                       LocID = c.LocID,
                                       Calle = c.Calle,
                                       AlturaCalle = c.AlturaCalle.Trim(),
                                       EstadoChofer = c.EstadoChofer,
                                       Fecha_Alta = c.Fecha_Alta,
                                       Usu_Alta = c.Usu_Alta,
                                       Fecha_Modi = c.Fecha_Modi,
                                       Usu_Modi = c.Usu_Modi,
                                   }).FirstOrDefault();

                    if (chofer == null)
                    {
                        return NotFound();
                    }

                    return Ok(chofer);
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


        // GET: api/Choferes/Buscar
        [HttpGet]
        [Route("api/Choferes/Buscar")]
        public IHttpActionResult Buscar(string nombre = null, string apellido = null, string dni = null, string estadoChofer = null, DateTime? fechaDesde = null, DateTime? fechaHasta = null, int page = 1, int pageSize = 8)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    // 👇 Reemplazo de la condición original
                    var query = db.Set<CHOFERES>()
                                  .Where(c => c.EstadoChofer != "Eliminado") 
                                  .AsQueryable();

                    if (!string.IsNullOrEmpty(nombre))
                    {
                        query = query.Where(c => c.Nombre.Contains(nombre));
                    }

                    if (!string.IsNullOrEmpty(apellido))
                    {
                        query = query.Where(c => c.Apellido.Contains(apellido));
                    }

                    if (!string.IsNullOrEmpty(dni))
                    {
                        query = query.Where(c => c.DNI.Contains(dni));
                    }

                    if (!string.IsNullOrEmpty(estadoChofer))
                    {
                        var estados = estadoChofer.Split(',');
                        query = query.Where(c => estados.Contains(c.EstadoChofer));
                    }

                    if (fechaDesde.HasValue)
                    {
                        query = query.Where(c => c.Fecha_Alta >= fechaDesde.Value);
                    }

                    if (fechaHasta.HasValue)
                    {
                        query = query.Where(c => c.Fecha_Alta <= fechaHasta.Value);
                    }

                    var totalRecords = query.Count();

                    var results = query
                        .OrderByDescending(c => c.Chofer_ID)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(c => new ChoferDto
                        {
                            Chofer_ID = c.Chofer_ID,
                            DNI = c.DNI,
                            CUIL = c.CUIL,
                            Nombre = c.Nombre,
                            Apellido = c.Apellido,
                            TelefonoFijo = c.TelefonoFijo,
                            TelefonoCelular = c.TelefonoCelular,
                            Email = c.Email,
                            ProvID = c.ProvID,
                            LocID = c.LocID,
                            Calle = c.Calle,
                            AlturaCalle = c.AlturaCalle.Trim(),
                            EstadoChofer = c.EstadoChofer,
                            Fecha_Alta = c.Fecha_Alta,
                            Usu_Alta = c.Usu_Alta,
                            Fecha_Modi = c.Fecha_Modi,
                            Usu_Modi = c.Usu_Modi,
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
                return InternalServerError(new Exception("Error al acceder a la base de datos durante la búsqueda.", ex));
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



        // GET: api/Choferes/{choferID}/Chofer_Camion
        [HttpGet]
        [Route("api/Choferes/{choferID}/Chofer_Camion")]
        public IHttpActionResult GetChoferesByCamion(int choferID)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    var camiones = from cc in db.Set<CHOFER_CAMION>()
                                   join c in db.Set<CAMIONES>() on cc.CamionID equals c.Camion_ID
                                   join ch in db.Set<CHOFERES>() on cc.ChoferID equals ch.Chofer_ID
                                   where cc.ChoferID == choferID
                                   && ch.EstadoChofer != "Eliminado" 
                                   select new
                                   {
                                       c.Camion_ID,
                                       c.Dominio,
                                       cc.Cedula,
                                   };

                    var result = camiones.ToList();

                    return Ok(result);
                }
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception("Error al acceder a la base de datos al obtener camiones del chofer.", ex));
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = ex.EntityValidationErrors
                    .SelectMany(e => e.ValidationErrors)
                    .Select(e => new { e.PropertyName, e.ErrorMessage })
                    .ToList();

                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }



        // PUT: api/Choferes/EstadoChofer/{id}
        [HttpPut]
        [Route("api/Choferes/EstadoChofer/{id}")]
        public IHttpActionResult PutEstadoChofer(int id, [FromBody] EstadoChoferUpdateModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    var chofer = db.Set<CHOFERES>().Find(id);

                    if (chofer == null)
                    {
                        return NotFound();
                    }

                    var validationErrors = new List<object>();

                    // Validar que el chofer no se encuentre eliminado
                    if (chofer.EstadoChofer == "Eliminado")
                    {
                        validationErrors.Add(new
                        {
                            PropertyName = "EstadoChofer",
                            ErrorMessage = "No se puede cambiar el estado de un chofer eliminado."
                        });
                    }

                    if (validationErrors.Any())
                    {
                        return Content(HttpStatusCode.BadRequest, validationErrors);
                    }

                    chofer.EstadoChofer = model.EstadoChofer;
                    chofer.Fecha_Modi = DateTime.Now;
                    chofer.Usu_Modi = model.Usu_Modi;

                    db.Configuration.ValidateOnSaveEnabled = false;
                    db.SaveChanges();

                    return Ok();
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Content(HttpStatusCode.Conflict, new
                {
                    Message = "La actualización falló debido a un conflicto de concurrencia.",
                    Details = ex.Message
                });
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = ex.EntityValidationErrors
                    .SelectMany(e => e.ValidationErrors)
                    .Select(e => new { e.PropertyName, e.ErrorMessage })
                    .ToList();

                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = ex.InnerException?.Message ?? ex.Message;
                return InternalServerError(new Exception("Error al actualizar la base de datos.", new Exception(errorMessage)));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // Modelo para la actualización de EstadoChofer
        public class EstadoChoferUpdateModel
        {
            [Required]
            public string EstadoChofer { get; set; }
            public string Usu_Modi { get; set; }
        }



        // GET: Validación DNI
        [HttpGet]
        [Route("api/Choferes/ValidarDNI/{dni}/{id?}")]
        public IHttpActionResult GetDNIExists(string dni, int? id = null)
        {
            try
            {
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new DbContext(connectionString))
                {
                    var choferConDni = db.Set<CHOFERES>().FirstOrDefault(c => c.DNI == dni);

                    if (choferConDni != null)
                    {
                        // Si es edición y el DNI pertenece al mismo chofer, permitirlo
                        if (id.HasValue && choferConDni.Chofer_ID == id.Value)
                        {
                            return Ok(new
                            {
                                codigo = "DNI_permitido",
                                mensaje = "El DNI pertenece al mismo chofer, es válido."
                            });
                        }

                        // Si el chofer está eliminado, permitirlo
                        if (choferConDni.EstadoChofer == "Eliminado")
                        {
                            return Ok(new
                            {
                                codigo = "DNI_no_registrado",
                                mensaje = "El DNI no se encuentra registrado, es válido."
                            });
                        }

                        // Si el DNI pertenece a otro chofer no eliminado, no permitirlo
                        return Ok(new
                        {
                            codigo = "DNI_registrado",
                            mensaje = "El DNI ya se encuentra registrado con otro chofer."
                        });
                    }

                    // Si no se encuentra el DNI en la base de datos, es válido para alta
                    return Ok(new
                    {
                        codigo = "DNI_no_registrado",
                        mensaje = "El DNI no se encuentra registrado, es válido."
                    });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    codigo = "error_verificacion",
                    mensaje = "Error al verificar el DNI.",
                    detalles = ex.Message
                });
            }
        }



        // POST: api/Choferes
        public IHttpActionResult Post([FromBody] ChoferDto choferDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState); // Retorna 400 si el modelo no es válido
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    // Verifica si el DNI ya existe
                    var choferExistente = db.Set<CHOFERES>().FirstOrDefault(c => c.DNI == choferDto.DNI);
                    if (choferExistente != null)
                    {
                        return Content(HttpStatusCode.BadRequest, new
                        {
                            code = "chofer_duplicado",
                            message = "Ya existe un chofer registrado con este DNI."
                        }); // Retorna 400 si el DNI ya existe con un código específico
                    }

                    // Crear una nueva entidad CHOFERES y asignar valores desde ChoferDto
                    var chofer = new CHOFERES
                    {
                        DNI = choferDto.DNI,
                        CUIL = choferDto.CUIL,
                        Nombre = choferDto.Nombre,
                        Apellido = choferDto.Apellido,
                        TelefonoFijo = choferDto.TelefonoFijo?.Trim(),
                        TelefonoCelular = choferDto.TelefonoCelular,
                        Email = choferDto.Email,
                        ProvID = choferDto.ProvID,
                        LocID = choferDto.LocID,
                        Calle = choferDto.Calle,
                        AlturaCalle = choferDto.AlturaCalle?.Trim(),
                        EstadoChofer = choferDto.EstadoChofer,
                        Fecha_Alta = choferDto.Fecha_Alta,
                        Usu_Alta = choferDto.Usu_Alta,
                        Fecha_Modi = choferDto.Fecha_Modi,
                        Usu_Modi = choferDto.Usu_Modi
                    };

                    // Agregar la entidad al contexto
                    db.Set<CHOFERES>().Add(chofer);

                    try
                    {
                        db.SaveChanges(); // Guardar cambios en la base de datos
                        return Ok(); // Retorna 200 OK si la inserción fue exitosa
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


        // PUT: api/Choferes/{id}
        public IHttpActionResult Put(int id, [FromBody] ChoferDto choferDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState); // Retorna 400 si el modelo no es válido
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            using (var db = new DbContext(connectionString))
            {
                // Buscar la entidad CHOFERES por ID
                var chofer = db.Set<CHOFERES>().Find(id);

                if (chofer == null)
                {
                    return NotFound(); // Retorna 404 si no se encuentra el chofer con el ID especificado
                }

                var validationErrors = new List<object>();

                // Validar si el chofer está eliminado
                if (chofer.EstadoChofer == "Eliminado")
                {
                    validationErrors.Add(new { PropertyName = "EstadoChofer", ErrorMessage = "No se puede editar un chofer eliminado." });
                }

                if (validationErrors.Any())
                {
                    return Content(HttpStatusCode.BadRequest, validationErrors);
                }

                // Actualizar propiedades del chofer
                chofer.DNI = choferDto.DNI;
                chofer.CUIL = choferDto.CUIL;
                chofer.Nombre = choferDto.Nombre;
                chofer.Apellido = choferDto.Apellido;
                chofer.TelefonoFijo = choferDto.TelefonoFijo?.Trim();
                chofer.TelefonoCelular = choferDto.TelefonoCelular;
                chofer.Email = choferDto.Email;
                chofer.ProvID = choferDto.ProvID;
                chofer.LocID = choferDto.LocID;
                chofer.Calle = choferDto.Calle;
                chofer.AlturaCalle = choferDto.AlturaCalle?.Trim();
                chofer.Fecha_Modi = choferDto.Fecha_Modi;
                chofer.Usu_Modi = choferDto.Usu_Modi;

                // Marcar la entidad como modificada
                db.Entry(chofer).State = System.Data.Entity.EntityState.Modified;

                try
                {
                    db.SaveChanges(); // Guardar cambios en la base de datos
                    return Ok(); // Retorna 200 OK si la actualización fue exitosa
                }
                catch (DbEntityValidationException ex)
                {
                    foreach (var validationResult in ex.EntityValidationErrors)
                    {
                        foreach (var error in validationResult.ValidationErrors)
                        {
                            validationErrors.Add(new { PropertyName = error.PropertyName, ErrorMessage = error.ErrorMessage });
                        }
                    }

                    // Devolver la lista de errores como respuesta con estado 400 (Bad Request)
                    return Content(HttpStatusCode.BadRequest, validationErrors);
                }
                catch (DbUpdateConcurrencyException)
                {
                    // Manejo de errores de concurrencia
                    return Conflict(); // Retorna 409 Conflict en caso de error de concurrencia
                }
                catch (DbUpdateException ex)
                {
                    // Manejo de otros errores relacionados con la base de datos
                    return InternalServerError(ex); // Retorna 500 en caso de error interno
                }
            }
        }


        // PUT: api/Choferes/Eliminar/{id}
        [HttpPut]
        [Route("api/Choferes/Eliminar/{id}")]
        public IHttpActionResult EliminarChofer(int id, [FromBody] EliminarChoferModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    var chofer = db.Set<CHOFERES>().Find(id);

                    if (chofer == null)
                    {
                        return NotFound();
                    }

                    var validationErrors = new List<object>();

                    // Validar si ya está eliminado
                    if (chofer.EstadoChofer == "Eliminado")
                    {
                        validationErrors.Add(new { PropertyName = "EstadoChofer", ErrorMessage = "El chofer ya se encuentra eliminado." });
                    }

                    // Validar si está activo
                    if (chofer.EstadoChofer == "Activo")
                    {
                        validationErrors.Add(new { PropertyName = "EstadoChofer", ErrorMessage = "No se puede eliminar un chofer activo. Inactívelo primero." });
                    }

                    if (validationErrors.Any())
                    {
                        return Content(HttpStatusCode.BadRequest, validationErrors);
                    }

                    // Actualizar estado y metadatos de modificación
                    DateTime fechaActual = DateTime.Now;
                    chofer.EstadoChofer = "Eliminado";
                    chofer.Fecha_Modi = fechaActual;
                    chofer.Usu_Modi = model.Usu_Modi;

                    db.Configuration.ValidateOnSaveEnabled = false;
                    db.SaveChanges();

                    return Ok("El chofer fue eliminado correctamente.");
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Content(HttpStatusCode.Conflict, new
                {
                    Message = "La eliminación falló debido a un conflicto de concurrencia.",
                    Details = ex.Message
                });
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = ex.EntityValidationErrors
                    .SelectMany(e => e.ValidationErrors)
                    .Select(e => new { e.PropertyName, e.ErrorMessage })
                    .ToList();

                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = ex.InnerException?.Message ?? ex.Message;
                return InternalServerError(new Exception("Error al actualizar la base de datos.", new Exception(errorMessage)));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // Modelo para la actualización de eliminación de chofer
        public class EliminarChoferModel
        {
            [Required]
            public string Usu_Modi { get; set; }
        }



        //// DELETE: api/Choferes/{id}
        //public IHttpActionResult Delete(int id)
        //{
        //    string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

        //    try
        //    {
        //        using (var db = new DbContext(connectionString))
        //        {
        //            // Buscar el chofer por ID
        //            CHOFERES oitem = db.Set<CHOFERES>().Find(id);

        //            if (oitem == null)
        //            {
        //                return NotFound(); // Retorna 404 si no se encuentra el chofer con el ID especificado
        //            }

        //            // Intentar eliminar el chofer encontrado
        //            db.Set<CHOFERES>().Remove(oitem);

        //            try
        //            {
        //                db.SaveChanges();
        //                return Ok("Chofer eliminado con éxito."); // Retorna 200 OK si la eliminación fue exitosa
        //            }
        //            catch (DbEntityValidationException ex)
        //            {
        //                // Crear una lista para almacenar los errores de validación
        //                var validationErrors = new List<string>();

        //                foreach (var validationResult in ex.EntityValidationErrors)
        //                {
        //                    foreach (var error in validationResult.ValidationErrors)
        //                    {
        //                        // Agregar el error a la lista
        //                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
        //                    }
        //                }

        //                // Devolver la lista de errores como respuesta con estado 400 (Bad Request)
        //                return Content(HttpStatusCode.BadRequest, validationErrors);
        //            }
        //            catch (System.Data.Entity.Infrastructure.DbUpdateConcurrencyException)
        //            {
        //                // Manejo de errores de concurrencia
        //                return Conflict(); // Retorna 409 Conflict en caso de error de concurrencia
        //            }
        //            catch (System.Data.Entity.Infrastructure.DbUpdateException ex)
        //            {
        //                // Manejo de otros errores relacionados con la base de datos
        //                return InternalServerError(ex); // Retorna 500 en caso de error interno
        //            }
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return InternalServerError(ex); // Retorna 500 en caso de error interno
        //    }
        //}




    }

}
