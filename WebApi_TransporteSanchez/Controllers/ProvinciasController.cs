using System;
using System.Linq;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class ProvinciasController : ApiController
    {
        private readonly string conexion = ConnectionStringHelper.GetConnectionString("SGTLEntities");

        public IHttpActionResult Get()
        {
            try
            {
                using (var db = new SGTLAuditContext(conexion))
                {
                    var provincias = db.Set<PROVINCIAS>()
                        .OrderBy(p => p.Nombre_Provincia)
                        .Select(p => new { p.Prov_ID, p.Nombre_Provincia })
                        .ToList();

                    if (provincias.Count == 0) return NotFound();
                    return Ok(provincias);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("api/Provincias/{provId}")]
        public IHttpActionResult GetProvinciaById(int provId)
        {
            try
            {
                using (var db = new SGTLAuditContext(conexion))
                {
                    var provincia = db.Set<PROVINCIAS>()
                        .Where(p => p.Prov_ID == provId)
                        .Select(p => new { p.Prov_ID, p.Nombre_Provincia })
                        .FirstOrDefault();

                    if (provincia == null) return NotFound();
                    return Ok(provincia);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("api/Provincias/{provId}/Localidades")]
        public IHttpActionResult GetLocalidades(int provId, int? locId = null)
        {
            try
            {
                using (var db = new SGTLAuditContext(conexion))
                {
                    var consulta = db.Set<LOCALIDADES>().Where(l => l.ProvID == provId);
                    if (locId.HasValue)
                        consulta = consulta.Where(l => l.Loc_ID == locId.Value);

                    var localidades = consulta
                        .OrderBy(l => l.Nombre_Localidad)
                        .Select(l => new { l.Loc_ID, l.Nombre_Localidad, l.ProvID })
                        .ToList();

                    if (localidades.Count == 0) return NotFound();
                    return Ok(localidades);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
