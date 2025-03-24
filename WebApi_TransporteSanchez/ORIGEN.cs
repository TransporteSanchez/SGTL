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
    
    public partial class ORIGEN
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public ORIGEN()
        {
            this.VIAJES = new HashSet<VIAJES>();
        }
    
        public int Origen_ID { get; set; }
        public string Descripcion { get; set; }
        public int ProvID { get; set; }
        public int LocID { get; set; }
        public string Calle { get; set; }
        public string AlturaCalle { get; set; }
        public int ClienteID { get; set; }
        public System.DateTime Fecha_Alta { get; set; }
        public string Usu_Alta { get; set; }
        public System.DateTime Fecha_Modi { get; set; }
        public string Usu_Modi { get; set; }

        public virtual CLIENTES CLIENTES { get; set; }
        public virtual LOCALIDADES LOCALIDADES { get; set; }
        public virtual PROVINCIAS PROVINCIAS { get; set; }
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<VIAJES> VIAJES { get; set; }
    }
}
