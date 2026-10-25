/*
   Borra la facturación de prueba y reinicia la numeración (25/10/2026; opción B de la §38 de docs/PENDIENTES-SISTEMA.md,
   decisión de Rocío con el OK de Facu). Después se genera desde el sistema un juego de demo con los importes de la tabla
   de tarifas.

   Qué borra (todo es de prueba; relevado con 03_relevar_facturacion_de_prueba.sql el 25/10):
     - Los comprobantes (34: 15 FAC, 3 NC, 1 ND y 15 REC) con su detalle, el vínculo con las proformas, los movimientos y
       las aplicaciones de cuenta corriente, las formas de pago de los recibos y el historial de e-mails enviados.
     - Las proformas (18: propias y de Rukas, en cualquier estado) con su detalle, sus viajes, los Excel adjuntos y las
       líneas de Rukas.
     - Lo pendiente por cambios de tarifa que nombre una proforma o un comprobante (al relevar no había nada).
   Qué cambia:
     - Los viajes facturados vuelven a Listo para facturar (clientes con plataforma) o a Entregado (directos), con la misma
       regla que cuando se anula la factura con una nota de crédito (ComprobantesController). Los demás quedan como están.
       No cambia la última modificación de los viajes.
     - La numeración vuelve a empezar: la próxima proforma es PF-00000001 y el próximo comprobante de cada tipo, el 1.
       Los números internos (el "#" de un borrador) siguen, para no mezclar la historia de Auditoría.
   Qué no toca: clientes, viajes (salvo el estado), presupuestos, tarifas, usuarios, tipos de comprobante, configuración de
   facturación ni datos de la empresa. Auditoría queda como historia, con un registro de esta limpieza.

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar a Facu y Fede antes):
     1. Tal cual (@Aplicar = 0): muestra qué borraría, qué viajes cambian de estado y la numeración. No cambia nada.
     2. Con @Aplicar = 1: lo hace dentro de una transacción que queda abierta y muestra cómo quedó (todo en 0). Si está
        bien, COMMIT; en la misma ventana; si no, ROLLBACK;.
*/
-- Si se corre otra vez en la misma pestaña, primero se borra la tabla temporal de la corrida anterior, en un lote aparte.
DROP TABLE IF EXISTS #ViajesQueVuelven;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;                -- 0 = solo mostrar · 1 = borrar y dejar la transacción abierta
DECLARE @Usuario nvarchar(20) = N'RNUVOLI';  -- quién queda en Auditoría

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54810, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

/* ---------------------------------------------------------------- Los viajes que vuelven */

-- Los facturados que están en alguna proforma o comprobante: vuelven a Listo para facturar o a Entregado.
SELECT v.Viaje_ID, ISNULL(c.Razon_Social, N'') AS Cliente, c.Tipo_Cliente, v.Estado AS Estado_hoy,
       CASE WHEN c.Tipo_Cliente = 'Con_plataforma' THEN 'Listo_para_facturar' ELSE 'Entregado' END AS Estado_nuevo
INTO #ViajesQueVuelven
FROM dbo.VIAJES v
JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
WHERE v.Estado = 'Facturado'
  AND (EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ViajeID = v.Viaje_ID)
       OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE d WHERE UPPER(LTRIM(RTRIM(ISNULL(d.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID))
       OR EXISTS (SELECT 1 FROM dbo.COMPROBANTES_DETALLE cd WHERE UPPER(LTRIM(RTRIM(ISNULL(cd.Codigo, '')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID)));

/* ---------------------------------------------------------------- Diagnóstico */

PRINT '--- Qué se borra (filas de hoy)';
SELECT Tabla, Filas FROM (
    SELECT 1 AS Orden, N'HISTORIAL_ENVIOS_COMPROBANTES' AS Tabla, (SELECT COUNT(*) FROM dbo.HISTORIAL_ENVIOS_COMPROBANTES) AS Filas
    UNION ALL SELECT 2, N'RECIBOS_FORMAS_PAGO', (SELECT COUNT(*) FROM dbo.RECIBOS_FORMAS_PAGO)
    UNION ALL SELECT 3, N'CUENTA_CORRIENTE_APLICACIONES', (SELECT COUNT(*) FROM dbo.CUENTA_CORRIENTE_APLICACIONES)
    UNION ALL SELECT 4, N'CUENTA_CORRIENTE_MOVIMIENTOS', (SELECT COUNT(*) FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS)
    UNION ALL SELECT 5, N'COMPROBANTES_DETALLE', (SELECT COUNT(*) FROM dbo.COMPROBANTES_DETALLE)
    UNION ALL SELECT 6, N'COMPROBANTES_PROFORMAS', (SELECT COUNT(*) FROM dbo.COMPROBANTES_PROFORMAS)
    UNION ALL SELECT 7, N'COMPROBANTES', (SELECT COUNT(*) FROM dbo.COMPROBANTES)
    UNION ALL SELECT 8, N'PROFORMAS_VIAJES', (SELECT COUNT(*) FROM dbo.PROFORMAS_VIAJES)
    UNION ALL SELECT 9, N'PROFORMA_PLATAFORMA_LINEA', (SELECT COUNT(*) FROM dbo.PROFORMA_PLATAFORMA_LINEA)
    UNION ALL SELECT 10, N'PROFORMA_ADJUNTO', (SELECT COUNT(*) FROM dbo.PROFORMA_ADJUNTO)
    UNION ALL SELECT 11, N'PROFORMA_DETALLE', (SELECT COUNT(*) FROM dbo.PROFORMA_DETALLE)
    UNION ALL SELECT 12, N'PROFORMAS', (SELECT COUNT(*) FROM dbo.PROFORMAS)
    UNION ALL SELECT 13, N'TARIFARIO_REVISAR (de proformas o comprobantes)',
        (SELECT COUNT(*) FROM dbo.TARIFARIO_REVISAR WHERE Proforma_ID IS NOT NULL OR Comprobante_ID IS NOT NULL)
) x ORDER BY Orden;

PRINT '--- Viajes que cambian de estado';
SELECT Viaje_ID, Cliente, Tipo_Cliente, Estado_hoy, Estado_nuevo FROM #ViajesQueVuelven ORDER BY Viaje_ID;

PRINT '--- Numeración (hoy → después)';
SELECT N'Proformas (SEQ_PROFORMA)' AS Numeracion, CONVERT(bigint, current_value) AS Ultimo_hoy, 0 AS Ultimo_despues
FROM sys.sequences WHERE name = N'SEQ_PROFORMA'
UNION ALL
SELECT n.Nombre, n.UltimoNumero, 0 FROM dbo.FACTURACION_NUMERADORES n
UNION ALL
SELECT N'Numerador anterior ' + CONVERT(nvarchar(10), Tipo), UltimoNumero, 0 FROM dbo.COMPROBANTES_NUMERADORES;

/* ---------------------------------------------------------------- Aplicar */

IF @Aplicar = 1
BEGIN
    BEGIN TRANSACTION;

    DECLARE @Comprobantes int = (SELECT COUNT(*) FROM dbo.COMPROBANTES);
    DECLARE @Proformas int = (SELECT COUNT(*) FROM dbo.PROFORMAS);
    DECLARE @Viajes int = 0;

    -- Lo que cuelga de los comprobantes.
    DELETE FROM dbo.HISTORIAL_ENVIOS_COMPROBANTES;
    DELETE FROM dbo.RECIBOS_FORMAS_PAGO;
    DELETE FROM dbo.CUENTA_CORRIENTE_APLICACIONES;
    -- Los movimientos que apuntan a otro movimiento van primero.
    DELETE FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS WHERE MovimientoOriginalID IS NOT NULL;
    DELETE FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS;
    DELETE FROM dbo.COMPROBANTES_DETALLE;
    DELETE FROM dbo.COMPROBANTES_PROFORMAS;
    -- Las notas de crédito y de débito apuntan a su factura: van primero.
    DELETE FROM dbo.COMPROBANTES WHERE ComprobanteReferenciaID IS NOT NULL;
    DELETE FROM dbo.COMPROBANTES;

    -- Los viajes facturados vuelven antes de borrar las proformas (se reconocen por ellas).
    UPDATE v SET Estado = q.Estado_nuevo
    FROM dbo.VIAJES v JOIN #ViajesQueVuelven q ON q.Viaje_ID = v.Viaje_ID;
    SET @Viajes = @@ROWCOUNT;

    -- Lo que cuelga de las proformas, y las proformas.
    DELETE FROM dbo.PROFORMAS_VIAJES;
    DELETE FROM dbo.PROFORMA_PLATAFORMA_LINEA;
    DELETE FROM dbo.PROFORMA_ADJUNTO;
    DELETE FROM dbo.PROFORMA_DETALLE;
    DELETE FROM dbo.PROFORMAS;

    -- Lo pendiente por cambios de tarifa que nombraba una proforma o un comprobante.
    DELETE FROM dbo.TARIFARIO_REVISAR WHERE Proforma_ID IS NOT NULL OR Comprobante_ID IS NOT NULL;

    -- La numeración vuelve a empezar.
    ALTER SEQUENCE dbo.SEQ_PROFORMA RESTART WITH 1;
    UPDATE dbo.FACTURACION_NUMERADORES SET UltimoNumero = 0;
    UPDATE dbo.COMPROBANTES_NUMERADORES SET UltimoNumero = 0;

    -- Queda en Auditoría.
    INSERT INTO dbo.AUDITORIA (Fecha, Usuario, Accion, Entidad, Clave, Valores_Anteriores, Valores_Nuevos, Origen)
    VALUES (GETDATE(), LEFT(@Usuario, 20), N'DELETE', N'PROFORMAS', N'Limpieza de prueba', NULL,
            N'Limpieza de la facturación de prueba (§38): se borraron ' + CONVERT(nvarchar(11), @Proformas) + N' proformas y '
            + CONVERT(nvarchar(11), @Comprobantes) + N' comprobantes con todo lo que dependía de ellos; '
            + CONVERT(nvarchar(11), @Viajes) + N' viajes facturados volvieron a Listo para facturar o Entregado; la numeración vuelve a empezar.',
            N'SSMS');

    PRINT '--- Cómo quedó (todo en 0)';
    SELECT N'Comprobantes' AS Que, COUNT(*) AS Quedan FROM dbo.COMPROBANTES
    UNION ALL SELECT N'Movimientos de cuenta corriente', COUNT(*) FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS
    UNION ALL SELECT N'Proformas', COUNT(*) FROM dbo.PROFORMAS
    UNION ALL SELECT N'Viajes en proformas', COUNT(*) FROM dbo.PROFORMAS_VIAJES
    UNION ALL SELECT N'Viajes facturados', COUNT(*) FROM dbo.VIAJES WHERE Estado = 'Facturado';

    SELECT @Proformas AS Proformas_borradas, @Comprobantes AS Comprobantes_borrados, @Viajes AS Viajes_que_volvieron,
           N'Si coincide con el diagnóstico: COMMIT;  si no: ROLLBACK;' AS Siguiente_paso;
    -- COMMIT;  o  ROLLBACK;
END;
