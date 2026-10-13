using System.Threading.Tasks;

namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public interface IWhatsAppNotifier
    {
        /// <summary>
        /// Envía plantilla de viaje asignado. No debe lanzar: fallos se registran y se ignoran
        /// para no afectar el alta del viaje.
        /// </summary>
        Task<WhatsAppNotifyResult> NotifyViajeAsignadoAsync(ViajeWhatsAppPayload payload);
    }
}
