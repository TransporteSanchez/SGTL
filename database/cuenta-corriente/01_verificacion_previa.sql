/* SOLO LECTURA. Ejecutar sobre la base de desarrollo seleccionada en SSMS.
   No crea objetos, no modifica registros y no muestra contraseñas.
   Guardar los resultados antes de evaluar 02_modelo_incremental.sql. */
SET NOCOUNT ON;
SELECT DB_NAME() AS BaseSeleccionada;

SELECT t.name AS Tabla, c.name AS Columna, ty.name AS Tipo,
       c.max_length AS LongitudBytes, c.precision, c.scale, c.is_nullable
FROM sys.tables t
JOIN sys.columns c ON c.object_id = t.object_id
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
WHERE SCHEMA_NAME(t.schema_id) = 'dbo'
  AND t.name IN ('CLIENTES','PROFORMAS','PROFORMA_DETALLE','VIAJES',
                'USUARIOS','GRUPOS','MENU','GRUPOS_MENU','GRUPOS_USUARIOS','AUDITORIA')
ORDER BY t.name, c.column_id;

SELECT name, start_value, current_value, increment, is_cycling
FROM sys.sequences WHERE schema_id = SCHEMA_ID('dbo');

SELECT Estado, Moneda, COUNT_BIG(*) AS Cantidad
FROM dbo.PROFORMAS GROUP BY Estado, Moneda;

SELECT Numero, COUNT_BIG(*) AS Cantidad
FROM dbo.PROFORMAS
WHERE Numero IS NOT NULL
GROUP BY Numero HAVING COUNT_BIG(*) > 1;

SELECT p.Proforma_ID, p.ClienteID
FROM dbo.PROFORMAS p LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = p.ClienteID
WHERE c.Cliente_ID IS NULL;

SELECT p.Proforma_ID, p.Estado, p.TotalGeneral, p.ImporteTotal,
       (SELECT COUNT_BIG(*) FROM dbo.PROFORMA_DETALLE d
        WHERE d.Proforma_ID = p.Proforma_ID) AS CantidadConceptos
FROM dbo.PROFORMAS p
WHERE p.Estado = N'Aceptada'
  AND (ISNULL(p.TotalGeneral, 0) <= 0
       OR p.TotalGeneral <> p.ImporteTotal
       OR ISNULL(p.Moneda, '') <> 'ARS'
       OR NOT EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE d WHERE d.Proforma_ID = p.Proforma_ID));

SELECT Detalle_ID, Proforma_ID, Cantidad, PrecioUnitario, DescuentoPct, IvaPct, Subtotal
FROM dbo.PROFORMA_DETALLE
WHERE Cantidad IS NULL OR Cantidad <= 0
   OR PrecioUnitario IS NULL OR PrecioUnitario < 0
   OR DescuentoPct IS NULL OR DescuentoPct NOT BETWEEN 0 AND 100
   OR IvaPct IS NULL OR IvaPct < 0
   OR Subtotal IS NULL OR Subtotal < 0;

SELECT Nombre_Usuario, COUNT_BIG(*) AS Cantidad
FROM dbo.USUARIOS GROUP BY Nombre_Usuario HAVING COUNT_BIG(*) > 1;

SELECT GrupoID, MenuID, COUNT_BIG(*) AS Cantidad
FROM dbo.GRUPOS_MENU GROUP BY GrupoID, MenuID HAVING COUNT_BIG(*) > 1;

SELECT GrupoID, UsuarioID, COUNT_BIG(*) AS Cantidad
FROM dbo.GRUPOS_USUARIOS GROUP BY GrupoID, UsuarioID HAVING COUNT_BIG(*) > 1;

SELECT t.name AS Tabla, i.name AS Indice, i.is_unique, i.filter_definition
FROM sys.tables t JOIN sys.indexes i ON i.object_id = t.object_id
WHERE SCHEMA_NAME(t.schema_id) = 'dbo'
  AND t.name IN ('PROFORMAS','PROFORMA_DETALLE','CLIENTES') AND i.index_id > 0;

SELECT fk.name, OBJECT_NAME(fk.parent_object_id) AS Tabla,
       OBJECT_NAME(fk.referenced_object_id) AS Referencia,
       fk.delete_referential_action_desc, fk.is_disabled, fk.is_not_trusted
FROM sys.foreign_keys fk
WHERE fk.parent_object_id IN (OBJECT_ID('dbo.PROFORMAS'), OBJECT_ID('dbo.PROFORMA_DETALLE'));

SELECT name AS ObjetoNuevoYaExistente FROM sys.tables
WHERE schema_id = SCHEMA_ID('dbo') AND name IN (
 'TIPOS_COMPROBANTE','COMPROBANTES_NUMERADORES','COMPROBANTES','COMPROBANTES_DETALLE',
 'COMPROBANTES_PROFORMAS','CUENTA_CORRIENTE_MOVIMIENTOS','CUENTA_CORRIENTE_APLICACIONES',
 'RECIBOS_FORMAS_PAGO','PROFORMAS_VIAJES','PERMISOS','GRUPOS_PERMISOS');
