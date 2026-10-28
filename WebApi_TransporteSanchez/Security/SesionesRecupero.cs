using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using Microsoft.IdentityModel.Tokens;

namespace WebApi_TransporteSanchez.Security
{
    public static class SesionesRecupero
    {
        public const string ClaimVersion = "sgtl_version";
        public const string ClaimUsuarioId = "sgtl_usuario_id";

        internal static ClaimsPrincipal Leer(HttpRequestMessage request)
        {
            var auth = request.Headers.Authorization;
            if (auth == null || !string.Equals(auth.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(auth.Parameter))
                throw new SecurityTokenException();
            try
            {
                SecurityToken token;
                return new JwtSecurityTokenHandler().ValidateToken(auth.Parameter, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                    ValidateIssuer = true, ValidIssuer = JwtConfig.Issuer, ValidateAudience = true, ValidAudience = JwtConfig.Audience,
                    ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1)
                }, out token);
            }
            catch { throw new SecurityTokenException(); }
        }

        internal static bool Vigente(ClaimsPrincipal principal, string permiso = null)
        {
            var nombre = principal.FindFirst(ClaimTypes.NameIdentifier);
            var claim = principal.FindFirst(ClaimVersion);
            var claimId = principal.FindFirst(ClaimUsuarioId);
            long version = 0;
            int usuarioId = 0;
            if (nombre == null || (claim != null && !long.TryParse(claim.Value, out version))) return false;
            if (claimId != null && (!int.TryParse(claimId.Value, out usuarioId) || usuarioId <= 0)) return false;
            using (var cn = RepositorioRecuperoSql.Conexion())
            {
                cn.Open();
                using (var cmd = RepositorioRecuperoSql.Comando(cn, null, @"SELECT COUNT(*) FROM dbo.USUARIOS u
WHERE u.Nombre_Usuario=@nombre AND u.EstadoUsuario='Activo' AND u.VersionSesion=@version
AND (@usuarioId IS NULL OR u.Usuario_ID=@usuarioId)
AND (@permiso IS NULL OR LOWER(LTRIM(RTRIM(u.Rol)))='admin' OR EXISTS
(SELECT 1 FROM dbo.GRUPOS_USUARIOS gu JOIN dbo.GRUPOS_MENU gm ON gm.GrupoID=gu.GrupoID
JOIN dbo.MENU m ON m.Menu_ID=gm.MenuID WHERE gu.UsuarioID=u.Usuario_ID
AND (m.Menu_Nombre COLLATE Latin1_General_CI_AI=@permiso
OR (@permiso='Listado de usuarios' AND m.Menu_Nombre COLLATE Latin1_General_CI_AI='Gestion de usuarios'))))",
                    "@nombre", nombre.Value, "@version", version, "@permiso", permiso, "@usuarioId", claimId == null ? (object)null : usuarioId))
                    return Convert.ToInt32(cmd.ExecuteScalar()) == 1;
            }
        }
    }

    // Abarca todos los endpoints que reciben un Bearer, incluidos los validadores históricos de cada módulo.
    public sealed class SesionesRecuperoHandler : DelegatingHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var ruta = request.RequestUri.AbsolutePath.TrimEnd('/');
            var publica = request.Method == HttpMethod.Options || ruta.EndsWith("/api/login", StringComparison.OrdinalIgnoreCase) ||
                ruta.IndexOf("/api/recupero-contrasena/", StringComparison.OrdinalIgnoreCase) >= 0;
            if (!publica && request.Headers.Authorization != null)
            {
                try
                {
                    if (!SesionesRecupero.Vigente(SesionesRecupero.Leer(request)))
                        return request.CreateResponse(HttpStatusCode.Unauthorized, new { error = "Tu sesión venció. Volvé a iniciar sesión." });
                }
                catch (SecurityTokenException)
                { return request.CreateResponse(HttpStatusCode.Unauthorized, new { error = "Tu sesión venció. Volvé a iniciar sesión." }); }
                catch (ArgumentException)
                { return request.CreateResponse(HttpStatusCode.Unauthorized, new { error = "Tu sesión venció. Volvé a iniciar sesión." }); }
                catch
                { return request.CreateResponse(HttpStatusCode.ServiceUnavailable, new { error = "No se pudo verificar la sesión. Probá de nuevo." }); }
            }
            return await base.SendAsync(request, cancellationToken);
        }
    }

    public sealed class AccesoUsuariosAttribute : AuthorizationFilterAttribute
    {
        private readonly string permiso;
        public AccesoUsuariosAttribute(bool gestionar) { permiso = gestionar ? "Gestion de usuarios" : "Listado de usuarios"; }
        public override void OnAuthorization(HttpActionContext actionContext)
        {
            try
            {
                var principal = SesionesRecupero.Leer(actionContext.Request);
                if (!SesionesRecupero.Vigente(principal, permiso))
                    actionContext.Response = actionContext.Request.CreateResponse(HttpStatusCode.Forbidden, new { error = "No tenés permiso para acceder a los usuarios." });
            }
            catch (SecurityTokenException)
            { actionContext.Response = actionContext.Request.CreateResponse(HttpStatusCode.Unauthorized, new { error = "Tu sesión venció. Volvé a iniciar sesión." }); }
            catch
            { actionContext.Response = actionContext.Request.CreateResponse(HttpStatusCode.ServiceUnavailable, new { error = "No se pudo verificar el acceso a los usuarios. Probá de nuevo." }); }
        }
    }
}
