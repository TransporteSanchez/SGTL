const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'assets', 'static', 'js', 'facturacion-configuracion.js'), 'utf8');

async function cargar(tipo, descripcion, controlTipo) {
    const campos = {
        tipo: controlTipo,
        letra: { innerHTML: '', disabled: false },
        sucursal: { innerHTML: '' },
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
                    Letras: tipo === 'REC' ? ['X'] : ['A', 'B'],
                    Sucursales: [{ Codigo: '0001', Nombre: 'Casa central' }]
                }); }
            });
        }
    };
    vm.runInNewContext(fuente, sandbox, { filename: 'facturacion-configuracion.js' });
    const promesa = sandbox.window.ConfiguracionFacturacion.cargar(tipo, {
        tipo: 'tipo', letra: 'letra', sucursal: 'sucursal', numero: 'numero'
    });
    return { promesa: promesa, campos: campos, urls: urls };
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

probarDescripcionesDelCatalogo().then(probarDescripcionFaltante).then(function () {
    console.log('OK: descripciones de tipos de comprobante desde el catálogo');
}).catch(function (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
});
