using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace WebApi_TransporteSanchez.Plataformas
{
    // Línea del archivo de una plataforma, ya leída. Si la fila trae un dato que no se puede usar, la línea se
    // guarda igual con Resultado/Detalle del archivo: es un error de la plataforma y se reclama desde el borrador.
    public class LineaArchivo
    {
        public int Orden { get; set; }
        public string Referencia { get; set; }
        public DateTime? Fecha { get; set; }
        public string Ruta { get; set; }
        public decimal ImporteViaje { get; set; }
        public decimal Adicionales { get; set; }
        public string Resultado { get; set; }
        public string Detalle { get; set; }
    }

    // Resultados que salen del archivo (no del control contra los viajes): "Volver a controlar" no los cambia.
    public static class ResultadosArchivo
    {
        public const string Repetido = "Repetido_en_archivo";
        public const string DatoInvalido = "Dato_invalido";

        public static bool Es(string resultado)
        {
            return resultado == Repetido || resultado == DatoInvalido;
        }
    }

    public class LecturaArchivo
    {
        public List<LineaArchivo> Lineas { get; set; } = new List<LineaArchivo>();
        // Solo cuando el archivo no es de la plataforma (otro archivo, formato distinto, vacío): no se importa nada.
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

        // filas: celdas como texto, la primera es el encabezado. Rechaza (Errores) solo lo que no es un archivo de
        // la plataforma; los datos mal de una fila quedan como línea con error (ResultadosArchivo).
        LecturaArchivo Leer(List<List<string>> filas);
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

        public string NumeroDesdeNombreArchivo(string nombreArchivo)
        {
            var m = NumeroEnNombre.Match(nombreArchivo ?? "");
            return m.Success ? m.Groups[1].Value : null;
        }

        private const string DondeExportarlo = "Exportalo desde Rukas: Proceso → detalle de la proforma → ícono de Excel.";

        public LecturaArchivo Leer(List<List<string>> filas)
        {
            var r = new LecturaArchivo();
            if (filas == null || filas.Count == 0)
            {
                r.Errores.Add("Este archivo no es el Excel de Rukas: está vacío. " + DondeExportarlo);
                return r;
            }

            // Sin los encabezados de Rukas no es su Excel (otro archivo, o Rukas cambió el formato): no se importa.
            var encabezado = filas[0] ?? new List<string>();
            var distintas = new List<string>();
            for (int i = 0; i < Encabezados.Length; i++)
            {
                var celda = i < encabezado.Count ? (encabezado[i] ?? "").Trim() : "";
                if (!string.Equals(celda, Encabezados[i], StringComparison.OrdinalIgnoreCase))
                    distintas.Add("\"" + Encabezados[i] + "\"");
            }
            if (distintas.Count > 0)
            {
                r.Errores.Add("Este archivo no es el Excel de Rukas: " + (distintas.Count == 1 ? "falta la columna " : "faltan las columnas ")
                    + string.Join(", ", distintas) + ". " + DondeExportarlo);
                return r;
            }

            // Los datos mal de una fila son un error de Rukas: la línea se guarda igual, marcada, para reclamarla.
            var vistos = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            for (int f = 1; f < filas.Count; f++)
            {
                var fila = filas[f] ?? new List<string>();
                Func<int, string> celda = i => i < fila.Count ? (fila[i] ?? "").Trim() : "";
                if (Enumerable.Range(0, Encabezados.Length).All(i => celda(i) == "")) continue;

                int filaExcel = f + 1;
                var referencia = celda(0);
                string resultado = null, detalle = null;
                var problemas = new List<string>();

                int filaAnterior;
                if (!Regex.IsMatch(referencia, @"^\d+$"))
                    problemas.Add(referencia == "" ? "falta el N° de transporte" : "el N° de transporte \"" + referencia + "\" no es válido");
                else if (vistos.TryGetValue(referencia, out filaAnterior))
                {
                    resultado = ResultadosArchivo.Repetido;
                    detalle = "El transporte " + referencia + " está dos veces en el Excel (filas " + filaAnterior + " y " + filaExcel + ").";
                }
                else
                    vistos[referencia] = filaExcel;

                DateTime fecha;
                DateTime? fechaLinea = null;
                if (celda(2) != "")
                {
                    if (DateTime.TryParseExact(celda(2), new[] { "dd.MM.yyyy", "d.M.yyyy", "dd/MM/yyyy", "d/M/yyyy" },
                            CultureInfo.InvariantCulture, DateTimeStyles.None, out fecha))
                        fechaLinea = fecha;
                    else
                        problemas.Add("la fecha \"" + celda(2) + "\" no es válida");
                }

                decimal importe, adicionales;
                if (!LeerImporte(celda(4), out importe))
                {
                    problemas.Add(celda(4) == "" ? "falta el importe" : "el importe \"" + celda(4) + "\" no es válido");
                    importe = 0;
                }
                if (celda(5) == "") adicionales = 0;
                else if (!LeerImporte(celda(5), out adicionales))
                {
                    problemas.Add("los adicionales \"" + celda(5) + "\" no son válidos");
                    adicionales = 0;
                }

                if (resultado == null && problemas.Count > 0)
                {
                    resultado = ResultadosArchivo.DatoInvalido;
                    detalle = "Fila " + filaExcel + " del Excel: " + string.Join(", ", problemas) + ".";
                }
                if (referencia == "") referencia = "Fila " + filaExcel;
                if (referencia.Length > 30) referencia = referencia.Substring(0, 30);
                if (detalle != null && detalle.Length > 300) detalle = detalle.Substring(0, 300);

                r.Lineas.Add(new LineaArchivo
                {
                    Orden = r.Lineas.Count + 1,
                    Referencia = referencia,
                    Fecha = fechaLinea,
                    Ruta = celda(3),
                    ImporteViaje = importe,
                    Adicionales = adicionales,
                    Resultado = resultado,
                    Detalle = detalle
                });
            }

            if (r.Lineas.Count == 0)
                r.Errores.Add("El archivo no tiene transportes. Revisá que sea el detalle de la proforma. " + DondeExportarlo);
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
