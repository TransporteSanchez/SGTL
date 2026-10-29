/*
   Estados y fechas de la demo del jueves 29/10 (29/10/2026, Rocío): SOLO LECTURA, no cambia nada.

   Completa a 05_relevar_viajes_para_la_demo.sql. La 05 junta lo que está abierto o mal cargado en viajes; esta mira que lo
   que ve el profe se cuente como una historia: que cada estado tenga su caso (§64, punto 3, de docs/PENDIENTES-SISTEMA.md)
   y que las fechas vayan en orden (viaje → entrega → proforma → comprobante → recibo). Qué hacer con cada resultado y qué
   casos tiene que haber: docs/equipo/INSTRUCTIVO-DATOS-DEMO.md.

   Devuelve siete tablas; la primera columna dice cuál es y la última, qué hacer:
     1. Cuántos hay de cada estado (viajes por tipo de cliente, presupuestos, proformas y comprobantes) y cuántos tendría
        que haber para la demo.
     2. Viajes con estado y fechas que no cierran (entrega futura o antes del inicio, cancelado sin motivo, facturado sin
        comprobante, en una proforma facturada sin estar facturado, en viaje que todavía no empieza…).
     3. Presupuestos que no cierran con su viaje (aceptado con viaje y sin él, viaje anterior al presupuesto…).
     4. Proformas con fechas o viajes que no cierran (emitida antes de la entrega de un viaje, sin viajes, facturada sin
        comprobante…).
     5. Comprobantes con fechas que no cierran (emitido antes de su proforma o del comprobante que imputa, vencimiento
        antes de la emisión, emisión futura) o con textos de prueba.
     6. Cuenta corriente por cliente: saldo, deuda vencida y si sirve para mostrar un cliente al día, uno con deuda y uno
        con deuda vencida.
     7. Numeración contra fechas: que un número más alto no tenga una fecha anterior, y desde qué fecha se puede emitir
        lo próximo de cada serie sin desordenarla.
   Los nombres de los clientes salen para revisarlos: el resultado no se guarda en el repo.

   Cómo correrlo: SSMS, base Transporte_Sanchez, tal cual. Correrlo después de la limpieza de la 05 y otra vez al terminar
   de cargar los casos que falten: las tablas 2 a 5 tienen que quedar vacías y la 7, solo con el último número de cada serie.
*/
SET NOCOUNT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54970, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;
IF COL_LENGTH(N'dbo.VIAJES', N'Cancelado_Motivo') IS NULL OR COL_LENGTH(N'dbo.VIAJES', N'Sin_Carga_Observacion') IS NULL
   OR COL_LENGTH(N'dbo.PROFORMAS', N'Tipo_Proforma') IS NULL OR OBJECT_ID(N'dbo.CUENTA_CORRIENTE_APLICACIONES', N'U') IS NULL
    THROW 54971, 'Faltan scripts: correr database/verificacion/01_scripts_corridos.sql y los que digan "Falta correrlo".', 1;

-- Hoy en Argentina (la base está en UTC; las fechas de los viajes y los comprobantes, en hora de Argentina).
DECLARE @Hoy date = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS date);

-- La proforma vigente de cada viaje (la misma búsqueda que la API: ViajesController.OUTER_APPLY_PROFORMA).
DROP TABLE IF EXISTS #ProformaDelViaje;
SELECT v.Viaje_ID, pf.Proforma_ID, pf.Numero, pf.Estado, pf.Fecha
INTO #ProformaDelViaje
FROM dbo.VIAJES v
CROSS APPLY (SELECT TOP (1) p.Proforma_ID, p.Numero, p.Estado, CAST(ISNULL(p.FechaEmision, p.FechaCreacion) AS date) AS Fecha
             FROM dbo.PROFORMAS p
             WHERE p.Estado <> 'Anulada' AND (
                   EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = p.Proforma_ID AND pv.ViajeID = v.Viaje_ID)
                OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd WHERE pd.Proforma_ID = p.Proforma_ID
                           AND UPPER(LTRIM(RTRIM(ISNULL(pd.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID)))
             ORDER BY p.Proforma_ID DESC) pf;

-- El comprobante vigente de cada proforma (el que la factura; se pierde al anularlo con el crédito).
DROP TABLE IF EXISTS #ComprobanteDeLaProforma;
SELECT cp.ProformaID, c.Comprobante_ID, c.Tipo, c.Letra, c.Sucursal, c.NumeroComprobante, c.FechaEmision
INTO #ComprobanteDeLaProforma
FROM dbo.COMPROBANTES_PROFORMAS cp
JOIN dbo.COMPROBANTES c ON c.Comprobante_ID = cp.ComprobanteID
WHERE cp.Vigente = 1 AND c.Estado = 'EMITIDO';

-- Saldo de cada comprobante emitido: lo que le falta imputar (deudas) o lo que le queda libre (créditos y recibos).
DROP TABLE IF EXISTS #Saldos;
SELECT c.Comprobante_ID, c.ClienteID, c.Impacto, c.FechaEmision, c.FechaVencimiento, c.Total,
       c.Total - ISNULL(CASE WHEN c.Impacto = 'D' THEN ad.Aplicado ELSE ac.Aplicado END, 0) AS Saldo
INTO #Saldos
FROM dbo.COMPROBANTES c
OUTER APPLY (SELECT SUM(a.Importe) AS Aplicado FROM dbo.CUENTA_CORRIENTE_APLICACIONES a
             WHERE a.Vigente = 1 AND a.ComprobanteDeudaID = c.Comprobante_ID) ad
OUTER APPLY (SELECT SUM(a.Importe) AS Aplicado FROM dbo.CUENTA_CORRIENTE_APLICACIONES a
             WHERE a.Vigente = 1 AND a.ComprobanteCreditoID = c.Comprobante_ID) ac
WHERE c.Estado = 'EMITIDO';

-- 1. Cuántos hay de cada estado. "Para_la_demo" es lo mínimo que pide docs/equipo/INSTRUCTIVO-DATOS-DEMO.md (sección 2);
-- "Que_hacer" dice cuántos faltan. Un estado que no está en la base aparece igual, con 0.
WITH Hay AS (
    SELECT N'Viaje directo' AS Entidad, ISNULL(v.Estado, N'Registrado') AS Estado, COUNT(*) AS N
    FROM dbo.VIAJES v LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
    WHERE ISNULL(c.Tipo_Cliente, N'Directo') <> N'Con_plataforma' GROUP BY ISNULL(v.Estado, N'Registrado')
    UNION ALL
    SELECT N'Viaje con plataforma', ISNULL(v.Estado, N'Registrado'), COUNT(*)
    FROM dbo.VIAJES v JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
    WHERE c.Tipo_Cliente = N'Con_plataforma' GROUP BY ISNULL(v.Estado, N'Registrado')
    UNION ALL
    SELECT N'Presupuesto', Estado + CASE WHEN Estado = 'Aceptado' AND ViajeID IS NULL THEN N' sin viaje'
                                         WHEN Estado = 'Aceptado' THEN N' con viaje' ELSE N'' END, COUNT(*)
    FROM dbo.PRESUPUESTOS GROUP BY Estado + CASE WHEN Estado = 'Aceptado' AND ViajeID IS NULL THEN N' sin viaje'
                                                 WHEN Estado = 'Aceptado' THEN N' con viaje' ELSE N'' END
    UNION ALL
    SELECT N'Proforma ' + LOWER(Tipo_Proforma), Estado, COUNT(*) FROM dbo.PROFORMAS GROUP BY Tipo_Proforma, Estado
    UNION ALL
    SELECT N'Comprobante ' + Tipo, Estado, COUNT(*) FROM dbo.COMPROBANTES WHERE Estado <> 'BORRADOR' GROUP BY Tipo, Estado
),
Demo AS (
    SELECT * FROM (VALUES
        (N'Viaje directo', N'Registrado', 3), (N'Viaje directo', N'En_viaje', 1), (N'Viaje directo', N'Entregado', 4),
        (N'Viaje directo', N'Facturado', 3), (N'Viaje directo', N'Sin_carga', 1), (N'Viaje directo', N'Cancelado', 1),
        (N'Viaje con plataforma', N'Registrado', 1), (N'Viaje con plataforma', N'Listo_para_facturar', 2),
        (N'Presupuesto', N'Pendiente', 1), (N'Presupuesto', N'Aceptado sin viaje', 1),
        (N'Presupuesto', N'Aceptado con viaje', 1), (N'Presupuesto', N'Rechazado', 1),
        (N'Proforma propia', N'Borrador', 1), (N'Proforma propia', N'Generada', 1), (N'Proforma propia', N'Aceptada', 1),
        (N'Proforma propia', N'Facturada', 3)
    ) d (Entidad, Estado, Minimo)
)
SELECT N'1. Estados' AS Que, ISNULL(h.Entidad, d.Entidad) AS Entidad, ISNULL(h.Estado, d.Estado) AS Estado,
       ISNULL(h.N, 0) AS Hay, d.Minimo AS Para_la_demo,
       CASE WHEN d.Minimo IS NULL THEN N''
            WHEN ISNULL(h.N, 0) >= d.Minimo THEN N'Alcanza'
            ELSE N'Faltan ' + CONVERT(nvarchar(11), d.Minimo - ISNULL(h.N, 0)) + N': ver la sección 2 del instructivo' END AS Que_hacer
FROM Hay h
FULL JOIN Demo d ON d.Entidad = h.Entidad AND d.Estado = h.Estado
ORDER BY ISNULL(h.Entidad, d.Entidad), ISNULL(h.Estado, d.Estado);

-- 2. Viajes con estado y fechas que no cierran. Uno puede tener más de un motivo: van juntos.
SELECT N'2. Viajes que no cierran' AS Que, v.Viaje_ID, ISNULL(c.Razon_Social, N'') AS Cliente,
       CASE WHEN c.Tipo_Cliente = N'Con_plataforma' THEN N'Con plataforma' ELSE N'Directo' END AS Tipo,
       ISNULL(v.Estado, N'Registrado') AS Estado, v.Fecha_Inicio, v.Fecha_Fin, v.Fecha_Entrega,
       pf.Numero AS Proforma, pf.Estado AS Estado_proforma, m.Motivos AS Que_hacer
FROM dbo.VIAJES v
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
LEFT JOIN #ProformaDelViaje pf ON pf.Viaje_ID = v.Viaje_ID
LEFT JOIN #ComprobanteDeLaProforma cp ON cp.ProformaID = pf.Proforma_ID
CROSS APPLY (SELECT NULLIF(CONCAT(
    CASE WHEN v.Fecha_Fin < v.Fecha_Inicio THEN N'Termina antes de empezar: corregir las fechas en Editar viaje. ' END,
    CASE WHEN v.Estado IN (N'Entregado', N'Facturado', N'Sin_carga') AND v.Fecha_Entrega IS NULL
         THEN N'Sin fecha de entrega: volverlo un paso atrás y adelante otra vez con la fecha. ' END,
    CASE WHEN CAST(v.Fecha_Entrega AS date) > @Hoy THEN N'Entrega futura: corregir la fecha en Cambiar estado. ' END,
    CASE WHEN CAST(v.Fecha_Entrega AS date) < CAST(v.Fecha_Inicio AS date) THEN N'Entrega antes del inicio: corregir la fecha. ' END,
    CASE WHEN v.Estado = N'En_viaje' AND CAST(v.Fecha_Inicio AS date) > @Hoy
         THEN N'En viaje y todavía no empieza: volverlo a Registrado. ' END,
    CASE WHEN v.Estado = N'Cancelado' AND LTRIM(RTRIM(ISNULL(v.Cancelado_Motivo, N''))) = N''
         THEN N'Cancelado sin motivo: reactivarlo y cancelarlo con un motivo real ("No se realizó."). ' END,
    CASE WHEN v.Estado = N'Sin_carga' AND c.Tipo_Cliente = N'Con_plataforma'
         THEN N'Sin carga en un cliente con plataforma (solo va en los directos): consultarlo con Claude. ' END,
    CASE WHEN v.Estado = N'Facturado' AND cp.Comprobante_ID IS NULL
         THEN N'Facturado sin comprobante vigente: consultarlo con Claude antes de tocarlo. ' END,
    CASE WHEN pf.Estado = N'Facturada' AND ISNULL(v.Estado, N'Registrado') <> N'Facturado'
         THEN N'Está en una proforma facturada y no figura facturado: consultarlo con Claude. ' END,
    CASE WHEN pf.Proforma_ID IS NOT NULL AND ISNULL(v.Estado, N'Registrado') IN (N'Registrado', N'En_viaje', N'Cancelado', N'Sin_carga')
              AND pf.Estado <> N'Borrador'
         THEN N'En una proforma ' + LOWER(pf.Estado) + N' sin estar entregado: consultarlo con Claude. ' END,
    CASE WHEN pf.Fecha IS NOT NULL AND pf.Estado <> N'Borrador' AND v.Fecha_Entrega IS NOT NULL AND pf.Fecha < CAST(v.Fecha_Entrega AS date)
         THEN N'La proforma es anterior a la entrega: corregir la fecha de la entrega o la de la proforma. ' END,
    CASE WHEN v.Estado = N'Facturado' AND cp.FechaEmision < CAST(ISNULL(v.Fecha_Entrega, v.Fecha_Fin) AS date)
         THEN N'Comprobante anterior a la entrega: consultarlo con Claude. ' END
    ), N'') AS Motivos) m
WHERE m.Motivos IS NOT NULL
ORDER BY v.Fecha_Inicio, v.Viaje_ID;

-- 3. Presupuestos que no cierran con su viaje.
SELECT N'3. Presupuestos que no cierran' AS Que, p.Presupuesto_ID, p.Estado, p.FechaAlta, p.ViajeID,
       ISNULL(v.Estado, CASE WHEN v.Viaje_ID IS NULL THEN NULL ELSE N'Registrado' END) AS Estado_viaje, v.Fecha_Inicio AS Inicio_viaje,
       m.Motivos AS Que_hacer
FROM dbo.PRESUPUESTOS p
LEFT JOIN dbo.VIAJES v ON v.Viaje_ID = p.ViajeID
CROSS APPLY (SELECT NULLIF(CONCAT(
    CASE WHEN p.ViajeID IS NOT NULL AND p.Estado <> 'Aceptado'
         THEN N'Tiene viaje y no está aceptado: consultarlo con Claude. ' END,
    CASE WHEN v.Viaje_ID IS NOT NULL AND CAST(v.Fecha_Inicio AS date) < CAST(p.FechaAlta AS date)
         THEN N'El viaje es anterior al presupuesto: corregir la fecha del viaje o elegir otro caso para la demo. ' END,
    CASE WHEN v.Estado = N'Cancelado'
         THEN N'Su viaje está cancelado: el presupuesto puede generar otro; dejarlo así solo si se quiere mostrar. ' END,
    CASE WHEN p.Estado = 'Pendiente' AND p.FechaAlta < DATEADD(day, -30, @Hoy)
         THEN N'Pendiente hace más de un mes: aceptarlo, rechazarlo o eliminarlo. ' END
    ), N'') AS Motivos) m
WHERE m.Motivos IS NOT NULL
ORDER BY p.Presupuesto_ID;

-- 4. Proformas con fechas o viajes que no cierran.
SELECT N'4. Proformas que no cierran' AS Que, p.Proforma_ID, p.Numero, p.Tipo_Proforma, p.Estado,
       CAST(ISNULL(p.FechaEmision, p.FechaCreacion) AS date) AS Fecha, p.FechaVencimiento, ISNULL(c.Razon_Social, N'') AS Cliente,
       n.Viajes, n.Ultima_entrega, cp.Tipo + N'-' + ISNULL(cp.Letra + N'-', N'') + ISNULL(cp.Sucursal + N'-', N'') + ISNULL(cp.NumeroComprobante, N'') AS Comprobante,
       m.Motivos AS Que_hacer
FROM dbo.PROFORMAS p
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = p.ClienteID
LEFT JOIN #ComprobanteDeLaProforma cp ON cp.ProformaID = p.Proforma_ID
OUTER APPLY (SELECT COUNT(*) AS Viajes, MAX(CAST(v.Fecha_Entrega AS date)) AS Ultima_entrega
             FROM #ProformaDelViaje x JOIN dbo.VIAJES v ON v.Viaje_ID = x.Viaje_ID WHERE x.Proforma_ID = p.Proforma_ID) n
CROSS APPLY (SELECT NULLIF(CONCAT(
    CASE WHEN p.Estado <> 'Anulada' AND n.Viajes = 0 THEN N'Sin viajes: si es un borrador, eliminarlo; si no, anularla. ' END,
    CASE WHEN p.Estado NOT IN ('Borrador', 'Anulada') AND n.Ultima_entrega > CAST(ISNULL(p.FechaEmision, p.FechaCreacion) AS date)
         THEN N'Emitida antes de la entrega de un viaje: consultarlo con Claude. ' END,
    CASE WHEN p.FechaVencimiento < CAST(ISNULL(p.FechaEmision, p.FechaCreacion) AS date)
         THEN N'Vence antes de emitirse: corregir el vencimiento. ' END,
    CASE WHEN p.Estado = 'Facturada' AND cp.Comprobante_ID IS NULL THEN N'Facturada sin comprobante vigente: consultarlo con Claude. ' END,
    CASE WHEN p.Estado <> 'Facturada' AND cp.Comprobante_ID IS NOT NULL THEN N'Tiene comprobante y no figura facturada: consultarlo con Claude. ' END,
    CASE WHEN cp.FechaEmision < CAST(ISNULL(p.FechaEmision, p.FechaCreacion) AS date)
         THEN N'El comprobante es anterior a la proforma: consultarlo con Claude. ' END,
    CASE WHEN p.Estado = 'Borrador' AND p.FechaCreacion < DATEADD(day, -14, @Hoy)
         THEN N'Borrador de hace más de dos semanas: generarlo o eliminarlo. ' END
    ), N'') AS Motivos) m
WHERE m.Motivos IS NOT NULL
ORDER BY p.Proforma_ID;

-- 5. Comprobantes con fechas que no cierran o con textos de prueba (los anulados también se ven en cuenta corriente).
SELECT N'5. Comprobantes que no cierran' AS Que, c.Comprobante_ID,
       c.Tipo + N'-' + ISNULL(c.Letra + N'-', N'') + ISNULL(c.Sucursal + N'-', N'') + ISNULL(c.NumeroComprobante, N'') AS Comprobante,
       c.Estado, c.FechaEmision, c.FechaVencimiento, c.RazonSocial, c.Total, c.Concepto, m.Motivos AS Que_hacer
FROM dbo.COMPROBANTES c
OUTER APPLY (SELECT MAX(CAST(ISNULL(p.FechaEmision, p.FechaCreacion) AS date)) AS Fecha_proforma
             FROM dbo.COMPROBANTES_PROFORMAS cp JOIN dbo.PROFORMAS p ON p.Proforma_ID = cp.ProformaID
             WHERE cp.ComprobanteID = c.Comprobante_ID) pf
OUTER APPLY (SELECT MAX(d.FechaEmision) AS Deuda_mas_nueva FROM dbo.CUENTA_CORRIENTE_APLICACIONES a
             JOIN dbo.COMPROBANTES d ON d.Comprobante_ID = a.ComprobanteDeudaID
             WHERE a.Vigente = 1 AND a.ComprobanteCreditoID = c.Comprobante_ID) ap
LEFT JOIN dbo.COMPROBANTES r ON r.Comprobante_ID = c.ComprobanteReferenciaID
CROSS APPLY (SELECT NULLIF(CONCAT(
    CASE WHEN c.FechaEmision > @Hoy THEN N'Emisión futura: consultarlo con Claude. ' END,
    CASE WHEN c.FechaVencimiento < c.FechaEmision THEN N'Vence antes de emitirse: consultarlo con Claude. ' END,
    CASE WHEN c.FechaEmision < pf.Fecha_proforma THEN N'Anterior a su proforma: consultarlo con Claude. ' END,
    CASE WHEN c.FechaEmision < ap.Deuda_mas_nueva THEN N'Imputa un comprobante emitido después: consultarlo con Claude. ' END,
    CASE WHEN c.FechaEmision < r.FechaEmision THEN N'Anterior al comprobante que referencia: consultarlo con Claude. ' END,
    CASE WHEN LOWER(c.Concepto + N' ' + ISNULL(c.Observaciones, N'') + N' ' + c.RazonSocial) LIKE N'%prueba%'
              OR LOWER(c.Concepto + N' ' + ISNULL(c.Observaciones, N'') + N' ' + c.RazonSocial) LIKE N'%test%'
              OR LOWER(c.Concepto + N' ' + ISNULL(c.Observaciones, N'') + N' ' + c.RazonSocial) LIKE N'%claude%'
         THEN N'Texto de prueba: va con la limpieza de la ronda 3 (§62), con Facu. ' END,
    CASE WHEN c.RazonSocial LIKE N'%powerful%' THEN N'Lleva el nombre viejo del cliente (se guarda al emitir): con Facu. ' END
    ), N'') AS Motivos) m
WHERE c.Estado <> 'BORRADOR' AND m.Motivos IS NOT NULL
ORDER BY c.FechaEmision, c.Comprobante_ID;

-- 6. Cuenta corriente por cliente: para mostrar uno al día, uno con deuda que todavía no vence y uno con deuda vencida.
SELECT N'6. Cuenta corriente' AS Que, cl.Cliente_ID, cl.Razon_Social,
       COUNT(*) AS Comprobantes,
       SUM(CASE WHEN s.Impacto = 'D' THEN s.Saldo ELSE 0 END) AS Deuda_sin_imputar,
       SUM(CASE WHEN s.Impacto = 'C' THEN s.Saldo ELSE 0 END) AS Credito_libre,
       SUM(CASE WHEN s.Impacto = 'D' AND s.Saldo > 0 AND s.FechaVencimiento < @Hoy THEN s.Saldo ELSE 0 END) AS Deuda_vencida,
       CASE
           WHEN SUM(CASE WHEN s.Impacto = 'D' AND s.Saldo > 0 AND s.FechaVencimiento < @Hoy THEN 1 ELSE 0 END) > 0 THEN N'Sirve para mostrar deuda vencida'
           WHEN SUM(CASE WHEN s.Impacto = 'D' AND s.Saldo > 0 THEN 1 ELSE 0 END) > 0 THEN N'Sirve para mostrar deuda al día'
           WHEN SUM(CASE WHEN s.Impacto = 'C' AND s.Saldo > 0 THEN 1 ELSE 0 END) > 0 THEN N'Tiene crédito sin imputar: sirve para mostrar Imputar'
           ELSE N'Sirve para mostrar un cliente al día' END AS Que_hacer
FROM #Saldos s
JOIN dbo.CLIENTES cl ON cl.Cliente_ID = s.ClienteID
GROUP BY cl.Cliente_ID, cl.Razon_Social
ORDER BY cl.Razon_Social;

-- 7. Numeración contra fechas: dentro de cada tipo, letra y sucursal, un número más alto no puede tener una fecha anterior
-- (pasa si se emite con fecha pasada después de otro). Lo mismo con las proformas generadas. La última fila de cada tipo
-- dice desde qué fecha se puede emitir sin desordenar la numeración.
WITH Orden AS (
    SELECT c.Tipo + ISNULL(N'-' + c.Letra, N'') + ISNULL(N'-' + c.Sucursal, N'') AS Serie, c.NumeroCorrelativo AS Numero,
           c.FechaEmision AS Fecha, c.Estado,
           MAX(c.FechaEmision) OVER (PARTITION BY c.Tipo, c.Letra, c.Sucursal ORDER BY c.NumeroCorrelativo
                                     ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS Fecha_mas_nueva_antes,
           ROW_NUMBER() OVER (PARTITION BY c.Tipo, c.Letra, c.Sucursal ORDER BY c.NumeroCorrelativo DESC) AS Desde_el_final
    FROM dbo.COMPROBANTES c
    WHERE c.Estado <> 'BORRADOR' AND c.NumeroCorrelativo IS NOT NULL
    UNION ALL
    SELECT N'PF', TRY_CONVERT(int, REPLACE(p.Numero, N'PF-', N'')), CAST(p.FechaEmision AS date), p.Estado,
           MAX(CAST(p.FechaEmision AS date)) OVER (ORDER BY TRY_CONVERT(int, REPLACE(p.Numero, N'PF-', N''))
                                                   ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),
           ROW_NUMBER() OVER (ORDER BY TRY_CONVERT(int, REPLACE(p.Numero, N'PF-', N'')) DESC)
    FROM dbo.PROFORMAS p
    WHERE p.Estado <> 'Borrador' AND p.Numero LIKE N'PF-%' AND p.FechaEmision IS NOT NULL
)
SELECT N'7. Numeración' AS Que, Serie, Numero, Fecha, Estado,
       CASE WHEN Fecha < Fecha_mas_nueva_antes
                THEN N'Fecha anterior a un número más bajo (' + CONVERT(nvarchar(10), Fecha_mas_nueva_antes, 103) + N'): consultarlo con Claude. '
            ELSE N'' END
     + CASE WHEN Desde_el_final = 1 THEN N'Último número: lo próximo de esta serie, con fecha ' + CONVERT(nvarchar(10), Fecha, 103) + N' o posterior.'
            ELSE N'' END AS Que_hacer
FROM Orden
WHERE Fecha < Fecha_mas_nueva_antes OR Desde_el_final = 1
ORDER BY Serie, Numero;

DROP TABLE IF EXISTS #ProformaDelViaje;
DROP TABLE IF EXISTS #ComprobanteDeLaProforma;
DROP TABLE IF EXISTS #Saldos;
