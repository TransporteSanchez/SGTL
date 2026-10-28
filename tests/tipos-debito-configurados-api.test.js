const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez',
    'Controllers', 'FacturacionConfiguracionController.cs'), 'utf8');
const inicio = fuente.indexOf('Route("tipos-emision-debito")');
assert.ok(inicio >= 0, 'falta el catálogo para el formulario Emitir Débito');
const metodo = fuente.slice(inicio, fuente.indexOf('[HttpGet', inicio + 1));
const consulta = metodo.match(/new SqlCommand\(@"([\s\S]*?)", c\)/);
assert.ok(consulta, 'falta la consulta de tipos de débito');

const db = new DatabaseSync(':memory:');
try {
    db.exec(`
        ATTACH DATABASE ':memory:' AS dbo;
        CREATE TABLE dbo.TIPOS_COMPROBANTE (Tipo TEXT, Descripcion TEXT, Impacto TEXT);
        CREATE TABLE dbo.FACTURACION_TIPOS_COMPROBANTE (Tipo TEXT, Activo INTEGER, NumeradorID INTEGER, SucursalID INTEGER);
        CREATE TABLE dbo.FACTURACION_NUMERADORES (Numerador_ID INTEGER, Activo INTEGER, UltimoNumero INTEGER);
        CREATE TABLE dbo.FACTURACION_SUCURSALES (Sucursal_ID INTEGER, Activa INTEGER);
        INSERT INTO dbo.TIPOS_COMPROBANTE VALUES
            ('D','Débito interno','D'),('ND','Nota de débito','D'),('FC','Comprobante interno','D'),
            ('C','Crédito interno','C'),('DI','Débito inactivo','D'),('DN','Débito sin numerador','D'),
            ('DS','Débito sin sucursal','D'),('DA','Débito agotado','D');
        INSERT INTO dbo.FACTURACION_NUMERADORES VALUES (1,1,0),(2,0,0),(3,1,99999999);
        INSERT INTO dbo.FACTURACION_SUCURSALES VALUES (1,1),(2,0);
        INSERT INTO dbo.FACTURACION_TIPOS_COMPROBANTE VALUES
            ('D',1,1,1),('ND',1,1,1),('FC',1,1,1),('C',1,1,1),('DI',0,1,1),('DN',1,2,1),
            ('DS',1,1,2),('DA',1,3,1);
    `);
    const tipos = db.prepare(consulta[1]).all().map(fila => fila.Tipo);
    assert.deepStrictEqual(tipos, ['D', 'FC', 'ND'],
        'debe incluir los tipos de deuda activos, incluida la nota de débito legada, y excluir créditos e inactivos');
} finally {
    db.close();
}

console.log('OK: tipos configurados para Emitir Débito');
