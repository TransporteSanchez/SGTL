using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;

namespace WebApi_TransporteSanchez.Viajes
{
    // Camión y chofer ocupados (§43 de PENDIENTES, Rocío 26/10): el mismo camión, o el mismo chofer, en dos viajes (o en un
    // viaje y un presupuesto aceptado que todavía no generó su viaje) que se superponen, de inicio a fin. Que uno termine a la
    // hora en que empieza el otro no es superponerse. El error va debajo del campo, corto y empezando por el dato (§6.3 del
    // design system): "Camión ocupado: viaje #45, de 08:00 hs a 11:30 hs." (con la fecha, solo si es otro día).
    // Lo usan la pantalla (api/Viajes/Ocupado, al elegir el camión o el chofer o al cambiar el horario) y el guardado. Un viaje
    // cancelado no ocupa.
    public static class Ocupacion
    {
        public class Choque
        {
            public string Clase { get; set; }          // viaje o presupuesto
            public int Id { get; set; }
            public DateTime Inicio { get; set; }
            public DateTime Fin { get; set; }
        }

        // Como los demás errores de la API: debajo del campo que dice PropertyName.
        public class Error
        {
            public string PropertyName { get; set; }
            public string ErrorMessage { get; set; }
        }

        private static readonly CultureInfo EsAr = new CultureInfo("es-AR");

        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }

        // Lo que está ocupado (vacía si nada).
        public static List<Error> Errores(DbContext db, int camionId, int choferId, DateTime inicio, DateTime fin,
            int sinViaje, int sinPresupuesto)
        {
            var errores = new List<Error>();
            if (fin <= inicio) return errores;
            var camion = PrimerChoque(db, "CamionID", "camionId", camionId, inicio, fin, sinViaje, sinPresupuesto);
            if (camion != null) errores.Add(new Error { PropertyName = "CamionID", ErrorMessage = "Camión ocupado: " + Texto(camion, inicio) });
            var chofer = PrimerChoque(db, "ChoferID", "choferId", choferId, inicio, fin, sinViaje, sinPresupuesto);
            if (chofer != null) errores.Add(new Error { PropertyName = "ChoferID", ErrorMessage = "Chofer ocupado: " + Texto(chofer, inicio) });
            return errores;
        }

        // "viaje #45, de 08:00 hs a 11:30 hs." o, si es otro día, "viaje #45, del 27/10/2026 22:00 hs al 28/10/2026 06:00 hs."
        public static string Texto(Choque c, DateTime inicio)
        {
            string quien = c.Clase + " #" + c.Id;
            if (c.Inicio.Date == inicio.Date && c.Fin.Date == inicio.Date)
                return quien + ", de " + c.Inicio.ToString("HH:mm", EsAr) + " hs a " + c.Fin.ToString("HH:mm", EsAr) + " hs.";
            return quien + ", del " + c.Inicio.ToString("dd/MM/yyyy HH:mm", EsAr) + " hs al " + c.Fin.ToString("dd/MM/yyyy HH:mm", EsAr) + " hs.";
        }

        private static Choque PrimerChoque(DbContext db, string columna, string campoJson, int id, DateTime inicio, DateTime fin,
            int sinViaje, int sinPresupuesto)
        {
            if (id <= 0) return null;
            var viaje = db.Database.SqlQuery<Choque>(
                "SELECT TOP (1) N'viaje' AS Clase, Viaje_ID AS Id, Fecha_Inicio AS Inicio, Fecha_Fin AS Fin FROM dbo.VIAJES " +
                "WHERE " + columna + " = @id AND Viaje_ID <> @sinViaje AND Fecha_Inicio < @fin AND Fecha_Fin > @ini " +
                "AND ISNULL(Estado, '') <> 'Cancelado' ORDER BY Fecha_Inicio",
                P("@id", id), P("@sinViaje", sinViaje), P("@ini", inicio), P("@fin", fin)).FirstOrDefault();
            var presupuesto = db.Database.SqlQuery<Choque>(
                "SELECT TOP (1) N'presupuesto' AS Clase, Presupuesto_ID AS Id, " +
                "TRY_CAST(JSON_VALUE(Datos, '$.fechaInicio') AS datetime2) AS Inicio, TRY_CAST(JSON_VALUE(Datos, '$.fechaFin') AS datetime2) AS Fin " +
                "FROM dbo.PRESUPUESTOS WHERE Estado = 'Aceptado' AND ViajeID IS NULL AND ISJSON(Datos) = 1 AND Presupuesto_ID <> @sinPresupuesto " +
                "AND TRY_CAST(JSON_VALUE(Datos, '$." + campoJson + "') AS int) = @id " +
                "AND TRY_CAST(JSON_VALUE(Datos, '$.fechaInicio') AS datetime2) < @fin AND TRY_CAST(JSON_VALUE(Datos, '$.fechaFin') AS datetime2) > @ini " +
                "ORDER BY TRY_CAST(JSON_VALUE(Datos, '$.fechaInicio') AS datetime2)",
                P("@id", id), P("@sinPresupuesto", sinPresupuesto), P("@ini", inicio), P("@fin", fin)).FirstOrDefault();
            if (viaje == null) return presupuesto;
            if (presupuesto == null) return viaje;
            return presupuesto.Inicio < viaje.Inicio ? presupuesto : viaje;
        }
    }
}
