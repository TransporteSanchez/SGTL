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

const sandbox = {};
vm.runInNewContext([
    extraerFuncion('mascaraHora'),
    extraerFuncion('horaValida'),
    extraerFuncion('combinarFechaYHora'),
    extraerFuncion('duracionEstimada'),
    extraerFuncion('kilometrosRuta'),
    extraerFuncion('direccionUbicacion'),
    extraerFuncion('distanciaCalculadaValida'),
    extraerFuncion('validarDatosPresupuesto')
].join('\n'), sandbox, { filename: 'presupuestos.js' });

assert.strictEqual(sandbox.mascaraHora('0930'), '09:30',
    'la m\u00e1scara debe insertar los dos puntos sin impedir la carga manual');
assert.strictEqual(sandbox.mascaraHora('12345'), '12:34',
    'la m\u00e1scara debe conservar solo cuatro d\u00edgitos');
assert.strictEqual(sandbox.horaValida('09:30'), true,
    'una hora HH:mm v\u00e1lida debe aceptarse');
assert.strictEqual(sandbox.horaValida('24:00'), false,
    'no debe aceptar horas fuera del rango de 00 a 23');

assert.strictEqual(sandbox.combinarFechaYHora('2026-10-22', '09:30'), '2026-10-22T09:30',
    'debe conservar fecha y hora local en el formato que recibe la API');
assert.strictEqual(sandbox.combinarFechaYHora('2026-10-22', '29:00'), '',
    'no debe construir una fecha con una hora inv\u00e1lida');

assert.strictEqual(sandbox.duracionEstimada('2026-10-22T09:30', '2026-10-22T12:15'), '02:45',
    'debe mostrar la diferencia entre inicio y fin');
assert.strictEqual(sandbox.duracionEstimada('2026-10-22T23:30', '2026-10-24T01:00'), '25:30',
    'debe incluir los d\u00edas transcurridos en el total de horas');
assert.strictEqual(sandbox.duracionEstimada('2026-10-22T12:00', '2026-10-22T11:59'), '',
    'no debe calcular una duraci\u00f3n negativa');

assert.strictEqual(sandbox.kilometrosRuta({ routes: [{ legs: [
    { distance: { value: 12340 } },
    { distance: { value: 560 } }
] }] }), '12.9',
    'debe sumar todos los tramos de Google Maps y redondear a un decimal');
assert.strictEqual(sandbox.kilometrosRuta({ routes: [] }), '',
    'debe dejar la distancia vac\u00eda cuando Google no entrega una ruta');
assert.strictEqual(sandbox.distanciaCalculadaValida('12.5'), true,
    'debe reconocer una distancia calculada por Google Maps');
assert.strictEqual(sandbox.distanciaCalculadaValida(''), false,
    'no debe permitir guardar cuando Google no pudo calcular la distancia');
assert.strictEqual(sandbox.distanciaCalculadaValida('0'), false,
    'no debe aceptar una distancia nula aunque exista tarifa fija');
assert.strictEqual(sandbox.validarDatosPresupuesto('2026-10-22T09:00', '2026-10-22T10:00', ''),
    'Esperá el cálculo de la distancia con Google Maps antes de guardar.',
    'debe bloquear el guardado aun cuando la tarifa fija esté disponible');
assert.strictEqual(sandbox.validarDatosPresupuesto('2026-10-22T09:00', '2026-10-22T10:00', '12.5'), '',
    'debe permitir continuar cuando horario y distancia están completos');

assert.strictEqual(sandbox.direccionUbicacion({
    Calle: 'Av. Corrientes', AlturaCalle: '1234', NombreLocalidad: 'CABA', NombreProvincia: 'Buenos Aires'
}), 'Av. Corrientes 1234, CABA, Buenos Aires, Argentina',
    'debe enviar a Google una direcci\u00f3n completa de la ubicaci\u00f3n elegida');

const distancia = { value: '' };
let mensajeMapa = '';
let tarifaSolicitada = false;
const sandboxRuta = {
    el: function (id) { return id === 'distancia' ? distancia : null; },
    kilometrosRuta: sandbox.kilometrosRuta,
    actualizarMensajeMapa: function (texto) { mensajeMapa = texto; },
    solicitarCalculo: function () { tarifaSolicitada = true; }
};
vm.runInNewContext(extraerFuncion('aplicarRutaPresupuesto'), sandboxRuta, { filename: 'presupuestos.js' });
sandboxRuta.aplicarRutaPresupuesto({ routes: [{ legs: [
    { distance: { value: 10000 }, start_address: 'Rosario' },
    { distance: { value: 2500 }, end_address: 'CABA' }
] }] });
assert.strictEqual(distancia.value, '12.5',
    'la distancia que devuelve Google debe completar el campo del presupuesto');
assert.match(mensajeMapa, /12\.5 km/,
    'el mapa debe informar los kil\u00f3metros calculados');
assert.strictEqual(tarifaSolicitada, true,
    'el cambio de distancia debe actualizar la tarifa por kil\u00f3metro');

console.log('OK: horarios y distancia autom\u00e1tica de presupuestos');
