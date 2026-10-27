// Hoja de ruta del chofer (24/10): el chofer entra con su usuario y ve sus viajes desde el celular, agrupados por día,
// con el recorrido (y su mapa), el camión y los números del viaje. En los viajes de clientes directos inicia el viaje y
// registra la entrega con la evidencia (después solo la reemplaza); los de clientes con plataforma solo los mira.
// La API (api/HojaDeRuta) saca el chofer del token: no hay forma de pedir los viajes de otro.
// Va después de jQuery, app.js, flatpickr y sgtl-ui.js. La lógica sin pantalla está en SGTLHojaDeRuta (tests/hoja-de-ruta.test.js).
(function (window, document) {
  'use strict';

  var API = 'http://localhost:50222/api';
  // Resultado de la entrega (§4.1): Completa verde, Parcial amarillo, Rechazo rojo.
  var COLOR_RESULTADO = { Completa: 'verde', Parcial: 'amarillo', Rechazo: 'rojo' };
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var TIPOS_EVIDENCIA = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  var MAX_BYTES = 5 * 1024 * 1024;
  // Una foto del celular pesa 3 a 8 MB: se achica a 1600 px de lado en JPG antes de subirla (entra en 5 MB y sube
  // rápido con datos móviles). Las que ya son chicas y los PDF van tal cual.
  var LADO_FOTO = 1600;
  var CALIDAD_FOTO = 0.82;
  var ACHICAR_DESDE = 1.5 * 1024 * 1024;

  // ---------------------------------------------------------------- Lógica (sin pantalla)

  function soloFecha(valor) { return String(valor == null ? '' : valor).substring(0, 10); }

  function aDia(iso) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(soloFecha(iso));
    return p ? new Date(Number(p[1]), Number(p[2]) - 1, Number(p[3])) : null;
  }

  function dosCifras(n) { return String(n).padStart(2, '0'); }
  function ddmmaaaa(d) { return dosCifras(d.getDate()) + '/' + dosCifras(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function hhmm(valor) { var t = /T(\d{2}):(\d{2})/.exec(String(valor || '')); return t ? t[1] + ':' + t[2] : ''; }

  // "Hoy · sábado 24/10/2026", "Mañana · domingo 25/10/2026", "Ayer · …" o "Lunes 26/10/2026".
  function tituloDia(fechaIso, hoyIso) {
    var dia = aDia(fechaIso), hoy = aDia(hoyIso);
    if (!dia) return '';
    var nombre = DIAS[dia.getDay()] + ' ' + ddmmaaaa(dia);
    var diferencia = hoy ? Math.round((dia - hoy) / 86400000) : null;
    var relativo = { '-1': 'Ayer', '0': 'Hoy', '1': 'Mañana' }[String(diferencia)];
    return relativo ? relativo + ' · ' + nombre : nombre.charAt(0).toUpperCase() + nombre.slice(1);
  }

  // Viajes en el orden que llegan, agrupados por el día de inicio: [{ fecha, viajes }].
  function agruparPorDia(viajes) {
    var grupos = [];
    (viajes || []).forEach(function (v) {
      var fecha = soloFecha(v.Fecha_Inicio);
      var ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.fecha === fecha) ultimo.viajes.push(v);
      else grupos.push({ fecha: fecha, viajes: [v] });
    });
    return grupos;
  }

  // "06:00 a 14:30"; si termina otro día, "22:00 a 06:15 del 28/10/2026".
  function horario(v) {
    var inicio = hhmm(v.Fecha_Inicio), fin = hhmm(v.Fecha_Fin);
    if (!fin) return inicio;
    var diaFin = aDia(v.Fecha_Fin);
    var otroDia = diaFin && soloFecha(v.Fecha_Fin) !== soloFecha(v.Fecha_Inicio);
    return inicio + ' a ' + fin + (otroDia ? ' del ' + ddmmaaaa(diaFin) : '');
  }

  function esDirecto(v) { return v.Tipo_Cliente !== 'Con_plataforma'; }

  function proformaQueBloquea(v) {
    return v.EnProforma_Estado === 'Generada' || v.EnProforma_Estado === 'Aceptada' ? (v.EnProforma_Numero || 'emitida') : '';
  }

  // Qué puede hacer el chofer con el viaje (decisiones de Rocío, 24/10). Con hoyIso, un viaje se inicia solo el día de su
  // fecha de inicio (Rocío, 27/10, punto 33 de la §41): si sale otro día, administración corrige antes la fecha y la hora.
  //   paso: el siguiente paso del circuito ({ accion: 'iniciar' | 'entregar', texto, motivo si no se puede }) o null;
  //   sinCarga: en viaje, "Registrar sin carga" (llegó al origen y no había carga; punto 10 de la §41) o null;
  //   reemplazar: si puede cambiar la evidencia; ver: si hay evidencia para abrir; nota: aclaración debajo.
  // La evidencia se sube al registrar la entrega (es obligatoria): después solo se reemplaza. Un viaje entregado antes
  // de que fuera obligatoria (22/10) y sin evidencia no ofrece nada: la carga la administración en Gestionar viajes.
  // Con plataforma (Rukas) el chofer solo mira: la entrega y el remito los registra en la plataforma.
  function motivoFechaParaIniciar(v, hoyIso) {
    var dia = soloFecha(v.Fecha_Inicio), hoy = soloFecha(hoyIso);
    if (!hoy || !dia || dia === hoy) return '';
    return 'No se puede iniciar el viaje: ' + (dia > hoy ? 'es' : 'era') + ' del ' + ddmmaaaa(aDia(v.Fecha_Inicio)) +
      '. Si sale hoy, es necesario que administración corrija la fecha y la hora';
  }

  function accionesDe(v, hoyIso) {
    var r = { paso: null, sinCarga: null, reemplazar: false, ver: !!v.Tiene_Evidencia, nota: '' };
    var estadoViaje = v.Estado || 'Registrado';
    // Un cancelado (no se hizo) queda en Anteriores con su etiqueta y sin botones.
    if (estadoViaje === 'Cancelado') {
      r.nota = 'Este viaje se canceló.';
      return r;
    }
    if (!esDirecto(v)) {
      r.nota = 'Este viaje lo sigue la plataforma del cliente: la entrega y el remito se registran ahí.';
      return r;
    }
    if (estadoViaje === 'Facturado') return r;
    var bloquea = proformaQueBloquea(v);
    if (estadoViaje === 'Registrado') {
      r.paso = { accion: 'iniciar', texto: 'Iniciar viaje', motivo: bloquea ? 'No se puede iniciar el viaje: está en la proforma ' + bloquea : motivoFechaParaIniciar(v, hoyIso) };
    } else if (estadoViaje === 'En_viaje') {
      r.paso = { accion: 'entregar', texto: 'Registrar entrega', motivo: bloquea ? 'No se puede registrar la entrega: el viaje está en la proforma ' + bloquea : '' };
      r.sinCarga = { accion: 'sin-carga', texto: 'Registrar sin carga', motivo: bloquea ? 'No se puede registrar sin carga: el viaje está en la proforma ' + bloquea : '' };
    } else {
      r.reemplazar = !!v.Tiene_Evidencia;
    }
    return r;
  }

  // Por qué un viaje de un día anterior sigue en "Hoy y próximos" (Rocío, 24/10): uno directo que no se inició en su día
  // o que ya tendría que haber llegado y sigue en viaje. Va como etiqueta amarilla debajo del estado (la oficina los ve
  // en "Para revisar" del dashboard como Sin salir y Atrasado). Con plataforma no: pasado el día va a Anteriores.
  function atraso(v, hoyIso) {
    var hoy = soloFecha(hoyIso);
    if (!hoy || !esDirecto(v)) return '';
    var estadoViaje = v.Estado || 'Registrado';
    if (estadoViaje === 'Registrado' && soloFecha(v.Fecha_Inicio) < hoy) return 'Quedó sin iniciar';
    if (estadoViaje === 'En_viaje' && soloFecha(v.Fecha_Fin || v.Fecha_Inicio) < hoy) return 'Entrega sin registrar';
    return '';
  }

  // Gastos del viaje (control interno; Rocío, 27/10, punto 33 de la §41), la misma regla que la API
  // (Viajes/GastosDelViaje.cs): desde que el chofer inicia el viaje y hasta 2 días después de registrar la entrega; los de
  // plataforma, que no se inician acá, desde el día del viaje hasta 2 días después del fin. Después los carga
  // administración desde Ver detalle del viaje. Devuelve '' si puede, el motivo si no (el botón queda deshabilitado con
  // el motivo debajo) o null si no corresponde mostrar el botón (el viaje todavía no salió o ya está facturado).
  var DIAS_PARA_RENDIR = 2;

  function sumarDias(iso, dias) {
    var d = aDia(iso);
    if (!d) return '';
    d.setDate(d.getDate() + dias);
    return d.getFullYear() + '-' + dosCifras(d.getMonth() + 1) + '-' + dosCifras(d.getDate());
  }

  function motivoGasto(v, hoyIso, accion) {
    var hoy = soloFecha(hoyIso), estadoViaje = v.Estado || 'Registrado';
    var no = 'No se puede ' + (accion || 'cargar') + ' el gasto: ';
    // Un gasto que ya está se ve siempre: eliminarlo dice por qué no se puede.
    if (accion === 'eliminar' && estadoViaje === 'Facturado') return no + 'el viaje ya está facturado';
    if (accion === 'eliminar' && estadoViaje === 'Cancelado') return no + 'el viaje está cancelado';
    if (!hoy || estadoViaje === 'Facturado' || estadoViaje === 'Cancelado') return null;
    var pasaron = function (desde, de) {
      return sumarDias(desde, DIAS_PARA_RENDIR) < hoy
        ? no + 'pasaron más de ' + DIAS_PARA_RENDIR + ' días ' + de + '. Si te falta rendir algo, es necesario que se lo pases a administración'
        : '';
    };
    if (!esDirecto(v)) return soloFecha(v.Fecha_Inicio) > hoy ? null : pasaron(v.Fecha_Fin || v.Fecha_Inicio, 'del viaje');
    if (estadoViaje === 'En_viaje') return '';
    if (estadoViaje === 'Entregado') return pasaron(v.Fecha_Entrega || v.Fecha_Fin || v.Fecha_Inicio, 'de la entrega');
    // Sin carga, como una entrega: desde el día que llegó al origen.
    if (estadoViaje === 'Sin_carga') return pasaron(v.Fecha_Entrega || v.Fecha_Fin || v.Fecha_Inicio, 'del viaje');
    return null;
  }

  function puedeCargarGasto(v, hoyIso) { return motivoGasto(v, hoyIso) === ''; }

  // Recorrido completo para el chofer (Rocío, 24/10): galpón → origen → destino → galpón.
  // "Abrir en Google Maps" sin salir arranca en el galpón (Rocío, 27/10, punto 35 de la §41: el viaje se inicia siempre
  // ahí), aunque el chofer esté en otro lado. En viaje sigue desde donde está (sin origen, Google usa su ubicación) con lo
  // que le falta: destino → galpón. Un viaje terminado muestra la vuelta entera desde el galpón. Sin galpón cargado, el
  // enlace de siempre (origen → destino).
  function enlaceNavegacion(v, galpon) {
    var origen = v.Origen_Direccion ? v.Origen_Direccion + ', Argentina' : '';
    var destino = v.Destino_Direccion ? v.Destino_Direccion + ', Argentina' : '';
    if (!galpon || !origen || !destino) return v.Maps_Url || '';
    var base = 'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=' + encodeURIComponent(galpon);
    var estadoViaje = v.Estado || 'Registrado';
    if (estadoViaje === 'Registrado') return base + '&origin=' + encodeURIComponent(galpon) + '&waypoints=' + encodeURIComponent(origen + '|' + destino);
    if (estadoViaje === 'En_viaje') return base + '&waypoints=' + encodeURIComponent(destino);
    return base + '&origin=' + encodeURIComponent(galpon) + '&waypoints=' + encodeURIComponent(origen + '|' + destino);
  }

  // Km del recorrido completo: los del viaje más los del galpón al origen y del destino al galpón (null si falta alguno).
  function kmRecorridoCompleto(v) {
    // Sin carga (punto 10 de la §41): del origen volvió al galpón, los km al origen ida y vuelta.
    if (v.Estado === 'Sin_carga') return v.Km_Ida == null ? null : Math.round(Number(v.Km_Ida) * 2 * 10) / 10;
    var t = String(v.Distancia_KM == null ? '' : v.Distancia_KM).trim();
    if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
    var viaje = t ? Number(t) : NaN;
    if (v.Km_Ida == null || v.Km_Vuelta == null || !isFinite(viaje)) return null;
    return Math.round((Number(v.Km_Ida) + viaje + Number(v.Km_Vuelta)) * 10) / 10;
  }

  // El viaje que se muestra con el mapa abierto: el que está en viaje o, si no hay, el primero de hoy sin salir.
  function viajeQueSigue(viajes, hoyIso) {
    var hoy = soloFecha(hoyIso);
    var lista = viajes || [];
    var enViaje = lista.filter(function (v) { return v.Estado === 'En_viaje'; })[0];
    if (enViaje) return enViaje.Viaje_ID;
    var deHoy = lista.filter(function (v) { return soloFecha(v.Fecha_Inicio) === hoy && (v.Estado || 'Registrado') === 'Registrado'; })[0];
    return deHoy ? deHoy.Viaje_ID : null;
  }

  // Km como los guarda la API ("146.8") o como se escriben ("146,8").
  function kmTexto(valor) {
    var t = String(valor == null ? '' : valor).trim();
    if (t.indexOf(',') >= 0) t = t.replace(/\./g, '').replace(',', '.');
    var n = Number(t);
    return t && isFinite(n) && window.SGTL ? window.SGTL.km(n) + ' km' : '';
  }

  // Archivo elegido → mensaje si no sirve ('' si está bien). Los celulares a veces no dicen el tipo: se mira la extensión.
  function tipoDeArchivo(file) {
    var tipo = String(file && file.type || '').toLowerCase();
    if (tipo) return tipo === 'image/jpg' ? 'image/jpeg' : tipo;
    var ext = (/\.([a-z0-9]+)$/i.exec(file && file.name || '') || [])[1];
    return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf', heic: 'image/heic', heif: 'image/heif' }[String(ext || '').toLowerCase()] || '';
  }

  function problemaDelArchivo(file) {
    if (!file) return '';
    var tipo = tipoDeArchivo(file);
    var foto = /^image\//.test(tipo);
    if (TIPOS_EVIDENCIA.indexOf(tipo) < 0 && !(foto && /heic|heif/.test(tipo))) return 'Tiene que ser una foto (JPG, PNG o WEBP) o un PDF.';
    // Las fotos grandes se achican antes de subirlas; un PDF tiene que entrar tal cual.
    if (!foto && file.size > MAX_BYTES) return 'El PDF no puede pesar más de 5 MB.';
    return '';
  }

  // ---------------------------------------------------------------- Pantalla

  // Anteriores (Rocío, 24/10): por año (arranca en el actual) y de a 30, con "Ver más viajes".
  var ANTERIORES_POR_PAGINA = 30;
  // Hojas de ruta (punto 4 de la §41, Rocío 27/10): los administradores y quien gestiona viajes eligen un chofer y ven su
  // hoja de ruta en solo lectura (choferVisto, soloLectura); los cambios se hacen en Gestionar viajes. La API controla lo mismo.
  var estado = {
    vista: 'proximos', hoy: '', viajes: [], porId: {}, busqueda: 0, buscarViaje: null, mapasAbiertos: {}, gastos: false,
    anio: null, cantidad: ANTERIORES_POR_PAGINA, hayMas: false, sigue: null,
    puedeVerTodas: false, choferVisto: null, nombreChofer: '', soloLectura: false, choferesCargados: false
  };
  var formularioGasto = null;
  var gastosAbiertos = null;   // el viaje cuya lista de gastos está abierta
  var formularioEntrega = null;
  var formularioEvidencia = null;
  var urlEvidencia = null;

  function esc(valor) { return SGTL.escapar(valor); }
  function token() { try { return localStorage.getItem('token') || ''; } catch (e) { return ''; } }
  function encabezados() { return { Authorization: 'Bearer ' + token() }; }

  function pedir(opciones, porDefecto) {
    opciones.headers = encabezados();
    return SGTL.ajax(opciones, porDefecto);
  }

  function dato(etiqueta, valorHtml) {
    return '<div class="col-6 col-sm-4"><div class="sgtl-dato"><div class="sgtl-dato-etiqueta">' + esc(etiqueta) + '</div>' +
      '<div class="sgtl-dato-valor">' + (valorHtml || '—') + '</div></div></div>';
  }

  function texto(valor) { var t = String(valor == null ? '' : valor).trim(); return t ? esc(t) : ''; }

  // Origen y destino con el mismo punto, unidos por una línea punteada (.sgtl-recorrido, en la pantalla).
  function lugar(nombre, direccion, etiqueta) {
    return '<li><span class="visually-hidden">' + etiqueta + ': </span>' +
      '<div class="fw-semibold">' + (texto(nombre) || texto(direccion) || '—') + '</div>' +
      (nombre && direccion ? '<div class="text-muted small">' + esc(direccion) + '</div>' : '') + '</li>';
  }

  // El mapa con el recorrido dibujado: abierto en el viaje que sigue; en los demás, "Ver mapa" lo despliega.
  // "Abrir en Google Maps" abre la app del celular para manejar (el mismo enlace del WhatsApp).
  // El galpón del viaje (punto 28 de la §41: cada viaje sale del suyo); sin ese dato, el de hoy.
  function galponDe(v) { return v.Galpon || estado.galpon; }

  function mapa(v, abierto) {
    var enlace = enlaceNavegacion(v, galponDe(v));
    if (!enlace) return '<div class="form-text">No hay dirección cargada para mostrar el recorrido en el mapa.</div>';
    var abrir = '<a class="btn btn-link px-0" href="' + esc(enlace) + '" target="_blank" rel="noopener">' +
      '<i class="bi bi-box-arrow-up-right me-1" aria-hidden="true"></i>Abrir en Google Maps</a>';
    var letras = galponDe(v) ? '<div class="form-text mt-1">A: galpón · B: origen · C: destino · D: vuelta al galpón</div>' : '';
    // "Ver mapa" lo abre y, abierto, "Ocultar mapa" lo cierra (Rocío, 24/10), en el mismo lugar.
    var enlaces = '<div class="d-flex flex-wrap gap-3"><button type="button" class="btn btn-link px-0" data-accion="ver-mapa" data-id="' +
      esc(v.Viaje_ID) + '" aria-expanded="' + (abierto ? 'true' : 'false') + '"><i class="bi bi-map me-1" aria-hidden="true"></i>' +
      (abierto ? 'Ocultar mapa' : 'Ver mapa') + '</button>' + abrir + '</div>';
    return abierto ? enlaces + '<div class="sgtl-mapa-chofer" data-mapa="' + esc(v.Viaje_ID) + '"></div>' + letras : enlaces;
  }

  // Abierto: lo que eligió el chofer con "Ver mapa" / "Ocultar mapa" y, si no tocó nada, solo el del viaje que sigue.
  function mapaAbierto(v) {
    var elegido = estado.mapasAbiertos[v.Viaje_ID];
    return elegido != null ? elegido : v.Viaje_ID === estado.sigue;
  }

  function etiquetas(v) {
    var html = SGTL.estadoViaje(v.Estado);
    if (v.Resultado_Entrega) {
      var resultado = v.Resultado_Entrega === 'Rechazo' ? 'Con rechazo' : v.Resultado_Entrega;
      html += '<div class="mt-1">' + SGTL.estado(v.Resultado_Entrega, resultado, COLOR_RESULTADO[v.Resultado_Entrega]) + '</div>';
    }
    var atrasado = atraso(v, estado.hoy);
    if (atrasado) html += '<div class="mt-1">' + SGTL.estado(atrasado, atrasado, 'amarillo') + '</div>';
    return html;
  }

  function botonPaso(v, paso, clase) {
    var icono = paso.accion === 'iniciar' ? 'bi-play-circle' : paso.accion === 'sin-carga' ? 'bi-slash-circle' : 'bi-check2-circle';
    clase = clase || 'btn-success';
    var contenido = '<i class="bi ' + icono + ' me-1" aria-hidden="true"></i>' + esc(paso.texto);
    // Deshabilitado con el motivo (§1.4) escrito debajo: en el celular no hay globitos. Sin aria-label, que el estilo
    // del sistema reserva para los botones de solo ícono (§12).
    if (paso.motivo) {
      var idMotivo = 'motivo-' + paso.accion + '-' + esc(v.Viaje_ID);
      return '<button type="button" class="btn ' + clase + '" disabled aria-describedby="' + idMotivo + '">' + contenido + '</button>' +
        '<div class="form-text mt-0 w-100" id="' + idMotivo + '">' + esc(paso.motivo) + '.</div>';
    }
    return '<button type="button" class="btn ' + clase + '" data-accion="' + paso.accion + '" data-id="' + esc(v.Viaje_ID) + '">' + contenido + '</button>';
  }

  // La distancia que ve el chofer (Rocío, 24/10): la del recorrido completo, que es la que hace de verdad, con la de
  // origen a destino debajo en gris. Sin los km al galpón (no hay galpón o todavía no se calcularon), la de origen a
  // destino, aclarada igual.
  function distanciaDelViaje(v) {
    var total = kmRecorridoCompleto(v);
    if (v.Estado === 'Sin_carga' && total != null) return dato('Recorrido completo', esc(SGTL.km(total)) + ' km<div class="suave">galpón → origen → galpón</div>');
    var deOrigenADestino = kmTexto(v.Distancia_KM);
    if (total == null) return dato('Distancia', esc(deOrigenADestino) + (deOrigenADestino ? '<div class="suave">de origen a destino</div>' : ''));
    return dato('Recorrido completo', esc(SGTL.km(total)) + ' km<div class="suave">' + esc(deOrigenADestino) + ' de origen a destino</div>');
  }

  function tarjeta(v, conMapa) {
    // Solo lectura: sin botones (los cambios se hacen en Gestionar viajes).
    var a = estado.soloLectura ? { paso: null, sinCarga: null, reemplazar: false, nota: '' } : accionesDe(v, estado.hoy);
    // Solo los datos que tienen valor (Rocío, 24/10: que la tarjeta no sea tan larga). El camión, solo el dominio.
    var si = function (valor, etiqueta, html) { return String(valor == null ? '' : valor).trim() ? dato(etiqueta, html) : ''; };
    var datos = dato('Camión', texto(v.Camion)) +
      distanciaDelViaje(v) +
      si(v.Num_Remito, 'Número de remito', texto(v.Num_Remito)) +
      (esDirecto(v) ? '' : si(v.Num_Transporte, 'N° transporte SAP', texto(v.Num_Transporte)) + si(v.Num_de_Carga, 'N° entrega Rukas', texto(v.Num_de_Carga))) +
      (v.Fecha_Entrega ? dato(v.Estado === 'Sin_carga' ? 'Fecha' : 'Fecha de entrega', esc(SGTL.fecha(v.Fecha_Entrega))) : '') +
      (v.Tiene_Evidencia ? dato('Evidencia', '<button type="button" class="btn btn-link p-0 align-baseline" data-accion="ver-evidencia" data-id="' +
        esc(v.Viaje_ID) + '"><i class="bi bi-paperclip" aria-hidden="true"></i> Ver evidencia</button>') : '') +
      (estado.gastos && v.Gastos_Cantidad ? dato('Gastos', '<button type="button" class="btn btn-link p-0 align-baseline" data-accion="ver-gastos" data-id="' +
        esc(v.Viaje_ID) + '">' + esc(v.Gastos_Cantidad) + ' · ' + esc(SGTL.monto(v.Gastos_Total)) + '</button>') : '');

    var botones = [];
    if (a.paso) botones.push(botonPaso(v, a.paso));
    if (a.sinCarga) botones.push(botonPaso(v, a.sinCarga, 'btn-outline-secondary'));
    if (a.reemplazar) {
      botones.push('<button type="button" class="btn btn-outline-primary" data-accion="evidencia" data-id="' + esc(v.Viaje_ID) + '">' +
        '<i class="bi bi-camera me-1" aria-hidden="true"></i>Reemplazar evidencia</button>');
    }
    var motivo = estado.gastos && !estado.soloLectura ? motivoGasto(v, estado.hoy) : null;
    if (motivo === '') {
      botones.push('<button type="button" class="btn btn-outline-primary" data-accion="cargar-gasto" data-id="' + esc(v.Viaje_ID) + '">' +
        '<i class="bi bi-receipt me-1" aria-hidden="true"></i>Cargar gasto</button>');
    } else if (motivo) {
      // Pasado el tope: deshabilitado con el motivo escrito debajo (en el celular no hay globitos).
      var idMotivo = 'motivo-gasto-' + esc(v.Viaje_ID);
      botones.push('<button type="button" class="btn btn-outline-primary" disabled aria-describedby="' + idMotivo + '">' +
        '<i class="bi bi-receipt me-1" aria-hidden="true"></i>Cargar gasto</button>' +
        '<div class="form-text mt-0 w-100" id="' + idMotivo + '">' + esc(motivo) + '.</div>');
    }
    var pie = botones.length || a.nota
      ? '<div class="card-footer d-flex flex-wrap align-items-center gap-2">' + botones.join('') +
        (a.nota ? '<div class="form-text mt-0 w-100">' + esc(a.nota) + '</div>' : '') + '</div>'
      : '';

    return '<article class="card sgtl-viaje-chofer mb-0" id="viaje-' + esc(v.Viaje_ID) + '" aria-label="Viaje #' + esc(v.Viaje_ID) + '">' +
      '<div class="card-body">' +
      '<div class="d-flex justify-content-between align-items-start gap-2">' +
      '<div><div class="fs-5 fw-bold">' + esc(horario(v)) + '</div>' +
      '<div class="text-muted">Viaje #' + esc(v.Viaje_ID) + (v.Cliente ? ' · ' + esc(v.Cliente) : '') + '</div></div>' +
      '<div class="text-end flex-shrink-0">' + etiquetas(v) + '</div></div>' +
      '<ol class="sgtl-recorrido list-unstyled">' +
      lugar(v.Origen, v.Origen_Direccion, 'Origen') +
      lugar(v.Destino, v.Destino_Direccion, 'Destino') + '</ol>' +
      '<div class="sgtl-mapa-viaje" data-mapa-de="' + esc(v.Viaje_ID) + '">' + mapa(v, conMapa) + '</div>' +
      '<div class="row gx-3 gy-0 mt-2">' + datos + '</div>' +
      '</div>' + pie + '</article>';
  }

  function mostrarLista(html) {
    SGTL.ocultarTooltips();
    document.getElementById('listaViajes').innerHTML = html;
  }

  function sinViajes() {
    var de = estado.soloLectura ? esc(estado.nombreChofer) + ' no tiene' : 'No tenés';
    return '<p class="text-muted text-center my-5">' + (estado.vista === 'anteriores'
      ? de + ' viajes anteriores en ' + esc(estado.anio) + '.'
      : de + ' viajes para hoy ni para los próximos días.') + '</p>';
  }

  function botonVerMas() {
    return estado.vista === 'anteriores' && estado.hayMas
      ? '<div class="text-center mt-3"><button type="button" class="btn btn-outline-primary" data-accion="ver-mas">Ver más viajes</button></div>'
      : '';
  }

  function dibujar() {
    if (!estado.viajes.length) { mostrarLista(sinViajes()); return; }
    estado.sigue = estado.vista === 'proximos' ? viajeQueSigue(estado.viajes, estado.hoy) : null;
    mostrarLista(agruparPorDia(estado.viajes).map(function (g) {
      return '<section class="mb-2"><div class="sgtl-bloque-titulo mb-3">' + esc(tituloDia(g.fecha, estado.hoy)) + '</div>' +
        '<div class="row g-3 align-items-start">' + g.viajes.map(function (v) {
          return '<div class="col-12 col-xl-6">' + tarjeta(v, mapaAbierto(v)) + '</div>';
        }).join('') + '</div></section>';
    }).join('') + botonVerMas());
    Array.prototype.forEach.call(document.querySelectorAll('#listaViajes [data-mapa]'), function (contenedor) {
      dibujarMapa(estado.porId[contenedor.getAttribute('data-mapa')], contenedor);
    });
  }

  // ---------------------------------------------------------------- Mapa (Google Maps, como en Gestionar viajes)

  var bibliotecasMapa = null;
  var rutas = {};

  function cargarMapas() {
    if (!bibliotecasMapa) {
      bibliotecasMapa = window.SGTLGoogleMaps.cargar()
        .then(function () { return Promise.all([google.maps.importLibrary('maps'), google.maps.importLibrary('routes')]); })
        .catch(function (e) { bibliotecasMapa = null; throw e; });
    }
    return bibliotecasMapa;
  }

  function sinMapa(contenedor) {
    contenedor.innerHTML = '<p class="text-muted small text-center m-0">No se pudo cargar el mapa: abrilo en Google Maps.</p>';
  }

  // La ruta de cada viaje se pide una sola vez por visita: al volver a dibujar la lista se reusa.
  function dibujarMapa(v, contenedor) {
    if (!v || !contenedor) return;
    contenedor.innerHTML = '<p class="text-muted small text-center m-0">Cargando el mapa…</p>';
    cargarMapas().then(function (libs) {
      if (!contenedor.isConnected) return;
      contenedor.innerHTML = '';
      var mapaViaje = new libs[0].Map(contenedor, {
        center: { lat: -34.6, lng: -58.4 }, zoom: 5,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        // En el celular, un dedo mueve la lista y dos mueven el mapa.
        gestureHandling: 'cooperative'
      });
      var dibujo = new libs[1].DirectionsRenderer({ map: mapaViaje, draggable: false });
      if (rutas[v.Viaje_ID]) { dibujo.setDirections(rutas[v.Viaje_ID]); return; }
      var origen = v.Origen_Direccion + ', Argentina', destino = v.Destino_Direccion + ', Argentina';
      var galpon = galponDe(v);
      var pedido = galpon
        ? { origin: galpon, destination: galpon, travelMode: 'DRIVING',
            waypoints: [{ location: origen, stopover: true }, { location: destino, stopover: true }] }
        : { origin: origen, destination: destino, travelMode: 'DRIVING' };
      new libs[1].DirectionsService().route(pedido, function (resultado, status) {
        if (status !== 'OK') { sinMapa(contenedor); return; }
        rutas[v.Viaje_ID] = resultado;
        dibujo.setDirections(resultado);
      });
    }, function () { sinMapa(contenedor); });
  }

  function verMapa(id) {
    var v = estado.porId[id];
    var lugarMapa = document.querySelector('#listaViajes [data-mapa-de="' + id + '"]');
    if (!v || !lugarMapa) return;
    var abrir = !mapaAbierto(v);
    estado.mapasAbiertos[id] = abrir;
    lugarMapa.innerHTML = mapa(v, abrir);
    if (abrir) dibujarMapa(v, lugarMapa.querySelector('[data-mapa]'));
  }

  // Sin vista, vuelve a traer la misma después de una acción: deja la lista como está hasta que llega la nueva, así el
  // chofer no pierde el lugar en el celular.
  function cargar(vista) {
    var otraVista = !!vista;
    if (vista) { estado.vista = vista; estado.cantidad = ANTERIORES_POR_PAGINA; }
    var busqueda = ++estado.busqueda;
    var datos = { vista: estado.vista };
    if (estado.choferVisto) datos.choferId = estado.choferVisto;
    // El enlace del WhatsApp (?viaje=48): a quien ve todas, la API le muestra la hoja de ruta del chofer de ese viaje.
    else if (estado.buscarViaje) datos.viajeId = estado.buscarViaje;
    if (estado.anio) datos.anio = estado.anio;
    if (estado.vista === 'anteriores') datos.cantidad = estado.cantidad;
    document.getElementById('bloqueAnio').classList.toggle('d-none', estado.vista !== 'anteriores');
    Array.prototype.forEach.call(document.querySelectorAll('#vistaHojaDeRuta [data-vista]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-vista') === estado.vista));
    });
    if (otraVista) mostrarLista('<p class="text-muted text-center my-5">Cargando…</p>');
    return pedir({ url: API + '/HojaDeRuta', type: 'GET', data: datos },
      'No se pudo cargar tu hoja de ruta. Revisá la conexión y probá de nuevo.').then(function (data) {
        if (busqueda !== estado.busqueda) return;
        data = data || {};
        estado.hoy = soloFecha(data.Hoy);
        estado.gastos = !!data.Gastos_Habilitados;
        estado.galpon = data.Galpon || null;
        mostrarQuienVe(data);
        var paraElegir = data.Vinculado === false && estado.puedeVerTodas;
        document.getElementById('sinChofer').classList.toggle('d-none', data.Vinculado !== false || paraElegir);
        document.getElementById('contenidoHojaDeRuta').classList.toggle('d-none', data.Vinculado === false);
        document.getElementById('listaViajes').classList.toggle('d-none', data.Vinculado === false && !paraElegir);
        if (paraElegir) mostrarLista('<p class="text-muted text-center my-5">Elegí un chofer para ver su hoja de ruta.</p>');
        if (data.Vinculado === false) return;
        if (data.Anio) estado.anio = data.Anio;
        estado.hayMas = !!data.Hay_Mas;
        if (data.Anios) mostrarAnios(data.Anios);
        mostrarCantidades(data);
        estado.viajes = data.Viajes || [];
        estado.porId = {};
        estado.viajes.forEach(function (v) { estado.porId[v.Viaje_ID] = v; });
        dibujar();
        irAlViajePedido();
      }, function (error) {
        if (busqueda !== estado.busqueda) return;
        mostrarLista('<p class="text-muted text-center my-5">No se pudo cargar tu hoja de ruta.</p>');
        SGTL.toastError(error.mensajeUsuario);
      });
  }

  // Quién ve la hoja de ruta: el chofer, la suya; quien ve todas, el buscador de chofer y, si eligió otro, "para ver".
  function mostrarQuienVe(data) {
    estado.puedeVerTodas = !!data.Puede_Ver_Todas;
    estado.soloLectura = !!data.Solo_Lectura;
    estado.nombreChofer = data.Chofer || '';
    if (data.Chofer_ID) estado.choferVisto = data.Chofer_ID;
    document.getElementById('subtituloHojaDeRuta').textContent = estado.soloLectura
      ? 'Los viajes de ' + estado.nombreChofer + ', para ver: los cambios se hacen en Gestionar viajes.'
      : estado.puedeVerTodas && data.Vinculado === false
      ? 'Los viajes de cada chofer: el recorrido, el camión y la entrega.'
      : 'Tus viajes: el recorrido, el camión y la entrega.';
    document.getElementById('bloqueChofer').classList.toggle('d-none', !estado.puedeVerTodas);
    if (!estado.puedeVerTodas) return;
    var select = document.getElementById('choferHojaDeRuta');
    var elegir = function () {
      select.value = estado.choferVisto ? String(estado.choferVisto) : '';
      if (window.SelectClientePredictivo) SelectClientePredictivo.sincronizar('choferHojaDeRuta');
    };
    if (estado.choferesCargados) { elegir(); return; }
    estado.choferesCargados = true;
    pedir({ url: API + '/HojaDeRuta/ChoferesParaVer', type: 'GET' }, 'No se pudieron cargar los choferes.').then(function (choferes) {
      (choferes || []).forEach(function (c) {
        var opcion = document.createElement('option');
        opcion.value = c.Chofer_ID;
        opcion.textContent = ((c.Apellido || '').trim() + ', ' + (c.Nombre || '').trim()) + (c.DNI ? ' (DNI ' + String(c.DNI).trim() + ')' : '') +
          (c.EstadoChofer && c.EstadoChofer !== 'Activo' ? ' (inactivo)' : '');
        select.appendChild(opcion);
      });
      if (window.SelectClientePredictivo) {
        SelectClientePredictivo.inicializar('choferHojaDeRuta', { placeholder: 'Buscá un chofer', idCampo: 'choferHojaDeRutaBuscar', textoVacio: 'No hay choferes que coincidan.' });
      }
      elegir();
    }, function (error) { estado.choferesCargados = false; SGTL.toastError(error.mensajeUsuario); });
  }

  // Elegir otro chofer: su hoja de ruta, desde Hoy y próximos.
  function verChofer(id) {
    id = Number(id) || null;
    if (!id || id === estado.choferVisto) return;
    estado.choferVisto = id;
    estado.anio = null;
    estado.buscarViaje = null;
    cargar('proximos');
  }

  // Los años con viajes anteriores (y el actual), del más nuevo al más viejo.
  function mostrarAnios(anios) {
    document.getElementById('anioHojaDeRuta').innerHTML = anios.map(function (a) {
      return '<option value="' + esc(a) + '"' + (Number(a) === Number(estado.anio) ? ' selected' : '') + '>' + esc(a) + '</option>';
    }).join('');
  }

  // "Ver más viajes": vuelve a pedir Anteriores con 30 más (la lista queda como está hasta que llegan).
  function verMas(boton) {
    boton.disabled = true;
    boton.textContent = 'Cargando…';
    estado.cantidad += ANTERIORES_POR_PAGINA;
    cargar();
  }

  // Cuántos viajes hay en cada vista, en el selector: "Hoy y próximos (3)", "Anteriores (12)" (Rocío, 24/10).
  // (El espacio lo da el margen: el botón es flex y se come el espacio del principio.)
  function textoCantidad(cantidad) { return cantidad == null ? '' : '(' + cantidad + ')'; }

  function mostrarCantidades(data) {
    var cantidades = { proximos: data.Cantidad_Proximos, anteriores: data.Cantidad_Anteriores };
    Array.prototype.forEach.call(document.querySelectorAll('#vistaHojaDeRuta [data-cantidad-de]'), function (lugar) {
      lugar.textContent = textoCantidad(cantidades[lugar.getAttribute('data-cantidad-de')]);
      lugar.classList.toggle('ms-1', lugar.textContent !== '');
    });
  }

  // El enlace de WhatsApp abre hoja-de-ruta.html?viaje=48: se marca ese viaje (y si ya pasó, se busca en Anteriores).
  function irAlViajePedido() {
    var id = estado.buscarViaje;
    if (!id) return;
    var tarjetaViaje = document.getElementById('viaje-' + id);
    if (tarjetaViaje) {
      estado.buscarViaje = null;
      tarjetaViaje.classList.add('sgtl-viaje-pedido');
      tarjetaViaje.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }
    if (estado.vista === 'proximos') { cargar('anteriores'); return; }
    estado.buscarViaje = null;
    SGTL.toastError(estado.soloLectura ? 'El viaje #' + id + ' no está en la hoja de ruta de ' + estado.nombreChofer + '.'
      : 'El viaje #' + id + ' no está en tu hoja de ruta.');
  }

  // ---------------------------------------------------------------- Iniciar viaje

  function iniciarViaje(id) {
    var v = estado.porId[id];
    if (!v) return;
    SGTL.confirmar({
      titulo: '¿Iniciar el viaje #' + id + '?',
      // "La administración": es el área que trabaja con el chofer (relevamiento, parte 1 de la tesis).
      mensaje: (v.Origen || 'Origen') + ' → ' + (v.Destino || 'destino') + '.',
      verbo: 'Iniciar viaje',
      accion: function () {
        return pedir({ url: API + '/HojaDeRuta/Viajes/' + encodeURIComponent(id) + '/Iniciar', type: 'POST' },
          'No se pudo iniciar el viaje. Probá de nuevo.');
      }
    }).then(function (hecho) {
      if (!hecho) return;
      SGTL.toastExito('Viaje #' + id + ' en viaje.');
      cargar();
    });
  }

  // Sin carga (punto 10 de la §41; antes "falso flete"): llegó al origen y no había carga. El viaje se cierra así; si después
  // hay carga, administración registra otro viaje. Lo que se cobra lo calcula la API.
  function registrarSinCarga(id) {
    var v = estado.porId[id];
    if (!v) return;
    SGTL.confirmar({
      titulo: '¿Registrar el viaje #' + id + ' sin carga?',
      mensaje: 'Llegaste a ' + (v.Origen || 'el origen') + ' y no había carga: el viaje se cierra así. Si después hay carga, administración registra otro viaje.',
      verbo: 'Registrar sin carga',
      motivo: { etiqueta: 'Observación', obligatorio: false, placeholder: 'Por ejemplo: la planta no tenía la carga lista', ayuda: 'Opcional. Queda en el viaje.' },
      accion: function (observacion) {
        return pedir({
          url: API + '/HojaDeRuta/Viajes/' + encodeURIComponent(id) + '/SinCarga',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ Observacion: observacion || null })
        }, 'No se pudo registrar el viaje sin carga. Probá de nuevo.');
      }
    }).then(function (hecho) {
      if (!hecho) return;
      SGTL.toastExito('Viaje #' + id + ' sin carga.');
      cargar();
    });
  }

  // ---------------------------------------------------------------- Evidencia

  function leerBase64(blob) {
    return new Promise(function (resolver, rechazar) {
      var lector = new FileReader();
      lector.onload = function () { resolver(String(lector.result).split(',')[1] || ''); };
      lector.onerror = function () { rechazar(lector.error); };
      lector.readAsDataURL(blob);
    });
  }

  // Foto grande (o HEIC del iPhone) → JPG de 1600 px de lado. Si el navegador no la puede leer, va tal cual (la API
  // dice si no sirve).
  function prepararArchivo(file) {
    var tipo = tipoDeArchivo(file);
    var nombre = file.name || 'evidencia';
    var esHeic = /heic|heif/.test(tipo);
    if (!/^image\//.test(tipo) || (!esHeic && file.size <= ACHICAR_DESDE)) {
      return Promise.resolve({ archivo: file, nombre: nombre, tipo: tipo });
    }
    return new Promise(function (resolver) {
      var url = URL.createObjectURL(file);
      var imagen = new Image();
      var tal = { archivo: file, nombre: nombre, tipo: tipo };
      imagen.onload = function () {
        var escala = Math.min(1, LADO_FOTO / Math.max(imagen.naturalWidth, imagen.naturalHeight));
        var lienzo = document.createElement('canvas');
        lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
        lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
        lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
        URL.revokeObjectURL(url);
        if (!lienzo.toBlob) { resolver(tal); return; }
        lienzo.toBlob(function (blob) {
          resolver(blob ? { archivo: blob, nombre: nombre.replace(/\.[^.]+$/, '') + '.jpg', tipo: 'image/jpeg' } : tal);
        }, 'image/jpeg', CALIDAD_FOTO);
      };
      imagen.onerror = function () { URL.revokeObjectURL(url); resolver(tal); };
      imagen.src = url;
    });
  }

  function subirEvidencia(id, file) {
    return prepararArchivo(file).then(function (p) {
      if (p.archivo.size > MAX_BYTES) {
        var grande = new Error('archivo');
        grande.mensajeUsuario = 'El archivo pesa más de 5 MB. Sacá otra foto o elegí un PDF más liviano.';
        throw grande;
      }
      return leerBase64(p.archivo).then(function (b64) {
        return pedir({
          url: API + '/HojaDeRuta/Viajes/' + encodeURIComponent(id) + '/Evidencia',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({ Nombre_Archivo: p.nombre, Content_Type: p.tipo, ContenidoBase64: b64 })
        }, 'No se pudo subir la evidencia. Probá de nuevo.');
      });
    }).then(function () {
      if (estado.porId[id]) estado.porId[id].Tiene_Evidencia = true;
    });
  }

  function reglaArchivo(id, obligatoria, mensaje) {
    return {
      id: id,
      requerido: obligatoria ? (mensaje || 'Elegí la foto o el PDF del remito.') : '',
      validar: function (valor, campo) { return problemaDelArchivo((campo.files || [])[0]); }
    };
  }

  // Reemplazar la evidencia de un viaje entregado (por ejemplo, si la foto no se lee).
  function abrirEvidencia(id) {
    var v = estado.porId[id];
    if (!v) return;
    SGTL.reiniciarFormulario('#formEvidencia', '#avisoEvidencia');
    document.getElementById('evidenciaViajeId').value = id;
    document.getElementById('modalEvidenciaTitulo').textContent = 'Reemplazar evidencia del viaje #' + id;
    document.getElementById('evidenciaResumen').textContent = (v.Destino || '') + (v.Cliente ? ' · ' + v.Cliente : '');
    formularioEvidencia.reiniciar();
    SGTL.modal('#modalEvidencia', 'show');
  }

  function guardarEvidencia() {
    var id = document.getElementById('evidenciaViajeId').value;
    formularioEvidencia.validarTodo();
    if (!SGTL.revisarFormulario('#formEvidencia', '#avisoEvidencia')) return;
    var file = (document.getElementById('evidenciaSolaArchivo').files || [])[0];
    var listo = SGTL.procesando('#btnGuardarEvidencia', 'Reemplazando…');
    subirEvidencia(id, file).then(function () {
      listo();
      SGTL.modal('#modalEvidencia', 'hide');
      SGTL.toastExito('Evidencia del viaje #' + id + ' reemplazada.');
      cargar();
    }, function (error) {
      listo();
      SGTL.avisoFormulario('#avisoEvidencia', error.mensajeUsuario || 'No se pudo subir la evidencia. Probá de nuevo.');
    });
  }

  // Ver la evidencia: la API pide el token, así que se baja con fetch y se muestra en la ventana (foto) o se ofrece abrir
  // el PDF. Un enlace directo no llevaría el token.
  // La evidencia o el ticket de un gasto: la API pide el token, así que se baja y se muestra en la ventana.
  function verArchivo(url, titulo, nombre) {
    var cuerpo = document.getElementById('verEvidenciaCuerpo');
    document.getElementById('verEvidenciaTitulo').textContent = titulo;
    cuerpo.innerHTML = '<p class="text-muted text-center my-4">Cargando…</p>';
    if (urlEvidencia) { URL.revokeObjectURL(urlEvidencia); urlEvidencia = null; }
    SGTL.modal('#modalVerEvidencia', 'show');
    fetch(url, { headers: encabezados() }).then(function (r) {
      if (r.status === 401) {
        SGTL.mensajeError({ status: 401 });
        throw new Error('Tu sesión venció. Volvé a iniciar sesión.');
      }
      if (!r.ok) throw new Error('No se pudo abrir ' + nombre + '. Probá de nuevo.');
      return r.blob();
    }).then(function (blob) {
      urlEvidencia = URL.createObjectURL(blob);
      if (/^image\//.test(blob.type)) {
        cuerpo.innerHTML = '<img class="img-fluid rounded d-block mx-auto" alt="' + esc(titulo) + '" src="' + urlEvidencia + '">';
      } else {
        cuerpo.innerHTML = '<p class="mb-3">Es un PDF.</p><a class="btn btn-primary" target="_blank" rel="noopener" href="' + urlEvidencia + '">' +
          '<i class="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>Abrir PDF</a>';
      }
    }).catch(function (error) {
      cuerpo.innerHTML = '<p class="text-muted text-center my-4">' + esc(error.message) + '</p>';
    });
  }

  function verEvidencia(id) {
    verArchivo(API + '/HojaDeRuta/Viajes/' + encodeURIComponent(id) + '/Evidencia', 'Ver evidencia del viaje #' + id, 'la evidencia');
  }

  // ---------------------------------------------------------------- Gastos del viaje (rendición del chofer)

  var TIPOS_GASTO = { Combustible: 'Combustible', Peaje: 'Peaje', Comida: 'Comida', Otro: 'Otro' };

  function litrosTexto(valor) {
    var n = Number(valor);
    return isFinite(n) ? n.toLocaleString('es-AR', { maximumFractionDigits: 2 }) + ' l' : '';
  }

  // En una lista y no en una tabla: en el celular una tabla no entra (como las tarjetas de los viajes, §10).
  function filaGasto(g, motivoEliminar) {
    var tipo = TIPOS_GASTO[g.Tipo] || g.Tipo;
    var detalle = [SGTL.fecha(g.Fecha)];
    if (g.Detalle) detalle.push(g.Detalle);
    return '<li class="border-bottom py-3"><div class="d-flex justify-content-between gap-3">' +
      '<div><div class="fw-semibold">' + esc(tipo) + (g.Litros != null ? ' · ' + esc(litrosTexto(g.Litros)) : '') + '</div>' +
      '<div class="text-muted small">' + esc(detalle.join(' · ')) + '</div></div>' +
      '<div class="fw-semibold text-nowrap">' + esc(SGTL.monto(g.Importe)) + '</div></div>' +
      '<div class="d-flex gap-2 mt-2">' +
      '<button type="button" class="btn btn-sm btn-outline-secondary" data-accion="ver" data-id="' + esc(g.Gasto_ID) + '">' +
      '<i class="bi bi-paperclip me-1" aria-hidden="true"></i>Ver ticket</button>' +
      (motivoEliminar === null ? '</div></li>'
        : motivoEliminar
        ? '<button type="button" class="btn btn-sm btn-outline-danger" disabled><i class="bi bi-trash me-1" aria-hidden="true"></i>Eliminar</button></div>' +
          '<div class="form-text mt-1">' + esc(motivoEliminar) + '.</div></li>'
        : '<button type="button" class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="' + esc(g.Gasto_ID) + '" data-importe="' + esc(g.Importe) + '">' +
          '<i class="bi bi-trash me-1" aria-hidden="true"></i>Eliminar</button></div></li>');
  }

  function mostrarGastos(r) {
    var gastos = (r && r.Gastos) || [];
    // Eliminar, con la misma regla que cargar (pasado el tope, ya no).
    var v = estado.porId[gastosAbiertos];
    // Solo lectura: sin Eliminar (null).
    var motivoEliminar = estado.soloLectura ? null : (v ? motivoGasto(v, estado.hoy, 'eliminar') : '') || '';
    document.getElementById('listaGastos').innerHTML = gastos.length ? gastos.map(function (g) { return filaGasto(g, motivoEliminar); }).join('')
      : '<li class="text-muted text-center py-4">' + (estado.soloLectura ? 'El chofer todavía no cargó gastos en este viaje.' : 'Todavía no cargaste gastos en este viaje.') + '</li>';
    document.getElementById('gastosTotal').textContent = gastos.length ? 'Total: ' + SGTL.monto(r.Total) : '';
  }

  function verGastos(id) {
    var v = estado.porId[id];
    if (!v) return;
    gastosAbiertos = id;
    document.getElementById('verGastosTitulo').textContent = 'Gastos del viaje #' + id;
    document.getElementById('listaGastos').innerHTML = '<li class="text-muted text-center py-4">Cargando…</li>';
    document.getElementById('gastosTotal').textContent = '';
    SGTL.modal('#modalVerGastos', 'show');
    pedir({ url: API + '/HojaDeRuta/Viajes/' + encodeURIComponent(id) + '/Gastos', type: 'GET' },
      'No se pudieron cargar los gastos del viaje. Probá de nuevo.').then(mostrarGastos, function (error) {
        document.getElementById('listaGastos').innerHTML = '<li class="text-muted text-center py-4">' + esc(error.mensajeUsuario) + '</li>';
      });
  }

  function eliminarGasto(gastoId, importe) {
    var id = gastosAbiertos;
    SGTL.confirmar({
      titulo: '¿Eliminar el gasto de ' + SGTL.monto(importe) + '?',
      mensaje: 'Se borra con su ticket. No se puede deshacer.',
      verbo: 'Eliminar',
      peligro: true,
      accion: function () {
        return pedir({ url: API + '/HojaDeRuta/Viajes/' + encodeURIComponent(id) + '/Gastos/' + encodeURIComponent(gastoId), type: 'DELETE' },
          'No se pudo eliminar el gasto. Probá de nuevo.').then(mostrarGastos);
      }
    }).then(function (hecho) {
      if (!hecho) return;
      SGTL.toastExito('Gasto eliminado.');
      cargar();
    });
  }

  function abrirGasto(id) {
    var v = estado.porId[id];
    if (!v) return;
    SGTL.reiniciarFormulario('#formGasto', '#avisoGasto');
    formularioGasto.reiniciar();
    document.getElementById('gastoViajeId').value = id;
    document.getElementById('modalGastoTitulo').textContent = 'Cargar gasto del viaje #' + id;
    document.getElementById('gastoResumen').textContent = (v.Origen || '') + ' → ' + (v.Destino || '');
    document.getElementById('gastoFecha')._flatpickr.setDate(aDia(estado.hoy) || new Date(), false);
    mostrarLitros();
    SGTL.modal('#modalGasto', 'show');
  }

  function mostrarLitros() {
    var combustible = document.getElementById('gastoTipo').value === 'Combustible';
    document.getElementById('campoLitros').classList.toggle('d-none', !combustible);
    if (!combustible) { document.getElementById('gastoLitros').value = ''; SGTL.limpiarError('#gastoLitros'); }
  }

  function numeroLitros(texto) {
    var t = String(texto || '').trim();
    if (!t) return null;
    return /^\d{1,4}([.,]\d{1,2})?$/.test(t) ? Number(t.replace(',', '.')) : NaN;
  }

  var reglasGasto = [
    { id: 'gastoTipo', requerido: 'Seleccioná el tipo de gasto.' },
    {
      id: 'gastoImporte', requerido: 'Completá el importe.',
      validar: function (valor) {
        var centavos = SGTL.montoCentavos(valor);
        return centavos == null ? 'Escribí el importe como 85.000,00.' : (centavos <= 0 ? 'Tiene que ser mayor que cero.' : '');
      }
    },
    {
      id: 'gastoLitros',
      get requerido() { return document.getElementById('gastoTipo').value === 'Combustible' ? 'Completá los litros que cargaste.' : ''; },
      validar: function (valor) {
        var n = numeroLitros(valor);
        return isNaN(n) ? 'Escribí los litros como 120 o 120,5.' : (n <= 0 ? 'Tienen que ser más de cero.' : '');
      }
    },
    {
      id: 'gastoFecha', requerido: 'Completá la fecha del gasto.',
      validar: function (valor) {
        var fecha = SGTL.leerFecha(valor);
        if (!fecha) return 'Escribila como DD/MM/AAAA.';
        return estado.hoy && SGTL.fechaISO(fecha) > estado.hoy ? 'No puede ser posterior a hoy.' : '';
      }
    },
    { id: 'gastoDetalle', max: 200 },
    reglaArchivo('gastoTicket', true, 'Elegí la foto o el PDF del ticket.')
  ];

  function guardarGasto() {
    var id = document.getElementById('gastoViajeId').value;
    formularioGasto.validarTodo();
    if (!SGTL.revisarFormulario('#formGasto', '#avisoGasto')) return;
    var file = (document.getElementById('gastoTicket').files || [])[0];
    var tipo = document.getElementById('gastoTipo').value;
    var listo = SGTL.procesando('#btnGuardarGasto', 'Cargando…');
    prepararArchivo(file).then(function (p) {
      if (p.archivo.size > MAX_BYTES) {
        var grande = new Error('archivo');
        grande.mensajeUsuario = 'El ticket pesa más de 5 MB. Sacá otra foto o elegí un PDF más liviano.';
        throw grande;
      }
      return leerBase64(p.archivo).then(function (b64) {
        return pedir({
          url: API + '/HojaDeRuta/Viajes/' + encodeURIComponent(id) + '/Gastos',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            Tipo: tipo,
            Importe: SGTL.montoCentavos(document.getElementById('gastoImporte').value) / 100,
            Litros: tipo === 'Combustible' ? numeroLitros(document.getElementById('gastoLitros').value) : null,
            Fecha: SGTL.fechaISO(SGTL.leerFecha(document.getElementById('gastoFecha').value)),
            Detalle: document.getElementById('gastoDetalle').value.trim(),
            Nombre_Archivo: p.nombre, Content_Type: p.tipo, ContenidoBase64: b64
          })
        }, 'No se pudo cargar el gasto. Probá de nuevo.');
      });
    }).then(function () {
      listo();
      SGTL.modal('#modalGasto', 'hide');
      SGTL.toastExito('Gasto del viaje #' + id + ' cargado.');
      cargar();
    }, function (error) {
      listo();
      SGTL.avisoFormulario('#avisoGasto', error.mensajeUsuario || 'No se pudo cargar el gasto. Probá de nuevo.');
    });
  }

  // ---------------------------------------------------------------- Registrar entrega

  function abrirEntrega(id) {
    var v = estado.porId[id];
    if (!v) return;
    SGTL.reiniciarFormulario('#formEntrega', '#avisoEntrega');
    formularioEntrega.reiniciar();
    document.getElementById('entregaViajeId').value = id;
    document.getElementById('modalEntregaTitulo').textContent = 'Registrar entrega del viaje #' + id;
    document.getElementById('entregaResumen').textContent = (v.Destino || '') + (v.Cliente ? ' · ' + v.Cliente : '');
    var fecha = document.getElementById('entregaFecha');
    if (fecha._flatpickr) fecha._flatpickr.setDate(aDia(estado.hoy) || new Date(), false);
    pedirEvidenciaEnEntrega(v);
    SGTL.modal('#modalEntrega', 'show');
  }

  function pedirEvidenciaEnEntrega(v) {
    var obligatoria = !v.Tiene_Evidencia;
    document.getElementById('entregaEvidenciaMarca').classList.toggle('d-none', !obligatoria);
    document.getElementById('entregaEvidenciaActual').classList.toggle('d-none', obligatoria);
    document.getElementById('entregaEvidenciaAyuda').textContent = (obligatoria
      ? 'Foto o PDF del remito firmado, o con la nota de rechazo.'
      : 'Ya cargaste la evidencia; para cambiarla, elegí otra.') + ' Las fotos se achican solas; el PDF, hasta 5 MB.';
    reglasEntrega[2].requerido = obligatoria ? 'Elegí la foto o el PDF del remito.' : '';
  }

  var reglasEntrega = [
    { id: 'entregaResultado', requerido: 'Seleccioná el resultado de la entrega.' },
    {
      id: 'entregaFecha',
      requerido: 'Completá la fecha de entrega.',
      validar: function (valor) {
        var v = estado.porId[document.getElementById('entregaViajeId').value] || {};
        var fecha = SGTL.leerFecha(valor);
        if (!fecha) return 'Escribila como DD/MM/AAAA.';
        var iso = SGTL.fechaISO(fecha);
        var inicio = soloFecha(v.Fecha_Inicio);
        if (inicio && iso < inicio) return 'No puede ser anterior al inicio del viaje (' + SGTL.fecha(inicio) + ').';
        if (estado.hoy && iso > estado.hoy) return 'No puede ser posterior a hoy.';
        return '';
      }
    },
    reglaArchivo('entregaEvidencia', true)
  ];

  function guardarEntrega() {
    var id = document.getElementById('entregaViajeId').value;
    var v = estado.porId[id];
    if (!v) return;
    formularioEntrega.validarTodo();
    if (!SGTL.revisarFormulario('#formEntrega', '#avisoEntrega')) return;
    var file = (document.getElementById('entregaEvidencia').files || [])[0];
    var dto = {
      Resultado_Entrega: document.getElementById('entregaResultado').value,
      Fecha_Entrega: SGTL.fechaISO(SGTL.leerFecha(document.getElementById('entregaFecha').value))
    };
    var listo = SGTL.procesando('#btnGuardarEntrega', 'Registrando…');
    // Primero la evidencia: la API la exige para entregar un viaje directo. Si la entrega falla después, la evidencia
    // ya quedó cargada y no hace falta volver a elegirla.
    (file ? subirEvidencia(id, file) : Promise.resolve()).then(function () {
      if (file) {
        document.getElementById('entregaEvidencia').value = '';
        pedirEvidenciaEnEntrega(v);
      }
      return pedir({
        url: API + '/HojaDeRuta/Viajes/' + encodeURIComponent(id) + '/Entrega',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dto)
      }, 'No se pudo registrar la entrega. Probá de nuevo.');
    }).then(function () {
      listo();
      SGTL.modal('#modalEntrega', 'hide');
      SGTL.toastExito('Viaje #' + id + ' entregado.');
      cargar();
    }, function (error) {
      listo();
      SGTL.avisoFormulario('#avisoEntrega', error.mensajeUsuario || 'No se pudo registrar la entrega. Probá de nuevo.');
    });
  }

  // ---------------------------------------------------------------- Inicio

  function iniciar() {
    var pedido = /(?:\?|&)viaje=(\d+)/.exec(window.location.search);
    estado.buscarViaje = pedido ? pedido[1] : null;

    SGTL.selectorFecha('#entregaFecha');
    formularioEntrega = SGTL.validador(reglasEntrega);
    formularioEvidencia = SGTL.validador([reglaArchivo('evidenciaSolaArchivo', true)]);

    document.getElementById('vistaHojaDeRuta').addEventListener('click', function (e) {
      var boton = e.target.closest('[data-vista]');
      if (boton) cargar(boton.getAttribute('data-vista'));
    });
    document.getElementById('listaViajes').addEventListener('click', function (e) {
      var boton = e.target.closest('[data-accion]');
      if (!boton) return;
      var id = boton.getAttribute('data-id');
      var accion = boton.getAttribute('data-accion');
      if (accion === 'iniciar') iniciarViaje(id);
      else if (accion === 'entregar') abrirEntrega(id);
      else if (accion === 'sin-carga') registrarSinCarga(id);
      else if (accion === 'evidencia') abrirEvidencia(id);
      else if (accion === 'ver-evidencia') verEvidencia(id);
      else if (accion === 'ver-mapa') verMapa(id);
      else if (accion === 'cargar-gasto') abrirGasto(id);
      else if (accion === 'ver-gastos') verGastos(id);
      else if (accion === 'ver-mas') verMas(boton);
    });
    document.getElementById('choferHojaDeRuta').addEventListener('change', function () { verChofer(this.value); });
    document.getElementById('anioHojaDeRuta').addEventListener('change', function () {
      estado.anio = Number(this.value);
      cargar('anteriores');
    });
    document.getElementById('listaGastos').addEventListener('click', function (e) {
      var boton = e.target.closest('[data-accion]');
      if (!boton) return;
      if (boton.getAttribute('data-accion') === 'ver') {
        verArchivo(API + '/HojaDeRuta/Gastos/' + encodeURIComponent(boton.getAttribute('data-id')) + '/Comprobante', 'Ver ticket', 'el ticket');
      } else if (boton.getAttribute('data-accion') === 'eliminar') {
        eliminarGasto(boton.getAttribute('data-id'), boton.getAttribute('data-importe'));
      }
    });
    SGTL.selectorFecha('#gastoFecha');
    SGTL.enlazarMascaraMonto('#gastoImporte');
    formularioGasto = SGTL.validador(reglasGasto);
    document.getElementById('gastoTipo').addEventListener('change', mostrarLitros);
    document.getElementById('btnGuardarGasto').addEventListener('click', guardarGasto);
    if (window.SGTLGoogleMaps) {
      // Google rechazó la clave (sitio no permitido, API deshabilitada): los mapas dicen que se abran en Google Maps.
      window.SGTLGoogleMaps.alFallarAutenticacion(function () {
        Array.prototype.forEach.call(document.querySelectorAll('#listaViajes [data-mapa]'), sinMapa);
      });
    }
    document.getElementById('btnGuardarEntrega').addEventListener('click', guardarEntrega);
    document.getElementById('btnGuardarEvidencia').addEventListener('click', guardarEvidencia);
    document.getElementById('entregaVerEvidencia').addEventListener('click', function () {
      verEvidencia(document.getElementById('entregaViajeId').value);
    });
    document.getElementById('evidenciaVerActual').addEventListener('click', function () {
      verEvidencia(document.getElementById('evidenciaViajeId').value);
    });
    cargar('proximos');
  }

  window.SGTLHojaDeRuta = {
    iniciar: iniciar,
    tituloDia: tituloDia,
    agruparPorDia: agruparPorDia,
    horario: horario,
    accionesDe: accionesDe,
    viajeQueSigue: viajeQueSigue,
    enlaceNavegacion: enlaceNavegacion,
    kmRecorridoCompleto: kmRecorridoCompleto,
    puedeCargarGasto: puedeCargarGasto,
    motivoGasto: motivoGasto,
    atraso: atraso,
    problemaDelArchivo: problemaDelArchivo
  };
})(window, document);
