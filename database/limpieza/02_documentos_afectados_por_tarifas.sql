/*
   Documentos de facturación que habría que regenerar al pasar todos los viajes a la tabla de tarifas (solo lectura,
   25/10/2026).

   Al recalcular los viajes con la tabla, cambia su importe. Los documentos que ya se armaron con el importe anterior
   quedarían distintos de sus viajes: las proformas que los incluyen, las facturas de esas proformas (y las que tienen una
   línea de un viaje), las notas de crédito y de débito sobre esas facturas, y los recibos aplicados a ellas. Este script
   los cuenta y los lista; no cambia nada. Los presupuestos van al final: no son de facturación, pero también cambian.

   Cómo correrlo: SSMS, base Transporte_Sanchez, tal cual. Sirve antes y después de los scripts de tarifas.
*/
SET NOCOUNT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54630, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

/* ---------------------------------------------------------------- Proformas con viajes */

IF OBJECT_ID('tempdb..#ProformaViaje') IS NOT NULL DROP TABLE #ProformaViaje;
SELECT DISTINCT x.Proforma_ID, x.ViajeID
INTO #ProformaViaje
FROM (
    SELECT pv.ProformaID AS Proforma_ID, pv.ViajeID FROM dbo.PROFORMAS_VIAJES pv
    UNION
    SELECT pd.Proforma_ID, TRY_CONVERT(int, SUBSTRING(LTRIM(RTRIM(pd.Codigo)), 2, 20))
    FROM dbo.PROFORMA_DETALLE pd
    WHERE UPPER(LEFT(LTRIM(RTRIM(ISNULL(pd.Codigo, ''))), 1)) = 'V'
      AND TRY_CONVERT(int, SUBSTRING(LTRIM(RTRIM(pd.Codigo)), 2, 20)) IS NOT NULL
) x;

IF OBJECT_ID('tempdb..#Proformas') IS NOT NULL DROP TABLE #Proformas;
SELECT p.Proforma_ID, ISNULL(p.Numero, N'') AS Numero, p.Estado, p.ClienteID,
       (SELECT COUNT(*) FROM #ProformaViaje pv WHERE pv.Proforma_ID = p.Proforma_ID) AS Viajes,
       (SELECT STRING_AGG(CONVERT(nvarchar(11), pv.ViajeID), N', ') FROM #ProformaViaje pv WHERE pv.Proforma_ID = p.Proforma_ID) AS IDs_Viajes
INTO #Proformas
FROM dbo.PROFORMAS p
WHERE EXISTS (SELECT 1 FROM #ProformaViaje pv WHERE pv.Proforma_ID = p.Proforma_ID);

/* ---------------------------------------------------------------- Facturas, NC/ND y recibos */

-- Facturas de esas proformas, o con una línea de un viaje (código V{id}).
IF OBJECT_ID('tempdb..#Facturas') IS NOT NULL DROP TABLE #Facturas;
SELECT DISTINCT c.Comprobante_ID
INTO #Facturas
FROM dbo.COMPROBANTES c
WHERE c.Tipo = 'FAC' AND (
      EXISTS (SELECT 1 FROM dbo.COMPROBANTES_PROFORMAS cp JOIN #Proformas p ON p.Proforma_ID = cp.ProformaID WHERE cp.ComprobanteID = c.Comprobante_ID)
   OR EXISTS (SELECT 1 FROM dbo.COMPROBANTES_DETALLE d WHERE d.ComprobanteID = c.Comprobante_ID
              AND UPPER(LEFT(LTRIM(RTRIM(ISNULL(d.Codigo, ''))), 1)) = 'V'
              AND TRY_CONVERT(int, SUBSTRING(LTRIM(RTRIM(d.Codigo)), 2, 20)) IS NOT NULL));

-- Notas de crédito y de débito sobre esas facturas (por referencia o aplicadas a ellas).
IF OBJECT_ID('tempdb..#Notas') IS NOT NULL DROP TABLE #Notas;
SELECT DISTINCT c.Comprobante_ID
INTO #Notas
FROM dbo.COMPROBANTES c
WHERE c.Tipo IN ('NC', 'ND') AND (
      c.ComprobanteReferenciaID IN (SELECT Comprobante_ID FROM #Facturas)
   OR EXISTS (SELECT 1 FROM dbo.CUENTA_CORRIENTE_APLICACIONES a WHERE a.ComprobanteCreditoID = c.Comprobante_ID
              AND a.ComprobanteDeudaID IN (SELECT Comprobante_ID FROM #Facturas)));

-- Recibos aplicados a esas facturas.
IF OBJECT_ID('tempdb..#Recibos') IS NOT NULL DROP TABLE #Recibos;
SELECT DISTINCT c.Comprobante_ID
INTO #Recibos
FROM dbo.COMPROBANTES c
WHERE c.Tipo = 'REC' AND EXISTS (SELECT 1 FROM dbo.CUENTA_CORRIENTE_APLICACIONES a WHERE a.ComprobanteCreditoID = c.Comprobante_ID
                                 AND a.ComprobanteDeudaID IN (SELECT Comprobante_ID FROM #Facturas));

/* ---------------------------------------------------------------- Resumen */

SELECT N'Proformas con viajes' AS Documento, p.Estado AS Estado, COUNT(*) AS Cantidad, SUM(p.Viajes) AS Viajes
FROM #Proformas p GROUP BY p.Estado
UNION ALL
SELECT N'Facturas', c.Estado, COUNT(*), NULL FROM dbo.COMPROBANTES c WHERE c.Comprobante_ID IN (SELECT Comprobante_ID FROM #Facturas) GROUP BY c.Estado
UNION ALL
SELECT CASE c.Tipo WHEN 'NC' THEN N'Notas de crédito' ELSE N'Notas de débito' END, c.Estado, COUNT(*), NULL
FROM dbo.COMPROBANTES c WHERE c.Comprobante_ID IN (SELECT Comprobante_ID FROM #Notas) GROUP BY c.Tipo, c.Estado
UNION ALL
SELECT N'Recibos', c.Estado, COUNT(*), NULL FROM dbo.COMPROBANTES c WHERE c.Comprobante_ID IN (SELECT Comprobante_ID FROM #Recibos) GROUP BY c.Estado
ORDER BY 1, 2;

/* ---------------------------------------------------------------- Detalle */

-- Proformas: número, estado, cliente y viajes.
SELECT p.Proforma_ID, NULLIF(p.Numero, N'') AS Numero, p.Estado, cl.Razon_Social AS Cliente, p.Viajes, p.IDs_Viajes
FROM #Proformas p LEFT JOIN dbo.CLIENTES cl ON cl.Cliente_ID = p.ClienteID
ORDER BY p.Proforma_ID;

-- Facturas, notas y recibos: número, estado, cliente, total y concepto.
SELECT CASE WHEN c.Comprobante_ID IN (SELECT Comprobante_ID FROM #Facturas) THEN N'Factura'
            WHEN c.Comprobante_ID IN (SELECT Comprobante_ID FROM #Notas) THEN CASE c.Tipo WHEN 'NC' THEN N'Nota de crédito' ELSE N'Nota de débito' END
            ELSE N'Recibo' END AS Documento,
       c.Comprobante_ID, c.Tipo + N'-' + RIGHT(N'00000000' + CONVERT(nvarchar(11), c.NumeroCorrelativo), 8) AS Numero,
       c.Estado, c.FechaEmision, cl.Razon_Social AS Cliente, c.Total, c.Concepto,
       CASE WHEN c.Tipo = 'REC' AND EXISTS (SELECT 1 FROM dbo.CUENTA_CORRIENTE_APLICACIONES a WHERE a.ComprobanteCreditoID = c.Comprobante_ID
                                            AND a.ComprobanteDeudaID NOT IN (SELECT Comprobante_ID FROM #Facturas))
            THEN N'También está aplicado a otras facturas' END AS Nota
FROM dbo.COMPROBANTES c
LEFT JOIN dbo.CLIENTES cl ON cl.Cliente_ID = c.ClienteID
WHERE c.Comprobante_ID IN (SELECT Comprobante_ID FROM #Facturas UNION SELECT Comprobante_ID FROM #Notas UNION SELECT Comprobante_ID FROM #Recibos)
ORDER BY CASE c.Tipo WHEN 'FAC' THEN 1 WHEN 'NC' THEN 2 WHEN 'ND' THEN 3 ELSE 4 END, c.NumeroCorrelativo;

-- Para comparar: los demás comprobantes (no tienen viajes; no cambian con las tarifas, pero pueden ser de prueba).
SELECT c.Tipo, c.Estado, COUNT(*) AS Cantidad
FROM dbo.COMPROBANTES c
WHERE c.Comprobante_ID NOT IN (SELECT Comprobante_ID FROM #Facturas UNION SELECT Comprobante_ID FROM #Notas UNION SELECT Comprobante_ID FROM #Recibos)
GROUP BY c.Tipo, c.Estado ORDER BY c.Tipo, c.Estado;

/* ---------------------------------------------------------------- Presupuestos (no son de facturación) */

SELECT ps.Estado, COUNT(*) AS Presupuestos, SUM(CASE WHEN ps.ViajeID IS NOT NULL THEN 1 ELSE 0 END) AS Con_viaje_generado
FROM dbo.PRESUPUESTOS ps GROUP BY ps.Estado ORDER BY ps.Estado;
