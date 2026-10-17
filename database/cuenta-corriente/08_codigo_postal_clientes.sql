/*
   Agrega el código postal al maestro de Clientes.
   Puede ejecutarse más de una vez sin sobrescribir datos existentes.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID('dbo.CLIENTES','U') IS NULL
    THROW 51050, 'No existe la tabla dbo.CLIENTES.', 1;

IF COL_LENGTH('dbo.CLIENTES','CodigoPostal') IS NULL
BEGIN
    ALTER TABLE dbo.CLIENTES ADD CodigoPostal nvarchar(20) NULL;
END;
