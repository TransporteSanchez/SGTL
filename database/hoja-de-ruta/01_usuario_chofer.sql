/*
   Hoja de ruta del chofer (24/10/2026): USUARIOS.ChoferID dice qué chofer es el usuario.

   El chofer es un usuario más del sistema, en un grupo que solo abre la Hoja de ruta. Para mostrarle solo sus
   viajes, su cuenta apunta a su ficha de Gestionar choferes. El vínculo es de la cuenta (no todo chofer tiene
   usuario) y se elige en Gestionar usuarios → Registrar / Editar usuario, campo "Chofer".

   Qué hace:
     - USUARIOS.ChoferID int NULL (vacío = el usuario no es chofer).
     - FK_Usuarios_Choferes: tiene que ser un chofer que existe. Los choferes no se borran (quedan "Eliminado"),
       así que la FK no traba nada.
     - UX_Usuarios_ChoferID: un chofer, una sola cuenta (índice único solo sobre los no vacíos).
   No cambia ningún dato. El EDMX no se regenera: la API lee y escribe la columna con SQL directo
   (HojaDeRutaController).

   Cómo correrlo (SSMS, base Transporte_Sanchez, avisando al equipo):
     1. Ejecutar tal cual (@Aplicar = 0): muestra qué falta, no cambia nada.
     2. Poner @Aplicar = 1 y ejecutar de nuevo.
   Es idempotente: si ya estaba aplicado, no hace nada.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = aplicar el cambio

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54500, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;
IF OBJECT_ID(N'dbo.USUARIOS', N'U') IS NULL
    THROW 54501, 'No existe la tabla dbo.USUARIOS.', 1;
IF OBJECT_ID(N'dbo.CHOFERES', N'U') IS NULL
    THROW 54502, 'No existe la tabla dbo.CHOFERES.', 1;

PRINT '--- Qué falta';
SELECT
    CASE WHEN COL_LENGTH('dbo.USUARIOS', 'ChoferID') IS NULL THEN 'Falta' ELSE 'Ya está' END AS Columna_ChoferID,
    CASE WHEN OBJECT_ID('dbo.FK_Usuarios_Choferes', 'F') IS NULL THEN 'Falta' ELSE 'Ya está' END AS FK_Usuarios_Choferes,
    CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.USUARIOS') AND name = 'UX_Usuarios_ChoferID')
         THEN 'Ya está' ELSE 'Falta' END AS UX_Usuarios_ChoferID;

IF @Aplicar = 0
BEGIN
    PRINT '';
    PRINT 'Solo diagnóstico: no se cambió nada. Si está bien, poner @Aplicar = 1 y volver a ejecutar.';
    RETURN;
END;

BEGIN TRANSACTION;

IF COL_LENGTH('dbo.USUARIOS', 'ChoferID') IS NULL
    ALTER TABLE dbo.USUARIOS ADD ChoferID int NULL;

IF OBJECT_ID('dbo.FK_Usuarios_Choferes', 'F') IS NULL
    EXEC(N'ALTER TABLE dbo.USUARIOS WITH CHECK ADD CONSTRAINT FK_Usuarios_Choferes FOREIGN KEY (ChoferID) REFERENCES dbo.CHOFERES(Chofer_ID)');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.USUARIOS') AND name = 'UX_Usuarios_ChoferID')
    EXEC(N'CREATE UNIQUE INDEX UX_Usuarios_ChoferID ON dbo.USUARIOS(ChoferID) WHERE ChoferID IS NOT NULL');

COMMIT TRANSACTION;

PRINT 'Listo: USUARIOS.ChoferID, FK_Usuarios_Choferes y UX_Usuarios_ChoferID.';
