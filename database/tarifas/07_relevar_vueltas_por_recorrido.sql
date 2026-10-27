/*
   Relevamiento (SOLO LECTURA, no cambia nada): qué viajes y presupuestos aceptados guardados tienen otra vuelta con la
   regla nueva del precio por orden del día (§43 de docs/PENDIENTES-SISTEMA.md, docs/diseno/vuelta-del-dia-diseno.md,
   caso B10). Hasta ahora la API calculaba la 2ª vuelta por camión ("el camión ya tiene otro viaje antes ese día"); desde
   la §43 es por cliente, origen y destino: el primero del día es 1ª y los demás, 2ª; un presupuesto aceptado (o el viaje
   que generó) conserva su lugar.

   Solo cuenta lo que tiene vuelta: tarifa fija hasta la primera banda (la vuelta guardada no está vacía).

   Muestra:
     1. Resumen: cuántos tendrían otra vuelta, por lo que pasaría con cada uno.
     2. El detalle, uno por fila, con el grupo (cliente, recorrido y día), la vuelta guardada y la que le corresponde.
   Qué pasaría con cada uno, como en la pantalla: "Se actualiza solo" (Registrado, no viene de un presupuesto),
   "Decide la persona" (ya salió, sin proforma generada ni comprobante), "Con su proforma" o "Con su comprobante", y
   "Presupuesto aceptado". Pasarle a Claude el resultado: Rocío decide qué hacer con cada uno antes de recompilar.

   Cómo correrlo: SSMS, base Transporte_Sanchez, tal cual.
*/
SET NOCOUNT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54670, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

WITH Integrantes AS (
    SELECT N'Viaje' AS Clase, 0 AS ClaseOrden, v.Viaje_ID AS Id, v.ClienteID, v.OrigenID, v.DestinoID,
           v.Fecha_Inicio AS Inicio, v.Vuelta, ISNULL(v.Estado, N'Registrado') AS Estado, v.Importe,
           CASE WHEN EXISTS (SELECT 1 FROM dbo.PRESUPUESTOS ps WHERE ps.ViajeID = v.Viaje_ID AND ps.Estado = N'Aceptado')
                THEN 1 ELSE 0 END AS Acordado,
           doc.Numero AS Proforma, doc.Estado AS Proforma_Estado
    FROM dbo.VIAJES v
    OUTER APPLY (SELECT TOP (1) ISNULL(NULLIF(p.Numero, N''), N'Borrador #' + CONVERT(nvarchar(11), p.Proforma_ID)) AS Numero, p.Estado
                 FROM dbo.PROFORMAS p
                 WHERE p.Estado <> N'Anulada'
                   AND EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = p.Proforma_ID AND pv.ViajeID = v.Viaje_ID)
                 ORDER BY CASE p.Estado WHEN N'Facturada' THEN 0 WHEN N'Aceptada' THEN 1 WHEN N'Generada' THEN 2 ELSE 3 END) doc
    WHERE v.TarifarioID IS NOT NULL AND ISNULL(v.Tarifa_Modo, N'Fija') = N'Fija' AND v.Vuelta IS NOT NULL
    UNION ALL
    SELECT N'Presupuesto', 1, ps.Presupuesto_ID,
           TRY_CAST(JSON_VALUE(ps.Datos, '$.clienteId') AS int), TRY_CAST(JSON_VALUE(ps.Datos, '$.origenId') AS int),
           TRY_CAST(JSON_VALUE(ps.Datos, '$.destinoId') AS int), TRY_CAST(JSON_VALUE(ps.Datos, '$.fechaInicio') AS datetime2),
           TRY_CAST(JSON_VALUE(ps.Datos, '$.vuelta') AS int), N'Aceptado', TRY_CAST(JSON_VALUE(ps.Datos, '$.importe') AS decimal(18, 2)),
           1, NULL, NULL
    FROM dbo.PRESUPUESTOS ps
    WHERE ps.Estado = N'Aceptado' AND ps.ViajeID IS NULL AND ISJSON(ps.Datos) = 1
      AND JSON_VALUE(ps.Datos, '$.tipoTarifa') = N'fija' AND TRY_CAST(JSON_VALUE(ps.Datos, '$.vuelta') AS int) IN (1, 2)
),
Grupos AS (
    SELECT i.*, CAST(i.Inicio AS date) AS Dia,
           MAX(CASE WHEN i.Acordado = 1 AND i.Vuelta = 1 THEN 1 ELSE 0 END)
               OVER (PARTITION BY i.ClienteID, i.OrigenID, i.DestinoID, CAST(i.Inicio AS date)) AS HayAcordadoPrimero,
           ROW_NUMBER() OVER (PARTITION BY i.ClienteID, i.OrigenID, i.DestinoID, CAST(i.Inicio AS date)
                              ORDER BY i.Inicio, i.ClaseOrden, i.Id) AS Orden,
           COUNT(*) OVER (PARTITION BY i.ClienteID, i.OrigenID, i.DestinoID, CAST(i.Inicio AS date)) AS EnElGrupo
    FROM Integrantes i
),
Esperada AS (
    SELECT g.*,
           CASE WHEN g.HayAcordadoPrimero = 1 THEN CASE WHEN g.Acordado = 1 AND g.Vuelta = 1 THEN 1 ELSE 2 END
                ELSE CASE WHEN g.Orden = 1 THEN 1 ELSE 2 END END AS Vuelta_Esperada
    FROM Grupos g
),
Distintos AS (
    SELECT e.*,
           CASE WHEN e.Clase = N'Presupuesto' OR e.Acordado = 1 THEN N'Presupuesto aceptado'
                WHEN e.Estado = N'Facturado' OR e.Proforma_Estado = N'Facturada' THEN N'Con su comprobante'
                WHEN e.Proforma_Estado IN (N'Generada', N'Aceptada') THEN N'Con su proforma'
                WHEN e.Estado = N'Registrado' THEN N'Se actualiza solo'
                ELSE N'Decide la persona' END AS Que_Pasaria
    FROM Esperada e
    WHERE e.Vuelta <> e.Vuelta_Esperada
)
SELECT N'1. Resumen' AS Parte, d.Que_Pasaria, COUNT(*) AS Cantidad
FROM Distintos d
GROUP BY d.Que_Pasaria
ORDER BY d.Que_Pasaria;

WITH Integrantes AS (
    SELECT N'Viaje' AS Clase, 0 AS ClaseOrden, v.Viaje_ID AS Id, v.ClienteID, v.OrigenID, v.DestinoID,
           v.Fecha_Inicio AS Inicio, v.Vuelta, ISNULL(v.Estado, N'Registrado') AS Estado, v.Importe,
           CASE WHEN EXISTS (SELECT 1 FROM dbo.PRESUPUESTOS ps WHERE ps.ViajeID = v.Viaje_ID AND ps.Estado = N'Aceptado')
                THEN 1 ELSE 0 END AS Acordado,
           doc.Numero AS Proforma, doc.Estado AS Proforma_Estado
    FROM dbo.VIAJES v
    OUTER APPLY (SELECT TOP (1) ISNULL(NULLIF(p.Numero, N''), N'Borrador #' + CONVERT(nvarchar(11), p.Proforma_ID)) AS Numero, p.Estado
                 FROM dbo.PROFORMAS p
                 WHERE p.Estado <> N'Anulada'
                   AND EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = p.Proforma_ID AND pv.ViajeID = v.Viaje_ID)
                 ORDER BY CASE p.Estado WHEN N'Facturada' THEN 0 WHEN N'Aceptada' THEN 1 WHEN N'Generada' THEN 2 ELSE 3 END) doc
    WHERE v.TarifarioID IS NOT NULL AND ISNULL(v.Tarifa_Modo, N'Fija') = N'Fija' AND v.Vuelta IS NOT NULL
    UNION ALL
    SELECT N'Presupuesto', 1, ps.Presupuesto_ID,
           TRY_CAST(JSON_VALUE(ps.Datos, '$.clienteId') AS int), TRY_CAST(JSON_VALUE(ps.Datos, '$.origenId') AS int),
           TRY_CAST(JSON_VALUE(ps.Datos, '$.destinoId') AS int), TRY_CAST(JSON_VALUE(ps.Datos, '$.fechaInicio') AS datetime2),
           TRY_CAST(JSON_VALUE(ps.Datos, '$.vuelta') AS int), N'Aceptado', TRY_CAST(JSON_VALUE(ps.Datos, '$.importe') AS decimal(18, 2)),
           1, NULL, NULL
    FROM dbo.PRESUPUESTOS ps
    WHERE ps.Estado = N'Aceptado' AND ps.ViajeID IS NULL AND ISJSON(ps.Datos) = 1
      AND JSON_VALUE(ps.Datos, '$.tipoTarifa') = N'fija' AND TRY_CAST(JSON_VALUE(ps.Datos, '$.vuelta') AS int) IN (1, 2)
),
Grupos AS (
    SELECT i.*, CAST(i.Inicio AS date) AS Dia,
           MAX(CASE WHEN i.Acordado = 1 AND i.Vuelta = 1 THEN 1 ELSE 0 END)
               OVER (PARTITION BY i.ClienteID, i.OrigenID, i.DestinoID, CAST(i.Inicio AS date)) AS HayAcordadoPrimero,
           ROW_NUMBER() OVER (PARTITION BY i.ClienteID, i.OrigenID, i.DestinoID, CAST(i.Inicio AS date)
                              ORDER BY i.Inicio, i.ClaseOrden, i.Id) AS Orden,
           COUNT(*) OVER (PARTITION BY i.ClienteID, i.OrigenID, i.DestinoID, CAST(i.Inicio AS date)) AS EnElGrupo
    FROM Integrantes i
)
SELECT N'2. Detalle' AS Parte, g.Clase, g.Id, ISNULL(cl.Razon_Social, N'') AS Cliente,
       ISNULL(o.Descripcion, N'') + N' → ' + ISNULL(d.Descripcion, N'') AS Recorrido,
       CONVERT(nvarchar(10), g.Dia, 103) AS Dia, CONVERT(nvarchar(5), g.Inicio, 108) AS Hora, g.EnElGrupo AS Viajes_En_El_Grupo,
       g.Estado, g.Proforma, g.Vuelta AS Vuelta_Guardada,
       CASE WHEN g.HayAcordadoPrimero = 1 THEN CASE WHEN g.Acordado = 1 AND g.Vuelta = 1 THEN 1 ELSE 2 END
            ELSE CASE WHEN g.Orden = 1 THEN 1 ELSE 2 END END AS Vuelta_Que_Corresponde,
       g.Importe AS Importe_Hoy,
       CASE WHEN g.Clase = N'Presupuesto' OR g.Acordado = 1 THEN N'Presupuesto aceptado'
            WHEN g.Estado = N'Facturado' OR g.Proforma_Estado = N'Facturada' THEN N'Con su comprobante'
            WHEN g.Proforma_Estado IN (N'Generada', N'Aceptada') THEN N'Con su proforma'
            WHEN g.Estado = N'Registrado' THEN N'Se actualiza solo'
            ELSE N'Decide la persona' END AS Que_Pasaria
FROM Grupos g
LEFT JOIN dbo.CLIENTES cl ON cl.Cliente_ID = g.ClienteID
LEFT JOIN dbo.ORIGEN o ON o.Origen_ID = g.OrigenID
LEFT JOIN dbo.DESTINO d ON d.Destino_ID = g.DestinoID
WHERE g.Vuelta <> CASE WHEN g.HayAcordadoPrimero = 1 THEN CASE WHEN g.Acordado = 1 AND g.Vuelta = 1 THEN 1 ELSE 2 END
                       ELSE CASE WHEN g.Orden = 1 THEN 1 ELSE 2 END END
ORDER BY g.Dia, Cliente, Recorrido, g.Inicio;
