using System;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;

namespace WebApi_TransporteSanchez.Viajes
{
    // Gastos del viaje (control interno, §37 de PENDIENTES): quién los carga y cuándo (Rocío, 27/10, punto 33 de la §41).
    //   - El chofer, desde su hoja de ruta: desde que inicia el viaje y hasta 2 días después de registrar la entrega. Los de
    //     plataforma (Rukas) no se inician en el sistema: desde el día del viaje hasta 2 días después del fin.
    //   - Administración (quien gestiona viajes), desde Ver detalle del viaje, como excepción: con el viaje entregado o
    //     listo para facturar (lo que el chofer no llegó a rendir).
    //   - Nadie en un viaje facturado.
    // Los gastos no van a la factura: solo cambian el margen que se ve en Ver detalle. Los motivos son los de §1.4 del
    // design system ("No se puede cargar el gasto: …"); la pantalla los muestra igual (hoja-de-ruta.js, costos-viaje.js).
    public static class GastosDelViaje
    {
        public const int DiasParaRendir = 2;
        public static readonly string[] Tipos = { "Combustible", "Peaje", "Comida", "Otro" };
        public static readonly string[] TiposComprobante = { "image/jpeg", "image/png", "image/webp", "application/pdf" };
        public const int MaxBytesComprobante = 5 * 1024 * 1024;

        private const string Registrado = "Registrado", EnViaje = "En_viaje", Entregado = "Entregado",
            ListoParaFacturar = "Listo_para_facturar", Facturado = "Facturado";

        public class Datos
        {
            public string Tipo { get; set; }
            public decimal? Importe { get; set; }
            public decimal? Litros { get; set; }
            public DateTime? Fecha { get; set; }
            public string Detalle { get; set; }
            public string Nombre_Archivo { get; set; }
            public string Content_Type { get; set; }
            public string ContenidoBase64 { get; set; }
        }

        // accion: "cargar" o "eliminar". null si el chofer puede; si no, el motivo.
        public static string MotivoChofer(string accion, string estado, bool conPlataforma, DateTime inicio, DateTime fin,
            DateTime? entrega, DateTime hoy)
        {
            string no = "No se puede " + accion + " el gasto: ";
            string rendir = " Si te falta rendir algo, es necesario que se lo pases a administración.";
            estado = string.IsNullOrEmpty(estado) ? Registrado : estado;
            hoy = hoy.Date;
            if (estado == Facturado) return no + "el viaje ya está facturado.";
            if (conPlataforma)
            {
                if (inicio.Date > hoy) return no + "el viaje todavía no empezó.";
                if (hoy > fin.Date.AddDays(DiasParaRendir)) return no + "pasaron más de " + DiasParaRendir + " días del viaje." + rendir;
                return null;
            }
            if (estado == Registrado) return no + "el viaje todavía no se inició.";
            if (estado == Entregado)
            {
                var desde = (entrega ?? fin).Date;
                if (hoy > desde.AddDays(DiasParaRendir)) return no + "pasaron más de " + DiasParaRendir + " días de la entrega." + rendir;
                return null;
            }
            if (estado == EnViaje) return null;
            return no + "el viaje está " + EstadoEnTexto(estado) + "." + rendir;
        }

        // null si administración puede; si no, el motivo.
        public static string MotivoAdministracion(string accion, string estado)
        {
            string no = "No se puede " + accion + " el gasto: ";
            if (estado == Entregado || estado == ListoParaFacturar) return null;
            if (estado == Facturado) return no + "el viaje ya está facturado.";
            return no + "el viaje todavía no se entregó (mientras está en viaje los carga el chofer).";
        }

        private static string EstadoEnTexto(string estado)
        {
            switch (estado)
            {
                case EnViaje: return "en viaje";
                case Entregado: return "entregado";
                case ListoParaFacturar: return "listo para facturar";
                case Facturado: return "facturado";
                default: return (estado ?? "").Replace('_', ' ').ToLowerInvariant();
            }
        }

        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }

        private static string Recortar(string s, int max)
        {
            s = (s ?? "").Trim();
            return s.Length > max ? s.Substring(0, max) : s;
        }

        // Valida y guarda un gasto con su ticket (las mismas reglas para el chofer y para administración). Devuelve el
        // error para mostrar, o null si se guardó.
        public static string Guardar(DbContext db, int viajeId, DateTime inicioViaje, DateTime hoy, Datos body, string usuario, string cn)
        {
            hoy = hoy.Date;
            var tipo = body == null ? "" : (body.Tipo ?? "").Trim();
            if (Array.IndexOf(Tipos, tipo) < 0) return "Seleccioná el tipo de gasto.";
            if (!body.Importe.HasValue || body.Importe <= 0 || body.Importe > 100000000) return "Completá el importe.";
            var esCombustible = tipo == "Combustible";
            if (esCombustible && (!body.Litros.HasValue || body.Litros <= 0 || body.Litros > 5000)) return "Completá los litros que cargaste.";
            if (!body.Fecha.HasValue) return "Completá la fecha del gasto.";
            var fecha = body.Fecha.Value.Date;
            if (fecha > hoy) return "La fecha del gasto no puede ser posterior a hoy.";
            if (fecha < inicioViaje.Date.AddDays(-1)) return "La fecha del gasto no puede ser anterior al viaje.";

            var contentType = (body.Content_Type ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(body.ContenidoBase64)) return "Elegí la foto o el PDF del ticket.";
            if (Array.IndexOf(TiposComprobante, contentType) < 0) return "El ticket tiene que ser una foto (JPG, PNG o WEBP) o un PDF.";
            byte[] archivo;
            try
            {
                var b64 = body.ContenidoBase64;
                var coma = b64.IndexOf(',');
                if (b64.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && coma >= 0) b64 = b64.Substring(coma + 1);
                archivo = Convert.FromBase64String(b64);
            }
            catch (FormatException)
            {
                return "El archivo del ticket no es válido.";
            }
            if (archivo.Length == 0 || archivo.Length > MaxBytesComprobante) return "El ticket puede pesar como máximo 5 MB.";
            var nombre = (body.Nombre_Archivo ?? "").Trim();
            nombre = nombre.Substring(nombre.LastIndexOfAny(new[] { '/', '\\' }) + 1);
            foreach (var c in System.IO.Path.GetInvalidFileNameChars()) nombre = nombre.Replace(c, '_');
            if (nombre.Length == 0) nombre = "ticket";
            if (nombre.Length > 260) nombre = nombre.Substring(nombre.Length - 260);
            var detalle = (body.Detalle ?? "").Trim();
            if (detalle.Length > 200) detalle = detalle.Substring(0, 200);
            var u50 = Recortar(usuario, 50);

            var gastoId = db.Database.SqlQuery<int>(
                "INSERT INTO dbo.VIAJE_GASTOS (Viaje_ID, Tipo, Fecha, Importe, Litros, Detalle, Nombre_Archivo, Content_Type, Archivo, Fecha_Alta, Usu_Alta) " +
                "OUTPUT INSERTED.Gasto_ID " +
                "VALUES (@viaje, @tipo, @fecha, @importe, @litros, @detalle, @nombre, @ct, @archivo, " +
                "CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime), @usu)",
                P("@viaje", viajeId), P("@tipo", tipo), P("@fecha", fecha), P("@importe", decimal.Round(body.Importe.Value, 2)),
                P("@litros", esCombustible ? (object)decimal.Round(body.Litros.Value, 2) : null),
                P("@detalle", detalle.Length == 0 ? null : detalle), P("@nombre", nombre), P("@ct", contentType),
                new SqlParameter("@archivo", System.Data.SqlDbType.VarBinary, -1) { Value = archivo }, P("@usu", u50)).First();

            SGTLAuditContext.RegistrarEvento(cn, Recortar(usuario, 20), "INSERT", "VIAJE_GASTOS", "Gasto_ID=" + gastoId,
                "Viaje #" + viajeId + ": " + tipo + " " + decimal.Round(body.Importe.Value, 2).ToString("0.00", CultureInfo.InvariantCulture)
                + (esCombustible ? " (" + decimal.Round(body.Litros.Value, 2).ToString("0.##", CultureInfo.InvariantCulture) + " l)" : "")
                + ", ticket " + nombre);
            return null;
        }
    }
}
