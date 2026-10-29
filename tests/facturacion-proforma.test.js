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
        'facObservaciones', 'facResultado', 'btnConfirmarFactura', 'btnCerrarFacturarProforma', 'facFormulario', 'facTipoComprobante',
        'facNumeroComprobante', 'facLetra', 'facSucursal', 'facMensaje', 'facImprimirFactura', 'facDescargarFactura',
        'btnCerrarCabeceraFacturarProforma'
    ].forEach(function (id) { elementos[id] = crearElemento(); });
    elementos.facFormulario.querySelectorAll = function () {
        return [elementos.facTipoComprobante, elementos.facLetra, elementos.facSucursal,
            elementos.facFechaEmision, elementos.facFechaVencimiento, elementos.facObservaciones];
    };

    const solicitudes = [];
    const tiposConfigurados = [];
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
        ConfiguracionFacturacion: { cargar: function (tipo) {
            tiposConfigurados.push(tipo);
            if (tipo === 'FAC') return Promise.reject(new Error('El tipo de comprobante no tiene una configuración de facturación activa.'));
            return Promise.resolve({ Tipo: tipo, Descripcion: 'Comprobante interno' });
        } },
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
            if (url.endsWith('/facturacion-config/tipos-emision-directa')) {
                return Promise.resolve({ ok: true, status: 200, json: function () {
                    return Promise.resolve([
                        { Tipo: 'FZ', Descripcion: 'Otro comprobante interno', Impacto: 'D' },
                        { Tipo: 'FC', Descripcion: 'Comprobante interno', Impacto: 'D' }
                    ]);
                } });
            }
            if ((opciones || {}).method === 'POST') {
                return Promise.resolve({ ok: true, status: 201, json: function () {
                    return Promise.resolve({ Tipo: 'FC', Numero: 'FC-A-0001-00000012', Total: 121, ClienteID: 5, ComprobanteID: 8 });
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
    assert.strictEqual(elementos.facFechaVencimiento.value, '2026-10-30',
        'el formulario sugiere vencimiento a los 10 días de la emisión');
    elementos.facFechaEmision.value = '2026-10-19';
    elementos.facFechaVencimiento.value = '2026-10-29';
    elementos.facFechaVencimiento.listeners.change();
    await esperarMicrotareas();

    assert.match(modalMarkup, /modal-dialog modal-xl modal-dialog-scrollable sgtl-modal-formulario/,
        'la Factura desde proforma debe usar el mismo tamaño visible que el formulario de Recibo');
    assert.match(modalMarkup, />Emitir comprobante<\/h5>/,
        'la ventana se titula como la acción que la abre en proformas, "Emitir comprobante" (§6.1)');
    assert.match(modalMarkup, /id="btnConfirmarFactura"[^>]*>[\s\S]*?Emitir comprobante<\/button>/,
        'el botón del formulario debe decir "Emitir comprobante"');
    assert.match(modalMarkup, /id="btnCerrarFacturarProforma"[^>]*>Cancelar<\/button>/,
        'antes de emitir, el formulario ofrece Cancelar');
    assert.strictEqual(elementos.btnCerrarFacturarProforma.textContent, 'Cancelar');

    assert.strictEqual(elementos.facFechaEmision.value, '2026-10-19',
        'el GET de proforma no debe sobrescribir una fecha de emisión ya editada');
    assert.strictEqual(elementos.facFechaVencimiento.value, '2026-10-29',
        'el GET de proforma no debe sobrescribir un vencimiento ya editado');
    assert.deepStrictEqual(tiposConfigurados, ['FC'], 'debe cargar FC aunque FAC esté inactivo');
    assert.strictEqual(elementos.facTipoComprobante.value, 'FC', 'debe preseleccionar el comprobante interno');
    assert.strictEqual(elementos.btnConfirmarFactura.disabled, false, 'debe poder emitir la proforma con FC activo');
    assert.match(elementos.facMensaje.textContent, /proforma está lista/i,
        'no debe mostrar un error de conexión por la configuración FAC inactiva');
    elementos.facTipoComprobante.value = 'FZ';
    elementos.facTipoComprobante.listeners.change();
    await esperarMicrotareas();
    assert.deepStrictEqual(tiposConfigurados, ['FC', 'FZ'], 'al cambiar de tipo debe cargar su propia configuración');
    elementos.facTipoComprobante.value = 'FC';
    elementos.facTipoComprobante.listeners.change();
    await esperarMicrotareas();
    elementos.btnConfirmarFactura.listeners.click();
    assert.strictEqual(elementos.btnCerrarFacturarProforma.disabled, true,
        'Cancelar queda deshabilitado mientras se emite');
    assert.strictEqual(elementos.btnCerrarCabeceraFacturarProforma.disabled, true,
        'la cruz queda deshabilitada mientras se emite');
    assert.strictEqual(elementos.facTipoComprobante.disabled, true,
        'el tipo no puede cambiar durante el POST de emisión');
    let cierreBloqueado = false;
    elementos.modalFacturarProforma.listeners['hide.bs.modal']({ preventDefault: function () { cierreBloqueado = true; } });
    assert.strictEqual(cierreBloqueado, true, 'Escape tampoco puede cerrar el modal durante la emisión');
    await esperarMicrotareas();
    assert.strictEqual(elementos.btnCerrarFacturarProforma.textContent, 'Cerrar',
        'después de emitir, el formulario de solo lectura ofrece Cerrar');
    assert.strictEqual(elementos.btnCerrarFacturarProforma.disabled, false,
        'Cerrar vuelve a habilitarse después de la respuesta');

    const emision = solicitudes.filter(function (solicitud) { return solicitud.opciones.method === 'POST'; })[0];
    assert.ok(emision, 'debe enviar la emisión de la factura');
    assert.strictEqual(JSON.parse(emision.opciones.body).Tipo, 'FC', 'la emisión vinculada debe guardar el tipo interno elegido');
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

function probarAccionEmitirComprobante() {
    const ui = fs.readFileSync(path.join(__dirname, '..', 'assets', 'static', 'js', 'sgtl-ui.js'), 'utf8');
    ['gestion-facturacion.html', 'listado-facturas.html'].forEach(function (pantalla) {
        const fuente = fs.readFileSync(path.join(__dirname, '..', pantalla), 'utf8');
        const sandbox = { window: {}, document: {
            addEventListener: function () {},
            documentElement: { hasAttribute: function () { return false; }, setAttribute: function () {} }
        } };
        vm.runInNewContext(ui, sandbox, { filename: 'sgtl-ui.js' });
        sandbox.SGTL = sandbox.window.SGTL;
        vm.runInNewContext(extraerFuncion(fuente, 'accionesProforma'), sandbox, { filename: pantalla });

        const habilitada = sandbox.accionesProforma({ Proforma_ID: 7, Estado: 'Aceptada' });
        assert.match(habilitada, /title="Emitir comprobante" aria-label="Emitir comprobante"/,
            pantalla + ': el tooltip y el lector de pantalla deben nombrar la acción nueva');

        const terminada = sandbox.accionesProforma({ Proforma_ID: 7, Estado: 'Aceptada', FacturaID: 8, FacturaNumero: 'FAC-00000012' });
        assert.match(terminada, /title="No se puede emitir el comprobante: ya se emitió FAC-00000012"/,
            pantalla + ': la acción deshabilitada debe explicar el motivo con el nuevo nombre');
    });
}

// La sigla se puede renombrar (§47): sin FC, el modal no propone otro tipo de deuda, salvo que haya uno solo (§62).
function probarTipoPropuesto() {
    const fuente = fs.readFileSync(path.join(__dirname, '..', 'assets', 'static', 'js', 'facturacion-proforma.js'), 'utf8');
    const sandbox = {};
    vm.runInNewContext(extraerFuncion(fuente, 'tipoPropuesto'), sandbox, { filename: 'facturacion-proforma.js' });
    const tipos = function () {
        return Array.prototype.map.call(arguments, function (tipo) { return { Tipo: tipo, Impacto: 'D' }; });
    };
    assert.strictEqual(sandbox.tipoPropuesto(tipos('FZ', 'FC')), 'FC', 'con FC activo lo propone');
    assert.strictEqual(sandbox.tipoPropuesto(tipos('D', 'FI')), '', 'con FC renombrado no propone el débito');
    assert.strictEqual(sandbox.tipoPropuesto(tipos('FAC', 'D')), '', 'sin FC tampoco elige otro entre varios');
    assert.strictEqual(sandbox.tipoPropuesto(tipos('FI')), 'FI', 'si hay un solo tipo, lo propone');
}

// Generar consume un número de proforma: pide confirmación antes de guardar y generar (§5.2; §62, F1).
async function probarConfirmarGenerar() {
    const fuente = fs.readFileSync(path.join(__dirname, '..', 'gestion-facturacion.html'), 'utf8');
    let pedido = null, generadas = 0, respuesta = false;
    const sandbox = { window: {}, guardarYGenerarProforma: function () { generadas += 1; },
        SGTL: { confirmar: function (opciones) { pedido = opciones; return Promise.resolve(respuesta); } } };
    vm.runInNewContext(extraerFuncion(fuente, 'generarProforma'), sandbox, { filename: 'gestion-facturacion.html' });
    sandbox.generarProforma();
    await esperarMicrotareas();
    assert.strictEqual(pedido.titulo, '¿Generar la proforma?');
    assert.strictEqual(pedido.verbo, 'Generar', 'el pie dice el verbo, nunca "Confirmar"');
    assert.match(pedido.mensaje, /próximo número/, 'la confirmación dice que consume un número');
    assert.strictEqual(generadas, 0, 'si se cancela, no se guarda ni se genera');
    respuesta = true;
    sandbox.generarProforma();
    await esperarMicrotareas();
    assert.strictEqual(generadas, 1, 'al confirmar, guarda y genera');

    assert.ok(fuente.includes("'Queda lista para emitir el comprobante. No vuelve a Generada.'"),
        'Marcar aceptada no dice "factura" (§62, M5)');
    const modal = fuente.slice(fuente.indexOf('id="modalProforma"'), fuente.indexOf('id="btnGenerar"'));
    assert.ok(!/<label class="form-label">/.test(modal), 'las etiquetas del formulario llevan for (§62, DS7)');
    assert.match(modal, /<label for="p_otros"/, 'Otros impuestos también');
}

ejecutarPrueba().then(function () {
    return probarConfirmarGenerar();
}).then(function () {
    probarTipoPropuesto();
    probarConceptoObligatorioEnProforma();
    probarObservacionesUnificadasEnProforma();
    probarAccionEmitirComprobante();
    console.log('OK: facturación desde proforma');
}).catch(function (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
});
