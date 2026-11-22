(function () {
    'use strict';

    var COLUMNAS = 6;
    var TIPOS = {
        origen: { sufijo: 'Origen', ruta: '/Origen', campoId: 'Origen_ID', plural: 'orígenes' },
        destino: { sufijo: 'Destino', ruta: '/Destino', campoId: 'Destino_ID', plural: 'destinos' }
    };
    var comparador = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

    function porId(id) {
        return document.getElementById(id);
    }

    function normalizar(texto) {
        return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function direccion(ubicacion) {
        return [ubicacion.Calle, ubicacion.AlturaCalle].filter(Boolean).join(' ');
    }

    function fila(tipo, ubicacion) {
        var id = ubicacion[TIPOS[tipo].campoId];
        return '<tr>' +
            '<td>' + SGTL.escapar(ubicacion.Descripcion) + '</td>' +
            '<td>' + SGTL.escapar(ubicacion.ClienteRazon) + '</td>' +
            '<td>' + SGTL.escapar(ubicacion.NombreProvincia) + '</td>' +
            '<td>' + SGTL.escapar(ubicacion.NombreLocalidad) + '</td>' +
            '<td>' + SGTL.escapar(direccion(ubicacion)) + '</td>' +
            '<td class="text-center">' + SGTL.accionesFila([
                SGTL.botonFila('ver', { id: id }),
                SGTL.botonFila('editar', { id: id }),
                SGTL.botonFila('eliminar', { id: id })
            ]) + '</td></tr>';
    }

    function filtradas(estado) {
        return estado.lista.filter(function (ubicacion) {
            if (estado.cliente && normalizar(ubicacion.ClienteRazon).indexOf(estado.cliente) === -1) return false;
            if (!estado.texto) return true;
            var texto = [ubicacion.Descripcion, ubicacion.Calle, ubicacion.AlturaCalle, ubicacion.NombreLocalidad, ubicacion.NombreProvincia].join(' ');
            return normalizar(texto).indexOf(estado.texto) !== -1;
        });
    }

    function dibujar(tipo) {
        var estado = TIPOS[tipo];
        var cuerpo = '#filas' + estado.sufijo;
        var lista = filtradas(estado);
        var orden = estado.orden.parametros();
        if (orden.orden) {
            var signo = orden.direccion === 'desc' ? -1 : 1;
            lista.sort(function (a, b) { return comparador.compare(a[orden.orden] || '', b[orden.orden] || '') * signo; });
        }

        var tamanio = estado.tamanio || lista.length || 1;
        estado.pagina = Math.min(estado.pagina, Math.ceil(lista.length / tamanio) || 1);
        var visibles = lista.slice((estado.pagina - 1) * tamanio, estado.pagina * tamanio);
        if (visibles.length) SGTL.tabla.llenar(cuerpo, visibles.map(function (ubicacion) { return fila(tipo, ubicacion); }).join(''));
        else SGTL.tabla.vacia(cuerpo, COLUMNAS, estado.lista.length ? null : 'Todavía no hay ' + estado.plural + ' cargados.');

        SGTL.tabla.paginacion('#paginacion' + estado.sufijo, {
            total: lista.length,
            tamanioPagina: estado.tamanio,
            pagina: estado.pagina,
            alCambiarPagina: function (pagina) { estado.pagina = pagina; dibujar(tipo); },
            alCambiarTamanio: function (tamanioNuevo) { estado.tamanio = tamanioNuevo; estado.pagina = 1; dibujar(tipo); }
        });
    }

    function listar(tipo) {
        var estado = TIPOS[tipo];
        SGTL.tabla.cargando('#filas' + estado.sufijo, COLUMNAS);
        return SGTL.ajax({ url: SGTL.api + estado.ruta, type: 'GET' },
            'No se pudieron cargar los ' + estado.plural + '. Revisá la conexión y probá de nuevo.')
            .then(function (lista) {
                estado.lista = lista || [];
                dibujar(tipo);
            }, function (error) {
                SGTL.tabla.vacia('#filas' + estado.sufijo, COLUMNAS, 'No se pudieron cargar los ' + estado.plural + '.');
                SGTL.tabla.paginacion('#paginacion' + estado.sufijo, { total: 0 });
                SGTL.toastError(error.mensajeUsuario);
            });
    }

    function buscar(tipo) {
        var estado = TIPOS[tipo];
        estado.texto = normalizar(porId('texto' + estado.sufijo).value.trim());
        estado.cliente = normalizar(porId('clienteTexto' + estado.sufijo).value.trim());
        estado.pagina = 1;
        dibujar(tipo);
    }

    var editando = null;
    var validarUbicacion = SGTL.validador([
        { id: 'ubicacionCliente', requerido: 'Seleccioná un cliente.' },
        { id: 'ubicacionDescripcion', requerido: 'Completá la descripción.' },
        { id: 'ubicacionProvincia', requerido: 'Seleccioná una provincia.' },
        { id: 'ubicacionLocalidad', requerido: 'Seleccioná una localidad.' }
    ]);

    function opciones(select, primera, lista, campoValor, campoTexto) {
        select.replaceChildren(new Option(primera, ''));
        lista.forEach(function (item) { select.append(new Option(item[campoTexto], item[campoValor])); });
    }

    function cargarClientes() {
        return SGTL.ajax({ url: SGTL.api + '/Clientes', type: 'GET' },
            'No se pudieron cargar los clientes. Revisá la conexión y probá de nuevo.')
            .catch(function (error) {
                if (error.xhr && error.xhr.status === 404) return [];
                throw error;
            })
            .then(function (lista) {
                return lista.sort(function (a, b) { return comparador.compare(a.Razon_Social, b.Razon_Social); });
            });
    }

    function cargarCombos() {
        var provincias = SGTL.ajax({ url: SGTL.api + '/Provincias', type: 'GET' },
            'No se pudieron cargar las provincias. Revisá la conexión y probá de nuevo.');
        return Promise.all([cargarClientes(), provincias]);
    }

    function cargarLocalidades(provinciaId, localidadId) {
        var select = porId('ubicacionLocalidad');
        opciones(select, 'Seleccioná una localidad', [], '', '');
        select.disabled = true;
        if (!provinciaId) return Promise.resolve();
        return SGTL.ajax({ url: SGTL.api + '/Provincias/' + provinciaId + '/Localidades', type: 'GET' },
            'No se pudieron cargar las localidades. Revisá la conexión y probá de nuevo.')
            .then(function (localidades) {
                opciones(select, 'Seleccioná una localidad', localidades, 'Loc_ID', 'Nombre_Localidad');
                select.value = localidadId || '';
                select.disabled = false;
            });
    }

    function abrir(tipo, id) {
        var estado = TIPOS[tipo];
        var ubicacion = id ? ubicacionDe(tipo, id) : null;
        editando = { tipo: tipo, id: id };
        SGTL.reiniciarFormulario('#ubicacionForm', '#ubicacionAviso');
        validarUbicacion.reiniciar();
        porId('ubicacionTitulo').textContent = (id ? 'Editar ' : 'Registrar ') + tipo;
        porId('ubicacionGuardar').disabled = true;
        cargarLocalidades('');
        SGTL.modal('#ubicacionModal', 'show');

        cargarCombos().then(function (datos) {
            opciones(porId('ubicacionCliente'), 'Seleccioná un cliente', datos[0], 'Cliente_ID', 'Razon_Social');
            opciones(porId('ubicacionProvincia'), 'Seleccioná una provincia', datos[1], 'Prov_ID', 'Nombre_Provincia');
            if (!ubicacion) return;
            porId('ubicacionCliente').value = ubicacion.ClienteID;
            porId('ubicacionDescripcion').value = ubicacion.Descripcion;
            porId('ubicacionProvincia').value = ubicacion.ProvID;
            porId('ubicacionCalle').value = ubicacion.Calle || '';
            porId('ubicacionAltura').value = ubicacion.AlturaCalle || '';
            return cargarLocalidades(ubicacion.ProvID, ubicacion.LocID);
        }).then(function () {
            porId('ubicacionGuardar').disabled = false;
        }, function (error) {
            SGTL.modal('#ubicacionModal', 'hide');
            SGTL.toastError(error.mensajeUsuario);
        });
    }

    function guardar(evento) {
        evento.preventDefault();
        validarUbicacion.validarTodo();
        if (!SGTL.revisarFormulario('#ubicacionForm', '#ubicacionAviso')) return;

        var tipo = editando.tipo;
        var id = editando.id;
        var estado = TIPOS[tipo];
        var usuario = localStorage.getItem('username');
        var cuerpo = {
            ClienteID: Number(porId('ubicacionCliente').value),
            Descripcion: porId('ubicacionDescripcion').value.trim(),
            ProvID: Number(porId('ubicacionProvincia').value),
            LocID: Number(porId('ubicacionLocalidad').value),
            Calle: porId('ubicacionCalle').value.trim(),
            AlturaCalle: porId('ubicacionAltura').value.trim(),
            Usu_Alta: usuario,
            Usu_Modi: usuario
        };
        var listo = SGTL.procesando('#ubicacionGuardar');
        SGTL.ajax({
            url: SGTL.api + estado.ruta + (id ? '/' + id : ''),
            type: id ? 'PUT' : 'POST',
            contentType: 'application/json',
            data: JSON.stringify(cuerpo)
        }, 'No se pudo guardar. Revisá la conexión y probá de nuevo.').then(function () {
            listo();
            SGTL.modal('#ubicacionModal', 'hide');
            SGTL.toastExito(estado.sufijo + (id ? ' guardado.' : ' registrado.'));
            listar(tipo);
        }, function (error) {
            listo();
            var errores = error.xhr && error.xhr.status === 400 && error.xhr.responseJSON;
            if (Array.isArray(errores)) {
                SGTL.avisoFormulario('#ubicacionAviso', 'No se pudo guardar.', errores.map(function (item) { return item.ErrorMessage; }));
            } else {
                SGTL.avisoFormulario('#ubicacionAviso', error.mensajeUsuario);
            }
        });
    }

    function ubicacionDe(tipo, id) {
        var estado = TIPOS[tipo];
        return estado.lista.find(function (item) { return String(item[estado.campoId]) === String(id); });
    }

    function registro(usuario, fecha) {
        return [usuario, SGTL.fecha(fecha, { hora: true })].filter(Boolean).join(', ');
    }

    function verDetalle(tipo, id) {
        var ubicacion = ubicacionDe(tipo, id);
        porId('detalleTitulo').textContent = 'Ver detalle del ' + tipo;
        porId('detalleCliente').textContent = ubicacion.ClienteRazon;
        porId('detalleDescripcion').textContent = ubicacion.Descripcion;
        porId('detalleProvincia').textContent = ubicacion.NombreProvincia;
        porId('detalleLocalidad').textContent = ubicacion.NombreLocalidad;
        porId('detalleDireccion').textContent = direccion(ubicacion);
        porId('detalleAlta').textContent = registro(ubicacion.Usu_Alta, ubicacion.Fecha_Alta);
        porId('detalleModificacion').textContent = registro(ubicacion.Usu_Modi, ubicacion.Fecha_Modi);
        SGTL.modal('#detalleModal', 'show');
    }

    function eliminar(tipo, id) {
        var estado = TIPOS[tipo];
        SGTL.confirmar({
            titulo: '¿Eliminar el ' + tipo + ' ' + ubicacionDe(tipo, id).Descripcion + '?',
            mensaje: 'No se puede deshacer.',
            verbo: 'Eliminar',
            peligro: true,
            accion: function () {
                return SGTL.ajax({ url: SGTL.api + estado.ruta + '/' + id, type: 'DELETE' }, 'No se pudo eliminar. Probá de nuevo.');
            }
        }).then(function (eliminado) {
            if (!eliminado) return;
            SGTL.toastExito(estado.sufijo + ' eliminado.');
            listar(tipo);
        });
    }

    var ACCIONES = { ver: verDetalle, editar: abrir, eliminar: eliminar };

    Object.keys(TIPOS).forEach(function (tipo) {
        var estado = TIPOS[tipo];
        Object.assign(estado, { lista: [], pagina: 1, tamanio: 15, texto: '', cliente: '' });
        estado.orden = SGTL.tabla.habilitarOrden('#tabla' + estado.sufijo, function () { estado.pagina = 1; dibujar(tipo); });
        SelectClientePredictivo.inicializar('cliente' + estado.sufijo, { idCampo: 'clienteTexto' + estado.sufijo, placeholder: 'Todos los clientes' });
        porId('cliente' + estado.sufijo).addEventListener('change', function () { buscar(tipo); });
        SGTL.filtros(['#clienteTexto' + estado.sufijo, '#texto' + estado.sufijo], function () { buscar(tipo); });
        porId('busqueda' + estado.sufijo).addEventListener('submit', function (evento) {
            evento.preventDefault();
            buscar(tipo);
        });
        porId('registrar' + estado.sufijo).addEventListener('click', function () { abrir(tipo, null); });
        porId('filas' + estado.sufijo).addEventListener('click', function (evento) {
            var boton = evento.target.closest('[data-accion]');
            if (boton) ACCIONES[boton.dataset.accion](tipo, boton.dataset.id);
        });
        listar(tipo);
    });

    porId('ubicacionProvincia').addEventListener('change', function (evento) {
        cargarLocalidades(evento.target.value).catch(function (error) { SGTL.avisoFormulario('#ubicacionAviso', error.mensajeUsuario); });
    });
    porId('ubicacionForm').addEventListener('submit', guardar);
    cargarClientes().then(function (clientes) {
        Object.keys(TIPOS).forEach(function (tipo) {
            var select = porId('cliente' + TIPOS[tipo].sufijo);
            opciones(select, 'Todos los clientes', clientes, 'Cliente_ID', 'Razon_Social');
            SelectClientePredictivo.sincronizar(select);
        });
    }, function (error) {
        SGTL.toastError(error.mensajeUsuario);
    });

    window.loadHeader().catch(function (error) { console.warn('No se pudo cargar el encabezado.', error); });
    window.loadFooter();
    fetch(SGTL.api + '/GestionContenido/1').then(function (respuesta) {
        if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
        return respuesta.json();
    }).then(function (contenido) {
        window.applyStyles(contenido.Logo, contenido.ColorFondo, contenido.ColorBotonesMenu, contenido.ContenidoPiePagina);
    }).catch(function (error) { console.warn('No se pudo cargar la apariencia de SGTL.', error); });
})();
