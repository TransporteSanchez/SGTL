// Cambios de tarifa para revisar (§33 de PENDIENTES, decisión de Rocío del 25/10): lo que quedó para revisar al corregir
// una tabla de tarifas o registrar una nueva (api/Tarifario/Revisar). Lo usan Presupuestos, Proformas, Viajes (y su Ver
// detalle) y el tablero:
//   - en la fila, al lado del estado, el ícono rojo de "falta resolver algo" (§4.3) con un texto corto que manda a mirar
//     el documento: icono(filas, texto, etiqueta);
//   - adentro (detalle o edición), el aviso amarillo con qué cambió, el importe anterior y el nuevo, y qué hacer:
//     aviso(filas).
(function (window) {
  'use strict';

  var API = 'http://localhost:50222/api';

  // Lo pendiente (todo, o el de un documento: { presupuestoId }, { proformaId } o { viajeId }). Si falla, nada: la
  // pantalla se ve igual, sin los avisos.
  function cargar(filtro) {
    var consulta = filtro && Object.keys(filtro).length ? '?' + Object.keys(filtro).map(function (k) { return k + '=' + encodeURIComponent(filtro[k]); }).join('&') : '';
    // Con fetch y no SGTL.ajax: Presupuestos no carga jQuery.
    return window.fetch(API + '/Tarifario/Revisar' + consulta)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (filas) { return Array.isArray(filas) ? filas : []; }, function () { return []; });
  }

  // Las filas de un documento: campo "Presupuesto_ID", "Proforma_ID" o "Viaje_ID".
  function de(lista, campo, id) {
    var numero = Number(id);
    return (lista || []).filter(function (r) { return r[campo] === numero && (campo !== 'Proforma_ID' || r.Tipo === 'Proforma'); });
  }

  function icono(filas, texto, etiqueta) {
    if (!filas || !filas.length) return '';
    return window.SGTL.botonInfo('urgente', '<div>' + window.SGTL.escapar(texto) + '</div>', etiqueta || 'Ver qué cambió');
  }

  // "la corrección de la tabla "Tarifas a agosto 2026" del 26/10/2026 (motivo: …)"
  function causa(r) {
    return (r.Tipo_Cambio === 'Tabla nueva' ? 'la tabla de tarifas nueva "' : 'la corrección de la tabla "') + r.Tabla + '" del ' +
      window.SGTL.fecha(r.Fecha) + (r.Motivo ? ' (motivo: ' + r.Motivo.replace(/\.$/, '') + ')' : '');
  }

  function monto(v) { return window.SGTL.monto(v == null ? 0 : v); }

  function aviso(filas) {
    if (!filas || !filas.length) return '';
    var esc = window.SGTL.escapar;
    var r = filas[0];
    var cuerpo;
    if (r.Tipo === 'Presupuesto') {
      cuerpo = '<div>El importe pasó de ' + esc(monto(r.Importe_Anterior)) + ' a ' + esc(monto(r.Importe_Nuevo)) + ' por ' + esc(causa(r)) + '.</div>';
    } else if (filas.length === 1) {
      cuerpo = '<div>Con ' + esc(causa(r)) + ', el viaje #' + esc(r.Viaje_ID) + ' vale ' + esc(monto(r.Importe_Nuevo)) + '; en ' +
        (r.Tipo === 'Proforma' ? 'la proforma' : 'el comprobante') + (r.Documento ? ' ' + esc(r.Documento) : '') + ' figura ' + esc(monto(r.Importe_Anterior)) + '.</div>';
    } else {
      // Varios viajes de una misma proforma: cada uno con su importe.
      cuerpo = '<div>Con ' + esc(causa(r)) + ', cambia el importe de ' + filas.length + ' viajes (en la proforma → con la tabla corregida):</div>' +
        '<ul class="mb-0 ps-3">' + filas.map(function (f) {
          return '<li>Viaje #' + esc(f.Viaje_ID) + ': ' + esc(monto(f.Importe_Anterior)) + ' → ' + esc(monto(f.Importe_Nuevo)) + '</li>';
        }).join('') + '</ul>';
    }
    var queHacer = r.Tipo === 'Proforma' && filas.length > 1
      ? 'Anulá la proforma ' + (r.Documento || '') + ' y generala de nuevo: al anularla, sus viajes se recalculan.'
      : r.Que_Hacer;
    return '<div class="alert alert-warning" role="status"><div class="fw-bold mb-1">Cambió la tarifa</div>' + cuerpo +
      (queHacer ? '<div class="mt-1">' + esc(queHacer) + '</div>' : '') + '</div>';
  }

  window.SGTLCambiosTarifa = { cargar: cargar, de: de, icono: icono, aviso: aviso, causa: causa };
})(window);
