using System.Linq;

namespace WebApi_TransporteSanchez.Services.WhatsApp
{
    public static class PhoneNumberHelper
    {
        /// <summary>
        /// Normaliza el celular del chofer al formato que usa WhatsApp Cloud API / lista de
        /// destinatarios del número de prueba de Meta (sin '+').
        ///
        /// En CHOFERES se guarda como 10 dígitos AR (cód. área sin 0 + cel. sin 15), ej. 3512490475.
        /// Meta registra/envía ese número como 54 + área + 15 + abonado, ej. 54351152490475
        /// (no como 5493512490475). Usar el formato con 9 provoca error 131030 en test number.
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
            // Ya está en formato Meta de prueba: 54 + área + 15 + abonado (ej. 54351152490475)
            if (LooksLikeArgentinaMetaAllowListFormat(digits))
                return digits;

            // Formato internacional con 9: 549 + 10 dígitos nacionales → convertir a área+15
            if (digits.StartsWith("549") && digits.Length == 13)
                return FromNationalTenDigits(digits.Substring(3));

            // 54 + 10 dígitos nacionales (sin 9 ni 15)
            if (digits.StartsWith("54") && digits.Length == 12 && !digits.Substring(2).Contains("15"))
                return FromNationalTenDigits(digits.Substring(2));

            // 10 dígitos nacionales (formato CHOFERES.TelefonoCelular)
            if (digits.Length == 10)
                return FromNationalTenDigits(digits);

            // 54 + resto desconocido: devolver tal cual
            if (digits.StartsWith("54"))
                return digits;

            if (digits.Length >= 8)
                return "54" + digits;

            return null;
        }

        /// <summary>
        /// 10 dígitos (área sin 0 + número sin 15) → 54{área}15{abonado}.
        /// Área 2 dígitos si empieza con 11 (CABA/GBA); si no, 3 dígitos (ej. 351 Córdoba).
        /// </summary>
        private static string FromNationalTenDigits(string tenDigits)
        {
            if (string.IsNullOrEmpty(tenDigits) || tenDigits.Length != 10)
                return null;

            var areaLen = tenDigits.StartsWith("11") ? 2 : 3;
            var area = tenDigits.Substring(0, areaLen);
            var subscriber = tenDigits.Substring(areaLen);
            return "54" + area + "15" + subscriber;
        }

        private static bool LooksLikeArgentinaMetaAllowListFormat(string digits)
        {
            // Ej.: 541115XXXXXXXX (14) o 5435115XXXXXXX (14)
            if (!digits.StartsWith("54") || digits.Length < 12 || digits.Length > 15)
                return false;

            var rest = digits.Substring(2);
            if (rest.StartsWith("11") && rest.Length >= 4 && rest.Substring(2, 2) == "15")
                return true;

            // área 3 + 15
            if (rest.Length >= 5 && rest.Substring(3, 2) == "15")
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
