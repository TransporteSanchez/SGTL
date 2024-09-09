using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class GruposController : ApiController
    {

        public class GruposDto
        {
            public int Grupo_ID { get; set; }
            public string Grupo_Nombre { get; set; }

        }

        // GET: api/Usuarios
        public List<GruposDto> Get()
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                var grupos = db.GRUPOS.Select(u => new GruposDto
                {
                    Grupo_ID = u.Grupo_ID,
                    Grupo_Nombre = u.Grupo_Nombre,
                }).ToList();

                return grupos;
            }
        }

        // GET: api/Usuarios/5
        public string Get(int id)
        {
            return "value";
        }

        // POST: api/Usuarios
        public void Post([FromBody] string value)
        {
        }

        // PUT: api/Usuarios/5
        public void Put(int id, [FromBody] GRUPOS value)
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                GRUPOS oitem = db.GRUPOS.Find(id);

                oitem.Grupo_Nombre = value.Grupo_Nombre;

                db.Entry(oitem).State = System.Data.Entity.EntityState.Modified;
                db.SaveChanges();
            }
        }


        // DELETE: api/Usuarios/5
        public IHttpActionResult Delete(int id)
        {
            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    // Buscar el Grupo por ID
                    GRUPOS oitem = db.GRUPOS.Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el GRUPO con el ID especificado
                    }

                    //Eliminar el GRUPO encontrado
                    db.GRUPOS.Remove(oitem);
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
