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
            public int ChofCamID { get; set; }
            public int TarifaFijaID { get; set; }
            public int TarifaKmID { get; set; }
            public int ClienteID { get; set; }
            public System.DateTime Fecha_Alta { get; set; }
            public string Usu_Alta { get; set; }
            public System.DateTime Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }

        }

        // GET: api/Viajes
        public IHttpActionResult Get()
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var olist = db.Set<VIAJES>()
                        .Select(c => new ViajeDto
                        {
                            Viaje_ID = c.Viaje_ID,
                            OrigenID = c.OrigenID,
                            DestinoID = c.DestinoID,
                            Distancia_KM = c.Distancia_KM,
                            Num_Remito = c.Num_Remito,
                            Num_de_Carga = c.Num_de_Carga,
                            Fecha_Inicio = c.Fecha_Inicio,
                            Fecha_Fin = c.Fecha_Fin,
                            TarifaFijaID = c.TarifaFijaID,
                            TarifaKmID = c.TarifaKmID,
                            ClienteID = c.ClienteID,
                            Fecha_Alta = c.Fecha_Alta,
                            Usu_Alta = c.Usu_Alta,
                            Fecha_Modi = c.Fecha_Modi,
                            Usu_Modi = c.Usu_Modi
                        })
                        .ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound(); // Retorna 404 si no se encuentran viajes
                    }

                    return Ok(olist); // Retorna 200 OK con la lista de viajes
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
