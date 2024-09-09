using System;
using System.Collections.Generic;
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
            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    var provincias = db.PROVINCIAS
                        .Select(p => new {
                            Prov_ID = p.Prov_ID,
                            Nombre_Provincia = p.Nombre_Provincia
                        })
                        .ToList();

                    if (provincias == null || !provincias.Any())
                    {
                        return NotFound();
                    }

                    return Ok(provincias);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Provincias/{provId}

        [HttpGet]
        [Route("api/Provincias/{provId}")]
        public IHttpActionResult GetProvinciaById(int provId)
        {
            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    var provincia = db.PROVINCIAS
                        .Where(p => p.Prov_ID == provId)
                        .Select(p => new {
                            Prov_ID = p.Prov_ID,
                            Nombre_Provincia = p.Nombre_Provincia
                        })
                        .FirstOrDefault();

                    if (provincia == null)
                    {
                        return NotFound();
                    }

                    return Ok(provincia);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // GET: api/Provincias/{provId}/Localidades
        [HttpGet]
        [Route("api/Provincias/{provId}/Localidades")]
        public IHttpActionResult GetLocalidades(int provId, int? locId = null)
        {
            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    IQueryable<LocalidadDto> query = db.LOCALIDADES
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
                        return NotFound();
                    }

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
