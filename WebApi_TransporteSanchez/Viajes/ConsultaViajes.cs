using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using System.Text;

namespace WebApi_TransporteSanchez.Viajes
{
    public static class ConsultaViajes
    {
        public class Filtro
        {
            public int? IdViaje { get; set; }
            public int? ClienteId { get; set; }
            public DateTime? FechaDesde { get; set; }
            public DateTime? FechaHasta { get; set; }
            public DateTime? FechaFinDesde { get; set; }
            public DateTime? FechaFinHasta { get; set; }
            public string Estado { get; set; }
            public string Referencia { get; set; }
            public string Orden { get; set; }
            public string Direccion { get; set; }
            public int Page { get; set; } = 1;
            public int PageSize { get; set; } = 15;
        }

        public class Viaje
        {
            public int Viaje_ID { get; set; }
            public DateTime Fecha_Inicio { get; set; }
            public DateTime Fecha_Fin { get; set; }
            public string Estado { get; set; }
            public string Cliente { get; set; }
            public string Tipo_Cliente { get; set; }
            public string Origen { get; set; }
            public string Origen_Direccion { get; set; }
            public string Destino { get; set; }
            public string Destino_Direccion { get; set; }
            public string Distancia_KM { get; set; }
            public string Chofer { get; set; }
            public string Camion { get; set; }
            public string Num_Remito { get; set; }
            public string Num_Transporte { get; set; }
            public string Num_de_Carga { get; set; }
            public decimal? Importe { get; set; }
            public string Detalle_Importe { get; set; }
            public string Adicionales { get; set; }
            public bool Falso_Flete { get; set; }
            public string Resultado_Entrega { get; set; }
            public DateTime? Fecha_Entrega { get; set; }
            public bool Tiene_Evidencia { get; set; }
            public string Sin_Carga_Observacion { get; set; }
            public string Cancelado_Motivo { get; set; }
            public DateTime? Cancelado_Fecha { get; set; }
            public string Cancelado_Usuario { get; set; }
            public int? Cancelado_Presupuesto_ID { get; set; }
            public int? Presupuesto_ID { get; set; }
            public int? EnProforma_ID { get; set; }
            public string EnProforma_Numero { get; set; }
            public string Usu_Alta { get; set; }
            public DateTime Fecha_Alta { get; set; }
            public string Usu_Modi { get; set; }
            public DateTime Fecha_Modi { get; set; }
        }

        public class Pagina
        {
            public int TotalRecords { get; set; }
            public List<Viaje> Results { get; set; }
        }

        private const string Consulta = @"
SELECT v.Viaje_ID, v.Fecha_Inicio, v.Fecha_Fin, v.Estado,
       ISNULL(c.Razon_Social, '') AS Cliente,
       ISNULL(c.Tipo_Cliente, 'Directo') AS Tipo_Cliente,
       ISNULL(o.Descripcion, '') AS Origen,
       CONCAT_WS(', ', NULLIF(LTRIM(RTRIM(CONCAT(o.Calle, ' ', o.AlturaCalle))), ''), lo.Nombre_Localidad,
                 NULLIF(po.Nombre_Provincia, lo.Nombre_Localidad)) AS Origen_Direccion,
       ISNULL(d.Descripcion, '') AS Destino,
       CONCAT_WS(', ', NULLIF(LTRIM(RTRIM(CONCAT(d.Calle, ' ', d.AlturaCalle))), ''), ld.Nombre_Localidad,
                 NULLIF(pd.Nombre_Provincia, ld.Nombre_Localidad)) AS Destino_Direccion,
       RTRIM(v.Distancia_KM) AS Distancia_KM,
       CONCAT_WS(' ', ch.Nombre, ch.Apellido) AS Chofer,
       RTRIM(ca.Dominio) AS Camion,
       RTRIM(v.Num_Remito) AS Num_Remito, v.Num_Transporte, RTRIM(v.Num_de_Carga) AS Num_de_Carga,
       v.Importe,
       CASE WHEN v.Falso_Flete = 1 OR v.Estadia_Modulos > 0 OR v.Vuelta_Vacia_Porcentaje > 0
            THEN v.Importe_Detalle ELSE v.Tarifa_Detalle END AS Detalle_Importe,
       v.Adicionales, v.Falso_Flete, v.Resultado_Entrega, v.Fecha_Entrega,
       CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.VIAJE_EVIDENCIA e WHERE e.Viaje_ID = v.Viaje_ID) THEN 1 ELSE 0 END AS bit) AS Tiene_Evidencia,
       v.Sin_Carga_Observacion, v.Cancelado_Motivo, v.Cancelado_Fecha, v.Cancelado_Usuario, v.Cancelado_Presupuesto_ID,
       (SELECT MAX(p.Presupuesto_ID) FROM dbo.PRESUPUESTOS p WHERE p.ViajeID = v.Viaje_ID) AS Presupuesto_ID,
       pf.Proforma_ID AS EnProforma_ID, pf.Numero AS EnProforma_Numero,
       v.Usu_Alta, v.Fecha_Alta, v.Usu_Modi, v.Fecha_Modi
FROM dbo.VIAJES v
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
LEFT JOIN dbo.CHOFERES ch ON ch.Chofer_ID = v.ChoferID
LEFT JOIN dbo.CAMIONES ca ON ca.Camion_ID = v.CamionID
LEFT JOIN dbo.ORIGEN o ON o.Origen_ID = v.OrigenID
LEFT JOIN dbo.LOCALIDADES lo ON lo.Loc_ID = o.LocID
LEFT JOIN dbo.PROVINCIAS po ON po.Prov_ID = o.ProvID
LEFT JOIN dbo.DESTINO d ON d.Destino_ID = v.DestinoID
LEFT JOIN dbo.LOCALIDADES ld ON ld.Loc_ID = d.LocID
LEFT JOIN dbo.PROVINCIAS pd ON pd.Prov_ID = d.ProvID
OUTER APPLY (
    SELECT TOP (1) p.Proforma_ID, p.Numero
    FROM dbo.PROFORMAS p
    WHERE p.Estado <> 'Anulada'
      AND (EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = p.Proforma_ID AND pv.ViajeID = v.Viaje_ID)
        OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE de WHERE de.Proforma_ID = p.Proforma_ID
                   AND LTRIM(RTRIM(de.Codigo)) = CONCAT('V', v.Viaje_ID)))
    ORDER BY CASE WHEN p.Estado = 'Borrador' THEN 1 ELSE 0 END, p.Proforma_ID DESC
) pf";

        private static readonly Dictionary<string, string> Columnas = new Dictionary<string, string>
        {
            { "numeroViaje", "v.Viaje_ID" },
            { "cliente", "c.Razon_Social" },
            { "fechaInicio", "v.Fecha_Inicio" },
            { "origen", "o.Descripcion" },
            { "km", "TRY_CONVERT(decimal(9, 1), REPLACE(RTRIM(v.Distancia_KM), ',', '.'))" }
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

            void AgregarFechas(string columna, DateTime? desde, DateTime? hasta)
            {
                if (desde.HasValue) Agregar("v." + columna + " >= @desde" + columna, "@desde" + columna, desde.Value.Date);
                if (hasta.HasValue) Agregar("v." + columna + " < @hasta" + columna, "@hasta" + columna, hasta.Value.Date.AddDays(1));
            }

            if (filtro.IdViaje.HasValue) Agregar("v.Viaje_ID = @viaje", "@viaje", filtro.IdViaje.Value);
            if (filtro.ClienteId.HasValue) Agregar("v.ClienteID = @cliente", "@cliente", filtro.ClienteId.Value);
            if (!string.IsNullOrWhiteSpace(filtro.Estado)) Agregar("v.Estado = @estado", "@estado", filtro.Estado.Trim());
            if (!string.IsNullOrWhiteSpace(filtro.Referencia))
                Agregar("(CHARINDEX(@referencia, v.Num_Remito) > 0 OR CHARINDEX(@referencia, v.Num_Transporte) > 0 " +
                    "OR CHARINDEX(@referencia, v.Num_de_Carga) > 0)", "@referencia", filtro.Referencia.Trim());
            AgregarFechas("Fecha_Inicio", filtro.FechaDesde, filtro.FechaHasta);
            AgregarFechas("Fecha_Fin", filtro.FechaFinDesde, filtro.FechaFinHasta);

            int total = db.Database.SqlQuery<int>("SELECT COUNT(*) FROM dbo.VIAJES v" + donde, Parametros(valores)).Single();
            bool todos = filtro.PageSize <= 0;
            int cantidad = todos ? Math.Max(total, 1) : filtro.PageSize;
            valores["@desplazamiento"] = todos ? 0 : (Math.Max(filtro.Page, 1) - 1) * cantidad;
            valores["@cantidad"] = cantidad;

            return new Pagina
            {
                TotalRecords = total,
                Results = db.Database.SqlQuery<Viaje>(
                    Consulta + donde + Orden(filtro) + " OFFSET @desplazamiento ROWS FETCH NEXT @cantidad ROWS ONLY",
                    Parametros(valores)).ToList()
            };
        }

        private static string Orden(Filtro filtro)
        {
            string columna;
            if (!Columnas.TryGetValue(filtro.Orden ?? "", out columna)) return " ORDER BY v.Viaje_ID DESC";
            var orden = " ORDER BY " + columna + (filtro.Direccion == "desc" ? " DESC" : " ASC");
            return columna == "v.Viaje_ID" ? orden : orden + ", v.Viaje_ID DESC";
        }

        private static SqlParameter[] Parametros(Dictionary<string, object> valores)
        {
            return valores.Select(v => new SqlParameter(v.Key, v.Value)).ToArray();
        }
    }
}