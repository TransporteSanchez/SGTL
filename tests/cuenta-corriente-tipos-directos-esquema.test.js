const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ruta = path.join(__dirname, '..', 'database', 'cuenta-corriente', '13_comprobantes_directos_configurables.sql');
assert.ok(fs.existsSync(ruta), 'falta la migración para emitir tipos de deuda configurables');

const sql = fs.readFileSync(ruta, 'utf8').replace(/\/\*[\s\S]*?\*\/|--[^\r\n]*/g, '');
assert.match(sql, /SET\s+XACT_ABORT\s+ON\s*;/i, 'la migración debe revertirse ante un error');
assert.match(sql, /BEGIN\s+TRAN(?:SACTION)?\s*;/i, 'el reemplazo de la restricción debe ser atómico');
assert.match(sql, /IF\s+EXISTS\s*\([\s\S]*?sys\.check_constraints[\s\S]*?CK_CC_MOV_Impacto[\s\S]*?\)\s*ALTER\s+TABLE\s+dbo\.CUENTA_CORRIENTE_MOVIMIENTOS\s+DROP\s+CONSTRAINT\s+CK_CC_MOV_Impacto/i,
    'volver a ejecutar la migración debe reemplazar la misma restricción');
assert.doesNotMatch(sql, /DROP\s+CONSTRAINT\s+FK_/i, 'las relaciones existentes deben permanecer intactas');

const inicio = /ADD\s+CONSTRAINT\s+CK_CC_MOV_Impacto\s+CHECK\s*\(/i.exec(sql);
assert.ok(inicio, 'debe crearse la restricción de impacto de los movimientos');
let profundidad = 1;
let fin = inicio.index + inicio[0].length;
while (profundidad && fin < sql.length) {
    if (sql[fin] === '(') profundidad++;
    if (sql[fin] === ')') profundidad--;
    fin++;
}
assert.strictEqual(profundidad, 0, 'la expresión CHECK debe estar completa');

const expresion = sql.slice(inicio.index + inicio[0].length, fin - 1)
    .replace(/\bTipo\s+NOT\s+IN\s*\(([^)]*)\)/gi, (_, valores) => `![${valores}].includes(Tipo)`)
    .replace(/\bTipo\s+IN\s*\(([^)]*)\)/gi, (_, valores) => `[${valores}].includes(Tipo)`)
    .replace(/\b(Clase|Tipo|Impacto)\s*=\s*('[^']*')/gi, '$1 === $2')
    .replace(/\bAND\b/gi, '&&')
    .replace(/\bOR\b/gi, '||');
const admite = new Function('Clase', 'Tipo', 'Impacto', `return Boolean(${expresion});`);

for (const tipo of ['FC', 'FAC', 'ND']) {
    assert.strictEqual(admite('EMISION', tipo, 'D'), true, `${tipo} debe poder generar deuda`);
    assert.strictEqual(admite('REVERSO', tipo, 'C'), true, `${tipo} debe poder revertir la deuda`);
    assert.strictEqual(admite('EMISION', tipo, 'C'), false, `${tipo} no debe emitirse como crédito`);
    assert.strictEqual(admite('REVERSO', tipo, 'D'), false, `${tipo} no debe revertirse como deuda`);
}
for (const tipo of ['NC', 'REC']) {
    assert.strictEqual(admite('EMISION', tipo, 'C'), true, `${tipo} debe seguir generando crédito`);
    assert.strictEqual(admite('REVERSO', tipo, 'D'), true, `${tipo} debe seguir revirtiendo el crédito`);
    assert.strictEqual(admite('EMISION', tipo, 'D'), false, `${tipo} no debe emitirse como deuda`);
    assert.strictEqual(admite('REVERSO', tipo, 'C'), false, `${tipo} no debe revertirse como crédito`);
}
assert.strictEqual(admite('OTRA', 'FC', 'D'), false, 'no debe admitirse una clase desconocida');

console.log('OK: los tipos de deuda configurables generan y revierten movimientos de cuenta corriente');
