const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'assets', 'static', 'js', 'facturacion-configuracion.js'), 'utf8');

async function cargar(tipo, descripcion, controlTipo, configuraciones) {
    const eventosLetra = {};
    const campos = {
        tipo: controlTipo,
        letra: { innerHTML: '', disabled: false, value: 'A',
            addEventListener: function (evento, accion) { eventosLetra[evento] = accion; },
            removeEventListener: function (evento, accion) { if (eventosLetra[evento] === accion) delete eventosLetra[evento]; }
        },
        sucursal: { innerHTML: '', value: '' },
        numero: { value: '', readOnly: false }
    };
    const urls = [];
    const sandbox = {
        window: {},
        document: { getElementById: function (id) { return campos[id] || null; } },
        localStorage: { getItem: function () { return 'token-de-prueba'; } },
        fetch: function (url) {
            urls.push(url);
            return Promise.resolve({
                ok: true,
                json: function () { return Promise.resolve({
                    Tipo: tipo,
                    Descripcion: descripcion,
                    LetraPredeterminada: tipo === 'REC' ? 'X' : 'A',
                    SucursalPredeterminada: '0001',
                    ProximoNumero: '00000003',
                    Letras: configuraciones ? configuraciones.map(function (c) { return c.Letra; }) : (tipo === 'REC' ? ['X'] : ['A', 'B']),
                    Configuraciones: configuraciones,
                    Sucursales: [{ Codigo: '0001', Nombre: 'Casa central' }, { Codigo: '0002', Nombre: 'Sucursal B' }]
                }); }
            });
        }
    };
    vm.runInNewContext(fuente, sandbox, { filename: 'facturacion-configuracion.js' });
    const promesa = sandbox.window.ConfiguracionFacturacion.cargar(tipo, {
        tipo: 'tipo', letra: 'letra', sucursal: 'sucursal', numero: 'numero'
    });
    return { promesa: promesa, campos: campos, urls: urls, eventosLetra: eventosLetra };
}

async function probarDescripcionesDelCatalogo() {
    const casos = [
        ['FAC', 'Factura logística'],
        ['NC', 'Crédito por ajuste'],
        ['ND', 'Débito por servicio'],
        ['REC', 'Recibo de cobranza']
    ];
    for (const [tipo, descripcion] of casos) {
        const control = { textContent: 'Valor anterior' };
        const prueba = await cargar(tipo, descripcion, control);
        await prueba.promesa;
        assert.strictEqual(control.textContent, descripcion,
            tipo + ': el formulario debe mostrar la descripción devuelta por TIPOS_COMPROBANTE');
        assert.strictEqual(prueba.urls[0], 'http://localhost:50222/api/facturacion-config/emision/' + tipo);
    }

    const inputProforma = { value: 'Valor anterior' };
    const proforma = await cargar('FAC', 'Factura desde catálogo', inputProforma);
    await proforma.promesa;
    assert.strictEqual(inputProforma.value, 'Factura desde catálogo',
        'el mismo cargador también debe actualizar el campo de la proforma');
}

async function probarDescripcionFaltante() {
    const control = { textContent: '' };
    const prueba = await cargar('REC', '   ', control);
    await assert.rejects(prueba.promesa, /No se pudo cargar el tipo de comprobante/,
        'sin descripción del catálogo no debe mostrarse un nombre fijo');
    assert.strictEqual(control.textContent, '');
}

async function probarConfiguracionPorLetra() {
    const prueba = await cargar('FAC', 'Factura logística', { textContent: '' }, [
        { Letra: 'A', SucursalPredeterminada: '0001', ProximoNumero: '00000003' },
        { Letra: 'B', SucursalPredeterminada: '0002', ProximoNumero: '00000009' }
    ]);
    await prueba.promesa;
    assert.ok(prueba.eventosLetra.change, 'la letra permite actualizar su configuración');
    prueba.campos.letra.value = 'B';
    prueba.eventosLetra.change();
    assert.strictEqual(prueba.campos.sucursal.value, '0002', 'B usa su sucursal configurada');
    assert.strictEqual(prueba.campos.numero.value, '00000009', 'B muestra el próximo número de su numerador');
    assert.match(prueba.campos.letra.innerHTML, /value="B"/, 'B está disponible para emitir');
}

probarDescripcionesDelCatalogo().then(probarDescripcionFaltante).then(probarConfiguracionPorLetra).then(function () {
    console.log('OK: tipos de comprobante y configuración de emisión por letra desde el catálogo');
}).catch(function (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
});
