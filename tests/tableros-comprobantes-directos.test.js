const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'TablerosController.cs'), 'utf8');
const inicio = fuente.indexOf('public IHttpActionResult GetFacturacion(');
const fin = fuente.indexOf('// GET api/tableros/deuda', inicio);
assert.ok(inicio >= 0 && fin > inicio, 'debe existir la consulta de facturación de Tableros');

const metodo = fuente.slice(inicio, fin);
const coincidencia = metodo.match(/new SqlCommand\(@"([\s\S]*?)", conexion\)/);
assert.ok(coincidencia, 'debe existir la consulta SQL de facturación');

// Ejecutamos la consulta real con datos controlados. SQLite solo necesita traducir
// la función CONVERT(date, ...) de SQL Server para interpretar la fecha.
const sql = coincidencia[1].replace(/CONVERT\(date,\s*c\.FechaEmision\)/g, 'date(c.FechaEmision)');
const db = new DatabaseSync(':memory:');
try {
    db.exec(`
        ATTACH DATABASE ':memory:' AS dbo;
        CREATE TABLE dbo.CLIENTES (Cliente_ID INTEGER, Razon_Social TEXT);
        CREATE TABLE dbo.COMPROBANTES
            (ClienteID INTEGER, FechaEmision TEXT, Tipo TEXT, Impacto TEXT, Estado TEXT, Total NUMERIC);
        INSERT INTO dbo.CLIENTES VALUES (1, 'Cliente de prueba');
        INSERT INTO dbo.COMPROBANTES VALUES
            (1, '2026-10-26', 'FAC', 'D', 'EMITIDO', 100),
            (1, '2026-10-26', 'FC',  'D', 'EMITIDO', 50),
            (1, '2026-10-26', 'ND',  'D', 'EMITIDO', 20),
            (1, '2026-10-26', 'NC',  'C', 'EMITIDO', 30),
            (1, '2026-10-26', 'REC', 'C', 'EMITIDO', 90),
            (1, '2026-10-26', 'OTR', 'C', 'EMITIDO', 5),
            (1, '2026-10-26', 'FC',  'D', 'ANULADO', 200),
            (1, '2026-09-30', 'FC',  'D', 'EMITIDO', 70);
    `);
    const filas = db.prepare(sql).all({ '@desde': '2026-10-01', '@hasta': '2026-11-01' });
    assert.strictEqual(filas.length, 1, 'debe agrupar el período por cliente y fecha');
    assert.strictEqual(filas[0].Total, 140, 'FAC + FC + ND − NC, sin recibos ni comprobantes ajenos al período');
    assert.strictEqual(filas[0].Comprobantes, 4, 'el comprobante FC debe sumarse al recuento');
} finally {
    db.close();
}

console.log('OK: Tableros incluye tipos de deuda configurables en la facturación');
