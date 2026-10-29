/*
   Qué limpiar en viajes antes de la reunión del jueves 29/10 (28/10/2026, Rocío): SOLO LECTURA, no cambia nada.

   Junta lo que el profe ve primero en viajes y no parece real o no está cerrado (§41, puntos 16, 21, 34 y 37 de
   docs/PENDIENTES-SISTEMA.md). Qué hacer con cada resultado: docs/equipo/INSTRUCTIVO-LIMPIEZA-VIAJES.md. Lo complementan,
   aparte:
     database/verificacion/02_viajes_superpuestos.sql   el mismo camión o chofer en viajes que se pisan;
     database/limpieza/01_relevar_datos_de_prueba.sql   los textos con "prueba", "claude", "test"…

   Devuelve ocho tablas; la primera columna dice cuál es y la última, qué hacer:
     1. Viajes con fecha pasada que siguen Registrados o En viaje.
     2. Viajes abiertos con un chofer o un camión que no corresponde (inactivo, eliminado o un directo sin chofer).
     3. Viajes sin importe, que no estén cancelados.
     4. Clientes con plataforma (solo QUICKFOOD tiene que tenerla), con sus viajes por estado.
     5. Todos los clientes, con sus viajes, para revisar los nombres a ojo.
     6. Todos los choferes, con sus viajes y su usuario.
     7. Todos los camiones, con lo que les falta para la tarifa y el control interno.
     8. El precio del gasoil vigente.
   Los nombres de choferes y clientes salen para revisarlos: el resultado no se guarda en el repo.

   Cómo correrlo: SSMS, base Transporte_Sanchez, tal cual. Se puede volver a correr al terminar: las tablas 1 a 4 tienen que
   quedar vacías o con lo que se decidió dejar.
*/
SET NOCOUNT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54960, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;
IF OBJECT_ID(N'dbo.VIAJE_GASTOS', N'U') IS NULL OR OBJECT_ID(N'dbo.PRECIOS_GASOIL', N'U') IS NULL
   OR COL_LENGTH(N'dbo.USUARIOS', N'ChoferID') IS NULL OR COL_LENGTH(N'dbo.VIAJES', N'Importe') IS NULL
    THROW 54961, 'Faltan scripts: correr database/verificacion/01_scripts_corridos.sql y los que digan "Falta correrlo".', 1;

-- Hoy en Argentina (la base está en UTC; las fechas de los viajes, en hora de Argentina).
DECLARE @Hoy date = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS date);

-- 1. Fecha pasada sin cerrar: terminó antes de hoy y sigue Registrado o En viaje. Lo que dice "Que_hacer" sigue el flujo de
-- la pantalla (Cambiar estado): un directo pasa de Registrado a En viaje y de ahí a Entregado, con la evidencia; uno con
-- plataforma, a Listo para facturar con sus números. Eliminar solo se puede en Registrado, fuera de una proforma, sin gastos
-- del chofer y si no viene de un presupuesto; si no, se cancela con motivo.
SELECT N'1. Fecha pasada sin cerrar' AS Que, v.Viaje_ID, ISNULL(c.Razon_Social, N'') AS Cliente,
       CASE WHEN c.Tipo_Cliente = N'Con_plataforma' THEN N'Con plataforma' ELSE N'Directo' END AS Tipo,
       ISNULL(v.Estado, N'Registrado') AS Estado, v.Fecha_Inicio, v.Fecha_Fin,
       ISNULL(ch.Apellido + N', ' + ch.Nombre, N'—') AS Chofer, ISNULL(ca.Dominio, N'—') AS Camion,
       g.Gastos, ps.Presupuesto_ID AS Del_presupuesto, pf.Numero AS Proforma, pf.Estado AS Estado_proforma,
       CASE
           WHEN pf.Proforma_ID IS NOT NULL THEN N'Está en la proforma ' + ISNULL(NULLIF(pf.Numero, N''), N'#' + CONVERT(nvarchar(11), pf.Proforma_ID))
               + N' (' + pf.Estado + N'): resolverlo desde la proforma'
           WHEN c.Tipo_Cliente = N'Con_plataforma'
               THEN N'Si se hizo: completar transporte, remito y entrega y pasarlo a Listo para facturar. Si no: '
                    + CASE WHEN e.Se_puede_eliminar = 1 THEN N'eliminarlo' ELSE N'cancelarlo con motivo' END
           WHEN v.Estado = N'En_viaje'
               THEN N'Si se entregó: Entregado (fecha, resultado y evidencia). Si llegó y no había carga: Sin carga. Si no se hizo: '
                    + N'volverlo a Registrado y ' + CASE WHEN g.Gastos = 0 AND ps.Presupuesto_ID IS NULL THEN N'eliminarlo' ELSE N'cancelarlo con motivo' END
           ELSE N'Si se hizo: En viaje y después Entregado (fecha, resultado y evidencia). Si no: '
                + CASE WHEN e.Se_puede_eliminar = 1 THEN N'eliminarlo' ELSE N'cancelarlo con motivo' END
       END AS Que_hacer
FROM dbo.VIAJES v
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
LEFT JOIN dbo.CHOFERES ch ON ch.Chofer_ID = v.ChoferID
LEFT JOIN dbo.CAMIONES ca ON ca.Camion_ID = v.CamionID
OUTER APPLY (SELECT COUNT(*) AS Gastos FROM dbo.VIAJE_GASTOS x WHERE x.Viaje_ID = v.Viaje_ID) g
OUTER APPLY (SELECT TOP (1) p.Presupuesto_ID FROM dbo.PRESUPUESTOS p WHERE p.ViajeID = v.Viaje_ID) ps
-- La proforma que lo incluye (la misma búsqueda que la API: ViajesController.OUTER_APPLY_PROFORMA).
OUTER APPLY (SELECT TOP (1) p.Proforma_ID, p.Numero, p.Estado FROM dbo.PROFORMAS p
             WHERE p.Estado <> 'Anulada' AND (
                   EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = p.Proforma_ID AND pv.ViajeID = v.Viaje_ID)
                OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd WHERE pd.Proforma_ID = p.Proforma_ID
                           AND UPPER(LTRIM(RTRIM(ISNULL(pd.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID)))
             ORDER BY p.Proforma_ID DESC) pf
CROSS APPLY (SELECT CASE WHEN ISNULL(v.Estado, N'Registrado') = N'Registrado' AND ps.Presupuesto_ID IS NULL AND g.Gastos = 0
                          AND pf.Proforma_ID IS NULL THEN 1 ELSE 0 END AS Se_puede_eliminar) e
WHERE ISNULL(v.Estado, N'Registrado') IN (N'Registrado', N'En_viaje') AND v.Fecha_Fin < @Hoy
ORDER BY v.Fecha_Inicio, v.Viaje_ID;

-- 2. Abiertos (Registrado o En viaje, de cualquier fecha) con un chofer o un camión que la pantalla ya no ofrece: al editarlos
-- da error. Con plataforma el chofer puede quedar sin asignar.
SELECT N'2. Chofer o camión que no corresponde' AS Que, v.Viaje_ID, ISNULL(c.Razon_Social, N'') AS Cliente,
       ISNULL(v.Estado, N'Registrado') AS Estado, v.Fecha_Inicio,
       ISNULL(ch.Apellido + N', ' + ch.Nombre, N'—') AS Chofer, ch.EstadoChofer, ISNULL(ca.Dominio, N'—') AS Camion, ca.EstadoCamion,
       q.Que_hacer
FROM dbo.VIAJES v
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
LEFT JOIN dbo.CHOFERES ch ON ch.Chofer_ID = v.ChoferID
LEFT JOIN dbo.CAMIONES ca ON ca.Camion_ID = v.CamionID
CROSS APPLY (SELECT CASE
        WHEN ISNULL(c.Tipo_Cliente, N'Directo') <> N'Con_plataforma' AND ch.Chofer_ID IS NULL THEN N'Directo sin chofer: asignarle uno en Editar viaje'
        WHEN ch.EstadoChofer = N'Eliminado' THEN N'Chofer eliminado: asignarle otro en Editar viaje'
        WHEN ch.Chofer_ID IS NOT NULL AND ISNULL(ch.EstadoChofer, N'Activo') <> N'Activo' THEN N'Chofer inactivo: asignarle otro en Editar viaje'
        WHEN ca.Camion_ID IS NULL THEN N'Sin camión: asignarle uno en Editar viaje'
        WHEN ISNULL(ca.EstadoCamion, N'Activo') <> N'Activo' THEN N'Camión inactivo: asignarle otro en Editar viaje (puede cambiar el importe)'
    END AS Que_hacer) q
WHERE ISNULL(v.Estado, N'Registrado') IN (N'Registrado', N'En_viaje') AND q.Que_hacer IS NOT NULL
ORDER BY v.Fecha_Inicio, v.Viaje_ID;

-- 3. Sin importe: en el listado y en la proforma se ven sin precio. Los que vienen de un presupuesto toman su importe.
SELECT N'3. Sin importe' AS Que, v.Viaje_ID, ISNULL(c.Razon_Social, N'') AS Cliente, ISNULL(v.Estado, N'Registrado') AS Estado,
       v.Fecha_Inicio, RTRIM(ISNULL(v.Distancia_KM, N'')) AS Km, v.TarifarioID, ISNULL(ca.Dominio, N'—') AS Camion,
       NULLIF(LTRIM(RTRIM(ISNULL(ca.Tipo, N''))), N'') AS Tipo_camion, ps.Presupuesto_ID AS Del_presupuesto,
       CASE
           WHEN ps.Presupuesto_ID IS NOT NULL THEN N'Viene del presupuesto #' + CONVERT(nvarchar(11), ps.Presupuesto_ID) + N': revisar que se vea con su importe'
           WHEN v.Estado = N'Facturado' THEN N'Facturado: no se edita (queda como está)'
           WHEN LTRIM(RTRIM(ISNULL(v.Distancia_KM, N''))) IN (N'', N'0') THEN N'Sin km: cargarlos en Editar viaje y guardar'
           WHEN NULLIF(LTRIM(RTRIM(ISNULL(ca.Tipo, N''))), N'') IS NULL THEN N'El camión no tiene tipo: elegirlo en Gestionar camiones y después guardar el viaje'
           ELSE N'Sin tarifa: elegir Fija o Por km en Editar viaje y guardar'
       END AS Que_hacer
FROM dbo.VIAJES v
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
LEFT JOIN dbo.CAMIONES ca ON ca.Camion_ID = v.CamionID
OUTER APPLY (SELECT TOP (1) p.Presupuesto_ID FROM dbo.PRESUPUESTOS p WHERE p.ViajeID = v.Viaje_ID) ps
WHERE v.Importe IS NULL AND ISNULL(v.Estado, N'') <> N'Cancelado'
ORDER BY v.Fecha_Inicio, v.Viaje_ID;

-- 4. Con plataforma: solo QUICKFOOD (punto 16). Antes de pasar otro a cliente directo, mirar sus viajes: el flujo cambia
-- (con plataforma, Registrado → Listo para facturar; directo, Registrado → En viaje → Entregado).
SELECT N'4. Clientes con plataforma' AS Que, c.Cliente_ID, c.Razon_Social, c.Nombre_Comercial, c.Tipo_Cliente, c.PlataformaID,
       CONVERT(bit, ISNULL(c.EstadoCliente, 0)) AS Activo,
       (SELECT STRING_AGG(x.Estado + N': ' + CONVERT(nvarchar(11), x.N), N' · ')
          FROM (SELECT ISNULL(Estado, N'Registrado') AS Estado, COUNT(*) AS N FROM dbo.VIAJES WHERE ClienteID = c.Cliente_ID
                GROUP BY ISNULL(Estado, N'Registrado')) x) AS Viajes_por_estado,
       (SELECT STRING_AGG(CONVERT(nvarchar(max), Viaje_ID), N', ') FROM dbo.VIAJES WHERE ClienteID = c.Cliente_ID) AS Viajes,
       CASE WHEN UPPER(c.Razon_Social + N' ' + ISNULL(c.Nombre_Comercial, N'')) LIKE N'%QUICK%FOOD%' THEN N'Correcto'
            WHEN c.Tipo_Cliente <> N'Con_plataforma' THEN N'Tiene plataforma asignada pero es directo: revisar'
            ELSE N'Revisar: solo QUICKFOOD tiene plataforma (Editar cliente → Tipo)' END AS Que_hacer
FROM dbo.CLIENTES c
WHERE c.Tipo_Cliente = N'Con_plataforma' OR c.PlataformaID IS NOT NULL
ORDER BY c.Razon_Social;

-- 5. Todos los clientes: el nombre que ve el profe. "distribuidora-powerful" no lo detecta el relevamiento de textos de prueba
-- (§38): se marca lo que empieza en minúscula o no tiene CUIT; el resto, a ojo.
SELECT N'5. Clientes' AS Que, c.Cliente_ID, c.Razon_Social, c.Nombre_Comercial,
       CASE WHEN c.Tipo_Cliente = N'Con_plataforma' THEN N'Con plataforma' ELSE N'Directo' END AS Tipo,
       CONVERT(bit, ISNULL(c.EstadoCliente, 0)) AS Activo, n.Viajes, n.Abiertos,
       NULLIF(CONCAT(
           CASE WHEN ASCII(LEFT(LTRIM(c.Razon_Social), 1)) BETWEEN 97 AND 122 THEN N'Empieza en minúscula: ¿nombre real? ' END,
           CASE WHEN LTRIM(RTRIM(ISNULL(c.CUIT_Cliente, N''))) = N'' THEN N'Sin CUIT. ' END,
           CASE WHEN ISNULL(c.EstadoCliente, 0) = 0 AND n.Abiertos > 0 THEN N'Inactivo con viajes abiertos. ' END), N'') AS Para_revisar
FROM dbo.CLIENTES c
CROSS APPLY (SELECT COUNT(*) AS Viajes,
                    ISNULL(SUM(CASE WHEN ISNULL(v.Estado, N'Registrado') IN (N'Registrado', N'En_viaje') THEN 1 ELSE 0 END), 0) AS Abiertos
             FROM dbo.VIAJES v WHERE v.ClienteID = c.Cliente_ID) n
ORDER BY CASE WHEN ASCII(LEFT(LTRIM(c.Razon_Social), 1)) BETWEEN 97 AND 122 THEN 0 ELSE 1 END, c.Razon_Social;

-- 6. Todos los choferes. Se marcan los apellidos del equipo que quedaron de las pruebas (§41, punto 21): se cambian por
-- nombres inventados y creíbles en Editar chofer (sus viajes los siguen teniendo).
SELECT N'6. Choferes' AS Que, ch.Chofer_ID, ch.Apellido, ch.Nombre, ISNULL(ch.EstadoChofer, N'Activo') AS Estado,
       CONVERT(bit, CASE WHEN ch.EstadoChofer = N'Eliminado' THEN 1 ELSE 0 END) AS Eliminado,
       (SELECT STRING_AGG(u.Nombre_Usuario, N', ') FROM dbo.USUARIOS u WHERE u.ChoferID = ch.Chofer_ID) AS Usuario,
       n.Viajes, n.Abiertos,
       CASE WHEN ch.Apellido LIKE N'%Montenegro%' OR ch.Apellido LIKE N'%Godoy%' OR ch.Apellido LIKE N'Pai%' OR ch.Apellido LIKE N'%Nuvoli%'
            THEN N'Apellido del equipo: cambiarlo por uno inventado (Editar chofer)' END AS Para_revisar
FROM dbo.CHOFERES ch
CROSS APPLY (SELECT COUNT(*) AS Viajes,
                    ISNULL(SUM(CASE WHEN ISNULL(v.Estado, N'Registrado') IN (N'Registrado', N'En_viaje') THEN 1 ELSE 0 END), 0) AS Abiertos
             FROM dbo.VIAJES v WHERE v.ChoferID = ch.Chofer_ID) n
ORDER BY CASE WHEN ch.Apellido LIKE N'%Montenegro%' OR ch.Apellido LIKE N'%Godoy%' OR ch.Apellido LIKE N'Pai%'
                   OR ch.Apellido LIKE N'%Nuvoli%' THEN 0 ELSE 1 END, ch.Apellido, ch.Nombre;

-- 7. Todos los camiones: el tipo (sin él no hay tarifa), el kilometraje inicial con su fecha y el consumo (sin ellos, Ver
-- detalle del viaje dice "Falta el consumo del camión" y no hay combustible ni margen), y la ITV.
SELECT N'7. Camiones' AS Que, ca.Camion_ID, ca.Dominio, ca.Marca, ca.Modelo, ca.[AñoModelo] AS Anio_modelo, ca.Tipo,
       ISNULL(ca.EstadoCamion, N'Activo') AS Estado, ca.FechaITV, ca.Km_Inicial, ca.Fecha_Km_Inicial, ca.Consumo_L_100km, n.Viajes,
       NULLIF(CONCAT(
           CASE WHEN LTRIM(RTRIM(ISNULL(ca.Tipo, N''))) = N'' THEN N'Falta el tipo (sin él no hay tarifa). ' END,
           CASE WHEN ca.Km_Inicial IS NULL OR ca.Fecha_Km_Inicial IS NULL THEN N'Falta el kilometraje inicial y su fecha. ' END,
           CASE WHEN ca.Consumo_L_100km IS NULL THEN N'Falta el consumo. ' END,
           CASE WHEN ISNULL(ca.EstadoCamion, N'Activo') = N'Activo' AND ca.FechaITV < @Hoy
                THEN N'ITV vencida el ' + CONVERT(nvarchar(10), ca.FechaITV, 103) + N' (el dashboard la marca). ' END), N'') AS Que_falta
FROM dbo.CAMIONES ca
CROSS APPLY (SELECT COUNT(*) AS Viajes FROM dbo.VIAJES v WHERE v.CamionID = ca.Camion_ID) n
ORDER BY ISNULL(ca.EstadoCamion, N'Activo'), ca.Dominio;

-- 8. El precio del gasoil con que se estima el combustible de los viajes de hoy (Gestionar camiones).
SELECT N'8. Precio del gasoil' AS Que, p.Vigente_Desde, p.Precio_Litro, N'Revisar que sea el actual' AS Que_hacer
FROM (SELECT TOP (1) Vigente_Desde, Precio_Litro FROM dbo.PRECIOS_GASOIL WHERE Vigente_Desde <= @Hoy
      ORDER BY Vigente_Desde DESC, Precio_ID DESC) p
UNION ALL
SELECT N'8. Precio del gasoil', NULL, NULL, N'Falta cargarlo: Gestionar camiones → Cambiar precio del gasoil'
WHERE NOT EXISTS (SELECT 1 FROM dbo.PRECIOS_GASOIL WHERE Vigente_Desde <= @Hoy);
