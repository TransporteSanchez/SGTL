using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Web.Http;
using Microsoft.IdentityModel.Tokens;
using WebApi_TransporteSanchez.Services.WhatsApp;

namespace WebApi_TransporteSanchez.Controllers
{
    // Control interno de los viajes (24/10, pedido de Rocío): el recorrido completo (galpón → origen → destino → galpón),
    // el kilometraje de los camiones, el combustible estimado y los gastos que rinde el chofer.
    // Tablas de database/costos/01_galpon_kilometraje_y_gastos.sql (fuera del EDMX): SQL directo.
    // Los km al galpón de cada origen y destino los calcula el navegador con Google Maps (la clave de Google es del
    // navegador) y los guarda acá; si cambia el galpón se borran para volver a calcularse.
    // Todo pide el token. Ver los costos de un viaje: administradores o permiso de viajes; el kilometraje de un camión:
    // administradores o permiso de camiones; cambiar el galpón: administradores (Gestionar empresa); el gasoil y el
    // kilometraje: administradores o "Gestión de camiones". Los gastos del chofer se cargan en HojaDeRutaController; como
    // excepción, administración (quien gestiona viajes) los carga acá con el viaje entregado o listo para facturar
    // (Viajes/GastosDelViaje.cs).
    [RoutePrefix("api/Costos")]
    public class CostosController : ApiController
    {
        private static readonly string[] TiposComprobante = { "image/jpeg", "image/png", "image/webp", "application/pdf" };

        private class AccesoDenegadoException : Exception
        {
            public AccesoDenegadoException(string mensaje) : base(mensaje) { }
        }

        private class Sesion
        {
            public string Nombre_Usuario;
            public bool EsAdmin;
            public HashSet<string> Menus;

            public bool Tiene(params string[] menus)
            {
                return EsAdmin || menus.Any(m => Menus.Contains(m));
            }
        }

        private class UsuarioRow
        {
            public int Usuario_ID { get; set; }
            public string Nombre_Usuario { get; set; }
            public bool EsAdmin { get; set; }
        }

        internal class GalponRow
        {
            public int Galpon_ID { get; set; }
            public DateTime? Vigente_Desde { get; set; }  // vacío: desde el principio
            public int ProvID { get; set; }
            public int LocID { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
            public string Provincia { get; set; }
            public string Localidad { get; set; }
            public DateTime Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }
        }

        private class LugarRow
        {
            public string Tipo { get; set; }
            public int ID { get; set; }
            public string Nombre { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
            public string Localidad { get; set; }
            public string Provincia { get; set; }
        }

        private class PrecioRow
        {
            public int Precio_ID { get; set; }
            public DateTime Vigente_Desde { get; set; }
            public decimal Precio_Litro { get; set; }
            public DateTime Fecha_Alta { get; set; }
            public string Usu_Alta { get; set; }
        }

        private class KilometrajeRow
        {
            public int Camion_ID { get; set; }
            public string Dominio { get; set; }
            public int? Km_Inicial { get; set; }
            public DateTime? Fecha_Km_Inicial { get; set; }
            public decimal? Consumo_L_100km { get; set; }
            public int Viajes { get; set; }
            public int Viajes_Sin_Km { get; set; }
            public decimal Km_Recorridos { get; set; }
        }

        private class CostoViajeRow
        {
            public int Viaje_ID { get; set; }
            public DateTime Fecha_Inicio { get; set; }
            public string Camion { get; set; }
            public decimal? Consumo_L_100km { get; set; }
            public int OrigenID { get; set; }
            public string Origen { get; set; }
            public decimal? Km_Ida { get; set; }
            public decimal? Km_Ruta { get; set; }
            public int DestinoID { get; set; }
            public string Destino { get; set; }
            public decimal? Km_Vuelta { get; set; }
            public decimal? Precio_Litro { get; set; }
            public DateTime? Precio_Desde { get; set; }
            public decimal? Importe { get; set; }
            public string Estado { get; set; }
            public int? GalponID { get; set; }
        }

        public class GastoRow
        {
            public int Gasto_ID { get; set; }
            public string Tipo { get; set; }
            public DateTime Fecha { get; set; }
            public decimal Importe { get; set; }
            public decimal? Litros { get; set; }
            public string Detalle { get; set; }
            public string Nombre_Archivo { get; set; }
            public string Usu_Alta { get; set; }
        }

        private class ArchivoRow
        {
            public string Nombre_Archivo { get; set; }
            public string Content_Type { get; set; }
            public byte[] Archivo { get; set; }
        }

        public class GalponDto
        {
            public int? ProvID { get; set; }
            public int? LocID { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
        }

        // Cambiar el galpón: el nuevo, desde cuándo, y los viajes que no salieron que salen de otro galpón que el de su fecha.
        public class CambioGalponDto : GalponDto
        {
            public DateTime? Vigente_Desde { get; set; }
            public List<int> Del_Nuevo { get; set; }      // de antes de la fecha, pero salen del nuevo
            public List<int> Del_Actual { get; set; }     // desde la fecha, pero salen del actual
        }

        public class KmGalponDto
        {
            public string Tipo { get; set; }
            public int ID { get; set; }
            public decimal? Km { get; set; }
            public int? GalponID { get; set; }            // vacío: el galpón vigente hoy
        }

        private class ViajePorSalirRow
        {
            public int Viaje_ID { get; set; }
            public DateTime Fecha_Inicio { get; set; }
            public string Cliente { get; set; }
            public string Tipo_Cliente { get; set; }
            public string Origen { get; set; }
            public string Destino { get; set; }
        }

        private class CantidadRow
        {
            public int Galpon_ID { get; set; }
            public int Viajes { get; set; }
        }

        public class PrecioGasoilDto
        {
            public decimal? Precio_Litro { get; set; }
            public DateTime? Vigente_Desde { get; set; }
        }

        public class KilometrajeDto
        {
            public int? Camion_ID { get; set; }
            public string Dominio { get; set; }
            public int? Km_Inicial { get; set; }
            public DateTime? Fecha_Km_Inicial { get; set; }
            public decimal? Consumo_L_100km { get; set; }
        }

        private static string Cn() { return ConnectionStringHelper.GetConnectionString("SGTLEntities"); }
        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }

        // Hoy en la Argentina (la base está en UTC: §2 de PENDIENTES-SISTEMA.md).
        private const string SQL_HOY = "CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS date)";

        // Km del viaje como texto ("402.3" o "402,3"), igual que ViajesController.ResumenCosto.
        private const string SQL_KM_RUTA = "TRY_CAST(REPLACE(RTRIM(v.Distancia_KM), ',', '.') AS decimal(10, 1))";

        // Viajes que ya hizo el camión (los que cuentan para su kilometraje).
        private const string SQL_ENTREGADO = "v.Estado IN ('Entregado', 'Listo_para_facturar', 'Facturado')";

        // El galpón de cada viaje (Rocío, 27/10, punto 28 de la §41; database/costos/02): el elegido al cambiar el galpón
        // (v.GalponID) o, si no, el vigente el día de su inicio. Deja gv.Galpon_ID; va después de "FROM dbo.VIAJES v".
        internal const string SQL_GALPON_DEL_VIAJE =
            "OUTER APPLY (SELECT TOP (1) gx.Galpon_ID FROM dbo.GALPON gx " +
            "WHERE gx.Galpon_ID = v.GalponID OR (v.GalponID IS NULL AND (gx.Vigente_Desde IS NULL OR gx.Vigente_Desde <= CAST(v.Fecha_Inicio AS date))) " +
            "ORDER BY CASE WHEN gx.Galpon_ID = v.GalponID THEN 0 ELSE 1 END, ISNULL(gx.Vigente_Desde, '19000101') DESC, gx.Galpon_ID DESC) gv ";

        // Los km al galpón del viaje, los de su galpón: ki (galpón → origen) y kv (destino → galpón).
        internal const string SQL_KM_GALPON_DEL_VIAJE =
            "LEFT JOIN dbo.GALPON_KM ki ON ki.Galpon_ID = gv.Galpon_ID AND ki.Tipo = 'Origen' AND ki.Lugar_ID = v.OrigenID " +
            "LEFT JOIN dbo.GALPON_KM kv ON kv.Galpon_ID = gv.Galpon_ID AND kv.Tipo = 'Destino' AND kv.Lugar_ID = v.DestinoID ";

        // Un viaje que todavía no salió: directo en Registrado (aunque haya quedado sin iniciar) o de plataforma en
        // Registrado desde hoy (esos no pasan por En viaje).
        private const string SQL_NO_SALIO =
            "ISNULL(v.Estado, 'Registrado') = 'Registrado' AND (ISNULL(c.Tipo_Cliente, 'Directo') <> 'Con_plataforma' " +
            "OR CAST(v.Fecha_Inicio AS date) >= " + SQL_HOY + ")";

        // ---------------------------------------------------------------- Sesión y errores

        private static string Normalizar(string texto)
        {
            return string.Concat((texto ?? "").Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD)
                .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark));
        }

        // Usuario del token (Authorization: Bearer …), activo, con sus permisos. Mismo criterio que EmpresaController.
        private Sesion ValidarSesion(SGTLAuditContext db)
        {
            var auth = Request == null ? null : Request.Headers.Authorization;
            if (auth == null || !string.Equals(auth.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(auth.Parameter))
                throw new UnauthorizedAccessException();
            string nombre;
            try
            {
                SecurityToken token;
                var principal = new JwtSecurityTokenHandler().ValidateToken(auth.Parameter, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                    ValidateIssuer = true, ValidIssuer = JwtConfig.Issuer, ValidateAudience = true, ValidAudience = JwtConfig.Audience,
                    ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1)
                }, out token);
                var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
                nombre = claim == null ? null : claim.Value;
            }
            catch { throw new UnauthorizedAccessException(); }
            if (string.IsNullOrWhiteSpace(nombre)) throw new UnauthorizedAccessException();

            var usuario = db.Database.SqlQuery<UsuarioRow>(
                "SELECT TOP (1) Usuario_ID, Nombre_Usuario, " +
                "CAST(CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(Rol,'')))) = 'admin' THEN 1 ELSE 0 END AS bit) AS EsAdmin " +
                "FROM dbo.USUARIOS WHERE Nombre_Usuario = @nombre AND EstadoUsuario = 'Activo'", P("@nombre", nombre)).FirstOrDefault();
            if (usuario == null) throw new UnauthorizedAccessException();

            var menus = db.Database.SqlQuery<string>(
                "SELECT DISTINCT m.Menu_Nombre FROM dbo.GRUPOS_USUARIOS gu JOIN dbo.GRUPOS_MENU gm ON gm.GrupoID = gu.GrupoID " +
                "JOIN dbo.MENU m ON m.Menu_ID = gm.MenuID WHERE gu.UsuarioID = @id", P("@id", usuario.Usuario_ID)).ToList();
            return new Sesion
            {
                Nombre_Usuario = usuario.Nombre_Usuario,
                EsAdmin = usuario.EsAdmin,
                Menus = new HashSet<string>(menus.Select(Normalizar))
            };
        }

        private static void Exigir(bool permitido, string mensaje)
        {
            if (!permitido) throw new AccesoDenegadoException(mensaje);
        }

        private IHttpActionResult Error(Exception ex, string porDefecto)
        {
            if (ex is UnauthorizedAccessException)
                return Content(HttpStatusCode.Unauthorized, new { message = "Tu sesión venció. Volvé a iniciar sesión." });
            if (ex is AccesoDenegadoException)
                return Content(HttpStatusCode.Forbidden, new { message = ex.Message });
            var sql = ex as SqlException ?? ex.InnerException as SqlException ?? (ex.InnerException == null ? null : ex.InnerException.InnerException as SqlException);
            // 207 / 208: falta una columna o una tabla (no se corrió el script de la base).
            if (sql != null && (sql.Number == 207 || sql.Number == 208))
                return Content(HttpStatusCode.Conflict, new { message = "El control de costos todavía no está habilitado en la base. Avisale al administrador." });
            return Content(HttpStatusCode.InternalServerError, new { message = porDefecto });
        }

        private IHttpActionResult Rechazo(string mensaje)
        {
            return Content(HttpStatusCode.BadRequest, new { message = mensaje });
        }

        private static string Recortar(string s, int max)
        {
            s = (s ?? "").Trim();
            return s.Length > max ? s.Substring(0, max) : s;
        }

        // ---------------------------------------------------------------- Galpón (Gestionar empresa)

        // Con el script 02 corrido: galpones por fecha (GALPON.Vigente_Desde, VIAJES.GalponID) y km por galpón (GALPON_KM).
        internal static bool HayGalponesPorFecha(SGTLAuditContext db)
        {
            return db.Database.SqlQuery<int>("SELECT CASE WHEN COL_LENGTH('dbo.GALPON', 'Vigente_Desde') IS NULL " +
                "OR COL_LENGTH('dbo.VIAJES', 'GalponID') IS NULL OR OBJECT_ID(N'dbo.GALPON_KM', N'U') IS NULL THEN 0 ELSE 1 END").First() == 1;
        }

        private const string SQL_GALPON_SELECT =
            "SELECT {TOP} g.Galpon_ID, {DESDE} AS Vigente_Desde, g.ProvID, g.LocID, g.Calle, ISNULL(g.AlturaCalle,'') AS AlturaCalle, " +
            "ISNULL(p.Nombre_Provincia,'') AS Provincia, ISNULL(l.Nombre_Localidad,'') AS Localidad, g.Fecha_Modi, g.Usu_Modi " +
            "FROM dbo.GALPON g LEFT JOIN dbo.PROVINCIAS p ON p.Prov_ID = g.ProvID LEFT JOIN dbo.LOCALIDADES l ON l.Loc_ID = g.LocID ";

        // El galpón vigente hoy (null si todavía no se cargó ninguno). Sin el script 02, el único que hay.
        internal static GalponRow LeerGalpon(SGTLAuditContext db)
        {
            if (!HayGalponesPorFecha(db))
                return db.Database.SqlQuery<GalponRow>(SQL_GALPON_SELECT.Replace("{TOP}", "TOP (1)").Replace("{DESDE}", "CAST(NULL AS date)") +
                    "ORDER BY g.Galpon_ID").FirstOrDefault();
            return db.Database.SqlQuery<GalponRow>(SQL_GALPON_SELECT.Replace("{TOP}", "TOP (1)").Replace("{DESDE}", "g.Vigente_Desde") +
                "WHERE g.Vigente_Desde IS NULL OR g.Vigente_Desde <= " + SQL_HOY + " " +
                "ORDER BY ISNULL(g.Vigente_Desde, '19000101') DESC, g.Galpon_ID DESC").FirstOrDefault();
        }

        // Todos los galpones, del más nuevo al más viejo.
        internal static List<GalponRow> LeerGalpones(SGTLAuditContext db)
        {
            return db.Database.SqlQuery<GalponRow>(SQL_GALPON_SELECT.Replace("{TOP}", "").Replace("{DESDE}", "g.Vigente_Desde") +
                "ORDER BY ISNULL(g.Vigente_Desde, '19000101') DESC, g.Galpon_ID DESC").ToList();
        }

        internal static string DireccionGalpon(GalponRow g)
        {
            return g == null ? null : GoogleMapsLinkBuilder.BuildAddress(g.Calle, g.AlturaCalle, g.Localidad, g.Provincia);
        }

        // Para nombrarlo en pantalla: "Av. Circunvalación 1500".
        internal static string CalleGalpon(GalponRow g)
        {
            return g == null ? null : ((g.Calle ?? "").Trim() + " " + (g.AlturaCalle ?? "").Trim()).Trim();
        }

        private static object GalponDe(GalponRow g)
        {
            if (g == null) return new { Configurado = false };
            return new
            {
                Configurado = true,
                g.Galpon_ID, g.Vigente_Desde, g.ProvID, g.LocID, g.Calle, g.AlturaCalle, g.Provincia, g.Localidad,
                Direccion = DireccionGalpon(g),
                g.Fecha_Modi, g.Usu_Modi
            };
        }

        private static DateTime Hoy(SGTLAuditContext db)
        {
            return db.Database.SqlQuery<DateTime>("SELECT CAST(" + SQL_HOY + " AS datetime)").First();
        }

        // GET api/Costos/Galpon — el vigente hoy y, con el script 02, todos (con cuántos viajes salen de cada uno) y si se
        // puede cambiar (no, si ya hay uno nuevo que todavía no empezó).
        [HttpGet, Route("Galpon")]
        public IHttpActionResult Galpon()
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    ValidarSesion(db);
                    var actual = LeerGalpon(db);
                    if (actual == null || !HayGalponesPorFecha(db)) return Ok(new { Galpon = GalponDe(actual), Galpones = new object[0], Motivo_Cambiar = "" });
                    var hoy = Hoy(db);
                    var cantidades = db.Database.SqlQuery<CantidadRow>(
                        "SELECT gv.Galpon_ID, COUNT(*) AS Viajes FROM dbo.VIAJES v " + SQL_GALPON_DEL_VIAJE +
                        "WHERE gv.Galpon_ID IS NOT NULL GROUP BY gv.Galpon_ID").ToDictionary(c => c.Galpon_ID, c => c.Viajes);
                    var todos = LeerGalpones(db);
                    var futuro = todos.FirstOrDefault(g => g.Vigente_Desde.HasValue && g.Vigente_Desde.Value.Date > hoy.Date);
                    var galpones = todos.Select((g, i) => new
                    {
                        g.Galpon_ID, g.Vigente_Desde, Direccion = DireccionGalpon(g), Calle = CalleGalpon(g),
                        // Hasta el día anterior al que empezó el siguiente (el de la lista de arriba).
                        Hasta = i > 0 && todos[i - 1].Vigente_Desde.HasValue ? todos[i - 1].Vigente_Desde.Value.AddDays(-1) : (DateTime?)null,
                        Actual = g.Galpon_ID == actual.Galpon_ID,
                        Futuro = futuro != null && g.Galpon_ID == futuro.Galpon_ID,
                        Viajes = cantidades.ContainsKey(g.Galpon_ID) ? cantidades[g.Galpon_ID] : 0
                    }).ToList();
                    return Ok(new
                    {
                        Galpon = GalponDe(actual),
                        Galpones = galpones,
                        Motivo_Cambiar = futuro == null ? "" : "No se puede cambiar el galpón: ya hay uno nuevo desde el " + futuro.Vigente_Desde.Value.ToString("dd/MM/yyyy")
                    });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo leer el galpón. Probá de nuevo.");
            }
        }

        // GET api/Costos/Galpon/ViajesPorSalir?desde=AAAA-MM-DD — los viajes que todavía no salieron, con el galpón que se
        // les propone por su fecha (desde ese día, el nuevo), y cuántos ya salieron (esos conservan el suyo).
        [HttpGet, Route("Galpon/ViajesPorSalir")]
        public IHttpActionResult ViajesPorSalir(DateTime desde)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    Exigir(sesion.EsAdmin, "Solo un administrador puede cambiar el galpón.");
                    var viajes = db.Database.SqlQuery<ViajePorSalirRow>(
                        "SELECT v.Viaje_ID, v.Fecha_Inicio, ISNULL(c.Razon_Social,'') AS Cliente, ISNULL(c.Tipo_Cliente,'Directo') AS Tipo_Cliente, " +
                        "ISNULL(o.Descripcion,'') AS Origen, ISNULL(d.Descripcion,'') AS Destino " +
                        "FROM dbo.VIAJES v LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID " +
                        "LEFT JOIN dbo.ORIGEN o ON o.Origen_ID = v.OrigenID LEFT JOIN dbo.DESTINO d ON d.Destino_ID = v.DestinoID " +
                        "WHERE " + SQL_NO_SALIO + " ORDER BY v.Fecha_Inicio, v.Viaje_ID").ToList();
                    var salieron = db.Database.SqlQuery<int>(
                        "SELECT COUNT(*) FROM dbo.VIAJES v LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID WHERE NOT (" + SQL_NO_SALIO + ")").First();
                    return Ok(new
                    {
                        Viajes = viajes.Select(v => new
                        {
                            v.Viaje_ID, v.Fecha_Inicio, v.Cliente, v.Tipo_Cliente, v.Origen, v.Destino,
                            Propuesto = v.Fecha_Inicio.Date >= desde.Date ? "Nuevo" : "Actual"
                        }).ToList(),
                        Salieron = salieron
                    });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudieron leer los viajes que todavía no salieron. Probá de nuevo.");
            }
        }

        private string ValidarDireccion(SGTLAuditContext db, GalponDto body, out string calle, out string altura)
        {
            calle = Recortar(body == null ? null : body.Calle, 100);
            altura = Recortar(body == null ? null : body.AlturaCalle, 10);
            if (body == null || !body.ProvID.HasValue || body.ProvID <= 0) return "Seleccioná la provincia.";
            if (!body.LocID.HasValue || body.LocID <= 0) return "Seleccioná la localidad.";
            if (calle.Length == 0) return "Completá la calle.";
            var localidadValida = db.Database.SqlQuery<int>(
                "SELECT COUNT(*) FROM dbo.LOCALIDADES WHERE Loc_ID = @loc AND ProvID = @prov",
                P("@loc", body.LocID.Value), P("@prov", body.ProvID.Value)).First();
            return localidadValida == 0 ? "La localidad no es de la provincia elegida." : null;
        }

        // POST api/Costos/Galpones — cambiar el galpón (solo administradores): el nuevo desde una fecha. Los viajes que ya
        // salieron conservan el suyo; de los que no salieron, se guarda el galpón solo en los que salen de otro que el de su
        // fecha (Del_Nuevo, Del_Actual). Los km al galpón nuevo los calcula la pantalla con Google Maps.
        [HttpPost, Route("Galpones")]
        public IHttpActionResult CambiarGalpon([FromBody] CambioGalponDto body)
        {
            const string porDefecto = "No se pudo cambiar el galpón. Probá de nuevo.";
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    Exigir(sesion.EsAdmin, "Solo un administrador puede cambiar el galpón.");
                    string calle, altura;
                    var error = ValidarDireccion(db, body, out calle, out altura);
                    if (error != null) return Rechazo(error);
                    if (!HayGalponesPorFecha(db)) return Rechazo("Para cambiar el galpón falta correr database/costos/02_galpones_por_fecha.sql.");
                    var actual = LeerGalpon(db);
                    if (actual == null) return Rechazo("Todavía no hay un galpón cargado.");
                    if (!body.Vigente_Desde.HasValue) return Rechazo("Completá desde cuándo se usa.");
                    var desde = body.Vigente_Desde.Value.Date;
                    var hoy = Hoy(db);
                    if (LeerGalpones(db).Any(g => g.Vigente_Desde.HasValue && g.Vigente_Desde.Value.Date > hoy.Date))
                        return Rechazo("Ya hay un galpón nuevo que todavía no empezó.");
                    if (actual.Vigente_Desde.HasValue && desde <= actual.Vigente_Desde.Value.Date)
                        return Rechazo("Fecha no permitida: tiene que ser después del " + actual.Vigente_Desde.Value.ToString("dd/MM/yyyy") + ".");
                    if (actual.ProvID == body.ProvID.Value && actual.LocID == body.LocID.Value
                        && string.Equals(actual.Calle, calle, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(actual.AlturaCalle ?? "", altura, StringComparison.OrdinalIgnoreCase))
                        return Rechazo("Es la dirección del galpón actual.");

                    var usuario = Recortar(sesion.Nombre_Usuario, 50);
                    var ahora = "CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime)";
                    var nuevoId = db.Database.SqlQuery<int>(
                        "INSERT INTO dbo.GALPON (ProvID, LocID, Calle, AlturaCalle, Vigente_Desde, Fecha_Modi, Usu_Modi) OUTPUT INSERTED.Galpon_ID " +
                        "VALUES (@prov, @loc, @calle, @altura, @desde, " + ahora + ", @usu)",
                        P("@prov", body.ProvID.Value), P("@loc", body.LocID.Value), P("@calle", calle),
                        P("@altura", altura.Length == 0 ? null : altura), P("@desde", desde), P("@usu", usuario)).First();

                    // Los que ya salieron y quedarían del nuevo por su fecha (si "desde" es un día que ya pasó) conservan el actual.
                    db.Database.ExecuteSqlCommand(
                        "UPDATE v SET GalponID = @actual FROM dbo.VIAJES v LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID " +
                        "WHERE v.GalponID IS NULL AND CAST(v.Fecha_Inicio AS date) >= @desde AND NOT (" + SQL_NO_SALIO + ")",
                        P("@actual", actual.Galpon_ID), P("@desde", desde));
                    // De los que no salieron: el elegido, si no es el de su fecha; los demás, el de su fecha.
                    var delNuevo = (body.Del_Nuevo ?? new List<int>()).Distinct().ToList();
                    var delActual = (body.Del_Actual ?? new List<int>()).Distinct().ToList();
                    db.Database.ExecuteSqlCommand(
                        "UPDATE v SET GalponID = NULL FROM dbo.VIAJES v LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID WHERE " + SQL_NO_SALIO);
                    // Uno que no salió y es de antes de que empezara el actual (quedó sin iniciar): en la lista figuraba con el
                    // actual, así que sale de ahí (por su fecha saldría de uno anterior).
                    if (actual.Vigente_Desde.HasValue)
                        db.Database.ExecuteSqlCommand(
                            "UPDATE v SET GalponID = @actual FROM dbo.VIAJES v LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID " +
                            "WHERE CAST(v.Fecha_Inicio AS date) < @desdeActual AND " + SQL_NO_SALIO,
                            P("@actual", actual.Galpon_ID), P("@desdeActual", actual.Vigente_Desde.Value.Date));
                    foreach (var id in delNuevo)
                        db.Database.ExecuteSqlCommand("UPDATE dbo.VIAJES SET GalponID = @g WHERE Viaje_ID = @id AND CAST(Fecha_Inicio AS date) < @desde",
                            P("@g", nuevoId), P("@id", id), P("@desde", desde));
                    foreach (var id in delActual)
                        db.Database.ExecuteSqlCommand("UPDATE dbo.VIAJES SET GalponID = @g WHERE Viaje_ID = @id AND CAST(Fecha_Inicio AS date) >= @desde",
                            P("@g", actual.Galpon_ID), P("@id", id), P("@desde", desde));

                    var nuevo = LeerGalpones(db).First(g => g.Galpon_ID == nuevoId);
                    var cantidad = db.Database.SqlQuery<int>(
                        "SELECT COUNT(*) FROM dbo.VIAJES v LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID " + SQL_GALPON_DEL_VIAJE +
                        "WHERE gv.Galpon_ID = @g AND " + SQL_NO_SALIO, P("@g", nuevoId)).First();
                    SGTLAuditContext.RegistrarEvento(Cn(), Recortar(usuario, 20), "INSERT", "GALPON", "Galpon_ID=" + nuevoId,
                        "Galpón nuevo desde el " + desde.ToString("dd/MM/yyyy") + ": " + DireccionGalpon(nuevo) + " (antes: " + DireccionGalpon(actual) + "). " +
                        cantidad + " de los viajes que no salieron salen del nuevo" +
                        (delNuevo.Count + delActual.Count > 0 ? "; elegidos a mano: " + string.Join(", ", delNuevo.Concat(delActual).Select(i => "#" + i)) : "") + ".");
                    return Ok(new
                    {
                        Galpon = GalponDe(nuevo),
                        Recalcular = true,
                        Message = "Galpón cambiado. Desde el " + desde.ToString("dd/MM/yyyy") + " los viajes salen de " + CalleGalpon(nuevo) + "." +
                            (cantidad > 0 ? " " + (cantidad == 1 ? "1 de los que no salieron ya sale de ahí." : cantidad + " de los que no salieron ya salen de ahí.") : "")
                    });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, porDefecto);
            }
        }

        // PUT api/Costos/Galpon { ProvID, LocID, Calle, AlturaCalle } — cargar el primer galpón o corregir la dirección del
        // vigente (solo administradores). Corregirla borra sus km al galpón: la pantalla los recalcula. Para mudarse a otro
        // galpón está "Cambiar galpón" (POST api/Costos/Galpones).
        [HttpPut, Route("Galpon")]
        public IHttpActionResult GuardarGalpon([FromBody] GalponDto body)
        {
            const string porDefecto = "No se pudo guardar el galpón. Probá de nuevo.";
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    Exigir(sesion.EsAdmin, "Solo un administrador puede cambiar el galpón.");
                    string calle, altura;
                    var error = ValidarDireccion(db, body, out calle, out altura);
                    if (error != null) return Rechazo(error);

                    var anterior = LeerGalpon(db);
                    var cambio = anterior == null || anterior.ProvID != body.ProvID.Value || anterior.LocID != body.LocID.Value
                        || !string.Equals(anterior.Calle, calle, StringComparison.OrdinalIgnoreCase)
                        || !string.Equals(anterior.AlturaCalle ?? "", altura, StringComparison.OrdinalIgnoreCase);
                    var usuario = Recortar(sesion.Nombre_Usuario, 50);
                    db.Database.ExecuteSqlCommand(
                        "IF EXISTS (SELECT 1 FROM dbo.GALPON) " +
                        "  UPDATE dbo.GALPON SET ProvID = @prov, LocID = @loc, Calle = @calle, AlturaCalle = @altura, " +
                        "    Fecha_Modi = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime), Usu_Modi = @usu " +
                        "  WHERE Galpon_ID = @id " +
                        "ELSE " +
                        "  INSERT INTO dbo.GALPON (ProvID, LocID, Calle, AlturaCalle, Fecha_Modi, Usu_Modi) " +
                        "  VALUES (@prov, @loc, @calle, @altura, CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime), @usu)",
                        P("@prov", body.ProvID.Value), P("@loc", body.LocID.Value), P("@calle", calle),
                        P("@altura", altura.Length == 0 ? null : altura), P("@usu", usuario), P("@id", anterior == null ? 0 : anterior.Galpon_ID));
                    if (cambio && anterior != null)
                    {
                        if (HayGalponesPorFecha(db))
                            db.Database.ExecuteSqlCommand("DELETE FROM dbo.GALPON_KM WHERE Galpon_ID = @id", P("@id", anterior.Galpon_ID));
                        else
                        {
                            db.Database.ExecuteSqlCommand("UPDATE dbo.ORIGEN SET Km_Galpon = NULL WHERE Km_Galpon IS NOT NULL");
                            db.Database.ExecuteSqlCommand("UPDATE dbo.DESTINO SET Km_Galpon = NULL WHERE Km_Galpon IS NOT NULL");
                        }
                    }
                    var nuevo = LeerGalpon(db);
                    SGTLAuditContext.RegistrarEvento(Cn(), Recortar(usuario, 20), "UPDATE", "GALPON", "Galpon",
                        "Galpón: " + (DireccionGalpon(anterior) ?? "sin cargar") + " -> " + DireccionGalpon(nuevo)
                        + (cambio ? " (se recalculan los km al galpón)" : ""));
                    return Ok(new { Galpon = GalponDe(nuevo), Recalcular = cambio });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, porDefecto);
            }
        }

        // ---------------------------------------------------------------- Km al galpón de orígenes y destinos

        private static object Pendiente(LugarRow l, int galponId, string galpon)
        {
            return new
            {
                l.Tipo, l.ID, l.Nombre,
                Direccion = GoogleMapsLinkBuilder.BuildAddress(l.Calle, l.AlturaCalle, l.Localidad, l.Provincia),
                GalponID = galponId, Galpon = galpon
            };
        }

        private const string SQL_LUGARES =
            "SELECT 'Origen' AS Tipo, o.Origen_ID AS ID, ISNULL(o.Descripcion,'') AS Nombre, ISNULL(o.Calle,'') AS Calle, " +
            "ISNULL(o.AlturaCalle,'') AS AlturaCalle, ISNULL(l.Nombre_Localidad,'') AS Localidad, ISNULL(p.Nombre_Provincia,'') AS Provincia " +
            "FROM dbo.ORIGEN o LEFT JOIN dbo.LOCALIDADES l ON l.Loc_ID = o.LocID LEFT JOIN dbo.PROVINCIAS p ON p.Prov_ID = o.ProvID " +
            "WHERE o.Km_Galpon IS NULL AND (@origen IS NULL OR o.Origen_ID = @origen) AND (@solo = 0 OR @origen IS NOT NULL) " +
            "UNION ALL " +
            "SELECT 'Destino', d.Destino_ID, ISNULL(d.Descripcion,''), ISNULL(d.Calle,''), ISNULL(d.AlturaCalle,''), " +
            "ISNULL(l.Nombre_Localidad,''), ISNULL(p.Nombre_Provincia,'') " +
            "FROM dbo.DESTINO d LEFT JOIN dbo.LOCALIDADES l ON l.Loc_ID = d.LocID LEFT JOIN dbo.PROVINCIAS p ON p.Prov_ID = d.ProvID " +
            "WHERE d.Km_Galpon IS NULL AND (@destino IS NULL OR d.Destino_ID = @destino) AND (@solo = 0 OR @destino IS NOT NULL)";

        private class LugarDeGalponRow : LugarRow
        {
            public int Galpon_ID { get; set; }
        }

        // Con el script 02: por galpón. Del vigente hoy y del que empieza más adelante, todos los lugares que faltan; de los
        // anteriores, solo los de sus viajes.
        private const string SQL_LUGARES_POR_GALPON =
            "SELECT g.Galpon_ID, 'Origen' AS Tipo, o.Origen_ID AS ID, ISNULL(o.Descripcion,'') AS Nombre, ISNULL(o.Calle,'') AS Calle, " +
            "ISNULL(o.AlturaCalle,'') AS AlturaCalle, ISNULL(l.Nombre_Localidad,'') AS Localidad, ISNULL(p.Nombre_Provincia,'') AS Provincia " +
            "FROM dbo.GALPON g CROSS JOIN dbo.ORIGEN o LEFT JOIN dbo.LOCALIDADES l ON l.Loc_ID = o.LocID LEFT JOIN dbo.PROVINCIAS p ON p.Prov_ID = o.ProvID " +
            "WHERE NOT EXISTS (SELECT 1 FROM dbo.GALPON_KM k WHERE k.Galpon_ID = g.Galpon_ID AND k.Tipo = 'Origen' AND k.Lugar_ID = o.Origen_ID) " +
            "AND (@galpon IS NULL OR g.Galpon_ID = @galpon) AND (@origen IS NULL OR o.Origen_ID = @origen) AND (@solo = 0 OR @origen IS NOT NULL) " +
            "AND (g.Galpon_ID = @actual OR g.Vigente_Desde > " + SQL_HOY + " OR EXISTS (SELECT 1 FROM dbo.VIAJES v " + SQL_GALPON_DEL_VIAJE +
            "WHERE gv.Galpon_ID = g.Galpon_ID AND v.OrigenID = o.Origen_ID)) " +
            "UNION ALL " +
            "SELECT g.Galpon_ID, 'Destino', d.Destino_ID, ISNULL(d.Descripcion,''), ISNULL(d.Calle,''), ISNULL(d.AlturaCalle,''), " +
            "ISNULL(l.Nombre_Localidad,''), ISNULL(p.Nombre_Provincia,'') " +
            "FROM dbo.GALPON g CROSS JOIN dbo.DESTINO d LEFT JOIN dbo.LOCALIDADES l ON l.Loc_ID = d.LocID LEFT JOIN dbo.PROVINCIAS p ON p.Prov_ID = d.ProvID " +
            "WHERE NOT EXISTS (SELECT 1 FROM dbo.GALPON_KM k WHERE k.Galpon_ID = g.Galpon_ID AND k.Tipo = 'Destino' AND k.Lugar_ID = d.Destino_ID) " +
            "AND (@galpon IS NULL OR g.Galpon_ID = @galpon) AND (@destino IS NULL OR d.Destino_ID = @destino) AND (@solo = 0 OR @destino IS NOT NULL) " +
            "AND (g.Galpon_ID = @actual OR g.Vigente_Desde > " + SQL_HOY + " OR EXISTS (SELECT 1 FROM dbo.VIAJES v " + SQL_GALPON_DEL_VIAJE +
            "WHERE gv.Galpon_ID = g.Galpon_ID AND v.DestinoID = d.Destino_ID))";

        // GET api/Costos/KmGalpon/Pendientes[?origen=ID&destino=ID&galpon=ID] — los orígenes y destinos sin km al galpón
        // (con origen o destino, solo esos; con galpon, solo los de ese galpón), cada uno con la dirección de su galpón,
        // para que el navegador los calcule con Google Maps.
        [HttpGet, Route("KmGalpon/Pendientes")]
        public IHttpActionResult KmGalponPendientes(int? origen = null, int? destino = null, int? galpon = null)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    ValidarSesion(db);
                    var actual = LeerGalpon(db);
                    if (actual == null) return Ok(new { Galpon = (string)null, Pendientes = new object[0] });
                    var solo = origen.HasValue || destino.HasValue;
                    if (!HayGalponesPorFecha(db))
                    {
                        var viejos = db.Database.SqlQuery<LugarRow>(SQL_LUGARES,
                            P("@origen", origen), P("@destino", destino), P("@solo", solo ? 1 : 0)).ToList();
                        var direccion = DireccionGalpon(actual);
                        return Ok(new { Galpon = direccion, Pendientes = viejos.Select(l => Pendiente(l, actual.Galpon_ID, direccion)).ToList() });
                    }
                    var direcciones = LeerGalpones(db).ToDictionary(g => g.Galpon_ID, DireccionGalpon);
                    var lugares = db.Database.SqlQuery<LugarDeGalponRow>(SQL_LUGARES_POR_GALPON,
                        P("@origen", origen), P("@destino", destino), P("@solo", solo ? 1 : 0), P("@galpon", galpon), P("@actual", actual.Galpon_ID)).ToList();
                    return Ok(new
                    {
                        Galpon = DireccionGalpon(actual),
                        Pendientes = lugares.Select(l => Pendiente(l, l.Galpon_ID, direcciones.ContainsKey(l.Galpon_ID) ? direcciones[l.Galpon_ID] : null)).ToList()
                    });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudieron leer los km al galpón. Probá de nuevo.");
            }
        }

        // PUT api/Costos/KmGalpon { Tipo: "Origen" | "Destino", ID, Km } — lo que calculó Google Maps en el navegador.
        [HttpPut, Route("KmGalpon")]
        public IHttpActionResult GuardarKmGalpon([FromBody] KmGalponDto body)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    ValidarSesion(db);
                    if (body == null || !body.Km.HasValue || body.Km < 0 || body.Km > 10000) return Rechazo("Los km al galpón no son válidos.");
                    var tabla = string.Equals(body.Tipo, "Origen", StringComparison.OrdinalIgnoreCase) ? "ORIGEN"
                        : string.Equals(body.Tipo, "Destino", StringComparison.OrdinalIgnoreCase) ? "DESTINO" : null;
                    if (tabla == null) return Rechazo("Falta decir si es un origen o un destino.");
                    var km = decimal.Round(body.Km.Value, 1);
                    var existe = db.Database.SqlQuery<int>("SELECT COUNT(*) FROM dbo." + tabla + " WHERE " + (tabla == "ORIGEN" ? "Origen_ID" : "Destino_ID") + " = @id",
                        P("@id", body.ID)).First();
                    if (existe == 0) return Content(HttpStatusCode.NotFound, new { message = "El origen o destino ya no existe." });
                    if (!HayGalponesPorFecha(db))
                        db.Database.ExecuteSqlCommand("UPDATE dbo." + tabla + " SET Km_Galpon = @km WHERE " + (tabla == "ORIGEN" ? "Origen_ID" : "Destino_ID") + " = @id",
                            P("@km", km), P("@id", body.ID));
                    else
                    {
                        var galponId = body.GalponID ?? (LeerGalpon(db) == null ? 0 : LeerGalpon(db).Galpon_ID);
                        var tipo = tabla == "ORIGEN" ? "Origen" : "Destino";
                        db.Database.ExecuteSqlCommand(
                            "IF EXISTS (SELECT 1 FROM dbo.GALPON_KM WHERE Galpon_ID = @g AND Tipo = @tipo AND Lugar_ID = @id) " +
                            "  UPDATE dbo.GALPON_KM SET Km = @km WHERE Galpon_ID = @g AND Tipo = @tipo AND Lugar_ID = @id " +
                            "ELSE IF EXISTS (SELECT 1 FROM dbo.GALPON WHERE Galpon_ID = @g) " +
                            "  INSERT INTO dbo.GALPON_KM (Galpon_ID, Tipo, Lugar_ID, Km) VALUES (@g, @tipo, @id, @km)",
                            P("@g", galponId), P("@tipo", tipo), P("@id", body.ID), P("@km", km));
                    }
                    return Ok(new { body.Tipo, body.ID, body.GalponID, Km = km });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudieron guardar los km al galpón. Probá de nuevo.");
            }
        }

        // ---------------------------------------------------------------- Precio del gasoil (Gestionar camiones)

        private static object PrecioDe(PrecioRow p)
        {
            return p == null ? null : new { p.Precio_ID, p.Vigente_Desde, p.Precio_Litro, p.Fecha_Alta, p.Usu_Alta };
        }

        // GET api/Costos/Gasoil — el precio vigente hoy y los últimos cargados.
        [HttpGet, Route("Gasoil")]
        public IHttpActionResult Gasoil()
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    ValidarSesion(db);
                    var vigente = db.Database.SqlQuery<PrecioRow>(
                        "SELECT TOP (1) Precio_ID, Vigente_Desde, Precio_Litro, Fecha_Alta, Usu_Alta FROM dbo.PRECIOS_GASOIL " +
                        "WHERE Vigente_Desde <= " + SQL_HOY + " ORDER BY Vigente_Desde DESC, Precio_ID DESC").FirstOrDefault();
                    var historial = db.Database.SqlQuery<PrecioRow>(
                        "SELECT TOP (10) Precio_ID, Vigente_Desde, Precio_Litro, Fecha_Alta, Usu_Alta FROM dbo.PRECIOS_GASOIL " +
                        "ORDER BY Vigente_Desde DESC, Precio_ID DESC").ToList();
                    return Ok(new { Vigente = PrecioDe(vigente), Historial = historial.Select(PrecioDe).ToList() });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo leer el precio del gasoil. Probá de nuevo.");
            }
        }

        // POST api/Costos/Gasoil { Precio_Litro, Vigente_Desde } — un precio nuevo desde una fecha (no pisa los
        // anteriores: cada viaje usa el de su fecha). El mismo día, vale el último que se cargó.
        [HttpPost, Route("Gasoil")]
        public IHttpActionResult GuardarGasoil([FromBody] PrecioGasoilDto body)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    Exigir(sesion.Tiene("gestion de camiones"), "No tenés permiso para cambiar el precio del gasoil.");
                    if (body == null || !body.Precio_Litro.HasValue) return Rechazo("Completá el precio por litro.");
                    if (body.Precio_Litro <= 0 || body.Precio_Litro > 1000000) return Rechazo("El precio por litro tiene que ser mayor que cero.");
                    if (!body.Vigente_Desde.HasValue) return Rechazo("Completá desde qué fecha vale.");
                    var usuario = Recortar(sesion.Nombre_Usuario, 50);
                    db.Database.ExecuteSqlCommand(
                        "INSERT INTO dbo.PRECIOS_GASOIL (Vigente_Desde, Precio_Litro, Fecha_Alta, Usu_Alta) " +
                        "VALUES (@desde, @precio, CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime), @usu)",
                        P("@desde", body.Vigente_Desde.Value.Date), P("@precio", decimal.Round(body.Precio_Litro.Value, 2)), P("@usu", usuario));
                    SGTLAuditContext.RegistrarEvento(Cn(), Recortar(usuario, 20), "INSERT", "PRECIOS_GASOIL",
                        "Desde=" + body.Vigente_Desde.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                        "Precio del gasoil: " + decimal.Round(body.Precio_Litro.Value, 2).ToString("0.00", CultureInfo.InvariantCulture) + " por litro");
                    return Gasoil();
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo guardar el precio del gasoil. Probá de nuevo.");
            }
        }

        // ---------------------------------------------------------------- Kilometraje de los camiones

        private static KilometrajeRow LeerKilometraje(SGTLAuditContext db, int camionId)
        {
            return db.Database.SqlQuery<KilometrajeRow>(
                "SELECT c.Camion_ID, RTRIM(ISNULL(c.Dominio,'')) AS Dominio, c.Km_Inicial, c.Fecha_Km_Inicial, c.Consumo_L_100km, " +
                "COUNT(v.Viaje_ID) AS Viajes, " +
                "SUM(CASE WHEN v.Viaje_ID IS NOT NULL AND (ki.Km IS NULL OR kv.Km IS NULL OR " + SQL_KM_RUTA + " IS NULL) THEN 1 ELSE 0 END) AS Viajes_Sin_Km, " +
                "CAST(ISNULL(SUM(ki.Km + " + SQL_KM_RUTA + " + kv.Km), 0) AS decimal(12, 1)) AS Km_Recorridos " +
                "FROM dbo.CAMIONES c " +
                "LEFT JOIN dbo.VIAJES v ON v.CamionID = c.Camion_ID AND " + SQL_ENTREGADO + " " +
                "  AND c.Fecha_Km_Inicial IS NOT NULL AND CAST(v.Fecha_Inicio AS date) >= c.Fecha_Km_Inicial " +
                SQL_GALPON_DEL_VIAJE + SQL_KM_GALPON_DEL_VIAJE +
                "WHERE c.Camion_ID = @id " +
                "GROUP BY c.Camion_ID, c.Dominio, c.Km_Inicial, c.Fecha_Km_Inicial, c.Consumo_L_100km",
                P("@id", camionId)).FirstOrDefault();
        }

        // GET api/Costos/Camiones/{id}/Kilometraje — el kilometraje de hoy: el inicial más el recorrido completo de cada
        // viaje entregado desde esa fecha (los que todavía no tienen sus km al galpón no suman: Viajes_Sin_Km).
        [HttpGet, Route("Camiones/{id:int}/Kilometraje")]
        public IHttpActionResult Kilometraje(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    Exigir(sesion.Tiene("listado de camiones", "gestion de camiones"), "No tenés permiso para ver los camiones.");
                    var k = LeerKilometraje(db, id);
                    if (k == null) return Content(HttpStatusCode.NotFound, new { message = "El camión ya no existe." });
                    return Ok(new
                    {
                        k.Camion_ID, k.Dominio, k.Km_Inicial, k.Fecha_Km_Inicial, k.Consumo_L_100km,
                        k.Viajes, k.Viajes_Sin_Km, k.Km_Recorridos,
                        Km_Actual = k.Km_Inicial.HasValue ? (decimal?)(k.Km_Inicial.Value + k.Km_Recorridos) : null
                    });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo leer el kilometraje del camión. Probá de nuevo.");
            }
        }

        // PUT api/Costos/Camiones/Kilometraje { Camion_ID o Dominio, Km_Inicial, Fecha_Km_Inicial, Consumo_L_100km } —
        // lo guarda Gestionar camiones después de guardar el camión (en el alta se busca por dominio: el alta no
        // devuelve el número).
        [HttpPut, Route("Camiones/Kilometraje")]
        public IHttpActionResult GuardarKilometraje([FromBody] KilometrajeDto body)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    Exigir(sesion.Tiene("gestion de camiones"), "No tenés permiso para cambiar el kilometraje de los camiones.");
                    if (body == null) return Rechazo("Faltan los datos del kilometraje.");
                    if (body.Km_Inicial.HasValue && (body.Km_Inicial < 0 || body.Km_Inicial > 5000000))
                        return Rechazo("El kilometraje no es válido.");
                    if (body.Km_Inicial.HasValue && !body.Fecha_Km_Inicial.HasValue)
                        return Rechazo("Completá la fecha del kilometraje.");
                    if (body.Consumo_L_100km.HasValue && (body.Consumo_L_100km <= 0 || body.Consumo_L_100km > 200))
                        return Rechazo("El consumo tiene que estar entre 1 y 200 litros cada 100 km.");
                    var hoy = db.Database.SqlQuery<DateTime>("SELECT CAST(" + SQL_HOY + " AS datetime)").First();
                    if (body.Fecha_Km_Inicial.HasValue && body.Fecha_Km_Inicial.Value.Date > hoy.Date)
                        return Rechazo("La fecha del kilometraje no puede ser posterior a hoy.");

                    var camionId = body.Camion_ID.HasValue && body.Camion_ID > 0 ? body.Camion_ID
                        : db.Database.SqlQuery<int?>("SELECT TOP (1) Camion_ID FROM dbo.CAMIONES WHERE RTRIM(Dominio) = @dominio " +
                            "AND ISNULL(EstadoCamion,'') <> 'Eliminado' ORDER BY Camion_ID DESC", P("@dominio", Recortar(body.Dominio, 20))).FirstOrDefault();
                    if (!camionId.HasValue) return Content(HttpStatusCode.NotFound, new { message = "El camión ya no existe." });

                    var anterior = LeerKilometraje(db, camionId.Value);
                    if (anterior == null) return Content(HttpStatusCode.NotFound, new { message = "El camión ya no existe." });
                    db.Database.ExecuteSqlCommand(
                        "UPDATE dbo.CAMIONES SET Km_Inicial = @km, Fecha_Km_Inicial = @fecha, Consumo_L_100km = @consumo WHERE Camion_ID = @id",
                        P("@km", body.Km_Inicial), P("@fecha", body.Km_Inicial.HasValue ? (object)body.Fecha_Km_Inicial.Value.Date : null),
                        P("@consumo", body.Consumo_L_100km.HasValue ? (object)decimal.Round(body.Consumo_L_100km.Value, 1) : null),
                        P("@id", camionId.Value));
                    SGTLAuditContext.RegistrarEvento(Cn(), Recortar(sesion.Nombre_Usuario, 20), "UPDATE", "CAMIONES", "Camion_ID=" + camionId.Value,
                        "Kilometraje inicial: " + (anterior.Km_Inicial.HasValue ? anterior.Km_Inicial.Value.ToString(CultureInfo.InvariantCulture) : "-") +
                        " -> " + (body.Km_Inicial.HasValue ? body.Km_Inicial.Value.ToString(CultureInfo.InvariantCulture) : "-") +
                        "; Consumo: " + (anterior.Consumo_L_100km.HasValue ? anterior.Consumo_L_100km.Value.ToString("0.0", CultureInfo.InvariantCulture) : "-") +
                        " -> " + (body.Consumo_L_100km.HasValue ? body.Consumo_L_100km.Value.ToString("0.0", CultureInfo.InvariantCulture) : "-"));
                    return Kilometraje(camionId.Value);
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo guardar el kilometraje del camión. Probá de nuevo.");
            }
        }

        // ---------------------------------------------------------------- Costo de un viaje (Ver detalle del viaje)

        // GET api/Costos/Viajes/{id} — el recorrido completo, el combustible estimado (km × consumo del camión × precio
        // del gasoil a la fecha del viaje), los gastos que rindió el chofer y el importe del viaje. El margen lo arma la
        // pantalla con estos datos.
        [HttpGet, Route("Viajes/{id:int}")]
        public IHttpActionResult CostoViaje(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    Exigir(sesion.Tiene("listado de viajes", "gestion de viajes"), "No tenés permiso para ver los costos de los viajes.");
                    // El importe guardado en el viaje es de database/tarifas/02_…: sin ese script, el costo sale sin importe.
                    // COL_LENGTH devuelve smallint: EF no lo convierte solo a int.
                    var hayImporte = db.Database.SqlQuery<int?>("SELECT CAST(COL_LENGTH('dbo.VIAJES', 'Importe') AS int)").First().HasValue;
                    var v = db.Database.SqlQuery<CostoViajeRow>(
                        "SELECT v.Viaje_ID, v.Fecha_Inicio, RTRIM(ISNULL(cam.Dominio,'')) AS Camion, cam.Consumo_L_100km, " +
                        "v.OrigenID, ISNULL(o.Descripcion,'') AS Origen, ki.Km AS Km_Ida, " + SQL_KM_RUTA + " AS Km_Ruta, " +
                        "v.DestinoID, ISNULL(d.Descripcion,'') AS Destino, kv.Km AS Km_Vuelta, gv.Galpon_ID AS GalponID, " +
                        "pg.Precio_Litro, pg.Vigente_Desde AS Precio_Desde, " +
                        (hayImporte ? "v.Importe" : "CAST(NULL AS decimal(18, 2))") + " AS Importe, ISNULL(v.Estado, 'Registrado') AS Estado " +
                        "FROM dbo.VIAJES v " + SQL_GALPON_DEL_VIAJE + SQL_KM_GALPON_DEL_VIAJE +
                        "LEFT JOIN dbo.CAMIONES cam ON cam.Camion_ID = v.CamionID " +
                        "LEFT JOIN dbo.ORIGEN o ON o.Origen_ID = v.OrigenID " +
                        "LEFT JOIN dbo.DESTINO d ON d.Destino_ID = v.DestinoID " +
                        "OUTER APPLY (SELECT TOP (1) p.Precio_Litro, p.Vigente_Desde FROM dbo.PRECIOS_GASOIL p " +
                        "  WHERE p.Vigente_Desde <= CAST(v.Fecha_Inicio AS date) ORDER BY p.Vigente_Desde DESC, p.Precio_ID DESC) pg " +
                        "WHERE v.Viaje_ID = @id", P("@id", id)).FirstOrDefault();
                    if (v == null) return Content(HttpStatusCode.NotFound, new { message = "El viaje ya no existe." });

                    var gastos = db.Database.SqlQuery<GastoRow>(
                        "SELECT Gasto_ID, Tipo, Fecha, Importe, Litros, Detalle, Nombre_Archivo, Usu_Alta FROM dbo.VIAJE_GASTOS " +
                        "WHERE Viaje_ID = @id ORDER BY Fecha, Gasto_ID", P("@id", id)).ToList();
                    var galpon = v.GalponID.HasValue ? LeerGalpones(db).FirstOrDefault(g => g.Galpon_ID == v.GalponID.Value) : null;

                    decimal? kmTotal = v.Km_Ida.HasValue && v.Km_Ruta.HasValue && v.Km_Vuelta.HasValue
                        ? v.Km_Ida + v.Km_Ruta + v.Km_Vuelta : null;
                    decimal? litros = kmTotal.HasValue && v.Consumo_L_100km.HasValue
                        ? (decimal?)decimal.Round(kmTotal.Value * v.Consumo_L_100km.Value / 100m, 1) : null;
                    decimal? combustible = litros.HasValue && v.Precio_Litro.HasValue
                        ? (decimal?)decimal.Round(litros.Value * v.Precio_Litro.Value, 2) : null;

                    return Ok(new
                    {
                        v.Viaje_ID, v.Fecha_Inicio, v.Camion, v.Consumo_L_100km,
                        Galpon_Configurado = galpon != null,
                        // El galpón de este viaje (punto 28 de la §41), para nombrarlo en el primer tramo.
                        v.GalponID, Galpon = CalleGalpon(galpon),
                        v.OrigenID, v.Origen, v.Km_Ida, v.Km_Ruta, v.DestinoID, v.Destino, v.Km_Vuelta,
                        Km_Total = kmTotal,
                        v.Precio_Litro, v.Precio_Desde,
                        Litros_Estimados = litros,
                        Combustible_Estimado = combustible,
                        v.Importe,
                        Gastos = gastos,
                        Gastos_Total = gastos.Sum(g => g.Importe),
                        // "Cargar gasto" para quien gestiona viajes (null: no lo ve); Motivo vacío si se puede.
                        Cargar_Gasto = sesion.Tiene("gestion de viajes")
                            ? new { Motivo = Viajes.GastosDelViaje.MotivoAdministracion("cargar", v.Estado) ?? "" } : null
                    });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo calcular el costo del viaje. Probá de nuevo.");
            }
        }

        // POST api/Costos/Viajes/{id}/Gastos — administración carga un gasto que el chofer no llegó a rendir (Rocío, 27/10,
        // punto 33 de la §41): quien gestiona viajes, con el viaje entregado o listo para facturar. Las mismas validaciones
        // que la hoja de ruta.
        [HttpPost, Route("Viajes/{id:int}/Gastos")]
        public IHttpActionResult CargarGasto(int id, [FromBody] Viajes.GastosDelViaje.Datos body)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    Exigir(sesion.Tiene("gestion de viajes"), "No tenés permiso para cargar gastos de los viajes.");
                    var v = db.Database.SqlQuery<EstadoViajeRow>(
                        "SELECT Viaje_ID, ISNULL(Estado, 'Registrado') AS Estado, Fecha_Inicio FROM dbo.VIAJES WHERE Viaje_ID = @id", P("@id", id)).FirstOrDefault();
                    if (v == null) return Content(HttpStatusCode.NotFound, new { message = "El viaje ya no existe." });
                    var motivo = Viajes.GastosDelViaje.MotivoAdministracion("cargar", v.Estado);
                    if (motivo != null) return Rechazo(motivo);
                    var hoy = db.Database.SqlQuery<DateTime>(
                        "SELECT CAST(CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS date) AS datetime)").First();
                    var error = Viajes.GastosDelViaje.Guardar(db, id, v.Fecha_Inicio, hoy, body, sesion.Nombre_Usuario, Cn());
                    if (error != null) return Rechazo(error);
                    return Ok(new { Message = "Gasto del viaje #" + id + " cargado." });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo cargar el gasto. Probá de nuevo.");
            }
        }

        private class EstadoViajeRow
        {
            public int Viaje_ID { get; set; }
            public string Estado { get; set; }
            public DateTime Fecha_Inicio { get; set; }
        }

        // GET api/Costos/Gastos/{id}/Comprobante — la foto o el PDF del ticket (para la oficina).
        [HttpGet, Route("Gastos/{id:int}/Comprobante")]
        public IHttpActionResult Comprobante(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    Exigir(sesion.Tiene("listado de viajes", "gestion de viajes"), "No tenés permiso para ver los gastos de los viajes.");
                    var archivo = db.Database.SqlQuery<ArchivoRow>(
                        "SELECT Nombre_Archivo, Content_Type, Archivo FROM dbo.VIAJE_GASTOS WHERE Gasto_ID = @id", P("@id", id)).FirstOrDefault();
                    if (archivo == null) return Content(HttpStatusCode.NotFound, new { message = "El gasto ya no existe." });
                    return ResponseMessage(ArchivoComoRespuesta(archivo.Archivo, archivo.Content_Type, archivo.Nombre_Archivo));
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo abrir el comprobante. Probá de nuevo.");
            }
        }

        internal static HttpResponseMessage ArchivoComoRespuesta(byte[] datos, string tipo, string nombre)
        {
            var respuesta = new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(datos) };
            respuesta.Content.Headers.ContentType = new MediaTypeHeaderValue(Array.IndexOf(TiposComprobante, tipo) >= 0 ? tipo : "application/octet-stream");
            respuesta.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("inline") { FileName = nombre };
            return respuesta;
        }
    }
}
