/*
  Cuenta corriente: identificadores propios para tipos de comprobante y numeradores legacy.
  Ejecutar después de 02_modelo_incremental.sql. Es idempotente y conserva Tipo como clave única
  para las relaciones y consultas existentes. No asignar significado al orden de los nuevos IDs.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.TIPOS_COMPROBANTE', N'U') IS NULL
   OR OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES', N'U') IS NULL
    THROW 51080, 'Faltan las tablas de cuenta corriente. Ejecutá primero 02_modelo_incremental.sql.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF COL_LENGTH(N'dbo.TIPOS_COMPROBANTE', N'TipoComp_ID') IS NULL
    BEGIN
        DECLARE @PkTipoIndex int;
        SELECT @PkTipoIndex = unique_index_id
        FROM sys.key_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
          AND type = N'PK' AND name = N'PK_TIPOS_COMPROBANTE';

        IF @PkTipoIndex IS NULL
            THROW 51081, 'La clave primaria de TIPOS_COMPROBANTE no coincide con el esquema esperado.', 1;

        -- Solo se recrean las relaciones conocidas que apuntan a la PK Tipo.
        IF EXISTS (
            SELECT 1 FROM sys.foreign_keys
            WHERE referenced_object_id = OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
              AND key_index_id = @PkTipoIndex
              AND name NOT IN (N'FK_CC_NUM_Tipo', N'FK_FACT_TIPO_Tipo')
        )
            THROW 51082, 'TIPOS_COMPROBANTE tiene otras relaciones con su PK. Revisalas antes de migrar.', 1;

        ALTER TABLE dbo.TIPOS_COMPROBANTE ADD TipoComp_ID int IDENTITY(1,1) NOT NULL;
        IF NOT EXISTS (
            SELECT 1 FROM sys.key_constraints
            WHERE parent_object_id = OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
              AND type = N'UQ' AND name = N'UQ_TIPOS_COMPROBANTE_Tipo'
        )
            ALTER TABLE dbo.TIPOS_COMPROBANTE
                ADD CONSTRAINT UQ_TIPOS_COMPROBANTE_Tipo UNIQUE NONCLUSTERED (Tipo);

        IF EXISTS (SELECT 1 FROM sys.foreign_keys
                   WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES')
                     AND name = N'FK_CC_NUM_Tipo')
            ALTER TABLE dbo.COMPROBANTES_NUMERADORES DROP CONSTRAINT FK_CC_NUM_Tipo;

        IF OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE', N'U') IS NOT NULL
           AND EXISTS (SELECT 1 FROM sys.foreign_keys
                       WHERE parent_object_id = OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE')
                         AND name = N'FK_FACT_TIPO_Tipo')
            ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE DROP CONSTRAINT FK_FACT_TIPO_Tipo;

        ALTER TABLE dbo.TIPOS_COMPROBANTE DROP CONSTRAINT PK_TIPOS_COMPROBANTE;
        ALTER TABLE dbo.TIPOS_COMPROBANTE
            ADD CONSTRAINT PK_TIPOS_COMPROBANTE PRIMARY KEY CLUSTERED (TipoComp_ID);

        ALTER TABLE dbo.COMPROBANTES_NUMERADORES WITH CHECK
            ADD CONSTRAINT FK_CC_NUM_Tipo FOREIGN KEY (Tipo)
                REFERENCES dbo.TIPOS_COMPROBANTE (Tipo);
        ALTER TABLE dbo.COMPROBANTES_NUMERADORES CHECK CONSTRAINT FK_CC_NUM_Tipo;

        IF OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE', N'U') IS NOT NULL
        BEGIN
            ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE WITH CHECK
                ADD CONSTRAINT FK_FACT_TIPO_Tipo FOREIGN KEY (Tipo)
                    REFERENCES dbo.TIPOS_COMPROBANTE (Tipo);
            ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE CHECK CONSTRAINT FK_FACT_TIPO_Tipo;
        END;
    END;

    IF COL_LENGTH(N'dbo.COMPROBANTES_NUMERADORES', N'CompNum_ID') IS NULL
    BEGIN
        DECLARE @PkNumeradorIndex int;
        SELECT @PkNumeradorIndex = unique_index_id
        FROM sys.key_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES')
          AND type = N'PK' AND name = N'PK_COMPROBANTES_NUMERADORES';

        IF @PkNumeradorIndex IS NULL
            THROW 51083, 'La clave primaria de COMPROBANTES_NUMERADORES no coincide con el esquema esperado.', 1;

        IF EXISTS (
            SELECT 1 FROM sys.foreign_keys
            WHERE referenced_object_id = OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES')
              AND key_index_id = @PkNumeradorIndex
        )
            THROW 51084, 'COMPROBANTES_NUMERADORES tiene relaciones con su PK. Revisalas antes de migrar.', 1;

        ALTER TABLE dbo.COMPROBANTES_NUMERADORES ADD CompNum_ID int IDENTITY(1,1) NOT NULL;
        IF NOT EXISTS (
            SELECT 1 FROM sys.key_constraints
            WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES')
              AND type = N'UQ' AND name = N'UQ_COMPROBANTES_NUMERADORES_Tipo'
        )
            ALTER TABLE dbo.COMPROBANTES_NUMERADORES
                ADD CONSTRAINT UQ_COMPROBANTES_NUMERADORES_Tipo UNIQUE NONCLUSTERED (Tipo);

        ALTER TABLE dbo.COMPROBANTES_NUMERADORES DROP CONSTRAINT PK_COMPROBANTES_NUMERADORES;
        ALTER TABLE dbo.COMPROBANTES_NUMERADORES
            ADD CONSTRAINT PK_COMPROBANTES_NUMERADORES PRIMARY KEY CLUSTERED (CompNum_ID);
    END;

    DECLARE @ClavesEsperadas TABLE (Tabla sysname, Restriccion sysname, Tipo char(2), Columna sysname);
    INSERT @ClavesEsperadas (Tabla, Restriccion, Tipo, Columna) VALUES
        (N'TIPOS_COMPROBANTE', N'PK_TIPOS_COMPROBANTE', 'PK', N'TipoComp_ID'),
        (N'TIPOS_COMPROBANTE', N'UQ_TIPOS_COMPROBANTE_Tipo', 'UQ', N'Tipo'),
        (N'COMPROBANTES_NUMERADORES', N'PK_COMPROBANTES_NUMERADORES', 'PK', N'CompNum_ID'),
        (N'COMPROBANTES_NUMERADORES', N'UQ_COMPROBANTES_NUMERADORES_Tipo', 'UQ', N'Tipo');

    IF ISNULL(COLUMNPROPERTY(OBJECT_ID(N'dbo.TIPOS_COMPROBANTE'), N'TipoComp_ID', 'IsIdentity'), 0) <> 1
       OR ISNULL(COLUMNPROPERTY(OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES'), N'CompNum_ID', 'IsIdentity'), 0) <> 1
       OR EXISTS (
            SELECT 1 FROM @ClavesEsperadas e
            WHERE NOT EXISTS (
                SELECT 1
                FROM sys.key_constraints k
                JOIN sys.index_columns ic ON ic.object_id = k.parent_object_id
                    AND ic.index_id = k.unique_index_id AND ic.key_ordinal = 1
                JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                WHERE k.parent_object_id = OBJECT_ID(N'dbo.' + e.Tabla)
                  AND k.name COLLATE DATABASE_DEFAULT = e.Restriccion
                  AND k.type COLLATE DATABASE_DEFAULT = e.Tipo
                  AND c.name COLLATE DATABASE_DEFAULT = e.Columna
                  AND NOT EXISTS (
                      SELECT 1 FROM sys.index_columns otro
                      WHERE otro.object_id = k.parent_object_id
                        AND otro.index_id = k.unique_index_id AND otro.key_ordinal > 1
                  )
            )
       )
        THROW 51085, 'Los IDs o sus claves no coinciden con el esquema esperado.', 1;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                   WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES')
                     AND referenced_object_id = OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
                     AND name = N'FK_CC_NUM_Tipo' AND is_disabled = 0 AND is_not_trusted = 0)
       OR (OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE', N'U') IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                           WHERE parent_object_id = OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE')
                             AND referenced_object_id = OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
                             AND name = N'FK_FACT_TIPO_Tipo' AND is_disabled = 0 AND is_not_trusted = 0))
        THROW 51086, 'Las relaciones por Tipo no coinciden con el esquema esperado.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
