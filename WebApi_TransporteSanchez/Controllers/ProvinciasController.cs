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
    public class ProvinciasController : ApiController
    {
        public class LocalidadDto
        {
            public int Loc_ID { get; set; }
            public string Nombre_Localidad { get; set; }
            public int ProvID { get; set; }

        }

        // GET: api/Provincias
        public IHttpActionResult Get()
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var provincias = db.Set<PROVINCIAS>()
                        .Select(p => new {
                            Prov_ID = p.Prov_ID,
                            Nombre_Provincia = p.Nombre_Provincia
                        })
                        .ToList();

                    if (provincias == null || !provincias.Any())
                    {
                        return NotFound(); // Retorna 404 si no se encuentran provincias
                    }

                    return Ok(provincias); // Retorna 200 con la lista de provincias
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

        // GET: api/Provincias/{provId}
        [HttpGet]
        [Route("api/Provincias/{provId}")]
        public IHttpActionResult GetProvinciaById(int provId)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var provincia = db.Set<PROVINCIAS>()
                        .Where(p => p.Prov_ID == provId)
                        .Select(p => new {
                            Prov_ID = p.Prov_ID,
                            Nombre_Provincia = p.Nombre_Provincia
                        })
                        .FirstOrDefault();

                    if (provincia == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra la provincia
                    }

                    return Ok(provincia); // Retorna 200 con la provincia encontrada
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

        // GET: api/Provincias/{provId}/Localidades
        [HttpGet]
        [Route("api/Provincias/{provId}/Localidades")]
        public IHttpActionResult GetLocalidades(int provId, int? locId = null)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    IQueryable<LocalidadDto> query = db.Set<LOCALIDADES>()
                        .Where(l => l.ProvID == provId)
                        .Select(l => new LocalidadDto
                        {
                            ProvID = l.ProvID,
                            Loc_ID = l.Loc_ID,
                            Nombre_Localidad = l.Nombre_Localidad
                        });

                    // Si se proporciona locId, filtra por este id
                    if (locId.HasValue)
                    {
                        query = query.Where(l => l.Loc_ID == locId.Value);
                    }

                    var localidades = query.ToList();

                    if (localidades == null || !localidades.Any())
                    {
                        return NotFound(); // Retorna 404 si no se encuentran localidades
                    }

                    return Ok(localidades); // Retorna 200 con la lista de localidades
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
