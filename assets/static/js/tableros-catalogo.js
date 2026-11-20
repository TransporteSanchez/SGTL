(function () {
    'use strict';

    var TEMAS = [
        { id: 'viajes', texto: 'Viajes' },
        { id: 'flota', texto: 'Flota' },
        { id: 'choferes', texto: 'Choferes' },
        { id: 'facturacion', texto: 'Facturación' }
    ];

    function kpi(id, barra) {
        var valor = '<span class="h3 mb-0" id="' + id + '">—</span>';
        if (!barra) return valor + '<small class="text-muted d-block" id="' + id + '-detalle"></small>';
        return valor + '<div class="progress mt-2" role="progressbar" aria-label="' + barra.etiqueta + '" aria-valuemin="0" aria-valuemax="100">' +
            '<div class="progress-bar ' + barra.clase + '" id="' + barra.id + '"></div></div>';
    }

    function tabla(id, columnas, encabezados) {
        return '<div class="table-responsive"><table class="table table-sm mb-0"><thead><tr>' + encabezados + '</tr></thead>' +
            '<tbody id="' + id + '"><tr><td colspan="' + columnas + '" class="text-center text-muted py-4">Cargando…</td></tr></tbody></table></div>';
    }

    function lista(id) {
        return '<div id="' + id + '" class="list-group list-group-flush"><div class="text-muted text-center py-4">Cargando…</div></div>';
    }

    function mapa(id) {
        return '<div id="' + id + '"><p class="text-muted text-center py-4 mb-0">Cargando…</p></div>';
    }

    var CATALOGO = [
        { id: 'kpiviajes', tema: 'viajes', titulo: 'Viajes', tipo: 'kpi', cuerpo: kpi('kpi-viajes') },
        { id: 'kpientregados', tema: 'viajes', titulo: 'Entregados', tipo: 'kpi', cuerpo: kpi('kpi-entregados') },
        { id: 'kpipendientes', tema: 'viajes', titulo: 'Pendientes de entrega', tipo: 'kpi', cuerpo: kpi('kpi-pendientes') },
        { id: 'kpirechazo', tema: 'viajes', titulo: 'Entregados con rechazo', tipo: 'kpi', cuerpo: kpi('kpi-rechazo') },
        { id: 'revisar', tema: 'viajes', titulo: 'Para revisar', tipo: 'lista', cuerpo: '<div class="small text-muted px-3 py-2 d-none" id="revisar-resumen"></div>' + tabla('revisar-viajes', 3, '<th>Motivo</th><th>Viaje</th><th class="text-center">Acciones</th>') },
        { id: 'proximos', tema: 'viajes', titulo: 'Próximos viajes', tipo: 'lista', cuerpo: lista('proximos-viajes') },
        { id: 'viajesmes', tema: 'viajes', titulo: 'Viajes por mes', tituloId: 'titulo-grafico-viajes', tipo: 'grafico', cuerpo: '<div id="grafico-viajes"></div>' },
        { id: 'clientesmes', tema: 'viajes', titulo: 'Viajes por cliente, mes y resultado', tituloId: 'titulo-clientesmes', tipo: 'natural', cuerpo: '<div id="clientes-mes"><p class="text-muted text-center py-4 mb-0">Cargando…</p></div>' },
        { id: 'recorridos', tema: 'viajes', titulo: 'Recorridos más usados', tipo: 'natural', cuerpo: mapa('calor-recorridos') },
        { id: 'rechazos', tema: 'viajes', titulo: 'Rechazos por cliente y destino', tipo: 'natural', cuerpo: mapa('calor-rechazos') },
        { id: 'ultimos', tema: 'viajes', titulo: 'Últimos viajes', tipo: 'lista', cuerpo: tabla('ultimos-viajes', 5, '<th class="text-center">Fecha</th><th>Recorrido y cliente</th><th class="text-end">Km</th><th class="text-center">Estado</th><th class="text-center">Acciones</th>') },
        { id: 'comparativa', tema: 'viajes', titulo: 'Comparativa por mes', tituloId: 'titulo-comparativa', tipo: 'lista', cuerpo: tabla('comparativa-meses', 8, '<th id="comparativa-columna">Mes</th><th class="text-end">Viajes</th><th class="text-end">Variación</th><th class="text-end">Entregados</th><th class="text-end">Parciales</th><th class="text-end">Con rechazo</th><th class="text-end">Pendientes</th><th class="text-end">Km</th>') },
        { id: 'calendario', tema: 'viajes', titulo: 'Calendario de viajes', tipo: 'natural', cuerpo: '<div id="calendarioViajes"></div>' },
        { id: 'camiones', tema: 'flota', titulo: 'Camiones activos', tipo: 'kpi', cuerpo: kpi('camiones-activos-texto', { id: 'camiones-activos-bar', clase: 'bg-success', etiqueta: 'Camiones activos' }) },
        { id: 'kpikm', tema: 'flota', titulo: 'Km recorridos', tipo: 'kpi', cuerpo: kpi('kpi-km') },
        { id: 'itv', tema: 'flota', titulo: 'ITV de camiones', tipo: 'lista', cuerpo: lista('itv-camiones') },
        { id: 'kmmes', tema: 'flota', titulo: 'Km por mes', tituloId: 'titulo-grafico-km', tipo: 'grafico', cuerpo: '<div id="grafico-km"></div>' },
        { id: 'kmcamion', tema: 'flota', titulo: 'Km por camión', tipo: 'grafico', cuerpo: '<div id="grafico-camiones"></div>' },
        { id: 'kmcamionmes', tema: 'flota', titulo: 'Km por camión y por mes', tituloId: 'titulo-kmcamionmes', tipo: 'natural', cuerpo: mapa('calor-camiones') },
        { id: 'ingresoscamionmes', tema: 'flota', titulo: 'Ingresos por camión y por mes', tituloId: 'titulo-ingresoscamionmes', tipo: 'natural', cuerpo: mapa('calor-ingresos') },
        { id: 'choferes', tema: 'choferes', titulo: 'Choferes activos', tipo: 'kpi', cuerpo: kpi('choferes-activos-texto', { id: 'choferes-activos-bar', clase: 'bg-primary', etiqueta: 'Choferes activos' }) },
        { id: 'kmchofer', tema: 'choferes', titulo: 'Km por chofer', tipo: 'grafico', cuerpo: '<div id="grafico-choferes"></div>' },
        { id: 'costo', tema: 'facturacion', titulo: 'Importe promedio por viaje', tipo: 'kpi', cuerpo: kpi('costo-promedio-texto').replace('id="costo-promedio-texto-detalle"', 'id="costo-detalle"') },
        { id: 'topclientes', tema: 'facturacion', titulo: 'Top clientes en facturación', tipo: 'lista', cuerpo: lista('top-clientes-list') },
        { id: 'deudavencida', tema: 'facturacion', titulo: 'Deuda vencida por cliente', tipo: 'lista', cuerpo: '<div class="small text-muted px-3 py-2 d-none" id="deuda-resumen"></div>' + tabla('deuda-clientes', 3, '<th>Cliente</th><th class="text-end">Vencido</th><th class="text-end">Por vencer</th>') },
        { id: 'facturacionmes', tema: 'facturacion', titulo: 'Facturación por cliente y por mes', tituloId: 'titulo-facturacionmes', tipo: 'natural', cuerpo: mapa('calor-facturacion') },
        { id: 'deudaantiguedad', tema: 'facturacion', titulo: 'Antigüedad de la deuda', tipo: 'natural', cuerpo: mapa('calor-deuda') }
    ];

    var POR_ID = {};
    CATALOGO.forEach(function (tablero) { POR_ID[tablero.id] = tablero; });

    window.SGTLTableros = { TEMAS: TEMAS, CATALOGO: CATALOGO, POR_ID: POR_ID };
})();