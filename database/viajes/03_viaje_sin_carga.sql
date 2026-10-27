/*
   Viaje sin carga (27/10/2026, punto 10 de la §41 de docs/PENDIENTES-SISTEMA.md; antes "falso flete", palabra que Rocío
   no quiere usar).

   El camión llegó al origen y no había carga: el viaje pasa a Estado = 'Sin_carga' (desde En viaje; con plataforma, desde
   Registrado), se cobra el porcentaje de la tabla de tarifas (VIAJES.Falso_Flete = 1, la columna de siempre) y sigue a
   la proforma como un entregado. Lo marca el chofer desde su hoja de ruta o administración desde Cambiar estado, con una
   observación opcional. Este script agrega dónde se guarda:
     VIAJES.Sin_Carga_Observacion   lo que anotó quien lo marcó (por ejemplo, "la planta no tenía la carga lista").
   La fecha va en Fecha_Entrega (el día que llegó al origen). No cambia datos.

   La base tiene CK_VIAJES_Estado (no está en ningún script del repo): al aplicar, se la amplía con 'Sin_carga'
   conservando lo que ya admitía (su definición OR [Estado]='Sin_carga') y el mismo nombre, como hace el 02 con Cancelado.

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo). Después del 02 y antes de recompilar la API:
     1. Ejecutar tal cual (@Aplicar = 0): dice qué falta, qué restricciones sobre Estado se amplían y los viajes viejos
        con falso flete marcado.
     2. Poner @Aplicar = 1 y ejecutar de nuevo.
   Es idempotente.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = aplicar

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54420, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

PRINT '--- Qué falta';
SELECT N'VIAJES.Sin_Carga_Observacion' AS Objeto,
       CASE WHEN COL_LENGTH('dbo.VIAJES', 'Sin_Carga_Observacion') IS NULL THEN 'Falta' ELSE 'Ya está' END AS Estado;

PRINT '--- Restricciones sobre VIAJES.Estado (las que no admiten ''Sin_carga'' se amplían al aplicar)';
SELECT cc.name AS Restriccion, cc.definition AS Definicion,
       CASE WHEN cc.definition LIKE N'%Sin[_]carga%' THEN N'Admite Sin_carga' ELSE N'Se amplía con Sin_carga' END AS Que_Pasa
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.VIAJES') AND cc.definition LIKE N'%Estado%';

PRINT '--- Viajes con falso flete marcado que no están sin carga (de antes del estado nuevo: revisarlos a mano)';
SELECT v.Viaje_ID, v.Estado, v.Fecha_Inicio, c.Razon_Social AS Cliente, v.Importe
FROM dbo.VIAJES v
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
WHERE v.Falso_Flete = 1 AND ISNULL(v.Estado, '') <> 'Sin_carga'
ORDER BY v.Viaje_ID;

IF @Aplicar = 0
BEGIN
    PRINT '';
    PRINT 'Solo diagnóstico: no se cambió nada. Si está bien, poner @Aplicar = 1 y volver a ejecutar.';
    RETURN;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Cada restricción sobre Estado que no admite 'Sin_carga': se la vuelve a crear con su definición OR [Estado]='Sin_carga'.
    DECLARE @Restriccion sysname, @Definicion nvarchar(max), @Sql nvarchar(max);
    WHILE 1 = 1
    BEGIN
        SELECT TOP (1) @Restriccion = cc.name, @Definicion = cc.definition
        FROM sys.check_constraints cc
        WHERE cc.parent_object_id = OBJECT_ID(N'dbo.VIAJES') AND cc.definition LIKE N'%Estado%' AND cc.definition NOT LIKE N'%Sin[_]carga%';
        IF @@ROWCOUNT = 0 BREAK;
        SET @Sql = N'ALTER TABLE dbo.VIAJES DROP CONSTRAINT ' + QUOTENAME(@Restriccion) + N'; ' +
                   N'ALTER TABLE dbo.VIAJES WITH CHECK ADD CONSTRAINT ' + QUOTENAME(@Restriccion) +
                   N' CHECK (' + @Definicion + N' OR [Estado]=''Sin_carga'');';
        EXEC sys.sp_executesql @Sql;
        PRINT 'Restricción ' + @Restriccion + ' ampliada con Sin_carga.';
    END;

    IF COL_LENGTH('dbo.VIAJES', 'Sin_Carga_Observacion') IS NULL
        ALTER TABLE dbo.VIAJES ADD Sin_Carga_Observacion nvarchar(300) NULL;

    COMMIT TRANSACTION;
    PRINT 'Listo: VIAJES ya guarda la observación del viaje sin carga.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
