using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Text;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/Auditoria")]
    public class AuditoriaController : ApiController
    {
        private readonly string conexion = ConnectionStringHelper.GetConnectionString("SGTLEntities");

        public class Movimiento
        {
            public int Auditoria_ID { get; set; }
            public DateTime Fecha { get; set; }
            public string Usuario { get; set; }
            public string Accion { get; set; }
            public string Entidad { get; set; }
            public string Clave { get; set; }
            public string Valores_Anteriores { get; set; }
            public string Valores_Nuevos { get; set; }
            public string Origen { get; set; }
        }

        [HttpGet, Route("")]
        public IHttpActionResult Get(string usuario = null, string entidad = null, string accion = null,
            DateTime? desde = null, DateTime? hasta = null, string texto = null, int page = 1, int pageSize = 20)
        {
            if (page < 1) page = 1;
            if (pageSize < 0 || pageSize > 200) pageSize = 20;

            var filtro = new StringBuilder(" WHERE 1 = 1");
            var valores = new Dictionary<string, object>();

            void Agregar(string condicion, string parametro, object valor)
            {
                filtro.Append(" AND ").Append(condicion);
                valores[parametro] = valor;
            }

            if (!string.IsNullOrWhiteSpace(usuario)) Agregar("Usuario LIKE @usuario", "@usuario", "%" + usuario.Trim() + "%");
            if (!string.IsNullOrWhiteSpace(entidad)) Agregar("Entidad = @entidad", "@entidad", entidad.Trim());
            if (!string.IsNullOrWhiteSpace(accion)) Agregar("Accion = @accion", "@accion", accion.Trim().ToUpperInvariant());
            if (desde.HasValue) Agregar("Fecha >= @desde", "@desde", desde.Value.Date);
            if (hasta.HasValue) Agregar("Fecha < @hasta", "@hasta", hasta.Value.Date.AddDays(1));
            if (!string.IsNullOrWhiteSpace(texto))
                Agregar("(Clave LIKE @texto OR Valores_Anteriores LIKE @texto OR Valores_Nuevos LIKE @texto)", "@texto", "%" + texto.Trim() + "%");

            return Consultar("No se pudo consultar la auditoría.", db =>
            {
                int total = db.Database.SqlQuery<int>("SELECT COUNT(*) FROM AUDITORIA" + filtro, Parametros(valores)).Single();
                int pagina = pageSize == 0 ? 1 : page;
                int tamanio = pageSize == 0 ? Math.Max(total, 1) : pageSize;

                valores["@desplazamiento"] = (pagina - 1) * tamanio;
                valores["@cantidad"] = tamanio;
                var items = db.Database.SqlQuery<Movimiento>(
                    "SELECT Auditoria_ID, Fecha, Usuario, Accion, Entidad, Clave, Valores_Anteriores, Valores_Nuevos, Origen FROM AUDITORIA" +
                    filtro + " ORDER BY Fecha DESC, Auditoria_ID DESC OFFSET @desplazamiento ROWS FETCH NEXT @cantidad ROWS ONLY",
                    Parametros(valores)).ToList();

                return new { items, total, page = pagina, pageSize = tamanio, totalPages = (int)Math.Ceiling(total / (double)tamanio) };
            });
        }

        [HttpGet, Route("Entidades")]
        public IHttpActionResult GetEntidades()
        {
            return Consultar("No se pudieron cargar las entidades.", db => Distintos(db, "Entidad"));
        }

        [HttpGet, Route("Usuarios")]
        public IHttpActionResult GetUsuarios()
        {
            return Consultar("No se pudieron cargar los usuarios.", db => Distintos(db, "Usuario"));
        }

        private IHttpActionResult Consultar(string mensaje, Func<SGTLAuditContext, object> consulta)
        {
            try
            {
                using (var db = new SGTLAuditContext(conexion))
                {
                    return Ok(consulta(db));
                }
            }
            catch (Exception ex)
            {
                Trace.TraceError("Auditoría: {0}", ex.Message);
                return Content(HttpStatusCode.InternalServerError, new { error = mensaje });
            }
        }

        private static List<string> Distintos(SGTLAuditContext db, string columna)
        {
            return db.Database.SqlQuery<string>("SELECT DISTINCT " + columna + " FROM AUDITORIA WHERE LTRIM(RTRIM(" + columna + ")) <> '' ORDER BY " + columna).ToList();
        }

        private static SqlParameter[] Parametros(Dictionary<string, object> valores)
        {
            return valores.Select(v => new SqlParameter(v.Key, v.Value)).ToArray();
        }
    }
}