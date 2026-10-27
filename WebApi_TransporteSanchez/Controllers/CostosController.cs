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

        public class KmGalponDto
        {
            public string Tipo { get; set; }
            public int ID { get; set; }
            public decimal? Km { get; set; }
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

        internal static GalponRow LeerGalpon(SGTLAuditContext db)
        {
            return db.Database.SqlQuery<GalponRow>(
                "SELECT TOP (1) g.ProvID, g.LocID, g.Calle, ISNULL(g.AlturaCalle,'') AS AlturaCalle, " +
                "ISNULL(p.Nombre_Provincia,'') AS Provincia, ISNULL(l.Nombre_Localidad,'') AS Localidad, g.Fecha_Modi, g.Usu_Modi " +
                "FROM dbo.GALPON g LEFT JOIN dbo.PROVINCIAS p ON p.Prov_ID = g.ProvID LEFT JOIN dbo.LOCALIDADES l ON l.Loc_ID = g.LocID " +
                "ORDER BY g.Galpon_ID").FirstOrDefault();
        }

        internal static string DireccionGalpon(GalponRow g)
        {
            return g == null ? null : GoogleMapsLinkBuilder.BuildAddress(g.Calle, g.AlturaCalle, g.Localidad, g.Provincia);
        }

        private static object GalponDe(GalponRow g)
        {
            if (g == null) return new { Configurado = false };
            return new
            {
                Configurado = true,
                g.ProvID, g.LocID, g.Calle, g.AlturaCalle, g.Provincia, g.Localidad,
                Direccion = DireccionGalpon(g),
                g.Fecha_Modi, g.Usu_Modi
            };
        }

        // GET api/Costos/Galpon
        [HttpGet, Route("Galpon")]
        public IHttpActionResult Galpon()
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    ValidarSesion(db);
                    return Ok(GalponDe(LeerGalpon(db)));
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo leer el galpón. Probá de nuevo.");
            }
        }

        // PUT api/Costos/Galpon { ProvID, LocID, Calle, AlturaCalle } — solo administradores (como Gestionar empresa).
        // Si cambia la dirección, se borran los km al galpón de todos los orígenes y destinos: la pantalla los recalcula.
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
                    if (body == null || !body.ProvID.HasValue || body.ProvID <= 0) return Rechazo("Seleccioná la provincia.");
                    if (!body.LocID.HasValue || body.LocID <= 0) return Rechazo("Seleccioná la localidad.");
                    var calle = Recortar(body.Calle, 100);
                    var altura = Recortar(body.AlturaCalle, 10);
                    if (calle.Length == 0) return Rechazo("Completá la calle.");
                    var localidadValida = db.Database.SqlQuery<int>(
                        "SELECT COUNT(*) FROM dbo.LOCALIDADES WHERE Loc_ID = @loc AND ProvID = @prov",
                        P("@loc", body.LocID.Value), P("@prov", body.ProvID.Value)).First();
                    if (localidadValida == 0) return Rechazo("La localidad no es de la provincia elegida.");

                    var anterior = LeerGalpon(db);
                    var cambio = anterior == null || anterior.ProvID != body.ProvID.Value || anterior.LocID != body.LocID.Value
                        || !string.Equals(anterior.Calle, calle, StringComparison.OrdinalIgnoreCase)
                        || !string.Equals(anterior.AlturaCalle ?? "", altura, StringComparison.OrdinalIgnoreCase);
                    var usuario = Recortar(sesion.Nombre_Usuario, 50);
                    db.Database.ExecuteSqlCommand(
                        "IF EXISTS (SELECT 1 FROM dbo.GALPON) " +
                        "  UPDATE dbo.GALPON SET ProvID = @prov, LocID = @loc, Calle = @calle, AlturaCalle = @altura, " +
                        "    Fecha_Modi = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime), Usu_Modi = @usu " +
                        "  WHERE Galpon_ID = (SELECT MIN(Galpon_ID) FROM dbo.GALPON) " +
                        "ELSE " +
                        "  INSERT INTO dbo.GALPON (ProvID, LocID, Calle, AlturaCalle, Fecha_Modi, Usu_Modi) " +
                        "  VALUES (@prov, @loc, @calle, @altura, CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime), @usu)",
                        P("@prov", body.ProvID.Value), P("@loc", body.LocID.Value), P("@calle", calle),
                        P("@altura", altura.Length == 0 ? null : altura), P("@usu", usuario));
                    if (cambio)
                    {
                        db.Database.ExecuteSqlCommand("UPDATE dbo.ORIGEN SET Km_Galpon = NULL WHERE Km_Galpon IS NOT NULL");
                        db.Database.ExecuteSqlCommand("UPDATE dbo.DESTINO SET Km_Galpon = NULL WHERE Km_Galpon IS NOT NULL");
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

        private static object LugarDe(LugarRow l)
        {
            return new
            {
                l.Tipo, l.ID, l.Nombre,
                Direccion = GoogleMapsLinkBuilder.BuildAddress(l.Calle, l.AlturaCalle, l.Localidad, l.Provincia)
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

        // GET api/Costos/KmGalpon/Pendientes[?origen=ID&destino=ID] — los orígenes y destinos sin km al galpón (con
        // origen o destino, solo esos) y la dirección del galpón, para que el navegador los calcule con Google Maps.
        [HttpGet, Route("KmGalpon/Pendientes")]
        public IHttpActionResult KmGalponPendientes(int? origen = null, int? destino = null)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    ValidarSesion(db);
                    var galpon = LeerGalpon(db);
                    if (galpon == null) return Ok(new { Galpon = (string)null, Pendientes = new object[0] });
                    var solo = origen.HasValue || destino.HasValue;
                    var lugares = db.Database.SqlQuery<LugarRow>(SQL_LUGARES,
                        P("@origen", origen), P("@destino", destino), P("@solo", solo ? 1 : 0)).ToList();
                    return Ok(new { Galpon = DireccionGalpon(galpon), Pendientes = lugares.Select(LugarDe).ToList() });
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
                    var filas = db.Database.ExecuteSqlCommand(
                        "UPDATE dbo." + tabla + " SET Km_Galpon = @km WHERE " + (tabla == "ORIGEN" ? "Origen_ID" : "Destino_ID") + " = @id",
                        P("@km", decimal.Round(body.Km.Value, 1)), P("@id", body.ID));
                    if (filas == 0) return Content(HttpStatusCode.NotFound, new { message = "El origen o destino ya no existe." });
                    return Ok(new { body.Tipo, body.ID, Km = decimal.Round(body.Km.Value, 1) });
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
                "SUM(CASE WHEN v.Viaje_ID IS NOT NULL AND (o.Km_Galpon IS NULL OR d.Km_Galpon IS NULL OR " + SQL_KM_RUTA + " IS NULL) THEN 1 ELSE 0 END) AS Viajes_Sin_Km, " +
                "CAST(ISNULL(SUM(o.Km_Galpon + " + SQL_KM_RUTA + " + d.Km_Galpon), 0) AS decimal(12, 1)) AS Km_Recorridos " +
                "FROM dbo.CAMIONES c " +
                "LEFT JOIN dbo.VIAJES v ON v.CamionID = c.Camion_ID AND " + SQL_ENTREGADO + " " +
                "  AND c.Fecha_Km_Inicial IS NOT NULL AND CAST(v.Fecha_Inicio AS date) >= c.Fecha_Km_Inicial " +
                "LEFT JOIN dbo.ORIGEN o ON o.Origen_ID = v.OrigenID " +
                "LEFT JOIN dbo.DESTINO d ON d.Destino_ID = v.DestinoID " +
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
                        "v.OrigenID, ISNULL(o.Descripcion,'') AS Origen, o.Km_Galpon AS Km_Ida, " + SQL_KM_RUTA + " AS Km_Ruta, " +
                        "v.DestinoID, ISNULL(d.Descripcion,'') AS Destino, d.Km_Galpon AS Km_Vuelta, " +
                        "pg.Precio_Litro, pg.Vigente_Desde AS Precio_Desde, " +
                        (hayImporte ? "v.Importe" : "CAST(NULL AS decimal(18, 2))") + " AS Importe, ISNULL(v.Estado, 'Registrado') AS Estado " +
                        "FROM dbo.VIAJES v " +
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
                    var galpon = LeerGalpon(db);

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
