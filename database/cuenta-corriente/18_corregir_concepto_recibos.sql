/*
   Corrige el concepto generado por la version anterior para recibos sin imputar.
   Propuesta para revisar y ejecutar por Rocio: NO aplicar automaticamente.
   El ROLLBACK final permite revisar los cambios sin guardarlos. Para aplicarlos,
   Rocio debe reemplazar ese ROLLBACK por COMMIT y ejecutar el script completo.
   Solo cambia el texto exacto conocido en recibos y sus movimientos de emision;
   no modifica importes, fechas, aplicaciones ni conceptos escritos por usuarios.
   Es idempotente. NCHAR evita depender de la codificacion del editor SQL.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Incorrecto nvarchar(300) = N'Cobranza sin imputaci' + NCHAR(195) + NCHAR(179) + N'n';
DECLARE @Correcto nvarchar(300) = N'Cobranza sin imputaci' + NCHAR(243) + N'n';

BEGIN TRY
    BEGIN TRANSACTION;

    SELECT N'Comprobante' AS Entidad, Comprobante_ID AS ID, Concepto AS Antes, @Correcto AS Despues
    FROM dbo.COMPROBANTES
    WHERE Tipo='REC' AND Concepto COLLATE Latin1_General_100_BIN2 = @Incorrecto
      AND DATALENGTH(Concepto)=DATALENGTH(@Incorrecto);

    SELECT N'Movimiento' AS Entidad, Movimiento_ID AS ID, Concepto AS Antes, @Correcto AS Despues
    FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS
    WHERE Tipo='REC' AND Clase='EMISION'
      AND Concepto COLLATE Latin1_General_100_BIN2 = @Incorrecto
      AND DATALENGTH(Concepto)=DATALENGTH(@Incorrecto)
      AND EXISTS (SELECT 1 FROM dbo.COMPROBANTES c
                  WHERE c.Comprobante_ID=CUENTA_CORRIENTE_MOVIMIENTOS.ComprobanteID AND c.Tipo='REC');

    UPDATE dbo.COMPROBANTES SET Concepto=@Correcto
    WHERE Tipo='REC' AND Concepto COLLATE Latin1_General_100_BIN2 = @Incorrecto
      AND DATALENGTH(Concepto)=DATALENGTH(@Incorrecto);
    SELECT @@ROWCOUNT AS ComprobantesCorregidos;

    UPDATE dbo.CUENTA_CORRIENTE_MOVIMIENTOS SET Concepto=@Correcto
    WHERE Tipo='REC' AND Clase='EMISION'
      AND Concepto COLLATE Latin1_General_100_BIN2 = @Incorrecto
      AND DATALENGTH(Concepto)=DATALENGTH(@Incorrecto)
      AND EXISTS (SELECT 1 FROM dbo.COMPROBANTES c
                  WHERE c.Comprobante_ID=CUENTA_CORRIENTE_MOVIMIENTOS.ComprobanteID AND c.Tipo='REC');
    SELECT @@ROWCOUNT AS MovimientosCorregidos;

    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
