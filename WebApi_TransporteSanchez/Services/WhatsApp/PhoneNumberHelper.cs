using System;
using System.Collections.Generic;
using System.Linq;

namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public static class PhoneNumberHelper
    {
        /// <summary>
        /// Indicativos interurbanos de 4 dígitos (ENACOM): abonado de 6 dígitos.
        /// Se usa match más largo para no confundir p.ej. 2202 con 220, o 3541 con 354.
        /// </summary>
        private static readonly HashSet<string> FourDigitAreaCodes = new HashSet<string>(StringComparer.Ordinal)
        {
            // Buenos Aires / AMBA extendido
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
            // Catamarca / Chaco / Chubut / Corrientes / Entre Ríos / Formosa / Jujuy / La Pampa / La Rioja
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
            // Córdoba y alrededores (incl. 3541 Villa Dolores / Traslasierra)
            "3521", "3522", "3524", "3525",
            "3532", "3533", "3534", "3535", "3537",
            "3541", "3542", "3543", "3544", "3546", "3547", "3548", "3549",
            "3562", "3563", "3564",
            "3571", "3572", "3573", "3574", "3575", "3576",
            "3582", "3583", "3584", "3585",
            // Mendoza / Misiones / Neuquén / Río Negro / Salta / San Juan / San Luis / Santa Cruz / Santa Fe / Santiago / Tierra del Fuego / Tucumán
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

        /// <summary>
        /// Normaliza el celular del chofer al formato que usa WhatsApp Cloud API / lista de
        /// destinatarios del número de prueba de Meta (sin '+').
        ///
        /// En CHOFERES se guarda como 10 dígitos AR (cód. área sin 0 + cel. sin 15),
        /// ej. 3512490475 (área 3) o 3541570360 (área 4).
        /// Meta registra/envía ese número como 54 + área + 15 + abonado,
        /// ej. 54351152490475 o 54354115570360.
        /// </summary>
        public static string ToE164(string rawPhone, string defaultCountryCode = "54")
        {
            if (string.IsNullOrWhiteSpace(rawPhone))
                return null;

            var digits = new string(rawPhone.Where(char.IsDigit).ToArray());
            if (string.IsNullOrEmpty(digits))
                return null;

            if (defaultCountryCode == "54")
                return ToWhatsAppArgentina(digits);

            if (!digits.StartsWith(defaultCountryCode))
                return defaultCountryCode + digits;

            return digits;
        }

        private static string ToWhatsAppArgentina(string digits)
        {
            // Ya está en formato Meta de prueba: 54 + área + 15 + abonado
            if (LooksLikeArgentinaMetaAllowListFormat(digits))
                return digits;

            // Formato internacional con 9: 549 + 10 dígitos nacionales → convertir a área+15
            if (digits.StartsWith("549") && digits.Length == 13)
                return FromNationalTenDigits(digits.Substring(3));

            // 54 + 10 dígitos nacionales (sin 9 ni 15)
            if (digits.StartsWith("54") && digits.Length == 12 && !ContainsInsertedMobileFifteen(digits.Substring(2)))
                return FromNationalTenDigits(digits.Substring(2));

            // 10 dígitos nacionales (formato CHOFERES.TelefonoCelular)
            if (digits.Length == 10)
                return FromNationalTenDigits(digits);

            if (digits.StartsWith("54"))
                return digits;

            if (digits.Length >= 8)
                return "54" + digits;

            return null;
        }

        /// <summary>
        /// 10 dígitos (área sin 0 + número sin 15) → 54{área}15{abonado}.
        /// Área: 2 (11), 4 (listado ENACOM) o 3 (resto, ej. 351).
        /// </summary>
        private static string FromNationalTenDigits(string tenDigits)
        {
            if (string.IsNullOrEmpty(tenDigits) || tenDigits.Length != 10)
                return null;

            var areaLen = GetAreaCodeLength(tenDigits);
            var area = tenDigits.Substring(0, areaLen);
            var subscriber = tenDigits.Substring(areaLen);
            return "54" + area + "15" + subscriber;
        }

        private static int GetAreaCodeLength(string tenDigits)
        {
            if (tenDigits.StartsWith("11", StringComparison.Ordinal))
                return 2;

            // Match más largo: 4 dígitos antes que 3 (2202 vs 220, 3541 vs 354).
            if (tenDigits.Length >= 4 && FourDigitAreaCodes.Contains(tenDigits.Substring(0, 4)))
                return 4;

            return 3;
        }

        private static bool LooksLikeArgentinaMetaAllowListFormat(string digits)
        {
            // Siempre 14 dígitos: 54 + área + 15 + abonado (12 = 10 nacionales + "15")
            if (!digits.StartsWith("54", StringComparison.Ordinal) || digits.Length != 14)
                return false;

            var rest = digits.Substring(2); // 12 dígitos

            if (rest.StartsWith("11", StringComparison.Ordinal) && rest.Substring(2, 2) == "15")
                return true;

            if (FourDigitAreaCodes.Contains(rest.Substring(0, 4)) && rest.Substring(4, 2) == "15")
                return true;

            if (rest.Substring(3, 2) == "15")
                return true;

            return false;
        }

        /// <summary>
        /// True si el bloque nacional (sin 54) ya tiene el 15 móvil insertado tras el área.
        /// </summary>
        private static bool ContainsInsertedMobileFifteen(string nationalWithoutCountry)
        {
            if (string.IsNullOrEmpty(nationalWithoutCountry) || nationalWithoutCountry.Length < 5)
                return false;

            if (nationalWithoutCountry.StartsWith("11", StringComparison.Ordinal)
                && nationalWithoutCountry.Length >= 4
                && nationalWithoutCountry.Substring(2, 2) == "15")
                return true;

            if (nationalWithoutCountry.Length >= 6
                && FourDigitAreaCodes.Contains(nationalWithoutCountry.Substring(0, 4))
                && nationalWithoutCountry.Substring(4, 2) == "15")
                return true;

            if (nationalWithoutCountry.Length >= 5 && nationalWithoutCountry.Substring(3, 2) == "15")
                return true;

            return false;
        }

        public static bool IsValidE164(string e164)
        {
            return !string.IsNullOrEmpty(e164)
                && e164.Length >= 10
                && e164.Length <= 15
                && e164.All(char.IsDigit);
        }
    }
}
