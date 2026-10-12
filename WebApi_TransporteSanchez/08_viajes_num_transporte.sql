/* =====================================================================
   08_viajes_num_transporte.sql
   Gestion de viajes - N° de transporte SAP (clientes con plataforma).
   Requiere 06_viajes_estado_entrega.sql y 07_clientes_tipo_y_evidencia.sql.

   - VIAJES.Num_Transporte: numero que Marfrig/SAP asigna al viaje del camion
     (aparece en Rukas al pasar a Despachados). Es la referencia con la que
     Marfrig identifica el viaje en Rukas y en su proforma.
     Opcional al crear el viaje; obligatorio para pasar a Listo_para_facturar.

   Fuera del EDMX: se accede por SQL directo. Script idempotente.
   ===================================================================== */

IF COL_LENGTH('dbo.VIAJES', 'Num_Transporte') IS NULL
    ALTER TABLE dbo.VIAJES ADD Num_Transporte NVARCHAR(20) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_VIAJES_Num_Transporte' AND object_id = OBJECT_ID('dbo.VIAJES'))
    CREATE INDEX IX_VIAJES_Num_Transporte ON dbo.VIAJES (Num_Transporte);
GO
