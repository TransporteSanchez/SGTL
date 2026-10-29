(function (window, document) {
    'use strict';

    var API = 'http://localhost:50222/api';
    var estado = null;
    var vencimientoEditado = false;
    var validador = null;

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
        if (respuesta && respuesta.status === 403) return 'Tu usuario no tiene permiso para emitir comprobantes.';
        return alternativo;
    }

    function escapar(valor) {
        if (window.SGTL && window.SGTL.escapar) return window.SGTL.escapar(valor);
        return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (caracter) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caracter];
        });
    }

    function dinero(valor) {
        if (window.SGTL && window.SGTL.monto) return window.SGTL.monto(valor);
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
            '<div class="modal fade" id="modalFacturarProforma" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">' +
                '<div class="modal-dialog modal-xl modal-dialog-scrollable sgtl-modal-formulario"><div class="modal-content">' +
                    '<div class="modal-header"><div><h5 class="modal-title mb-0">Emitir comprobante</h5>' +
                        '<small class="text-muted" id="facProformaNumero">Comprobando disponibilidad…</small></div>' +
                        '<button type="button" class="btn-close" id="btnCerrarCabeceraFacturarProforma" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
                    '<div class="modal-body">' +
                        '<div id="facMensaje" class="alert alert-info mb-3">Validando la proforma…</div>' +
                        '<div id="facFormulario" class="row g-3">' +
                            '<div class="col-md-3"><label class="form-label" for="facTipoComprobante">Tipo de comprobante <span class="text-danger">*</span></label>' +
                                '<select id="facTipoComprobante" class="form-select"></select></div>' +
                            '<div class="col-md-3"><label class="form-label" for="facLetra">Letra <span class="text-danger">*</span></label>' +
                                '<select id="facLetra" class="form-select"></select></div>' +
                            '<div class="col-md-3"><label class="form-label" for="facSucursal">Sucursal <span class="text-danger">*</span></label>' +
                                '<select id="facSucursal" class="form-select"></select></div>' +
                            '<div class="col-md-3"><span class="form-label d-block">N° comprobante</span>' +
                                '<output id="facNumeroComprobante" class="sgtl-dato-fijo d-block"></output></div>' +
                            '<div class="col-md-4"><span class="form-label d-block">Total del comprobante</span>' +
                                '<output id="facTotal" class="sgtl-dato-fijo d-block text-end fw-bold"></output></div>' +
                            '<div class="col-md-4"><label class="form-label" for="facFechaEmision">Fecha de emisión <span class="text-danger">*</span></label>' +
                                '<input id="facFechaEmision" class="form-control" placeholder="DD/MM/AAAA"></div>' +
                            '<div class="col-md-4"><label class="form-label" for="facFechaVencimiento">Fecha de vencimiento <span class="text-danger">*</span></label>' +
                                '<input id="facFechaVencimiento" class="form-control" placeholder="DD/MM/AAAA"></div>' +
                            '<div class="col-12"><label class="form-label" for="facObservaciones">Observaciones del comprobante</label>' +
                                '<textarea id="facObservaciones" class="form-control" rows="3" maxlength="2000"></textarea></div>' +
                        '</div>' +
                        '<div id="facResultado" class="alert alert-success mt-3 d-none"></div>' +
                    '</div>' +
                    '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" id="btnCerrarFacturarProforma" data-bs-dismiss="modal">Cancelar</button>' +
                        '<button type="button" class="btn btn-primary" id="btnConfirmarFactura" disabled>' +
                            '<i class="bi bi-receipt me-1" aria-hidden="true"></i>Emitir comprobante</button></div>' +
                '</div></div>' +
            '</div>';
        document.body.appendChild(contenedor.firstElementChild);
        prepararFecha('facFechaEmision');
        prepararFecha('facFechaVencimiento');
        porId('btnConfirmarFactura').addEventListener('click', emitir);
        porId('facTipoComprobante').addEventListener('change', seleccionarTipo);
        porId('modalFacturarProforma').addEventListener('hide.bs.modal', function (evento) {
            if (estado && estado.enviando) evento.preventDefault();
        });
        porId('facFechaEmision').addEventListener('change', actualizarVencimientoPredeterminado);
        porId('facFechaVencimiento').addEventListener('change', function () { vencimientoEditado = true; });
        if (window.SGTL && window.SGTL.validador) validador = window.SGTL.validador([
            { id: 'facTipoComprobante', requerido: 'Seleccioná un tipo de comprobante.' },
            { id: 'facLetra', requerido: 'Seleccioná una letra.' },
            { id: 'facSucursal', requerido: 'Seleccioná una sucursal.' },
            { id: 'facFechaEmision', requerido: 'Completá la fecha de emisión.' },
            { id: 'facFechaVencimiento', requerido: 'Completá la fecha de vencimiento.' }
        ]);
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
        if (window.SGTL && window.SGTL.avisoFormulario) window.SGTL.avisoFormulario(mensaje, texto);
        else mensaje.textContent = texto;
    }

    function bloquearFormulario(bloquear) {
        porId('btnCerrarFacturarProforma').disabled = bloquear;
        porId('btnCerrarCabeceraFacturarProforma').disabled = bloquear;
        porId('facFormulario').querySelectorAll('input,select,textarea').forEach(function (campo) {
            campo.disabled = bloquear;
        });
    }

    function prepararModal(id, alCompletar) {
        estado = {
            proformaId: Number(id),
            version: null,
            claveOperacion: nuevaClave(),
            alCompletar: typeof alCompletar === 'function' ? alCompletar : null,
            enviando: false,
            configuracionLista: false,
            proformaLista: false,
            tiposListos: false,
            cargaConfiguracion: 0
        };
        porId('facProformaNumero').textContent = 'Proforma #' + id;
        porId('facTotal').value = '';
        porId('facTipoComprobante').innerHTML = '<option value="">Seleccioná un tipo</option>';
        porId('facTipoComprobante').value = '';
        porId('facLetra').innerHTML = '';
        porId('facSucursal').innerHTML = '';
        porId('facNumeroComprobante').value = '';
        limitarFecha('facFechaEmision', 'maxDate', hoyIso());
        ponerFecha('facFechaEmision', hoyIso());
        vencimientoEditado = false;
        actualizarVencimientoPredeterminado();
        porId('facObservaciones').value = '';
        porId('facResultado').classList.add('d-none');
        porId('facResultado').textContent = '';
        porId('btnConfirmarFactura').disabled = true;
        porId('btnConfirmarFactura').classList.remove('d-none');
        porId('btnCerrarFacturarProforma').textContent = 'Cancelar';
        porId('facFormulario').classList.remove('d-none');
        bloquearFormulario(false);
        if (validador) validador.reiniciar();
        if (window.SGTL && window.SGTL.reiniciarFormulario) window.SGTL.reiniciarFormulario('facFormulario', 'facMensaje');
        mostrarMensaje('Validando la proforma…', 'info');
    }

    function habilitarEmision(operacion) {
        if (estado !== operacion) return;
        porId('btnConfirmarFactura').disabled = !(operacion.proformaLista && operacion.configuracionLista);
        if (!porId('btnConfirmarFactura').disabled)
            mostrarMensaje('La proforma está lista. Revisá el tipo y las fechas antes de emitir el comprobante.', 'success');
        else if (operacion.proformaLista && operacion.tiposListos && !porId('facTipoComprobante').value)
            mostrarMensaje('La proforma está lista. Seleccioná el tipo de comprobante para emitir.', 'info');
    }

    // El tipo que se propone al abrir: el comprobante interno (FC) o el único que haya. Como la sigla se puede
    // renombrar (§47), si FC no está no se propone otro, para no elegir un débito por error (§62).
    function tipoPropuesto(tipos) {
        var interno = tipos.filter(function (item) { return item.Tipo === 'FC'; })[0];
        if (interno) return interno.Tipo;
        return tipos.length === 1 ? tipos[0].Tipo : '';
    }

    function seleccionarTipo() {
        var operacion = estado;
        if (!operacion) return Promise.resolve();
        var tipo = porId('facTipoComprobante').value;
        var carga = ++operacion.cargaConfiguracion;
        operacion.configuracionLista = false;
        porId('btnConfirmarFactura').disabled = true;
        porId('facLetra').innerHTML = '';
        porId('facSucursal').innerHTML = '';
        porId('facNumeroComprobante').value = '';
        if (!tipo) {
            habilitarEmision(operacion);
            return Promise.resolve();
        }
        if (operacion.proformaLista) mostrarMensaje('Cargando la configuración del comprobante…', 'info');
        if (!window.ConfiguracionFacturacion || !window.ConfiguracionFacturacion.cargar) {
            mostrarMensaje('No se pudo cargar la configuración del comprobante. Probá de nuevo.', 'danger');
            return Promise.resolve();
        }
        var vigente = function () {
            return estado === operacion && operacion.cargaConfiguracion === carga && porId('facTipoComprobante').value === tipo;
        };
        return window.ConfiguracionFacturacion.cargar(tipo, {
            letra: 'facLetra', sucursal: 'facSucursal', numero: 'facNumeroComprobante'
        }, vigente).then(function () {
            if (!vigente()) return;
            operacion.configuracionLista = true;
            habilitarEmision(operacion);
        }).catch(function (ex) {
            if (!vigente()) return;
            var texto = ex && ex.message && !(ex instanceof TypeError) ? ex.message :
                'No se pudo cargar la configuración del comprobante. Revisá la conexión y probá de nuevo.';
            mostrarMensaje(texto, 'danger');
        });
    }

    function abrir(id, alCompletar) {
        crearModal();
        prepararModal(id, alCompletar);
        mostrarModal();
        var operacion = estado;
        if (!token()) {
            mostrarMensaje('Tu sesión venció. Volvé a iniciar sesión para emitir el comprobante.', 'danger');
            return;
        }
        fetch(API + '/facturacion-config/tipos-emision-directa', {
            method: 'GET', headers: encabezados(false)
        }).then(leerRespuesta).then(function (respuesta) {
            if (estado !== operacion) return;
            if (!respuesta.ok) {
                mostrarMensaje(mensajeError(respuesta, 'No se pudieron cargar los tipos de comprobante.'), 'danger');
                return;
            }
            var tipos = Array.isArray(respuesta.json) ? respuesta.json.filter(function (item) {
                return item && item.Impacto === 'D' && item.Tipo !== 'ND';
            }) : [];
            if (!tipos.length) {
                mostrarMensaje('No hay tipos de comprobante de deuda activos para emitir. Revisá la configuración de facturación.', 'danger');
                return;
            }
            porId('facTipoComprobante').innerHTML = '<option value="">Seleccioná un tipo</option>' + tipos.map(function (item) {
                return '<option value="' + escapar(item.Tipo) + '">' +
                    escapar(item.Tipo + ' · ' + (item.Descripcion || item.Tipo)) + '</option>';
            }).join('');
            operacion.tiposListos = true;
            porId('facTipoComprobante').value = tipoPropuesto(tipos);
            seleccionarTipo();
        }).catch(function () {
            if (estado === operacion)
                mostrarMensaje('No se pudieron cargar los tipos de comprobante. Revisá la conexión y probá de nuevo.', 'danger');
        });
        fetch(API + '/proformas/' + encodeURIComponent(id) + '/facturacion', {
            method: 'GET', headers: encabezados(false)
        }).then(leerRespuesta).then(function (respuesta) {
            if (estado !== operacion) return;
            if (!respuesta.ok) {
                mostrarMensaje(mensajeError(respuesta, 'No se pudo validar la proforma.'), 'danger');
                return;
            }
            var datos = respuesta.json;
            porId('facProformaNumero').textContent = 'Proforma ' + (datos.Numero || ('#' + datos.ProformaID));
            porId('facTotal').value = dinero(datos.TotalCalculado);
            estado.version = datos.VersionProforma;
            if (!datos.Facturable) {
                var texto = datos.MotivoBloqueo || 'No se puede emitir un comprobante desde esta proforma.';
                if (datos.FacturaVigente && datos.FacturaVigente.Numero)
                    texto += ' Comprobante vigente: ' + datos.FacturaVigente.Numero + '.';
                mostrarMensaje(texto, 'warning');
                return;
            }
            operacion.proformaLista = true;
            habilitarEmision(operacion);
        }).catch(function () {
            if (estado === operacion)
                mostrarMensaje('No se pudo validar la proforma. Revisá la conexión y probá de nuevo.', 'danger');
        });
    }

    function emitir() {
        if (!estado || estado.enviando || !estado.version || !estado.configuracionLista) return;
        if (validador && !validador.validarTodo()) {
            ocultarMensajeClases();
            porId('facMensaje').classList.add('alert-danger');
            window.SGTL.revisarFormulario('facFormulario', 'facMensaje');
            return;
        }
        var fechaEmision = porId('facFechaEmision').value;
        var fechaVencimiento = porId('facFechaVencimiento').value;
        if (!fechaEmision || !fechaVencimiento) {
            mostrarMensaje('Completá la fecha de emisión y la fecha de vencimiento.', 'warning');
            return;
        }
        if (fechaVencimiento < fechaEmision) {
            if (window.SGTL && window.SGTL.marcarError && window.SGTL.revisarFormulario) {
                window.SGTL.marcarError('facFechaVencimiento', 'El vencimiento no puede ser anterior a la emisión.');
                ocultarMensajeClases();
                porId('facMensaje').classList.add('alert-danger');
                window.SGTL.revisarFormulario('facFormulario', 'facMensaje');
            } else mostrarMensaje('El vencimiento no puede ser anterior a la emisión.', 'warning');
            return;
        }
        var operacion = estado;
        estado.enviando = true;
        bloquearFormulario(true);
        var boton = porId('btnConfirmarFactura');
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Emitiendo…';
        var solicitud = {
            Tipo: porId('facTipoComprobante').value,
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
            if (estado !== operacion) return;
            operacion.enviando = false;
            bloquearFormulario(false);
            boton.innerHTML = '<i class="bi bi-receipt me-1" aria-hidden="true"></i>Emitir comprobante';
            if (!respuesta.ok) {
                boton.disabled = false;
                mostrarMensaje(mensajeError(respuesta, 'No se pudo emitir el comprobante.'),
                    respuesta.status === 409 ? 'warning' : 'danger');
                return;
            }
            var factura = respuesta.json;
            if (window.SGTL && window.SGTL.toastExito) {
                window.SGTL.toastExito(factura.Numero ? 'Comprobante emitido: ' + factura.Numero + '.' : 'Comprobante emitido.');
                mostrarMensaje('', 'info');
            } else mostrarMensaje('Comprobante emitido.', 'success');
            porId('facFormulario').classList.add('d-none');
            boton.classList.add('d-none');
            porId('btnCerrarFacturarProforma').textContent = 'Cerrar';
            var resultado = porId('facResultado');
            resultado.classList.remove('d-none');
            resultado.innerHTML = '<strong>' + escapar(factura.Numero || 'Comprobante emitido') + '</strong> · ' +
                dinero(factura.Total) + '<br><a class="alert-link" href="cuenta-corriente-clientes.html?clienteId=' +
                encodeURIComponent(factura.ClienteID) + '">Ver la cuenta corriente del cliente</a>' +
                '<div class="mt-3 d-flex flex-wrap gap-2">' +
                    '<button type="button" class="btn btn-sm btn-outline-secondary" id="facImprimirFactura">' +
                        '<i class="bi bi-printer me-1" aria-hidden="true"></i>Imprimir</button>' +
                    '<button type="button" class="btn btn-sm btn-primary" id="facDescargarFactura">' +
                        '<i class="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>Descargar PDF</button>' +
                '</div>';
            porId('facImprimirFactura').addEventListener('click', function () {
                if (window.imprimirFacturaPDF) window.imprimirFacturaPDF(factura.ComprobanteID);
            });
            porId('facDescargarFactura').addEventListener('click', function () {
                if (window.descargarFacturaPDF) window.descargarFacturaPDF(factura.ComprobanteID);
            });
            if (operacion.alCompletar) operacion.alCompletar(factura);
        }).catch(function () {
            if (estado !== operacion) return;
            operacion.enviando = false;
            bloquearFormulario(false);
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-receipt me-1" aria-hidden="true"></i>Emitir comprobante';
            mostrarMensaje('No se pudo emitir por un problema de conexión. Podés reintentar: el comprobante no se duplica.', 'danger');
        });
    }

    window.FacturacionProforma = { abrir: abrir };
})(window, document);
