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
    
    public partial class CAMIONES
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public CAMIONES()
        {
            this.CHOFER_CAMION = new HashSet<CHOFER_CAMION>();
        }
    
        public int Camion_ID { get; set; }
        public string Dominio { get; set; }
        public string Marca { get; set; }
        public string Modelo { get; set; }
        public string AñoModelo { get; set; }
        public string Tipo { get; set; }
        public string NumMotor { get; set; }
        public string NumChasis { get; set; }
        public System.DateTime FechaCompra { get; set; }
        public System.DateTime FechaITV { get; set; }
        public string EquipoFrio { get; set; }
    
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CHOFER_CAMION> CHOFER_CAMION { get; set; }
    }
}