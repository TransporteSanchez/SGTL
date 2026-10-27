const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'static', 'js', 'presupuestos.js'),
    'utf8'
);

function extraerFuncion(nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.notStrictEqual(inicio, -1, 'falta la funci\u00f3n ' + nombre);
    const apertura = fuente.indexOf('{', inicio);
    let nivel = 0;
    for (let indice = apertura; indice < fuente.length; indice += 1) {
        if (fuente[indice] === '{') nivel += 1;
        if (fuente[indice] === '}') nivel -= 1;
        if (nivel === 0) return fuente.slice(inicio, indice + 1);
    }
    throw new Error('no se pudo extraer la funci\u00f3n ' + nombre);
}

// Fecha y hora: un solo campo con calendario (§7.1, decisión de Rocío del 22/10); el tiempo estimado se calcula.
const sandbox = {};
vm.runInNewContext([
    extraerFuncion('duracionEstimada'),
    extraerFuncion('kilometrosRuta'),
    extraerFuncion('direccionUbicacion'),
    fuente.match(/var SIN_DIRECCION = '[^']*';/)[0],
    fuente.match(/var SIN_GOOGLE = '[^']*';/)[0],
    extraerFuncion('motivoRutaPresupuesto')
].join('\n'), sandbox, { filename: 'presupuestos.js' });

// En horas y minutos, no "02:45" (se leía como una hora del día; prueba mínima del 22/10).
assert.strictEqual(sandbox.duracionEstimada('2026-10-22T09:30', '2026-10-22T12:15'), '2 h 45 min',
    'debe mostrar la diferencia entre inicio y fin');
assert.strictEqual(sandbox.duracionEstimada('2026-10-22T23:30', '2026-10-24T01:00'), '25 h 30 min',
    'debe incluir los d\u00edas transcurridos en el total de horas');
assert.strictEqual(sandbox.duracionEstimada('2026-10-27T08:00', '2026-10-28T18:00'), '34 h',
    'sin minutos sueltos van solo las horas');
assert.strictEqual(sandbox.duracionEstimada('2026-10-27T08:00', '2026-10-27T08:45'), '45 min',
    'menos de una hora va en minutos');
assert.strictEqual(sandbox.duracionEstimada('2026-10-22T12:00', '2026-10-22T11:59'), '',
    'no debe calcular una duraci\u00f3n negativa');

assert.strictEqual(sandbox.kilometrosRuta({ routes: [{ legs: [
    { distance: { value: 12340 } },
    { distance: { value: 560 } }
] }] }), '12.9',
    'debe sumar todos los tramos de Google Maps y redondear a un decimal');
assert.strictEqual(sandbox.kilometrosRuta({ routes: [] }), '',
    'debe dejar la distancia vac\u00eda cuando Google no entrega una ruta');

// Sin la distancia de Google no se guarda (opción A): el mensaje dice qué hacer según por qué falló.
assert.match(sandbox.motivoRutaPresupuesto('NOT_FOUND'), /Corregí la dirección en Orígenes y destinos para poder guardar el presupuesto\./,
    'si Google no encuentra la dirección, hay que corregirla en Orígenes y destinos');
assert.match(sandbox.motivoRutaPresupuesto('ZERO_RESULTS'), /Orígenes y destinos/,
    'sin ruta posible también se corrige la dirección');
assert.match(sandbox.motivoRutaPresupuesto('OVER_QUERY_LIMIT'), /Probá de nuevo más tarde; sin la distancia no se puede guardar el presupuesto\./,
    'si falla Google, se prueba más tarde');
assert.match(fuente, /\{ id: 'distancia', requerido: '/,
    'la distancia es obligatoria para guardar, aun con tarifa fija');

assert.strictEqual(sandbox.direccionUbicacion({
    Calle: 'Av. Corrientes', AlturaCalle: '1234', NombreLocalidad: 'CABA', NombreProvincia: 'Buenos Aires'
}), 'Av. Corrientes 1234, CABA, Buenos Aires, Argentina',
    'debe enviar a Google una direcci\u00f3n completa de la ubicaci\u00f3n elegida');

// Lo que tarda el viaje según Google (Rocío, 27/10, punto 36 de la §41): google-maps.js, compartido con Registrar viaje.
const mapas = { Date: Date, Math: Math, String: String, isNaN: isNaN, document: {} };
mapas.window = mapas;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'static', 'js', 'google-maps.js'), 'utf8'), mapas, { filename: 'google-maps.js' });
const G = mapas.SGTLGoogleMaps;
assert.strictEqual(G.textoDuracion(3900), '1 h 5 min');
assert.strictEqual(G.textoDuracion(2700), '45 min');
assert.strictEqual(G.errorFin('2026-10-28 05:00', '2026-10-28 06:00', 3900),
    'Fin no permitido: tiene que ser a las 06:05 hs o después (Google estima 1 h 5 min de viaje).', 'el fin antes de lo que tarda: error debajo de Fin');
assert.strictEqual(G.errorFin('2026-10-28T05:00', '2026-10-28T06:05', 3900), '', 'justo o más tiempo: no se pide nada');
assert.strictEqual(G.errorFin('2026-10-28 22:00', '2026-10-29 02:00', 6 * 3600),
    'Fin no permitido: tiene que ser el 29/10/2026 a las 04:00 hs o después (Google estima 6 h de viaje).', 'si llega otro día, con la fecha');
assert.strictEqual(G.errorFin('2026-10-28 05:00', '2026-10-28 05:30', null), '', 'sin la ruta de Google (km a mano), no hay control');
assert.ok(/SGTLGoogleMaps\.errorFin\(el\('fechaInicio'\)\.value, valor, segundosRuta\)/.test(fuente), 'presupuestos controla el fin');
assert.ok(/SGTLGoogleMaps\.errorFin\(fi, valor, segundosRuta\)/.test(fs.readFileSync(path.join(__dirname, '..', 'gestion-viajes.html'), 'utf8')),
    'Registrar viaje también');

const distancia = { value: '' };
let mensajeMapa = '';
let tarifaSolicitada = false;
let finRevisado = false;
const sandboxRuta = {
    el: function (id) { return id === 'distancia' ? distancia : null; },
    kilometrosRuta: sandbox.kilometrosRuta,
    actualizarMensajeMapa: function (texto) { mensajeMapa = texto; },
    solicitarCalculo: function () { tarifaSolicitada = true; },
    revisarFin: function () { finRevisado = true; },
    segundosRuta: null,
    SGTLGoogleMaps: G,
    SGTL: { km: function (valor) { return String(valor).replace('.', ','); } }
};
vm.runInNewContext(extraerFuncion('aplicarRutaPresupuesto'), sandboxRuta, { filename: 'presupuestos.js' });
sandboxRuta.aplicarRutaPresupuesto({ routes: [{ legs: [
    { distance: { value: 10000 }, duration: { value: 1800 }, start_address: 'Rosario' },
    { distance: { value: 2500 }, duration: { value: 900 }, end_address: 'CABA' }
] }] });
assert.match(mensajeMapa, /Google estima 45 min de viaje/, 'la duración de Google junto a los km');
assert.strictEqual(sandboxRuta.segundosRuta, 2700);
assert.strictEqual(finRevisado, true, 'con la ruta nueva, el fin se vuelve a controlar');
assert.strictEqual(distancia.value, '12.5',
    'la distancia que devuelve Google debe completar el campo del presupuesto');
assert.match(mensajeMapa, /12,5 km/,
    'el mapa debe informar los kil\u00f3metros calculados con coma decimal (SGTL.km)');
assert.strictEqual(tarifaSolicitada, true,
    'el cambio de distancia debe actualizar la tarifa por kil\u00f3metro');

console.log('OK: horarios y distancia autom\u00e1tica de presupuestos');
