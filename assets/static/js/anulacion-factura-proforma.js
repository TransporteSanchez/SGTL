(function (window, document) {
    'use strict';

    var API = 'http://localhost:50222/api';
    var estado = null;
    var validador = null;

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
        if (respuesta && respuesta.status === 401) return 'Tu sesión venció. Volvé a iniciar sesión.';
        if (respuesta && respuesta.status === 403) return 'Tu usuario no tiene permiso para emitir créditos.';
        return alternativo;
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

    function fechaIso(valor) { return valor ? String(valor).substring(0, 10) : ''; }
    function fechaVisible(valor) {
        var partes = fechaIso(valor).split('-');
        if (window.SGTL && window.SGTL.fecha) return window.SGTL.fecha(fechaIso(valor));
        return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : '';
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
        if (porId('modalAnularFactura')) return;
        var contenedor = document.createElement('div');
        contenedor.innerHTML =
            '<div class="modal fade" id="modalAnularFactura" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">' +
                '<div class="modal-dialog modal-lg"><div class="modal-content">' +
                    '<div class="modal-header"><div><h5 class="modal-title mb-0">Anular comprobante</h5>' +
                        '<small class="text-muted" id="ncProformaNumero">Buscando el comprobante vinculado…</small></div>' +
                        '<button type="button" class="btn-close" id="btnCerrarNCX" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
                    '<div class="modal-body">' +
                        '<div id="ncMensaje" class="alert alert-info mb-3">Validando el comprobante…</div>' +
                        '<div id="ncFormulario" class="row g-3">' +
                            '<div class="col-md-8"><span class="form-label d-block">Cliente</span><output id="ncCliente" class="sgtl-dato-fijo d-block"></output></div>' +
                            '<div class="col-md-4"><span class="form-label d-block">CUIT</span><output id="ncCuit" class="sgtl-dato-fijo d-block"></output></div>' +
                            '<div class="col-md-6"><span class="form-label d-block">Comprobante a anular</span><output id="ncFactura" class="sgtl-dato-fijo d-block"></output></div>' +
                            '<div class="col-md-3"><span class="form-label d-block">Fecha del comprobante</span><output id="ncFechaFactura" class="sgtl-dato-fijo d-block"></output></div>' +
                            '<div class="col-md-3"><span class="form-label d-block">Importe</span><output id="ncImporte" class="sgtl-dato-fijo d-block text-end fw-bold"></output></div>' +
                            '<div class="col-md-3"><label class="form-label" for="ncTipoComprobante">Tipo de crédito <span class="text-danger">*</span></label><select id="ncTipoComprobante" class="form-select"></select></div>' +
                            '<div class="col-md-3"><label class="form-label" for="ncLetra">Letra <span class="text-danger">*</span></label><select id="ncLetra" class="form-select"></select></div>' +
                            '<div class="col-md-3"><label class="form-label" for="ncSucursal">Sucursal <span class="text-danger">*</span></label><select id="ncSucursal" class="form-select"></select></div>' +
                            '<div class="col-md-3"><span class="form-label d-block">N° comprobante</span><output id="ncNumeroComprobante" class="sgtl-dato-fijo d-block"></output></div>' +
                            '<div class="col-md-4"><label class="form-label" for="ncFechaEmision">Fecha de emisión <span class="text-danger">*</span></label><input id="ncFechaEmision" class="form-control" placeholder="DD/MM/AAAA"></div>' +
                            '<div class="col-md-8"><label class="form-label" for="ncObservaciones">Observaciones</label><input id="ncObservaciones" class="form-control" maxlength="2000" placeholder="Opcional"></div>' +
                        '</div>' +
                        '<div id="ncResultado" class="alert alert-success mt-3 d-none"></div>' +
                    '</div>' +
                    '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" id="btnCerrarNC" data-bs-dismiss="modal">Cancelar</button>' +
                        '<button type="button" class="btn btn-danger" id="btnConfirmarNC" disabled>' +
                            '<i class="bi bi-file-earmark-minus me-1" aria-hidden="true"></i>Anular comprobante</button></div>' +
                '</div></div>' +
            '</div>';
        document.body.appendChild(contenedor.firstElementChild);
        prepararFecha('ncFechaEmision');
        porId('btnConfirmarNC').addEventListener('click', emitir);
        porId('ncTipoComprobante').addEventListener('change', seleccionarTipoCredito);
        porId('modalAnularFactura').addEventListener('hide.bs.modal', function (evento) {
            if (estado && estado.enviando) evento.preventDefault();
        });
        if (window.SGTL && window.SGTL.validador) validador = window.SGTL.validador([
            { id: 'ncTipoComprobante', requerido: 'Seleccioná un tipo de crédito.' },
            { id: 'ncLetra', requerido: 'Seleccioná una letra.' },
            { id: 'ncSucursal', requerido: 'Seleccioná una sucursal.' },
            { id: 'ncFechaEmision', requerido: 'Completá la fecha de emisión.' }
        ]);
    }

    function mostrarModal() {
        var elemento = porId('modalAnularFactura');
        if (window.bootstrap && bootstrap.Modal) bootstrap.Modal.getOrCreateInstance(elemento).show();
        else if (window.jQuery) window.jQuery(elemento).modal('show');
    }

    function mostrarMensaje(texto, tipo) {
        var mensaje = porId('ncMensaje');
        mensaje.className = 'alert mb-3 alert-' + (tipo || 'info');
        if (window.SGTL && window.SGTL.avisoFormulario) window.SGTL.avisoFormulario(mensaje, texto);
        else mensaje.textContent = texto;
    }

    function bloquearFormulario(bloqueado) {
        porId('btnCerrarNC').disabled = bloqueado;
        porId('btnCerrarNCX').disabled = bloqueado;
        porId('ncFormulario').querySelectorAll('input,select').forEach(function (campo) {
            campo.disabled = bloqueado;
        });
    }

    function prepararModal(id, alCompletar) {
        if (estado && estado.enviando && estado.finalizarProceso) {
            estado.enviando = false;
            estado.finalizarProceso();
        }
        estado = {
            proformaId: Number(id),
            claveOperacion: nuevaClave(),
            datos: null,
            enviando: false,
            configuracionLista: false,
            cargaConfiguracion: 0,
            tiposCredito: [],
            alCompletar: typeof alCompletar === 'function' ? alCompletar : null
        };
        porId('ncProformaNumero').textContent = 'Proforma #' + id;
        ['ncCliente', 'ncCuit', 'ncFactura', 'ncFechaFactura', 'ncImporte', 'ncNumeroComprobante'].forEach(function (idCampo) {
            porId(idCampo).value = '';
        });
        porId('ncTipoComprobante').innerHTML = '';
        porId('ncTipoComprobante').value = '';
        porId('ncLetra').innerHTML = '';
        porId('ncSucursal').innerHTML = '';
        limitarFecha('ncFechaEmision', 'maxDate', hoyIso());
        limitarFecha('ncFechaEmision', 'minDate', '');
        ponerFecha('ncFechaEmision', hoyIso());
        porId('ncObservaciones').value = '';
        porId('ncResultado').classList.add('d-none');
        porId('ncResultado').textContent = '';
        porId('ncFormulario').classList.remove('d-none');
        porId('btnConfirmarNC').disabled = true;
        porId('btnConfirmarNC').classList.remove('d-none');
        porId('btnCerrarNC').textContent = 'Cancelar';
        bloquearFormulario(false);
        if (validador) validador.reiniciar();
        if (window.SGTL && window.SGTL.reiniciarFormulario) window.SGTL.reiniciarFormulario('ncFormulario', 'ncMensaje');
        mostrarMensaje('Validando el comprobante vinculado…', 'info');
    }

    function seleccionarTipoCredito() {
        var operacion = estado;
        if (!operacion) return Promise.resolve();
        var tipo = porId('ncTipoComprobante').value;
        var carga = ++operacion.cargaConfiguracion;
        operacion.configuracionLista = false;
        porId('btnConfirmarNC').disabled = true;
        porId('ncLetra').innerHTML = '';
        porId('ncSucursal').innerHTML = '';
        porId('ncNumeroComprobante').value = '';
        if (!tipo || !operacion.tiposCredito.some(function (item) { return item.Tipo === tipo; })) {
            if (!tipo && operacion.tiposCredito.length > 1)
                mostrarMensaje('Seleccioná un tipo de crédito para anular el comprobante por el total.', 'info');
            return Promise.resolve();
        }
        if (!window.ConfiguracionFacturacion || !window.ConfiguracionFacturacion.cargar) {
            mostrarMensaje('No se pudo cargar la configuración del crédito. Probá de nuevo.', 'danger');
            return Promise.resolve();
        }
        mostrarMensaje('Cargando la configuración del crédito…', 'info');
        var vigente = function () {
            return estado === operacion && operacion.cargaConfiguracion === carga && porId('ncTipoComprobante').value === tipo;
        };
        return window.ConfiguracionFacturacion.cargar(tipo, {
            letra: 'ncLetra', sucursal: 'ncSucursal', numero: 'ncNumeroComprobante'
        }, vigente).then(function () {
            if (!vigente()) return;
            operacion.configuracionLista = true;
            porId('btnConfirmarNC').disabled = false;
            mostrarMensaje('Se emite un crédito cancelatorio por el total del comprobante. El importe no se puede modificar.', 'warning');
        }).catch(function (error) {
            if (!vigente()) return;
            var texto = error && error.message && !(error instanceof TypeError) ? error.message :
                'No se pudo cargar la configuración del crédito. Revisá la conexión y probá de nuevo.';
            mostrarMensaje(texto, 'danger');
        });
    }

    function cargarTiposCredito(operacion) {
        return fetch(API + '/facturacion-config/tipos-emision-credito', {
            method: 'GET', headers: encabezados(false)
        }).then(leerRespuesta).then(function (respuesta) {
            if (estado !== operacion) return;
            if (!respuesta.ok) {
                mostrarMensaje(mensajeError(respuesta, 'No se pudieron cargar los tipos de crédito.'), 'danger');
                return;
            }
            var tipos = Array.isArray(respuesta.json) ? respuesta.json.filter(function (item) {
                return item && item.Impacto === 'C' && item.Tipo !== 'REC';
            }) : [];
            if (!tipos.length) {
                mostrarMensaje('No hay tipos de crédito activos para cancelar el comprobante. Revisá la configuración de facturación.', 'danger');
                return;
            }
            operacion.tiposCredito = tipos;
            porId('ncTipoComprobante').innerHTML = '<option value="">Seleccioná un tipo de crédito</option>' + tipos.map(function (item) {
                return '<option value="' + window.SGTL.escapar(item.Tipo) + '">' +
                    window.SGTL.escapar(item.Tipo + ' · ' + (item.Descripcion || item.Tipo)) + '</option>';
            }).join('');
            if (tipos.length === 1) {
                porId('ncTipoComprobante').value = tipos[0].Tipo;
                return seleccionarTipoCredito();
            }
            porId('ncTipoComprobante').value = '';
            mostrarMensaje('Seleccioná un tipo de crédito para anular el comprobante por el total.', 'info');
        }).catch(function () {
            if (estado === operacion)
                mostrarMensaje('No se pudieron cargar los tipos de crédito. Revisá la conexión y probá de nuevo.', 'danger');
        });
    }

    function abrir(id, alCompletar) {
        crearModal();
        prepararModal(id, alCompletar);
        var operacion = estado;
        mostrarModal();
        if (!token()) {
            mostrarMensaje('Tu sesión venció. Volvé a iniciar sesión para anular el comprobante.', 'danger');
            return;
        }

        fetch(API + '/proformas/' + encodeURIComponent(id) + '/factura-cancelatoria', {
            method: 'GET', headers: encabezados(false)
        }).then(leerRespuesta).then(function (respuesta) {
            if (estado !== operacion) return;
            if (!respuesta.ok) {
                mostrarMensaje(mensajeError(respuesta, 'No se pudo validar el comprobante vinculado.'), 'danger');
                return;
            }
            var datos = respuesta.json;
            operacion.datos = datos;
            porId('ncProformaNumero').textContent = 'Proforma ' + (datos.ProformaNumero || ('#' + datos.ProformaID));
            porId('ncCliente').value = datos.Cliente || '';
            porId('ncCuit').value = datos.CUIT || '';
            porId('ncFactura').value = datos.FacturaNumero || '';
            porId('ncFechaFactura').value = fechaVisible(datos.FechaFactura);
            porId('ncImporte').value = dinero(datos.Total);
            limitarFecha('ncFechaEmision', 'minDate', fechaIso(datos.FechaFactura));
            if (porId('ncFechaEmision').value < fechaIso(datos.FechaFactura))
                ponerFecha('ncFechaEmision', fechaIso(datos.FechaFactura));

            if (!datos.Cancelable) {
                mostrarMensaje(datos.MotivoBloqueo || 'El comprobante no se puede anular por el total.', 'warning');
                return;
            }
            return cargarTiposCredito(operacion);
        }).catch(function (error) {
            if (estado !== operacion) return;
            var texto = error && error.message && !(error instanceof TypeError) ? error.message :
                'No se pudo validar el comprobante vinculado. Revisá la conexión y probá de nuevo.';
            mostrarMensaje(texto, 'danger');
        });
    }

    function emitir() {
        var operacion = estado;
        if (!operacion || operacion.enviando || !operacion.datos || !operacion.configuracionLista) return;
        if (validador && !validador.validarTodo()) {
            porId('ncMensaje').className = 'alert mb-3 alert-danger';
            if (window.SGTL && window.SGTL.revisarFormulario) window.SGTL.revisarFormulario('ncFormulario', 'ncMensaje');
            return;
        }
        if (!porId('ncLetra').value || !porId('ncSucursal').value) {
            mostrarMensaje('Seleccioná una letra y una sucursal.', 'warning');
            return;
        }
        var tipoCredito = operacion.tiposCredito.filter(function (item) {
            return item.Tipo === porId('ncTipoComprobante').value;
        })[0];
        if (!tipoCredito) {
            mostrarMensaje('Seleccioná un tipo de crédito.', 'warning');
            return;
        }
        var fechaEmision = porId('ncFechaEmision').value;
        if (!fechaEmision) {
            mostrarMensaje('Completá la fecha de emisión.', 'warning');
            return;
        }
        if (fechaEmision < fechaIso(operacion.datos.FechaFactura)) {
            if (window.SGTL && window.SGTL.marcarError && window.SGTL.revisarFormulario) {
                window.SGTL.marcarError('ncFechaEmision', 'La fecha de emisión no puede ser anterior a la del comprobante.');
                porId('ncMensaje').className = 'alert mb-3 alert-danger';
                window.SGTL.revisarFormulario('ncFormulario', 'ncMensaje');
            } else mostrarMensaje('La fecha de emisión no puede ser anterior a la del comprobante.', 'warning');
            return;
        }

        operacion.enviando = true;
        var boton = porId('btnConfirmarNC');
        var finalizarProceso = window.SGTL && window.SGTL.procesando
            ? window.SGTL.procesando(boton, 'Anulando…')
            : (function () {
                var contenido = boton.innerHTML;
                boton.disabled = true;
                boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Anulando…';
                return function () { boton.innerHTML = contenido; boton.disabled = false; };
            })();
        operacion.finalizarProceso = finalizarProceso;
        bloquearFormulario(true);
        function finalizar() {
            if (estado !== operacion) return;
            operacion.enviando = false;
            finalizarProceso();
            operacion.finalizarProceso = null;
            bloquearFormulario(false);
        }
        var datos = operacion.datos;
        var descripcionCredito = String(tipoCredito.Descripcion || 'Crédito').trim();
        var adjetivo = /^nota\b/i.test(descripcionCredito) ? 'cancelatoria' : 'cancelatorio';
        var solicitud = {
            ClaveOperacion: operacion.claveOperacion,
            ProformaID: operacion.proformaId,
            ClienteID: datos.ClienteID,
            Tipo: tipoCredito.Tipo,
            Letra: porId('ncLetra').value || null,
            Sucursal: porId('ncSucursal').value || null,
            FechaEmision: fechaEmision,
            ComprobanteReferenciaID: datos.FacturaID,
            Concepto: descripcionCredito + ' ' + adjetivo + ' de ' + (datos.FacturaNumero || 'el comprobante'),
            Neto: datos.Neto,
            IvaPct: datos.IvaPct,
            IVA: datos.IVA,
            OtrosImpuestos: datos.OtrosImpuestos,
            Observaciones: porId('ncObservaciones').value.trim() || null
        };
        fetch(API + '/comprobantes', {
            method: 'POST', headers: encabezados(true), body: JSON.stringify(solicitud)
        }).then(leerRespuesta).then(function (respuesta) {
            if (estado !== operacion) return;
            finalizar();
            if (!respuesta.ok) {
                mostrarMensaje(mensajeError(respuesta, 'No se pudo anular el comprobante.'),
                    respuesta.status === 409 ? 'warning' : 'danger');
                return;
            }
            var nota = respuesta.json;
            var avisoExito = 'Comprobante anulado con un crédito cancelatorio por el total.';
            if (window.SGTL && window.SGTL.toastExito) {
                window.SGTL.toastExito(avisoExito);
                mostrarMensaje('', 'success');
            } else mostrarMensaje(avisoExito, 'success');
            porId('ncFormulario').classList.add('d-none');
            boton.classList.add('d-none');
            porId('btnCerrarNC').textContent = 'Cerrar';
            var resultado = porId('ncResultado');
            resultado.classList.remove('d-none');
            resultado.textContent = descripcionCredito + ' ' + (nota.Numero || '') + ' por ' + dinero(nota.Total) + '.';
            if (operacion.alCompletar) operacion.alCompletar(nota);
        }).catch(function () {
            if (estado !== operacion) return;
            finalizar();
            mostrarMensaje('No se pudo anular por un problema de conexión. Podés reintentar: el crédito cancelatorio no se duplica.', 'danger');
        });
    }

    window.FacturacionProformaAnulacion = { abrir: abrir };
})(window, document);
