/*
   Refuerza la reserva de viajes por Proforma.
   Ejecutar después de 02_modelo_incremental.sql. No reconstruye vínculos
   históricos desde PROFORMA_DETALLE: sólo protege los vínculos explícitos
   que crea el backend actualizado.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

IF EXISTS (
    SELECT ViajeID
    FROM dbo.PROFORMAS_VIAJES
    GROUP BY ViajeID
    HAVING COUNT(*) > 1
)
    THROW 51040, 'Existen viajes asociados a más de una Proforma. Corregirlos antes de activar la exclusividad.', 1;

IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id=OBJECT_ID('dbo.PROFORMAS_VIAJES')
      AND name='IX_CC_PV_Viaje'
)
    DROP INDEX IX_CC_PV_Viaje ON dbo.PROFORMAS_VIAJES;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id=OBJECT_ID('dbo.PROFORMAS_VIAJES')
      AND name='UX_CC_PV_Viaje'
)
    CREATE UNIQUE INDEX UX_CC_PV_Viaje ON dbo.PROFORMAS_VIAJES (ViajeID);

COMMIT TRANSACTION;
