using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Web.Http;
using WebApi_TransporteSanchez.Plataformas;

namespace WebApi_TransporteSanchez.Controllers
{
    // Proforma de plataforma (hoy Rukas): se importa el archivo de la plataforma como borrador y se controla
    // línea por línea contra los viajes de SGTL. Diseño: docs/negocio/PROFORMA-CLIENTES-RUKAS.md (§10) y
    // docs/diseno/proforma-rukas-diseno.md (§3). El circuito es igual para todas las plataformas; lo propio de
    // cada una está en su lector (Plataformas/LectoresPlataforma.cs). SQL directo: las columnas son de
    // database/proformas-plataforma/01_plataformas_y_proformas.sql (fuera del EDMX).
    [RoutePrefix("api/ProformasPlataforma")]
    public class ProformasPlataformaController : ApiController
    {
        private const int MaxBytesArchivo = 5 * 1024 * 1024;
        private const decimal IvaPct = 21m;

        // Columnas de VIAJES que un lector puede usar como referencia (se arman en el SQL).
        private static readonly string[] ColumnasViajePermitidas = { "Num_Transporte", "Num_Remito", "Num_de_Carga" };

        // ============================ DTOs ============================
        public class ImportarDto
        {
            public int ClienteID { get; set; }
            public string NumeroPlataforma { get; set; }
            public string NombreArchivo { get; set; }
            public string ContentType { get; set; }
            public string ArchivoBase64 { get; set; }
            // Celdas del archivo como texto; la primera fila es el encabezado.
            public List<List<string>> Filas { get; set; }
            public string Usuario { get; set; }
            // Cabecera, igual que en la proforma propia.
            public string Moneda { get; set; }
            public DateTime? FechaEmision { get; set; }
            public DateTime? FechaVencimiento { get; set; }
            public string Cli_RazonSocial { get; set; }
            public string Cli_NombreComercial { get; set; }
            public string Cli_CUIT { get; set; }
            public string Cli_Direccion { get; set; }
            public string Cli_Ciudad { get; set; }
            public string Cli_Provincia { get; set; }
            public string Cli_CP { get; set; }
            public string Cli_Telefono { get; set; }
            public string Cli_Email { get; set; }
            public string Cli_Contacto { get; set; }
            public string FormaPago { get; set; }
            public string PlazoPago { get; set; }
            public string Validez { get; set; }
            public string Observaciones { get; set; }
        }

        // Nombre propio: Swagger no admite dos clases con el mismo nombre (ProformasController.UsuarioDto).
        public class UsuarioPlataformaDto { public string Usuario { get; set; } }

        // Condiciones comerciales de la cabecera: lo único que se edita en un borrador de plataforma (el cliente y
        // los conceptos salen del archivo). Como en la proforma propia, solo en Borrador.
        public class CondicionesDto
        {
            public string FormaPago { get; set; }
            public string PlazoPago { get; set; }
            public string Validez { get; set; }
            public string Observaciones { get; set; }
            public string Usuario { get; set; }
        }

        public class ReclamoDto
        {
            public DateTime? Fecha { get; set; }
            public string Motivo { get; set; }
            public string Usuario { get; set; }
            // Orden de las líneas que se reclaman (solo diferencias). Vacío: reclamo general, sin líneas.
            public List<int> Lineas { get; set; }
        }

        public class LineaControlDto
        {
            public int Orden { get; set; }
            public string Referencia { get; set; }
            public DateTime? Fecha { get; set; }
            public string Ruta { get; set; }
            public decimal ImporteViaje { get; set; }
            public decimal Adicionales { get; set; }
            public int? ViajeID { get; set; }
            public decimal? ImporteSgtl { get; set; }
            public decimal? Diferencia { get; set; }
            public string TarifaUsada { get; set; }
            public string Resultado { get; set; }
            public string Detalle { get; set; }
            public bool Coincide { get; set; }
            // De quién es la diferencia: "SGTL", "Plataforma" o "Revisar" (decide la persona); null si coincide.
            public string Responsable { get; set; }
            // Incluida en el reclamo pendiente en la plataforma.
            public bool Reclamada { get; set; }
        }

        public class ControlDto
        {
            public int Proforma_ID { get; set; }
            public string Estado { get; set; }
            public string Numero { get; set; }
            public string Plataforma { get; set; }
            public string NumeroPlataforma { get; set; }
            public DateTime? FechaDesde { get; set; }
            public DateTime? FechaHasta { get; set; }
            public string NombreArchivo { get; set; }
            public DateTime? FechaArchivo { get; set; }
            public DateTime? ReclamoFecha { get; set; }
            public string ReclamoMotivo { get; set; }
            public int Cantidad { get; set; }
            public int Coinciden { get; set; }
            public int Diferencias { get; set; }
            // Las diferencias según quién las resuelve (las reclamadas cuentan solo en Esperando).
            public int PorCorregir { get; set; }
            public int PorRevisar { get; set; }
            public int PorReclamar { get; set; }
            public int Esperando { get; set; }
            public decimal TotalViajes { get; set; }
            public decimal TotalAdicionales { get; set; }
            public decimal TotalPlataforma { get; set; }
            public decimal TotalSgtl { get; set; }
            // IVA y total de la proforma (netos de la plataforma + IVA 21 %), los mismos que se guardan y se facturan.
            public decimal Iva { get; set; }
            public decimal Total { get; set; }
            public bool PuedeGenerar { get; set; }
            public List<LineaControlDto> Lineas { get; set; }
            public List<string> Avisos { get; set; }
        }

        public class ViajeSinProformaDto
        {
            public int ViajeID { get; set; }
            public DateTime Fecha { get; set; }
            public string Referencia { get; set; }
            public string Origen { get; set; }
            public string Destino { get; set; }
            public string Estado { get; set; }
            // Números que le faltan para pasar a Listo para facturar ("" si tiene todos).
            public string Faltan { get; set; }
        }

        // ======================= Filas de SQL =======================
        private class ClientePlataforma
        {
            public int Cliente_ID { get; set; }
            public string Tipo_Cliente { get; set; }
            public int Cond_Fiscal { get; set; }
            public int? Plataforma_ID { get; set; }
            public string Nombre { get; set; }
            public string Codigo { get; set; }
        }

        private class LineaRow
        {
            public int Linea_ID { get; set; }
            public int Orden { get; set; }
            public string Referencia { get; set; }
            public DateTime? Fecha { get; set; }
            public string Ruta { get; set; }
            public decimal Importe_Viaje { get; set; }
            public decimal Adicionales { get; set; }
            public int? Viaje_ID { get; set; }
            public decimal? Importe_SGTL { get; set; }
            public string Tarifa_Usada { get; set; }
            public string Resultado { get; set; }
            public string Detalle { get; set; }
            public bool Reclamada { get; set; }
        }

        private class ViajeRow
        {
            public int Viaje_ID { get; set; }
            public string Referencia { get; set; }
            public string Num_Transporte { get; set; }
            public string Num_Remito { get; set; }
            public string Num_de_Carga { get; set; }
            public string Estado { get; set; }
            public string Distancia_KM { get; set; }
            public DateTime Fecha_Inicio { get; set; }
            public string Origen { get; set; }
            public string Destino { get; set; }
        }

        private class CabeceraRow
        {
            public int Proforma_ID { get; set; }
            public string Estado { get; set; }
            public string Numero { get; set; }
            public string Tipo_Proforma { get; set; }
            public int? ClienteID { get; set; }
            public string Plataforma { get; set; }
            public string Codigo { get; set; }
            public string Plataforma_Numero { get; set; }
            public DateTime? FechaDesde { get; set; }
            public DateTime? FechaHasta { get; set; }
            public DateTime? Plataforma_Reclamo_Fecha { get; set; }
            public string Plataforma_Reclamo_Motivo { get; set; }
            public string Nombre_Archivo { get; set; }
            public DateTime? Fecha_Archivo { get; set; }
        }

        // ======================= Helpers =======================
        private static string Cn() { return ConnectionStringHelper.GetConnectionString("SGTLEntities"); }
        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }
        private static readonly CultureInfo EsAr = new CultureInfo("es-AR");
        private static string Pesos(decimal v) { return "$" + v.ToString("N0", EsAr); }
        private static decimal CalcularIva(decimal neto) { return decimal.Round(neto * IvaPct / 100m, 2, MidpointRounding.AwayFromZero); }

        private static string UsuarioCorto(string u)
        {
            u = string.IsNullOrWhiteSpace(u) ? "sistema" : u.Trim();
            return u.Length > 20 ? u.Substring(0, 20) : u;
        }

        private static void Auditar(DbContext db, string usuario, string accion, int id, string ant, string nue)
        {
            try
            {
                db.Database.ExecuteSqlCommand(
                    "INSERT INTO AUDITORIA (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen) " +
                    "VALUES (GETDATE(),@u,@a,'PROFORMAS',@k,@ant,@nue,NULL)",
                    P("@u", usuario), P("@a", accion), P("@k", "Proforma_ID=" + id), P("@ant", ant), P("@nue", nue));
            }
            catch { }
        }

        // Cliente con su plataforma. Si el cliente no la tiene asignada y hay una sola plataforma activa, se usa esa.
        private static ClientePlataforma LeerCliente(DbContext db, int clienteId)
        {
            return db.Database.SqlQuery<ClientePlataforma>(@"
SELECT c.Cliente_ID, ISNULL(c.Tipo_Cliente,'Directo') AS Tipo_Cliente, c.Cond_Fiscal,
       p.Plataforma_ID, p.Nombre, p.Codigo
FROM dbo.CLIENTES c
LEFT JOIN dbo.PLATAFORMAS p ON p.Plataforma_ID = ISNULL(c.PlataformaID,
    (SELECT CASE WHEN COUNT(*) = 1 THEN MIN(Plataforma_ID) END FROM dbo.PLATAFORMAS WHERE Activa = 1))
WHERE c.Cliente_ID = @cli;", P("@cli", clienteId)).FirstOrDefault();
        }

        private static int ObtenerUsuarioId(DbContext db, string usuario)
        {
            int? usuarioId = db.Database.SqlQuery<int?>(@"
SELECT TOP (1) Usuario_ID FROM dbo.USUARIOS WHERE Nombre_Usuario=@usuario AND EstadoUsuario='Activo';",
                P("@usuario", usuario)).FirstOrDefault();
            if (!usuarioId.HasValue)
                throw new InvalidOperationException("El usuario activo no es válido para reservar viajes en la proforma.");
            return usuarioId.Value;
        }

        private static CabeceraRow LeerCabecera(DbContext db, int id)
        {
            return db.Database.SqlQuery<CabeceraRow>(@"
SELECT pf.Proforma_ID, pf.Estado, pf.Numero, pf.Tipo_Proforma, pf.ClienteID, pl.Nombre AS Plataforma, pl.Codigo,
       pf.Plataforma_Numero, pf.FechaDesde, pf.FechaHasta, pf.Plataforma_Reclamo_Fecha, pf.Plataforma_Reclamo_Motivo,
       a.Nombre_Archivo, a.Fecha_Alta AS Fecha_Archivo
FROM dbo.PROFORMAS pf
LEFT JOIN dbo.PLATAFORMAS pl ON pl.Plataforma_ID = pf.PlataformaID
LEFT JOIN dbo.PROFORMA_ADJUNTO a ON a.Proforma_ID = pf.Proforma_ID AND a.Tipo = 'Archivo'
WHERE pf.Proforma_ID = @id;", P("@id", id)).FirstOrDefault();
        }

        // Guarda las líneas leídas y el archivo de la proforma (reemplaza lo que hubiera).
        private static void GuardarLineasYArchivo(DbContext db, int id, LecturaArchivo lectura, byte[] archivo,
            string nombreArchivo, string contentType, string usuario)
        {
            db.Database.ExecuteSqlCommand("DELETE FROM dbo.PROFORMA_PLATAFORMA_LINEA WHERE Proforma_ID=@id", P("@id", id));
            // Las líneas con un dato mal en el archivo entran con su resultado (ResultadosArchivo), que el control no cambia.
            foreach (var l in lectura.Lineas)
                db.Database.ExecuteSqlCommand(@"
INSERT dbo.PROFORMA_PLATAFORMA_LINEA (Proforma_ID,Orden,Referencia,Fecha,Ruta,Importe_Viaje,Adicionales,Resultado,Detalle)
VALUES (@id,@orden,@ref,@fecha,@ruta,@imp,@adic,@res,@det);",
                    P("@id", id), P("@orden", l.Orden), P("@ref", l.Referencia), P("@fecha", l.Fecha),
                    P("@ruta", string.IsNullOrEmpty(l.Ruta) ? null : (l.Ruta.Length > 150 ? l.Ruta.Substring(0, 150) : l.Ruta)),
                    P("@imp", l.ImporteViaje), P("@adic", l.Adicionales), P("@res", l.Resultado), P("@det", l.Detalle));

            var nombre = string.IsNullOrWhiteSpace(nombreArchivo) ? "proforma.xlsx" : nombreArchivo.Trim();
            nombre = nombre.Substring(nombre.LastIndexOfAny(new[] { '/', '\\' }) + 1);
            if (nombre.Length > 260) nombre = nombre.Substring(nombre.Length - 260);
            db.Database.ExecuteSqlCommand("DELETE FROM dbo.PROFORMA_ADJUNTO WHERE Proforma_ID=@id AND Tipo='Archivo'", P("@id", id));
            db.Database.ExecuteSqlCommand(@"
INSERT dbo.PROFORMA_ADJUNTO (Proforma_ID,Tipo,Nombre_Archivo,Content_Type,Archivo,Usu_Alta)
VALUES (@id,'Archivo',@nombre,@tipo,@archivo,@u);",
                P("@id", id), P("@nombre", nombre),
                P("@tipo", string.IsNullOrWhiteSpace(contentType) ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : contentType),
                P("@archivo", archivo), P("@u", UsuarioCorto(usuario)));
        }

        // Para la auditoría: cuántas líneas vinieron con un dato mal o repetido en el archivo.
        private static string DescribirErroresArchivo(LecturaArchivo lectura)
        {
            int n = lectura.Lineas.Count(l => ResultadosArchivo.Es(l.Resultado));
            return n == 0 ? "" : " (" + n + " con error en el archivo)";
        }

        private static byte[] LeerBase64(string base64, out string error)
        {
            error = null;
            byte[] archivo;
            try { archivo = Convert.FromBase64String(base64 ?? ""); }
            catch (FormatException) { error = "El archivo no es válido."; return null; }
            if (archivo.Length == 0 || archivo.Length > MaxBytesArchivo) { error = "El archivo tiene que pesar como máximo 5 MB."; return null; }
            return archivo;
        }

        // ======================= Control =======================

        // De quién es cada diferencia (docs/diseno/proforma-rukas-diseno.md §4): las de SGTL se corrigen en el viaje,
        // las de la plataforma son de su archivo (se reclaman) y las de "Revisar" las decide la persona con la tarifa
        // usada a la vista: corrige el viaje o las reclama.
        private static readonly string[] ResultadosSgtl = { "Sin_viaje", "Repetido_en_SGTL", "Faltan_numeros", "Sin_tarifa" };
        private static readonly string[] ResultadosPlataforma = { ResultadosArchivo.Repetido, ResultadosArchivo.DatoInvalido };

        private static string Responsable(string resultado)
        {
            if (resultado == "Coincide") return null;
            if (ResultadosSgtl.Contains(resultado)) return "SGTL";
            if (ResultadosPlataforma.Contains(resultado)) return "Plataforma";
            return "Revisar";
        }

        // Situación de los borradores de plataforma para el listado de proformas (ProformasController.Listar), con
        // la misma clasificación que Responsable(). Es un OUTER APPLY sobre PROFORMAS; en las demás proformas da 0 / NULL.
        internal static string SqlSituacionBorrador()
        {
            Func<string[], string> lista = rs => string.Join(",", rs.Select(x => "'" + x + "'"));
            string noCuenta = "l.Resultado = 'Coincide' OR l.Reclamada = 1";
            return "OUTER APPLY (SELECT COUNT(*) AS PlataformaLineas, " +
                "SUM(CASE WHEN l.Resultado = 'Coincide' THEN 0 WHEN l.Reclamada = 1 THEN 1 ELSE 0 END) AS PlataformaEsperando, " +
                "SUM(CASE WHEN " + noCuenta + " THEN 0 WHEN l.Resultado IN (" + lista(ResultadosSgtl) + ") THEN 1 ELSE 0 END) AS PlataformaPorCorregir, " +
                "SUM(CASE WHEN " + noCuenta + " THEN 0 WHEN l.Resultado IN (" + lista(ResultadosPlataforma) + ") THEN 1 ELSE 0 END) AS PlataformaPorReclamar, " +
                "SUM(CASE WHEN " + noCuenta + " OR l.Resultado IN (" + lista(ResultadosSgtl) + "," + lista(ResultadosPlataforma) + ") THEN 0 ELSE 1 END) AS PlataformaPorRevisar " +
                "FROM dbo.PROFORMA_PLATAFORMA_LINEA l " +
                "WHERE l.Proforma_ID = PROFORMAS.Proforma_ID AND PROFORMAS.Tipo_Proforma = 'Plataforma' AND PROFORMAS.Estado = 'Borrador') sit ";
        }

        // Cruza cada línea del archivo con los viajes del cliente, guarda el resultado, actualiza las reservas
        // de viajes (PROFORMAS_VIAJES) y los totales de la proforma. Se usa al importar y en "Volver a controlar".
        private static void Controlar(DbContext db, int proformaId, int clienteId, string nombrePlataforma,
            ILectorPlataforma lector, string usuario)
        {
            string columna = lector.ColumnaReferenciaViaje;
            if (Array.IndexOf(ColumnasViajePermitidas, columna) < 0)
                throw new InvalidOperationException("El lector de " + nombrePlataforma + " usa una columna de viaje no permitida.");

            var lineas = db.Database.SqlQuery<LineaRow>(
                "SELECT * FROM dbo.PROFORMA_PLATAFORMA_LINEA WHERE Proforma_ID=@id ORDER BY Orden", P("@id", proformaId)).ToList();

            var viajes = db.Database.SqlQuery<ViajeRow>(
                "SELECT v.Viaje_ID, RTRIM(ISNULL(v." + columna + ",'')) AS Referencia, " +
                "RTRIM(ISNULL(v.Num_Transporte,'')) AS Num_Transporte, RTRIM(ISNULL(v.Num_Remito,'')) AS Num_Remito, " +
                "RTRIM(ISNULL(v.Num_de_Carga,'')) AS Num_de_Carga, v.Estado, " +
                "RTRIM(ISNULL(v.Distancia_KM,'')) AS Distancia_KM, v.Fecha_Inicio, " +
                "ISNULL(o.Descripcion,'') AS Origen, ISNULL(d.Descripcion,'') AS Destino " +
                "FROM dbo.VIAJES v LEFT JOIN dbo.ORIGEN o ON o.Origen_ID = v.OrigenID LEFT JOIN dbo.DESTINO d ON d.Destino_ID = v.DestinoID " +
                "WHERE v.ClienteID=@cli", P("@cli", clienteId)).ToList();

            // Viajes que ya están en otra proforma no anulada (reserva o línea histórica V{id}).
            var enOtraProforma = new HashSet<int>(db.Database.SqlQuery<int>(@"
SELECT DISTINCT r.ViajeID FROM (
    SELECT pv.ViajeID FROM dbo.PROFORMAS_VIAJES pv
    JOIN dbo.PROFORMAS p ON p.Proforma_ID = pv.ProformaID
    WHERE p.Proforma_ID <> @id AND p.Estado <> 'Anulada'
    UNION
    SELECT TRY_CONVERT(int, SUBSTRING(LTRIM(RTRIM(ISNULL(pd.Codigo,''))), 2, 20))
    FROM dbo.PROFORMA_DETALLE pd
    JOIN dbo.PROFORMAS p ON p.Proforma_ID = pd.Proforma_ID
    WHERE p.Proforma_ID <> @id AND p.Estado <> 'Anulada' AND UPPER(LEFT(LTRIM(RTRIM(ISNULL(pd.Codigo,''))), 1)) = 'V'
) r WHERE r.ViajeID IS NOT NULL;", P("@id", proformaId)).ToList());

            var tarifas = ProformasController.CargarTarifas(db);

            var reservar = new List<int>();
            foreach (var l in lineas)
            {
                // Dato mal o repetido en el archivo: es de la plataforma y se corrige con un Excel nuevo, no con el control.
                if (ResultadosArchivo.Es(l.Resultado)) continue;

                int? viajeId = null; decimal? importeSgtl = null; string tarifa = null, resultado, detalle;
                var candidatos = viajes.Where(v => v.Referencia == l.Referencia).ToList();

                if (candidatos.Count == 0)
                {
                    resultado = "Sin_viaje";
                    detalle = "No hay un viaje de este cliente con el N° " + l.Referencia + ". Cargalo o corregí el N° en el viaje.";
                }
                else if (candidatos.Count > 1)
                {
                    resultado = "Repetido_en_SGTL";
                    detalle = "Hay " + candidatos.Count + " viajes con el N° " + l.Referencia + ": "
                        + string.Join(", ", candidatos.Select(c => "#" + c.Viaje_ID)) + ". Corregí el que esté mal.";
                }
                else
                {
                    var v = candidatos[0];
                    viajeId = v.Viaje_ID;
                    if (v.Estado == "Facturado")
                    {
                        resultado = "Ya_facturado";
                        detalle = "El viaje #" + v.Viaje_ID + " ya está facturado.";
                    }
                    else if (enOtraProforma.Contains(v.Viaje_ID))
                    {
                        resultado = "En_otra_proforma";
                        detalle = "El viaje #" + v.Viaje_ID + " ya está en otra proforma.";
                    }
                    else
                    {
                        reservar.Add(v.Viaje_ID);
                        var calculo = ProformasController.ImporteViaje(tarifas, v.Viaje_ID);
                        importeSgtl = calculo.Importe;
                        tarifa = calculo.TarifaUsada;
                        var faltan = NumerosFaltantes(v, lector);
                        if (faltan.Count > 0)
                        {
                            resultado = "Faltan_numeros";
                            detalle = "Al viaje #" + v.Viaje_ID + " le falta: " + string.Join(", ", faltan) + ".";
                        }
                        else if (!importeSgtl.HasValue || importeSgtl.Value <= 0)
                        {
                            resultado = "Sin_tarifa";
                            detalle = "El viaje #" + v.Viaje_ID + " no tiene tarifa o da $0. Asignale la tarifa en el viaje.";
                        }
                        else if (decimal.Round(importeSgtl.Value, 0, MidpointRounding.AwayFromZero) != l.Importe_Viaje)
                        {
                            resultado = "Importe_distinto";
                            detalle = nombrePlataforma + " " + Pesos(l.Importe_Viaje) + ", SGTL " + Pesos(importeSgtl.Value)
                                + ". Corregí la tarifa del viaje o registrá un reclamo en " + nombrePlataforma + ".";
                        }
                        else
                        {
                            resultado = "Coincide";
                            detalle = null;
                        }
                    }
                }

                db.Database.ExecuteSqlCommand(@"
UPDATE dbo.PROFORMA_PLATAFORMA_LINEA
SET Viaje_ID=@viaje, Importe_SGTL=@sgtl, Tarifa_Usada=@tarifa, Resultado=@res, Detalle=@det
WHERE Linea_ID=@linea;",
                    P("@viaje", viajeId), P("@sgtl", importeSgtl.HasValue ? (object)decimal.Round(importeSgtl.Value, 2) : null),
                    P("@tarifa", tarifa), P("@res", resultado), P("@det", detalle), P("@linea", l.Linea_ID));
            }

            // Reservas: los viajes encontrados quedan en esta proforma (un viaje en una sola proforma, también en borrador).
            db.Database.ExecuteSqlCommand("DELETE FROM dbo.PROFORMAS_VIAJES WHERE ProformaID=@id", P("@id", proformaId));
            if (reservar.Count > 0)
            {
                int usuarioId = ObtenerUsuarioId(db, usuario);
                foreach (var viajeId in reservar.Distinct())
                    db.Database.ExecuteSqlCommand(
                        "INSERT dbo.PROFORMAS_VIAJES (ProformaID,ViajeID,UsuarioAltaID) VALUES (@p,@v,@u);",
                        P("@p", proformaId), P("@v", viajeId), P("@u", usuarioId));
            }

            // Totales con lo de la plataforma (netos) + IVA, igual que ComputarTotales de la proforma propia.
            decimal subtotal = lineas.Sum(x => x.Importe_Viaje + x.Adicionales);
            decimal iva = CalcularIva(subtotal);
            var fechas = lineas.Where(x => x.Fecha.HasValue).Select(x => x.Fecha.Value).ToList();
            db.Database.ExecuteSqlCommand(@"
UPDATE dbo.PROFORMAS
SET Subtotal=@sub, Descuentos=0, SubtotalNeto=@sub, IVA=@iva, OtrosImpuestos=0, TotalGeneral=@tot, ImporteTotal=@tot,
    CantidadViajes=@cant, FechaDesde=@desde, FechaHasta=@hasta, Usu_Modi=@u, Fecha_Modi=GETDATE()
WHERE Proforma_ID=@id;",
                P("@sub", subtotal), P("@iva", iva), P("@tot", subtotal + iva), P("@cant", lineas.Count.ToString()),
                P("@desde", fechas.Count > 0 ? fechas.Min() : DateTime.Today),
                P("@hasta", fechas.Count > 0 ? fechas.Max() : DateTime.Today),
                P("@u", usuario), P("@id", proformaId));
        }

        private static string NombreNumero(string columna)
        {
            return columna == "Num_Transporte" ? "N° de transporte SAP"
                : columna == "Num_Remito" ? "remito"
                : columna == "Num_de_Carga" ? "N° de entrega" : columna;
        }

        private static List<string> NumerosFaltantes(ViajeRow v, ILectorPlataforma lector)
        {
            var faltan = new List<string>();
            foreach (var col in lector.ColumnasNumerosObligatorios)
            {
                if ((col == "Num_Transporte" && string.IsNullOrWhiteSpace(v.Num_Transporte))
                    || (col == "Num_Remito" && string.IsNullOrWhiteSpace(v.Num_Remito))
                    || (col == "Num_de_Carga" && string.IsNullOrWhiteSpace(v.Num_de_Carga)))
                    faltan.Add(NombreNumero(col));
            }
            return faltan;
        }

        // Guía antes de generar en la plataforma (paso 0) y aviso del caso 7: viajes del cliente en Registrado o
        // Listo para facturar, con el dato con el que se cruza cargado (para Rukas, el N° de transporte), que no
        // están en ninguna proforma no anulada (reserva o línea V{id}). Los que tienen la referencia pero les
        // falta otro número también salen, marcados: si se tildan en la plataforma, el control los frena.
        private static List<ViajeSinProformaDto> ViajesSinProforma(DbContext db, int clienteId, ILectorPlataforma lector)
        {
            string columna = lector.ColumnaReferenciaViaje;
            if (Array.IndexOf(ColumnasViajePermitidas, columna) < 0)
                throw new InvalidOperationException("El lector usa una columna de viaje no permitida.");

            var filas = db.Database.SqlQuery<ViajeRow>(
                "SELECT v.Viaje_ID, RTRIM(ISNULL(v." + columna + ",'')) AS Referencia, " +
                "RTRIM(ISNULL(v.Num_Transporte,'')) AS Num_Transporte, RTRIM(ISNULL(v.Num_Remito,'')) AS Num_Remito, " +
                "RTRIM(ISNULL(v.Num_de_Carga,'')) AS Num_de_Carga, v.Estado, " +
                "RTRIM(ISNULL(v.Distancia_KM,'')) AS Distancia_KM, v.Fecha_Inicio, " +
                "ISNULL(o.Descripcion,'') AS Origen, ISNULL(d.Descripcion,'') AS Destino " +
                "FROM dbo.VIAJES v LEFT JOIN dbo.ORIGEN o ON o.Origen_ID = v.OrigenID LEFT JOIN dbo.DESTINO d ON d.Destino_ID = v.DestinoID " +
                "WHERE v.ClienteID=@cli AND v.Estado IN ('Registrado','Listo_para_facturar') " +
                "  AND RTRIM(ISNULL(v." + columna + ",'')) <> '' " +
                "  AND NOT EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv JOIN dbo.PROFORMAS p ON p.Proforma_ID = pv.ProformaID " +
                "                  WHERE pv.ViajeID = v.Viaje_ID AND p.Estado <> 'Anulada') " +
                "  AND NOT EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd JOIN dbo.PROFORMAS p ON p.Proforma_ID = pd.Proforma_ID " +
                "                  WHERE p.Estado <> 'Anulada' AND LTRIM(RTRIM(ISNULL(pd.Codigo,''))) = 'V' + CAST(v.Viaje_ID AS varchar(12))) " +
                "ORDER BY v.Fecha_Inicio, v.Viaje_ID", P("@cli", clienteId)).ToList();

            return filas.Select(v => new ViajeSinProformaDto
            {
                ViajeID = v.Viaje_ID,
                Fecha = v.Fecha_Inicio,
                Referencia = v.Referencia,
                Origen = v.Origen,
                Destino = v.Destino,
                Estado = v.Estado,
                Faltan = string.Join(", ", NumerosFaltantes(v, lector))
            }).ToList();
        }

        // Arma lo que ve la pantalla: cabecera, líneas con su resultado, totales y avisos.
        private static ControlDto ArmarControl(DbContext db, int id)
        {
            var c = LeerCabecera(db, id);
            if (c == null) return null;
            var filas = db.Database.SqlQuery<LineaRow>(
                "SELECT * FROM dbo.PROFORMA_PLATAFORMA_LINEA WHERE Proforma_ID=@id ORDER BY Orden", P("@id", id)).ToList();

            var lineas = filas.Select(f => new LineaControlDto
            {
                Orden = f.Orden,
                Referencia = f.Referencia,
                Fecha = f.Fecha,
                Ruta = f.Ruta,
                ImporteViaje = f.Importe_Viaje,
                Adicionales = f.Adicionales,
                ViajeID = f.Viaje_ID,
                ImporteSgtl = f.Importe_SGTL,
                Diferencia = f.Importe_SGTL.HasValue ? f.Importe_Viaje - decimal.Round(f.Importe_SGTL.Value, 0, MidpointRounding.AwayFromZero) : (decimal?)null,
                TarifaUsada = f.Tarifa_Usada,
                Resultado = f.Resultado,
                Detalle = f.Detalle,
                Coincide = f.Resultado == "Coincide",
                Responsable = Responsable(f.Resultado),
                Reclamada = f.Reclamada && f.Resultado != "Coincide"
            })
            // Las diferencias primero.
            .OrderBy(x => x.Coincide).ThenBy(x => x.Orden).ToList();
            var pendientes = lineas.Where(x => !x.Coincide && !x.Reclamada).ToList();

            var dto = new ControlDto
            {
                Proforma_ID = c.Proforma_ID,
                Estado = c.Estado,
                Numero = c.Numero,
                Plataforma = c.Plataforma,
                NumeroPlataforma = c.Plataforma_Numero,
                FechaDesde = c.FechaDesde,
                FechaHasta = c.FechaHasta,
                NombreArchivo = c.Nombre_Archivo,
                FechaArchivo = c.Fecha_Archivo,
                ReclamoFecha = c.Plataforma_Reclamo_Fecha,
                ReclamoMotivo = c.Plataforma_Reclamo_Motivo,
                Cantidad = lineas.Count,
                Coinciden = lineas.Count(x => x.Coincide),
                Diferencias = lineas.Count(x => !x.Coincide),
                PorCorregir = pendientes.Count(x => x.Responsable == "SGTL"),
                PorRevisar = pendientes.Count(x => x.Responsable == "Revisar"),
                PorReclamar = pendientes.Count(x => x.Responsable == "Plataforma"),
                Esperando = lineas.Count(x => x.Reclamada),
                TotalViajes = lineas.Sum(x => x.ImporteViaje),
                TotalAdicionales = lineas.Sum(x => x.Adicionales),
                TotalSgtl = lineas.Sum(x => x.ImporteSgtl.HasValue ? decimal.Round(x.ImporteSgtl.Value, 0, MidpointRounding.AwayFromZero) : 0m),
                Lineas = lineas,
                Avisos = new List<string>()
            };
            dto.TotalPlataforma = dto.TotalViajes + dto.TotalAdicionales;
            dto.Iva = CalcularIva(dto.TotalPlataforma);
            dto.Total = dto.TotalPlataforma + dto.Iva;
            dto.PuedeGenerar = c.Estado == "Borrador" && dto.Cantidad > 0 && dto.Diferencias == 0;
            var lector = LectoresPlataforma.Obtener(c.Codigo);

            // Caso 7 (aviso, no frena): viajes del cliente que no están en ninguna proforma. Solo en borrador:
            // después de generar ya no sirve. Es la misma lista que la guía de "Registrar proforma".
            if (c.Estado == "Borrador" && c.ClienteID.HasValue && lector != null)
            {
                var sueltos = ViajesSinProforma(db, c.ClienteID.Value, lector);
                string dato = NombreNumero(lector.ColumnaReferenciaViaje);
                if (sueltos.Count > 0)
                    dto.Avisos.Add((sueltos.Count == 1
                        ? "Hay 1 viaje de este cliente con el " + dato + " cargado que no está en ninguna proforma de " + c.Plataforma + ": "
                        : "Hay " + sueltos.Count + " viajes de este cliente con el " + dato + " cargado que no están en ninguna proforma de " + c.Plataforma + ": ")
                        + string.Join(", ", sueltos.Select(s => "#" + s.ViajeID + " (" + s.Fecha.ToString("dd/MM") + ")"))
                        + ". Si no los tildaste en " + c.Plataforma + ", van en la próxima proforma.");
            }
            return dto;
        }

        // ======================= Endpoints =======================

        // Importa el archivo de la plataforma: crea la proforma de plataforma en Borrador con sus líneas y el
        // archivo, reserva los viajes que coinciden y devuelve el control.
        [HttpPost]
        [Route("Importar")]
        public IHttpActionResult Importar([FromBody] ImportarDto d)
        {
            if (d == null || d.ClienteID <= 0) return Content(HttpStatusCode.BadRequest, new { error = "Seleccioná el cliente." });
            if (string.IsNullOrWhiteSpace(d.ArchivoBase64) || d.Filas == null)
                return Content(HttpStatusCode.BadRequest, new { error = "Elegí el Excel de la plataforma." });

            byte[] archivo;
            try { archivo = Convert.FromBase64String(d.ArchivoBase64); }
            catch (FormatException) { return Content(HttpStatusCode.BadRequest, new { error = "El archivo no es válido." }); }
            if (archivo.Length == 0 || archivo.Length > MaxBytesArchivo)
                return Content(HttpStatusCode.BadRequest, new { error = "El archivo tiene que pesar como máximo 5 MB." });

            var usuario = string.IsNullOrWhiteSpace(d.Usuario) ? "sistema" : d.Usuario.Trim();
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var cli = LeerCliente(db, d.ClienteID);
                    if (cli == null) return Content(HttpStatusCode.BadRequest, new { error = "El cliente no existe." });
                    if (cli.Tipo_Cliente != ClientesController.TipoConPlataforma)
                        return Content(HttpStatusCode.BadRequest, new { error = "El cliente no trabaja con una plataforma: armá la proforma con \"Traer viajes\"." });
                    if (!cli.Plataforma_ID.HasValue)
                        return Content(HttpStatusCode.BadRequest, new { error = "El cliente no tiene una plataforma asignada." });
                    var lector = LectoresPlataforma.Obtener(cli.Codigo);
                    if (lector == null)
                        return Content(HttpStatusCode.BadRequest, new { error = "Todavía no se pueden leer archivos de " + cli.Nombre + "." });

                    var numero = (d.NumeroPlataforma ?? "").Trim();
                    if (numero == "") numero = lector.NumeroDesdeNombreArchivo(d.NombreArchivo) ?? "";
                    if (numero == "") return Content(HttpStatusCode.BadRequest, new { error = "Completá el N° de proforma en " + cli.Nombre + "." });
                    if (numero.Length > 30) return Content(HttpStatusCode.BadRequest, new { error = "El N° de proforma en " + cli.Nombre + " es demasiado largo." });

                    var lectura = lector.Leer(d.Filas);
                    if (lectura.Errores.Count > 0) return Content(HttpStatusCode.BadRequest, new { errores = lectura.Errores });

                    var existente = db.Database.SqlQuery<CabeceraRow>(@"
SELECT TOP (1) Proforma_ID, Estado, Numero, Tipo_Proforma, ClienteID, CAST(NULL AS nvarchar(60)) AS Plataforma,
       CAST(NULL AS varchar(20)) AS Codigo, Plataforma_Numero, FechaDesde, FechaHasta, Plataforma_Reclamo_Fecha,
       Plataforma_Reclamo_Motivo, CAST(NULL AS nvarchar(260)) AS Nombre_Archivo, CAST(NULL AS datetime) AS Fecha_Archivo
FROM dbo.PROFORMAS
WHERE Tipo_Proforma='Plataforma' AND ClienteID=@cli AND PlataformaID=@pl AND Plataforma_Numero=@num AND Estado<>'Anulada';",
                        P("@cli", d.ClienteID), P("@pl", cli.Plataforma_ID.Value), P("@num", numero)).FirstOrDefault();
                    // Ya cargada: la pantalla ofrece abrirla (en borrador, para reemplazar el Excel desde ahí).
                    if (existente != null)
                        return Content(HttpStatusCode.Conflict, new
                        {
                            error = "La proforma " + numero + " de " + cli.Nombre + " ya está cargada"
                                + (existente.Estado == "Borrador" ? " como borrador. Abrila para controlarla o reemplazar el Excel."
                                    : " (" + existente.Estado + (string.IsNullOrEmpty(existente.Numero) ? "" : ", " + existente.Numero) + ")."),
                            existente = new { existente.Proforma_ID, existente.Estado, existente.Numero }
                        });

                    // Los datos del cliente salen de su ficha, no de lo que manda la pantalla (§25 de PENDIENTES, 22/10).
                    var datosCliente = DatosClienteProforma.Leer(db, d.ClienteID) ?? new DatosClienteProforma.Datos();
                    using (var tx = db.Database.BeginTransaction())
                    {
                        int id = db.Database.SqlQuery<int>(@"
INSERT INTO dbo.PROFORMAS
 (ClienteID,Moneda,FechaEmision,FechaVencimiento,Cli_RazonSocial,Cli_NombreComercial,Cli_CUIT,Cli_CondIVA,Cli_Direccion,
  Cli_Ciudad,Cli_Provincia,Cli_CP,Cli_Telefono,Cli_Email,Cli_Contacto,FormaPago,PlazoPago,Validez,Observaciones,
  Subtotal,Descuentos,SubtotalNeto,IVA,OtrosImpuestos,TotalGeneral,ImporteTotal,
  CantidadViajes,FechaDesde,FechaHasta,Estado,FechaCreacion,Usu_Alta,Fecha_Alta,Tipo_Proforma,PlataformaID,Plataforma_Numero)
OUTPUT INSERTED.Proforma_ID
VALUES
 (@cli,@moneda,@femision,@fvto,@razon,@nombre,@cuit,@condiva,@dir,
  @ciudad,@prov,@cp,@tel,@email,@contacto,@formapago,@plazopago,@validez,@observaciones,
  0,0,0,0,0,0,0,
  '0',CAST(GETDATE() AS date),CAST(GETDATE() AS date),'Borrador',GETDATE(),@u,GETDATE(),'Plataforma',@pl,@num);",
                            P("@cli", d.ClienteID), P("@moneda", string.IsNullOrWhiteSpace(d.Moneda) ? "ARS" : d.Moneda),
                            P("@femision", d.FechaEmision), P("@fvto", d.FechaVencimiento),
                            P("@razon", datosCliente.RazonSocial), P("@nombre", datosCliente.NombreComercial), P("@cuit", datosCliente.CUIT),
                            P("@condiva", datosCliente.CondIVA), P("@dir", datosCliente.Direccion), P("@ciudad", datosCliente.Ciudad),
                            P("@prov", datosCliente.Provincia), P("@cp", datosCliente.CP), P("@tel", datosCliente.Telefono),
                            P("@email", datosCliente.Email), P("@contacto", null),
                            P("@formapago", d.FormaPago), P("@plazopago", d.PlazoPago), P("@validez", d.Validez), P("@observaciones", d.Observaciones),
                            P("@u", usuario), P("@pl", cli.Plataforma_ID.Value), P("@num", numero)).First();

                        GuardarLineasYArchivo(db, id, lectura, archivo, d.NombreArchivo, d.ContentType, usuario);
                        var nombre = d.NombreArchivo;
                        Controlar(db, id, d.ClienteID, cli.Nombre, lector, usuario);
                        Auditar(db, usuario, "INSERT", id, null,
                            "Alta de proforma de " + cli.Nombre + " " + numero + " (Borrador) importando " + nombre + ", " + lectura.Lineas.Count + " líneas"
                            + DescribirErroresArchivo(lectura));
                        tx.Commit();
                        return Ok(ArmarControl(db, id));
                    }
                }
            }
            catch (InvalidOperationException ex)
            {
                return Content(HttpStatusCode.BadRequest, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo importar la proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // "Volver a controlar": recalcula el borrador contra los viajes actuales (después de corregir algo en SGTL).
        [HttpPost]
        [Route("{id:int}/Controlar")]
        public IHttpActionResult VolverAControlar(int id, [FromBody] UsuarioPlataformaDto body)
        {
            var usuario = body == null || string.IsNullOrWhiteSpace(body.Usuario) ? "sistema" : body.Usuario.Trim();
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var c = LeerCabecera(db, id);
                    if (c == null) return NotFound();
                    if (c.Tipo_Proforma != "Plataforma") return Content(HttpStatusCode.BadRequest, new { error = "No es una proforma de plataforma." });
                    if (c.Estado != "Borrador") return Content(HttpStatusCode.BadRequest, new { error = "Solo se vuelve a controlar un borrador." });
                    var lector = LectoresPlataforma.Obtener(c.Codigo);
                    if (lector == null || !c.ClienteID.HasValue)
                        return Content(HttpStatusCode.BadRequest, new { error = "Todavía no se pueden leer archivos de " + c.Plataforma + "." });

                    using (var tx = db.Database.BeginTransaction())
                    {
                        Controlar(db, id, c.ClienteID.Value, c.Plataforma, lector, usuario);
                        tx.Commit();
                    }
                    return Ok(ArmarControl(db, id));
                }
            }
            catch (InvalidOperationException ex)
            {
                return Content(HttpStatusCode.BadRequest, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo volver a controlar la proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // "Reemplazar Excel": la plataforma corrigió la misma proforma; se reemplazan líneas y archivo,
        // se vuelve a controlar y se cierra el reclamo pendiente.
        [HttpPost]
        [Route("{id:int}/ReemplazarArchivo")]
        public IHttpActionResult ReemplazarArchivo(int id, [FromBody] ImportarDto d)
        {
            if (d == null || string.IsNullOrWhiteSpace(d.ArchivoBase64) || d.Filas == null)
                return Content(HttpStatusCode.BadRequest, new { error = "Elegí el Excel corregido." });
            string errorArchivo;
            var archivo = LeerBase64(d.ArchivoBase64, out errorArchivo);
            if (archivo == null) return Content(HttpStatusCode.BadRequest, new { error = errorArchivo });
            var usuario = string.IsNullOrWhiteSpace(d.Usuario) ? "sistema" : d.Usuario.Trim();
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var c = LeerCabecera(db, id);
                    if (c == null) return NotFound();
                    if (c.Tipo_Proforma != "Plataforma" || c.Estado != "Borrador" || !c.ClienteID.HasValue)
                        return Content(HttpStatusCode.BadRequest, new { error = "Solo se reemplaza el Excel de un borrador de plataforma." });
                    var lector = LectoresPlataforma.Obtener(c.Codigo);
                    if (lector == null) return Content(HttpStatusCode.BadRequest, new { error = "Todavía no se pueden leer archivos de " + c.Plataforma + "." });

                    var numero = (d.NumeroPlataforma ?? "").Trim();
                    if (numero == "") numero = lector.NumeroDesdeNombreArchivo(d.NombreArchivo) ?? "";
                    if (numero != "" && numero != c.Plataforma_Numero)
                        return Content(HttpStatusCode.BadRequest, new
                        {
                            error = "El archivo es de la proforma " + numero + " y este borrador es la " + c.Plataforma_Numero +
                                ". Si " + c.Plataforma + " generó otra proforma, eliminá este borrador e importá la nueva."
                        });

                    var lectura = lector.Leer(d.Filas);
                    if (lectura.Errores.Count > 0) return Content(HttpStatusCode.BadRequest, new { errores = lectura.Errores });

                    using (var tx = db.Database.BeginTransaction())
                    {
                        GuardarLineasYArchivo(db, id, lectura, archivo, d.NombreArchivo, d.ContentType, usuario);
                        bool teniaReclamo = c.Plataforma_Reclamo_Fecha.HasValue;
                        db.Database.ExecuteSqlCommand(
                            "UPDATE dbo.PROFORMAS SET Plataforma_Reclamo_Fecha=NULL, Plataforma_Reclamo_Motivo=NULL WHERE Proforma_ID=@id", P("@id", id));
                        Controlar(db, id, c.ClienteID.Value, c.Plataforma, lector, usuario);
                        Auditar(db, usuario, "UPDATE", id, "Archivo=" + c.Nombre_Archivo,
                            "Archivo reemplazado por " + d.NombreArchivo + ", " + lectura.Lineas.Count + " líneas" + DescribirErroresArchivo(lectura)
                            + (teniaReclamo ? "; reclamo cerrado" : ""));
                        tx.Commit();
                    }
                    return Ok(ArmarControl(db, id));
                }
            }
            catch (InvalidOperationException ex)
            {
                return Content(HttpStatusCode.BadRequest, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo reemplazar el archivo.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // "Guardar borrador" de un borrador ya importado: guarda las condiciones comerciales y las observaciones.
        // Mismo criterio que
        // ProformasController.Editar: solo en Borrador y con la misma auditoría.
        [HttpPut]
        [Route("{id:int}/Condiciones")]
        public IHttpActionResult GuardarCondiciones(int id, [FromBody] CondicionesDto d)
        {
            if (d == null) return Content(HttpStatusCode.BadRequest, new { error = "Datos inválidos." });
            var usuario = string.IsNullOrWhiteSpace(d.Usuario) ? "sistema" : d.Usuario.Trim();
            Func<string, string> limpio = v => string.IsNullOrWhiteSpace(v) ? null : v.Trim();
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var c = LeerCabecera(db, id);
                    if (c == null) return NotFound();
                    if (c.Tipo_Proforma != "Plataforma")
                        return Content(HttpStatusCode.BadRequest, new { error = "No es una proforma de plataforma." });
                    if (c.Estado != "Borrador")
                        return Content(HttpStatusCode.BadRequest, new { error = "Solo se pueden editar proformas en estado Borrador." });
                    db.Database.ExecuteSqlCommand(@"
UPDATE dbo.PROFORMAS
SET FormaPago=@formapago, PlazoPago=@plazopago, Validez=@validez, Observaciones=@observaciones,
    Usu_Modi=@u, Fecha_Modi=GETDATE()
WHERE Proforma_ID=@id AND Estado='Borrador';",
                        P("@formapago", limpio(d.FormaPago)), P("@plazopago", limpio(d.PlazoPago)), P("@validez", limpio(d.Validez)),
                        P("@observaciones", limpio(d.Observaciones)),
                        P("@u", usuario), P("@id", id));
                    Auditar(db, usuario, "UPDATE", id, null, "Edicion de proforma (Borrador): condiciones comerciales");
                    return Ok(new { Message = "Borrador guardado." });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo guardar el borrador.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // "Registrar reclamo": marca en el borrador que se espera una corrección de la plataforma (no es un estado)
        // y qué líneas se reclaman: esas pasan a "Esperando a" la plataforma en el control y en el listado.
        [HttpPost]
        [Route("{id:int}/Reclamo")]
        public IHttpActionResult RegistrarReclamo(int id, [FromBody] ReclamoDto d)
        {
            var motivo = d == null ? "" : (d.Motivo ?? "").Trim();
            if (motivo == "") return Content(HttpStatusCode.BadRequest, new { error = "Completá el motivo del reclamo." });
            if (motivo.Length > 500) return Content(HttpStatusCode.BadRequest, new { error = "El motivo puede tener hasta 500 caracteres." });
            var usuario = string.IsNullOrWhiteSpace(d.Usuario) ? "sistema" : d.Usuario.Trim();
            var fecha = (d.Fecha ?? DateTime.Today).Date;
            var ordenes = (d.Lineas ?? new List<int>()).Where(o => o > 0).Distinct().ToList();
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var c = LeerCabecera(db, id);
                    if (c == null) return NotFound();
                    if (c.Tipo_Proforma != "Plataforma" || c.Estado != "Borrador")
                        return Content(HttpStatusCode.BadRequest, new { error = "Solo se registra un reclamo en un borrador de plataforma." });
                    using (var tx = db.Database.BeginTransaction())
                    {
                        db.Database.ExecuteSqlCommand(
                            "UPDATE dbo.PROFORMAS SET Plataforma_Reclamo_Fecha=@f, Plataforma_Reclamo_Motivo=@m, Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Proforma_ID=@id",
                            P("@f", fecha), P("@m", motivo), P("@u", usuario), P("@id", id));
                        db.Database.ExecuteSqlCommand("UPDATE dbo.PROFORMA_PLATAFORMA_LINEA SET Reclamada=0 WHERE Proforma_ID=@id", P("@id", id));
                        var reclamadas = new List<string>();
                        if (ordenes.Count > 0)
                        {
                            // Solo diferencias: una línea que coincide no se reclama. Los Orden son enteros (vienen del modelo).
                            string enLista = string.Join(",", ordenes);
                            db.Database.ExecuteSqlCommand(
                                "UPDATE dbo.PROFORMA_PLATAFORMA_LINEA SET Reclamada=1 WHERE Proforma_ID=@id AND ISNULL(Resultado,'') <> 'Coincide' AND Orden IN (" + enLista + ")",
                                P("@id", id));
                            reclamadas = db.Database.SqlQuery<string>(
                                "SELECT Referencia FROM dbo.PROFORMA_PLATAFORMA_LINEA WHERE Proforma_ID=@id AND Reclamada=1 ORDER BY Orden",
                                P("@id", id)).ToList();
                        }
                        Auditar(db, usuario, "RECLAMO", id, null, "Reclamo en " + c.Plataforma + " (" + fecha.ToString("dd/MM/yyyy") + "): " + motivo
                            + (reclamadas.Count > 0 ? " | Transportes: " + string.Join(", ", reclamadas) : ""));
                        tx.Commit();
                    }
                    return Ok(ArmarControl(db, id));
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo registrar el reclamo.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // "Cerrar reclamo": se resolvió sin un archivo nuevo.
        [HttpPost]
        [Route("{id:int}/Reclamo/Cerrar")]
        public IHttpActionResult CerrarReclamo(int id, [FromBody] UsuarioPlataformaDto body)
        {
            var usuario = body == null || string.IsNullOrWhiteSpace(body.Usuario) ? "sistema" : body.Usuario.Trim();
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var c = LeerCabecera(db, id);
                    if (c == null) return NotFound();
                    if (!c.Plataforma_Reclamo_Fecha.HasValue) return Ok(ArmarControl(db, id));
                    db.Database.ExecuteSqlCommand(
                        "UPDATE dbo.PROFORMAS SET Plataforma_Reclamo_Fecha=NULL, Plataforma_Reclamo_Motivo=NULL, Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Proforma_ID=@id; " +
                        "UPDATE dbo.PROFORMA_PLATAFORMA_LINEA SET Reclamada=0 WHERE Proforma_ID=@id;",
                        P("@u", usuario), P("@id", id));
                    Auditar(db, usuario, "RECLAMO", id, "Reclamo: " + c.Plataforma_Reclamo_Motivo, "Reclamo cerrado");
                    return Ok(ArmarControl(db, id));
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo cerrar el reclamo.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // "Generar": solo con el control en OK. Asigna el número PF, arma los conceptos (una línea por transporte,
        // código V{Viaje_ID}, IVA 21 %) y deja la proforma Aceptada (la plataforma ya la aceptó). Los viajes que
        // seguían en Registrado pasan a Listo para facturar. Después se factura con el flujo de siempre.
        [HttpPost]
        [Route("{id:int}/Generar")]
        public IHttpActionResult Generar(int id, [FromBody] UsuarioPlataformaDto body)
        {
            var usuario = body == null || string.IsNullOrWhiteSpace(body.Usuario) ? "sistema" : body.Usuario.Trim();
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var c = LeerCabecera(db, id);
                    if (c == null) return NotFound();
                    if (c.Tipo_Proforma != "Plataforma" || c.Estado != "Borrador" || !c.ClienteID.HasValue)
                        return Content(HttpStatusCode.BadRequest, new { error = "Solo se genera un borrador de plataforma." });
                    var lector = LectoresPlataforma.Obtener(c.Codigo);
                    if (lector == null) return Content(HttpStatusCode.BadRequest, new { error = "Todavía no se pueden leer archivos de " + c.Plataforma + "." });

                    using (var tx = db.Database.BeginTransaction())
                    {
                        // Se vuelve a controlar: un viaje pudo cambiar desde la última vez.
                        Controlar(db, id, c.ClienteID.Value, c.Plataforma, lector, usuario);
                        var control = ArmarControl(db, id);
                        if (control.Cantidad == 0 || control.Diferencias > 0)
                        {
                            tx.Commit();
                            return Content(HttpStatusCode.Conflict, new
                            {
                                error = "No se puede generar: hay " + control.Diferencias + (control.Diferencias == 1 ? " diferencia." : " diferencias."),
                                control
                            });
                        }

                        db.Database.ExecuteSqlCommand("DELETE FROM dbo.PROFORMA_DETALLE WHERE Proforma_ID=@id", P("@id", id));
                        foreach (var l in control.Lineas.OrderBy(x => x.Orden))
                        {
                            decimal precio = l.ImporteViaje + l.Adicionales;
                            db.Database.ExecuteSqlCommand(@"
INSERT dbo.PROFORMA_DETALLE (Proforma_ID,Orden,Codigo,Concepto,Descripcion,Cantidad,Unidad,PrecioUnitario,DescuentoPct,IvaPct,Subtotal)
VALUES (@id,@orden,@codigo,@concepto,@desc,1,'Viaje',@precio,0,@iva,@precio);",
                                P("@id", id), P("@orden", l.Orden), P("@codigo", "V" + l.ViajeID),
                                P("@concepto", "Transporte " + l.Referencia + (string.IsNullOrEmpty(l.Ruta) ? "" : " · " + l.Ruta)),
                                P("@desc", (l.Fecha.HasValue ? l.Fecha.Value.ToString("dd/MM/yyyy") + " - " : "") + c.Plataforma + " " + c.Plataforma_Numero
                                    + (l.Adicionales > 0 ? " (incluye adicionales " + Pesos(l.Adicionales) + ")" : "")),
                                P("@precio", precio), P("@iva", IvaPct));
                        }

                        // Al generar, la copia de los datos del cliente queda fija con su ficha de este momento.
                        DatosClienteProforma.ActualizarProforma(db, id);
                        int n = db.Database.SqlQuery<int>("SELECT NEXT VALUE FOR dbo.SEQ_PROFORMA").First();
                        string numero = "PF-" + n.ToString("D8");
                        db.Database.ExecuteSqlCommand(@"
UPDATE dbo.PROFORMAS
SET Numero=@num, Estado='Aceptada', FechaEmision=ISNULL(FechaEmision,GETDATE()),
    Plataforma_Reclamo_Fecha=NULL, Plataforma_Reclamo_Motivo=NULL, Usu_Modi=@u, Fecha_Modi=GETDATE()
WHERE Proforma_ID=@id AND Estado='Borrador';
UPDATE dbo.PROFORMA_PLATAFORMA_LINEA SET Reclamada=0 WHERE Proforma_ID=@id;", P("@num", numero), P("@u", usuario), P("@id", id));

                        var viajes = control.Lineas.Where(x => x.ViajeID.HasValue).Select(x => x.ViajeID.Value).Distinct().ToList();
                        var pasan = db.Database.SqlQuery<int>(
                            "SELECT Viaje_ID FROM dbo.VIAJES WHERE Estado='Registrado' AND Viaje_ID IN (" + string.Join(",", viajes) + ")").ToList();
                        foreach (var v in pasan)
                        {
                            db.Database.ExecuteSqlCommand(
                                "UPDATE dbo.VIAJES SET Estado='Listo_para_facturar', Usu_Modi=@u, Fecha_Modi=GETDATE() WHERE Viaje_ID=@v AND Estado='Registrado'",
                                P("@u", UsuarioCorto(usuario)), P("@v", v));
                            db.Database.ExecuteSqlCommand(
                                "INSERT INTO AUDITORIA (Fecha,Usuario,Accion,Entidad,Clave,Valores_Anteriores,Valores_Nuevos,Origen) " +
                                "VALUES (GETDATE(),@u,'ESTADO','VIAJES',@k,'Estado=Registrado','Estado=Listo_para_facturar',@o)",
                                P("@u", usuario), P("@k", "Viaje_ID=" + v), P("@o", "Proforma de " + c.Plataforma + " " + c.Plataforma_Numero + " generada"));
                        }

                        Auditar(db, usuario, "GENERAR", id, "Estado=Borrador",
                            "Estado=Aceptada; Numero=" + numero + "; " + c.Plataforma + " " + c.Plataforma_Numero
                            + (pasan.Count > 0 ? "; viajes a Listo para facturar: " + string.Join(", ", pasan.Select(v => "#" + v)) : ""));
                        tx.Commit();
                        return Ok(new { Proforma_ID = id, Numero = numero, Estado = "Aceptada", Message = "Proforma generada: " + numero + "." });
                    }
                }
            }
            catch (InvalidOperationException ex)
            {
                return Content(HttpStatusCode.BadRequest, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo generar la proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // Plataforma del cliente, para que el modal de proforma sepa si pide el archivo y con qué nombre.
        [HttpGet]
        [Route("Cliente/{clienteId:int}")]
        public IHttpActionResult PlataformaDelCliente(int clienteId)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var cli = LeerCliente(db, clienteId);
                    if (cli == null) return NotFound();
                    bool conPlataforma = cli.Tipo_Cliente == ClientesController.TipoConPlataforma && cli.Plataforma_ID.HasValue;
                    return Ok(new
                    {
                        ConPlataforma = conPlataforma,
                        Plataforma = conPlataforma ? cli.Nombre : null,
                        Codigo = conPlataforma ? cli.Codigo : null,
                        PuedeLeer = conPlataforma && LectoresPlataforma.Obtener(cli.Codigo) != null
                    });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo consultar la plataforma del cliente.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // Guía antes de generar la proforma en la plataforma: viajes del cliente que todavía no están en ninguna proforma.
        [HttpGet]
        [Route("ViajesSinProforma")]
        public IHttpActionResult ViajesSinProformaDelCliente(int clienteId)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var cli = LeerCliente(db, clienteId);
                    if (cli == null) return NotFound();
                    if (cli.Tipo_Cliente != ClientesController.TipoConPlataforma || !cli.Plataforma_ID.HasValue)
                        return Content(HttpStatusCode.BadRequest, new { error = "El cliente no trabaja con una plataforma." });
                    var lector = LectoresPlataforma.Obtener(cli.Codigo);
                    if (lector == null)
                        return Content(HttpStatusCode.BadRequest, new { error = "Todavía no se pueden leer archivos de " + cli.Nombre + "." });
                    return Ok(new
                    {
                        Plataforma = cli.Nombre,
                        Dato = NombreNumero(lector.ColumnaReferenciaViaje),
                        Viajes = ViajesSinProforma(db, clienteId, lector)
                    });
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudieron consultar los viajes sin proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // Control guardado de una proforma de plataforma (para abrirla).
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult Obtener(int id)
        {
            try
            {
                using (var db = new DbContext(Cn()))
                {
                    var dto = ArmarControl(db, id);
                    if (dto == null) return NotFound();
                    return Ok(dto);
                }
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, new { error = "No se pudo abrir la proforma.", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }
    }
}
