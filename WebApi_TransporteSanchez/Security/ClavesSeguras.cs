using System;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace WebApi_TransporteSanchez.Security
{
    public static class ClavesSeguras
    {
        private const string Prefijo = "PBKDF2-SHA256$";
        private const int Trabajo = 600000;

        private static readonly Lazy<string> ClaveFicticia =
            new Lazy<string>(() => Crear(Guid.NewGuid().ToString()));

        public static bool Validar(string clave, out string error)
        {
            error = null;

            if (string.IsNullOrEmpty(clave) ||
                clave.Length < 8 ||
                clave.Length > 20)
            {
                error = "La contraseña debe tener entre 8 y 20 caracteres.";
            }
            else if (!Regex.IsMatch(clave, "[a-zA-Z]") ||
                     !Regex.IsMatch(clave, "[0-9]"))
            {
                error = "La contraseña debe incluir al menos una letra y un número.";
            }

            return error == null;
        }

        public static string Crear(string clave)
        {
            if (clave == null)
            {
                throw new ArgumentNullException(nameof(clave));
            }

            var sal = new byte[16];

            using (var azar = RandomNumberGenerator.Create())
            {
                azar.GetBytes(sal);
            }

            using (var pbkdf = new Rfc2898DeriveBytes(
                clave,
                sal,
                Trabajo,
                HashAlgorithmName.SHA256))
            {
                return Prefijo +
                    Trabajo.ToString(CultureInfo.InvariantCulture) + "$" +
                    Convert.ToBase64String(sal) + "$" +
                    Convert.ToBase64String(pbkdf.GetBytes(32));
            }
        }

        public static bool Verificar(string ingresada, string guardada)
        {
            if (ingresada == null || guardada == null)
            {
                return false;
            }

            // Compatibilidad temporal con contraseñas antiguas en texto plano.
            if (!guardada.StartsWith(Prefijo, StringComparison.Ordinal))
            {
                return Igual(
                    HuellaBytes(ingresada),
                    HuellaBytes(guardada));
            }

            int trabajo;
            byte[] sal;
            byte[] esperado;

            if (!Leer(guardada, out trabajo, out sal, out esperado))
            {
                return false;
            }

            using (var pbkdf = new Rfc2898DeriveBytes(
                ingresada,
                sal,
                trabajo,
                HashAlgorithmName.SHA256))
            {
                return Igual(pbkdf.GetBytes(32), esperado);
            }
        }

        public static bool RequiereActualizar(string guardada)
        {
            int trabajo;
            byte[] sal;
            byte[] hash;

            return !Leer(guardada, out trabajo, out sal, out hash) ||
                trabajo < Trabajo;
        }

        public static void SimularVerificacion(string ingresada)
        {
            Verificar(ingresada ?? "", ClaveFicticia.Value);
        }

        public static string Huella(string valor)
        {
            return BitConverter
                .ToString(HuellaBytes(valor))
                .Replace("-", "")
                .ToLowerInvariant();
        }

        private static byte[] HuellaBytes(string valor)
        {
            using (var sha = SHA256.Create())
            {
                return sha.ComputeHash(Encoding.UTF8.GetBytes(valor));
            }
        }

        private static bool Leer(
            string valor,
            out int trabajo,
            out byte[] sal,
            out byte[] hash)
        {
            trabajo = 0;
            sal = null;
            hash = null;

            if (valor == null || valor.Length > 255)
            {
                return false;
            }

            var partes = valor.Split('$');

            if (partes.Length != 4 ||
                partes[0] != "PBKDF2-SHA256" ||
                !int.TryParse(
                    partes[1],
                    NumberStyles.None,
                    CultureInfo.InvariantCulture,
                    out trabajo) ||
                trabajo < 100000 ||
                trabajo > 2000000)
            {
                return false;
            }

            try
            {
                sal = Convert.FromBase64String(partes[2]);
                hash = Convert.FromBase64String(partes[3]);

                return sal.Length == 16 && hash.Length == 32;
            }
            catch (FormatException)
            {
                return false;
            }
        }

        private static bool Igual(byte[] a, byte[] b)
        {
            if (a.Length != b.Length)
            {
                return false;
            }

            int diferencia = 0;

            for (int i = 0; i < a.Length; i++)
            {
                diferencia |= a[i] ^ b[i];
            }

            return diferencia == 0;
        }
    }
}