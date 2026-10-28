/*
   Adicionales del viaje de un cliente directo (28/10/2026, Rocío; §41, punto 11, de docs/PENDIENTES-SISTEMA.md).

   Los mismos adicionales que QUICKFOOD tiene en Rukas, con los mismos valores (recorrida del 28/10 en
   docs/negocio/RELEVAMIENTO-RUKAS-CLAUDIA.md, paso 12): la espera por franja de horas, la descarga y el repaletizado, que
   son módulos de estadía de la tabla de tarifas, y la vuelta vacía, un porcentaje del flete que elige administración. En
   los viajes con plataforma siguen viniendo de Rukas (el Excel de la proforma).

   Lo que cuenta para el importe ya existe: VIAJES.Estadia_Modulos pasa a ser el total de módulos de los adicionales fijos.
   Este script agrega:
     VIAJES.Vuelta_Vacia_Porcentaje   el porcentaje de la vuelta vacía (10, 20, 23, 30, 40, 45, 50, 60 o 70); vacío si no
                                      tiene. Se cobra sobre el flete (el importe de la tarifa).
     VIAJES.Adicionales               la lista que se cargó, para verla y editarla: JSON con el código, la cantidad, el
                                      porcentaje (en la vuelta vacía) y un comentario. Vacío en los viajes de antes: si
                                      tienen módulos de estadía, la pantalla los muestra como "Estadía".
   Fuera del EDMX: la API las usa con SQL directo (ViajesController, OrdenDelDia, TarifarioImpacto y TarifarioRevisar).
   No cambia datos.

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo). ANTES de recompilar la API (sin estas
   columnas, Gestionar viajes no carga):
     1. Ejecutar tal cual (@Aplicar = 0): dice qué falta, no cambia nada.
     2. Poner @Aplicar = 1 y ejecutar de nuevo. Al final, la verificación tiene que decir "OK" en las dos.
   Es idempotente: lo que ya existe no lo toca.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = aplicar

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54440, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;
IF COL_LENGTH('dbo.VIAJES', 'Estadia_Modulos') IS NULL
    THROW 54441, 'Primero correr database/tarifas/02_tarifario_por_vehiculo.sql.', 1;

PRINT '--- Qué falta';
SELECT Objeto, CASE WHEN Existe = 1 THEN 'Ya está' ELSE 'Falta' END AS Estado
FROM (VALUES
    (N'VIAJES.Vuelta_Vacia_Porcentaje', CASE WHEN COL_LENGTH('dbo.VIAJES', 'Vuelta_Vacia_Porcentaje') IS NULL THEN 0 ELSE 1 END),
    (N'VIAJES.Adicionales',             CASE WHEN COL_LENGTH('dbo.VIAJES', 'Adicionales') IS NULL THEN 0 ELSE 1 END)
) AS t (Objeto, Existe);
SELECT N'Viajes con módulos de estadía (se van a ver como "Estadía")' AS Que, COUNT(*) AS Cantidad
FROM dbo.VIAJES WHERE ISNULL(Estadia_Modulos, 0) > 0;

IF @Aplicar = 0
BEGIN
    PRINT '';
    PRINT 'Solo diagnóstico: no se cambió nada. Si está bien, poner @Aplicar = 1 y volver a ejecutar.';
    RETURN;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH('dbo.VIAJES', 'Vuelta_Vacia_Porcentaje') IS NULL
        ALTER TABLE dbo.VIAJES ADD Vuelta_Vacia_Porcentaje decimal(5, 2) NULL
            CONSTRAINT CK_VIAJES_Vuelta_Vacia_Porcentaje CHECK (Vuelta_Vacia_Porcentaje > 0 AND Vuelta_Vacia_Porcentaje <= 100);

    IF COL_LENGTH('dbo.VIAJES', 'Adicionales') IS NULL
        ALTER TABLE dbo.VIAJES ADD Adicionales nvarchar(2000) NULL;

    COMMIT TRANSACTION;

    -- Verificación: las dos "OK" (con SQL dinámico porque las columnas se agregan en este mismo lote).
    EXEC (N'
        SELECT N''VIAJES.Vuelta_Vacia_Porcentaje'' AS Que,
               CASE WHEN COL_LENGTH(''dbo.VIAJES'', ''Vuelta_Vacia_Porcentaje'') IS NOT NULL THEN N''OK'' ELSE N''FALTA'' END AS Estado
        UNION ALL SELECT N''VIAJES.Adicionales'',
               CASE WHEN COL_LENGTH(''dbo.VIAJES'', ''Adicionales'') IS NOT NULL THEN N''OK'' ELSE N''FALTA'' END;');
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
