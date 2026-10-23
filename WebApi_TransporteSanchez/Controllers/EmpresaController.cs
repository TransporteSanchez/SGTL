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

namespace WebApi_TransporteSanchez.Controllers
{
    /// <summary>
    /// Datos de la empresa que salen en los documentos (Gestionar empresa; tabla del script
    /// database/empresa/01_crear_empresa.sql, fuera del EDMX).
    /// Guarda versiones: cada Guardar agrega una con la fecha desde la que vale, y un documento ya emitido pide la de su
    /// fecha de emisión (GET api/empresa?fecha=AAAA-MM-DD), así conserva los datos con que se emitió. Leer no pide
    /// sesión, como GestionContenido (los PDF la leen igual que el logo); guardar es solo de administradores.
    /// El logo de acá es el de los documentos; el del sistema (menú y login) sigue en GestionContenido.
    /// </summary>
    [RoutePrefix("api/empresa")]
    public class EmpresaController : ApiController
    {
        public class EmpresaRequest
        {
            public string Razon_Social { get; set; }
            public string Nombre_Comercial { get; set; }
            public string CUIT { get; set; }
            public int? Cond_Fiscal { get; set; }
            public int? ProvID { get; set; }
            public int? LocID { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
            public string CodigoPostal { get; set; }
            public string Telefono { get; set; }
            public string Email { get; set; }
            /// <summary>Logo de los documentos (data URI de una imagen). Null: los documentos salen con el nombre en texto.</summary>
            public string Logo { get; set; }
        }

        public class EmpresaDto : EmpresaRequest
        {
            public int Empresa_ID { get; set; }
            public DateTime Vigente_Desde { get; set; }
            /// <summary>"Responsable inscripto", "Monotributista" o "Exento" (mayúscula solo al principio, §9).</summary>
            public string Condicion_IVA { get; set; }
            public string Provincia { get; set; }
            public string Localidad { get; set; }
            /// <summary>Quién guardó esta versión y cuándo, en hora de Argentina. Vacíos si nunca se completó.</summary>
            public DateTime? Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }
        }

        private class UsuarioSesion { public string Nombre { get; set; } public bool EsAdmin { get; set; } }

        private static readonly string[] CondicionesIva = { null, "Responsable inscripto", "Monotributista", "Exento" };

        // El logo llega como data URI de una imagen; 1 MB de archivo son unos 1,4 millones de caracteres en base64.
        private const int LargoMaximoLogo = 1500000;
        private static readonly Regex FormatoLogo = new Regex(
            @"^data:image/(png|jpeg|jpg|svg\+xml|webp|x-icon|vnd\.microsoft\.icon);base64,[A-Za-z0-9+/=\r\n]+$", RegexOptions.IgnoreCase);

        private const string SelectVersion = @"
SELECT TOP (1) e.Empresa_ID, e.Vigente_Desde, e.Razon_Social, e.Nombre_Comercial, e.CUIT, e.Cond_Fiscal,
       e.ProvID, pr.Nombre_Provincia, e.LocID, l.Nombre_Localidad, e.Calle, e.AlturaCalle, e.CodigoPostal,
       e.Telefono, e.Email, e.Logo, e.Fecha_Modi, e.Usu_Modi
FROM dbo.EMPRESA e
LEFT JOIN dbo.PROVINCIAS pr ON pr.Prov_ID = e.ProvID
LEFT JOIN dbo.LOCALIDADES l ON l.Loc_ID = e.LocID
WHERE (@fecha IS NULL OR e.Vigente_Desde <= @fecha)
ORDER BY e.Vigente_Desde DESC, e.Empresa_ID DESC;";

        private static string ConnectionString()
        {
            return new EntityConnectionStringBuilder(ConnectionStringHelper.GetConnectionString("SGTLEntities")).ProviderConnectionString;
        }

        private static SqlParameter P(string nombre, object valor) { return new SqlParameter(nombre, valor ?? DBNull.Value); }

        private static string Texto(SqlDataReader r, string columna)
        {
            object valor = r[columna];
            return valor == DBNull.Value ? null : Convert.ToString(valor, CultureInfo.InvariantCulture).Trim();
        }

        private static int? Entero(SqlDataReader r, string columna)
        {
            object valor = r[columna];
            return valor == DBNull.Value ? (int?)null : Convert.ToInt32(valor, CultureInfo.InvariantCulture);
        }

        // Fecha de hoy en Argentina (como FacturasController y ComprobantesController): el día desde el que vale una versión.
        private static DateTime FechaArgentina()
        {
            try
            {
                var zona = TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zona).Date;
            }
            catch (TimeZoneNotFoundException)
            {
                return DateTime.UtcNow.AddHours(-3).Date;
            }
        }

        private static EmpresaDto LeerVersion(SqlConnection conexion, SqlTransaction transaccion, DateTime? fecha)
        {
            using (var comando = new SqlCommand(SelectVersion, conexion, transaccion))
            {
                comando.Parameters.Add(new SqlParameter("@fecha", System.Data.SqlDbType.Date) { Value = fecha.HasValue ? (object)fecha.Value.Date : DBNull.Value });
                using (var r = comando.ExecuteReader())
                {
                    if (!r.Read()) return null;
                    int? condicion = Entero(r, "Cond_Fiscal");
                    return new EmpresaDto
                    {
                        Empresa_ID = (int)r["Empresa_ID"],
                        Vigente_Desde = (DateTime)r["Vigente_Desde"],
                        Razon_Social = Texto(r, "Razon_Social"),
                        Nombre_Comercial = Texto(r, "Nombre_Comercial"),
                        CUIT = Texto(r, "CUIT"),
                        Cond_Fiscal = condicion,
                        Condicion_IVA = condicion.HasValue && condicion.Value >= 1 && condicion.Value <= 3 ? CondicionesIva[condicion.Value] : null,
                        ProvID = Entero(r, "ProvID"),
                        Provincia = Texto(r, "Nombre_Provincia"),
                        LocID = Entero(r, "LocID"),
                        Localidad = Texto(r, "Nombre_Localidad"),
                        Calle = Texto(r, "Calle"),
                        AlturaCalle = Texto(r, "AlturaCalle"),
                        CodigoPostal = Texto(r, "CodigoPostal"),
                        Telefono = Texto(r, "Telefono"),
                        Email = Texto(r, "Email"),
                        Logo = Texto(r, "Logo"),
                        Fecha_Modi = r["Fecha_Modi"] == DBNull.Value ? (DateTime?)null : (DateTime)r["Fecha_Modi"],
                        Usu_Modi = Texto(r, "Usu_Modi")
                    };
                }
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

        // GET api/empresa              → los datos actuales (Gestionar empresa, borradores de proforma).
        // GET api/empresa?fecha=2026-10-23 → los que valían ese día (un documento ya emitido).
        [HttpGet, Route("")]
        public IHttpActionResult Get(string fecha = null)
        {
            DateTime? dia = null;
            if (!string.IsNullOrWhiteSpace(fecha))
            {
                DateTime leida;
                string soloFecha = fecha.Trim().Length >= 10 ? fecha.Trim().Substring(0, 10) : fecha.Trim();
                if (!DateTime.TryParseExact(soloFecha, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out leida))
                    return Rechazo("La fecha tiene que tener el formato AAAA-MM-DD.");
                dia = leida;
            }

            try
            {
                using (var conexion = new SqlConnection(ConnectionString()))
                {
                    conexion.Open();
                    // Si el documento es de antes de la primera versión, sale con la primera (la más vieja).
                    var datos = LeerVersion(conexion, null, dia) ?? (dia.HasValue ? LeerPrimera(conexion) : null);
                    if (datos == null)
                        return Content(HttpStatusCode.NotFound, new { mensaje = "Todavía no están cargados los datos de la empresa." });
                    return SinCache(datos);
                }
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError, new { mensaje = "No se pudieron leer los datos de la empresa. Probá de nuevo." });
            }
        }

        private static EmpresaDto LeerPrimera(SqlConnection conexion)
        {
            using (var comando = new SqlCommand("SELECT MIN(Vigente_Desde) FROM dbo.EMPRESA;", conexion))
            {
                object minimo = comando.ExecuteScalar();
                return minimo == null || minimo == DBNull.Value ? null : LeerVersion(conexion, null, (DateTime)minimo);
            }
        }

        // PUT api/empresa: guarda los datos nuevos (solo administradores). Mientras la primera versión no tenga CUIT, la
        // completa (así los documentos de antes salen con los datos completos); después agrega una versión que vale desde
        // hoy. Si no cambió nada, no agrega ninguna.
        [HttpPut, Route("")]
        public IHttpActionResult Put([FromBody] EmpresaRequest datos)
        {
            try
            {
                using (var conexion = new SqlConnection(ConnectionString()))
                {
                    conexion.Open();
                    UsuarioSesion usuario;
                    try { usuario = ValidarUsuario(conexion); }
                    catch (UnauthorizedAccessException) { return Unauthorized(); }
                    catch (SecurityTokenException) { return Unauthorized(); }
                    catch (ArgumentException) { return Unauthorized(); }
                    if (!usuario.EsAdmin)
                        return Content(HttpStatusCode.Forbidden, new { mensaje = "Solo un administrador puede modificar los datos de la empresa." });

                    string error = Validar(datos);
                    if (error != null) return Rechazo(error);
                    if (!LocalidadDeProvincia(conexion, datos.ProvID.Value, datos.LocID.Value))
                        return Rechazo("La localidad elegida no es de esa provincia. Seleccioná la localidad de nuevo.");

                    using (var transaccion = conexion.BeginTransaction(System.Data.IsolationLevel.Serializable))
                    {
                        var actual = LeerVersion(conexion, transaccion, null);
                        var cambios = Cambios(actual, datos);
                        if (actual != null && cambios.Count == 0)
                        {
                            transaccion.Commit();
                            return Ok(new { SinCambios = true, Empresa_ID = actual.Empresa_ID });
                        }

                        bool completarPrimera = actual != null && string.IsNullOrEmpty(actual.CUIT);
                        int id = completarPrimera ? actual.Empresa_ID : 0;
                        var parametros = new List<SqlParameter>
                        {
                            P("@razon", datos.Razon_Social), P("@nombre", datos.Nombre_Comercial), P("@cuit", datos.CUIT),
                            P("@cond", datos.Cond_Fiscal), P("@prov", datos.ProvID), P("@loc", datos.LocID),
                            P("@calle", datos.Calle), P("@altura", datos.AlturaCalle), P("@cp", datos.CodigoPostal),
                            P("@tel", datos.Telefono), P("@email", datos.Email), P("@usu", usuario.Nombre)
                        };
                        // nvarchar(max): sin tamaño fijo, para que el logo no se corte.
                        parametros.Add(new SqlParameter("@logo", System.Data.SqlDbType.NVarChar, -1) { Value = (object)datos.Logo ?? DBNull.Value });
                        // Fecha_Modi en hora de Argentina (la base está en UTC, §2 de docs/PENDIENTES-SISTEMA.md).
                        const string ahora = "CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime)";
                        string sql;
                        if (completarPrimera)
                        {
                            parametros.Add(P("@id", id));
                            sql = "UPDATE dbo.EMPRESA SET Razon_Social=@razon, Nombre_Comercial=@nombre, CUIT=@cuit, Cond_Fiscal=@cond, " +
                                  "ProvID=@prov, LocID=@loc, Calle=@calle, AlturaCalle=@altura, CodigoPostal=@cp, Telefono=@tel, Email=@email, Logo=@logo, " +
                                  "Fecha_Modi=" + ahora + ", Usu_Modi=@usu WHERE Empresa_ID=@id;";
                        }
                        else
                        {
                            parametros.Add(new SqlParameter("@desde", System.Data.SqlDbType.Date) { Value = FechaArgentina() });
                            sql = "INSERT INTO dbo.EMPRESA (Vigente_Desde, Razon_Social, Nombre_Comercial, CUIT, Cond_Fiscal, ProvID, LocID, " +
                                  "Calle, AlturaCalle, CodigoPostal, Telefono, Email, Logo, Fecha_Modi, Usu_Modi) " +
                                  "OUTPUT INSERTED.Empresa_ID VALUES (@desde, @razon, @nombre, @cuit, @cond, @prov, @loc, @calle, @altura, @cp, " +
                                  "@tel, @email, @logo, " + ahora + ", @usu);";
                        }

                        using (var comando = new SqlCommand(sql, conexion, transaccion))
                        {
                            comando.Parameters.AddRange(parametros.ToArray());
                            if (completarPrimera) comando.ExecuteNonQuery();
                            else id = Convert.ToInt32(comando.ExecuteScalar(), CultureInfo.InvariantCulture);
                        }

                        Auditar(conexion, transaccion, usuario.Nombre, completarPrimera ? "UPDATE" : "INSERT", id, cambios);
                        transaccion.Commit();
                        return Ok(new { SinCambios = false, Empresa_ID = id });
                    }
                }
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError, new { mensaje = "No se pudieron guardar los datos de la empresa. Probá de nuevo." });
            }
        }

        // Normaliza lo que llega (sin espacios de más, CUIT y teléfono solo con números) y devuelve el primer error, con el
        // mismo texto que muestra la pantalla (§9), o null si está todo bien.
        private static string Validar(EmpresaRequest d)
        {
            if (d == null) return "Completá los datos de la empresa.";
            Func<string, string> limpiar = valor => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
            d.Razon_Social = limpiar(d.Razon_Social);
            d.Nombre_Comercial = limpiar(d.Nombre_Comercial);
            d.CUIT = limpiar(Regex.Replace(d.CUIT ?? "", "[^0-9]", ""));
            d.Calle = limpiar(d.Calle);
            d.AlturaCalle = limpiar(d.AlturaCalle);
            d.CodigoPostal = limpiar(d.CodigoPostal);
            d.Telefono = limpiar(Regex.Replace(d.Telefono ?? "", "[^0-9]", ""));
            d.Email = limpiar(d.Email);
            d.Logo = limpiar(d.Logo);

            if (d.Razon_Social == null) return "Completá la razón social.";
            if (d.Razon_Social.Length > 200) return "La razón social admite hasta 200 caracteres.";
            if (d.Nombre_Comercial != null && d.Nombre_Comercial.Length > 100) return "El nombre comercial admite hasta 100 caracteres.";
            if (d.CUIT == null) return "Completá el CUIT.";
            if (d.CUIT.Length != 11) return "El CUIT tiene que tener 11 números.";
            if (!d.Cond_Fiscal.HasValue || d.Cond_Fiscal < 1 || d.Cond_Fiscal > 3) return "Seleccioná la condición de IVA.";
            if (!d.ProvID.HasValue || d.ProvID <= 0) return "Seleccioná una provincia.";
            if (!d.LocID.HasValue || d.LocID <= 0) return "Seleccioná una localidad.";
            if (d.Calle == null) return "Completá la calle.";
            if (d.Calle.Length > 100) return "La calle admite hasta 100 caracteres.";
            if (d.AlturaCalle == null) return "Completá la altura.";
            if (d.AlturaCalle.Length > 10) return "La altura admite hasta 10 caracteres.";
            if (d.CodigoPostal != null && d.CodigoPostal.Length > 20) return "El código postal admite hasta 20 caracteres.";
            if (d.Telefono != null && d.Telefono.Length > 10) return "El teléfono admite hasta 10 números.";
            if (d.Email != null && (d.Email.Length > 320 || !Regex.IsMatch(d.Email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$")))
                return "Revisá el e-mail: tiene que tener @ y un dominio, como nombre@correo.com.";
            if (d.Logo != null && d.Logo.Length > LargoMaximoLogo) return "El logo supera 1 MB. Elegí una imagen más liviana.";
            if (d.Logo != null && !FormatoLogo.IsMatch(d.Logo)) return "Ese formato no sirve para el logo. Elegí un .png, .jpg, .svg, .webp o .ico.";
            return null;
        }

        private static bool LocalidadDeProvincia(SqlConnection conexion, int provincia, int localidad)
        {
            using (var comando = new SqlCommand("SELECT COUNT(*) FROM dbo.LOCALIDADES WHERE Loc_ID=@loc AND ProvID=@prov;", conexion))
            {
                comando.Parameters.Add(P("@loc", localidad));
                comando.Parameters.Add(P("@prov", provincia));
                return Convert.ToInt32(comando.ExecuteScalar(), CultureInfo.InvariantCulture) > 0;
            }
        }

        // Los campos que cambian respecto de la versión actual: nombre → (antes, después). Va a la auditoría.
        private static Dictionary<string, string[]> Cambios(EmpresaDto actual, EmpresaRequest nuevo)
        {
            var cambios = new Dictionary<string, string[]>();
            Action<string, object, object> comparar = (campo, antes, despues) =>
            {
                string a = antes == null ? null : Convert.ToString(antes, CultureInfo.InvariantCulture);
                string b = despues == null ? null : Convert.ToString(despues, CultureInfo.InvariantCulture);
                if (!string.Equals(a ?? "", b ?? "", StringComparison.Ordinal)) cambios[campo] = new[] { a, b };
            };
            comparar("Razon_Social", actual == null ? null : actual.Razon_Social, nuevo.Razon_Social);
            comparar("Nombre_Comercial", actual == null ? null : actual.Nombre_Comercial, nuevo.Nombre_Comercial);
            comparar("CUIT", actual == null ? null : actual.CUIT, nuevo.CUIT);
            comparar("Cond_Fiscal", actual == null ? null : actual.Cond_Fiscal, nuevo.Cond_Fiscal);
            comparar("ProvID", actual == null ? null : actual.ProvID, nuevo.ProvID);
            comparar("LocID", actual == null ? null : actual.LocID, nuevo.LocID);
            comparar("Calle", actual == null ? null : actual.Calle, nuevo.Calle);
            comparar("AlturaCalle", actual == null ? null : actual.AlturaCalle, nuevo.AlturaCalle);
            comparar("CodigoPostal", actual == null ? null : actual.CodigoPostal, nuevo.CodigoPostal);
            comparar("Telefono", actual == null ? null : actual.Telefono, nuevo.Telefono);
            comparar("Email", actual == null ? null : actual.Email, nuevo.Email);
            // El logo va resumido: en la auditoría no se vuelca la imagen entera.
            string logoAntes = actual == null ? null : actual.Logo;
            if (!string.Equals(logoAntes ?? "", nuevo.Logo ?? "", StringComparison.Ordinal))
                cambios["Logo"] = new[] { ResumirLogo(logoAntes), ResumirLogo(nuevo.Logo) };
            return cambios;
        }

        private static string ResumirLogo(string logo)
        {
            if (string.IsNullOrEmpty(logo)) return null;
            int coma = logo.IndexOf(',');
            string tipo = coma > 5 ? logo.Substring(5, coma - 5) : "imagen";
            return "[logo " + tipo + ", " + logo.Length.ToString(CultureInfo.InvariantCulture) + " caracteres]";
        }

        // Auditoría manual (esta tabla no pasa por SaveChanges): el antes y el después de los campos que cambiaron.
        private static void Auditar(SqlConnection conexion, SqlTransaction transaccion, string usuario, string accion, int id,
            Dictionary<string, string[]> cambios)
        {
            using (var comando = new SqlCommand(
                "INSERT INTO dbo.AUDITORIA (Fecha, Usuario, Accion, Entidad, Clave, Valores_Anteriores, Valores_Nuevos, Origen) " +
                "VALUES (GETDATE(), @usu, @accion, 'EMPRESA', @clave, @ant, @nue, 'Gestionar empresa');", conexion, transaccion))
            {
                comando.Parameters.AddRange(new[]
                {
                    P("@usu", usuario), P("@accion", accion), P("@clave", "Empresa_ID=" + id),
                    P("@ant", Json(cambios, 0)), P("@nue", Json(cambios, 1))
                });
                comando.ExecuteNonQuery();
            }
        }

        private static string Json(Dictionary<string, string[]> cambios, int posicion)
        {
            if (cambios.Count == 0) return null;
            var sb = new StringBuilder("{");
            bool primero = true;
            foreach (var cambio in cambios)
            {
                if (!primero) sb.Append(',');
                primero = false;
                sb.Append('"').Append(cambio.Key).Append("\":");
                string valor = cambio.Value[posicion];
                if (valor == null) sb.Append("null");
                else sb.Append('"').Append(HttpUtilityJson(valor)).Append('"');
            }
            return sb.Append('}').ToString();
        }

        private static string HttpUtilityJson(string texto)
        {
            var sb = new StringBuilder(texto.Length + 8);
            foreach (char c in texto)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < ' ') sb.Append("\\u").Append(((int)c).ToString("x4", CultureInfo.InvariantCulture));
                        else sb.Append(c);
                        break;
                }
            }
            return sb.ToString();
        }

        // Usuario del token (Authorization: Bearer …), activo, y si es administrador. Mismo criterio que
        // FacturacionConfiguracionController.
        private UsuarioSesion ValidarUsuario(SqlConnection conexion)
        {
            var authorization = Request == null ? null : Request.Headers.Authorization;
            if (authorization == null || !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(authorization.Parameter)) throw new UnauthorizedAccessException();
            SecurityToken validado;
            var principal = new JwtSecurityTokenHandler().ValidateToken(authorization.Parameter, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                ValidateIssuer = true, ValidIssuer = JwtConfig.Issuer, ValidateAudience = true, ValidAudience = JwtConfig.Audience,
                ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1)
            }, out validado);
            var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || string.IsNullOrWhiteSpace(claim.Value)) throw new UnauthorizedAccessException();

            using (var comando = new SqlCommand(@"
SELECT TOP (1) Nombre_Usuario,
 CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(Rol,''))))='admin' THEN 1 ELSE 0 END AS EsAdmin
FROM dbo.USUARIOS WHERE Nombre_Usuario=@usuario AND EstadoUsuario='Activo';", conexion))
            {
                comando.Parameters.Add(P("@usuario", claim.Value));
                using (var r = comando.ExecuteReader())
                {
                    if (!r.Read()) throw new UnauthorizedAccessException();
                    return new UsuarioSesion { Nombre = (string)r["Nombre_Usuario"], EsAdmin = (int)r["EsAdmin"] == 1 };
                }
            }
        }
    }
}
