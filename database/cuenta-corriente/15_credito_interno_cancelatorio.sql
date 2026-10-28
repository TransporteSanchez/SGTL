/*
  Permite emitir un crédito configurable (por ejemplo, CI) y referenciar
  un comprobante de deuda al cancelar una proforma. Ejecutar después de 14.
  No modifica datos ni relaciones. Es idempotente y valida los datos previos.

  Los CHECK no pueden consultar TIPOS_COMPROBANTE. La API valida que el
  comprobante referenciado sea de deuda; los disparadores aseguran que cada
  movimiento conserve el impacto del comprobante (u opuesto al revertirlo).
  Las FK existentes conservan el tipo y el cliente de cada referencia.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.COMPROBANTES', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.TIPOS_COMPROBANTE', N'U') IS NULL
    THROW 51140, 'Faltan tablas de cuenta corriente. Ejecutá primero las migraciones previas.', 1;

IF COL_LENGTH(N'dbo.COMPROBANTES', N'Impacto') IS NULL
   OR COL_LENGTH(N'dbo.COMPROBANTES', N'ComprobanteReferenciaID') IS NULL
   OR COL_LENGTH(N'dbo.COMPROBANTES', N'TipoReferencia') IS NULL
   OR COL_LENGTH(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS', N'Impacto') IS NULL
    THROW 51141, 'Faltan columnas de los comprobantes o movimientos.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                   WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                     AND referenced_object_id = OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
                     AND name = N'FK_CC_COMP_Tipo'
                     AND is_disabled = 0 AND is_not_trusted = 0)
       OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                      WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                        AND referenced_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                        AND name = N'FK_CC_COMP_Referencia'
                        AND is_disabled = 0 AND is_not_trusted = 0)
       OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                      WHERE parent_object_id = OBJECT_ID(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS')
                        AND referenced_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                        AND name = N'FK_CC_MOV_Comprobante'
                        AND is_disabled = 0 AND is_not_trusted = 0)
        THROW 51142, 'Las relaciones de cuenta corriente no coinciden con el esquema esperado.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS m WITH (UPDLOCK,HOLDLOCK)
        JOIN dbo.COMPROBANTES c WITH (UPDLOCK,HOLDLOCK) ON c.Comprobante_ID=m.ComprobanteID
        WHERE (m.Clase='EMISION' AND m.Impacto<>c.Impacto)
           OR (m.Clase='REVERSO' AND m.Impacto=c.Impacto)
    )
        THROW 51143, 'Hay movimientos con impacto distinto del comprobante. Revisalos antes de continuar.', 1;

    IF EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE parent_object_id = OBJECT_ID(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS')
                 AND name = N'CK_CC_MOV_Impacto')
        ALTER TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS DROP CONSTRAINT CK_CC_MOV_Impacto;

    ALTER TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS WITH CHECK
        ADD CONSTRAINT CK_CC_MOV_Impacto CHECK (
            (Clase = 'EMISION' AND
                ((Tipo IN ('NC','REC') AND Impacto = 'C')
                 OR (Tipo IN ('FAC','ND') AND Impacto = 'D')
                 OR (Tipo NOT IN ('NC','REC','FAC','ND') AND Impacto IN ('C','D'))))
            OR (Clase = 'REVERSO' AND
                ((Tipo IN ('NC','REC') AND Impacto = 'D')
                 OR (Tipo IN ('FAC','ND') AND Impacto = 'C')
                 OR (Tipo NOT IN ('NC','REC','FAC','ND') AND Impacto IN ('C','D'))))
        );
    ALTER TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS CHECK CONSTRAINT CK_CC_MOV_Impacto;

    IF EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                 AND name = N'CK_CC_COMP_Referencia')
        ALTER TABLE dbo.COMPROBANTES DROP CONSTRAINT CK_CC_COMP_Referencia;

    ALTER TABLE dbo.COMPROBANTES WITH CHECK
        ADD CONSTRAINT CK_CC_COMP_Referencia CHECK (
            (ComprobanteReferenciaID IS NULL AND TipoReferencia IS NULL)
            OR (ComprobanteReferenciaID IS NOT NULL AND TipoReferencia IS NOT NULL
                AND TipoReferencia NOT IN ('NC','REC','ND')
                AND ((Impacto = 'C' AND Tipo <> 'REC') OR (Tipo = 'ND' AND Impacto = 'D'))
                AND ComprobanteReferenciaID <> Comprobante_ID)
        );
    ALTER TABLE dbo.COMPROBANTES CHECK CONSTRAINT CK_CC_COMP_Referencia;

    -- CREATE TRIGGER debe ser la primera instrucción del lote dinámico.
    EXEC(N'CREATE OR ALTER TRIGGER dbo.TR_CC_MOV_ImpactoComprobante
ON dbo.CUENTA_CORRIENTE_MOVIMIENTOS
AFTER INSERT, UPDATE
AS
BEGIN
    IF (ROWCOUNT_BIG()=0) RETURN;
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted AS m
        JOIN dbo.COMPROBANTES AS c WITH (UPDLOCK,HOLDLOCK) ON c.Comprobante_ID=m.ComprobanteID
        WHERE (m.Clase=''EMISION'' AND m.Impacto<>c.Impacto)
           OR (m.Clase=''REVERSO'' AND m.Impacto=c.Impacto)
    )
        THROW 51144, ''El impacto del movimiento no coincide con el comprobante.'', 1;
END');
    ENABLE TRIGGER dbo.TR_CC_MOV_ImpactoComprobante ON dbo.CUENTA_CORRIENTE_MOVIMIENTOS;

    EXEC(N'CREATE OR ALTER TRIGGER dbo.TR_CC_COMP_ImpactoMovimientos
ON dbo.COMPROBANTES
AFTER UPDATE
AS
BEGIN
    IF (ROWCOUNT_BIG()=0) RETURN;
    SET NOCOUNT ON;
    IF NOT UPDATE(Impacto) RETURN;
    IF EXISTS (
        SELECT 1
        FROM inserted AS c
        JOIN dbo.CUENTA_CORRIENTE_MOVIMIENTOS AS m WITH (UPDLOCK,HOLDLOCK) ON m.ComprobanteID=c.Comprobante_ID
        WHERE (m.Clase=''EMISION'' AND m.Impacto<>c.Impacto)
           OR (m.Clase=''REVERSO'' AND m.Impacto=c.Impacto)
    )
        THROW 51145, ''El impacto del comprobante no coincide con sus movimientos.'', 1;
END');
    ENABLE TRIGGER dbo.TR_CC_COMP_ImpactoMovimientos ON dbo.COMPROBANTES;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
