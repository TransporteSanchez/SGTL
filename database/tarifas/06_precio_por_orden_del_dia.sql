/*
   Precio por orden del día: primer y segundo viaje del mismo cliente y recorrido (1ª y 2ª vuelta), §43 de
   docs/PENDIENTES-SISTEMA.md y docs/diseno/vuelta-del-dia-diseno.md (decisión de Rocío, 26 y 27/10/2026).

   Lo que queda para revisar cuando un cambio en el orden del día le toca el precio a un viaje que ya salió, a uno que está
   en una proforma o un comprobante, o a un presupuesto aceptado, usa las mismas tablas que los cambios de tarifa
   (05_cambios_de_tarifa.sql): así la tarjeta "Cambios para revisar", los íconos y los avisos sirven para los dos casos.
   Este script solo agrega:
     TARIFARIO_CAMBIOS.Tipo   'Orden del día' (además de 'Corrección' y 'Tabla nueva'): la causa, por ejemplo "Se eliminó
                              el viaje #44" (va en Motivo).
     TARIFARIO_REVISAR.Tipo   'Viaje' (además de 'Presupuesto', 'Proforma' y 'Comprobante'): un viaje que ya salió y
                              todavía no está en una proforma generada ni en un comprobante; decide la persona con
                              "Actualizar el precio" o "Mantener el precio".
     TARIFARIO_REVISAR.Vuelta_Nueva   la vuelta que le corresponde (1 o 2); vacía en lo que viene de un cambio de tarifa.
   No cambia datos.

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo). Es idempotente: lo que ya existe no lo
   toca. Correrlo ANTES de recompilar la API. Antes de que la API empiece a calcular la vuelta por cliente y recorrido,
   correr también 07_relevar_vueltas_por_recorrido.sql (solo lectura) para ver qué viajes guardados tendrían otra vuelta.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54660, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;
IF OBJECT_ID(N'dbo.TARIFARIO_REVISAR', N'U') IS NULL
    THROW 54661, 'Primero correr database/tarifas/05_cambios_de_tarifa.sql.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
                   WHERE name = N'CK_TARIFARIO_CAMBIOS_Tipo' AND definition LIKE N'%Orden del d%')
    BEGIN
        IF OBJECT_ID(N'dbo.CK_TARIFARIO_CAMBIOS_Tipo', N'C') IS NOT NULL
            ALTER TABLE dbo.TARIFARIO_CAMBIOS DROP CONSTRAINT CK_TARIFARIO_CAMBIOS_Tipo;
        ALTER TABLE dbo.TARIFARIO_CAMBIOS ADD CONSTRAINT CK_TARIFARIO_CAMBIOS_Tipo
            CHECK (Tipo IN (N'Corrección', N'Tabla nueva', N'Orden del día'));
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
                   WHERE name = N'CK_TARIFARIO_REVISAR_Tipo' AND definition LIKE N'%Viaje%')
    BEGIN
        IF OBJECT_ID(N'dbo.CK_TARIFARIO_REVISAR_Tipo', N'C') IS NOT NULL
            ALTER TABLE dbo.TARIFARIO_REVISAR DROP CONSTRAINT CK_TARIFARIO_REVISAR_Tipo;
        ALTER TABLE dbo.TARIFARIO_REVISAR ADD CONSTRAINT CK_TARIFARIO_REVISAR_Tipo
            CHECK (Tipo IN (N'Presupuesto', N'Proforma', N'Comprobante', N'Viaje'));
    END;

    IF COL_LENGTH(N'dbo.TARIFARIO_REVISAR', N'Vuelta_Nueva') IS NULL
        ALTER TABLE dbo.TARIFARIO_REVISAR ADD Vuelta_Nueva int NULL
            CONSTRAINT CK_TARIFARIO_REVISAR_Vuelta_Nueva CHECK (Vuelta_Nueva IN (1, 2));

    COMMIT TRANSACTION;

    -- Verificación: todo "OK".
    SELECT N'Tipo "Orden del día" en TARIFARIO_CAMBIOS' AS Que,
           CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_TARIFARIO_CAMBIOS_Tipo'
                             AND definition LIKE N'%Orden del d%') THEN N'OK' ELSE N'FALTA' END AS Estado
    UNION ALL
    SELECT N'Tipo "Viaje" en TARIFARIO_REVISAR',
           CASE WHEN EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_TARIFARIO_REVISAR_Tipo'
                             AND definition LIKE N'%Viaje%') THEN N'OK' ELSE N'FALTA' END
    UNION ALL
    SELECT N'TARIFARIO_REVISAR.Vuelta_Nueva',
           CASE WHEN COL_LENGTH(N'dbo.TARIFARIO_REVISAR', N'Vuelta_Nueva') IS NOT NULL THEN N'OK' ELSE N'FALTA' END;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
