// Hoja de ruta del chofer (24/10): el chofer entra con su usuario y ve sus viajes desde el celular, agrupados por día,
// con el recorrido (y el enlace a Google Maps), el camión y los números del viaje. En los viajes de clientes directos
// inicia el viaje y registra la entrega con la evidencia; en los de clientes con plataforma solo carga la evidencia.
// La API (api/HojaDeRuta) saca el chofer del token: no hay forma de pedir los viajes de otro.
// Va después de jQuery, app.js, flatpickr y sgtl-ui.js. La lógica sin pantalla está en SGTLHojaDeRuta (tests/hoja-de-ruta.test.js).
(function (window, document) {
  'use strict';

  var API = 'http://localhost:50222/api';
  var ESTADOS = { Registrado: 'Registrado', En_viaje: 'En viaje', Entregado: 'Entregado', Listo_para_facturar: 'Listo para facturar', Facturado: 'Facturado' };
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

  // "06:00 a 14:30"; si termina otro día, "06:00 a 25/10/2026 14:30".
  function horario(v) {
    var inicio = hhmm(v.Fecha_Inicio), fin = hhmm(v.Fecha_Fin);
    if (!fin) return inicio;
    if (soloFecha(v.Fecha_Fin) !== soloFecha(v.Fecha_Inicio)) {
      var diaFin = aDia(v.Fecha_Fin);
      return inicio + ' a ' + (diaFin ? ddmmaaaa(diaFin) + ' ' : '') + fin;
    }
    return inicio + ' a ' + fin;
  }

  function esDirecto(v) { return v.Tipo_Cliente !== 'Con_plataforma'; }

  function proformaQueBloquea(v) {
    return v.EnProforma_Estado === 'Generada' || v.EnProforma_Estado === 'Aceptada' ? (v.EnProforma_Numero || 'emitida') : '';
  }

  // Qué puede hacer el chofer con el viaje.
  //   paso: el siguiente paso del circuito ({ accion: 'iniciar' | 'entregar', texto, motivo si no se puede }) o null;
  //   evidencia: 'subir' | 'reemplazar' | null; ver: si hay evidencia para abrir; nota: aclaración debajo de los botones.
  function accionesDe(v) {
    var r = { paso: null, evidencia: null, ver: !!v.Tiene_Evidencia, nota: '' };
    var estadoViaje = v.Estado || 'Registrado';
    if (estadoViaje === 'Facturado') return r;
    var bloquea = proformaQueBloquea(v);
    if (!esDirecto(v)) {
      r.evidencia = v.Tiene_Evidencia ? 'reemplazar' : 'subir';
      r.nota = 'Este viaje lo sigue la plataforma del cliente: acá solo cargás la evidencia.';
      return r;
    }
    if (estadoViaje === 'Registrado') {
      r.paso = { accion: 'iniciar', texto: 'Iniciar viaje', motivo: bloquea ? 'No se puede iniciar el viaje: está en la proforma ' + bloquea : '' };
    } else if (estadoViaje === 'En_viaje') {
      r.paso = { accion: 'entregar', texto: 'Registrar entrega', motivo: bloquea ? 'No se puede registrar la entrega: el viaje está en la proforma ' + bloquea : '' };
    } else {
      r.evidencia = v.Tiene_Evidencia ? 'reemplazar' : 'subir';
    }
    return r;
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

  var estado = { vista: 'proximos', hoy: '', viajes: [], porId: {}, busqueda: 0, buscarViaje: null };
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
    return '<div class="col-6"><div class="sgtl-dato"><div class="sgtl-dato-etiqueta">' + esc(etiqueta) + '</div>' +
      '<div class="sgtl-dato-valor">' + (valorHtml || '—') + '</div></div></div>';
  }

  function texto(valor) { var t = String(valor == null ? '' : valor).trim(); return t ? esc(t) : ''; }

  function lugar(icono, nombre, direccion, etiqueta) {
    return '<li><i class="bi ' + icono + '" aria-hidden="true"></i><div><span class="visually-hidden">' + etiqueta + ': </span>' +
      '<div class="fw-semibold">' + (texto(nombre) || texto(direccion) || '—') + '</div>' +
      (nombre && direccion ? '<div class="text-muted small">' + esc(direccion) + '</div>' : '') + '</div></li>';
  }

  function etiquetas(v) {
    var html = SGTL.estado(v.Estado, ESTADOS[v.Estado] || v.Estado);
    if (v.Resultado_Entrega) {
      var resultado = v.Resultado_Entrega === 'Rechazo' ? 'Con rechazo' : v.Resultado_Entrega;
      html += '<div class="mt-1">' + SGTL.estado(v.Resultado_Entrega, resultado, COLOR_RESULTADO[v.Resultado_Entrega]) + '</div>';
    }
    return html;
  }

  function botonPaso(v, paso) {
    var icono = paso.accion === 'iniciar' ? 'bi-play-circle' : 'bi-check2-circle';
    var contenido = '<i class="bi ' + icono + ' me-1" aria-hidden="true"></i>' + esc(paso.texto);
    // Deshabilitado con el motivo (§1.4) escrito debajo: en el celular no hay globitos. Sin aria-label, que el estilo
    // del sistema reserva para los botones de solo ícono (§12).
    if (paso.motivo) {
      var idMotivo = 'motivo-viaje-' + esc(v.Viaje_ID);
      return '<button type="button" class="btn btn-success" disabled aria-describedby="' + idMotivo + '">' + contenido + '</button>' +
        '<div class="form-text mt-0" id="' + idMotivo + '">' + esc(paso.motivo) + '.</div>';
    }
    return '<button type="button" class="btn btn-success" data-accion="' + paso.accion + '" data-id="' + esc(v.Viaje_ID) + '">' + contenido + '</button>';
  }

  function tarjeta(v) {
    var a = accionesDe(v);
    var evidencia = v.Tiene_Evidencia
      ? '<button type="button" class="btn btn-link p-0 align-baseline" data-accion="ver-evidencia" data-id="' + esc(v.Viaje_ID) + '">' +
        '<i class="bi bi-paperclip" aria-hidden="true"></i> Ver evidencia</button>'
      : '<span class="text-muted">Sin cargar</span>';
    var datos = dato('Camión', texto(v.Camion) + (v.Camion_Detalle ? '<div class="suave">' + esc(v.Camion_Detalle) + '</div>' : '')) +
      dato('Distancia', esc(kmTexto(v.Distancia_KM))) +
      dato('Número de remito', texto(v.Num_Remito)) +
      (esDirecto(v) ? '' : dato('N° transporte SAP', texto(v.Num_Transporte)) + dato('N° entrega Rukas', texto(v.Num_de_Carga))) +
      (v.Fecha_Entrega ? dato('Fecha de entrega', esc(SGTL.fecha(v.Fecha_Entrega))) : '') +
      dato('Evidencia', evidencia);

    var botones = [];
    if (a.paso) botones.push(botonPaso(v, a.paso));
    if (a.evidencia) {
      botones.push('<button type="button" class="btn btn-outline-primary" data-accion="evidencia" data-id="' + esc(v.Viaje_ID) + '">' +
        '<i class="bi bi-camera me-1" aria-hidden="true"></i>' + (a.evidencia === 'reemplazar' ? 'Reemplazar evidencia' : 'Subir evidencia') + '</button>');
    }
    var pie = botones.length || a.nota
      ? '<div class="card-footer d-grid gap-2">' + botones.join('') + (a.nota ? '<div class="form-text mt-0">' + esc(a.nota) + '</div>' : '') + '</div>'
      : '';

    return '<article class="card sgtl-viaje-chofer mb-3" id="viaje-' + esc(v.Viaje_ID) + '" aria-label="Viaje #' + esc(v.Viaje_ID) + '">' +
      '<div class="card-body">' +
      '<div class="d-flex justify-content-between align-items-start gap-2">' +
      '<div><div class="fs-5 fw-bold">' + esc(horario(v)) + '</div>' +
      '<div class="text-muted">Viaje #' + esc(v.Viaje_ID) + (v.Cliente ? ' · ' + esc(v.Cliente) : '') + '</div></div>' +
      '<div class="text-end flex-shrink-0">' + etiquetas(v) + '</div></div>' +
      '<ol class="sgtl-recorrido list-unstyled">' +
      lugar('bi-circle', v.Origen, v.Origen_Direccion, 'Origen') +
      lugar('bi-geo-alt-fill', v.Destino, v.Destino_Direccion, 'Destino') + '</ol>' +
      (v.Maps_Url
        ? '<a class="btn btn-outline-primary w-100" href="' + esc(v.Maps_Url) + '" target="_blank" rel="noopener">' +
          '<i class="bi bi-map me-1" aria-hidden="true"></i>Abrir recorrido en Google Maps</a>'
        : '<div class="form-text">No hay dirección cargada para armar el recorrido en Google Maps.</div>') +
      '<div class="row gx-3 gy-0 mt-3">' + datos + '</div>' +
      '</div>' + pie + '</article>';
  }

  function mostrarLista(html) {
    SGTL.ocultarTooltips();
    document.getElementById('listaViajes').innerHTML = html;
  }

  function sinViajes() {
    return '<p class="text-muted text-center my-5">' + (estado.vista === 'anteriores'
      ? 'No tenés viajes en los últimos 30 días.'
      : 'No tenés viajes para hoy ni para los próximos días.') + '</p>';
  }

  function dibujar() {
    if (!estado.viajes.length) { mostrarLista(sinViajes()); return; }
    mostrarLista(agruparPorDia(estado.viajes).map(function (g) {
      return '<section class="mb-2"><div class="sgtl-bloque-titulo mb-3">' + esc(tituloDia(g.fecha, estado.hoy)) + '</div>' +
        g.viajes.map(tarjeta).join('') + '</section>';
    }).join(''));
  }

  // Sin vista, vuelve a traer la misma después de una acción: deja la lista como está hasta que llega la nueva, así el
  // chofer no pierde el lugar en el celular.
  function cargar(vista) {
    var otraVista = !!vista;
    if (vista) estado.vista = vista;
    var busqueda = ++estado.busqueda;
    Array.prototype.forEach.call(document.querySelectorAll('#vistaHojaDeRuta [data-vista]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-vista') === estado.vista));
    });
    if (otraVista) mostrarLista('<p class="text-muted text-center my-5">Cargando…</p>');
    return pedir({ url: API + '/HojaDeRuta', type: 'GET', data: { vista: estado.vista } },
      'No se pudo cargar tu hoja de ruta. Revisá la conexión y probá de nuevo.').then(function (data) {
        if (busqueda !== estado.busqueda) return;
        data = data || {};
        estado.hoy = soloFecha(data.Hoy);
        document.getElementById('sinChofer').classList.toggle('d-none', data.Vinculado !== false);
        document.getElementById('contenidoHojaDeRuta').classList.toggle('d-none', data.Vinculado === false);
        document.getElementById('listaViajes').classList.toggle('d-none', data.Vinculado === false);
        if (data.Vinculado === false) return;
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
    SGTL.toastError('El viaje #' + id + ' no está en tu hoja de ruta.');
  }

  // ---------------------------------------------------------------- Iniciar viaje

  function iniciarViaje(id) {
    var v = estado.porId[id];
    if (!v) return;
    SGTL.confirmar({
      titulo: '¿Iniciar el viaje #' + id + '?',
      mensaje: (v.Origen || 'Origen') + ' → ' + (v.Destino || 'destino') + '. La oficina lo ve en viaje; si te equivocaste, avisale para que lo corrija.',
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

  function reglaArchivo(id, obligatoria) {
    return {
      id: id,
      requerido: obligatoria ? 'Elegí la foto o el PDF del remito.' : '',
      validar: function (valor, campo) { return problemaDelArchivo((campo.files || [])[0]); }
    };
  }

  function abrirEvidencia(id) {
    var v = estado.porId[id];
    if (!v) return;
    var reemplaza = !!v.Tiene_Evidencia;
    var titulo = (reemplaza ? 'Reemplazar evidencia' : 'Subir evidencia') + ' del viaje #' + id;
    SGTL.reiniciarFormulario('#formEvidencia', '#avisoEvidencia');
    document.getElementById('evidenciaViajeId').value = id;
    document.getElementById('modalEvidenciaTitulo').textContent = titulo;
    document.getElementById('btnGuardarEvidencia').textContent = reemplaza ? 'Reemplazar evidencia' : 'Subir evidencia';
    document.getElementById('evidenciaResumen').textContent = (v.Destino || '') + (v.Cliente ? ' · ' + v.Cliente : '');
    document.getElementById('evidenciaActualSola').classList.toggle('d-none', !reemplaza);
    formularioEvidencia.reiniciar();
    SGTL.modal('#modalEvidencia', 'show');
  }

  function guardarEvidencia() {
    var id = document.getElementById('evidenciaViajeId').value;
    formularioEvidencia.validarTodo();
    if (!SGTL.revisarFormulario('#formEvidencia', '#avisoEvidencia')) return;
    var file = (document.getElementById('evidenciaSolaArchivo').files || [])[0];
    var reemplaza = estado.porId[id] && estado.porId[id].Tiene_Evidencia;
    var listo = SGTL.procesando('#btnGuardarEvidencia', 'Subiendo…');
    subirEvidencia(id, file).then(function () {
      listo();
      SGTL.modal('#modalEvidencia', 'hide');
      SGTL.toastExito(reemplaza ? 'Evidencia del viaje #' + id + ' reemplazada.' : 'Evidencia del viaje #' + id + ' cargada.');
      cargar();
    }, function (error) {
      listo();
      SGTL.avisoFormulario('#avisoEvidencia', error.mensajeUsuario || 'No se pudo subir la evidencia. Probá de nuevo.');
    });
  }

  // Ver la evidencia: la API pide el token, así que se baja con fetch y se muestra en la ventana (foto) o se ofrece abrir
  // el PDF. Un enlace directo no llevaría el token.
  function verEvidencia(id) {
    var cuerpo = document.getElementById('verEvidenciaCuerpo');
    document.getElementById('verEvidenciaTitulo').textContent = 'Ver evidencia del viaje #' + id;
    cuerpo.innerHTML = '<p class="text-muted text-center my-4">Cargando…</p>';
    if (urlEvidencia) { URL.revokeObjectURL(urlEvidencia); urlEvidencia = null; }
    SGTL.modal('#modalVerEvidencia', 'show');
    fetch(API + '/HojaDeRuta/Viajes/' + encodeURIComponent(id) + '/Evidencia', { headers: encabezados() }).then(function (r) {
      if (r.status === 401) {
        SGTL.mensajeError({ status: 401 });
        throw new Error('Tu sesión venció. Volvé a iniciar sesión.');
      }
      if (!r.ok) throw new Error('No se pudo abrir la evidencia. Probá de nuevo.');
      return r.blob();
    }).then(function (blob) {
      urlEvidencia = URL.createObjectURL(blob);
      if (/^image\//.test(blob.type)) {
        cuerpo.innerHTML = '<img class="img-fluid rounded d-block mx-auto" alt="Evidencia del viaje #' + esc(id) + '" src="' + urlEvidencia + '">';
      } else {
        cuerpo.innerHTML = '<p class="mb-3">La evidencia es un PDF.</p><a class="btn btn-primary" target="_blank" rel="noopener" href="' + urlEvidencia + '">' +
          '<i class="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>Abrir PDF</a>';
      }
    }).catch(function (error) {
      cuerpo.innerHTML = '<p class="text-muted text-center my-4">' + esc(error.message) + '</p>';
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
      else if (accion === 'evidencia') abrirEvidencia(id);
      else if (accion === 'ver-evidencia') verEvidencia(id);
    });
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
    problemaDelArchivo: problemaDelArchivo
  };
})(window, document);
