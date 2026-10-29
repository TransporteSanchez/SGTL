using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace WebApi_TransporteSanchez.Security
{
    // Los permisos de Tableros son independientes de los permisos operativos de cada módulo.
    public static class PermisosTableros
    {
        private static readonly string[] Temas = { "viajes", "flota", "choferes", "facturacion" };
        private static readonly string[] Menus =
        {
            "Tableros de viajes", "Tableros de flota", "Tableros de choferes", "Tableros de facturación"
        };
        private static readonly Dictionary<string, string[]> TablerosPorTema = new Dictionary<string, string[]>
        {
            { "viajes", new[] { "kpiviajes", "kpientregados", "kpipendientes", "kpirechazo", "revisar", "proximos",
                "viajesmes", "clientesmes", "recorridos", "rechazos", "ultimos", "comparativa", "calendario" } },
            { "flota", new[] { "camiones", "kpikm", "itv", "kmmes", "kmcamion", "kmcamionmes", "ingresoscamionmes" } },
            { "choferes", new[] { "choferes", "kmchofer" } },
            { "facturacion", new[] { "costo", "topclientes", "deudavencida", "facturacionmes", "deudaantiguedad" } }
        };

        public static bool EsPermisoAnterior(string nombre)
        {
            return Iguales(nombre, "Tableros");
        }

        private static bool Iguales(string a, string b)
        {
            return CultureInfo.InvariantCulture.CompareInfo.Compare((a ?? "").Trim(), (b ?? "").Trim(),
                CompareOptions.IgnoreCase | CompareOptions.IgnoreNonSpace) == 0;
        }

        public static string[] TemasPara(bool esAdmin, bool esChofer, IEnumerable<string> menus)
        {
            if (esAdmin) return Temas.ToArray();
            if (esChofer) return new string[0];
            var permisos = (menus ?? Enumerable.Empty<string>()).ToArray();
            return Temas.Where((tema, i) => permisos.Any(menu => Iguales(menu, Menus[i]))).ToArray();
        }

        public static string TemaDeTablero(string tablero)
        {
            return Temas.FirstOrDefault(tema => TablerosPorTema[tema].Contains(tablero));
        }

        public static string[] TablerosPara(IEnumerable<string> temas)
        {
            var permitidos = new HashSet<string>(temas ?? Enumerable.Empty<string>());
            return Temas.Where(permitidos.Contains).SelectMany(tema => TablerosPorTema[tema]).ToArray();
        }
    }
}
