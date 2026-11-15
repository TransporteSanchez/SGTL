(function () {
    'use strict';

    var API = SGTL.api + '/facturacion-config';
    var sucursales = [];
    var sucursalEditada = null;

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
        return pedir('/sucursales').then(function (datos) {
            sucursales = datos;
            mostrarSucursales();
        }).catch(function (error) {
            SGTL.tabla.vacia('#sucursalesBody', 4, 'No se pudieron cargar las sucursales.');
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
            cambiosSucursal.limpiar();
            SGTL.modal('#sucursalModal', 'hide');
            SGTL.toastExito('Sucursal guardada.');
            cargar();
        }).catch(function (error) {
            listo();
            SGTL.avisoFormulario('#sucursalAviso', error.message);
        });
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

    porId('registrarSucursal').addEventListener('click', function () { abrirSucursal(null); });
    porId('sucursalForm').addEventListener('submit', guardarSucursal);

    SGTL.tabla.cargando('#sucursalesBody', 4);
    cargar();
})();