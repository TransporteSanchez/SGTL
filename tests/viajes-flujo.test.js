// Flujo de los viajes (punto 22 de la §41, docs/diseno/viajes-diseno.md): los huecos corregidos el 27/10.
//   A. La fecha de entrega no puede ser posterior a hoy.
//   B. Un viaje con gastos del chofer no se elimina (antes daba un error técnico).
//   C. La evidencia es de la entrega: en un directo, desde que salió; con plataforma, desde el día del viaje.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const leer = function (archivo) { return fs.readFileSync(path.join(__dirname, '..', archivo), 'utf8'); };
const api = leer('WebApi_TransporteSanchez/Controllers/ViajesController.cs');
const pantalla = leer('gestion-viajes.html');

// A
assert.ok(/fechaEntrega\.Value\.Date > hoy/.test(api) && /"La fecha de entrega no puede ser posterior a hoy\."/.test(api), 'A: la API no acepta una entrega futura');
assert.ok(/fecha > SGTL\.fechaISO\(new Date\(\)\) \? 'No puede ser posterior a hoy\.'/.test(pantalla), 'A: Estado y entrega lo marca debajo de la fecha');
assert.ok(/fecha > SGTL\.fechaISO\(new Date\(\)\)\) dia\.classList\.add\('flatpickr-disabled'\)/.test(pantalla), 'A: y el calendario no deja elegir días futuros');
assert.ok(/'No puede ser posterior a hoy\.'/.test(leer('assets/static/js/hoja-de-ruta.js')), 'A: la hoja de ruta del chofer ya lo controlaba');

// B
const eliminar = api.slice(api.indexOf('public IHttpActionResult Delete(int id)'));
assert.ok(/"No se puede eliminar el viaje: tiene gastos cargados\."/.test(eliminar), 'B: la API no elimina un viaje con gastos');
assert.ok(/AS Tiene_Gastos/.test(api) && /public bool Tiene_Gastos \{ get; set; \}/.test(api), 'B: la grilla dice si tiene gastos');
assert.ok(/!desdePresupuesto && !viaje\.Tiene_Gastos/.test(pantalla) && /'tiene gastos cargados'/.test(pantalla),
    'B: Eliminar queda deshabilitado con el motivo (§1.4)');

// C
assert.ok(/"No se puede adjuntar la evidencia: el viaje todavía no salió\."/.test(api), 'C: en un directo, desde que salió');
assert.ok(/"No se puede adjuntar la evidencia: el viaje todavía no empezó\."/.test(api), 'C: con plataforma, desde el día del viaje');
assert.ok(/DELETE FROM VIAJE_EVIDENCIA WHERE Viaje_ID=@id/.test(eliminar), 'C: una evidencia vieja se borra con el viaje');

console.log('OK: flujo de los viajes (fecha de entrega, eliminar con gastos y evidencia de la entrega)');
