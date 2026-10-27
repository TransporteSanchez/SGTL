// Flujo de los viajes (punto 22 de la §41, docs/diseno/viajes-diseno.md): los huecos corregidos el 27/10.
//   A. La fecha de entrega no puede ser posterior a hoy.
//   B. Un viaje con gastos del chofer no se elimina (antes daba un error técnico).
//   C. La evidencia es de la entrega: en un directo, desde que salió; con plataforma, desde el día del viaje.
//   E. Estado Cancelado: un viaje que no se hizo (desde Registrado, con motivo) deja de contar y puede volver a Registrado.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

// E. Cancelado (docs/diseno/viajes-diseno.md; maqueta aprobada por Rocío el 27/10)
const sandboxUi = {
    window: {},
    document: {
        querySelector: function () { return null; }, addEventListener: function () {},
        documentElement: { hasAttribute: function () { return false; }, setAttribute: function () {} }
    },
    Intl: Intl, setTimeout: setTimeout, clearTimeout: clearTimeout
};
vm.runInNewContext(leer('assets/static/js/sgtl-ui.js'), sandboxUi, { filename: 'sgtl-ui.js' });
const SGTL = sandboxUi.window.SGTL;
assert.ok(/estado-rojo">Cancelado</.test(SGTL.estadoViaje('Cancelado')), 'E: Cancelado va en rojo, como lo anulado');
assert.ok(/estado-verde">Cancelado</.test(SGTL.estado('Cancelado')), 'E: en cuenta corriente "Cancelado" sigue siendo pagado (verde)');
assert.ok(/estado-gris">Registrado</.test(SGTL.estadoViaje(null)), 'E: sin estado es Registrado');
assert.ok(/estado-azul">En viaje</.test(SGTL.estadoViaje('En_viaje')));
assert.strictEqual(SGTL.estadosViaje().Cancelado, 'Cancelado', 'E: el filtro de estado lo ofrece');

const cambiar = api.slice(api.indexOf('private IHttpActionResult CambiarCancelado('), api.indexOf('// POST: api/Viajes/{id}/Evidencia'));
assert.ok(/if \(!EsRegistrado\(v\.Estado\)\)/.test(cambiar) && /"No se puede cancelar el viaje: está en la proforma "/.test(cambiar),
    'E: se cancela desde Registrado y fuera de una proforma');
assert.ok(/"Completá el motivo\."/.test(cambiar), 'E: el motivo es obligatorio');
assert.ok(/OrdenDelDia\.Planificar\(db, null, antes/.test(cambiar), 'E: deja su lugar en el orden del día, como al eliminarlo');
assert.ok(/TarifarioRevisar\.Resolver\(db, usuario, "Se canceló el viaje\.", viajeId: id\)/.test(cambiar), 'E: su precio para revisar queda resuelto');
assert.ok(/"Un viaje cancelado solo puede volver a Registrado\."/.test(cambiar), 'E: un cancelado solo vuelve a Registrado');
assert.ok(/Ocupacion\.Errores\(/.test(cambiar) && /"No se puede reactivar el viaje\. "/.test(cambiar), 'E: al reactivarlo, el camión y el chofer tienen que estar libres');
assert.ok(/ya generó el viaje #/.test(cambiar), 'E: no se reactiva si el presupuesto ya generó otro viaje');
assert.ok(/"No se puede editar el viaje: está cancelado\."/.test(api) && /"No se puede eliminar el viaje: está cancelado\."/.test(api),
    'E: un cancelado no se edita ni se elimina');

// Deja de contar en todos lados.
const noCancelado = /<> 'Cancelado'/;
['WebApi_TransporteSanchez/Viajes/Ocupacion.cs', 'WebApi_TransporteSanchez/Tarifas/OrdenDelDia.cs', 'WebApi_TransporteSanchez/Tarifas/TarifarioImpacto.cs',
    'WebApi_TransporteSanchez/Controllers/HojaDeRutaController.cs', 'WebApi_TransporteSanchez/Controllers/CostosController.cs'].forEach(function (archivo) {
    assert.ok(noCancelado.test(leer(archivo)), 'E: ' + archivo + ' no cuenta los cancelados');
});
assert.ok(/WHERE ISNULL\(v\.Estado, ''\) <> '" \+ EstadoCancelado \+ "'/.test(api.slice(api.indexOf('ResumenCosto('))), 'E: ni en el resumen de costos');
assert.ok(/if \(f\.Estado == "Cancelado"\) continue;/.test(leer('WebApi_TransporteSanchez/Controllers/ProformasController.cs')), 'E: Traer viajes no los trae');
assert.ok(/está cancelado: no se puede incluir en la proforma/.test(leer('WebApi_TransporteSanchez/Controllers/ProformasController.cs')), 'E: ni se suman a mano');
assert.ok(/resultado = "Viaje_cancelado";/.test(leer('WebApi_TransporteSanchez/Controllers/ProformasPlataformaController.cs')) &&
    /Viaje_cancelado: 'Viaje cancelado'/.test(leer('assets/static/js/proformas-plataforma.js')), 'E: en el Excel de Rukas, para revisar');
assert.ok(/v\.Estado !== 'Cancelado'/.test(leer('assets/static/js/dashboard.js')), 'E: el tablero no los cuenta');
const gastos = leer('WebApi_TransporteSanchez/Viajes/GastosDelViaje.cs');
assert.strictEqual((gastos.match(/if \(estado == Cancelado\) return no \+ "el viaje está cancelado\.";/g) || []).length, 2, 'E: sin gastos, ni del chofer ni de administración');

// Pantallas
assert.ok(/if \(v\.Estado === 'Cancelado'\) return \['Registrado'\];/.test(pantalla) && /posibles\.concat\('Cancelado'\)/.test(pantalla),
    'E: Cambiar estado ofrece Cancelado desde Registrado y, a un cancelado, volver a Registrado');
assert.ok(/id="motivoCancelado"/.test(pantalla) && /requerido: 'Completá el motivo\.'/.test(pantalla), 'E: con el motivo obligatorio');
assert.ok(/\/AlEliminar'/.test(pantalla.slice(pantalla.indexOf('function prepararCancelar'))), 'E: y lo que pasa con los otros viajes del día');
assert.ok(/'No se puede editar el viaje: ' \+ \(cancelado \? 'está cancelado'/.test(pantalla), 'E: Editar y Eliminar deshabilitados con el motivo (§1.4)');

const hojaApi = leer('WebApi_TransporteSanchez/Controllers/HojaDeRutaController.cs');
assert.ok(/"\(\(v\.Fecha_Fin >= @hoy/.test(hojaApi) && /<> 'Cancelado'\)";/.test(hojaApi) && /" AND NOT " \+ pendiente/.test(hojaApi),
    'E: en la hoja de ruta el cancelado va a Anteriores (el NOT alcanza a toda la condición)');

const sandboxHoja = { String: String, Number: Number, Math: Math, Date: Date, Promise: Promise, document: {} };
sandboxHoja.window = sandboxHoja;
vm.runInNewContext(leer('assets/static/js/hoja-de-ruta.js'), sandboxHoja, { filename: 'hoja-de-ruta.js' });
const H = sandboxHoja.SGTLHojaDeRuta;
const cancelado = { Viaje_ID: 47, Estado: 'Cancelado', Tipo_Cliente: 'Directo', Fecha_Inicio: '2026-10-27T05:00:00', Fecha_Fin: '2026-10-27T08:00:00' };
const acciones = H.accionesDe(cancelado, '2026-10-27');
assert.strictEqual(acciones.paso, null, 'E: el chofer no lo inicia');
assert.strictEqual(acciones.nota, 'Este viaje se canceló.');
assert.strictEqual(H.motivoGasto(cancelado, '2026-10-27'), null, 'E: ni carga gastos');

const presupuestos = leer('assets/static/js/presupuestos.js');
assert.ok(/p\.viajeEstado === 'Cancelado'/.test(presupuestos) && /\(conViaje && !cancelado\) \|\| precioParaRevisar/.test(presupuestos),
    'E: el presupuesto con el viaje cancelado vuelve a dejar generar el viaje');
assert.ok(/estadoExistente != "Cancelado"/.test(leer('WebApi_TransporteSanchez/Controllers/PresupuestosController.cs')), 'E: y la API lo acepta');
const script = leer('database/viajes/02_viaje_cancelado.sql');
['Cancelado_Motivo', 'Cancelado_Fecha', 'Cancelado_Usuario', 'Cancelado_Presupuesto_ID'].forEach(function (c) {
    assert.ok(new RegExp("IF COL_LENGTH\\('dbo\\.VIAJES', '" + c + "'\\) IS NULL\\s+ALTER TABLE dbo\\.VIAJES ADD " + c).test(script), 'E: el script agrega ' + c + ' (idempotente)');
});

console.log('OK: flujo de los viajes (fecha de entrega, eliminar con gastos, evidencia de la entrega y viaje cancelado)');
