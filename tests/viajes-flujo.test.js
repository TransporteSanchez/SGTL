// Flujo de los viajes (punto 22 de la §41, docs/diseno/viajes-diseno.md): los huecos corregidos el 27/10.
//   A. La fecha de entrega no puede ser posterior a hoy.
//   B. Un viaje con gastos del chofer no se elimina (antes daba un error técnico).
//   C. La evidencia es de la entrega: en un directo, desde que salió; con plataforma, desde el día del viaje.
//   D. La entrega parcial o con rechazo se cobra completa, pero la proforma lo avisa y lo marca en la línea.
//   E. Estado Cancelado: un viaje que no se hizo (desde Registrado, con motivo) deja de contar y puede volver a Registrado.
//   F. En viaje se cambian el camión y el chofer, con motivo y sin cambiar el precio.
//   G. Administración no inicia un viaje de un día futuro (uno atrasado sí).
//   Punto 10 de la §41: "Sin carga" (antes "falso flete") es un estado, desde En viaje, y se cobra el porcentaje de la tabla.
//   Solo en los directos (Rocío, 28/10): con plataforma queda pendiente.
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

// D
const proformas = leer('WebApi_TransporteSanchez/Controllers/ProformasController.cs');
assert.ok(/f\.Resultado_Entrega == "Parcial" \|\| f\.Resultado_Entrega == "Rechazo"/.test(proformas) && /!conPlataforma &&/.test(proformas),
    'D: Traer viajes detecta la entrega parcial o con rechazo de un directo (Rukas cobra lo que dice su Excel)');
assert.ok(/se cobran completos\./.test(proformas) && /" Si acordaste otra cosa con el cliente, cambiá el precio o el descuento de su línea\."/.test(proformas),
    'D: y avisa que se cobran completos');
assert.ok(/OUTER APPLY \(SELECT TOP \(1\) v\.Resultado_Entrega FROM VIAJES v/.test(proformas), 'D: al volver a abrir el borrador, la línea sigue sabiendo el resultado');
assert.ok(/l\.Resultado_Entrega === 'Rechazo' \? 'Con rechazo' : 'Parcial'/.test(leer('gestion-facturacion.html')), 'D: la etiqueta en la línea');

// F
const put = api.slice(api.indexOf('public IHttpActionResult Put(int id'), api.indexOf('public IHttpActionResult Delete(int id)'));
assert.ok(/ValidarCamposBloqueados\(viaje, tarifaGuardada, viajeDto, estado, corrigeTarifa, enViaje\)/.test(put) &&
    /if \(!permiteAsignacion && actual\.ChoferID != nuevo\.ChoferID\)/.test(api), 'F: en viaje se pueden cambiar el camión y el chofer');
assert.ok(/PropertyName = "Cambio_Motivo", ErrorMessage = "Completá el motivo\."/.test(put), 'F: con el motivo obligatorio');
assert.ok(/Ocupacion\.Errores\(db, viaje\.CamionID != viajeDto\.CamionID/.test(put), 'F: libres en el horario del viaje');
assert.ok(put.indexOf('if (camionNuevo.HasValue) viaje.CamionID') > put.indexOf('var calculo = CalcularImporte('),
    'F: el camión nuevo se aplica después de calcular el importe (el precio no cambia)');
assert.ok(/cambioHojaDeRuta = viaje\.ChoferID != viajeDto\.ChoferID;/.test(put) && /"Cambio con el viaje en curso: "/.test(put),
    'F: al chofer nuevo le llega la hoja de ruta y el motivo queda en Auditoría');
assert.ok(/id="motivoAsignacion"/.test(pantalla) && /reglasViaje\.motivoAsignacion\.requerido = cambioAsignacionEnViaje\(\) \? 'Completá el motivo\.'/.test(pantalla),
    'F: la pantalla pide el motivo si cambian');
assert.ok(/var cambiaAsignacion = estado === 'En_viaje';/.test(pantalla) && /\.asignacion-fecha'\)\.toggleClass\('d-none', cambiaAsignacion\)/.test(pantalla),
    'F: en viaje las fechas quedan como texto y el camión y el chofer, como campos');

// G
assert.ok(/EsRegistrado\(v\.Estado\) && v\.Fecha_Inicio\.Date > hoy && \(nuevo == EstadoEnViaje \|\| nuevo == EstadoListoParaFacturar\)/.test(api) &&
    /"No se puede iniciar el viaje: es del "/.test(api), 'G: la API no inicia un viaje de un día futuro');
assert.ok(/'No se puede iniciar el viaje: es del '/.test(pantalla) && /> SGTL\.fechaISO\(new Date\(\)\)\s*\? SGTL\.fecha\(v\.Fecha_Inicio\)/.test(pantalla),
    'G: y la tarjeta "En viaje" queda gris con el motivo');

// Punto 10: sin carga
assert.ok(/estado-azul">Sin carga</.test(SGTL.estadoViaje('Sin_carga')), '10: Sin carga va en azul, como Entregado');
assert.strictEqual(SGTL.estadosViaje().Sin_carga, 'Sin carga', '10: y está en el filtro de estado');
const sinCargaApi = api.slice(api.indexOf('private IHttpActionResult CambiarSinCarga('), api.indexOf('// POST: api/Viajes/{id}/Evidencia'));
assert.ok(/string anterior = conPlataforma \? EstadoRegistrado : EstadoEnViaje;/.test(sinCargaApi),
    '10: desde En viaje y vuelve al de antes (uno con plataforma que ya estaba sin carga, a Registrado)');
assert.ok(/if \(conPlataforma\) return ErrorEstado\("Estado", "No se puede marcar sin carga: lo sigue la plataforma del cliente\."\);/.test(sinCargaApi)
    && /if \(esDirecto\(v\) && v\.Estado === 'En_viaje'\) posibles = posibles\.concat\('Sin_carga'\);/.test(pantalla),
    '10: solo en los directos: con plataforma, la API lo rechaza y Cambiar estado no lo ofrece');
assert.ok(/"La fecha no puede ser posterior a hoy\."/.test(sinCargaApi) && /"La fecha no puede ser anterior al inicio del viaje\."/.test(sinCargaApi),
    '10: la fecha entre el inicio y hoy');
assert.ok(/new ViajeDto \{ Falso_Flete = sinCarga, Estadia_Modulos = guardada\.Estadia_Modulos,\s*Adicionales = adicionales, Vuelta_Vacia_Porcentaje = vueltaVacia \}/.test(sinCargaApi) && /GuardarImporte\(db, id, datos, calculo\)/.test(sinCargaApi),
    '10: se cobra el porcentaje de la tabla (y completo si vuelve atrás)');
assert.ok(/bool quitaVueltaVacia = sinCarga && \(vueltaVacia \?\? 0m\) > 0;/.test(sinCargaApi)
    && /if \(vueltaVaciaPorcentaje > 0 && !falsoFlete\)/.test(leer('WebApi_TransporteSanchez/Tarifas/TarifarioCalculo.cs'))
    && /"Vuelta vacía de más: el viaje está sin carga\."/.test(api) && /if \(vacia > 0 && !falso\)/.test(pantalla),
    '10: un viaje sin carga no tiene vuelta vacía (no llegó al destino): sale de la lista, no se cobra y no se puede cargar');
assert.ok(/viajeDto\.Falso_Flete = TarifaGuardada\(db, id\)\.Falso_Flete;/.test(put) && /viajeDto\.Falso_Flete = false;/.test(api),
    '10: el formulario ya no lo marca: lo pone el estado');
assert.ok(!/id="falsoFlete"/.test(pantalla) && /posibles = posibles\.concat\('Sin_carga'\)/.test(pantalla) && /id="fechaSinCarga"/.test(pantalla),
    '10: en Gestionar viajes, la tarjeta Sin carga en lugar de la casilla');
const calculoTarifa = leer('WebApi_TransporteSanchez/Tarifas/TarifarioCalculo.cs');
const sinComentarios = function (codigo) { return codigo.split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n'); };
assert.ok(/" · sin carga \("/.test(calculoTarifa) && !/"[^"\n]*falso flete[^"\n]*"/i.test(sinComentarios(calculoTarifa)) &&
    !/"[^"\n]*falso flete[^"\n]*"/i.test(sinComentarios(leer('WebApi_TransporteSanchez/Controllers/TarifarioController.cs'))), '10: ningún texto dice "falso flete"');
assert.ok(/>Viaje sin carga <span class="text-danger">\*<\/span><\/label>/.test(leer('gestion-tarifas.html')), '10: en la tabla de tarifas, "Viaje sin carga"');
const hojaRuta = leer('WebApi_TransporteSanchez/Controllers/HojaDeRutaController.cs');
assert.ok(/\[HttpPost, Route\("Viajes\/\{id:int\}\/SinCarga"\)\]/.test(hojaRuta) && /Estado = ViajesController\.EstadoSinCarga,/.test(hojaRuta),
    '10: el chofer lo registra desde su hoja de ruta');
const enViajeChofer = H.accionesDe({ Viaje_ID: 45, Estado: 'En_viaje', Tipo_Cliente: 'Directo', Fecha_Inicio: '2026-10-27T05:00:00' }, '2026-10-27');
assert.strictEqual(enViajeChofer.sinCarga.texto, 'Registrar sin carga', '10: al lado de Registrar entrega');
assert.strictEqual(H.motivoGasto({ Estado: 'Sin_carga', Tipo_Cliente: 'Directo', Fecha_Entrega: '2026-10-27T00:00:00' }, '2026-10-28'), '',
    '10: los gastos, como en un entregado');
assert.ok(/if \(estado == Entregado \|\| estado == SinCarga\)/.test(gastos), '10: también en la API');
assert.strictEqual(H.kmRecorridoCompleto({ Estado: 'Sin_carga', Distancia_KM: '402.3', Km_Ida: 12.4, Km_Vuelta: 398 }), 24.8,
    '10: en la hoja de ruta, el recorrido es galpón → origen → galpón');
assert.ok(/bool sinCarga = f\.Estado == "Sin_carga";/.test(proformas) && /\(sinCarga \? " - Sin carga" : ""\)/.test(proformas),
    '10: Traer viajes lo trae como un entregado, con "Sin carga" en la línea');
assert.ok(/CASE WHEN ISNULL\(v\.Falso_Flete, 0\) = 1 THEN 2 \* ki\.Km/.test(leer('WebApi_TransporteSanchez/Controllers/CostosController.cs')),
    '10: el recorrido es galpón → origen → galpón');
assert.ok(/UPDATE v SET Estado=CASE WHEN ISNULL\(v\.Falso_Flete,0\)=1 AND v\.Resultado_Entrega IS NULL THEN 'Sin_carga'/
    .test(leer('WebApi_TransporteSanchez/Controllers/ComprobantesController.cs')), '10: la nota de crédito lo devuelve a Sin carga');
const scriptSinCarga = leer('database/viajes/03_viaje_sin_carga.sql');
assert.ok(/IF COL_LENGTH\('dbo\.VIAJES', 'Sin_Carga_Observacion'\) IS NULL\s+ALTER TABLE dbo\.VIAJES ADD Sin_Carga_Observacion/.test(scriptSinCarga),
    '10: el script agrega la observación (idempotente)');

// Textos de Sin carga con adicionales (parte Q de la ronda 2, §60).
assert.ok(/' de la tarifa' \+ \(adicionales > 0\s+\? ' \(' \+ SGTL\.monto\(sinCarga\) \+ '\) más los adicionales \('/.test(pantalla),
    '60: la tarjeta Sin carga suma los adicionales al porcentaje de la tarifa');
assert.ok(/estado === 'Sin_carga' \? 'Quedó sin carga'/.test(pantalla), '60: Completar el viaje de uno sin carga no dice "Listo para facturar"');
assert.ok(pantalla.includes("'</strong> <span>sin IVA · '"), '60: un espacio entre el importe y "sin IVA"');

console.log('OK: flujo de los viajes (entrega parcial o con rechazo, fecha de entrega, eliminar con gastos, evidencia, viaje cancelado, '
    + 'cambio de camión o chofer en viaje, viajes de días futuros y viaje sin carga)');
