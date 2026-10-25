// Cambios de tarifa para revisar (§33 de PENDIENTES, decisión de Rocío del 25/10): lo que quedó para revisar al corregir
// una tabla de tarifas o registrar una nueva (api/Tarifario/Revisar). La API devuelve solo lo que el usuario puede
// resolver: los presupuestos, a quien tiene permiso de presupuestos; las proformas y los comprobantes, a quien gestiona
// proformas o cuenta corriente. Lo usan Presupuestos, Proformas, Viajes (y su Ver detalle) y la tarjeta fija del
// dashboard (tarjetaFija):
//   - en la fila, al lado del estado, el ícono rojo de "falta resolver algo" (§4.3) con un texto corto que manda a mirar
//     el documento: icono(filas, texto, etiqueta);
//   - adentro (detalle o edición), el aviso amarillo con qué cambió, el importe anterior y el nuevo, y qué hacer:
//     aviso(filas).
(function (window) {
  'use strict';

  var API = 'http://localhost:50222/api';

  function token() { try { return window.localStorage.getItem('token') || ''; } catch (e) { return ''; } }
  function encabezados(json) {
    var h = token() ? { Authorization: 'Bearer ' + token() } : {};
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  // Lo pendiente (todo, o el de un documento: { presupuestoId }, { proformaId } o { viajeId }). Si falla, nada: la
  // pantalla se ve igual, sin los avisos.
  function cargar(filtro) {
    var consulta = filtro && Object.keys(filtro).length ? '?' + Object.keys(filtro).map(function (k) { return k + '=' + encodeURIComponent(filtro[k]); }).join('&') : '';
    // Con fetch y no SGTL.ajax: Presupuestos no carga jQuery.
    return window.fetch(API + '/Tarifario/Revisar' + consulta, { headers: encabezados() })
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
    // opciones.boton: { texto, clase } — la acción para corregirlo ahí mismo (en la proforma, "Anular proforma").
    var boton = opciones.boton
      ? '<div class="mt-2"><button type="button" class="btn btn-sm ' + (opciones.boton.clase || 'btn-outline-primary') + '" data-sgtl-corregir>' +
        esc(opciones.boton.texto) + '</button></div>'
      : '';
    return '<div class="alert alert-warning" role="status"><div class="fw-bold">' + esc(titulo) + '</div>' + lista +
      '<div class="mt-1">' + esc(queHacer) + '</div>' + boton + '</div>';
  }

  // Qué puede ver el usuario: { Presupuestos, Facturacion }.
  function alcance() {
    return window.fetch(API + '/Tarifario/Revisar/Alcance', { headers: encabezados() })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (a) { return a || {}; }, function () { return {}; });
  }

  // El presupuesto se reenvió por e-mail: lo que tenía para revisar queda resuelto.
  function presupuestoEnviado(id) {
    return window.fetch(API + '/Tarifario/Revisar/Presupuesto/' + encodeURIComponent(id) + '/Enviado', { method: 'POST', headers: encabezados(true) })
      .catch(function () { });
  }

  // ---------------------------------------------------------------- Tarjeta fija del dashboard

  // No se saca ni se elige con la estrella (Rocío, 25/10): la ve siempre quien puede resolver algo, arriba del dashboard y
  // primera en Tableros → Facturación (con la estrella fija). Cada fila lleva a donde
  // se corrige: el presupuesto (Ver PDF, para reenviarlo; al enviarlo queda resuelto), la proforma (su detalle, para
  // anularla; al anularla queda resuelto) o el viaje que está en un comprobante (Ver detalle). La nota de crédito o de
  // débito se emite en cuenta corriente: eso se marca como resuelto a mano, con cómo se resolvió.
  var DESTINO = {
    Presupuesto: function (r) { return 'presupuestos.html?presupuesto=' + encodeURIComponent(r.Presupuesto_ID); },
    Proforma: function (r) { return 'gestion-facturacion.html?proforma=' + encodeURIComponent(r.Proforma_ID); }
  };

  function filaTarjeta(r) {
    var esc = window.SGTL.escapar;
    var documento = r.Tipo === 'Presupuesto' ? (r.Documento || 'Presupuesto #' + r.Presupuesto_ID) : (r.Documento || '') + (r.Viaje_ID ? ' · viaje #' + r.Viaje_ID : '');
    var ir = DESTINO[r.Tipo] ? DESTINO[r.Tipo](r) : null;
    var acciones = [];
    if (r.Tipo === 'Presupuesto') acciones.push(window.SGTL.botonFila('pdf', { texto: 'Ver PDF para reenviarlo', datos: { ir: ir } }));
    else if (r.Tipo === 'Proforma') acciones.push(window.SGTL.botonFila('ver', { texto: 'Ver la proforma para anularla', datos: { ir: ir } }));
    else {
      acciones.push(window.SGTL.botonFila('ver', { texto: 'Ver detalle del viaje #' + r.Viaje_ID, datos: { viaje: r.Viaje_ID } }));
      acciones.push(window.SGTL.botonFila('siguiente', { texto: 'Marcar como resuelto', icono: 'bi-check2-circle', datos: { resolver: r.Revisar_ID } }));
    }
    return '<tr>' +
      '<td>' + (ir ? '<a href="' + esc(ir) + '">' + esc(documento) + '</a>' : esc(documento)) +
      '<small class="d-block text-muted">' + esc(r.Cliente || '—') + '</small>' +
      // En pantallas chicas, qué hacer va debajo del documento (la columna no entra).
      '<small class="d-block d-md-none mt-1">' + esc(r.Que_Hacer) + '</small></td>' +
      '<td class="text-end text-nowrap">' + esc(monto(r.Importe_Nuevo)) + '<small class="d-block text-muted">antes ' + esc(monto(r.Importe_Anterior)) + '</small></td>' +
      '<td class="d-none d-md-table-cell">' + esc(r.Que_Hacer) + '<small class="d-block text-muted">' + esc(causa(r)) + '</small></td>' +
      '<td class="text-center">' + window.SGTL.accionesFila(acciones) + '</td></tr>';
  }

  function dibujarTarjeta(contenedor) {
    var cuerpo = contenedor.querySelector('tbody');
    var cantidad = contenedor.querySelector('[data-sgtl="cantidad"]');
    cargar().then(function (filas) {
      cantidad.textContent = filas.length ? 'Hoy · ' + filas.length + ' para revisar' : 'Hoy';
      cuerpo.innerHTML = filas.length ? filas.map(filaTarjeta).join('')
        : '<tr><td colspan="4" class="text-center text-muted py-4"><i class="bi bi-check2-circle text-success me-1" aria-hidden="true"></i>' +
          'No hay nada para revisar por cambios de tarifa.</td></tr>';
    });
  }

  function verViaje(id) {
    window.fetch(API + '/Viajes/Buscar?idViaje=' + encodeURIComponent(id) + '&page=1&pageSize=1', { headers: encabezados() })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (datos) {
        var v = datos && (datos.Results || datos.results || [])[0];
        if (v && window.SGTLDetalleViaje) window.SGTLDetalleViaje.abrir(v, { enlaceGestion: true });
        else window.SGTL.toastError('No se pudo abrir el viaje. Probá de nuevo.');
      }, function () { window.SGTL.toastError('No se pudo abrir el viaje. Probá de nuevo.'); });
  }

  function resolver(contenedor, id) {
    window.SGTL.confirmar({
      titulo: '¿Marcar como resuelto?',
      mensaje: 'Deja de aparecer en la lista y en el viaje. Contá cómo se resolvió.',
      verbo: 'Marcar como resuelto',
      motivo: { etiqueta: 'Cómo se resolvió', obligatorio: true },
      accion: function (como) {
        return window.fetch(API + '/Tarifario/Revisar/' + encodeURIComponent(id) + '/Resolver', { method: 'POST', headers: encabezados(true), body: JSON.stringify({ Como: como }) })
          .then(function (r) {
            if (r.ok) return;
            var error = new Error('HTTP ' + r.status);
            error.mensajeUsuario = r.status === 404 ? 'Ya estaba resuelto.' : 'No se pudo marcar como resuelto. Probá de nuevo.';
            throw error;
          });
      }
    }).then(function (hecho) {
      if (!hecho) return;
      window.SGTL.toastExito('Marcado como resuelto.');
      dibujarTarjeta(contenedor);
    });
  }

  // En Tableros va con la estrella marcada y deshabilitada, con el motivo (§1.4: lo que no se puede hacer no se esconde).
  var ESTRELLA_FIJA = 'No se puede quitar del dashboard: está fijo para quien resuelve cambios de tarifa';

  // opciones.estrellaFija: true en Tableros. Devuelve una promesa: true si la tarjeta se muestra (el usuario puede
  // resolver algo), false si no.
  function tarjetaFija(contenedor, opciones) {
    if (!contenedor) return Promise.resolve(false);
    opciones = opciones || {};
    return alcance().then(function (a) {
      if (!a.Presupuestos && !a.Facturacion) { contenedor.innerHTML = ''; contenedor.hidden = true; return false; }
      contenedor.hidden = false;
      var estrella = opciones.estrellaFija
        ? '<span class="sgtl-envoltura-deshabilitado" tabindex="0" data-bs-toggle="tooltip" title="' + ESTRELLA_FIJA + '">' +
          '<button type="button" class="btn btn-sm dash-estrella" disabled aria-pressed="true" aria-label="' + ESTRELLA_FIJA + '">' +
          '<i class="bi bi-star-fill" aria-hidden="true"></i></button></span>'
        : '';
      contenedor.innerHTML = '<div class="card rounded custom-card dash-tarjeta sgtl-cambios-tarifa" data-tablero="cambiostarifa">' +
        '<div class="card-header"><i class="bi bi-exclamation-circle text-danger" aria-hidden="true"></i><h5>Cambios de tarifa para revisar</h5>' +
        '<span class="dash-alcance" data-sgtl="cantidad">Hoy</span>' + estrella + '</div>' +
        '<div class="card-body p-0"><table class="table table-striped table-hover dash-tabla mb-0"><thead><tr><th>Documento</th>' +
        '<th class="text-end">Importe</th><th class="d-none d-md-table-cell">Qué hacer</th><th class="text-center">Acciones</th></tr></thead>' +
        '<tbody><tr><td colspan="4" class="text-center text-muted py-4">Cargando…</td></tr></tbody></table></div></div>';
      contenedor.onclick = function (evento) {
        var boton = evento.target.closest('[data-ir], [data-viaje], [data-resolver]');
        if (!boton || boton.disabled) return;
        if (boton.dataset.ir) window.location.href = boton.dataset.ir;
        else if (boton.dataset.viaje) verViaje(boton.dataset.viaje);
        else resolver(contenedor, boton.dataset.resolver);
      };
      dibujarTarjeta(contenedor);
      return true;
    });
  }

  window.SGTLCambiosTarifa = {
    cargar: cargar, de: de, icono: icono, aviso: aviso, causa: causa,
    alcance: alcance, presupuestoEnviado: presupuestoEnviado, tarjetaFija: tarjetaFija
  };
})(window);
