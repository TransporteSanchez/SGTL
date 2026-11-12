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