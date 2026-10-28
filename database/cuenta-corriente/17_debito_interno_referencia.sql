/*
   Permite vincular un débito interno (p. ej. D) a un comprobante interno de
   deuda (p. ej. FC) del mismo cliente. Ejecutar después de la migración 16.
   Es idempotente; no modifica datos, numeración ni importes existentes.
   La API valida impacto de deuda, estado emitido, cliente y fecha del origen.
   Se conservan la FK por ID y cliente y el disparador que valida TipoReferencia.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.COMPROBANTES', N'U') IS NULL
   OR COL_LENGTH(N'dbo.COMPROBANTES', N'Impacto') IS NULL
   OR COL_LENGTH(N'dbo.COMPROBANTES', N'ComprobanteReferenciaID') IS NULL
   OR COL_LENGTH(N'dbo.COMPROBANTES', N'TipoReferencia') IS NULL
    THROW 51180, 'Faltan tablas o columnas de cuenta corriente. Ejecutá las migraciones previas.', 1;

IF NOT EXISTS (SELECT 1 FROM sys.triggers
               WHERE object_id=OBJECT_ID(N'dbo.TR_CC_COMP_TipoReferencia',N'TR') AND is_disabled=0)
   OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                  WHERE parent_object_id=OBJECT_ID(N'dbo.COMPROBANTES')
                    AND name=N'FK_CC_COMP_Referencia' AND is_disabled=0 AND is_not_trusted=0)
    THROW 51181, 'Falta la validación de referencias. Ejecutá primero la migración 16.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE parent_object_id=OBJECT_ID(N'dbo.COMPROBANTES') AND name=N'CK_CC_COMP_Referencia')
        ALTER TABLE dbo.COMPROBANTES DROP CONSTRAINT CK_CC_COMP_Referencia;

    ALTER TABLE dbo.COMPROBANTES WITH CHECK ADD CONSTRAINT CK_CC_COMP_Referencia CHECK (
        (ComprobanteReferenciaID IS NULL AND TipoReferencia IS NULL)
        OR (ComprobanteReferenciaID IS NOT NULL AND TipoReferencia IS NOT NULL
            AND TipoReferencia NOT IN ('NC','REC','ND')
            AND ((Impacto='C' AND Tipo<>'REC')
                 OR (Tipo='ND' AND Impacto='D')
                 OR (Impacto='D' AND Tipo NOT IN ('FAC','NC','ND','REC')
                     AND TipoReferencia NOT IN ('FAC','NC','ND','REC')))
            AND ComprobanteReferenciaID<>Comprobante_ID)
    );
    ALTER TABLE dbo.COMPROBANTES CHECK CONSTRAINT CK_CC_COMP_Referencia;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
