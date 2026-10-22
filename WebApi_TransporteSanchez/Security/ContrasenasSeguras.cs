using System;
using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace WebApi_TransporteSanchez.Security
{
    public static class ContrasenasSeguras
    {
        private const string Algoritmo = "PBKDF2-SHA256";
        private const int Iteraciones = 600000;
        private const int LongitudSal = 16;
        private const int LongitudHash = 32;

        public static string CrearHash(string contrasena)
        {
            if (contrasena == null) throw new ArgumentNullException("contrasena");

            var sal = new byte[LongitudSal];
            using (var generador = RandomNumberGenerator.Create())
            {
                generador.GetBytes(sal);
            }

            var hash = DerivarHash(contrasena, sal, Iteraciones, LongitudHash);
            return string.Join("$", Algoritmo, Iteraciones.ToString(), Convert.ToBase64String(sal), Convert.ToBase64String(hash));
        }

        public static bool Verificar(string contrasena, string valorGuardado)
        {
            if (contrasena == null || valorGuardado == null) return false;

            int iteraciones;
            byte[] sal;
            byte[] hashEsperado;
            if (!IntentarLeerHash(valorGuardado, out iteraciones, out sal, out hashEsperado))
            {
                if (valorGuardado.StartsWith(Algoritmo + "$", StringComparison.Ordinal)) return false;
                return CompararTextoTiempoConstante(contrasena, valorGuardado);
            }

            var hashCalculado = DerivarHash(contrasena, sal, iteraciones, hashEsperado.Length);
            return CompararBytesTiempoConstante(hashCalculado, hashEsperado);
        }

        public static bool EsHashVigente(string valorGuardado)
        {
            int iteraciones;
            byte[] sal;
            byte[] hash;
            return IntentarLeerHash(valorGuardado, out iteraciones, out sal, out hash);
        }

        public static bool CumplePolitica(string contrasena, out string mensaje)
        {
            if (string.IsNullOrEmpty(contrasena))
            {
                mensaje = "La contraseña es obligatoria.";
                return false;
            }

            if (contrasena.Length < 8 || contrasena.Length > 20)
            {
                mensaje = "La contraseña debe tener entre 8 y 20 caracteres.";
                return false;
            }

            if (!Regex.IsMatch(contrasena, "[a-zA-Z]") || !Regex.IsMatch(contrasena, "[0-9]"))
            {
                mensaje = "La contraseña debe incluir al menos una letra y un número.";
                return false;
            }

            mensaje = null;
            return true;
        }

        private static byte[] DerivarHash(string contrasena, byte[] sal, int iteraciones, int longitudHash)
        {
            using (var derivador = new Rfc2898DeriveBytes(contrasena, sal, iteraciones, HashAlgorithmName.SHA256))
            {
                return derivador.GetBytes(longitudHash);
            }
        }

        private static bool IntentarLeerHash(string valorGuardado, out int iteraciones, out byte[] sal, out byte[] hash)
        {
            iteraciones = 0;
            sal = null;
            hash = null;

            if (string.IsNullOrWhiteSpace(valorGuardado)) return false;

            var partes = valorGuardado.Split('$');
            if (partes.Length != 4 || !string.Equals(partes[0], Algoritmo, StringComparison.Ordinal) ||
                !int.TryParse(partes[1], out iteraciones) || iteraciones < Iteraciones)
                return false;

            try
            {
                sal = Convert.FromBase64String(partes[2]);
                hash = Convert.FromBase64String(partes[3]);
                return sal.Length == LongitudSal && hash.Length == LongitudHash;
            }
            catch (FormatException)
            {
                sal = null;
                hash = null;
                return false;
            }
        }

        private static bool CompararTextoTiempoConstante(string primerValor, string segundoValor)
        {
            var primero = System.Text.Encoding.UTF8.GetBytes(primerValor);
            var segundo = System.Text.Encoding.UTF8.GetBytes(segundoValor);
            return CompararBytesTiempoConstante(primero, segundo);
        }

        private static bool CompararBytesTiempoConstante(byte[] primero, byte[] segundo)
        {
            if (primero == null || segundo == null) return false;

            var diferencia = primero.Length ^ segundo.Length;
            var longitud = Math.Min(primero.Length, segundo.Length);
            for (var indice = 0; indice < longitud; indice++)
            {
                diferencia |= primero[indice] ^ segundo[indice];
            }

            return diferencia == 0;
        }
    }
}
