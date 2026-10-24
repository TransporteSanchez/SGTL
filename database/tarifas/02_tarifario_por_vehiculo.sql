/*
   Tarifario por tipo de camión (24/10/2026): la tabla "Tarifas a agosto 2026" de la empresa.

   El precio de un viaje sale de:
     - El tipo de camión (Furgón, Balancín (3 ejes), Chasis (2 ejes) o Liviano) y el año del modelo: antes del año de
       corte o desde ese año (en la tabla de agosto 2026, "2018 o anterior" y "2019 en adelante"). Los dos datos ya
       están en CAMIONES (Tipo y AñoModelo); el tipo pasa a elegirse de una lista en Gestionar camiones.
     - Los km de ida: hasta 130 (con un valor para la 1ª vuelta del día y otro para la 2ª), más de 130 y hasta 190,
       más de 190 y hasta 250 (precio por viaje), y más de 250 ($ por km × km). Cada banda va de más del mínimo hasta
       el máximo inclusive, como las tarifas por km (decisión del 23/10).
     - Adicionales: falso flete (el camión fue a cargar y no había carga: se cobra un % del viaje) y módulos de estadía.

   Tablas nuevas:
     TARIFARIOS          una fila por versión de la tabla, vigente desde Vigente_Desde hasta la versión siguiente.
     TARIFARIO_VALORES   los valores de cada versión: una fila por antigüedad y tipo de camión (8 por versión).
   Columnas nuevas en VIAJES (fuera del EDMX: la API las usa con SQL directo):
     TarifarioID, Vuelta, Estadia_Modulos, Falso_Flete     lo que se eligió al cargar el viaje.
     Importe_Base, Tarifa_Detalle                          la tarifa sin adicionales y de dónde salió.
     Importe, Importe_Detalle                              el importe del viaje con los adicionales y su detalle.
   Desde ahora el viaje GUARDA su importe (§33 de docs/PENDIENTES-SISTEMA.md): cambiar una tarifa o el tarifario no
   cambia los viajes ya calculados. El importe se vuelve a calcular al editar un viaje cambiando lo que define su
   tarifa (tipo de tarifa, camión, km, inicio o vuelta).

   Este script no carga datos. Los valores de agosto 2026, el tipo de los camiones y el importe de los viajes que ya
   existen van en 03_cargar_tarifario_agosto_2026.sql.

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo). Es idempotente: lo que ya existe no lo
   toca. Correrlo ANTES de recompilar la API: sin estas columnas, la API nueva no puede leer ni guardar viajes.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54600, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.TARIFARIOS', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.TARIFARIOS (
            Tarifario_ID                int IDENTITY(1, 1) NOT NULL
                CONSTRAINT PK_TARIFARIOS PRIMARY KEY,
            Nombre                      nvarchar(100) NOT NULL,
            Vigente_Desde               date NOT NULL
                CONSTRAINT UQ_TARIFARIOS_Vigente_Desde UNIQUE,
            -- Modelos desde este año usan los valores "nuevos" (2019 en la tabla de agosto 2026).
            Anio_Corte                  int NOT NULL,
            -- Límites de las bandas de km (130, 190 y 250 en la tabla de agosto 2026).
            Km_Banda1                   int NOT NULL,
            Km_Banda2                   int NOT NULL,
            Km_Banda3                   int NOT NULL,
            Estadia_Modulo              decimal(18, 2) NOT NULL,
            Estadia_Horas_Modulo        int NOT NULL,
            Estadia_Desde_Horas         int NOT NULL,   -- viajes de hasta Km_Banda3 km
            Estadia_Desde_Horas_Larga   int NOT NULL,   -- viajes de más de Km_Banda3 km
            Falso_Flete_Porcentaje      decimal(5, 2) NOT NULL,
            Fecha_Alta                  datetime NOT NULL,
            Usu_Alta                    nvarchar(50) NOT NULL,
            Fecha_Modi                  datetime NOT NULL,
            Usu_Modi                    nvarchar(50) NOT NULL,
            CONSTRAINT CK_TARIFARIOS_Bandas CHECK (Km_Banda1 > 0 AND Km_Banda2 > Km_Banda1 AND Km_Banda3 > Km_Banda2),
            CONSTRAINT CK_TARIFARIOS_Falso_Flete CHECK (Falso_Flete_Porcentaje > 0 AND Falso_Flete_Porcentaje <= 100),
            CONSTRAINT CK_TARIFARIOS_Estadia CHECK (Estadia_Modulo >= 0 AND Estadia_Horas_Modulo > 0)
        );
    END;

    IF OBJECT_ID(N'dbo.TARIFARIO_VALORES', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.TARIFARIO_VALORES (
            Tarifario_ID            int NOT NULL
                CONSTRAINT FK_TARIFARIO_VALORES_TARIFARIOS REFERENCES dbo.TARIFARIOS (Tarifario_ID) ON DELETE CASCADE,
            Modelo_Nuevo            bit NOT NULL,   -- 0: modelo anterior a Anio_Corte · 1: desde Anio_Corte
            Tipo_Vehiculo           nvarchar(50) NOT NULL,
            Valor_Banda1_Vuelta1    decimal(18, 2) NOT NULL,
            Valor_Banda1_Vuelta2    decimal(18, 2) NOT NULL,
            Valor_Banda2            decimal(18, 2) NOT NULL,
            Valor_Banda3            decimal(18, 2) NOT NULL,
            Valor_Km                decimal(18, 2) NOT NULL,   -- más de Km_Banda3: $ por km
            CONSTRAINT PK_TARIFARIO_VALORES PRIMARY KEY (Tarifario_ID, Modelo_Nuevo, Tipo_Vehiculo),
            CONSTRAINT CK_TARIFARIO_VALORES_Positivos CHECK (Valor_Banda1_Vuelta1 > 0 AND Valor_Banda1_Vuelta2 > 0
                AND Valor_Banda2 > 0 AND Valor_Banda3 > 0 AND Valor_Km > 0)
        );
    END;

    IF COL_LENGTH('dbo.VIAJES', 'TarifarioID') IS NULL
        ALTER TABLE dbo.VIAJES ADD TarifarioID int NULL
            CONSTRAINT FK_VIAJES_TARIFARIOS REFERENCES dbo.TARIFARIOS (Tarifario_ID);

    -- 1 o 2: solo en viajes con tarifario de hasta Km_Banda1 km.
    IF COL_LENGTH('dbo.VIAJES', 'Vuelta') IS NULL
        ALTER TABLE dbo.VIAJES ADD Vuelta int NULL
            CONSTRAINT CK_VIAJES_Vuelta CHECK (Vuelta IN (1, 2));

    IF COL_LENGTH('dbo.VIAJES', 'Estadia_Modulos') IS NULL
        ALTER TABLE dbo.VIAJES ADD Estadia_Modulos int NOT NULL
            CONSTRAINT DF_VIAJES_Estadia_Modulos DEFAULT (0)
            CONSTRAINT CK_VIAJES_Estadia_Modulos CHECK (Estadia_Modulos BETWEEN 0 AND 99);

    IF COL_LENGTH('dbo.VIAJES', 'Falso_Flete') IS NULL
        ALTER TABLE dbo.VIAJES ADD Falso_Flete bit NOT NULL
            CONSTRAINT DF_VIAJES_Falso_Flete DEFAULT (0);

    IF COL_LENGTH('dbo.VIAJES', 'Importe_Base') IS NULL
        ALTER TABLE dbo.VIAJES ADD Importe_Base decimal(18, 2) NULL;

    IF COL_LENGTH('dbo.VIAJES', 'Tarifa_Detalle') IS NULL
        ALTER TABLE dbo.VIAJES ADD Tarifa_Detalle nvarchar(300) NULL;

    IF COL_LENGTH('dbo.VIAJES', 'Importe') IS NULL
        ALTER TABLE dbo.VIAJES ADD Importe decimal(18, 2) NULL;

    IF COL_LENGTH('dbo.VIAJES', 'Importe_Detalle') IS NULL
        ALTER TABLE dbo.VIAJES ADD Importe_Detalle nvarchar(500) NULL;

    COMMIT TRANSACTION;

    -- Verificación: las dos tablas y las ocho columnas (todo "OK").
    SELECT N'TARIFARIOS' AS Objeto, CASE WHEN OBJECT_ID(N'dbo.TARIFARIOS', N'U') IS NOT NULL THEN N'OK' ELSE N'FALTA' END AS Estado
    UNION ALL SELECT N'TARIFARIO_VALORES', CASE WHEN OBJECT_ID(N'dbo.TARIFARIO_VALORES', N'U') IS NOT NULL THEN N'OK' ELSE N'FALTA' END
    UNION ALL SELECT N'VIAJES.' + c.Columna, CASE WHEN COL_LENGTH('dbo.VIAJES', c.Columna) IS NOT NULL THEN N'OK' ELSE N'FALTA' END
    FROM (VALUES (N'TarifarioID'), (N'Vuelta'), (N'Estadia_Modulos'), (N'Falso_Flete'), (N'Importe_Base'),
                 (N'Tarifa_Detalle'), (N'Importe'), (N'Importe_Detalle')) c (Columna);
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
