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
// Cambiar y corregir el galpón comparten GuardarGalponNuevo: ahí se pide el token.
const guardarGalponNuevo = api.slice(api.indexOf('private IHttpActionResult GuardarGalponNuevo('));
acciones.forEach(function (a) {
    const cuerpo = /return GuardarGalponNuevo\(/.test(a.cuerpo.split('\n').slice(0, 4).join('\n'))
        ? guardarGalponNuevo.slice(0, guardarGalponNuevo.indexOf('\n        }\n')) : a.cuerpo;
    assert.ok(/ValidarSesion\(db\)/.test(cuerpo), 'cada acción pide el token: ' + a.ruta);
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
// Cuándo (Rocío, 27/10, punto 33 de la §41): la regla está en Viajes/GastosDelViaje.cs, la misma para cargar y eliminar.
assert.ok(/GastosDelViaje\.MotivoChofer\("cargar"/.test(cargar) && /GastosDelViaje\.Guardar\(/.test(cargar), 'cargar: con la regla y las validaciones compartidas');
assert.ok(/GastosDelViaje\.MotivoChofer\("eliminar"/.test(hoja), 'eliminar: con la misma regla');
const reglaGastos = leer('WebApi_TransporteSanchez/Viajes/GastosDelViaje.cs');
assert.ok(/public const int DiasParaRendir = 2;/.test(reglaGastos) && /"el viaje todavía no se inició\."/.test(reglaGastos)
    && /"el viaje ya está facturado\."/.test(reglaGastos), 'desde que se inicia, hasta 2 días después de la entrega, nunca facturado');
assert.ok(/Completá los litros que cargaste/.test(reglaGastos), 'el combustible pide los litros');
assert.ok(/if \(estado == Entregado \|\| estado == ListoParaFacturar \|\| estado == SinCarga\) return null;/.test(reglaGastos),
    'administración: entregado, listo para facturar o sin carga (punto 10 de la §41)');
assert.ok(/Exigir\(sesion\.Tiene\("gestion de viajes"\)/.test(accion('Post', 'Viajes/{id:int}/Gastos')), 'administración: quien gestiona viajes');
assert.ok(leer('WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj').includes('Viajes\\GastosDelViaje.cs'), 'GastosDelViaje.cs está en el proyecto');

// Cambiar el galpón (Rocío, 27/10, punto 28 de la §41): cada viaje sale de su galpón (el elegido o el vigente el día de
// su inicio) y los km al galpón se guardan por galpón; los que ya salieron conservan el suyo.
assert.ok(/gx\.Galpon_ID = v\.GalponID OR \(v\.GalponID IS NULL AND \(gx\.Vigente_Desde IS NULL OR gx\.Vigente_Desde <= CAST\(v\.Fecha_Inicio AS date\)\)\)/.test(api),
    'el galpón del viaje: el elegido o el vigente el día de su inicio');
assert.ok(/SQL_GALPON_DEL_VIAJE \+ SQL_KM_GALPON_DEL_VIAJE/.test(accion('Get', 'Viajes/{id:int}')), 'el costo del viaje usa los km de su galpón');
assert.ok(/SQL_GALPON_DEL_VIAJE \+ SQL_KM_GALPON_DEL_VIAJE/.test(api.slice(api.indexOf('LeerKilometraje('))), 'el kilometraje del camión también');
assert.ok(/CostosController\.SQL_GALPON_DEL_VIAJE \+ CostosController\.SQL_KM_GALPON_DEL_VIAJE/.test(hoja), 'y la hoja de ruta');
const cambiar = guardarGalponNuevo.slice(0, guardarGalponNuevo.indexOf('\n        }\n'));
assert.ok(/return GuardarGalponNuevo\(null, body\)/.test(accion('Post', 'Galpones')), 'cambiar el galpón usa GuardarGalponNuevo');
assert.ok(/Exigir\(sesion\.EsAdmin/.test(cambiar) && /Del_Nuevo/.test(cambiar) && /Del_Actual/.test(cambiar), 'cambiar el galpón: solo administradores, con los viajes elegidos');
assert.ok(/WHERE v\.GalponID IS NULL AND CAST\(v\.Fecha_Inicio AS date\) >= @desde AND NOT \(" \+ SQL_NO_SALIO/.test(cambiar), 'los que ya salieron conservan el actual');
// Corregir o anular el galpón nuevo mientras no empezó (Rocío, 27/10).
assert.ok(/\[HttpPut, Route\("Galpones\/\{id:int\}"\)\]/.test(api) && /"No se puede corregir el galpón: ya empezó a usarse\."/.test(api), 'corregir: solo el que no empezó');
assert.ok(/Exigir\(sesion\.EsAdmin/.test(accion('Delete', 'Galpones/{id:int}')) && /"No se puede anular el cambio de galpón: ya empezó a usarse\."/.test(api)
    && /UPDATE dbo\.VIAJES SET GalponID = NULL WHERE GalponID = @id/.test(accion('Delete', 'Galpones/{id:int}')), 'anular: sus viajes vuelven al actual');
const pantallaGalpon = leer('gestion-empresa.html');
assert.ok(/data-galpon="corregir"/.test(pantallaGalpon) && /data-galpon="anular"/.test(pantallaGalpon) && /'¿Anular el cambio de galpón\?'/.test(pantallaGalpon),
    'Gestionar empresa: "Corregir galpón" y "Anular cambio" en el que viene');
assert.ok(/Del_Nuevo: viajesGalpon\.filter/.test(pantallaGalpon) && /Propuesto según la fecha de cada viaje\./.test(pantallaGalpon),
    'Gestionar empresa: la lista propuesta por la fecha (variante A)');
const galpones = leer('database/costos/02_galpones_por_fecha.sql');
assert.ok(/IF COL_LENGTH\('dbo\.GALPON', 'Vigente_Desde'\) IS NULL/.test(galpones) && /IF OBJECT_ID\(N'dbo\.GALPON_KM', N'U'\) IS NULL/.test(galpones)
    && /IF COL_LENGTH\('dbo\.VIAJES', 'GalponID'\) IS NULL/.test(galpones), '02 agrega lo que falta, sin repetirlo');

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
