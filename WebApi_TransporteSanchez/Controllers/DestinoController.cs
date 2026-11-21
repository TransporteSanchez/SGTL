namespace WebApi_TransporteSanchez.Controllers
{
    public class DESTINOController : UbicacionesController<DESTINO>
    {
        protected override string CampoId
        {
            get { return "Destino_ID"; }
        }

        protected override int IdDe(DESTINO destino)
        {
            return destino.Destino_ID;
        }
    }
}
