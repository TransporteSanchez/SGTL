/*
   Cambiar el galpón: cada viaje sale de un galpón (27/10/2026, punto 28 de la §41 de docs/PENDIENTES-SISTEMA.md; maqueta
   .claude/maquetas/galpon/cambiar-galpon.html, variante A elegida por Rocío).

   Hasta ahora había un solo galpón y, si cambiaba la dirección, se recalculaba el recorrido de todos los viajes (también
   el de los que ya salieron). Desde ahora un galpón nuevo se usa desde una fecha: cada viaje sale del galpón vigente el
   día de su inicio, salvo que se haya elegido otro al cambiar el galpón (VIAJES.GalponID). Los que ya salieron conservan
   el suyo. Los km al galpón se guardan por galpón (GALPON_KM), así cada viaje usa los del suyo.

   Qué hace (no borra nada):
     GALPON.Vigente_Desde   desde qué día se usa; vacío en el que ya está (desde el principio).
     GALPON_KM              km del galpón a cada origen y de cada destino al galpón, por galpón. Se copian los que ya
                            están calculados (ORIGEN.Km_Galpon y DESTINO.Km_Galpon, del script 01) para el galpón de hoy.
                            Esas dos columnas quedan sin uso.
     VIAJES.GalponID        el galpón del viaje cuando no es el de su fecha (se elige al cambiar el galpón); vacío = el
                            vigente el día de su inicio.
   Fuera del EDMX: la API las usa con SQL directo (CostosController y HojaDeRutaController).

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo). Va después del 01 y ANTES de recompilar la API:
     1. Ejecutar tal cual (@Aplicar = 0): dice qué falta, no cambia nada.
     2. Poner @Aplicar = 1 y ejecutar de nuevo. Al final, la verificación tiene que decir "OK" en todo.
   Es idempotente: lo que ya existe no lo toca.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = aplicar

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54710, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;
IF OBJECT_ID(N'dbo.GALPON', N'U') IS NULL OR COL_LENGTH('dbo.ORIGEN', 'Km_Galpon') IS NULL
    THROW 54711, 'Primero correr database/costos/01_galpon_kilometraje_y_gastos.sql.', 1;

PRINT '--- Qué falta';
SELECT Objeto, CASE WHEN Existe = 1 THEN 'Ya está' ELSE 'Falta' END AS Estado
FROM (VALUES
    (N'GALPON.Vigente_Desde', CASE WHEN COL_LENGTH('dbo.GALPON', 'Vigente_Desde') IS NULL THEN 0 ELSE 1 END),
    (N'GALPON_KM',            CASE WHEN OBJECT_ID(N'dbo.GALPON_KM', N'U') IS NULL THEN 0 ELSE 1 END),
    (N'VIAJES.GalponID',      CASE WHEN COL_LENGTH('dbo.VIAJES', 'GalponID') IS NULL THEN 0 ELSE 1 END)
) AS t (Objeto, Existe);
SELECT N'Galpones cargados' AS Que, COUNT(*) AS Cantidad FROM dbo.GALPON
UNION ALL SELECT N'Orígenes con km al galpón', COUNT(*) FROM dbo.ORIGEN WHERE Km_Galpon IS NOT NULL
UNION ALL SELECT N'Destinos con km al galpón', COUNT(*) FROM dbo.DESTINO WHERE Km_Galpon IS NOT NULL;

IF @Aplicar = 0
BEGIN
    PRINT '';
    PRINT 'Solo diagnóstico: no se cambió nada. Si está bien, poner @Aplicar = 1 y volver a ejecutar.';
    RETURN;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH('dbo.GALPON', 'Vigente_Desde') IS NULL
        ALTER TABLE dbo.GALPON ADD Vigente_Desde date NULL;

    IF OBJECT_ID(N'dbo.GALPON_KM', N'U') IS NULL
        CREATE TABLE dbo.GALPON_KM (
            Galpon_ID int NOT NULL CONSTRAINT FK_GALPON_KM_GALPON REFERENCES dbo.GALPON (Galpon_ID),
            Tipo      varchar(10) NOT NULL CONSTRAINT CK_GALPON_KM_Tipo CHECK (Tipo IN ('Origen', 'Destino')),
            Lugar_ID  int NOT NULL,
            Km        decimal(9, 1) NOT NULL CONSTRAINT CK_GALPON_KM_Km CHECK (Km >= 0),
            CONSTRAINT PK_GALPON_KM PRIMARY KEY (Galpon_ID, Tipo, Lugar_ID)
        );

    IF COL_LENGTH('dbo.VIAJES', 'GalponID') IS NULL
        ALTER TABLE dbo.VIAJES ADD GalponID int NULL CONSTRAINT FK_VIAJES_GALPON REFERENCES dbo.GALPON (Galpon_ID);

    -- Los km que ya están calculados son del galpón de hoy (el único que había): se copian (con SQL dinámico porque la
    -- tabla se crea en este mismo lote).
    EXEC (N'
        DECLARE @g int = (SELECT MIN(Galpon_ID) FROM dbo.GALPON);
        IF @g IS NOT NULL
        BEGIN
            INSERT INTO dbo.GALPON_KM (Galpon_ID, Tipo, Lugar_ID, Km)
            SELECT @g, ''Origen'', o.Origen_ID, o.Km_Galpon FROM dbo.ORIGEN o
            WHERE o.Km_Galpon IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM dbo.GALPON_KM k WHERE k.Galpon_ID = @g AND k.Tipo = ''Origen'' AND k.Lugar_ID = o.Origen_ID);
            INSERT INTO dbo.GALPON_KM (Galpon_ID, Tipo, Lugar_ID, Km)
            SELECT @g, ''Destino'', d.Destino_ID, d.Km_Galpon FROM dbo.DESTINO d
            WHERE d.Km_Galpon IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM dbo.GALPON_KM k WHERE k.Galpon_ID = @g AND k.Tipo = ''Destino'' AND k.Lugar_ID = d.Destino_ID);
        END;');

    COMMIT TRANSACTION;

    -- Verificación: todo "OK".
    EXEC (N'
        SELECT N''GALPON.Vigente_Desde'' AS Que, CASE WHEN COL_LENGTH(''dbo.GALPON'', ''Vigente_Desde'') IS NOT NULL THEN N''OK'' ELSE N''FALTA'' END AS Estado
        UNION ALL SELECT N''GALPON_KM'', CASE WHEN OBJECT_ID(N''dbo.GALPON_KM'', N''U'') IS NOT NULL THEN N''OK'' ELSE N''FALTA'' END
        UNION ALL SELECT N''VIAJES.GalponID'', CASE WHEN COL_LENGTH(''dbo.VIAJES'', ''GalponID'') IS NOT NULL THEN N''OK'' ELSE N''FALTA'' END
        UNION ALL SELECT N''Km al galpón copiados'',
            CASE WHEN (SELECT COUNT(*) FROM dbo.GALPON_KM) >= (SELECT COUNT(*) FROM dbo.ORIGEN WHERE Km_Galpon IS NOT NULL)
                                                         + (SELECT COUNT(*) FROM dbo.DESTINO WHERE Km_Galpon IS NOT NULL)
                 THEN N''OK'' ELSE N''FALTA'' END;');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
