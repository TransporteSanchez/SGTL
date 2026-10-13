using System;
using System.IO;

namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    internal static class WhatsAppFileLogger
    {
        public static void Write(string message)
        {
            try
            {
                var dir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data");
                if (!Directory.Exists(dir))
                    Directory.CreateDirectory(dir);

                var path = Path.Combine(dir, "whatsapp.log");
                var line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + message + Environment.NewLine;
                File.AppendAllText(path, line);
            }
            catch
            {
                // No interrumpir el flujo por logging.
            }
        }
    }
}
