(function () {
    var API = 'http://localhost:50222/api';


    var EMPRESA = {
        razon: 'Transporte Sánchez',
        cuit: '',
        direccion: '',
        ciudad: '',
        provincia: '',
        telefono: '',
        email: '',
        web: ''
    };

    function money(n) { n = Number(n) || 0; return '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function fdate(iso) { if (!iso) return ''; var d = new Date(iso); if (isNaN(d)) return ''; return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }
    function txt(v) { return (v == null || v === '') ? '—' : String(v); }

    function getJsPDF() { return (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF || null); }

    // Trae el logo (si es un data URI raster utilizable) desde Gestión de contenido.
    function obtenerLogo() {
        return fetch(API + '/GestionContenido/1')
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) {
                var logo = d && d.Logo;
                if (typeof logo === 'string' && /^data:image\/(png|jpe?g)/i.test(logo)) return logo;
                return null; // SVG / ruta: no lo embebemos, usamos texto
            })
            .catch(function () { return null; });
    }

    function construir(p, logoDataUri) {
        var JsPDF = getJsPDF();
        if (!JsPDF) { alert('No se pudo cargar el generador de PDF.'); return null; }
        var doc = new JsPDF({ unit: 'mm', format: 'a4' });
        var W = doc.internal.pageSize.getWidth();
        var H = doc.internal.pageSize.getHeight();
        var M = 20;
        var y = M;

        // ---------- Encabezado ----------
        if (logoDataUri) {
            try { doc.addImage(logoDataUri, 'PNG', M, y, 45, 18); } catch (e) { }
        } else {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(20);
            doc.text(EMPRESA.razon || 'Transporte Sánchez', M, y + 8);
        }
        // Recuadro derecho: PROFORMA
        var bx = W - M - 60, by = y, bw = 60, bh = 26;
        doc.setDrawColor(180); doc.setLineWidth(0.3); doc.roundedRect(bx, by, bw, bh, 2, 2);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(20);
        doc.text('PROFORMA', bx + bw / 2, by + 8, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        var esPlataforma = p.Tipo_Proforma === 'Plataforma';
        // Un borrador de plataforma todavía no tiene N° PF: se identifica por el N° en la plataforma.
        doc.text('N°: ' + (p.Numero || (esPlataforma ? 'Borrador' : '—')), bx + 3, by + 15);
        doc.text('Fecha: ' + txt(fdate(p.FechaEmision)), bx + 3, by + 20);
        doc.text('Estado: ' + txt(p.Estado), bx + 3, by + 25);

        y += 30;
        // Datos de la empresa
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80);
        var emp = [EMPRESA.razon, EMPRESA.cuit ? ('CUIT: ' + EMPRESA.cuit) : '', EMPRESA.direccion, [EMPRESA.ciudad, EMPRESA.provincia].filter(Boolean).join(', '),
            [EMPRESA.telefono ? ('Tel: ' + EMPRESA.telefono) : '', EMPRESA.email, EMPRESA.web].filter(Boolean).join('  ·  ')].filter(Boolean);
        emp.forEach(function (linea) { doc.text(linea, M, y); y += 4; });
        y += 2;

        // ---------- Recuadro Cliente ----------
        doc.setDrawColor(200); doc.setFillColor(247, 248, 250);
        var chY = y, chH = 30;
        doc.roundedRect(M, chY, W - 2 * M, chH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(40);
        doc.text('CLIENTE', M + 3, chY + 5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60);
        var colA = M + 3, colB = W / 2 + 5, ry = chY + 11;
        doc.text('Razón social: ' + txt(p.Cli_RazonSocial), colA, ry);
        doc.text('CUIT: ' + txt(p.Cli_CUIT), colB, ry);
        doc.text('Cond. IVA: ' + txt(p.Cli_CondIVA), colA, ry + 5);
        doc.text('Dirección: ' + txt(p.Cli_Direccion), colB, ry + 5);
        doc.text('Ciudad: ' + txt(p.Cli_Ciudad), colA, ry + 10);
        doc.text('Tel: ' + txt(p.Cli_Telefono), colB, ry + 10);
        doc.text('Email: ' + txt(p.Cli_Email), colA, ry + 15);
        doc.text('Contacto: ' + txt(p.Cli_Contacto), colB, ry + 15);
        y = chY + chH + 5;

        if (esPlataforma) {
            // ---------- Proforma de plataforma (Rukas): tipo, N° en la plataforma, período y factura ----------
            var plataforma = p.Plataforma || 'la plataforma';
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(40);
            doc.text('PROFORMA DE ' + plataforma.toUpperCase(), M, y); y += 5;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60);
            doc.text('N° de proforma en ' + plataforma + ': ' + txt(p.Plataforma_Numero), colA, y);
            doc.text('Período: ' + txt(fdate(p.FechaDesde)) + ' al ' + txt(fdate(p.FechaHasta)), colB, y); y += 5;
            if (p.Plataforma_Factura_Numero) {
                doc.text('Factura en ' + plataforma + ': ' + p.Plataforma_Factura_Numero +
                    (p.Plataforma_Factura_Fecha ? ' del ' + fdate(p.Plataforma_Factura_Fecha) : ''), colA, y); y += 5;
            }
            y += 1;
        } else {
            // ---------- Datos del servicio ----------
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(40);
            doc.text('DATOS DEL SERVICIO', M, y); y += 5;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60);
            doc.text('Origen: ' + txt(p.Origen), colA, y); doc.text('Destino: ' + txt(p.Destino), colB, y); y += 5;
            doc.text('Tipo de carga: ' + txt(p.TipoCarga), colA, y); doc.text('Peso / Volumen: ' + [p.Peso, p.Volumen].filter(Boolean).join(' / '), colB, y); y += 5;
            doc.text('Fecha de carga: ' + txt(fdate(p.FechaCarga)), colA, y); doc.text('Entrega estimada: ' + txt(fdate(p.FechaEntrega)), colB, y); y += 6;
        }

        // ---------- Tabla de conceptos (paginada) ----------
        var filas = (p.Detalle || []).map(function (l) {
            return [ (l.Cantidad != null ? l.Cantidad : ''), txt(l.Codigo), txt(l.Concepto) + (l.Descripcion ? ('\n' + l.Descripcion) : ''),
                money(l.PrecioUnitario), (Number(l.DescuentoPct) || 0) + '%', (Number(l.IvaPct) || 0) + '%', money(l.Subtotal) ];
        });
        doc.autoTable({
            head: [['Cant.', 'Código', 'Descripción', 'P. Unit.', 'Desc.', 'IVA', 'Subtotal']],
            body: filas.length ? filas : [['', '', 'Sin conceptos', '', '', '', '']],
            startY: y,
            margin: { left: M, right: M, bottom: 28 },
            styles: { fontSize: 8, cellPadding: 1.6, overflow: 'linebreak' },
            headStyles: { fillColor: [33, 37, 41], textColor: 255, halign: 'center' },
            columnStyles: {
                0: { halign: 'right', cellWidth: 14 }, 1: { cellWidth: 20 }, 2: { cellWidth: 'auto' },
                3: { halign: 'right', cellWidth: 24 }, 4: { halign: 'right', cellWidth: 16 },
                5: { halign: 'right', cellWidth: 14 }, 6: { halign: 'right', cellWidth: 26 }
            }
        });

        // ---------- Totales / condiciones / observaciones ----------
        y = doc.lastAutoTable.finalY + 6;
        function saltoSiHaceFalta(alto) { if (y + alto > H - 28) { doc.addPage(); y = M; } }

        // Totales (derecha)
        saltoSiHaceFalta(46);
        var tx = W - M - 70, tw = 70;
        function fila(l, v, bold) {
            doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(bold ? 11 : 9); doc.setTextColor(bold ? 20 : 60);
            doc.text(l, tx, y); doc.text(v, tx + tw, y, { align: 'right' }); y += bold ? 7 : 5;
        }
        fila('Subtotal', money(p.Subtotal));
        fila('Descuentos', money(p.Descuentos));
        fila('Subtotal neto', money(p.SubtotalNeto));
        fila('IVA', money(p.IVA));
        fila('Otros impuestos', money(p.OtrosImpuestos));
        doc.setDrawColor(180); doc.line(tx, y - 2, tx + tw, y - 2); y += 2;
        fila('TOTAL GENERAL', money(p.TotalGeneral), true);
        y += 4;

        // Condiciones comerciales
        var cond = [];
        if (p.FormaPago) cond.push('Forma de pago: ' + p.FormaPago);
        if (p.PlazoPago) cond.push('Plazo de pago: ' + p.PlazoPago);
        if (p.Validez) cond.push('Validez: ' + p.Validez);
        if (p.TiempoServicio) cond.push('Tiempo estimado: ' + p.TiempoServicio);
        if (p.CondParticulares) cond.push('Condiciones particulares: ' + p.CondParticulares);
        if (cond.length) {
            saltoSiHaceFalta(8 + cond.length * 4);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(40);
            doc.text('CONDICIONES COMERCIALES', M, y); y += 5;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60);
            cond.forEach(function (c) { var ls = doc.splitTextToSize(c, W - 2 * M); saltoSiHaceFalta(ls.length * 4); doc.text(ls, M, y); y += ls.length * 4 + 1; });
            y += 2;
        }
        // Observaciones
        if (p.Observaciones) {
            var obs = doc.splitTextToSize(p.Observaciones, W - 2 * M);
            saltoSiHaceFalta(8 + obs.length * 4);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(40);
            doc.text('OBSERVACIONES', M, y); y += 5;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60);
            doc.text(obs, M, y); y += obs.length * 4;
        }

        // ---------- Pie en todas las páginas ----------
        var usuario = null; try { usuario = localStorage.getItem('username'); } catch (e) { }
        var ahora = new Date();
        var emitido = ('0' + ahora.getDate()).slice(-2) + '/' + ('0' + (ahora.getMonth() + 1)).slice(-2) + '/' + ahora.getFullYear() +
            ' ' + ('0' + ahora.getHours()).slice(-2) + ':' + ('0' + ahora.getMinutes()).slice(-2);
        var total = doc.getNumberOfPages();
        for (var i = 1; i <= total; i++) {
            doc.setPage(i);
            var fy = H - 20;
            doc.setDrawColor(200); doc.line(M, fy, W - M, fy);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(150, 0, 0);
            doc.text('DOCUMENTO SIN VALIDEZ FISCAL', W / 2, fy + 5, { align: 'center' });
            doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(110);
            doc.text('Esta proforma constituye únicamente un documento comercial y no reemplaza una factura emitida conforme a la normativa vigente de ARCA.',
                W / 2, fy + 9, { align: 'center', maxWidth: W - 2 * M });
            doc.text('Emitido: ' + emitido + '   ·   Usuario: ' + txt(usuario), M, fy + 15);
            doc.text('Página ' + i + ' de ' + total, W - M, fy + 15, { align: 'right' });
        }
        return doc;
    }

    // Un borrador de plataforma todavía no tiene conceptos (se arman al generar): el PDF muestra las líneas
    // del Excel importado, con el mismo formato que tendrán los conceptos.
    function conLineasDePlataforma(p) {
        if (p.Tipo_Proforma !== 'Plataforma' || (p.Detalle && p.Detalle.length)) return Promise.resolve(p);
        return fetch(API + '/ProformasPlataforma/' + p.Proforma_ID)
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (c) {
                if (!c || !c.Lineas) return p;
                p.Detalle = c.Lineas.slice().sort(function (a, b) { return a.Orden - b.Orden; }).map(function (l) {
                    var precio = (Number(l.ImporteViaje) || 0) + (Number(l.Adicionales) || 0);
                    return {
                        Cantidad: 1, Codigo: l.ViajeID ? 'V' + l.ViajeID : '',
                        Concepto: 'Transporte ' + l.Referencia + (l.Ruta ? ' · ' + l.Ruta : ''),
                        Descripcion: (l.Fecha ? fdate(l.Fecha) + ' - ' : '') + (c.Plataforma || '') + ' ' + (c.NumeroPlataforma || '') +
                            (Number(l.Adicionales) ? ' (incluye adicionales ' + money(l.Adicionales) + ')' : ''),
                        PrecioUnitario: precio, DescuentoPct: 0, IvaPct: 21, Subtotal: precio
                    };
                });
                return p;
            })
            .catch(function () { return p; });
    }

    function generar(id, modo) {
        var logo = null;
        Promise.all([
            fetch(API + '/Proformas/' + id).then(function (r) { return r.ok ? r.json() : null; }),
            obtenerLogo()
        ]).then(function (res) {
            var p = res[0];
            logo = res[1];
            if (!p) { alert('No se pudo obtener la proforma.'); return; }
            return conLineasDePlataforma(p);
        }).then(function (p) {
            if (!p) return;
            var doc = construir(p, logo);
            if (!doc) return;
            var nombre = 'Proforma_' + (p.Numero || (p.Tipo_Proforma === 'Plataforma'
                ? (p.Plataforma || 'Plataforma') + '_' + (p.Plataforma_Numero || p.Proforma_ID)
                : 'ID' + p.Proforma_ID)) + '.pdf';
            if (modo === 'imprimir') {
                doc.autoPrint();
                window.open(doc.output('bloburl'), '_blank');
            } else {
                doc.save(nombre);
            }
        }).catch(function () { alert('Error al generar el PDF.'); });
    }

    window.descargarProformaPDF = function (id) { generar(id, 'descargar'); };
    window.imprimirProformaPDF = function (id) { generar(id, 'imprimir'); };
})();