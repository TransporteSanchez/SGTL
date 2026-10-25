/*
   Cambios de una tabla de tarifas y lo que queda para revisar (§33 de docs/PENDIENTES-SISTEMA.md, decisión de Rocío del
   25/10/2026).

   Al editar una tabla de tarifas (corregir un error) o registrar una nueva, la API recalcula lo que el cliente todavía no
   vio (viajes sin proforma o en un borrador, presupuestos pendientes) y deja para revisar lo que ya vio:
     - un presupuesto pendiente recalculado: hay que reenviárselo (se resuelve solo al enviarlo por e-mail);
     - un viaje en una proforma generada o aceptada: hay que anularla y generarla de nuevo (se resuelve solo al anularla);
     - un viaje que ya está en un comprobante: corresponde una nota de crédito o de débito (se marca como resuelto a mano).

   Tablas nuevas (fuera del EDMX: la API las usa con SQL directo):
     TARIFARIO_CAMBIOS   un registro por cada vez que se guardó una tabla y algo cambió: qué tabla, quién, cuándo y el
                         motivo (obligatorio en la pantalla), y cuántos viajes y presupuestos se recalcularon.
     TARIFARIO_REVISAR   lo que quedó para revisar de cada cambio, con el importe anterior y el nuevo, y cuándo, quién y
                         cómo se resolvió. Sin claves foráneas a los documentos: un borrador o un presupuesto se pueden
                         eliminar igual.

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo). Es idempotente: lo que ya existe no lo
   toca. Correrlo ANTES de recompilar la API: sin estas tablas, guardar una tabla de tarifas que cambia importes falla.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54650, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

IF OBJECT_ID(N'dbo.TARIFARIOS', N'U') IS NULL
    THROW 54651, 'Primero correr database/tarifas/02_tarifario_por_vehiculo.sql.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.TARIFARIO_CAMBIOS', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.TARIFARIO_CAMBIOS (
            Cambio_ID                   int IDENTITY(1, 1) NOT NULL
                CONSTRAINT PK_TARIFARIO_CAMBIOS PRIMARY KEY,
            -- Sin clave foránea: el nombre queda copiado por si después se elimina la tabla.
            Tarifario_ID                int NOT NULL,
            Tabla                       nvarchar(100) NOT NULL,
            Tipo                        nvarchar(20) NOT NULL
                CONSTRAINT CK_TARIFARIO_CAMBIOS_Tipo CHECK (Tipo IN (N'Corrección', N'Tabla nueva')),
            Motivo                      nvarchar(500) NOT NULL,
            Fecha                       datetime NOT NULL,
            Usuario                     nvarchar(50) NOT NULL,
            Viajes_Recalculados         int NOT NULL
                CONSTRAINT DF_TARIFARIO_CAMBIOS_Viajes DEFAULT (0),
            Presupuestos_Recalculados   int NOT NULL
                CONSTRAINT DF_TARIFARIO_CAMBIOS_Presupuestos DEFAULT (0)
        );
        CREATE INDEX IX_TARIFARIO_CAMBIOS_Tarifario ON dbo.TARIFARIO_CAMBIOS (Tarifario_ID);
    END;

    IF OBJECT_ID(N'dbo.TARIFARIO_REVISAR', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.TARIFARIO_REVISAR (
            Revisar_ID          int IDENTITY(1, 1) NOT NULL
                CONSTRAINT PK_TARIFARIO_REVISAR PRIMARY KEY,
            Cambio_ID           int NOT NULL
                CONSTRAINT FK_TARIFARIO_REVISAR_CAMBIOS REFERENCES dbo.TARIFARIO_CAMBIOS (Cambio_ID) ON DELETE CASCADE,
            -- Presupuesto: reenviarlo · Proforma: anularla y generarla de nuevo · Comprobante: nota de crédito o de débito.
            Tipo                nvarchar(20) NOT NULL
                CONSTRAINT CK_TARIFARIO_REVISAR_Tipo CHECK (Tipo IN (N'Presupuesto', N'Proforma', N'Comprobante')),
            Presupuesto_ID      int NULL,
            Viaje_ID            int NULL,
            Proforma_ID         int NULL,
            Comprobante_ID      int NULL,
            ClienteID           int NULL,
            -- Cómo se veía el documento al guardar el cambio ("PF-00000006", "FAC-00000006", "Presupuesto #12").
            Documento           nvarchar(30) NULL,
            Importe_Anterior    decimal(18, 2) NULL,
            Importe_Nuevo       decimal(18, 2) NULL,
            Resuelto_Fecha      datetime NULL,
            Resuelto_Usuario    nvarchar(50) NULL,
            Resuelto_Como       nvarchar(300) NULL
        );
        CREATE INDEX IX_TARIFARIO_REVISAR_Presupuesto ON dbo.TARIFARIO_REVISAR (Presupuesto_ID) WHERE Presupuesto_ID IS NOT NULL;
        CREATE INDEX IX_TARIFARIO_REVISAR_Proforma ON dbo.TARIFARIO_REVISAR (Proforma_ID) WHERE Proforma_ID IS NOT NULL;
        CREATE INDEX IX_TARIFARIO_REVISAR_Viaje ON dbo.TARIFARIO_REVISAR (Viaje_ID) WHERE Viaje_ID IS NOT NULL;
    END;

    COMMIT TRANSACTION;

    -- Verificación: las dos tablas (todo "OK").
    SELECT N'TARIFARIO_CAMBIOS' AS Objeto, CASE WHEN OBJECT_ID(N'dbo.TARIFARIO_CAMBIOS', N'U') IS NOT NULL THEN N'OK' ELSE N'FALTA' END AS Estado
    UNION ALL SELECT N'TARIFARIO_REVISAR', CASE WHEN OBJECT_ID(N'dbo.TARIFARIO_REVISAR', N'U') IS NOT NULL THEN N'OK' ELSE N'FALTA' END;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
