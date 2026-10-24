/*
   Control interno de los viajes (24/10/2026, pedido de Rocío): recorrido completo, kilometraje de los camiones,
   combustible estimado y los gastos que rinde el chofer.

   El viaje real empieza y termina en el galpón: galpón → origen (vacío, a buscar la carga) → destino (cargado) →
   galpón (vacío). El tramo galpón → origen depende solo del origen y destino → galpón solo del destino, así que se
   guardan una vez por origen y por destino (Km_Galpon) y no viaje por viaje. Los calcula el navegador con Google Maps
   (la clave de Google es del navegador) la primera vez que hacen falta, y se borran para volver a calcularse si cambia
   el galpón.

   Qué crea (todo nuevo o columnas que admiten vacío; no cambia datos):
     GALPON                  de dónde salen y adónde vuelven los camiones (una fila; Gestionar empresa → Galpón).
     ORIGEN.Km_Galpon        km del galpón al origen.
     DESTINO.Km_Galpon       km del destino al galpón.
     CAMIONES.Km_Inicial, Fecha_Km_Inicial, Consumo_L_100km
                             el kilometraje del tablero un día dado y el consumo (Gestionar camiones). El kilometraje
                             de hoy es el inicial más el recorrido completo de cada viaje entregado desde esa fecha.
     PRECIOS_GASOIL          el precio del litro con su fecha desde (Gestionar camiones): cada viaje usa el de su fecha.
     VIAJE_GASTOS            lo que rinde el chofer desde la hoja de ruta (combustible, peaje, comida u otro) con la
                             foto del ticket.
   Fuera del EDMX: la API las usa con SQL directo (CostosController y HojaDeRutaController).

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo):
     1. Ejecutar tal cual (@Aplicar = 0): dice qué falta, no cambia nada.
     2. Poner @Aplicar = 1 y ejecutar de nuevo.
   Es idempotente: lo que ya existe no lo toca.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = aplicar

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54700, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;
IF OBJECT_ID(N'dbo.ORIGEN', N'U') IS NULL OR OBJECT_ID(N'dbo.DESTINO', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAMIONES', N'U') IS NULL OR OBJECT_ID(N'dbo.VIAJES', N'U') IS NULL
    THROW 54701, 'Faltan las tablas ORIGEN, DESTINO, CAMIONES o VIAJES.', 1;

PRINT '--- Qué falta';
SELECT Objeto, CASE WHEN Existe = 1 THEN 'Ya está' ELSE 'Falta' END AS Estado
FROM (VALUES
    (N'GALPON',                    CASE WHEN OBJECT_ID(N'dbo.GALPON', N'U') IS NULL THEN 0 ELSE 1 END),
    (N'ORIGEN.Km_Galpon',          CASE WHEN COL_LENGTH('dbo.ORIGEN', 'Km_Galpon') IS NULL THEN 0 ELSE 1 END),
    (N'DESTINO.Km_Galpon',         CASE WHEN COL_LENGTH('dbo.DESTINO', 'Km_Galpon') IS NULL THEN 0 ELSE 1 END),
    (N'CAMIONES.Km_Inicial',       CASE WHEN COL_LENGTH('dbo.CAMIONES', 'Km_Inicial') IS NULL THEN 0 ELSE 1 END),
    (N'CAMIONES.Fecha_Km_Inicial', CASE WHEN COL_LENGTH('dbo.CAMIONES', 'Fecha_Km_Inicial') IS NULL THEN 0 ELSE 1 END),
    (N'CAMIONES.Consumo_L_100km',  CASE WHEN COL_LENGTH('dbo.CAMIONES', 'Consumo_L_100km') IS NULL THEN 0 ELSE 1 END),
    (N'PRECIOS_GASOIL',            CASE WHEN OBJECT_ID(N'dbo.PRECIOS_GASOIL', N'U') IS NULL THEN 0 ELSE 1 END),
    (N'VIAJE_GASTOS',              CASE WHEN OBJECT_ID(N'dbo.VIAJE_GASTOS', N'U') IS NULL THEN 0 ELSE 1 END)
) AS t (Objeto, Existe);

IF @Aplicar = 0
BEGIN
    PRINT '';
    PRINT 'Solo diagnóstico: no se cambió nada. Si está bien, poner @Aplicar = 1 y volver a ejecutar.';
    RETURN;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.GALPON', N'U') IS NULL
        CREATE TABLE dbo.GALPON (
            Galpon_ID   int IDENTITY(1, 1) NOT NULL CONSTRAINT PK_GALPON PRIMARY KEY,
            ProvID      int NOT NULL CONSTRAINT FK_GALPON_PROVINCIAS REFERENCES dbo.PROVINCIAS (Prov_ID),
            LocID       int NOT NULL CONSTRAINT FK_GALPON_LOCALIDADES REFERENCES dbo.LOCALIDADES (Loc_ID),
            Calle       nvarchar(100) NOT NULL,
            AlturaCalle nvarchar(10) NULL,
            Fecha_Modi  datetime NOT NULL,
            Usu_Modi    nvarchar(50) NOT NULL
        );

    IF COL_LENGTH('dbo.ORIGEN', 'Km_Galpon') IS NULL
        ALTER TABLE dbo.ORIGEN ADD Km_Galpon decimal(9, 1) NULL;
    IF COL_LENGTH('dbo.DESTINO', 'Km_Galpon') IS NULL
        ALTER TABLE dbo.DESTINO ADD Km_Galpon decimal(9, 1) NULL;

    IF COL_LENGTH('dbo.CAMIONES', 'Km_Inicial') IS NULL
        ALTER TABLE dbo.CAMIONES ADD Km_Inicial int NULL;
    IF COL_LENGTH('dbo.CAMIONES', 'Fecha_Km_Inicial') IS NULL
        ALTER TABLE dbo.CAMIONES ADD Fecha_Km_Inicial date NULL;
    IF COL_LENGTH('dbo.CAMIONES', 'Consumo_L_100km') IS NULL
        ALTER TABLE dbo.CAMIONES ADD Consumo_L_100km decimal(5, 1) NULL;

    IF OBJECT_ID(N'dbo.PRECIOS_GASOIL', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.PRECIOS_GASOIL (
            Precio_ID     int IDENTITY(1, 1) NOT NULL CONSTRAINT PK_PRECIOS_GASOIL PRIMARY KEY,
            Vigente_Desde date NOT NULL,
            Precio_Litro  decimal(12, 2) NOT NULL CONSTRAINT CK_PRECIOS_GASOIL_Precio CHECK (Precio_Litro > 0),
            Fecha_Alta    datetime NOT NULL,
            Usu_Alta      nvarchar(50) NOT NULL
        );
        CREATE INDEX IX_PRECIOS_GASOIL_Vigente ON dbo.PRECIOS_GASOIL (Vigente_Desde DESC, Precio_ID DESC);
    END;

    IF OBJECT_ID(N'dbo.VIAJE_GASTOS', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.VIAJE_GASTOS (
            Gasto_ID       int IDENTITY(1, 1) NOT NULL CONSTRAINT PK_VIAJE_GASTOS PRIMARY KEY,
            Viaje_ID       int NOT NULL CONSTRAINT FK_VIAJE_GASTOS_VIAJES REFERENCES dbo.VIAJES (Viaje_ID),
            Tipo           varchar(15) NOT NULL
                CONSTRAINT CK_VIAJE_GASTOS_Tipo CHECK (Tipo IN ('Combustible', 'Peaje', 'Comida', 'Otro')),
            Fecha          date NOT NULL,
            Importe        decimal(12, 2) NOT NULL CONSTRAINT CK_VIAJE_GASTOS_Importe CHECK (Importe > 0),
            Litros         decimal(8, 2) NULL,
            Detalle        nvarchar(200) NULL,
            Nombre_Archivo nvarchar(260) NOT NULL,
            Content_Type   varchar(50) NOT NULL,
            Archivo        varbinary(max) NOT NULL,
            Fecha_Alta     datetime NOT NULL,
            Usu_Alta       nvarchar(50) NOT NULL
        );
        CREATE INDEX IX_VIAJE_GASTOS_Viaje ON dbo.VIAJE_GASTOS (Viaje_ID);
    END;

    COMMIT TRANSACTION;
    PRINT 'Listo: galpón, km al galpón, kilometraje y consumo de los camiones, precios del gasoil y gastos de los viajes.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
