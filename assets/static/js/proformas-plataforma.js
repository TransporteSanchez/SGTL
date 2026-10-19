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
    if (gen) { gen.disabled = false; gen.removeAttribute('title'); gen.classList.add('btn-success'); gen.classList.remove('btn-secondary'); }
  }

  function actualizarGenerar() {
    var gen = $id('btnGenerar');
    if (!gen || !estado.activo) return;
    gen.disabled = true;
    gen.classList.remove('btn-success');
    gen.classList.add('btn-secondary');
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
    $id('pp_numero').addEventListener('input', function () { this.dataset.automatico = 'false'; });
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
        // El N° sale del nombre del archivo; si se cambia de archivo, se reemplaza (salvo que la persona lo haya escrito a mano).
        var m = /PROFORMA\s*NRO\.?\s*(\d+)/i.exec(archivo.name);
        var campo = $id('pp_numero');
        if (m && (!campo.value || campo.dataset.automatico === 'true')) { campo.value = m[1]; campo.dataset.automatico = 'true'; }
      } catch (e) {
        errorEnModal('No se pudo leer el archivo. Revisá que sea el Excel exportado de ' + esc(nombrePlataforma()) + '.');
      }
    };
    lectorBuffer.readAsArrayBuffer(archivo);

    var lectorBase64 = new FileReader();
    lectorBase64.onload = function () { estado.base64 = String(lectorBase64.result).split(',')[1] || null; };
    lectorBase64.readAsDataURL(archivo);
  }

  // Lee un .xlsx y devuelve { filas, base64 } (para "Reemplazar Excel").
  function leerExcel(archivo) {
    return new Promise(function (resolver, rechazar) {
      if (!archivo || !/\.xlsx$/i.test(archivo.name)) { rechazar(new Error('Elegí un archivo .xlsx.')); return; }
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

  function postJson(url, cuerpo) {
    return pedir(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
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
    var gen = $id('btnGenerar');
    gen.style.display = esBorrador ? '' : 'none';
    gen.disabled = !c.PuedeGenerar;
    // Deshabilitado no tiene que parecer habilitado (verde con opacidad).
    gen.classList.toggle('btn-success', !!c.PuedeGenerar);
    gen.classList.toggle('btn-secondary', !c.PuedeGenerar);
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
      : 'Todo coincide con ' + nombrePlataforma() + '. Ya podés generar la proforma.');

    $id('bloquePlataforma').innerHTML =
      '<div class="bloque-titulo">Excel de ' + p + '</div>' +
      '<div class="mb-2"><span class="text-muted">Archivo:</span> ' + esc(c.NombreArchivo || '') +
      (c.FechaArchivo && window.SGTL ? ' <span class="text-muted">· importado el ' + SGTL.fecha(c.FechaArchivo, { hora: true }) + '</span>' : '') +
      ' <span class="text-muted">· N° en ' + p + ':</span> ' + esc(c.NumeroPlataforma || '') +
      (esBorrador ? ' <button type="button" class="btn btn-sm btn-light-secondary ms-2" id="pp_reemplazar">Reemplazar Excel</button>' +
        '<input type="file" id="pp_reemplazo" accept=".xlsx" class="d-none">' : '') + '</div>' +
      (c.ReclamoFecha
        ? '<div class="alert alert-light-warning color-warning py-2 d-flex flex-wrap align-items-center gap-2">' +
          '<span><strong>Reclamo en ' + p + '</strong> desde el ' + (window.SGTL ? SGTL.fecha(c.ReclamoFecha) : '') + ': ' + esc(c.ReclamoMotivo || '') + '</span>' +
          (esBorrador ? '<button type="button" class="btn btn-sm btn-light-secondary ms-auto" id="pp_cerrar_reclamo">Cerrar reclamo</button>' : '') + '</div>'
        : '') +
      '<div class="d-flex flex-wrap align-items-center gap-2 mb-2"><span>' + resumen + '</span>' +
      (esBorrador ? '<button type="button" class="btn btn-sm btn-light-secondary" id="pp_controlar">Volver a controlar</button>' : '') +
      (esBorrador && c.Diferencias && !c.ReclamoFecha ? '<button type="button" class="btn btn-sm btn-light-secondary" id="pp_reclamo">Registrar reclamo</button>' : '') +
      '</div>' +
      '<div id="pp_form_reclamo" class="d-none border rounded p-2 mb-2">' +
      '<div class="fw-bold mb-2">Registrar reclamo</div><div class="row g-2">' +
      '<div class="col-md-3"><label for="pp_reclamo_fecha" class="form-label">Fecha <span class="text-danger">*</span></label><input type="date" id="pp_reclamo_fecha" class="form-control"></div>' +
      '<div class="col-md-9"><label for="pp_reclamo_motivo" class="form-label">Motivo <span class="text-danger">*</span></label><textarea id="pp_reclamo_motivo" class="form-control" rows="2" maxlength="500"></textarea>' +
      '<div class="invalid-feedback">Completá el motivo.</div></div></div>' +
      '<div class="mt-2 text-end"><button type="button" class="btn btn-sm btn-light-secondary" id="pp_reclamo_cancelar">Cancelar</button> ' +
      '<button type="button" class="btn btn-sm btn-primary" id="pp_reclamo_guardar">Guardar</button></div></div>' +
      '<div id="pp_confirmar_generar" class="d-none alert alert-light-primary color-primary">' +
      '<div class="fw-bold">¿Generar la proforma de ' + p + ' ' + esc(c.NumeroPlataforma || '') + '?</div>' +
      '<div class="mb-2">Se le asigna número y queda aceptada, lista para facturar.</div>' +
      '<button type="button" class="btn btn-sm btn-light-secondary" id="pp_generar_cancelar">Cancelar</button> ' +
      '<button type="button" class="btn btn-sm btn-success" id="pp_generar_confirmar">Generar</button></div>' +
      (motivo ? '<div class="small mb-2 ' + (c.Diferencias ? 'text-danger' : 'text-muted') + '">' + motivo + '</div>' : '') +
      (c.Avisos || []).map(function (a) { return '<div class="alert alert-light-warning color-warning py-2">' + esc(a) + '</div>'; }).join('') +
      '<div class="table-responsive"><table class="table table-sm table-bordered align-middle"><thead class="table-light"><tr>' +
      '<th>Transporte</th><th>Fecha</th><th>Ruta</th><th class="text-end">Importe ' + p + '</th><th class="text-end">Importe SGTL</th>' +
      '<th class="text-end">Diferencia</th><th class="text-end">Adicionales</th><th>Tarifa usada</th><th>Resultado</th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table></div>';

    var btn = $id('pp_controlar');
    if (btn) btn.addEventListener('click', function () { volverAControlar(c.Proforma_ID); });
    enlazarAcciones(c);

    // Totales del modal con lo de la plataforma (netos + IVA 21 %).
    var iva = Math.round(c.TotalPlataforma * 21) / 100;
    var formato = function (v) { return window.SGTL ? SGTL.monto(v) : String(v); };
    if ($id('t_subtotal')) $id('t_subtotal').textContent = formato(c.TotalPlataforma);
    if ($id('t_desc')) $id('t_desc').textContent = formato(0);
    if ($id('t_neto')) $id('t_neto').textContent = formato(c.TotalPlataforma);
    if ($id('t_iva')) $id('t_iva').textContent = formato(iva);
    if ($id('t_total')) $id('t_total').textContent = formato(c.TotalPlataforma + iva);
  }

  function enlazarAcciones(c) {
    var reemplazar = $id('pp_reemplazar'), archivo = $id('pp_reemplazo');
    if (reemplazar && archivo) {
      reemplazar.addEventListener('click', function () { archivo.click(); });
      archivo.addEventListener('change', function () { reemplazarArchivo(c, this.files && this.files[0]); });
    }
    var abrirReclamo = $id('pp_reclamo');
    if (abrirReclamo) abrirReclamo.addEventListener('click', function () {
      $id('pp_form_reclamo').classList.remove('d-none');
      $id('pp_reclamo_fecha').value = new Date().toISOString().substring(0, 10);
      $id('pp_reclamo_motivo').focus();
    });
    var cancelar = $id('pp_reclamo_cancelar');
    if (cancelar) cancelar.addEventListener('click', function () { $id('pp_form_reclamo').classList.add('d-none'); });
    var guardarReclamo = $id('pp_reclamo_guardar');
    if (guardarReclamo) guardarReclamo.addEventListener('click', function () { registrarReclamo(c.Proforma_ID); });
    var cerrarReclamo = $id('pp_cerrar_reclamo');
    if (cerrarReclamo) cerrarReclamo.addEventListener('click', function () {
      var listo = SGTL.procesando('#pp_cerrar_reclamo');
      postJson(API + '/' + c.Proforma_ID + '/Reclamo/Cerrar', { Usuario: usuarioActual() })
        .then(function (r) { mostrarControl(r); SGTL.toastExito('Reclamo cerrado.'); refrescarListado(); },
          function (e) { listo(); SGTL.toastError($('<div>').html(textoError(e, 'No se pudo cerrar el reclamo.')).text()); });
    });
    var genCancelar = $id('pp_generar_cancelar');
    if (genCancelar) genCancelar.addEventListener('click', function () { $id('pp_confirmar_generar').classList.add('d-none'); });
    var genConfirmar = $id('pp_generar_confirmar');
    if (genConfirmar) genConfirmar.addEventListener('click', function () { confirmarGenerar(c.Proforma_ID); });
  }

  function refrescarListado() {
    if (typeof window.buscarProformas === 'function' && window.profState) window.buscarProformas(window.profState.page);
  }

  function reemplazarArchivo(c, archivo) {
    limpiarError();
    if (!archivo) return;
    var listo = SGTL.procesando('#pp_reemplazar', 'Reemplazando…');
    leerExcel(archivo).then(function (leido) {
      var m = /PROFORMA\s*NRO\.?\s*(\d+)/i.exec(archivo.name);
      return postJson(API + '/' + c.Proforma_ID + '/ReemplazarArchivo', {
        NumeroPlataforma: m ? m[1] : c.NumeroPlataforma, NombreArchivo: archivo.name, ContentType: archivo.type,
        ArchivoBase64: leido.base64, Filas: leido.filas, Usuario: usuarioActual()
      });
    }).then(function (r) {
      mostrarControl(r);
      SGTL.toastExito('Excel reemplazado.');
      refrescarListado();
    }, function (e) {
      listo();
      errorEnModal(e.datos ? textoError(e, 'No se pudo reemplazar el Excel.') : esc(e.message));
    });
  }

  function registrarReclamo(id) {
    var motivo = $id('pp_reclamo_motivo');
    var texto = (motivo.value || '').trim();
    motivo.classList.toggle('is-invalid', !texto);
    if (!texto) { motivo.focus(); return; }
    var listo = SGTL.procesando('#pp_reclamo_guardar');
    postJson(API + '/' + id + '/Reclamo', { Fecha: $id('pp_reclamo_fecha').value || null, Motivo: texto, Usuario: usuarioActual() })
      .then(function (r) { mostrarControl(r); SGTL.toastExito('Reclamo registrado.'); refrescarListado(); },
        function (e) { listo(); errorEnModal(textoError(e, 'No se pudo registrar el reclamo.')); });
  }

  function pedirConfirmacionGenerar() {
    var caja = $id('pp_confirmar_generar');
    if (!caja) return;
    caja.classList.remove('d-none');
    caja.scrollIntoView({ block: 'center' });
  }

  function confirmarGenerar(id) {
    limpiarError();
    var listo = SGTL.procesando('#pp_generar_confirmar');
    postJson(API + '/' + id + '/Generar', { Usuario: usuarioActual() })
      .then(function (r) {
        window.proformaConCambios = false;
        refrescarListado();
        if (typeof window.cerrarProformaYMostrarMensaje === 'function') window.cerrarProformaYMostrarMensaje('Proforma generada: ' + r.Numero + '.', 'success');
        else { SGTL.toastExito('Proforma generada: ' + r.Numero + '.'); $('#modalProforma').modal('hide'); }
      }, function (e) {
        listo();
        if (e.datos && e.datos.control) mostrarControl(e.datos.control);
        errorEnModal(textoError(e, 'No se pudo generar la proforma.'));
      });
  }

  function volverAControlar(id) {
    var listo = SGTL.procesando('#pp_controlar');
    pedir(API + '/' + id + '/Controlar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Usuario: usuarioActual() }) })
      // listo() antes de redibujar: devuelve Cerrar y la cruz y saca la marca de "procesando" del modal.
      .then(function (c) { listo(); mostrarControl(c); SGTL.toastExito('Control actualizado.'); },
        function (e) { listo(); SGTL.toastError($('<div>').html(textoError(e, 'No se pudo volver a controlar.')).text()); });
  }

  // ---------------------------------------------------------------- Enganches con el modal de Facu

  function etiquetaListado(x) {
    if (x.Tipo_Proforma !== 'Plataforma') return '';
    return ' <span class="badge bg-light-secondary color-secondary">' + esc((x.Plataforma || 'Plataforma') + ' ' + (x.Plataforma_Numero || '')) + '</span>';
  }
  function reclamoListado(x) {
    if (!x.ReclamoFecha) return '';
    var texto = 'Reclamo pendiente en ' + (x.Plataforma || 'la plataforma') + ' desde el ' + (window.SGTL ? SGTL.fecha(x.ReclamoFecha) : '');
    return ' <i class="bi bi-exclamation-circle text-warning" data-bs-toggle="tooltip" data-bs-placement="top" title="' + esc(texto) + '" aria-label="' + esc(texto) + '"></i>';
  }

  window.ProformaPlataforma = {
    etiquetaListado: etiquetaListado,
    reclamoListado: reclamoListado,
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
    generar: function () {
      if (!estado.control || !estado.control.PuedeGenerar) { SGTL.toastError('Para generar, primero guardá el borrador y corregí las diferencias.'); return; }
      pedirConfirmacionGenerar();
    }
  };
})();
