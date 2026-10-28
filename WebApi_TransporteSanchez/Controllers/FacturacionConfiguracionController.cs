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
        public string Impacto { get; set; }
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

        public static ConfiguracionEmisionComprobante Obtener(SqlConnection connection, SqlTransaction transaction, string tipo, string letra = null)
        {
            letra = NormalizarLetra(letra);
            const string sql = @"
SELECT TOP (1) c.Tipo,t.Descripcion,t.Impacto,c.LetraPredeterminada,c.NumeradorID,n.UltimoNumero,s.Codigo AS SucursalPredeterminada
FROM dbo.FACTURACION_TIPOS_COMPROBANTE c WITH (UPDLOCK,HOLDLOCK)
JOIN dbo.TIPOS_COMPROBANTE t ON t.Tipo=c.Tipo
JOIN dbo.FACTURACION_NUMERADORES n WITH (UPDLOCK,HOLDLOCK) ON n.Numerador_ID=c.NumeradorID AND n.Activo=1 AND n.UltimoNumero<99999999
JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID=c.SucursalID AND s.Activa=1
WHERE c.Tipo=@tipo AND c.Activo=1 AND (@letra IS NULL OR c.LetraPredeterminada=@letra)
ORDER BY CASE WHEN c.LetraPredeterminada='A' THEN 0 WHEN c.LetraPredeterminada='B' THEN 1 ELSE 2 END;";
            using (var command = new SqlCommand(sql, connection, transaction))
            {
                command.Parameters.Add(P("@tipo", tipo));
                command.Parameters.Add(P("@letra", letra));
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read())
                        throw new InvalidOperationException("El tipo de comprobante no tiene una configuración de facturación activa.");
                    return new ConfiguracionEmisionComprobante
                    {
                        Tipo = (string)reader["Tipo"],
                        Descripcion = (string)reader["Descripcion"],
                        Impacto = (string)reader["Impacto"],
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
            if (letra != configuracion.LetraPredeterminada)
                throw new InvalidOperationException("El tipo de comprobante no tiene una configuración de facturación activa para esa letra.");
            sucursal = NormalizarSucursal(sucursal) ?? configuracion.SucursalPredeterminada;
            if (sucursal != configuracion.SucursalPredeterminada)
                throw new InvalidOperationException("La sucursal seleccionada no corresponde al tipo de comprobante y letra.");
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
        public class EstadoSucursalRequest { public bool? Activa { get; set; } }
        public class NumeradorRequest { public string Nombre { get; set; } public int UltimoNumero { get; set; } public bool Activo { get; set; } }
        public class EstadoActivoRequest { public bool? Activo { get; set; } }
        public class TipoRequest { public string Tipo { get; set; } public string TipoOriginal { get; set; } public string Descripcion { get; set; } public string Impacto { get; set; } public string LetraPredeterminada { get; set; } public string LetraOriginal { get; set; } public int SucursalID { get; set; } public int NumeradorID { get; set; } public bool Activo { get; set; } public bool EsElectronico { get; set; } }
        private class UsuarioSesion { public int UsuarioID { get; set; } public string Nombre { get; set; } public bool EsAdmin { get; set; } }

        private static string ConnectionString()
        {
            return new EntityConnectionStringBuilder(ConnectionStringHelper.GetConnectionString("SGTLEntities")).ProviderConnectionString;
        }
        private static SqlParameter P(string name, object value) { return new SqlParameter(name, value ?? DBNull.Value); }

        // Texto para la pantalla (§9 del design system): las validaciones traen un mensaje para el usuario y un
        // un dato repetido se explica; el resto (base de datos, red) es técnico y no se muestra.
        private static string MensajeParaUsuario(Exception ex)
        {
            if (ex is ArgumentException || ex is InvalidOperationException) return ex.Message;
            var sql = ex as SqlException;
            if (sql != null && (sql.Number == 2627 || sql.Number == 2601)) return "Ya existe un registro con esos datos.";
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

        private static string CodigoTipo(string tipo)
        {
            tipo = (tipo ?? string.Empty).Trim().ToUpperInvariant();
            if (tipo.Length == 0 || tipo.Length > 3 || tipo.Any(c => !((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'))))
                throw new ArgumentException("La sigla del tipo debe contener entre uno y tres caracteres alfanuméricos.");
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
            ValidarDependenciasActivas(connection, transaction, request.SucursalID, request.NumeradorID);
        }
        private static void ValidarDependenciasActivas(SqlConnection connection, SqlTransaction transaction, int sucursalId, int numeradorId)
        {
            using (var validar = new SqlCommand("SELECT (SELECT COUNT(*) FROM dbo.FACTURACION_SUCURSALES WHERE Sucursal_ID=@sucursal AND Activa=1) + (SELECT COUNT(*) FROM dbo.FACTURACION_NUMERADORES WHERE Numerador_ID=@numerador AND Activo=1);", connection, transaction))
            {
                validar.Parameters.AddRange(new[] { P("@sucursal", sucursalId), P("@numerador", numeradorId) });
                if (Convert.ToInt32(validar.ExecuteScalar(), CultureInfo.InvariantCulture) != 2)
                    throw new ArgumentException("La sucursal o el numerador seleccionados no están activos.");
            }
        }
        private static void Auditar(SqlConnection connection, UsuarioSesion usuario, string accion, string clave, string detalle, SqlTransaction transaction = null)
        {
            using (var command = new SqlCommand(@"INSERT dbo.AUDITORIA (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen)
VALUES (GETDATE(),@usuario,@accion,'FACTURACION_CONFIG',@clave,NULL,@detalle,'Configuración');", connection, transaction))
            {
                command.Parameters.AddRange(new[] { P("@usuario", usuario.Nombre), P("@accion", accion), P("@clave", clave), P("@detalle", detalle) });
                command.ExecuteNonQuery();
            }
        }

        [HttpGet, Route("sucursales")]
        public IHttpActionResult Sucursales(bool incluirInactivas = false)
        {
            try { using (var c = new SqlConnection(ConnectionString())) { c.Open(); ValidarUsuario(c, false);
                using (var cmd = new SqlCommand(@"SELECT s.Sucursal_ID AS SucursalID,s.Codigo,s.Nombre,s.Activa,
CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.FACTURACION_TIPOS_COMPROBANTE t WHERE t.SucursalID=s.Sucursal_ID)
    OR EXISTS (SELECT 1 FROM dbo.COMPROBANTES c WHERE c.Sucursal=s.Codigo)
    THEN 0 ELSE 1 END AS bit) AS PuedeEliminar
FROM dbo.FACTURACION_SUCURSALES s WHERE (@todos=1 OR s.Activa=1) ORDER BY s.Codigo;", c)) { cmd.Parameters.Add(P("@todos", incluirInactivas ? 1 : 0)); using (var r = cmd.ExecuteReader()) { var datos = new List<object>(); while (r.Read()) datos.Add(new { SucursalID = (int)r["SucursalID"], Codigo = (string)r["Codigo"], Nombre = (string)r["Nombre"], Activa = (bool)r["Activa"], PuedeEliminar = (bool)r["PuedeEliminar"] }); return Ok(datos); } } } }
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
            try
            {
                request.Codigo = CodigoSucursal(request == null ? null : request.Codigo);
                if (string.IsNullOrWhiteSpace(request.Nombre) || request.Nombre.Trim().Length > 100)
                    throw new ArgumentException("El nombre de la sucursal es obligatorio.");
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open(); var u = ValidarUsuario(c, true);
                    using (var tx = c.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            string codigoActual;
                            bool estabaActiva;
                            using (var cmd = new SqlCommand("SELECT Codigo,Activa FROM dbo.FACTURACION_SUCURSALES WITH (XLOCK,HOLDLOCK) WHERE Sucursal_ID=@id;", c, tx))
                            {
                                cmd.Parameters.Add(P("@id", id));
                                using (var r = cmd.ExecuteReader())
                                {
                                    if (!r.Read()) { codigoActual = null; estabaActiva = false; }
                                    else { codigoActual = (string)r["Codigo"]; estabaActiva = (bool)r["Activa"]; }
                                }
                            }
                            if (codigoActual == null) { tx.Rollback(); return NotFound(); }
                            if (codigoActual != request.Codigo)
                            {
                                using (var cmd = new SqlCommand("SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK) WHERE Sucursal=@codigo) THEN 1 ELSE 0 END;", c, tx))
                                {
                                    cmd.Parameters.Add(P("@codigo", codigoActual));
                                    if ((int)cmd.ExecuteScalar() != 0)
                                    {
                                        tx.Rollback();
                                        return Content(HttpStatusCode.Conflict, new { error = "No se puede cambiar el código de la sucursal: figura en un comprobante." });
                                    }
                                }
                            }
                            using (var cmd = new SqlCommand("UPDATE dbo.FACTURACION_SUCURSALES SET Codigo=@codigo,Nombre=@nombre,Activa=@activa WHERE Sucursal_ID=@id;", c, tx))
                            {
                                cmd.Parameters.AddRange(new[] { P("@codigo", request.Codigo), P("@nombre", request.Nombre.Trim()), P("@activa", request.Activa), P("@id", id) });
                                cmd.ExecuteNonQuery();
                            }
                            var baja = estabaActiva && !request.Activa;
                            Auditar(c, u, baja ? "BAJA" : "MODIFICAR", "Sucursal_ID=" + id,
                                baja ? "Sucursal inactivada" : "Sucursal " + request.Codigo, tx);
                            tx.Commit();
                            return Ok();
                        }
                        catch { if (tx.Connection != null) tx.Rollback(); throw; }
                    }
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpPut, Route("sucursales/{id:int}/estado")]
        public IHttpActionResult CambiarEstadoSucursal(int id, [FromBody] EstadoSucursalRequest request)
        {
            try
            {
                if (request == null || !request.Activa.HasValue) throw new ArgumentException("Seleccioná el estado de la sucursal.");
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open(); var u = ValidarUsuario(c, true);
                    using (var tx = c.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            object anterior;
                            using (var cmd = new SqlCommand("SELECT Activa FROM dbo.FACTURACION_SUCURSALES WITH (XLOCK,HOLDLOCK) WHERE Sucursal_ID=@id;", c, tx))
                            {
                                cmd.Parameters.Add(P("@id", id));
                                anterior = cmd.ExecuteScalar();
                            }
                            if (anterior == null) { tx.Rollback(); return NotFound(); }
                            if ((bool)anterior != request.Activa.Value)
                            {
                                using (var cmd = new SqlCommand("UPDATE dbo.FACTURACION_SUCURSALES SET Activa=@activa WHERE Sucursal_ID=@id;", c, tx))
                                {
                                    cmd.Parameters.AddRange(new[] { P("@activa", request.Activa.Value), P("@id", id) });
                                    cmd.ExecuteNonQuery();
                                }
                                var baja = (bool)anterior && !request.Activa.Value;
                                Auditar(c, u, baja ? "BAJA" : "MODIFICAR", "Sucursal_ID=" + id,
                                    baja ? "Sucursal inactivada" : "Sucursal activada", tx);
                            }
                            tx.Commit();
                            return Ok();
                        }
                        catch { if (tx.Connection != null) tx.Rollback(); throw; }
                    }
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpDelete, Route("sucursales/{id:int}")]
        public IHttpActionResult EliminarSucursal(int id)
        {
            const string relacion = "No se puede eliminar la sucursal: está relacionada con un tipo de comprobante o con un comprobante.";
            try
            {
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open(); var u = ValidarUsuario(c, true);
                    using (var tx = c.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            // La emisión bloquea primero la configuración y después la sucursal.
                            using (var cmd = new SqlCommand("SELECT TOP (1) 1 FROM dbo.FACTURACION_TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE SucursalID=@id;", c, tx))
                            {
                                cmd.Parameters.Add(P("@id", id));
                                if (cmd.ExecuteScalar() != null) { tx.Rollback(); return Content(HttpStatusCode.Conflict, new { error = relacion }); }
                            }
                            string codigo;
                            using (var cmd = new SqlCommand("SELECT Codigo FROM dbo.FACTURACION_SUCURSALES WITH (XLOCK,HOLDLOCK) WHERE Sucursal_ID=@id;", c, tx))
                            {
                                cmd.Parameters.Add(P("@id", id));
                                codigo = cmd.ExecuteScalar() as string;
                            }
                            if (codigo == null) { tx.Rollback(); return NotFound(); }
                            using (var cmd = new SqlCommand("SELECT TOP (1) 1 FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK) WHERE Sucursal=@codigo;", c, tx))
                            {
                                cmd.Parameters.Add(P("@codigo", codigo));
                                if (cmd.ExecuteScalar() != null) { tx.Rollback(); return Content(HttpStatusCode.Conflict, new { error = relacion }); }
                            }
                            using (var cmd = new SqlCommand("DELETE FROM dbo.FACTURACION_SUCURSALES WHERE Sucursal_ID=@id;", c, tx))
                            {
                                cmd.Parameters.Add(P("@id", id));
                                cmd.ExecuteNonQuery();
                            }
                            Auditar(c, u, "ELIMINAR", "Sucursal_ID=" + id, "Sucursal " + codigo + " eliminada", tx);
                            tx.Commit();
                            return Ok();
                        }
                        catch { if (tx.Connection != null) tx.Rollback(); throw; }
                    }
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); }
            catch (SqlException ex) { return Content(ex.Number == 547 ? HttpStatusCode.Conflict : HttpStatusCode.BadRequest, new { error = ex.Number == 547 ? relacion : MensajeParaUsuario(ex) }); }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpGet, Route("numeradores")]
        public IHttpActionResult Numeradores(bool incluirInactivos = false)
        {
            try { using (var c = new SqlConnection(ConnectionString())) { c.Open(); ValidarUsuario(c, false); using (var cmd = new SqlCommand(@"SELECT n.Numerador_ID AS NumeradorID,n.Nombre,n.UltimoNumero,n.Activo,
CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.FACTURACION_TIPOS_COMPROBANTE t WHERE t.NumeradorID=n.Numerador_ID)
    THEN 0 ELSE 1 END AS bit) AS PuedeEliminar
FROM dbo.FACTURACION_NUMERADORES n WHERE (@todos=1 OR n.Activo=1) ORDER BY n.Nombre;", c)) { cmd.Parameters.Add(P("@todos", incluirInactivos ? 1 : 0)); using (var r = cmd.ExecuteReader()) { var datos = new List<object>(); while (r.Read()) datos.Add(new { NumeradorID = (int)r["NumeradorID"], Nombre = (string)r["Nombre"], UltimoNumero = (int)r["UltimoNumero"], Activo = (bool)r["Activo"], PuedeEliminar = (bool)r["PuedeEliminar"] }); return Ok(datos); } } } }
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
            try { ValidarNumerador(request); using (var c = new SqlConnection(ConnectionString())) { c.Open(); var u = ValidarUsuario(c, true); using (var cmd = new SqlCommand("UPDATE dbo.FACTURACION_NUMERADORES SET Nombre=@nombre,UltimoNumero=@ultimo,Activo=@activo OUTPUT DELETED.Activo WHERE Numerador_ID=@id;", c)) { cmd.Parameters.AddRange(new[] { P("@nombre", request.Nombre.Trim()), P("@ultimo", request.UltimoNumero), P("@activo", request.Activo), P("@id", id) }); var activoAnterior = cmd.ExecuteScalar(); if (activoAnterior == null) return NotFound(); var baja = (bool)activoAnterior && !request.Activo; Auditar(c, u, baja ? "BAJA" : "MODIFICAR", "Numerador_ID=" + id, baja ? "Numerador inactivado" : "Numerador " + request.Nombre.Trim()); return Ok(); } } }
            catch (UnauthorizedAccessException) { return Unauthorized(); } catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); } catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpPut, Route("numeradores/{id:int}/estado")]
        public IHttpActionResult CambiarEstadoNumerador(int id, [FromBody] EstadoActivoRequest request)
        {
            try
            {
                if (request == null || !request.Activo.HasValue) throw new ArgumentException("Seleccioná el estado del numerador.");
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open(); var u = ValidarUsuario(c, true);
                    using (var tx = c.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            object anterior;
                            using (var cmd = new SqlCommand("SELECT Activo FROM dbo.FACTURACION_NUMERADORES WITH (XLOCK,HOLDLOCK) WHERE Numerador_ID=@id;", c, tx))
                            {
                                cmd.Parameters.Add(P("@id", id));
                                anterior = cmd.ExecuteScalar();
                            }
                            if (anterior == null) { tx.Rollback(); return NotFound(); }
                            if ((bool)anterior != request.Activo.Value)
                            {
                                using (var cmd = new SqlCommand("UPDATE dbo.FACTURACION_NUMERADORES SET Activo=@activo WHERE Numerador_ID=@id;", c, tx))
                                {
                                    cmd.Parameters.AddRange(new[] { P("@activo", request.Activo.Value), P("@id", id) });
                                    cmd.ExecuteNonQuery();
                                }
                                var baja = (bool)anterior && !request.Activo.Value;
                                Auditar(c, u, baja ? "BAJA" : "MODIFICAR", "Numerador_ID=" + id,
                                    baja ? "Numerador inactivado" : "Numerador activado", tx);
                            }
                            tx.Commit();
                            return Ok();
                        }
                        catch { if (tx.Connection != null) tx.Rollback(); throw; }
                    }
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpDelete, Route("numeradores/{id:int}")]
        public IHttpActionResult EliminarNumerador(int id)
        {
            const string relacion = "No se puede eliminar el numerador: está asignado a un tipo de comprobante.";
            try
            {
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open(); var u = ValidarUsuario(c, true);
                    using (var tx = c.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            // La emisión bloquea primero la configuración y después el numerador.
                            using (var cmd = new SqlCommand("SELECT TOP (1) 1 FROM dbo.FACTURACION_TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE NumeradorID=@id;", c, tx))
                            {
                                cmd.Parameters.Add(P("@id", id));
                                if (cmd.ExecuteScalar() != null) { tx.Rollback(); return Content(HttpStatusCode.Conflict, new { error = relacion }); }
                            }
                            string nombre;
                            using (var cmd = new SqlCommand("SELECT Nombre FROM dbo.FACTURACION_NUMERADORES WITH (XLOCK,HOLDLOCK) WHERE Numerador_ID=@id;", c, tx))
                            {
                                cmd.Parameters.Add(P("@id", id));
                                nombre = cmd.ExecuteScalar() as string;
                            }
                            if (nombre == null) { tx.Rollback(); return NotFound(); }
                            using (var cmd = new SqlCommand("DELETE FROM dbo.FACTURACION_NUMERADORES WHERE Numerador_ID=@id;", c, tx))
                            {
                                cmd.Parameters.Add(P("@id", id));
                                cmd.ExecuteNonQuery();
                            }
                            Auditar(c, u, "ELIMINAR", "Numerador_ID=" + id, "Numerador " + nombre + " eliminado", tx);
                            tx.Commit();
                            return Ok();
                        }
                        catch { if (tx.Connection != null) tx.Rollback(); throw; }
                    }
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); }
            catch (SqlException ex) { return Content(ex.Number == 547 ? HttpStatusCode.Conflict : HttpStatusCode.BadRequest, new { error = ex.Number == 547 ? relacion : MensajeParaUsuario(ex) }); }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpGet, Route("tipos-comprobante")]
        public IHttpActionResult Tipos()
        {
            try { using (var c = new SqlConnection(ConnectionString())) { c.Open(); ValidarUsuario(c, false); using (var cmd = new SqlCommand(@"SELECT c.FactTipo_ID,t.Tipo,t.Descripcion,t.Impacto,t.EsElectronico,c.LetraPredeterminada,c.SucursalID,s.Codigo AS Sucursal,c.NumeradorID,n.Nombre AS Numerador,c.Activo,
CAST(CASE WHEN t.EsElectronico=1 OR t.Tipo IN ('FAC','ND','NC','REC')
    OR EXISTS (SELECT 1 FROM dbo.COMPROBANTES comprobante WHERE comprobante.Tipo=t.Tipo)
    THEN 0 ELSE 1 END AS bit) AS PuedeCambiarImpacto,
CAST(CASE WHEN t.EsElectronico=1 OR t.Tipo IN ('FAC','ND','NC','REC')
    THEN 0 ELSE 1 END AS bit) AS PuedeCambiarSigla,
CAST(CASE WHEN t.EsElectronico=1 OR t.Tipo='REC'
    THEN 0 ELSE 1 END AS bit) AS PuedeCambiarLetra,
CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.COMPROBANTES comprobante WHERE comprobante.Tipo=t.Tipo
    AND (comprobante.Letra=c.LetraPredeterminada OR NULLIF(LTRIM(RTRIM(comprobante.Letra)),'') IS NULL))
    THEN 0 ELSE 1 END AS bit) AS PuedeEliminar
FROM dbo.FACTURACION_TIPOS_COMPROBANTE c JOIN dbo.TIPOS_COMPROBANTE t ON t.Tipo=c.Tipo
LEFT JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID=c.SucursalID LEFT JOIN dbo.FACTURACION_NUMERADORES n ON n.Numerador_ID=c.NumeradorID ORDER BY t.Tipo,c.LetraPredeterminada;", c)) { using (var r = cmd.ExecuteReader()) { var datos = new List<object>(); while (r.Read()) datos.Add(new { FactTipo_ID = (int)r["FactTipo_ID"], Tipo = (string)r["Tipo"], Descripcion = (string)r["Descripcion"], Impacto = (string)r["Impacto"], EsElectronico = (bool)r["EsElectronico"], LetraPredeterminada = r["LetraPredeterminada"] as string, SucursalID = r["SucursalID"] == DBNull.Value ? (int?)null : (int)r["SucursalID"], Sucursal = r["Sucursal"] as string, NumeradorID = r["NumeradorID"] == DBNull.Value ? (int?)null : (int)r["NumeradorID"], Numerador = r["Numerador"] as string, Activo = (bool)r["Activo"], PuedeCambiarImpacto = (bool)r["PuedeCambiarImpacto"], PuedeCambiarSigla = (bool)r["PuedeCambiarSigla"], PuedeCambiarLetra = (bool)r["PuedeCambiarLetra"], PuedeEliminar = (bool)r["PuedeEliminar"] }); return Ok(datos); } } } }
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
                            using (var configuracion = new SqlCommand("SELECT COUNT(*) FROM dbo.FACTURACION_TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE Tipo=@tipo AND LetraPredeterminada=@letra;", c, tx))
                            {
                                configuracion.Parameters.AddRange(new[] { P("@tipo", tipo), P("@letra", letra) });
                                if ((int)configuracion.ExecuteScalar() != 0)
                                {
                                    tx.Rollback();
                                    return Content(HttpStatusCode.Conflict, new { error = "Ya existe un tipo de comprobante con esa sigla y letra.", codigo = "TIPO_DUPLICADO" });
                                }
                            }
                            string descripcionActual = null, impactoActual = null;
                            bool? esElectronicoActual = null;
                            using (var existente = new SqlCommand("SELECT Descripcion,Impacto,EsElectronico FROM dbo.TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE Tipo=@tipo;", c, tx))
                            {
                                existente.Parameters.Add(P("@tipo", tipo));
                                using (var r = existente.ExecuteReader())
                                    if (r.Read()) { descripcionActual = (string)r["Descripcion"]; impactoActual = (string)r["Impacto"]; esElectronicoActual = (bool)r["EsElectronico"]; }
                            }
                            if (esElectronicoActual == true)
                            {
                                tx.Rollback();
                                return Content(HttpStatusCode.Conflict, new { error = "No se puede agregar otra letra al tipo de comprobante: es electrónico." });
                            }
                            if (impactoActual != null && !string.Equals(impactoActual.Trim(), request.Impacto, StringComparison.OrdinalIgnoreCase))
                                throw new ArgumentException("El impacto debe coincidir con el del tipo de comprobante existente.");
                            if (descripcionActual != null && !string.Equals(descripcionActual.Trim(), request.Descripcion.Trim(), StringComparison.OrdinalIgnoreCase))
                                throw new ArgumentException("La descripción debe coincidir con la del tipo de comprobante existente.");
                            if (esElectronicoActual != null && esElectronicoActual.Value != request.EsElectronico)
                                throw new ArgumentException("La condición de comprobante electrónico debe coincidir con la del tipo existente.");
                            ValidarDependenciasActivas(c, tx, request);
                            if (impactoActual == null)
                            {
                                using (var cmd = new SqlCommand("INSERT dbo.TIPOS_COMPROBANTE (Tipo,Descripcion,Impacto,EsElectronico) VALUES (@tipo,@descripcion,@impacto,@esElectronico);", c, tx))
                                {
                                    cmd.Parameters.AddRange(new[] { P("@tipo", tipo), P("@descripcion", request.Descripcion.Trim()), P("@impacto", request.Impacto), P("@esElectronico", request.EsElectronico) });
                                    cmd.ExecuteNonQuery();
                                }
                            }
                            int factTipoId;
                            using (var cmd = new SqlCommand(@"INSERT dbo.FACTURACION_TIPOS_COMPROBANTE (Tipo,LetraPredeterminada,SucursalID,NumeradorID,Activo)
OUTPUT INSERTED.FactTipo_ID VALUES (@tipo,@letra,@sucursal,@numerador,@activo);", c, tx))
                            {
                                cmd.Parameters.AddRange(new[] { P("@tipo", tipo), P("@letra", letra), P("@sucursal", request.SucursalID), P("@numerador", request.NumeradorID), P("@activo", request.Activo) });
                                factTipoId = (int)cmd.ExecuteScalar();
                            }
                            Auditar(c, u, "ALTA", "FactTipo_ID=" + factTipoId, "Configuración de " + tipo + " " + letra, tx);
                            tx.Commit(); return Content(HttpStatusCode.Created, new { FactTipo_ID = factTipoId, Tipo = tipo, LetraPredeterminada = letra });
                        }
                        catch { if (tx.Connection != null) tx.Rollback(); throw; }
                    }
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); }
            catch (SqlException ex)
            {
                if (ex.Number == 2601 || ex.Number == 2627)
                    return Content(HttpStatusCode.Conflict, new { error = "Ya existe un tipo de comprobante con esa sigla y letra.", codigo = "TIPO_DUPLICADO" });
                return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) });
            }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpPut, Route("tipos-comprobante/{id:int}")]
        public IHttpActionResult GuardarTipo(int id, [FromBody] TipoRequest request)
        {
            try
            {
                if (id <= 0) throw new ArgumentException("El tipo de comprobante no es válido.");
                string tipo = CodigoTipo(request == null ? null : request.Tipo);
                string letra = FacturacionComprobantesConfiguracion.NormalizarLetra(request.LetraPredeterminada);
                string tipoOriginal = string.IsNullOrWhiteSpace(request.TipoOriginal) ? null : CodigoTipo(request.TipoOriginal);
                string letraOriginal = FacturacionComprobantesConfiguracion.NormalizarLetra(request.LetraOriginal);
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open(); var u = ValidarUsuario(c, true);
                    // Los clientes anteriores no envían la identidad original. La prelectura no conserva
                    // bloqueos; dentro de la transacción se comprueba de nuevo la fila por su ID.
                    if (tipoOriginal == null || letraOriginal == null)
                    {
                        using (var previo = new SqlCommand("SELECT Tipo,LetraPredeterminada FROM dbo.FACTURACION_TIPOS_COMPROBANTE WHERE FactTipo_ID=@id;", c))
                        {
                            previo.Parameters.Add(P("@id", id));
                            using (var r = previo.ExecuteReader())
                            {
                                if (!r.Read()) return NotFound();
                                if (tipoOriginal == null) tipoOriginal = (string)r["Tipo"];
                                if (letraOriginal == null) letraOriginal = ((string)r["LetraPredeterminada"]).Trim();
                            }
                        }
                    }
                    using (var tx = c.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            // Emisión bloquea primero la configuración. El cambio de sigla toma todas sus
                            // variantes antes del catálogo para esperar emisiones de cualquiera de ellas.
                            if (tipoOriginal != tipo)
                            {
                                using (var grupo = new SqlCommand("SELECT FactTipo_ID FROM dbo.FACTURACION_TIPOS_COMPROBANTE WITH (XLOCK,HOLDLOCK) WHERE Tipo=@tipoActual ORDER BY FactTipo_ID;", c, tx))
                                {
                                    grupo.Parameters.Add(P("@tipoActual", tipoOriginal));
                                    using (var r = grupo.ExecuteReader()) while (r.Read()) { }
                                }
                            }
                            bool activoAnterior = false;
                            string tipoActual = null, letraActual = null;
                            using (var configuracion = new SqlCommand("SELECT Tipo,LetraPredeterminada,Activo FROM dbo.FACTURACION_TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE FactTipo_ID=@id;", c, tx))
                            {
                                configuracion.Parameters.Add(P("@id", id));
                                using (var r = configuracion.ExecuteReader())
                                {
                                    if (r.Read())
                                    {
                                        tipoActual = (string)r["Tipo"];
                                        letraActual = ((string)r["LetraPredeterminada"]).Trim();
                                        activoAnterior = (bool)r["Activo"];
                                    }
                                }
                            }
                            if (tipoActual == null) { tx.Rollback(); return NotFound(); }
                            if (tipoActual != tipoOriginal || letraActual != letraOriginal)
                            {
                                tx.Rollback();
                                return Content(HttpStatusCode.Conflict, new { error = "La configuración del tipo de comprobante cambió. Volvé a abrirla antes de guardar." });
                            }
                            bool cambiarSigla = tipoActual != tipo;
                            bool cambiarLetra = letraActual != letra;
                            string impactoActual;
                            bool esElectronicoActual;
                            using (var existente = new SqlCommand("SELECT Impacto,EsElectronico FROM dbo.TIPOS_COMPROBANTE WITH (XLOCK,HOLDLOCK) WHERE Tipo=@tipo;", c, tx))
                            {
                                existente.Parameters.Add(P("@tipo", tipoActual));
                                using (var r = existente.ExecuteReader())
                                {
                                    if (!r.Read()) { tx.Rollback(); return NotFound(); }
                                    impactoActual = (string)r["Impacto"];
                                    esElectronicoActual = (bool)r["EsElectronico"];
                                }
                            }
                            if (esElectronicoActual)
                            {
                                tx.Rollback();
                                return Content(HttpStatusCode.Conflict, new { error = "No se puede modificar el tipo de comprobante: es electrónico." });
                            }
                            if (cambiarSigla && new[] { "FAC", "ND", "NC", "REC" }.Contains(tipoActual))
                            {
                                tx.Rollback();
                                return Content(HttpStatusCode.Conflict, new { error = "No se puede cambiar la sigla de este tipo de comprobante: es un tipo fijo del sistema." });
                            }
                            if (cambiarSigla && new[] { "FAC", "ND", "NC", "REC" }.Contains(tipo))
                            {
                                tx.Rollback();
                                return Content(HttpStatusCode.Conflict, new { error = "La sigla elegida está reservada para un tipo de comprobante del sistema.", codigo = "TIPO_DUPLICADO" });
                            }
                            ValidarTipo(tipo, request);
                            if (request.Activo) ValidarDependenciasActivas(c, tx, request);
                            if (cambiarLetra)
                            {
                                using (var duplicada = new SqlCommand("SELECT TOP (1) 1 FROM dbo.FACTURACION_TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE Tipo=@tipoActual AND LetraPredeterminada=@letra AND FactTipo_ID<>@id;", c, tx))
                                {
                                    duplicada.Parameters.AddRange(new[] { P("@tipoActual", tipoActual), P("@letra", letra), P("@id", id) });
                                    if (duplicada.ExecuteScalar() != null)
                                    {
                                        tx.Rollback();
                                        return Content(HttpStatusCode.Conflict, new { error = "Ya existe un tipo de comprobante con esa sigla y letra.", codigo = "TIPO_DUPLICADO" });
                                    }
                                }
                            }
                            if (!string.Equals(impactoActual.Trim(), request.Impacto, StringComparison.OrdinalIgnoreCase))
                            {
                                using (var vinculados = new SqlCommand("SELECT TOP (1) 1 FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK) WHERE Tipo=@tipoActual;", c, tx))
                                {
                                    vinculados.Parameters.Add(P("@tipoActual", tipoActual));
                                    if (vinculados.ExecuteScalar() != null)
                                    {
                                        tx.Rollback();
                                        return Content(HttpStatusCode.Conflict, new { error = "No se puede cambiar el impacto del tipo de comprobante: tiene comprobantes asociados." });
                                    }
                                }
                            }
                            if (cambiarLetra)
                            {
                                // Una letra vacía histórica no permite atribuir el comprobante a una variante.
                                using (var ambiguos = new SqlCommand(@"SELECT TOP (1) 1 FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK)
WHERE Tipo=@tipoActual AND NULLIF(LTRIM(RTRIM(Letra)),'') IS NULL;", c, tx))
                                {
                                    ambiguos.Parameters.Add(P("@tipoActual", tipoActual));
                                    if (ambiguos.ExecuteScalar() != null)
                                    {
                                        tx.Rollback();
                                        return Content(HttpStatusCode.Conflict, new { error = "No se puede cambiar la letra del tipo de comprobante: hay comprobantes anteriores sin letra identificada." });
                                    }
                                }
                                // El numerador de origen puede estar por debajo de un número usado antes
                                // con la letra destino, aunque los comprobantes actuales no se superpongan.
                                using (var letraDestino = new SqlCommand("SELECT TOP (1) 1 FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK) WHERE Tipo=@tipoActual AND Letra=@letra;", c, tx))
                                {
                                    letraDestino.Parameters.AddRange(new[] { P("@tipoActual", tipoActual), P("@letra", letra) });
                                    if (letraDestino.ExecuteScalar() != null)
                                    {
                                        tx.Rollback();
                                        return Content(HttpStatusCode.Conflict, new { error = "No se puede cambiar la letra del tipo de comprobante: ya existen comprobantes con la letra elegida.", codigo = "LETRA_USADA" });
                                    }
                                }
                            }
                            if (cambiarSigla)
                            {
                                // CrearTipo comprueba primero el par código/letra y después el catálogo.
                                // Conservamos ese orden para evitar un bloqueo circular con el alta.
                                using (var configuracionDestino = new SqlCommand("SELECT TOP (1) 1 FROM dbo.FACTURACION_TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE Tipo=@tipo;", c, tx))
                                {
                                    configuracionDestino.Parameters.Add(P("@tipo", tipo));
                                    if (configuracionDestino.ExecuteScalar() != null)
                                    {
                                        tx.Rollback();
                                        return Content(HttpStatusCode.Conflict, new { error = "Ya existe un tipo de comprobante con esa sigla.", codigo = "TIPO_DUPLICADO" });
                                    }
                                }
                                using (var tipoDestino = new SqlCommand("SELECT TOP (1) 1 FROM dbo.TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE Tipo=@tipo;", c, tx))
                                {
                                    tipoDestino.Parameters.Add(P("@tipo", tipo));
                                    if (tipoDestino.ExecuteScalar() != null)
                                    {
                                        tx.Rollback();
                                        return Content(HttpStatusCode.Conflict, new { error = "Ya existe un tipo de comprobante con esa sigla.", codigo = "TIPO_DUPLICADO" });
                                    }
                                }
                            }
                            long comprobantesTipo = 0, emitidosTipo = 0, comprobantesLetra = 0, emitidosLetra = 0;
                            if (cambiarSigla || cambiarLetra)
                            {
                                using (var contar = new SqlCommand(@"SELECT COUNT_BIG(*),
COALESCE(SUM(CASE WHEN Estado IN ('EMITIDO','ANULADO') THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END),0),
COALESCE(SUM(CASE WHEN Letra=@letraActual THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END),0),
COALESCE(SUM(CASE WHEN Letra=@letraActual AND Estado IN ('EMITIDO','ANULADO') THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END),0)
FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK) WHERE Tipo=@tipoActual;", c, tx))
                                {
                                    contar.Parameters.AddRange(new[] { P("@tipoActual", tipoActual), P("@letraActual", letraActual) });
                                    using (var r = contar.ExecuteReader())
                                    {
                                        r.Read();
                                        comprobantesTipo = r.GetInt64(0);
                                        emitidosTipo = r.GetInt64(1);
                                        comprobantesLetra = r.GetInt64(2);
                                        emitidosLetra = r.GetInt64(3);
                                    }
                                }
                            }
                            // La migración 16 configura las FK con cascada. Así conservamos TipoComp_ID,
                            // FactTipo_ID y los IDs de todos los comprobantes, incluso los emitidos.
                            if (cambiarSigla)
                            {
                                using (var renombrarTipo = new SqlCommand("UPDATE dbo.TIPOS_COMPROBANTE SET Tipo=@tipo,Descripcion=@descripcion,Impacto=@impacto,EsElectronico=@esElectronico WHERE Tipo=@tipoActual;", c, tx))
                                {
                                    renombrarTipo.Parameters.AddRange(new[] { P("@tipo", tipo), P("@tipoActual", tipoActual), P("@descripcion", request.Descripcion.Trim()), P("@impacto", request.Impacto), P("@esElectronico", request.EsElectronico) });
                                    renombrarTipo.ExecuteNonQuery();
                                }
                            }
                            else
                            {
                                using (var actualizarTipo = new SqlCommand("UPDATE dbo.TIPOS_COMPROBANTE SET Descripcion=@descripcion,Impacto=@impacto,EsElectronico=@esElectronico WHERE Tipo=@tipo;", c, tx))
                                {
                                    actualizarTipo.Parameters.AddRange(new[] { P("@tipo", tipo), P("@descripcion", request.Descripcion.Trim()), P("@impacto", request.Impacto), P("@esElectronico", request.EsElectronico) });
                                    actualizarTipo.ExecuteNonQuery();
                                }
                            }
                            if (cambiarSigla)
                            {
                                using (var referencias = new SqlCommand("UPDATE dbo.COMPROBANTES SET TipoReferencia=@tipo WHERE TipoReferencia=@tipoActual;", c, tx))
                                {
                                    referencias.Parameters.AddRange(new[] { P("@tipo", tipo), P("@tipoActual", tipoActual) });
                                    referencias.ExecuteNonQuery();
                                }
                                using (var referenciasViejas = new SqlCommand("SELECT TOP (1) 1 FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK) WHERE TipoReferencia=@tipoActual;", c, tx))
                                {
                                    referenciasViejas.Parameters.Add(P("@tipoActual", tipoActual));
                                    if (referenciasViejas.ExecuteScalar() != null)
                                    {
                                        tx.Rollback();
                                        return Content(HttpStatusCode.Conflict, new { error = "No se pudo actualizar la sigla en todas las referencias. Probá de nuevo." });
                                    }
                                }
                            }
                            if (cambiarLetra)
                            {
                                using (var letrasHistoricas = new SqlCommand("UPDATE dbo.COMPROBANTES SET Letra=@letra WHERE Tipo=@tipo AND Letra=@letraActual;", c, tx))
                                {
                                    letrasHistoricas.Parameters.AddRange(new[] { P("@tipo", tipo), P("@letraActual", letraActual), P("@letra", letra) });
                                    letrasHistoricas.ExecuteNonQuery();
                                }
                            }
                            using (var cmd = new SqlCommand(@"
UPDATE dbo.FACTURACION_TIPOS_COMPROBANTE
SET LetraPredeterminada=@letra,SucursalID=@sucursal,NumeradorID=@numerador,Activo=@activo,FechaModificacion=SYSUTCDATETIME()
WHERE FactTipo_ID=@id;", c, tx))
                            {
                                cmd.Parameters.AddRange(new[] { P("@letra", letra), P("@id", id), P("@sucursal", request.SucursalID), P("@numerador", request.NumeradorID), P("@activo", request.Activo) });
                                cmd.ExecuteNonQuery();
                            }
                            var baja = activoAnterior && !request.Activo;
                            string detalle = "Configuración de " + tipoActual + " " + letraActual + " a " + tipo + " " + letra;
                            if (cambiarSigla) detalle += "; sigla: " + comprobantesTipo + " comprobantes, " + emitidosTipo + " emitidos o anulados";
                            if (cambiarLetra) detalle += "; letra: " + comprobantesLetra + " comprobantes, " + emitidosLetra + " emitidos o anulados";
                            if (!esElectronicoActual && request.EsElectronico) detalle += "; marcado como comprobante electrónico";
                            Auditar(c, u, baja ? "BAJA" : "MODIFICAR", "FactTipo_ID=" + id,
                                baja ? "Tipo de comprobante inactivado; " + detalle : detalle, tx);
                            tx.Commit(); return Ok();
                        }
                        catch { if (tx.Connection != null) tx.Rollback(); throw; }
                    }
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); }
            catch (SqlException ex)
            {
                if (ex.Number == 2601 || ex.Number == 2627)
                    return Content(HttpStatusCode.Conflict, new { error = "Ya existe un tipo de comprobante con esa sigla y letra.", codigo = "TIPO_DUPLICADO" });
                return Content(ex.Number == 547 ? HttpStatusCode.Conflict : HttpStatusCode.BadRequest,
                    new { error = ex.Number == 547 ? "No se puede guardar el tipo de comprobante: tiene relaciones que impiden el cambio." : MensajeParaUsuario(ex) });
            }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpPut, Route("tipos-comprobante/{id:int}/estado")]
        public IHttpActionResult CambiarEstadoTipo(int id, [FromBody] EstadoActivoRequest request)
        {
            try
            {
                if (id <= 0) throw new ArgumentException("El tipo de comprobante no es válido.");
                if (request == null || !request.Activo.HasValue) throw new ArgumentException("Seleccioná el estado del tipo de comprobante.");
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open(); var u = ValidarUsuario(c, true);
                    using (var tx = c.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            bool existe = false, activoAnterior = false;
                            int sucursalId = 0, numeradorId = 0;
                            string tipo = null, letra = null;
                            using (var cmd = new SqlCommand("SELECT Tipo,LetraPredeterminada,Activo,SucursalID,NumeradorID FROM dbo.FACTURACION_TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE FactTipo_ID=@id;", c, tx))
                            {
                                cmd.Parameters.Add(P("@id", id));
                                using (var r = cmd.ExecuteReader())
                                {
                                    if (r.Read())
                                    {
                                        existe = true;
                                        tipo = (string)r["Tipo"];
                                        letra = ((string)r["LetraPredeterminada"]).Trim();
                                        activoAnterior = (bool)r["Activo"];
                                        sucursalId = (int)r["SucursalID"];
                                        numeradorId = (int)r["NumeradorID"];
                                    }
                                }
                            }
                            if (!existe) { tx.Rollback(); return NotFound(); }
                            using (var electronico = new SqlCommand("SELECT EsElectronico FROM dbo.TIPOS_COMPROBANTE WITH (UPDLOCK,HOLDLOCK) WHERE Tipo=@tipo;", c, tx))
                            {
                                electronico.Parameters.Add(P("@tipo", tipo));
                                object valor = electronico.ExecuteScalar();
                                if (valor == null) { tx.Rollback(); return NotFound(); }
                                if ((bool)valor)
                                {
                                    tx.Rollback();
                                    return Content(HttpStatusCode.Conflict, new { error = "No se puede cambiar el estado del tipo de comprobante: es electrónico." });
                                }
                            }
                            if (activoAnterior != request.Activo.Value)
                            {
                                if (request.Activo.Value) ValidarDependenciasActivas(c, tx, sucursalId, numeradorId);
                                using (var cmd = new SqlCommand("UPDATE dbo.FACTURACION_TIPOS_COMPROBANTE SET Activo=@activo,FechaModificacion=SYSUTCDATETIME() WHERE FactTipo_ID=@id;", c, tx))
                                {
                                    cmd.Parameters.AddRange(new[] { P("@activo", request.Activo.Value), P("@id", id) });
                                    cmd.ExecuteNonQuery();
                                }
                                var baja = activoAnterior && !request.Activo.Value;
                                Auditar(c, u, baja ? "BAJA" : "MODIFICAR", "FactTipo_ID=" + id,
                                    baja ? "Tipo de comprobante " + tipo + " " + letra + " inactivado" : "Tipo de comprobante " + tipo + " " + letra + " activado", tx);
                            }
                            tx.Commit();
                            return Ok();
                        }
                        catch { if (tx.Connection != null) tx.Rollback(); throw; }
                    }
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpDelete, Route("tipos-comprobante/{id:int}")]
        public IHttpActionResult EliminarTipo(int id)
        {
            const string relacion = "No se puede eliminar el tipo de comprobante: tiene comprobantes asociados.";
            try
            {
                if (id <= 0) throw new ArgumentException("El tipo de comprobante no es válido.");
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open(); var u = ValidarUsuario(c, true);
                    using (var tx = c.BeginTransaction(IsolationLevel.Serializable))
                    {
                        try
                        {
                            // La emisión toma primero la configuración; conservamos ese orden de bloqueo.
                            string tipo = null, letra = null;
                            using (var cmd = new SqlCommand("SELECT Tipo,LetraPredeterminada FROM dbo.FACTURACION_TIPOS_COMPROBANTE WITH (XLOCK,HOLDLOCK) WHERE FactTipo_ID=@id;", c, tx))
                            {
                                cmd.Parameters.Add(P("@id", id));
                                using (var r = cmd.ExecuteReader())
                                {
                                    if (r.Read())
                                    {
                                        tipo = (string)r["Tipo"];
                                        letra = ((string)r["LetraPredeterminada"]).Trim();
                                    }
                                }
                            }
                            if (tipo == null) { tx.Rollback(); return NotFound(); }
                            using (var cmd = new SqlCommand("SELECT EsElectronico FROM dbo.TIPOS_COMPROBANTE WITH (XLOCK,HOLDLOCK) WHERE Tipo=@tipo;", c, tx))
                            {
                                cmd.Parameters.Add(P("@tipo", tipo));
                                object valor = cmd.ExecuteScalar();
                                if (valor == null) { tx.Rollback(); return NotFound(); }
                                if ((bool)valor)
                                {
                                    tx.Rollback();
                                    return Content(HttpStatusCode.Conflict, new { error = "No se puede eliminar el tipo de comprobante: es electrónico." });
                                }
                            }
                            using (var cmd = new SqlCommand(@"SELECT CASE WHEN EXISTS (
SELECT 1 FROM dbo.COMPROBANTES WITH (UPDLOCK,HOLDLOCK)
WHERE Tipo=@tipo AND (Letra=@letra OR NULLIF(LTRIM(RTRIM(Letra)),'') IS NULL)
) THEN 1 ELSE 0 END;", c, tx))
                            {
                                cmd.Parameters.AddRange(new[] { P("@tipo", tipo), P("@letra", letra) });
                                if ((int)cmd.ExecuteScalar() != 0) { tx.Rollback(); return Content(HttpStatusCode.Conflict, new { error = relacion }); }
                            }
                            using (var cmd = new SqlCommand(@"DELETE FROM dbo.FACTURACION_TIPOS_COMPROBANTE WHERE FactTipo_ID=@id;
IF NOT EXISTS (SELECT 1 FROM dbo.FACTURACION_TIPOS_COMPROBANTE WHERE Tipo=@tipo)
   AND NOT EXISTS (SELECT 1 FROM dbo.COMPROBANTES WHERE Tipo=@tipo)
BEGIN
    DELETE FROM dbo.COMPROBANTES_NUMERADORES WHERE Tipo=@tipo;
    DELETE FROM dbo.TIPOS_COMPROBANTE WHERE Tipo=@tipo;
END;", c, tx))
                            {
                                cmd.Parameters.AddRange(new[] { P("@id", id), P("@tipo", tipo) });
                                cmd.ExecuteNonQuery();
                            }
                            Auditar(c, u, "ELIMINAR", "FactTipo_ID=" + id, "Tipo de comprobante " + tipo + " " + letra + " eliminado", tx);
                            tx.Commit();
                            return Ok();
                        }
                        catch { if (tx.Connection != null) tx.Rollback(); throw; }
                    }
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (InvalidOperationException ex) { return Content(HttpStatusCode.Forbidden, new { error = ex.Message }); }
            catch (SqlException ex) { return Content(ex.Number == 547 ? HttpStatusCode.Conflict : HttpStatusCode.BadRequest, new { error = ex.Number == 547 ? relacion : MensajeParaUsuario(ex) }); }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpGet, Route("tipos-emision-directa")]
        public IHttpActionResult TiposEmisionDirecta()
        {
            try
            {
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open();
                    ValidarUsuario(c, false);
                    var tipos = new List<object>();
                    using (var cmd = new SqlCommand(@"
SELECT DISTINCT t.Tipo,t.Descripcion,t.Impacto
FROM dbo.TIPOS_COMPROBANTE t
JOIN dbo.FACTURACION_TIPOS_COMPROBANTE c ON c.Tipo=t.Tipo AND c.Activo=1
JOIN dbo.FACTURACION_NUMERADORES n ON n.Numerador_ID=c.NumeradorID AND n.Activo=1 AND n.UltimoNumero<99999999
JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID=c.SucursalID AND s.Activa=1
WHERE t.Impacto='D' AND t.Tipo<>'ND'
ORDER BY t.Tipo,t.Descripcion;", c))
                    using (var reader = cmd.ExecuteReader())
                        while (reader.Read())
                            tipos.Add(new
                            {
                                Tipo = (string)reader["Tipo"],
                                Descripcion = (string)reader["Descripcion"],
                                Impacto = (string)reader["Impacto"]
                            });
                    return Ok(tipos);
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpGet, Route("tipos-emision-debito")]
        public IHttpActionResult TiposEmisionDebito()
        {
            try
            {
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open();
                    ValidarUsuario(c, false);
                    var tipos = new List<object>();
                    using (var cmd = new SqlCommand(@"
SELECT DISTINCT t.Tipo,t.Descripcion,t.Impacto
FROM dbo.TIPOS_COMPROBANTE t
JOIN dbo.FACTURACION_TIPOS_COMPROBANTE cfg ON cfg.Tipo=t.Tipo AND cfg.Activo=1
JOIN dbo.FACTURACION_NUMERADORES n ON n.Numerador_ID=cfg.NumeradorID AND n.Activo=1 AND n.UltimoNumero<99999999
JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID=cfg.SucursalID AND s.Activa=1
WHERE t.Impacto='D'
ORDER BY t.Tipo,t.Descripcion;", c))
                    using (var reader = cmd.ExecuteReader())
                        while (reader.Read())
                            tipos.Add(new
                            {
                                Tipo = (string)reader["Tipo"],
                                Descripcion = (string)reader["Descripcion"],
                                Impacto = (string)reader["Impacto"]
                            });
                    return Ok(tipos);
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpGet, Route("tipos-emision-credito")]
        public IHttpActionResult TiposEmisionCredito()
        {
            try
            {
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open();
                    ValidarUsuario(c, false);
                    var tipos = new List<object>();
                    using (var cmd = new SqlCommand(@"
SELECT DISTINCT t.Tipo,t.Descripcion,t.Impacto
FROM dbo.TIPOS_COMPROBANTE t
JOIN dbo.FACTURACION_TIPOS_COMPROBANTE c ON c.Tipo=t.Tipo AND c.Activo=1
JOIN dbo.FACTURACION_NUMERADORES n ON n.Numerador_ID=c.NumeradorID AND n.Activo=1 AND n.UltimoNumero<99999999
JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID=c.SucursalID AND s.Activa=1
WHERE t.Impacto='C' AND t.Tipo<>'REC'
ORDER BY t.Tipo,t.Descripcion;", c))
                    using (var reader = cmd.ExecuteReader())
                        while (reader.Read())
                            tipos.Add(new
                            {
                                Tipo = (string)reader["Tipo"],
                                Descripcion = (string)reader["Descripcion"],
                                Impacto = (string)reader["Impacto"]
                            });
                    return Ok(tipos);
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }

        [HttpGet, Route("emision/{tipo}")]
        public IHttpActionResult Emision(string tipo)
        {
            try
            {
                tipo = CodigoTipo(tipo);
                using (var c = new SqlConnection(ConnectionString()))
                {
                    c.Open();
                    ValidarUsuario(c, false);
                    var cfg = FacturacionComprobantesConfiguracion.Obtener(c, null, tipo);
                    var configuraciones = new List<object>();
                    var letras = new List<string>();
                    using (var cmd = new SqlCommand(@"
SELECT c.LetraPredeterminada AS Letra,s.Codigo AS SucursalPredeterminada,n.UltimoNumero
FROM dbo.FACTURACION_TIPOS_COMPROBANTE c
JOIN dbo.FACTURACION_NUMERADORES n ON n.Numerador_ID=c.NumeradorID AND n.Activo=1 AND n.UltimoNumero<99999999
JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID=c.SucursalID AND s.Activa=1
WHERE c.Tipo=@tipo AND c.Activo=1
ORDER BY CASE WHEN c.LetraPredeterminada='A' THEN 0 WHEN c.LetraPredeterminada='B' THEN 1 ELSE 2 END;", c))
                    {
                        cmd.Parameters.Add(P("@tipo", tipo));
                        using (var r = cmd.ExecuteReader())
                        {
                            while (r.Read())
                            {
                                string letra = ((string)r["Letra"]).Trim();
                                letras.Add(letra);
                                configuraciones.Add(new
                                {
                                    Letra = letra,
                                    SucursalPredeterminada = (string)r["SucursalPredeterminada"],
                                    ProximoNumero = FacturacionComprobantesConfiguracion.NumeroVisible((int)r["UltimoNumero"] + 1)
                                });
                            }
                        }
                    }
                    var sucursales = new List<object>();
                    using (var cmd = new SqlCommand(@"
SELECT DISTINCT s.Codigo,s.Nombre
FROM dbo.FACTURACION_TIPOS_COMPROBANTE cfg
JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID=cfg.SucursalID AND s.Activa=1
JOIN dbo.FACTURACION_NUMERADORES n ON n.Numerador_ID=cfg.NumeradorID AND n.Activo=1 AND n.UltimoNumero<99999999
WHERE cfg.Tipo=@tipo AND cfg.Activo=1
ORDER BY s.Codigo;", c))
                    {
                        cmd.Parameters.Add(P("@tipo", tipo));
                        using (var r = cmd.ExecuteReader())
                            while (r.Read()) sucursales.Add(new { Codigo = (string)r["Codigo"], Nombre = (string)r["Nombre"] });
                    }
                    return Ok(new
                    {
                        cfg.Tipo, cfg.Descripcion, cfg.LetraPredeterminada, cfg.SucursalPredeterminada,
                        ProximoNumero = FacturacionComprobantesConfiguracion.NumeroVisible(cfg.UltimoNumero + 1),
                        Letras = letras, Configuraciones = configuraciones, Sucursales = sucursales
                    });
                }
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
            catch (Exception ex) { return Content(HttpStatusCode.BadRequest, new { error = MensajeParaUsuario(ex) }); }
        }
    }
}
