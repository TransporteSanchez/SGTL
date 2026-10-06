/*
   La clave SMTP se protege en la aplicación antes de persistirse. La columna
   La columna original CredentialFromMailPass no es utilizada por el módulo.
   Para bases existentes, su eliminación se realiza con
   03_eliminar_clave_smtp_sin_proteccion.sql.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ConfirmarBaseTransporteSanchez bit = 1;
DECLARE @NombreBaseEsperada sysname = N'Transporte_Sanchez';

IF @ConfirmarBaseTransporteSanchez <> 1 OR DB_NAME() <> @NombreBaseEsperada
    THROW 53010, 'Revisar y confirmar la base Transporte_Sanchez antes de ejecutar.', 1;

IF OBJECT_ID(N'dbo.EmailServidor', N'U') IS NULL
    THROW 53011, 'No existe dbo.EmailServidor. Ejecutar primero 01_crear_email_servidor.sql.', 1;

IF COL_LENGTH(N'dbo.EmailServidor', N'CredentialFromMailPassProtegida') IS NOT NULL
    THROW 53012, 'La columna de secreto protegido ya existe.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    ALTER TABLE dbo.EmailServidor
        ADD CredentialFromMailPassProtegida nvarchar(512) NULL;

    COMMIT TRANSACTION;
    SELECT N'Columna CredentialFromMailPassProtegida creada correctamente.' AS Resultado;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
