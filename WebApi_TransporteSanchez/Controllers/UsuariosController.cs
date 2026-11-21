using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web.Http;
using WebApi_TransporteSanchez.Security;

namespace WebApi_TransporteSanchez.Controllers
{
    [AccesoAdministracion("usuarios"), RoutePrefix("api/Usuarios")]
    public sealed class UsuariosController : ControladorAdministracion
    {
        public sealed class UsuarioVista
        {
            public int Usuario_ID { get; set; }
            public string Nombre { get; set; }
            public string Apellido { get; set; }
            public string Nombre_Usuario { get; set; }
            public string Email { get; set; }
            public DateTime Fecha_Alta { get; set; }
            public string Rol { get; set; }
            public string EstadoUsuario { get; set; }
            public long? VersionSesion { get; set; }
        }

        public sealed class UsuarioEntrada
        {
            public string Nombre { get; set; }
            public string Apellido { get; set; }
            public string Nombre_Usuario { get; set; }
            public string Email { get; set; }
            public string Contraseña { get; set; }
            public string Rol { get; set; }
            public string EstadoUsuario { get; set; }
            public List<int> GrupoIds { get; set; }
            public List<int> GrupoIdsOriginales { get; set; }
            public long? VersionSesionOriginal { get; set; }
        }

        public sealed class EstadoEntrada { public string EstadoUsuario { get; set; } }
        public sealed class ClaveEntrada
        {
            public string Nombre_Usuario { get; set; }
            public string ContrasenaActual { get; set; }
            public string ContrasenaNueva { get; set; }
        }

        private static readonly string[] RolesPermitidos = { "admin", "user", "chofer" };
        private static readonly string[] EstadosPermitidos = { "Activo", "Inactivo" };

        private static IQueryable<UsuarioVista> Consulta(SGTLAuditContext db)
        {
            return db.Set<USUARIOS>().AsNoTracking().Select(u => new UsuarioVista
            {
                Usuario_ID = u.Usuario_ID,
                Nombre = u.Nombre,
                Apellido = u.Apellido,
                Nombre_Usuario = u.Nombre_Usuario,
                Fecha_Alta = u.Fecha_Alta,
                Rol = u.Rol,
                EstadoUsuario = u.EstadoUsuario
            });
        }

        [HttpGet, Route("")]
        public IHttpActionResult Get()
        {
            return Ejecutar(db => Ok(Consulta(db).OrderBy(u => u.Nombre_Usuario).ThenBy(u => u.Usuario_ID).ToList()));
        }

        [HttpGet, Route("Roles")]
        public IHttpActionResult Roles() { return Ok(RolesPermitidos); }

        [HttpGet, Route("Grupos")]
        public IHttpActionResult Grupos()
        {
            return Ejecutar(db => Ok(db.Set<GRUPOS>().AsNoTracking().OrderBy(g => g.Grupo_Nombre)
                .Select(g => new { g.Grupo_ID, g.Grupo_Nombre }).ToList()));
        }

        [HttpGet, Route("Acceso")]
        public IHttpActionResult Acceso()
        {
            return Ejecutar(db =>
            {
                var menus = PermisosAdministracion.Menus(db, Operador);
                return Ok(new
                {
                    Operador.Usuario_ID,
                    Operador.Rol,
                    PuedeGestionarUsuarios = PermisosAdministracion.Tiene(Operador, menus, "Gestión de usuarios"),
                    PuedeListarUsuarios = PermisosAdministracion.Tiene(Operador, menus, "Gestión de usuarios", "Listado de usuarios"),
                    PuedeGestionarGrupos = PermisosAdministracion.Tiene(Operador, menus, "Grupos y permisos")
                });
            });
        }

        [HttpGet, Route("MenusPermitidos")]
        public IHttpActionResult MenusPermitidos(string username = null)
        {
            if (username != null && !PermisosAdministracion.Iguales(username, Operador.Nombre_Usuario))
                return Error(HttpStatusCode.Forbidden, "Solo podés consultar tus propios permisos.");
            return Ejecutar(db => Ok(new { Operador.Rol, Menus = PermisosAdministracion.Menus(db, Operador) }));
        }

        [HttpGet, Route("Buscar")]
        public IHttpActionResult Buscar(string nombre = null, string apellido = null, string nombreusuario = null,
            string EstadoUsuario = null, string rol = null, DateTime? desde = null, DateTime? hasta = null,
            int page = 1, int pageSize = 15)
        {
            if (page < 1 || pageSize < 0 || pageSize > 100 || (desde.HasValue && hasta.HasValue && desde.Value.Date > hasta.Value.Date)
                || (hasta.HasValue && hasta.Value.Date == DateTime.MaxValue.Date))
                return Error(HttpStatusCode.BadRequest, "Revisá los filtros y la paginación.");
            return Ejecutar(db =>
            {
                var q = Consulta(db);
                if (!string.IsNullOrWhiteSpace(nombre)) { nombre = nombre.Trim(); q = q.Where(u => u.Nombre.Contains(nombre)); }
                if (!string.IsNullOrWhiteSpace(apellido)) { apellido = apellido.Trim(); q = q.Where(u => u.Apellido.Contains(apellido)); }
                if (!string.IsNullOrWhiteSpace(nombreusuario)) { nombreusuario = nombreusuario.Trim(); q = q.Where(u => u.Nombre_Usuario.Contains(nombreusuario)); }
                if (!string.IsNullOrWhiteSpace(EstadoUsuario))
                {
                    var estados = EstadoUsuario.Split(',').Select(e => e.Trim()).ToArray();
                    if (estados.Any(e => !EstadosPermitidos.Contains(e))) return Error(HttpStatusCode.BadRequest, "Seleccioná un estado válido.");
                    q = q.Where(u => estados.Contains(u.EstadoUsuario));
                }
                if (!string.IsNullOrWhiteSpace(rol))
                {
                    rol = rol.Trim().ToLowerInvariant();
                    if (!RolesPermitidos.Contains(rol)) return Error(HttpStatusCode.BadRequest, "Seleccioná un rol válido.");
                    q = q.Where(u => u.Rol.Trim().ToLower() == rol);
                }
                if (desde.HasValue) { var inicio = desde.Value.Date; q = q.Where(u => u.Fecha_Alta >= inicio); }
                if (hasta.HasValue) { var fin = hasta.Value.Date.AddDays(1); q = q.Where(u => u.Fecha_Alta < fin); }
                var total = q.Count();
                var pagina = pageSize == 0 ? 1 : Math.Min(page, Math.Max(1, (int)Math.Ceiling((double)total / pageSize)));
                var ordenada = q.OrderBy(u => u.Nombre_Usuario).ThenBy(u => u.Usuario_ID);
                var filas = pageSize == 0 ? ordenada.ToList() : ordenada.Skip((pagina - 1) * pageSize).Take(pageSize).ToList();
                return Ok(new { TotalRecords = total, Results = filas, Pagina = pagina });
            });
        }

        [HttpGet, Route("{id:int}")]
        public IHttpActionResult Get(int id)
        {
            return Ejecutar(db =>
            {
                var usuario = db.Database.SqlQuery<UsuarioVista>(@"SELECT Usuario_ID, Nombre, Apellido, Nombre_Usuario,
                    Email, Fecha_Alta, Rol, EstadoUsuario, VersionSesion FROM dbo.USUARIOS WHERE Usuario_ID=@p0", id).SingleOrDefault();
                return usuario == null ? (IHttpActionResult)NotFound() : Ok(usuario);
            });
        }

        [HttpGet, Route("{id:int}/Detalles")]
        public IHttpActionResult Detalles(int id)
        {
            return Ejecutar(db =>
            {
                var usuario = db.Set<USUARIOS>().Where(u => u.Usuario_ID == id).Select(u => new { u.EstadoUsuario, u.Rol }).SingleOrDefault();
                if (usuario == null) return NotFound();
                var grupos = (from gu in db.Set<GRUPOS_USUARIOS>()
                              join g in db.Set<GRUPOS>() on gu.GrupoID equals g.Grupo_ID
                              where gu.UsuarioID == id
                              select new { g.Grupo_ID, g.Grupo_Nombre }).Distinct().ToList();
                var permisos = (from gu in db.Set<GRUPOS_USUARIOS>()
                                join gm in db.Set<GRUPOS_MENU>() on gu.GrupoID equals gm.GrupoID
                                join m in db.Set<MENU>() on gm.MenuID equals m.Menu_ID
                                where gu.UsuarioID == id
                                select new { gu.GrupoID, m.Menu_Nombre }).ToList();
                var usaGrupos = PermisosAdministracion.Iguales(usuario.Rol, "user");
                return Ok(new
                {
                    usuario.EstadoUsuario,
                    GrupoIds = grupos.Select(g => g.Grupo_ID).ToList(),
                    Grupos = grupos.Where(g => usaGrupos).OrderBy(g => g.Grupo_Nombre).Select(g => new
                    {
                        g.Grupo_ID,
                        g.Grupo_Nombre,
                        Menus = permisos.Where(p => p.GrupoID == g.Grupo_ID && !PermisosTableros.EsPermisoAnterior(p.Menu_Nombre))
                            .Select(p => p.Menu_Nombre).Distinct().OrderBy(m => m).ToList()
                    }).ToList()
                });
            });
        }

        private static string Validar(UsuarioEntrada entrada, bool alta)
        {
            if (entrada == null) return "Completá los datos del usuario.";
            entrada.Nombre = (entrada.Nombre ?? "").Trim();
            entrada.Apellido = (entrada.Apellido ?? "").Trim();
            entrada.Nombre_Usuario = (entrada.Nombre_Usuario ?? "").Trim();
            entrada.Rol = (entrada.Rol ?? "").Trim().ToLowerInvariant();
            entrada.EstadoUsuario = (entrada.EstadoUsuario ?? "Activo").Trim();
            if (new[] { entrada.Nombre, entrada.Apellido, entrada.Nombre_Usuario }.Any(v => v.Length == 0 || v.Length > 50))
                return "Completá el nombre, el apellido y el usuario, con hasta 50 caracteres cada uno.";
            if (!RolesPermitidos.Contains(entrada.Rol)) return "Seleccioná un rol válido.";
            if (!EstadosPermitidos.Contains(entrada.EstadoUsuario)) return "Seleccioná un estado válido.";
            string error;
            if ((alta || !string.IsNullOrEmpty(entrada.Contraseña)) && !ClavesSeguras.Validar(entrada.Contraseña, out error)) return error;
            return null;
        }

        private static string Email(string valor)
        {
            return string.IsNullOrWhiteSpace(valor) ? null : RecuperoContrasena.NormalizarEmail(valor);
        }

        private static string ValidarGrupos(SGTLAuditContext db, UsuarioEntrada entrada, out List<int> ids)
        {
            ids = entrada.Rol == "user" ? (entrada.GrupoIds ?? new List<int>()).Distinct().ToList() : new List<int>();
            if (entrada.Rol == "user" && ids.Count == 0) return "Asigná al menos un grupo.";
            var elegidos = ids;
            if (ids.Any(i => i < 1) || db.Set<GRUPOS>().Count(g => elegidos.Contains(g.Grupo_ID)) != ids.Count)
                return "Uno o más grupos ya no existen. Actualizá la lista.";
            return null;
        }

        private IHttpActionResult Impedimento(SGTLAuditContext db, UsuarioAcceso actual, string rol, string estado, bool eliminar = false)
        {
            var admin = PermisosAdministracion.Iguales(Operador.Rol, "admin");
            if (!admin && (PermisosAdministracion.Iguales(rol, "admin") || (actual != null && PermisosAdministracion.Iguales(actual.Rol, "admin"))))
                return Error(HttpStatusCode.Forbidden, "Solo un administrador puede gestionar cuentas de administrador.");
            if (actual == null) return null;
            if (actual.Usuario_ID == Operador.Usuario_ID && (eliminar || estado != "Activo" || !PermisosAdministracion.Iguales(actual.Rol, rol)))
                return Error(HttpStatusCode.Conflict, "No podés eliminar tu cuenta, inactivarla ni cambiar tu propio rol.");
            if (PermisosAdministracion.Iguales(actual.Rol, "admin") && actual.EstadoUsuario == "Activo" &&
                (eliminar || rol != "admin" || estado != "Activo") &&
                db.Set<USUARIOS>().Count(u => u.Rol.Trim().ToLower() == "admin" && u.EstadoUsuario == "Activo") <= 1)
                return Error(HttpStatusCode.Conflict, "Debe quedar al menos un administrador activo.");
            return null;
        }

        private static UsuarioAcceso Bloquear(SGTLAuditContext db, int id)
        {
            return db.Database.SqlQuery<UsuarioAcceso>(SeguridadSql.Usuario + "WITH (UPDLOCK,HOLDLOCK) WHERE Usuario_ID=@p0", id).SingleOrDefault();
        }

        private static void AsignarGrupos(SGTLAuditContext db, int id, List<int> ids)
        {
            var actuales = db.Set<GRUPOS_USUARIOS>().Where(g => g.UsuarioID == id).ToList();
            db.Set<GRUPOS_USUARIOS>().RemoveRange(actuales.Where(g => !ids.Contains(g.GrupoID)));
            foreach (var gid in ids.Except(actuales.Select(g => g.GrupoID)))
                db.Set<GRUPOS_USUARIOS>().Add(new GRUPOS_USUARIOS { UsuarioID = id, GrupoID = gid });
            db.SaveChanges();
        }

        [HttpPost, Route("")]
        public IHttpActionResult Post(UsuarioEntrada entrada)
        {
            var error = Validar(entrada, true);
            if (error != null) return Error(HttpStatusCode.BadRequest, error);
            string email;
            try { email = Email(entrada.Email); }
            catch (ArgumentException) { return Error(HttpStatusCode.BadRequest, "Ingresá un e-mail válido.", "email_invalido"); }
            return Ejecutar(db =>
            {
                using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    var impedimento = Impedimento(db, null, entrada.Rol, entrada.EstadoUsuario);
                    if (impedimento != null) return impedimento;
                    List<int> grupos;
                    var fallo = ValidarGrupos(db, entrada, out grupos);
                    if (fallo != null) return Error(HttpStatusCode.BadRequest, fallo);
                    if (db.Database.SqlQuery<int>(@"SELECT COUNT(*) FROM dbo.USUARIOS WITH(UPDLOCK,HOLDLOCK)
                        WHERE NombreUsuarioUnico=LOWER(@p0)", entrada.Nombre_Usuario).Single() > 0)
                        return Error(HttpStatusCode.Conflict, "Ya existe un usuario con ese nombre de usuario.", "usuario_duplicado");
                    if (email != null && db.Database.SqlQuery<int>("SELECT COUNT(*) FROM dbo.USUARIOS WITH(UPDLOCK,HOLDLOCK) WHERE Email=@p0", email).Single() > 0)
                        return Error(HttpStatusCode.Conflict, "Ese e-mail ya está registrado en otro usuario.", "email_duplicado");
                    var id = db.Database.SqlQuery<int>(@"INSERT INTO dbo.USUARIOS
                        (Nombre, Apellido, Nombre_Usuario, Contraseña, Email, Rol, EstadoUsuario, Fecha_Alta, Fecha_Modi, Usu_Alta, Usu_Modi, VersionSesion)
                        OUTPUT INSERTED.Usuario_ID VALUES (@p0,@p1,@p2,@p3,@p4,@p5,@p6,GETDATE(),GETDATE(),@p7,@p7,0)",
                        entrada.Nombre, entrada.Apellido, entrada.Nombre_Usuario, ClavesSeguras.Crear(entrada.Contraseña),
                        (object)email ?? DBNull.Value, entrada.Rol, entrada.EstadoUsuario, UsuarioRegistro).Single();
                    AsignarGrupos(db, id, grupos);
                    tx.Commit();
                    Auditar("USUARIOS", "INSERT", id);
                    return Content(HttpStatusCode.Created, new { Usuario_ID = id, message = "Usuario registrado." });
                }
            });
        }

        [HttpPut, Route("{id:int}")]
        public IHttpActionResult Put(int id, UsuarioEntrada entrada)
        {
            var error = Validar(entrada, false);
            if (error != null) return Error(HttpStatusCode.BadRequest, error);
            if (entrada.GrupoIdsOriginales == null || !entrada.VersionSesionOriginal.HasValue)
                return Error(HttpStatusCode.BadRequest, "Volvé a cargar el usuario antes de guardar los cambios.");
            return Ejecutar(db =>
            {
                using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    var actual = Bloquear(db, id);
                    if (actual == null) return NotFound();
                    var gruposActuales = db.Set<GRUPOS_USUARIOS>().Where(gu => gu.UsuarioID == id).Select(gu => gu.GrupoID).ToList();
                    if (actual.VersionSesion != entrada.VersionSesionOriginal.Value || !new HashSet<int>(gruposActuales).SetEquals(entrada.GrupoIdsOriginales))
                        return Error(HttpStatusCode.Conflict, "El usuario o sus grupos cambiaron desde que abriste el formulario. Volvé a cargarlo y revisá los cambios.");
                    if (!string.Equals(actual.Nombre_Usuario, entrada.Nombre_Usuario, StringComparison.Ordinal))
                        return Error(HttpStatusCode.BadRequest, "El nombre de usuario no se puede cambiar.");
                    var impedimento = Impedimento(db, actual, entrada.Rol, entrada.EstadoUsuario);
                    if (impedimento != null) return impedimento;
                    List<int> grupos;
                    var fallo = ValidarGrupos(db, entrada, out grupos);
                    if (fallo != null) return Error(HttpStatusCode.BadRequest, fallo);
                    string email;
                    try { email = entrada.Email == null ? actual.Email : Email(entrada.Email); }
                    catch (ArgumentException) { return Error(HttpStatusCode.BadRequest, "Ingresá un e-mail válido.", "email_invalido"); }
                    if (email != null && db.Database.SqlQuery<int>("SELECT COUNT(*) FROM dbo.USUARIOS WITH(UPDLOCK,HOLDLOCK) WHERE Email=@p0 AND Usuario_ID<>@p1", email, id).Single() > 0)
                        return Error(HttpStatusCode.Conflict, "Ese e-mail ya está registrado en otro usuario.", "email_duplicado");
                    var cambiaClave = !string.IsNullOrEmpty(entrada.Contraseña);
                    var revocar = cambiaClave || !PermisosAdministracion.Iguales(actual.Rol, entrada.Rol) || actual.EstadoUsuario != entrada.EstadoUsuario;
                    db.Database.ExecuteSqlCommand(@"UPDATE dbo.USUARIOS SET Nombre=@p0, Apellido=@p1, Contraseña=@p2,
                        Email=@p3, Rol=@p4, EstadoUsuario=@p5, Fecha_Modi=GETDATE(), Usu_Modi=@p6, VersionSesion=VersionSesion+@p7
                        WHERE Usuario_ID=@p8", entrada.Nombre, entrada.Apellido,
                        cambiaClave ? ClavesSeguras.Crear(entrada.Contraseña) : actual.Clave,
                        (object)email ?? DBNull.Value, entrada.Rol, entrada.EstadoUsuario, UsuarioRegistro, revocar ? 1 : 0, id);
                    AsignarGrupos(db, id, grupos);
                    tx.Commit();
                    Auditar("USUARIOS", "UPDATE", id);
                    return Ok(new { message = "Usuario actualizado.", SesionRevocada = revocar && id == Operador.Usuario_ID });
                }
            });
        }

        [HttpPut, Route("EstadoUsuario/{id:int}")]
        public IHttpActionResult EstadoUsuario(int id, EstadoEntrada entrada)
        {
            if (entrada == null || !EstadosPermitidos.Contains(entrada.EstadoUsuario)) return Error(HttpStatusCode.BadRequest, "Seleccioná un estado válido.");
            return Ejecutar(db =>
            {
                using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    var actual = Bloquear(db, id);
                    if (actual == null) return NotFound();
                    var impedimento = Impedimento(db, actual, (actual.Rol ?? "").Trim().ToLowerInvariant(), entrada.EstadoUsuario);
                    if (impedimento != null) return impedimento;
                    if (actual.EstadoUsuario != entrada.EstadoUsuario)
                        db.Database.ExecuteSqlCommand(@"UPDATE dbo.USUARIOS SET EstadoUsuario=@p0, Fecha_Modi=GETDATE(),
                            Usu_Modi=@p1, VersionSesion=VersionSesion+1 WHERE Usuario_ID=@p2", entrada.EstadoUsuario, UsuarioRegistro, id);
                    tx.Commit();
                    Auditar("USUARIOS", "UPDATE", id);
                    return Ok(new { message = "Estado actualizado." });
                }
            });
        }

        [HttpPost, Route("CambiarContrasena")]
        public IHttpActionResult CambiarContrasena(ClaveEntrada entrada)
        {
            if (entrada == null || string.IsNullOrEmpty(entrada.ContrasenaActual) || entrada.ContrasenaActual.Length > 1024)
                return Error(HttpStatusCode.BadRequest, "Completá la contraseña actual.");
            if (entrada.Nombre_Usuario != null && !PermisosAdministracion.Iguales(entrada.Nombre_Usuario, Operador.Nombre_Usuario))
                return Error(HttpStatusCode.Forbidden, "Solo podés cambiar tu propia contraseña.");
            string error;
            if (!ClavesSeguras.Validar(entrada.ContrasenaNueva, out error)) return Error(HttpStatusCode.BadRequest, error);
            if (entrada.ContrasenaNueva == entrada.ContrasenaActual) return Error(HttpStatusCode.BadRequest, "La contraseña nueva debe ser distinta de la actual.");
            return Ejecutar(db =>
            {
                using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    var actual = Bloquear(db, Operador.Usuario_ID);
                    if (actual == null) return Unauthorized();
                    if (!ClavesSeguras.Verificar(entrada.ContrasenaActual, actual.Clave))
                        return Error(HttpStatusCode.BadRequest, "La contraseña actual es incorrecta.");
                    db.Database.ExecuteSqlCommand(@"UPDATE dbo.USUARIOS SET Contraseña=@p0, VersionSesion=VersionSesion+1,
                        Fecha_Modi=GETDATE(), Usu_Modi=@p1 WHERE Usuario_ID=@p2", ClavesSeguras.Crear(entrada.ContrasenaNueva), UsuarioRegistro, actual.Usuario_ID);
                    tx.Commit();
                    Auditar("USUARIOS", "UPDATE", actual.Usuario_ID);
                    return Ok(new { message = "Contraseña actualizada. Volvé a iniciar sesión." });
                }
            });
        }

        [HttpDelete, Route("{id:int}")]
        public IHttpActionResult Delete(int id)
        {
            return Ejecutar(db =>
            {
                using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    var actual = Bloquear(db, id);
                    if (actual == null) return NotFound();
                    var impedimento = Impedimento(db, actual, (actual.Rol ?? "").Trim().ToLowerInvariant(), actual.EstadoUsuario, true);
                    if (impedimento != null) return impedimento;
                    db.Set<GRUPOS_USUARIOS>().RemoveRange(db.Set<GRUPOS_USUARIOS>().Where(g => g.UsuarioID == id));
                    db.SaveChanges();
                    db.Database.ExecuteSqlCommand("DELETE FROM dbo.USUARIOS WHERE Usuario_ID=@p0", id);
                    tx.Commit();
                    Auditar("USUARIOS", "DELETE", id);
                    return Ok(new { message = "Usuario eliminado." });
                }
            });
        }
    }
}
