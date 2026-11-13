using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/tableros")]
    public sealed class TablerosController : ApiController
    {
        private readonly string conexion = ConnectionStringHelper.GetConnectionString("SGTLEntities");
        private const int MaximoFavoritos = 60;
        private static readonly Regex FormatoTablero = new Regex(@"^[a-z0-9-]{1,40}$");
        private const string SqlUsuario = @"
SELECT TOP (2) Usuario_ID
FROM dbo.USUARIOS
WHERE Nombre_Usuario = @nombre AND EstadoUsuario = 'Activo';";
        private const string SqlPersonalizado = @"
SELECT COUNT(*) FROM dbo.TABLEROS_USUARIO WHERE Usuario_ID = @usuario;";
        private const string SqlFavoritos = @"
SELECT Tablero,
       CAST(Pos_X AS int) AS X, CAST(Pos_Y AS int) AS Y,
       CAST(Ancho AS int) AS Ancho, CAST(Alto AS int) AS Alto
FROM dbo.TABLEROS_FAVORITOS
WHERE Usuario_ID = @usuario
ORDER BY Orden, Tablero;";
        private const string SqlMarcarUsuario = @"
UPDATE dbo.TABLEROS_USUARIO SET Fecha_Modi = @fecha WHERE Usuario_ID = @usuario;
IF @@ROWCOUNT = 0
    INSERT INTO dbo.TABLEROS_USUARIO (Usuario_ID, Fecha_Modi) VALUES (@usuario, @fecha);";
        private const string SqlBorrarFavoritos = @"
DELETE FROM dbo.TABLEROS_FAVORITOS WHERE Usuario_ID = @usuario;";
        private const string SqlInsertarFavorito = @"
INSERT INTO dbo.TABLEROS_FAVORITOS (Usuario_ID, Tablero, Orden, Pos_X, Pos_Y, Ancho, Alto)
VALUES (@usuario, @tablero, @orden, @x, @y, @ancho, @alto);";
        private const string SqlBorrarUsuario = @"
DELETE FROM dbo.TABLEROS_USUARIO WHERE Usuario_ID = @usuario;";
        [HttpGet, Route("favoritos")]
        public async Task<IHttpActionResult> GetFavoritos(CancellationToken ct)
        {
            var sesion = await new AccesoEmail().AutenticarAsync(Request.Headers.Authorization, ct);
            if (sesion == null || string.IsNullOrWhiteSpace(sesion.Nombre)) return Unauthorized();
            using (var db = new SGTLAuditContext(conexion))
            {
                var ids = await db.Database.SqlQuery<int>(SqlUsuario,
                    new SqlParameter("@nombre", SqlDbType.NVarChar, 50) { Value = sesion.Nombre }).ToListAsync(ct);
                if (ids.Count != 1) return Unauthorized();
                int usuario = ids[0];
                int marcas = await db.Database.SqlQuery<int>(SqlPersonalizado,
                    new SqlParameter("@usuario", usuario)).SingleAsync(ct);
                var favoritos = await db.Database.SqlQuery<FavoritoTablero>(SqlFavoritos,
                    new SqlParameter("@usuario", usuario)).ToListAsync(ct);
                return Ok(new { Personalizado = marcas > 0, Favoritos = favoritos });
            }
        }
        [HttpPut, Route("favoritos")]
        public async Task<IHttpActionResult> PutFavoritos([FromBody] FavoritosEntrada datos, CancellationToken ct)
        {
            var lista = datos == null || datos.Favoritos == null ? new List<FavoritoTablero>() : datos.Favoritos;
            string error = Validar(lista);
            if (error != null) return BadRequest(error);
            var sesion = await new AccesoEmail().AutenticarAsync(Request.Headers.Authorization, ct);
            if (sesion == null || string.IsNullOrWhiteSpace(sesion.Nombre)) return Unauthorized();
            using (var db = new SGTLAuditContext(conexion))
            using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
            {
                var ids = await db.Database.SqlQuery<int>(SqlUsuario,
                    new SqlParameter("@nombre", SqlDbType.NVarChar, 50) { Value = sesion.Nombre }).ToListAsync(ct);
                if (ids.Count != 1) return Unauthorized();
                int usuario = ids[0];
                await db.Database.ExecuteSqlCommandAsync(SqlMarcarUsuario, ct,
                    new SqlParameter("@usuario", usuario),
                    new SqlParameter("@fecha", SqlDbType.DateTime) { Value = AhoraArgentina() });
                await db.Database.ExecuteSqlCommandAsync(SqlBorrarFavoritos, ct,
                    new SqlParameter("@usuario", usuario));
                for (int i = 0; i < lista.Count; i++)
                {
                    var f = lista[i];
                    bool conLugar = f.X.HasValue && f.Y.HasValue && f.Ancho.HasValue && f.Alto.HasValue;
                    await db.Database.ExecuteSqlCommandAsync(SqlInsertarFavorito, ct,
                        new SqlParameter("@usuario", usuario),
                        new SqlParameter("@tablero", SqlDbType.VarChar, 40) { Value = f.Tablero.Trim() },
                        new SqlParameter("@orden", SqlDbType.SmallInt) { Value = i },
                        new SqlParameter("@x", SqlDbType.TinyInt) { Value = conLugar ? (object)f.X.Value : DBNull.Value },
                        new SqlParameter("@y", SqlDbType.SmallInt) { Value = conLugar ? (object)f.Y.Value : DBNull.Value },
                        new SqlParameter("@ancho", SqlDbType.TinyInt) { Value = conLugar ? (object)f.Ancho.Value : DBNull.Value },
                        new SqlParameter("@alto", SqlDbType.TinyInt) { Value = conLugar ? (object)f.Alto.Value : DBNull.Value });
                }
                tx.Commit();
                return Ok(new { Personalizado = true, Cantidad = lista.Count });
            }
        }
        [HttpDelete, Route("favoritos")]
        public async Task<IHttpActionResult> DeleteFavoritos(CancellationToken ct)
        {
            var sesion = await new AccesoEmail().AutenticarAsync(Request.Headers.Authorization, ct);
            if (sesion == null || string.IsNullOrWhiteSpace(sesion.Nombre)) return Unauthorized();
            using (var db = new SGTLAuditContext(conexion))
            {
                var ids = await db.Database.SqlQuery<int>(SqlUsuario,
                    new SqlParameter("@nombre", SqlDbType.NVarChar, 50) { Value = sesion.Nombre }).ToListAsync(ct);
                if (ids.Count != 1) return Unauthorized();
                int usuario = ids[0];
                await db.Database.ExecuteSqlCommandAsync(SqlBorrarFavoritos, ct, new SqlParameter("@usuario", usuario));
                await db.Database.ExecuteSqlCommandAsync(SqlBorrarUsuario, ct, new SqlParameter("@usuario", usuario));
                return Ok(new { Personalizado = false });
            }
        }
        private static string Validar(List<FavoritoTablero> lista)
        {
            if (lista.Count > MaximoFavoritos) return "Hay demasiados tableros. Sacá alguno y probá de nuevo.";
            var vistos = new HashSet<string>(StringComparer.Ordinal);
            foreach (var f in lista)
            {
                string clave = f == null || f.Tablero == null ? "" : f.Tablero.Trim();
                if (!FormatoTablero.IsMatch(clave)) return "Uno de los tableros no existe. Recargá la pantalla y probá de nuevo.";
                if (!vistos.Add(clave)) return "Un tablero está repetido. Recargá la pantalla y probá de nuevo.";
                if (!f.X.HasValue && !f.Y.HasValue && !f.Ancho.HasValue && !f.Alto.HasValue) continue;
                if (!(f.X.HasValue && f.Y.HasValue && f.Ancho.HasValue && f.Alto.HasValue))
                    return "El lugar de un tablero no es válido. Restablecé el dashboard y probá de nuevo.";
                if (f.X < 0 || f.X > 11 || f.Ancho < 1 || f.Ancho > 12 - f.X || f.Y < 0 || f.Alto < 1 || f.Alto > 255)
                    return "El lugar de un tablero no es válido. Restablecé el dashboard y probá de nuevo.";
            }
            return null;
        }
        private static DateTime AhoraArgentina()
        {
            try
            {
                var zona = TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zona);
            }
            catch (TimeZoneNotFoundException)
            {
                return DateTime.UtcNow.AddHours(-3);
            }
        }
    }
    public sealed class FavoritoTablero
    {
        public string Tablero { get; set; }
        public int? X { get; set; }
        public int? Y { get; set; }
        public int? Ancho { get; set; }
        public int? Alto { get; set; }
    }
    public sealed class FavoritosEntrada
    {
        public List<FavoritoTablero> Favoritos { get; set; }
    }
}