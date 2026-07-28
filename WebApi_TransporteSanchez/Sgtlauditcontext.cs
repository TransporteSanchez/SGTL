using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

namespace WebApi_TransporteSanchez
{
    /// <summary>
    /// Contexto con auditoria automatica. Reemplaza al DbContext generico que usan
    /// los controllers: cada vez que se llama SaveChanges(), registra en la tabla
    /// AUDITORIA todas las altas/bajas/modificaciones con sus valores antes/despues.
    ///
    /// Integracion: reemplazar en los controllers  new DbContext(...)  por
    /// new SGTLAuditContext(...)  (mismo argumento de connection string).
    /// </summary>
    public class SGTLAuditContext : DbContext
    {
        public SGTLAuditContext(string nameOrConnectionString) : base(nameOrConnectionString) { }

        /// <summary>
        /// Usuario responsable del cambio. Si el controller lo setea, se usa ese.
        /// Si no, se intenta deducir del propio registro (Usu_Modi / Usu_Alta) o del
        /// contexto HTTP; en ultimo caso queda "sistema".
        /// </summary>
        public string UsuarioAuditoria { get; set; }

        // Entidades que NO se auditan (evita ruido y recursion).
        private static readonly HashSet<string> EntidadesExcluidas =
            new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "AUDITORIA" };

        // Campos que nunca se guardan en claro.
        private static readonly HashSet<string> CamposSensibles =
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            { "Contraseña", "Contrasena", "Password", "Pass", "Clave_Acceso" };

        // ------------------------------------------------------------------ API

        public override int SaveChanges()
        {
            var pendientes = CapturarCambios();
            int resultado = base.SaveChanges();
            PersistirAuditoria(pendientes);
            return resultado;
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken)
        {
            var pendientes = CapturarCambios();
            int resultado = await base.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            PersistirAuditoria(pendientes);
            return resultado;
        }

        /// <summary>
        /// Registra un evento manual (LOGIN, LOGOUT, u otra accion que no pasa por
        /// SaveChanges). Nunca lanza excepcion: la auditoria no debe romper el flujo.
        /// </summary>
        public static void RegistrarEvento(string connectionString, string usuario, string accion,
            string entidad = null, string clave = null, string detalle = null, string origen = null)
        {
            try
            {
                using (var db = new DbContext(connectionString))
                {
                    db.Database.ExecuteSqlCommand(
                        "INSERT INTO AUDITORIA (Fecha, Usuario, Accion, Entidad, Clave, Valores_Anteriores, Valores_Nuevos, Origen) " +
                        "VALUES (GETDATE(), @usuario, @accion, @entidad, @clave, NULL, @detalle, @origen)",
                        P("@usuario", usuario),
                        P("@accion", accion),
                        P("@entidad", entidad),
                        P("@clave", clave),
                        P("@detalle", detalle),
                        P("@origen", origen ?? OrigenHttp()));
                }
            }
            catch { /* silencioso a proposito */ }
        }

        // -------------------------------------------------------------- interno

        private class CambioAudit
        {
            public DbEntityEntry Entry;
            public string Entidad;
            public string Accion;
            public string Usuario;
            public List<string> KeyNames;
            public string Clave;
            public string ValoresAnteriores;
            public string ValoresNuevos;
        }

        private List<CambioAudit> CapturarCambios()
        {
            var lista = new List<CambioAudit>();
            IObjectContextAdapter oca = this;
            var osm = oca.ObjectContext.ObjectStateManager;

            var entries = this.ChangeTracker.Entries()
                .Where(e => e.State == EntityState.Added
                         || e.State == EntityState.Modified
                         || e.State == EntityState.Deleted)
                .ToList();

            foreach (var entry in entries)
            {
                var entidad = entry.Entity.GetType().Name;
                if (EntidadesExcluidas.Contains(entidad)) continue;

                var cambio = new CambioAudit { Entry = entry, Entidad = entidad };

                // nombres de la clave primaria
                try
                {
                    var se = osm.GetObjectStateEntry(entry.Entity);
                    cambio.KeyNames = se.EntitySet.ElementType.KeyMembers.Select(k => k.Name).ToList();
                }
                catch { cambio.KeyNames = new List<string>(); }

                if (entry.State == EntityState.Added)
                {
                    cambio.Accion = "INSERT";
                    cambio.ValoresNuevos = SerializarValores(entry.CurrentValues);
                }
                else if (entry.State == EntityState.Deleted)
                {
                    cambio.Accion = "DELETE";
                    cambio.ValoresAnteriores = SerializarValores(entry.OriginalValues);
                    cambio.Clave = ResolverClave(entry.OriginalValues, cambio.KeyNames);
                }
                else
                {
                    cambio.Accion = "UPDATE";
                    string ant, nue;
                    SerializarCambios(entry, out ant, out nue);
                    cambio.ValoresAnteriores = ant;
                    cambio.ValoresNuevos = nue;
                }

                cambio.Usuario = ResolverUsuario(entry, cambio.Accion);
                lista.Add(cambio);
            }
            return lista;
        }

        private void PersistirAuditoria(List<CambioAudit> pendientes)
        {
            if (pendientes == null || pendientes.Count == 0) return;
            string origen = OrigenHttp();

            foreach (var c in pendientes)
            {
                // para INSERT/UPDATE la clave (identity) recien esta disponible tras el save
                if (c.Accion != "DELETE")
                {
                    try { c.Clave = ResolverClave(c.Entry.CurrentValues, c.KeyNames); }
                    catch { }
                }

                // en UPDATE sin cambios reales, no registramos
                if (c.Accion == "UPDATE" && (c.ValoresNuevos == "{}" || string.IsNullOrEmpty(c.ValoresNuevos)))
                    continue;

                try
                {
                    this.Database.ExecuteSqlCommand(
                        "INSERT INTO AUDITORIA (Fecha, Usuario, Accion, Entidad, Clave, Valores_Anteriores, Valores_Nuevos, Origen) " +
                        "VALUES (GETDATE(), @usuario, @accion, @entidad, @clave, @ant, @nue, @origen)",
                        P("@usuario", c.Usuario),
                        P("@accion", c.Accion),
                        P("@entidad", c.Entidad),
                        P("@clave", c.Clave),
                        P("@ant", c.ValoresAnteriores),
                        P("@nue", c.ValoresNuevos),
                        P("@origen", origen));
                }
                catch { /* la auditoria nunca debe romper la operacion principal */ }
            }
        }

        private string ResolverUsuario(DbEntityEntry entry, string accion)
        {
            if (!string.IsNullOrWhiteSpace(UsuarioAuditoria)) return UsuarioAuditoria;

            // deducir del propio registro
            var values = accion == "DELETE" ? entry.OriginalValues : entry.CurrentValues;
            var preferidos = accion == "INSERT"
                ? new[] { "Usu_Alta", "Usu_Modi" }
                : new[] { "Usu_Modi", "Usu_Alta" };
            foreach (var campo in preferidos)
            {
                try
                {
                    if (values.PropertyNames.Contains(campo))
                    {
                        var v = values[campo] as string;
                        if (!string.IsNullOrWhiteSpace(v)) return v;
                    }
                }
                catch { }
            }

            // contexto HTTP (si algun filtro lo dejo)
            try
            {
                var u = HttpContext.Current?.Items["UsuarioAuditoria"] as string;
                if (!string.IsNullOrWhiteSpace(u)) return u;
            }
            catch { }

            return "sistema";
        }

        private static string ResolverClave(DbPropertyValues values, List<string> keyNames)
        {
            if (keyNames == null || keyNames.Count == 0) return null;
            var partes = new List<string>();
            foreach (var k in keyNames)
            {
                try { partes.Add(k + "=" + Convert.ToString(values[k], CultureInfo.InvariantCulture)); }
                catch { }
            }
            return partes.Count > 0 ? string.Join(", ", partes) : null;
        }

        private static string SerializarValores(DbPropertyValues values)
        {
            var dict = new Dictionary<string, string>();
            foreach (var name in values.PropertyNames)
            {
                object val;
                try { val = values[name]; } catch { continue; }
                if (val is DbPropertyValues) continue; // omitir tipos complejos anidados
                dict[name] = Formatear(name, val);
            }
            return ToJson(dict);
        }

        private static void SerializarCambios(DbEntityEntry entry, out string antes, out string nuevos)
        {
            var orig = entry.OriginalValues;
            var cur = entry.CurrentValues;
            var antD = new Dictionary<string, string>();
            var nueD = new Dictionary<string, string>();

            foreach (var name in cur.PropertyNames)
            {
                object o = null, n = null;
                try { o = orig[name]; } catch { }
                try { n = cur[name]; } catch { }
                if (o is DbPropertyValues || n is DbPropertyValues) continue;
                if (!object.Equals(o, n))
                {
                    antD[name] = Formatear(name, o);
                    nueD[name] = Formatear(name, n);
                }
            }
            antes = ToJson(antD);
            nuevos = ToJson(nueD);
        }

        // Valores más largos que esto se resumen para no inflar la tabla AUDITORIA
        // (por ejemplo, un logo subido en base64).
        private const int MaxLongitudValor = 1000;

        private static string Formatear(string nombre, object val)
        {
            if (CamposSensibles.Contains(nombre)) return "***";
            if (val == null || val is DBNull) return null;
            if (val is DateTime) return ((DateTime)val).ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
            if (val is bool) return ((bool)val) ? "true" : "false";
            string texto;
            var f = val as IFormattable;
            if (f != null) texto = f.ToString(null, CultureInfo.InvariantCulture);
            else texto = Convert.ToString(val, CultureInfo.InvariantCulture);
            if (texto != null && texto.Length > MaxLongitudValor)
                return "[valor extenso omitido: " + texto.Length + " caracteres]";
            return texto;
        }

        private static string ToJson(Dictionary<string, string> dict)
        {
            var sb = new StringBuilder("{");
            bool primero = true;
            foreach (var kv in dict)
            {
                if (!primero) sb.Append(",");
                primero = false;
                sb.Append('"').Append(Escapar(kv.Key)).Append("\":");
                if (kv.Value == null) sb.Append("null");
                else sb.Append('"').Append(Escapar(kv.Value)).Append('"');
            }
            sb.Append("}");
            return sb.ToString();
        }

        private static string Escapar(string s)
        {
            if (string.IsNullOrEmpty(s)) return s ?? "";
            var sb = new StringBuilder(s.Length + 8);
            foreach (var c in s)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\b': sb.Append("\\b"); break;
                    case '\f': sb.Append("\\f"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (c < ' ') sb.Append("\\u").Append(((int)c).ToString("x4"));
                        else sb.Append(c);
                        break;
                }
            }
            return sb.ToString();
        }

        private static string OrigenHttp()
        {
            try { return HttpContext.Current?.Request?.UserHostAddress; }
            catch { return null; }
        }

        private static SqlParameter P(string nombre, string valor)
        {
            return new SqlParameter(nombre, (object)valor ?? DBNull.Value);
        }
    }
}