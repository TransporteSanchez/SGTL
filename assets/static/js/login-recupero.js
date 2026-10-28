(function () {
    'use strict';
    var API = 'http://localhost:50222/api/recupero-contrasena';
    var token = '';
    var enviando = false;
    var restableciendo = false;
    function campo(id) { return document.getElementById(id); }

    var login = SGTL.validador([
        { id: 'username', requerido: 'Completá el usuario.' },
        { id: 'password', requerido: 'Completá la contraseña.' }
    ]);
    window.validarFormularioLogin = function () {
        login.validarTodo();
        return SGTL.revisarFormulario('#loginForm', '#avisoLogin');
    };

    // Se retira antes de iniciar cualquier consulta o cargar recursos de terceros.
    var fragmento = window.location.hash || '';
    if (fragmento.indexOf('#recupero=') === 0) {
        token = fragmento.slice('#recupero='.length);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    var formulario = SGTL.validador([
        { id: 'recuperoEmail', requerido: 'Completá el e-mail.', max: 254,
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, mensaje: 'Escribí un e-mail válido.' }
    ]);
    var contrasenas = SGTL.validador([
        { id: 'recuperoNueva', requerido: 'Completá la contraseña nueva.', max: 20,
            validar: function (valor, input) {
                var clave = input.value;
                return clave.length >= 8 && clave.length <= 20 && /[A-Za-z]/.test(clave) && /[0-9]/.test(clave)
                    ? '' : 'Usá entre 8 y 20 caracteres, con al menos una letra y un número.';
            } },
        { id: 'recuperoRepetir', requerido: 'Repetí la contraseña nueva.', max: 20,
            validar: function (valor, input) { return input.value === campo('recuperoNueva').value ? '' : 'Las contraseñas no coinciden.'; } }
    ]);

    async function pedir(ruta, datos, porDefecto) {
        var respuesta;
        try {
            respuesta = await fetch(API + ruta, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
                body: JSON.stringify(datos), referrerPolicy: 'no-referrer'
            });
        } catch (error) { throw new Error('No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.'); }
        var resultado = await respuesta.json().catch(function () { return {}; });
        if (!respuesta.ok) throw new Error(typeof resultado.error === 'string' ? resultado.error : porDefecto);
        return resultado;
    }

    campo('btnOlvideContrasena').addEventListener('click', function () {
        SGTL.reiniciarFormulario('#formRecupero', '#avisoRecupero');
        formulario.reiniciar();
        SGTL.modal('#modalRecupero', 'show');
    });
    campo('formRecupero').addEventListener('submit', async function (evento) {
        evento.preventDefault();
        if (enviando) return;
        formulario.validarTodo();
        if (!SGTL.revisarFormulario('#formRecupero', '#avisoRecupero')) return;
        enviando = true;
        var listo = SGTL.procesando('#btnEnviarRecupero', 'Enviando…');
        try {
            var resultado = await pedir('/solicitar', { Email: campo('recuperoEmail').value.trim() }, 'No se pudo solicitar el recupero de contraseña. Probá de nuevo.');
            listo();
            SGTL.modal('#modalRecupero', 'hide');
            SGTL.toastExito(resultado.mensaje);
        } catch (error) { SGTL.avisoFormulario('#avisoRecupero', error.message); }
        finally { enviando = false; listo(); }
    });
    campo('formRestablecer').addEventListener('submit', async function (evento) {
        evento.preventDefault();
        if (restableciendo) return;
        contrasenas.validarTodo();
        if (!SGTL.revisarFormulario('#formRestablecer', '#avisoRestablecer')) return;
        restableciendo = true;
        var listo = SGTL.procesando('#btnRestablecerContrasena', 'Restableciendo…');
        try {
            var resultado = await pedir('/restablecer', {
                Token: token, ContrasenaNueva: campo('recuperoNueva').value, RepetirContrasena: campo('recuperoRepetir').value
            }, 'No se pudo restablecer la contraseña. Probá de nuevo.');
            token = '';
            campo('formRestablecer').reset();
            campo('password').value = '';
            // Este navegador también vuelve a ingresar; no se inicia una sesión automáticamente.
            ['token', 'username', 'userRole', 'nombre', 'apellido', 'sgtlSoloHojaDeRuta'].forEach(function (clave) {
                try { localStorage.removeItem(clave); } catch (error) { }
            });
            listo();
            SGTL.modal('#modalRestablecer', 'hide');
            SGTL.toastExito(resultado.mensaje);
            campo('username').focus();
        } catch (error) { SGTL.avisoFormulario('#avisoRestablecer', error.message); }
        finally { restableciendo = false; listo(); }
    });
    if (fragmento.indexOf('#recupero=') === 0) {
        SGTL.modal('#modalRestablecer', 'show');
        if (!/^[A-Za-z0-9_-]{43}$/.test(token))
            SGTL.avisoFormulario('#avisoRestablecer', 'El enlace no es válido o venció. Solicitá un nuevo recupero de contraseña.');
    }
    if (window.jQuery) {
        window.jQuery('#modalRecupero').on('shown.bs.modal', function () { campo('recuperoEmail').focus(); });
        window.jQuery('#modalRestablecer').on('shown.bs.modal', function () { campo('recuperoNueva').focus(); });
    }
})();
