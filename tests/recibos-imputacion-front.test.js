const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const raiz = path.join(__dirname, '..');
const fuente = fs.readFileSync(path.join(raiz, 'assets/static/js/cuenta-corriente-clientes.js'), 'utf8');
function funcion(nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.ok(inicio >= 0, nombre);
    let nivel = 0;
    for (let i = fuente.indexOf('{', inicio); i < fuente.length; i++) {
        if (fuente[i] === '{') nivel++;
        if (fuente[i] === '}' && --nivel === 0) return fuente.slice(inicio, i + 1);
    }
}
const centavos = v => typeof v === 'number' ? Math.round(v * 100)
    : Math.round(Number(String(v || '0').replace(/\./g, '').replace(',', '.')) * 100);
const tick = () => new Promise(setImmediate);
function acciones() {
    const c = { window: { SGTL: { botonFila(accion, opciones) { return { accion, ...opciones }; }, accionesFila(b) { return b; } } } };
    vm.runInNewContext(['tipoComprobante', 'estadoRecibo', 'accionesComprobante'].map(funcion).join('\n'), c);
    for (const [tipo, impacto] of [['FAC', 'D'], ['FC', 'D'], ['D', 'D'], ['ND', 'D'], ['NC', 'C']]) {
        const botones = c.accionesComprobante({ ComprobanteID: 10, Tipo: tipo, Impacto: impacto,
            EstadoComprobante: 'EMITIDO', SaldoPendiente: 100 });
        assert.strictEqual(botones.some(b => b.accion === 'siguiente'), false, tipo + ': no muestra Imputar');
    }
    for (const tipo of ['C', 'CI']) {
        const botones = c.accionesComprobante({ ComprobanteID: 10, Tipo: tipo, Impacto: 'C',
            EstadoComprobante: 'EMITIDO', SaldoPendiente: 100 });
        const indice = botones.findIndex(b => b.accion === 'siguiente');
        assert.strictEqual(botones[indice].texto, 'Imputar crédito');
        assert.strictEqual(botones[indice].deshabilitado, false);
        assert.strictEqual(botones[indice - 1].accion, 'enviar');
        assert.strictEqual(botones[indice + 1].accion, 'anular');
    }
    for (const saldo of [100, 40]) {
        const boton = c.accionesComprobante({ ComprobanteID: 10, Tipo: 'REC', EstadoComprobante: 'EMITIDO', SaldoPendiente: saldo })
            .find(b => b.accion === 'siguiente');
        assert.strictEqual(boton.texto, 'Imputar recibo');
        assert.strictEqual(boton.deshabilitado, false, 'un recibo con saldo admite imputación posterior');
    }
    // Anular: solo los recibos; los tipos configurables no mencionan la NC (§62, F6).
    for (const [tipo, impacto, motivo] of [
        ['C', 'C', 'No se puede anular el crédito: solo se anulan los recibos'],
        ['D', 'D', 'No se puede anular el comprobante: se corrige con un crédito'],
        ['FC', 'D', 'No se puede anular el comprobante: se corrige con un crédito'],
        ['FAC', 'D', 'No se puede anular la factura: se corrige con una nota de crédito'],
        ['NC', 'C', 'No se puede anular la nota de crédito: solo se anulan los recibos']]) {
        const anular = c.accionesComprobante({ ComprobanteID: 10, Tipo: tipo, Impacto: impacto, EstadoComprobante: 'EMITIDO',
            SaldoPendiente: 0 }).find(b => b.accion === 'anular');
        assert.strictEqual(anular.texto, 'Anular comprobante', tipo + ': no dice "Anular recibo"');
        assert.strictEqual(anular.deshabilitado, true);
        assert.strictEqual(anular.motivo, motivo, tipo);
    }
    for (const [estado, saldo, motivo] of [['ANULADO', 100, 'está anulado'], ['EMITIDO', 0, 'ya está aplicado por completo']]) {
        const boton = c.accionesComprobante({ ComprobanteID: 10, Tipo: 'REC', EstadoComprobante: estado, SaldoPendiente: saldo })
            .find(b => b.accion === 'siguiente');
        assert.strictEqual(boton.deshabilitado, true);
        assert.ok(boton.motivo.includes('No se puede imputar el recibo: ' + motivo));
    }
}
async function emitirSinDeudas() {
    const campos = {
        reciboFecha: { value: '2026-10-20' }, reciboFormaImporte: { value: '100,00' }, reciboFormaPago: { value: 'Efectivo' },
        reciboReferencia: { value: '' }, reciboLetra: { value: 'X' }, reciboSucursal: { value: '0001' },
        reciboObservaciones: { value: '' }, reciboError: { textContent: '' }, reciboResumenTotal: {},
        reciboResumenAplicado: {}, reciboResumenDiferencia: {}, reciboFacturas: { innerHTML: '', querySelectorAll: () => [] }
    };
    let enviado;
    const c = { reciboEditandoId: null, reciboOperacion: 'operacion', porId: id => campos[id], centavos,
        document: { querySelectorAll: () => [] }, token: () => 'sesion', hoyIso: () => '2026-10-27',
        clienteReciboActual: () => ({ ClienteID: 1 }), primerMontoInvalido: () => null, camposAplicacionSeleccionados: () => [],
        validarReferenciaRecibo: () => true, dinero: v => v, enlazarMascaraMonto() {},
        apiGet: () => Promise.resolve([]),
        apiPost(ruta, datos) { enviado = { ruta, datos }; return Promise.resolve({ Numero: 'REC-X-1' }); },
        cerrarModalYNotificar() {}, cargarCuenta() {},
        window: { SGTL: { procesando: () => () => {} } }
    };
    vm.runInNewContext(['aplicacionesRecibo', 'emitirRecibo', 'actualizarResumenRecibo', 'cargarFacturasRecibo'].map(funcion).join('\n'), c);
    await c.cargarFacturasRecibo();
    assert.strictEqual(campos.reciboFormaImporte.value, '100,00', 'la búsqueda de deudas no borra el importe ingresado');
    assert.strictEqual(campos.reciboResumenDiferencia.textContent, 100, 'se muestra todo el saldo sin imputar');
    c.emitirRecibo(); await tick();
    assert.strictEqual(enviado.ruta, '/recibos');
    assert.strictEqual(enviado.datos.Total, 100);
    assert.strictEqual(enviado.datos.ImporteFormaPago, 100);
    assert.strictEqual(enviado.datos.Aplicaciones.length, 0, 'se emite un recibo sin seleccionar deudas');
}
async function imputarDespues() {
    const campos = {};
    ['imputarTitulo', 'imputarNumero', 'imputarCliente', 'imputarSaldo', 'imputarError', 'modalImputarCredito',
        'btnGuardarImputacion', 'imputarFecha'].forEach(id => { campos[id] = {}; });
    const campo = { value: '20,00', getAttribute: n => ({ 'data-id': '21', 'data-pendiente-centavos': '9000', 'data-emision': '2026-10-22' }[n]) };
    campos.imputarFacturas = { querySelectorAll: () => [{ querySelector: s => s === '.cc-imputar-check' ? { checked: true } : campo }] };
    const avisos = [];
    let enviado;
    const c = { creditoImputando: null, facturasImputacion: [], validadorImputacion: null, porId: id => campos[id], centavos,
        buscarComprobante: () => ({ Tipo: 'REC', Comprobante: 'REC-X-1', Cliente: 'Cliente' }),
        ponerFecha(id, valor) { campos[id].value = valor; }, limitarFecha() {}, hoyIso: () => '2026-10-27',
        dinero: v => v, leerMontoCentavos: centavos,
        apiGet(ruta) { return Promise.resolve(ruta.startsWith('/comprobantes/') ? {
            Tipo: 'REC', EstadoDocumental: 'EMITIDO', SaldoPendiente: 70, ClienteID: 1, Numero: 'REC-X-1',
            FechaEmision: '2026-10-20', ComprobantesCancelados: [
                { ComprobanteID: 21, ImporteAplicado: 20 }, { ComprobanteID: 21, ImporteAplicado: 10 }
            ]
        } : [{ ComprobanteID: 21, Numero: 'FC-1', SaldoPendiente: 90 }]); },
        renderizarFacturasImputacion() { campos.btnGuardarImputacion.disabled = false; },
        apiPut(ruta, datos) { enviado = { ruta, datos }; return Promise.resolve({}); },
        cerrarModalYNotificar(modal, texto) { avisos.push(texto); }, cargarCuenta() {},
        window: { SGTL: { tabla: { cargando() {}, vacia() {} }, avisoFormulario() {}, modal() {}, limpiarError() {},
            procesando: () => () => {} } }
    };
    vm.runInNewContext(['tipoComprobante', 'abrirImputarCredito', 'guardarImputacionCredito'].map(funcion).join('\n'), c);
    await c.abrirImputarCredito(10);
    assert.strictEqual(campos.imputarTitulo.textContent, 'Imputar recibo');
    assert.ok(campos.btnGuardarImputacion.innerHTML.includes('Imputar recibo'));
    assert.strictEqual(c.creditoImputando.aplicadoPorFactura[21], 3000);
    assert.strictEqual(c.facturasImputacion.length, 1, 'se ofrecen las deudas con saldo');
    await c.guardarImputacionCredito();
    assert.strictEqual(enviado.ruta, '/comprobantes/10/aplicaciones');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(enviado.datos.Aplicaciones)), [{ ComprobanteID: 21, Importe: 50 }],
        'se envía el acumulado para agregar solo los 20 nuevos');
    assert.deepStrictEqual(avisos, ['Recibo imputado.']);
}
// El importe del recibo es lo que se cobró: tildar una deuda no lo cambia si el usuario lo escribió (§62, F3).
function tildarConImporte() {
    const formatearCentavos = v => (v / 100).toFixed(2).replace('.', ',');
    const fila = saldo => {
        const input = { disabled: true, value: '0,00', getAttribute: n => ({ 'data-pendiente-centavos': String(saldo) }[n]) };
        return { input, check: { checked: false, closest: () => ({ querySelector: () => input }) } };
    };
    const fc = fila(12100000), d = fila(1000000);
    const campos = { reciboFormaImporte: { value: '0,00' }, reciboResumenTotal: {}, reciboResumenAplicado: {},
        reciboResumenDiferencia: {} };
    const c = { importeReciboEscrito: false, porId: id => campos[id], centavos, formatearCentavos, dinero: v => v,
        document: { querySelectorAll: () => [fc.input, d.input] } };
    vm.runInNewContext(['actualizarResumenRecibo', 'tildarDeudaRecibo'].map(funcion).join('\n'), c);
    const tildar = (f, marcado) => { f.check.checked = marcado; c.tildarDeudaRecibo(f.check); c.actualizarResumenRecibo(); };

    tildar(fc, true);
    assert.strictEqual(fc.input.value, '121000,00', 'sin importe escrito, Aplicar toma el saldo de la deuda');
    assert.strictEqual(campos.reciboFormaImporte.value, '121000,00', 'sin importe escrito, el importe acompaña a lo aplicado');
    tildar(fc, false);
    assert.strictEqual(campos.reciboFormaImporte.value, '0,00');

    c.importeReciboEscrito = true;
    campos.reciboFormaImporte.value = '50000,00';
    tildar(fc, true);
    assert.strictEqual(fc.input.value, '50000,00', 'con importe escrito, Aplicar sugiere lo que falta distribuir');
    assert.strictEqual(campos.reciboFormaImporte.value, '50000,00', 'el importe escrito no cambia al tildar');
    assert.strictEqual(campos.reciboResumenDiferencia.textContent, 0);
    tildar(d, true);
    assert.strictEqual(d.input.value, '10000,00', 'si ya no falta distribuir, sugiere el saldo');
    assert.strictEqual(campos.reciboResumenDiferencia.textContent, -10000, 'y la diferencia muestra que se pasa');
    tildar(d, false); tildar(fc, false);

    campos.reciboFormaImporte.value = '150000,00';
    tildar(fc, true);
    assert.strictEqual(fc.input.value, '121000,00', 'Aplicar no pasa del saldo de la deuda');
    assert.strictEqual(campos.reciboResumenDiferencia.textContent, 29000, 'lo que sobra queda sin imputar');
}
(async () => {
    acciones(); await emitirSinDeudas(); await imputarDespues(); tildarConImporte();
    console.log('OK: emitir recibos sin deudas, conservar el importe y abrir y guardar Imputar recibo');
})().catch(e => { console.error(e); process.exitCode = 1; });
