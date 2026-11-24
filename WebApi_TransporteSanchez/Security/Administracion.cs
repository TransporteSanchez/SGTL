using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using Newtonsoft.Json;

namespace WebApi_TransporteSanchez.Security
{
    public static class PermisosAdministracion
    {
        public static bool Iguales(string a, string b)
        {
            return CultureInfo.InvariantCulture.CompareInfo.Compare(
                (a ?? "").Trim(),
                (b ?? "").Trim(),
                CompareOptions.IgnoreCase | CompareOptions.IgnoreNonSpace
            ) == 0;
        }

        public static List<string> Menus(
            SGTLAuditContext db,
            UsuarioAcceso usuario)
        {
            if (Iguales(usuario.Rol, "admin"))
            {
                return db.Set<MENU>()
                    .Select(m => m.Menu_Nombre)
                    .ToList()
                    .Where(m => !PermisosTableros.EsPermisoAnterior(m))
                    .Distinct()
                    .ToList();
            }

            if (!Iguales(usuario.Rol, "user"))
            {
                return new List<string>();
            }

            return (
                from gu in db.Set<GRUPOS_USUARIOS>()
                join gm in db.Set<GRUPOS_MENU>()
                    on gu.GrupoID equals gm.GrupoID
                join m in db.Set<MENU>()
                    on gm.MenuID equals m.Menu_ID
                where gu.UsuarioID == usuario.Usuario_ID
                select m.Menu_Nombre
            )
                .Distinct()
                .ToList()
                .Where(m => !PermisosTableros.EsPermisoAnterior(m))
                .ToList();
        }

        public static bool Tiene(
            UsuarioAcceso usuario,
            IEnumerable<string> menus,
            params string[] permisos)
        {
            return Iguales(usuario.Rol, "admin")
                || (
                    Iguales(usuario.Rol, "user")
                    && permisos.Any(
                        permiso => menus.Any(
                            menu => Iguales(menu, permiso)
                        )
                    )
                );
        }
    }

    public sealed class AccesoAdministracionAttribute
        : AuthorizationFilterAttribute
    {
        private readonly string modulo;

        public AccesoAdministracionAttribute(string modulo)
        {
            this.modulo = modulo;
        }

        public override async Task OnAuthorizationAsync(
            HttpActionContext contexto,
            CancellationToken ct)
        {
            if (contexto.Request.Method == HttpMethod.Options)
            {
                return;
            }

            try
            {
                var usuario = await SesionSegura.VerificarAsync(
                    contexto.Request,
                    ct
                );

                if (usuario == null)
                {
                    contexto.Response = contexto.Request.CreateResponse(
                        HttpStatusCode.Unauthorized,
                        new
                        {
                            message = "Tu sesión venció. Volvé a iniciar sesión."
                        }
                    );

                    return;
                }

                SesionSegura.Establecer(contexto, usuario);

                var accion = contexto.ActionDescriptor.ActionName;

                var accionesPropias = new[]
                {
                    "Acceso",
                    "MenusPermitidos",
                    "CambiarContrasena"
                };

                if (modulo == "usuarios"
                    && accionesPropias.Contains(accion))
                {
                    return;
                }

                using (var db = SeguridadSql.Abrir())
                {
                    string[] permisos;

                    if (modulo == "grupos")
                    {
                        permisos = new[]
                        {
                            "Grupos y permisos"
                        };
                    }
                    else if (contexto.Request.Method == HttpMethod.Get)
                    {
                        permisos = new[]
                        {
                            "Gestión de usuarios",
                            "Listado de usuarios"
                        };
                    }
                    else
                    {
                        permisos = new[]
                        {
                            "Gestión de usuarios"
                        };
                    }

                    var menus = PermisosAdministracion.Menus(
                        db,
                        usuario
                    );

                    if (!PermisosAdministracion.Tiene(
                        usuario,
                        menus,
                        permisos))
                    {
                        contexto.Response = contexto.Request.CreateResponse(
                            HttpStatusCode.Forbidden,
                            new
                            {
                                message = "No tenés permiso para realizar esta acción."
                            }
                        );
                    }
                }
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch
            {
                contexto.Response = contexto.Request.CreateResponse(
                    HttpStatusCode.ServiceUnavailable,
                    new
                    {
                        message = "No se pudo verificar el acceso. Probá de nuevo."
                    }
                );
            }
        }
    }

    public abstract class ControladorAdministracion : ApiController
    {
        protected UsuarioAcceso Operador
        {
            get
            {
                return SesionSegura.Usuario(Request);
            }
        }

        // El modelo limita Usu_Alta y Usu_Modi a 20 caracteres.
        protected string UsuarioRegistro
        {
            get
            {
                return Operador.Nombre_Usuario.Substring(
                    0,
                    Math.Min(20, Operador.Nombre_Usuario.Length)
                );
            }
        }

        protected IHttpActionResult Error(
            HttpStatusCode estado,
            string mensaje,
            string codigo = null)
        {
            return Content(
                estado,
                new
                {
                    message = mensaje,
                    code = codigo
                }
            );
        }

        protected IHttpActionResult Ejecutar(
            Func<SGTLAuditContext, IHttpActionResult> accion)
        {
            if (!ModelState.IsValid)
            {
                return Error(
                    HttpStatusCode.BadRequest,
                    "Revisá los datos enviados."
                );
            }

            try
            {
                using (var db = SeguridadSql.Abrir())
                {
                    db.UsuarioAuditoria = Operador.Nombre_Usuario;

                    return accion(db);
                }
            }
            catch (Exception ex)
            {
                var sql = ex as SqlException;

                for (
                    var causa = ex.InnerException;
                    sql == null && causa != null;
                    causa = causa.InnerException)
                {
                    sql = causa as SqlException;
                }

                if (sql != null
                    && (sql.Number == 2601 || sql.Number == 2627))
                {
                    if (sql.Message.IndexOf(
                        "UX_USUARIOS_NombreUsuario",
                        StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        return Error(
                            HttpStatusCode.Conflict,
                            "Ya existe un usuario con ese nombre de usuario.",
                            "usuario_duplicado"
                        );
                    }

                    return Error(
                        HttpStatusCode.Conflict,
                        "Ese dato ya está registrado. Actualizá la lista y revisá los datos."
                    );
                }

                if (sql != null && sql.Number == 1205)
                {
                    return Error(
                        HttpStatusCode.Conflict,
                        "Hubo otro cambio al mismo tiempo. Actualizá la lista y probá de nuevo."
                    );
                }

                if (sql != null && sql.Number == 547)
                {
                    return Error(
                        HttpStatusCode.Conflict,
                        "Hay datos relacionados que impiden eliminar el registro. Podés inactivarlo cuando corresponda."
                    );
                }

                return Error(
                    HttpStatusCode.InternalServerError,
                    "No se pudo completar la operación. Probá de nuevo."
                );
            }
        }

        protected void Auditar(
            string entidad,
            string accion,
            int id,
            object valoresAnteriores = null,
            object valoresNuevos = null)
        {
            var clave = entidad == "USUARIOS"
                ? "Usuario_ID=" + id
                : "Grupo_ID=" + id;

            SGTLAuditContext.RegistrarEvento(
                ConnectionStringHelper.GetConnectionString("SGTLEntities"),
                Operador.Nombre_Usuario,
                accion,
                entidad,
                clave,
                detalle: valoresNuevos == null
                    ? null
                    : JsonConvert.SerializeObject(valoresNuevos),
                valoresAnteriores: valoresAnteriores == null
                    ? null
                    : JsonConvert.SerializeObject(valoresAnteriores)
            );
        }
    }
}