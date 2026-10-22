/* SOLO LECTURA. Ejecutar después de probar la instalación en desarrollo.
   Los diagnósticos de inconsistencias deben devolver cero filas.
   No sustituye pruebas de concurrencia ni servicios transaccionales. */
SET NOCOUNT ON;
SELECT DB_NAME() AS BaseSeleccionada;

SELECT Tipo, Descripcion, Impacto FROM dbo.TIPOS_COMPROBANTE ORDER BY Tipo;
SELECT Tipo, UltimoNumero FROM dbo.COMPROBANTES_NUMERADORES ORDER BY Tipo;
SELECT Codigo, Descripcion FROM dbo.PERMISOS ORDER BY Codigo;

SELECT t.name AS Tabla, i.name AS Indice, i.is_unique, i.filter_definition
FROM sys.tables t JOIN sys.indexes i ON i.object_id = t.object_id
WHERE t.schema_id = SCHEMA_ID('dbo') AND i.index_id > 0
  AND t.name IN ('COMPROBANTES','COMPROBANTES_PROFORMAS',
                'CUENTA_CORRIENTE_MOVIMIENTOS','CUENTA_CORRIENTE_APLICACIONES')
ORDER BY t.name, i.name;

SELECT fk.name, OBJECT_NAME(fk.parent_object_id) AS Tabla,
       fk.is_disabled, fk.is_not_trusted, fk.delete_referential_action_desc
FROM sys.foreign_keys fk WHERE fk.name LIKE 'FK_CC_%';

-- Emitidos o anulados sin emisión, o con importe de movimiento distinto.
SELECT c.Comprobante_ID, c.Estado, c.Total, m.Importe AS ImporteMovimiento
FROM dbo.COMPROBANTES c
LEFT JOIN dbo.CUENTA_CORRIENTE_MOVIMIENTOS m
  ON m.ComprobanteID = c.Comprobante_ID AND m.Clase = 'EMISION'
WHERE c.Estado IN ('EMITIDO','ANULADO')
  AND (m.Movimiento_ID IS NULL OR m.Importe <> c.Total);

-- Reverso debe corresponder a un anulado y compensar el original.
SELECT r.Movimiento_ID, r.ComprobanteID
FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS r
JOIN dbo.COMPROBANTES c ON c.Comprobante_ID = r.ComprobanteID
JOIN dbo.CUENTA_CORRIENTE_MOVIMIENTOS o ON o.Movimiento_ID = r.MovimientoOriginalID
WHERE r.Clase = 'REVERSO' AND
      (c.Estado <> 'ANULADO' OR o.Clase <> 'EMISION' OR r.Importe <> o.Importe OR r.Impacto = o.Impacto);

SELECT c.Comprobante_ID FROM dbo.COMPROBANTES c
WHERE c.Estado = 'ANULADO' AND NOT EXISTS (
 SELECT 1 FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS m
 WHERE m.ComprobanteID = c.Comprobante_ID AND m.Clase = 'REVERSO');

-- Aplicaciones vigentes en comprobantes no emitidos.
SELECT a.Aplicacion_ID FROM dbo.CUENTA_CORRIENTE_APLICACIONES a
JOIN dbo.COMPROBANTES cr ON cr.Comprobante_ID = a.ComprobanteCreditoID
JOIN dbo.COMPROBANTES de ON de.Comprobante_ID = a.ComprobanteDeudaID
WHERE a.Vigente = 1 AND (cr.Estado <> 'EMITIDO' OR de.Estado <> 'EMITIDO');

-- Deudas sobreaplicadas y créditos no completamente aplicados (MVP).
SELECT c.Comprobante_ID, c.Tipo, c.Total,
       COALESCE(SUM(a.Importe),0) AS Aplicado
FROM dbo.COMPROBANTES c
LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a
 ON a.ComprobanteDeudaID = c.Comprobante_ID AND a.Vigente = 1
WHERE c.Estado = 'EMITIDO' AND c.Impacto = 'D'
GROUP BY c.Comprobante_ID, c.Tipo, c.Total
HAVING COALESCE(SUM(a.Importe),0) > c.Total;

SELECT c.Comprobante_ID, c.Tipo, c.Total,
       COALESCE(SUM(a.Importe),0) AS Aplicado
FROM dbo.COMPROBANTES c
LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a
 ON a.ComprobanteCreditoID = c.Comprobante_ID AND a.Vigente = 1
WHERE c.Estado = 'EMITIDO' AND c.Impacto = 'C'
GROUP BY c.Comprobante_ID, c.Tipo, c.Total
HAVING COALESCE(SUM(a.Importe),0) <> c.Total;

SELECT c.Comprobante_ID, c.Total, COALESCE(SUM(p.Importe),0) AS TotalFormasPago
FROM dbo.COMPROBANTES c
LEFT JOIN dbo.RECIBOS_FORMAS_PAGO p ON p.ComprobanteID = c.Comprobante_ID
WHERE c.Estado = 'EMITIDO' AND c.Tipo = 'REC'
GROUP BY c.Comprobante_ID, c.Total
HAVING COALESCE(SUM(p.Importe),0) <> c.Total;

SELECT c.Comprobante_ID FROM dbo.COMPROBANTES c
LEFT JOIN dbo.COMPROBANTES_PROFORMAS p ON p.ComprobanteID = c.Comprobante_ID
WHERE c.Tipo = 'FAC' AND c.Estado = 'EMITIDO'
  AND (p.ComprobanteProforma_ID IS NULL OR p.Vigente = 0);

SELECT p.ComprobanteProforma_ID FROM dbo.COMPROBANTES_PROFORMAS p
JOIN dbo.COMPROBANTES c ON c.Comprobante_ID = p.ComprobanteID
WHERE (c.Estado = 'ANULADO' AND p.Vigente = 1)
   OR (c.Estado = 'EMITIDO' AND p.Vigente = 0);

SELECT c.Comprobante_ID, c.ComprobanteReferenciaID, c.Total,
       COUNT(CASE WHEN a.Vigente=1 THEN 1 END) AS AplicacionesVigentes,
       COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) AS Aplicado,
       MIN(CASE WHEN a.Vigente=1 THEN a.ComprobanteDeudaID END) AS ComprobanteDeudaID
FROM dbo.COMPROBANTES c
LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteCreditoID = c.Comprobante_ID
WHERE c.Tipo = 'NC' AND c.ComprobanteReferenciaID IS NOT NULL
GROUP BY c.Comprobante_ID, c.ComprobanteReferenciaID, c.Total
HAVING COUNT(CASE WHEN a.Vigente=1 THEN 1 END) <> 1
    OR COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) <> c.Total
    OR MIN(CASE WHEN a.Vigente=1 THEN a.ComprobanteDeudaID END) <> c.ComprobanteReferenciaID;

SELECT c.Comprobante_ID FROM dbo.COMPROBANTES c
LEFT JOIN dbo.CUENTA_CORRIENTE_APLICACIONES a ON a.ComprobanteCreditoID = c.Comprobante_ID
WHERE c.Tipo = 'NC' AND c.ComprobanteReferenciaID IS NULL
GROUP BY c.Comprobante_ID,c.Total
HAVING COALESCE(SUM(CASE WHEN a.Vigente=1 THEN a.Importe ELSE 0 END),0) <> c.Total;

SELECT pv.ProformaID, pv.ViajeID FROM dbo.PROFORMAS_VIAJES pv
JOIN dbo.PROFORMAS p ON p.Proforma_ID = pv.ProformaID
JOIN dbo.VIAJES v ON v.Viaje_ID = pv.ViajeID
WHERE p.ClienteID <> v.ClienteID;

SELECT ClienteID,
       SUM(CASE WHEN Impacto = 'D' THEN Importe ELSE -Importe END) AS Saldo
FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS
GROUP BY ClienteID
HAVING SUM(CASE WHEN Impacto = 'D' THEN Importe ELSE -Importe END) < 0;
