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
  function informar(texto, clase) {
    mensaje.textContent = texto;
    mensaje.className = texto ? 'alert alert-' + clase : '';
  }
  async function respuesta(r) {
    if (r.ok) return r;
    var datos = {};
    try { datos = await r.json(); } catch (_) { }
    throw new Error(datos.message || datos.Message || 'No se pudo cargar el documento.');
  }
  function fechaVisible(fecha) {
    var partes = fecha.split('T')[0].split('-');
    return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : fecha;
  }
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
    informar('Cargando vista previa…', 'info');
    try {
      var r = await respuesta(await fetch(api + ruta, { headers: headers(), cache: 'no-store' }));
      var pdf = await r.blob();
      if (solicitud !== secuencia) return;
      urlPdf = URL.createObjectURL(pdf);
      marco.src = urlPdf;
      descarga.href = urlPdf;
      if (tipo === 'versiones') document.getElementById('tituloVista').textContent = titulo;
      vista.hidden = false;
      informar('', 'info');
    } catch (e) {
      if (solicitud === secuencia) informar(e.message, 'danger');
    }
  }
  async function cargar() {
    try {
      var r = await fetch(api + '/' + tipo, { headers: headers(), cache: 'no-store' });
      if (tipo === 'manual') {
        var actual = document.getElementById('manualActual');
        if (r.status === 404) { actual.textContent = 'Todavía no se publicó un manual.'; return; }
        var manual = await (await respuesta(r)).json();
        actual.textContent = 'Publicado el ' + fechaVisible(manual.fechaPublicacion) + '.';
        await mostrarPdf('/manual/pdf');
      } else {
        var versiones = await (await respuesta(r)).json();
        var lista = document.getElementById('listaVersiones');
        lista.replaceChildren();
        if (!versiones.length) {
          var vacio = document.createElement('tr');
          var celda = document.createElement('td');
          celda.colSpan = 3; celda.textContent = 'Todavía no se publicaron informes de versión.';
          vacio.appendChild(celda); lista.appendChild(vacio);
          return;
        }
        versiones.forEach(function (v) {
          var fila = document.createElement('tr');
          var numero = document.createElement('td'); numero.textContent = v.version;
          var fecha = document.createElement('td'); fecha.textContent = fechaVisible(v.fecha);
          var acciones = document.createElement('td');
          var boton = document.createElement('button');
          boton.type = 'button'; boton.className = 'btn btn-outline-primary btn-sm';
          boton.textContent = 'Ver informe'; boton.setAttribute('aria-label', 'Ver informe de la versión ' + v.version);
          boton.addEventListener('click', function () {
            mostrarPdf('/versiones/' + v.id + '/pdf', 'Vista previa: versión ' + v.version);
          });
          acciones.appendChild(boton);
          fila.appendChild(numero); fila.appendChild(fecha); fila.appendChild(acciones); lista.appendChild(fila);
        });
        var ultima = versiones[0];
        await mostrarPdf('/versiones/' + ultima.id + '/pdf', 'Vista previa: versión ' + ultima.version);
      }
    } catch (e) {
      if (tipo === 'manual') document.getElementById('manualActual').textContent = '';
      else document.getElementById('listaVersiones').replaceChildren();
      informar(e.message, 'danger');
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
