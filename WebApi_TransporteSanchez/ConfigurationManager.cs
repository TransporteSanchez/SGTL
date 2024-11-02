using System;
using System.Configuration;

public static class ConnectionStringHelper
{
    public static string GetConnectionString(string name)
    {
        // Obtener el valor de la variable de entorno DataSource
        string dataSource = Environment.GetEnvironmentVariable("DataSource");

        // Lee la cadena de conexión del web.config
        string connectionString = ConfigurationManager.ConnectionStrings[name].ConnectionString;

        // Reemplaza {DataSource} con el valor de la variable de entorno
        return connectionString.Replace("{DataSource}", dataSource);
    }
}
