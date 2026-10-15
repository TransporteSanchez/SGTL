/* Habilita el ABM de tipos de comprobante para bases ya inicializadas.
   Conserva todos los tipos y comprobantes históricos existentes. */
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

IF OBJECT_ID('dbo.TIPOS_COMPROBANTE', 'U') IS NULL
    THROW 50000, 'No existe dbo.TIPOS_COMPROBANTE. Ejecutar primero 02_modelo_incremental.sql.', 1;

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.TIPOS_COMPROBANTE')
      AND name = 'CK_TIPOS_COMPROBANTE_Valores')
    ALTER TABLE dbo.TIPOS_COMPROBANTE DROP CONSTRAINT CK_TIPOS_COMPROBANTE_Valores;

ALTER TABLE dbo.TIPOS_COMPROBANTE
    ADD CONSTRAINT CK_TIPOS_COMPROBANTE_Valores
    CHECK (LEN(Tipo) BETWEEN 1 AND 3 AND Tipo NOT LIKE '%[^A-Z0-9]%' AND Impacto IN ('D','C'));

COMMIT TRANSACTION;
