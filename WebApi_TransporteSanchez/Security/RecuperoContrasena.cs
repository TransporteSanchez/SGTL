using System;
using System.Data;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using WebApi_TransporteSanchez.Controllers;

namespace WebApi_TransporteSanchez.Security
{
    public sealed class RecuperoContrasena
    {
        public const string MensajeSolicitud =
            "Si el e-mail corresponde a una cuenta habilitada, vas a recibir las instrucciones para recuperar tu contraseña.";

        public const string EnlaceInvalido =
            "El enlace no es válido o venció. Solicitá un nuevo recupero de contraseña.";

        private readonly IGestionPerfilesEmail correo;

        public RecuperoContrasena(IGestionPerfilesEmail correo)
        {
            this.correo = correo;
        }

        public static string NormalizarEmail(string valor)
        {
            var email = (valor ?? "").Trim().ToLowerInvariant();

            if (email.Length == 0 || email.Length > 254 ||
                email.IndexOfAny(new[] { '\r', '\n' }) >= 0)
                throw new ArgumentException("Ingresá un e-mail válido.");

            try
            {
                var direccion = new MailAddress(email);

                if (direccion.Address != email ||
                    !Regex.IsMatch(email, @"\A[^\s@]+@[^\s@]+\.[^\s@]+\z"))
                    throw new FormatException();
            }
            catch (FormatException)
            {
                throw new ArgumentException("Ingresá un e-mail válido.");
            }

            return email;
        }

        public static string ValidarUrlLogin(string valor)
        {
            Uri url;

            if (string.IsNullOrWhiteSpace(valor) || valor.Length > 1024 ||
                !Uri.TryCreate(valor.Trim(), UriKind.Absolute, out url) ||
                !(url.Scheme == Uri.UriSchemeHttps ||
                  (url.Scheme == Uri.UriSchemeHttp && url.IsLoopback)) ||
                !string.IsNullOrEmpty(url.UserInfo) ||
                !string.IsNullOrEmpty(url.Query) ||
                !string.IsNullOrEmpty(url.Fragment) ||
                !url.AbsolutePath.EndsWith(
                    "/Login.html", StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidacionEmailException(
                    "Ingresá la dirección completa del Login con HTTPS. Para pruebas locales podés usar HTTP en localhost.");
            }

            return url.AbsoluteUri;
        }

        public static bool TokenValido(string token)
        {
            return token != null &&
                Regex.IsMatch(token, @"\A[A-Za-z0-9_-]{43}\z");
        }

        public async Task SolicitarAsync(string email, CancellationToken ct)
        {
            email = NormalizarEmail(email);

            var bytes = new byte[32];
            using (var azar = RandomNumberGenerator.Create())
                azar.GetBytes(bytes);

            var token = Convert.ToBase64String(bytes)
                .TrimEnd('=').Replace('+', '-').Replace('/', '_');

            var huella = ClavesSeguras.Huella(token);
            string urlLogin;

            using (var db = SeguridadSql.Abrir())
            {
                urlLogin = await db.Database.SqlQuery<string>(
                    @"SELECT UrlLogin
                      FROM dbo.CONFIGURACION_EMAIL_MODULO
                      WHERE Modulo = 'RECUPERO_CONTRASENA';")
                    .SingleOrDefaultAsync(ct);

                urlLogin = ValidarUrlLogin(urlLogin);

                using (var tx = db.Database.BeginTransaction(
                    IsolationLevel.Serializable))
                {
                    var usuario = await db.Database.SqlQuery<UsuarioAcceso>(
                        SeguridadSql.Usuario +
                        @"WITH (UPDLOCK, HOLDLOCK)
                          WHERE Email = @email AND EstadoUsuario = 'Activo';",
                        SeguridadSql.P(
                            "@email", SqlDbType.NVarChar, email, 254))
                        .SingleOrDefaultAsync(ct);

                    if (usuario == null) return;

                    var permitido = await db.Database.SqlQuery<bool>(
                        @"SELECT CAST(CASE WHEN
                          (SELECT COUNT(*)
                           FROM dbo.RECUPERO_CONTRASENA
                           WHERE UsuarioID = @id
                             AND CreadoUtc > DATEADD(
                                 hour, -1, SYSUTCDATETIME())) < 3
                          AND NOT EXISTS (
                            SELECT 1
                            FROM dbo.RECUPERO_CONTRASENA
                            WHERE UsuarioID = @id
                              AND CreadoUtc > DATEADD(
                                  minute, -2, SYSUTCDATETIME()))
                          THEN 1 ELSE 0 END AS bit);",
                        SeguridadSql.P(
                            "@id", SqlDbType.Int, usuario.Usuario_ID))
                        .SingleAsync(ct);

                    if (!permitido) return;

                    await db.Database.ExecuteSqlCommandAsync(
                        @"INSERT INTO dbo.RECUPERO_CONTRASENA
                          (TokenHash, UsuarioID, Email, VersionSesion,
                           ClaveHuella, CreadoUtc, VenceUtc, Enviado)
                          VALUES (@token, @id, @email, @version, @clave,
                                  SYSUTCDATETIME(),
                                  DATEADD(minute, 20, SYSUTCDATETIME()), 0);

                          DELETE FROM dbo.RECUPERO_CONTRASENA
                          WHERE UsuarioID = @id
                            AND VenceUtc < DATEADD(
                                day, -7, SYSUTCDATETIME());",
                        ct,
                        SeguridadSql.P(
                            "@token", SqlDbType.Char, huella, 64),
                        SeguridadSql.P(
                            "@id", SqlDbType.Int, usuario.Usuario_ID),
                        SeguridadSql.P(
                            "@email", SqlDbType.NVarChar, email, 254),
                        SeguridadSql.P(
                            "@version", SqlDbType.BigInt,
                            usuario.VersionSesion),
                        SeguridadSql.P(
                            "@clave", SqlDbType.Char,
                            ClavesSeguras.Huella(usuario.Clave), 64));

                    tx.Commit();
                }
            }

            var enlace = urlLogin + "#recupero=" + token;

            var cuerpo =
                "<p>Recibimos una solicitud para recuperar tu contraseña.</p>" +
                "<p><a href=\"" +
                System.Web.HttpUtility.HtmlAttributeEncode(enlace) +
                "\">Restablecer contraseña</a></p>" +
                "<p>El enlace vence en 20 minutos y se puede usar una sola vez.</p>" +
                "<p>Si no lo solicitaste, podés ignorar este correo.</p>";

            try
            {
                await correo.EnviarRecuperoAsync(
                    email, "Recuperar contraseña", cuerpo, ct);

                await MarcarAsync(huella, true, ct);
            }
            catch
            {
                try
                {
                    await MarcarAsync(
                        huella, false, CancellationToken.None);
                }
                catch
                {
                    System.Diagnostics.Trace.TraceWarning(
                        "No se pudo invalidar un enlace de recupero fallido.");
                }

                throw;
            }
        }

        private static async Task MarcarAsync(
            string huella, bool enviado, CancellationToken ct)
        {
            using (var db = SeguridadSql.Abrir())
            {
                await db.Database.ExecuteSqlCommandAsync(
                    enviado
                        ? @"UPDATE dbo.RECUPERO_CONTRASENA
                            SET Enviado = 1
                            WHERE TokenHash = @token AND UsadoUtc IS NULL;"
                        : @"UPDATE dbo.RECUPERO_CONTRASENA
                            SET UsadoUtc = SYSUTCDATETIME()
                            WHERE TokenHash = @token;",
                    ct,
                    SeguridadSql.P(
                        "@token", SqlDbType.Char, huella, 64));
            }
        }

        public static async Task<bool> EnlaceVigenteAsync(
            string token, CancellationToken ct)
        {
            if (!TokenValido(token)) return false;

            using (var db = SeguridadSql.Abrir())
            {
                var estado = await db.Database.SqlQuery<EstadoEnlace>(
                    @"SELECT r.Email AS EmailSolicitud,
                             u.Email AS EmailActual,
                             r.ClaveHuella,
                             u.Contraseña AS ClaveActual
                      FROM dbo.RECUPERO_CONTRASENA r
                      INNER JOIN dbo.USUARIOS u
                          ON u.Usuario_ID = r.UsuarioID
                      WHERE r.TokenHash = @token
                        AND r.Enviado = 1
                        AND r.UsadoUtc IS NULL
                        AND r.VenceUtc > SYSUTCDATETIME()
                        AND u.EstadoUsuario = 'Activo'
                        AND u.VersionSesion = r.VersionSesion;",
                    SeguridadSql.P(
                        "@token", SqlDbType.Char,
                        ClavesSeguras.Huella(token), 64))
                    .SingleOrDefaultAsync(ct);

                return estado != null &&
                    string.Equals(
                        estado.EmailSolicitud,
                        estado.EmailActual,
                        StringComparison.OrdinalIgnoreCase) &&
                    estado.ClaveHuella ==
                        ClavesSeguras.Huella(estado.ClaveActual);
            }
        }

        public async Task<string> RestablecerAsync(
            string token, string nueva, CancellationToken ct)
        {
            if (!TokenValido(token)) return null;

            var huella = ClavesSeguras.Huella(token);

            using (var db = SeguridadSql.Abrir())
            {
                var id = await db.Database.SqlQuery<int>(
                    @"SELECT UsuarioID
                      FROM dbo.RECUPERO_CONTRASENA
                      WHERE TokenHash = @token AND Enviado = 1
                        AND UsadoUtc IS NULL
                        AND VenceUtc > SYSUTCDATETIME();",
                    SeguridadSql.P(
                        "@token", SqlDbType.Char, huella, 64))
                    .SingleOrDefaultAsync(ct);

                if (id < 1) return null;

                var claveNueva = ClavesSeguras.Crear(nueva);
                UsuarioAcceso usuario;

                using (var tx = db.Database.BeginTransaction(
                    IsolationLevel.Serializable))
                {
                    usuario = await db.Database.SqlQuery<UsuarioAcceso>(
                        SeguridadSql.Usuario +
                        @"WITH (UPDLOCK, HOLDLOCK)
                          WHERE Usuario_ID = @id
                            AND EstadoUsuario = 'Activo';",
                        SeguridadSql.P("@id", SqlDbType.Int, id))
                        .SingleOrDefaultAsync(ct);

                    if (usuario == null) return null;

                    var solicitud =
                        await db.Database.SqlQuery<EstadoRecupero>(
                            @"SELECT Email, VersionSesion, ClaveHuella
                              FROM dbo.RECUPERO_CONTRASENA
                                  WITH (UPDLOCK, HOLDLOCK)
                              WHERE TokenHash = @token AND UsuarioID = @id
                                AND Enviado = 1 AND UsadoUtc IS NULL
                                AND VenceUtc > SYSUTCDATETIME();",
                            SeguridadSql.P(
                                "@token", SqlDbType.Char, huella, 64),
                            SeguridadSql.P("@id", SqlDbType.Int, id))
                            .SingleOrDefaultAsync(ct);

                    if (solicitud == null ||
                        !string.Equals(
                            solicitud.Email, usuario.Email,
                            StringComparison.OrdinalIgnoreCase) ||
                        solicitud.VersionSesion != usuario.VersionSesion ||
                        solicitud.ClaveHuella !=
                            ClavesSeguras.Huella(usuario.Clave))
                    {
                        return null;
                    }

                    var filas = await db.Database.ExecuteSqlCommandAsync(
                        @"UPDATE dbo.USUARIOS
                          SET Contraseña = @clave,
                              VersionSesion = VersionSesion + 1,
                              Fecha_Modi = CAST(
                                  SYSDATETIMEOFFSET()
                                  AT TIME ZONE 'Argentina Standard Time'
                                  AS datetime),
                              Usu_Modi = @nombre
                          WHERE Usuario_ID = @id
                            AND VersionSesion = @version;",
                        ct,
                        SeguridadSql.P(
                            "@clave", SqlDbType.NVarChar, claveNueva, 255),
                                                SeguridadSql.P(
                            "@nombre", SqlDbType.VarChar,
                            usuario.Nombre_Usuario.Substring(
                                0, Math.Min(20, usuario.Nombre_Usuario.Length)),
                            20),
                        SeguridadSql.P("@id", SqlDbType.Int, id),
                        SeguridadSql.P(
                            "@version", SqlDbType.BigInt,
                            usuario.VersionSesion));

                    if (filas != 1) return null;

                    await db.Database.ExecuteSqlCommandAsync(
                        @"UPDATE dbo.RECUPERO_CONTRASENA
                          SET UsadoUtc = SYSUTCDATETIME()
                          WHERE UsuarioID = @id AND UsadoUtc IS NULL;",
                        ct,
                        SeguridadSql.P("@id", SqlDbType.Int, id));

                    tx.Commit();
                }

                SeguridadSql.Auditar(
                    usuario.Nombre_Usuario, "RECUPERO_CONTRASENA", id);

                return usuario.Email;
            }
        }

        private sealed class EstadoEnlace
        {
            public string EmailSolicitud { get; set; }
            public string EmailActual { get; set; }
            public string ClaveHuella { get; set; }
            public string ClaveActual { get; set; }
        }

        private sealed class EstadoRecupero
        {
            public string Email { get; set; }
            public long VersionSesion { get; set; }
            public string ClaveHuella { get; set; }
        }
    }
}