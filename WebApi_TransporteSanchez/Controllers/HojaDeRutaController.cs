using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Linq;
using WebApi_TransporteSanchez.Services.WhatsApp;

namespace WebApi_TransporteSanchez.Controllers
{
    // Hoja de ruta del chofer (24/10): el chofer entra con su usuario y ve y gestiona solo sus viajes, desde el celular.
    // El chofer sale SIEMPRE del token (USUARIOS.ChoferID del usuario que inició sesión), nunca de un parámetro: un chofer
    // no puede ver ni tocar los viajes de otro. Iniciar el viaje, registrar la entrega y la evidencia los resuelve
    // ViajesController, con las mismas reglas que Gestionar viajes; acá solo se controla que el viaje sea del chofer y
    // que le toque ese paso. Columna de database/hoja-de-ruta/01_usuario_chofer.sql (fuera del EDMX): SQL directo.
    // También el vínculo usuario → chofer de Gestionar usuarios (administradores o permiso "Gestión de usuarios").
    [RoutePrefix("api/HojaDeRuta")]
    public class HojaDeRutaController : ApiController
    {
        // Anteriores (Rocío, 24/10): por año y de a 30 ("Ver más viajes" pide 60, 90…), con un tope por pedido.
        private const int AnterioresPorPagina = 30;
        private const int AnterioresMaximo = 600;
        private static readonly string[] ResultadosEntrega = { "Completa", "Parcial", "Rechazo" };

        private class AccesoDenegadoException : Exception
        {
            public AccesoDenegadoException(string mensaje) : base(mensaje) { }
        }

        private class SesionRow
        {
            public int Usuario_ID { get; set; }
            public string Nombre_Usuario { get; set; }
            public bool EsAdmin { get; set; }
            public bool GestionaUsuarios { get; set; }
            public int? Chofer_ID { get; set; }
            public string Chofer { get; set; }
        }

        private class ViajeDelChoferRow
        {
            public int Viaje_ID { get; set; }
            public string Estado { get; set; }
            public string Tipo_Cliente { get; set; }
            public DateTime Fecha_Inicio { get; set; }
            public DateTime Fecha_Fin { get; set; }
            public DateTime? Fecha_Entrega { get; set; }
            public bool Tiene_Evidencia { get; set; }
            public string EnProforma_Numero { get; set; }
            public string EnProforma_Estado { get; set; }
        }

        private class CantidadesRow
        {
            public int Proximos { get; set; }
            public int Anteriores { get; set; }
        }

        private class ViajeRow
        {
            public int Viaje_ID { get; set; }
            public DateTime Fecha_Inicio { get; set; }
            public DateTime Fecha_Fin { get; set; }
            public string Estado { get; set; }
            public string Tipo_Cliente { get; set; }
            public string Resultado_Entrega { get; set; }
            public DateTime? Fecha_Entrega { get; set; }
            public bool Tiene_Evidencia { get; set; }
            public string Cliente { get; set; }
            public string Origen { get; set; }
            public string Origen_Calle { get; set; }
            public string Origen_Altura { get; set; }
            public string Origen_Localidad { get; set; }
            public string Origen_Provincia { get; set; }
            public string Destino { get; set; }
            public string Destino_Calle { get; set; }
            public string Destino_Altura { get; set; }
            public string Destino_Localidad { get; set; }
            public string Destino_Provincia { get; set; }
            public string Camion { get; set; }
            public string Camion_Detalle { get; set; }
            public string Distancia_KM { get; set; }
            public string Num_Remito { get; set; }
            public string Num_de_Carga { get; set; }
            public string Num_Transporte { get; set; }
            public string EnProforma_Numero { get; set; }
            public string EnProforma_Estado { get; set; }
            public int Gastos_Cantidad { get; set; }
            public decimal Gastos_Total { get; set; }
            public decimal? Km_Ida { get; set; }
            public decimal? Km_Vuelta { get; set; }
            public int? Galpon_ID { get; set; }
        }

        public class EntregaChoferDto
        {
            public string Resultado_Entrega { get; set; }
            public DateTime? Fecha_Entrega { get; set; }
        }

        public class SinCargaChoferDto
        {
            public string Observacion { get; set; }
        }

        public class EvidenciaChoferDto
        {
            public string Nombre_Archivo { get; set; }
            public string Content_Type { get; set; }
            public string ContenidoBase64 { get; set; }
        }

        // Un gasto del viaje que rinde el chofer (control interno, 24/10): combustible con sus litros, peaje, comida u
        // otro, con la foto o el PDF del ticket.
        public class GastoChoferDto : Viajes.GastosDelViaje.Datos { }

        private class GastoDelChoferRow
        {
            public int Gasto_ID { get; set; }
            public int Viaje_ID { get; set; }
            public string Tipo { get; set; }
            public decimal Importe { get; set; }
            public string Nombre_Archivo { get; set; }
            public string Content_Type { get; set; }
            public byte[] Archivo { get; set; }
        }

        public class VinculoChoferDto
        {
            public int? ChoferID { get; set; }
        }

        public class ChoferVinculoRow
        {
            public int Chofer_ID { get; set; }
            public string Nombre { get; set; }
            public string Apellido { get; set; }
            public string DNI { get; set; }
            public string EstadoChofer { get; set; }
            public int? Usuario_ID { get; set; }
            public string Nombre_Usuario { get; set; }
        }

        private static string Cn() { return ConnectionStringHelper.GetConnectionString("SGTLEntities"); }
        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }


        // Los gastos, el galpón y los km al galpón son de database/costos/01_…: sin ese script la hoja de ruta funciona
        // igual, sin gastos y con el recorrido de origen a destino.
        private static bool HayGastos(SGTLAuditContext db)
        {
            return db.Database.SqlQuery<int?>("SELECT OBJECT_ID(N'dbo.VIAJE_GASTOS', N'U')").First().HasValue;
        }

        // Hoy en la Argentina, sin importar la hora del servidor (la base está en UTC: §2 de PENDIENTES-SISTEMA.md).
        private const string SQL_HOY = "CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS date)";

        // La proforma (no anulada) que incluye el viaje: el mismo criterio que ViajesController.
        private const string OUTER_APPLY_PROFORMA =
            "OUTER APPLY (SELECT TOP (1) p.Numero, p.Estado, p.Proforma_ID FROM dbo.PROFORMAS p " +
            "WHERE p.Estado <> 'Anulada' AND (" +
            "EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = p.Proforma_ID AND pv.ViajeID = v.Viaje_ID) " +
            "OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd WHERE pd.Proforma_ID = p.Proforma_ID " +
            "AND UPPER(LTRIM(RTRIM(ISNULL(pd.Codigo,'')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID))) " +
            "ORDER BY p.Proforma_ID DESC) pf ";

        private const string SQL_TIENE_EVIDENCIA =
            "CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.VIAJE_EVIDENCIA e WHERE e.Viaje_ID = v.Viaje_ID) THEN 1 ELSE 0 END AS bit)";

        // ---------------------------------------------------------------- Sesión

        // Usuario del token (Authorization: Bearer …), activo, con su chofer. Mismo criterio que EmpresaController.
        private SesionRow ValidarSesion(SGTLAuditContext db)
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

            var sesion = db.Database.SqlQuery<SesionRow>(@"
SELECT TOP (1) u.Usuario_ID, u.Nombre_Usuario,
  CAST(CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(u.Rol,'')))) = 'admin' THEN 1 ELSE 0 END AS bit) AS EsAdmin,
  CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.GRUPOS_USUARIOS gu
                         JOIN dbo.GRUPOS_MENU gm ON gm.GrupoID = gu.GrupoID
                         JOIN dbo.MENU m ON m.Menu_ID = gm.MenuID
                         WHERE gu.UsuarioID = u.Usuario_ID AND m.Menu_Nombre IN (N'Gestión de usuarios', N'Gestion de usuarios'))
       THEN 1 ELSE 0 END AS bit) AS GestionaUsuarios,
  c.Chofer_ID,
  LTRIM(RTRIM(ISNULL(c.Nombre,'') + ' ' + ISNULL(c.Apellido,''))) AS Chofer
FROM dbo.USUARIOS u
LEFT JOIN dbo.CHOFERES c ON c.Chofer_ID = u.ChoferID AND c.EstadoChofer <> 'Eliminado'
WHERE u.Nombre_Usuario = @nombre AND u.EstadoUsuario = 'Activo';", P("@nombre", nombre)).FirstOrDefault();
            if (sesion == null) throw new UnauthorizedAccessException();
            return sesion;
        }

        private static int ChoferDe(SesionRow sesion)
        {
            if (!sesion.Chofer_ID.HasValue)
                throw new AccesoDenegadoException("Tu usuario no tiene un chofer asignado. Pedile al administrador que te lo asigne en Gestionar usuarios.");
            return sesion.Chofer_ID.Value;
        }

        private static void ValidarGestionaUsuarios(SesionRow sesion)
        {
            if (!sesion.EsAdmin && !sesion.GestionaUsuarios)
                throw new AccesoDenegadoException("No tenés permiso para asignar choferes a los usuarios.");
        }

        private IHttpActionResult Error(Exception ex, string porDefecto)
        {
            if (ex is UnauthorizedAccessException)
                return Content(HttpStatusCode.Unauthorized, new { message = "Tu sesión venció. Volvé a iniciar sesión." });
            if (ex is AccesoDenegadoException)
                return Content(HttpStatusCode.Forbidden, new { message = ex.Message });
            var sql = ex as SqlException ?? ex.InnerException as SqlException ?? (ex.InnerException == null ? null : ex.InnerException.InnerException as SqlException);
            // 207 / 208: falta USUARIOS.ChoferID o la tabla de gastos (no se corrió el script de la base).
            if (sql != null && (sql.Number == 207 || sql.Number == 208))
                return Content(HttpStatusCode.Conflict, new { message = "La hoja de ruta todavía no está habilitada en la base. Avisale al administrador." });
            return Content(HttpStatusCode.InternalServerError, new { message = porDefecto });
        }

        private IHttpActionResult NoEstaEnTuHojaDeRuta()
        {
            return Content(HttpStatusCode.NotFound, new { message = "Ese viaje no está en tu hoja de ruta." });
        }

        private IHttpActionResult Rechazo(string mensaje)
        {
            return Content(HttpStatusCode.BadRequest, new { message = mensaje });
        }

        private static ViajeDelChoferRow ViajeDelChofer(SGTLAuditContext db, int choferId, int viajeId)
        {
            return db.Database.SqlQuery<ViajeDelChoferRow>(
                "SELECT v.Viaje_ID, v.Estado, ISNULL(c.Tipo_Cliente,'Directo') AS Tipo_Cliente, v.Fecha_Inicio, v.Fecha_Fin, v.Fecha_Entrega, " +
                SQL_TIENE_EVIDENCIA + " AS Tiene_Evidencia, ISNULL(pf.Numero,'') AS EnProforma_Numero, ISNULL(pf.Estado,'') AS EnProforma_Estado " +
                "FROM dbo.VIAJES v LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID " + OUTER_APPLY_PROFORMA +
                "WHERE v.Viaje_ID = @id AND v.ChoferID = @chofer",
                P("@id", viajeId), P("@chofer", choferId)).FirstOrDefault();
        }

        private static bool EsConPlataforma(string tipoCliente)
        {
            return string.Equals(tipoCliente, ClientesController.TipoConPlataforma, StringComparison.OrdinalIgnoreCase);
        }

        // En una proforma Generada o Aceptada el viaje ya forma parte de un documento emitido (como en ViajesController).
        private static bool BloqueaPorProforma(ViajeDelChoferRow v)
        {
            return v.EnProforma_Estado == "Generada" || v.EnProforma_Estado == "Aceptada";
        }

        private static string TextoProforma(ViajeDelChoferRow v)
        {
            return string.IsNullOrEmpty(v.EnProforma_Numero) ? "en borrador" : v.EnProforma_Numero;
        }

        // ---------------------------------------------------------------- Lo que resuelve ViajesController

        // El paso lo hace ViajesController (mismas reglas, auditoría y mensajes que Gestionar viajes), con el usuario del
        // token como autor. Sus rechazos llegan como lista de { PropertyName, ErrorMessage } y acá se pasan a
        // { message } (lo que lee SGTL.mensajeError); un error interno no se muestra (§9).
        private ViajesController ViajesDelSistema()
        {
            return new ViajesController { ControllerContext = ControllerContext };
        }

        private async Task<IHttpActionResult> Ejecutar(IHttpActionResult resultado, string porDefecto)
        {
            var respuesta = await resultado.ExecuteAsync(CancellationToken.None);
            if (respuesta.IsSuccessStatusCode) return ResponseMessage(respuesta);
            if (respuesta.StatusCode == HttpStatusCode.NotFound) return NoEstaEnTuHojaDeRuta();
            if (respuesta.StatusCode == HttpStatusCode.BadRequest)
            {
                var cuerpo = respuesta.Content == null ? "" : await respuesta.Content.ReadAsStringAsync();
                return Rechazo(MensajeDe(cuerpo) ?? porDefecto);
            }
            return Content(HttpStatusCode.InternalServerError, new { message = porDefecto });
        }

        private static string MensajeDe(string cuerpo)
        {
            try
            {
                var json = JToken.Parse(cuerpo);
                if (json.Type == JTokenType.Array)
                {
                    var mensajes = json.Children().Select(e => e.Type == JTokenType.Object ? (string)e["ErrorMessage"] : (string)e)
                        .Where(m => !string.IsNullOrWhiteSpace(m)).ToList();
                    return mensajes.Any() ? string.Join(" ", mensajes) : null;
                }
                if (json.Type == JTokenType.Object)
                    return (string)(json["message"] ?? json["Message"]);
                return json.Type == JTokenType.String ? (string)json : null;
            }
            catch
            {
                return null;
            }
        }

        // ---------------------------------------------------------------- Hoja de ruta

        // GET api/HojaDeRuta?vista=proximos|anteriores&anio=2026&cantidad=30
        // proximos (por defecto): lo que todavía tiene que hacer o que termina hoy o después; incluye el viaje en curso y
        // los de clientes directos que quedaron sin salir. anteriores: el resto, del año pedido (por defecto, el actual),
        // del más nuevo al más viejo y los primeros `cantidad` (Hay_Mas dice si quedan; Anios, los años con viajes
        // anteriores y el actual). Sin chofer asignado: { Vinculado = false } (la pantalla lo explica).
        [HttpGet, Route("")]
        public IHttpActionResult Get(string vista = null, int? anio = null, int? cantidad = null)
        {
            var anteriores = string.Equals((vista ?? "").Trim(), "anteriores", StringComparison.OrdinalIgnoreCase);
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    var hoy = db.Database.SqlQuery<DateTime>("SELECT CAST(" + SQL_HOY + " AS datetime)").First();
                    if (!sesion.Chofer_ID.HasValue)
                        return Ok(new { Vinculado = false, Chofer = "", Hoy = hoy, Gastos_Habilitados = false, Viajes = new object[0] });

                    // Los viajes de antes del circuito de estados no tienen Estado: cuentan como Registrado.
                    // Entre paréntesis: Anteriores es NOT de todo esto.
                    const string pendiente =
                        "((v.Fecha_Fin >= @hoy OR ISNULL(v.Estado,'Registrado') = 'En_viaje' " +
                        "OR (ISNULL(c.Tipo_Cliente,'Directo') <> 'Con_plataforma' AND ISNULL(v.Estado,'Registrado') = 'Registrado')) " +
                        // Un cancelado va a Anteriores, con su etiqueta y sin botones.
                        "AND ISNULL(v.Estado,'Registrado') <> 'Cancelado')";
                    // Anteriores: los del año pedido (un año que no tiene sentido, el actual).
                    var anioPedido = anio.HasValue && anio.Value >= 2000 && anio.Value <= hoy.Year ? anio.Value : hoy.Year;
                    var desde = new DateTime(anioPedido, 1, 1);
                    const string delAnio = "v.Fecha_Inicio >= @desde AND v.Fecha_Inicio < DATEADD(year, 1, @desde)";
                    var tope = anteriores ? Math.Max(1, Math.Min(cantidad ?? AnterioresPorPagina, AnterioresMaximo)) : 200;
                    var where = anteriores
                        ? " AND NOT " + pendiente + " AND " + delAnio + " ORDER BY v.Fecha_Inicio DESC, v.Viaje_ID DESC"
                        : " AND " + pendiente + " ORDER BY v.Fecha_Inicio, v.Viaje_ID";

                    var hayGastos = HayGastos(db);
                    // Cada viaje sale de su galpón (punto 28 de la §41, database/costos/02): sin ese script, el único que hay.
                    var porGalpon = hayGastos && CostosController.HayGalponesPorFecha(db);
                    // Uno más que el tope, para saber si quedan.
                    var filas = db.Database.SqlQuery<ViajeRow>(
                        "SELECT TOP (" + (tope + 1) + ") v.Viaje_ID, v.Fecha_Inicio, v.Fecha_Fin, v.Estado, ISNULL(c.Tipo_Cliente,'Directo') AS Tipo_Cliente, " +
                        (hayGastos
                            ? "(SELECT COUNT(*) FROM dbo.VIAJE_GASTOS g WHERE g.Viaje_ID = v.Viaje_ID) AS Gastos_Cantidad, " +
                              "(SELECT CAST(ISNULL(SUM(g.Importe), 0) AS decimal(12, 2)) FROM dbo.VIAJE_GASTOS g WHERE g.Viaje_ID = v.Viaje_ID) AS Gastos_Total, "
                            : "0 AS Gastos_Cantidad, CAST(0 AS decimal(12, 2)) AS Gastos_Total, ") +
                        // Recorrido completo para el chofer (Rocío, 24/10): galpón → origen → destino → galpón.
                        (porGalpon
                            ? "ki.Km AS Km_Ida, kv.Km AS Km_Vuelta, gv.Galpon_ID, "
                            : hayGastos
                            ? "o.Km_Galpon AS Km_Ida, d.Km_Galpon AS Km_Vuelta, CAST(NULL AS int) AS Galpon_ID, "
                            : "CAST(NULL AS decimal(9, 1)) AS Km_Ida, CAST(NULL AS decimal(9, 1)) AS Km_Vuelta, CAST(NULL AS int) AS Galpon_ID, ") +
                        "v.Resultado_Entrega, v.Fecha_Entrega, " + SQL_TIENE_EVIDENCIA + " AS Tiene_Evidencia, " +
                        "ISNULL(NULLIF(LTRIM(RTRIM(c.Nombre_Comercial)),''), ISNULL(c.Razon_Social,'')) AS Cliente, " +
                        "ISNULL(o.Descripcion,'') AS Origen, ISNULL(o.Calle,'') AS Origen_Calle, ISNULL(o.AlturaCalle,'') AS Origen_Altura, " +
                        "ISNULL(lo.Nombre_Localidad,'') AS Origen_Localidad, ISNULL(po.Nombre_Provincia,'') AS Origen_Provincia, " +
                        "ISNULL(d.Descripcion,'') AS Destino, ISNULL(d.Calle,'') AS Destino_Calle, ISNULL(d.AlturaCalle,'') AS Destino_Altura, " +
                        "ISNULL(ld.Nombre_Localidad,'') AS Destino_Localidad, ISNULL(pd.Nombre_Provincia,'') AS Destino_Provincia, " +
                        "ISNULL(cam.Dominio,'') AS Camion, LTRIM(RTRIM(ISNULL(cam.Marca,'') + ' ' + ISNULL(cam.Modelo,''))) AS Camion_Detalle, " +
                        "RTRIM(ISNULL(v.Distancia_KM,'')) AS Distancia_KM, RTRIM(ISNULL(v.Num_Remito,'')) AS Num_Remito, " +
                        "RTRIM(ISNULL(v.Num_de_Carga,'')) AS Num_de_Carga, RTRIM(ISNULL(v.Num_Transporte,'')) AS Num_Transporte, " +
                        "ISNULL(pf.Numero,'') AS EnProforma_Numero, ISNULL(pf.Estado,'') AS EnProforma_Estado " +
                        "FROM dbo.VIAJES v " +
                        "LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID " +
                        "LEFT JOIN dbo.ORIGEN o ON o.Origen_ID = v.OrigenID " +
                        "LEFT JOIN dbo.LOCALIDADES lo ON lo.Loc_ID = o.LocID " +
                        "LEFT JOIN dbo.PROVINCIAS po ON po.Prov_ID = o.ProvID " +
                        "LEFT JOIN dbo.DESTINO d ON d.Destino_ID = v.DestinoID " +
                        "LEFT JOIN dbo.LOCALIDADES ld ON ld.Loc_ID = d.LocID " +
                        "LEFT JOIN dbo.PROVINCIAS pd ON pd.Prov_ID = d.ProvID " +
                        "LEFT JOIN dbo.CAMIONES cam ON cam.Camion_ID = v.CamionID " +
                        (porGalpon ? CostosController.SQL_GALPON_DEL_VIAJE + CostosController.SQL_KM_GALPON_DEL_VIAJE : "") +
                        OUTER_APPLY_PROFORMA +
                        "WHERE v.ChoferID = @chofer" + where,
                        P("@chofer", sesion.Chofer_ID.Value), P("@hoy", hoy), P("@desde", desde)).ToList();
                    var hayMas = filas.Count > tope;
                    if (hayMas) filas = filas.Take(tope).ToList();

                    // La dirección de cada galpón, para el mapa y la navegación de cada viaje.
                    var galpones = porGalpon ? CostosController.LeerGalpones(db).ToDictionary(g => g.Galpon_ID, CostosController.DireccionGalpon)
                        : new Dictionary<int, string>();
                    var viajes = filas.Select(f =>
                    {
                        var dirOrigen = GoogleMapsLinkBuilder.BuildAddress(f.Origen_Calle, f.Origen_Altura, f.Origen_Localidad, f.Origen_Provincia);
                        var dirDestino = GoogleMapsLinkBuilder.BuildAddress(f.Destino_Calle, f.Destino_Altura, f.Destino_Localidad, f.Destino_Provincia);
                        var conDirecciones = SinPais(dirOrigen) != "" && SinPais(dirDestino) != "";
                        return new
                        {
                            f.Viaje_ID,
                            f.Fecha_Inicio,
                            f.Fecha_Fin,
                            Estado = string.IsNullOrEmpty(f.Estado) ? ViajesController.EstadoRegistrado : f.Estado,
                            f.Tipo_Cliente,
                            f.Resultado_Entrega,
                            f.Fecha_Entrega,
                            f.Tiene_Evidencia,
                            f.Cliente,
                            Origen = f.Origen.Trim(),
                            Origen_Direccion = SinPais(dirOrigen),
                            Destino = f.Destino.Trim(),
                            Destino_Direccion = SinPais(dirDestino),
                            // El mismo enlace que manda la hoja de ruta por WhatsApp (módulo de Fede); sin direcciones, ninguno.
                            Maps_Url = conDirecciones ? GoogleMapsLinkBuilder.BuildDrivingDirections(dirOrigen, dirDestino) : "",
                            Camion = f.Camion.Trim(),
                            Camion_Detalle = f.Camion_Detalle,
                            f.Distancia_KM,
                            f.Num_Remito,
                            f.Num_de_Carga,
                            f.Num_Transporte,
                            f.EnProforma_Numero,
                            f.EnProforma_Estado,
                            f.Gastos_Cantidad,
                            f.Gastos_Total,
                            f.Km_Ida,
                            f.Km_Vuelta,
                            Galpon = f.Galpon_ID.HasValue && galpones.ContainsKey(f.Galpon_ID.Value) ? galpones[f.Galpon_ID.Value] : null
                        };
                    }).ToList();

                    // Cuántos viajes hay en cada vista, para el selector (Rocío, 24/10): con las mismas condiciones que la lista
                    // (Anteriores, los del año elegido).
                    var cantidades = db.Database.SqlQuery<CantidadesRow>(
                        "SELECT ISNULL(SUM(CASE WHEN " + pendiente + " THEN 1 ELSE 0 END), 0) AS Proximos, " +
                        "ISNULL(SUM(CASE WHEN NOT " + pendiente + " AND " + delAnio + " THEN 1 ELSE 0 END), 0) AS Anteriores " +
                        "FROM dbo.VIAJES v LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID WHERE v.ChoferID = @chofer",
                        P("@chofer", sesion.Chofer_ID.Value), P("@hoy", hoy), P("@desde", desde)).First();

                    // Los años para elegir en Anteriores: los que tienen viajes anteriores y el actual, del más nuevo al más viejo.
                    List<int> anios = null;
                    if (anteriores)
                    {
                        anios = db.Database.SqlQuery<int>(
                            "SELECT DISTINCT YEAR(v.Fecha_Inicio) FROM dbo.VIAJES v LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID " +
                            "WHERE v.ChoferID = @chofer AND NOT " + pendiente,
                            P("@chofer", sesion.Chofer_ID.Value), P("@hoy", hoy)).ToList();
                        if (!anios.Contains(hoy.Year)) anios.Add(hoy.Year);
                        anios = anios.OrderByDescending(a => a).ToList();
                    }

                    // El galpón vigente hoy (el de cada viaje va en el viaje): el mapa del chofer muestra el recorrido entero y la
                    // navegación termina ahí.
                    var galpon = hayGastos ? CostosController.DireccionGalpon(CostosController.LeerGalpon(db)) : null;
                    return Ok(new
                    {
                        Vinculado = true, Chofer = sesion.Chofer, Hoy = hoy, Gastos_Habilitados = hayGastos, Galpon = galpon,
                        Cantidad_Proximos = cantidades.Proximos, Cantidad_Anteriores = cantidades.Anteriores,
                        Anio = anioPedido, Anios = anios, Hay_Mas = hayMas, Viajes = viajes
                    });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo cargar tu hoja de ruta. Revisá la conexión y probá de nuevo.");
            }
        }

        // "Av. Sabattini 5200, Córdoba, Córdoba, Argentina" → sin ", Argentina" (en pantalla sobra; Maps lo usa).
        private static string SinPais(string direccion)
        {
            const string pais = ", Argentina";
            direccion = direccion ?? "";
            if (direccion == "Argentina") return "";
            return direccion.EndsWith(pais, StringComparison.Ordinal) ? direccion.Substring(0, direccion.Length - pais.Length) : direccion;
        }

        // Un viaje se inicia solo el día de su fecha de inicio (Rocío, 27/10, punto 33 de la §41): si sale otro día, primero
        // administración corrige la fecha y la hora (así quedan bien la vuelta, los costos y la hoja de ruta).
        public static string MotivoFechaParaIniciar(DateTime inicio, DateTime hoy)
        {
            if (inicio.Date == hoy.Date) return null;
            return "No se puede iniciar el viaje: " + (inicio.Date > hoy.Date ? "es" : "era") + " del " + inicio.ToString("dd/MM/yyyy") +
                ". Si sale hoy, es necesario que administración corrija la fecha y la hora.";
        }

        // POST api/HojaDeRuta/Viajes/{id}/Iniciar — Registrado → En viaje (solo clientes directos, el día del viaje).
        [HttpPost, Route("Viajes/{id:int}/Iniciar")]
        public async Task<IHttpActionResult> Iniciar(int id)
        {
            const string porDefecto = "No se pudo iniciar el viaje. Probá de nuevo.";
            try
            {
                SesionRow sesion;
                ViajeDelChoferRow v;
                DateTime hoy;
                using (var db = new SGTLAuditContext(Cn()))
                {
                    sesion = ValidarSesion(db);
                    v = ViajeDelChofer(db, ChoferDe(sesion), id);
                    hoy = db.Database.SqlQuery<DateTime>("SELECT CAST(" + SQL_HOY + " AS datetime)").First();
                }
                if (v == null) return NoEstaEnTuHojaDeRuta();
                if (EsConPlataforma(v.Tipo_Cliente)) return Rechazo("No se puede iniciar el viaje: lo sigue la plataforma del cliente.");
                if (v.Estado == ViajesController.EstadoCancelado) return Rechazo("No se puede iniciar el viaje: está cancelado.");
                if (!string.IsNullOrEmpty(v.Estado) && v.Estado != ViajesController.EstadoRegistrado)
                    return Rechazo("No se puede iniciar el viaje: ya está " + TextoEstado(v.Estado) + ".");
                if (BloqueaPorProforma(v)) return Rechazo("No se puede iniciar el viaje: está en la proforma " + TextoProforma(v) + ".");
                var motivoFecha = MotivoFechaParaIniciar(v.Fecha_Inicio, hoy);
                if (motivoFecha != null) return Rechazo(motivoFecha);

                using (var viajes = ViajesDelSistema())
                {
                    return await Ejecutar(viajes.CambiarEstado(id, new ViajesController.CambioEstadoViajeDto
                    {
                        Estado = ViajesController.EstadoEnViaje,
                        Usuario = sesion.Nombre_Usuario
                    }), porDefecto);
                }
            }
            catch (Exception ex)
            {
                return Error(ex, porDefecto);
            }
        }

        // POST api/HojaDeRuta/Viajes/{id}/Entrega — En viaje → Entregado (solo clientes directos), con resultado y fecha.
        // La evidencia se sube antes (POST …/Evidencia): ViajesController la exige para entregar un viaje directo.
        [HttpPost, Route("Viajes/{id:int}/Entrega")]
        public async Task<IHttpActionResult> Entrega(int id, [FromBody] EntregaChoferDto body)
        {
            const string porDefecto = "No se pudo registrar la entrega. Probá de nuevo.";
            var resultado = body == null ? null : (body.Resultado_Entrega ?? "").Trim();
            try
            {
                SesionRow sesion;
                ViajeDelChoferRow v;
                DateTime hoy;
                using (var db = new SGTLAuditContext(Cn()))
                {
                    sesion = ValidarSesion(db);
                    v = ViajeDelChofer(db, ChoferDe(sesion), id);
                    hoy = db.Database.SqlQuery<DateTime>("SELECT CAST(" + SQL_HOY + " AS datetime)").First();
                }
                if (v == null) return NoEstaEnTuHojaDeRuta();
                if (string.IsNullOrEmpty(resultado) || Array.IndexOf(ResultadosEntrega, resultado) < 0)
                    return Rechazo("Seleccioná el resultado de la entrega.");
                if (body.Fecha_Entrega == null)
                    return Rechazo("Completá la fecha de entrega.");
                if (EsConPlataforma(v.Tipo_Cliente)) return Rechazo("No se puede registrar la entrega: lo sigue la plataforma del cliente.");
                if (v.Estado == ViajesController.EstadoCancelado) return Rechazo("No se puede registrar la entrega: el viaje está cancelado.");
                if (v.Estado != ViajesController.EstadoEnViaje)
                    return Rechazo(string.IsNullOrEmpty(v.Estado) || v.Estado == ViajesController.EstadoRegistrado
                        ? "No se puede registrar la entrega: el viaje todavía no se inició."
                        : "No se puede registrar la entrega: el viaje ya está " + TextoEstado(v.Estado) + ".");
                if (body.Fecha_Entrega.Value.Date > hoy.Date)
                    return Rechazo("La fecha de entrega no puede ser posterior a hoy.");
                if (BloqueaPorProforma(v)) return Rechazo("No se puede registrar la entrega: el viaje está en la proforma " + TextoProforma(v) + ".");

                using (var viajes = ViajesDelSistema())
                {
                    return await Ejecutar(viajes.CambiarEstado(id, new ViajesController.CambioEstadoViajeDto
                    {
                        Estado = ViajesController.EstadoEntregado,
                        Resultado_Entrega = resultado,
                        Fecha_Entrega = body.Fecha_Entrega.Value.Date,
                        Usuario = sesion.Nombre_Usuario
                    }), porDefecto);
                }
            }
            catch (Exception ex)
            {
                return Error(ex, porDefecto);
            }
        }

        // POST api/HojaDeRuta/Viajes/{id}/SinCarga — En viaje → Sin carga (punto 10 de la §41; antes "falso flete"): el chofer
        // llegó al origen y no había carga. Con una observación opcional; la fecha es hoy. Solo clientes directos (los de
        // plataforma los marca administración). ViajesController calcula lo que se cobra.
        [HttpPost, Route("Viajes/{id:int}/SinCarga")]
        public async Task<IHttpActionResult> SinCarga(int id, [FromBody] SinCargaChoferDto body)
        {
            const string porDefecto = "No se pudo registrar el viaje sin carga. Probá de nuevo.";
            try
            {
                SesionRow sesion;
                ViajeDelChoferRow v;
                DateTime hoy;
                using (var db = new SGTLAuditContext(Cn()))
                {
                    sesion = ValidarSesion(db);
                    v = ViajeDelChofer(db, ChoferDe(sesion), id);
                    hoy = db.Database.SqlQuery<DateTime>("SELECT CAST(" + SQL_HOY + " AS datetime)").First();
                }
                if (v == null) return NoEstaEnTuHojaDeRuta();
                if (EsConPlataforma(v.Tipo_Cliente)) return Rechazo("No se puede registrar sin carga: lo sigue la plataforma del cliente.");
                if (v.Estado != ViajesController.EstadoEnViaje)
                    return Rechazo(string.IsNullOrEmpty(v.Estado) || v.Estado == ViajesController.EstadoRegistrado
                        ? "No se puede registrar sin carga: el viaje todavía no se inició."
                        : "No se puede registrar sin carga: el viaje está " + TextoEstado(v.Estado) + ".");
                if (BloqueaPorProforma(v)) return Rechazo("No se puede registrar sin carga: el viaje está en la proforma " + TextoProforma(v) + ".");

                using (var viajes = ViajesDelSistema())
                {
                    return await Ejecutar(viajes.CambiarEstado(id, new ViajesController.CambioEstadoViajeDto
                    {
                        Estado = ViajesController.EstadoSinCarga,
                        Fecha_Entrega = hoy.Date,
                        Motivo = body == null ? null : body.Observacion,
                        Usuario = sesion.Nombre_Usuario
                    }), porDefecto);
                }
            }
            catch (Exception ex)
            {
                return Error(ex, porDefecto);
            }
        }

        // POST api/HojaDeRuta/Viajes/{id}/Evidencia — foto o PDF del remito (reemplaza la anterior). Solo viajes directos
        // en viaje (se sube justo antes de registrar la entrega) o entregados (para reemplazarla); los de plataforma los
        // registra el chofer en la plataforma (decisión de Rocío, 24/10). Tipos y tamaño: ViajesController (5 MB).
        [HttpPost, Route("Viajes/{id:int}/Evidencia")]
        public async Task<IHttpActionResult> SubirEvidencia(int id, [FromBody] EvidenciaChoferDto body)
        {
            const string porDefecto = "No se pudo subir la evidencia. Probá de nuevo.";
            if (body == null || string.IsNullOrWhiteSpace(body.ContenidoBase64))
                return Rechazo("Elegí la foto o el PDF del remito.");
            try
            {
                SesionRow sesion;
                ViajeDelChoferRow v;
                using (var db = new SGTLAuditContext(Cn()))
                {
                    sesion = ValidarSesion(db);
                    v = ViajeDelChofer(db, ChoferDe(sesion), id);
                }
                if (v == null) return NoEstaEnTuHojaDeRuta();
                if (EsConPlataforma(v.Tipo_Cliente))
                    return Rechazo("No se puede subir la evidencia: este viaje lo sigue la plataforma del cliente.");
                if (v.Estado == ViajesController.EstadoFacturado)
                    return Rechazo("No se puede subir la evidencia: el viaje ya está facturado.");
                if (v.Estado == ViajesController.EstadoCancelado)
                    return Rechazo("No se puede subir la evidencia: el viaje está cancelado.");
                if (v.Estado != ViajesController.EstadoEnViaje && v.Estado != ViajesController.EstadoEntregado)
                    return Rechazo("No se puede subir la evidencia: el viaje todavía no se inició.");

                using (var viajes = ViajesDelSistema())
                {
                    return await Ejecutar(viajes.SubirEvidencia(id, new ViajesController.EvidenciaDto
                    {
                        Nombre_Archivo = body.Nombre_Archivo,
                        Content_Type = body.Content_Type,
                        ContenidoBase64 = body.ContenidoBase64,
                        Usuario = sesion.Nombre_Usuario
                    }), porDefecto);
                }
            }
            catch (Exception ex)
            {
                return Error(ex, porDefecto);
            }
        }

        // GET api/HojaDeRuta/Viajes/{id}/Evidencia — el archivo, solo si el viaje es del chofer.
        [HttpGet, Route("Viajes/{id:int}/Evidencia")]
        public async Task<IHttpActionResult> VerEvidencia(int id)
        {
            const string porDefecto = "No se pudo abrir la evidencia. Probá de nuevo.";
            try
            {
                ViajeDelChoferRow v;
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    v = ViajeDelChofer(db, ChoferDe(sesion), id);
                }
                if (v == null) return NoEstaEnTuHojaDeRuta();
                if (!v.Tiene_Evidencia) return Content(HttpStatusCode.NotFound, new { message = "El viaje no tiene evidencia cargada." });

                using (var viajes = ViajesDelSistema())
                {
                    var respuesta = viajes.DescargarEvidencia(id);
                    if (respuesta.IsSuccessStatusCode) return ResponseMessage(respuesta);
                    return await Ejecutar(ResponseMessage(respuesta), porDefecto);
                }
            }
            catch (Exception ex)
            {
                return Error(ex, porDefecto);
            }
        }

        // ---------------------------------------------------------------- Gastos del viaje (rendición del chofer)

        private static List<CostosController.GastoRow> LeerGastos(SGTLAuditContext db, int viajeId)
        {
            return db.Database.SqlQuery<CostosController.GastoRow>(
                "SELECT Gasto_ID, Tipo, Fecha, Importe, Litros, Detalle, Nombre_Archivo, Usu_Alta FROM dbo.VIAJE_GASTOS " +
                "WHERE Viaje_ID = @id ORDER BY Fecha, Gasto_ID", P("@id", viajeId)).ToList();
        }

        // GET api/HojaDeRuta/Viajes/{id}/Gastos — los gastos que cargó el chofer en su viaje.
        [HttpGet, Route("Viajes/{id:int}/Gastos")]
        public IHttpActionResult Gastos(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    var v = ViajeDelChofer(db, ChoferDe(sesion), id);
                    if (v == null) return NoEstaEnTuHojaDeRuta();
                    var gastos = LeerGastos(db, id);
                    return Ok(new { Viaje_ID = id, Gastos = gastos, Total = gastos.Sum(g => g.Importe) });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudieron cargar los gastos del viaje. Probá de nuevo.");
            }
        }

        // POST api/HojaDeRuta/Viajes/{id}/Gastos — un gasto con la foto o el PDF del ticket: desde que inicia el viaje y
        // hasta 2 días después de la entrega (Viajes/GastosDelViaje.cs).
        [HttpPost, Route("Viajes/{id:int}/Gastos")]
        public IHttpActionResult CargarGasto(int id, [FromBody] GastoChoferDto body)
        {
            const string porDefecto = "No se pudo cargar el gasto. Probá de nuevo.";
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    var v = ViajeDelChofer(db, ChoferDe(sesion), id);
                    if (v == null) return NoEstaEnTuHojaDeRuta();
                    var hoy = db.Database.SqlQuery<DateTime>("SELECT CAST(" + SQL_HOY + " AS datetime)").First().Date;
                    var motivo = Viajes.GastosDelViaje.MotivoChofer("cargar", v.Estado, EsConPlataforma(v.Tipo_Cliente), v.Fecha_Inicio, v.Fecha_Fin, v.Fecha_Entrega, hoy);
                    if (motivo != null) return Rechazo(motivo);
                    var error = Viajes.GastosDelViaje.Guardar(db, id, v.Fecha_Inicio, hoy, body, sesion.Nombre_Usuario, Cn());
                    if (error != null) return Rechazo(error);
                    var gastos = LeerGastos(db, id);
                    return Ok(new { Viaje_ID = id, Gastos = gastos, Total = gastos.Sum(g => g.Importe) });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, porDefecto);
            }
        }

        // DELETE api/HojaDeRuta/Viajes/{id}/Gastos/{gastoId} — el chofer corrige un gasto mal cargado, mientras puede cargarlos.
        [HttpDelete, Route("Viajes/{id:int}/Gastos/{gastoId:int}")]
        public IHttpActionResult EliminarGasto(int id, int gastoId)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    var v = ViajeDelChofer(db, ChoferDe(sesion), id);
                    if (v == null) return NoEstaEnTuHojaDeRuta();
                    var hoy = db.Database.SqlQuery<DateTime>("SELECT CAST(" + SQL_HOY + " AS datetime)").First().Date;
                    var motivo = Viajes.GastosDelViaje.MotivoChofer("eliminar", v.Estado, EsConPlataforma(v.Tipo_Cliente), v.Fecha_Inicio, v.Fecha_Fin, v.Fecha_Entrega, hoy);
                    if (motivo != null) return Rechazo(motivo);
                    var gasto = db.Database.SqlQuery<GastoDelChoferRow>(
                        "SELECT Gasto_ID, Viaje_ID, Tipo, Importe, Nombre_Archivo, Content_Type, CAST(NULL AS varbinary(max)) AS Archivo " +
                        "FROM dbo.VIAJE_GASTOS WHERE Gasto_ID = @gasto AND Viaje_ID = @viaje", P("@gasto", gastoId), P("@viaje", id)).FirstOrDefault();
                    if (gasto == null) return Content(HttpStatusCode.NotFound, new { message = "El gasto ya no existe." });
                    db.Database.ExecuteSqlCommand("DELETE FROM dbo.VIAJE_GASTOS WHERE Gasto_ID = @gasto", P("@gasto", gastoId));
                    SGTLAuditContext.RegistrarEvento(Cn(), Recortar(sesion.Nombre_Usuario, 20), "DELETE", "VIAJE_GASTOS", "Gasto_ID=" + gastoId,
                        "Viaje #" + id + ": " + gasto.Tipo + " " + gasto.Importe.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture));
                    var gastos = LeerGastos(db, id);
                    return Ok(new { Viaje_ID = id, Gastos = gastos, Total = gastos.Sum(g => g.Importe) });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo eliminar el gasto. Probá de nuevo.");
            }
        }

        // GET api/HojaDeRuta/Gastos/{gastoId}/Comprobante — el ticket, solo si el gasto es de un viaje del chofer.
        [HttpGet, Route("Gastos/{gastoId:int}/Comprobante")]
        public IHttpActionResult ComprobanteGasto(int gastoId)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    var gasto = db.Database.SqlQuery<GastoDelChoferRow>(
                        "SELECT g.Gasto_ID, g.Viaje_ID, g.Tipo, g.Importe, g.Nombre_Archivo, g.Content_Type, g.Archivo " +
                        "FROM dbo.VIAJE_GASTOS g JOIN dbo.VIAJES v ON v.Viaje_ID = g.Viaje_ID " +
                        "WHERE g.Gasto_ID = @gasto AND v.ChoferID = @chofer", P("@gasto", gastoId), P("@chofer", ChoferDe(sesion))).FirstOrDefault();
                    if (gasto == null) return Content(HttpStatusCode.NotFound, new { message = "Ese gasto no está en tu hoja de ruta." });
                    return ResponseMessage(CostosController.ArchivoComoRespuesta(gasto.Archivo, gasto.Content_Type, gasto.Nombre_Archivo));
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo abrir el ticket. Probá de nuevo.");
            }
        }

        private static string TextoEstado(string estado)
        {
            switch (estado)
            {
                case "En_viaje": return "en viaje";
                case "Entregado": return "entregado";
                case "Listo_para_facturar": return "listo para facturar";
                case "Facturado": return "facturado";
                default: return (estado ?? "").Replace('_', ' ').ToLowerInvariant();
            }
        }

        // ---------------------------------------------------------------- Vínculo usuario → chofer (Gestionar usuarios)

        // GET api/HojaDeRuta/Choferes — los choferes que se pueden asignar a un usuario, con el usuario que ya tiene cada uno.
        [HttpGet, Route("Choferes")]
        public IHttpActionResult Choferes()
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    ValidarGestionaUsuarios(ValidarSesion(db));
                    var choferes = db.Database.SqlQuery<ChoferVinculoRow>(
                        "SELECT c.Chofer_ID, ISNULL(c.Nombre,'') AS Nombre, ISNULL(c.Apellido,'') AS Apellido, ISNULL(c.DNI,'') AS DNI, " +
                        "ISNULL(c.EstadoChofer,'') AS EstadoChofer, u.Usuario_ID, u.Nombre_Usuario " +
                        "FROM dbo.CHOFERES c LEFT JOIN dbo.USUARIOS u ON u.ChoferID = c.Chofer_ID " +
                        "WHERE c.EstadoChofer <> 'Eliminado' ORDER BY c.Apellido, c.Nombre").ToList();
                    return Ok(choferes);
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudieron cargar los choferes. Revisá la conexión y probá de nuevo.");
            }
        }

        // GET api/HojaDeRuta/Usuarios/{id}/Chofer — el chofer asignado al usuario (ChoferID null si no es chofer).
        [HttpGet, Route("Usuarios/{id:int}/Chofer")]
        public IHttpActionResult ChoferDelUsuario(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    ValidarGestionaUsuarios(ValidarSesion(db));
                    var fila = db.Database.SqlQuery<int?>("SELECT ChoferID FROM dbo.USUARIOS WHERE Usuario_ID = @id", P("@id", id)).ToList();
                    if (!fila.Any()) return Content(HttpStatusCode.NotFound, new { message = "El usuario ya no existe." });
                    return Ok(new { ChoferID = fila[0] });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, "No se pudo leer el chofer del usuario. Probá de nuevo.");
            }
        }

        // PUT api/HojaDeRuta/Usuarios/{id}/Chofer { ChoferID } — asigna (o quita, con null) el chofer del usuario.
        // Un chofer, una sola cuenta: si ya la tiene otro usuario, se rechaza (también lo asegura UX_Usuarios_ChoferID).
        [HttpPut, Route("Usuarios/{id:int}/Chofer")]
        public IHttpActionResult AsignarChofer(int id, [FromBody] VinculoChoferDto body)
        {
            const string porDefecto = "No se pudo asignar el chofer. Probá de nuevo.";
            var choferId = body == null || !body.ChoferID.HasValue || body.ChoferID.Value <= 0 ? (int?)null : body.ChoferID.Value;
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var sesion = ValidarSesion(db);
                    ValidarGestionaUsuarios(sesion);

                    var anterior = db.Database.SqlQuery<int?>("SELECT ChoferID FROM dbo.USUARIOS WHERE Usuario_ID = @id", P("@id", id)).ToList();
                    if (!anterior.Any()) return Content(HttpStatusCode.NotFound, new { message = "El usuario ya no existe." });
                    if (anterior[0] == choferId) return Ok(new { ChoferID = choferId });

                    if (choferId.HasValue)
                    {
                        var chofer = db.Database.SqlQuery<ChoferVinculoRow>(
                            "SELECT c.Chofer_ID, ISNULL(c.Nombre,'') AS Nombre, ISNULL(c.Apellido,'') AS Apellido, ISNULL(c.DNI,'') AS DNI, " +
                            "ISNULL(c.EstadoChofer,'') AS EstadoChofer, u.Usuario_ID, u.Nombre_Usuario " +
                            "FROM dbo.CHOFERES c LEFT JOIN dbo.USUARIOS u ON u.ChoferID = c.Chofer_ID AND u.Usuario_ID <> @usuario " +
                            "WHERE c.Chofer_ID = @chofer AND c.EstadoChofer <> 'Eliminado'",
                            P("@chofer", choferId.Value), P("@usuario", id)).FirstOrDefault();
                        if (chofer == null) return Rechazo("El chofer elegido ya no existe. Elegí otro.");
                        if (chofer.Usuario_ID.HasValue)
                            return Rechazo("El chofer " + (chofer.Nombre + " " + chofer.Apellido).Trim() + " ya tiene usuario: " + chofer.Nombre_Usuario + ".");
                    }

                    try
                    {
                        db.Database.ExecuteSqlCommand("UPDATE dbo.USUARIOS SET ChoferID = @chofer WHERE Usuario_ID = @id",
                            P("@chofer", choferId), P("@id", id));
                    }
                    catch (SqlException ex) when (ex.Number == 2601 || ex.Number == 2627)
                    {
                        return Rechazo("Ese chofer ya tiene usuario. Elegí otro.");
                    }

                    SGTLAuditContext.RegistrarEvento(Cn(), Recortar(sesion.Nombre_Usuario, 20), "UPDATE", "USUARIOS", "Usuario_ID=" + id,
                        "ChoferID: " + (anterior[0].HasValue ? anterior[0].Value.ToString() : "ninguno") + " -> " + (choferId.HasValue ? choferId.Value.ToString() : "ninguno"));
                    return Ok(new { ChoferID = choferId });
                }
            }
            catch (Exception ex)
            {
                return Error(ex, porDefecto);
            }
        }

        private static string Recortar(string s, int max)
        {
            s = (s ?? "").Trim();
            return s.Length > max ? s.Substring(0, max) : s;
        }
    }
}
