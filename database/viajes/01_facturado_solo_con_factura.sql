/*
   VIAJES: "Facturado" pasa a significar "con Factura emitida" (merge de facugodoy, 17/10/2026).

   Antes el viaje pasaba a Facturado al GENERAR la proforma. Desde el merge pasa a Facturado
   al EMITIR la factura (FacturasController) y vuelve con la Nota de Credito cancelatoria.
   Este script corrige los viajes que quedaron en Facturado sin factura vigente: vuelven a
   Listo_para_facturar (clientes con plataforma) o Entregado (directos). Siguen reservados por
   su proforma (PROFORMAS_VIAJES / líneas V{id}), así que no pueden incluirse en otra.

   Cómo correrlo (SSMS, base Transporte_Sanchez, con backup previo):
     1. Ejecutar tal cual (@Aplicar = 0): muestra qué viajes cambiarían.
     2. Si está bien, poner @Aplicar = 1 y ejecutar de nuevo.
   Es idempotente.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;   -- 0 = solo diagnóstico · 1 = aplicar

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54400, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

IF OBJECT_ID('tempdb..#Corregir') IS NOT NULL DROP TABLE #Corregir;

SELECT v.Viaje_ID, v.ClienteID, c.Razon_Social AS Cliente, ISNULL(c.Tipo_Cliente,'Directo') AS Tipo_Cliente,
       CASE WHEN c.Tipo_Cliente = 'Con_plataforma' THEN 'Listo_para_facturar' ELSE 'Entregado' END AS Estado_Nuevo,
       (SELECT TOP (1) ISNULL(p.Numero, 'borrador #' + CAST(p.Proforma_ID AS varchar(12))) + ' (' + p.Estado + ')'
          FROM dbo.PROFORMAS p
         WHERE p.Estado <> 'Anulada'
           AND (EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = p.Proforma_ID AND pv.ViajeID = v.Viaje_ID)
                OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd WHERE pd.Proforma_ID = p.Proforma_ID
                           AND UPPER(LTRIM(RTRIM(ISNULL(pd.Codigo,'')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID)))
         ORDER BY p.Proforma_ID DESC) AS Proforma
INTO #Corregir
FROM dbo.VIAJES v
LEFT JOIN dbo.CLIENTES c ON c.Cliente_ID = v.ClienteID
WHERE v.Estado = 'Facturado'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.COMPROBANTES_PROFORMAS cp
       WHERE cp.Vigente = 1
         AND (EXISTS (SELECT 1 FROM dbo.PROFORMAS_VIAJES pv WHERE pv.ProformaID = cp.ProformaID AND pv.ViajeID = v.Viaje_ID)
              OR EXISTS (SELECT 1 FROM dbo.PROFORMA_DETALLE pd WHERE pd.Proforma_ID = cp.ProformaID
                         AND UPPER(LTRIM(RTRIM(ISNULL(pd.Codigo,'')))) = 'V' + CONVERT(varchar(11), v.Viaje_ID))));

PRINT '--- Viajes en Facturado sin factura vigente (vuelven al estado de la columna Estado_Nuevo)';
SELECT * FROM #Corregir ORDER BY Viaje_ID;

PRINT '--- Viajes en Facturado CON factura vigente (quedan como están)';
SELECT COUNT(*) AS Con_Factura FROM dbo.VIAJES WHERE Estado = 'Facturado' AND Viaje_ID NOT IN (SELECT Viaje_ID FROM #Corregir);

IF @Aplicar = 0
BEGIN
    PRINT '';
    PRINT 'Solo diagnóstico: no se cambió nada. Si el resultado está bien, poner @Aplicar = 1 y volver a ejecutar.';
    DROP TABLE #Corregir;
    RETURN;
END;

DECLARE @Actualizados int = 0;
BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE v SET Estado = k.Estado_Nuevo, Usu_Modi = 'script-merge', Fecha_Modi = GETDATE()
    FROM dbo.VIAJES v JOIN #Corregir k ON k.Viaje_ID = v.Viaje_ID
    WHERE v.Estado = 'Facturado';
    SET @Actualizados = @@ROWCOUNT;

    INSERT dbo.AUDITORIA (Fecha, Usuario, Accion, Entidad, Clave, Valores_Anteriores, Valores_Nuevos, Origen)
    SELECT GETDATE(), 'script-merge', 'ESTADO', 'VIAJES', 'Viaje_ID=' + CAST(k.Viaje_ID AS varchar(12)),
           'Estado=Facturado', 'Estado=' + k.Estado_Nuevo + ' (Facturado ahora requiere factura emitida)', 'database/viajes/01'
    FROM #Corregir k;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

PRINT CONCAT('Viajes corregidos: ', @Actualizados);
DROP TABLE #Corregir;
