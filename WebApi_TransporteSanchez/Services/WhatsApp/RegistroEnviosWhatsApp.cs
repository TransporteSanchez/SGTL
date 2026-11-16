using System;
using System.IO;
namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    internal static class RegistroEnviosWhatsApp
    {
        public static void Anotar(string mensaje)
        {
            try
            {
                var carpeta = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data");
                if (!Directory.Exists(carpeta)) Directory.CreateDirectory(carpeta);
                var ruta = Path.Combine(carpeta, "whatsapp.log");
                var linea = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + mensaje + Environment.NewLine;
                File.AppendAllText(ruta, linea);
            }
            catch
            {
            }
        }
    }
}