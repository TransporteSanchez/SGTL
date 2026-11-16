using System;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;

namespace WebApi_TransporteSanchez.Controllers
{
    internal class ConfiguracionEmisionComprobante
    {
        public string Tipo { get; set; }
        public string Descripcion { get; set; }
        public string Impacto { get; set; }
        public string LetraPredeterminada { get; set; }
        public string SucursalPredeterminada { get; set; }
        public int NumeradorID { get; set; }
        public int UltimoNumero { get; set; }
    }

    internal static class FacturacionComprobantesConfiguracion
    {
        public static string NormalizarLetra(string letra)
        {
            if (string.IsNullOrWhiteSpace(letra)) return null;
            letra = letra.Trim().ToUpperInvariant();
            if (letra != "A" && letra != "B" && letra != "X")
                throw new ArgumentException("La letra del comprobante tiene que ser A, B o X.");
            return letra;
        }

        public static string NormalizarSucursal(string sucursal)
        {
            if (string.IsNullOrWhiteSpace(sucursal)) return null;
            sucursal = sucursal.Trim();
            if (sucursal.Length > 4 || !sucursal.All(char.IsDigit))
                throw new ArgumentException("La sucursal tiene que tener entre uno y cuatro dígitos.");
            return sucursal;
        }

        public static ConfiguracionEmisionComprobante Obtener(SqlConnection conexion, SqlTransaction transaccion, string tipo, string letra = null)
        {
            const string sql = @"
SELECT TOP (1) tc.Tipo, t.Descripcion, t.Impacto, tc.LetraPredeterminada, s.Codigo AS SucursalPredeterminada,
       tc.NumeradorID, n.UltimoNumero
FROM dbo.FACTURACION_TIPOS_COMPROBANTE tc WITH (UPDLOCK, HOLDLOCK)
JOIN dbo.TIPOS_COMPROBANTE t ON t.Tipo = tc.Tipo
JOIN dbo.FACTURACION_NUMERADORES n WITH (UPDLOCK, HOLDLOCK) ON n.Numerador_ID = tc.NumeradorID
JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID = tc.SucursalID
WHERE tc.Tipo = @tipo AND tc.Activo = 1 AND n.Activo = 1 AND s.Activa = 1
  AND n.UltimoNumero < 99999999
  AND (@letra IS NULL OR tc.LetraPredeterminada = @letra)
ORDER BY tc.LetraPredeterminada;";

            using (var comando = new SqlCommand(sql, conexion, transaccion))
            {
                comando.Parameters.Add("@tipo", SqlDbType.VarChar).Value = (object)tipo ?? DBNull.Value;
                comando.Parameters.Add("@letra", SqlDbType.Char).Value = (object)NormalizarLetra(letra) ?? DBNull.Value;
                using (var lector = comando.ExecuteReader())
                {
                    if (!lector.Read())
                        throw new InvalidOperationException("El tipo de comprobante no tiene una configuración de facturación activa.");
                    return new ConfiguracionEmisionComprobante
                    {
                        Tipo = (string)lector["Tipo"],
                        Descripcion = (string)lector["Descripcion"],
                        Impacto = (string)lector["Impacto"],
                        LetraPredeterminada = (string)lector["LetraPredeterminada"],
                        SucursalPredeterminada = (string)lector["SucursalPredeterminada"],
                        NumeradorID = (int)lector["NumeradorID"],
                        UltimoNumero = (int)lector["UltimoNumero"]
                    };
                }
            }
        }

        public static void ValidarDatos(SqlConnection conexion, SqlTransaction transaccion, ref string letra, ref string sucursal,
            ConfiguracionEmisionComprobante configuracion)
        {
            if (configuracion.Tipo == "REC")
                letra = "X";
            else
            {
                letra = NormalizarLetra(letra) ?? configuracion.LetraPredeterminada;
                if (letra == "X")
                    throw new ArgumentException("La letra del comprobante tiene que ser A o B.");
            }
            if (letra != configuracion.LetraPredeterminada)
                throw new InvalidOperationException("El tipo de comprobante no tiene una configuración de facturación activa para esa letra.");

            sucursal = NormalizarSucursal(sucursal) ?? configuracion.SucursalPredeterminada;
            if (sucursal != configuracion.SucursalPredeterminada)
                throw new InvalidOperationException("La sucursal seleccionada no corresponde al tipo de comprobante y a la letra.");

            using (var comando = new SqlCommand("SELECT COUNT(*) FROM dbo.FACTURACION_SUCURSALES WHERE Codigo = @codigo AND Activa = 1;", conexion, transaccion))
            {
                comando.Parameters.Add("@codigo", SqlDbType.VarChar).Value = sucursal;
                if ((int)comando.ExecuteScalar() != 1)
                    throw new InvalidOperationException("La sucursal seleccionada no está activa en Facturación > Gestionar tipos de comprobante.");
            }
        }

        public static string NumeroVisible(int numero)
        {
            return numero.ToString("D8", CultureInfo.InvariantCulture);
        }
    }
}