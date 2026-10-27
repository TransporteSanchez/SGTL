// "Cargar gasto" de administración (Rocío, 27/10, punto 33 de la §41): un gasto que el chofer no llegó a rendir, desde
// Ver detalle del viaje, con el viaje entregado o listo para facturar (la regla es de la API: Viajes/GastosDelViaje.cs).
// El mismo formulario que el chofer en su hoja de ruta (tipo, importe, litros si es combustible, fecha, detalle y la foto
// o el PDF del ticket; las fotos grandes se achican igual que ahí).
// Uso: SGTLGastoViaje.abrir({ viajeId, resumen, alTerminar(cargado) }). Va después de sgtl-ui.js.
(function (window, document) {
  'use strict';
  if (window.SGTLGastoViaje) return;

  var API = 'http://localhost:50222/api';
  var TIPOS_ARCHIVO = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  var MAX_BYTES = 5 * 1024 * 1024;
  var LADO_FOTO = 1600, CALIDAD_FOTO = 0.82, ACHICAR_DESDE = 1.5 * 1024 * 1024;

  var formulario = null, actual = null, guardado = false;

  function el(id) { return document.getElementById(id); }
  function encabezados() {
    var token = '';
    try { token = localStorage.getItem('token') || ''; } catch (e) { }
    return { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  }

  function crearModal() {
    if (el('modalGastoViaje')) return;
    var nodo = document.createElement('div');
    nodo.innerHTML =
      '<div class="modal fade" id="modalGastoViaje" tabindex="-1" aria-labelledby="gastoViajeTitulo" aria-hidden="true" data-bs-backdrop="static">' +
      '<div class="modal-dialog modal-dialog-centered modal-lg modal-fullscreen-sm-down"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title" id="gastoViajeTitulo">Cargar gasto</h5>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
      '<div class="modal-body">' +
      '<div id="avisoGastoViaje" class="alert alert-light-danger color-danger" style="display: none;" role="alert"></div>' +
      '<form id="formGastoViaje" novalidate>' +
      '<p class="text-muted mb-3" id="gastoViajeResumen"></p>' +
      '<div class="row g-3">' +
      '<div class="col-12 col-md-6"><label for="gastoViajeTipo" class="form-label">Tipo de gasto <span class="text-danger">*</span></label>' +
      '<select id="gastoViajeTipo" class="form-select"><option value="">Seleccioná un tipo</option><option value="Combustible">Combustible</option>' +
      '<option value="Peaje">Peaje</option><option value="Comida">Comida</option><option value="Otro">Otro</option></select>' +
      '<div class="invalid-feedback"></div></div>' +
      '<div class="col-12 col-md-6"><label for="gastoViajeImporte" class="form-label">Importe <span class="text-danger">*</span></label>' +
      '<input type="text" inputmode="decimal" id="gastoViajeImporte" class="form-control" placeholder="85.000,00" autocomplete="off">' +
      '<div class="invalid-feedback"></div></div>' +
      '<div class="col-12 col-md-6 d-none" id="campoGastoViajeLitros"><label for="gastoViajeLitros" class="form-label">Litros <span class="text-danger">*</span></label>' +
      '<input type="text" inputmode="decimal" id="gastoViajeLitros" class="form-control" placeholder="120" autocomplete="off">' +
      '<div class="invalid-feedback"></div></div>' +
      '<div class="col-12 col-md-6"><label for="gastoViajeFecha" class="form-label">Fecha <span class="text-danger">*</span></label>' +
      '<input type="text" id="gastoViajeFecha" class="form-control" placeholder="DD/MM/AAAA" autocomplete="off">' +
      '<div class="invalid-feedback"></div></div>' +
      '<div class="col-12"><label for="gastoViajeDetalle" class="form-label">Detalle</label>' +
      '<input type="text" id="gastoViajeDetalle" class="form-control" placeholder="Peaje de la ruta 9 que no rindió el chofer" autocomplete="off">' +
      '<div class="invalid-feedback"></div></div>' +
      '<div class="col-12"><label for="gastoViajeTicket" class="form-label">Foto o PDF del ticket <span class="text-danger">*</span></label>' +
      '<input type="file" id="gastoViajeTicket" class="form-control" accept="image/*,application/pdf">' +
      '<div class="invalid-feedback"></div><div class="form-text">Las fotos se achican solas; el PDF, hasta 5 MB.</div></div>' +
      '</div></form></div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cancelar</button>' +
      '<button type="button" class="btn btn-primary" id="btnGuardarGastoViaje">Cargar gasto</button></div>' +
      '</div></div></div>';
    document.body.appendChild(nodo.firstChild);

    window.SGTL.selectorFecha('#gastoViajeFecha');
    window.SGTL.enlazarMascaraMonto('#gastoViajeImporte');
    formulario = window.SGTL.validador(reglas());
    el('gastoViajeTipo').addEventListener('change', mostrarLitros);
    el('btnGuardarGastoViaje').addEventListener('click', guardar);
    el('modalGastoViaje').addEventListener('hidden.bs.modal', function () {
      var terminar = actual && actual.alTerminar;
      var cargado = guardado;
      actual = null;
      guardado = false;
      if (terminar) terminar(cargado);
    });
  }

  function numeroLitros(texto) {
    var t = String(texto || '').trim();
    if (!t) return null;
    return /^\d{1,4}([.,]\d{1,2})?$/.test(t) ? Number(t.replace(',', '.')) : NaN;
  }

  function hoyISO() { return window.SGTL.fechaISO(new Date()); }

  // Archivo elegido → tipo (los celulares a veces no lo dicen: se mira la extensión) y si sirve.
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
    if (TIPOS_ARCHIVO.indexOf(tipo) < 0 && !(foto && /heic|heif/.test(tipo))) return 'Tiene que ser una foto (JPG, PNG o WEBP) o un PDF.';
    if (!foto && file.size > MAX_BYTES) return 'El PDF no puede pesar más de 5 MB.';
    return '';
  }

  function reglas() {
    return [
      { id: 'gastoViajeTipo', requerido: 'Seleccioná el tipo de gasto.' },
      {
        id: 'gastoViajeImporte', requerido: 'Completá el importe.',
        validar: function (valor) {
          var centavos = window.SGTL.montoCentavos(valor);
          return centavos == null ? 'Escribí el importe como 85.000,00.' : (centavos <= 0 ? 'Tiene que ser mayor que cero.' : '');
        }
      },
      {
        id: 'gastoViajeLitros',
        get requerido() { return el('gastoViajeTipo').value === 'Combustible' ? 'Completá los litros que se cargaron.' : ''; },
        validar: function (valor) {
          var n = numeroLitros(valor);
          return isNaN(n) ? 'Escribí los litros como 120 o 120,5.' : (n <= 0 ? 'Tienen que ser más de cero.' : '');
        }
      },
      {
        id: 'gastoViajeFecha', requerido: 'Completá la fecha del gasto.',
        validar: function (valor) {
          var fecha = window.SGTL.leerFecha(valor);
          if (!fecha) return 'Escribila como DD/MM/AAAA.';
          return window.SGTL.fechaISO(fecha) > hoyISO() ? 'No puede ser posterior a hoy.' : '';
        }
      },
      { id: 'gastoViajeDetalle', max: 200 },
      {
        id: 'gastoViajeTicket', requerido: 'Elegí la foto o el PDF del ticket.',
        validar: function (valor, campo) { return problemaDelArchivo((campo.files || [])[0]); }
      }
    ];
  }

  function mostrarLitros() {
    var combustible = el('gastoViajeTipo').value === 'Combustible';
    el('campoGastoViajeLitros').classList.toggle('d-none', !combustible);
    if (!combustible) { el('gastoViajeLitros').value = ''; window.SGTL.limpiarError('#gastoViajeLitros'); }
  }

  function leerBase64(blob) {
    return new Promise(function (resolver, rechazar) {
      var lector = new FileReader();
      lector.onload = function () { resolver(String(lector.result).split(',')[1] || ''); };
      lector.onerror = function () { rechazar(lector.error); };
      lector.readAsDataURL(blob);
    });
  }

  // Foto grande (o HEIC del iPhone) → JPG de 1600 px de lado; si el navegador no la puede leer, va tal cual.
  function prepararArchivo(file) {
    var tipo = tipoDeArchivo(file);
    var nombre = file.name || 'ticket';
    var esHeic = /heic|heif/.test(tipo);
    if (!/^image\//.test(tipo) || (!esHeic && file.size <= ACHICAR_DESDE)) return Promise.resolve({ archivo: file, nombre: nombre, tipo: tipo });
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

  function guardar() {
    if (!actual) return;
    var id = actual.viajeId;
    formulario.validarTodo();
    if (!window.SGTL.revisarFormulario('#formGastoViaje', '#avisoGastoViaje')) return;
    var file = (el('gastoViajeTicket').files || [])[0];
    var tipo = el('gastoViajeTipo').value;
    var listo = window.SGTL.procesando('#btnGuardarGastoViaje', 'Cargando…');
    prepararArchivo(file).then(function (p) {
      if (p.archivo.size > MAX_BYTES) {
        var grande = new Error('archivo');
        grande.mensajeUsuario = 'El ticket pesa más de 5 MB. Elegí una foto o un PDF más liviano.';
        throw grande;
      }
      return leerBase64(p.archivo).then(function (b64) {
        return window.fetch(API + '/Costos/Viajes/' + encodeURIComponent(id) + '/Gastos', {
          method: 'POST', headers: encabezados(),
          body: JSON.stringify({
            Tipo: tipo,
            Importe: window.SGTL.montoCentavos(el('gastoViajeImporte').value) / 100,
            Litros: tipo === 'Combustible' ? numeroLitros(el('gastoViajeLitros').value) : null,
            Fecha: window.SGTL.fechaISO(window.SGTL.leerFecha(el('gastoViajeFecha').value)),
            Detalle: el('gastoViajeDetalle').value.trim(),
            Nombre_Archivo: p.nombre, Content_Type: p.tipo, ContenidoBase64: b64
          })
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (datos) {
            if (r.ok) return datos;
            var error = new Error('HTTP ' + r.status);
            error.mensajeUsuario = r.status === 401 ? 'Tu sesión venció. Volvé a iniciar sesión.' : (datos && datos.message) || 'No se pudo cargar el gasto. Probá de nuevo.';
            throw error;
          });
        });
      });
    }).then(function (datos) {
      listo();
      guardado = true;
      window.SGTL.toastExito((datos && datos.Message) || 'Gasto del viaje #' + id + ' cargado.');
      window.SGTL.modal('#modalGastoViaje', 'hide');
    }, function (error) {
      listo();
      window.SGTL.avisoFormulario('#avisoGastoViaje', error.mensajeUsuario || 'No se pudo cargar el gasto. Probá de nuevo.');
    });
  }

  function abrir(opciones) {
    crearModal();
    actual = opciones || {};
    guardado = false;
    window.SGTL.reiniciarFormulario('#formGastoViaje', '#avisoGastoViaje');
    formulario.reiniciar();
    el('gastoViajeTitulo').textContent = 'Cargar gasto del viaje #' + actual.viajeId;
    el('gastoViajeResumen').textContent = actual.resumen || '';
    el('gastoViajeFecha')._flatpickr.setDate(new Date(), false);
    mostrarLitros();
    window.SGTL.modal('#modalGastoViaje', 'show');
  }

  window.SGTLGastoViaje = { abrir: abrir };
})(window, document);
