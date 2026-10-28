using System;

namespace WebApi_TransporteSanchez.Controllers
{
    /// <summary>Arma el orden seguro de proformas antes de paginar y para exportar.</summary>
    public static class ProformasOrdenSql
    {
        private const string OrdenInicial = " ORDER BY PROFORMAS.Proforma_ID DESC";

        public static string Obtener(string orden, string direccion)
        {
            var sentido = (direccion ?? "").Trim().ToLowerInvariant();
            if (sentido != "asc" && sentido != "desc") return OrdenInicial;

            string columna;
            switch ((orden ?? "").Trim().ToLowerInvariant())
            {
                case "numero": columna = "PROFORMAS.Numero"; break;
                case "cliente": columna = "ISNULL(PROFORMAS.Cli_RazonSocial,'')"; break;
                case "total": columna = "ISNULL(PROFORMAS.TotalGeneral,ISNULL(PROFORMAS.ImporteTotal,0))"; break;
                case "fecha": columna = "ISNULL(PROFORMAS.FechaEmision,PROFORMAS.FechaCreacion)"; break;
                case "usuario": columna = "ISNULL(PROFORMAS.Usu_Alta,'')"; break;
                default: return OrdenInicial;
            }

            var sql = " ORDER BY ";
            if (columna == "PROFORMAS.Numero")
                sql += "CASE WHEN PROFORMAS.Numero IS NULL THEN 1 ELSE 0 END, ";
            return sql + columna + " " + sentido.ToUpperInvariant() + ", PROFORMAS.Proforma_ID DESC";
        }
    }
}
