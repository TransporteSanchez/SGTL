/*
   TARIFAS_FIJAS y TARIFAS_KM: dejar los datos cargados con las reglas nuevas (decisiones de Rocío, 23/10/2026).

   Reglas nuevas (las aplica la API al guardar desde Gestionar tarifas):
     - Tarifa fija: el neto es la ruta más la vuelta vacío (si a un cliente no se le cobra la vuelta, va en 0).
     - Tarifa fija: un cliente no puede tener dos del mismo recorrido vigentes el mismo día, y el origen y el destino
       tienen que ser de ese cliente (los viajes solo ofrecen los suyos).
     - Tarifa por km: dos no pueden aplicar al mismo viaje. Cada banda va de más del mínimo hasta el máximo inclusive,
       así que se encadenan con el mismo número (0 a 100, 100 a 500). Con 0 a 100 y 101 a 500, un viaje de 100,5 km
       queda sin tarifa.
     - El viaje toma la tarifa (fija o por km) vigente en su fecha de inicio.

   Qué hace:
     1. Muestra todo lo que no cumple, para decidir a mano (solo lectura).
     2. Con @Aplicar = 1 corrige solo lo que no cambia ningún importe: las tarifas fijas con solo el neto cargado
        (ruta y vuelta vacío en 0) pasan ese neto a la ruta. El neto queda igual, así que los viajes, proformas y
        facturas no cambian.
   Lo demás (las que no suman, las superpuestas, las de otro cliente, las bandas por km) se corrige desde Gestionar
   tarifas o con un UPDATE puntual dentro de BEGIN TRAN … ROLLBACK. Ojo: el viaje no guarda el importe, lo lee de la
   tarifa, así que cambiar el neto de una tarifa cambia el importe de todos sus viajes (las facturas ya emitidas no).

   Cómo correrlo (SSMS, base Transporte_Sanchez, con backup previo y avisando al equipo):
     1. Ejecutar tal cual (@Aplicar = 0): solo muestra.
     2. Si está bien, poner @Aplicar = 1 y ejecutar de nuevo: deja la transacción abierta con la cantidad de filas.
        Si coincide, ejecutar COMMIT; si no, ROLLBACK. Se puede volver a correr: lo ya corregido no aparece.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = pasar a la ruta el neto de las fijas sin ruta ni vuelta

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54320, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

/* ---------------------------------------------------------------- Tarifas fijas */

-- 1. Neto distinto de ruta + vuelta vacío. "Se corrige sola" = solo tiene el neto: con @Aplicar = 1 pasa a la ruta.
SELECT tf.TarifaFija_ID, c.Razon_Social AS Cliente, o.Descripcion AS Origen, d.Descripcion AS Destino,
       tf.FechaDesde, tf.FechaHasta, tf.ValorRuta, tf.ValorVueltaVacio, tf.ValorFijoNeto,
       tf.ValorRuta + tf.ValorVueltaVacio AS Ruta_mas_vuelta,
       CASE WHEN tf.ValorRuta = 0 AND tf.ValorVueltaVacio = 0 AND tf.ValorFijoNeto > 0
            THEN N'Se corrige sola (neto a la ruta)' ELSE N'Decidir a mano' END AS Que_hacer,
       (SELECT COUNT(*) FROM dbo.VIAJES v WHERE v.TarifaFijaID = tf.TarifaFija_ID) AS Viajes,
       (SELECT COUNT(*) FROM dbo.VIAJES v WHERE v.TarifaFijaID = tf.TarifaFija_ID AND v.Estado = 'Facturado') AS Viajes_facturados
FROM dbo.TARIFAS_FIJAS tf
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = tf.ClienteID
LEFT JOIN dbo.ORIGEN o ON o.Origen_ID = tf.OrigenID
LEFT JOIN dbo.DESTINO d ON d.Destino_ID = tf.DestinoID
WHERE tf.ValorFijoNeto <> tf.ValorRuta + tf.ValorVueltaVacio OR tf.ValorFijoNeto <= 0
ORDER BY tf.TarifaFija_ID;

-- 2. Superpuestas: mismo cliente y recorrido, comparten al menos un día.
SELECT a.TarifaFija_ID, b.TarifaFija_ID AS Se_superpone_con, c.Razon_Social AS Cliente,
       a.FechaDesde, a.FechaHasta, b.FechaDesde AS Desde_otra, b.FechaHasta AS Hasta_otra,
       a.ValorFijoNeto, b.ValorFijoNeto AS Neto_otra,
       (SELECT COUNT(*) FROM dbo.VIAJES v WHERE v.TarifaFijaID = a.TarifaFija_ID) AS Viajes,
       (SELECT COUNT(*) FROM dbo.VIAJES v WHERE v.TarifaFijaID = b.TarifaFija_ID) AS Viajes_otra
FROM dbo.TARIFAS_FIJAS a
JOIN dbo.TARIFAS_FIJAS b
  ON b.ClienteID = a.ClienteID AND b.OrigenID = a.OrigenID AND b.DestinoID = a.DestinoID
 AND b.TarifaFija_ID > a.TarifaFija_ID
 AND b.FechaDesde <= a.FechaHasta AND b.FechaHasta >= a.FechaDesde
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = a.ClienteID
ORDER BY a.TarifaFija_ID, b.TarifaFija_ID;

-- 3. Origen o destino de otro cliente (o que ya no existe): ningún viaje la encuentra.
SELECT tf.TarifaFija_ID, c.Razon_Social AS Cliente, o.Descripcion AS Origen, o.ClienteID AS Cliente_del_origen,
       d.Descripcion AS Destino, d.ClienteID AS Cliente_del_destino, tf.FechaDesde, tf.FechaHasta,
       (SELECT COUNT(*) FROM dbo.VIAJES v WHERE v.TarifaFijaID = tf.TarifaFija_ID) AS Viajes
FROM dbo.TARIFAS_FIJAS tf
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = tf.ClienteID
LEFT JOIN dbo.ORIGEN o ON o.Origen_ID = tf.OrigenID
LEFT JOIN dbo.DESTINO d ON d.Destino_ID = tf.DestinoID
WHERE o.Origen_ID IS NULL OR d.Destino_ID IS NULL OR o.ClienteID <> tf.ClienteID OR d.ClienteID <> tf.ClienteID
ORDER BY tf.TarifaFija_ID;

/* ---------------------------------------------------------------- Tarifas por km */

IF OBJECT_ID('tempdb..#Km') IS NOT NULL DROP TABLE #Km;
SELECT TarifaKm_ID, FechaDesde, FechaHasta, ValorKm, MinKm, MaxKm,
       TRY_CAST(REPLACE(RTRIM(LTRIM(MinKm)), ',', '.') AS decimal(18, 2)) AS Min_n,
       TRY_CAST(REPLACE(RTRIM(LTRIM(MaxKm)), ',', '.') AS decimal(18, 2)) AS Max_n
INTO #Km
FROM dbo.TARIFAS_KM;

-- 4. Todas, ordenadas por vigencia y banda, para mirarlas juntas.
SELECT k.TarifaKm_ID, k.FechaDesde, k.FechaHasta, k.ValorKm, k.MinKm, k.MaxKm,
       CASE WHEN k.Min_n IS NULL OR k.Max_n IS NULL THEN N'Km que no son números'
            WHEN k.Min_n >= k.Max_n THEN N'El máximo no es mayor que el mínimo'
            WHEN k.ValorKm <= 0 THEN N'Valor por km en 0'
            ELSE N'' END AS Problema,
       (SELECT COUNT(*) FROM dbo.VIAJES v WHERE v.TarifaKmID = k.TarifaKm_ID) AS Viajes
FROM #Km k
ORDER BY k.FechaDesde, k.Min_n;

-- 5. Superpuestas: comparten al menos un día y sus bandas se pisan (que se toquen en el borde, 100 y 100, está bien).
SELECT a.TarifaKm_ID, b.TarifaKm_ID AS Se_superpone_con,
       a.FechaDesde, a.FechaHasta, a.MinKm, a.MaxKm,
       b.FechaDesde AS Desde_otra, b.FechaHasta AS Hasta_otra, b.MinKm AS MinKm_otra, b.MaxKm AS MaxKm_otra
FROM #Km a
JOIN #Km b
  ON b.TarifaKm_ID > a.TarifaKm_ID
 AND b.FechaDesde <= a.FechaHasta AND b.FechaHasta >= a.FechaDesde
 AND a.Min_n < b.Max_n AND b.Min_n < a.Max_n
ORDER BY a.TarifaKm_ID, b.TarifaKm_ID;

-- 6. Huecos: una banda que no empieza en 0 y ninguna banda del mismo período termina justo en su mínimo
--    (por ejemplo 0 a 100 y 101 a 500: entre 100 y 101 km no hay tarifa). Se corrige poniendo el mínimo igual al
--    máximo de la banda anterior.
SELECT k.TarifaKm_ID, k.FechaDesde, k.FechaHasta, k.MinKm, k.MaxKm,
       (SELECT MAX(p.Max_n) FROM #Km p
         WHERE p.TarifaKm_ID <> k.TarifaKm_ID AND p.Max_n < k.Min_n
           AND p.FechaDesde <= k.FechaHasta AND p.FechaHasta >= k.FechaDesde) AS Termina_la_anterior
FROM #Km k
WHERE k.Min_n > 0
  AND NOT EXISTS (SELECT 1 FROM #Km p
                   WHERE p.TarifaKm_ID <> k.TarifaKm_ID AND p.Max_n = k.Min_n
                     AND p.FechaDesde <= k.FechaHasta AND p.FechaHasta >= k.FechaDesde)
ORDER BY k.FechaDesde, k.Min_n;

/* ---------------------------------------------------------------- Corrección automática */

IF @Aplicar = 1
BEGIN
    BEGIN TRAN;

    UPDATE dbo.TARIFAS_FIJAS
       SET ValorRuta = ValorFijoNeto,
           Fecha_Modi = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime),
           Usu_Modi = N'script tarifas 01'
     WHERE ValorRuta = 0 AND ValorVueltaVacio = 0 AND ValorFijoNeto > 0;

    SELECT @@ROWCOUNT AS Tarifas_fijas_con_el_neto_en_la_ruta,
           N'Tiene que coincidir con las filas "Se corrige sola" de la consulta 1. Después ejecutá COMMIT; o ROLLBACK;' AS Siguiente_paso;
END
ELSE
    SELECT N'Solo diagnóstico: para pasar el neto a la ruta, poner @Aplicar = 1.' AS Aviso;

-- COMMIT;
-- ROLLBACK;
