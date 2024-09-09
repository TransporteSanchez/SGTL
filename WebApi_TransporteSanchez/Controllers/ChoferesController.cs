using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

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

        }

        // GET: api/Choferes
        public IHttpActionResult Get()
        {
            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    var olist = db.CHOFERES.Select(c => new ChoferDto
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
                        AlturaCalle = c.AlturaCalle,
                        EstadoChofer = c.EstadoChofer
                    }).ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound();
                    }

                    return Ok(olist);
                }
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
                using (SGTLEntities db = new SGTLEntities())
                {
                    var chofer = db.CHOFERES.Find(id);

                    if (chofer == null)
                    {
                        return NotFound();
                    }

                    var choferDto = new ChoferDto
                    {
                        Chofer_ID = chofer.Chofer_ID,
                        DNI = chofer.DNI,
                        CUIL = chofer.CUIL,
                        Nombre = chofer.Nombre,
                        Apellido = chofer.Apellido,
                        TelefonoFijo = chofer.TelefonoFijo,
                        TelefonoCelular = chofer.TelefonoCelular,
                        Email = chofer.Email,
                        ProvID = chofer.ProvID,
                        LocID = chofer.LocID,
                        Calle = chofer.Calle,
                        AlturaCalle = chofer.AlturaCalle,
                        EstadoChofer = chofer.EstadoChofer
                    };

                    return Ok(choferDto);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Choferes/Buscar

        [HttpGet]
        [Route("api/Choferes/Buscar")]
        public IHttpActionResult Buscar(string nombre = null, string apellido = null, string dni = null, string estadoChofer = null, int page = 1, int pageSize = 8)
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                var query = db.CHOFERES.AsQueryable();

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

                if (!string.IsNullOrEmpty(estadoChofer))
                {
                    var estados = estadoChofer.Split(',');
                    query = query.Where(c => estados.Contains(c.EstadoChofer));
                }

                var totalRecords = query.Count();
                var results = query
                    .OrderBy(c => c.Nombre)
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
                        AlturaCalle = c.AlturaCalle,
                        EstadoChofer = c.EstadoChofer
                    })
                    .ToList();

                return Ok(new
                {
                    TotalRecords = totalRecords,
                    Results = results
                });
            }
        }

        // GET: api/Choferes/{choferID}/Chofer_Camion

        [HttpGet]
        [Route("api/Choferes/{choferID}/Chofer_Camion")]
        public IHttpActionResult GetChoferesByCamion(int choferID)
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                var camiones = from cc in db.CHOFER_CAMION
                               join c in db.CAMIONES on cc.CamionID equals c.Camion_ID
                               where cc.ChoferID == choferID
                               select new
                               {
                                   c.Camion_ID,
                                   c.Dominio,
                                   cc.Cedula,
                               };

                return Ok(camiones.ToList());

            }
        }


        // PUT: api/Choferes/EstadoChofer/{id}

        [HttpPut]
        [Route("api/Choferes/EstadoChofer/{id}")]
        public IHttpActionResult PutEstadoChofer(int id, [FromBody] EstadoChoferUpdateModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState); // Retorna 400 si el modelo no es válido
            }

            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    // Buscar la entidad CHOFERES por id
                    var chofer = db.CHOFERES.Find(id);

                    if (chofer == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el chofer con el id especificado
                    }

                    // Actualizar solo el campo EstadoChofer
                    chofer.EstadoChofer = model.EstadoChofer;

                    // Deshabilitar validaciones automáticas para otras propiedades
                    db.Configuration.ValidateOnSaveEnabled = false;

                    // Guardar cambios en la base de datos
                    db.SaveChanges();

                    return Ok(); // Retorna 200 OK si la actualización fue exitosa
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }



        // Modelo para la actualización de EstadoChofer
        public class EstadoChoferUpdateModel
        {
            [Required]
            public string EstadoChofer { get; set; }
        }

        // POST: api/Choferes
        public IHttpActionResult Post([FromBody] ChoferDto choferDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState); // Retorna 400 si el modelo no es válido
            }

            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    // Crear una nueva entidad CHOFERES y asignar valores desde ChoferDto
                    var chofer = new CHOFERES
                    {
                        DNI = choferDto.DNI,
                        CUIL = choferDto.CUIL,
                        Nombre = choferDto.Nombre,
                        Apellido = choferDto.Apellido,
                        TelefonoFijo = choferDto.TelefonoFijo,
                        TelefonoCelular = choferDto.TelefonoCelular,
                        Email = choferDto.Email,
                        ProvID = choferDto.ProvID,
                        LocID = choferDto.LocID,
                        Calle = choferDto.Calle,
                        AlturaCalle = choferDto.AlturaCalle,
                        EstadoChofer = choferDto.EstadoChofer
                    };

                    // Agregar la entidad al contexto y guardar cambios
                    db.CHOFERES.Add(chofer);
                    db.SaveChanges();

                    return Ok(); // Retorna 200 OK si la inserción fue exitosa
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }


        // PUT: api/Choferes/{id}
        public void Put(int id, [FromBody] CHOFERES value)
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                CHOFERES oitem = db.CHOFERES.Find(id);

                oitem.DNI = value.DNI;
                oitem.CUIL = value.CUIL;
                oitem.Nombre = value.Nombre;
                oitem.Apellido = value.Apellido;
                oitem.TelefonoFijo = value.TelefonoFijo;
                oitem.TelefonoCelular = value.TelefonoCelular;
                oitem.Email = value.Email;
                oitem.ProvID = value.ProvID;
                oitem.LocID = value.LocID;
                oitem.Calle = value.Calle;
                oitem.AlturaCalle = value.AlturaCalle;

                db.Entry(oitem).State = System.Data.Entity.EntityState.Modified;
                db.SaveChanges();
            }
        }

        // DELETE: api/Choferes/{id}
        public IHttpActionResult Delete(int id)
        {
            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    // Buscar el chofer por ID
                    CHOFERES oitem = db.CHOFERES.Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el chofer con el ID especificado
                    }

                    // Eliminar el chofer encontrado
                    db.CHOFERES.Remove(oitem);
                    db.SaveChanges();

                    return Ok(); // Retorna 200 OK si la eliminación fue exitosa
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }

    }

}
