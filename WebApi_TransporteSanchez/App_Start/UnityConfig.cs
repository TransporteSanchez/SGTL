using System;
using System.Web.Http;
using Unity;
using Microsoft.Extensions.Configuration;
using Unity.Lifetime;
using WebApi_TransporteSanchez.Controllers;

namespace WebApi_TransporteSanchez
{
    public static class UnityConfig
    {
        public static void RegisterComponents()
        {
            var container = new UnityContainer();

            // Cargar configuración desde appsettings.json
            var configuration = new ConfigurationBuilder()
                .SetBasePath(AppDomain.CurrentDomain.BaseDirectory) // Establece la base del directorio actual
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .Build();

            // Registrar IConfiguration en Unity
            container.RegisterInstance<IConfiguration>(configuration, new ContainerControlledLifetimeManager());

            // Registrar el controlador (u otros servicios que necesites)
            container.RegisterType<LoginController>();

            // Configurar el contenedor como el resolvedor de dependencias predeterminado de Web API
            GlobalConfiguration.Configuration.DependencyResolver = new Unity.WebApi.UnityDependencyResolver(container);
        }
    }
}