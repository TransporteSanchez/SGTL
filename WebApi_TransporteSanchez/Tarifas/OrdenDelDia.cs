using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Globalization;
using System.Linq;

namespace WebApi_TransporteSanchez.Tarifas
{
    // Precio por orden del día (§43 de PENDIENTES; docs/diseno/vuelta-del-dia-diseno.md, decisión de Rocío del 26 y 27/10):
    // la tarifa fija hasta la primera banda tiene el precio del primer viaje del día (1ª vuelta) y otro, más barato, para
    // los siguientes (2ª vuelta). Se cuenta entre los viajes del mismo cliente, origen y destino el mismo día (el de la fecha
    // de inicio), sin importar el camión: "el grupo". Hay un solo primer viaje por grupo: el que empieza más temprano, salvo
    // que un presupuesto aceptado (o el viaje que generó) ya tenga ese lugar, que lo reserva.
    // Cuando un cambio le toca el lugar a otro integrante del grupo, su precio sigue una de tres vías:
    //   - se actualiza solo: un viaje en Registrado que no viene de un presupuesto;
    //   - decide la persona ("Actualizar el precio" o "Mantener el precio"): un viaje que ya salió sin proforma generada ni
    //     comprobante, el viaje de un presupuesto aceptado o un presupuesto aceptado;
    //   - se corrige con su documento: un viaje en una proforma generada o aceptada, o facturado.
    // Lo que no se actualiza solo queda en TARIFARIO_REVISAR (database/tarifas/06), como los cambios de tarifa. La pantalla
    // (api/Tarifario/Calcular) y el guardado (ViajesController, PresupuestosController) usan el mismo plan.
    public static class OrdenDelDia
    {
        public const string SeActualiza = "solo";
        public const string Decide = "decide";
        public const string ConDocumento = "documento";

        public const string Viaje = "Viaje";
        public const string Presupuesto = "Presupuesto";

        private static readonly CultureInfo EsAr = new CultureInfo("es-AR");

        // Un viaje o un presupuesto aceptado del grupo, como está guardado.
        public class Integrante
        {
            public string Clase { get; set; }              // Viaje o Presupuesto
            public int Id { get; set; }                    // 0: el viaje nuevo que se está cargando
            public DateTime Inicio { get; set; }
            public int? Vuelta { get; set; }               // la guardada (1 o 2)
            public string Estado { get; set; }
            public bool DePresupuesto { get; set; }        // viaje generado desde un presupuesto aceptado
            public int? Proforma_ID { get; set; }
            public string Proforma_Numero { get; set; }
            public string Proforma_Estado { get; set; }
            public string Tipo_Proforma { get; set; }
            public decimal? Precio_Linea { get; set; }     // el precio del viaje en su borrador propio
            public int? Comprobante_ID { get; set; }
            public string Comprobante_Numero { get; set; }
            public decimal? Importe { get; set; }
            public int ClienteID { get; set; }
            public int CamionID { get; set; }
            public string Km { get; set; }
            public bool Falso_Flete { get; set; }
            public int Estadia_Modulos { get; set; }
            public int? TarifarioID { get; set; }
            public string Datos { get; set; }              // JSON del presupuesto

            // Lo calcula el orden.
            public int VueltaNueva { get; set; }
            public bool Este { get; set; }                 // el que se está cargando, mirando o cambiando
        }

        // Lo que pasa con un integrante que cambia de lugar.
        public class Cambio
        {
            public Integrante Quien { get; set; }
            public string Via { get; set; }
            public int VueltaNueva { get; set; }
            public decimal? ImporteNuevo { get; set; }     // null si no se pudo calcular
            public bool Solo { get; set; }                 // queda como único del grupo
        }

        public class Plan
        {
            public bool Aplica { get; set; }               // el que se carga tiene primero y segundo viaje
            public int? Vuelta { get; set; }               // la de ese viaje o presupuesto
            public List<Integrante> Grupo { get; set; }    // el grupo nuevo, en orden, con el que se carga marcado
            public List<Cambio> Cambios { get; set; }      // los otros que cambian de lugar (también del grupo de antes)
            public string Causa { get; set; }              // "se registró el viaje #51"
            public List<Integrante> Evaluados { get; set; } // los de los dos grupos (el nuevo y el de donde sale)
            public DateTime Dia { get; set; }
        }

        // Dónde está y qué es lo que se carga o se cambia.
        public class Sujeto
        {
            public string Clase { get; set; }
            public int Id { get; set; }
            public int ClienteID { get; set; }
            public int OrigenID { get; set; }
            public int DestinoID { get; set; }
            public DateTime Inicio { get; set; }
            public string Estado { get; set; }
            public bool DePresupuesto { get; set; }
            public int? Vuelta { get; set; }               // la guardada (la de un presupuesto aceptado se respeta)
            public bool Aplica { get; set; }               // tarifa fija hasta la primera banda
            public decimal? Importe { get; set; }
        }

        // ------------------------------------------------------------------ El orden (sin base de datos)

        public static bool Reserva(Integrante i) { return i.Clase == Presupuesto || i.DePresupuesto; }

        public static bool YaSalio(string estado) { return !string.IsNullOrEmpty(estado) && estado != "Registrado"; }

        public static string Via(Integrante i)
        {
            if (i.Clase == Presupuesto) return Decide;
            if (i.Estado == "Facturado" || i.Proforma_Estado == "Facturada") return ConDocumento;
            if (i.Proforma_Estado == "Generada" || i.Proforma_Estado == "Aceptada") return ConDocumento;
            if (i.DePresupuesto || YaSalio(i.Estado)) return Decide;
            return SeActualiza;
        }

        // Un solo primer viaje: el que reservó un presupuesto aceptado o, si no hay, el que empieza más temprano (con la
        // misma hora, el viaje antes que el presupuesto y el registrado antes, el número más bajo; el nuevo, al final).
        public static void Ordenar(List<Integrante> grupo)
        {
            var reservados = grupo.Where(i => Reserva(i) && i.Vuelta == 1).ToList();
            if (reservados.Any())
            {
                foreach (var i in grupo) i.VueltaNueva = reservados.Contains(i) ? 1 : 2;
                return;
            }
            var primero = grupo.OrderBy(i => i.Inicio).ThenBy(i => i.Clase == Viaje ? 0 : 1)
                .ThenBy(i => i.Id == 0 ? int.MaxValue : i.Id).FirstOrDefault();
            foreach (var i in grupo) i.VueltaNueva = i == primero ? 1 : 2;
        }

        // Los que cambian de lugar, sin el que se está cargando (salvo que reserve: su precio no se toca solo).
        public static List<Cambio> Cambios(List<Integrante> grupo)
        {
            return grupo.Where(i => (!i.Este || Reserva(i)) && i.Vuelta.HasValue && i.Vuelta.Value != i.VueltaNueva)
                .Select(i => new Cambio { Quien = i, Via = Via(i), VueltaNueva = i.VueltaNueva, Solo = grupo.Count == 1 })
                .ToList();
        }

        public static List<Integrante> EnOrden(List<Integrante> grupo)
        {
            return grupo.OrderBy(i => i.VueltaNueva).ThenBy(i => i.Inicio).ThenBy(i => i.Id == 0 ? int.MaxValue : i.Id).ToList();
        }

        // ------------------------------------------------------------------ Textos (la pantalla y la API dicen lo mismo)

        public static string Pesos(decimal? v) { return v.HasValue ? TarifarioCalculo.Pesos(v.Value) : "—"; }
        public static string Hora(DateTime d) { return d.ToString("HH:mm", EsAr) + " hs"; }
        public static string Nombre(Integrante i) { return (i.Clase == Presupuesto ? "presupuesto #" : "viaje #") + i.Id; }
        private static string Lugar(int vuelta) { return vuelta == 1 ? "primer viaje del día" : "segundo viaje del día"; }
        private static string Mayuscula(string s) { return string.IsNullOrEmpty(s) ? s : char.ToUpper(s[0]) + s.Substring(1); }

        // Por qué no se cambia solo y qué hace falta (§5.1 del design system: "Como está…, es necesario que…").
        public static string PorQueNoSolo(Integrante i)
        {
            if (i.Clase == Presupuesto) return "Como está aceptado no se cambia solo, es necesario que revises ese presupuesto.";
            if (i.Estado == "Facturado" || i.Proforma_Estado == "Facturada")
                return "Como está facturado" + (string.IsNullOrEmpty(i.Comprobante_Numero) ? "" : " en " + i.Comprobante_Numero)
                    + " no se cambia solo, es necesario emitir una nota de crédito o de débito.";
            if (i.Proforma_Estado == "Generada" || i.Proforma_Estado == "Aceptada")
                return "Como está en la proforma " + (i.Proforma_Numero ?? "") + " no se cambia solo, es necesario que la anules y la generes de nuevo.";
            if (i.DePresupuesto) return "Como es de un presupuesto aceptado no se cambia solo, es necesario que revises ese viaje.";
            return "Como está " + EstadoEnTexto(i.Estado) + " no se cambia solo, es necesario que revises ese viaje.";
        }

        public static string EstadoEnTexto(string estado)
        {
            switch (estado)
            {
                case "En_viaje": return "en viaje";
                case "Entregado": return "entregado";
                case "Listo_para_facturar": return "listo para facturar";
                case "Facturado": return "facturado";
                default: return (estado ?? "").Replace('_', ' ').ToLowerInvariant();
            }
        }

        // Debajo de la tarifa: "Se cobra como segundo viaje del día: ya está el viaje #44 a las 07:00 hs."
        public static string Linea(Plan plan)
        {
            if (!plan.Aplica || !plan.Vuelta.HasValue) return "";
            if (plan.Vuelta.Value == 1) return "Se cobra como primer viaje del día.";
            var primero = plan.Grupo.FirstOrDefault(i => i.VueltaNueva == 1 && !i.Este);
            if (primero == null) return "Se cobra como segundo viaje del día.";
            if (primero.Clase == Presupuesto)
                return "Se cobra como segundo viaje del día: el presupuesto #" + primero.Id + " (aceptado) tiene el precio de primer viaje.";
            if (Reserva(primero))
                return "Se cobra como segundo viaje del día: el viaje #" + primero.Id + " (de un presupuesto aceptado) tiene el precio de primer viaje.";
            return "Se cobra como segundo viaje del día: ya está el viaje #" + primero.Id + " a las " + Hora(primero.Inicio) + ".";
        }

        // Antes de guardar, al lado del bloque: azul lo que se actualiza solo y amarillo lo que va a necesitar revisión.
        public static List<Aviso> Avisos(Plan plan)
        {
            var avisos = new List<Aviso>();
            var solos = plan.Cambios.Where(c => c.Via == SeActualiza).ToList();
            if (solos.Any())
                avisos.Add(new Aviso
                {
                    Tipo = "info",
                    Texto = "Al guardar, " + string.Join("; ", solos.Select(c => "el " + Nombre(c.Quien) + " pasa a ser el "
                        + (c.VueltaNueva == 1 ? "primero" : "segundo") + " del día y su precio se actualiza: "
                        + Pesos(c.Quien.Importe) + " → " + Pesos(c.ImporteNuevo))) + "."
                });
            foreach (var c in plan.Cambios.Where(c => c.Via != SeActualiza))
                avisos.Add(new Aviso
                {
                    Tipo = "warning",
                    Texto = "Al guardar, el " + Nombre(c.Quien) + " queda como " + (c.VueltaNueva == 1 ? "primero" : "segundo")
                        + " del día y le corresponde " + Pesos(c.ImporteNuevo) + ". " + PorQueNoSolo(c.Quien)
                });
            return avisos;
        }

        public class Aviso
        {
            public string Tipo { get; set; }               // info o warning
            public string Texto { get; set; }
        }

        // Qué pasa con los otros, para una confirmación: eliminar un viaje (después de "No se puede deshacer.") o aceptar,
        // rechazar, volver a Pendiente o eliminar un presupuesto aceptado.
        public static string QuePasa(Plan plan)
        {
            var partes = new List<string>();
            foreach (var c in plan.Cambios)
            {
                string porque = c.Solo ? ", porque ahora es el único del día" : "";
                if (c.Via == SeActualiza)
                    partes.Add("El " + Nombre(c.Quien) + " pasa a " + Lugar(c.VueltaNueva) + " y su precio se actualiza: "
                        + Pesos(c.Quien.Importe) + " → " + Pesos(c.ImporteNuevo) + ".");
                else
                    partes.Add("Al " + Nombre(c.Quien) + " le corresponde el precio de " + Lugar(c.VueltaNueva).Replace(" del día", "")
                        + " (" + Pesos(c.ImporteNuevo) + ")" + porque + ". " + PorQueNoSolo(c.Quien));
            }
            return string.Join(" ", partes);
        }

        // Auditoría del que se actualizó solo.
        public static string TextoAuditoria(Cambio c, string causa)
        {
            return "Pasa a " + Lugar(c.VueltaNueva) + ": " + Pesos(c.Quien.Importe) + " → " + Pesos(c.ImporteNuevo) + ", porque " + causa + ".";
        }

        public static string CausaEnMayuscula(string causa) { return Mayuscula(causa); }

        // ------------------------------------------------------------------ Base de datos

        private static SqlParameter P(string n, object v) { return new SqlParameter(n, v ?? DBNull.Value); }

        private const string SQL_VIAJES_SELECT = @"
SELECT N'Viaje' AS Clase, v.Viaje_ID AS Id, v.Fecha_Inicio AS Inicio, v.Vuelta, ISNULL(v.Estado, N'Registrado') AS Estado,
       CAST(CASE WHEN pr.Presupuesto_ID IS NULL THEN 0 ELSE 1 END AS bit) AS DePresupuesto,
       doc.Proforma_ID, doc.Numero AS Proforma_Numero, doc.Estado AS Proforma_Estado, doc.Tipo_Proforma, doc.Precio_Linea,
       fac.Comprobante_ID, fac.Numero AS Comprobante_Numero,
       v.Importe, ISNULL(v.ClienteID, 0) AS ClienteID, ISNULL(v.CamionID, 0) AS CamionID, RTRIM(ISNULL(v.Distancia_KM, '')) AS Km,
       ISNULL(v.Falso_Flete, 0) AS Falso_Flete, ISNULL(v.Estadia_Modulos, 0) AS Estadia_Modulos, v.TarifarioID,
       CAST(NULL AS nvarchar(max)) AS Datos
FROM dbo.VIAJES v
OUTER APPLY (SELECT TOP (1) ps.Presupuesto_ID FROM dbo.PRESUPUESTOS ps
             WHERE ps.ViajeID = v.Viaje_ID AND ps.Estado = 'Aceptado' ORDER BY ps.Presupuesto_ID DESC) pr
OUTER APPLY (SELECT TOP (1) p.Proforma_ID, NULLIF(ISNULL(p.Numero, ''), '') AS Numero, p.Estado,
                    ISNULL(p.Tipo_Proforma, 'Propia') AS Tipo_Proforma,
                    (SELECT TOP (1) d.PrecioUnitario FROM dbo.PROFORMA_DETALLE d WHERE d.Proforma_ID = p.Proforma_ID
                     AND UPPER(LTRIM(RTRIM(ISNULL(d.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID)) AS Precio_Linea
             FROM dbo.PROFORMAS p
             WHERE p.Estado <> 'Anulada' AND (
                   EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = p.Proforma_ID AND pv.ViajeID = v.Viaje_ID)
                OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE d WHERE d.Proforma_ID = p.Proforma_ID
                           AND UPPER(LTRIM(RTRIM(ISNULL(d.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID)))
             ORDER BY CASE p.Estado WHEN 'Facturada' THEN 0 WHEN 'Aceptada' THEN 1 WHEN 'Generada' THEN 2 ELSE 3 END) doc
OUTER APPLY (SELECT TOP (1) c.Comprobante_ID, c.Tipo + '-' + RIGHT('00000000' + CONVERT(varchar(11), c.NumeroCorrelativo), 8) AS Numero
             FROM dbo.COMPROBANTES c
             WHERE c.Tipo = 'FAC' AND (
                   EXISTS (SELECT 1 FROM dbo.COMPROBANTES_PROFORMAS cp WHERE cp.ComprobanteID = c.Comprobante_ID
                           AND cp.ProformaID = doc.Proforma_ID AND cp.Vigente = 1)
                OR EXISTS (SELECT 1 FROM dbo.COMPROBANTES_DETALLE cd WHERE cd.ComprobanteID = c.Comprobante_ID
                           AND UPPER(LTRIM(RTRIM(ISNULL(cd.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID)))
             ORDER BY c.Comprobante_ID DESC) fac ";

        private const string SQL_VIAJES = SQL_VIAJES_SELECT + @"
WHERE v.ClienteID = @c AND v.OrigenID = @o AND v.DestinoID = @d AND v.Fecha_Inicio >= @dia AND v.Fecha_Inicio < @dia1
  AND v.Viaje_ID <> @sinViaje AND v.TarifarioID IS NOT NULL AND ISNULL(v.Tarifa_Modo, 'Fija') = 'Fija' AND v.Vuelta IS NOT NULL";

        private const string SQL_PRESUPUESTOS = @"
SELECT N'Presupuesto' AS Clase, ps.Presupuesto_ID AS Id,
       ISNULL(TRY_CAST(JSON_VALUE(ps.Datos, '$.fechaInicio') AS datetime2), '19000101') AS Inicio,
       TRY_CAST(JSON_VALUE(ps.Datos, '$.vuelta') AS int) AS Vuelta, N'Aceptado' AS Estado, CAST(0 AS bit) AS DePresupuesto,
       CAST(NULL AS int) AS Proforma_ID, CAST(NULL AS nvarchar(30)) AS Proforma_Numero, CAST(NULL AS nvarchar(30)) AS Proforma_Estado,
       CAST(NULL AS int) AS Comprobante_ID, CAST(NULL AS nvarchar(30)) AS Comprobante_Numero,
       TRY_CAST(JSON_VALUE(ps.Datos, '$.importe') AS decimal(18, 2)) AS Importe, @c AS ClienteID,
       ISNULL(TRY_CAST(JSON_VALUE(ps.Datos, '$.camionId') AS int), 0) AS CamionID, ISNULL(JSON_VALUE(ps.Datos, '$.distancia'), '') AS Km,
       CAST(0 AS bit) AS Falso_Flete, 0 AS Estadia_Modulos, TRY_CAST(JSON_VALUE(ps.Datos, '$.tarifarioId') AS int) AS TarifarioID,
       ps.Datos
FROM dbo.PRESUPUESTOS ps
WHERE ps.Estado = 'Aceptado' AND ps.ViajeID IS NULL AND ISJSON(ps.Datos) = 1 AND ps.Presupuesto_ID <> @sinPresupuesto
  AND TRY_CAST(JSON_VALUE(ps.Datos, '$.clienteId') AS int) = @c AND TRY_CAST(JSON_VALUE(ps.Datos, '$.origenId') AS int) = @o
  AND TRY_CAST(JSON_VALUE(ps.Datos, '$.destinoId') AS int) = @d
  AND TRY_CAST(JSON_VALUE(ps.Datos, '$.fechaInicio') AS datetime2) >= @dia AND TRY_CAST(JSON_VALUE(ps.Datos, '$.fechaInicio') AS datetime2) < @dia1
  AND JSON_VALUE(ps.Datos, '$.tipoTarifa') = 'fija' AND TRY_CAST(JSON_VALUE(ps.Datos, '$.vuelta') AS int) IN (1, 2)";

        // El grupo como está guardado (sin el viaje o el presupuesto que se está cambiando).
        public static List<Integrante> Grupo(DbContext db, int clienteId, int origenId, int destinoId, DateTime dia,
            int sinViaje, int sinPresupuesto)
        {
            if (clienteId <= 0 || origenId <= 0 || destinoId <= 0) return new List<Integrante>();
            var ps = new Func<SqlParameter[]>(() => new[]
            {
                P("@c", clienteId), P("@o", origenId), P("@d", destinoId), P("@dia", dia.Date), P("@dia1", dia.Date.AddDays(1)),
                P("@sinViaje", sinViaje), P("@sinPresupuesto", sinPresupuesto)
            });
            var grupo = db.Database.SqlQuery<Integrante>(SQL_VIAJES, ps()).ToList();
            grupo.AddRange(db.Database.SqlQuery<Integrante>(SQL_PRESUPUESTOS, ps()).ToList());
            return grupo;
        }

        // El plan de un cambio: dónde queda lo que se carga (despues; null si se elimina o deja de tener vuelta) y de dónde
        // sale (antes; null si es nuevo o no tenía vuelta). Calcula el precio nuevo de los que cambian.
        public static Plan Planificar(DbContext db, Sujeto despues, Sujeto antes, string causa)
        {
            var plan = new Plan { Grupo = new List<Integrante>(), Cambios = new List<Cambio>(), Evaluados = new List<Integrante>(), Causa = causa };
            var sujeto = despues ?? antes;
            int sinViaje = sujeto != null && sujeto.Clase == Viaje ? sujeto.Id : 0;
            int sinPresupuesto = sujeto != null && sujeto.Clase == Presupuesto ? sujeto.Id : 0;

            if (despues != null && despues.Aplica)
            {
                var grupo = Grupo(db, despues.ClienteID, despues.OrigenID, despues.DestinoID, despues.Inicio, sinViaje, sinPresupuesto);
                var este = new Integrante
                {
                    Clase = despues.Clase, Id = despues.Id, Inicio = despues.Inicio, Vuelta = despues.Vuelta,
                    Estado = despues.Estado ?? "Registrado", DePresupuesto = despues.DePresupuesto, ClienteID = despues.ClienteID,
                    Importe = despues.Importe, Este = true
                };
                grupo.Add(este);
                Ordenar(grupo);
                plan.Aplica = true;
                plan.Vuelta = Reserva(este) && este.Vuelta.HasValue ? este.Vuelta : este.VueltaNueva;
                plan.Grupo = EnOrden(grupo);
                plan.Dia = despues.Inicio.Date;
                plan.Cambios.AddRange(Cambios(grupo));
                plan.Evaluados.AddRange(grupo.Where(i => !i.Este));
            }

            // El grupo de donde sale (se elimina, cambia de cliente, recorrido o día, o deja de tener vuelta).
            bool mismoGrupo = antes != null && despues != null && despues.Aplica && antes.ClienteID == despues.ClienteID
                && antes.OrigenID == despues.OrigenID && antes.DestinoID == despues.DestinoID && antes.Inicio.Date == despues.Inicio.Date;
            if (antes != null && antes.Aplica && !mismoGrupo)
            {
                var anterior = Grupo(db, antes.ClienteID, antes.OrigenID, antes.DestinoID, antes.Inicio, sinViaje, sinPresupuesto);
                Ordenar(anterior);
                plan.Cambios.AddRange(Cambios(anterior));
                plan.Evaluados.AddRange(anterior);
                if (despues == null) plan.Dia = antes.Inicio.Date;
            }

            foreach (var c in plan.Cambios)
            {
                var r = ImporteCon(db, c.Quien, c.VueltaNueva);
                c.ImporteNuevo = r != null && r.Ok ? r.Importe : (decimal?)null;
            }
            return plan;
        }

        private static decimal? Km(string km)
        {
            decimal x;
            return decimal.TryParse((km ?? "").Trim().Replace(',', '.'), NumberStyles.Number, CultureInfo.InvariantCulture, out x) ? x : (decimal?)null;
        }

        // El importe con otra vuelta, con la tabla vigente (sin el importe del presupuesto: ViajeId = 0).
        public static TarifarioCalculo.Resultado ImporteCon(DbContext db, Integrante i, int vuelta)
        {
            return TarifarioCalculo.Calcular(db, new TarifarioCalculo.Pedido
            {
                ViajeId = 0,
                ClienteID = i.ClienteID,
                UsaTarifario = true,
                PorKm = false,
                FechaInicio = i.Inicio,
                CamionID = i.CamionID,
                Km = Km(i.Km),
                Vuelta = vuelta,
                FalsoFlete = i.Falso_Flete,
                EstadiaModulos = i.Estadia_Modulos
            });
        }

        // El viaje como está guardado, para planificar un cambio (null si no existe).
        public static Sujeto SujetoDeViaje(DbContext db, int viajeId)
        {
            return db.Database.SqlQuery<Sujeto>(@"
SELECT N'Viaje' AS Clase, v.Viaje_ID AS Id, ISNULL(v.ClienteID, 0) AS ClienteID, ISNULL(v.OrigenID, 0) AS OrigenID,
       ISNULL(v.DestinoID, 0) AS DestinoID, v.Fecha_Inicio AS Inicio, ISNULL(v.Estado, N'Registrado') AS Estado,
       CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.PRESUPUESTOS ps WHERE ps.ViajeID = v.Viaje_ID AND ps.Estado = 'Aceptado') THEN 1 ELSE 0 END AS bit) AS DePresupuesto,
       v.Vuelta, v.Importe,
       CAST(CASE WHEN v.TarifarioID IS NOT NULL AND ISNULL(v.Tarifa_Modo, 'Fija') = 'Fija' AND v.Vuelta IS NOT NULL THEN 1 ELSE 0 END AS bit) AS Aplica
FROM dbo.VIAJES v WHERE v.Viaje_ID = @id", P("@id", viajeId)).FirstOrDefault();
        }

        // El presupuesto como está guardado (Aplica: tarifa fija con vuelta). null si no existe o no tiene los datos.
        public static Sujeto SujetoDePresupuesto(DbContext db, int presupuestoId)
        {
            return db.Database.SqlQuery<Sujeto>(@"
SELECT N'Presupuesto' AS Clase, ps.Presupuesto_ID AS Id, ISNULL(TRY_CAST(JSON_VALUE(ps.Datos, '$.clienteId') AS int), 0) AS ClienteID,
       ISNULL(TRY_CAST(JSON_VALUE(ps.Datos, '$.origenId') AS int), 0) AS OrigenID, ISNULL(TRY_CAST(JSON_VALUE(ps.Datos, '$.destinoId') AS int), 0) AS DestinoID,
       ISNULL(TRY_CAST(JSON_VALUE(ps.Datos, '$.fechaInicio') AS datetime2), '19000101') AS Inicio, ps.Estado, CAST(0 AS bit) AS DePresupuesto,
       TRY_CAST(JSON_VALUE(ps.Datos, '$.vuelta') AS int) AS Vuelta, TRY_CAST(JSON_VALUE(ps.Datos, '$.importe') AS decimal(18, 2)) AS Importe,
       CAST(CASE WHEN JSON_VALUE(ps.Datos, '$.tipoTarifa') = 'fija' AND TRY_CAST(JSON_VALUE(ps.Datos, '$.vuelta') AS int) IN (1, 2)
                  AND TRY_CAST(JSON_VALUE(ps.Datos, '$.fechaInicio') AS datetime2) IS NOT NULL THEN 1 ELSE 0 END AS bit) AS Aplica
FROM dbo.PRESUPUESTOS ps WHERE ps.Presupuesto_ID = @id AND ISJSON(ps.Datos) = 1", P("@id", presupuestoId)).FirstOrDefault();
        }

        // Ver detalle y Editar: el grupo del viaje como está guardado, con el viaje marcado y el orden real del día (si alguno
        // quedó con el precio para revisar, el bloque muestra dónde está ahora; el precio, el que tiene). Vacío si el viaje no
        // tiene vuelta o es el único del grupo.
        public static List<Integrante> GrupoGuardado(DbContext db, int viajeId)
        {
            var sujeto = SujetoDeViaje(db, viajeId);
            if (sujeto == null || !sujeto.Aplica) return new List<Integrante>();
            var grupo = Grupo(db, sujeto.ClienteID, sujeto.OrigenID, sujeto.DestinoID, sujeto.Inicio, 0, 0);
            if (grupo.Count < 2) return new List<Integrante>();
            foreach (var i in grupo) i.Este = i.Clase == Viaje && i.Id == viajeId;
            Ordenar(grupo);
            return EnOrden(grupo);
        }

        // Si el viaje (o el presupuesto) es el único de su cliente y recorrido ese día, como está guardado.
        public static bool EsUnico(DbContext db, int? viajeId, int? presupuestoId)
        {
            var s = viajeId.HasValue && viajeId.Value > 0 ? SujetoDeViaje(db, viajeId.Value)
                : presupuestoId.HasValue && presupuestoId.Value > 0 ? SujetoDePresupuesto(db, presupuestoId.Value) : null;
            if (s == null) return false;
            return Grupo(db, s.ClienteID, s.OrigenID, s.DestinoID, s.Inicio, s.Clase == Viaje ? s.Id : 0, s.Clase == Presupuesto ? s.Id : 0).Count == 0;
        }

        public class Pendiente
        {
            public int Revisar_ID { get; set; }
            public int Vuelta_Nueva { get; set; }
        }

        // Lo que tiene pendiente un viaje por el orden del día (decide la persona). null si nada.
        public static Pendiente PendienteDeViaje(DbContext db, int viajeId)
        {
            if (!HayRevisar(db)) return null;
            return db.Database.SqlQuery<Pendiente>(
                "SELECT TOP (1) r.Revisar_ID, r.Vuelta_Nueva FROM dbo.TARIFARIO_REVISAR r JOIN dbo.TARIFARIO_CAMBIOS c ON c.Cambio_ID = r.Cambio_ID " +
                "WHERE c.Tipo = N'Orden del día' AND r.Tipo = N'Viaje' AND r.Viaje_ID = @id AND r.Resuelto_Fecha IS NULL AND r.Vuelta_Nueva IS NOT NULL " +
                "ORDER BY r.Revisar_ID DESC", P("@id", viajeId)).FirstOrDefault();
        }

        // "Actualizar el precio" de un viaje que quedó para revisar por el orden del día: pasa a la vuelta que le corresponde,
        // con su línea del borrador propio si tiene el precio del viaje, y lo pendiente queda resuelto. Devuelve el texto del
        // aviso, o el error en "error".
        public static string ActualizarPrecio(DbContext db, int viajeId, string usuario, string cn, out string error)
        {
            error = null;
            var pendiente = PendienteDeViaje(db, viajeId);
            if (pendiente == null) { error = "No se puede actualizar el precio: el viaje no tiene un precio para revisar."; return null; }
            var i = db.Database.SqlQuery<Integrante>(SQL_VIAJES_SELECT + "WHERE v.Viaje_ID = @id", P("@id", viajeId)).FirstOrDefault();
            if (i == null) { error = "No se puede actualizar el precio: el viaje ya no existe."; return null; }
            if (Via(i) == ConDocumento) { error = "No se puede actualizar el precio: " + PorQueNoSolo(i).Replace("Como está", "el viaje está").Replace(" no se cambia solo,", ";"); return null; }
            var r = ImporteCon(db, i, pendiente.Vuelta_Nueva);
            if (!r.Ok) { error = "No se pudo calcular el precio nuevo: " + r.Mensaje; return null; }

            db.Database.ExecuteSqlCommand(
                "UPDATE dbo.VIAJES SET Vuelta=@vuelta, Importe_Base=@base, Tarifa_Detalle=@tdet, Importe=@imp, Importe_Detalle=@idet WHERE Viaje_ID=@id",
                P("@vuelta", pendiente.Vuelta_Nueva), P("@base", r.ImporteBase), P("@tdet", r.TarifaDetalle), P("@imp", r.Importe),
                P("@idet", r.ImporteDetalle), P("@id", viajeId));
            // En el borrador propio, la línea que tiene el precio del viaje (como al corregir una tabla de tarifas, §33).
            if (i.Proforma_Estado == "Borrador" && i.Tipo_Proforma != "Plataforma" && i.Proforma_ID.HasValue && i.Precio_Linea.HasValue
                && i.Importe.HasValue && i.Precio_Linea.Value == Math.Round(i.Importe.Value, 2))
            {
                db.Database.ExecuteSqlCommand(
                    "UPDATE dbo.PROFORMA_DETALLE SET PrecioUnitario=@precio, Subtotal=ROUND(ISNULL(Cantidad, 0) * @precio * (1 - ISNULL(DescuentoPct, 0) / 100), 2) " +
                    "WHERE Proforma_ID=@p AND UPPER(LTRIM(RTRIM(ISNULL(Codigo, '')))) = @codigo",
                    P("@precio", Math.Round(r.Importe, 2, MidpointRounding.AwayFromZero)), P("@p", i.Proforma_ID.Value), P("@codigo", "V" + viajeId));
                RecalcularTotales(db, i.Proforma_ID.Value);
            }
            DateTime ahora = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Argentina Standard Time");
            db.Database.ExecuteSqlCommand(
                "UPDATE dbo.TARIFARIO_REVISAR SET Resuelto_Fecha = @f, Resuelto_Usuario = @u, Resuelto_Como = @como WHERE Revisar_ID = @id",
                P("@f", ahora), P("@u", Recortar(usuario, 50)), P("@como", "Precio actualizado a " + Pesos(r.Importe) + "."), P("@id", pendiente.Revisar_ID));
            SGTLAuditContext.RegistrarEvento(cn, Recortar(usuario, 20), "UPDATE", "VIAJES", "Viaje_ID=" + viajeId,
                "Precio actualizado a " + Lugar(pendiente.Vuelta_Nueva) + ": " + Pesos(i.Importe) + " → " + Pesos(r.Importe) + ".");
            return "Precio del viaje #" + viajeId + " actualizado a " + Pesos(r.Importe) + ". Es necesario que le avises al cliente.";
        }

        // Los mismos totales que ProformasController.ComputarTotales (como TarifarioImpacto).
        private static void RecalcularTotales(DbContext db, int proformaId)
        {
            db.Database.ExecuteSqlCommand(@"
UPDATE p SET Subtotal = ROUND(x.Bruto, 2), Descuentos = ROUND(x.Descuento, 2), SubtotalNeto = ROUND(x.Bruto - x.Descuento, 2),
       IVA = ROUND(x.Iva, 2), TotalGeneral = ROUND(ROUND(x.Bruto - x.Descuento, 2) + ROUND(x.Iva, 2) + ISNULL(p.OtrosImpuestos, 0), 2)
FROM dbo.PROFORMAS p
CROSS APPLY (SELECT ISNULL(SUM(ISNULL(d.Cantidad, 0) * ISNULL(d.PrecioUnitario, 0)), 0) AS Bruto,
                    ISNULL(SUM(ISNULL(d.Cantidad, 0) * ISNULL(d.PrecioUnitario, 0) * ISNULL(d.DescuentoPct, 0) / 100), 0) AS Descuento,
                    ISNULL(SUM(ISNULL(d.Cantidad, 0) * ISNULL(d.PrecioUnitario, 0) * (1 - ISNULL(d.DescuentoPct, 0) / 100) * ISNULL(d.IvaPct, 0) / 100), 0) AS Iva
             FROM dbo.PROFORMA_DETALLE d WHERE d.Proforma_ID = p.Proforma_ID) x
WHERE p.Proforma_ID = @p AND p.Estado = 'Borrador'", P("@p", proformaId));
        }

        // "Volver a Pendiente" un presupuesto que quedó para revisar por el orden del día: se recalcula con la vuelta que le
        // corresponde, lo pendiente queda resuelto y queda para reenviar (como con un cambio de tarifa: se resuelve al
        // enviarlo por e-mail). Devuelve el importe nuevo, o null si no tenía nada pendiente o no se pudo calcular.
        public static decimal? PresupuestoAPendiente(DbContext db, int presupuestoId, string usuario)
        {
            if (!HayRevisar(db)) return null;
            var pendiente = db.Database.SqlQuery<Pendiente>(
                "SELECT TOP (1) r.Revisar_ID, r.Vuelta_Nueva FROM dbo.TARIFARIO_REVISAR r JOIN dbo.TARIFARIO_CAMBIOS c ON c.Cambio_ID = r.Cambio_ID " +
                "WHERE c.Tipo = N'Orden del día' AND r.Tipo = N'Presupuesto' AND r.Presupuesto_ID = @id AND r.Resuelto_Fecha IS NULL " +
                "AND r.Vuelta_Nueva IS NOT NULL ORDER BY r.Revisar_ID DESC", P("@id", presupuestoId)).FirstOrDefault();
            if (pendiente == null) return null;
            var datos = db.Database.SqlQuery<string>("SELECT Datos FROM dbo.PRESUPUESTOS WHERE Presupuesto_ID = @id", P("@id", presupuestoId)).FirstOrDefault();
            var sujeto = SujetoDePresupuesto(db, presupuestoId);
            if (datos == null || sujeto == null) return null;
            var json = Json(datos);
            var i = new Integrante
            {
                Clase = Presupuesto, Id = presupuestoId, Inicio = sujeto.Inicio, ClienteID = sujeto.ClienteID,
                CamionID = (int?)json["camionId"] ?? 0, Km = (string)json["distancia"]
            };
            var r = ImporteCon(db, i, pendiente.Vuelta_Nueva);
            if (!r.Ok) return null;
            json["importe"] = r.ImporteBase.ToString("0.00", CultureInfo.InvariantCulture);
            json["vuelta"] = pendiente.Vuelta_Nueva;
            json["tarifaDetalle"] = r.TarifaDetalle;
            db.Database.ExecuteSqlCommand("UPDATE dbo.PRESUPUESTOS SET Datos=@d WHERE Presupuesto_ID=@id",
                P("@d", json.ToString(Newtonsoft.Json.Formatting.None)), P("@id", presupuestoId));
            DateTime ahora = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Argentina Standard Time");
            string u50 = Recortar(usuario, 50);
            db.Database.ExecuteSqlCommand(
                "UPDATE dbo.TARIFARIO_REVISAR SET Resuelto_Fecha = @f, Resuelto_Usuario = @u, Resuelto_Como = @como WHERE Revisar_ID = @id",
                P("@f", ahora), P("@u", u50), P("@como", "Vuelto a Pendiente con el precio de " + Lugar(pendiente.Vuelta_Nueva) + ": " + Pesos(r.ImporteBase) + "."),
                P("@id", pendiente.Revisar_ID));
            // Queda para reenviar (Vuelta_Nueva vacía: lo de siempre de un presupuesto).
            int cambioId = db.Database.SqlQuery<int>("SELECT Cambio_ID FROM dbo.TARIFARIO_REVISAR WHERE Revisar_ID = @id", P("@id", pendiente.Revisar_ID)).First();
            db.Database.ExecuteSqlCommand(
                "INSERT INTO dbo.TARIFARIO_REVISAR (Cambio_ID, Tipo, Presupuesto_ID, ClienteID, Documento, Importe_Anterior, Importe_Nuevo) " +
                "VALUES (@c, N'Presupuesto', @id, @cli, @doc, @ant, @nue)",
                P("@c", cambioId), P("@id", presupuestoId), P("@cli", sujeto.ClienteID), P("@doc", "Presupuesto #" + presupuestoId),
                P("@ant", sujeto.Importe), P("@nue", r.ImporteBase));
            return r.ImporteBase;
        }

        private static Newtonsoft.Json.Linq.JObject Json(string datos)
        {
            using (var lector = new Newtonsoft.Json.JsonTextReader(new System.IO.StringReader(datos ?? "")) { DateParseHandling = Newtonsoft.Json.DateParseHandling.None })
                return Newtonsoft.Json.Linq.JObject.Load(lector);
        }

        // ------------------------------------------------------------------ Aplicar (después de guardar)

        private static bool HayRevisar(DbContext db)
        {
            return db.Database.SqlQuery<int>("SELECT CASE WHEN COL_LENGTH(N'dbo.TARIFARIO_REVISAR', N'Vuelta_Nueva') IS NULL THEN 0 ELSE 1 END").First() == 1;
        }

        public class Aplicado
        {
            public List<Cambio> Actualizados { get; set; }
            public List<Cambio> ParaRevisar { get; set; }
        }

        // Lo que se actualiza solo se guarda (con Auditoría); lo demás queda para revisar. Lo que tenía algo pendiente por el
        // orden del día y ahora coincide con su lugar se resuelve solo.
        public static Aplicado Aplicar(DbContext db, Plan plan, string usuario, string cn)
        {
            var hecho = new Aplicado { Actualizados = new List<Cambio>(), ParaRevisar = new List<Cambio>() };
            bool hayRevisar = HayRevisar(db);
            int cambioId = 0;
            DateTime ahora = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "Argentina Standard Time");
            string u20 = Recortar(usuario, 20), u50 = Recortar(usuario, 50);

            foreach (var c in plan.Cambios.Where(x => x.ImporteNuevo.HasValue))
            {
                var i = c.Quien;
                if (hayRevisar) ResolverPendiente(db, i, ahora, u50, "Reemplazado por un cambio posterior del orden del día.");
                if (c.Via == SeActualiza && i.Clase == Viaje)
                {
                    var r = ImporteCon(db, i, c.VueltaNueva);
                    if (!r.Ok) continue;
                    db.Database.ExecuteSqlCommand(
                        "UPDATE dbo.VIAJES SET Vuelta=@vuelta, Importe_Base=@base, Tarifa_Detalle=@tdet, Importe=@imp, Importe_Detalle=@idet WHERE Viaje_ID=@id",
                        P("@vuelta", c.VueltaNueva), P("@base", r.ImporteBase), P("@tdet", r.TarifaDetalle), P("@imp", r.Importe),
                        P("@idet", r.ImporteDetalle), P("@id", i.Id));
                    SGTLAuditContext.RegistrarEvento(cn, u20, "UPDATE", "VIAJES", "Viaje_ID=" + i.Id, TextoAuditoria(c, plan.Causa));
                    hecho.Actualizados.Add(c);
                    continue;
                }
                if (!hayRevisar) continue;
                if (cambioId == 0) cambioId = RegistrarCambio(db, plan, i.TarifarioID ?? 0, ahora, u50);
                string tipo = i.Clase == Presupuesto ? "Presupuesto"
                    : c.Via == ConDocumento ? (i.Estado == "Facturado" || i.Proforma_Estado == "Facturada" ? "Comprobante" : "Proforma")
                    : "Viaje";
                string documento = tipo == "Presupuesto" ? "Presupuesto #" + i.Id
                    : tipo == "Comprobante" ? (i.Comprobante_Numero ?? "Viaje #" + i.Id)
                    : tipo == "Proforma" ? (i.Proforma_Numero ?? "Viaje #" + i.Id)
                    : "Viaje #" + i.Id;
                db.Database.ExecuteSqlCommand(
                    "INSERT INTO dbo.TARIFARIO_REVISAR (Cambio_ID, Tipo, Presupuesto_ID, Viaje_ID, Proforma_ID, Comprobante_ID, ClienteID, Documento, " +
                    "Importe_Anterior, Importe_Nuevo, Vuelta_Nueva) VALUES (@c, @tipo, @pres, @viaje, @pf, @comp, @cli, @doc, @ant, @nue, @vuelta)",
                    P("@c", cambioId), P("@tipo", tipo), P("@pres", i.Clase == Presupuesto ? i.Id : (int?)null),
                    P("@viaje", i.Clase == Viaje ? i.Id : (int?)null), P("@pf", tipo == "Proforma" ? i.Proforma_ID : null),
                    P("@comp", tipo == "Comprobante" ? i.Comprobante_ID : null), P("@cli", i.ClienteID), P("@doc", documento),
                    P("@ant", i.Importe), P("@nue", c.ImporteNuevo), P("@vuelta", c.VueltaNueva));
                hecho.ParaRevisar.Add(c);
            }

            // Lo que quedó en su lugar de antes: lo pendiente por el orden del día se resuelve solo.
            if (hayRevisar)
                foreach (var i in plan.Evaluados.Where(x => x.Vuelta.HasValue && x.Vuelta.Value == x.VueltaNueva))
                    ResolverPendiente(db, i, ahora, u50, "Se resolvió solo: el orden del día volvió a ser el de antes.");
            return hecho;
        }

        private static int RegistrarCambio(DbContext db, Plan plan, int tarifarioId, DateTime ahora, string usuario)
        {
            string tabla = db.Database.SqlQuery<string>("SELECT Nombre FROM dbo.TARIFARIOS WHERE Tarifario_ID=@t", P("@t", tarifarioId)).FirstOrDefault() ?? "";
            string motivo = CausaEnMayuscula(plan.Causa) + (plan.Dia > DateTime.MinValue ? " (" + plan.Dia.ToString("dd/MM/yyyy") + ")" : "");
            return db.Database.SqlQuery<int>(
                "INSERT INTO dbo.TARIFARIO_CAMBIOS (Tarifario_ID, Tabla, Tipo, Motivo, Fecha, Usuario, Viajes_Recalculados, Presupuestos_Recalculados) " +
                "OUTPUT INSERTED.Cambio_ID VALUES (@t, @tabla, N'Orden del día', @motivo, @f, @u, @viajes, 0)",
                P("@t", tarifarioId), P("@tabla", tabla), P("@motivo", Recortar(motivo, 500)), P("@f", ahora), P("@u", usuario),
                P("@viajes", plan.Cambios.Count(x => x.Via == SeActualiza))).First();
        }

        private static void ResolverPendiente(DbContext db, Integrante i, DateTime ahora, string usuario, string como)
        {
            db.Database.ExecuteSqlCommand(
                "UPDATE r SET Resuelto_Fecha = @f, Resuelto_Usuario = @u, Resuelto_Como = @como FROM dbo.TARIFARIO_REVISAR r " +
                "JOIN dbo.TARIFARIO_CAMBIOS c ON c.Cambio_ID = r.Cambio_ID WHERE c.Tipo = N'Orden del día' AND r.Resuelto_Fecha IS NULL " +
                "AND r.Vuelta_Nueva IS NOT NULL AND " + (i.Clase == Presupuesto ? "r.Presupuesto_ID = @id" : "r.Viaje_ID = @id"),
                P("@f", ahora), P("@u", usuario), P("@como", como), P("@id", i.Id));
        }

        private static string Recortar(string s, int max)
        {
            s = string.IsNullOrWhiteSpace(s) ? "sistema" : s.Trim();
            return s.Length > max ? s.Substring(0, max) : s;
        }
    }
}
