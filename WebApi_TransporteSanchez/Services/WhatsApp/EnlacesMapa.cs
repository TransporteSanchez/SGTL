using System.Collections.Generic;
using System.Linq;
using System.Web;
namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public static class EnlacesMapa
    {
        public static string Direccion(string calle, string altura, string localidad, string provincia)
        {
            var partes = new List<string>();
            var calleAltura = ((calle ?? "").Trim() + " " + (altura ?? "").Trim()).Trim();
            if (calleAltura.Length > 0) partes.Add(calleAltura);
            if (!string.IsNullOrWhiteSpace(localidad)) partes.Add(localidad.Trim());
            if (!string.IsNullOrWhiteSpace(provincia)) partes.Add(provincia.Trim());
            partes.Add("Argentina");
            return string.Join(", ", partes);
        }
        public static string Recorrido(string origen, string destino)
        {
            origen = (origen ?? "").Trim();
            destino = (destino ?? "").Trim();
            if (origen.Length == 0 || destino.Length == 0) return "";
            return "https://www.google.com/maps/dir/?api=1"
                + "&origin=" + HttpUtility.UrlEncode(origen)
                + "&destination=" + HttpUtility.UrlEncode(destino)
                + "&travelmode=driving";
        }
    }
}