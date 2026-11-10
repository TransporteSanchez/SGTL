using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Security;
using MailKit.Security;
using MimeKit;
using SmtpClient = MailKit.Net.Smtp.SmtpClient;

namespace WebApi_TransporteSanchez.Controllers
{
    public sealed class GestionPerfilesEmail : IGestionPerfilesEmail
    {
        private static readonly string[] PropositoSecreto = { "SGTL", "EmailServidor", "SMTP-password", "v1" };

        private const string ModoSql = @"
CASE SecureSocketOption
    WHEN 2 THEN 'SslOnConnect'
    WHEN 3 THEN 'StartTls'
    ELSE NULL
END AS ModoSeguridad";

        private const string ConsultaPerfiles = @"
SELECT Es_id, [Service], [Name], SmtpHost, SmtpPort,
       CredentialFromMailAddres, Asunto, CuerpoHtml,
       CAST(CASE WHEN NULLIF(CredentialFromMailPassProtegida, N'') IS NULL
                 THEN 0 ELSE 1 END AS bit) AS TienePassword, " + ModoSql + @"
FROM dbo.EmailServidor";

        private const string ConsultaAsignacion = @"
SELECT a.Modulo, p.[Service], p.Es_id AS EmailServidorID,
       p.[Name] AS Perfil, p.CredentialFromMailAddres AS Remitente
FROM dbo.CONFIGURACION_EMAIL_MODULO AS a
INNER JOIN dbo.EmailServidor AS p ON p.[Service] = a.[Service]
WHERE a.Modulo = @modulo;";

        private const string InsertarPerfil = @"
INSERT dbo.EmailServidor
    ([Name], NombreRemitente, SmtpHost, SmtpPort, UsaSsl, SecureSocketOption,
     CredentialFromMailAddres, CredentialFromMailPassProtegida, Asunto, CuerpoHtml)
VALUES
    (@nombre, @nombre, @host, @puerto, 1, @modo, @remitente, @secreto, @asunto, @cuerpo);
SELECT CONVERT(int, SCOPE_IDENTITY());";

        private const string ActualizarPerfil = @"
UPDATE dbo.EmailServidor
SET [Name] = @nombre,
    NombreRemitente = CASE
        WHEN NULLIF(LTRIM(RTRIM(NombreRemitente)), N'') IS NULL OR NombreRemitente = [Name]
        THEN @nombre ELSE NombreRemitente END,
    SmtpHost = @host, SmtpPort = @puerto, UsaSsl = 1, SecureSocketOption = @modo,
    CredentialFromMailAddres = @remitente,
    CredentialFromMailPassProtegida = COALESCE(@secreto, CredentialFromMailPassProtegida),
    Asunto = @asunto, CuerpoHtml = @cuerpo
WHERE Es_id = @id;
SELECT CASE WHEN @@ROWCOUNT = 0 THEN 0 ELSE CONVERT(int, @id) END;";

        private readonly string conexion = ConnectionStringHelper.GetConnectionString("SGTLEntities");

        public async Task<IReadOnlyList<PerfilEmailSalida>> ListarAsync(CancellationToken ct)
        {
            using (var db = new SGTLAuditContext(conexion))
                return await db.Database.SqlQuery<PerfilEmailSalida>(
                    ConsultaPerfiles + " ORDER BY Es_id;").ToListAsync(ct);
        }

        public async Task<PerfilEmailSalida> ObtenerAsync(int id, CancellationToken ct)
        {
            using (var db = new SGTLAuditContext(conexion))
                return await LeerPerfilAsync(db, id, ct);
        }

        public Task<PerfilEmailSalida> CrearAsync(PerfilEmailEntrada entrada, string usuario, CancellationToken ct)
        {
            return GuardarPerfilAsync(null, entrada, usuario, ct);
        }

        public Task<PerfilEmailSalida> EditarAsync(int id, PerfilEmailEntrada entrada, string usuario, CancellationToken ct)
        {
            return GuardarPerfilAsync(id, entrada, usuario, ct);
        }

        private async Task<PerfilEmailSalida> GuardarPerfilAsync(
            int? id, PerfilEmailEntrada entrada, string usuario, CancellationToken ct)
        {
            var host = (entrada.SmtpHost ?? "").Trim();
            ValidarServidor(host, entrada.SmtpPort);
            var remitente = ValidarCorreo(entrada.CredentialFromMailAddres, "Ingresá un correo remitente válido.");
            var modo = ResolverModo(entrada.ModoSeguridad);

            string secreto = null;
            if (!string.IsNullOrWhiteSpace(entrada.CredentialFromMailPass))
            {
                secreto = Convert.ToBase64String(MachineKey.Protect(
                    Encoding.UTF8.GetBytes(entrada.CredentialFromMailPass), PropositoSecreto));
                if (secreto.Length > 512)
                    throw new ValidacionEmailException("La contraseña protegida supera el tamaño admitido.");
            }
            else if (!id.HasValue)
            {
                throw new ValidacionEmailException("Ingresá la contraseña SMTP para crear el perfil.");
            }

            var parametros = new List<SqlParameter>
            {
                P("@nombre", SqlDbType.VarChar, entrada.Name.Trim(), 100),
                P("@host", SqlDbType.VarChar, host, 100),
                P("@puerto", SqlDbType.Int, entrada.SmtpPort.Value),
                P("@modo", SqlDbType.SmallInt, (short)modo),
                P("@remitente", SqlDbType.VarChar, remitente, 100),
                P("@secreto", SqlDbType.NVarChar, secreto, 512),
                P("@asunto", SqlDbType.NVarChar, entrada.Asunto, 250),
                P("@cuerpo", SqlDbType.NVarChar, entrada.CuerpoHtml, -1)
            };
            if (id.HasValue) parametros.Add(P("@id", SqlDbType.Int, id.Value));

            PerfilEmailSalida perfil;
            using (var db = new SGTLAuditContext(conexion))
            using (var transaccion = db.Database.BeginTransaction())
            {
                var sql = id.HasValue ? ActualizarPerfil : InsertarPerfil;
                int guardado = await db.Database.SqlQuery<int>(sql, parametros.ToArray()).SingleAsync(ct);
                if (guardado == 0) return null;

                perfil = await LeerPerfilAsync(db, guardado, ct);
                if (perfil == null) throw new InvalidOperationException("El perfil guardado no está disponible.");
                transaccion.Commit();
            }

            Auditar(usuario, id.HasValue ? "UPDATE" : "INSERT", perfil.Es_id, "Configuración SMTP guardada.");
            return perfil;
        }

        public async Task<bool> EliminarAsync(int id, string usuario, CancellationToken ct)
        {
            int eliminados;
            try
            {
                using (var db = new SGTLAuditContext(conexion))
                {
                    eliminados = await db.Database.ExecuteSqlCommandAsync(
                        "DELETE FROM dbo.EmailServidor WHERE Es_id = @id;", ct, P("@id", SqlDbType.Int, id));
                }
            }
            catch (Exception ex) when ((ex.GetBaseException() as SqlException)?.Number == 547)
            {
                throw new PerfilEmailEnUsoException();
            }

            if (eliminados == 0) return false;

            Auditar(usuario, "DELETE", id, "Configuración SMTP eliminada.");
            return true;
        }

        public async Task<AsignacionEmailSalida> ObtenerAsignacionAsync(string modulo, CancellationToken ct)
        {
            using (var db = new SGTLAuditContext(conexion))
                return await LeerAsignacionAsync(db, modulo, ct);
        }

        public async Task<AsignacionEmailSalida> GuardarAsignacionAsync(
            string modulo, short service, string usuario, CancellationToken ct)
        {
            const string guardar = @"
UPDATE dbo.CONFIGURACION_EMAIL_MODULO WITH (UPDLOCK, HOLDLOCK)
SET [Service] = @service, FechaModificacion = SYSUTCDATETIME(), UsuarioModificacion = @usuario
WHERE Modulo = @modulo;
IF @@ROWCOUNT = 0
    INSERT dbo.CONFIGURACION_EMAIL_MODULO (Modulo, [Service], FechaModificacion, UsuarioModificacion)
    VALUES (@modulo, @service, SYSUTCDATETIME(), @usuario);";

            AsignacionEmailSalida asignacion;
            using (var db = new SGTLAuditContext(conexion))
            using (var transaccion = db.Database.BeginTransaction(IsolationLevel.Serializable))
            {
                bool existe = await db.Database.SqlQuery<bool>(@"
SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.EmailServidor WHERE [Service] = @service)
                 THEN 1 ELSE 0 END AS bit);",
                    P("@service", SqlDbType.SmallInt, service)).SingleAsync(ct);
                if (!existe) return null;

                await db.Database.ExecuteSqlCommandAsync(guardar, ct,
                    P("@modulo", SqlDbType.VarChar, modulo, 30),
                    P("@service", SqlDbType.SmallInt, service),
                    P("@usuario", SqlDbType.NVarChar, usuario, 100));

                asignacion = await LeerAsignacionAsync(db, modulo, ct);
                if (asignacion == null) throw new InvalidOperationException("No se pudo leer la asignación guardada.");
                transaccion.Commit();
            }

            Auditar(usuario, "EMAIL_MODULE", asignacion.EmailServidorID, modulo + " asociado al Service=" + service + ".");
            return asignacion;
        }

        public async Task<bool> EnviarPruebaAsync(int id, string destino, string usuario, CancellationToken ct)
        {
            PerfilParaPrueba perfil;
            using (var db = new SGTLAuditContext(conexion))
            {
                perfil = await db.Database.SqlQuery<PerfilParaPrueba>(@"
SELECT SmtpHost, SmtpPort, CredentialFromMailAddres, CredentialFromMailPassProtegida,
       COALESCE(NULLIF(LTRIM(RTRIM(NombreRemitente)), N''), [Name]) AS NombreRemitente,
       Asunto, CuerpoHtml, " + ModoSql + @"
FROM dbo.EmailServidor
WHERE Es_id = @id;", P("@id", SqlDbType.Int, id)).SingleOrDefaultAsync(ct);
            }
            if (perfil == null) return false;

            ValidarServidor(perfil.SmtpHost, perfil.SmtpPort);
            var modo = ResolverModo(perfil.ModoSeguridad);
            var remitente = ValidarCorreo(perfil.CredentialFromMailAddres, "El perfil no tiene un remitente válido.");
            var destinatario = ValidarCorreo(destino, "Ingresá un correo de destino válido.");
            var clave = AbrirSecreto(perfil.CredentialFromMailPassProtegida);

            var mensaje = new MimeMessage();
            mensaje.From.Add(new MailboxAddress(perfil.NombreRemitente ?? "", remitente));
            mensaje.To.Add(new MailboxAddress("", destinatario));
            mensaje.Subject = string.IsNullOrWhiteSpace(perfil.Asunto)
                ? "Prueba de configuración SMTP"
                : "Prueba: " + perfil.Asunto.Replace('\r', ' ').Replace('\n', ' ').Trim();
            mensaje.Body = new TextPart("html")
            {
                Text = string.IsNullOrWhiteSpace(perfil.CuerpoHtml)
                    ? "<p>La configuración SMTP funciona.</p>"
                    : perfil.CuerpoHtml
            };

            await EnviarSmtpAsync(perfil.SmtpHost, perfil.SmtpPort.Value, modo, remitente, clave, mensaje, ct);
            Auditar(usuario, "SMTP_TEST", id, "Correo de prueba aceptado por el servidor SMTP.");
            return true;
        }

        private static async Task EnviarSmtpAsync(
            string host, int puerto, SecureSocketOptions modo, string remitente,
            string clave, MimeMessage mensaje, CancellationToken ct)
        {
            using (var smtp = new SmtpClient())
            using (var tiempo = CancellationTokenSource.CreateLinkedTokenSource(ct))
            {
                tiempo.CancelAfter(TimeSpan.FromSeconds(30));
                try
                {
                    await smtp.ConnectAsync(host, puerto, modo, tiempo.Token);
                    await smtp.AuthenticateAsync(remitente, clave, tiempo.Token);
                    await smtp.SendAsync(mensaje, tiempo.Token);
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    throw new EnvioSmtpException(ex);
                }

                try
                {
                    await smtp.DisconnectAsync(true, tiempo.Token);
                }
                catch (Exception ex)
                {
                    Trace.TraceWarning("Cierre SMTP posterior al envío: {0}", ex.GetType().Name);
                }
            }
        }

        private static string AbrirSecreto(string valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                throw new ValidacionEmailException("Guardá la contraseña SMTP antes de enviar la prueba.");

            try
            {
                var bytes = MachineKey.Unprotect(Convert.FromBase64String(valor), PropositoSecreto);
                if (bytes != null && bytes.Length > 0) return Encoding.UTF8.GetString(bytes);
            }
            catch (Exception ex) when (ex is FormatException || ex is CryptographicException)
            {
                throw new ValidacionEmailException("No se pudo leer la contraseña SMTP. Volvé a guardarla.");
            }

            throw new ValidacionEmailException("No se pudo leer la contraseña SMTP. Volvé a guardarla.");
        }

        private static SecureSocketOptions ResolverModo(string modo)
        {
            switch (modo)
            {
                case "StartTls": return SecureSocketOptions.StartTls;
                case "SslOnConnect": return SecureSocketOptions.SslOnConnect;
                default: throw new ValidacionEmailException("Elegí un modo seguro para la conexión SMTP.");
            }
        }

        private static void ValidarServidor(string host, int? puerto)
        {
            if (string.IsNullOrWhiteSpace(host) || host.Length > 100 || Uri.CheckHostName(host) == UriHostNameType.Unknown)
                throw new ValidacionEmailException("Ingresá un servidor SMTP válido, sin protocolo ni ruta.");

            if (!puerto.HasValue || puerto.Value < 1 || puerto.Value > 65535)
                throw new ValidacionEmailException("El puerto SMTP debe estar entre 1 y 65535.");
        }

        private static string ValidarCorreo(string valor, string mensaje)
        {
            var correo = (valor ?? "").Trim();
            if (correo.Length > 0)
            {
                try
                {
                    var direccion = new MailAddress(correo);
                    if (string.Equals(direccion.Address, correo, StringComparison.OrdinalIgnoreCase))
                        return correo;
                }
                catch (FormatException) { }
            }
            throw new ValidacionEmailException(mensaje);
        }

        private static Task<PerfilEmailSalida> LeerPerfilAsync(SGTLAuditContext db, int id, CancellationToken ct)
        {
            return db.Database.SqlQuery<PerfilEmailSalida>(
                ConsultaPerfiles + " WHERE Es_id = @id;", P("@id", SqlDbType.Int, id)).SingleOrDefaultAsync(ct);
        }

        private static Task<AsignacionEmailSalida> LeerAsignacionAsync(SGTLAuditContext db, string modulo, CancellationToken ct)
        {
            return db.Database.SqlQuery<AsignacionEmailSalida>(
                ConsultaAsignacion, P("@modulo", SqlDbType.VarChar, modulo, 30)).SingleOrDefaultAsync(ct);
        }

        private static SqlParameter P(string nombre, SqlDbType tipo, object valor, int tamano = 0)
        {
            var parametro = new SqlParameter(nombre, tipo) { Value = valor ?? DBNull.Value };
            if (tamano != 0) parametro.Size = tamano;
            return parametro;
        }

        private void Auditar(string usuario, string accion, int id, string detalle)
        {
            SGTLAuditContext.RegistrarEvento(conexion, usuario, accion, "EmailServidor", "Es_id=" + id, detalle);
        }

        private sealed class PerfilParaPrueba
        {
            public string SmtpHost { get; set; }
            public int? SmtpPort { get; set; }
            public string ModoSeguridad { get; set; }
            public string CredentialFromMailAddres { get; set; }
            public string CredentialFromMailPassProtegida { get; set; }
            public string NombreRemitente { get; set; }
            public string Asunto { get; set; }
            public string CuerpoHtml { get; set; }
        }
    }
}