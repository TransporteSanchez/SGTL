// Funciones de interfaz compartidas del design system de SGTL (window.SGTL).
// Las reglas están en docs/design-system/03-decisiones.md; los números de sección (§) son de ese documento.
// Va después de jQuery y de assets/compiled/js/app.js, junto con assets/static/css/sgtl.css.
// La plantilla registra los componentes de Bootstrap en jQuery ($().modal, $().tooltip) pero no
// define window.bootstrap (F5), así que acá se usa jQuery y window.bootstrap solo si existe.
(function () {
  'use strict';

  if (window.SGTL) return;

  function escapar(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizar(texto) {
    return String(texto == null ? '' : texto).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/_/g, ' ').trim();
  }

  function elemento(objetivo) {
    if (!objetivo) return null;
    if (typeof objetivo === 'string') return document.querySelector(objetivo);
    if (objetivo.jquery) return objetivo.get(0) || null;
    return objetivo;
  }

  // ---------------------------------------------------------------- Bootstrap

  function componente(nombre, el, accion, opciones) {
    if (window.jQuery && window.jQuery.fn && window.jQuery.fn[nombre]) {
      return window.jQuery(el)[nombre](accion === undefined ? opciones : accion);
    }
    var clase = window.bootstrap && window.bootstrap[nombre.charAt(0).toUpperCase() + nombre.slice(1)];
    if (!clase) return null;
    var instancia = clase.getOrCreateInstance(el, opciones);
    if (accion && typeof instancia[accion] === 'function') instancia[accion]();
    return instancia;
  }

  function modal(objetivo, accion) {
    var el = elemento(objetivo);
    if (el) componente('modal', el, accion || 'show');
  }

  // Mientras un modal está procesando (§8) no se cierra: ni con la cruz, ni con Escape, ni con Cancelar.
  document.addEventListener('hide.bs.modal', function (evento) {
    if (evento.target && evento.target.dataset && evento.target.dataset.sgtlProcesando === 'true') {
      evento.preventDefault();
    }
  });

  // ---------------------------------------------------------------- Tooltips (§1.5)

  // Los globos se ocultan con Bootstrap: si se borran a mano, el botón no vuelve a mostrar el suyo.
  // A mano solo se borran los que quedaron sin botón (filas que se redibujaron).
  function borrarGlobosSueltos() {
    Array.prototype.forEach.call(document.querySelectorAll('.tooltip'), function (globo) {
      if (globo.id && document.querySelector('[aria-describedby="' + globo.id + '"]')) return;
      if (globo.parentNode) globo.parentNode.removeChild(globo);
    });
  }

  function ocultarTooltips() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-sgtl-tooltip="true"]'), function (el) {
      componente('tooltip', el, 'hide');
    });
    setTimeout(borrarGlobosSueltos, 400);
  }

  function iniciarTooltip(el) {
    if (el.dataset.sgtlTooltip === 'true') return;
    el.dataset.sgtlTooltip = 'true';
    componente('tooltip', el, undefined, { trigger: 'hover focus', container: 'body' });
    componente('tooltip', el, 'show');
  }

  ['mouseover', 'focusin'].forEach(function (tipo) {
    document.addEventListener(tipo, function (evento) {
      var el = evento.target && evento.target.closest ? evento.target.closest('[data-bs-toggle="tooltip"]') : null;
      if (el) iniciarTooltip(el);
    });
  });

  document.addEventListener('click', function (evento) {
    if (evento.target && evento.target.closest && evento.target.closest('[data-bs-toggle="tooltip"]')) {
      ocultarTooltips();
    }
  });

  document.addEventListener('show.bs.modal', ocultarTooltips);

  // ---------------------------------------------------------------- Avisos (§5.1)

  function contenedorToasts() {
    var contenedor = document.getElementById('sgtl-toasts');
    if (!contenedor) {
      contenedor = document.createElement('div');
      contenedor.id = 'sgtl-toasts';
      contenedor.className = 'sgtl-toasts';
      contenedor.setAttribute('aria-live', 'polite');
      document.body.appendChild(contenedor);
    }
    return contenedor;
  }

  function cerrarToast(toast) {
    toast.classList.remove('visible');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  }

  function toast(tipo, mensaje) {
    var aviso = document.createElement('div');
    aviso.className = 'sgtl-toast sgtl-toast-' + tipo;
    aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    aviso.innerHTML = '<div class="sgtl-toast-texto"></div>' +
      '<button type="button" class="btn-close btn-close-white" aria-label="Cerrar"></button>';
    aviso.querySelector('.sgtl-toast-texto').textContent = mensaje;
    aviso.querySelector('.btn-close').addEventListener('click', function () { cerrarToast(aviso); });
    contenedorToasts().appendChild(aviso);
    requestAnimationFrame(function () { aviso.classList.add('visible'); });
    if (tipo === 'exito') setTimeout(function () { cerrarToast(aviso); }, 4000);
    return aviso;
  }

  // Mensaje para el usuario a partir de un error de $.ajax o fetch. Solo se muestra el texto de la
  // API cuando rechaza un dato (400 o 409): los demás errores traen detalles técnicos (§9).
  function mensajeError(xhr, porDefecto) {
    if (xhr && xhr.status === 401) {
      setTimeout(function () { window.location.href = 'Login.html'; }, 2500);
      return 'Tu sesión venció. Volvé a iniciar sesión.';
    }
    if (xhr && (xhr.status === 400 || xhr.status === 409)) {
      var datos = xhr.responseJSON || {};
      var texto = datos.mensaje || datos.Mensaje || datos.Message || datos.message;
      if (typeof texto === 'string' && texto.trim()) return texto.trim();
    }
    return porDefecto;
  }

  // $.ajax como promesa. Si falla, el error trae xhr y mensajeUsuario (el de mensajeError).
  function ajax(opciones, porDefecto) {
    return new Promise(function (resolver, rechazar) {
      window.jQuery.ajax(opciones).done(function (datos) { resolver(datos); }).fail(function (xhr) {
        var error = new Error('Error ' + xhr.status + ' en ' + opciones.url);
        error.xhr = xhr;
        error.mensajeUsuario = mensajeError(xhr, porDefecto || 'Ocurrió un error. Probá de nuevo.');
        rechazar(error);
      });
    });
  }

  // ---------------------------------------------------------------- Guardando (§8)

  function gerundio(verbo) {
    var palabra = String(verbo || '').trim().split(/\s+/)[0];
    if (/ar$/i.test(palabra)) return palabra.slice(0, -2) + 'ando…';
    if (/(er|ir)$/i.test(palabra)) return palabra.slice(0, -2) + 'iendo…';
    return 'Procesando…';
  }

  // Deshabilita el botón con una ruedita y el verbo en gerundio. Si está en un modal, también
  // bloquea Cancelar y la cruz. Devuelve la función que deja todo como estaba.
  function procesando(objetivo, texto) {
    var boton = elemento(objetivo);
    if (!boton) return function () { };
    var htmlOriginal = boton.innerHTML;
    var estabaDeshabilitado = boton.disabled;
    var ventana = boton.closest('.modal');
    var cierres = ventana ? Array.prototype.filter.call(
      ventana.querySelectorAll('[data-bs-dismiss="modal"]'), function (b) { return !b.disabled; }) : [];
    var soloIcono = !boton.textContent.trim();

    boton.disabled = true;
    boton.innerHTML = soloIcono
      ? '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>'
      : '<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>' +
        escapar(texto || gerundio(boton.textContent));
    cierres.forEach(function (b) { b.disabled = true; });
    if (ventana) ventana.dataset.sgtlProcesando = 'true';

    return function listo() {
      boton.innerHTML = htmlOriginal;
      boton.disabled = estabaDeshabilitado;
      cierres.forEach(function (b) { b.disabled = false; });
      if (ventana) ventana.removeAttribute('data-sgtl-procesando');
    };
  }

  // ---------------------------------------------------------------- Confirmación (§5.2)

  var ventanaConfirmar = null;

  function crearVentanaConfirmar() {
    var div = document.createElement('div');
    div.className = 'modal fade';
    div.id = 'sgtlConfirmar';
    div.tabIndex = -1;
    div.setAttribute('aria-labelledby', 'sgtlConfirmarTitulo');
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML =
      '<div class="modal-dialog modal-dialog-centered">' +
      '<div class="modal-content">' +
      '<div class="modal-header">' +
      '<h5 class="modal-title" id="sgtlConfirmarTitulo"></h5>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>' +
      '</div>' +
      '<div class="modal-body">' +
      '<div class="alert alert-light-danger color-danger d-none" role="alert" data-sgtl="error"></div>' +
      '<p class="mb-0" data-sgtl="mensaje"></p>' +
      '<div class="mt-3 d-none" data-sgtl="motivo">' +
      '<label for="sgtlConfirmarMotivo" class="form-label" data-sgtl="motivo-etiqueta"></label>' +
      '<textarea id="sgtlConfirmarMotivo" class="form-control" rows="2"></textarea>' +
      '<div class="invalid-feedback"></div>' +
      '</div>' +
      '</div>' +
      '<div class="modal-footer">' +
      '<button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cancelar</button>' +
      '<button type="button" class="btn" data-sgtl="aceptar"></button>' +
      '</div>' +
      '</div>' +
      '</div>';
    document.body.appendChild(div);
    return div;
  }

  // opciones: titulo ("¿Eliminar el chofer Juan Pérez?"), mensaje ("No se puede deshacer."),
  // verbo ("Eliminar"), peligro (botón rojo), motivo ({ etiqueta, obligatorio }) y accion(motivo):
  // función que hace el trabajo y devuelve una promesa. Si la promesa falla, el error queda dentro
  // del modal (con error.mensajeUsuario, si viene). Devuelve una promesa: true si se hizo, false si se canceló.
  function confirmar(opciones) {
    opciones = opciones || {};
    var div = ventanaConfirmar || (ventanaConfirmar = crearVentanaConfirmar());
    var aceptar = div.querySelector('[data-sgtl="aceptar"]');
    var error = div.querySelector('[data-sgtl="error"]');
    var bloqueMotivo = div.querySelector('[data-sgtl="motivo"]');
    var campoMotivo = div.querySelector('#sgtlConfirmarMotivo');
    var pideMotivo = !!opciones.motivo;
    var motivoObligatorio = pideMotivo && opciones.motivo.obligatorio !== false;

    div.querySelector('#sgtlConfirmarTitulo').textContent = opciones.titulo || '';
    div.querySelector('[data-sgtl="mensaje"]').textContent = opciones.mensaje || '';
    error.classList.add('d-none');
    error.textContent = '';
    aceptar.className = 'btn ' + (opciones.peligro ? 'btn-danger' : 'btn-primary');
    aceptar.textContent = opciones.verbo || 'Aceptar';
    bloqueMotivo.classList.toggle('d-none', !pideMotivo);
    campoMotivo.value = '';
    limpiarError(campoMotivo);
    if (pideMotivo) {
      div.querySelector('[data-sgtl="motivo-etiqueta"]').innerHTML = escapar(opciones.motivo.etiqueta || 'Motivo') +
        (motivoObligatorio ? ' <span class="text-danger">*</span>' : '');
    }

    return new Promise(function (resolver) {
      var hecho = false;

      function alAceptar() {
        var motivo = campoMotivo.value.trim();
        if (motivoObligatorio && !motivo) {
          marcarError(campoMotivo, 'Completá el motivo.');
          campoMotivo.focus();
          return;
        }
        if (typeof opciones.accion !== 'function') {
          hecho = true;
          modal(div, 'hide');
          return;
        }
        error.classList.add('d-none');
        var listo = procesando(aceptar);
        Promise.resolve().then(function () { return opciones.accion(motivo); }).then(function () {
          listo();
          hecho = true;
          modal(div, 'hide');
        }, function (falla) {
          listo();
          error.textContent = (falla && falla.mensajeUsuario) ||
            'No se pudo ' + (opciones.verbo || 'hacer la acción').toLowerCase() + '. Probá de nuevo.';
          error.classList.remove('d-none');
        });
      }

      function alCerrar() {
        aceptar.removeEventListener('click', alAceptar);
        div.removeEventListener('hidden.bs.modal', alCerrar);
        resolver(hecho);
      }

      aceptar.addEventListener('click', alAceptar);
      div.addEventListener('hidden.bs.modal', alCerrar);
      modal(div, 'show');
    });
  }

  // ---------------------------------------------------------------- Estados (§4)

  var COLORES_ESTADO = {
    gris: ['registrado', 'borrador', 'inactivo', 'deshabilitado', 'login', 'logout', 'inicio de sesion', 'cierre de sesion'],
    azul: ['en viaje', 'entregado', 'generada', 'generado', 'update', 'modificacion'],
    amarillo: ['listo para facturar', 'aceptada', 'parcial', 'km manual', 'atrasado', 'sin salir', 'sin cerrar', 'sin proforma', 'sin evidencia', 'por vencer'],
    verde: ['activo', 'habilitado', 'facturado', 'facturada', 'cancelado', 'cancelada', 'aplicado', 'aplicada', 'insert', 'alta'],
    rojo: ['anulada', 'anulado', 'baja', 'delete', 'pendiente', 'rechazo', 'vencida']
  };

  var TEXTOS_ESTADO = {
    'habilitado': 'Activo',
    'deshabilitado': 'Inactivo',
    'login': 'Inicio de sesión',
    'logout': 'Cierre de sesión',
    'insert': 'Alta',
    'update': 'Modificación',
    'delete': 'Baja',
    'km manual': 'Km manual'
  };

  function colorEstado(estado) {
    var clave = normalizar(estado);
    for (var color in COLORES_ESTADO) {
      if (COLORES_ESTADO[color].indexOf(clave) !== -1) return color;
    }
    return 'gris';
  }

  // Etiqueta del estado: <span class="badge rounded-pill estado-verde">Activo</span>.
  function estado(valor, texto) {
    var mostrado = texto || TEXTOS_ESTADO[normalizar(valor)] || valor || '';
    return '<span class="badge rounded-pill estado-' + colorEstado(valor) + '">' + escapar(mostrado) + '</span>';
  }

  // ---------------------------------------------------------------- Acciones de cada fila (§1.4)

  var ACCIONES = {
    ver: { icono: 'bi-eye', clase: 'btn-outline-secondary', texto: 'Ver detalle' },
    editar: { icono: 'bi-pencil', clase: 'btn-outline-primary', texto: 'Editar' },
    pdf: { icono: 'bi-file-earmark-pdf', clase: 'btn-outline-secondary', texto: 'Descargar PDF' },
    enviar: { icono: 'bi-envelope', clase: 'btn-outline-secondary', texto: 'Enviar por e-mail' },
    siguiente: { icono: 'bi-arrow-right-circle', clase: 'btn-outline-success', texto: '' },
    inactivar: { icono: 'bi-toggle-on', clase: 'btn-outline-secondary', texto: 'Inactivar' },
    activar: { icono: 'bi-toggle-off', clase: 'btn-outline-secondary', texto: 'Activar' },
    eliminar: { icono: 'bi-trash', clase: 'btn-outline-danger', texto: 'Eliminar' },
    anular: { icono: 'bi-x-circle', clase: 'btn-outline-danger', texto: 'Anular' }
  };

  // Botón de solo ícono para una fila. opciones: id (va en data-id), datos ({ clave: valor } en data-*),
  // texto e icono (para cambiar los de la acción), deshabilitado y motivo (tooltip del deshabilitado).
  // Las pantallas escuchan los clics con $(tabla).on('click', '[data-accion="editar"]', ...).
  function botonFila(accion, opciones) {
    opciones = opciones || {};
    var base = ACCIONES[accion] || ACCIONES.siguiente;
    var texto = opciones.texto || base.texto;
    var datos = opciones.datos || {};
    if (opciones.id !== undefined) datos.id = opciones.id;
    var atributos = Object.keys(datos).map(function (clave) {
      return ' data-' + clave + '="' + escapar(datos[clave]) + '"';
    }).join('');
    var icono = '<i class="bi ' + (opciones.icono || base.icono) + '" aria-hidden="true"></i>';

    if (opciones.deshabilitado) {
      var motivo = opciones.motivo || texto;
      return '<span class="sgtl-envoltura-deshabilitado" tabindex="0" data-bs-toggle="tooltip" title="' + escapar(motivo) + '">' +
        '<button type="button" class="btn btn-sm ' + base.clase + '" disabled aria-label="' + escapar(motivo) + '">' + icono + '</button></span>';
    }
    return '<button type="button" class="btn btn-sm ' + base.clase + '" data-accion="' + escapar(accion) + '"' + atributos +
      ' data-bs-toggle="tooltip" title="' + escapar(texto) + '" aria-label="' + escapar(texto) + '">' + icono + '</button>';
  }

  function accionesFila(botones) {
    return '<div class="sgtl-acciones">' + botones.join('') + '</div>';
  }

  // ---------------------------------------------------------------- Tablas (§2.2)

  var TEXTOS = {
    sinResultados: 'No hay resultados para los filtros elegidos.',
    cargando: 'Cargando…'
  };

  function filaMensaje(tbody, columnas, texto) {
    var cuerpo = elemento(tbody);
    if (!cuerpo) return;
    ocultarTooltips();
    cuerpo.innerHTML = '<tr><td colspan="' + columnas + '" class="text-center text-muted py-4">' + escapar(texto) + '</td></tr>';
  }

  var tabla = {
    cargando: function (tbody, columnas) { filaMensaje(tbody, columnas, TEXTOS.cargando); },
    vacia: function (tbody, columnas, texto) { filaMensaje(tbody, columnas, texto || TEXTOS.sinResultados); },
    llenar: function (tbody, html) {
      var cuerpo = elemento(tbody);
      if (!cuerpo) return;
      ocultarTooltips();
      cuerpo.innerHTML = html;
    },
    // PaginacionSGTL, que no se muestra cuando no hay resultados.
    paginacion: function (contenedor, opciones) {
      var el = elemento(contenedor);
      if (!el) return;
      var total = Number(opciones && opciones.total) || 0;
      el.style.display = total ? '' : 'none';
      if (total && window.PaginacionSGTL) window.PaginacionSGTL.render(el, opciones);
    }
  };

  // ---------------------------------------------------------------- Fechas y montos (§7)

  function aFecha(valor) {
    if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor;
    if (valor == null || valor === '') return null;
    var texto = String(valor);
    var soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    if (soloFecha) return new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
    var fecha = new Date(texto);
    return isNaN(fecha.getTime()) ? null : fecha;
  }

  function dosCifras(n) { return String(n).padStart(2, '0'); }

  // "05/07/2026", con { hora: true } "05/07/2026 21:29" y con { segundos: true } "05/07/2026 21:29:06".
  // Formatea la hora tal como llega: la zona horaria es otro tema (§2 de docs/PENDIENTES-SISTEMA.md).
  function fecha(valor, opciones) {
    var d = aFecha(valor);
    if (!d) return '';
    opciones = opciones || {};
    var texto = dosCifras(d.getDate()) + '/' + dosCifras(d.getMonth() + 1) + '/' + d.getFullYear();
    if (opciones.hora || opciones.segundos) {
      texto += ' ' + dosCifras(d.getHours()) + ':' + dosCifras(d.getMinutes());
      if (opciones.segundos) texto += ':' + dosCifras(d.getSeconds());
    }
    return texto;
  }

  var formatoMonto = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
  var formatoMontoRedondo = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0, minimumFractionDigits: 0 });
  var formatoKm = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // "$ 1.234,56"; con { sinDecimales: true } "$ 1.235" (indicadores del tablero).
  function monto(valor, opciones) {
    var n = Number(valor);
    if (valor == null || valor === '' || !isFinite(n)) return '';
    return (opciones && opciones.sinDecimales ? formatoMontoRedondo : formatoMonto).format(n);
  }

  function km(valor) {
    var n = Number(valor);
    if (valor == null || valor === '' || !isFinite(n)) return '';
    return formatoKm.format(n);
  }

  // "05/07/2026" escrito a mano → Date, o null si no es una fecha válida.
  function leerFecha(texto) {
    var partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(texto == null ? '' : texto).trim());
    if (!partes) return null;
    var d = new Date(Number(partes[3]), Number(partes[2]) - 1, Number(partes[1]));
    if (d.getDate() !== Number(partes[1]) || d.getMonth() !== Number(partes[2]) - 1) return null;
    return d;
  }

  // Date → "AAAA-MM-DD", lo que espera la API.
  function fechaISO(valor) {
    var d = aFecha(valor);
    if (!d) return '';
    return d.getFullYear() + '-' + dosCifras(d.getMonth() + 1) + '-' + dosCifras(d.getDate());
  }

  // Selector de una fecha para formularios (§7.1): se ve y se escribe DD/MM/AAAA.
  // Para mandar a la API: SGTL.fechaISO(SGTL.leerFecha(input.value)).
  function selectorFecha(objetivo, opciones) {
    var input = elemento(objetivo);
    if (!input || typeof window.flatpickr !== 'function') return null;
    var configuracion = { dateFormat: 'd/m/Y', allowInput: true };
    if (window.flatpickr.l10ns && window.flatpickr.l10ns.es) configuracion.locale = 'es';
    Object.keys(opciones || {}).forEach(function (clave) { configuracion[clave] = opciones[clave]; });
    return window.flatpickr(input, configuracion);
  }

  // Selector de rango "Desde y hasta" para filtros (§7.1). Se ve DD/MM/AAAA y guarda AAAA-MM-DD.
  function rangoFechas(objetivo, opciones) {
    var input = elemento(objetivo);
    if (!input || typeof window.flatpickr !== 'function') return null;
    var configuracion = {
      mode: 'range',
      showMonths: window.innerWidth < 768 ? 1 : 2,
      altInput: true,
      altFormat: 'd/m/Y',
      dateFormat: 'Y-m-d',
      allowInput: true
    };
    if (window.flatpickr.l10ns && window.flatpickr.l10ns.es) configuracion.locale = 'es';
    Object.keys(opciones || {}).forEach(function (clave) { configuracion[clave] = opciones[clave]; });
    return window.flatpickr(input, configuracion);
  }

  // { desde: 'AAAA-MM-DD', hasta: 'AAAA-MM-DD' } del rango elegido, o null si está vacío.
  function valorRango(objetivo) {
    var input = elemento(objetivo);
    var fp = input && input._flatpickr;
    if (!fp || !fp.selectedDates.length) return null;
    var desde = fp.selectedDates[0];
    var hasta = fp.selectedDates[fp.selectedDates.length - 1];
    return { desde: fp.formatDate(desde, 'Y-m-d'), hasta: fp.formatDate(hasta, 'Y-m-d') };
  }

  // ---------------------------------------------------------------- Filtros (§1.3 y §3.3)

  function tieneValor(campo) {
    return String(campo.value == null ? '' : campo.value).trim() !== '';
  }

  // Un solo listener: si cada cruz guarda el suyo, en algunos casos el clic no lo ejecuta.
  if (!document.documentElement.hasAttribute('data-sgtl-filtros')) {
    document.documentElement.setAttribute('data-sgtl-filtros', '1');
    document.addEventListener('click', function (evento) {
      var cruz = evento.target.closest && evento.target.closest('.sgtl-filtro-borrar');
      if (!cruz) return;
      evento.preventDefault();
      var envoltura = cruz.closest('.sgtl-filtro');
      if (!envoltura) return;
      var campo = envoltura.querySelector('input.flatpickr-input, input, select, textarea');
      var fp = campo && campo._flatpickr;
      if (fp) fp.clear();
      else if (campo) campo.value = '';
      envoltura.classList.toggle('con-valor', !!(campo && String(campo.value || '').trim()));
      if (typeof envoltura._sgtlBuscar === 'function') envoltura._sgtlBuscar();
    });
  }

  // Prepara los filtros de una pantalla: Enter busca, y cada campo con valor muestra una cruz que
  // lo vacía (o lo pasa a "Todos") y vuelve a buscar. campos: selectores o elementos; buscar: función.
  function filtros(campos, buscar) {
    var lista = (Array.isArray(campos) ? campos : [campos]).map(elemento).filter(Boolean);

    lista.forEach(function (campo) {
      var fp = campo._flatpickr;
      var visible = fp && fp.altInput ? fp.altInput : campo;
      var envoltura = document.createElement('div');
      envoltura.className = 'sgtl-filtro';
      envoltura._sgtlBuscar = buscar;
      campo.parentNode.insertBefore(envoltura, campo);
      envoltura.appendChild(campo);
      if (visible !== campo) envoltura.appendChild(visible);

      var nombre = '';
      if (campo.id) {
        var etiqueta = document.querySelector('label[for="' + campo.id + '"]');
        nombre = etiqueta ? etiqueta.textContent.trim() : '';
      }
      var cruz = document.createElement('button');
      cruz.type = 'button';
      cruz.className = 'sgtl-filtro-borrar';
      cruz.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
      cruz.setAttribute('aria-label', nombre ? 'Borrar ' + nombre.toLowerCase() : 'Borrar filtro');
      envoltura.appendChild(cruz);

      function actualizar() { envoltura.classList.toggle('con-valor', tieneValor(campo)); }

      ['input', 'change'].forEach(function (tipo) {
        campo.addEventListener(tipo, actualizar);
        if (visible !== campo) visible.addEventListener(tipo, actualizar);
      });
      if (fp && fp.config && Array.isArray(fp.config.onChange)) fp.config.onChange.push(actualizar);

      visible.addEventListener('keydown', function (evento) {
        if (evento.key !== 'Enter') return;
        evento.preventDefault();
        if (fp && fp.config.allowInput && visible.value.trim()) {
          fp.setDate(visible.value, false, fp.config.altFormat);
        }
        if (fp) fp.close();
        actualizar();
        buscar();
      });

      actualizar();
    });

    return {
      // Para cuando una pantalla cambia el valor de un filtro por código.
      actualizar: function () {
        lista.forEach(function (campo) {
          var envoltura = campo.closest('.sgtl-filtro');
          if (envoltura) envoltura.classList.toggle('con-valor', tieneValor(campo));
        });
      }
    };
  }

  // ---------------------------------------------------------------- Formularios (§6.3)

  function feedbackDe(campo) {
    var siguiente = campo.nextElementSibling;
    while (siguiente && !siguiente.classList.contains('invalid-feedback') && !siguiente.classList.contains('form-text')) {
      siguiente = siguiente.nextElementSibling;
    }
    if (siguiente && siguiente.classList.contains('invalid-feedback')) return siguiente;
    var nuevo = document.createElement('div');
    nuevo.className = 'invalid-feedback';
    campo.insertAdjacentElement('afterend', nuevo);
    return nuevo;
  }

  function marcarError(objetivo, mensaje) {
    var campo = elemento(objetivo);
    if (!campo) return;
    campo.classList.add('is-invalid');
    feedbackDe(campo).textContent = mensaje || '';
  }

  function limpiarError(objetivo) {
    var campo = elemento(objetivo);
    if (!campo) return;
    campo.classList.remove('is-invalid');
    var siguiente = campo.nextElementSibling;
    if (siguiente && siguiente.classList.contains('invalid-feedback')) siguiente.textContent = '';
  }

  // Aviso arriba del formulario. Sin texto, lo oculta.
  function avisoFormulario(objetivo, texto) {
    var aviso = elemento(objetivo);
    if (!aviso) return;
    aviso.textContent = texto || '';
    aviso.style.display = texto ? '' : 'none';
    aviso.classList.toggle('d-none', !texto);
  }

  // Después de validar: si hay campos marcados, muestra "Revisá los campos marcados." y lleva el
  // cursor al primero. Devuelve true si el formulario está bien.
  function revisarFormulario(form, aviso) {
    var contenedor = elemento(form);
    var primero = contenedor ? contenedor.querySelector('.is-invalid') : null;
    avisoFormulario(aviso, primero ? 'Revisá los campos marcados.' : '');
    if (primero) primero.focus();
    return !primero;
  }

  function reiniciarFormulario(form, aviso) {
    var contenedor = elemento(form);
    if (!contenedor) return;
    if (typeof contenedor.reset === 'function') contenedor.reset();
    Array.prototype.forEach.call(contenedor.querySelectorAll('.is-invalid, .is-valid'), function (campo) {
      campo.classList.remove('is-invalid', 'is-valid');
    });
    Array.prototype.forEach.call(contenedor.querySelectorAll('.invalid-feedback'), function (div) { div.textContent = ''; });
    avisoFormulario(aviso, '');
  }

  // Validación de un formulario (§6.3). reglas: [{ id (del campo), requerido ('Completá el dominio.'),
  // regex y mensaje, max, soloNumeros, soloLetras, mayusculas (solo letras y números, en mayúscula),
  // validar(valor, campo) → mensaje o '' }]. Cada campo se valida al salir y el rojo se va apenas se
  // corrige. Un error que viene de la API se marca con campo.dataset.errorRemoto.
  function validador(reglas) {
    function campoDe(regla) { return document.getElementById(regla.id); }

    function errorDe(regla) {
      var campo = campoDe(regla);
      if (!campo || campo.disabled) return '';
      var valor = String(campo.value == null ? '' : campo.value).trim();
      if (!valor) return regla.requerido || '';
      if (regla.regex && !regla.regex.test(valor)) return regla.mensaje || '';
      if (typeof regla.validar === 'function') {
        var mensaje = regla.validar(valor, campo);
        if (mensaje) return mensaje;
      }
      return campo.dataset.errorRemoto || '';
    }

    function validar(regla) {
      var campo = campoDe(regla);
      if (!campo) return true;
      var mensaje = errorDe(regla);
      if (mensaje) marcarError(campo, mensaje);
      else limpiarError(campo);
      return !mensaje;
    }

    reglas.forEach(function (regla) {
      var campo = campoDe(regla);
      if (!campo) return;
      if (campo.tagName === 'SELECT') {
        campo.addEventListener('change', function () { validar(regla); });
        return;
      }
      campo.addEventListener('blur', function () {
        if (!campo.value.trim() && !campo.classList.contains('is-invalid')) return;
        validar(regla);
      });
      campo.addEventListener('change', function () {
        if (campo.value.trim() || campo.classList.contains('is-invalid')) validar(regla);
      });
      campo.addEventListener('input', function () {
        if (regla.soloNumeros) campo.value = campo.value.replace(/[^0-9]/g, '');
        if (regla.soloLetras) campo.value = campo.value.replace(/[^A-Za-záéíóúÁÉÍÓÚüÜñÑ\s´]/g, '');
        if (regla.mayusculas) campo.value = campo.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (regla.max && campo.value.length > regla.max) campo.value = campo.value.slice(0, regla.max);
        delete campo.dataset.errorRemoto;
        if (campo.classList.contains('is-invalid') && !errorDe(regla)) limpiarError(campo);
      });
    });

    return {
      // Valida todos los campos; devuelve true si están bien.
      validarTodo: function () {
        var bien = true;
        reglas.forEach(function (regla) { if (!validar(regla)) bien = false; });
        return bien;
      },
      validar: function (id) {
        var regla = reglas.filter(function (r) { return r.id === id; })[0];
        return regla ? validar(regla) : true;
      },
      // Al abrir el formulario: saca los errores que vinieron de la API.
      reiniciar: function () {
        reglas.forEach(function (regla) {
          var campo = campoDe(regla);
          if (campo) delete campo.dataset.errorRemoto;
        });
      }
    };
  }

  // ---------------------------------------------------------------- Exportar (§1.2)

  // Baja un CSV separado por punto y coma, con BOM para que Excel lea bien los acentos.
  function descargarCSV(nombreArchivo, encabezados, filas) {
    function celda(valor) { return '"' + String(valor == null ? '' : valor).replace(/"/g, '""') + '"'; }
    var lineas = [encabezados.map(celda).join(';')].concat(filas.map(function (fila) {
      return fila.map(celda).join(';');
    }));
    var blob = new Blob(['\ufeff' + lineas.join('\n') + '\n'], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  window.SGTL = {
    escapar: escapar,
    modal: modal,
    ocultarTooltips: ocultarTooltips,
    toastExito: function (mensaje) { return toast('exito', mensaje); },
    toastError: function (mensaje) { return toast('error', mensaje); },
    mensajeError: mensajeError,
    ajax: ajax,
    procesando: procesando,
    confirmar: confirmar,
    estado: estado,
    colorEstado: colorEstado,
    botonFila: botonFila,
    accionesFila: accionesFila,
    textos: TEXTOS,
    tabla: tabla,
    fecha: fecha,
    monto: monto,
    km: km,
    rangoFechas: rangoFechas,
    valorRango: valorRango,
    selectorFecha: selectorFecha,
    leerFecha: leerFecha,
    fechaISO: fechaISO,
    validador: validador,
    filtros: filtros,
    marcarError: marcarError,
    limpiarError: limpiarError,
    avisoFormulario: avisoFormulario,
    revisarFormulario: revisarFormulario,
    reiniciarFormulario: reiniciarFormulario,
    descargarCSV: descargarCSV
  };
})();
