using System;

namespace WebApi_TransporteSanchez
{
    public interface IUbicacion
    {
        string Descripcion { get; set; }
        int ProvID { get; set; }
        int LocID { get; set; }
        string Calle { get; set; }
        string AlturaCalle { get; set; }
        int ClienteID { get; set; }
        DateTime Fecha_Alta { get; set; }
        string Usu_Alta { get; set; }
        DateTime Fecha_Modi { get; set; }
        string Usu_Modi { get; set; }
        PROVINCIAS PROVINCIAS { get; set; }
        LOCALIDADES LOCALIDADES { get; set; }
    }

    public partial class ORIGEN : IUbicacion { }

    public partial class DESTINO : IUbicacion { }
}
