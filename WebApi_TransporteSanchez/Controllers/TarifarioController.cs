using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Web.Http;
using WebApi_TransporteSanchez.Tarifas;

namespace WebApi_TransporteSanchez.Controllers
{
    /// <summary>
    /// Tarifario por tipo de camión (tablas TARIFARIOS y TARIFARIO_VALORES, database/tarifas/02 y 03; fuera del EDMX).
    /// Cada versión vale desde Vigente_Desde hasta la versión siguiente. El viaje guarda su importe: editar una versión
    /// no cambia los viajes ya calculados.
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
        }

        private class ListaRow
        {
            public int Tarifario_ID { get; set; }
            public string Nombre { get; set; }
            public DateTime Vigente_Desde { get; set; }
            public DateTime? Vigente_Hasta { get; set; }
            public int Viajes { get; set; }
            public DateTime Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }
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

        private const string SELECT_LISTA =
            "SELECT t.Tarifario_ID, t.Nombre, t.Vigente_Desde, " +
            "(SELECT DATEADD(day, -1, MIN(s.Vigente_Desde)) FROM dbo.TARIFARIOS s WHERE s.Vigente_Desde > t.Vigente_Desde) AS Vigente_Hasta, " +
            "(SELECT COUNT(*) FROM dbo.VIAJES v WHERE v.TarifarioID = t.Tarifario_ID) AS Viajes, t.Fecha_Modi, t.Usu_Modi " +
            "FROM dbo.TARIFARIOS t ";

        // GET api/Tarifario: las versiones, la más nueva primero.
        [HttpGet]
        [Route("api/Tarifario")]
        public IHttpActionResult Listar()
        {
            try
            {
                using (var db = new DbContext(Cn()))
                    return Ok(db.Database.SqlQuery<ListaRow>(SELECT_LISTA + "ORDER BY t.Vigente_Desde DESC").ToList());
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
                        "SELECT Tarifario_ID, Nombre, Vigente_Desde, Anio_Corte, Km_Banda1, Km_Banda2, Km_Banda3, Estadia_Modulo, " +
                        "Estadia_Horas_Modulo, Estadia_Desde_Horas, Estadia_Desde_Horas_Larga, Falso_Flete_Porcentaje " +
                        "FROM dbo.TARIFARIOS WHERE Tarifario_ID=@id", P("@id", id)).FirstOrDefault();
                    if (t == null) return NotFound();
                    var lista = db.Database.SqlQuery<ListaRow>(SELECT_LISTA + "WHERE t.Tarifario_ID=@id", P("@id", id)).First();
                    var valores = db.Database.SqlQuery<TarifarioCalculo.Valores>(
                        "SELECT Tarifario_ID, Modelo_Nuevo, Tipo_Vehiculo, Valor_Banda1_Vuelta1, Valor_Banda1_Vuelta2, Valor_Banda2, Valor_Banda3, Valor_Km " +
                        "FROM dbo.TARIFARIO_VALORES WHERE Tarifario_ID=@id", P("@id", id)).ToList();
                    return Ok(new
                    {
                        t.Tarifario_ID, t.Nombre, t.Vigente_Desde, lista.Vigente_Hasta, lista.Viajes, lista.Fecha_Modi, lista.Usu_Modi,
                        t.Anio_Corte, t.Km_Banda1, t.Km_Banda2, t.Km_Banda3, t.Estadia_Modulo, t.Estadia_Horas_Modulo,
                        t.Estadia_Desde_Horas, t.Estadia_Desde_Horas_Larga, t.Falso_Flete_Porcentaje,
                        Valores = valores.OrderBy(v => v.Modelo_Nuevo).ThenBy(v => Array.IndexOf(TarifarioCalculo.TiposVehiculo, v.Tipo_Vehiculo)).ToList()
                    });
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // GET api/Tarifario/Vigente?fecha=AAAA-MM-DD: la versión vigente ese día (sin fecha, hoy). 404 si no hay.
        [HttpGet]
        [Route("api/Tarifario/Vigente")]
        public IHttpActionResult Vigente(string fecha = null)
        {
            DateTime dia;
            if (string.IsNullOrWhiteSpace(fecha)) dia = AhoraArgentina().Date;
            else if (!DateTime.TryParseExact(fecha, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out dia))
                return BadRequest("La fecha no es válida.");
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var t = TarifarioCalculo.Vigente(db, dia);
                    if (t == null) return Content(HttpStatusCode.NotFound, new { Mensaje = "No hay tarifario vigente el " + dia.ToString("dd/MM/yyyy") + "." });
                    return Ok(t);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // GET api/Tarifario/Calcular: el importe del viaje con lo que hay en pantalla, con el mismo cálculo que se guarda.
        // tarifa: "tarifario", "fija" o "km". Devuelve también si corresponde la 2ª vuelta (otro viaje del camión ese día).
        [HttpGet]
        [Route("api/Tarifario/Calcular")]
        public IHttpActionResult Calcular(string tarifa, string fechaInicio, int camionId = 0, string km = null, int? vuelta = null,
            bool falsoFlete = false, int estadia = 0, int? tarifaFijaId = null, int? tarifaKmId = null, int viajeId = 0,
            string origen = null, string destino = null)
        {
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
                UsaTarifario = tarifa == "tarifario",
                TarifaFijaID = tarifa == "fija" ? tarifaFijaId : null,
                TarifaKmID = tarifa == "km" ? tarifaKmId : null,
                FechaInicio = inicio,
                CamionID = camionId,
                Km = kmPedido,
                Vuelta = vuelta,
                FalsoFlete = falsoFlete,
                EstadiaModulos = estadia,
                Origen = origen,
                Destino = destino
            };

            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var r = TarifarioCalculo.Calcular(db, pedido);
                    var anterior = TarifarioCalculo.ViajeAnteriorDelDia(db, camionId, inicio, viajeId);
                    if (!r.Ok) return Content(HttpStatusCode.NotFound, new { Mensaje = r.Mensaje });
                    return Ok(new
                    {
                        r.TarifarioID, r.Tarifario, r.TipoVehiculo, r.ModeloNuevo, r.Banda, r.AplicaVuelta, r.Vuelta,
                        r.ImporteBase, r.TarifaDetalle, r.FalsoFlete, r.FalsoFletePorcentaje, r.Estadia, r.EstadiaModulo,
                        r.Importe, r.ImporteDetalle,
                        VueltaSugerida = anterior.HasValue ? 2 : 1,
                        ViajeAnterior = anterior
                    });
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // POST api/Tarifario: versión nueva (por ejemplo, cuando llega la tabla del mes siguiente).
        [HttpPost]
        [Route("api/Tarifario")]
        public IHttpActionResult Registrar([FromBody] TarifarioDto dto)
        {
            return Guardar(0, dto);
        }

        // PUT api/Tarifario/{id}: corregir una versión. Los viajes ya calculados conservan su importe.
        [HttpPut]
        [Route("api/Tarifario/{id:int}")]
        public IHttpActionResult Editar(int id, [FromBody] TarifarioDto dto)
        {
            return Guardar(id, dto);
        }

        private IHttpActionResult Guardar(int id, TarifarioDto dto)
        {
            if (dto == null) return BadRequest("No se recibieron los datos del tarifario.");
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

                        var mismaFecha = Escalar(cn, tx, "SELECT ISNULL(MAX(Tarifario_ID), 0) FROM dbo.TARIFARIOS WHERE Vigente_Desde=@d AND Tarifario_ID<>@id",
                            P("@d", dto.Vigente_Desde.Value.Date), P("@id", id));
                        if (mismaFecha > 0)
                            return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Vigente_Desde",
                                ErrorMessage = "Ya hay una versión del tarifario vigente desde el " + dto.Vigente_Desde.Value.ToString("dd/MM/yyyy") + ". Elegí otra fecha o editá esa versión." } });

                        var ahora = AhoraArgentina();
                        var usuario = Usuario(dto.Usuario);
                        var cabecera = new[]
                        {
                            P("@nombre", dto.Nombre.Trim()), P("@desde", dto.Vigente_Desde.Value.Date), P("@corte", dto.Anio_Corte),
                            P("@b1", dto.Km_Banda1), P("@b2", dto.Km_Banda2), P("@b3", dto.Km_Banda3), P("@modulo", dto.Estadia_Modulo),
                            P("@horas", dto.Estadia_Horas_Modulo), P("@desdeHoras", dto.Estadia_Desde_Horas),
                            P("@desdeHorasLarga", dto.Estadia_Desde_Horas_Larga), P("@falso", dto.Falso_Flete_Porcentaje),
                            P("@ahora", ahora), P("@usuario", usuario), P("@id", id)
                        };

                        if (id == 0)
                        {
                            id = Escalar(cn, tx,
                                "INSERT INTO dbo.TARIFARIOS (Nombre, Vigente_Desde, Anio_Corte, Km_Banda1, Km_Banda2, Km_Banda3, Estadia_Modulo, " +
                                "Estadia_Horas_Modulo, Estadia_Desde_Horas, Estadia_Desde_Horas_Larga, Falso_Flete_Porcentaje, Fecha_Alta, Usu_Alta, Fecha_Modi, Usu_Modi) " +
                                "OUTPUT INSERTED.Tarifario_ID VALUES (@nombre, @desde, @corte, @b1, @b2, @b3, @modulo, @horas, @desdeHoras, @desdeHorasLarga, @falso, " +
                                "@ahora, @usuario, @ahora, @usuario)", cabecera);
                        }
                        else
                        {
                            Ejecutar(cn, tx,
                                "UPDATE dbo.TARIFARIOS SET Nombre=@nombre, Vigente_Desde=@desde, Anio_Corte=@corte, Km_Banda1=@b1, Km_Banda2=@b2, Km_Banda3=@b3, " +
                                "Estadia_Modulo=@modulo, Estadia_Horas_Modulo=@horas, Estadia_Desde_Horas=@desdeHoras, Estadia_Desde_Horas_Larga=@desdeHorasLarga, " +
                                "Falso_Flete_Porcentaje=@falso, Fecha_Modi=@ahora, Usu_Modi=@usuario WHERE Tarifario_ID=@id", cabecera);
                            Ejecutar(cn, tx, "DELETE FROM dbo.TARIFARIO_VALORES WHERE Tarifario_ID=@id", P("@id", id));
                        }

                        foreach (var v in dto.Valores)
                        {
                            Ejecutar(cn, tx,
                                "INSERT INTO dbo.TARIFARIO_VALORES (Tarifario_ID, Modelo_Nuevo, Tipo_Vehiculo, Valor_Banda1_Vuelta1, Valor_Banda1_Vuelta2, " +
                                "Valor_Banda2, Valor_Banda3, Valor_Km) VALUES (@id, @nuevo, @tipo, @v1, @v2, @b2, @b3, @km)",
                                P("@id", id), P("@nuevo", v.Modelo_Nuevo), P("@tipo", v.Tipo_Vehiculo.Trim()), P("@v1", v.Valor_Banda1_Vuelta1),
                                P("@v2", v.Valor_Banda1_Vuelta2), P("@b2", v.Valor_Banda2), P("@b3", v.Valor_Banda3), P("@km", v.Valor_Km));
                        }

                        tx.Commit();

                        SGTLAuditContext.RegistrarEvento(Cn(), usuario.Length > 20 ? usuario.Substring(0, 20) : usuario, alta ? "INSERT" : "UPDATE",
                            "TARIFARIOS", "Tarifario_ID=" + id, Resumen(dto));
                        return Ok(new { Tarifario_ID = id, Message = alta ? "Tarifario registrado." : "Tarifario guardado." });
                    }
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // DELETE api/Tarifario/{id}: solo si ningún viaje lo usa.
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
                        return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar el tarifario: lo usan " + t.Viajes + (t.Viajes == 1 ? " viaje." : " viajes.") });
                    db.Database.ExecuteSqlCommand("DELETE FROM dbo.TARIFARIOS WHERE Tarifario_ID=@id", P("@id", id));
                    var u = Usuario(usuario);
                    SGTLAuditContext.RegistrarEvento(Cn(), u.Length > 20 ? u.Substring(0, 20) : u, "DELETE", "TARIFARIOS", "Tarifario_ID=" + id,
                        t.Nombre + ", vigente desde el " + t.Vigente_Desde.ToString("dd/MM/yyyy"));
                    return Ok(new { Message = "Tarifario eliminado." });
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
            if (!d.Vigente_Desde.HasValue) error("Vigente_Desde", "Completá desde cuándo vale.");
            if (d.Anio_Corte < 1990 || d.Anio_Corte > 2100) error("Anio_Corte", "Completá el año del modelo desde el que valen los valores nuevos.");
            if (d.Km_Banda1 <= 0) error("Km_Banda1", "Tiene que ser mayor que cero.");
            if (d.Km_Banda2 <= d.Km_Banda1) error("Km_Banda2", "Tiene que ser mayor que " + d.Km_Banda1 + ".");
            if (d.Km_Banda3 <= d.Km_Banda2) error("Km_Banda3", "Tiene que ser mayor que " + d.Km_Banda2 + ".");
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

        private static string Resumen(TarifarioDto d)
        {
            var es = new CultureInfo("es-AR");
            return d.Nombre.Trim() + ", vigente desde el " + d.Vigente_Desde.Value.ToString("dd/MM/yyyy") + ". Corte " + d.Anio_Corte
                + "; bandas " + d.Km_Banda1 + " / " + d.Km_Banda2 + " / " + d.Km_Banda3 + " km; estadía " + TarifarioCalculo.Pesos(d.Estadia_Modulo)
                + " por módulo; falso flete " + d.Falso_Flete_Porcentaje.ToString("0.##", es) + " %. "
                + string.Join("; ", d.Valores.OrderBy(v => v.Modelo_Nuevo).Select(v => (v.Modelo_Nuevo ? "Nuevo " : "Anterior ") + v.Tipo_Vehiculo.Trim() + ": "
                    + v.Valor_Banda1_Vuelta1.ToString("N0", es) + " / " + v.Valor_Banda1_Vuelta2.ToString("N0", es) + " / " + v.Valor_Banda2.ToString("N0", es)
                    + " / " + v.Valor_Banda3.ToString("N0", es) + " / " + v.Valor_Km.ToString("N0", es) + " por km"));
        }

        private static int Escalar(SqlConnection cn, SqlTransaction tx, string sql, params SqlParameter[] ps)
        {
            using (var cmd = new SqlCommand(sql, cn, tx))
            {
                cmd.Parameters.AddRange(ps.Select(p => new SqlParameter(p.ParameterName, p.Value)).ToArray());
                return Convert.ToInt32(cmd.ExecuteScalar());
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
