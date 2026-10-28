using System;
using System.Data;
using System.Data.Entity.Core.EntityClient;
using System.Data.SqlClient;

namespace WebApi_TransporteSanchez.Security
{
    public sealed class RepositorioRecuperoSql : IRepositorioRecupero
    {
        internal static SqlConnection Conexion()
        {
            return new SqlConnection(new EntityConnectionStringBuilder(
                ConnectionStringHelper.GetConnectionString("SGTLEntities")).ProviderConnectionString);
        }

        internal static SqlCommand Comando(SqlConnection cn, SqlTransaction tx, string sql, params object[] valores)
        {
            var cmd = new SqlCommand(sql, cn, tx);
            for (var i = 0; i < valores.Length; i += 2)
                cmd.Parameters.AddWithValue((string)valores[i], valores[i + 1] ?? DBNull.Value);
            return cmd;
        }

        public SolicitudRecupero Crear(string email, string tokenHash)
        {
            using (var cn = Conexion())
            {
                cn.Open();
                string url;
                using (var cmd = Comando(cn, null, "SELECT UrlLogin FROM dbo.CONFIGURACION_EMAIL_MODULO WHERE Modulo='RECUPERO_CONTRASENA'"))
                    url = cmd.ExecuteScalar() as string;
                if (url == null) return null;
                RecuperoContrasena.ValidarUrlLogin(url);
                using (var tx = cn.BeginTransaction(IsolationLevel.Serializable))
                {
                    int id; long version; string clave;
                    // Siempre se bloquea primero el usuario, también al consumir un enlace.
                    using (var cmd = Comando(cn, tx, @"SELECT Usuario_ID, VersionSesion, Contraseña
FROM dbo.USUARIOS WITH (UPDLOCK, HOLDLOCK) WHERE Email=@email AND EstadoUsuario='Activo'", "@email", email))
                    using (var r = cmd.ExecuteReader())
                    {
                        if (!r.Read()) return null;
                        id = r.GetInt32(0); version = r.GetInt64(1); clave = r.GetString(2);
                    }
                    using (var cmd = Comando(cn, tx, @"SELECT COUNT(*) FROM dbo.RECUPERO_CONTRASENA
WHERE UsuarioID=@id AND CreadoUtc>DATEADD(hour,-1,SYSUTCDATETIME())", "@id", id))
                        if (Convert.ToInt32(cmd.ExecuteScalar()) >= 3) return null;
                    using (var cmd = Comando(cn, tx, @"SELECT COUNT(*) FROM dbo.RECUPERO_CONTRASENA
WHERE UsuarioID=@id AND CreadoUtc>DATEADD(minute,-2,SYSUTCDATETIME())", "@id", id))
                        if (Convert.ToInt32(cmd.ExecuteScalar()) > 0) return null;
                    using (var cmd = Comando(cn, tx, @"INSERT INTO dbo.RECUPERO_CONTRASENA
(TokenHash,UsuarioID,Email,VersionSesion,ClaveHuella,VenceUtc)
VALUES (@token,@id,@email,@version,@clave,DATEADD(minute,20,SYSUTCDATETIME()))",
                        "@token", tokenHash, "@id", id, "@email", email, "@version", version, "@clave", RecuperoContrasena.Huella(clave)))
                        cmd.ExecuteNonQuery();
                    // Solo se purga historial vencido antiguo; el límite de la última hora sigue intacto.
                    using (var cmd = Comando(cn, tx, "DELETE FROM dbo.RECUPERO_CONTRASENA WHERE UsuarioID=@id AND VenceUtc<DATEADD(day,-7,SYSUTCDATETIME())", "@id", id))
                        cmd.ExecuteNonQuery();
                    tx.Commit();
                    return new SolicitudRecupero { Email = email, UrlLogin = url };
                }
            }
        }

        public void MarcarEnviado(string tokenHash)
        {
            using (var cn = Conexion())
            {
                cn.Open();
                using (var cmd = Comando(cn, null, "UPDATE dbo.RECUPERO_CONTRASENA SET Enviado=1 WHERE TokenHash=@token AND UsadoUtc IS NULL", "@token", tokenHash))
                    cmd.ExecuteNonQuery();
            }
        }

        public void Descartar(string tokenHash)
        {
            using (var cn = Conexion())
            {
                cn.Open();
                using (var cmd = Comando(cn, null, "UPDATE dbo.RECUPERO_CONTRASENA SET UsadoUtc=SYSUTCDATETIME() WHERE TokenHash=@token", "@token", tokenHash))
                    cmd.ExecuteNonQuery();
            }
        }

        public string Completar(string tokenHash, string nuevaContrasenaHash)
        {
            using (var cn = Conexion())
            {
                cn.Open();
                int id;
                using (var cmd = Comando(cn, null, "SELECT UsuarioID FROM dbo.RECUPERO_CONTRASENA WHERE TokenHash=@token", "@token", tokenHash))
                {
                    var valor = cmd.ExecuteScalar();
                    if (valor == null) return null;
                    id = Convert.ToInt32(valor);
                }
                using (var tx = cn.BeginTransaction(IsolationLevel.Serializable))
                {
                    string email, clave, nombre; long version;
                    using (var cmd = Comando(cn, tx, @"SELECT Email, Contraseña, VersionSesion, Nombre_Usuario
FROM dbo.USUARIOS WITH (UPDLOCK,HOLDLOCK) WHERE Usuario_ID=@id AND EstadoUsuario='Activo'", "@id", id))
                    using (var r = cmd.ExecuteReader())
                    {
                        if (!r.Read() || r.IsDBNull(0)) return null;
                        email = r.GetString(0); clave = r.GetString(1); version = r.GetInt64(2); nombre = r.GetString(3);
                    }
                    using (var cmd = Comando(cn, tx, @"SELECT Email, VersionSesion, ClaveHuella
FROM dbo.RECUPERO_CONTRASENA WITH (UPDLOCK,HOLDLOCK)
WHERE TokenHash=@token AND UsuarioID=@id AND Enviado=1 AND UsadoUtc IS NULL AND VenceUtc>SYSUTCDATETIME()",
                        "@token", tokenHash, "@id", id))
                    using (var r = cmd.ExecuteReader())
                    {
                        if (!r.Read() || !string.Equals(email, r.GetString(0), StringComparison.OrdinalIgnoreCase) ||
                            version != r.GetInt64(1) || RecuperoContrasena.Huella(clave) != r.GetString(2)) return null;
                    }
                    using (var cmd = Comando(cn, tx, @"UPDATE dbo.USUARIOS SET Contraseña=@clave,
VersionSesion=VersionSesion+1, Fecha_Modi=CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime),
Usu_Modi=@nombre WHERE Usuario_ID=@id", "@clave", nuevaContrasenaHash, "@nombre", nombre, "@id", id))
                        cmd.ExecuteNonQuery();
                    using (var cmd = Comando(cn, tx, "UPDATE dbo.RECUPERO_CONTRASENA SET UsadoUtc=SYSUTCDATETIME() WHERE UsuarioID=@id AND UsadoUtc IS NULL", "@id", id))
                        cmd.ExecuteNonQuery();
                    using (var cmd = Comando(cn, tx, @"INSERT INTO dbo.AUDITORIA
(Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos)
VALUES (GETDATE(),@nombre,'RECUPERO_CONTRASENA','USUARIOS',@id,NULL,NULL)", "@nombre", nombre, "@id", "Usuario_ID=" + id))
                        cmd.ExecuteNonQuery();
                    tx.Commit();
                    return email;
                }
            }
        }
    }
}
