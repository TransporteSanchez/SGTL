/*
   PROVINCIAS y LOCALIDADES: agregar la Ciudad Autónoma de Buenos Aires con sus barrios.

   Por qué: PROVINCIAS tenía las 23 provincias y no CABA (tampoco la cargó 01_completar_localidades.sql), así que no se
   podía cargar un cliente, un chofer, un origen o un destino, ni la empresa, con domicilio en la Ciudad (reporte de la
   VM de Gestionar empresa, 23/10/2026).

   Revisado antes (consulta del 23/10, solo lectura): ningún barrio de CABA estaba cargado por error en otra provincia.
   Los nombres que coinciden son localidades reales de otras provincias (Saavedra y San Nicolás de los Arroyos en Buenos
   Aires, Nueva Pompeya en Chaco, Villa Urquiza en Entre Ríos…): no se tocan.

   Qué hace: agrega la provincia "Ciudad Autónoma de Buenos Aires" (si no existe con ese nombre o como "Capital Federal",
   "Ciudad de Buenos Aires" o "CABA") y, como sus localidades, la Ciudad entera más los 48 barrios oficiales. Solo agrega
   lo que falta; no modifica ni borra nada.

   Cómo correrlo (SSMS, base Transporte_Sanchez, con backup previo y avisando al equipo):
     1. Ejecutar tal cual (@Aplicar = 0): solo muestra qué agregaría.
     2. Si está bien, poner @Aplicar = 1 y ejecutar de nuevo.
   Es idempotente: si ya estaba aplicado, no agrega nada.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = agregar la provincia y las localidades que faltan
DECLARE @Provincia nvarchar(50) = N'Ciudad Autónoma de Buenos Aires';

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54310, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

IF OBJECT_ID('tempdb..#Barrios') IS NOT NULL DROP TABLE #Barrios;
CREATE TABLE #Barrios (Nombre nvarchar(50) NOT NULL);
INSERT INTO #Barrios (Nombre) VALUES
(N'Ciudad Autónoma de Buenos Aires'),
(N'Agronomía'), (N'Almagro'), (N'Balvanera'), (N'Barracas'), (N'Belgrano'), (N'Boedo'), (N'Caballito'),
(N'Chacarita'), (N'Coghlan'), (N'Colegiales'), (N'Constitución'), (N'Flores'), (N'Floresta'), (N'La Boca'),
(N'La Paternal'), (N'Liniers'), (N'Mataderos'), (N'Monte Castro'), (N'Monserrat'), (N'Nueva Pompeya'), (N'Núñez'),
(N'Palermo'), (N'Parque Avellaneda'), (N'Parque Chacabuco'), (N'Parque Chas'), (N'Parque Patricios'),
(N'Puerto Madero'), (N'Recoleta'), (N'Retiro'), (N'Saavedra'), (N'San Cristóbal'), (N'San Nicolás'), (N'San Telmo'),
(N'Vélez Sársfield'), (N'Versalles'), (N'Villa Crespo'), (N'Villa del Parque'), (N'Villa Devoto'),
(N'Villa General Mitre'), (N'Villa Lugano'), (N'Villa Luro'), (N'Villa Ortúzar'), (N'Villa Pueyrredón'),
(N'Villa Real'), (N'Villa Riachuelo'), (N'Villa Santa Rita'), (N'Villa Soldati'), (N'Villa Urquiza');

-- La provincia, si ya está con alguno de los nombres que se usan para la Ciudad.
DECLARE @ProvID int = (
    SELECT TOP (1) Prov_ID FROM dbo.PROVINCIAS
    WHERE Nombre_Provincia COLLATE Latin1_General_CI_AI IN (
        N'Ciudad Autónoma de Buenos Aires' COLLATE Latin1_General_CI_AI, N'Capital Federal' COLLATE Latin1_General_CI_AI,
        N'Ciudad de Buenos Aires' COLLATE Latin1_General_CI_AI, N'CABA' COLLATE Latin1_General_CI_AI)
    ORDER BY Prov_ID);

/* ===================== 1. Diagnóstico ===================== */

PRINT '--- Provincia';
SELECT CASE WHEN @ProvID IS NULL THEN 'se agrega "' + @Provincia + '"'
            ELSE 'ya existe (Prov_ID ' + CAST(@ProvID AS varchar(10)) + ')' END AS Provincia,
       (SELECT COUNT(*) FROM dbo.PROVINCIAS) AS Provincias_Actuales;

PRINT '--- Localidades de la Ciudad';
SELECT b.Nombre,
       CASE WHEN @ProvID IS NOT NULL AND EXISTS (
                SELECT 1 FROM dbo.LOCALIDADES l WHERE l.ProvID = @ProvID
                AND l.Nombre_Localidad COLLATE Latin1_General_CI_AI = b.Nombre COLLATE Latin1_General_CI_AI)
            THEN 'ya existe' ELSE 'se agrega' END AS Estado
FROM #Barrios b
ORDER BY b.Nombre;

IF @Aplicar = 0
BEGIN
    PRINT '';
    PRINT 'Solo diagnóstico: no se cambió nada. Si el resultado está bien, poner @Aplicar = 1 y volver a ejecutar.';
    DROP TABLE #Barrios;
    RETURN;
END;

/* ===================== 2. Carga ===================== */

DECLARE @Agregadas int = 0;

BEGIN TRY
    BEGIN TRANSACTION;

    IF @ProvID IS NULL
    BEGIN
        INSERT INTO dbo.PROVINCIAS (Nombre_Provincia) VALUES (@Provincia);
        SET @ProvID = SCOPE_IDENTITY();
    END;

    INSERT INTO dbo.LOCALIDADES (Nombre_Localidad, ProvID)
    SELECT b.Nombre, @ProvID
    FROM #Barrios b
    WHERE NOT EXISTS (SELECT 1 FROM dbo.LOCALIDADES l WHERE l.ProvID = @ProvID
                      AND l.Nombre_Localidad COLLATE Latin1_General_CI_AI = b.Nombre COLLATE Latin1_General_CI_AI);
    SET @Agregadas = @@ROWCOUNT;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

PRINT CONCAT('Provincia: Prov_ID ', @ProvID, ' · localidades agregadas: ', @Agregadas);

/* ===================== 3. Verificación ===================== */

PRINT '--- Verificación (las dos columnas tienen que decir OK)';
SELECT
    CASE WHEN (SELECT COUNT(*) FROM dbo.PROVINCIAS WHERE Prov_ID = @ProvID) = 1 THEN 'OK' ELSE 'FALLA' END AS Provincia,
    CASE WHEN NOT EXISTS (SELECT 1 FROM #Barrios b WHERE NOT EXISTS (
                SELECT 1 FROM dbo.LOCALIDADES l WHERE l.ProvID = @ProvID
                AND l.Nombre_Localidad COLLATE Latin1_General_CI_AI = b.Nombre COLLATE Latin1_General_CI_AI))
         THEN 'OK' ELSE 'FALLA' END AS Localidades_Completas;

DROP TABLE #Barrios;
