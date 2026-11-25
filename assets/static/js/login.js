(function () {
    'use strict';

    const porId = id => document.getElementById(id);
    const formulario = porId('loginForm');
    const usuario = porId('username');
    const clave = porId('password');
    const botonIngresar = porId('btnIngresar');
    const aviso = porId('generalError');
    const solicitud = porId('solicitarRecuperoForm');
    const restablecer = porId('restablecerRecuperoForm');
    const nueva = porId('contrasenaNueva');
    const repeticion = porId('repetirContrasena');
    const reglaContrasena = porId('ayudaContrasenaNueva').textContent.trim();
    const enlaceInvalido = 'El enlace no es válido o venció. Solicitá un nuevo recupero de contraseña.';
    const titulos = {
        loginForm: 'Iniciar sesión',
        solicitarRecuperoForm: 'Recuperar contraseña',
        recuperoEnviado: 'Revisá tu e-mail',
        comprobarRecupero: 'Comprobar enlace',
        restablecerRecuperoForm: 'Restablecer contraseña',
        recuperoInvalido: 'Solicitar un nuevo enlace'
    };
    let enviando = false;
    let tokenRecupero = '';
    let tokenPendiente = null;

    const validacion = SGTL.validador([
        { id: 'username', requerido: 'Ingresá tu usuario.' },
        { id: 'password', requerido: 'Ingresá tu contraseña.' }
    ]);
    const validarSolicitud = SGTL.validador([
        {
            id: 'recuperoEmail',
            requerido: 'Ingresá tu e-mail.',
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            mensaje: 'Ingresá un e-mail válido.',
            validar: valor => valor.length > 254 ? 'Ingresá un e-mail válido.' : ''
        }
    ]);
    const validarRestablecer = SGTL.validador([
        {
            id: 'contrasenaNueva',
            requerido: 'Ingresá la contraseña nueva.',
            validar: (valor, campo) => {
                const texto = campo.value;
                const cumple = texto.length >= 8 &&
                    texto.length <= 20 &&
                    /[a-zA-Z]/.test(texto) &&
                    /[0-9]/.test(texto);

                return cumple ? '' : reglaContrasena;
            }
        },
        {
            id: 'repetirContrasena',
            requerido: 'Repetí la contraseña nueva.',
            validar: (valor, campo) =>
                campo.value === nueva.value
                    ? ''
                    : 'Las contraseñas no coinciden.'
        }
    ]);

    function prepararVisibilidad(campo, boton) {
        function mostrar(mostrarTexto) {
            campo.type = mostrarTexto ? 'text' : 'password';
            const icono = boton.querySelector('i');
            icono.classList.toggle('bi-eye', !mostrarTexto);
            icono.classList.toggle('bi-eye-slash', mostrarTexto);
            boton.setAttribute('aria-label', mostrarTexto ? 'Ocultar contraseña' : 'Mostrar contraseña');
            boton.setAttribute('aria-pressed', String(mostrarTexto));
        }
        boton.addEventListener('pointerdown', evento => {
            if (enviando || boton.disabled || evento.button !== 0 || !evento.isPrimary) return;
            evento.preventDefault();
            boton.setPointerCapture(evento.pointerId);
            mostrar(true);
        });
        ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach(tipo => {
            boton.addEventListener(tipo, () => mostrar(false));
        });
        boton.addEventListener('keydown', evento => {
            if (evento.key !== ' ' && evento.key !== 'Enter') return;
            evento.preventDefault();
            if (!enviando && !boton.disabled) mostrar(true);
        });
        boton.addEventListener('keyup', evento => {
            if (evento.key !== ' ' && evento.key !== 'Enter') return;
            evento.preventDefault();
            mostrar(false);
        });
        return () => mostrar(false);
    }

    const botonesMostrar = [
        porId('togglePassword'), porId('mostrarContrasenaNueva'), porId('mostrarRepetirContrasena')
    ];
    const ocultarClaves = [clave, nueva, repeticion].map((campo, i) => prepararVisibilidad(campo, botonesMostrar[i]));
    function ocultarContrasenas() { ocultarClaves.forEach(ocultar => ocultar()); }
    window.addEventListener('blur', ocultarContrasenas);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) ocultarContrasenas();
    });

    function mostrarVista(id, enfocar = true) {
        Object.keys(titulos).forEach(vista => porId(vista).classList.toggle('d-none', vista !== id));
        porId('tituloLogin').textContent = titulos[id];
        document.title = 'Transporte Sánchez - ' + titulos[id];
        SGTL.reiniciarFormulario(formulario, aviso);
        SGTL.reiniciarFormulario(solicitud, '#errorSolicitud');
        SGTL.reiniciarFormulario(restablecer, '#errorRestablecer');
        SGTL.avisoFormulario('#resultadoLogin', '');
        [validacion, validarSolicitud, validarRestablecer].forEach(v => v.reiniciar());
        ocultarContrasenas();
        if (id !== 'restablecerRecuperoForm' && id !== 'comprobarRecupero') {
            tokenRecupero = '';
        }
        if (enfocar) porId('tituloLogin').focus();
    }

    function mostrarEnlaceInvalido() {
        mostrarVista('recuperoInvalido');
        SGTL.avisoFormulario('#mensajeEnlaceInvalido', enlaceInvalido);
    }

    function hayEnlace() {
        return /^#recupero(?:=|&|$)/.test(window.location.hash);
    }

    function leerEnlace() {
        if (hayEnlace()) {
            const parametros = new URLSearchParams(window.location.hash.slice(1));
            const tokens = parametros.getAll('recupero');
            const token = tokens.length === 1 ? tokens[0] : '';
            // Se retira apenas llega, incluso si hay un pedido en curso.
            window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
            tokenPendiente = /^[A-Za-z0-9_-]{43}$/.test(token) ? token : '';
        }
        if (enviando || tokenPendiente === null) return;
        tokenRecupero = tokenPendiente;
        tokenPendiente = null;
        if (!tokenRecupero) {
            mostrarEnlaceInvalido();
            return;
        }
        comprobarEnlace();
    }

    async function comprobarEnlace() {
        if (enviando || !tokenRecupero) return;

        enviando = true;
        bloquearNavegacion(true);
        mostrarVista('comprobarRecupero');
        SGTL.avisoFormulario('#errorComprobacion', '');
        porId('estadoComprobacion').classList.remove('d-none');
        porId('reintentarComprobacion').classList.add('d-none');

        const porDefecto = 'No se pudo comprobar el enlace. Probá de nuevo.';

        try {
            const respuesta = await $.ajax({
                url: SGTL.api + '/recupero-contrasena/validar',
                method: 'POST',
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                timeout: 15000,
                data: JSON.stringify({ Token: tokenRecupero })
            });

            if (tokenPendiente !== null || hayEnlace()) return;

            if (respuesta && respuesta.vigente === true) {
                mostrarVista('restablecerRecuperoForm');
            } else {
                SGTL.avisoFormulario('#errorComprobacion', porDefecto);
                porId('reintentarComprobacion').classList.remove('d-none');
            }
        } catch (xhr) {
            if (tokenPendiente !== null || hayEnlace()) return;

            if (xhr.status === 400 &&
                xhr.responseJSON?.error === enlaceInvalido) {
                mostrarEnlaceInvalido();
            } else {
                SGTL.avisoFormulario(
                    '#errorComprobacion',
                    mensajeRecupero(xhr, porDefecto)
                );
                porId('reintentarComprobacion').classList.remove('d-none');
            }
        } finally {
            porId('estadoComprobacion').classList.add('d-none');
            bloquearNavegacion(false);
            enviando = false;
            leerEnlace();
        }
    }

    const navegacion = Array.from(document.querySelectorAll('[data-vista]'));
    navegacion.forEach(boton => {
        boton.addEventListener('click', () => {
            if (enviando) return;
            mostrarVista(boton.dataset.vista);
            porId(boton.dataset.vista === 'loginForm' ? 'username' : 'recuperoEmail').focus();
        });
    });
    window.addEventListener('hashchange', leerEnlace);
    porId('reintentarComprobacion').addEventListener('click', comprobarEnlace);
    nueva.addEventListener('input', () => {
        if (repeticion.value) validarRestablecer.validar('repetirContrasena');
    });

    function bloquearNavegacion(bloquear) {
        navegacion.concat(botonesMostrar).forEach(boton => { boton.disabled = bloquear; });
    }

    function mensajeRecupero(xhr, porDefecto) {
        if (xhr.status === 0) {
            return 'No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.';
        }

        if (xhr.status === 429) {
            return 'Esperá unos minutos antes de volver a intentar.';
        }

        const datos = xhr.responseJSON || {};

        if (xhr.status === 503 && datos.codigo === 'recupero_sin_configurar') {
            return 'Primero hay que configurar el servidor de e-mail para el recupero de contraseña. Comunicate con quien administra el sistema.';
        }

        if (xhr.status === 400) {
            switch (datos.error) {
                case 'La contraseña debe tener entre 8 y 20 caracteres.':
                case 'La contraseña debe incluir al menos una letra y un número.':
                    return reglaContrasena;
                case 'Las contraseñas no coinciden.':
                case 'Ingresá un e-mail válido.':
                    return datos.error;
                default:
                    return porDefecto;
            }
        }

        return xhr.status === 401
            ? porDefecto
            : SGTL.mensajeError(xhr, porDefecto);
    }

    async function enviarRecupero(form, validador, error, boton, ruta, datos, completar) {
        if (enviando) return;
        SGTL.avisoFormulario(error, '');
        if (!validador.validarTodo()) {
            SGTL.revisarFormulario(form, error);
            return;
        }
        enviando = true;
        ocultarContrasenas();
        bloquearNavegacion(true);
        const campos = Array.from(form.querySelectorAll('input'));
        campos.forEach(campo => { campo.readOnly = true; });
        const listo = SGTL.procesando(boton);
        const porDefecto = ruta === 'solicitar'
            ? 'No se pudo solicitar el recupero. Probá de nuevo.'
            : 'No se pudo restablecer la contraseña. Probá de nuevo.';
        try {
            const respuesta = await $.ajax({
                url: SGTL.api + '/recupero-contrasena/' + ruta,
                method: 'POST', contentType: 'application/json; charset=utf-8',
                dataType: 'json', timeout: 30000, data: JSON.stringify(datos())
            });
            if (!respuesta || typeof respuesta.mensaje !== 'string' || !respuesta.mensaje.trim()) {
                SGTL.avisoFormulario(error, porDefecto);
                return;
            }
            if (tokenPendiente === null && !hayEnlace()) completar(respuesta);
        } catch (xhr) {
            if (ruta === 'restablecer' && xhr.status === 400 &&
                xhr.responseJSON && xhr.responseJSON.error === enlaceInvalido) {
                mostrarEnlaceInvalido();
            } else {
                SGTL.avisoFormulario(error, mensajeRecupero(xhr, porDefecto));
            }
        } finally {
            listo();
            campos.forEach(campo => { campo.readOnly = false; });
            bloquearNavegacion(false);
            enviando = false;
            leerEnlace();
        }
    }

    solicitud.addEventListener('submit', evento => {
        evento.preventDefault();
        enviarRecupero(solicitud, validarSolicitud, '#errorSolicitud', '#btnSolicitarRecupero', 'solicitar',
            () => ({ Email: porId('recuperoEmail').value.trim() }), respuesta => {
                mostrarVista('recuperoEnviado');
                SGTL.avisoFormulario('#mensajeSolicitud', respuesta.mensaje);
            });
    });
    restablecer.addEventListener('submit', evento => {
        evento.preventDefault();
        if (enviando) return;
        if (!tokenRecupero) {
            mostrarEnlaceInvalido();
            return;
        }
        enviarRecupero(restablecer, validarRestablecer, '#errorRestablecer', '#btnRestablecer', 'restablecer',
            () => ({ Token: tokenRecupero, ContrasenaNueva: nueva.value, RepetirContrasena: repeticion.value }), respuesta => {
                mostrarVista('loginForm');
                SGTL.avisoFormulario('#resultadoLogin', respuesta.mensaje);
                usuario.focus();
            });
    });

    function cargarContenido() {
        $.ajax({
            url: SGTL.api + '/GestionContenido/1', method: 'GET', dataType: 'json', timeout: 15000
        }).done(datos => {
            const contenido = Array.isArray(datos) ? datos[0] : datos;
            if (!contenido || typeof contenido !== 'object') {
                SGTL.avisoFormulario('#contenidoFeedback',
                    'No se pudo cargar la configuración de la pantalla. Podés intentar ingresar.');
                return;
            }
            window.applyStyles(
                contenido.Logo,
                contenido.ColorFondo,
                contenido.ColorBotonesMenu,
                contenido.ContenidoPiePagina
            );

            if (typeof contenido.Logo === 'string' && contenido.Logo.trim()) {
                porId('logoIzquierdo').src = contenido.Logo.trim();
                porId('logoDerecho').src = contenido.Logo.trim();
            }
            if (typeof contenido.ContenidoPiePagina === 'string' && contenido.ContenidoPiePagina.trim()) {
                porId('footerContent').innerHTML = contenido.ContenidoPiePagina;
            }
        }).fail(() => {
            SGTL.avisoFormulario('#contenidoFeedback',
                'No se pudo cargar la configuración de la pantalla. Podés intentar ingresar.');
        }).always(() => { porId('contenidoEstado').classList.add('d-none'); });
    }

    function destinoIngreso() {
        const paginas = new Set([
            'index.html',
            'tableros.html',
            'configuracion-email.html',
            'configuracion-facturacion.html',
            'configuracion-whatsapp.html',
            'gestion-auditoria.html',
            'gestion-camiones.html',
            'gestion-choferes.html',
            'gestion-clientes.html',
            'gestion-contenido.html',
            'gestion-gruposypermisos.html',
            'gestion-origenes-destinos.html',
            'gestion-proformas.html',
            'gestion-tarifas.html',
            'gestion-usuarios.html',
            'gestion-viajes.html',
            'listado-camiones.html',
            'listado-choferes.html',
            'listado-clientes.html',
            'listado-proformas.html',
            'listado-usuarios.html',
            'listado-viajes.html'
        ]);

        const valores = new URLSearchParams(window.location.search)
            .getAll('volver');

        if (valores.length !== 1 || /[\\\u0000-\u001f\u007f]/.test(valores[0])) {
            return 'index.html';
        }

        const destino = /^(?:\.\/)?([a-z0-9-]+\.html)([?#].*)?$/i
            .exec(valores[0]);

        if (!destino) return 'index.html';

        const pagina = destino[1].toLowerCase();

        return paginas.has(pagina)
            ? pagina + (destino[2] || '')
            : 'index.html';
    }

    function mensajeDeError(xhr) {
        if (xhr.status === 0) {
            return 'No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.';
        }

        if (xhr.status === 400) return 'Ingresá el usuario y la contraseña.';
        if (xhr.status === 401) return 'Usuario o contraseña incorrectos.';
        if (xhr.status === 429) return 'Esperá unos minutos antes de volver a intentar.';

        return 'No se pudo iniciar sesión. Probá de nuevo.';
    }

    formulario.addEventListener('submit', evento => {
        evento.preventDefault();
        ocultarContrasenas();
        if (enviando) return;
        SGTL.avisoFormulario(aviso, '');
        if (!validacion.validarTodo()) {
            SGTL.revisarFormulario(formulario, aviso);
            return;
        }
        enviando = true;
        usuario.readOnly = true;
        clave.readOnly = true;
        bloquearNavegacion(true);
        const listo = SGTL.procesando(botonIngresar, 'Ingresando…');
        // El 401 del login representa credenciales incorrectas, no una sesión vencida.
        $.ajax({
            url: SGTL.api + '/login', method: 'POST',
            contentType: 'application/json; charset=utf-8', dataType: 'json', timeout: 30000,
            data: JSON.stringify({ Nombre_Usuario: usuario.value.trim(), Contraseña: clave.value })
        }).done(datos => {
            if (tokenPendiente !== null || hayEnlace()) return;
            if (!datos || typeof datos.Token !== 'string' || !datos.Token.trim() ||
                typeof datos.Nombre_Usuario !== 'string' || !datos.Nombre_Usuario.trim()) {
                SGTL.avisoFormulario(aviso, 'No se pudo completar el inicio de sesión. Probá de nuevo.');
                return;
            }
            const sesion = {
                token: datos.Token, username: datos.Nombre_Usuario, userRole: datos.Rol || '',
                nombre: datos.Nombre || '', apellido: datos.Apellido || ''
            };
            try {
                Object.entries(sesion).forEach(([nombre, valor]) => { localStorage.setItem(nombre, valor); });
                window.location.href = destinoIngreso();
            } catch {
                Object.keys(sesion).forEach(nombre => {
                    try { localStorage.removeItem(nombre); } catch { }
                });
                SGTL.avisoFormulario(aviso,
                    'No se pudo guardar la sesión. Revisá que el navegador permita el almacenamiento local.');
            }
        }).fail(xhr => {
            SGTL.avisoFormulario(aviso, mensajeDeError(xhr));
        }).always(() => {
            listo();
            usuario.readOnly = false;
            clave.readOnly = false;
            bloquearNavegacion(false);
            enviando = false;
            leerEnlace();
        });
    });

    leerEnlace();
    cargarContenido();
})();
