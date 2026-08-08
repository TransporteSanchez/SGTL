//------------------------------------------------------------------------------
//  Extensión de la entidad PROFORMAS (Fase 1 del módulo Proformas).
//  Agrega los campos nuevos sin tocar el archivo generado PROFORMAS.cs.
//  Requiere haber ejecutado 05_modelo_Proformas.sql (columnas en la tabla).
//------------------------------------------------------------------------------
namespace WebApi_TransporteSanchez
{
    using System;

    public partial class PROFORMAS
    {
        // Identificación / estado
        public string Numero { get; set; }
        public string Estado { get; set; }
        public Nullable<System.DateTime> FechaEmision { get; set; }
        public Nullable<System.DateTime> FechaVencimiento { get; set; }
        public string Moneda { get; set; }
        public string Sucursal { get; set; }

        // Snapshot de cliente
        public string Cli_RazonSocial { get; set; }
        public string Cli_NombreComercial { get; set; }
        public string Cli_CUIT { get; set; }
        public string Cli_CondIVA { get; set; }
        public string Cli_Direccion { get; set; }
        public string Cli_Ciudad { get; set; }
        public string Cli_Provincia { get; set; }
        public string Cli_CP { get; set; }
        public string Cli_Telefono { get; set; }
        public string Cli_Email { get; set; }
        public string Cli_Contacto { get; set; }

        // Bloque transporte
        public string TipoServicio { get; set; }
        public string Origen { get; set; }
        public string Destino { get; set; }
        public Nullable<System.DateTime> FechaCarga { get; set; }
        public Nullable<System.DateTime> FechaEntrega { get; set; }
        public string TipoCarga { get; set; }
        public string Peso { get; set; }
        public string Volumen { get; set; }
        public string Bultos { get; set; }
        public string VehiculoRequerido { get; set; }
        public string ObsLogisticas { get; set; }

        // Condiciones comerciales
        public string FormaPago { get; set; }
        public string PlazoPago { get; set; }
        public string Validez { get; set; }
        public string TiempoServicio { get; set; }
        public string ObsComerciales { get; set; }
        public string CondParticulares { get; set; }

        // Observaciones
        public string Observaciones { get; set; }

        // Totales
        public Nullable<decimal> Subtotal { get; set; }
        public Nullable<decimal> Descuentos { get; set; }
        public Nullable<decimal> SubtotalNeto { get; set; }
        public Nullable<decimal> IVA { get; set; }
        public Nullable<decimal> OtrosImpuestos { get; set; }
        public Nullable<decimal> TotalGeneral { get; set; }

        // Auditoría básica
        public string Usu_Alta { get; set; }
        public Nullable<System.DateTime> Fecha_Alta { get; set; }
        public string Usu_Modi { get; set; }
        public Nullable<System.DateTime> Fecha_Modi { get; set; }
    }
}