using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;

namespace WebApi_TransporteSanchez.Tarifas
{
    // Lo que quedó para revisar por un cambio de tarifa (TARIFARIO_REVISAR, database/tarifas/05; §33 de PENDIENTES): lo
    // muestran el ícono y el aviso de presupuestos, proformas y viajes, y el tablero. Se resuelve solo al reenviar el
    // presupuesto por e-mail o al anular la proforma (sus viajes se recalculan); el de un comprobante, a mano.
    // Si el script 05 todavía no se corrió, no hay nada para revisar y anular una proforma sigue funcionando igual.
    public static class TarifarioRevisar
    {
        public class Fila
        {
            public int Revisar_ID { get; set; }
            public string Tipo { get; set; }                 // Presupuesto, Proforma o Comprobante
            public int? Presupuesto_ID { get; set; }
            public int? Viaje_ID { get; set; }
            public int? Proforma_ID { get; set; }
            public int? Comprobante_ID { get; set; }
            public int? ClienteID { get; set; }
            public string Cliente { get; set; }
            public string Documento { get; set; }
            public decimal? Importe_Anterior { get; set; }
            public decimal? Importe_Nuevo { get; set; }
            public string Tabla { get; set; }
            public string Tipo_Cambio { get; set; }          // Corrección o Tabla nueva
            public string Motivo { get; set; }
            public DateTime Fecha { get; set; }
            public string Usuario { get; set; }
            public string Que_Hacer { get; set; }
        }

        private class ViajeAnulado
        {
            public int Revisar_ID { get; set; }
            public int Viaje_ID { get; set; }
            public int ClienteID { get; set; }
            public int CamionID { get; set; }
            public DateTime Fecha_Inicio { get; set; }
            public string Distancia_KM { get; set; }
            public string Tarifa_Modo { get; set; }
            public int? Vuelta { get; set; }
            public bool Falso_Flete { get; set; }
            public int Estadia_Modulos { get; set; }
            public decimal? Importe { get; set; }
        }

        public class Recalculado
        {
            public int Viaje_ID { get; set; }
            public decimal? Importe_Anterior { get; set; }
            public decimal Importe_Nuevo { get; set; }
        }

        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }

        private static bool Existe(DbContext db)
        {
            return db.Database.SqlQuery<int>("SELECT CASE WHEN OBJECT_ID(N'dbo.TARIFARIO_REVISAR', N'U') IS NULL THEN 0 ELSE 1 END").First() == 1;
        }

        private const string SELECT_PENDIENTES =
            "SELECT r.Revisar_ID, r.Tipo, r.Presupuesto_ID, r.Viaje_ID, r.Proforma_ID, r.Comprobante_ID, r.ClienteID, " +
            "ISNULL(cl.Razon_Social, '') AS Cliente, r.Documento, r.Importe_Anterior, r.Importe_Nuevo, c.Tabla, c.Tipo AS Tipo_Cambio, " +
            "c.Motivo, c.Fecha, c.Usuario, CAST(NULL AS nvarchar(300)) AS Que_Hacer " +
            "FROM dbo.TARIFARIO_REVISAR r JOIN dbo.TARIFARIO_CAMBIOS c ON c.Cambio_ID = r.Cambio_ID " +
            "LEFT JOIN dbo.CLIENTES cl ON cl.Cliente_ID = r.ClienteID " +
            "WHERE r.Resuelto_Fecha IS NULL ";

        // Lo que falta resolver, el más nuevo primero. Con un documento, solo lo de ese documento.
        public static List<Fila> Pendientes(DbContext db, int presupuestoId = 0, int proformaId = 0, int viajeId = 0)
        {
            if (!Existe(db)) return new List<Fila>();
            string filtro = presupuestoId > 0 ? "AND r.Presupuesto_ID = @id " : proformaId > 0 ? "AND r.Proforma_ID = @id AND r.Tipo = N'Proforma' "
                : viajeId > 0 ? "AND r.Viaje_ID = @id " : "";
            int id = presupuestoId > 0 ? presupuestoId : proformaId > 0 ? proformaId : viajeId;
            var filas = db.Database.SqlQuery<Fila>(SELECT_PENDIENTES + filtro + "ORDER BY c.Fecha DESC, r.Revisar_ID", P("@id", id)).ToList();
            foreach (var f in filas) f.Que_Hacer = QueHacer(f);
            return filas;
        }

        // Qué hacer, corto (lo muestra el tablero).
        public static string QueHacer(Fila f)
        {
            if (f.Tipo == "Presupuesto")
                return "Reenviáselo al cliente desde Ver PDF.";
            if (f.Tipo == "Proforma")
                return "Anulá la proforma " + (f.Documento ?? "") + " y generala de nuevo.";
            decimal diferencia = (f.Importe_Nuevo ?? 0) - (f.Importe_Anterior ?? 0);
            return "Corresponde una nota de " + (diferencia < 0 ? "crédito" : "débito") + " por " + TarifarioCalculo.Pesos(Math.Abs(diferencia))
                + (string.IsNullOrEmpty(f.Documento) ? "" : " sobre " + f.Documento) + ".";
        }

        // Marca como resuelto lo indicado (uno por id, o todo lo de un presupuesto). Devuelve cuántos.
        public static int Resolver(DbContext db, string usuario, string como, int revisarId = 0, int presupuestoId = 0)
        {
            if (!Existe(db)) return 0;
            string filtro = revisarId > 0 ? "Revisar_ID = @id" : "Presupuesto_ID = @id AND Tipo = N'Presupuesto'";
            return db.Database.ExecuteSqlCommand(
                "UPDATE dbo.TARIFARIO_REVISAR SET Resuelto_Fecha = @f, Resuelto_Usuario = @u, Resuelto_Como = @como WHERE " + filtro + " AND Resuelto_Fecha IS NULL",
                P("@f", AhoraArgentina()), P("@u", Recortar(usuario, 50)), P("@como", Recortar(como, 300)), P("@id", revisarId > 0 ? revisarId : presupuestoId));
        }

        // Al anular una proforma (dentro de su transacción): sus viajes que quedaron para revisar se recalculan con la tabla
        // vigente y lo pendiente queda resuelto. Así, al generarla de nuevo, "Traer viajes" trae el importe corregido.
        public static List<Recalculado> AlAnularProforma(DbContext db, int proformaId, string usuario)
        {
            var recalculados = new List<Recalculado>();
            if (!Existe(db)) return recalculados;
            var viajes = db.Database.SqlQuery<ViajeAnulado>(
                "SELECT r.Revisar_ID, v.Viaje_ID, ISNULL(v.ClienteID, 0) AS ClienteID, ISNULL(v.CamionID, 0) AS CamionID, v.Fecha_Inicio, " +
                "RTRIM(ISNULL(v.Distancia_KM, '')) AS Distancia_KM, ISNULL(v.Tarifa_Modo, 'Fija') AS Tarifa_Modo, v.Vuelta, v.Falso_Flete, v.Estadia_Modulos, v.Importe " +
                "FROM dbo.TARIFARIO_REVISAR r JOIN dbo.VIAJES v ON v.Viaje_ID = r.Viaje_ID " +
                "WHERE r.Proforma_ID = @p AND r.Tipo = N'Proforma' AND r.Resuelto_Fecha IS NULL", P("@p", proformaId)).ToList();
            var ahora = AhoraArgentina();
            foreach (var v in viajes)
            {
                decimal km;
                var r = TarifarioCalculo.Calcular(db, new TarifarioCalculo.Pedido
                {
                    ViajeId = v.Viaje_ID,
                    ClienteID = v.ClienteID,
                    UsaTarifario = true,
                    PorKm = v.Tarifa_Modo == "Km",
                    FechaInicio = v.Fecha_Inicio,
                    CamionID = v.CamionID,
                    Km = decimal.TryParse(v.Distancia_KM.Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out km) ? km : (decimal?)null,
                    Vuelta = v.Vuelta,
                    FalsoFlete = v.Falso_Flete,
                    EstadiaModulos = v.Estadia_Modulos
                });
                string como;
                if (r.Ok)
                {
                    db.Database.ExecuteSqlCommand(
                        "UPDATE dbo.VIAJES SET TarifarioID=@t, Vuelta=@vuelta, Importe_Base=@base, Tarifa_Detalle=@tdet, Importe=@imp, Importe_Detalle=@idet WHERE Viaje_ID=@id",
                        P("@t", r.TarifarioID), P("@vuelta", r.AplicaVuelta ? r.Vuelta : null), P("@base", r.ImporteBase), P("@tdet", r.TarifaDetalle),
                        P("@imp", r.Importe), P("@idet", r.ImporteDetalle), P("@id", v.Viaje_ID));
                    recalculados.Add(new Recalculado { Viaje_ID = v.Viaje_ID, Importe_Anterior = v.Importe, Importe_Nuevo = r.Importe });
                    como = "Proforma anulada: el viaje se recalculó (" + TarifarioCalculo.Pesos(r.Importe) + ").";
                    // En la auditoría, dentro de la misma transacción (como ProformasController.Auditar).
                    try
                    {
                        db.Database.ExecuteSqlCommand(
                            "INSERT INTO AUDITORIA (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen) " +
                            "VALUES (GETDATE(),@u,'UPDATE','VIAJES',@k,@ant,@nue,NULL)",
                            P("@u", Recortar(usuario, 20)), P("@k", "Viaje_ID=" + v.Viaje_ID),
                            P("@ant", "Importe " + TarifarioImpacto.Pesos(v.Importe)),
                            P("@nue", "Importe recalculado al anular la proforma, por un cambio de tarifa: " + TarifarioCalculo.Pesos(r.Importe)));
                    }
                    catch { }
                }
                else
                    como = "Proforma anulada; el viaje no se pudo recalcular: " + r.Mensaje;
                db.Database.ExecuteSqlCommand(
                    "UPDATE dbo.TARIFARIO_REVISAR SET Resuelto_Fecha = @f, Resuelto_Usuario = @u, Resuelto_Como = @como WHERE Revisar_ID = @id",
                    P("@f", ahora), P("@u", Recortar(usuario, 50)), P("@como", Recortar(como, 300)), P("@id", v.Revisar_ID));
            }
            return recalculados;
        }

        private static DateTime AhoraArgentina()
        {
            return TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Argentina Standard Time");
        }

        private static string Recortar(string s, int max)
        {
            s = string.IsNullOrWhiteSpace(s) ? "sistema" : s.Trim();
            return s.Length > max ? s.Substring(0, max) : s;
        }
    }
}
