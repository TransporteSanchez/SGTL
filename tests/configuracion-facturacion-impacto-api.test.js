const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'FacturacionConfiguracionController.cs'), 'utf8');
const inicioLista = fuente.indexOf('public IHttpActionResult Tipos()');
const finLista = fuente.indexOf('[HttpPost, Route("tipos-comprobante")]', inicioLista);
assert.ok(inicioLista >= 0 && finLista > inicioLista, 'debe existir la lista de tipos');
const lista = fuente.slice(inicioLista, finLista);
const consulta = lista.match(/new SqlCommand\(@"([\s\S]*?)", c\)/);
assert.ok(consulta, 'la lista debe consultar el catálogo y sus variantes');

const db = new DatabaseSync(':memory:');
try {
    db.exec(`
        ATTACH DATABASE ':memory:' AS dbo;
        CREATE TABLE dbo.TIPOS_COMPROBANTE (Tipo TEXT, Descripcion TEXT, Impacto TEXT, EsElectronico INTEGER);
        CREATE TABLE dbo.FACTURACION_TIPOS_COMPROBANTE
            (FactTipo_ID INTEGER, Tipo TEXT, LetraPredeterminada TEXT, SucursalID INTEGER, NumeradorID INTEGER, Activo INTEGER);
        CREATE TABLE dbo.FACTURACION_SUCURSALES (Sucursal_ID INTEGER, Codigo TEXT);
        CREATE TABLE dbo.FACTURACION_NUMERADORES (Numerador_ID INTEGER, Nombre TEXT);
        CREATE TABLE dbo.COMPROBANTES (Comprobante_ID INTEGER, Tipo TEXT, Letra TEXT);
        INSERT INTO dbo.TIPOS_COMPROBANTE VALUES
            ('D','Débito interno','C',0),('C','Crédito interno','C',0),
            ('FC','Comprobante interno','D',0),('FAC','Factura','D',0),
            ('ND','Nota de débito','D',0),('NC','Nota de crédito','C',0),('REC','Recibo','C',0);
        INSERT INTO dbo.FACTURACION_SUCURSALES VALUES (1,'0001');
        INSERT INTO dbo.FACTURACION_NUMERADORES VALUES (1,'Numerador');
        INSERT INTO dbo.FACTURACION_TIPOS_COMPROBANTE VALUES
            (1,'D','A',1,1,1),(2,'D','B',1,1,1),
            (3,'C','A',1,1,1),(4,'FC','A',1,1,1),(5,'FC','B',1,1,1),
            (6,'FAC','A',1,1,1),(7,'ND','A',1,1,1),(8,'NC','A',1,1,1),(9,'REC','X',1,1,1);
        INSERT INTO dbo.COMPROBANTES VALUES (10,'FC','B');
    `);
    const filas = db.prepare(consulta[1]).all().map(function (fila) { return { ...fila }; });
    const porVariante = Object.fromEntries(filas.map(function (fila) {
        return [fila.Tipo + fila.LetraPredeterminada, Number(fila.PuedeCambiarImpacto)];
    }));
    assert.deepStrictEqual(porVariante, {
        DA: 1, DB: 1, CA: 1,
        FCA: 0, FCB: 0,
        FACA: 0, NDA: 0, NCA: 0, RECX: 0
    }, 'se puede corregir una sigla personalizada sin comprobantes; una emisión B bloquea también A');
} finally {
    db.close();
}

const inicioGuardar = fuente.indexOf('public IHttpActionResult GuardarTipo(');
const finGuardar = fuente.indexOf('[HttpPut, Route("tipos-comprobante/{id:int}/estado")]', inicioGuardar);
assert.ok(inicioGuardar >= 0 && finGuardar > inicioGuardar, 'debe existir la edición de tipos');
const guardar = fuente.slice(inicioGuardar, finGuardar);
assert.match(guardar, /SELECT Impacto,EsElectronico FROM dbo\.TIPOS_COMPROBANTE WITH \(XLOCK,HOLDLOCK\) WHERE Tipo=@tipo/,
    'el guardado bloquea la sigla compartida antes de comprobar emisiones de otra letra');
assert.match(guardar, /SELECT[^";]*FROM dbo\.COMPROBANTES[^";]*WHERE Tipo=@tipo/i,
    'al guardar se vuelve a comprobar toda la sigla, no solo la letra editada');
assert.match(guardar, /UPDATE dbo\.TIPOS_COMPROBANTE SET[^";]*Impacto=@impacto/i,
    'la actualización cambia el impacto compartido entre variantes');
assert.match(guardar, /HttpStatusCode\.Conflict/,
    'un tipo con comprobantes asociados debe rechazarse como conflicto comprensible');
assert.match(guardar, /catch\s*\(SqlException ex\)[\s\S]*?ex\.Number\s*==\s*547\s*\?\s*HttpStatusCode\.Conflict/,
    'si una emisión concurrente activa la FK, la API también debe devolver un conflicto');
assert.match(guardar, /UPDATE dbo\.TIPOS_COMPROBANTE SET Tipo=@tipo,Descripcion=@descripcion,Impacto=@impacto,EsElectronico=@esElectronico WHERE Tipo=@tipoActual;/,
    'editar actualiza descripción, impacto e identidad en el mismo tipo compartido');

console.log('OK: cambio de impacto solo para tipos personalizados sin comprobantes');
