// Funciones de interfaz compartidas por todas las pantallas (window.SGTL). Va después de assets/compiled/js/app.js.
(function () {
    'use strict';

    if (window.SGTL) return;

    var ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

    function escapar(valor) {
        return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (c) { return ENTIDADES[c]; });
    }

    function elemento(objetivo) {
        if (!objetivo) return null;
        if (typeof objetivo === 'string') return document.querySelector(objetivo);
        if (objetivo.jquery) return objetivo.get(0) || null;
        return objetivo;
    }

    // Evita que modal no abra cuando falta window.bootstrap: primero prueba con jQuery.
    function componente(nombre, el, accion, opciones) {
        if (window.jQuery && window.jQuery.fn[nombre]) {
            return window.jQuery(el)[nombre](accion === undefined ? opciones : accion);
        }
        var Clase = window.bootstrap && window.bootstrap[nombre.charAt(0).toUpperCase() + nombre.slice(1)];
        if (!Clase) return null;
        var instancia = Clase.getOrCreateInstance(el, opciones);
        if (accion && typeof instancia[accion] === 'function') instancia[accion]();
        return instancia;
    }

    function modal(objetivo, accion) {
        var el = elemento(objetivo);
        if (el) componente('modal', el, accion || 'show');
    }

    document.addEventListener('show.bs.modal', function (evento) {
        var ventana = evento.target;
        var abiertos = document.querySelectorAll('.modal.show').length;
        ventana.style.zIndex = abiertos ? String(1055 + abiertos * 20) : '';
        if (abiertos) {
            setTimeout(function () {
                var fondos = document.querySelectorAll('.modal-backdrop');
                var fondo = fondos[fondos.length - 1];
                if (fondo) fondo.style.zIndex = String(1050 + abiertos * 20);
            }, 0);
        }
        ventana.querySelectorAll('.sgtl-dato-valor').forEach(function (dato) {
            if (!dato.children.length && !dato.textContent.trim()) dato.textContent = '';
        });
    });

    document.addEventListener('hidden.bs.modal', function () {
        if (document.querySelector('.modal.show')) document.body.classList.add('modal-open');
    });

    document.addEventListener('hide.bs.modal', function (evento) {
        if (evento.target.dataset.sgtlProcesando === 'true') evento.preventDefault();
    });

    var DURACION_EXITO = 4000;

    function contenedorAvisos() {
        var contenedor = document.getElementById('sgtl-toasts');
        if (!contenedor) {
            document.body.insertAdjacentHTML('beforeend', '<div id="sgtl-toasts" class="sgtl-toasts" aria-live="polite"></div>');
            contenedor = document.getElementById('sgtl-toasts');
            contenedor.addEventListener('click', function (evento) {
                var cruz = evento.target.closest('.btn-close');
                if (cruz) cerrarAviso(cruz.closest('.sgtl-toast'));
            });
        }
        return contenedor;
    }

    function cerrarAviso(aviso) {
        aviso.classList.remove('visible');
        setTimeout(function () { aviso.remove(); }, 200);
    }

    function mostrarAviso(tipo, mensaje) {
        var contenedor = contenedorAvisos();
        contenedor.insertAdjacentHTML('beforeend',
            '<div class="sgtl-toast sgtl-toast-' + tipo + '" role="' + (tipo === 'error' ? 'alert' : 'status') + '">' +
            '<div class="sgtl-toast-texto">' + escapar(mensaje) + '</div>' +
            '<button type="button" class="btn-close" aria-label="Cerrar"></button></div>');
        var aviso = contenedor.lastElementChild;
        requestAnimationFrame(function () { aviso.classList.add('visible'); });
        if (tipo === 'exito') setTimeout(function () { cerrarAviso(aviso); }, DURACION_EXITO);
    }

    var CLAVES_SESION = ['token', 'username', 'userRole', 'nombre', 'apellido', 'sgtlSoloHojaDeRuta'];

    function textoNoVacio(valor) {
        return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
    }

    function cerrarSesion() {
        CLAVES_SESION.forEach(function (clave) {
            try { localStorage.removeItem(clave); } catch (e) { }
        });
        setTimeout(function () { window.location.href = 'Login.html'; }, 2500);
    }

    function mensajeError(xhr, porDefecto) {
        var estado = xhr && xhr.status;
        var datos = (xhr && xhr.responseJSON) || {};
        if (estado === 401) {
            cerrarSesion();
            return textoNoVacio(datos.Motivo) || 'Tu sesión venció. Volvé a iniciar sesión.';
        }
        if (estado === 400 || estado === 409) {
            return textoNoVacio(datos.mensaje || datos.Mensaje || datos.Message || datos.message) || porDefecto;
        }
        return porDefecto;
    }

    var API = 'http://localhost:50222/api';

    function encabezados(otros) {
        var lista = Object.assign({}, otros);
        var token = localStorage.getItem('token');
        if (token) lista.Authorization = 'Bearer ' + token;
        return lista;
    }

    if (window.jQuery) {
        window.jQuery(document).ajaxSend(function (evento, xhr, opciones) {
            var autorizacion = encabezados().Authorization;
            if (autorizacion && opciones.url.indexOf(API) === 0) xhr.setRequestHeader('Authorization', autorizacion);
        });
    }

    function ajax(opciones, porDefecto) {
        return Promise.resolve(window.jQuery.ajax(opciones)).catch(function (xhr) {
            var error = new Error('Error ' + xhr.status + ' en ' + opciones.url);
            error.xhr = xhr;
            error.mensajeUsuario = mensajeError(xhr, porDefecto || 'Ocurrió un error. Probá de nuevo.');
            throw error;
        });
    }

    function gerundio(verbo) {
        var palabra = String(verbo || '').trim().split(/\s+/)[0];
        if (/ar$/i.test(palabra)) return palabra.slice(0, -2) + 'ando…';
        if (/[aeiou](er|ir)$/i.test(palabra)) return palabra.slice(0, -2) + 'yendo…';
        if (/(er|ir)$/i.test(palabra)) return palabra.slice(0, -2) + 'iendo…';
        return 'Procesando…';
    }

    function procesando(objetivo, texto) {
        var boton = elemento(objetivo);
        if (!boton) return function () { };
        var htmlOriginal = boton.innerHTML;
        var estabaDeshabilitado = boton.disabled;
        var ventana = boton.closest('.modal');
        var cierres = ventana ? Array.from(ventana.querySelectorAll('[data-bs-dismiss="modal"]')).filter(function (b) { return !b.disabled; }) : [];
        var soloIcono = !boton.textContent.trim();
        var ruedita = '<span class="spinner-border spinner-border-sm' + (soloIcono ? '' : ' me-1') + '" aria-hidden="true"></span>';

        boton.disabled = true;
        boton.innerHTML = soloIcono ? ruedita : ruedita + escapar(texto || gerundio(boton.textContent));
        cierres.forEach(function (b) { b.disabled = true; });
        if (ventana) ventana.dataset.sgtlProcesando = 'true';

        return function listo() {
            boton.innerHTML = htmlOriginal;
            boton.disabled = estabaDeshabilitado;
            cierres.forEach(function (b) { b.disabled = false; });
            if (ventana) delete ventana.dataset.sgtlProcesando;
        };
    }

    function campoVisible(campo) {
        return campo && campo._flatpickr && campo._flatpickr.altInput ? campo._flatpickr.altInput : campo;
    }

    function grupoDe(campo) {
        return campo.parentElement && campo.parentElement.classList.contains('input-group') ? campo.parentElement : null;
    }

    function feedbackExistente(campo) {
        var grupo = grupoDe(campo);
        var candidato = grupo ? grupo.lastElementChild : campo.nextElementSibling;
        while (!grupo && candidato && !candidato.classList.contains('invalid-feedback') && !candidato.classList.contains('form-text')) {
            candidato = candidato.nextElementSibling;
        }
        return candidato && candidato.classList.contains('invalid-feedback') ? candidato : null;
    }

    function feedbackDe(campo) {
        var grupo = grupoDe(campo);
        if (grupo) grupo.classList.add('has-validation');
        var feedback = feedbackExistente(campo);
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            if (grupo) grupo.appendChild(feedback);
            else campo.insertAdjacentElement('afterend', feedback);
        }
        return feedback;
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
        var feedback = feedbackExistente(campo);
        if (feedback) feedback.textContent = '';
    }

    var ventanaConfirmar = null;

    function crearVentanaConfirmar() {
        document.body.insertAdjacentHTML('beforeend',
            '<div class="modal fade" id="sgtlConfirmar" tabindex="-1" aria-labelledby="sgtlConfirmarTitulo" aria-hidden="true">' +
            '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
            '<div class="modal-header"><h5 class="modal-title" id="sgtlConfirmarTitulo"></h5>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
            '<div class="modal-body">' +
            '<div class="alert alert-light-danger d-none" role="alert" data-sgtl="error"></div>' +
            '<p class="mb-0" data-sgtl="mensaje"></p>' +
            '<div class="mt-3 d-none" data-sgtl="detalle"></div>' +
            '<div class="mt-3 d-none" data-sgtl="motivo">' +
            '<label for="sgtlConfirmarMotivo" class="form-label" data-sgtl="motivo-etiqueta"></label>' +
            '<textarea id="sgtlConfirmarMotivo" class="form-control" rows="2"></textarea>' +
            '<div class="invalid-feedback"></div>' +
            '<div class="form-text d-none" data-sgtl="motivo-ayuda"></div>' +
            '</div></div>' +
            '<div class="modal-footer">' +
            '<button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cancelar</button>' +
            '<button type="button" class="btn" data-sgtl="aceptar"></button>' +
            '</div></div></div></div>');
        return document.getElementById('sgtlConfirmar');
    }

    function parte(ventana, nombre) {
        return ventana.querySelector('[data-sgtl="' + nombre + '"]');
    }

    function prepararConfirmar(ventana, opciones) {
        var motivo = opciones.motivo;
        var campoMotivo = ventana.querySelector('#sgtlConfirmarMotivo');
        var ayuda = parte(ventana, 'motivo-ayuda');
        var detalle = parte(ventana, 'detalle');
        var aceptar = parte(ventana, 'aceptar');

        ventana.querySelector('#sgtlConfirmarTitulo').textContent = opciones.titulo || '';
        parte(ventana, 'mensaje').textContent = opciones.mensaje || '';
        detalle.innerHTML = opciones.detalle || '';
        detalle.classList.toggle('d-none', !opciones.detalle);
        ventana.querySelector('.modal-dialog').classList.toggle('modal-lg', opciones.ancho === 'lg');
        parte(ventana, 'error').classList.add('d-none');
        aceptar.className = 'btn ' + (opciones.peligro ? 'btn-danger' : 'btn-primary');
        aceptar.textContent = opciones.verbo || 'Aceptar';

        parte(ventana, 'motivo').classList.toggle('d-none', !motivo);
        campoMotivo.value = '';
        limpiarError(campoMotivo);
        campoMotivo.placeholder = motivo ? motivo.placeholder || '' : '';
        ayuda.textContent = motivo ? motivo.ayuda || '' : '';
        ayuda.classList.toggle('d-none', !ayuda.textContent);
        if (motivo) {
            parte(ventana, 'motivo-etiqueta').innerHTML = escapar(motivo.etiqueta || 'Motivo') +
                (motivo.obligatorio !== false ? ' <span class="text-danger">*</span>' : '');
        }
    }

    function confirmar(opciones) {
        opciones = opciones || {};
        var ventana = ventanaConfirmar || (ventanaConfirmar = crearVentanaConfirmar());
        var aceptar = parte(ventana, 'aceptar');
        var error = parte(ventana, 'error');
        var campoMotivo = ventana.querySelector('#sgtlConfirmarMotivo');
        var motivoObligatorio = !!opciones.motivo && opciones.motivo.obligatorio !== false;
        prepararConfirmar(ventana, opciones);

        return new Promise(function (resolver) {
            var hecho = false;

            function terminar() {
                hecho = true;
                modal(ventana, 'hide');
            }

            function alAceptar() {
                var motivo = campoMotivo.value.trim();
                if (motivoObligatorio && !motivo) {
                    marcarError(campoMotivo, 'Completá el motivo.');
                    campoMotivo.focus();
                    return;
                }
                if (typeof opciones.accion !== 'function') return terminar();
                error.classList.add('d-none');
                var listo = procesando(aceptar);
                Promise.resolve().then(function () { return opciones.accion(motivo); }).then(function () {
                    listo();
                    terminar();
                }, function (falla) {
                    listo();
                    error.textContent = (falla && falla.mensajeUsuario) ||
                        'No se pudo ' + (opciones.verbo || 'hacer la acción').toLowerCase() + '. Probá de nuevo.';
                    error.classList.remove('d-none');
                });
            }

            aceptar.addEventListener('click', alAceptar);
            ventana.addEventListener('hidden.bs.modal', function () {
                aceptar.removeEventListener('click', alAceptar);
                resolver(hecho);
            }, { once: true });
            modal(ventana, 'show');
        });
    }

    function normalizar(texto) {
        return String(texto == null ? '' : texto).toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/_/g, ' ').trim();
    }

    var COLORES_ESTADO = {
        azul: ['en viaje', 'entregado', 'sin carga', 'generada', 'generado', 'update', 'modificacion', 'recupero contrasena'],
        amarillo: ['listo para facturar', 'aceptada', 'parcial', 'km manual', 'atrasado', 'sin salir', 'sin cerrar', 'sin proforma', 'sin evidencia', 'por vencer'],
        verde: ['activo', 'habilitado', 'facturado', 'facturada', 'cancelado', 'cancelada', 'aplicado', 'aplicada', 'insert', 'alta', 'completa'],
        rojo: ['anulado', 'anulada', 'baja', 'delete', 'pendiente', 'rechazo', 'vencida']
    };

    var TEXTOS_ESTADO = {
        'habilitado': 'Activo',
        'deshabilitado': 'Inactivo',
        'login': 'Inicio de sesión',
        'logout': 'Cierre de sesión',
        'insert': 'Alta',
        'update': 'Modificación',
        'delete': 'Baja',
        'recupero contrasena': 'Recupero de contraseña',
        'km manual': 'Km manual'
    };

    function colorEstado(valor) {
        var clave = normalizar(valor);
        return Object.keys(COLORES_ESTADO).find(function (color) {
            return COLORES_ESTADO[color].includes(clave);
        }) || 'gris';
    }

    function estado(valor, texto, color) {
        var mostrado = texto || TEXTOS_ESTADO[normalizar(valor)] || valor || '';
        return '<span class="badge rounded-pill estado-' + (color || colorEstado(valor)) + '">' + escapar(mostrado) + '</span>';
    }

    var ESTADOS_VIAJE = ['Registrado', 'En_viaje', 'Entregado', 'Sin_carga', 'Listo_para_facturar', 'Facturado', 'Cancelado'];

    function textoEstadoViaje(valor) {
        return String(valor || 'Registrado').replace(/_/g, ' ');
    }

    function estadoViaje(valor) {
        valor = valor || 'Registrado';
        return estado(valor, textoEstadoViaje(valor), valor === 'Cancelado' ? 'rojo' : null);
    }

    function estadosViaje() {
        var textos = {};
        ESTADOS_VIAJE.forEach(function (valor) { textos[valor] = textoEstadoViaje(valor); });
        return textos;
    }

    function borrarGlobosSueltos() {
        document.querySelectorAll('.tooltip, .popover').forEach(function (globo) {
            if (!document.querySelector('[aria-describedby="' + globo.id + '"]')) globo.remove();
        });
    }

    function ocultarTooltips() {
        document.querySelectorAll('[data-sgtl-tooltip]').forEach(function (el) {
            componente('tooltip', el, 'hide');
        });
        setTimeout(borrarGlobosSueltos, 400);
    }

    function iniciarTooltip(evento) {
        var el = evento.target.closest && evento.target.closest('[data-bs-toggle="tooltip"]');
        if (!el || el.dataset.sgtlTooltip) return;
        el.dataset.sgtlTooltip = 'true';
        componente('tooltip', el, undefined, { trigger: 'hover focus', container: 'body' });
        componente('tooltip', el, 'show');
    }

    document.addEventListener('mouseover', iniciarTooltip);
    document.addEventListener('focusin', iniciarTooltip);
    document.addEventListener('show.bs.modal', ocultarTooltips);

    document.addEventListener('click', function (evento) {
        if (evento.target.closest && evento.target.closest('[data-bs-toggle="tooltip"]')) ocultarTooltips();
    });

    var ACCIONES = {
        ver: { icono: 'bi-eye', clase: 'btn-outline-secondary', texto: 'Ver detalle' },
        editar: { icono: 'bi-pencil', clase: 'btn-outline-primary', texto: 'Editar' },
        pdf: { icono: 'bi-file-earmark-pdf', clase: 'btn-outline-secondary', texto: 'Ver PDF' },
        enviar: { icono: 'bi-envelope', clase: 'btn-outline-secondary', texto: 'Enviar por e-mail' },
        whatsapp: { icono: 'bi-whatsapp', clase: 'btn-outline-secondary', texto: 'Reenviar WhatsApp' },
        estado: { icono: 'bi-flag', clase: 'btn-outline-secondary', texto: 'Cambiar estado' },
        siguiente: { icono: 'bi-arrow-right-circle', clase: 'btn-outline-success', texto: '' },
        activar: { icono: 'bi-toggle-off', clase: 'btn-outline-secondary', texto: 'Activar' },
        inactivar: { icono: 'bi-toggle-on', clase: 'btn-outline-secondary', texto: 'Inactivar' },
        eliminar: { icono: 'bi-trash', clase: 'btn-outline-danger', texto: 'Eliminar' },
        anular: { icono: 'bi-x-circle', clase: 'btn-outline-danger', texto: 'Anular' }
    };

    function botonFila(accion, opciones) {
        opciones = opciones || {};
        var base = ACCIONES[accion] || ACCIONES.siguiente;
        var texto = opciones.texto || base.texto;
        var clase = 'btn btn-sm ' + base.clase;
        var icono = '<i class="bi ' + (opciones.icono || base.icono) + '" aria-hidden="true"></i>';

        if (opciones.deshabilitado) {
            var motivo = escapar(opciones.motivo || texto);
            return '<span class="sgtl-envoltura-deshabilitado" tabindex="0" data-bs-toggle="tooltip" title="' + motivo + '">' +
                '<button type="button" class="' + clase + '" disabled aria-label="' + motivo + '">' + icono + '</button></span>';
        }

        var datos = Object.assign({}, opciones.datos);
        if (opciones.id !== undefined) datos.id = opciones.id;
        var atributos = Object.keys(datos).map(function (clave) {
            return ' data-' + clave + '="' + escapar(datos[clave]) + '"';
        }).join('');
        return '<button type="button" class="' + clase + '" data-accion="' + escapar(accion) + '"' + atributos +
            ' data-bs-toggle="tooltip" title="' + escapar(texto) + '" aria-label="' + escapar(texto) + '">' + icono + '</button>';
    }

    function accionesFila(botones) {
        return '<div class="sgtl-acciones">' + botones.join('') + '</div>';
    }

    var NIVELES_INFO = {
        info: 'bi-info-circle',
        espera: 'bi-clock',
        urgente: 'bi-exclamation-circle',
        listo: 'bi-check-circle'
    };

    function botonInfo(nivel, contenido, etiqueta) {
        nivel = NIVELES_INFO[nivel] ? nivel : 'info';
        return '<button type="button" class="sgtl-info sgtl-info-' + nivel + '" aria-label="' + escapar(etiqueta || 'Ver más información') +
            '" aria-expanded="false" data-sgtl-info="' + escapar(contenido) + '"><i class="bi ' + NIVELES_INFO[nivel] + '" aria-hidden="true"></i></button>';
    }

    function conInfo(estadoHtml, botonHtml) {
        return '<span class="sgtl-con-info"><span class="sgtl-con-info-lugar"></span>' + estadoHtml +
            '<span class="sgtl-con-info-lugar">' + (botonHtml || '') + '</span></span>';
    }

    function cerrarInfo(boton) {
        boton.setAttribute('aria-expanded', 'false');
        componente('popover', boton, 'hide');
    }

    document.addEventListener('click', function (evento) {
        var boton = evento.target.closest && evento.target.closest('.sgtl-info');
        document.querySelectorAll('.sgtl-info[aria-expanded="true"]').forEach(function (abierto) {
            if (abierto !== boton) cerrarInfo(abierto);
        });
        if (!boton) return;
        if (boton.getAttribute('aria-expanded') === 'true') return cerrarInfo(boton);
        boton.setAttribute('aria-expanded', 'true');
        componente('popover', boton, undefined, {
            html: true, content: boton.dataset.sgtlInfo, trigger: 'manual', placement: 'left', container: 'body', customClass: 'sgtl-globo'
        });
        componente('popover', boton, 'show');
    });

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') document.querySelectorAll('.sgtl-info[aria-expanded="true"]').forEach(cerrarInfo);
    });

    function opcionesEstado(objetivo, nombre, opciones, ajustes) {
        var contenedor = elemento(objetivo);
        if (!contenedor) return;
        contenedor.classList.add('sgtl-opciones-estado');
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
    }

    function estadoElegido(objetivo) {
        var contenedor = elemento(objetivo);
        var elegido = contenedor && contenedor.querySelector('.sgtl-opcion-estado-cabecera input:checked');
        return elegido ? elegido.value : '';
    }

    var radioYaElegido = null;

    document.addEventListener('pointerdown', function (evento) {
        var cabecera = evento.target.closest && evento.target.closest('[data-sgtl-opcional="true"] .sgtl-opcion-estado-cabecera');
        var radio = cabecera && cabecera.querySelector('input');
        radioYaElegido = radio && radio.checked ? radio : null;
    });

    document.addEventListener('click', function (evento) {
        if (!radioYaElegido || evento.target !== radioYaElegido) return;
        radioYaElegido = null;
        evento.target.checked = false;
        evento.target.dispatchEvent(new Event('change', { bubbles: true }));
    });

    document.addEventListener('change', function (evento) {
        var contenedor = evento.target.closest && evento.target.closest('.sgtl-opciones-estado');
        if (!contenedor) return;
        contenedor.classList.remove('is-invalid');
        contenedor.querySelectorAll('.sgtl-opcion-estado').forEach(function (tarjeta) {
            tarjeta.classList.toggle('seleccionada', tarjeta.querySelector('.sgtl-opcion-estado-cabecera input').checked);
        });
    });

    function llenar(tbody, html) {
        var cuerpo = elemento(tbody);
        if (!cuerpo) return;
        ocultarTooltips();
        cuerpo.innerHTML = html;
    }

    function filaMensaje(tbody, columnas, texto) {
        llenar(tbody, '<tr><td colspan="' + columnas + '" class="text-center text-muted py-4">' + escapar(texto) + '</td></tr>');
    }

    function habilitarOrden(objetivo, alCambiar, ordenInicial) {
        var tablaElemento = elemento(objetivo);
        var botones = tablaElemento ? tablaElemento.querySelectorAll('th button[data-sgtl-orden]') : [];
        var campo = ordenInicial && ordenInicial.orden || '';
        var direccion = ordenInicial && ordenInicial.direccion || '';

        function actualizar() {
            botones.forEach(function (boton) {
                var activo = boton.getAttribute('data-sgtl-orden') === campo;
                var ascendente = direccion === 'asc';
                var icono = boton.querySelector('i');
                if (activo) boton.closest('th').setAttribute('aria-sort', ascendente ? 'ascending' : 'descending');
                else boton.closest('th').removeAttribute('aria-sort');
                if (icono) icono.className = 'bi ' + (activo ? (ascendente ? 'bi-arrow-up' : 'bi-arrow-down') : 'bi-arrow-down-up') + ' ms-1';
                boton.setAttribute('aria-label', 'Ordenar por ' + boton.textContent.trim() + ' en orden ' + (activo && ascendente ? 'descendente' : 'ascendente'));
            });
        }

        botones.forEach(function (boton) {
            boton.addEventListener('click', function () {
                var nuevo = boton.getAttribute('data-sgtl-orden');
                direccion = nuevo === campo && direccion === 'asc' ? 'desc' : 'asc';
                campo = nuevo;
                actualizar();
                if (typeof alCambiar === 'function') alCambiar();
            });
        });
        actualizar();

        return {
            parametros: function () { return campo ? { orden: campo, direccion: direccion } : {}; }
        };
    }

    var TAMANIOS_PAGINA = [5, 10, 15, 0];

    function botonPagina(destino, deshabilitado, icono, texto) {
        return '<li class="page-item' + (deshabilitado ? ' disabled' : '') + '">' +
            '<button type="button" class="page-link" data-pagina="' + destino + '" aria-label="' + texto + '"' + (deshabilitado ? ' disabled' : '') + '>' +
            '<i class="bi ' + icono + '" aria-hidden="true"></i></button></li>';
    }

    function paginacion(contenedor, opciones) {
        var el = elemento(contenedor);
        if (!el) return;
        opciones = opciones || {};
        var total = Number(opciones.total) || 0;
        el.classList.toggle('d-none', !total);
        if (!total) return;
        var elegido = opciones.tamanioPagina == null ? 15 : Number(opciones.tamanioPagina);
        var tamanio = elegido || total;
        var paginas = Math.ceil(total / tamanio);
        var pagina = Math.min(Math.max(Number(opciones.pagina) || 1, 1), paginas);
        var opcionesTamanio = TAMANIOS_PAGINA.map(function (valor) {
            return '<option value="' + valor + '"' + (valor === elegido ? ' selected' : '') + '>' + (valor || 'Todos') + '</option>';
        }).join('');

        el.className = 'pagination pagination-sm justify-content-end align-items-center flex-wrap gap-2 mt-3 mb-0';
        el.innerHTML =
            '<li class="me-3"><label class="d-flex align-items-center gap-2 small text-muted mb-0">Filas por página' +
            '<select class="form-select form-select-sm w-auto">' + opcionesTamanio + '</select></label></li>' +
            '<li class="small text-nowrap me-2">' + ((pagina - 1) * tamanio + 1) + '-' + Math.min(pagina * tamanio, total) + ' de ' + total + '</li>' +
            botonPagina(pagina - 1, pagina === 1, 'bi-chevron-left', 'Página anterior') +
            botonPagina(pagina + 1, pagina === paginas, 'bi-chevron-right', 'Página siguiente');
        el.onclick = function (evento) {
            var boton = evento.target.closest('[data-pagina]');
            if (boton && opciones.alCambiarPagina) opciones.alCambiarPagina(Number(boton.dataset.pagina));
        };
        el.onchange = function (evento) {
            if (opciones.alCambiarTamanio) opciones.alCambiarTamanio(Number(evento.target.value));
        };
    }

    var tabla = {
        cargando: function (tbody, columnas) { filaMensaje(tbody, columnas, 'Cargando…'); },
        vacia: function (tbody, columnas, texto) { filaMensaje(tbody, columnas, texto || 'No hay resultados para los filtros elegidos.'); },
        llenar: llenar,
        habilitarOrden: habilitarOrden,
        paginacion: paginacion
    };

    function marcarConValor(envoltura) {
        var campo = envoltura.querySelector('input, select, textarea');
        envoltura.classList.toggle('con-valor', campo.value.trim() !== '');
    }

    document.addEventListener('click', function (evento) {
        var cruz = evento.target.closest && evento.target.closest('.sgtl-filtro-borrar');
        if (!cruz) return;
        var envoltura = cruz.closest('.sgtl-filtro');
        var campo = envoltura.querySelector('input, select, textarea');
        if (campo._flatpickr) campo._flatpickr.clear();
        else campo.value = '';
        marcarConValor(envoltura);
        envoltura._sgtlBuscar();
    });

    function filtros(campos, buscar) {
        var envolturas = [].concat(campos).map(elemento).filter(Boolean).map(function (campo) {
            var fp = campo._flatpickr;
            var visible = fp && fp.altInput ? fp.altInput : campo;
            var etiqueta = campo.id && document.querySelector('label[for="' + campo.id + '"]');
            var nombre = etiqueta ? etiqueta.textContent.trim().toLowerCase() : '';
            var envoltura = document.createElement('div');
            envoltura.className = 'sgtl-filtro';
            envoltura._sgtlBuscar = buscar;
            campo.before(envoltura);
            envoltura.appendChild(campo);
            if (visible !== campo) envoltura.appendChild(visible);
            envoltura.insertAdjacentHTML('beforeend', '<button type="button" class="sgtl-filtro-borrar" aria-label="' +
                escapar(nombre ? 'Borrar ' + nombre : 'Borrar filtro') + '"><i class="bi bi-x-lg" aria-hidden="true"></i></button>');

            function actualizar() { marcarConValor(envoltura); }

            [campo, visible].forEach(function (el) {
                el.addEventListener('input', actualizar);
                el.addEventListener('change', actualizar);
            });
            if (fp) fp.config.onChange.push(actualizar);

            visible.addEventListener('keydown', function (evento) {
                if (evento.key !== 'Enter') return;
                evento.preventDefault();
                if (fp) {
                    if (fp.config.allowInput && visible.value.trim()) fp.setDate(visible.value, false, fp.config.altFormat);
                    fp.close();
                }
                actualizar();
                buscar();
            });

            actualizar();
            return envoltura;
        });

        return {
            actualizar: function () { envolturas.forEach(marcarConValor); }
        };
    }

    function celdaCSV(valor) {
        return '"' + String(valor == null ? '' : valor).replace(/"/g, '""') + '"';
    }

    function descargarCSV(nombreArchivo, encabezados, filas) {
        var lineas = [encabezados].concat(filas).map(function (fila) { return fila.map(celdaCSV).join(';'); });
        var url = URL.createObjectURL(new Blob(['\ufeff' + lineas.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' }));
        var enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreArchivo;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function dosCifras(n) {
        return String(n).padStart(2, '0');
    }

    function aFecha(valor) {
        if (valor == null || valor === '') return null;
        if (!(valor instanceof Date)) {
            var soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
            valor = soloFecha ? new Date(soloFecha[1], soloFecha[2] - 1, soloFecha[3]) : new Date(String(valor));
        }
        return isNaN(valor.getTime()) ? null : valor;
    }

    function fecha(valor, opciones) {
        var d = aFecha(valor);
        if (!d) return '';
        opciones = opciones || {};
        var texto = dosCifras(d.getDate()) + '/' + dosCifras(d.getMonth() + 1) + '/' + d.getFullYear();
        if (opciones.hora || opciones.segundos) texto += ' ' + dosCifras(d.getHours()) + ':' + dosCifras(d.getMinutes());
        if (opciones.segundos) texto += ':' + dosCifras(d.getSeconds());
        return texto;
    }

    function fechaISO(valor) {
        var d = aFecha(valor);
        return d ? d.getFullYear() + '-' + dosCifras(d.getMonth() + 1) + '-' + dosCifras(d.getDate()) : '';
    }

    function leerFecha(texto) {
        var partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(texto == null ? '' : texto).trim());
        var d = partes && new Date(partes[3], partes[2] - 1, partes[1]);
        return d && fecha(d) === partes[0] ? d : null;
    }

    var FORMATO_MONTO = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
    var FORMATO_MONTO_REDONDO = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    var FORMATO_MONTO_CAMPO = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    var FORMATO_KM = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    function numeroConFormato(valor, formato) {
        var n = Number(valor);
        return valor == null || valor === '' || !isFinite(n) ? '' : formato.format(n);
    }

    function monto(valor, opciones) {
        return numeroConFormato(valor, opciones && opciones.sinDecimales ? FORMATO_MONTO_REDONDO : FORMATO_MONTO);
    }

    function km(valor) {
        return numeroConFormato(valor, FORMATO_KM);
    }

    var MONTO_ARGENTINO = /^(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d{0,2}))?$/;
    var MONTO_PUNTO_DECIMAL = /^(\d+)\.(\d{1,2})$/;

    function montoCentavos(valor) {
        if (typeof valor === 'number') {
            var centavos = Math.round(valor * 100);
            return isFinite(valor) && valor >= 0 && Math.abs(valor * 100 - centavos) < 0.000001 ? centavos : null;
        }
        var texto = String(valor == null ? '' : valor).replace(/\s/g, '');
        var partes = MONTO_ARGENTINO.exec(texto) || MONTO_PUNTO_DECIMAL.exec(texto);
        if (!partes) return null;
        var entero = Number(partes[1].replace(/\./g, ''));
        if (entero > 90071992547409) return null;
        return entero * 100 + Number(((partes[2] || '') + '00').slice(0, 2));
    }

    function formatearMontoCentavos(centavos) {
        var valor = Number(centavos);
        return Number.isInteger(valor) && valor >= 0 ? FORMATO_MONTO_CAMPO.format(valor / 100) : '';
    }

    function enlazarMascaraMonto(objetivo) {
        var input = elemento(objetivo);
        if (!input) return null;
        input.addEventListener('blur', function () {
            var centavos = montoCentavos(input.value);
            if (centavos != null) input.value = formatearMontoCentavos(centavos);
        });
        return input;
    }

    function calendario(objetivo, base, opciones) {
        var input = elemento(objetivo);
        if (!input || typeof window.flatpickr !== 'function') return null;
        if (window.flatpickr.l10ns && window.flatpickr.l10ns.es) base.locale = 'es';
        var fp = window.flatpickr(input, Object.assign(base, opciones));
        if (fp.calendarContainer) fp.calendarContainer.addEventListener('focusin', function (evento) { evento.stopPropagation(); });
        return fp;
    }

    function selectorFecha(objetivo, opciones) {
        return calendario(objetivo, { dateFormat: 'd/m/Y', allowInput: true }, opciones);
    }

    function rangoFechas(objetivo, opciones) {
        return calendario(objetivo, {
            mode: 'range',
            showMonths: window.innerWidth < 768 ? 1 : 2,
            altInput: true,
            altFormat: 'd/m/Y',
            dateFormat: 'Y-m-d',
            allowInput: true,
            altInputClass: 'form-control input sgtl-rango-fechas'
        }, opciones);
    }

    function valorRango(objetivo) {
        var input = elemento(objetivo);
        var fp = input && input._flatpickr;
        if (!fp || !fp.selectedDates.length) return null;
        return { desde: fechaISO(fp.selectedDates[0]), hasta: fechaISO(fp.selectedDates[fp.selectedDates.length - 1]) };
    }

    var REVISA_CAMPOS = 'Revisá los campos marcados.';

    function avisoFormulario(objetivo, texto, detalle) {
        var aviso = elemento(objetivo);
        if (!aviso) return;
        aviso.textContent = texto || '';
        if (texto && detalle && detalle.length) {
            aviso.insertAdjacentHTML('beforeend', '<ul class="sgtl-aviso-lista">' + detalle.map(function (linea) {
                return '<li>' + escapar(linea) + '</li>';
            }).join('') + '</ul>');
        }
        aviso.style.display = texto ? '' : 'none';
        aviso.classList.toggle('d-none', !texto);
        if (texto === REVISA_CAMPOS) seVaSinCamposMarcados(aviso);
    }

    function seVaSinCamposMarcados(aviso) {
        var contenedor = aviso.closest('.modal-content, form, .card') || aviso.parentElement;
        if (!contenedor || aviso.dataset.sgtlSeVa) return;
        aviso.dataset.sgtlSeVa = 'true';
        function siYaNoHay() {
            setTimeout(function () {
                if (aviso.textContent === REVISA_CAMPOS && !contenedor.querySelector('.is-invalid')) avisoFormulario(aviso, '');
            }, 0);
        }
        ['input', 'change', 'focusout'].forEach(function (tipo) { contenedor.addEventListener(tipo, siYaNoHay); });
    }

    function revisarFormulario(form, aviso) {
        var contenedor = elemento(form);
        var primero = contenedor && contenedor.querySelector('.is-invalid');
        avisoFormulario(aviso, primero ? REVISA_CAMPOS : '');
        if (primero) primero.focus();
        return !primero;
    }

    function reiniciarFormulario(form, aviso) {
        var contenedor = elemento(form);
        if (!contenedor) return;
        if (typeof contenedor.reset === 'function') contenedor.reset();
        contenedor.querySelectorAll('.is-invalid').forEach(function (campo) { campo.classList.remove('is-invalid'); });
        contenedor.querySelectorAll('.invalid-feedback').forEach(function (feedback) { feedback.textContent = ''; });
        avisoFormulario(aviso, '');
    }

    function validador(reglas) {
        function campoDe(regla) {
            return document.getElementById(regla.id);
        }

        function errorDe(regla) {
            var campo = campoDe(regla);
            if (!campo || campo.disabled) return '';
            var valor = campo.value.trim();
            if (!valor) return regla.requerido || '';
            if (regla.regex && !regla.regex.test(valor)) return regla.mensaje || '';
            return (regla.validar && regla.validar(valor, campo)) || campo.dataset.errorRemoto || '';
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

            function validarSiHaceFalta() {
                if (campo.value.trim() || campo.classList.contains('is-invalid')) validar(regla);
            }

            campo.addEventListener('blur', validarSiHaceFalta);
            campo.addEventListener('change', validarSiHaceFalta);
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
            validarTodo: function () {
                return reglas.map(validar).every(Boolean);
            },
            validar: function (id) {
                var regla = reglas.find(function (r) { return r.id === id; });
                return regla ? validar(regla) : true;
            },
            reiniciar: function () {
                reglas.forEach(function (regla) {
                    var campo = campoDe(regla);
                    if (campo) delete campo.dataset.errorRemoto;
                });
            }
        };
    }

    function cambiosSinGuardar(objetivo) {
        var ventana = elemento(objetivo);
        var cuerpo = ventana && ventana.querySelector('.modal-body');
        if (!cuerpo) return { limpiar: function () { } };
        var hayCambios = false;
        cuerpo.insertAdjacentHTML('afterbegin',
            '<div class="alert alert-light-warning d-none" role="alert" data-sin-cambios>' +
            '<div class="mb-2">Tenés cambios sin guardar. Si cerrás, se pierden.</div>' +
            '<button type="button" class="btn btn-sm btn-light-secondary" data-sgtl="seguir">Seguir editando</button>' +
            '<button type="button" class="btn btn-sm btn-danger ms-1" data-sgtl="descartar">Descartar cambios</button></div>');
        var aviso = cuerpo.firstElementChild;

        function limpiar() {
            hayCambios = false;
            aviso.classList.add('d-none');
        }

        function marcar(evento) {
            if (!evento.target.disabled && !evento.target.closest('[data-sin-cambios]')) hayCambios = true;
        }

        ventana.addEventListener('input', marcar);
        ventana.addEventListener('change', marcar);
        ventana.addEventListener('hide.bs.modal', function (evento) {
            if (evento.target !== ventana || !hayCambios) return;
            evento.preventDefault();
            aviso.classList.remove('d-none');
            cuerpo.scrollTop = 0;
        });
        ventana.addEventListener('hidden.bs.modal', function (evento) {
            if (evento.target === ventana) limpiar();
        });
        aviso.querySelector('[data-sgtl="seguir"]').addEventListener('click', function () {
            aviso.classList.add('d-none');
            ventana.focus();
        });
        aviso.querySelector('[data-sgtl="descartar"]').addEventListener('click', function () {
            limpiar();
            modal(ventana, 'hide');
        });
        return { limpiar: limpiar };
    }

    function textoRegistro(usuarioAlta, fechaAlta, usuarioModi, fechaModi) {
        var partes = [];
        if (usuarioAlta || fechaAlta) partes.push('Registrado' + (usuarioAlta ? ' por ' + usuarioAlta : '') + (fechaAlta ? ' el ' + fechaAlta : ''));
        if (fechaModi && fechaModi !== fechaAlta) partes.push('Modificado' + (usuarioModi ? ' por ' + usuarioModi : '') + ' el ' + fechaModi);
        return partes.join(' · ');
    }

    window.SGTL = {
        escapar: escapar,
        modal: modal,
        mensajeError: mensajeError,
        ajax: ajax,
        api: API,
        encabezados: encabezados,
        procesando: procesando,
        marcarError: marcarError,
        limpiarError: limpiarError,
        confirmar: confirmar,
        colorEstado: colorEstado,
        estado: estado,
        estadoViaje: estadoViaje,
        textoEstadoViaje: textoEstadoViaje,
        estadosViaje: estadosViaje,
        ocultarTooltips: ocultarTooltips,
        botonFila: botonFila,
        accionesFila: accionesFila,
        botonInfo: botonInfo,
        conInfo: conInfo,
        opcionesEstado: opcionesEstado,
        estadoElegido: estadoElegido,
        tabla: tabla,
        filtros: filtros,
        descargarCSV: descargarCSV,
        fecha: fecha,
        fechaISO: fechaISO,
        leerFecha: leerFecha,
        monto: monto,
        km: km,
        montoCentavos: montoCentavos,
        formatearMontoCentavos: formatearMontoCentavos,
        enlazarMascaraMonto: enlazarMascaraMonto,
        selectorFecha: selectorFecha,
        rangoFechas: rangoFechas,
        valorRango: valorRango,
        avisoFormulario: avisoFormulario,
        revisarFormulario: revisarFormulario,
        reiniciarFormulario: reiniciarFormulario,
        validador: validador,
        cambiosSinGuardar: cambiosSinGuardar,
        textoRegistro: textoRegistro,
        toastExito: function (mensaje) { mostrarAviso('exito', mensaje); },
        toastError: function (mensaje) { mostrarAviso('error', mensaje); }
    };
})();