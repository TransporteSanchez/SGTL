using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.Entity.Validation;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Web.Http;
using WebApi_TransporteSanchez.Services.WhatsApp;
using WebApi_TransporteSanchez.Tarifas;
using WebApi_TransporteSanchez.Viajes;

namespace WebApi_TransporteSanchez.Controllers
{
    public class ViajesController : ApiController
    {
        private readonly ViajeWhatsAppDispatcher _whatsAppDispatcher;

        public ViajesController()
            : this(new ViajeWhatsAppDispatcher(new WhatsAppCloudApiNotifier()))
        {
        }

        public ViajesController(ViajeWhatsAppDispatcher whatsAppDispatcher)
        {
            _whatsAppDispatcher = whatsAppDispatcher ?? new ViajeWhatsAppDispatcher(new WhatsAppCloudApiNotifier());
        }

        // DTO principal: refleja exactamente los campos de la entidad VIAJES.
        public class ViajeDto
        {
            public int Viaje_ID { get; set; }
            public int OrigenID { get; set; }
            public int DestinoID { get; set; }
            public string Distancia_KM { get; set; }
            public string Num_Remito { get; set; }
            public string Num_de_Carga { get; set; }
            public System.DateTime Fecha_Inicio { get; set; }
            public System.DateTime Fecha_Fin { get; set; }
            public int ChoferID { get; set; }
            public int CamionID { get; set; }
            public int ClienteID { get; set; }
            public System.DateTime Fecha_Alta { get; set; }
            public string Usu_Alta { get; set; }
            public System.DateTime Fecha_Modi { get; set; }
            public string Usu_Modi { get; set; }

            // 08_*.sql (fuera del EDMX): se guarda por SQL directo despues del SaveChanges.
            public string Num_Transporte { get; set; }

            // Tabla de tarifas por tipo de camión (database/tarifas/02_*.sql, fuera del EDMX): se guardan por SQL directo.
            // TarifarioID > 0 = el viaje se cobra con la tabla (la API toma la versión vigente en el inicio);
            // Tarifa_Modo: "Fija" (la banda de km; más de 250, la de 250 más el excedente por km) o "Km".
            public int? TarifarioID { get; set; }
            public string Tarifa_Modo { get; set; }
            public int? Vuelta { get; set; }
            public int Estadia_Modulos { get; set; }
            public bool Falso_Flete { get; set; }

            // Solo lectura: el importe que el viaje guardó al calcular su tarifa (lo usan proformas y dashboard).
            public decimal? Importe_Base { get; set; }
            public string Tarifa_Detalle { get; set; }
            public decimal? Importe { get; set; }
            public string Importe_Detalle { get; set; }

            // Solo llegan si Google no pudo calcular la ruta y los km se cargaron a mano: van a AUDITORIA, no a VIAJES.
            public string Km_Manual_Motivo { get; set; }
            public string Km_Manual_Error_Google { get; set; }
            // Por qué cambia el camión o el chofer con el viaje en curso (caso F de docs/diseno/viajes-diseno.md).
            public string Cambio_Motivo { get; set; }

            // Solo lectura: columnas de 06/07_*.sql (fuera del EDMX).
            public string Estado { get; set; }
            public string Resultado_Entrega { get; set; }
            public DateTime? Fecha_Entrega { get; set; }
            public string Tipo_Cliente { get; set; }
            public bool Tiene_Evidencia { get; set; }

            // Tiene una Factura vigente (Cuenta corriente): no se edita ni se elimina.
            public bool Facturada { get; set; }

            // Presupuesto aceptado que genero el viaje: cliente, recorrido, km y tarifa quedan fijos.
            public int? Presupuesto_ID { get; set; }

            // Proforma (no anulada) que incluye el viaje: sale de la reserva PROFORMAS_VIAJES.
            public int? EnProforma_ID { get; set; }
            public string EnProforma_Numero { get; set; }
            public string EnProforma_Estado { get; set; }
        }

        public class EvidenciaDto
        {
            public string Nombre_Archivo { get; set; }
            public string Content_Type { get; set; }
            public string ContenidoBase64 { get; set; }
            public string Usuario { get; set; }
        }

        private class EvidenciaRow
        {
            public string Nombre_Archivo { get; set; }
            public string Content_Type { get; set; }
            public byte[] Archivo { get; set; }
        }

        public class CambioEstadoViajeDto
        {
            public string Estado { get; set; }
            public string Resultado_Entrega { get; set; }
            public DateTime? Fecha_Entrega { get; set; }
            public string Usuario { get; set; }
            public string Motivo { get; set; }        // al cancelar el viaje; al marcarlo sin carga, la observación
        }

        // Fila de la grilla de gestion-viajes.html. Debe coincidir 1:1 con SELECT_GRILLA.
        public class ViajeGrillaDto
        {
            public int Viaje_ID { get; set; }
            public DateTime Fecha_Inicio { get; set; }
            public DateTime Fecha_Fin { get; set; }
            public string Origen { get; set; }
            public string Destino { get; set; }
            public string Num_Remito { get; set; }
            public string Num_de_Carga { get; set; }
            public string Num_Transporte { get; set; }
            public string Distancia_KM { get; set; }
            public int OrigenID { get; set; }
            public int DestinoID { get; set; }
            public int ChoferID { get; set; }
            public int CamionID { get; set; }
            public int ClienteID { get; set; }
            public string Cliente { get; set; }
            public int? TarifarioID { get; set; }
            public string Tarifa_Modo { get; set; }
            public int? Vuelta { get; set; }
            public int Estadia_Modulos { get; set; }
            public bool Falso_Flete { get; set; }
            public decimal? Importe_Base { get; set; }
            public string Tarifa_Detalle { get; set; }
            public decimal? Importe { get; set; }
            public string Importe_Detalle { get; set; }
            public string Estado { get; set; }
            public string Resultado_Entrega { get; set; }
            public DateTime? Fecha_Entrega { get; set; }
            public string Tipo_Cliente { get; set; }
            public bool Tiene_Evidencia { get; set; }
            public bool Tiene_Gastos { get; set; }
            public bool Facturada { get; set; }
            public int? Presupuesto_ID { get; set; }
            public int? EnProforma_ID { get; set; }
            public string EnProforma_Numero { get; set; }
            public string EnProforma_Estado { get; set; }
            public string Cancelado_Motivo { get; set; }
            public DateTime? Cancelado_Fecha { get; set; }
            public string Cancelado_Usuario { get; set; }
            public int? Cancelado_Presupuesto_ID { get; set; }
            public string Sin_Carga_Observacion { get; set; }
        }

        private class EstadoViajeRow
        {
            public int Viaje_ID { get; set; }
            public string Estado { get; set; }
            public string Num_Remito { get; set; }
            public string Num_de_Carga { get; set; }
            public string Num_Transporte { get; set; }
            public int? TarifarioID { get; set; }
            public DateTime Fecha_Inicio { get; set; }
            public string Tipo_Cliente { get; set; }
            public bool Tiene_Evidencia { get; set; }
        }

        public const string EstadoRegistrado = "Registrado";
        public const string EstadoEnViaje = "En_viaje";
        public const string EstadoEntregado = "Entregado";
        public const string EstadoListoParaFacturar = "Listo_para_facturar";
        public const string EstadoFacturado = "Facturado";
        // Un viaje que no se hizo (caso E de docs/diseno/viajes-diseno.md, database/viajes/02): desde Registrado, con motivo;
        // vuelve a Registrado. No está en los flujos: no cuenta en el camión ocupado, el orden del día, las proformas, los
        // costos ni los indicadores.
        public const string EstadoCancelado = "Cancelado";
        // El camión llegó al origen y no había carga (punto 10 de la §41; antes "falso flete").
        public const string EstadoSinCarga = "Sin_carga";

        // Con plataforma (Rukas): el seguimiento fino queda en Rukas; en SGTL solo la puerta a la proforma.
        private static readonly string[] FlujoConPlataforma = { EstadoRegistrado, EstadoListoParaFacturar, EstadoFacturado };
        // Directo: SGTL es el unico registro del viaje.
        private static readonly string[] FlujoDirecto = { EstadoRegistrado, EstadoEnViaje, EstadoEntregado, EstadoFacturado };
        private static readonly string[] ResultadosEntrega = { "Completa", "Parcial", "Rechazo" };

        private static readonly string[] TiposEvidencia = { "image/jpeg", "image/png", "image/webp", "application/pdf" };
        private const int MaxBytesEvidencia = 5 * 1024 * 1024;

        private static bool EsConPlataforma(string tipoCliente)
        {
            return tipoCliente == ClientesController.TipoConPlataforma;
        }

        private static string[] FlujoEstados(string tipoCliente)
        {
            return EsConPlataforma(tipoCliente) ? FlujoConPlataforma : FlujoDirecto;
        }

        private const int MaxPageSize = 5000;

        // Viaje incluido en una proforma con comprobante de deuda emitido y vínculo vigente.
        // Contempla el vínculo explícito (PROFORMAS_VIAJES) y las líneas históricas con código V{id}.
        private const string SQL_FACTURADA =
            "CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.COMPROBANTES_PROFORMAS cp " +
            "JOIN dbo.COMPROBANTES c ON c.Comprobante_ID = cp.ComprobanteID " +
            "WHERE cp.Vigente = 1 AND c.Impacto = 'D' AND c.Estado = 'EMITIDO' AND (" +
            "EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = cp.ProformaID AND pv.ViajeID = v.Viaje_ID) " +
            "OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd WHERE pd.Proforma_ID = cp.ProformaID " +
            "AND UPPER(LTRIM(RTRIM(ISNULL(pd.Codigo,'')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID)))) THEN 1 ELSE 0 END AS bit)";

        private const string SELECT_GRILLA =
            "SELECT v.Viaje_ID, v.Fecha_Inicio, v.Fecha_Fin, ISNULL(o.Descripcion,'') AS Origen, ISNULL(d.Descripcion,'') AS Destino, " +
            "RTRIM(ISNULL(v.Num_Remito,'')) AS Num_Remito, RTRIM(ISNULL(v.Num_de_Carga,'')) AS Num_de_Carga, RTRIM(ISNULL(v.Num_Transporte,'')) AS Num_Transporte, " +
            "RTRIM(ISNULL(v.Distancia_KM,'')) AS Distancia_KM, v.OrigenID, v.DestinoID, v.ChoferID, v.CamionID, v.ClienteID, ISNULL(c.Razon_Social,'') AS Cliente, " +
            "v.TarifarioID, v.Tarifa_Modo, v.Vuelta, v.Estadia_Modulos, v.Falso_Flete, v.Importe_Base, v.Tarifa_Detalle, " +
            "v.Importe, v.Importe_Detalle, v.Estado, v.Resultado_Entrega, v.Fecha_Entrega, " +
            "ISNULL(c.Tipo_Cliente,'Directo') AS Tipo_Cliente, " +
            "CAST(CASE WHEN EXISTS (SELECT 1 FROM VIAJE_EVIDENCIA e WHERE e.Viaje_ID = v.Viaje_ID) THEN 1 ELSE 0 END AS bit) AS Tiene_Evidencia, " +
            // Con gastos del chofer no se elimina (punto 22 de la §41; VIAJE_GASTOS es de database/costos/01).
            "CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.VIAJE_GASTOS g WHERE g.Viaje_ID = v.Viaje_ID) THEN 1 ELSE 0 END AS bit) AS Tiene_Gastos, " +
            SQL_FACTURADA + " AS Facturada, " +
            "(SELECT TOP (1) ps.Presupuesto_ID FROM dbo.PRESUPUESTOS ps WHERE ps.ViajeID = v.Viaje_ID) AS Presupuesto_ID, " +
            "pf.Proforma_ID AS EnProforma_ID, ISNULL(pf.Numero,'') AS EnProforma_Numero, ISNULL(pf.Estado,'') AS EnProforma_Estado, {CANCELADO}, {SIN_CARGA} " +
            "FROM VIAJES v " +
            "LEFT JOIN ORIGEN o ON o.Origen_ID = v.OrigenID " +
            "LEFT JOIN DESTINO d ON d.Destino_ID = v.DestinoID " +
            "LEFT JOIN CLIENTES c ON c.Cliente_ID = v.ClienteID " +
            OUTER_APPLY_PROFORMA;

        // Proforma no anulada que incluye el viaje (reserva PROFORMAS_VIAJES o línea histórica V{id}).
        private const string OUTER_APPLY_PROFORMA =
            "OUTER APPLY (SELECT TOP (1) p.Proforma_ID, p.Numero, p.Estado FROM dbo.PROFORMAS p " +
            "WHERE p.Estado <> 'Anulada' AND (" +
            "EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = p.Proforma_ID AND pv.ViajeID = v.Viaje_ID) " +
            "OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd WHERE pd.Proforma_ID = p.Proforma_ID " +
            "AND UPPER(LTRIM(RTRIM(ISNULL(pd.Codigo,'')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID))) " +
            "ORDER BY p.Proforma_ID DESC) pf ";

        // Con database/viajes/02 corrido: el motivo, la fecha, el usuario y el presupuesto de la cancelación.
        private static bool HayCancelado(DbContext db)
        {
            return db.Database.SqlQuery<int>("SELECT CASE WHEN COL_LENGTH('dbo.VIAJES', 'Cancelado_Presupuesto_ID') IS NULL THEN 0 ELSE 1 END").First() == 1;
        }

        // Con database/viajes/03 corrido: la observación del viaje sin carga.
        private static bool HaySinCarga(DbContext db)
        {
            return db.Database.SqlQuery<int>("SELECT CASE WHEN COL_LENGTH('dbo.VIAJES', 'Sin_Carga_Observacion') IS NULL THEN 0 ELSE 1 END").First() == 1;
        }

        private static string Grilla(DbContext db)
        {
            return SELECT_GRILLA.Replace("{SIN_CARGA}", HaySinCarga(db) ? "v.Sin_Carga_Observacion" : "CAST(NULL AS nvarchar(300)) AS Sin_Carga_Observacion")
                .Replace("{CANCELADO}", HayCancelado(db)
                ? "v.Cancelado_Motivo, v.Cancelado_Fecha, v.Cancelado_Usuario, v.Cancelado_Presupuesto_ID"
                : "CAST(NULL AS nvarchar(300)) AS Cancelado_Motivo, CAST(NULL AS datetime) AS Cancelado_Fecha, CAST(NULL AS nvarchar(50)) AS Cancelado_Usuario, " +
                  "CAST(NULL AS int) AS Cancelado_Presupuesto_ID");
        }

        private class ProformaDelViaje { public int Proforma_ID { get; set; } public string Numero { get; set; } public string Estado { get; set; } }

        private static ProformaDelViaje ProformaQueIncluye(DbContext db, int viajeId)
        {
            return db.Database.SqlQuery<ProformaDelViaje>(
                "SELECT pf.Proforma_ID, ISNULL(pf.Numero,'') AS Numero, pf.Estado FROM VIAJES v " + OUTER_APPLY_PROFORMA +
                "WHERE v.Viaje_ID=@id AND pf.Proforma_ID IS NOT NULL", P("@id", viajeId)).FirstOrDefault();
        }

        // En una proforma Generada o Aceptada el viaje ya forma parte de un documento emitido: no se modifica.
        private static bool BloqueaPorProforma(ProformaDelViaje pf)
        {
            return pf != null && (pf.Estado == "Generada" || pf.Estado == "Aceptada");
        }

        private static string TextoProforma(ProformaDelViaje pf)
        {
            return (string.IsNullOrEmpty(pf.Numero) ? "#" + pf.Proforma_ID : pf.Numero) + " (" + pf.Estado + ")";
        }

        private const string SELECT_ESTADO =
            "SELECT v.Viaje_ID, v.Estado, RTRIM(ISNULL(v.Num_Remito,'')) AS Num_Remito, RTRIM(ISNULL(v.Num_de_Carga,'')) AS Num_de_Carga, " +
            "RTRIM(ISNULL(v.Num_Transporte,'')) AS Num_Transporte, v.TarifarioID, v.Fecha_Inicio, " +
            "ISNULL(c.Tipo_Cliente,'Directo') AS Tipo_Cliente, " +
            "CAST(CASE WHEN EXISTS (SELECT 1 FROM VIAJE_EVIDENCIA e WHERE e.Viaje_ID = v.Viaje_ID) THEN 1 ELSE 0 END AS bit) AS Tiene_Evidencia " +
            "FROM VIAJES v LEFT JOIN CLIENTES c ON c.Cliente_ID = v.ClienteID ";

        private static string Cn() { return ConnectionStringHelper.GetConnectionString("SGTLEntities"); }
        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }
        private static SqlParameter[] Clonar(List<SqlParameter> ps) { return ps.Select(x => new SqlParameter(x.ParameterName, x.Value)).ToArray(); }

        // Usu_Modi es varchar(20).
        private static string UsuarioCorto(string u)
        {
            u = string.IsNullOrWhiteSpace(u) ? "sistema" : u.Trim();
            return u.Length > 20 ? u.Substring(0, 20) : u;
        }

        private static void AgregarRangoFecha(StringBuilder where, List<SqlParameter> ps, string columna, string desde, string hasta, string prefijo)
        {
            DateTime d;
            if (!string.IsNullOrWhiteSpace(desde) && DateTime.TryParse(desde, CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
            {
                where.Append(" AND " + columna + " >= " + prefijo + "Desde ");
                ps.Add(P(prefijo + "Desde", d.Date));
            }
            if (!string.IsNullOrWhiteSpace(hasta) && DateTime.TryParse(hasta, CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
            {
                where.Append(" AND " + columna + " < " + prefijo + "Hasta ");
                ps.Add(P(prefijo + "Hasta", d.Date.AddDays(1)));
            }
        }

        private static string EstadoActual(DbContext db, int id)
        {
            return db.Database.SqlQuery<string>("SELECT Estado FROM VIAJES WHERE Viaje_ID=@id", P("@id", id)).FirstOrDefault();
        }

        // Viajes anteriores al circuito de estados pueden no tener Estado cargado.
        private static bool EsRegistrado(string estado)
        {
            return string.IsNullOrEmpty(estado) || estado == EstadoRegistrado;
        }

        private static string Recortar(string s, int max)
        {
            s = (s ?? "").Trim();
            return s.Length > max ? s.Substring(0, max) : s;
        }

        private static void AuditarKmManual(int viajeId, ViajeDto v, string usuario)
        {
            if (string.IsNullOrWhiteSpace(v.Km_Manual_Motivo))
                return;
            SGTLAuditContext.RegistrarEvento(Cn(), UsuarioCorto(usuario), "KM_MANUAL", "VIAJES", "Viaje_ID=" + viajeId,
                "Km cargados a mano: " + Recortar(v.Distancia_KM, 20) + ". Motivo: " + Recortar(v.Km_Manual_Motivo, 200)
                + ". Google: " + (string.IsNullOrWhiteSpace(v.Km_Manual_Error_Google) ? "-" : Recortar(v.Km_Manual_Error_Google, 200)));
        }

        private static List<object> ValidarCamposBloqueados(VIAJES actual, TarifaGuardadaRow guardada, ViajeDto nuevo, string estado, bool permiteTarifa = false,
            bool permiteAsignacion = false)
        {
            var cambiados = new List<string>();
            if (actual.ClienteID != nuevo.ClienteID) cambiados.Add("cliente");
            if (actual.OrigenID != nuevo.OrigenID) cambiados.Add("origen");
            if (actual.DestinoID != nuevo.DestinoID) cambiados.Add("destino");
            if (!permiteAsignacion && actual.ChoferID != nuevo.ChoferID) cambiados.Add("chofer");
            if (!permiteAsignacion && actual.CamionID != nuevo.CamionID) cambiados.Add("camión");
            if (!permiteTarifa && CambiaTarifario(guardada, nuevo))
                cambiados.Add("tarifa");

            var errores = new List<object>();
            if (cambiados.Any())
                errores.Add(new
                {
                    PropertyName = "Estado",
                    ErrorMessage = "El viaje está " + estado.Replace('_', ' ') + ": solo se pueden modificar los números de remito, transporte y entrega. "
                        + "No se puede cambiar " + string.Join(", ", cambiados) + "."
                });
            return errores;
        }

        private static void GuardarNumTransporte(DbContext db, int id, string numTransporte)
        {
            db.Database.ExecuteSqlCommand("UPDATE VIAJES SET Num_Transporte=@t WHERE Viaje_ID=@id",
                P("@t", string.IsNullOrEmpty(numTransporte) ? null : numTransporte), P("@id", id));
        }

        // ===================== Importe del viaje (tabla de tarifas, 24/10) =====================
        // El viaje guarda su importe (database/tarifas/02_*.sql): la API lo calcula al guardar con TarifarioCalculo (no
        // toma el de la pantalla). La base (la tarifa sin adicionales) se vuelve a calcular solo si cambia lo que la
        // define o si el viaje todavía no la tiene; si no, se conserva aunque la tarifa haya cambiado después (§33).
        // Falso flete y estadía se suman siempre sobre la base.

        private class TarifaGuardadaRow
        {
            public int? TarifarioID { get; set; }
            public string Tarifa_Modo { get; set; }
            public int? Vuelta { get; set; }
            public int Estadia_Modulos { get; set; }
            public bool Falso_Flete { get; set; }
            public decimal? Importe_Base { get; set; }
            public string Tarifa_Detalle { get; set; }
        }

        private static TarifaGuardadaRow TarifaGuardada(DbContext db, int id)
        {
            return db.Database.SqlQuery<TarifaGuardadaRow>(
                "SELECT TarifarioID, Tarifa_Modo, Vuelta, Estadia_Modulos, Falso_Flete, Importe_Base, Tarifa_Detalle FROM VIAJES WHERE Viaje_ID=@id",
                P("@id", id)).FirstOrDefault() ?? new TarifaGuardadaRow();
        }

        private static bool UsaTarifario(int? tarifarioId) { return (tarifarioId ?? 0) > 0; }

        // Con la tabla de tarifas: "Km" o, si no, "Fija".
        private static string Modo(string modo) { return modo == "Km" ? "Km" : "Fija"; }

        private static bool CambiaTarifario(TarifaGuardadaRow guardada, ViajeDto nuevo)
        {
            if (UsaTarifario(guardada.TarifarioID) != UsaTarifario(nuevo.TarifarioID)) return true;
            if (!UsaTarifario(nuevo.TarifarioID)) return false;
            if (Modo(guardada.Tarifa_Modo) != Modo(nuevo.Tarifa_Modo)) return true;
            return Modo(nuevo.Tarifa_Modo) == "Fija" && (guardada.Vuelta ?? 1) != (nuevo.Vuelta ?? 1);
        }

        // Lo que define la base. Se compara antes de pasar los datos nuevos a la entidad.
        private static bool CambiaLaTarifa(VIAJES actual, TarifaGuardadaRow guardada, ViajeDto nuevo)
        {
            return CambiaTarifario(guardada, nuevo)
                || (UsaTarifario(nuevo.TarifarioID) && actual.ClienteID != nuevo.ClienteID)   // otro cliente puede tener otra tabla
                || actual.CamionID != nuevo.CamionID
                || !MismaDistancia(actual.Distancia_KM, nuevo.Distancia_KM)
                || actual.Fecha_Inicio.Date != nuevo.Fecha_Inicio.Date;
        }

        private static decimal? KmDecimal(string km)
        {
            decimal x;
            return decimal.TryParse((km ?? "").Trim().Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out x) ? x : (decimal?)null;
        }

        // recalcularBase = false: conserva la base guardada y solo vuelve a sumar los adicionales.
        private static TarifarioCalculo.Resultado CalcularImporte(DbContext db, int viajeId, ViajeDto v, TarifaGuardadaRow guardada, bool recalcularBase)
        {
            var pedido = new TarifarioCalculo.Pedido
            {
                ViajeId = viajeId,
                ClienteID = v.ClienteID,
                UsaTarifario = UsaTarifario(v.TarifarioID),
                PorKm = UsaTarifario(v.TarifarioID) && Modo(v.Tarifa_Modo) == "Km",
                FechaInicio = v.Fecha_Inicio,
                CamionID = v.CamionID,
                Km = KmDecimal(v.Distancia_KM),
                Vuelta = v.Vuelta,
                FalsoFlete = v.Falso_Flete,
                EstadiaModulos = v.Estadia_Modulos
            };
            if (recalcularBase || !guardada.Importe_Base.HasValue)
                return TarifarioCalculo.Calcular(db, pedido);

            var conservada = new TarifarioCalculo.Resultado
            {
                Ok = true,
                TarifarioID = guardada.TarifarioID,
                AplicaVuelta = guardada.Vuelta.HasValue,
                Vuelta = guardada.Vuelta,
                ImporteBase = guardada.Importe_Base.Value,
                TarifaDetalle = guardada.Tarifa_Detalle ?? ""
            };
            return TarifarioCalculo.Completar(db, conservada, pedido);
        }

        private static bool CambianAdicionales(TarifaGuardadaRow guardada, ViajeDto nuevo)
        {
            return guardada.Falso_Flete != nuevo.Falso_Flete || guardada.Estadia_Modulos != nuevo.Estadia_Modulos;
        }

        // Con lo que queda en el viaje: los datos nuevos donde se pueden cambiar y los guardados donde no.
        private static ViajeDto DatosParaImporte(VIAJES viaje, ViajeDto nuevo, TarifaGuardadaRow guardada, bool tarifaEditable)
        {
            return new ViajeDto
            {
                ClienteID = viaje.ClienteID,
                OrigenID = viaje.OrigenID,
                DestinoID = viaje.DestinoID,
                Distancia_KM = viaje.Distancia_KM,
                Fecha_Inicio = viaje.Fecha_Inicio,
                CamionID = viaje.CamionID,
                TarifarioID = tarifaEditable ? nuevo.TarifarioID : guardada.TarifarioID,
                Tarifa_Modo = tarifaEditable ? nuevo.Tarifa_Modo : guardada.Tarifa_Modo,
                Vuelta = tarifaEditable ? nuevo.Vuelta : guardada.Vuelta,
                Falso_Flete = nuevo.Falso_Flete,
                Estadia_Modulos = nuevo.Estadia_Modulos
            };
        }

        private static List<object> ErrorTarifa(TarifarioCalculo.Resultado r)
        {
            return new List<object> { new { PropertyName = "Tarifa", ErrorMessage = r.Mensaje } };
        }

        private static void GuardarImporte(DbContext db, int id, ViajeDto v, TarifarioCalculo.Resultado r)
        {
            db.Database.ExecuteSqlCommand(
                "UPDATE VIAJES SET TarifarioID=@t, Tarifa_Modo=@modo, Vuelta=@vuelta, Estadia_Modulos=@est, Falso_Flete=@ff, Importe_Base=@base, " +
                "Tarifa_Detalle=@tdet, Importe=@imp, Importe_Detalle=@idet WHERE Viaje_ID=@id",
                P("@t", r.TarifarioID), P("@modo", r.TarifarioID.HasValue ? Modo(v.Tarifa_Modo) : null),
                P("@vuelta", r.AplicaVuelta ? r.Vuelta : null), P("@est", v.Estadia_Modulos),
                P("@ff", v.Falso_Flete), P("@base", r.ImporteBase), P("@tdet", r.TarifaDetalle), P("@imp", r.Importe),
                P("@idet", r.ImporteDetalle), P("@id", id));
        }

        // ===================== Precio por orden del día (§43, OrdenDelDia) =====================
        // La vuelta la decide siempre la API (no la pantalla): el primer viaje del día de ese cliente y recorrido es la 1ª y los
        // demás, la 2ª. Al guardar o eliminar, los otros viajes del grupo se acomodan (los que no salieron) o quedan para
        // revisar (docs/diseno/vuelta-del-dia-diseno.md).

        // El plan con los datos que quedan. aplica: la tarifa del viaje tiene primero y segundo viaje.
        private static OrdenDelDia.Plan PlanDelViaje(DbContext db, int id, ViajeDto v, bool aplica, decimal? importe,
            OrdenDelDia.Sujeto antes, string causa)
        {
            var despues = !aplica ? null : new OrdenDelDia.Sujeto
            {
                Clase = OrdenDelDia.Viaje, Id = id, ClienteID = v.ClienteID, OrigenID = v.OrigenID, DestinoID = v.DestinoID,
                Inicio = v.Fecha_Inicio, Estado = antes != null ? antes.Estado : EstadoRegistrado,
                DePresupuesto = antes != null && antes.DePresupuesto,
                Vuelta = antes != null && antes.DePresupuesto ? antes.Vuelta : null,
                Aplica = true, Importe = importe
            };
            if (despues == null && (antes == null || !antes.Aplica)) return null;
            return OrdenDelDia.Planificar(db, despues, antes, causa);
        }

        // Después de guardar: lo que se actualizó solo y lo que quedó para revisar (para el aviso de la pantalla).
        private static object AplicarOrden(DbContext db, OrdenDelDia.Plan plan, string causa, string usuario)
        {
            if (plan == null || !plan.Cambios.Any()) return null;
            plan.Causa = causa;
            var hecho = OrdenDelDia.Aplicar(db, plan, usuario, Cn());
            return new
            {
                Actualizados = hecho.Actualizados.Select(c => new { c.Quien.Id, Importe = c.ImporteNuevo }).ToList(),
                ParaRevisar = hecho.ParaRevisar.Select(c => new { c.Quien.Clase, c.Quien.Id }).ToList()
            };
        }

        private static bool LeerFecha(string texto, out DateTime fecha)
        {
            return DateTime.TryParse(texto ?? "", CultureInfo.InvariantCulture, DateTimeStyles.None, out fecha);
        }

        // GET api/Viajes/Ocupado: el camión o el chofer ya tienen otro viaje (o un presupuesto aceptado) en ese horario. La
        // pantalla lo pregunta al elegirlos o al cambiar el inicio o el fin; el guardado lo vuelve a controlar.
        [HttpGet]
        [Route("api/Viajes/Ocupado")]
        public IHttpActionResult Ocupado(string inicio, string fin, int camionId = 0, int choferId = 0, int viajeId = 0, int presupuestoId = 0)
        {
            DateTime desde, hasta;
            if (!LeerFecha(inicio, out desde) || !LeerFecha(fin, out hasta)) return Ok(new List<object>());
            try
            {
                using (var db = new DbContext(Cn()))
                    return Ok(Ocupacion.Errores(db, camionId, choferId, desde, hasta, viajeId, presupuestoId));
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // GET api/Viajes/{id}/AlEliminar: qué pasa con los otros viajes del grupo si se elimina (para la confirmación, después
        // de "No se puede deshacer.").
        [HttpGet]
        [Route("api/Viajes/{id:int}/AlEliminar")]
        public IHttpActionResult AlEliminar(int id)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var antes = OrdenDelDia.SujetoDeViaje(db, id);
                    if (antes == null || !antes.Aplica) return Ok(new { Mensaje = "" });
                    return Ok(new { Mensaje = OrdenDelDia.QuePasa(OrdenDelDia.Planificar(db, null, antes, "")) });
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // GET api/Viajes/{id}/Orden: Ver detalle y Editar, como está guardado: la línea ("Se cobra como segundo viaje del día:
        // …"; vacía si el viaje no tiene vuelta) y el grupo del viaje (vacío si es el único).
        [HttpGet]
        [Route("api/Viajes/{id:int}/Orden")]
        public IHttpActionResult Orden(int id)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var sujeto = OrdenDelDia.SujetoDeViaje(db, id);
                    var grupo = OrdenDelDia.GrupoGuardado(db, id);
                    string linea = sujeto != null && sujeto.Aplica
                        ? OrdenDelDia.Linea(new OrdenDelDia.Plan { Aplica = true, Vuelta = sujeto.Vuelta, Grupo = grupo }) : "";
                    return Ok(new
                    {
                        Linea = linea,
                        Grupo = grupo.Select(i => new
                        {
                            i.Clase, i.Id, i.Este, i.Estado, i.DePresupuesto, Hora = OrdenDelDia.Hora(i.Inicio), Orden = i.VueltaNueva, i.Importe
                        }).ToList()
                    });
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        public class PrecioDto
        {
            public string Usuario { get; set; }
        }

        // POST api/Viajes/{id}/Precio: "Actualizar el precio" de un viaje que quedó para revisar por el orden del día (ya salió y
        // no está en una proforma generada ni en un comprobante). "Mantener el precio" es Resolver de api/Tarifario/Revisar.
        [HttpPost]
        [Route("api/Viajes/{id:int}/Precio")]
        public IHttpActionResult ActualizarPrecio(int id, [FromBody] PrecioDto dto)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    string error;
                    var mensaje = OrdenDelDia.ActualizarPrecio(db, id, dto == null ? null : dto.Usuario, Cn(), out error);
                    if (error != null) return Content(HttpStatusCode.Conflict, new { error });
                    return Ok(new { Message = mensaje });
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        private static string TipoCliente(DbContext db, int clienteId)
        {
            return db.Database.SqlQuery<string>("SELECT ISNULL(Tipo_Cliente,'Directo') FROM CLIENTES WHERE Cliente_ID=@id", P("@id", clienteId)).FirstOrDefault();
        }

        // Directo: SGTL le envia la hoja de ruta al chofer por WhatsApp. Con plataforma el chofer puede asignarse despues.
        private static List<object> ValidarChofer(DbContext db, ViajeDto v)
        {
            var errores = new List<object>();
            if (v.ChoferID <= 0 && !EsConPlataforma(TipoCliente(db, v.ClienteID)))
                errores.Add(new { PropertyName = "ChoferID", ErrorMessage = "Debe seleccionar un chofer para los viajes de clientes directos." });
            return errores;
        }

        // El envio nunca impide guardar el viaje: si falla queda registrado en App_Data/whatsapp.log.
        private static object ResultadoWhatsApp(WhatsAppNotifyResult wa)
        {
            if (wa == null) return null;
            return new { wa.Sent, wa.Status, wa.Detail, wa.To };
        }

        private object NotificarChofer(SGTLAuditContext db, VIAJES viaje)
        {
            if (viaje == null || viaje.ChoferID <= 0)
                return null;
            return ResultadoWhatsApp(_whatsAppDispatcher.TryNotifyViajeAsignado(db, viaje));
        }

        private object NotificarCancelacion(SGTLAuditContext db, VIAJES viaje)
        {
            if (viaje == null || viaje.ChoferID <= 0)
                return null;
            return ResultadoWhatsApp(_whatsAppDispatcher.TryNotifyViajeCancelado(db, viaje));
        }

        private object NotificarDesasignacion(SGTLAuditContext db, VIAJES viaje, int choferAnteriorId)
        {
            if (viaje == null || choferAnteriorId <= 0)
                return null;
            return ResultadoWhatsApp(_whatsAppDispatcher.TryNotifyViajeDesasignado(db, viaje, choferAnteriorId));
        }

        // Se contemplan tanto los vínculos normalizados como las líneas históricas
        // que identifican un viaje con el código V{id}.
        private static bool EstaVinculadoAProformaFacturada(DbContext db, int viajeId)
        {
            const string sql = @"
SELECT CAST(CASE WHEN EXISTS (
    SELECT 1
    FROM dbo.COMPROBANTES_PROFORMAS cp
    INNER JOIN dbo.PROFORMAS p ON p.Proforma_ID=cp.ProformaID
    INNER JOIN dbo.COMPROBANTES c ON c.Comprobante_ID=cp.ComprobanteID
    WHERE cp.Vigente=1 AND c.Impacto='D' AND c.Estado='EMITIDO'
      AND (
          EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv
                  WHERE pv.ProformaID=p.Proforma_ID AND pv.ViajeID=@viajeId)
          OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd
                     WHERE pd.Proforma_ID=p.Proforma_ID
                       AND UPPER(LTRIM(RTRIM(ISNULL(pd.Codigo,''))))='V'+CONVERT(varchar(11),@viajeId))
      )
) THEN 1 ELSE 0 END AS bit);";

            return db.Database.SqlQuery<bool>(sql, new SqlParameter("@viajeId", viajeId)).FirstOrDefault();
        }

        // GET: api/Viajes
        // Lista todos los viajes con las descripciones de origen y destino resueltas.
        public IHttpActionResult Get()
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var olist = (from v in db.Set<VIAJES>()
                                 join o in db.Set<ORIGEN>() on v.OrigenID equals o.Origen_ID into oj
                                 from o in oj.DefaultIfEmpty()
                                 join d in db.Set<DESTINO>() on v.DestinoID equals d.Destino_ID into dj
                                 from d in dj.DefaultIfEmpty()
                                 select new
                                 {
                                     v.Viaje_ID,
                                     v.OrigenID,
                                     v.DestinoID,
                                     Origen = o != null ? o.Descripcion : "",
                                     Destino = d != null ? d.Descripcion : "",
                                     v.Distancia_KM,
                                     v.Num_Remito,
                                     v.Num_de_Carga,
                                     v.Fecha_Inicio,
                                     v.Fecha_Fin,
                                     v.ChoferID,
                                     v.CamionID,
                                     v.ClienteID,
                                     v.Fecha_Alta,
                                     v.Usu_Alta,
                                     v.Fecha_Modi,
                                     v.Usu_Modi
                                 })
                                 .OrderByDescending(v => v.Viaje_ID)
                                 .ToList();

                    if (olist == null || !olist.Any())
                    {
                        return NotFound();
                    }

                    return Ok(olist);
                }
            }
            catch (DbEntityValidationException ex)
            {
                var validationErrors = new List<string>();
                foreach (var validationResult in ex.EntityValidationErrors)
                {
                    foreach (var error in validationResult.ValidationErrors)
                    {
                        validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                    }
                }
                return Content(HttpStatusCode.BadRequest, validationErrors);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // GET: api/Viajes/Buscar
        // Filtros y orden opcionales antes de paginar. Devuelve { TotalRecords, Results = [...] } como lo consume gestion-viajes.html.
        // fechaDesde/fechaHasta filtran por Fecha_Inicio; fechaFinDesde/fechaFinHasta por Fecha_Fin.
        // referencia busca en N° remito, N° transporte SAP y N° entrega Rukas.
        [HttpGet]
        [Route("api/Viajes/Buscar")]
        public IHttpActionResult Buscar(string idViaje = null, string fechaDesde = null, string fechaHasta = null,
            string fechaFinDesde = null, string fechaFinHasta = null, string estado = null, int? clienteId = null,
            string referencia = null, int page = 1, int pageSize = 6, string orden = null, string direccion = null)
        {
            if (page < 1) page = 1;
            // pageSize = 0 significa "todos" (selector de paginacion compartido).
            if (pageSize < 0 || pageSize > MaxPageSize) pageSize = 6;

            var where = new StringBuilder(" WHERE 1=1 ");
            var ps = new List<SqlParameter>();
            if (!string.IsNullOrEmpty(idViaje) && int.TryParse(idViaje, out int viajeId))
            {
                where.Append(" AND v.Viaje_ID=@id ");
                ps.Add(P("@id", viajeId));
            }
            AgregarRangoFecha(where, ps, "v.Fecha_Inicio", fechaDesde, fechaHasta, "@fi");
            AgregarRangoFecha(where, ps, "v.Fecha_Fin", fechaFinDesde, fechaFinHasta, "@ff");
            if (!string.IsNullOrWhiteSpace(estado))
            {
                where.Append(" AND v.Estado=@estado ");
                ps.Add(P("@estado", estado.Trim()));
            }
            if (clienteId.HasValue && clienteId.Value > 0)
            {
                where.Append(" AND v.ClienteID=@cli ");
                ps.Add(P("@cli", clienteId.Value));
            }
            if (!string.IsNullOrWhiteSpace(referencia))
            {
                where.Append(" AND (v.Num_Remito LIKE @ref OR v.Num_Transporte LIKE @ref OR v.Num_de_Carga LIKE @ref) ");
                var r = referencia.Trim().Replace("[", "[[]").Replace("%", "[%]").Replace("_", "[_]");
                ps.Add(P("@ref", "%" + r + "%"));
            }

            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    int totalRecords = db.Database.SqlQuery<int>("SELECT COUNT(*) FROM VIAJES v" + where, Clonar(ps)).First();

                    if (pageSize == 0)
                    {
                        page = 1;
                        pageSize = Math.Max(totalRecords, 1);
                    }

                    var pPage = Clonar(ps).ToList();
                    pPage.Add(P("@off", (page - 1) * pageSize));
                    pPage.Add(P("@lim", pageSize));
                    var results = db.Database.SqlQuery<ViajeGrillaDto>(
                        Grilla(db) + where + ViajesOrdenSql.Obtener(orden, direccion) + " OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY",
                        pPage.ToArray()).ToList();

                    return Ok(new
                    {
                        TotalRecords = totalRecords,
                        Results = results
                    });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Error al acceder a la base de datos durante la busqueda de viajes.", ex));
            }
        }

        private class ResumenCostoRow
        {
            public int CantidadViajes { get; set; }
            public int ViajesConImporte { get; set; }
            public decimal CostoTotal { get; set; }
        }

        // GET: api/Viajes/ResumenCosto?fechaDesde=AAAA-MM-DD&fechaHasta=AAAA-MM-DD
        // Tarjeta "Importe promedio por viaje" del dashboard (antes "Costo por viaje") (index.html). Importe = el que guardó el viaje al calcular su tarifa con
        // la tabla de tarifas (con los adicionales).
        // Las fechas son opcionales y filtran por Fecha_Inicio, igual que Buscar; sin fechas, todos los viajes.
        [HttpGet]
        [Route("api/Viajes/ResumenCosto")]
        public IHttpActionResult ResumenCosto(string fechaDesde = null, string fechaHasta = null)
        {
            // Sin los cancelados: no se hicieron.
            var where = new StringBuilder(" WHERE ISNULL(v.Estado, '') <> '" + EstadoCancelado + "' ");
            var ps = new List<SqlParameter>();
            AgregarRangoFecha(where, ps, "v.Fecha_Inicio", fechaDesde, fechaHasta, "@fi");

            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var r = db.Database.SqlQuery<ResumenCostoRow>(
                        "SELECT COUNT(*) AS CantidadViajes, COUNT(x.Importe) AS ViajesConImporte, CAST(ISNULL(SUM(x.Importe),0) AS decimal(18,2)) AS CostoTotal FROM (" +
                        " SELECT v.Importe FROM VIAJES v" +
                        where + ") x", Clonar(ps)).First();

                    decimal promedio = r.ViajesConImporte > 0 ? decimal.Round(r.CostoTotal / r.ViajesConImporte, 2) : 0;
                    return Ok(new { cantidadViajes = r.CantidadViajes, costoTotal = r.CostoTotal, costoPromedio = promedio });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Error al calcular el resumen de costos de viajes.", ex));
            }
        }

        // POST: api/Viajes/{id}/WhatsApp
        // Reenvía la hoja de ruta al chofer (manual desde Gestionar viajes). No cambia el viaje.
        // Solo con el viaje Registrado o En viaje, que es cuando la hoja de ruta le sirve al chofer (Rocío, 28/10).
        // Si Meta falla, responde igual con WhatsApp.Sent=false; el error queda en App_Data/whatsapp.log.
        [HttpPost]
        [Route("api/Viajes/{id:int}/WhatsApp")]
        public IHttpActionResult ReenviarWhatsApp(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var viaje = db.Set<VIAJES>().FirstOrDefault(v => v.Viaje_ID == id);
                    if (viaje == null) return NotFound();
                    var estado = EstadoActual(db, id);
                    if (!EsRegistrado(estado) && estado != EstadoEnViaje)
                        return Content(HttpStatusCode.BadRequest, new { message = "No se puede reenviar el WhatsApp: el viaje está " + estado.Replace('_', ' ').ToLowerInvariant() + "." });
                    if (viaje.ChoferID <= 0)
                        return Content(HttpStatusCode.BadRequest, new { message = "No se puede reenviar el WhatsApp: el viaje no tiene chofer asignado." });

                    var whatsApp = NotificarChofer(db, viaje);
                    return Ok(new { Viaje_ID = id, WhatsApp = whatsApp });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Error al reenviar el WhatsApp del viaje.", ex));
            }
        }

        // POST: api/Viajes/{id}/Estado
        // Avanza/retrocede un paso del ciclo y registra el resultado de entrega
        // (opcional con plataforma; obligatorio en clientes directos para pasar a Entregado, con la evidencia).
        // La pantalla sube la evidencia antes de llamar a este metodo.
        [HttpPost]
        [Route("api/Viajes/{id:int}/Estado")]
        public IHttpActionResult CambiarEstado(int id, [FromBody] CambioEstadoViajeDto body)
        {
            if (body == null || string.IsNullOrWhiteSpace(body.Estado)) return BadRequest("Falta el estado.");
            var nuevo = body.Estado.Trim();
            var resultado = string.IsNullOrWhiteSpace(body.Resultado_Entrega) ? null : body.Resultado_Entrega.Trim();

            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var v = db.Database.SqlQuery<EstadoViajeRow>(SELECT_ESTADO + " WHERE v.Viaje_ID=@id", P("@id", id)).FirstOrDefault();
                    if (v == null) return NotFound();

                    var proformaDelViaje = ProformaQueIncluye(db, id);
                    if (BloqueaPorProforma(proformaDelViaje))
                        return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Estado", ErrorMessage = "El viaje está en la proforma " + TextoProforma(proformaDelViaje) + ": no se puede cambiar su estado. Si hay que corregirlo, anulá la proforma." } });
                    // Cancelar (desde Registrado) y reactivar (de Cancelado a Registrado).
                    if (nuevo == EstadoCancelado || v.Estado == EstadoCancelado)
                        return CambiarCancelado(db, v, nuevo, body, proformaDelViaje);
                    // Sin carga (desde En viaje; con plataforma, desde Registrado) y volver atrás.
                    if (nuevo == EstadoSinCarga || v.Estado == EstadoSinCarga)
                        return CambiarSinCarga(db, v, nuevo, body, proformaDelViaje);
                    var errores = ValidarCambioEstado(v, FlujoEstados(v.Tipo_Cliente), nuevo, resultado, body.Fecha_Entrega);
                    if (errores.Any()) return Content(HttpStatusCode.BadRequest, errores);

                    var usuario = UsuarioCorto(body.Usuario);
                    db.Database.ExecuteSqlCommand(
                        "UPDATE VIAJES SET Estado=@e, Resultado_Entrega=@r, Fecha_Entrega=@f, Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Viaje_ID=@id",
                        P("@e", nuevo), P("@r", resultado), P("@f", body.Fecha_Entrega), P("@u", usuario), P("@id", id));

                    SGTLAuditContext.RegistrarEvento(Cn(), usuario, "ESTADO", "VIAJES", "Viaje_ID=" + id,
                        "Estado=" + v.Estado + " -> " + nuevo + "; Resultado_Entrega=" + (resultado ?? "") +
                        "; Fecha_Entrega=" + (body.Fecha_Entrega.HasValue ? body.Fecha_Entrega.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : ""));

                    return Ok(new { Viaje_ID = id, Estado = nuevo, Message = "Estado del viaje actualizado." });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Error al cambiar el estado del viaje.", ex));
            }
        }

        private class PresupuestoConOtroViaje { public int Presupuesto_ID { get; set; } public int ViajeID { get; set; } }

        private IHttpActionResult ErrorEstado(string campo, string mensaje)
        {
            return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = campo, ErrorMessage = mensaje } });
        }

        // Cancelar un viaje que no se hizo (caso E de docs/diseno/viajes-diseno.md): desde Registrado, fuera de una proforma,
        // con motivo. Deja su lugar en el día: los otros viajes de su cliente y recorrido se acomodan como al eliminarlo (§43).
        // Reactivarlo (vuelve a Registrado): el camión y el chofer tienen que estar libres y vuelve a contar en el orden del día.
        // El de un presupuesto guarda de cuál salió (Cancelado_Presupuesto_ID): si el presupuesto ya generó otro viaje, no se
        // reactiva (serían dos viajes para el mismo presupuesto).
        private IHttpActionResult CambiarCancelado(SGTLAuditContext db, EstadoViajeRow v, string nuevo, CambioEstadoViajeDto body,
            ProformaDelViaje proforma)
        {
            int id = v.Viaje_ID;
            var usuario = UsuarioCorto(body.Usuario);
            if (!HayCancelado(db)) return ErrorEstado("Estado", "Para cancelar viajes falta correr database/viajes/02_viaje_cancelado.sql.");
            var ahora = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Argentina Standard Time");

            if (nuevo == EstadoCancelado)
            {
                if (!EsRegistrado(v.Estado))
                    return ErrorEstado("Estado", v.Estado == EstadoCancelado ? "El viaje ya está cancelado."
                        : "No se puede cancelar el viaje: ya salió (está " + v.Estado.Replace('_', ' ').ToLowerInvariant() + ").");
                if (proforma != null)
                    return ErrorEstado("Estado", "No se puede cancelar el viaje: está en la proforma " + TextoProforma(proforma) + ".");
                var motivo = Recortar(body.Motivo, 300);
                if (motivo.Length == 0) return ErrorEstado("Motivo", "Completá el motivo.");

                var antes = OrdenDelDia.SujetoDeViaje(db, id);
                var plan = antes != null && antes.Aplica ? OrdenDelDia.Planificar(db, null, antes, "se canceló el viaje #" + id) : null;
                db.Database.ExecuteSqlCommand(
                    "UPDATE VIAJES SET Estado=@e, Cancelado_Motivo=@m, Cancelado_Fecha=@f, Cancelado_Usuario=@u, " +
                    "Cancelado_Presupuesto_ID=(SELECT TOP (1) ps.Presupuesto_ID FROM dbo.PRESUPUESTOS ps WHERE ps.ViajeID=@id), " +
                    "Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Viaje_ID=@id",
                    P("@e", EstadoCancelado), P("@m", motivo), P("@f", ahora), P("@u", usuario), P("@id", id));
                SGTLAuditContext.RegistrarEvento(Cn(), usuario, "ESTADO", "VIAJES", "Viaje_ID=" + id,
                    "Estado=" + (v.Estado ?? EstadoRegistrado) + " -> " + EstadoCancelado + "; Motivo=" + motivo);
                // Si su precio estaba para revisar (§33, §43), ya no hay nada que decidir: no se cobra.
                TarifarioRevisar.Resolver(db, usuario, "Se canceló el viaje.", viajeId: id);
                var orden = AplicarOrden(db, plan, "se canceló el viaje #" + id, usuario);
                // Se le avisa al chofer por WhatsApp que el viaje no se hace (plantilla de viaje cancelado).
                var whatsApp = NotificarCancelacion(db, db.Set<VIAJES>().Find(id));
                return Ok(new { Viaje_ID = id, Estado = EstadoCancelado, Message = "Viaje #" + id + " cancelado.", Orden = orden, WhatsApp = whatsApp });
            }

            if (nuevo != EstadoRegistrado) return ErrorEstado("Estado", "Un viaje cancelado solo puede volver a Registrado.");
            var otro = db.Database.SqlQuery<PresupuestoConOtroViaje>(
                "SELECT ps.Presupuesto_ID, ps.ViajeID FROM dbo.VIAJES v JOIN dbo.PRESUPUESTOS ps ON ps.Presupuesto_ID = v.Cancelado_Presupuesto_ID " +
                "WHERE v.Viaje_ID=@id AND ps.ViajeID IS NOT NULL AND ps.ViajeID <> @id", P("@id", id)).FirstOrDefault();
            if (otro != null)
                return ErrorEstado("Estado", "No se puede reactivar el viaje: el presupuesto #" + otro.Presupuesto_ID + " ya generó el viaje #" + otro.ViajeID + ".");
            var viaje = db.Set<VIAJES>().Find(id);
            var ocupado = Ocupacion.Errores(db, viaje.CamionID, viaje.ChoferID, viaje.Fecha_Inicio, viaje.Fecha_Fin, id, 0);
            if (ocupado.Any())
                return ErrorEstado("Estado", "No se puede reactivar el viaje. " + string.Join(" ", ocupado.Select(e => e.ErrorMessage)));

            db.Database.ExecuteSqlCommand(
                "UPDATE VIAJES SET Estado=@e, Cancelado_Motivo=NULL, Cancelado_Fecha=NULL, Cancelado_Usuario=NULL, Cancelado_Presupuesto_ID=NULL, " +
                "Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Viaje_ID=@id",
                P("@e", EstadoRegistrado), P("@u", usuario), P("@id", id));
            // Vuelve a contar en su día: su vuelta (la de un presupuesto se conserva) y lo que pasa con los otros.
            object ordenReactivado = null;
            var sujeto = OrdenDelDia.SujetoDeViaje(db, id);
            if (sujeto != null && sujeto.Aplica)
            {
                var despues = new OrdenDelDia.Sujeto
                {
                    Clase = OrdenDelDia.Viaje, Id = id, ClienteID = sujeto.ClienteID, OrigenID = sujeto.OrigenID, DestinoID = sujeto.DestinoID,
                    Inicio = sujeto.Inicio, Estado = EstadoRegistrado, DePresupuesto = sujeto.DePresupuesto,
                    Vuelta = sujeto.DePresupuesto ? sujeto.Vuelta : null, Aplica = true, Importe = sujeto.Importe
                };
                var plan = OrdenDelDia.Planificar(db, despues, null, "se reactivó el viaje #" + id);
                if (plan.Vuelta.HasValue && plan.Vuelta != sujeto.Vuelta) OrdenDelDia.CambiarVuelta(db, id, plan.Vuelta.Value);
                ordenReactivado = AplicarOrden(db, plan, "se reactivó el viaje #" + id, usuario);
            }
            SGTLAuditContext.RegistrarEvento(Cn(), usuario, "ESTADO", "VIAJES", "Viaje_ID=" + id, "Estado=" + EstadoCancelado + " -> " + EstadoRegistrado);
            // El último WhatsApp que tuvo el chofer fue el de cancelado: se le reenvía la hoja de ruta (Rocío, 28/10).
            var whatsAppReactivado = NotificarChofer(db, viaje);
            return Ok(new { Viaje_ID = id, Estado = EstadoRegistrado, Message = "Viaje #" + id + " reactivado.", Orden = ordenReactivado, WhatsApp = whatsAppReactivado });
        }

        // Viaje sin carga (punto 10 de la §41; antes "falso flete", Rocío 27/10): el camión llegó al origen y no había carga.
        // Desde En viaje (con plataforma, que no pasa por En viaje, desde Registrado) y fuera de una proforma, con la fecha y una
        // observación opcional. Se cobra el porcentaje de la tabla (Falso_Flete = 1) y sigue a la proforma como un entregado; la
        // fecha va en Fecha_Entrega. Si fue un error vuelve al estado de antes y se cobra completo. Para volver a ir, otro viaje.
        private IHttpActionResult CambiarSinCarga(SGTLAuditContext db, EstadoViajeRow v, string nuevo, CambioEstadoViajeDto body,
            ProformaDelViaje proforma)
        {
            int id = v.Viaje_ID;
            var usuario = UsuarioCorto(body.Usuario);
            if (!HaySinCarga(db)) return ErrorEstado("Estado", "Para marcar viajes sin carga falta correr database/viajes/03_viaje_sin_carga.sql.");
            bool conPlataforma = EsConPlataforma(v.Tipo_Cliente);
            string anterior = conPlataforma ? EstadoRegistrado : EstadoEnViaje;
            bool sinCarga = nuevo == EstadoSinCarga;
            DateTime? fecha = null;
            string observacion = null;
            if (sinCarga)
            {
                if (v.Estado == EstadoSinCarga) return ErrorEstado("Estado", "El viaje ya está sin carga.");
                if (conPlataforma ? !EsRegistrado(v.Estado) : v.Estado != EstadoEnViaje)
                    return ErrorEstado("Estado", "No se puede marcar sin carga: el viaje está " + (v.Estado ?? EstadoRegistrado).Replace('_', ' ').ToLowerInvariant() + ".");
                if (!body.Fecha_Entrega.HasValue) return ErrorEstado("Fecha_Entrega", "Elegí la fecha.");
                fecha = body.Fecha_Entrega.Value.Date;
                var hoy = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Argentina Standard Time").Date;
                if (fecha < v.Fecha_Inicio.Date) return ErrorEstado("Fecha_Entrega", "La fecha no puede ser anterior al inicio del viaje.");
                if (fecha > hoy) return ErrorEstado("Fecha_Entrega", "La fecha no puede ser posterior a hoy.");
                observacion = Recortar(body.Motivo, 300);
                if (observacion.Length == 0) observacion = null;
            }
            else if (nuevo != anterior)
                return ErrorEstado("Estado", "Un viaje sin carga solo puede volver a " + (conPlataforma ? "Registrado" : "En viaje") + ".");
            // En un borrador cambia lo que se cobra: primero se quita del borrador.
            if (proforma != null)
                return ErrorEstado("Estado", (sinCarga ? "No se puede marcar sin carga: " : "No se puede cambiar el estado: ") + "el viaje está en la proforma "
                    + TextoProforma(proforma) + ".");

            // El importe con el porcentaje de la tabla (o completo, si vuelve atrás); la base y la estadía no cambian.
            var viaje = db.Set<VIAJES>().Find(id);
            var guardada = TarifaGuardada(db, id);
            var datos = DatosParaImporte(viaje, new ViajeDto { Falso_Flete = sinCarga, Estadia_Modulos = guardada.Estadia_Modulos }, guardada, false);
            var calculo = CalcularImporte(db, id, datos, guardada, false);
            if (!calculo.Ok) return Content(HttpStatusCode.BadRequest, ErrorTarifa(calculo));

            db.Database.ExecuteSqlCommand(
                "UPDATE VIAJES SET Estado=@e, Resultado_Entrega=NULL, Fecha_Entrega=@f, Sin_Carga_Observacion=@o, Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Viaje_ID=@id",
                P("@e", nuevo), P("@f", fecha), P("@o", observacion), P("@u", usuario), P("@id", id));
            GuardarImporte(db, id, datos, calculo);
            SGTLAuditContext.RegistrarEvento(Cn(), usuario, "ESTADO", "VIAJES", "Viaje_ID=" + id,
                "Estado=" + (v.Estado ?? EstadoRegistrado) + " -> " + nuevo + (observacion != null ? "; Observación=" + observacion : "")
                + "; Importe=" + calculo.Importe.ToString("0.00", CultureInfo.InvariantCulture));
            var mensaje = sinCarga
                ? "Viaje #" + id + " sin carga. Se cobra " + TarifarioCalculo.Pesos(calculo.Importe)
                    + (calculo.FalsoFletePorcentaje.HasValue ? " (" + calculo.FalsoFletePorcentaje.Value.ToString("0.##", new CultureInfo("es-AR")) + " % de la tarifa)" : "") + "."
                : "Viaje #" + id + " vuelve a " + (conPlataforma ? "registrado" : "en viaje") + ". Se cobra " + TarifarioCalculo.Pesos(calculo.Importe) + ".";
            return Ok(new { Viaje_ID = id, Estado = nuevo, Message = mensaje });
        }

        // POST: api/Viajes/{id}/Evidencia
        // Adjunto de la entrega (foto o PDF del remito firmado / conforme). Uno por viaje: reemplaza el anterior.
        [HttpPost]
        [Route("api/Viajes/{id:int}/Evidencia")]
        public IHttpActionResult SubirEvidencia(int id, [FromBody] EvidenciaDto body)
        {
            if (body == null || string.IsNullOrWhiteSpace(body.ContenidoBase64)) return BadRequest("No se recibió el archivo.");
            var tipo = (body.Content_Type ?? "").Trim().ToLowerInvariant();
            if (Array.IndexOf(TiposEvidencia, tipo) < 0)
                return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Evidencia", ErrorMessage = "Formato no admitido: subí una imagen (JPG, PNG, WEBP) o un PDF." } });

            byte[] archivo;
            try
            {
                var b64 = body.ContenidoBase64;
                int coma = b64.IndexOf(',');
                if (b64.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && coma >= 0) b64 = b64.Substring(coma + 1);
                archivo = Convert.FromBase64String(b64);
            }
            catch (FormatException)
            {
                return BadRequest("El archivo no es válido.");
            }
            if (archivo.Length == 0 || archivo.Length > MaxBytesEvidencia)
                return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Evidencia", ErrorMessage = "El archivo debe pesar como máximo 5 MB." } });

            var nombre = (body.Nombre_Archivo ?? "").Trim();
            nombre = nombre.Substring(nombre.LastIndexOfAny(new[] { '/', '\\' }) + 1);
            foreach (var c in System.IO.Path.GetInvalidFileNameChars()) nombre = nombre.Replace(c, '_');
            if (nombre.Length == 0) nombre = "evidencia";
            if (nombre.Length > 260) nombre = nombre.Substring(nombre.Length - 260);
            var usuario = UsuarioCorto(body.Usuario);

            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var v = db.Database.SqlQuery<EstadoViajeRow>(SELECT_ESTADO + " WHERE v.Viaje_ID=@id", P("@id", id)).FirstOrDefault();
                    if (v == null) return NotFound();
                    var estado = v.Estado;
                    if (estado == EstadoFacturado)
                        return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Evidencia", ErrorMessage = "El viaje ya está facturado: no se puede cambiar la evidencia." } });
                    // Es de la entrega (punto 22 de la §41): en un directo, desde que salió (se sube al entregarlo); con
                    // plataforma, que no pasa por En viaje, desde el día del viaje.
                    if (estado == EstadoCancelado)
                        return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Evidencia", ErrorMessage = "No se puede adjuntar la evidencia: el viaje está cancelado." } });
                    var hoy = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Argentina Standard Time").Date;
                    if (EsRegistrado(estado) && !EsConPlataforma(v.Tipo_Cliente))
                        return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Evidencia", ErrorMessage = "No se puede adjuntar la evidencia: el viaje todavía no salió." } });
                    if (EsRegistrado(estado) && v.Fecha_Inicio.Date > hoy)
                        return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Evidencia", ErrorMessage = "No se puede adjuntar la evidencia: el viaje todavía no empezó." } });

                    db.Database.ExecuteSqlCommand(
                        "IF EXISTS (SELECT 1 FROM VIAJE_EVIDENCIA WHERE Viaje_ID=@id) " +
                        "  UPDATE VIAJE_EVIDENCIA SET Nombre_Archivo=@n, Content_Type=@t, Archivo=@a, Fecha_Alta=GETDATE(), Usu_Alta=@u WHERE Viaje_ID=@id " +
                        "ELSE " +
                        "  INSERT INTO VIAJE_EVIDENCIA (Viaje_ID, Nombre_Archivo, Content_Type, Archivo, Fecha_Alta, Usu_Alta) VALUES (@id, @n, @t, @a, GETDATE(), @u)",
                        P("@id", id), P("@n", nombre), P("@t", tipo),
                        new SqlParameter("@a", System.Data.SqlDbType.VarBinary, -1) { Value = archivo }, P("@u", usuario));

                    SGTLAuditContext.RegistrarEvento(Cn(), usuario, "EVIDENCIA", "VIAJES", "Viaje_ID=" + id,
                        "Evidencia adjunta: " + nombre + " (" + archivo.Length + " bytes)");

                    return Ok(new { Viaje_ID = id, Nombre_Archivo = nombre, Message = "Evidencia adjuntada." });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Error al guardar la evidencia del viaje.", ex));
            }
        }

        // GET: api/Viajes/{id}/Evidencia
        [HttpGet]
        [Route("api/Viajes/{id:int}/Evidencia")]
        public HttpResponseMessage DescargarEvidencia(int id)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var ev = db.Database.SqlQuery<EvidenciaRow>(
                        "SELECT Nombre_Archivo, Content_Type, Archivo FROM VIAJE_EVIDENCIA WHERE Viaje_ID=@id", P("@id", id)).FirstOrDefault();
                    if (ev == null) return Request.CreateResponse(HttpStatusCode.NotFound, "El viaje no tiene evidencia adjunta.");

                    var resp = new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(ev.Archivo) };
                    resp.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(ev.Content_Type);
                    resp.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("inline") { FileName = ev.Nombre_Archivo };
                    return resp;
                }
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, new Exception("Error al obtener la evidencia del viaje.", ex));
            }
        }

        // DELETE: api/Viajes/{id}/Evidencia
        [HttpDelete]
        [Route("api/Viajes/{id:int}/Evidencia")]
        public IHttpActionResult EliminarEvidencia(int id, string usuario = null)
        {
            try
            {
                using (var db = new SGTLAuditContext(Cn()))
                {
                    var v = db.Database.SqlQuery<EstadoViajeRow>(SELECT_ESTADO + " WHERE v.Viaje_ID=@id", P("@id", id)).FirstOrDefault();
                    if (v == null) return NotFound();
                    if (v.Estado == EstadoFacturado)
                        return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Evidencia", ErrorMessage = "El viaje ya está facturado: no se puede quitar la evidencia." } });
                    // En un directo entregado la evidencia es obligatoria: se reemplaza subiendo otra, no se quita.
                    if (v.Estado == EstadoEntregado && !EsConPlataforma(v.Tipo_Cliente))
                        return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Evidencia", ErrorMessage = "El viaje está entregado y la evidencia es obligatoria: para cambiarla, subí otra." } });

                    int borradas = db.Database.ExecuteSqlCommand("DELETE FROM VIAJE_EVIDENCIA WHERE Viaje_ID=@id", P("@id", id));
                    if (borradas > 0)
                        SGTLAuditContext.RegistrarEvento(Cn(), UsuarioCorto(usuario), "EVIDENCIA", "VIAJES", "Viaje_ID=" + id, "Evidencia eliminada");
                    return Ok(new { Message = "Evidencia eliminada." });
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception("Error al eliminar la evidencia del viaje.", ex));
            }
        }

        // Solo se permite moverse un paso (adelante o atras) dentro del flujo, o quedarse en el
        // mismo estado para corregir los datos de entrega.
        private static List<object> ValidarCambioEstado(EstadoViajeRow v, string[] flujo, string nuevo, string resultado, DateTime? fechaEntrega)
        {
            var errores = new List<object>();

            // Facturado lo asigna el comprobante vinculado al emitirse y lo quita la nota de crédito cancelatoria.
            // A mano quedaría un viaje facturado sin comprobante, o liberado con el comprobante vigente.
            if (v.Estado == EstadoFacturado)
            {
                errores.Add(new { PropertyName = "Estado", ErrorMessage = "El viaje está facturado: para corregirlo emití la nota de crédito de su comprobante desde la proforma." });
                return errores;
            }
            if (nuevo == EstadoFacturado)
            {
                errores.Add(new { PropertyName = "Estado", ErrorMessage = "El estado Facturado se asigna solo al emitir un comprobante desde la proforma." });
                return errores;
            }

            int iActual = Array.IndexOf(flujo, v.Estado);
            int iNuevo = Array.IndexOf(flujo, nuevo);

            if (iNuevo < 0)
            {
                errores.Add(new { PropertyName = "Estado", ErrorMessage = "Estado no válido para este viaje: " + nuevo + "." });
                return errores;
            }
            if (iActual >= 0 && Math.Abs(iNuevo - iActual) > 1)
                errores.Add(new { PropertyName = "Estado", ErrorMessage = "Transición no permitida: " + v.Estado + " -> " + nuevo + "." });

            if (resultado != null && Array.IndexOf(ResultadosEntrega, resultado) < 0)
                errores.Add(new { PropertyName = "Resultado_Entrega", ErrorMessage = "Resultado de entrega no válido." });

            if (fechaEntrega.HasValue && fechaEntrega.Value.Date < v.Fecha_Inicio.Date)
                errores.Add(new { PropertyName = "Fecha_Entrega", ErrorMessage = "La fecha de entrega no puede ser anterior al inicio del viaje." });
            // Ni futura (punto 22 de la §41): la entrega ya pasó. Hoy en la Argentina (§2 de PENDIENTES).
            var hoy = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Argentina Standard Time").Date;
            if (fechaEntrega.HasValue && fechaEntrega.Value.Date > hoy)
                errores.Add(new { PropertyName = "Fecha_Entrega", ErrorMessage = "La fecha de entrega no puede ser posterior a hoy." });
            // Un viaje de un día que todavía no llegó no sale (caso G de docs/diseno/viajes-diseno.md): la fecha manda en el
            // orden del día, el ocupado, la tabla de tarifas y el galpón; si sale antes, primero se corrige. Uno atrasado sí
            // (es cargar lo que ya pasó). Con plataforma, lo mismo para Listo para facturar.
            if (EsRegistrado(v.Estado) && v.Fecha_Inicio.Date > hoy && (nuevo == EstadoEnViaje || nuevo == EstadoListoParaFacturar))
                errores.Add(new { PropertyName = "Estado", ErrorMessage = (nuevo == EstadoEnViaje ? "No se puede iniciar el viaje: es del " : "No se puede marcar: el viaje es del ")
                    + v.Fecha_Inicio.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) + "." });

            bool conPlataforma = EsConPlataforma(v.Tipo_Cliente);

            // Directo: SGTL es la unica constancia de la entrega, por eso la evidencia (remito firmado, o con la
            // nota de rechazo) es obligatoria con cualquier resultado.
            if (!conPlataforma && nuevo == EstadoEntregado)
            {
                if (resultado == null)
                    errores.Add(new { PropertyName = "Resultado_Entrega", ErrorMessage = "Para marcar el viaje como entregado indicá el resultado de la entrega." });
                if (!fechaEntrega.HasValue)
                    errores.Add(new { PropertyName = "Fecha_Entrega", ErrorMessage = "Para marcar el viaje como entregado indicá la fecha de entrega." });
                if (!v.Tiene_Evidencia)
                    errores.Add(new { PropertyName = "Evidencia", ErrorMessage = "Para marcar el viaje como entregado adjuntá la evidencia de la entrega (remito firmado o con la nota de rechazo)." });
            }

            // Con plataforma: los tres numeros recien existen despues de cargar en planta y entregar,
            // por eso se exigen al pasar a facturar y no al crear el viaje.
            if (nuevo == EstadoListoParaFacturar)
            {
                if (conPlataforma && string.IsNullOrWhiteSpace(v.Num_Transporte))
                    errores.Add(new { PropertyName = "Num_Transporte", ErrorMessage = "Para facturar el viaje debe tener N° de transporte SAP. Editá el viaje y cargalo." });
                if (conPlataforma && string.IsNullOrWhiteSpace(v.Num_Remito))
                    errores.Add(new { PropertyName = "Num_Remito", ErrorMessage = "Para facturar el viaje debe tener número de remito. Editá el viaje y cargalo." });
                if (conPlataforma && string.IsNullOrWhiteSpace(v.Num_de_Carga))
                    errores.Add(new { PropertyName = "Num_de_Carga", ErrorMessage = "Para facturar el viaje debe tener N° de entrega Rukas. Editá el viaje y cargalo." });
                bool tieneTarifa = (v.TarifarioID ?? 0) > 0;
                if (!tieneTarifa)
                    errores.Add(new { PropertyName = "Tarifa", ErrorMessage = "Para facturar el viaje debe tener tarifa asignada." });
            }

            return errores;
        }

        // GET: api/Viajes/{id}
        // Devuelve un viaje completo para precargar el formulario de edicion.
        public IHttpActionResult Get(int id)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var viaje = db.Set<VIAJES>().Where(v => v.Viaje_ID == id).FirstOrDefault();

                    if (viaje == null)
                    {
                        return NotFound();
                    }

                    var dto = new ViajeDto
                    {
                        Viaje_ID = viaje.Viaje_ID,
                        OrigenID = viaje.OrigenID,
                        DestinoID = viaje.DestinoID,
                        Distancia_KM = viaje.Distancia_KM,
                        Num_Remito = (viaje.Num_Remito ?? "").Trim(),
                        Num_de_Carga = (viaje.Num_de_Carga ?? "").Trim(),
                        Fecha_Inicio = viaje.Fecha_Inicio,
                        Fecha_Fin = viaje.Fecha_Fin,
                        ChoferID = viaje.ChoferID,
                        CamionID = viaje.CamionID,
                        ClienteID = viaje.ClienteID,
                        Fecha_Alta = viaje.Fecha_Alta,
                        Usu_Alta = viaje.Usu_Alta,
                        Fecha_Modi = viaje.Fecha_Modi,
                        Usu_Modi = viaje.Usu_Modi
                    };

                    var est = db.Database.SqlQuery<ViajeGrillaDto>(Grilla(db) + " WHERE v.Viaje_ID=@id", P("@id", id)).FirstOrDefault();
                    if (est != null)
                    {
                        dto.Num_Transporte = est.Num_Transporte;
                        dto.Estado = est.Estado;
                        dto.Resultado_Entrega = est.Resultado_Entrega;
                        dto.Fecha_Entrega = est.Fecha_Entrega;
                        dto.Tipo_Cliente = est.Tipo_Cliente;
                        dto.Tiene_Evidencia = est.Tiene_Evidencia;
                        dto.Facturada = est.Facturada;
                        dto.EnProforma_ID = est.EnProforma_ID;
                        dto.EnProforma_Numero = est.EnProforma_Numero;
                        dto.EnProforma_Estado = est.EnProforma_Estado;
                        dto.Presupuesto_ID = est.Presupuesto_ID;
                        dto.TarifarioID = est.TarifarioID;
                        dto.Tarifa_Modo = est.Tarifa_Modo;
                        dto.Vuelta = est.Vuelta;
                        dto.Estadia_Modulos = est.Estadia_Modulos;
                        dto.Falso_Flete = est.Falso_Flete;
                        dto.Importe_Base = est.Importe_Base;
                        dto.Tarifa_Detalle = est.Tarifa_Detalle;
                        dto.Importe = est.Importe;
                        dto.Importe_Detalle = est.Importe_Detalle;
                    }

                    return Ok(dto);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // POST: api/Viajes
        public IHttpActionResult Post([FromBody] ViajeDto viajeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (viajeDto == null)
            {
                return BadRequest("No se recibieron datos del viaje.");
            }

            // Validaciones de negocio basicas
            var errores = ValidarViaje(viajeDto);
            if (errores.Any())
            {
                return Content(HttpStatusCode.BadRequest, errores);
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var erroresChofer = ValidarChofer(db, viajeDto);
                    if (erroresChofer.Any())
                    {
                        return Content(HttpStatusCode.BadRequest, erroresChofer);
                    }

                    var ocupado = Ocupacion.Errores(db, viajeDto.CamionID, viajeDto.ChoferID, viajeDto.Fecha_Inicio, viajeDto.Fecha_Fin, 0, 0);
                    if (ocupado.Any())
                    {
                        return Content(HttpStatusCode.BadRequest, ocupado);
                    }

                    // La vuelta sale sola (§43): se calcula con la 1ª y, si es el segundo viaje del día, otra vez con la 2ª.
                    viajeDto.Vuelta = null;
                    // Sin carga es un estado (punto 10 de la §41): un viaje nuevo se cobra completo.
                    viajeDto.Falso_Flete = false;
                    var calculo = CalcularImporte(db, 0, viajeDto, new TarifaGuardadaRow(), true);
                    if (!calculo.Ok)
                    {
                        return Content(HttpStatusCode.BadRequest, ErrorTarifa(calculo));
                    }
                    var plan = PlanDelViaje(db, 0, viajeDto, calculo.AplicaVuelta, calculo.Importe, null, "se registró un viaje");
                    if (plan != null && plan.Vuelta == 2)
                    {
                        viajeDto.Vuelta = 2;
                        calculo = CalcularImporte(db, 0, viajeDto, new TarifaGuardadaRow(), true);
                        if (!calculo.Ok)
                        {
                            return Content(HttpStatusCode.BadRequest, ErrorTarifa(calculo));
                        }
                    }

                    var viaje = new VIAJES
                    {
                        OrigenID = viajeDto.OrigenID,
                        DestinoID = viajeDto.DestinoID,
                        Distancia_KM = viajeDto.Distancia_KM,
                        Num_Remito = viajeDto.Num_Remito,
                        Num_de_Carga = viajeDto.Num_de_Carga,
                        Fecha_Inicio = viajeDto.Fecha_Inicio,
                        Fecha_Fin = viajeDto.Fecha_Fin,
                        ChoferID = viajeDto.ChoferID,
                        CamionID = viajeDto.CamionID,
                        ClienteID = viajeDto.ClienteID,
                        Fecha_Alta = DateTime.Now,
                        Usu_Alta = viajeDto.Usu_Alta,
                        Fecha_Modi = DateTime.Now,
                        Usu_Modi = viajeDto.Usu_Alta
                    };

                    db.Set<VIAJES>().Add(viaje);

                    try
                    {
                        db.SaveChanges();
                        GuardarNumTransporte(db, viaje.Viaje_ID, viajeDto.Num_Transporte);
                        GuardarImporte(db, viaje.Viaje_ID, viajeDto, calculo);
                        AuditarKmManual(viaje.Viaje_ID, viajeDto, viajeDto.Usu_Alta);
                        var orden = AplicarOrden(db, plan, "se registró el viaje #" + viaje.Viaje_ID, viajeDto.Usu_Alta);
                        var whatsApp = NotificarChofer(db, viaje);
                        return Ok(new { Viaje_ID = viaje.Viaje_ID, Message = "Viaje registrado correctamente.", WhatsApp = whatsApp, Orden = orden });
                    }
                    catch (DbEntityValidationException ex)
                    {
                        var validationErrors = new List<string>();
                        foreach (var validationResult in ex.EntityValidationErrors)
                        {
                            foreach (var error in validationResult.ValidationErrors)
                            {
                                validationErrors.Add($"Property: {error.PropertyName}, Error: {error.ErrorMessage}");
                            }
                        }
                        return Content(HttpStatusCode.BadRequest, validationErrors);
                    }
                    catch (DbUpdateException ex)
                    {
                        var errorMessage = ex.InnerException?.InnerException?.Message ?? ex.InnerException?.Message ?? ex.Message;
                        return InternalServerError(new Exception("Error al guardar el viaje.", new Exception(errorMessage)));
                    }
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // PUT: api/Viajes/{id}
        public IHttpActionResult Put(int id, [FromBody] ViajeDto viajeDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (viajeDto == null)
            {
                return BadRequest("No se recibieron datos del viaje.");
            }

            var errores = ValidarViaje(viajeDto);
            if (errores.Any())
            {
                return Content(HttpStatusCode.BadRequest, errores);
            }

            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            using (var db = new SGTLAuditContext(connectionString))
            {
                var viaje = db.Set<VIAJES>().Find(id);

                if (viaje == null)
                {
                    return NotFound();
                }

                if (EstaVinculadoAProformaFacturada(db, id))
                {
                    return Content(HttpStatusCode.Conflict, new { error = "No se puede editar el viaje porque pertenece a una proforma Facturada." });
                }

                var proformaDelViaje = ProformaQueIncluye(db, id);
                if (BloqueaPorProforma(proformaDelViaje))
                {
                    return Content(HttpStatusCode.Conflict, new { error = "El viaje está en la proforma " + TextoProforma(proformaDelViaje) + ": no se puede modificar. Si hay que corregirlo, anulá la proforma." });
                }

                var estado = EstadoActual(db, id);
                if (estado == EstadoFacturado)
                {
                    return Content(HttpStatusCode.BadRequest, new List<object>
                    {
                        new { PropertyName = "Estado", ErrorMessage = "El viaje ya está facturado: no se puede editar. Si hay que corregirlo, emití la nota de crédito de su comprobante desde la proforma." }
                    });
                }
                if (estado == EstadoCancelado)
                    return Content(HttpStatusCode.BadRequest, new List<object>
                    {
                        new { PropertyName = "Estado", ErrorMessage = "No se puede editar el viaje: está cancelado." }
                    });

                // La vuelta la decide la API (§43): la que llega de la pantalla no se usa; se parte de la guardada.
                viajeDto.Vuelta = TarifaGuardada(db, id).Vuelta;
                // Sin carga lo pone el estado (punto 10 de la §41): el formulario ya no lo marca.
                viajeDto.Falso_Flete = TarifaGuardada(db, id).Falso_Flete;

                bool desdePresupuesto = db.Database.SqlQuery<int>("SELECT COUNT(*) FROM dbo.PRESUPUESTOS WHERE ViajeID=@id", new SqlParameter("@id", id)).First() > 0;
                if (desdePresupuesto && (viaje.ClienteID != viajeDto.ClienteID || viaje.OrigenID != viajeDto.OrigenID || viaje.DestinoID != viajeDto.DestinoID ||
                    !MismaDistancia(viaje.Distancia_KM, viajeDto.Distancia_KM) ||
                    CambiaTarifario(TarifaGuardada(db, id), viajeDto)))
                    return Content(HttpStatusCode.Conflict, new { error = "El viaje se generó desde un presupuesto aceptado: el cliente, el recorrido, los km y la tarifa son los del presupuesto y no se pueden cambiar. Si cambia el recorrido, hace falta un presupuesto nuevo." });

                // Importe: la base se recalcula solo si cambia lo que la define (y se puede cambiar en este estado).
                var tarifaGuardada = TarifaGuardada(db, id);
                bool cambiaTarifa = false, tarifaEditable = false;

                bool cambioHojaDeRuta = false, cambioKm = false;
                OrdenDelDia.Plan plan = null;
                // Camión o chofer nuevos con el viaje en curso: se aplican después de calcular el importe (el precio no cambia).
                int? camionNuevo = null, choferNuevo = null;
                string cambioAsignacion = null;
                // Si cambia el chofer (Registrado o en curso), al que lo tenía se le avisa que ya no tiene el viaje (Fede).
                int choferAnteriorId = viaje.ChoferID;
                if (EsRegistrado(estado))
                {
                    var erroresChofer = ValidarChofer(db, viajeDto);
                    if (erroresChofer.Any())
                    {
                        return Content(HttpStatusCode.BadRequest, erroresChofer);
                    }

                    var ocupado = Ocupacion.Errores(db, viajeDto.CamionID, viajeDto.ChoferID, viajeDto.Fecha_Inicio, viajeDto.Fecha_Fin, id, 0);
                    if (ocupado.Any())
                    {
                        return Content(HttpStatusCode.BadRequest, ocupado);
                    }

                    // El orden del día con los datos nuevos: la vuelta de este viaje y lo que pasa con los otros del grupo (el de
                    // antes y el nuevo). El de un presupuesto conserva su vuelta.
                    var antesOrden = OrdenDelDia.SujetoDeViaje(db, id);
                    if (desdePresupuesto)
                        plan = PlanDelViaje(db, id, viajeDto, tarifaGuardada.Vuelta.HasValue, tarifaGuardada.Importe_Base, antesOrden, "se modificó el viaje #" + id);
                    else
                    {
                        viajeDto.Vuelta = null;
                        var previo = CalcularImporte(db, id, viajeDto, tarifaGuardada, true);
                        plan = PlanDelViaje(db, id, viajeDto, previo.Ok && previo.AplicaVuelta, previo.Ok ? previo.Importe : (decimal?)null,
                            antesOrden, "se modificó el viaje #" + id);
                        viajeDto.Vuelta = plan != null && plan.Aplica ? plan.Vuelta : null;
                    }

                    tarifaEditable = true;
                    cambiaTarifa = CambiaLaTarifa(viaje, tarifaGuardada, viajeDto);

                    // Es lo que el chofer recibe por WhatsApp: si cambia, se le reenvia la hoja de ruta.
                    cambioHojaDeRuta = viaje.ChoferID != viajeDto.ChoferID
                        || viaje.OrigenID != viajeDto.OrigenID
                        || viaje.DestinoID != viajeDto.DestinoID
                        || viaje.Fecha_Inicio != viajeDto.Fecha_Inicio;
                    cambioKm = (viaje.Distancia_KM ?? "").Trim() != (viajeDto.Distancia_KM ?? "").Trim();

                    viaje.OrigenID = viajeDto.OrigenID;
                    viaje.DestinoID = viajeDto.DestinoID;
                    viaje.Distancia_KM = viajeDto.Distancia_KM;
                    viaje.Fecha_Inicio = viajeDto.Fecha_Inicio;
                    viaje.Fecha_Fin = viajeDto.Fecha_Fin;
                    viaje.ChoferID = viajeDto.ChoferID;
                    viaje.CamionID = viajeDto.CamionID;
                    viaje.ClienteID = viajeDto.ClienteID;
                    // Las tarifas de antes de la tabla de tarifas ya no se usan (database/tarifas/04_*.sql).
                    viaje.TarifaFijaID = null;
                    viaje.TarifaKmID = null;
                }
                else
                {
                    // Una vez que el viaje salio, lo que define el cobro y el recorrido queda fijo:
                    // un cambio pedido por el cliente es otro viaje. Fechas y km se conservan tal cual.
                    // Cliente con plataforma en Listo para facturar, fuera de una proforma generada o aceptada:
                    // se pueden corregir tarifa y km para que coincidan con la plataforma (diseño 19/10).
                    bool corrigeTarifa = estado == "Listo_para_facturar"
                        && EsConPlataforma(TipoCliente(db, viaje.ClienteID));
                    // En viaje se pueden cambiar el camión y el chofer (se rompió el camión o cambia el chofer; caso F de
                    // docs/diseno/viajes-diseno.md, Rocío 27/10): con motivo, libres en el horario del viaje y sin cambiar el
                    // precio (el cliente contrató el viaje con el primero). Al chofer nuevo le llega la hoja de ruta.
                    bool enViaje = estado == EstadoEnViaje;
                    var erroresBloqueados = ValidarCamposBloqueados(viaje, tarifaGuardada, viajeDto, estado, corrigeTarifa, enViaje);
                    if (erroresBloqueados.Any())
                    {
                        return Content(HttpStatusCode.BadRequest, erroresBloqueados);
                    }
                    if (enViaje && (viaje.CamionID != viajeDto.CamionID || viaje.ChoferID != viajeDto.ChoferID))
                    {
                        var motivo = Recortar(viajeDto.Cambio_Motivo, 200);
                        if (motivo.Length == 0)
                            return Content(HttpStatusCode.BadRequest, new List<object> { new { PropertyName = "Cambio_Motivo", ErrorMessage = "Completá el motivo." } });
                        var erroresChofer = ValidarChofer(db, viajeDto);
                        if (erroresChofer.Any()) return Content(HttpStatusCode.BadRequest, erroresChofer);
                        var ocupado = Ocupacion.Errores(db, viaje.CamionID != viajeDto.CamionID ? viajeDto.CamionID : 0,
                            viaje.ChoferID != viajeDto.ChoferID ? viajeDto.ChoferID : 0, viaje.Fecha_Inicio, viaje.Fecha_Fin, id, 0);
                        if (ocupado.Any()) return Content(HttpStatusCode.BadRequest, ocupado);
                        var partes = new List<string>();
                        if (viaje.CamionID != viajeDto.CamionID) partes.Add("CamionID " + viaje.CamionID + " -> " + viajeDto.CamionID);
                        if (viaje.ChoferID != viajeDto.ChoferID) partes.Add("ChoferID " + viaje.ChoferID + " -> " + viajeDto.ChoferID);
                        cambioAsignacion = "Cambio con el viaje en curso: " + string.Join("; ", partes) + ". Motivo: " + motivo;
                        cambioHojaDeRuta = viaje.ChoferID != viajeDto.ChoferID;
                        camionNuevo = viajeDto.CamionID;
                        choferNuevo = viajeDto.ChoferID;
                    }
                    if (corrigeTarifa)
                    {
                        tarifaEditable = true;
                        cambiaTarifa = CambiaLaTarifa(viaje, tarifaGuardada, viajeDto);
                        cambioKm = (viaje.Distancia_KM ?? "").Trim() != (viajeDto.Distancia_KM ?? "").Trim();
                        viaje.Distancia_KM = viajeDto.Distancia_KM;
                        viaje.TarifaFijaID = null;
                        viaje.TarifaKmID = null;
                    }
                }

                // La estadía se puede cargar en cualquier estado (se conoce después del viaje; sin carga lo pone el estado). Si no cambió
                // nada de la tarifa y no se puede calcular (un viaje viejo sin tarifa vigente), se guarda igual sin importe.
                var calculo = CalcularImporte(db, id, DatosParaImporte(viaje, viajeDto, tarifaGuardada, tarifaEditable), tarifaGuardada, cambiaTarifa);
                if (!calculo.Ok && (cambiaTarifa || CambianAdicionales(tarifaGuardada, viajeDto)))
                {
                    return Content(HttpStatusCode.BadRequest, ErrorTarifa(calculo));
                }

                if (camionNuevo.HasValue) viaje.CamionID = camionNuevo.Value;
                if (choferNuevo.HasValue) viaje.ChoferID = choferNuevo.Value;
                viaje.Num_Remito = viajeDto.Num_Remito;
                viaje.Num_de_Carga = viajeDto.Num_de_Carga;
                viaje.Fecha_Modi = DateTime.Now;
                viaje.Usu_Modi = viajeDto.Usu_Modi;

                db.Entry(viaje).State = System.Data.Entity.EntityState.Modified;

                try
                {
                    db.SaveChanges();
                    GuardarNumTransporte(db, id, viajeDto.Num_Transporte);
                    if (calculo.Ok) GuardarImporte(db, id, DatosParaImporte(viaje, viajeDto, tarifaGuardada, tarifaEditable), calculo);
                    if (cambioKm) AuditarKmManual(id, viajeDto, viajeDto.Usu_Modi);
                    if (cambioAsignacion != null)
                        SGTLAuditContext.RegistrarEvento(Cn(), UsuarioCorto(viajeDto.Usu_Modi), "UPDATE", "VIAJES", "Viaje_ID=" + id, cambioAsignacion);
                    var orden = AplicarOrden(db, plan, "se modificó el viaje #" + id, viajeDto.Usu_Modi);
                    object whatsApp = null, whatsAppDesasignado = null;
                    if (cambioHojaDeRuta)
                    {
                        if (choferAnteriorId > 0 && choferAnteriorId != viaje.ChoferID)
                            whatsAppDesasignado = NotificarDesasignacion(db, viaje, choferAnteriorId);
                        whatsApp = NotificarChofer(db, viaje);
                    }
                    return Ok(new { Message = "Viaje actualizado correctamente.", WhatsApp = whatsApp, WhatsAppDesasignado = whatsAppDesasignado, Orden = orden });
                }
                catch (DbEntityValidationException ex)
                {
                    var validationErrors = new List<object>();
                    foreach (var validationResult in ex.EntityValidationErrors)
                    {
                        foreach (var error in validationResult.ValidationErrors)
                        {
                            validationErrors.Add(new { error.PropertyName, error.ErrorMessage });
                        }
                    }
                    return Content(HttpStatusCode.BadRequest, validationErrors);
                }
                catch (DbUpdateConcurrencyException)
                {
                    return Conflict();
                }
                catch (DbUpdateException ex)
                {
                    var errorMessage = ex.InnerException?.InnerException?.Message ?? ex.InnerException?.Message ?? ex.Message;
                    return InternalServerError(new Exception("Error al actualizar el viaje.", new Exception(errorMessage)));
                }
            }
        }

        // DELETE: api/Viajes/{id}
        // Eliminacion fisica. Solo mientras el viaje sigue Registrado (antes de En viaje).
        // Si tiene chofer, después de borrarlo se le avisa con la plantilla de viaje cancelado (el viaje ya no se hace).
        public IHttpActionResult Delete(int id)
        {
            string connectionString = ConnectionStringHelper.GetConnectionString("SGTLEntities");

            try
            {
                using (var db = new SGTLAuditContext(connectionString))
                {
                    var viaje = db.Set<VIAJES>().Find(id);

                    if (viaje == null)
                    {
                        return NotFound();
                    }

                    if (EstaVinculadoAProformaFacturada(db, id))
                    {
                        return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar el viaje porque pertenece a una proforma Facturada." });
                    }

                    var proformaDelViaje = ProformaQueIncluye(db, id);
                    if (proformaDelViaje != null)
                    {
                        return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar el viaje porque está en la proforma " + TextoProforma(proformaDelViaje) + ". Quitalo de la proforma o anulala primero." });
                    }

                    var estado = EstadoActual(db, id);
                    if (estado == EstadoCancelado)
                        return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar el viaje: está cancelado." });
                    if (!EsRegistrado(estado))
                    {
                        // Los motivos son los mismos que dice el botón deshabilitado (§1.4 del design system).
                        return Content(HttpStatusCode.BadRequest, new List<object>
                        {
                            new { PropertyName = "Estado", ErrorMessage = "No se puede eliminar el viaje: está " + estado.Replace('_', ' ').ToLowerInvariant() + "." }
                        });
                    }

                    var presupuestoId = db.Database.SqlQuery<int>("SELECT TOP (1) Presupuesto_ID FROM dbo.PRESUPUESTOS WHERE ViajeID=@id", new SqlParameter("@id", id)).FirstOrDefault();
                    if (presupuestoId > 0)
                        return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar el viaje: viene del presupuesto #" + presupuestoId + "." });

                    // Con gastos del chofer (los cargó en viaje y después se volvió atrás) no se elimina: son de la rendición.
                    bool hayGastos = db.Database.SqlQuery<int?>("SELECT OBJECT_ID(N'dbo.VIAJE_GASTOS', N'U')").First().HasValue;
                    if (hayGastos && db.Database.SqlQuery<int>("SELECT COUNT(*) FROM dbo.VIAJE_GASTOS WHERE Viaje_ID=@id", P("@id", id)).First() > 0)
                        return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar el viaje: tiene gastos cargados." });
                    // Una evidencia de antes (hoy ya no se adjunta sin salir) se borra con el viaje.
                    db.Database.ExecuteSqlCommand("DELETE FROM VIAJE_EVIDENCIA WHERE Viaje_ID=@id", P("@id", id));

                    // Los otros viajes de su grupo se acomodan o quedan para revisar (§43).
                    var antesOrden = OrdenDelDia.SujetoDeViaje(db, id);
                    var plan = antesOrden != null && antesOrden.Aplica ? OrdenDelDia.Planificar(db, null, antesOrden, "se eliminó el viaje #" + id) : null;

                    db.Set<VIAJES>().Remove(viaje);

                    try
                    {
                        db.Configuration.ValidateOnSaveEnabled = false;
                        db.SaveChanges();
                        var orden = AplicarOrden(db, plan, "se eliminó el viaje #" + id, null);
                        // Recién con el viaje borrado se le avisa al chofer que no se hace (Fede): si los controles de arriba
                        // lo rechazan o falla el borrado, no le llega un aviso falso. El mensaje se arma con los datos que
                        // quedan en memoria y con el chofer y los lugares, que no se borran.
                        var whatsApp = NotificarCancelacion(db, viaje);
                        return Ok(new { Message = "Viaje eliminado correctamente.", Orden = orden, WhatsApp = whatsApp });
                    }
                    catch (DbUpdateConcurrencyException)
                    {
                        return Conflict();
                    }
                    catch (DbUpdateException ex)
                    {
                        var errorMessage = ex.InnerException?.InnerException?.Message ?? ex.InnerException?.Message ?? ex.Message;
                        return InternalServerError(new Exception("Error al eliminar el viaje.", new Exception(errorMessage)));
                    }
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // Num_Remito y Num_de_Carga son nchar(20); Num_Transporte nvarchar(20).
        private const int LargoReferencia = 20;

        private static bool MismaDistancia(string a, string b)
        {
            decimal x, y;
            return decimal.TryParse((a ?? "").Trim().Replace(',', '.'), System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out x)
                && decimal.TryParse((b ?? "").Trim().Replace(',', '.'), System.Globalization.NumberStyles.Number, System.Globalization.CultureInfo.InvariantCulture, out y) && x == y;
        }

        // Validaciones de negocio compartidas entre alta y edicion.
        private List<object> ValidarViaje(ViajeDto v)
        {
            var errores = new List<object>();

            if (v.ClienteID <= 0)
                errores.Add(new { PropertyName = "ClienteID", ErrorMessage = "Debe seleccionar un cliente." });

            if (v.OrigenID <= 0)
                errores.Add(new { PropertyName = "OrigenID", ErrorMessage = "Debe seleccionar un origen." });

            if (v.DestinoID <= 0)
                errores.Add(new { PropertyName = "DestinoID", ErrorMessage = "Debe seleccionar un destino." });

            if (v.Fecha_Fin < v.Fecha_Inicio)
                errores.Add(new { PropertyName = "Fecha_Fin", ErrorMessage = "La fecha de fin no puede ser anterior a la fecha de inicio." });

            v.Num_Remito = (v.Num_Remito ?? "").Trim();
            v.Num_de_Carga = (v.Num_de_Carga ?? "").Trim();
            v.Num_Transporte = (v.Num_Transporte ?? "").Trim();

            if (v.Num_Remito.Length > LargoReferencia)
                errores.Add(new { PropertyName = "Num_Remito", ErrorMessage = "El número de remito no puede superar " + LargoReferencia + " caracteres." });

            if (v.Num_Transporte.Length > LargoReferencia)
                errores.Add(new { PropertyName = "Num_Transporte", ErrorMessage = "El N° de transporte SAP no puede superar " + LargoReferencia + " caracteres." });

            if (v.Num_de_Carga.Length > LargoReferencia)
                errores.Add(new { PropertyName = "Num_de_Carga", ErrorMessage = "El N° entrega Rukas no puede superar " + LargoReferencia + " caracteres." });

            // La tarifa sale de la tabla de tarifas: fija o por km.
            bool tieneTarifario = UsaTarifario(v.TarifarioID);
            if (!tieneTarifario)
                errores.Add(new { PropertyName = "Tarifa", ErrorMessage = "Asigná una tarifa al viaje." });

            if (tieneTarifario && !string.IsNullOrEmpty(v.Tarifa_Modo) && v.Tarifa_Modo != "Fija" && v.Tarifa_Modo != "Km")
                errores.Add(new { PropertyName = "Tarifa", ErrorMessage = "Elegí la tarifa: fija o por km." });
            if (v.Vuelta.HasValue && v.Vuelta.Value != 1 && v.Vuelta.Value != 2)
                errores.Add(new { PropertyName = "Vuelta", ErrorMessage = "La vuelta tiene que ser la 1ª o la 2ª." });
            if (v.Estadia_Modulos < 0 || v.Estadia_Modulos > TarifarioCalculo.MaxEstadiaModulos)
                errores.Add(new { PropertyName = "Estadia_Modulos", ErrorMessage = "Los módulos de estadía tienen que ser entre 0 y " + TarifarioCalculo.MaxEstadiaModulos + "." });

            return errores;
        }
    }
}
