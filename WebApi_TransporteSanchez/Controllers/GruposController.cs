using System;

using System.Collections.Generic;

using System.Data.Entity;

using System.Data.Entity.Infrastructure;

using System.Data.Entity.Validation;

using System.Globalization;

using System.Linq;

using System.Net;

using System.Text;

using System.Web.Http;



namespace WebApi_TransporteSanchez.Controllers

{

    [RoutePrefix("api/Grupos")]

    public class GruposController : ApiController

    {

        private static readonly string[] CatalogoMenuPermisos =
        {
            // "Tableros" (24/10): la pantalla con todos los tableros por tema, con permiso propio como el Dashboard.
            "Dashboard", "Tableros",
            // "Hoja de ruta" (24/10): la pantalla del chofer; el grupo de los choferes tiene solo este permiso.
            "Hoja de ruta",
            "Listado de choferes", "Gestión de choferes",
            "Listado de camiones", "Gestión de camiones",
            "Listado de viajes", "Gestión de viajes", "Gestión de orígenes y destinos", "Gestión de tarifas", "Presupuestos",
            "Listado de clientes", "Gestión de clientes",
            "Listado de proformas", "Gestión de proformas", "Cuenta Corriente", "Gestión de tipos de comprobante",
            // "Gestión de empresa" (23/10): como las demás de Configuración, no da acceso (es solo de administradores);
            // está para que el catálogo tenga todas las pantallas. Ver "permisos que no dan acceso" en los pendientes.
            "E-mail", "Gestión de contenido", "Integración WhatsApp", "Gestión de empresa",
            "Listado de usuarios", "Gestión de usuarios", "Grupos y permisos",
            "Auditoría"
        };

        private static readonly Dictionary<string, string> MenuPrincipalPorPermiso =
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "dashboard", "General" },
                { "tableros", "General" },
                { "hoja de ruta", "General" },
                { "listado de choferes", "Choferes" },
                { "gestion de choferes", "Choferes" },
                { "listado de camiones", "Camiones" },
                { "gestion de camiones", "Camiones" },
                { "listado de viajes", "Viajes" },
                { "gestion de viajes", "Viajes" },
                { "gestion de origenes y destinos", "Viajes" },
                { "gestion de tarifas", "Viajes" },
                { "presupuestos", "Viajes" },
                { "listado de clientes", "Clientes" },
                { "gestion de clientes", "Clientes" },
                { "listado de proformas", "Facturación" },
                { "gestion de proformas", "Facturación" },
                { "cuenta corriente", "Facturación" },
                // Antes "Facturación", en Configuración: la pantalla se mudó a la sección Facturación (22/10).
                // Sigue siendo solo de administradores: el permiso no da acceso por sí solo.
                { "gestion de tipos de comprobante", "Facturación" },
                { "e-mail", "Configuración" },
                { "gestion de contenido", "Configuración" },
                { "integracion whatsapp", "Configuración" },
                { "gestion de empresa", "Configuración" },
                { "listado de usuarios", "Usuarios" },
                { "gestion de usuarios", "Usuarios" },
                { "grupos y permisos", "Usuarios" },
                { "auditoria", "General" }
            };

        private static MENU BuscarMenu(IEnumerable<MENU> menus, params string[] nombres)
        {
            return menus.FirstOrDefault(menu => nombres.Any(nombre =>
                string.Equals(NormalizarNombreMenu(menu.Menu_Nombre), NormalizarNombreMenu(nombre), StringComparison.OrdinalIgnoreCase)));
        }

        private static string NormalizarNombreMenu(string nombre)
        {
            return string.Concat((nombre ?? string.Empty).Trim().Normalize(NormalizationForm.FormD)
                .Where(caracter => CharUnicodeInfo.GetUnicodeCategory(caracter) != UnicodeCategory.NonSpacingMark))
                .Normalize(NormalizationForm.FormC);
        }

        private static string ObtenerMenuPrincipal(string nombreMenu)
        {
            string menuPrincipal;
            return MenuPrincipalPorPermiso.TryGetValue(NormalizarNombreMenu(nombreMenu), out menuPrincipal)
                ? menuPrincipal
                : "General";
        }

        private static void AsegurarCatalogoMenuPermisos(SGTLAuditContext db)
        {
            var menus = db.Set<MENU>().ToList();
            var seModifico = false;

            // Conserva los Menu_ID y, por ende, los permisos ya asignados a los grupos.
            var renombres = new[]
            {
                new { Nuevo = "Gestión de proformas", Anteriores = new[] { "Gestión de facturas", "Gestion de facturas" } },
                new { Nuevo = "Listado de proformas", Anteriores = new[] { "Listado de facturas" } },
                new { Nuevo = "E-mail", Anteriores = new[] { "Configuración", "Configuracion", "Email" } },
                new { Nuevo = "Integración WhatsApp", Anteriores = new[] { "Integracion Whatsapp", "WhatsApp", "Whatsapp", "Configuración WhatsApp", "Configuracion WhatsApp" } },
                new { Nuevo = "Gestión de tipos de comprobante", Anteriores = new[] { "Facturación", "Facturacion", "Configuración facturación", "Configuracion facturacion", "Tipos de comprobantes" } }
            };

            foreach (var renombre in renombres)
            {
                var anterior = BuscarMenu(menus, renombre.Anteriores);
                if (anterior == null) continue;

                var vigente = BuscarMenu(menus, renombre.Nuevo);
                if (vigente == null)
                {
                    anterior.Menu_Nombre = renombre.Nuevo;
                    seModifico = true;
                    continue;
                }

                if (vigente.Menu_ID == anterior.Menu_ID) continue;

                // Si coexistían ambos nombres, unifica sus asignaciones sin duplicarlas.
                var gruposVigentes = new HashSet<int>(db.Set<GRUPOS_MENU>()
                    .Where(asignacion => asignacion.MenuID == vigente.Menu_ID)
                    .Select(asignacion => asignacion.GrupoID)
                    .ToList());
                var gruposAnteriores = db.Set<GRUPOS_MENU>()
                    .Where(asignacion => asignacion.MenuID == anterior.Menu_ID)
                    .ToList();
                foreach (var asignacion in gruposAnteriores.Where(asignacion => gruposVigentes.Add(asignacion.GrupoID)))
                {
                    db.Set<GRUPOS_MENU>().Add(new GRUPOS_MENU { GrupoID = asignacion.GrupoID, MenuID = vigente.Menu_ID });
                }
                if (gruposAnteriores.Any()) db.Set<GRUPOS_MENU>().RemoveRange(gruposAnteriores);
                db.Set<MENU>().Remove(anterior);
                menus.Remove(anterior);
                seModifico = true;
            }

            foreach (var nombreMenu in CatalogoMenuPermisos)
            {
                if (BuscarMenu(menus, nombreMenu) != null) continue;
                var menu = new MENU { Menu_Nombre = nombreMenu, Menu_Principal = 0 };
                db.Set<MENU>().Add(menu);
                menus.Add(menu);
                seModifico = true;
            }

            if (seModifico) db.SaveChanges();
        }

        public class GruposDto

        {

            public int Grupo_ID { get; set; }

            public string Grupo_Nombre { get; set; }

        }



        public class MenuAsignacionDto

        {

            public int Menu_ID { get; set; }

            public string Menu_Nombre { get; set; }

            /// <summary>Menú principal visual al que pertenece el permiso.</summary>
            public string Menu_Principal { get; set; }

            public bool Asignado { get; set; }

        }



        public class UsuarioAsignacionDto

        {

            public int Usuario_ID { get; set; }

            public string Nombre_Usuario { get; set; }

            public string NombreCompleto { get; set; }

            public string Rol { get; set; }

            public bool EsAdministrador { get; set; }

            public bool Asignado { get; set; }

        }



        public class GrupoUpsertDto

        {

            public string Grupo_Nombre { get; set; }

            /// <summary>Nombre del usuario logueado (Usu_Alta y Usu_Modi). Si no se envía, se usa "SISTEMA".</summary>

            public string UsuarioLogueado { get; set; }

        }



        public class GuardarMenusGrupoDto

        {

            public List<int> MenuIds { get; set; }

        }



        public class GuardarUsuariosGrupoDto

        {

            public List<int> UsuarioIds { get; set; }

        }

        private static bool EsAdministrador(string rol)

        {

            return string.Equals((rol ?? string.Empty).Trim(), "admin", StringComparison.OrdinalIgnoreCase);

        }



        private static string ObtenerMensajeInterno(Exception ex)

        {

            if (ex == null) return null;

            var actual = ex;

            while (actual.InnerException != null)

                actual = actual.InnerException;

            return actual.Message;

        }



        [HttpGet]

        [Route("")]

        public IHttpActionResult Get()

        {

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    var grupos = db.Set<GRUPOS>()

                        .OrderBy(g => g.Grupo_Nombre)

                        .Select(g => new GruposDto

                        {

                            Grupo_ID = g.Grupo_ID,

                            Grupo_Nombre = g.Grupo_Nombre

                        }).ToList();



                    return Ok(grupos);

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



        [HttpGet]

        [Route("{id:int}")]

        public IHttpActionResult Get(int id)

        {

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    var grupo = db.Set<GRUPOS>()

                        .Where(g => g.Grupo_ID == id)

                        .Select(g => new GruposDto

                        {

                            Grupo_ID = g.Grupo_ID,

                            Grupo_Nombre = g.Grupo_Nombre

                        })

                        .FirstOrDefault();



                    if (grupo == null)

                    {

                        return NotFound();

                    }



                    return Ok(grupo);

                }

            }

            catch (Exception ex)

            {

                return InternalServerError(ex);

            }

        }



        [HttpPost]

        [Route("")]

        public IHttpActionResult Post([FromBody] GrupoUpsertDto value)

        {

            if (value == null || string.IsNullOrWhiteSpace(value.Grupo_Nombre))

            {

                return Content(HttpStatusCode.BadRequest, new { message = "El nombre del grupo es obligatorio." });

            }



            string nombre = value.Grupo_Nombre.Trim();

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    bool existe = db.Set<GRUPOS>().Any(g => g.Grupo_Nombre == nombre);

                    if (existe)

                    {

                        return Content(HttpStatusCode.BadRequest, new { message = "Ya existe un grupo con ese nombre." });

                    }



                    // Usu_Alta y Usu_Modi = usuario logueado (mismo valor en alta). Si no viene, "SISTEMA".

                    string usu = (value.UsuarioLogueado ?? "").Trim();

                    if (string.IsNullOrEmpty(usu)) usu = "SISTEMA";



                    int nuevoId = db.Database.SqlQuery<int>(

                        "INSERT INTO dbo.GRUPOS (Grupo_Nombre, Fecha_Alta, Usu_Alta, Fecha_Modi, Usu_Modi) OUTPUT INSERTED.Grupo_ID VALUES (@p0, GETDATE(), @p1, GETDATE(), @p2)",

                        nombre, usu, usu

                    ).FirstOrDefault();



                    return Ok(new { message = "Grupo creado correctamente.", Grupo_ID = nuevoId });

                }

            }

            catch (DbEntityValidationException ex)

            {

                var validationErrors = new List<string>();

                foreach (var validationResult in ex.EntityValidationErrors)

                {

                    foreach (var error in validationResult.ValidationErrors)

                    {

                        validationErrors.Add($"{error.PropertyName}: {error.ErrorMessage}");

                    }

                }

                return Content(HttpStatusCode.BadRequest, new { message = "Error de validación.", errors = validationErrors });

            }

            catch (DbUpdateException ex)

            {

                var msg = ObtenerMensajeInterno(ex);

                return Content(HttpStatusCode.InternalServerError, new { message = "Error al crear el grupo.", detail = msg });

            }

            catch (Exception ex)

            {

                var msg = ObtenerMensajeInterno(ex);

                return Content(HttpStatusCode.InternalServerError, new { message = "Error al crear el grupo.", detail = msg });

            }

        }



        [HttpPut]

        [Route("{id:int}")]

        public IHttpActionResult Put(int id, [FromBody] GrupoUpsertDto value)

        {

            if (value == null || string.IsNullOrWhiteSpace(value.Grupo_Nombre))

            {

                return BadRequest("El nombre del grupo es obligatorio.");

            }



            string nombre = value.Grupo_Nombre.Trim();

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    var grupo = db.Set<GRUPOS>().Find(id);



                    if (grupo == null)

                    {

                        return NotFound();

                    }


                    bool nombreDuplicado = db.Set<GRUPOS>().Any(g => g.Grupo_ID != id && g.Grupo_Nombre == nombre);

                    if (nombreDuplicado)

                    {

                        return Content(HttpStatusCode.BadRequest, new { message = "Ya existe otro grupo con ese nombre." });

                    }



                    grupo.Grupo_Nombre = nombre;

                    db.SaveChanges();



                    return Ok(new { message = "Grupo actualizado correctamente." });

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



        [HttpDelete]

        [Route("{id:int}")]

        public IHttpActionResult Delete(int id)

        {

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");



            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    var grupo = db.Set<GRUPOS>().Find(id);



                    if (grupo == null)

                    {

                        return NotFound();

                    }



                    // Eliminar primero los registros que referencian al grupo (evitar conflicto FK)

                    var permisos = db.Set<GRUPOS_MENU>().Where(x => x.GrupoID == id).ToList();

                    var usuariosGrupo = db.Set<GRUPOS_USUARIOS>().Where(x => x.GrupoID == id).ToList();



                    if (permisos.Any())

                    {

                        db.Set<GRUPOS_MENU>().RemoveRange(permisos);

                        db.SaveChanges(); // Persistir antes de borrar el grupo

                    }

                    if (usuariosGrupo.Any())

                    {

                        db.Set<GRUPOS_USUARIOS>().RemoveRange(usuariosGrupo);

                        db.SaveChanges(); // Persistir antes de borrar el grupo

                    }


                    db.Set<GRUPOS>().Remove(grupo);

                    db.SaveChanges();



                    return Ok(new { message = "Grupo eliminado correctamente." });

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



        [HttpGet]

        [Route("{id:int}/Menus")]

        public IHttpActionResult GetMenusPorGrupo(int id)

        {

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    AsegurarCatalogoMenuPermisos(db);

                    if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id))

                    {

                        return NotFound();

                    }


                    var menusAsignados = new HashSet<int>(db.Set<GRUPOS_MENU>()

                        .Where(gm => gm.GrupoID == id)

                        .Select(gm => gm.MenuID)

                        .ToList());

                    var menus = db.Set<MENU>()

                        .ToList()

                        .Select(m => new MenuAsignacionDto

                        {

                            Menu_ID = m.Menu_ID,

                            Menu_Nombre = m.Menu_Nombre,

                            Menu_Principal = ObtenerMenuPrincipal(m.Menu_Nombre),

                            Asignado = menusAsignados.Contains(m.Menu_ID)

                        })

                        .OrderBy(m => m.Menu_Principal)

                        .ThenBy(m => m.Menu_Nombre)

                        .ToList();



                    return Ok(menus);

                }

            }

            catch (Exception ex)

            {

                return InternalServerError(ex);

            }

        }



        [HttpPost]

        [Route("{id:int}/Menus")]

        public IHttpActionResult GuardarMenusPorGrupo(int id, [FromBody] GuardarMenusGrupoDto value)

        {

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    AsegurarCatalogoMenuPermisos(db);

                    if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id))

                    {

                        return NotFound();

                    }



                    var ids = (value?.MenuIds ?? new List<int>()).Distinct().ToList();

                    var actuales = db.Set<GRUPOS_MENU>().Where(x => x.GrupoID == id).ToList();

                    if (actuales.Any())

                    {

                        db.Set<GRUPOS_MENU>().RemoveRange(actuales);

                    }



                    foreach (var menuId in ids)

                    {

                        db.Set<GRUPOS_MENU>().Add(new GRUPOS_MENU

                        {

                            GrupoID = id,

                            MenuID = menuId

                        });

                    }



                    db.SaveChanges();

                    return Ok(new { message = "Permisos guardados correctamente." });

                }

            }

            catch (Exception ex)

            {

                return InternalServerError(ex);

            }

        }



        [HttpGet]

        [Route("{id:int}/Usuarios")]

        public IHttpActionResult GetUsuariosPorGrupo(int id)

        {

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id))

                    {

                        return NotFound();

                    }



                    var usuariosAsignados = new HashSet<int>(db.Set<GRUPOS_USUARIOS>()

                        .Where(gu => gu.GrupoID == id)

                        .Select(gu => gu.UsuarioID)

                        .ToList());

                    var usuarios = db.Set<USUARIOS>()

                        .OrderBy(u => u.Nombre_Usuario)

                        .Select(u => new

                        {

                            u.Usuario_ID,

                            u.Nombre_Usuario,

                            NombreCompleto = (u.Nombre ?? "") + " " + (u.Apellido ?? ""),

                            u.Rol

                        })

                        .ToList()

                        .Select(u =>

                        {

                            var esAdministrador = EsAdministrador(u.Rol);

                            return new UsuarioAsignacionDto

                            {

                                Usuario_ID = u.Usuario_ID,

                                Nombre_Usuario = u.Nombre_Usuario,

                                NombreCompleto = u.NombreCompleto.Trim(),

                                Rol = u.Rol,

                                EsAdministrador = esAdministrador,

                                // Un administrador tiene acceso total por su rol, nunca por un grupo.

                                Asignado = !esAdministrador && usuariosAsignados.Contains(u.Usuario_ID)

                            };

                        })

                        .ToList();



                    return Ok(usuarios);

                }

            }

            catch (Exception ex)

            {

                return InternalServerError(ex);

            }

        }



        [HttpPost]

        [Route("{id:int}/Usuarios")]

        public IHttpActionResult GuardarUsuariosPorGrupo(int id, [FromBody] GuardarUsuariosGrupoDto value)

        {

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try

            {

                using (var db = new SGTLAuditContext(connectionString))

                {

                    if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id))

                    {

                        return NotFound();

                    }



                    var idsSolicitados = (value?.UsuarioIds ?? new List<int>()).Distinct().ToList();

                    var usuariosSolicitados = db.Set<USUARIOS>()

                        .Where(u => idsSolicitados.Contains(u.Usuario_ID))

                        .Select(u => new { u.Usuario_ID, u.Rol })

                        .ToList();

                    // La API también excluye administradores, aun si se invoca sin la interfaz.

                    var idsAsignables = usuariosSolicitados

                        .Where(u => !EsAdministrador(u.Rol))

                        .Select(u => u.Usuario_ID)

                        .ToList();

                    var idsActuales = new HashSet<int>(db.Set<GRUPOS_USUARIOS>()

                        .Where(x => x.GrupoID == id)

                        .Select(x => x.UsuarioID)

                        .ToList());

                    var idsNuevos = idsAsignables

                        .Where(usuarioId => !idsActuales.Contains(usuarioId))

                        .ToList();



                    foreach (var usuarioId in idsNuevos)

                    {

                        db.Set<GRUPOS_USUARIOS>().Add(new GRUPOS_USUARIOS

                        {

                            GrupoID = id,

                            UsuarioID = usuarioId

                        });

                    }



                    db.SaveChanges();

                    return Ok(new { message = "Usuarios agregados al grupo correctamente.", UsuariosAgregados = idsNuevos.Count });

                }

            }

            catch (Exception ex)

            {

                return InternalServerError(ex);

            }

        }



    }

}

