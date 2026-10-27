/*
   Rol Chofer (27/10/2026, Rocío): las cuentas de los choferes pasan al rol "chofer".

   Antes, un chofer era un usuario con rol "user", el grupo Choferes (que solo abre la Hoja de ruta) y su chofer en
   USUARIOS.ChoferID. Ahora el rol dice qué es: admin (ve todo), user (las pantallas de sus grupos) y chofer (solo Hojas de
   ruta, con los viajes de su chofer, sin grupos). En pantalla se ven Administrador, Usuario y Chofer.

   Qué hace:
     1. Diagnóstico (no cambia nada): si USUARIOS.Rol tiene alguna restricción que no admita 'chofer', las cuentas con
        chofer que hay que pasar y las que no se tocan (un administrador con chofer: decidir a mano).
     2. Los cambios, dentro de una transacción que queda abierta: si alguna restricción sobre USUARIOS.Rol no admite
        'chofer', se la amplía (su definición OR [Rol]='chofer', con el mismo nombre); después las cuentas con rol user y
        chofer pasan a rol chofer y se les quitan los grupos (con el rol chofer no se usan). Al final, COMMIT o ROLLBACK a
        mano (el ROLLBACK también deshace la ampliación).

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo), junto con la API nueva. Mientras no se
   corra, esas cuentas siguen entrando como antes (por el grupo Choferes), y al editarlas en Gestionar usuarios se abren
   con el rol Chofer y quedan así al guardar:
     1. Ejecutar hasta "--- Cambios" y mirar el diagnóstico.
     2. Ejecutar el bloque de cambios: muestra cuántas filas tocó. Si está bien, COMMIT; si no, ROLLBACK.
   Si se corre de nuevo, no encuentra nada para pasar.
*/
SET NOCOUNT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54510, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;
IF COL_LENGTH('dbo.USUARIOS', 'ChoferID') IS NULL
    THROW 54511, 'Falta USUARIOS.ChoferID: correr antes database/hoja-de-ruta/01_usuario_chofer.sql.', 1;

PRINT '--- Restricciones sobre USUARIOS.Rol (las que no admiten ''chofer'' se amplían en los cambios)';
SELECT cc.name AS Restriccion, cc.definition AS Definicion,
       CASE WHEN cc.definition LIKE N'%chofer%' THEN N'Admite chofer' ELSE N'Se amplía con chofer' END AS Que_Pasa
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.USUARIOS') AND cc.definition LIKE N'%Rol%';

PRINT '--- Cuentas con chofer: las de rol user pasan a chofer; las de admin quedan como están (decidir a mano)';
SELECT u.Usuario_ID, u.Nombre_Usuario, u.Rol, u.EstadoUsuario,
       LTRIM(RTRIM(ISNULL(c.Apellido, '') + ', ' + ISNULL(c.Nombre, ''))) AS Chofer, c.EstadoChofer,
       (SELECT COUNT(*) FROM dbo.GRUPOS_USUARIOS gu WHERE gu.UsuarioID = u.Usuario_ID) AS Grupos,
       CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(u.Rol, '')))) = 'user' THEN N'Pasa a chofer'
            WHEN LOWER(LTRIM(RTRIM(ISNULL(u.Rol, '')))) = 'chofer' THEN N'Ya es chofer'
            ELSE N'No se toca' END AS Que_Pasa
FROM dbo.USUARIOS u
LEFT JOIN dbo.CHOFERES c ON c.Chofer_ID = u.ChoferID
WHERE u.ChoferID IS NOT NULL
ORDER BY u.Nombre_Usuario;

--- Cambios ---------------------------------------------------------------------------------------------------------
BEGIN TRAN;

DECLARE @Restriccion sysname, @Definicion nvarchar(max), @Sql nvarchar(max);
WHILE 1 = 1
BEGIN
    SELECT TOP (1) @Restriccion = cc.name, @Definicion = cc.definition
    FROM sys.check_constraints cc
    WHERE cc.parent_object_id = OBJECT_ID(N'dbo.USUARIOS') AND cc.definition LIKE N'%Rol%' AND cc.definition NOT LIKE N'%chofer%';
    IF @@ROWCOUNT = 0 BREAK;
    SET @Sql = N'ALTER TABLE dbo.USUARIOS DROP CONSTRAINT ' + QUOTENAME(@Restriccion) + N'; ' +
               N'ALTER TABLE dbo.USUARIOS WITH CHECK ADD CONSTRAINT ' + QUOTENAME(@Restriccion) +
               N' CHECK (' + @Definicion + N' OR [Rol]=''chofer'');';
    EXEC sys.sp_executesql @Sql;
    PRINT 'Restricción ' + @Restriccion + ' ampliada con chofer.';
END;

DECLARE @Pasan TABLE (Usuario_ID int PRIMARY KEY);
INSERT INTO @Pasan (Usuario_ID)
SELECT Usuario_ID FROM dbo.USUARIOS
WHERE ChoferID IS NOT NULL AND LOWER(LTRIM(RTRIM(ISNULL(Rol, '')))) = 'user';

DELETE gu FROM dbo.GRUPOS_USUARIOS gu JOIN @Pasan p ON p.Usuario_ID = gu.UsuarioID;
SELECT @@ROWCOUNT AS Grupos_Quitados;

UPDATE u SET Rol = 'chofer', Fecha_Modi = GETDATE(), Usu_Modi = 'script rol chofer'
FROM dbo.USUARIOS u JOIN @Pasan p ON p.Usuario_ID = u.Usuario_ID;
SELECT @@ROWCOUNT AS Usuarios_Pasados_A_Chofer;

-- COMMIT; o ROLLBACK;
