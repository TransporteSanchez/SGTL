namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public class ViajeWhatsAppPayload
    {
        public string TelefonoE164 { get; set; }
        public string NombreChofer { get; set; }
        public int ViajeId { get; set; }
        public string Origen { get; set; }
        public string Destino { get; set; }
        public string FechaInicio { get; set; }
        public string RemitoOCarga { get; set; }
        public string MapsUrl { get; set; }
    }
}
