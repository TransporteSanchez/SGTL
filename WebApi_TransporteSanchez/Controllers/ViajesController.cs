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
        [HttpGet]
        [Route("api/Viajes/Buscar")]
        public IHttpActionResult Buscar(int? idViaje = null, int? clienteId = null, string fechaDesde = null, string fechaHasta = null, string fechaFinDesde = null, string fechaFinHasta = null, int page = 1, int pageSize = 6)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString))
                {
                    var query = from v in db.Set<VIAJES>()
                                join o in db.Set<ORIGEN>() on v.OrigenID equals o.Origen_ID
                                join d in db.Set<DESTINO>() on v.DestinoID equals d.Destino_ID
                                select new { v, o, d };

                    if (idViaje.HasValue)
                    {
                        query = query.Where(x => x.v.Viaje_ID == idViaje.Value);
                    }

                    if (clienteId.HasValue)
                    {
                        query = query.Where(x => x.v.ClienteID == clienteId.Value);
                    }

                    if (!string.IsNullOrWhiteSpace(fechaDesde) && DateTime.TryParse(fechaDesde, out var fd))
                    {
                        var desde = fd.Date;
                        query = query.Where(x => x.v.Fecha_Inicio >= desde);
                    }

                    if (!string.IsNullOrWhiteSpace(fechaHasta) && DateTime.TryParse(fechaHasta, out var fh))
                    {
                        var hasta = fh.Date.AddDays(1).AddTicks(-1);
                        query = query.Where(x => x.v.Fecha_Inicio <= hasta);
                    }

                    if (!string.IsNullOrWhiteSpace(fechaFinDesde) && DateTime.TryParse(fechaFinDesde, out var ffd))
                    {
                        var desdeFin = ffd.Date;
                        query = query.Where(x => x.v.Fecha_Fin >= desdeFin);
                    }

                    if (!string.IsNullOrWhiteSpace(fechaFinHasta) && DateTime.TryParse(fechaFinHasta, out var ffh))
                    {
                        var hastaFin = ffh.Date.AddDays(1).AddTicks(-1);
                        query = query.Where(x => x.v.Fecha_Fin <= hastaFin);
                    }

                    var totalRecords = query.Count();

                    var results = query
                        .OrderByDescending(x => x.v.Viaje_ID)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(x => new
                        {
                            x.v.Viaje_ID,
                            x.v.OrigenID,
                            x.v.DestinoID,
                            x.v.Distancia_KM,
                            x.v.Num_Remito,
                            x.v.Num_de_Carga,
                            x.v.Fecha_Inicio,
                            x.v.Fecha_Fin,
                            ChofCamID = x.v.ChoferID,
                            x.v.TarifaFijaID,
                            x.v.TarifaKmID,
                            x.v.ClienteID,
                            Origen = x.o.Descripcion,
                            Destino = x.d.Descripcion,
                            Estado = "Activo"
                        })
                        .ToList();

                    return Ok(new
                    {
                        TotalRecords = totalRecords,
                        Results = results
                    });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

    }
}