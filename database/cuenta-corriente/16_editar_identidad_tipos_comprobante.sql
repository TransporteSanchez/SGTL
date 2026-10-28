/*
  Permite corregir la sigla de un tipo configurable y trasladar el cambio a los
  comprobantes y sus relaciones sin cambiar los identificadores de las filas.
  Ejecutar después de 15_credito_interno_cancelatorio.sql.

  Las relaciones que guardan una copia del tipo usan ON UPDATE CASCADE. La
  autorreferencia de COMPROBANTES se basa en ID y cliente para evitar un ciclo
  de cascadas; la API actualiza TipoReferencia en la misma transacción.
  Es idempotente. No modifica comprobantes ni tipos existentes.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.TIPOS_COMPROBANTE', N'U') IS NULL
   OR OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES', N'U') IS NULL
   OR OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE', N'U') IS NULL
   OR OBJECT_ID(N'dbo.COMPROBANTES', N'U') IS NULL
   OR OBJECT_ID(N'dbo.COMPROBANTES_PROFORMAS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS', N'U') IS NULL
   OR OBJECT_ID(N'dbo.RECIBOS_FORMAS_PAGO', N'U') IS NULL
    THROW 51160, 'Faltan tablas de cuenta corriente. Ejecutá primero las migraciones previas.', 1;

IF COL_LENGTH(N'dbo.COMPROBANTES', N'TipoReferencia') IS NULL
   OR COL_LENGTH(N'dbo.COMPROBANTES', N'Letra') IS NULL
   OR COL_LENGTH(N'dbo.FACTURACION_TIPOS_COMPROBANTE', N'FactTipo_ID') IS NULL
    THROW 51161, 'Faltan columnas de los comprobantes o de su configuración.', 1;

IF OBJECT_ID(N'dbo.TR_CC_COMP_ImpactoMovimientos', N'TR') IS NULL
   OR OBJECT_ID(N'dbo.TR_CC_MOV_ImpactoComprobante', N'TR') IS NULL
    THROW 51167, 'Falta la migración del crédito cancelatorio. Ejecutala antes de continuar.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH(N'dbo.TIPOS_COMPROBANTE', N'EsElectronico') IS NULL
        ALTER TABLE dbo.TIPOS_COMPROBANTE
            ADD EsElectronico bit NOT NULL
                CONSTRAINT DF_TIPOS_COMPROBANTE_EsElectronico DEFAULT (0) WITH VALUES;

    IF EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id=OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
                 AND name=N'EsElectronico'
                 AND (system_type_id<>104 OR is_nullable<>0))
        THROW 51165, 'El indicador electrónico no coincide con el esquema esperado.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints d
        JOIN sys.columns col ON col.object_id=d.parent_object_id
            AND col.column_id=d.parent_column_id
        WHERE d.parent_object_id=OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
          AND col.name=N'EsElectronico'
    )
        ALTER TABLE dbo.TIPOS_COMPROBANTE
            ADD CONSTRAINT DF_TIPOS_COMPROBANTE_EsElectronico DEFAULT (0) FOR EsElectronico;

    IF EXISTS (
        SELECT 1 FROM sys.default_constraints d
        JOIN sys.columns col ON col.object_id=d.parent_object_id
            AND col.column_id=d.parent_column_id
        WHERE d.parent_object_id=OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
          AND col.name=N'EsElectronico'
          AND REPLACE(REPLACE(REPLACE(d.definition,N'(',N''),N')',N''),N' ',N'')<>N'0'
    )
        THROW 51166, 'El valor predeterminado del indicador electrónico debe ser No.', 1;

    -- Una FK desconocida sobre la sigla impediría la corrección histórica.
    IF EXISTS (
        SELECT 1
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id
        JOIN sys.columns col ON col.object_id=fkc.referenced_object_id
            AND col.column_id=fkc.referenced_column_id
        WHERE fk.referenced_object_id=OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
          AND col.name=N'Tipo'
          AND fk.name NOT IN (N'FK_CC_NUM_Tipo',N'FK_FACT_TIPO_Tipo',N'FK_CC_COMP_Tipo')
    )
        THROW 51162, 'Hay relaciones nuevas con la sigla del tipo. Revisalas antes de continuar.', 1;

    IF EXISTS (
        SELECT 1
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id
        JOIN sys.columns col ON col.object_id=fkc.referenced_object_id
            AND col.column_id=fkc.referenced_column_id
        WHERE fk.referenced_object_id=OBJECT_ID(N'dbo.COMPROBANTES')
          AND col.name=N'Tipo'
          AND fk.name NOT IN (N'FK_CC_COMP_Referencia',N'FK_CC_CP_Factura',
                              N'FK_CC_MOV_Comprobante',N'FK_CC_FP_Recibo')
    )
        THROW 51163, 'Hay relaciones nuevas con la sigla del comprobante. Revisalas antes de continuar.', 1;

    -- Primero se retiran todas las referencias al tipo del comprobante.
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(N'dbo.COMPROBANTES') AND name=N'FK_CC_COMP_Referencia')
        ALTER TABLE dbo.COMPROBANTES DROP CONSTRAINT FK_CC_COMP_Referencia;
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(N'dbo.COMPROBANTES_PROFORMAS') AND name=N'FK_CC_CP_Factura')
        ALTER TABLE dbo.COMPROBANTES_PROFORMAS DROP CONSTRAINT FK_CC_CP_Factura;
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS') AND name=N'FK_CC_MOV_Comprobante')
        ALTER TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS DROP CONSTRAINT FK_CC_MOV_Comprobante;
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(N'dbo.RECIBOS_FORMAS_PAGO') AND name=N'FK_CC_FP_Recibo')
        ALTER TABLE dbo.RECIBOS_FORMAS_PAGO DROP CONSTRAINT FK_CC_FP_Recibo;

    IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.COMPROBANTES') AND name=N'UQ_CC_COMP_Cliente')
        ALTER TABLE dbo.COMPROBANTES ADD CONSTRAINT UQ_CC_COMP_Cliente
            UNIQUE NONCLUSTERED (Comprobante_ID,ClienteID);

    ALTER TABLE dbo.COMPROBANTES WITH CHECK
        ADD CONSTRAINT FK_CC_COMP_Referencia
            FOREIGN KEY (ComprobanteReferenciaID,ClienteID)
            REFERENCES dbo.COMPROBANTES (Comprobante_ID,ClienteID);
    ALTER TABLE dbo.COMPROBANTES CHECK CONSTRAINT FK_CC_COMP_Referencia;

    ALTER TABLE dbo.COMPROBANTES_PROFORMAS WITH CHECK
        ADD CONSTRAINT FK_CC_CP_Factura
            FOREIGN KEY (ComprobanteID,ClienteID,TipoFactura)
            REFERENCES dbo.COMPROBANTES (Comprobante_ID,ClienteID,Tipo)
            ON UPDATE CASCADE;
    ALTER TABLE dbo.COMPROBANTES_PROFORMAS CHECK CONSTRAINT FK_CC_CP_Factura;

    ALTER TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS WITH CHECK
        ADD CONSTRAINT FK_CC_MOV_Comprobante
            FOREIGN KEY (ComprobanteID,ClienteID,Tipo)
            REFERENCES dbo.COMPROBANTES (Comprobante_ID,ClienteID,Tipo)
            ON UPDATE CASCADE;
    ALTER TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS CHECK CONSTRAINT FK_CC_MOV_Comprobante;

    ALTER TABLE dbo.RECIBOS_FORMAS_PAGO WITH CHECK
        ADD CONSTRAINT FK_CC_FP_Recibo
            FOREIGN KEY (ComprobanteID,ClienteID,TipoRecibo)
            REFERENCES dbo.COMPROBANTES (Comprobante_ID,ClienteID,Tipo)
            ON UPDATE CASCADE;
    ALTER TABLE dbo.RECIBOS_FORMAS_PAGO CHECK CONSTRAINT FK_CC_FP_Recibo;

    -- El cambio del catálogo llega a configuraciones, numeradores legados y
    -- comprobantes; las cascadas anteriores conservan los tipos relacionados.
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES') AND name=N'FK_CC_NUM_Tipo')
        ALTER TABLE dbo.COMPROBANTES_NUMERADORES DROP CONSTRAINT FK_CC_NUM_Tipo;
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE') AND name=N'FK_FACT_TIPO_Tipo')
        ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE DROP CONSTRAINT FK_FACT_TIPO_Tipo;
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID(N'dbo.COMPROBANTES') AND name=N'FK_CC_COMP_Tipo')
        ALTER TABLE dbo.COMPROBANTES DROP CONSTRAINT FK_CC_COMP_Tipo;

    ALTER TABLE dbo.COMPROBANTES_NUMERADORES WITH CHECK
        ADD CONSTRAINT FK_CC_NUM_Tipo FOREIGN KEY (Tipo)
            REFERENCES dbo.TIPOS_COMPROBANTE (Tipo) ON UPDATE CASCADE;
    ALTER TABLE dbo.COMPROBANTES_NUMERADORES CHECK CONSTRAINT FK_CC_NUM_Tipo;

    ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE WITH CHECK
        ADD CONSTRAINT FK_FACT_TIPO_Tipo FOREIGN KEY (Tipo)
            REFERENCES dbo.TIPOS_COMPROBANTE (Tipo) ON UPDATE CASCADE;
    ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE CHECK CONSTRAINT FK_FACT_TIPO_Tipo;

    ALTER TABLE dbo.COMPROBANTES WITH CHECK
        ADD CONSTRAINT FK_CC_COMP_Tipo FOREIGN KEY (Tipo,Impacto)
            REFERENCES dbo.TIPOS_COMPROBANTE (Tipo,Impacto) ON UPDATE CASCADE;
    ALTER TABLE dbo.COMPROBANTES CHECK CONSTRAINT FK_CC_COMP_Tipo;

    -- La autorreferencia conserva ID y cliente por FK. Al escribir la
    -- referencia, este disparador comprueba también la copia de su sigla.
    -- Una cascada que modifica solamente COMPROBANTES.Tipo no activa la
    -- validación: la API corrige TipoReferencia después, en la misma transacción.
    IF EXISTS (
        SELECT 1
        FROM dbo.COMPROBANTES c
        LEFT JOIN dbo.COMPROBANTES referencia
            ON referencia.Comprobante_ID=c.ComprobanteReferenciaID
            AND referencia.ClienteID=c.ClienteID
        WHERE c.ComprobanteReferenciaID IS NOT NULL
          AND (referencia.Comprobante_ID IS NULL OR c.TipoReferencia IS NULL
               OR c.TipoReferencia<>referencia.Tipo)
    )
        THROW 51168, 'Hay comprobantes con una sigla de referencia distinta de la del comprobante referido.', 1;

    EXEC(N'CREATE OR ALTER TRIGGER dbo.TR_CC_COMP_TipoReferencia
ON dbo.COMPROBANTES
AFTER INSERT, UPDATE
AS
BEGIN
    IF (ROWCOUNT_BIG()=0) RETURN;
    SET NOCOUNT ON;
    IF NOT (UPDATE(ComprobanteReferenciaID) OR UPDATE(TipoReferencia) OR UPDATE(ClienteID)) RETURN;
    IF EXISTS (
        SELECT 1
        FROM inserted c
        LEFT JOIN dbo.COMPROBANTES referencia WITH (UPDLOCK,HOLDLOCK)
            ON referencia.Comprobante_ID=c.ComprobanteReferenciaID
            AND referencia.ClienteID=c.ClienteID
        WHERE c.ComprobanteReferenciaID IS NOT NULL
          AND (referencia.Comprobante_ID IS NULL OR c.TipoReferencia IS NULL
               OR c.TipoReferencia<>referencia.Tipo)
    )
        THROW 51169, ''La sigla de referencia no coincide con el comprobante referido.'', 1;
END');
    ENABLE TRIGGER dbo.TR_CC_COMP_TipoReferencia ON dbo.COMPROBANTES;

    -- Las siete relaciones deben quedar habilitadas y validadas, incluso si
    -- había una definición deshabilitada antes de ejecutar esta migración.
    IF (SELECT COUNT(*) FROM sys.foreign_keys
        WHERE (parent_object_id=OBJECT_ID(N'dbo.COMPROBANTES')
               AND name IN (N'FK_CC_COMP_Referencia',N'FK_CC_COMP_Tipo'))
           OR (parent_object_id=OBJECT_ID(N'dbo.COMPROBANTES_PROFORMAS') AND name=N'FK_CC_CP_Factura')
           OR (parent_object_id=OBJECT_ID(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS') AND name=N'FK_CC_MOV_Comprobante')
           OR (parent_object_id=OBJECT_ID(N'dbo.RECIBOS_FORMAS_PAGO') AND name=N'FK_CC_FP_Recibo')
           OR (parent_object_id=OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES') AND name=N'FK_CC_NUM_Tipo')
           OR (parent_object_id=OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE') AND name=N'FK_FACT_TIPO_Tipo')) <> 7
       OR EXISTS (SELECT 1 FROM sys.foreign_keys
                  WHERE name IN (N'FK_CC_COMP_Referencia',N'FK_CC_CP_Factura',N'FK_CC_MOV_Comprobante',
                                 N'FK_CC_FP_Recibo',N'FK_CC_NUM_Tipo',N'FK_FACT_TIPO_Tipo',N'FK_CC_COMP_Tipo')
                    AND (is_disabled=1 OR is_not_trusted=1
                         OR (name=N'FK_CC_COMP_Referencia' AND update_referential_action<>0)
                         OR (name<>N'FK_CC_COMP_Referencia' AND update_referential_action<>1)))
        THROW 51164, 'Las relaciones de comprobantes no quedaron habilitadas y validadas.', 1;

    IF NOT EXISTS (SELECT 1 FROM sys.triggers
                   WHERE object_id=OBJECT_ID(N'dbo.TR_CC_COMP_TipoReferencia',N'TR')
                     AND parent_id=OBJECT_ID(N'dbo.COMPROBANTES') AND is_disabled=0)
        THROW 51170, 'La validación de la sigla de referencia no quedó activa.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
