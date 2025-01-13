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
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var olist = db.Set<CHOFERES>().Select(c => new ChoferDto
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
                        Usu_Modi = c.Usu_Modi
                    }).ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound(); // Retorna 404 si no se encuentran registros
                    }

                    return Ok(olist); // Retorna 200 con la lista de choferes
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



        // GET: api/Choferes/{id}
        public IHttpActionResult Get(int id)
        {
            try
            {
                // Obtener la cadena de conexión dinámica
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                // Usar DbContext directamente con la cadena de conexión personalizada
                using (var db = new DbContext(connectionString))
                {
                    var chofer = db.Set<CHOFERES>().Find(id);

                    if (chofer == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el chofer con el ID especificado
                    }

                    var choferDto = new ChoferDto
                    {
                        Chofer_ID = chofer.Chofer_ID,
                        DNI = chofer.DNI,
                        CUIL = chofer.CUIL,
                        Nombre = chofer.Nombre,
                        Apellido = chofer.Apellido,
                        TelefonoFijo = chofer.TelefonoFijo,
                        TelefonoCelular = chofer.TelefonoCelular,
                        Email = chofer.Email,
                        ProvID = chofer.ProvID,
                        LocID = chofer.LocID,
                        Calle = chofer.Calle,
                        AlturaCalle = chofer.AlturaCalle.Trim(),
                        EstadoChofer = chofer.EstadoChofer,
                        Fecha_Alta = chofer.Fecha_Alta,
                        Usu_Alta = chofer.Usu_Alta,
                        Fecha_Modi = chofer.Fecha_Modi,
                        Usu_Modi = chofer.Usu_Modi
                    };

                    return Ok(choferDto); // Retorna 200 con los datos del chofer encontrado
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



        // GET: api/Choferes/Buscar
        [HttpGet]
        [Route("api/Choferes/Buscar")]
        public IHttpActionResult Buscar(string nombre = null, string apellido = null, string dni = null, string estadoChofer = null, int page = 1, int pageSize = 8)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                // Usar DbContext directamente con la cadena de conexión personalizada
                using (var db = new DbContext(connectionString))
                {
                    // Consultar los choferes en la base de datos
                    var query = db.Set<CHOFERES>().AsQueryable();

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

                    var totalRecords = query.Count();
                    var results = query
                        .OrderBy(c => c.Nombre)
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
                            Usu_Modi = c.Usu_Modi
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




        // GET: api/Choferes/{choferID}/Chofer_Camion
        [HttpGet]
        [Route("api/Choferes/{choferID}/Chofer_Camion")]
        public IHttpActionResult GetChoferesByCamion(int choferID)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                // Usar DbContext directamente con la cadena de conexión personalizada
                using (var db = new DbContext(connectionString))
                {
                    var camiones = from cc in db.Set<CHOFER_CAMION>()
                                   join c in db.Set<CAMIONES>() on cc.CamionID equals c.Camion_ID
                                   where cc.ChoferID == choferID
                                   select new
                                   {
                                       c.Camion_ID,
                                       c.Dominio,
                                       cc.Cedula,
                                   };

                    var result = camiones.ToList(); // Convertir a lista

                    // Retorna 200 con la lista de camiones (puede ser vacía)
                    return Ok(result);
                }
            }
            catch (DbUpdateException ex)
            {
                // Manejo de errores relacionados con la base de datos
                return InternalServerError(new Exception("Error al acceder a la base de datos al obtener camiones del chofer.", ex)); // Retorna 500 en caso de error interno
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





        // PUT: api/Choferes/EstadoChofer/{id}
        [HttpPut]
        [Route("api/Choferes/EstadoChofer/{id}")]
        public IHttpActionResult PutEstadoChofer(int id, [FromBody] EstadoChoferUpdateModel model)
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
                    // Buscar la entidad CHOFERES por id
                    var chofer = db.Set<CHOFERES>().Find(id);

                    if (chofer == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el chofer con el id especificado
                    }

                    // Actualizar solo el campo EstadoChofer
                    chofer.EstadoChofer = model.EstadoChofer;

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


        // Modelo para la actualización de EstadoChofer
        public class EstadoChoferUpdateModel
        {
            [Required]
            public string EstadoChofer { get; set; }
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





        // DELETE: api/Choferes/{id}
        public IHttpActionResult Delete(int id)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    // Buscar el chofer por ID
                    CHOFERES oitem = db.Set<CHOFERES>().Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el chofer con el ID especificado
                    }

                    // Intentar eliminar el chofer encontrado
                    db.Set<CHOFERES>().Remove(oitem);

                    try
                    {
                        db.SaveChanges();
                        return Ok("Chofer eliminado con éxito."); // Retorna 200 OK si la eliminación fue exitosa
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
                    catch (System.Data.Entity.Infrastructure.DbUpdateConcurrencyException)
                    {
                        // Manejo de errores de concurrencia
                        return Conflict(); // Retorna 409 Conflict en caso de error de concurrencia
                    }
                    catch (System.Data.Entity.Infrastructure.DbUpdateException ex)
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




    }

}
