const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'FacturasController.cs'), 'utf8');
const inicio = fuente.indexOf('public IHttpActionResult ObtenerComprobante(');
const fin = fuente.indexOf('public IHttpActionResult ConsultarFacturacion(', inicio);
assert.ok(inicio >= 0 && fin > inicio, 'falta el endpoint de detalle del comprobante');
const metodo = fuente.slice(inicio, fin);
const principal = metodo.match(/const string sql = @"([\s\S]*?)";/);
const proformas = metodo.match(/const string sqlProformas = @"([\s\S]*?)";/);
assert.ok(principal && proformas, 'faltan las consultas de vínculos a proformas');

const numero = principal[1].match(/\(SELECT TOP \(1\) p\.Numero FROM dbo\.COMPROBANTES_PROFORMAS cp[\s\S]*?ORDER BY cp\.ComprobanteProforma_ID DESC\) AS ProformaNumero/);
assert.ok(numero, 'falta el número de proforma del detalle');
const numeroSql = numero[0].replace('TOP (1)', '').replace('DESC)', 'DESC LIMIT 1)').replace(/dbo\./g, '');
const listaSql = proformas[1].replace(/dbo\./g, '');

const db = new DatabaseSync(':memory:');
try {
    db.exec(`
        CREATE TABLE COMPROBANTES (Comprobante_ID INTEGER);
        CREATE TABLE PROFORMAS (Proforma_ID INTEGER, Numero TEXT);
        CREATE TABLE COMPROBANTES_PROFORMAS
            (ComprobanteProforma_ID INTEGER, ComprobanteID INTEGER, ProformaID INTEGER, Vigente INTEGER);
        INSERT INTO COMPROBANTES VALUES (101),(102);
        INSERT INTO PROFORMAS VALUES (7,'PF-00000007'),(8,'PF-00000008');
        INSERT INTO COMPROBANTES_PROFORMAS VALUES (1,101,7,0),(2,102,8,1);
    `);

    const numeros = db.prepare('SELECT c.Comprobante_ID, ' + numeroSql +
        ' FROM COMPROBANTES c ORDER BY c.Comprobante_ID').all();
    assert.deepStrictEqual(numeros.map(fila => fila.ProformaNumero), ['PF-00000007', 'PF-00000008'],
        'el PDF del comprobante cancelado conserva el número de su proforma');

    const listar = db.prepare(listaSql);
    assert.deepStrictEqual(listar.all({ '@id': 101 }).map(fila => fila.Numero), ['PF-00000007'],
        'la lista del detalle conserva la proforma aunque el vínculo haya dejado de estar vigente');
    assert.deepStrictEqual(listar.all({ '@id': 102 }).map(fila => fila.Numero), ['PF-00000008'],
        'la lista sigue mostrando también un vínculo vigente');
} finally {
    db.close();
}

console.log('OK: comprobantes conservan la proforma histórica en detalle y PDF');
