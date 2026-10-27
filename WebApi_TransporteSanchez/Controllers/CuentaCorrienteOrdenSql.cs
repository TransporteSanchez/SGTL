using System;

namespace WebApi_TransporteSanchez.Controllers
{
    /// <summary>Ordena los comprobantes principales antes de paginar, también para exportar.</summary>
    public static class CuentaCorrienteOrdenSql
    {
        public static string Obtener(string orden, string direccion)
        {
            const string inicial = " ORDER BY FechaContable,Movimiento_ID";
            var sentido = (direccion ?? "").Trim().ToLowerInvariant();
            if (sentido != "asc" && sentido != "desc") return inicial;
            string columna;
            switch ((orden ?? "").Trim().ToLowerInvariant())
            {
                case "cliente": columna = "Cliente"; break;
                case "comprobante": columna = "Comprobante"; break;
                case "concepto": columna = "Concepto"; break;
                case "fecha": columna = "FechaContable"; break;
                case "total": columna = "Total"; break;
                // Se ordena por los mismos importes que ve el usuario, incluidos los recibos anulados.
                case "cancelado": columna = "CASE WHEN Tipo='REC' AND EstadoComprobante='ANULADO' THEN Total ELSE Cancelado END"; break;
                case "saldo": columna = "CASE WHEN Tipo='REC' AND EstadoComprobante='ANULADO' THEN 0 ELSE Saldo END"; break;
                default: return inicial;
            }
            return " ORDER BY " + columna + " " + sentido.ToUpperInvariant() + ",Movimiento_ID";
        }
    }
}
