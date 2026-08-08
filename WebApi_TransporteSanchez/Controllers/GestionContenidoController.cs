using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Entity;
using System.Data.Entity.Validation;
using System.Data.SqlClient;
using System.Text;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class GestionContenidoController : ApiController
    {

        public class GestionContenidoDto
        {
            public int GestionContenido_ID { get; set; }
            public string Logo { get; set; } // Se puede dejar como null
            public string ColorFondo { get; set; } // Se puede dejar como null
            public string ColorBotonesMenu { get; set; } // Se puede dejar como null
            public string ContenidoPiePagina { get; set; } // Se puede dejar como null
            public DateTime? Fecha_Modi { get; set; } // Esto puede seguir como nullable
            public string Usu_Modi { get; set; } // Se puede dejar como null
        }



        // GET: api/GestionContenido
        public IHttpActionResult Get()
        {
            try
            {
                // Obtener la cadena de conexión dinámica
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new SGTLAuditContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var olist = db.Set<GESTION_CONTENIDO>().Select(c => new GestionContenidoDto
                    {
                        GestionContenido_ID = c.GestionContenido_ID,
                        Logo = c.Logo, // Se permite nulo
                        ColorFondo = c.ColorFondo, // Se permite nulo
                        ColorBotonesMenu = c.ColorBotonesMenu, // Se permite nulo
                        ContenidoPiePagina = c.ContenidoPiePagina, // Se permite nulo
                        Fecha_Modi = c.Fecha_Modi, // Se permite nulo
                        Usu_Modi = c.Usu_Modi // Se permite nulo
                    }).ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound(); // 404 si no hay contenido
                    }

                    return Ok(olist); // 200 OK con la lista de contenido
                }
            }
            catch (Exception ex)
            {
                // Manejo de errores generales
                return InternalServerError(ex); // 500 Internal Server Error
            }
        }

        // GET: api/GestionContenido/1
        public IHttpActionResult Get(int id)
        {
            try
            {
                // Validar que el ID sea 1
                if (id != 1)
                {
                    return BadRequest("Solo se permite el ID 1."); // 400 Bad Request
                }

                // Obtener la cadena de conexión dinámica
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new SGTLAuditContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    // Buscar el contenido basado en el ID
                    var content = db.Set<GESTION_CONTENIDO>()
                                    .Where(c => c.GestionContenido_ID == id)
                                    .Select(c => new GestionContenidoDto
                                    {
                                        GestionContenido_ID = c.GestionContenido_ID,
                                        Logo = c.Logo, // Se permite nulo
                                        ColorFondo = c.ColorFondo, // Se permite nulo
                                        ColorBotonesMenu = c.ColorBotonesMenu, // Se permite nulo
                                        ContenidoPiePagina = c.ContenidoPiePagina, // Se permite nulo
                                        Fecha_Modi = c.Fecha_Modi, // Se permite nulo
                                        Usu_Modi = c.Usu_Modi // Se permite nulo
                                    }).FirstOrDefault();

                    if (content == null)
                    {
                        return NotFound(); // 404 si no se encuentra el contenido
                    }

                    return Ok(content); // 200 OK con el contenido encontrado
                }
            }
            catch (Exception ex)
            {
                // Manejo de errores generales
                return InternalServerError(ex); // 500 Internal Server Error
            }
        }


        // PUT: api/GestionContenido/{id}
        public IHttpActionResult Put(int id, [FromBody] GESTION_CONTENIDO value)
        {
            if (value == null)
            {
                return BadRequest("Datos inválidos."); // 400 Bad Request si el cuerpo está vacío o es incorrecto
            }

            try
            {
                // Obtener la cadena de conexión dinámica
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new SGTLAuditContext(connectionString))
                {
                    // Verificar que el registro exista
                    if (!db.Set<GESTION_CONTENIDO>().Any(x => x.GestionContenido_ID == id))
                    {
                        return NotFound(); // 404 si no se encuentra el contenido
                    }

                    var fechaModi = (value.Fecha_Modi != default(DateTime)) ? value.Fecha_Modi : DateTime.Now;

                    // Valores actuales (antes del cambio) para el detalle de auditoría.
                    var actual = db.Database.SqlQuery<GestionContenidoDto>(
                        "SELECT GestionContenido_ID, Logo, ColorFondo, ColorBotonesMenu, ContenidoPiePagina, Fecha_Modi, Usu_Modi " +
                        "FROM GESTION_CONTENIDO WHERE GestionContenido_ID = @idsel",
                        new SqlParameter("@idsel", id)).FirstOrDefault();

                    // Actualización vía SQL directo: evita el facet MaxLength(255) del modelo,
                    // necesario para guardar el Logo en base64 (la columna ya es NVARCHAR(MAX)).
                    int filas = db.Database.ExecuteSqlCommand(
                        "UPDATE GESTION_CONTENIDO SET Logo = @logo, ColorFondo = @fondo, " +
                        "ColorBotonesMenu = @menu, ContenidoPiePagina = @pie, " +
                        "Fecha_Modi = @fecha, Usu_Modi = @usu WHERE GestionContenido_ID = @id",
                        new SqlParameter("@logo", (object)value.Logo ?? DBNull.Value),
                        new SqlParameter("@fondo", (object)value.ColorFondo ?? DBNull.Value),
                        new SqlParameter("@menu", (object)value.ColorBotonesMenu ?? DBNull.Value),
                        new SqlParameter("@pie", (object)value.ContenidoPiePagina ?? DBNull.Value),
                        new SqlParameter("@fecha", fechaModi),
                        new SqlParameter("@usu", (object)value.Usu_Modi ?? DBNull.Value),
                        new SqlParameter("@id", id));

                    if (filas == 0) return NotFound();

                    // Auditoría manual (esta ruta no pasa por SaveChanges). Registramos el antes
                    // y el después, solo de los campos que cambiaron. El logo se resume para no
                    // volcar el base64 en la bitácora. El try/catch evita romper el guardado.
                    try
                    {
                        var antes = new Dictionary<string, string>();
                        var despues = new Dictionary<string, string>();
                        AgregarCambio(antes, despues, "ColorFondo", actual?.ColorFondo, value.ColorFondo);
                        AgregarCambio(antes, despues, "ColorBotonesMenu", actual?.ColorBotonesMenu, value.ColorBotonesMenu);
                        AgregarCambio(antes, despues, "ContenidoPiePagina", actual?.ContenidoPiePagina, value.ContenidoPiePagina);
                        if (!string.Equals(actual?.Logo, value.Logo))
                        {
                            antes["Logo"] = ResumirLogo(actual?.Logo);
                            despues["Logo"] = ResumirLogo(value.Logo);
                        }

                        db.Database.ExecuteSqlCommand(
                            "INSERT INTO AUDITORIA (Fecha, Usuario, Accion, Entidad, Clave, Valores_Anteriores, Valores_Nuevos, Origen) " +
                            "VALUES (GETDATE(), @usu, 'UPDATE', 'GESTION_CONTENIDO', @clave, @ant, @nue, NULL)",
                            new SqlParameter("@usu", (object)value.Usu_Modi ?? DBNull.Value),
                            new SqlParameter("@clave", "GestionContenido_ID=" + id),
                            new SqlParameter("@ant", (object)ToJson(antes) ?? DBNull.Value),
                            new SqlParameter("@nue", (object)ToJson(despues) ?? DBNull.Value));
                    }
                    catch { }

                    return Ok("Actualización exitosa."); // 200 OK
                }
            }
            catch (DbEntityValidationException ex)
            {
                // Manejo de errores de validación
                var validationErrors = new List<string>();

                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Propiedad: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }

                // Registrar errores
                foreach (var validationError in validationErrors)
                {
                    Console.WriteLine(validationError); // Puedes registrar el error en logs, si lo prefieres
                }

                // Retornar los errores de validación como respuesta 400 Bad Request
                return Content(HttpStatusCode.BadRequest, validationErrors); // 400 Bad Request con listado de errores de validación
            }
            catch (Exception ex)
            {
                // Manejo de errores generales
                return InternalServerError(ex); // 500 Internal Server Error para otros errores no esperados
            }
        }

        // ===================== utilitarios de auditoría =====================

        private static void AgregarCambio(Dictionary<string, string> antes, Dictionary<string, string> despues,
            string campo, string valorAntes, string valorNuevo)
        {
            if (!string.Equals(valorAntes, valorNuevo))
            {
                antes[campo] = valorAntes;
                despues[campo] = valorNuevo;
            }
        }

        // Resume el logo para la bitácora: no volcamos el base64 completo.
        private static string ResumirLogo(string logo)
        {
            if (string.IsNullOrEmpty(logo)) return "(vacío)";
            if (logo.StartsWith("data:")) return "[imagen subida en base64, " + logo.Length + " caracteres]";
            if (logo.Length > 200) return logo.Substring(0, 200) + "… (" + logo.Length + " caracteres)";
            return logo;
        }

        private static string ToJson(Dictionary<string, string> dict)
        {
            if (dict == null || dict.Count == 0) return null;
            var sb = new StringBuilder("{");
            bool primero = true;
            foreach (var kv in dict)
            {
                if (!primero) sb.Append(",");
                primero = false;
                sb.Append('"').Append(EscaparJson(kv.Key)).Append("\":");
                if (kv.Value == null) sb.Append("null");
                else sb.Append('"').Append(EscaparJson(kv.Value)).Append('"');
            }
            sb.Append("}");
            return sb.ToString();
        }

        private static string EscaparJson(string s)
        {
            if (string.IsNullOrEmpty(s)) return s ?? "";
            var sb = new StringBuilder(s.Length + 8);
            foreach (var c in s)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < ' ') sb.Append("\\u").Append(((int)c).ToString("x4"));
                        else sb.Append(c);
                        break;
                }
            }
            return sb.ToString();
        }




    }
}
