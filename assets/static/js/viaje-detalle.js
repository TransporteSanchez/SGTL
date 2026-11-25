(function () {
    'use strict';

    var SIN_ENTREGA = {
        Registrado: 'Todavía no se registró la entrega.',
        En_viaje: 'Todavía no se registró la entrega.',
        Cancelado: 'No se hizo: el viaje está cancelado.'
    };

    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="detalleViaje" tabindex="-1" aria-labelledby="detalleViajeTitulo" aria-hidden="true">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg modal-fullscreen-sm-down">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<h2 id="detalleViajeTitulo" class="modal-title h5 d-flex align-items-center flex-wrap gap-2"></h2>' +
        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>' +
        '</div>' +
        '<div class="modal-body">' +
        '<div id="detalleViajeBloques" class="sgtl-detalle-grilla"></div>' +
        '<div id="detalleViajeRegistro" class="sgtl-detalle-pie mt-3"></div>' +
        '</div>' +
        '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cerrar</button></div>' +
        '</div></div></div>');

    function porId(id) {
        return document.getElementById(id);
    }

    function fechaHora(valor) {
        return SGTL.fecha(valor, { hora: true });
    }

    function etiqueta(texto) {
        return '<span class="badge rounded-pill bg-white text-dark border">' + SGTL.escapar(texto) + '</span>';
    }

    function aclaracion(texto) {
        return texto ? '<div class="suave">' + SGTL.escapar(texto) + '</div>' : '';
    }

    function dato(nombre, valor, ancho) {
        return '<div class="' + (ancho ? 'col-12' : 'col-6') + ' sgtl-dato"><span class="sgtl-dato-etiqueta">' + nombre + '</span>' +
            '<div class="sgtl-dato-valor">' + valor + '</div></div>';
    }

    function bloque(titulo, datos, ancho) {
        return '<section class="sgtl-bloque' + (ancho ? ' sgtl-detalle-ancho' : '') + '"><div class="sgtl-bloque-titulo">' + titulo + '</div>' +
            '<div class="row">' + datos.join('') + '</div></section>';
    }

    function conPlataforma(viaje) {
        return viaje.Tipo_Cliente === 'Con_plataforma';
    }

    function titulo(viaje) {
        var presupuesto = viaje.Presupuesto_ID || viaje.Cancelado_Presupuesto_ID;
        var partes = ['<span>Ver detalle del viaje #' + viaje.Viaje_ID + '</span>', SGTL.estadoViaje(viaje.Estado)];
        if (viaje.EnProforma_ID) partes.push(etiqueta('En ' + (viaje.EnProforma_Numero || 'borrador de proforma #' + viaje.EnProforma_ID)));
        if (presupuesto) partes.push(etiqueta('Del presupuesto #' + presupuesto));
        return partes.join('');
    }

    function cancelacion(viaje) {
        return [
            dato('Motivo', SGTL.escapar(viaje.Cancelado_Motivo), true),
            dato('Fecha', fechaHora(viaje.Cancelado_Fecha)),
            dato('Usuario', SGTL.escapar(viaje.Cancelado_Usuario))
        ];
    }

    function recorrido(viaje) {
        var km = SGTL.km(String(viaje.Distancia_KM || '').replace(',', '.'));
        return [
            dato('Cliente', SGTL.escapar(viaje.Cliente) + (conPlataforma(viaje) ? ' ' + etiqueta('Rukas') : '')),
            dato('Distancia', km && km + ' km'),
            dato('Origen', SGTL.escapar(viaje.Origen) + aclaracion(viaje.Origen_Direccion)),
            dato('Destino', SGTL.escapar(viaje.Destino) + aclaracion(viaje.Destino_Direccion))
        ];
    }

    function asignacion(viaje) {
        return [
            dato('Inicio', fechaHora(viaje.Fecha_Inicio)),
            dato('Fin', fechaHora(viaje.Fecha_Fin)),
            dato('Camión', SGTL.escapar(viaje.Camion)),
            dato('Chofer', SGTL.escapar(viaje.Chofer) || 'Sin asignar')
        ];
    }

    function textoAdicional(adicional) {
        var texto = adicional.Nombre;
        if (adicional.Porcentaje) texto += ' (' + adicional.Porcentaje + ' % del flete)';
        else if (adicional.Cantidad > 1) texto += ' × ' + adicional.Cantidad;
        return '<div>' + SGTL.escapar(texto) + aclaracion(adicional.Comentario) + '</div>';
    }

    function tarifa(viaje) {
        var adicionales = JSON.parse(viaje.Adicionales || '[]');
        var importe = viaje.Importe == null
            ? 'Sin tarifa asignada.'
            : '<strong>' + SGTL.monto(viaje.Importe) + '</strong> sin IVA' + aclaracion(viaje.Detalle_Importe);
        return [
            dato('Importe', importe, true),
            adicionales.length ? dato('Adicionales', adicionales.map(textoAdicional).join(''), true) : ''
        ];
    }

    function entrega(viaje) {
        if (viaje.Estado === 'Sin_carga' || (viaje.Estado === 'Facturado' && viaje.Falso_Flete)) {
            return [
                dato('Resultado', SGTL.estadoViaje('Sin_carga') + aclaracion('Llegó al origen y no había carga.')),
                dato('Fecha', SGTL.fecha(viaje.Fecha_Entrega)),
                dato('Observación', SGTL.escapar(viaje.Sin_Carga_Observacion), true)
            ];
        }
        var entregado = viaje.Resultado_Entrega || viaje.Fecha_Entrega;
        var sinEvidencia = conPlataforma(viaje) ? 'Sin adjuntar (la constancia está en Rukas)' : 'Sin adjuntar';
        var datos = entregado
            ? [dato('Resultado', viaje.Resultado_Entrega ? SGTL.estado(viaje.Resultado_Entrega) : ''), dato('Fecha', SGTL.fecha(viaje.Fecha_Entrega))]
            : [dato('Resultado', SIN_ENTREGA[viaje.Estado] || 'Sin datos de la entrega.', true)];
        if (entregado || viaje.Tiene_Evidencia) datos.push(dato('Evidencia', viaje.Tiene_Evidencia ? 'Adjunta' : sinEvidencia, true));
        return datos;
    }

    function numeros(viaje) {
        var remito = dato('Número de remito', SGTL.escapar(viaje.Num_Remito));
        if (!conPlataforma(viaje)) return [remito];
        return [
            remito,
            dato('N° transporte SAP', SGTL.escapar(viaje.Num_Transporte)),
            dato('N° entrega Rukas', SGTL.escapar(viaje.Num_de_Carga))
        ];
    }

    function abrir(viaje) {
        porId('detalleViajeTitulo').innerHTML = titulo(viaje);
        porId('detalleViajeBloques').innerHTML = (viaje.Estado === 'Cancelado' ? bloque('Cancelación', cancelacion(viaje), true) : '') +
            bloque('Recorrido', recorrido(viaje), true) +
            bloque('Fechas, camión y chofer', asignacion(viaje)) +
            bloque('Tarifa', tarifa(viaje)) +
            bloque('Entrega', entrega(viaje)) +
            bloque('Números de referencia', numeros(viaje));
        porId('detalleViajeRegistro').textContent = SGTL.textoRegistro(
            viaje.Usu_Alta, fechaHora(viaje.Fecha_Alta), viaje.Usu_Modi, fechaHora(viaje.Fecha_Modi));
        SGTL.modal('#detalleViaje', 'show');
    }

    window.SGTLDetalleViaje = { abrir: abrir };
})();