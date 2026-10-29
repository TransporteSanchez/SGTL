using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Http;
using WebApi_TransporteSanchez.Security;

namespace WebApi_TransporteSanchez.Controllers
{
    /// <summary>
    /// Tableros (24/10): los favoritos del dashboard de cada usuario y los datos de facturación de la pantalla Tableros.
    /// - Favoritos: tablas del script database/tableros/01_crear_tableros_favoritos.sql (fuera del EDMX). El usuario sale
    ///   del token (Authorization: Bearer …), nunca de un parámetro: cada uno lee y guarda solo los suyos.
    /// - Facturación por cliente y deuda vencida: solo lectura de los comprobantes de cuenta corriente (módulo de Facu),
    ///   con las mismas cuentas que CuentaCorrienteController (top clientes y saldo). No escribe nada ahí.
    /// Los datos de viajes de los tableros siguen saliendo de api/Viajes/Buscar.
    /// </summary>
    [RoutePrefix("api/tableros")]
    public class TablerosController : ApiController
    {
        public class FavoritoDto
        {
            public string Tablero { get; set; }
            public int? X { get; set; }
            public int? Y { get; set; }
            public int? Ancho { get; set; }
            public int? Alto { get; set; }
        }

        public class FavoritosRequest
        {
            public List<FavoritoDto> Favoritos { get; set; }
        }

        public class FacturacionDto
        {
            public int ClienteID { get; set; }
            public string Cliente { get; set; }
            public DateTime Fecha { get; set; }
            public decimal Total { get; set; }
            public int Comprobantes { get; set; }
        }

        public class TopClienteFacturacionDto
        {
            public int ClienteID { get; set; }
            public string RazonSocial { get; set; }
            public decimal Facturacion { get; set; }
        }

        public class DeudaDto
        {
            public int ClienteID { get; set; }
            public string Cliente { get; set; }
            public decimal Vencida { get; set; }
            public decimal PorVencer { get; set; }
            public int ComprobantesVencidos { get; set; }
            public DateTime? VencimientoMasViejo { get; set; }
            // Antigüedad de lo vencido (días desde el vencimiento): la suma de los cuatro tramos es Vencida.
            public decimal Vencida1a30 { get; set; }
            public decimal Vencida31a60 { get; set; }
            public decimal Vencida61a90 { get; set; }
            public decimal VencidaMas90 { get; set; }
        }

        private class UsuarioSesion
        {
            public int Id { get; set; }
            public string Nombre { get; set; }
            public bool EsAdmin { get; set; }
            public bool EsChofer { get; set; }
        }

        // Claves de tableros-catalogo.js ("kpiviajes", "kmcamionmes"), validadas por tema en PermisosTableros.
        private static readonly Regex FormatoTablero = new Regex(@"^[a-z0-9-]{1,40}$");
        private const int MaximoFavoritos = 60;
        private const int MaximoDiasPeriodo = 1100;   // unos 3 años: el tablero pide un período, no toda la historia

        private static string ConnectionString()
        {
            return new EntityConnectionStringBuilder(ConnectionStringHelper.GetConnectionString("SGTLEntities")).ProviderConnectionString;
        }

        private static SqlParameter P(string nombre, object valor) { return new SqlParameter(nombre, valor ?? DBNull.Value); }

        private static int? Entero(SqlDataReader r, string columna)
        {
            object valor = r[columna];
            return valor == DBNull.Value ? (int?)null : Convert.ToInt32(valor, CultureInfo.InvariantCulture);
        }

        private static decimal Importe(SqlDataReader r, string columna)
        {
            object valor = r[columna];
            return valor == DBNull.Value ? 0m : Convert.ToDecimal(valor, CultureInfo.InvariantCulture);
        }

        // Fecha y hora de Argentina (como EmpresaController y FacturasController): la base de Azure está en UTC.
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

        private IHttpActionResult SinCache<T>(T contenido)
        {
            var respuesta = Request.CreateResponse(HttpStatusCode.OK, contenido);
            respuesta.Headers.CacheControl = new CacheControlHeaderValue { NoCache = true, NoStore = true, MustRevalidate = true };
            return ResponseMessage(respuesta);
        }

        private IHttpActionResult Rechazo(string mensaje)
        {
            return Content(HttpStatusCode.BadRequest, new { mensaje = mensaje });
        }

        private IHttpActionResult ErrorInterno(string mensaje)
        {
            return Content(HttpStatusCode.InternalServerError, new { mensaje = mensaje });
        }

        // ---------------------------------------------------------------- Favoritos

        // GET api/tableros/favoritos → { Personalizado, TemasPermitidos, Favoritos: [{ Tablero, X, Y, Ancho, Alto }] }.
        // Personalizado = false: el usuario nunca eligió (el dashboard muestra el diseño por defecto).
        [HttpGet, Route("favoritos")]
        public IHttpActionResult GetFavoritos()
        {
            try
            {
                using (var conexion = new SqlConnection(ConnectionString()))
                {
                    conexion.Open();
                    UsuarioSesion usuario = UsuarioDelToken(conexion);
                    if (usuario == null) return Unauthorized();

                    var temasPermitidos = ObtenerTemasPermitidos(conexion, usuario);
                    bool personalizado;
                    using (var comando = new SqlCommand("SELECT COUNT(*) FROM dbo.TABLEROS_USUARIO WHERE Usuario_ID=@usuario;", conexion))
                    {
                        comando.Parameters.Add(P("@usuario", usuario.Id));
                        personalizado = Convert.ToInt32(comando.ExecuteScalar(), CultureInfo.InvariantCulture) > 0;
                    }

                    var favoritos = new List<FavoritoDto>();
                    using (var comando = new SqlCommand(@"
SELECT Tablero, Pos_X, Pos_Y, Ancho, Alto
FROM dbo.TABLEROS_FAVORITOS
WHERE Usuario_ID=@usuario
ORDER BY Orden, Tablero;", conexion))
                    {
                        comando.Parameters.Add(P("@usuario", usuario.Id));
                        using (var r = comando.ExecuteReader())
                        {
                            while (r.Read())
                            {
                                favoritos.Add(new FavoritoDto
                                {
                                    Tablero = Convert.ToString(r["Tablero"], CultureInfo.InvariantCulture).Trim(),
                                    X = Entero(r, "Pos_X"),
                                    Y = Entero(r, "Pos_Y"),
                                    Ancho = Entero(r, "Ancho"),
                                    Alto = Entero(r, "Alto")
                                });
                            }
                        }
                    }
                    return SinCache(new
                    {
                        Personalizado = personalizado,
                        TemasPermitidos = temasPermitidos,
                        Favoritos = favoritos.Where(f => temasPermitidos.Contains(PermisosTableros.TemaDeTablero(f.Tablero))).ToList()
                    });
                }
            }
            catch (Exception)
            {
                return ErrorInterno("No se pudieron leer tus tableros favoritos. Probá de nuevo.");
            }
        }

        // PUT api/tableros/favoritos { Favoritos: [...] } → reemplaza los favoritos de los temas permitidos (el orden es el de la
        // lista). La usan la estrella de Tableros y Guardar de Personalizar en el dashboard. Una lista vacía también se
        // guarda: el usuario sacó todos los tableros de su dashboard.
        [HttpPut, Route("favoritos")]
        public IHttpActionResult PutFavoritos([FromBody] FavoritosRequest datos)
        {
            var lista = (datos == null ? null : datos.Favoritos) ?? new List<FavoritoDto>();
            string error = ValidarFavoritos(lista);
            if (error != null) return Rechazo(error);

            try
            {
                using (var conexion = new SqlConnection(ConnectionString()))
                {
                    conexion.Open();
                    UsuarioSesion usuario = UsuarioDelToken(conexion);
                    if (usuario == null) return Unauthorized();

                    var clavesPermitidas = PermisosTableros.TablerosPara(ObtenerTemasPermitidos(conexion, usuario));
                    if (lista.Any(f => !clavesPermitidas.Contains(f.Tablero.Trim())))
                        return Content(HttpStatusCode.Forbidden, new { mensaje = "No tenés permiso para guardar uno de los tableros." });

                    using (var transaccion = conexion.BeginTransaction())
                    {
                        using (var comando = new SqlCommand(@"
UPDATE dbo.TABLEROS_USUARIO SET Fecha_Modi=@fecha WHERE Usuario_ID=@usuario;
IF @@ROWCOUNT = 0 INSERT INTO dbo.TABLEROS_USUARIO (Usuario_ID, Fecha_Modi) VALUES (@usuario, @fecha);", conexion, transaccion))
                        {
                            comando.Parameters.Add(P("@usuario", usuario.Id));
                            comando.Parameters.Add(P("@fecha", AhoraArgentina()));
                            comando.ExecuteNonQuery();
                        }

                        // Al guardar los visibles, conserva los favoritos de secciones que hoy no tiene permitidas.
                        // Si recupera el permiso, vuelven a aparecer con el lugar que ya tenían.
                        if (clavesPermitidas.Length > 0)
                        {
                            var parametros = string.Join(", ", clavesPermitidas.Select((clave, i) => "@tablero" + i));
                            using (var comando = new SqlCommand("DELETE FROM dbo.TABLEROS_FAVORITOS WHERE Usuario_ID=@usuario AND Tablero IN (" + parametros + ");", conexion, transaccion))
                            {
                                comando.Parameters.Add(P("@usuario", usuario.Id));
                                for (int i = 0; i < clavesPermitidas.Length; i++) comando.Parameters.Add(P("@tablero" + i, clavesPermitidas[i]));
                                comando.ExecuteNonQuery();
                            }
                        }

                        for (int i = 0; i < lista.Count; i++)
                        {
                            var f = lista[i];
                            bool conLugar = TieneLugar(f);
                            using (var comando = new SqlCommand(@"
INSERT INTO dbo.TABLEROS_FAVORITOS (Usuario_ID, Tablero, Orden, Pos_X, Pos_Y, Ancho, Alto)
VALUES (@usuario, @tablero, @orden, @x, @y, @ancho, @alto);", conexion, transaccion))
                            {
                                comando.Parameters.Add(P("@usuario", usuario.Id));
                                comando.Parameters.Add(P("@tablero", f.Tablero.Trim()));
                                comando.Parameters.Add(P("@orden", i));
                                comando.Parameters.Add(P("@x", conLugar ? f.X : null));
                                comando.Parameters.Add(P("@y", conLugar ? f.Y : null));
                                comando.Parameters.Add(P("@ancho", conLugar ? f.Ancho : null));
                                comando.Parameters.Add(P("@alto", conLugar ? f.Alto : null));
                                comando.ExecuteNonQuery();
                            }
                        }
                        transaccion.Commit();
                    }
                    return Ok(new { Personalizado = true, Cantidad = lista.Count });
                }
            }
            catch (Exception)
            {
                return ErrorInterno("No se pudieron guardar tus tableros favoritos. Probá de nuevo.");
            }
        }

        // DELETE api/tableros/favoritos → Restablecer en el dashboard: vuelve al diseño por defecto.
        [HttpDelete, Route("favoritos")]
        public IHttpActionResult DeleteFavoritos()
        {
            try
            {
                using (var conexion = new SqlConnection(ConnectionString()))
                {
                    conexion.Open();
                    UsuarioSesion usuario = UsuarioDelToken(conexion);
                    if (usuario == null) return Unauthorized();

                    // Los favoritos se borran solos con la fila del usuario (ON DELETE CASCADE).
                    using (var comando = new SqlCommand("DELETE FROM dbo.TABLEROS_USUARIO WHERE Usuario_ID=@usuario;", conexion))
                    {
                        comando.Parameters.Add(P("@usuario", usuario.Id));
                        comando.ExecuteNonQuery();
                    }
                    return Ok(new { Personalizado = false });
                }
            }
            catch (Exception)
            {
                return ErrorInterno("No se pudo restablecer tu dashboard. Probá de nuevo.");
            }
        }

        private static bool TieneLugar(FavoritoDto f)
        {
            return f.X.HasValue && f.Y.HasValue && f.Ancho.HasValue && f.Alto.HasValue;
        }

        private static string ValidarFavoritos(List<FavoritoDto> lista)
        {
            if (lista.Count > MaximoFavoritos) return "Hay demasiados tableros. Sacá alguno y probá de nuevo.";
            var vistos = new HashSet<string>(StringComparer.Ordinal);
            foreach (var f in lista)
            {
                string clave = f == null || f.Tablero == null ? "" : f.Tablero.Trim();
                if (!FormatoTablero.IsMatch(clave)) return "Uno de los tableros no existe. Recargá la pantalla y probá de nuevo.";
                if (PermisosTableros.TemaDeTablero(clave) == null) return "Uno de los tableros no existe. Recargá la pantalla y probá de nuevo.";
                if (!vistos.Add(clave)) return "Un tablero está repetido. Recargá la pantalla y probá de nuevo.";
                // El lugar en la grilla (12 columnas) es opcional; si viene, completo y adentro de la grilla.
                if (!TieneLugar(f)) continue;
                if (f.X < 0 || f.X > 11 || f.Ancho < 1 || f.X + f.Ancho > 12 || f.Y < 0 || f.Y > 5000 || f.Alto < 1 || f.Alto > 60)
                    return "El lugar de un tablero no es válido. Restablecé el dashboard y probá de nuevo.";
            }
            return null;
        }

        // ---------------------------------------------------------------- Facturación (solo lectura)

        // Se conserva la ruta anterior como alias, con el mismo control de sesión y permiso.
        [HttpGet]
        [Route("top-clientes-facturacion")]
        [Route("~/api/dashboard/top-clientes-facturacion")]
        public IHttpActionResult ObtenerTopClientesFacturacion(int cantidad = 5)
        {
            try
            {
                cantidad = Math.Max(1, Math.Min(cantidad, 20));
                using (var conexion = new SqlConnection(ConnectionString()))
                {
                    conexion.Open();
                    UsuarioSesion usuario = UsuarioDelToken(conexion);
                    if (usuario == null) return Unauthorized();
                    if (!PuedeVerFacturacion(conexion, usuario)) return SinPermisoFacturacion();

                    const string sql = @"
SELECT TOP (@cantidad)
       c.Cliente_ID AS ClienteID,
       COALESCE(NULLIF(LTRIM(RTRIM(c.Razon_Social)), ''), 'Sin nombre') AS RazonSocial,
       CONVERT(decimal(18,2), SUM(CASE WHEN comp.Impacto='C' THEN -comp.Total ELSE comp.Total END)) AS Facturacion
FROM dbo.COMPROBANTES comp
JOIN dbo.CLIENTES c ON c.Cliente_ID = comp.ClienteID
WHERE comp.Estado = 'EMITIDO'
  AND (comp.Impacto='D' OR (comp.Impacto='C' AND comp.Tipo<>'REC'))
GROUP BY c.Cliente_ID, c.Razon_Social
ORDER BY Facturacion DESC, RazonSocial;";
                    var filas = new List<TopClienteFacturacionDto>();
                    using (var comando = new SqlCommand(sql, conexion))
                    {
                        comando.Parameters.Add(P("@cantidad", cantidad));
                        using (var r = comando.ExecuteReader())
                        {
                            while (r.Read()) filas.Add(new TopClienteFacturacionDto
                            {
                                ClienteID = Convert.ToInt32(r["ClienteID"], CultureInfo.InvariantCulture),
                                RazonSocial = Convert.ToString(r["RazonSocial"], CultureInfo.InvariantCulture),
                                Facturacion = Importe(r, "Facturacion")
                            });
                        }
                    }
                    return SinCache(filas);
                }
            }
            catch (Exception)
            {
                return ErrorInterno("No se pudo calcular la facturación de los clientes. Probá de nuevo.");
            }
        }

        // GET api/tableros/facturacion?fechaDesde=AAAA-MM-DD&fechaHasta=AAAA-MM-DD
        // Facturación del período por cliente y por día de emisión (la pantalla la agrupa por mes o por semana). Misma cuenta
        // que "Top clientes en facturación" (CuentaCorrienteController): comprobantes de deuda emitidos, menos créditos salvo recibos.
        [HttpGet, Route("facturacion")]
        public IHttpActionResult GetFacturacion(string fechaDesde = null, string fechaHasta = null)
        {
            DateTime desde, hasta;
            string error = LeerPeriodo(fechaDesde, fechaHasta, out desde, out hasta);
            if (error != null) return Rechazo(error);

            try
            {
                using (var conexion = new SqlConnection(ConnectionString()))
                {
                    conexion.Open();
                    UsuarioSesion usuario = UsuarioDelToken(conexion);
                    if (usuario == null) return Unauthorized();
                    if (!PuedeVerFacturacion(conexion, usuario)) return SinPermisoFacturacion();

                    var filas = new List<FacturacionDto>();
                    using (var comando = new SqlCommand(@"
SELECT c.ClienteID,
       COALESCE(NULLIF(LTRIM(RTRIM(cl.Razon_Social)), ''), 'Sin nombre') AS Cliente,
       CONVERT(date, c.FechaEmision) AS Fecha,
       CAST(SUM(CASE WHEN c.Impacto = 'C' THEN -c.Total ELSE c.Total END) AS decimal(18,2)) AS Total,
       COUNT(*) AS Comprobantes
FROM dbo.COMPROBANTES c
JOIN dbo.CLIENTES cl ON cl.Cliente_ID = c.ClienteID
WHERE c.Estado = 'EMITIDO'
  AND (c.Impacto = 'D' OR (c.Impacto = 'C' AND c.Tipo <> 'REC'))
  AND c.FechaEmision >= @desde AND c.FechaEmision < @hasta
GROUP BY c.ClienteID, cl.Razon_Social, CONVERT(date, c.FechaEmision)
ORDER BY Fecha, c.ClienteID;", conexion))
                    {
                        comando.Parameters.Add(P("@desde", desde));
                        comando.Parameters.Add(P("@hasta", hasta.AddDays(1)));
                        using (var r = comando.ExecuteReader())
                        {
                            while (r.Read())
                            {
                                filas.Add(new FacturacionDto
                                {
                                    ClienteID = Convert.ToInt32(r["ClienteID"], CultureInfo.InvariantCulture),
                                    Cliente = Convert.ToString(r["Cliente"], CultureInfo.InvariantCulture).Trim(),
                                    Fecha = (DateTime)r["Fecha"],
                                    Total = Importe(r, "Total"),
                                    Comprobantes = Convert.ToInt32(r["Comprobantes"], CultureInfo.InvariantCulture)
                                });
                            }
                        }
                    }
                    return SinCache(filas);
                }
            }
            catch (Exception)
            {
                return ErrorInterno("No se pudo calcular la facturación del período. Probá de nuevo.");
            }
        }

        // GET api/tableros/deuda → por cliente, lo que falta cobrar de facturas y notas de débito: vencido (antes de hoy), por
        // vencer y lo vencido por antigüedad (1 a 30, 31 a 60, 61 a 90 y más de 90 días). Lo usan "Deuda vencida por cliente"
        // y "Antigüedad de la deuda". Misma cuenta que el saldo de cuenta corriente
        // (CuentaCorrienteController.ObtenerSaldoGeneral: lo emitido menos lo aplicado vigente, solo clientes activos), con el
        // día de hoy de Argentina.
        [HttpGet, Route("deuda")]
        public IHttpActionResult GetDeuda()
        {
            try
            {
                using (var conexion = new SqlConnection(ConnectionString()))
                {
                    conexion.Open();
                    UsuarioSesion usuario = UsuarioDelToken(conexion);
                    if (usuario == null) return Unauthorized();
                    if (!PuedeVerFacturacion(conexion, usuario)) return SinPermisoFacturacion();

                    var filas = new List<DeudaDto>();
                    using (var comando = new SqlCommand(@"
WITH Deudas AS (
    SELECT c.Comprobante_ID, c.ClienteID, c.FechaVencimiento,
           c.Total - COALESCE(SUM(CASE WHEN a.Vigente = 1 THEN a.Importe ELSE 0 END), 0) AS Pendiente
    FROM dbo.COMPROBANTES c
    JOIN dbo.CLIENTES cl ON cl.Cliente_ID = c.ClienteID AND ISNULL(cl.EstadoCliente, 0) = 1
    LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteDeudaID = c.Comprobante_ID
    WHERE c.Estado = 'EMITIDO' AND c.Impacto = 'D'
    GROUP BY c.Comprobante_ID, c.ClienteID, c.FechaVencimiento, c.Total
)
SELECT d.ClienteID,
       COALESCE(NULLIF(LTRIM(RTRIM(cl.Razon_Social)), ''), 'Sin nombre') AS Cliente,
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
ORDER BY Vencida DESC, PorVencer DESC, Cliente;", conexion))
                    {
                        comando.Parameters.Add(P("@hoy", AhoraArgentina().Date));
                        using (var r = comando.ExecuteReader())
                        {
                            while (r.Read())
                            {
                                filas.Add(new DeudaDto
                                {
                                    ClienteID = Convert.ToInt32(r["ClienteID"], CultureInfo.InvariantCulture),
                                    Cliente = Convert.ToString(r["Cliente"], CultureInfo.InvariantCulture).Trim(),
                                    Vencida = Importe(r, "Vencida"),
                                    PorVencer = Importe(r, "PorVencer"),
                                    ComprobantesVencidos = Convert.ToInt32(r["ComprobantesVencidos"], CultureInfo.InvariantCulture),
                                    VencimientoMasViejo = r["VencimientoMasViejo"] == DBNull.Value ? (DateTime?)null : (DateTime)r["VencimientoMasViejo"],
                                    Vencida1a30 = Importe(r, "Vencida1a30"),
                                    Vencida31a60 = Importe(r, "Vencida31a60"),
                                    Vencida61a90 = Importe(r, "Vencida61a90"),
                                    VencidaMas90 = Importe(r, "VencidaMas90")
                                });
                            }
                        }
                    }
                    return SinCache(filas);
                }
            }
            catch (Exception)
            {
                return ErrorInterno("No se pudo calcular la deuda de los clientes. Probá de nuevo.");
            }
        }

        private IHttpActionResult SinPermisoFacturacion()
        {
            return Content(HttpStatusCode.Forbidden, new { mensaje = "No tenés permiso para ver la facturación." });
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

        // El permiso de consulta del tablero es independiente del permiso para operar cuenta corriente o proformas.
        private static bool PuedeVerFacturacion(SqlConnection conexion, UsuarioSesion usuario)
        {
            return ObtenerTemasPermitidos(conexion, usuario).Contains("facturacion");
        }

        private static string[] ObtenerTemasPermitidos(SqlConnection conexion, UsuarioSesion usuario)
        {
            if (usuario.EsAdmin || usuario.EsChofer)
                return PermisosTableros.TemasPara(usuario.EsAdmin, usuario.EsChofer, null);
            var menus = new List<string>();
            using (var comando = new SqlCommand(@"
SELECT DISTINCT m.Menu_Nombre
FROM dbo.GRUPOS_USUARIOS gu
JOIN dbo.GRUPOS_MENU gm ON gm.GrupoID = gu.GrupoID
JOIN dbo.MENU m ON m.Menu_ID = gm.MenuID
WHERE gu.UsuarioID = @usuario;", conexion))
            {
                comando.Parameters.Add(P("@usuario", usuario.Id));
                using (var r = comando.ExecuteReader())
                    while (r.Read()) menus.Add(Convert.ToString(r["Menu_Nombre"], CultureInfo.InvariantCulture));
            }
            return PermisosTableros.TemasPara(false, false, menus);
        }

        // ---------------------------------------------------------------- Sesión

        // Usuario del token (Authorization: Bearer …), activo. Mismo criterio que EmpresaController y
        // FacturacionConfiguracionController. Sin token válido devuelve null (la acción responde 401).
        private UsuarioSesion UsuarioDelToken(SqlConnection conexion)
        {
            var authorization = Request == null ? null : Request.Headers.Authorization;
            if (authorization == null || !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(authorization.Parameter)) return null;

            ClaimsPrincipal principal;
            try
            {
                SecurityToken validado;
                principal = new JwtSecurityTokenHandler().ValidateToken(authorization.Parameter, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                    ValidateIssuer = true, ValidIssuer = JwtConfig.Issuer, ValidateAudience = true, ValidAudience = JwtConfig.Audience,
                    ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1)
                }, out validado);
            }
            catch (SecurityTokenException) { return null; }
            catch (ArgumentException) { return null; }

            var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || string.IsNullOrWhiteSpace(claim.Value)) return null;

            using (var comando = new SqlCommand(@"
SELECT TOP (1) Usuario_ID, Nombre_Usuario,
 CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(Rol,''))))='admin' THEN 1 ELSE 0 END AS EsAdmin,
 CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(Rol,''))))='chofer' THEN 1 ELSE 0 END AS EsChofer
FROM dbo.USUARIOS WHERE Nombre_Usuario=@usuario AND EstadoUsuario='Activo';", conexion))
            {
                comando.Parameters.Add(P("@usuario", claim.Value));
                using (var r = comando.ExecuteReader())
                {
                    if (!r.Read()) return null;
                    return new UsuarioSesion
                    {
                        Id = Convert.ToInt32(r["Usuario_ID"], CultureInfo.InvariantCulture),
                        Nombre = (string)r["Nombre_Usuario"],
                        EsAdmin = Convert.ToInt32(r["EsAdmin"], CultureInfo.InvariantCulture) == 1,
                        EsChofer = Convert.ToInt32(r["EsChofer"], CultureInfo.InvariantCulture) == 1
                    };
                }
            }
        }
    }
}
