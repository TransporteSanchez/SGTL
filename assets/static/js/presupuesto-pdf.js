(function (window) {
    'use strict';

    function fecha(valor) {
        if (!valor) return '—';
        var partes = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/);
        return partes ? partes[3] + '/' + partes[2] + '/' + partes[1] + (partes[4] ? ' ' + partes[4] : '') : String(valor);
    }
    function dinero(valor) {
        var numero = Number(valor);
        return valor == null || valor === '' || !Number.isFinite(numero) ? '—' : '$ ' + numero.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function construir(p, cliente, empresa) {
        var logo = empresa.logo; // el de la empresa (Gestionar empresa), nunca el del sistema
        if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('No se pudo cargar el generador de PDF. Revisá la conexión y volvé a intentar.');
        var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
        var azul = [42, 115, 195], oscuro = [27, 37, 55], gris = [98, 110, 125], y = 20, margen = 18, derecha = 192;
        function color(c) { doc.setTextColor(c[0], c[1], c[2]); }
        function escribir(t, x, yy, tam, negrita, c, opciones) { doc.setFont('helvetica', negrita ? 'bold' : 'normal'); doc.setFontSize(tam); color(c || oscuro); doc.text(String(t), x, yy, opciones || {}); }
        function linea(yy) { doc.setDrawColor(150, 178, 205); doc.setLineWidth(0.3); doc.line(margen, yy, derecha, yy); }
        function espacio(alto) { if (y + alto > 280) { doc.addPage(); y = 20; } }
        function detalle(etiqueta, valor) {
            if (valor == null || String(valor).trim() === '') return;
            var lineas = doc.splitTextToSize(etiqueta + ': ' + String(valor), 174);
            lineas.forEach(function (l) { espacio(6); escribir(l, margen, y, 10, false); y += 5; });
            y += 1;
        }
        escribir('Presupuesto', margen, 25, 25, true, azul);
        if (logo) {
            var proporcion = Math.min(48 / logo.ancho, 19 / logo.alto), ancho = logo.ancho * proporcion, alto = logo.alto * proporcion;
            try { doc.addImage(logo.datos, 'PNG', derecha - ancho, 12, ancho, alto); } catch (e) { logo = null; }
        }
        if (!logo) escribir(doc.splitTextToSize(empresa.nombre, 80)[0], derecha, 23, 12, true, azul, { align: 'right' });
        escribir('Fecha de presupuesto:', margen, 39, 10, true); escribir(fecha(p.fecha), 67, 39, 10);
        escribir('Número de presupuesto:', margen, 46, 10, true); escribir('#' + p.id, 67, 46, 10);
        var validezLineas = p.validez ? doc.splitTextToSize(String(p.validez), 125) : [];
        if (validezLineas.length) { escribir('Validez:', margen, 53, 10, true); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(validezLineas, 67, 53); }

        y = Math.max(70, 58 + validezLineas.length * 5); espacio(20); escribir('Prestador', margen, y, 12, true, azul); escribir('Cliente', 107, y, 12, true, azul); linea(y + 3);
        y += 11;
        // Prestador (Gestionar empresa): el nombre y, debajo, CUIT, domicilio y contacto. El cliente va al lado, desde la misma altura.
        var yDatos = y;
        [empresa.nombre].concat(empresa.lineas).forEach(function (valor, indice) {
            doc.splitTextToSize(String(valor), 84).forEach(function (l) { espacio(6); escribir(l, margen, y, 10, indice === 0); y += 5; });
        });
        var yPrestador = y;
        y = yDatos;
        cliente = cliente || {};
        var datosCliente = [p.cliente || cliente.Razon_Social, cliente.CUIT_Cliente ? 'CUIT: ' + cliente.CUIT_Cliente : '', [cliente.Calle, cliente.AlturaCalle].filter(Boolean).join(' '), p.email ? 'Email: ' + p.email : (cliente.Email ? 'Email: ' + cliente.Email : ''), cliente.Telefono ? 'Teléfono: ' + cliente.Telefono : ''].filter(Boolean);
        datosCliente.forEach(function (valor, indice) {
            var lineas = doc.splitTextToSize(String(valor), 84);
            lineas.forEach(function (l) { espacio(6); escribir(l, 107, y, 10, indice === 0); y += 5; });
        });
        y = Math.max(Math.max(y, yPrestador) + 12, 100); espacio(35);
        escribir('Descripción', margen, y, 10, true, azul); escribir('Distancia', 112, y, 10, true, azul); escribir('Importe', derecha, y, 10, true, azul, { align: 'right' }); linea(y + 3); y += 11;
        var ruta = doc.splitTextToSize('Servicio de transporte: ' + (p.origen || '—') + ' a ' + (p.destino || '—'), 88);
        escribir(p.distancia ? String(p.distancia) + ' km' : '—', 112, y, 10);
        escribir(dinero(p.importe), derecha, y, 10, false, oscuro, { align: 'right' });
        ruta.forEach(function (l) { espacio(6); escribir(l, margen, y, 10); y += 5; });
        y += 3; espacio(13); linea(y); y += 12;
        espacio(20); escribir('TOTAL (ARS)', 115, y, 12, true, azul); escribir(dinero(p.importe), derecha, y, 14, true, oscuro, { align: 'right' }); y += 18;
        espacio(22); escribir('Datos del servicio', margen, y, 12, true, azul); y += 8;
        detalle('Inicio', p.fechaInicio ? fecha(p.fechaInicio) : ''); detalle('Fin', p.fechaFin ? fecha(p.fechaFin) : '');
        detalle('Camión', p.camion); detalle('Chofer', p.chofer);
        detalle('Tarifa', p.tipoTarifa === 'km' ? 'Por km' : p.tipoTarifa === 'fija' ? 'Fija' : '');
        if (p.pago || p.tiempo || p.condiciones) {
            y += 6; espacio(16); escribir('Condiciones y observaciones', margen, y, 12, true, azul); y += 8;
            detalle('Forma y plazo de pago', p.pago); detalle('Tiempo estimado', p.tiempo); detalle('Observaciones', p.condiciones);
        }
        return doc;
    }
    // Los datos de la empresa que valían en la fecha del presupuesto, con su logo (Gestionar empresa, empresa-datos.js).
    function datosEmpresa(p) {
        if (!window.SGTLEmpresa) return Promise.reject(new Error('No se pudieron leer los datos de la empresa para el PDF. Probá de nuevo.'));
        return window.SGTLEmpresa.obtener(p.fecha);
    }
    function preparar(p, cliente) {
        return datosEmpresa(p).then(function (empresa) { return construir(p, cliente, empresa); });
    }
    window.PresupuestoPDF = { preparar: preparar };
}(window));
