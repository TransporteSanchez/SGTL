(function (window, document) {
    'use strict';

    var API = 'http://localhost:50222/api';
    var inicializada = false;
    var vistaActual = 'movimientos';
    var clientes = [];
    var resumen = null;
    var movimientos = [];
    var pendientes = [];

    function porId(id) { return document.getElementById(id); }
    function escapar(valor) {
        return String(valor == null ? '' : valor).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function apiGet(ruta) {
        return fetch(API + ruta, { headers: { Accept: 'application/json' } }).then(function (respuesta) {
            if (!respuesta.ok) return respuesta.json().catch(function () { return {}; }).then(function (error) {
                throw new Error(error.error || error.Message || 'No se pudo consultar el servidor.');
            });
            return respuesta.json();
        });
    }
    function dinero(valor) {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
            .format(Number(valor || 0));
    }
    function fecha(valor) {
        if (!valor) return '—';
        var partes = String(valor).substring(0, 10).split('-');
        return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : valor;
    }
    function clienteActual() {
        var id = Number(porId('ccCliente').value || 0);
        return clientes.find(function (item) { return item.ClienteID === id; }) || null;
    }
    function claseEstado(estado) {
        if (estado === 'Cancelado' || estado === 'Aplicado') return 'cc-paid';
        if (estado === 'Parcial' || estado === 'Parcialmente aplicado') return 'cc-partial';
        return 'cc-pending';
    }
    function badgeEstado(estado) {
        return '<span class="badge rounded-pill ' + claseEstado(estado) + '">' + escapar(estado) + '</span>';
    }
    function botonDetalle(id, comprobante) {
        return '<button type="button" class="btn btn-sm btn-outline-primary cc-ver-detalle" data-id="' + Number(id) +
            '" aria-label="Ver detalle de ' + escapar(comprobante) + '"><i class="bi bi-eye"></i></button>';
    }
    function mostrarCarga() {
        porId('ccTablaCuerpo').innerHTML = '<tr><td colspan="9" class="cc-empty">Cargando información…</td></tr>';
    }
    function mostrarError(error) {
        console.error(error);
        porId('ccTablaCuerpo').innerHTML = '<tr><td colspan="9" class="cc-empty text-danger">' +
            escapar(error.message || 'No se pudo cargar la cuenta corriente.') + '</td></tr>';
    }

    function cargarClientes() {
        return apiGet('/cuenta-corriente/clientes').then(function (datos) {
            clientes = datos || [];
            var select = porId('ccCliente');
            select.innerHTML = clientes.map(function (item) {
                return '<option value="' + item.ClienteID + '">' + escapar(item.RazonSocial + ' — ' + item.CUIT +
                    (item.Activo ? '' : ' · Inactivo')) + '</option>';
            }).join('');
            if (!clientes.length) {
                select.innerHTML = '<option value="">No hay clientes</option>';
                select.disabled = true;
            }
        });
    }
    function parametrosMovimientos() {
        var parametros = new URLSearchParams();
        ['Desde', 'Hasta', 'Tipo', 'Estado'].forEach(function (nombre) {
            var valor = porId('cc' + nombre).value;
            if (valor) parametros.set(nombre.toLowerCase(), valor);
        });
        parametros.set('pageSize', '200');
        return parametros.toString();
    }
    function cargarCuenta() {
        var cliente = clienteActual();
        if (!cliente) { resumen = null; movimientos = []; pendientes = []; renderTodo(); return Promise.resolve(); }
        mostrarCarga();
        return Promise.all([
            apiGet('/clientes/' + cliente.ClienteID + '/saldo'),
            apiGet('/clientes/' + cliente.ClienteID + '/cuenta-corriente?' + parametrosMovimientos()),
            apiGet('/clientes/' + cliente.ClienteID + '/comprobantes-pendientes')
        ]).then(function (resultados) {
            resumen = resultados[0]; movimientos = resultados[1].items || []; pendientes = resultados[2] || [];
            renderTodo();
        }).catch(mostrarError);
    }

    function renderResumen() {
        porId('ccSaldoActual').textContent = dinero(resumen ? resumen.SaldoActual : 0);
        porId('ccDeudaVencida').textContent = dinero(resumen ? resumen.DeudaVencida : 0);
        var vencidos = resumen ? resumen.CantidadVencidos : 0;
        porId('ccDeudaVencidaNota').textContent = vencidos
            ? vencidos + (vencidos === 1 ? ' comprobante vencido' : ' comprobantes vencidos') : 'Sin deuda vencida';
        porId('ccProximoVencimiento').textContent = fecha(resumen && resumen.ProximoVencimiento);
        porId('ccProximoVencimientoNota').textContent = resumen && resumen.ProximoComprobante
            ? resumen.ProximoComprobante + ' · ' + dinero(resumen.ProximoImporte) : 'Sin próximos vencimientos';
    }
    function renderMovimientos() {
        porId('ccTablaCabecera').innerHTML = '<tr><th>Fecha</th><th>Comprobante</th><th>Concepto</th>' +
            '<th class="text-end">Debe</th><th class="text-end">Haber</th><th class="text-end">Saldo</th>' +
            '<th>Estado</th><th class="text-center">Acciones</th></tr>';
        if (!movimientos.length) {
            porId('ccTablaCuerpo').innerHTML = '<tr><td colspan="8" class="cc-empty">No hay movimientos para los filtros seleccionados.</td></tr>';
            return;
        }
        porId('ccTablaCuerpo').innerHTML = movimientos.map(function (item) {
            return '<tr><td>' + fecha(item.Fecha) + '</td><td class="cc-document">' + escapar(item.Comprobante) + '</td>' +
                '<td>' + escapar(item.Concepto) + '</td><td class="cc-money cc-debit">' + (item.Debe ? dinero(item.Debe) : '—') + '</td>' +
                '<td class="cc-money cc-credit">' + (item.Haber ? dinero(item.Haber) : '—') + '</td>' +
                '<td class="cc-money fw-bold">' + dinero(item.Saldo) + '</td><td>' + badgeEstado(item.Estado) + '</td>' +
                '<td class="text-center">' + botonDetalle(item.ComprobanteID, item.Comprobante) + '</td></tr>';
        }).join('');
    }
    function pendientesFiltrados() {
        var desde = porId('ccDesde').value, hasta = porId('ccHasta').value;
        var tipo = porId('ccTipo').value, estado = porId('ccEstado').value;
        return pendientes.filter(function (item) {
            var emision = String(item.FechaEmision || '').substring(0, 10);
            return (!desde || emision >= desde) && (!hasta || emision <= hasta) &&
                (!tipo || item.Tipo === tipo) && (!estado || item.Estado === estado);
        });
    }
    function renderPendientes() {
        var filas = pendientesFiltrados();
        porId('ccTablaCabecera').innerHTML = '<tr><th>Comprobante</th><th>Emisión</th><th>Vencimiento</th>' +
            '<th class="text-end">Importe original</th><th class="text-end">Aplicado</th><th class="text-end">Saldo pendiente</th>' +
            '<th>Situación</th><th>Estado</th><th class="text-center">Acciones</th></tr>';
        if (!filas.length) {
            porId('ccTablaCuerpo').innerHTML = '<tr><td colspan="9" class="cc-empty">No hay comprobantes pendientes para los filtros seleccionados.</td></tr>';
            return;
        }
        porId('ccTablaCuerpo').innerHTML = filas.map(function (item) {
            return '<tr><td class="cc-document">' + escapar(item.Comprobante) + '</td><td>' + fecha(item.FechaEmision) + '</td>' +
                '<td>' + fecha(item.FechaVencimiento) + '</td><td class="cc-money">' + dinero(item.ImporteOriginal) + '</td>' +
                '<td class="cc-money cc-credit">' + dinero(item.ImporteAplicado) + '</td><td class="cc-money cc-debit fw-bold">' +
                dinero(item.SaldoPendiente) + '</td><td>' + escapar(item.Situacion) + '</td><td>' + badgeEstado(item.Estado) + '</td>' +
                '<td class="text-center">' + botonDetalle(item.ComprobanteID, item.Comprobante) + '</td></tr>';
        }).join('');
    }
    function renderTabla() { if (vistaActual === 'pendientes') renderPendientes(); else renderMovimientos(); }
    function renderTodo() { renderResumen(); renderTabla(); }
    function cambiarVista(nuevaVista) {
        vistaActual = nuevaVista;
        document.querySelectorAll('.cc-tab').forEach(function (tab) {
            var activa = tab.getAttribute('data-view') === vistaActual;
            tab.classList.toggle('active', activa); tab.setAttribute('aria-selected', activa ? 'true' : 'false');
        });
        renderTabla();
    }

    function buscarComprobante(id) {
        return movimientos.find(function (item) { return item.ComprobanteID === id; }) ||
            pendientes.find(function (item) { return item.ComprobanteID === id; });
    }
    function abrirDetalle(id) {
        var item = buscarComprobante(Number(id));
        if (!item) return;
        var importe = item.ImporteOriginal || item.Debe || item.Haber;
        var saldo = item.SaldoPendiente == null ? item.Saldo : item.SaldoPendiente;
        porId('modalDetalleTitulo').textContent = 'Detalle · ' + item.Comprobante;
        porId('modalDetalleCuerpo').innerHTML = '<div class="row g-3 mb-3">' +
            '<div class="col-md-4"><small class="text-muted d-block">Fecha</small><strong>' + fecha(item.FechaEmision || item.Fecha) + '</strong></div>' +
            '<div class="col-md-4"><small class="text-muted d-block">Importe</small><strong>' + dinero(importe) + '</strong></div>' +
            '<div class="col-md-4"><small class="text-muted d-block">Estado financiero</small>' + badgeEstado(item.Estado) + '</div>' +
            '<div class="col-md-4"><small class="text-muted d-block">Saldo</small><strong>' + dinero(saldo) + '</strong></div></div>' +
            '<div class="cc-block-title">Trazabilidad</div><div class="cc-trace-item"><div class="cc-trace-title">Origen</div>' +
            '<div class="cc-trace-text">' + escapar(item.Origen || 'Comprobante directo') + '</div></div>';
        bootstrap.Modal.getOrCreateInstance(porId('modalDetalleComprobante')).show();
    }

    function cargarFacturasRecibo() {
        var cliente = clienteActual();
        porId('reciboCliente').value = cliente ? cliente.RazonSocial + ' — ' + cliente.CUIT : '';
        porId('reciboFacturas').innerHTML = pendientes.map(function (item) {
            return '<tr><td><input type="checkbox" class="form-check-input cc-recibo-check"></td>' +
                '<td class="cc-document">' + escapar(item.Comprobante) + '</td><td>' + fecha(item.FechaVencimiento) + '</td>' +
                '<td class="text-end">' + dinero(item.ImporteOriginal) + '</td><td class="text-end fw-bold">' + dinero(item.SaldoPendiente) + '</td>' +
                '<td class="text-end"><input type="number" min="0" step="0.01" class="form-control form-control-sm text-end cc-allocation-input cc-recibo-aplicar" ' +
                'data-pendiente="' + Number(item.SaldoPendiente) + '" disabled value="0.00"></td></tr>';
        }).join('') || '<tr><td colspan="6" class="cc-empty">El cliente no tiene deudas pendientes.</td></tr>';
        actualizarResumenRecibo();
    }
    function actualizarResumenRecibo() {
        var total = Number(porId('reciboTotal').value || 0), aplicado = 0;
        document.querySelectorAll('.cc-recibo-aplicar').forEach(function (input) {
            if (!input.disabled) aplicado += Number(input.value || 0);
        });
        porId('reciboResumenTotal').textContent = dinero(total);
        porId('reciboResumenAplicado').textContent = dinero(aplicado);
        porId('reciboResumenDiferencia').textContent = dinero(total - aplicado);
    }
    function distribuirImporteRecibo(total) {
        var restante = Math.max(Number(total || 0), 0);
        document.querySelectorAll('#reciboFacturas tr').forEach(function (fila) {
            var check = fila.querySelector('.cc-recibo-check'), input = fila.querySelector('.cc-recibo-aplicar');
            if (!check || !input) return;
            var aplicar = Math.min(restante, Number(input.getAttribute('data-pendiente')));
            check.checked = aplicar > 0; input.disabled = !check.checked; input.value = aplicar.toFixed(2); restante -= aplicar;
        });
        actualizarResumenRecibo();
    }
    function abrirNuevoRecibo() {
        cargarFacturasRecibo(); bootstrap.Modal.getOrCreateInstance(porId('modalNuevoRecibo')).show();
    }
    function simularRecibo() {
        window.alert('La consulta ya usa datos reales. La emisión transaccional de recibos se habilitará en la siguiente etapa del backend.');
    }
    function abrirAccionFutura(accion) {
        porId('modalAccionFuturaTexto').textContent = 'La acción “' + accion + '” se habilitará al implementar su servicio transaccional.';
        bootstrap.Modal.getOrCreateInstance(porId('modalAccionFutura')).show();
    }
    function limpiarFiltros() {
        porId('ccDesde').value = ''; porId('ccHasta').value = ''; porId('ccTipo').value = '';
        porId('ccEstado').value = ''; porId('ccSoloPendientes').checked = false;
        cambiarVista('movimientos'); cargarCuenta();
    }
    function filasParaExportar() {
        if (vistaActual === 'pendientes') return pendientesFiltrados().map(function (item) {
            return [item.Comprobante, fecha(item.FechaEmision), fecha(item.FechaVencimiento), item.ImporteOriginal,
                item.ImporteAplicado, item.SaldoPendiente, item.Situacion, item.Estado];
        });
        return movimientos.map(function (item) {
            return [fecha(item.Fecha), item.Comprobante, item.Concepto, item.Debe, item.Haber, item.Saldo, item.Estado];
        });
    }
    function exportarCsv() {
        var cabecera = vistaActual === 'pendientes'
            ? ['Comprobante', 'Emisión', 'Vencimiento', 'Importe original', 'Aplicado', 'Saldo pendiente', 'Situación', 'Estado']
            : ['Fecha', 'Comprobante', 'Concepto', 'Debe', 'Haber', 'Saldo', 'Estado'];
        var contenido = [cabecera].concat(filasParaExportar()).map(function (fila) {
            return fila.map(function (celda) { return '"' + String(celda == null ? '' : celda).replace(/"/g, '""') + '"'; }).join(';');
        }).join('\r\n');
        var blob = new Blob(['\ufeff' + contenido], { type: 'text/csv;charset=utf-8;' });
        var enlace = document.createElement('a'); enlace.href = URL.createObjectURL(blob);
        enlace.download = 'cuenta-corriente-' + porId('ccCliente').value + '.csv';
        document.body.appendChild(enlace); enlace.click(); document.body.removeChild(enlace); URL.revokeObjectURL(enlace.href);
    }

    function enlazarEventos() {
        porId('ccCliente').addEventListener('change', cargarCuenta);
        porId('btnBuscarCuenta').addEventListener('click', cargarCuenta);
        porId('btnLimpiarCuenta').addEventListener('click', limpiarFiltros);
        porId('ccSoloPendientes').addEventListener('change', function () { cambiarVista(this.checked ? 'pendientes' : 'movimientos'); });
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
            var boton = event.target.closest('.cc-ver-detalle'); if (boton) abrirDetalle(boton.getAttribute('data-id'));
        });
        porId('reciboTotal').addEventListener('input', function () {
            porId('reciboFormaImporte').value = porId('reciboTotal').value; distribuirImporteRecibo(porId('reciboTotal').value);
        });
        porId('reciboFormaImporte').addEventListener('input', actualizarResumenRecibo);
        porId('reciboFacturas').addEventListener('input', actualizarResumenRecibo);
        porId('reciboFacturas').addEventListener('change', function (event) {
            if (event.target.classList.contains('cc-recibo-check')) {
                var input = event.target.closest('tr').querySelector('.cc-recibo-aplicar');
                input.disabled = !event.target.checked; if (!event.target.checked) input.value = '0.00';
            }
            actualizarResumenRecibo();
        });
    }
    function inicializar() {
        if (inicializada) return;
        inicializada = true; enlazarEventos(); mostrarCarga();
        cargarClientes().then(cargarCuenta).catch(mostrarError);
    }
    window.CuentaCorrienteUI = { inicializar: inicializar };
})(window, document);
