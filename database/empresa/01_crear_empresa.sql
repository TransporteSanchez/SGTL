/*
   EMPRESA: los datos de la empresa que salen en los documentos (Gestionar empresa, 23/10/2026).

   Hasta ahora el nombre "Transporte Sánchez" estaba escrito en los PDF (factura, proforma y presupuesto)
   y no había CUIT, domicilio ni contacto. Desde ahora salen de esta tabla.

   Guarda VERSIONES: cada Guardar en Gestionar empresa agrega una fila con la fecha desde la que vale
   (Vigente_Desde, día de Argentina). Un documento ya emitido se arma con la versión que valía en su fecha de
   emisión, igual que conserva los datos del cliente con que se emitió. La versión actual es la de
   Vigente_Desde más reciente (y, el mismo día, la última que se guardó).

   La tabla arranca vacía: hasta que se carguen los datos en Gestionar empresa (con CUIT y domicilio, que son
   obligatorios), los PDF no se arman y lo avisan. Así nunca sale un documento con los datos incompletos. Los
   documentos emitidos antes de esa primera carga salen con ella (la API usa la versión más vieja).
   (La primera versión de este script, del 23/10, creaba una fila solo con la razón social. En la base del equipo
   ya está completa con la primera carga de Rocío; este script no la toca.)

   El logo de la empresa (Logo, data URI) es el de los documentos y es parte de cada versión: una factura vieja conserva
   el logo con que se emitió. No es el logo del sistema (menú y login), que sigue en GESTION_CONTENIDO: restablecer la
   apariencia no cambia los documentos. Vacío, los documentos salen con el nombre en texto.

   Las columnas se llaman como en CLIENTES (Cond_Fiscal 1 Responsable inscripto · 2 Monotributista · 3 Exento,
   ProvID, LocID, Calle, AlturaCalle, CodigoPostal). Fuera del EDMX: la API la usa con SQL directo.

   Cómo correrlo (SSMS, base Transporte_Sanchez, compartida: avisar al equipo). Es idempotente: si la tabla ya
   existe no la toca.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54500, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

IF OBJECT_ID(N'dbo.PROVINCIAS', N'U') IS NULL OR OBJECT_ID(N'dbo.LOCALIDADES', N'U') IS NULL
    THROW 54501, 'Faltan las tablas dbo.PROVINCIAS o dbo.LOCALIDADES.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.EMPRESA', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.EMPRESA (
            Empresa_ID          int IDENTITY(1, 1) NOT NULL
                CONSTRAINT PK_EMPRESA PRIMARY KEY,
            Vigente_Desde       date NOT NULL,
            Razon_Social        nvarchar(200) NOT NULL,
            Nombre_Comercial    nvarchar(100) NULL,
            CUIT                varchar(11) NULL,
            Cond_Fiscal         tinyint NULL
                CONSTRAINT CK_EMPRESA_Cond_Fiscal CHECK (Cond_Fiscal IN (1, 2, 3)),
            ProvID              int NULL
                CONSTRAINT FK_EMPRESA_PROVINCIAS REFERENCES dbo.PROVINCIAS (Prov_ID),
            LocID               int NULL
                CONSTRAINT FK_EMPRESA_LOCALIDADES REFERENCES dbo.LOCALIDADES (Loc_ID),
            Calle               nvarchar(100) NULL,
            AlturaCalle         nvarchar(10) NULL,
            CodigoPostal        nvarchar(20) NULL,
            Telefono            nvarchar(20) NULL,
            Email               nvarchar(320) NULL,
            Logo                nvarchar(max) NULL,
            -- Quién guardó esta versión y cuándo (hora de Argentina). Vacíos en la primera fila hasta que se complete.
            Fecha_Modi          datetime NULL,
            Usu_Modi            nvarchar(50) NULL
        );

        CREATE INDEX IX_EMPRESA_Vigente_Desde ON dbo.EMPRESA (Vigente_Desde DESC, Empresa_ID DESC);
    END;

    -- Por si la tabla se creó con una versión anterior de este script, sin el logo.
    IF COL_LENGTH('dbo.EMPRESA', 'Logo') IS NULL
        ALTER TABLE dbo.EMPRESA ADD Logo nvarchar(max) NULL;

    COMMIT TRANSACTION;

    SELECT Empresa_ID, Vigente_Desde, Razon_Social, CUIT, Usu_Modi, Fecha_Modi
    FROM dbo.EMPRESA
    ORDER BY Vigente_Desde DESC, Empresa_ID DESC;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
