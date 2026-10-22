// Dashboard (index.html): período, indicadores, gráficos y listas de viajes.
// Los viajes salen de api/Viajes/Buscar (filtra por Fecha_Inicio) y se agrupan acá, en el navegador.
// Usa window.SGTL (sgtl-ui.js), ApexCharts, FullCalendar y flatpickr.
(function () {
  'use strict';

  var API = 'http://localhost:50222/api';
  var CLAVE_PERIODO = 'sgtl-dashboard-periodo';
  var PERIODO_INICIAL = 'trimestre';

  var ESTADOS_VIAJE = {
    Registrado: 'Registrado',
    En_viaje: 'En viaje',
    Entregado: 'Entregado',
    Listo_para_facturar: 'Listo para facturar',
    Facturado: 'Facturado'
  };

  // Cómo se cuenta cada viaje. Registrado y En viaje son pendientes; el resto ya se entregó.
  // Con plataforma (Rukas) el resultado de la entrega es opcional: sin resultado cuenta como entregado.
  // Colores: los del §4 del design system (verde terminado, amarillo falta algo, rojo mal, gris inicial).
  var GRUPOS = [
    { id: 'entregado', texto: 'Entregado', color: '#198754' },
    { id: 'parcial', texto: 'Parcial', color: '#e6a700' },
    { id: 'rechazo', texto: 'Con rechazo', color: '#dc3545' },
    { id: 'pendiente', texto: 'Pendiente', color: '#a3aab1' }
  ];
  var AZUL = '#435ebe';
  var GRIS = '#a3aab1';
  var TINTA = '#52514e';
  var TINTA_SUAVE = '#6c757d';
  var GRILLA = '#e9ecef';
  var EJE = '#ced4da';

  var PERIODOS = {
    mes: { meses: 1 },
    trimestre: { meses: 3 },
    semestre: { meses: 6 },
    anio: { meses: 12 }
  };

  var MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  var MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  var dash = {
    periodo: null,
    choferes: {},
    camiones: {},
    viajes: {},          // por Viaje_ID, para abrir el detalle
    graficos: {},        // id → { chart, el, tamano(alto, ancho) }
    pedido: 0            // para descartar respuestas viejas si se cambia el período rápido
  };
  var catalogos = null;  // promesa de choferes y camiones

  var formatoEntero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
  var formatoUnDecimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

  // Ejes: "12,5 mil". (El formato compacto del navegador para es-AR mezcla "K" y "k".)
  function compacto(v) {
    if (Math.abs(v) >= 1e6) return formatoUnDecimal.format(v / 1e6) + ' M';
    if (Math.abs(v) >= 1000) return formatoUnDecimal.format(v / 1000) + ' mil';
    return formatoEntero.format(v);
  }

  function esc(valor) { return SGTL.escapar(valor); }
  function el(id) { return document.getElementById(id); }

  // ---------------------------------------------------------------- Fechas

  function inicioDia(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function sumarDias(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function inicioMes(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function sumarMeses(d, n) {
    var r = new Date(d.getFullYear(), d.getMonth() + n, 1);
    var ultimo = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
    r.setDate(Math.min(d.getDate(), ultimo));
    return r;
  }
  function diasEntre(a, b) { return Math.round((inicioDia(b) - inicioDia(a)) / 86400000); }
  function lunes(d) { var r = inicioDia(d); return sumarDias(r, -((r.getDay() + 6) % 7)); }
  function diaMes(d) { return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); }

  // La API manda "2026-10-15T08:00:00" sin zona: se lee tal cual, como hora local.
  function leerFechaApi(valor) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(valor || ''));
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0));
  }

  function hora(d) { return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

  // "Hoy 08:00", "Mañana 14:30", "Jue 23/10 06:00".
  function cuando(d) {
    var dias = diasEntre(new Date(), d);
    var dia = dias === 0 ? 'Hoy' : (dias === 1 ? 'Mañana' : DIAS[d.getDay()] + ' ' + diaMes(d));
    return dia + ' ' + hora(d);
  }

  // ---------------------------------------------------------------- Período

  // Rango elegido y el anterior con el que se compara.
  // Último mes: los 30/31 días hasta hoy. Trimestre, semestre y año arrancan el 1° del mes, para que
  // los meses del gráfico estén completos (salvo el actual). El anterior es el mismo rango corrido
  // esa cantidad de meses; en un rango a mano, la misma cantidad de días justo antes.
  function calcularPeriodo(tipo, desde, hasta) {
    var hoy = inicioDia(new Date());
    var p = { tipo: tipo };
    if (PERIODOS[tipo]) {
      var n = PERIODOS[tipo].meses;
      p.hasta = hoy;
      p.desde = n === 1 ? sumarDias(sumarMeses(hoy, -1), 1) : new Date(hoy.getFullYear(), hoy.getMonth() - (n - 1), 1);
      p.antDesde = sumarMeses(p.desde, -n);
      p.antHasta = n === 1 ? sumarDias(p.desde, -1) : sumarMeses(p.hasta, -n);
    } else {
      p.desde = inicioDia(desde);
      p.hasta = inicioDia(hasta);
      var dias = diasEntre(p.desde, p.hasta) + 1;
      p.antHasta = sumarDias(p.desde, -1);
      p.antDesde = sumarDias(p.desde, -dias);
    }
    // Hasta dos meses se agrupa por semana; más largo, por mes.
    p.porSemana = diasEntre(p.desde, p.hasta) < 62;
    return p;
  }

  function leerPeriodoGuardado() {
    try {
      var tipo = localStorage.getItem(CLAVE_PERIODO);
      return PERIODOS[tipo] ? tipo : PERIODO_INICIAL;
    } catch (e) { return PERIODO_INICIAL; }
  }

  function guardarPeriodo(tipo) {
    try { localStorage.setItem(CLAVE_PERIODO, tipo); } catch (e) { }
  }

  function textoRango(desde, hasta) {
    return SGTL.fecha(desde) + ' al ' + SGTL.fecha(hasta);
  }

  function mostrarPeriodo(p) {
    var botones = document.querySelectorAll('#periodoRapido [data-periodo]');
    Array.prototype.forEach.call(botones, function (b) {
      var activo = b.getAttribute('data-periodo') === p.tipo;
      b.classList.toggle('active', activo);
      b.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
    var input = el('periodoRango');
    if (input && input._flatpickr) input._flatpickr.setDate([p.desde, p.hasta], false);
    var texto = el('periodoTexto');
    if (texto) texto.textContent = 'Del ' + textoRango(p.desde, p.hasta) + ' · comparado con el ' + textoRango(p.antDesde, p.antHasta);
  }

  function elegirPeriodo(tipo, desde, hasta) {
    dash.periodo = calcularPeriodo(tipo, desde, hasta);
    if (PERIODOS[tipo]) guardarPeriodo(tipo);
    mostrarPeriodo(dash.periodo);
    cargarPeriodo();
  }

  function prepararFiltroPeriodo() {
    Array.prototype.forEach.call(document.querySelectorAll('#periodoRapido [data-periodo]'), function (b) {
      b.addEventListener('click', function () { elegirPeriodo(b.getAttribute('data-periodo')); });
    });
    var input = el('periodoRango');
    if (!input) return;
    // Elegir las dos fechas aplica el rango (en el tablero no hay botón Buscar).
    SGTL.rangoFechas(input, {
      onClose: function (fechas) {
        if (fechas.length === 2) {
          var actual = dash.periodo;
          if (actual && diasEntre(actual.desde, fechas[0]) === 0 && diasEntre(actual.hasta, fechas[1]) === 0) return;
          elegirPeriodo('rango', fechas[0], fechas[1]);
        } else if (dash.periodo) {
          mostrarPeriodo(dash.periodo);
        }
      }
    });
  }

  // ---------------------------------------------------------------- Datos

  function pedir(url, datos) {
    return $.ajax({ url: API + url, type: 'GET', dataType: 'json', data: datos || {} });
  }

  // 404 = la lista está vacía (Choferes y Camiones responden así).
  function pedirLista(url) {
    return $.Deferred(function (d) {
      pedir(url).done(function (data) { d.resolve(Array.isArray(data) ? data : []); })
        .fail(function (xhr) { if (xhr.status === 404) d.resolve([]); else d.reject(xhr); });
    }).promise();
  }

  function buscarViajes(desde, hasta, estado) {
    var datos = { page: 1, pageSize: 0 };
    if (desde) datos.fechaDesde = SGTL.fechaISO(desde);
    if (hasta) datos.fechaHasta = SGTL.fechaISO(hasta);
    if (estado) datos.estado = estado;
    return pedir('/Viajes/Buscar', datos).then(function (data) {
      return (data && (data.Results || data.results)) || [];
    });
  }

  // Km guardados como "400.5" o "400,5" (igual que ResumenCosto en la API).
  function leerKm(valor) {
    var texto = String(valor == null ? '' : valor).trim();
    return /^\d+([.,]\d+)?$/.test(texto) ? parseFloat(texto.replace(',', '.')) : 0;
  }

  // Deja el viaje listo para las listas y para abrir su detalle.
  function registrarViaje(v) {
    v._fecha = leerFechaApi(v.Fecha_Inicio);
    v._km = leerKm(v.Distancia_KM);
    dash.viajes[v.Viaje_ID] = v;
    return v;
  }

  function grupoDe(v) {
    var estado = v.Estado || 'Registrado';
    if (estado === 'Registrado' || estado === 'En_viaje') return 'pendiente';
    if (v.Resultado_Entrega === 'Rechazo') return 'rechazo';
    if (v.Resultado_Entrega === 'Parcial') return 'parcial';
    return 'entregado';
  }

  function nombreChofer(id) {
    var c = dash.choferes[id];
    return c ? ((c.Nombre || '').trim() + ' ' + (c.Apellido || '').trim()).trim() : '';
  }

  function dominio(id) {
    var c = dash.camiones[id];
    return c ? String(c.Dominio || '').trim() : (id ? 'Camión ' + id : '');
  }

  // apilada: en una tabla, la segunda etiqueta va debajo del estado, como en Gestionar viajes y presupuestos.
  function etiquetaEstado(v, apilada) {
    var html = SGTL.estado(v.Estado || 'Registrado', ESTADOS_VIAJE[v.Estado] || v.Estado || 'Registrado');
    if (v.Resultado_Entrega === 'Parcial' || v.Resultado_Entrega === 'Rechazo') {
      var resultado = SGTL.estado(v.Resultado_Entrega, v.Resultado_Entrega === 'Rechazo' ? 'Con rechazo' : 'Parcial');
      html += apilada ? '<div class="mt-1">' + resultado + '</div>' : ' ' + resultado;
    }
    return html;
  }

  function contador() { return { viajes: 0, entregado: 0, parcial: 0, rechazo: 0, pendiente: 0, enViaje: 0, km: 0 }; }

  function sumar(c, v) {
    c.viajes++;
    c[v._grupo]++;
    if (v.Estado === 'En_viaje') c.enViaje++;
    c.km += v._km;
  }

  // Grupos del gráfico (meses o semanas) y el inmediatamente anterior, para la variación de la tabla.
  function armarGrupos(p) {
    var siguiente = p.porSemana ? function (d) { return sumarDias(d, 7); } : function (d) { return new Date(d.getFullYear(), d.getMonth() + 1, 1); };
    var primero = p.porSemana ? lunes(p.desde) : inicioMes(p.desde);
    var lista = [];
    for (var d = primero; d <= p.hasta; d = siguiente(d)) {
      lista.push(Object.assign({ clave: SGTL.fechaISO(d), inicio: d, fin: sumarDias(siguiente(d), -1) }, contador()));
    }
    var antes = p.porSemana ? sumarDias(primero, -7) : new Date(primero.getFullYear(), primero.getMonth() - 1, 1);
    var anterior = Object.assign({ clave: SGTL.fechaISO(antes), inicio: antes, fin: sumarDias(primero, -1) }, contador());

    // Si el período cruza de año, el año va solo en el primer mes y en enero: "Nov 25", "Dic", "Ene 26".
    var varios = lista.length && lista[0].inicio.getFullYear() !== lista[lista.length - 1].inicio.getFullYear();
    var hoy = inicioDia(new Date());
    lista.forEach(function (g, i) {
      var enCurso = g.inicio <= hoy && hoy <= g.fin;
      if (p.porSemana) {
        g.corto = diaMes(g.inicio);
        g.largo = 'Semana del ' + diaMes(g.inicio) + ' al ' + diaMes(g.fin);
      } else {
        var conAnio = varios && (i === 0 || g.inicio.getMonth() === 0);
        g.corto = MESES[g.inicio.getMonth()] + (conAnio ? ' ' + String(g.inicio.getFullYear()).slice(2) : '');
        g.largo = MESES_LARGOS[g.inicio.getMonth()] + ' ' + g.inicio.getFullYear();
      }
      if (enCurso) g.largo += ' (en curso)';
    });
    return { lista: lista, anterior: anterior };
  }

  function cargarPeriodo() {
    var p = dash.periodo;
    var numero = ++dash.pedido;
    var grupos = armarGrupos(p);
    var desdeConsulta = p.antDesde < grupos.anterior.inicio ? p.antDesde : grupos.anterior.inicio;
    var tablero = document.querySelector('.grid-stack');
    if (tablero) tablero.classList.add('dash-actualizando');

    var viajes = buscarViajes(desdeConsulta, p.hasta);
    var costo = pedir('/Viajes/ResumenCosto', { fechaDesde: SGTL.fechaISO(p.desde), fechaHasta: SGTL.fechaISO(p.hasta) });
    var costoAnterior = pedir('/Viajes/ResumenCosto', { fechaDesde: SGTL.fechaISO(p.antDesde), fechaHasta: SGTL.fechaISO(p.antHasta) });

    $.when(viajes, catalogos).done(function (todos) {
      if (numero !== dash.pedido) return;
      procesarViajes(p, grupos, todos);
    }).fail(function () {
      if (numero !== dash.pedido) return;
      SGTL.toastError('No se pudieron cargar los viajes del período. Revisá la conexión y probá de nuevo.');
      sinDatosPeriodo('No se pudieron cargar los viajes.');
    }).always(function () {
      if (numero === dash.pedido && tablero) tablero.classList.remove('dash-actualizando');
    });

    $.when(costo, costoAnterior).done(function (r1, r2) {
      if (numero !== dash.pedido) return;
      mostrarCosto(r1[0], r2[0]);
    }).fail(function () {
      if (numero !== dash.pedido) return;
      el('costo-promedio-texto').textContent = '—';
      el('costo-detalle').textContent = 'No disponible';
    });
  }

  function procesarViajes(p, grupos, todos) {
    var finPeriodo = sumarDias(p.hasta, 1);
    var finAnterior = sumarDias(p.antHasta, 1);
    var porClave = {};
    grupos.lista.forEach(function (g) { porClave[g.clave] = g; });

    var actual = [];
    var total = contador();
    var anterior = contador();
    todos.forEach(function (v) {
      var f = registrarViaje(v)._fecha;
      if (!f) return;
      v._grupo = grupoDe(v);
      var clave = SGTL.fechaISO(p.porSemana ? lunes(f) : inicioMes(f));
      if (f >= p.desde && f < finPeriodo) {
        actual.push(v);
        sumar(total, v);
        if (porClave[clave]) sumar(porClave[clave], v);
      }
      if (f >= p.antDesde && f < finAnterior) sumar(anterior, v);
      if (clave === grupos.anterior.clave) sumar(grupos.anterior, v);
    });

    mostrarIndicadores(total, anterior);
    graficoViajes(grupos.lista, p);
    graficoKm(grupos.lista, p);
    graficoReparto('camion', actual, total);
    graficoReparto('chofer', actual, total);
    tablaUltimos(actual);
    tablaComparativa(grupos, total, p);
    if (window.ajustarWidgetsVivos) setTimeout(window.ajustarWidgetsVivos, 60);
  }

  function sinDatosPeriodo(texto) {
    ['kpi-viajes', 'kpi-entregados', 'kpi-pendientes', 'kpi-rechazo', 'kpi-km'].forEach(function (id) {
      el(id).textContent = '—';
      el(id + '-detalle').textContent = '';
    });
    ['grafico-viajes', 'grafico-km', 'grafico-camiones', 'grafico-choferes'].forEach(function (id) { mensajeGrafico(id, texto); });
    el('ultimos-viajes').innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">' + esc(texto) + '</td></tr>';
    el('comparativa-meses').innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">' + esc(texto) + '</td></tr>';
  }

  // ---------------------------------------------------------------- Indicadores

  function porcentaje(parte, total) {
    return total ? Math.round(parte / total * 100) + ' %' : '0 %';
  }

  // "+12 % vs. período anterior": verde si el cambio es bueno, rojo si es malo, con flecha (no solo color).
  // Con { corto: true } solo el porcentaje, y nada si no hay con qué comparar.
  function variacion(actual, anterior, subirEsBueno, opciones) {
    var corto = opciones && opciones.corto;
    if (!anterior) {
      if (corto) return '';
      return actual ? '<span class="text-muted">Sin viajes en el período anterior</span>' : '<span class="text-muted">Sin viajes en los dos períodos</span>';
    }
    var cambio = Math.round((actual - anterior) / anterior * 100);
    if (cambio === 0) {
      return '<span class="text-muted"><i class="bi bi-dash-lg" aria-hidden="true"></i> ' + (corto ? '0 %' : 'Igual que el período anterior') + '</span>';
    }
    var sube = cambio > 0;
    var clase = sube === subirEsBueno ? 'text-success' : 'text-danger';
    return '<span class="' + clase + ' fw-semibold"><i class="bi bi-arrow-' + (sube ? 'up' : 'down') + '-right" aria-hidden="true"></i> ' +
      (sube ? '+' : '−') + Math.abs(cambio).toLocaleString('es-AR') + ' %</span>' + (corto ? '' : ' <span class="text-muted">vs. período anterior</span>');
  }

  function mostrarIndicadores(t, ant) {
    var entregados = t.entregado + t.parcial + t.rechazo;
    el('kpi-viajes').textContent = formatoEntero.format(t.viajes);
    el('kpi-viajes-detalle').innerHTML = variacion(t.viajes, ant.viajes, true);

    el('kpi-entregados').textContent = formatoEntero.format(entregados);
    el('kpi-entregados-detalle').textContent = porcentaje(entregados, t.viajes) + ' de los viajes';

    el('kpi-pendientes').textContent = formatoEntero.format(t.pendiente);
    el('kpi-pendientes-detalle').textContent = t.pendiente
      ? t.enViaje + ' en viaje · ' + (t.pendiente - t.enViaje) + ' sin salir'
      : 'Todos los viajes se entregaron';

    el('kpi-rechazo').textContent = formatoEntero.format(t.rechazo);
    el('kpi-rechazo-detalle').textContent = porcentaje(t.rechazo, entregados) + ' de los entregados · ' +
      t.parcial + (t.parcial === 1 ? ' parcial' : ' parciales');

    el('kpi-km').textContent = formatoEntero.format(Math.round(t.km));
    el('kpi-km-detalle').innerHTML = variacion(Math.round(t.km), Math.round(ant.km), true);
  }

  function mostrarCosto(r, ant) {
    var promedio = el('costo-promedio-texto');
    var detalle = el('costo-detalle');
    if (r && r.cantidadViajes > 0) {
      promedio.textContent = SGTL.monto(r.costoPromedio, { sinDecimales: true });
      detalle.innerHTML = 'Total ' + esc(SGTL.monto(r.costoTotal, { sinDecimales: true })) + ' ' +
        variacion(Number(r.costoTotal) || 0, Number(ant && ant.costoTotal) || 0, true, { corto: true });
    } else {
      promedio.textContent = '—';
      detalle.textContent = 'Sin viajes en el período';
    }
  }

  // ---------------------------------------------------------------- Gráficos

  function mensajeGrafico(id, texto) {
    var g = dash.graficos[id];
    if (g && g.chart) { g.chart.destroy(); }
    delete dash.graficos[id];
    var cont = el(id);
    if (cont) cont.innerHTML = '<p class="text-muted text-center py-5 mb-0">' + esc(texto) + '</p>';
  }

  function altoDisponible(cont) {
    var body = cont.closest('.card-body');
    if (!body || !body.clientHeight) return 260;
    var cs = getComputedStyle(body);
    return Math.max(150, body.clientHeight - parseFloat(cs.paddingTop || 0) - parseFloat(cs.paddingBottom || 0));
  }

  var lienzo = null;
  function anchoTexto(textos) {
    lienzo = lienzo || document.createElement('canvas').getContext('2d');
    lienzo.font = '600 12px Nunito, sans-serif';
    return Math.max.apply(null, textos.map(function (t) { return lienzo.measureText(t).width; }));
  }

  // Máximo del eje en números redondos (5.000, 10.000, 25.000) con 5 marcas o menos.
  function escalaRedonda(valor) {
    if (!(valor > 0)) return { max: 1, marcas: 1 };
    var potencia = Math.pow(10, Math.floor(Math.log10(valor)));
    var pasos = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10];
    for (var i = 0; i < pasos.length; i++) {
      var paso = pasos[i] * potencia;
      var marcas = Math.ceil(valor / paso);
      if (marcas <= 5) return { max: marcas * paso, marcas: marcas };
    }
    return { max: valor, marcas: 4 };
  }

  // Barras de hasta 24 px; si no entran, el 60 % del lugar de cada una.
  function anchoBarra(espacio, cantidad) {
    var lugar = espacio / Math.max(cantidad, 1);
    return Math.max(4, Math.min(24, Math.floor(lugar * 0.6))) + 'px';
  }

  function base(alto) {
    return {
      chart: {
        height: alto, toolbar: { show: false }, zoom: { enabled: false }, parentHeightOffset: 0,
        fontFamily: 'Nunito, sans-serif', foreColor: TINTA_SUAVE, animations: { enabled: true, speed: 300 }
      },
      xaxis: { labels: { rotate: 0, hideOverlappingLabels: true, trim: false } },
      dataLabels: { enabled: false },
      grid: { borderColor: GRILLA, strokeDashArray: 0, xaxis: { lines: { show: false } }, padding: { left: 4, right: 8 } },
      states: { hover: { filter: { type: 'darken', value: 0.9 } }, active: { filter: { type: 'none' } } },
      legend: { show: false }
    };
  }

  // Crea el gráfico o, si ya está, lo actualiza con los datos nuevos (sin parpadeo).
  function dibujar(id, opciones, tamano) {
    var cont = el(id);
    if (!cont) return;
    var g = dash.graficos[id];
    var alto = altoDisponible(cont);
    var completo = $.extend(true, {}, opciones, tamano(alto, cont.clientWidth || 600));
    if (g && g.chart) {
      g.tamano = tamano;
      g.chart.updateOptions(completo, true, true);
      return;
    }
    cont.innerHTML = '';
    var chart = new ApexCharts(cont, completo);
    dash.graficos[id] = { chart: chart, el: cont, tamano: tamano, alto: alto };
    chart.render();
  }

  function cantidadViajes(n) { return formatoEntero.format(n) + (n === 1 ? ' viaje' : ' viajes'); }

  function graficoViajes(grupos, p) {
    var total = grupos.reduce(function (s, g) { return s + g.viajes; }, 0);
    el('titulo-grafico-viajes').textContent = p.porSemana ? 'Viajes por semana' : 'Viajes por mes';
    if (!total) { mensajeGrafico('grafico-viajes', 'No hay viajes en el período.'); return; }
    var opciones = $.extend(true, base(), {
      chart: { type: 'bar', stacked: true },
      series: GRUPOS.map(function (g) { return { name: g.texto, data: grupos.map(function (x) { return x[g.id]; }) }; }),
      colors: GRUPOS.map(function (g) { return g.color; }),
      stroke: { show: true, width: 2, colors: ['#fff'] },
      plotOptions: {
        bar: {
          borderRadius: 4, borderRadiusApplication: 'end', borderRadiusWhenStacked: 'last',
          dataLabels: { total: { enabled: grupos.length <= 14, style: { color: TINTA, fontSize: '12px', fontWeight: 600 } } }
        }
      },
      xaxis: { categories: grupos.map(function (g) { return g.corto; }), axisBorder: { color: EJE }, axisTicks: { show: false } },
      yaxis: { min: 0, forceNiceScale: true, decimalsInFloat: 0, labels: { formatter: function (v) { return formatoEntero.format(v); } } },
      legend: { show: true, position: 'top', horizontalAlign: 'left', fontSize: '13px', labels: { colors: TINTA }, markers: { width: 10, height: 10, radius: 10 }, itemMargin: { horizontal: 8 } },
      tooltip: {
        shared: true, intersect: false,
        x: { formatter: function (v, o) { return grupos[o.dataPointIndex] ? grupos[o.dataPointIndex].largo + ' · ' + cantidadViajes(grupos[o.dataPointIndex].viajes) : v; } },
        y: { formatter: function (v) { return cantidadViajes(v); } }
      }
    });
    dibujar('grafico-viajes', opciones, function (alto, ancho) {
      return { chart: { height: alto }, plotOptions: { bar: { columnWidth: anchoBarra(ancho - 50, grupos.length) } } };
    });
  }

  function graficoKm(grupos, p) {
    var total = grupos.reduce(function (s, g) { return s + g.km; }, 0);
    el('titulo-grafico-km').textContent = p.porSemana ? 'Km por semana' : 'Km por mes';
    if (!total) { mensajeGrafico('grafico-km', 'No hay km cargados en el período.'); return; }
    var opciones = $.extend(true, base(), {
      chart: { type: 'bar' },
      series: [{ name: 'Km', data: grupos.map(function (g) { return Math.round(g.km * 10) / 10; }) }],
      colors: [AZUL],
      plotOptions: { bar: { borderRadius: 4, borderRadiusApplication: 'end' } },
      xaxis: { categories: grupos.map(function (g) { return g.corto; }), axisBorder: { color: EJE }, axisTicks: { show: false } },
      yaxis: { min: 0, forceNiceScale: true, labels: { formatter: compacto } },
      tooltip: {
        x: { formatter: function (v, o) { return grupos[o.dataPointIndex] ? grupos[o.dataPointIndex].largo : v; } },
        y: {
          title: { formatter: function () { return ''; } },
          formatter: function (v, o) {
            var g = grupos[o.dataPointIndex];
            return SGTL.km(v) + ' km' + (g ? ' en ' + cantidadViajes(g.viajes) : '');
          }
        }
      }
    });
    dibujar('grafico-km', opciones, function (alto, ancho) {
      return { chart: { height: alto }, plotOptions: { bar: { columnWidth: anchoBarra(ancho - 50, grupos.length) } } };
    });
  }

  // Cómo se agrupan los km del período en "Km por camión" y "Km por chofer".
  var REPARTOS = {
    camion: {
      grafico: 'grafico-camiones', plural: 'camiones',
      clave: function (v) { return v.CamionID || 0; },
      nombre: function (id) { return dominio(id); },
      detalle: function (id) { var c = dash.camiones[id]; return c ? [c.Marca, c.Modelo].filter(Boolean).join(' ') : ''; },
      sinAsignar: 'Sin camión'
    },
    chofer: {
      grafico: 'grafico-choferes', plural: 'choferes',
      clave: function (v) { return v.ChoferID > 0 ? v.ChoferID : 0; },
      nombre: function (id) { return nombreChofer(id) || 'Chofer ' + id; },
      detalle: function (id) { var c = dash.choferes[id]; return c && String(c.EstadoChofer || '').toLowerCase() !== 'activo' ? 'Inactivo' : ''; },
      // Con plataforma el chofer puede asignarse después: esos viajes van juntos, en gris.
      sinAsignar: 'Sin chofer'
    }
  };

  // Km y viajes del período por camión o por chofer. Más de 8: el resto va a "Otros".
  function graficoReparto(tipo, viajes, total) {
    var como = REPARTOS[tipo];
    var grupos = {};
    viajes.forEach(function (v) {
      var id = como.clave(v);
      var g = grupos[id] || (grupos[id] = { id: id, km: 0, viajes: 0 });
      g.km += v._km;
      g.viajes++;
    });
    var filas = Object.keys(grupos).map(function (k) { return grupos[k]; })
      .filter(function (g) { return g.km > 0; })
      .sort(function (a, b) { return b.km - a.km; });
    if (!filas.length) { mensajeGrafico(como.grafico, 'No hay km cargados en el período.'); return; }
    if (filas.length > 8) {
      var resto = filas.splice(7);
      filas.push({ otros: resto.length, km: resto.reduce(function (s, g) { return s + g.km; }, 0), viajes: resto.reduce(function (s, g) { return s + g.viajes; }, 0) });
    }
    filas.forEach(function (g) {
      g.gris = !!g.otros || (!g.id && !!como.sinAsignar);
      g.nombre = g.otros ? 'Otros ' + g.otros : (!g.id && como.sinAsignar ? como.sinAsignar : como.nombre(g.id));
      g.detalle = g.otros ? g.otros + ' ' + como.plural : (g.id ? como.detalle(g.id) : '');
    });
    var textoLargo = function (g) { return formatoEntero.format(Math.round(g.km)) + ' km · ' + cantidadViajes(g.viajes); };
    var textoCorto = function (g) { return formatoEntero.format(Math.round(g.km)) + ' km'; };
    var anchoLargo = anchoTexto(filas.map(textoLargo));
    var anchoCorto = anchoTexto(filas.map(textoCorto));
    var anchoNombres = Math.min(120, anchoTexto(filas.map(function (g) { return g.nombre; })));
    // Lo que depende del ancho de la tarjeta: si "km · viajes" no entra a la derecha de la barra, solo los km
    // (los viajes quedan en el globito). El eje se estira lo justo para que el número de la barra más larga entre.
    var medidas = function (ancho) {
      var lugar = Math.max(80, ancho - anchoNombres - 30);
      var corto = lugar - anchoLargo - 12 < lugar * 0.45;
      var anchoNumero = corto ? anchoCorto : anchoLargo;
      var libre = Math.max(lugar - anchoNumero - 12, lugar * 0.4);
      return {
        escala: escalaRedonda(Math.max(filas[0].km * lugar / libre, filas[0].km * 1.1)),
        texto: corto ? textoCorto : textoLargo
      };
    };
    var opciones = $.extend(true, base(), {
      chart: { type: 'bar' },
      series: [{ name: 'Km', data: filas.map(function (g) { return Math.round(g.km * 10) / 10; }) }],
      colors: filas.map(function (g) { return g.gris ? GRIS : AZUL; }),
      plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 4, borderRadiusApplication: 'end', dataLabels: { position: 'top' } } },
      dataLabels: { enabled: true, textAnchor: 'start', offsetX: 8, style: { colors: [TINTA], fontSize: '12px', fontWeight: 600 } },
      xaxis: {
        categories: filas.map(function (g) { return g.nombre; }), min: 0,
        axisBorder: { show: false }, axisTicks: { show: false },
        labels: { formatter: compacto }
      },
      yaxis: {
        labels: {
          style: { colors: TINTA, fontSize: '12px' }, maxWidth: 120,
          // ApexCharts mide el número de la barra con este formato para centrarlo en la punta: vacío para los
          // números, así el texto arranca justo después de la barra (los nombres se muestran igual).
          formatter: function (v) { return typeof v === 'number' ? '' : v; }
        }
      },
      grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      tooltip: {
        custom: function (o) {
          var g = filas[o.dataPointIndex];
          return '<div class="px-2 py-1"><strong>' + esc(g.nombre) + '</strong>' + (g.detalle ? ' <span class="text-muted">' + esc(g.detalle) + '</span>' : '') +
            '<br>' + esc(SGTL.km(g.km)) + ' km en ' + esc(cantidadViajes(g.viajes)) + ' · ' + esc(porcentaje(g.km, total.km)) + ' del total</div>';
        }
      }
    });
    dibujar(como.grafico, opciones, function (alto, ancho) {
      var lugar = (alto - 40) / filas.length;
      var m = medidas(ancho);
      return {
        chart: { height: alto },
        plotOptions: { bar: { barHeight: Math.max(6, Math.min(24, Math.floor(lugar * 0.6))) + 'px' } },
        xaxis: { max: m.escala.max, tickAmount: m.escala.marcas },
        dataLabels: { formatter: function (v, o) { return m.texto(filas[o.dataPointIndex]); } }
      };
    });
  }

  // Se llama al agrandar o achicar una tarjeta (Personalizar) y al cambiar el ancho de la ventana.
  function ajustarGraficos() {
    Object.keys(dash.graficos).forEach(function (id) {
      var g = dash.graficos[id];
      if (!g || !g.chart || !g.el.isConnected || !g.el.offsetParent) return;
      var alto = altoDisponible(g.el);
      var ancho = g.el.clientWidth || 600;
      if (g.alto === alto && g.ancho === ancho) return;
      g.alto = alto;
      g.ancho = ancho;
      g.chart.updateOptions(g.tamano(alto, ancho), false, false);
    });
  }

  // ---------------------------------------------------------------- Tablas y listas

  function tablaUltimos(viajes) {
    var ahora = new Date();
    var filas = viajes.filter(function (v) { return v._fecha <= ahora; })
      .sort(function (a, b) { return b._fecha - a._fecha || b.Viaje_ID - a.Viaje_ID; })
      .slice(0, 8);
    var cuerpo = el('ultimos-viajes');
    if (!filas.length) {
      cuerpo.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay viajes en el período.</td></tr>';
      return;
    }
    SGTL.tabla.llenar(cuerpo, filas.map(function (v) {
      return '<tr>' +
        '<td class="text-center text-nowrap">' + esc(SGTL.fecha(v._fecha)) + '</td>' +
        '<td class="dash-celda-texto">' + esc(v.Origen) + ' → ' + esc(v.Destino) +
        '<small class="d-block text-muted text-truncate">' + esc(v.Cliente) + '</small></td>' +
        '<td class="text-end text-nowrap">' + (v._km ? esc(SGTL.km(v._km)) : '—') + '</td>' +
        '<td class="text-center text-nowrap">' + etiquetaEstado(v, true) + '</td>' +
        '<td class="text-center">' + SGTL.accionesFila([SGTL.botonFila('ver', { id: v.Viaje_ID })]) + '</td>' +
        '</tr>';
    }).join(''));
  }

  // Más reciente arriba; la variación es contra el mes (o la semana) anterior.
  function tablaComparativa(grupos, total, p) {
    el('titulo-comparativa').textContent = p.porSemana ? 'Comparativa por semana' : 'Comparativa por mes';
    el('comparativa-columna').textContent = p.porSemana ? 'Semana' : 'Mes';
    var lista = grupos.lista;
    var filas = lista.map(function (g, i) {
      var previo = i === 0 ? grupos.anterior : lista[i - 1];
      return fila(g.largo, g, cambio(g.viajes, previo.viajes));
    }).reverse();
    filas.push(fila('Total del período', total, '', true));
    el('comparativa-meses').innerHTML = filas.join('');

    function cambio(actual, anterior) {
      if (!anterior) return '<span class="text-muted">—</span>';
      var c = Math.round((actual - anterior) / anterior * 100);
      if (c === 0) return '<span class="text-muted">0 %</span>';
      return '<span class="text-nowrap"><i class="bi bi-arrow-' + (c > 0 ? 'up' : 'down') + '-right ' + (c > 0 ? 'text-success' : 'text-danger') + '" aria-hidden="true"></i> ' +
        (c > 0 ? '+' : '−') + Math.abs(c).toLocaleString('es-AR') + ' %</span>';
    }

    function fila(nombre, c, variacionHtml, esTotal) {
      var entregados = c.entregado + c.parcial + c.rechazo;
      var abre = esTotal ? '<tr class="fw-bold">' : '<tr>';
      return abre +
        '<td class="text-nowrap">' + esc(nombre) + '</td>' +
        '<td class="text-end">' + formatoEntero.format(c.viajes) + '</td>' +
        '<td class="text-end">' + variacionHtml + '</td>' +
        '<td class="text-end">' + formatoEntero.format(entregados) + '</td>' +
        '<td class="text-end">' + formatoEntero.format(c.parcial) + '</td>' +
        '<td class="text-end">' + formatoEntero.format(c.rechazo) + '</td>' +
        '<td class="text-end">' + formatoEntero.format(c.pendiente) + '</td>' +
        '<td class="text-end text-nowrap">' + esc(SGTL.km(c.km)) + '</td>' +
        '</tr>';
    }
  }

  // Desde hoy, sin entregar todavía. No depende del período elegido.
  function cargarProximos() {
    var hoy = inicioDia(new Date());
    $.when(buscarViajes(hoy, null), catalogos).done(function (todos) {
      var proximos = todos.map(registrarViaje)
        .filter(function (v) { return v._fecha && v._fecha >= hoy && grupoDe(v) === 'pendiente'; })
        .sort(function (a, b) { return a._fecha - b._fecha || a.Viaje_ID - b.Viaje_ID; });
      var cont = el('proximos-viajes');
      el('proximos-cantidad').textContent = proximos.length ? cantidadViajes(proximos.length) : '';
      if (!proximos.length) {
        cont.innerHTML = '<div class="text-muted text-center py-4">No hay viajes programados.</div>';
        return;
      }
      cont.innerHTML = proximos.slice(0, 8).map(function (v) {
        var extra = [v.Cliente, dominio(v.CamionID), nombreChofer(v.ChoferID)].filter(Boolean).map(esc).join(' · ');
        return '<button type="button" class="list-group-item list-group-item-action dash-viaje" data-viaje="' + esc(v.Viaje_ID) + '">' +
          '<div class="d-flex justify-content-between align-items-center gap-2">' +
          '<strong class="text-nowrap">' + esc(cuando(v._fecha)) + '</strong>' + etiquetaEstado(v) + '</div>' +
          '<div class="text-truncate">' + esc(v.Origen) + ' → ' + esc(v.Destino) + '</div>' +
          '<small class="text-muted d-block text-truncate">' + extra + '</small></button>';
      }).join('');
    }).fail(function () {
      el('proximos-viajes').innerHTML = '<div class="text-muted text-center py-4">No se pudieron cargar los viajes.</div>';
    });
  }

  function cargarTopClientes() {
    pedir('/dashboard/top-clientes-facturacion', { cantidad: 5 }).done(function (data) {
      var cont = el('top-clientes-list');
      if (!data || !data.length) {
        cont.innerHTML = '<div class="text-muted text-center py-4">Todavía no hay comprobantes emitidos.</div>';
        return;
      }
      cont.innerHTML = data.map(function (c) {
        var nombre = (c.RazonSocial || c.Razon_Social || c.Nombre || 'Sin nombre').trim();
        return '<div class="list-group-item d-flex justify-content-between align-items-center gap-3"><span>' + esc(nombre) +
          '</span><strong class="text-nowrap">' + esc(SGTL.monto(c.Facturacion)) + '</strong></div>';
      }).join('');
    }).fail(function () {
      el('top-clientes-list').innerHTML = '<div class="text-muted text-center py-4">No se pudo cargar la facturación.</div>';
    });
  }

  // ---------------------------------------------------------------- Para revisar

  var DIAS_SIN_PROFORMA = 7; // entregado hace más de esto y fuera de toda proforma: falta facturarlo

  // Por qué un viaje pide atención. Todos los motivos son "falta algo para cerrar" (amarillo, §4 del design system).
  function motivosRevisar(v, ahora, hoy) {
    var motivos = [];
    var directo = v.Tipo_Cliente !== 'Con_plataforma';
    var inicio = leerFechaApi(v.Fecha_Inicio);
    var fin = leerFechaApi(v.Fecha_Fin);
    var entrega = leerFechaApi(v.Fecha_Entrega) || fin;
    if (v.Estado === 'En_viaje' && fin && fin < ahora) {
      motivos.push({ orden: 0, fecha: fin, estado: 'Atrasado', detalle: 'Llegada prevista ' + SGTL.fecha(fin, { hora: true }) + ' y sigue en viaje' });
    }
    // Directo: tenía que salir. Con plataforma el seguimiento está en Rukas: lo que falta es marcarlo listo para facturar.
    if (v.Estado === 'Registrado' && directo && inicio && inicio < hoy) {
      motivos.push({ orden: 1, fecha: inicio, estado: 'Sin salir', detalle: 'Salida prevista ' + SGTL.fecha(inicio, { hora: true }) + ' y sigue registrado' });
    }
    if (v.Estado === 'Registrado' && !directo && fin && fin < hoy) {
      motivos.push({ orden: 1, fecha: fin, estado: 'Sin cerrar', detalle: 'Terminó el ' + SGTL.fecha(fin) + ': falta marcarlo listo para facturar' });
    }
    if ((v.Estado === 'Entregado' || v.Estado === 'Listo_para_facturar') && !v.EnProforma_ID) {
      var dias = entrega ? diasEntre(entrega, hoy) : 0;
      if (dias > DIAS_SIN_PROFORMA) {
        motivos.push({ orden: 2, fecha: entrega, estado: 'Sin proforma', detalle: (v.Estado === 'Entregado' ? 'Entregado' : 'Listo para facturar') + ' hace ' + dias + ' días' });
      }
    }
    // La evidencia es solo de clientes directos y ya no se puede adjuntar una vez facturado.
    if (v.Estado === 'Entregado' && directo && !v.Tiene_Evidencia) {
      motivos.push({ orden: 3, fecha: entrega, estado: 'Sin evidencia', detalle: 'Falta el remito firmado, la foto o el conforme' });
    }
    return motivos;
  }

  // "2 atrasados · 5 sin salir · 3 sin proforma" (un viaje con dos motivos cuenta en los dos).
  function resumenMotivos(filas) {
    var cuenta = {};
    filas.forEach(function (f) { f.motivos.forEach(function (m) { cuenta[m.estado] = (cuenta[m.estado] || 0) + 1; }); });
    return ['Atrasado', 'Sin salir', 'Sin cerrar', 'Sin proforma', 'Sin evidencia'].filter(function (e) { return cuenta[e]; })
      .map(function (e) {
        var texto = e.toLowerCase();
        if (e === 'Atrasado' && cuenta[e] > 1) texto = 'atrasados';
        return cuenta[e] + ' ' + texto;
      }).join(' · ');
  }

  // Viajes que piden atención, sin importar el período: estado sin actualizar o falta algo para facturar.
  // Se piden solo los estados que pueden tener algo pendiente (los facturados, que son la mayoría, no).
  function cargarRevisar() {
    var ahora = new Date();
    var hoy = inicioDia(ahora);
    var pedidos = [
      buscarViajes(null, null, 'En_viaje'),
      buscarViajes(null, sumarDias(hoy, -1), 'Registrado'),
      buscarViajes(null, null, 'Entregado'),
      buscarViajes(null, null, 'Listo_para_facturar')
    ];
    $.when.apply($, pedidos.concat([catalogos])).done(function (enViaje, registrados, entregados, listos) {
      var filas = enViaje.concat(registrados, entregados, listos).map(function (v) {
        registrarViaje(v);
        return { viaje: v, motivos: motivosRevisar(v, ahora, hoy) };
      }).filter(function (f) { return f.motivos.length; });
      filas.forEach(function (f) {
        f.motivos.sort(function (a, b) { return a.orden - b.orden; });
        f.orden = f.motivos[0].orden;
        f.fecha = f.motivos[0].fecha;
      });
      // Primero lo más urgente; dentro de cada motivo, lo más viejo.
      filas.sort(function (a, b) { return a.orden - b.orden || a.fecha - b.fecha || a.viaje.Viaje_ID - b.viaje.Viaje_ID; });

      el('revisar-cantidad').textContent = filas.length ? 'Hoy · ' + cantidadViajes(filas.length) : 'Hoy';
      el('revisar-resumen').textContent = resumenMotivos(filas);
      el('revisar-resumen').classList.toggle('d-none', !filas.length);
      var cuerpo = el('revisar-viajes');
      if (!filas.length) {
        cuerpo.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">' +
          '<i class="bi bi-check2-circle text-success me-1" aria-hidden="true"></i>No hay viajes para revisar.</td></tr>';
        return;
      }
      SGTL.tabla.llenar(cuerpo, filas.map(function (f) {
        var v = f.viaje;
        var recorrido = esc(v.Origen) + ' → ' + esc(v.Destino);
        var referencia = 'N° ' + esc(v.Viaje_ID) + ' · ' + esc(v.Cliente);
        return '<tr>' +
          '<td>' + f.motivos.map(function (m) {
            return '<div class="dash-motivo">' + SGTL.estado(m.estado) + ' <small class="text-muted">' + esc(m.detalle) + '</small></div>';
          }).join('') +
          // En pantallas chicas el viaje va debajo del motivo (la columna Viaje no entra).
          '<small class="d-block d-md-none mt-1">' + recorrido + ' · ' + referencia + '</small></td>' +
          '<td class="dash-celda-texto d-none d-md-table-cell">' + recorrido +
          '<small class="d-block text-muted text-truncate">' + referencia + '</small></td>' +
          '<td class="text-center">' + SGTL.accionesFila([SGTL.botonFila('ver', { id: v.Viaje_ID })]) + '</td>' +
          '</tr>';
      }).join(''));
    }).fail(function () {
      el('revisar-resumen').classList.add('d-none');
      el('revisar-cantidad').textContent = 'Hoy';
      el('revisar-viajes').innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No se pudieron cargar los viajes.</td></tr>';
    });
  }

  // ---------------------------------------------------------------- ITV

  // FechaITV es la del último control (Gestionar camiones no deja cargar una fecha futura).
  // Se toma que vence al año; si para algún camión es otro plazo, cambiar acá.
  var MESES_VIGENCIA_ITV = 12;
  var DIAS_AVISO_ITV = 30;

  function cuandoVence(dias, vence) {
    if (dias < -1) return 'Venció el ' + SGTL.fecha(vence) + ' (hace ' + -dias + ' días)';
    if (dias === -1) return 'Venció ayer (' + SGTL.fecha(vence) + ')';
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Vence mañana (' + SGTL.fecha(vence) + ')';
    return 'Vence el ' + SGTL.fecha(vence) + ' (en ' + dias + ' días)';
  }

  // Camiones activos con la ITV vencida o que vence en los próximos 30 días.
  function mostrarItv(camiones) {
    var hoy = inicioDia(new Date());
    var lista = camiones.filter(function (c) { return String(c.EstadoCamion || '').toLowerCase() === 'activo'; })
      .map(function (c) {
        var hecha = leerFechaApi(c.FechaITV);
        if (!hecha) return null;
        var vence = sumarMeses(hecha, MESES_VIGENCIA_ITV);
        return { camion: c, hecha: hecha, vence: vence, dias: diasEntre(hoy, vence) };
      })
      .filter(Boolean)
      .sort(function (a, b) { return a.vence - b.vence; });
    var avisos = lista.filter(function (x) { return x.dias <= DIAS_AVISO_ITV; });
    var cont = el('itv-camiones');
    el('itv-cantidad').textContent = avisos.length ? 'Hoy · ' + avisos.length + (avisos.length === 1 ? ' camión' : ' camiones') : 'Hoy';

    if (!avisos.length) {
      var proximo = lista[0];
      cont.innerHTML = '<div class="text-muted text-center py-4 px-3">' +
        '<i class="bi bi-check2-circle text-success me-1" aria-hidden="true"></i>Ninguna ITV vence en los próximos ' + DIAS_AVISO_ITV + ' días.' +
        (proximo ? '<small class="d-block mt-1">Próximo vencimiento: ' + esc(String(proximo.camion.Dominio || '').trim()) + ' el ' + esc(SGTL.fecha(proximo.vence)) + '.</small>' : '') +
        '</div>';
      return;
    }
    cont.innerHTML = avisos.map(function (x) {
      var c = x.camion;
      var modelo = [c.Marca, c.Modelo].filter(Boolean).join(' ');
      return '<div class="list-group-item">' +
        '<div class="d-flex justify-content-between align-items-center gap-2">' +
        '<strong>' + esc(String(c.Dominio || '').trim()) + '</strong>' + SGTL.estado(x.dias < 0 ? 'Vencida' : 'Por vencer') + '</div>' +
        '<div>' + esc(cuandoVence(x.dias, x.vence)) + '</div>' +
        '<small class="text-muted d-block text-truncate">' + esc([modelo, 'último control ' + SGTL.fecha(x.hecha)].filter(Boolean).join(' · ')) + '</small>' +
        '</div>';
    }).join('');
  }

  function mostrarFlota(choferes, camiones) {
    medidor('choferes', choferes.filter(function (c) { return String(c.EstadoChofer || '').toLowerCase() === 'activo'; }).length, choferes.length);
    medidor('camiones', camiones.filter(function (c) { return String(c.EstadoCamion || '').toLowerCase() === 'activo'; }).length, camiones.length);
  }

  function medidor(id, activos, total) {
    el(id + '-activos-texto').textContent = activos + ' / ' + total;
    el(id + '-activos-bar').style.width = (total ? Math.round(activos / total * 100) : 0) + '%';
    el(id + '-activos-bar').parentNode.setAttribute('aria-valuenow', String(activos));
    el(id + '-activos-bar').parentNode.setAttribute('aria-valuemax', String(total));
  }

  // ---------------------------------------------------------------- Detalle del viaje

  // El mismo detalle que Listar y Gestionar viajes (viaje-detalle.js), con el enlace para abrirlo en Gestionar viajes.
  function mostrarDetalle(id) {
    var v = dash.viajes[id];
    if (v) SGTLDetalleViaje.abrir(v, { enlaceGestion: true });
  }

  // ---------------------------------------------------------------- Calendario

  // Pide solo los viajes del mes que se ve (antes traía todos). Clic en un viaje: su detalle.
  function iniciarCalendario() {
    var $cal = $('#calendarioViajes');
    if (!$cal.length || !$.fn.fullCalendar) return;
    $cal.fullCalendar({
      locale: 'es',
      defaultView: 'month',
      header: { left: 'prev,next', center: 'title', right: 'today' },
      height: 'auto',
      // Semanas de ~85 px: entran el día, 2 viajes y el "+ más" sin hacer el mes tan alto.
      aspectRatio: 1.8,
      fixedWeekCount: false,
      eventLimit: 2,
      titleFormat: 'MMMM YYYY',
      // locale/es.js es de otra versión y no traduce los botones: van a mano.
      buttonText: { today: 'Hoy' },
      eventLimitText: 'más',
      displayEventEnd: false,
      timeFormat: 'HH:mm',
      events: function (inicio, fin, zona, listo) {
        // Una semana antes para que se vean los viajes largos que empezaron el mes anterior.
        buscarViajes(sumarDias(inicio.toDate(), -7), sumarDias(fin.toDate(), -1)).done(function (viajes) {
          listo(viajes.map(function (v) {
            registrarViaje(v);
            return {
              id: v.Viaje_ID,
              title: (v.Origen || '') + ' → ' + (v.Destino || ''),
              start: v.Fecha_Inicio,
              end: v.Fecha_Fin,
              className: 'dash-evento dash-evento-' + SGTL.colorEstado(v.Estado || 'Registrado')
            };
          }));
        }).fail(function () {
          listo([]);
          SGTL.toastError('No se pudieron cargar los viajes del calendario. Probá de nuevo.');
        });
      },
      eventClick: function (evento) { mostrarDetalle(evento.id); return false; },
      eventRender: function (evento, $el) { $el.attr('title', 'Viaje N° ' + evento.id + ': ' + evento.title); },
      // Al cambiar de mes cambia la cantidad de semanas: la tarjeta se ajusta para mostrarlo entero.
      viewRender: function () { if (window.ajustarWidgetsVivos) setTimeout(window.ajustarWidgetsVivos, 0); },
      eventAfterAllRender: function () { if (window.ajustarWidgetsVivos) setTimeout(window.ajustarWidgetsVivos, 0); }
    });
  }

  // ---------------------------------------------------------------- Inicio

  function iniciar() {
    catalogos = $.when(pedirLista('/Choferes'), pedirLista('/Camiones')).then(function (choferes, camiones) {
      choferes.forEach(function (c) { dash.choferes[c.Chofer_ID] = c; });
      camiones.forEach(function (c) { dash.camiones[c.Camion_ID] = c; });
      mostrarFlota(choferes, camiones);
      mostrarItv(camiones);
    }, function () {
      ['choferes', 'camiones'].forEach(function (id) { el(id + '-activos-texto').textContent = '—'; });
      el('itv-camiones').innerHTML = '<div class="text-muted text-center py-4">No se pudieron cargar los camiones.</div>';
      return $.Deferred().resolve().promise(); // sin catálogos igual se muestran los viajes
    });

    prepararFiltroPeriodo();
    $('.grid-stack').on('click', '[data-accion="ver"], .dash-viaje', function () {
      mostrarDetalle($(this).data('id') || $(this).data('viaje'));
    });

    elegirPeriodo(leerPeriodoGuardado());
    cargarRevisar();
    cargarProximos();
    cargarTopClientes();
    iniciarCalendario();
  }

  window.SGTLDashboard = { iniciar: iniciar, ajustarGraficos: ajustarGraficos };
})();
