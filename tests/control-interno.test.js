// Control interno de los viajes (24/10): recorrido completo, kilometraje, combustible estimado y gastos del chofer.
// Que todo pida el token y el permiso que corresponde, que el margen se calcule bien y que las pantallas carguen lo suyo.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const leer = function (archivo) { return fs.readFileSync(path.join(raiz, archivo), 'utf8'); };

// ---------------------------------------------------------------- API (CostosController.cs)

const api = leer('WebApi_TransporteSanchez/Controllers/CostosController.cs');
const acciones = api.split('[Http').slice(1).map(function (texto) {
    return { ruta: (/Route\("([^"]*)"\)/.exec(texto) || [])[1], cuerpo: texto.slice(0, texto.indexOf('\n        }\n')) };
});
assert.ok(acciones.length >= 10, 'debe poder leerse cada acción de CostosController');
acciones.forEach(function (a) {
    assert.ok(/ValidarSesion\(db\)/.test(a.cuerpo), 'cada acción pide el token: ' + a.ruta);
});
function accion(metodo, ruta) {
    const a = api.split('[Http').slice(1).filter(function (texto) {
        return texto.indexOf(metodo) === 0 && texto.indexOf('Route("' + ruta + '")') !== -1;
    })[0];
    assert.ok(a, 'existe ' + metodo + ' ' + ruta);
    return a.slice(0, a.indexOf('\n        }\n'));
}
assert.ok(/Exigir\(sesion\.EsAdmin/.test(accion('Put', 'Galpon')), 'el galpón lo cambia solo un administrador');
assert.ok(/Tiene\("gestion de camiones"\)/.test(accion('Post', 'Gasoil')), 'el gasoil: administradores o Gestión de camiones');
assert.ok(/Tiene\("gestion de camiones"\)/.test(accion('Put', 'Camiones/Kilometraje')), 'el kilometraje: administradores o Gestión de camiones');
assert.ok(/Tiene\("listado de viajes", "gestion de viajes"\)/.test(accion('Get', 'Viajes/{id:int}')), 'el costo de un viaje: permiso de viajes');
assert.ok(/Tiene\("listado de viajes", "gestion de viajes"\)/.test(accion('Get', 'Gastos/{id:int}/Comprobante')), 'los tickets: permiso de viajes');
assert.ok(/UPDATE dbo\.ORIGEN SET Km_Galpon = NULL/.test(accion('Put', 'Galpon')), 'si cambia el galpón, los km al galpón se recalculan');
assert.ok(leer('WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj').includes('Controllers\\CostosController.cs'),
    'CostosController tiene que estar en el proyecto para compilarse');

// Los gastos del chofer: en HojaDeRutaController, con el chofer del token.
const hoja = leer('WebApi_TransporteSanchez/Controllers/HojaDeRutaController.cs');
const cargar = hoja.slice(hoja.indexOf('public IHttpActionResult CargarGasto('), hoja.indexOf('public IHttpActionResult EliminarGasto('));
assert.ok(/ViajeDelChofer\(db, ChoferDe\(sesion\), id\)/.test(cargar), 'el gasto va en un viaje del chofer de la sesión');
assert.ok(/EstadoFacturado/.test(cargar) && /todavía no empezó/.test(cargar), 'no en un viaje facturado ni antes de que empiece');
assert.ok(/Completá los litros que cargaste/.test(cargar), 'el combustible pide los litros');

// ---------------------------------------------------------------- Base

const script = leer('database/costos/01_galpon_kilometraje_y_gastos.sql');
['dbo.GALPON', "'dbo.ORIGEN', 'Km_Galpon'", "'dbo.DESTINO', 'Km_Galpon'", "'dbo.CAMIONES', 'Km_Inicial'", "'dbo.CAMIONES', 'Consumo_L_100km'",
    'dbo.PRECIOS_GASOIL', 'dbo.VIAJE_GASTOS'].forEach(function (objeto) {
    assert.ok(script.includes(objeto), 'el script crea ' + objeto);
});
assert.ok(/DECLARE @Aplicar bit = 0/.test(script), 'el script arranca en diagnóstico');

// ---------------------------------------------------------------- Margen estimado (costos-viaje.js)

const sandbox = { Math: Math, Number: Number, String: String, document: {} };
sandbox.window = sandbox;
vm.runInNewContext(leer('assets/static/js/costos-viaje.js'), sandbox, { filename: 'costos-viaje.js' });
const margen = sandbox.SGTLCostosViaje.calcularMargen;
assert.strictEqual(margen({
    Importe: 1450000, Combustible_Estimado: 360625,
    Gastos: [{ Tipo: 'Combustible', Importe: 120000 }, { Tipo: 'Peaje', Importe: 3500 }]
}), 1085875, 'importe − combustible estimado − los otros gastos (el combustible rendido no se resta dos veces)');
assert.strictEqual(margen({ Importe: null, Combustible_Estimado: 1000, Gastos: [] }), null, 'sin importe no hay margen');
assert.strictEqual(margen({ Importe: 1000, Combustible_Estimado: null, Gastos: [] }), null, 'sin combustible estimado no hay margen');

// ---------------------------------------------------------------- Pantallas

const detalle = leer('assets/static/js/viaje-detalle.js');
assert.ok(detalle.includes('id="verViajeCosto"') && detalle.includes('costos-viaje.js') && detalle.includes('galpon-km.js'),
    'Ver detalle del viaje muestra el recorrido completo y el costo (y carga solo lo que necesita)');
const empresa = leer('gestion-empresa.html');
assert.ok(empresa.includes('id="formGalpon"') && empresa.includes('galpon-km.js') && empresa.includes('google-maps.js'),
    'Gestionar empresa tiene el galpón y recalcula los km al galpón');
const camiones = leer('gestion-camiones.html');
assert.ok(camiones.includes('id="camionKmInicial"') && camiones.includes('id="modalGasoil"'), 'Gestionar camiones: kilometraje, consumo y gasoil');
assert.ok(leer('listado-camiones.html').includes('id="detalleKilometraje"'), 'Ver detalle del camión: el kilometraje de hoy');

console.log('OK: el control interno pide el token y el permiso que corresponde, y el margen se calcula bien');
