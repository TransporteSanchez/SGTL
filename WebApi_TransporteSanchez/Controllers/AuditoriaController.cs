using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Text;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    // Consulta de la bitacora de auditoria (solo lectura).
    // Alimenta la pantalla gestion-auditoria.html.
    [RoutePrefix("api/Auditoria")]
    public class AuditoriaController : ApiController
    {
        public class AuditoriaDTO
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

        private static string Cn()
        {
            return ConnectionStringHelper.GetConnectionString("SGTLEntities");
        }

        // GET: api/Auditoria?usuario=&entidad=&accion=&desde=&hasta=&texto=&page=1&pageSize=20
        [HttpGet]
        [Route("")]
        public IHttpActionResult Get(string usuario = null, string entidad = null, string accion = null,
            string desde = null, string hasta = null, string texto = null, int page = 1, int pageSize = 20)
        {
            if (page < 1) page = 1;
            if (pageSize < 0 || pageSize > 200) pageSize = 20;

            var where = new StringBuilder(" WHERE 1 = 1 ");
            var parametros = new List<SqlParameter>();

            if (!string.IsNullOrWhiteSpace(usuario))
            {
                where.Append(" AND Usuario LIKE @usuario ");
                parametros.Add(new SqlParameter("@usuario", "%" + usuario.Trim() + "%"));
            }
            if (!string.IsNullOrWhiteSpace(entidad))
            {
                where.Append(" AND Entidad = @entidad ");
                parametros.Add(new SqlParameter("@entidad", entidad.Trim()));
            }
            if (!string.IsNullOrWhiteSpace(accion))
            {
                where.Append(" AND Accion = @accion ");
                parametros.Add(new SqlParameter("@accion", accion.Trim().ToUpperInvariant()));
            }
            DateTime dt;
            if (!string.IsNullOrWhiteSpace(desde) &&
                DateTime.TryParse(desde, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt))
            {
                where.Append(" AND Fecha >= @desde ");
                parametros.Add(new SqlParameter("@desde", dt.Date));
            }
            if (!string.IsNullOrWhiteSpace(hasta) &&
                DateTime.TryParse(hasta, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt))
            {
                where.Append(" AND Fecha < @hasta ");
                parametros.Add(new SqlParameter("@hasta", dt.Date.AddDays(1)));
            }
            if (!string.IsNullOrWhiteSpace(texto))
            {
                where.Append(" AND (Clave LIKE @texto OR Valores_Anteriores LIKE @texto OR Valores_Nuevos LIKE @texto) ");
                parametros.Add(new SqlParameter("@texto", "%" + texto.Trim() + "%"));
            }

            try
            {
                using (var db = new DbContext(Cn()))
                {
                    // total
                    var pTotal = parametros.Select(Clonar).ToArray();
                    int total = db.Database.SqlQuery<int>(
                        "SELECT COUNT(*) FROM AUDITORIA" + where, pTotal).FirstOrDefault();
                    if (pageSize == 0)
                    {
                        page = 1;
                        pageSize = Math.Max(total, 1);
                    }

                    // pagina
                    var pPage = parametros.Select(Clonar).ToList();
                    pPage.Add(new SqlParameter("@offset", (page - 1) * pageSize));
                    pPage.Add(new SqlParameter("@limit", pageSize));

                    string sql =
                        "SELECT Auditoria_ID, Fecha, Usuario, Accion, Entidad, Clave, " +
                        "Valores_Anteriores, Valores_Nuevos, Origen " +
                        "FROM AUDITORIA" + where +
                        " ORDER BY Fecha DESC, Auditoria_ID DESC " +
                        " OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY";

                    var items = db.Database.SqlQuery<AuditoriaDTO>(sql, pPage.ToArray()).ToList();

                    return Ok(new
                    {
                        items,
                        total,
                        page,
                        pageSize,
                        totalPages = (int)Math.Ceiling(total / (double)pageSize)
                    });
                }
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException?.Message ?? ex.Message;
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al consultar la auditoria.", detalle = msg });
            }
        }

        // GET: api/Auditoria/Entidades  -> lista de entidades distintas (para el combo del filtro)
        [HttpGet]
        [Route("Entidades")]
        public IHttpActionResult GetEntidades()
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var lista = db.Database.SqlQuery<string>(
                        "SELECT DISTINCT Entidad FROM AUDITORIA WHERE Entidad IS NOT NULL ORDER BY Entidad").ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException?.Message ?? ex.Message;
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al obtener entidades.", detalle = msg });
            }
        }

        // GET: api/Auditoria/Usuarios  -> usuarios distintos presentes en la auditoría (para el filtro)
        [HttpGet]
        [Route("Usuarios")]
        public IHttpActionResult GetUsuarios()
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var lista = db.Database.SqlQuery<string>(
                        "SELECT DISTINCT Usuario FROM AUDITORIA WHERE Usuario IS NOT NULL AND LTRIM(RTRIM(Usuario)) <> '' ORDER BY Usuario").ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException?.Message ?? ex.Message;
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al obtener usuarios.", detalle = msg });
            }
        }

        // Un SqlParameter no se puede reutilizar entre comandos: clonamos por cada query.
        private static SqlParameter Clonar(SqlParameter p)
        {
            return new SqlParameter(p.ParameterName, p.Value);
        }
    }
}
