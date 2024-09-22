using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;


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
            public DateTime FechaCompra { get; set; }
            public DateTime FechaITV { get; set; }
            public string EquipoFrio { get; set; }
        }

        // GET: api/Camiones/
        public List<CamionDTO> Get()
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                var camiones = db.CAMIONES.Select(c => new CamionDTO
                {
                    Camion_ID = c.Camion_ID,
                    Dominio = c.Dominio,
                    Marca = c.Marca,
                    Modelo = c.Modelo,
                    AñoModelo = c.AñoModelo,
                    Tipo = c.Tipo,
                    NumMotor = c.NumMotor,
                    NumChasis = c.NumChasis,
                    FechaCompra = c.FechaCompra,
                    FechaITV = c.FechaITV,
                    EquipoFrio = c.EquipoFrio
                }).ToList();

                return camiones;
            }
        }

        // GET: api/Camiones/Buscar
        [HttpGet]
        [Route("api/Camiones/Buscar")]
        public IHttpActionResult Buscar(string dominio = null, int page = 1, int pageSize = 6)
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                var query = db.CAMIONES.AsQueryable();

                if (!string.IsNullOrEmpty(dominio))
                {
                    query = query.Where(c => c.Dominio.Contains(dominio));
                }

                var totalRecords = query.Count();
                var results = query
                    .OrderBy(c => c.Camion_ID)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(c => new
                    {
                        Camion_ID = c.Camion_ID,
                        Dominio = c.Dominio.Trim(), // Trim para eliminar espacios en blanco
                        Marca = c.Marca,
                        Modelo = c.Modelo,
                        AñoModelo = c.AñoModelo,
                        Tipo = c.Tipo,
                        NumMotor = c.NumMotor,
                        NumChasis = c.NumChasis,
                        FechaCompra = c.FechaCompra,
                        FechaITV = c.FechaITV,
                        EquipoFrio = c.EquipoFrio
                    })
                    .ToList();

                return Ok(new
                {
                    TotalRecords = totalRecords,
                    Results = results
                });
            }
        }


        // GET: api/Camiones/{id}
        public IHttpActionResult Get(int id)
        {
            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    var camion = db.CAMIONES.Find(id);

                    if (camion == null)
                    {
                        return NotFound();
                    }

                    var camionDto = new CamionDTO
                    {
                        Camion_ID = camion.Camion_ID,
                        Dominio = camion.Dominio.Trim(), // Trim para eliminar espacios en blanco
                        Marca = camion.Marca,
                        Modelo = camion.Modelo,
                        AñoModelo = camion.AñoModelo,
                        Tipo = camion.Tipo,
                        NumMotor = camion.NumMotor,
                        NumChasis = camion.NumChasis,
                        FechaCompra = camion.FechaCompra,
                        FechaITV = camion.FechaITV,
                        EquipoFrio = camion.EquipoFrio
                    };

                    return Ok(camionDto);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Camiones/{camionID}/Chofer_Camion

        [HttpGet]
        [Route("api/Camiones/{camionID}/Chofer_Camion")]
        public IHttpActionResult GetChoferesByCamion(int camionID)
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                var choferes = from cc in db.CHOFER_CAMION
                               join c in db.CHOFERES on cc.ChoferID equals c.Chofer_ID
                               where cc.CamionID == camionID
                               select new
                               {
                                   c.Chofer_ID,
                                   c.Nombre,
                                   c.Apellido,
                                   c.DNI
                               };

                return Ok(choferes.ToList());

            }
        }


        // POST: api/Camiones
        public IHttpActionResult Post([FromBody] CamionDTO camionDto)
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
                    var camion = new CAMIONES
                    {
                        Camion_ID = camionDto.Camion_ID,
                        Dominio = camionDto.Dominio.Trim(), // Trim para eliminar espacios en blanco
                        Marca = camionDto.Marca,
                        Modelo = camionDto.Modelo,
                        AñoModelo = camionDto.AñoModelo,
                        Tipo = camionDto.Tipo,
                        NumMotor = camionDto.NumMotor,
                        NumChasis = camionDto.NumChasis,
                        FechaCompra = camionDto.FechaCompra,
                        FechaITV = camionDto.FechaITV,
                        EquipoFrio = camionDto.EquipoFrio
                    };

                    // Agregar la entidad al contexto y guardar cambios
                    db.CAMIONES.Add(camion);
                    db.SaveChanges();

                    return Ok(); // Retorna 200 OK si la inserción fue exitosa
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }

        // PUT: api/Camiones/{id}
        public void Put(int id, [FromBody] CAMIONES value)
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                CAMIONES oitem = db.CAMIONES.Find(id);

                oitem.Dominio = value.Dominio;
                oitem.Marca = value.Marca;
                oitem.Modelo = value.Modelo;
                oitem.AñoModelo = value.AñoModelo;
                oitem.Tipo = value.Tipo;
                oitem.NumMotor = value.NumMotor;
                oitem.NumChasis = value.NumChasis;
                oitem.FechaCompra = value.FechaCompra;
                oitem.FechaITV = value.FechaITV;
                oitem.EquipoFrio = value.EquipoFrio;

                db.Entry(oitem).State = System.Data.Entity.EntityState.Modified;
                db.SaveChanges();
            }
        }

        // DELETE: api/Camiones/5
        public void Delete(int id)
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                CAMIONES oitem = db.CAMIONES.Find(id);

                db.CAMIONES.Remove(oitem);
                db.SaveChanges();
            }
        }
    }
}
