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

  // De dónde salió, corto (para el tablero): "Corrección del 25/10/2026: el valor … estaba mal cargado."
  function causa(r) {
    var motivo = (r.Motivo || '').trim().replace(/\.$/, '');
    return (r.Tipo_Cambio === 'Tabla nueva' ? 'Tabla nueva "' + r.Tabla + '"' : 'Corrección') + ' del ' + window.SGTL.fecha(r.Fecha) +
      (motivo ? ': ' + motivo : '') + '.';
  }

  function monto(v) { return window.SGTL.monto(v == null ? 0 : v); }
  function cambio(r) { return monto(r.Importe_Anterior) + ' → ' + monto(r.Importe_Nuevo); }

  // El aviso de adentro, corto (pedido de Rocío, 25/10): el importe de antes y el de ahora, y qué hacer. De dónde salió el
  // cambio (tabla, fecha y motivo) está en el tablero y en la auditoría. enLaProforma: se muestra en el detalle de la
  // proforma (ahí "anulala" ya se entiende).
  function aviso(filas, opciones) {
    if (!filas || !filas.length) return '';
    opciones = opciones || {};
    var esc = window.SGTL.escapar;
    var r = filas[0];
    var titulo, lista = '', queHacer;
    if (filas.length > 1) {
      titulo = 'Cambió la tarifa de ' + filas.length + ' viajes';
      lista = '<ul class="mb-0 ps-3">' + filas.map(function (f) { return '<li>Viaje #' + esc(f.Viaje_ID) + ': ' + esc(cambio(f)) + '</li>'; }).join('') + '</ul>';
    } else {
      titulo = 'Cambió la tarifa' + (opciones.enLaProforma && r.Viaje_ID ? ' del viaje #' + r.Viaje_ID : '') + ': ' + cambio(r);
    }
    if (r.Tipo === 'Presupuesto') queHacer = 'Reenviáselo al cliente con "Enviar por e-mail".';
    else if (r.Tipo === 'Proforma') queHacer = opciones.enLaProforma ? 'Para corregirla, anulala y generala de nuevo.'
      : 'Para corregir la proforma ' + (r.Documento || '') + ', anulala y generala de nuevo.';
    else {
      var diferencia = (r.Importe_Nuevo || 0) - (r.Importe_Anterior || 0);
      queHacer = 'Corresponde una nota de ' + (diferencia < 0 ? 'crédito' : 'débito') + ' por ' + monto(Math.abs(diferencia)) +
        (r.Documento ? ' sobre ' + r.Documento : '') + '.';
    }
    return '<div class="alert alert-warning" role="status"><div class="fw-bold">' + esc(titulo) + '</div>' + lista +
      '<div class="mt-1">' + esc(queHacer) + '</div></div>';
  }

  window.SGTLCambiosTarifa = { cargar: cargar, de: de, icono: icono, aviso: aviso, causa: causa };
})(window);
