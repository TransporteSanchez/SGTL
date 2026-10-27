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
  // En modo plataforma los datos del cliente van en una fila compacta (debajo del cliente o en el recuadro de arriba
  // de la tabla) y el período sale del Excel. No se editan acá: "Editar cliente" abre la edición del cliente (§25).
  var CAMPOS_CLIENTE = ['p_cli_razon', 'p_cli_nombre', 'p_cli_cuit', 'p_cli_condiva', 'p_cli_dir', 'p_cli_tel'];
  var CAMPOS_PERIODO = ['p_fdesde', 'p_fhasta'];
  var MOTIVO_MAXIMO = 500;

  function nuevoEstado() {
    return { activo: false, clienteId: null, plataforma: null, puedeLeer: false, archivo: null, filas: null, base64: null, numero: null, control: null, soloLectura: false, abrioViaje: false };
  }

  function $id(id) { return document.getElementById(id); }
  function esc(v) { return window.SGTL ? SGTL.escapar(v) : String(v == null ? '' : v); }
  // Con centavos, como en la proforma y la factura: sin ellos parecía que no cuadraba (mejora 10 del juego de demo, 25/10).
  function pesos(v) { return window.SGTL ? SGTL.monto(v) : String(v); }
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
  // Devuelve lo que ocultar() escondió (lo de Facu que se vuelve a ver en otro paso).
  function mostrarOculto(el) {
    if (!el || !el.hasAttribute('data-pp-oculto')) return;
    el.classList.remove('d-none');
    el.removeAttribute('data-pp-oculto');
  }
  function columna(id) { var el = $id(id); return el ? el.closest('[class*="col-"]') : null; }
  function filaDe(id) { var el = $id(id); return el ? el.closest('.row') : null; }

  function modoPlataforma(activo) {
    var cuerpo = document.querySelector('#modalProforma .modal-body');
    var pie = document.querySelector('#modalProforma .modal-footer');
    if (!cuerpo || !pie) return;
    $id('bloqueConceptos').classList.toggle('d-none', activo);
    // El modal se ensancha para que la tabla del control tenga aire (pedido de Rocío, 22/10).
    var dialogo = document.querySelector('#modalProforma .modal-dialog');
    if (dialogo) dialogo.classList.toggle('sgtl-modal-ancho', activo);
    $id('bloquePlataforma').classList.toggle('d-none', !activo);
    $('#p_otros').prop('readonly', activo);

    if (!activo) {
      var envoltura = $id('pp_generar_envoltura');
      if (envoltura && $id('btnGenerar')) envoltura.before($id('btnGenerar'));
      ['pp_pasos', 'pp_ficha', 'pp_cond_titulo', 'pp_generar_envoltura', 'pp_pie_confirmar'].forEach(function (id) { var el = $id(id); if (el) el.remove(); });
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
    if (tituloDatos && tituloDatos.classList.contains('sgtl-bloque-titulo')) ocultar(tituloDatos);
    cuerpo.insertBefore(crear('<ol id="pp_pasos" class="sgtl-pasos" aria-label="Pasos"></ol>'), tituloDatos || filaCliente);
    CAMPOS_PERIODO.concat(CAMPOS_CLIENTE).forEach(function (id) { ocultar(columna(id)); });
    // El recuadro completo de la proforma propia no va: acá los datos del cliente van en su versión compacta.
    ocultar($id('p_cli_resumenGrupo'));
    if (filaCliente) filaCliente.after(crear('<div id="pp_ficha" class="small text-muted mt-1"></div>'));

    // Totales: van en una línea dentro del bloque de la plataforma. (El dl también tiene la clase row.)
    var dlTotales = $id('t_total') ? $id('t_total').closest('dl') : null;
    ocultar(dlTotales ? dlTotales.parentElement.closest('.row') : null);

    // Condiciones comerciales: plegadas, con un resumen.
    var filaCond = filaDe('p_formapago');
    var tituloCond = filaCond ? filaCond.previousElementSibling : null;
    if (tituloCond && tituloCond.classList.contains('sgtl-bloque-titulo')) ocultar(tituloCond);
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

    // "Generar proforma" va en un span para que, deshabilitado, muestre el motivo en su globito (§1.4).
    var generar = $id('btnGenerar');
    if (generar) {
      var envolturaGenerar = crear('<span id="pp_generar_envoltura" class="d-inline-block"></span>');
      generar.before(envolturaGenerar);
      envolturaGenerar.appendChild(generar);
    }
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
    // Vacías no dicen nada: el resumen aparece cuando hay algo cargado.
    resumen.textContent = partes.length ? '· ' + partes.join(' · ') : '';
  }

  function valorCampo(id) { return ($id(id) && $id(id).value || '').trim(); }

  // Pasos: 1 Cliente, 2 Excel de la plataforma, 3 Control y generar. Solo los nombres: en el paso 3 el cliente, el
  // archivo y el período van en el recuadro gris de arriba de la tabla (§6.3, segunda vuelta del 22/10).
  function pasos(actual) {
    var ol = $id('pp_pasos');
    if (!ol) return;
    ol.classList.toggle('d-none', !actual);
    var nombres = ['Cliente', 'Excel de ' + nombrePlataforma(), 'Control y generar'];
    ol.innerHTML = nombres.map(function (nombre, i) {
      var n = i + 1;
      if (n < actual) return '<li class="hecho"><span class="sgtl-paso-numero"><i class="bi bi-check-lg" aria-hidden="true"></i></span><span>' + esc(nombre) + '</span></li>';
      return '<li' + (n === actual ? ' class="actual" aria-current="step"' : '') + '><span class="sgtl-paso-numero">' + n + '</span>' + esc(nombre) + '</li>';
    }).join('');
  }

  // Los datos del cliente en la versión compacta de la pantalla (htmlDatosCliente, gestion-facturacion.html): una
  // fila, siempre a la vista y chica, para que lo principal siga siendo el Excel (pedido de Rocío, 22/10). Con
  // "Editar cliente" mientras la proforma se puede cambiar.
  function datosCliente(conEnlace) {
    return typeof window.htmlDatosCliente === 'function'
      ? window.htmlDatosCliente({ compacto: true, enlace: conEnlace })
      : esc(valorCampo('p_cli_razon'));
  }

  // Paso 2: los datos del cliente debajo del campo.
  // La etiqueta de la plataforma va adentro del campo, como en Registrar viaje (data-etiqueta de la opción).
  function ficha() {
    var caja = $id('pp_ficha');
    if (!caja) return;
    caja.className = 'sgtl-dato-fijo mt-2';
    caja.innerHTML = datosCliente(true);
  }

  // En el paso 3 el cliente ya no se cambia: el campo y la línea de datos se pliegan (quedan en los pasos).
  function plegarCliente(plegar) {
    [$id('p_clienteGrupo'), $id('pp_ficha'), $id('p_numeroGrupo')].forEach(function (el) {
      if (!el) return;
      if (plegar) ocultar(el);
      else if (el.hasAttribute('data-pp-oculto')) { el.classList.remove('d-none'); el.removeAttribute('data-pp-oculto'); }
    });
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

  // Deshabilitado, el motivo va en el globito del span que lo envuelve, como en los botones de la fila (§1.4).
  function botonGenerar(habilitado, motivo) {
    var gen = $id('btnGenerar');
    if (!gen) return;
    gen.disabled = !habilitado;
    // Deshabilitado no tiene que parecer habilitado (verde con opacidad).
    gen.classList.toggle('btn-success', habilitado);
    gen.classList.toggle('btn-secondary', !habilitado);
    var vieja = $id('pp_generar_envoltura');
    if (!vieja) return;
    // Un span nuevo cada vez: el globito toma su texto la primera vez que se muestra.
    var nueva = crear('<span id="pp_generar_envoltura" class="d-inline-block"></span>');
    if (!habilitado && motivo) {
      nueva.className = 'd-inline-block sgtl-envoltura-deshabilitado';
      nueva.tabIndex = 0;
      nueva.setAttribute('data-bs-toggle', 'tooltip');
      nueva.title = motivo;
      // El motivo ya nombra la acción (§1.4): el lector de pantalla dice lo mismo que el globito.
      nueva.setAttribute('aria-label', motivo);
    }
    if (vieja.hasAttribute('hidden')) nueva.setAttribute('hidden', '');
    if (window.SGTL) SGTL.ocultarTooltips();
    vieja.replaceWith(nueva);
    nueva.appendChild(gen);
  }

  function botonPdf(visible) {
    var pdf = $id('btnPdfForm');
    if (pdf) pdf.style.display = visible ? '' : 'none';
  }

  // ---------------------------------------------------------------- Paso 2: elegir el Excel

  function activar(clienteId, info) {
    estado.activo = true;
    estado.clienteId = clienteId;
    estado.plataforma = info.Plataforma;
    estado.puedeLeer = !!info.PuedeLeer;
    estado.archivo = null; estado.filas = null; estado.base64 = null; estado.numero = null; estado.control = null;
    modoPlataforma(true);
    plegarCliente(false);
    pasos(2);
    ficha();
    plegarCondiciones(true);
    renderNuevo();
    if (estado.puedeLeer) cargarGuia(clienteId);
    // Elegir el Excel ya guarda el borrador: en este paso sobra "Guardar borrador", y el estado del título aparece
    // cuando el borrador existe (paso 3).
    ocultar($id('btnGuardarBorrador'));
    ocultar($id('badgeEstadoModal'));
    botonGenerar(false, 'No se puede generar la proforma: falta elegir el Excel de ' + nombrePlataforma());
    botonPdf(false);
    window.proformaConCambios = false;
  }

  function desactivar() {
    estado = nuevoEstado();
    var bloque = $id('bloquePlataforma');
    if (bloque) { bloque.innerHTML = ''; delete bloque.dataset.sinCambios; }
    if ($id('bloqueConceptos')) modoPlataforma(false);
    var gen = $id('btnGenerar');
    if (gen) { gen.disabled = false; gen.removeAttribute('title'); gen.classList.add('btn-success'); gen.classList.remove('btn-secondary'); }
    botonPdf(true);
    if (window.SGTL) SGTL.ocultarTooltips();
  }

  function renderNuevo() {
    var p = esc(nombrePlataforma());
    var bloque = $id('bloquePlataforma');
    // Elegir el Excel lo guarda solo: no cuenta como cambio sin guardar (sí los datos del cliente y las condiciones).
    bloque.dataset.sinCambios = 'true';
    // Un solo texto de ayuda en la zona; de dónde se exporta queda en el ícono de información (§4.3).
    bloque.innerHTML =
      (estado.puedeLeer ? '' : '<div class="alert alert-light-danger color-danger">Todavía no se pueden leer archivos de ' + p + '.</div>') +
      '<div class="mt-4">' +
      '<div class="form-label d-flex align-items-center gap-1">Excel de ' + p + ' <span class="text-danger">*</span>' +
      SGTL.botonInfo('info', 'Se exporta en ' + p + ' desde Proceso → detalle de la proforma → ícono de Excel.', 'Ver de dónde se exporta el Excel') + '</div>' +
      '<div class="sgtl-zona-archivo" id="pp_zona">' +
      '<span class="sgtl-zona-icono"><i class="bi bi-file-earmark-spreadsheet" aria-hidden="true"></i></span>' +
      '<div class="sgtl-zona-texto"><div class="fw-bold">Arrastralo acá o elegilo</div>' +
      '<div class="small text-muted">Al elegirlo se guarda como borrador y se controla contra los viajes de SGTL.</div></div>' +
      '<button type="button" class="btn btn-primary" id="pp_elegir"' + (estado.puedeLeer ? '' : ' disabled') + '>' +
      '<i class="bi bi-upload me-1" aria-hidden="true"></i>Elegir archivo</button>' +
      '<input type="file" id="pp_archivo" class="d-none" accept=".xlsx" aria-label="Excel de ' + p + '">' +
      '<div id="pp_archivo_estado" class="w-100"></div>' +
      '</div>' +
      '<div id="pp_guia" class="mt-2"></div>' +
      '</div>';

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
      caja.innerHTML = '<div class="small text-muted"><i class="bi bi-truck me-1" aria-hidden="true"></i>No hay viajes sin proforma con el ' + esc(r.Dato) + ' cargado.</div>';
      return;
    }
    var conFaltantes = viajes.filter(function (v) { return v.Faltan; }).length;
    // Lo que le falta al viaje para pasar a Listo para facturar (los números obligatorios de la plataforma) va en el
    // ícono de información junto a su estado (§4.3), como en Gestionar viajes.
    var falta = function (v) {
      if (!v.Faltan) return '';
      var varios = v.Faltan.indexOf(',') !== -1;
      return SGTL.botonInfo('urgente', 'Le falta: ' + esc(v.Faltan) + '. Sin ' + (varios ? 'esos números' : 'ese número') + ' no pasa a Listo para facturar.',
        'Ver qué le falta al viaje #' + v.ViajeID);
    };
    var filas = viajes.map(function (v) {
      return '<tr>' +
        '<td>' + esc(v.Referencia) + '</td>' +
        '<td class="text-center text-nowrap">' + fecha(v.Fecha) + '</td>' +
        '<td>' + esc(v.Origen) + ' → ' + esc(v.Destino) + '</td>' +
        '<td class="text-center text-nowrap">' + SGTL.conInfo(SGTL.estado(String(v.Estado || '').replace(/_/g, ' ')), falta(v)) + '</td>' +
        '<td class="text-center">' + botonViaje(v.ViajeID) + '</td>' +
        '</tr>';
    }).join('');
    caja.innerHTML =
      '<details>' +
      '<summary class="small">' + plural(viajes.length, 'viaje', 'viajes') + ' sin proforma para tildar en ' + p +
      (conFaltantes ? ' <span class="badge rounded-pill estado-amarillo ms-1">' + plural(conFaltantes, 'con números faltantes', 'con números faltantes') + '</span>' : '') + '</summary>' +
      '<div class="table-responsive mt-2"><table class="table table-sm table-striped table-hover sgtl-tabla-compacta mb-0"><thead><tr>' +
      '<th>' + esc(r.Dato.charAt(0).toUpperCase() + r.Dato.slice(1)) + '</th><th class="text-center">Fecha</th><th class="sgtl-col-texto">Ruta</th><th class="text-center">Estado</th><th class="text-center">Acciones</th>' +
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
      info.innerHTML = '<div class="small"><i class="bi bi-file-earmark-check me-1 text-success" aria-hidden="true"></i>' + esc(archivo.name) +
        ' · ' + plural(datos.length, 'transporte', 'transportes') + ' · Total ' + esc(nombrePlataforma()) + ' ' + pesos(total) + '</div>';
      if (estado.numero) { importar(); return; }
      info.innerHTML +=
        '<div class="row mt-2"><div class="col-md-6">' +
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
    Coincide: 'Coincide', Importe_distinto: 'Importe distinto', Sin_viaje: 'Sin viaje relacionado', Repetido_en_SGTL: 'N° repetido en SGTL',
    Ya_facturado: 'Ya facturado', En_otra_proforma: 'En otra proforma', Faltan_numeros: 'Faltan números', Sin_tarifa: 'Sin tarifa',
    Viaje_cancelado: 'Viaje cancelado',
    Repetido_en_archivo: 'Repetido en el Excel', Dato_invalido: 'Dato mal en el Excel'
  };

  // Grupos de la tabla, según quién resuelve cada diferencia, con el color de etiqueta del design system (§4.1):
  // rojo lo que está mal en SGTL, amarillo lo que falta gestionar, azul lo que está en curso, verde lo resuelto.
  function grupos() {
    var p = esc(nombrePlataforma());
    return [
      { clave: 'SGTL', color: 'rojo', titulo: 'Para corregir en SGTL', ayuda: 'Corregí el viaje y volvé a controlar.' },
      { clave: 'Revisar', color: 'amarillo', titulo: 'Para revisar', ayuda: 'Corregí el viaje o reclamalo.' },
      { clave: 'Plataforma', color: 'amarillo', titulo: 'Para reclamar a ' + p, ayuda: 'Registrá el reclamo.' },
      { clave: 'Esperando', color: 'azul', titulo: 'Esperando a ' + p, ayuda: 'Cuando ' + p + ' lo corrija, reemplazá el Excel.' },
      { clave: 'Coincide', color: 'verde', titulo: 'Coinciden' }
    ];
  }
  function grupoDe(l) { return l.Coincide ? 'Coincide' : (l.Reclamada ? 'Esperando' : (l.Responsable || 'Revisar')); }

  // Con el armado de los botones de la fila (§1.4, .sgtl-acciones): cuadrado de 32 px con el ícono centrado.
  function botonViaje(viajeId) {
    if (!viajeId) return '';
    var texto = 'Abrir viaje #' + viajeId;
    return '<span class="sgtl-acciones"><a class="btn btn-sm btn-outline-primary pp-abrir-viaje" href="gestion-viajes.html?viaje=' + encodeURIComponent(viajeId) + '" target="_blank" rel="noopener"' +
      ' data-bs-toggle="tooltip" title="' + esc(texto) + '" aria-label="' + esc(texto) + '"><i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a></span>';
  }

  // Qué pasa con la línea, en un solo renglón y concreto (pedido de Rocío, 22/10): el título del grupo ya dice de
  // quién es; acá va lo que hay que mirar ("Falta el remito", "Repetido en el Excel (filas 6 y 14)"). El texto completo
  // queda en el globito.
  var PROBLEMAS_EXCEL = [
    [/^falta el N° de transporte/, 'sin N° de transporte'], [/^el N° de transporte/, 'N° de transporte no válido'],
    [/^la fecha/, 'fecha no válida'], [/^falta el importe/, 'sin importe'], [/^el importe/, 'importe no válido'],
    [/^los adicionales/, 'adicionales no válidos']
  ];
  function mayuscula(texto) { return texto.charAt(0).toUpperCase() + texto.slice(1); }
  function textoResultado(l) {
    var d = l.Detalle || '', m;
    switch (l.Resultado) {
      case 'Faltan_numeros':
        m = /le falta: (.*?)\.?$/.exec(d);
        if (!m) return 'Faltan números';
        var faltan = m[1].split(', ').map(function (numero) { return 'el ' + numero; });
        return (faltan.length === 1 ? 'Falta ' : 'Faltan ') +
          (faltan.length === 1 ? faltan[0] : faltan.slice(0, -1).join(', ') + ' y ' + faltan[faltan.length - 1]);
      case 'Repetido_en_SGTL':
        m = /: (#[^.]*)/.exec(d);
        return 'N° repetido en SGTL' + (m ? ' (' + m[1] + ')' : '');
      case 'Repetido_en_archivo':
        m = /\(filas ([^)]*)\)/.exec(d);
        return 'Repetido en el Excel' + (m ? ' (filas ' + m[1] + ')' : '');
      case 'Dato_invalido':
        m = /^Fila (\d+) del Excel: (.*?)\.?$/.exec(d);
        if (!m) return RESULTADOS.Dato_invalido;
        var problemas = m[2].split(', ').map(function (texto) {
          var regla = PROBLEMAS_EXCEL.filter(function (r) { return r[0].test(texto); })[0];
          return regla ? regla[1] : texto;
        });
        return mayuscula(problemas.join(', ')) + ' (fila ' + m[1] + ')';
      default:
        return RESULTADOS[l.Resultado] || l.Resultado || '';
    }
  }

  // Lo que sirve del texto de la tarifa que arma la API (ProformasController.ImporteViaje).
  function textoTarifa(texto) {
    // La API escribe "$850"; el sistema muestra los montos con espacio ("$ 850", §7.3).
    var t = String(texto || '').trim().replace(/\$\s?(?=\d)/g, '$ '), m;
    if (/^Tarifa por km/i.test(t)) { var partes = t.split(' · '); return partes[partes.length - 1]; }
    if (/^Tarifa fija/i.test(t)) return 'tarifa fija de la ruta';
    m = /^Presupuesto (#\d+) · /.exec(t);
    if (m) return 'importe del presupuesto ' + m[1];
    return t.charAt(0).toLowerCase() + t.slice(1);
  }

  function filaLinea(l, oculta) {
    // En texto y en un renglón, sin etiqueta de color: el color de cada problema está una sola vez, en el título de
    // su grupo (pedido de Rocío, 22/10). Las que coinciden, en gris.
    var resultado = l.Coincide ? '<span class="text-muted">Coincide</span>'
      : '<span' + (l.Detalle ? ' tabindex="0" data-bs-toggle="tooltip" title="' + esc(l.Detalle) + '"' : '') + '>' + esc(textoResultado(l)) + '</span>';
    // De dónde sale el importe de SGTL, solo donde sirve para decidir (cuando no coincide), en gris debajo del importe
    // y sin ícono (pedido de Rocío, 22/10): "602,8 km × $ 850", "tarifa fija de la ruta", "importe del presupuesto #12".
    var tarifa = l.TarifaUsada && l.Resultado === 'Importe_distinto'
      ? '<div class="small text-muted">' + esc(textoTarifa(l.TarifaUsada)) + '</div>'
      : '';
    var accion = l.ViajeID ? botonViaje(l.ViajeID)
      : (l.Resultado === 'Sin_viaje'
        ? '<span class="sgtl-acciones"><a class="btn btn-sm btn-outline-primary pp-abrir-viaje" href="gestion-viajes.html" target="_blank" rel="noopener" data-bs-toggle="tooltip" title="Ir a Gestionar viajes para registrarlo" aria-label="Ir a Gestionar viajes para registrarlo"><i class="bi bi-truck" aria-hidden="true"></i></a></span>'
        : '');
    return '<tr' + (oculta ? ' class="pp-coincide d-none"' : (l.Coincide ? ' class="pp-coincide"' : '')) + '>' +
      '<td class="text-nowrap">' + esc(l.Referencia) + '</td>' +
      '<td class="text-center text-nowrap">' + fecha(l.Fecha) + '</td>' +
      '<td>' + esc(l.Ruta || '') + '</td>' +
      '<td class="text-end text-nowrap">' + pesos(l.ImporteViaje) + '</td>' +
      '<td class="text-end text-nowrap">' + (l.ImporteSgtl != null ? pesos(l.ImporteSgtl) : '—') + tarifa + '</td>' +
      '<td class="text-end text-nowrap">' + (l.Diferencia ? pesos(l.Diferencia) : '') + '</td>' +
      '<td class="text-end text-nowrap">' + (l.Adicionales ? pesos(l.Adicionales) : '') + '</td>' +
      '<td class="sgtl-col-resultado">' + resultado + '</td>' +
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
      var ayuda = g.ayuda && !estado.soloLectura && c.Estado === 'Borrador' ? g.ayuda : '';
      // El reclamo, donde está lo reclamado (pedido de Rocío, 22/10): "Reclamado el …" y "Ver reclamo", que abre su panel.
      if (g.clave === 'Esperando' && c.ReclamoFecha) {
        ayuda = 'Reclamado el ' + fecha(c.ReclamoFecha) + (ayuda ? ': ' + ayuda.charAt(0).toLowerCase() + ayuda.slice(1) : '.') +
          ' <button type="button" class="btn btn-link p-0 align-baseline sgtl-grupo-enlace" data-panel="pp_panel_reclamo" aria-expanded="false">Ver reclamo</button>';
      }
      // Qué hacer, al lado del título del grupo y con la letra del texto (pedido de Rocío, 22/10): a la derecha y en
      // gris se perdía.
      return '<tbody><tr class="sgtl-grupo" id="pp_grupo_' + g.clave + '"><th colspan="9"><div class="d-flex flex-wrap align-items-center gap-2">' +
        '<span>' + titulo + '</span>' +
        (ayuda ? '<span class="sgtl-grupo-ayuda">' + ayuda + '</span>' : '') +
        '</div></th></tr>' +
        del.map(function (l) { return filaLinea(l, g.clave === 'Coincide' && plegadas); }).join('') + '</tbody>';
    }).join('');
    return '<div class="sgtl-tabla-tarjeta mb-3"><div class="table-responsive"><table class="table table-striped table-hover align-middle sgtl-tabla-control"><thead><tr>' +
      '<th>Transporte</th><th class="text-center">Fecha</th><th class="sgtl-col-ruta">Ruta</th><th class="text-end">Importe ' + p + '</th><th class="text-end">Importe SGTL</th>' +
      '<th class="text-end">Diferencia</th><th class="text-end">Adicionales</th><th class="sgtl-col-resultado">Resultado</th><th class="text-center">Acciones</th>' +
      '</tr></thead>' + cuerpo + '</table></div></div>';
  }

  // Una línea arriba de la tabla (pedido de Rocío, 22/10): cuántas diferencias hay de cada grupo, en texto con un punto
  // de su color (el color fuerte queda en el título de cada grupo de la tabla); cada una lleva a su grupo. Lo que
  // coincide no va en el mismo renglón; los viajes que no vinieron en esta tanda no se avisan acá (la guía del paso 2
  // los muestra antes de tildar en Rukas). A la derecha, "Registrar reclamo" si hay diferencias sin reclamar.
  function itemResumen(contenido, atributos, color) {
    return '<button type="button" class="sgtl-resumen-item"' + (atributos || '') + '>' +
      (color ? '<span class="sgtl-info-punto ' + color + '" aria-hidden="true"></span>' : '') + '<span>' + contenido + '</span></button>';
  }

  function barraControl(c, editable) {
    var lineas = c.Lineas || [];
    var partes = [];
    if (!c.Diferencias && c.Cantidad) {
      var todas = c.Cantidad === 1 ? 'el transporte coincide' : 'los ' + c.Cantidad + ' transportes coinciden';
      partes.push(itemResumen(editable ? '<strong>Lista para generar</strong>: ' + todas : '<strong>' + todas.charAt(0).toUpperCase() + todas.slice(1) + '</strong>',
        ' data-grupo="Coincide"', 'verde'));
    } else {
      partes.push('<strong>' + plural(c.Diferencias, 'diferencia', 'diferencias') + '</strong>');
      grupos().forEach(function (g) {
        if (g.clave === 'Coincide') return;
        var n = lineas.filter(function (l) { return grupoDe(l) === g.clave; }).length;
        if (n) partes.push(itemResumen(esc(n + ' ' + g.titulo.charAt(0).toLowerCase() + g.titulo.slice(1)), ' data-grupo="' + g.clave + '"', g.color));
      });
    }
    var hayReclamadas = lineas.some(function (l) { return grupoDe(l) === 'Esperando'; });
    if (c.ReclamoFecha && !hayReclamadas) {
      partes.push(itemResumen('<i class="bi bi-chat-left-text me-1" aria-hidden="true"></i>Reclamo del ' + fecha(c.ReclamoFecha),
        ' data-panel="pp_panel_reclamo" aria-expanded="false"'));
    }
    // "Volver a controlar" y "Reemplazar Excel" van en la franja del archivo, arriba (datosControl).
    var acciones = editable && c.Diferencias > 0 && !c.ReclamoFecha
      ? '<button type="button" class="btn btn-sm btn-outline-primary" id="pp_reclamo"><i class="bi bi-megaphone me-1" aria-hidden="true"></i>Registrar reclamo</button>'
      : '';
    // Las acciones quedan a la derecha del primer renglón; si el resumen es largo, se parte en su lugar.
    return '<div class="d-flex flex-wrap flex-md-nowrap align-items-start gap-2 mb-3">' +
      '<div class="sgtl-resumen flex-grow-1">' + partes.join('') + '</div>' +
      (acciones ? '<div class="d-flex gap-2 flex-shrink-0">' + acciones + '</div>' : '') + '</div>';
  }

  // Paneles que abren las etiquetas del reclamo y de los avisos: el texto largo queda a un clic.
  function panelesControl(c, editable) {
    var p = esc(nombrePlataforma());
    var reclamo = !c.ReclamoFecha ? '' :
      '<div id="pp_panel_reclamo" class="d-none alert alert-warning mb-3">' +
      '<div class="d-flex flex-wrap align-items-start gap-2"><div class="me-auto" style="white-space: pre-line">' +
      '<span class="fw-bold">Reclamo en ' + p + ' del ' + fecha(c.ReclamoFecha) + '.</span> ' + esc(c.ReclamoMotivo || '') + '</div>' +
      (editable ? '<div class="d-flex gap-2"><button type="button" class="btn btn-sm btn-outline-secondary" id="pp_reclamo"><i class="bi bi-pencil me-1" aria-hidden="true"></i>Editar reclamo</button>' +
        '<button type="button" class="btn btn-sm btn-outline-secondary" id="pp_cerrar_reclamo"><i class="bi bi-x-circle me-1" aria-hidden="true"></i>Cerrar reclamo</button></div>' : '') +
      '</div></div>';
    return reclamo;
  }

  // Arriba de la tabla (pedido de Rocío, 22/10), en el orden de los pasos: los datos del cliente en su fila compacta,
  // en el recuadro gris de lo que no se cambia (§6.3); después el Excel, en la misma franja con la que se eligió
  // (nombre, transportes, período y cuándo se importó, con "Reemplazar Excel" en un borrador).
  function datosControl(c, editable) {
    var p = esc(nombrePlataforma());
    var detalle = [plural(c.Cantidad || 0, 'transporte', 'transportes'),
      c.FechaDesde ? 'período ' + fecha(c.FechaDesde) + (c.FechaHasta ? ' al ' + fecha(c.FechaHasta) : '') : '',
      c.FechaArchivo ? 'importado el ' + fecha(c.FechaArchivo, { hora: true }) : ''].filter(Boolean).join(' · ');
    return '<div class="sgtl-dato-fijo mb-2" id="pp_cliente_datos">' + datosCliente(editable) + '</div>' +
      '<div class="sgtl-zona-archivo cargada mb-3">' +
      '<span class="sgtl-zona-icono"><i class="bi bi-file-earmark-spreadsheet" aria-hidden="true"></i></span>' +
      '<div class="sgtl-zona-texto"><div class="fw-bold">' + esc(c.NombreArchivo || 'Excel de ' + nombrePlataforma()) + '</div>' +
      '<div class="small text-muted">' + esc(detalle) + '</div></div>' +
      // Lo que se hace con el Excel: volver a compararlo con los viajes (después de corregir uno) o reemplazarlo.
      (editable ? '<div class="d-flex flex-wrap gap-2">' +
        '<button type="button" class="btn btn-outline-primary" id="pp_controlar"><i class="bi bi-arrow-repeat me-1" aria-hidden="true"></i>Volver a controlar</button>' +
        '<button type="button" class="btn btn-outline-primary" id="pp_reemplazar"><i class="bi bi-file-earmark-arrow-up me-1" aria-hidden="true"></i>Reemplazar Excel</button>' +
        '<input type="file" id="pp_reemplazo" accept=".xlsx" class="d-none" aria-label="Excel corregido de ' + p + '"></div>' : '') +
      '</div>';
  }

  // Por qué todavía no se puede generar (va en el globito de "Generar proforma").
  function motivoGenerar(c) {
    if (c.Diferencias) return 'No se puede generar la proforma: ' + (c.Diferencias === 1 ? 'hay una diferencia sin resolver' : 'hay ' + c.Diferencias + ' diferencias sin resolver');
    if (!c.Cantidad) return 'No se puede generar la proforma: el Excel no tiene transportes';
    return '';
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
    if (titulo) titulo.textContent = (editable ? 'Editar proforma ' : 'Ver proforma ') +
      (c.Numero ? c.Numero + ' · ' : 'de ') + nombrePlataforma() + ' ' + (c.NumeroPlataforma || '');
    if ($id('p_id')) $id('p_id').value = c.Proforma_ID;
    // Los datos de la cabecera se guardan al importar; el borrador se maneja desde este bloque.
    if (typeof window.setModoLectura === 'function') window.setModoLectura(true);
    $id('btnCerrarProforma').textContent = 'Cerrar';
    // Lo que el paso 2 escondió: el borrador ya existe.
    mostrarOculto($id('btnGuardarBorrador'));
    mostrarOculto($id('badgeEstadoModal'));
    if (editable) habilitarCondiciones();
    // Lo que se escribe en este bloque (reclamo, reemplazo) se guarda con sus botones: no cuenta como cambio sin guardar.
    $id('bloquePlataforma').dataset.sinCambios = 'true';
    mostrarBotonesPie(true);
    $id('btnGenerar').style.display = editable ? '' : 'none';
    botonGenerar(!!c.PuedeGenerar, editable ? motivoGenerar(c) : '');
    // Sin "Generar" (solo lectura o ya generada) el span que lo envuelve tampoco ocupa lugar en el pie.
    if ($id('pp_generar_envoltura')) $id('pp_generar_envoltura').classList.toggle('d-none', !editable);
    botonPdf(true);
    // setVal (gestion-facturacion.html) también actualiza la fecha que se ve en el calendario (DD/MM/AAAA).
    if (c.FechaDesde && $id('p_fdesde')) window.setVal('p_fdesde', String(c.FechaDesde).substring(0, 10));
    if (c.FechaHasta && $id('p_fhasta')) window.setVal('p_fhasta', String(c.FechaHasta).substring(0, 10));
    plegarCliente(true);
    pasos(esBorrador ? 3 : 0);
    resumirCondiciones();

    $id('bloquePlataforma').innerHTML =
      datosControl(c, editable) +
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
    Array.prototype.forEach.call(bloque.querySelectorAll('.sgtl-resumen-item, [data-panel]'), function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.panel) {
          var panel = $id(b.dataset.panel);
          if (!panel) return;
          var abrir = panel.classList.contains('d-none');
          panel.classList.toggle('d-none', !abrir);
          b.setAttribute('aria-expanded', String(abrir));
          if (abrir) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
      // El reclamo lo manda la empresa: "nuestros viajes", sin escribir su nombre (sale de Gestionar empresa, 23/10).
      case 'Sin_viaje': return 'Transporte ' + l.Referencia + ': no corresponde a ninguno de nuestros viajes.';
      case 'Ya_facturado': return 'Transporte ' + l.Referencia + ': ya se facturó en otra proforma.';
      case 'En_otra_proforma': return 'Transporte ' + l.Referencia + ': ya está en otra proforma.';
      case 'Viaje_cancelado': return 'Transporte ' + l.Referencia + ': ese viaje se canceló, no se hizo.';
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

  // Junto al estado de un borrador de plataforma: qué falta y de quién depende, en el ícono de información que abre
  // un globito (§4.3, pedido de Rocío del 22/10): rojo si falta resolver algo, naranja si se espera a la plataforma y
  // verde si está lista para generar. Adentro, las mismas líneas y colores que los grupos del control.
  function avisosListado(x) {
    if (x.Tipo_Proforma !== 'Plataforma' || x.Estado !== 'Borrador' || !window.SGTL) return '';
    var p = x.Plataforma || 'la plataforma';
    var lineas = [];
    var poner = function (color, texto) {
      lineas.push('<div class="sgtl-info-linea"><span class="sgtl-info-punto ' + color + '"></span><span>' + esc(texto) + '</span></div>');
    };
    if (x.PlataformaPorCorregir) poner('rojo', 'Corregir en SGTL · ' + x.PlataformaPorCorregir);
    if (x.PlataformaPorRevisar) poner('amarillo', 'Revisar · ' + x.PlataformaPorRevisar);
    if (x.PlataformaPorReclamar) poner('amarillo', 'Reclamar a ' + p + ' · ' + x.PlataformaPorReclamar);
    var porResolver = lineas.length;
    if (x.PlataformaEsperando || x.ReclamoFecha) {
      poner('azul', 'Esperando a ' + p + (x.PlataformaEsperando ? ' · ' + x.PlataformaEsperando : '') +
        (x.ReclamoFecha ? ' desde el ' + fecha(x.ReclamoFecha) : ''));
    }
    if (porResolver) {
      return SGTL.botonInfo('urgente', '<div class="fw-bold mb-2">Falta resolver antes de generar</div>' + lineas.join('') +
        '<div class="suave mt-2">Abrí la proforma para ver cuáles.</div>', 'Ver qué falta resolver');
    }
    if (lineas.length) {
      var reclamo = (x.PlataformaEsperando ? plural(x.PlataformaEsperando, 'transporte reclamado', 'transportes reclamados') : 'Reclamo enviado') +
        (x.ReclamoFecha ? ' el ' + fecha(x.ReclamoFecha) : '') + '.';
      return SGTL.botonInfo('espera', '<div class="fw-bold mb-1">Esperando a ' + esc(p) + '</div><div>' + esc(reclamo) + '</div>' +
        '<div class="suave mt-2">Cuando ' + esc(p) + ' corrija el Excel, reemplazalo en la proforma.</div>', 'Ver qué se espera de ' + p);
    }
    if (x.PlataformaLineas) {
      return SGTL.botonInfo('listo', '<div class="fw-bold mb-1">Lista para generar</div><div>' +
        esc(x.PlataformaLineas === 1 ? 'El transporte del Excel coincide' : 'Los ' + x.PlataformaLineas + ' transportes del Excel coinciden') +
        ' con los viajes de SGTL.</div>',
        'Ver por qué está lista para generar');
    }
    return '';
  }

  window.ProformaPlataforma = {
    etiquetaListado: etiquetaListado,
    avisosListado: avisosListado,
    activo: function () { return estado.activo; },
    reiniciar: desactivar,
    // Al elegir el cliente: si trabaja con plataforma, el modal pasa a los pasos con el Excel.
    // Después de editar el cliente desde la proforma (o cuando llegan la localidad y la provincia): los datos nuevos
    // debajo del campo (paso 2) o en el recuadro de arriba de la tabla (paso 3).
    refrescarCliente: function () {
      if (!estado.activo) return;
      if (!estado.control) { ficha(); return; }
      var caja = $id('pp_cliente_datos');
      if (caja) caja.innerHTML = datosCliente(estado.control.Estado === 'Borrador' && !estado.soloLectura);
    },
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
