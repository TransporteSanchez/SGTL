/*
   Tableros (24/10/2026): los favoritos del dashboard de cada usuario y el permiso "Tableros".

   La pantalla Tableros (tableros.html) muestra todos los tableros agrupados por tema. Con la estrella, cada usuario
   elige cuáles ve en su dashboard (index.html), y ahí los acomoda con Personalizar (posición y tamaño en la grilla).
   Hasta ahora ese diseño se guardaba solo en el navegador (api/DashboardLayout nunca existió): desde ahora se guarda
   acá, por usuario, y se ve igual en cualquier computadora.

   - TABLEROS_USUARIO: una fila por usuario que ya eligió sus favoritos. Si no tiene fila, ve el dashboard de siempre
     (el diseño por defecto). Sirve para distinguir "nunca lo personalizó" de "sacó todos los tableros".
   - TABLEROS_FAVORITOS: un tablero favorito por fila, con su orden y su lugar en la grilla del dashboard (12 columnas;
     sin lugar, el dashboard lo pone al final). "Tablero" es la clave del tablero en tableros-catalogo.js
     ("kpiviajes", "kmcamionmes"…): el catálogo de tableros vive en el código, no en la base.
   - Al eliminar un usuario se borran sus favoritos (ON DELETE CASCADE): no traban la baja.
   - MENU "Tableros": el permiso de la pantalla, para tildarlo en Gestionar grupos y permisos (los administradores la
     ven siempre). La API también lo crea al abrir los permisos de un grupo; este script lo crea antes para poder
     asignarlo ya. No se le da a ningún grupo: eso lo decide Rocío desde la pantalla.

   La API guarda la fecha con la hora de Argentina (no usa GETDATE(), que en Azure es UTC: §2 de los pendientes).
   Fuera del EDMX: la API usa estas tablas con SQL directo (TablerosController).

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo). Es idempotente: si las tablas o el
   permiso ya existen, no los toca.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54600, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

IF OBJECT_ID(N'dbo.USUARIOS', N'U') IS NULL OR OBJECT_ID(N'dbo.MENU', N'U') IS NULL
    THROW 54601, 'Faltan las tablas dbo.USUARIOS o dbo.MENU.', 1;

DECLARE @CreadaUsuario bit = 0, @CreadaFavoritos bit = 0, @CreadoPermiso bit = 0;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.TABLEROS_USUARIO', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.TABLEROS_USUARIO (
            Usuario_ID  int NOT NULL
                CONSTRAINT PK_TABLEROS_USUARIO PRIMARY KEY
                CONSTRAINT FK_TABLEROS_USUARIO_USUARIOS REFERENCES dbo.USUARIOS (Usuario_ID) ON DELETE CASCADE,
            Fecha_Modi  datetime NOT NULL
        );
        SET @CreadaUsuario = 1;
    END;

    IF OBJECT_ID(N'dbo.TABLEROS_FAVORITOS', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.TABLEROS_FAVORITOS (
            Usuario_ID  int NOT NULL
                CONSTRAINT FK_TABLEROS_FAVORITOS_USUARIO REFERENCES dbo.TABLEROS_USUARIO (Usuario_ID) ON DELETE CASCADE,
            Tablero     varchar(40) NOT NULL,
            Orden       smallint NOT NULL,
            Pos_X       tinyint NULL,
            Pos_Y       smallint NULL,
            Ancho       tinyint NULL,
            Alto        tinyint NULL,
            CONSTRAINT PK_TABLEROS_FAVORITOS PRIMARY KEY (Usuario_ID, Tablero),
            -- El lugar va completo o vacío, y dentro de las 12 columnas de la grilla.
            CONSTRAINT CK_TABLEROS_FAVORITOS_Lugar CHECK (
                (Pos_X IS NULL AND Pos_Y IS NULL AND Ancho IS NULL AND Alto IS NULL)
                OR (Pos_X IS NOT NULL AND Pos_Y IS NOT NULL AND Ancho IS NOT NULL AND Alto IS NOT NULL
                    AND Pos_X <= 11 AND Ancho BETWEEN 1 AND 12 - Pos_X AND Pos_Y >= 0 AND Alto >= 1)
            )
        );
        SET @CreadaFavoritos = 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.MENU WHERE LTRIM(RTRIM(Menu_Nombre)) COLLATE Latin1_General_CI_AI = N'Tableros')
    BEGIN
        INSERT INTO dbo.MENU (Menu_Nombre, Menu_Principal) VALUES (N'Tableros', 0);
        SET @CreadoPermiso = 1;
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

PRINT CONCAT('TABLEROS_USUARIO creada: ', CASE WHEN @CreadaUsuario = 1 THEN 'sí' ELSE 'no (ya existía)' END);
PRINT CONCAT('TABLEROS_FAVORITOS creada: ', CASE WHEN @CreadaFavoritos = 1 THEN 'sí' ELSE 'no (ya existía)' END);
PRINT CONCAT('Permiso Tableros creado: ', CASE WHEN @CreadoPermiso = 1 THEN 'sí' ELSE 'no (ya existía)' END);

/* Verificación: las dos tablas (vacías la primera vez) y el permiso, una sola vez. */
SELECT
    (SELECT COUNT(*) FROM dbo.TABLEROS_USUARIO) AS Usuarios_Con_Favoritos,
    (SELECT COUNT(*) FROM dbo.TABLEROS_FAVORITOS) AS Favoritos,
    (SELECT COUNT(*) FROM dbo.MENU WHERE LTRIM(RTRIM(Menu_Nombre)) COLLATE Latin1_General_CI_AI = N'Tableros') AS Permiso_Tableros;

/*
   Después de correrlo: recompilar la API y, en la VM, entrar a Tableros con un administrador y marcar una estrella:
   tiene que aparecer una fila en TABLEROS_USUARIO para ese usuario y sus favoritos en TABLEROS_FAVORITOS.
   Para darle la pantalla a un grupo: Gestionar grupos y permisos → el grupo → tildar "Tableros".
*/
