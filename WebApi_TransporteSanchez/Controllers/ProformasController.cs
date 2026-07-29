using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Text;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    // Modulo Proformas (Fase 1). Persistencia por SQL directo (el modelo EDMX no
    // conoce las columnas nuevas ni PROFORMA_DETALLE). Auditoria manual por accion.
    [RoutePrefix("api/Proformas")]
    public class ProformasController : ApiController
    {
        // ============================ DTOs ============================
        public class DetalleLineaDto
        {
            public int? Detalle_ID { get; set; }
            public int? Orden { get; set; }
            public string Codigo { get; set; }
            public string Concepto { get; set; }
            public string Descripcion { get; set; }
            public decimal Cantidad { get; set; }
            public string Unidad { get; set; }
            public decimal PrecioUnitario { get; set; }
            public decimal DescuentoPct { get; set; }
            public decimal IvaPct { get; set; }
            public decimal Subtotal { get; set; }
        }

        public class ProformaDto
        {
            public int Proforma_ID { get; set; }
            public string Numero { get; set; }
            public string Estado { get; set; }
            public string Moneda { get; set; }
            public string Sucursal { get; set; }
            public DateTime? FechaEmision { get; set; }
            public DateTime? FechaVencimiento { get; set; }
            public int? ClienteID { get; set; }
            public string Cli_RazonSocial { get; set; }
            public string Cli_NombreComercial { get; set; }
            public string Cli_CUIT { get; set; }
            public string Cli_CondIVA { get; set; }
            public string Cli_Direccion { get; set; }
            public string Cli_Ciudad { get; set; }
            public string Cli_Provincia { get; set; }
            public string Cli_CP { get; set; }
            public string Cli_Telefono { get; set; }
            public string Cli_Email { get; set; }
            public string Cli_Contacto { get; set; }
            public string TipoServicio { get; set; }
            public string Origen { get; set; }
            public string Destino { get; set; }
            public DateTime? FechaCarga { get; set; }
            public DateTime? FechaEntrega { get; set; }
            public string TipoCarga { get; set; }
            public string Peso { get; set; }
            public string Volumen { get; set; }
            public string Bultos { get; set; }
            public string VehiculoRequerido { get; set; }
            public string ObsLogisticas { get; set; }
            public string FormaPago { get; set; }
            public string PlazoPago { get; set; }
            public string Validez { get; set; }
            public string TiempoServicio { get; set; }
            public string ObsComerciales { get; set; }
            public string CondParticulares { get; set; }
            public string Observaciones { get; set; }
            public decimal Subtotal { get; set; }
            public decimal Descuentos { get; set; }
            public decimal SubtotalNeto { get; set; }
            public decimal IVA { get; set; }
            public decimal OtrosImpuestos { get; set; }
            public decimal TotalGeneral { get; set; }
            public string Usu_Alta { get; set; }
            public string Usu_Modi { get; set; }
            public DateTime? Fecha_Alta { get; set; }
            public List<DetalleLineaDto> Detalle { get; set; }
        }

        public class CambioEstadoDto { public string Estado { get; set; } public string Usuario { get; set; } }
        public class UsuarioDto { public string Usuario { get; set; } }

        // ======================= Helpers =======================
        private static string Cn() { return ConnectionStringHelper.GetConnectionString("SGTLEntities"); }
        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }
        private static decimal Redondear(decimal v) { return decimal.Round(v, 2, MidpointRounding.AwayFromZero); }

        private static readonly string[] EstadosValidos = { "Borrador", "Generada", "Enviada", "Aceptada", "Rechazada", "Anulada" };

        private static bool TransicionPermitida(string actual, string nuevo)
        {
            actual = (actual ?? "").Trim(); nuevo = (nuevo ?? "").Trim();
            if (Array.IndexOf(EstadosValidos, nuevo) < 0) return false;
            if (nuevo == "Anulada") return actual != "Aceptada";
            switch (actual)
            {
                case "Generada": return nuevo == "Enviada" || nuevo == "Aceptada" || nuevo == "Rechazada";
                case "Enviada": return nuevo == "Aceptada" || nuevo == "Rechazada";
                case "Rechazada": return nuevo == "Enviada";
                default: return false;
            }
        }

        private static void ComputarTotales(ProformaDto p)
        {
            decimal subtotal = 0, descuentos = 0, iva = 0;
            if (p.Detalle == null) p.Detalle = new List<DetalleLineaDto>();
            foreach (var l in p.Detalle)
            {
                decimal baseLinea = l.Cantidad * l.PrecioUnitario;
                decimal descLinea = baseLinea * (l.DescuentoPct / 100m);
                decimal netoLinea = baseLinea - descLinea;
                l.Subtotal = Redondear(netoLinea);
                subtotal += baseLinea; descuentos += descLinea; iva += netoLinea * (l.IvaPct / 100m);
            }
            p.Subtotal = Redondear(subtotal);
            p.Descuentos = Redondear(descuentos);
            p.SubtotalNeto = Redondear(subtotal - descuentos);
            p.IVA = Redondear(iva);
            if (p.OtrosImpuestos < 0) p.OtrosImpuestos = 0;
            p.TotalGeneral = Redondear(p.SubtotalNeto + p.IVA + p.OtrosImpuestos);
        }

        // Parametros de negocio compartidos por INSERT y UPDATE de cabecera
        private static List<SqlParameter> ParamsNegocio(ProformaDto p)
        {
            return new List<SqlParameter>
            {
                P("@cliente", (object)p.ClienteID), P("@moneda", string.IsNullOrWhiteSpace(p.Moneda) ? "ARS" : p.Moneda),
                P("@sucursal", p.Sucursal), P("@femision", (object)p.FechaEmision), P("@fvto", (object)p.FechaVencimiento),
                P("@razon", p.Cli_RazonSocial), P("@nombre", p.Cli_NombreComercial), P("@cuit", p.Cli_CUIT),
                P("@condiva", p.Cli_CondIVA), P("@dir", p.Cli_Direccion), P("@ciudad", p.Cli_Ciudad),
                P("@prov", p.Cli_Provincia), P("@cp", p.Cli_CP), P("@tel", p.Cli_Telefono),
                P("@email", p.Cli_Email), P("@contacto", p.Cli_Contacto),
                P("@tiposervicio", p.TipoServicio), P("@origen", p.Origen), P("@destino", p.Destino),
                P("@fcarga", (object)p.FechaCarga), P("@fentrega", (object)p.FechaEntrega), P("@tipocarga", p.TipoCarga),
                P("@peso", p.Peso), P("@volumen", p.Volumen), P("@bultos", p.Bultos),
                P("@vehiculo", p.VehiculoRequerido), P("@obslog", p.ObsLogisticas),
                P("@formapago", p.FormaPago), P("@plazopago", p.PlazoPago), P("@validez", p.Validez),
                P("@tiemposervicio", p.TiempoServicio), P("@obscom", p.ObsComerciales), P("@condpart", p.CondParticulares),
                P("@observaciones", p.Observaciones),
                P("@subtotal", p.Subtotal), P("@descuentos", p.Descuentos), P("@neto", p.SubtotalNeto),
                P("@iva", p.IVA), P("@otros", p.OtrosImpuestos), P("@total", p.TotalGeneral),
                P("@cantviajes", (p.Detalle != null ? p.Detalle.Count : 0).ToString()),
                P("@fdesde", (object)p.FechaCarga), P("@fhasta", (object)p.FechaEntrega)
            };
        }

        private const string COLS =
            "ClienteID,Moneda,Sucursal,FechaEmision,FechaVencimiento," +
            "Cli_RazonSocial,Cli_NombreComercial,Cli_CUIT,Cli_CondIVA,Cli_Direccion,Cli_Ciudad,Cli_Provincia,Cli_CP,Cli_Telefono,Cli_Email,Cli_Contacto," +
            "TipoServicio,Origen,Destino,FechaCarga,FechaEntrega,TipoCarga,Peso,Volumen,Bultos,VehiculoRequerido,ObsLogisticas," +
            "FormaPago,PlazoPago,Validez,TiempoServicio,ObsComerciales,CondParticulares,Observaciones," +
            "Subtotal,Descuentos,SubtotalNeto,IVA,OtrosImpuestos,TotalGeneral,ImporteTotal," +
            "CantidadViajes,FechaDesde,FechaHasta";

        private const string VALS =
            "@cliente,@moneda,@sucursal,@femision,@fvto," +
            "@razon,@nombre,@cuit,@condiva,@dir,@ciudad,@prov,@cp,@tel,@email,@contacto," +
            "@tiposervicio,@origen,@destino,@fcarga,@fentrega,@tipocarga,@peso,@volumen,@bultos,@vehiculo,@obslog," +
            "@formapago,@plazopago,@validez,@tiemposervicio,@obscom,@condpart,@observaciones," +
            "@subtotal,@descuentos,@neto,@iva,@otros,@total,@total," +
            "@cantviajes,@fdesde,@fhasta";

        private const string SETS =
            "ClienteID=@cliente,Moneda=@moneda,Sucursal=@sucursal,FechaEmision=@femision,FechaVencimiento=@fvto," +
            "Cli_RazonSocial=@razon,Cli_NombreComercial=@nombre,Cli_CUIT=@cuit,Cli_CondIVA=@condiva,Cli_Direccion=@dir,Cli_Ciudad=@ciudad,Cli_Provincia=@prov,Cli_CP=@cp,Cli_Telefono=@tel,Cli_Email=@email,Cli_Contacto=@contacto," +
            "TipoServicio=@tiposervicio,Origen=@origen,Destino=@destino,FechaCarga=@fcarga,FechaEntrega=@fentrega,TipoCarga=@tipocarga,Peso=@peso,Volumen=@volumen,Bultos=@bultos,VehiculoRequerido=@vehiculo,ObsLogisticas=@obslog," +
            "FormaPago=@formapago,PlazoPago=@plazopago,Validez=@validez,TiempoServicio=@tiemposervicio,ObsComerciales=@obscom,CondParticulares=@condpart,Observaciones=@observaciones," +
            "Subtotal=@subtotal,Descuentos=@descuentos,SubtotalNeto=@neto,IVA=@iva,OtrosImpuestos=@otros,TotalGeneral=@total,ImporteTotal=@total," +
            "CantidadViajes=@cantviajes,FechaDesde=@fdesde,FechaHasta=@fhasta";

        private const string SELECT_HEADER =
            "SELECT Proforma_ID,Numero,Estado,Moneda,Sucursal,FechaEmision,FechaVencimiento,ClienteID," +
            "Cli_RazonSocial,Cli_NombreComercial,Cli_CUIT,Cli_CondIVA,Cli_Direccion,Cli_Ciudad,Cli_Provincia,Cli_CP,Cli_Telefono,Cli_Email,Cli_Contacto," +
            "TipoServicio,Origen,Destino,FechaCarga,FechaEntrega,TipoCarga,Peso,Volumen,Bultos,VehiculoRequerido,ObsLogisticas," +
            "FormaPago,PlazoPago,Validez,TiempoServicio,ObsComerciales,CondParticulares,Observaciones," +
            "ISNULL(Subtotal,0) AS Subtotal,ISNULL(Descuentos,0) AS Descuentos,ISNULL(SubtotalNeto,0) AS SubtotalNeto," +
            "ISNULL(IVA,0) AS IVA,ISNULL(OtrosImpuestos,0) AS OtrosImpuestos,ISNULL(TotalGeneral,ISNULL(ImporteTotal,0)) AS TotalGeneral," +
            "Usu_Alta,Usu_Modi,Fecha_Alta FROM PROFORMAS ";

        private static void InsertarDetalle(DbContext db, int pid, List<DetalleLineaDto> lineas)
        {
            db.Database.ExecuteSqlCommand("DELETE FROM PROFORMA_DETALLE WHERE Proforma_ID=@pid", P("@pid", pid));
            int orden = 1;
            foreach (var l in (lineas ?? new List<DetalleLineaDto>()))
            {
                db.Database.ExecuteSqlCommand(
                    "INSERT INTO PROFORMA_DETALLE (Proforma_ID,Orden,Codigo,Concepto,Descripcion,Cantidad,Unidad,PrecioUnitario,DescuentoPct,IvaPct,Subtotal) " +
                    "VALUES (@pid,@orden,@codigo,@concepto,@desc,@cant,@unidad,@precio,@descpct,@ivapct,@subtotal)",
                    P("@pid", pid), P("@orden", l.Orden ?? orden), P("@codigo", l.Codigo), P("@concepto", l.Concepto),
                    P("@desc", l.Descripcion), P("@cant", l.Cantidad), P("@unidad", l.Unidad), P("@precio", l.PrecioUnitario),
                    P("@descpct", l.DescuentoPct), P("@ivapct", l.IvaPct), P("@subtotal", l.Subtotal));
                orden++;
            }
        }

        private static void Auditar(DbContext db, string usuario, string accion, int id, string ant, string nue)
        {
            try
            {
                db.Database.ExecuteSqlCommand(
                    "INSERT INTO AUDITORIA (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen) " +
                    "VALUES (GETDATE(),@u,@a,'PROFORMAS',@k,@ant,@nue,NULL)",
                    P("@u", usuario), P("@a", accion), P("@k", "Proforma_ID=" + id), P("@ant", ant), P("@nue", nue));
            }
            catch { }
        }

        // ======================= Endpoints =======================

        [HttpGet]
        [Route("")]
        public IHttpActionResult Listar(string numero = null, int? clienteId = null, string estado = null,
            string desde = null, string hasta = null, string usuario = null,
            bool soloGeneradas = false, int page = 1, int pageSize = 15)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 200) pageSize = 15;
            var where = new StringBuilder(" WHERE 1=1 ");
            var ps = new List<SqlParameter>();
            if (!string.IsNullOrWhiteSpace(numero)) { where.Append(" AND Numero LIKE @numero "); ps.Add(P("@numero", "%" + numero.Trim() + "%")); }
            if (clienteId.HasValue && clienteId.Value > 0) { where.Append(" AND ClienteID=@cli "); ps.Add(P("@cli", clienteId.Value)); }
            if (!string.IsNullOrWhiteSpace(estado)) { where.Append(" AND Estado=@est "); ps.Add(P("@est", estado.Trim())); }
            if (soloGeneradas) where.Append(" AND Estado <> 'Borrador' ");
            if (!string.IsNullOrWhiteSpace(usuario)) { where.Append(" AND Usu_Alta LIKE @usu "); ps.Add(P("@usu", "%" + usuario.Trim() + "%")); }
            DateTime d;
            if (!string.IsNullOrWhiteSpace(desde) && DateTime.TryParse(desde, CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
            { where.Append(" AND ISNULL(FechaEmision,FechaCreacion) >= @desde "); ps.Add(P("@desde", d.Date)); }
            if (!string.IsNullOrWhiteSpace(hasta) && DateTime.TryParse(hasta, CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
            { where.Append(" AND ISNULL(FechaEmision,FechaCreacion) < @hasta "); ps.Add(P("@hasta", d.Date.AddDays(1))); }

            try
            {
                using (var db = new DbContext(Cn()))
                {
                    int total = db.Database.SqlQuery<int>("SELECT COUNT(*) FROM PROFORMAS" + where,
                        ps.Select(x => new SqlParameter(x.ParameterName, x.Value)).ToArray()).First();

                    var pPage = ps.Select(x => new SqlParameter(x.ParameterName, x.Value)).ToList();
                    pPage.Add(P("@off", (page - 1) * pageSize)); pPage.Add(P("@lim", pageSize));
                    string sql =
                        "SELECT Proforma_ID, Numero, ISNULL(FechaEmision,FechaCreacion) AS Fecha, ClienteID, " +
                        "Cli_RazonSocial AS Cliente, Destino, ISNULL(TotalGeneral,ISNULL(ImporteTotal,0)) AS Total, Estado, Usu_Alta AS UsuarioCreador " +
                        "FROM PROFORMAS" + where + " ORDER BY Proforma_ID DESC OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY";
                    var items = db.Database.SqlQuery<ListItem>(sql, pPage.ToArray()).ToList();
                    return Ok(new { items, total, page, pageSize, totalPages = (int)Math.Ceiling(total / (double)pageSize) });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al listar proformas.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        private class ListItem
        {
            public int Proforma_ID { get; set; }
            public string Numero { get; set; }
            public DateTime? Fecha { get; set; }
            public int? ClienteID { get; set; }
            public string Cliente { get; set; }
            public string Destino { get; set; }
            public decimal Total { get; set; }
            public string Estado { get; set; }
            public string UsuarioCreador { get; set; }
        }

        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult Obtener(int id)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var dto = db.Database.SqlQuery<ProformaDto>(SELECT_HEADER + " WHERE Proforma_ID=@id", P("@id", id)).FirstOrDefault();
                    if (dto == null) return NotFound();
                    dto.Detalle = LeerDetalle(db, id);
                    return Ok(dto);
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al obtener la proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        private static List<DetalleLineaDto> LeerDetalle(DbContext db, int id)
        {
            return db.Database.SqlQuery<DetalleLineaDto>(
                "SELECT Detalle_ID,Orden,Codigo,Concepto,Descripcion,ISNULL(Cantidad,0) AS Cantidad,Unidad," +
                "ISNULL(PrecioUnitario,0) AS PrecioUnitario,ISNULL(DescuentoPct,0) AS DescuentoPct,ISNULL(IvaPct,0) AS IvaPct,ISNULL(Subtotal,0) AS Subtotal " +
                "FROM PROFORMA_DETALLE WHERE Proforma_ID=@id ORDER BY Orden", P("@id", id)).ToList();
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Crear([FromBody] ProformaDto p)
        {
            if (p == null) return BadRequest("Datos invalidos.");
            try
            {
                ComputarTotales(p);
                using (var db = new DbContext(Cn()))
                {
                    var ps = ParamsNegocio(p);
                    ps.Add(P("@usualta", string.IsNullOrWhiteSpace(p.Usu_Alta) ? "sistema" : p.Usu_Alta));
                    string sql = "INSERT INTO PROFORMAS (" + COLS + ",Estado,FechaCreacion,Usu_Alta,Fecha_Alta) " +
                                 "OUTPUT INSERTED.Proforma_ID VALUES (" + VALS + ",'Borrador',GETDATE(),@usualta,GETDATE())";
                    int nuevoId = db.Database.SqlQuery<int>(sql, ps.ToArray()).First();
                    InsertarDetalle(db, nuevoId, p.Detalle);
                    Auditar(db, p.Usu_Alta, "INSERT", nuevoId, null, "Alta de proforma (Borrador)");
                    return Ok(new { Proforma_ID = nuevoId, Message = "Borrador guardado." });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al crear la proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Editar(int id, [FromBody] ProformaDto p)
        {
            if (p == null) return BadRequest("Datos invalidos.");
            try
            {
                ComputarTotales(p);
                using (var db = new DbContext(Cn()))
                {
                    var est = db.Database.SqlQuery<string>("SELECT Estado FROM PROFORMAS WHERE Proforma_ID=@id", P("@id", id)).FirstOrDefault();
                    if (est == null) return NotFound();
                    if (est != "Borrador") return Content(HttpStatusCode.BadRequest, new { error = "Solo se pueden editar proformas en estado Borrador." });

                    var ps = ParamsNegocio(p);
                    ps.Add(P("@usumodi", string.IsNullOrWhiteSpace(p.Usu_Modi) ? "sistema" : p.Usu_Modi));
                    ps.Add(P("@id", id));
                    db.Database.ExecuteSqlCommand("UPDATE PROFORMAS SET " + SETS + ",Usu_Modi=@usumodi,Fecha_Modi=GETDATE() WHERE Proforma_ID=@id", ps.ToArray());
                    InsertarDetalle(db, id, p.Detalle);
                    Auditar(db, p.Usu_Modi, "UPDATE", id, null, "Edicion de proforma (Borrador)");
                    return Ok(new { Message = "Proforma actualizada." });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al editar la proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPost]
        [Route("{id:int}/Generar")]
        public IHttpActionResult Generar(int id, [FromBody] UsuarioDto body)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var h = db.Database.SqlQuery<GenChk>(
                        "SELECT Estado, ClienteID, ISNULL(TotalGeneral,0) AS Total, Origen, Destino FROM PROFORMAS WHERE Proforma_ID=@id", P("@id", id)).FirstOrDefault();
                    if (h == null) return NotFound();
                    if (h.Estado != "Borrador") return Content(HttpStatusCode.BadRequest, new { error = "Solo se genera desde Borrador." });

                    var errores = new List<string>();
                    if (!h.ClienteID.HasValue || h.ClienteID.Value <= 0) errores.Add("Falta el cliente.");
                    int lineas = db.Database.SqlQuery<int>("SELECT COUNT(*) FROM PROFORMA_DETALLE WHERE Proforma_ID=@id", P("@id", id)).First();
                    if (lineas == 0) errores.Add("Debe tener al menos un concepto.");
                    if (h.Total <= 0) errores.Add("El total debe ser mayor a cero.");
                    if (string.IsNullOrWhiteSpace(h.Origen)) errores.Add("Falta el origen.");
                    if (string.IsNullOrWhiteSpace(h.Destino)) errores.Add("Falta el destino.");
                    if (errores.Count > 0) return Content(HttpStatusCode.BadRequest, new { errores });

                    int n = db.Database.SqlQuery<int>("SELECT NEXT VALUE FOR dbo.SEQ_PROFORMA").First();
                    string numero = "PF-" + n.ToString("D8");
                    string usu = body != null ? body.Usuario : null;
                    db.Database.ExecuteSqlCommand(
                        "UPDATE PROFORMAS SET Numero=@num, Estado='Generada', FechaEmision=ISNULL(FechaEmision,GETDATE()), Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Proforma_ID=@id",
                        P("@num", numero), P("@u", usu), P("@id", id));
                    Auditar(db, usu, "GENERAR", id, "Estado=Borrador", "Estado=Generada; Numero=" + numero);
                    return Ok(new { Proforma_ID = id, Numero = numero, Estado = "Generada", Message = "Proforma generada." });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al generar la proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        private class GenChk { public string Estado { get; set; } public int? ClienteID { get; set; } public decimal Total { get; set; } public string Origen { get; set; } public string Destino { get; set; } }

        [HttpPost]
        [Route("{id:int}/Estado")]
        public IHttpActionResult CambiarEstado(int id, [FromBody] CambioEstadoDto body)
        {
            if (body == null || string.IsNullOrWhiteSpace(body.Estado)) return BadRequest("Falta el estado.");
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var est = db.Database.SqlQuery<string>("SELECT Estado FROM PROFORMAS WHERE Proforma_ID=@id", P("@id", id)).FirstOrDefault();
                    if (est == null) return NotFound();
                    if (!TransicionPermitida(est, body.Estado))
                        return Content(HttpStatusCode.BadRequest, new { error = "Transicion no permitida: " + est + " -> " + body.Estado });
                    db.Database.ExecuteSqlCommand("UPDATE PROFORMAS SET Estado=@e, Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Proforma_ID=@id",
                        P("@e", body.Estado.Trim()), P("@u", body.Usuario), P("@id", id));
                    Auditar(db, body.Usuario, "ESTADO", id, "Estado=" + est, "Estado=" + body.Estado.Trim());
                    return Ok(new { Proforma_ID = id, Estado = body.Estado.Trim(), Message = "Estado actualizado." });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al cambiar el estado.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPost]
        [Route("{id:int}/Anular")]
        public IHttpActionResult Anular(int id, [FromBody] UsuarioDto body)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var est = db.Database.SqlQuery<string>("SELECT Estado FROM PROFORMAS WHERE Proforma_ID=@id", P("@id", id)).FirstOrDefault();
                    if (est == null) return NotFound();
                    if (est == "Aceptada") return Content(HttpStatusCode.BadRequest, new { error = "No se puede anular una proforma Aceptada." });
                    if (est == "Anulada") return Content(HttpStatusCode.BadRequest, new { error = "La proforma ya esta anulada." });
                    db.Database.ExecuteSqlCommand("UPDATE PROFORMAS SET Estado='Anulada', Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Proforma_ID=@id",
                        P("@u", body != null ? body.Usuario : null), P("@id", id));
                    Auditar(db, body != null ? body.Usuario : null, "ANULAR", id, "Estado=" + est, "Estado=Anulada");
                    return Ok(new { Message = "Proforma anulada." });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al anular la proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPost]
        [Route("{id:int}/Duplicar")]
        public IHttpActionResult Duplicar(int id, [FromBody] UsuarioDto body)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var o = db.Database.SqlQuery<ProformaDto>(SELECT_HEADER + " WHERE Proforma_ID=@id", P("@id", id)).FirstOrDefault();
                    if (o == null) return NotFound();
                    o.Detalle = LeerDetalle(db, id);
                    foreach (var l in o.Detalle) l.Detalle_ID = null;
                    o.Usu_Alta = body != null ? body.Usuario : o.Usu_Alta;
                    ComputarTotales(o);

                    var ps = ParamsNegocio(o);
                    ps.Add(P("@usualta", string.IsNullOrWhiteSpace(o.Usu_Alta) ? "sistema" : o.Usu_Alta));
                    string sql = "INSERT INTO PROFORMAS (" + COLS + ",Estado,FechaCreacion,Usu_Alta,Fecha_Alta) " +
                                 "OUTPUT INSERTED.Proforma_ID VALUES (" + VALS + ",'Borrador',GETDATE(),@usualta,GETDATE())";
                    int nuevoId = db.Database.SqlQuery<int>(sql, ps.ToArray()).First();
                    InsertarDetalle(db, nuevoId, o.Detalle);
                    Auditar(db, o.Usu_Alta, "DUPLICAR", nuevoId, "Origen Proforma_ID=" + id, "Alta de proforma duplicada (Borrador)");
                    return Ok(new { Proforma_ID = nuevoId, Message = "Proforma duplicada como borrador." });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al duplicar la proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // Prellenado desde viajes: usa entidades del EDMX (VIAJES/TARIFAS/ORIGEN/DESTINO), que si estan mapeadas.
        [HttpGet]
        [Route("PrellenarViajes")]
        public IHttpActionResult PrellenarViajes(int clienteId, string desde, string hasta)
        {
            DateTime d1, d2;
            if (!DateTime.TryParse(desde, CultureInfo.InvariantCulture, DateTimeStyles.None, out d1) ||
                !DateTime.TryParse(hasta, CultureInfo.InvariantCulture, DateTimeStyles.None, out d2))
                return BadRequest("Fechas invalidas.");
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var hastaFin = d2.Date.AddDays(1).AddTicks(-1);
                    var fijas = db.Set<TARIFAS_FIJAS>().Select(t => new { t.TarifaFija_ID, t.ValorFijoNeto }).ToList().ToDictionary(t => t.TarifaFija_ID, t => t.ValorFijoNeto);
                    var kms = db.Set<TARIFAS_KM>().Select(t => new { t.TarifaKm_ID, t.ValorKm }).ToList().ToDictionary(t => t.TarifaKm_ID, t => t.ValorKm);
                    var filas = (from v in db.Set<VIAJES>()
                                 join o in db.Set<ORIGEN>() on v.OrigenID equals o.Origen_ID into oj
                                 from o in oj.DefaultIfEmpty()
                                 join de in db.Set<DESTINO>() on v.DestinoID equals de.Destino_ID into dj
                                 from de in dj.DefaultIfEmpty()
                                 where v.ClienteID == clienteId && v.Fecha_Inicio >= d1.Date && v.Fecha_Inicio <= hastaFin
                                 orderby v.Fecha_Inicio
                                 select new { v.Viaje_ID, v.Fecha_Inicio, Origen = o != null ? o.Descripcion : "", Destino = de != null ? de.Descripcion : "", v.Num_Remito, v.Distancia_KM, v.TarifaFijaID, v.TarifaKmID }).ToList();

                    var lineas = new List<DetalleLineaDto>();
                    int orden = 1;
                    foreach (var f in filas)
                    {
                        decimal importe = 0;
                        if (f.TarifaFijaID.HasValue && f.TarifaFijaID.Value > 0 && fijas.ContainsKey(f.TarifaFijaID.Value)) importe = fijas[f.TarifaFijaID.Value];
                        else if (f.TarifaKmID.HasValue && f.TarifaKmID.Value > 0 && kms.ContainsKey(f.TarifaKmID.Value)) importe = kms[f.TarifaKmID.Value] * ParseDec(f.Distancia_KM);
                        lineas.Add(new DetalleLineaDto
                        {
                            Orden = orden++, Codigo = "V" + f.Viaje_ID, Concepto = "Viaje " + f.Origen + " -> " + f.Destino,
                            Descripcion = f.Fecha_Inicio.ToString("dd/MM/yyyy") + (string.IsNullOrWhiteSpace(f.Num_Remito) ? "" : (" - Remito " + f.Num_Remito)),
                            Cantidad = 1, Unidad = "Viaje", PrecioUnitario = Redondear(importe), DescuentoPct = 0, IvaPct = 21
                        });
                    }
                    return Ok(lineas);
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al prellenar desde viajes.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        private static decimal ParseDec(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return 0;
            decimal v;
            return decimal.TryParse(raw.Trim().Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out v) ? v : 0;
        }
    }
}