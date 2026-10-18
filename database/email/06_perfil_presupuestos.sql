/* Permite asociar un perfil SMTP a Presupuestos sin modificar la asignación de Facturación. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 53050, 'Ejecutar esta migración en la base Transporte_Sanchez.', 1;
IF OBJECT_ID(N'dbo.CONFIGURACION_EMAIL_MODULO', N'U') IS NULL
    THROW 53051, 'Ejecutar primero la migración 05 de e-mail.', 1;
DECLARE @definicion nvarchar(max) = OBJECT_DEFINITION(OBJECT_ID(N'dbo.CK_CEM_Modulo'));
IF @definicion IS NULL
    THROW 53052, 'No se encontró la restricción CK_CEM_Modulo. Revisar el esquema antes de continuar.', 1;
IF @definicion NOT LIKE N'%PRESUPUESTOS%'
BEGIN
    IF REPLACE(@definicion, N' ', N'') <> N'([Modulo]=''FACTURACION'')'
        THROW 53053, 'La restricción de módulos difiere del esquema esperado. Revisar antes de continuar.', 1;
    BEGIN TRANSACTION;
    ALTER TABLE dbo.CONFIGURACION_EMAIL_MODULO DROP CONSTRAINT CK_CEM_Modulo;
    ALTER TABLE dbo.CONFIGURACION_EMAIL_MODULO WITH CHECK ADD CONSTRAINT CK_CEM_Modulo
        CHECK (Modulo IN ('FACTURACION', 'PRESUPUESTOS'));
    COMMIT TRANSACTION;
END;
