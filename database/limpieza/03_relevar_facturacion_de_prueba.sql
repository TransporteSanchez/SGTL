/*
   Relevamiento antes de limpiar la facturación de prueba (solo lectura, 25/10/2026).

   Opción B de la §38 de docs/PENDIENTES-SISTEMA.md: borrar todas las proformas y todos los comprobantes de prueba,
   reiniciar la numeración y generar desde el sistema un juego de demo con los importes de la tabla de tarifas. Antes de
   armar el script que borra, este relevamiento muestra todo lo que hay y todo lo que depende de esos documentos, para no
   dejar nada colgado. No cambia nada.

   Muestra:
     1. Cuántas proformas y cuántos comprobantes hay, por tipo y estado.
     2. Todas las tablas que apuntan (por clave foránea) a las proformas o a los comprobantes, en cadena, con cuántas filas
        tienen.
     3. Columnas de otras tablas que guardan una proforma o un comprobante sin clave foránea (quedarían apuntando a algo
        que ya no existe), con cuántas filas tienen dato.
     4. Los viajes que hoy están en alguna proforma o comprobante, por estado y tipo de cliente (vuelven a Entregado o a
        Listo para facturar).
     5. La numeración de hoy: la secuencia de las proformas y los numeradores de los comprobantes.
     6. Disparadores (triggers) en esas tablas.
     7. Registros de Auditoría de proformas y comprobantes.

   Cómo correrlo: SSMS, base Transporte_Sanchez, tal cual. Pasarle a Claude el resultado de las siete partes.
*/
SET NOCOUNT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54800, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

/* ---------------------------------------------------------------- 1. Cuántos documentos hay */

PRINT '--- 1. Proformas y comprobantes';
SELECT N'Proformas' AS Que, ISNULL(Tipo_Proforma, N'Propia') AS Tipo, Estado, COUNT(*) AS Cantidad,
       MIN(Proforma_ID) AS Primer_ID, MAX(Proforma_ID) AS Ultimo_ID
FROM dbo.PROFORMAS
GROUP BY ISNULL(Tipo_Proforma, N'Propia'), Estado
ORDER BY Tipo, Estado;

SELECT N'Comprobantes' AS Que, Tipo, Estado, COUNT(*) AS Cantidad,
       MIN(NumeroCorrelativo) AS Primer_numero, MAX(NumeroCorrelativo) AS Ultimo_numero
FROM dbo.COMPROBANTES
GROUP BY Tipo, Estado
ORDER BY Tipo, Estado;

/* ---------------------------------------------------------------- 2. Lo que apunta a proformas y comprobantes */

PRINT '--- 2. Tablas que dependen (por clave foránea)';
IF OBJECT_ID('tempdb..#Dependencias') IS NOT NULL DROP TABLE #Dependencias;
-- Con la intercalación de la base: la de tempdb (SQL_Latin1_General_CP1_CI_AS) no se puede comparar con la de la base
-- (Modern_Spanish_CI_AS).
CREATE TABLE #Dependencias (Nivel int, Tabla sysname COLLATE DATABASE_DEFAULT, Columnas nvarchar(400) COLLATE DATABASE_DEFAULT, Apunta_a sysname COLLATE DATABASE_DEFAULT, Clave sysname COLLATE DATABASE_DEFAULT, Filas int NULL);

;WITH Base AS (
    SELECT OBJECT_ID(N'dbo.PROFORMAS') AS Objeto
    UNION ALL SELECT OBJECT_ID(N'dbo.COMPROBANTES')
),
Arbol AS (
    SELECT fk.object_id AS Clave, fk.parent_object_id AS Hija, fk.referenced_object_id AS Madre, 1 AS Nivel
    FROM sys.foreign_keys fk JOIN Base b ON fk.referenced_object_id = b.Objeto
    WHERE fk.parent_object_id <> fk.referenced_object_id
    UNION ALL
    SELECT fk.object_id, fk.parent_object_id, fk.referenced_object_id, a.Nivel + 1
    FROM sys.foreign_keys fk JOIN Arbol a ON fk.referenced_object_id = a.Hija
    WHERE fk.parent_object_id <> fk.referenced_object_id AND a.Nivel < 4
)
INSERT INTO #Dependencias (Nivel, Tabla, Columnas, Apunta_a, Clave)
SELECT MIN(a.Nivel), OBJECT_NAME(a.Hija),
       (SELECT STRING_AGG(COL_NAME(fc.parent_object_id, fc.parent_column_id), N', ')
        FROM sys.foreign_key_columns fc WHERE fc.constraint_object_id = a.Clave),
       OBJECT_NAME(a.Madre), OBJECT_NAME(a.Clave)
FROM Arbol a
GROUP BY a.Hija, a.Madre, a.Clave;

-- Las que apuntan a sí mismas (una nota de crédito a su comprobante, un movimiento a otro), para tenerlas en cuenta.
INSERT INTO #Dependencias (Nivel, Tabla, Columnas, Apunta_a, Clave)
SELECT 0, OBJECT_NAME(fk.parent_object_id),
       (SELECT STRING_AGG(COL_NAME(fc.parent_object_id, fc.parent_column_id), N', ')
        FROM sys.foreign_key_columns fc WHERE fc.constraint_object_id = fk.object_id),
       OBJECT_NAME(fk.referenced_object_id), fk.name
FROM sys.foreign_keys fk
WHERE fk.parent_object_id = fk.referenced_object_id
  AND OBJECT_NAME(fk.parent_object_id) IN (SELECT Tabla FROM #Dependencias UNION SELECT N'PROFORMAS' UNION SELECT N'COMPROBANTES');

DECLARE @tabla sysname, @sql nvarchar(max);
DECLARE tablas CURSOR LOCAL FAST_FORWARD FOR SELECT DISTINCT Tabla FROM #Dependencias;
OPEN tablas;
FETCH NEXT FROM tablas INTO @tabla;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'UPDATE #Dependencias SET Filas = (SELECT COUNT(*) FROM dbo.' + QUOTENAME(@tabla) + N') WHERE Tabla = @t;';
    EXEC sp_executesql @sql, N'@t sysname', @t = @tabla;
    FETCH NEXT FROM tablas INTO @tabla;
END;
CLOSE tablas;
DEALLOCATE tablas;

SELECT Nivel, Tabla, Columnas, Apunta_a, Clave, Filas FROM #Dependencias ORDER BY Nivel, Apunta_a, Tabla;

/* ---------------------------------------------------------------- 3. Referencias sin clave foránea */

PRINT '--- 3. Columnas que guardan una proforma o un comprobante sin clave foránea';
IF OBJECT_ID('tempdb..#Sueltas') IS NOT NULL DROP TABLE #Sueltas;
CREATE TABLE #Sueltas (Tabla sysname COLLATE DATABASE_DEFAULT, Columna sysname COLLATE DATABASE_DEFAULT, Filas_con_dato int NULL);

INSERT INTO #Sueltas (Tabla, Columna)
SELECT c.TABLE_NAME, c.COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS c
JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
WHERE c.TABLE_SCHEMA = 'dbo'
  AND (c.COLUMN_NAME LIKE N'%Proforma%' OR c.COLUMN_NAME LIKE N'%Comprobante%' OR c.COLUMN_NAME LIKE N'%Factura%' OR c.COLUMN_NAME LIKE N'%Recibo%')
  AND c.DATA_TYPE IN ('int', 'bigint')
  AND c.TABLE_NAME NOT IN (N'PROFORMAS', N'COMPROBANTES')
  AND NOT EXISTS (SELECT 1 FROM sys.foreign_key_columns fc
                  WHERE fc.parent_object_id = OBJECT_ID(N'dbo.' + QUOTENAME(c.TABLE_NAME))
                    AND COL_NAME(fc.parent_object_id, fc.parent_column_id) = c.COLUMN_NAME);

DECLARE @columna sysname;
DECLARE sueltas CURSOR LOCAL FAST_FORWARD FOR SELECT Tabla, Columna FROM #Sueltas;
OPEN sueltas;
FETCH NEXT FROM sueltas INTO @tabla, @columna;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'UPDATE #Sueltas SET Filas_con_dato = (SELECT COUNT(*) FROM dbo.' + QUOTENAME(@tabla) + N' WHERE ' + QUOTENAME(@columna)
             + N' IS NOT NULL) WHERE Tabla = @t AND Columna = @c;';
    EXEC sp_executesql @sql, N'@t sysname, @c sysname', @t = @tabla, @c = @columna;
    FETCH NEXT FROM sueltas INTO @tabla, @columna;
END;
CLOSE sueltas;
DEALLOCATE sueltas;

SELECT Tabla, Columna, Filas_con_dato FROM #Sueltas ORDER BY Tabla, Columna;

/* ---------------------------------------------------------------- 4. Viajes que están en un documento */

PRINT '--- 4. Viajes en proformas o comprobantes';
SELECT v.Estado, c.Tipo_Cliente, COUNT(*) AS Viajes, STRING_AGG(CONVERT(nvarchar(11), v.Viaje_ID), N', ') AS IDs
FROM dbo.VIAJES v
JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
WHERE EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ViajeID = v.Viaje_ID)
   OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE d WHERE UPPER(LTRIM(RTRIM(ISNULL(d.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID))
   OR EXISTS (SELECT 1 FROM dbo.COMPROBANTES_DETALLE cd WHERE UPPER(LTRIM(RTRIM(ISNULL(cd.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID))
GROUP BY v.Estado, c.Tipo_Cliente
ORDER BY v.Estado, c.Tipo_Cliente;

-- Los demás viajes, por estado (los que quedan libres para la demo).
SELECT v.Estado, c.Tipo_Cliente, COUNT(*) AS Viajes_sin_documento, STRING_AGG(CONVERT(nvarchar(11), v.Viaje_ID), N', ') AS IDs
FROM dbo.VIAJES v
JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
WHERE NOT EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ViajeID = v.Viaje_ID)
  AND NOT EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE d WHERE UPPER(LTRIM(RTRIM(ISNULL(d.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID))
  AND NOT EXISTS (SELECT 1 FROM dbo.COMPROBANTES_DETALLE cd WHERE UPPER(LTRIM(RTRIM(ISNULL(cd.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID))
GROUP BY v.Estado, c.Tipo_Cliente
ORDER BY v.Estado, c.Tipo_Cliente;

/* ---------------------------------------------------------------- 5. Numeración de hoy */

PRINT '--- 5. Numeración';
SELECT name AS Secuencia, CONVERT(bigint, start_value) AS Empieza_en, CONVERT(bigint, current_value) AS Valor_actual
FROM sys.sequences WHERE name LIKE N'SEQ[_]%';

IF OBJECT_ID(N'dbo.FACTURACION_NUMERADORES', N'U') IS NOT NULL
    SELECT n.Numerador_ID, n.Nombre, n.UltimoNumero, n.Activo,
           (SELECT STRING_AGG(CONVERT(nvarchar(10), ft.Tipo), N', ') FROM dbo.FACTURACION_TIPOS_COMPROBANTE ft WHERE ft.NumeradorID = n.Numerador_ID) AS Tipos_que_lo_usan
    FROM dbo.FACTURACION_NUMERADORES n ORDER BY n.Numerador_ID;

IF OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES', N'U') IS NOT NULL
    SELECT Tipo, UltimoNumero FROM dbo.COMPROBANTES_NUMERADORES ORDER BY Tipo;

/* ---------------------------------------------------------------- 6. Disparadores */

PRINT '--- 6. Disparadores';
SELECT OBJECT_NAME(tr.parent_id) AS Tabla, tr.name AS Disparador, tr.is_disabled AS Deshabilitado
FROM sys.triggers tr
WHERE tr.parent_class = 1
  AND (OBJECT_NAME(tr.parent_id) IN (N'PROFORMAS', N'COMPROBANTES', N'VIAJES') OR OBJECT_NAME(tr.parent_id) IN (SELECT Tabla FROM #Dependencias))
ORDER BY Tabla;

/* ---------------------------------------------------------------- 7. Auditoría de estos documentos */

PRINT '--- 7. Auditoría';
SELECT Entidad, COUNT(*) AS Registros, MIN(Fecha) AS Desde, MAX(Fecha) AS Hasta
FROM dbo.AUDITORIA
WHERE Entidad LIKE N'PROFORMA%' OR Entidad LIKE N'COMPROBANTE%' OR Entidad LIKE N'CUENTA[_]CORRIENTE%' OR Entidad LIKE N'RECIBO%'
GROUP BY Entidad
ORDER BY Entidad;
