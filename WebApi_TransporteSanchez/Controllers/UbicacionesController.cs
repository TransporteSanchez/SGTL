using System;
using System.Collections.Generic;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public abstract class UbicacionesController<T> : ApiController where T : class, IUbicacion, new()
    {
        private readonly string conexion = ConnectionStringHelper.GetConnectionString("SGTLEntities");

        protected abstract string CampoId { get; }
        protected abstract int IdDe(T ubicacion);

        public class UbicacionDto
        {
            public string Descripcion { get; set; }
            public int ProvID { get; set; }
            public int LocID { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
            public int ClienteID { get; set; }
            public string Usu_Alta { get; set; }
            public string Usu_Modi { get; set; }
        }

        public IHttpActionResult Get()
        {
            try
            {
                using (var db = new SGTLAuditContext(conexion))
                {
                    var filas = (from u in db.Set<T>()
                                 join c in db.Set<CLIENTES>() on u.ClienteID equals c.Cliente_ID into clientes
                                 from c in clientes.DefaultIfEmpty()
                                 select new
                                 {
                                     Ubicacion = u,
                                     Provincia = u.PROVINCIAS.Nombre_Provincia,
                                     Localidad = u.LOCALIDADES.Nombre_Localidad,
                                     Cliente = c.Razon_Social
                                 })
                                 .ToList();

                    return Ok(filas
                        .OrderByDescending(f => IdDe(f.Ubicacion))
                        .Select(f => ADatos(f.Ubicacion, f.Provincia, f.Localidad, f.Cliente))
                        .ToList());
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        public IHttpActionResult Get(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(conexion))
                {
                    var u = db.Set<T>().Find(id);
                    if (u == null) return NotFound();
                    var cliente = db.Set<CLIENTES>().Find(u.ClienteID);
                    return Ok(ADatos(u, u.PROVINCIAS?.Nombre_Provincia, u.LOCALIDADES?.Nombre_Localidad, cliente?.Razon_Social));
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        public IHttpActionResult Post([FromBody] UbicacionDto dto)
        {
            if (dto == null) return BadRequest("No se recibieron datos.");
            var errores = Validar(dto);
            if (errores.Count > 0) return Content(HttpStatusCode.BadRequest, errores);

            try
            {
                using (var db = new SGTLAuditContext(conexion))
                {
                    var u = new T();
                    u.Fecha_Alta = DateTime.Now;
                    u.Usu_Alta = Usuario(dto.Usu_Alta);
                    Copiar(dto, u, u.Usu_Alta);

                    db.Set<T>().Add(u);
                    db.SaveChanges();
                    return Ok(new { ID = IdDe(u), Message = "Registro creado correctamente." });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        public IHttpActionResult Put(int id, [FromBody] UbicacionDto dto)
        {
            if (dto == null) return BadRequest("No se recibieron datos.");
            var errores = Validar(dto);
            if (errores.Count > 0) return Content(HttpStatusCode.BadRequest, errores);

            try
            {
                using (var db = new SGTLAuditContext(conexion))
                {
                    var u = db.Set<T>().Find(id);
                    if (u == null) return NotFound();

                    Copiar(dto, u, Usuario(dto.Usu_Modi));
                    db.SaveChanges();
                    return Ok(new { Message = "Registro actualizado correctamente." });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        public IHttpActionResult Delete(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(conexion))
                {
                    var u = db.Set<T>().Find(id);
                    if (u == null) return NotFound();

                    db.Set<T>().Remove(u);
                    db.SaveChanges();
                    return Ok(new { Message = "Registro eliminado correctamente." });
                }
            }
            catch (DbUpdateException)
            {
                return Content(HttpStatusCode.Conflict, new { Message = "No se puede eliminar: está en uso por uno o más viajes o tarifas." });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        private Dictionary<string, object> ADatos(T u, string provincia, string localidad, string cliente)
        {
            return new Dictionary<string, object>
            {
                [CampoId] = IdDe(u),
                ["Descripcion"] = u.Descripcion,
                ["ProvID"] = u.ProvID,
                ["LocID"] = u.LocID,
                ["Calle"] = u.Calle,
                ["AlturaCalle"] = (u.AlturaCalle ?? "").Trim(),
                ["NombreProvincia"] = provincia,
                ["NombreLocalidad"] = localidad,
                ["ClienteID"] = u.ClienteID,
                ["ClienteRazon"] = cliente ?? "",
                ["Usu_Alta"] = u.Usu_Alta,
                ["Fecha_Alta"] = u.Fecha_Alta,
                ["Usu_Modi"] = u.Usu_Modi,
                ["Fecha_Modi"] = u.Fecha_Modi
            };
        }

        private static void Copiar(UbicacionDto dto, T u, string usuario)
        {
            u.Descripcion = dto.Descripcion.Trim();
            u.ProvID = dto.ProvID;
            u.LocID = dto.LocID;
            u.Calle = (dto.Calle ?? "").Trim();
            var altura = (dto.AlturaCalle ?? "").Trim();
            if (u.AlturaCalle?.Trim() != altura) u.AlturaCalle = altura;
            u.ClienteID = dto.ClienteID;
            u.Fecha_Modi = DateTime.Now;
            u.Usu_Modi = usuario;
        }

        private static string Usuario(string nombre)
        {
            return string.IsNullOrWhiteSpace(nombre) ? "sistema" : nombre;
        }

        private static List<object> Validar(UbicacionDto d)
        {
            var errores = new List<object>();
            if (string.IsNullOrWhiteSpace(d.Descripcion))
                errores.Add(new { PropertyName = "Descripcion", ErrorMessage = "Completá la descripción." });
            else if (d.Descripcion.Trim().Length > 50)
                errores.Add(new { PropertyName = "Descripcion", ErrorMessage = "La descripción puede tener hasta 50 caracteres." });
            if (d.ClienteID <= 0)
                errores.Add(new { PropertyName = "ClienteID", ErrorMessage = "Seleccioná un cliente." });
            if (d.ProvID <= 0)
                errores.Add(new { PropertyName = "ProvID", ErrorMessage = "Seleccioná una provincia." });
            if (d.LocID <= 0)
                errores.Add(new { PropertyName = "LocID", ErrorMessage = "Seleccioná una localidad." });
            if ((d.Calle ?? "").Trim().Length > 50)
                errores.Add(new { PropertyName = "Calle", ErrorMessage = "La calle puede tener hasta 50 caracteres." });
            if ((d.AlturaCalle ?? "").Trim().Length > 10)
                errores.Add(new { PropertyName = "AlturaCalle", ErrorMessage = "La altura puede tener hasta 10 caracteres." });
            return errores;
        }
    }
}
