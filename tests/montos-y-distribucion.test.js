const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const fuenteUi = fs.readFileSync(path.join(raiz, 'assets', 'static', 'js', 'sgtl-ui.js'), 'utf8');
const fuenteCuenta = fs.readFileSync(path.join(raiz, 'assets', 'static', 'js', 'cuenta-corriente-clientes.js'), 'utf8');

function cargarSgtl() {
    const window = {};
    vm.runInNewContext(fuenteUi, {
        window: window,
        document: {
            querySelector: function () { return null; },
            addEventListener: function () {},
            documentElement: {
                hasAttribute: function () { return false; },
                setAttribute: function () {}
            }
        },
        Intl: Intl,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Blob: function () {},
        URL: { createObjectURL: function () { return ''; }, revokeObjectURL: function () {} }
    }, { filename: 'sgtl-ui.js' });
    return window.SGTL;
}

function extraerFuncion(nombre) {
    const inicio = fuenteCuenta.indexOf('function ' + nombre + '(');
    assert.notStrictEqual(inicio, -1, 'falta la función ' + nombre);
    const apertura = fuenteCuenta.indexOf('{', inicio);
    let nivel = 0;
    for (let i = apertura; i < fuenteCuenta.length; i += 1) {
        if (fuenteCuenta[i] === '{') nivel += 1;
        if (fuenteCuenta[i] === '}') nivel -= 1;
        if (nivel === 0) return fuenteCuenta.slice(inicio, i + 1);
    }
    throw new Error('no se pudo extraer ' + nombre);
}

function cargarDistribuidor() {
    const sandbox = {};
    vm.runInNewContext(extraerFuncion('distribuirImportePorVencimiento'), sandbox,
        { filename: 'cuenta-corriente-clientes.js' });
    return sandbox.distribuirImportePorVencimiento;
}

function cargarValidadorMontos(SGTL) {
    const sandbox = { window: { SGTL: SGTL } };
    vm.runInNewContext(
        extraerFuncion('leerMontoCentavos') + '\n' + extraerFuncion('primerMontoInvalido'),
        sandbox, { filename: 'cuenta-corriente-clientes.js' });
    return sandbox.primerMontoInvalido;
}

function crearInput(valor) {
    return {
        value: valor,
        listeners: {},
        addEventListener: function (evento, listener) { this.listeners[evento] = listener; }
    };
}

function probarFormatoArgentino() {
    const SGTL = cargarSgtl();
    assert.strictEqual(SGTL.montoCentavos('1.234,56'), 123456,
        'debe leer punto de miles y coma decimal');
    assert.strictEqual(SGTL.montoCentavos('1234.56'), 123456,
        'debe aceptar punto decimal cuando no representa miles');
    assert.strictEqual(SGTL.formatearMontoCentavos(123456), '1.234,56',
        'debe mostrar miles con punto y dos decimales con coma');
}

function probarRechazoDeImportesInvalidos() {
    const SGTL = cargarSgtl();
    assert.strictEqual(SGTL.montoCentavos(''), null, 'un importe vacío no debe convertirse en cero');
    assert.strictEqual(SGTL.montoCentavos('-1,00'), null, 'un importe negativo no debe ser válido');
    assert.strictEqual(SGTL.montoCentavos('1.234,567'), null, 'no debe aceptar más de dos decimales');
}

function probarQueLosImportesInvalidosNoSeConviertanEnCero() {
    const primerInvalido = cargarValidadorMontos(cargarSgtl());
    assert.strictEqual(primerInvalido([
        { etiqueta: 'El importe neto', valor: '1.000,00' },
        { etiqueta: 'Otros impuestos', valor: 'texto inválido' }
    ]), 'Otros impuestos', 'debe identificar el campo inválido antes de emitir');
    assert.strictEqual(primerInvalido([
        { etiqueta: 'El importe del Recibo', valor: '0,00' },
        { etiqueta: 'Aplicación de FAC-1', valor: '250,50' }
    ]), null, 'un importe argentino válido, incluso cero, no debe marcarse como inválido');
}

function probarMascaraAlPerderFoco() {
    const SGTL = cargarSgtl();
    const input = crearInput('1234,5');
    SGTL.enlazarMascaraMonto(input);
    input.listeners.blur();
    assert.strictEqual(input.value, '1.234,50', 'la máscara debe normalizar el importe al perder foco');
}

function probarDistribucionPorVencimiento() {
    const distribuir = cargarDistribuidor();
    const resultado = distribuir(50000000, [
        { ComprobanteID: 3, FechaVencimiento: '2026-11-30', FechaEmision: '2026-10-03', SaldoCentavos: 20000000 },
        { ComprobanteID: 2, FechaVencimiento: '2026-10-15', FechaEmision: '2026-10-02', SaldoCentavos: 20000000 },
        { ComprobanteID: 1, FechaVencimiento: '2026-10-15', FechaEmision: '2026-10-01', SaldoCentavos: 20000000 }
    ]);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(resultado)), [
        { ComprobanteID: 1, ImporteCentavos: 20000000 },
        { ComprobanteID: 2, ImporteCentavos: 20000000 },
        { ComprobanteID: 3, ImporteCentavos: 10000000 }
    ], 'debe cancelar por vencimiento, desempatar por emisión y aplicar parcialmente la última Factura');
}

probarFormatoArgentino();
probarRechazoDeImportesInvalidos();
probarQueLosImportesInvalidosNoSeConviertanEnCero();
probarMascaraAlPerderFoco();
probarDistribucionPorVencimiento();
console.log('OK: montos argentinos y distribución FIFO');
