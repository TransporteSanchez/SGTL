using System;
using System.Data;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using Microsoft.IdentityModel.Tokens;

namespace WebApi_TransporteSanchez.Security
{
    public static class SesionSegura
    {
        private const string ClaveRequest = "SGTL.UsuarioAutenticado";
        private const string IdClaim = "sgtl_usuario_id";
        private const string VersionClaim = "sgtl_version";

        public static string Emitir(UsuarioAcceso usuario)
        {
            var clave = ClaveFirma();
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Nombre_Usuario),
                new Claim(ClaimTypes.Name, usuario.Nombre ?? ""),
                new Claim(ClaimTypes.Surname, usuario.Apellido ?? ""),
                new Claim(ClaimTypes.Role, usuario.Rol ?? ""),
                new Claim(IdClaim, usuario.Usuario_ID.ToString(CultureInfo.InvariantCulture)),
                new Claim(VersionClaim, usuario.VersionSesion.ToString(CultureInfo.InvariantCulture))
            };

            var token = new JwtSecurityToken(
                JwtConfig.Issuer, JwtConfig.Audience, claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(JwtConfig.ExpirationMinutes),
                signingCredentials: new SigningCredentials(clave, SecurityAlgorithms.HmacSha256));

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static SymmetricSecurityKey ClaveFirma()
        {
            if (string.IsNullOrWhiteSpace(JwtConfig.SecretKey) ||
                Encoding.UTF8.GetByteCount(JwtConfig.SecretKey) < 32)
            {
                throw new InvalidOperationException("Revisá la configuración externa de JwtClave.");
            }

            return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey));
        }

        internal static async Task<UsuarioAcceso> VerificarAsync(HttpRequestMessage request, CancellationToken ct)
        {
            var encabezado = request.Headers.Authorization;
            if (encabezado == null ||
                !string.Equals(encabezado.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(encabezado.Parameter))
            { return null; }

            ClaimsPrincipal identidad;
            try
            {
                SecurityToken token;
                var validador = new JwtSecurityTokenHandler { MapInboundClaims = false };
                identidad = validador.ValidateToken(encabezado.Parameter, new TokenValidationParameters
                {
                    IssuerSigningKey = ClaveFirma(),
                    ValidateIssuerSigningKey = true,
                    RequireSignedTokens = true,
                    ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },
                    ValidateIssuer = true,
                    ValidIssuer = JwtConfig.Issuer,
                    ValidateAudience = true,
                    ValidAudience = JwtConfig.Audience,
                    ValidateLifetime = true,
                    RequireExpirationTime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                }, out token);
            }
            catch (SecurityTokenException) { return null; }
            catch (ArgumentException) { return null; }

            var idClaim = identidad.FindFirst(IdClaim);
            var versionClaim = identidad.FindFirst(VersionClaim);
            var nombreClaim = identidad.FindFirst(ClaimTypes.NameIdentifier) ?? identidad.FindFirst("nameid");
            int id;
            long version;

            if (idClaim == null || versionClaim == null || nombreClaim == null ||
                !int.TryParse(idClaim.Value, NumberStyles.None, CultureInfo.InvariantCulture, out id) || id < 1 ||
                !long.TryParse(versionClaim.Value, NumberStyles.None, CultureInfo.InvariantCulture, out version) ||
                version < 0 || nombreClaim.Value.Length > 50)
            { return null; }

            using (var db = SeguridadSql.Abrir())
            {
                return await db.Database.SqlQuery<UsuarioAcceso>(
                @"SELECT Usuario_ID, Nombre_Usuario, Nombre, Apellido, COALESCE(Rol, '') AS Rol, EstadoUsuario, VersionSesion, CAST(NULL AS nvarchar(255)) AS Clave, CAST(NULL AS nvarchar(254)) AS Email
                FROM dbo.USUARIOS
                WHERE Usuario_ID = @id
                AND VersionSesion = @version
                AND Nombre_Usuario = @nombre
                AND EstadoUsuario = 'Activo';",
                    SeguridadSql.P("@id", SqlDbType.Int, id),
                    SeguridadSql.P("@version", SqlDbType.BigInt, version),
                    SeguridadSql.P("@nombre", SqlDbType.NVarChar, nombreClaim.Value, 50)).SingleOrDefaultAsync(ct);
            }
        }

        public static UsuarioAcceso Usuario(HttpRequestMessage request)
        {
            object usuario;
            return request.Properties.TryGetValue(ClaveRequest, out usuario) ? usuario as UsuarioAcceso : null;
        }

        internal static void Establecer(HttpActionContext contexto, UsuarioAcceso usuario)
        {
            contexto.Request.Properties[ClaveRequest] = usuario;
            var identidad = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, usuario.Nombre_Usuario),
                new Claim(ClaimTypes.NameIdentifier, usuario.Nombre_Usuario),
                new Claim(ClaimTypes.Role, usuario.Rol.Trim().ToLowerInvariant())
            }, "Bearer");

            var principal = new ClaimsPrincipal(identidad);
            contexto.RequestContext.Principal = principal;
            Thread.CurrentPrincipal = principal;
            if (HttpContext.Current != null) { HttpContext.Current.User = principal; }
        }
    }

    public sealed class FiltroSesionSegura : AuthorizationFilterAttribute
    {
        public override async Task OnAuthorizationAsync(HttpActionContext contexto, CancellationToken ct)
        {
            if (contexto.Request.Method == HttpMethod.Options ||
                contexto.ActionDescriptor.GetCustomAttributes<AllowAnonymousAttribute>().Any() ||
                contexto.ControllerContext.ControllerDescriptor.GetCustomAttributes<AllowAnonymousAttribute>().Any())
            { return; }

            try
            {
                var usuario = await SesionSegura.VerificarAsync(contexto.Request, ct);
                if (usuario == null)
                {
                    contexto.Response = contexto.Request.CreateResponse(HttpStatusCode.Unauthorized,
                        new { error = "Tu sesión venció. Volvé a iniciar sesión." });
                }
                else
                { SesionSegura.Establecer(contexto, usuario); }
            }
            catch (OperationCanceledException) { throw; }
            catch
            {
                contexto.Response = contexto.Request.CreateResponse(HttpStatusCode.ServiceUnavailable,
                    new { error = "No se pudo verificar la sesión. Probá de nuevo." });
            }
        }
    }

    public sealed class AccesoUsuariosSeguroAttribute : AuthorizationFilterAttribute
    {
        private readonly bool modificar;
        public AccesoUsuariosSeguroAttribute(bool modificar) { this.modificar = modificar; }

        public override async Task OnAuthorizationAsync(HttpActionContext contexto, CancellationToken ct)
        {
            var usuario = SesionSegura.Usuario(contexto.Request);
            if (usuario == null)
            {
                contexto.Response = contexto.Request.CreateResponse(HttpStatusCode.Unauthorized);
                return;
            }
            if (string.Equals(usuario.Rol.Trim(), "admin", StringComparison.OrdinalIgnoreCase))
            { return; }

            try
            {
                using (var db = SeguridadSql.Abrir())
                {
                    bool permitido = await db.Database.SqlQuery<bool>(
                    @"SELECT CAST(CASE WHEN EXISTS (SELECT 1
                    FROM dbo.GRUPOS_USUARIOS gu
                    JOIN dbo.GRUPOS_MENU gm ON gm.GrupoID = gu.GrupoID
                    JOIN dbo.MENU m ON m.Menu_ID = gm.MenuID
                    WHERE gu.UsuarioID = @id
                    AND (m.Menu_Nombre COLLATE Latin1_General_CI_AI = 'Gestion de usuarios'
                    OR (@lectura = 1
                    AND m.Menu_Nombre COLLATE Latin1_General_CI_AI = 'Listado de usuarios')))
                    THEN 1
                    ELSE 0
                    END AS bit);",
                        SeguridadSql.P("@id", SqlDbType.Int, usuario.Usuario_ID),
                        SeguridadSql.P("@lectura", SqlDbType.Bit, !modificar)).SingleAsync(ct);

                    if (!permitido)
                    {
                        contexto.Response = contexto.Request.CreateResponse(HttpStatusCode.Forbidden,
                            new { error = "No tenés permiso para acceder a esta operación de usuarios." });
                    }
                }
            }
            catch (OperationCanceledException) { throw; }
            catch
            {
                contexto.Response = contexto.Request.CreateResponse(HttpStatusCode.ServiceUnavailable,
                    new { error = "No se pudieron verificar tus permisos." });
            }
        }
    }
}