/* =====================================================================
   06_viajes_estado_entrega.sql
   Gestion de viajes - Fase 1 (circuito Rukas).

   - VIAJES.Estado: ciclo minimo Registrado -> Listo_para_facturar -> Facturado.
   - VIAJES.Resultado_Entrega / Fecha_Entrega: opcionales en Fase 1.

   Las columnas NO se agregan al EDMX: ViajesController y ProformasController
   las leen/escriben con SQL directo (mismo criterio que 05_modelo_Proformas.sql).
   Script idempotente: se puede ejecutar mas de una vez.
   ===================================================================== */

IF COL_LENGTH('dbo.VIAJES', 'Estado') IS NULL
    ALTER TABLE dbo.VIAJES ADD Estado NVARCHAR(30) NOT NULL
        CONSTRAINT DF_VIAJES_Estado DEFAULT ('Registrado');
GO

IF COL_LENGTH('dbo.VIAJES', 'Resultado_Entrega') IS NULL
    ALTER TABLE dbo.VIAJES ADD Resultado_Entrega NVARCHAR(20) NULL;
GO

IF COL_LENGTH('dbo.VIAJES', 'Fecha_Entrega') IS NULL
    ALTER TABLE dbo.VIAJES ADD Fecha_Entrega DATETIME NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_VIAJES_Estado')
    ALTER TABLE dbo.VIAJES ADD CONSTRAINT CK_VIAJES_Estado
        CHECK (Estado IN ('Registrado', 'Listo_para_facturar', 'Facturado'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_VIAJES_Resultado_Entrega')
    ALTER TABLE dbo.VIAJES ADD CONSTRAINT CK_VIAJES_Resultado_Entrega
        CHECK (Resultado_Entrega IS NULL OR Resultado_Entrega IN ('Completa', 'Parcial', 'Rechazo'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_VIAJES_Cliente_Estado' AND object_id = OBJECT_ID('dbo.VIAJES'))
    CREATE INDEX IX_VIAJES_Cliente_Estado ON dbo.VIAJES (ClienteID, Estado, Fecha_Inicio);
GO
