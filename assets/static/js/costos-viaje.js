// Ver detalle del viaje → "Recorrido completo y costo" (control interno, 24/10, para la oficina; el chofer no lo ve).
// El recorrido real del camión: galpón → origen (vacío) → destino → galpón (vacío); el combustible estimado (km × consumo
// del camión × precio del gasoil a la fecha del viaje); los gastos que rindió el chofer con su ticket; y el margen
// estimado: el importe del viaje menos el combustible estimado y los demás gastos rendidos.
// Uso (lo llama viaje-detalle.js): SGTLCostosViaje.dibujar(viajeId, contenedor, sigueAbierto, { alCargarGasto }).
// "Cargar gasto" (Rocío, 27/10, punto 33 de la §41): quien gestiona viajes, como excepción, con el viaje entregado o listo
// para facturar; si no se puede, el botón queda deshabilitado con el motivo que da la API (§1.4).
// Si faltan los km al galpón del origen o del destino, los calcula con SGTLGalpon (galpon-km.js) y vuelve a dibujar.
(function (window, document) {
  'use strict';

  var API = 'http://localhost:50222/api';

  function esc(valor) { return window.SGTL.escapar(valor); }
  function encabezados() {
    var token = '';
    try { token = localStorage.getItem('token') || ''; } catch (e) { }
    return { Authorization: 'Bearer ' + token };
  }
  function km(valor) { return valor == null ? '' : window.SGTL.km(valor) + ' km'; }
  // Litros y consumo sin decimales de más: "96 l", "35,5 l".
  function cantidad(valor) { return Number(valor).toLocaleString('es-AR', { maximumFractionDigits: 2 }); }
  function monto(valor) { return window.SGTL.monto(valor); }
  function suave(texto) { return '<div class="suave">' + texto + '</div>'; }
  function dato(nombre, valor) {
    return '<div class="sgtl-dato"><span class="sgtl-dato-etiqueta">' + nombre + '</span><div class="sgtl-dato-valor">' + valor + '</div></div>';
  }

  function pedir(viajeId) {
    return window.SGTL.ajax({ url: API + '/Costos/Viajes/' + encodeURIComponent(viajeId), type: 'GET', headers: encabezados() });
  }

  function tramo(desde, hasta, valor, faltante) {
    return '<li class="d-flex justify-content-between gap-3"><span>' + esc(desde) + ' → ' + esc(hasta) + '</span>' +
      '<span class="text-nowrap">' + (valor == null ? '<span class="text-muted">' + faltante + '</span>' : esc(km(valor))) + '</span></li>';
  }

  function recorrido(c, calculando) {
    if (!c.Galpon_Configurado) return dato('Recorrido completo', '<span class="text-muted">Falta cargar el galpón en Gestionar empresa.</span>');
    var faltante = calculando ? 'Calculando…' : 'Sin calcular';
    return dato('Recorrido completo',
      '<ul class="list-unstyled mb-1">' +
      tramo('Galpón', c.Origen || 'Origen', c.Km_Ida, faltante) +
      tramo(c.Origen || 'Origen', c.Destino || 'Destino', c.Km_Ruta, 'Sin km') +
      tramo(c.Destino || 'Destino', 'Galpón', c.Km_Vuelta, faltante) +
      '<li class="d-flex justify-content-between gap-3 fw-bold border-top pt-1 mt-1"><span>Total</span><span class="text-nowrap">' +
      (c.Km_Total == null ? '—' : esc(km(c.Km_Total))) + '</span></li></ul>' +
      (c.Km_Total == null && !calculando ? suave('Los km al galpón se calculan con Google Maps al abrir el detalle.') : ''));
  }

  function combustible(c) {
    var camion = 'el camión' + (c.Camion ? ' ' + esc(c.Camion) : '');
    if (c.Consumo_L_100km == null) return dato('Combustible estimado', '<span class="text-muted">Falta el consumo d' + camion + ' (Gestionar camiones).</span>');
    if (c.Precio_Litro == null) return dato('Combustible estimado', '<span class="text-muted">Falta el precio del gasoil a la fecha del viaje (Gestionar camiones).</span>');
    if (c.Combustible_Estimado == null) return dato('Combustible estimado', '<span class="text-muted">Falta el recorrido completo.</span>');
    return dato('Combustible estimado', '<strong>' + esc(monto(c.Combustible_Estimado)) + '</strong>' +
      suave(esc(cantidad(c.Litros_Estimados)) + ' l: ' + esc(cantidad(c.Consumo_L_100km)) + ' l cada 100 km d' + camion +
        ' y el gasoil a ' + esc(monto(c.Precio_Litro)) + ' el litro desde el ' + esc(window.SGTL.fecha(c.Precio_Desde))));
  }

  var TIPOS = { Combustible: 'Combustible', Peaje: 'Peaje', Comida: 'Comida', Otro: 'Otro' };

  function botonCargarGasto(c) {
    if (!c.Cargar_Gasto) return '';
    var motivo = c.Cargar_Gasto.Motivo;
    var boton = '<button type="button" class="btn btn-sm btn-outline-primary"' + (motivo ? ' disabled' : ' data-cargar-gasto') + '>' +
      '<i class="bi bi-receipt me-1" aria-hidden="true"></i>Cargar gasto</button>';
    return '<div class="mt-2">' + (motivo
      ? '<span class="sgtl-envoltura-deshabilitado d-inline-block" tabindex="0" data-bs-toggle="tooltip" title="' + esc(motivo) + '">' + boton + '</span>'
      : boton) + '</div>';
  }

  function gastos(c) {
    var lista = c.Gastos || [];
    if (!lista.length) return dato('Gastos del chofer', '<span class="text-muted">El chofer no cargó gastos.</span>' + botonCargarGasto(c));
    var filas = lista.map(function (g) {
      var detalle = [window.SGTL.fecha(g.Fecha), TIPOS[g.Tipo] || g.Tipo];
      if (g.Litros != null) detalle.push(cantidad(g.Litros) + ' l');
      if (g.Detalle) detalle.push(g.Detalle);
      return '<li class="d-flex justify-content-between align-items-baseline gap-3"><span>' + esc(detalle.join(' · ')) +
        ' <button type="button" class="btn btn-link btn-sm p-0 align-baseline" data-ticket-gasto="' + esc(g.Gasto_ID) + '">' +
        '<i class="bi bi-paperclip" aria-hidden="true"></i> Ver ticket</button></span>' +
        '<span class="text-nowrap">' + esc(monto(g.Importe)) + '</span></li>';
    }).join('');
    var rendido = lista.filter(function (g) { return g.Tipo === 'Combustible'; }).reduce(function (s, g) { return s + Number(g.Importe); }, 0);
    var comparacion = rendido > 0 && c.Combustible_Estimado != null
      ? suave('Combustible rendido ' + esc(monto(rendido)) + ' (estimado ' + esc(monto(c.Combustible_Estimado)) + ').') : '';
    return dato('Gastos del chofer', '<ul class="list-unstyled mb-1">' + filas +
      '<li class="d-flex justify-content-between gap-3 fw-bold border-top pt-1 mt-1"><span>Total</span><span class="text-nowrap">' +
      esc(monto(c.Gastos_Total)) + '</span></li></ul>' + comparacion + botonCargarGasto(c));
  }

  // Margen estimado = importe − combustible estimado − los gastos rendidos que no son combustible (el combustible ya va
  // estimado; el rendido sirve para compararlo). null si falta el importe o el combustible estimado.
  function otrosGastos(c) {
    return (c.Gastos || []).filter(function (g) { return g.Tipo !== 'Combustible'; }).reduce(function (s, g) { return s + Number(g.Importe); }, 0);
  }

  function calcularMargen(c) {
    if (c.Importe == null || c.Combustible_Estimado == null) return null;
    return Math.round((Number(c.Importe) - Number(c.Combustible_Estimado) - otrosGastos(c)) * 100) / 100;
  }

  function margen(c) {
    if (c.Importe == null) return dato('Margen estimado', '<span class="text-muted">El viaje no tiene importe guardado.</span>');
    if (c.Combustible_Estimado == null) return dato('Margen estimado', '<span class="text-muted">Falta el combustible estimado.</span>');
    var otros = otrosGastos(c);
    var valor = calcularMargen(c);
    return dato('Margen estimado', '<strong class="' + (valor < 0 ? 'text-danger' : '') + '">' + esc(monto(valor)) + '</strong>' +
      suave('Importe ' + esc(monto(c.Importe)) + ' − combustible estimado ' + esc(monto(c.Combustible_Estimado)) +
        (otros > 0 ? ' − otros gastos ' + esc(monto(otros)) : '')));
  }

  function mostrar(contenedor, c, calculando) {
    contenedor.innerHTML = '<div class="sgtl-bloque-titulo">Recorrido completo y costo</div>' +
      '<div class="row"><div class="col-12 col-md-6">' + recorrido(c, calculando) + combustible(c) + '</div>' +
      '<div class="col-12 col-md-6">' + gastos(c) + margen(c) + '</div></div>';
    contenedor.classList.remove('d-none');
  }

  // El ticket pide el token: se baja y se abre en una pestaña nueva (abierta antes, para que el navegador no la bloquee).
  function verTicket(gastoId) {
    var ventana = window.open('', '_blank');
    fetch(API + '/Costos/Gastos/' + encodeURIComponent(gastoId) + '/Comprobante', { headers: encabezados() })
      .then(function (r) { if (!r.ok) throw new Error(); return r.blob(); })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        if (ventana) ventana.location.href = url; else window.location.href = url;
      })
      .catch(function () {
        if (ventana) ventana.close();
        window.SGTL.toastError('No se pudo abrir el ticket. Probá de nuevo.');
      });
  }

  function dibujar(viajeId, contenedor, sigueAbierto, opciones) {
    if (!contenedor) return;
    sigueAbierto = sigueAbierto || function () { return true; };
    contenedor._sgtlCostos = opciones || {};
    if (!contenedor.dataset.sgtlTickets) {
      contenedor.dataset.sgtlTickets = 'true';
      contenedor.addEventListener('click', function (e) {
        var boton = e.target.closest('[data-ticket-gasto]');
        if (boton) verTicket(boton.getAttribute('data-ticket-gasto'));
        if (e.target.closest('[data-cargar-gasto]') && contenedor._sgtlCostos.alCargarGasto) contenedor._sgtlCostos.alCargarGasto();
      });
    }
    pedir(viajeId).then(function (c) {
      if (!sigueAbierto()) return;
      var faltan = c.Galpon_Configurado && (c.Km_Ida == null || c.Km_Vuelta == null);
      if (!faltan || !window.SGTLGalpon) { mostrar(contenedor, c); return; }
      mostrar(contenedor, c, true);
      window.SGTLGalpon.completar({ origen: c.Km_Ida == null ? c.OrigenID : null, destino: c.Km_Vuelta == null ? c.DestinoID : null })
        .then(function () { return pedir(viajeId); })
        .then(function (nuevo) { if (sigueAbierto()) mostrar(contenedor, nuevo); }, function () { if (sigueAbierto()) mostrar(contenedor, c); });
    }, function (error) {
      // Sin permiso para ver costos (403) el bloque no aparece; sin el script de la base (409), lo dice.
      if (!sigueAbierto() || (error.xhr && error.xhr.status === 403)) return;
      contenedor.innerHTML = '<div class="sgtl-bloque-titulo">Recorrido completo y costo</div><p class="text-muted mb-0">' +
        esc(error.mensajeUsuario || 'No se pudo calcular el costo del viaje.') + '</p>';
      contenedor.classList.remove('d-none');
    });
  }

  window.SGTLCostosViaje = { dibujar: dibujar, calcularMargen: calcularMargen };
})(window, document);
