(function (window, document) {
    'use strict';

    var inicializada = false;
    var vistaActual = 'movimientos';

    var clientes = {
        aceros: {
            nombre: 'Aceros del Sur S.A.',
            cuit: '30-71234567-9',
            saldo: 320000,
            deudaVencida: 120000,
            deudaVencidaNota: '1 comprobante vencido',
            proximoVencimiento: '2026-08-18',
            proximoVencimientoNota: 'FAC-00000048 · $ 200.000,00',
            movimientos: [
                { fecha: '2026-08-01', comprobante: 'FAC-00000045', concepto: 'Servicio de transporte Rosario → Córdoba', debe: 300000, haber: 0, saldo: 300000, estado: 'Parcial', origen: 'Proforma PF-00000031', aplicaciones: 'REC-00000023 por $ 180.000,00' },
                { fecha: '2026-08-05', comprobante: 'REC-00000023', concepto: 'Cobranza por transferencia', debe: 0, haber: 180000, saldo: 120000, estado: 'Parcial', origen: 'Cobranza directa', aplicaciones: 'FAC-00000045 por $ 180.000,00' },
                { fecha: '2026-08-08', comprobante: 'FAC-00000048', concepto: 'Servicio de transporte Buenos Aires → Mendoza', debe: 250000, haber: 0, saldo: 370000, estado: 'Pendiente', origen: 'Proforma PF-00000034', aplicaciones: 'NC-00000006 por $ 50.000,00' },
                { fecha: '2026-08-09', comprobante: 'NC-00000006', concepto: 'Ajuste comercial sobre FAC-00000048', debe: 0, haber: 50000, saldo: 320000, estado: 'Pendiente', origen: 'Factura FAC-00000048', aplicaciones: 'FAC-00000048 por $ 50.000,00' }
            ],
            pendientes: [
                { comprobante: 'FAC-00000045', emision: '2026-08-01', vencimiento: '2026-08-05', original: 300000, aplicado: 180000, pendiente: 120000, situacion: 'Vencido 4 días', estado: 'Parcial', origen: 'Proforma PF-00000031', aplicaciones: 'REC-00000023 por $ 180.000,00' },
                { comprobante: 'FAC-00000048', emision: '2026-08-08', vencimiento: '2026-08-18', original: 250000, aplicado: 50000, pendiente: 200000, situacion: 'Vigente', estado: 'Pendiente', origen: 'Proforma PF-00000034', aplicaciones: 'NC-00000006 por $ 50.000,00' }
            ]
        },
        logistica: {
            nombre: 'Logística Pampeana SRL',
            cuit: '30-70987654-2',
            saldo: 85000,
            deudaVencida: 0,
            deudaVencidaNota: 'Sin deuda vencida',
            proximoVencimiento: '2026-08-25',
            proximoVencimientoNota: 'FAC-00000051 · $ 85.000,00',
            movimientos: [
                { fecha: '2026-08-03', comprobante: 'FAC-00000049', concepto: 'Distribución regional', debe: 140000, haber: 0, saldo: 140000, estado: 'Cancelado', origen: 'Proforma PF-00000036', aplicaciones: 'REC-00000025 por $ 140.000,00' },
                { fecha: '2026-08-07', comprobante: 'REC-00000025', concepto: 'Cobranza por transferencia', debe: 0, haber: 140000, saldo: 0, estado: 'Cancelado', origen: 'Cobranza directa', aplicaciones: 'FAC-00000049 por $ 140.000,00' },
                { fecha: '2026-08-09', comprobante: 'FAC-00000051', concepto: 'Servicio de transporte Santa Fe → Paraná', debe: 85000, haber: 0, saldo: 85000, estado: 'Pendiente', origen: 'Proforma PF-00000038', aplicaciones: 'Sin aplicaciones' }
            ],
            pendientes: [
                { comprobante: 'FAC-00000051', emision: '2026-08-09', vencimiento: '2026-08-25', original: 85000, aplicado: 0, pendiente: 85000, situacion: 'Vigente', estado: 'Pendiente', origen: 'Proforma PF-00000038', aplicaciones: 'Sin aplicaciones' }
            ]
        }
    };

    function porId(id) {
        return document.getElementById(id);
    }

    function escapar(valor) {
        return String(valor == null ? '' : valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function dinero(valor) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(Number(valor || 0));
    }

    function fecha(valor) {
        if (!valor) return '—';
        var partes = valor.split('-');
        return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : valor;
    }

    function tipoComprobante(numero) {
        return (numero || '').split('-')[0];
    }

    function clienteActual() {
        return clientes[porId('ccCliente').value] || clientes.aceros;
    }

    function claseEstado(estado) {
        if (estado === 'Cancelado') return 'cc-paid';
        if (estado === 'Parcial') return 'cc-partial';
        return 'cc-pending';
    }

    function badgeEstado(estado) {
        return '<span class="badge rounded-pill ' + claseEstado(estado) + '">' + escapar(estado) + '</span>';
    }

    function botonDetalle(comprobante) {
        return '<button type="button" class="btn btn-sm btn-outline-primary cc-ver-detalle" data-comprobante="' + escapar(comprobante) + '" aria-label="Ver detalle de ' + escapar(comprobante) + '"><i class="bi bi-eye"></i></button>';
    }

    function cargarClientes() {
        var select = porId('ccCliente');
        select.innerHTML = Object.keys(clientes).map(function (clave) {
            var item = clientes[clave];
            return '<option value="' + clave + '">' + escapar(item.nombre + ' — ' + item.cuit) + '</option>';
        }).join('');
    }

    function aplicarFiltros(lista, usaEmision) {
        var desde = porId('ccDesde').value;
        var hasta = porId('ccHasta').value;
        var tipo = porId('ccTipo').value;
        var estado = porId('ccEstado').value;

        return lista.filter(function (item) {
            var fechaItem = usaEmision ? item.emision : item.fecha;
            if (desde && fechaItem < desde) return false;
            if (hasta && fechaItem > hasta) return false;
            if (tipo && tipoComprobante(item.comprobante) !== tipo) return false;
            if (estado && item.estado !== estado) return false;
            return true;
        });
    }

    function renderResumen() {
        var cliente = clienteActual();
        porId('ccSaldoActual').textContent = dinero(cliente.saldo);
        porId('ccDeudaVencida').textContent = dinero(cliente.deudaVencida);
        porId('ccDeudaVencidaNota').textContent = cliente.deudaVencidaNota;
        porId('ccProximoVencimiento').textContent = fecha(cliente.proximoVencimiento);
        porId('ccProximoVencimientoNota').textContent = cliente.proximoVencimientoNota;
    }

    function renderMovimientos() {
        var filas = aplicarFiltros(clienteActual().movimientos, false);
        var soloPendientes = porId('ccSoloPendientes').checked;
        if (soloPendientes) filas = filas.filter(function (item) { return item.estado !== 'Cancelado'; });

        porId('ccTablaCabecera').innerHTML = '<tr>' +
            '<th>Fecha</th><th>Comprobante</th><th>Concepto</th>' +
            '<th class="text-end">Debe</th><th class="text-end">Haber</th><th class="text-end">Saldo</th>' +
            '<th>Estado</th><th class="text-center">Acciones</th></tr>';

        if (!filas.length) {
            porId('ccTablaCuerpo').innerHTML = '<tr><td colspan="8" class="cc-empty">No hay movimientos para los filtros seleccionados.</td></tr>';
            return;
        }

        porId('ccTablaCuerpo').innerHTML = filas.map(function (item) {
            return '<tr>' +
                '<td>' + fecha(item.fecha) + '</td>' +
                '<td class="cc-document">' + escapar(item.comprobante) + '</td>' +
                '<td>' + escapar(item.concepto) + '</td>' +
                '<td class="cc-money cc-debit">' + (item.debe ? dinero(item.debe) : '—') + '</td>' +
                '<td class="cc-money cc-credit">' + (item.haber ? dinero(item.haber) : '—') + '</td>' +
                '<td class="cc-money fw-bold">' + dinero(item.saldo) + '</td>' +
                '<td>' + badgeEstado(item.estado) + '</td>' +
                '<td class="text-center">' + botonDetalle(item.comprobante) + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderPendientes() {
        var filas = aplicarFiltros(clienteActual().pendientes, true);

        porId('ccTablaCabecera').innerHTML = '<tr>' +
            '<th>Comprobante</th><th>Emisión</th><th>Vencimiento</th>' +
            '<th class="text-end">Importe original</th><th class="text-end">Aplicado</th><th class="text-end">Saldo pendiente</th>' +
            '<th>Situación</th><th>Estado</th><th class="text-center">Acciones</th></tr>';

        if (!filas.length) {
            porId('ccTablaCuerpo').innerHTML = '<tr><td colspan="9" class="cc-empty">No hay comprobantes pendientes para los filtros seleccionados.</td></tr>';
            return;
        }

        porId('ccTablaCuerpo').innerHTML = filas.map(function (item) {
            return '<tr>' +
                '<td class="cc-document">' + escapar(item.comprobante) + '</td>' +
                '<td>' + fecha(item.emision) + '</td>' +
                '<td>' + fecha(item.vencimiento) + '</td>' +
                '<td class="cc-money">' + dinero(item.original) + '</td>' +
                '<td class="cc-money cc-credit">' + dinero(item.aplicado) + '</td>' +
                '<td class="cc-money cc-debit fw-bold">' + dinero(item.pendiente) + '</td>' +
                '<td>' + escapar(item.situacion) + '</td>' +
                '<td>' + badgeEstado(item.estado) + '</td>' +
                '<td class="text-center">' + botonDetalle(item.comprobante) + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderTabla() {
        if (vistaActual === 'pendientes') renderPendientes();
        else renderMovimientos();
    }

    function renderTodo() {
        renderResumen();
        renderTabla();
    }

    function cambiarVista(nuevaVista) {
        vistaActual = nuevaVista;
        document.querySelectorAll('.cc-tab').forEach(function (tab) {
            var activa = tab.getAttribute('data-view') === vistaActual;
            tab.classList.toggle('active', activa);
            tab.setAttribute('aria-selected', activa ? 'true' : 'false');
        });
        renderTabla();
    }

    function buscarComprobante(numero) {
        var cliente = clienteActual();
        var movimiento = cliente.movimientos.find(function (item) { return item.comprobante === numero; });
        if (movimiento) {
            return {
                comprobante: movimiento.comprobante,
                fecha: movimiento.fecha,
                estado: movimiento.estado,
                importe: movimiento.debe || movimiento.haber,
                saldo: movimiento.debe ? Math.max(movimiento.debe - (movimiento.aplicaciones === 'Sin aplicaciones' ? 0 : 0), 0) : 0,
                concepto: movimiento.concepto,
                origen: movimiento.origen,
                aplicaciones: movimiento.aplicaciones
            };
        }

        var pendiente = cliente.pendientes.find(function (item) { return item.comprobante === numero; });
        if (!pendiente) return null;
        return {
            comprobante: pendiente.comprobante,
            fecha: pendiente.emision,
            estado: pendiente.estado,
            importe: pendiente.original,
            saldo: pendiente.pendiente,
            concepto: 'Comprobante de venta',
            origen: pendiente.origen,
            aplicaciones: pendiente.aplicaciones
        };
    }

    function abrirDetalle(numero) {
        var item = buscarComprobante(numero);
        if (!item) return;

        porId('modalDetalleTitulo').textContent = 'Detalle · ' + item.comprobante;
        porId('modalDetalleCuerpo').innerHTML =
            '<div class="row g-3 mb-3">' +
                '<div class="col-md-4"><small class="text-muted d-block">Fecha</small><strong>' + fecha(item.fecha) + '</strong></div>' +
                '<div class="col-md-4"><small class="text-muted d-block">Importe</small><strong>' + dinero(item.importe) + '</strong></div>' +
                '<div class="col-md-4"><small class="text-muted d-block">Estado financiero</small>' + badgeEstado(item.estado) + '</div>' +
                '<div class="col-12"><small class="text-muted d-block">Concepto</small><strong>' + escapar(item.concepto) + '</strong></div>' +
            '</div>' +
            '<div class="cc-block-title">Trazabilidad</div>' +
            '<div class="cc-trace-item"><div class="cc-trace-title">Origen</div><div class="cc-trace-text">' + escapar(item.origen) + '</div></div>' +
            '<div class="cc-trace-item"><div class="cc-trace-title">Comprobante</div><div class="cc-trace-text">' + escapar(item.comprobante) + ' · Estado documental: Emitido</div></div>' +
            '<div class="cc-trace-item"><div class="cc-trace-title">Aplicaciones</div><div class="cc-trace-text">' + escapar(item.aplicaciones) + '</div></div>';

        bootstrap.Modal.getOrCreateInstance(porId('modalDetalleComprobante')).show();
    }

    function distribuirImporteRecibo(total) {
        var restante = Math.max(Number(total || 0), 0);
        document.querySelectorAll('#reciboFacturas tr').forEach(function (fila) {
            var check = fila.querySelector('.cc-recibo-check');
            var input = fila.querySelector('.cc-recibo-aplicar');
            var pendiente = Number(input.getAttribute('data-pendiente'));
            var aplicar = Math.min(restante, pendiente);
            check.checked = aplicar > 0;
            input.disabled = !check.checked;
            input.value = aplicar.toFixed(2);
            restante -= aplicar;
        });
        actualizarResumenRecibo();
    }

    function cargarFacturasRecibo() {
        var cliente = clienteActual();
        porId('reciboCliente').value = cliente.nombre + ' — ' + cliente.cuit;
        porId('reciboFacturas').innerHTML = cliente.pendientes.map(function (item) {
            return '<tr>' +
                '<td><input type="checkbox" class="form-check-input cc-recibo-check"></td>' +
                '<td class="cc-document">' + escapar(item.comprobante) + '</td>' +
                '<td>' + fecha(item.vencimiento) + '</td>' +
                '<td class="text-end">' + dinero(item.original) + '</td>' +
                '<td class="text-end fw-bold">' + dinero(item.pendiente) + '</td>' +
                '<td class="text-end"><input type="number" min="0" step="0.01" class="form-control form-control-sm text-end cc-allocation-input cc-recibo-aplicar" data-pendiente="' + item.pendiente + '" value="0" disabled></td>' +
                '</tr>';
        }).join('');

        var totalSugerido = Math.min(cliente.saldo, 200000);
        porId('reciboTotal').value = totalSugerido.toFixed(2);
        porId('reciboFormaImporte').value = totalSugerido.toFixed(2);
        porId('reciboError').textContent = '';
        distribuirImporteRecibo(totalSugerido);
    }

    function actualizarResumenRecibo() {
        var total = Number(porId('reciboTotal').value || 0);
        var aplicado = 0;

        document.querySelectorAll('#reciboFacturas tr').forEach(function (fila) {
            var check = fila.querySelector('.cc-recibo-check');
            var input = fila.querySelector('.cc-recibo-aplicar');
            input.disabled = !check.checked;
            if (check.checked) aplicado += Number(input.value || 0);
        });

        var diferencia = total - aplicado;
        porId('reciboResumenTotal').textContent = dinero(total);
        porId('reciboResumenAplicado').textContent = dinero(aplicado);
        porId('reciboResumenDiferencia').textContent = dinero(diferencia);
        porId('reciboResumenDiferencia').className = Math.abs(diferencia) < 0.005 ? 'text-success' : 'text-danger';
        return { total: total, aplicado: aplicado, diferencia: diferencia };
    }

    function validarRecibo() {
        var resumen = actualizarResumenRecibo();
        var formaImporte = Number(porId('reciboFormaImporte').value || 0);
        var error = '';

        if (resumen.total <= 0) error = 'El importe del recibo debe ser mayor que cero.';
        else if (Math.abs(formaImporte - resumen.total) >= 0.005) error = 'La forma de pago debe coincidir con el total del recibo.';
        else {
            document.querySelectorAll('#reciboFacturas tr').forEach(function (fila) {
                if (error) return;
                var check = fila.querySelector('.cc-recibo-check');
                var input = fila.querySelector('.cc-recibo-aplicar');
                var valor = Number(input.value || 0);
                var pendiente = Number(input.getAttribute('data-pendiente'));
                if (check.checked && (valor <= 0 || valor > pendiente)) {
                    error = 'Cada importe aplicado debe ser mayor que cero y no superar el saldo pendiente.';
                }
            });
        }
        if (!error && Math.abs(resumen.diferencia) >= 0.005) error = 'El total aplicado debe ser igual al importe del recibo.';

        porId('reciboError').textContent = error;
        return !error;
    }

    function abrirNuevoRecibo() {
        cargarFacturasRecibo();
        bootstrap.Modal.getOrCreateInstance(porId('modalNuevoRecibo')).show();
    }

    function simularRecibo() {
        if (!validarRecibo()) return;
        bootstrap.Modal.getOrCreateInstance(porId('modalNuevoRecibo')).hide();
        window.setTimeout(function () {
            window.alert('Simulación completada. El recibo no fue guardado porque el backend todavía no está implementado.');
        }, 250);
    }

    function abrirAccionFutura(accion) {
        porId('modalAccionFuturaTexto').textContent = 'La acción “' + accion + '” ya tiene reservado su acceso desde Cuenta Corriente.';
        bootstrap.Modal.getOrCreateInstance(porId('modalAccionFutura')).show();
    }

    function limpiarFiltros() {
        porId('ccDesde').value = '';
        porId('ccHasta').value = '';
        porId('ccTipo').value = '';
        porId('ccEstado').value = '';
        porId('ccSoloPendientes').checked = false;
        cambiarVista('movimientos');
    }

    function filasParaExportar() {
        if (vistaActual === 'pendientes') {
            return aplicarFiltros(clienteActual().pendientes, true).map(function (item) {
                return [item.comprobante, fecha(item.emision), fecha(item.vencimiento), item.original, item.aplicado, item.pendiente, item.situacion, item.estado];
            });
        }
        return aplicarFiltros(clienteActual().movimientos, false).map(function (item) {
            return [fecha(item.fecha), item.comprobante, item.concepto, item.debe, item.haber, item.saldo, item.estado];
        });
    }

    function exportarCsv() {
        var cabecera = vistaActual === 'pendientes'
            ? ['Comprobante', 'Emisión', 'Vencimiento', 'Importe original', 'Aplicado', 'Saldo pendiente', 'Situación', 'Estado']
            : ['Fecha', 'Comprobante', 'Concepto', 'Debe', 'Haber', 'Saldo', 'Estado'];
        var filas = filasParaExportar();
        var contenido = [cabecera].concat(filas).map(function (fila) {
            return fila.map(function (celda) { return '"' + String(celda == null ? '' : celda).replace(/"/g, '""') + '"'; }).join(';');
        }).join('\r\n');

        var blob = new Blob(['\ufeff' + contenido], { type: 'text/csv;charset=utf-8;' });
        var enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = 'cuenta-corriente-' + porId('ccCliente').value + '.csv';
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(enlace.href);
    }

    function enlazarEventos() {
        porId('ccCliente').addEventListener('change', renderTodo);
        porId('btnBuscarCuenta').addEventListener('click', renderTabla);
        porId('btnLimpiarCuenta').addEventListener('click', limpiarFiltros);
        porId('ccSoloPendientes').addEventListener('change', function () {
            if (this.checked) cambiarVista('pendientes');
            else renderTabla();
        });
        porId('btnNuevoRecibo').addEventListener('click', abrirNuevoRecibo);
        porId('btnSimularRecibo').addEventListener('click', simularRecibo);
        porId('btnExportarCuenta').addEventListener('click', exportarCsv);

        document.querySelectorAll('.cc-tab').forEach(function (tab) {
            tab.addEventListener('click', function () { cambiarVista(tab.getAttribute('data-view')); });
        });
        document.querySelectorAll('.cc-future-action').forEach(function (button) {
            button.addEventListener('click', function () { abrirAccionFutura(button.getAttribute('data-action')); });
        });
        porId('ccTablaCuerpo').addEventListener('click', function (event) {
            var boton = event.target.closest('.cc-ver-detalle');
            if (boton) abrirDetalle(boton.getAttribute('data-comprobante'));
        });
        porId('reciboTotal').addEventListener('input', function () {
            porId('reciboFormaImporte').value = porId('reciboTotal').value;
            distribuirImporteRecibo(Number(porId('reciboTotal').value || 0));
        });
        porId('reciboFormaImporte').addEventListener('input', actualizarResumenRecibo);
        porId('reciboFacturas').addEventListener('input', actualizarResumenRecibo);
        porId('reciboFacturas').addEventListener('change', actualizarResumenRecibo);
    }

    function inicializar() {
        if (inicializada) return;
        inicializada = true;
        cargarClientes();
        enlazarEventos();
        renderTodo();
    }

    window.CuentaCorrienteUI = {
        inicializar: inicializar
    };
})(window, document);
