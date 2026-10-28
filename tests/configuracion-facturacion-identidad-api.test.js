const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'FacturacionConfiguracionController.cs'), 'utf8');
const inicioLista = fuente.indexOf('public IHttpActionResult Tipos()');
const finLista = fuente.indexOf('[HttpPost, Route("tipos-comprobante")]', inicioLista);
assert.ok(inicioLista >= 0 && finLista > inicioLista);
const lista = fuente.slice(inicioLista, finLista);
const consulta = lista.match(/new SqlCommand\(@"([\s\S]*?)", c\)/);
assert.ok(consulta, 'la lista debe consultar el catálogo y sus variantes');

const db = new DatabaseSync(':memory:');
try {
    db.exec(`
        PRAGMA foreign_keys=ON;
        ATTACH DATABASE ':memory:' AS dbo;
        CREATE TABLE dbo.TIPOS_COMPROBANTE
            (TipoComp_ID INTEGER PRIMARY KEY, Tipo TEXT UNIQUE NOT NULL,
             Descripcion TEXT NOT NULL, Impacto TEXT NOT NULL, EsElectronico INTEGER NOT NULL,
             UNIQUE(Tipo,Impacto));
        CREATE TABLE dbo.FACTURACION_TIPOS_COMPROBANTE
            (FactTipo_ID INTEGER PRIMARY KEY, Tipo TEXT NOT NULL, LetraPredeterminada TEXT NOT NULL,
             SucursalID INTEGER, NumeradorID INTEGER, Activo INTEGER, FechaModificacion TEXT,
             UNIQUE(Tipo,LetraPredeterminada),
             FOREIGN KEY(Tipo) REFERENCES TIPOS_COMPROBANTE(Tipo) ON UPDATE CASCADE);
        CREATE TABLE dbo.COMPROBANTES_NUMERADORES
            (CompNum_ID INTEGER PRIMARY KEY, Tipo TEXT UNIQUE NOT NULL,
             FOREIGN KEY(Tipo) REFERENCES TIPOS_COMPROBANTE(Tipo) ON UPDATE CASCADE);
        CREATE TABLE dbo.FACTURACION_SUCURSALES (Sucursal_ID INTEGER, Codigo TEXT);
        CREATE TABLE dbo.FACTURACION_NUMERADORES (Numerador_ID INTEGER, Nombre TEXT);
        CREATE TABLE dbo.COMPROBANTES
            (Comprobante_ID INTEGER PRIMARY KEY, ClienteID INTEGER, Tipo TEXT NOT NULL,
             Impacto TEXT NOT NULL, Letra TEXT, Sucursal TEXT, NumeroCorrelativo INTEGER,
             Estado TEXT, ComprobanteReferenciaID INTEGER, TipoReferencia TEXT,
             UNIQUE(Comprobante_ID,ClienteID), UNIQUE(Comprobante_ID,ClienteID,Tipo),
             UNIQUE(Tipo,Letra,Sucursal,NumeroCorrelativo),
             FOREIGN KEY(Tipo,Impacto) REFERENCES TIPOS_COMPROBANTE(Tipo,Impacto) ON UPDATE CASCADE,
             FOREIGN KEY(ComprobanteReferenciaID,ClienteID) REFERENCES COMPROBANTES(Comprobante_ID,ClienteID));
        CREATE TABLE dbo.COMPROBANTES_PROFORMAS
            (ComprobanteID INTEGER, ClienteID INTEGER, TipoFactura TEXT,
             FOREIGN KEY(ComprobanteID,ClienteID,TipoFactura)
                 REFERENCES COMPROBANTES(Comprobante_ID,ClienteID,Tipo) ON UPDATE CASCADE);
        CREATE TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS
            (ComprobanteID INTEGER, ClienteID INTEGER, Tipo TEXT,
             FOREIGN KEY(ComprobanteID,ClienteID,Tipo)
                 REFERENCES COMPROBANTES(Comprobante_ID,ClienteID,Tipo) ON UPDATE CASCADE);
        INSERT INTO dbo.TIPOS_COMPROBANTE VALUES
            (1,'D','Débito interno','D',0),(2,'C','Crédito interno','C',0),
            (3,'FC','Comprobante interno','D',0),(4,'EL','Tipo electrónico','D',1),
            (5,'FAC','Factura','D',0),(6,'REC','Recibo','C',0);
        INSERT INTO dbo.FACTURACION_SUCURSALES VALUES (1,'0001');
        INSERT INTO dbo.FACTURACION_NUMERADORES VALUES (1,'Numerador');
        INSERT INTO dbo.FACTURACION_TIPOS_COMPROBANTE
            (FactTipo_ID,Tipo,LetraPredeterminada,SucursalID,NumeradorID,Activo) VALUES
            (11,'D','A',1,1,1),(12,'D','B',1,1,1),(21,'C','A',1,1,1),
            (31,'FC','A',1,1,1),(41,'EL','A',1,1,1),
            (51,'FAC','A',1,1,1),(61,'REC','X',1,1,1);
        INSERT INTO dbo.COMPROBANTES_NUMERADORES VALUES (1,'D');
        INSERT INTO dbo.COMPROBANTES VALUES
            (101,1,'D','D','A','0001',1,'EMITIDO',NULL,NULL),
            (102,1,'D','D','B','0001',1,'EMITIDO',NULL,NULL),
            (201,1,'C','C','A','0001',2,'EMITIDO',101,'D'),
            (301,1,'FC','D','A','0001',3,'EMITIDO',NULL,NULL),
            (401,1,'EL','D','A','0001',4,'EMITIDO',NULL,NULL);
        INSERT INTO dbo.COMPROBANTES_PROFORMAS VALUES (101,1,'D');
        INSERT INTO dbo.CUENTA_CORRIENTE_MOVIMIENTOS VALUES (101,1,'D');
    `);

    const filas = db.prepare(consulta[1]).all();
    assert.deepStrictEqual(Object.fromEntries(filas.map(fila => [fila.Tipo + fila.LetraPredeterminada,
        [Number(fila.EsElectronico), Number(fila.PuedeCambiarSigla), Number(fila.PuedeCambiarLetra)]])), {
        DA: [0, 1, 1], DB: [0, 1, 1], CA: [0, 1, 1], FCA: [0, 1, 1],
        ELA: [1, 0, 0], FACA: [0, 0, 1], RECX: [0, 0, 0]
    }, 'las siglas y letras internas usadas siguen editables; lo electrónico queda bloqueado');

    const inicioGuardar = fuente.indexOf('public IHttpActionResult GuardarTipo(');
    const finGuardar = fuente.indexOf('[HttpPut, Route("tipos-comprobante/{id:int}/estado")]', inicioGuardar);
    assert.ok(inicioGuardar >= 0 && finGuardar > inicioGuardar);
    const guardar = fuente.slice(inicioGuardar, finGuardar);
    const cambioCatalogo = guardar.match(/new SqlCommand\("(UPDATE dbo\.TIPOS_COMPROBANTE SET Tipo=@tipo,Descripcion=@descripcion,Impacto=@impacto,EsElectronico=@esElectronico WHERE Tipo=@tipoActual;)"/);
    assert.ok(cambioCatalogo, 'el cambio de sigla conserva el ID del tipo y propaga la clave mediante sus FK');
    const cambioReferencia = guardar.match(/new SqlCommand\("(UPDATE dbo\.COMPROBANTES SET TipoReferencia=@tipo WHERE TipoReferencia=@tipoActual;)"/);
    assert.ok(cambioReferencia, 'las referencias a facturas históricas deben usar la sigla nueva');
    const cambioLetra = guardar.match(/new SqlCommand\("(UPDATE dbo\.COMPROBANTES SET Letra=@letra WHERE Tipo=@tipo AND Letra=@letraActual;)"/);
    assert.ok(cambioLetra, 'el cambio de letra actualiza los comprobantes de esa variante');

    db.exec('BEGIN TRANSACTION;');
    db.prepare(cambioCatalogo[1]).run({ '@tipo': 'DB', '@descripcion': 'Débito interno', '@impacto': 'D', '@esElectronico': 0, '@tipoActual': 'D' });
    db.prepare(cambioReferencia[1]).run({ '@tipo': 'DB', '@tipoActual': 'D' });
    db.exec('COMMIT TRANSACTION;');
    assert.deepStrictEqual(db.prepare('SELECT FactTipo_ID,Tipo,LetraPredeterminada FROM dbo.FACTURACION_TIPOS_COMPROBANTE WHERE FactTipo_ID IN (11,12) ORDER BY FactTipo_ID').all().map(fila => ({ ...fila })), [
        { FactTipo_ID: 11, Tipo: 'DB', LetraPredeterminada: 'A' },
        { FactTipo_ID: 12, Tipo: 'DB', LetraPredeterminada: 'B' }
    ]);
    assert.deepStrictEqual({ ...db.prepare('SELECT TipoComp_ID,Tipo FROM dbo.TIPOS_COMPROBANTE WHERE TipoComp_ID=1').get() }, { TipoComp_ID: 1, Tipo: 'DB' });
    assert.deepStrictEqual(db.prepare('SELECT Comprobante_ID,Tipo,TipoReferencia FROM dbo.COMPROBANTES WHERE Comprobante_ID IN (101,102,201) ORDER BY Comprobante_ID').all().map(fila => ({ ...fila })), [
        { Comprobante_ID: 101, Tipo: 'DB', TipoReferencia: null },
        { Comprobante_ID: 102, Tipo: 'DB', TipoReferencia: null },
        { Comprobante_ID: 201, Tipo: 'C', TipoReferencia: 'DB' }
    ], 'las emisiones y referencias históricas reciben la sigla nueva');
    assert.strictEqual(db.prepare('SELECT TipoFactura FROM dbo.COMPROBANTES_PROFORMAS').get().TipoFactura, 'DB');
    assert.strictEqual(db.prepare('SELECT Tipo FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS').get().Tipo, 'DB');
    assert.strictEqual(db.prepare('SELECT Tipo FROM dbo.COMPROBANTES_NUMERADORES').get().Tipo, 'DB');

    const consultaDestino = guardar.match(/new SqlCommand\("(SELECT TOP \(1\) 1 FROM dbo\.COMPROBANTES WITH \(UPDLOCK,HOLDLOCK\) WHERE Tipo=@tipoActual AND Letra=@letra;)", c, tx\)/);
    assert.ok(consultaDestino, 'el guardado debe detectar cualquier comprobante histórico con la letra de destino');
    const sqlDestino = consultaDestino[1].replace('TOP (1) ', '').replace(' WITH (UPDLOCK,HOLDLOCK)', '');
    assert.strictEqual(db.prepare(sqlDestino).get({ '@tipoActual': 'FC', '@letra': 'B' }), undefined);
    db.exec("INSERT INTO dbo.COMPROBANTES VALUES (302,1,'FC','D','B','0001',30,'EMITIDO',NULL,NULL);");
    assert.ok(db.prepare(sqlDestino).get({ '@tipoActual': 'FC', '@letra': 'B' }),
        'la letra de destino usada se rechaza aunque no se repita ningún número');
    db.exec('DELETE FROM dbo.COMPROBANTES WHERE Comprobante_ID=302;');
    db.prepare(cambioLetra[1]).run({ '@letra': 'B', '@tipo': 'FC', '@letraActual': 'A' });
    assert.deepStrictEqual({ ...db.prepare('SELECT Tipo,Letra FROM dbo.COMPROBANTES WHERE Comprobante_ID=301').get() }, { Tipo: 'FC', Letra: 'B' },
        'la letra histórica de una variante cambia sin alterar otra sigla');

    assert.match(guardar, /EsElectronico[\s\S]*?HttpStatusCode\.Conflict/, 'la API rechaza cualquier edición de un tipo electrónico');
    assert.match(guardar, /letraDestino[\s\S]*?LETRA_USADA/, 'la API devuelve un conflicto específico por letra histórica');
    assert.match(guardar, /TipoOriginal[\s\S]*?tipoActual != tipoOriginal/, 'un formulario obsoleto no revierte un cambio de sigla ajeno');
    assert.match(guardar, /BeginTransaction\(IsolationLevel\.Serializable\)/, 'la edición se valida y aplica en una transacción');
    const crear = fuente.slice(fuente.indexOf('public IHttpActionResult CrearTipo('), inicioGuardar);
    const estado = fuente.slice(finGuardar, fuente.indexOf('[HttpDelete, Route("tipos-comprobante/{id:int}")]', finGuardar));
    const eliminar = fuente.slice(fuente.indexOf('public IHttpActionResult EliminarTipo('), fuente.indexOf('[HttpGet, Route("tipos-emision-directa")]', finGuardar));
    assert.match(crear, /esElectronicoActual == true[\s\S]*?HttpStatusCode\.Conflict/,
        'un tipo electrónico no admite agregar otra letra');
    assert.match(crear, /configuracion\.ExecuteScalar\(\) != 0[\s\S]*?HttpStatusCode\.Conflict[\s\S]*?TIPO_DUPLICADO/,
        'la colisión de una nueva variante debe informarse como conflicto');
    assert.match(estado, /SELECT EsElectronico FROM dbo\.TIPOS_COMPROBANTE[\s\S]*?HttpStatusCode\.Conflict/,
        'un tipo electrónico no admite cambiar el estado');
    assert.match(eliminar, /SELECT EsElectronico FROM dbo\.TIPOS_COMPROBANTE[\s\S]*?HttpStatusCode\.Conflict/,
        'un tipo electrónico no admite eliminar variantes');
} finally {
    db.close();
}

console.log('OK: renombrar sigla y letra con comprobantes internos y bloqueo electrónico');
