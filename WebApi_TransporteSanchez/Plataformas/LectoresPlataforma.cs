using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace WebApi_TransporteSanchez.Plataformas
{
    // Línea del archivo de una plataforma, ya leída y validada.
    public class LineaArchivo
    {
        public int Orden { get; set; }
        public string Referencia { get; set; }
        public DateTime? Fecha { get; set; }
        public string Ruta { get; set; }
        public decimal ImporteViaje { get; set; }
        public decimal Adicionales { get; set; }
    }

    public class LecturaArchivo
    {
        public List<LineaArchivo> Lineas { get; set; } = new List<LineaArchivo>();
        public List<string> Errores { get; set; } = new List<string>();
    }

    // Lo único propio de cada plataforma: cómo se lee su archivo y con qué dato del viaje se cruza cada línea.
    // El circuito (borrador, control, reclamo, generar, factura) es el mismo para todas (ProformasPlataformaController).
    public interface ILectorPlataforma
    {
        string Codigo { get; }

        // Columna de VIAJES con la que se cruza la referencia de cada línea. Es una constante del lector
        // (nunca viene del pedido), así que se puede usar en el SQL.
        string ColumnaReferenciaViaje { get; }

        // Columnas de VIAJES que tienen que estar completas para que el viaje pase a Listo para facturar.
        string[] ColumnasNumerosObligatorios { get; }

        // N° de la proforma en la plataforma a partir del nombre del archivo (null si no se puede).
        string NumeroDesdeNombreArchivo(string nombreArchivo);

        // filas: celdas como texto, la primera es el encabezado.
        LecturaArchivo Leer(List<List<string>> filas);

        // Formato del N° de factura tal como figura en la plataforma (etapa 6), como expresión regular
        // compatible con .NET y JavaScript, y un ejemplo para la ayuda de la pantalla.
        string FormatoFactura { get; }
        string EjemploFactura { get; }
    }

    public static class LectoresPlataforma
    {
        private static readonly Dictionary<string, ILectorPlataforma> Lectores =
            new Dictionary<string, ILectorPlataforma>(StringComparer.OrdinalIgnoreCase)
            {
                { "RUKAS", new LectorRukas() }
            };

        public static ILectorPlataforma Obtener(string codigo)
        {
            ILectorPlataforma lector;
            return codigo != null && Lectores.TryGetValue(codigo.Trim(), out lector) ? lector : null;
        }
    }

    // Excel del detalle de la proforma de Rukas (Proceso → detalle → ícono de Excel).
    // Formato relevado el 18/10 (§12 de docs/negocio/PROFORMA-CLIENTES-RUKAS.md):
    // hoja única, fila 1 = encabezados; Fecha "dd.MM.yyyy" e Importe Viajes "664,570" (coma de miles) como texto;
    // el N° de proforma solo está en el nombre del archivo ("MARFRIG - PROFORMA NRO 7594.xlsx").
    public class LectorRukas : ILectorPlataforma
    {
        private static readonly string[] Encabezados =
            { "Transporte", "Descripción Transporte", "Fecha", "Ruta", "Importe Viajes", "Adicionales" };

        private static readonly Regex NumeroEnNombre = new Regex(@"PROFORMA\s*NRO\.?\s*(\d+)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        private static readonly Regex ImporteConSeparadores = new Regex(@"^\d{1,3}([.,]\d{3})+$", RegexOptions.CultureInvariant);

        public string Codigo { get { return "RUKAS"; } }
        public string ColumnaReferenciaViaje { get { return "Num_Transporte"; } }
        public string[] ColumnasNumerosObligatorios { get { return new[] { "Num_Transporte", "Num_Remito", "Num_de_Carga" }; } }

        // Rukas muestra la factura en Cerrados como letra + punto de venta de 5 dígitos + número de 8: A00005-00000659.
        public string FormatoFactura { get { return @"^[A-Z]\d{5}-\d{8}$"; } }
        public string EjemploFactura { get { return "A00005-00000659"; } }

        public string NumeroDesdeNombreArchivo(string nombreArchivo)
        {
            var m = NumeroEnNombre.Match(nombreArchivo ?? "");
            return m.Success ? m.Groups[1].Value : null;
        }

        public LecturaArchivo Leer(List<List<string>> filas)
        {
            var r = new LecturaArchivo();
            if (filas == null || filas.Count == 0)
            {
                r.Errores.Add("El archivo está vacío.");
                return r;
            }

            var encabezado = filas[0] ?? new List<string>();
            for (int i = 0; i < Encabezados.Length; i++)
            {
                var celda = i < encabezado.Count ? (encabezado[i] ?? "").Trim() : "";
                if (!string.Equals(celda, Encabezados[i], StringComparison.OrdinalIgnoreCase))
                    r.Errores.Add("El archivo no tiene el formato de Rukas: en la columna " + (i + 1) + " se esperaba \"" + Encabezados[i] + "\".");
            }
            if (r.Errores.Count > 0) return r;

            var vistos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (int f = 1; f < filas.Count; f++)
            {
                var fila = filas[f] ?? new List<string>();
                Func<int, string> celda = i => i < fila.Count ? (fila[i] ?? "").Trim() : "";
                if (Enumerable.Range(0, Encabezados.Length).All(i => celda(i) == "")) continue;

                int filaExcel = f + 1;
                var referencia = celda(0);
                if (!Regex.IsMatch(referencia, @"^\d+$"))
                {
                    r.Errores.Add("Fila " + filaExcel + ": el N° de transporte \"" + referencia + "\" no es válido.");
                    continue;
                }
                if (!vistos.Add(referencia))
                {
                    r.Errores.Add("Fila " + filaExcel + ": el transporte " + referencia + " está repetido en el archivo.");
                    continue;
                }

                DateTime fecha;
                DateTime? fechaLinea = null;
                if (celda(2) != "")
                {
                    if (DateTime.TryParseExact(celda(2), new[] { "dd.MM.yyyy", "d.M.yyyy", "dd/MM/yyyy", "d/M/yyyy" },
                            CultureInfo.InvariantCulture, DateTimeStyles.None, out fecha))
                        fechaLinea = fecha;
                    else
                        r.Errores.Add("Fila " + filaExcel + ": la fecha \"" + celda(2) + "\" no es válida (se espera dd.mm.aaaa).");
                }

                decimal importe, adicionales;
                if (!LeerImporte(celda(4), out importe))
                {
                    r.Errores.Add("Fila " + filaExcel + ": el importe \"" + celda(4) + "\" no es válido.");
                    continue;
                }
                if (celda(5) == "") adicionales = 0;
                else if (!LeerImporte(celda(5), out adicionales))
                {
                    r.Errores.Add("Fila " + filaExcel + ": los adicionales \"" + celda(5) + "\" no son válidos.");
                    continue;
                }

                r.Lineas.Add(new LineaArchivo
                {
                    Orden = r.Lineas.Count + 1,
                    Referencia = referencia,
                    Fecha = fechaLinea,
                    Ruta = celda(3),
                    ImporteViaje = importe,
                    Adicionales = adicionales
                });
            }

            if (r.Errores.Count == 0 && r.Lineas.Count == 0)
                r.Errores.Add("El archivo no tiene transportes.");
            return r;
        }

        // Importes en pesos enteros: "664,570" (detalle), "5.292.185" (listados), "0" o "ARS 528.747".
        // Una coma o un punto seguidos de exactamente 3 dígitos son separador de miles, nunca decimales.
        private static bool LeerImporte(string texto, out decimal valor)
        {
            valor = 0;
            var t = (texto ?? "").Replace("ARS", "").Replace("$", "").Replace(" ", "").Trim();
            if (t == "") return false;
            if (ImporteConSeparadores.IsMatch(t)) t = t.Replace(",", "").Replace(".", "");
            return decimal.TryParse(t, NumberStyles.Number, CultureInfo.InvariantCulture, out valor) && valor >= 0;
        }
    }
}
