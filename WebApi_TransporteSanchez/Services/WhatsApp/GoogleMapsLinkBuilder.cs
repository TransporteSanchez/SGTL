using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public static class GoogleMapsLinkBuilder
    {
        /// <summary>
        /// Deep link gratuito de direcciones (no requiere Google Maps Platform API key).
        /// </summary>
        public static string BuildDrivingDirections(string originAddress, string destinationAddress)
        {
            var origin = (originAddress ?? "").Trim();
            var destination = (destinationAddress ?? "").Trim();
            if (string.IsNullOrEmpty(origin) || string.IsNullOrEmpty(destination))
                return "";

            return "https://www.google.com/maps/dir/?api=1"
                + "&origin=" + HttpUtility.UrlEncode(origin)
                + "&destination=" + HttpUtility.UrlEncode(destination)
                + "&travelmode=driving";
        }

        /// <summary>
        /// Misma lógica que construirDireccion() en gestion-viajes.html.
        /// </summary>
        public static string BuildAddress(string calle, string alturaCalle, string localidad, string provincia)
        {
            var partes = new List<string>();
            var calleAltura = ((calle ?? "").Trim() + " " + (alturaCalle ?? "").Trim()).Trim();
            if (!string.IsNullOrEmpty(calleAltura))
                partes.Add(calleAltura);
            if (!string.IsNullOrWhiteSpace(localidad))
                partes.Add(localidad.Trim());
            if (!string.IsNullOrWhiteSpace(provincia))
                partes.Add(provincia.Trim());
            partes.Add("Argentina");
            return string.Join(", ", partes.Where(p => !string.IsNullOrWhiteSpace(p)));
        }
    }
}
