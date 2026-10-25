/*
   Deja los viajes y los presupuestos como si siempre hubiera estado la tabla de tarifas, y saca las tarifas de antes
   (fijas por cliente y recorrido, y bandas por km, que eran de prueba). Decisión de Rocío, 25/10/2026.

   Correr DESPUÉS de 02_tarifario_por_vehiculo.sql y 03_cargar_tablas_de_tarifas_2026.sql, y después de elegir en
   Gestionar camiones el tipo de los camiones que 03 no pudo deducir (sin tipo, sus viajes no se pueden calcular y el
   script no aplica nada).

   Todos los viajes y todos los presupuestos se calculan con la tabla vigente en su inicio (la propia de su cliente o la
   general: enero 2026 hasta el 31/07, agosto 2026 desde el 01/08), con la misma cuenta que la API
   (WebApi_TransporteSanchez/Tarifas/TarifarioCalculo.cs):
     - Presupuestos: con su tarifa (fija o por km), su camión y sus km. La vuelta: la que tienen; si no, 2ª si el camión ya
       tiene un viaje que empieza antes ese día.
     - Viajes generados desde un presupuesto aceptado: el importe del presupuesto (ya recalculado), su tarifa y su vuelta.
     - El resto de los viajes, con la tarifa fija por banda de km, aunque antes tuvieran una tarifa por km (Rocío, 25/10:
       la fija es la principal del PDF y las tarifas por km de antes eran de prueba). La vuelta que tienen o, si no tienen,
       2ª si el camión tiene otro viaje antes ese día; más de 250 km, la fija de 250 más el excedente por km. Los que ya
       tienen la tabla (cargados con la pantalla nueva o por una corrida anterior de este script) conservan fija o por km.
     - Falso flete y estadía, si los tienen, se suman igual que en la pantalla.
   Quedan con la tabla (TarifarioID, fija o por km, la vuelta, el importe y su detalle), sin TarifaFijaID ni TarifaKmID y
   sin ningún texto sobre las tarifas de antes. No cambia la fecha ni el usuario de la última modificación (se ven en Ver
   detalle). Se borran las filas de TARIFAS_FIJAS y TARIFAS_KM; las tablas quedan vacías porque el modelo de Entity
   Framework (EDMX) las incluye y no se regenera.

   También se recalculan los viajes facturados: sus proformas y comprobantes de prueba guardan los importes de antes y no
   coinciden hasta que se borren y se generen de nuevo (§38 de docs/PENDIENTES-SISTEMA.md, después del cambio de Facu).

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo):
     1. Ejecutar tal cual (@Aplicar = 0): muestra cada viaje y cada presupuesto con el importe de hoy, el nuevo y lo que
        falta para calcularlo.
     2. Si la columna Falta está vacía, poner @Aplicar = 1 y ejecutar de nuevo. Revisar las cantidades y ejecutar COMMIT;
        o ROLLBACK;. Si se vuelve a correr, da lo mismo mientras no cambien las tablas de tarifas.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = aplicar y dejar la transacción abierta

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54620, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

IF OBJECT_ID(N'dbo.TARIFARIO_CLIENTES', N'U') IS NULL OR COL_LENGTH('dbo.VIAJES', 'Tarifa_Modo') IS NULL
    THROW 54621, 'Primero correr database/tarifas/02_tarifario_por_vehiculo.sql.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.TARIFARIOS WHERE Para_Todos = 1)
    THROW 54622, 'Primero correr database/tarifas/03_cargar_tablas_de_tarifas_2026.sql (carga las tablas de 2026).', 1;

/* ---------------------------------------------------------------- Lo que define la tarifa de cada uno */

IF OBJECT_ID('tempdb..#Pedidos') IS NOT NULL DROP TABLE #Pedidos;

SELECT N'Presupuesto' AS Clase, ps.Presupuesto_ID AS ID, ps.Estado,
       TRY_CAST(JSON_VALUE(ps.Datos, '$.clienteId') AS int) AS ClienteID,
       TRY_CAST(JSON_VALUE(ps.Datos, '$.camionId') AS int) AS CamionID,
       TRY_CAST(REPLACE(JSON_VALUE(ps.Datos, '$.fechaInicio'), 'T', ' ') AS datetime2(3)) AS Inicio,
       TRY_CAST(JSON_VALUE(ps.Datos, '$.distancia') AS decimal(18, 2)) AS Km,
       CAST(CASE JSON_VALUE(ps.Datos, '$.tipoTarifa') WHEN 'km' THEN 'Km' WHEN 'fija' THEN 'Fija' END AS varchar(4)) AS Modo,
       TRY_CAST(JSON_VALUE(ps.Datos, '$.vuelta') AS int) AS Vuelta_Guardada,
       CAST(NULL AS int) AS Presupuesto_ID, CAST(0 AS bit) AS Falso_Flete, 0 AS Estadia_Modulos,
       TRY_CAST(JSON_VALUE(ps.Datos, '$.importe') AS decimal(18, 2)) AS Importe_Hoy
INTO #Pedidos
FROM dbo.PRESUPUESTOS ps
WHERE ISJSON(ps.Datos) = 1
UNION ALL
SELECT N'Viaje', v.Viaje_ID, v.Estado, v.ClienteID, v.CamionID, CAST(v.Fecha_Inicio AS datetime2(3)), k.Km,
       CASE WHEN v.TarifarioID IS NOT NULL AND v.Tarifa_Modo IN ('Fija', 'Km') THEN v.Tarifa_Modo ELSE 'Fija' END,
       v.Vuelta, p.Presupuesto_ID, ISNULL(v.Falso_Flete, 0), ISNULL(v.Estadia_Modulos, 0),
       -- El que muestra hoy: el guardado o, en un viaje de antes, el de su tarifa vieja.
       COALESCE(v.Importe, CASE WHEN p.Presupuesto_ID IS NOT NULL THEN p.Importe
                                WHEN tf.TarifaFija_ID IS NOT NULL THEN tf.ValorFijoNeto
                                WHEN tk.TarifaKm_ID IS NOT NULL THEN ROUND(tk.ValorKm * k.Km, 2) END)
FROM dbo.VIAJES v
LEFT JOIN dbo.TARIFAS_FIJAS tf ON tf.TarifaFija_ID = v.TarifaFijaID
LEFT JOIN dbo.TARIFAS_KM tk ON tk.TarifaKm_ID = v.TarifaKmID
CROSS APPLY (SELECT TRY_CAST(REPLACE(RTRIM(v.Distancia_KM), ',', '.') AS decimal(18, 2)) AS Km) k
OUTER APPLY (SELECT TOP (1) ps.Presupuesto_ID,
                    TRY_CAST(CASE WHEN ISJSON(ps.Datos) = 1 THEN JSON_VALUE(ps.Datos, '$.importe') END AS decimal(18, 2)) AS Importe
             FROM dbo.PRESUPUESTOS ps
             WHERE ps.ViajeID = v.Viaje_ID AND ps.Estado = 'Aceptado'
             ORDER BY ps.Presupuesto_ID DESC) p;

/* ---------------------------------------------------------------- Cálculo con la tabla */

IF OBJECT_ID('tempdb..#Calculo') IS NOT NULL DROP TABLE #Calculo;

;WITH ConTabla AS (
    SELECT p.*, RTRIM(c.Dominio) AS Dominio, ISNULL(RTRIM(c.Tipo), N'') AS Tipo, TRY_CAST(c.AñoModelo AS int) AS Anio,
           t.Tarifario_ID, t.Nombre AS Tabla, t.Anio_Corte, t.Km_Banda1, t.Km_Banda2, t.Km_Banda3, t.Estadia_Modulo,
           t.Falso_Flete_Porcentaje
    FROM #Pedidos p
    LEFT JOIN dbo.CAMIONES c ON c.Camion_ID = p.CamionID
    -- La tabla: la propia de su cliente vigente en el inicio o, si no tiene, la general (como TarifarioCalculo.Vigente).
    OUTER APPLY (SELECT TOP (1) x.* FROM dbo.TARIFARIOS x
                 WHERE x.Vigente_Desde <= CAST(p.Inicio AS date)
                   AND (x.Para_Todos = 1 OR EXISTS (SELECT 1 FROM dbo.TARIFARIO_CLIENTES tc
                                                    WHERE tc.Tarifario_ID = x.Tarifario_ID AND tc.ClienteID = p.ClienteID))
                 ORDER BY x.Para_Todos, x.Vigente_Desde DESC) t
),
ConValores AS (
    SELECT b.*, tv.Valor_Banda1_Vuelta1, tv.Valor_Banda1_Vuelta2, tv.Valor_Banda2, tv.Valor_Banda3, tv.Valor_Km,
           CASE WHEN b.Anio >= b.Anio_Corte THEN 1 ELSE 0 END AS Modelo_Nuevo,
           -- 1ª o 2ª vuelta: solo con fija y hasta la primera banda. Si no la tiene, 2ª si el camión ya tiene un viaje que
           -- empieza antes ese día (como TarifarioCalculo.ViajeAnteriorDelDia).
           CASE WHEN b.Modo = 'Fija' AND b.Km <= b.Km_Banda1 THEN
                CASE WHEN b.Vuelta_Guardada IN (1, 2) THEN b.Vuelta_Guardada
                     WHEN EXISTS (SELECT 1 FROM dbo.VIAJES o
                                  WHERE o.CamionID = b.CamionID AND (b.Clase = N'Presupuesto' OR o.Viaje_ID <> b.ID)
                                    AND CAST(o.Fecha_Inicio AS date) = CAST(b.Inicio AS date) AND o.Fecha_Inicio < b.Inicio)
                     THEN 2 ELSE 1 END END AS Vuelta
    FROM ConTabla b
    OUTER APPLY (SELECT TOP (1) x.* FROM dbo.TARIFARIO_VALORES x
                 WHERE x.Tarifario_ID = b.Tarifario_ID AND x.Tipo_Vehiculo = b.Tipo
                   AND x.Modelo_Nuevo = CASE WHEN b.Anio >= b.Anio_Corte THEN 1 ELSE 0 END) tv
)
SELECT k.*,
       CASE WHEN k.Inicio IS NULL THEN N'No tiene fecha de inicio.'
            WHEN k.Tarifario_ID IS NULL THEN N'No hay una tabla de tarifas vigente el ' + FORMAT(k.Inicio, 'dd/MM/yyyy') + N'.'
            WHEN k.Clase = N'Viaje' AND k.Presupuesto_ID IS NOT NULL THEN NULL   -- toma el importe de su presupuesto
            WHEN k.Modo IS NULL THEN N'No tiene tipo de tarifa (fija o por km).'
            WHEN k.Dominio IS NULL THEN N'No tiene camión.'
            WHEN k.Valor_Km IS NULL THEN N'El camión ' + k.Dominio + N' no tiene un tipo de la tabla: elegilo en Gestionar camiones.'
            WHEN ISNULL(k.Km, 0) <= 0 THEN N'No tiene km.' END AS Falta_Tabla,
       CAST(CASE WHEN k.Modo = 'Km' THEN ROUND(k.Valor_Km * k.Km, 2)
                 WHEN k.Km <= k.Km_Banda1 THEN CASE WHEN k.Vuelta = 2 THEN k.Valor_Banda1_Vuelta2 ELSE k.Valor_Banda1_Vuelta1 END
                 WHEN k.Km <= k.Km_Banda2 THEN k.Valor_Banda2
                 WHEN k.Km <= k.Km_Banda3 THEN k.Valor_Banda3
                 ELSE k.Valor_Banda3 + ROUND(k.Valor_Km * (k.Km - k.Km_Banda3), 2) END AS decimal(18, 2)) AS Base_Tabla,
       -- El mismo texto que TarifarioCalculo.TarifaDetalle ("Tarifas a agosto 2026 · Furgón 2019 en adelante, fija hasta 130 km,
       -- 1ª vuelta"; desde el 25/10, M15 de la prueba en la VM).
       k.Tabla + N' · ' + k.Tipo + N' '
         + CASE WHEN k.Modelo_Nuevo = 1 THEN CONVERT(nvarchar(4), k.Anio_Corte) + N' en adelante'
                ELSE CONVERT(nvarchar(4), k.Anio_Corte - 1) + N' o anterior' END + N', '
         + CASE WHEN k.Modo = 'Km' THEN N'por km (' + FORMAT(k.Km, '0.#', 'es-AR') + N' km × $ ' + FORMAT(k.Valor_Km, 'N2', 'es-AR') + N')'
                WHEN k.Km <= k.Km_Banda1 THEN N'fija hasta ' + CONVERT(nvarchar(10), k.Km_Banda1) + N' km, ' + CONVERT(nvarchar(1), k.Vuelta) + N'ª vuelta'
                WHEN k.Km <= k.Km_Banda2 THEN N'fija de más de ' + CONVERT(nvarchar(10), k.Km_Banda1) + N' y hasta ' + CONVERT(nvarchar(10), k.Km_Banda2) + N' km'
                WHEN k.Km <= k.Km_Banda3 THEN N'fija de más de ' + CONVERT(nvarchar(10), k.Km_Banda2) + N' y hasta ' + CONVERT(nvarchar(10), k.Km_Banda3) + N' km'
                ELSE N'fija hasta ' + CONVERT(nvarchar(10), k.Km_Banda3) + N' km ($ ' + FORMAT(k.Valor_Banda3, 'N2', 'es-AR') + N') + '
                     + FORMAT(k.Km - k.Km_Banda3, '0.#', 'es-AR') + N' km × $ ' + FORMAT(k.Valor_Km, 'N2', 'es-AR') END AS Detalle_Tabla
INTO #Calculo
FROM ConValores k;

/* ---------------------------------------------------------------- Importe de cada uno */

IF OBJECT_ID('tempdb..#Plan') IS NOT NULL DROP TABLE #Plan;

;WITH Base AS (
    SELECT c.Clase, c.ID, c.Estado, c.Inicio, c.Dominio, c.Tipo, c.Anio, c.Km, c.Tarifario_ID, c.Tabla, c.Falso_Flete,
           c.Estadia_Modulos, c.Estadia_Modulo, c.Falso_Flete_Porcentaje, c.Importe_Hoy, c.Presupuesto_ID,
           -- Un viaje de un presupuesto aceptado toma el importe, la tarifa y la vuelta del presupuesto (como la API).
           CASE WHEN c.Presupuesto_ID IS NOT NULL THEN p.Modo ELSE c.Modo END AS Modo,
           CASE WHEN c.Presupuesto_ID IS NOT NULL THEN p.Vuelta ELSE c.Vuelta END AS Vuelta,
           CASE WHEN c.Presupuesto_ID IS NOT NULL THEN p.Base_Tabla ELSE c.Base_Tabla END AS Base,
           CASE WHEN c.Presupuesto_ID IS NOT NULL THEN N'Presupuesto #' + CONVERT(nvarchar(11), c.Presupuesto_ID)
                ELSE c.Detalle_Tabla END AS Detalle,
           CASE WHEN c.Falta_Tabla IS NOT NULL THEN c.Falta_Tabla
                WHEN c.Presupuesto_ID IS NOT NULL AND p.ID IS NULL
                     THEN N'Presupuesto #' + CONVERT(nvarchar(11), c.Presupuesto_ID) + N': no tiene datos válidos.'
                WHEN c.Presupuesto_ID IS NOT NULL
                     THEN N'Presupuesto #' + CONVERT(nvarchar(11), c.Presupuesto_ID) + N': ' + p.Falta_Tabla END AS Falta
    FROM #Calculo c
    LEFT JOIN #Calculo p ON p.Clase = N'Presupuesto' AND p.ID = c.Presupuesto_ID
),
Adicionales AS (
    SELECT b.*,
           CAST(CASE WHEN b.Falso_Flete = 1 THEN ROUND(b.Base * b.Falso_Flete_Porcentaje / 100, 2) END AS decimal(18, 2)) AS Con_Falso_Flete,
           CAST(CASE WHEN b.Estadia_Modulos > 0 THEN ROUND(b.Estadia_Modulo * b.Estadia_Modulos, 2) END AS decimal(18, 2)) AS Estadia
    FROM Base b
)
SELECT a.*,
       ISNULL(a.Con_Falso_Flete, a.Base) + ISNULL(a.Estadia, 0) AS Importe_Nuevo,
       -- El mismo texto que TarifarioCalculo.SumarAdicionales.
       a.Detalle + N': $ ' + FORMAT(a.Base, 'N2', 'es-AR')
         + ISNULL(N' · falso flete (' + FORMAT(a.Falso_Flete_Porcentaje, '0.##', 'es-AR') + N' %): $ ' + FORMAT(a.Con_Falso_Flete, 'N2', 'es-AR'), N'')
         + ISNULL(N' · estadía (' + CONVERT(nvarchar(3), a.Estadia_Modulos) + CASE WHEN a.Estadia_Modulos = 1 THEN N' módulo' ELSE N' módulos' END
                  + N'): $ ' + FORMAT(a.Estadia, 'N2', 'es-AR'), N'') AS Importe_Detalle
INTO #Plan
FROM Adicionales a;

/* ---------------------------------------------------------------- Diagnóstico */

-- Resumen: cuántos, el total de hoy y el nuevo, y cuántos no se pueden calcular (tiene que dar 0).
SELECT Clase, Estado, COUNT(*) AS Cantidad, SUM(Importe_Hoy) AS Total_hoy,
       SUM(CASE WHEN Falta IS NULL THEN Importe_Nuevo END) AS Total_nuevo,
       SUM(CASE WHEN Falta IS NOT NULL THEN 1 ELSE 0 END) AS No_se_pueden_calcular
FROM #Plan GROUP BY Clase, Estado ORDER BY Clase DESC, Estado;

-- Viajes: primero los que no se pueden calcular.
SELECT ID AS Viaje_ID, Estado, CONVERT(char(10), Inicio, 103) AS Inicio, Dominio, Tipo, Anio, Km, Modo, Vuelta,
       Falso_Flete, Estadia_Modulos, Tabla, Importe_Hoy, CASE WHEN Falta IS NULL THEN Importe_Nuevo END AS Importe_Nuevo,
       CASE WHEN Falta IS NULL THEN Importe_Detalle END AS Detalle_Nuevo, Falta
FROM #Plan WHERE Clase = N'Viaje'
ORDER BY CASE WHEN Falta IS NOT NULL THEN 0 ELSE 1 END, ID;

-- Presupuestos.
SELECT ID AS Presupuesto_ID, Estado, CONVERT(char(10), Inicio, 103) AS Inicio, Dominio, Tipo, Anio, Km, Modo, Vuelta, Tabla,
       Importe_Hoy, CASE WHEN Falta IS NULL THEN Base END AS Importe_Nuevo,
       CASE WHEN Falta IS NULL THEN Detalle END AS Detalle_Nuevo, Falta
FROM #Plan WHERE Clase = N'Presupuesto'
ORDER BY CASE WHEN Falta IS NOT NULL THEN 0 ELSE 1 END, ID;

-- Los de la demo de Rukas (N° de transporte 990001 y 990002): sus importes nuevos van en los Excel de docs/pruebas/datos.
SELECT p.ID AS Viaje_ID, RTRIM(v.Num_Transporte) AS Num_Transporte, p.Importe_Hoy, p.Importe_Nuevo, p.Importe_Detalle
FROM #Plan p JOIN dbo.VIAJES v ON v.Viaje_ID = p.ID
WHERE p.Clase = N'Viaje' AND RTRIM(ISNULL(v.Num_Transporte, '')) IN ('990001', '990002');

SELECT (SELECT COUNT(*) FROM dbo.TARIFAS_FIJAS) AS Tarifas_fijas_viejas, (SELECT COUNT(*) FROM dbo.TARIFAS_KM) AS Tarifas_por_km_viejas;

/* ---------------------------------------------------------------- Aplicar */

IF @Aplicar = 1
BEGIN
    IF EXISTS (SELECT 1 FROM #Plan WHERE Falta IS NOT NULL)
        THROW 54623, 'Hay viajes o presupuestos que no se pueden calcular (columna Falta): resolvelo y volvé a correr el script.', 1;

    BEGIN TRANSACTION;

    DECLARE @Presupuestos int = 0, @Viajes int = 0, @Viejas int = 0;

    -- Los mismos datos que guarda la pantalla de presupuestos (importe en texto con punto decimal).
    UPDATE ps
    SET Datos = JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(ps.Datos,
                    '$.importe', CONVERT(nvarchar(30), p.Base)),
                    '$.tarifarioId', p.Tarifario_ID),
                    '$.vuelta', p.Vuelta),
                    '$.tarifaDetalle', p.Detalle),
                    '$.tarifaId', NULL),
                    '$.valorKm', NULL)
    FROM dbo.PRESUPUESTOS ps JOIN #Plan p ON p.Clase = N'Presupuesto' AND p.ID = ps.Presupuesto_ID;
    SET @Presupuestos = @@ROWCOUNT;

    UPDATE v
    SET TarifarioID = p.Tarifario_ID, Tarifa_Modo = p.Modo, Vuelta = p.Vuelta,
        Importe_Base = p.Base, Tarifa_Detalle = LEFT(p.Detalle, 300),
        Importe = p.Importe_Nuevo, Importe_Detalle = LEFT(p.Importe_Detalle, 500),
        TarifaFijaID = NULL, TarifaKmID = NULL
    FROM dbo.VIAJES v JOIN #Plan p ON p.Clase = N'Viaje' AND p.ID = v.Viaje_ID;
    SET @Viajes = @@ROWCOUNT;

    DELETE FROM dbo.TARIFAS_FIJAS;
    SET @Viejas = @@ROWCOUNT;
    DELETE FROM dbo.TARIFAS_KM;
    SET @Viejas = @Viejas + @@ROWCOUNT;

    SELECT @Viajes AS Viajes_calculados, @Presupuestos AS Presupuestos_calculados, @Viejas AS Tarifas_viejas_borradas,
           (SELECT COUNT(*) FROM dbo.VIAJES WHERE TarifaFijaID IS NOT NULL OR TarifaKmID IS NOT NULL OR TarifarioID IS NULL
                                               OR Importe IS NULL) AS Viajes_sin_la_tabla_tiene_que_dar_0,
           N'Si coincide con el diagnóstico: COMMIT;  si no: ROLLBACK;' AS Siguiente_paso;
    -- COMMIT;  o  ROLLBACK;
END;
