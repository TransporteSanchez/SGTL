using System;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Web.Http;
using System.Web.Security;
using MailKit.Security;
using Microsoft.IdentityModel.Tokens;
using MimeKit;
using WebApi_TransporteSanchez.Security;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/EmailServidor")]
    public class EmailServidorController : ApiController
    {
        private static readonly string[] PasswordPurpose = { "SGTL", "EmailServidor", "SMTP-password", "v1" };

        public class EmailServidorRequestDto
        {
            public string SmtpHost { get; set; }
            public int? SmtpPort { get; set; }
            public bool? UsaSsl { get; set; }
            public string CredentialFromMailAddres { get; set; }
            // Solo se recibe al crear o cambiar la clave. Nunca se devuelve.
            public string CredentialFromMailPass { get; set; }
            public string Name { get; set; }
            public bool? UsaTLS12 { get; set; }
            public string Asunto { get; set; }
            public string CuerpoHtml { get; set; }
        }

        public class EmailServidorResponseDto
        {
            public short Es_id { get; set; }
            public short Service { get; set; }
            public string SmtpHost { get; set; }
            public int? SmtpPort { get; set; }
            public bool? UsaSsl { get; set; }
            public string CredentialFromMailAddres { get; set; }
            public string Name { get; set; }
            public bool? UsaTLS12 { get; set; }
            public string Asunto { get; set; }
            public string CuerpoHtml { get; set; }
            public bool TienePassword { get; set; }
        }

        public class PruebaEmailDto
        {
            public string EmailDestino { get; set; }
        }

        public class AsignacionModuloRequestDto
        {
            public short? Service { get; set; }
            public string UrlLogin { get; set; }
        }

        public class AsignacionModuloResponseDto
        {
            public string Modulo { get; set; }
            public short Service { get; set; }
            public short EmailServidorID { get; set; }
            public string Perfil { get; set; }
            public string Remitente { get; set; }
            public string UrlLogin { get; set; }
            public DateTimeOffset FechaModificacion { get; set; }
            public string UsuarioModificacion { get; set; }
        }

        private class EmailServidorInterno
        {
            public short Es_id { get; set; }
            public short Service { get; set; }
            public string SmtpHost { get; set; }
            public int? SmtpPort { get; set; }
            public bool? UsaSsl { get; set; }
            public string CredentialFromMailAddres { get; set; }
            public string Name { get; set; }
            public short? SecureSocketOption { get; set; }
            public bool? UsaTLS12 { get; set; }
            public string NombreRemitente { get; set; }
            public string Asunto { get; set; }
            public string CuerpoHtml { get; set; }
            public string CredentialFromMailPassProtegida { get; set; }
        }

        [HttpGet]
        [Route("")]
        public IHttpActionResult Get()
        {
            string usuario;
            var autorizado = RequiereAdministrador(out usuario);
            if (autorizado != null) return autorizado;

            try
            {
                using (var db = CrearContexto())
                {
                    var configuraciones = db.Database.SqlQuery<EmailServidorResponseDto>(
                        ConsultaConfiguracion + " ORDER BY Es_id;").ToList();
                    return Ok(configuraciones);
                }
            }
            catch
            {
                return ErrorInternoConfiguracion();
            }
        }

        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult Get(int id)
        {
            string usuario;
            var autorizado = RequiereAdministrador(out usuario);
            if (autorizado != null) return autorizado;
            if (!EsIdValido(id)) return BadRequest("El identificador de configuración no es válido.");

            try
            {
                using (var db = CrearContexto())
                {
                    var configuracion = BuscarConfiguracion(db, id);
                    return configuracion == null ? (IHttpActionResult)NotFound() : Ok(configuracion);
                }
            }
            catch
            {
                return ErrorInternoConfiguracion();
            }
        }

        [HttpGet]
        [Route("asignaciones/facturacion")]
        public IHttpActionResult ObtenerAsignacionFacturacion()
        {
            return ObtenerAsignacionModulo("FACTURACION");
        }

        [HttpGet]
        [Route("asignaciones/presupuestos")]
        public IHttpActionResult ObtenerAsignacionPresupuestos()
        {
            return ObtenerAsignacionModulo("PRESUPUESTOS");
        }

        private IHttpActionResult ObtenerAsignacionModulo(string modulo)
        {
            string usuario;
            var autorizado = RequiereAdministrador(out usuario);
            if (autorizado != null) return autorizado;

            try
            {
                using (var db = CrearContexto())
                {
                    var asignacion = BuscarAsignacionModulo(db, modulo);
                    return asignacion == null ? (IHttpActionResult)NotFound() : Ok(asignacion);
                }
            }
            catch
            {
                return ErrorInternoConfiguracion();
            }
        }

        [HttpGet, Route("asignaciones/recupero-contrasena")]
        public IHttpActionResult ObtenerAsignacionRecupero()
        {
            return ObtenerAsignacionModulo("RECUPERO_CONTRASENA");
        }

        [HttpPut, Route("asignaciones/recupero-contrasena")]
        public IHttpActionResult GuardarAsignacionRecupero([FromBody] AsignacionModuloRequestDto value)
        {
            return GuardarAsignacionModulo("RECUPERO_CONTRASENA", value);
        }

        [HttpPut]
        [Route("asignaciones/facturacion")]
        public IHttpActionResult GuardarAsignacionFacturacion([FromBody] AsignacionModuloRequestDto value)
        {
            return GuardarAsignacionModulo("FACTURACION", value);
        }

        [HttpPut]
        [Route("asignaciones/presupuestos")]
        public IHttpActionResult GuardarAsignacionPresupuestos([FromBody] AsignacionModuloRequestDto value)
        {
            return GuardarAsignacionModulo("PRESUPUESTOS", value);
        }

        private IHttpActionResult GuardarAsignacionModulo(string modulo, AsignacionModuloRequestDto value)
        {
            string usuario;
            var autorizado = RequiereAdministrador(out usuario);
            if (autorizado != null) return autorizado;
            if (value == null || !value.Service.HasValue || value.Service.Value <= 0)
                return BadRequest("Seleccioná un perfil SMTP válido.");

            if (modulo == "RECUPERO_CONTRASENA")
            {
                try { value.UrlLogin = RecuperoContrasena.ValidarUrlLogin(value.UrlLogin); }
                catch (ArgumentException ex) { return BadRequest(ex.Message); }
            }

            try
            {
                using (var db = CrearContexto())
                using (var transaccion = db.Database.BeginTransaction(IsolationLevel.Serializable))
                {
                    var perfil = db.Database.SqlQuery<EmailServidorResponseDto>(
                        ConsultaConfiguracion + " WHERE [Service] = @service;",
                        P("@service", value.Service.Value)).FirstOrDefault();
                    if (perfil == null)
                    {
                        transaccion.Rollback();
                        return BadRequest("El perfil SMTP seleccionado ya no existe.");
                    }

                    var conflictos = db.Database.SqlQuery<int>(
                        "SELECT COUNT(*) FROM dbo.CONFIGURACION_EMAIL_MODULO WITH (UPDLOCK,HOLDLOCK) " +
                        "WHERE [Service]=@service AND Modulo<>@modulo AND (@modulo='RECUPERO_CONTRASENA' OR Modulo='RECUPERO_CONTRASENA');",
                        P("@service", value.Service.Value), P("@modulo", modulo)).Single();
                    if (conflictos > 0)
                        return BadRequest("El perfil de recupero de contraseña debe ser exclusivo. Registrá otro perfil para asignarlo.");
                    if (modulo == "RECUPERO_CONTRASENA" && (!perfil.TienePassword || perfil.UsaSsl != true))
                        return BadRequest("El perfil de recupero necesita una contraseña guardada y una conexión SMTP segura.");

                    int actualizados = db.Database.ExecuteSqlCommand(
                        "UPDATE dbo.CONFIGURACION_EMAIL_MODULO " +
                        "SET [Service] = @service, UrlLogin=@url, FechaModificacion = SYSUTCDATETIME(), UsuarioModificacion = @usuario " +
                        "WHERE Modulo = @modulo;",
                        P("@service", value.Service.Value), P("@usuario", usuario), P("@modulo", modulo), P("@url", modulo == "RECUPERO_CONTRASENA" ? value.UrlLogin : null));
                    if (actualizados == 0)
                    {
                        db.Database.ExecuteSqlCommand(
                            "INSERT INTO dbo.CONFIGURACION_EMAIL_MODULO " +
                            "(Modulo, [Service], UrlLogin, FechaModificacion, UsuarioModificacion) " +
                            "VALUES (@modulo, @service, @url, SYSUTCDATETIME(), @usuario);",
                            P("@service", value.Service.Value), P("@usuario", usuario), P("@modulo", modulo), P("@url", modulo == "RECUPERO_CONTRASENA" ? value.UrlLogin : null));
                    }

                    transaccion.Commit();
                    RegistrarAuditoria(usuario, "EMAIL_MODULE", perfil.Es_id,
                        modulo + " asociado al Service=" + perfil.Service + ".");
                    return Ok(BuscarAsignacionModulo(db, modulo));
                }
            }
            catch
            {
                return ErrorInternoConfiguracion();
            }
        }

        [HttpPost]
        [Route("")]
        public IHttpActionResult Post([FromBody] EmailServidorRequestDto value)
        {
            string usuario;
            var autorizado = RequiereAdministrador(out usuario);
            if (autorizado != null) return autorizado;

            var validacion = ValidarConfiguracion(value, true);
            if (validacion != null) return BadRequest(validacion);

            try
            {
                string passwordProtegida = string.IsNullOrWhiteSpace(value.CredentialFromMailPass)
                    ? null
                    : ProtegerSecreto(value.CredentialFromMailPass);

                using (var db = CrearContexto())
                {
                    short id = db.Database.SqlQuery<short>(
                        "INSERT INTO dbo.EmailServidor (SmtpHost, SmtpPort, UsaSsl, CredentialFromMailAddres, " +
                        "CredentialFromMailPassProtegida, [Name], SecureSocketOption, UsaTLS12, " +
                        "NombreRemitente, Asunto, CuerpoHtml) " +
                        "VALUES (@host, @port, @ssl, @usuarioSmtp, @password, @nombre, @opcion, @tls12, " +
                        "@nombreRemitente, @asunto, @cuerpo); SELECT CAST(SCOPE_IDENTITY() AS smallint);",
                        P("@host", value.SmtpHost),
                        P("@port", value.SmtpPort),
                        P("@ssl", ResolverUsaSsl(value)),
                        P("@usuarioSmtp", value.CredentialFromMailAddres),
                        P("@password", passwordProtegida),
                        P("@nombre", value.Name),
                        P("@opcion", (short)ResolverOpcionSeguridad(value)),
                        P("@tls12", value.UsaTLS12),
                        P("@nombreRemitente", value.Name),
                        P("@asunto", value.Asunto),
                        P("@cuerpo", value.CuerpoHtml)).Single();

                    var resultado = BuscarConfiguracion(db, id);
                    RegistrarAuditoria(usuario, "INSERT", id, "Configuración SMTP creada.");
                    return Content(HttpStatusCode.Created, resultado);
                }
            }
            catch
            {
                return ErrorInternoConfiguracion();
            }
        }

        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult Put(int id, [FromBody] EmailServidorRequestDto value)
        {
            string usuario;
            var autorizado = RequiereAdministrador(out usuario);
            if (autorizado != null) return autorizado;
            if (!EsIdValido(id)) return BadRequest("El identificador de configuración no es válido.");

            var validacion = ValidarConfiguracion(value, false);
            if (validacion != null) return BadRequest(validacion);

            try
            {
                using (var db = CrearContexto())
                {
                    var actual = BuscarConfiguracionInterna(db, id);
                    if (actual == null) return NotFound();

                    if (value.UsaSsl != true && db.Database.SqlQuery<int>(
                        "SELECT COUNT(*) FROM dbo.CONFIGURACION_EMAIL_MODULO WHERE Modulo='RECUPERO_CONTRASENA' AND [Service]=@service",
                        P("@service", actual.Service)).Single() > 0)
                        return BadRequest("El perfil de recupero de contraseña requiere una conexión SMTP segura.");

                    string passwordProtegida = actual.CredentialFromMailPassProtegida;
                    if (!string.IsNullOrWhiteSpace(value.CredentialFromMailPass))
                        passwordProtegida = ProtegerSecreto(value.CredentialFromMailPass);

                    db.Database.ExecuteSqlCommand(
                        "UPDATE dbo.EmailServidor SET SmtpHost = @host, SmtpPort = @port, UsaSsl = @ssl, " +
                        "CredentialFromMailAddres = @usuarioSmtp, CredentialFromMailPassProtegida = @password, " +
                        "[Name] = @nombre, SecureSocketOption = @opcion, UsaTLS12 = @tls12, " +
                        "NombreRemitente = @nombreRemitente, Asunto = @asunto, CuerpoHtml = @cuerpo " +
                        "WHERE Es_id = @id;",
                        P("@host", value.SmtpHost),
                        P("@port", value.SmtpPort),
                        P("@ssl", ResolverUsaSsl(value)),
                        P("@usuarioSmtp", value.CredentialFromMailAddres),
                        P("@password", passwordProtegida),
                        P("@nombre", value.Name),
                        P("@opcion", (short)ResolverOpcionSeguridad(value)),
                        P("@tls12", value.UsaTLS12),
                        P("@nombreRemitente", value.Name),
                        P("@asunto", value.Asunto),
                        P("@cuerpo", value.CuerpoHtml),
                        P("@id", id));

                    var resultado = BuscarConfiguracion(db, id);
                    RegistrarAuditoria(usuario, "UPDATE", id, "Configuración SMTP actualizada.");
                    return Ok(resultado);
                }
            }
            catch
            {
                return ErrorInternoConfiguracion();
            }
        }

        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult Delete(int id)
        {
            string usuario;
            var autorizado = RequiereAdministrador(out usuario);
            if (autorizado != null) return autorizado;
            if (!EsIdValido(id)) return BadRequest("El identificador de configuración no es válido.");

            try
            {
                using (var db = CrearContexto())
                {
                    int eliminados = db.Database.ExecuteSqlCommand(
                        "DELETE FROM dbo.EmailServidor WHERE Es_id = @id;", P("@id", id));
                    if (eliminados == 0) return NotFound();
                }

                RegistrarAuditoria(usuario, "DELETE", id, "Configuración SMTP eliminada.");
                return StatusCode(HttpStatusCode.NoContent);
            }
            catch (SqlException ex) when (ex.Number == 547)
            {
                return BadRequest("No se puede eliminar este perfil porque está asignado a un módulo o tiene envíos registrados.");
            }
            catch
            {
                return ErrorInternoConfiguracion();
            }
        }

        [HttpPost]
        [Route("{id:int}/probar")]
        public IHttpActionResult Probar(int id, [FromBody] PruebaEmailDto value)
        {
            string usuario;
            var autorizado = RequiereAdministrador(out usuario);
            if (autorizado != null) return autorizado;
            if (!EsIdValido(id)) return BadRequest("El identificador de configuración no es válido.");

            if (value == null || !EsEmailValido(value.EmailDestino))
                return BadRequest("Indicá una dirección válida para recibir el correo de prueba.");

            try
            {
                EmailServidorInterno configuracion;
                using (var db = CrearContexto())
                {
                    configuracion = BuscarConfiguracionInterna(db, id);
                }

                if (configuracion == null) return NotFound();
                var validacion = ValidarConfiguracion(configuracion);
                if (validacion != null) return BadRequest(validacion);
                if (string.IsNullOrWhiteSpace(configuracion.CredentialFromMailPassProtegida))
                    return BadRequest("La configuración no tiene una contraseña SMTP. Guardala antes de probar.");

                string password = DesprotegerSecreto(configuracion.CredentialFromMailPassProtegida);
                if (string.IsNullOrWhiteSpace(password))
                    return BadRequest("No se pudo leer la contraseña SMTP protegida. Volvé a guardarla.");

                EnviarPrueba(configuracion, value.EmailDestino, password);
                RegistrarAuditoria(usuario, "SMTP_TEST", id, "Correo de prueba enviado a " + value.EmailDestino + ".");
                return Ok(new { mensaje = "Correo de prueba enviado a " + value.EmailDestino + "." });
            }
            catch
            {
                return Content(HttpStatusCode.BadGateway, new
                {
                    error = "No se pudo conectar, autenticar o enviar el correo de prueba. Verificá host, puerto, seguridad y credenciales."
                });
            }
        }

        private static void EnviarPrueba(EmailServidorInterno configuracion, string destino, string password)
        {
            if (configuracion.UsaTLS12 == true)
                ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;

            var mensaje = new MimeMessage();
            mensaje.From.Add(new MailboxAddress(
                string.IsNullOrWhiteSpace(configuracion.NombreRemitente) ? configuracion.Name : configuracion.NombreRemitente,
                configuracion.CredentialFromMailAddres));
            mensaje.To.Add(MailboxAddress.Parse(destino));
            mensaje.Subject = string.IsNullOrWhiteSpace(configuracion.Asunto)
                ? "Prueba de configuración SMTP"
                : "Prueba: " + configuracion.Asunto;
            mensaje.Body = new TextPart("html")
            {
                Text = string.IsNullOrWhiteSpace(configuracion.CuerpoHtml)
                    ? "<p>La configuración SMTP se probó correctamente.</p>"
                    : configuracion.CuerpoHtml
            };

            using (var cliente = new MailKit.Net.Smtp.SmtpClient())
            {
                cliente.Timeout = 30000;
                cliente.Connect(configuracion.SmtpHost, configuracion.SmtpPort.Value, ResolverOpcionSeguridad(configuracion));
                cliente.Authenticate(configuracion.CredentialFromMailAddres, password);
                cliente.Send(mensaje);
                cliente.Disconnect(true);
            }
        }

        private static SecureSocketOptions ResolverOpcionSeguridad(EmailServidorRequestDto value)
        {
            return value.UsaSsl.GetValueOrDefault(false) ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
        }

        private static SecureSocketOptions ResolverOpcionSeguridad(EmailServidorInterno value)
        {
            return value.SecureSocketOption.HasValue
                ? (SecureSocketOptions)value.SecureSocketOption.Value
                : (value.UsaSsl.GetValueOrDefault(true) ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
        }

        private static bool ResolverUsaSsl(EmailServidorRequestDto value)
        {
            return ResolverOpcionSeguridad(value) != SecureSocketOptions.None;
        }

        private static string ValidarConfiguracion(EmailServidorRequestDto value, bool requierePassword)
        {
            if (value == null) return "Los datos de configuración son obligatorios.";
            if (string.IsNullOrWhiteSpace(value.SmtpHost) || value.SmtpHost.Length > 100)
                return "El servidor SMTP es obligatorio y admite hasta 100 caracteres.";
            if (!value.SmtpPort.HasValue || value.SmtpPort.Value < 1 || value.SmtpPort.Value > 65535)
                return "El puerto SMTP debe estar entre 1 y 65535.";
            if (!EsEmailValido(value.CredentialFromMailAddres) || value.CredentialFromMailAddres.Length > 100)
                return "La dirección de autenticación SMTP no es válida.";
            if (string.IsNullOrWhiteSpace(value.Name) || value.Name.Length > 100)
                return "El nombre del perfil es obligatorio y admite hasta 100 caracteres.";
            if (requierePassword && string.IsNullOrWhiteSpace(value.CredentialFromMailPass))
                return "La contraseña remitente es obligatoria para crear una configuración.";
            if (!string.IsNullOrWhiteSpace(value.CredentialFromMailPass) && value.CredentialFromMailPass.Length > 180)
                return "La contraseña SMTP admite hasta 180 caracteres.";
            if (value.Asunto != null && value.Asunto.Length > 250)
                return "El asunto admite hasta 250 caracteres.";
            return null;
        }

        private static string ValidarConfiguracion(EmailServidorInterno value)
        {
            return ValidarConfiguracion(new EmailServidorRequestDto
            {
                SmtpHost = value.SmtpHost,
                SmtpPort = value.SmtpPort,
                UsaSsl = value.UsaSsl,
                CredentialFromMailAddres = value.CredentialFromMailAddres,
                Name = value.Name,
                UsaTLS12 = value.UsaTLS12,
                Asunto = value.Asunto,
                CuerpoHtml = value.CuerpoHtml
            }, false);
        }

        private static bool EsEmailValido(string email)
        {
            try
            {
                var direccion = new System.Net.Mail.MailAddress(email ?? string.Empty);
                return string.Equals(direccion.Address, email, StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        private static string ProtegerSecreto(string valor)
        {
            var protegido = MachineKey.Protect(Encoding.UTF8.GetBytes(valor), PasswordPurpose);
            return Convert.ToBase64String(protegido);
        }

        private static string DesprotegerSecreto(string valorProtegido)
        {
            try
            {
                var datos = MachineKey.Unprotect(Convert.FromBase64String(valorProtegido), PasswordPurpose);
                return datos == null ? null : Encoding.UTF8.GetString(datos);
            }
            catch
            {
                return null;
            }
        }

        private static SqlParameter P(string name, object value)
        {
            return new SqlParameter(name, value ?? DBNull.Value);
        }

        private static SGTLAuditContext CrearContexto()
        {
            return new SGTLAuditContext(ConnectionStringHelper.GetConnectionString("SGTLEntities"));
        }

        private static bool EsIdValido(int id)
        {
            return id > 0 && id <= short.MaxValue;
        }

        private static EmailServidorResponseDto BuscarConfiguracion(SGTLAuditContext db, int id)
        {
            return db.Database.SqlQuery<EmailServidorResponseDto>(ConsultaConfiguracion + " WHERE Es_id = @id;", P("@id", id)).FirstOrDefault();
        }

        private static AsignacionModuloResponseDto BuscarAsignacionModulo(SGTLAuditContext db, string modulo)
        {
            return db.Database.SqlQuery<AsignacionModuloResponseDto>(
                "SELECT m.Modulo, e.[Service], e.Es_id AS EmailServidorID, e.[Name] AS Perfil, " +
                "e.CredentialFromMailAddres AS Remitente, m.UrlLogin, " +
                "m.FechaModificacion AT TIME ZONE 'UTC' AS FechaModificacion, m.UsuarioModificacion " +
                "FROM dbo.CONFIGURACION_EMAIL_MODULO m " +
                "INNER JOIN dbo.EmailServidor e ON e.[Service] = m.[Service] " +
                "WHERE m.Modulo = @modulo;", P("@modulo", modulo)).FirstOrDefault();
        }

        private static EmailServidorInterno BuscarConfiguracionInterna(SGTLAuditContext db, int id)
        {
            return db.Database.SqlQuery<EmailServidorInterno>(
                "SELECT Es_id, [Service], SmtpHost, SmtpPort, UsaSsl, CredentialFromMailAddres, [Name], " +
                "SecureSocketOption, UsaTLS12, NombreRemitente, Asunto, CuerpoHtml, CredentialFromMailPassProtegida " +
                "FROM dbo.EmailServidor WHERE Es_id = @id;", P("@id", id)).FirstOrDefault();
        }

        private const string ConsultaConfiguracion =
            "SELECT Es_id, [Service], SmtpHost, SmtpPort, UsaSsl, CredentialFromMailAddres, [Name], UsaTLS12, Asunto, CuerpoHtml, " +
            "CAST(CASE WHEN NULLIF(CredentialFromMailPassProtegida, '') IS NULL THEN 0 ELSE 1 END AS bit) AS TienePassword " +
            "FROM dbo.EmailServidor";

        private static void RegistrarAuditoria(string usuario, string accion, int id, string detalle)
        {
            SGTLAuditContext.RegistrarEvento(
                ConnectionStringHelper.GetConnectionString("SGTLEntities"), usuario, accion,
                "EmailServidor", "Es_id=" + id, detalle);
        }

        private IHttpActionResult RequiereAdministrador(out string usuario)
        {
            usuario = null;
            AuthenticationHeaderValue encabezado = Request.Headers.Authorization;
            if (encabezado == null || !string.Equals(encabezado.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(encabezado.Parameter))
                return Unauthorized();

            try
            {
                SecurityToken token;
                var parametros = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                    ValidateIssuer = true,
                    ValidIssuer = JwtConfig.Issuer,
                    ValidateAudience = true,
                    ValidAudience = JwtConfig.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(2)
                };
                var principal = new JwtSecurityTokenHandler().ValidateToken(encabezado.Parameter, parametros, out token);
                var rol = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role");
                if (rol == null || !string.Equals(rol.Value, "admin", StringComparison.OrdinalIgnoreCase))
                    return Content(HttpStatusCode.Forbidden, new { error = "Solo un administrador puede gestionar el servidor SMTP." });

                var nombre = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "nameid");
                usuario = nombre == null ? "admin" : nombre.Value;
                return null;
            }
            catch
            {
                return Unauthorized();
            }
        }

        private IHttpActionResult ErrorInternoConfiguracion()
        {
            return Content(HttpStatusCode.InternalServerError, new
            {
                error = "No se pudo guardar o recuperar la configuración de correo."
            });
        }
    }
}
