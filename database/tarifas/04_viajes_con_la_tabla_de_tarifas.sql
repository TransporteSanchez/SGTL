/*
   Deja los viajes y los presupuestos como si siempre hubiera estado la tabla de tarifas, y saca las tarifas de antes
   (fijas por cliente y recorrido, y bandas por km, que eran de prueba). Decisión de Rocío, 25/10/2026.

   Correr DESPUÉS de 02_tarifario_por_vehiculo.sql y 03_cargar_tarifario_agosto_2026.sql, con la API nueva compilada y
   después de elegir en Gestionar camiones el tipo de los camiones que 03 no pudo deducir (sin tipo, sus viajes no se
   pueden calcular y el script no aplica nada).

   Qué pasa con cada viaje:
     - Facturado o en una proforma generada, aceptada o facturada: conserva el importe que tiene, que es el facturado.
     - Generado desde un presupuesto aceptado: conserva el importe del presupuesto (el que aceptó el cliente).
     - De antes del 01/08/2026 (no hay tabla para esa fecha): conserva su importe.
     - El resto se recalcula con la tabla vigente en su inicio (la propia de su cliente o la general), igual que un viaje
       que se carga desde ahora: tarifa por km si tenía una por km; si no, tarifa fija (con 1ª o 2ª vuelta según si el
       camión tiene otro viaje antes ese día; más de 250 km, la fija de 250 más el excedente por km). Si ya tenía falso
       flete o estadía, se suman igual que en la pantalla.
     - Todos quedan con la tabla de tarifas (TarifarioID y fija o por km) y dejan de apuntar a las tarifas viejas
       (TarifaFijaID y TarifaKmID en NULL). Los que conservan su importe lo dicen en el detalle ("Importe facturado",
       "Presupuesto #N", "Importe anterior a la tabla de tarifas").
   Presupuestos: los que usaban una tarifa vieja pasan a la tabla general (tarifarioId) y conservan su importe, que ya se
   le ofreció al cliente.
   Tarifas viejas: se borran las filas de TARIFAS_FIJAS y TARIFAS_KM. Las tablas quedan creadas y vacías porque el modelo de
   Entity Framework (EDMX) las incluye y no se regenera.

   Las proformas y facturas ya emitidas no cambian (guardan sus propios importes). Los borradores de proformas propias
   conservan los precios que trajeron; en un borrador de Rukas, "Volver a controlar" compara con el importe nuevo.

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo):
     1. Ejecutar tal cual (@Aplicar = 0): muestra qué pasa con cada viaje, los importes nuevos y lo que falta.
     2. Si está bien, poner @Aplicar = 1 y ejecutar de nuevo. Revisar las cantidades y ejecutar COMMIT; o ROLLBACK;.
        Se puede volver a correr: lo ya pasado a la tabla no se recalcula.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = aplicar y dejar la transacción abierta
DECLARE @Usuario nvarchar(20) = N'script tarifario 04';
DECLARE @Ahora datetime = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime);

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54620, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

IF OBJECT_ID(N'dbo.TARIFARIO_CLIENTES', N'U') IS NULL OR COL_LENGTH('dbo.VIAJES', 'Tarifa_Modo') IS NULL
    THROW 54621, 'Primero correr database/tarifas/02_tarifario_por_vehiculo.sql.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.TARIFARIOS WHERE Para_Todos = 1)
    THROW 54622, 'Primero correr database/tarifas/03_cargar_tarifario_agosto_2026.sql (carga la tabla general).', 1;

DECLARE @General int = (SELECT TOP (1) Tarifario_ID FROM dbo.TARIFARIOS WHERE Para_Todos = 1 ORDER BY Vigente_Desde);

/* ---------------------------------------------------------------- Plan de cada viaje */

IF OBJECT_ID('tempdb..#Plan') IS NOT NULL DROP TABLE #Plan;

;WITH Base AS (
    SELECT v.Viaje_ID, v.ClienteID, v.CamionID, v.Fecha_Inicio, v.Estado, v.Importe, v.Falso_Flete, v.Estadia_Modulos,
           TRY_CAST(REPLACE(RTRIM(v.Distancia_KM), ',', '.') AS decimal(18, 2)) AS Km,
           CASE WHEN v.TarifaKmID IS NOT NULL OR v.Tarifa_Modo = 'Km' THEN 'Km' ELSE 'Fija' END AS Modo,
           (SELECT TOP (1) ps.Presupuesto_ID FROM dbo.PRESUPUESTOS ps
            WHERE ps.ViajeID = v.Viaje_ID AND ps.Estado = 'Aceptado' ORDER BY ps.Presupuesto_ID DESC) AS Presupuesto_ID,
           CASE WHEN v.Estado = 'Facturado' OR EXISTS (
                    SELECT 1 FROM dbo.PROFORMAS p
                    WHERE p.Estado IN ('Generada', 'Aceptada', 'Facturada') AND (
                          EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = p.Proforma_ID AND pv.ViajeID = v.Viaje_ID)
                       OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd WHERE pd.Proforma_ID = p.Proforma_ID
                                  AND UPPER(LTRIM(RTRIM(ISNULL(pd.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID))))
                THEN 1 ELSE 0 END AS Emitido,
           ISNULL(RTRIM(c.Tipo), N'') AS Tipo, TRY_CAST(c.AñoModelo AS int) AS Anio, RTRIM(c.Dominio) AS Dominio,
           t.Tarifario_ID, t.Nombre, t.Anio_Corte, t.Km_Banda1, t.Km_Banda2, t.Km_Banda3, t.Estadia_Modulo, t.Falso_Flete_Porcentaje
    FROM dbo.VIAJES v
    LEFT JOIN dbo.CAMIONES c ON c.Camion_ID = v.CamionID
    -- La tabla del viaje: la propia de su cliente vigente en el inicio o, si no tiene, la general (como la API).
    OUTER APPLY (SELECT TOP (1) x.* FROM dbo.TARIFARIOS x
                 WHERE x.Vigente_Desde <= CAST(v.Fecha_Inicio AS date)
                   AND (x.Para_Todos = 1 OR EXISTS (SELECT 1 FROM dbo.TARIFARIO_CLIENTES tc
                                                    WHERE tc.Tarifario_ID = x.Tarifario_ID AND tc.ClienteID = v.ClienteID))
                 ORDER BY x.Para_Todos, x.Vigente_Desde DESC) t
    -- Lo ya pasado a la tabla por este script (o cargado con la API nueva) no se toca.
    WHERE v.TarifaFijaID IS NOT NULL OR v.TarifaKmID IS NOT NULL OR v.TarifarioID IS NULL
),
Clasificado AS (
    SELECT b.*,
           CASE WHEN b.Emitido = 1 THEN N'Conserva: facturado o en una proforma emitida'
                WHEN b.Presupuesto_ID IS NOT NULL THEN N'Conserva: importe del presupuesto'
                WHEN b.Tarifario_ID IS NULL THEN N'Conserva: anterior a la tabla de tarifas'
                ELSE N'Se recalcula con la tabla' END AS Que_pasa,
           tv.Valor_Banda1_Vuelta1, tv.Valor_Banda1_Vuelta2, tv.Valor_Banda2, tv.Valor_Banda3, tv.Valor_Km,
           CASE WHEN b.Modo = 'Fija' AND b.Km <= b.Km_Banda1 THEN
                CASE WHEN EXISTS (SELECT 1 FROM dbo.VIAJES o WHERE o.CamionID = b.CamionID AND o.Viaje_ID <> b.Viaje_ID
                                  AND CAST(o.Fecha_Inicio AS date) = CAST(b.Fecha_Inicio AS date) AND o.Fecha_Inicio < b.Fecha_Inicio)
                     THEN 2 ELSE 1 END END AS Vuelta
    FROM Base b
    OUTER APPLY (SELECT TOP (1) * FROM dbo.TARIFARIO_VALORES x
                 WHERE x.Tarifario_ID = b.Tarifario_ID AND x.Tipo_Vehiculo = b.Tipo
                   AND x.Modelo_Nuevo = CASE WHEN b.Anio >= b.Anio_Corte THEN 1 ELSE 0 END) tv
),
Calculado AS (
    SELECT k.*,
           CASE WHEN k.Que_pasa <> N'Se recalcula con la tabla' THEN NULL
                WHEN k.Valor_Km IS NULL THEN N'El camión ' + ISNULL(k.Dominio, N'?') + N' no tiene un tipo de la tabla: elegilo en Gestionar camiones.'
                WHEN ISNULL(k.Km, 0) <= 0 THEN N'El viaje no tiene km.' END AS Falta,
           CASE WHEN k.Modo = 'Km' THEN ROUND(k.Valor_Km * k.Km, 2)
                WHEN k.Km <= k.Km_Banda1 THEN CASE WHEN k.Vuelta = 2 THEN k.Valor_Banda1_Vuelta2 ELSE k.Valor_Banda1_Vuelta1 END
                WHEN k.Km <= k.Km_Banda2 THEN k.Valor_Banda2
                WHEN k.Km <= k.Km_Banda3 THEN k.Valor_Banda3
                ELSE k.Valor_Banda3 + ROUND(k.Valor_Km * (k.Km - k.Km_Banda3), 2) END AS Base_Nueva,
           k.Nombre + N' · ' + k.Tipo + N', '
             + CASE WHEN k.Anio >= k.Anio_Corte THEN N'modelo ' + CONVERT(nvarchar(4), k.Anio_Corte) + N' en adelante'
                    ELSE N'modelo ' + CONVERT(nvarchar(4), k.Anio_Corte - 1) + N' o anterior' END + N' · '
             + CASE WHEN k.Modo = 'Km' THEN N'tarifa por km: ' + FORMAT(k.Km, '0.#', 'es-AR') + N' km × $ ' + FORMAT(k.Valor_Km, 'N2', 'es-AR')
                    WHEN k.Km <= k.Km_Banda1 THEN N'tarifa fija hasta ' + CONVERT(nvarchar(10), k.Km_Banda1) + N' km, ' + CONVERT(nvarchar(1), k.Vuelta) + N'ª vuelta'
                    WHEN k.Km <= k.Km_Banda2 THEN N'tarifa fija de más de ' + CONVERT(nvarchar(10), k.Km_Banda1) + N' y hasta ' + CONVERT(nvarchar(10), k.Km_Banda2) + N' km'
                    WHEN k.Km <= k.Km_Banda3 THEN N'tarifa fija de más de ' + CONVERT(nvarchar(10), k.Km_Banda2) + N' y hasta ' + CONVERT(nvarchar(10), k.Km_Banda3) + N' km'
                    ELSE N'tarifa fija hasta ' + CONVERT(nvarchar(10), k.Km_Banda3) + N' km ($ ' + FORMAT(k.Valor_Banda3, 'N2', 'es-AR') + N') + '
                         + FORMAT(k.Km - k.Km_Banda3, '0.#', 'es-AR') + N' km × $ ' + FORMAT(k.Valor_Km, 'N2', 'es-AR') END AS Detalle_Nuevo
    FROM Clasificado k
)
SELECT c.*,
       CASE WHEN c.Falso_Flete = 1 THEN ROUND(c.Base_Nueva * c.Falso_Flete_Porcentaje / 100, 2) ELSE c.Base_Nueva END
         + c.Estadia_Modulos * ISNULL(c.Estadia_Modulo, 0) AS Importe_Nuevo
INTO #Plan
FROM Calculado c;

-- Qué pasa con cada viaje (resumen y detalle).
SELECT Que_pasa, COUNT(*) AS Viajes FROM #Plan GROUP BY Que_pasa ORDER BY Que_pasa;

SELECT Viaje_ID, Estado, CONVERT(char(10), Fecha_Inicio, 103) AS Inicio, Dominio, Tipo, Anio, Km, Modo, Vuelta, Que_pasa,
       Importe AS Importe_Hoy, CASE WHEN Que_pasa = N'Se recalcula con la tabla' THEN Importe_Nuevo END AS Importe_Nuevo,
       CASE WHEN Que_pasa = N'Se recalcula con la tabla' THEN Detalle_Nuevo END AS Detalle_Nuevo, Falta
FROM #Plan
ORDER BY CASE WHEN Falta IS NOT NULL THEN 0 ELSE 1 END, Viaje_ID;

-- Los de la demo de Rukas (N° de transporte 990001 y 990002): sus importes nuevos van en los Excel de docs/pruebas/datos.
SELECT p.Viaje_ID, RTRIM(v.Num_Transporte) AS Num_Transporte, p.Que_pasa, p.Importe AS Importe_Hoy, p.Importe_Nuevo
FROM #Plan p JOIN dbo.VIAJES v ON v.Viaje_ID = p.Viaje_ID
WHERE RTRIM(ISNULL(v.Num_Transporte, '')) IN ('990001', '990002');

-- Presupuestos con una tarifa vieja: pasan a la tabla general y conservan el importe.
SELECT Presupuesto_ID, Estado, JSON_VALUE(Datos, '$.tipoTarifa') AS Tipo_Tarifa, JSON_VALUE(Datos, '$.tarifaId') AS Tarifa_Vieja,
       JSON_VALUE(Datos, '$.importe') AS Importe
FROM dbo.PRESUPUESTOS
WHERE ISJSON(Datos) = 1 AND JSON_VALUE(Datos, '$.tarifaId') IS NOT NULL AND JSON_VALUE(Datos, '$.tarifarioId') IS NULL
ORDER BY Presupuesto_ID;

SELECT (SELECT COUNT(*) FROM dbo.TARIFAS_FIJAS) AS Tarifas_fijas_viejas, (SELECT COUNT(*) FROM dbo.TARIFAS_KM) AS Tarifas_por_km_viejas;

/* ---------------------------------------------------------------- Aplicar */

IF @Aplicar = 1
BEGIN
    IF EXISTS (SELECT 1 FROM #Plan WHERE Falta IS NOT NULL)
        THROW 54623, 'Hay viajes que no se pueden calcular (columna Falta): resolvelo y volvé a correr el script.', 1;

    BEGIN TRANSACTION;

    DECLARE @Recalculados int = 0, @Conservados int = 0, @Presupuestos int = 0, @Viejas int = 0;

    UPDATE v
    SET TarifarioID = p.Tarifario_ID, Tarifa_Modo = p.Modo, Vuelta = p.Vuelta,
        Importe_Base = p.Base_Nueva, Tarifa_Detalle = p.Detalle_Nuevo, Importe = p.Importe_Nuevo,
        Importe_Detalle = p.Detalle_Nuevo + N' · $ ' + FORMAT(p.Base_Nueva, 'N2', 'es-AR')
            + CASE WHEN p.Falso_Flete = 1 THEN N' · falso flete ' + FORMAT(p.Falso_Flete_Porcentaje, '0.##', 'es-AR') + N' %: $ '
                   + FORMAT(ROUND(p.Base_Nueva * p.Falso_Flete_Porcentaje / 100, 2), 'N2', 'es-AR') ELSE N'' END
            + CASE WHEN p.Estadia_Modulos > 0 THEN N' · ' + CONVERT(nvarchar(3), p.Estadia_Modulos)
                   + CASE WHEN p.Estadia_Modulos = 1 THEN N' módulo' ELSE N' módulos' END + N' de estadía: $ '
                   + FORMAT(p.Estadia_Modulos * p.Estadia_Modulo, 'N2', 'es-AR') ELSE N'' END,
        TarifaFijaID = NULL, TarifaKmID = NULL, Fecha_Modi = @Ahora, Usu_Modi = @Usuario
    FROM dbo.VIAJES v JOIN #Plan p ON p.Viaje_ID = v.Viaje_ID
    WHERE p.Que_pasa = N'Se recalcula con la tabla';
    SET @Recalculados = @@ROWCOUNT;

    -- Conservan su importe: quedan con la tabla (la de su fecha o, antes de agosto, la general) y un detalle que lo explica.
    UPDATE v
    SET TarifarioID = ISNULL(p.Tarifario_ID, @General), Tarifa_Modo = p.Modo, Vuelta = NULL,
        Tarifa_Detalle = x.Texto, Importe_Detalle = x.Texto + ISNULL(N' · $ ' + FORMAT(v.Importe, 'N2', 'es-AR'), N''),
        TarifaFijaID = NULL, TarifaKmID = NULL, Fecha_Modi = @Ahora, Usu_Modi = @Usuario
    FROM dbo.VIAJES v JOIN #Plan p ON p.Viaje_ID = v.Viaje_ID
    CROSS APPLY (SELECT CASE WHEN p.Emitido = 1 THEN N'Importe facturado'
                             WHEN p.Presupuesto_ID IS NOT NULL THEN N'Presupuesto #' + CONVERT(nvarchar(11), p.Presupuesto_ID)
                             ELSE N'Importe anterior a la tabla de tarifas' END AS Texto) x
    WHERE p.Que_pasa <> N'Se recalcula con la tabla';
    SET @Conservados = @@ROWCOUNT;

    UPDATE dbo.PRESUPUESTOS
    SET Datos = JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(Datos, '$.tarifarioId', @General), '$.tarifaId', NULL), '$.valorKm', NULL)
    WHERE ISJSON(Datos) = 1 AND JSON_VALUE(Datos, '$.tarifaId') IS NOT NULL AND JSON_VALUE(Datos, '$.tarifarioId') IS NULL;
    SET @Presupuestos = @@ROWCOUNT;

    DELETE FROM dbo.TARIFAS_FIJAS;
    SET @Viejas = @@ROWCOUNT;
    DELETE FROM dbo.TARIFAS_KM;
    SET @Viejas = @Viejas + @@ROWCOUNT;

    SELECT @Recalculados AS Viajes_recalculados, @Conservados AS Viajes_que_conservan_el_importe,
           @Presupuestos AS Presupuestos_pasados_a_la_tabla, @Viejas AS Tarifas_viejas_borradas,
           (SELECT COUNT(*) FROM dbo.VIAJES WHERE TarifaFijaID IS NOT NULL OR TarifaKmID IS NOT NULL) AS Viajes_con_tarifa_vieja_tiene_que_dar_0,
           N'Si coincide con el diagnóstico: COMMIT;  si no: ROLLBACK;' AS Siguiente_paso;
    -- COMMIT;  o  ROLLBACK;
END;
