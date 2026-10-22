(function () {
  'use strict';
  var api = 'http://localhost:50222/api/Documentacion';
  var tipo = document.body.getAttribute('data-documentacion');
  var mensaje = document.getElementById('mensaje');
  var vista = document.getElementById('vistaDocumento');
  var marco = document.getElementById('pdfVista');
  var descarga = document.getElementById('descargarPdf');
  var urlPdf = null;
  var secuencia = 0;

  function headers() { return { Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }; }
  // "Cargando…" en gris mientras busca (§2.2); los errores, con el aviso del sistema (§5.1).
  function informar(texto) {
    mensaje.textContent = texto;
    mensaje.className = texto ? 'text-muted mb-3' : '';
  }
  function avisarError(e, porDefecto) {
    informar('');
    SGTL.toastError((e && e.mensajeUsuario) || porDefecto);
  }
  // Solo se muestra el texto de la API cuando rechaza un pedido (400, 404 o 409); el resto es técnico (§9).
  async function respuesta(r, porDefecto) {
    if (r.ok) return r;
    var datos = {};
    try { datos = await r.json(); } catch (_) { }
    var error = new Error('HTTP ' + r.status);
    var texto = datos.message || datos.Message;
    error.mensajeUsuario = r.status === 401 ? SGTL.mensajeError({ status: 401 }, porDefecto)
      : ([400, 404, 409].indexOf(r.status) !== -1 && texto) || porDefecto;
    throw error;
  }
  function fechaVisible(fecha) { return SGTL.fecha(fecha) || '—'; }
  function liberarPdf() {
    marco.removeAttribute('src');
    descarga.removeAttribute('href');
    if (urlPdf) URL.revokeObjectURL(urlPdf);
    urlPdf = null;
  }
  async function mostrarPdf(ruta, titulo) {
    var solicitud = ++secuencia;
    vista.hidden = true;
    liberarPdf();
    informar('Cargando…');
    try {
      var crudo = await fetch(api + ruta, { headers: headers(), cache: 'no-store' });
      // 404: el PDF no está cargado. Se dice en la página: reintentar no sirve.
      if (crudo.status === 404) {
        if (solicitud === secuencia) informar(tipo === 'versiones' ? 'Esta versión no tiene el informe cargado.' : 'El manual todavía no tiene el PDF cargado.');
        return;
      }
      var r = await respuesta(crudo, 'No se pudo cargar el PDF. Probá de nuevo.');
      var pdf = await r.blob();
      if (solicitud !== secuencia) return;
      urlPdf = URL.createObjectURL(pdf);
      marco.src = urlPdf;
      descarga.href = urlPdf;
      if (tipo === 'versiones') document.getElementById('tituloVista').textContent = titulo;
      vista.hidden = false;
      informar('');
    } catch (e) {
      if (solicitud === secuencia) avisarError(e, 'No se pudo cargar el PDF. Probá de nuevo.');
    }
  }
  async function cargar() {
    try {
      var r = await fetch(api + '/' + tipo, { headers: headers(), cache: 'no-store' });
      if (tipo === 'manual') {
        var actual = document.getElementById('manualActual');
        if (r.status === 404) { actual.textContent = 'Todavía no se publicó un manual.'; return; }
        var manual = await (await respuesta(r, 'No se pudo cargar el manual. Probá de nuevo.')).json();
        actual.textContent = 'Publicado el ' + fechaVisible(manual.fechaPublicacion) + '.';
        await mostrarPdf('/manual/pdf');
      } else {
        var versiones = await (await respuesta(r, 'No se pudieron cargar los informes de versión. Probá de nuevo.')).json();
        if (!versiones.length) {
          SGTL.tabla.vacia('#listaVersiones', 3, 'Todavía no hay informes de versión publicados.');
          return;
        }
        // Acción de cada fila con el botón del sistema (§1.4).
        SGTL.tabla.llenar('#listaVersiones', versiones.map(function (v) {
          return '<tr><td>' + SGTL.escapar(v.version) + '</td><td class="text-center">' + SGTL.escapar(fechaVisible(v.fecha)) + '</td>' +
            '<td class="text-center">' + SGTL.accionesFila([SGTL.botonFila('ver', { id: v.id, texto: 'Ver informe' })]) + '</td></tr>';
        }).join(''));
        var porId = {};
        versiones.forEach(function (v) { porId[v.id] = v; });
        document.getElementById('listaVersiones').addEventListener('click', function (evento) {
          var boton = evento.target.closest('[data-accion="ver"]');
          var v = boton && porId[boton.getAttribute('data-id')];
          if (v) mostrarPdf('/versiones/' + v.id + '/pdf', 'Versión ' + v.version);
        });
        var ultima = versiones[0];
        await mostrarPdf('/versiones/' + ultima.id + '/pdf', 'Versión ' + ultima.version);
      }
    } catch (e) {
      if (tipo === 'manual') document.getElementById('manualActual').textContent = 'No se pudo cargar el manual.';
      else SGTL.tabla.vacia('#listaVersiones', 3, 'No se pudieron cargar los informes de versión.');
      avisarError(e, tipo === 'manual' ? 'No se pudo cargar el manual. Probá de nuevo.' : 'No se pudieron cargar los informes de versión. Probá de nuevo.');
    }
  }
  window.addEventListener('pagehide', function (e) { if (!e.persisted) liberarPdf(); });
  if (typeof loadHeader === 'function') loadHeader().catch(function () {});
  if (typeof loadFooter === 'function') loadFooter();
  Promise.resolve(window.loadSidebar ? window.loadSidebar() : null).then(function () {
    if (window.cargarEstilosContenido) return window.cargarEstilosContenido();
  }).catch(function () { /* La documentación sigue disponible sin la personalización visual. */ });
  cargar();
})();
