(function () {
    'use strict';

    var COLUMNAS = 7;
    var estados = SGTL.estadosViaje();
    var tamanio = 15;
    var pedido = 0;
    var viajes = [];
    var orden;

    function porId(id) {
        return document.getElementById(id);
    }

    function textoKm(valor) {
        var numero = Number(String(valor || '').replace(',', '.'));
        return numero ? SGTL.km(numero) : '—';
    }

    function celdaFecha(viaje) {
        var inicio = SGTL.fecha(viaje.Fecha_Inicio);
        var fin = SGTL.fecha(viaje.Fecha_Fin);
        return inicio + (inicio === fin ? '' : '<div class="small text-muted">al ' + fin + '</div>');
    }

    function fila(viaje) {
        return '<tr>' +
            '<td>' + viaje.Viaje_ID + '</td>' +
            '<td>' + SGTL.escapar(viaje.Cliente) + '</td>' +
            '<td class="text-center text-nowrap">' + celdaFecha(viaje) + '</td>' +
            '<td>' + SGTL.escapar(viaje.Origen) + '<div class="small text-muted">→ ' + SGTL.escapar(viaje.Destino) + '</div></td>' +
            '<td class="text-end text-nowrap">' + textoKm(viaje.Distancia_KM) + '</td>' +
            '<td class="text-center text-nowrap">' + SGTL.estadoViaje(viaje.Estado) + '</td>' +
            '<td class="text-center">' + SGTL.accionesFila([SGTL.botonFila('ver', { id: viaje.Viaje_ID })]) + '</td></tr>';
    }

    function filtros() {
        var inicio = SGTL.valorRango('#viajeInicio') || {};
        var fin = SGTL.valorRango('#viajeFin') || {};
        return Object.assign({
            idViaje: porId('viajeNumero').value,
            clienteId: porId('viajeCliente').value,
            fechaDesde: inicio.desde,
            fechaHasta: inicio.hasta,
            fechaFinDesde: fin.desde,
            fechaFinHasta: fin.hasta,
            estado: porId('viajeEstado').value,
            referencia: porId('viajeReferencia').value.trim()
        }, orden.parametros());
    }

    function consultar(pagina, cantidad, mensaje) {
        return SGTL.ajax({
            url: SGTL.api + '/Viajes/Buscar',
            type: 'GET',
            data: Object.assign(filtros(), { page: pagina, pageSize: cantidad })
        }, mensaje);
    }

    function buscar(pagina) {
        var numero = ++pedido;
        SGTL.tabla.cargando('#filasViajes', COLUMNAS);
        consultar(pagina, tamanio, 'No se pudieron cargar los viajes. Revisá la conexión y probá de nuevo.').then(function (datos) {
            if (numero !== pedido) return;
            viajes = datos.Results;
            if (viajes.length) SGTL.tabla.llenar('#filasViajes', viajes.map(fila).join(''));
            else SGTL.tabla.vacia('#filasViajes', COLUMNAS);
            SGTL.tabla.paginacion('#paginacionViajes', {
                total: datos.TotalRecords,
                tamanioPagina: tamanio,
                pagina: pagina,
                alCambiarPagina: buscar,
                alCambiarTamanio: function (nuevo) { tamanio = nuevo; buscar(1); }
            });
        }, function (error) {
            if (numero !== pedido) return;
            SGTL.tabla.vacia('#filasViajes', COLUMNAS, 'No se pudieron cargar los viajes.');
            SGTL.tabla.paginacion('#paginacionViajes', { total: 0 });
            SGTL.toastError(error.mensajeUsuario);
        });
    }

    function exportar() {
        var listo = SGTL.procesando('#exportarViajes');
        consultar(1, 0, 'No se pudo exportar. Revisá la conexión y probá de nuevo.').then(function (datos) {
            listo();
            if (!datos.Results.length) return SGTL.toastError('No hay viajes para exportar con los filtros elegidos.');
            SGTL.descargarCSV('Listado_Viajes.csv',
                ['Número', 'Cliente', 'Fecha de inicio', 'Fecha de fin', 'Origen', 'Destino', 'Km', 'Estado', 'Chofer', 'Camión',
                    'N° remito', 'N° transporte SAP', 'N° entrega Rukas'],
                datos.Results.map(function (viaje) {
                    return [viaje.Viaje_ID, viaje.Cliente, SGTL.fecha(viaje.Fecha_Inicio), SGTL.fecha(viaje.Fecha_Fin), viaje.Origen, viaje.Destino,
                        textoKm(viaje.Distancia_KM), estados[viaje.Estado], viaje.Chofer, viaje.Camion,
                        viaje.Num_Remito, viaje.Num_Transporte, viaje.Num_de_Carga];
                }));
        }, function (error) {
            listo();
            SGTL.toastError(error.mensajeUsuario);
        });
    }

    function cargarClientes() {
        SGTL.ajax({ url: SGTL.api + '/Clientes', type: 'GET' },
            'No se pudieron cargar los clientes. Revisá la conexión y probá de nuevo.').then(function (clientes) {
            clientes.sort(function (a, b) { return a.Razon_Social.localeCompare(b.Razon_Social, 'es'); });
            clientes.forEach(function (cliente) { porId('viajeCliente').append(new Option(cliente.Razon_Social, cliente.Cliente_ID)); });
            SelectClientePredictivo.sincronizar('viajeCliente');
        }, function (error) {
            SGTL.toastError(error.mensajeUsuario);
        });
    }

    Object.keys(estados).forEach(function (estado) { porId('viajeEstado').append(new Option(estados[estado], estado)); });
    ['#viajeInicio', '#viajeFin'].forEach(function (rango) {
        SGTL.rangoFechas(rango, { onClose: function (fechas) { if (fechas.length !== 1) buscar(1); } });
    });
    orden = SGTL.tabla.habilitarOrden('#tablaViajes', function () { buscar(1); });
    SelectClientePredictivo.inicializar('viajeCliente', { idCampo: 'viajeClienteTexto', placeholder: 'Todos los clientes' });
    SGTL.filtros(['#viajeNumero', '#viajeClienteTexto', '#viajeInicio', '#viajeFin', '#viajeEstado', '#viajeReferencia'], function () {
        if (!porId('viajeClienteTexto').value) porId('viajeCliente').value = '';
        buscar(1);
    });
    ['viajeCliente', 'viajeEstado'].forEach(function (id) { porId(id).addEventListener('change', function () { buscar(1); }); });
    porId('viajeNumero').addEventListener('input', function () { this.value = this.value.replace(/\D/g, ''); });
    porId('busquedaViajes').addEventListener('submit', function (evento) {
        evento.preventDefault();
        buscar(1);
    });
    porId('exportarViajes').addEventListener('click', exportar);
    porId('filasViajes').addEventListener('click', function (evento) {
        var boton = evento.target.closest('[data-accion="ver"]');
        if (!boton) return;
        SGTLDetalleViaje.abrir(viajes.find(function (viaje) { return String(viaje.Viaje_ID) === boton.dataset.id; }));
    });
    cargarClientes();
    buscar(1);

    window.loadHeader().catch(function (error) { console.warn('No se pudo cargar el encabezado.', error); });
    window.loadFooter();
    fetch(SGTL.api + '/GestionContenido/1').then(function (respuesta) {
        if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
        return respuesta.json();
    }).then(function (contenido) {
        window.applyStyles(contenido.Logo, contenido.ColorFondo, contenido.ColorBotonesMenu, contenido.ContenidoPiePagina);
    }).catch(function (error) { console.warn('No se pudo cargar la apariencia de SGTL.', error); });
})();