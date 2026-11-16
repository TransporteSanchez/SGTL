using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public sealed class WhatsAppCloudApiNotifier
    {
        private static readonly HttpClient Cliente = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        public Task<WhatsAppNotifyResult> NotifyTemplateAsync(string telefono, int viajeId, string plantilla, string idioma, string[] parametros)
        {
            return Enviar(telefono, viajeId, plantilla, idioma, parametros);
        }
        private async Task<WhatsAppNotifyResult> Enviar(string telefono, int viajeId, string plantilla, string idioma, string[] parametros)
        {
            var config = ConfiguracionEnvioWhatsApp.Leer();
            plantilla = (plantilla ?? "").Trim();
            if (!config.ListaParaEnviar || plantilla.Length == 0)
            {
                Anotar(viajeId, "omitido: la configuración no está lista o falta la plantilla.");
                return WhatsAppNotifyResult.Fallo("not_configured", "La integración de WhatsApp no está configurada.", telefono);
            }
            if (!TelefonosWhatsApp.EsValido(telefono))
            {
                Anotar(viajeId, "teléfono inválido: " + (telefono ?? ""));
                return WhatsAppNotifyResult.Fallo("invalid_phone", "El teléfono del chofer no sirve para WhatsApp.", telefono);
            }
            try
            {
                var url = "https://graph.facebook.com/" + config.ApiVersion.Trim().Trim('/') + "/" + config.PhoneNumberId.Trim() + "/messages";
                var cuerpo = new
                {
                    messaging_product = "whatsapp",
                    to = telefono,
                    type = "template",
                    template = new
                    {
                        name = plantilla,
                        language = new { code = string.IsNullOrWhiteSpace(idioma) ? config.TemplateLanguage : idioma.Trim() },
                        components = new object[]
                        {
                            new { type = "body", parameters = (parametros ?? new string[0]).Select(Texto).ToArray() }
                        }
                    }
                };
                using (var pedido = new HttpRequestMessage(HttpMethod.Post, url))
                {
                    pedido.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.AccessToken.Trim());
                    pedido.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(cuerpo), Encoding.UTF8, "application/json");
                    var respuesta = await Cliente.SendAsync(pedido).ConfigureAwait(false);
                    var texto = await respuesta.Content.ReadAsStringAsync().ConfigureAwait(false);
                    if (!respuesta.IsSuccessStatusCode)
                    {
                        var detalle = Detalle(texto);
                        Anotar(viajeId, "HTTP " + (int)respuesta.StatusCode + " plantilla " + plantilla + " a " + telefono + ": " + detalle);
                        return WhatsAppNotifyResult.Fallo("api_error", detalle, telefono);
                    }
                    Anotar(viajeId, "OK plantilla " + plantilla + " a " + telefono);
                    return WhatsAppNotifyResult.Ok(telefono);
                }
            }
            catch (Exception ex)
            {
                Anotar(viajeId, "no se pudo enviar la plantilla " + plantilla + ": " + ex.Message);
                return WhatsAppNotifyResult.Fallo("exception", "No se pudo enviar el WhatsApp.", telefono);
            }
        }
        private static void Anotar(int viajeId, string mensaje)
        {
            RegistroEnviosWhatsApp.Anotar("viaje=" + viajeId.ToString() + " " + mensaje);
        }
        private static object Texto(string valor)
        {
            var texto = string.IsNullOrWhiteSpace(valor) ? "-" : valor.Trim();
            texto = texto.Replace("\r", " ").Replace("\n", " ").Replace("\t", " ");
            if (texto.Length > 1024) texto = texto.Substring(0, 1024);
            return new { type = "text", text = texto };
        }
        private static string Detalle(string cuerpo)
        {
            if (string.IsNullOrWhiteSpace(cuerpo)) return "Meta no devolvió detalle.";
            try
            {
                var error = JObject.Parse(cuerpo)["error"];
                if (error == null) return Recortar(cuerpo);
                var partes = new[]
                {
                    error["code"] == null ? null : error["code"].ToString(),
                    error["message"] == null ? null : error["message"].ToString(),
                    error["error_data"] == null || error["error_data"]["details"] == null ? null : error["error_data"]["details"].ToString()
                };
                var texto = string.Join(" | ", partes.Where(p => !string.IsNullOrWhiteSpace(p)));
                return texto.Length == 0 ? Recortar(cuerpo) : texto;
            }
            catch
            {
                return Recortar(cuerpo);
            }
        }
        private static string Recortar(string valor)
        {
            if (string.IsNullOrEmpty(valor) || valor.Length <= 400) return valor;
            return valor.Substring(0, 400) + "...";
        }
    }
    public sealed class WhatsAppNotifyResult
    {
        public bool Sent { get; set; }
        public string Status { get; set; }
        public string Detail { get; set; }
        public string To { get; set; }
        public static WhatsAppNotifyResult Ok(string telefono)
        {
            return new WhatsAppNotifyResult
            {
                Sent = true,
                Status = "sent",
                Detail = "Mensaje aceptado por WhatsApp.",
                To = telefono
            };
        }
        public static WhatsAppNotifyResult Fallo(string estado, string detalle, string telefono)
        {
            return new WhatsAppNotifyResult
            {
                Sent = false,
                Status = estado,
                Detail = detalle,
                To = telefono
            };
        }
    }
}