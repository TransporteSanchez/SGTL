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
    [AccesoAdministracion("grupos"), RoutePrefix("api/Grupos")]
    public sealed class GruposController : ControladorAdministracion
    {
        public sealed class GrupoEntrada { public string Grupo_Nombre { get; set; } }
        public sealed class MenusEntrada
        {
            public List<int> MenuIds { get; set; }
            public List<int> MenuIdsOriginales { get; set; }
        }
        public sealed class IntegrantesEntrada
        {
            public List<int> AgregarIds { get; set; }
            public List<int> QuitarIds { get; set; }
        }
        public sealed class GrupoAuditoria
        {
            public int Grupo_ID { get; set; }
            public string Grupo_Nombre { get; set; }
            public DateTime? Fecha_Alta { get; set; }
            public string Usu_Alta { get; set; }
            public DateTime? Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }
        }

        private static GrupoAuditoria ObtenerValoresAuditoria(
            SGTLAuditContext db,
            int id)
        {
            return db.Database.SqlQuery<GrupoAuditoria>(
                @"SELECT Grupo_ID, Grupo_Nombre, Fecha_Alta,
                 Usu_Alta, Fecha_Modi, Usu_Modi
          FROM dbo.GRUPOS
          WHERE Grupo_ID = @p0",
                id
            ).Single();
        }

        [HttpGet, Route("")]
        public IHttpActionResult Get()
        {
            return Ejecutar(db => Ok(db.Set<GRUPOS>().AsNoTracking().OrderBy(g => g.Grupo_Nombre)
                .Select(g => new { g.Grupo_ID, g.Grupo_Nombre }).ToList()));
        }

        [HttpGet, Route("{id:int}")]
        public IHttpActionResult Get(int id)
        {
            return Ejecutar(db =>
            {
                var grupo = db.Set<GRUPOS>().AsNoTracking().Where(g => g.Grupo_ID == id)
                    .Select(g => new { g.Grupo_ID, g.Grupo_Nombre }).SingleOrDefault();
                return grupo == null ? (IHttpActionResult)NotFound() : Ok(grupo);
            });
        }

        private IHttpActionResult GuardarNombre(int? id, GrupoEntrada entrada)
        {
            var nombre = (entrada == null ? "" : entrada.Grupo_Nombre ?? "").Trim();
            if (nombre.Length == 0 || nombre.Length > 100)
                return Error(HttpStatusCode.BadRequest, "Completá el nombre del grupo, con hasta 100 caracteres.");
            return Ejecutar(db =>
            {
                using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    if (id.HasValue && !db.Set<GRUPOS>().Any(g => g.Grupo_ID == id.Value)) return NotFound();
                    var normalizado = nombre.ToLowerInvariant();
                    var excluirId = id.GetValueOrDefault();
                    if (db.Set<GRUPOS>().Any(g => g.Grupo_Nombre.Trim().ToLower() == normalizado && g.Grupo_ID != excluirId))
                        return Error(HttpStatusCode.Conflict, "Ya existe un grupo con ese nombre.");
                    var anteriores = id.HasValue
                        ? ObtenerValoresAuditoria(db, id.Value)
                        : null;
                    int grupoId;
                    // Los campos de registro de GRUPOS no están mapeados en el EDMX de main.
                    if (id.HasValue)
                    {
                        grupoId = id.Value;
                        db.Database.ExecuteSqlCommand("UPDATE dbo.GRUPOS SET Grupo_Nombre=@p0, Fecha_Modi=GETDATE(), Usu_Modi=@p1 WHERE Grupo_ID=@p2", nombre, UsuarioRegistro, grupoId);
                    }
                    else
                    {
                        grupoId = db.Database.SqlQuery<int>(@"INSERT INTO dbo.GRUPOS (Grupo_Nombre,Fecha_Alta,Usu_Alta,Fecha_Modi,Usu_Modi)
                            OUTPUT INSERTED.Grupo_ID VALUES (@p0,GETDATE(),@p1,GETDATE(),@p1)", nombre, UsuarioRegistro).Single();
                    }
                    var nuevos = ObtenerValoresAuditoria(db, grupoId);
                    tx.Commit();
                    Auditar(
                        "GRUPOS",
                        id.HasValue ? "UPDATE" : "INSERT",
                        grupoId,
                        anteriores,
                        nuevos
                    );
                    return Ok(new { Grupo_ID = grupoId, message = id.HasValue ? "Grupo actualizado." : "Grupo registrado." });
                }
            });
        }

        [HttpPost, Route("")]
        public IHttpActionResult Post(GrupoEntrada entrada) { return GuardarNombre(null, entrada); }

        [HttpPut, Route("{id:int}")]
        public IHttpActionResult Put(int id, GrupoEntrada entrada) { return GuardarNombre(id, entrada); }

        private static bool QuedariaSinGrupo(SGTLAuditContext db, int grupoId, List<int> usuarios)
        {
            return db.Set<USUARIOS>().Where(u => usuarios.Contains(u.Usuario_ID) && u.Rol.Trim().ToLower() == "user" &&
                !db.Set<GRUPOS_USUARIOS>().Any(gu => gu.UsuarioID == u.Usuario_ID && gu.GrupoID != grupoId)).Any();
        }

        [HttpDelete, Route("{id:int}")]
        public IHttpActionResult Delete(int id)
        {
            return Ejecutar(db =>
            {
                using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id)) return NotFound();
                    var integrantes = db.Set<GRUPOS_USUARIOS>().Where(gu => gu.GrupoID == id).ToList();
                    if (QuedariaSinGrupo(db, id, integrantes.Select(gu => gu.UsuarioID).Distinct().ToList()))
                        return Error(HttpStatusCode.Conflict, "No se puede eliminar el grupo: un usuario se quedaría sin grupos.");
                    var anteriores = ObtenerValoresAuditoria(db, id);
                    db.Set<GRUPOS_USUARIOS>().RemoveRange(integrantes);
                    db.Set<GRUPOS_MENU>().RemoveRange(db.Set<GRUPOS_MENU>().Where(gm => gm.GrupoID == id));
                    db.SaveChanges();
                    db.Database.ExecuteSqlCommand("DELETE FROM dbo.GRUPOS WHERE Grupo_ID=@p0", id);
                    tx.Commit();
                    Auditar("GRUPOS", "DELETE", id, valoresAnteriores: anteriores);
                    return Ok(new { message = "Grupo eliminado." });
                }
            });
        }

        private static readonly string[] SeccionesTableros =
        {
            "Tableros de viajes", "Tableros de flota", "Tableros de choferes", "Tableros de facturación"
        };

        private static bool EsLaMismaSeccion(string guardado, string esperado)
        {
            var temasGuardados = PermisosTableros.TemasPara(false, false, new[] { guardado });
            var temasEsperados = PermisosTableros.TemasPara(false, false, new[] { esperado });
            return temasGuardados.Length == 1 && temasEsperados.Length == 1 && temasGuardados[0] == temasEsperados[0];
        }

        private static void AsegurarSeccionesTableros(SGTLAuditContext db)
        {
            var existentes = db.Set<MENU>().Select(m => m.Menu_Nombre).ToList();
            var faltan = SeccionesTableros.Where(nombre => !existentes.Any(actual => EsLaMismaSeccion(actual, nombre))).ToList();
            if (faltan.Count == 0) return;
            foreach (var nombre in faltan)
                db.Set<MENU>().Add(new MENU { Menu_Nombre = nombre, Menu_Principal = 0 });
            db.SaveChanges();
        }

        [HttpGet, Route("{id:int}/Menus")]
        public IHttpActionResult Menus(int id)
        {
            return Ejecutar(db =>
            {
                AsegurarSeccionesTableros(db);
                if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id))
                    return NotFound();

                var ids = db.Set<GRUPOS_MENU>()
                    .Where(gm => gm.GrupoID == id)
                    .Select(gm => gm.MenuID)
                    .ToList();

                var catalogo = db.Set<MENU>()
                    .AsNoTracking()
                    .OrderBy(m => m.Menu_Nombre)
                    .Select(m => new { m.Menu_ID, m.Menu_Nombre })
                    .ToList();

                return Ok(catalogo
                    .Where(m => !PermisosTableros.EsPermisoAnterior(m.Menu_Nombre))
                    .Select(m => new
                    {
                        m.Menu_ID,
                        m.Menu_Nombre,
                        Asignado = ids.Contains(m.Menu_ID),
                        EsTablero = PermisosTableros.TemasPara(
                            false, false, new[] { m.Menu_Nombre }
                        ).Length > 0
                    })
                    .ToList());
            });
        }

        [HttpPost, Route("{id:int}/Menus")]
        public IHttpActionResult GuardarMenus(int id, MenusEntrada entrada)
        {
            if (entrada == null || entrada.MenuIds == null || entrada.MenuIdsOriginales == null)
                return Error(HttpStatusCode.BadRequest, "Indicá los permisos elegidos y los que cargaste al abrir el grupo.");
            var ids = entrada.MenuIds.Distinct().ToList();
            if (ids.Any(i => i < 1)) return Error(HttpStatusCode.BadRequest, "Seleccioná permisos válidos.");
            return Ejecutar(db =>
            {
                using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id)) return NotFound();
                    var catalogo = db.Set<MENU>().Select(m => new { m.Menu_ID, m.Menu_Nombre }).ToList();
                    var permitidos = new HashSet<int>(catalogo.Where(m => !PermisosTableros.EsPermisoAnterior(m.Menu_Nombre)).Select(m => m.Menu_ID));
                    if (ids.Any(i => !permitidos.Contains(i)))
                        return Error(HttpStatusCode.BadRequest, "Uno o más permisos ya no están disponibles. Volvé a cargar el grupo.");
                    var actuales = db.Set<GRUPOS_MENU>().Where(gm => gm.GrupoID == id).ToList();
                    if (!new HashSet<int>(actuales.Where(gm => permitidos.Contains(gm.MenuID)).Select(gm => gm.MenuID)).SetEquals(entrada.MenuIdsOriginales))
                        return Error(HttpStatusCode.Conflict, "Los permisos cambiaron desde que abriste el grupo. Volvé a cargarlo y revisá los cambios.");
                    db.Set<GRUPOS_MENU>().RemoveRange(actuales.Where(gm => !ids.Contains(gm.MenuID)));
                    foreach (var menuId in ids.Except(actuales.Select(gm => gm.MenuID)))
                        db.Set<GRUPOS_MENU>().Add(new GRUPOS_MENU { GrupoID = id, MenuID = menuId });
                    db.SaveChanges();
                    tx.Commit();
                    return Ok(new { message = "Permisos guardados." });
                }
            });
        }

        [HttpGet, Route("{id:int}/Usuarios")]
        public IHttpActionResult Usuarios(int id)
        {
            return Ejecutar(db =>
            {
                if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id)) return NotFound();
                var relaciones = db.Set<GRUPOS_USUARIOS>().Select(gu => new { gu.UsuarioID, gu.GrupoID }).Distinct().ToList();
                var asignados = new HashSet<int>(relaciones.Where(gu => gu.GrupoID == id).Select(gu => gu.UsuarioID));
                var conOtroGrupo = new HashSet<int>(relaciones.Where(gu => gu.GrupoID != id).Select(gu => gu.UsuarioID));
                return Ok(db.Set<USUARIOS>().AsNoTracking().OrderBy(u => u.Nombre_Usuario)
                    .Select(u => new { u.Usuario_ID, u.Nombre_Usuario, u.Nombre, u.Apellido, u.Rol }).ToList()
                    .Select(u => new
                    {
                        u.Usuario_ID,
                        u.Nombre_Usuario,
                        u.Rol,
                        NombreCompleto = ((u.Nombre ?? "") + " " + (u.Apellido ?? "")).Trim(),
                        Asignado = asignados.Contains(u.Usuario_ID),
                        PuedeAgregar = PermisosAdministracion.Iguales(u.Rol, "user"),
                        PuedeQuitar = !PermisosAdministracion.Iguales(u.Rol, "user") || conOtroGrupo.Contains(u.Usuario_ID)
                    }).ToList());
            });
        }

        [HttpPost, Route("{id:int}/Usuarios/Cambios")]
        public IHttpActionResult GuardarIntegrantes(int id, IntegrantesEntrada entrada)
        {
            if (entrada == null) return Error(HttpStatusCode.BadRequest, "Indicá los usuarios que querés agregar o quitar.");
            var agregar = (entrada.AgregarIds ?? new List<int>()).Distinct().ToList();
            var quitar = (entrada.QuitarIds ?? new List<int>()).Distinct().ToList();
            if (agregar.Concat(quitar).Any(i => i < 1) || agregar.Intersect(quitar).Any())
                return Error(HttpStatusCode.BadRequest, "Revisá los usuarios que querés agregar o quitar.");
            return Ejecutar(db =>
            {
                using (var tx = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id)) return NotFound();
                    var solicitados = agregar.Concat(quitar).Distinct().ToList();
                    var usuarios = db.Set<USUARIOS>().Where(u => solicitados.Contains(u.Usuario_ID)).Select(u => new { u.Usuario_ID, u.Rol }).ToList();
                    if (usuarios.Count != solicitados.Count) return Error(HttpStatusCode.Conflict, "Uno o más usuarios ya no existen. Volvé a cargar el grupo.");
                    if (usuarios.Any(u => agregar.Contains(u.Usuario_ID) && !PermisosAdministracion.Iguales(u.Rol, "user")))
                        return Error(HttpStatusCode.BadRequest, "Solo se pueden agregar usuarios con rol Usuario. Administradores y choferes no usan grupos.");
                    var actuales = db.Set<GRUPOS_USUARIOS>().Where(gu => gu.GrupoID == id).ToList();
                    var borrar = actuales.Where(gu => quitar.Contains(gu.UsuarioID)).ToList();
                    if (QuedariaSinGrupo(db, id, borrar.Select(gu => gu.UsuarioID).Distinct().ToList()))
                        return Error(HttpStatusCode.Conflict, "No se puede quitar un usuario de su único grupo.");
                    db.Set<GRUPOS_USUARIOS>().RemoveRange(borrar);
                    var nuevos = agregar.Except(actuales.Select(gu => gu.UsuarioID)).ToList();
                    foreach (var usuarioId in nuevos)
                        db.Set<GRUPOS_USUARIOS>().Add(new GRUPOS_USUARIOS { GrupoID = id, UsuarioID = usuarioId });
                    db.SaveChanges();
                    tx.Commit();
                    return Ok(new { message = "Integrantes guardados.", UsuariosAgregados = nuevos.Count, UsuariosQuitados = borrar.Count });
                }
            });
        }
    }
}
