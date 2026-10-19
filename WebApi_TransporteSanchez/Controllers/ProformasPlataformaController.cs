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
            public string TiempoServicio { get; set; }
            public string ObsComerciales { get; set; }
            public string CondParticulares { get; set; }
        }

        public class UsuarioDto { public string Usuario { get; set; } }

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
            public decimal TotalViajes { get; set; }
            public decimal TotalAdicionales { get; set; }
            public decimal TotalPlataforma { get; set; }
            public decimal TotalSgtl { get; set; }
            public bool PuedeGenerar { get; set; }
            public List<LineaControlDto> Lineas { get; set; }
            public List<string> Avisos { get; set; }
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
        }

        private class ViajeRow
        {
            public int Viaje_ID { get; set; }
            public string Referencia { get; set; }
            public string Num_Transporte { get; set; }
            public string Num_Remito { get; set; }
            public string Num_de_Carga { get; set; }
            public string Estado { get; set; }
            public int? TarifaFijaID { get; set; }
            public int? TarifaKmID { get; set; }
            public string Distancia_KM { get; set; }
            public DateTime Fecha_Inicio { get; set; }
            public string Origen { get; set; }
            public string Destino { get; set; }
        }

        private class TarifaRow { public int Id { get; set; } public decimal Valor { get; set; } }
        private class PresupuestoRow { public int ViajeID { get; set; } public int Presupuesto_ID { get; set; } public string Datos { get; set; } }

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

        // ======================= Control =======================

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
                "RTRIM(ISNULL(v.Num_de_Carga,'')) AS Num_de_Carga, v.Estado, v.TarifaFijaID, v.TarifaKmID, " +
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

            var fijas = db.Database.SqlQuery<TarifaRow>("SELECT TarifaFija_ID AS Id, ValorFijoNeto AS Valor FROM dbo.TARIFAS_FIJAS")
                .ToList().ToDictionary(t => t.Id, t => t.Valor);
            var kms = db.Database.SqlQuery<TarifaRow>("SELECT TarifaKm_ID AS Id, ValorKm AS Valor FROM dbo.TARIFAS_KM")
                .ToList().ToDictionary(t => t.Id, t => t.Valor);
            var presupuestos = db.Database.SqlQuery<PresupuestoRow>(
                "SELECT ViajeID, Presupuesto_ID, Datos FROM dbo.PRESUPUESTOS WHERE ViajeID IS NOT NULL AND Estado='Aceptado'")
                .ToList().ToDictionary(x => x.ViajeID);

            var reservar = new List<int>();
            foreach (var l in lineas)
            {
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
                        importeSgtl = ImporteSgtl(v, fijas, kms, presupuestos, out tarifa);
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
            decimal iva = decimal.Round(subtotal * IvaPct / 100m, 2, MidpointRounding.AwayFromZero);
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

        // Importe de SGTL para el viaje, con el mismo criterio que "Traer viajes" (ProformasController.PrellenarViajes):
        // presupuesto aceptado, si no tarifa fija, si no tarifa por km × km.
        private static decimal? ImporteSgtl(ViajeRow v, Dictionary<int, decimal> fijas, Dictionary<int, decimal> kms,
            Dictionary<int, PresupuestoRow> presupuestos, out string tarifa)
        {
            tarifa = null;
            PresupuestoRow pres;
            if (presupuestos.TryGetValue(v.Viaje_ID, out pres))
            {
                decimal importe;
                try
                {
                    var json = Newtonsoft.Json.Linq.JObject.Parse(pres.Datos);
                    if (decimal.TryParse((string)json["importe"], NumberStyles.Number, CultureInfo.InvariantCulture, out importe))
                    {
                        tarifa = "Presupuesto #" + pres.Presupuesto_ID + " · " + Pesos(importe);
                        return importe;
                    }
                }
                catch { }
                tarifa = "Presupuesto #" + pres.Presupuesto_ID + " sin importe válido";
                return null;
            }
            if (v.TarifaFijaID.HasValue && fijas.ContainsKey(v.TarifaFijaID.Value))
            {
                var valor = fijas[v.TarifaFijaID.Value];
                tarifa = "Tarifa fija #" + v.TarifaFijaID.Value + " · " + v.Origen + " → " + v.Destino + " · " + Pesos(valor);
                return valor;
            }
            if (v.TarifaKmID.HasValue && kms.ContainsKey(v.TarifaKmID.Value))
            {
                decimal km;
                decimal.TryParse((v.Distancia_KM ?? "").Trim().Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out km);
                var valorKm = kms[v.TarifaKmID.Value];
                tarifa = "Tarifa por km #" + v.TarifaKmID.Value + " · " + km.ToString("0.#", EsAr) + " km × " + Pesos(valorKm);
                return valorKm * km;
            }
            tarifa = "Sin tarifa";
            return null;
        }

        private static List<string> NumerosFaltantes(ViajeRow v, ILectorPlataforma lector)
        {
            var faltan = new List<string>();
            foreach (var col in lector.ColumnasNumerosObligatorios)
            {
                if (col == "Num_Transporte" && string.IsNullOrWhiteSpace(v.Num_Transporte)) faltan.Add("N° de transporte SAP");
                else if (col == "Num_Remito" && string.IsNullOrWhiteSpace(v.Num_Remito)) faltan.Add("remito");
                else if (col == "Num_de_Carga" && string.IsNullOrWhiteSpace(v.Num_de_Carga)) faltan.Add("N° de entrega");
            }
            return faltan;
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
                Coincide = f.Resultado == "Coincide"
            })
            // Las diferencias primero.
            .OrderBy(x => x.Coincide).ThenBy(x => x.Orden).ToList();

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
                TotalViajes = lineas.Sum(x => x.ImporteViaje),
                TotalAdicionales = lineas.Sum(x => x.Adicionales),
                TotalSgtl = lineas.Sum(x => x.ImporteSgtl.HasValue ? decimal.Round(x.ImporteSgtl.Value, 0, MidpointRounding.AwayFromZero) : 0m),
                Lineas = lineas,
                Avisos = new List<string>()
            };
            dto.TotalPlataforma = dto.TotalViajes + dto.TotalAdicionales;
            dto.PuedeGenerar = c.Estado == "Borrador" && dto.Cantidad > 0 && dto.Diferencias == 0;

            // Caso 7: viajes del cliente con el N° de transporte cargado que no están en ninguna proforma ni en este archivo.
            if (c.ClienteID.HasValue)
            {
                var sueltos = db.Database.SqlQuery<ViajeRow>(@"
SELECT v.Viaje_ID, RTRIM(ISNULL(v.Num_Transporte,'')) AS Referencia, RTRIM(ISNULL(v.Num_Transporte,'')) AS Num_Transporte,
       RTRIM(ISNULL(v.Num_Remito,'')) AS Num_Remito, RTRIM(ISNULL(v.Num_de_Carga,'')) AS Num_de_Carga, v.Estado,
       v.TarifaFijaID, v.TarifaKmID, RTRIM(ISNULL(v.Distancia_KM,'')) AS Distancia_KM, v.Fecha_Inicio,
       '' AS Origen, '' AS Destino
FROM dbo.VIAJES v
WHERE v.ClienteID=@cli AND v.Estado IN ('Registrado','Listo_para_facturar')
  AND RTRIM(ISNULL(v.Num_Transporte,'')) <> ''
  AND NOT EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv JOIN dbo.PROFORMAS p ON p.Proforma_ID = pv.ProformaID
                  WHERE pv.ViajeID = v.Viaje_ID AND p.Estado <> 'Anulada')
ORDER BY v.Fecha_Inicio;", P("@cli", c.ClienteID.Value)).ToList();
                if (sueltos.Count > 0)
                    dto.Avisos.Add((sueltos.Count == 1
                        ? "Hay 1 viaje de este cliente con el N° de transporte cargado que no está en ninguna proforma: "
                        : "Hay " + sueltos.Count + " viajes de este cliente con el N° de transporte cargado que no están en ninguna proforma: ")
                        + string.Join(", ", sueltos.Select(s => "#" + s.Viaje_ID + " (" + s.Fecha_Inicio.ToString("dd/MM") + ")"))
                        + ". Van en la próxima proforma de " + c.Plataforma + ".");
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
                    if (existente != null)
                        return Content(HttpStatusCode.Conflict, new
                        {
                            error = "La proforma " + numero + " de " + cli.Nombre + " ya está cargada (" + existente.Estado + ")."
                                + (existente.Estado == "Borrador" ? " Abrila y usá \"Reemplazar Excel\"." : "")
                        });

                    var condIva = cli.Cond_Fiscal == 1 ? "Responsable Inscripto" : cli.Cond_Fiscal == 2 ? "Monotributista" : cli.Cond_Fiscal == 3 ? "Exento" : null;
                    using (var tx = db.Database.BeginTransaction())
                    {
                        int id = db.Database.SqlQuery<int>(@"
INSERT INTO dbo.PROFORMAS
 (ClienteID,Moneda,FechaEmision,FechaVencimiento,Cli_RazonSocial,Cli_NombreComercial,Cli_CUIT,Cli_CondIVA,Cli_Direccion,
  Cli_Ciudad,Cli_Provincia,Cli_CP,Cli_Telefono,Cli_Email,Cli_Contacto,FormaPago,PlazoPago,Validez,TiempoServicio,
  ObsComerciales,CondParticulares,Subtotal,Descuentos,SubtotalNeto,IVA,OtrosImpuestos,TotalGeneral,ImporteTotal,
  CantidadViajes,FechaDesde,FechaHasta,Estado,FechaCreacion,Usu_Alta,Fecha_Alta,Tipo_Proforma,PlataformaID,Plataforma_Numero)
OUTPUT INSERTED.Proforma_ID
VALUES
 (@cli,@moneda,@femision,@fvto,@razon,@nombre,@cuit,@condiva,@dir,
  @ciudad,@prov,@cp,@tel,@email,@contacto,@formapago,@plazopago,@validez,@tiemposervicio,
  @obscom,@condpart,0,0,0,0,0,0,0,
  '0',CAST(GETDATE() AS date),CAST(GETDATE() AS date),'Borrador',GETDATE(),@u,GETDATE(),'Plataforma',@pl,@num);",
                            P("@cli", d.ClienteID), P("@moneda", string.IsNullOrWhiteSpace(d.Moneda) ? "ARS" : d.Moneda),
                            P("@femision", d.FechaEmision), P("@fvto", d.FechaVencimiento),
                            P("@razon", d.Cli_RazonSocial), P("@nombre", d.Cli_NombreComercial), P("@cuit", d.Cli_CUIT),
                            P("@condiva", condIva), P("@dir", d.Cli_Direccion), P("@ciudad", d.Cli_Ciudad), P("@prov", d.Cli_Provincia),
                            P("@cp", d.Cli_CP), P("@tel", d.Cli_Telefono), P("@email", d.Cli_Email), P("@contacto", d.Cli_Contacto),
                            P("@formapago", d.FormaPago), P("@plazopago", d.PlazoPago), P("@validez", d.Validez),
                            P("@tiemposervicio", d.TiempoServicio), P("@obscom", d.ObsComerciales), P("@condpart", d.CondParticulares),
                            P("@u", usuario), P("@pl", cli.Plataforma_ID.Value), P("@num", numero)).First();

                        foreach (var l in lectura.Lineas)
                            db.Database.ExecuteSqlCommand(@"
INSERT dbo.PROFORMA_PLATAFORMA_LINEA (Proforma_ID,Orden,Referencia,Fecha,Ruta,Importe_Viaje,Adicionales)
VALUES (@id,@orden,@ref,@fecha,@ruta,@imp,@adic);",
                                P("@id", id), P("@orden", l.Orden), P("@ref", l.Referencia), P("@fecha", l.Fecha),
                                P("@ruta", string.IsNullOrEmpty(l.Ruta) ? null : (l.Ruta.Length > 150 ? l.Ruta.Substring(0, 150) : l.Ruta)),
                                P("@imp", l.ImporteViaje), P("@adic", l.Adicionales));

                        var nombre = string.IsNullOrWhiteSpace(d.NombreArchivo) ? "proforma.xlsx" : d.NombreArchivo.Trim();
                        nombre = nombre.Substring(nombre.LastIndexOfAny(new[] { '/', '\\' }) + 1);
                        if (nombre.Length > 260) nombre = nombre.Substring(nombre.Length - 260);
                        db.Database.ExecuteSqlCommand(@"
INSERT dbo.PROFORMA_ADJUNTO (Proforma_ID,Tipo,Nombre_Archivo,Content_Type,Archivo,Usu_Alta)
VALUES (@id,'Archivo',@nombre,@tipo,@archivo,@u);",
                            P("@id", id), P("@nombre", nombre),
                            P("@tipo", string.IsNullOrWhiteSpace(d.ContentType) ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : d.ContentType),
                            P("@archivo", archivo), P("@u", UsuarioCorto(usuario)));

                        Controlar(db, id, d.ClienteID, cli.Nombre, lector, usuario);
                        Auditar(db, usuario, "INSERT", id, null,
                            "Alta de proforma de " + cli.Nombre + " " + numero + " (Borrador) importando " + nombre + ", " + lectura.Lineas.Count + " líneas");
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
        public IHttpActionResult VolverAControlar(int id, [FromBody] UsuarioDto body)
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
