using System;
using System.Data;
using System.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;

namespace WebApi_TransporteSanchez.Controllers
{
    public sealed class AccesoEmail : IAccesoEmail
    {
        public async Task<UsuarioEmailAutenticado> AutenticarAsync(
            AuthenticationHeaderValue encabezado, CancellationToken ct)
        {
            if (encabezado == null ||
                !string.Equals(encabezado.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(encabezado.Parameter))
                return null;

            if (string.IsNullOrWhiteSpace(JwtConfig.SecretKey))
                throw new InvalidOperationException("Falta configurar JwtClave.");

            var parametros = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                RequireSignedTokens = true,
                ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },
                ValidateIssuer = true,
                ValidIssuer = JwtConfig.Issuer,
                ValidateAudience = true,
                ValidAudience = JwtConfig.Audience,
                ValidateLifetime = true,
                RequireExpirationTime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };

            string nombre;
            try
            {
                SecurityToken token;
                var validador = new JwtSecurityTokenHandler { MapInboundClaims = false };
                var identidad = validador.ValidateToken(encabezado.Parameter, parametros, out token);
                var claim = identidad.FindFirst(ClaimTypes.NameIdentifier) ?? identidad.FindFirst("nameid");
                nombre = claim == null ? null : claim.Value;
            }
            catch (SecurityTokenException)
            {
                return null;
            }
            catch (ArgumentException)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(nombre) || nombre.Length > 50) return null;

            const string sql = @"
SELECT TOP (2)
    Nombre_Usuario AS Nombre,
    CAST(CASE WHEN LOWER(LTRIM(RTRIM(Rol))) = 'admin' THEN 1 ELSE 0 END AS bit) AS EsAdministrador
FROM dbo.USUARIOS
WHERE Nombre_Usuario = @nombre AND EstadoUsuario = 'Activo';";

            using (var db = new SGTLAuditContext(ConnectionStringHelper.GetConnectionString("SGTLEntities")))
            {
                var usuarios = await db.Database.SqlQuery<UsuarioEmailAutenticado>(
                    sql, new SqlParameter("@nombre", SqlDbType.NVarChar, 50) { Value = nombre })
                    .ToListAsync(ct);
                return usuarios.Count == 1 ? usuarios[0] : null;
            }
        }
    }
}