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
    
    public partial class VIAJES
    {
        public int Viaje_ID { get; set; }
        public int OrigenID { get; set; }
        public int DestinoID { get; set; }
        public string Distancia_KM { get; set; }
        public string Num_Remito { get; set; }
        public string Num_de_Carga { get; set; }
        public System.DateTime Fecha_Inicio { get; set; }
        public System.DateTime Fecha_Fin { get; set; }
        public int ChofCamID { get; set; }
        public int TarifaFijaID { get; set; }
        public int TarifaKmID { get; set; }
        public int ClienteID { get; set; }
    
        public virtual CHOFER_CAMION CHOFER_CAMION { get; set; }
        public virtual CLIENTES CLIENTES { get; set; }
        public virtual DESTINO DESTINO { get; set; }
        public virtual ORIGEN ORIGEN { get; set; }
        public virtual TARIFAS_FIJAS TARIFAS_FIJAS { get; set; }
        public virtual TARIFAS_KM TARIFAS_KM { get; set; }
    }
}
