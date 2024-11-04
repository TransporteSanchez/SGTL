using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class HealthController : ApiController
    {
        // GET: api/Health
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET: api/Health/5
        public string Get(int id)
        {
            return "value";
        }

        // POST: api/Health
        public void Post([FromBody]string value)
        {
        }

        // PUT: api/Health/5
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE: api/Health/5
        public void Delete(int id)
        {
        }
    }
}
