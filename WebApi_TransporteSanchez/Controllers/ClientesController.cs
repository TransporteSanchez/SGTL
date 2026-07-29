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
            public System.DateTime Fecha_Alta { get; set; }
            public string Usu_Alta { get; set; }
            public System.DateTime Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }

        }

        private string NormalizarCUIT(string cuit)
        {
            if (string.IsNullOrWhiteSpace(cuit)) return string.Empty;
            // Quitar guiones y cualquier caracter no numérico.
            return new string(cuit.Where(char.IsDigit).ToArray());
        }

        // GET: api/Clientes/Buscar
        [HttpGet]
        [Route("api/Clientes/Buscar")]
        public IHttpActionResult Buscar(string dni = null, string cuit = null, string razonSocial = null, string estadoCliente = null, DateTime? fechaDesde = null, DateTime? fechaHasta = null, int page = 1, int pageSize = 6)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    IQueryable<CLIENTES> query = db.Set<CLIENTES>();

                    var filtroCuit = !string.IsNullOrWhiteSpace(cuit) ? cuit : dni;
                    if (!string.IsNullOrWhiteSpace(filtroCuit))
                    {
                        var norm = NormalizarCUIT(filtroCuit);
                        if (norm.Length > 0)
                        {
                            query = query.Where(x => x.CUIT_Cliente.Contains(norm));
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(razonSocial))
                    {
                        var rs = razonSocial.Trim();
                        query = query.Where(x => x.Razon_Social != null && x.Razon_Social.Contains(rs));
                    }

                    if (fechaDesde.HasValue)
                    {
                        query = query.Where(x => x.Fecha_Alta >= fechaDesde.Value);
                    }

                    if (fechaHasta.HasValue)
                    {
                        var hasta = fechaHasta.Value.Date.AddDays(1).AddTicks(-1);
                        query = query.Where(x => x.Fecha_Alta <= hasta);
                    }

                    // La tabla CLIENTES no tiene columna Estado en el modelo actual; estadoCliente se ignora aquí.

                    var totalRecords = query.Count();

                    var results = query
                        .OrderByDescending(x => x.Cliente_ID)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(x => new
                        {
                            Cliente_ID = x.Cliente_ID,
                            RazonSocial = x.Razon_Social,
                            CUIT_Cliente = x.CUIT_Cliente,
                            Fecha_Alta = x.Fecha_Alta
                        })
                        .ToList();

                    return Ok(new
                    {
                        TotalRecords = totalRecords,
                        Results = results
                    });
                }
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception("Error al acceder a la base de datos durante la búsqueda de clientes.", ex));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Clientes
        public IHttpActionResult Get()
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
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
                        Email = c.Email,
                        Fecha_Alta = c.Fecha_Alta,
                        Usu_Alta = c.Usu_Alta,
                        Fecha_Modi = c.Fecha_Modi,
                        Usu_Modi = c.Usu_Modi

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
                using (var db = new SGTLAuditContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
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
                        Email = cliente.Email,
                        Fecha_Alta = cliente.Fecha_Alta,
                        Usu_Alta = cliente.Usu_Alta,
                        Fecha_Modi = cliente.Fecha_Modi,
                        Usu_Modi = cliente.Usu_Modi
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
                using (var db = new SGTLAuditContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var cuitNormalizado = NormalizarCUIT(clienteDto.CUIT_Cliente);

                    // Verifica si el Cliente ya existe
                    var clienteExistente = db.Set<CLIENTES>().FirstOrDefault(c => c.CUIT_Cliente == cuitNormalizado);
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
                        CUIT_Cliente = cuitNormalizado,
                        Razon_Social = clienteDto.Razon_Social,
                        Cond_Fiscal = clienteDto.Cond_Fiscal,
                        ProvID = clienteDto.ProvID,
                        LocID = clienteDto.LocID,
                        Calle = clienteDto.Calle,
                        AlturaCalle = clienteDto.AlturaCalle,
                        Telefono = clienteDto.Telefono,
                        Email = clienteDto.Email,
                        Fecha_Alta = clienteDto.Fecha_Alta,
                        Usu_Alta = clienteDto.Usu_Alta,
                        Fecha_Modi = clienteDto.Fecha_Modi,
                        Usu_Modi = clienteDto.Usu_Modi
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
                using (var db = new SGTLAuditContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    CLIENTES oitem = db.Set<CLIENTES>().Find(id);

                    if (oitem == null)
                    {
                        return NotFound(); // Retorna 404 si no se encuentra el cliente con el ID especificado
                    }

                    oitem.Cliente_ID = value.Cliente_ID;
                    oitem.Razon_Social = value.Razon_Social;
                    oitem.CUIT_Cliente = NormalizarCUIT(value.CUIT_Cliente);
                    oitem.Cond_Fiscal = value.Cond_Fiscal;
                    oitem.ProvID = value.ProvID;
                    oitem.LocID = value.LocID;
                    oitem.Calle = value.Calle;
                    oitem.AlturaCalle = value.AlturaCalle;
                    oitem.Telefono = value.Telefono;
                    oitem.Email = value.Email;
                    oitem.Fecha_Alta = value.Fecha_Alta;
                    oitem.Usu_Alta = value.Usu_Alta;
                    oitem.Fecha_Modi = value.Fecha_Modi;
                    oitem.Usu_Modi = value.Usu_Modi;

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
                using (var db = new SGTLAuditContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
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

        // GET: api/Clientes/ValidarCUIT/{cuit}
        [HttpGet]
        [Route("api/Clientes/ValidarCUIT/{cuit}")]
        public IHttpActionResult ValidarCUIT(string cuit)
        {
            var cuitNormalizado = NormalizarCUIT(cuit);

            // Si la BD guarda CUIT como 11 dígitos, el input con guiones también debe normalizarse.
            if (cuitNormalizado.Length != 11)
            {
                return Content(HttpStatusCode.BadRequest, new
                {
                    codigo = "cuit_invalido",
                    mensaje = "Formato de CUIT inválido."
                });
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
            using (var db = new SGTLAuditContext(connectionString))
            {
                var cliente = db.Set<CLIENTES>().FirstOrDefault(x => x.CUIT_Cliente == cuitNormalizado);
                if (cliente != null)
                {
                    return Ok(new
                    {
                        codigo = "CUIT_registrado",
                        mensaje = "El CUIT ya está registrado."
                    });
                }

                return Ok(new
                {
                    codigo = "CUIT_no_registrado",
                    mensaje = "CUIT válido."
                });
            }
        }

        // GET: api/Clientes/ValidarCUIT/{cuit}/{clienteId}
        [HttpGet]
        [Route("api/Clientes/ValidarCUIT/{cuit}/{clienteId}")]
        public IHttpActionResult ValidarCUIT(string cuit, int clienteId)
        {
            var cuitNormalizado = NormalizarCUIT(cuit);

            if (cuitNormalizado.Length != 11)
            {
                return Content(HttpStatusCode.BadRequest, new
                {
                    codigo = "cuit_invalido",
                    mensaje = "Formato de CUIT inválido."
                });
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");
            using (var db = new SGTLAuditContext(connectionString))
            {
                var clienteConMismoCUIT = db.Set<CLIENTES>().FirstOrDefault(x => x.CUIT_Cliente == cuitNormalizado);

                // Si el CUIT pertenece al mismo cliente que se está editando, está permitido.
                if (clienteConMismoCUIT != null && clienteConMismoCUIT.Cliente_ID == clienteId)
                {
                    return Ok(new
                    {
                        codigo = "CUIT_permitido",
                        mensaje = "CUIT válido."
                    });
                }

                if (clienteConMismoCUIT != null)
                {
                    return Ok(new
                    {
                        codigo = "CUIT_registrado",
                        mensaje = "El CUIT ya está registrado por otro cliente."
                    });
                }

                return Ok(new
                {
                    codigo = "CUIT_no_registrado",
                    mensaje = "CUIT válido."
                });
            }
        }


    }

}