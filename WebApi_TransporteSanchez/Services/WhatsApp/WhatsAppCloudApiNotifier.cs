using System;
using System.Diagnostics;
using System.Linq;
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

        public Task<WhatsAppNotifyResult> NotifyTemplateAsync(ViajeWhatsAppPayload payload, string templateName, string[] bodyParameters)
        {
            return EnviarAsync(payload, templateName, bodyParameters);
        }

        private async Task<WhatsAppNotifyResult> EnviarAsync(ViajeWhatsAppPayload payload, string templateName, string[] bodyParameters)
        {
            if (payload == null)
                return WhatsAppNotifyResult.Fail("invalid_payload", "Payload nulo.");

            var settings = WhatsAppSettings.Load();
            var plantilla = (templateName ?? "").Trim();

            if (!settings.IsConfiguredBase() || string.IsNullOrWhiteSpace(plantilla))
            {
                var msg = "Envío omitido (deshabilitado, sin configurar o sin plantilla).";
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

                var parametros = (bodyParameters ?? new string[0])
                    .Select(TextParam)
                    .Cast<object>()
                    .ToArray();

                var body = new
                {
                    messaging_product = "whatsapp",
                    to = payload.TelefonoE164,
                    type = "template",
                    template = new
                    {
                        name = plantilla,
                        language = new { code = settings.TemplateLanguage },
                        components = new object[]
                        {
                            new
                            {
                                type = "body",
                                parameters = parametros
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
                            "HTTP {0} plantilla {1} viaje {2} a {3}: {4}",
                            (int)response.StatusCode,
                            plantilla,
                            payload.ViajeId,
                            payload.TelefonoE164,
                            detail);
                        Trace.TraceError("WhatsApp: {0}", msg);
                        WhatsAppFileLogger.Write(msg);
                        return WhatsAppNotifyResult.Fail("api_error", detail, payload.TelefonoE164);
                    }

                    var okMsg = string.Format("viaje {0} plantilla {1} notificado a {2}", payload.ViajeId, plantilla, payload.TelefonoE164);
                    Trace.TraceInformation("WhatsApp: {0}", okMsg);
                    WhatsAppFileLogger.Write("OK " + okMsg);
                    return WhatsAppNotifyResult.Ok(payload.TelefonoE164);
                }
            }
            catch (Exception ex)
            {
                var msg = "Excepción enviando viaje " + payload.ViajeId + " (" + plantilla + "): " + ex.Message;
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
