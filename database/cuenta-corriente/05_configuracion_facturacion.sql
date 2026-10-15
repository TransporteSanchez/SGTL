/* Configuración de Facturación: sucursales, numeradores y tipos de comprobante.
   Ejecutar después de 02_modelo_incremental.sql y 04_campos_comprobante_recibo.sql. */
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

IF OBJECT_ID('dbo.FACTURACION_SUCURSALES', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FACTURACION_SUCURSALES (
        Sucursal_ID int IDENTITY(1,1) NOT NULL CONSTRAINT PK_FACTURACION_SUCURSALES PRIMARY KEY,
        Codigo varchar(4) NOT NULL,
        Nombre nvarchar(100) NOT NULL,
        Activa bit NOT NULL CONSTRAINT DF_FACT_SUC_Activa DEFAULT (1),
        FechaAlta datetime2(3) NOT NULL CONSTRAINT DF_FACT_SUC_FechaAlta DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_FACTURACION_SUCURSALES_Codigo UNIQUE (Codigo),
        CONSTRAINT CK_FACTURACION_SUCURSALES_Codigo CHECK (Codigo NOT LIKE '%[^0-9]%' AND LEN(Codigo) BETWEEN 1 AND 4)
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.FACTURACION_SUCURSALES WHERE Codigo = '0001')
    INSERT dbo.FACTURACION_SUCURSALES (Codigo, Nombre, Activa) VALUES ('0001', N'Casa central', 1);

IF OBJECT_ID('dbo.FACTURACION_NUMERADORES', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FACTURACION_NUMERADORES (
        Numerador_ID int IDENTITY(1,1) NOT NULL CONSTRAINT PK_FACTURACION_NUMERADORES PRIMARY KEY,
        Nombre nvarchar(100) NOT NULL,
        UltimoNumero int NOT NULL CONSTRAINT DF_FACT_NUM_UltimoNumero DEFAULT (0),
        Activo bit NOT NULL CONSTRAINT DF_FACT_NUM_Activo DEFAULT (1),
        FechaAlta datetime2(3) NOT NULL CONSTRAINT DF_FACT_NUM_FechaAlta DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_FACTURACION_NUMERADORES_Nombre UNIQUE (Nombre),
        CONSTRAINT CK_FACTURACION_NUMERADORES_Rango CHECK (UltimoNumero BETWEEN 0 AND 99999999)
    );
END;

INSERT dbo.FACTURACION_NUMERADORES (Nombre, UltimoNumero, Activo)
SELECT N'Numerador ' + t.Tipo, n.UltimoNumero, 1
FROM dbo.TIPOS_COMPROBANTE t
JOIN dbo.COMPROBANTES_NUMERADORES n ON n.Tipo = t.Tipo
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.FACTURACION_NUMERADORES f WHERE f.Nombre = N'Numerador ' + t.Tipo);

IF OBJECT_ID('dbo.FACTURACION_TIPOS_COMPROBANTE', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FACTURACION_TIPOS_COMPROBANTE (
        Tipo varchar(3) NOT NULL CONSTRAINT PK_FACTURACION_TIPOS_COMPROBANTE PRIMARY KEY,
        LetraPredeterminada char(1) NOT NULL CONSTRAINT DF_FACT_TIPO_Letra DEFAULT ('A'),
        SucursalID int NOT NULL,
        NumeradorID int NOT NULL,
        Activo bit NOT NULL CONSTRAINT DF_FACT_TIPO_Activo DEFAULT (1),
        FechaModificacion datetime2(3) NOT NULL CONSTRAINT DF_FACT_TIPO_FechaModificacion DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_FACT_TIPO_Tipo FOREIGN KEY (Tipo) REFERENCES dbo.TIPOS_COMPROBANTE (Tipo),
        CONSTRAINT FK_FACT_TIPO_Sucursal FOREIGN KEY (SucursalID) REFERENCES dbo.FACTURACION_SUCURSALES (Sucursal_ID),
        CONSTRAINT FK_FACT_TIPO_Numerador FOREIGN KEY (NumeradorID) REFERENCES dbo.FACTURACION_NUMERADORES (Numerador_ID),
        CONSTRAINT CK_FACT_TIPO_Letra CHECK (LetraPredeterminada IN ('A','B','X'))
    );
END;

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('dbo.FACTURACION_TIPOS_COMPROBANTE') AND name = 'CK_FACT_TIPO_Letra')
    ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE DROP CONSTRAINT CK_FACT_TIPO_Letra;

ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE
    ADD CONSTRAINT CK_FACT_TIPO_Letra CHECK (LetraPredeterminada IN ('A','B','X'));

INSERT dbo.FACTURACION_TIPOS_COMPROBANTE (Tipo, LetraPredeterminada, SucursalID, NumeradorID, Activo)
SELECT t.Tipo, 'A', s.Sucursal_ID, n.Numerador_ID, 1
FROM dbo.TIPOS_COMPROBANTE t
CROSS JOIN (SELECT TOP (1) Sucursal_ID FROM dbo.FACTURACION_SUCURSALES WHERE Codigo = '0001') s
JOIN dbo.FACTURACION_NUMERADORES n ON n.Nombre = N'Numerador ' + t.Tipo
WHERE NOT EXISTS (SELECT 1 FROM dbo.FACTURACION_TIPOS_COMPROBANTE c WHERE c.Tipo = t.Tipo);

/* Los Recibos se emiten exclusivamente con letra X. */
UPDATE dbo.FACTURACION_TIPOS_COMPROBANTE
SET LetraPredeterminada = 'X', FechaModificacion = SYSUTCDATETIME()
WHERE Tipo = 'REC' AND LetraPredeterminada <> 'X';

/* Conserva una representación visible de los comprobantes históricos. */
UPDATE c
SET Letra = COALESCE(NULLIF(c.Letra, ''), cfg.LetraPredeterminada),
    Sucursal = COALESCE(NULLIF(c.Sucursal, ''), s.Codigo),
    NumeroComprobante = COALESCE(NULLIF(c.NumeroComprobante, ''), RIGHT(REPLICATE('0', 8) + CONVERT(varchar(8), c.NumeroCorrelativo), 8))
FROM dbo.COMPROBANTES c
JOIN dbo.FACTURACION_TIPOS_COMPROBANTE cfg ON cfg.Tipo = c.Tipo
JOIN dbo.FACTURACION_SUCURSALES s ON s.Sucursal_ID = cfg.SucursalID
WHERE c.NumeroCorrelativo IS NOT NULL;

COMMIT TRANSACTION;
