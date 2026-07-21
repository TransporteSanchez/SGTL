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
    public class ViajesController : ApiController
    {
        // DTO principal: refleja exactamente los campos de la entidad VIAJES.
        public class ViajeDto
        {
            public int Viaje_ID { get; set; }
            public int OrigenID { get; set; }
            public int DestinoID { get; set; }
            public string Distancia_KM { get; set; }
            public string Num_Remito { get; set; }
            public string Num_de_Carga { get; set; }
            public System.DateTime Fecha_Inicio { get; set; }
            public System.DateTime Fecha_Fin { get; set; }
            public int ChoferID { get; set; }
            public int CamionID { get; set; }
            public int TarifaFijaID { get; set; }
            public int TarifaKmID { get; set; }
            public int ClienteID { get; set; }
            public System.DateTime Fecha_Alta { get; set; }
            public string Usu_Alta { get; set; }
            public System.DateTime Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }
        }

        // GET: api/Viajes
        // Lista todos los viajes con las descripciones de origen y destino resueltas.
        public IHttpActionResult Get()
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    var olist = (from v in db.Set<VIAJES>()
                                 join o in db.Set<ORIGEN>() on v.OrigenID equals o.Origen_ID into oj
                                 from o in oj.DefaultIfEmpty()
                                 join d in db.Set<DESTINO>() on v.DestinoID equals d.Destino_ID into dj
                                 from d in dj.DefaultIfEmpty()
                                 select new
                                 {
                                     v.Viaje_ID,
                                     v.OrigenID,
                                     v.DestinoID,
                                     Origen = o != null ? o.Descripcion : "",
                                     Destino = d != null ? d.Descripcion : "",
                                     v.Distancia_KM,
                                     v.Num_Remito,
                                     v.Num_de_Carga,
                                     v.Fecha_Inicio,
                                     v.Fecha_Fin,
                                     v.ChoferID,
                                     v.CamionID,
                                     v.TarifaFijaID,
                                     v.TarifaKmID,
                                     v.ClienteID,
                                     v.Fecha_Alta,
                                     v.Usu_Alta,
                                     v.Fecha_Modi,
                                     v.Usu_Modi
                                 })
                                 .OrderByDescending(v => v.Viaje_ID)
                                 .ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound();
                    }

                    return Ok(olist);
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

        // GET: api/Viajes/Buscar
        // Mismo contrato que Camiones/Buscar: filtros opcionales + paginacion.
        // Devuelve { TotalRecords, Results = [...] } tal como lo consume gestion-viajes.html.
        [HttpGet]
        [Route("api/Viajes/Buscar")]
        public IHttpActionResult Buscar(string idViaje = null, string fechaDesde = null, string fechaHasta = null, int page = 1, int pageSize = 6)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    var query = db.Set<VIAJES>().AsQueryable();

                    // Filtro por numero (ID) de viaje si se proporciona
                    if (!string.IsNullOrEmpty(idViaje) && int.TryParse(idViaje, out int viajeId))
                    {
                        query = query.Where(v => v.Viaje_ID == viajeId);
                    }

                    // Filtro por rango de fecha de inicio del viaje
                    if (!string.IsNullOrEmpty(fechaDesde) && DateTime.TryParse(fechaDesde, out DateTime desde))
                    {
                        query = query.Where(v => v.Fecha_Inicio >= desde);
                    }

                    if (!string.IsNullOrEmpty(fechaHasta) && DateTime.TryParse(fechaHasta, out DateTime hasta))
                    {
                        hasta = hasta.AddDays(1).AddTicks(-1); // incluir todo el dia
                        query = query.Where(v => v.Fecha_Inicio <= hasta);
                    }

                    var totalRecords = query.Count();

                    var results = (from v in query
                                   join o in db.Set<ORIGEN>() on v.OrigenID equals o.Origen_ID into oj
                                   from o in oj.DefaultIfEmpty()
                                   join d in db.Set<DESTINO>() on v.DestinoID equals d.Destino_ID into dj
                                   from d in dj.DefaultIfEmpty()
                                   orderby v.Viaje_ID descending
                                   select new
                                   {
                                       v.Viaje_ID,
                                       v.Fecha_Inicio,
                                       v.Fecha_Fin,
                                       Origen = o != null ? o.Descripcion : "",
                                       Destino = d != null ? d.Descripcion : "",
                                       v.Num_Remito,
                                       v.Num_de_Carga,
                                       v.Distancia_KM,
                                       v.OrigenID,
                                       v.DestinoID,
                                       v.ChoferID,
                                       v.CamionID,
                                       v.ClienteID,
                                       v.TarifaFijaID,
                                       v.TarifaKmID,
                                       // La tabla VIAJES no tiene columna Estado en este modelo.
                                       // Se devuelve vacio para que el frontend habilite la edicion/eliminacion.
                                       Estado = ""
                                   })
                                   .Skip((page - 1) * pageSize)
                                   .Take(pageSize)
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
                return InternalServerError(new Exception("Error al acceder a la base de datos durante la busqueda de viajes.", ex));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Viajes/{id}
        // Devuelve un viaje completo para precargar el formulario de edicion.
        public IHttpActionResult Get(int id)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    var viaje = db.Set<VIAJES>().Where(v => v.Viaje_ID == id).FirstOrDefault();

                    if (viaje == null)
                    {
                        return NotFound();
                    }

                    var dto = new ViajeDto
                    {
                        Viaje_ID = viaje.Viaje_ID,
                        OrigenID = viaje.OrigenID,
                        DestinoID = viaje.DestinoID,
                        Distancia_KM = viaje.Distancia_KM,
                        Num_Remito = viaje.Num_Remito,
                        Num_de_Carga = viaje.Num_de_Carga,
                        Fecha_Inicio = viaje.Fecha_Inicio,
                        Fecha_Fin = viaje.Fecha_Fin,
                        ChoferID = viaje.ChoferID,
                        CamionID = viaje.CamionID,
                        TarifaFijaID = viaje.TarifaFijaID,
                        TarifaKmID = viaje.TarifaKmID,
                        ClienteID = viaje.ClienteID,
                        Fecha_Alta = viaje.Fecha_Alta,
                        Usu_Alta = viaje.Usu_Alta,
                        Fecha_Modi = viaje.Fecha_Modi,
                        Usu_Modi = viaje.Usu_Modi
                    };

                    return Ok(dto);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/Viajes
        public IHttpActionResult Post([FromBody] ViajeDto viajeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (viajeDto == null)
            {
                return BadRequest("No se recibieron datos del viaje.");
            }

            // Validaciones de negocio basicas
            var errores = ValidarViaje(viajeDto);
            if (errores.Any())
            {
                return Content(HttpStatusCode.BadRequest, errores);
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    var viaje = new VIAJES
                    {
                        OrigenID = viajeDto.OrigenID,
                        DestinoID = viajeDto.DestinoID,
                        Distancia_KM = viajeDto.Distancia_KM,
                        Num_Remito = viajeDto.Num_Remito,
                        Num_de_Carga = viajeDto.Num_de_Carga,
                        Fecha_Inicio = viajeDto.Fecha_Inicio,
                        Fecha_Fin = viajeDto.Fecha_Fin,
                        ChoferID = viajeDto.ChoferID,
                        CamionID = viajeDto.CamionID,
                        TarifaFijaID = viajeDto.TarifaFijaID,
                        TarifaKmID = viajeDto.TarifaKmID,
                        ClienteID = viajeDto.ClienteID,
                        Fecha_Alta = DateTime.Now,
                        Usu_Alta = viajeDto.Usu_Alta,
                        Fecha_Modi = DateTime.Now,
                        Usu_Modi = viajeDto.Usu_Alta
                    };

                    db.Set<VIAJES>().Add(viaje);

                    try
                    {
                        db.SaveChanges();
                        return Ok(new { Viaje_ID = viaje.Viaje_ID, Message = "Viaje registrado correctamente." });
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
                    catch (DbUpdateException ex)
                    {
                        var errorMessage = ex.InnerException?.InnerException?.Message ?? ex.InnerException?.Message ?? ex.Message;
                        return InternalServerError(new Exception("Error al guardar el viaje.", new Exception(errorMessage)));
                    }
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Viajes/{id}
        public IHttpActionResult Put(int id, [FromBody] ViajeDto viajeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (viajeDto == null)
            {
                return BadRequest("No se recibieron datos del viaje.");
            }

            var errores = ValidarViaje(viajeDto);
            if (errores.Any())
            {
                return Content(HttpStatusCode.BadRequest, errores);
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            using (var db = new DbContext(connectionString))
            {
                var viaje = db.Set<VIAJES>().Find(id);

                if (viaje == null)
                {
                    return NotFound();
                }

                viaje.OrigenID = viajeDto.OrigenID;
                viaje.DestinoID = viajeDto.DestinoID;
                viaje.Distancia_KM = viajeDto.Distancia_KM;
                viaje.Num_Remito = viajeDto.Num_Remito;
                viaje.Num_de_Carga = viajeDto.Num_de_Carga;
                viaje.Fecha_Inicio = viajeDto.Fecha_Inicio;
                viaje.Fecha_Fin = viajeDto.Fecha_Fin;
                viaje.ChoferID = viajeDto.ChoferID;
                viaje.CamionID = viajeDto.CamionID;
                viaje.TarifaFijaID = viajeDto.TarifaFijaID;
                viaje.TarifaKmID = viajeDto.TarifaKmID;
                viaje.ClienteID = viajeDto.ClienteID;
                viaje.Fecha_Modi = DateTime.Now;
                viaje.Usu_Modi = viajeDto.Usu_Modi;

                db.Entry(viaje).State = System.Data.Entity.EntityState.Modified;

                try
                {
                    db.SaveChanges();
                    return Ok(new { Message = "Viaje actualizado correctamente." });
                }
                catch (DbEntityValidationException ex)
                {
                    var validationErrors = new List<object>();
                    foreach (var validationResult in ex.EntityValidationErrors)
                    {
                        foreach (var error in validationResult.ValidationErrors)
                        {
                            validationErrors.Add(new { error.PropertyName, error.ErrorMessage });
                        }
                    }
                    return Content(HttpStatusCode.BadRequest, validationErrors);
                }
                catch (DbUpdateConcurrencyException)
                {
                    return Conflict();
                }
                catch (DbUpdateException ex)
                {
                    var errorMessage = ex.InnerException?.InnerException?.Message ?? ex.InnerException?.Message ?? ex.Message;
                    return InternalServerError(new Exception("Error al actualizar el viaje.", new Exception(errorMessage)));
                }
            }
        }

        // DELETE: api/Viajes/{id}
        // Eliminacion fisica: la tabla VIAJES no tiene columna de estado para baja logica.
        public IHttpActionResult Delete(int id)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    var viaje = db.Set<VIAJES>().Find(id);

                    if (viaje == null)
                    {
                        return NotFound();
                    }

                    db.Set<VIAJES>().Remove(viaje);

                    try
                    {
                        db.Configuration.ValidateOnSaveEnabled = false;
                        db.SaveChanges();
                        return Ok(new { Message = "Viaje eliminado correctamente." });
                    }
                    catch (DbUpdateConcurrencyException)
                    {
                        return Conflict();
                    }
                    catch (DbUpdateException ex)
                    {
                        var errorMessage = ex.InnerException?.InnerException?.Message ?? ex.InnerException?.Message ?? ex.Message;
                        return InternalServerError(new Exception("Error al eliminar el viaje.", new Exception(errorMessage)));
                    }
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // Validaciones de negocio compartidas entre alta y edicion.
        private List<object> ValidarViaje(ViajeDto v)
        {
            var errores = new List<object>();

            if (v.ClienteID <= 0)
                errores.Add(new { PropertyName = "ClienteID", ErrorMessage = "Debe seleccionar un cliente." });

            if (v.OrigenID <= 0)
                errores.Add(new { PropertyName = "OrigenID", ErrorMessage = "Debe seleccionar un origen." });

            if (v.DestinoID <= 0)
                errores.Add(new { PropertyName = "DestinoID", ErrorMessage = "Debe seleccionar un destino." });

            if (v.OrigenID == v.DestinoID && v.OrigenID > 0)
                errores.Add(new { PropertyName = "DestinoID", ErrorMessage = "El origen y el destino no pueden ser iguales." });

            if (v.Fecha_Fin < v.Fecha_Inicio)
                errores.Add(new { PropertyName = "Fecha_Fin", ErrorMessage = "La fecha de fin no puede ser anterior a la fecha de inicio." });

            // Debe tener al menos un tipo de tarifa asociada (fija o por km).
            if (v.TarifaFijaID <= 0 && v.TarifaKmID <= 0)
                errores.Add(new { PropertyName = "Tarifa", ErrorMessage = "Debe asignar una tarifa (fija o por km) al viaje." });

            return errores;
        }
    }
}