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
    
    public partial class LOCALIDADES
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public LOCALIDADES()
        {
            this.CHOFERES = new HashSet<CHOFERES>();
            this.DESTINO = new HashSet<DESTINO>();
            this.ORIGEN = new HashSet<ORIGEN>();
        }
    
        public int Loc_ID { get; set; }
        public string Nombre_Localidad { get; set; }
        public int ProvID { get; set; }
    
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CHOFERES> CHOFERES { get; set; }
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<DESTINO> DESTINO { get; set; }
        public virtual PROVINCIAS PROVINCIAS { get; set; }
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<ORIGEN> ORIGEN { get; set; }
    }
}
