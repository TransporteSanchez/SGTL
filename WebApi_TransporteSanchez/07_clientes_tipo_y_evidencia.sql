/* =====================================================================
   07_clientes_tipo_y_evidencia.sql
   Gestion de viajes - Fase 2 (clientes directos, sin plataforma intermedia).
   Requiere 06_viajes_estado_entrega.sql.

   - CLIENTES.Tipo_Cliente: 'Con_plataforma' (ej. Quickfood/Marfrig con Rukas) | 'Directo'.
   - VIAJES.Estado suma En_viaje y Entregado (flujo de clientes directos):
       Con_plataforma: Registrado -> Listo_para_facturar -> Facturado
       Directo:        Registrado -> En_viaje -> Entregado -> Facturado
   - VIAJE_EVIDENCIA: adjunto (foto/PDF) de la entrega, uno por viaje.

   Fuera del EDMX: se accede por SQL directo. Script idempotente.
   ===================================================================== */

IF COL_LENGTH('dbo.CLIENTES', 'Tipo_Cliente') IS NULL
    ALTER TABLE dbo.CLIENTES ADD Tipo_Cliente NVARCHAR(20) NOT NULL
        CONSTRAINT DF_CLIENTES_Tipo_Cliente DEFAULT ('Directo');
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_CLIENTES_Tipo_Cliente')
    ALTER TABLE dbo.CLIENTES ADD CONSTRAINT CK_CLIENTES_Tipo_Cliente
        CHECK (Tipo_Cliente IN ('Con_plataforma', 'Directo'));
GO

-- Clientes que hoy operan con Rukas. Revisar desde "Gestionar clientes" si hay otros.
UPDATE dbo.CLIENTES
   SET Tipo_Cliente = 'Con_plataforma'
 WHERE Tipo_Cliente <> 'Con_plataforma'
   AND (Razon_Social LIKE '%QUICKFOOD%' OR Razon_Social LIKE '%QUICK FOOD%' OR Razon_Social LIKE '%MARFRIG%');
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_VIAJES_Estado')
    ALTER TABLE dbo.VIAJES DROP CONSTRAINT CK_VIAJES_Estado;
GO

ALTER TABLE dbo.VIAJES ADD CONSTRAINT CK_VIAJES_Estado
    CHECK (Estado IN ('Registrado', 'En_viaje', 'Entregado', 'Listo_para_facturar', 'Facturado'));
GO

IF OBJECT_ID('dbo.VIAJE_EVIDENCIA', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.VIAJE_EVIDENCIA (
        Viaje_ID       INT            NOT NULL CONSTRAINT PK_VIAJE_EVIDENCIA PRIMARY KEY,
        Nombre_Archivo NVARCHAR(260)  NOT NULL,
        Content_Type   NVARCHAR(100)  NOT NULL,
        Archivo        VARBINARY(MAX) NOT NULL,
        Fecha_Alta     DATETIME       NOT NULL CONSTRAINT DF_VIAJE_EVIDENCIA_Fecha_Alta DEFAULT (GETDATE()),
        Usu_Alta       VARCHAR(20)    NOT NULL,
        CONSTRAINT FK_VIAJE_EVIDENCIA_VIAJES FOREIGN KEY (Viaje_ID)
            REFERENCES dbo.VIAJES (Viaje_ID) ON DELETE CASCADE
    );
END
GO
