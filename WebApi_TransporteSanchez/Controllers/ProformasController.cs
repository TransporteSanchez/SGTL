using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
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
            // Período de los viajes que incluye la proforma ("Fecha de inicio / fin" de la pantalla).
            public DateTime? FechaDesde { get; set; }
            public DateTime? FechaHasta { get; set; }
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
            // Propia o Plataforma (database/proformas-plataforma/01_plataformas_y_proformas.sql).
            public string Tipo_Proforma { get; set; }
            public List<DetalleLineaDto> Detalle { get; set; }
        }

        public class CambioEstadoDto { public string Estado { get; set; } public string Usuario { get; set; } }
        public class UsuarioDto { public string Usuario { get; set; } }
        // ======================= Importe de SGTL de un viaje =======================
        // Un solo cálculo para "Traer viajes" (PrellenarViajes) y el control de la proforma de plataforma
        // (ProformasPlataformaController), para que den lo mismo: presupuesto aceptado; si no, tarifa fija;
        // si no, tarifa por km × km.

        private class TarifaValor { public int Id { get; set; } public decimal Valor { get; set; } }
        private class PresupuestoViaje { public int ViajeID { get; set; } public int Presupuesto_ID { get; set; } public string Datos { get; set; } }

        internal class TarifasViaje
        {
            internal Dictionary<int, decimal> Fijas;
            internal Dictionary<int, decimal> Kms;
            internal Dictionary<int, int> PresupuestoId;
            internal Dictionary<int, string> PresupuestoDatos;
        }

        internal class ImporteViajeResultado
        {
            internal decimal? Importe;          // null: sin tarifa o presupuesto inválido
            internal string TarifaUsada;        // para mostrar: "Tarifa fija #3 · A → B · $528.747"
            internal bool PresupuestoInvalido;  // tiene presupuesto aceptado sin un importe válido
        }

        internal static TarifasViaje CargarTarifas(DbContext db)
        {
            var presupuestos = db.Database.SqlQuery<PresupuestoViaje>(
                "SELECT ViajeID, Presupuesto_ID, Datos FROM dbo.PRESUPUESTOS WHERE ViajeID IS NOT NULL AND Estado='Aceptado'").ToList();
            return new TarifasViaje
            {
                Fijas = db.Database.SqlQuery<TarifaValor>("SELECT TarifaFija_ID AS Id, ValorFijoNeto AS Valor FROM dbo.TARIFAS_FIJAS")
                    .ToList().ToDictionary(t => t.Id, t => t.Valor),
                Kms = db.Database.SqlQuery<TarifaValor>("SELECT TarifaKm_ID AS Id, ValorKm AS Valor FROM dbo.TARIFAS_KM")
                    .ToList().ToDictionary(t => t.Id, t => t.Valor),
                PresupuestoId = presupuestos.ToDictionary(x => x.ViajeID, x => x.Presupuesto_ID),
                PresupuestoDatos = presupuestos.ToDictionary(x => x.ViajeID, x => x.Datos)
            };
        }

        private static readonly CultureInfo EsAr = new CultureInfo("es-AR");
        private static string Pesos(decimal v) { return "$" + v.ToString("N0", EsAr); }

        internal static ImporteViajeResultado ImporteViaje(TarifasViaje t, int viajeId, int? tarifaFijaId, int? tarifaKmId,
            string distanciaKm, string origen, string destino)
        {
            var r = new ImporteViajeResultado();
            if (t.PresupuestoDatos.ContainsKey(viajeId))
            {
                int presupuestoId = t.PresupuestoId[viajeId];
                decimal importe;
                try
                {
                    var json = Newtonsoft.Json.Linq.JObject.Parse(t.PresupuestoDatos[viajeId]);
                    if (decimal.TryParse((string)json["importe"], NumberStyles.Number, CultureInfo.InvariantCulture, out importe) && importe >= 0)
                    {
                        r.Importe = importe;
                        r.TarifaUsada = "Presupuesto #" + presupuestoId + " · " + Pesos(importe);
                        return r;
                    }
                }
                catch { }
                r.PresupuestoInvalido = true;
                r.TarifaUsada = "Presupuesto #" + presupuestoId + " sin importe válido";
                return r;
            }
            if (tarifaFijaId.HasValue && tarifaFijaId.Value > 0 && t.Fijas.ContainsKey(tarifaFijaId.Value))
            {
                var valor = t.Fijas[tarifaFijaId.Value];
                r.Importe = valor;
                r.TarifaUsada = "Tarifa fija #" + tarifaFijaId.Value + " · " + origen + " → " + destino + " · " + Pesos(valor);
                return r;
            }
            if (tarifaKmId.HasValue && tarifaKmId.Value > 0 && t.Kms.ContainsKey(tarifaKmId.Value))
            {
                decimal km = ParseDec(distanciaKm);
                var valorKm = t.Kms[tarifaKmId.Value];
                r.Importe = valorKm * km;
                r.TarifaUsada = "Tarifa por km #" + tarifaKmId.Value + " · " + km.ToString("0.#", EsAr) + " km × " + Pesos(valorKm);
                return r;
            }
            r.TarifaUsada = "Sin tarifa";
            return r;
        }

        // ======================= Helpers =======================
        private static string Cn() { return ConnectionStringHelper.GetConnectionString("SGTLEntities"); }
        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }
        private static decimal Redondear(decimal v) { return decimal.Round(v, 2, MidpointRounding.AwayFromZero); }
        private static readonly Regex CodigoViaje = new Regex(@"^V([1-9][0-9]*)$",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        private static readonly string[] EstadosValidos = { "Borrador", "Generada", "Aceptada", "Facturada", "Anulada" };

        private static bool TransicionPermitida(string actual, string nuevo)
        {
            actual = (actual ?? "").Trim(); nuevo = (nuevo ?? "").Trim();
            if (Array.IndexOf(EstadosValidos, nuevo) < 0) return false;
            // Facturada es un estado terminal, asignado exclusivamente al emitir la Factura.
            if (actual == "Facturada" || nuevo == "Facturada") return false;
            // La anulacion de una Factura se documenta mediante una Nota de Credito cancelatoria.
            if (nuevo == "Anulada") return false;
            switch (actual)
            {
                case "Generada": return nuevo == "Aceptada";
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

        // Cond_Fiscal es el código interno de la condición de IVA del cliente.
        // La Proforma guarda la descripción legible como foto del dato al emitirla.
        private static void ActualizarCondicionIvaDesdeCliente(DbContext db, ProformaDto p)
        {
            p.Cli_CondIVA = null;
            if (!p.ClienteID.HasValue || p.ClienteID.Value <= 0) return;

            p.Cli_CondIVA = db.Database.SqlQuery<string>(@"
SELECT CASE Cond_Fiscal
    WHEN 1 THEN N'Responsable Inscripto'
    WHEN 2 THEN N'Monotributista'
    WHEN 3 THEN N'Exento'
END
FROM dbo.CLIENTES
WHERE Cliente_ID=@cliente;", P("@cliente", p.ClienteID.Value)).FirstOrDefault();
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
                // Período de los viajes. FechaDesde y FechaHasta no admiten nulos en la base: si no se cargó, la fecha del día.
                P("@fdesde", (object)(p.FechaDesde ?? DateTime.Today)),
                P("@fhasta", (object)(p.FechaHasta ?? p.FechaDesde ?? DateTime.Today))
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
            "FechaDesde,FechaHasta,Usu_Alta,Usu_Modi,Fecha_Alta,ISNULL(Tipo_Proforma,'Propia') AS Tipo_Proforma FROM PROFORMAS ";

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

        // Los viajes se identifican en las líneas automáticas con el código V{id}.
        // Se mantiene el vínculo explícito en PROFORMAS_VIAJES para reservarlos y
        // liberarlos de forma atómica cuando se elimina una Proforma no aceptada.
        private static List<int> ExtraerViajes(List<DetalleLineaDto> lineas)
        {
            var resultado = new List<int>();
            foreach (var linea in lineas ?? new List<DetalleLineaDto>())
            {
                var coincidencia = CodigoViaje.Match((linea.Codigo ?? string.Empty).Trim());
                int viajeId;
                if (coincidencia.Success && int.TryParse(coincidencia.Groups[1].Value, out viajeId))
                    resultado.Add(viajeId);
            }
            return resultado;
        }

        private static string ValidarViajesDisponibles(DbContext db, int proformaId, int? clienteId,
            List<int> viajeIds)
        {
            if (viajeIds == null || viajeIds.Count == 0) return null;
            if (!clienteId.HasValue || clienteId.Value <= 0)
                return "Debe seleccionar un cliente antes de incluir viajes.";
            if (viajeIds.Distinct().Count() != viajeIds.Count)
                return "Un mismo viaje no puede incluirse más de una vez en la Proforma.";

            foreach (var viajeId in viajeIds)
            {
                int? clienteViaje = db.Database.SqlQuery<int?>(
                    "SELECT ClienteID FROM dbo.VIAJES WHERE Viaje_ID=@viaje",
                    P("@viaje", viajeId)).FirstOrDefault();
                if (!clienteViaje.HasValue)
                    return "El viaje #" + viajeId + " ya no existe.";
                if (clienteViaje.Value != clienteId.Value)
                    return "El viaje #" + viajeId + " pertenece a otro cliente.";

                int proformaOcupante = db.Database.SqlQuery<int>(@"
SELECT TOP (1) p.Proforma_ID
FROM dbo.PROFORMAS p WITH (UPDLOCK,HOLDLOCK)
WHERE p.Proforma_ID<>@proforma AND p.Estado<>'Anulada'
  AND (
      EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WITH (UPDLOCK,HOLDLOCK)
              WHERE pv.ProformaID=p.Proforma_ID AND pv.ViajeID=@viaje)
      OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd WITH (UPDLOCK,HOLDLOCK)
                 WHERE pd.Proforma_ID=p.Proforma_ID
                   AND TRY_CONVERT(int,SUBSTRING(LTRIM(RTRIM(ISNULL(pd.Codigo,''))),2,20))=@viaje
                   AND UPPER(LEFT(LTRIM(RTRIM(ISNULL(pd.Codigo,''))),1))='V')
  );", P("@proforma", proformaId), P("@viaje", viajeId)).FirstOrDefault();
                if (proformaOcupante > 0)
                    return "El viaje #" + viajeId + " ya está incluido en la Proforma #" + proformaOcupante
                        + ". Eliminá esa Proforma antes de volver a utilizarlo.";
            }
            return null;
        }

        private static int ObtenerUsuarioId(DbContext db, string usuario)
        {
            int? usuarioId = db.Database.SqlQuery<int?>(@"
SELECT TOP (1) Usuario_ID
FROM dbo.USUARIOS
WHERE Nombre_Usuario=@usuario AND EstadoUsuario='Activo';", P("@usuario", usuario)).FirstOrDefault();
            if (!usuarioId.HasValue)
                throw new InvalidOperationException("El usuario activo no es válido para reservar viajes en la Proforma.");
            return usuarioId.Value;
        }

        private static void SincronizarViajes(DbContext db, int proformaId, List<int> viajeIds, string usuario)
        {
            db.Database.ExecuteSqlCommand("DELETE FROM dbo.PROFORMAS_VIAJES WHERE ProformaID=@proforma",
                P("@proforma", proformaId));
            if (viajeIds == null || viajeIds.Count == 0) return;

            int usuarioId = ObtenerUsuarioId(db, usuario);
            foreach (var viajeId in viajeIds)
            {
                db.Database.ExecuteSqlCommand(@"
INSERT dbo.PROFORMAS_VIAJES (ProformaID,ViajeID,UsuarioAltaID)
VALUES (@proforma,@viaje,@usuario);", P("@proforma", proformaId), P("@viaje", viajeId), P("@usuario", usuarioId));
            }
        }

        private static List<int> ViajesReservados(DbContext db, int proformaId)
        {
            return db.Database.SqlQuery<int>(@"
SELECT DISTINCT reservados.ViajeID
FROM (
    SELECT pv.ViajeID
    FROM dbo.PROFORMAS_VIAJES pv
    INNER JOIN dbo.PROFORMAS p ON p.Proforma_ID=pv.ProformaID
    WHERE p.Proforma_ID<>@proforma AND p.Estado<>'Anulada'

    UNION

    SELECT TRY_CONVERT(int,SUBSTRING(LTRIM(RTRIM(ISNULL(pd.Codigo,''))),2,20))
    FROM dbo.PROFORMA_DETALLE pd
    INNER JOIN dbo.PROFORMAS p ON p.Proforma_ID=pd.Proforma_ID
    WHERE p.Proforma_ID<>@proforma AND p.Estado<>'Anulada'
      AND UPPER(LEFT(LTRIM(RTRIM(ISNULL(pd.Codigo,''))),1))='V'
) reservados
WHERE reservados.ViajeID IS NOT NULL;", P("@proforma", proformaId)).ToList();
        }

        // Las proformas de plataforma (Rukas) tienen su propio circuito (ProformasPlataformaController):
        // no se editan, generan ni duplican por los endpoints de la proforma propia.
        private static bool EsDePlataforma(DbContext db, int id)
        {
            return db.Database.SqlQuery<string>("SELECT ISNULL(Tipo_Proforma,'Propia') FROM PROFORMAS WHERE Proforma_ID=@id",
                P("@id", id)).FirstOrDefault() == "Plataforma";
        }
        private const string ErrorEsDePlataforma = "Es una proforma de plataforma: se maneja desde el bloque del Excel de la plataforma.";

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

        // Para guardar un borrador alcanza con el cliente (sin cliente no se pueden traer ni reservar viajes).
        // Origen, destino y fechas estimadas son opcionales: cada línea de viaje ya tiene su recorrido.
        private static string ValidarCamposRequeridos(ProformaDto p)
        {
            if (!p.ClienteID.HasValue || p.ClienteID.Value <= 0) return "Seleccioná el cliente.";
            return null;
        }

        // ======================= Endpoints =======================

        private static StringBuilder CrearFiltroListado(string numero, int? clienteId, string estado,
            string desde, string hasta, string usuario, bool soloGeneradas, out List<SqlParameter> ps)
        {
            var where = new StringBuilder(" WHERE 1=1 ");
            ps = new List<SqlParameter>();
            if (!string.IsNullOrWhiteSpace(numero)) { where.Append(" AND Numero LIKE @numero "); ps.Add(P("@numero", "%" + numero.Trim() + "%")); }
            if (clienteId.HasValue && clienteId.Value > 0) { where.Append(" AND ClienteID=@cli "); ps.Add(P("@cli", clienteId.Value)); }
            if (!string.IsNullOrWhiteSpace(estado))
            {
                if (string.Equals(estado.Trim(), "Facturada", StringComparison.OrdinalIgnoreCase))
                {
                    where.Append(@" AND EXISTS (SELECT 1
                        FROM COMPROBANTES_PROFORMAS cp
                        INNER JOIN COMPROBANTES c ON c.Comprobante_ID=cp.ComprobanteID
                        WHERE cp.ProformaID=PROFORMAS.Proforma_ID AND cp.Vigente=1 AND c.Tipo='FAC') ");
                }
                else
                {
                    where.Append(@" AND Estado=@est AND NOT EXISTS (SELECT 1
                        FROM COMPROBANTES_PROFORMAS cp
                        INNER JOIN COMPROBANTES c ON c.Comprobante_ID=cp.ComprobanteID
                        WHERE cp.ProformaID=PROFORMAS.Proforma_ID AND cp.Vigente=1 AND c.Tipo='FAC') ");
                    ps.Add(P("@est", estado.Trim()));
                }
            }
            if (soloGeneradas) where.Append(" AND Estado <> 'Borrador' ");
            if (!string.IsNullOrWhiteSpace(usuario)) { where.Append(" AND Usu_Alta LIKE @usu "); ps.Add(P("@usu", "%" + usuario.Trim() + "%")); }
            DateTime d;
            if (!string.IsNullOrWhiteSpace(desde) && DateTime.TryParse(desde, CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
            { where.Append(" AND ISNULL(FechaEmision,FechaCreacion) >= @desde "); ps.Add(P("@desde", d.Date)); }
            if (!string.IsNullOrWhiteSpace(hasta) && DateTime.TryParse(hasta, CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
            { where.Append(" AND ISNULL(FechaEmision,FechaCreacion) < @hasta "); ps.Add(P("@hasta", d.Date.AddDays(1))); }
            return where;
        }

        [HttpGet]
        [Route("")]
        public IHttpActionResult Listar(string numero = null, int? clienteId = null, string estado = null,
            string desde = null, string hasta = null, string usuario = null,
            bool soloGeneradas = false, int page = 1, int pageSize = 15)
        {
            if (page < 1) page = 1;
            if (pageSize < 0 || pageSize > 200) pageSize = 15;
            List<SqlParameter> ps;
            var where = CrearFiltroListado(numero, clienteId, estado, desde, hasta, usuario, soloGeneradas, out ps);

            try
            {
                using (var db = new DbContext(Cn()))
                {
                    int total = db.Database.SqlQuery<int>("SELECT COUNT(*) FROM PROFORMAS" + where,
                        ps.Select(x => new SqlParameter(x.ParameterName, x.Value)).ToArray()).First();
                    if (pageSize == 0)
                    {
                        page = 1;
                        pageSize = Math.Max(total, 1);
                    }

                    var pPage = ps.Select(x => new SqlParameter(x.ParameterName, x.Value)).ToList();
                    pPage.Add(P("@off", (page - 1) * pageSize)); pPage.Add(P("@lim", pageSize));
                    string sql =
                        "SELECT Proforma_ID, Numero, ISNULL(FechaEmision,FechaCreacion) AS Fecha, ClienteID, " +
                        "Cli_RazonSocial AS Cliente, Destino, ISNULL(TotalGeneral,ISNULL(ImporteTotal,0)) AS Total, " +
                        "CASE WHEN fac.FacturaID IS NOT NULL THEN 'Facturada' ELSE Estado END AS Estado, Usu_Alta AS UsuarioCreador " +
                        ",fac.FacturaID,fac.FacturaNumero,CAST(CASE WHEN fac.FacturaID IS NOT NULL " +
                        "AND fac.FacturaEstado='EMITIDO' AND NOT EXISTS (SELECT 1 FROM CUENTA_CORRIENTE_APLICACIONES a " +
                        "WHERE a.ComprobanteDeudaID=fac.FacturaID AND a.Vigente=1) THEN 1 ELSE 0 END AS bit) AS FacturaCancelable " +
                        ",ISNULL(PROFORMAS.Tipo_Proforma,'Propia') AS Tipo_Proforma," +
                        "(SELECT pl.Nombre FROM PLATAFORMAS pl WHERE pl.Plataforma_ID=PROFORMAS.PlataformaID) AS Plataforma," +
                        "PROFORMAS.Plataforma_Numero, PROFORMAS.Plataforma_Reclamo_Fecha AS ReclamoFecha FROM PROFORMAS " +
                        "OUTER APPLY (SELECT TOP (1) c.Comprobante_ID AS FacturaID, " +
                        "'FAC-'+RIGHT('00000000'+CONVERT(varchar(8),c.NumeroCorrelativo),8) AS FacturaNumero,c.Estado AS FacturaEstado " +
                        "FROM COMPROBANTES_PROFORMAS cp JOIN COMPROBANTES c ON c.Comprobante_ID=cp.ComprobanteID " +
                        "WHERE cp.ProformaID=PROFORMAS.Proforma_ID AND cp.Vigente=1 AND c.Tipo='FAC' ORDER BY cp.ComprobanteProforma_ID DESC) fac " +
                        where + " ORDER BY Proforma_ID DESC OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY";
                    var items = db.Database.SqlQuery<ListItem>(sql, pPage.ToArray()).ToList();
                    return Ok(new { items, total, page, pageSize, totalPages = (int)Math.Ceiling(total / (double)pageSize) });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al listar proformas.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpGet]
        [Route("Reporte")]
        public IHttpActionResult Reporte(string numero = null, int? clienteId = null, string estado = null,
            string desde = null, string hasta = null, string usuario = null, bool soloGeneradas = false)
        {
            List<SqlParameter> ps;
            var where = CrearFiltroListado(numero, clienteId, estado, desde, hasta, usuario, soloGeneradas, out ps);
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    string sqlProformas = @"
SELECT Proforma_ID, Numero,
       ISNULL(FechaEmision,FechaCreacion) AS FechaInicio,
       FechaVencimiento AS FechaFin,
       Cli_RazonSocial AS Cliente, Cli_CUIT AS Cuit,
       ISNULL(TotalGeneral,ISNULL(ImporteTotal,0)) AS Total,
       CASE WHEN EXISTS (SELECT 1
                         FROM COMPROBANTES_PROFORMAS cp
                         INNER JOIN COMPROBANTES c ON c.Comprobante_ID=cp.ComprobanteID
                         WHERE cp.ProformaID=PROFORMAS.Proforma_ID AND cp.Vigente=1 AND c.Tipo='FAC')
            THEN 'Facturada' ELSE Estado END AS Estado,
       Usu_Alta AS Usuario
FROM PROFORMAS " + where + " ORDER BY Proforma_ID DESC";
                    var proformas = db.Database.SqlQuery<ReporteProformaItem>(sqlProformas,
                        ps.Select(x => new SqlParameter(x.ParameterName, x.Value)).ToArray()).ToList();

                    string sqlViajes = @"
SELECT d.Proforma_ID AS ProformaID, d.Orden, d.Codigo, d.Concepto, d.Descripcion,
       ISNULL(d.Cantidad,0) AS Cantidad, d.Unidad, ISNULL(d.PrecioUnitario,0) AS PrecioUnitario,
       ISNULL(d.DescuentoPct,0) AS DescuentoPct, ISNULL(d.Subtotal,0) AS Subtotal
FROM PROFORMA_DETALLE d
INNER JOIN PROFORMAS ON PROFORMAS.Proforma_ID=d.Proforma_ID " + where + @"
 AND UPPER(LEFT(LTRIM(RTRIM(ISNULL(d.Codigo,''))),1))='V'
ORDER BY d.Proforma_ID, d.Orden";
                    var viajesPorProforma = db.Database.SqlQuery<ReporteViajeItem>(sqlViajes,
                        ps.Select(x => new SqlParameter(x.ParameterName, x.Value)).ToArray())
                        .ToList()
                        .GroupBy(x => x.ProformaID)
                        .ToDictionary(x => x.Key, x => x.ToList());

                    foreach (var proforma in proformas)
                    {
                        List<ReporteViajeItem> viajes;
                        proforma.Viajes = viajesPorProforma.TryGetValue(proforma.Proforma_ID, out viajes)
                            ? viajes : new List<ReporteViajeItem>();
                    }
                    return Ok(new { items = proformas, total = proformas.Count });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "Error al generar el reporte de proformas.", detalle = ex.InnerException?.Message ?? ex.Message });
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
            public int? FacturaID { get; set; }
            public string FacturaNumero { get; set; }
            public bool FacturaCancelable { get; set; }
            // Proforma de plataforma (Rukas): tipo, nombre, N° en la plataforma y reclamo pendiente.
            public string Tipo_Proforma { get; set; }
            public string Plataforma { get; set; }
            public string Plataforma_Numero { get; set; }
            public DateTime? ReclamoFecha { get; set; }
        }

        private class ReporteProformaItem
        {
            public int Proforma_ID { get; set; }
            public string Numero { get; set; }
            public DateTime? FechaInicio { get; set; }
            public DateTime? FechaFin { get; set; }
            public string Cliente { get; set; }
            public string Cuit { get; set; }
            public decimal Total { get; set; }
            public string Estado { get; set; }
            public string Usuario { get; set; }
            public List<ReporteViajeItem> Viajes { get; set; }
        }

        private class ReporteViajeItem
        {
            public int ProformaID { get; set; }
            public int Orden { get; set; }
            public string Codigo { get; set; }
            public string Concepto { get; set; }
            public string Descripcion { get; set; }
            public decimal Cantidad { get; set; }
            public string Unidad { get; set; }
            public decimal PrecioUnitario { get; set; }
            public decimal DescuentoPct { get; set; }
            public decimal Subtotal { get; set; }
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
                    if (TieneFacturaVigente(db, id)) dto.Estado = "Facturada";
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

        private static bool TieneFacturaVigente(DbContext db, int proformaId)
        {
            return db.Database.SqlQuery<int>(@"
SELECT COUNT(*)
FROM COMPROBANTES_PROFORMAS cp
INNER JOIN COMPROBANTES c ON c.Comprobante_ID=cp.ComprobanteID
WHERE cp.ProformaID=@id AND cp.Vigente=1 AND c.Tipo='FAC'", P("@id", proformaId)).FirstOrDefault() > 0;
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Crear([FromBody] ProformaDto p)
        {
            if (p == null) return BadRequest("Datos invalidos.");
            var errorRequeridos = ValidarCamposRequeridos(p);
            if (errorRequeridos != null) return Content(HttpStatusCode.BadRequest, new { error = errorRequeridos });
            try
            {
                ComputarTotales(p);
                using (var db = new DbContext(Cn()))
                using (var transaction = db.Database.BeginTransaction())
                {
                    ActualizarCondicionIvaDesdeCliente(db, p);
                    // Un cliente con plataforma factura solo por la proforma de plataforma (importando su archivo).
                    var tipoCliente = db.Database.SqlQuery<string>("SELECT ISNULL(Tipo_Cliente,'Directo') FROM CLIENTES WHERE Cliente_ID=@c",
                        P("@c", (object)p.ClienteID)).FirstOrDefault();
                    if (tipoCliente == ClientesController.TipoConPlataforma)
                        return Content(HttpStatusCode.BadRequest, new { error = "Este cliente trabaja con una plataforma: la proforma se arma con el Excel de la plataforma." });
                    var viajeIds = ExtraerViajes(p.Detalle);
                    var errorViajes = ValidarViajesDisponibles(db, 0, p.ClienteID, viajeIds);
                    if (errorViajes != null) return Content(HttpStatusCode.Conflict, new { error = errorViajes });
                    var ps = ParamsNegocio(p);
                    var usuario = string.IsNullOrWhiteSpace(p.Usu_Alta) ? "sistema" : p.Usu_Alta;
                    ps.Add(P("@usualta", usuario));
                    string sql = "INSERT INTO PROFORMAS (" + COLS + ",Estado,FechaCreacion,Usu_Alta,Fecha_Alta) " +
                                 "OUTPUT INSERTED.Proforma_ID VALUES (" + VALS + ",'Borrador',GETDATE(),@usualta,GETDATE())";
                    int nuevoId = db.Database.SqlQuery<int>(sql, ps.ToArray()).First();
                    InsertarDetalle(db, nuevoId, p.Detalle);
                    SincronizarViajes(db, nuevoId, viajeIds, usuario);
                    Auditar(db, usuario, "INSERT", nuevoId, null, "Alta de proforma (Borrador)");
                    transaction.Commit();
                    return Ok(new { Proforma_ID = nuevoId, Message = "Borrador guardado." });
                }
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
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
            var errorRequeridos = ValidarCamposRequeridos(p);
            if (errorRequeridos != null) return Content(HttpStatusCode.BadRequest, new { error = errorRequeridos });
            try
            {
                ComputarTotales(p);
                using (var db = new DbContext(Cn()))
                using (var transaction = db.Database.BeginTransaction())
                {
                    ActualizarCondicionIvaDesdeCliente(db, p);
                    var est = db.Database.SqlQuery<string>("SELECT Estado FROM PROFORMAS WHERE Proforma_ID=@id", P("@id", id)).FirstOrDefault();
                    if (est == null) return NotFound();
                    if (EsDePlataforma(db, id)) return Content(HttpStatusCode.BadRequest, new { error = ErrorEsDePlataforma });
                    if (est == "Facturada" || TieneFacturaVigente(db, id)) return Content(HttpStatusCode.BadRequest, new { error = "No se puede editar una proforma Facturada." });
                    if (est != "Borrador") return Content(HttpStatusCode.BadRequest, new { error = "Solo se pueden editar proformas en estado Borrador." });

                    var viajeIds = ExtraerViajes(p.Detalle);
                    var errorViajes = ValidarViajesDisponibles(db, id, p.ClienteID, viajeIds);
                    if (errorViajes != null) return Content(HttpStatusCode.Conflict, new { error = errorViajes });
                    var ps = ParamsNegocio(p);
                    var usuario = string.IsNullOrWhiteSpace(p.Usu_Modi) ? "sistema" : p.Usu_Modi;
                    ps.Add(P("@usumodi", usuario));
                    ps.Add(P("@id", id));
                    db.Database.ExecuteSqlCommand("UPDATE PROFORMAS SET " + SETS + ",Usu_Modi=@usumodi,Fecha_Modi=GETDATE() WHERE Proforma_ID=@id", ps.ToArray());
                    InsertarDetalle(db, id, p.Detalle);
                    SincronizarViajes(db, id, viajeIds, usuario);
                    Auditar(db, usuario, "UPDATE", id, null, "Edicion de proforma (Borrador)");
                    transaction.Commit();
                    return Ok(new { Message = "Proforma actualizada." });
                }
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
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
                    if (EsDePlataforma(db, id)) return Content(HttpStatusCode.BadRequest, new { error = ErrorEsDePlataforma });
                    if (h.Estado != "Borrador") return Content(HttpStatusCode.BadRequest, new { error = "Solo se genera desde Borrador." });

                    var errores = new List<string>();
                    if (!h.ClienteID.HasValue || h.ClienteID.Value <= 0) errores.Add("Falta el cliente.");
                    int lineas = db.Database.SqlQuery<int>("SELECT COUNT(*) FROM PROFORMA_DETALLE WHERE Proforma_ID=@id", P("@id", id)).First();
                    if (lineas == 0) errores.Add("Debe tener al menos un concepto.");
                    if (h.Total <= 0) errores.Add("El total debe ser mayor a cero.");
                    var yaFacturados = db.Database.SqlQuery<int>(
                        "SELECT v.Viaje_ID " + JOIN_VIAJES_DE_PROFORMA + " AND v.Estado='Facturado'", P("@id", id)).ToList();
                    if (yaFacturados.Count > 0) errores.Add("Viaje(s) ya facturado(s) en otra proforma: " + ListaViajes(yaFacturados) + ". Quitá esas líneas.");
                    var directosSinEntregar = db.Database.SqlQuery<int>(
                        "SELECT v.Viaje_ID " + JOIN_VIAJES_DE_PROFORMA + " AND v.Estado NOT IN ('Entregado','Facturado') " +
                        "AND NOT EXISTS (SELECT 1 FROM CLIENTES c WHERE c.Cliente_ID = v.ClienteID AND c.Tipo_Cliente = 'Con_plataforma')", P("@id", id)).ToList();
                    if (directosSinEntregar.Count > 0) errores.Add("Viaje(s) de cliente directo que todavía no están Entregados: " + ListaViajes(directosSinEntregar) + ".");
                    var plataformaSinNumeros = db.Database.SqlQuery<int>(
                        "SELECT v.Viaje_ID " + JOIN_VIAJES_DE_PROFORMA +
                        " AND (LTRIM(RTRIM(ISNULL(v.Num_Remito,''))) = '' OR LTRIM(RTRIM(ISNULL(v.Num_Transporte,''))) = '') " +
                        "AND EXISTS (SELECT 1 FROM CLIENTES c WHERE c.Cliente_ID = v.ClienteID AND c.Tipo_Cliente = 'Con_plataforma')", P("@id", id)).ToList();
                    if (plataformaSinNumeros.Count > 0) errores.Add("Viaje(s) sin número de remito o de transporte SAP: " + ListaViajes(plataformaSinNumeros) + ".");
                    if (errores.Count > 0) return Content(HttpStatusCode.BadRequest, new { errores });

                    int n = db.Database.SqlQuery<int>("SELECT NEXT VALUE FOR dbo.SEQ_PROFORMA").First();
                    string numero = "PF-" + n.ToString("D8");
                    string usu = body != null ? body.Usuario : null;
                    db.Database.ExecuteSqlCommand(
                        "UPDATE PROFORMAS SET Numero=@num, Estado='Generada', FechaEmision=ISNULL(FechaEmision,GETDATE()), Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Proforma_ID=@id",
                        P("@num", numero), P("@u", usu), P("@id", id));
                    // Los viajes conservan su estado: pasan a Facturado recién al emitir la Factura (FacturasController).
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
                    if (TieneFacturaVigente(db, id)) return Content(HttpStatusCode.BadRequest, new { error = "No se puede cambiar el estado de una proforma Facturada." });
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

        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Borrar(int id, [FromBody] UsuarioDto body)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                using (var transaction = db.Database.BeginTransaction())
                {
                    var estado = db.Database.SqlQuery<string>(
                        "SELECT Estado FROM PROFORMAS WHERE Proforma_ID=@id", P("@id", id)).FirstOrDefault();
                    if (estado == null) return NotFound();
                    // Solo borradores: una proforma Generada ya tiene número PF y se anula (queda registro).
                    if (estado != "Borrador")
                        return Content(HttpStatusCode.BadRequest, new
                        {
                            error = "Solo se pueden eliminar borradores. Una proforma generada se anula."
                        });
                    if (TieneFacturaVigente(db, id))
                        return Content(HttpStatusCode.Conflict, new
                        {
                            error = "No se puede borrar una proforma que tiene una Factura vinculada."
                        });

                    db.Database.ExecuteSqlCommand("DELETE FROM PROFORMAS_VIAJES WHERE ProformaID=@id", P("@id", id));
                    db.Database.ExecuteSqlCommand("DELETE FROM PROFORMA_DETALLE WHERE Proforma_ID=@id", P("@id", id));
                    int eliminadas = db.Database.ExecuteSqlCommand(@"
DELETE FROM PROFORMAS
WHERE Proforma_ID=@id AND Estado='Borrador';", P("@id", id));
                    if (eliminadas != 1) return Content(HttpStatusCode.Conflict,
                        new { error = "La proforma cambio de estado antes de poder borrarse." });

                    string usuario = body != null ? body.Usuario : null;
                    Auditar(db, usuario, "DELETE", id, "Estado=" + estado, "Proforma eliminada y viajes liberados");
                    transaction.Commit();
                    return Ok(new { Message = "Proforma eliminada." });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "Error al borrar la proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPost]
        [Route("{id:int}/Anular")]
        public IHttpActionResult Anular(int id, [FromBody] UsuarioDto body)
        {
            // Generada o Aceptada sin Factura: queda Anulada (no se borra, ya tiene número PF) y libera sus viajes.
            // Borrador: se elimina (Borrar). Con Factura: Nota de Credito cancelatoria (ComprobantesController).
            try
            {
                using (var db = new DbContext(Cn()))
                using (var transaction = db.Database.BeginTransaction())
                {
                    var est = db.Database.SqlQuery<string>("SELECT Estado FROM PROFORMAS WITH (UPDLOCK) WHERE Proforma_ID=@id", P("@id", id)).FirstOrDefault();
                    if (est == null) return NotFound();
                    if (TieneFacturaVigente(db, id) || est == "Facturada")
                        return Content(HttpStatusCode.Conflict, new { error = "La proforma tiene una Factura: para anularla emití la Nota de Crédito cancelatoria desde Cuenta corriente." });
                    if (est == "Borrador")
                        return Content(HttpStatusCode.BadRequest, new { error = "Un borrador no se anula: eliminalo." });
                    if (est != "Generada" && est != "Aceptada")
                        return Content(HttpStatusCode.BadRequest, new { error = "La proforma ya está " + est + "." });
                    string usu = body != null ? body.Usuario : null;
                    db.Database.ExecuteSqlCommand("DELETE FROM PROFORMAS_VIAJES WHERE ProformaID=@id", P("@id", id));
                    db.Database.ExecuteSqlCommand("UPDATE PROFORMAS SET Estado='Anulada', Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Proforma_ID=@id",
                        P("@u", usu), P("@id", id));
                    Auditar(db, usu, "ANULAR", id, "Estado=" + est, "Estado=Anulada; viajes liberados");
                    transaction.Commit();
                    return Ok(new { Message = "Proforma anulada. Sus viajes quedaron disponibles para otra proforma." });
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
                    if (o.Tipo_Proforma == "Plataforma") return Content(HttpStatusCode.BadRequest, new { error = ErrorEsDePlataforma });
                    o.Detalle = LeerDetalle(db, id);
                    if (ExtraerViajes(o.Detalle).Count > 0)
                        return Content(HttpStatusCode.Conflict, new
                        {
                            error = "No se puede duplicar una Proforma que incluye viajes, porque esos viajes permanecen reservados por la Proforma original."
                        });
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

        // Fila de VIAJES para prellenar. Estado, Tipo_Cliente y VIAJE_EVIDENCIA vienen de 06/07_*.sql (fuera del EDMX).
        private class ViajePrellenado
        {
            public int Viaje_ID { get; set; }
            public DateTime Fecha_Inicio { get; set; }
            public string Origen { get; set; }
            public string Destino { get; set; }
            public string Num_Remito { get; set; }
            public string Num_de_Carga { get; set; }
            public string Num_Transporte { get; set; }
            public string Distancia_KM { get; set; }
            public int? TarifaFijaID { get; set; }
            public int? TarifaKmID { get; set; }
            public string Estado { get; set; }
            public bool Tiene_Evidencia { get; set; }
        }

        // Prellenado desde viajes. Devuelve { lineas, advertencias }. Nunca trae viajes facturados ni sin tarifa.
        //   Con plataforma (Rukas): exige numero de remito y de transporte SAP.
        //   Directo: solo viajes Entregados (SGTL es la unica constancia de la entrega).
        [HttpGet]
        [Route("PrellenarViajes")]
        public IHttpActionResult PrellenarViajes(int clienteId, string desde, string hasta, int proformaId = 0)
        {
            DateTime d1, d2;
            if (!DateTime.TryParse(desde, CultureInfo.InvariantCulture, DateTimeStyles.None, out d1) ||
                !DateTime.TryParse(hasta, CultureInfo.InvariantCulture, DateTimeStyles.None, out d2))
                return BadRequest("Fechas invalidas.");
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var reservados = ViajesReservados(db, proformaId);
                    var tarifas = CargarTarifas(db);
                    var tipoCliente = db.Database.SqlQuery<string>(
                        "SELECT ISNULL(Tipo_Cliente,'Directo') FROM CLIENTES WHERE Cliente_ID=@cli", P("@cli", clienteId)).FirstOrDefault();
                    bool conPlataforma = tipoCliente == ClientesController.TipoConPlataforma;
                    var filas = db.Database.SqlQuery<ViajePrellenado>(
                        "SELECT v.Viaje_ID, v.Fecha_Inicio, ISNULL(o.Descripcion,'') AS Origen, ISNULL(de.Descripcion,'') AS Destino, " +
                        "RTRIM(ISNULL(v.Num_Remito,'')) AS Num_Remito, RTRIM(ISNULL(v.Num_de_Carga,'')) AS Num_de_Carga, RTRIM(ISNULL(v.Num_Transporte,'')) AS Num_Transporte, " +
                        "RTRIM(ISNULL(v.Distancia_KM,'')) AS Distancia_KM, v.TarifaFijaID, v.TarifaKmID, v.Estado, " +
                        "CAST(CASE WHEN EXISTS (SELECT 1 FROM VIAJE_EVIDENCIA e WHERE e.Viaje_ID = v.Viaje_ID) THEN 1 ELSE 0 END AS bit) AS Tiene_Evidencia " +
                        "FROM VIAJES v LEFT JOIN ORIGEN o ON o.Origen_ID = v.OrigenID LEFT JOIN DESTINO de ON de.Destino_ID = v.DestinoID " +
                        "WHERE v.ClienteID=@cli AND v.Fecha_Inicio >= @d1 AND v.Fecha_Inicio < @d2 ORDER BY v.Fecha_Inicio",
                        P("@cli", clienteId), P("@d1", d1.Date), P("@d2", d2.Date.AddDays(1))).ToList();

                    var lineas = new List<DetalleLineaDto>();
                    var facturados = new List<int>();
                    var enOtraProforma = new List<int>();
                    var sinNumeros = new List<int>();
                    var noEntregados = new List<int>();
                    var sinTarifa = new List<int>();
                    var registrados = new List<int>();
                    var sinEvidencia = new List<int>();
                    int orden = 1;
                    foreach (var f in filas)
                    {
                        if (reservados.Contains(f.Viaje_ID)) { enOtraProforma.Add(f.Viaje_ID); continue; }
                        if (f.Estado == "Facturado") { facturados.Add(f.Viaje_ID); continue; }
                        if (conPlataforma && (string.IsNullOrWhiteSpace(f.Num_Remito) || string.IsNullOrWhiteSpace(f.Num_Transporte))) { sinNumeros.Add(f.Viaje_ID); continue; }
                        if (!conPlataforma && f.Estado != "Entregado") { noEntregados.Add(f.Viaje_ID); continue; }

                        var calculo = ImporteViaje(tarifas, f.Viaje_ID, f.TarifaFijaID, f.TarifaKmID, f.Distancia_KM, f.Origen, f.Destino);
                        if (calculo.PresupuestoInvalido)
                            throw new InvalidOperationException("El presupuesto del viaje #" + f.Viaje_ID + " no tiene un importe válido.");
                        decimal importe = calculo.Importe ?? 0;
                        if (importe <= 0) { sinTarifa.Add(f.Viaje_ID); continue; }

                        if (conPlataforma && f.Estado == "Registrado") registrados.Add(f.Viaje_ID);
                        if (!conPlataforma && !f.Tiene_Evidencia) sinEvidencia.Add(f.Viaje_ID);

                        lineas.Add(new DetalleLineaDto
                        {
                            Orden = orden++, Codigo = "V" + f.Viaje_ID, Concepto = "Viaje " + f.Origen + " -> " + f.Destino,
                            Descripcion = f.Fecha_Inicio.ToString("dd/MM/yyyy") +
                                          (string.IsNullOrWhiteSpace(f.Num_Transporte) ? "" : (" - Transporte " + f.Num_Transporte)) +
                                          (string.IsNullOrWhiteSpace(f.Num_Remito) ? "" : (" - Remito " + f.Num_Remito)) +
                                          (string.IsNullOrWhiteSpace(f.Num_de_Carga) ? "" : (" - Entrega " + f.Num_de_Carga)),
                            Cantidad = 1, Unidad = "Viaje", PrecioUnitario = Redondear(importe), DescuentoPct = 0, IvaPct = 21
                        });
                    }

                    var advertencias = new List<string>();
                    if (sinNumeros.Count > 0) advertencias.Add("No se " + (sinNumeros.Count == 1 ? "trajo 1 viaje" : "trajeron " + sinNumeros.Count + " viajes") + " sin número de remito o de transporte SAP: " + ListaViajes(sinNumeros) + ".");
                    if (noEntregados.Count > 0) advertencias.Add("No se " + (noEntregados.Count == 1 ? "trajo 1 viaje que todavía no está" : "trajeron " + noEntregados.Count + " viajes que todavía no están") + " en estado Entregado: " + ListaViajes(noEntregados) + ".");
                    if (sinTarifa.Count > 0) advertencias.Add("No se " + (sinTarifa.Count == 1 ? "trajo 1 viaje" : "trajeron " + sinTarifa.Count + " viajes") + " sin tarifa o con importe en cero: " + ListaViajes(sinTarifa) + ".");
                    if (enOtraProforma.Count > 0) advertencias.Add((enOtraProforma.Count == 1 ? "1 viaje ya está incluido en otra proforma y no se volvió a traer: " : enOtraProforma.Count + " viajes ya están incluidos en otra proforma y no se volvieron a traer: ") + ListaViajes(enOtraProforma) + ".");
                    if (facturados.Count > 0) advertencias.Add((facturados.Count == 1 ? "1 viaje ya estaba facturado y no se volvió a traer: " : facturados.Count + " viajes ya estaban facturados y no se volvieron a traer: ") + ListaViajes(facturados) + ".");
                    if (registrados.Count > 0) advertencias.Add((registrados.Count == 1 ? "1 viaje sigue en estado Registrado (verificá en Rukas que esté entregado): " : registrados.Count + " viajes siguen en estado Registrado (verificá en Rukas que estén entregados): ") + ListaViajes(registrados) + ".");
                    if (sinEvidencia.Count > 0) advertencias.Add((sinEvidencia.Count == 1 ? "1 viaje entregado no tiene evidencia adjunta (recomendado): " : sinEvidencia.Count + " viajes entregados no tienen evidencia adjunta (recomendado): ") + ListaViajes(sinEvidencia) + ".");

                    return Ok(new { lineas, advertencias });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "Error al prellenar desde viajes.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        private static string ListaViajes(List<int> ids)
        {
            return string.Join(", ", ids.Select(i => "#" + i));
        }

        // Las lineas traidas desde viajes llevan Codigo = "V" + Viaje_ID.
        private const string JOIN_VIAJES_DE_PROFORMA =
            "FROM VIAJES v JOIN PROFORMA_DETALLE pd ON LTRIM(RTRIM(pd.Codigo)) = 'V' + CAST(v.Viaje_ID AS varchar(12)) " +
            "WHERE pd.Proforma_ID=@id ";

        private static string UsuarioCorto(string u)
        {
            u = string.IsNullOrWhiteSpace(u) ? "sistema" : u.Trim();
            return u.Length > 20 ? u.Substring(0, 20) : u;
        }

        private static decimal ParseDec(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return 0;
            decimal v;
            return decimal.TryParse(raw.Trim().Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out v) ? v : 0;
        }
    }
}
