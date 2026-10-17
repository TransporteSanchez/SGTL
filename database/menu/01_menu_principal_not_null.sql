/*
   MENU.Menu_Principal: completar los NULL, valor por defecto 0 y NOT NULL.

   Por qué: el modelo de la API (EDMX, MENU.cs) define Menu_Principal como int no nulo.
   Cuando hay una fila con NULL, todo lo que carga MENU completo por Entity Framework falla
   con 500: por ejemplo "Permisos por grupo" (GET /api/Grupos/{id}/Menus), F3 de la
   recorrida del 17/10. El código no lee el valor de esta columna: la API da de alta los
   menús con 0 (GruposController.AsegurarCatalogoMenuPermisos), así que 0 es el valor
   neutro. Los NULL vienen de altas hechas a mano por SQL sin esa columna; el DEFAULT 0
   evita que se repita.

   Cómo correrlo (SSMS, base Transporte_Sanchez, con backup previo y avisando al equipo):
     1. Ejecutar tal cual (@Aplicar = 0): solo muestra el diagnóstico, no cambia nada.
     2. Revisar el resultado. Si está bien, cambiar @Aplicar a 1 y ejecutar de nuevo.
   Es idempotente: si ya estaba aplicado, no hace nada.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = aplicar el cambio
DECLARE @NombreBaseEsperada sysname = N'Transporte_Sanchez';

IF DB_NAME() <> @NombreBaseEsperada
    THROW 54100, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

IF COL_LENGTH(N'dbo.MENU', N'Menu_Principal') IS NULL
    THROW 54101, 'No existe la columna dbo.MENU.Menu_Principal.', 1;

IF NOT EXISTS (SELECT 1 FROM sys.columns c JOIN sys.types t ON t.user_type_id = c.user_type_id
               WHERE c.object_id = OBJECT_ID(N'dbo.MENU') AND c.name = N'Menu_Principal' AND t.name = N'int')
    THROW 54102, 'dbo.MENU.Menu_Principal no es int: revisar antes de seguir.', 1;

/* ===================== 1. Diagnóstico (no cambia nada) ===================== */

PRINT '--- Estado actual de la columna';
SELECT c.is_nullable AS Admite_Null,
       dc.name       AS Default_Actual,
       dc.definition AS Valor_Default
FROM sys.columns c
LEFT JOIN sys.default_constraints dc ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE c.object_id = OBJECT_ID(N'dbo.MENU') AND c.name = N'Menu_Principal';

PRINT '--- Menús con Menu_Principal NULL (son los que se van a poner en 0)';
SELECT Menu_ID, Menu_Nombre, Menu_Principal
FROM dbo.MENU
WHERE Menu_Principal IS NULL
ORDER BY Menu_ID;

PRINT '--- Grupos que tienen asignados esos menús (no se tocan, solo para saber a quién afecta)';
SELECT gm.GrupoID, gm.MenuID, m.Menu_Nombre
FROM dbo.GRUPOS_MENU gm
JOIN dbo.MENU m ON m.Menu_ID = gm.MenuID
WHERE m.Menu_Principal IS NULL
ORDER BY gm.MenuID, gm.GrupoID;

PRINT '--- Posible duplicado "Gestion de contenido" / "Gestión de contenido" (este script NO lo resuelve)';
SELECT m.Menu_ID, m.Menu_Nombre, m.Menu_Principal,
       (SELECT COUNT(*) FROM dbo.GRUPOS_MENU gm WHERE gm.MenuID = m.Menu_ID) AS Grupos_Asignados
FROM dbo.MENU m
WHERE m.Menu_Nombre LIKE N'Gesti%n de contenido'
ORDER BY m.Menu_ID;

IF @Aplicar = 0
BEGIN
    PRINT '';
    PRINT 'Solo diagnóstico: no se cambió nada. Si el resultado está bien, poner @Aplicar = 1 y volver a ejecutar.';
    RETURN;
END;

/* ===================== 2. Cambio ===================== */

DECLARE @Actualizados int = 0;

BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE dbo.MENU SET Menu_Principal = 0 WHERE Menu_Principal IS NULL;
    SET @Actualizados = @@ROWCOUNT;

    IF EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID(N'dbo.MENU') AND name = N'Menu_Principal' AND is_nullable = 1)
        ALTER TABLE dbo.MENU ALTER COLUMN Menu_Principal int NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints dc
                   JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
                   WHERE dc.parent_object_id = OBJECT_ID(N'dbo.MENU') AND c.name = N'Menu_Principal')
        ALTER TABLE dbo.MENU ADD CONSTRAINT DF_MENU_Menu_Principal DEFAULT (0) FOR Menu_Principal;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

PRINT CONCAT('Filas actualizadas de NULL a 0: ', @Actualizados);

/* ===================== 3. Verificación ===================== */

PRINT '--- Verificación (las tres columnas tienen que dar OK)';
SELECT
    CASE WHEN NOT EXISTS (SELECT 1 FROM dbo.MENU WHERE Menu_Principal IS NULL)
         THEN 'OK' ELSE 'FALLA' END AS Sin_Nulls,
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns
                      WHERE object_id = OBJECT_ID(N'dbo.MENU') AND name = N'Menu_Principal' AND is_nullable = 0)
         THEN 'OK' ELSE 'FALLA' END AS Columna_Not_Null,
    CASE WHEN EXISTS (SELECT 1 FROM sys.default_constraints dc
                      JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
                      WHERE dc.parent_object_id = OBJECT_ID(N'dbo.MENU') AND c.name = N'Menu_Principal'
                        AND REPLACE(REPLACE(dc.definition, '(', ''), ')', '') = '0')
         THEN 'OK' ELSE 'REVISAR (default distinto de 0)' END AS Default_Cero;

/*
   Después de aplicarlo: en la VM, Usuarios → Gestionar grupos y permisos → pestaña
   "Permisos por grupo": tiene que cargar la lista de menús de cada grupo sin error.
*/
