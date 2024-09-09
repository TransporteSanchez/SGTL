using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class MenuController : ApiController
    {

        public class MenuDto
        {
            public int Menu_ID { get; set; }
            public string Menu_Nombre { get; set; }

        }

        // GET: api/MENU
        public List<MenuDto> Get()
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                var menu = db.MENU.Select(u => new MenuDto
                {
                    Menu_ID = u.Menu_ID,
                    Menu_Nombre = u.Menu_Nombre,
                }).ToList();

                return menu;
            }
        }

        // GET: api/MENU/5
        public string Get(int id)
        {
            return "value";
        }

        // POST: api/MENU
        public void Post([FromBody] string value)
        {
        }

        // PUT: api/MENU/5
        public void Put(int id, [FromBody] MENU value)
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                MENU oitem = db.MENU.Find(id);

                oitem.Menu_Nombre = value.Menu_Nombre;

                db.Entry(oitem).State = System.Data.Entity.EntityState.Modified;
                db.SaveChanges();
            }
        }


        // DELETE: api/MENU/5
        public IHttpActionResult Delete(int id)
        {
            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    // Buscar el MENU por ID
                    MENU oitem = db.MENU.Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el MENU con el ID especificado
                    }

                    //Eliminar el MENU encontrado
                    db.MENU.Remove(oitem);
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
