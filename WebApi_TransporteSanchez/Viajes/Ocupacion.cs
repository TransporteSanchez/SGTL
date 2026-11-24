using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;

namespace WebApi_TransporteSanchez.Viajes
{
    public static class Ocupacion
    {
        public class Choque
        {
            public string Clase { get; set; }
            public int Id { get; set; }
            public DateTime Inicio { get; set; }
            public DateTime Fin { get; set; }
        }

        public class Error
        {
            public string PropertyName { get; set; }
            public string ErrorMessage { get; set; }
        }

        public static List<Error> Errores(DbContext db, int camionId, int choferId, DateTime inicio, DateTime fin,
            int sinViaje, int sinPresupuesto)
        {
            var errores = new List<Error>();
            if (fin <= inicio) return errores;

            var ocupantes = new[]
            {
                new { Id = camionId, Nombre = "Camión", Columna = "CamionID", Campo = "$.camionId" },
                new { Id = choferId, Nombre = "Chofer", Columna = "ChoferID", Campo = "$.choferId" }
            };
            foreach (var ocupante in ocupantes.Where(o => o.Id > 0))
            {
                var choque = PrimerChoque(db, ocupante.Columna, ocupante.Campo, ocupante.Id, inicio, fin, sinViaje, sinPresupuesto);
                if (choque == null) continue;
                errores.Add(new Error { PropertyName = ocupante.Columna, ErrorMessage = ocupante.Nombre + " ocupado: " + Texto(choque, inicio) });
            }
            return errores;
        }

        private static Choque PrimerChoque(DbContext db, string columna, string campo, int id, DateTime inicio, DateTime fin,
            int sinViaje, int sinPresupuesto)
        {
            return db.Database.SqlQuery<Choque>(
                @"SELECT TOP (1) Clase, Id, Inicio, Fin FROM (
                    SELECT N'viaje' AS Clase, Viaje_ID AS Id, Fecha_Inicio AS Inicio, Fecha_Fin AS Fin
                    FROM dbo.VIAJES
                    WHERE " + columna + @" = @id AND Viaje_ID <> @sinViaje AND ISNULL(Estado, '') <> 'Cancelado'
                    UNION ALL
                    SELECT N'presupuesto', p.Presupuesto_ID, f.Inicio, f.Fin
                    FROM dbo.PRESUPUESTOS p
                    CROSS APPLY (SELECT CASE WHEN ISJSON(p.Datos) = 1 THEN p.Datos END AS Json) d
                    CROSS APPLY (SELECT TRY_CAST(JSON_VALUE(d.Json, '$.fechaInicio') AS datetime2) AS Inicio,
                                        TRY_CAST(JSON_VALUE(d.Json, '$.fechaFin') AS datetime2) AS Fin,
                                        TRY_CAST(JSON_VALUE(d.Json, @campo) AS int) AS Ocupante) f
                    WHERE p.Estado = 'Aceptado' AND p.ViajeID IS NULL
                      AND p.Presupuesto_ID <> @sinPresupuesto AND f.Ocupante = @id
                  ) ocupado
                  WHERE Inicio < @fin AND Fin > @inicio
                  ORDER BY Inicio, Clase DESC",
                new SqlParameter("@id", id),
                new SqlParameter("@campo", campo),
                new SqlParameter("@sinViaje", sinViaje),
                new SqlParameter("@sinPresupuesto", sinPresupuesto),
                new SqlParameter("@inicio", inicio),
                new SqlParameter("@fin", fin)).FirstOrDefault();
        }

        private static string Texto(Choque choque, DateTime inicio)
        {
            bool mismoDia = choque.Inicio.Date == inicio.Date && choque.Fin.Date == inicio.Date;
            var formato = mismoDia
                ? "{0} #{1}, de {2:HH:mm} hs a {3:HH:mm} hs."
                : "{0} #{1}, del {2:dd/MM/yyyy HH:mm} hs al {3:dd/MM/yyyy HH:mm} hs.";
            return string.Format(CultureInfo.InvariantCulture, formato, choque.Clase, choque.Id, choque.Inicio, choque.Fin);
        }
    }
}
