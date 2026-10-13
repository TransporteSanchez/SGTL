/*
   Crea la configuración de WhatsApp Business Cloud API (Meta) usada por
   configuracion-whatsapp.html y por el aviso al chofer al registrar viajes.
   Es una fila única (WhatsAppConfig_ID = 1); la API la crea deshabilitada y
   sin credenciales la primera vez que se abre la pantalla.

   Para ejecutarlo manualmente, confirmar explícitamente la base objetivo.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ConfirmarBaseTransporteSanchez bit = 1;
DECLARE @NombreBaseEsperada sysname = N'Transporte_Sanchez';

IF @ConfirmarBaseTransporteSanchez <> 1 OR DB_NAME() <> @NombreBaseEsperada
    THROW 54000, 'Revisar y confirmar la base Transporte_Sanchez antes de ejecutar.', 1;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 54001, 'No se permite crear WHATSAPP_CONFIG en una base de sistema.', 1;

IF OBJECT_ID(N'dbo.WHATSAPP_CONFIG', N'U') IS NOT NULL
    THROW 54002, 'La tabla dbo.WHATSAPP_CONFIG ya existe; esta migración no la reemplaza.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.WHATSAPP_CONFIG (
        WhatsAppConfig_ID           int NOT NULL
            CONSTRAINT PK_WHATSAPP_CONFIG PRIMARY KEY,
        Enabled                     bit NOT NULL
            CONSTRAINT DF_WHATSAPP_CONFIG_Enabled DEFAULT (0),
        AccessToken                 nvarchar(max) NULL,
        PhoneNumberId               nvarchar(50) NULL,
        ApiVersion                  nvarchar(20) NULL
            CONSTRAINT DF_WHATSAPP_CONFIG_ApiVersion DEFAULT (N'v21.0'),
        TemplateName                nvarchar(100) NULL
            CONSTRAINT DF_WHATSAPP_CONFIG_TemplateName DEFAULT (N'viaje_asignado'),
        TemplateLanguage            nvarchar(20) NULL
            CONSTRAINT DF_WHATSAPP_CONFIG_TemplateLanguage DEFAULT (N'es_AR'),
        DefaultCountryCode          nvarchar(10) NULL
            CONSTRAINT DF_WHATSAPP_CONFIG_DefaultCountryCode DEFAULT (N'54'),
        Fecha_Alta                  datetime NOT NULL
            CONSTRAINT DF_WHATSAPP_CONFIG_Fecha_Alta DEFAULT (GETDATE()),
        Usu_Alta                    nvarchar(50) NULL,
        Fecha_Modi                  datetime NULL,
        Usu_Modi                    nvarchar(50) NULL,
        CONSTRAINT CK_WHATSAPP_CONFIG_FilaUnica CHECK (WhatsAppConfig_ID = 1)
    );

    COMMIT TRANSACTION;

    SELECT N'Tabla dbo.WHATSAPP_CONFIG creada correctamente.' AS Resultado;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
