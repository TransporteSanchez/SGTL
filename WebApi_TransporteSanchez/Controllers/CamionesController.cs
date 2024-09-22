using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;


namespace WebApi_TransporteSanchez.Controllers
{
    public class CamionesController : ApiController
    {

        public class CamionDTO
        {
            public int Camion_ID { get; set; }
            public string Dominio { get; set; }
            public string Marca { get; set; }
            public string Modelo { get; set; }
            public string AñoModelo { get; set; }
            public string Tipo { get; set; }
            public string NumMotor { get; set; }
            public string NumChasis { get; set; }
            public DateTime FechaCompra { get; set; }
            public DateTime FechaITV { get; set; }
            public string EquipoFrio { get; set; }
        }

        // GET: api/Camiones
        public IHttpActionResult Get()
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var camiones = db.Set<CAMIONES>().Select(c => new CamionDTO
                    {
                        Camion_ID = c.Camion_ID,
                        Dominio = c.Dominio,
                        Marca = c.Marca,
                        Modelo = c.Modelo,
                        AñoModelo = c.AñoModelo,
                        Tipo = c.Tipo,
                        NumMotor = c.NumMotor,
                        NumChasis = c.NumChasis,
                        FechaCompra = c.FechaCompra,
                        FechaITV = c.FechaITV,
                        EquipoFrio = c.EquipoFrio
                    }).ToList();

                    if (camiones == null || !camiones.Any())
                    {
                        return NotFound(); // Retorna 404 si no se encuentran registros
                    }

                    return Ok(camiones); // Retorna 200 con la lista de camiones
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



        // GET: api/Camiones/Buscar
        [HttpGet]
        [Route("api/Camiones/Buscar")]
        public IHttpActionResult Buscar(string dominio = null, int page = 1, int pageSize = 6)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                // Usar DbContext directamente con la cadena de conexión personalizada
                using (var db = new DbContext(connectionString))
                {
                    // Consultar los camiones en la base de datos
                    var query = db.Set<CAMIONES>().AsQueryable();

                    // Filtrar por dominio si se proporciona
                    if (!string.IsNullOrEmpty(dominio))
                    {
                        query = query.Where(c => c.Dominio.Contains(dominio));
                    }

                    // Obtener el total de registros
                    var totalRecords = query.Count();

                    // Paginación
                    var results = query
                        .OrderBy(c => c.Camion_ID)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(c => new
                        {
                            Camion_ID = c.Camion_ID,
                            Dominio = c.Dominio.Trim(), // Trim para eliminar espacios en blanco
                            Marca = c.Marca,
                            Modelo = c.Modelo,
                            AñoModelo = c.AñoModelo,
                            Tipo = c.Tipo,
                            NumMotor = c.NumMotor,
                            NumChasis = c.NumChasis,
                            FechaCompra = c.FechaCompra,
                            FechaITV = c.FechaITV,
                            EquipoFrio = c.EquipoFrio
                        })
                        .ToList();

                    // Retornar los resultados junto con el total de registros
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
                return InternalServerError(new Exception("Error al acceder a la base de datos durante la búsqueda de camiones.", ex)); // Retorna 500 en caso de error interno
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

        // GET: api/Camiones/{id}
        public IHttpActionResult Get(int id)
        {
            try
            {
                // Obtener la cadena de conexión dinámica
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                // Usar DbContext directamente con la cadena de conexión personalizada
                using (var db = new DbContext(connectionString))
                {
                    var camion = db.Set<CAMIONES>().Find(id);

                    if (camion == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el camión
                    }

                    var camionDto = new CamionDTO
                    {
                        Camion_ID = camion.Camion_ID,
                        Dominio = camion.Dominio.Trim(), // Trim para eliminar espacios en blanco
                        Marca = camion.Marca,
                        Modelo = camion.Modelo,
                        AñoModelo = camion.AñoModelo,
                        Tipo = camion.Tipo,
                        NumMotor = camion.NumMotor,
                        NumChasis = camion.NumChasis,
                        FechaCompra = camion.FechaCompra,
                        FechaITV = camion.FechaITV,
                        EquipoFrio = camion.EquipoFrio
                    };

                    return Ok(camionDto); // Retorna 200 OK con el objeto DTO
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



        // GET: api/Camiones/{camionID}/Chofer_Camion
        [HttpGet]
        [Route("api/Camiones/{camionID}/Chofer_Camion")]
        public IHttpActionResult GetChoferesByCamion(int camionID)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    // Consultar los choferes asociados al camionID especificado
                    var choferes = from cc in db.Set<CHOFER_CAMION>()
                                   join c in db.Set<CHOFERES>() on cc.ChoferID equals c.Chofer_ID
                                   where cc.CamionID == camionID
                                   select new
                                   {
                                       c.Chofer_ID,
                                       c.Nombre,
                                       c.Apellido,
                                       c.DNI
                                   };

                    var choferesList = choferes.ToList();

                    if (!choferesList.Any())
                    {
                        return NotFound(); // Retorna 404 si no se encuentran choferes asociados
                    }

                    return Ok(choferesList); // Retorna 200 con la lista de choferes
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }




        // POST: api/Camiones
        public IHttpActionResult Post([FromBody] CamionDTO camionDto)
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
                    // Crear una nueva entidad CAMIONES y asignar valores desde CamionDto
                    var camion = new CAMIONES
                    {
                        Camion_ID = camionDto.Camion_ID,
                        Dominio = camionDto.Dominio.Trim(), // Trim para eliminar espacios en blanco
                        Marca = camionDto.Marca,
                        Modelo = camionDto.Modelo,
                        AñoModelo = camionDto.AñoModelo,
                        Tipo = camionDto.Tipo,
                        NumMotor = camionDto.NumMotor,
                        NumChasis = camionDto.NumChasis,
                        FechaCompra = camionDto.FechaCompra,
                        FechaITV = camionDto.FechaITV,
                        EquipoFrio = camionDto.EquipoFrio
                    };

                    // Agregar la entidad al contexto y guardar cambios
                    db.Set<CAMIONES>().Add(camion);

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



        // PUT: api/Camiones/{id}
        public IHttpActionResult Put(int id, [FromBody] CAMIONES value)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState); // Retorna 400 si el modelo no es válido
            }

            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            using (var db = new DbContext(connectionString))
            {
                // Buscar el camión por ID
                CAMIONES oitem = db.Set<CAMIONES>().Find(id);

                if (oitem == null)
                {
                    return NotFound(); // Retorna 404 si no se encuentra el camión con el ID especificado
                }

                // Asignar valores desde el objeto recibido
                oitem.Dominio = value.Dominio;
                oitem.Marca = value.Marca;
                oitem.Modelo = value.Modelo;
                oitem.AñoModelo = value.AñoModelo;
                oitem.Tipo = value.Tipo;
                oitem.NumMotor = value.NumMotor;
                oitem.NumChasis = value.NumChasis;
                oitem.FechaCompra = value.FechaCompra;
                oitem.FechaITV = value.FechaITV;
                oitem.EquipoFrio = value.EquipoFrio;

                db.Entry(oitem).State = System.Data.Entity.EntityState.Modified;

                try
                {
                    db.SaveChanges();
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



        // DELETE: api/Camiones/{id}
        public IHttpActionResult Delete(int id)
        {
            try
            {
                // Obtener la cadena de conexión dinámica
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new DbContext(connectionString))
                {
                    // Buscar el camión por ID
                    CAMIONES oitem = db.Set<CAMIONES>().Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el camión con el ID especificado
                    }

                    db.Set<CAMIONES>().Remove(oitem);

                    try
                    {
                        db.SaveChanges();
                        return Ok("Camión eliminado con éxito."); // Retorna 200 OK si la eliminación fue exitosa
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
