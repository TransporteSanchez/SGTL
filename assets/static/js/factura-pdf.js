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
    // jsPDF trabaja de forma consistente con PNG. Gestión de Contenido, en cambio,
    // admite archivos subidos, data URI y rutas/URL de PNG, SVG, JPG, WebP e ICO.
    // Se rasteriza la imagen configurada para que cualquiera de esas opciones llegue
    // al comprobante impreso.
    function convertirLogoAPng(origen) {
        if (typeof origen !== 'string' || !origen.trim()) return Promise.resolve(null);

        return new Promise(function (resolver) {
            var imagen = new Image();
            imagen.onload = function () {
                var anchoOriginal = imagen.naturalWidth || imagen.width;
                var altoOriginal = imagen.naturalHeight || imagen.height;
                if (!anchoOriginal || !altoOriginal) { resolver(null); return; }

                // Limitar el raster evita generar PDFs innecesariamente pesados.
                var escala = Math.min(1, 900 / anchoOriginal, 400 / altoOriginal);
                var lienzo = document.createElement('canvas');
                lienzo.width = Math.max(1, Math.round(anchoOriginal * escala));
                lienzo.height = Math.max(1, Math.round(altoOriginal * escala));

                try {
                    lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
                    resolver(lienzo.toDataURL('image/png'));
                } catch (e) {
                    // Una URL externa sin CORS no se puede incluir en un PDF del navegador.
                    resolver(null);
                }
            };
            imagen.onerror = function () { resolver(null); };

            // Permite rasterizar URL externas cuando el servidor de la imagen habilita CORS.
            try {
                var url = new URL(origen, window.location.href);
                if (/^https?:$/i.test(url.protocol) && url.origin !== window.location.origin) imagen.crossOrigin = 'anonymous';
            } catch (e) { }
            imagen.src = origen;
        });
    }
    function obtenerLogo() {
        return fetch(API + '/GestionContenido/1').then(function (respuesta) {
            return respuesta.ok ? respuesta.json() : null;
        }).then(function (datos) {
            return convertirLogoAPng(datos && datos.Logo);
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

    function tituloComprobante(tipo) {
        return {
            FAC: 'FACTURA',
            REC: 'RECIBO',
            NC: 'NOTA DE CRÉDITO',
            ND: 'NOTA DE DÉBITO'
        }[tipo] || null;
    }
    function nombreArchivoComprobante(tipo) {
        return {
            FAC: 'Factura', REC: 'Recibo', NC: 'Nota_de_Credito', ND: 'Nota_de_Debito'
        }[tipo] || 'Comprobante';
    }

    function construir(factura, logo) {
        var Constructor = jsPDF();
        if (!Constructor) throw new Error('No se pudo cargar el generador de PDF.');
        var doc = new Constructor({ unit: 'mm', format: 'a4' });
        var ancho = doc.internal.pageSize.getWidth();
        var alto = doc.internal.pageSize.getHeight();
        var margen = 9;
        var anchoUtil = ancho - (margen * 2);
        var y = margen;
        var titulo = tituloComprobante(factura.Tipo) || 'COMPROBANTE';
        var colorTexto = [20, 20, 20];
        var colorSecundario = [90, 90, 90];
        var colorFondo = [245, 245, 245];

        function prepararTexto() {
            doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
            doc.setDrawColor(25, 25, 25);
            doc.setLineWidth(0.35);
        }
        function etiquetaValor(etiqueta, valor, x, posicionY) {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
            doc.text(etiqueta, x, posicionY);
            doc.setFont('helvetica', 'normal'); doc.text(texto(valor), x + doc.getTextWidth(etiqueta) + 1, posicionY);
        }
        function nuevaPaginaSiHaceFalta(espacio) {
            if (y + espacio > alto - 31) { doc.addPage(); y = margen; }
        }

        // Cabecera con la proporción de un comprobante tradicional, pero sin datos,
        // marcas ni códigos de autorización fiscal.
        prepararTexto();
        doc.rect(margen, y, anchoUtil, 44);
        doc.line(ancho / 2, y, ancho / 2, y + 44);
        var identificadorX = (ancho / 2) - 8;
        doc.setFillColor(255, 255, 255); doc.rect(identificadorX, y, 16, 22, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
        doc.text('I', ancho / 2, y + 11, { align: 'center' });
        doc.setFontSize(6.5); doc.text('INTERNO', ancho / 2, y + 16, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(5.8); doc.text('SIN VALIDEZ FISCAL', ancho / 2, y + 20, { align: 'center' });

        var nombreEmpresaX = margen + 4;
        if (logo) {
            try { doc.addImage(logo, 'PNG', nombreEmpresaX, y + 5, 31, 14); nombreEmpresaX += 35; } catch (e) { logo = null; }
        }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
        doc.text(EMPRESA.razon, nombreEmpresaX, y + 13);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
        doc.text('Documento interno de gestión comercial', nombreEmpresaX, y + 19);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(155, 0, 0);
        doc.text('NO VÁLIDO COMO COMPROBANTE FISCAL', margen + 4, y + 35);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
        doc.text('Emitido por el sistema de gestión.', margen + 4, y + 40);

        var encabezadoX = (ancho / 2) + 10;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(titulo.length > 16 ? 12.5 : 15); doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
        doc.text(titulo, encabezadoX, y + 11);
        doc.setFontSize(10); doc.text(texto(factura.Numero), encabezadoX, y + 19);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
        doc.text('Fecha de emisión: ' + fecha(factura.FechaEmision), encabezadoX, y + 27);
        if (factura.FechaVencimiento) doc.text('Fecha de vencimiento: ' + fecha(factura.FechaVencimiento), encabezadoX, y + 33);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); doc.setTextColor(155, 0, 0);
        doc.text('DOCUMENTO DE USO INTERNO', encabezadoX, y + 40);
        y += 47;

        // Datos del receptor, conservando sólo los datos comerciales ya registrados.
        prepararTexto(); doc.rect(margen, y, anchoUtil, 33);
        doc.setFillColor(colorFondo[0], colorFondo[1], colorFondo[2]); doc.rect(margen, y, anchoUtil, 6, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
        doc.text('RECEPTOR / CLIENTE', margen + 3, y + 4);
        var clienteX = margen + 3;
        var clienteDerechaX = (ancho / 2) + 4;
        etiquetaValor('Nombre: ', factura.RazonSocial, clienteX, y + 12);
        etiquetaValor('CUIT: ', factura.CUIT, clienteDerechaX, y + 12);
        var domicilio = doc.splitTextToSize(texto(factura.Domicilio), 78).slice(0, 2);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.text('Domicilio: ', clienteX, y + 18);
        doc.setFont('helvetica', 'normal'); doc.text(domicilio, clienteX + 16, y + 18);
        etiquetaValor('Condición fiscal: ', factura.CondicionFiscal, clienteDerechaX, y + 20);
        etiquetaValor('Condición de venta: ', factura.CondicionComercial, clienteDerechaX, y + 26);
        y += 37;

        var cancelados = factura.ComprobantesCancelados || [];
        var referencia = factura.ComprobanteReferenciaNumero;
        if (cancelados.length || referencia) {
            var lineasRelacion = cancelados.length
                ? cancelados.map(function (item) {
                    return texto(item.Numero) + ' - ' + fecha(item.FechaEmision) + ' - Importe aplicado: ' + dinero(item.ImporteAplicado);
                })
                : ['Comprobante relacionado: ' + texto(referencia)];
            var textoRelacion = doc.splitTextToSize(lineasRelacion.join('\n'), anchoUtil - 6);
            var altoRelacion = Math.max(13, 8 + (textoRelacion.length * 3.5));
            nuevaPaginaSiHaceFalta(altoRelacion + 4);
            prepararTexto(); doc.rect(margen, y, anchoUtil, altoRelacion);
            doc.setFillColor(colorFondo[0], colorFondo[1], colorFondo[2]); doc.rect(margen, y, anchoUtil, 5, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.text('COMPROBANTES RELACIONADOS / IMPUTADOS', margen + 3, y + 3.5);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
            doc.text(textoRelacion, margen + 3, y + 9);
            y += altoRelacion + 4;
        }

        var filas = (factura.Detalle || []).map(function (item) {
            var descripcion = texto(item.Concepto);
            if (item.Descripcion) descripcion += '\n' + item.Descripcion;
            if (item.Unidad) descripcion += '\nUnidad: ' + item.Unidad;
            return [
                texto(item.Codigo), descripcion,
                numero(item.Cantidad).toLocaleString('es-AR', { maximumFractionDigits: 2 }),
                dinero(item.PrecioUnitario), dinero(item.Total)
            ];
        });
        if (!filas.length) filas = [['', texto(factura.Concepto), '1', dinero(factura.Neto), dinero(factura.Total)]];
        doc.autoTable({
            head: [['Código', 'Descripción', 'Cantidad', 'P. unitario', 'Importe']],
            body: filas,
            startY: y,
            margin: { left: margen, right: margen, bottom: 34 },
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 1.6, overflow: 'linebreak', lineColor: [70, 70, 70], lineWidth: 0.15 },
            headStyles: { fillColor: [235, 235, 235], textColor: [15, 15, 15], halign: 'center', fontStyle: 'bold', lineColor: [45, 45, 45] },
            columnStyles: {
                0: { cellWidth: 23 }, 1: { cellWidth: 'auto' }, 2: { halign: 'right', cellWidth: 22 },
                3: { halign: 'right', cellWidth: 31 }, 4: { halign: 'right', cellWidth: 31 }
            }
        });
        y = doc.lastAutoTable.finalY + 5;

        if (factura.Observaciones) {
            var observaciones = doc.splitTextToSize(factura.Observaciones, anchoUtil - 6);
            var altoObservaciones = 8 + (observaciones.length * 3.5);
            nuevaPaginaSiHaceFalta(altoObservaciones + 5);
            prepararTexto(); doc.rect(margen, y, anchoUtil, altoObservaciones);
            doc.setFillColor(colorFondo[0], colorFondo[1], colorFondo[2]); doc.rect(margen, y, anchoUtil, 5, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.text('OBSERVACIONES', margen + 3, y + 3.5);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
            doc.text(observaciones, margen + 3, y + 9);
            y += altoObservaciones + 5;
        }

        var totales = [
            ['Subtotal', factura.Subtotal],
            ['Descuento', factura.Descuentos],
            ['Neto', factura.Neto],
            ['IVA', factura.IVA],
            ['Otros impuestos', factura.OtrosImpuestos]
        ];
        var altoTotales = 14 + (totales.length * 5);
        nuevaPaginaSiHaceFalta(altoTotales + 3);
        y = Math.max(y, alto - 76);
        var anchoTotales = 76;
        var xTotales = ancho - margen - anchoTotales;
        prepararTexto(); doc.rect(xTotales, y, anchoTotales, altoTotales);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
        var yTotal = y + 6;
        totales.forEach(function (fila) {
            doc.text(fila[0] + ':', xTotales + 4, yTotal);
            doc.text(dinero(fila[1]), xTotales + anchoTotales - 4, yTotal, { align: 'right' });
            yTotal += 5;
        });
        doc.setDrawColor(45, 45, 45); doc.line(xTotales + 3, yTotal - 2, xTotales + anchoTotales - 3, yTotal - 2);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('TOTAL:', xTotales + 4, yTotal + 4);
        doc.text(dinero(factura.Total), xTotales + anchoTotales - 4, yTotal + 4, { align: 'right' });

        var altoEstado = 25;
        prepararTexto(); doc.rect(margen, y, xTotales - margen - 4, altoEstado);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.text('ESTADO DEL COMPROBANTE', margen + 3, y + 6);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text('Documental: ' + texto(factura.EstadoDocumental), margen + 3, y + 12);
        doc.text('Financiero: ' + texto(factura.EstadoFinanciero), margen + 3, y + 17);
        doc.text('Aplicado: ' + dinero(factura.ImporteAplicado), margen + 3, y + 22);
        doc.text('Saldo pendiente: ' + dinero(factura.SaldoPendiente), xTotales - 7, y + 22, { align: 'right' });

        var usuario = '—';
        try { usuario = localStorage.getItem('username') || localStorage.getItem('usuario') || '—'; } catch (e) { }
        var ahora = new Date();
        var generado = ahora.toLocaleDateString('es-AR') + ' ' + ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        var paginas = doc.getNumberOfPages();
        for (var pagina = 1; pagina <= paginas; pagina++) {
            doc.setPage(pagina);
            var pieY = alto - 24;
            doc.setDrawColor(25, 25, 25); doc.setLineWidth(0.35); doc.rect(margen, pieY, anchoUtil, 15);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(150, 0, 0);
            doc.text('DOCUMENTO INTERNO - SIN VALIDEZ FISCAL', ancho / 2, pieY + 5, { align: 'center' });
            doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
            doc.text('No habilita crédito fiscal ni constituye un comprobante fiscal.', ancho / 2, pieY + 9, { align: 'center' });
            doc.text('Generado: ' + generado + ' - Usuario: ' + usuario, margen + 3, pieY + 13);
            doc.text('Página ' + pagina + ' de ' + paginas, ancho - margen - 3, pieY + 13, { align: 'right' });
        }
        return doc;
    }

    function generarDocumento(id) {
        return Promise.all([obtenerComprobante(id), obtenerLogo()]).then(function (resultado) {
            var factura = resultado[0];
            if (!tituloComprobante(factura.Tipo)) throw new Error('El comprobante seleccionado no se puede imprimir.');
            return {
                documento: construir(factura, resultado[1]),
                comprobante: factura,
                nombreArchivo: nombreArchivoComprobante(factura.Tipo) + '_' + texto(factura.Numero).replace(/[^a-z0-9_-]/gi, '_') + '.pdf'
            };
        });
    }

    function bufferABase64(buffer) {
        var bytes = new Uint8Array(buffer);
        var partes = [];
        // El tamaño es múltiplo de tres para no insertar padding entre partes.
        var tamanioParte = 32766;
        for (var inicio = 0; inicio < bytes.length; inicio += tamanioParte) {
            var fin = Math.min(inicio + tamanioParte, bytes.length);
            var textoBinario = '';
            for (var indice = inicio; indice < fin; indice++) textoBinario += String.fromCharCode(bytes[indice]);
            partes.push(window.btoa(textoBinario));
        }
        return partes.join('');
    }

    function generar(id, modo) {
        generarDocumento(id).then(function (resultado) {
            var doc = resultado.documento;
            if (modo === 'imprimir') {
                doc.autoPrint();
                window.open(doc.output('bloburl'), '_blank');
            } else {
                doc.save(resultado.nombreArchivo);
            }
        }).catch(function (error) {
            var texto = error && error.message ? error.message : 'No se pudo generar el PDF del comprobante. Probá de nuevo.';
            if (window.SGTL && window.SGTL.toastError) window.SGTL.toastError(texto);
            else window.alert(texto);
        });
    }

    window.descargarComprobantePDF = function (id) { generar(id, 'descargar'); };
    window.imprimirComprobantePDF = function (id) { generar(id, 'imprimir'); };
    window.generarComprobantePDFParaEmail = function (id) {
        return generarDocumento(id).then(function (resultado) {
            return {
                PdfBase64: bufferABase64(resultado.documento.output('arraybuffer')),
                NombreArchivo: resultado.nombreArchivo
            };
        });
    };
    // Se mantienen los nombres previos para los puntos de entrada de Facturas.
    window.descargarFacturaPDF = window.descargarComprobantePDF;
    window.imprimirFacturaPDF = window.imprimirComprobantePDF;
})(window);
