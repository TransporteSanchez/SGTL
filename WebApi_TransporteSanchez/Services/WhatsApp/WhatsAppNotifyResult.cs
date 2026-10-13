namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public class WhatsAppNotifyResult
    {
        public bool Sent { get; set; }
        public string Status { get; set; }
        public string Detail { get; set; }
        public string To { get; set; }

        public static WhatsAppNotifyResult Ok(string to)
        {
            return new WhatsAppNotifyResult
            {
                Sent = true,
                Status = "sent",
                Detail = "Mensaje aceptado por WhatsApp Cloud API.",
                To = to
            };
        }

        public static WhatsAppNotifyResult Fail(string status, string detail, string to = null)
        {
            return new WhatsAppNotifyResult
            {
                Sent = false,
                Status = status,
                Detail = detail,
                To = to
            };
        }
    }
}
