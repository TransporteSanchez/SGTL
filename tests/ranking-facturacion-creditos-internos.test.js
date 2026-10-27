const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'CuentaCorrienteController.cs'), 'utf8');
const metodo = fuente.split('public IHttpActionResult ObtenerTopClientesFacturacion(')[1].split('[HttpGet]')[0];
const sqlServidor = metodo.match(/const string sql = @"([\s\S]*?)";/);
assert.ok(sqlServidor, 'el ranking conserva una consulta ejecutable');

// SQLite ejecuta la consulta real del endpoint con dos expresiones T-SQL equivalentes.
const sql = sqlServidor[1]
    .replace(/TOP\s*\(@cantidad\)/i, '')
    .replace(/CONVERT\(decimal\(18,2\),\s*SUM\(/i, 'ROUND(SUM(')
    .replace(/END\)\) AS Facturacion/i, 'END), 2) AS Facturacion')
    .replace(/dbo\./g, '');

const db = new DatabaseSync(':memory:');
db.exec(`
    CREATE TABLE CLIENTES (Cliente_ID INTEGER PRIMARY KEY, Razon_Social TEXT);
    CREATE TABLE COMPROBANTES (ClienteID INTEGER, Tipo TEXT, Impacto TEXT, Estado TEXT, Total NUMERIC);
    INSERT INTO CLIENTES VALUES (1, 'Cliente con crédito interno'), (2, 'Cliente con nota de crédito');
    INSERT INTO COMPROBANTES VALUES
        (1, 'FC', 'D', 'EMITIDO', 121),
        (1, 'CI', 'C', 'EMITIDO', 121),
        (1, 'REC', 'C', 'EMITIDO', 50),
        (2, 'FAC', 'D', 'EMITIDO', 100),
        (2, 'NC', 'C', 'EMITIDO', 30);
`);

const filas = db.prepare(sql).all();
assert.deepStrictEqual(filas.map(fila => [fila.ClienteID, fila.Facturacion]), [
    [2, 70], [1, 0]
], 'el crédito interno y la nota de crédito descuentan facturación, el recibo no');
db.close();
console.log('OK: ranking de facturación con créditos internos');
