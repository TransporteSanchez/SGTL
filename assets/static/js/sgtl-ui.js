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

  // Un modal encima de otro (la confirmación pedida desde un modal abierto, §5.2): queda arriba con su
  // propio fondo y, al cerrarse, el de abajo sigue abierto y con scroll (Bootstrap le sacaba modal-open).
  document.addEventListener('show.bs.modal', function (evento) {
    var abiertos = document.querySelectorAll('.modal.show').length;
    evento.target.style.zIndex = abiertos ? String(1055 + abiertos * 20) : '';
    if (!abiertos) return;
    setTimeout(function () {
      var fondos = document.querySelectorAll('.modal-backdrop');
      var fondo = fondos[fondos.length - 1];
      if (fondo) fondo.style.zIndex = String(1050 + abiertos * 20);
    }, 0);
  });

  document.addEventListener('hidden.bs.modal', function () {
    if (document.querySelector('.modal.show')) document.body.classList.add('modal-open');
  });

  // Un dato que llega solo con espacios (las columnas de largo fijo de la base, como el teléfono fijo del chofer) se ve
  // vacío, con su "—" (§6.2; reporte de la VM del 23/10, F5).
  document.addEventListener('show.bs.modal', function (evento) {
    Array.prototype.forEach.call(evento.target.querySelectorAll('.sgtl-dato-valor'), function (dato) {
      if (!dato.children.length && dato.textContent && !dato.textContent.trim()) dato.textContent = '';
    });
  });

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

  // ---------------------------------------------------------------- Información de una fila (§4.3)

  // Lo que acompaña al estado de una fila (en qué proforma está un viaje, qué falta para generar una proforma) va
  // en un ícono chico al lado del estado que abre un globito al hacer clic (pedido de Rocío, 22/10), no en más
  // etiquetas. nivel: 'info' (gris), 'espera' (naranja: se espera a alguien), 'urgente' (rojo: falta resolver
  // algo) o 'listo' (verde). contenido: HTML ya escapado. etiqueta: lo que dice el lector de pantalla.
  var NIVELES_INFO = {
    info: 'bi-info-circle',
    espera: 'bi-clock',
    urgente: 'bi-exclamation-circle',
    listo: 'bi-check-circle'
  };

  function botonInfo(nivel, contenido, etiqueta) {
    var icono = NIVELES_INFO[nivel] || NIVELES_INFO.info;
    return '<button type="button" class="sgtl-info sgtl-info-' + escapar(nivel || 'info') + '" aria-label="' + escapar(etiqueta || 'Ver más información') +
      '" aria-expanded="false" data-sgtl-info="' + escapar(contenido) + '"><i class="bi ' + icono + '" aria-hidden="true"></i></button>';
  }

  // El estado con su ícono a continuación. Va en todas las filas de la columna, tengan ícono o no: el estado queda
  // en el centro con un lugar igual a cada lado, así las etiquetas de estado siempre quedan alineadas.
  function conInfo(estadoHtml, botonHtml) {
    return '<span class="sgtl-con-info"><span class="sgtl-con-info-lugar"></span>' + estadoHtml +
      '<span class="sgtl-con-info-lugar">' + (botonHtml || '') + '</span></span>';
  }

  function cerrarInfo(boton) {
    boton.setAttribute('aria-expanded', 'false');
    componente('popover', boton, document.body.contains(boton) ? 'hide' : 'dispose');
  }

  // Un globito abierto a la vez; se cierra con otro clic (afuera o en el mismo ícono) o con Escape.
  document.addEventListener('click', function (evento) {
    var boton = evento.target && evento.target.closest ? evento.target.closest('.sgtl-info') : null;
    Array.prototype.forEach.call(document.querySelectorAll('.sgtl-info[aria-expanded="true"]'), function (abierto) {
      if (abierto !== boton) cerrarInfo(abierto);
    });
    if (!boton) return;
    if (boton.getAttribute('aria-expanded') === 'true') { cerrarInfo(boton); return; }
    if (!boton.dataset.sgtlInfoListo) {
      boton.dataset.sgtlInfoListo = 'true';
      componente('popover', boton, undefined, {
        html: true, content: boton.getAttribute('data-sgtl-info'), trigger: 'manual', placement: 'left',
        container: 'body', customClass: 'sgtl-globo'
      });
    }
    boton.setAttribute('aria-expanded', 'true');
    componente('popover', boton, 'show');
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key !== 'Escape') return;
    Array.prototype.forEach.call(document.querySelectorAll('.sgtl-info[aria-expanded="true"]'), cerrarInfo);
  });

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
      '<button type="button" class="btn-close" aria-label="Cerrar"></button>';
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
      // La sesión que la API rechazó se borra ya, como en sidebar-loader.js: si no, al volver a entrar seguía guardada
      // (reporte de la VM del 28/10, F7).
      ['token', 'username', 'userRole', 'nombre', 'apellido', 'sgtlSoloHojaDeRuta'].forEach(function (clave) {
        try { localStorage.removeItem(clave); } catch (e) { }
      });
      setTimeout(function () { window.location.href = 'Login.html'; }, 2500);
      // Motivo: por qué se cerró la sesión, si la API lo dice (un chofer que quedó inactivo, HojaDeRutaController).
      var motivo = (xhr.responseJSON || {}).Motivo;
      return typeof motivo === 'string' && motivo.trim() ? motivo.trim() : 'Tu sesión venció. Volvé a iniciar sesión.';
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
      '<div class="mt-3 d-none" data-sgtl="detalle"></div>' +
      '<div class="mt-3 d-none" data-sgtl="motivo">' +
      '<label for="sgtlConfirmarMotivo" class="form-label" data-sgtl="motivo-etiqueta"></label>' +
      '<textarea id="sgtlConfirmarMotivo" class="form-control" rows="2"></textarea>' +
      '<div class="invalid-feedback"></div>' +
      '<div class="form-text d-none" data-sgtl="motivo-ayuda"></div>' +
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
  // verbo ("Eliminar"), peligro (botón rojo), motivo ({ etiqueta, obligatorio, placeholder, ayuda: el texto gris de
  // debajo, como "Opcional. Queda en Auditoría." }), detalle (HTML ya escapado que va
  // debajo del mensaje: la lista de lo que cambia), ancho ('lg' para una ventana más ancha) y accion(motivo):
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
    var detalle = div.querySelector('[data-sgtl="detalle"]');
    detalle.innerHTML = opciones.detalle || '';
    detalle.classList.toggle('d-none', !opciones.detalle);
    div.querySelector('.modal-dialog').classList.toggle('modal-lg', opciones.ancho === 'lg');
    error.classList.add('d-none');
    error.textContent = '';
    aceptar.className = 'btn ' + (opciones.peligro ? 'btn-danger' : 'btn-primary');
    aceptar.textContent = opciones.verbo || 'Aceptar';
    bloqueMotivo.classList.toggle('d-none', !pideMotivo);
    campoMotivo.value = '';
    limpiarError(campoMotivo);
    var ayudaMotivo = div.querySelector('[data-sgtl="motivo-ayuda"]');
    campoMotivo.placeholder = pideMotivo ? (opciones.motivo.placeholder || '') : '';
    ayudaMotivo.textContent = pideMotivo ? (opciones.motivo.ayuda || '') : '';
    ayudaMotivo.classList.toggle('d-none', !ayudaMotivo.textContent);
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
    azul: ['en viaje', 'entregado', 'generada', 'generado', 'update', 'modificacion', 'recupero contrasena'],
    amarillo: ['listo para facturar', 'aceptada', 'parcial', 'km manual', 'atrasado', 'sin salir', 'sin cerrar', 'sin proforma', 'sin evidencia', 'por vencer'],
    verde: ['activo', 'habilitado', 'facturado', 'facturada', 'cancelado', 'cancelada', 'aplicado', 'aplicada', 'insert', 'alta', 'completa'],
    rojo: ['anulada', 'anulado', 'baja', 'delete', 'pendiente', 'rechazo', 'vencida']
  };

  var TEXTOS_ESTADO = {
    'habilitado': 'Activo',
    'deshabilitado': 'Inactivo',
    'login': 'Inicio de sesión',
    'logout': 'Cierre de sesión',
    'insert': 'Alta',
    'update': 'Modificación',
    'recupero contrasena': 'Recupero de contraseña',
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

  // Etiqueta del estado: <span class="badge rounded-pill estado-verde">Activo</span>. color (gris, azul,
  // amarillo, verde o rojo) es para cuando el mismo nombre significa otra cosa en esa pantalla (§4.1):
  // "Pendiente" es deuda (rojo) en cuenta corriente, pero en presupuestos es esperar la respuesta (gris).
  function estado(valor, texto, color) {
    var mostrado = texto || TEXTOS_ESTADO[normalizar(valor)] || valor || '';
    return '<span class="badge rounded-pill estado-' + (color || colorEstado(valor)) + '">' + escapar(mostrado) + '</span>';
  }

  // Estado de un viaje con su texto ("En_viaje" → "En viaje"). "Cancelado" en un viaje es que no se hizo: va en rojo,
  // como lo anulado (en cuenta corriente "Cancelado" es pagado y va en verde, §4.1). "Sin carga" (llegó al origen y no
  // había carga) va en azul, como Entregado: falta facturarlo. Sin estado es Registrado.
  var ESTADOS_VIAJE = {
    Registrado: 'Registrado', En_viaje: 'En viaje', Entregado: 'Entregado', Sin_carga: 'Sin carga',
    Listo_para_facturar: 'Listo para facturar', Facturado: 'Facturado', Cancelado: 'Cancelado'
  };
  var COLOR_ESTADO_VIAJE = { Cancelado: 'rojo', Sin_carga: 'azul' };
  function textoEstadoViaje(valor) { return ESTADOS_VIAJE[valor || 'Registrado'] || valor; }
  function estadoViaje(valor) {
    valor = valor || 'Registrado';
    return estado(valor, textoEstadoViaje(valor), COLOR_ESTADO_VIAJE[valor] || null);
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
    // Cambiar el estado a mano (presupuestos; después, viajes): abre la ventana con los estados posibles.
    estado: { icono: 'bi-flag', clase: 'btn-outline-secondary', texto: 'Cambiar estado' },
    // Reenviar la hoja de ruta al chofer (viajes). Pide confirmación (§5.2).
    whatsapp: { icono: 'bi-whatsapp', clase: 'btn-outline-secondary', texto: 'Reenviar WhatsApp' },
    eliminar: { icono: 'bi-trash', clase: 'btn-outline-danger', texto: 'Eliminar' },
    anular: { icono: 'bi-x-circle', clase: 'btn-outline-danger', texto: 'Anular' }
  };

  // Botón de solo ícono para una fila. opciones: id (va en data-id), datos ({ clave: valor } en data-*),
  // texto e icono (para cambiar los de la acción), deshabilitado y motivo (tooltip del deshabilitado, escrito como
  // dice §1.4: "No se puede eliminar el chofer: está activo").
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
      // El globito y el lector de pantalla dicen lo mismo: el motivo ya nombra la acción ("No se puede editar el recibo: …").
      return '<span class="sgtl-envoltura-deshabilitado" tabindex="0" data-bs-toggle="tooltip" title="' + escapar(motivo) + '">' +
        '<button type="button" class="btn btn-sm ' + base.clase + '" disabled aria-label="' + escapar(motivo) + '">' + icono + '</button></span>';
    }
    return '<button type="button" class="btn btn-sm ' + base.clase + '" data-accion="' + escapar(accion) + '"' + atributos +
      ' data-bs-toggle="tooltip" title="' + escapar(texto) + '" aria-label="' + escapar(texto) + '">' + icono + '</button>';
  }

  function accionesFila(botones) {
    return '<div class="sgtl-acciones">' + botones.join('') + '</div>';
  }

  // ---------------------------------------------------------------- Cambiar estado (§1.4)

  // Ventana "Cambiar estado": dibuja los estados a los que se puede pasar como tarjetas. opciones: [{ valor,
  // etiqueta (HTML de la etiqueta de estado), texto (qué significa), deshabilitado, motivo (por qué no se puede) }].
  // Cada tarjeta puede llevar campos propios en .sgtl-opcion-estado-detalle (por ejemplo, los de la entrega), que
  // se ven solo con la tarjeta elegida. Con { opcional: true } elegir es optativo: volver a tocar la tarjeta
  // elegida la desmarca.
  function opcionesEstado(objetivo, nombre, opciones, ajustes) {
    var contenedor = elemento(objetivo);
    if (!contenedor) return;
    contenedor.classList.remove('is-invalid');
    contenedor.dataset.sgtlOpcional = ajustes && ajustes.opcional ? 'true' : 'false';
    contenedor.innerHTML = (opciones || []).map(function (o) {
      return '<div class="sgtl-opcion-estado' + (o.deshabilitado ? ' deshabilitada' : '') + '" data-valor="' + escapar(o.valor) + '">' +
        '<label class="sgtl-opcion-estado-cabecera">' +
        '<input class="form-check-input" type="radio" name="' + escapar(nombre) + '" value="' + escapar(o.valor) + '"' + (o.deshabilitado ? ' disabled' : '') + '>' +
        '<span>' + (o.etiqueta || '') + '<span class="sgtl-opcion-estado-texto">' + escapar(o.texto || '') + '</span>' +
        (o.deshabilitado && o.motivo ? '<span class="sgtl-opcion-estado-motivo">' + escapar(o.motivo) + '</span>' : '') +
        '</span></label></div>';
    }).join('');
    if (contenedor.dataset.sgtlOpciones) return;
    contenedor.dataset.sgtlOpciones = 'true';
    var estabaElegida = null;
    contenedor.addEventListener('pointerdown', function (evento) {
      var cabecera = evento.target.closest('.sgtl-opcion-estado-cabecera');
      var radio = cabecera && cabecera.querySelector('input');
      estabaElegida = radio && radio.checked ? radio : null;
    });
    contenedor.addEventListener('click', function (evento) {
      var radio = evento.target;
      // Tocar la cabecera dispara dos clics: el de la etiqueta y después el del radio. Cuenta solo el del radio.
      if (!radio.matches || !radio.matches('.sgtl-opcion-estado-cabecera input')) return;
      var desmarcar = contenedor.dataset.sgtlOpcional === 'true' && radio === estabaElegida;
      estabaElegida = null;
      if (!desmarcar) return;
      radio.checked = false;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    });
    contenedor.addEventListener('change', function () {
      contenedor.classList.remove('is-invalid');
      Array.prototype.forEach.call(contenedor.querySelectorAll('.sgtl-opcion-estado'), function (tarjeta) {
        tarjeta.classList.toggle('seleccionada', !!tarjeta.querySelector('input:checked'));
      });
    });
  }

  // Valor del estado elegido en la ventana, o '' si no se eligió ninguno.
  function estadoElegido(objetivo) {
    var contenedor = elemento(objetivo);
    var elegido = contenedor && contenedor.querySelector('input:checked');
    return elegido ? elegido.value : '';
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

  // Encabezados ordenables: la pantalla aplica el orden antes de paginar.
  function habilitarOrden(tablaObjetivo, alCambiar, ordenInicial) {
    var tablaElemento = elemento(tablaObjetivo);
    // Una tabla que reconstruye sus encabezados puede conservar el criterio y las flechas.
    var campo = ordenInicial && ordenInicial.orden || '';
    var direccion = ordenInicial && ordenInicial.direccion || '';
    if (!tablaElemento) return { parametros: function () { return {}; } };

    var botones = tablaElemento.querySelectorAll('th button[data-sgtl-orden]');
    function actualizar() {
      Array.prototype.forEach.call(botones, function (boton) {
        var activo = boton.getAttribute('data-sgtl-orden') === campo;
        var siguiente = activo && direccion === 'asc' ? 'descendente' : 'ascendente';
        var encabezado = boton.closest('th');
        if (encabezado) {
          if (activo) encabezado.setAttribute('aria-sort', direccion === 'asc' ? 'ascending' : 'descending');
          else encabezado.removeAttribute('aria-sort');
        }
        var icono = boton.querySelector('i');
        if (icono) icono.className = 'bi ' + (activo ? (direccion === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down') : 'bi-arrow-down-up') + ' ms-1';
        boton.setAttribute('aria-label', 'Ordenar por ' + boton.textContent.trim() + ' en orden ' + siguiente);
      });
    }

    Array.prototype.forEach.call(botones, function (boton) {
      boton.addEventListener('click', function () {
        var nuevoCampo = boton.getAttribute('data-sgtl-orden');
        direccion = nuevoCampo === campo && direccion === 'asc' ? 'desc' : 'asc';
        campo = nuevoCampo;
        actualizar();
        if (typeof alCambiar === 'function') alCambiar();
      });
    });
    actualizar();

    return {
      parametros: function () { return campo ? { orden: campo, direccion: direccion } : {}; }
    };
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
    habilitarOrden: habilitarOrden,
    // PaginacionSGTL, que no se muestra cuando no hay resultados.
    paginacion: function (contenedor, opciones) {
      var el = elemento(contenedor);
      if (!el) return;
      var total = Number(opciones && opciones.total) || 0;
      // Con important: el estilo del paginador (sidebar-loader.js) fuerza display:flex !important.
      if (total) el.style.removeProperty('display');
      else el.style.setProperty('display', 'none', 'important');
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
  var formatoMontoCampo = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  // Lee un importe argentino y devuelve centavos. No acepta negativos ni más de dos decimales.
  function montoCentavos(valor) {
    if (valor == null || String(valor).trim() === '') return null;
    if (typeof valor === 'number') {
      if (!isFinite(valor) || valor < 0) return null;
      var centavosNumero = Math.round(valor * 100);
      return Math.abs(valor * 100 - centavosNumero) < 0.000001 ? centavosNumero : null;
    }

    var texto = String(valor).replace(/\s/g, '').trim();
    if (!texto || texto.charAt(0) === '-') return null;
    var partes;
    var entero;
    var decimal = '';
    if (texto.indexOf(',') >= 0) {
      if ((texto.match(/,/g) || []).length !== 1) return null;
      partes = texto.split(',');
      if (!/^\d{1,3}(\.\d{3})*$/.test(partes[0]) && !/^\d+$/.test(partes[0])) return null;
      if (!/^\d{0,2}$/.test(partes[1])) return null;
      entero = partes[0].replace(/\./g, '');
      decimal = partes[1];
    } else if (/^\d{1,3}(\.\d{3})+$/.test(texto)) {
      entero = texto.replace(/\./g, '');
    } else if (/^\d+(\.\d{1,2})?$/.test(texto)) {
      partes = texto.split('.');
      entero = partes[0];
      decimal = partes[1] || '';
    } else {
      return null;
    }

    var parteEntera = Number(entero);
    if (!isFinite(parteEntera) || parteEntera < 0 || parteEntera > 90071992547409) return null;
    var parteDecimal = decimal ? Number(decimal.length === 1 ? decimal + '0' : decimal) : 0;
    return parteEntera * 100 + parteDecimal;
  }

  function formatearMontoCentavos(centavos) {
    var valor = Number(centavos);
    if (!isFinite(valor) || valor < 0 || Math.round(valor) !== valor) return '';
    return formatoMontoCampo.format(valor / 100);
  }

  // La edición permanece libre; al salir del campo se normaliza para no interrumpir el cursor.
  function enlazarMascaraMonto(objetivo) {
    var input = elemento(objetivo);
    if (!input || typeof input.addEventListener !== 'function') return null;
    // Si no se puede leer ("12x"), queda lo escrito: la validación del formulario dice cómo escribirlo, en vez de borrarlo
    // y pedir que se complete (F5 de la prueba en la VM del 25/10).
    input.addEventListener('blur', function () {
      var valor = montoCentavos(input.value);
      if (valor != null) input.value = formatearMontoCentavos(valor);
    });
    return input;
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

  // El calendario se dibuja en el body, fuera del modal: Bootstrap le saca el foco a todo lo que está
  // afuera y lo devuelve a la cruz del modal, así que no se podía escribir la hora. El foco dentro del
  // calendario no le llega a Bootstrap.
  function focoDentroDelCalendario(fp) {
    if (fp && fp.calendarContainer) {
      fp.calendarContainer.addEventListener('focusin', function (e) { e.stopPropagation(); });
    }
    return fp;
  }

  // Selector de una fecha para formularios (§7.1): se ve y se escribe DD/MM/AAAA.
  // Para mandar a la API: SGTL.fechaISO(SGTL.leerFecha(input.value)).
  function selectorFecha(objetivo, opciones) {
    var input = elemento(objetivo);
    if (!input || typeof window.flatpickr !== 'function') return null;
    var configuracion = { dateFormat: 'd/m/Y', allowInput: true };
    if (window.flatpickr.l10ns && window.flatpickr.l10ns.es) configuracion.locale = 'es';
    Object.keys(opciones || {}).forEach(function (clave) { configuracion[clave] = opciones[clave]; });
    return focoDentroDelCalendario(window.flatpickr(input, configuracion));
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
      allowInput: true,
      // Clase propia para que "DD/MM/AAAA a DD/MM/AAAA" entre completo en un filtro angosto (sgtl.css).
      altInputClass: 'form-control input sgtl-rango-fechas'
    };
    if (window.flatpickr.l10ns && window.flatpickr.l10ns.es) configuracion.locale = 'es';
    Object.keys(opciones || {}).forEach(function (clave) { configuracion[clave] = opciones[clave]; });
    return focoDentroDelCalendario(window.flatpickr(input, configuracion));
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

  // El campo que ve el usuario: con flatpickr (altInput) es otro input y el original queda oculto.
  function campoVisible(campo) {
    return campo && campo._flatpickr && campo._flatpickr.altInput ? campo._flatpickr.altInput : campo;
  }

  // En un input-group (campo + botón) el mensaje va al final del grupo, en su propio renglón.
  function grupoDe(campo) {
    return campo.parentElement && campo.parentElement.classList.contains('input-group') ? campo.parentElement : null;
  }

  function feedbackDe(campo) {
    var grupo = grupoDe(campo);
    if (grupo) {
      grupo.classList.add('has-validation');
      var ultimo = grupo.lastElementChild;
      if (ultimo && ultimo.classList.contains('invalid-feedback')) return ultimo;
      var enGrupo = document.createElement('div');
      enGrupo.className = 'invalid-feedback';
      grupo.appendChild(enGrupo);
      return enGrupo;
    }
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
    var campo = campoVisible(elemento(objetivo));
    if (!campo) return;
    campo.classList.add('is-invalid');
    feedbackDe(campo).textContent = mensaje || '';
  }

  function limpiarError(objetivo) {
    var campo = campoVisible(elemento(objetivo));
    if (!campo) return;
    campo.classList.remove('is-invalid');
    var grupo = grupoDe(campo);
    var siguiente = grupo ? grupo.lastElementChild : campo.nextElementSibling;
    if (siguiente && siguiente.classList.contains('invalid-feedback')) siguiente.textContent = '';
  }

  // Aviso arriba del formulario. Sin texto, lo oculta. Con detalle (una lista de textos), los muestra debajo, uno por
  // renglón: un error que alcanza a varias cosas, agrupadas (§5.1).
  function avisoFormulario(objetivo, texto, detalle) {
    var aviso = elemento(objetivo);
    if (!aviso) return;
    clearTimeout(aviso._sgtlTemporizadorAviso);
    aviso._sgtlTemporizadorAviso = null;
    if (texto === REVISA_CAMPOS) seVaSinCamposMarcados(aviso);
    aviso.textContent = texto || '';
    if (texto && detalle && detalle.length) {
      var lista = document.createElement('ul');
      lista.className = 'sgtl-aviso-lista';
      detalle.forEach(function (linea) {
        var item = document.createElement('li');
        item.textContent = linea;
        lista.appendChild(item);
      });
      aviso.appendChild(lista);
    }
    aviso.style.display = texto ? '' : 'none';
    aviso.classList.toggle('d-none', !texto);
    // Duración opcional del contenedor; la validación se conserva hasta corregir los campos.
    var duracion = Number(aviso.dataset.sgtlDuracion);
    if (texto && texto !== REVISA_CAMPOS && Number.isFinite(duracion) && duracion > 0) {
      aviso._sgtlTemporizadorAviso = setTimeout(function () { avisoFormulario(aviso, ''); }, duracion);
    }
  }

  // Después de validar: si hay campos marcados, muestra "Revisá los campos marcados." y lleva el
  // cursor al primero. Devuelve true si el formulario está bien.
  // "Revisá los campos marcados." se va solo cuando ya no queda ningún campo marcado en el modal o el formulario del aviso
  // (M10 de la prueba en la VM del 25/10), lo haya puesto la validación o un error de la API.
  var REVISA_CAMPOS = 'Revisá los campos marcados.';
  function seVaSinCamposMarcados(aviso) {
    var contenedor = aviso.closest('.modal-content, form, .card') || aviso.parentElement;
    if (!contenedor || aviso.dataset.sgtlSeVa) return;
    aviso.dataset.sgtlSeVa = '1';
    var siYaNoHay = function () {
      // Después de que cada campo se valide con lo que se escribió.
      setTimeout(function () {
        if (aviso.textContent === REVISA_CAMPOS && !contenedor.querySelector('.is-invalid')) avisoFormulario(aviso, '');
      }, 0);
    };
    ['input', 'change', 'focusout'].forEach(function (evento) { contenedor.addEventListener(evento, siYaNoHay); });
  }

  function revisarFormulario(form, aviso) {
    var contenedor = elemento(form);
    var primero = contenedor ? contenedor.querySelector('.is-invalid') : null;
    avisoFormulario(aviso, primero ? REVISA_CAMPOS : '');
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

  // Cerrar un formulario con cambios sin guardar (§6.2): no se cierra de una. Arriba del cuerpo del modal aparece el aviso
  // amarillo "Tenés cambios sin guardar. Si cerrás, se pierden." con "Seguir editando" y "Descartar cambios". Cuenta como
  // cambio lo que la persona escribe o elige en el modal (no lo que carga el código, ni lo que está dentro de
  // [data-sin-cambios], como un buscador). opciones.activo(): false cuando no hay nada que perder. Devuelve { limpiar,
  // hayCambios }: limpiar() al terminar de cargar los datos y antes de cerrar después de guardar.
  function cambiosSinGuardar(objetivo, opciones) {
    var ventana = elemento(objetivo);
    var cuerpo = ventana && ventana.querySelector('.modal-body');
    if (!cuerpo) return { limpiar: function () {}, hayCambios: function () { return false; } };
    opciones = opciones || {};
    var hayCambios = false;
    var aviso = document.createElement('div');
    aviso.className = 'alert alert-light-warning color-warning d-none';
    aviso.setAttribute('role', 'alert');
    aviso.setAttribute('data-sin-cambios', '');
    aviso.innerHTML = '<div class="mb-2">Tenés cambios sin guardar. Si cerrás, se pierden.</div>' +
      '<button type="button" class="btn btn-sm btn-light-secondary" data-sgtl="seguir">Seguir editando</button>' +
      '<button type="button" class="btn btn-sm btn-danger ms-1" data-sgtl="descartar">Descartar cambios</button>';
    cuerpo.insertBefore(aviso, cuerpo.firstChild);
    function ocultar() { aviso.classList.add('d-none'); }
    function marcar(evento) {
      var campo = evento.target;
      if (campo && !campo.disabled && !(campo.closest && campo.closest('[data-sin-cambios]'))) hayCambios = true;
    }
    ventana.addEventListener('input', marcar);
    ventana.addEventListener('change', marcar);
    ventana.addEventListener('hide.bs.modal', function (evento) {
      if (evento.target !== ventana || !hayCambios || (opciones.activo && !opciones.activo())) return;
      evento.preventDefault();
      aviso.classList.remove('d-none');
      cuerpo.scrollTop = 0;
    });
    ventana.addEventListener('hidden.bs.modal', function (evento) {
      if (evento.target === ventana) { hayCambios = false; ocultar(); }
    });
    // El aviso se oculta: el foco vuelve al modal para que Escape y Tab sigan andando.
    aviso.querySelector('[data-sgtl="seguir"]').addEventListener('click', function () { ocultar(); ventana.focus(); });
    aviso.querySelector('[data-sgtl="descartar"]').addEventListener('click', function () {
      hayCambios = false;
      ocultar();
      modal(ventana, 'hide');
    });
    return {
      limpiar: function () { hayCambios = false; ocultar(); },
      hayCambios: function () { return hayCambios; }
    };
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

  // ---------------------------------------------------------------- Ver detalle (§6.2)

  // Pie de un Ver detalle: "Registrado por jperez el 18/10/2026 10:12 · Modificado por … el …". Las fechas llegan ya
  // en texto, porque cada pantalla corrige su zona horaria (§2 de docs/PENDIENTES-SISTEMA.md). Sin modificación, solo
  // el alta. Devuelve texto plano (va con .text()).
  function textoRegistro(usuarioAlta, fechaAlta, usuarioModi, fechaModi) {
    var partes = [];
    if (fechaAlta || usuarioAlta) partes.push('Registrado' + (usuarioAlta ? ' por ' + usuarioAlta : '') + (fechaAlta ? ' el ' + fechaAlta : ''));
    if (fechaModi && fechaModi !== fechaAlta) partes.push('Modificado' + (usuarioModi ? ' por ' + usuarioModi : '') + ' el ' + fechaModi);
    return partes.join(' · ');
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
    estadoViaje: estadoViaje,
    textoEstadoViaje: textoEstadoViaje,
    estadosViaje: function () { return Object.assign({}, ESTADOS_VIAJE); },
    colorEstado: colorEstado,
    botonFila: botonFila,
    accionesFila: accionesFila,
    opcionesEstado: opcionesEstado,
    estadoElegido: estadoElegido,
    textos: TEXTOS,
    tabla: tabla,
    fecha: fecha,
    monto: monto,
    montoCentavos: montoCentavos,
    formatearMontoCentavos: formatearMontoCentavos,
    enlazarMascaraMonto: enlazarMascaraMonto,
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
    cambiosSinGuardar: cambiosSinGuardar,
    textoRegistro: textoRegistro,
    botonInfo: botonInfo,
    conInfo: conInfo,
    descargarCSV: descargarCSV
  };
})();
