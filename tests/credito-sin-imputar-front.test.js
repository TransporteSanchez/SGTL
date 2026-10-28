const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const fuente = fs.readFileSync(path.join(raiz, 'assets/static/js/cuenta-corriente-clientes.js'), 'utf8');
const pagina = fs.readFileSync(path.join(raiz, 'cuenta-corriente-clientes.html'), 'utf8');

function funcion(nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.notStrictEqual(inicio, -1, 'Falta ' + nombre);
    const apertura = fuente.indexOf('{', inicio);
    let nivel = 0;
    for (let i = apertura; i < fuente.length; i += 1) {
        if (fuente[i] === '{') nivel += 1;
        if (fuente[i] === '}') nivel -= 1;
        if (!nivel) return fuente.slice(inicio, i + 1);
    }
    throw new Error('No se pudo extraer ' + nombre);
}

function centavos(valor) {
    return Math.round(Number(String(valor || '0').replace(/\./g, '').replace(',', '.')) * 100);
}

function probarResumenSinImputacion() {
    const campos = {
        cmpImporteTotalNC: { value: '0,00' }, cmpNeto: { value: '1.000,00' }, cmpIvaImporte: { value: '' },
        cmpOtros: { value: '24,56' }, cmpIvaPct: { value: '21' }, cmpSinImputar: { checked: true }, cmpTotal: { textContent: '' },
        cmpResumenNCTotal: { textContent: '' }, cmpResumenNCAplicado: { textContent: '' },
        cmpResumenNCDiferencia: { textContent: '' }
    };
    const sandbox = {
        porId: function (id) { return campos[id]; }, centavos,
        formatearCentavos: function (valor) { return (valor / 100).toFixed(2); },
        dinero: function (valor) { return '$ ' + valor.toFixed(2); },
        aplicacionesNotaCredito: function () { return []; },
        calcularComposicionNotaCredito: function () { return { neto: 0, iva: 0, otros: 0, total: 0 }; },
        ivaComprobanteFijo: null
    };
    vm.runInNewContext(funcion('actualizarResumenNotaCredito'), sandbox);
    const importes = sandbox.actualizarResumenNotaCredito();
    assert.strictEqual(importes.total, 123456, 'el crédito sin aplicaciones conserva el total ingresado');
    assert.strictEqual(importes.neto, 100000, 'el crédito conserva el neto ingresado');
    assert.strictEqual(importes.iva, 21000, 'el crédito calcula IVA según la alícuota elegida');
    assert.strictEqual(importes.otros, 2456, 'el crédito conserva otros impuestos');
    assert.strictEqual(importes.aplicado, 0);
    assert.strictEqual(campos.cmpTotal.textContent, '$ 1234.56');
    assert.strictEqual(campos.cmpImporteTotalNC.value, '1234.56');
}

async function probarEmisionSinImputacion() {
    const campos = {
        cmpError: { textContent: '' }, cmpTipoSeleccion: { value: 'C' },
        cmpFechaEmision: { value: '2026-10-27' }, cmpFechaVencimiento: { value: '' },
        cmpConcepto: { value: 'Ajuste comercial' }, cmpImporteTotalNC: { value: '1.234,56' },
        cmpLetra: { value: 'A' }, cmpSucursal: { value: '0001' }, cmpSinImputar: { checked: true },
        cmpNeto: { value: '1.000,00' }, cmpOtros: { value: '24,56' }, cmpIvaPct: { value: '21' }, cmpObservaciones: { value: '' }
    };
    let enviado;
    const sandbox = {
        comprobanteModo: 'credito', comprobanteTipo: 'C', comprobanteOperacion: 'clave-1',
        porId: function (id) { return campos[id]; },
        token: function () { return 'token'; },
        clienteComprobanteActual: function () { return { ClienteID: 8 }; },
        primerMontoInvalido: function () { return null; },
        camposAplicacionSeleccionados: function () { return []; },
        aplicacionesNotaCredito: function () { return []; },
        recalcularComprobante: function () { return { neto: 100000, iva: 21000, otros: 2456, total: 123456, aplicado: 0, importeSolicitado: 123456 }; },
        hoyIso: function () { return '2026-10-27'; },
        centavos,
        document: { querySelectorAll: function () { return []; } },
        apiPost: function (ruta, datos) { enviado = { ruta, datos }; return Promise.resolve({ Numero: 'C-A-0001-00000001' }); },
        cerrarModalYNotificar: function () {}, cargarCuenta: function () {},
        window: { SGTL: { procesando: function () { return function () {}; }, avisoFormulario: function () {}, marcarError: function () {} } }
    };
    vm.runInNewContext(funcion('emitirComprobante'), sandbox);
    await sandbox.emitirComprobante();
    assert.ok(enviado, 'debe enviar el crédito aunque no tenga aplicaciones');
    assert.strictEqual(enviado.ruta, '/comprobantes');
    assert.strictEqual(enviado.datos.Neto, 1000);
    assert.strictEqual(enviado.datos.IVA, 210);
    assert.strictEqual(enviado.datos.OtrosImpuestos, 24.56);
    assert.strictEqual(enviado.datos.IvaPct, 21);
    assert.deepStrictEqual(Array.from(enviado.datos.Aplicaciones), []);
}

async function probarClienteSinDeudas() {
    const clase = { add: function () {}, remove: function () {} };
    const campos = {
        cmpReferenciaGrupo: { classList: clase }, cmpAplicacionesGrupo: { classList: clase },
        cmpFacturasNC: { innerHTML: '' }, cmpSinImputar: { checked: false },
        cmpMensaje: { textContent: '' }, btnEmitirComprobante: { disabled: true }
    };
    const sandbox = {
        comprobanteModo: 'credito', comprobanteTipo: 'C', comprobanteOperacion: 'op-1',
        facturasReferencia: [], porId: function (id) { return campos[id]; },
        clienteComprobanteActual: function () { return { ClienteID: 8 }; },
        apiGet: function () { return Promise.resolve([]); }, centavos,
        actualizarOpcionCreditoSinImputar: function () {}, actualizarResumenNotaCredito: function () {}
    };
    vm.runInNewContext(funcion('cargarFacturasReferencia'), sandbox);
    await sandbox.cargarFacturasReferencia('credito', 8);
    assert.strictEqual(campos.cmpSinImputar.checked, true, 'sin deudas se propone emitir sin imputar');
    assert.strictEqual(campos.btnEmitirComprobante.disabled, false, 'sin deudas se permite continuar con el crédito');
}

async function probarFormularioDeImputacionPosterior() {
    assert.match(pagina, /id="modalImputarCredito"[^>]*data-bs-backdrop="static"/, 'la imputación posterior abre su propio formulario');
    assert.match(pagina, /id="imputarFecha"/, 'la imputación conserva la fecha elegida');
    assert.match(pagina, /id="imputarFacturas"/, 'la imputación muestra las deudas pendientes');
    assert.match(pagina, /id="btnGuardarImputacion"/, 'la imputación tiene una acción de guardar');
    assert.match(funcion('guardarImputacionCredito'), /apiPut\('\/comprobantes\/'[\s\S]*'\/aplicaciones'/,
        'la imputación se guarda en el crédito existente');
}

async function probarImportesAcumuladosYLimite() {
    const campos = {
        imputarError: { textContent: '' }, imputarFecha: { value: '2026-10-27' },
        modalImputarCredito: {}
    };
    const filas = [
        { id: 21, importe: '30,00', pendiente: 80, emision: '2026-10-01' },
        { id: 22, importe: '40,00', pendiente: 80, emision: '2026-10-02' }
    ].map(function (datos) {
        const campo = {
            value: datos.importe,
            getAttribute: function (nombre) {
                return { 'data-id': String(datos.id), 'data-pendiente-centavos': String(datos.pendiente * 100),
                    'data-emision': datos.emision }[nombre];
            }
        };
        return { querySelector: function (selector) {
            return selector === '.cc-imputar-check' ? { checked: true } : campo;
        } };
    });
    campos.imputarFacturas = { querySelectorAll: function () { return filas; } };
    let enviado;
    const avisos = [];
    const sandbox = {
        creditoImputando: { id: 9, clienteId: 1, saldoCentavos: 10000, aplicadoPorFactura: { 21: 2000 } },
        validadorImputacion: { validarTodo: function () { return true; } },
        porId: function (id) { return campos[id]; },
        leerMontoCentavos: centavos,
        apiPut: function (ruta, datos) { enviado = { ruta, datos }; return Promise.resolve({}); },
        cerrarModalYNotificar: function () {}, cargarCuenta: function () {},
        window: { SGTL: {
            avisoFormulario: function (_, texto) { avisos.push(texto); },
            marcarError: function () {}, limpiarError: function () {},
            procesando: function () { return function () {}; }
        } }
    };
    vm.runInNewContext(funcion('guardarImputacionCredito'), sandbox);
    await sandbox.guardarImputacionCredito();
    assert.strictEqual(enviado.ruta, '/comprobantes/9/aplicaciones');
    assert.strictEqual(enviado.datos.Fecha, '2026-10-27');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(enviado.datos.Aplicaciones)), [
        { ComprobanteID: 21, Importe: 50 }, { ComprobanteID: 22, Importe: 40 }
    ], 'se envía el total acumulado por deuda, conservando aplicaciones anteriores');

    enviado = null;
    sandbox.creditoImputando.saldoCentavos = 6000;
    sandbox.guardarImputacionCredito();
    assert.strictEqual(enviado, null, 'no se envía una imputación que supera el saldo disponible');
    assert.match(avisos[avisos.length - 1], /supera el saldo disponible/);
}

(async function () {
    probarResumenSinImputacion();
    await probarEmisionSinImputacion();
    await probarClienteSinDeudas();
    await probarFormularioDeImputacionPosterior();
    await probarImportesAcumuladosYLimite();
    console.log('OK: crédito interno sin imputar y formulario de imputación posterior');
})().catch(function (error) { console.error(error); process.exitCode = 1; });
