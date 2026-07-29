//------------------------------------------------------------------------------
//  Entidad de detalle de proforma (líneas de concepto).
//  Requiere haber ejecutado 05_modelo_Proformas.sql (tabla PROFORMA_DETALLE).
//------------------------------------------------------------------------------
namespace WebApi_TransporteSanchez
{
    using System;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    [Table("PROFORMA_DETALLE")]
    public partial class PROFORMA_DETALLE
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Detalle_ID { get; set; }

        public int Proforma_ID { get; set; }
        public Nullable<int> Orden { get; set; }
        public string Codigo { get; set; }
        public string Concepto { get; set; }
        public string Descripcion { get; set; }
        public Nullable<decimal> Cantidad { get; set; }
        public string Unidad { get; set; }
        public Nullable<decimal> PrecioUnitario { get; set; }
        public Nullable<decimal> DescuentoPct { get; set; }
        public Nullable<decimal> IvaPct { get; set; }
        public Nullable<decimal> Subtotal { get; set; }
    }
}