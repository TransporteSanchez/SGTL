/*
   Crea la configuración de servidores SMTP y la plantilla predeterminada
   de cada servicio. No inserta credenciales ni datos iniciales.

   Para ejecutarlo manualmente, confirmar explícitamente la base objetivo.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ConfirmarBaseTransporteSanchez bit = 1;
DECLARE @NombreBaseEsperada sysname = N'Transporte_Sanchez';

IF @ConfirmarBaseTransporteSanchez <> 1 OR DB_NAME() <> @NombreBaseEsperada
    THROW 53000, 'Revisar y confirmar la base Transporte_Sanchez antes de ejecutar.', 1;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 53001, 'No se permite crear EmailServidor en una base de sistema.', 1;

IF OBJECT_ID(N'dbo.EmailServidor', N'U') IS NOT NULL
    THROW 53002, 'La tabla dbo.EmailServidor ya existe; esta migración no la reemplaza.', 1;

IF OBJECT_ID(N'dbo.EmailServidorServiceSequence', N'SO') IS NOT NULL
    THROW 53003, 'La secuencia dbo.EmailServidorServiceSequence ya existe; revisar la instalación antes de continuar.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    /*
       Service identifica en forma estable cada perfil de correo.  Se usa una
       secuencia en vez de IDENTITY para que también pueda ser incorporada de
       manera segura a instalaciones que ya tienen la tabla creada.
    */
    CREATE SEQUENCE dbo.EmailServidorServiceSequence
        AS smallint
        START WITH 1
        INCREMENT BY 1
        MINVALUE 1
        MAXVALUE 32767
        NO CYCLE;

    CREATE TABLE dbo.EmailServidor (
        Es_id                       smallint IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_EmailServidor PRIMARY KEY,
        SmtpHost                    varchar(100) NULL,
        SmtpPort                    int NULL,
        UsaSsl                      bit NULL,
        CredentialFromMailAddres    varchar(100) NULL,
        [Name]                      varchar(100) NULL,
        [Service]                   smallint NOT NULL
            CONSTRAINT DF_EmailServidor_Service DEFAULT (NEXT VALUE FOR dbo.EmailServidorServiceSequence),
        ApiKey                      varchar(1000) NULL,
        SecureSocketOption          smallint NULL,
        UsaTLS12                    bit NULL,
        NombreRemitente             nvarchar(150) NULL,
        Asunto                      nvarchar(250) NULL,
        CuerpoHtml                  nvarchar(max) NULL,
        CONSTRAINT CK_EmailServidor_SmtpPort
            CHECK (SmtpPort IS NULL OR SmtpPort BETWEEN 1 AND 65535),
        CONSTRAINT CK_EmailServidor_SecureSocketOption
            CHECK (SecureSocketOption IS NULL OR SecureSocketOption BETWEEN 0 AND 4),
        CONSTRAINT UQ_EmailServidor_Service UNIQUE ([Service])
    );

    COMMIT TRANSACTION;

    SELECT N'Tabla dbo.EmailServidor creada correctamente.' AS Resultado;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
