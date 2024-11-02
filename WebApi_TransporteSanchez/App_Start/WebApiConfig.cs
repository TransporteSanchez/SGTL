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
            cors.SupportsCredentials = true;

            config.EnableCors(cors);

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
