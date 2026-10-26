using System;

namespace WebApi_TransporteSanchez.Controllers
{
    /// <summary>Arma el orden seguro de la grilla de viajes antes de paginar.</summary>
    public static class ViajesOrdenSql
    {
        private const string OrdenInicial = " ORDER BY v.Viaje_ID DESC";
        private const string KmNumero = "TRY_CONVERT(decimal(18,6), NULLIF(REPLACE(LTRIM(RTRIM(v.Distancia_KM)), ',', '.'), ''))";

        /// <summary>Devuelve solo expresiones SQL de las columnas permitidas.</summary>
        public static string Obtener(string orden, string direccion)
        {
            var sentido = (direccion ?? "").Trim().ToLowerInvariant();
            if (sentido != "asc" && sentido != "desc") return OrdenInicial;

            string columna;
            switch ((orden ?? "").Trim().ToLowerInvariant())
            {
                case "numeroviaje": columna = "v.Viaje_ID"; break;
                case "cliente": columna = "ISNULL(c.Razon_Social,'')"; break;
                case "fechainicio": columna = "v.Fecha_Inicio"; break;
                case "fechafin": columna = "v.Fecha_Fin"; break;
                case "origen": columna = "ISNULL(o.Descripcion,'')"; break;
                case "destino": columna = "ISNULL(d.Descripcion,'')"; break;
                case "numeroremito": columna = "LTRIM(RTRIM(ISNULL(v.Num_Remito,'')))"; break;
                case "km": columna = KmNumero; break;
                default: return OrdenInicial;
            }

            var sql = " ORDER BY ";
            if (columna == KmNumero) sql += "CASE WHEN " + KmNumero + " IS NULL THEN 1 ELSE 0 END, ";
            sql += columna + " " + sentido.ToUpperInvariant();
            if (columna != "v.Viaje_ID") sql += ", v.Viaje_ID DESC";
            return sql;
        }
    }
}
