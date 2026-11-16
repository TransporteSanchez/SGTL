(function () {
    'use strict';

    var API = SGTL.api + '/facturacion-config';
    var sucursales = [];
    var sucursalEditada = null;
    var numeradores = [];
    var numeradorEditado = null;
    var tipos = [];
    var tipoEditado = null;
    var descripcionCopiada = false;

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

    function impacto(valor) {
        return valor === 'C' ? 'Crédito' : 'Deuda';
    }

    function cargar() {
        return Promise.all([pedir('/sucursales'), pedir('/numeradores'), pedir('/tipos-comprobante')]).then(function (datos) {
            sucursales = datos[0];
            numeradores = datos[1];
            tipos = datos[2];
            mostrarSucursales();
            mostrarNumeradores();
            mostrarTipos();
        }).catch(function (error) {
            SGTL.tabla.vacia('#sucursalesBody', 4, 'No se pudo cargar la configuración.');
            SGTL.tabla.vacia('#numeradoresBody', 4, 'No se pudo cargar la configuración.');
            SGTL.tabla.vacia('#tiposBody', 9, 'No se pudo cargar la configuración.');
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

    function accionesTipo(tipo) {
        var accionEstado = tipo.Activo ? 'inactivar' : 'activar';
        var botones = [
            SGTL.botonFila('editar', { id: tipo.FactTipoID, deshabilitado: tipo.EsElectronico,
                motivo: 'No se puede editar el tipo de comprobante: es electrónico' }),
            SGTL.botonFila(accionEstado, { id: tipo.FactTipoID, deshabilitado: tipo.EsElectronico,
                motivo: 'No se puede ' + accionEstado + ' el tipo de comprobante: es electrónico' })
        ];
        if (tipo.PuedeEliminar) botones.push(SGTL.botonFila('eliminar', { id: tipo.FactTipoID }));
        return SGTL.accionesFila(botones);
    }

    function mostrarTipos() {
        if (!tipos.length) {
            SGTL.tabla.vacia('#tiposBody', 9, 'Todavía no hay tipos de comprobante registrados.');
            return;
        }
        SGTL.tabla.llenar('#tiposBody', tipos.map(function (tipo) {
            return '<tr><td>' + SGTL.escapar(tipo.Tipo) + '</td><td>' + SGTL.escapar(tipo.Descripcion) + '</td>'
                + '<td>' + impacto(tipo.Impacto) + '</td><td>' + SGTL.escapar(tipo.LetraPredeterminada) + '</td>'
                + '<td>' + SGTL.escapar(tipo.Sucursal) + '</td><td>' + SGTL.escapar(tipo.Numerador) + '</td>'
                + '<td>' + (tipo.EsElectronico ? 'Sí' : 'No') + '</td>'
                + '<td class="text-center">' + estado(tipo.Activo) + '</td>'
                + '<td class="text-center">' + accionesTipo(tipo) + '</td></tr>';
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
        porId('sucursalTitulo').textContent = sucursal ? 'Editar sucursal' : 'Registrar sucursal';
        porId('sucursalCodigo').value = sucursal ? sucursal.Codigo : '';
        porId('sucursalNombre').value = sucursal ? sucursal.Nombre : '';
        fijar('sucursalCodigo', !!sucursal && !sucursal.PuedeCambiarCodigo, porId('sucursalCodigo').value, 'Ya hay comprobantes de esta sucursal.');
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

    function otraLetra(sigla) {
        return tipoEditado ? null : tipos.find(function (t) { return t.Tipo === sigla; });
    }

    function siglaElectronica(sigla) {
        var existente = otraLetra(sigla);
        return existente && existente.EsElectronico ? 'No se puede agregar otra letra al tipo ' + sigla + ': es electrónico.' : '';
    }

    var validarTipo = SGTL.validador([
        { id: 'tipoSigla', requerido: 'Completá la sigla.', mayusculas: true, max: 3, validar: siglaElectronica },
        { id: 'tipoDescripcion', requerido: 'Completá la descripción.' },
        { id: 'tipoSucursal', requerido: 'Elegí una sucursal.' },
        { id: 'tipoNumerador', requerido: 'Elegí un numerador.' }
    ]);
    var cambiosTipo = SGTL.cambiosSinGuardar('#tipoModal');

    function fijar(id, fijo, texto, motivo) {
        porId(id + 'Campo').classList.toggle('d-none', fijo);
        porId(id + 'Texto').classList.toggle('d-none', !fijo);
        porId(id + 'Texto').innerHTML = SGTL.escapar(texto) + '<span class="form-text d-block">' + SGTL.escapar(motivo) + '</span>';
        document.querySelector('label[for="' + id + '"] .text-danger').classList.toggle('d-none', fijo);
    }

    function avisoElectronico() {
        porId('tipoElectronicoAviso').classList.toggle('d-none', !porId('tipoElectronico').checked);
    }

    function siglaEscrita() {
        var sigla = porId('tipoSigla').value;
        var existente = otraLetra(sigla);
        if (existente) {
            porId('tipoDescripcion').value = existente.Descripcion;
            porId('tipoImpacto').value = existente.Impacto;
            porId('tipoElectronico').checked = false;
        } else if (descripcionCopiada) {
            porId('tipoDescripcion').value = '';
        }
        descripcionCopiada = !!existente;
        var motivo = 'Es igual en todas las letras de ' + sigla + '.';
        fijar('tipoDescripcion', !!existente, porId('tipoDescripcion').value, motivo);
        if (!tipoEditado) fijar('tipoImpacto', !!existente, impacto(porId('tipoImpacto').value), motivo);
        porId('tipoElectronicoCampo').classList.toggle('d-none', !!existente);
        avisoElectronico();
    }

    function opcion(valor, texto) {
        return '<option value="' + valor + '">' + SGTL.escapar(texto) + '</option>';
    }

    function abrirTipo(tipo) {
        tipoEditado = tipo;
        SGTL.reiniciarFormulario('#tipoForm', '#tipoAviso');
        validarTipo.reiniciar();
        porId('tipoTitulo').textContent = tipo ? 'Editar tipo de comprobante' : 'Registrar tipo de comprobante';
        porId('tipoSucursal').innerHTML = opcion('', 'Seleccioná una sucursal') + sucursales.filter(function (s) {
            return s.Activa || (tipo && s.SucursalID === tipo.SucursalID);
        }).map(function (s) { return opcion(s.SucursalID, s.Codigo + ' - ' + s.Nombre); }).join('');
        porId('tipoNumerador').innerHTML = opcion('', 'Seleccioná un numerador') + numeradores.filter(function (n) {
            return n.Activo || (tipo && n.NumeradorID === tipo.NumeradorID);
        }).map(function (n) { return opcion(n.NumeradorID, n.Nombre); }).join('');
        porId('tipoSigla').value = tipo ? tipo.Tipo : '';
        porId('tipoLetra').value = tipo && tipo.PuedeCambiarLetra ? tipo.LetraPredeterminada : 'A';
        porId('tipoImpacto').value = tipo ? tipo.Impacto : 'D';
        porId('tipoDescripcion').value = tipo ? tipo.Descripcion : '';
        porId('tipoSucursal').value = tipo ? tipo.SucursalID : '';
        porId('tipoNumerador').value = tipo ? tipo.NumeradorID : '';
        descripcionCopiada = false;
        var editando = !!tipo;
        fijar('tipoSigla', editando && !tipo.PuedeCambiarSigla, porId('tipoSigla').value, 'Es una sigla fija del sistema.');
        fijar('tipoLetra', editando && !tipo.PuedeCambiarLetra, editando ? tipo.LetraPredeterminada : '', 'Los recibos usan la letra X.');
        fijar('tipoImpacto', editando && !tipo.PuedeCambiarImpacto, impacto(porId('tipoImpacto').value),
            editando && tipo.PuedeCambiarSigla ? 'Ya hay comprobantes de este tipo.' : 'Es fijo en las siglas del sistema.');
        siglaEscrita();
        SGTL.modal('#tipoModal', 'show');
    }

    function guardarTipo(evento) {
        evento.preventDefault();
        validarTipo.validarTodo();
        if (!SGTL.revisarFormulario('#tipoForm', '#tipoAviso')) return;
        var listo = SGTL.procesando(evento.submitter);
        var cuerpo = {
            Tipo: porId('tipoSigla').value,
            Descripcion: porId('tipoDescripcion').value.trim(),
            Impacto: porId('tipoImpacto').value,
            LetraPredeterminada: tipoEditado && !tipoEditado.PuedeCambiarLetra ? tipoEditado.LetraPredeterminada : porId('tipoLetra').value,
            SucursalID: Number(porId('tipoSucursal').value),
            NumeradorID: Number(porId('tipoNumerador').value),
            EsElectronico: porId('tipoElectronico').checked
        };
        var pedido;
        if (tipoEditado) {
            cuerpo.TipoLeido = tipoEditado.Tipo;
            cuerpo.LetraLeida = tipoEditado.LetraPredeterminada;
            pedido = pedir('/tipos-comprobante/' + tipoEditado.FactTipoID, 'PUT', cuerpo);
        } else {
            pedido = pedir('/tipos-comprobante', 'POST', cuerpo);
        }
        pedido.then(function () {
            listo();
            guardado('#tipoModal', cambiosTipo, 'Tipo de comprobante guardado.');
        }).catch(function (error) {
            listo();
            SGTL.avisoFormulario('#tipoAviso', error.message);
            cargar();
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

    porId('numeradoresBody').addEventListener('click', function (evento) {
        var boton = evento.target.closest('[data-accion]');
        var numerador = boton && numeradores.find(function (n) { return n.NumeradorID === Number(boton.dataset.id); });
        if (!numerador) return;
        var ruta = '/numeradores/' + numerador.NumeradorID;
        if (boton.dataset.accion === 'editar') abrirNumerador(numerador);
        else if (boton.dataset.accion === 'eliminar') eliminar(ruta, '¿Eliminar el numerador ' + numerador.Nombre + '?', 'Numerador eliminado.');
        else cambiarEstado(boton, ruta, !numerador.Activo, numerador.Activo ? 'Numerador inactivado.' : 'Numerador activado.');
    });

    porId('tiposBody').addEventListener('click', function (evento) {
        var boton = evento.target.closest('[data-accion]');
        var tipo = boton && tipos.find(function (t) { return t.FactTipoID === Number(boton.dataset.id); });
        if (!tipo) return;
        var ruta = '/tipos-comprobante/' + tipo.FactTipoID;
        var nombre = tipo.Tipo + ' ' + tipo.LetraPredeterminada;
        if (boton.dataset.accion === 'editar') abrirTipo(tipo);
        else if (boton.dataset.accion === 'eliminar') eliminar(ruta, '¿Eliminar el tipo de comprobante ' + nombre + '?', 'Tipo de comprobante eliminado.');
        else cambiarEstado(boton, ruta, !tipo.Activo, tipo.Activo ? 'Tipo de comprobante inactivado.' : 'Tipo de comprobante activado.');
    });

    porId('registrarSucursal').addEventListener('click', function () { abrirSucursal(null); });
    porId('sucursalForm').addEventListener('submit', guardarSucursal);
    porId('registrarNumerador').addEventListener('click', function () { abrirNumerador(null); });
    porId('numeradorForm').addEventListener('submit', guardarNumerador);
    porId('registrarTipo').addEventListener('click', function () { abrirTipo(null); });
    porId('tipoSigla').addEventListener('input', siglaEscrita);
    porId('tipoElectronico').addEventListener('change', avisoElectronico);
    porId('tipoForm').addEventListener('submit', guardarTipo);

    window.loadHeader().catch(function (error) { console.warn('No se pudo cargar el encabezado.', error); });
    window.loadFooter();
    fetch(SGTL.api + '/GestionContenido/1').then(function (respuesta) {
        if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
        return respuesta.json();
    }).then(function (contenido) {
        window.applyStyles(contenido.Logo, contenido.ColorFondo, contenido.ColorBotonesMenu, contenido.ContenidoPiePagina);
    }).catch(function (error) { console.warn('No se pudo cargar la apariencia de SGTL.', error); });

    SGTL.tabla.cargando('#sucursalesBody', 4);
    SGTL.tabla.cargando('#numeradoresBody', 4);
    SGTL.tabla.cargando('#tiposBody', 9);
    cargar();
})();