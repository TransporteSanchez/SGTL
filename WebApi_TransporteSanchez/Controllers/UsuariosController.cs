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

using System.Security.Claims;

using System.IdentityModel.Tokens.Jwt;

using System.Text;

using Microsoft.IdentityModel.Tokens;

using WebApi_TransporteSanchez.Security;



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

            public string Email { get; set; }

            public DateTime Fecha_Alta { get; set; }

            public string Rol { get; set; }

            public string EstadoUsuario { get; set; }

            // El chofer del usuario con rol Chofer, para Ver detalle ("Quiroga, Darío (DNI 31478259)"); solo lo completa Get(id).
            public string Chofer { get; set; }

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



        // Los roles (Rocío, 27/10): admin (ve todo), user (las pantallas de sus grupos) y chofer (solo Hojas de ruta, con los
        // viajes de su chofer). En pantalla se ven en castellano: Administrador, Usuario y Chofer (permisos-menu.js).
        public static readonly string[] Roles = { "admin", "user", "chofer" };

        [HttpGet]
        [Route("Roles")]
        public IHttpActionResult GetRoles()
        {
            return Ok(Roles);
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
                    // El chofer ve solo Hojas de ruta, sin grupos (el permiso sigue llamándose "Hoja de ruta" en la base).
                    if (string.Equals((user.Rol ?? "").Trim(), "chofer", StringComparison.OrdinalIgnoreCase))
                        return Ok(new { Rol = user.Rol, Menus = new[] { "Hoja de ruta" } });

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

        [AccesoUsuarios(true)]
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
                    db.Database.ExecuteSqlCommand("UPDATE dbo.USUARIOS SET VersionSesion=VersionSesion+1 WHERE Usuario_ID=@p0", id);

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

        [AccesoUsuarios(false)]
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



                    usuario.Email = db.Database.SqlQuery<string>("SELECT Email FROM dbo.USUARIOS WHERE Usuario_ID=@p0", id).FirstOrDefault();

                    // Ver detalle dice qué chofer tiene (reporte de la VM del 28/10, F6). USUARIOS.ChoferID está fuera del EDMX.
                    usuario.Chofer = db.Database.SqlQuery<string>(
                        "SELECT LTRIM(RTRIM(ISNULL(c.Apellido, ''))) + ', ' + LTRIM(RTRIM(ISNULL(c.Nombre, ''))) + " +
                        "' (DNI ' + LTRIM(RTRIM(ISNULL(c.DNI, ''))) + ')' " +
                        "FROM dbo.USUARIOS u JOIN dbo.CHOFERES c ON c.Chofer_ID = u.ChoferID WHERE u.Usuario_ID = @p0", id).FirstOrDefault();
                    return Ok(usuario);

                }

            }

            catch
            {
                return Content(HttpStatusCode.InternalServerError, new { message = "No se pudo cargar el usuario. Probá de nuevo." });
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

            public string Email { get; set; }

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

        [AccesoUsuarios(true)]
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

                return BadRequest("Completá el nombre, el apellido, el nombre de usuario y la contraseña.");

            }

            string mensajeContrasena;
            if (!ContrasenasSeguras.CumplePolitica(value.Contraseña, out mensajeContrasena))
            {
                return Content(HttpStatusCode.BadRequest, new { message = mensajeContrasena });
            }



            if (string.IsNullOrWhiteSpace(value.EstadoUsuario))

            {

                value.EstadoUsuario = "Activo";

            }



            var rol = (value.Rol ?? "").Trim().ToLowerInvariant();
            if (Array.IndexOf(Roles, rol) < 0) return Content(HttpStatusCode.BadRequest, new { message = "Seleccioná un rol." });
            value.Rol = rol;

            // Solo el usuario elige grupos: el administrador ve todo y el chofer, solo Hojas de ruta.
            var esAdmin = rol != "user";

            if (rol == "user")

            {

                if (value.GrupoIds == null || !value.GrupoIds.Any())

                    return Content(HttpStatusCode.BadRequest, new { message = "Asigná al menos un grupo." });

            }



            try { value.Email = RecuperoContrasena.NormalizarEmail(value.Email); }
            catch (ArgumentException) { return Content(HttpStatusCode.BadRequest, new { code = "email_invalido", message = "Completá un e-mail válido para el usuario." }); }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))
                using (var transaccion = db.Database.BeginTransaction(System.Data.IsolationLevel.Serializable))
                {
                    if (db.Database.SqlQuery<int>("SELECT COUNT(*) FROM dbo.USUARIOS WITH (UPDLOCK,HOLDLOCK) WHERE Email=@p0 AND Usuario_ID<>@p1", value.Email, 0).Single() > 0)
                        return Content(HttpStatusCode.Conflict, new { code = "email_duplicado", message = "Ese e-mail ya está registrado en otro usuario." });

                    // Verificar si el Nombre_Usuario ya existe

                    var usuarioExistente = db.Set<USUARIOS>().FirstOrDefault(u => u.Nombre_Usuario == value.Nombre_Usuario.Trim());

                    if (usuarioExistente != null)

                    {

                        return Content(HttpStatusCode.BadRequest, new

                        {

                            code = "usuario_duplicado",

                            message = "Ya existe un usuario con ese nombre de usuario."

                        });

                    }



                    var ahora = DateTime.Now;

                    var fechaSinMs = new DateTime(ahora.Year, ahora.Month, ahora.Day, ahora.Hour, ahora.Minute, ahora.Second);

                    var usuLogueado = ObtenerNombreUsuarioToken();

                    if (string.IsNullOrEmpty(usuLogueado)) usuLogueado = "sistema";



                    // Fecha_Alta y Fecha_Modi con hora del servidor para evitar desfases por zona horaria del cliente

                    // (el cliente enviaba toISOString() en UTC y quedaba posterior a Fecha_Modi)

                    // Crear nueva entidad manualmente (evita problemas con Usuario_ID e Identity)

                    var usuario = new USUARIOS

                    {

                        Nombre = value.Nombre.Trim(),

                        Apellido = value.Apellido.Trim(),

                        Nombre_Usuario = value.Nombre_Usuario.Trim(),

                        Contraseña = ContrasenasSeguras.CrearHash(value.Contraseña),

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



                    GuardarEmail(db, usuario.Usuario_ID, value.Email);
                    transaccion.Commit();
                    return CreatedAtRoute("DefaultApi", new { id = usuario.Usuario_ID }, new UsuariosDto

                    {

                        Usuario_ID = usuario.Usuario_ID,

                        Nombre = usuario.Nombre,

                        Apellido = usuario.Apellido,

                        Nombre_Usuario = usuario.Nombre_Usuario,

                        Rol = usuario.Rol,

                        EstadoUsuario = usuario.EstadoUsuario,

                        Fecha_Alta = usuario.Fecha_Alta,
                        Email = value.Email

                    });

                }

            }

            catch
            {
                return Content(HttpStatusCode.InternalServerError, new { message = "No se pudo guardar el usuario. Revisá los datos y probá de nuevo." });
            }
        }


        // DTO para la edición de usuarios

        public class UsuarioEdicionDto

        {

            public string Nombre_Usuario { get; set; }

            public string Email { get; set; }

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

        [AccesoUsuarios(true)]
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

                return BadRequest("Completá el nombre, el apellido y el nombre de usuario.");

            }



            if (string.IsNullOrWhiteSpace(value.EstadoUsuario))

            {

                value.EstadoUsuario = "Activo";

            }



            var rolPut = (value.Rol ?? "").Trim().ToLowerInvariant();
            if (Array.IndexOf(Roles, rolPut) < 0) return Content(HttpStatusCode.BadRequest, new { message = "Seleccioná un rol." });
            value.Rol = rolPut;

            // Solo el usuario elige grupos: al administrador y al chofer se les quitan (se borran abajo y no se vuelven a cargar).
            var esAdminPut = rolPut != "user";

            if (rolPut == "user")

            {

                if (value.GrupoIds == null || !value.GrupoIds.Any())

                    return Content(HttpStatusCode.BadRequest, new { message = "Asigná al menos un grupo." });

            }



            try { value.Email = RecuperoContrasena.NormalizarEmail(value.Email); }
            catch (ArgumentException) { return Content(HttpStatusCode.BadRequest, new { code = "email_invalido", message = "Completá un e-mail válido para el usuario." }); }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))
                using (var transaccion = db.Database.BeginTransaction(System.Data.IsolationLevel.Serializable))
                {
                    if (db.Database.SqlQuery<int>("SELECT COUNT(*) FROM dbo.USUARIOS WITH (UPDLOCK,HOLDLOCK) WHERE Email=@p0 AND Usuario_ID<>@p1", value.Email, id).Single() > 0)
                        return Content(HttpStatusCode.Conflict, new { code = "email_duplicado", message = "Ese e-mail ya está registrado en otro usuario." });

                    db.Database.SqlQuery<int>("SELECT Usuario_ID FROM dbo.USUARIOS WITH (UPDLOCK,HOLDLOCK) WHERE Usuario_ID=@p0", id).ToList();
                    var usuario = db.Set<USUARIOS>().Find(id);



                    if (usuario == null)

                    {

                        return NotFound();

                    }



                    // Actualizar solo los campos editables (Nombre_Usuario NO se modifica)

                    var invalidarSesiones = !string.IsNullOrWhiteSpace(value.Contraseña) || !string.Equals(usuario.EstadoUsuario, value.EstadoUsuario.Trim(), StringComparison.OrdinalIgnoreCase) || !string.Equals(usuario.Rol, value.Rol, StringComparison.OrdinalIgnoreCase);
                    usuario.Nombre = value.Nombre.Trim();

                    usuario.Apellido = value.Apellido.Trim();

                    // Contraseña vacía = se conserva la actual (la API ya no la devuelve al front)

                    if (!string.IsNullOrWhiteSpace(value.Contraseña))
                    {
                        string mensajeContrasena;
                        if (!ContrasenasSeguras.CumplePolitica(value.Contraseña, out mensajeContrasena))
                            return Content(HttpStatusCode.BadRequest, new { message = mensajeContrasena });

                        usuario.Contraseña = ContrasenasSeguras.CrearHash(value.Contraseña);
                    }

                    usuario.Rol = string.IsNullOrWhiteSpace(value.Rol) ? null : value.Rol.Trim();

                    usuario.EstadoUsuario = value.EstadoUsuario.Trim();



                    // Truncar milisegundos para compatibilidad con datetime de SQL Server

                    var ahora = DateTime.Now;

                    usuario.Fecha_Modi = new DateTime(ahora.Year, ahora.Month, ahora.Day, ahora.Hour, ahora.Minute, ahora.Second);

                    usuario.Usu_Modi = ObtenerNombreUsuarioToken();



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



                    GuardarEmail(db, usuario.Usuario_ID, value.Email, invalidarSesiones);
                    transaccion.Commit();
                    return Ok(new UsuariosDto

                    {

                        Usuario_ID = usuario.Usuario_ID,

                        Nombre = usuario.Nombre,

                        Apellido = usuario.Apellido,

                        Nombre_Usuario = usuario.Nombre_Usuario,

                        Rol = usuario.Rol,

                        EstadoUsuario = usuario.EstadoUsuario,

                        Fecha_Alta = usuario.Fecha_Alta,
                        Email = value.Email

                    });

                }

            }

            catch
            {
                return Content(HttpStatusCode.InternalServerError, new { message = "No se pudo guardar el usuario. Revisá los datos y probá de nuevo." });
            }
        }


        private static void GuardarEmail(SGTLAuditContext db, int id, string email, bool invalidar = false)
        {
            var anterior = db.Database.SqlQuery<string>("SELECT Email FROM dbo.USUARIOS WHERE Usuario_ID=@p0", id).FirstOrDefault();
            if (!string.Equals(anterior, email, StringComparison.OrdinalIgnoreCase))
                db.Database.ExecuteSqlCommand(@"INSERT INTO dbo.AUDITORIA
(Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos)
SELECT GETDATE(),Usu_Modi,'UPDATE','USUARIOS',@p0,@p1,@p2 FROM dbo.USUARIOS WHERE Usuario_ID=@p3",
                    "Usuario_ID=" + id,
                    Newtonsoft.Json.JsonConvert.SerializeObject(new { Email = anterior }),
                    Newtonsoft.Json.JsonConvert.SerializeObject(new { Email = email }), id);
            db.Database.ExecuteSqlCommand(@"UPDATE dbo.USUARIOS SET
VersionSesion=VersionSesion+CASE WHEN ISNULL(Email,'')<>@p0 OR @p2=1 THEN 1 ELSE 0 END, Email=@p0 WHERE Usuario_ID=@p1", email, id, invalidar);
        }

        // DTO para cambio de contraseña

        public class CambiarContrasenaDto

        {

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



            if (string.IsNullOrEmpty(value.ContrasenaActual) || string.IsNullOrEmpty(value.ContrasenaNueva))

            {

                return Content(HttpStatusCode.BadRequest, new { message = "Completá la contraseña actual y la nueva." });

            }

            string mensajeContrasena;
            if (!ContrasenasSeguras.CumplePolitica(value.ContrasenaNueva, out mensajeContrasena))
                return Content(HttpStatusCode.BadRequest, new { message = mensajeContrasena });

            if (string.Equals(value.ContrasenaActual, value.ContrasenaNueva, StringComparison.Ordinal))
                return Content(HttpStatusCode.BadRequest, new { message = "La contraseña nueva tiene que ser distinta de la actual." });

            var nombreUsuario = ObtenerNombreUsuarioToken();
            if (string.IsNullOrWhiteSpace(nombreUsuario))
                return Unauthorized();


            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    var usuario = db.Set<USUARIOS>().FirstOrDefault(u => u.Nombre_Usuario == nombreUsuario);
                    if (usuario == null || !string.Equals(usuario.EstadoUsuario, "Activo", StringComparison.OrdinalIgnoreCase))
                        return Unauthorized();

                    if (!ContrasenasSeguras.Verificar(value.ContrasenaActual, usuario.Contraseña))
                        return Content(HttpStatusCode.BadRequest, new { message = "No se pudo cambiar la contraseña. Verificá los datos ingresados." });

                    var ahora = DateTime.Now;
                    var fechaModi = new DateTime(ahora.Year, ahora.Month, ahora.Day, ahora.Hour, ahora.Minute, ahora.Second);
                    var nuevoHash = ContrasenasSeguras.CrearHash(value.ContrasenaNueva);
                    var filasActualizadas = db.Database.ExecuteSqlCommand(
                        @"UPDATE dbo.USUARIOS
                          SET Contraseña = @p0, Fecha_Modi = @p1, Usu_Modi = @p2
                          WHERE Usuario_ID = @p3 AND Contraseña = @p4",
                        nuevoHash,
                        fechaModi,
                        nombreUsuario,
                        usuario.Usuario_ID,
                        usuario.Contraseña);

                    if (filasActualizadas != 1)
                        return Content(HttpStatusCode.Conflict, new { message = "No se pudo cambiar la contraseña. Volvé a intentarlo." });

                    RegistrarCambioContrasena(db, usuario.Usuario_ID, nombreUsuario);
                    return Ok(new { message = "Contraseña cambiada correctamente." });

                }

            }

            catch

            {

                return Content(HttpStatusCode.InternalServerError, new { message = "No se pudo cambiar la contraseña." });

            }

        }



        private string ObtenerNombreUsuarioToken()
        {
            var authorization = Request != null ? Request.Headers.Authorization : null;
            if (authorization == null || !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(authorization.Parameter))
                return null;

            try
            {
                SecurityToken tokenValidado;
                var principal = new JwtSecurityTokenHandler().ValidateToken(authorization.Parameter, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                    ValidateIssuer = true,
                    ValidIssuer = JwtConfig.Issuer,
                    ValidateAudience = true,
                    ValidAudience = JwtConfig.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                }, out tokenValidado);

                var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
                return claim == null || string.IsNullOrWhiteSpace(claim.Value) ? null : claim.Value;
            }
            catch
            {
                return null;
            }
        }

        private static void RegistrarCambioContrasena(SGTLAuditContext db, int usuarioId, string nombreUsuario)
        {
            try
            {
                db.Database.ExecuteSqlCommand(
                    "INSERT INTO AUDITORIA (Fecha, Usuario, Accion, Entidad, Clave, Valores_Anteriores, Valores_Nuevos, Origen) " +
                    "VALUES (GETDATE(), @usuario, 'CAMBIO_CONTRASENA', 'USUARIOS', @clave, NULL, NULL, NULL)",
                    new System.Data.SqlClient.SqlParameter("@usuario", nombreUsuario),
                    new System.Data.SqlClient.SqlParameter("@clave", "Usuario_ID=" + usuarioId));
            }
            catch
            {
                // La auditoría no debe dejar al usuario sin poder cambiar su contraseña.
            }
        }



        // DELETE: api/Usuarios/{id}

        [AccesoUsuarios(true)]
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



                    // Primero sus asignaciones a grupos (FK_GRUPOS_USUARIOS_USUARIOS); se guardan juntas

                    db.Set<GRUPOS_USUARIOS>().RemoveRange(db.Set<GRUPOS_USUARIOS>().Where(gu => gu.UsuarioID == id).ToList());

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

