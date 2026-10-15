(function (global) {
    'use strict';

    var CABECERA_VIAJES = ['Viaje', 'Concepto', 'Detalle', 'Cantidad', 'P. unitario', 'Importe'];

    function fechaIsoLocal(fecha) {
        var local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
        return local.toISOString().substring(0, 10);
    }

    function importe(valor) {
        return '$ ' + (Number(valor) || 0).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function datosReporte(configuracion) {
        return {
            proformas: configuracion.items || [],
            filtros: configuracion.filtros || 'Sin filtros',
            titulo: configuracion.titulo || 'Listado de proformas',
            archivo: configuracion.archivo || 'listado-proformas',
            formatearFecha: configuracion.formatearFecha || function (valor) { return valor || ''; }
        };
    }

    function cantidadConUnidad(viaje) {
        var cantidad = Number(viaje.Cantidad) || 0;
        return cantidad.toLocaleString('es-AR', { maximumFractionDigits: 2 }) + (viaje.Unidad ? ' ' + viaje.Unidad : '');
    }

    function filaViaje(viaje) {
        return [
            viaje.Codigo || '',
            viaje.Concepto || '',
            viaje.Descripcion || '',
            cantidadConUnidad(viaje),
            Number(viaje.PrecioUnitario) || 0,
            Number(viaje.Subtotal) || 0
        ];
    }

    function filasExcel(datos) {
        var filas = [
            [datos.titulo],
            ['Generado', new Date().toLocaleString('es-AR')],
            ['Filtros', datos.filtros],
            ['Proformas', datos.proformas.length],
            []
        ];
        var filasImporte = [];
        var filasTotales = [];

        datos.proformas.forEach(function (proforma) {
            filas.push(['Proforma', proforma.Numero || ('#' + proforma.Proforma_ID)]);
            filas.push(['Cliente', proforma.Cliente || '', 'CUIT', proforma.Cuit || '']);
            filas.push(['Fecha de Inicio', datos.formatearFecha(proforma.FechaInicio), 'Fecha Fin', datos.formatearFecha(proforma.FechaFin)]);
            filas.push(['Estado', proforma.Estado || '', 'Total', Number(proforma.Total) || 0, 'Usuario', proforma.Usuario || '']);
            filasTotales.push(filas.length - 1);
            filas.push(['Detalle de viajes']);
            filas.push(CABECERA_VIAJES);

            var viajes = proforma.Viajes || [];
            if (!viajes.length) {
                filas.push(['No hay viajes asociados a esta proforma.']);
            } else {
                viajes.forEach(function (viaje) {
                    filas.push(filaViaje(viaje));
                    filasImporte.push(filas.length - 1);
                });
            }
            filas.push([]);
        });

        if (!datos.proformas.length) filas.push(['No hay proformas para los filtros seleccionados.']);
        return { filas: filas, filasImporte: filasImporte, filasTotales: filasTotales };
    }

    function exportarExcel(datos) {
        if (!global.XLSX || !global.XLSX.utils) {
            throw new Error('No está disponible el generador de Excel.');
        }

        var contenido = filasExcel(datos);
        var libro = global.XLSX.utils.book_new();
        var hoja = global.XLSX.utils.aoa_to_sheet(contenido.filas);
        hoja['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
        hoja['!cols'] = [
            { wch: 18 }, { wch: 35 }, { wch: 42 }, { wch: 18 }, { wch: 16 }, { wch: 16 }
        ];
        contenido.filasImporte.forEach(function (fila) {
            [4, 5].forEach(function (columna) {
                var celda = hoja[global.XLSX.utils.encode_cell({ r: fila, c: columna })];
                if (celda && typeof celda.v === 'number') celda.z = '#,##0.00';
            });
        });
        contenido.filasTotales.forEach(function (fila) {
            var celda = hoja[global.XLSX.utils.encode_cell({ r: fila, c: 3 })];
            if (celda && typeof celda.v === 'number') celda.z = '#,##0.00';
        });
        global.XLSX.utils.book_append_sheet(libro, hoja, 'Proformas');
        global.XLSX.writeFile(libro, datos.archivo + '-' + fechaIsoLocal(new Date()) + '.xlsx');
    }

    function espacioDisponible(documento, y, minimo, margen) {
        if (y + minimo <= documento.internal.pageSize.getHeight() - margen) return y;
        documento.addPage();
        return margen;
    }

    function generarPdf(datos) {
        if (!global.jspdf || !global.jspdf.jsPDF) {
            throw new Error('No está disponible el generador de PDF.');
        }

        var documento = new global.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        if (typeof documento.autoTable !== 'function') {
            throw new Error('No está disponible el generador de tablas PDF.');
        }

        var ancho = documento.internal.pageSize.getWidth();
        var margen = 10;
        documento.setFontSize(15);
        documento.text(datos.titulo, margen, 12);
        documento.setFontSize(9);
        documento.setTextColor(90);
        documento.text('Generado: ' + new Date().toLocaleString('es-AR'), margen, 18);
        documento.text('Proformas: ' + datos.proformas.length, ancho - margen, 12, { align: 'right' });
        var lineasFiltros = documento.splitTextToSize('Filtros: ' + datos.filtros, ancho - (margen * 2));
        documento.text(lineasFiltros, margen, 24);
        documento.setTextColor(0);
        var y = 24 + (lineasFiltros.length * 4) + 4;

        if (!datos.proformas.length) {
            documento.setFontSize(10);
            documento.text('No hay proformas para los filtros seleccionados.', margen, y + 6);
        }

        datos.proformas.forEach(function (proforma) {
            y = espacioDisponible(documento, y, 34, margen);
            documento.setFillColor(52, 73, 123);
            documento.rect(margen, y, ancho - (margen * 2), 7, 'F');
            documento.setFont('helvetica', 'bold');
            documento.setFontSize(10);
            documento.setTextColor(255);
            documento.text('Proforma ' + (proforma.Numero || ('#' + proforma.Proforma_ID)), margen + 3, y + 4.8);
            documento.setTextColor(0);
            documento.setFont('helvetica', 'normal');
            documento.setFontSize(8);

            var datosCabecera = [
                'Cliente: ' + (proforma.Cliente || '—'),
                'CUIT: ' + (proforma.Cuit || '—'),
                'Fecha de Inicio: ' + (datos.formatearFecha(proforma.FechaInicio) || '—'),
                'Fecha Fin: ' + (datos.formatearFecha(proforma.FechaFin) || '—'),
                'Estado: ' + (proforma.Estado || '—'),
                'Total: ' + importe(proforma.Total),
                'Usuario: ' + (proforma.Usuario || '—')
            ];
            var lineasCabecera = documento.splitTextToSize(datosCabecera.join('     '), ancho - (margen * 2) - 6);
            documento.text(lineasCabecera, margen + 3, y + 11);
            y += 11 + (lineasCabecera.length * 3.5);

            var viajes = proforma.Viajes || [];
            documento.autoTable({
                head: [CABECERA_VIAJES],
                body: viajes.length ? viajes.map(function (viaje) {
                    var fila = filaViaje(viaje);
                    return [fila[0], fila[1], fila[2], fila[3], importe(fila[4]), importe(fila[5])];
                }) : [['No hay viajes asociados a esta proforma.', '', '', '', '', '']],
                startY: y,
                theme: 'grid',
                headStyles: { fillColor: [91, 112, 160] },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: { 3: { halign: 'right', cellWidth: 22 }, 4: { halign: 'right', cellWidth: 25 }, 5: { halign: 'right', cellWidth: 25 } },
                margin: { left: margen, right: margen }
            });
            y = documento.lastAutoTable.finalY + 8;
        });

        var alto = documento.internal.pageSize.getHeight();
        var paginas = documento.getNumberOfPages();
        for (var pagina = 1; pagina <= paginas; pagina++) {
            documento.setPage(pagina);
            documento.setFont('helvetica', 'normal');
            documento.setFontSize(7);
            documento.setTextColor(100);
            documento.text('Listado de Proformas', margen, alto - 6);
            documento.text('Página ' + pagina + ' de ' + paginas, ancho - margen, alto - 6, { align: 'right' });
        }
        return documento;
    }

    global.ReportesProformas = {
        exportar: function (formato, configuracion) {
            configuracion = configuracion || {};
            var datos = datosReporte(configuracion);
            if (formato === 'excel') {
                exportarExcel(datos);
                return;
            }

            var documento = generarPdf(datos);
            if (formato === 'pdf') {
                documento.save(datos.archivo + '-' + fechaIsoLocal(new Date()) + '.pdf');
                return;
            }
            if (formato === 'vistaPrevia') {
                if (!configuracion.ventanaPrevia) {
                    throw new Error('El navegador bloqueó la ventana de vista previa. Permití las ventanas emergentes e intentá nuevamente.');
                }
                documento.autoPrint();
                configuracion.ventanaPrevia.location.href = documento.output('bloburl');
                return;
            }
            throw new Error('Formato de reporte no válido.');
        }
    };
})(window);
