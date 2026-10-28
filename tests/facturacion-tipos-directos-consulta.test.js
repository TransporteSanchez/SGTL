const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'FacturacionConfiguracionController.cs'), 'utf8');
const inicio = fuente.indexOf('public IHttpActionResult TiposEmisionDirecta(');
const fin = fuente.indexOf('public IHttpActionResult Emision(', inicio);
assert.ok(inicio >= 0 && fin > inicio, 'debe existir el catálogo para emisión directa');
const consulta = fuente.slice(inicio, fin).match(/new SqlCommand\(@"([\s\S]*?)", c\)/);
assert.ok(consulta, 'debe existir la consulta del catálogo directo');
const sucursales = fuente.slice(fin).match(/new SqlCommand\(@"(\s*SELECT DISTINCT s\.Codigo,s\.Nombre[\s\S]*?)", c\)/);
assert.ok(sucursales, 'debe existir la consulta de sucursales del tipo elegido');

const db = new DatabaseSync(':memory:');
try {
    db.exec(`
        ATTACH DATABASE ':memory:' AS dbo;
        CREATE TABLE dbo.TIPOS_COMPROBANTE (Tipo TEXT, Descripcion TEXT, Impacto TEXT);
        CREATE TABLE dbo.FACTURACION_TIPOS_COMPROBANTE (Tipo TEXT, Activo INTEGER, NumeradorID INTEGER, SucursalID INTEGER);
        CREATE TABLE dbo.FACTURACION_NUMERADORES (Numerador_ID INTEGER, Activo INTEGER, UltimoNumero INTEGER);
        CREATE TABLE dbo.FACTURACION_SUCURSALES (Sucursal_ID INTEGER, Activa INTEGER, Codigo TEXT, Nombre TEXT);
        INSERT INTO dbo.FACTURACION_NUMERADORES VALUES (1,1,3),(2,0,0),(3,1,99999999);
        INSERT INTO dbo.FACTURACION_SUCURSALES VALUES
            (1,1,'0001','Principal'),(2,0,'0002','Inactiva'),(3,1,'0003','Otra activa');
        INSERT INTO dbo.TIPOS_COMPROBANTE VALUES
            ('FAC','Factura','D'),('FC','Comprobante interno','D'),('ND','Nota de débito','D'),
            ('NC','Nota de crédito','C'),('HX','Haber personalizado','C'),
            ('OFF','Inactivo','D'),('BR','Sucursal inactiva','D'),
            ('NUM','Numerador inactivo','D'),('EXH','Numerador agotado','D');
        INSERT INTO dbo.FACTURACION_TIPOS_COMPROBANTE VALUES
            ('FAC',1,1,1),('FC',1,1,1),('FC',1,1,1),('ND',1,1,1),
            ('NC',1,1,1),('HX',1,1,1),('OFF',0,1,1),('BR',1,1,2),
            ('NUM',1,2,1),('EXH',1,3,1);
    `);
    const tipos = db.prepare(consulta[1]).all().map(function (tipo) { return { ...tipo }; });
    assert.deepStrictEqual(tipos, [
        { Tipo: 'FAC', Descripcion: 'Factura', Impacto: 'D' },
        { Tipo: 'FC', Descripcion: 'Comprobante interno', Impacto: 'D' }
    ], 'solo aparecen una vez los tipos de deuda realmente emitibles desde el formulario directo');
    const sucursalesFc = db.prepare(sucursales[1]).all({ '@tipo': 'FC' }).map(function (sucursal) { return { ...sucursal }; });
    assert.deepStrictEqual(sucursalesFc, [{ Codigo: '0001', Nombre: 'Principal' }],
        'FC ofrece solo la sucursal vinculada a su configuración activa');
} finally {
    db.close();
}

console.log('OK: catálogo de tipos para emisión directa');
