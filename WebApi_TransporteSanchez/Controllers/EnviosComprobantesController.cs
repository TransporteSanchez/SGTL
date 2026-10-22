using MailKit.Security;
using Microsoft.IdentityModel.Tokens;
using MimeKit;
using MimeKit.Utils;
using System;
using System.Data;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Http;
using System.Web.Security;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/comprobantes")]
    public class EnviosComprobantesController : ApiController
    {
        private const string ModuloFacturacion = "FACTURACION";
        private const int MaximoBytesPdf = 10 * 1024 * 1024;
        private static readonly string[] PasswordPurpose = { "SGTL", "EmailServidor", "SMTP-password", "v1" };

        public class EnviarComprobanteRequest
        {
            public string Destinatario { get; set; }
            public string PdfBase64 { get; set; }
        }

        private class UsuarioSesion
        {
            public int UsuarioID { get; set; }
            public string NombreUsuario { get; set; }
        }

        private class ComprobanteCorreo
        {
            public int ComprobanteID { get; set; }
            public string Tipo { get; set; }
            public string Numero { get; set; }
            public string Estado { get; set; }
            public string Cliente { get; set; }
            public string EmailCliente { get; set; }
            public DateTime FechaEmision { get; set; }
        }

        private class PerfilSmtp
        {
            public short EmailServidorID { get; set; }
            public short Service { get; set; }
            public string SmtpHost { get; set; }
            public int? SmtpPort { get; set; }
            public bool? UsaSsl { get; set; }
            public short? SecureSocketOption { get; set; }
            public bool? UsaTLS12 { get; set; }
            public string Remitente { get; set; }
            public string NombreRemitente { get; set; }
            public string NombrePerfil { get; set; }
            public string Asunto { get; set; }
            public string CuerpoHtml { get; set; }
            public string PasswordProtegida { get; set; }
        }

        private class AccesoException : Exception
        {
            public HttpStatusCode StatusCode { get; private set; }

            public AccesoException(HttpStatusCode statusCode, string message) : base(message)
            {
                StatusCode = statusCode;
            }
        }

        [HttpGet]
        [Route("{id:int}/email")]
        public IHttpActionResult PrepararEnvio(int id)
        {
            if (id <= 0) return BadRequest("El comprobante no es válido.");

            try
            {
                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    var comprobante = LeerComprobante(connection, id);
                    if (comprobante == null) return NotFound();

                    ValidarAcceso(connection, PermisoEnvio(comprobante.Tipo));
                    if (!string.Equals(comprobante.Estado, "EMITIDO", StringComparison.OrdinalIgnoreCase))
                        return BadRequest("Solo se pueden enviar comprobantes emitidos.");

                    var perfil = LeerPerfilFacturacion(connection);
                    return Ok(new
                    {
                        DestinatarioSugerido = comprobante.EmailCliente,
                        Configurado = perfil != null,
                        Service = perfil == null ? (short?)null : perfil.Service,
                        Perfil = perfil == null ? null : perfil.NombrePerfil,
                        Remitente = perfil == null ? null : perfil.Remitente
                    });
                }
            }
            catch (AccesoException ex)
            {
                return Content(ex.StatusCode, new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudo preparar el envío del comprobante." });
            }
        }

        [HttpPost]
        [Route("{id:int}/email")]
        public IHttpActionResult Enviar(int id, [FromBody] EnviarComprobanteRequest request)
        {
            if (id <= 0) return BadRequest("El comprobante no es válido.");
            if (request == null) return BadRequest("Faltan los datos del envío.");

            string destinatario = (request.Destinatario ?? string.Empty).Trim();
            if (!EsEmailValido(destinatario)) return BadRequest("Indicá una dirección de destino válida.");

            byte[] pdf;
            try
            {
                pdf = DecodificarPdf(request.PdfBase64);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }

            try
            {
                ComprobanteCorreo comprobante;
                PerfilSmtp perfil;
                UsuarioSesion usuario;

                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    comprobante = LeerComprobante(connection, id);
                    if (comprobante == null) return NotFound();

                    usuario = ValidarAcceso(connection, PermisoEnvio(comprobante.Tipo));
                    if (!string.Equals(comprobante.Estado, "EMITIDO", StringComparison.OrdinalIgnoreCase))
                        return BadRequest("Solo se pueden enviar comprobantes emitidos.");

                    perfil = LeerPerfilFacturacion(connection);
                    if (perfil == null)
                        return BadRequest("Facturación no tiene un perfil SMTP asignado. Asignalo en Configuración > Gestionar e-mail.");

                    ValidarPerfil(perfil);
                }

                string password = DesprotegerSecreto(perfil.PasswordProtegida);
                if (string.IsNullOrWhiteSpace(password))
                    return BadRequest("No se pudo leer la contraseña del perfil SMTP. Volvé a guardarla en Configuración > Gestionar e-mail.");

                string asunto = LimpiarCabecera(AplicarPlantilla(
                    string.IsNullOrWhiteSpace(perfil.Asunto) ? "Comprobante {{NUMERO_COMPROBANTE}}" : perfil.Asunto,
                    comprobante, false));
                string nombreAdjunto = NombreAdjunto(comprobante);
                string hashAdjunto = CalcularSha256(pdf);
                long historialId;

                using (var connection = new SqlConnection(SqlConnectionString()))
                {
                    connection.Open();
                    historialId = RegistrarIntentoPendiente(connection, comprobante, perfil, destinatario,
                        asunto, nombreAdjunto, hashAdjunto, usuario.UsuarioID);
                }

                try
                {
                    string messageId = EnviarPorSmtp(perfil, password, comprobante, destinatario, asunto,
                        nombreAdjunto, pdf);
                    ActualizarHistorial(historialId, "ENVIADO", messageId, null);
                    RegistrarAuditoria(usuario.NombreUsuario, "EMAIL_SEND", comprobante.ComprobanteID,
                        "Comprobante " + comprobante.Numero + " enviado a " + destinatario +
                        " mediante Service=" + perfil.Service + ".");
                    return Ok(new
                    {
                        mensaje = "Comprobante enviado a " + destinatario + ".",
                        HistorialEnvioID = historialId,
                        Service = perfil.Service
                    });
                }
                catch (Exception ex)
                {
                    ActualizarHistorial(historialId, "ERROR", null, DetalleError(ex));
                    RegistrarAuditoria(usuario.NombreUsuario, "EMAIL_ERROR", comprobante.ComprobanteID,
                        "No se pudo enviar " + comprobante.Numero + " mediante Service=" + perfil.Service + ".");
                    return Content(HttpStatusCode.BadGateway, new
                    {
                        error = "No se pudo conectar, autenticar o enviar el comprobante. Verificá el perfil SMTP asignado a facturación."
                    });
                }
            }
            catch (AccesoException ex)
            {
                return Content(ex.StatusCode, new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch
            {
                return Content(HttpStatusCode.InternalServerError,
                    new { error = "No se pudo iniciar el envío del comprobante." });
            }
        }

        private static string SqlConnectionString()
        {
            var entity = new EntityConnectionStringBuilder(
                ConnectionStringHelper.GetConnectionString("SGTLEntities"));
            return entity.ProviderConnectionString;
        }

        private static SqlParameter P(string name, object value)
        {
            return new SqlParameter(name, value ?? DBNull.Value);
        }

        private string ObtenerNombreUsuarioToken()
        {
            var authorization = Request == null ? null : Request.Headers.Authorization;
            if (authorization == null || !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(authorization.Parameter))
                throw new AccesoException(HttpStatusCode.Unauthorized, "Iniciá sesión para continuar.");

            try
            {
                SecurityToken validatedToken;
                var principal = new JwtSecurityTokenHandler().ValidateToken(authorization.Parameter,
                    new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                        ValidateIssuer = true,
                        ValidIssuer = JwtConfig.Issuer,
                        ValidateAudience = true,
                        ValidAudience = JwtConfig.Audience,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromMinutes(1)
                    }, out validatedToken);
                var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
                if (claim == null || string.IsNullOrWhiteSpace(claim.Value))
                    throw new SecurityTokenException("La sesión no es válida. Volvé a iniciar sesión.");
                return claim.Value;
            }
            catch
            {
                throw new AccesoException(HttpStatusCode.Unauthorized, "Tu sesión venció. Volvé a iniciar sesión.");
            }
        }

        private UsuarioSesion ValidarAcceso(SqlConnection connection, string permiso)
        {
            string nombreUsuario = ObtenerNombreUsuarioToken();
            const string sql = @"
SELECT TOP (1) u.Usuario_ID,
       CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(u.Rol,''))))='admin' OR EXISTS (
           SELECT 1 FROM dbo.GRUPOS_USUARIOS gu
           JOIN dbo.GRUPOS_PERMISOS gp ON gp.GrupoID=gu.GrupoID
           JOIN dbo.PERMISOS p ON p.Permiso_ID=gp.PermisoID
           WHERE gu.UsuarioID=u.Usuario_ID AND p.Codigo=@permiso) THEN 1 ELSE 0 END AS Autorizado
FROM dbo.USUARIOS u
WHERE u.Nombre_Usuario=@usuario AND u.EstadoUsuario='Activo';";
            using (var command = new SqlCommand(sql, connection))
            {
                command.Parameters.Add(P("@usuario", nombreUsuario));
                command.Parameters.Add(P("@permiso", permiso));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read())
                        throw new AccesoException(HttpStatusCode.Unauthorized, "El usuario no existe o está inactivo.");
                    if (reader.GetInt32(1) != 1)
                        throw new AccesoException(HttpStatusCode.Forbidden, "No tenés permiso para enviar este comprobante.");
                    return new UsuarioSesion { UsuarioID = reader.GetInt32(0), NombreUsuario = nombreUsuario };
                }
            }
        }

        private static ComprobanteCorreo LeerComprobante(SqlConnection connection, int comprobanteId)
        {
            const string sql = @"
SELECT c.Comprobante_ID,c.Tipo,
       c.Tipo+'-'+RIGHT('00000000'+CONVERT(varchar(8),c.NumeroCorrelativo),8) AS Numero,
       c.Estado,c.FechaEmision,c.RazonSocial AS Cliente,cl.Email AS EmailCliente
FROM dbo.COMPROBANTES c
INNER JOIN dbo.CLIENTES cl ON cl.Cliente_ID=c.ClienteID
WHERE c.Comprobante_ID=@id;";
            using (var command = new SqlCommand(sql, connection))
            {
                command.Parameters.Add(P("@id", comprobanteId));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) return null;
                    return new ComprobanteCorreo
                    {
                        ComprobanteID = (int)reader["Comprobante_ID"],
                        Tipo = (string)reader["Tipo"],
                        Numero = (string)reader["Numero"],
                        Estado = (string)reader["Estado"],
                        FechaEmision = (DateTime)reader["FechaEmision"],
                        Cliente = reader["Cliente"] as string,
                        EmailCliente = reader["EmailCliente"] as string
                    };
                }
            }
        }

        private static PerfilSmtp LeerPerfilFacturacion(SqlConnection connection)
        {
            const string sql = @"
SELECT e.Es_id AS EmailServidorID,e.[Service],e.SmtpHost,e.SmtpPort,e.UsaSsl,e.SecureSocketOption,
       e.UsaTLS12,e.CredentialFromMailAddres AS Remitente,e.NombreRemitente,e.[Name] AS NombrePerfil,
       e.Asunto,e.CuerpoHtml,e.CredentialFromMailPassProtegida AS PasswordProtegida
FROM dbo.CONFIGURACION_EMAIL_MODULO m
INNER JOIN dbo.EmailServidor e ON e.[Service]=m.[Service]
WHERE m.Modulo=@modulo;";
            using (var command = new SqlCommand(sql, connection))
            {
                command.Parameters.Add(P("@modulo", ModuloFacturacion));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) return null;
                    return new PerfilSmtp
                    {
                        EmailServidorID = (short)reader["EmailServidorID"],
                        Service = (short)reader["Service"],
                        SmtpHost = reader["SmtpHost"] as string,
                        SmtpPort = reader["SmtpPort"] == DBNull.Value ? (int?)null : (int)reader["SmtpPort"],
                        UsaSsl = reader["UsaSsl"] == DBNull.Value ? (bool?)null : (bool)reader["UsaSsl"],
                        SecureSocketOption = reader["SecureSocketOption"] == DBNull.Value ? (short?)null : (short)reader["SecureSocketOption"],
                        UsaTLS12 = reader["UsaTLS12"] == DBNull.Value ? (bool?)null : (bool)reader["UsaTLS12"],
                        Remitente = reader["Remitente"] as string,
                        NombreRemitente = reader["NombreRemitente"] as string,
                        NombrePerfil = reader["NombrePerfil"] as string,
                        Asunto = reader["Asunto"] as string,
                        CuerpoHtml = reader["CuerpoHtml"] as string,
                        PasswordProtegida = reader["PasswordProtegida"] as string
                    };
                }
            }
        }

        private static long RegistrarIntentoPendiente(SqlConnection connection, ComprobanteCorreo comprobante,
            PerfilSmtp perfil, string destinatario, string asunto, string nombreAdjunto, string hashAdjunto, int usuarioId)
        {
            using (var transaction = connection.BeginTransaction(IsolationLevel.Serializable))
            {
                try
                {
                    int intento;
                    using (var command = new SqlCommand(@"
SELECT ISNULL(MAX(Intento),0)+1
FROM dbo.HISTORIAL_ENVIOS_COMPROBANTES WITH (UPDLOCK,HOLDLOCK)
WHERE ComprobanteID=@comprobante;", connection, transaction))
                    {
                        command.Parameters.Add(P("@comprobante", comprobante.ComprobanteID));
                        intento = Convert.ToInt32(command.ExecuteScalar());
                    }

                    using (var command = new SqlCommand(@"
INSERT dbo.HISTORIAL_ENVIOS_COMPROBANTES
 (ComprobanteID,EmailServidorID,Service,Remitente,Destinatario,Asunto,Estado,Intento,
  NombreAdjunto,AdjuntoSHA256,UsuarioID)
OUTPUT INSERTED.HistorialEnvio_ID
VALUES
 (@comprobante,@servidor,@service,@remitente,@destinatario,@asunto,'PENDIENTE',@intento,
  @adjunto,@hash,@usuario);", connection, transaction))
                    {
                        command.Parameters.AddRange(new[]
                        {
                            P("@comprobante", comprobante.ComprobanteID), P("@servidor", perfil.EmailServidorID),
                            P("@service", perfil.Service), P("@remitente", perfil.Remitente),
                            P("@destinatario", destinatario), P("@asunto", asunto), P("@intento", intento),
                            P("@adjunto", nombreAdjunto), P("@hash", hashAdjunto), P("@usuario", usuarioId)
                        });
                        long historialId = Convert.ToInt64(command.ExecuteScalar());
                        transaction.Commit();
                        return historialId;
                    }
                }
                catch
                {
                    if (transaction.Connection != null) transaction.Rollback();
                    throw;
                }
            }
        }

        private static void ActualizarHistorial(long historialId, string estado, string messageId, string detalleError)
        {
            using (var connection = new SqlConnection(SqlConnectionString()))
            {
                connection.Open();
                using (var command = new SqlCommand(@"
UPDATE dbo.HISTORIAL_ENVIOS_COMPROBANTES
SET Estado=@estado, MessageIdProveedor=@messageId, DetalleError=@error
WHERE HistorialEnvio_ID=@id;", connection))
                {
                    command.Parameters.AddRange(new[]
                    {
                        P("@estado", estado), P("@messageId", messageId), P("@error", detalleError), P("@id", historialId)
                    });
                    command.ExecuteNonQuery();
                }
            }
        }

        private static string EnviarPorSmtp(PerfilSmtp perfil, string password, ComprobanteCorreo comprobante,
            string destinatario, string asunto, string nombreAdjunto, byte[] pdf)
        {
            if (perfil.UsaTLS12 == true)
                ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;

            var mensaje = new MimeMessage();
            mensaje.From.Add(new MailboxAddress(
                string.IsNullOrWhiteSpace(perfil.NombreRemitente) ? perfil.NombrePerfil : perfil.NombreRemitente,
                perfil.Remitente));
            mensaje.To.Add(MailboxAddress.Parse(destinatario));
            mensaje.Subject = asunto;
            mensaje.MessageId = MimeUtils.GenerateMessageId();

            var cuerpo = new BodyBuilder
            {
                HtmlBody = AplicarPlantilla(
                    string.IsNullOrWhiteSpace(perfil.CuerpoHtml)
                        ? "<p>Hola {{CLIENTE}},</p><p>Adjuntamos el comprobante {{NUMERO_COMPROBANTE}}.</p>"
                        : perfil.CuerpoHtml,
                    comprobante, true)
            };
            cuerpo.Attachments.Add(nombreAdjunto, pdf, new ContentType("application", "pdf"));
            mensaje.Body = cuerpo.ToMessageBody();

            using (var cliente = new MailKit.Net.Smtp.SmtpClient())
            {
                cliente.Timeout = 30000;
                cliente.Connect(perfil.SmtpHost, perfil.SmtpPort.Value, ResolverOpcionSeguridad(perfil));
                cliente.Authenticate(perfil.Remitente, password);
                cliente.Send(mensaje);
                cliente.Disconnect(true);
                return mensaje.MessageId;
            }
        }

        private static void ValidarPerfil(PerfilSmtp perfil)
        {
            if (perfil == null) throw new InvalidOperationException("Facturación no tiene un perfil SMTP asignado.");
            if (string.IsNullOrWhiteSpace(perfil.SmtpHost) || perfil.SmtpHost.Length > 100)
                throw new InvalidOperationException("El perfil SMTP asignado no tiene un servidor válido.");
            if (!perfil.SmtpPort.HasValue || perfil.SmtpPort.Value < 1 || perfil.SmtpPort.Value > 65535)
                throw new InvalidOperationException("El perfil SMTP asignado no tiene un puerto válido.");
            if (!EsEmailValido(perfil.Remitente))
                throw new InvalidOperationException("El perfil SMTP asignado no tiene un remitente válido.");
            if (string.IsNullOrWhiteSpace(perfil.PasswordProtegida))
                throw new InvalidOperationException("El perfil SMTP asignado no tiene una contraseña guardada.");
        }

        private static SecureSocketOptions ResolverOpcionSeguridad(PerfilSmtp perfil)
        {
            return perfil.SecureSocketOption.HasValue
                ? (SecureSocketOptions)perfil.SecureSocketOption.Value
                : (perfil.UsaSsl.GetValueOrDefault(true) ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
        }

        private static string PermisoEnvio(string tipo)
        {
            switch ((tipo ?? string.Empty).Trim().ToUpperInvariant())
            {
                case "FAC": return "FAC_EMITIR";
                case "NC": return "NC_EMITIR";
                case "ND": return "ND_EMITIR";
                case "REC": return "REC_EMITIR";
                default: throw new InvalidOperationException("El tipo de comprobante no admite envío por correo.");
            }
        }

        private static byte[] DecodificarPdf(string base64)
        {
            if (string.IsNullOrWhiteSpace(base64))
                throw new ArgumentException("No se recibió el PDF del comprobante.");
            if (base64.Length > ((MaximoBytesPdf * 4 / 3) + 8))
                throw new ArgumentException("El PDF supera el tamaño máximo permitido de 10 MB.");

            byte[] pdf;
            try { pdf = Convert.FromBase64String(base64); }
            catch { throw new ArgumentException("El PDF adjunto no tiene un formato válido."); }

            if (pdf.Length < 5 || pdf.Length > MaximoBytesPdf || pdf[0] != 0x25 || pdf[1] != 0x50
                || pdf[2] != 0x44 || pdf[3] != 0x46 || pdf[4] != 0x2D)
                throw new ArgumentException("El adjunto debe ser un PDF válido de hasta 10 MB.");
            return pdf;
        }

        private static bool EsEmailValido(string email)
        {
            try
            {
                var direccion = new System.Net.Mail.MailAddress(email ?? string.Empty);
                return string.Equals(direccion.Address, email, StringComparison.OrdinalIgnoreCase);
            }
            catch { return false; }
        }

        private static string DesprotegerSecreto(string valorProtegido)
        {
            try
            {
                var datos = MachineKey.Unprotect(Convert.FromBase64String(valorProtegido), PasswordPurpose);
                return datos == null ? null : Encoding.UTF8.GetString(datos);
            }
            catch { return null; }
        }

        private static string AplicarPlantilla(string plantilla, ComprobanteCorreo comprobante, bool html)
        {
            Func<string, string> texto = valor => html ? HttpUtility.HtmlEncode(valor ?? string.Empty) : (valor ?? string.Empty);
            return (plantilla ?? string.Empty)
                .Replace("{{NUMERO_COMPROBANTE}}", texto(comprobante.Numero))
                .Replace("{{CLIENTE}}", texto(comprobante.Cliente))
                .Replace("{{FECHA_EMISION}}", texto(comprobante.FechaEmision.ToString("dd/MM/yyyy")));
        }

        private static string LimpiarCabecera(string valor)
        {
            return (valor ?? string.Empty).Replace("\r", " ").Replace("\n", " ").Trim();
        }

        private static string NombreAdjunto(ComprobanteCorreo comprobante)
        {
            var builder = new StringBuilder("Comprobante_");
            foreach (char caracter in comprobante.Numero ?? string.Empty)
                builder.Append(char.IsLetterOrDigit(caracter) || caracter == '-' || caracter == '_' ? caracter : '_');
            builder.Append(".pdf");
            return builder.ToString();
        }

        private static string CalcularSha256(byte[] contenido)
        {
            using (var sha = SHA256.Create())
                return BitConverter.ToString(sha.ComputeHash(contenido)).Replace("-", string.Empty);
        }

        private static string DetalleError(Exception ex)
        {
            string detalle = ex == null ? "Error SMTP no especificado." : ex.GetBaseException().Message;
            if (string.IsNullOrWhiteSpace(detalle)) detalle = "Error SMTP no especificado.";
            return detalle.Length <= 2000 ? detalle : detalle.Substring(0, 2000);
        }

        private static void RegistrarAuditoria(string usuario, string accion, int comprobanteId, string detalle)
        {
            SGTLAuditContext.RegistrarEvento(ConnectionStringHelper.GetConnectionString("SGTLEntities"), usuario,
                accion, "COMPROBANTES", "Comprobante_ID=" + comprobanteId, detalle, "Facturación");
        }
    }
}
