using System;
using System.Net;
using System.Text;
using System.Web;
using System.Web.Security;
using MailKit.Security;
using MimeKit;

namespace WebApi_TransporteSanchez.Security
{
    public sealed class CorreoRecupero : ICorreoRecupero
    {
        public void EnviarEnlace(string email, string enlace)
        {
            Enviar(email, "Recuperar contraseña", "<p>Recibimos una solicitud para recuperar tu contraseña.</p>" +
                "<p><a href=\"" + HttpUtility.HtmlAttributeEncode(enlace) + "\">Restablecer contraseña</a></p>" +
                "<p>El enlace vence en 20 minutos y se puede usar una sola vez.</p>" +
                "<p>Si no lo solicitaste, podés ignorar este e-mail. Tu contraseña sigue siendo la misma.</p>");
        }

        public void NotificarCambio(string email)
        {
            Enviar(email, "Contraseña restablecida", "<p>Tu contraseña se restableció y se cerraron las sesiones anteriores.</p>" +
                "<p>Si no hiciste este cambio, comunicate con el área que administra tus accesos.</p>");
        }

        private static void Enviar(string email, string asunto, string cuerpo)
        {
            using (var cn = RepositorioRecuperoSql.Conexion())
            {
                cn.Open();
                using (var cmd = RepositorioRecuperoSql.Comando(cn, null, @"SELECT e.SmtpHost,e.SmtpPort,
e.CredentialFromMailAddres,e.CredentialFromMailPassProtegida,e.NombreRemitente,e.[Name],e.SecureSocketOption,e.UsaSsl,e.UsaTLS12
FROM dbo.CONFIGURACION_EMAIL_MODULO m JOIN dbo.EmailServidor e ON e.[Service]=m.[Service]
WHERE m.Modulo='RECUPERO_CONTRASENA' AND NOT EXISTS
(SELECT 1 FROM dbo.CONFIGURACION_EMAIL_MODULO otro WHERE otro.[Service]=m.[Service] AND otro.Modulo<>m.Modulo)"))
                using (var r = cmd.ExecuteReader())
                {
                    if (!r.Read()) throw new InvalidOperationException("Sin perfil de recupero.");
                    var secreto = MachineKey.Unprotect(Convert.FromBase64String(r.GetString(3)), "SGTL", "EmailServidor", "SMTP-password", "v1");
                    if (secreto == null) throw new InvalidOperationException("Sin credenciales de recupero.");
                    var seguridad = r.IsDBNull(6) ? (r.IsDBNull(7) || r.GetBoolean(7) ? SecureSocketOptions.StartTls : SecureSocketOptions.None) : (SecureSocketOptions)Convert.ToInt16(r[6]);
                    if (seguridad != SecureSocketOptions.StartTls && seguridad != SecureSocketOptions.SslOnConnect)
                        throw new InvalidOperationException("El recupero requiere una conexión SMTP segura.");
                    if (!r.IsDBNull(8) && r.GetBoolean(8)) ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
                    var mensaje = new MimeMessage();
                    mensaje.From.Add(new MailboxAddress(r.IsDBNull(4) ? r.GetString(5) : r.GetString(4), r.GetString(2)));
                    mensaje.To.Add(MailboxAddress.Parse(email));
                    mensaje.Subject = asunto;
                    mensaje.Body = new TextPart("html") { Text = cuerpo };
                    using (var smtp = new MailKit.Net.Smtp.SmtpClient())
                    {
                        smtp.Timeout = 15000;
                        smtp.Connect(r.GetString(0), Convert.ToInt32(r[1]), seguridad);
                        smtp.Authenticate(r.GetString(2), Encoding.UTF8.GetString(secreto));
                        smtp.Send(mensaje);
                        // El servidor ya aceptó el mensaje: fallar al cerrar no debe invalidar el enlace enviado.
                        try { smtp.Disconnect(true); } catch { }
                    }
                }
            }
        }
    }
}
