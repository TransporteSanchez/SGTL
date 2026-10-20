/*
   Permiso "Presupuestos" para los grupos que hoy entran a Presupuestos por tener Gestión de viajes.

   Por qué: hasta el merge de Facu del 20/10, el menú lateral (sidebar-loader.js) dejaba entrar a
   Presupuestos a todo el que tenía Gestión de viajes, aunque el grupo no tuviera el permiso.
   Facu sacó esa regla (commit e701a4f): ahora hace falta el permiso "Presupuestos" en el grupo.
   Sin este script, esos grupos dejan de ver Presupuestos.

   "Presupuestos" es el nombre que usa la API (GruposController.CatalogoMenuPermisos). Si el menú
   no existe, la API lo crea igual al abrir "Permisos por grupo"; este script lo crea antes, con el
   mismo nombre y Menu_Principal = 0, para poder asignarlo.

   El diagnóstico también muestra los menús de la base que la API no reconoce: la API da de alta
   cada nombre de su catálogo que no encuentra (ignorando mayúsculas y tildes), así que un menú
   con otro nombre (ej. "Gestionar viajes") termina duplicado. Este script NO los resuelve.

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
    THROW 54200, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

-- Mismo catálogo que GruposController.CatalogoMenuPermisos.
DECLARE @Catalogo TABLE (Nombre nvarchar(100) COLLATE Latin1_General_CI_AI PRIMARY KEY);
INSERT INTO @Catalogo (Nombre) VALUES
    (N'Dashboard'),
    (N'Listado de choferes'), (N'Gestión de choferes'),
    (N'Listado de camiones'), (N'Gestión de camiones'),
    (N'Listado de viajes'), (N'Gestión de viajes'), (N'Gestión de orígenes y destinos'), (N'Gestión de tarifas'), (N'Presupuestos'),
    (N'Listado de clientes'), (N'Gestión de clientes'),
    (N'Listado de proformas'), (N'Gestión de proformas'), (N'Cuenta Corriente'),
    (N'Facturación'), (N'E-mail'), (N'Gestión de contenido'), (N'Integración WhatsApp'),
    (N'Listado de usuarios'), (N'Gestión de usuarios'), (N'Grupos y permisos'),
    (N'Auditoría');

-- Grupos con Gestión de viajes (o su nombre nuevo) que todavía no tienen Presupuestos.
DECLARE @GruposSinPresupuestos TABLE (GrupoID int PRIMARY KEY);
INSERT INTO @GruposSinPresupuestos (GrupoID)
SELECT DISTINCT gm.GrupoID
FROM dbo.GRUPOS_MENU gm
JOIN dbo.MENU m ON m.Menu_ID = gm.MenuID
WHERE LTRIM(RTRIM(m.Menu_Nombre)) COLLATE Latin1_General_CI_AI IN (N'Gestión de viajes', N'Gestionar viajes')
  AND NOT EXISTS (SELECT 1
                  FROM dbo.GRUPOS_MENU gp
                  JOIN dbo.MENU mp ON mp.Menu_ID = gp.MenuID
                  WHERE gp.GrupoID = gm.GrupoID
                    AND LTRIM(RTRIM(mp.Menu_Nombre)) COLLATE Latin1_General_CI_AI IN (N'Presupuestos', N'Gestionar presupuestos'));

/* ===================== 1. Diagnóstico (no cambia nada) ===================== */

PRINT '--- Menús de la base que la API no reconoce (si alguno equivale a uno del catálogo, la API va a crear un duplicado)';
SELECT m.Menu_ID, m.Menu_Nombre,
       (SELECT COUNT(*) FROM dbo.GRUPOS_MENU gm WHERE gm.MenuID = m.Menu_ID) AS Grupos_Asignados
FROM dbo.MENU m
WHERE NOT EXISTS (SELECT 1 FROM @Catalogo c WHERE c.Nombre = LTRIM(RTRIM(m.Menu_Nombre)) COLLATE Latin1_General_CI_AI)
ORDER BY m.Menu_Nombre;

PRINT '--- Nombres del catálogo que no están en la base (la API los crea al abrir "Permisos por grupo")';
SELECT c.Nombre
FROM @Catalogo c
WHERE NOT EXISTS (SELECT 1 FROM dbo.MENU m WHERE LTRIM(RTRIM(m.Menu_Nombre)) COLLATE Latin1_General_CI_AI = c.Nombre)
ORDER BY c.Nombre;

PRINT '--- Grupos a los que se les va a dar el permiso Presupuestos';
SELECT g.GrupoID, gr.Grupo_Nombre
FROM @GruposSinPresupuestos g
LEFT JOIN dbo.GRUPOS gr ON gr.Grupo_ID = g.GrupoID
ORDER BY gr.Grupo_Nombre;

IF @Aplicar = 0
BEGIN
    PRINT '';
    PRINT 'Solo diagnóstico: no se cambió nada. Si el resultado está bien, poner @Aplicar = 1 y volver a ejecutar.';
    RETURN;
END;

/* ===================== 2. Cambio ===================== */

DECLARE @MenuCreado int = 0, @Asignados int = 0, @MenuPresupuestos int;

BEGIN TRY
    BEGIN TRANSACTION;

    SELECT TOP (1) @MenuPresupuestos = Menu_ID
    FROM dbo.MENU
    WHERE LTRIM(RTRIM(Menu_Nombre)) COLLATE Latin1_General_CI_AI = N'Presupuestos'
    ORDER BY Menu_ID;

    IF @MenuPresupuestos IS NULL
    BEGIN
        INSERT INTO dbo.MENU (Menu_Nombre, Menu_Principal) VALUES (N'Presupuestos', 0);
        SET @MenuPresupuestos = SCOPE_IDENTITY();
        SET @MenuCreado = 1;
    END;

    INSERT INTO dbo.GRUPOS_MENU (GrupoID, MenuID)
    SELECT g.GrupoID, @MenuPresupuestos
    FROM @GruposSinPresupuestos g
    WHERE NOT EXISTS (SELECT 1 FROM dbo.GRUPOS_MENU x WHERE x.GrupoID = g.GrupoID AND x.MenuID = @MenuPresupuestos);
    SET @Asignados = @@ROWCOUNT;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

PRINT CONCAT('Menú Presupuestos creado: ', CASE WHEN @MenuCreado = 1 THEN 'sí' ELSE 'no (ya existía)' END);
PRINT CONCAT('Grupos a los que se les dio el permiso: ', @Asignados);

/* ===================== 3. Verificación ===================== */

PRINT '--- Verificación (tiene que dar 0)';
SELECT COUNT(*) AS Grupos_Con_Viajes_Sin_Presupuestos
FROM dbo.GRUPOS_MENU gm
JOIN dbo.MENU m ON m.Menu_ID = gm.MenuID
WHERE LTRIM(RTRIM(m.Menu_Nombre)) COLLATE Latin1_General_CI_AI IN (N'Gestión de viajes', N'Gestionar viajes')
  AND NOT EXISTS (SELECT 1
                  FROM dbo.GRUPOS_MENU gp
                  JOIN dbo.MENU mp ON mp.Menu_ID = gp.MenuID
                  WHERE gp.GrupoID = gm.GrupoID
                    AND LTRIM(RTRIM(mp.Menu_Nombre)) COLLATE Latin1_General_CI_AI IN (N'Presupuestos', N'Gestionar presupuestos'));

/*
   Después de aplicarlo: en la VM, entrar con un usuario de un grupo que tenga Gestión de viajes
   (no admin): en el menú lateral tiene que aparecer Presupuestos y la pantalla tiene que abrir.
*/
