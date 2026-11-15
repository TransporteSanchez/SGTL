(function () {
    'use strict';

    var API = SGTL.api + '/facturacion-config';
    var sucursales = [];
    var sucursalEditada = null;
    var numeradores = [];
    var numeradorEditado = null;

    function porId(id) {
        return document.getElementById(id);
    }

    function pedir(ruta, metodo, cuerpo) {
        var opciones = { method: metodo || 'GET', headers: SGTL.encabezados({ Accept: 'application/json' }) };
        if (cuerpo !== undefined) {
            opciones.headers['Content-Type'] = 'application/json';
            opciones.body = JSON.stringify(cuerpo);
        }
        return fetch(API + ruta, opciones).catch(function () {
            throw new Error('No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.');
        }).then(function (respuesta) {
            return respuesta.json().catch(function () { return null; }).then(function (datos) {
                if (respuesta.ok) return datos;
                var error = new Error(respuesta.status === 401 ? SGTL.mensajeError({ status: 401 })
                    : (datos && datos.error) || 'No se pudo completar la operación. Probá de nuevo.');
                error.codigo = datos && datos.codigo;
                error.mensajeUsuario = error.message;
                throw error;
            });
        });
    }

    function acciones(id, activo, puedeEliminar) {
        var botones = [
            SGTL.botonFila('editar', { id: id }),
            SGTL.botonFila(activo ? 'inactivar' : 'activar', { id: id })
        ];
        if (puedeEliminar) botones.push(SGTL.botonFila('eliminar', { id: id }));
        return SGTL.accionesFila(botones);
    }

    function estado(activo) {
        return SGTL.estado(activo ? 'Activo' : 'Inactivo');
    }

    function cargar() {
        return Promise.all([pedir('/sucursales'), pedir('/numeradores')]).then(function (datos) {
            sucursales = datos[0];
            numeradores = datos[1];
            mostrarSucursales();
            mostrarNumeradores();
        }).catch(function (error) {
            SGTL.tabla.vacia('#sucursalesBody', 4, 'No se pudo cargar la configuración.');
            SGTL.tabla.vacia('#numeradoresBody', 4, 'No se pudo cargar la configuración.');
            SGTL.toastError(error.message);
        });
    }

    function mostrarSucursales() {
        if (!sucursales.length) {
            SGTL.tabla.vacia('#sucursalesBody', 4, 'Todavía no hay sucursales registradas.');
            return;
        }
        SGTL.tabla.llenar('#sucursalesBody', sucursales.map(function (sucursal) {
            return '<tr><td>' + SGTL.escapar(sucursal.Codigo) + '</td><td>' + SGTL.escapar(sucursal.Nombre) + '</td>'
                + '<td class="text-center">' + estado(sucursal.Activa) + '</td>'
                + '<td class="text-center">' + acciones(sucursal.SucursalID, sucursal.Activa, sucursal.PuedeEliminar) + '</td></tr>';
        }).join(''));
    }

    function mostrarNumeradores() {
        if (!numeradores.length) {
            SGTL.tabla.vacia('#numeradoresBody', 4, 'Todavía no hay numeradores registrados.');
            return;
        }
        SGTL.tabla.llenar('#numeradoresBody', numeradores.map(function (numerador) {
            return '<tr><td>' + SGTL.escapar(numerador.Nombre) + '</td><td>' + String(numerador.UltimoNumero).padStart(8, '0') + '</td>'
                + '<td class="text-center">' + estado(numerador.Activo) + '</td>'
                + '<td class="text-center">' + acciones(numerador.NumeradorID, numerador.Activo, numerador.PuedeEliminar) + '</td></tr>';
        }).join(''));
    }

    function cambiarEstado(boton, ruta, activo, mensaje) {
        var listo = SGTL.procesando(boton);
        pedir(ruta + '/estado', 'PUT', { Activo: activo }).then(function () {
            listo();
            SGTL.toastExito(mensaje);
            cargar();
        }).catch(function (error) {
            listo();
            SGTL.toastError(error.message);
        });
    }

    function eliminar(ruta, titulo, mensaje) {
        SGTL.confirmar({
            titulo: titulo,
            mensaje: 'No se puede deshacer.',
            verbo: 'Eliminar',
            peligro: true,
            accion: function () { return pedir(ruta, 'DELETE'); }
        }).then(function (eliminado) {
            if (eliminado) SGTL.toastExito(mensaje);
            cargar();
        });
    }

    function guardado(modal, cambios, mensaje) {
        cambios.limpiar();
        SGTL.modal(modal, 'hide');
        SGTL.toastExito(mensaje);
        cargar();
    }

    var validarSucursal = SGTL.validador([
        { id: 'sucursalCodigo', requerido: 'Completá el código.', soloNumeros: true, max: 4 },
        { id: 'sucursalNombre', requerido: 'Completá el nombre.' }
    ]);
    var cambiosSucursal = SGTL.cambiosSinGuardar('#sucursalModal');

    function abrirSucursal(sucursal) {
        sucursalEditada = sucursal;
        SGTL.reiniciarFormulario('#sucursalForm', '#sucursalAviso');
        validarSucursal.reiniciar();
        var codigoFijo = !!sucursal && !sucursal.PuedeCambiarCodigo;
        porId('sucursalTitulo').textContent = sucursal ? 'Editar sucursal' : 'Registrar sucursal';
        porId('sucursalCodigo').value = sucursal ? sucursal.Codigo : '';
        porId('sucursalNombre').value = sucursal ? sucursal.Nombre : '';
        porId('sucursalCodigoTexto').textContent = porId('sucursalCodigo').value;
        porId('sucursalCodigoCampo').classList.toggle('d-none', codigoFijo);
        porId('sucursalCodigoTexto').classList.toggle('d-none', !codigoFijo);
        porId('sucursalFija').classList.toggle('d-none', !codigoFijo);
        SGTL.modal('#sucursalModal', 'show');
    }

    function guardarSucursal(evento) {
        evento.preventDefault();
        validarSucursal.validarTodo();
        if (!SGTL.revisarFormulario('#sucursalForm', '#sucursalAviso')) return;
        var listo = SGTL.procesando(evento.submitter);
        var cuerpo = { Codigo: porId('sucursalCodigo').value.trim(), Nombre: porId('sucursalNombre').value.trim() };
        var pedido = sucursalEditada ? pedir('/sucursales/' + sucursalEditada.SucursalID, 'PUT', cuerpo) : pedir('/sucursales', 'POST', cuerpo);
        pedido.then(function () {
            listo();
            guardado('#sucursalModal', cambiosSucursal, 'Sucursal guardada.');
        }).catch(function (error) {
            listo();
            SGTL.avisoFormulario('#sucursalAviso', error.message);
        });
    }

    var validarNumerador = SGTL.validador([
        { id: 'numeradorNombre', requerido: 'Completá el nombre.' },
        { id: 'numeradorUltimo', requerido: 'Completá el último número.', soloNumeros: true, max: 8 }
    ]);
    var cambiosNumerador = SGTL.cambiosSinGuardar('#numeradorModal');

    function abrirNumerador(numerador) {
        numeradorEditado = numerador;
        SGTL.reiniciarFormulario('#numeradorForm', '#numeradorAviso');
        validarNumerador.reiniciar();
        porId('numeradorTitulo').textContent = numerador ? 'Editar numerador' : 'Registrar numerador';
        porId('numeradorNombre').value = numerador ? numerador.Nombre : '';
        porId('numeradorUltimo').value = numerador ? numerador.UltimoNumero : '0';
        SGTL.modal('#numeradorModal', 'show');
    }

    function guardarNumerador(evento) {
        evento.preventDefault();
        validarNumerador.validarTodo();
        if (!SGTL.revisarFormulario('#numeradorForm', '#numeradorAviso')) return;
        var listo = SGTL.procesando(evento.submitter);
        var cuerpo = { Nombre: porId('numeradorNombre').value.trim(), UltimoNumero: Number(porId('numeradorUltimo').value) };
        var pedido;
        if (numeradorEditado) {
            cuerpo.UltimoNumeroLeido = numeradorEditado.UltimoNumero;
            pedido = pedir('/numeradores/' + numeradorEditado.NumeradorID, 'PUT', cuerpo);
        } else {
            pedido = pedir('/numeradores', 'POST', cuerpo);
        }
        pedido.then(function () {
            listo();
            guardado('#numeradorModal', cambiosNumerador, 'Numerador guardado.');
        }).catch(function (error) {
            listo();
            SGTL.avisoFormulario('#numeradorAviso', error.message);
            if (error.codigo === 'NUMERO_CAMBIADO') cargar().then(numeroActual);
        });
    }

    function numeroActual() {
        var actual = numeradores.find(function (n) { return n.NumeradorID === numeradorEditado.NumeradorID; });
        if (!actual) return;
        numeradorEditado = actual;
        porId('numeradorUltimo').value = actual.UltimoNumero;
    }

    porId('sucursalesBody').addEventListener('click', function (evento) {
        var boton = evento.target.closest('[data-accion]');
        var sucursal = boton && sucursales.find(function (s) { return s.SucursalID === Number(boton.dataset.id); });
        if (!sucursal) return;
        var ruta = '/sucursales/' + sucursal.SucursalID;
        if (boton.dataset.accion === 'editar') abrirSucursal(sucursal);
        else if (boton.dataset.accion === 'eliminar') eliminar(ruta, '¿Eliminar la sucursal ' + sucursal.Codigo + '?', 'Sucursal eliminada.');
        else cambiarEstado(boton, ruta, !sucursal.Activa, sucursal.Activa ? 'Sucursal inactivada.' : 'Sucursal activada.');
    });

    porId('numeradoresBody').addEventListener('click', function (evento) {
        var boton = evento.target.closest('[data-accion]');
        var numerador = boton && numeradores.find(function (n) { return n.NumeradorID === Number(boton.dataset.id); });
        if (!numerador) return;
        var ruta = '/numeradores/' + numerador.NumeradorID;
        if (boton.dataset.accion === 'editar') abrirNumerador(numerador);
        else if (boton.dataset.accion === 'eliminar') eliminar(ruta, '¿Eliminar el numerador ' + numerador.Nombre + '?', 'Numerador eliminado.');
        else cambiarEstado(boton, ruta, !numerador.Activo, numerador.Activo ? 'Numerador inactivado.' : 'Numerador activado.');
    });

    porId('registrarSucursal').addEventListener('click', function () { abrirSucursal(null); });
    porId('sucursalForm').addEventListener('submit', guardarSucursal);
    porId('registrarNumerador').addEventListener('click', function () { abrirNumerador(null); });
    porId('numeradorForm').addEventListener('submit', guardarNumerador);

    SGTL.tabla.cargando('#sucursalesBody', 4);
    SGTL.tabla.cargando('#numeradoresBody', 4);
    cargar();
})();