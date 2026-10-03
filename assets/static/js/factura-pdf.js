(function (window) {
    'use strict';

    var API = 'http://localhost:50222/api';
    var EMPRESA = { razon: 'Transporte Sánchez' };

    function texto(valor) { return valor == null || valor === '' ? '—' : String(valor); }
    function numero(valor) { return Number(valor || 0); }
    function dinero(valor) {
        return '$ ' + numero(valor).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function fecha(valor) {
        if (!valor) return '—';
        var partes = String(valor).substring(0, 10).split('-');
        return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : texto(valor);
    }
    function token() {
        try { return localStorage.getItem('token') || ''; } catch (e) { return ''; }
    }
    function jsPDF() {
        return window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF;
    }
    function obtenerLogo() {
        return fetch(API + '/GestionContenido/1').then(function (respuesta) {
            return respuesta.ok ? respuesta.json() : null;
        }).then(function (datos) {
            var logo = datos && datos.Logo;
            return typeof logo === 'string' && /^data:image\/(png|jpe?g)/i.test(logo) ? logo : null;
        }).catch(function () { return null; });
    }
    function obtenerComprobante(id) {
        var jwt = token();
        if (!jwt) return Promise.reject(new Error('No hay una sesión activa. Iniciá sesión nuevamente.'));
        return fetch(API + '/comprobantes/' + encodeURIComponent(id), {
            headers: { Accept: 'application/json', Authorization: 'Bearer ' + jwt }
        }).then(function (respuesta) {
            return respuesta.json().catch(function () { return {}; }).then(function (datos) {
                if (!respuesta.ok) throw new Error(datos.error || 'No se pudo obtener el comprobante.');
                return datos;
            });
        });
    }

    function construir(factura, logo) {
        var Constructor = jsPDF();
        if (!Constructor) throw new Error('No se pudo cargar el generador de PDF.');
        var doc = new Constructor({ unit: 'mm', format: 'a4' });
        var ancho = doc.internal.pageSize.getWidth();
        var alto = doc.internal.pageSize.getHeight();
        var margen = 18;
        var y = margen;

        if (logo) {
            try { doc.addImage(logo, 'PNG', margen, y, 45, 18); } catch (e) { logo = null; }
        }
        if (!logo) {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(25);
            doc.text(EMPRESA.razon, margen, y + 8);
        }

        var cajaX = ancho - margen - 67;
        doc.setDrawColor(170); doc.setLineWidth(0.3); doc.roundedRect(cajaX, y, 67, 31, 2, 2);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(25);
        doc.text('FACTURA INTERNA', cajaX + 33.5, y + 7, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
        doc.text('N°: ' + texto(factura.Numero), cajaX + 3, y + 14);
        doc.text('Emisión: ' + fecha(factura.FechaEmision), cajaX + 3, y + 19);
        doc.text('Vencimiento: ' + fecha(factura.FechaVencimiento), cajaX + 3, y + 24);
        doc.text('Estado: ' + texto(factura.EstadoDocumental), cajaX + 3, y + 29);
        y += 37;

        doc.setDrawColor(200); doc.setFillColor(247, 248, 250);
        doc.roundedRect(margen, y, ancho - 2 * margen, 27, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(45);
        doc.text('CLIENTE', margen + 3, y + 5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(65);
        var columnaA = margen + 3;
        var columnaB = ancho / 2 + 4;
        doc.text('Razón social: ' + texto(factura.RazonSocial), columnaA, y + 11);
        doc.text('CUIT: ' + texto(factura.CUIT), columnaB, y + 11);
        doc.text('Condición fiscal: ' + texto(factura.CondicionFiscal), columnaA, y + 16);
        doc.text('Condición comercial: ' + texto(factura.CondicionComercial), columnaB, y + 16);
        var domicilio = doc.splitTextToSize('Domicilio: ' + texto(factura.Domicilio), ancho - 2 * margen - 6);
        doc.text(domicilio.slice(0, 2), columnaA, y + 21);
        y += 33;

        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(45);
        doc.text('CONCEPTO', margen, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(65);
        y += 5;
        var concepto = texto(factura.Concepto);
        if (factura.ProformaNumero) concepto += ' · Proforma ' + factura.ProformaNumero;
        var lineasConcepto = doc.splitTextToSize(concepto, ancho - 2 * margen);
        doc.text(lineasConcepto, margen, y);
        y += lineasConcepto.length * 4 + 3;

        var filas = (factura.Detalle || []).map(function (item) {
            var descripcion = texto(item.Concepto);
            if (item.Descripcion) descripcion += '\n' + item.Descripcion;
            if (item.Unidad) descripcion += '\nUnidad: ' + item.Unidad;
            return [
                numero(item.Cantidad).toLocaleString('es-AR', { maximumFractionDigits: 2 }),
                texto(item.Codigo), descripcion, dinero(item.PrecioUnitario),
                numero(item.DescuentoPct).toLocaleString('es-AR') + '%',
                numero(item.IvaPct).toLocaleString('es-AR') + '%', dinero(item.Total)
            ];
        });
        doc.autoTable({
            head: [['Cant.', 'Código', 'Descripción', 'P. unit.', 'Desc.', 'IVA', 'Total']],
            body: filas.length ? filas : [['', '', 'Sin conceptos', '', '', '', '']],
            startY: y,
            margin: { left: margen, right: margen, bottom: 30 },
            styles: { fontSize: 7.8, cellPadding: 1.6, overflow: 'linebreak' },
            headStyles: { fillColor: [33, 37, 41], textColor: 255, halign: 'center' },
            columnStyles: {
                0: { halign: 'right', cellWidth: 13 }, 1: { cellWidth: 19 }, 2: { cellWidth: 'auto' },
                3: { halign: 'right', cellWidth: 24 }, 4: { halign: 'right', cellWidth: 15 },
                5: { halign: 'right', cellWidth: 13 }, 6: { halign: 'right', cellWidth: 25 }
            }
        });

        y = doc.lastAutoTable.finalY + 6;
        function nuevaPaginaSiHaceFalta(espacio) {
            if (y + espacio > alto - 30) { doc.addPage(); y = margen; }
        }
        nuevaPaginaSiHaceFalta(54);
        var totalX = ancho - margen - 72;
        function lineaTotal(etiqueta, valor, destacado) {
            doc.setFont('helvetica', destacado ? 'bold' : 'normal');
            doc.setFontSize(destacado ? 11 : 8.5); doc.setTextColor(destacado ? 20 : 65);
            doc.text(etiqueta, totalX, y); doc.text(dinero(valor), ancho - margen, y, { align: 'right' });
            y += destacado ? 7 : 5;
        }
        lineaTotal('Subtotal', factura.Subtotal);
        lineaTotal('Descuentos', factura.Descuentos);
        lineaTotal('Neto', factura.Neto);
        lineaTotal('IVA', factura.IVA);
        lineaTotal('Otros impuestos', factura.OtrosImpuestos);
        doc.setDrawColor(175); doc.line(totalX, y - 2, ancho - margen, y - 2); y += 2;
        lineaTotal('TOTAL', factura.Total, true);

        y += 2;
        nuevaPaginaSiHaceFalta(25);
        doc.setDrawColor(210); doc.setFillColor(248, 249, 250);
        doc.roundedRect(margen, y, ancho - 2 * margen, 17, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(45);
        doc.text('ESTADO FINANCIERO: ' + texto(factura.EstadoFinanciero).toUpperCase(), margen + 3, y + 6);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(70);
        doc.text('Aplicado: ' + dinero(factura.ImporteAplicado), margen + 3, y + 12);
        doc.text('Saldo pendiente: ' + dinero(factura.SaldoPendiente), ancho - margen - 3, y + 12, { align: 'right' });
        y += 22;

        if (factura.Observaciones) {
            nuevaPaginaSiHaceFalta(18);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(45);
            doc.text('OBSERVACIONES', margen, y); y += 5;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(65);
            doc.text(doc.splitTextToSize(factura.Observaciones, ancho - 2 * margen), margen, y);
        }

        var usuario = '—';
        try { usuario = localStorage.getItem('username') || localStorage.getItem('usuario') || '—'; } catch (e) { }
        var ahora = new Date();
        var generado = ahora.toLocaleDateString('es-AR') + ' ' + ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        var paginas = doc.getNumberOfPages();
        for (var pagina = 1; pagina <= paginas; pagina++) {
            doc.setPage(pagina);
            var pieY = alto - 20;
            doc.setDrawColor(200); doc.line(margen, pieY, ancho - margen, pieY);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(150, 0, 0);
            doc.text('COMPROBANTE INTERNO — SIN VALIDEZ FISCAL', ancho / 2, pieY + 5, { align: 'center' });
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(105);
            doc.text('Generado: ' + generado + ' · Usuario: ' + usuario, margen, pieY + 12);
            doc.text('Página ' + pagina + ' de ' + paginas, ancho - margen, pieY + 12, { align: 'right' });
        }
        return doc;
    }

    function generar(id, modo) {
        Promise.all([obtenerComprobante(id), obtenerLogo()]).then(function (resultado) {
            var factura = resultado[0];
            if (factura.Tipo !== 'FAC') throw new Error('El comprobante seleccionado no es una Factura.');
            var doc = construir(factura, resultado[1]);
            if (modo === 'imprimir') {
                doc.autoPrint();
                window.open(doc.output('bloburl'), '_blank');
            } else {
                doc.save('Factura_' + texto(factura.Numero).replace(/[^a-z0-9_-]/gi, '_') + '.pdf');
            }
        }).catch(function (error) {
            alert(error && error.message ? error.message : 'No se pudo generar el PDF de la Factura.');
        });
    }

    window.descargarFacturaPDF = function (id) { generar(id, 'descargar'); };
    window.imprimirFacturaPDF = function (id) { generar(id, 'imprimir'); };
})(window);
