using System;
using System.Data;
using System.Data.SqlClient;
using System.Data.Entity;

namespace WebApi_TransporteSanchez.Security
{
    internal static class SeguridadSql
    {
        internal const string Usuario = @"
SELECT Usuario_ID,
       Nombre_Usuario,
       Nombre,
       Apellido,
       COALESCE(Rol, '') AS Rol,
       EstadoUsuario,
       Contraseña AS Clave,
       Email,
       VersionSesion
FROM dbo.USUARIOS ";

        internal static SGTLAuditContext Abrir()
        {
            var db = new SGTLAuditContext(
                ConnectionStringHelper.GetConnectionString("SGTLEntities"));

            try
            {
                // El índice calculado exige estas opciones en la misma conexión.
                db.Database.Connection.Open();
                db.Database.ExecuteSqlCommand(
                    TransactionalBehavior.DoNotEnsureTransaction,
                    @"SET ANSI_NULLS ON;
              SET ANSI_PADDING ON;
              SET ANSI_WARNINGS ON;
              SET ARITHABORT ON;
              SET CONCAT_NULL_YIELDS_NULL ON;
              SET QUOTED_IDENTIFIER ON;
              SET NUMERIC_ROUNDABORT OFF;");

                return db;
            }
            catch
            {
                db.Dispose();
                throw;
            }
        }

        internal static SqlParameter P(
            string nombre,
            SqlDbType tipo,
            object valor,
            int longitud = 0)
        {
            return new SqlParameter(nombre, tipo)
            {
                Value = valor ?? DBNull.Value,
                Size = longitud
            };
        }

        internal static void Auditar(
            string usuario,
            string accion,
            int id)
        {
            SGTLAuditContext.RegistrarEvento(
                ConnectionStringHelper.GetConnectionString("SGTLEntities"),
                usuario,
                accion,
                "USUARIOS",
                "Usuario_ID=" + id);
        }
    }

    public sealed class UsuarioAcceso
    {
        public int Usuario_ID { get; set; }
        public string Nombre_Usuario { get; set; }
        public string Nombre { get; set; }
        public string Apellido { get; set; }
        public string Rol { get; set; }
        public string EstadoUsuario { get; set; }
        public string Clave { get; set; }
        public string Email { get; set; }
        public long VersionSesion { get; set; }
    }
}