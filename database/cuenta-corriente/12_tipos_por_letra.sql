/*
  Una configuración de facturación por código y letra.
  Ejecutar después de 04_campos_comprobante_recibo.sql y 05_configuracion_facturacion.sql.
  TIPOS_COMPROBANTE conserva un registro único por código y sus relaciones existentes.
  Los IDs nuevos solo identifican filas; no expresan orden ni prioridad de emisión.
  Se puede volver a ejecutar sin cambiar los IDs ni recrear índices ya migrados.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE', N'U') IS NULL
   OR OBJECT_ID(N'dbo.TIPOS_COMPROBANTE', N'U') IS NULL
   OR OBJECT_ID(N'dbo.COMPROBANTES', N'U') IS NULL
    THROW 51100, 'Faltan tablas de facturación. Ejecutá primero las migraciones de cuenta corriente.', 1;

IF COL_LENGTH(N'dbo.FACTURACION_TIPOS_COMPROBANTE', N'Tipo') IS NULL
   OR COL_LENGTH(N'dbo.FACTURACION_TIPOS_COMPROBANTE', N'LetraPredeterminada') IS NULL
   OR COL_LENGTH(N'dbo.COMPROBANTES', N'NumeroCorrelativo') IS NULL
   OR COL_LENGTH(N'dbo.COMPROBANTES', N'Letra') IS NULL
   OR COL_LENGTH(N'dbo.COMPROBANTES', N'Sucursal') IS NULL
    THROW 51101, 'Faltan columnas de facturación. Revisá las migraciones previas.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys
                   WHERE parent_object_id = OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE')
                     AND referenced_object_id = OBJECT_ID(N'dbo.TIPOS_COMPROBANTE')
                     AND name = N'FK_FACT_TIPO_Tipo' AND is_disabled = 0 AND is_not_trusted = 0)
        THROW 51102, 'La relación del tipo con el catálogo no coincide con el esquema esperado.', 1;

    -- El índice nuevo distingue la numeración visible. No se puede migrar un número sin letra o sucursal.
    IF EXISTS (
        SELECT 1 FROM dbo.COMPROBANTES WITH (HOLDLOCK)
        WHERE NumeroCorrelativo IS NOT NULL
          AND (NULLIF(LTRIM(RTRIM(Letra)), '') IS NULL
               OR NULLIF(LTRIM(RTRIM(Sucursal)), '') IS NULL)
    )
        THROW 51103, 'Hay comprobantes numerados sin letra o sucursal. Completá esos datos antes de migrar.', 1;

    IF EXISTS (
        SELECT 1 FROM dbo.COMPROBANTES WITH (HOLDLOCK)
        WHERE NumeroCorrelativo IS NOT NULL
        GROUP BY Tipo, Letra, Sucursal, NumeroCorrelativo
        HAVING COUNT(*) > 1
    )
        THROW 51104, 'Hay números de comprobante repetidos para un mismo tipo, letra y sucursal.', 1;

    IF COL_LENGTH(N'dbo.FACTURACION_TIPOS_COMPROBANTE', N'FactTipo_ID') IS NULL
        ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE
            ADD FactTipo_ID int IDENTITY(1,1) NOT NULL;

    IF ISNULL(COLUMNPROPERTY(OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE'), N'FactTipo_ID', 'IsIdentity'), 0) <> 1
        THROW 51105, 'El identificador de configuración no coincide con el esquema esperado.', 1;

    DECLARE @PkConfiguracion int;
    SELECT @PkConfiguracion = unique_index_id
    FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE')
      AND type = N'PK' AND name = N'PK_FACTURACION_TIPOS_COMPROBANTE';

    IF @PkConfiguracion IS NULL
        THROW 51106, 'La clave primaria de configuración no coincide con el esquema esperado.', 1;

    -- Aceptar únicamente la PK original (Tipo) o la nueva (FactTipo_ID).
    IF NOT EXISTS (
        SELECT 1 FROM sys.index_columns ic
        JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE ic.object_id = OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE')
          AND ic.index_id = @PkConfiguracion AND ic.key_ordinal = 1
          AND c.name IN (N'Tipo', N'FactTipo_ID')
          AND NOT EXISTS (SELECT 1 FROM sys.index_columns otra
                          WHERE otra.object_id = ic.object_id AND otra.index_id = ic.index_id
                            AND otra.key_ordinal > 1)
    )
        THROW 51107, 'La clave primaria de configuración tiene columnas inesperadas.', 1;

    IF EXISTS (SELECT 1 FROM sys.key_constraints
               WHERE parent_object_id = OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE')
                 AND type = N'UQ' AND name = N'UQ_FACTURACION_TIPOS_COMPROBANTE_TipoLetra')
       AND NOT EXISTS (
            SELECT 1 FROM sys.key_constraints k
            JOIN sys.index_columns uno ON uno.object_id = k.parent_object_id
                AND uno.index_id = k.unique_index_id AND uno.key_ordinal = 1
            JOIN sys.columns c1 ON c1.object_id = uno.object_id AND c1.column_id = uno.column_id
            JOIN sys.index_columns dos ON dos.object_id = k.parent_object_id
                AND dos.index_id = k.unique_index_id AND dos.key_ordinal = 2
            JOIN sys.columns c2 ON c2.object_id = dos.object_id AND c2.column_id = dos.column_id
            WHERE k.parent_object_id = OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE')
              AND k.name = N'UQ_FACTURACION_TIPOS_COMPROBANTE_TipoLetra'
              AND c1.name = N'Tipo' AND c2.name = N'LetraPredeterminada'
              AND NOT EXISTS (SELECT 1 FROM sys.index_columns otra
                              WHERE otra.object_id = k.parent_object_id AND otra.index_id = k.unique_index_id
                                AND otra.key_ordinal > 2)
       )
        THROW 51108, 'La clave única de código y letra tiene columnas inesperadas.', 1;

    IF NOT EXISTS (SELECT 1 FROM sys.key_constraints
                   WHERE parent_object_id = OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE')
                     AND type = N'UQ' AND name = N'UQ_FACTURACION_TIPOS_COMPROBANTE_TipoLetra')
        ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE
            ADD CONSTRAINT UQ_FACTURACION_TIPOS_COMPROBANTE_TipoLetra
                UNIQUE NONCLUSTERED (Tipo, LetraPredeterminada);

    IF EXISTS (
        SELECT 1 FROM sys.index_columns ic
        JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE ic.object_id = OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE')
          AND ic.index_id = @PkConfiguracion AND ic.key_ordinal = 1 AND c.name = N'Tipo'
    )
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.foreign_keys
                   WHERE referenced_object_id = OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE')
                     AND key_index_id = @PkConfiguracion)
            THROW 51109, 'Hay relaciones con la clave anterior de configuración. Revisalas antes de migrar.', 1;

        ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE
            DROP CONSTRAINT PK_FACTURACION_TIPOS_COMPROBANTE;
        ALTER TABLE dbo.FACTURACION_TIPOS_COMPROBANTE
            ADD CONSTRAINT PK_FACTURACION_TIPOS_COMPROBANTE
                PRIMARY KEY CLUSTERED (FactTipo_ID);
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
                   WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                     AND name = N'CK_CC_COMP_NumeroConLetraSucursal')
        ALTER TABLE dbo.COMPROBANTES WITH CHECK
            ADD CONSTRAINT CK_CC_COMP_NumeroConLetraSucursal CHECK (
                NumeroCorrelativo IS NULL
                OR (NULLIF(LTRIM(RTRIM(Letra)), '') IS NOT NULL
                    AND NULLIF(LTRIM(RTRIM(Sucursal)), '') IS NOT NULL));

    DECLARE @IndiceNumero int, @IndiceNumeroNuevo bit = 0;
    SELECT @IndiceNumero = index_id
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.COMPROBANTES') AND name = N'UX_CC_COMP_Numero';

    IF @IndiceNumero IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM sys.indexes
                       WHERE object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                         AND index_id = @IndiceNumero AND is_unique = 1 AND has_filter = 1
                         AND filter_definition LIKE N'%NumeroCorrelativo%IS NOT NULL%')
            THROW 51110, 'El índice de numeración no coincide con el esquema esperado.', 1;

        IF (SELECT COUNT(*) FROM sys.index_columns
            WHERE object_id = OBJECT_ID(N'dbo.COMPROBANTES')
              AND index_id = @IndiceNumero AND key_ordinal > 0) = 4
           AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c
                       ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                       WHERE ic.object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                         AND ic.index_id = @IndiceNumero AND ic.key_ordinal = 1 AND c.name = N'Tipo')
           AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c
                       ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                       WHERE ic.object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                         AND ic.index_id = @IndiceNumero AND ic.key_ordinal = 2 AND c.name = N'Letra')
           AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c
                       ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                       WHERE ic.object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                         AND ic.index_id = @IndiceNumero AND ic.key_ordinal = 3 AND c.name = N'Sucursal')
           AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c
                       ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                       WHERE ic.object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                         AND ic.index_id = @IndiceNumero AND ic.key_ordinal = 4 AND c.name = N'NumeroCorrelativo')
            SET @IndiceNumeroNuevo = 1;
        ELSE IF (SELECT COUNT(*) FROM sys.index_columns
                 WHERE object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                   AND index_id = @IndiceNumero AND key_ordinal > 0) = 2
            AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c
                        ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                        WHERE ic.object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                          AND ic.index_id = @IndiceNumero AND ic.key_ordinal = 1 AND c.name = N'Tipo')
            AND EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c
                        ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                        WHERE ic.object_id = OBJECT_ID(N'dbo.COMPROBANTES')
                          AND ic.index_id = @IndiceNumero AND ic.key_ordinal = 2 AND c.name = N'NumeroCorrelativo')
            DROP INDEX UX_CC_COMP_Numero ON dbo.COMPROBANTES;
        ELSE
            THROW 51111, 'El índice de numeración tiene columnas inesperadas.', 1;
    END;

    IF @IndiceNumeroNuevo = 0
        CREATE UNIQUE INDEX UX_CC_COMP_Numero
            ON dbo.COMPROBANTES (Tipo, Letra, Sucursal, NumeroCorrelativo)
            WHERE NumeroCorrelativo IS NOT NULL;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
