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

    // Error con el aviso del sistema (§5.1); si la pantalla no carga sgtl-ui.js, el del navegador.
    function avisarError(texto) {
        if (window.SGTL && window.SGTL.toastError) window.SGTL.toastError(texto);
        else window.alert(texto);
    }

    function construir(p, logoDataUri) {
        var JsPDF = getJsPDF();
        if (!JsPDF) { avisarError('No se pudo cargar el generador de PDF. Recargá la pantalla.'); return null; }
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
        // Los datos salen de la ficha del cliente (§25 de PENDIENTES, 22/10). "Contacto" no tiene de dónde salir: no va.
        var ciudad = [p.Cli_Ciudad, p.Cli_Provincia && String(p.Cli_Provincia).toLowerCase() !== String(p.Cli_Ciudad || '').toLowerCase() ? p.Cli_Provincia : '']
            .filter(Boolean).join(', ') + (p.Cli_CP ? ' (CP ' + p.Cli_CP + ')' : '');
        doc.text('Ciudad: ' + txt(ciudad), colA, ry + 10);
        doc.text('Tel: ' + txt(p.Cli_Telefono), colB, ry + 10);
        doc.text('Email: ' + txt(p.Cli_Email), colA, ry + 15);
        y = chY + chH + 5;

        if (esPlataforma) {
            // ---------- Proforma de plataforma (Rukas): tipo, N° en la plataforma y período ----------
            var plataforma = p.Plataforma || 'la plataforma';
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(40);
            doc.text('PROFORMA DE ' + plataforma.toUpperCase(), M, y); y += 5;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60);
            doc.text('N° de proforma en ' + plataforma + ': ' + txt(p.Plataforma_Numero), colA, y);
            doc.text('Período: ' + txt(fdate(p.FechaDesde)) + ' al ' + txt(fdate(p.FechaHasta)), colB, y); y += 5;
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
        if (cond.length) {
            saltoSiHaceFalta(8 + cond.length * 4);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(40);
            doc.text('CONDICIONES COMERCIALES', M, y); y += 5;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60);
            cond.forEach(function (c) { var ls = doc.splitTextToSize(c, W - 2 * M); saltoSiHaceFalta(ls.length * 4); doc.text(ls, M, y); y += ls.length * 4 + 1; });
            y += 2;
        }
        // Observaciones
        var observaciones = p.Observaciones || [p.ObsComerciales, p.CondParticulares].filter(Boolean).join('\n');
        if (observaciones) {
            var obs = doc.splitTextToSize(observaciones, W - 2 * M);
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

    // Arma el PDF de la proforma: devuelve { doc, nombre } o rechaza con un mensaje para el usuario.
    function preparar(id) {
        var logo = null;
        return Promise.all([
            fetch(API + '/Proformas/' + id).then(function (r) { return r.ok ? r.json() : null; }),
            obtenerLogo()
        ]).then(function (res) {
            var p = res[0];
            logo = res[1];
            if (!p) throw new Error('No se pudo obtener la proforma. Probá de nuevo.');
            return conLineasDePlataforma(p);
        }).then(function (p) {
            var doc = construir(p, logo);
            if (!doc) throw new Error('No se pudo generar el PDF. Probá de nuevo.');
            var idProforma = p.Proforma_ID || id;
            var numero = p.Numero || (p.Tipo_Proforma === 'Plataforma'
                ? (p.Plataforma || 'Plataforma') + '_' + (p.Plataforma_Numero || idProforma)
                : 'ID' + idProforma);
            return { doc: doc, nombre: 'Proforma_' + numero + '.pdf', numero: p.Numero || (p.Plataforma_Numero ? (p.Plataforma || '') + ' ' + p.Plataforma_Numero : '#' + idProforma) };
        });
    }

    function generar(id, modo) {
        preparar(id).then(function (r) {
            if (modo === 'imprimir') {
                r.doc.autoPrint();
                window.open(r.doc.output('bloburl'), '_blank');
            } else {
                r.doc.save(r.nombre);
            }
        }).catch(function (e) { avisarError(e && e.message ? e.message : 'No se pudo generar el PDF. Probá de nuevo.'); });
    }

    // ---------------------------------------------------------------- Ver PDF (§1.4)
    // Vista previa dentro del sistema, igual que en presupuestos y cuenta corriente: Cerrar · Imprimir · Descargar PDF.
    // Proformas no tiene envío por e-mail (queda para ver con Facu). Se puede abrir encima del formulario de la proforma.
    var vista = null, urlVista = null, secuenciaVista = 0, origenVista = null;

    function porId(id) { return document.getElementById(id); }

    function crearVista() {
        var contenedor = document.createElement('div');
        contenedor.innerHTML =
            '<div class="modal fade" id="modalVistaProforma" tabindex="-1" aria-labelledby="tituloVistaProforma" aria-hidden="true">' +
            '<div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">' +
            '<div class="modal-header"><h5 class="modal-title" id="tituloVistaProforma">Ver PDF de la proforma</h5>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
            '<div class="modal-body"><div id="vistaProformaFeedback" class="text-center text-muted py-4" role="status">Preparando el PDF…</div>' +
            '<iframe id="vistaProformaDocumento" title="Vista previa de la proforma en PDF" style="display:none; width:100%; height:65vh; border:1px solid #dee2e6;"></iframe></div>' +
            '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cerrar</button>' +
            '<button type="button" class="btn btn-outline-secondary" id="imprimirVistaProforma" disabled><i class="bi bi-printer me-1" aria-hidden="true"></i>Imprimir</button>' +
            '<a id="descargarVistaProforma" class="btn btn-primary disabled" aria-disabled="true"><i class="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>Descargar PDF</a></div>' +
            '</div></div></div>';
        var modal = contenedor.firstChild;
        document.body.appendChild(modal);
        porId('imprimirVistaProforma').addEventListener('click', function () {
            try { var w = porId('vistaProformaDocumento').contentWindow; w.focus(); w.print(); }
            catch (e) { mostrarErrorVista('No se pudo imprimir desde acá. Usá el botón de impresión del visor del PDF.'); }
        });
        // Encima de otra ventana (el formulario de la proforma): queda arriba con su fondo oscuro.
        modal.addEventListener('show.bs.modal', function () {
            if (document.querySelector('.modal.show')) modal.style.zIndex = 1065;
        });
        modal.addEventListener('shown.bs.modal', function () {
            if (modal.style.zIndex) {
                var fondos = document.querySelectorAll('.modal-backdrop');
                if (fondos.length) fondos[fondos.length - 1].style.zIndex = 1060;
            }
        });
        modal.addEventListener('hidden.bs.modal', function () {
            secuenciaVista++;
            modal.style.zIndex = '';
            var marco = porId('vistaProformaDocumento');
            marco.onload = null; marco.removeAttribute('src');
            if (urlVista) { URL.revokeObjectURL(urlVista); urlVista = null; }
            // Si quedó abierta otra ventana debajo, Bootstrap le sacó al body la clase que la deja desplazarse.
            var abierta = document.querySelector('.modal.show');
            if (abierta) document.body.classList.add('modal-open');
            // Bootstrap no devuelve el foco cuando la ventana se abre por código: vuelve a lo que la abrió (el "Ver PDF"
            // del formulario o el botón de la fila) o, si ya no está, a la ventana de abajo.
            var destino = origenVista && origenVista.isConnected && origenVista !== document.body ? origenVista : abierta;
            origenVista = null;
            if (destino) destino.focus();
        });
        return bootstrap.Modal.getOrCreateInstance(modal);
    }

    function mostrarErrorVista(texto) {
        var aviso = porId('vistaProformaFeedback');
        aviso.className = 'alert alert-light-danger color-danger';
        aviso.textContent = texto;
    }

    function verPDF(id) {
        if (!vista) vista = crearVista();
        var version = ++secuenciaVista;
        var marco = porId('vistaProformaDocumento'), descarga = porId('descargarVistaProforma'), imprimir = porId('imprimirVistaProforma');
        if (urlVista) { URL.revokeObjectURL(urlVista); urlVista = null; }
        marco.onload = null; marco.removeAttribute('src'); marco.style.display = 'none';
        descarga.removeAttribute('href'); descarga.removeAttribute('download');
        descarga.classList.add('disabled'); descarga.setAttribute('aria-disabled', 'true');
        imprimir.disabled = true;
        porId('tituloVistaProforma').textContent = 'Ver PDF de la proforma';
        var aviso = porId('vistaProformaFeedback');
        aviso.className = 'text-center text-muted py-4'; aviso.textContent = 'Preparando el PDF…';
        if (!porId('modalVistaProforma').contains(document.activeElement)) origenVista = document.activeElement;
        vista.show();
        preparar(id).then(function (r) {
            if (version !== secuenciaVista) return;
            porId('tituloVistaProforma').textContent = 'Ver PDF de la proforma ' + r.numero;
            urlVista = URL.createObjectURL(r.doc.output('blob'));
            descarga.href = urlVista; descarga.download = r.nombre;
            descarga.classList.remove('disabled'); descarga.setAttribute('aria-disabled', 'false');
            marco.onload = function () {
                if (version !== secuenciaVista) return;
                aviso.className = 'd-none'; aviso.textContent = '';
                imprimir.disabled = false;
            };
            marco.src = urlVista; marco.style.display = 'block';
        }).catch(function (e) {
            if (version === secuenciaVista) mostrarErrorVista(e && e.message ? e.message : 'No se pudo generar el PDF de la proforma. Probá de nuevo.');
        });
    }

    window.verProformaPDF = verPDF;
    window.descargarProformaPDF = function (id) { generar(id, 'descargar'); };
    window.imprimirProformaPDF = function (id) { generar(id, 'imprimir'); };
})();
