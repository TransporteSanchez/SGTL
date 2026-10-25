// Tableros (24/10): el catálogo de todos los tableros, agrupados por tema, y los favoritos de cada usuario.
// Lo usan el dashboard (index.html: solo los favoritos, en la grilla de Personalizar) y la pantalla Tableros
// (tableros.html: todos, por pestaña, con la estrella). Los datos los dibuja dashboard.js, por el id de cada elemento:
// cada tablero aparece una sola vez por pantalla.
// Favoritos: api/tableros/favoritos (TablerosController), por usuario según el token. Quien todavía no eligió ve el
// diseño por defecto (el dashboard de siempre).
(function (window) {
  'use strict';

  var API = 'http://localhost:50222/api';

  var TEMAS = [
    { id: 'viajes', texto: 'Viajes' },
    { id: 'flota', texto: 'Flota' },
    { id: 'choferes', texto: 'Choferes' },
    { id: 'facturacion', texto: 'Facturación' }
  ];

  function kpi(id, conBarra) {
    return '<span class="dash-kpi-valor" id="' + id + '">—</span>' + (conBarra
      ? '<div class="progress" role="progressbar" aria-label="' + conBarra.etiqueta + '" aria-valuemin="0">' +
        '<div class="progress-bar ' + conBarra.clase + '" id="' + conBarra.id + '" style="width: 0%;"></div></div>'
      : '<small class="dash-kpi-detalle" id="' + id + '-detalle">&nbsp;</small>');
  }

  function cargandoTabla(id, columnas, encabezados) {
    return '<table class="table table-striped table-hover dash-tabla"><thead><tr>' + encabezados + '</tr></thead>' +
      '<tbody id="' + id + '"><tr><td colspan="' + columnas + '" class="text-center text-muted py-4">Cargando…</td></tr></tbody></table>';
  }

  function cargandoLista(id) {
    return '<div id="' + id + '" class="list-group list-group-flush"><div class="text-muted text-center py-4">Cargando…</div></div>';
  }

  // Cada tablero: id (la clave que se guarda en la base), título, tema, ícono (opcional), alcance (sin alcance sigue el
  // período; "Hoy" o "Histórico" no), tipo (kpi · grafico: ApexCharts, alto fijo · lista: alto fijo y se desplaza ·
  // natural: toma el alto que necesita en Tableros), tamaño en la grilla del dashboard (w de 12 columnas, h y minH en
  // filas de 62 px) y el cuerpo. En la pantalla Tableros aparecen en este orden, con el ancho tw (si no, w): los
  // indicadores en una fila y el resto debajo, armado para que cada fila se complete.
  var CATALOGO = [
    // ---- Viajes
    { id: 'kpiviajes', tema: 'viajes', titulo: 'Viajes', icono: 'bi-signpost-split text-primary', tipo: 'kpi', w: 3, h: 2, minH: 2, cuerpo: kpi('kpi-viajes') },
    { id: 'kpientregados', tema: 'viajes', titulo: 'Entregados', icono: 'bi-check2-circle text-success', tipo: 'kpi', w: 3, h: 2, minH: 2, cuerpo: kpi('kpi-entregados') },
    { id: 'kpipendientes', tema: 'viajes', titulo: 'Pendientes de entrega', icono: 'bi-hourglass-split text-secondary', tipo: 'kpi', w: 3, h: 2, minH: 2, cuerpo: kpi('kpi-pendientes') },
    { id: 'kpirechazo', tema: 'viajes', titulo: 'Entregados con rechazo', icono: 'bi-x-octagon text-danger', tipo: 'kpi', w: 3, h: 2, minH: 2, cuerpo: kpi('kpi-rechazo') },
    {
      id: 'revisar', tema: 'viajes', titulo: 'Para revisar', icono: 'bi-exclamation-circle text-warning', alcance: { id: 'revisar-cantidad', texto: 'Hoy' },
      tipo: 'lista', w: 8, h: 5, minH: 4, sinRelleno: true,
      cuerpo: '<div class="small text-muted px-3 py-2 d-none" id="revisar-resumen"></div>' +
        cargandoTabla('revisar-viajes', 3, '<th>Motivo</th><th class="d-none d-md-table-cell">Viaje</th><th class="text-center">Acciones</th>')
    },
    { id: 'proximos', tema: 'viajes', titulo: 'Próximos viajes', alcance: { id: 'proximos-cantidad', texto: '' }, tipo: 'lista', w: 4, h: 6, minH: 4, sinRelleno: true, cuerpo: cargandoLista('proximos-viajes') },
    { id: 'viajesmes', tema: 'viajes', titulo: 'Viajes por mes', tituloId: 'titulo-grafico-viajes', tipo: 'grafico', w: 8, tw: 12, h: 6, minH: 4, cuerpo: '<div id="grafico-viajes"></div>' },
    // Nuevo (24/10): tres datos, cliente × mes × resultado, en un gráfico chico por cliente con la misma escala.
    { id: 'clientesmes', tema: 'viajes', titulo: 'Viajes por cliente, mes y resultado', tituloId: 'titulo-clientesmes', tipo: 'natural', w: 12, h: 7, minH: 5, cuerpo: '<div id="clientes-mes"><p class="dash-mensaje">Cargando…</p></div>' },
    // Nuevos (24/10, segunda tanda): origen × destino × viajes y cliente × destino × % de entregas con rechazo.
    { id: 'recorridos', tema: 'viajes', titulo: 'Recorridos más usados', tipo: 'natural', w: 12, h: 7, minH: 4, cuerpo: '<div id="calor-recorridos"><p class="dash-mensaje">Cargando…</p></div>' },
    { id: 'rechazos', tema: 'viajes', titulo: 'Rechazos por cliente y destino', tipo: 'natural', w: 12, h: 7, minH: 4, cuerpo: '<div id="calor-rechazos"><p class="dash-mensaje">Cargando…</p></div>' },
    {
      id: 'ultimos', tema: 'viajes', titulo: 'Últimos viajes', tipo: 'lista', w: 12, h: 6, minH: 4, sinRelleno: true,
      cuerpo: cargandoTabla('ultimos-viajes', 5, '<th class="text-center">Fecha</th><th>Recorrido y cliente</th><th class="text-end">Km</th><th class="text-center">Estado</th><th class="text-center">Acciones</th>')
    },
    {
      id: 'comparativa', tema: 'viajes', titulo: 'Comparativa por mes', tituloId: 'titulo-comparativa', tipo: 'lista', w: 12, h: 6, minH: 4, sinRelleno: true,
      cuerpo: cargandoTabla('comparativa-meses', 8, '<th id="comparativa-columna">Mes</th><th class="text-end">Viajes</th><th class="text-end">Variación</th>' +
        '<th class="text-end">Entregados</th><th class="text-end">Parciales</th><th class="text-end">Con rechazo</th><th class="text-end">Pendientes</th><th class="text-end">Km</th>')
    },
    { id: 'calendario', tema: 'viajes', titulo: 'Calendario de viajes', tipo: 'natural', w: 12, h: 6, minH: 5, relleno: 'p-2', cuerpo: '<div id="calendarioViajes"></div>' },

    // ---- Flota
    {
      id: 'camiones', tema: 'flota', titulo: 'Camiones activos', icono: 'bi-truck text-success', alcance: 'Hoy', tipo: 'kpi', w: 3, h: 2, minH: 2,
      cuerpo: kpi('camiones-activos-texto', { id: 'camiones-activos-bar', clase: 'bg-success', etiqueta: 'Camiones activos' })
    },
    { id: 'kpikm', tema: 'flota', titulo: 'Km recorridos', icono: 'bi-speedometer2 text-primary', tipo: 'kpi', w: 3, h: 2, minH: 2, cuerpo: kpi('kpi-km') },
    { id: 'itv', tema: 'flota', titulo: 'ITV de camiones', icono: 'bi-clipboard-check text-primary', alcance: { id: 'itv-cantidad', texto: 'Hoy' }, tipo: 'lista', w: 4, h: 5, minH: 3, sinRelleno: true, cuerpo: cargandoLista('itv-camiones') },
    { id: 'kmmes', tema: 'flota', titulo: 'Km por mes', tituloId: 'titulo-grafico-km', tipo: 'grafico', w: 6, tw: 4, h: 5, minH: 4, cuerpo: '<div id="grafico-km"></div>' },
    { id: 'kmcamion', tema: 'flota', titulo: 'Km por camión', tipo: 'grafico', w: 6, tw: 4, h: 5, minH: 4, cuerpo: '<div id="grafico-camiones"></div>' },
    // Nuevo (24/10): tres datos, camión × mes × km, en un mapa de calor.
    { id: 'kmcamionmes', tema: 'flota', titulo: 'Km por camión y por mes', tituloId: 'titulo-kmcamionmes', tipo: 'natural', w: 12, h: 6, minH: 4, cuerpo: '<div id="calor-camiones"><p class="dash-mensaje">Cargando…</p></div>' },
    // Nuevo (24/10, segunda tanda): camión × mes × importe de los viajes (el que guarda cada viaje con su tarifa).
    { id: 'ingresoscamionmes', tema: 'flota', titulo: 'Ingresos por camión y por mes', tituloId: 'titulo-ingresoscamionmes', tipo: 'natural', w: 12, h: 6, minH: 4, cuerpo: '<div id="calor-ingresos"><p class="dash-mensaje">Cargando…</p></div>' },

    // ---- Choferes
    {
      id: 'choferes', tema: 'choferes', titulo: 'Choferes activos', icono: 'bi-people text-primary', alcance: 'Hoy', tipo: 'kpi', w: 3, h: 2, minH: 2,
      cuerpo: kpi('choferes-activos-texto', { id: 'choferes-activos-bar', clase: 'bg-primary', etiqueta: 'Choferes activos' })
    },
    { id: 'kmchofer', tema: 'choferes', titulo: 'Km por chofer', tipo: 'grafico', w: 6, tw: 12, h: 5, minH: 4, cuerpo: '<div id="grafico-choferes"></div>' },

    // ---- Facturación (cuenta corriente, de solo lectura)
    { id: 'costo', tema: 'facturacion', titulo: 'Costo por viaje', icono: 'bi-currency-dollar text-info', tipo: 'kpi', w: 3, h: 2, minH: 2, cuerpo: kpi('costo-promedio-texto').replace('id="costo-promedio-texto-detalle"', 'id="costo-detalle"') },
    { id: 'topclientes', tema: 'facturacion', titulo: 'Top clientes en facturación', alcance: 'Histórico', tipo: 'lista', w: 6, h: 5, minH: 3, sinRelleno: true, cuerpo: cargandoLista('top-clientes-list') },
    // Nuevos (24/10): deuda vencida por cliente y facturación por cliente y por mes (mapa de calor).
    {
      id: 'deudavencida', tema: 'facturacion', titulo: 'Deuda vencida por cliente', icono: 'bi-cash-stack text-danger', alcance: { id: 'deuda-cantidad', texto: 'Hoy' },
      tipo: 'lista', w: 6, h: 5, minH: 3, sinRelleno: true,
      cuerpo: '<div class="small text-muted px-3 py-2 d-none" id="deuda-resumen"></div>' +
        cargandoTabla('deuda-clientes', 3, '<th>Cliente</th><th class="text-end">Vencido</th><th class="text-end">Por vencer</th>')
    },
    { id: 'facturacionmes', tema: 'facturacion', titulo: 'Facturación por cliente y por mes', tituloId: 'titulo-facturacionmes', tipo: 'natural', w: 12, h: 6, minH: 4, cuerpo: '<div id="calor-facturacion"><p class="dash-mensaje">Cargando…</p></div>' },
    // Nuevo (24/10, segunda tanda): cliente × antigüedad de lo vencido × monto.
    { id: 'deudaantiguedad', tema: 'facturacion', titulo: 'Antigüedad de la deuda', alcance: 'Hoy', tipo: 'natural', w: 12, h: 6, minH: 4, cuerpo: '<div id="calor-deuda"><p class="dash-mensaje">Cargando…</p></div>' }
    // "Cambios de tarifa para revisar" no está acá: es una tarjeta fija del dashboard, sin estrella (cambios-tarifa.js).
  ];

  var POR_ID = {};
  CATALOGO.forEach(function (t) { POR_ID[t.id] = t; });

  // El dashboard de siempre (21/10), para quien todavía no eligió sus favoritos. Los tableros nuevos no están: se
  // suman con la estrella.
  var DISENO_POR_DEFECTO = [
    { id: 'kpiviajes', x: 0, y: 0, w: 3, h: 2 },
    { id: 'kpientregados', x: 3, y: 0, w: 3, h: 2 },
    { id: 'kpipendientes', x: 6, y: 0, w: 3, h: 2 },
    { id: 'kpirechazo', x: 9, y: 0, w: 3, h: 2 },
    { id: 'kpikm', x: 0, y: 2, w: 3, h: 2 },
    { id: 'costo', x: 3, y: 2, w: 3, h: 2 },
    { id: 'choferes', x: 6, y: 2, w: 3, h: 2 },
    { id: 'camiones', x: 9, y: 2, w: 3, h: 2 },
    { id: 'revisar', x: 0, y: 4, w: 8, h: 5 },
    { id: 'itv', x: 8, y: 4, w: 4, h: 5 },
    { id: 'viajesmes', x: 0, y: 9, w: 8, h: 6 },
    { id: 'proximos', x: 8, y: 9, w: 4, h: 6 },
    { id: 'kmmes', x: 0, y: 15, w: 6, h: 5 },
    { id: 'kmcamion', x: 6, y: 15, w: 6, h: 5 },
    { id: 'kmchofer', x: 0, y: 20, w: 6, h: 5 },
    { id: 'topclientes', x: 6, y: 20, w: 6, h: 5 },
    { id: 'ultimos', x: 0, y: 25, w: 12, h: 6 },
    { id: 'comparativa', x: 0, y: 31, w: 12, h: 6 },
    { id: 'calendario', x: 0, y: 37, w: 12, h: 6 }
  ];

  function escapar(valor) { return window.SGTL ? SGTL.escapar(valor) : String(valor == null ? '' : valor); }

  function textoEstrella(marcada) { return marcada ? 'Quitar de mi dashboard' : 'Agregar a mi dashboard'; }

  function estrella(id, marcada) {
    var texto = textoEstrella(marcada);
    return '<button type="button" class="btn btn-sm dash-estrella" data-tablero="' + id + '" aria-pressed="' + (marcada ? 'true' : 'false') +
      '" aria-label="' + texto + '" data-bs-toggle="tooltip" title="' + texto + '">' +
      '<i class="bi ' + (marcada ? 'bi-star-fill' : 'bi-star') + '" aria-hidden="true"></i></button>';
  }

  // Deja la estrella como marcada o no (después de guardar, o al volver atrás si falló).
  function marcarEstrella(boton, marcada) {
    var texto = textoEstrella(marcada);
    boton.setAttribute('aria-pressed', marcada ? 'true' : 'false');
    boton.setAttribute('aria-label', texto);
    // Si el globito ya se armó, Bootstrap lee el texto de data-bs-original-title (y un title haría un segundo globito).
    boton.setAttribute(boton.dataset.sgtlTooltip === 'true' ? 'data-bs-original-title' : 'title', texto);
    boton.querySelector('.bi').className = 'bi ' + (marcada ? 'bi-star-fill' : 'bi-star');
  }

  // La tarjeta de un tablero. opciones.estrella: true/false para mostrarla marcada o no; sin el dato, no va.
  function tarjeta(t, opciones) {
    opciones = opciones || {};
    var clases = ['card', 'rounded', 'custom-card', 'dash-tarjeta'];
    if (t.tipo === 'kpi') clases.push('dash-kpi');
    if (t.tipo === 'grafico') clases.push('dash-grafico');
    if (!t.alcance) clases.push('dash-periodo');
    var etiqueta = t.tipo === 'kpi' ? 'h6' : 'h5';
    var alcance = '';
    if (t.alcance) {
      var a = typeof t.alcance === 'string' ? { texto: t.alcance } : t.alcance;
      alcance = '<span class="dash-alcance"' + (a.id ? ' id="' + a.id + '"' : '') + '>' + escapar(a.texto) + '</span>';
    }
    return '<div class="' + clases.join(' ') + '" data-tablero="' + t.id + '">' +
      '<div class="card-header">' +
      (t.icono ? '<i class="bi ' + t.icono + '" aria-hidden="true"></i>' : '') +
      '<' + etiqueta + (t.tituloId ? ' id="' + t.tituloId + '"' : '') + '>' + escapar(t.titulo) + '</' + etiqueta + '>' +
      alcance +
      (typeof opciones.estrella === 'boolean' ? estrella(t.id, opciones.estrella) : '') +
      '</div>' +
      '<div class="card-body' + (t.sinRelleno ? ' p-0' : '') + (t.relleno ? ' ' + t.relleno : '') + '">' + t.cuerpo + '</div>' +
      '</div>';
  }

  // ---------------------------------------------------------------- Favoritos

  function usuario() { try { return localStorage.getItem('username') || ''; } catch (e) { return ''; } }
  function token() { try { return localStorage.getItem('token') || ''; } catch (e) { return ''; } }

  // Antes del 24/10 el diseño se guardaba solo en el navegador. Si el usuario todavía no eligió en el sistema, se toma
  // ese (sin los ocultos) y al guardar pasa a la base. Como hacía el dashboard, las tarjetas del diseño por defecto que no
  // estaban cuando lo guardó (y que no ocultó) van al final.
  function claveVieja() { return 'sgtl-dashboard-v2-' + usuario(); }
  function disenoViejo() {
    try {
      var guardado = JSON.parse(localStorage.getItem(claveVieja()) || 'null');
      if (!guardado || !guardado.items || !guardado.items.length) return null;
      var ocultos = guardado.hidden || [];
      var ids = guardado.items.map(function (it) { return it.id; });
      return guardado.items.filter(function (it) { return POR_ID[it.id] && ocultos.indexOf(it.id) === -1; })
        .map(function (it) { return { id: it.id, x: it.x, y: it.y, w: it.w, h: it.h }; })
        .concat(DISENO_POR_DEFECTO.filter(function (d) { return ids.indexOf(d.id) === -1 && ocultos.indexOf(d.id) === -1; })
          .map(function (d) { return { id: d.id }; }));
    } catch (e) { return null; }
  }
  function borrarDisenoViejo() { try { localStorage.removeItem(claveVieja()); } catch (e) { } }

  function copiaPorDefecto() { return DISENO_POR_DEFECTO.map(function (it) { return Object.assign({}, it); }); }

  function pedir(metodo, datos, porDefecto) {
    return SGTL.ajax({
      url: API + '/tableros/favoritos', type: metodo, dataType: 'json', cache: false,
      contentType: datos ? 'application/json' : undefined, data: datos ? JSON.stringify(datos) : undefined,
      headers: { Authorization: 'Bearer ' + token() }
    }, porDefecto);
  }

  // Los favoritos del usuario, en orden: { lista: [{ id, x, y, w, h }], personalizado, servidor }. Sin elegir todavía,
  // el diseño viejo del navegador o el de por defecto. Si la API no responde, igual devuelve uno (servidor: false).
  function leerFavoritos() {
    return pedir('GET', null, '').then(function (datos) {
      if (datos && datos.Personalizado) {
        return {
          personalizado: true, servidor: true,
          lista: (datos.Favoritos || []).filter(function (f) { return POR_ID[f.Tablero]; }).map(function (f) {
            return { id: f.Tablero, x: f.X, y: f.Y, w: f.Ancho, h: f.Alto };
          })
        };
      }
      return { personalizado: false, servidor: true, lista: disenoViejo() || copiaPorDefecto() };
    }, function () {
      return { personalizado: false, servidor: false, lista: disenoViejo() || copiaPorDefecto() };
    });
  }

  function guardarFavoritos(lista, porDefecto) {
    var cuerpo = {
      Favoritos: lista.map(function (it) {
        var conLugar = [it.x, it.y, it.w, it.h].every(function (v) { return typeof v === 'number' && isFinite(v); });
        return { Tablero: it.id, X: conLugar ? it.x : null, Y: conLugar ? it.y : null, Ancho: conLugar ? it.w : null, Alto: conLugar ? it.h : null };
      })
    };
    return pedir('PUT', cuerpo, porDefecto).then(function (r) { borrarDisenoViejo(); return r; });
  }

  function restablecer(porDefecto) {
    return pedir('DELETE', null, porDefecto).then(function (r) { borrarDisenoViejo(); return r; });
  }

  window.SGTLTableros = {
    API: API,
    TEMAS: TEMAS,
    CATALOGO: CATALOGO,
    tablero: function (id) { return POR_ID[id] || null; },
    DISENO_POR_DEFECTO: DISENO_POR_DEFECTO,
    tarjeta: tarjeta,
    marcarEstrella: marcarEstrella,
    token: token,
    leerFavoritos: leerFavoritos,
    guardarFavoritos: guardarFavoritos,
    restablecer: restablecer
  };
})(window);
