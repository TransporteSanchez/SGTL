/* Ejecutar después de 01. Solo esquema; no carga correos ni modifica contraseñas existentes. */
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 53100, 'Ejecutar esta migración en Transporte_Sanchez.', 1;
BEGIN TRY
BEGIN TRANSACTION;
IF COL_LENGTH(N'dbo.USUARIOS', N'Email') IS NULL
    ALTER TABLE dbo.USUARIOS ADD Email nvarchar(254) NULL;
IF COL_LENGTH(N'dbo.USUARIOS', N'VersionSesion') IS NULL
    ALTER TABLE dbo.USUARIOS ADD VersionSesion bigint NOT NULL
        CONSTRAINT DF_USUARIOS_VersionSesion DEFAULT (0) WITH VALUES;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.USUARIOS') AND name = N'UX_USUARIOS_Email')
    EXEC(N'CREATE UNIQUE INDEX UX_USUARIOS_Email ON dbo.USUARIOS(Email) WHERE Email IS NOT NULL;');
IF OBJECT_ID(N'dbo.RECUPERO_CONTRASENA', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RECUPERO_CONTRASENA (
        TokenHash char(64) NOT NULL CONSTRAINT PK_RECUPERO_CONTRASENA PRIMARY KEY,
        UsuarioID int NOT NULL,
        Email nvarchar(254) NOT NULL,
        VersionSesion bigint NOT NULL,
        ClaveHuella char(64) NOT NULL,
        CreadoUtc datetime2 NOT NULL CONSTRAINT DF_RC_Creado DEFAULT SYSUTCDATETIME(),
        VenceUtc datetime2 NOT NULL,
        UsadoUtc datetime2 NULL,
        Enviado bit NOT NULL CONSTRAINT DF_RC_Enviado DEFAULT (0),
        CONSTRAINT FK_RC_Usuario FOREIGN KEY (UsuarioID) REFERENCES dbo.USUARIOS(Usuario_ID) ON DELETE CASCADE
    );
    CREATE INDEX IX_RC_Usuario_Creado ON dbo.RECUPERO_CONTRASENA(UsuarioID, CreadoUtc);
END;
COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
