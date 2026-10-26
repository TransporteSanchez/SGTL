(function (window, document) {
    'use strict';

    var API = 'http://localhost:50222/api/facturacion-config';
    var datos = { sucursales: [], numeradores: [], tipos: [] };
    var formularios = {};

    function porId(id) { return document.getElementById(id); }
    function token() { try { return localStorage.getItem('token') || ''; } catch (e) { return ''; } }
    function escapar(valor) { return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function encabezados(contenido) {
        var resultado = { Accept: 'application/json' };
        if (contenido) resultado['Content-Type'] = 'application/json';
        if (token()) resultado.Authorization = 'Bearer ' + token();
        return resultado;
    }
    // El campo "error" de esta API ya viene redactado para el usuario; el "Message" de Web API solo se
    // muestra cuando rechaza un dato (400 o 409), porque si no es técnico (§9).
    function solicitud(ruta, metodo, cuerpo, porDefecto) {
        porDefecto = porDefecto || 'No se pudo completar la operación. Probá de nuevo.';
        return fetch(API + ruta, { method: metodo || 'GET', headers: encabezados(cuerpo !== undefined), body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) })
            .then(function (respuesta) { return respuesta.text().then(function (texto) {
                var json; try { json = texto ? JSON.parse(texto) : {}; } catch (e) { json = {}; }
                if (!respuesta.ok) {
                    var mensaje = json.error || ((respuesta.status === 400 || respuesta.status === 409) && json.Message) || porDefecto;
                    if (respuesta.status === 401) mensaje = SGTL.mensajeError({ status: 401 }, porDefecto);
                    var error = new Error(mensaje);
                    error.status = respuesta.status;
                    throw error;
                }
                return json;
            }); }, function () {
                throw new Error('No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.');
            });
    }
    function avisarError(ex) { SGTL.toastError((ex && ex.message) || 'No se pudo completar la operación. Probá de nuevo.'); }
    function estado(activo) { return SGTL.estado(activo ? 'Activo' : 'Inactivo'); }
    function opciones(items, campoId, etiqueta, valorSeleccionado) {
        return items.filter(function (item) { return item.Activa !== false && item.Activo !== false; }).map(function (item) {
            var valor = item[campoId];
            return '<option value="' + Number(valor) + '"' + (Number(valor) === Number(valorSeleccionado) ? ' selected' : '') + '>' + escapar(etiqueta(item)) + '</option>';
        }).join('');
    }
    // La eliminación solo se ofrece cuando la API confirma que no hay relaciones.
    function acciones(tipo, id, activo, puedeEliminar) {
        var botones = [
            SGTL.botonFila('editar', { id: id, datos: { tipo: tipo } }),
            SGTL.botonFila(activo ? 'inactivar' : 'activar', { id: id, datos: { tipo: tipo } })
        ];
        if (puedeEliminar === true) botones.push(SGTL.botonFila('eliminar', { id: id, datos: { tipo: tipo } }));
        return SGTL.accionesFila(botones);
    }
    function renderSucursales() {
        if (!datos.sucursales.length) { SGTL.tabla.vacia('#sucursalesBody', 4, 'Todavía no hay sucursales cargadas.'); return; }
        SGTL.tabla.llenar('#sucursalesBody', datos.sucursales.map(function (item) {
            return '<tr><td>' + escapar(item.Codigo) + '</td><td>' + escapar(item.Nombre) + '</td><td class="text-center">' + estado(item.Activa) + '</td>' +
                '<td class="text-center">' + acciones('sucursal', item.SucursalID, item.Activa, item.PuedeEliminar) + '</td></tr>';
        }).join(''));
    }
    function renderNumeradores() {
        if (!datos.numeradores.length) { SGTL.tabla.vacia('#numeradoresBody', 4, 'Todavía no hay numeradores cargados.'); return; }
        SGTL.tabla.llenar('#numeradoresBody', datos.numeradores.map(function (item) {
            return '<tr><td>' + escapar(item.Nombre) + '</td><td>' + Number(item.UltimoNumero).toString().padStart(8, '0') + '</td><td class="text-center">' + estado(item.Activo) + '</td>' +
                '<td class="text-center">' + acciones('numerador', item.NumeradorID, item.Activo, item.PuedeEliminar) + '</td></tr>';
        }).join(''));
    }
    function renderSelectoresTipo() {
        porId('tipoSucursal').innerHTML = '<option value="">Seleccioná una sucursal</option>' + opciones(datos.sucursales, 'SucursalID', function (item) { return item.Codigo + ' · ' + item.Nombre; });
        porId('tipoNumerador').innerHTML = '<option value="">Seleccioná un numerador</option>' + opciones(datos.numeradores, 'NumeradorID', function (item) { return item.Nombre; });
    }
    function impacto(item) { return item.Impacto === 'C' ? 'Crédito' : 'Deuda'; }
    function renderTipos() {
        if (!datos.tipos.length) { SGTL.tabla.vacia('#tiposBody', 8, 'Todavía no hay tipos de comprobante cargados.'); return; }
        SGTL.tabla.llenar('#tiposBody', datos.tipos.map(function (item) {
            return '<tr><td><strong>' + escapar(item.Tipo) + '</strong></td><td>' + escapar(item.Descripcion) + '</td><td>' + impacto(item) + '</td><td>' + escapar(item.LetraPredeterminada || '—') + '</td>' +
                '<td>' + escapar(item.Sucursal || '—') + '</td><td>' + escapar(item.Numerador || '—') + '</td><td class="text-center">' + estado(item.Activo) + '</td>' +
                '<td class="text-center">' + acciones('tipo', item.FactTipo_ID, item.Activo, item.PuedeEliminar) + '</td></tr>';
        }).join(''));
    }
    function render() { renderSucursales(); renderNumeradores(); renderSelectoresTipo(); renderTipos(); }
    function resetSucursal() { SGTL.reiniciarFormulario('#sucursalForm'); porId('sucursalId').value = ''; porId('sucursalActiva').checked = true; }
    function resetNumerador() { SGTL.reiniciarFormulario('#numeradorForm'); porId('numeradorId').value = ''; porId('numeradorUltimo').value = '0'; porId('numeradorActivo').checked = true; }
    function sincronizarTipo() {
        var codigo = porId('tipoCodigo').value.trim().toUpperCase();
        var editando = !!porId('tipoId').value;
        var existente = datos.tipos.filter(function (item) { return item.Tipo === codigo; })[0];
        if (!editando && existente) {
            porId('tipoDescripcion').value = existente.Descripcion || '';
            porId('tipoImpacto').value = existente.Impacto;
        }
        var esRecibo = codigo === 'REC';
        if (esRecibo) porId('tipoLetra').value = 'X';
        else if (porId('tipoLetra').value === 'X') porId('tipoLetra').value = 'A';
        porId('tipoCodigoEditable').classList.toggle('d-none', editando);
        porId('tipoCodigoFijo').classList.toggle('d-none', !editando);
        porId('tipoCodigoTexto').textContent = codigo;
        porId('tipoLetraEditable').classList.toggle('d-none', editando || esRecibo);
        porId('tipoLetraFijo').classList.toggle('d-none', !editando && !esRecibo);
        porId('tipoLetraTexto').textContent = porId('tipoLetra').value;
        porId('tipoImpactoEditable').classList.toggle('d-none', editando || !!existente);
        porId('tipoImpactoFijo').classList.toggle('d-none', !editando && !existente);
        porId('tipoImpactoTexto').textContent = porId('tipoImpacto').value === 'C' ? 'Crédito' : 'Deuda';
    }
    function resetTipo() {
        SGTL.reiniciarFormulario('#tipoForm');
        porId('tipoId').value = '';
        porId('tipoActivo').checked = true;
        porId('tipoImpacto').value = 'D';
        porId('tipoLetra').value = 'A';
        sincronizarTipo();
    }
    function recargar(mensaje, silencioso) {
        return Promise.all([
            solicitud('/sucursales?incluirInactivas=true'), solicitud('/numeradores?incluirInactivos=true'), solicitud('/tipos-comprobante')
        ]).then(function (resultado) {
            datos.sucursales = resultado[0] || []; datos.numeradores = resultado[1] || []; datos.tipos = resultado[2] || [];
            render(); if (mensaje) SGTL.toastExito(mensaje);
        }).catch(function (ex) {
            if (silencioso) return;
            ['#sucursalesBody', '#numeradoresBody'].forEach(function (cuerpo) { SGTL.tabla.vacia(cuerpo, 4, 'No se pudo cargar la configuración.'); });
            SGTL.tabla.vacia('#tiposBody', 8, 'No se pudo cargar la configuración.');
            SGTL.toastError(ex.message || 'No se pudo cargar la configuración. Probá de nuevo.');
        });
    }
    // Guarda con la ruedita en el botón (§8) y avisa con un toast (§5.1).
    function guardar(formulario, ruta, id, cuerpo, mensaje, reiniciar) {
        formularios[formulario].validarTodo();
        if (!SGTL.revisarFormulario('#' + formulario)) return;
        var listo = SGTL.procesando(porId(formulario).querySelector('button[type="submit"]'));
        solicitud(ruta + (id ? '/' + encodeURIComponent(id) : ''), id ? 'PUT' : 'POST', cuerpo)
            .then(function () { listo(); reiniciar(); return recargar(mensaje); })
            .catch(function (ex) { listo(); avisarError(ex); });
    }
    function cuerpoSucursal(item, activa) {
        return { Codigo: item.Codigo, Nombre: item.Nombre, Activa: activa };
    }
    function cuerpoNumerador(item, activo) {
        return { Nombre: item.Nombre, UltimoNumero: Number(item.UltimoNumero || 0), Activo: activo };
    }
    function cuerpoTipo(item, activo) {
        return {
            Tipo: item.Tipo, Descripcion: item.Descripcion, Impacto: item.Impacto, LetraPredeterminada: item.LetraPredeterminada,
            SucursalID: Number(item.SucursalID || 0), NumeradorID: Number(item.NumeradorID || 0), Activo: activo
        };
    }
    function guardarSucursal(evento) {
        evento.preventDefault();
        var item = { Codigo: porId('sucursalCodigo').value.trim(), Nombre: porId('sucursalNombre').value.trim() };
        guardar('sucursalForm', '/sucursales', porId('sucursalId').value, cuerpoSucursal(item, porId('sucursalActiva').checked),
            'Sucursal guardada.', resetSucursal);
    }
    function guardarNumerador(evento) {
        evento.preventDefault();
        var item = { Nombre: porId('numeradorNombre').value.trim(), UltimoNumero: porId('numeradorUltimo').value };
        guardar('numeradorForm', '/numeradores', porId('numeradorId').value, cuerpoNumerador(item, porId('numeradorActivo').checked),
            'Numerador guardado.', resetNumerador);
    }
    function guardarTipo(evento) {
        evento.preventDefault();
        var tipo = porId('tipoCodigo').value.trim().toUpperCase();
        var item = {
            Tipo: tipo, Descripcion: porId('tipoDescripcion').value.trim(), Impacto: porId('tipoImpacto').value,
            LetraPredeterminada: porId('tipoLetra').value, SucursalID: porId('tipoSucursal').value, NumeradorID: porId('tipoNumerador').value
        };
        guardar('tipoForm', '/tipos-comprobante', porId('tipoId').value, cuerpoTipo(item, porId('tipoActivo').checked),
            'Tipo de comprobante ' + tipo + ' ' + item.LetraPredeterminada + ' guardado.', resetTipo);
    }
    function editarSucursal(id) {
        var item = datos.sucursales.filter(function (x) { return Number(x.SucursalID) === Number(id); })[0]; if (!item) return;
        resetSucursal();
        porId('sucursalId').value = item.SucursalID; porId('sucursalCodigo').value = item.Codigo; porId('sucursalNombre').value = item.Nombre; porId('sucursalActiva').checked = item.Activa;
        porId('sucursalNombre').focus();
    }
    function editarNumerador(id) {
        var item = datos.numeradores.filter(function (x) { return Number(x.NumeradorID) === Number(id); })[0]; if (!item) return;
        resetNumerador();
        porId('numeradorId').value = item.NumeradorID; porId('numeradorNombre').value = item.Nombre; porId('numeradorUltimo').value = item.UltimoNumero; porId('numeradorActivo').checked = item.Activo;
        porId('numeradorNombre').focus();
    }
    function editarTipo(id) {
        var item = datos.tipos.filter(function (x) { return Number(x.FactTipo_ID) === Number(id); })[0]; if (!item) return;
        resetTipo();
        porId('tipoId').value = item.FactTipo_ID;
        porId('tipoCodigo').value = item.Tipo;
        porId('tipoDescripcion').value = item.Descripcion || '';
        porId('tipoImpacto').value = item.Impacto;
        porId('tipoLetra').value = item.LetraPredeterminada || (item.Tipo === 'REC' ? 'X' : 'A');
        porId('tipoSucursal').value = item.SucursalID || '';
        porId('tipoNumerador').value = item.NumeradorID || '';
        porId('tipoActivo').checked = item.Activo;
        sincronizarTipo();
        porId('tipoDescripcion').focus();
    }
    // Activar e inactivar no piden confirmación (§5.2) y conservan el registro.
    var CAMBIOS_ESTADO = {
        sucursal: {
            ruta: '/sucursales', nombre: 'Sucursal', femenino: true, campoEstado: 'Activa',
            buscar: function (id) { return datos.sucursales.filter(function (x) { return Number(x.SucursalID) === Number(id); })[0]; },
            etiqueta: function (item) { return item.Codigo + ' · ' + item.Nombre; }
        },
        numerador: {
            ruta: '/numeradores', nombre: 'Numerador', campoEstado: 'Activo',
            buscar: function (id) { return datos.numeradores.filter(function (x) { return Number(x.NumeradorID) === Number(id); })[0]; },
            etiqueta: function (item) { return item.Nombre; }
        },
        tipo: {
            ruta: '/tipos-comprobante', nombre: 'Tipo de comprobante', campoEstado: 'Activo',
            buscar: function (id) { return datos.tipos.filter(function (x) { return Number(x.FactTipo_ID) === Number(id); })[0]; },
            etiqueta: function (item) { return item.Tipo + ' · ' + (item.LetraPredeterminada || '—') + ' · ' + item.Descripcion; }
        }
    };
    function cambiarEstado(boton, tipo, id, activar) {
        var config = CAMBIOS_ESTADO[tipo];
        var item = config.buscar(id);
        if (!item) return;
        var listo = SGTL.procesando(boton);
        var cuerpo = {};
        cuerpo[config.campoEstado] = activar;
        var pedido = solicitud(config.ruta + '/' + encodeURIComponent(id) + '/estado', 'PUT', cuerpo);
        var participio = (activar ? 'activad' : 'inactivad') + (config.femenino ? 'a' : 'o');
        pedido.then(function () { listo(); return recargar(config.nombre + ' ' + participio + '.'); })
            .catch(function (ex) { listo(); avisarError(ex); });
    }
    function eliminar(tipo, id) {
        var config = CAMBIOS_ESTADO[tipo];
        if (!config) return;
        var item = config.buscar(id);
        if (!item || item.PuedeEliminar !== true) return;
        var nombre = (config.femenino ? 'la ' : 'el ') + config.nombre.toLowerCase();
        SGTL.confirmar({
            titulo: '¿Eliminar ' + nombre + ' ' + config.etiqueta(item) + '?',
            mensaje: 'No se puede deshacer.',
            verbo: 'Eliminar', peligro: true,
            accion: function () {
                return solicitud(config.ruta + '/' + encodeURIComponent(id), 'DELETE').catch(function (ex) {
                    ex.mensajeUsuario = ex.message;
                    if (ex.status === 409) return recargar(null, true).then(function () { throw ex; });
                    throw ex;
                });
            }
        }).then(function (eliminado) {
            if (eliminado) return recargar(config.nombre + (config.femenino ? ' eliminada.' : ' eliminado.'));
        });
    }
    function alHacerClic(evento) {
        var boton = evento.target.closest('#sucursalesBody [data-accion], #numeradoresBody [data-accion], #tiposBody [data-accion]');
        if (!boton) return;
        var accion = boton.getAttribute('data-accion'), tipo = boton.getAttribute('data-tipo'), id = boton.getAttribute('data-id');
        if (accion === 'editar') {
            if (tipo === 'sucursal') editarSucursal(id);
            else if (tipo === 'numerador') editarNumerador(id);
            else editarTipo(id);
        } else if (accion === 'activar' || accion === 'inactivar') {
            cambiarEstado(boton, tipo, id, accion === 'activar');
        } else if (accion === 'eliminar') {
            eliminar(tipo, id);
        }
    }
    function inicializar() {
        formularios.sucursalForm = SGTL.validador([
            { id: 'sucursalCodigo', requerido: 'Completá el código.', soloNumeros: true, max: 4 },
            { id: 'sucursalNombre', requerido: 'Completá el nombre.' }
        ]);
        formularios.numeradorForm = SGTL.validador([
            { id: 'numeradorNombre', requerido: 'Completá el nombre.' },
            { id: 'numeradorUltimo', requerido: 'Completá el último número.', soloNumeros: true, max: 8 }
        ]);
        formularios.tipoForm = SGTL.validador([
            { id: 'tipoCodigo', requerido: 'Completá el código.', mayusculas: true, max: 3 },
            { id: 'tipoDescripcion', requerido: 'Completá la descripción.' },
            { id: 'tipoSucursal', requerido: 'Seleccioná una sucursal.' },
            { id: 'tipoNumerador', requerido: 'Seleccioná un numerador.' }
        ]);
        porId('sucursalForm').addEventListener('submit', guardarSucursal);
        porId('numeradorForm').addEventListener('submit', guardarNumerador);
        porId('tipoForm').addEventListener('submit', guardarTipo);
        porId('cancelarSucursal').addEventListener('click', resetSucursal);
        porId('cancelarNumerador').addEventListener('click', resetNumerador);
        porId('cancelarTipo').addEventListener('click', resetTipo);
        porId('tipoCodigo').addEventListener('input', sincronizarTipo);
        document.addEventListener('click', alHacerClic);
        SGTL.tabla.cargando('#sucursalesBody', 4);
        SGTL.tabla.cargando('#numeradoresBody', 4);
        SGTL.tabla.cargando('#tiposBody', 8);
        resetTipo(); recargar();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializar); else inicializar();
})(window, document);
