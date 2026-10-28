const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'assets', 'static', 'js', 'cuenta-corriente-clientes.js'), 'utf8');

function funcion(nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.ok(inicio >= 0, 'Falta la función ' + nombre);
    const apertura = fuente.indexOf('{', inicio);
    let nivel = 0;
    for (let i = apertura; i < fuente.length; i += 1) {
        if (fuente[i] === '{') nivel += 1;
        if (fuente[i] === '}') nivel -= 1;
        if (nivel === 0) return fuente.slice(inicio, i + 1);
    }
    throw new Error('No se pudo leer la función ' + nombre);
}

function elemento() {
    return {
        value: '', textContent: '', innerHTML: '', disabled: false, readOnly: false,
        classList: { add() {}, remove() {}, toggle() {} },
        querySelectorAll() { return []; }
    };
}

async function probarEmisionInterna(accion, tipoElegido, descripcion, rutasCatalogo, solo = false) {
    const campos = {};
    const consultas = [];
    const configuraciones = [];
    const tipoAlternativo = tipoElegido === 'C' ? 'CR' : 'DE';
    const impacto = accion === 'Nota de crédito' ? 'C' : 'D';
    const tipos = (solo ? [] : [
        { Tipo: tipoAlternativo, Descripcion: 'Otro tipo interno', Impacto: impacto },
    ]).concat([{ Tipo: tipoElegido, Descripcion: descripcion, Impacto: impacto }]);
    const sandbox = {
        comprobanteModo: null,
        comprobanteTipo: null,
        comprobanteOperacion: null,
        facturasReferencia: [],
        ivaComprobanteFijo: null,
        vencimientoComprobanteEditado: false,
        porId(id) { return campos[id] || (campos[id] = elemento()); },
        apiGet(ruta) { consultas.push(ruta); return Promise.resolve(tipos); },
        agregarTiposFiltroCuenta() {},
        clienteActual() { return null; },
        clienteComprobanteActual() { return null; },
        nuevaClave() { return 'operacion-prueba'; },
        hoyIso() { return '2026-10-27'; },
        poblarClientesComprobante() {},
        ponerFecha() {},
        limitarFecha() {},
        actualizarVencimientoPredeterminado() {},
        recalcularComprobante() {},
        cargarFacturasReferencia() { return Promise.resolve(); },
        escapar(valor) { return String(valor); },
        textoError(error) { return error.message; },
        window: {
            SelectClientePredictivo: { establecerDeshabilitado() {} },
            SGTL: { avisoFormulario(campo, mensaje) { campo.textContent = mensaje; }, limpiarError() {} },
            ConfiguracionFacturacion: {
                cargar(tipo) { configuraciones.push(tipo); return Promise.resolve({ Tipo: tipo, Descripcion: descripcion }); }
            }
        },
        bootstrap: { Modal: { getOrCreateInstance() { return { show() {} }; } } },
        Promise
    };
    const funciones = [
        'cargarConfiguracionEmision', 'cargarTiposComprobanteDirecto', 'seleccionarTipoComprobanteDirecto',
        'nombreTipoComprobante', 'nombreAccionEmision', 'abrirNuevoComprobante', 'abrirAccionFutura'
    ];
    vm.runInNewContext(funciones.map(funcion).join('\n'), sandbox, { filename: 'cuenta-corriente-clientes.js' });

    sandbox.abrirAccionFutura(accion);
    await new Promise(resolve => setImmediate(resolve));

    assert.ok(consultas.some(ruta => rutasCatalogo.includes(ruta)),
        accion + ': al abrir debe consultar los tipos configurados para esta emisión');
    assert.ok(campos.cmpTipoSeleccion.innerHTML.includes('value="' + tipoElegido + '"'),
        accion + ': debe ofrecer el tipo interno activo ' + tipoElegido);
    assert.strictEqual(campos.cmpTipoSeleccion.value, tipoElegido,
        accion + ': debe preseleccionar el tipo interno aunque haya otros tipos activos');
    assert.deepStrictEqual(configuraciones, [tipoElegido],
        accion + ': debe cargar la configuración del tipo interno preseleccionado');

    if (!solo) {
        campos.cmpTipoSeleccion.value = tipoAlternativo;
        await sandbox.seleccionarTipoComprobanteDirecto();
        assert.deepStrictEqual(configuraciones, [tipoElegido, tipoAlternativo],
            accion + ': al cambiar el tipo debe consultar la configuración de la nueva sigla elegida');
    }
}

async function probarDebitoSinD(tipos, esperado) {
    const selector = { innerHTML: '', value: '' };
    const seleccionados = [];
    const sandbox = {
        comprobanteModo: 'debito', comprobanteOperacion: 'operacion',
        porId(id) { return id === 'cmpTipoSeleccion' ? selector : { disabled: true }; },
        apiGet(ruta) {
            assert.strictEqual(ruta, '/facturacion-config/tipos-emision-debito');
            return Promise.resolve(tipos);
        },
        agregarTiposFiltroCuenta() {}, escapar: String,
        seleccionarTipoComprobanteDirecto() { seleccionados.push(selector.value); return Promise.resolve(); },
        window: { SGTL: { avisoFormulario() {} } }, Promise
    };
    vm.runInNewContext(funcion('cargarTiposComprobanteDirecto'), sandbox);
    await sandbox.cargarTiposComprobanteDirecto();
    assert.strictEqual(selector.value, esperado);
    assert.deepStrictEqual(seleccionados, esperado ? [esperado] : [],
        'el débito no debe cargar como predeterminado un comprobante de deuda general');
}

(async function () {
    const resultados = await Promise.allSettled([
        probarEmisionInterna('Nota de crédito', 'C', 'Crédito interno', ['/facturacion-config/tipos-emision-credito']),
        probarEmisionInterna('Nota de débito', 'D', 'Débito interno', ['/facturacion-config/tipos-emision-debito']),
        probarEmisionInterna('Nota de crédito', 'CI', 'Crédito interno renombrado',
            ['/facturacion-config/tipos-emision-credito'], true),
        probarDebitoSinD([{ Tipo: 'FC', Descripcion: 'Comprobante interno', Impacto: 'D' }], ''),
        probarDebitoSinD([
            { Tipo: 'FC', Descripcion: 'Comprobante interno', Impacto: 'D' },
            { Tipo: 'ND', Descripcion: 'Nota de débito', Impacto: 'D' }
        ], 'ND')
    ]);
    const errores = resultados.filter(resultado => resultado.status === 'rejected').map(resultado => resultado.reason);
    if (errores.length) throw new AggregateError(errores, 'Falló la emisión interna configurable');
    console.log('OK: emisión directa de créditos y débitos internos configurados');
})().catch(error => {
    if (error instanceof AggregateError) error.errors.forEach(fallo => console.error(fallo.stack || fallo));
    else console.error(error.stack || error);
    process.exitCode = 1;
});
