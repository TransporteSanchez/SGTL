/*
    Sincroniza las Proformas históricas que ya tienen una Factura vigente.
    La emisión de nuevas Facturas actualiza el estado en la misma transacción
    desde FacturasController.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

UPDATE p
SET Estado = N'Facturada',
    Usu_Modi = COALESCE(NULLIF(p.Usu_Modi, N''), N'sistema'),
    Fecha_Modi = GETDATE()
FROM dbo.PROFORMAS p
WHERE p.Estado <> N'Facturada'
  AND EXISTS
  (
      SELECT 1
      FROM dbo.COMPROBANTES_PROFORMAS cp
      INNER JOIN dbo.COMPROBANTES c ON c.Comprobante_ID = cp.ComprobanteID
      WHERE cp.ProformaID = p.Proforma_ID
        AND cp.Vigente = 1
        AND c.Tipo = 'FAC'
  );

COMMIT TRANSACTION;
