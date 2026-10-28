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
    assert.strictEqual(prueba.campos.sucursal.value, '0001', 'A usa su sucursal configurada desde la carga');
    assert.doesNotMatch(prueba.campos.sucursal.innerHTML, /value="0002"/, 'A no permite elegir la sucursal de B');
    prueba.campos.letra.value = 'B';
    prueba.eventosLetra.change();
    assert.strictEqual(prueba.campos.sucursal.value, '0002', 'B usa su sucursal configurada');
    assert.match(prueba.campos.sucursal.innerHTML, /value="0002"/, 'B ofrece su sucursal');
    assert.doesNotMatch(prueba.campos.sucursal.innerHTML, /value="0001"/, 'B no permite elegir la sucursal de A');
    assert.strictEqual(prueba.campos.numero.value, '00000009', 'B muestra el próximo número de su numerador');
    assert.match(prueba.campos.letra.innerHTML, /value="B"/, 'B está disponible para emitir');
}

async function probarCambioDeTipoReemplazaEventoDeLetra() {
    const eventosLetra = [];
    const campos = {
        tipo: { textContent: '' },
        letra: { innerHTML: '', value: '', disabled: false,
            addEventListener: function (evento, accion) { if (evento === 'change') eventosLetra.push(accion); },
            removeEventListener: function (evento, accion) {
                if (evento !== 'change') return;
                const indice = eventosLetra.indexOf(accion);
                if (indice >= 0) eventosLetra.splice(indice, 1);
            }
        },
        sucursal: { innerHTML: '', value: '' },
        numero: { value: '' }
    };
    const configuraciones = {
        FAC: {
            Tipo: 'FAC', Descripcion: 'Factura', LetraPredeterminada: 'A',
            SucursalPredeterminada: '0001', ProximoNumero: '00000003', Letras: ['A', 'B'],
            Configuraciones: [
                { Letra: 'A', SucursalPredeterminada: '0001', ProximoNumero: '00000003' },
                { Letra: 'B', SucursalPredeterminada: '0002', ProximoNumero: '00000009' }
            ]
        },
        FC: {
            Tipo: 'FC', Descripcion: 'Comprobante interno', LetraPredeterminada: 'A',
            SucursalPredeterminada: '0002', ProximoNumero: '00000018', Letras: ['A', 'B'],
            Configuraciones: [
                { Letra: 'A', SucursalPredeterminada: '0002', ProximoNumero: '00000018' },
                { Letra: 'B', SucursalPredeterminada: '0003', ProximoNumero: '00000022' }
            ]
        }
    };
    Object.keys(configuraciones).forEach(function (tipo) {
        configuraciones[tipo].Sucursales = [
            { Codigo: '0001', Nombre: 'Central' },
            { Codigo: '0002', Nombre: 'Sucursal B' },
            { Codigo: '0003', Nombre: 'Sucursal C' }
        ];
    });
    const sandbox = {
        window: {},
        document: { getElementById: function (id) { return campos[id]; } },
        localStorage: { getItem: function () { return 'token-de-prueba'; } },
        fetch: function (url) {
            const tipo = url.split('/').pop();
            return Promise.resolve({ ok: true, json: function () { return Promise.resolve(configuraciones[tipo]); } });
        }
    };
    vm.runInNewContext(fuente, sandbox, { filename: 'facturacion-configuracion.js' });
    const controles = { tipo: 'tipo', letra: 'letra', sucursal: 'sucursal', numero: 'numero' };
    await sandbox.window.ConfiguracionFacturacion.cargar('FAC', controles);
    await sandbox.window.ConfiguracionFacturacion.cargar('FC', controles);
    assert.strictEqual(eventosLetra.length, 1, 'al pasar de FAC a FC queda un solo evento de cambio');
    campos.letra.value = 'B';
    eventosLetra.forEach(function (accion) { accion(); });
    assert.strictEqual(campos.sucursal.value, '0003', 'FC B usa su sucursal propia');
    assert.doesNotMatch(campos.sucursal.innerHTML, /value="0002"/, 'FC B no ofrece sucursales de otras letras');
    assert.strictEqual(campos.numero.value, '00000022', 'FC B usa su numerador');
}

async function probarRespuestaTardiaNoReemplazaOtroFormulario() {
    const campos = {
        tipo: { textContent: '' },
        letra: { innerHTML: '', value: '', addEventListener: function () {}, removeEventListener: function () {} },
        sucursal: { innerHTML: '', value: '' },
        numero: { value: '' }
    };
    let resolverFc;
    let formularioActual = 'FC';
    function respuesta(tipo, descripcion, letra, numero) {
        return { ok: true, json: function () { return Promise.resolve({
            Tipo: tipo, Descripcion: descripcion, LetraPredeterminada: letra,
            SucursalPredeterminada: '0001', ProximoNumero: numero,
            Letras: [letra], Sucursales: [{ Codigo: '0001', Nombre: 'Casa central' }]
        }); } };
    }
    const sandbox = {
        window: {},
        document: { getElementById: function (id) { return campos[id]; } },
        localStorage: { getItem: function () { return 'token-de-prueba'; } },
        fetch: function (url) {
            if (url.endsWith('/FC')) return new Promise(function (resolve) { resolverFc = resolve; });
            return Promise.resolve(respuesta('NC', 'Nota de crédito', 'A', '00000004'));
        }
    };
    vm.runInNewContext(fuente, sandbox, { filename: 'facturacion-configuracion.js' });
    const controles = { tipo: 'tipo', letra: 'letra', sucursal: 'sucursal', numero: 'numero' };
    const cargaFc = sandbox.window.ConfiguracionFacturacion.cargar('FC', controles, function () {
        return formularioActual === 'FC';
    });
    formularioActual = 'NC';
    await sandbox.window.ConfiguracionFacturacion.cargar('NC', controles, function () {
        return formularioActual === 'NC';
    });
    resolverFc(respuesta('FC', 'Comprobante interno', 'B', '00000009'));
    await cargaFc;
    assert.strictEqual(campos.tipo.textContent, 'Nota de crédito', 'la respuesta FC tardía no pisa el formulario NC');
    assert.strictEqual(campos.letra.value, 'A');
    assert.strictEqual(campos.numero.value, '00000004');
}

probarDescripcionesDelCatalogo().then(probarDescripcionFaltante).then(probarConfiguracionPorLetra)
    .then(probarCambioDeTipoReemplazaEventoDeLetra)
    .then(probarRespuestaTardiaNoReemplazaOtroFormulario).then(function () {
    console.log('OK: tipos de comprobante y configuración de emisión por letra desde el catálogo');
}).catch(function (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
});
