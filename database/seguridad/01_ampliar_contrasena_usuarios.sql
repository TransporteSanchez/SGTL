/*
   Permite almacenar hashes PBKDF2 en lugar de contraseñas en texto plano.
   Ejecutar manualmente en un ambiente autorizado antes de desplegar la API.
*/
IF OBJECT_ID(N'dbo.USUARIOS', N'U') IS NULL
    THROW 50000, 'No existe la tabla dbo.USUARIOS.', 1;
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.USUARIOS')
      AND name = N'Contraseña'
      AND max_length < 510
)
BEGIN
    ALTER TABLE dbo.USUARIOS
        ALTER COLUMN [Contraseña] NVARCHAR(255) NOT NULL;
END
GO
