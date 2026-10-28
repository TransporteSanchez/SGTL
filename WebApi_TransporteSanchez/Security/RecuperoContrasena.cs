using System;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace WebApi_TransporteSanchez.Security
{
    public sealed class SolicitudRecupero
    {
        public string Email { get; set; }
        public string UrlLogin { get; set; }
    }

    public interface IRepositorioRecupero
    {
        SolicitudRecupero Crear(string email, string tokenHash);
        void MarcarEnviado(string tokenHash);
        void Descartar(string tokenHash);
        string Completar(string tokenHash, string nuevaContrasenaHash);
    }

    public interface ICorreoRecupero
    {
        void EnviarEnlace(string email, string enlace);
        void NotificarCambio(string email);
    }

    // El coordinador no conoce SMTP ni la base: permite probar el flujo sin servicios compartidos.
    public sealed class RecuperoContrasena
    {
        public const string MensajeSolicitud = "Si el e-mail corresponde a una cuenta habilitada, vas a recibir las instrucciones para recuperar tu contraseña.";
        public const string EnlaceInvalido = "El enlace no es válido o venció. Solicitá un nuevo recupero de contraseña.";
        private readonly IRepositorioRecupero repositorio;
        private readonly ICorreoRecupero correo;

        public RecuperoContrasena(IRepositorioRecupero repositorio, ICorreoRecupero correo)
        {
            this.repositorio = repositorio;
            this.correo = correo;
        }

        public void Solicitar(string email)
        {
            var token = NuevoToken();
            var huella = Huella(token);
            var solicitud = repositorio.Crear(NormalizarEmail(email), huella);
            if (solicitud == null) return;
            try
            {
                // El fragmento no se envía al servidor web ni queda en su registro de URLs.
                correo.EnviarEnlace(solicitud.Email, ValidarUrlLogin(solicitud.UrlLogin) + "#recupero=" + token);
                repositorio.MarcarEnviado(huella);
            }
            catch
            {
                repositorio.Descartar(huella);
                throw;
            }
        }

        public bool Restablecer(string token, string nueva, string repetida, out string mensaje)
        {
            if (!EsTokenValido(token)) { mensaje = EnlaceInvalido; return false; }
            if (!ContrasenasSeguras.CumplePolitica(nueva, out mensaje)) return false;
            if (!string.Equals(nueva, repetida, StringComparison.Ordinal))
            { mensaje = "Las contraseñas no coinciden."; return false; }
            var email = repositorio.Completar(Huella(token), ContrasenasSeguras.CrearHash(nueva));
            if (email == null) { mensaje = EnlaceInvalido; return false; }
            // Un fallo en el aviso no revierte una contraseña que ya se guardó.
            try { correo.NotificarCambio(email); }
            catch { System.Diagnostics.Trace.TraceWarning("No se pudo enviar el aviso de cambio de contraseña."); }
            mensaje = "Contraseña restablecida. Ingresá con tu contraseña nueva.";
            return true;
        }

        public static string NormalizarEmail(string valor)
        {
            valor = (valor ?? "").Trim().ToLowerInvariant();
            if (valor.Length == 0 || valor.Length > 254 || valor.IndexOfAny(new[] { '\r', '\n' }) >= 0)
                throw new ArgumentException("Escribí un e-mail válido.");
            try
            {
                var direccion = new MailAddress(valor);
                if (direccion.Address != valor || !Regex.IsMatch(valor, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
                    throw new FormatException();
            }
            catch { throw new ArgumentException("Escribí un e-mail válido."); }
            return valor;
        }

        public static string ValidarUrlLogin(string valor)
        {
            Uri uri;
            if (string.IsNullOrWhiteSpace(valor) || valor.Length > 1024 || !Uri.TryCreate(valor.Trim(), UriKind.Absolute, out uri) ||
                (uri.Scheme != Uri.UriSchemeHttps && !(uri.Scheme == Uri.UriSchemeHttp &&
                    (uri.Host == "localhost" || uri.Host == "127.0.0.1" || uri.Host == "[::1]"))) ||
                !string.IsNullOrEmpty(uri.UserInfo) || !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment) ||
                !uri.AbsolutePath.EndsWith("/Login.html", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Indicá la dirección completa del login con HTTPS. Para pruebas locales podés usar HTTP en localhost.");
            return uri.AbsoluteUri;
        }

        public static string NuevoToken()
        {
            var datos = new byte[32];
            using (var rng = RandomNumberGenerator.Create()) rng.GetBytes(datos);
            return Convert.ToBase64String(datos).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }

        public static bool EsTokenValido(string token) { return token != null && Regex.IsMatch(token, @"\A[A-Za-z0-9_-]{43}\z"); }

        public static string Huella(string texto)
        {
            using (var sha = SHA256.Create())
                return BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(texto))).Replace("-", "").ToLowerInvariant();
        }
    }
}
