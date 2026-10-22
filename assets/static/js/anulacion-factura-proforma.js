(function (window, document) {
    'use strict';

    var API = 'http://localhost:50222/api';
    var estado = null;

    function porId(id) { return document.getElementById(id); }

    function token() {
        try { return localStorage.getItem('token') || ''; } catch (e) { return ''; }
    }

    function encabezados(conContenido) {
        var resultado = { Accept: 'application/json' };
        if (conContenido) resultado['Content-Type'] = 'application/json';
        var jwt = token();
        if (jwt) resultado.Authorization = 'Bearer ' + jwt;
        return resultado;
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
        if (respuesta && respuesta.status === 401) return 'La sesion vencio. Inicia sesion nuevamente.';
        if (respuesta && respuesta.status === 403) return 'Tu usuario no tiene permiso para emitir Notas de Credito.';
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

    function fechaIso(valor) { return valor ? String(valor).substring(0, 10) : ''; }

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
        if (porId('modalAnularFactura')) return;
        var contenedor = document.createElement('div');
        contenedor.innerHTML =
            '<div class="modal fade" id="modalAnularFactura" tabindex="-1" aria-hidden="true">' +
                '<div class="modal-dialog modal-lg"><div class="modal-content">' +
                    '<div class="modal-header"><div><h5 class="modal-title mb-0">Anular factura</h5>' +
                        '<small class="text-muted" id="ncProformaNumero">Comprobando la factura vinculada…</small></div>' +
                        '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
                    '<div class="modal-body">' +
                        '<div id="ncMensaje" class="alert alert-info mb-3">Validando la factura…</div>' +
                        '<div id="ncFormulario" class="row g-3">' +
                            '<div class="col-md-8"><label class="form-label">Cliente</label><input id="ncCliente" class="form-control" readonly></div>' +
                            '<div class="col-md-4"><label class="form-label">CUIT</label><input id="ncCuit" class="form-control" readonly></div>' +
                            '<div class="col-md-6"><label class="form-label">Factura a anular</label><input id="ncFactura" class="form-control" readonly></div>' +
                            '<div class="col-md-3"><label class="form-label">Fecha de la factura</label><input id="ncFechaFactura" class="form-control" readonly></div>' +
                            '<div class="col-md-3"><label class="form-label">Importe</label><input id="ncImporte" class="form-control text-end fw-bold" readonly></div>' +
                            '<div class="col-md-3"><label class="form-label">Tipo de comprobante</label><input id="ncTipoComprobante" class="form-control" readonly></div>' +
                            '<div class="col-md-3"><label class="form-label">Letra</label><select id="ncLetra" class="form-select"></select></div>' +
                            '<div class="col-md-3"><label class="form-label">Sucursal</label><select id="ncSucursal" class="form-select"></select></div>' +
                            '<div class="col-md-3"><label class="form-label">N° comprobante</label><input id="ncNumeroComprobante" class="form-control" readonly></div>' +
                            '<div class="col-md-4"><label class="form-label">Fecha de emisión</label><input id="ncFechaEmision" class="form-control" placeholder="DD/MM/AAAA"></div>' +
                            '<div class="col-md-8"><label class="form-label">Observaciones</label><input id="ncObservaciones" class="form-control" maxlength="2000" placeholder="Opcional"></div>' +
                        '</div>' +
                        '<div id="ncResultado" class="alert alert-success mt-3 d-none"></div>' +
                    '</div>' +
                    '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cerrar</button>' +
                        '<button type="button" class="btn btn-danger" id="btnConfirmarNC" disabled>' +
                            '<i class="bi bi-file-earmark-minus me-1"></i>Anular factura</button></div>' +
                '</div></div>' +
            '</div>';
        document.body.appendChild(contenedor.firstElementChild);
        prepararFecha('ncFechaEmision');
        porId('btnConfirmarNC').addEventListener('click', emitir);
    }

    function mostrarModal() {
        var elemento = porId('modalAnularFactura');
        if (window.bootstrap && bootstrap.Modal) bootstrap.Modal.getOrCreateInstance(elemento).show();
        else if (window.jQuery) window.jQuery(elemento).modal('show');
    }

    function mostrarMensaje(texto, tipo) {
        var mensaje = porId('ncMensaje');
        mensaje.className = 'alert mb-3 alert-' + (tipo || 'info');
        mensaje.textContent = texto;
    }

    function prepararModal(id, alCompletar) {
        estado = {
            proformaId: Number(id),
            claveOperacion: nuevaClave(),
            datos: null,
            enviando: false,
            configuracionLista: false,
            alCompletar: typeof alCompletar === 'function' ? alCompletar : null
        };
        porId('ncProformaNumero').textContent = 'Proforma #' + id;
        ['ncCliente', 'ncCuit', 'ncFactura', 'ncFechaFactura', 'ncImporte'].forEach(function (idCampo) {
            porId(idCampo).value = '';
        });
        limitarFecha('ncFechaEmision', 'maxDate', hoyIso());
        limitarFecha('ncFechaEmision', 'minDate', '');
        ponerFecha('ncFechaEmision', hoyIso());
        porId('ncObservaciones').value = '';
        porId('ncResultado').classList.add('d-none');
        porId('ncResultado').textContent = '';
        porId('btnConfirmarNC').disabled = true;
        porId('btnConfirmarNC').classList.remove('d-none');
        porId('ncFormulario').querySelectorAll('input,select').forEach(function (campo) { campo.disabled = false; });
        ['ncCliente', 'ncCuit', 'ncFactura', 'ncFechaFactura', 'ncImporte', 'ncTipoComprobante', 'ncNumeroComprobante']
            .forEach(function (idCampo) { porId(idCampo).readOnly = true; });
        mostrarMensaje('Validando la factura vinculada…', 'info');
    }

    function abrir(id, alCompletar) {
        crearModal();
        prepararModal(id, alCompletar);
        mostrarModal();
        if (!token()) {
            mostrarMensaje('Tu sesión venció. Volvé a iniciar sesión para anular la factura.', 'danger');
            return;
        }

        var configuracion = window.ConfiguracionFacturacion && window.ConfiguracionFacturacion.cargar
            ? window.ConfiguracionFacturacion.cargar('NC', {
                tipo: 'ncTipoComprobante', letra: 'ncLetra', sucursal: 'ncSucursal', numero: 'ncNumeroComprobante'
            })
            : Promise.reject(new Error('No se cargó la configuración de facturación.'));
        var factura = fetch(API + '/proformas/' + encodeURIComponent(id) + '/factura-cancelatoria', {
            method: 'GET', headers: encabezados(false)
        }).then(leerRespuesta);

        Promise.all([configuracion, factura]).then(function (resultados) {
            var respuesta = resultados[1];
            if (!respuesta.ok) {
                mostrarMensaje(mensajeError(respuesta, 'No se pudo validar la factura vinculada.'), 'danger');
                return;
            }
            var datos = respuesta.json;
            estado.datos = datos;
            porId('ncProformaNumero').textContent = 'Proforma ' + (datos.ProformaNumero || ('#' + datos.ProformaID));
            porId('ncCliente').value = datos.Cliente || '';
            porId('ncCuit').value = datos.CUIT || '';
            porId('ncFactura').value = datos.FacturaNumero || '';
            porId('ncFechaFactura').value = fechaIso(datos.FechaFactura);
            porId('ncImporte').value = dinero(datos.Total);
            limitarFecha('ncFechaEmision', 'minDate', fechaIso(datos.FechaFactura));
            if (porId('ncFechaEmision').value < fechaIso(datos.FechaFactura))
                ponerFecha('ncFechaEmision', fechaIso(datos.FechaFactura));

            if (!datos.Cancelable) {
                mostrarMensaje(datos.MotivoBloqueo || 'La factura no se puede anular por el total.', 'warning');
                return;
            }
            estado.configuracionLista = true;
            porId('btnConfirmarNC').disabled = false;
            mostrarMensaje('Se emite una nota de crédito por el total de la factura. El importe no se puede modificar.', 'warning');
        }).catch(function () {
            mostrarMensaje('No se pudo conectar con la facturación. Revisá la conexión y probá de nuevo.', 'danger');
        });
    }

    function emitir() {
        if (!estado || estado.enviando || !estado.datos || !estado.configuracionLista) return;
        var fechaEmision = porId('ncFechaEmision').value;
        if (!fechaEmision) {
            mostrarMensaje('Completá la fecha de emisión.', 'warning');
            return;
        }
        if (fechaEmision < fechaIso(estado.datos.FechaFactura)) {
            mostrarMensaje('La fecha de emisión no puede ser anterior a la de la factura.', 'warning');
            return;
        }

        estado.enviando = true;
        var boton = porId('btnConfirmarNC');
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Anulando…';
        var datos = estado.datos;
        var solicitud = {
            ClaveOperacion: estado.claveOperacion,
            ProformaID: estado.proformaId,
            ClienteID: datos.ClienteID,
            Tipo: 'NC',
            Letra: porId('ncLetra').value || null,
            Sucursal: porId('ncSucursal').value || null,
            FechaEmision: fechaEmision,
            ComprobanteReferenciaID: datos.FacturaID,
            Concepto: 'Nota de crédito cancelatoria de ' + (datos.FacturaNumero || 'la factura'),
            Neto: datos.Neto,
            IvaPct: datos.IvaPct,
            IVA: datos.IVA,
            OtrosImpuestos: datos.OtrosImpuestos,
            Observaciones: porId('ncObservaciones').value.trim() || null
        };
        fetch(API + '/comprobantes', {
            method: 'POST', headers: encabezados(true), body: JSON.stringify(solicitud)
        }).then(leerRespuesta).then(function (respuesta) {
            estado.enviando = false;
            boton.innerHTML = '<i class="bi bi-file-earmark-minus me-1"></i>Anular factura';
            if (!respuesta.ok) {
                boton.disabled = false;
                mostrarMensaje(mensajeError(respuesta, 'No se pudo anular la factura.'),
                    respuesta.status === 409 ? 'warning' : 'danger');
                return;
            }
            var nota = respuesta.json;
            mostrarMensaje('Factura anulada con una nota de crédito por el total.', 'success');
            porId('ncFormulario').querySelectorAll('input,select').forEach(function (campo) { campo.disabled = true; });
            boton.classList.add('d-none');
            var resultado = porId('ncResultado');
            resultado.classList.remove('d-none');
            resultado.textContent = 'Nota de crédito ' + (nota.Numero || '') + ' por ' + dinero(nota.Total) + '.';
            if (estado.alCompletar) estado.alCompletar(nota);
        }).catch(function () {
            estado.enviando = false;
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-file-earmark-minus me-1"></i>Anular factura';
            mostrarMensaje('No se pudo anular por un problema de conexión. Podés reintentar: la nota de crédito no se duplica.', 'danger');
        });
    }

    window.FacturacionProformaAnulacion = { abrir: abrir };
})(window, document);
