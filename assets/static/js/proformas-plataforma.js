// Proforma de plataforma (hoy Rukas) dentro del modal de proforma de gestion-facturacion.html.
// El modal es el mismo de siempre: con un cliente "Con plataforma", el bloque "Detalle de conceptos"
// se reemplaza por el del archivo de la plataforma (elegir Excel, control línea por línea, avisos).
// Diseño: docs/diseno/proforma-rukas-diseno.md §4. API: api/ProformasPlataforma.
// Necesita jQuery, SheetJS (window.XLSX) y sgtl-ui.js (window.SGTL).
(function () {
  'use strict';

  var API = 'http://localhost:50222/api/ProformasPlataforma';
  var estado = { activo: false, clienteId: null, plataforma: null, archivo: null, filas: null, base64: null, control: null };

  function $id(id) { return document.getElementById(id); }
  function esc(v) { return window.SGTL ? SGTL.escapar(v) : String(v == null ? '' : v); }
  function pesos(v) { return window.SGTL ? SGTL.monto(v, { sinDecimales: true }) : String(v); }
  function usuarioActual() { return localStorage.getItem('username') || 'sistema'; }
  function nombrePlataforma() { return estado.plataforma || 'la plataforma'; }

  function errorEnModal(texto) {
    var aviso = $id('alertaCompletaCampos');
    aviso.innerHTML = texto;
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
  function textoError(e, porDefecto) {
    var d = (e && e.datos) || {};
    if (Array.isArray(d.errores) && d.errores.length) return d.errores.map(esc).join('<br>');
    return esc(d.error || porDefecto);
  }

  // ---------------------------------------------------------------- Modo del modal

  function mostrarBloques(plataforma) {
    $id('bloqueConceptos').classList.toggle('d-none', plataforma);
    $id('bloquePlataforma').classList.toggle('d-none', !plataforma);
    $('#p_otros').prop('readonly', plataforma);
  }

  function activar(clienteId, info) {
    estado.activo = true;
    estado.clienteId = clienteId;
    estado.plataforma = info.Plataforma;
    mostrarBloques(true);
    renderNuevo(info.PuedeLeer);
    actualizarGenerar();
  }

  function desactivar() {
    estado = { activo: false, clienteId: null, plataforma: null, archivo: null, filas: null, base64: null, control: null };
    var bloque = $id('bloquePlataforma');
    if (bloque) bloque.innerHTML = '';
    if ($id('bloqueConceptos')) mostrarBloques(false);
    var gen = $id('btnGenerar');
    if (gen) { gen.disabled = false; gen.removeAttribute('title'); }
  }

  function actualizarGenerar() {
    var gen = $id('btnGenerar');
    if (!gen || !estado.activo) return;
    gen.disabled = true;
  }

  // ---------------------------------------------------------------- Proforma nueva: elegir el Excel

  function renderNuevo(puedeLeer) {
    var p = esc(nombrePlataforma());
    $id('bloquePlataforma').innerHTML =
      '<div class="bloque-titulo">Excel de ' + p + '</div>' +
      (puedeLeer ? '' : '<div class="alert alert-light-danger color-danger">Todavía no se pueden leer archivos de ' + p + '.</div>') +
      '<div class="row g-2 align-items-end">' +
      '<div class="col-md-6"><label for="pp_archivo" class="form-label">Excel de ' + p + ' <span class="text-danger">*</span></label>' +
      '<input type="file" id="pp_archivo" class="form-control" accept=".xlsx"' + (puedeLeer ? '' : ' disabled') + '>' +
      '<div class="form-text">Exportalo en ' + p + ' desde Proceso → detalle de la proforma → ícono de Excel.</div></div>' +
      '<div class="col-md-3"><label for="pp_numero" class="form-label">N° de proforma en ' + p + ' <span class="text-danger">*</span></label>' +
      '<input id="pp_numero" class="form-control" maxlength="30">' +
      '<div class="form-text">Sale del nombre del archivo; corregilo si hace falta.</div></div>' +
      '</div>' +
      '<div id="pp_previa" class="mt-2 text-muted"></div>' +
      '<div class="form-text mt-2">Al guardar el borrador se importa el archivo y se controla contra los viajes de SGTL.</div>';
    $id('pp_archivo').addEventListener('change', function () { leerArchivo(this.files && this.files[0]); });
  }

  function importeTexto(t) {
    t = String(t || '').replace(/ARS|\$|\s/g, '');
    if (/^\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, '');
    var n = Number(t);
    return isFinite(n) ? n : 0;
  }

  function leerArchivo(archivo) {
    estado.archivo = null; estado.filas = null; estado.base64 = null;
    $id('pp_previa').textContent = '';
    limpiarError();
    if (!archivo) return;
    if (!/\.xlsx$/i.test(archivo.name)) { errorEnModal('Elegí un archivo .xlsx.'); return; }
    if (archivo.size > 5 * 1024 * 1024) { errorEnModal('El archivo tiene que pesar como máximo 5 MB.'); return; }

    var lectorBuffer = new FileReader();
    lectorBuffer.onload = function () {
      try {
        var libro = XLSX.read(new Uint8Array(lectorBuffer.result), { type: 'array' });
        var hoja = libro.Sheets[libro.SheetNames[0]];
        var filas = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: false, defval: '' })
          .map(function (f) { return f.map(function (c) { return c == null ? '' : String(c); }); });
        estado.archivo = archivo;
        estado.filas = filas;
        var datos = filas.slice(1).filter(function (f) { return f.some(function (c) { return String(c).trim() !== ''; }); });
        var total = datos.reduce(function (s, f) { return s + importeTexto(f[4]) + importeTexto(f[5]); }, 0);
        $id('pp_previa').textContent = datos.length + (datos.length === 1 ? ' transporte' : ' transportes') + ' · Total ' + nombrePlataforma() + ' ' + pesos(total);
        var m = /PROFORMA\s*NRO\.?\s*(\d+)/i.exec(archivo.name);
        if (m && !$id('pp_numero').value) $id('pp_numero').value = m[1];
      } catch (e) {
        errorEnModal('No se pudo leer el archivo. Revisá que sea el Excel exportado de ' + esc(nombrePlataforma()) + '.');
      }
    };
    lectorBuffer.readAsArrayBuffer(archivo);

    var lectorBase64 = new FileReader();
    lectorBase64.onload = function () { estado.base64 = String(lectorBase64.result).split(',')[1] || null; };
    lectorBase64.readAsDataURL(archivo);
  }

  // "Guardar borrador" con un cliente con plataforma: importa el archivo y crea el borrador.
  function guardar(dto) {
    limpiarError();
    if (estado.control) { SGTL.toastExito('El borrador ya está guardado.'); return; }
    if (!estado.archivo || !estado.filas || !estado.base64) { errorEnModal('Elegí el Excel de ' + esc(nombrePlataforma()) + '.'); return; }
    var numero = ($id('pp_numero').value || '').trim();
    if (!numero) { errorEnModal('Completá el N° de proforma en ' + esc(nombrePlataforma()) + '.'); return; }

    var cuerpo = {
      ClienteID: estado.clienteId, NumeroPlataforma: numero, NombreArchivo: estado.archivo.name,
      ContentType: estado.archivo.type, ArchivoBase64: estado.base64, Filas: estado.filas, Usuario: usuarioActual(),
      Moneda: dto.Moneda, FechaEmision: dto.FechaEmision, FechaVencimiento: dto.FechaVencimiento,
      Cli_RazonSocial: dto.Cli_RazonSocial, Cli_NombreComercial: dto.Cli_NombreComercial, Cli_CUIT: dto.Cli_CUIT,
      Cli_Direccion: dto.Cli_Direccion, Cli_Telefono: dto.Cli_Telefono,
      FormaPago: dto.FormaPago, PlazoPago: dto.PlazoPago, Validez: dto.Validez, TiempoServicio: dto.TiempoServicio,
      ObsComerciales: dto.ObsComerciales, CondParticulares: dto.CondParticulares
    };
    var listo = SGTL.procesando('#btnGuardarBorrador', 'Importando…');
    pedir(API + '/Importar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
      .then(function (control) {
        listo();
        window.proformaConCambios = false;
        mostrarControl(control);
        SGTL.toastExito('Borrador guardado.');
        if (typeof window.buscarProformas === 'function' && window.profState) window.buscarProformas(window.profState.page);
      }, function (e) {
        listo();
        errorEnModal(textoError(e, 'No se pudo importar el archivo. Probá de nuevo.'));
      });
  }

  // ---------------------------------------------------------------- Borrador importado: control

  function abrir(id) {
    estado.activo = true;
    mostrarBloques(true);
    $id('bloquePlataforma').innerHTML = '<div class="text-muted">Cargando…</div>';
    pedir(API + '/' + id).then(mostrarControl, function (e) {
      $id('bloquePlataforma').innerHTML = '<div class="alert alert-light-danger color-danger">' + textoError(e, 'No se pudo abrir la proforma.') + '</div>';
    });
  }

  var RESULTADOS = {
    Coincide: 'Coincide', Importe_distinto: 'Importe distinto', Sin_viaje: 'Sin viaje', Repetido_en_SGTL: 'Repetido en SGTL',
    Ya_facturado: 'Ya facturado', En_otra_proforma: 'En otra proforma', Faltan_numeros: 'Faltan números', Sin_tarifa: 'Sin tarifa'
  };

  function mostrarControl(c) {
    estado.activo = true;
    estado.control = c;
    estado.plataforma = c.Plataforma || estado.plataforma;
    var p = esc(nombrePlataforma());
    var esBorrador = c.Estado === 'Borrador';

    var titulo = $id('tituloModal');
    if (titulo) titulo.textContent = 'Proforma de ' + nombrePlataforma() + ' ' + (c.NumeroPlataforma || '');
    if ($id('p_id')) $id('p_id').value = c.Proforma_ID;
    // Los datos de la cabecera se guardan al importar; el borrador se maneja desde este bloque.
    if (typeof window.setModoLectura === 'function') window.setModoLectura(true);
    $id('btnCerrarProforma').textContent = 'Cerrar';
    $id('btnGenerar').style.display = esBorrador ? '' : 'none';
    $id('btnGenerar').disabled = true;
    if (c.FechaDesde && $id('p_fdesde')) $id('p_fdesde').value = String(c.FechaDesde).substring(0, 10);
    if (c.FechaHasta && $id('p_fhasta')) $id('p_fhasta').value = String(c.FechaHasta).substring(0, 10);

    var filas = (c.Lineas || []).map(function (l) {
      var badge = l.Coincide ? 'bg-light-success color-success' : 'bg-light-danger color-danger';
      var accion = l.ViajeID
        ? ' <a href="gestion-viajes.html?viaje=' + l.ViajeID + '" target="_blank" rel="noopener">Abrir viaje #' + l.ViajeID + '</a>'
        : '';
      return '<tr>' +
        '<td>' + esc(l.Referencia) + '</td>' +
        '<td>' + (l.Fecha && window.SGTL ? SGTL.fecha(l.Fecha) : '') + '</td>' +
        '<td>' + esc(l.Ruta || '') + '</td>' +
        '<td class="text-end">' + pesos(l.ImporteViaje) + '</td>' +
        '<td class="text-end">' + (l.ImporteSgtl != null ? pesos(l.ImporteSgtl) : '—') + '</td>' +
        '<td class="text-end">' + (l.Diferencia ? pesos(l.Diferencia) : '') + '</td>' +
        '<td class="text-end">' + (l.Adicionales ? pesos(l.Adicionales) : '') + '</td>' +
        '<td class="small">' + esc(l.TarifaUsada || '') + '</td>' +
        '<td><span class="badge ' + badge + '">' + esc(RESULTADOS[l.Resultado] || l.Resultado || '') + '</span>' +
        (l.Detalle ? '<div class="small text-muted mt-1">' + esc(l.Detalle) + accion + '</div>' : '') + '</td>' +
        '</tr>';
    }).join('');

    var resumen = c.Cantidad + (c.Cantidad === 1 ? ' transporte' : ' transportes') + ' · ' + c.Coinciden + ' coinciden' +
      (c.Diferencias ? ' · <strong>' + c.Diferencias + ' con diferencias</strong>' : '');
    var motivo = !esBorrador ? '' : (c.Diferencias
      ? 'Para generar, corregí ' + (c.Diferencias === 1 ? 'la diferencia' : 'las ' + c.Diferencias + ' diferencias') + '.'
      : 'Todo coincide con SGTL. (Generar se suma en la etapa 3.)');

    $id('bloquePlataforma').innerHTML =
      '<div class="bloque-titulo">Excel de ' + p + '</div>' +
      '<div class="mb-2"><span class="text-muted">Archivo:</span> ' + esc(c.NombreArchivo || '') +
      (c.FechaArchivo && window.SGTL ? ' <span class="text-muted">· importado el ' + SGTL.fecha(c.FechaArchivo, { hora: true }) + '</span>' : '') +
      ' <span class="text-muted">· N° en ' + p + ':</span> ' + esc(c.NumeroPlataforma || '') + '</div>' +
      '<div class="d-flex flex-wrap align-items-center gap-2 mb-2"><span>' + resumen + '</span>' +
      (esBorrador ? '<button type="button" class="btn btn-sm btn-light-secondary" id="pp_controlar">Volver a controlar</button>' : '') +
      '</div>' +
      (motivo ? '<div class="small mb-2 ' + (c.Diferencias ? 'text-danger' : 'text-muted') + '">' + motivo + '</div>' : '') +
      (c.Avisos || []).map(function (a) { return '<div class="alert alert-light-warning color-warning py-2">' + esc(a) + '</div>'; }).join('') +
      '<div class="table-responsive"><table class="table table-sm table-bordered align-middle"><thead class="table-light"><tr>' +
      '<th>Transporte</th><th>Fecha</th><th>Ruta</th><th class="text-end">Importe ' + p + '</th><th class="text-end">Importe SGTL</th>' +
      '<th class="text-end">Diferencia</th><th class="text-end">Adicionales</th><th>Tarifa usada</th><th>Resultado</th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table></div>';

    var btn = $id('pp_controlar');
    if (btn) btn.addEventListener('click', function () { volverAControlar(c.Proforma_ID); });

    // Totales del modal con lo de la plataforma (netos + IVA 21 %).
    var iva = Math.round(c.TotalPlataforma * 21) / 100;
    var formato = function (v) { return window.SGTL ? SGTL.monto(v) : String(v); };
    if ($id('t_subtotal')) $id('t_subtotal').textContent = formato(c.TotalPlataforma);
    if ($id('t_desc')) $id('t_desc').textContent = formato(0);
    if ($id('t_neto')) $id('t_neto').textContent = formato(c.TotalPlataforma);
    if ($id('t_iva')) $id('t_iva').textContent = formato(iva);
    if ($id('t_total')) $id('t_total').textContent = formato(c.TotalPlataforma + iva);
  }

  function volverAControlar(id) {
    var listo = SGTL.procesando('#pp_controlar');
    pedir(API + '/' + id + '/Controlar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Usuario: usuarioActual() }) })
      .then(function (c) { mostrarControl(c); SGTL.toastExito('Control actualizado.'); },
        function (e) { listo(); SGTL.toastError($('<div>').html(textoError(e, 'No se pudo volver a controlar.')).text()); });
  }

  // ---------------------------------------------------------------- Enganches con el modal de Facu

  window.ProformaPlataforma = {
    activo: function () { return estado.activo; },
    reiniciar: desactivar,
    // Al elegir el cliente: si trabaja con plataforma, el modal pide el archivo en vez de "Traer viajes".
    alCambiarCliente: function (clienteId, cliente) {
      if (!clienteId || !cliente || cliente.Tipo_Cliente !== 'Con_plataforma') { if (estado.activo) desactivar(); return; }
      pedir(API + '/Cliente/' + clienteId).then(function (info) {
        if (info.ConPlataforma) activar(parseInt(clienteId, 10), info); else desactivar();
      }, function () { desactivar(); });
    },
    guardar: guardar,
    abrir: abrir,
    generar: function () { SGTL.toastError('Generar la proforma de ' + nombrePlataforma() + ' se suma en la etapa 3.'); }
  };
})();
