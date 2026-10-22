using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    internal sealed class ConfiguracionEmisionComprobante
    {
        public string Tipo { get; set; }
        public string Descripcion { get; set; }
        public string LetraPredeterminada { get; set; }
        public int NumeradorID { get; set; }
        public int UltimoNumero { get; set; }
        public string SucursalPredeterminada { get; set; }
    }

    internal static class FacturacionComprobantesConfiguracion
    {
        private static SqlParameter P(string name, object value) { return new SqlParameter(name, value ?? DBNull.Value); }

        public static string NormalizarLetra(string letra)
        {
            letra = string.IsNullOrWhiteSpace(letra) ? null : letra.Trim().ToUpperInvariant();
            if (letra != null && letra != "A" && letra != "B" && letra != "X")
                throw new ArgumentException("La letra del comprobante debe ser A, B o X.");
            return letra;
        }

        public static string NormalizarSucursal(string sucursal)
        {
            sucursal = string.IsNullOrWhiteSpace(sucursal) ? null : sucursal.Trim();
            if (sucursal != null && (sucursal.Length > 4 || !sucursal.All(char.IsDigit)))
                throw new ArgumentException("La sucursal debe contener entre uno y cuatro dígitos.");
            return sucursal;
        }

        public static ConfiguracionEmisionComprobante Obtener(SqlConnection connection, SqlTransaction transaction, string tipo)
        {
            const string sql = @"
SELECT c.Tipo,t.Descripcion,c.LetraPredeterminada,c.NumeradorID,n.UltimoNumero,s.Codigo AS SucursalPredeterminada
FROM dbo.FACTURACION_TIPOS_COMPROBANTE c WITH (UPDLOCK,HOLDLOCK)
JOIN dbo.TIPOS_COMPROBANTE t ON t.Tipo=c.Tipo
JOIN dbo.FACTURACION_NUMERADORES n WITH (UPDLOCK,HOLDLOCK) ON n.Numerador_ID=c.NumeradorID AND n.Activo=1
JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID=c.SucursalID AND s.Activa=1
WHERE c.Tipo=@tipo AND c.Activo=1;";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@tipo", tipo));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read())
                        throw new InvalidOperationException("El tipo de comprobante no tiene una configuración de facturación activa.");
                    return new ConfiguracionEmisionComprobante
                    {
                        Tipo = (string)reader["Tipo"],
                        Descripcion = (string)reader["Descripcion"],
                        LetraPredeterminada = ((string)reader["LetraPredeterminada"]).Trim(),
                        NumeradorID = (int)reader["NumeradorID"],
                        UltimoNumero = (int)reader["UltimoNumero"],
                        SucursalPredeterminada = (string)reader["SucursalPredeterminada"]
                    };
                }
            }
        }

        public static void ValidarDatos(SqlConnection connection, SqlTransaction transaction, ref string letra, ref string sucursal,
            ConfiguracionEmisionComprobante configuracion)
        {
            letra = configuracion.Tipo == "REC" ? "X" : NormalizarLetra(letra) ?? configuracion.LetraPredeterminada;
            if (configuracion.Tipo != "REC" && letra != "A" && letra != "B")
                throw new ArgumentException("La letra del comprobante debe ser A o B.");
            sucursal = NormalizarSucursal(sucursal) ?? configuracion.SucursalPredeterminada;
            using (var command = new SqlCommand("SELECT COUNT(*) FROM dbo.FACTURACION_SUCURSALES WHERE Codigo=@codigo AND Activa=1;", connection, transaction))
            {
                command.Parameters.Add(P("@codigo", sucursal));
                if (Convert.ToInt32(command.ExecuteScalar(), CultureInfo.InvariantCulture) != 1)
                    throw new InvalidOperationException("La sucursal seleccionada no está activa en Facturación > Gestionar tipos de comprobante.");
            }
        }

        public static int SiguienteNumero(SqlConnection connection, SqlTransaction transaction, ConfiguracionEmisionComprobante configuracion)
        {
            using (var command = new SqlCommand(@"
UPDATE dbo.FACTURACION_NUMERADORES WITH (UPDLOCK,HOLDLOCK)
SET UltimoNumero=UltimoNumero+1 OUTPUT INSERTED.UltimoNumero
WHERE Numerador_ID=@id AND Activo=1 AND UltimoNumero<99999999;", connection, transaction))
            {
                command.Parameters.Add(P("@id", configuracion.NumeradorID));
                object value = command.ExecuteScalar();
                if (value == null) throw new InvalidOperationException("El numerador configurado no existe, está inactivo o fue agotado.");
                return Convert.ToInt32(value, CultureInfo.InvariantCulture);
            }
        }

        public static string NumeroVisible(int numero)
        {
            return numero.ToString("D8", CultureInfo.InvariantCulture);
        }
    }

    [RoutePrefix("api/facturacion-config")]
    public class FacturacionConfiguracionController : ApiController
    {
        public class SucursalRequest { public string Codigo { get; set; } public string Nombre { get; set; } public bool Activa { get; set; } }
        public class NumeradorRequest { public string Nombre { get; set; } public int UltimoNumero { get; set; } public bool Activo { get; set; } }
        public class TipoRequest { public string Tipo { get; set; } public string Descripcion { get; set; } public string Impacto { get; set; } public string LetraPredeterminada { get; set; } public int SucursalID { get; set; } public int NumeradorID { get; set; } public bool Activo { get; set; } }
        private class UsuarioSesion { public int UsuarioID { get; set; } public string Nombre { get; set; } public bool EsAdmin { get; set; } }

        private static string ConnectionString()
        {
            return new EntityConnectionStringBuilder(ConnectionStringHelper.GetConnectionString("SGTLEntities")).ProviderConnectionString;
        }
        private static SqlParameter P(string name, object value) { return new SqlParameter(name, value ?? DBNull.Value); }

        // Texto para la pantalla (§9 del design system): las validaciones traen un mensaje para el usuario y un
        // código repetido se explica; el resto (base de datos, red) es técnico y no se muestra.
        private static string MensajeParaUsuario(Exception ex)
        {
            if (ex is ArgumentException || ex is InvalidOperationException) return ex.Message;
            var sql = ex as SqlException;
            if (sql != null && (sql.Number == 2627 || sql.Number == 2601)) return "Ya existe un registro con ese código.";
            return "No se pudo completar la operación. Probá de nuevo.";
        }

        private string NombreToken()
        {
            var authorization = Request == null ? null : Request.Headers.Authorization;
            if (authorization == null || !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(authorization.Parameter)) throw new UnauthorizedAccessException();
            var handler = new JwtSecurityTokenHandler();
            SecurityToken validated;
            var principal = handler.ValidateToken(authorization.Parameter, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfig.SecretKey)),
                ValidateIssuer = true, ValidIssuer = JwtConfig.Issuer, ValidateAudience = true, ValidAudience = JwtConfig.Audience,
                ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1)
            }, out validated);
            var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || string.IsNullOrWhiteSpace(claim.Value)) throw new UnauthorizedAccessException();
            return claim.Value;
        }

        private UsuarioSesion ValidarUsuario(SqlConnection connection, bool requiereAdmin)
        {
            string nombre = NombreToken();
            using (var command = new SqlCommand(@"
SELECT TOP (1) Usuario_ID,Nombre_Usuario,
 CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(Rol,''))))='admin' THEN 1 ELSE 0 END AS EsAdmin
FROM dbo.USUARIOS WHERE Nombre_Usuario=@usuario AND EstadoUsuario='Activo';", connection))
            {
                command.Parameters.Add(P("@usuario", nombre));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) throw new UnauthorizedAccessException();
                    var usuario = new UsuarioSesion { UsuarioID = (int)reader["Usuario_ID"], Nombre = (string)reader["Nombre_Usuario"], EsAdmin = (int)reader["EsAdmin"] == 1 };
                    if (requiereAdmin && !usuario.EsAdmin) throw new InvalidOperationException("Solo un administrador puede modificar la configuración de facturación.");
                    return usuario;
                }
            }
        }

        private static string TipoSeguro(string tipo)
        {
            tipo = (tipo ?? string.Empty).Trim().ToUpperInvariant();
            if (tipo != "FAC" && tipo != "REC" && tipo != "NC" && tipo != "ND") throw new ArgumentException("El tipo de comprobante no es válido.");
            return tipo;
        }
        private static string CodigoTipo(string tipo)
        {
            tipo = (tipo ?? string.Empty).Trim().ToUpperInvariant();
            if (tipo.Length == 0 || tipo.Length > 3 || tipo.Any(c => !((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'))))
                throw new ArgumentException("El código del tipo debe contener entre uno y tres caracteres alfanuméricos.");
            return tipo;
        }
        private static string ImpactoSeguro(string impacto)
        {
            impacto = (impacto ?? string.Empty).Trim().ToUpperInvariant();
            if (impacto != "D" && impacto != "C") throw new ArgumentException("El impacto debe ser Deuda o Crédito.");
            return impacto;
        }
        private static string CodigoSucursal(string codigo)
        {
            codigo = FacturacionComprobantesConfiguracion.NormalizarSucursal(codigo);
            if (codigo == null) throw new ArgumentException("El código de sucursal es obligatorio.");
            return codigo.PadLeft(4, '0');
        }
        private static void ValidarNumerador(NumeradorRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Nombre) || request.Nombre.Trim().Length > 100) throw new ArgumentException("El nombre del numerador es obligatorio y no puede superar los 100 caracteres.");
            if (request.UltimoNumero < 0 || request.UltimoNumero > 99999999) throw new ArgumentException("El último número debe estar entre 0 y 99999999.");
        }
        private static void ValidarTipo(string tipo, TipoRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Descripcion) || request.Descripcion.Trim().Length > 50) throw new ArgumentException("La descripción es obligatoria y no puede superar los 50 caracteres.");
            string impacto = ImpactoSeguro(request.Impacto);
            string letra = FacturacionComprobantesConfiguracion.NormalizarLetra(request.LetraPredeterminada);
            if (tipo == "REC" && letra != "X") throw new ArgumentException("Los recibos tienen que usar la letra X.");
            if (tipo != "REC" && letra != "A" && letra != "B") throw new ArgumentException("La letra predeterminada debe ser A o B.");
            if ((tipo == "FAC" || tipo == "ND") && impacto != "D") throw new ArgumentException("Las facturas y las notas de débito tienen que generar deuda.");
            if ((tipo == "NC" || tipo == "REC") && impacto != "C") throw new ArgumentException("Las notas de crédito y los recibos tienen que generar crédito.");
            if (request.SucursalID <= 0 || request.NumeradorID <= 0) throw new ArgumentException("Seleccioná una sucursal y un numerador.");
            request.Impacto = impacto;
        }
        private static void ValidarDependenciasActivas(SqlConnection connection, SqlTransaction transaction, TipoRequest request)
        {
            using (var validar = new SqlCommand("SELECT (SELECT COUNT(*) FROM dbo.FACTURACION_SUCURSALES WHERE Sucursal_ID=@sucursal AND Activa=1) + (SELECT COUNT(*) FROM dbo.FACTURACION_NUMERADORES WHERE Numerador_ID=@numerador AND Activo=1);", connection, transaction))
            {
                validar.Parameters.AddRange(new[] { P("@sucursal", request.SucursalID), P("@numerador", request.NumeradorID) });
                if (Convert.ToInt32(validar.ExecuteScalar(), CultureInfo.InvariantCulture) != 2)
                    throw new ArgumentException("La sucursal o el numerador seleccionados no están activos.");
            }
        }
        private static void Auditar(SqlConnection connection, UsuarioSesion usuario, string accion, string clave, string detalle)
        {
            using (var command = new SqlCommand(@"INSERT dbo.AUDITORIA (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen)
VALUES (GETDATE(),@usuario,@accion,'FACTURACION_CONFIG',@clave,NULL,@detalle,'Configuración');", connection))
            {
                command.Parameters.AddRange(new[] { P("@usuario", usuario.Nombre), P("@accion", accion), P("@clave", clave), P("@detalle", detalle) });
                command.ExecuteNonQuery();
            }
        }

        [HttpGet, Route("sucursales")]
        public IHttpActionResult Sucursales(bool incluirInactivas = false)
        {
            try { using (var c = new SqlConnection(ConnectionString())) { c.Open(); ValidarUsuario(c, false);
                using (var cmd = new SqlCommand("SELECT Sucursal_ID AS SucursalID,Codigo,Nombre,Activa FROM dbo.FACTURACION_SUCURSALES WHERE (@todos=1 OR Activa=1) ORDER BY Codigo;", c)) { cmd.Parameters.Add(P("@todos", incluirInactivas ? 1 : 0)); using (var r = cmd.ExecuteReader()) { var datos = new List<object>(); while (r.Read()) datos.Add(new { SucursalID = (int)r["SucursalID"], Codigo = (string)r["Codigo"], Nombre = (string)r["Nombre"], Activa = (bool)r["Activa"] }); return Ok(datos); } } } }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpPost, Route("sucursales")]
        public IHttpActionResult CrearSucursal([FromBody] SucursalRequest request)
        {
            try { request.Codigo = CodigoSucursal(request == null ? null : request.Codigo); if (request == null || string.IsNullOrWhiteSpace(request.Nombre) || request.Nombre.Trim().Length > 100) throw new ArgumentException("El nombre de la sucursal es obligatorio."); using (var c = new SqlConnection(ConnectionString())) { c.Open(); var u = ValidarUsuario(c, true); using (var cmd = new SqlCommand("INSERT dbo.FACTURACION_SUCURSALES (Codigo,Nombre,Activa) OUTPUT INSERTED.Sucursal_ID VALUES (@codigo,@nombre,@activa);", c)) { cmd.Parameters.AddRange(new[] { P("@codigo", request.Codigo), P("@nombre", request.Nombre.Trim()), P("@activa", request.Activa) }); var id = Convert.ToInt32(cmd.ExecuteScalar(), CultureInfo.InvariantCulture); Auditar(c, u, "ALTA", "Sucursal_ID=" + id, "Sucursal " + request.Codigo); return Content(HttpStatusCode.Created, new { SucursalID = id }); } } }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpPut, Route("sucursales/{id:int}")]
        public IHttpActionResult EditarSucursal(int id, [FromBody] SucursalRequest request)
        {
            try { request.Codigo = CodigoSucursal(request == null ? null : request.Codigo); if (request == null || string.IsNullOrWhiteSpace(request.Nombre) || request.Nombre.Trim().Length > 100) throw new ArgumentException("El nombre de la sucursal es obligatorio."); using (var c = new SqlConnection(ConnectionString())) { c.Open(); var u = ValidarUsuario(c, true); using (var cmd = new SqlCommand("UPDATE dbo.FACTURACION_SUCURSALES SET Codigo=@codigo,Nombre=@nombre,Activa=@activa WHERE Sucursal_ID=@id;", c)) { cmd.Parameters.AddRange(new[] { P("@codigo", request.Codigo), P("@nombre", request.Nombre.Trim()), P("@activa", request.Activa), P("@id", id) }); if (cmd.ExecuteNonQuery() == 0) return NotFound(); Auditar(c, u, "MODIFICAR", "Sucursal_ID=" + id, "Sucursal " + request.Codigo); return Ok(); } } }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpDelete, Route("sucursales/{id:int}")]
        public IHttpActionResult DesactivarSucursal(int id)
        {
            try { using (var c = new SqlConnection(ConnectionString())) { c.Open(); var u = ValidarUsuario(c, true); using (var cmd = new SqlCommand("UPDATE dbo.FACTURACION_SUCURSALES SET Activa=0 WHERE Sucursal_ID=@id;", c)) { cmd.Parameters.Add(P("@id", id)); if (cmd.ExecuteNonQuery() == 0) return NotFound(); Auditar(c, u, "BAJA", "Sucursal_ID=" + id, "Sucursal desactivada"); return Ok(); } } }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpGet, Route("numeradores")]
        public IHttpActionResult Numeradores(bool incluirInactivos = false)
        {
            try { using (var c = new SqlConnection(ConnectionString())) { c.Open(); ValidarUsuario(c, false); using (var cmd = new SqlCommand("SELECT Numerador_ID AS NumeradorID,Nombre,UltimoNumero,Activo FROM dbo.FACTURACION_NUMERADORES WHERE (@todos=1 OR Activo=1) ORDER BY Nombre;", c)) { cmd.Parameters.Add(P("@todos", incluirInactivos ? 1 : 0)); using (var r = cmd.ExecuteReader()) { var datos = new List<object>(); while (r.Read()) datos.Add(new { NumeradorID = (int)r["NumeradorID"], Nombre = (string)r["Nombre"], UltimoNumero = (int)r["UltimoNumero"], Activo = (bool)r["Activo"] }); return Ok(datos); } } } }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpPost, Route("numeradores")]
        public IHttpActionResult CrearNumerador([FromBody] NumeradorRequest request)
        {
            try { ValidarNumerador(request); using (var c = new SqlConnection(ConnectionString())) { c.Open(); var u = ValidarUsuario(c, true); using (var cmd = new SqlCommand("INSERT dbo.FACTURACION_NUMERADORES (Nombre,UltimoNumero,Activo) OUTPUT INSERTED.Numerador_ID VALUES (@nombre,@ultimo,@activo);", c)) { cmd.Parameters.AddRange(new[] { P("@nombre", request.Nombre.Trim()), P("@ultimo", request.UltimoNumero), P("@activo", request.Activo) }); var id = Convert.ToInt32(cmd.ExecuteScalar(), CultureInfo.InvariantCulture); Auditar(c, u, "ALTA", "Numerador_ID=" + id, "Numerador " + request.Nombre.Trim()); return Content(HttpStatusCode.Created, new { NumeradorID = id }); } } }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpPut, Route("numeradores/{id:int}")]
        public IHttpActionResult EditarNumerador(int id, [FromBody] NumeradorRequest request)
        {
            try { ValidarNumerador(request); using (var c = new SqlConnection(ConnectionString())) { c.Open(); var u = ValidarUsuario(c, true); using (var cmd = new SqlCommand("UPDATE dbo.FACTURACION_NUMERADORES SET Nombre=@nombre,UltimoNumero=@ultimo,Activo=@activo WHERE Numerador_ID=@id;", c)) { cmd.Parameters.AddRange(new[] { P("@nombre", request.Nombre.Trim()), P("@ultimo", request.UltimoNumero), P("@activo", request.Activo), P("@id", id) }); if (cmd.ExecuteNonQuery() == 0) return NotFound(); Auditar(c, u, "MODIFICAR", "Numerador_ID=" + id, "Numerador " + request.Nombre.Trim()); return Ok(); } } }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpDelete, Route("numeradores/{id:int}")]
        public IHttpActionResult DesactivarNumerador(int id)
        {
            try { using (var c = new SqlConnection(ConnectionString())) { c.Open(); var u = ValidarUsuario(c, true); using (var cmd = new SqlCommand("UPDATE dbo.FACTURACION_NUMERADORES SET Activo=0 WHERE Numerador_ID=@id;", c)) { cmd.Parameters.Add(P("@id", id)); if (cmd.ExecuteNonQuery() == 0) return NotFound(); Auditar(c, u, "BAJA", "Numerador_ID=" + id, "Numerador desactivado"); return Ok(); } } }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpGet, Route("tipos-comprobante")]
        public IHttpActionResult Tipos()
        {
            try { using (var c = new SqlConnection(ConnectionString())) { c.Open(); ValidarUsuario(c, false); using (var cmd = new SqlCommand(@"SELECT t.Tipo,t.Descripcion,t.Impacto,c.LetraPredeterminada,c.SucursalID,s.Codigo AS Sucursal,c.NumeradorID,n.Nombre AS Numerador,c.Activo
FROM dbo.TIPOS_COMPROBANTE t LEFT JOIN dbo.FACTURACION_TIPOS_COMPROBANTE c ON c.Tipo=t.Tipo
LEFT JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID=c.SucursalID LEFT JOIN dbo.FACTURACION_NUMERADORES n ON n.Numerador_ID=c.NumeradorID ORDER BY t.Tipo;", c)) { using (var r = cmd.ExecuteReader()) { var datos = new List<object>(); while (r.Read()) datos.Add(new { Tipo = (string)r["Tipo"], Descripcion = (string)r["Descripcion"], Impacto = (string)r["Impacto"], LetraPredeterminada = r["LetraPredeterminada"] as string, SucursalID = r["SucursalID"] == DBNull.Value ? (int?)null : (int)r["SucursalID"], Sucursal = r["Sucursal"] as string, NumeradorID = r["NumeradorID"] == DBNull.Value ? (int?)null : (int)r["NumeradorID"], Numerador = r["Numerador"] as string, Activo = r["Activo"] != DBNull.Value && (bool)r["Activo"] }); return Ok(datos); } } } }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpPost, Route("tipos-comprobante")]
        public IHttpActionResult CrearTipo([FromBody] TipoRequest request)
        {
            try
            {
                string tipo = CodigoTipo(request == null ? null : request.Tipo);
                ValidarTipo(tipo, request);
                string letra = FacturacionComprobantesConfiguracion.NormalizarLetra(request.LetraPredeterminada);
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open(); var u = ValidarUsuario(c, true);
                    using (var tx = c.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            ValidarDependenciasActivas(c, tx, request);
                            using (var existe = new SqlCommand("SELECT COUNT(*) FROM dbo.TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE Tipo=@tipo;", c, tx))
                            {
                                existe.Parameters.Add(P("@tipo", tipo));
                                if (Convert.ToInt32(existe.ExecuteScalar(), CultureInfo.InvariantCulture) != 0)
                                    throw new ArgumentException("Ya existe un tipo de comprobante con ese código.");
                            }
                            using (var cmd = new SqlCommand(@"
INSERT dbo.TIPOS_COMPROBANTE (Tipo,Descripcion,Impacto) VALUES (@tipo,@descripcion,@impacto);
INSERT dbo.FACTURACION_TIPOS_COMPROBANTE (Tipo,LetraPredeterminada,SucursalID,NumeradorID,Activo)
VALUES (@tipo,@letra,@sucursal,@numerador,@activo);", c, tx))
                            {
                                cmd.Parameters.AddRange(new[] { P("@tipo", tipo), P("@descripcion", request.Descripcion.Trim()), P("@impacto", request.Impacto), P("@letra", letra), P("@sucursal", request.SucursalID), P("@numerador", request.NumeradorID), P("@activo", request.Activo) });
                                cmd.ExecuteNonQuery();
                            }
                            tx.Commit(); Auditar(c, u, "ALTA", "Tipo=" + tipo, "Configuración de " + tipo); return Content(HttpStatusCode.Created, new { Tipo = tipo });
                        }
                        catch { if (tx.Connection != null) tx.Rollback(); throw; }
                    }
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpPut, Route("tipos-comprobante/{tipo}")]
        public IHttpActionResult GuardarTipo(string tipo, [FromBody] TipoRequest request)
        {
            try
            {
                tipo = CodigoTipo(tipo); ValidarTipo(tipo, request);
                if (!string.IsNullOrWhiteSpace(request.Tipo) && CodigoTipo(request.Tipo) != tipo)
                    throw new ArgumentException("El código del tipo de comprobante no se puede modificar.");
                string letra = FacturacionComprobantesConfiguracion.NormalizarLetra(request.LetraPredeterminada);
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open(); var u = ValidarUsuario(c, true);
                    using (var tx = c.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            ValidarDependenciasActivas(c, tx, request);
                            string impactoActual;
                            using (var existente = new SqlCommand("SELECT Impacto FROM dbo.TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE Tipo=@tipo;", c, tx))
                            {
                                existente.Parameters.Add(P("@tipo", tipo));
                                impactoActual = existente.ExecuteScalar() as string;
                            }
                            if (impactoActual == null) return NotFound();
                            if (!string.Equals(impactoActual.Trim(), request.Impacto, StringComparison.OrdinalIgnoreCase))
                                throw new ArgumentException("El impacto no se puede modificar una vez creado el tipo de comprobante.");
                            using (var cmd = new SqlCommand(@"
UPDATE dbo.TIPOS_COMPROBANTE SET Descripcion=@descripcion WHERE Tipo=@tipo;
MERGE dbo.FACTURACION_TIPOS_COMPROBANTE AS destino USING (SELECT @tipo AS Tipo) AS origen ON destino.Tipo=origen.Tipo
WHEN MATCHED THEN UPDATE SET LetraPredeterminada=@letra,SucursalID=@sucursal,NumeradorID=@numerador,Activo=@activo,FechaModificacion=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (Tipo,LetraPredeterminada,SucursalID,NumeradorID,Activo) VALUES (@tipo,@letra,@sucursal,@numerador,@activo);", c, tx))
                            {
                                cmd.Parameters.AddRange(new[] { P("@descripcion", request.Descripcion.Trim()), P("@tipo", tipo), P("@letra", letra), P("@sucursal", request.SucursalID), P("@numerador", request.NumeradorID), P("@activo", request.Activo) });
                                cmd.ExecuteNonQuery();
                            }
                            tx.Commit(); Auditar(c, u, "MODIFICAR", "Tipo=" + tipo, "Configuración de " + tipo); return Ok();
                        }
                        catch { if (tx.Connection != null) tx.Rollback(); throw; }
                    }
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpDelete, Route("tipos-comprobante/{tipo}")]
        public IHttpActionResult DesactivarTipo(string tipo)
        {
            try
            {
                tipo = CodigoTipo(tipo);
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open(); var u = ValidarUsuario(c, true);
                    using (var cmd = new SqlCommand("UPDATE dbo.FACTURACION_TIPOS_COMPROBANTE SET Activo=0,FechaModificacion=SYSUTCDATETIME() WHERE Tipo=@tipo;", c))
                    {
                        cmd.Parameters.Add(P("@tipo", tipo));
                        if (cmd.ExecuteNonQuery() == 0) return NotFound();
                    }
                    Auditar(c, u, "BAJA", "Tipo=" + tipo, "Tipo de comprobante desactivado"); return Ok();
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpGet, Route("emision/{tipo}")]
        public IHttpActionResult Emision(string tipo)
        {
            try { tipo = TipoSeguro(tipo); using (var c = new SqlConnection(ConnectionString())) { c.Open(); ValidarUsuario(c, false); var cfg = FacturacionComprobantesConfiguracion.Obtener(c, null, tipo); using (var cmd = new SqlCommand("SELECT Codigo,Nombre FROM dbo.FACTURACION_SUCURSALES WHERE Activa=1 ORDER BY Codigo;", c)) using (var r = cmd.ExecuteReader()) { var sucursales = new List<object>(); while (r.Read()) sucursales.Add(new { Codigo = (string)r["Codigo"], Nombre = (string)r["Nombre"] }); return Ok(new { cfg.Tipo, cfg.Descripcion, LetraPredeterminada = cfg.Tipo == "REC" ? "X" : cfg.LetraPredeterminada, SucursalPredeterminada = cfg.SucursalPredeterminada, ProximoNumero = FacturacionComprobantesConfiguracion.NumeroVisible(cfg.UltimoNumero + 1), Letras = cfg.Tipo == "REC" ? new[] { "X" } : new[] { "A", "B" }, Sucursales = sucursales }); } } }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }
    }
}
