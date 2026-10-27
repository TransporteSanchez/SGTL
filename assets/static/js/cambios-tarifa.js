// Cambios para revisar (§33 y §43 de PENDIENTES; decisiones de Rocío del 25/10 y maqueta del 27/10): lo que quedó para
// revisar al corregir una tabla de tarifas o registrar una nueva, o porque cambió el orden del día de un cliente y
// recorrido (el primer y el segundo viaje del día; Tipo_Cambio "Orden del día"), en api/Tarifario/Revisar. La API
// devuelve solo lo que el usuario puede resolver: los presupuestos, a quien tiene permiso de presupuestos; los viajes, a
// quien gestiona viajes; las proformas y los comprobantes, a quien gestiona proformas o cuenta corriente. Lo usan
// Presupuestos, Proformas, Viajes (y su Ver detalle) y la tarjeta fija del dashboard (tarjetaFija):
//   - en la fila, al lado del estado, el ícono rojo de "falta resolver algo" (§4.3): icono(filas, texto, etiqueta), con
//     el globito de globo(filas) (qué pasó y, en gris, dónde se resuelve);
//   - adentro (detalle o edición), el aviso amarillo con qué cambió y qué falta (§5.1: "Como está…, es necesario que…"):
//     aviso(filas), o avisoPrecio(contenedor, filas, opciones) en el viaje, con los botones para resolverlo ahí mismo.
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

  // El mismo ícono, con el globito de globo(filas, opciones): qué pasó y dónde se resuelve.
  function iconoPrecio(filas, etiqueta, opciones) {
    if (!filas || !filas.length) return '';
    return window.SGTL.botonInfo('urgente', globo(filas, opciones), etiqueta || 'Ver qué cambió');
  }

  function esOrden(r) { return r.Tipo_Cambio === 'Orden del día'; }

  // De dónde salió, corto (para el tablero): "Corrección del 25/10/2026: el valor … estaba mal cargado." o, por el orden
  // del día, "Se eliminó el viaje #44 (28/10/2026)."
  function causa(r) {
    var motivo = (r.Motivo || '').trim().replace(/\.$/, '');
    if (esOrden(r)) return motivo + '.';
    // La tabla siempre nombrada (M5 de la prueba en la VM del 25/10): 'Corrección de "Tarifas a agosto 2026" del 25/10/2026: …'.
    return (r.Tipo_Cambio === 'Tabla nueva' ? 'Tabla nueva "' + r.Tabla + '"' : 'Corrección de "' + r.Tabla + '"') + ' del ' + window.SGTL.fecha(r.Fecha) +
      (motivo ? ': ' + motivo : '') + '.';
  }

  function monto(v) { return window.SGTL.monto(v == null ? 0 : v); }
  function cambio(r) { return monto(r.Importe_Anterior) + ' → ' + monto(r.Importe_Nuevo); }

  // Por el orden del día: "único", "primer" o "segundo" (viaje del día).
  function lugar(r) { return r.Unico ? 'único' : r.Vuelta_Nueva === 1 ? 'primer' : 'segundo'; }
  var ESTADO_VIAJE = { En_viaje: 'en viaje', Entregado: 'entregado', Listo_para_facturar: 'listo para facturar', Facturado: 'facturado' };

  function nota(r) {
    var diferencia = (r.Importe_Nuevo || 0) - (r.Importe_Anterior || 0);
    return 'una nota de ' + (diferencia < 0 ? 'crédito' : 'débito') + ' por ' + monto(Math.abs(diferencia)) + ' (más IVA)';
  }

  // Por qué no se cambia solo y qué hace falta, como un hecho (§5.1 del design system). opciones: enLaProforma (en el
  // detalle de la proforma: "esta proforma"), estado y dePresupuesto (del viaje, en Ver detalle o Editar).
  function porQueNoSolo(r, opciones) {
    if (r.Tipo === 'Presupuesto') return 'Como está aceptado no se cambia solo, es necesario que lo revises.';
    if (r.Tipo === 'Proforma') return 'Como está en ' + (opciones.enLaProforma ? 'esta proforma' : 'la proforma ' + (r.Documento || '')) +
      ' no se cambia solo, es necesario que la anules, la generes de nuevo y se la envíes otra vez al cliente.';
    if (r.Tipo === 'Comprobante') return 'Como está facturado' + (r.Documento ? ' en ' + r.Documento : '') + ' no se cambia solo, es necesario emitir ' + nota(r) + '.';
    if (opciones.dePresupuesto) return 'Como es de un presupuesto aceptado no se cambia solo, es necesario que lo revises.';
    var estado = ESTADO_VIAJE[opciones.estado];
    return 'Como ' + (estado ? 'está ' + estado : 'ya salió') + ' no se cambia solo, es necesario que lo revises.';
  }

  // El título y el texto de una sola cosa para revisar.
  function partesDe(r, opciones) {
    if (esOrden(r)) {
      var antes = r.Tipo === 'Presupuesto' ? 'los ' + monto(r.Importe_Anterior) + ' que aceptó el cliente' : monto(r.Importe_Anterior);
      return {
        titulo: 'Precio para revisar' + (opciones.enLaProforma && r.Viaje_ID ? ': viaje #' + r.Viaje_ID : ''),
        texto: 'Ahora es el ' + lugar(r) + ' viaje del día de este cliente y recorrido: le corresponde ' + monto(r.Importe_Nuevo) +
          ' en lugar de ' + antes + '. ' + porQueNoSolo(r, opciones)
      };
    }
    // opciones.enEditar: en Editar presupuesto no está "Enviar por e-mail" (M6, 25/10).
    return {
      titulo: 'Cambió la tarifa' + (opciones.enLaProforma && r.Viaje_ID ? ' del viaje #' + r.Viaje_ID : '') + ': ' + cambio(r),
      texto: r.Tipo !== 'Presupuesto' ? porQueNoSolo(r, opciones)
        : opciones.enEditar ? 'Es necesario que se lo reenvíes al cliente desde Ver PDF → Enviar por e-mail.'
        : 'Es necesario que se lo reenvíes al cliente con "Enviar por e-mail".'
    };
  }

  function htmlBoton(b) {
    var esc = window.SGTL.escapar;
    var clase = 'btn btn-sm ' + (b.clase || 'btn-outline-primary');
    if (b.href) return '<a class="' + clase + '" href="' + esc(b.href) + '">' + esc(b.texto) + '</a>';
    return '<button type="button" class="' + clase + '"' + (b.datos || '') + '>' + esc(b.texto) + '</button>';
  }

  // El aviso de adentro, corto (pedido de Rocío, 25/10): qué cambió y qué falta. De dónde salió el cambio (tabla, fecha y
  // motivo) está en el tablero y en la auditoría. opciones: enLaProforma, enEditar, estado y dePresupuesto (ver arriba),
  // boton ({ texto, clase }: la acción para corregirlo ahí mismo, con data-sgtl-corregir; en la proforma, "Anular
  // proforma") o botones (lista de { texto, clase, href o datos }).
  function aviso(filas, opciones) {
    if (!filas || !filas.length) return '';
    opciones = opciones || {};
    var esc = window.SGTL.escapar;
    var r = filas[0];
    var titulo, lista = '', texto;
    if (filas.length > 1) {
      titulo = (filas.some(esOrden) ? 'Cambió el precio de ' : 'Cambió la tarifa de ') + filas.length + ' viajes';
      lista = '<ul class="mb-0 ps-3">' + filas.map(function (f) {
        return '<li>Viaje #' + esc(f.Viaje_ID) + ': ' + esc(cambio(f)) + (esOrden(f) ? ' (ahora es el ' + esc(lugar(f)) + ' viaje del día)' : '') + '</li>';
      }).join('') + '</ul>';
      texto = porQueNoSolo(r, opciones);
    } else {
      var partes = partesDe(r, opciones);
      titulo = partes.titulo;
      texto = partes.texto;
    }
    var botones = (opciones.botones || []).slice();
    if (opciones.boton) botones.push({ texto: opciones.boton.texto, clase: opciones.boton.clase, datos: ' data-sgtl-corregir' });
    return '<div class="alert alert-warning" role="status"><div class="fw-bold">' + esc(titulo) + '</div>' + lista +
      '<div class="mt-1">' + esc(texto) + '</div>' +
      (botones.length ? '<div class="mt-2 d-flex flex-wrap gap-2">' + botones.map(htmlBoton).join('') + '</div>' : '') + '</div>';
  }

  // El globito del ícono de la fila (maqueta del 27/10, §3): título, qué pasó y, en gris, dónde se resuelve. opciones:
  // enLaProforma (en la lista de proformas), donde (para lo que se decide en el documento: "Ver detalle del viaje").
  function globo(filas, opciones) {
    if (!filas || !filas.length) return '';
    opciones = opciones || {};
    var esc = window.SGTL.escapar;
    return filas.map(function (r) {
      var que, falta;
      if (esOrden(r)) {
        var porque = (r.Motivo || '').trim().replace(/\s*\(\d{2}\/\d{2}\/\d{4}\)\.?$/, '').replace(/\.$/, '');
        que = (opciones.enLaProforma && r.Viaje_ID ? 'Al viaje #' + r.Viaje_ID + ' le corresponde' : 'Le corresponde') + ' el precio de ' +
          (r.Vuelta_Nueva === 1 ? 'primer' : 'segundo') + ' viaje del día (' + monto(r.Importe_Nuevo) + ')' +
          (porque ? ': ' + porque.charAt(0).toLowerCase() + porque.slice(1) : '') + '.';
      } else {
        que = (opciones.enLaProforma && r.Viaje_ID ? 'El viaje #' + r.Viaje_ID + ' pasa' : 'Pasa') + ' de ' + monto(r.Importe_Anterior) + ' a ' + monto(r.Importe_Nuevo) + '.';
      }
      if (r.Tipo === 'Proforma') falta = 'Como está en ' + (opciones.enLaProforma ? 'esta proforma' : 'la proforma ' + (r.Documento || '')) +
        ' no se cambia solo, es necesario que la anules y la generes de nuevo.';
      else if (r.Tipo === 'Comprobante') falta = 'Como está facturado' + (r.Documento ? ' en ' + r.Documento : '') +
        ' no se cambia solo, es necesario emitir ' + nota(r).replace(/ por .*$/, '') + ' en Cuenta corriente.';
      else falta = 'Es necesario que lo revises en ' + (opciones.donde || 'Ver detalle del viaje') + '.';
      return '<div class="fw-bold mb-1">' + (esOrden(r) ? 'Precio para revisar' : 'Cambió la tarifa') + '</div><div>' + esc(que) + '</div>' +
        '<div class="suave mt-2">' + esc(falta) + '</div>';
    }).join('<div class="mt-2"></div>');
  }

  // ---------------------------------------------------------------- Adentro del viaje: resolverlo ahí mismo

  function usuario() { try { return window.localStorage.getItem('username') || 'sistema'; } catch (e) { return 'sistema'; } }

  // POST con el error de la API en error.mensajeUsuario (lo muestra SGTL.confirmar dentro del modal).
  function enviar(url, cuerpo, noSePudo) {
    return window.fetch(url, { method: 'POST', headers: encabezados(true), body: JSON.stringify(cuerpo || {}) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (datos) {
          if (r.ok) return datos || {};
          var error = new Error('HTTP ' + r.status);
          error.mensajeUsuario = r.status === 404 ? 'Ya estaba resuelto.' : (datos && (datos.error || datos.Mensaje)) || noSePudo;
          throw error;
        });
      });
  }

  function resolverRevisar(id, como) {
    return enviar(API + '/Tarifario/Revisar/' + encodeURIComponent(id) + '/Resolver', { Como: como }, 'No se pudo marcar como resuelto. Probá de nuevo.');
  }

  // "Actualizar el precio" y "Mantener el precio" (maqueta del 27/10, §5).
  function actualizarPrecio(r, opciones) {
    var mensaje = '';
    return window.SGTL.confirmar({
      titulo: '¿Actualizar el precio del viaje #' + r.Viaje_ID + '?',
      mensaje: 'Pasa de ' + monto(r.Importe_Anterior) + ' a ' + monto(r.Importe_Nuevo) + ', el precio de ' + (r.Vuelta_Nueva === 1 ? 'primer' : 'segundo') +
        ' viaje del día. Después es necesario que le avises al cliente del precio nuevo.',
      verbo: 'Actualizar precio',
      accion: function () {
        return enviar(API + '/Viajes/' + encodeURIComponent(r.Viaje_ID) + '/Precio', { Usuario: usuario() }, 'No se pudo actualizar el precio. Probá de nuevo.')
          .then(function (d) { mensaje = d.Message || ''; });
      }
    }).then(function (hecho) {
      if (!hecho) return;
      window.SGTL.toastExito(mensaje || 'Precio del viaje #' + r.Viaje_ID + ' actualizado. Es necesario que le avises al cliente.');
      if (opciones.alResolver) opciones.alResolver();
    });
  }

  function nombreDe(r) { return r.Tipo === 'Presupuesto' ? 'presupuesto #' + r.Presupuesto_ID : 'viaje #' + r.Viaje_ID; }

  function mantenerPrecio(r, opciones) {
    return window.SGTL.confirmar({
      titulo: '¿Mantener el precio del ' + nombreDe(r) + '?',
      mensaje: 'Queda en ' + monto(r.Importe_Anterior) + ' (' + (r.Vuelta_Nueva === 1 ? 'segundo' : 'primer') + ' viaje del día) y deja de estar para revisar.',
      verbo: 'Mantener precio',
      motivo: { etiqueta: 'Motivo', obligatorio: false, placeholder: 'Por ejemplo: precio acordado con el cliente', ayuda: 'Opcional. Queda en Auditoría.' },
      accion: function (motivo) {
        return resolverRevisar(r.Revisar_ID, 'Se mantuvo el precio de ' + monto(r.Importe_Anterior) + (motivo ? '. Motivo: ' + motivo.replace(/\.$/, '') : '') + '.');
      }
    }).then(function (hecho) {
      if (!hecho) return;
      window.SGTL.toastExito('Precio del ' + nombreDe(r) + ' mantenido en ' + monto(r.Importe_Anterior) + '.');
      if (opciones.alResolver) opciones.alResolver();
    });
  }

  function marcarResuelto(r, opciones) {
    return window.SGTL.confirmar({
      titulo: '¿Marcar como resuelto?',
      mensaje: 'Deja de aparecer en la lista y en el viaje. Contá cómo se resolvió.',
      verbo: 'Marcar como resuelto',
      motivo: { etiqueta: 'Cómo se resolvió', obligatorio: true },
      accion: function (como) { return resolverRevisar(r.Revisar_ID, como); }
    }).then(function (hecho) {
      if (!hecho) return;
      window.SGTL.toastExito('Marcado como resuelto.');
      if (opciones.alResolver) opciones.alResolver();
    });
  }

  // Lo que se puede hacer desde el viaje (o el presupuesto) con cada cosa para revisar.
  function botonesDe(r, opciones) {
    var datos = function (accion) { return ' data-sgtl-precio="' + accion + '" data-revisar="' + r.Revisar_ID + '"'; };
    if (r.Tipo === 'Presupuesto' && esOrden(r) && opciones.alVolverAPendiente)
      return [{ texto: 'Volver a Pendiente', datos: datos('pendiente') }, { texto: 'Mantener el precio', clase: 'btn-light-secondary', datos: datos('mantener') }];
    if (r.Tipo === 'Viaje') return [{ texto: 'Actualizar el precio', datos: datos('actualizar') }, { texto: 'Mantener el precio', clase: 'btn-light-secondary', datos: datos('mantener') }];
    if (r.Tipo === 'Proforma' && r.Proforma_ID) return [{ texto: 'Ver la proforma', href: DESTINO.Proforma(r) }];
    if (r.Tipo === 'Comprobante') return [{ texto: 'Ver la cuenta corriente', href: 'cuenta-corriente-clientes.html' },
      { texto: 'Marcar como resuelto', clase: 'btn-light-secondary', datos: datos('resolver') }];
    return [];
  }

  // Adentro del viaje (Ver detalle y Editar, maqueta del 27/10, §4) o del presupuesto (Ver PDF, §7): un aviso por cada
  // cosa para revisar, con sus botones. opciones: { estado y dePresupuesto (del viaje), alResolver() (después de
  // resolverlo: volver a mostrar el viaje), alVolverAPendiente(fila) (en presupuestos) }.
  function avisoPrecio(contenedor, filas, opciones) {
    var el = typeof contenedor === 'string' ? document.querySelector(contenedor) : contenedor;
    if (!el) return;
    opciones = opciones || {};
    filas = filas || [];
    el.innerHTML = filas.map(function (r) { return aviso([r], Object.assign({}, opciones, { botones: botonesDe(r, opciones) })); }).join('');
    el.onclick = function (evento) {
      var boton = evento.target.closest('[data-sgtl-precio]');
      if (!boton) return;
      var r = filas.filter(function (f) { return String(f.Revisar_ID) === boton.getAttribute('data-revisar'); })[0];
      if (!r) return;
      var accion = boton.getAttribute('data-sgtl-precio');
      if (accion === 'actualizar') actualizarPrecio(r, opciones);
      else if (accion === 'mantener') mantenerPrecio(r, opciones);
      else if (accion === 'pendiente') opciones.alVolverAPendiente(r);
      else marcarResuelto(r, opciones);
    };
  }

  // Qué puede ver el usuario: { Presupuestos, Facturacion, Viajes }.
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

  // "Cambios para revisar" (antes "Cambios de tarifa para revisar"; maqueta del 27/10, §8). No se saca ni se elige con la
  // estrella (Rocío, 25/10): la ve quien puede resolver algo, arriba del dashboard y primera en Tableros → Facturación (con
  // la estrella fija), y desaparece cuando no hay nada. Cada fila lleva a donde se corrige: el presupuesto (Ver PDF, para
  // reenviarlo, o su detalle si es por el orden del día), el viaje (Ver detalle, para actualizar o mantener el precio), la
  // proforma (su detalle, para anularla; al anularla queda resuelto) o el viaje que está en un comprobante (Ver detalle).
  // La nota de crédito o de débito se emite en cuenta corriente: eso se marca como resuelto a mano, con cómo se resolvió.
  var DESTINO = {
    Presupuesto: function (r) { return 'presupuestos.html?presupuesto=' + encodeURIComponent(r.Presupuesto_ID); },
    Proforma: function (r) { return 'gestion-facturacion.html?proforma=' + encodeURIComponent(r.Proforma_ID); }
  };

  function filaTarjeta(r) {
    var esc = window.SGTL.escapar;
    var documento = r.Tipo === 'Presupuesto' ? (r.Documento || 'Presupuesto #' + r.Presupuesto_ID)
      : r.Tipo === 'Viaje' ? 'Viaje #' + r.Viaje_ID
      : (r.Documento || '') + (r.Viaje_ID ? ' · viaje #' + r.Viaje_ID : '');
    var ir = DESTINO[r.Tipo] ? DESTINO[r.Tipo](r) : null;
    var acciones = [];
    if (r.Tipo === 'Presupuesto' && esOrden(r)) acciones.push(window.SGTL.botonFila('ver', { texto: 'Ver el presupuesto', datos: { ir: ir } }));
    else if (r.Tipo === 'Presupuesto') acciones.push(window.SGTL.botonFila('pdf', { texto: 'Ver PDF para reenviarlo', datos: { ir: ir } }));
    else if (r.Tipo === 'Proforma') acciones.push(window.SGTL.botonFila('ver', { texto: 'Ver la proforma para anularla', datos: { ir: ir } }));
    else if (r.Tipo === 'Viaje') acciones.push(window.SGTL.botonFila('ver', { texto: 'Ver detalle del viaje #' + r.Viaje_ID, datos: { viaje: r.Viaje_ID } }));
    else {
      acciones.push(window.SGTL.botonFila('ver', { texto: 'Ver detalle del viaje #' + r.Viaje_ID, datos: { viaje: r.Viaje_ID } }));
      acciones.push(window.SGTL.botonFila('siguiente', { texto: 'Marcar como resuelto', icono: 'bi-check2-circle', datos: { resolver: r.Revisar_ID } }));
    }
    return '<tr>' +
      '<td>' + (ir ? '<a href="' + esc(ir) + '">' + esc(documento) + '</a>' : esc(documento)) +
      '<small class="d-block text-muted">' + esc(r.Cliente || '—') + '</small>' +
      // En pantallas chicas, qué hacer va debajo del documento (la columna no entra).
      '<small class="d-block d-md-none mt-1">' + esc(r.Que_Hacer) + '</small></td>' +
      // El que le corresponde y, en gris, el que tiene hoy.
      '<td class="text-end text-nowrap">' + esc(monto(r.Importe_Nuevo)) + '<small class="d-block text-muted">hoy ' + esc(monto(r.Importe_Anterior)) + '</small></td>' +
      '<td class="d-none d-md-table-cell">' + esc(r.Que_Hacer) + '<small class="d-block text-muted">' + esc(causa(r)) + '</small></td>' +
      '<td class="text-center">' + window.SGTL.accionesFila(acciones) + '</td></tr>';
  }

  // Devuelve una promesa: true si hay algo (la tarjeta se ve), false si no (desaparece; maqueta del 27/10).
  function dibujarTarjeta(contenedor) {
    var cuerpo = contenedor.querySelector('tbody');
    var cantidad = contenedor.querySelector('[data-sgtl="cantidad"]');
    return cargar().then(function (filas) {
      contenedor.hidden = !filas.length;
      if (!filas.length) return false;
      // "Pendiente · 1" (con "Hoy" parecía que era solo lo de hoy, M5, 25/10).
      cantidad.textContent = filas.length === 1 ? 'Pendiente · 1' : 'Pendientes · ' + filas.length;
      cuerpo.innerHTML = filas.map(filaTarjeta).join('');
      return true;
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
  var ESTRELLA_FIJA = 'No se puede quitar del dashboard: está fijo para quien resuelve los cambios para revisar';

  // opciones.estrellaFija: true en Tableros. Devuelve una promesa: true si la tarjeta se muestra (el usuario puede
  // resolver algo y hay algo para revisar), false si no.
  function tarjetaFija(contenedor, opciones) {
    if (!contenedor) return Promise.resolve(false);
    opciones = opciones || {};
    return alcance().then(function (a) {
      if (!a.Presupuestos && !a.Facturacion && !a.Viajes) { contenedor.innerHTML = ''; contenedor.hidden = true; return false; }
      contenedor.hidden = true;
      var estrella = opciones.estrellaFija
        ? '<span class="sgtl-envoltura-deshabilitado" tabindex="0" data-bs-toggle="tooltip" title="' + ESTRELLA_FIJA + '">' +
          '<button type="button" class="btn btn-sm dash-estrella" disabled aria-pressed="true" aria-label="' + ESTRELLA_FIJA + '">' +
          '<i class="bi bi-star-fill" aria-hidden="true"></i></button></span>'
        : '';
      contenedor.innerHTML = '<div class="card rounded custom-card dash-tarjeta sgtl-cambios-tarifa" data-tablero="cambiostarifa">' +
        '<div class="card-header"><i class="bi bi-exclamation-circle text-danger" aria-hidden="true"></i><h5>Cambios para revisar</h5>' +
        '<span class="dash-alcance" data-sgtl="cantidad"></span>' + estrella + '</div>' +
        '<div class="card-body p-0"><table class="table table-striped table-hover dash-tabla mb-0"><thead><tr><th>Documento</th>' +
        '<th class="text-end">Importe</th><th class="d-none d-md-table-cell">Qué falta</th><th class="text-center">Acciones</th></tr></thead>' +
        '<tbody><tr><td colspan="4" class="text-center text-muted py-4">Cargando…</td></tr></tbody></table></div></div>';
      contenedor.onclick = function (evento) {
        var boton = evento.target.closest('[data-ir], [data-viaje], [data-resolver]');
        if (!boton || boton.disabled) return;
        if (boton.dataset.ir) window.location.href = boton.dataset.ir;
        else if (boton.dataset.viaje) verViaje(boton.dataset.viaje);
        else resolver(contenedor, boton.dataset.resolver);
      };
      // Se actualizó o se mantuvo el precio de un viaje desde su Ver detalle: la tarjeta, sin eso.
      if (!contenedor.getAttribute('data-sgtl-escucha')) {
        contenedor.setAttribute('data-sgtl-escucha', '1');
        document.addEventListener('sgtl:viaje-cambiado', function () { dibujarTarjeta(contenedor); });
      }
      return dibujarTarjeta(contenedor);
    });
  }

  window.SGTLCambiosTarifa = {
    cargar: cargar, de: de, icono: icono, iconoPrecio: iconoPrecio, globo: globo, aviso: aviso, avisoPrecio: avisoPrecio, causa: causa, esOrden: esOrden,
    alcance: alcance, presupuestoEnviado: presupuestoEnviado, tarjetaFija: tarjetaFija
  };
})(window);
