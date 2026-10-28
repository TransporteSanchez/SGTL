using System.Threading.Tasks;

namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public interface IWhatsAppNotifier
    {
        /// <summary>
        /// Envía una plantilla de WhatsApp. No debe lanzar: fallos se registran y se ignoran
        /// para no afectar el guardado del viaje.
        /// </summary>
        Task<WhatsAppNotifyResult> NotifyTemplateAsync(ViajeWhatsAppPayload payload, string templateName, string[] bodyParameters);
    }
}
