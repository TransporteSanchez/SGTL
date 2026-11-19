using System;
using System.Collections.Generic;
using System.Linq;

namespace WebApi_TransporteSanchez.Security
{
    // Los contadores pertenecen a este proceso de la aplicación.
    // Con varias instancias se necesita un contador compartido.
    internal static class LimitesAcceso
    {
        private sealed class Ventana
        {
            internal DateTime Hasta;
            internal int Intentos;
        }

        private static readonly object Candado = new object();

        private static readonly Dictionary<string, Ventana> Datos =
            new Dictionary<string, Ventana>();

        internal static bool Permitir(
            string clave,
            int maximo,
            int minutos = 15)
        {
            lock (Candado)
            {
                var ahora = DateTime.UtcNow;

                // Retirar contadores vencidos cuando aumenta la cantidad.
                if (Datos.Count >= 2000)
                {
                    var vencidas = Datos
                        .Where(x => x.Value.Hasta <= ahora)
                        .Select(x => x.Key)
                        .ToArray();

                    foreach (var vencida in vencidas)
                    {
                        Datos.Remove(vencida);
                    }
                }

                Ventana ventana;

                if (!Datos.TryGetValue(clave, out ventana) ||
                    ventana.Hasta <= ahora)
                {
                    // Evitar que el diccionario crezca sin límite.
                    if (Datos.Count >= 10000)
                    {
                        return false;
                    }

                    ventana = new Ventana
                    {
                        Hasta = ahora.AddMinutes(minutos)
                    };

                    Datos[clave] = ventana;
                }

                if (ventana.Intentos >= maximo)
                {
                    return false;
                }

                ventana.Intentos++;

                return true;
            }
        }
    }
}