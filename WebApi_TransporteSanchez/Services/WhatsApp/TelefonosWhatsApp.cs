using System;
using System.Collections.Generic;
using System.Linq;
namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public static class TelefonosWhatsApp
    {
        private static readonly HashSet<string> AreasDeCuatro = new HashSet<string>(StringComparer.Ordinal)
        {
            "2202", "2221", "2223", "2224", "2225", "2226", "2227", "2229",
            "2241", "2242", "2243", "2244", "2245", "2246",
            "2252", "2254", "2255", "2257",
            "2261", "2262", "2264", "2265", "2266", "2267", "2268",
            "2271", "2272", "2273", "2274",
            "2281", "2283", "2284", "2285", "2286",
            "2291", "2292", "2296", "2297",
            "2302", "2314", "2316", "2317", "2320", "2323", "2324", "2325", "2326",
            "2331", "2333", "2334", "2335", "2336", "2337", "2338",
            "2342", "2343", "2344", "2345", "2346",
            "2352", "2353", "2354", "2355", "2356", "2357", "2358",
            "2362", "2364", "2366", "2368",
            "2371", "2372", "2373", "2374", "2375", "2378",
            "2392", "2393", "2394", "2395", "2396",
            "2647", "2651", "2655", "2656", "2657", "2658",
            "2801", "2901", "2902", "2903", "2920", "2921", "2922", "2923", "2924", "2925", "2926", "2927", "2928", "2929",
            "2931", "2932", "2933", "2934", "2935", "2936", "2940", "2942", "2945", "2946", "2948",
            "2952", "2953", "2954", "2962", "2963", "2964", "2966", "2972", "2982", "2983",
            "3327", "3329", "3382", "3385", "3387", "3388",
            "3401", "3402", "3404", "3405", "3406", "3407", "3408", "3409",
            "3435", "3436", "3437", "3438", "3442", "3444", "3445", "3446", "3447",
            "3454", "3455", "3456", "3458",
            "3460", "3462", "3463", "3464", "3465", "3466", "3467", "3468", "3469",
            "3471", "3472", "3476",
            "3482", "3483", "3487", "3489",
            "3491", "3492", "3493", "3496", "3497", "3498",
            "3521", "3522", "3524", "3525",
            "3532", "3533", "3534", "3535", "3537",
            "3541", "3542", "3543", "3544", "3546", "3547", "3548", "3549",
            "3562", "3563", "3564",
            "3571", "3572", "3573", "3574", "3575", "3576",
            "3582", "3583", "3584", "3585",
            "2622", "2624", "2625", "2626", "2627",
            "3751", "3754", "3755", "3756", "3757", "3758",
            "2941", "2944", "2947", "2971", "2973", "2974", "2975", "2976",
            "3821", "3825", "3826", "3827",
            "3832", "3835", "3837", "3838",
            "3841", "3843", "3844", "3845", "3846",
            "3854", "3855", "3856", "3857", "3858",
            "3861", "3862", "3863", "3865", "3867", "3868", "3869",
            "3873", "3876", "3877", "3878",
            "3885", "3886", "3887", "3888",
            "3891", "3892", "3894"
        };
        public static string ParaEnvio(string telefono, string codigoPais = "54")
        {
            if (string.IsNullOrWhiteSpace(telefono)) return null;
            var digitos = new string(telefono.Where(char.IsDigit).ToArray());
            if (digitos.Length == 0) return null;
            if (codigoPais != "54")
                return digitos.StartsWith(codigoPais, StringComparison.Ordinal) ? digitos : codigoPais + digitos;
            return Argentina(digitos);
        }
        public static bool EsValido(string telefono)
        {
            return !string.IsNullOrEmpty(telefono)
                && telefono.Length >= 10
                && telefono.Length <= 15
                && telefono.All(char.IsDigit);
        }
        private static string Argentina(string digitos)
        {
            if (YaEstaParaMeta(digitos)) return digitos;
            if (digitos.StartsWith("549", StringComparison.Ordinal) && digitos.Length == 13)
                return DesdeDiez(digitos.Substring(3));
            if (digitos.StartsWith("54", StringComparison.Ordinal) && digitos.Length == 12 && !YaTieneQuince(digitos.Substring(2)))
                return DesdeDiez(digitos.Substring(2));
            if (digitos.Length == 10) return DesdeDiez(digitos);
            if (digitos.StartsWith("54", StringComparison.Ordinal)) return digitos;
            if (digitos.Length >= 8) return "54" + digitos;
            return null;
        }
        private static string DesdeDiez(string diez)
        {
            if (diez == null || diez.Length != 10) return null;
            int largoArea = LargoArea(diez);
            return "54" + diez.Substring(0, largoArea) + "15" + diez.Substring(largoArea);
        }
        private static int LargoArea(string diez)
        {
            if (diez.StartsWith("11", StringComparison.Ordinal)) return 2;
            if (AreasDeCuatro.Contains(diez.Substring(0, 4))) return 4;
            return 3;
        }
        private static bool YaEstaParaMeta(string digitos)
        {
            if (!digitos.StartsWith("54", StringComparison.Ordinal) || digitos.Length != 14) return false;
            return YaTieneQuince(digitos.Substring(2));
        }
        private static bool YaTieneQuince(string nacional)
        {
            if (string.IsNullOrEmpty(nacional) || nacional.Length < 5) return false;
            if (nacional.StartsWith("11", StringComparison.Ordinal) && nacional.Length >= 4 && nacional.Substring(2, 2) == "15")
                return true;
            if (nacional.Length >= 6 && AreasDeCuatro.Contains(nacional.Substring(0, 4)) && nacional.Substring(4, 2) == "15")
                return true;
            return nacional.Length >= 5 && nacional.Substring(3, 2) == "15";
        }
    }
}