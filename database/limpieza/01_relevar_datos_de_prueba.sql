/*
   Relevamiento de textos de prueba que se ven en pantalla (solo lectura).

   Busca en todas las columnas de texto de las tablas de dbo los valores con "prueba", "preuba", "claude", "test",
   "asd", "dfg" o "qwe", y muestra tabla, columna, valor, cuántas filas lo tienen y sus IDs. No mira la auditoría, los
   adjuntos ni los historiales, ni columnas con claves, imágenes o archivos (no muestra secretos).

   Usado el 23/10/2026 antes de la reunión con la profe: salieron los choferes 9 y 10 y el usuario 6 (ya corregidos) y
   textos de comprobantes (conceptos, condiciones y domicilios), que quedaron para después (§32 de
   docs/PENDIENTES-SISTEMA.md). Las correcciones se proponen aparte, dentro de BEGIN TRAN … ROLLBACK.
*/
SET NOCOUNT ON;
IF OBJECT_ID('tempdb..#Prueba') IS NOT NULL DROP TABLE #Prueba;
CREATE TABLE #Prueba (Tabla sysname, Columna sysname, Valor nvarchar(400), Filas int, IDs nvarchar(200));

DECLARE @sql nvarchar(max);
SELECT @sql = STRING_AGG(CAST(
    N'INSERT INTO #Prueba SELECT N''' + c.TABLE_NAME + N''', N''' + c.COLUMN_NAME + N''', LEFT(CAST(' + QUOTENAME(c.COLUMN_NAME) + N' AS nvarchar(400)), 400), COUNT(*), '
  + CASE WHEN pk.COLUMN_NAME IS NULL THEN N'NULL'
         ELSE N'LEFT(STRING_AGG(CAST(' + QUOTENAME(pk.COLUMN_NAME) + N' AS nvarchar(max)), N'', ''), 200)' END
  + N' FROM dbo.' + QUOTENAME(c.TABLE_NAME) + N' WHERE '
  + REPLACE(N'{c} LIKE N''%prueba%'' OR {c} LIKE N''%preuba%'' OR {c} LIKE N''%claude%'' OR {c} LIKE N''%test%'' OR {c} LIKE N''%asd%'' OR {c} LIKE N''%dfg%'' OR {c} LIKE N''%qwe%''',
            N'{c}', QUOTENAME(c.COLUMN_NAME))
  + N' GROUP BY LEFT(CAST(' + QUOTENAME(c.COLUMN_NAME) + N' AS nvarchar(400)), 400);'
  AS nvarchar(max)), NCHAR(10))
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES t
  ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
LEFT JOIN (SELECT k.TABLE_NAME, MIN(k.COLUMN_NAME) AS COLUMN_NAME
             FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
             JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k ON k.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND k.TABLE_NAME = tc.TABLE_NAME
            WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY' AND tc.TABLE_SCHEMA = 'dbo'
            GROUP BY k.TABLE_NAME HAVING COUNT(*) = 1) pk ON pk.TABLE_NAME = c.TABLE_NAME
WHERE c.TABLE_SCHEMA = 'dbo'
  AND c.DATA_TYPE IN ('char', 'nchar', 'varchar', 'nvarchar', 'text', 'ntext')
  AND c.TABLE_NAME NOT LIKE '%AUDITORIA%' AND c.TABLE_NAME NOT LIKE '%ADJUNTO%' AND c.TABLE_NAME NOT LIKE '%HISTORIAL%'
  AND c.TABLE_NAME NOT IN ('sysdiagrams', '__MigrationHistory')
  -- sin claves, imágenes ni archivos
  AND c.COLUMN_NAME NOT LIKE '%Contrase%' AND c.COLUMN_NAME NOT LIKE '%Clave%' AND c.COLUMN_NAME NOT LIKE '%Password%'
  AND c.COLUMN_NAME NOT LIKE '%Token%' AND c.COLUMN_NAME NOT LIKE '%Secret%' AND c.COLUMN_NAME NOT LIKE '%Hash%'
  AND c.COLUMN_NAME NOT LIKE '%Logo%' AND c.COLUMN_NAME NOT LIKE '%Base64%' AND c.COLUMN_NAME NOT LIKE '%Archivo%'
  AND c.COLUMN_NAME NOT LIKE '%Imagen%' AND c.COLUMN_NAME NOT LIKE '%Foto%' AND c.COLUMN_NAME NOT LIKE '%Evidencia%'
  AND c.COLUMN_NAME NOT LIKE '%Json%' AND c.COLUMN_NAME NOT LIKE '%Contenido%';

EXEC sp_executesql @sql;
SELECT * FROM #Prueba ORDER BY Tabla, Columna, Valor;
