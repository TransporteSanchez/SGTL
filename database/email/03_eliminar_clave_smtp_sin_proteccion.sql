/*
   Elimina la columna histórica que podía conservar la clave SMTP en claro.
   El módulo de E-mail persiste la contraseña solamente cifrada en
   CredentialFromMailPassProtegida.

   Este cambio es irreversible: cualquier clave histórica almacenada en la
   columna eliminada dejará de estar disponible.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ConfirmarBaseTransporteSanchez bit = 1;
DECLARE @ConfirmarEliminarClaveSinProteccion bit = 1;
DECLARE @NombreBaseEsperada sysname = N'Transporte_Sanchez';

IF @ConfirmarBaseTransporteSanchez <> 1 OR DB_NAME() <> @NombreBaseEsperada
    THROW 53020, 'Revisar y confirmar la base Transporte_Sanchez antes de ejecutar.', 1;

IF @ConfirmarEliminarClaveSinProteccion <> 1
    THROW 53021, 'Confirmar explícitamente la eliminación de CredentialFromMailPass.', 1;

IF OBJECT_ID(N'dbo.EmailServidor', N'U') IS NULL
    THROW 53022, 'No existe dbo.EmailServidor.', 1;

IF COL_LENGTH(N'dbo.EmailServidor', N'CredentialFromMailPassProtegida') IS NULL
    THROW 53023, 'No existe la columna CredentialFromMailPassProtegida.', 1;

IF COL_LENGTH(N'dbo.EmailServidor', N'CredentialFromMailPass') IS NULL
BEGIN
    SELECT N'CredentialFromMailPass ya no existe; no se requieren cambios.' AS Resultado;
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    ALTER TABLE dbo.EmailServidor
        DROP COLUMN CredentialFromMailPass;

    COMMIT TRANSACTION;
    SELECT N'Columna CredentialFromMailPass eliminada correctamente.' AS Resultado;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
