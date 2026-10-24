// Ver detalle del viaje (§1.4, §6.2): el mismo modal en Listar viajes, Gestionar viajes y el dashboard.
// Usa los bloques del formulario de Registrar viaje (opción B de Rocío, 22/10): Recorrido · Fechas, camión y chofer ·
// Tarifa · Entrega · Números de referencia, cada dato con su nombre chico arriba y el valor en texto. Pie: solo Cerrar.
// Uso: SGTLDetalleViaje.abrir(viaje, { enlaceGestion: true }), con viaje = una fila de api/Viajes/Buscar.
// Va después de jQuery, app.js y sgtl-ui.js.
(function (window, document) {
  'use strict';

  var API = 'http://localhost:50222/api';
  var ESTADOS = { Registrado: 'Registrado', En_viaje: 'En viaje', Entregado: 'Entregado', Listo_para_facturar: 'Listo para facturar', Facturado: 'Facturado' };
  // Resultado de la entrega (§4.1): Completa verde, Parcial amarillo, Rechazo rojo.
  var COLOR_RESULTADO = { Completa: 'verde', Parcial: 'amarillo', Rechazo: 'rojo' };
  var listas = null;
  var apertura = 0;

  function esc(valor) { return SGTL.escapar(valor); }
  function texto(valor) { var t = String(valor == null ? '' : valor).trim(); return t ? esc(t) : '—'; }
  function etiquetaInformativa(t) { return '<span class="badge rounded-pill bg-white text-dark border">' + esc(t) + '</span>'; }
  // Km como los guarda la API ("146.8") o como se escriben ("146,8").
  function kmNumero(valor) {
    var t = String(valor == null ? '' : valor).trim();
    if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
    var n = Number(t);
    return t && isFinite(n) ? n : NaN;
  }
  function pedir(ruta) {
    return SGTL.ajax({ url: API + ruta, type: 'GET' }).catch(function () { return null; });
  }
  function porId(lista, campo) {
    var mapa = {};
    (lista || []).forEach(function (x) { mapa[x[campo]] = x; });
    return mapa;
  }

  // Choferes, camiones, orígenes y destinos: una sola vez por página (si fallan todos, se vuelven a pedir).
  function cargarListas() {
    if (!listas) {
      listas = Promise.all([pedir('/Choferes'), pedir('/Camiones'), pedir('/Origen'), pedir('/Destino')]).then(function (r) {
        if (!r[0] && !r[1] && !r[2] && !r[3]) listas = null;
        return {
          choferes: porId(r[0], 'Chofer_ID'), camiones: porId(r[1], 'Camion_ID'),
          origenes: porId(r[2], 'Origen_ID'), destinos: porId(r[3], 'Destino_ID')
        };
      });
    }
    return listas;
  }

  // Importe del viaje: el que guardó al calcular su tarifa (desde el 24/10, con el tarifario, el falso flete y la
  // estadía). Si es de antes y no lo tiene: el del presupuesto aceptado si viene de uno; si no, la tarifa fija o la
  // tarifa por km × km (el mismo orden que usa la proforma).
  function importe(v) {
    if (v.Importe != null) {
      var conAdicionales = v.Falso_Flete || v.Estadia_Modulos > 0;
      return Promise.resolve({ importe: v.Importe, detalle: (conAdicionales ? v.Importe_Detalle : v.Tarifa_Detalle) || 'tarifa guardada' });
    }
    var km = kmNumero(v.Distancia_KM);
    var porTarifa = function () {
      if (v.TarifaFijaID > 0) {
        return pedir('/Tarifas/Fijas/' + v.TarifaFijaID).then(function (t) {
          return t ? { importe: t.ValorFijoNeto, detalle: 'tarifa fija de la ruta' } : null;
        });
      }
      if (v.TarifaKmID > 0) {
        return pedir('/Tarifas/Km/' + v.TarifaKmID).then(function (t) {
          if (!t) return null;
          return { importe: Math.round(Number(t.ValorKm) * (km || 0) * 100) / 100, detalle: SGTL.monto(t.ValorKm) + ' por km' };
        });
      }
      return Promise.resolve(null);
    };
    if (!v.Presupuesto_ID) return porTarifa();
    return pedir('/Presupuestos').then(function (lista) {
      var p = (lista || []).filter(function (x) { return x.id === v.Presupuesto_ID; })[0];
      var valor = p && String(p.importe == null ? '' : p.importe).trim() !== '' ? Number(String(p.importe).replace(',', '.')) : NaN;
      return isFinite(valor) ? { importe: valor, detalle: 'la del presupuesto #' + v.Presupuesto_ID } : porTarifa();
    });
  }

  function direccion(o) {
    if (!o) return '';
    var calle = ((o.Calle || '').trim() + ' ' + (o.AlturaCalle || '').trim()).trim();
    var localidad = (o.NombreLocalidad || '').trim(), provincia = (o.NombreProvincia || '').trim();
    // "Córdoba, Córdoba" se ve una sola vez.
    return [calle, localidad, provincia.toLowerCase() === localidad.toLowerCase() ? '' : provincia].filter(Boolean).join(', ');
  }

  function dato(nombre, valor) {
    return '<div class="sgtl-dato"><span class="sgtl-dato-etiqueta">' + nombre + '</span><div class="sgtl-dato-valor">' + valor + '</div></div>';
  }
  function par(a, b) { return '<div class="row"><div class="col-6">' + a + '</div><div class="col-6">' + (b || '') + '</div></div>'; }
  function bloque(titulo, html, ancho) {
    return '<section class="sgtl-bloque' + (ancho ? ' sgtl-detalle-ancho' : '') + '"><div class="sgtl-bloque-titulo">' + titulo + '</div>' + html + '</section>';
  }

  function asegurarModal() {
    if (document.getElementById('modalVerViaje')) return;
    var nodo = document.createElement('div');
    nodo.innerHTML =
      '<div class="modal fade" id="modalVerViaje" tabindex="-1" aria-labelledby="verViajeTitulo" aria-hidden="true">' +
      '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg modal-fullscreen-sm-down"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title d-flex align-items-center flex-wrap gap-2" id="verViajeTitulo">Ver detalle del viaje</h5>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
      '<div class="modal-body" id="verViajeCuerpo"></div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cerrar</button></div>' +
      '</div></div></div>';
    document.body.appendChild(nodo.firstChild);
  }

  function titulo(v) {
    var html = '<span>Ver detalle del viaje #' + esc(v.Viaje_ID) + '</span>' +
      SGTL.estado(v.Estado || 'Registrado', ESTADOS[v.Estado] || v.Estado || 'Registrado');
    if (v.EnProforma_ID) html += etiquetaInformativa('En ' + (v.EnProforma_Numero || ('borrador de proforma #' + v.EnProforma_ID)));
    if (v.Presupuesto_ID) html += etiquetaInformativa('Del presupuesto #' + v.Presupuesto_ID);
    return html;
  }

  function cuerpo(v, l, imp, completo, opciones) {
    var rukas = (v.Tipo_Cliente || 'Directo') === 'Con_plataforma';
    var origen = l.origenes[v.OrigenID], destino = l.destinos[v.DestinoID];
    var chofer = l.choferes[v.ChoferID], camion = l.camiones[v.CamionID];
    var km = kmNumero(v.Distancia_KM);
    var conDireccion = function (nombre, o) {
      var dir = direccion(o);
      return texto(nombre) + (dir ? '<div class="suave">' + esc(dir) + '</div>' : '');
    };

    var recorrido = par(dato('Cliente', texto(v.Cliente) + (rukas ? ' ' + etiquetaInformativa('Rukas') : '')),
      dato('Distancia', isNaN(km) ? '—' : esc(SGTL.km(km)) + ' km')) +
      par(dato('Origen', conDireccion(v.Origen, origen)), dato('Destino', conDireccion(v.Destino, destino)));
    var asignacion = par(dato('Inicio', texto(SGTL.fecha(v.Fecha_Inicio, { hora: true }))), dato('Fin', texto(SGTL.fecha(v.Fecha_Fin, { hora: true })))) +
      par(dato('Camión', camion ? texto(camion.Dominio) : (v.CamionID > 0 ? 'Camión #' + esc(v.CamionID) : '—')),
        dato('Chofer', chofer ? esc(((chofer.Nombre || '').trim() + ' ' + (chofer.Apellido || '').trim()).trim()) : (v.ChoferID > 0 ? 'Chofer #' + esc(v.ChoferID) : 'Sin asignar')));
    var tarifa = dato('Importe', imp ? '<strong>' + esc(SGTL.monto(imp.importe)) + '</strong> <span class="suave">neto · ' + esc(imp.detalle) + '</span>'
      : (v.TarifaFijaID > 0 || v.TarifaKmID > 0 || v.TarifarioID > 0 ? 'No se pudo leer el importe de la tarifa.' : 'Sin tarifa asignada.'));

    var entregado = !!(v.Resultado_Entrega || v.Fecha_Entrega);
    var evidencia = v.Tiene_Evidencia
      ? '<a href="' + API + '/Viajes/' + encodeURIComponent(v.Viaje_ID) + '/Evidencia" target="_blank" rel="noopener"><i class="bi bi-paperclip" aria-hidden="true"></i> Ver evidencia</a>'
      : '<span class="suave">' + (rukas ? 'Sin adjuntar (la constancia está en Rukas)' : 'Sin adjuntar') + '</span>';
    var entrega = entregado
      ? par(dato('Resultado', v.Resultado_Entrega ? SGTL.estado(v.Resultado_Entrega, v.Resultado_Entrega, COLOR_RESULTADO[v.Resultado_Entrega]) : '—'),
        dato('Fecha', texto(SGTL.fecha(v.Fecha_Entrega)))) + dato('Evidencia', evidencia)
      : dato('Resultado', '<span class="suave">Todavía no se registró la entrega.</span>') + (v.Tiene_Evidencia ? dato('Evidencia', evidencia) : '');
    var numeros = rukas
      ? par(dato('N° transporte SAP', texto(v.Num_Transporte)), dato('Número de remito', texto(v.Num_Remito))) + dato('N° entrega Rukas', texto(v.Num_de_Carga))
      : dato('Número de remito', texto(v.Num_Remito));

    var registro = completo ? esc(SGTL.textoRegistro((completo.Usu_Alta || '').trim(), SGTL.fecha(completo.Fecha_Alta, { hora: true }),
      (completo.Usu_Modi || '').trim(), SGTL.fecha(completo.Fecha_Modi, { hora: true }))) : '';
    var enlace = opciones.enlaceGestion && v.Estado !== 'Facturado' && v.Facturada !== true
      ? '<a class="d-inline-block mt-2" href="gestion-viajes.html?viaje=' + encodeURIComponent(v.Viaje_ID) + '"><i class="bi bi-box-arrow-up-right me-1" aria-hidden="true"></i>Abrir en Gestionar viajes</a>'
      : '';

    // En filas (pedido de Rocío, 22/10): los dos bloques de cada fila empiezan a la misma altura.
    return '<div class="sgtl-detalle-grilla">' + bloque('Recorrido', recorrido, true) +
      bloque('Fechas, camión y chofer', asignacion) + bloque('Tarifa', tarifa) +
      bloque('Entrega', entrega) + bloque('Números de referencia', numeros) +
      // Recorrido completo y costo (control interno, 24/10): lo dibuja costos-viaje.js cuando llega.
      '<section class="sgtl-bloque sgtl-detalle-ancho d-none" id="verViajeCosto"></section></div>' +
      (registro ? '<div class="sgtl-detalle-pie mt-3">' + registro + '</div>' : '') + enlace;
  }

  // Los módulos del costo se cargan solos: las pantallas que usan este detalle no tienen que sumar nada.
  function cargarScript(src, yaEsta) {
    if (yaEsta()) return Promise.resolve();
    return new Promise(function (listo, fallo) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = listo;
      s.onerror = fallo;
      document.head.appendChild(s);
    });
  }

  function mostrarCosto(viaje, numero) {
    cargarScript('assets/static/js/google-maps.js', function () { return !!window.SGTLGoogleMaps; })
      .then(function () { return cargarScript('assets/static/js/galpon-km.js', function () { return !!window.SGTLGalpon; }); })
      .then(function () { return cargarScript('assets/static/js/costos-viaje.js', function () { return !!window.SGTLCostosViaje; }); })
      .then(function () {
        window.SGTLCostosViaje.dibujar(viaje.Viaje_ID, document.getElementById('verViajeCosto'), function () { return numero === apertura; });
      }, function () { /* sin los módulos, el detalle se ve igual, sin el costo */ });
  }

  function abrir(viaje, opciones) {
    if (!viaje) return;
    opciones = opciones || {};
    asegurarModal();
    var numero = ++apertura;
    document.getElementById('verViajeTitulo').innerHTML = titulo(viaje);
    document.getElementById('verViajeCuerpo').innerHTML = '<p class="text-muted text-center my-4">Cargando…</p>';
    SGTL.modal('#modalVerViaje', 'show');
    Promise.all([cargarListas(), importe(viaje), pedir('/Viajes/' + encodeURIComponent(viaje.Viaje_ID))]).then(function (r) {
      if (numero !== apertura) return;
      document.getElementById('verViajeCuerpo').innerHTML = cuerpo(viaje, r[0], r[1], r[2], opciones);
      mostrarCosto(viaje, numero);
    });
  }

  window.SGTLDetalleViaje = { abrir: abrir };
})(window, document);
