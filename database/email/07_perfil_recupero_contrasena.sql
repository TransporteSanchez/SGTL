/* Después de 06. El administrador registra un perfil nuevo y lo asigna desde Gestionar e-mail.
   No copia credenciales ni asignaciones de otros módulos. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 53110, 'Ejecutar esta migración en Transporte_Sanchez.', 1;
IF OBJECT_ID(N'dbo.CONFIGURACION_EMAIL_MODULO', N'U') IS NULL
    THROW 53111, 'Ejecutar primero las migraciones de e-mail hasta 06.', 1;
BEGIN TRY
BEGIN TRANSACTION;
IF COL_LENGTH(N'dbo.CONFIGURACION_EMAIL_MODULO', N'UrlLogin') IS NULL
    ALTER TABLE dbo.CONFIGURACION_EMAIL_MODULO ADD UrlLogin nvarchar(1024) NULL;
IF OBJECT_ID(N'dbo.CK_CEM_Modulo', N'C') IS NOT NULL
    ALTER TABLE dbo.CONFIGURACION_EMAIL_MODULO DROP CONSTRAINT CK_CEM_Modulo;
ALTER TABLE dbo.CONFIGURACION_EMAIL_MODULO WITH CHECK ADD CONSTRAINT CK_CEM_Modulo
    CHECK (Modulo IN ('FACTURACION', 'PRESUPUESTOS', 'RECUPERO_CONTRASENA'));
EXEC(N'CREATE OR ALTER TRIGGER dbo.TR_CEM_RecuperoExclusivo ON dbo.CONFIGURACION_EMAIL_MODULO
AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM dbo.CONFIGURACION_EMAIL_MODULO r WITH (UPDLOCK, HOLDLOCK)
        JOIN dbo.CONFIGURACION_EMAIL_MODULO o WITH (UPDLOCK, HOLDLOCK)
          ON o.[Service] = r.[Service] AND o.Modulo <> r.Modulo
        WHERE r.Modulo = ''RECUPERO_CONTRASENA''
    ) THROW 53112, ''El perfil de recupero de contraseña debe ser exclusivo.'', 1;
END;');
COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
