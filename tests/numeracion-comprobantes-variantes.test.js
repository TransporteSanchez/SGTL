const assert = require('assert');
const fs = require('fs');
const path = require('path');

const carpeta = path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers');
const archivos = [
    'ComprobantesController.cs',
    'FacturasController.cs',
    'RecibosController.cs',
    'CuentaCorrienteController.cs',
    'EnviosComprobantesController.cs',
    'ProformasController.cs',
    path.join('..', 'Tarifas', 'TarifarioImpacto.cs')
];

for (const archivo of archivos) {
    const fuente = fs.readFileSync(path.join(carpeta, archivo), 'utf8');
    assert.ok(!/(?:\b(?:c|d|r|deuda|credito)\.)?Tipo\s*\+\s*'-'\s*\+\s*RIGHT\s*\(/i.test(fuente),
        archivo + ': un número visible SQL debe distinguir letra y sucursal');
    assert.ok(!/'FAC-'\s*\+\s*RIGHT\s*\(/i.test(fuente),
        archivo + ': la factura de una proforma debe distinguir letra y sucursal');
    for (const linea of fuente.split(/\r?\n/)) {
        if (!linea.includes('NumeroCorrelativo') || !linea.includes('RIGHT(')) continue;
        assert.match(linea, /Tipo[\s\S]*Letra[\s\S]*Sucursal[\s\S]*NumeroCorrelativo/,
            archivo + ': cada proyección SQL de número visible incluye tipo, letra, sucursal y correlativo');
    }
}

const comprobantes = fs.readFileSync(path.join(carpeta, 'ComprobantesController.cs'), 'utf8');
const facturas = fs.readFileSync(path.join(carpeta, 'FacturasController.cs'), 'utf8');
const recibos = fs.readFileSync(path.join(carpeta, 'RecibosController.cs'), 'utf8');

assert.match(comprobantes, /private static string Numero\(string tipo, string letra, string sucursal, int numero\)/,
    'las notas y comprobantes directos forman el número con la letra y la sucursal');
assert.match(facturas, /private static string NumeroFactura\(string letra, string sucursal, int numero\)/,
    'las facturas desde proforma forman el número con la letra y la sucursal');
assert.match(recibos, /private static string NumeroRecibo\(string letra, string sucursal, int numero\)/,
    'los recibos forman el número con la letra y la sucursal');

for (const [nombre, fuente] of [
    ['ComprobantesController.cs', comprobantes],
    ['FacturasController.cs', facturas],
    ['RecibosController.cs', recibos]
]) {
    assert.ok(!/(?:Numero|NumeroFactura|NumeroRecibo)\([^,()]+\)\s*\+?/.test(fuente),
        nombre + ': ninguna respuesta ni auditoría debe usar un correlativo aislado');
}

function formatearDesdeCSharp(fuente, metodo, tipo, letra, sucursal, numero) {
    const firma = new RegExp('private static string ' + metodo + '\\([^)]*\\)\\s*\\{\\s*return ([^;]+);');
    const coincidencia = fuente.match(firma);
    assert.ok(coincidencia, metodo + ': falta la fórmula del número visible');
    const expresion = coincidencia[1].replace(
        /numero\.ToString\("D8", CultureInfo\.InvariantCulture\)/,
        'String(numero).padStart(8, "0")');
    return Function('tipo', 'letra', 'sucursal', 'numero', 'return ' + expresion + ';')(
        tipo, letra, sucursal, numero);
}

for (const [metodo, fuente, tipo] of [
    ['Numero', comprobantes, 'FAC'],
    ['NumeroFactura', facturas, 'FAC'],
    ['NumeroRecibo', recibos, 'REC']
]) {
    assert.strictEqual(formatearDesdeCSharp(fuente, metodo, tipo, 'A', '0001', 12),
        tipo + '-A-0001-00000012', metodo + ': el número A identifica su sucursal');
    assert.strictEqual(formatearDesdeCSharp(fuente, metodo, tipo, 'B', '0002', 12),
        tipo + '-B-0002-00000012', metodo + ': el mismo correlativo B no se confunde con A');
    assert.strictEqual(formatearDesdeCSharp(fuente, metodo, tipo, 'A', '0002', 12),
        tipo + '-A-0002-00000012', metodo + ': dos sucursales con letra A no se confunden');
}

console.log('OK: los números visibles de comprobantes distinguen tipo, letra, sucursal y correlativo');
