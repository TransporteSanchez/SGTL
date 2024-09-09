using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class OrigenController : ApiController
    {
        public class OrigenDto
        {
            public int Origen_ID { get; set; }
            public string Descripcion { get; set; }
            public int ProvID { get; set; }
            public int LocID { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
            public int ClienteID { get; set; }

        }

        // GET: api/Origen
        public IHttpActionResult Get()
        {
            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    var olist = db.ORIGEN.Select(c => new OrigenDto
                    {
                        Origen_ID = c.Origen_ID,
                        Descripcion = c.Descripcion,
                        ProvID = c.ProvID,
                        LocID = c.LocID,
                        Calle = c.Calle,
                        AlturaCalle = c.AlturaCalle,
                        ClienteID = c.ClienteID,

                    }).ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound();
                    }

                    return Ok(olist);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
