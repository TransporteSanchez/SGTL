const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const fuentePdf = fs.readFileSync(path.join(raiz, 'assets', 'static', 'js', 'factura-pdf.js'), 'utf8');
const fuenteCuenta = fs.readFileSync(path.join(raiz, 'assets', 'static', 'js', 'cuenta-corriente-clientes.js'), 'utf8');

function extraerFuncion(fuente, nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.notStrictEqual(inicio, -1, 'falta la funciÃ³n ' + nombre);
    const apertura = fuente.indexOf('{', inicio);
    let nivel = 0;
    for (let i = apertura; i < fuente.length; i += 1) {
        if (fuente[i] === '{') nivel += 1;
        if (fuente[i] === '}') nivel -= 1;
        if (nivel === 0) return fuente.slice(inicio, i + 1);
    }
    throw new Error('no se pudo extraer ' + nombre);
}

function crearClase() {
    const clases = {};
    return {
        add: function (nombre) { clases[nombre] = true; },
        remove: function (nombre) { delete clases[nombre]; },
        contains: function (nombre) { return !!clases[nombre]; }
    };
}

function crearCampo() {
    return {
        textContent: '', href: '', download: '', src: '', title: '', disabled: false,
        style: { display: '' }, classList: crearClase(),
        atributos: {}, contentWindow: { focus: function () {}, print: function () {} },
        removeAttribute: function (nombre) { delete this.atributos[nombre]; if (nombre === 'src') this.src = ''; },
        setAttribute: function (nombre, valor) { this.atributos[nombre] = valor; },
        getAttribute: function (nombre) { return this.atributos[nombre]; }
    };
}

function probarComprobantesConProformasSinDetalle() {
    const sandbox = {};
    vm.runInNewContext(
        extraerFuncion(fuentePdf, 'texto') + '\n' + extraerFuncion(fuentePdf, 'proformasFactura') + '\n' + extraerFuncion(fuentePdf, 'contenidoImpresionComprobante'),
        sandbox,
        { filename: 'factura-pdf.js' });

    const contenido = sandbox.contenidoImpresionComprobante({
        Tipo: 'FAC',
        Proformas: [{ Numero: 'PF-00000018' }, { Numero: 'PF-00000003' }],
        Detalle: [{ Concepto: 'Viaje 123' }]
    });

    assert.strictEqual(contenido.tipo, 'proformas',
        'la Factura debe reemplazar el detalle de viajes por las Proformas relacionadas');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(contenido.lineas)), ['PF-00000018', 'PF-00000003'],
        'la Factura debe incluir todas las Proformas vinculadas, respetando sus nÃºmeros');
    assert.ok(!Object.prototype.hasOwnProperty.call(contenido, 'filas'),
        'el contenido de la Factura no debe exponer filas de detalle de viajes');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(sandbox.proformasFactura({ Tipo: 'FAC', ProformaNumero: 'PF-00000009' }))), ['PF-00000009'],
        'las Facturas histÃ³ricas con un Ãºnico vÃ­nculo deben seguir mostrando su Proforma');
    const interno = sandbox.contenidoImpresionComprobante({
        Tipo: 'FC', Proformas: [{ Numero: 'PF-00000057' }],
        Detalle: [{ Concepto: 'Viaje 57' }]
    });
    assert.strictEqual(interno.tipo, 'proformas',
        'un comprobante interno vinculado debe mostrar proformas en lugar del detalle de viajes');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(interno.lineas)), ['PF-00000057']);

    const otroTipo = sandbox.contenidoImpresionComprobante({
        Tipo: 'FZ', ProformaNumero: 'PF-00000058', Detalle: [{ Concepto: 'Viaje 58' }]
    });
    assert.strictEqual(otroTipo.tipo, 'proformas',
        'otro tipo configurable vinculado debe conservar el bloque de proformas');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(otroTipo.lineas)), ['PF-00000058']);

    assert.strictEqual(sandbox.contenidoImpresionComprobante({
        Tipo: 'FC', Proformas: [], Detalle: [{ Concepto: 'Servicio directo' }]
    }).tipo, 'detalle', 'un FC directo debe seguir mostrando sus conceptos');
}

async function probarVistaPreviaSinPestanaNueva() {
    const campos = {
        vistaPreviaComprobanteDocumento: crearCampo(),
        descargarVistaPreviaComprobante: crearCampo(),
        imprimirVistaPreviaComprobante: crearCampo(),
        tituloVistaPreviaComprobante: crearCampo(),
        vistaPreviaComprobanteFeedback: crearCampo()
    };
    let modalAbierto = false;
    let urlRevocada = null;
    const sandbox = {
        secuenciaVistaPreviaComprobante: 0,
        urlVistaPreviaComprobante: 'blob:anterior',
        modalVistaPreviaComprobante: { show: function () { modalAbierto = true; } },
        idVistaPreviaComprobante: null,
        buscarComprobante: function (id) { return id === 41 ? { Comprobante: 'FAC-00000041' } : null; },
        porId: function (id) { return campos[id]; },
        URL: {
            createObjectURL: function () { return 'blob:comprobante'; },
            revokeObjectURL: function (url) { urlRevocada = url; }
        },
        window: {
            prepararComprobantePDF: function (id) {
                assert.strictEqual(id, 41, 'debe preparar el comprobante solicitado');
                return Promise.resolve({ blob: { tipo: 'pdf' }, nombreArchivo: 'Factura_FAC-00000041.pdf' });
            }
        }
    };
    vm.runInNewContext(extraerFuncion(fuenteCuenta, 'abrirVistaPreviaComprobante'), sandbox,
        { filename: 'cuenta-corriente-clientes.js' });

    await sandbox.abrirVistaPreviaComprobante(41);

    assert.strictEqual(campos.tituloVistaPreviaComprobante.textContent, 'Ver PDF del comprobante FAC-00000041',
        'el visor se titula como Ver PDF en presupuestos');
    assert.ok(modalAbierto, 'Imprimir debe abrir el visor dentro de la aplicaciÃ³n');
    assert.strictEqual(urlRevocada, 'blob:anterior', 'debe liberar una vista previa anterior');
    assert.strictEqual(campos.vistaPreviaComprobanteDocumento.src, 'blob:comprobante',
        'el visor debe recibir el PDF generado');
    assert.strictEqual(campos.descargarVistaPreviaComprobante.href, 'blob:comprobante',
        'la descarga debe quedar disponible desde el visor');
    assert.strictEqual(campos.descargarVistaPreviaComprobante.download, 'Factura_FAC-00000041.pdf',
        'la descarga debe conservar el nombre del comprobante');
    assert.strictEqual(typeof campos.vistaPreviaComprobanteDocumento.onload, 'function',
        'el visor debe esperar a que el PDF cargue antes de habilitar la impresiÃ³n');
    campos.vistaPreviaComprobanteDocumento.onload();
    assert.ok(!campos.imprimirVistaPreviaComprobante.disabled,
        'el botÃ³n Imprimir debe habilitarse cuando el visor carga el PDF');
}

async function ejecutar() {
    probarComprobantesConProformasSinDetalle();
    await probarVistaPreviaSinPestanaNueva();
    console.log('OK: impresiÃ³n de comprobantes sin pestaÃ±a nueva y Facturas por Proforma');
}

ejecutar().catch(function (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
});
