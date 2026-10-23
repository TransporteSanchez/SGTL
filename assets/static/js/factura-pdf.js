(function (window) {
    'use strict';

    var API = 'http://localhost:50222/api';

    function texto(valor) { return valor == null || valor === '' ? '—' : String(valor); }
    function numero(valor) { return Number(valor || 0); }
    // "Responsable Inscripto" → "Responsable inscripto": mayúscula solo al principio (§9), como en la proforma.
    function mayusculaInicial(valor) {
        var limpio = String(valor == null ? '' : valor).trim();
        return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase() : valor;
    }
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
    // Los datos de la empresa que valían al emitir el comprobante, con su logo (Gestionar empresa, empresa-datos.js). El
    // logo del sistema (Apariencia) no sale en los documentos.
    function datosEmpresa(fechaEmision) {
        if (!window.SGTLEmpresa) return Promise.reject(new Error('No se pudieron leer los datos de la empresa para el PDF. Probá de nuevo.'));
        return window.SGTLEmpresa.obtener(fechaEmision);
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

    function proformasFactura(factura) {
        var proformas = Array.isArray(factura.Proformas) ? factura.Proformas.map(function (proforma) {
            return texto(proforma && (proforma.Numero || proforma.ProformaNumero || proforma));
        }) : [];
        if (!proformas.length && factura.ProformaNumero) proformas.push(texto(factura.ProformaNumero));
        return proformas.filter(function (numero, indice) {
            return numero !== '—' && proformas.indexOf(numero) === indice;
        });
    }

    function contenidoImpresionComprobante(factura) {
        if (factura.Tipo === 'FAC') return { tipo: 'proformas', lineas: proformasFactura(factura) };
        return { tipo: 'detalle' };
    }

    function construir(factura, empresa) {
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
            // El ancho se mide en negrita, como se dibujó: medido en normal, el valor se pegaba a la etiqueta.
            var anchoEtiqueta = doc.getTextWidth(etiqueta);
            doc.setFont('helvetica', 'normal'); doc.text(texto(valor), x + anchoEtiqueta + 1, posicionY);
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
        // En dos renglones: en uno solo no entraba en el recuadro de 16 mm.
        doc.setFont('helvetica', 'normal'); doc.setFontSize(5.2);
        doc.text('SIN VALIDEZ', ancho / 2, y + 18.6, { align: 'center' }); doc.text('FISCAL', ancho / 2, y + 20.8, { align: 'center' });

        var nombreEmpresaX = margen + 4;
        if (empresa.logo) {
            // Dentro de 31 x 14 mm, sin deformarlo; el nombre va a su derecha.
            var medida = window.SGTLEmpresa.medidaLogo(empresa.logo, 31, 14);
            try {
                doc.addImage(empresa.logo.datos, 'PNG', nombreEmpresaX, y + 5 + (14 - medida.alto) / 2, medida.ancho, medida.alto);
                nombreEmpresaX += medida.ancho + 4;
            } catch (e) { }
        }
        // Datos de la empresa (Gestionar empresa): el nombre al lado del logo y, debajo, CUIT, domicilio y contacto. Todo
        // queda a la izquierda del recuadro de la letra; lo que no entra en un renglón se corta.
        var limiteEmpresa = (ancho / 2) - 10;
        function renglon(valor, anchoMaximo) { return doc.splitTextToSize(String(valor), anchoMaximo)[0] || ''; }
        var datosAbajo = empresa.lineas.slice();
        var tamanioNombre = 13;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(tamanioNombre);
        while (tamanioNombre > 9 && doc.getTextWidth(empresa.nombre) > limiteEmpresa - nombreEmpresaX) {
            tamanioNombre -= 0.5; doc.setFontSize(tamanioNombre);
        }
        doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
        doc.text(renglon(empresa.nombre, limiteEmpresa - nombreEmpresaX), nombreEmpresaX, y + 12);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
        // Con nombre comercial, la razón social va debajo del nombre.
        if (empresa.nombreComercial && datosAbajo[0] === empresa.razonSocial) {
            doc.text(renglon(datosAbajo.shift(), limiteEmpresa - nombreEmpresaX), nombreEmpresaX, y + 17);
        }
        datosAbajo.slice(0, 3).forEach(function (linea, indice) {
            doc.text(renglon(linea, limiteEmpresa - (margen + 4)), margen + 4, y + 23.5 + (indice * 3.6));
        });
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
        etiquetaValor('Condición fiscal: ', mayusculaInicial(factura.CondicionFiscal), clienteDerechaX, y + 20);
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

        var contenido = contenidoImpresionComprobante(factura);
        if (contenido.tipo === 'proformas') {
            var lineasProformas = contenido.lineas.length ? contenido.lineas : ['Sin Proformas asociadas.'];
            var textoProformas = doc.splitTextToSize(lineasProformas.join('\n'), anchoUtil - 6);
            var altoProformas = Math.max(13, 8 + (textoProformas.length * 3.5));
            nuevaPaginaSiHaceFalta(altoProformas + 4);
            prepararTexto(); doc.rect(margen, y, anchoUtil, altoProformas);
            doc.setFillColor(colorFondo[0], colorFondo[1], colorFondo[2]); doc.rect(margen, y, anchoUtil, 5, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.text('PROFORMAS INCLUIDAS', margen + 3, y + 3.5);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
            doc.text(textoProformas, margen + 3, y + 9);
            y += altoProformas + 5;
        } else {
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
        }

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
        // DD/MM/AAAA HH:MM, en 24 h y sin "p. m." (§7.2), como en la proforma.
        var dosCifras = function (n) { return ('0' + n).slice(-2); };
        var generado = dosCifras(ahora.getDate()) + '/' + dosCifras(ahora.getMonth() + 1) + '/' + ahora.getFullYear() + ' ' +
            dosCifras(ahora.getHours()) + ':' + dosCifras(ahora.getMinutes());
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
        return obtenerComprobante(id).then(function (factura) {
            if (!tituloComprobante(factura.Tipo)) throw new Error('El comprobante seleccionado no se puede imprimir.');
            return datosEmpresa(factura.FechaEmision).then(function (empresa) {
                return {
                    documento: construir(factura, empresa),
                    comprobante: factura,
                    nombreArchivo: nombreArchivoComprobante(factura.Tipo) + '_' + texto(factura.Numero).replace(/[^a-z0-9_-]/gi, '_') + '.pdf'
                };
            });
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

    function descargar(id) {
        generarDocumento(id).then(function (resultado) {
            resultado.documento.save(resultado.nombreArchivo);
        }).catch(function (error) {
            var texto = error && error.message ? error.message : 'No se pudo generar el PDF del comprobante. Probá de nuevo.';
            if (window.SGTL && window.SGTL.toastError) window.SGTL.toastError(texto);
            else window.alert(texto);
        });
    }

    window.prepararComprobantePDF = function (id) {
        return generarDocumento(id).then(function (resultado) {
            return { blob: resultado.documento.output('blob'), nombreArchivo: resultado.nombreArchivo };
        });
    };
    window.descargarComprobantePDF = function (id) { descargar(id); };
    window.imprimirComprobantePDF = function (id) {
        if (typeof window.abrirVistaPreviaComprobante === 'function') return window.abrirVistaPreviaComprobante(id);
        return Promise.reject(new Error('No se pudo abrir la vista previa del comprobante.'));
    };
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
