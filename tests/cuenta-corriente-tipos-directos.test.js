const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const fuente = fs.readFileSync(path.join(raiz, 'assets/static/js/cuenta-corriente-clientes.js'), 'utf8');
const pagina = fs.readFileSync(path.join(raiz, 'cuenta-corriente-clientes.html'), 'utf8');

function extraerFuncion(nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.notStrictEqual(inicio, -1, 'falta ' + nombre);
    const apertura = fuente.indexOf('{', inicio);
    let nivel = 0;
    for (let i = apertura; i < fuente.length; i += 1) {
        if (fuente[i] === '{') nivel += 1;
        if (fuente[i] === '}') nivel -= 1;
        if (nivel === 0) return fuente.slice(inicio, i + 1);
    }
    throw new Error('No se pudo extraer ' + nombre);
}

async function probarSeleccionYEmision() {
    assert.match(pagina, /<label[^>]*for="cmpTipoSeleccion"[^>]*>Tipo de comprobante[\s\S]*?<span class="text-danger">\*<\/span>/,
        'la emisión directa exige elegir el tipo');
    assert.match(pagina, /<select[^>]*id="cmpTipoSeleccion"/,
        'el tipo de emisión directa es un desplegable');
    const campos = {
        cmpTipoSeleccion: { value: '', innerHTML: '', disabled: false },
        cmpTipoComprobante: { textContent: '' },
        cmpLetra: { innerHTML: '', value: '' },
        cmpSucursal: { innerHTML: '', value: '' },
        cmpNumeroComprobante: { value: '' },
        cmpError: { textContent: '' },
        btnEmitirComprobante: { disabled: true },
        ccTipo: {
            options: [{ value: '' }, { value: 'FAC' }, { value: 'REC' }, { value: 'NC' }, { value: 'ND' }],
            insertAdjacentHTML: function (_, html) {
                const valor = /value="([^"]+)"/.exec(html)[1];
                this.options.push({ value: valor });
            }
        }
    };
    const configuraciones = [];
    const solicitudes = [];
    const sandbox = {
        comprobanteTipo: null,
        comprobanteDirecto: true,
        comprobanteOperacion: 'operacion',
        porId: function (id) { return campos[id]; },
        escapar: function (valor) { return String(valor); },
        window: { SGTL: {
            avisoFormulario: function (campo, mensaje) { campo.textContent = mensaje; },
            limpiarError: function () {}
        } },
        apiGet: function (ruta) {
            solicitudes.push(ruta);
            return Promise.resolve([
                { Tipo: 'FAC', Descripcion: 'Factura', Impacto: 'D' },
                { Tipo: 'FC', Descripcion: 'Comprobante interno', Impacto: 'D' }
            ]);
        },
        cargarConfiguracionEmision: function (tipo) {
            configuraciones.push(tipo);
            campos.cmpTipoComprobante.textContent = tipo === 'FC' ? 'Comprobante interno' : 'Factura';
            return Promise.resolve();
        },
        Promise
    };
    vm.runInNewContext([
        extraerFuncion('agregarTiposFiltroCuenta'),
        extraerFuncion('cargarTiposComprobanteDirecto'),
        extraerFuncion('seleccionarTipoComprobanteDirecto')
    ].join('\n'), sandbox, { filename: 'cuenta-corriente-clientes.js' });

    await sandbox.cargarTiposComprobanteDirecto();
    assert.deepStrictEqual(solicitudes, ['/facturacion-config/tipos-emision-directa']);
    assert.match(campos.cmpTipoSeleccion.innerHTML, /value="FC"[^>]*>FC · Comprobante interno/,
        'FC activo debe poder elegirse con su descripción');
    assert.strictEqual(campos.cmpTipoSeleccion.value, '', 'la selección empieza vacía');
    assert.strictEqual(campos.btnEmitirComprobante.disabled, true, 'no se emite antes de elegir un tipo');
    assert.deepStrictEqual(configuraciones, [], 'abrir directo no consulta FAC sin que se elija');
    assert.ok(campos.ccTipo.options.some(function (opcion) { return opcion.value === 'FC'; }),
        'FC también puede filtrarse en la cuenta corriente');

    campos.cmpTipoSeleccion.value = 'FC';
    await sandbox.seleccionarTipoComprobanteDirecto();
    assert.strictEqual(sandbox.comprobanteTipo, 'FC');
    assert.deepStrictEqual(configuraciones, ['FC'], 'la configuración se consulta por el código elegido');
    assert.strictEqual(campos.btnEmitirComprobante.disabled, false);
    assert.strictEqual(campos.cmpTipoComprobante.textContent, 'Comprobante interno');

    Object.assign(campos, {
        cmpFechaEmision: { value: '2026-10-26' },
        cmpFechaVencimiento: { value: '2026-11-05' },
        cmpConcepto: { value: 'Servicio interno' },
        cmpNeto: { value: '100,00' },
        cmpOtros: { value: '0,00' },
        cmpIvaPct: { value: '21' },
        cmpObservaciones: { value: '' }
    });
    campos.cmpLetra.value = 'A';
    campos.cmpSucursal.value = '0001';
    const emisiones = [];
    const avisos = [];
    Object.assign(sandbox, {
        clienteComprobanteActual: function () { return { ClienteID: 5 }; },
        token: function () { return 'token'; },
        primerMontoInvalido: function () { return null; },
        recalcularComprobante: function () { return { neto: 10000, iva: 2100, otros: 0, total: 12100 }; },
        hoyIso: function () { return '2026-10-26'; },
        comprobanteOperacion: 'operacion',
        apiPost: function (ruta, cuerpo) {
            emisiones.push({ ruta, cuerpo });
            return Promise.resolve({ Numero: 'FC-A-0001-00000001' });
        },
        cerrarModalYNotificar: function (id, mensaje) { avisos.push({ id, mensaje }); },
        cargarCuenta: function () {},
        window: { SGTL: { procesando: function () { return function () {}; } } }
    });
    vm.runInNewContext(extraerFuncion('emitirComprobante'), sandbox, { filename: 'cuenta-corriente-clientes.js' });
    await sandbox.emitirComprobante();
    assert.strictEqual(emisiones.length, 1);
    assert.strictEqual(emisiones[0].ruta, '/comprobantes');
    assert.strictEqual(emisiones[0].cuerpo.Tipo, 'FC');
    assert.strictEqual(emisiones[0].cuerpo.Letra, 'A');
    assert.strictEqual(emisiones[0].cuerpo.Sucursal, '0001');
    assert.deepStrictEqual(avisos, [{ id: 'modalNuevoComprobante', mensaje: 'Comprobante emitido: FC-A-0001-00000001.' }]);
}

async function probarSinTiposActivos() {
    const campos = {
        cmpTipoSeleccion: { value: '', innerHTML: '' },
        btnEmitirComprobante: { disabled: true },
        cmpError: { textContent: '' },
        ccTipo: { options: [], insertAdjacentHTML: function () {} }
    };
    const sandbox = {
        comprobanteOperacion: 'operacion',
        comprobanteDirecto: true,
        porId: function (id) { return campos[id]; },
        apiGet: function () { return Promise.resolve([]); },
        escapar: String,
        window: { SGTL: { avisoFormulario: function (campo, mensaje) { campo.textContent = mensaje; } } },
        Promise
    };
    vm.runInNewContext(extraerFuncion('agregarTiposFiltroCuenta') + '\n' +
        extraerFuncion('cargarTiposComprobanteDirecto'), sandbox,
        { filename: 'cuenta-corriente-clientes.js' });
    await sandbox.cargarTiposComprobanteDirecto();
    assert.strictEqual(campos.btnEmitirComprobante.disabled, true);
    assert.match(campos.cmpError.textContent, /No hay tipos de comprobante de deuda activos/);
}

async function probarCatalogoTardioNoReemplazaOtroFormulario() {
    const campos = {
        ccTipo: { options: [], insertAdjacentHTML: function () {} },
        cmpTipoSeleccion: { innerHTML: 'Formulario de nota', value: 'NC' },
        btnEmitirComprobante: { disabled: false },
        cmpError: { textContent: '' }
    };
    let resolver;
    const sandbox = {
        comprobanteOperacion: 'directo', comprobanteDirecto: true,
        porId: function (id) { return campos[id]; },
        escapar: String,
        apiGet: function () { return new Promise(function (resolve) { resolver = resolve; }); },
        window: { SGTL: { avisoFormulario: function (campo, mensaje) { campo.textContent = mensaje; } } },
        Promise
    };
    vm.runInNewContext(extraerFuncion('agregarTiposFiltroCuenta') + '\n' +
        extraerFuncion('cargarTiposComprobanteDirecto'), sandbox,
        { filename: 'cuenta-corriente-clientes.js' });
    const carga = sandbox.cargarTiposComprobanteDirecto();
    sandbox.comprobanteOperacion = 'nota';
    sandbox.comprobanteDirecto = false;
    resolver([{ Tipo: 'FC', Descripcion: 'Comprobante interno', Impacto: 'D' }]);
    await carga;
    assert.strictEqual(campos.cmpTipoSeleccion.innerHTML, 'Formulario de nota');
    assert.strictEqual(campos.btnEmitirComprobante.disabled, false);
}

async function probarErrorCatalogoQuedaDentroDelModal() {
    const campos = {};
    function campo(id) {
        if (!campos[id]) campos[id] = {
            value: '', innerHTML: '', textContent: '', disabled: false,
            classList: { add: function () {}, remove: function () {}, toggle: function () {} },
            querySelectorAll: function () { return []; }
        };
        return campos[id];
    }
    let abierto = false;
    const sandbox = {
        porId: campo,
        clienteActual: function () { return null; },
        nuevaClave: function () { return 'operacion'; },
        hoyIso: function () { return '2026-10-26'; },
        poblarClientesComprobante: function () {},
        ponerFecha: function () {},
        limitarFecha: function () {},
        actualizarVencimientoPredeterminado: function () {},
        recalcularComprobante: function () {},
        cargarTiposComprobanteDirecto: function () { return Promise.reject(new Error('No se pudo cargar el catálogo.')); },
        textoError: function (error) { return error.message; },
        window: {
            SelectClientePredictivo: { establecerDeshabilitado: function () {} },
            SGTL: { avisoFormulario: function (control, mensaje) { control.textContent = mensaje; } }
        },
        bootstrap: { Modal: { getOrCreateInstance: function () { return { show: function () { abierto = true; } }; } } },
        Promise
    };
    vm.runInNewContext([
        extraerFuncion('nombreTipoComprobante'), extraerFuncion('nombreAccionEmision'),
        extraerFuncion('abrirNuevoComprobante')
    ].join('\n'), sandbox, { filename: 'cuenta-corriente-clientes.js' });
    await sandbox.abrirNuevoComprobante('FAC');
    assert.strictEqual(abierto, true, 'el formulario se abre aunque falle la carga de tipos');
    assert.strictEqual(campos.cmpError.textContent, 'No se pudo cargar el catálogo.');
    assert.strictEqual(campos.btnEmitirComprobante.disabled, true);
}

async function probarFiltroConTipoHistoricoInactivo() {
    const filtro = {
        options: [{ value: '' }, { value: 'FAC' }, { value: 'NC' }, { value: 'ND' }, { value: 'REC' }],
        insertAdjacentHTML: function (_, html) {
            this.options.push({ value: /value="([^"]+)"/.exec(html)[1] });
        }
    };
    const rutas = [];
    const sandbox = {
        inicializada: false,
        porId: function (id) {
            return id === 'ccTipo' ? filtro : { addEventListener: function () {} };
        },
        escapar: String,
        bootstrap: { Modal: { getOrCreateInstance: function () { return {}; } } },
        window: {},
        abrirVistaPreviaComprobante: function () {},
        limpiarVistaPreviaComprobante: function () {},
        enlazarEventos: function () {}, mostrarCarga: function () {},
        establecerRangoUltimos30Dias: function () {}, ponerFecha: function () {},
        hoyIso: function () { return '2026-10-26'; },
        cargarClientes: function () { return Promise.resolve(); },
        cargarCuenta: function () {}, mostrarError: function () {},
        apiGet: function (ruta) {
            rutas.push(ruta);
            return Promise.resolve([
                { Tipo: 'FAC', Descripcion: 'Factura', LetraPredeterminada: 'A', Activo: true },
                { Tipo: 'FAC', Descripcion: 'Factura', LetraPredeterminada: 'B', Activo: false },
                { Tipo: 'FC', Descripcion: 'Comprobante interno', LetraPredeterminada: 'A', Activo: false }
            ]);
        },
        Promise
    };
    vm.runInNewContext(extraerFuncion('agregarTiposFiltroCuenta') + '\n' +
        extraerFuncion('inicializar'), sandbox, { filename: 'cuenta-corriente-clientes.js' });
    sandbox.inicializar();
    await Promise.resolve();
    assert.deepStrictEqual(rutas, ['/facturacion-config/tipos-comprobante'],
        'el filtro consulta también tipos inactivos que conservan comprobantes históricos');
    assert.strictEqual(filtro.options.filter(function (opcion) { return opcion.value === 'FC'; }).length, 1);
    assert.strictEqual(filtro.options.filter(function (opcion) { return opcion.value === 'FAC'; }).length, 1,
        'las variantes A/B no duplican el código en el filtro');
}

async function probarAccionesYReciboDeFc() {
    const accion = [];
    const sandbox = {
        window: { SGTL: {
            botonFila: function (nombre, opciones) { return { nombre, deshabilitado: !!opciones.deshabilitado }; },
            accionesFila: function (botones) { return botones; }
        } },
        abrirComprobanteSoloLectura: function (id, tipo) { accion.push([id, tipo]); },
        abrirDetalle: function () { throw new Error('FC debe abrir el comprobante completo'); }
    };
    vm.runInNewContext([
        extraerFuncion('tipoComprobante'), extraerFuncion('estadoRecibo'),
        extraerFuncion('accionesComprobante'), extraerFuncion('verComprobante'),
        extraerFuncion('nombreTipoComprobante')
    ].join('\n'), sandbox, { filename: 'cuenta-corriente-clientes.js' });
    const item = { ComprobanteID: 7, Tipo: 'FC', Comprobante: 'FC-A-0001-00000001', EstadoComprobante: 'EMITIDO' };
    assert.strictEqual(sandbox.tipoComprobante(item), 'FC');
    assert.strictEqual(sandbox.nombreTipoComprobante('FC'), 'comprobante');
    const botones = sandbox.accionesComprobante(item);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(botones.map(function (boton) {
        return [boton.nombre, boton.deshabilitado];
    }))), [['ver', false], ['editar', true], ['pdf', false], ['enviar', false], ['anular', true]]);
    sandbox.verComprobante(7, 'FC');
    assert.deepStrictEqual(accion, [[7, 'FC']]);

    const reciboFacturas = { innerHTML: '', querySelectorAll: function () { return []; } };
    const recibo = {
        porId: function (id) { return id === 'reciboFacturas' ? reciboFacturas : {}; },
        clienteReciboActual: function () { return { ClienteID: 5 }; },
        apiGet: function () { return Promise.resolve([
            { ComprobanteID: 7, Tipo: 'FC', Comprobante: 'FC-A-0001-00000001', FechaVencimiento: '2026-11-05', ImporteOriginal: 121, SaldoPendiente: 121 },
            { ComprobanteID: 8, Tipo: 'REC', Comprobante: 'REC-X-0001-00000001', FechaVencimiento: '2026-11-05', ImporteOriginal: 50, SaldoPendiente: 50 }
        ]); },
        escapar: String,
        fecha: String,
        dinero: String,
        centavos: function (valor) { return Number(valor) * 100; },
        enlazarMascaraMonto: function () {},
        actualizarResumenRecibo: function () {},
        Promise
    };
    vm.runInNewContext(extraerFuncion('cargarFacturasRecibo'), recibo, { filename: 'cuenta-corriente-clientes.js' });
    await recibo.cargarFacturasRecibo();
    assert.match(reciboFacturas.innerHTML, /FC-A-0001-00000001/, 'FC con deuda se puede aplicar en el recibo');
    assert.doesNotMatch(reciboFacturas.innerHTML, /REC-X-0001-00000001/, 'el recibo sin imputar no es una deuda para aplicar');
}

(async function () {
    await probarSeleccionYEmision();
    await probarSinTiposActivos();
    await probarCatalogoTardioNoReemplazaOtroFormulario();
    await probarErrorCatalogoQuedaDentroDelModal();
    await probarFiltroConTipoHistoricoInactivo();
    await probarAccionesYReciboDeFc();
    console.log('OK: emisión directa con tipos activos y acceso a FC');
})().catch(function (error) {
    console.error(error);
    process.exitCode = 1;
});
