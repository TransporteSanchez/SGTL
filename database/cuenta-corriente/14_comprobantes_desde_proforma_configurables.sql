/*
  Permite vincular una proforma con un comprobante de deuda configurable
  (por ejemplo, FC), además de FAC, y referenciarlo desde la NC cancelatoria.
  ND, NC y REC conservan sus circuitos propios. Ejecutar después de 13.

  Los CHECK no pueden consultar TIPOS_COMPROBANTE: la API valida que el tipo
  elegido para emitir desde proforma tenga impacto D. Las FK compuestas
  siguen garantizando el mismo cliente y el tipo real del comprobante.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.COMPROBANTES', N'U') IS NULL
   OR OBJECT_ID(N'dbo.COMPROBANTES_PROFORMAS', N'U') IS NULL
    THROW 51130, 'Faltan tablas de cuenta corriente. Ejecutá primero las migraciones previas.', 1;

IF COL_LENGTH(N'dbo.COMPROBANTES', N'ComprobanteReferenciaID') IS NULL
   OR COL_LENGTH(N'dbo.COMPROBANTES', N'TipoReferencia') IS NULL
   OR COL_LENGTH(N'dbo.COMPROBANTES_PROFORMAS', N'TipoFactura') IS NULL
    THROW 51131, 'Faltan columnas de los comprobantes vinculados a proformas.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                   WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES_PROFORMAS')
                     AND referenced_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                     AND name = N'FK_CC_CP_Factura'
                     AND is_disabled = 0 AND is_not_trusted = 0)
       OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                      WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                        AND referenced_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                        AND name = N'FK_CC_COMP_Referencia'
                        AND is_disabled = 0 AND is_not_trusted = 0)
        THROW 51132, 'Las relaciones de los comprobantes no coinciden con el esquema esperado.', 1;

    IF EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES_PROFORMAS')
                 AND name = N'CK_CC_CP_Tipo')
        ALTER TABLE dbo.COMPROBANTES_PROFORMAS DROP CONSTRAINT CK_CC_CP_Tipo;

    ALTER TABLE dbo.COMPROBANTES_PROFORMAS WITH CHECK
        ADD CONSTRAINT CK_CC_CP_Tipo CHECK (TipoFactura NOT IN ('NC','REC','ND'));
    ALTER TABLE dbo.COMPROBANTES_PROFORMAS CHECK CONSTRAINT CK_CC_CP_Tipo;

    IF EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                 AND name = N'CK_CC_COMP_Referencia')
        ALTER TABLE dbo.COMPROBANTES DROP CONSTRAINT CK_CC_COMP_Referencia;

    ALTER TABLE dbo.COMPROBANTES WITH CHECK
        ADD CONSTRAINT CK_CC_COMP_Referencia CHECK (
            (ComprobanteReferenciaID IS NULL AND TipoReferencia IS NULL)
            OR (ComprobanteReferenciaID IS NOT NULL AND TipoReferencia IS NOT NULL
                AND TipoReferencia NOT IN ('NC','REC','ND')
                AND Tipo IN ('NC','ND') AND ComprobanteReferenciaID <> Comprobante_ID)
        );
    ALTER TABLE dbo.COMPROBANTES CHECK CONSTRAINT CK_CC_COMP_Referencia;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
