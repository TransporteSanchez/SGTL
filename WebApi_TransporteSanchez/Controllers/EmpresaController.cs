using System;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Collections.Generic;
using System.Net;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/empresa")]
    public sealed class EmpresaController : ApiController
    {
        private readonly string conexion = ConnectionStringHelper.GetConnectionString("SGTLEntities");
        // Sin fecha: la vigente. Con fecha: la de ese día, o la más vieja si el documento es anterior.
        private const string SqlVersion = @"
SELECT TOP (1) e.Empresa_ID, e.Vigente_Desde, e.Razon_Social, e.Nombre_Comercial, e.CUIT,
       CAST(e.Cond_Fiscal AS int) AS Cond_Fiscal,
       CASE e.Cond_Fiscal
            WHEN 1 THEN N'Responsable inscripto'
            WHEN 2 THEN N'Monotributista'
            WHEN 3 THEN N'Exento'
       END AS Condicion_IVA,
       e.ProvID, pr.Nombre_Provincia AS Provincia, e.LocID, l.Nombre_Localidad AS Localidad,
       e.Calle, e.AlturaCalle, e.CodigoPostal, e.Telefono, e.Email, e.Logo, e.Fecha_Modi, e.Usu_Modi
FROM dbo.EMPRESA e
LEFT JOIN dbo.PROVINCIAS pr ON pr.Prov_ID = e.ProvID
LEFT JOIN dbo.LOCALIDADES l ON l.Loc_ID = e.LocID
WHERE @fecha IS NULL
   OR e.Vigente_Desde <= @fecha
   OR e.Vigente_Desde = (SELECT MIN(Vigente_Desde) FROM dbo.EMPRESA)
ORDER BY CASE WHEN @fecha IS NULL OR e.Vigente_Desde <= @fecha THEN 0 ELSE 1 END,
         e.Vigente_Desde DESC, e.Empresa_ID DESC;";
        [HttpGet, Route("")]
        public async Task<IHttpActionResult> Get(CancellationToken ct, string fecha = null)
        {
            DateTime? dia = null;
            if (!string.IsNullOrWhiteSpace(fecha))
            {
                string soloFecha = fecha.Trim().Length >= 10 ? fecha.Trim().Substring(0, 10) : fecha.Trim();
                DateTime leida;
                if (!DateTime.TryParseExact(soloFecha, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out leida))
                    return BadRequest("La fecha tiene que tener el formato AAAA-MM-DD.");
                dia = leida.Date;
            }
            using (var db = new SGTLAuditContext(conexion))
            {
                var filas = await db.Database.SqlQuery<EmpresaDto>(SqlVersion,
                    new SqlParameter("@fecha", SqlDbType.Date)
                    {
                        Value = dia.HasValue ? (object)dia.Value : DBNull.Value
                    }).ToListAsync(ct);
                if (filas.Count == 0) return NotFound();
                return Ok(filas[0]);
            }
        }
        private const string SqlInsertar = @"
INSERT INTO dbo.EMPRESA
    (Vigente_Desde, Razon_Social, Nombre_Comercial, CUIT, Cond_Fiscal, ProvID, LocID,
     Calle, AlturaCalle, CodigoPostal, Telefono, Email, Logo, Fecha_Modi, Usu_Modi)
OUTPUT INSERTED.Empresa_ID
VALUES
    (@desde, @razon, @nombre, @cuit, @cond, @prov, @loc, @calle, @altura, @cp,
     @tel, @email, @logo,
     CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime), @usu);";
        private const string SqlLocalidad = @"
SELECT COUNT(*) FROM dbo.LOCALIDADES WHERE Loc_ID = @loc AND ProvID = @prov;";
        private const string SqlAuditoria = @"
INSERT INTO dbo.AUDITORIA
    (Fecha, Usuario, Accion, Entidad, Clave, Valores_Anteriores, Valores_Nuevos, Origen)
VALUES
    (GETDATE(), @usu, 'INSERT', 'EMPRESA', @clave, @ant, @nue, 'Gestionar empresa');";
        private const int LargoMaximoLogo = 1500000;
        private static readonly Regex FormatoLogo = new Regex(
            @"^data:image/(png|jpeg|jpg|svg\+xml|webp|x-icon|vnd\.microsoft\.icon);base64,[A-Za-z0-9+/=\r\n]+$",
            RegexOptions.IgnoreCase);
        [HttpPut, Route("")]
        public async Task<IHttpActionResult> Put([FromBody] EmpresaEntrada datos, CancellationToken ct)
        {
            var usuario = await new AccesoEmail().AutenticarAsync(Request.Headers.Authorization, ct);
            if (usuario == null || string.IsNullOrWhiteSpace(usuario.Nombre)) return Unauthorized();
            if (!usuario.EsAdministrador)
                return Content(HttpStatusCode.Forbidden, new { mensaje = "Solo un administrador puede modificar los datos de la empresa." });
            string error = Validar(datos);
            if (error != null) return BadRequest(error);
            try
            {
                using (var db = new SGTLAuditContext(conexion))
                using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    bool localidadOk = await db.Database.SqlQuery<int>(SqlLocalidad,
                        new SqlParameter("@loc", datos.LocID),
                        new SqlParameter("@prov", datos.ProvID)).SingleAsync(ct) > 0;
                    if (!localidadOk)
                    {
                        tx.Rollback();
                        return BadRequest("La localidad elegida no es de esa provincia. Seleccioná la localidad de nuevo.");
                    }
                    var actual = await db.Database.SqlQuery<EmpresaDto>(SqlVersion,
                        new SqlParameter("@fecha", SqlDbType.Date) { Value = DBNull.Value }).SingleOrDefaultAsync(ct);
                    var cambios = Cambios(actual, datos);
                    if (actual != null && cambios.Count == 0)
                    {
                        tx.Commit();
                        return Ok(new { SinCambios = true, Empresa_ID = actual.Empresa_ID });
                    }
                    int id = await db.Database.SqlQuery<int>(SqlInsertar, Parametros(datos, usuario.Nombre)).SingleAsync(ct);
                    await db.Database.ExecuteSqlCommandAsync(SqlAuditoria, ct,
                        new SqlParameter("@usu", usuario.Nombre),
                        new SqlParameter("@clave", "Empresa_ID=" + id.ToString(CultureInfo.InvariantCulture)),
                        new SqlParameter("@ant", (object)JsonConvert.SerializeObject(Valores(cambios, 0)) ?? DBNull.Value),
                        new SqlParameter("@nue", (object)JsonConvert.SerializeObject(Valores(cambios, 1)) ?? DBNull.Value));
                    tx.Commit();
                    return Ok(new { SinCambios = false, Empresa_ID = id });
                }
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.InternalServerError, new { mensaje = "No se pudieron guardar los datos de la empresa. Probá de nuevo." });
            }
        }
        private static SqlParameter[] Parametros(EmpresaEntrada datos, string usuario)
        {
            return new[]
            {
        new SqlParameter("@desde", SqlDbType.Date) { Value = HoyArgentina() },
        new SqlParameter("@razon", datos.Razon_Social),
        new SqlParameter("@nombre", (object)datos.Nombre_Comercial ?? DBNull.Value),
        new SqlParameter("@cuit", datos.CUIT),
        new SqlParameter("@cond", SqlDbType.TinyInt) { Value = datos.Cond_Fiscal.Value },
        new SqlParameter("@prov", datos.ProvID),
        new SqlParameter("@loc", datos.LocID),
        new SqlParameter("@calle", datos.Calle),
        new SqlParameter("@altura", datos.AlturaCalle),
        new SqlParameter("@cp", (object)datos.CodigoPostal ?? DBNull.Value),
        new SqlParameter("@tel", (object)datos.Telefono ?? DBNull.Value),
        new SqlParameter("@email", (object)datos.Email ?? DBNull.Value),
        new SqlParameter("@logo", SqlDbType.NVarChar, -1) { Value = (object)datos.Logo ?? DBNull.Value },
        new SqlParameter("@usu", usuario)
    };
        }
        private static DateTime HoyArgentina()
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
        private static string Validar(EmpresaEntrada d)
        {
            if (d == null) return "Completá los datos de la empresa.";
            d.Razon_Social = Limpiar(d.Razon_Social);
            d.Nombre_Comercial = Limpiar(d.Nombre_Comercial);
            d.CUIT = Limpiar(Regex.Replace(d.CUIT ?? "", "[^0-9]", ""));
            d.Calle = Limpiar(d.Calle);
            d.AlturaCalle = Limpiar(d.AlturaCalle);
            d.CodigoPostal = Limpiar(d.CodigoPostal);
            d.Telefono = Limpiar(Regex.Replace(d.Telefono ?? "", "[^0-9]", ""));
            d.Email = Limpiar(d.Email);
            d.Logo = Limpiar(d.Logo);
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
        private static string Limpiar(string valor)
        {
            return string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
        }
        private static Dictionary<string, string[]> Cambios(EmpresaDto actual, EmpresaEntrada nuevo)
        {
            var cambios = new Dictionary<string, string[]>();
            Comparar(cambios, "Razon_Social", actual == null ? null : actual.Razon_Social, nuevo.Razon_Social);
            Comparar(cambios, "Nombre_Comercial", actual == null ? null : actual.Nombre_Comercial, nuevo.Nombre_Comercial);
            Comparar(cambios, "CUIT", actual == null ? null : actual.CUIT, nuevo.CUIT);
            Comparar(cambios, "Cond_Fiscal", actual == null ? null : actual.Cond_Fiscal, nuevo.Cond_Fiscal);
            Comparar(cambios, "ProvID", actual == null ? null : actual.ProvID, nuevo.ProvID);
            Comparar(cambios, "LocID", actual == null ? null : actual.LocID, nuevo.LocID);
            Comparar(cambios, "Calle", actual == null ? null : actual.Calle, nuevo.Calle);
            Comparar(cambios, "AlturaCalle", actual == null ? null : actual.AlturaCalle, nuevo.AlturaCalle);
            Comparar(cambios, "CodigoPostal", actual == null ? null : actual.CodigoPostal, nuevo.CodigoPostal);
            Comparar(cambios, "Telefono", actual == null ? null : actual.Telefono, nuevo.Telefono);
            Comparar(cambios, "Email", actual == null ? null : actual.Email, nuevo.Email);
            string logoAntes = actual == null ? null : actual.Logo;
            if (!string.Equals(logoAntes ?? "", nuevo.Logo ?? "", StringComparison.Ordinal))
                cambios["Logo"] = new[] { ResumirLogo(logoAntes), ResumirLogo(nuevo.Logo) };
            return cambios;
        }
        private static void Comparar(Dictionary<string, string[]> cambios, string campo, object antes, object despues)
        {
            string a = antes == null ? null : Convert.ToString(antes, CultureInfo.InvariantCulture);
            string b = despues == null ? null : Convert.ToString(despues, CultureInfo.InvariantCulture);
            if (!string.Equals(a ?? "", b ?? "", StringComparison.Ordinal)) cambios[campo] = new[] { a, b };
        }
        private static string ResumirLogo(string logo)
        {
            if (string.IsNullOrEmpty(logo)) return null;
            int coma = logo.IndexOf(',');
            string tipo = coma > 5 ? logo.Substring(5, coma - 5) : "imagen";
            return "[logo " + tipo + ", " + logo.Length.ToString(CultureInfo.InvariantCulture) + " caracteres]";
        }
        private static Dictionary<string, string> Valores(Dictionary<string, string[]> cambios, int posicion)
        {
            var valores = new Dictionary<string, string>();
            foreach (var cambio in cambios) valores[cambio.Key] = cambio.Value[posicion];
            return valores;
        }
    }
    public sealed class EmpresaDto
    {
        public int Empresa_ID { get; set; }
        public DateTime Vigente_Desde { get; set; }
        public string Razon_Social { get; set; }
        public string Nombre_Comercial { get; set; }
        public string CUIT { get; set; }
        public int? Cond_Fiscal { get; set; }
        public string Condicion_IVA { get; set; }
        public int? ProvID { get; set; }
        public string Provincia { get; set; }
        public int? LocID { get; set; }
        public string Localidad { get; set; }
        public string Calle { get; set; }
        public string AlturaCalle { get; set; }
        public string CodigoPostal { get; set; }
        public string Telefono { get; set; }
        public string Email { get; set; }
        public string Logo { get; set; }
        public DateTime? Fecha_Modi { get; set; }
        public string Usu_Modi { get; set; }
    }
    public sealed class EmpresaEntrada
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
        public string Logo { get; set; }
    }
}