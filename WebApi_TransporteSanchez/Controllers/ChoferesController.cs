using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Data.SqlClient;
using System.Text.RegularExpressions;
using WebApi_TransporteSanchez.Security;

namespace WebApi_TransporteSanchez.Controllers
{
    public class ChoferesController : ApiController
    {
        public class ChoferDto
        {
            public int Chofer_ID { get; set; }
            public string DNI { get; set; }
            public string CUIL { get; set; }
            public string Nombre { get; set; }
            public string Apellido { get; set; }
            public string TelefonoFijo { get; set; }
            public string TelefonoCelular { get; set; }
            public string Email { get; set; }
            public int ProvID { get; set; }
            public int LocID { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
            public string EstadoChofer { get; set; }
            public DateTime Fecha_Alta { get; set; } 
            public string Usu_Alta { get; set; }
            public DateTime Fecha_Modi { get; set; } 
            public string Usu_Modi { get; set; }
            public AccesoDto Acceso { get; set; }
            public string Usuario_Nombre { get; set; }
            public string Usuario_Estado { get; set; }
        }

        public class AccesoDto
        {
            public string Nombre_Usuario { get; set; }
            public string Contraseña { get; set; }
        }

        private static readonly Regex NombreUsuarioValido = new Regex("^[A-Za-z0-9_]{1,50}$");

        // null si está bien. Si no, el error del campo. Sin usuario ni contraseña, null cuando no es obligatorio.
        private static object ValidarAcceso(SGTLAuditContext db, AccesoDto acceso, string emailChofer, bool obligatorio, out string email)
        {
            email = null;
            var nombre = acceso == null ? "" : (acceso.Nombre_Usuario ?? "").Trim();
            var contrasena = acceso == null ? "" : (acceso.Contraseña ?? "");
            if (nombre.Length == 0 && contrasena.Length == 0 && !obligatorio)
                return null;

            if (string.IsNullOrWhiteSpace(emailChofer))
                return new { PropertyName = "Email", ErrorMessage = "Completá el e-mail." };

            try
            {
                email = RecuperoContrasena.NormalizarEmail(emailChofer);
            }
            catch (ArgumentException)
            {
                return new { PropertyName = "Email", ErrorMessage = "Ingresá un e-mail válido." };
            }

            // CHOFERES.Email es nvarchar(50) y el usuario guarda el mismo valor.
            if (email.Length > 50)
                return new { PropertyName = "Email", ErrorMessage = "El e-mail puede tener hasta 50 caracteres." };

            if (db.Database.SqlQuery<int>(
                    "SELECT COUNT(*) FROM dbo.USUARIOS WHERE Email = @email",
                    new SqlParameter("@email", email)).Single() > 0)
                return new { PropertyName = "Email", ErrorMessage = "Ese e-mail ya está registrado en otro usuario." };

            if (nombre.Length == 0)
                return new { PropertyName = "Nombre_Usuario", ErrorMessage = "Completá el nombre de usuario." };
            if (!NombreUsuarioValido.IsMatch(nombre))
                return new { PropertyName = "Nombre_Usuario", ErrorMessage = "Usá solo letras, números y guion bajo." };

            if (db.Database.SqlQuery<int>(
                    "SELECT COUNT(*) FROM dbo.USUARIOS WHERE NombreUsuarioUnico = LOWER(LTRIM(RTRIM(@nombre)))",
                    new SqlParameter("@nombre", nombre)).Single() > 0)
                return new { PropertyName = "Nombre_Usuario", ErrorMessage = "Ya existe un usuario con ese nombre de usuario." };

            string errorClave;
            if (contrasena.Length == 0)
                return new { PropertyName = "Contraseña", ErrorMessage = "Completá la contraseña." };
            if (!ClavesSeguras.Validar(contrasena, out errorClave))
                return new { PropertyName = "Contraseña", ErrorMessage = errorClave };

            return null;
        }

        // El índice único de NombreUsuarioUnico rechaza el INSERT si estas opciones no están prendidas.
        private static void PrepararConexion(SGTLAuditContext db)
        {
            if (db.Database.Connection.State != ConnectionState.Open)
                db.Database.Connection.Open();

            db.Database.ExecuteSqlCommand(
                TransactionalBehavior.DoNotEnsureTransaction,
                @"SET ANSI_NULLS ON;
                SET ANSI_PADDING ON;
                SET ANSI_WARNINGS ON;
                SET ARITHABORT ON;
                SET CONCAT_NULL_YIELDS_NULL ON;
                SET QUOTED_IDENTIFIER ON;
                SET NUMERIC_ROUNDABORT OFF;");
        }

        private static int CrearUsuario(SGTLAuditContext db, CHOFERES chofer, AccesoDto acceso, string email, string quien)
        {
            var alta = (quien ?? "").Trim();
            if (alta.Length > 20)
                alta = alta.Substring(0, 20);

            return db.Database.SqlQuery<int>(@"
        INSERT INTO dbo.USUARIOS
            (Nombre, Apellido, Nombre_Usuario, Contraseña, Email, Rol, EstadoUsuario,
            Fecha_Alta, Fecha_Modi, Usu_Alta, Usu_Modi, VersionSesion, ChoferID)
        OUTPUT INSERTED.Usuario_ID
        VALUES
            (@nombre, @apellido, @usuario, @clave, @email, N'chofer', N'Activo',
            GETDATE(), GETDATE(), @quien, @quien, 0, @chofer);",
                new SqlParameter("@nombre", (chofer.Nombre ?? "").Trim()),
                new SqlParameter("@apellido", (chofer.Apellido ?? "").Trim()),
                new SqlParameter("@usuario", acceso.Nombre_Usuario.Trim()),
                new SqlParameter("@clave", ClavesSeguras.Crear(acceso.Contraseña)),
                new SqlParameter("@email", email),
                new SqlParameter("@quien", alta),
                new SqlParameter("@chofer", chofer.Chofer_ID)).Single();
        }

        private static bool PideAcceso(AccesoDto acceso)
        {
            return acceso != null && (!string.IsNullOrWhiteSpace(acceso.Nombre_Usuario) || !string.IsNullOrEmpty(acceso.Contraseña));
        }

        private class UsuarioDelChoferRow
        {
            public string Nombre_Usuario { get; set; }
            public string EstadoUsuario { get; set; }
        }

        private static UsuarioDelChoferRow UsuarioDelChofer(SGTLAuditContext db, int choferId)
        {
            return db.Database.SqlQuery<UsuarioDelChoferRow>(
                "SELECT TOP (1) Nombre_Usuario, EstadoUsuario FROM dbo.USUARIOS WHERE ChoferID = @id ORDER BY Usuario_ID",
                new SqlParameter("@id", choferId)).FirstOrDefault();
        }

        // GET: api/Choferes/UsuarioLibre?nombre=rjuarez
        [HttpGet]
        [Route("api/Choferes/UsuarioLibre")]
        public IHttpActionResult UsuarioLibre(string nombre)
        {
            var buscado = (nombre ?? "").Trim();
            if (buscado.Length == 0)
                return Ok(new { Libre = false });

            using (var db = new SGTLAuditContext(ConnectionStringHelper.GetConnectionString("SGTLEntities")))
            {
                var tomado = db.Database.SqlQuery<int>(
                    "SELECT COUNT(*) FROM dbo.USUARIOS WHERE NombreUsuarioUnico = LOWER(LTRIM(RTRIM(@nombre)))",
                    new SqlParameter("@nombre", buscado)).Single() > 0;
                return Ok(new { Libre = !tomado });
            }
        }

        // GET: api/Choferes
        public IHttpActionResult Get()
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var olist = db.Set<CHOFERES>()
                                  .Where(c => c.EstadoChofer != "Eliminado")
                                  .Select(c => new ChoferDto
                                  {
                                      Chofer_ID = c.Chofer_ID,
                                      DNI = c.DNI,
                                      CUIL = c.CUIL,
                                      Nombre = c.Nombre,
                                      Apellido = c.Apellido,
                                      TelefonoFijo = c.TelefonoFijo,
                                      TelefonoCelular = c.TelefonoCelular,
                                      Email = c.Email,
                                      ProvID = c.ProvID,
                                      LocID = c.LocID,
                                      Calle = c.Calle,
                                      AlturaCalle = c.AlturaCalle.Trim(),
                                      EstadoChofer = c.EstadoChofer,
                                      Fecha_Alta = c.Fecha_Alta,
                                      Usu_Alta = c.Usu_Alta,
                                      Fecha_Modi = c.Fecha_Modi,
                                      Usu_Modi = c.Usu_Modi,
                                  }).ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound();
                    }

                    return Ok(olist);
                }
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception("Error al acceder a la base de datos.", ex));
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = new List<string>();
                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }
                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // GET: api/Choferes/{id}
        public IHttpActionResult Get(int id)
        {
            try
            {
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new SGTLAuditContext(connectionString))
                {
                    var chofer = db.Set<CHOFERES>()
                                   .Where(c => c.Chofer_ID == id && c.EstadoChofer != "Eliminado") 
                                   .Select(c => new ChoferDto
                                   {
                                       Chofer_ID = c.Chofer_ID,
                                       DNI = c.DNI,
                                       CUIL = c.CUIL,
                                       Nombre = c.Nombre,
                                       Apellido = c.Apellido,
                                       TelefonoFijo = c.TelefonoFijo,
                                       TelefonoCelular = c.TelefonoCelular,
                                       Email = c.Email,
                                       ProvID = c.ProvID,
                                       LocID = c.LocID,
                                       Calle = c.Calle,
                                       AlturaCalle = c.AlturaCalle.Trim(),
                                       EstadoChofer = c.EstadoChofer,
                                       Fecha_Alta = c.Fecha_Alta,
                                       Usu_Alta = c.Usu_Alta,
                                       Fecha_Modi = c.Fecha_Modi,
                                       Usu_Modi = c.Usu_Modi,
                                   }).FirstOrDefault();

                    if (chofer == null)
                    {
                        return NotFound();
                    }

                    var usuario = UsuarioDelChofer(db, id);
                    if (usuario != null)
                    {
                        chofer.Usuario_Nombre = usuario.Nombre_Usuario;
                        chofer.Usuario_Estado = usuario.EstadoUsuario;
                    }
                    return Ok(chofer);
                }
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception("Error al acceder a la base de datos.", ex));
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = new List<string>();
                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }
                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // GET: api/Choferes/Buscar
        [HttpGet]
        [Route("api/Choferes/Buscar")]
        public IHttpActionResult Buscar(string nombre = null, string apellido = null, string dni = null, string busqueda = null, string estadoChofer = null, DateTime? fechaDesde = null, DateTime? fechaHasta = null, int page = 1, int pageSize = 8)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var query = db.Set<CHOFERES>()
                                  .Where(c => c.EstadoChofer != "Eliminado") 
                                  .AsQueryable();

                    if (!string.IsNullOrWhiteSpace(busqueda))
                    {
                        var b = busqueda.Trim();
                        query = query.Where(c =>
                            (c.DNI != null && c.DNI.Contains(b)) ||
                            (c.Nombre != null && c.Nombre.Contains(b)) ||
                            (c.Apellido != null && c.Apellido.Contains(b)));
                    }
                    else
                    {
                        if (!string.IsNullOrEmpty(nombre))
                        {
                            query = query.Where(c => c.Nombre.Contains(nombre));
                        }

                        if (!string.IsNullOrEmpty(apellido))
                        {
                            query = query.Where(c => c.Apellido.Contains(apellido));
                        }

                        if (!string.IsNullOrEmpty(dni))
                        {
                            query = query.Where(c => c.DNI.Contains(dni));
                        }
                    }

                    if (!string.IsNullOrEmpty(estadoChofer))
                    {
                        var estados = estadoChofer.Split(',');
                        query = query.Where(c => estados.Contains(c.EstadoChofer));
                    }

                    if (fechaDesde.HasValue)
                    {
                        query = query.Where(c => c.Fecha_Alta >= fechaDesde.Value);
                    }

                    if (fechaHasta.HasValue)
                    {
                        query = query.Where(c => c.Fecha_Alta <= fechaHasta.Value);
                    }

                    var totalRecords = query.Count();

                    var results = query
                        .OrderByDescending(c => c.Chofer_ID)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(c => new ChoferDto
                        {
                            Chofer_ID = c.Chofer_ID,
                            DNI = c.DNI,
                            CUIL = c.CUIL,
                            Nombre = c.Nombre,
                            Apellido = c.Apellido,
                            TelefonoFijo = c.TelefonoFijo,
                            TelefonoCelular = c.TelefonoCelular,
                            Email = c.Email,
                            ProvID = c.ProvID,
                            LocID = c.LocID,
                            Calle = c.Calle,
                            AlturaCalle = c.AlturaCalle.Trim(),
                            EstadoChofer = c.EstadoChofer,
                            Fecha_Alta = c.Fecha_Alta,
                            Usu_Alta = c.Usu_Alta,
                            Fecha_Modi = c.Fecha_Modi,
                            Usu_Modi = c.Usu_Modi,
                        })
                        .ToList();

                    return Ok(new
                    {
                        TotalRecords = totalRecords,
                        Results = results
                    });
                }
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception("Error al acceder a la base de datos durante la búsqueda.", ex));
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = new List<string>();

                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }

                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Choferes/{choferID}/Chofer_Camion
        [HttpGet]
        [Route("api/Choferes/{choferID}/Chofer_Camion")]
        public IHttpActionResult GetChoferesByCamion(int choferID)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var camiones = from cc in db.Set<CHOFER_CAMION>()
                                   join c in db.Set<CAMIONES>() on cc.CamionID equals c.Camion_ID
                                   join ch in db.Set<CHOFERES>() on cc.ChoferID equals ch.Chofer_ID
                                   where cc.ChoferID == choferID
                                   && ch.EstadoChofer != "Eliminado" 
                                   select new
                                   {
                                       c.Camion_ID,
                                       c.Dominio,
                                       cc.Cedula,
                                   };

                    var result = camiones.ToList();

                    return Ok(result);
                }
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception("Error al acceder a la base de datos al obtener camiones del chofer.", ex));
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = ex.EntityValidationErrors
                    .SelectMany(e => e.ValidationErrors)
                    .Select(e => new { e.PropertyName, e.ErrorMessage })
                    .ToList();

                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Choferes/EstadoChofer/{id}
        [HttpPut]
        [Route("api/Choferes/EstadoChofer/{id}")]
        public IHttpActionResult PutEstadoChofer(int id, [FromBody] EstadoChoferUpdateModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var chofer = db.Set<CHOFERES>().Find(id);

                    if (chofer == null)
                    {
                        return NotFound();
                    }

                    var validationErrors = new List<object>();

                    if (chofer.EstadoChofer == "Eliminado")
                    {
                        validationErrors.Add(new
                        {
                            PropertyName = "EstadoChofer",
                            ErrorMessage = "No se puede cambiar el estado de un chofer eliminado."
                        });
                    }

                    if (validationErrors.Any())
                    {
                        return Content(HttpStatusCode.BadRequest, validationErrors);
                    }

                    chofer.EstadoChofer = model.EstadoChofer;
                    chofer.Fecha_Modi = DateTime.Now;
                    chofer.Usu_Modi = string.IsNullOrWhiteSpace(model.Usu_Modi) ? (chofer.Usu_Modi ?? "sistema") : model.Usu_Modi;

                    db.Configuration.ValidateOnSaveEnabled = false;
                    db.SaveChanges();

                    return Ok();
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Content(HttpStatusCode.Conflict, new
                {
                    Message = "La actualización falló debido a un conflicto de concurrencia.",
                    Details = ex.Message
                });
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = ex.EntityValidationErrors
                    .SelectMany(e => e.ValidationErrors)
                    .Select(e => new { e.PropertyName, e.ErrorMessage })
                    .ToList();

                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = ex.InnerException?.Message ?? ex.Message;
                return InternalServerError(new Exception("Error al actualizar la base de datos.", new Exception(errorMessage)));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        public class EstadoChoferUpdateModel
        {
            [Required]
            public string EstadoChofer { get; set; }
            public string Usu_Modi { get; set; }
        }

        // GET: Validación DNI
        [HttpGet]
        [Route("api/Choferes/ValidarDNI/{dni}/{id?}")]
        public IHttpActionResult GetDNIExists(string dni, int? id = null)
        {
            try
            {
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new SGTLAuditContext(connectionString))
                {
                    var choferConDni = db.Set<CHOFERES>().FirstOrDefault(c => c.DNI == dni);

                    if (choferConDni != null)
                    {
                        if (id.HasValue && choferConDni.Chofer_ID == id.Value)
                        {
                            return Ok(new
                            {
                                codigo = "DNI_permitido",
                                mensaje = "El DNI pertenece al mismo chofer, es válido."
                            });
                        }

                        if (choferConDni.EstadoChofer == "Eliminado")
                        {
                            return Ok(new
                            {
                                codigo = "DNI_no_registrado",
                                mensaje = "El DNI no se encuentra registrado, es válido."
                            });
                        }

                        return Ok(new
                        {
                            codigo = "DNI_registrado",
                            mensaje = "El DNI ya se encuentra registrado con otro chofer."
                        });
                    }

                    return Ok(new
                    {
                        codigo = "DNI_no_registrado",
                        mensaje = "El DNI no se encuentra registrado, es válido."
                    });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new
                {
                    codigo = "error_verificacion",
                    mensaje = "Error al verificar el DNI.",
                    detalles = ex.Message
                });
            }
        }

        // POST: api/Choferes
        public IHttpActionResult Post([FromBody] ChoferDto choferDto)
        {
            if (choferDto == null)
                return Content(HttpStatusCode.BadRequest, new { PropertyName = "Chofer", ErrorMessage = "Completá los datos del chofer." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    PrepararConexion(db);

                    using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                    {
                        string email;
                        var errorAcceso = ValidarAcceso(db, choferDto.Acceso, choferDto.Email, true, out email);
                        if (errorAcceso != null)
                            return Content(HttpStatusCode.BadRequest, errorAcceso);

                        var choferExistente = db.Set<CHOFERES>().FirstOrDefault(c => c.DNI == choferDto.DNI);
                        if (choferExistente != null)
                        {
                            return Content(HttpStatusCode.BadRequest, new
                            {
                                code = "chofer_duplicado",
                                message = "Ya existe un chofer registrado con este DNI."
                            });
                        }

                        var quien = (choferDto.Usu_Alta ?? "").Trim();
                        var chofer = new CHOFERES
                        {
                            DNI = choferDto.DNI,
                            CUIL = choferDto.CUIL,
                            Nombre = choferDto.Nombre,
                            Apellido = choferDto.Apellido,
                            TelefonoFijo = choferDto.TelefonoFijo?.Trim(),
                            TelefonoCelular = choferDto.TelefonoCelular,
                            Email = email,
                            ProvID = choferDto.ProvID,
                            LocID = choferDto.LocID,
                            Calle = choferDto.Calle,
                            AlturaCalle = choferDto.AlturaCalle?.Trim(),
                            EstadoChofer = choferDto.EstadoChofer,
                            Fecha_Alta = choferDto.Fecha_Alta,
                            Usu_Alta = quien,
                            Fecha_Modi = choferDto.Fecha_Modi,
                            Usu_Modi = choferDto.Usu_Modi
                        };

                        db.Set<CHOFERES>().Add(chofer);
                        db.SaveChanges();

                        int usuarioId;
                        try
                        {
                            usuarioId = CrearUsuario(db, chofer, choferDto.Acceso, email, quien);
                        }
                        catch (Exception ex)
                        {
                            var sql = ex as SqlException ?? ex.InnerException as SqlException;
                            if (sql != null && (sql.Number == 2601 || sql.Number == 2627))
                            {
                                if ((sql.Message ?? "").IndexOf("Email", StringComparison.OrdinalIgnoreCase) >= 0)
                                    return Content(HttpStatusCode.BadRequest, new { PropertyName = "Email", ErrorMessage = "Ese e-mail ya está registrado en otro usuario." });
                                return Content(HttpStatusCode.BadRequest, new { PropertyName = "Nombre_Usuario", ErrorMessage = "Ya existe un usuario con ese nombre de usuario." });
                            }
                            throw;
                        }

                        tx.Commit();

                        SGTLAuditContext.RegistrarEvento(connectionString, quien.Length <= 20 ? quien : quien.Substring(0, 20),
                            "INSERT", "USUARIOS", "Usuario_ID=" + usuarioId,
                            "ChoferID=" + chofer.Chofer_ID + ", Email=" + email + ", Rol=chofer");

                        return Ok(new { chofer.Chofer_ID, Usuario_Nombre = choferDto.Acceso.Nombre_Usuario.Trim() });
                    }
                }
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = new List<string>();
                foreach (var validationResult in ex.EntityValidationErrors)
                    foreach (var error in validationResult.ValidationErrors)
                        validationErrors.Add("Property: " + error.PropertyName + ", Error: " + error.ErrorMessage);
                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(ex);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // PUT: api/Choferes/{id}
        public IHttpActionResult Put(int id, [FromBody] ChoferDto choferDto)
        {
            if (choferDto == null)
                return Content(HttpStatusCode.BadRequest, new { PropertyName = "Chofer", ErrorMessage = "Completá los datos del chofer." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            using (var db = new SGTLAuditContext(connectionString))
            {
                var chofer = db.Set<CHOFERES>().Find(id);

                if (chofer == null)
                    return NotFound();

                var validationErrors = new List<object>();

                if (chofer.EstadoChofer == "Eliminado")
                    validationErrors.Add(new { PropertyName = "EstadoChofer", ErrorMessage = "No se puede editar un chofer eliminado." });

                if (validationErrors.Any())
                    return Content(HttpStatusCode.BadRequest, validationErrors);

                bool crearUsuario = PideAcceso(choferDto.Acceso) && UsuarioDelChofer(db, id) == null;
                string emailUsuario = null;
                if (crearUsuario)
                {
                    var errorAcceso = ValidarAcceso(db, choferDto.Acceso, choferDto.Email, true, out emailUsuario);
                    if (errorAcceso != null)
                        return Content(HttpStatusCode.BadRequest, new List<object> { errorAcceso });
                }

                chofer.DNI = choferDto.DNI;
                chofer.CUIL = choferDto.CUIL;
                chofer.Nombre = choferDto.Nombre;
                chofer.Apellido = choferDto.Apellido;
                chofer.TelefonoFijo = choferDto.TelefonoFijo?.Trim();
                chofer.TelefonoCelular = choferDto.TelefonoCelular;
                chofer.Email = crearUsuario ? emailUsuario : choferDto.Email;
                chofer.ProvID = choferDto.ProvID;
                chofer.LocID = choferDto.LocID;
                chofer.Calle = choferDto.Calle;
                chofer.AlturaCalle = choferDto.AlturaCalle?.Trim();
                chofer.Fecha_Modi = choferDto.Fecha_Modi;
                chofer.Usu_Modi = choferDto.Usu_Modi;

                db.Entry(chofer).State = System.Data.Entity.EntityState.Modified;

                try
                {
                    string nombreUsuario = null;

                    using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                    {
                        if (crearUsuario)
                            PrepararConexion(db);

                        db.SaveChanges();

                        if (crearUsuario)
                        {
                            try
                            {
                                CrearUsuario(db, chofer, choferDto.Acceso, emailUsuario, choferDto.Usu_Modi);
                                nombreUsuario = choferDto.Acceso.Nombre_Usuario.Trim();
                            }
                            catch (Exception ex)
                            {
                                var sql = ex as SqlException ?? ex.InnerException as SqlException;
                                if (sql != null && (sql.Number == 2601 || sql.Number == 2627))
                                {
                                    if ((sql.Message ?? "").IndexOf("Email", StringComparison.OrdinalIgnoreCase) >= 0)
                                        return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Email", ErrorMessage = "Ese e-mail ya está registrado en otro usuario." } });
                                    return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Nombre_Usuario", ErrorMessage = "Ya existe un usuario con ese nombre de usuario." } });
                                }
                                throw;
                            }
                        }

                        tx.Commit();
                    }

                    if (nombreUsuario != null)
                    {
                        var quien = (choferDto.Usu_Modi ?? "").Trim();
                        if (quien.Length > 20)
                            quien = quien.Substring(0, 20);
                        SGTLAuditContext.RegistrarEvento(connectionString, quien, "INSERT", "USUARIOS",
                            "ChoferID=" + chofer.Chofer_ID, "Email=" + emailUsuario + ", Rol=chofer (usuario creado al editar el chofer)");
                    }

                    return Ok(new { chofer.Chofer_ID, Usuario_Nombre = nombreUsuario });
                }
                catch (DbEntityValidationException ex)
                {
                    foreach (var validationResult in ex.EntityValidationErrors)
                        foreach (var error in validationResult.ValidationErrors)
                            validationErrors.Add(new { PropertyName = error.PropertyName, ErrorMessage = error.ErrorMessage });
                    return Content(HttpStatusCode.BadRequest, validationErrors);
                }
                catch (DbUpdateConcurrencyException)
                {
                    return Conflict();
                }
                catch (DbUpdateException ex)
                {
                    return InternalServerError(ex);
                }
            }
        }


        // PUT: api/Choferes/Eliminar/{id}
        [HttpPut]
        [Route("api/Choferes/Eliminar/{id}")]
        public IHttpActionResult EliminarChofer(int id, [FromBody] EliminarChoferModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var chofer = db.Set<CHOFERES>().Find(id);

                    if (chofer == null)
                    {
                        return NotFound();
                    }

                    var validationErrors = new List<object>();

                    if (chofer.EstadoChofer == "Eliminado")
                    {
                        validationErrors.Add(new { PropertyName = "EstadoChofer", ErrorMessage = "El chofer ya se encuentra eliminado." });
                    }

                    if (chofer.EstadoChofer == "Activo")
                    {
                        validationErrors.Add(new { PropertyName = "EstadoChofer", ErrorMessage = "No se puede eliminar un chofer activo. Inactívelo primero." });
                    }

                    if (validationErrors.Any())
                    {
                        return Content(HttpStatusCode.BadRequest, validationErrors);
                    }

                    PrepararConexion(db);

                    using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                    {
                        DateTime fechaActual = DateTime.Now;
                        chofer.EstadoChofer = "Eliminado";
                        chofer.Fecha_Modi = fechaActual;
                        chofer.Usu_Modi = model.Usu_Modi;

                        db.Configuration.ValidateOnSaveEnabled = false;
                        db.SaveChanges();

                        var quien = (model.Usu_Modi ?? "").Trim();
                        if (quien.Length > 20)
                            quien = quien.Substring(0, 20);

                        var cuentas = db.Database.ExecuteSqlCommand(@"
                    UPDATE dbo.USUARIOS
                    SET EstadoUsuario = N'Inactivo', Fecha_Modi = GETDATE(), Usu_Modi = @quien
                    WHERE ChoferID = @id AND EstadoUsuario <> N'Inactivo';",
                            new SqlParameter("@quien", quien),
                            new SqlParameter("@id", id));

                        tx.Commit();

                        if (cuentas > 0)
                            SGTLAuditContext.RegistrarEvento(connectionString, quien, "UPDATE", "USUARIOS",
                                "ChoferID=" + id, "EstadoUsuario: Activo -> Inactivo (se eliminó su chofer)");

                        return Ok("El chofer fue eliminado correctamente.");
                    }
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Content(HttpStatusCode.Conflict, new
                {
                    Message = "La eliminación falló debido a un conflicto de concurrencia.",
                    Details = ex.Message
                });
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = ex.EntityValidationErrors
                    .SelectMany(e => e.ValidationErrors)
                    .Select(e => new { e.PropertyName, e.ErrorMessage })
                    .ToList();

                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (DbUpdateException ex)
            {
                var errorMessage = ex.InnerException?.Message ?? ex.Message;
                return InternalServerError(new Exception("Error al actualizar la base de datos.", new Exception(errorMessage)));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        public class EliminarChoferModel
        {
            [Required]
            public string Usu_Modi { get; set; }
        }


    }

}
