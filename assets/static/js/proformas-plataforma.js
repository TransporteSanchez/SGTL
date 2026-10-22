// Proforma de plataforma (hoy Rukas) dentro del modal de proforma de gestion-facturacion.html.
// El modal es el de siempre: al elegir un cliente "Con plataforma" se acomoda en pasos (1 Cliente, 2 Excel,
// 3 Control y generar). Lo propio se agrega y se oculta desde acá, sin tocar el HTML de Facu; al salir
// (otro cliente, cerrar, abrir una propia) todo vuelve como estaba.
// Diseño: docs/diseno/proforma-rukas-diseno.md §4. API: api/ProformasPlataforma.
// Necesita jQuery, SheetJS (window.XLSX) y sgtl-ui.js (window.SGTL).
(function () {
  'use strict';

  var API = 'http://localhost:50222/api/ProformasPlataforma';
  var estado = nuevoEstado();
  // Condiciones comerciales de la cabecera: lo único que se edita en un borrador ya importado.
  var CONDICIONES = { FormaPago: 'p_formapago', PlazoPago: 'p_plazopago', Validez: 'p_validez', Observaciones: 'p_observaciones' };
  // En modo plataforma los datos del cliente van plegados en una línea y el período sale del Excel.
  var CAMPOS_CLIENTE = ['p_cli_razon', 'p_cli_nombre', 'p_cli_cuit', 'p_cli_condiva', 'p_cli_dir', 'p_cli_tel'];
  var CAMPOS_PERIODO = ['p_fdesde', 'p_fhasta'];
  var MOTIVO_MAXIMO = 500;

  function nuevoEstado() {
    return { activo: false, clienteId: null, plataforma: null, puedeLeer: false, archivo: null, filas: null, base64: null, numero: null, control: null, soloLectura: false, abrioViaje: false, datosAbiertos: false };
  }

  function $id(id) { return document.getElementById(id); }
  function esc(v) { return window.SGTL ? SGTL.escapar(v) : String(v == null ? '' : v); }
  function pesos(v) { return window.SGTL ? SGTL.monto(v, { sinDecimales: true }) : String(v); }
  function monto(v) { return window.SGTL ? SGTL.monto(v) : String(v); }
  function fecha(v, opciones) { return v && window.SGTL ? SGTL.fecha(v, opciones) : ''; }
  function usuarioActual() { return localStorage.getItem('username') || 'sistema'; }
  function nombrePlataforma() { return estado.plataforma || 'la plataforma'; }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  function errorEnModal(html) {
    var aviso = $id('alertaCompletaCampos');
    aviso.innerHTML = html;
    aviso.style.display = '';
    $('#modalProforma .modal-body').scrollTop(0);
  }
  function limpiarError() { var a = $id('alertaCompletaCampos'); a.style.display = 'none'; a.innerHTML = ''; }

  function pedir(url, opciones) {
    return fetch(url, opciones).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok) return j;
        var e = new Error('HTTP ' + r.status);
        e.datos = j;
        throw e;
      });
    });
  }
  function postJson(url, cuerpo) {
    return pedir(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  }
  function textoError(e, porDefecto) {
    var d = (e && e.datos) || {};
    if (Array.isArray(d.errores) && d.errores.length) return d.errores.map(esc).join('<br>');
    return esc(d.error || porDefecto);
  }
  function refrescarListado() {
    if (window.SGTL) SGTL.ocultarTooltips();
    if (typeof window.buscarProformas === 'function' && window.profState) window.buscarProformas(window.profState.page);
  }

  // ---------------------------------------------------------------- El modal en modo plataforma

  // Oculta un elemento del modal de Facu y lo marca para devolverlo al salir del modo plataforma.
  function ocultar(el) {
    if (!el || el.classList.contains('d-none')) return;
    el.classList.add('d-none');
    el.setAttribute('data-pp-oculto', '');
  }
  function columna(id) { var el = $id(id); return el ? el.closest('[class*="col-"]') : null; }
  function filaDe(id) { var el = $id(id); return el ? el.closest('.row') : null; }

  function modoPlataforma(activo) {
    var cuerpo = document.querySelector('#modalProforma .modal-body');
    var pie = document.querySelector('#modalProforma .modal-footer');
    if (!cuerpo || !pie) return;
    $id('bloqueConceptos').classList.toggle('d-none', activo);
    $id('bloquePlataforma').classList.toggle('d-none', !activo);
    $('#p_otros').prop('readonly', activo);

    if (!activo) {
      ['pp_pasos', 'pp_ficha', 'pp_cond_titulo', 'pp_pie_motivo', 'pp_pie_confirmar'].forEach(function (id) { var el = $id(id); if (el) el.remove(); });
      Array.prototype.forEach.call(document.querySelectorAll('#modalProforma [data-pp-oculto]'), function (el) {
        el.classList.remove('d-none');
        el.removeAttribute('data-pp-oculto');
      });
      mostrarBotonesPie(true);
      return;
    }
    if ($id('pp_pasos')) return;

    var filaCliente = filaDe('p_cliente');
    var tituloDatos = filaCliente ? filaCliente.previousElementSibling : null;
    if (tituloDatos && tituloDatos.classList.contains('bloque-titulo')) ocultar(tituloDatos);
    cuerpo.insertBefore(crear('<ol id="pp_pasos" class="sgtl-pasos" aria-label="Pasos"></ol>'), tituloDatos || filaCliente);
    CAMPOS_PERIODO.concat(CAMPOS_CLIENTE).forEach(function (id) { ocultar(columna(id)); });
    if (filaCliente) filaCliente.after(crear('<div id="pp_ficha" class="small text-muted mt-1"></div>'));

    // Totales: van en una línea dentro del bloque de la plataforma. (El dl también tiene la clase row.)
    var dlTotales = $id('t_total') ? $id('t_total').closest('dl') : null;
    ocultar(dlTotales ? dlTotales.parentElement.closest('.row') : null);

    // Condiciones comerciales: plegadas, con un resumen.
    var filaCond = filaDe('p_formapago');
    var tituloCond = filaCond ? filaCond.previousElementSibling : null;
    if (tituloCond && tituloCond.classList.contains('bloque-titulo')) ocultar(tituloCond);
    if (filaCond) {
      filaCond.before(crear(
        '<div id="pp_cond_titulo" class="d-flex align-items-center gap-2 border-top pt-3 mt-3 mb-2">' +
        '<button type="button" class="btn btn-link p-0 fw-bold text-body text-decoration-none" id="pp_cond_boton" aria-expanded="false" aria-controls="pp_cond_fila">' +
        '<i class="bi bi-chevron-right me-1" aria-hidden="true"></i>Condiciones comerciales</button>' +
        '<span id="pp_cond_resumen" class="small text-muted"></span></div>'));
      filaCond.id = filaCond.id || 'pp_cond_fila';
      ocultar(filaCond);
      $id('pp_cond_boton').addEventListener('click', function () { plegarCondiciones(!filaCond.classList.contains('d-none')); });
      filaCond.addEventListener('input', resumirCondiciones);
    }

    pie.insertBefore(crear('<span id="pp_pie_motivo" class="me-auto small"></span>'), pie.firstChild);
    pie.appendChild(crear(
      '<div id="pp_pie_confirmar" class="d-none w-100 d-flex flex-wrap align-items-center gap-2">' +
      '<span class="me-auto" id="pp_pie_pregunta"></span>' +
      '<button type="button" class="btn btn-light-secondary" id="pp_generar_cancelar">Cancelar</button>' +
      '<button type="button" class="btn btn-success" id="pp_generar_confirmar"><i class="bi bi-file-earmark-check me-1"></i>Generar</button></div>'));
    $id('pp_generar_cancelar').addEventListener('click', function () { mostrarBotonesPie(true); });
    $id('pp_generar_confirmar').addEventListener('click', function () { if (estado.control) confirmarGenerar(estado.control.Proforma_ID); });
  }

  function crear(html) {
    var div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild;
  }

  function plegarCondiciones(plegar) {
    var fila = filaDe('p_formapago');
    var boton = $id('pp_cond_boton');
    if (!fila || !boton) return;
    fila.classList.toggle('d-none', plegar);
    if (plegar) fila.setAttribute('data-pp-oculto', ''); else fila.removeAttribute('data-pp-oculto');
    boton.setAttribute('aria-expanded', String(!plegar));
    boton.querySelector('.bi').className = 'bi me-1 ' + (plegar ? 'bi-chevron-right' : 'bi-chevron-down');
    resumirCondiciones();
  }

  function resumirCondiciones() {
    var resumen = $id('pp_cond_resumen');
    if (!resumen) return;
    var partes = [$id('p_formapago').value, $id('p_plazopago').value].map(function (v) { return (v || '').trim(); }).filter(Boolean);
    resumen.textContent = partes.length ? '· ' + partes.join(' · ') : '· forma y plazo de pago sin completar';
  }

  function valorCampo(id) { return ($id(id) && $id(id).value || '').trim(); }

  // Pasos: 1 Cliente, 2 Excel de la plataforma, 3 Control y generar. En el paso 3 los pasos hechos muestran
  // su resultado (el cliente y el archivo), así no hace falta repetirlos más abajo.
  function pasos(actual) {
    var ol = $id('pp_pasos');
    if (!ol) return;
    ol.classList.toggle('d-none', !actual);
    var c = estado.control;
    var hechos = [null, null];
    if (actual === 3) {
      hechos[0] = esc(valorCampo('p_cli_razon') || 'Cliente') +
        ' <button type="button" class="btn btn-link btn-sm p-0 align-baseline" id="pp_datos_boton" aria-expanded="' + estado.datosAbiertos + '">' +
        (estado.datosAbiertos ? 'ocultar datos' : 'ver datos') + '</button>';
      if (c) {
        var titulo = c.FechaArchivo ? ' title="Importado el ' + esc(fecha(c.FechaArchivo, { hora: true })) + '"' : '';
        hechos[1] = '<span' + titulo + '>' + esc(c.NombreArchivo || 'Excel de ' + nombrePlataforma()) + '</span>' +
          (c.FechaDesde ? ' <span class="fw-normal text-muted">· ' + fecha(c.FechaDesde) + (c.FechaHasta ? ' al ' + fecha(c.FechaHasta) : '') + '</span>' : '');
      }
    }
    var nombres = ['Cliente', 'Excel de ' + nombrePlataforma(), 'Control y generar'];
    ol.innerHTML = nombres.map(function (nombre, i) {
      var n = i + 1;
      if (n < actual) return '<li class="hecho"><span class="sgtl-paso-numero"><i class="bi bi-check-lg" aria-hidden="true"></i></span><span>' + (hechos[i] || esc(nombre)) + '</span></li>';
      return '<li' + (n === actual ? ' class="actual" aria-current="step"' : '') + '><span class="sgtl-paso-numero">' + n + '</span>' + esc(nombre) + '</li>';
    }).join('');
    var boton = $id('pp_datos_boton');
    if (boton) boton.addEventListener('click', function () { estado.datosAbiertos = !estado.datosAbiertos; mostrarDatosCliente(); pasos(3); });
  }

  // Los campos del cliente de siempre, desplegados o plegados.
  function mostrarDatosCliente() {
    CAMPOS_CLIENTE.forEach(function (id) {
      var col = columna(id);
      if (!col) return;
      col.classList.toggle('d-none', !estado.datosAbiertos);
      if (estado.datosAbiertos) col.removeAttribute('data-pp-oculto'); else col.setAttribute('data-pp-oculto', '');
    });
  }

  // Paso 2: datos del cliente en una línea, debajo del cliente; "Editar datos del cliente" despliega los campos.
  function ficha() {
    var caja = $id('pp_ficha');
    if (!caja) return;
    var partes = [valorCampo('p_cli_condiva'), valorCampo('p_cli_dir'), valorCampo('p_cli_tel')].filter(Boolean);
    caja.innerHTML =
      '<span class="badge rounded-pill bg-white text-dark border me-1">' + esc(nombrePlataforma()) + '</span>' +
      esc(partes.join(' · ')) +
      ' <button type="button" class="btn btn-link btn-sm p-0 ms-1 align-baseline" id="pp_ficha_boton" aria-expanded="' + estado.datosAbiertos + '">' +
      (estado.datosAbiertos ? 'Ocultar datos del cliente' : 'Editar datos del cliente') + '</button>';
    mostrarDatosCliente();
    $id('pp_ficha_boton').addEventListener('click', function () { estado.datosAbiertos = !estado.datosAbiertos; ficha(); });
  }

  // En el paso 3 el cliente ya no se cambia: el campo y la línea de datos se pliegan (quedan en los pasos).
  function plegarCliente(plegar) {
    [$id('p_clienteGrupo'), $id('pp_ficha'), $id('p_numeroGrupo')].forEach(function (el) {
      if (!el) return;
      if (plegar) ocultar(el);
      else if (el.hasAttribute('data-pp-oculto')) { el.classList.remove('d-none'); el.removeAttribute('data-pp-oculto'); }
    });
  }

  // Pie: qué falta para generar, al lado del botón (en uno deshabilitado no hay tooltip). Es una nota, no un error.
  function motivoPie(texto, icono) {
    var span = $id('pp_pie_motivo');
    if (!span) return;
    span.innerHTML = texto ? '<i class="bi ' + (icono || 'bi-info-circle') + ' me-1" aria-hidden="true"></i>' + esc(texto) : '';
    span.className = 'me-auto small text-muted';
  }

  function mostrarBotonesPie(mostrar) {
    var pie = document.querySelector('#modalProforma .modal-footer');
    var confirmar = $id('pp_pie_confirmar');
    if (!pie) return;
    Array.prototype.forEach.call(pie.children, function (el) {
      if (el.id === 'pp_pie_confirmar') return;
      if (mostrar) el.removeAttribute('hidden'); else el.setAttribute('hidden', '');
    });
    if (confirmar) confirmar.classList.toggle('d-none', mostrar);
  }

  function botonGenerar(habilitado) {
    var gen = $id('btnGenerar');
    if (!gen) return;
    gen.disabled = !habilitado;
    // Deshabilitado no tiene que parecer habilitado (verde con opacidad).
    gen.classList.toggle('btn-success', habilitado);
    gen.classList.toggle('btn-secondary', !habilitado);
  }

  function botonPdf(visible) {
    var pdf = $id('btnPdfForm');
    if (pdf) pdf.style.display = visible ? '' : 'none';
  }

  // ---------------------------------------------------------------- Paso 2: elegir el Excel

  function activar(clienteId, info) {
    var reactivar = estado.activo;
    estado.activo = true;
    estado.clienteId = clienteId;
    estado.plataforma = info.Plataforma;
    estado.puedeLeer = !!info.PuedeLeer;
    estado.archivo = null; estado.filas = null; estado.base64 = null; estado.numero = null; estado.control = null;
    if (!reactivar) estado.datosAbiertos = false;
    modoPlataforma(true);
    plegarCliente(false);
    pasos(2);
    ficha();
    plegarCondiciones(true);
    renderNuevo();
    if (estado.puedeLeer) cargarGuia(clienteId);
    botonGenerar(false);
    botonPdf(false);
    motivoPie('Al elegir el Excel se guarda como borrador y se controla contra los viajes.');
  }

  function desactivar() {
    estado = nuevoEstado();
    var bloque = $id('bloquePlataforma');
    if (bloque) { bloque.innerHTML = ''; delete bloque.dataset.sinCambios; }
    if ($id('bloqueConceptos')) modoPlataforma(false);
    var gen = $id('btnGenerar');
    if (gen) { gen.disabled = false; gen.removeAttribute('title'); gen.classList.add('btn-success'); gen.classList.remove('btn-secondary'); }
    botonPdf(true);
  }

  function renderNuevo() {
    var p = esc(nombrePlataforma());
    var bloque = $id('bloquePlataforma');
    delete bloque.dataset.sinCambios;
    bloque.innerHTML =
      (estado.puedeLeer ? '' : '<div class="alert alert-light-danger color-danger">Todavía no se pueden leer archivos de ' + p + '.</div>') +
      '<div class="sgtl-zona-archivo mt-3" id="pp_zona">' +
      '<span class="sgtl-zona-icono"><i class="bi bi-file-earmark-spreadsheet" aria-hidden="true"></i></span>' +
      '<div class="fw-bold mt-2">Excel de ' + p + '</div>' +
      '<div class="my-2"><button type="button" class="btn btn-primary" id="pp_elegir"' + (estado.puedeLeer ? '' : ' disabled') + '>' +
      '<i class="bi bi-upload me-1"></i>Elegir archivo</button></div>' +
      '<div class="form-text mt-0">o arrastralo acá · Se exporta en ' + p + ' desde Proceso → detalle de la proforma → ícono de Excel</div>' +
      '<input type="file" id="pp_archivo" class="d-none" accept=".xlsx" aria-label="Excel de ' + p + '">' +
      '<div id="pp_archivo_estado"></div>' +
      '</div>' +
      '<div id="pp_guia" class="mt-3"></div>';

    var input = $id('pp_archivo');
    $id('pp_elegir').addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () { leerArchivo(this.files && this.files[0]); this.value = ''; });
    var zona = $id('pp_zona');
    ['dragenter', 'dragover'].forEach(function (tipo) {
      zona.addEventListener(tipo, function (e) { if (!estado.puedeLeer) return; e.preventDefault(); zona.classList.add('arrastrando'); });
    });
    ['dragleave', 'drop'].forEach(function (tipo) {
      zona.addEventListener(tipo, function (e) { e.preventDefault(); zona.classList.remove('arrastrando'); });
    });
    zona.addEventListener('drop', function (e) {
      if (!estado.puedeLeer) return;
      var archivo = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (archivo) leerArchivo(archivo);
    });
  }

  // Paso 0: viajes del cliente que todavía no están en ninguna proforma, con el N° para tildarlos en la
  // plataforma. Es solo una ayuda: no frena nada.
  function cargarGuia(clienteId) {
    var caja = $id('pp_guia');
    if (!caja) return;
    caja.innerHTML = '<div class="text-muted small">Buscando viajes sin proforma…</div>';
    pedir(API + '/ViajesSinProforma?clienteId=' + encodeURIComponent(clienteId)).then(function (r) {
      if (!estado.activo || estado.control || estado.clienteId !== parseInt(clienteId, 10) || !$id('pp_guia')) return;
      renderGuia(r);
    }, function (e) {
      if ($id('pp_guia')) $id('pp_guia').innerHTML = '<div class="small text-danger">' + textoError(e, 'No se pudieron consultar los viajes sin proforma.') + '</div>';
    });
  }

  function renderGuia(r) {
    var p = esc(r.Plataforma || nombrePlataforma());
    var viajes = r.Viajes || [];
    var caja = $id('pp_guia');
    if (!viajes.length) {
      caja.innerHTML = '<div class="small text-muted"><i class="bi bi-truck me-1" aria-hidden="true"></i>No hay viajes de este cliente con el ' + esc(r.Dato) + ' cargado fuera de una proforma.</div>';
      return;
    }
    var conFaltantes = viajes.filter(function (v) { return v.Faltan; }).length;
    var filas = viajes.map(function (v) {
      return '<tr>' +
        '<td>' + esc(v.Referencia) + '</td>' +
        '<td class="text-center text-nowrap">' + fecha(v.Fecha) + '</td>' +
        '<td>' + esc(v.Origen) + ' → ' + esc(v.Destino) + '</td>' +
        '<td class="text-center">' + (window.SGTL ? SGTL.estado(String(v.Estado || '').replace(/_/g, ' ')) : esc(v.Estado)) + '</td>' +
        '<td>' + (v.Faltan ? '<span class="small text-danger">Le falta: ' + esc(v.Faltan) + '.</span>' : '') + '</td>' +
        '<td class="text-center">' + botonViaje(v.ViajeID) + '</td>' +
        '</tr>';
    }).join('');
    caja.innerHTML =
      '<details>' +
      '<summary class="small"><i class="bi bi-truck me-1" aria-hidden="true"></i>' + plural(viajes.length, 'viaje', 'viajes') + ' sin proforma para tildar en ' + p +
      (conFaltantes ? ' <span class="badge rounded-pill estado-amarillo ms-1">' + plural(conFaltantes, 'con números faltantes', 'con números faltantes') + '</span>' : '') + '</summary>' +
      '<div class="table-responsive mt-2"><table class="table table-sm table-striped table-hover sgtl-tabla-compacta mb-0"><thead><tr>' +
      '<th>' + esc(r.Dato.charAt(0).toUpperCase() + r.Dato.slice(1)) + '</th><th class="text-center">Fecha</th><th class="sgtl-col-texto">Ruta</th><th class="text-center">Estado</th><th>Falta</th><th class="text-center">Acciones</th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
      '</details>';
  }

  function importeTexto(t) {
    t = String(t || '').replace(/ARS|\$|\s/g, '');
    if (/^\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, '');
    var n = Number(t);
    return isFinite(n) ? n : 0;
  }

  // Lee el .xlsx en el navegador (celdas como texto y el archivo en base64). Las reglas las aplica el lector en la API.
  function leerExcel(archivo) {
    return new Promise(function (resolver, rechazar) {
      if (!archivo || !/\.xlsx$/i.test(archivo.name)) { rechazar(new Error('Elegí un archivo .xlsx: el Excel exportado de ' + nombrePlataforma() + '.')); return; }
      if (archivo.size > 5 * 1024 * 1024) { rechazar(new Error('El archivo tiene que pesar como máximo 5 MB.')); return; }
      var buffer = new FileReader();
      buffer.onload = function () {
        try {
          var libro = XLSX.read(new Uint8Array(buffer.result), { type: 'array' });
          var filas = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { header: 1, raw: false, defval: '' })
            .map(function (f) { return f.map(function (c) { return c == null ? '' : String(c); }); });
          var b64 = new FileReader();
          b64.onload = function () { resolver({ filas: filas, base64: String(b64.result).split(',')[1] || '' }); };
          b64.onerror = function () { rechazar(new Error('No se pudo leer el archivo.')); };
          b64.readAsDataURL(archivo);
        } catch (e) { rechazar(new Error('No se pudo leer el archivo. Revisá que sea el Excel exportado de ' + nombrePlataforma() + '.')); }
      };
      buffer.onerror = function () { rechazar(new Error('No se pudo leer el archivo.')); };
      buffer.readAsArrayBuffer(archivo);
    });
  }

  function numeroDelNombre(nombre) {
    var m = /PROFORMA\s*NRO\.?\s*(\d+)/i.exec(nombre || '');
    return m ? m[1] : null;
  }

  // Al elegir el Excel se importa y se controla (crea el borrador). Si el nombre no trae el N° de la proforma,
  // primero se pide.
  function leerArchivo(archivo) {
    limpiarError();
    estado.archivo = null; estado.filas = null; estado.base64 = null; estado.numero = null;
    var info = $id('pp_archivo_estado');
    if (!archivo) return;
    leerExcel(archivo).then(function (leido) {
      estado.archivo = archivo;
      estado.filas = leido.filas;
      estado.base64 = leido.base64;
      estado.numero = numeroDelNombre(archivo.name);
      var datos = leido.filas.slice(1).filter(function (f) { return f.some(function (c) { return String(c).trim() !== ''; }); });
      var total = datos.reduce(function (s, f) { return s + importeTexto(f[4]) + importeTexto(f[5]); }, 0);
      info.innerHTML = '<div class="mt-2 small"><i class="bi bi-file-earmark-check me-1 text-success" aria-hidden="true"></i>' + esc(archivo.name) +
        ' · ' + plural(datos.length, 'transporte', 'transportes') + ' · Total ' + esc(nombrePlataforma()) + ' ' + pesos(total) + '</div>';
      if (estado.numero) { importar(); return; }
      info.innerHTML +=
        '<div class="row justify-content-center mt-2"><div class="col-md-6 text-start">' +
        '<label for="pp_numero" class="form-label">N° de proforma en ' + esc(nombrePlataforma()) + ' <span class="text-danger">*</span></label>' +
        '<div class="input-group"><input id="pp_numero" class="form-control" maxlength="30" inputmode="numeric">' +
        '<button type="button" class="btn btn-primary" id="pp_numero_controlar">Controlar</button></div>' +
        '<div class="invalid-feedback d-block d-none" id="pp_numero_error">Completá el N° de proforma.</div>' +
        '<div class="form-text">El nombre del archivo no lo trae: copialo de ' + esc(nombrePlataforma()) + '.</div></div></div>';
      $id('pp_numero').focus();
      $id('pp_numero').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); importar(); } });
      $id('pp_numero_controlar').addEventListener('click', function () { importar(); });
    }, function (e) {
      info.innerHTML = '';
      errorEnModal(esc(e.message));
    });
  }

  // Crea el borrador con el Excel (también con errores del archivo, que quedan como líneas para reclamar).
  function importar(dto) {
    limpiarError();
    if (!estado.archivo || !estado.filas || !estado.base64) { errorEnModal('Elegí el Excel de ' + esc(nombrePlataforma()) + '.'); return; }
    var campoNumero = $id('pp_numero');
    var numero = (estado.numero || (campoNumero ? campoNumero.value : '') || '').trim();
    if (!numero) {
      if (campoNumero) { campoNumero.classList.add('is-invalid'); $id('pp_numero_error').classList.remove('d-none'); campoNumero.focus(); }
      errorEnModal('Completá el N° de proforma en ' + esc(nombrePlataforma()) + '.');
      return;
    }
    dto = dto || (typeof window.armarDto === 'function' ? window.armarDto() : {});
    var cuerpo = {
      ClienteID: estado.clienteId, NumeroPlataforma: numero, NombreArchivo: estado.archivo.name,
      ContentType: estado.archivo.type, ArchivoBase64: estado.base64, Filas: estado.filas, Usuario: usuarioActual(),
      Moneda: dto.Moneda, FechaEmision: dto.FechaEmision, FechaVencimiento: dto.FechaVencimiento,
      Cli_RazonSocial: dto.Cli_RazonSocial, Cli_NombreComercial: dto.Cli_NombreComercial, Cli_CUIT: dto.Cli_CUIT,
      Cli_Direccion: dto.Cli_Direccion, Cli_Telefono: dto.Cli_Telefono,
      FormaPago: dto.FormaPago, PlazoPago: dto.PlazoPago, Validez: dto.Validez, Observaciones: dto.Observaciones
    };
    var boton = $id('pp_numero_controlar') || $id('pp_elegir');
    var listo = SGTL.procesando(boton, 'Controlando…');
    var listoGuardar = SGTL.procesando('#btnGuardarBorrador', 'Controlando…');
    postJson(API + '/Importar', cuerpo).then(function (control) {
      listo(); listoGuardar();
      window.proformaConCambios = false;
      mostrarControl(control);
      SGTL.toastExito('Borrador guardado: ' + plural(control.Cantidad, 'transporte controlado', 'transportes controlados') + '.');
      refrescarListado();
    }, function (e) {
      listo(); listoGuardar();
      var existente = e.datos && e.datos.existente;
      if (existente) {
        errorEnModal(textoError(e, 'La proforma ya está cargada.') +
          ' <button type="button" class="btn btn-sm btn-light-secondary ms-2" id="pp_abrir_existente">' +
          (existente.Estado === 'Borrador' ? 'Abrir el borrador' : 'Ver la proforma') + '</button>');
        $id('pp_abrir_existente').addEventListener('click', function () {
          if (existente.Estado === 'Borrador' && typeof window.editarProforma === 'function') window.editarProforma(existente.Proforma_ID);
          else if (typeof window.verProforma === 'function') window.verProforma(existente.Proforma_ID);
        });
      } else {
        errorEnModal(textoError(e, 'No se pudo importar el archivo. Probá de nuevo.'));
      }
      $id('pp_archivo_estado').innerHTML = '';
      estado.archivo = null;
    });
  }

  // "Guardar borrador": la primera vez es la importación; después guarda las condiciones comerciales.
  function guardar(dto) {
    limpiarError();
    if (estado.control) { guardarCondiciones(estado.control); return; }
    importar(dto);
  }

  function enviarCondiciones(c) {
    var cuerpo = { Usuario: usuarioActual() };
    Object.keys(CONDICIONES).forEach(function (k) { cuerpo[k] = $id(CONDICIONES[k]) ? $id(CONDICIONES[k]).value : null; });
    return pedir(API + '/' + c.Proforma_ID + '/Condiciones', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  }

  function guardarCondiciones(c) {
    if (c.Estado !== 'Borrador' || estado.soloLectura) return;
    var listo = SGTL.procesando('#btnGuardarBorrador', 'Guardando…');
    enviarCondiciones(c).then(function () {
      listo();
      window.proformaConCambios = false;
      refrescarListado();
      if (typeof window.cerrarProformaYMostrarMensaje === 'function') window.cerrarProformaYMostrarMensaje('Borrador guardado.', 'success');
      else { SGTL.toastExito('Borrador guardado.'); $('#modalProforma').modal('hide'); }
    }, function (e) {
      listo();
      errorEnModal(textoError(e, 'No se pudo guardar el borrador.'));
    });
  }

  // En un borrador abierto para editar (no con "Ver"), las condiciones comerciales quedan editables y
  // "Guardar borrador" las guarda. El resto de la cabecera sale del archivo.
  function habilitarCondiciones() {
    Object.keys(CONDICIONES).forEach(function (k) { var e = $id(CONDICIONES[k]); if (e) e.disabled = false; });
    $id('btnGuardarBorrador').style.display = '';
    $id('btnCerrarProforma').textContent = 'Cancelar';
  }

  // ---------------------------------------------------------------- Paso 3: control y generar

  // Al abrir un borrador para editar se vuelve a controlar solo: lo corregido en SGTL ya aparece resuelto.
  function abrir(id, soloLectura) {
    estado.activo = true;
    estado.soloLectura = !!soloLectura;
    modoPlataforma(true);
    $id('bloquePlataforma').innerHTML = '<div class="text-muted py-3">' + (soloLectura ? 'Cargando…' : 'Controlando contra los viajes de SGTL…') + '</div>';
    pedir(API + '/' + id).then(function (c) {
      if (soloLectura || c.Estado !== 'Borrador') return c;
      return postJson(API + '/' + id + '/Controlar', { Usuario: usuarioActual() }).catch(function () { return c; });
    }).then(mostrarControl, function (e) {
      $id('bloquePlataforma').innerHTML = '<div class="alert alert-light-danger color-danger">' + textoError(e, 'No se pudo abrir la proforma.') + '</div>';
    });
  }

  var RESULTADOS = {
    Coincide: 'Coincide', Importe_distinto: 'Importe distinto', Sin_viaje: 'Sin viaje en SGTL', Repetido_en_SGTL: 'N° repetido en SGTL',
    Ya_facturado: 'Ya facturado', En_otra_proforma: 'En otra proforma', Faltan_numeros: 'Faltan números', Sin_tarifa: 'Sin tarifa',
    Repetido_en_archivo: 'Repetido en el Excel', Dato_invalido: 'Dato mal en el Excel'
  };
  var COLOR_RESULTADO = { Coincide: 'verde', Faltan_numeros: 'amarillo', Sin_tarifa: 'amarillo' };

  // Grupos de la tabla, según quién resuelve cada diferencia, con el color de etiqueta del design system (§4.1):
  // rojo lo que está mal en SGTL, amarillo lo que falta gestionar, azul lo que está en curso, verde lo resuelto.
  function grupos() {
    var p = esc(nombrePlataforma());
    return [
      { clave: 'SGTL', color: 'rojo', titulo: 'Para corregir en SGTL', ayuda: 'Corregí el viaje y volvé a controlar' },
      { clave: 'Revisar', color: 'amarillo', titulo: 'Para revisar', ayuda: 'Mirá la tarifa usada: si el viaje está bien, reclamalo; si no, corregilo' },
      { clave: 'Plataforma', color: 'amarillo', titulo: 'Para reclamar a ' + p, ayuda: 'Vienen mal en el Excel: registrá el reclamo' },
      { clave: 'Esperando', color: 'azul', titulo: 'Esperando a ' + p, ayuda: 'Cuando ' + p + ' lo corrija, reemplazá el Excel' },
      { clave: 'Coincide', color: 'verde', titulo: 'Coinciden' }
    ];
  }
  function grupoDe(l) { return l.Coincide ? 'Coincide' : (l.Reclamada ? 'Esperando' : (l.Responsable || 'Revisar')); }

  function botonViaje(viajeId) {
    if (!viajeId) return '';
    var texto = 'Abrir viaje #' + viajeId;
    return '<a class="btn btn-sm btn-outline-primary pp-abrir-viaje" href="gestion-viajes.html?viaje=' + encodeURIComponent(viajeId) + '" target="_blank" rel="noopener"' +
      ' data-bs-toggle="tooltip" title="' + esc(texto) + '" aria-label="' + esc(texto) + '"><i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a>';
  }

  // Lo único del detalle que la etiqueta no dice (qué número falta, qué filas, qué viajes). Lo demás ya está
  // en la etiqueta o en la ayuda del grupo.
  function detalleCorto(l) {
    var d = l.Detalle || '', m;
    switch (l.Resultado) {
      case 'Faltan_numeros': m = /le falta: (.*?)\.?$/.exec(d); return m ? 'Falta ' + m[1] : d;
      case 'Repetido_en_SGTL': m = /: (#[^.]*)/.exec(d); return m ? 'Viajes ' + m[1] : d;
      case 'Repetido_en_archivo': m = /\(filas ([^)]*)\)/.exec(d); return m ? 'Filas ' + m[1] : d;
      case 'Dato_invalido': m = /del Excel: (.*?)\.?$/.exec(d); return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : d;
      case 'Coincide': case 'Importe_distinto': case 'Sin_viaje': case 'Ya_facturado': case 'En_otra_proforma': case 'Sin_tarifa': return '';
      default: return d;
    }
  }

  function filaLinea(l, oculta) {
    var corto = detalleCorto(l);
    var resultado = '<span class="badge rounded-pill estado-' + (COLOR_RESULTADO[l.Resultado] || 'rojo') + '"' +
      (l.Detalle ? ' title="' + esc(l.Detalle) + '"' : '') + '>' + esc(RESULTADOS[l.Resultado] || l.Resultado || '') + '</span>' +
      (corto ? '<div class="small text-muted">' + esc(corto) + '</div>' : '');
    var tarifa = l.TarifaUsada
      ? ' <i class="bi bi-info-circle text-muted" tabindex="0" data-bs-toggle="tooltip" title="' + esc(l.TarifaUsada) + '" aria-label="Tarifa usada: ' + esc(l.TarifaUsada) + '"></i>'
      : '';
    var accion = l.ViajeID ? botonViaje(l.ViajeID)
      : (l.Resultado === 'Sin_viaje'
        ? '<a class="btn btn-sm btn-outline-primary pp-abrir-viaje" href="gestion-viajes.html" target="_blank" rel="noopener" data-bs-toggle="tooltip" title="Ir a Gestionar viajes para registrarlo" aria-label="Ir a Gestionar viajes para registrarlo"><i class="bi bi-truck" aria-hidden="true"></i></a>'
        : '');
    return '<tr' + (oculta ? ' class="pp-coincide d-none"' : (l.Coincide ? ' class="pp-coincide"' : '')) + '>' +
      '<td class="text-nowrap">' + esc(l.Referencia) + '</td>' +
      '<td class="text-center text-nowrap">' + fecha(l.Fecha) + '</td>' +
      '<td>' + esc(l.Ruta || '') + '</td>' +
      '<td class="text-end text-nowrap">' + pesos(l.ImporteViaje) + '</td>' +
      '<td class="text-end text-nowrap">' + (l.ImporteSgtl != null ? pesos(l.ImporteSgtl) : '—') + tarifa + '</td>' +
      '<td class="text-end text-nowrap">' + (l.Diferencia ? pesos(l.Diferencia) : '') + '</td>' +
      '<td class="text-end text-nowrap">' + (l.Adicionales ? pesos(l.Adicionales) : '') + '</td>' +
      '<td class="text-center">' + resultado + '</td>' +
      '<td class="text-center">' + accion + '</td>' +
      '</tr>';
  }

  function tablaControl(c) {
    var p = esc(nombrePlataforma());
    var lineas = c.Lineas || [];
    // Con diferencias, las que coinciden van plegadas; sin diferencias (o ya generada) se ven todas.
    var plegadas = c.Diferencias > 0 && c.Estado === 'Borrador';
    var cuerpo = grupos().map(function (g) {
      var del = lineas.filter(function (l) { return grupoDe(l) === g.clave; });
      if (!del.length) return '';
      var titulo = '<span class="badge rounded-pill estado-' + g.color + '">' + g.titulo + ' · ' + del.length + '</span>';
      if (g.clave === 'Coincide') {
        titulo = '<button type="button" class="btn btn-link p-0 text-body text-decoration-none" id="pp_ver_coinciden" aria-expanded="' + !plegadas + '">' +
          '<i class="bi ' + (plegadas ? 'bi-chevron-right' : 'bi-chevron-down') + ' me-1" aria-hidden="true"></i>' + titulo + '</button>';
      }
      return '<tbody><tr class="sgtl-grupo" id="pp_grupo_' + g.clave + '"><th colspan="9"><div class="d-flex flex-wrap align-items-center justify-content-between gap-1">' +
        '<span>' + titulo + '</span>' +
        (g.ayuda && !estado.soloLectura && c.Estado === 'Borrador' ? '<span class="fw-normal small text-muted">' + g.ayuda + '</span>' : '') +
        '</div></th></tr>' +
        del.map(function (l) { return filaLinea(l, g.clave === 'Coincide' && plegadas); }).join('') + '</tbody>';
    }).join('');
    return '<div class="sgtl-tabla-tarjeta mb-3"><div class="table-responsive"><table class="table table-sm table-striped table-hover sgtl-tabla-compacta align-middle"><thead><tr>' +
      '<th>Transporte</th><th class="text-center">Fecha</th><th class="sgtl-col-texto">Ruta</th><th class="text-end">Importe ' + p + '</th><th class="text-end">Importe SGTL</th>' +
      '<th class="text-end">Diferencia</th><th class="text-end">Adicionales</th><th class="text-center">Resultado</th><th class="text-center">Acciones</th>' +
      '</tr></thead>' + cuerpo + '</table></div></div>';
  }

  // Etiqueta de estado (§4.3) que además es un botón.
  function etiqueta(clase, texto, atributos) {
    return '<button type="button" class="badge rounded-pill sgtl-badge-accion ' + clase + '"' + (atributos || '') + '>' + texto + '</button>';
  }

  // Una sola línea arriba de la tabla: a la izquierda, cuántos hay de cada grupo (cada etiqueta lleva a su grupo),
  // el reclamo pendiente y los avisos; a la derecha, todas las acciones del control.
  function barraControl(c, editable) {
    var p = esc(nombrePlataforma());
    var lineas = c.Lineas || [];
    var orden = grupos();
    orden.unshift(orden.pop());
    var etiquetas = orden.map(function (g) {
      var n = lineas.filter(function (l) { return grupoDe(l) === g.clave; }).length;
      if (!n) return '';
      var texto = g.clave === 'Coincide'
        ? (n === c.Cantidad ? (n === 1 ? 'El transporte coincide' : 'Los ' + n + ' coinciden') + (editable ? ' · lista para generar' : '') : n + ' coinciden')
        : g.titulo + ' · ' + n;
      return etiqueta('estado-' + g.color, texto, ' data-grupo="' + g.clave + '"');
    }).join('');
    if (c.ReclamoFecha) {
      etiquetas += etiqueta('estado-amarillo', '<i class="bi bi-chat-left-text me-1" aria-hidden="true"></i>Reclamo del ' + fecha(c.ReclamoFecha), ' data-panel="pp_panel_reclamo" aria-expanded="false"');
    }
    if ((c.Avisos || []).length) {
      var m = /Hay (\d+) viaje/.exec(c.Avisos[0]);
      var n = m ? parseInt(m[1], 10) : 0;
      etiquetas += etiqueta('bg-white text-dark border', '<i class="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>' +
        (n ? plural(n, 'viaje fuera de esta proforma', 'viajes fuera de esta proforma') : 'Avisos'), ' data-panel="pp_panel_avisos" aria-expanded="false"');
    }
    var acciones = !editable ? '' :
      '<button type="button" class="btn btn-sm btn-outline-primary" id="pp_controlar"><i class="bi bi-arrow-repeat me-1" aria-hidden="true"></i>Volver a controlar</button>' +
      (c.Diferencias > 0 && !c.ReclamoFecha ? '<button type="button" class="btn btn-sm btn-outline-primary" id="pp_reclamo"><i class="bi bi-megaphone me-1" aria-hidden="true"></i>Registrar reclamo</button>' : '') +
      '<button type="button" class="btn btn-sm btn-outline-primary" id="pp_reemplazar"><i class="bi bi-file-earmark-arrow-up me-1" aria-hidden="true"></i>Reemplazar Excel</button>' +
      '<input type="file" id="pp_reemplazo" accept=".xlsx" class="d-none" aria-label="Excel corregido de ' + p + '">';
    return '<div class="d-flex flex-wrap align-items-center gap-2 mb-3">' +
      '<div class="d-flex flex-wrap align-items-center gap-2 me-auto">' + etiquetas + '</div>' +
      '<div class="d-flex flex-wrap gap-2 ms-auto">' + acciones + '</div></div>';
  }

  // Paneles que abren las etiquetas del reclamo y de los avisos: el texto largo queda a un clic.
  function panelesControl(c, editable) {
    var p = esc(nombrePlataforma());
    var reclamo = !c.ReclamoFecha ? '' :
      '<div id="pp_panel_reclamo" class="d-none sgtl-panel sgtl-panel-amarillo mb-3 small">' +
      '<div class="d-flex flex-wrap align-items-start gap-2"><div class="me-auto" style="white-space: pre-line">' +
      '<span class="fw-bold">Reclamo en ' + p + ' del ' + fecha(c.ReclamoFecha) + '.</span> ' + esc(c.ReclamoMotivo || '') + '</div>' +
      (editable ? '<div class="d-flex gap-2"><button type="button" class="btn btn-sm btn-outline-secondary" id="pp_reclamo"><i class="bi bi-pencil me-1" aria-hidden="true"></i>Editar reclamo</button>' +
        '<button type="button" class="btn btn-sm btn-outline-secondary" id="pp_cerrar_reclamo"><i class="bi bi-x-circle me-1" aria-hidden="true"></i>Cerrar reclamo</button></div>' : '') +
      '</div></div>';
    var avisos = !(c.Avisos || []).length ? '' :
      '<div id="pp_panel_avisos" class="d-none sgtl-panel mb-3 small">' +
      c.Avisos.map(function (a) { return '<div>' + esc(a) + '</div>'; }).join('') + '</div>';
    return reclamo + avisos;
  }

  function mostrarControl(c) {
    estado.activo = true;
    estado.control = c;
    estado.plataforma = c.Plataforma || estado.plataforma;
    var esBorrador = c.Estado === 'Borrador';
    // Con "Ver" (ojo) el borrador es solo lectura: sin acciones, como la proforma propia.
    var editable = esBorrador && !estado.soloLectura;

    modoPlataforma(true);
    var titulo = $id('tituloModal');
    if (titulo) titulo.textContent = (c.Numero ? 'Proforma ' + c.Numero + ' · ' : 'Proforma de ') + nombrePlataforma() + ' ' + (c.NumeroPlataforma || '');
    if ($id('p_id')) $id('p_id').value = c.Proforma_ID;
    // Los datos de la cabecera se guardan al importar; el borrador se maneja desde este bloque.
    if (typeof window.setModoLectura === 'function') window.setModoLectura(true);
    $id('btnCerrarProforma').textContent = 'Cerrar';
    if (editable) habilitarCondiciones();
    // Lo que se escribe en este bloque (reclamo, reemplazo) se guarda con sus botones: no cuenta como cambio sin guardar.
    $id('bloquePlataforma').dataset.sinCambios = 'true';
    mostrarBotonesPie(true);
    $id('btnGenerar').style.display = editable ? '' : 'none';
    botonGenerar(!!c.PuedeGenerar);
    botonPdf(true);
    // setVal (gestion-facturacion.html) también actualiza la fecha que se ve en el calendario (DD/MM/AAAA).
    if (c.FechaDesde && $id('p_fdesde')) window.setVal('p_fdesde', String(c.FechaDesde).substring(0, 10));
    if (c.FechaHasta && $id('p_fhasta')) window.setVal('p_fhasta', String(c.FechaHasta).substring(0, 10));
    plegarCliente(true);
    mostrarDatosCliente();
    pasos(esBorrador ? 3 : 0);
    resumirCondiciones();
    motivoPie(editable && c.Diferencias
      ? 'Para generar, resolvé ' + (c.Diferencias === 1 ? 'la diferencia' : 'las ' + c.Diferencias + ' diferencias') + '.'
      : '', 'bi-lock');

    $id('bloquePlataforma').innerHTML =
      // Sin pasos (proforma ya generada) el cliente, el archivo y el período no se ven en otro lado.
      (esBorrador ? '' : '<div class="small text-muted mb-2"><span class="text-body">' + esc(valorCampo('p_cli_razon')) + '</span>' +
        ' · <i class="bi bi-file-earmark-spreadsheet" aria-hidden="true"></i> ' + esc(c.NombreArchivo || '') +
        (c.FechaDesde ? ' · ' + fecha(c.FechaDesde) + (c.FechaHasta ? ' al ' + fecha(c.FechaHasta) : '') : '') + '</div>') +
      barraControl(c, editable) +
      panelesControl(c, editable) +
      '<div id="pp_form_reclamo" class="d-none sgtl-panel mb-3"></div>' +
      tablaControl(c) +
      '<div class="d-flex justify-content-end"><div class="sgtl-totales">' +
      '<span>Neto ' + monto(c.TotalPlataforma) + '</span><span>IVA 21 % ' + monto(c.Iva) + '</span>' +
      '<span>Total <strong>' + monto(c.Total) + '</strong></span></div></div>';

    enlazarAcciones(c);

    // Totales del modal (ocultos en este modo) con lo de la plataforma, por si otra parte de la pantalla los lee.
    if ($id('t_subtotal')) $id('t_subtotal').textContent = monto(c.TotalPlataforma);
    if ($id('t_desc')) $id('t_desc').textContent = monto(0);
    if ($id('t_neto')) $id('t_neto').textContent = monto(c.TotalPlataforma);
    if ($id('t_iva')) $id('t_iva').textContent = monto(c.Iva);
    if ($id('t_total')) $id('t_total').textContent = monto(c.Total);
  }

  function hoyLocal() {
    var hoy = new Date();
    return hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  }

  function plegarCoinciden(plegar) {
    var boton = $id('pp_ver_coinciden');
    if (!boton) return;
    boton.setAttribute('aria-expanded', String(!plegar));
    boton.querySelector('.bi').className = 'bi me-1 ' + (plegar ? 'bi-chevron-right' : 'bi-chevron-down');
    Array.prototype.forEach.call(document.querySelectorAll('#bloquePlataforma tr.pp-coincide'), function (tr) { tr.classList.toggle('d-none', plegar); });
  }

  function enlazarAcciones(c) {
    var bloque = $id('bloquePlataforma');
    var controlar = $id('pp_controlar');
    if (controlar) controlar.addEventListener('click', function () { volverAControlar(c.Proforma_ID); });
    var reemplazar = $id('pp_reemplazar'), archivo = $id('pp_reemplazo');
    if (reemplazar && archivo) {
      reemplazar.addEventListener('click', function () { archivo.click(); });
      archivo.addEventListener('change', function () { reemplazarArchivo(c, this.files && this.files[0]); this.value = ''; });
    }
    var reclamo = $id('pp_reclamo');
    if (reclamo) reclamo.addEventListener('click', function () { abrirFormReclamo(c); });
    var cerrarReclamo = $id('pp_cerrar_reclamo');
    if (cerrarReclamo) cerrarReclamo.addEventListener('click', function () {
      var listo = SGTL.procesando('#pp_cerrar_reclamo');
      postJson(API + '/' + c.Proforma_ID + '/Reclamo/Cerrar', { Usuario: usuarioActual() })
        .then(function (r) { listo(); mostrarControl(r); SGTL.toastExito('Reclamo cerrado.'); refrescarListado(); },
          function (e) { listo(); SGTL.toastError($('<div>').html(textoError(e, 'No se pudo cerrar el reclamo.')).text()); });
    });
    var verCoinciden = $id('pp_ver_coinciden');
    if (verCoinciden) verCoinciden.addEventListener('click', function () { plegarCoinciden(this.getAttribute('aria-expanded') === 'true'); });
    // Etiquetas del resumen: llevan a su grupo de la tabla o abren su panel.
    Array.prototype.forEach.call(bloque.querySelectorAll('.sgtl-badge-accion'), function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.panel) {
          var panel = $id(b.dataset.panel);
          var abrir = panel.classList.contains('d-none');
          panel.classList.toggle('d-none', !abrir);
          b.setAttribute('aria-expanded', String(abrir));
          return;
        }
        if (b.dataset.grupo === 'Coincide') plegarCoinciden(false);
        var fila = $id('pp_grupo_' + b.dataset.grupo);
        if (fila) fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
    // Al volver de corregir un viaje en la otra pestaña se vuelve a controlar solo.
    Array.prototype.forEach.call(bloque.querySelectorAll('.pp-abrir-viaje'), function (a) {
      a.addEventListener('click', function () { estado.abrioViaje = true; });
    });
  }

  // ---------------------------------------------------------------- Reclamo por línea

  // Texto de cada línea para el motivo del reclamo.
  function textoReclamo(l) {
    var p = nombrePlataforma();
    switch (l.Resultado) {
      case 'Importe_distinto': return 'Transporte ' + l.Referencia + ': importe ' + p + ' ' + pesos(l.ImporteViaje) + ', SGTL ' + pesos(l.ImporteSgtl) + '.';
      case 'Sin_viaje': return 'Transporte ' + l.Referencia + ': no corresponde a un viaje de Transporte Sánchez.';
      case 'Ya_facturado': return 'Transporte ' + l.Referencia + ': ya se facturó en otra proforma.';
      case 'En_otra_proforma': return 'Transporte ' + l.Referencia + ': ya está en otra proforma.';
      case 'Repetido_en_archivo': return 'Transporte ' + l.Referencia + ': está dos veces en el Excel.';
      default: return 'Transporte ' + l.Referencia + ': ' + (l.Detalle || RESULTADOS[l.Resultado] || l.Resultado) + (/\.$/.test(l.Detalle || '') ? '' : '.');
    }
  }

  function abrirFormReclamo(c) {
    var p = esc(nombrePlataforma());
    var form = $id('pp_form_reclamo');
    var diferencias = (c.Lineas || []).filter(function (l) { return !l.Coincide; });
    var editando = !!c.ReclamoFecha;
    var casillas = diferencias.map(function (l) {
      // Marcadas: las que ya estaban reclamadas o, en un reclamo nuevo, las que son errores del Excel.
      var marcada = editando ? l.Reclamada : l.Responsable === 'Plataforma';
      var id = 'pp_rl_' + l.Orden;
      return '<div class="form-check"><input class="form-check-input" type="checkbox" id="' + id + '" value="' + l.Orden + '"' + (marcada ? ' checked' : '') + '>' +
        '<label class="form-check-label" for="' + id + '">' + esc(l.Referencia) + ' · ' + esc(RESULTADOS[l.Resultado] || l.Resultado) +
        (l.Responsable === 'SGTL' ? ' <span class="small text-muted">(se corrige en SGTL)</span>' : '') + '</label></div>';
    }).join('');
    form.innerHTML =
      '<div class="fw-bold mb-1">' + (editando ? 'Editar reclamo en ' : 'Registrar reclamo en ') + p + '</div>' +
      '<div class="small text-muted mb-2">Marcá los transportes que tiene que corregir ' + p + '. Pasan a "Esperando a ' + p + '".</div>' +
      (casillas ? '<div class="mb-3">' + casillas + '</div>' : '') +
      '<div class="row g-2">' +
      '<div class="col-md-3"><label for="pp_reclamo_fecha" class="form-label">Fecha <span class="text-danger">*</span></label><input id="pp_reclamo_fecha" class="form-control" placeholder="DD/MM/AAAA"></div>' +
      '<div class="col-md-9"><label for="pp_reclamo_motivo" class="form-label">Motivo <span class="text-danger">*</span></label>' +
      '<textarea id="pp_reclamo_motivo" class="form-control" rows="3" maxlength="' + MOTIVO_MAXIMO + '"></textarea>' +
      '<div class="invalid-feedback" id="pp_reclamo_error">Completá el motivo.</div>' +
      '<div class="form-text text-end" id="pp_reclamo_contador"></div></div></div>' +
      '<div class="mt-2 d-flex justify-content-end gap-2"><button type="button" class="btn btn-light-secondary" id="pp_reclamo_cancelar">Cancelar</button>' +
      '<button type="button" class="btn btn-primary" id="pp_reclamo_guardar">Guardar</button></div>';
    form.classList.remove('d-none');

    var motivo = $id('pp_reclamo_motivo');
    $id('pp_reclamo_fecha').value = editando ? String(c.ReclamoFecha).substring(0, 10) : hoyLocal();
    // Calendario del sistema (§7.1): se ve DD/MM/AAAA y el campo sigue guardando AAAA-MM-DD.
    if (window.SGTL && SGTL.selectorFecha) SGTL.selectorFecha($id('pp_reclamo_fecha'), { dateFormat: 'Y-m-d', altInput: true, altFormat: 'd/m/Y' });
    var contar = function () { $id('pp_reclamo_contador').textContent = motivo.value.length + '/' + MOTIVO_MAXIMO; };
    // El motivo se arma con los transportes marcados hasta que la persona lo escribe a mano.
    var armar = function () {
      if (motivo.dataset.aMano === 'true') return;
      var marcadas = marcadasReclamo();
      motivo.value = diferencias.filter(function (l) { return marcadas.indexOf(l.Orden) !== -1; }).map(textoReclamo).join('\n').substring(0, MOTIVO_MAXIMO);
      contar();
    };
    if (editando) { motivo.value = c.ReclamoMotivo || ''; motivo.dataset.aMano = 'true'; contar(); } else armar();
    form.onchange = function (e) { if (e.target.classList.contains('form-check-input')) armar(); };
    motivo.addEventListener('input', function () { motivo.dataset.aMano = 'true'; motivo.classList.remove('is-invalid'); contar(); });
    $id('pp_reclamo_cancelar').addEventListener('click', function () { form.classList.add('d-none'); form.innerHTML = ''; });
    $id('pp_reclamo_guardar').addEventListener('click', function () { registrarReclamo(c.Proforma_ID); });
    form.scrollIntoView({ block: 'nearest' });
    motivo.focus();
  }

  function marcadasReclamo() {
    return Array.prototype.map.call(document.querySelectorAll('#pp_form_reclamo .form-check-input:checked'), function (i) { return parseInt(i.value, 10); });
  }

  function registrarReclamo(id) {
    var motivo = $id('pp_reclamo_motivo');
    var texto = (motivo.value || '').trim();
    motivo.classList.toggle('is-invalid', !texto);
    if (!texto) { motivo.focus(); return; }
    var listo = SGTL.procesando('#pp_reclamo_guardar');
    postJson(API + '/' + id + '/Reclamo', { Fecha: $id('pp_reclamo_fecha').value || null, Motivo: texto, Lineas: marcadasReclamo(), Usuario: usuarioActual() })
      .then(function (r) { listo(); mostrarControl(r); SGTL.toastExito('Reclamo guardado.'); refrescarListado(); },
        function (e) { listo(); errorEnModal(textoError(e, 'No se pudo guardar el reclamo.')); });
  }

  // ---------------------------------------------------------------- Reemplazar, controlar y generar

  function reemplazarArchivo(c, archivo) {
    limpiarError();
    if (!archivo) return;
    var listo = SGTL.procesando('#pp_reemplazar', 'Reemplazando…');
    leerExcel(archivo).then(function (leido) {
      return postJson(API + '/' + c.Proforma_ID + '/ReemplazarArchivo', {
        NumeroPlataforma: numeroDelNombre(archivo.name) || c.NumeroPlataforma, NombreArchivo: archivo.name, ContentType: archivo.type,
        ArchivoBase64: leido.base64, Filas: leido.filas, Usuario: usuarioActual()
      });
    }).then(function (r) {
      listo();
      mostrarControl(r);
      SGTL.toastExito('Excel reemplazado.');
      refrescarListado();
    }, function (e) {
      listo();
      errorEnModal(e.datos ? textoError(e, 'No se pudo reemplazar el Excel.') : esc(e.message));
    });
  }

  function volverAControlar(id, silencioso) {
    var listo = silencioso ? function () { } : SGTL.procesando('#pp_controlar');
    postJson(API + '/' + id + '/Controlar', { Usuario: usuarioActual() })
      // listo() antes de redibujar: devuelve Cerrar y la cruz y saca la marca de "procesando" del modal.
      .then(function (c) { listo(); mostrarControl(c); SGTL.toastExito('Control actualizado.'); refrescarListado(); },
        function (e) { listo(); SGTL.toastError($('<div>').html(textoError(e, 'No se pudo volver a controlar.')).text()); });
  }

  // Generar consume un número PF: se confirma en el pie, donde se tocó el botón.
  function pedirConfirmacionGenerar() {
    var c = estado.control;
    var pregunta = $id('pp_pie_pregunta');
    if (!pregunta) return;
    pregunta.innerHTML = '<strong>¿Generar la proforma de ' + esc(nombrePlataforma()) + ' ' + esc(c.NumeroPlataforma || '') + '?</strong> ' +
      '<span class="small">Se le asigna número y queda aceptada, lista para facturar.</span>';
    mostrarBotonesPie(false);
    $id('pp_generar_confirmar').focus();
  }

  function confirmarGenerar(id) {
    limpiarError();
    var listo = SGTL.procesando('#pp_generar_confirmar');
    // Como en la proforma propia: primero se guarda el borrador (las condiciones comerciales), después se genera.
    var antes = !estado.soloLectura && estado.control ? enviarCondiciones(estado.control) : Promise.resolve();
    antes.then(function () { return postJson(API + '/' + id + '/Generar', { Usuario: usuarioActual() }); })
      .then(function (r) {
        listo();
        window.proformaConCambios = false;
        refrescarListado();
        if (typeof window.cerrarProformaYMostrarMensaje === 'function') window.cerrarProformaYMostrarMensaje('Proforma generada: ' + r.Numero + '.', 'success');
        else { SGTL.toastExito('Proforma generada: ' + r.Numero + '.'); $('#modalProforma').modal('hide'); }
      }, function (e) {
        listo();
        mostrarBotonesPie(true);
        if (e.datos && e.datos.control) mostrarControl(e.datos.control);
        errorEnModal(textoError(e, 'No se pudo generar la proforma.'));
      });
  }

  // Volver a la pestaña después de "Abrir viaje": se vuelve a controlar el borrador abierto.
  function alVolver() {
    if (document.hidden || !estado.abrioViaje) return;
    estado.abrioViaje = false;
    var c = estado.control;
    if (!c || c.Estado !== 'Borrador' || estado.soloLectura || !$('#modalProforma').hasClass('show')) return;
    volverAControlar(c.Proforma_ID, true);
  }
  window.addEventListener('focus', alVolver);
  document.addEventListener('visibilitychange', alVolver);

  // ---------------------------------------------------------------- Listado de proformas

  function etiquetaListado(x) {
    if (x.Tipo_Proforma !== 'Plataforma') return '';
    return ' <span class="badge rounded-pill bg-white text-dark border">' + esc((x.Plataforma || 'Plataforma') + ' ' + (x.Plataforma_Numero || '')) + '</span>';
  }

  // Junto al estado de un borrador de plataforma: qué falta y de quién depende, con las mismas etiquetas
  // (y colores) que los grupos del control.
  function avisosListado(x) {
    if (x.Tipo_Proforma !== 'Plataforma' || x.Estado !== 'Borrador') return '';
    var p = x.Plataforma || 'la plataforma';
    var etiquetas = [];
    var poner = function (color, texto) { etiquetas.push('<span class="badge rounded-pill estado-' + color + '">' + esc(texto) + '</span>'); };
    if (x.PlataformaPorCorregir) poner('rojo', 'Corregir en SGTL · ' + x.PlataformaPorCorregir);
    if (x.PlataformaPorRevisar) poner('amarillo', 'Revisar · ' + x.PlataformaPorRevisar);
    if (x.PlataformaPorReclamar) poner('amarillo', 'Reclamar a ' + p + ' · ' + x.PlataformaPorReclamar);
    if (x.PlataformaEsperando || x.ReclamoFecha) {
      poner('azul', 'Esperando a ' + p + (x.PlataformaEsperando ? ' · ' + x.PlataformaEsperando : '') +
        (x.ReclamoFecha ? ' desde el ' + (window.SGTL ? SGTL.fecha(x.ReclamoFecha) : '') : ''));
    }
    if (!etiquetas.length && x.PlataformaLineas) poner('verde', 'Lista para generar');
    return etiquetas.length ? '<div class="d-flex flex-wrap gap-1 mt-1">' + etiquetas.join('') + '</div>' : '';
  }

  window.ProformaPlataforma = {
    etiquetaListado: etiquetaListado,
    avisosListado: avisosListado,
    activo: function () { return estado.activo; },
    reiniciar: desactivar,
    // Al elegir el cliente: si trabaja con plataforma, el modal pasa a los pasos con el Excel.
    alCambiarCliente: function (clienteId, cliente) {
      if (!clienteId || !cliente || cliente.Tipo_Cliente !== 'Con_plataforma') { if (estado.activo) desactivar(); return; }
      pedir(API + '/Cliente/' + clienteId).then(function (info) {
        if (info.ConPlataforma) activar(parseInt(clienteId, 10), info); else desactivar();
      }, function () { desactivar(); });
    },
    guardar: guardar,
    abrir: abrir,
    generar: function () {
      if (!estado.control) { errorEnModal('Elegí el Excel de ' + esc(nombrePlataforma()) + ' para controlarlo antes de generar.'); return; }
      if (!estado.control.PuedeGenerar) { SGTL.toastError('Para generar, resolvé las diferencias.'); return; }
      pedirConfirmacionGenerar();
    }
  };
})();
