using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Web.Http;
using Microsoft.IdentityModel.Tokens;
using WebApi_TransporteSanchez.Tarifas;

namespace WebApi_TransporteSanchez.Controllers
{
    /// <summary>
    /// Tabla de tarifas por tipo de camión (tablas TARIFARIOS y TARIFARIO_VALORES, database/tarifas/02 y 03; fuera del
    /// EDMX): las tarifas fijas por banda de km y las tarifas por km. Cada versión (un PDF de la empresa) vale desde
    /// Vigente_Desde hasta la siguiente. El viaje guarda su importe; al guardar una tabla, se recalcula lo que el cliente
    /// todavía no vio y lo demás queda para revisar (TarifarioImpacto, §33 de PENDIENTES).
    /// Cada tabla es general (para todos los clientes) o propia de algunos clientes (TARIFARIO_CLIENTES): para esos
    /// clientes reemplaza a la general. Una general y una propia pueden estar vigentes al mismo tiempo.
    /// </summary>
    public class TarifarioController : ApiController
    {
        public class ValoresDto
        {
            public bool Modelo_Nuevo { get; set; }
            public string Tipo_Vehiculo { get; set; }
            public decimal Valor_Banda1_Vuelta1 { get; set; }
            public decimal Valor_Banda1_Vuelta2 { get; set; }
            public decimal Valor_Banda2 { get; set; }
            public decimal Valor_Banda3 { get; set; }
            public decimal Valor_Km { get; set; }
        }

        public class TarifarioDto
        {
            public int Tarifario_ID { get; set; }
            public string Nombre { get; set; }
            public DateTime? Vigente_Desde { get; set; }
            public bool? Para_Todos { get; set; }       // sin dato: para todos los clientes
            public List<int> Clientes { get; set; }      // solo si no es para todos
            public int Anio_Corte { get; set; }
            public int Km_Banda1 { get; set; }
            public int Km_Banda2 { get; set; }
            public int Km_Banda3 { get; set; }
            public decimal Estadia_Modulo { get; set; }
            public int Estadia_Horas_Modulo { get; set; }
            public int Estadia_Desde_Horas { get; set; }
            public int Estadia_Desde_Horas_Larga { get; set; }
            public decimal Falso_Flete_Porcentaje { get; set; }
            public List<ValoresDto> Valores { get; set; }
            public string Usuario { get; set; }
            // Obligatorio si el cambio recalcula importes o deja algo para revisar (§33): queda en la auditoría.
            public string Motivo { get; set; }
        }

        private class ListaRow
        {
            public int Tarifario_ID { get; set; }
            public string Nombre { get; set; }
            public DateTime Vigente_Desde { get; set; }
            public bool Para_Todos { get; set; }
            public DateTime? Vigente_Hasta { get; set; }
            public int Viajes { get; set; }
            public int Presupuestos { get; set; }       // pendientes o aceptados sin viaje que la usan
            public bool Unica_General { get; set; }     // la única para todos los clientes
            public DateTime Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }
        }

        private class ClienteTablaRow
        {
            public int Tarifario_ID { get; set; }
            public int Cliente_ID { get; set; }
            public string Razon_Social { get; set; }
        }

        // Cn: la de Entity Framework (DbContext y la auditoría). CnSql: la de SQL Server, para la transacción con SqlConnection.
        private static string Cn() { return ConnectionStringHelper.GetConnectionString("SGTLEntities"); }
        private static string CnSql() { return new EntityConnectionStringBuilder(Cn()).ProviderConnectionString; }
        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }

        private static string Usuario(string u)
        {
            u = string.IsNullOrWhiteSpace(u) ? "sistema" : u.Trim();
            return u.Length > 50 ? u.Substring(0, 50) : u;
        }

        private static DateTime AhoraArgentina()
        {
            return TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Argentina Standard Time");
        }

        // Hasta: el día antes de la tabla siguiente del mismo alcance (la general siguiente, o la propia siguiente de alguno
        // de sus clientes).
        private const string SELECT_LISTA =
            "SELECT t.Tarifario_ID, t.Nombre, t.Vigente_Desde, t.Para_Todos, " +
            "(SELECT DATEADD(day, -1, MIN(s.Vigente_Desde)) FROM dbo.TARIFARIOS s WHERE s.Vigente_Desde > t.Vigente_Desde " +
            " AND ((t.Para_Todos = 1 AND s.Para_Todos = 1) OR (t.Para_Todos = 0 AND s.Para_Todos = 0 AND EXISTS (" +
            "  SELECT 1 FROM dbo.TARIFARIO_CLIENTES a JOIN dbo.TARIFARIO_CLIENTES b ON b.ClienteID = a.ClienteID " +
            "  WHERE a.Tarifario_ID = t.Tarifario_ID AND b.Tarifario_ID = s.Tarifario_ID)))) AS Vigente_Hasta, " +
            "(SELECT COUNT(*) FROM dbo.VIAJES v WHERE v.TarifarioID = t.Tarifario_ID) AS Viajes, " +
            "(SELECT COUNT(*) FROM dbo.PRESUPUESTOS ps WHERE ps.ViajeID IS NULL AND ps.Estado IN ('Pendiente', 'Aceptado') AND ISJSON(ps.Datos) = 1 " +
            " AND TRY_CAST(JSON_VALUE(ps.Datos, '$.tarifarioId') AS int) = t.Tarifario_ID) AS Presupuestos, " +
            "CAST(CASE WHEN t.Para_Todos = 1 AND NOT EXISTS (SELECT 1 FROM dbo.TARIFARIOS o WHERE o.Para_Todos = 1 AND o.Tarifario_ID <> t.Tarifario_ID) " +
            " THEN 1 ELSE 0 END AS bit) AS Unica_General, t.Fecha_Modi, t.Usu_Modi " +
            "FROM dbo.TARIFARIOS t ";

        private const string SELECT_CLIENTES =
            "SELECT tc.Tarifario_ID, c.Cliente_ID, ISNULL(c.Razon_Social, '') AS Razon_Social FROM dbo.TARIFARIO_CLIENTES tc " +
            "JOIN dbo.CLIENTES c ON c.Cliente_ID = tc.ClienteID ";

        // GET api/Tarifario: las tablas, la más nueva primero, con para quién es cada una.
        [HttpGet]
        [Route("api/Tarifario")]
        public IHttpActionResult Listar()
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var tablas = db.Database.SqlQuery<ListaRow>(SELECT_LISTA + "ORDER BY t.Vigente_Desde DESC, t.Para_Todos").ToList();
                    var clientes = db.Database.SqlQuery<ClienteTablaRow>(SELECT_CLIENTES).ToList();
                    return Ok(tablas.Select(t => new
                    {
                        t.Tarifario_ID, t.Nombre, t.Vigente_Desde, t.Vigente_Hasta, t.Para_Todos, t.Viajes, t.Presupuestos, t.Unica_General,
                        t.Fecha_Modi, t.Usu_Modi,
                        Clientes = clientes.Where(c => c.Tarifario_ID == t.Tarifario_ID).OrderBy(c => c.Razon_Social)
                            .Select(c => new { c.Cliente_ID, c.Razon_Social }).ToList()
                    }).ToList());
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // GET api/Tarifario/{id}: la versión con sus 8 filas de valores.
        [HttpGet]
        [Route("api/Tarifario/{id:int}")]
        public IHttpActionResult Obtener(int id)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var t = db.Database.SqlQuery<TarifarioCalculo.Tarifario>(
                        "SELECT Tarifario_ID, Nombre, Vigente_Desde, Para_Todos, Anio_Corte, Km_Banda1, Km_Banda2, Km_Banda3, Estadia_Modulo, " +
                        "Estadia_Horas_Modulo, Estadia_Desde_Horas, Estadia_Desde_Horas_Larga, Falso_Flete_Porcentaje " +
                        "FROM dbo.TARIFARIOS WHERE Tarifario_ID=@id", P("@id", id)).FirstOrDefault();
                    if (t == null) return NotFound();
                    var lista = db.Database.SqlQuery<ListaRow>(SELECT_LISTA + "WHERE t.Tarifario_ID=@id", P("@id", id)).First();
                    var valores = db.Database.SqlQuery<TarifarioCalculo.Valores>(
                        "SELECT Tarifario_ID, Modelo_Nuevo, Tipo_Vehiculo, Valor_Banda1_Vuelta1, Valor_Banda1_Vuelta2, Valor_Banda2, Valor_Banda3, Valor_Km " +
                        "FROM dbo.TARIFARIO_VALORES WHERE Tarifario_ID=@id", P("@id", id)).ToList();
                    var clientes = db.Database.SqlQuery<ClienteTablaRow>(SELECT_CLIENTES + "WHERE tc.Tarifario_ID=@id ORDER BY c.Razon_Social", P("@id", id)).ToList();
                    return Ok(new
                    {
                        t.Tarifario_ID, t.Nombre, t.Vigente_Desde, lista.Vigente_Hasta, lista.Viajes, lista.Fecha_Modi, lista.Usu_Modi,
                        t.Para_Todos, Clientes = clientes.Select(c => new { c.Cliente_ID, c.Razon_Social }).ToList(),
                        t.Anio_Corte, t.Km_Banda1, t.Km_Banda2, t.Km_Banda3, t.Estadia_Modulo, t.Estadia_Horas_Modulo,
                        t.Estadia_Desde_Horas, t.Estadia_Desde_Horas_Larga, t.Falso_Flete_Porcentaje,
                        Valores = valores.OrderBy(v => v.Modelo_Nuevo).ThenBy(v => Array.IndexOf(TarifarioCalculo.TiposVehiculo, v.Tipo_Vehiculo)).ToList()
                    });
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // GET api/Tarifario/Vigente?fecha=AAAA-MM-DD&clienteId=N: la tabla que vale ese día para ese cliente (la propia o la
        // general; sin fecha, hoy; sin cliente, la general). 404 si no hay.
        [HttpGet]
        [Route("api/Tarifario/Vigente")]
        public IHttpActionResult Vigente(string fecha = null, int clienteId = 0)
        {
            DateTime dia;
            if (string.IsNullOrWhiteSpace(fecha)) dia = AhoraArgentina().Date;
            else if (!DateTime.TryParseExact(fecha, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out dia))
                return BadRequest("La fecha no es válida.");
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var t = TarifarioCalculo.Vigente(db, dia, clienteId);
                    if (t == null) return Content(HttpStatusCode.NotFound, new { Mensaje = "No hay una tabla de tarifas vigente el " + dia.ToString("dd/MM/yyyy") + "." });
                    return Ok(t);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // GET api/Tarifario/Calcular: el importe del viaje (o del presupuesto) con lo que hay en pantalla, con el mismo
        // cálculo que se guarda. tarifa: "fija" o "km", las dos de la tabla. Con el cliente, el origen y el destino, también
        // el precio por orden del día (§43, OrdenDelDia): la vuelta sale sola (no se elige; "vuelta" ya no se usa) y en
        // "Orden" van el grupo del día (si hay otro viaje o presupuesto aceptado), la línea de debajo de la tarifa y, en un
        // viaje, lo que va a pasar con los otros al guardar. presupuesto = true: es un presupuesto pendiente (no reserva lugar
        // ni mueve a los otros hasta que se acepte).
        [HttpGet]
        [Route("api/Tarifario/Calcular")]
        public IHttpActionResult Calcular(string tarifa, string fechaInicio, int camionId = 0, string km = null, int? vuelta = null,
            bool falsoFlete = false, int estadia = 0, int viajeId = 0, int clienteId = 0, int origenId = 0, int destinoId = 0,
            bool presupuesto = false, int presupuestoId = 0, decimal vueltaVacia = 0m)
        {
            if (tarifa != "fija" && tarifa != "km")
                return BadRequest("Elegí la tarifa: fija o por km.");

            DateTime inicio;
            if (string.IsNullOrWhiteSpace(fechaInicio) || !DateTime.TryParse(fechaInicio, CultureInfo.InvariantCulture, DateTimeStyles.None, out inicio))
                return BadRequest("Completá el inicio para calcular la tarifa.");

            decimal kmValor;
            decimal? kmPedido = null;
            if (!string.IsNullOrWhiteSpace(km) && decimal.TryParse(km.Trim().Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out kmValor))
                kmPedido = kmValor;

            var pedido = new TarifarioCalculo.Pedido
            {
                ViajeId = viajeId,
                ClienteID = clienteId,
                UsaTarifario = true,
                PorKm = tarifa == "km",
                FechaInicio = inicio,
                CamionID = camionId,
                Km = kmPedido,
                Vuelta = null,
                FalsoFlete = falsoFlete,
                EstadiaModulos = estadia,
                // La vuelta vacía de un viaje directo, un porcentaje del flete (Rocío, 28/10).
                VueltaVaciaPorcentaje = vueltaVacia
            };

            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var r = TarifarioCalculo.Calcular(db, pedido);
                    if (!r.Ok) return Content(HttpStatusCode.NotFound, new { Mensaje = r.Mensaje });

                    // El viaje que se está editando, como está guardado (para sacarlo de su grupo de antes).
                    var antes = !presupuesto && viajeId > 0 ? OrdenDelDia.SujetoDeViaje(db, viajeId) : null;
                    OrdenDelDia.Plan plan = null;
                    if (r.AplicaVuelta && clienteId > 0 && origenId > 0 && destinoId > 0)
                    {
                        var despues = new OrdenDelDia.Sujeto
                        {
                            Clase = presupuesto ? OrdenDelDia.Presupuesto : OrdenDelDia.Viaje,
                            Id = presupuesto ? presupuestoId : viajeId,
                            ClienteID = clienteId, OrigenID = origenId, DestinoID = destinoId, Inicio = inicio,
                            Estado = antes != null ? antes.Estado : "Registrado",
                            DePresupuesto = antes != null && antes.DePresupuesto,
                            Vuelta = antes != null && antes.DePresupuesto ? antes.Vuelta : null,
                            Aplica = true, Importe = r.Importe
                        };
                        plan = OrdenDelDia.Planificar(db, despues, antes, "se modificó el viaje #" + viajeId);
                        if (plan.Vuelta == 2)
                        {
                            pedido.Vuelta = 2;
                            r = TarifarioCalculo.Calcular(db, pedido);
                            if (!r.Ok) return Content(HttpStatusCode.NotFound, new { Mensaje = r.Mensaje });
                        }
                        var este = plan.Grupo.FirstOrDefault(i => i.Este);
                        if (este != null) este.Importe = r.Importe;
                    }
                    else if (antes != null && antes.Aplica)
                        plan = OrdenDelDia.Planificar(db, null, antes, "se modificó el viaje #" + viajeId);

                    return Ok(new
                    {
                        r.TarifarioID, r.Tarifario, r.TipoVehiculo, r.ModeloNuevo, r.Banda, r.AplicaVuelta, r.Vuelta,
                        r.ImporteBase, r.TarifaDetalle, r.FalsoFlete, r.FalsoFletePorcentaje, r.Estadia, r.EstadiaModulo,
                        r.Importe, r.ImporteDetalle,
                        VueltaSugerida = r.Vuelta ?? 1,
                        Orden = plan == null ? null : OrdenParaPantalla(plan, presupuesto)
                    });
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // El plan como lo muestra la pantalla: el bloque (solo si hay más de uno), la línea y los avisos.
        public static object OrdenParaPantalla(OrdenDelDia.Plan plan, bool presupuesto)
        {
            return new
            {
                plan.Aplica,
                plan.Vuelta,
                Linea = OrdenDelDia.Linea(plan),
                Grupo = plan.Grupo.Count > 1 ? plan.Grupo.Select(i =>
                {
                    var cambio = plan.Cambios.FirstOrDefault(c => c.Quien == i);
                    return (object)new
                    {
                        i.Clase, i.Id, i.Este, i.Estado, i.DePresupuesto,
                        Hora = OrdenDelDia.Hora(i.Inicio),
                        Orden = i.VueltaNueva,
                        Via = cambio == null ? null : cambio.Via,
                        i.Importe,
                        ImporteNuevo = cambio == null ? null : cambio.ImporteNuevo
                    };
                }).ToList() : new List<object>(),
                Avisos = presupuesto ? new List<OrdenDelDia.Aviso>() : OrdenDelDia.Avisos(plan)
            };
        }

        // POST api/Tarifario/Impacto?id=N: qué pasaría con los viajes y presupuestos al guardar la tabla (id = 0 si es nueva),
        // sin guardar nada. La pantalla lo muestra en la confirmación antes de guardar.
        [HttpPost]
        [Route("api/Tarifario/Impacto")]
        public IHttpActionResult Impacto([FromBody] TarifarioDto dto, int id = 0)
        {
            if (dto == null) return BadRequest("No se recibieron los datos de la tabla de tarifas.");
            var errores = Validar(dto);
            if (errores.Any()) return Content(HttpStatusCode.BadRequest, errores);
            try
            {
                using (var cn = new SqlConnection(CnSql()))
                {
                    cn.Open();
                    var conflicto = ErroresDeAlcance(cn, null, id, dto);
                    if (conflicto.Any()) return Content(HttpStatusCode.BadRequest, conflicto);
                    var impacto = TarifarioImpacto.Calcular(cn, null, id, Editada(dto));
                    var sinTabla = ErroresSinTabla(impacto, dto);
                    if (sinTabla.Any()) return Content(HttpStatusCode.BadRequest, sinTabla);
                    return Ok(impacto);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // La tabla como queda al guardar, para calcular el impacto.
        private static TarifarioImpacto.TablaEditada Editada(TarifarioDto dto)
        {
            bool paraTodos = dto.Para_Todos != false;
            return new TarifarioImpacto.TablaEditada
            {
                Datos = new TarifarioCalculo.Tarifario
                {
                    Nombre = dto.Nombre.Trim(),
                    Vigente_Desde = dto.Vigente_Desde.Value.Date,
                    Para_Todos = paraTodos,
                    Anio_Corte = dto.Anio_Corte,
                    Km_Banda1 = dto.Km_Banda1,
                    Km_Banda2 = dto.Km_Banda2,
                    Km_Banda3 = dto.Km_Banda3,
                    Estadia_Modulo = dto.Estadia_Modulo,
                    Estadia_Horas_Modulo = dto.Estadia_Horas_Modulo,
                    Estadia_Desde_Horas = dto.Estadia_Desde_Horas,
                    Estadia_Desde_Horas_Larga = dto.Estadia_Desde_Horas_Larga,
                    Falso_Flete_Porcentaje = dto.Falso_Flete_Porcentaje
                },
                Valores = dto.Valores.Select(v => new TarifarioCalculo.Valores
                {
                    Modelo_Nuevo = v.Modelo_Nuevo,
                    Tipo_Vehiculo = (v.Tipo_Vehiculo ?? "").Trim(),
                    Valor_Banda1_Vuelta1 = v.Valor_Banda1_Vuelta1,
                    Valor_Banda1_Vuelta2 = v.Valor_Banda1_Vuelta2,
                    Valor_Banda2 = v.Valor_Banda2,
                    Valor_Banda3 = v.Valor_Banda3,
                    Valor_Km = v.Valor_Km
                }).ToList(),
                Clientes = paraTodos ? new List<int>() : dto.Clientes.Where(c => c > 0).Distinct().ToList()
            };
        }

        // POST api/Tarifario: tabla nueva (cuando la empresa manda la actualizada).
        [HttpPost]
        [Route("api/Tarifario")]
        public IHttpActionResult Registrar([FromBody] TarifarioDto dto)
        {
            return Guardar(0, dto);
        }

        // PUT api/Tarifario/{id}: corregir una tabla. Se recalcula lo que el cliente todavía no vio (TarifarioImpacto).
        [HttpPut]
        [Route("api/Tarifario/{id:int}")]
        public IHttpActionResult Editar(int id, [FromBody] TarifarioDto dto)
        {
            return Guardar(id, dto);
        }

        private IHttpActionResult Guardar(int id, TarifarioDto dto)
        {
            if (dto == null) return BadRequest("No se recibieron los datos de la tabla de tarifas.");
            bool alta = id == 0;
            var errores = Validar(dto);
            if (errores.Any()) return Content(HttpStatusCode.BadRequest, errores);

            try
            {
                using (var cn = new SqlConnection(CnSql()))
                {
                    cn.Open();
                    using (var tx = cn.BeginTransaction())
                    {
                        if (id > 0 && Escalar(cn, tx, "SELECT COUNT(*) FROM dbo.TARIFARIOS WHERE Tarifario_ID=@id", P("@id", id)) == 0)
                            return NotFound();

                        bool paraTodos = dto.Para_Todos != false;
                        var clientes = paraTodos ? new List<int>() : dto.Clientes.Where(c => c > 0).Distinct().ToList();
                        var conflicto = ErroresDeAlcance(cn, tx, id, dto);
                        if (conflicto.Any()) return Content(HttpStatusCode.BadRequest, conflicto);

                        // Qué pasa con los viajes y presupuestos, con las tablas como quedan (antes de escribir nada).
                        var impacto = TarifarioImpacto.Calcular(cn, tx, id, Editada(dto));
                        var sinTabla = ErroresSinTabla(impacto, dto);
                        if (sinTabla.Any()) return Content(HttpStatusCode.BadRequest, sinTabla);
                        string motivo = (dto.Motivo ?? "").Trim();
                        if (impacto.HayCambios && motivo.Length == 0)
                            return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Motivo", ErrorMessage = "Completá el motivo del cambio." } });
                        if (motivo.Length > 500)
                            return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Motivo", ErrorMessage = "El motivo puede tener hasta 500 caracteres." } });

                        var ahora = AhoraArgentina();
                        var usuario = Usuario(dto.Usuario);
                        var cabecera = new[]
                        {
                            P("@nombre", dto.Nombre.Trim()), P("@desde", dto.Vigente_Desde.Value.Date), P("@todos", paraTodos), P("@corte", dto.Anio_Corte),
                            P("@b1", dto.Km_Banda1), P("@b2", dto.Km_Banda2), P("@b3", dto.Km_Banda3), P("@modulo", dto.Estadia_Modulo),
                            P("@horas", dto.Estadia_Horas_Modulo), P("@desdeHoras", dto.Estadia_Desde_Horas),
                            P("@desdeHorasLarga", dto.Estadia_Desde_Horas_Larga), P("@falso", dto.Falso_Flete_Porcentaje),
                            P("@ahora", ahora), P("@usuario", usuario), P("@id", id)
                        };

                        // Lo que tenía, para que Auditoría diga qué cambió; y los nombres de los clientes (M7, 25/10).
                        var guardada = alta ? null : LeerGuardada(cn, tx, id);
                        var nombres = NombresClientes(cn, tx, clientes.Concat(guardada == null ? new List<int>() : guardada.Clientes));

                        if (id == 0)
                        {
                            id = Escalar(cn, tx,
                                "INSERT INTO dbo.TARIFARIOS (Nombre, Vigente_Desde, Para_Todos, Anio_Corte, Km_Banda1, Km_Banda2, Km_Banda3, Estadia_Modulo, " +
                                "Estadia_Horas_Modulo, Estadia_Desde_Horas, Estadia_Desde_Horas_Larga, Falso_Flete_Porcentaje, Fecha_Alta, Usu_Alta, Fecha_Modi, Usu_Modi) " +
                                "OUTPUT INSERTED.Tarifario_ID VALUES (@nombre, @desde, @todos, @corte, @b1, @b2, @b3, @modulo, @horas, @desdeHoras, @desdeHorasLarga, @falso, " +
                                "@ahora, @usuario, @ahora, @usuario)", cabecera);
                        }
                        else
                        {
                            Ejecutar(cn, tx,
                                "UPDATE dbo.TARIFARIOS SET Nombre=@nombre, Vigente_Desde=@desde, Para_Todos=@todos, Anio_Corte=@corte, Km_Banda1=@b1, Km_Banda2=@b2, Km_Banda3=@b3, " +
                                "Estadia_Modulo=@modulo, Estadia_Horas_Modulo=@horas, Estadia_Desde_Horas=@desdeHoras, Estadia_Desde_Horas_Larga=@desdeHorasLarga, " +
                                "Falso_Flete_Porcentaje=@falso, Fecha_Modi=@ahora, Usu_Modi=@usuario WHERE Tarifario_ID=@id", cabecera);
                            Ejecutar(cn, tx, "DELETE FROM dbo.TARIFARIO_VALORES WHERE Tarifario_ID=@id", P("@id", id));
                            Ejecutar(cn, tx, "DELETE FROM dbo.TARIFARIO_CLIENTES WHERE Tarifario_ID=@id", P("@id", id));
                        }

                        // Los clientes y las 8 filas de valores, cada uno en una sola ida a la base (registrar tardaba 8 a 9 s en la VM:
                        // M-h de la reprueba del 25/10).
                        if (clientes.Any())
                            Ejecutar(cn, tx, "INSERT INTO dbo.TARIFARIO_CLIENTES (Tarifario_ID, ClienteID) VALUES " +
                                string.Join(", ", clientes.Select((c, i) => "(@id, @c" + i + ")")),
                                new[] { P("@id", id) }.Concat(clientes.Select((c, i) => P("@c" + i, c))).ToArray());
                        var valoresSql = dto.Valores.Select((v, i) => "(@id, @nuevo" + i + ", @tipo" + i + ", @v1_" + i + ", @v2_" + i + ", @b2_" + i + ", @b3_" + i + ", @km" + i + ")");
                        var valoresParametros = new List<SqlParameter> { P("@id", id) };
                        for (int i = 0; i < dto.Valores.Count; i++)
                        {
                            var v = dto.Valores[i];
                            valoresParametros.AddRange(new[] { P("@nuevo" + i, v.Modelo_Nuevo), P("@tipo" + i, v.Tipo_Vehiculo.Trim()), P("@v1_" + i, v.Valor_Banda1_Vuelta1),
                                P("@v2_" + i, v.Valor_Banda1_Vuelta2), P("@b2_" + i, v.Valor_Banda2), P("@b3_" + i, v.Valor_Banda3), P("@km" + i, v.Valor_Km) });
                        }
                        Ejecutar(cn, tx,
                            "INSERT INTO dbo.TARIFARIO_VALORES (Tarifario_ID, Modelo_Nuevo, Tipo_Vehiculo, Valor_Banda1_Vuelta1, Valor_Banda1_Vuelta2, " +
                            "Valor_Banda2, Valor_Banda3, Valor_Km) VALUES " + string.Join(", ", valoresSql), valoresParametros.ToArray());

                        var aplicado = TarifarioImpacto.Aplicar(cn, tx, impacto, id, dto.Nombre.Trim(), alta, motivo, usuario, ahora);

                        tx.Commit();

                        string usuarioAuditoria = usuario.Length > 20 ? usuario.Substring(0, 20) : usuario;
                        var cambios = guardada == null ? new List<string>() : Cambios(guardada, dto, nombres);
                        SGTLAuditContext.RegistrarEvento(Cn(), usuarioAuditoria, alta ? "INSERT" : "UPDATE", "TARIFARIOS", "Tarifario_ID=" + id,
                            (cambios.Any() ? "Cambió: " + string.Join("; ", cambios) + ". " : "")
                            + (motivo.Length > 0 ? "Motivo: " + ConPunto(motivo) + " " : "")
                            + Cuentas(aplicado)
                            + "Queda así: " + Resumen(dto, nombres));
                        // Cada viaje y presupuesto: qué le pasó, por qué tabla y el motivo aparte (M-e de la reprueba en la VM, 25/10).
                        // Si pasa a la misma tabla que se registró o corrigió, no la nombra dos veces (M11 de Tableros en la VM,
                        // 26/10): 'Pasa a "X" por su corrección: $ a → $ b.'
                        string nombreTabla = dto.Nombre.Trim();
                        string conMotivo = motivo.Length > 0 ? " Motivo: " + ConPunto(motivo) : "";
                        string causa = ", por " + (alta ? "la tabla de tarifas nueva \"" : "la corrección de la tabla de tarifas \"") + nombreTabla + "\"." + conMotivo;
                        string porEsta = alta ? ", la tabla de tarifas nueva" : " por su corrección";
                        Func<string, bool> esEsta = nombre => string.Equals((nombre ?? "").Trim(), nombreTabla, StringComparison.OrdinalIgnoreCase);
                        foreach (var item in aplicado.Recalculados)
                        {
                            string importes = TarifarioImpacto.Pesos(item.Importe_Anterior) + " → " + TarifarioImpacto.Pesos(item.Importe_Nuevo);
                            SGTLAuditContext.RegistrarEvento(Cn(), usuarioAuditoria, "UPDATE", item.Clase == "Viaje" ? "VIAJES" : "PRESUPUESTOS",
                                (item.Clase == "Viaje" ? "Viaje_ID=" : "Presupuesto_ID=") + item.Id,
                                item.NombreTabla == null ? "Importe recalculado: " + importes + causa
                                : esEsta(item.NombreTabla) ? "Pasa a \"" + item.NombreTabla + "\"" + porEsta + ": " + importes + "." + conMotivo
                                : "Pasa a \"" + item.NombreTabla + "\": " + importes + causa);
                        }
                        foreach (var item in aplicado.CambiaronDeTabla)
                            SGTLAuditContext.RegistrarEvento(Cn(), usuarioAuditoria, "UPDATE", item.Clase == "Viaje" ? "VIAJES" : "PRESUPUESTOS",
                                (item.Clase == "Viaje" ? "Viaje_ID=" : "Presupuesto_ID=") + item.Id,
                                "Pasa a \"" + item.NombreTabla + "\"" + (esEsta(item.NombreTabla) ? porEsta + "," : "")
                                + " con el mismo importe (" + TarifarioImpacto.Pesos(item.Importe_Nuevo) + ")"
                                + (esEsta(item.NombreTabla) ? "." + conMotivo : causa));

                        return Ok(new
                        {
                            Tarifario_ID = id,
                            aplicado.ViajesRecalculados,
                            aplicado.PresupuestosRecalculados,
                            aplicado.ParaRevisar,
                            Message = (alta ? "Tabla de tarifas registrada." : "Tabla de tarifas guardada.") + Recalculado(aplicado)
                        });
                    }
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // ---------------------------------------------------------------- Para revisar (§33)
        // Cada uno ve lo que puede resolver (Rocío, 25/10): los presupuestos, quien tiene permiso de presupuestos; las
        // proformas y los comprobantes, quien gestiona proformas o cuenta corriente; los viajes que quedaron para revisar por
        // el orden del día (§43), quien gestiona viajes. Los administradores, todo. El usuario sale del token, como en
        // TablerosController.

        private static readonly string[] PermisosPresupuestos = { "Presupuestos", "Gestionar presupuestos" };
        private static readonly string[] PermisosViajes = { "Gestión de viajes", "Gestionar viajes" };
        private static readonly string[] PermisosFacturacion =
        {
            "Gestión de proformas", "Gestión de facturas", "Cuenta Corriente", "Cuenta corriente de clientes"
        };

        private class Alcance
        {
            public string Usuario { get; set; }
            public bool Presupuestos { get; set; }
            public bool Facturacion { get; set; }
            public bool Viajes { get; set; }
            public bool Ve(string tipo) { return tipo == "Presupuesto" ? Presupuestos : tipo == "Viaje" ? Viajes : Facturacion; }
        }

        // Sin token válido o con el usuario inactivo: null (la acción responde 401).
        private Alcance AlcanceDelToken()
        {
            var authorization = Request == null ? null : Request.Headers.Authorization;
            if (authorization == null || !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(authorization.Parameter)) return null;
            ClaimsPrincipal principal;
            try
            {
                SecurityToken validado;
                principal = new JwtSecurityTokenHandler().ValidateToken(authorization.Parameter, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                    ValidateIssuer = true, ValidIssuer = JwtConfig.Issuer, ValidateAudience = true, ValidAudience = JwtConfig.Audience,
                    ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1)
                }, out validado);
            }
            catch (SecurityTokenException) { return null; }
            catch (ArgumentException) { return null; }
            var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || string.IsNullOrWhiteSpace(claim.Value)) return null;

            using (var cn = new SqlConnection(CnSql()))
            {
                cn.Open();
                int id;
                bool admin;
                using (var cmd = new SqlCommand(
                    "SELECT TOP (1) Usuario_ID, CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(Rol,''))))='admin' THEN 1 ELSE 0 END AS EsAdmin " +
                    "FROM dbo.USUARIOS WHERE Nombre_Usuario=@u AND EstadoUsuario='Activo'", cn))
                {
                    cmd.Parameters.AddWithValue("@u", claim.Value);
                    using (var r = cmd.ExecuteReader())
                    {
                        if (!r.Read()) return null;
                        id = Convert.ToInt32(r["Usuario_ID"]);
                        admin = Convert.ToInt32(r["EsAdmin"]) == 1;
                    }
                }
                return new Alcance
                {
                    Usuario = claim.Value,
                    Presupuestos = admin || TienePermiso(cn, id, PermisosPresupuestos),
                    Facturacion = admin || TienePermiso(cn, id, PermisosFacturacion),
                    Viajes = admin || TienePermiso(cn, id, PermisosViajes)
                };
            }
        }

        // Algún grupo del usuario tiene alguno de esos permisos (sin distinguir mayúsculas ni tildes).
        private static bool TienePermiso(SqlConnection cn, int usuarioId, string[] permisos)
        {
            var nombres = string.Join(", ", permisos.Select((p, i) => "@p" + i));
            using (var cmd = new SqlCommand(
                "SELECT COUNT(*) FROM dbo.GRUPOS_USUARIOS gu JOIN dbo.GRUPOS_MENU gm ON gm.GrupoID = gu.GrupoID " +
                "JOIN dbo.MENU m ON m.Menu_ID = gm.MenuID WHERE gu.UsuarioID = @usuario " +
                "AND LTRIM(RTRIM(m.Menu_Nombre)) COLLATE Latin1_General_CI_AI IN (" + nombres + ")", cn))
            {
                cmd.Parameters.AddWithValue("@usuario", usuarioId);
                for (int i = 0; i < permisos.Length; i++) cmd.Parameters.AddWithValue("@p" + i, permisos[i]);
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
        }

        public class ResolverDto
        {
            public string Como { get; set; }
        }

        // GET api/Tarifario/Revisar/Alcance: qué puede ver el usuario (la tarjeta fija del dashboard aparece si ve algo).
        [HttpGet]
        [Route("api/Tarifario/Revisar/Alcance")]
        public IHttpActionResult AlcanceRevisar()
        {
            try
            {
                var alcance = AlcanceDelToken();
                if (alcance == null) return Unauthorized();
                return Ok(new { alcance.Presupuestos, alcance.Facturacion, alcance.Viajes });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // GET api/Tarifario/Revisar: lo que quedó para revisar por un cambio de tarifa y el usuario puede resolver, el más
        // nuevo primero. Con presupuestoId, proformaId o viajeId, solo lo de ese documento (el aviso de su detalle).
        [HttpGet]
        [Route("api/Tarifario/Revisar")]
        public IHttpActionResult Revisar(int presupuestoId = 0, int proformaId = 0, int viajeId = 0)
        {
            try
            {
                var alcance = AlcanceDelToken();
                if (alcance == null) return Unauthorized();
                using (var db = new DbContext(Cn()))
                    return Ok(TarifarioRevisar.Pendientes(db, presupuestoId, proformaId, viajeId).Where(f => alcance.Ve(f.Tipo)).ToList());
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // POST api/Tarifario/Revisar/{id}/Resolver: marcar como resuelto lo que se resolvió por fuera del sistema (la nota
        // de crédito o de débito de un viaje que ya estaba en un comprobante). Pide cómo se resolvió.
        [HttpPost]
        [Route("api/Tarifario/Revisar/{id:int}/Resolver")]
        public IHttpActionResult ResolverRevisar(int id, [FromBody] ResolverDto dto)
        {
            string como = dto == null ? "" : (dto.Como ?? "").Trim();
            if (como.Length == 0)
                return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Como", ErrorMessage = "Completá cómo se resolvió." } });
            try
            {
                var alcance = AlcanceDelToken();
                if (alcance == null) return Unauthorized();
                using (var db = new DbContext(Cn()))
                {
                    var tipo = TarifarioRevisar.TipoPendiente(db, id);
                    if (tipo == null) return Content(HttpStatusCode.NotFound, new { Mensaje = "Ya estaba resuelto." });
                    if (!alcance.Ve(tipo)) return Content(HttpStatusCode.Forbidden, new { Mensaje = "No tenés permiso para resolverlo." });
                    string usuario = Usuario(alcance.Usuario);
                    TarifarioRevisar.Resolver(db, usuario, como, revisarId: id);
                    SGTLAuditContext.RegistrarEvento(Cn(), usuario.Length > 20 ? usuario.Substring(0, 20) : usuario, "UPDATE", "TARIFARIO_REVISAR",
                        "Revisar_ID=" + id, "Marcado como resuelto: " + como);
                    return Ok(new { Message = "Marcado como resuelto." });
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // POST api/Tarifario/Revisar/Presupuesto/{id}/Enviado: la pantalla de presupuestos lo llama después de enviarlo por
        // e-mail; si estaba para reenviar por un cambio de tarifa, queda resuelto.
        [HttpPost]
        [Route("api/Tarifario/Revisar/Presupuesto/{id:int}/Enviado")]
        public IHttpActionResult PresupuestoEnviado(int id)
        {
            try
            {
                var alcance = AlcanceDelToken();
                if (alcance == null) return Unauthorized();
                if (!alcance.Presupuestos) return Content(HttpStatusCode.Forbidden, new { Mensaje = "No tenés permiso para resolverlo." });
                using (var db = new DbContext(Cn()))
                    return Ok(new { Resueltos = TarifarioRevisar.Resolver(db, Usuario(alcance.Usuario), "Reenviado por e-mail.", presupuestoId: id) });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // DELETE api/Tarifario/{id}: solo si no la usa ningún viaje ni un presupuesto pendiente o aceptado (sin la tabla no se
        // podría generar su viaje), y si no es la única para todos los clientes (sin ella no quedaría tarifa). Al eliminarla,
        // la anterior vuelve a valer hasta la siguiente: el "hasta" se calcula, no se guarda.
        [HttpDelete]
        [Route("api/Tarifario/{id:int}")]
        public IHttpActionResult Eliminar(int id, string usuario = null)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var t = db.Database.SqlQuery<ListaRow>(SELECT_LISTA + "WHERE t.Tarifario_ID=@id", P("@id", id)).FirstOrDefault();
                    if (t == null) return NotFound();
                    if (t.Viajes > 0)
                        return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar la tabla de tarifas: la " + (t.Viajes == 1 ? "usa 1 viaje." : "usan " + t.Viajes + " viajes.") });
                    if (t.Presupuestos > 0)
                        return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar la tabla de tarifas: la " + (t.Presupuestos == 1 ? "usa 1 presupuesto." : "usan " + t.Presupuestos + " presupuestos.") });
                    if (t.Unica_General)
                        return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar la tabla de tarifas: es la única para todos los clientes." });
                    db.Database.ExecuteSqlCommand("DELETE FROM dbo.TARIFARIOS WHERE Tarifario_ID=@id", P("@id", id));
                    var u = Usuario(usuario);
                    SGTLAuditContext.RegistrarEvento(Cn(), u.Length > 20 ? u.Substring(0, 20) : u, "DELETE", "TARIFARIOS", "Tarifario_ID=" + id,
                        t.Nombre + ", vigente desde el " + t.Vigente_Desde.ToString("dd/MM/yyyy"));
                    return Ok(new { Message = "Tabla de tarifas eliminada." });
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        private static List<object> Validar(TarifarioDto d)
        {
            var e = new List<object>();
            Action<string, string> error = (campo, mensaje) => e.Add(new { PropertyName = campo, ErrorMessage = mensaje });

            if (string.IsNullOrWhiteSpace(d.Nombre)) error("Nombre", "Completá el nombre.");
            else if (d.Nombre.Trim().Length > 100) error("Nombre", "El nombre puede tener hasta 100 caracteres.");
            if (!d.Vigente_Desde.HasValue) error("Vigente_Desde", "Completá desde cuándo está vigente.");
            if (d.Para_Todos == false && (d.Clientes == null || !d.Clientes.Any(c => c > 0)))
                error("Clientes", "Elegí al menos un cliente.");
            if (d.Anio_Corte < 1990 || d.Anio_Corte > 2100) error("Anio_Corte", "Completá el año del modelo desde el que valen los valores nuevos.");
            if (d.Km_Banda1 <= 0) error("Km_Banda1", "Tiene que ser mayor que cero.");
            if (d.Km_Banda2 <= d.Km_Banda1) error("Km_Banda2", "Tiene que ser mayor que " + d.Km_Banda1 + " km.");
            if (d.Km_Banda3 <= d.Km_Banda2) error("Km_Banda3", "Tiene que ser mayor que " + d.Km_Banda2 + " km.");
            if (d.Estadia_Modulo < 0) error("Estadia_Modulo", "No puede ser negativo.");
            if (d.Estadia_Horas_Modulo <= 0) error("Estadia_Horas_Modulo", "Tiene que ser mayor que cero.");
            if (d.Estadia_Desde_Horas < 0) error("Estadia_Desde_Horas", "No puede ser negativo.");
            if (d.Estadia_Desde_Horas_Larga < 0) error("Estadia_Desde_Horas_Larga", "No puede ser negativo.");
            if (d.Falso_Flete_Porcentaje <= 0 || d.Falso_Flete_Porcentaje > 100) error("Falso_Flete_Porcentaje", "Tiene que ser más de 0 y hasta 100.");

            var valores = d.Valores ?? new List<ValoresDto>();
            bool faltanValores = false;
            foreach (var nuevo in new[] { false, true })
                foreach (var tipo in TarifarioCalculo.TiposVehiculo)
                {
                    var fila = valores.Where(v => v != null && v.Modelo_Nuevo == nuevo && (v.Tipo_Vehiculo ?? "").Trim() == tipo).ToList();
                    string campo = "Valores." + (nuevo ? "1" : "0") + "." + tipo;
                    if (fila.Count != 1) { error(campo, "Faltan los valores de " + tipo + "."); faltanValores = true; continue; }
                    var f = fila[0];
                    if (f.Valor_Banda1_Vuelta1 <= 0 || f.Valor_Banda1_Vuelta2 <= 0 || f.Valor_Banda2 <= 0 || f.Valor_Banda3 <= 0 || f.Valor_Km <= 0)
                        error(campo, "Completá todos los valores de " + tipo + " (mayores que cero).");
                }
            if (!faltanValores && valores.Count != TarifarioCalculo.TiposVehiculo.Length * 2)
                error("Valores", "Hay valores de más: solo van los cuatro tipos de camión por antigüedad.");
            return e;
        }

        // La tabla como queda, para Auditoría (M7 de la prueba en la VM del 25/10): los clientes por su nombre y cada fila con su
        // modelo ("2018 o anterior · Furgón"), en el orden de la grilla.
        private static string Resumen(TarifarioDto d, Dictionary<int, string> nombres)
        {
            var es = new CultureInfo("es-AR");
            return ConPunto(d.Nombre.Trim() + ", vigente desde el " + d.Vigente_Desde.Value.ToString("dd/MM/yyyy")
                + (d.Para_Todos == false ? ", para " + string.Join(", ", d.Clientes.Distinct().Select(c => Nombre(nombres, c))) : ", para todos los clientes"))
                + " Bandas " + d.Km_Banda1 + " / " + d.Km_Banda2 + " / " + d.Km_Banda3 + " km; estadía " + TarifarioCalculo.Pesos(d.Estadia_Modulo)
                + " por módulo; viaje sin carga " + d.Falso_Flete_Porcentaje.ToString("0.##", es) + " %. Valores (hasta " + d.Km_Banda1 + " km 1ª y 2ª vuelta, hasta "
                + d.Km_Banda2 + ", hasta " + d.Km_Banda3 + " y por km): "
                + string.Join("; ", d.Valores.OrderBy(v => v.Modelo_Nuevo).ThenBy(v => Array.IndexOf(TarifarioCalculo.TiposVehiculo, v.Tipo_Vehiculo.Trim()))
                    .Select(v => Modelo(d.Anio_Corte, v.Modelo_Nuevo) + " · " + v.Tipo_Vehiculo.Trim() + ": "
                    + v.Valor_Banda1_Vuelta1.ToString("N0", es) + " / " + v.Valor_Banda1_Vuelta2.ToString("N0", es) + " / " + v.Valor_Banda2.ToString("N0", es)
                    + " / " + v.Valor_Banda3.ToString("N0", es) + " / " + v.Valor_Km.ToString("N0", es))) + ".";
        }

        private static string Modelo(int corte, bool nuevo) { return nuevo ? corte + " en adelante" : (corte - 1) + " o anterior"; }
        private static string Nombre(Dictionary<int, string> nombres, int cliente) { string n; return nombres.TryGetValue(cliente, out n) ? n : "el cliente #" + cliente; }

        // Lo que tenía la tabla antes de guardar.
        private class TablaGuardada
        {
            public TarifarioCalculo.Tarifario Datos;
            public List<TarifarioCalculo.Valores> Valores = new List<TarifarioCalculo.Valores>();
            public List<int> Clientes = new List<int>();
        }

        private static TablaGuardada LeerGuardada(SqlConnection cn, SqlTransaction tx, int id)
        {
            var g = new TablaGuardada();
            using (var cmd = new SqlCommand("SELECT Nombre, Vigente_Desde, Para_Todos, Anio_Corte, Km_Banda1, Km_Banda2, Km_Banda3, Estadia_Modulo, " +
                "Falso_Flete_Porcentaje FROM dbo.TARIFARIOS WHERE Tarifario_ID=@id; " +
                "SELECT Modelo_Nuevo, Tipo_Vehiculo, Valor_Banda1_Vuelta1, Valor_Banda1_Vuelta2, Valor_Banda2, Valor_Banda3, Valor_Km " +
                "FROM dbo.TARIFARIO_VALORES WHERE Tarifario_ID=@id; " +
                "SELECT ClienteID FROM dbo.TARIFARIO_CLIENTES WHERE Tarifario_ID=@id", cn, tx))
            {
                cmd.Parameters.AddWithValue("@id", id);
                using (var r = cmd.ExecuteReader())
                {
                    if (r.Read())
                        g.Datos = new TarifarioCalculo.Tarifario
                        {
                            Nombre = Convert.ToString(r["Nombre"]), Vigente_Desde = Convert.ToDateTime(r["Vigente_Desde"]),
                            Para_Todos = Convert.ToBoolean(r["Para_Todos"]), Anio_Corte = Convert.ToInt32(r["Anio_Corte"]),
                            Km_Banda1 = Convert.ToInt32(r["Km_Banda1"]), Km_Banda2 = Convert.ToInt32(r["Km_Banda2"]), Km_Banda3 = Convert.ToInt32(r["Km_Banda3"]),
                            Estadia_Modulo = Convert.ToDecimal(r["Estadia_Modulo"]), Falso_Flete_Porcentaje = Convert.ToDecimal(r["Falso_Flete_Porcentaje"])
                        };
                    r.NextResult();
                    while (r.Read())
                        g.Valores.Add(new TarifarioCalculo.Valores
                        {
                            Modelo_Nuevo = Convert.ToBoolean(r["Modelo_Nuevo"]), Tipo_Vehiculo = Convert.ToString(r["Tipo_Vehiculo"]).Trim(),
                            Valor_Banda1_Vuelta1 = Convert.ToDecimal(r["Valor_Banda1_Vuelta1"]), Valor_Banda1_Vuelta2 = Convert.ToDecimal(r["Valor_Banda1_Vuelta2"]),
                            Valor_Banda2 = Convert.ToDecimal(r["Valor_Banda2"]), Valor_Banda3 = Convert.ToDecimal(r["Valor_Banda3"]),
                            Valor_Km = Convert.ToDecimal(r["Valor_Km"])
                        });
                    r.NextResult();
                    while (r.Read()) g.Clientes.Add(Convert.ToInt32(r["ClienteID"]));
                }
            }
            return g.Datos == null ? null : g;
        }

        private static Dictionary<int, string> NombresClientes(SqlConnection cn, SqlTransaction tx, IEnumerable<int> ids)
        {
            var lista = ids.Where(c => c > 0).Distinct().ToList();
            var nombres = new Dictionary<int, string>();
            if (!lista.Any()) return nombres;
            using (var cmd = new SqlCommand("SELECT Cliente_ID, ISNULL(Razon_Social, '') AS Razon_Social FROM dbo.CLIENTES WHERE Cliente_ID IN (" +
                string.Join(", ", lista.Select((c, i) => "@c" + i)) + ")", cn, tx))
            {
                for (int i = 0; i < lista.Count; i++) cmd.Parameters.AddWithValue("@c" + i, lista[i]);
                using (var r = cmd.ExecuteReader())
                    while (r.Read()) nombres[Convert.ToInt32(r["Cliente_ID"])] = Convert.ToString(r["Razon_Social"]).Trim();
            }
            return nombres;
        }

        // Qué cambió, en palabras: "Balancín (3 ejes), 2019 en adelante, hasta 130 km, 1ª vuelta: $ 600.000,00 → $ 620.000,00".
        private static List<string> Cambios(TablaGuardada a, TarifarioDto d, Dictionary<int, string> nombres)
        {
            var es = new CultureInfo("es-AR");
            var c = new List<string>();
            if (a.Datos.Nombre.Trim() != d.Nombre.Trim()) c.Add("el nombre: \"" + a.Datos.Nombre.Trim() + "\" → \"" + d.Nombre.Trim() + "\"");
            if (a.Datos.Vigente_Desde.Date != d.Vigente_Desde.Value.Date)
                c.Add("vigente desde: " + a.Datos.Vigente_Desde.ToString("dd/MM/yyyy") + " → " + d.Vigente_Desde.Value.ToString("dd/MM/yyyy"));
            bool todos = d.Para_Todos != false;
            var nuevos = todos ? new List<int>() : d.Clientes.Where(x => x > 0).Distinct().ToList();
            if (a.Datos.Para_Todos != todos)
                c.Add(todos ? "pasa a ser para todos los clientes" : "pasa a ser solo para " + string.Join(", ", nuevos.Select(x => Nombre(nombres, x))));
            else if (!todos)
            {
                var suma = nuevos.Except(a.Clientes).ToList();
                var saca = a.Clientes.Except(nuevos).ToList();
                if (suma.Any()) c.Add("se agrega " + string.Join(", ", suma.Select(x => Nombre(nombres, x))));
                if (saca.Any()) c.Add("se saca " + string.Join(", ", saca.Select(x => Nombre(nombres, x))));
            }
            if (a.Datos.Km_Banda1 != d.Km_Banda1 || a.Datos.Km_Banda2 != d.Km_Banda2 || a.Datos.Km_Banda3 != d.Km_Banda3)
                c.Add("las bandas: " + a.Datos.Km_Banda1 + " / " + a.Datos.Km_Banda2 + " / " + a.Datos.Km_Banda3 + " km → "
                    + d.Km_Banda1 + " / " + d.Km_Banda2 + " / " + d.Km_Banda3 + " km");
            if (a.Datos.Estadia_Modulo != d.Estadia_Modulo)
                c.Add("el módulo de estadía: " + TarifarioCalculo.Pesos(a.Datos.Estadia_Modulo) + " → " + TarifarioCalculo.Pesos(d.Estadia_Modulo));
            if (a.Datos.Falso_Flete_Porcentaje != d.Falso_Flete_Porcentaje)
                c.Add("el viaje sin carga: " + a.Datos.Falso_Flete_Porcentaje.ToString("0.##", es) + " % → " + d.Falso_Flete_Porcentaje.ToString("0.##", es) + " %");
            foreach (var v in d.Valores)
            {
                var antes = a.Valores.FirstOrDefault(x => x.Modelo_Nuevo == v.Modelo_Nuevo && x.Tipo_Vehiculo == v.Tipo_Vehiculo.Trim());
                if (antes == null) continue;
                string fila = v.Tipo_Vehiculo.Trim() + ", " + Modelo(d.Anio_Corte, v.Modelo_Nuevo) + ", ";
                Action<string, decimal, decimal> valor = (campo, x, y) => { if (x != y) c.Add(fila + campo + ": " + TarifarioCalculo.Pesos(x) + " → " + TarifarioCalculo.Pesos(y)); };
                valor("hasta " + d.Km_Banda1 + " km, 1ª vuelta", antes.Valor_Banda1_Vuelta1, v.Valor_Banda1_Vuelta1);
                valor("hasta " + d.Km_Banda1 + " km, 2ª vuelta", antes.Valor_Banda1_Vuelta2, v.Valor_Banda1_Vuelta2);
                valor("hasta " + d.Km_Banda2 + " km", antes.Valor_Banda2, v.Valor_Banda2);
                valor("hasta " + d.Km_Banda3 + " km", antes.Valor_Banda3, v.Valor_Banda3);
                valor("por km", antes.Valor_Km, v.Valor_Km);
            }
            return c;
        }

        // Lo que movió el cambio, sin los que dan 0, con el mismo texto que el aviso (M2 de Tableros en la VM, 26/10):
        // "Se recalculó 1 viaje. 1 queda para revisar. 4 viajes pasaron a otra tabla con el mismo importe. ".
        private static string Cuentas(TarifarioImpacto.Aplicado a)
        {
            if (a.CambioID == 0) return "";
            var frases = new List<string>();
            if (a.ViajesRecalculados + a.PresupuestosRecalculados > 0)
            {
                // El verbo concuerda con lo primero que se nombra, como en Recalculado.
                int primero = a.ViajesRecalculados > 0 ? a.ViajesRecalculados : a.PresupuestosRecalculados;
                frases.Add("Se " + (primero == 1 ? "recalculó " : "recalcularon ") + Cantidad(a.ViajesRecalculados, a.PresupuestosRecalculados) + ".");
            }
            if (a.ParaRevisar > 0) frases.Add(a.ParaRevisar + (a.ParaRevisar == 1 ? " queda" : " quedan") + " para revisar.");
            int viajes = a.CambiaronDeTabla.Count(i => i.Clase == "Viaje");
            if (a.CambiaronDeTabla.Count > 0)
                frases.Add(Cantidad(viajes, a.CambiaronDeTabla.Count - viajes) + (a.CambiaronDeTabla.Count == 1 ? " pasó" : " pasaron")
                    + " a otra tabla con el mismo importe.");
            return frases.Any() ? string.Join(" ", frases) + " " : "";
        }

        // Termina en punto, sin repetirlo ("… S.A." no queda "S.A..").
        private static string ConPunto(string texto)
        {
            texto = (texto ?? "").Trim();
            return texto.Length == 0 || ".!?".IndexOf(texto[texto.Length - 1]) >= 0 ? texto : texto + ".";
        }

        // " Se recalcularon 6 viajes y 1 presupuesto. Quedan 3 para revisar." (o nada).
        private static string Recalculado(TarifarioImpacto.Aplicado a)
        {
            var partes = new List<string>();
            if (a.ViajesRecalculados > 0) partes.Add(a.ViajesRecalculados == 1 ? "1 viaje" : a.ViajesRecalculados + " viajes");
            if (a.PresupuestosRecalculados > 0) partes.Add(a.PresupuestosRecalculados == 1 ? "1 presupuesto" : a.PresupuestosRecalculados + " presupuestos");
            // El verbo concuerda con lo primero que se nombra: "Se recalculó 1 viaje y 1 presupuesto.", "Se recalcularon 2 viajes…"
            // (M-d de la reprueba en la VM, 25/10).
            int primero = a.ViajesRecalculados > 0 ? a.ViajesRecalculados : a.PresupuestosRecalculados;
            string texto = partes.Count == 0 ? "" : " Se " + (primero == 1 ? "recalculó " : "recalcularon ") + string.Join(" y ", partes) + ".";
            // Qué quedó para revisar, con qué es (M2 de la prueba en la VM del 25/10).
            var reenviar = a.Revisados.Where(i => i.Clase == "Presupuesto").ToList();
            int enviados = a.Revisados.Count - reenviar.Count;
            if (reenviar.Count == 1) texto += " El presupuesto #" + reenviar[0].Id + " queda para reenviar.";
            else if (reenviar.Count > 1) texto += " " + reenviar.Count + " presupuestos quedan para reenviar.";
            if (enviados == 1) texto += " 1 viaje que ya vio el cliente queda para revisar.";
            else if (enviados > 1) texto += " " + enviados + " viajes que ya vio el cliente quedan para revisar.";
            int viajes = a.CambiaronDeTabla.Count(i => i.Clase == "Viaje"), presupuestos = a.CambiaronDeTabla.Count - viajes;
            if (viajes + presupuestos > 0)
                texto += " " + Cantidad(viajes, presupuestos) + (viajes + presupuestos == 1 ? " pasó" : " pasaron") + " a otra tabla con el mismo importe.";
            return texto;
        }

        // Lo que no deja guardar según las otras tablas (se controla antes de mostrar la confirmación y otra vez al guardar):
        // dos tablas del mismo alcance que empiecen el mismo día (dos generales, o dos propias de un mismo cliente), y pasar
        // a solo algunos clientes la única para todos (sin ella, los demás clientes no tendrían tarifa; como al eliminar).
        private static List<object> ErroresDeAlcance(SqlConnection cn, SqlTransaction tx, int id, TarifarioDto dto)
        {
            var errores = new List<object>();
            bool paraTodos = dto.Para_Todos != false;
            if (paraTodos)
            {
                var otra = Texto(cn, tx, "SELECT TOP (1) Nombre FROM dbo.TARIFARIOS WHERE Para_Todos=1 AND Vigente_Desde=@d AND Tarifario_ID<>@id",
                    P("@d", dto.Vigente_Desde.Value.Date), P("@id", id));
                if (otra != null)
                    errores.Add(new { PropertyName = "Vigente_Desde",
                        ErrorMessage = "Fecha repetida: \"" + otra + "\" empieza el mismo día." });
                return errores;
            }

            if (id > 0 && Escalar(cn, tx,
                    "SELECT COUNT(*) FROM dbo.TARIFARIOS t WHERE t.Tarifario_ID=@id AND t.Para_Todos=1 " +
                    "AND NOT EXISTS (SELECT 1 FROM dbo.TARIFARIOS o WHERE o.Para_Todos=1 AND o.Tarifario_ID<>@id)", P("@id", id)) > 0)
            {
                errores.Add(new { PropertyName = "Clientes",
                    ErrorMessage = "Única tabla para todos: no puede pasar a clientes en particular." });
                return errores;
            }

            foreach (var cliente in dto.Clientes.Where(c => c > 0).Distinct())
            {
                var otra = Texto(cn, tx,
                    "SELECT TOP (1) ISNULL(c.Razon_Social, 'El cliente') + ' ya tiene \"' + t.Nombre + '\"' FROM dbo.TARIFARIOS t " +
                    "JOIN dbo.TARIFARIO_CLIENTES tc ON tc.Tarifario_ID = t.Tarifario_ID JOIN dbo.CLIENTES c ON c.Cliente_ID = tc.ClienteID " +
                    "WHERE t.Para_Todos=0 AND tc.ClienteID=@c AND t.Vigente_Desde=@d AND t.Tarifario_ID<>@id",
                    P("@c", cliente), P("@d", dto.Vigente_Desde.Value.Date), P("@id", id));
                if (otra != null)
                {
                    errores.Add(new { PropertyName = "Clientes", ErrorMessage = "Cliente con otra tabla: " + otra + " desde el mismo día." });
                    return errores;
                }
            }
            return errores;
        }

        // Si con el cambio algún viaje o presupuesto se queda sin tabla (la tabla pasa a solo algunos clientes y antes no hay
        // otra para todos, o empieza más tarde), no se guarda: el viaje quedaría con una tabla que ya no le corresponde. El
        // detalle va por cliente, con cuántos y de qué fechas: así se ve qué cliente quedó afuera o qué fechas quedan sin tabla
        // (Rocío, 25/10). Hasta 5 clientes, los que más tienen primero.
        private static List<object> ErroresSinTabla(TarifarioImpacto.Resultado impacto, TarifarioDto dto)
        {
            var sinTabla = impacto.SinTabla;
            if (!sinTabla.Any()) return new List<object>();
            var porCliente = sinTabla
                .GroupBy(i => string.IsNullOrWhiteSpace(i.Cliente) ? "Cliente sin nombre" : i.Cliente.Trim())
                .Select(g => new
                {
                    Cliente = g.Key,
                    Viajes = g.Count(i => i.Clase == "Viaje"),
                    Presupuestos = g.Count(i => i.Clase != "Viaje"),
                    Desde = g.Min(i => i.SinTablaEl.Value).Date,
                    Hasta = g.Max(i => i.SinTablaEl.Value).Date
                })
                .OrderByDescending(g => g.Viajes + g.Presupuestos).ThenBy(g => g.Cliente).ToList();
            var detalle = porCliente.Take(5).Select(g => g.Cliente + ": " + Cantidad(g.Viajes, g.Presupuestos)
                + (g.Desde == g.Hasta ? ", el " + g.Desde.ToString("dd/MM/yyyy")
                    : ", del " + g.Desde.ToString("dd/MM/yyyy") + " al " + g.Hasta.ToString("dd/MM/yyyy"))).ToList();
            if (porCliente.Count > 5) detalle.Add("y " + (porCliente.Count - 5) + (porCliente.Count == 6 ? " cliente más" : " clientes más"));

            int viajes = sinTabla.Count(i => i.Clase == "Viaje");
            var errores = new List<object> { new { PropertyName = "",
                ErrorMessage = "No se puede guardar la tabla de tarifas: " + Cantidad(viajes, sinTabla.Count - viajes)
                    + (sinTabla.Count == 1 ? " quedaría" : " quedarían") + " sin tabla.",
                Detalle = detalle } };
            // Qué cambiar, debajo del campo (M8 de la prueba en la VM del 25/10; corto y empezando por el dato, §6.3 del design
            // system, 26/10): los anteriores a la fecha nueva quedan afuera por la fecha; los demás, por los clientes.
            var porFecha = sinTabla.Where(i => i.SinTablaEl.Value.Date < dto.Vigente_Desde.Value.Date).ToList();
            if (porFecha.Any())
                errores.Add(new { PropertyName = "Vigente_Desde",
                    ErrorMessage = "Fecha no permitida: tiene que ser el " + porFecha.Min(i => i.SinTablaEl.Value).ToString("dd/MM/yyyy") + " o antes." });
            if (porFecha.Count < sinTabla.Count)
                errores.Add(new { PropertyName = "Clientes", ErrorMessage = "Faltan clientes: volvé a elegir los que quedarían sin tabla." });
            return errores;
        }

        // "3 viajes y 1 presupuesto".
        private static string Cantidad(int viajes, int presupuestos)
        {
            var partes = new List<string>();
            if (viajes > 0) partes.Add(viajes + (viajes == 1 ? " viaje" : " viajes"));
            if (presupuestos > 0) partes.Add(presupuestos + (presupuestos == 1 ? " presupuesto" : " presupuestos"));
            return string.Join(" y ", partes);
        }

        private static int Escalar(SqlConnection cn, SqlTransaction tx, string sql, params SqlParameter[] ps)
        {
            using (var cmd = new SqlCommand(sql, cn, tx))
            {
                cmd.Parameters.AddRange(ps.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());
                return Convert.ToInt32(cmd.ExecuteScalar());
            }
        }

        private static string Texto(SqlConnection cn, SqlTransaction tx, string sql, params SqlParameter[] ps)
        {
            using (var cmd = new SqlCommand(sql, cn, tx))
            {
                cmd.Parameters.AddRange(ps.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());
                var r = cmd.ExecuteScalar();
                return r == null || r == DBNull.Value ? null : Convert.ToString(r);
            }
        }

        private static void Ejecutar(SqlConnection cn, SqlTransaction tx, string sql, params SqlParameter[] ps)
        {
            using (var cmd = new SqlCommand(sql, cn, tx))
            {
                cmd.Parameters.AddRange(ps.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());
                cmd.ExecuteNonQuery();
            }
        }
    }
}
