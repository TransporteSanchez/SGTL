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

    // Evita que un modal encima de otro quede atrás y que un dato con solo espacios no muestre el guión.
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

    // Evita que al cerrar el modal de arriba la página quede como si no hubiera ninguno abierto.
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

    // Evita depender de Bootstrap.
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
            '<div class="alert alert-light-danger color-danger d-none" role="alert" data-sgtl="error"></div>' +
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

    // Evita que quede algo de la confirmación anterior: la ventana es una sola y se rearma cada vez.
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

    window.SGTL = {
        escapar: escapar,
        modal: modal,
        mensajeError: mensajeError,
        ajax: ajax,
        procesando: procesando,
        marcarError: marcarError,
        limpiarError: limpiarError,
        confirmar: confirmar,
        toastExito: function (mensaje) { mostrarAviso('exito', mensaje); },
        toastError: function (mensaje) { mostrarAviso('error', mensaje); }
    };
})();