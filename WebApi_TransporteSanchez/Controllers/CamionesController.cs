using System;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Web.Http;
using WebApi_TransporteSanchez.Security;

namespace WebApi_TransporteSanchez.Controllers
{
    public class CamionesController : ApiController
    {
        public class CamionDTO
        {
            public int Camion_ID { get; set; }
            public string Dominio { get; set; }
            public string Marca { get; set; }
            public string Modelo { get; set; }
            public string AñoModelo { get; set; }
            public string Tipo { get; set; }
            public string NumMotor { get; set; }
            public string NumChasis { get; set; }
            public string EstadoCamion { get; set; }
            public DateTime FechaCompra { get; set; }
            public DateTime FechaITV { get; set; }
            public string EquipoFrio { get; set; }
            public DateTime Fecha_Alta { get; set; }
            public string Usu_Alta { get; set; }
            public DateTime Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }
        }

        public sealed class CambioEstadoCamion
        {
            [Required]
            public string EstadoCamion { get; set; }

            [Required]
            public string EstadoAnterior { get; set; }
        }

        public IHttpActionResult Get()
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var camiones = db.Set<CAMIONES>()
                        .Where(c => c.EstadoCamion != "Eliminado")
                        .Select(c => new CamionDTO
                        {
                            Camion_ID = c.Camion_ID,
                            Dominio = c.Dominio,
                            Marca = c.Marca,
                            Modelo = c.Modelo,
                            AñoModelo = c.AñoModelo,
                            Tipo = c.Tipo,
                            NumMotor = c.NumMotor,
                            NumChasis = c.NumChasis,
                            EstadoCamion = c.EstadoCamion,
                            FechaCompra = c.FechaCompra,
                            FechaITV = c.FechaITV,
                            EquipoFrio = c.EquipoFrio,
                            Fecha_Alta = c.Fecha_Alta,
                            Usu_Alta = c.Usu_Alta,
                            Fecha_Modi = c.Fecha_Modi,
                            Usu_Modi = c.Usu_Modi,
                        }).ToList();

                    return Ok(camiones);
                }
            }
            catch
            {
                return InternalServerError();
            }
        }

        public IHttpActionResult Get(int id)
        {
            try
            {
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new SGTLAuditContext(connectionString))
                {
                    var camion = db.Set<CAMIONES>()
                        .Where(c => c.Camion_ID == id && c.EstadoCamion != "Eliminado")
                        .FirstOrDefault();

                    if (camion == null)
                    {
                        return NotFound();
                    }

                    var camionDto = new CamionDTO
                    {
                        Camion_ID = camion.Camion_ID,
                        Dominio = camion.Dominio.Trim(),
                        Marca = camion.Marca,
                        Modelo = camion.Modelo,
                        AñoModelo = camion.AñoModelo,
                        Tipo = camion.Tipo,
                        NumMotor = camion.NumMotor,
                        NumChasis = camion.NumChasis,
                        EstadoCamion = camion.EstadoCamion,
                        FechaCompra = camion.FechaCompra,
                        FechaITV = camion.FechaITV,
                        EquipoFrio = camion.EquipoFrio,
                        Fecha_Alta = camion.Fecha_Alta,
                        Usu_Alta = camion.Usu_Alta,
                        Fecha_Modi = camion.Fecha_Modi,
                        Usu_Modi = camion.Usu_Modi,
                    };

                    return Ok(camionDto);
                }
            }
            catch
            {
                return InternalServerError();
            }
        }

        [HttpGet]
        [Route("api/Camiones/{camionID}/Chofer_Camion")]
        public IHttpActionResult GetChoferesByCamion(int camionID)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var choferes = from cc in db.Set<CHOFER_CAMION>()
                                   join c in db.Set<CHOFERES>() on cc.ChoferID equals c.Chofer_ID
                                   join cam in db.Set<CAMIONES>() on cc.CamionID equals cam.Camion_ID
                                   where cc.CamionID == camionID && cam.EstadoCamion != "Eliminado"
                                   select new
                                   {
                                       c.Chofer_ID,
                                       c.Nombre,
                                       c.Apellido,
                                       c.DNI
                                   };

                    var choferesList = choferes.ToList();

                    return Ok(choferesList);
                }
            }
            catch
            {
                return InternalServerError();
            }
        }

        private static readonly string[] TiposCamion =
        {
            "Furgón",
            "Balancín (3 ejes)",
            "Chasis (2 ejes)",
            "Liviano"
        };

        private IHttpActionResult ValidarCamion(CamionDTO camionDto)
        {
            if (camionDto == null || !ModelState.IsValid ||
                string.IsNullOrWhiteSpace(camionDto.Dominio))
            {
                return BadRequest("Completá los datos del camión.");
            }

            var tipo = (camionDto.Tipo ?? "").Trim();

            if (!TiposCamion.Contains(tipo))
            {
                return BadRequest(
                    "Elegí un tipo de camión válido: Furgón, Balancín (3 ejes), Chasis (2 ejes) o Liviano.");
            }

            camionDto.Tipo = tipo;
            camionDto.Dominio = camionDto.Dominio.Trim().ToUpperInvariant();
            return null;
        }

        private static bool DominioRepetido(SGTLAuditContext db, string dominio, int id)
        {
            return db.Database.SqlQuery<int>(@"
                SELECT TOP (1) Camion_ID
                FROM dbo.CAMIONES WITH (UPDLOCK, HOLDLOCK)
                WHERE EstadoCamion <> 'Eliminado'
                  AND Camion_ID <> @id
                  AND UPPER(LTRIM(RTRIM(Dominio))) = @dominio",
                new SqlParameter("@id", SqlDbType.Int) { Value = id },
                new SqlParameter("@dominio", SqlDbType.NVarChar, 10) { Value = dominio }
            ).Any();
        }

        private IHttpActionResult ValidarGestion(SGTLAuditContext db)
        {
            var usuario = SesionSegura.Usuario(Request);
            if (usuario == null)
                return Unauthorized();

            var menus = PermisosAdministracion.Menus(db, usuario);

            if (!PermisosAdministracion.Tiene(usuario, menus, "Gestión de camiones"))
            {
                return Content(HttpStatusCode.Forbidden, new
                {
                    Message = "No tenés permiso para gestionar camiones."
                });
            }

            db.UsuarioAuditoria = usuario.Nombre_Usuario;
            return null;
        }

        [FiltroSesionSegura]
        public IHttpActionResult Post([FromBody] CamionDTO camionDto)
        {
            var validacion = ValidarCamion(camionDto);
            if (validacion != null)
                return validacion;

            try
            {
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new SGTLAuditContext(connectionString))
                {
                    var acceso = ValidarGestion(db);
                    if (acceso != null)
                        return acceso;

                    using (var transaccion = db.Database.BeginTransaction(IsolationLevel.Serializable))
                    {
                        if (DominioRepetido(db, camionDto.Dominio, 0))
                        {
                            return Content(HttpStatusCode.Conflict, new
                            {
                                Message = "Ya hay otro camión registrado con ese dominio."
                            });
                        }

                        var usuario = db.UsuarioAuditoria;
                        usuario = usuario.Length > 20 ? usuario.Substring(0, 20) : usuario;
                        var ahora = DateTime.UtcNow;

                        var camion = new CAMIONES
                        {
                            Camion_ID = camionDto.Camion_ID,
                            Dominio = camionDto.Dominio,
                            Marca = camionDto.Marca,
                            Modelo = camionDto.Modelo,
                            AñoModelo = camionDto.AñoModelo,
                            Tipo = camionDto.Tipo,
                            NumMotor = camionDto.NumMotor,
                            NumChasis = camionDto.NumChasis,
                            FechaCompra = camionDto.FechaCompra,
                            FechaITV = camionDto.FechaITV,
                            EquipoFrio = camionDto.EquipoFrio,
                            EstadoCamion = "Activo",
                            Fecha_Alta = ahora,
                            Usu_Alta = usuario,
                            Fecha_Modi = ahora,
                            Usu_Modi = usuario
                        };

                        db.Set<CAMIONES>().Add(camion);
                        db.SaveChanges();
                        transaccion.Commit();

                        return Ok();
                    }
                }
            }
            catch (DbEntityValidationException)
            {
                return BadRequest("Revisá los datos del camión y probá de nuevo.");
            }
            catch
            {
                return InternalServerError();
            }
        }

        [FiltroSesionSegura]
        public IHttpActionResult Put(int id, [FromBody] CamionDTO camionDto)
        {
            if (id <= 0)
                return BadRequest("Indicá un camión válido.");

            var validacion = ValidarCamion(camionDto);
            if (validacion != null)
                return validacion;

            try
            {
                string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

                using (var db = new SGTLAuditContext(connectionString))
                {
                    var acceso = ValidarGestion(db);
                    if (acceso != null)
                        return acceso;

                    using (var transaccion = db.Database.BeginTransaction(IsolationLevel.Serializable))
                    {
                        var camion = db.Set<CAMIONES>().Find(id);
                        if (camion == null)
                            return NotFound();

                        if (camion.EstadoCamion == "Eliminado")
                            return BadRequest("No se puede editar un camión eliminado.");

                        if (DominioRepetido(db, camionDto.Dominio, id))
                        {
                            return Content(HttpStatusCode.Conflict, new
                            {
                                Message = "Ya hay otro camión registrado con ese dominio."
                            });
                        }

                        var usuario = db.UsuarioAuditoria;
                        usuario = usuario.Length > 20 ? usuario.Substring(0, 20) : usuario;

                        camion.Dominio = camionDto.Dominio;
                        camion.Marca = camionDto.Marca;
                        camion.Modelo = camionDto.Modelo;
                        camion.AñoModelo = camionDto.AñoModelo;
                        camion.Tipo = camionDto.Tipo;
                        camion.NumMotor = camionDto.NumMotor;
                        camion.NumChasis = camionDto.NumChasis;
                        camion.FechaCompra = camionDto.FechaCompra;
                        camion.FechaITV = camionDto.FechaITV;
                        camion.EquipoFrio = camionDto.EquipoFrio;
                        camion.Fecha_Modi = DateTime.UtcNow;
                        camion.Usu_Modi = usuario;

                        db.SaveChanges();
                        transaccion.Commit();

                        return Ok();
                    }
                }
            }
            catch (DbEntityValidationException)
            {
                return BadRequest("Revisá los datos del camión y probá de nuevo.");
            }
            catch (DbUpdateConcurrencyException)
            {
                return Content(HttpStatusCode.Conflict, new
                {
                    Message = "Los datos cambiaron. Volvé a buscar y probá de nuevo."
                });
            }
            catch
            {
                return InternalServerError();
            }
        }

        [HttpPut]
        [Route("api/Camiones/Eliminar/{id}")]
        [FiltroSesionSegura]
        public IHttpActionResult EliminarCamion(int id)
        {
            if (id <= 0)
            {
                return BadRequest(
                    "Revisá los datos del camión que querés eliminar.");
            }

            try
            {
                using (var db = new SGTLAuditContext(
                    ConnectionStringHelper.GetConnectionString("SGTLEntities")))
                {
                    var acceso = ValidarGestion(db);

                    if (acceso != null)
                    {
                        return acceso;
                    }

                    using (var tx = db.Database.BeginTransaction(
                        IsolationLevel.Serializable))
                    {
                        var existe = db.Database.SqlQuery<int>(
                            "SELECT Camion_ID FROM dbo.CAMIONES WITH (UPDLOCK, HOLDLOCK) WHERE Camion_ID = @id",
                            new SqlParameter("@id", SqlDbType.Int)
                            {
                                Value = id
                            }).Any();

                        if (!existe)
                        {
                            return NotFound();
                        }

                        var camion = db.Set<CAMIONES>().Find(id);

                        if (camion.EstadoCamion == "Eliminado")
                        {
                            return NotFound();
                        }

                        if (camion.EstadoCamion != "Inactivo")
                        {
                            return Content(HttpStatusCode.Conflict, new
                            {
                                Message = "El camión tiene que estar inactivo para eliminarlo."
                            });
                        }

                        camion.EstadoCamion = "Eliminado";
                        camion.Fecha_Modi = DateTime.UtcNow;

                        var nombre = db.UsuarioAuditoria;
                        camion.Usu_Modi = nombre.Length > 20
                            ? nombre.Substring(0, 20)
                            : nombre;

                        db.Configuration.ValidateOnSaveEnabled = false;
                        db.SaveChanges();
                        tx.Commit();

                        return Ok("El camión fue eliminado correctamente.");
                    }
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                return Content(HttpStatusCode.Conflict, new
                {
                    Message = "Los datos cambiaron. Volvé a buscar y probá de nuevo."
                });
            }
            catch
            {
                return InternalServerError();
            }
        }

        [HttpPut]
        [Route("api/Camiones/EstadoCamion/{id:int}")]
        [FiltroSesionSegura]
        public IHttpActionResult CambiarEstadoCamion(
            int id,
            [FromBody] CambioEstadoCamion entrada)
        {
            var estados = new[] { "Activo", "Inactivo" };

            if (id <= 0 || entrada == null || !ModelState.IsValid ||
                !estados.Contains(entrada.EstadoCamion) ||
                !estados.Contains(entrada.EstadoAnterior))
            {
                return BadRequest("Indicá un estado válido para el camión.");
            }

            var usuario = SesionSegura.Usuario(Request);

            if (usuario == null)
            {
                return Unauthorized();
            }

            try
            {
                using (var db = new SGTLAuditContext(
                    ConnectionStringHelper.GetConnectionString("SGTLEntities")))
                {
                    var acceso = ValidarGestion(db);

                    if (acceso != null)
                    {
                        return acceso;
                    }

                    using (var tx = db.Database.BeginTransaction(
                        IsolationLevel.Serializable))
                    {
                        var existe = db.Database.SqlQuery<int>(
                            "SELECT Camion_ID FROM dbo.CAMIONES WITH (UPDLOCK, HOLDLOCK) WHERE Camion_ID = @id",
                            new SqlParameter("@id", SqlDbType.Int)
                            {
                                Value = id
                            }).Any();

                        if (!existe)
                        {
                            return NotFound();
                        }

                        var camion = db.Set<CAMIONES>().Find(id);

                        if (camion.EstadoCamion != entrada.EstadoAnterior)
                        {
                            return Content(HttpStatusCode.Conflict, new
                            {
                                Message = "El estado cambió. Volvé a buscar y revisá el camión."
                            });
                        }

                        camion.EstadoCamion = entrada.EstadoCamion;
                        camion.Fecha_Modi = DateTime.UtcNow;

                        var nombre = usuario.Nombre_Usuario;

                        camion.Usu_Modi = nombre.Length > 20
                            ? nombre.Substring(0, 20)
                            : nombre;

                        db.UsuarioAuditoria = nombre;
                        db.SaveChanges();
                        tx.Commit();

                        return Ok(new
                        {
                            camion.Camion_ID,
                            camion.EstadoCamion
                        });
                    }
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                return Content(HttpStatusCode.Conflict, new
                {
                    Message = "Los datos cambiaron. Volvé a buscar y probá de nuevo."
                });
            }
            catch
            {
                return InternalServerError();
            }
        }
    }
}