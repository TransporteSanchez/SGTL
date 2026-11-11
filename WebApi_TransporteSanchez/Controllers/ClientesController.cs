using System;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
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

        public sealed class ClienteBusquedaFila
        {
            public int? Cliente_ID { get; set; }
            public string RazonSocial { get; set; }
            public string CUIT_Cliente { get; set; }
            public DateTime? Fecha_Alta { get; set; }
            public bool EstadoCliente { get; set; }
            public int TotalRecords { get; set; }
        }

        public sealed class CambioEstadoCliente
        {
            public bool? EstadoCliente { get; set; }
        }

        [HttpGet]
        [Route("api/Clientes/Buscar")]
        public IHttpActionResult Buscar(string dni = null, string cuit = null,
        string razonSocial = null, string estadoCliente = null,
        DateTime? fechaDesde = null, DateTime? fechaHasta = null,
        int page = 1, int pageSize = 6)
        {
            if (page < 1 || pageSize < 0)
                return BadRequest("La página debe ser mayor que cero y el tamaño no puede ser negativo.");

            bool? activo;
            switch ((estadoCliente ?? "").Trim().ToLowerInvariant())
            {
                case "":
                case "todos":
                    activo = null;
                    break;
                case "activo":
                case "habilitado":
                    activo = true;
                    break;
                case "inactivo":
                case "deshabilitado":
                    activo = false;
                    break;
                default:
                    return BadRequest("El estado debe ser Activo o Inactivo.");
            }

            var cuitNormalizado = NormalizarCUIT(string.IsNullOrWhiteSpace(cuit) ? dni : cuit);
            var desdeFila = ((long)page - 1) * pageSize;
            DateTime? hastaExclusivo = fechaHasta.HasValue && fechaHasta.Value.Date < DateTime.MaxValue.Date
                ? fechaHasta.Value.Date.AddDays(1)
                : (DateTime?)null;

            const string sql = @"
WITH Filtrados AS (
    SELECT Cliente_ID, Razon_Social AS RazonSocial, CUIT_Cliente, Fecha_Alta,
           ISNULL(EstadoCliente, CONVERT(bit, 0)) AS EstadoCliente
    FROM dbo.CLIENTES
    WHERE (@cuit = '' OR CHARINDEX(@cuit, CUIT_Cliente) > 0)
      AND (@razon = '' OR CHARINDEX(@razon, Razon_Social) > 0)
      AND (@desde IS NULL OR Fecha_Alta >= @desde)
      AND (@hasta IS NULL OR Fecha_Alta < @hasta)
      AND (@activo IS NULL OR ISNULL(EstadoCliente, CONVERT(bit, 0)) = @activo)
), Numerados AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY Cliente_ID DESC) AS Fila
    FROM Filtrados
)
SELECT p.Cliente_ID, p.RazonSocial, p.CUIT_Cliente, p.Fecha_Alta,
       ISNULL(p.EstadoCliente, CONVERT(bit, 0)) AS EstadoCliente, t.TotalRecords
FROM (SELECT COUNT(*) AS TotalRecords FROM Filtrados) AS t
LEFT JOIN Numerados AS p
    ON @tamano = 0 OR (p.Fila > @desdeFila AND p.Fila <= @desdeFila + @tamano)
ORDER BY p.Fila;";

            try
            {
                using (var db = new SGTLAuditContext(ConnectionStringHelper.GetConnectionString("SGTLEntities")))
                {
                    var filas = db.Database.SqlQuery<ClienteBusquedaFila>(sql,
                        new SqlParameter("@cuit", SqlDbType.VarChar, -1) { Value = cuitNormalizado },
                        new SqlParameter("@razon", SqlDbType.NVarChar, -1) { Value = (razonSocial ?? "").Trim() },
                        new SqlParameter("@desde", SqlDbType.DateTime2) { Value = (object)fechaDesde ?? DBNull.Value },
                        new SqlParameter("@hasta", SqlDbType.DateTime2) { Value = (object)hastaExclusivo ?? DBNull.Value },
                        new SqlParameter("@activo", SqlDbType.Bit) { Value = (object)activo ?? DBNull.Value },
                        new SqlParameter("@desdeFila", SqlDbType.BigInt) { Value = desdeFila },
                        new SqlParameter("@tamano", SqlDbType.Int) { Value = pageSize }
                    ).ToList();

                    return Ok(new
                    {
                        TotalRecords = filas[0].TotalRecords,
                        Results = filas.Where(f => f.Cliente_ID.HasValue).Select(f => new
                        {
                            Cliente_ID = f.Cliente_ID.Value,
                            f.RazonSocial,
                            f.CUIT_Cliente,
                            f.Fecha_Alta,
                            f.EstadoCliente
                        }).ToList()
                    });
                }
            }
            catch (SqlException)
            {
                return InternalServerError(new Exception("No se pudieron consultar los clientes."));
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

        [HttpPut]
        [Route("api/Clientes/Estado/{id:int}")]
        public async Task<IHttpActionResult> PutEstadoCliente(int id,
    [FromBody] CambioEstadoCliente cambio, CancellationToken ct)
        {
            if (!ModelState.IsValid || cambio == null || !cambio.EstadoCliente.HasValue)
                return BadRequest("Enviá EstadoCliente como true o false.");

            try
            {
                var usuario = await new AccesoEmail().AutenticarAsync(Request.Headers.Authorization, ct);
                if (usuario == null)
                    return Unauthorized();

                var conexion = ConnectionStringHelper.GetConnectionString("SGTLEntities");
                var activo = cambio.EstadoCliente.Value;

                using (var db = new SGTLAuditContext(conexion))
                {
                    if (!usuario.EsAdministrador)
                    {
                        var menus = await (
                            from u in db.Set<USUARIOS>()
                            join gu in db.Set<GRUPOS_USUARIOS>() on u.Usuario_ID equals gu.UsuarioID
                            join gm in db.Set<GRUPOS_MENU>() on gu.GrupoID equals gm.GrupoID
                            join m in db.Set<MENU>() on gm.MenuID equals m.Menu_ID
                            where u.Nombre_Usuario == usuario.Nombre
                            select m.Menu_Nombre
                        ).Distinct().ToListAsync(ct);

                        var comparador = CultureInfo.GetCultureInfo("es-AR").CompareInfo;
                        var puedeGestionar = menus.Any(nombre => comparador.Compare(
                            (nombre ?? "").Trim(), "Gestión de clientes",
                            CompareOptions.IgnoreCase | CompareOptions.IgnoreNonSpace) == 0);
                        if (!puedeGestionar)
                            return Content(HttpStatusCode.Forbidden,
                                new { message = "No tenés permiso para gestionar clientes." });
                    }

                    const string sql = @"
UPDATE dbo.CLIENTES
SET EstadoCliente = @activo, Fecha_Modi = GETUTCDATE(), Usu_Modi = LEFT(@usuario, 20)
WHERE Cliente_ID = @id AND (EstadoCliente IS NULL OR EstadoCliente <> @activo);
SET @filas = @@ROWCOUNT;";
                    var filas = new SqlParameter("@filas", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    await db.Database.ExecuteSqlCommandAsync(sql, ct,
                        new SqlParameter("@activo", SqlDbType.Bit) { Value = activo },
                        new SqlParameter("@usuario", SqlDbType.VarChar, 50) { Value = usuario.Nombre },
                        new SqlParameter("@id", SqlDbType.Int) { Value = id },
                        filas);

                    if ((int)filas.Value == 0)
                    {
                        if (!await db.Set<CLIENTES>().AnyAsync(c => c.Cliente_ID == id, ct))
                            return NotFound();
                    }
                    else
                    {
                        SGTLAuditContext.RegistrarEvento(conexion, usuario.Nombre, "UPDATE",
                            "CLIENTES", "Cliente_ID=" + id,
                            activo ? "Cliente activado." : "Cliente inactivado.");
                    }

                    return Ok(new { EstadoCliente = activo });
                }
            }
            catch (SqlException)
            {
                return InternalServerError(new Exception("No se pudo actualizar el estado del cliente."));
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