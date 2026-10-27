/*
   Viaje sin carga (27/10/2026, punto 10 de la §41 de docs/PENDIENTES-SISTEMA.md; antes "falso flete", palabra que Rocío
   no quiere usar).

   El camión llegó al origen y no había carga: el viaje pasa a Estado = 'Sin_carga' (desde En viaje; con plataforma, desde
   Registrado), se cobra el porcentaje de la tabla de tarifas (VIAJES.Falso_Flete = 1, la columna de siempre) y sigue a
   la proforma como un entregado. Lo marca el chofer desde su hoja de ruta o administración desde Cambiar estado, con una
   observación opcional. Este script agrega dónde se guarda:
     VIAJES.Sin_Carga_Observacion   lo que anotó quien lo marcó (por ejemplo, "la planta no tenía la carga lista").
   La fecha va en Fecha_Entrega (el día que llegó al origen). No cambia datos.

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo). Antes de recompilar la API:
     1. Ejecutar tal cual (@Aplicar = 0): dice qué falta y si VIAJES tiene alguna restricción sobre Estado que no admita
        'Sin_carga' (si aparece, pasarle el resultado a Claude antes de seguir).
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

PRINT '--- Restricciones sobre VIAJES.Estado (si aparece alguna sin ''Sin_carga'', avisar antes de seguir)';
SELECT cc.name AS Restriccion, cc.definition AS Definicion,
       CASE WHEN cc.definition LIKE N'%Sin[_]carga%' THEN N'Admite Sin_carga' ELSE N'NO admite Sin_carga' END AS Que_Pasa
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

IF EXISTS (SELECT 1 FROM sys.check_constraints cc
           WHERE cc.parent_object_id = OBJECT_ID(N'dbo.VIAJES') AND cc.definition LIKE N'%Estado%' AND cc.definition NOT LIKE N'%Sin[_]carga%')
    THROW 54421, 'VIAJES tiene una restricción sobre Estado que no admite ''Sin_carga'': pasarle el diagnóstico a Claude.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH('dbo.VIAJES', 'Sin_Carga_Observacion') IS NULL
        ALTER TABLE dbo.VIAJES ADD Sin_Carga_Observacion nvarchar(300) NULL;

    COMMIT TRANSACTION;
    PRINT 'Listo: VIAJES ya guarda la observación del viaje sin carga.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
