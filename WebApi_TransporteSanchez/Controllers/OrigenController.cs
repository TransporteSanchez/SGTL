using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using System.Net;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class ORIGENController : ApiController
    {
        public class ORIGENDto
        {
            public int Origen_ID { get; set; }
            public string Descripcion { get; set; }
            public int ProvID { get; set; }
            public int LocID { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
            /// <summary>Nombre de provincia (tabla PROVINCIAS), para geocodificacion.</summary>
            public string NombreProvincia { get; set; }
            /// <summary>Nombre de localidad (tabla LOCALIDADES), para geocodificacion.</summary>
            public string NombreLocalidad { get; set; }
            public int ClienteID { get; set; }
            public string ClienteRazon { get; set; }
            public string Usu_Alta { get; set; }
            public string Usu_Modi { get; set; }
        }

        private static string Cn()
        {
            return ConnectionStringHelper.GetConnectionString("SGTLEntities");
        }

        // GET: api/Origen
        public IHttpActionResult Get()
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var olist = (from c in db.Set<ORIGEN>()
                                 join cli in db.Set<CLIENTES>() on c.ClienteID equals cli.Cliente_ID into clj
                                 from cli in clj.DefaultIfEmpty()
                                 select new ORIGENDto
                                 {
                                     Origen_ID = c.Origen_ID,
                                     Descripcion = c.Descripcion,
                                     ProvID = c.ProvID,
                                     LocID = c.LocID,
                                     Calle = c.Calle,
                                     AlturaCalle = c.AlturaCalle,
                                     NombreProvincia = c.PROVINCIAS.Nombre_Provincia,
                                     NombreLocalidad = c.LOCALIDADES.Nombre_Localidad,
                                     ClienteID = c.ClienteID,
                                     ClienteRazon = cli != null ? cli.Razon_Social : "",
                                     Usu_Alta = c.Usu_Alta,
                                     Usu_Modi = c.Usu_Modi
                                 })
                                 .OrderByDescending(c => c.Origen_ID)
                                 .ToList();

                    return Ok(olist);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Origen/{id}
        public IHttpActionResult Get(int id)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var c = db.Set<ORIGEN>().Find(id);
                    if (c == null) return NotFound();

                    var dto = new ORIGENDto
                    {
                        Origen_ID = c.Origen_ID,
                        Descripcion = c.Descripcion,
                        ProvID = c.ProvID,
                        LocID = c.LocID,
                        Calle = c.Calle,
                        AlturaCalle = c.AlturaCalle,
                        ClienteID = c.ClienteID,
                        Usu_Alta = c.Usu_Alta,
                        Usu_Modi = c.Usu_Modi
                    };
                    return Ok(dto);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/Origen
        public IHttpActionResult Post([FromBody] ORIGENDto dto)
        {
            if (dto == null) return BadRequest("No se recibieron datos.");
            var errores = Validar(dto);
            if (errores.Any()) return Content(HttpStatusCode.BadRequest, errores);

            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var c = new ORIGEN
                    {
                        Descripcion = (dto.Descripcion ?? "").Trim(),
                        ProvID = dto.ProvID,
                        LocID = dto.LocID,
                        Calle = (dto.Calle ?? "").Trim(),
                        AlturaCalle = (dto.AlturaCalle ?? "").Trim(),
                        ClienteID = dto.ClienteID,
                        Fecha_Alta = DateTime.Now,
                        Usu_Alta = string.IsNullOrWhiteSpace(dto.Usu_Alta) ? "sistema" : dto.Usu_Alta,
                        Fecha_Modi = DateTime.Now,
                        Usu_Modi = string.IsNullOrWhiteSpace(dto.Usu_Alta) ? "sistema" : dto.Usu_Alta
                    };
                    db.Set<ORIGEN>().Add(c);
                    db.SaveChanges();
                    return Ok(new { ID = c.Origen_ID, Message = "Registro creado correctamente." });
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

        // PUT: api/Origen/{id}
        public IHttpActionResult Put(int id, [FromBody] ORIGENDto dto)
        {
            if (dto == null) return BadRequest("No se recibieron datos.");
            var errores = Validar(dto);
            if (errores.Any()) return Content(HttpStatusCode.BadRequest, errores);

            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var c = db.Set<ORIGEN>().Find(id);
                    if (c == null) return NotFound();

                    c.Descripcion = (dto.Descripcion ?? "").Trim();
                    c.ProvID = dto.ProvID;
                    c.LocID = dto.LocID;
                    c.Calle = (dto.Calle ?? "").Trim();
                    c.AlturaCalle = (dto.AlturaCalle ?? "").Trim();
                    c.ClienteID = dto.ClienteID;
                    c.Fecha_Modi = DateTime.Now;
                    c.Usu_Modi = string.IsNullOrWhiteSpace(dto.Usu_Modi) ? "sistema" : dto.Usu_Modi;

                    db.Entry(c).State = System.Data.Entity.EntityState.Modified;
                    db.SaveChanges();
                    return Ok(new { Message = "Registro actualizado correctamente." });
                }
            }
            catch (DbEntityValidationException ex)
            {
                return Content(HttpStatusCode.BadRequest, ErroresValidacion(ex));
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict();
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

        // DELETE: api/Origen/{id}
        public IHttpActionResult Delete(int id)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var c = db.Set<ORIGEN>().Find(id);
                    if (c == null) return NotFound();

                    db.Set<ORIGEN>().Remove(c);
                    try
                    {
                        db.Configuration.ValidateOnSaveEnabled = false;
                        db.SaveChanges();
                        return Ok(new { Message = "Registro eliminado correctamente." });
                    }
                    catch (DbUpdateException)
                    {
                        return Content(HttpStatusCode.Conflict, new { Message = "No se puede eliminar: está en uso por uno o más viajes o tarifas." });
                    }
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        private List<object> Validar(ORIGENDto d)
        {
            var e = new List<object>();
            if (string.IsNullOrWhiteSpace(d.Descripcion)) e.Add(new { PropertyName = "Descripcion", ErrorMessage = "La descripción es obligatoria." });
            if (d.ClienteID <= 0) e.Add(new { PropertyName = "ClienteID", ErrorMessage = "Debe seleccionar un cliente." });
            if (d.ProvID <= 0) e.Add(new { PropertyName = "ProvID", ErrorMessage = "Debe seleccionar una provincia." });
            if (d.LocID <= 0) e.Add(new { PropertyName = "LocID", ErrorMessage = "Debe seleccionar una localidad." });
            return e;
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
