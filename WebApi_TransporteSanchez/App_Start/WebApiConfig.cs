using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using System.Web.Http.Cors;

namespace WebApi_TransporteSanchez
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Configuración y servicios de API web

            var cors = new EnableCorsAttribute("*", "*", "GET,POST,PUT,DELETE");


            config.EnableCors(cors);
            config.MessageHandlers.Add(new Security.SesionesRecuperoHandler());

            // Un error 500 no devuelve el detalle técnico (excepción, SQL, rutas del servidor), tampoco a las llamadas desde
            // la misma máquina: la pantalla muestra su propio mensaje (§9 del design system; reporte de la VM del 28/10, F4).
            config.IncludeErrorDetailPolicy = IncludeErrorDetailPolicy.Never;

            // Rutas de API web
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );


            config.Formatters.JsonFormatter.SupportedMediaTypes.
               Add(new System.Net.Http.Headers.MediaTypeHeaderValue("text/html"));
        }
    }
}
