const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers',
    'EnviosComprobantesController.cs'), 'utf8');

function extraerMetodo(nombre) {
    const inicio = fuente.indexOf('private static string ' + nombre + '(');
    assert.notStrictEqual(inicio, -1, 'falta el método ' + nombre);
    const apertura = fuente.indexOf('{', inicio);
    let nivel = 0;
    for (let indice = apertura; indice < fuente.length; indice += 1) {
        if (fuente[indice] === '{') nivel += 1;
        if (fuente[indice] === '}') nivel -= 1;
        if (nivel === 0) return fuente.slice(inicio, indice + 1).replace('private static string', 'public static string');
    }
    throw new Error('No se pudo extraer ' + nombre);
}

const casos = [
    { tipo: 'FAC', impacto: 'D', permiso: 'FAC_EMITIR' },
    { tipo: 'NC', impacto: 'C', permiso: 'NC_EMITIR' },
    { tipo: 'ND', impacto: 'D', permiso: 'ND_EMITIR' },
    { tipo: 'REC', impacto: 'C', permiso: 'REC_EMITIR' },
    { tipo: 'FC', impacto: 'D', permiso: 'FAC_EMITIR' },
    { tipo: 'CI', impacto: 'C', permiso: 'NC_EMITIR' },
    { tipo: 'OT', impacto: 'C', permiso: 'NC_EMITIR' }
];

const script = `
$ErrorActionPreference = 'Stop'
$fuente = 'using System; public static class PermisoEnvioPrueba {' + $env:SGTL_TEST_PERMISO_ENVIO + '}'
Add-Type -TypeDefinition $fuente
$casos = ConvertFrom-Json $env:SGTL_TEST_CASOS_EMAIL
$resultado = foreach ($caso in $casos) {
    try { [PermisoEnvioPrueba]::PermisoEnvio($caso.tipo, $caso.impacto) }
    catch { 'ERROR' }
}
ConvertTo-Json -InputObject @($resultado) -Compress
`;
const ejecucion = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8',
    env: { ...process.env, SGTL_TEST_PERMISO_ENVIO: extraerMetodo('PermisoEnvio'), SGTL_TEST_CASOS_EMAIL: JSON.stringify(casos) }
});
assert.strictEqual(ejecucion.status, 0, ejecucion.stderr || ejecucion.stdout);
assert.deepStrictEqual(JSON.parse(ejecucion.stdout.trim()), casos.map(function (caso) { return caso.permiso; }),
    'FC de deuda usa FAC_EMITIR y los créditos configurables usan NC_EMITIR');

assert.match(fuente, /SELECT c\.Comprobante_ID,c\.Tipo,c\.Impacto,/,
    'el permiso del tipo configurado debe basarse en el impacto persistido en COMPROBANTES');
assert.match(fuente, /Impacto = \(string\)reader\["Impacto"\]/,
    'la lectura del comprobante debe trasladar el impacto al permiso');
assert.strictEqual((fuente.match(/PermisoEnvio\(comprobante\.Tipo, comprobante\.Impacto\)/g) || []).length, 2,
    'preparar y enviar correo deben validar el mismo permiso del comprobante');

console.log('OK: envío por correo de comprobantes configurables según su impacto');
