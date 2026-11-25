using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using System.Text;

namespace WebApi_TransporteSanchez.Proformas
{
    public static class ConsultaProformas
    {
        public class Filtro
        {
            public string Numero { get; set; }
            public int? ClienteId { get; set; }
            public string Estado { get; set; }
            public string Tipo { get; set; }
            public DateTime? Desde { get; set; }
            public DateTime? Hasta { get; set; }
            public string Usuario { get; set; }
            public bool SoloGeneradas { get; set; }
            public string Orden { get; set; }
            public string Direccion { get; set; }
            public int Page { get; set; } = 1;
            public int PageSize { get; set; } = 15;
        }

        public class Proforma
        {
            public int Proforma_ID { get; set; }
            public string Numero { get; set; }
            public DateTime Fecha { get; set; }
            public int ClienteID { get; set; }
            public string Cliente { get; set; }
            public string Destino { get; set; }
            public decimal Total { get; set; }
            public string Estado { get; set; }
            public string UsuarioCreador { get; set; }
            public string Tipo_Proforma { get; set; }
            public string Plataforma { get; set; }
            public string Plataforma_Numero { get; set; }
            public string Factura { get; set; }
        }

        public class Pagina
        {
            public int Total { get; set; }
            public int Paginas { get; set; }
            public List<Proforma> Proformas { get; set; }
        }

        private const string Consulta = @"
SELECT p.Proforma_ID, p.Numero, ISNULL(p.FechaEmision, p.FechaCreacion) AS Fecha,
       p.ClienteID, p.Cli_RazonSocial AS Cliente, p.Destino,
       ISNULL(p.TotalGeneral, p.ImporteTotal) AS Total, p.Estado, p.Usu_Alta AS UsuarioCreador,
       p.Tipo_Proforma, pl.Nombre AS Plataforma, p.Plataforma_Numero, fa.Factura
FROM dbo.PROFORMAS p
LEFT JOIN dbo.PLATAFORMAS pl ON pl.Plataforma_ID = p.PlataformaID
OUTER APPLY (
    SELECT TOP (1) CONCAT(c.Tipo, '-', c.Letra, '-', c.Sucursal, '-', RIGHT(CONCAT('00000000', c.NumeroCorrelativo), 8)) AS Factura
    FROM dbo.COMPROBANTES_PROFORMAS cp
    JOIN dbo.COMPROBANTES c ON c.Comprobante_ID = cp.ComprobanteID
    WHERE cp.ProformaID = p.Proforma_ID AND cp.Vigente = 1 AND c.Impacto = 'D' AND c.Estado = 'EMITIDO'
    ORDER BY cp.ComprobanteProforma_ID DESC
) fa";

        private static readonly Dictionary<string, string> Columnas = new Dictionary<string, string>
        {
            { "numero", "p.Numero" },
            { "cliente", "p.Cli_RazonSocial" },
            { "fecha", "ISNULL(p.FechaEmision, p.FechaCreacion)" },
            { "total", "ISNULL(p.TotalGeneral, p.ImporteTotal)" },
            { "usuario", "p.Usu_Alta" }
        };

        public static Pagina Buscar(DbContext db, Filtro filtro)
        {
            var donde = new StringBuilder(" WHERE 1 = 1");
            var valores = new Dictionary<string, object>();

            void Agregar(string condicion, string parametro, object valor)
            {
                donde.Append(" AND ").Append(condicion);
                valores[parametro] = valor;
            }

            if (!string.IsNullOrWhiteSpace(filtro.Numero)) Agregar("CHARINDEX(@numero, p.Numero) > 0", "@numero", filtro.Numero.Trim());
            if (filtro.ClienteId.HasValue) Agregar("p.ClienteID = @cliente", "@cliente", filtro.ClienteId.Value);
            if (!string.IsNullOrWhiteSpace(filtro.Estado)) Agregar("p.Estado = @estado", "@estado", filtro.Estado.Trim());
            if (!string.IsNullOrWhiteSpace(filtro.Tipo)) Agregar("p.Tipo_Proforma = @tipo", "@tipo", filtro.Tipo.Trim());
            if (!string.IsNullOrWhiteSpace(filtro.Usuario)) Agregar("CHARINDEX(@usuario, p.Usu_Alta) > 0", "@usuario", filtro.Usuario.Trim());
            if (filtro.Desde.HasValue) Agregar(Columnas["fecha"] + " >= @desde", "@desde", filtro.Desde.Value.Date);
            if (filtro.Hasta.HasValue) Agregar(Columnas["fecha"] + " < @hasta", "@hasta", filtro.Hasta.Value.Date.AddDays(1));
            if (filtro.SoloGeneradas) donde.Append(" AND p.Estado <> 'Borrador'");

            int total = db.Database.SqlQuery<int>("SELECT COUNT(*) FROM dbo.PROFORMAS p" + donde, Parametros(valores)).Single();
            bool todas = filtro.PageSize <= 0;
            int cantidad = todas ? Math.Max(total, 1) : filtro.PageSize;
            valores["@desplazamiento"] = todas ? 0 : (Math.Max(filtro.Page, 1) - 1) * cantidad;
            valores["@cantidad"] = cantidad;

            return new Pagina
            {
                Total = total,
                Paginas = (total + cantidad - 1) / cantidad,
                Proformas = db.Database.SqlQuery<Proforma>(
                    Consulta + donde + Orden(filtro) + " OFFSET @desplazamiento ROWS FETCH NEXT @cantidad ROWS ONLY",
                    Parametros(valores)).ToList()
            };
        }

        private static string Orden(Filtro filtro)
        {
            string columna;
            if (!Columnas.TryGetValue(filtro.Orden ?? "", out columna)) return " ORDER BY p.Proforma_ID DESC";
            return " ORDER BY " + columna + (filtro.Direccion == "desc" ? " DESC" : " ASC") + ", p.Proforma_ID DESC";
        }

        private static SqlParameter[] Parametros(Dictionary<string, object> valores)
        {
            return valores.Select(v => new SqlParameter(v.Key, v.Value)).ToArray();
        }
    }
}