using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Data.SqlClient;
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
            /// <summary>Columna fuera del EDMX (script 09_nombre_comercial_clientes.sql).</summary>
            public string Nombre_Comercial { get; set; }
            public string CUIT_Cliente { get; set; }
            public int Cond_Fiscal { get; set; }
            public int ProvID { get; set; }
            public int LocID { get; set; }
            public string Calle { get; set; }
            public string AlturaCalle { get; set; }
            public string CodigoPostal { get; set; }
            public string Telefono { get; set; }
            public string Email { get; set; }
            public System.DateTime Fecha_Alta { get; set; }
            public string Usu_Alta { get; set; }
            public System.DateTime Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }
            public bool EstadoCliente { get; set; }

            // Columna de 07_clientes_tipo_y_evidencia.sql (fuera del EDMX): Con_plataforma | Directo.
            public string Tipo_Cliente { get; set; }
        }

        public const string TipoConPlataforma = "Con_plataforma";
        public const string TipoDirecto = "Directo";

        private static string NormalizarTipoCliente(string tipo)
        {
            return string.Equals((tipo ?? "").Trim(), TipoConPlataforma, StringComparison.OrdinalIgnoreCase) ? TipoConPlataforma : TipoDirecto;
        }

        private class TipoClienteRow
        {
            public int Cliente_ID { get; set; }
            public string Tipo_Cliente { get; set; }
        }

        private static Dictionary<int, string> TiposCliente(DbContext db)
        {
            return db.Database.SqlQuery<TipoClienteRow>("SELECT Cliente_ID, Tipo_Cliente FROM CLIENTES")
                .ToList().ToDictionary(t => t.Cliente_ID, t => t.Tipo_Cliente);
        }

        private static void GuardarTipoCliente(DbContext db, int clienteId, string tipo)
        {
            db.Database.ExecuteSqlCommand("UPDATE CLIENTES SET Tipo_Cliente=@t WHERE Cliente_ID=@id",
                new System.Data.SqlClient.SqlParameter("@t", NormalizarTipoCliente(tipo)),
                new System.Data.SqlClient.SqlParameter("@id", clienteId));
        }

        public class EstadoClienteUpdateModel
        {
            [Required]
            public bool? EstadoCliente { get; set; }
            public string Usu_Modi { get; set; }
        }

        private class ClienteBusquedaDto
        {
            public int Cliente_ID { get; set; }
            public string RazonSocial { get; set; }
            public string CUIT_Cliente { get; set; }
            public DateTime Fecha_Alta { get; set; }
            public bool EstadoCliente { get; set; }
            public string Tipo_Cliente { get; set; }
        }

        private class ClienteEstadoDto
        {
            public int Cliente_ID { get; set; }
            public bool EstadoCliente { get; set; }
        }

        private class ClienteCodigoPostalDto
        {
            public int Cliente_ID { get; set; }
            public string CodigoPostal { get; set; }
        }

        private class ClienteNombreComercialDto
        {
            public int Cliente_ID { get; set; }
            public string Nombre_Comercial { get; set; }
        }

        private static SqlParameter Parametro(string nombre, object valor)
        {
            return new SqlParameter(nombre, valor ?? DBNull.Value);
        }

        // CodigoPostal se agregó después de generar el modelo EDMX. Se lo administra
        // por SQL directo para no depender de regenerar las clases generadas.
        private static bool TieneCampoCodigoPostal(SGTLAuditContext db)
        {
            return db.Database.SqlQuery<int>(
                "SELECT CASE WHEN COL_LENGTH('dbo.CLIENTES','CodigoPostal') IS NULL THEN 0 ELSE 1 END")
                .First() == 1;
        }

        private static bool TieneCampoNombreComercial(SGTLAuditContext db)
        {
            return db.Database.SqlQuery<int>(
                "SELECT CASE WHEN COL_LENGTH('dbo.CLIENTES','Nombre_Comercial') IS NULL THEN 0 ELSE 1 END")
                .First() == 1;
        }

        private static void CompletarCodigosPostales(SGTLAuditContext db, IEnumerable<Cliente> clientes)
        {
            var lista = (clientes ?? Enumerable.Empty<Cliente>()).ToList();
            if (!lista.Any() || !TieneCampoCodigoPostal(db)) return;

            var codigos = db.Database.SqlQuery<ClienteCodigoPostalDto>(
                "SELECT Cliente_ID,CodigoPostal FROM dbo.CLIENTES").ToDictionary(x => x.Cliente_ID, x => x.CodigoPostal);
            foreach (var cliente in lista)
                cliente.CodigoPostal = codigos.ContainsKey(cliente.Cliente_ID) ? codigos[cliente.Cliente_ID] : null;
        }

        private static void CompletarNombresComerciales(SGTLAuditContext db, IEnumerable<Cliente> clientes)
        {
            var lista = (clientes ?? Enumerable.Empty<Cliente>()).ToList();
            if (!lista.Any() || !TieneCampoNombreComercial(db)) return;

            var nombres = db.Database.SqlQuery<ClienteNombreComercialDto>(
                "SELECT Cliente_ID,Nombre_Comercial FROM dbo.CLIENTES").ToDictionary(x => x.Cliente_ID, x => x.Nombre_Comercial);
            foreach (var cliente in lista)
                cliente.Nombre_Comercial = nombres.ContainsKey(cliente.Cliente_ID) ? nombres[cliente.Cliente_ID] : null;
        }

        private static void GuardarCodigoPostal(SGTLAuditContext db, int clienteId, string codigoPostal)
        {
            db.Database.ExecuteSqlCommand(
                "UPDATE dbo.CLIENTES SET CodigoPostal=@codigoPostal WHERE Cliente_ID=@clienteId",
                Parametro("@codigoPostal", string.IsNullOrWhiteSpace(codigoPostal) ? null : codigoPostal.Trim()),
                Parametro("@clienteId", clienteId));
        }

        private static void GuardarNombreComercial(SGTLAuditContext db, int clienteId, string nombreComercial)
        {
            db.Database.ExecuteSqlCommand(
                "UPDATE dbo.CLIENTES SET Nombre_Comercial=@nombre WHERE Cliente_ID=@clienteId",
                Parametro("@nombre", string.IsNullOrWhiteSpace(nombreComercial) ? null : nombreComercial.Trim()),
                Parametro("@clienteId", clienteId));
        }

        private static Dictionary<int, bool> ObtenerEstadosClientes(SGTLAuditContext db, IEnumerable<int> clienteIds)
        {
            var ids = clienteIds.Distinct().ToList();
            if (!ids.Any()) return new Dictionary<int, bool>();

            var parametros = ids
                .Select((id, indice) => Parametro("@clienteId" + indice, id))
                .ToArray();
            var nombresParametros = string.Join(", ", parametros.Select(p => p.ParameterName));
            var sql = "SELECT Cliente_ID, CONVERT(bit, ISNULL(EstadoCliente, 0)) AS EstadoCliente "
                + "FROM dbo.CLIENTES WHERE Cliente_ID IN (" + nombresParametros + ")";

            return db.Database.SqlQuery<ClienteEstadoDto>(sql, parametros)
                .ToDictionary(x => x.Cliente_ID, x => x.EstadoCliente);
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

                    // El estado se obtiene por SQL porque la columna EstadoCliente no forma
                    // parte del modelo Entity Framework generado de CLIENTES.
                    var estadosSolicitados = (estadoCliente ?? string.Empty)
                        .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                        .Select(estado => estado.Trim())
                        .ToArray();
                    var incluirHabilitados = estadosSolicitados.Any(estado =>
                        string.Equals(estado, "Habilitado", StringComparison.OrdinalIgnoreCase));
                    var incluirDeshabilitados = estadosSolicitados.Any(estado =>
                        string.Equals(estado, "Deshabilitado", StringComparison.OrdinalIgnoreCase));

                    if (incluirHabilitados != incluirDeshabilitados)
                    {
                        var estadoBuscado = incluirHabilitados;
                        var clientesConEstado = db.Database.SqlQuery<int>(
                            "SELECT Cliente_ID FROM dbo.CLIENTES WHERE ISNULL(EstadoCliente,0)=@estadoCliente",
                            Parametro("@estadoCliente", estadoBuscado)).ToList();
                        query = query.Where(cliente => clientesConEstado.Contains(cliente.Cliente_ID));
                    }

                    var totalRecords = query.Count();
                    if (pageSize == 0)
                    {
                        page = 1;
                        pageSize = Math.Max(totalRecords, 1);
                    }
                    else if (pageSize < 1)
                    {
                        pageSize = 6;
                    }

                    var tipos = TiposCliente(db);
                    var results = query
                        .OrderByDescending(x => x.Cliente_ID)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(x => new ClienteBusquedaDto
                        {
                            Cliente_ID = x.Cliente_ID,
                            RazonSocial = x.Razon_Social,
                            CUIT_Cliente = x.CUIT_Cliente,
                            Fecha_Alta = x.Fecha_Alta
                        })
                        .ToList();

                    var estados = ObtenerEstadosClientes(db, results.Select(x => x.Cliente_ID));
                    foreach (var resultado in results)
                    {
                        resultado.EstadoCliente = estados.ContainsKey(resultado.Cliente_ID)
                            && estados[resultado.Cliente_ID];
                        resultado.Tipo_Cliente = tipos.ContainsKey(resultado.Cliente_ID) ? tipos[resultado.Cliente_ID] : TipoDirecto;
                    }

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

                    var estados = ObtenerEstadosClientes(db, olist.Select(x => x.Cliente_ID));
                    foreach (var cliente in olist)
                    {
                        cliente.EstadoCliente = estados.ContainsKey(cliente.Cliente_ID)
                            && estados[cliente.Cliente_ID];
                    }
                    CompletarCodigosPostales(db, olist);
                    CompletarNombresComerciales(db, olist);

                    if (olist == null || !olist.Any())
                    {
                        return NotFound(); // Retorna 404 si no se encuentran registros
                    }

                    var tipos = TiposCliente(db);
                    olist.ForEach(c => c.Tipo_Cliente = tipos.ContainsKey(c.Cliente_ID) ? tipos[c.Cliente_ID] : TipoDirecto);

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

                    var tipos = TiposCliente(db);
                    clienteDto.Tipo_Cliente = tipos.ContainsKey(id) ? tipos[id] : TipoDirecto;
                    if (TieneCampoCodigoPostal(db))
                    {
                        clienteDto.CodigoPostal = db.Database.SqlQuery<string>(
                            "SELECT CodigoPostal FROM dbo.CLIENTES WHERE Cliente_ID=@clienteId",
                            Parametro("@clienteId", id)).FirstOrDefault();
                    }
                    if (TieneCampoNombreComercial(db))
                    {
                        clienteDto.Nombre_Comercial = db.Database.SqlQuery<string>(
                            "SELECT Nombre_Comercial FROM dbo.CLIENTES WHERE Cliente_ID=@clienteId",
                            Parametro("@clienteId", id)).FirstOrDefault();
                    }

                    var estados = ObtenerEstadosClientes(db, new[] { id });
                    clienteDto.EstadoCliente = estados.ContainsKey(id) && estados[id];

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
                    var codigoPostal = (clienteDto.CodigoPostal ?? string.Empty).Trim();
                    if (codigoPostal.Length > 20) return BadRequest("El código postal no puede superar los 20 caracteres.");
                    if (!TieneCampoCodigoPostal(db))
                        return Content(HttpStatusCode.Conflict, new { message = "Falta instalar el campo CodigoPostal. Ejecutá el script 08_codigo_postal_clientes.sql." });
                    var nombreComercial = (clienteDto.Nombre_Comercial ?? string.Empty).Trim();
                    if (nombreComercial.Length > 100) return BadRequest("El nombre comercial no puede superar los 100 caracteres.");
                    if (!TieneCampoNombreComercial(db))
                        return Content(HttpStatusCode.Conflict, new { message = "Falta instalar el campo Nombre_Comercial. Ejecutá el script 09_nombre_comercial_clientes.sql." });

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
                    GuardarTipoCliente(db, cliente.Cliente_ID, clienteDto.Tipo_Cliente);
                    GuardarCodigoPostal(db, cliente.Cliente_ID, codigoPostal);
                    GuardarNombreComercial(db, cliente.Cliente_ID, nombreComercial);
                    db.Database.ExecuteSqlCommand(
                        "UPDATE dbo.CLIENTES SET EstadoCliente=1 WHERE Cliente_ID=@clienteId",
                        Parametro("@clienteId", cliente.Cliente_ID));

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
        public IHttpActionResult Put(int id, [FromBody] Cliente value)
        {
            // Obtener la cadena de conexión dinámica
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString)) // Usar DbContext con la cadena de conexión personalizada
                {
                    var codigoPostal = (value.CodigoPostal ?? string.Empty).Trim();
                    if (codigoPostal.Length > 20) return BadRequest("El código postal no puede superar los 20 caracteres.");
                    if (!TieneCampoCodigoPostal(db))
                        return Content(HttpStatusCode.Conflict, new { message = "Falta instalar el campo CodigoPostal. Ejecutá el script 08_codigo_postal_clientes.sql." });
                    var nombreComercial = (value.Nombre_Comercial ?? string.Empty).Trim();
                    if (nombreComercial.Length > 100) return BadRequest("El nombre comercial no puede superar los 100 caracteres.");
                    if (!TieneCampoNombreComercial(db))
                        return Content(HttpStatusCode.Conflict, new { message = "Falta instalar el campo Nombre_Comercial. Ejecutá el script 09_nombre_comercial_clientes.sql." });

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
                        if (value.Tipo_Cliente != null)
                        {
                            GuardarTipoCliente(db, id, value.Tipo_Cliente);
                        }
                        GuardarCodigoPostal(db, id, codigoPostal);
                        GuardarNombreComercial(db, id, nombreComercial);
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


        // PUT: api/Clientes/Estado/{id}
        [HttpPut]
        [Route("api/Clientes/Estado/{id:int}")]
        public IHttpActionResult PutEstadoCliente(int id, [FromBody] EstadoClienteUpdateModel model)
        {
            if (model == null || !ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var cliente = db.Set<CLIENTES>().Find(id);
                    if (cliente == null)
                    {
                        return NotFound();
                    }

                    var usuario = string.IsNullOrWhiteSpace(model.Usu_Modi)
                        ? (cliente.Usu_Modi ?? "sistema")
                        : model.Usu_Modi.Trim();

                    var filasActualizadas = db.Database.ExecuteSqlCommand(@"
UPDATE dbo.CLIENTES
SET EstadoCliente=@estadoCliente, Fecha_Modi=@fechaModi, Usu_Modi=@usuModi
WHERE Cliente_ID=@clienteId",
                        Parametro("@estadoCliente", model.EstadoCliente.Value),
                        Parametro("@fechaModi", DateTime.Now),
                        Parametro("@usuModi", usuario),
                        Parametro("@clienteId", id));

                    if (filasActualizadas == 0)
                    {
                        return NotFound();
                    }

                    SGTLAuditContext.RegistrarEvento(
                        connectionString,
                        usuario,
                        "UPDATE",
                        "CLIENTES",
                        "Cliente_ID=" + id,
                        "Estado del cliente: " + (model.EstadoCliente.Value ? "Activo" : "Deshabilitado"));

                    return Ok(new { EstadoCliente = model.EstadoCliente.Value });
                }
            }
            catch (DbUpdateException ex)
            {
                return InternalServerError(new Exception("No se pudo actualizar el estado del cliente.", ex));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
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
