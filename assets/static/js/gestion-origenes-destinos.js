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
            if (estado.cliente && String(ubicacion.ClienteID) !== estado.cliente) return false;
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
        estado.cliente = porId('cliente' + estado.sufijo).value;
        estado.pagina = 1;
        dibujar(tipo);
    }

    Object.keys(TIPOS).forEach(function (tipo) {
        var estado = TIPOS[tipo];
        Object.assign(estado, { lista: [], pagina: 1, tamanio: 15, texto: '', cliente: '' });
        estado.orden = SGTL.tabla.habilitarOrden('#tabla' + estado.sufijo, function () { estado.pagina = 1; dibujar(tipo); });
        SGTL.filtros(['#texto' + estado.sufijo], function () { buscar(tipo); });
        porId('busqueda' + estado.sufijo).addEventListener('submit', function (evento) {
            evento.preventDefault();
            buscar(tipo);
        });
        listar(tipo);
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
