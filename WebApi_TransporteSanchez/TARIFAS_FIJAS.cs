//------------------------------------------------------------------------------
// <auto-generated>
//     Este código se generó a partir de una plantilla.
//
//     Los cambios manuales en este archivo pueden causar un comportamiento inesperado de la aplicación.
//     Los cambios manuales en este archivo se sobrescribirán si se regenera el código.
// </auto-generated>
//------------------------------------------------------------------------------

namespace WebApi_TransporteSanchez
{
    using System;
    using System.Collections.Generic;
    
    public partial class TARIFAS_FIJAS
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public TARIFAS_FIJAS()
        {
            this.VIAJES = new HashSet<VIAJES>();
        }
    
        public int TarifaFija_ID { get; set; }
        public System.DateTime FechaDesde { get; set; }
        public System.DateTime FechaHasta { get; set; }
        public decimal ValorRuta { get; set; }
        public decimal ValorVueltaVacio { get; set; }
        public decimal ValorFijoNeto { get; set; }
        public int ClienteID { get; set; }
        public int OrigenID { get; set; }
        public int DestinoID { get; set; }
    
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<VIAJES> VIAJES { get; set; }
    }
}
