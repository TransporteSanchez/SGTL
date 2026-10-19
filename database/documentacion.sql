-- Ejecutar en la base de datos SGTL antes de habilitar el módulo.
-- Los PDF se almacenan en binario; el manual tiene un único registro vigente.
-- Si existe la tabla con el nombre anterior, revisar sus datos antes de migrarla.
IF OBJECT_ID(N'dbo.ManualUsuario', N'U') IS NOT NULL
    THROW 50001, 'Existe dbo.ManualUsuario con el nombre anterior. Revisar la migración a dbo.MANUAL_USUARIO antes de continuar.', 1;

IF OBJECT_ID(N'dbo.MANUAL_USUARIO', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MANUAL_USUARIO (
        ManualUsuario_ID tinyint NOT NULL CONSTRAINT PK_ManualUsuario PRIMARY KEY,
        Pdf varbinary(max) NOT NULL,
        FechaPublicacion datetime2 NOT NULL,
        UsuarioPublicacion nvarchar(256) NOT NULL,
        CONSTRAINT CK_ManualUsuario_Unico CHECK (ManualUsuario_ID = 1),
        CONSTRAINT CK_ManualUsuario_Tamano CHECK (DATALENGTH(Pdf) BETWEEN 5 AND 10485760)
    );
END;

IF OBJECT_ID(N'dbo.VERSIONES', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VERSIONES (
        Version_ID int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Versiones PRIMARY KEY,
        NumeroVersion nvarchar(50) NOT NULL CONSTRAINT UQ_Versiones_Numero UNIQUE,
        FechaVersion date NOT NULL,
        Pdf varbinary(max) NOT NULL,
        FechaPublicacion datetime2 NOT NULL,
        UsuarioPublicacion nvarchar(256) NOT NULL,
        CONSTRAINT CK_Versiones_Tamano CHECK (DATALENGTH(Pdf) BETWEEN 5 AND 10485760)
    );
END;
