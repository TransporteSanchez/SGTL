(function (window, document) {
    'use strict';

    var API = 'http://localhost:50222/api';
    var inicializada = false;
    var vistaActual = 'movimientos';
    var clientes = [];
    var resumen = null;
    var movimientos = [];
    var pendientes = [];
    var comprobanteActualId = null;
    var reciboOperacion = null;
    var comprobanteOperacion = null;
    var comprobanteTipo = null;
    var facturasReferencia = [];
    var ivaComprobanteFijo = null;

    function porId(id) { return document.getElementById(id); }
    function token() {
        try { return localStorage.getItem('token') || ''; } catch (e) { return ''; }
    }
    function fechaIsoLocal(fechaValor) {
        var fecha = fechaValor || new Date();
        var local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
        return local.toISOString().substring(0, 10);
    }
    function hoyIso() { return fechaIsoLocal(new Date()); }
    function establecerRangoUltimos30Dias() {
        var hasta = new Date();
        var desde = new Date(hasta.getTime());
        desde.setDate(desde.getDate() - 30);
        porId('ccDesde').value = fechaIsoLocal(desde);
        porId('ccHasta').value = fechaIsoLocal(hasta);
        porId('ccDesde').max = fechaIsoLocal(hasta);
        porId('ccHasta').max = fechaIsoLocal(hasta);
    }
    function nuevaClave() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 3 | 8)).toString(16);
        });
    }
    function centavos(valor) { return Math.round(Number(valor || 0) * 100); }
    function escapar(valor) {
        return String(valor == null ? '' : valor).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function apiGet(ruta) {
        var headers = { Accept: 'application/json' };
        if (token()) headers.Authorization = 'Bearer ' + token();
        return fetch(API + ruta, { headers: headers }).then(function (respuesta) {
            if (!respuesta.ok) return respuesta.json().catch(function () { return {}; }).then(function (error) {
                throw new Error(error.error || error.Message || 'No se pudo consultar el servidor.');
            });
            return respuesta.json();
        });
    }
    function apiPost(ruta, datos) {
        var jwt = token();
        return fetch(API + ruta, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt },
            body: JSON.stringify(datos)
        }).then(function (respuesta) {
            return respuesta.json().catch(function () { return {}; }).then(function (json) {
                if (!respuesta.ok) {
                    var error = new Error(json.error || json.Message || 'No se pudo completar la operación.');
                    error.status = respuesta.status;
                    throw error;
                }
                return json;
            });
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
            } else {
                var clienteUrl = Number(new URLSearchParams(window.location.search).get('clienteId') || 0);
                if (clientes.some(function (item) { return item.ClienteID === clienteUrl; })) select.value = String(clienteUrl);
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
        porId('ccTablaCabecera').innerHTML = '<tr><th class="cc-toggle-column"><span class="visually-hidden">Desplegar</span></th>' +
            '<th>Fecha</th><th>Comprobante</th><th>Concepto</th><th class="text-end">Total</th>' +
            '<th class="text-end">Cancelado</th><th class="text-end">Saldo</th>' +
            '<th>Estado</th><th class="text-center">Acciones</th></tr>';
        if (!movimientos.length) {
            porId('ccTablaCuerpo').innerHTML = '<tr><td colspan="9" class="cc-empty">No hay comprobantes para los filtros seleccionados.</td></tr>';
            return;
        }
        porId('ccTablaCuerpo').innerHTML = movimientos.map(function (item) {
            var aplicaciones = item.Aplicaciones || [];
            var control = aplicaciones.length
                ? '<button type="button" class="btn btn-sm btn-link cc-toggle-applications" data-parent="' + Number(item.ComprobanteID) +
                    '" aria-expanded="false" aria-label="Mostrar comprobantes aplicados a ' + escapar(item.Comprobante) +
                    '"><i class="bi bi-chevron-down"></i></button>'
                : '';
            var filaPrincipal = '<tr class="cc-parent-row"><td class="text-center">' + control + '</td><td>' + fecha(item.Fecha) +
                '</td><td class="cc-document">' + escapar(item.Comprobante) + '</td><td>' + escapar(item.Concepto) +
                '</td><td class="cc-money">' + dinero(item.Debe) + '</td><td class="cc-money cc-credit">' +
                dinero(item.Cancelado) + '</td><td class="cc-money cc-debit fw-bold">' + dinero(item.Saldo) +
                '</td><td>' + badgeEstado(item.Estado) + '</td><td class="text-center">' +
                botonDetalle(item.ComprobanteID, item.Comprobante) + '</td></tr>';
            var saldoProgresivo = Number(item.Debe || 0);
            var filasAplicaciones = aplicaciones.map(function (aplicacion) {
                saldoProgresivo = Math.max(0, saldoProgresivo - Number(aplicacion.Importe || 0));
                aplicacion.Saldo = saldoProgresivo;
                return '<tr class="cc-application-row d-none" data-parent="' + Number(item.ComprobanteID) + '">' +
                    '<td></td><td>' + fecha(aplicacion.Fecha) + '</td><td class="cc-document cc-application-document">' +
                    '<i class="bi bi-arrow-return-right me-2" aria-hidden="true"></i>' + escapar(aplicacion.Comprobante) +
                    '</td><td>' + escapar(aplicacion.Concepto || 'Aplicación a ' + item.Comprobante) + '</td>' +
                    '<td class="cc-money">—</td><td class="cc-money cc-credit">' + dinero(aplicacion.Importe) +
                    '</td><td class="cc-money fw-bold">' + dinero(saldoProgresivo) + '</td><td>' +
                    badgeEstado(aplicacion.Estado || 'Aplicado') + '</td><td class="text-center">' +
                    botonDetalle(aplicacion.ComprobanteID, aplicacion.Comprobante) + '</td></tr>';
            }).join('');
            return filaPrincipal + filasAplicaciones;
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
            porId('ccTablaCuerpo').innerHTML = '<tr><td colspan="9" class="cc-empty">No hay comprobantes sin relacionar para los filtros seleccionados.</td></tr>';
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
        var principal = movimientos.find(function (item) { return item.ComprobanteID === id; });
        if (principal) return principal;
        for (var indice = 0; indice < movimientos.length; indice += 1) {
            var padre = movimientos[indice];
            var aplicacion = (padre.Aplicaciones || []).find(function (item) { return item.ComprobanteID === id; });
            if (aplicacion) {
                return Object.assign({}, aplicacion, {
                    Haber: aplicacion.Importe,
                    Origen: 'Aplicado a ' + padre.Comprobante
                });
            }
        }
        return pendientes.find(function (item) { return item.ComprobanteID === id; });
    }
    function abrirDetalle(id) {
        var item = buscarComprobante(Number(id));
        if (!item) return;
        comprobanteActualId = Number(id);
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
        var esFactura = item.Tipo === 'FAC' || String(item.Comprobante || '').indexOf('FAC-') === 0;
        porId('btnImprimirFactura').classList.toggle('d-none', !esFactura);
        porId('btnDescargarFactura').classList.toggle('d-none', !esFactura);
        bootstrap.Modal.getOrCreateInstance(porId('modalDetalleComprobante')).show();
    }

    function cargarFacturasRecibo() {
        var cliente = clienteActual();
        var facturasPendientes = pendientes.filter(function (item) { return item.Tipo === 'FAC'; });
        porId('reciboCliente').value = cliente ? cliente.RazonSocial + ' — ' + cliente.CUIT : '';
        porId('reciboFacturas').innerHTML = facturasPendientes.map(function (item) {
            return '<tr><td><input type="checkbox" class="form-check-input cc-recibo-check" data-id="' + Number(item.ComprobanteID) + '"></td>' +
                '<td class="cc-document">' + escapar(item.Comprobante) + '</td><td>' + fecha(item.FechaVencimiento) + '</td>' +
                '<td class="text-end">' + dinero(item.ImporteOriginal) + '</td><td class="text-end fw-bold">' + dinero(item.SaldoPendiente) + '</td>' +
                '<td class="text-end"><input type="number" min="0" step="0.01" class="form-control form-control-sm text-end cc-allocation-input cc-recibo-aplicar" ' +
                'data-id="' + Number(item.ComprobanteID) + '" data-pendiente="' + Number(item.SaldoPendiente) + '" disabled value="0.00"></td></tr>';
        }).join('') || '<tr><td colspan="6" class="cc-empty">El cliente no tiene Facturas pendientes.</td></tr>';
        actualizarResumenRecibo();
    }
    function actualizarResumenRecibo() {
        var aplicado = 0;
        document.querySelectorAll('.cc-recibo-aplicar').forEach(function (input) {
            if (!input.disabled) aplicado += Number(input.value || 0);
        });
        porId('reciboTotal').value = aplicado.toFixed(2);
        porId('reciboFormaImporte').value = aplicado.toFixed(2);
        porId('reciboResumenTotal').textContent = dinero(aplicado);
        porId('reciboResumenAplicado').textContent = dinero(aplicado);
        porId('reciboResumenDiferencia').textContent = dinero(0);
    }
    function abrirNuevoRecibo() {
        reciboOperacion = nuevaClave();
        porId('reciboFecha').max = hoyIso();
        porId('reciboFecha').value = hoyIso();
        porId('reciboTotal').value = '0.00';
        porId('reciboFormaPago').value = 'Transferencia';
        porId('reciboReferencia').value = '';
        porId('reciboFormaImporte').value = '0.00';
        porId('reciboObservaciones').value = '';
        porId('reciboError').textContent = '';
        var mensaje = porId('reciboMensaje');
        mensaje.className = 'alert alert-info py-2';
        mensaje.innerHTML = '<i class="bi bi-info-circle me-2"></i>Seleccioná las Facturas. El importe se completará automáticamente con el saldo pendiente.';
        porId('modalNuevoRecibo').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = false; });
        porId('reciboTotal').readOnly = true;
        porId('reciboFormaImporte').readOnly = true;
        var boton = porId('btnEmitirRecibo');
        boton.classList.remove('d-none'); boton.disabled = false;
        boton.innerHTML = '<i class="bi bi-check-circle me-1"></i>Emitir recibo';
        cargarFacturasRecibo();
        bootstrap.Modal.getOrCreateInstance(porId('modalNuevoRecibo')).show();
    }
    function aplicacionesRecibo() {
        var aplicaciones = [];
        document.querySelectorAll('#reciboFacturas tr').forEach(function (fila) {
            var check = fila.querySelector('.cc-recibo-check');
            var input = fila.querySelector('.cc-recibo-aplicar');
            if (check && input && check.checked && centavos(input.value) > 0) {
                aplicaciones.push({ ComprobanteID: Number(input.getAttribute('data-id')), Importe: centavos(input.value) / 100 });
            }
        });
        return aplicaciones;
    }
    function emitirRecibo() {
        var cliente = clienteActual();
        var error = porId('reciboError');
        error.textContent = '';
        if (!token()) { error.textContent = 'La sesión venció. Iniciá sesión nuevamente.'; return; }
        if (!cliente) { error.textContent = 'Seleccioná un cliente.'; return; }
        var fechaRecibo = porId('reciboFecha').value;
        var total = centavos(porId('reciboTotal').value);
        var importeForma = centavos(porId('reciboFormaImporte').value);
        var aplicaciones = aplicacionesRecibo();
        var aplicado = aplicaciones.reduce(function (suma, item) { return suma + centavos(item.Importe); }, 0);
        var forma = porId('reciboFormaPago').value;
        var referencia = porId('reciboReferencia').value.trim();
        if (!fechaRecibo) { error.textContent = 'Completá la fecha del Recibo.'; return; }
        if (fechaRecibo > hoyIso()) { error.textContent = 'La fecha del Recibo no puede ser futura.'; return; }
        if (total <= 0) { error.textContent = 'Ingresá un importe mayor que cero.'; return; }
        if (importeForma !== total) { error.textContent = 'La forma de pago debe coincidir con el total del Recibo.'; return; }
        var excedePendiente = Array.prototype.some.call(document.querySelectorAll('.cc-recibo-aplicar'), function (input) {
            return !input.disabled && centavos(input.value) > centavos(input.getAttribute('data-pendiente'));
        });
        if (excedePendiente) { error.textContent = 'Un importe aplicado supera el saldo pendiente del comprobante.'; return; }
        if (!aplicaciones.length || aplicado !== total) { error.textContent = 'El total aplicado debe coincidir con el total del Recibo.'; return; }
        if ((forma === 'Transferencia' || forma === 'Cheque') && !referencia) {
            error.textContent = 'Ingresá la referencia de la transferencia o del cheque.'; return;
        }

        var boton = porId('btnEmitirRecibo');
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Emitiendo…';
        apiPost('/recibos', {
            ClaveOperacion: reciboOperacion,
            ClienteID: cliente.ClienteID,
            Fecha: fechaRecibo,
            Total: total / 100,
            FormaPago: forma,
            Referencia: referencia || null,
            ImporteFormaPago: importeForma / 100,
            Observaciones: porId('reciboObservaciones').value.trim() || null,
            Aplicaciones: aplicaciones
        }).then(function (recibo) {
            var mensaje = porId('reciboMensaje');
            mensaje.className = 'alert alert-success py-2';
            mensaje.textContent = (recibo.Numero || 'Recibo emitido') + ' registrado correctamente por ' + dinero(recibo.Total) + '.';
            porId('modalNuevoRecibo').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = true; });
            boton.classList.add('d-none');
            reciboOperacion = null;
            cargarCuenta();
        }).catch(function (ex) {
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-check-circle me-1"></i>Emitir recibo';
            if (ex.status === 401) error.textContent = 'La sesión venció. Iniciá sesión nuevamente.';
            else if (ex.status === 403) error.textContent = 'Tu usuario no tiene permiso para emitir Recibos.';
            else error.textContent = ex.message || 'No se pudo emitir el Recibo.';
        });
    }
    function nombreTipoComprobante(tipo) {
        if (tipo === 'FAC') return 'Factura directa';
        if (tipo === 'NC') return 'Nota de Crédito';
        return 'Nota de Débito';
    }
    function recalcularComprobante() {
        var neto = centavos(porId('cmpNeto').value);
        var porcentaje = Number(porId('cmpIvaPct').value || 0);
        var iva = ivaComprobanteFijo == null ? Math.round(neto * porcentaje / 100) : ivaComprobanteFijo;
        var otros = centavos(porId('cmpOtros').value);
        porId('cmpIvaImporte').value = (iva / 100).toFixed(2);
        porId('cmpTotal').textContent = dinero((neto + iva + otros) / 100);
        return { neto: neto, iva: iva, otros: otros, total: neto + iva + otros };
    }
    function aplicarImportesFacturaReferencia() {
        var id = Number(porId('cmpReferencia').value || 0);
        var factura = facturasReferencia.find(function (item) { return item.ComprobanteID === id; });
        if (!factura) {
            ivaComprobanteFijo = null;
            porId('cmpNeto').value = '0.00';
            porId('cmpOtros').value = '0.00';
            recalcularComprobante();
            return;
        }

        porId('cmpNeto').value = Number(factura.NetoPendiente || 0).toFixed(2);
        porId('cmpOtros').value = Number(factura.OtrosImpuestosPendiente || 0).toFixed(2);
        ivaComprobanteFijo = centavos(factura.IVAPendiente);
        var selectorIva = porId('cmpIvaPct');
        selectorIva.querySelectorAll('.cc-iva-factura').forEach(function (opcion) { opcion.remove(); });
        var porcentaje = String(Number(factura.IvaPct || 0));
        var opcionExistente = Array.prototype.find.call(selectorIva.options, function (opcion) {
            return opcion.value === porcentaje;
        });
        if (!opcionExistente) {
            selectorIva.insertAdjacentHTML('beforeend', '<option class="cc-iva-factura" value="' +
                escapar(porcentaje) + '">IVA factura (' + escapar(porcentaje.replace('.', ',')) + '%)</option>');
        }
        selectorIva.value = porcentaje;
        recalcularComprobante();
    }
    function cargarFacturasReferencia(tipo, clienteId) {
        var grupo = porId('cmpReferenciaGrupo');
        facturasReferencia = [];
        if (tipo !== 'NC') {
            grupo.classList.add('d-none');
            porId('cmpReferencia').innerHTML = '';
            return Promise.resolve();
        }
        grupo.classList.remove('d-none');
        porId('cmpReferenciaEtiqueta').textContent = 'Factura relacionada *';
        porId('cmpReferenciaAyuda').textContent = 'Neto, IVA y otros impuestos se completarán según el saldo de la Factura.';
        porId('cmpReferencia').innerHTML = '<option value="">Cargando Facturas…</option>';
        porId('btnEmitirComprobante').disabled = true;
        return apiGet('/clientes/' + clienteId + '/facturas-referencia').then(function (facturas) {
            facturasReferencia = facturas.filter(function (item) { return centavos(item.SaldoPendiente) > 0; });
            porId('cmpReferencia').innerHTML = facturasReferencia.map(function (item) {
                return '<option value="' + Number(item.ComprobanteID) + '" data-pendiente="' + centavos(item.SaldoPendiente) + '">' +
                    escapar(item.Numero) + ' · ' + fecha(item.FechaEmision) + ' · Saldo ' + dinero(item.SaldoPendiente) + '</option>';
            }).join('');
            if (!facturasReferencia.length) {
                porId('cmpReferencia').innerHTML = '<option value="">No hay Facturas con saldo pendiente</option>';
                porId('cmpMensaje').className = 'alert alert-warning py-2';
                porId('cmpMensaje').textContent = 'El cliente no tiene Facturas disponibles para emitir una Nota de Crédito.';
                porId('btnEmitirComprobante').disabled = true;
                aplicarImportesFacturaReferencia();
                return;
            }
            aplicarImportesFacturaReferencia();
            porId('btnEmitirComprobante').disabled = false;
        });
    }
    function abrirNuevoComprobante(tipo) {
        var cliente = clienteActual();
        if (!cliente) { window.alert('Seleccioná un cliente.'); return; }
        comprobanteTipo = tipo;
        comprobanteOperacion = nuevaClave();
        var hoy = hoyIso();
        porId('cmpTitulo').textContent = 'Nueva ' + nombreTipoComprobante(tipo);
        porId('cmpCliente').value = cliente.RazonSocial + ' — ' + cliente.CUIT;
        porId('cmpFechaEmision').value = hoy; porId('cmpFechaEmision').max = hoy;
        porId('cmpFechaVencimiento').value = hoy;
        porId('cmpVencimientoGrupo').classList.toggle('d-none', tipo === 'NC');
        porId('cmpConcepto').value = '';
        porId('cmpIvaPct').querySelectorAll('.cc-iva-factura').forEach(function (opcion) { opcion.remove(); });
        porId('cmpNeto').value = '0.00'; porId('cmpIvaPct').value = '21'; porId('cmpOtros').value = '0.00';
        ivaComprobanteFijo = null;
        porId('cmpObservaciones').value = ''; porId('cmpError').textContent = '';
        var mensaje = porId('cmpMensaje');
        mensaje.className = 'alert alert-info py-2';
        mensaje.textContent = tipo === 'NC'
            ? 'Seleccioná la Factura que recibirá la Nota de Crédito.'
            : 'Completá los datos para emitir la ' + nombreTipoComprobante(tipo) + '.';
        porId('modalNuevoComprobante').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = false; });
        porId('cmpCliente').readOnly = true; porId('cmpIvaImporte').readOnly = true;
        porId('cmpNeto').readOnly = tipo === 'NC';
        porId('cmpOtros').readOnly = tipo === 'NC';
        porId('cmpIvaPct').disabled = tipo === 'NC';
        var boton = porId('btnEmitirComprobante');
        boton.classList.remove('d-none'); boton.disabled = false;
        boton.innerHTML = '<i class="bi bi-check-circle me-1"></i>Emitir ' + (tipo === 'FAC' ? 'Factura' : tipo);
        recalcularComprobante();
        cargarFacturasReferencia(tipo, cliente.ClienteID).catch(function (ex) {
            porId('cmpError').textContent = ex.message || 'No se pudieron cargar las Facturas de referencia.';
            boton.disabled = true;
        });
        bootstrap.Modal.getOrCreateInstance(porId('modalNuevoComprobante')).show();
    }
    function emitirComprobante() {
        var cliente = clienteActual();
        var error = porId('cmpError');
        error.textContent = '';
        if (!token()) { error.textContent = 'La sesión venció. Iniciá sesión nuevamente.'; return; }
        if (!cliente || !comprobanteTipo) { error.textContent = 'No se pudo determinar el cliente o el tipo de comprobante.'; return; }
        var emision = porId('cmpFechaEmision').value;
        var vencimiento = comprobanteTipo === 'NC' ? null : porId('cmpFechaVencimiento').value;
        var referencia = comprobanteTipo === 'NC' && porId('cmpReferencia').value
            ? Number(porId('cmpReferencia').value) : null;
        var concepto = porId('cmpConcepto').value.trim();
        var importes = recalcularComprobante();
        if (!emision) { error.textContent = 'Completá la fecha de emisión.'; return; }
        if (emision > hoyIso()) { error.textContent = 'La fecha de emisión no puede ser futura.'; return; }
        if (comprobanteTipo !== 'NC' && (!vencimiento || vencimiento < emision)) {
            error.textContent = 'El vencimiento debe ser igual o posterior a la emisión.'; return;
        }
        if (comprobanteTipo === 'NC' && !referencia) { error.textContent = 'Seleccioná la Factura relacionada.'; return; }
        if (!concepto) { error.textContent = 'Ingresá el concepto del comprobante.'; return; }
        if (importes.neto <= 0) { error.textContent = 'El importe neto debe ser mayor que cero.'; return; }
        if (importes.otros < 0) { error.textContent = 'Otros impuestos no puede ser negativo.'; return; }
        if (comprobanteTipo === 'NC') {
            var opcion = porId('cmpReferencia').selectedOptions[0];
            var pendiente = opcion ? Number(opcion.getAttribute('data-pendiente') || 0) : 0;
            if (importes.total !== pendiente) { error.textContent = 'Los importes deben coincidir con el saldo pendiente de la Factura.'; return; }
        }

        var boton = porId('btnEmitirComprobante');
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Emitiendo…';
        apiPost('/comprobantes', {
            ClaveOperacion: comprobanteOperacion, ClienteID: cliente.ClienteID, Tipo: comprobanteTipo,
            FechaEmision: emision, FechaVencimiento: vencimiento, ComprobanteReferenciaID: referencia,
            Concepto: concepto, Neto: importes.neto / 100, IvaPct: Number(porId('cmpIvaPct').value),
            IVA: comprobanteTipo === 'NC' ? importes.iva / 100 : null,
            OtrosImpuestos: importes.otros / 100, Observaciones: porId('cmpObservaciones').value.trim() || null
        }).then(function (comprobante) {
            var mensaje = porId('cmpMensaje');
            mensaje.className = 'alert alert-success py-2';
            mensaje.textContent = comprobante.Numero + ' emitido correctamente por ' + dinero(comprobante.Total) + '.';
            porId('modalNuevoComprobante').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = true; });
            boton.classList.add('d-none');
            comprobanteOperacion = null;
            cargarCuenta();
        }).catch(function (ex) {
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-check-circle me-1"></i>Emitir ' + (comprobanteTipo === 'FAC' ? 'Factura' : comprobanteTipo);
            if (ex.status === 401) error.textContent = 'La sesión venció. Iniciá sesión nuevamente.';
            else if (ex.status === 403) error.textContent = 'Tu usuario no tiene permiso para emitir este comprobante.';
            else error.textContent = ex.message || 'No se pudo emitir el comprobante.';
        });
    }
    function abrirAccionFutura(accion) {
        if (accion === 'Factura directa') { abrirNuevoComprobante('FAC'); return; }
        if (accion === 'Factura desde proforma') {
            window.location.href = 'gestion-facturacion.html?estado=Aceptada';
            return;
        }
        if (accion === 'Nota de crédito') { abrirNuevoComprobante('NC'); return; }
        if (accion === 'Nota de débito') { abrirNuevoComprobante('ND'); return; }
        porId('modalAccionFuturaTexto').textContent = 'La acción “' + accion + '” se habilitará al implementar su servicio transaccional.';
        bootstrap.Modal.getOrCreateInstance(porId('modalAccionFutura')).show();
    }
    function limpiarFiltros() {
        establecerRangoUltimos30Dias(); porId('ccTipo').value = '';
        porId('ccEstado').value = ''; porId('ccSoloPendientes').checked = false;
        cambiarVista('movimientos'); cargarCuenta();
    }
    function filasParaExportar() {
        if (vistaActual === 'pendientes') return pendientesFiltrados().map(function (item) {
            return [item.Comprobante, fecha(item.FechaEmision), fecha(item.FechaVencimiento), item.ImporteOriginal,
                item.ImporteAplicado, item.SaldoPendiente, item.Situacion, item.Estado];
        });
        return movimientos.reduce(function (filas, item) {
            filas.push(['Comprobante', fecha(item.Fecha), item.Comprobante, item.Concepto, item.Debe,
                item.Cancelado, item.Saldo, item.Estado]);
            var saldoProgresivo = Number(item.Debe || 0);
            (item.Aplicaciones || []).forEach(function (aplicacion) {
                saldoProgresivo = Math.max(0, saldoProgresivo - Number(aplicacion.Importe || 0));
                filas.push(['Aplicación', fecha(aplicacion.Fecha), aplicacion.Comprobante, aplicacion.Concepto,
                    '', aplicacion.Importe, saldoProgresivo, aplicacion.Estado || 'Aplicado']);
            });
            return filas;
        }, []);
    }
    function exportarCsv() {
        var cabecera = vistaActual === 'pendientes'
            ? ['Comprobante', 'Emisión', 'Vencimiento', 'Importe original', 'Aplicado', 'Saldo pendiente', 'Situación', 'Estado']
            : ['Nivel', 'Fecha', 'Comprobante', 'Concepto', 'Total', 'Cancelado', 'Saldo', 'Estado'];
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
        porId('btnEmitirRecibo').addEventListener('click', emitirRecibo);
        porId('btnEmitirComprobante').addEventListener('click', emitirComprobante);
        porId('cmpNeto').addEventListener('input', recalcularComprobante);
        porId('cmpIvaPct').addEventListener('change', recalcularComprobante);
        porId('cmpOtros').addEventListener('input', recalcularComprobante);
        porId('cmpReferencia').addEventListener('change', aplicarImportesFacturaReferencia);
        porId('btnExportarCuenta').addEventListener('click', exportarCsv);
        porId('btnImprimirFactura').addEventListener('click', function () {
            if (comprobanteActualId && window.imprimirFacturaPDF) window.imprimirFacturaPDF(comprobanteActualId);
        });
        porId('btnDescargarFactura').addEventListener('click', function () {
            if (comprobanteActualId && window.descargarFacturaPDF) window.descargarFacturaPDF(comprobanteActualId);
        });
        document.querySelectorAll('.cc-tab').forEach(function (tab) {
            tab.addEventListener('click', function () { cambiarVista(tab.getAttribute('data-view')); });
        });
        document.querySelectorAll('.cc-future-action').forEach(function (button) {
            button.addEventListener('click', function () { abrirAccionFutura(button.getAttribute('data-action')); });
        });
        porId('ccTablaCuerpo').addEventListener('click', function (event) {
            var desplegar = event.target.closest('.cc-toggle-applications');
            if (desplegar) {
                var parentId = desplegar.getAttribute('data-parent');
                var expandir = desplegar.getAttribute('aria-expanded') !== 'true';
                document.querySelectorAll('.cc-application-row[data-parent="' + parentId + '"]').forEach(function (fila) {
                    fila.classList.toggle('d-none', !expandir);
                });
                desplegar.setAttribute('aria-expanded', expandir ? 'true' : 'false');
                var icono = desplegar.querySelector('i');
                icono.classList.toggle('bi-chevron-down', !expandir);
                icono.classList.toggle('bi-chevron-up', expandir);
                desplegar.setAttribute('aria-label', (expandir ? 'Ocultar' : 'Mostrar') + ' comprobantes aplicados');
                return;
            }
            var boton = event.target.closest('.cc-ver-detalle'); if (boton) abrirDetalle(boton.getAttribute('data-id'));
        });
        porId('reciboFacturas').addEventListener('input', actualizarResumenRecibo);
        porId('reciboFacturas').addEventListener('change', function (event) {
            if (event.target.classList.contains('cc-recibo-check')) {
                var input = event.target.closest('tr').querySelector('.cc-recibo-aplicar');
                input.disabled = !event.target.checked;
                input.value = event.target.checked ? Number(input.getAttribute('data-pendiente')).toFixed(2) : '0.00';
            }
            actualizarResumenRecibo();
        });
    }
    function inicializar() {
        if (inicializada) return;
        inicializada = true; enlazarEventos(); mostrarCarga(); establecerRangoUltimos30Dias();
        porId('reciboFecha').value = hoyIso();
        cargarClientes().then(cargarCuenta).catch(mostrarError);
    }
    window.CuentaCorrienteUI = { inicializar: inicializar };
})(window, document);
