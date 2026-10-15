/* Datos complementarios del comprobante de recibo.
   Ejecutar después de 02_modelo_incremental.sql. Es seguro volver a ejecutarlo. */
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

IF COL_LENGTH('dbo.COMPROBANTES', 'Letra') IS NULL
    ALTER TABLE dbo.COMPROBANTES ADD Letra varchar(1) NULL;

IF COL_LENGTH('dbo.COMPROBANTES', 'Sucursal') IS NULL
    ALTER TABLE dbo.COMPROBANTES ADD Sucursal varchar(4) NULL;

IF COL_LENGTH('dbo.COMPROBANTES', 'NumeroComprobante') IS NULL
    ALTER TABLE dbo.COMPROBANTES ADD NumeroComprobante varchar(8) NULL;

COMMIT TRANSACTION;
