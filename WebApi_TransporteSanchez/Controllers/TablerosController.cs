using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using WebApi_TransporteSanchez.Security;
namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/tableros")]
    public sealed class TablerosController : ApiController
    {
        private readonly string conexion = ConnectionStringHelper.GetConnectionString("SGTLEntities");
        private const int MaximoFavoritos = 60;
        private const int MaximoDiasPeriodo = 1100;
        private static readonly Regex FormatoTablero = new Regex(@"^[a-z0-9-]{1,40}$");
        private const string SqlUsuario = @"
SELECT TOP (2) Usuario_ID
FROM dbo.USUARIOS
WHERE Nombre_Usuario = @nombre AND EstadoUsuario = 'Activo';";
        private const string SqlEsChofer = @"
SELECT CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(Rol, N'')))) = N'chofer' THEN 1 ELSE 0 END
FROM dbo.USUARIOS
WHERE Usuario_ID = @usuario;";
        private const string SqlMenus = @"
SELECT DISTINCT LTRIM(RTRIM(m.Menu_Nombre))
FROM dbo.GRUPOS_USUARIOS gu
JOIN dbo.GRUPOS_MENU gm ON gm.GrupoID = gu.GrupoID
JOIN dbo.MENU m ON m.Menu_ID = gm.MenuID
WHERE gu.UsuarioID = @usuario;";
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
        private const string SqlFacturacion = @"
SELECT c.ClienteID,
       COALESCE(NULLIF(LTRIM(RTRIM(cl.Razon_Social)), N''), N'Sin nombre') AS Cliente,
       c.FechaEmision AS Fecha,
       CAST(SUM(CASE WHEN c.Impacto = 'C' THEN -c.Total ELSE c.Total END) AS decimal(18,2)) AS Total,
       COUNT(*) AS Comprobantes
FROM dbo.COMPROBANTES c
JOIN dbo.CLIENTES cl ON cl.Cliente_ID = c.ClienteID
WHERE c.Estado = 'EMITIDO'
  AND (c.Impacto = 'D' OR (c.Impacto = 'C' AND c.Tipo <> 'REC'))
  AND c.FechaEmision >= @desde AND c.FechaEmision < @hasta
GROUP BY c.ClienteID, cl.Razon_Social, c.FechaEmision
ORDER BY c.FechaEmision, c.ClienteID;";
        private const string SqlDeuda = @"
WITH Deudas AS (
    SELECT c.Comprobante_ID, c.ClienteID, c.FechaVencimiento,
           c.Total - COALESCE(SUM(CASE WHEN a.Vigente = 1 THEN a.Importe ELSE 0 END), 0) AS Pendiente
    FROM dbo.COMPROBANTES c
    JOIN dbo.CLIENTES cl ON cl.Cliente_ID = c.ClienteID AND cl.EstadoCliente = 1
    LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteDeudaID = c.Comprobante_ID
    WHERE c.Estado = 'EMITIDO' AND c.Impacto = 'D'
    GROUP BY c.Comprobante_ID, c.ClienteID, c.FechaVencimiento, c.Total
)
SELECT d.ClienteID,
       COALESCE(NULLIF(LTRIM(RTRIM(cl.Razon_Social)), N''), N'Sin nombre') AS Cliente,
       CAST(SUM(CASE WHEN d.FechaVencimiento < @hoy THEN d.Pendiente ELSE 0 END) AS decimal(18,2)) AS Vencida,
       CAST(SUM(CASE WHEN d.FechaVencimiento < @hoy THEN 0 ELSE d.Pendiente END) AS decimal(18,2)) AS PorVencer,
       SUM(CASE WHEN d.FechaVencimiento < @hoy THEN 1 ELSE 0 END) AS ComprobantesVencidos,
       MIN(CASE WHEN d.FechaVencimiento < @hoy THEN d.FechaVencimiento END) AS VencimientoMasViejo,
       CAST(SUM(CASE WHEN d.FechaVencimiento < @hoy AND DATEDIFF(day, d.FechaVencimiento, @hoy) <= 30 THEN d.Pendiente ELSE 0 END) AS decimal(18,2)) AS Vencida1a30,
       CAST(SUM(CASE WHEN DATEDIFF(day, d.FechaVencimiento, @hoy) BETWEEN 31 AND 60 THEN d.Pendiente ELSE 0 END) AS decimal(18,2)) AS Vencida31a60,
       CAST(SUM(CASE WHEN DATEDIFF(day, d.FechaVencimiento, @hoy) BETWEEN 61 AND 90 THEN d.Pendiente ELSE 0 END) AS decimal(18,2)) AS Vencida61a90,
       CAST(SUM(CASE WHEN DATEDIFF(day, d.FechaVencimiento, @hoy) > 90 THEN d.Pendiente ELSE 0 END) AS decimal(18,2)) AS VencidaMas90
FROM Deudas d
JOIN dbo.CLIENTES cl ON cl.Cliente_ID = d.ClienteID
WHERE d.Pendiente > 0
GROUP BY d.ClienteID, cl.Razon_Social
ORDER BY Vencida DESC, PorVencer DESC, Cliente;";
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
                var temas = await TemasDe(db, usuario, sesion.EsAdministrador, ct);
                int marcas = await db.Database.SqlQuery<int>(SqlPersonalizado,
                    new SqlParameter("@usuario", usuario)).SingleAsync(ct);
                var favoritos = await db.Database.SqlQuery<FavoritoTablero>(SqlFavoritos,
                    new SqlParameter("@usuario", usuario)).ToListAsync(ct);
                var visibles = favoritos.Where(f => temas.Contains(PermisosTableros.TemaDeTablero(f.Tablero))).ToList();
                return Ok(new { Personalizado = marcas > 0, TemasPermitidos = temas, Favoritos = visibles });
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
            {
                var ids = await db.Database.SqlQuery<int>(SqlUsuario,
                    new SqlParameter("@nombre", SqlDbType.NVarChar, 50) { Value = sesion.Nombre }).ToListAsync(ct);
                if (ids.Count != 1) return Unauthorized();
                int usuario = ids[0];
                var permitidos = new HashSet<string>(PermisosTableros.TablerosPara(
                    await TemasDe(db, usuario, sesion.EsAdministrador, ct)));
                if (lista.Any(f => !permitidos.Contains(f.Tablero.Trim())))
                    return Content(HttpStatusCode.Forbidden, new { mensaje = "No tenés permiso para guardar uno de los tableros." });
                using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    await db.Database.ExecuteSqlCommandAsync(SqlMarcarUsuario, ct,
                        new SqlParameter("@usuario", usuario),
                        new SqlParameter("@fecha", SqlDbType.DateTime) { Value = AhoraArgentina() });
                    await BorrarFavoritosPermitidos(db, usuario, permitidos, ct);
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
        [HttpGet, Route("facturacion")]
        public async Task<IHttpActionResult> GetFacturacion(CancellationToken ct, string fechaDesde = null, string fechaHasta = null)
        {
            DateTime desde, hasta;
            string error = LeerPeriodo(fechaDesde, fechaHasta, out desde, out hasta);
            if (error != null) return BadRequest(error);
            var sesion = await new AccesoEmail().AutenticarAsync(Request.Headers.Authorization, ct);
            if (sesion == null || string.IsNullOrWhiteSpace(sesion.Nombre)) return Unauthorized();
            using (var db = new SGTLAuditContext(conexion))
            {
                var ids = await db.Database.SqlQuery<int>(SqlUsuario,
                    new SqlParameter("@nombre", SqlDbType.NVarChar, 50) { Value = sesion.Nombre }).ToListAsync(ct);
                if (ids.Count != 1) return Unauthorized();
                if (!sesion.EsAdministrador && !await PuedeVerFacturacion(db, ids[0], ct))
                    return Content(HttpStatusCode.Forbidden, new { mensaje = "No tenés permiso para ver la facturación." });
                var filas = await db.Database.SqlQuery<FacturacionTablero>(SqlFacturacion,
                    new SqlParameter("@desde", SqlDbType.Date) { Value = desde.Date },
                    new SqlParameter("@hasta", SqlDbType.Date) { Value = hasta.Date.AddDays(1) }).ToListAsync(ct);
                return Ok(filas);
            }
        }
        [HttpGet, Route("deuda")]
        public async Task<IHttpActionResult> GetDeuda(CancellationToken ct)
        {
            var sesion = await new AccesoEmail().AutenticarAsync(Request.Headers.Authorization, ct);
            if (sesion == null || string.IsNullOrWhiteSpace(sesion.Nombre)) return Unauthorized();
            using (var db = new SGTLAuditContext(conexion))
            {
                var ids = await db.Database.SqlQuery<int>(SqlUsuario,
                    new SqlParameter("@nombre", SqlDbType.NVarChar, 50) { Value = sesion.Nombre }).ToListAsync(ct);
                if (ids.Count != 1) return Unauthorized();
                if (!sesion.EsAdministrador && !await PuedeVerFacturacion(db, ids[0], ct))
                    return Content(HttpStatusCode.Forbidden, new { mensaje = "No tenés permiso para ver la facturación." });
                var filas = await db.Database.SqlQuery<DeudaTablero>(SqlDeuda,
                    new SqlParameter("@hoy", SqlDbType.Date) { Value = AhoraArgentina().Date }).ToListAsync(ct);
                return Ok(filas);
            }
        }
        private static string LeerPeriodo(string fechaDesde, string fechaHasta, out DateTime desde, out DateTime hasta)
        {
            hasta = DateTime.MinValue;
            if (!LeerFecha(fechaDesde, out desde) || !LeerFecha(fechaHasta, out hasta))
                return "Elegí el período con fechas en formato AAAA-MM-DD.";
            if (hasta < desde) return "La fecha hasta tiene que ser posterior a la fecha desde.";
            if ((hasta - desde).TotalDays > MaximoDiasPeriodo) return "Elegí un período de hasta 3 años.";
            return null;
        }
        private static bool LeerFecha(string texto, out DateTime fecha)
        {
            fecha = DateTime.MinValue;
            if (string.IsNullOrWhiteSpace(texto)) return false;
            string solo = texto.Trim();
            if (solo.Length > 10) solo = solo.Substring(0, 10);
            return DateTime.TryParseExact(solo, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fecha);
        }
        private static async Task<string[]> TemasDe(SGTLAuditContext db, int usuario, bool esAdmin, CancellationToken ct)
        {
            if (esAdmin) return PermisosTableros.TemasPara(true, false, null);
            int chofer = await db.Database.SqlQuery<int>(SqlEsChofer, new SqlParameter("@usuario", usuario)).SingleAsync(ct);
            if (chofer == 1) return PermisosTableros.TemasPara(false, true, null);
            var menus = await db.Database.SqlQuery<string>(SqlMenus, new SqlParameter("@usuario", usuario)).ToListAsync(ct);
            return PermisosTableros.TemasPara(false, false, menus);
        }
        private static async Task BorrarFavoritosPermitidos(SGTLAuditContext db, int usuario, HashSet<string> permitidos, CancellationToken ct)
        {
            if (permitidos.Count == 0) return;
            var parametros = new List<SqlParameter> { new SqlParameter("@usuario", usuario) };
            var marcas = new List<string>();
            int i = 0;
            foreach (string clave in permitidos)
            {
                marcas.Add("@t" + i);
                parametros.Add(new SqlParameter("@t" + i, SqlDbType.VarChar, 40) { Value = clave });
                i++;
            }
            string sql = "DELETE FROM dbo.TABLEROS_FAVORITOS WHERE Usuario_ID = @usuario AND Tablero IN (" + string.Join(", ", marcas) + ");";
            await db.Database.ExecuteSqlCommandAsync(sql, ct, parametros.ToArray());
        }
        private static async Task<bool> PuedeVerFacturacion(SGTLAuditContext db, int usuario, CancellationToken ct)
        {
            var temas = await TemasDe(db, usuario, false, ct);
            return temas.Contains("facturacion");
        }
        private static string Validar(List<FavoritoTablero> lista)
        {
            if (lista.Count > MaximoFavoritos) return "Hay demasiados tableros. Sacá alguno y probá de nuevo.";
            var vistos = new HashSet<string>(StringComparer.Ordinal);
            foreach (var f in lista)
            {
                string clave = f == null || f.Tablero == null ? "" : f.Tablero.Trim();
                if (!FormatoTablero.IsMatch(clave)) return "Uno de los tableros no existe. Recargá la pantalla y probá de nuevo.";
                if (PermisosTableros.TemaDeTablero(clave) == null) return "Uno de los tableros no existe. Recargá la pantalla y probá de nuevo.";
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
    public sealed class FacturacionTablero
    {
        public int ClienteID { get; set; }
        public string Cliente { get; set; }
        public DateTime Fecha { get; set; }
        public decimal Total { get; set; }
        public int Comprobantes { get; set; }
    }
    public sealed class DeudaTablero
    {
        public int ClienteID { get; set; }
        public string Cliente { get; set; }
        public decimal Vencida { get; set; }
        public decimal PorVencer { get; set; }
        public int ComprobantesVencidos { get; set; }
        public DateTime? VencimientoMasViejo { get; set; }
        public decimal Vencida1a30 { get; set; }
        public decimal Vencida31a60 { get; set; }
        public decimal Vencida61a90 { get; set; }
        public decimal VencidaMas90 { get; set; }
    }
}