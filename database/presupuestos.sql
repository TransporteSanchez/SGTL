IF OBJECT_ID('dbo.PRESUPUESTOS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PRESUPUESTOS (
        Presupuesto_ID int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Datos nvarchar(max) NOT NULL,
        Estado varchar(15) NOT NULL CONSTRAINT DF_Presupuestos_Estado DEFAULT 'Pendiente',
        ViajeID int NULL,
        FechaAlta datetime NOT NULL DEFAULT GETDATE(),
        FechaModificacion datetime NOT NULL DEFAULT GETDATE(),
        CONSTRAINT CK_Presupuestos_Estado CHECK (Estado IN ('Pendiente','Aceptado','Rechazado')),
        CONSTRAINT FK_Presupuestos_Viajes FOREIGN KEY (ViajeID) REFERENCES dbo.VIAJES(Viaje_ID)
    );
    CREATE UNIQUE INDEX UX_Presupuestos_ViajeID ON dbo.PRESUPUESTOS(ViajeID) WHERE ViajeID IS NOT NULL;
END;
