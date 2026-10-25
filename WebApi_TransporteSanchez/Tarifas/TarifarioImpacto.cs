using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace WebApi_TransporteSanchez.Tarifas
{
    // Qué pasa con los viajes y los presupuestos al guardar una tabla de tarifas (§33 de PENDIENTES, decisión de Rocío del
    // 25/10). Se recalcula solo lo que el cliente todavía no vio; lo que ya vio queda para revisar:
    //   - viaje sin proforma o en un borrador: se recalcula (y su línea del borrador propio, si tiene el precio del viaje);
    //   - viaje en una proforma generada o aceptada: no cambia; queda para revisar (anularla y generarla de nuevo);
    //   - viaje en un comprobante: no cambia; queda para revisar (nota de crédito o de débito);
    //   - viaje de un presupuesto aceptado: no cambia (el precio lo aceptó el cliente);
    //   - presupuesto pendiente: se recalcula y queda para reenviar.
    // Calcular no escribe nada: lo usan la confirmación (api/Tarifario/Impacto) y el guardado, que después llama a Aplicar
    // dentro de su transacción. La cuenta es la de TarifarioCalculo (BaseConTabla y SumarAdicionales), con las tablas como
    // quedan al guardar.
    public static class TarifarioImpacto
    {
        public const string Recalcula = "recalcula";
        public const string Revisar = "revisar";
        public const string Conserva = "conserva";
        public const string NoSePuede = "error";

        // Id de una tabla nueva mientras no se guarda.
        public const int TablaNueva = -1;

        private static readonly CultureInfo EsAr = new CultureInfo("es-AR");

        // La tabla como queda al guardar.
        public class TablaEditada
        {
            public TarifarioCalculo.Tarifario Datos { get; set; }      // Tarifario_ID: 0 si es nueva
            public List<TarifarioCalculo.Valores> Valores { get; set; }
            public List<int> Clientes { get; set; }                    // vacía si es para todos
        }

        // Una fila de la confirmación. Los campos internal no se mandan a la pantalla.
        public class Item
        {
            public string Clase { get; set; }               // "Viaje" o "Presupuesto"
            public int Id { get; set; }
            public string Cliente { get; set; }
            public string Estado { get; set; }
            public string Documento { get; set; }           // "PF-00000006", "Borrador #52", "FAC-00000006"
            public decimal? Importe_Anterior { get; set; }
            public decimal? Importe_Nuevo { get; set; }
            public string Grupo { get; set; }               // Recalcula, Revisar, Conserva o NoSePuede
            public string Que_Pasa { get; set; }

            internal int? ClienteID;
            internal TarifarioCalculo.Resultado Calculo;
            internal string TipoRevisar;                    // Presupuesto, Proforma o Comprobante
            internal int? Proforma_ID;
            internal int? Comprobante_ID;
            internal bool ActualizaLinea;                   // la línea del borrador propio tiene el precio del viaje
            internal string Datos;                          // JSON del presupuesto
            internal DateTime? SinTablaEl;                  // con el cambio, ese día no le queda ninguna tabla
        }

        public class Resultado
        {
            public List<Item> Items { get; set; }
            public int Recalculan { get { return Items.Count(i => i.Grupo == Recalcula); } }
            public int ParaRevisar { get { return Items.Count(i => i.Grupo == Revisar || (i.Grupo == Recalcula && i.TipoRevisar != null)); } }
            // Hay algo que pide confirmación y motivo: importes que cambian.
            public bool HayCambios { get { return Items.Any(i => i.Grupo == Recalcula || i.Grupo == Revisar); } }

            // Pasan a otra tabla o cambia el texto del detalle, sin cambiar el importe: se actualizan sin preguntar.
            internal List<Item> SoloDetalle = new List<Item>();

            // Viajes en una proforma enviada o en un comprobante que tenían algo para revisar y con este cambio la tarifa
            // vuelve al importe del documento: lo pendiente se resuelve solo.
            internal List<int> VuelvenAlDocumento = new List<int>();

            // Viajes y presupuestos que con el cambio se quedan sin tabla (la tabla pasa a solo algunos clientes o empieza
            // más tarde): no se puede guardar así.
            internal List<Item> SinTabla { get { return Items.Where(i => i.SinTablaEl.HasValue).OrderBy(i => i.SinTablaEl).ToList(); } }
        }

        public class Aplicado
        {
            public int CambioID { get; set; }
            public int ViajesRecalculados { get; set; }
            public int PresupuestosRecalculados { get; set; }
            public int ParaRevisar { get; set; }
            public List<Item> Recalculados { get; set; }
        }

        // ------------------------------------------------------------ Lectura

        internal class Tabla
        {
            internal TarifarioCalculo.Tarifario Datos;
            internal List<TarifarioCalculo.Valores> Valores;
            internal HashSet<int> Clientes;
        }

        internal class Camion
        {
            internal string Dominio;
            internal string Tipo;
            internal int Anio;
        }

        internal class Viaje
        {
            internal int Viaje_ID;
            internal int ClienteID;
            internal string Cliente;
            internal int CamionID;
            internal DateTime Fecha_Inicio;
            internal string Distancia_KM;
            internal int TarifarioID;
            internal string Tarifa_Modo;
            internal int? Vuelta;
            internal bool Falso_Flete;
            internal int Estadia_Modulos;
            internal decimal? Importe;
            internal string Tarifa_Detalle;
            internal string Importe_Detalle;
            internal string Estado;
            internal int? Presupuesto_ID;
            internal int? Proforma_ID;
            internal string Proforma_Numero;
            internal string Proforma_Estado;
            internal string Tipo_Proforma;
            internal decimal? Precio_Linea;
            internal int? Comprobante_ID;
            internal string Comprobante_Numero;
        }

        internal class Salida
        {
            internal int Viaje_ID;
            internal int CamionID;
            internal DateTime Fecha_Inicio;
        }

        private const string SQL_VIAJES = @"
SELECT v.Viaje_ID, v.ClienteID, ISNULL(cl.Razon_Social, '') AS Cliente, ISNULL(v.CamionID, 0) AS CamionID, v.Fecha_Inicio,
       RTRIM(ISNULL(v.Distancia_KM, '')) AS Distancia_KM, v.TarifarioID, ISNULL(v.Tarifa_Modo, 'Fija') AS Tarifa_Modo, v.Vuelta,
       v.Falso_Flete, v.Estadia_Modulos, v.Importe, v.Tarifa_Detalle, v.Importe_Detalle, ISNULL(v.Estado, '') AS Estado,
       pr.Presupuesto_ID, doc.Proforma_ID, doc.Numero AS Proforma_Numero, doc.Estado AS Proforma_Estado, doc.Tipo_Proforma, doc.Precio_Linea,
       fac.Comprobante_ID, fac.Numero AS Comprobante_Numero
FROM dbo.VIAJES v
LEFT JOIN dbo.CLIENTES cl ON cl.Cliente_ID = v.ClienteID
OUTER APPLY (SELECT TOP (1) ps.Presupuesto_ID FROM dbo.PRESUPUESTOS ps
             WHERE ps.ViajeID = v.Viaje_ID AND ps.Estado = 'Aceptado' ORDER BY ps.Presupuesto_ID DESC) pr
OUTER APPLY (SELECT TOP (1) p.Proforma_ID, ISNULL(p.Numero, '') AS Numero, p.Estado, ISNULL(p.Tipo_Proforma, 'Propia') AS Tipo_Proforma,
                    (SELECT TOP (1) d.PrecioUnitario FROM dbo.PROFORMA_DETALLE d WHERE d.Proforma_ID = p.Proforma_ID
                     AND UPPER(LTRIM(RTRIM(ISNULL(d.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID)) AS Precio_Linea
             FROM dbo.PROFORMAS p
             WHERE p.Estado <> 'Anulada' AND (
                   EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = p.Proforma_ID AND pv.ViajeID = v.Viaje_ID)
                OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE d WHERE d.Proforma_ID = p.Proforma_ID
                           AND UPPER(LTRIM(RTRIM(ISNULL(d.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID)))
             ORDER BY CASE p.Estado WHEN 'Facturada' THEN 0 WHEN 'Aceptada' THEN 1 WHEN 'Generada' THEN 2 ELSE 3 END) doc
OUTER APPLY (SELECT TOP (1) c.Comprobante_ID, c.Tipo + '-' + RIGHT('00000000' + CONVERT(varchar(11), c.NumeroCorrelativo), 8) AS Numero
             FROM dbo.COMPROBANTES c
             WHERE c.Tipo = 'FAC' AND (
                   EXISTS (SELECT 1 FROM dbo.COMPROBANTES_PROFORMAS cp WHERE cp.ComprobanteID = c.Comprobante_ID
                           AND cp.ProformaID = doc.Proforma_ID AND cp.Vigente = 1)
                OR EXISTS (SELECT 1 FROM dbo.COMPROBANTES_DETALLE cd WHERE cd.ComprobanteID = c.Comprobante_ID
                           AND UPPER(LTRIM(RTRIM(ISNULL(cd.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID)))
             ORDER BY c.Comprobante_ID DESC) fac
WHERE v.TarifarioID IS NOT NULL";

        private static List<T> Leer<T>(SqlConnection cn, SqlTransaction tx, string sql, Func<SqlDataReader, T> fila, params SqlParameter[] ps)
        {
            var lista = new List<T>();
            using (var cmd = new SqlCommand(sql, cn, tx))
            {
                cmd.Parameters.AddRange(ps);
                using (var r = cmd.ExecuteReader())
                    while (r.Read()) lista.Add(fila(r));
            }
            return lista;
        }

        private static int Int(SqlDataReader r, string c) { return Convert.ToInt32(r[c]); }
        private static int? IntN(SqlDataReader r, string c) { return r[c] == DBNull.Value ? (int?)null : Convert.ToInt32(r[c]); }
        private static decimal? DecN(SqlDataReader r, string c) { return r[c] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(r[c]); }
        private static string Str(SqlDataReader r, string c) { return r[c] == DBNull.Value ? null : Convert.ToString(r[c]); }
        private static bool Bool(SqlDataReader r, string c) { return r[c] != DBNull.Value && Convert.ToBoolean(r[c]); }

        private static List<Tabla> LeerTablas(SqlConnection cn, SqlTransaction tx)
        {
            var tablas = Leer(cn, tx,
                "SELECT Tarifario_ID, Nombre, Vigente_Desde, Para_Todos, Anio_Corte, Km_Banda1, Km_Banda2, Km_Banda3, Estadia_Modulo, " +
                "Estadia_Horas_Modulo, Estadia_Desde_Horas, Estadia_Desde_Horas_Larga, Falso_Flete_Porcentaje FROM dbo.TARIFARIOS",
                r => new TarifarioCalculo.Tarifario
                {
                    Tarifario_ID = Int(r, "Tarifario_ID"),
                    Nombre = Str(r, "Nombre"),
                    Vigente_Desde = Convert.ToDateTime(r["Vigente_Desde"]),
                    Para_Todos = Bool(r, "Para_Todos"),
                    Anio_Corte = Int(r, "Anio_Corte"),
                    Km_Banda1 = Int(r, "Km_Banda1"),
                    Km_Banda2 = Int(r, "Km_Banda2"),
                    Km_Banda3 = Int(r, "Km_Banda3"),
                    Estadia_Modulo = Convert.ToDecimal(r["Estadia_Modulo"]),
                    Estadia_Horas_Modulo = Int(r, "Estadia_Horas_Modulo"),
                    Estadia_Desde_Horas = Int(r, "Estadia_Desde_Horas"),
                    Estadia_Desde_Horas_Larga = Int(r, "Estadia_Desde_Horas_Larga"),
                    Falso_Flete_Porcentaje = Convert.ToDecimal(r["Falso_Flete_Porcentaje"])
                });
            var valores = Leer(cn, tx,
                "SELECT Tarifario_ID, Modelo_Nuevo, Tipo_Vehiculo, Valor_Banda1_Vuelta1, Valor_Banda1_Vuelta2, Valor_Banda2, Valor_Banda3, Valor_Km " +
                "FROM dbo.TARIFARIO_VALORES",
                r => new TarifarioCalculo.Valores
                {
                    Tarifario_ID = Int(r, "Tarifario_ID"),
                    Modelo_Nuevo = Bool(r, "Modelo_Nuevo"),
                    Tipo_Vehiculo = (Str(r, "Tipo_Vehiculo") ?? "").Trim(),
                    Valor_Banda1_Vuelta1 = Convert.ToDecimal(r["Valor_Banda1_Vuelta1"]),
                    Valor_Banda1_Vuelta2 = Convert.ToDecimal(r["Valor_Banda1_Vuelta2"]),
                    Valor_Banda2 = Convert.ToDecimal(r["Valor_Banda2"]),
                    Valor_Banda3 = Convert.ToDecimal(r["Valor_Banda3"]),
                    Valor_Km = Convert.ToDecimal(r["Valor_Km"])
                });
            var clientes = Leer(cn, tx, "SELECT Tarifario_ID, ClienteID FROM dbo.TARIFARIO_CLIENTES",
                r => new KeyValuePair<int, int>(Int(r, "Tarifario_ID"), Int(r, "ClienteID")));
            return tablas.Select(t => new Tabla
            {
                Datos = t,
                Valores = valores.Where(v => v.Tarifario_ID == t.Tarifario_ID).ToList(),
                Clientes = new HashSet<int>(clientes.Where(c => c.Key == t.Tarifario_ID).Select(c => c.Value))
            }).ToList();
        }

        // La tabla que vale ese día para ese cliente: la propia más reciente y, si no tiene, la general (como
        // TarifarioCalculo.Vigente, pero con las tablas como quedan al guardar).
        private static Tabla Vigente(List<Tabla> tablas, DateTime fecha, int clienteId)
        {
            return tablas
                .Where(t => t.Datos.Vigente_Desde.Date <= fecha.Date && (t.Datos.Para_Todos || t.Clientes.Contains(clienteId)))
                .OrderBy(t => t.Datos.Para_Todos ? 1 : 0).ThenByDescending(t => t.Datos.Vigente_Desde)
                .FirstOrDefault();
        }

        // ------------------------------------------------------------ Cálculo

        // Lo que hace falta leer de la base para calcular el impacto.
        internal class Datos
        {
            internal List<Tabla> Tablas = new List<Tabla>();
            internal Dictionary<int, Camion> Camiones = new Dictionary<int, Camion>();
            internal List<Salida> Salidas = new List<Salida>();
            internal List<Viaje> Viajes = new List<Viaje>();
            internal List<KeyValuePair<int, string>> Presupuestos = new List<KeyValuePair<int, string>>();   // pendientes: id y Datos
            internal Dictionary<int, string> Clientes = new Dictionary<int, string>();
            // Viajes que ya quedaron para revisar por un cambio anterior, con el importe corregido de entonces.
            internal Dictionary<int, decimal?> Pendientes = new Dictionary<int, decimal?>();
        }

        // Qué pasaría al guardar la tabla (id = 0 si es nueva). No escribe nada.
        public static Resultado Calcular(SqlConnection cn, SqlTransaction tx, int id, TablaEditada editada)
        {
            var d = new Datos
            {
                Tablas = LeerTablas(cn, tx),
                Camiones = Leer(cn, tx,
                    "SELECT Camion_ID, RTRIM(ISNULL(Dominio, '')) AS Dominio, ISNULL(Tipo, '') AS Tipo, ISNULL(TRY_CAST(AñoModelo AS int), 0) AS Anio FROM dbo.CAMIONES",
                    r => new KeyValuePair<int, Camion>(Int(r, "Camion_ID"), new Camion { Dominio = Str(r, "Dominio"), Tipo = (Str(r, "Tipo") ?? "").Trim(), Anio = Int(r, "Anio") }))
                    .ToDictionary(x => x.Key, x => x.Value),
                Salidas = Leer(cn, tx, "SELECT Viaje_ID, ISNULL(CamionID, 0) AS CamionID, Fecha_Inicio FROM dbo.VIAJES",
                    r => new Salida { Viaje_ID = Int(r, "Viaje_ID"), CamionID = Int(r, "CamionID"), Fecha_Inicio = Convert.ToDateTime(r["Fecha_Inicio"]) }),
                Viajes = Leer(cn, tx, SQL_VIAJES, LeerViaje),
                Presupuestos = Leer(cn, tx, "SELECT Presupuesto_ID, Datos FROM dbo.PRESUPUESTOS WHERE Estado = 'Pendiente' AND ViajeID IS NULL",
                    r => new KeyValuePair<int, string>(Int(r, "Presupuesto_ID"), Str(r, "Datos"))),
                Clientes = Leer(cn, tx, "SELECT Cliente_ID, ISNULL(Razon_Social, '') AS Razon_Social FROM dbo.CLIENTES",
                    r => new KeyValuePair<int, string>(Int(r, "Cliente_ID"), Str(r, "Razon_Social"))).ToDictionary(x => x.Key, x => x.Value),
                Pendientes = Leer(cn, tx,
                    "SELECT Viaje_ID, Importe_Nuevo FROM dbo.TARIFARIO_REVISAR WHERE Resuelto_Fecha IS NULL AND Viaje_ID IS NOT NULL " +
                    "AND Tipo IN (N'Proforma', N'Comprobante') ORDER BY Revisar_ID",
                    r => new KeyValuePair<int, decimal?>(Int(r, "Viaje_ID"), DecN(r, "Importe_Nuevo")))
                    .GroupBy(x => x.Key).ToDictionary(g => g.Key, g => g.Last().Value)
            };
            return Calcular(d, id, editada);
        }

        // El cálculo, sin base de datos (así se puede probar con datos armados).
        internal static Resultado Calcular(Datos d, int id, TablaEditada editada)
        {
            int editadaId = id > 0 ? id : TablaNueva;
            var tablas = d.Tablas.Where(t => t.Datos.Tarifario_ID != editadaId).ToList();
            editada.Datos.Tarifario_ID = editadaId;
            foreach (var v in editada.Valores) { v.Tarifario_ID = editadaId; v.Tipo_Vehiculo = (v.Tipo_Vehiculo ?? "").Trim(); }
            tablas.Add(new Tabla
            {
                Datos = editada.Datos,
                Valores = editada.Valores,
                Clientes = new HashSet<int>(editada.Datos.Para_Todos ? new List<int>() : editada.Clientes)
            });

            var resultado = new Resultado { Items = new List<Item>() };
            foreach (var v in d.Viajes)
                AgregarViaje(resultado, v, tablas, editadaId, d.Camiones, d.Salidas, d.Pendientes);
            foreach (var p in d.Presupuestos)
                AgregarPresupuesto(resultado, p.Key, p.Value, tablas, editadaId, d.Camiones, d.Salidas, d.Clientes);

            resultado.Items = resultado.Items
                .OrderBy(i => OrdenGrupo(i.Grupo)).ThenBy(i => i.Clase == "Viaje" ? 0 : 1).ThenBy(i => i.Id).ToList();
            return resultado;
        }

        private static Viaje LeerViaje(SqlDataReader r)
        {
            return new Viaje
            {
                Viaje_ID = Int(r, "Viaje_ID"),
                ClienteID = Int(r, "ClienteID"),
                Cliente = Str(r, "Cliente"),
                CamionID = Int(r, "CamionID"),
                Fecha_Inicio = Convert.ToDateTime(r["Fecha_Inicio"]),
                Distancia_KM = Str(r, "Distancia_KM"),
                TarifarioID = Int(r, "TarifarioID"),
                Tarifa_Modo = Str(r, "Tarifa_Modo"),
                Vuelta = IntN(r, "Vuelta"),
                Falso_Flete = Bool(r, "Falso_Flete"),
                Estadia_Modulos = Convert.ToInt32(r["Estadia_Modulos"]),
                Importe = DecN(r, "Importe"),
                Tarifa_Detalle = Str(r, "Tarifa_Detalle"),
                Importe_Detalle = Str(r, "Importe_Detalle"),
                Estado = Str(r, "Estado"),
                Presupuesto_ID = IntN(r, "Presupuesto_ID"),
                Proforma_ID = IntN(r, "Proforma_ID"),
                Proforma_Numero = Str(r, "Proforma_Numero"),
                Proforma_Estado = Str(r, "Proforma_Estado"),
                Tipo_Proforma = Str(r, "Tipo_Proforma"),
                Precio_Linea = DecN(r, "Precio_Linea"),
                Comprobante_ID = IntN(r, "Comprobante_ID"),
                Comprobante_Numero = Str(r, "Comprobante_Numero")
            };
        }

        private static int OrdenGrupo(string g)
        {
            return g == Recalcula ? 0 : g == Revisar ? 1 : g == NoSePuede ? 2 : 3;
        }

        private static decimal? Km(string km)
        {
            decimal x;
            return decimal.TryParse((km ?? "").Trim().Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out x) ? x : (decimal?)null;
        }

        // La base y los adicionales con la tabla t. Error: por qué no se puede calcular.
        private static TarifarioCalculo.Resultado CalcularCon(Tabla t, Camion camion, bool porKm, decimal? km, int? vueltaGuardada,
            int vueltaSugerida, bool falsoFlete, int estadia, out string error)
        {
            error = null;
            if (camion == null) { error = "no tiene camión"; return null; }
            if (!TarifarioCalculo.TipoValido(camion.Tipo)) { error = "el camión " + camion.Dominio + " no tiene un tipo de la tabla"; return null; }
            if (!km.HasValue || km.Value <= 0) { error = "no tiene km"; return null; }
            bool nuevo = camion.Anio >= t.Datos.Anio_Corte;
            var valores = t.Valores.FirstOrDefault(v => v.Modelo_Nuevo == nuevo && v.Tipo_Vehiculo == camion.Tipo);
            if (valores == null) { error = "la tabla no tiene valores para " + camion.Tipo; return null; }
            int? vuelta = null;
            if (!porKm && km.Value <= t.Datos.Km_Banda1)
                vuelta = vueltaGuardada == 1 || vueltaGuardada == 2 ? vueltaGuardada : vueltaSugerida;
            var r = TarifarioCalculo.BaseConTabla(t.Datos, valores, camion.Tipo, nuevo, porKm, km.Value, vuelta);
            return TarifarioCalculo.SumarAdicionales(r, falsoFlete || estadia > 0 ? t.Datos : null, falsoFlete, estadia);
        }

        // 2ª vuelta si el camión ya tiene otro viaje que empieza antes ese día (como TarifarioCalculo.ViajeAnteriorDelDia).
        private static int VueltaSugerida(List<Salida> salidas, int camionId, DateTime inicio, int viajeId)
        {
            return camionId > 0 && salidas.Any(s => s.CamionID == camionId && s.Viaje_ID != viajeId
                && s.Fecha_Inicio.Date == inicio.Date && s.Fecha_Inicio < inicio) ? 2 : 1;
        }

        private static void AgregarViaje(Resultado res, Viaje v, List<Tabla> tablas, int editadaId,
            Dictionary<int, Camion> camiones, List<Salida> salidas, Dictionary<int, decimal?> pendientes)
        {
            var despues = Vigente(tablas, v.Fecha_Inicio, v.ClienteID);
            int? idDespues = despues == null ? (int?)null : despues.Datos.Tarifario_ID;
            if (v.TarifarioID != editadaId && idDespues != editadaId) return;    // no la toca este cambio

            var item = new Item
            {
                Clase = "Viaje",
                Id = v.Viaje_ID,
                Cliente = v.Cliente,
                ClienteID = v.ClienteID,
                Estado = (v.Estado ?? "").Replace('_', ' '),
                Importe_Anterior = v.Importe
            };

            if (v.Presupuesto_ID.HasValue)
            {
                item.Grupo = Conserva;
                item.Que_Pasa = "Precio aceptado en el presupuesto #" + v.Presupuesto_ID + ".";
                item.Importe_Nuevo = v.Importe;
                res.Items.Add(item);
                return;
            }

            if (despues == null)
            {
                item.Grupo = NoSePuede;
                item.Que_Pasa = "No queda una tabla vigente el " + v.Fecha_Inicio.ToString("dd/MM/yyyy") + ".";
                item.SinTablaEl = v.Fecha_Inicio;
                res.Items.Add(item);
                return;
            }

            camiones.TryGetValue(v.CamionID, out Camion camion);
            string error;
            var calculo = CalcularCon(despues, camion, v.Tarifa_Modo == "Km", Km(v.Distancia_KM), v.Vuelta,
                VueltaSugerida(salidas, v.CamionID, v.Fecha_Inicio, v.Viaje_ID), v.Falso_Flete, v.Estadia_Modulos, out error);
            if (calculo == null)
            {
                item.Grupo = NoSePuede;
                item.Que_Pasa = char.ToUpper(error[0]) + error.Substring(1) + ".";
                res.Items.Add(item);
                return;
            }

            item.Calculo = calculo;
            item.Importe_Nuevo = calculo.Importe;
            if (v.Importe.HasValue && v.Importe.Value == calculo.Importe)
            {
                // El documento ya tiene el importe correcto: si quedaba algo para revisar, se resuelve.
                if (pendientes.ContainsKey(v.Viaje_ID)) res.VuelvenAlDocumento.Add(v.Viaje_ID);
                // Mismo importe: si cambió la tabla o el texto del detalle (otro nombre), se actualiza sin preguntar.
                if (v.TarifarioID != idDespues || v.Tarifa_Detalle != calculo.TarifaDetalle || v.Importe_Detalle != calculo.ImporteDetalle)
                    res.SoloDetalle.Add(item);
                return;
            }

            bool enComprobante = v.Comprobante_ID.HasValue || v.Proforma_Estado == "Facturada" || v.Estado == "Facturado";
            bool enProformaEnviada = v.Proforma_Estado == "Generada" || v.Proforma_Estado == "Aceptada";
            // Ya quedó para revisar con este mismo importe por un cambio anterior: no es algo nuevo de este cambio.
            decimal? pendiente;
            if ((enComprobante || enProformaEnviada) && pendientes.TryGetValue(v.Viaje_ID, out pendiente) && pendiente == calculo.Importe)
                return;
            if (enComprobante)
            {
                item.Grupo = Revisar;
                item.TipoRevisar = "Comprobante";
                item.Proforma_ID = v.Proforma_ID;
                item.Comprobante_ID = v.Comprobante_ID;
                item.Documento = v.Comprobante_Numero;
                item.Que_Pasa = "Nota de " + (calculo.Importe < v.Importe ? "crédito" : "débito")
                    + (v.Comprobante_Numero != null ? " sobre " + v.Comprobante_Numero : "") + ".";
            }
            else if (enProformaEnviada)
            {
                item.Grupo = Revisar;
                item.TipoRevisar = "Proforma";
                item.Proforma_ID = v.Proforma_ID;
                item.Documento = v.Proforma_Numero;
                item.Que_Pasa = "Anulá " + v.Proforma_Numero + " y generala de nuevo.";
            }
            else if (v.Proforma_Estado == "Borrador")
            {
                item.Grupo = Recalcula;
                item.Proforma_ID = v.Proforma_ID;
                item.Documento = "Borrador #" + v.Proforma_ID;
                if (v.Tipo_Proforma == "Plataforma")
                    item.Que_Pasa = "Borrador de Rukas #" + v.Proforma_ID + ": lo toma al volver a controlar.";
                else if (v.Precio_Linea.HasValue && v.Importe.HasValue && v.Precio_Linea.Value == Math.Round(v.Importe.Value, 2))
                {
                    item.ActualizaLinea = true;
                    item.Que_Pasa = "También en el borrador #" + v.Proforma_ID + ".";
                }
                else
                    item.Que_Pasa = "En el borrador #" + v.Proforma_ID + " tiene otro precio: revisalo.";
            }
            else
            {
                item.Grupo = Recalcula;
                item.Que_Pasa = "";
            }
            if (item.Grupo == Recalcula) item.Que_Pasa = PasaA(v.TarifarioID, despues, item.Que_Pasa);
            res.Items.Add(item);
        }

        // Si cambia de tabla (la tabla pasó a solo algunos clientes, se sacó o se agregó un cliente, o cambió la fecha), con
        // cuál queda. En una tabla nueva no hace falta: el mensaje de la confirmación ya lo dice.
        private static string PasaA(int? antes, Tabla despues, string queHacer)
        {
            if (antes == despues.Datos.Tarifario_ID || despues.Datos.Tarifario_ID == TablaNueva) return queHacer;
            return ("Pasa a \"" + despues.Datos.Nombre + "\". " + queHacer).Trim();
        }

        private static void AgregarPresupuesto(Resultado res, int presupuestoId, string datos, List<Tabla> tablas, int editadaId,
            Dictionary<int, Camion> camiones, List<Salida> salidas, Dictionary<int, string> clientes)
        {
            JObject json;
            try { json = Json(datos); }
            catch { return; }

            int tarifarioId, clienteId, camionId, vueltaGuardada;
            DateTime inicio;
            decimal importe;
            if (!int.TryParse((string)json["tarifarioId"], out tarifarioId) || tarifarioId <= 0) return;   // no se calculó con la tabla
            int.TryParse((string)json["clienteId"], out clienteId);
            int.TryParse((string)json["camionId"], out camionId);
            if (!DateTime.TryParse((string)json["fechaInicio"], CultureInfo.InvariantCulture, DateTimeStyles.None, out inicio)) return;
            bool tieneImporte = decimal.TryParse((string)json["importe"], NumberStyles.Number, CultureInfo.InvariantCulture, out importe);
            int? vuelta = int.TryParse((string)json["vuelta"], out vueltaGuardada) ? vueltaGuardada : (int?)null;

            var despues = Vigente(tablas, inicio, clienteId);
            int? idDespues = despues == null ? (int?)null : despues.Datos.Tarifario_ID;
            if (tarifarioId != editadaId && idDespues != editadaId) return;

            string cliente;
            clientes.TryGetValue(clienteId, out cliente);
            var item = new Item
            {
                Clase = "Presupuesto",
                Id = presupuestoId,
                Cliente = cliente ?? (string)json["cliente"] ?? "",
                ClienteID = clienteId > 0 ? clienteId : (int?)null,
                Estado = "Pendiente",
                Documento = "Presupuesto #" + presupuestoId,
                Importe_Anterior = tieneImporte ? importe : (decimal?)null,
                Datos = datos
            };

            if (despues == null)
            {
                item.Grupo = NoSePuede;
                item.Que_Pasa = "No queda una tabla vigente el " + inicio.ToString("dd/MM/yyyy") + ".";
                item.SinTablaEl = inicio;
                res.Items.Add(item);
                return;
            }

            camiones.TryGetValue(camionId, out Camion camion);
            decimal kmValor;
            decimal? km = decimal.TryParse((string)json["distancia"], NumberStyles.Number, CultureInfo.InvariantCulture, out kmValor) ? kmValor : (decimal?)null;
            string error;
            // El presupuesto guarda solo la base: sin falso flete ni estadía.
            var calculo = CalcularCon(despues, camion, (string)json["tipoTarifa"] == "km", km, vuelta,
                VueltaSugerida(salidas, camionId, inicio, 0), false, 0, out error);
            if (calculo == null)
            {
                item.Grupo = NoSePuede;
                item.Que_Pasa = char.ToUpper(error[0]) + error.Substring(1) + ".";
                res.Items.Add(item);
                return;
            }

            item.Calculo = calculo;
            item.Importe_Nuevo = calculo.ImporteBase;
            if (tieneImporte && importe == calculo.ImporteBase)
            {
                if (tarifarioId != idDespues || (string)json["tarifaDetalle"] != calculo.TarifaDetalle)
                    res.SoloDetalle.Add(item);
                return;
            }

            item.Grupo = Recalcula;
            item.TipoRevisar = "Presupuesto";
            item.Que_Pasa = PasaA(tarifarioId, despues, "Reenviáselo si ya se lo mandaste.");
            res.Items.Add(item);
        }

        // ------------------------------------------------------------ Guardado

        // Aplica lo calculado, dentro de la transacción del guardado y después de guardar la tabla (tarifarioId: el id real,
        // también si era nueva). Registra el cambio con su motivo y lo que queda para revisar (database/tarifas/05).
        public static Aplicado Aplicar(SqlConnection cn, SqlTransaction tx, Resultado r, int tarifarioId, string tabla, bool alta,
            string motivo, string usuario, DateTime ahora)
        {
            var aplicado = new Aplicado { Recalculados = new List<Item>() };

            foreach (var item in r.SoloDetalle)
            {
                if (item.Clase == "Viaje")
                    Ejecutar(cn, tx, "UPDATE dbo.VIAJES SET TarifarioID=@t, Tarifa_Detalle=@tdet, Importe_Detalle=@idet WHERE Viaje_ID=@id",
                        P("@t", item.Calculo.TarifarioID == TablaNueva ? tarifarioId : item.Calculo.TarifarioID),
                        P("@tdet", item.Calculo.TarifaDetalle), P("@idet", item.Calculo.ImporteDetalle), P("@id", item.Id));
                else
                    GuardarPresupuesto(cn, tx, item, tarifarioId);
            }

            foreach (var viaje in r.VuelvenAlDocumento)
                Ejecutar(cn, tx,
                    "UPDATE dbo.TARIFARIO_REVISAR SET Resuelto_Fecha=@f, Resuelto_Usuario=@u, Resuelto_Como=N'La tarifa volvió al importe del documento.' " +
                    "WHERE Viaje_ID=@v AND Tipo IN (N'Proforma', N'Comprobante') AND Resuelto_Fecha IS NULL",
                    P("@f", ahora), P("@u", Recortar(usuario, 50)), P("@v", viaje));

            if (!r.HayCambios) return aplicado;

            aplicado.CambioID = Escalar(cn, tx,
                "INSERT INTO dbo.TARIFARIO_CAMBIOS (Tarifario_ID, Tabla, Tipo, Motivo, Fecha, Usuario) OUTPUT INSERTED.Cambio_ID " +
                "VALUES (@t, @tabla, @tipo, @motivo, @fecha, @usuario)",
                P("@t", tarifarioId), P("@tabla", Recortar(tabla, 100)), P("@tipo", alta ? "Tabla nueva" : "Corrección"),
                P("@motivo", Recortar(motivo, 500)), P("@fecha", ahora), P("@usuario", Recortar(usuario, 50)));

            var borradores = new HashSet<int>();
            foreach (var item in r.Items.Where(i => i.Grupo == Recalcula || i.Grupo == Revisar))
            {
                int idTabla = item.Calculo.TarifarioID == TablaNueva ? tarifarioId : item.Calculo.TarifarioID.Value;
                if (item.Clase == "Viaje" && item.Grupo == Recalcula)
                {
                    Ejecutar(cn, tx,
                        "UPDATE dbo.VIAJES SET TarifarioID=@t, Vuelta=@vuelta, Importe_Base=@base, Tarifa_Detalle=@tdet, Importe=@imp, Importe_Detalle=@idet " +
                        "WHERE Viaje_ID=@id",
                        P("@t", idTabla), P("@vuelta", item.Calculo.AplicaVuelta ? item.Calculo.Vuelta : null), P("@base", item.Calculo.ImporteBase),
                        P("@tdet", item.Calculo.TarifaDetalle), P("@imp", item.Calculo.Importe), P("@idet", item.Calculo.ImporteDetalle), P("@id", item.Id));
                    if (item.ActualizaLinea && item.Proforma_ID.HasValue)
                    {
                        Ejecutar(cn, tx,
                            "UPDATE dbo.PROFORMA_DETALLE SET PrecioUnitario=@precio, " +
                            "Subtotal=ROUND(ISNULL(Cantidad, 0) * @precio * (1 - ISNULL(DescuentoPct, 0) / 100), 2) " +
                            "WHERE Proforma_ID=@p AND UPPER(LTRIM(RTRIM(ISNULL(Codigo, '')))) = @codigo",
                            P("@precio", Math.Round(item.Calculo.Importe, 2, MidpointRounding.AwayFromZero)), P("@p", item.Proforma_ID.Value),
                            P("@codigo", "V" + item.Id));
                        borradores.Add(item.Proforma_ID.Value);
                    }
                    aplicado.ViajesRecalculados++;
                    aplicado.Recalculados.Add(item);
                }
                else if (item.Clase == "Presupuesto")
                {
                    GuardarPresupuesto(cn, tx, item, tarifarioId);
                    aplicado.PresupuestosRecalculados++;
                    aplicado.Recalculados.Add(item);
                }

                if (item.TipoRevisar != null && RegistrarRevisar(cn, tx, aplicado.CambioID, item, ahora, usuario))
                    aplicado.ParaRevisar++;
            }

            foreach (var proforma in borradores)
                RecalcularTotales(cn, tx, proforma);

            Ejecutar(cn, tx, "UPDATE dbo.TARIFARIO_CAMBIOS SET Viajes_Recalculados=@v, Presupuestos_Recalculados=@p WHERE Cambio_ID=@c",
                P("@v", aplicado.ViajesRecalculados), P("@p", aplicado.PresupuestosRecalculados), P("@c", aplicado.CambioID));
            return aplicado;
        }

        // Lo mismo que guarda la pantalla de presupuestos: el importe en texto con punto decimal, la tabla, la vuelta y el
        // detalle. Saca lo que quedaba de las tarifas de antes.
        private static void GuardarPresupuesto(SqlConnection cn, SqlTransaction tx, Item item, int tarifarioId)
        {
            var json = Json(item.Datos);
            json["importe"] = item.Calculo.ImporteBase.ToString("0.00", CultureInfo.InvariantCulture);
            json["tarifarioId"] = item.Calculo.TarifarioID == TablaNueva ? tarifarioId : item.Calculo.TarifarioID.Value;
            if (item.Calculo.AplicaVuelta) json["vuelta"] = item.Calculo.Vuelta.Value;
            else json.Remove("vuelta");
            json["tarifaDetalle"] = item.Calculo.TarifaDetalle;
            json.Remove("tarifaId");
            json.Remove("valorKm");
            Ejecutar(cn, tx, "UPDATE dbo.PRESUPUESTOS SET Datos=@d WHERE Presupuesto_ID=@id",
                P("@d", json.ToString(Newtonsoft.Json.Formatting.None)), P("@id", item.Id));
        }

        // Si el documento ya tenía algo para revisar sin resolver, el importe anterior es el de entonces (el que vio el
        // cliente) y lo viejo queda resuelto por este cambio. Si con este cambio vuelve a ese importe (por ejemplo, se deshizo
        // una corrección), no queda nada para revisar: devuelve false.
        private static bool RegistrarRevisar(SqlConnection cn, SqlTransaction tx, int cambioId, Item item, DateTime ahora, string usuario)
        {
            string filtro = item.TipoRevisar == "Presupuesto" ? "Presupuesto_ID=@doc" : "Viaje_ID=@doc";
            var anterior = Leer(cn, tx,
                "SELECT TOP (1) Importe_Anterior FROM dbo.TARIFARIO_REVISAR WHERE Tipo=@tipo AND " + filtro + " AND Resuelto_Fecha IS NULL " +
                "ORDER BY Revisar_ID", r => DecN(r, "Importe_Anterior"), P("@tipo", item.TipoRevisar), P("@doc", item.Id)).FirstOrDefault();
            decimal? antes = anterior ?? item.Importe_Anterior;
            bool vuelve = antes.HasValue && item.Importe_Nuevo.HasValue && antes.Value == item.Importe_Nuevo.Value;
            Ejecutar(cn, tx,
                "UPDATE dbo.TARIFARIO_REVISAR SET Resuelto_Fecha=@f, Resuelto_Usuario=@u, Resuelto_Como=@como " +
                "WHERE Tipo=@tipo AND " + filtro + " AND Resuelto_Fecha IS NULL",
                P("@f", ahora), P("@u", Recortar(usuario, 50)),
                P("@como", vuelve ? "La tarifa volvió al importe que ya tenía." : "Reemplazado por un cambio de tarifa posterior."),
                P("@tipo", item.TipoRevisar), P("@doc", item.Id));
            if (vuelve) return false;
            Ejecutar(cn, tx,
                "INSERT INTO dbo.TARIFARIO_REVISAR (Cambio_ID, Tipo, Presupuesto_ID, Viaje_ID, Proforma_ID, Comprobante_ID, ClienteID, Documento, " +
                "Importe_Anterior, Importe_Nuevo) VALUES (@c, @tipo, @presupuesto, @viaje, @proforma, @comprobante, @cliente, @documento, @antes, @despues)",
                P("@c", cambioId), P("@tipo", item.TipoRevisar),
                P("@presupuesto", item.Clase == "Presupuesto" ? item.Id : (int?)null), P("@viaje", item.Clase == "Viaje" ? item.Id : (int?)null),
                P("@proforma", item.Proforma_ID), P("@comprobante", item.Comprobante_ID), P("@cliente", item.ClienteID),
                P("@documento", Recortar(item.Documento, 30)), P("@antes", antes), P("@despues", item.Importe_Nuevo));
            return true;
        }

        // Los mismos totales que ProformasController.ComputarTotales.
        private static void RecalcularTotales(SqlConnection cn, SqlTransaction tx, int proformaId)
        {
            Ejecutar(cn, tx, @"
UPDATE p SET Subtotal = ROUND(x.Bruto, 2), Descuentos = ROUND(x.Descuento, 2), SubtotalNeto = ROUND(x.Bruto - x.Descuento, 2),
       IVA = ROUND(x.Iva, 2), TotalGeneral = ROUND(ROUND(x.Bruto - x.Descuento, 2) + ROUND(x.Iva, 2) + ISNULL(p.OtrosImpuestos, 0), 2)
FROM dbo.PROFORMAS p
CROSS APPLY (SELECT ISNULL(SUM(ISNULL(d.Cantidad, 0) * ISNULL(d.PrecioUnitario, 0)), 0) AS Bruto,
                    ISNULL(SUM(ISNULL(d.Cantidad, 0) * ISNULL(d.PrecioUnitario, 0) * ISNULL(d.DescuentoPct, 0) / 100), 0) AS Descuento,
                    ISNULL(SUM(ISNULL(d.Cantidad, 0) * ISNULL(d.PrecioUnitario, 0) * (1 - ISNULL(d.DescuentoPct, 0) / 100) * ISNULL(d.IvaPct, 0) / 100), 0) AS Iva
             FROM dbo.PROFORMA_DETALLE d WHERE d.Proforma_ID = p.Proforma_ID) x
WHERE p.Proforma_ID = @p AND p.Estado = 'Borrador'", P("@p", proformaId));
        }

        // ------------------------------------------------------------ Ayudas

        public static string Pesos(decimal? v) { return v.HasValue ? TarifarioCalculo.Pesos(v.Value) : "—"; }

        // Sin convertir las fechas: el JSON del presupuesto vuelve a guardarse con sus fechas como estaban ("2026-08-05T08:00").
        private static JObject Json(string datos)
        {
            using (var lector = new Newtonsoft.Json.JsonTextReader(new System.IO.StringReader(datos ?? "")) { DateParseHandling = Newtonsoft.Json.DateParseHandling.None })
                return JObject.Load(lector);
        }

        private static string Recortar(string s, int max) { s = s ?? ""; return s.Length > max ? s.Substring(0, max) : s; }

        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }

        private static int Escalar(SqlConnection cn, SqlTransaction tx, string sql, params SqlParameter[] ps)
        {
            using (var cmd = new SqlCommand(sql, cn, tx))
            {
                cmd.Parameters.AddRange(ps);
                return Convert.ToInt32(cmd.ExecuteScalar());
            }
        }

        private static void Ejecutar(SqlConnection cn, SqlTransaction tx, string sql, params SqlParameter[] ps)
        {
            using (var cmd = new SqlCommand(sql, cn, tx))
            {
                cmd.Parameters.AddRange(ps);
                cmd.ExecuteNonQuery();
            }
        }
    }
}
