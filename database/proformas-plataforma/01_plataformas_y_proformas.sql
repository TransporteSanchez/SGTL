/* =====================================================================
   01_plataformas_y_proformas.sql
   Proforma de plataforma (Rukas) - Etapa 1: base de datos.
   Diseño: docs/negocio/PROFORMA-CLIENTES-RUKAS.md (§10) y
           docs/diseno/proforma-rukas-diseno.md (§3).

   - PLATAFORMAS: sistemas de clientes con los que se concilia la proforma.
     Se carga Rukas. Una plataforma nueva se agrega por script, con su lector.
   - CLIENTES.PlataformaID: a qué plataforma pertenece un cliente
     'Con_plataforma'. Se asigna Rukas a los que ya lo son.
   - PROFORMAS: tipo (Propia / Plataforma), N° en la plataforma, reclamo
     pendiente y factura cargada en la plataforma.
   - PROFORMA_PLATAFORMA_LINEA: líneas del archivo importado y resultado del control.
   - PROFORMA_ADJUNTO: archivo importado (y, más adelante, el PDF de la factura).

   Todo lo nuevo admite vacío o tiene default: no cambia el comportamiento de
   las proformas propias ni del código actual. Sin tocar el EDMX (SQL directo).
   Idempotente: se puede correr más de una vez.

   Ejecutar en SSMS conectado a la base Transporte_Sanchez (compartida: avisar al equipo).
   ===================================================================== */

SET NOCOUNT ON;
GO

IF DB_NAME() <> N'Transporte_Sanchez'
BEGIN
    RAISERROR('Ejecutar este script en la base Transporte_Sanchez.', 16, 1);
    SET NOEXEC ON;
END
GO

IF OBJECT_ID(N'dbo.PROFORMAS', N'U') IS NULL OR OBJECT_ID(N'dbo.CLIENTES', N'U') IS NULL
   OR COL_LENGTH('dbo.CLIENTES', 'Tipo_Cliente') IS NULL
BEGIN
    RAISERROR('Faltan PROFORMAS, CLIENTES o CLIENTES.Tipo_Cliente (script 07_clientes_tipo_y_evidencia.sql).', 16, 1);
    SET NOEXEC ON;
END
GO

/* ---------------------------------------------------------------------
   1. PLATAFORMAS
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.PLATAFORMAS', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PLATAFORMAS (
        Plataforma_ID int IDENTITY(1,1) NOT NULL CONSTRAINT PK_PLATAFORMAS PRIMARY KEY,
        Nombre        nvarchar(60)      NOT NULL CONSTRAINT UQ_PLATAFORMAS_Nombre UNIQUE,
        -- Lo usa el código para elegir el lector del archivo de la plataforma.
        Codigo        varchar(20)       NOT NULL CONSTRAINT UQ_PLATAFORMAS_Codigo UNIQUE,
        Activa        bit               NOT NULL CONSTRAINT DF_PLATAFORMAS_Activa DEFAULT (1),
        Fecha_Alta    datetime          NOT NULL CONSTRAINT DF_PLATAFORMAS_Fecha_Alta DEFAULT (GETDATE())
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.PLATAFORMAS WHERE Codigo = 'RUKAS')
    INSERT dbo.PLATAFORMAS (Nombre, Codigo) VALUES (N'Rukas', 'RUKAS');
GO

/* ---------------------------------------------------------------------
   2. CLIENTES.PlataformaID
   Sin restricción de "obligatorio si es Con_plataforma": la pantalla de
   clientes todavía no lo manda. La API lo asigna (etapa 2).
   --------------------------------------------------------------------- */
IF COL_LENGTH('dbo.CLIENTES', 'PlataformaID') IS NULL
    ALTER TABLE dbo.CLIENTES ADD PlataformaID int NULL;
GO

IF OBJECT_ID(N'dbo.FK_CLIENTES_PLATAFORMAS', N'F') IS NULL
    ALTER TABLE dbo.CLIENTES WITH CHECK ADD CONSTRAINT FK_CLIENTES_PLATAFORMAS
        FOREIGN KEY (PlataformaID) REFERENCES dbo.PLATAFORMAS (Plataforma_ID);
GO

UPDATE c
   SET PlataformaID = p.Plataforma_ID
  FROM dbo.CLIENTES c
 CROSS JOIN (SELECT Plataforma_ID FROM dbo.PLATAFORMAS WHERE Codigo = 'RUKAS') p
 WHERE c.Tipo_Cliente = 'Con_plataforma'
   AND c.PlataformaID IS NULL;
PRINT CONCAT('Clientes Con_plataforma asignados a Rukas: ', @@ROWCOUNT);
GO

/* ---------------------------------------------------------------------
   3. PROFORMAS: columnas de proforma de plataforma
   --------------------------------------------------------------------- */
IF COL_LENGTH('dbo.PROFORMAS', 'Tipo_Proforma') IS NULL
    ALTER TABLE dbo.PROFORMAS ADD Tipo_Proforma varchar(15) NOT NULL
        CONSTRAINT DF_PROFORMAS_Tipo_Proforma DEFAULT ('Propia');
GO
IF COL_LENGTH('dbo.PROFORMAS', 'PlataformaID') IS NULL
    ALTER TABLE dbo.PROFORMAS ADD PlataformaID int NULL;
GO
-- N° de la proforma en la plataforma (Rukas: sale del nombre del Excel).
IF COL_LENGTH('dbo.PROFORMAS', 'Plataforma_Numero') IS NULL
    ALTER TABLE dbo.PROFORMAS ADD Plataforma_Numero nvarchar(30) NULL;
GO
-- Reclamo pendiente en la plataforma: con la fecha vacía no hay reclamo.
-- Quién lo registró o lo cerró queda en AUDITORIA.
IF COL_LENGTH('dbo.PROFORMAS', 'Plataforma_Reclamo_Fecha') IS NULL
    ALTER TABLE dbo.PROFORMAS ADD Plataforma_Reclamo_Fecha date NULL;
GO
IF COL_LENGTH('dbo.PROFORMAS', 'Plataforma_Reclamo_Motivo') IS NULL
    ALTER TABLE dbo.PROFORMAS ADD Plataforma_Reclamo_Motivo nvarchar(500) NULL;
GO
-- Factura cargada en la plataforma (Rukas: formato A00005-00000659). Cierra la proforma.
IF COL_LENGTH('dbo.PROFORMAS', 'Plataforma_Factura_Numero') IS NULL
    ALTER TABLE dbo.PROFORMAS ADD Plataforma_Factura_Numero varchar(20) NULL;
GO
IF COL_LENGTH('dbo.PROFORMAS', 'Plataforma_Factura_Fecha') IS NULL
    ALTER TABLE dbo.PROFORMAS ADD Plataforma_Factura_Fecha date NULL;
GO
IF COL_LENGTH('dbo.PROFORMAS', 'Plataforma_Factura_Usuario') IS NULL
    ALTER TABLE dbo.PROFORMAS ADD Plataforma_Factura_Usuario varchar(20) NULL;
GO
IF COL_LENGTH('dbo.PROFORMAS', 'Plataforma_Factura_Carga') IS NULL
    ALTER TABLE dbo.PROFORMAS ADD Plataforma_Factura_Carga datetime NULL;
GO

IF OBJECT_ID(N'dbo.FK_PROFORMAS_PLATAFORMAS', N'F') IS NULL
    ALTER TABLE dbo.PROFORMAS WITH CHECK ADD CONSTRAINT FK_PROFORMAS_PLATAFORMAS
        FOREIGN KEY (PlataformaID) REFERENCES dbo.PLATAFORMAS (Plataforma_ID);
GO

-- Una proforma de plataforma siempre sabe de qué plataforma y qué N° es; una propia no tiene plataforma.
IF OBJECT_ID(N'dbo.CK_PROFORMAS_Tipo_Proforma', N'C') IS NULL
    ALTER TABLE dbo.PROFORMAS WITH CHECK ADD CONSTRAINT CK_PROFORMAS_Tipo_Proforma CHECK (
        (Tipo_Proforma = 'Propia' AND PlataformaID IS NULL)
        OR (Tipo_Proforma = 'Plataforma' AND PlataformaID IS NOT NULL AND Plataforma_Numero IS NOT NULL)
    );
GO

-- No puede haber dos proformas vigentes (borrador incluido) con el mismo N° de la misma plataforma y cliente.
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id = OBJECT_ID(N'dbo.PROFORMAS') AND name = 'UX_PROFORMAS_Plataforma_Numero')
    CREATE UNIQUE INDEX UX_PROFORMAS_Plataforma_Numero
        ON dbo.PROFORMAS (ClienteID, PlataformaID, Plataforma_Numero)
        WHERE Tipo_Proforma = 'Plataforma' AND Estado <> 'Anulada';
GO

/* ---------------------------------------------------------------------
   4. PROFORMA_PLATAFORMA_LINEA
   Se borra con la proforma (eliminar un borrador). Viaje_ID es el resultado
   del control (se recalcula): no lleva FK a VIAJES para no bloquear nada;
   la reserva real del viaje sigue en PROFORMAS_VIAJES.
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.PROFORMA_PLATAFORMA_LINEA', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PROFORMA_PLATAFORMA_LINEA (
        Linea_ID      int IDENTITY(1,1) NOT NULL CONSTRAINT PK_PROFORMA_PLATAFORMA_LINEA PRIMARY KEY,
        Proforma_ID   int               NOT NULL,
        Orden         int               NOT NULL,
        -- Lo que trae el archivo. Rukas: Referencia = N° de transporte.
        Referencia    nvarchar(30)      NOT NULL,
        Fecha         date              NULL,
        Ruta          nvarchar(150)     NULL,
        Importe_Viaje decimal(18,2)     NOT NULL,
        Adicionales   decimal(18,2)     NOT NULL CONSTRAINT DF_PPL_Adicionales DEFAULT (0),
        -- Lo que calcula el control.
        Viaje_ID      int               NULL,
        Importe_SGTL  decimal(18,2)     NULL,
        Tarifa_Usada  nvarchar(200)     NULL,
        Resultado     varchar(30)       NULL,
        Detalle       nvarchar(300)     NULL,
        CONSTRAINT FK_PPL_PROFORMAS FOREIGN KEY (Proforma_ID)
            REFERENCES dbo.PROFORMAS (Proforma_ID) ON DELETE CASCADE,
        CONSTRAINT UQ_PPL_Proforma_Orden UNIQUE (Proforma_ID, Orden)
    );
END
GO

/* ---------------------------------------------------------------------
   5. PROFORMA_ADJUNTO (mismo patrón que VIAJE_EVIDENCIA)
   Uno por tipo y proforma: 'Archivo' (el importado; se reemplaza) y,
   más adelante, 'Factura' (el PDF de la factura).
   --------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.PROFORMA_ADJUNTO', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PROFORMA_ADJUNTO (
        Adjunto_ID     int IDENTITY(1,1) NOT NULL CONSTRAINT PK_PROFORMA_ADJUNTO PRIMARY KEY,
        Proforma_ID    int               NOT NULL,
        Tipo           varchar(20)       NOT NULL,
        Nombre_Archivo nvarchar(260)     NOT NULL,
        Content_Type   nvarchar(100)     NOT NULL,
        Archivo        varbinary(max)    NOT NULL,
        Fecha_Alta     datetime          NOT NULL CONSTRAINT DF_PROFORMA_ADJUNTO_Fecha_Alta DEFAULT (GETDATE()),
        Usu_Alta       varchar(20)       NOT NULL,
        CONSTRAINT FK_PROFORMA_ADJUNTO_PROFORMAS FOREIGN KEY (Proforma_ID)
            REFERENCES dbo.PROFORMAS (Proforma_ID) ON DELETE CASCADE,
        CONSTRAINT CK_PROFORMA_ADJUNTO_Tipo CHECK (Tipo IN ('Archivo', 'Factura')),
        CONSTRAINT UQ_PROFORMA_ADJUNTO_Tipo UNIQUE (Proforma_ID, Tipo)
    );
END
GO

/* ---------------------------------------------------------------------
   Verificación (solo lectura)
   --------------------------------------------------------------------- */
SELECT Plataforma_ID, Nombre, Codigo, Activa FROM dbo.PLATAFORMAS;

SELECT c.Tipo_Cliente, p.Nombre AS Plataforma, COUNT(*) AS Clientes
  FROM dbo.CLIENTES c
  LEFT JOIN dbo.PLATAFORMAS p ON p.Plataforma_ID = c.PlataformaID
 GROUP BY c.Tipo_Cliente, p.Nombre;           -- Con_plataforma tiene que estar todo con Rukas

SELECT Tipo_Proforma, COUNT(*) AS Proformas
  FROM dbo.PROFORMAS
 GROUP BY Tipo_Proforma;                        -- todas 'Propia'

SELECT OBJECT_ID(N'dbo.PROFORMA_PLATAFORMA_LINEA') AS TablaLineas,
       OBJECT_ID(N'dbo.PROFORMA_ADJUNTO')          AS TablaAdjuntos;   -- ninguna NULL
GO

SET NOEXEC OFF;
GO
