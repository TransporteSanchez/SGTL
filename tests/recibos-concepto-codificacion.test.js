const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const raiz = path.join(__dirname, '..');
const recibos = fs.readFileSync(path.join(raiz, 'WebApi_TransporteSanchez/Controllers/RecibosController.cs'), 'utf8');
const script = fs.readFileSync(path.join(raiz, 'database/cuenta-corriente/18_corregir_concepto_recibos.sql'), 'utf8');
const expresion = recibos.match(/string concepto = ([\s\S]*?);/);
assert.ok(expresion, 'concepto generado al emitir un recibo');
const codigo = `using System;
public static class PruebaConceptoRecibo {
    public static void Probar() {
        var esperados=new[]{"Cobranza sin imputaci\\u00f3n","Cobranza de 1 comprobante","Cobranza de 2 comprobantes"};
        for(int cantidad=0;cantidad<3;cantidad++) {
            string concepto=${expresion[1].replaceAll('request.Aplicaciones.Count', 'cantidad')};
            if(concepto!=esperados[cantidad]) throw new Exception("Concepto incorrecto para "+cantidad);
        }
    }
}`;
const compilacion = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    "$ErrorActionPreference='Stop'; Add-Type -TypeDefinition $env:SGTL_TEST_CONCEPTO_RECIBO; [PruebaConceptoRecibo]::Probar()"],
{ encoding: 'utf8', env: { ...process.env, SGTL_TEST_CONCEPTO_RECIBO: codigo } });
assert.strictEqual(compilacion.status, 0, compilacion.stderr || compilacion.stdout);

function literal(nombre) {
    const declaracion = script.match(new RegExp('DECLARE @' + nombre + ' nvarchar\\(300\\) = ([^;]+);'));
    assert.ok(declaracion);
    return [...declaracion[1].matchAll(/N'([^']*)'|NCHAR\((\d+)\)/g)]
        .map(m => m[1] === undefined ? String.fromCodePoint(Number(m[2])) : m[1]).join('');
}
const Correcto = literal('Correcto'), Incorrecto = literal('Incorrecto');
assert.strictEqual(Correcto, 'Cobranza sin imputación');
assert.strictEqual(Incorrecto, Buffer.from(Correcto, 'utf8').toString('latin1'));
const db = new DatabaseSync(':memory:');
try {
    db.function('DATALENGTH', texto => Buffer.byteLength(texto, 'utf16le'));
    db.exec(`CREATE TABLE COMPROBANTES (Comprobante_ID INT, Tipo TEXT, Concepto TEXT);
        CREATE TABLE CUENTA_CORRIENTE_MOVIMIENTOS (Movimiento_ID INT, ComprobanteID INT, Tipo TEXT, Clase TEXT, Concepto TEXT);`);
    const insertar = db.prepare('INSERT INTO COMPROBANTES VALUES (?,?,?)');
    for (const fila of [[1,'REC',Incorrecto], [2,'REC',Correcto], [3,'FAC',Incorrecto],
        [4,'REC','Concepto personalizado'], [5,'REC',Incorrecto + ' '], [6,'REC',Incorrecto.toLowerCase()]]) insertar.run(...fila);
    const movimiento = db.prepare('INSERT INTO CUENTA_CORRIENTE_MOVIMIENTOS VALUES (?,?,?,?,?)');
    for (const fila of [[1,1,'REC','EMISION',Incorrecto], [2,2,'REC','EMISION',Incorrecto],
        [3,3,'FAC','EMISION',Incorrecto], [4,1,'REC','REVERSO',Incorrecto], [5,1,'REC','EMISION','Texto propio']]) movimiento.run(...fila);
    const antes = () => [db.prepare('SELECT * FROM COMPROBANTES').all(), db.prepare('SELECT * FROM CUENTA_CORRIENTE_MOVIMIENTOS').all()]
        .map(filas => filas.map(fila => ({ ...fila })));
    const original = antes();
    // Ejecuta los UPDATE reales con sintaxis equivalente en SQLite, exclusivamente en memoria.
    const updates = [...script.matchAll(/UPDATE dbo\.[\s\S]*?;/g)].map(m => db.prepare(m[0]
        .replaceAll('dbo.', '').replaceAll('Latin1_General_100_BIN2', 'BINARY')));
    assert.strictEqual(updates.length, 2);
    const corregir = () => updates.map(u => u.run({ Correcto, Incorrecto }).changes);
    db.exec('BEGIN');
    assert.deepStrictEqual(corregir(), [1,2]);
    const resultado = antes();
    const esperado = structuredClone(original);
    esperado[0][0].Concepto = Correcto;
    esperado[1][0].Concepto = Correcto;
    esperado[1][1].Concepto = Correcto;
    assert.deepStrictEqual(resultado, esperado, 'solo corrige el concepto exacto en recibos y movimientos de emisión');
    assert.deepStrictEqual(corregir(), [0,0], 'repetir no vuelve a modificar registros');
    db.exec('ROLLBACK');
    assert.deepStrictEqual(antes(), original, 'la revisión revierte todos los cambios');
} finally { db.close(); }
assert.match(script, /ROLLBACK TRANSACTION;\s*END TRY/);
assert.doesNotMatch(script, /^\s*COMMIT/im, 'el script propuesto no guarda cambios automáticamente');
console.log('OK: conceptos de recibos con acentos y corrección acotada, idempotente y reversible de datos anteriores');
