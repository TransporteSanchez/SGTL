/*
  Permite emitir y revertir comprobantes de deuda con códigos configurables
  (por ejemplo, FC), además de FAC y ND. NC y REC conservan su lógica de crédito.
  No modifica comprobantes ni movimientos existentes. Compatible con las
  migraciones 11 y 12, que no intervienen en esta restricción.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.COMPROBANTES', N'U') IS NULL
   OR OBJECT_ID(N'dbo.TIPOS_COMPROBANTE', N'U') IS NULL
    THROW 51120, 'Faltan tablas de cuenta corriente. Ejecutá primero las migraciones previas.', 1;

IF COL_LENGTH(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS', N'Tipo') IS NULL
   OR COL_LENGTH(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS', N'Clase') IS NULL
   OR COL_LENGTH(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS', N'Impacto') IS NULL
    THROW 51121, 'Faltan columnas de los movimientos de cuenta corriente.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                   WHERE parent_object_id = OBJECT_ID(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS')
                     AND referenced_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                     AND name = N'FK_CC_MOV_Comprobante'
                     AND is_disabled = 0 AND is_not_trusted = 0)
       OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                      WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                        AND referenced_object_id = OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
                        AND name = N'FK_CC_COMP_Tipo'
                        AND is_disabled = 0 AND is_not_trusted = 0)
        THROW 51122, 'Las relaciones de cuenta corriente no coinciden con el esquema esperado.', 1;

    IF EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE parent_object_id = OBJECT_ID(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS')
                 AND name = N'CK_CC_MOV_Impacto')
        ALTER TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS DROP CONSTRAINT CK_CC_MOV_Impacto;

    ALTER TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS WITH CHECK
        ADD CONSTRAINT CK_CC_MOV_Impacto CHECK (
            (Clase = 'EMISION' AND
                ((Tipo NOT IN ('NC','REC') AND Impacto = 'D')
                 OR (Tipo IN ('NC','REC') AND Impacto = 'C')))
            OR (Clase = 'REVERSO' AND
                ((Tipo NOT IN ('NC','REC') AND Impacto = 'C')
                 OR (Tipo IN ('NC','REC') AND Impacto = 'D')))
        );
    ALTER TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS CHECK CONSTRAINT CK_CC_MOV_Impacto;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
