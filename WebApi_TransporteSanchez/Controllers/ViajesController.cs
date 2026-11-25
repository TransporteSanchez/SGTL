using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using WebApi_TransporteSanchez.Viajes;

namespace WebApi_TransporteSanchez.Controllers
{
    public class ViajesController : ApiController
    {
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
            public int? TarifaFijaID { get; set; }
            public int? TarifaKmID { get; set; }
            public int ClienteID { get; set; }
            public System.DateTime Fecha_Alta { get; set; }
            public string Usu_Alta { get; set; }
            public System.DateTime Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }
        }

        [HttpGet]
        [Route("api/Viajes/Buscar")]
        public IHttpActionResult Buscar([FromUri] ConsultaViajes.Filtro filtro)
        {
            try
            {
                using (var db = new SGTLAuditContext(ConnectionStringHelper.GetConnectionString("SGTLEntities")))
                {
                    return Ok(ConsultaViajes.Buscar(db, filtro ?? new ConsultaViajes.Filtro()));
                }
            }
            catch (Exception ex)
            {
                Trace.TraceError("Viajes: {0}", ex.Message);
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudieron consultar los viajes." });
            }
        }

        // GET: api/Viajes/{id}
        public IHttpActionResult Get(int id)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
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

            var errores = ValidarViaje(viajeDto);
            if (errores.Any())
            {
                return Content(HttpStatusCode.BadRequest, errores);
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
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
                        TarifaFijaID = (viajeDto.TarifaFijaID.HasValue && viajeDto.TarifaFijaID.Value > 0) ? viajeDto.TarifaFijaID : (int?)null,
                        TarifaKmID = (viajeDto.TarifaKmID.HasValue && viajeDto.TarifaKmID.Value > 0) ? viajeDto.TarifaKmID : (int?)null,
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

            using (var db = new SGTLAuditContext(connectionString))
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
                viaje.TarifaFijaID = (viajeDto.TarifaFijaID.HasValue && viajeDto.TarifaFijaID.Value > 0) ? viajeDto.TarifaFijaID : (int?)null;
                viaje.TarifaKmID = (viajeDto.TarifaKmID.HasValue && viajeDto.TarifaKmID.Value > 0) ? viajeDto.TarifaKmID : (int?)null;
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
        public IHttpActionResult Delete(int id)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
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

        private List<object> ValidarViaje(ViajeDto v)
        {
            var errores = new List<object>();

            if (v.ClienteID <= 0)
                errores.Add(new { PropertyName = "ClienteID", ErrorMessage = "Debe seleccionar un cliente." });

            if (v.OrigenID <= 0)
                errores.Add(new { PropertyName = "OrigenID", ErrorMessage = "Debe seleccionar un origen." });

            if (v.DestinoID <= 0)
                errores.Add(new { PropertyName = "DestinoID", ErrorMessage = "Debe seleccionar un destino." });

            if (v.Fecha_Fin < v.Fecha_Inicio)
                errores.Add(new { PropertyName = "Fecha_Fin", ErrorMessage = "La fecha de fin no puede ser anterior a la fecha de inicio." });

            bool tieneFija = v.TarifaFijaID.HasValue && v.TarifaFijaID.Value > 0;
            bool tieneKm = v.TarifaKmID.HasValue && v.TarifaKmID.Value > 0;
            if (!tieneFija && !tieneKm)
                errores.Add(new { PropertyName = "Tarifa", ErrorMessage = "Debe asignar una tarifa (fija o por km) al viaje." });

            return errores;
        }
    }
}