/*
   Viaje cancelado (27/10/2026, caso E de la revisión del flujo: docs/diseno/viajes-diseno.md; maqueta
   .claude/maquetas/viajes/cancelado.html, aprobada por Rocío).

   Un viaje que no se hizo pasa a Estado = 'Cancelado' (desde Registrado, con motivo) en lugar de borrarse: queda en el
   listado con su etiqueta y deja de contar en el camión y el chofer ocupados, el orden del día, las proformas, los costos
   y los indicadores. Puede volver a Registrado. Este script agrega dónde se guarda la cancelación:
     VIAJES.Cancelado_Motivo    por qué se canceló (obligatorio al cancelar).
     VIAJES.Cancelado_Fecha     cuándo (hora de la Argentina).
     VIAJES.Cancelado_Usuario   quién.
     VIAJES.Cancelado_Presupuesto_ID  el presupuesto del que salió, si salió de uno: el presupuesto puede volver a generar
                                      el viaje y pasa a apuntar al nuevo, pero el cancelado sigue diciendo de cuál salió.
   Al volver a Registrado se vacían (queda en Auditoría). No cambia datos.

   La base tiene CK_VIAJES_Estado (no está en ningún script del repo), que solo admite los estados de antes: al aplicar,
   se la amplía con 'Cancelado' conservando lo que ya admitía (su definición OR [Estado]='Cancelado') y el mismo nombre.

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo). Antes de recompilar la API:
     1. Ejecutar tal cual (@Aplicar = 0): dice qué falta y qué restricciones sobre Estado se amplían.
     2. Poner @Aplicar = 1 y ejecutar de nuevo.
   Es idempotente.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = aplicar

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54410, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

PRINT '--- Qué falta';
SELECT Objeto, CASE WHEN Existe = 1 THEN 'Ya está' ELSE 'Falta' END AS Estado
FROM (VALUES
    (N'VIAJES.Cancelado_Motivo',  CASE WHEN COL_LENGTH('dbo.VIAJES', 'Cancelado_Motivo') IS NULL THEN 0 ELSE 1 END),
    (N'VIAJES.Cancelado_Fecha',   CASE WHEN COL_LENGTH('dbo.VIAJES', 'Cancelado_Fecha') IS NULL THEN 0 ELSE 1 END),
    (N'VIAJES.Cancelado_Usuario', CASE WHEN COL_LENGTH('dbo.VIAJES', 'Cancelado_Usuario') IS NULL THEN 0 ELSE 1 END),
    (N'VIAJES.Cancelado_Presupuesto_ID', CASE WHEN COL_LENGTH('dbo.VIAJES', 'Cancelado_Presupuesto_ID') IS NULL THEN 0 ELSE 1 END)
) AS t (Objeto, Existe);

PRINT '--- Restricciones sobre VIAJES.Estado (las que no admiten ''Cancelado'' se amplían al aplicar)';
SELECT cc.name AS Restriccion, cc.definition AS Definicion,
       CASE WHEN cc.definition LIKE N'%Cancelado%' THEN N'Admite Cancelado' ELSE N'Se amplía con Cancelado' END AS Que_Pasa
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.VIAJES') AND cc.definition LIKE N'%Estado%';

IF @Aplicar = 0
BEGIN
    PRINT '';
    PRINT 'Solo diagnóstico: no se cambió nada. Si está bien, poner @Aplicar = 1 y volver a ejecutar.';
    RETURN;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Cada restricción sobre Estado que no admite 'Cancelado': se la vuelve a crear con su definición OR [Estado]='Cancelado'.
    DECLARE @Restriccion sysname, @Definicion nvarchar(max), @Sql nvarchar(max);
    WHILE 1 = 1
    BEGIN
        SELECT TOP (1) @Restriccion = cc.name, @Definicion = cc.definition
        FROM sys.check_constraints cc
        WHERE cc.parent_object_id = OBJECT_ID(N'dbo.VIAJES') AND cc.definition LIKE N'%Estado%' AND cc.definition NOT LIKE N'%Cancelado%';
        IF @@ROWCOUNT = 0 BREAK;
        SET @Sql = N'ALTER TABLE dbo.VIAJES DROP CONSTRAINT ' + QUOTENAME(@Restriccion) + N'; ' +
                   N'ALTER TABLE dbo.VIAJES WITH CHECK ADD CONSTRAINT ' + QUOTENAME(@Restriccion) +
                   N' CHECK (' + @Definicion + N' OR [Estado]=''Cancelado'');';
        EXEC sys.sp_executesql @Sql;
        PRINT 'Restricción ' + @Restriccion + ' ampliada con Cancelado.';
    END;

    IF COL_LENGTH('dbo.VIAJES', 'Cancelado_Motivo') IS NULL
        ALTER TABLE dbo.VIAJES ADD Cancelado_Motivo nvarchar(300) NULL;
    IF COL_LENGTH('dbo.VIAJES', 'Cancelado_Fecha') IS NULL
        ALTER TABLE dbo.VIAJES ADD Cancelado_Fecha datetime NULL;
    IF COL_LENGTH('dbo.VIAJES', 'Cancelado_Usuario') IS NULL
        ALTER TABLE dbo.VIAJES ADD Cancelado_Usuario nvarchar(50) NULL;
    IF COL_LENGTH('dbo.VIAJES', 'Cancelado_Presupuesto_ID') IS NULL
        ALTER TABLE dbo.VIAJES ADD Cancelado_Presupuesto_ID int NULL;

    COMMIT TRANSACTION;
    PRINT 'Listo: VIAJES ya guarda el motivo, la fecha y el usuario de la cancelación.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
