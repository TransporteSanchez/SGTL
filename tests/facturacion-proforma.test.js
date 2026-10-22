const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function crearClaseLista() {
    return {
        add: function () {},
        remove: function () {}
    };
}

function crearElemento() {
    return {
        value: '',
        max: '',
        textContent: '',
        innerHTML: '',
        className: '',
        disabled: false,
        readOnly: false,
        classList: crearClaseLista(),
        listeners: {},
        addEventListener: function (evento, handler) { this.listeners[evento] = handler; },
        querySelectorAll: function () { return []; }
    };
}

function esperarMicrotareas() {
    return new Promise(function (resolver) { setImmediate(resolver); });
}

function crearFechaFija() {
    function FechaFija() {
        if (arguments.length === 0) return new Date('2026-10-20T12:00:00-03:00');
        return new (Function.prototype.bind.apply(Date, [null].concat(Array.prototype.slice.call(arguments))))();
    }
    FechaFija.prototype = Date.prototype;
    FechaFija.now = function () { return new Date('2026-10-20T12:00:00-03:00').getTime(); };
    FechaFija.parse = Date.parse;
    FechaFija.UTC = Date.UTC;
    return FechaFija;
}

async function ejecutarPrueba() {
    const elementos = {};
    [
        'modalFacturarProforma', 'facProformaNumero', 'facTotal', 'facFechaEmision', 'facFechaVencimiento',
        'facObservaciones', 'facResultado', 'btnConfirmarFactura', 'facFormulario', 'facTipoComprobante',
        'facNumeroComprobante', 'facLetra', 'facSucursal', 'facMensaje', 'facImprimirFactura', 'facDescargarFactura'
    ].forEach(function (id) { elementos[id] = crearElemento(); });

    const solicitudes = [];
    let modalAgregado = false;
    let modalMarkup = '';
    const documento = {
        getElementById: function (id) {
            if (id === 'modalFacturarProforma' && !modalAgregado) return null;
            return elementos[id] || null;
        },
        body: { appendChild: function () { modalAgregado = true; } },
        createElement: function () {
            const contenedor = crearElemento();
            Object.defineProperty(contenedor, 'innerHTML', {
                get: function () { return modalMarkup; },
                set: function (valor) { modalMarkup = valor; }
            });
            contenedor.firstElementChild = elementos.modalFacturarProforma;
            return contenedor;
        }
    };
    const ventana = {
        ConfiguracionFacturacion: { cargar: function () { return Promise.resolve(); } },
        crypto: { randomUUID: function () { return '1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a1a'; } },
        localStorage: { getItem: function () { return 'token-prueba'; } }
    };
    const sandbox = {
        window: ventana,
        document: documento,
        localStorage: ventana.localStorage,
        Intl: Intl,
        Date: crearFechaFija(),
        Promise: Promise,
        Math: Math,
        fetch: function (url, opciones) {
            solicitudes.push({ url: url, opciones: opciones || {} });
            if ((opciones || {}).method === 'POST') {
                return Promise.resolve({ ok: true, status: 201, json: function () {
                    return Promise.resolve({ Numero: 'FAC-00000012', Total: 121, ClienteID: 5, ComprobanteID: 8 });
                } });
            }
            return Promise.resolve({ ok: true, status: 200, json: function () {
                return Promise.resolve({
                    ProformaID: 7,
                    Numero: 'PF-00000007',
                    Facturable: true,
                    VersionProforma: 'AQIDBAUGBwg=',
                    TotalCalculado: 121,
                    FechaVencimientoSugerida: '2026-10-20'
                });
            } });
        }
    };

    const fuente = fs.readFileSync(path.join(__dirname, '..', 'assets', 'static', 'js', 'facturacion-proforma.js'), 'utf8');
    vm.runInNewContext(fuente, sandbox, { filename: 'facturacion-proforma.js' });

    ventana.FacturacionProforma.abrir(7);
    await esperarMicrotareas();

    assert.match(modalMarkup, /modal-dialog modal-xl modal-dialog-scrollable sgtl-modal-formulario/,
        'la Factura desde proforma debe usar el mismo tamaño visible que el formulario de Recibo');
    assert.match(modalMarkup, />Registrar Factura desde proforma<\/h5>/,
        'la Factura desde proforma debe mostrar el título de registro');

    assert.strictEqual(elementos.facFechaVencimiento.value, '2026-10-30',
        'la factura desde proforma debe sugerir vencimiento a los 10 días de la emisión. Mensaje: ' + elementos.facMensaje.textContent);
    elementos.btnConfirmarFactura.listeners.click();
    await esperarMicrotareas();

    const emision = solicitudes.filter(function (solicitud) { return solicitud.opciones.method === 'POST'; })[0];
    assert.ok(emision, 'debe enviar la emisión de la factura');
    assert.ok(!Object.prototype.hasOwnProperty.call(JSON.parse(emision.opciones.body), 'Conceptos'),
        'la emisión no debe permitir completar conceptos: la proforma ya debe contenerlos');
}

function extraerFuncion(fuente, nombre) {
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

function probarConceptoObligatorioEnProforma() {
    const fuente = fs.readFileSync(path.join(__dirname, '..', 'gestion-facturacion.html'), 'utf8');
    const vacio = { value: '   ', classList: { toggle: function (clase, activo) { this.invalido = clase === 'is-invalid' && activo; } } };
    const completo = { value: 'Viaje Rosario - Buenos Aires', classList: { toggle: function (clase, activo) { this.invalido = clase === 'is-invalid' && activo; } } };
    const alerta = { mensaje: '', visible: false };
    const sandbox = {
        document: {
            querySelectorAll: function (selector) {
                assert.strictEqual(selector, '#cuerpoConceptos .c-concepto');
                return [vacio, completo];
            }
        },
        $: function (selector) {
            if (selector === '#modalProforma .modal-body') {
                return { scrollTop: function () { return this; } };
            }
            assert.strictEqual(selector, '#alertaCompletaCampos');
            return {
                text: function (mensaje) { alerta.mensaje = mensaje; return this; },
                show: function () { alerta.visible = true; return this; },
                hide: function () { alerta.visible = false; return this; }
            };
        }
    };

    vm.runInNewContext(extraerFuncion(fuente, 'validarConceptosProforma'), sandbox, { filename: 'gestion-facturacion.html' });
    assert.strictEqual(sandbox.validarConceptosProforma(), false,
        'no debe permitir guardar una proforma con un concepto vacío');
    assert.strictEqual(vacio.classList.invalido, true, 'debe marcar el concepto vacío');
    assert.strictEqual(completo.classList.invalido, false, 'no debe marcar un concepto completo');
    assert.match(alerta.mensaje, /concepto/i, 'debe indicar qué dato falta');

    vacio.value = 'Viaje Córdoba - Mendoza';
    assert.strictEqual(sandbox.validarConceptosProforma(), true,
        'debe permitir guardar cuando todos los conceptos están completos');
}

function probarObservacionesUnificadasEnProforma() {
    const fuente = fs.readFileSync(path.join(__dirname, '..', 'gestion-facturacion.html'), 'utf8');
    const valores = {
        p_id: '0', p_moneda: 'ARS', p_otros: '0', p_observaciones: 'Entregar de lunes a viernes.'
    };
    const sandbox = {
        document: {
            querySelectorAll: function (selector) {
                assert.strictEqual(selector, '#cuerpoConceptos tr');
                return [];
            }
        },
        parseInt: parseInt,
        val: function (id) { return valores[id] || ''; },
        toIso: function (valor) { return valor || null; },
        usuario: function () { return 'usuario-prueba'; }
    };

    vm.runInNewContext(extraerFuncion(fuente, 'armarDto'), sandbox, { filename: 'gestion-facturacion.html' });
    const dto = sandbox.armarDto();

    assert.strictEqual(dto.Observaciones, 'Entregar de lunes a viernes.',
        'debe enviar el único campo de observaciones');
    assert.strictEqual(dto.TiempoServicio, undefined,
        'no debe enviar el tiempo estimado del servicio retirado');
    assert.strictEqual(dto.ObsComerciales, undefined,
        'no debe enviar las observaciones comerciales retiradas');
    assert.strictEqual(dto.CondParticulares, undefined,
        'no debe enviar las condiciones particulares retiradas');
}

ejecutarPrueba().then(function () {
    probarConceptoObligatorioEnProforma();
    probarObservacionesUnificadasEnProforma();
    console.log('OK: facturación desde proforma');
}).catch(function (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
});
