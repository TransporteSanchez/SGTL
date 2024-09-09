using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class DestinoController : ApiController
    {
        public class DestinoDto
        {
            public int Destino_ID { get; set; }
            public string Descripcion { get; set; }
            public int ProvID { get; set; }
            public int LocID { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
            public int ClienteID { get; set; }

        }

        // GET: api/Destino
        public IHttpActionResult Get()
        {
            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    var olist = db.DESTINO.Select(c => new DestinoDto
                    {
                        Destino_ID = c.Destino_ID,
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
