namespace WebApi_TransporteSanchez.Controllers
{
    public class ORIGENController : UbicacionesController<ORIGEN>
    {
        protected override string CampoId
        {
            get { return "Origen_ID"; }
        }

        protected override int IdDe(ORIGEN origen)
        {
            return origen.Origen_ID;
        }
    }
}
