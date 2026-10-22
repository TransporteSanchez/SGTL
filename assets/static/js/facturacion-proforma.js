(function (window, document) {
    'use strict';

    var API = 'http://localhost:50222/api';
    var estado = null;
    var vencimientoEditado = false;

    function porId(id) { return document.getElementById(id); }

    function token() {
        try { return localStorage.getItem('token') || ''; } catch (e) { return ''; }
    }

    function encabezados(conContenido) {
        var result = { Accept: 'application/json' };
        if (conContenido) result['Content-Type'] = 'application/json';
        var jwt = token();
        if (jwt) result.Authorization = 'Bearer ' + jwt;
        return result;
    }

    function leerRespuesta(respuesta) {
        return respuesta.json().catch(function () { return {}; }).then(function (json) {
            return { ok: respuesta.ok, status: respuesta.status, json: json };
        });
    }

    function mensajeError(respuesta, alternativo) {
        var json = respuesta && respuesta.json ? respuesta.json : {};
        if (json.errores && json.errores.length) return json.errores.join('\n');
        if (json.error) return json.error;
        if (respuesta && respuesta.status === 401) return 'La sesión venció. Iniciá sesión nuevamente.';
        if (respuesta && respuesta.status === 403) return 'Tu usuario no tiene permiso para emitir Facturas.';
        return alternativo;
    }

    function dinero(valor) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency', currency: 'ARS', minimumFractionDigits: 2
        }).format(Number(valor || 0));
    }

    function hoyIso() {
        var ahora = new Date();
        var local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
        return local.toISOString().substring(0, 10);
    }

    function normalizarFecha(valor) {
        return valor ? String(valor).substring(0, 10) : '';
    }

    function sumarDiasAFechaIso(fechaIso, dias) {
        var partes = String(fechaIso || '').split('-');
        if (partes.length !== 3) return '';
        var fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        if (isNaN(fecha.getTime())) return '';
        fecha.setDate(fecha.getDate() + dias);
        var local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
        return normalizarFecha(local.toISOString());
    }

    function actualizarVencimientoPredeterminado() {
        if (vencimientoEditado) return;
        ponerFecha('facFechaVencimiento', sumarDiasAFechaIso(porId('facFechaEmision').value, 10));
    }

    function nuevaClave() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 3 | 8)).toString(16);
        });
    }

    // Fechas con el calendario del sistema (§7.1): se ven DD/MM/AAAA y el campo guarda AAAA-MM-DD.
    // Sin SGTL (por ejemplo, en los tests) el campo queda como texto y se usa su valor directo.
    function prepararFecha(id) {
        var campo = porId(id);
        if (campo && !campo._flatpickr && window.SGTL && window.SGTL.selectorFecha) {
            window.SGTL.selectorFecha(campo, { dateFormat: 'Y-m-d', altInput: true, altFormat: 'd/m/Y' });
        }
    }

    function ponerFecha(id, valor) {
        var campo = porId(id);
        if (campo._flatpickr) { if (valor) campo._flatpickr.setDate(valor, false); else campo._flatpickr.clear(false); }
        else campo.value = valor || '';
    }

    function limitarFecha(id, limite, valor) {
        var campo = porId(id);
        if (campo._flatpickr) campo._flatpickr.set(limite, valor || null);
        else campo[limite === 'minDate' ? 'min' : 'max'] = valor || '';
    }

    function crearModal() {
        if (porId('modalFacturarProforma')) return;
        var contenedor = document.createElement('div');
        contenedor.innerHTML =
            '<div class="modal fade" id="modalFacturarProforma" tabindex="-1" aria-hidden="true">' +
                '<div class="modal-dialog modal-xl modal-dialog-scrollable sgtl-modal-formulario"><div class="modal-content">' +
                    '<div class="modal-header"><div><h5 class="modal-title mb-0">Emitir factura</h5>' +
                        '<small class="text-muted" id="facProformaNumero">Comprobando disponibilidad…</small></div>' +
                        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
                    '<div class="modal-body">' +
                        '<div id="facMensaje" class="alert alert-info mb-3">Validando la proforma…</div>' +
                        '<div id="facFormulario" class="row g-3">' +
                            '<div class="col-md-3"><label class="form-label">Tipo de comprobante</label>' +
                                '<input id="facTipoComprobante" class="form-control" readonly></div>' +
                            '<div class="col-md-3"><label class="form-label">Letra</label>' +
                                '<select id="facLetra" class="form-select"></select></div>' +
                            '<div class="col-md-3"><label class="form-label">Sucursal</label>' +
                                '<select id="facSucursal" class="form-select"></select></div>' +
                            '<div class="col-md-3"><label class="form-label">N° comprobante</label>' +
                                '<input id="facNumeroComprobante" class="form-control" readonly></div>' +
                            '<div class="col-md-4"><label class="form-label">Total a facturar</label>' +
                                '<input id="facTotal" class="form-control text-end fw-bold" readonly></div>' +
                            '<div class="col-md-4"><label class="form-label">Fecha de emisión</label>' +
                                '<input id="facFechaEmision" class="form-control" placeholder="DD/MM/AAAA"></div>' +
                            '<div class="col-md-4"><label class="form-label">Fecha de vencimiento</label>' +
                                '<input id="facFechaVencimiento" class="form-control" placeholder="DD/MM/AAAA"></div>' +
                            '<div class="col-12"><label class="form-label">Observaciones de la factura</label>' +
                                '<textarea id="facObservaciones" class="form-control" rows="3" maxlength="2000"></textarea></div>' +
                        '</div>' +
                        '<div id="facResultado" class="alert alert-success mt-3 d-none"></div>' +
                    '</div>' +
                    '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cerrar</button>' +
                        '<button type="button" class="btn btn-primary" id="btnConfirmarFactura" disabled>' +
                            '<i class="bi bi-receipt me-1"></i>Emitir factura</button></div>' +
                '</div></div>' +
            '</div>';
        document.body.appendChild(contenedor.firstElementChild);
        prepararFecha('facFechaEmision');
        prepararFecha('facFechaVencimiento');
        porId('btnConfirmarFactura').addEventListener('click', emitir);
        porId('facFechaEmision').addEventListener('change', actualizarVencimientoPredeterminado);
        porId('facFechaVencimiento').addEventListener('change', function () { vencimientoEditado = true; });
    }

    function mostrarModal() {
        var elemento = porId('modalFacturarProforma');
        if (window.bootstrap && bootstrap.Modal) bootstrap.Modal.getOrCreateInstance(elemento).show();
        else if (window.jQuery) window.jQuery(elemento).modal('show');
    }

    function ocultarMensajeClases() {
        var mensaje = porId('facMensaje');
        mensaje.className = 'alert mb-3';
    }

    function mostrarMensaje(texto, tipo) {
        var mensaje = porId('facMensaje');
        ocultarMensajeClases();
        mensaje.classList.add('alert-' + (tipo || 'info'));
        mensaje.textContent = texto;
    }

    function prepararModal(id, alCompletar) {
        estado = {
            proformaId: Number(id),
            version: null,
            claveOperacion: nuevaClave(),
            alCompletar: typeof alCompletar === 'function' ? alCompletar : null,
            enviando: false,
            configuracionLista: false
        };
        porId('facProformaNumero').textContent = 'Proforma #' + id;
        porId('facTotal').value = '';
        limitarFecha('facFechaEmision', 'maxDate', hoyIso());
        ponerFecha('facFechaEmision', hoyIso());
        vencimientoEditado = false;
        actualizarVencimientoPredeterminado();
        porId('facObservaciones').value = '';
        porId('facResultado').classList.add('d-none');
        porId('facResultado').textContent = '';
        porId('btnConfirmarFactura').disabled = true;
        porId('btnConfirmarFactura').classList.remove('d-none');
        porId('facFormulario').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = false; });
        porId('facTipoComprobante').readOnly = true;
        porId('facNumeroComprobante').readOnly = true;
        mostrarMensaje('Validando la proforma…', 'info');
    }

    function abrir(id, alCompletar) {
        crearModal();
        prepararModal(id, alCompletar);
        mostrarModal();
        if (!token()) {
            mostrarMensaje('Tu sesión venció. Volvé a iniciar sesión para facturar.', 'danger');
            return;
        }
        var configuracion = window.ConfiguracionFacturacion && window.ConfiguracionFacturacion.cargar
            ? window.ConfiguracionFacturacion.cargar('FAC', {
                tipo: 'facTipoComprobante', letra: 'facLetra', sucursal: 'facSucursal', numero: 'facNumeroComprobante'
            })
            : Promise.reject(new Error('No se cargó la configuración de Facturación.'));
        var proforma = fetch(API + '/proformas/' + encodeURIComponent(id) + '/facturacion', {
            method: 'GET', headers: encabezados(false)
        }).then(leerRespuesta);
        Promise.all([configuracion, proforma]).then(function (resultados) {
            var respuesta = resultados[1];
            if (!respuesta.ok) {
                mostrarMensaje(mensajeError(respuesta, 'No se pudo validar la proforma.'), 'danger');
                return;
            }
            var datos = respuesta.json;
            porId('facProformaNumero').textContent = 'Proforma ' + (datos.Numero || ('#' + datos.ProformaID));
            porId('facTotal').value = dinero(datos.TotalCalculado);
            estado.version = datos.VersionProforma;
            var emision = hoyIso();
            ponerFecha('facFechaEmision', emision);
            vencimientoEditado = false;
            actualizarVencimientoPredeterminado();
            if (!datos.Facturable) {
                var texto = datos.MotivoBloqueo || 'La proforma no se puede facturar.';
                if (datos.FacturaVigente && datos.FacturaVigente.Numero)
                    texto += ' Factura vigente: ' + datos.FacturaVigente.Numero + '.';
                mostrarMensaje(texto, 'warning');
                return;
            }
            mostrarMensaje('La proforma está lista. Revisá las fechas antes de emitir la factura.', 'success');
            estado.configuracionLista = true;
            porId('btnConfirmarFactura').disabled = false;
        }).catch(function (ex) {
            mostrarMensaje('No se pudo conectar con la facturación. Revisá la conexión y probá de nuevo.', 'danger');
        });
    }

    function emitir() {
        if (!estado || estado.enviando || !estado.version || !estado.configuracionLista) return;
        var fechaEmision = porId('facFechaEmision').value;
        var fechaVencimiento = porId('facFechaVencimiento').value;
        if (!fechaEmision || !fechaVencimiento) {
            mostrarMensaje('Completá la fecha de emisión y la fecha de vencimiento.', 'warning');
            return;
        }
        if (fechaVencimiento < fechaEmision) {
            mostrarMensaje('El vencimiento no puede ser anterior a la emisión.', 'warning');
            return;
        }
        estado.enviando = true;
        var boton = porId('btnConfirmarFactura');
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Emitiendo…';
        var solicitud = {
            ClaveOperacion: estado.claveOperacion,
            VersionProforma: estado.version,
            FechaEmision: fechaEmision,
            FechaVencimiento: fechaVencimiento,
            Letra: porId('facLetra').value || null,
            Sucursal: porId('facSucursal').value || null,
            Observaciones: porId('facObservaciones').value.trim() || null
        };
        fetch(API + '/facturas/desde-proforma/' + encodeURIComponent(estado.proformaId), {
            method: 'POST', headers: encabezados(true), body: JSON.stringify(solicitud)
        }).then(leerRespuesta).then(function (respuesta) {
            estado.enviando = false;
            boton.innerHTML = '<i class="bi bi-receipt me-1"></i>Emitir factura';
            if (!respuesta.ok) {
                boton.disabled = false;
                mostrarMensaje(mensajeError(respuesta, 'No se pudo emitir la factura.'),
                    respuesta.status === 409 ? 'warning' : 'danger');
                return;
            }
            var factura = respuesta.json;
            mostrarMensaje('Factura emitida.', 'success');
            porId('facFormulario').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = true; });
            boton.classList.add('d-none');
            var resultado = porId('facResultado');
            resultado.classList.remove('d-none');
            resultado.innerHTML = '<strong>' + String(factura.Numero || 'Factura emitida') + '</strong> · ' +
                dinero(factura.Total) + '<br><a class="alert-link" href="cuenta-corriente-clientes.html?clienteId=' +
                encodeURIComponent(factura.ClienteID) + '">Ver la cuenta corriente del cliente</a>' +
                '<div class="mt-3 d-flex flex-wrap gap-2">' +
                    '<button type="button" class="btn btn-sm btn-outline-secondary" id="facImprimirFactura">' +
                        '<i class="bi bi-printer me-1"></i>Imprimir</button>' +
                    '<button type="button" class="btn btn-sm btn-primary" id="facDescargarFactura">' +
                        '<i class="bi bi-file-earmark-pdf me-1"></i>Descargar PDF</button>' +
                '</div>';
            porId('facImprimirFactura').addEventListener('click', function () {
                if (window.imprimirFacturaPDF) window.imprimirFacturaPDF(factura.ComprobanteID);
            });
            porId('facDescargarFactura').addEventListener('click', function () {
                if (window.descargarFacturaPDF) window.descargarFacturaPDF(factura.ComprobanteID);
            });
            if (estado.alCompletar) estado.alCompletar(factura);
        }).catch(function () {
            estado.enviando = false;
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-receipt me-1"></i>Emitir factura';
            mostrarMensaje('No se pudo emitir por un problema de conexión. Podés reintentar: la factura no se duplica.', 'danger');
        });
    }

    window.FacturacionProforma = { abrir: abrir };
})(window, document);
