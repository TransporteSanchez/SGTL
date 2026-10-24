/*
   Carga la tabla "Tarifas a agosto 2026" y deja los datos listos para el tarifario por tipo de camión (24/10/2026).
   Correr DESPUÉS de 02_tarifario_por_vehiculo.sql.

   Qué hace:
     1. Muestra (solo lectura):
        a. Si la versión de agosto 2026 ya está cargada.
        b. Los camiones con su tipo y año del modelo, y el tipo de la tabla que les corresponde. Los que dicen "Elegir en
           Gestionar camiones" no se pueden deducir del texto: se eligen a mano después (sin tipo, el tarifario no puede
           calcular sus viajes y la pantalla lo avisa).
        c. Los viajes que todavía no guardaron su importe, con el importe que les queda guardado: el MISMO que muestran
           hoy (presupuesto aceptado; si no, tarifa fija; si no, tarifa por km × km). Ningún monto cambia.
     2. Con @Aplicar = 1, dentro de una transacción que queda abierta:
        a. Carga la versión "Tarifas a agosto 2026" (vigente desde el 01/08/2026) con sus 8 filas de valores, si no estaba.
        b. Pasa al nombre de la tabla el tipo de los camiones que se puede deducir (furgón, balancín, chasis, liviano).
        c. Guarda el importe de los viajes que no lo tienen.
        Al final muestra las cantidades: si coinciden con el diagnóstico, COMMIT; si no, ROLLBACK.
        Se puede volver a correr: lo ya cargado no se repite.

   Valores sin IVA, tal cual la tabla (la de 2019 en adelante es la de 2018 más un 10 %; hasta 250 km, un 8 %, y en
   larga distancia, un 5 %; la 2ª vuelta es cerca del 70 % de la 1ª). Estadía: módulo de 6 hs a $ 96.577, después de 12 hs de
   iniciado el servicio (18 hs si son más de 250 km). Falso flete: 60 % del viaje.

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo):
     1. Ejecutar tal cual (@Aplicar = 0): solo muestra.
     2. Si está bien, poner @Aplicar = 1 y ejecutar de nuevo. Revisar las cantidades y ejecutar COMMIT; o ROLLBACK;.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = cargar y dejar la transacción abierta
DECLARE @Usuario nvarchar(20) = N'script tarifario 03';
DECLARE @Ahora datetime = CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime);

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54610, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

IF OBJECT_ID(N'dbo.TARIFARIOS', N'U') IS NULL OR COL_LENGTH('dbo.VIAJES', 'Importe') IS NULL
    THROW 54611, 'Primero correr database/tarifas/02_tarifario_por_vehiculo.sql.', 1;

/* ---------------------------------------------------------------- Diagnóstico */

-- a. Versión de agosto 2026.
SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.TARIFARIOS WHERE Vigente_Desde = '2026-08-01')
            THEN N'Ya está cargada' ELSE N'Se carga con @Aplicar = 1' END AS Tarifas_a_agosto_2026;

-- b. Camiones y el tipo de la tabla.
;WITH Camiones AS (
    SELECT c.Camion_ID, RTRIM(c.Dominio) AS Dominio, c.Marca, c.Modelo, c.AñoModelo, c.Tipo, c.EstadoCamion,
           CASE WHEN c.Tipo IN (N'Furgón', N'Balancín (3 ejes)', N'Chasis (2 ejes)', N'Liviano') THEN c.Tipo
                WHEN c.Tipo LIKE N'%furg%' THEN N'Furgón'
                WHEN c.Tipo LIKE N'%balanc%' THEN N'Balancín (3 ejes)'
                WHEN c.Tipo LIKE N'%chasis%' THEN N'Chasis (2 ejes)'
                WHEN c.Tipo LIKE N'%livian%' THEN N'Liviano' END AS Tipo_Tabla
    FROM dbo.CAMIONES c
)
SELECT Camion_ID, Dominio, Marca, Modelo, AñoModelo,
       CASE WHEN TRY_CAST(AñoModelo AS int) >= 2019 THEN N'2019 en adelante' ELSE N'2018 o anterior' END AS Antiguedad,
       Tipo AS Tipo_Actual, Tipo_Tabla, EstadoCamion,
       CASE WHEN Tipo_Tabla IS NULL THEN N'Elegir en Gestionar camiones'
            WHEN Tipo_Tabla = Tipo THEN N'Ya está'
            ELSE N'Se corrige solo' END AS Que_hacer,
       (SELECT COUNT(*) FROM dbo.VIAJES v WHERE v.CamionID = Camiones.Camion_ID) AS Viajes
FROM Camiones
ORDER BY CASE WHEN Tipo_Tabla IS NULL THEN 0 ELSE 1 END, Camion_ID;

-- c. Importe que guarda cada viaje: el mismo cálculo que hoy usan "Traer viajes", el control de Rukas y el dashboard.
IF OBJECT_ID('tempdb..#Importes') IS NOT NULL DROP TABLE #Importes;

SELECT v.Viaje_ID, v.Estado, x.Importe, x.Detalle
INTO #Importes
FROM dbo.VIAJES v
LEFT JOIN dbo.TARIFAS_FIJAS tf ON tf.TarifaFija_ID = v.TarifaFijaID
LEFT JOIN dbo.TARIFAS_KM tk ON tk.TarifaKm_ID = v.TarifaKmID
LEFT JOIN dbo.ORIGEN o ON o.Origen_ID = v.OrigenID
LEFT JOIN dbo.DESTINO d ON d.Destino_ID = v.DestinoID
OUTER APPLY (SELECT TOP (1) ps.Presupuesto_ID,
                    TRY_CAST(CASE WHEN ISJSON(ps.Datos) = 1 THEN JSON_VALUE(ps.Datos, '$.importe') END AS decimal(18, 2)) AS Importe
             FROM dbo.PRESUPUESTOS ps
             WHERE ps.ViajeID = v.Viaje_ID AND ps.Estado = 'Aceptado'
             ORDER BY ps.Presupuesto_ID DESC) p
CROSS APPLY (SELECT TRY_CAST(REPLACE(RTRIM(v.Distancia_KM), ',', '.') AS decimal(18, 2)) AS Km) k
CROSS APPLY (
    SELECT CASE WHEN p.Presupuesto_ID IS NOT NULL THEN CASE WHEN p.Importe >= 0 THEN p.Importe END
                WHEN tf.TarifaFija_ID IS NOT NULL THEN tf.ValorFijoNeto
                WHEN tk.TarifaKm_ID IS NOT NULL AND k.Km IS NOT NULL THEN ROUND(tk.ValorKm * k.Km, 2) END AS Importe,
           CASE WHEN p.Presupuesto_ID IS NOT NULL THEN N'Presupuesto #' + CONVERT(nvarchar(11), p.Presupuesto_ID)
                WHEN tf.TarifaFija_ID IS NOT NULL THEN N'Tarifa fija #' + CONVERT(nvarchar(11), tf.TarifaFija_ID)
                     + N' · ' + ISNULL(o.Descripcion, N'') + N' → ' + ISNULL(d.Descripcion, N'')
                WHEN tk.TarifaKm_ID IS NOT NULL THEN N'Tarifa por km #' + CONVERT(nvarchar(11), tk.TarifaKm_ID)
                     + N' · $ ' + FORMAT(tk.ValorKm, 'N2', 'es-AR') + N' por km × ' + FORMAT(k.Km, '0.#', 'es-AR') + N' km' END AS Detalle
) x
WHERE v.Importe IS NULL;

SELECT COUNT(*) AS Viajes_sin_importe_guardado,
       SUM(CASE WHEN Importe IS NOT NULL THEN 1 ELSE 0 END) AS Se_guardan,
       SUM(CASE WHEN Importe IS NULL THEN 1 ELSE 0 END) AS Quedan_sin_importe
FROM #Importes;

-- Los que quedan sin importe (sin tarifa o con un presupuesto sin importe válido): siguen como hoy.
SELECT Viaje_ID, Estado, Detalle, N'Sin tarifa o presupuesto sin importe: queda como está' AS Nota
FROM #Importes WHERE Importe IS NULL ORDER BY Viaje_ID;

SELECT TOP (50) Viaje_ID, Estado, Importe,
       Detalle + N' · $ ' + FORMAT(Importe, 'N2', 'es-AR') AS Importe_Detalle
FROM #Importes WHERE Importe IS NOT NULL ORDER BY Viaje_ID;

/* ---------------------------------------------------------------- Aplicar */

IF @Aplicar = 1
BEGIN
    BEGIN TRANSACTION;

    DECLARE @Tarifas int = 0, @Valores int = 0, @Camiones int = 0, @Viajes int = 0;

    IF NOT EXISTS (SELECT 1 FROM dbo.TARIFARIOS WHERE Vigente_Desde = '2026-08-01')
    BEGIN
        INSERT INTO dbo.TARIFARIOS (Nombre, Vigente_Desde, Anio_Corte, Km_Banda1, Km_Banda2, Km_Banda3,
                                    Estadia_Modulo, Estadia_Horas_Modulo, Estadia_Desde_Horas, Estadia_Desde_Horas_Larga,
                                    Falso_Flete_Porcentaje, Fecha_Alta, Usu_Alta, Fecha_Modi, Usu_Modi)
        VALUES (N'Tarifas a agosto 2026', '2026-08-01', 2019, 130, 190, 250, 96577, 6, 12, 18, 60,
                @Ahora, @Usuario, @Ahora, @Usuario);
        SET @Tarifas = @@ROWCOUNT;

        DECLARE @Id int = SCOPE_IDENTITY();

        INSERT INTO dbo.TARIFARIO_VALORES (Tarifario_ID, Modelo_Nuevo, Tipo_Vehiculo, Valor_Banda1_Vuelta1,
                                           Valor_Banda1_Vuelta2, Valor_Banda2, Valor_Banda3, Valor_Km)
        VALUES (@Id, 0, N'Furgón',            586896, 410794, 637323, 681897, 2742),
               (@Id, 0, N'Balancín (3 ejes)', 528747, 370071, 574162, 614240, 2471),
               (@Id, 0, N'Chasis (2 ejes)',   476273, 333350, 517093, 553354, 2226),
               (@Id, 0, N'Liviano',           429101, 278028, 465886, 498465, 2006),
               (@Id, 1, N'Furgón',            645535, 451831, 700982, 736398, 2880),
               (@Id, 1, N'Balancín (3 ejes)', 581492, 407089, 631568, 663370, 2594),
               (@Id, 1, N'Chasis (2 ejes)',   523849, 366661, 568909, 597739, 2338),
               (@Id, 1, N'Liviano',           471932, 305883, 512533, 538441, 2106);
        SET @Valores = @@ROWCOUNT;
    END;

    UPDATE c
    SET Tipo = x.Tipo_Tabla, Fecha_Modi = @Ahora, Usu_Modi = @Usuario
    FROM dbo.CAMIONES c
    CROSS APPLY (SELECT CASE WHEN c.Tipo LIKE N'%furg%' THEN N'Furgón'
                             WHEN c.Tipo LIKE N'%balanc%' THEN N'Balancín (3 ejes)'
                             WHEN c.Tipo LIKE N'%chasis%' THEN N'Chasis (2 ejes)'
                             WHEN c.Tipo LIKE N'%livian%' THEN N'Liviano' END AS Tipo_Tabla) x
    WHERE x.Tipo_Tabla IS NOT NULL AND c.Tipo <> x.Tipo_Tabla
      AND c.Tipo NOT IN (N'Furgón', N'Balancín (3 ejes)', N'Chasis (2 ejes)', N'Liviano');
    SET @Camiones = @@ROWCOUNT;

    UPDATE v
    SET Importe_Base = i.Importe,
        Tarifa_Detalle = i.Detalle,
        Importe = i.Importe,
        Importe_Detalle = i.Detalle + N' · $ ' + FORMAT(i.Importe, 'N2', 'es-AR')
    FROM dbo.VIAJES v
    JOIN #Importes i ON i.Viaje_ID = v.Viaje_ID
    WHERE v.Importe IS NULL AND i.Importe IS NOT NULL;
    SET @Viajes = @@ROWCOUNT;

    SELECT @Tarifas AS Tarifarios_cargados, @Valores AS Filas_de_valores, @Camiones AS Camiones_con_tipo_de_la_tabla,
           @Viajes AS Viajes_con_importe_guardado,
           N'Si coincide con el diagnóstico: COMMIT;  si no: ROLLBACK;' AS Siguiente_paso;
    -- COMMIT;  o  ROLLBACK;
END;
