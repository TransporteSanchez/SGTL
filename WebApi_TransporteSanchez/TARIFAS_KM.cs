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
    
    public partial class TARIFAS_KM
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public TARIFAS_KM()
        {
            this.VIAJES = new HashSet<VIAJES>();
        }
    
        public int TarifaKm_ID { get; set; }
        public System.DateTime FechaDesde { get; set; }
        public System.DateTime FechaHasta { get; set; }
        public decimal ValorKm { get; set; }
        public string MinKm { get; set; }
        public string MaxKm { get; set; }
    
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<VIAJES> VIAJES { get; set; }
    }
}