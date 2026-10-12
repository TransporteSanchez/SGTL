/*
   Actualiza instalaciones existentes para que EmailServidor.Service se asigne
   automáticamente y crea el historial inmutable de envíos de comprobantes.

   Orden de ejecución: después de 01, 02 y 03 de database/email, y después
   del modelo de cuenta corriente que crea COMPROBANTES.

   La conversión conserva el menor Es_id de cada Service existente y reasigna
   únicamente los duplicados y los nulos. Por eso los identificadores ya únicos
   permanecen sin cambios.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ConfirmarBaseTransporteSanchez bit = 1;
DECLARE @NombreBaseEsperada sysname = N'Transporte_Sanchez';

IF @ConfirmarBaseTransporteSanchez <> 1 OR DB_NAME() <> @NombreBaseEsperada
    THROW 53030, 'Revisar y confirmar la base Transporte_Sanchez antes de ejecutar.', 1;

IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 53031, 'No se permite ejecutar esta migración en una base de sistema.', 1;

IF OBJECT_ID(N'dbo.EmailServidor', N'U') IS NULL
    THROW 53032, 'No existe dbo.EmailServidor. Ejecutar primero las migraciones de e-mail.', 1;

IF OBJECT_ID(N'dbo.COMPROBANTES', N'U') IS NULL
    THROW 53033, 'No existe dbo.COMPROBANTES. Ejecutar primero el modelo de cuenta corriente.', 1;

IF OBJECT_ID(N'dbo.USUARIOS', N'U') IS NULL
    THROW 53034, 'No existe dbo.USUARIOS.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    /* Evita altas concurrentes mientras se normalizan los identificadores. */
    DECLARE @MaximoService int;
    SELECT @MaximoService = ISNULL(MAX(CONVERT(int, [Service])), 0)
    FROM dbo.EmailServidor WITH (TABLOCKX, HOLDLOCK);

    IF @MaximoService < 0 SET @MaximoService = 0;
    IF @MaximoService >= 32767
        THROW 53035, 'No quedan valores disponibles para EmailServidor.Service.', 1;

    DECLARE @CantidadAReasignar int;
    ;WITH Clasificados AS (
        SELECT Es_id, [Service],
               ROW_NUMBER() OVER (PARTITION BY [Service] ORDER BY Es_id) AS Posicion
        FROM dbo.EmailServidor
    )
    SELECT @CantidadAReasignar = COUNT(*)
    FROM Clasificados
    WHERE [Service] IS NULL OR Posicion > 1;

    IF @CantidadAReasignar IS NULL SET @CantidadAReasignar = 0;
    IF @MaximoService + @CantidadAReasignar > 32767
        THROW 53036, 'No quedan valores disponibles para normalizar EmailServidor.Service.', 1;

    ;WITH Clasificados AS (
        SELECT Es_id, [Service],
               ROW_NUMBER() OVER (PARTITION BY [Service] ORDER BY Es_id) AS Posicion
        FROM dbo.EmailServidor
    ), Reasignaciones AS (
        SELECT Es_id,
               ROW_NUMBER() OVER (ORDER BY Es_id) AS NuevoOrden
        FROM Clasificados
        WHERE [Service] IS NULL OR Posicion > 1
    )
    UPDATE servidor
       SET [Service] = CONVERT(smallint, @MaximoService + reasignacion.NuevoOrden)
    FROM dbo.EmailServidor servidor
    INNER JOIN Reasignaciones reasignacion ON reasignacion.Es_id = servidor.Es_id;

    DECLARE @SiguienteService int = @MaximoService + @CantidadAReasignar + 1;
    DECLARE @Sql nvarchar(max);

    IF OBJECT_ID(N'dbo.EmailServidorServiceSequence', N'SO') IS NULL
    BEGIN
        SET @Sql = N'CREATE SEQUENCE dbo.EmailServidorServiceSequence AS smallint START WITH ' +
                   CONVERT(nvarchar(10), @SiguienteService) +
                   N' INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 NO CYCLE;';
        EXEC (@Sql);
    END
    ELSE
    BEGIN
        SET @Sql = N'ALTER SEQUENCE dbo.EmailServidorServiceSequence RESTART WITH ' +
                   CONVERT(nvarchar(10), @SiguienteService) + N';';
        EXEC (@Sql);
    END;

    DECLARE @ConstraintDefault sysname;
    SELECT @ConstraintDefault = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.EmailServidor')
      AND c.name = N'Service';

    IF @ConstraintDefault IS NOT NULL
    BEGIN
        SET @Sql = N'ALTER TABLE dbo.EmailServidor DROP CONSTRAINT ' + QUOTENAME(@ConstraintDefault) + N';';
        EXEC (@Sql);
    END;

    ALTER TABLE dbo.EmailServidor ALTER COLUMN [Service] smallint NOT NULL;
    ALTER TABLE dbo.EmailServidor ADD CONSTRAINT DF_EmailServidor_Service
        DEFAULT (NEXT VALUE FOR dbo.EmailServidorServiceSequence) FOR [Service];

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes indice
        WHERE indice.object_id = OBJECT_ID(N'dbo.EmailServidor')
          AND indice.is_unique = 1
          AND 1 = (
              SELECT COUNT(*)
              FROM sys.index_columns columnaIndice
              WHERE columnaIndice.object_id = indice.object_id
                AND columnaIndice.index_id = indice.index_id
                AND columnaIndice.key_ordinal > 0
          )
          AND EXISTS (
              SELECT 1
              FROM sys.index_columns columnaIndice
              INNER JOIN sys.columns columna
                  ON columna.object_id = columnaIndice.object_id
                 AND columna.column_id = columnaIndice.column_id
              WHERE columnaIndice.object_id = indice.object_id
                AND columnaIndice.index_id = indice.index_id
                AND columnaIndice.key_ordinal = 1
                AND columna.name = N'Service'
          )
    )
        CREATE UNIQUE INDEX UX_EmailServidor_Service ON dbo.EmailServidor ([Service]);

    IF OBJECT_ID(N'dbo.HISTORIAL_ENVIOS_COMPROBANTES', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.HISTORIAL_ENVIOS_COMPROBANTES (
            HistorialEnvio_ID  bigint IDENTITY(1,1) NOT NULL
                CONSTRAINT PK_HISTORIAL_ENVIOS_COMPROBANTES PRIMARY KEY,
            ComprobanteID      int NOT NULL,
            EmailServidorID    smallint NOT NULL,
            Service            smallint NOT NULL,
            Remitente          nvarchar(320) NOT NULL,
            Destinatario       nvarchar(320) NOT NULL,
            Asunto             nvarchar(250) NOT NULL,
            FechaIntento       datetime2(3) NOT NULL
                CONSTRAINT DF_HEC_FechaIntento DEFAULT (SYSUTCDATETIME()),
            Estado             varchar(12) NOT NULL
                CONSTRAINT DF_HEC_Estado DEFAULT ('PENDIENTE'),
            Intento            smallint NOT NULL
                CONSTRAINT DF_HEC_Intento DEFAULT (1),
            NombreAdjunto      nvarchar(255) NULL,
            AdjuntoSHA256      char(64) NULL,
            MessageIdProveedor nvarchar(255) NULL,
            DetalleError       nvarchar(2000) NULL,
            UsuarioID          int NULL,
            CONSTRAINT FK_HEC_Comprobante FOREIGN KEY (ComprobanteID)
                REFERENCES dbo.COMPROBANTES (Comprobante_ID),
            CONSTRAINT FK_HEC_EmailServidor FOREIGN KEY (EmailServidorID)
                REFERENCES dbo.EmailServidor (Es_id),
            CONSTRAINT FK_HEC_Usuario FOREIGN KEY (UsuarioID)
                REFERENCES dbo.USUARIOS (Usuario_ID),
            CONSTRAINT CK_HEC_Estado CHECK (Estado IN ('PENDIENTE', 'ENVIADO', 'ERROR')),
            CONSTRAINT CK_HEC_Intento CHECK (Intento >= 1),
            CONSTRAINT CK_HEC_Destinatario CHECK (LEN(LTRIM(RTRIM(Destinatario))) > 0)
        );

        CREATE INDEX IX_HEC_Comprobante_Fecha
            ON dbo.HISTORIAL_ENVIOS_COMPROBANTES (ComprobanteID, FechaIntento DESC, HistorialEnvio_ID DESC);
        CREATE INDEX IX_HEC_Estado_Fecha
            ON dbo.HISTORIAL_ENVIOS_COMPROBANTES (Estado, FechaIntento);
    END;

    COMMIT TRANSACTION;

    SELECT
        N'EmailServidor.Service quedó autonumerado y dbo.HISTORIAL_ENVIOS_COMPROBANTES está disponible.' AS Resultado,
        @CantidadAReasignar AS ServicesReasignados;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
