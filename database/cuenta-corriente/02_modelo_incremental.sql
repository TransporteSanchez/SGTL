/* MIGRACIÓN INCREMENTAL DEL MÓDULO CUENTA CORRIENTE.
   Solo primera instalación sobre la base de desarrollo Transporte_Sanchez.
   NO ejecutar el script completo de exportación junto con esta migración.
   Elegir la base explícitamente en SSMS. Las dos confirmaciones son obligatorias.
   No usa GO: todo el DDL y los catálogos pertenecen a una transacción.
   No borra objetos, no modifica importes existentes, no asigna permisos a grupos. */
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ConfirmarBaseDesarrollo bit = 0;
DECLARE @NombreBaseEsperada sysname = N'Transporte_Sanchez';

IF @ConfirmarBaseDesarrollo <> 1 OR DB_NAME() <> @NombreBaseEsperada
    THROW 51000, 'Revisar y confirmar la base de desarrollo antes de ejecutar.', 1;
IF DB_NAME() IN ('master','model','msdb','tempdb')
    THROW 51001, 'No se permite instalar en una base de sistema.', 1;

IF OBJECT_ID('dbo.CLIENTES','U') IS NULL OR OBJECT_ID('dbo.PROFORMAS','U') IS NULL
 OR OBJECT_ID('dbo.PROFORMA_DETALLE','U') IS NULL OR OBJECT_ID('dbo.VIAJES','U') IS NULL
 OR OBJECT_ID('dbo.USUARIOS','U') IS NULL OR OBJECT_ID('dbo.GRUPOS','U') IS NULL
 OR OBJECT_ID('dbo.MENU','U') IS NULL OR OBJECT_ID('dbo.AUDITORIA','U') IS NULL
    THROW 51002, 'Faltan tablas base de SGTL. Ejecutar y revisar la verificación previa.', 1;

IF EXISTS (SELECT 1 FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name IN (
 'TIPOS_COMPROBANTE','COMPROBANTES_NUMERADORES','COMPROBANTES','COMPROBANTES_DETALLE',
 'COMPROBANTES_PROFORMAS','CUENTA_CORRIENTE_MOVIMIENTOS','CUENTA_CORRIENTE_APLICACIONES',
 'RECIBOS_FORMAS_PAGO','PROFORMAS_VIAJES','PERMISOS','GRUPOS_PERMISOS'))
    THROW 51003, 'Ya existen objetos del módulo. No se admite reinstalación ni instalación parcial.', 1;

IF COL_LENGTH('dbo.CLIENTES','Activo') IS NOT NULL
 OR COL_LENGTH('dbo.PROFORMAS','VersionCuentaCorriente') IS NOT NULL
    THROW 51004, 'El esquema tiene extensiones previas. Revisar antes de instalar.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    ALTER TABLE dbo.CLIENTES ADD Activo bit NOT NULL
        CONSTRAINT DF_CLIENTES_Activo DEFAULT (1) WITH VALUES;
    -- Los clientes existentes quedan activos; no se infiere su estado histórico.
    ALTER TABLE dbo.PROFORMAS ADD VersionCuentaCorriente rowversion;
    -- Permite referencias compuestas que aseguren el mismo cliente.
    ALTER TABLE dbo.PROFORMAS ADD CONSTRAINT UQ_PROFORMAS_IdCliente UNIQUE (Proforma_ID, ClienteID);

    CREATE TABLE dbo.TIPOS_COMPROBANTE (
        Tipo varchar(3) NOT NULL CONSTRAINT PK_TIPOS_COMPROBANTE PRIMARY KEY,
        Descripcion nvarchar(50) NOT NULL,
        Impacto char(1) NOT NULL,
        CONSTRAINT UQ_TIPOS_COMPROBANTE_Impacto UNIQUE (Tipo, Impacto),
        CONSTRAINT CK_TIPOS_COMPROBANTE_Valores CHECK (
            (Tipo IN ('FAC','ND') AND Impacto = 'D') OR
            (Tipo IN ('NC','REC') AND Impacto = 'C'))
    );
    INSERT dbo.TIPOS_COMPROBANTE (Tipo, Descripcion, Impacto) VALUES
        ('FAC',N'Factura interna','D'), ('ND',N'Nota de débito interna','D'),
        ('NC',N'Nota de crédito interna','C'), ('REC',N'Recibo interno','C');

    CREATE TABLE dbo.COMPROBANTES_NUMERADORES (
        Tipo varchar(3) NOT NULL CONSTRAINT PK_COMPROBANTES_NUMERADORES PRIMARY KEY,
        UltimoNumero int NOT NULL CONSTRAINT DF_CC_NUM_Ultimo DEFAULT (0),
        CONSTRAINT FK_CC_NUM_Tipo FOREIGN KEY (Tipo) REFERENCES dbo.TIPOS_COMPROBANTE (Tipo),
        CONSTRAINT CK_CC_NUM_Rango CHECK (UltimoNumero BETWEEN 0 AND 99999999)
    );
    INSERT dbo.COMPROBANTES_NUMERADORES (Tipo) VALUES ('FAC'),('NC'),('ND'),('REC');

    CREATE TABLE dbo.COMPROBANTES (
        Comprobante_ID int IDENTITY(1,1) NOT NULL CONSTRAINT PK_COMPROBANTES PRIMARY KEY,
        ClienteID int NOT NULL,
        Tipo varchar(3) NOT NULL,
        Impacto char(1) NOT NULL,
        NumeroCorrelativo int NULL,
        FechaEmision date NOT NULL,
        FechaVencimiento date NULL,
        Moneda char(3) NOT NULL CONSTRAINT DF_CC_COMP_Moneda DEFAULT ('ARS'),
        Estado varchar(10) NOT NULL CONSTRAINT DF_CC_COMP_Estado DEFAULT ('BORRADOR'),
        RazonSocial nvarchar(200) NOT NULL,
        CUIT nvarchar(20) NOT NULL,
        Domicilio nvarchar(300) NULL,
        CondicionFiscal nvarchar(60) NULL,
        CondicionComercial nvarchar(200) NULL,
        Subtotal decimal(18,2) NOT NULL CONSTRAINT DF_CC_COMP_Subtotal DEFAULT (0),
        Descuentos decimal(18,2) NOT NULL CONSTRAINT DF_CC_COMP_Descuentos DEFAULT (0),
        Neto decimal(18,2) NOT NULL CONSTRAINT DF_CC_COMP_Neto DEFAULT (0),
        IVA decimal(18,2) NOT NULL CONSTRAINT DF_CC_COMP_IVA DEFAULT (0),
        OtrosImpuestos decimal(18,2) NOT NULL CONSTRAINT DF_CC_COMP_Otros DEFAULT (0),
        Total decimal(18,2) NOT NULL CONSTRAINT DF_CC_COMP_Total DEFAULT (0),
        Concepto nvarchar(300) NOT NULL,
        Observaciones nvarchar(max) NULL,
        ComprobanteReferenciaID int NULL,
        -- NC siempre referencia una FAC del mismo cliente; ND puede hacerlo.
        TipoReferencia varchar(3) NULL,
        ClaveOperacion uniqueidentifier NOT NULL,
        UsuarioAltaID int NOT NULL,
        FechaAlta datetime2(3) NOT NULL CONSTRAINT DF_CC_COMP_Alta DEFAULT (SYSUTCDATETIME()),
        UsuarioModificacionID int NULL,
        FechaModificacion datetime2(3) NULL,
        UsuarioEmisionID int NULL,
        FechaEmisionRegistro datetime2(3) NULL,
        UsuarioAnulacionID int NULL,
        FechaAnulacion datetime2(3) NULL,
        MotivoAnulacion nvarchar(500) NULL,
        Version rowversion,
        CONSTRAINT FK_CC_COMP_Cliente FOREIGN KEY (ClienteID) REFERENCES dbo.CLIENTES (Cliente_ID),
        CONSTRAINT FK_CC_COMP_Tipo FOREIGN KEY (Tipo,Impacto) REFERENCES dbo.TIPOS_COMPROBANTE (Tipo,Impacto),
        CONSTRAINT FK_CC_COMP_Alta FOREIGN KEY (UsuarioAltaID) REFERENCES dbo.USUARIOS (Usuario_ID),
        CONSTRAINT FK_CC_COMP_Modi FOREIGN KEY (UsuarioModificacionID) REFERENCES dbo.USUARIOS (Usuario_ID),
        CONSTRAINT FK_CC_COMP_Emision FOREIGN KEY (UsuarioEmisionID) REFERENCES dbo.USUARIOS (Usuario_ID),
        CONSTRAINT FK_CC_COMP_Anulacion FOREIGN KEY (UsuarioAnulacionID) REFERENCES dbo.USUARIOS (Usuario_ID),
        CONSTRAINT UQ_CC_COMP_Operacion UNIQUE (ClaveOperacion),
        CONSTRAINT UQ_CC_COMP_ClienteImpacto UNIQUE (Comprobante_ID,ClienteID,Impacto),
        CONSTRAINT UQ_CC_COMP_ClienteTipo UNIQUE (Comprobante_ID,ClienteID,Tipo),
        CONSTRAINT CK_CC_COMP_Moneda CHECK (Moneda = 'ARS'),
        CONSTRAINT CK_CC_COMP_Estado CHECK (Estado IN ('BORRADOR','EMITIDO','ANULADO')),
        CONSTRAINT CK_CC_COMP_Numero CHECK (NumeroCorrelativo IS NULL OR NumeroCorrelativo BETWEEN 1 AND 99999999),
        CONSTRAINT CK_CC_COMP_Vencimiento CHECK (FechaVencimiento IS NULL OR FechaVencimiento >= FechaEmision),
        CONSTRAINT CK_CC_COMP_Importes CHECK (
            Subtotal >= 0 AND Descuentos BETWEEN 0 AND Subtotal AND Neto = Subtotal - Descuentos
            AND IVA >= 0 AND OtrosImpuestos >= 0 AND Total = Neto + IVA + OtrosImpuestos),
        CONSTRAINT CK_CC_COMP_Emision CHECK (
            (Estado = 'BORRADOR' AND NumeroCorrelativo IS NULL AND UsuarioEmisionID IS NULL AND FechaEmisionRegistro IS NULL)
            OR (Estado IN ('EMITIDO','ANULADO') AND NumeroCorrelativo IS NOT NULL AND Total > 0
                AND UsuarioEmisionID IS NOT NULL AND FechaEmisionRegistro IS NOT NULL
                AND (Tipo NOT IN ('FAC','ND') OR FechaVencimiento IS NOT NULL))),
        CONSTRAINT CK_CC_COMP_Anulacion CHECK (
            (Estado = 'ANULADO' AND UsuarioAnulacionID IS NOT NULL AND FechaAnulacion IS NOT NULL
                AND NULLIF(LTRIM(RTRIM(MotivoAnulacion)),N'') IS NOT NULL)
            OR (Estado <> 'ANULADO' AND UsuarioAnulacionID IS NULL AND FechaAnulacion IS NULL AND MotivoAnulacion IS NULL)),
        CONSTRAINT CK_CC_COMP_Referencia CHECK (
            (ComprobanteReferenciaID IS NULL AND TipoReferencia IS NULL AND Tipo <> 'NC')
            OR (ComprobanteReferenciaID IS NOT NULL AND TipoReferencia IS NOT NULL AND TipoReferencia = 'FAC'
                AND Tipo IN ('NC','ND') AND ComprobanteReferenciaID <> Comprobante_ID))
    );
    ALTER TABLE dbo.COMPROBANTES ADD CONSTRAINT FK_CC_COMP_Referencia
        FOREIGN KEY (ComprobanteReferenciaID,ClienteID,TipoReferencia)
        REFERENCES dbo.COMPROBANTES (Comprobante_ID,ClienteID,Tipo);
    CREATE UNIQUE INDEX UX_CC_COMP_Numero ON dbo.COMPROBANTES (Tipo,NumeroCorrelativo)
        WHERE NumeroCorrelativo IS NOT NULL;
    CREATE INDEX IX_CC_COMP_ClienteFecha ON dbo.COMPROBANTES (ClienteID,FechaEmision,Comprobante_ID)
        INCLUDE (Tipo,Estado,Total,FechaVencimiento);

    CREATE TABLE dbo.COMPROBANTES_DETALLE (
        Detalle_ID int IDENTITY(1,1) NOT NULL CONSTRAINT PK_COMPROBANTES_DETALLE PRIMARY KEY,
        ComprobanteID int NOT NULL,
        Orden int NOT NULL,
        ProformaDetalleID int NULL,
        Codigo nvarchar(50) NULL,
        Concepto nvarchar(200) NOT NULL,
        Descripcion nvarchar(max) NULL,
        Cantidad decimal(18,2) NOT NULL,
        Unidad nvarchar(30) NULL,
        PrecioUnitario decimal(18,2) NOT NULL,
        DescuentoPct decimal(5,2) NOT NULL,
        IvaPct decimal(5,2) NOT NULL,
        Subtotal decimal(18,2) NOT NULL,
        DescuentoImporte decimal(18,2) NOT NULL,
        Neto decimal(18,2) NOT NULL,
        IVA decimal(18,2) NOT NULL,
        Total decimal(18,2) NOT NULL,
        CONSTRAINT FK_CC_DET_Comprobante FOREIGN KEY (ComprobanteID) REFERENCES dbo.COMPROBANTES (Comprobante_ID),
        CONSTRAINT FK_CC_DET_Proforma FOREIGN KEY (ProformaDetalleID) REFERENCES dbo.PROFORMA_DETALLE (Detalle_ID),
        CONSTRAINT UQ_CC_DET_Orden UNIQUE (ComprobanteID,Orden),
        CONSTRAINT CK_CC_DET_Importes CHECK (
            Orden > 0 AND Cantidad > 0 AND PrecioUnitario >= 0 AND DescuentoPct BETWEEN 0 AND 100
            AND IvaPct BETWEEN 0 AND 100 AND Subtotal >= 0 AND DescuentoImporte BETWEEN 0 AND Subtotal
            AND Neto = Subtotal - DescuentoImporte AND IVA >= 0 AND Total = Neto + IVA)
    );

    CREATE TABLE dbo.COMPROBANTES_PROFORMAS (
        ComprobanteProforma_ID int IDENTITY(1,1) NOT NULL CONSTRAINT PK_COMPROBANTES_PROFORMAS PRIMARY KEY,
        ComprobanteID int NOT NULL,
        ProformaID int NOT NULL,
        ClienteID int NOT NULL,
        TipoFactura varchar(3) NOT NULL CONSTRAINT DF_CC_CP_Tipo DEFAULT ('FAC'),
        Vigente bit NOT NULL CONSTRAINT DF_CC_CP_Vigente DEFAULT (1),
        UsuarioAltaID int NOT NULL,
        FechaAlta datetime2(3) NOT NULL CONSTRAINT DF_CC_CP_Alta DEFAULT (SYSUTCDATETIME()),
        UsuarioAnulacionID int NULL,
        FechaAnulacion datetime2(3) NULL,
        MotivoAnulacion nvarchar(500) NULL,
        CONSTRAINT FK_CC_CP_Factura FOREIGN KEY (ComprobanteID,ClienteID,TipoFactura)
            REFERENCES dbo.COMPROBANTES (Comprobante_ID,ClienteID,Tipo),
        CONSTRAINT FK_CC_CP_Proforma FOREIGN KEY (ProformaID,ClienteID) REFERENCES dbo.PROFORMAS (Proforma_ID,ClienteID),
        CONSTRAINT FK_CC_CP_Alta FOREIGN KEY (UsuarioAltaID) REFERENCES dbo.USUARIOS (Usuario_ID),
        CONSTRAINT FK_CC_CP_Anulacion FOREIGN KEY (UsuarioAnulacionID) REFERENCES dbo.USUARIOS (Usuario_ID),
        CONSTRAINT CK_CC_CP_Tipo CHECK (TipoFactura = 'FAC'),
        -- MVP: una proforma por factura. Ampliar esta restricción en una migración futura.
        CONSTRAINT UQ_CC_CP_Factura UNIQUE (ComprobanteID),
        CONSTRAINT CK_CC_CP_Anulacion CHECK (
            (Vigente = 1 AND UsuarioAnulacionID IS NULL AND FechaAnulacion IS NULL AND MotivoAnulacion IS NULL)
            OR (Vigente = 0 AND UsuarioAnulacionID IS NOT NULL AND FechaAnulacion IS NOT NULL
                AND NULLIF(LTRIM(RTRIM(MotivoAnulacion)),N'') IS NOT NULL))
    );
    CREATE UNIQUE INDEX UX_CC_CP_ProformaVigente ON dbo.COMPROBANTES_PROFORMAS (ProformaID) WHERE Vigente = 1;

    CREATE TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS (
        Movimiento_ID int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CUENTA_CORRIENTE_MOVIMIENTOS PRIMARY KEY,
        ComprobanteID int NOT NULL,
        ClienteID int NOT NULL,
        Tipo varchar(3) NOT NULL,
        Clase varchar(10) NOT NULL,
        Impacto char(1) NOT NULL,
        Importe decimal(18,2) NOT NULL,
        FechaContable date NOT NULL,
        Concepto nvarchar(300) NOT NULL,
        MovimientoOriginalID int NULL,
        UsuarioAltaID int NOT NULL,
        FechaAlta datetime2(3) NOT NULL CONSTRAINT DF_CC_MOV_Alta DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_CC_MOV_Comprobante FOREIGN KEY (ComprobanteID,ClienteID,Tipo)
            REFERENCES dbo.COMPROBANTES (Comprobante_ID,ClienteID,Tipo),
        CONSTRAINT FK_CC_MOV_Alta FOREIGN KEY (UsuarioAltaID) REFERENCES dbo.USUARIOS (Usuario_ID),
        CONSTRAINT UQ_CC_MOV_Clase UNIQUE (ComprobanteID,Clase),
        CONSTRAINT UQ_CC_MOV_Referencia UNIQUE (Movimiento_ID,ComprobanteID,ClienteID),
        CONSTRAINT CK_CC_MOV_Importe CHECK (Importe > 0),
        CONSTRAINT CK_CC_MOV_Clase CHECK (
            (Clase = 'EMISION' AND MovimientoOriginalID IS NULL) OR
            (Clase = 'REVERSO' AND MovimientoOriginalID IS NOT NULL AND MovimientoOriginalID <> Movimiento_ID)),
        CONSTRAINT CK_CC_MOV_Impacto CHECK (
            (Clase = 'EMISION' AND ((Tipo IN ('FAC','ND') AND Impacto = 'D') OR (Tipo IN ('REC','NC') AND Impacto = 'C')))
            OR (Clase = 'REVERSO' AND ((Tipo IN ('FAC','ND') AND Impacto = 'C') OR (Tipo IN ('REC','NC') AND Impacto = 'D'))))
    );
    ALTER TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS ADD CONSTRAINT FK_CC_MOV_Original
        FOREIGN KEY (MovimientoOriginalID,ComprobanteID,ClienteID)
        REFERENCES dbo.CUENTA_CORRIENTE_MOVIMIENTOS (Movimiento_ID,ComprobanteID,ClienteID);
    CREATE UNIQUE INDEX UX_CC_MOV_Reverso ON dbo.CUENTA_CORRIENTE_MOVIMIENTOS (MovimientoOriginalID)
        WHERE MovimientoOriginalID IS NOT NULL;
    CREATE INDEX IX_CC_MOV_ClienteFecha ON dbo.CUENTA_CORRIENTE_MOVIMIENTOS (ClienteID,FechaContable,Movimiento_ID)
        INCLUDE (Impacto,Importe,ComprobanteID);

    CREATE TABLE dbo.CUENTA_CORRIENTE_APLICACIONES (
        Aplicacion_ID int IDENTITY(1,1) NOT NULL CONSTRAINT PK_CUENTA_CORRIENTE_APLICACIONES PRIMARY KEY,
        ClienteID int NOT NULL,
        ComprobanteCreditoID int NOT NULL,
        ImpactoCredito char(1) NOT NULL CONSTRAINT DF_CC_AP_Credito DEFAULT ('C'),
        ComprobanteDeudaID int NOT NULL,
        ImpactoDeuda char(1) NOT NULL CONSTRAINT DF_CC_AP_Deuda DEFAULT ('D'),
        Importe decimal(18,2) NOT NULL,
        FechaAplicacion date NOT NULL,
        Vigente bit NOT NULL CONSTRAINT DF_CC_AP_Vigente DEFAULT (1),
        UsuarioAltaID int NOT NULL,
        FechaAlta datetime2(3) NOT NULL CONSTRAINT DF_CC_AP_Alta DEFAULT (SYSUTCDATETIME()),
        UsuarioAnulacionID int NULL,
        FechaAnulacion datetime2(3) NULL,
        MotivoAnulacion nvarchar(500) NULL,
        CONSTRAINT FK_CC_AP_Credito FOREIGN KEY (ComprobanteCreditoID,ClienteID,ImpactoCredito)
            REFERENCES dbo.COMPROBANTES (Comprobante_ID,ClienteID,Impacto),
        CONSTRAINT FK_CC_AP_Deuda FOREIGN KEY (ComprobanteDeudaID,ClienteID,ImpactoDeuda)
            REFERENCES dbo.COMPROBANTES (Comprobante_ID,ClienteID,Impacto),
        CONSTRAINT FK_CC_AP_Alta FOREIGN KEY (UsuarioAltaID) REFERENCES dbo.USUARIOS (Usuario_ID),
        CONSTRAINT FK_CC_AP_Anulacion FOREIGN KEY (UsuarioAnulacionID) REFERENCES dbo.USUARIOS (Usuario_ID),
        CONSTRAINT CK_CC_AP_Direccion CHECK (ImpactoCredito = 'C' AND ImpactoDeuda = 'D' AND ComprobanteCreditoID <> ComprobanteDeudaID),
        CONSTRAINT CK_CC_AP_Importe CHECK (Importe > 0),
        CONSTRAINT CK_CC_AP_Anulacion CHECK (
            (Vigente = 1 AND UsuarioAnulacionID IS NULL AND FechaAnulacion IS NULL AND MotivoAnulacion IS NULL)
            OR (Vigente = 0 AND UsuarioAnulacionID IS NOT NULL AND FechaAnulacion IS NOT NULL
                AND NULLIF(LTRIM(RTRIM(MotivoAnulacion)),N'') IS NOT NULL))
    );
    CREATE INDEX IX_CC_AP_Deuda ON dbo.CUENTA_CORRIENTE_APLICACIONES (ComprobanteDeudaID,Vigente) INCLUDE (Importe,ComprobanteCreditoID);
    CREATE INDEX IX_CC_AP_Credito ON dbo.CUENTA_CORRIENTE_APLICACIONES (ComprobanteCreditoID,Vigente) INCLUDE (Importe,ComprobanteDeudaID);

    CREATE TABLE dbo.RECIBOS_FORMAS_PAGO (
        FormaPago_ID int IDENTITY(1,1) NOT NULL CONSTRAINT PK_RECIBOS_FORMAS_PAGO PRIMARY KEY,
        ComprobanteID int NOT NULL,
        ClienteID int NOT NULL,
        TipoRecibo varchar(3) NOT NULL CONSTRAINT DF_CC_FP_Tipo DEFAULT ('REC'),
        Forma varchar(20) NOT NULL,
        Referencia nvarchar(120) NULL,
        Banco nvarchar(120) NULL,
        FechaOperacion date NULL,
        FechaPago date NULL,
        Importe decimal(18,2) NOT NULL,
        CONSTRAINT FK_CC_FP_Recibo FOREIGN KEY (ComprobanteID,ClienteID,TipoRecibo)
            REFERENCES dbo.COMPROBANTES (Comprobante_ID,ClienteID,Tipo),
        CONSTRAINT CK_CC_FP_Tipo CHECK (TipoRecibo = 'REC'),
        CONSTRAINT CK_CC_FP_Forma CHECK (Forma IN ('EFECTIVO','TRANSFERENCIA','CHEQUE','OTRO')),
        CONSTRAINT CK_CC_FP_Importe CHECK (Importe > 0)
    );
    CREATE INDEX IX_CC_FP_Recibo ON dbo.RECIBOS_FORMAS_PAGO (ComprobanteID);

    CREATE TABLE dbo.PROFORMAS_VIAJES (
        ProformaID int NOT NULL,
        ViajeID int NOT NULL,
        UsuarioAltaID int NOT NULL,
        FechaAlta datetime2(3) NOT NULL CONSTRAINT DF_CC_PV_Alta DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_PROFORMAS_VIAJES PRIMARY KEY (ProformaID,ViajeID),
        CONSTRAINT FK_CC_PV_Proforma FOREIGN KEY (ProformaID) REFERENCES dbo.PROFORMAS (Proforma_ID),
        CONSTRAINT FK_CC_PV_Viaje FOREIGN KEY (ViajeID) REFERENCES dbo.VIAJES (Viaje_ID),
        CONSTRAINT FK_CC_PV_Alta FOREIGN KEY (UsuarioAltaID) REFERENCES dbo.USUARIOS (Usuario_ID)
    );
    CREATE INDEX IX_CC_PV_Viaje ON dbo.PROFORMAS_VIAJES (ViajeID,ProformaID);

    CREATE TABLE dbo.PERMISOS (
        Permiso_ID int IDENTITY(1,1) NOT NULL CONSTRAINT PK_PERMISOS PRIMARY KEY,
        Codigo varchar(60) NOT NULL CONSTRAINT UQ_PERMISOS_Codigo UNIQUE,
        Descripcion nvarchar(150) NOT NULL
    );
    CREATE TABLE dbo.GRUPOS_PERMISOS (
        GrupoID int NOT NULL,
        PermisoID int NOT NULL,
        UsuarioAltaID int NOT NULL,
        FechaAlta datetime2(3) NOT NULL CONSTRAINT DF_CC_GP_Alta DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_GRUPOS_PERMISOS PRIMARY KEY (GrupoID,PermisoID),
        CONSTRAINT FK_CC_GP_Grupo FOREIGN KEY (GrupoID) REFERENCES dbo.GRUPOS (Grupo_ID),
        CONSTRAINT FK_CC_GP_Permiso FOREIGN KEY (PermisoID) REFERENCES dbo.PERMISOS (Permiso_ID),
        CONSTRAINT FK_CC_GP_Alta FOREIGN KEY (UsuarioAltaID) REFERENCES dbo.USUARIOS (Usuario_ID)
    );
    CREATE INDEX IX_CC_GP_Permiso ON dbo.GRUPOS_PERMISOS (PermisoID,GrupoID);
    INSERT dbo.PERMISOS (Codigo,Descripcion) VALUES
        ('CC_CONSULTAR',N'Consultar Cuenta Corriente y comprobantes'),
        ('FAC_EMITIR',N'Emitir Facturas desde Proforma'), ('NC_EMITIR',N'Emitir Notas de Crédito'),
        ('ND_EMITIR',N'Emitir Notas de Débito'), ('REC_EMITIR',N'Emitir Recibos e imputaciones'),
        ('FAC_ANULAR',N'Anular Facturas'), ('NC_ANULAR',N'Anular Notas de Crédito'),
        ('ND_ANULAR',N'Anular Notas de Débito'), ('REC_ANULAR',N'Anular Recibos');

    COMMIT TRANSACTION;
    SELECT N'Modelo instalado en desarrollo. Backend pendiente; no emitir mediante INSERT manual.' AS Resultado;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
