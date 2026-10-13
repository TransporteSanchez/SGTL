using System;
using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public class WhatsAppCloudApiNotifier : IWhatsAppNotifier
    {
        private static readonly HttpClient HttpClient = CreateClient();

        private static HttpClient CreateClient()
        {
            var client = new HttpClient();
            client.Timeout = TimeSpan.FromSeconds(30);
            return client;
        }

        public async Task<WhatsAppNotifyResult> NotifyViajeAsignadoAsync(ViajeWhatsAppPayload payload)
        {
            if (payload == null)
                return WhatsAppNotifyResult.Fail("invalid_payload", "Payload nulo.");

            // Siempre leer BD/Web.config al enviar (configurable en runtime).
            var settings = WhatsAppSettings.Load();

            if (!settings.IsConfigured())
            {
                var msg = "Envío omitido (deshabilitado o sin configurar).";
                Trace.TraceInformation("WhatsApp: {0} Viaje {1}", msg, payload.ViajeId);
                WhatsAppFileLogger.Write("viaje=" + payload.ViajeId + " " + msg);
                return WhatsAppNotifyResult.Fail("not_configured", msg);
            }

            if (!PhoneNumberHelper.IsValidE164(payload.TelefonoE164))
            {
                var msg = "Teléfono inválido: '" + payload.TelefonoE164 + "'";
                Trace.TraceWarning("WhatsApp: {0} viaje {1}", msg, payload.ViajeId);
                WhatsAppFileLogger.Write("viaje=" + payload.ViajeId + " " + msg);
                return WhatsAppNotifyResult.Fail("invalid_phone", msg, payload.TelefonoE164);
            }

            try
            {
                var url = string.Format(
                    "https://graph.facebook.com/{0}/{1}/messages",
                    settings.ApiVersion,
                    settings.PhoneNumberId);

                var body = new
                {
                    messaging_product = "whatsapp",
                    to = payload.TelefonoE164,
                    type = "template",
                    template = new
                    {
                        name = settings.TemplateName,
                        language = new { code = settings.TemplateLanguage },
                        components = new object[]
                        {
                            new
                            {
                                type = "body",
                                parameters = new object[]
                                {
                                    TextParam(payload.NombreChofer),
                                    TextParam(payload.ViajeId.ToString()),
                                    TextParam(payload.Origen),
                                    TextParam(payload.Destino),
                                    TextParam(payload.FechaInicio),
                                    TextParam(payload.RemitoOCarga),
                                    TextParam(payload.MapsUrl)
                                }
                            }
                        }
                    }
                };

                var json = JsonConvert.SerializeObject(body);
                using (var request = new HttpRequestMessage(HttpMethod.Post, url))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.AccessToken);
                    request.Content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await HttpClient.SendAsync(request).ConfigureAwait(false);
                    var responseBody = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                    if (!response.IsSuccessStatusCode)
                    {
                        var detail = ExtractMetaError(responseBody);
                        var msg = string.Format(
                            "HTTP {0} enviando viaje {1} a {2}: {3}",
                            (int)response.StatusCode,
                            payload.ViajeId,
                            payload.TelefonoE164,
                            detail);
                        Trace.TraceError("WhatsApp: {0}", msg);
                        WhatsAppFileLogger.Write(msg);
                        return WhatsAppNotifyResult.Fail("api_error", detail, payload.TelefonoE164);
                    }

                    var okMsg = string.Format("viaje {0} notificado a {1}", payload.ViajeId, payload.TelefonoE164);
                    Trace.TraceInformation("WhatsApp: {0}", okMsg);
                    WhatsAppFileLogger.Write("OK " + okMsg);
                    return WhatsAppNotifyResult.Ok(payload.TelefonoE164);
                }
            }
            catch (Exception ex)
            {
                var msg = "Excepción enviando viaje " + payload.ViajeId + ": " + ex.Message;
                Trace.TraceError("WhatsApp: {0}", msg);
                WhatsAppFileLogger.Write(msg);
                return WhatsAppNotifyResult.Fail("exception", ex.Message, payload.TelefonoE164);
            }
        }

        private static object TextParam(string text)
        {
            var value = string.IsNullOrWhiteSpace(text) ? "-" : text.Trim();
            value = value.Replace("\r", " ").Replace("\n", " ").Replace("\t", " ");
            if (value.Length > 1024)
                value = value.Substring(0, 1024);
            return new { type = "text", text = value };
        }

        private static string ExtractMetaError(string responseBody)
        {
            if (string.IsNullOrWhiteSpace(responseBody))
                return "(sin detalle)";

            try
            {
                var jo = JObject.Parse(responseBody);
                var err = jo["error"];
                if (err == null)
                    return Truncate(responseBody, 400);

                var code = err["code"]?.ToString();
                var message = err["message"]?.ToString();
                var details = err["error_data"]?["details"]?.ToString();
                var parts = new[] { code, message, details };
                return string.Join(" | ", Array.FindAll(parts, p => !string.IsNullOrWhiteSpace(p)));
            }
            catch
            {
                return Truncate(responseBody, 400);
            }
        }

        private static string Truncate(string value, int max)
        {
            if (string.IsNullOrEmpty(value) || value.Length <= max) return value;
            return value.Substring(0, max) + "...";
        }
    }
}
