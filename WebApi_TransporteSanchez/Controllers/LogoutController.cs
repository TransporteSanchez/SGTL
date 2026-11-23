using System.Data;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using WebApi_TransporteSanchez.Security;

namespace WebApi_TransporteSanchez.Controllers
{
    [Route("api/logout")]
    public class LogoutController : ApiController
    {
        [HttpPost]
        public async Task<IHttpActionResult> Logout(CancellationToken ct)
        {
            var usuario = await SesionSegura.VerificarAsync(Request, ct);
            if (usuario == null) return Ok();

            using (var db = SeguridadSql.Abrir())
            {
                await db.Database.ExecuteSqlCommandAsync(
                    "UPDATE dbo.USUARIOS SET VersionSesion = VersionSesion + 1 WHERE Usuario_ID = @id AND VersionSesion = @version;",
                    ct,
                    SeguridadSql.P("@id", SqlDbType.Int, usuario.Usuario_ID),
                    SeguridadSql.P("@version", SqlDbType.BigInt, usuario.VersionSesion));
            }

            SeguridadSql.Auditar(usuario.Nombre_Usuario, "LOGOUT", usuario.Usuario_ID);
            return Ok();
        }
    }
}
