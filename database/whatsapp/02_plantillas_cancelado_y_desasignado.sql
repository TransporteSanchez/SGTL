/*
  Agrega los nombres de plantilla de WhatsApp para:
  - viaje cancelado / eliminado (aviso al chofer)
  - viaje desasignado (aviso al chofer anterior al cambiar el chofer)

  Idempotente. Los nombres por defecto deben coincidir con plantillas aprobadas en Meta.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID('dbo.WHATSAPP_CONFIG','U') IS NULL
    THROW 54010, 'No existe la tabla dbo.WHATSAPP_CONFIG. Ejecutá antes 01_crear_whatsapp_config.sql.', 1;

IF COL_LENGTH('dbo.WHATSAPP_CONFIG','TemplateCancelado') IS NULL
BEGIN
    ALTER TABLE dbo.WHATSAPP_CONFIG ADD TemplateCancelado nvarchar(100) NULL
        CONSTRAINT DF_WHATSAPP_CONFIG_TemplateCancelado DEFAULT (N'viaje_cancelado');
END;

IF COL_LENGTH('dbo.WHATSAPP_CONFIG','TemplateDesasignado') IS NULL
BEGIN
    ALTER TABLE dbo.WHATSAPP_CONFIG ADD TemplateDesasignado nvarchar(100) NULL
        CONSTRAINT DF_WHATSAPP_CONFIG_TemplateDesasignado DEFAULT (N'viaje_desasignado');
END;

UPDATE dbo.WHATSAPP_CONFIG
SET TemplateCancelado = ISNULL(NULLIF(LTRIM(RTRIM(TemplateCancelado)), N''), N'viaje_cancelado'),
    TemplateDesasignado = ISNULL(NULLIF(LTRIM(RTRIM(TemplateDesasignado)), N''), N'viaje_desasignado')
WHERE WhatsAppConfig_ID = 1;
