// Precio por orden del día (§43 de PENDIENTES, docs/diseno/vuelta-del-dia-diseno.md, maqueta aprobada por Rocío el 27/10):
// la vuelta la decide la API por cliente, origen, destino y día (no por camión); los otros viajes del día se acomodan o
// quedan para revisar; el camión y el chofer no pueden estar ocupados; y la pantalla dibuja el bloque, los avisos y el
// "Precio para revisar" con los textos decididos.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const leer = function (archivo) { return fs.readFileSync(path.join(raiz, archivo), 'utf8'); };

// ---------------------------------------------------------------- API

const orden = leer('WebApi_TransporteSanchez/Tarifas/OrdenDelDia.cs');
assert.ok(/WHERE v\.ClienteID = @c AND v\.OrigenID = @o AND v\.DestinoID = @d AND v\.Fecha_Inicio >= @dia AND v\.Fecha_Inicio < @dia1/.test(orden),
    'el grupo es el cliente, el recorrido y el día (el camión no importa)');
assert.ok(orden.indexOf('CamionID = @') === -1, 'el grupo no se arma por camión');
assert.ok(/var reservados = grupo\.Where\(i => Reserva\(i\) && i\.Vuelta == 1\)/.test(orden),
    'un presupuesto aceptado (o su viaje) con la 1ª vuelta conserva su lugar');
assert.ok(/ThenBy\(i => i\.Clase == Viaje \? 0 : 1\)/.test(orden), 'a la misma hora, primero el viaje y después el presupuesto');
assert.ok(/if \(i\.Proforma_Estado == "Generada" \|\| i\.Proforma_Estado == "Aceptada"\) return ConDocumento;/.test(orden)
    && /if \(i\.DePresupuesto \|\| YaSalio\(i\.Estado\)\) return Decide;/.test(orden) && /return SeActualiza;/.test(orden),
    'tres caminos para el otro viaje: se actualiza solo, decide la persona o se corrige con su documento');
assert.ok(orden.indexOf('" no se cambia solo, es necesario que revises ese viaje."') !== -1
    && orden.indexOf('"Se cobra como segundo viaje del día: ya está el viaje #"') !== -1,
    'los textos con el tono de los avisos que dejan algo pendiente (§5.1)');
assert.ok(orden.indexOf('". Es necesario que le avises al cliente."') !== -1, 'al actualizar el precio, que falta avisarle al cliente');

const ocupacion = leer('WebApi_TransporteSanchez/Viajes/Ocupacion.cs');
assert.ok(/Fecha_Inicio < @fin AND Fecha_Fin > @ini/.test(ocupacion), 'ocupado: se superponen (terminar a la hora en que empieza el otro no es superponerse)');
assert.ok(/"Camión ocupado: "/.test(ocupacion) && /"Chofer ocupado: "/.test(ocupacion) && /" hs a "/.test(ocupacion),
    'el error corto, empezando por el dato (§6.3): "Camión ocupado: viaje #45, de 08:00 hs a 11:30 hs."');
assert.ok(/Estado = 'Aceptado' AND ViajeID IS NULL/.test(ocupacion), 'también cuenta un presupuesto aceptado que todavía no generó su viaje');

const viajesApi = leer('WebApi_TransporteSanchez/Controllers/ViajesController.cs');
['api/Viajes/Ocupado', 'api/Viajes/{id:int}/AlEliminar', 'api/Viajes/{id:int}/Orden', 'api/Viajes/{id:int}/Precio'].forEach(function (r) {
    assert.ok(viajesApi.indexOf('[Route("' + r + '")]') !== -1, 'existe ' + r);
});
assert.ok((viajesApi.match(/Ocupacion\.Errores\(db, viajeDto\.CamionID, viajeDto\.ChoferID/g) || []).length === 2, 'registrar y editar controlan camión y chofer ocupados');
assert.ok(/"se eliminó el viaje #" \+ id/.test(viajesApi), 'eliminar un viaje acomoda a los otros del día');

const presupuestosApi = leer('WebApi_TransporteSanchez/Controllers/PresupuestosController.cs');
assert.ok(presupuestosApi.indexOf('[HttpGet, Route("{id:int}/AlCambiarEstado")]') !== -1, 'presupuestos: qué pasa al aceptar, rechazar o eliminar');
assert.ok(/"No se puede aceptar el presupuesto\. "/.test(presupuestosApi), 'no se acepta un presupuesto con el camión o el chofer ocupados');
assert.ok(/"No se puede generar el viaje: el precio del presupuesto está para revisar\."/.test(presupuestosApi), 'con el precio para revisar no se genera el viaje');

const csproj = leer('WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj');
['Tarifas\\OrdenDelDia.cs', 'Viajes\\Ocupacion.cs'].forEach(function (archivo) {
    assert.ok(csproj.indexOf('<Compile Include="' + archivo + '" />') !== -1, archivo + ' tiene que estar en el .csproj');
});

const script = leer('database/tarifas/06_precio_por_orden_del_dia.sql');
assert.ok(/IF COL_LENGTH\(N'dbo\.TARIFARIO_REVISAR', N'Vuelta_Nueva'\) IS NULL/.test(script) && /N'Orden del día'/.test(script) && /N'Viaje'/.test(script),
    '06 agrega la vuelta nueva y los tipos "Orden del día" y "Viaje", solo si faltan');
assert.ok(/SOLO LECTURA/.test(leer('database/tarifas/07_relevar_vueltas_por_recorrido.sql')), '07 solo releva, no cambia datos');

// ---------------------------------------------------------------- Pantallas

const viajes = leer('gestion-viajes.html');
assert.ok(viajes.indexOf('name="vueltaViaje"') === -1 && viajes.indexOf('vueltaManual') === -1, 'la vuelta ya no se elige en Registrar viaje');
assert.ok(/Vuelta: null,/.test(viajes), 'la vuelta la decide la API');
assert.ok(/url: API_VIAJES \+ '\/Viajes\/Ocupado'/.test(viajes) && /validar: function \(\) \{ return ocupado\.CamionID; \}/.test(viajes),
    'camión ocupado: el error debajo del campo, al elegirlo');
assert.ok(/'\/Viajes\/' \+ id \+ '\/AlEliminar'/.test(viajes), 'la confirmación de eliminar dice qué pasa con los otros viajes');
assert.ok(/<script src="assets\/static\/js\/orden-del-dia\.js"><\/script>/.test(viajes), 'Gestionar viajes carga el bloque del día');
const presupuestos = leer('assets/static/js/presupuestos.js');
assert.ok(presupuestos.indexOf('vueltaManual') === -1 && leer('presupuestos.html').indexOf('id="vueltaPresupuesto"') === -1,
    'tampoco se elige en presupuestos');
assert.ok(/presupuesto: 'true'/.test(presupuestos) && /'\/AlCambiarEstado\?estado='/.test(presupuestos), 'presupuestos: calcula con el recorrido y confirma con lo que pasa');

// Lo que dibuja la pantalla, con un SGTL de prueba.
function sgtlDePrueba() {
    const monto = function (v) {
        const partes = Number(v).toFixed(2).split('.');
        return '$ ' + partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + partes[1];
    };
    return {
        escapar: function (t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
        monto: monto,
        estado: function (valor, texto, color) { return '<span class="badge ' + (color || '') + '">' + (texto || valor) + '</span>'; },
        fecha: function (f) { const p = String(f).substring(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; },
        botonInfo: function (tipo, html) { return '<button data-tipo="' + tipo + '">' + html + '</button>'; }
    };
}
const caja = { String: String, Number: Number, Date: Date, Object: Object, Promise: Promise, SGTL: sgtlDePrueba(), document: {} };
caja.window = caja;
vm.runInNewContext(leer('assets/static/js/orden-del-dia.js'), caja, { filename: 'orden-del-dia.js' });
vm.runInNewContext(leer('assets/static/js/cambios-tarifa.js'), caja, { filename: 'cambios-tarifa.js' });
const D = caja.SGTLOrdenDelDia, C = caja.SGTLCambiosTarifa;

// Maqueta 1a y 1b: el bloque con este viaje y el otro (se actualiza solo, o queda para revisar).
const bloque = D.bloque([
    { Clase: 'Viaje', Id: 0, Este: true, Hora: '05:00 hs', Orden: 1, Importe: 581492 },
    { Clase: 'Viaje', Id: 44, Estado: 'Registrado', Hora: '09:00 hs', Orden: 2, Via: 'solo', Importe: 581492, ImporteNuevo: 407089 },
    { Clase: 'Viaje', Id: 50, Estado: 'Entregado', Hora: '10:00 hs', Orden: 2, Via: 'decide', Importe: 581492, ImporteNuevo: 407089 }
], { fecha: '2026-10-28', modo: 'formulario' });
assert.ok(bloque.indexOf('Viajes de este cliente y recorrido el miércoles 28/10/2026') !== -1, 'el título dice el día');
assert.ok(/Este viaje.*Viaje #44<span class="badge azul">Se actualiza<\/span>.*antes \$ 581\.492,00/.test(bloque), 'el que se actualiza solo: azul, con el precio de antes');
assert.ok(/Viaje #50<span class="badge amarillo">Para revisar<\/span><small>10:00 hs · ya se entregó<\/small>.*le corresponde \$ 407\.089,00/.test(bloque),
    'el que ya salió: amarillo, "ya se entregó" y el precio que le corresponde');
assert.strictEqual(D.bloque([{ Clase: 'Viaje', Id: 0, Este: true, Hora: '05:00 hs', Orden: 1 }], {}), '', 'solo, sin bloque');
assert.strictEqual(D.textoGuardado('Viaje registrado.', { Actualizados: [{ Id: 44, Importe: 407089 }], ParaRevisar: [{ Clase: 'Viaje', Id: 50 }] }),
    'Viaje registrado. El precio del viaje #44 se actualizó a $ 407.089,00. Es necesario que revises el precio del viaje #50.');

// Maqueta §4 y §7: "Precio para revisar" adentro del viaje y del presupuesto, y el globito de la fila.
const fila = { Revisar_ID: 3, Tipo: 'Viaje', Viaje_ID: 47, Importe_Anterior: 407089, Importe_Nuevo: 581492, Vuelta_Nueva: 1, Unico: true,
    Tipo_Cambio: 'Orden del día', Motivo: 'Se eliminó el viaje #44 (28/10/2026)' };
const aviso = C.aviso([fila], { estado: 'Entregado', botones: [] });
assert.ok(aviso.indexOf('<div class="fw-bold">Precio para revisar</div>') !== -1, 'el título');
assert.ok(aviso.indexOf('Ahora es el único viaje del día de este cliente y recorrido: le corresponde $ 581.492,00 en lugar de $ 407.089,00. ' +
    'Como está entregado no se cambia solo, es necesario que lo revises.') !== -1, 'el texto del viaje que se decide');
const presupuesto = C.aviso([Object.assign({}, fila, { Tipo: 'Presupuesto', Presupuesto_ID: 10, Viaje_ID: null })], {});
assert.ok(presupuesto.indexOf('en lugar de los $ 407.089,00 que aceptó el cliente. Como está aceptado no se cambia solo') !== -1, 'el del presupuesto aceptado');
const enProforma = C.aviso([Object.assign({}, fila, { Tipo: 'Proforma', Documento: 'PF-00000004', Unico: false, Vuelta_Nueva: 2 })], { enLaProforma: true });
assert.ok(enProforma.indexOf('Precio para revisar: viaje #47') !== -1 && enProforma.indexOf('Ahora es el segundo viaje del día') !== -1
    && enProforma.indexOf('Como está en esta proforma no se cambia solo, es necesario que la anules, la generes de nuevo y se la envíes otra vez al cliente.') !== -1,
    'el de la proforma, desde su detalle');
const globo = C.globo([fila]);
assert.ok(globo.indexOf('Le corresponde el precio de primer viaje del día ($ 581.492,00): se eliminó el viaje #44.') !== -1
    && globo.indexOf('Es necesario que lo revises en Ver detalle del viaje.') !== -1, 'el globito: qué pasó y dónde se resuelve');
const tarifa = C.aviso([{ Tipo: 'Comprobante', Viaje_ID: 48, Documento: 'FAC-00000002', Importe_Anterior: 407089, Importe_Nuevo: 581492, Tipo_Cambio: 'Corrección' }], {});
assert.ok(tarifa.indexOf('Cambió la tarifa: $ 407.089,00 → $ 581.492,00') !== -1
    && tarifa.indexOf('Como está facturado en FAC-00000002 no se cambia solo, es necesario emitir una nota de débito por $ 174.403,00 (más IVA).') !== -1,
    'los cambios de tarifa con el mismo tono');

console.log('OK: precio por orden del día (vuelta por cliente y recorrido, camión y chofer ocupados, avisos y precio para revisar)');
