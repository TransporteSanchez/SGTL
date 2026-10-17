using System;

using System.Collections.Generic;

using System.Data.Entity.Validation;

using System.Data.Entity;

using System.Linq;

using System.Net;

using System.Net.Http;

using System.Web.Http;

using static WebApi_TransporteSanchez.Controllers.ChoferesController;

using System.Data.Entity.Infrastructure;

using System.Web.UI.WebControls;

using System.ComponentModel.DataAnnotations;



namespace WebApi_TransporteSanchez.Controllers

{

    [RoutePrefix("api/Usuarios")]

    public class UsuariosController : ApiController

    {



        public class UsuariosDto

        {

            public int Usuario_ID { get; set; }

            public string Nombre { get; set; }

            public string Apellido { get; set; }

            public string Nombre_Usuario { get; set; }

            public DateTime Fecha_Alta { get; set; }

            public string Rol { get; set; }

            public string EstadoUsuario { get; set; }

        }



        // GET: api/Usuarios

        public IHttpActionResult Get()

        {

            // Obtener la cadena de conexión dinámica

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada

                {

                    var usuarios = db.Set<USUARIOS>()

                        .Select(u => new UsuariosDto

                        {

                            Usuario_ID = u.Usuario_ID,

                            Nombre = u.Nombre,

                            Apellido = u.Apellido,

                            Nombre_Usuario = u.Nombre_Usuario,

                            Fecha_Alta = u.Fecha_Alta,

                            Rol = u.Rol,

                            EstadoUsuario = u.EstadoUsuario

                        })

                        .ToList();



                    if (usuarios == null || !usuarios.Any())

                    {

                        return NotFound(); // Retorna 404 si no se encuentran usuarios

                    }



                    return Ok(usuarios); // Retorna 200 con la lista de usuarios

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

                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");

                    }

                }



                return Content(HttpStatusCode.BadRequest, validationErrors); // Retorna 400 Bad Request con errores de validación

            }

            catch (Exception ex)

            {

                return InternalServerError(ex); // Retorna 500 en caso de error interno

            }

        }



        [HttpGet]

        [Route("Roles")]

        public IHttpActionResult GetRoles()

        {

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    var roles = db.Set<USUARIOS>()

                        .Where(u => u.Rol != null && u.Rol.Trim() != "")

                        .Select(u => u.Rol)

                        .Distinct()

                        .OrderBy(r => r)

                        .ToList();



                    return Ok(roles);

                }

            }

            catch (Exception ex)

            {

                return InternalServerError(ex);

            }

        }



        // GET: api/Usuarios/MenusPermitidos?username=xxx
        // Devuelve el Rol del usuario y los nombres de menús permitidos (via sus grupos), para el control de acceso (RBAC).
        [HttpGet]
        [Route("MenusPermitidos")]
        public IHttpActionResult GetMenusPermitidos(string username)
        {
            if (string.IsNullOrWhiteSpace(username)) return BadRequest("Falta el nombre de usuario.");
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var user = db.Set<USUARIOS>()
                        .Where(u => u.Nombre_Usuario == username)
                        .Select(u => new { u.Usuario_ID, u.Rol })
                        .FirstOrDefault();
                    if (user == null) return NotFound();

                    var grupoIds = db.Set<GRUPOS_USUARIOS>()
                        .Where(gu => gu.UsuarioID == user.Usuario_ID)
                        .Select(gu => gu.GrupoID).ToList();

                    var menuIds = db.Set<GRUPOS_MENU>()
                        .Where(gm => grupoIds.Contains(gm.GrupoID))
                        .Select(gm => gm.MenuID).Distinct().ToList();

                    var menus = db.Set<MENU>()
                        .Where(m => menuIds.Contains(m.Menu_ID))
                        .Select(m => m.Menu_Nombre).ToList();

                    return Ok(new { Rol = user.Rol, Menus = menus });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("Buscar")]

        public IHttpActionResult Buscar(string nombre = null, string apellido = null, string nombreusuario = null, string EstadoUsuario = null, int page = 1, int pageSize = 8)

        {

            // Obtener la cadena de conexión dinámica

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                // Usar DbContext directamente con la cadena de conexión personalizada

                using (var db = new SGTLAuditContext(connectionString))

                {

                    // Consultar los choferes en la base de datos

                    var query = db.Set<USUARIOS>().AsQueryable();



                    if (!string.IsNullOrEmpty(nombre))

                    {

                        query = query.Where(u => u.Nombre.Contains(nombre));

                    }



                    if (!string.IsNullOrEmpty(apellido))

                    {

                        query = query.Where(u => u.Apellido.Contains(apellido));

                    }



                    if (!string.IsNullOrEmpty(nombreusuario))

                    {

                        query = query.Where(u => u.Nombre_Usuario.Contains(nombreusuario));

                    }



                    if (!string.IsNullOrEmpty(EstadoUsuario))

                    {

                        var estados = EstadoUsuario.Split(',');

                        query = query.Where(c => estados.Contains(c.EstadoUsuario));

                    }



                    var totalRecords = query.Count();
                    if (pageSize == 0)
                    {
                        page = 1;
                        pageSize = Math.Max(totalRecords, 1);
                    }
                    else if (pageSize < 1)
                    {
                        pageSize = 8;
                    }

                    var results = query

                        .OrderBy(u => u.Nombre)

                        .Skip((page - 1) * pageSize)

                        .Take(pageSize)

                        .Select(u => new UsuariosDto

                        {

                            Usuario_ID = u.Usuario_ID,

                            Nombre = u.Nombre,

                            Apellido = u.Apellido,

                            Nombre_Usuario = u.Nombre_Usuario,

                            EstadoUsuario = u.EstadoUsuario,

                            Fecha_Alta = u.Fecha_Alta



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

                // Manejo de errores relacionados con la base de datos

                return InternalServerError(new Exception("Error al acceder a la base de datos durante la búsqueda.", ex)); // Retorna 500 en caso de error interno

            }

            catch (DbEntityValidationException ex)

            {

                // Manejo de errores de validación

                var validationErrors = new List<string>();



                foreach (var validationResult in ex.EntityValidationErrors)

                {

                    foreach (var error in validationResult.ValidationErrors)

                    {

                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");

                    }

                }



                return Content(HttpStatusCode.BadRequest, validationErrors); // Retorna 400 Bad Request con errores de validación

            }

            catch (Exception ex)

            {

                return InternalServerError(ex); // Retorna 500 en caso de error interno

            }

        }



        [HttpPut]

        [Route("EstadoUsuario/{id}")]

        public IHttpActionResult PutEstadoUsuario(int id, [FromBody] EstadoUsuarioUpdateModel model)

        {

            // Verificar si el modelo es válido

            if (!ModelState.IsValid)

            {

                return BadRequest(ModelState); // Retorna 400 si el modelo no es válido

            }



            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    // Buscar la entidad USUARIOS por id

                    var usuario = db.Set<USUARIOS>().Find(id);



                    if (usuario == null)

                    {

                        return NotFound(); // Retorna 404 si no se encuentra el usuario con el id especificado

                    }



                    // Actualizar solo el campo EstadoUsuario

                    usuario.EstadoUsuario = model.EstadoUsuario;



                    // Deshabilitar validaciones automáticas para otras propiedades

                    db.Configuration.ValidateOnSaveEnabled = false;



                    // Intentar guardar los cambios en la base de datos

                    db.SaveChanges();

                    return Ok(); // Retorna 200 OK si la actualización fue exitosa

                }

            }

            catch (DbUpdateConcurrencyException ex)

            {

                // Manejo de errores de concurrencia

                return Content(HttpStatusCode.Conflict, new { Message = "La actualización falló debido a un conflicto de concurrencia.", Details = ex.Message }); // Retorna 409 en caso de conflicto

            }

            catch (DbEntityValidationException ex)

            {

                // Manejo de errores de validación de entidad

                var validationErrors = ex.EntityValidationErrors

                    .SelectMany(e => e.ValidationErrors)

                    .Select(e => new { e.PropertyName, e.ErrorMessage });



                return Content(HttpStatusCode.BadRequest, validationErrors); // Retorna 400 con los errores de validación

            }

            catch (DbUpdateException ex)

            {

                // Manejo de errores de actualización en la base de datos

                var errorMessage = ex.InnerException?.Message ?? ex.Message; // Captura el mensaje de error detallado



                return InternalServerError(new Exception("Error al actualizar la base de datos.", new Exception(errorMessage))); // Retorna 500 en caso de error de actualización

            }

            catch (Exception ex)

            {

                return InternalServerError(ex); // Retorna 500 en caso de error interno

            }

        }





        // Modelo para la actualización de EstadoUsuario

        public class EstadoUsuarioUpdateModel

        {

            [Required]

            public string EstadoUsuario { get; set; }

        }





        // GET: api/Usuarios/{id}

        public IHttpActionResult Get(int id)

        {

            // Obtener la cadena de conexión dinámica

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    var usuario = db.Set<USUARIOS>()

                        .Where(u => u.Usuario_ID == id)

                        .Select(u => new UsuariosDto

                        {

                            Usuario_ID = u.Usuario_ID,

                            Nombre = u.Nombre,

                            Apellido = u.Apellido,

                            Nombre_Usuario = u.Nombre_Usuario,

                            Fecha_Alta = u.Fecha_Alta,

                            Rol = u.Rol,

                            EstadoUsuario = u.EstadoUsuario

                        })

                        .FirstOrDefault();



                    if (usuario == null)

                    {

                        return NotFound();

                    }



                    return Ok(usuario);

                }

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



        /// <summary>DTO para el modal de detalles: estado, grupos asignados y permisos (menús) por grupo.</summary>

        public class DetallesUsuarioDto

        {

            public string EstadoUsuario { get; set; }

            public List<GrupoPermisosDto> Grupos { get; set; }

        }

        public class GrupoPermisosDto

        {

            public int Grupo_ID { get; set; }

            public string Grupo_Nombre { get; set; }

            public List<string> Menus { get; set; }

        }



        [HttpGet]

        [Route("{id:int}/Detalles")]

        public IHttpActionResult GetDetalles(int id)

        {

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    var usuario = db.Set<USUARIOS>().Find(id);

                    if (usuario == null)

                        return NotFound();



                    var grupoIds = db.Set<GRUPOS_USUARIOS>()

                        .Where(gu => gu.UsuarioID == id)

                        .Select(gu => gu.GrupoID)

                        .ToList();



                    var grupos = new List<GrupoPermisosDto>();

                    foreach (var grupoId in grupoIds)

                    {

                        var grupo = db.Set<GRUPOS>().Find(grupoId);

                        if (grupo == null) continue;

                        var menuIds = db.Set<GRUPOS_MENU>()

                            .Where(gm => gm.GrupoID == grupoId)

                            .Select(gm => gm.MenuID)

                            .ToList();

                        var menuNombres = db.Set<MENU>()

                            .Where(m => menuIds.Contains(m.Menu_ID))

                            .OrderBy(m => m.Menu_Nombre)

                            .Select(m => m.Menu_Nombre)

                            .ToList();

                        grupos.Add(new GrupoPermisosDto

                        {

                            Grupo_ID = grupo.Grupo_ID,

                            Grupo_Nombre = grupo.Grupo_Nombre,

                            Menus = menuNombres

                        });

                    }



                    var resultado = new DetallesUsuarioDto

                    {

                        EstadoUsuario = usuario.EstadoUsuario ?? "",

                        Grupos = grupos

                    };

                    return Ok(resultado);

                }

            }

            catch (Exception ex)

            {

                return InternalServerError(ex);

            }

        }



        // DTO para el alta de usuarios (evita problemas con deserialización y relaciones)

        public class UsuarioAltaDto

        {

            public string Nombre { get; set; }

            public string Apellido { get; set; }

            public string Nombre_Usuario { get; set; }

            public string Contraseña { get; set; }

            public string Rol { get; set; }

            public string EstadoUsuario { get; set; }

            public DateTime Fecha_Alta { get; set; }

            /// <summary>IDs de grupos asignados. Obligatorio si Rol es "user"; ignorado si Rol es "admin".</summary>

            public List<int> GrupoIds { get; set; }

            /// <summary>Nombre del usuario logueado (Usu_Modi en alta). Si no se envía, se usa "sistema".</summary>

            public string UsuarioLogueado { get; set; }

        }



        // POST: api/Usuarios

        public IHttpActionResult Post([FromBody] UsuarioAltaDto value)

        {

            if (value == null)

            {

                return BadRequest("Los datos del usuario son requeridos.");

            }



            // Validar campos requeridos

            if (string.IsNullOrWhiteSpace(value.Nombre) || string.IsNullOrWhiteSpace(value.Apellido) ||

                string.IsNullOrWhiteSpace(value.Nombre_Usuario) || string.IsNullOrWhiteSpace(value.Contraseña))

            {

                return BadRequest("Nombre, Apellido, Nombre_Usuario y Contraseña son campos requeridos.");

            }



            if (string.IsNullOrWhiteSpace(value.EstadoUsuario))

            {

                value.EstadoUsuario = "Activo";

            }



            var rol = (value.Rol ?? "").Trim();

            var esAdmin = string.Equals(rol, "admin", StringComparison.OrdinalIgnoreCase);

            if (!esAdmin && string.Equals(rol, "user", StringComparison.OrdinalIgnoreCase))

            {

                if (value.GrupoIds == null || !value.GrupoIds.Any())

                    return Content(HttpStatusCode.BadRequest, new { message = "El rol user requiere al menos un grupo asignado." });

            }



            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    // Verificar si el Nombre_Usuario ya existe

                    var usuarioExistente = db.Set<USUARIOS>().FirstOrDefault(u => u.Nombre_Usuario == value.Nombre_Usuario.Trim());

                    if (usuarioExistente != null)

                    {

                        return Content(HttpStatusCode.BadRequest, new

                        {

                            code = "usuario_duplicado",

                            message = "Ya existe un usuario con ese Nombre_Usuario."

                        });

                    }



                    var ahora = DateTime.Now;

                    var fechaSinMs = new DateTime(ahora.Year, ahora.Month, ahora.Day, ahora.Hour, ahora.Minute, ahora.Second);

                    var usuLogueado = (value.UsuarioLogueado ?? "").Trim();

                    if (string.IsNullOrEmpty(usuLogueado)) usuLogueado = "sistema";



                    // Fecha_Alta y Fecha_Modi con hora del servidor para evitar desfases por zona horaria del cliente

                    // (el cliente enviaba toISOString() en UTC y quedaba posterior a Fecha_Modi)

                    // Crear nueva entidad manualmente (evita problemas con Usuario_ID e Identity)

                    var usuario = new USUARIOS

                    {

                        Nombre = value.Nombre.Trim(),

                        Apellido = value.Apellido.Trim(),

                        Nombre_Usuario = value.Nombre_Usuario.Trim(),

                        Contraseña = value.Contraseña,

                        Rol = string.IsNullOrWhiteSpace(value.Rol) ? null : value.Rol.Trim(),

                        EstadoUsuario = value.EstadoUsuario.Trim(),

                        Fecha_Alta = fechaSinMs,

                        Usu_Alta = usuLogueado,

                        Fecha_Modi = fechaSinMs,

                        Usu_Modi = usuLogueado

                    };



                    db.Set<USUARIOS>().Add(usuario);

                    db.SaveChanges();



                    if (!esAdmin && value.GrupoIds != null && value.GrupoIds.Any())

                    {

                        foreach (var gid in value.GrupoIds.Distinct())

                        {

                            if (db.Set<GRUPOS>().Any(g => g.Grupo_ID == gid))

                                db.Set<GRUPOS_USUARIOS>().Add(new GRUPOS_USUARIOS { GrupoID = gid, UsuarioID = usuario.Usuario_ID });

                        }

                        db.SaveChanges();

                    }



                    return CreatedAtRoute("DefaultApi", new { id = usuario.Usuario_ID }, new UsuariosDto

                    {

                        Usuario_ID = usuario.Usuario_ID,

                        Nombre = usuario.Nombre,

                        Apellido = usuario.Apellido,

                        Nombre_Usuario = usuario.Nombre_Usuario,

                        Rol = usuario.Rol,

                        EstadoUsuario = usuario.EstadoUsuario,

                        Fecha_Alta = usuario.Fecha_Alta

                    });

                }

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

            catch (DbUpdateException ex)

            {

                // Extraer mensaje real de SQL/DB para depuración

                var inner = ex.InnerException;

                while (inner?.InnerException != null) inner = inner.InnerException;

                var innerMsg = inner?.Message ?? ex.InnerException?.Message ?? ex.Message;

                // Devolver error como JSON para que el frontend muestre el mensaje real

                return Content(HttpStatusCode.InternalServerError, new

                {

                    message = "Error al guardar el usuario en la base de datos",

                    detail = innerMsg,

                    type = ex.GetType().Name

                });

            }

            catch (Exception ex)

            {

                var inner = ex.InnerException;

                while (inner?.InnerException != null) inner = inner.InnerException;

                var innerMsg = inner?.Message ?? ex.InnerException?.Message ?? ex.Message;

                return Content(HttpStatusCode.InternalServerError, new

                {

                    message = "Error inesperado",

                    detail = innerMsg,

                    type = ex.GetType().Name

                });

            }

        }



        // DTO para la edición de usuarios

        public class UsuarioEdicionDto

        {

            public string Nombre_Usuario { get; set; }

            public string Nombre { get; set; }

            public string Apellido { get; set; }

            public string Contraseña { get; set; }

            public string Rol { get; set; }

            public string EstadoUsuario { get; set; }

            public string Usu_Modi { get; set; }

            /// <summary>IDs de grupos asignados. Obligatorio si Rol es "user"; ignorado si Rol es "admin".</summary>

            public List<int> GrupoIds { get; set; }

        }



        // PUT: api/Usuarios/{id}

        public IHttpActionResult Put(int id, [FromBody] UsuarioEdicionDto value)

        {

            if (value == null)

            {

                return BadRequest("Los datos del usuario son requeridos.");

            }



            // Validar campos requeridos

            if (string.IsNullOrWhiteSpace(value.Nombre) || string.IsNullOrWhiteSpace(value.Apellido) ||

                string.IsNullOrWhiteSpace(value.Nombre_Usuario))

            {

                return BadRequest("Nombre, Apellido y Nombre_Usuario son campos requeridos.");

            }



            if (string.IsNullOrWhiteSpace(value.EstadoUsuario))

            {

                value.EstadoUsuario = "Activo";

            }



            var rolPut = (value.Rol ?? "").Trim();

            var esAdminPut = string.Equals(rolPut, "admin", StringComparison.OrdinalIgnoreCase);

            if (!esAdminPut && string.Equals(rolPut, "user", StringComparison.OrdinalIgnoreCase))

            {

                if (value.GrupoIds == null || !value.GrupoIds.Any())

                    return Content(HttpStatusCode.BadRequest, new { message = "El rol user requiere al menos un grupo asignado." });

            }



            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    var usuario = db.Set<USUARIOS>().Find(id);



                    if (usuario == null)

                    {

                        return NotFound();

                    }



                    // Actualizar solo los campos editables (Nombre_Usuario NO se modifica)

                    usuario.Nombre = value.Nombre.Trim();

                    usuario.Apellido = value.Apellido.Trim();

                    // Contraseña vacía = se conserva la actual (la API ya no la devuelve al front)

                    if (!string.IsNullOrWhiteSpace(value.Contraseña)) usuario.Contraseña = value.Contraseña;

                    usuario.Rol = string.IsNullOrWhiteSpace(value.Rol) ? null : value.Rol.Trim();

                    usuario.EstadoUsuario = value.EstadoUsuario.Trim();



                    // Truncar milisegundos para compatibilidad con datetime de SQL Server

                    var ahora = DateTime.Now;

                    usuario.Fecha_Modi = new DateTime(ahora.Year, ahora.Month, ahora.Day, ahora.Hour, ahora.Minute, ahora.Second);

                    usuario.Usu_Modi = string.IsNullOrWhiteSpace(value.Usu_Modi) ? "sistema" : value.Usu_Modi.Trim();



                    db.Entry(usuario).State = System.Data.Entity.EntityState.Modified;

                    db.SaveChanges();



                    var actuales = db.Set<GRUPOS_USUARIOS>().Where(gu => gu.UsuarioID == id).ToList();

                    if (actuales.Any())

                    {

                        db.Set<GRUPOS_USUARIOS>().RemoveRange(actuales);

                        db.SaveChanges();

                    }

                    if (!esAdminPut && value.GrupoIds != null && value.GrupoIds.Any())

                    {

                        foreach (var gid in value.GrupoIds.Distinct())

                        {

                            if (db.Set<GRUPOS>().Any(g => g.Grupo_ID == gid))

                                db.Set<GRUPOS_USUARIOS>().Add(new GRUPOS_USUARIOS { GrupoID = gid, UsuarioID = id });

                        }

                        db.SaveChanges();

                    }



                    return Ok(new UsuariosDto

                    {

                        Usuario_ID = usuario.Usuario_ID,

                        Nombre = usuario.Nombre,

                        Apellido = usuario.Apellido,

                        Nombre_Usuario = usuario.Nombre_Usuario,

                        Rol = usuario.Rol,

                        EstadoUsuario = usuario.EstadoUsuario,

                        Fecha_Alta = usuario.Fecha_Alta

                    });

                }

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

            catch (DbUpdateException ex)

            {

                var inner = ex.InnerException;

                while (inner?.InnerException != null) inner = inner.InnerException;

                var innerMsg = inner?.Message ?? ex.InnerException?.Message ?? ex.Message;

                return Content(HttpStatusCode.InternalServerError, new

                {

                    message = "Error al actualizar el usuario en la base de datos",

                    detail = innerMsg,

                    type = ex.GetType().Name

                });

            }

            catch (Exception ex)

            {

                var inner = ex.InnerException;

                while (inner?.InnerException != null) inner = inner.InnerException;

                var innerMsg = inner?.Message ?? ex.InnerException?.Message ?? ex.Message;

                return Content(HttpStatusCode.InternalServerError, new

                {

                    message = "Error inesperado",

                    detail = innerMsg,

                    type = ex.GetType().Name

                });

            }

        }



        // DTO para cambio de contraseña

        public class CambiarContrasenaDto

        {

            public string Nombre_Usuario { get; set; }

            public string ContrasenaActual { get; set; }

            public string ContrasenaNueva { get; set; }

        }



        [HttpPost]

        [Route("CambiarContrasena")]

        public IHttpActionResult CambiarContrasena([FromBody] CambiarContrasenaDto value)

        {

            if (value == null)

            {

                return BadRequest("Los datos son requeridos.");

            }



            // Validar campos requeridos

            if (string.IsNullOrWhiteSpace(value.Nombre_Usuario) ||

                string.IsNullOrWhiteSpace(value.ContrasenaActual) ||

                string.IsNullOrWhiteSpace(value.ContrasenaNueva))

            {

                return Content(HttpStatusCode.BadRequest, new { message = "Todos los campos son requeridos." });

            }



            // Validar longitud mínima de 8 caracteres

            if (value.ContrasenaNueva.Length < 8)

            {

                return Content(HttpStatusCode.BadRequest, new { message = "La nueva contraseña debe tener al menos 8 caracteres." });

            }



            // Validar longitud máxima de 20 caracteres

            if (value.ContrasenaNueva.Length > 20)

            {

                return Content(HttpStatusCode.BadRequest, new { message = "La nueva contraseña no puede tener más de 20 caracteres." });

            }



            // Validar que sea alfanumérica (debe contener al menos una letra y un número)

            bool tieneLetras = System.Text.RegularExpressions.Regex.IsMatch(value.ContrasenaNueva, @"[a-zA-Z]");

            bool tieneNumeros = System.Text.RegularExpressions.Regex.IsMatch(value.ContrasenaNueva, @"[0-9]");



            if (!tieneLetras || !tieneNumeros)

            {

                return Content(HttpStatusCode.BadRequest, new { message = "La nueva contraseña debe ser alfanumérica (contener letras y números)." });

            }



            if (value.ContrasenaActual == value.ContrasenaNueva)

            {

                return Content(HttpStatusCode.BadRequest, new { message = "La nueva contraseña debe ser diferente de la actual." });

            }



            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    // Primero verificar que el usuario existe y la contraseña actual es correcta

                    var usuario = db.Set<USUARIOS>()

                        .Where(u => u.Nombre_Usuario == value.Nombre_Usuario && u.Contraseña == value.ContrasenaActual)

                        .Select(u => new { u.Usuario_ID, u.Nombre_Usuario })

                        .FirstOrDefault();



                    if (usuario == null)

                    {

                        // Verificar si el usuario existe pero la contraseña es incorrecta

                        var existeUsuario = db.Set<USUARIOS>().Any(u => u.Nombre_Usuario == value.Nombre_Usuario);

                        if (existeUsuario)

                        {

                            return Content(HttpStatusCode.BadRequest, new { message = "La contraseña actual es incorrecta." });

                        }

                        return Content(HttpStatusCode.NotFound, new { message = "Usuario no encontrado." });

                    }



                    // Preparar fecha de modificación

                    var ahora = DateTime.Now;

                    var fechaModi = new DateTime(ahora.Year, ahora.Month, ahora.Day, ahora.Hour, ahora.Minute, ahora.Second);



                    // Ejecutar actualización directa con SQL

                    var filasActualizadas = db.Database.ExecuteSqlCommand(

                        @"UPDATE USUARIOS 

                          SET Contraseña = @p0, Fecha_Modi = @p1, Usu_Modi = @p2 

                          WHERE Nombre_Usuario = @p3",

                        value.ContrasenaNueva,

                        fechaModi,

                        value.Nombre_Usuario,

                        value.Nombre_Usuario

                    );



                    if (filasActualizadas > 0)

                    {

                        return Ok(new { message = "Contraseña cambiada exitosamente." });

                    }

                    else

                    {

                        return Content(HttpStatusCode.InternalServerError, new { message = "No se pudo actualizar la contraseña." });

                    }

                }

            }

            catch (System.Data.SqlClient.SqlException ex)

            {

                return Content(HttpStatusCode.InternalServerError, new

                {

                    message = "Error en la base de datos",

                    detail = ex.Message

                });

            }

            catch (Exception ex)

            {

                var inner = ex.InnerException;

                while (inner?.InnerException != null) inner = inner.InnerException;

                var innerMsg = inner?.Message ?? ex.InnerException?.Message ?? ex.Message;

                return Content(HttpStatusCode.InternalServerError, new

                {

                    message = "Error inesperado",

                    detail = innerMsg

                });

            }

        }



        // DELETE: api/Usuarios/{id}

        public IHttpActionResult Delete(int id)

        {

            // Obtener la cadena de conexión dinámica

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada

                {

                    // Buscar el Usuario por ID

                    USUARIOS oitem = db.Set<USUARIOS>().Find(id);



                    if (oitem == null)

                    {

                        return NotFound(); // Retorna 404 si no se encuentra el usuario con el ID especificado

                    }



                    // Eliminar el usuario encontrado

                    db.Set<USUARIOS>().Remove(oitem);

                    db.SaveChanges();



                    return Ok(); // Retorna 200 OK si la eliminación fue exitosa

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

                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");

                    }

                }



                return Content(HttpStatusCode.BadRequest, validationErrors); // Retorna 400 Bad Request con errores de validación

            }

            catch (Exception ex)

            {

                return InternalServerError(ex); // Retorna 500 en caso de error interno

            }

        }



    }

}

