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
    public class ClientesController : ApiController
    {
        public class Cliente
        {
            public int Cliente_ID { get; set; }
            public string Razon_Social { get; set; }
            public string CUIT_Cliente { get; set; }
            public int Cond_Fiscal { get; set; }
            public int ProvID { get; set; }
            public int LocID { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
            public string Telefono { get; set; }
            public string Email { get; set; }

        }

        // GET: api/Clientes
        public IHttpActionResult Get()
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var olist = db.Set<CLIENTES>().Select(c => new Cliente
                    {
                        Cliente_ID = c.Cliente_ID,
                        Razon_Social = c.Razon_Social,
                        CUIT_Cliente = c.CUIT_Cliente,
                        Cond_Fiscal = c.Cond_Fiscal,
                        ProvID = c.ProvID,
                        LocID = c.LocID,
                        Calle = c.Calle,
                        AlturaCalle = c.AlturaCalle,
                        Telefono = c.Telefono,
                        Email = c.Email
                    }).ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound(); // Retorna 404 si no se encuentran registros
                    }

                    return Ok(olist); // Retorna 200 con la lista de clientes
                }
            }
            catch (DbUpdateException ex)
            {
                // Manejo de errores relacionados con la base de datos
                return InternalServerError(new Exception("Error al acceder a la base de datos.", ex)); // Retorna 500 en caso de error interno
            }
            catch (DbEntityValidationException ex)
            {
                // Manejo de errores de validación
                var validationErrors = new List<string>();

                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }

                return Content(HttpStatusCode.BadRequest, validationErrors); // Retorna 400 Bad Request con errores de validación
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }

        // GET: api/Clientes/{id}
        public IHttpActionResult Get(int id)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var cliente = db.Set<CLIENTES>().Find(id);

                    if (cliente == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el cliente con el ID especificado
                    }

                    var clienteDto = new Cliente
                    {
                        Cliente_ID = cliente.Cliente_ID,
                        Razon_Social = cliente.Razon_Social,
                        CUIT_Cliente = cliente.CUIT_Cliente,
                        Cond_Fiscal = cliente.Cond_Fiscal,
                        ProvID = cliente.ProvID,
                        LocID = cliente.LocID,
                        Calle = cliente.Calle,
                        AlturaCalle = cliente.AlturaCalle,
                        Telefono = cliente.Telefono,
                        Email = cliente.Email
                    };

                    return Ok(clienteDto); // Retorna 200 con los datos del cliente encontrado
                }
            }
            catch (DbUpdateException ex)
            {
                // Manejo de errores relacionados con la base de datos
                return InternalServerError(new Exception("Error al acceder a la base de datos.", ex)); // Retorna 500 en caso de error interno
            }
            catch (DbEntityValidationException ex)
            {
                // Manejo de errores de validación
                var validationErrors = new List<string>();

                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }

                return Content(HttpStatusCode.BadRequest, validationErrors); // Retorna 400 Bad Request con errores de validación
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }


        // POST: api/Clientes
        public IHttpActionResult Post([FromBody] Cliente clienteDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState); // Retorna 400 si el modelo no es válido
            }

            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    // Verifica si el Cliente ya existe
                    var clienteExistente = db.Set<CLIENTES>().FirstOrDefault(c => c.CUIT_Cliente == clienteDto.CUIT_Cliente);
                    if (clienteExistente != null)
                    {
                        return Content(HttpStatusCode.BadRequest, new
                        {
                            code = "cliente_duplicado",
                            message = "Ya existe un cliente registrado con este CUIT."
                        }); // Retorna 400 si el cliente ya existe con un código específico
                    }

                    // Crear una nueva entidad CLIENTES y asignar valores desde clienteDto
                    var cliente = new CLIENTES
                    {
                        Cliente_ID = clienteDto.Cliente_ID,
                        CUIT_Cliente = clienteDto.CUIT_Cliente,
                        Razon_Social = clienteDto.Razon_Social,
                        Cond_Fiscal = clienteDto.Cond_Fiscal,
                        ProvID = clienteDto.ProvID,
                        LocID = clienteDto.LocID,
                        Calle = clienteDto.Calle,
                        AlturaCalle = clienteDto.AlturaCalle,
                        Telefono = clienteDto.Telefono,
                        Email = clienteDto.Email
                    };

                    // Agregar la entidad al contexto y guardar cambios
                    db.Set<CLIENTES>().Add(cliente);
                    db.SaveChanges();

                    return Ok(); // Retorna 200 OK si la inserción fue exitosa
                }
            }
            catch (DbUpdateException ex)
            {
                // Manejo de errores relacionados con la base de datos
                return InternalServerError(new Exception("Error al acceder a la base de datos.", ex)); // Retorna 500 en caso de error interno
            }
            catch (DbEntityValidationException ex)
            {
                // Manejo de errores de validación
                var validationErrors = new List<string>();

                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }

                return Content(HttpStatusCode.BadRequest, validationErrors); // Retorna 400 Bad Request con errores de validación
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }


        // PUT: api/Clientes/{id}
        public IHttpActionResult Put(int id, [FromBody] CLIENTES value)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    CLIENTES oitem = db.Set<CLIENTES>().Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el cliente con el ID especificado
                    }

                    oitem.Cliente_ID = value.Cliente_ID;
                    oitem.Razon_Social = value.Razon_Social;
                    oitem.CUIT_Cliente = value.CUIT_Cliente;
                    oitem.Cond_Fiscal = value.Cond_Fiscal;
                    oitem.ProvID = value.ProvID;
                    oitem.LocID = value.LocID;
                    oitem.Calle = value.Calle;
                    oitem.AlturaCalle = value.AlturaCalle;
                    oitem.Telefono = value.Telefono;
                    oitem.Email = value.Email;

                    db.Entry(oitem).State = System.Data.Entity.EntityState.Modified;

                    try
                    {
                        db.SaveChanges();
                        return Ok("Cliente actualizado con éxito."); // Retorna 200 si la actualización fue exitosa
                    }
                    catch (DbEntityValidationException ex)
                    {
                        // Manejo de errores de validación
                        var validationErrors = new List<string>();

                        foreach (var validationResult in ex.EntityValidationErrors)
                        {
                            foreach (var error in validationResult.ValidationErrors)
                            {
                                validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                            }
                        }

                        return Content(HttpStatusCode.BadRequest, validationErrors); // Retorna 400 Bad Request con errores de validación
                    }
                    catch (DbUpdateException ex)
                    {
                        // Manejo de errores relacionados con la base de datos
                        return InternalServerError(new Exception("Error al acceder a la base de datos.", ex)); // Retorna 500 en caso de error interno
                    }
                }
            }
            catch (DbUpdateException ex)
            {
                // Manejo de errores relacionados con la base de datos
                return InternalServerError(new Exception("Error al acceder a la base de datos.", ex)); // Retorna 500 en caso de error interno
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }



        // DELETE: api/Clientes/{id}
        public IHttpActionResult Delete(int id)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new DbContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var cliente = db.Set<CLIENTES>().Find(id);
                    if (cliente == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el cliente con el ID especificado
                    }

                    db.Set<CLIENTES>().Remove(cliente);
                    db.SaveChanges();

                    return Ok("Cliente eliminado con éxito."); // Retorna 200 si la eliminación fue exitosa
                }
            }
            catch (DbUpdateException ex)
            {
                // Manejo de errores relacionados con la base de datos
                return InternalServerError(new Exception("Error al acceder a la base de datos.", ex)); // Retorna 500 en caso de error interno
            }
            catch (Exception ex)
            {
                return InternalServerError(ex); // Retorna 500 en caso de error interno
            }
        }


    }

}