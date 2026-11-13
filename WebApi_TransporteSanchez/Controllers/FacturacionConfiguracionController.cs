using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;

namespace WebApi_TransporteSanchez.Controllers
{
    [RoutePrefix("api/facturacion-config")]
    public class FacturacionConfiguracionController : ApiController
    {
        private readonly IAccesoEmail acceso;

        public FacturacionConfiguracionController(IAccesoEmail acceso)
        {
            this.acceso = acceso;
        }

        [HttpGet, Route("tipos-comprobante")]
        public Task<IHttpActionResult> TiposComprobante(CancellationToken ct)
        {
            return Consultar(conexion =>
            {
                const string sql = @"
SELECT DISTINCT t.Tipo, t.Descripcion
FROM dbo.TIPOS_COMPROBANTE t
JOIN dbo.FACTURACION_TIPOS_COMPROBANTE tc ON tc.Tipo = t.Tipo
ORDER BY t.Tipo;";

                var tipos = new List<object>();
                using (var comando = new SqlCommand(sql, conexion))
                using (var lector = comando.ExecuteReader())
                {
                    while (lector.Read())
                        tipos.Add(new { Tipo = (string)lector["Tipo"], Descripcion = (string)lector["Descripcion"] });
                }
                return tipos;
            }, ct);
        }

        [HttpGet, Route("tipos-emision-directa")]
        public Task<IHttpActionResult> TiposEmisionDirecta(CancellationToken ct)
        {
            return TiposParaEmitir("D", "ND", ct);
        }

        [HttpGet, Route("tipos-emision-debito")]
        public Task<IHttpActionResult> TiposEmisionDebito(CancellationToken ct)
        {
            return TiposParaEmitir("D", null, ct);
        }

        [HttpGet, Route("tipos-emision-credito")]
        public Task<IHttpActionResult> TiposEmisionCredito(CancellationToken ct)
        {
            return TiposParaEmitir("C", "REC", ct);
        }

        private Task<IHttpActionResult> TiposParaEmitir(string impacto, string excluido, CancellationToken ct)
        {
            return Consultar(conexion =>
            {
                const string sql = @"
SELECT DISTINCT t.Tipo, t.Descripcion, t.Impacto
FROM dbo.TIPOS_COMPROBANTE t
JOIN dbo.FACTURACION_TIPOS_COMPROBANTE tc ON tc.Tipo = t.Tipo
JOIN dbo.FACTURACION_NUMERADORES n ON n.Numerador_ID = tc.NumeradorID
JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID = tc.SucursalID
WHERE t.Impacto = @impacto AND (@excluido IS NULL OR t.Tipo <> @excluido)
  AND tc.Activo = 1 AND n.Activo = 1 AND s.Activa = 1
  AND n.UltimoNumero < 99999999
ORDER BY t.Tipo, t.Descripcion;";

                var tipos = new List<object>();
                using (var comando = new SqlCommand(sql, conexion))
                {
                    comando.Parameters.Add("@impacto", SqlDbType.Char).Value = impacto;
                    comando.Parameters.Add("@excluido", SqlDbType.VarChar).Value = (object)excluido ?? DBNull.Value;
                    using (var lector = comando.ExecuteReader())
                    {
                        while (lector.Read())
                            tipos.Add(new
                            {
                                Tipo = (string)lector["Tipo"],
                                Descripcion = (string)lector["Descripcion"],
                                Impacto = (string)lector["Impacto"]
                            });
                    }
                }
                return tipos;
            }, ct);
        }

        [HttpGet, Route("emision/{tipo}")]
        public Task<IHttpActionResult> Emision(string tipo, CancellationToken ct)
        {
            return Consultar(conexion =>
            {
                var configuracion = FacturacionComprobantesConfiguracion.Obtener(conexion, null, CodigoTipo(tipo));
                var activas = ConfiguracionesActivas(conexion, configuracion.Tipo);
                return new
                {
                    configuracion.Tipo,
                    configuracion.Descripcion,
                    configuracion.LetraPredeterminada,
                    configuracion.SucursalPredeterminada,
                    ProximoNumero = FacturacionComprobantesConfiguracion.NumeroVisible(configuracion.UltimoNumero + 1),
                    Letras = activas.Select(a => a.Letra).ToList(),
                    Configuraciones = activas.Select(a => new
                    {
                        a.Letra,
                        SucursalPredeterminada = a.Sucursal,
                        ProximoNumero = FacturacionComprobantesConfiguracion.NumeroVisible(a.UltimoNumero + 1)
                    }).ToList(),
                    Sucursales = activas.Select(a => new { Codigo = a.Sucursal, Nombre = a.NombreSucursal })
                        .Distinct()
                        .OrderBy(s => s.Codigo, StringComparer.Ordinal)
                        .ToList()
                };
            }, ct);
        }

        private class ConfiguracionActiva
        {
            public string Letra { get; set; }
            public string Sucursal { get; set; }
            public string NombreSucursal { get; set; }
            public int UltimoNumero { get; set; }
        }

        private static List<ConfiguracionActiva> ConfiguracionesActivas(SqlConnection conexion, string tipo)
        {
            const string sql = @"
SELECT tc.LetraPredeterminada AS Letra, s.Codigo AS Sucursal, s.Nombre AS NombreSucursal, n.UltimoNumero
FROM dbo.FACTURACION_TIPOS_COMPROBANTE tc
JOIN dbo.FACTURACION_NUMERADORES n ON n.Numerador_ID = tc.NumeradorID
JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID = tc.SucursalID
WHERE tc.Tipo = @tipo AND tc.Activo = 1 AND n.Activo = 1 AND s.Activa = 1
  AND n.UltimoNumero < 99999999
ORDER BY tc.LetraPredeterminada;";

            var activas = new List<ConfiguracionActiva>();
            using (var comando = new SqlCommand(sql, conexion))
            {
                comando.Parameters.Add("@tipo", SqlDbType.VarChar).Value = tipo;
                using (var lector = comando.ExecuteReader())
                {
                    while (lector.Read())
                        activas.Add(new ConfiguracionActiva
                        {
                            Letra = (string)lector["Letra"],
                            Sucursal = (string)lector["Sucursal"],
                            NombreSucursal = (string)lector["NombreSucursal"],
                            UltimoNumero = (int)lector["UltimoNumero"]
                        });
                }
            }
            return activas;
        }

        public class SucursalEntrada
        {
            public string Codigo { get; set; }
            public string Nombre { get; set; }
        }

        [HttpGet, Route("sucursales")]
        public Task<IHttpActionResult> Sucursales(CancellationToken ct)
        {
            return Consultar(conexion =>
            {
                const string sql = @"
SELECT s.Sucursal_ID, s.Codigo, s.Nombre, s.Activa,
       CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.COMPROBANTES c WHERE c.Sucursal = s.Codigo)
            THEN 0 ELSE 1 END AS bit) AS PuedeCambiarCodigo,
       CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.COMPROBANTES c WHERE c.Sucursal = s.Codigo)
                   OR EXISTS (SELECT 1 FROM dbo.FACTURACION_TIPOS_COMPROBANTE tc WHERE tc.SucursalID = s.Sucursal_ID)
            THEN 0 ELSE 1 END AS bit) AS PuedeEliminar
FROM dbo.FACTURACION_SUCURSALES s
ORDER BY s.Codigo;";

                var sucursales = new List<object>();
                using (var comando = new SqlCommand(sql, conexion))
                using (var lector = comando.ExecuteReader())
                {
                    while (lector.Read())
                        sucursales.Add(new
                        {
                            SucursalID = (int)lector["Sucursal_ID"],
                            Codigo = (string)lector["Codigo"],
                            Nombre = (string)lector["Nombre"],
                            Activa = (bool)lector["Activa"],
                            PuedeCambiarCodigo = (bool)lector["PuedeCambiarCodigo"],
                            PuedeEliminar = (bool)lector["PuedeEliminar"]
                        });
                }
                return sucursales;
            }, ct);
        }

        [HttpPost, Route("sucursales")]
        public Task<IHttpActionResult> CrearSucursal([FromBody] SucursalEntrada entrada, CancellationToken ct)
        {
            return Guardar("Ya existe una sucursal con ese código.", transaccion =>
            {
                ValidarSucursal(entrada);
                var id = (int)Valor(transaccion,
                    "INSERT dbo.FACTURACION_SUCURSALES (Codigo, Nombre) OUTPUT INSERTED.Sucursal_ID VALUES (@codigo, @nombre);",
                    Parametro("@codigo", entrada.Codigo), Parametro("@nombre", entrada.Nombre));
                return new Cambio { Accion = "ALTA", Clave = "Sucursal_ID=" + id, Detalle = "Sucursal " + entrada.Codigo, Respuesta = new { SucursalID = id } };
            }, ct);
        }

        [HttpPut, Route("sucursales/{id:int}")]
        public Task<IHttpActionResult> EditarSucursal(int id, [FromBody] SucursalEntrada entrada, CancellationToken ct)
        {
            return Guardar("Ya existe una sucursal con ese código.", transaccion =>
            {
                ValidarSucursal(entrada);
                var codigoActual = Valor(transaccion, "SELECT Codigo FROM dbo.FACTURACION_SUCURSALES WITH (XLOCK) WHERE Sucursal_ID = @id;",
                    Parametro("@id", id)) as string;
                if (codigoActual == null) return null;
                if (entrada.Codigo != codigoActual
                    && Existe(transaccion, "SELECT TOP (1) 1 FROM dbo.COMPROBANTES WITH (UPDLOCK) WHERE Sucursal = @codigo;", Parametro("@codigo", codigoActual)))
                    throw new ConflictoException("No se puede cambiar el código de la sucursal: figura en un comprobante.");

                Ejecutar(transaccion, "UPDATE dbo.FACTURACION_SUCURSALES SET Codigo = @codigo, Nombre = @nombre WHERE Sucursal_ID = @id;",
                    Parametro("@codigo", entrada.Codigo), Parametro("@nombre", entrada.Nombre), Parametro("@id", id));
                return new Cambio { Accion = "MODIFICAR", Clave = "Sucursal_ID=" + id, Detalle = "Sucursal " + entrada.Codigo };
            }, ct);
        }

        [HttpPut, Route("sucursales/{id:int}/estado")]
        public Task<IHttpActionResult> CambiarEstadoSucursal(int id, [FromBody] EstadoEntrada entrada, CancellationToken ct)
        {
            return Guardar(null, transaccion =>
            {
                var activa = EstadoPedido(entrada);
                var anterior = Valor(transaccion, "UPDATE dbo.FACTURACION_SUCURSALES SET Activa = @activa OUTPUT DELETED.Activa WHERE Sucursal_ID = @id;",
                    Parametro("@activa", activa), Parametro("@id", id));
                if (anterior == null) return null;
                if ((bool)anterior == activa) return new Cambio();
                return new Cambio { Accion = activa ? "MODIFICAR" : "BAJA", Clave = "Sucursal_ID=" + id, Detalle = activa ? "Sucursal activada" : "Sucursal inactivada" };
            }, ct);
        }

        [HttpDelete, Route("sucursales/{id:int}")]
        public Task<IHttpActionResult> EliminarSucursal(int id, CancellationToken ct)
        {
            return Guardar(null, transaccion =>
            {
                const string enUso = "No se puede eliminar la sucursal: la usa un tipo de comprobante o un comprobante.";
                if (Existe(transaccion, "SELECT TOP (1) 1 FROM dbo.FACTURACION_TIPOS_COMPROBANTE WITH (UPDLOCK) WHERE SucursalID = @id;", Parametro("@id", id)))
                    throw new ConflictoException(enUso);
                var codigo = Valor(transaccion, "SELECT Codigo FROM dbo.FACTURACION_SUCURSALES WITH (XLOCK) WHERE Sucursal_ID = @id;",
                    Parametro("@id", id)) as string;
                if (codigo == null) return null;
                if (Existe(transaccion, "SELECT TOP (1) 1 FROM dbo.COMPROBANTES WITH (UPDLOCK) WHERE Sucursal = @codigo;", Parametro("@codigo", codigo)))
                    throw new ConflictoException(enUso);

                Ejecutar(transaccion, "DELETE dbo.FACTURACION_SUCURSALES WHERE Sucursal_ID = @id;", Parametro("@id", id));
                return new Cambio { Accion = "ELIMINAR", Clave = "Sucursal_ID=" + id, Detalle = "Sucursal " + codigo + " eliminada" };
            }, ct);
        }

        private static void ValidarSucursal(SucursalEntrada entrada)
        {
            if (entrada == null) throw new ArgumentException("Completá los datos de la sucursal.");
            var codigo = FacturacionComprobantesConfiguracion.NormalizarSucursal(entrada.Codigo);
            if (codigo == null) throw new ArgumentException("Ingresá el código de la sucursal.");
            entrada.Codigo = codigo.PadLeft(4, '0');
            entrada.Nombre = (entrada.Nombre ?? "").Trim();
            if (entrada.Nombre.Length == 0 || entrada.Nombre.Length > 100)
                throw new ArgumentException("Ingresá el nombre de la sucursal, de hasta 100 caracteres.");
        }

        private async Task<IHttpActionResult> Consultar(Func<SqlConnection, object> consulta, CancellationToken ct)
        {
            try
            {
                if (await acceso.AutenticarAsync(Request.Headers.Authorization, ct) == null) return Unauthorized();
                using (var conexion = new SqlConnection(CadenaConexion()))
                {
                    conexion.Open();
                    return Ok(consulta(conexion));
                }
            }
            catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
            {
                return Content(HttpStatusCode.BadRequest, new { error = ex.Message });
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.BadRequest, new { error = "No se pudo completar la operación. Probá de nuevo." });
            }
        }

        public class EstadoEntrada
        {
            public bool? Activo { get; set; }
        }

        private class Cambio
        {
            public string Accion { get; set; }
            public string Clave { get; set; }
            public string Detalle { get; set; }
            public object Respuesta { get; set; }
        }

        private class ConflictoException : Exception
        {
            public ConflictoException(string mensaje, string codigo = null) : base(mensaje)
            {
                Codigo = codigo;
            }

            public string Codigo { get; }
        }

        private async Task<IHttpActionResult> Guardar(string siYaExiste, Func<SqlTransaction, Cambio> operacion, CancellationToken ct)
        {
            try
            {
                var usuario = await acceso.AutenticarAsync(Request.Headers.Authorization, ct);
                if (usuario == null) return Unauthorized();
                if (!usuario.EsAdministrador)
                    return Content(HttpStatusCode.Forbidden, new { error = "Solo un administrador puede modificar la configuración de facturación." });

                Cambio cambio;
                using (var conexion = new SqlConnection(CadenaConexion()))
                {
                    conexion.Open();
                    using (var transaccion = conexion.BeginTransaction(IsolationLevel.Serializable))
                    {
                        cambio = operacion(transaccion);
                        if (cambio == null) return NotFound();
                        transaccion.Commit();
                    }
                }

                if (cambio.Accion != null)
                    SGTLAuditContext.RegistrarEvento(ConnectionStringHelper.GetConnectionString("SGTLEntities"), usuario.Nombre,
                        cambio.Accion, "FACTURACION_CONFIG", cambio.Clave, cambio.Detalle, "Configuración");
                return cambio.Respuesta == null ? (IHttpActionResult)Ok() : Ok(cambio.Respuesta);
            }
            catch (ConflictoException ex)
            {
                return Content(HttpStatusCode.Conflict, new { error = ex.Message, codigo = ex.Codigo });
            }
            catch (ArgumentException ex)
            {
                return Content(HttpStatusCode.BadRequest, new { error = ex.Message });
            }
            catch (SqlException ex) when (ex.Number == 2601 || ex.Number == 2627)
            {
                return Content(HttpStatusCode.Conflict, new { error = siYaExiste ?? "Ya existe un registro con esos datos." });
            }
            catch (SqlException ex) when (ex.Number == 547)
            {
                return Content(HttpStatusCode.Conflict, new { error = "No se puede completar: hay datos relacionados." });
            }
            catch (SqlException ex) when (ex.Number >= 50000)
            {
                return Content(HttpStatusCode.Conflict, new { error = ex.Message });
            }
            catch (Exception)
            {
                return Content(HttpStatusCode.BadRequest, new { error = "No se pudo completar la operación. Probá de nuevo." });
            }
        }

        private static SqlParameter Parametro(string nombre, object valor)
        {
            return new SqlParameter(nombre, valor ?? DBNull.Value);
        }

        private static object Valor(SqlTransaction transaccion, string sql, params SqlParameter[] parametros)
        {
            using (var comando = new SqlCommand(sql, transaccion.Connection, transaccion))
            {
                comando.Parameters.AddRange(parametros);
                return comando.ExecuteScalar();
            }
        }

        private static bool Existe(SqlTransaction transaccion, string sql, params SqlParameter[] parametros)
        {
            return Valor(transaccion, sql, parametros) != null;
        }

        private static void Ejecutar(SqlTransaction transaccion, string sql, params SqlParameter[] parametros)
        {
            using (var comando = new SqlCommand(sql, transaccion.Connection, transaccion))
            {
                comando.Parameters.AddRange(parametros);
                comando.ExecuteNonQuery();
            }
        }

        private static bool EstadoPedido(EstadoEntrada entrada)
        {
            if (entrada?.Activo == null) throw new ArgumentException("Indicá si queda activo o inactivo.");
            return entrada.Activo.Value;
        }

        private static string CadenaConexion()
        {
            return new EntityConnectionStringBuilder(ConnectionStringHelper.GetConnectionString("SGTLEntities")).ProviderConnectionString;
        }

        private static string CodigoTipo(string tipo)
        {
            tipo = (tipo ?? "").Trim().ToUpperInvariant();
            if (tipo.Length == 0 || tipo.Length > 3 || !tipo.All(c => (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')))
                throw new ArgumentException("La sigla del tipo tiene que tener entre uno y tres letras o números.");
            return tipo;
        }
    }
}