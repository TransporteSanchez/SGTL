using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    // ABM de tarifas (fijas y por km) para la pantalla de gestion.
    // Los GET de lista (Fijas / Km) tambien alimentan los combos del alta de viajes.
    public class TarifasController : ApiController
    {
        // ===================== DTOs =====================
        public class TarifaFijaDto
        {
            public int TarifaFija_ID { get; set; }
            public System.DateTime FechaDesde { get; set; }
            public System.DateTime FechaHasta { get; set; }
            public decimal ValorRuta { get; set; }
            public decimal ValorVueltaVacio { get; set; }
            public decimal ValorFijoNeto { get; set; }
            public int ClienteID { get; set; }
            public int OrigenID { get; set; }
            public int DestinoID { get; set; }
            // Descripciones para mostrar en la tabla (solo lectura)
            public string ClienteRazon { get; set; }
            public string OrigenDescripcion { get; set; }
            public string DestinoDescripcion { get; set; }
            public string Usu_Alta { get; set; }
            public string Usu_Modi { get; set; }
        }

        public class TarifaKmDto
        {
            public int TarifaKm_ID { get; set; }
            public System.DateTime FechaDesde { get; set; }
            public System.DateTime FechaHasta { get; set; }
            public decimal ValorKm { get; set; }
            public string MinKm { get; set; }
            public string MaxKm { get; set; }
            public string Usu_Alta { get; set; }
            public string Usu_Modi { get; set; }
        }

        private static string Usuario(string u)
        {
            return string.IsNullOrWhiteSpace(u) ? "sistema" : u.Trim();
        }

        private static string Cn()
        {
            return ConnectionStringHelper.GetConnectionString("SGTLEntities");
        }

        // ===================== TARIFAS FIJAS =====================

        // GET: api/Tarifas/Fijas  (lista con descripciones)
        [HttpGet]
        [Route("api/Tarifas/Fijas")]
        public IHttpActionResult GetFijas()
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var olist = (from t in db.Set<TARIFAS_FIJAS>()
                                 join c in db.Set<CLIENTES>() on t.ClienteID equals c.Cliente_ID into cj
                                 from c in cj.DefaultIfEmpty()
                                 join o in db.Set<ORIGEN>() on t.OrigenID equals o.Origen_ID into oj
                                 from o in oj.DefaultIfEmpty()
                                 join d in db.Set<DESTINO>() on t.DestinoID equals d.Destino_ID into dj
                                 from d in dj.DefaultIfEmpty()
                                 select new TarifaFijaDto
                                 {
                                     TarifaFija_ID = t.TarifaFija_ID,
                                     FechaDesde = t.FechaDesde,
                                     FechaHasta = t.FechaHasta,
                                     ValorRuta = t.ValorRuta,
                                     ValorVueltaVacio = t.ValorVueltaVacio,
                                     ValorFijoNeto = t.ValorFijoNeto,
                                     ClienteID = t.ClienteID,
                                     OrigenID = t.OrigenID,
                                     DestinoID = t.DestinoID,
                                     ClienteRazon = c != null ? c.Razon_Social : "",
                                     OrigenDescripcion = o != null ? o.Descripcion : "",
                                     DestinoDescripcion = d != null ? d.Descripcion : "",
                                     Usu_Alta = t.Usu_Alta,
                                     Usu_Modi = t.Usu_Modi
                                 })
                                 .OrderByDescending(t => t.TarifaFija_ID)
                                 .ToList();

                    return Ok(olist);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Tarifas/Fijas/{id}
        [HttpGet]
        [Route("api/Tarifas/Fijas/{id:int}")]
        public IHttpActionResult GetFija(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var t = db.Set<TARIFAS_FIJAS>().Find(id);
                    if (t == null) return NotFound();

                    var dto = new TarifaFijaDto
                    {
                        TarifaFija_ID = t.TarifaFija_ID,
                        FechaDesde = t.FechaDesde,
                        FechaHasta = t.FechaHasta,
                        ValorRuta = t.ValorRuta,
                        ValorVueltaVacio = t.ValorVueltaVacio,
                        ValorFijoNeto = t.ValorFijoNeto,
                        ClienteID = t.ClienteID,
                        OrigenID = t.OrigenID,
                        DestinoID = t.DestinoID,
                        Usu_Alta = t.Usu_Alta,
                        Usu_Modi = t.Usu_Modi
                    };
                    return Ok(dto);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/Tarifas/Fijas
        [HttpPost]
        [Route("api/Tarifas/Fijas")]
        public IHttpActionResult PostFija([FromBody] TarifaFijaDto dto)
        {
            if (dto == null) return BadRequest("No se recibieron datos de la tarifa.");
            var errores = ValidarFija(dto);
            if (errores.Any()) return Content(HttpStatusCode.BadRequest, errores);

            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var superpuesta = SuperposicionFija(db, dto, 0);
                    if (superpuesta != null) return Content(HttpStatusCode.BadRequest, new List<object> { superpuesta });

                    var t = new TARIFAS_FIJAS
                    {
                        FechaDesde = dto.FechaDesde,
                        FechaHasta = dto.FechaHasta,
                        ValorRuta = dto.ValorRuta,
                        ValorVueltaVacio = dto.ValorVueltaVacio,
                        ValorFijoNeto = dto.ValorFijoNeto,
                        ClienteID = dto.ClienteID,
                        OrigenID = dto.OrigenID,
                        DestinoID = dto.DestinoID,
                        Fecha_Alta = DateTime.Now,
                        Usu_Alta = Usuario(dto.Usu_Alta),
                        Fecha_Modi = DateTime.Now,
                        Usu_Modi = Usuario(dto.Usu_Alta)
                    };
                    db.Set<TARIFAS_FIJAS>().Add(t);
                    db.SaveChanges();
                    return Ok(new { t.TarifaFija_ID, Message = "Tarifa fija registrada correctamente." });
                }
            }
            catch (DbEntityValidationException ex)
            {
                return Content(HttpStatusCode.BadRequest, ErroresValidacion(ex));
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception(MsgDb(ex)));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Tarifas/Fijas/{id}
        [HttpPut]
        [Route("api/Tarifas/Fijas/{id:int}")]
        public IHttpActionResult PutFija(int id, [FromBody] TarifaFijaDto dto)
        {
            if (dto == null) return BadRequest("No se recibieron datos de la tarifa.");
            var errores = ValidarFija(dto);
            if (errores.Any()) return Content(HttpStatusCode.BadRequest, errores);

            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var t = db.Set<TARIFAS_FIJAS>().Find(id);
                    if (t == null) return NotFound();

                    var superpuesta = SuperposicionFija(db, dto, id);
                    if (superpuesta != null) return Content(HttpStatusCode.BadRequest, new List<object> { superpuesta });

                    t.FechaDesde = dto.FechaDesde;
                    t.FechaHasta = dto.FechaHasta;
                    t.ValorRuta = dto.ValorRuta;
                    t.ValorVueltaVacio = dto.ValorVueltaVacio;
                    t.ValorFijoNeto = dto.ValorFijoNeto;
                    t.ClienteID = dto.ClienteID;
                    t.OrigenID = dto.OrigenID;
                    t.DestinoID = dto.DestinoID;
                    t.Fecha_Modi = DateTime.Now;
                    t.Usu_Modi = Usuario(dto.Usu_Modi);

                    db.Entry(t).State = System.Data.Entity.EntityState.Modified;
                    db.SaveChanges();
                    return Ok(new { Message = "Tarifa fija actualizada correctamente." });
                }
            }
            catch (DbEntityValidationException ex)
            {
                return Content(HttpStatusCode.BadRequest, ErroresValidacion(ex));
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception(MsgDb(ex)));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/Tarifas/Fijas/{id}
        [HttpDelete]
        [Route("api/Tarifas/Fijas/{id:int}")]
        public IHttpActionResult DeleteFija(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var t = db.Set<TARIFAS_FIJAS>().Find(id);
                    if (t == null) return NotFound();

                    db.Set<TARIFAS_FIJAS>().Remove(t);
                    try
                    {
                        db.Configuration.ValidateOnSaveEnabled = false;
                        db.SaveChanges();
                        return Ok(new { Message = "Tarifa fija eliminada correctamente." });
                    }
                    catch (DbUpdateException)
                    {
                        return Content(HttpStatusCode.Conflict, new { Message = "No se puede eliminar: la tarifa fija está asignada a uno o más viajes." });
                    }
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // ===================== TARIFAS KM =====================

        // GET: api/Tarifas/Km
        [HttpGet]
        [Route("api/Tarifas/Km")]
        public IHttpActionResult GetKm()
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var olist = db.Set<TARIFAS_KM>()
                        .Select(t => new TarifaKmDto
                        {
                            TarifaKm_ID = t.TarifaKm_ID,
                            FechaDesde = t.FechaDesde,
                            FechaHasta = t.FechaHasta,
                            ValorKm = t.ValorKm,
                            MinKm = t.MinKm,
                            MaxKm = t.MaxKm,
                            Usu_Alta = t.Usu_Alta,
                            Usu_Modi = t.Usu_Modi
                        })
                        .OrderByDescending(t => t.TarifaKm_ID)
                        .ToList();

                    return Ok(olist);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Tarifas/Km/{id}
        [HttpGet]
        [Route("api/Tarifas/Km/{id:int}")]
        public IHttpActionResult GetKmById(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var t = db.Set<TARIFAS_KM>().Find(id);
                    if (t == null) return NotFound();

                    var dto = new TarifaKmDto
                    {
                        TarifaKm_ID = t.TarifaKm_ID,
                        FechaDesde = t.FechaDesde,
                        FechaHasta = t.FechaHasta,
                        ValorKm = t.ValorKm,
                        MinKm = t.MinKm,
                        MaxKm = t.MaxKm,
                        Usu_Alta = t.Usu_Alta,
                        Usu_Modi = t.Usu_Modi
                    };
                    return Ok(dto);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/Tarifas/Km
        [HttpPost]
        [Route("api/Tarifas/Km")]
        public IHttpActionResult PostKm([FromBody] TarifaKmDto dto)
        {
            if (dto == null) return BadRequest("No se recibieron datos de la tarifa.");
            var errores = ValidarKm(dto);
            if (errores.Any()) return Content(HttpStatusCode.BadRequest, errores);

            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var t = new TARIFAS_KM
                    {
                        FechaDesde = dto.FechaDesde,
                        FechaHasta = dto.FechaHasta,
                        ValorKm = dto.ValorKm,
                        MinKm = (dto.MinKm ?? "").Trim(),
                        MaxKm = (dto.MaxKm ?? "").Trim(),
                        Fecha_Alta = DateTime.Now,
                        Usu_Alta = Usuario(dto.Usu_Alta),
                        Fecha_Modi = DateTime.Now,
                        Usu_Modi = Usuario(dto.Usu_Alta)
                    };
                    db.Set<TARIFAS_KM>().Add(t);
                    db.SaveChanges();
                    return Ok(new { t.TarifaKm_ID, Message = "Tarifa por km registrada correctamente." });
                }
            }
            catch (DbEntityValidationException ex)
            {
                return Content(HttpStatusCode.BadRequest, ErroresValidacion(ex));
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception(MsgDb(ex)));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Tarifas/Km/{id}
        [HttpPut]
        [Route("api/Tarifas/Km/{id:int}")]
        public IHttpActionResult PutKm(int id, [FromBody] TarifaKmDto dto)
        {
            if (dto == null) return BadRequest("No se recibieron datos de la tarifa.");
            var errores = ValidarKm(dto);
            if (errores.Any()) return Content(HttpStatusCode.BadRequest, errores);

            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var t = db.Set<TARIFAS_KM>().Find(id);
                    if (t == null) return NotFound();

                    t.FechaDesde = dto.FechaDesde;
                    t.FechaHasta = dto.FechaHasta;
                    t.ValorKm = dto.ValorKm;
                    t.MinKm = (dto.MinKm ?? "").Trim();
                    t.MaxKm = (dto.MaxKm ?? "").Trim();
                    t.Fecha_Modi = DateTime.Now;
                    t.Usu_Modi = Usuario(dto.Usu_Modi);

                    db.Entry(t).State = System.Data.Entity.EntityState.Modified;
                    db.SaveChanges();
                    return Ok(new { Message = "Tarifa por km actualizada correctamente." });
                }
            }
            catch (DbEntityValidationException ex)
            {
                return Content(HttpStatusCode.BadRequest, ErroresValidacion(ex));
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception(MsgDb(ex)));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // DELETE: api/Tarifas/Km/{id}
        [HttpDelete]
        [Route("api/Tarifas/Km/{id:int}")]
        public IHttpActionResult DeleteKm(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var t = db.Set<TARIFAS_KM>().Find(id);
                    if (t == null) return NotFound();

                    db.Set<TARIFAS_KM>().Remove(t);
                    try
                    {
                        db.Configuration.ValidateOnSaveEnabled = false;
                        db.SaveChanges();
                        return Ok(new { Message = "Tarifa por km eliminada correctamente." });
                    }
                    catch (DbUpdateException)
                    {
                        return Content(HttpStatusCode.Conflict, new { Message = "No se puede eliminar: la tarifa por km está asignada a uno o más viajes." });
                    }
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // ===================== Validaciones / helpers =====================

        private List<object> ValidarFija(TarifaFijaDto d)
        {
            var e = new List<object>();
            if (d.ClienteID <= 0) e.Add(new { PropertyName = "ClienteID", ErrorMessage = "Seleccioná un cliente." });
            if (d.OrigenID <= 0) e.Add(new { PropertyName = "OrigenID", ErrorMessage = "Seleccioná un origen." });
            if (d.DestinoID <= 0) e.Add(new { PropertyName = "DestinoID", ErrorMessage = "Seleccioná un destino." });
            if (d.FechaHasta < d.FechaDesde) e.Add(new { PropertyName = "FechaHasta", ErrorMessage = "La fecha hasta no puede ser anterior a la fecha desde." });
            if (d.ValorRuta < 0) e.Add(new { PropertyName = "ValorRuta", ErrorMessage = "El valor de ruta no puede ser negativo." });
            if (d.ValorVueltaVacio < 0) e.Add(new { PropertyName = "ValorVueltaVacio", ErrorMessage = "El valor de vuelta vacío no puede ser negativo." });
            if (d.ValorFijoNeto < 0) e.Add(new { PropertyName = "ValorFijoNeto", ErrorMessage = "El valor fijo neto no puede ser negativo." });
            return e;
        }

        // Un cliente no puede tener dos tarifas fijas del mismo recorrido vigentes el mismo día: el viaje no sabría
        // cuál tomar. Se superponen si comparten al menos un día. Al editar, la tarifa no se compara consigo misma.
        private static object SuperposicionFija(SGTLAuditContext db, TarifaFijaDto d, int idPropio)
        {
            int cliente = d.ClienteID, origen = d.OrigenID, destino = d.DestinoID;
            var desde = d.FechaDesde.Date;
            var hasta = d.FechaHasta.Date;

            var otra = db.Set<TARIFAS_FIJAS>()
                .Where(t => t.TarifaFija_ID != idPropio
                         && t.ClienteID == cliente && t.OrigenID == origen && t.DestinoID == destino
                         && t.FechaDesde <= hasta && t.FechaHasta >= desde)
                .OrderBy(t => t.FechaDesde)
                .FirstOrDefault();
            if (otra == null) return null;

            return new
            {
                PropertyName = "FechaDesde",
                ErrorMessage = string.Format(CultureInfo.InvariantCulture,
                    "Este cliente ya tiene la tarifa fija #{0} para el mismo recorrido, del {1:dd/MM/yyyy} al {2:dd/MM/yyyy}. " +
                    "Cambiá las fechas para que no se superpongan o editá esa tarifa.",
                    otra.TarifaFija_ID, otra.FechaDesde, otra.FechaHasta)
            };
        }

        private List<object> ValidarKm(TarifaKmDto d)
        {
            var e = new List<object>();
            if (d.FechaHasta < d.FechaDesde) e.Add(new { PropertyName = "FechaHasta", ErrorMessage = "La fecha hasta no puede ser anterior a la fecha desde." });
            if (d.ValorKm < 0) e.Add(new { PropertyName = "ValorKm", ErrorMessage = "El valor por km no puede ser negativo." });

            decimal min, max;
            bool okMin = TryKm(d.MinKm, out min);
            bool okMax = TryKm(d.MaxKm, out max);
            if (!okMin) e.Add(new { PropertyName = "MinKm", ErrorMessage = "El km mínimo debe ser un número válido." });
            if (!okMax) e.Add(new { PropertyName = "MaxKm", ErrorMessage = "El km máximo debe ser un número válido." });
            if (okMin && okMax && min > max) e.Add(new { PropertyName = "MaxKm", ErrorMessage = "El km máximo no puede ser menor que el mínimo." });
            return e;
        }

        private static bool TryKm(string raw, out decimal value)
        {
            value = 0;
            if (string.IsNullOrWhiteSpace(raw)) return false;
            var s = raw.Trim().Replace(',', '.');
            return decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out value);
        }

        private static List<object> ErroresValidacion(DbEntityValidationException ex)
        {
            var list = new List<object>();
            foreach (var vr in ex.EntityValidationErrors)
                foreach (var err in vr.ValidationErrors)
                    list.Add(new { err.PropertyName, err.ErrorMessage });
            return list;
        }

        private static string MsgDb(DbUpdateException ex)
        {
            return ex.InnerException?.InnerException?.Message ?? ex.InnerException?.Message ?? ex.Message;
        }
    }
}
