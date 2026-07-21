using System;

using System.Collections.Generic;

using System.Data.Entity;

using System.Data.Entity.Infrastructure;

using System.Data.Entity.Validation;

using System.Linq;

using System.Net;

using System.Web.Http;



namespace WebApi_TransporteSanchez.Controllers

{

    [RoutePrefix("api/Grupos")]

    public class GruposController : ApiController

    {

        public class GruposDto

        {

            public int Grupo_ID { get; set; }

            public string Grupo_Nombre { get; set; }

        }



        public class MenuAsignacionDto

        {

            public int Menu_ID { get; set; }

            public string Menu_Nombre { get; set; }

            public bool Asignado { get; set; }

        }



        public class UsuarioAsignacionDto

        {

            public int Usuario_ID { get; set; }

            public string Nombre_Usuario { get; set; }

            public string NombreCompleto { get; set; }

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

                using (var db = new DbContext(connectionString))

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

                using (var db = new DbContext(connectionString))

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

                using (var db = new DbContext(connectionString))

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

                using (var db = new DbContext(connectionString))

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

                using (var db = new DbContext(connectionString))

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

                using (var db = new DbContext(connectionString))

                {

                    if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id))

                    {

                        return NotFound();

                    }


                    var menus = db.Set<MENU>()

                        .OrderBy(m => m.Menu_Nombre)

                        .Select(m => new MenuAsignacionDto

                        {

                            Menu_ID = m.Menu_ID,

                            Menu_Nombre = m.Menu_Nombre,

                            Asignado = db.Set<GRUPOS_MENU>().Any(gm => gm.GrupoID == id && gm.MenuID == m.Menu_ID)

                        })

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

                using (var db = new DbContext(connectionString))

                {

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

                using (var db = new DbContext(connectionString))

                {

                    if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id))

                    {

                        return NotFound();

                    }



                    var usuarios = db.Set<USUARIOS>()

                        .OrderBy(u => u.Nombre_Usuario)

                        .Select(u => new UsuarioAsignacionDto

                        {

                            Usuario_ID = u.Usuario_ID,

                            Nombre_Usuario = u.Nombre_Usuario,

                            NombreCompleto = (u.Nombre ?? "") + " " + (u.Apellido ?? ""),

                            Asignado = db.Set<GRUPOS_USUARIOS>().Any(gu => gu.GrupoID == id && gu.UsuarioID == u.Usuario_ID)

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

                using (var db = new DbContext(connectionString))

                {

                    if (!db.Set<GRUPOS>().Any(g => g.Grupo_ID == id))

                    {

                        return NotFound();

                    }



                    var ids = (value?.UsuarioIds ?? new List<int>()).Distinct().ToList();

                    var actuales = db.Set<GRUPOS_USUARIOS>().Where(x => x.GrupoID == id).ToList();

                    if (actuales.Any())

                    {

                        db.Set<GRUPOS_USUARIOS>().RemoveRange(actuales);

                    }



                    foreach (var usuarioId in ids)

                    {

                        db.Set<GRUPOS_USUARIOS>().Add(new GRUPOS_USUARIOS

                        {

                            GrupoID = id,

                            UsuarioID = usuarioId

                        });

                    }



                    db.SaveChanges();

                    return Ok(new { message = "Usuarios del grupo guardados correctamente." });

                }

            }

            catch (Exception ex)

            {

                return InternalServerError(ex);

            }

        }



    }

}

