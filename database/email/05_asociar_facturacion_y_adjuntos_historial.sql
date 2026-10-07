/*
   Asocia cada módulo funcional con el perfil SMTP (Service) que debe usar.
   No se carga una asociación automática: el administrador debe seleccionar
   explícitamente el perfil de FACTURACION desde Configuración > E-mail.

   También completa las columnas de adjunto para instalaciones que ya habían
   ejecutado la migración 04 antes de que se incorporara el envío real.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ConfirmarBaseTransporteSanchez bit = 1;
DECLARE @NombreBaseEsperada sysname = N'Transporte_Sanchez';

IF @ConfirmarBaseTransporteSanchez <> 1 OR DB_NAME() <> @NombreBaseEsperada
    THROW 53040, 'Revisar y confirmar la base Transporte_Sanchez antes de ejecutar.', 1;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 53041, 'No se permite ejecutar esta migración en una base de sistema.', 1;

IF OBJECT_ID(N'dbo.EmailServidor', N'U') IS NULL
    THROW 53042, 'No existe dbo.EmailServidor. Ejecutar primero las migraciones de e-mail.', 1;

IF OBJECT_ID(N'dbo.HISTORIAL_ENVIOS_COMPROBANTES', N'U') IS NULL
    THROW 53043, 'No existe dbo.HISTORIAL_ENVIOS_COMPROBANTES. Ejecutar primero la migración 04.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.CONFIGURACION_EMAIL_MODULO', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.CONFIGURACION_EMAIL_MODULO (
            Modulo              varchar(30) NOT NULL
                CONSTRAINT PK_CONFIGURACION_EMAIL_MODULO PRIMARY KEY,
            Service             smallint NOT NULL,
            FechaModificacion   datetime2(3) NOT NULL
                CONSTRAINT DF_CEM_FechaModificacion DEFAULT (SYSUTCDATETIME()),
            UsuarioModificacion nvarchar(100) NULL,
            CONSTRAINT FK_CEM_EmailServidor FOREIGN KEY (Service)
                REFERENCES dbo.EmailServidor ([Service]),
            CONSTRAINT CK_CEM_Modulo CHECK (Modulo IN ('FACTURACION'))
        );
    END;

    IF COL_LENGTH(N'dbo.HISTORIAL_ENVIOS_COMPROBANTES', N'NombreAdjunto') IS NULL
        ALTER TABLE dbo.HISTORIAL_ENVIOS_COMPROBANTES ADD NombreAdjunto nvarchar(255) NULL;

    IF COL_LENGTH(N'dbo.HISTORIAL_ENVIOS_COMPROBANTES', N'AdjuntoSHA256') IS NULL
        ALTER TABLE dbo.HISTORIAL_ENVIOS_COMPROBANTES ADD AdjuntoSHA256 char(64) NULL;

    COMMIT TRANSACTION;

    SELECT N'La asociación FACTURACION → Service puede configurarse desde Configuración > E-mail.' AS Resultado;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
