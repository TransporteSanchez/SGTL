using System.Collections.Generic;
using System.Web.Http;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Web;
using Microsoft.IdentityModel.Tokens;

namespace WebApi_TransporteSanchez.Controllers
{
    [Route("api/logout")]
    public class LogoutController : ApiController
    {
        [HttpPost]
        public IHttpActionResult Logout()
        {
            // Aquí solo indicamos que el logout fue exitoso
            return Ok(new { message = "Sesión cerrada correctamente." });
        }
    }
}
