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
    
    public partial class GRUPOS_USUARIOS
    {
        public int GrupoUsu_ID { get; set; }
        public int GrupoID { get; set; }
        public int UsuarioID { get; set; }
    
        public virtual USUARIOS USUARIOS { get; set; }
        public virtual GRUPOS GRUPOS { get; set; }
    }
}