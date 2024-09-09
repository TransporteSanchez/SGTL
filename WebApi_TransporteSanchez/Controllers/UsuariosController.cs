using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    public class UsuariosController : ApiController
    {

        public class UsuariosDto
        {
            public int Usuario_ID { get; set; }
            public string Nombre { get; set; }
            public string Apellido { get; set; }
            public string Nombre_Usuario { get; set; }
            public string Contraseña { get; set; }
            public DateTime Fecha_Alta { get; set; }
        }

        // GET: api/Usuarios
        public List<UsuariosDto> Get()
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                var usuarios = db.USUARIOS.Select(u => new UsuariosDto
                {
                    Usuario_ID = u.Usuario_ID,
                    Nombre = u.Nombre,
                    Apellido = u.Apellido,
                    Nombre_Usuario = u.Nombre_Usuario,
                    Contraseña = u.Contraseña,
                    Fecha_Alta = u.Fecha_Alta
                }).ToList();

                return usuarios;
            }
        }

        // GET: api/Usuarios/{id}
        public string Get(int id)
        {
            return "value";
        }

        // POST: api/Usuarios
        public void Post([FromBody]string value)
        {
        }

        // PUT: api/Usuarios/{id}
        public void Put(int id, [FromBody] USUARIOS value)
        {
            using (SGTLEntities db = new SGTLEntities())
            {
                USUARIOS oitem = db.USUARIOS.Find(id);

                oitem.Nombre = value.Nombre;
                oitem.Apellido = value.Apellido;
                oitem.Nombre_Usuario = value.Nombre_Usuario;
                oitem.Contraseña = value.Contraseña;
                oitem.Fecha_Alta = value.Fecha_Alta;

                db.Entry(oitem).State = System.Data.Entity.EntityState.Modified;
                db.SaveChanges();
            }
        }


        // DELETE: api/Usuarios/{id}
        public IHttpActionResult Delete(int id)
        {
            try
            {
                using (SGTLEntities db = new SGTLEntities())
                {
                    // Buscar el Usuario por ID
                    USUARIOS oitem = db.USUARIOS.Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el USUARIO con el ID especificado
                    }

                    //Eliminar el USUARIO encontrado
                    db.USUARIOS.Remove(oitem);
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
