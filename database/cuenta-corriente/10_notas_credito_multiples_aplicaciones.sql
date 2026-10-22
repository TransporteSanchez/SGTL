/*
  Cuenta Corriente - Notas de Crédito con varias Facturas
  Ejecutar únicamente por el procedimiento autorizado y nunca desde la aplicación.
  Es idempotente: reemplaza el CHECK de referencia sin modificar datos.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.COMPROBANTES', N'U') IS NULL
    THROW 51070, 'No existe dbo.COMPROBANTES. Instalá primero el modelo de Cuenta Corriente.', 1;
GO

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
      AND name = N'CK_CC_COMP_Referencia'
)
BEGIN
    ALTER TABLE dbo.COMPROBANTES DROP CONSTRAINT CK_CC_COMP_Referencia;
END;
GO

ALTER TABLE dbo.COMPROBANTES WITH CHECK ADD CONSTRAINT CK_CC_COMP_Referencia CHECK (
    (ComprobanteReferenciaID IS NULL AND TipoReferencia IS NULL)
    OR (ComprobanteReferenciaID IS NOT NULL AND TipoReferencia = 'FAC'
        AND Tipo IN ('NC','ND') AND ComprobanteReferenciaID <> Comprobante_ID)
);
GO

ALTER TABLE dbo.COMPROBANTES CHECK CONSTRAINT CK_CC_COMP_Referencia;
GO
