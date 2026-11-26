(function () {
    'use strict';

    document.body.insertAdjacentHTML('beforeend',
        '<div class="modal fade" id="detalleProforma" tabindex="-1" aria-labelledby="detalleProformaTitulo" aria-hidden="true">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl modal-fullscreen-sm-down">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<h2 id="detalleProformaTitulo" class="modal-title h5 d-flex align-items-center flex-wrap gap-2"></h2>' +
        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>' +
        '</div>' +
        '<div class="modal-body">' +
        '<div id="detalleProformaBloques" class="sgtl-detalle-grilla"></div>' +
        '<div id="detalleProformaRegistro" class="sgtl-detalle-pie mt-3"></div>' +
        '</div>' +
        '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cerrar</button></div>' +
        '</div></div></div>');

    function porId(id) {
        return document.getElementById(id);
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

    function bloque(titulo, contenido, ancho) {
        return '<section class="sgtl-bloque' + (ancho ? ' sgtl-detalle-ancho' : '') + '"><div class="sgtl-bloque-titulo">' + titulo + '</div>' +
            contenido + '</section>';
    }

    function datos(lista) {
        return '<div class="row">' + lista.join('') + '</div>';
    }

    function numero(valor) {
        return Number(valor || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 });
    }

    function titulo(proforma, fila) {
        var partes = ['<span>Ver proforma ' + SGTL.escapar(proforma.Numero) + '</span>', SGTL.estado(proforma.Estado)];
        if (fila.Plataforma) partes.push(etiqueta(fila.Plataforma + ' ' + fila.Plataforma_Numero));
        if (fila.Factura) partes.push(etiqueta('Factura ' + fila.Factura));
        return partes.join('');
    }

    function cliente(proforma) {
        var lugar = [proforma.Cli_Ciudad, proforma.Cli_Provincia].filter(Boolean).join(', ');
        return datos([
            dato('Razón social', SGTL.escapar(proforma.Cli_RazonSocial), true),
            dato('CUIT', SGTL.escapar(proforma.Cli_CUIT)),
            dato('Condición frente al IVA', SGTL.escapar(proforma.Cli_CondIVA)),
            dato('Dirección', SGTL.escapar(proforma.Cli_Direccion) + aclaracion(lugar), true),
            dato('Teléfono', SGTL.escapar(proforma.Cli_Telefono)),
            dato('E-mail', SGTL.escapar(proforma.Cli_Email))
        ]);
    }

    function condiciones(proforma) {
        return datos([
            dato('Emisión', SGTL.fecha(proforma.FechaEmision)),
            dato('Validez', SGTL.escapar(proforma.Validez)),
            dato('Forma de pago', SGTL.escapar(proforma.FormaPago), true),
            dato('Observaciones', SGTL.escapar(proforma.Observaciones), true)
        ]);
    }

    function transporte(proforma) {
        var carga = [proforma.Peso, proforma.Volumen].filter(Boolean).join(' / ');
        if (!proforma.Origen && !proforma.Destino && !proforma.TipoCarga && !carga) return '';
        return bloque('Transporte', datos([
            dato('Origen', SGTL.escapar(proforma.Origen)),
            dato('Destino', SGTL.escapar(proforma.Destino)),
            dato('Tipo de carga', SGTL.escapar(proforma.TipoCarga)),
            dato('Peso / volumen', SGTL.escapar(carga))
        ]), true);
    }

    function linea(concepto) {
        return '<tr><td class="text-nowrap">' + SGTL.escapar(concepto.Codigo) + '</td>' +
            '<td>' + SGTL.escapar(concepto.Concepto) + '<div class="small text-muted">' + SGTL.escapar(concepto.Descripcion) + '</div></td>' +
            '<td class="text-end text-nowrap">' + numero(concepto.Cantidad) + ' ' + SGTL.escapar(concepto.Unidad) + '</td>' +
            '<td class="text-end text-nowrap">' + SGTL.monto(concepto.PrecioUnitario) + '</td>' +
            '<td class="text-end text-nowrap">' + numero(concepto.DescuentoPct) + ' %</td>' +
            '<td class="text-end text-nowrap">' + numero(concepto.IvaPct) + ' %</td>' +
            '<td class="text-end text-nowrap">' + SGTL.monto(concepto.Subtotal) + '</td></tr>';
    }

    function total(nombre, valor) {
        return '<dt class="col-7 fw-normal">' + nombre + '</dt><dd class="col-5 text-end mb-1">' + SGTL.monto(valor) + '</dd>';
    }

    function conceptos(proforma) {
        var lineas = proforma.Detalle || [];
        return '<div class="table-responsive"><table class="table table-sm align-middle">' +
            '<thead><tr><th scope="col">Código</th><th scope="col">Concepto</th><th scope="col" class="text-end">Cantidad</th>' +
            '<th scope="col" class="text-end">P. unitario</th><th scope="col" class="text-end">Desc.</th>' +
            '<th scope="col" class="text-end">IVA</th><th scope="col" class="text-end">Subtotal</th></tr></thead>' +
            '<tbody>' + (lineas.length ? lineas.map(linea).join('') : '<tr><td colspan="7" class="text-center text-muted">Sin conceptos.</td></tr>') +
            '</tbody></table></div>' +
            '<div class="row justify-content-end"><dl class="row col-sm-7 col-lg-4 mb-0">' +
            total('Subtotal', proforma.Subtotal) + total('Descuentos', proforma.Descuentos) +
            total('Subtotal neto', proforma.SubtotalNeto) + total('IVA', proforma.IVA) +
            total('Otros impuestos', proforma.OtrosImpuestos) +
            '<dt class="col-7 border-top pt-1">Total</dt><dd class="col-5 text-end border-top pt-1 mb-0 fw-bold">' +
            SGTL.monto(proforma.TotalGeneral) + '</dd></dl></div>';
    }

    function mostrar(proforma, fila) {
        porId('detalleProformaTitulo').innerHTML = titulo(proforma, fila);
        porId('detalleProformaBloques').innerHTML = bloque('Cliente', cliente(proforma)) +
            bloque('Condiciones', condiciones(proforma)) +
            transporte(proforma) +
            bloque('Conceptos', conceptos(proforma), true);
        porId('detalleProformaRegistro').textContent = SGTL.textoRegistro(
            proforma.Usu_Alta, SGTL.fecha(proforma.Fecha_Alta, { hora: true }));
        SGTL.modal('#detalleProforma', 'show');
    }

    function abrir(fila, boton) {
        var listo = SGTL.procesando(boton);
        SGTL.ajax({ url: SGTL.api + '/Proformas/' + fila.Proforma_ID, type: 'GET' },
            'No se pudo abrir la proforma. Revisá la conexión y probá de nuevo.').then(function (proforma) {
            listo();
            mostrar(proforma, fila);
        }, function (error) {
            listo();
            SGTL.toastError(error.mensajeUsuario);
        });
    }

    window.SGTLDetalleProforma = { abrir: abrir };
})();