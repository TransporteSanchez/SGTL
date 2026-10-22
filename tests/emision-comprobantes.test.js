const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const fuente = fs.readFileSync(path.join(raiz, 'assets', 'static', 'js', 'cuenta-corriente-clientes.js'), 'utf8');
const pagina = fs.readFileSync(path.join(raiz, 'cuenta-corriente-clientes.html'), 'utf8');

function extraerFuncion(nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.notStrictEqual(inicio, -1, 'falta la función ' + nombre);
    const apertura = fuente.indexOf('{', inicio);
    let nivel = 0;
    for (let i = apertura; i < fuente.length; i += 1) {
        if (fuente[i] === '{') nivel += 1;
        if (fuente[i] === '}') nivel -= 1;
        if (nivel === 0) return fuente.slice(inicio, i + 1);
    }
    throw new Error('no se pudo extraer ' + nombre);
}

function probarCierreYAviso() {
    const modal = {
        listeners: {},
        addEventListener: function (evento, handler) { this.listeners[evento] = handler; },
        removeEventListener: function (evento) { delete this.listeners[evento]; }
    };
    const llamadas = [];
    const sandbox = {
        porId: function (id) {
            assert.strictEqual(id, 'modalPrueba');
            return modal;
        },
        window: {
            SGTL: {
                modal: function (elemento, accion) {
                    llamadas.push(['modal', elemento, accion]);
                    elemento.listeners['hidden.bs.modal']();
                },
                toastExito: function (mensaje) { llamadas.push(['toast', mensaje]); }
            }
        }
    };

    vm.runInNewContext(extraerFuncion('cerrarModalYNotificar'), sandbox,
        { filename: 'cuenta-corriente-clientes.js' });
    sandbox.cerrarModalYNotificar('modalPrueba', 'Se generó la Factura FAC-00000001 correctamente.');

    assert.deepStrictEqual(llamadas, [
        ['modal', modal, 'hide'],
        ['toast', 'Se generó la Factura FAC-00000001 correctamente.']
    ], 'debe cerrar primero el formulario y luego informar el número del comprobante');
}

function probarFlujosYDependencias() {
    const recibo = extraerFuncion('emitirRecibo');
    const comprobante = extraerFuncion('emitirComprobante');
    assert.match(recibo, /cerrarModalYNotificar\('modalNuevoRecibo'/,
        'al emitir un Recibo debe cerrar su formulario y mostrar el aviso flotante');
    assert.match(recibo, /recibo\.Numero/,
        'el aviso del Recibo debe informar el número generado');
    assert.match(comprobante, /cerrarModalYNotificar\('modalNuevoComprobante'/,
        'al emitir Factura, NC o ND debe cerrar su formulario y mostrar el aviso flotante');
    assert.match(comprobante, /'Factura'[\s\S]*'Nota de crédito'[\s\S]*'Nota de débito'[\s\S]*comprobante\.Numero/,
        'el aviso debe identificar Factura, NC o ND e informar su número generado');
    assert.match(pagina, /assets\/static\/css\/sgtl\.css/,
        'Cuenta Corriente debe cargar los estilos de los avisos flotantes');
    assert.match(pagina, /assets\/static\/js\/sgtl-ui\.js[\s\S]*assets\/static\/js\/cuenta-corriente-clientes\.js/,
        'Cuenta Corriente debe cargar SGTL antes de usar el aviso flotante');
}

probarCierreYAviso();
probarFlujosYDependencias();
console.log('OK: cierre y aviso al emitir comprobantes');
