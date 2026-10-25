/*
   Carga las tablas de tarifas de 2026 y deja los camiones con el tipo de la tabla (24/10/2026; enero, 25/10).
   Correr DESPUÉS de 02_tarifario_por_vehiculo.sql y ANTES de 04_viajes_con_la_tabla_de_tarifas.sql.

   Las dos tablas son para todos los clientes:
     - "Tarifas a enero 2026", vigente desde el 01/01/2026: para los viajes de enero a julio. Son los valores de agosto con
       un 15 % menos, redondeados a pesos (decisión de Rocío, 25/10), con las mismas bandas, año de corte y adicionales.
     - "Tarifas a agosto 2026", vigente desde el 01/08/2026: la del PDF de la empresa.
   Cada una vale desde su fecha hasta que empieza la siguiente.

   Qué hace:
     1. Muestra (solo lectura):
        a. Si las dos tablas ya están cargadas.
        b. Los camiones con su tipo y año del modelo, y el tipo de la tabla que les corresponde. Los que dicen "Elegir en
           Gestionar camiones" no se pueden deducir del texto: se eligen a mano después (sin tipo, 04 no puede calcular sus
           viajes).
        c. Los viajes que empiezan antes del 01/01/2026 (no tendrían tabla: si hay, avisar a Claude para cambiar la fecha
           de la de enero).
     2. Con @Aplicar = 1, dentro de una transacción que queda abierta:
        a. Carga las tablas que falten, con sus 8 filas de valores.
        b. Pasa al nombre de la tabla el tipo de los camiones que se puede deducir (furgón, balancín, chasis, liviano), sin
           cambiar la fecha ni el usuario de la última modificación.
        Al final muestra las cantidades: si coinciden con el diagnóstico, COMMIT; si no, ROLLBACK.
        Se puede volver a correr: lo ya cargado no se repite.

   Valores sin IVA. Agosto, tal cual el PDF (la de 2019 en adelante es la de 2018 más un 10 %; hasta 250 km, un 8 %, y en
   larga distancia, un 5 %; la 2ª vuelta es cerca del 70 % de la 1ª). Estadía: módulo de 6 hs ($ 82.090 en enero y
   $ 96.577 en agosto), después de 12 hs de iniciado el servicio (18 hs si son más de 250 km). Falso flete: 60 % del viaje.

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

-- a. Tablas de 2026.
SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.TARIFARIOS WHERE Vigente_Desde = '2026-01-01' AND Para_Todos = 1)
            THEN N'Ya está cargada' ELSE N'Se carga con @Aplicar = 1' END AS Tarifas_a_enero_2026,
       CASE WHEN EXISTS (SELECT 1 FROM dbo.TARIFARIOS WHERE Vigente_Desde = '2026-08-01' AND Para_Todos = 1)
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

-- c. Viajes sin tabla: los que empiezan antes del 01/01/2026 (tiene que dar 0).
SELECT COUNT(*) AS Viajes_antes_del_01_01_2026, MIN(Fecha_Inicio) AS Primer_inicio
FROM dbo.VIAJES WHERE Fecha_Inicio < '20260101';

/* ---------------------------------------------------------------- Aplicar */

IF @Aplicar = 1
BEGIN
    BEGIN TRANSACTION;

    DECLARE @Tarifas int = 0, @Valores int = 0, @Camiones int = 0;

    IF NOT EXISTS (SELECT 1 FROM dbo.TARIFARIOS WHERE Vigente_Desde = '2026-01-01' AND Para_Todos = 1)
    BEGIN
        INSERT INTO dbo.TARIFARIOS (Nombre, Vigente_Desde, Para_Todos, Anio_Corte, Km_Banda1, Km_Banda2, Km_Banda3,
                                    Estadia_Modulo, Estadia_Horas_Modulo, Estadia_Desde_Horas, Estadia_Desde_Horas_Larga,
                                    Falso_Flete_Porcentaje, Fecha_Alta, Usu_Alta, Fecha_Modi, Usu_Modi)
        VALUES (N'Tarifas a enero 2026', '2026-01-01', 1, 2019, 130, 190, 250, 82090, 6, 12, 18, 60,
                @Ahora, @Usuario, @Ahora, @Usuario);
        SET @Tarifas = @Tarifas + @@ROWCOUNT;

        DECLARE @Enero int = SCOPE_IDENTITY();

        -- Los de agosto con un 15 % menos, redondeados a pesos.
        INSERT INTO dbo.TARIFARIO_VALORES (Tarifario_ID, Modelo_Nuevo, Tipo_Vehiculo, Valor_Banda1_Vuelta1,
                                           Valor_Banda1_Vuelta2, Valor_Banda2, Valor_Banda3, Valor_Km)
        VALUES (@Enero, 0, N'Furgón',            498862, 349175, 541725, 579612, 2331),
               (@Enero, 0, N'Balancín (3 ejes)', 449435, 314560, 488038, 522104, 2100),
               (@Enero, 0, N'Chasis (2 ejes)',   404832, 283348, 439529, 470351, 1892),
               (@Enero, 0, N'Liviano',           364736, 236324, 396003, 423695, 1705),
               (@Enero, 1, N'Furgón',            548705, 384056, 595835, 625938, 2448),
               (@Enero, 1, N'Balancín (3 ejes)', 494268, 346026, 536833, 563865, 2205),
               (@Enero, 1, N'Chasis (2 ejes)',   445272, 311662, 483573, 508078, 1987),
               (@Enero, 1, N'Liviano',           401142, 260001, 435653, 457675, 1790);
        SET @Valores = @Valores + @@ROWCOUNT;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.TARIFARIOS WHERE Vigente_Desde = '2026-08-01' AND Para_Todos = 1)
    BEGIN
        INSERT INTO dbo.TARIFARIOS (Nombre, Vigente_Desde, Para_Todos, Anio_Corte, Km_Banda1, Km_Banda2, Km_Banda3,
                                    Estadia_Modulo, Estadia_Horas_Modulo, Estadia_Desde_Horas, Estadia_Desde_Horas_Larga,
                                    Falso_Flete_Porcentaje, Fecha_Alta, Usu_Alta, Fecha_Modi, Usu_Modi)
        VALUES (N'Tarifas a agosto 2026', '2026-08-01', 1, 2019, 130, 190, 250, 96577, 6, 12, 18, 60,
                @Ahora, @Usuario, @Ahora, @Usuario);
        SET @Tarifas = @Tarifas + @@ROWCOUNT;

        DECLARE @Agosto int = SCOPE_IDENTITY();

        INSERT INTO dbo.TARIFARIO_VALORES (Tarifario_ID, Modelo_Nuevo, Tipo_Vehiculo, Valor_Banda1_Vuelta1,
                                           Valor_Banda1_Vuelta2, Valor_Banda2, Valor_Banda3, Valor_Km)
        VALUES (@Agosto, 0, N'Furgón',            586896, 410794, 637323, 681897, 2742),
               (@Agosto, 0, N'Balancín (3 ejes)', 528747, 370071, 574162, 614240, 2471),
               (@Agosto, 0, N'Chasis (2 ejes)',   476273, 333350, 517093, 553354, 2226),
               (@Agosto, 0, N'Liviano',           429101, 278028, 465886, 498465, 2006),
               (@Agosto, 1, N'Furgón',            645535, 451831, 700982, 736398, 2880),
               (@Agosto, 1, N'Balancín (3 ejes)', 581492, 407089, 631568, 663370, 2594),
               (@Agosto, 1, N'Chasis (2 ejes)',   523849, 366661, 568909, 597739, 2338),
               (@Agosto, 1, N'Liviano',           471932, 305883, 512533, 538441, 2106);
        SET @Valores = @Valores + @@ROWCOUNT;
    END;

    -- Como si siempre hubiera tenido ese tipo: no cambia Fecha_Modi ni Usu_Modi (se ven en el detalle del camión).
    UPDATE c
    SET Tipo = x.Tipo_Tabla
    FROM dbo.CAMIONES c
    CROSS APPLY (SELECT CASE WHEN c.Tipo LIKE N'%furg%' THEN N'Furgón'
                             WHEN c.Tipo LIKE N'%balanc%' THEN N'Balancín (3 ejes)'
                             WHEN c.Tipo LIKE N'%chasis%' THEN N'Chasis (2 ejes)'
                             WHEN c.Tipo LIKE N'%livian%' THEN N'Liviano' END AS Tipo_Tabla) x
    WHERE x.Tipo_Tabla IS NOT NULL AND c.Tipo <> x.Tipo_Tabla
      AND c.Tipo NOT IN (N'Furgón', N'Balancín (3 ejes)', N'Chasis (2 ejes)', N'Liviano');
    SET @Camiones = @@ROWCOUNT;

    SELECT @Tarifas AS Tablas_cargadas, @Valores AS Filas_de_valores, @Camiones AS Camiones_con_tipo_de_la_tabla,
           N'Si coincide con el diagnóstico: COMMIT;  si no: ROLLBACK;' AS Siguiente_paso;
    -- COMMIT;  o  ROLLBACK;
END;
