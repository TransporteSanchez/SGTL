(function () {
    'use strict';

    var COLUMNAS = 7;
    var tamanio = 15;
    var pedido = 0;
    var proformas = [];
    var orden;

    function porId(id) {
        return document.getElementById(id);
    }

    function enPlataforma(proforma) {
        return proforma.Plataforma ? proforma.Plataforma + ' ' + proforma.Plataforma_Numero : '';
    }

    function fila(proforma) {
        return '<tr>' +
            '<td class="text-nowrap">' + SGTL.escapar(proforma.Numero) +
            '<div class="small text-muted">' + SGTL.escapar(enPlataforma(proforma)) + '</div></td>' +
            '<td>' + SGTL.escapar(proforma.Cliente) + '</td>' +
            '<td class="text-center text-nowrap">' + SGTL.fecha(proforma.Fecha) + '</td>' +
            '<td class="text-end text-nowrap">' + SGTL.monto(proforma.Total) + '</td>' +
            '<td>' + SGTL.escapar(proforma.UsuarioCreador) + '</td>' +
            '<td class="text-center text-nowrap">' + SGTL.estado(proforma.Estado) + '</td>' +
            '<td class="text-center">' +
            SGTL.accionesFila([
                SGTL.botonFila('ver', { id: proforma.Proforma_ID }),
                SGTL.botonFila('pdf', { id: proforma.Proforma_ID, texto: 'Descargar PDF' })
            ]) + '</td></tr>';
    }

    function filtros() {
        var fecha = SGTL.valorRango('#proformaFecha') || {};
        return Object.assign({
            soloGeneradas: true,
            numero: porId('proformaNumero').value.trim(),
            clienteId: porId('proformaCliente').value,
            desde: fecha.desde,
            hasta: fecha.hasta,
            estado: porId('proformaEstado').value,
            tipo: porId('proformaTipo').value,
            usuario: porId('proformaUsuario').value.trim()
        }, orden.parametros());
    }

    function consultar(pagina, cantidad, mensaje) {
        return SGTL.ajax({
            url: SGTL.api + '/Proformas',
            type: 'GET',
            data: Object.assign(filtros(), { page: pagina, pageSize: cantidad })
        }, mensaje);
    }

    function buscar(pagina) {
        var numero = ++pedido;
        SGTL.tabla.cargando('#filasProformas', COLUMNAS);
        consultar(pagina, tamanio, 'No se pudieron cargar las proformas. Revisá la conexión y probá de nuevo.').then(function (datos) {
            if (numero !== pedido) return;
            proformas = datos.items;
            if (datos.items.length) SGTL.tabla.llenar('#filasProformas', datos.items.map(fila).join(''));
            else SGTL.tabla.vacia('#filasProformas', COLUMNAS);
            SGTL.tabla.paginacion('#paginacionProformas', {
                total: datos.total,
                tamanioPagina: tamanio,
                pagina: pagina,
                alCambiarPagina: buscar,
                alCambiarTamanio: function (nuevo) { tamanio = nuevo; buscar(1); }
            });
        }, function (error) {
            if (numero !== pedido) return;
            SGTL.tabla.vacia('#filasProformas', COLUMNAS, 'No se pudieron cargar las proformas.');
            SGTL.tabla.paginacion('#paginacionProformas', { total: 0 });
            SGTL.toastError(error.mensajeUsuario);
        });
    }

    function exportar() {
        var listo = SGTL.procesando('#exportarProformas');
        consultar(1, 0, 'No se pudo exportar. Revisá la conexión y probá de nuevo.').then(function (datos) {
            listo();
            if (!datos.items.length) return SGTL.toastError('No hay proformas para exportar con los filtros elegidos.');
            SGTL.descargarCSV('Listado_Proformas.csv',
                ['Número', 'Cliente', 'Fecha', 'Destino', 'Total', 'Estado', 'Comprobante', 'Plataforma', 'Usuario'],
                datos.items.map(function (proforma) {
                    return [proforma.Numero, proforma.Cliente, SGTL.fecha(proforma.Fecha), proforma.Destino, SGTL.monto(proforma.Total),
                        proforma.Estado, proforma.Factura, enPlataforma(proforma), proforma.UsuarioCreador];
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
            clientes.forEach(function (cliente) { porId('proformaCliente').append(new Option(cliente.Razon_Social, cliente.Cliente_ID)); });
            SelectClientePredictivo.sincronizar('proformaCliente');
        }, function (error) {
            SGTL.toastError(error.mensajeUsuario);
        });
    }

    SGTL.rangoFechas('#proformaFecha', { onClose: function (fechas) { if (fechas.length !== 1) buscar(1); } });
    orden = SGTL.tabla.habilitarOrden('#tablaProformas', function () { buscar(1); });
    SelectClientePredictivo.inicializar('proformaCliente', { idCampo: 'proformaClienteTexto', placeholder: 'Todos los clientes' });
    SGTL.filtros(['#proformaNumero', '#proformaClienteTexto', '#proformaFecha', '#proformaEstado', '#proformaTipo', '#proformaUsuario'], function () {
        if (!porId('proformaClienteTexto').value) porId('proformaCliente').value = '';
        buscar(1);
    });
    ['proformaCliente', 'proformaEstado', 'proformaTipo'].forEach(function (id) {
        porId(id).addEventListener('change', function () { buscar(1); });
    });
    porId('busquedaProformas').addEventListener('submit', function (evento) {
        evento.preventDefault();
        buscar(1);
    });
    porId('exportarProformas').addEventListener('click', exportar);
    porId('filasProformas').addEventListener('click', function (evento) {
        var boton = evento.target.closest('[data-accion]');
        if (!boton) return;
        if (boton.dataset.accion === 'pdf') return window.descargarProformaPDF(boton.dataset.id);
        SGTLDetalleProforma.abrir(proformas.find(function (proforma) { return String(proforma.Proforma_ID) === boton.dataset.id; }), boton);
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