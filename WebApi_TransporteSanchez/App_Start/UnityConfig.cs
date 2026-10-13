using System;
using System.Web.Http;
using Unity;
using Microsoft.Extensions.Configuration;
using Unity.Lifetime;
using WebApi_TransporteSanchez.Controllers;
using WebApi_TransporteSanchez.Services.WhatsApp;

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

            // WhatsApp Cloud API: la configuracion se lee de WHATSAPP_CONFIG en cada envio.
            container.RegisterType<IWhatsAppNotifier, WhatsAppCloudApiNotifier>(new TransientLifetimeManager());
            container.RegisterType<ViajeWhatsAppDispatcher>(new TransientLifetimeManager());

            // Configurar el contenedor como el resolvedor de dependencias predeterminado de Web API
            GlobalConfiguration.Configuration.DependencyResolver = new Unity.WebApi.UnityDependencyResolver(container);
        }
    }
}