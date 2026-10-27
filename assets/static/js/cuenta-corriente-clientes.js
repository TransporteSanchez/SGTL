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
    var reciboEditandoId = null;
    var reciboEditando = null;
    var comprobanteOperacion = null;
    var comprobanteTipo = null;
    var comprobanteDirecto = false;
    var facturasReferencia = [];
    var ivaComprobanteFijo = null;
    var vencimientoComprobanteEditado = false;
    var paginaActual = 1;
    var paginacionMovimientos = { total: 0, totalPages: 0 };
    var tamanioPagina = 15;
    var filtrosCuenta = null;
    var modalVistaPreviaComprobante = null;
    var urlVistaPreviaComprobante = null;
    var secuenciaVistaPreviaComprobante = 0;
    var secuenciaEnvioComprobante = 0;

    function porId(id) { return document.getElementById(id); }

    function cargarConfiguracionEmision(tipo, controles, valoresActuales, vigente) {
        if (!window.ConfiguracionFacturacion || !window.ConfiguracionFacturacion.cargar) {
            return Promise.reject(new Error('No se cargó la configuración de Facturación.'));
        }
        return window.ConfiguracionFacturacion.cargar(tipo, controles, vigente).then(function (datos) {
            if (typeof vigente === 'function' && !vigente()) return datos;
            valoresActuales = valoresActuales || {};
            ['letra', 'sucursal', 'numero'].forEach(function (nombre) {
                var valor = valoresActuales[nombre];
                var control = porId(controles[nombre]);
                if (!control || valor == null || valor === '') return;
                if (tipo === 'REC' && nombre === 'letra') return;
                if (nombre === 'numero') { control.value = valor; return; }
                var existe = Array.prototype.some.call(control.options, function (opcion) { return opcion.value === valor; });
                if (!existe) control.insertAdjacentHTML('beforeend', '<option value="' + escapar(valor) + '">' + escapar(valor) + '</option>');
                control.value = valor;
            });
            return datos;
        });
    }
    function agregarTiposFiltroCuenta(tipos) {
        var filtro = porId('ccTipo');
        (tipos || []).forEach(function (item) {
            var codigo = String(item.Tipo || '').trim().toUpperCase();
            if (!codigo || Array.prototype.some.call(filtro.options, function (opcion) { return opcion.value === codigo; })) return;
            filtro.insertAdjacentHTML('beforeend', '<option value="' + escapar(codigo) + '">' +
                escapar(item.Descripcion ? codigo + ' · ' + item.Descripcion : codigo) + '</option>');
        });
    }
    function cargarTiposComprobanteDirecto() {
        var operacion = comprobanteOperacion;
        return apiGet('/facturacion-config/tipos-emision-directa').then(function (tipos) {
            tipos = tipos || [];
            agregarTiposFiltroCuenta(tipos);
            if (!comprobanteDirecto || comprobanteOperacion !== operacion) return tipos;
            var selector = porId('cmpTipoSeleccion');
            selector.innerHTML = '<option value="">Seleccioná un tipo</option>' + tipos.map(function (item) {
                var codigo = String(item.Tipo || '').trim().toUpperCase();
                return '<option value="' + escapar(codigo) + '">' +
                    escapar(codigo + ' · ' + (item.Descripcion || codigo)) + '</option>';
            }).join('');
            selector.value = '';
            porId('btnEmitirComprobante').disabled = true;
            if (!tipos.length) {
                window.SGTL.avisoFormulario(porId('cmpError'), 'No hay tipos de comprobante de deuda activos para emitir.');
            }
            return tipos;
        });
    }
    function seleccionarTipoComprobanteDirecto() {
        var selector = porId('cmpTipoSeleccion');
        var tipo = selector.value;
        var boton = porId('btnEmitirComprobante');
        comprobanteTipo = tipo || null;
        boton.disabled = true;
        porId('cmpTipoComprobante').textContent = '';
        porId('cmpLetra').innerHTML = '';
        porId('cmpSucursal').innerHTML = '';
        porId('cmpNumeroComprobante').value = '';
        if (!tipo) return Promise.resolve();
        window.SGTL.limpiarError(selector);
        window.SGTL.avisoFormulario(porId('cmpError'), '');
        selector.disabled = true;
        var operacion = comprobanteOperacion;
        var vigente = function () {
            return comprobanteDirecto && comprobanteOperacion === operacion && comprobanteTipo === tipo;
        };
        return cargarConfiguracionEmision(tipo, {
            tipo: 'cmpTipoComprobante', letra: 'cmpLetra', sucursal: 'cmpSucursal', numero: 'cmpNumeroComprobante'
        }, null, vigente).then(function () {
            if (vigente()) boton.disabled = false;
        }).catch(function (ex) {
            if (vigente()) window.SGTL.avisoFormulario(porId('cmpError'), textoError(ex, 'No se pudo cargar la configuración del comprobante. Probá de nuevo.'));
        }).then(function () {
            if (vigente()) selector.disabled = false;
        });
    }
    function token() {
        try { return localStorage.getItem('token') || ''; } catch (e) { return ''; }
    }
    function fechaIsoLocal(fechaValor) {
        var fecha = fechaValor || new Date();
        var local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
        return local.toISOString().substring(0, 10);
    }
    function hoyIso() { return fechaIsoLocal(new Date()); }
    // Fechas con flatpickr (§7.1): se ven DD/MM/AAAA y el campo guarda AAAA-MM-DD.
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
    function habilitarFecha(id, habilitada) {
        var campo = porId(id);
        campo.disabled = !habilitada;
        if (campo._flatpickr && campo._flatpickr.altInput) campo._flatpickr.altInput.disabled = !habilitada;
    }
    // El filtro "Fecha" es un solo rango; ccDesde y ccHasta guardan sus extremos para la consulta.
    function sincronizarRango() {
        var rango = window.SGTL && window.SGTL.valorRango('#ccFecha');
        porId('ccDesde').value = rango ? rango.desde : '';
        porId('ccHasta').value = rango ? rango.hasta : '';
    }
    function establecerRangoUltimos30Dias() {
        var hasta = new Date();
        hasta.setHours(0, 0, 0, 0); // con hora quedaría después del máximo "hoy" y flatpickr lo descarta
        var desde = new Date(hasta.getTime());
        desde.setDate(desde.getDate() - 30);
        var campo = porId('ccFecha');
        if (campo._flatpickr) campo._flatpickr.setDate([desde, hasta], false);
        sincronizarRango();
        if (filtrosCuenta) filtrosCuenta.actualizar();
    }
    function nuevaClave() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 3 | 8)).toString(16);
        });
    }
    function leerMontoCentavos(valor) {
        if (window.SGTL && typeof window.SGTL.montoCentavos === 'function') return window.SGTL.montoCentavos(valor);
        if (valor == null || String(valor).trim() === '') return null;
        var numero = Number(valor);
        if (!isFinite(numero) || numero < 0) return null;
        var resultado = Math.round(numero * 100);
        return Math.abs(numero * 100 - resultado) < 0.000001 ? resultado : null;
    }
    function centavos(valor) {
        var resultado = leerMontoCentavos(valor);
        return resultado == null ? 0 : resultado;
    }
    function primerMontoInvalido(campos) {
        for (var indice = 0; indice < campos.length; indice += 1) {
            if (leerMontoCentavos(campos[indice].valor) == null) return campos[indice].etiqueta;
        }
        return null;
    }
    function camposAplicacionSeleccionados(contenedor, claseCheck, claseAplicar) {
        return Array.prototype.reduce.call(document.querySelectorAll(contenedor + ' tr'), function (campos, fila) {
            var check = fila.querySelector(claseCheck);
            var input = fila.querySelector(claseAplicar);
            if (check && input && check.checked) {
                var comprobante = fila.querySelector('.cc-document');
                campos.push({
                    etiqueta: 'El importe aplicado a ' + (comprobante ? comprobante.textContent.trim() : 'un comprobante'),
                    valor: input.value
                });
            }
            return campos;
        }, []);
    }
    function formatearCentavos(valor) {
        if (window.SGTL && typeof window.SGTL.formatearMontoCentavos === 'function') {
            return window.SGTL.formatearMontoCentavos(valor);
        }
        return (Number(valor || 0) / 100).toFixed(2);
    }
    function enlazarMascaraMonto(campo) {
        if (window.SGTL && typeof window.SGTL.enlazarMascaraMonto === 'function') {
            window.SGTL.enlazarMascaraMonto(campo);
        }
    }
    function distribuirImportePorVencimiento(importeCentavos, facturas) {
        var restante = Math.max(0, Number(importeCentavos) || 0);
        return (facturas || []).filter(function (factura) {
            return Number(factura.SaldoCentavos || 0) > 0;
        }).sort(function (a, b) {
            var vencimiento = String(a.FechaVencimiento || '9999-12-31').localeCompare(String(b.FechaVencimiento || '9999-12-31'));
            if (vencimiento) return vencimiento;
            var emision = String(a.FechaEmision || '9999-12-31').localeCompare(String(b.FechaEmision || '9999-12-31'));
            if (emision) return emision;
            return Number(a.ComprobanteID) - Number(b.ComprobanteID);
        }).reduce(function (aplicaciones, factura) {
            var importe = Math.min(Number(factura.SaldoCentavos), restante);
            if (importe > 0) {
                aplicaciones.push({ ComprobanteID: Number(factura.ComprobanteID), ImporteCentavos: importe });
                restante -= importe;
            }
            return aplicaciones;
        }, []);
    }
    function escapar(valor) {
        return String(valor == null ? '' : valor).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    // Error para mostrar (§9): el campo "error" de esta API ya viene redactado para el usuario; el
    // "Message" de Web API solo se muestra cuando rechaza un dato (400 o 409), porque si no es técnico.
    function errorApi(respuesta, json, porDefecto) {
        var texto = json.error;
        if (respuesta.status === 401 && window.SGTL) texto = window.SGTL.mensajeError({ status: 401 }, porDefecto);
        else if (!texto && (respuesta.status === 400 || respuesta.status === 409)) texto = json.mensaje || json.Message;
        var error = new Error(texto || porDefecto);
        error.status = respuesta.status;
        error.mensajeUsuario = error.message;
        return error;
    }
    // Texto del error para el usuario (§9). Un TypeError es una falla técnica (red caída, código).
    function textoError(ex, porDefecto) {
        if (ex && ex.mensajeUsuario) return ex.mensajeUsuario;
        if (ex && ex.message && !(ex instanceof TypeError)) return ex.message;
        return porDefecto;
    }
    function sinConexion() {
        var error = new Error('No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.');
        error.mensajeUsuario = error.message;
        throw error;
    }
    function apiGet(ruta) {
        var headers = { Accept: 'application/json' };
        if (token()) headers.Authorization = 'Bearer ' + token();
        return fetch(API + ruta, { headers: headers }).then(function (respuesta) {
            if (!respuesta.ok) return respuesta.json().catch(function () { return {}; }).then(function (json) {
                throw errorApi(respuesta, json, 'No se pudo consultar el servidor. Probá de nuevo.');
            });
            return respuesta.json();
        }, sinConexion);
    }
    function apiPost(ruta, datos) {
        var jwt = token();
        return fetch(API + ruta, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt },
            body: JSON.stringify(datos)
        }).then(function (respuesta) {
            return respuesta.json().catch(function () { return {}; }).then(function (json) {
                if (!respuesta.ok) throw errorApi(respuesta, json, 'No se pudo completar la operación. Probá de nuevo.');
                return json;
            });
        }, sinConexion);
    }
    function cerrarModalYNotificar(idModal, mensaje) {
        var modal = porId(idModal);
        if (!window.SGTL || typeof window.SGTL.toastExito !== 'function') return;
        if (!modal) {
            window.SGTL.toastExito(mensaje);
            return;
        }
        function notificar() {
            modal.removeEventListener('hidden.bs.modal', notificar);
            window.SGTL.toastExito(mensaje);
        }
        modal.addEventListener('hidden.bs.modal', notificar);
        window.SGTL.modal(modal, 'hide');
    }
    function mostrarFeedbackEnvio(tipo, texto) {
        var aviso = porId('envioComprobanteFeedback');
        aviso.className = 'alert alert-light-' + tipo + ' color-' + tipo;
        aviso.textContent = texto;
    }
    function ocultarFeedbackEnvio() {
        var aviso = porId('envioComprobanteFeedback');
        aviso.className = 'alert d-none';
        aviso.textContent = '';
    }
    function abrirEnvioComprobante(id) {
        if (id != null) comprobanteActualId = Number(id);
        if (!comprobanteActualId) return;
        var idEnvio = comprobanteActualId;
        var version = ++secuenciaEnvioComprobante;
        var boton = porId('btnConfirmarEnvioComprobante');
        var destino = porId('envioComprobanteDestino');
        boton.disabled = true;
        destino.value = '';
        ocultarFeedbackEnvio();
        bootstrap.Modal.getOrCreateInstance(porId('modalEnviarComprobanteEmail')).show();
        apiGet('/comprobantes/' + encodeURIComponent(idEnvio) + '/email').then(function (datos) {
            if (version !== secuenciaEnvioComprobante) return;
            destino.value = datos.DestinatarioSugerido || '';
            if (!datos.Configurado) {
                mostrarFeedbackEnvio('warning', 'Un administrador tiene que elegir el perfil SMTP en Configuración > Gestionar e-mail > Perfil para facturación.');
                return;
            }
            boton.disabled = false;
        }).catch(function (error) {
            if (version !== secuenciaEnvioComprobante) return;
            mostrarFeedbackEnvio('danger', textoError(error, 'No se pudo preparar el envío del comprobante. Probá de nuevo.'));
        });
    }

    function abrirVistaPreviaComprobante(id) {
        if (!window.prepararComprobantePDF) return Promise.reject(new Error('No se pudo preparar el PDF del comprobante.'));
        var version = ++secuenciaVistaPreviaComprobante;
        var marco = porId('vistaPreviaComprobanteDocumento');
        var descarga = porId('descargarVistaPreviaComprobante');
        var imprimir = porId('imprimirVistaPreviaComprobante');
        var feedback = porId('vistaPreviaComprobanteFeedback');
        if (urlVistaPreviaComprobante) {
            URL.revokeObjectURL(urlVistaPreviaComprobante);
            urlVistaPreviaComprobante = null;
        }
        marco.onload = null;
        marco.removeAttribute('src');
        marco.style.display = 'none';
        descarga.removeAttribute('href');
        descarga.removeAttribute('download');
        descarga.classList.add('disabled');
        descarga.setAttribute('aria-disabled', 'true');
        imprimir.disabled = true;
        var item = buscarComprobante(Number(id));
        porId('tituloVistaPreviaComprobante').textContent = 'Ver PDF del comprobante' + (item && item.Comprobante ? ' ' + item.Comprobante : '');
        feedback.className = 'text-center text-muted py-4';
        feedback.textContent = 'Preparando el PDF…';
        modalVistaPreviaComprobante.show();
        return window.prepararComprobantePDF(id).then(function (resultado) {
            if (version !== secuenciaVistaPreviaComprobante) return;
            urlVistaPreviaComprobante = URL.createObjectURL(resultado.blob);
            descarga.href = urlVistaPreviaComprobante;
            descarga.download = resultado.nombreArchivo;
            descarga.classList.remove('disabled');
            descarga.setAttribute('aria-disabled', 'false');
            marco.onload = function () {
                if (version !== secuenciaVistaPreviaComprobante) return;
                feedback.textContent = '';
                imprimir.disabled = false;
            };
            marco.src = urlVistaPreviaComprobante;
            marco.style.display = 'block';
        }).catch(function (error) {
            if (version !== secuenciaVistaPreviaComprobante) return;
            feedback.className = 'alert alert-light-danger color-danger';
            feedback.textContent = textoError(error, 'No se pudo generar el PDF del comprobante. Probá de nuevo.');
        });
    }

    function imprimirVistaPreviaComprobante() {
        try {
            var vista = porId('vistaPreviaComprobanteDocumento').contentWindow;
            vista.focus();
            vista.print();
        } catch (error) {
            var feedback = porId('vistaPreviaComprobanteFeedback');
            feedback.className = 'alert alert-warning';
            feedback.textContent = 'Usá el botón de impresión del visor PDF.';
        }
    }

    function limpiarVistaPreviaComprobante() {
        secuenciaVistaPreviaComprobante += 1;
        var marco = porId('vistaPreviaComprobanteDocumento');
        marco.onload = null;
        marco.removeAttribute('src');
        if (urlVistaPreviaComprobante) {
            URL.revokeObjectURL(urlVistaPreviaComprobante);
            urlVistaPreviaComprobante = null;
        }
    }
    function enviarComprobantePorEmail() {
        if (!comprobanteActualId) return;
        var idEnvio = comprobanteActualId;
        var destino = porId('envioComprobanteDestino').value.trim();
        var campoDestino = porId('envioComprobanteDestino');
        if (!destino || !campoDestino.checkValidity()) {
            campoDestino.reportValidity();
            return;
        }
        if (typeof window.generarComprobantePDFParaEmail !== 'function') {
            mostrarFeedbackEnvio('danger', 'No se pudo preparar el PDF del comprobante. Recargá la página y probá de nuevo.');
            return;
        }
        ocultarFeedbackEnvio();
        var listo = window.SGTL.procesando('#btnConfirmarEnvioComprobante', 'Generando PDF…');
        window.generarComprobantePDFParaEmail(idEnvio).then(function (adjunto) {
            listo();
            listo = window.SGTL.procesando('#btnConfirmarEnvioComprobante', 'Enviando…');
            return apiPost('/comprobantes/' + encodeURIComponent(idEnvio) + '/email', {
                Destinatario: destino,
                PdfBase64: adjunto.PdfBase64
            });
        }).then(function (resultado) {
            listo();
            cerrarModalYNotificar('modalEnviarComprobanteEmail', resultado.mensaje || 'Comprobante enviado.');
        }).catch(function (error) {
            listo();
            mostrarFeedbackEnvio('danger', (error && error.mensajeUsuario) || 'No se pudo enviar el comprobante. Probá de nuevo.');
        });
    }
    function apiPut(ruta, datos) {
        return apiEnviar(ruta, 'PUT', datos);
    }
    function apiDelete(ruta) {
        return apiEnviar(ruta, 'DELETE');
    }
    function apiEnviar(ruta, metodo, datos) {
        var encabezados = { Accept: 'application/json', Authorization: 'Bearer ' + token() };
        if (datos !== undefined) encabezados['Content-Type'] = 'application/json';
        return fetch(API + ruta, {
            method: metodo,
            headers: encabezados,
            body: datos === undefined ? undefined : JSON.stringify(datos)
        }).then(function (respuesta) {
            return respuesta.json().catch(function () { return {}; }).then(function (json) {
                if (!respuesta.ok) throw errorApi(respuesta, json, 'No se pudo completar la operación. Probá de nuevo.');
                return json;
            });
        }, sinConexion);
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
    function etiquetaCliente(item) { return item.RazonSocial + ' — ' + item.CUIT; }
    function clienteFormularioActual(campoId) {
        var id = Number(porId(campoId).value || 0);
        return clientes.find(function (item) { return item.ClienteID === id && item.EstadoCliente; }) || null;
    }
    function seleccionarClienteFormulario(campoId, clienteId) {
        var select = porId(campoId);
        var id = Number(clienteId || 0);
        select.value = id ? String(id) : '';
        if (id && !select.value) {
            var cliente = clientes.find(function (item) { return item.ClienteID === id; });
            if (cliente) {
                var opcion = document.createElement('option');
                opcion.value = String(cliente.ClienteID);
                opcion.textContent = etiquetaCliente(cliente);
                opcion.disabled = !cliente.EstadoCliente;
                select.appendChild(opcion);
                select.value = opcion.value;
            }
        }
        window.SelectClientePredictivo.sincronizar(select);
    }
    function clienteComprobanteActual() { return clienteFormularioActual('cmpCliente'); }
    function clienteReciboActual() { return clienteFormularioActual('reciboCliente'); }
    function poblarClientesComprobante(clienteId) {
        seleccionarClienteFormulario('cmpCliente', clienteId);
    }
    function sumarDiasAFechaIso(fechaIso, dias) {
        var partes = String(fechaIso || '').split('-');
        if (partes.length !== 3) return '';
        var fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        if (isNaN(fecha.getTime())) return '';
        fecha.setDate(fecha.getDate() + dias);
        return fechaIsoLocal(fecha);
    }
    function actualizarVencimientoPredeterminado() {
        if (comprobanteTipo === 'NC' || vencimientoComprobanteEditado) return;
        ponerFecha('cmpFechaVencimiento', sumarDiasAFechaIso(porId('cmpFechaEmision').value, 10));
    }
    function esConsultaGeneral() { return !clienteActual(); }
    function badgeEstado(estado) {
        return window.SGTL.estado(estado);
    }
    function tipoComprobante(item) {
        var tipo = String((item && item.Tipo) || '').trim().toUpperCase();
        if (tipo) return tipo;
        var coincidencia = /^([A-Z0-9]+)-/.exec(String((item && item.Comprobante) || '').toUpperCase());
        return coincidencia ? coincidencia[1] : '';
    }
    function estadoRecibo(item) {
        return String(item.EstadoComprobante || item.EstadoDocumental || item.Estado || 'EMITIDO').toUpperCase();
    }
    // Botones de cada fila (§1.4): Enviar por e-mail va después de Ver PDF para todos los comprobantes.
    // Lo que no se puede hacer queda deshabilitado con el motivo en el tooltip.
    function accionesComprobante(item) {
        var tipo = tipoComprobante(item);
        var id = Number(item.ComprobanteID);
        var esRecibo = tipo === 'REC';
        var anulado = esRecibo && estadoRecibo(item) === 'ANULADO';
        // El comprobante de la fila dentro del motivo, en minúscula (§9): "la factura", "la nota de crédito".
        var nombre = { FAC: 'la factura', REC: 'el recibo', NC: 'la nota de crédito', ND: 'la nota de débito' }[tipo] || 'el comprobante';
        // Pendientes solo devuelve comprobantes emitidos; Estado es financiero, no documental.
        var estadoDocumental = String(item.EstadoComprobante || item.EstadoDocumental || 'EMITIDO').trim().toUpperCase();
        var femenino = tipo === 'FAC' || tipo === 'NC' || tipo === 'ND';
        var motivoEnvio = !tipo
            ? 'No se puede enviar el comprobante por e-mail: no tiene un tipo identificado'
            : 'No se puede enviar ' + nombre + ' por e-mail: ' + (estadoDocumental === 'ANULADO'
                ? 'está anulad' : 'todavía no está emitid') + (femenino ? 'a' : 'o');
        return window.SGTL.accionesFila([
            window.SGTL.botonFila('ver', { id: id, datos: { tipo: tipo } }),
            window.SGTL.botonFila('editar', {
                id: id, texto: 'Editar recibo', deshabilitado: !esRecibo || anulado,
                motivo: anulado ? 'No se puede editar el recibo: está anulado' : 'No se puede editar ' + nombre + ': solo se editan los recibos'
            }),
            window.SGTL.botonFila('pdf', { id: id, texto: 'Ver PDF', deshabilitado: !tipo, motivo: 'No se puede ver el PDF: este tipo de comprobante no tiene' }),
            window.SGTL.botonFila('enviar', { id: id, deshabilitado: !tipo || estadoDocumental !== 'EMITIDO', motivo: motivoEnvio }),
            anulado
                ? window.SGTL.botonFila('eliminar', { id: id, texto: 'Eliminar recibo' })
                : window.SGTL.botonFila('anular', {
                    id: id, texto: 'Anular recibo', deshabilitado: !esRecibo,
                    motivo: 'No se puede anular ' + nombre + ': ' + (tipo && tipo !== 'REC' && tipo !== 'NC' && tipo !== 'ND' ? 'se corrige con una nota de crédito' : 'solo se anulan los recibos')
                })
        ]);
    }
    function mostrarCarga() {
        window.SGTL.tabla.cargando('#ccTablaCuerpo', 10);
    }
    function mostrarError(error) {
        console.error(error);
        window.SGTL.tabla.vacia('#ccTablaCuerpo', 10, 'No se pudo cargar la cuenta corriente.');
        window.SGTL.tabla.paginacion('#ccPagination', { total: 0 });
        window.SGTL.toastError(textoError(error, 'No se pudo cargar la cuenta corriente. Probá de nuevo.'));
    }

    function cargarClientes() {
        return apiGet('/cuenta-corriente/clientes').then(function (datos) {
            clientes = datos || [];
            var select = porId('ccCliente');
            var opcionesClientes = clientes.filter(function (item) {
                return item.EstadoCliente;
            }).map(function (item) {
                return '<option value="' + item.ClienteID + '">' + escapar(item.RazonSocial + ' — ' + item.CUIT) + '</option>';
            }).join('');
            select.innerHTML = '<option value="">Todos los clientes</option>' + opcionesClientes;
            porId('cmpCliente').innerHTML = '<option value="">Seleccioná un cliente</option>' + opcionesClientes;
            porId('reciboCliente').innerHTML = '<option value="">Seleccioná un cliente</option>' + opcionesClientes;
            // La consulta siempre inicia sin cliente: el usuario puede limitarla desde el filtro.
            select.value = '';
            select.disabled = false;
            window.SelectClientePredictivo.inicializar(select, { placeholder: 'Todos los clientes' });
            window.SelectClientePredictivo.inicializar('cmpCliente', { placeholder: 'Seleccioná un cliente' });
            window.SelectClientePredictivo.inicializar('reciboCliente', { placeholder: 'Seleccioná un cliente' });
        });
    }
    function parametrosMovimientos() {
        var parametros = new URLSearchParams();
        ['Desde', 'Hasta', 'Tipo', 'Estado'].forEach(function (nombre) {
            var valor = porId('cc' + nombre).value;
            if (valor) parametros.set(nombre.toLowerCase(), valor);
        });
        parametros.set('page', String(paginaActual));
        parametros.set('pageSize', String(tamanioPagina));
        return parametros.toString();
    }
    function tamanioPaginaPara(total) {
        return tamanioPagina === 0 ? Math.max(Number(total) || 0, 1) : tamanioPagina;
    }
    function cargarCuenta(pagina) {
        if (pagina != null) paginaActual = Math.max(1, Number(pagina) || 1);
        var cliente = clienteActual();
        mostrarCarga();
        var rutas = cliente ? {
            saldo: '/clientes/' + cliente.ClienteID + '/saldo',
            movimientos: '/clientes/' + cliente.ClienteID + '/cuenta-corriente?' + parametrosMovimientos(),
            pendientes: '/clientes/' + cliente.ClienteID + '/comprobantes-pendientes'
        } : {
            saldo: '/cuenta-corriente/saldo',
            movimientos: '/cuenta-corriente/movimientos?' + parametrosMovimientos(),
            pendientes: '/cuenta-corriente/pendientes'
        };
        return Promise.all([
            apiGet(rutas.saldo), apiGet(rutas.movimientos), apiGet(rutas.pendientes)
        ]).then(function (resultados) {
            resumen = resultados[0]; movimientos = resultados[1].items || []; pendientes = resultados[2] || [];
            paginacionMovimientos = {
                total: Number(resultados[1].total || 0),
                totalPages: Number(resultados[1].totalPages || 0)
            };
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
        var mostrarCliente = esConsultaGeneral();
        porId('ccTablaCabecera').innerHTML = '<tr><th class="cc-toggle-column"><span class="visually-hidden">Desplegar</span></th>' +
            '<th class="text-center">Fecha</th>' + (mostrarCliente ? '<th>Cliente</th>' : '') + '<th>Comprobante</th><th>Concepto</th><th class="text-end">Total</th>' +
            '<th class="text-end">Cancelado</th><th class="text-end">Saldo</th>' +
            '<th class="text-center">Estado</th><th class="text-center">Acciones</th></tr>';
        if (!movimientos.length) {
            window.SGTL.tabla.vacia('#ccTablaCuerpo', mostrarCliente ? 10 : 9);
            return;
        }
        porId('ccTablaCuerpo').innerHTML = movimientos.map(function (item, indice) {
            var aplicaciones = item.Aplicaciones || [];
            var control = aplicaciones.length
                ? '<button type="button" class="btn btn-sm btn-link cc-toggle-applications" data-parent="' + Number(item.ComprobanteID) +
                    '" aria-expanded="false" aria-label="Mostrar comprobantes aplicados a ' + escapar(item.Comprobante) +
                    '"><i class="bi bi-chevron-down"></i></button>'
                : '';
            var filaPrincipal = '<tr class="cc-parent-row' + (indice % 2 ? '' : ' cc-fila-rayada') + '"><td class="text-center">' + control + '</td><td class="text-center">' + fecha(item.Fecha) +
                '</td>' + (mostrarCliente ? '<td>' + escapar(item.Cliente || '—') + '</td>' : '') + '<td class="cc-document">' + escapar(item.Comprobante) + '</td><td>' + escapar(item.Concepto) +
                '</td><td class="cc-money">' + dinero(item.Debe) + '</td><td class="cc-money cc-credit">' +
                dinero(item.Cancelado) + '</td><td class="cc-money cc-debit fw-bold">' + dinero(item.Saldo) +
                '</td><td class="text-center">' + badgeEstado(item.Estado) + '</td><td class="text-center">' +
                accionesComprobante(item) + '</td></tr>';
            var saldoProgresivo = Number(item.Debe || 0);
            var filasAplicaciones = aplicaciones.map(function (aplicacion, posicion) {
                saldoProgresivo = Math.max(0, saldoProgresivo - Number(aplicacion.Importe || 0));
                aplicacion.Saldo = saldoProgresivo;
                var claseCreditoAplicado = aplicacion.Tipo === 'REC' || aplicacion.Tipo === 'NC'
                    ? ' cc-credit-application-row' : '';
                // La última aplicación cierra el grupo de la factura (línea más marcada debajo).
                var claseUltima = posicion === aplicaciones.length - 1 ? ' cc-application-last' : '';
                return '<tr class="cc-application-row' + claseCreditoAplicado + claseUltima + ' d-none" data-parent="' + Number(item.ComprobanteID) + '">' +
                    '<td></td><td class="text-center cc-dato-aplicado">' + fecha(aplicacion.Fecha) + '</td>' +
                    (mostrarCliente ? '<td class="cc-dato-aplicado">' + escapar(aplicacion.Cliente || item.Cliente || '—') + '</td>' : '') + '<td class="cc-document cc-application-document">' +
                    '<i class="bi bi-arrow-return-right me-2" aria-hidden="true"></i>' + escapar(aplicacion.Comprobante) +
                    '</td><td class="cc-dato-aplicado">' + escapar(aplicacion.Concepto || 'Aplicación a ' + item.Comprobante) + '</td>' +
                    '<td class="cc-money">—</td><td class="cc-money cc-credit">' + dinero(aplicacion.Importe) +
                    '</td><td class="cc-money fw-bold">' + dinero(saldoProgresivo) + '</td><td class="text-center">' +
                    badgeEstado(aplicacion.Estado || 'Aplicado') + '</td><td class="text-center">' +
                    accionesComprobante(aplicacion) + '</td></tr>';
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
        var todasLasFilas = pendientesFiltrados();
        var tamanio = tamanioPaginaPara(todasLasFilas.length);
        var inicio = (paginaActual - 1) * tamanio;
        var filas = todasLasFilas.slice(inicio, inicio + tamanio);
        var mostrarCliente = esConsultaGeneral();
        porId('ccTablaCabecera').innerHTML = '<tr>' + (mostrarCliente ? '<th>Cliente</th>' : '') + '<th>Comprobante</th><th class="text-center">Emisión</th><th class="text-center">Vencimiento</th>' +
            '<th class="text-end">Importe original</th><th class="text-end">Aplicado</th><th class="text-end">Saldo pendiente</th>' +
            '<th>Situación</th><th class="text-center">Estado</th><th class="text-center">Acciones</th></tr>';
        if (!filas.length) {
            window.SGTL.tabla.vacia('#ccTablaCuerpo', mostrarCliente ? 10 : 9);
            return;
        }
        window.SGTL.tabla.llenar('#ccTablaCuerpo', filas.map(function (item, indice) {
            return '<tr' + (indice % 2 ? '' : ' class="cc-fila-rayada"') + '>' + (mostrarCliente ? '<td>' + escapar(item.Cliente || '—') + '</td>' : '') + '<td class="cc-document">' + escapar(item.Comprobante) + '</td><td class="text-center">' + fecha(item.FechaEmision) + '</td>' +
                '<td class="text-center">' + fecha(item.FechaVencimiento) + '</td><td class="cc-money">' + dinero(item.ImporteOriginal) + '</td>' +
                '<td class="cc-money cc-credit">' + dinero(item.ImporteAplicado) + '</td><td class="cc-money cc-debit fw-bold">' +
                dinero(item.SaldoPendiente) + '</td><td>' + escapar(item.Situacion) + '</td><td class="text-center">' + badgeEstado(item.Estado) + '</td>' +
                '<td class="text-center">' + accionesComprobante(item) + '</td></tr>';
        }).join(''));
    }
    function totalPaginasActual() {
        if (vistaActual === 'pendientes') return Math.ceil(pendientesFiltrados().length / tamanioPaginaPara(pendientesFiltrados().length));
        return paginacionMovimientos.totalPages;
    }
    function renderPaginacion() {
        var contenedor = porId('ccPagination');
        var total = vistaActual === 'pendientes' ? pendientesFiltrados().length : paginacionMovimientos.total;
        var totalPaginas = Math.max(1, totalPaginasActual());
        if (paginaActual > totalPaginas) paginaActual = totalPaginas;
        // Paginador compartido (§2.2): sin resultados no se muestra.
        window.SGTL.tabla.paginacion(contenedor, {
            pagina: paginaActual,
            tamanioPagina: tamanioPagina,
            total: total,
            alCambiarTamanio: function (nuevoTamanio) {
                tamanioPagina = nuevoTamanio;
                paginaActual = 1;
                if (vistaActual === 'pendientes') {
                    renderTabla();
                    renderPaginacion();
                } else {
                    cargarCuenta(1);
                }
            }
        });
    }
    function renderTabla() { if (vistaActual === 'pendientes') renderPendientes(); else renderMovimientos(); }
    function renderTodo() { renderResumen(); renderTabla(); renderPaginacion(); }
    function cambiarVista(nuevaVista) {
        vistaActual = nuevaVista;
        paginaActual = 1;
        document.querySelectorAll('.cc-tab').forEach(function (tab) {
            var activa = tab.getAttribute('data-view') === vistaActual;
            tab.classList.toggle('active', activa); tab.setAttribute('aria-selected', activa ? 'true' : 'false');
        });
        renderTabla();
        renderPaginacion();
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
    // Detalle chico: solo para movimientos sin un tipo de comprobante identificable.
    function abrirDetalle(id) {
        var item = buscarComprobante(Number(id));
        if (!item) return;
        comprobanteActualId = Number(id);
        var importe = item.ImporteOriginal || item.Debe || item.Haber;
        var saldo = item.SaldoPendiente == null ? item.Saldo : item.SaldoPendiente;
        porId('modalDetalleTitulo').textContent = 'Ver detalle del comprobante ' + item.Comprobante;
        porId('modalDetalleCuerpo').innerHTML = '<div class="row g-3 mb-3">' +
            '<div class="col-md-4"><small class="text-muted d-block">Fecha</small><strong>' + fecha(item.FechaEmision || item.Fecha) + '</strong></div>' +
            '<div class="col-md-4"><small class="text-muted d-block">Importe</small><strong>' + dinero(importe) + '</strong></div>' +
            '<div class="col-md-4"><small class="text-muted d-block">Estado financiero</small>' + badgeEstado(item.Estado) + '</div>' +
            '<div class="col-md-4"><small class="text-muted d-block">Saldo</small><strong>' + dinero(saldo) + '</strong></div></div>' +
            '<div class="sgtl-bloque-titulo">Trazabilidad</div><div class="cc-trace-item"><div class="cc-trace-title">Origen</div>' +
            '<div class="cc-trace-text">' + escapar(item.Origen || 'Comprobante directo') + '</div></div>';
        bootstrap.Modal.getOrCreateInstance(porId('modalDetalleComprobante')).show();
    }

    // % de IVA para la vista en solo lectura: va en cada línea del detalle; si todas tienen el mismo, se muestra. Sin
    // detalle (factura directa) sale de IVA ÷ neto, solo si da una alícuota válida. Si no, "—".
    function porcentajeIvaLectura(comprobante) {
        var alicuotas = [0, 10.5, 21, 27];
        var distintos = (comprobante.Detalle || []).map(function (linea) { return Number(linea.IvaPct); })
            .filter(function (n, i, lista) { return isFinite(n) && lista.indexOf(n) === i; });
        var porcentaje = distintos.length === 1 ? distintos[0] : null;
        if (porcentaje == null && !distintos.length && Number(comprobante.Neto) > 0) {
            var calculado = Math.round(Number(comprobante.IVA || 0) / Number(comprobante.Neto) * 1000) / 10;
            if (alicuotas.indexOf(calculado) !== -1) porcentaje = calculado;
        }
        return porcentaje == null ? '—' : String(porcentaje).replace('.', ',') + '%';
    }
    function presentarComprobanteSoloLectura(comprobante) {
        var tipo = tipoComprobante(comprobante);
        porId('cmpTitulo').textContent = 'Ver ' + nombreTipoComprobante(tipo) + ' ' + (comprobante.Numero || '');
        porId('cmpTipoSeleccionGrupo').classList.add('d-none');
        porId('cmpTipoFijoGrupo').classList.remove('d-none');
        var mensaje = porId('cmpMensaje');
        mensaje.className = 'alert alert-info py-2';
        mensaje.textContent = 'Consulta de solo lectura. Los datos del comprobante no se pueden modificar.';
        var cliente = porId('cmpCliente');
        cliente.innerHTML = '<option value="' + Number(comprobante.ClienteID || 0) + '">' +
            escapar((comprobante.RazonSocial || 'Cliente') + (comprobante.CUIT ? ' — ' + comprobante.CUIT : '')) + '</option>';
        cliente.value = String(Number(comprobante.ClienteID || 0));
        window.SelectClientePredictivo.sincronizar(cliente);
        ponerFecha('cmpFechaEmision', String(comprobante.FechaEmision || '').substring(0, 10));
        ponerFecha('cmpFechaVencimiento', String(comprobante.FechaVencimiento || '').substring(0, 10));
        porId('cmpTipoComprobante').textContent = comprobante.TipoDescripcion || '';
        porId('cmpLetra').innerHTML = '<option value="' + escapar(comprobante.Letra || '') + '">' + escapar(comprobante.Letra || '—') + '</option>';
        porId('cmpLetra').value = comprobante.Letra || '';
        porId('cmpSucursal').innerHTML = '<option value="' + escapar(comprobante.Sucursal || '') + '">' + escapar(comprobante.Sucursal || '—') + '</option>';
        porId('cmpSucursal').value = comprobante.Sucursal || '';
        porId('cmpNumeroComprobante').value = comprobante.Numero || '';
        porId('cmpConcepto').value = comprobante.Concepto || '';
        porId('cmpNeto').value = formatearCentavos(centavos(comprobante.Neto));
        porId('cmpIvaPct').innerHTML = '<option value="">' + escapar(porcentajeIvaLectura(comprobante)) + '</option>';
        porId('cmpIvaPct').value = '';
        porId('cmpIvaImporte').value = formatearCentavos(centavos(comprobante.IVA));
        porId('cmpOtros').value = formatearCentavos(centavos(comprobante.OtrosImpuestos));
        porId('cmpTotal').textContent = dinero(comprobante.Total);
        porId('cmpObservaciones').value = comprobante.Observaciones || '';
        porId('cmpError').textContent = '';
        porId('cmpVencimientoGrupo').classList.toggle('d-none', !comprobante.FechaVencimiento);
        porId('cmpReferenciaGrupo').classList.add('d-none');
        porId('cmpAplicacionesGrupo').classList.add('d-none');
        var relaciones = [];
        if (comprobante.ProformaNumero) relaciones.push('<div class="col-md-6"><label class="form-label">Proforma</label><input class="form-control" disabled value="' + escapar(comprobante.ProformaNumero) + '"></div>');
        if (comprobante.ComprobanteReferenciaNumero) relaciones.push('<div class="col-md-6"><label class="form-label">Comprobante relacionado</label><input class="form-control" disabled value="' + escapar(comprobante.ComprobanteReferenciaNumero) + '"></div>');
        var bloqueRelacion = porId('cmpSoloLecturaRelacion');
        bloqueRelacion.classList.toggle('d-none', !relaciones.length);
        bloqueRelacion.innerHTML = relaciones.length ? '<div class="row g-3">' + relaciones.join('') + '</div>' : '';
        var detalle = comprobante.Detalle || [];
        porId('cmpDetalleLecturaCuerpo').innerHTML = detalle.map(function (linea) {
            return '<tr><td>' + escapar(linea.Concepto || '') + (linea.Descripcion ? '<div class="small text-muted">' + escapar(linea.Descripcion) + '</div>' : '') +
                '</td><td class="text-end">' + escapar(linea.Cantidad) + '</td><td>' + escapar(linea.Unidad || '') + '</td><td class="text-end">' + dinero(linea.Total) + '</td></tr>';
        }).join('') || '<tr><td colspan="4" class="cc-empty">El comprobante no tiene detalle.</td></tr>';
        porId('cmpDetalleLectura').classList.remove('d-none');
        var aplicaciones = comprobante.ComprobantesCancelados || [];
        porId('cmpAplicacionesLecturaCuerpo').innerHTML = aplicaciones.map(function (aplicacion) {
            return '<tr><td>' + escapar(aplicacion.Numero || '') + '</td><td>' + fecha(aplicacion.FechaEmision) + '</td><td>' + escapar(aplicacion.Concepto || '') + '</td><td class="text-end">' + dinero(aplicacion.ImporteAplicado) + '</td></tr>';
        }).join('');
        porId('cmpAplicacionesLectura').classList.toggle('d-none', !aplicaciones.length);
        porId('modalNuevoComprobante').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = true; });
        window.SelectClientePredictivo.establecerDeshabilitado('cmpCliente', true);
        porId('btnEmitirComprobante').classList.add('d-none');
        porId('btnCerrarComprobante').textContent = 'Cerrar';
        porId('modalNuevoComprobante').classList.toggle('cc-solo-lectura', true);
        bootstrap.Modal.getOrCreateInstance(porId('modalNuevoComprobante')).show();
    }

    function presentarReciboSoloLectura(recibo) {
        porId('modalNuevoReciboTitulo').textContent = 'Ver recibo ' + (recibo.Numero || '');
        // El subtítulo es del alta: al ver o editar un recibo no va (reprueba de la VM del 23/10).
        porId('modalNuevoReciboSubtitulo').classList.add('d-none');
        ponerFecha('reciboFecha', String(recibo.Fecha || '').substring(0, 10));
        seleccionarClienteFormulario('reciboCliente', recibo.ClienteID);
        porId('reciboTipoComprobante').textContent = recibo.TipoDescripcion || '';
        porId('reciboLetra').innerHTML = '<option value="' + escapar(recibo.Letra || '') + '">' + escapar(recibo.Letra || '—') + '</option>';
        porId('reciboSucursal').innerHTML = '<option value="' + escapar(recibo.Sucursal || '') + '">' + escapar(recibo.Sucursal || '—') + '</option>';
        porId('reciboNumeroComprobante').value = recibo.Numero || recibo.NumeroComprobante || '';
        porId('reciboFormaPago').value = ({ TRANSFERENCIA: 'Transferencia', EFECTIVO: 'Efectivo', CHEQUE: 'Cheque', OTRO: 'Otro' })[String(recibo.FormaPago || '').toUpperCase()] || 'Otro';
        porId('reciboReferencia').value = recibo.Referencia || '';
        window.SGTL.limpiarError(porId('reciboReferencia'));
        actualizarReferenciaRecibo();
        porId('reciboFormaImporte').value = formatearCentavos(centavos(recibo.Total));
        porId('reciboObservaciones').value = recibo.Observaciones || '';
        renderAplicacionesReciboEdicion(recibo.Aplicaciones);
        porId('reciboResumenTotal').textContent = dinero(recibo.Total);
        porId('reciboResumenAplicado').textContent = dinero((recibo.Aplicaciones || []).reduce(function (total, item) { return total + Number(item.Importe || 0); }, 0));
        porId('reciboResumenDiferencia').textContent = dinero(0);
        var mensaje = porId('reciboMensaje');
        mensaje.className = 'alert alert-info py-2';
        mensaje.textContent = 'Consulta de solo lectura. Los datos del recibo no se pueden modificar.';
        porId('reciboError').textContent = '';
        porId('modalNuevoRecibo').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = true; });
        window.SelectClientePredictivo.establecerDeshabilitado('reciboCliente', true);
        porId('btnDistribuirRecibo').classList.add('d-none');
        porId('btnEmitirRecibo').classList.add('d-none');
        // Solo lectura: el pie es solo "Cerrar" (§6.2), como en Ver factura.
        porId('btnCerrarRecibo').textContent = 'Cerrar';
        porId('modalNuevoRecibo').classList.toggle('cc-solo-lectura', true);
        bootstrap.Modal.getOrCreateInstance(porId('modalNuevoRecibo')).show();
    }

    function abrirComprobanteSoloLectura(id, tipo) {
        if (tipo === 'REC') {
            apiGet('/recibos/' + Number(id)).then(presentarReciboSoloLectura).catch(function (ex) {
                window.SGTL.toastError(textoError(ex, 'No se pudo abrir el recibo. Probá de nuevo.'));
            });
            return;
        }
        apiGet('/comprobantes/' + Number(id)).then(presentarComprobanteSoloLectura).catch(function (ex) {
            window.SGTL.toastError(textoError(ex, 'No se pudo abrir el comprobante. Probá de nuevo.'));
        });
    }

    // El ojo de la fila (§1.4) abre el comprobante completo en solo lectura, como en proformas.
    function verComprobante(id, tipo) {
        if (tipo) abrirComprobanteSoloLectura(id, tipo);
        else abrirDetalle(id);
    }

    function renderAplicacionesReciboEdicion(aplicaciones) {
        porId('reciboFacturas').innerHTML = (aplicaciones || []).map(function (item) {
            return '<tr><td><input type="checkbox" class="form-check-input" checked disabled></td>' +
                '<td class="cc-document">' + escapar(item.Comprobante) + '</td><td class="text-center">' + fecha(item.FechaVencimiento) + '</td>' +
                '<td class="text-end">' + dinero(item.ImporteOriginal) + '</td><td class="text-end">—</td>' +
                '<td class="text-end fw-bold">' + dinero(item.Importe) + '</td></tr>';
        }).join('') || '<tr><td colspan="6" class="cc-empty">El recibo no tiene comprobantes aplicados.</td></tr>';
    }

    function abrirEditarRecibo(id) {
        var error = porId('reciboError');
        error.textContent = '';
        apiGet('/recibos/' + id).then(function (recibo) {
            return cargarConfiguracionEmision('REC', {
                tipo: 'reciboTipoComprobante', letra: 'reciboLetra', sucursal: 'reciboSucursal', numero: 'reciboNumeroComprobante'
            }, {
                letra: recibo.Letra || '', sucursal: recibo.Sucursal || '', numero: recibo.NumeroComprobante || ''
            }).then(function () { return recibo; });
        }).then(function (recibo) {
            if (String(recibo.Estado || '').toUpperCase() !== 'EMITIDO') throw new Error('Solo se pueden editar recibos emitidos.');
            reciboEditandoId = Number(id);
            reciboEditando = recibo;
            reciboOperacion = null;
            porId('modalNuevoReciboTitulo').textContent = 'Editar recibo ' + (recibo.Numero || '');
            porId('modalNuevoReciboSubtitulo').classList.add('d-none');
            limitarFecha('reciboFecha', 'maxDate', hoyIso());
            ponerFecha('reciboFecha', String(recibo.Fecha || '').substring(0, 10));
            seleccionarClienteFormulario('reciboCliente', recibo.ClienteID);
            var formaVisual = {
                TRANSFERENCIA: 'Transferencia', EFECTIVO: 'Efectivo', CHEQUE: 'Cheque', OTRO: 'Otro'
            }[String(recibo.FormaPago || '').toUpperCase()] || 'Transferencia';
            porId('reciboFormaPago').value = formaVisual;
            porId('reciboReferencia').value = recibo.Referencia || '';
            window.SGTL.limpiarError(porId('reciboReferencia'));
            actualizarReferenciaRecibo();
            porId('reciboFormaImporte').value = formatearCentavos(centavos(recibo.Total));
            porId('reciboObservaciones').value = recibo.Observaciones || '';
            window.SelectClientePredictivo.establecerDeshabilitado('reciboCliente', true);
            habilitarFecha('reciboFecha', true);
            porId('reciboLetra').disabled = true;
            porId('reciboSucursal').disabled = false;
            porId('reciboNumeroComprobante').disabled = false;
            porId('reciboNumeroComprobante').readOnly = true;
            porId('reciboFormaPago').disabled = false;
            porId('reciboReferencia').disabled = false;
            porId('reciboFormaImporte').readOnly = true;
            porId('reciboObservaciones').disabled = false;
            renderAplicacionesReciboEdicion(recibo.Aplicaciones);
            porId('reciboResumenTotal').textContent = dinero(recibo.Total);
            porId('reciboResumenAplicado').textContent = dinero(recibo.Total);
            porId('reciboResumenDiferencia').textContent = dinero(0);
            var mensaje = porId('reciboMensaje');
            mensaje.className = 'alert alert-info py-2';
            mensaje.textContent = 'Podés modificar la fecha, la forma de pago, la referencia y las observaciones. Las imputaciones y el importe no cambian.';
            var boton = porId('btnEmitirRecibo');
            boton.disabled = false;
            boton.classList.remove('d-none');
            boton.innerHTML = '<i class="bi bi-check-circle me-1" aria-hidden="true"></i>Guardar';
            porId('btnCerrarRecibo').textContent = 'Cancelar';
            porId('modalNuevoRecibo').classList.toggle('cc-solo-lectura', false);
            bootstrap.Modal.getOrCreateInstance(porId('modalNuevoRecibo')).show();
        }).catch(function (ex) {
            window.SGTL.toastError(textoError(ex, 'No se pudo abrir el recibo. Probá de nuevo.'));
        });
    }

    function guardarEdicionRecibo() {
        var error = porId('reciboError');
        var fechaRecibo = porId('reciboFecha').value;
        var forma = porId('reciboFormaPago').value;
        var referencia = porId('reciboReferencia').value.trim();
        error.textContent = '';
        if (!fechaRecibo) { error.textContent = 'Completá la fecha del recibo.'; return; }
        if (fechaRecibo > hoyIso()) { error.textContent = 'La fecha del recibo no puede ser futura.'; return; }
        if (!validarReferenciaRecibo()) return;
        var listo = window.SGTL.procesando('#btnEmitirRecibo');
        apiPut('/recibos/' + reciboEditandoId, {
            Fecha: fechaRecibo,
            Letra: porId('reciboLetra').value || null,
            Sucursal: porId('reciboSucursal').value || null,
            FormaPago: forma,
            Referencia: referencia || null,
            Observaciones: porId('reciboObservaciones').value.trim() || null
        }).then(function (recibo) {
            listo();
            reciboEditandoId = null;
            reciboEditando = null;
            cerrarModalYNotificar('modalNuevoRecibo', recibo && recibo.Numero ? 'Recibo ' + recibo.Numero + ' guardado.' : 'Recibo guardado.');
            cargarCuenta(paginaActual);
        }).catch(function (ex) {
            listo();
            error.textContent = textoError(ex, 'No se pudo guardar el recibo. Probá de nuevo.');
        });
    }

    function nombreComprobanteActual() {
        var item = buscarComprobante(Number(comprobanteActualId));
        return item && item.Comprobante ? 'el recibo ' + item.Comprobante : 'el recibo';
    }
    // Anular y eliminar se confirman con el modal compartido (§5.2).
    function anularReciboActual(id) {
        if (id != null) comprobanteActualId = Number(id);
        if (!comprobanteActualId) return;
        var id = comprobanteActualId;
        window.SGTL.confirmar({
            titulo: '¿Anular ' + nombreComprobanteActual() + '?',
            mensaje: 'Queda anulado (conserva su número) y los comprobantes que cancelaba vuelven a tener saldo pendiente. No se puede deshacer.',
            verbo: 'Anular',
            peligro: true,
            motivo: { etiqueta: 'Motivo de la anulación', obligatorio: true },
            accion: function (motivo) {
                return apiPost('/recibos/' + id + '/anular', { Motivo: motivo });
            }
        }).then(function (hecho) {
            if (!hecho) return;
            window.SGTL.toastExito('Recibo anulado.');
            cargarCuenta(paginaActual);
        });
    }

    function eliminarReciboActual(id) {
        if (id != null) comprobanteActualId = Number(id);
        if (!comprobanteActualId) return;
        var id = comprobanteActualId;
        window.SGTL.confirmar({
            titulo: '¿Eliminar ' + nombreComprobanteActual() + '?',
            mensaje: 'Se borra definitivamente. No se puede deshacer.',
            verbo: 'Eliminar',
            peligro: true,
            accion: function () {
                return apiDelete('/recibos/' + id);
            }
        }).then(function (hecho) {
            if (!hecho) return;
            window.SGTL.toastExito('Recibo eliminado.');
            cargarCuenta(paginaActual);
        });
    }

    function cargarFacturasRecibo() {
        var cliente = clienteReciboActual();
        if (!cliente) {
            porId('reciboFacturas').innerHTML = '<tr><td colspan="6" class="cc-empty">Seleccioná un cliente para ver sus comprobantes pendientes.</td></tr>';
            actualizarResumenRecibo();
            return Promise.resolve();
        }
        porId('reciboFacturas').innerHTML = '<tr><td colspan="6" class="cc-empty">Cargando…</td></tr>';
        return apiGet('/clientes/' + cliente.ClienteID + '/comprobantes-pendientes').then(function (comprobantes) {
            var clienteFormulario = clienteReciboActual();
            if (!clienteFormulario || clienteFormulario.ClienteID !== cliente.ClienteID) return;
            var comprobantesDeuda = (comprobantes || []).filter(function (item) {
                return item.Tipo !== 'REC' && centavos(item.SaldoPendiente) > 0;
            });
            porId('reciboFacturas').innerHTML = comprobantesDeuda.map(function (item) {
                return '<tr><td><input type="checkbox" class="form-check-input cc-recibo-check" data-id="' + Number(item.ComprobanteID) + '"></td>' +
                    '<td class="cc-document">' + escapar(item.Comprobante) + '</td><td class="text-center">' + fecha(item.FechaVencimiento) + '</td>' +
                    '<td class="text-end">' + dinero(item.ImporteOriginal) + '</td><td class="text-end fw-bold">' + dinero(item.SaldoPendiente) + '</td>' +
                    '<td class="text-end"><input type="text" inputmode="decimal" class="form-control form-control-sm text-end cc-allocation-input cc-recibo-aplicar" ' +
                    'data-id="' + Number(item.ComprobanteID) + '" data-pendiente="' + Number(item.SaldoPendiente) + '" ' +
                    'data-pendiente-centavos="' + centavos(item.SaldoPendiente) + '" data-vencimiento="' + escapar(item.FechaVencimiento || '') + '" ' +
                    'data-emision="' + escapar(item.FechaEmision || '') + '" disabled value="0,00"></td></tr>';
            }).join('') || '<tr><td colspan="6" class="cc-empty">El cliente no tiene comprobantes pendientes.</td></tr>';
            porId('reciboFacturas').querySelectorAll('.cc-recibo-aplicar').forEach(enlazarMascaraMonto);
            actualizarResumenRecibo();
        }).catch(function (ex) {
            porId('reciboFacturas').innerHTML = '<tr><td colspan="6" class="cc-empty">No se pudieron cargar los comprobantes pendientes.</td></tr>';
            porId('reciboError').textContent = textoError(ex, 'No se pudieron cargar los comprobantes pendientes. Probá de nuevo.');
            actualizarResumenRecibo();
        });
    }
    function actualizarResumenRecibo(recalcularImporte) {
        var aplicado = 0;
        document.querySelectorAll('.cc-recibo-aplicar').forEach(function (input) {
            if (!input.disabled) aplicado += centavos(input.value);
        });
        var importe = porId('reciboFormaImporte');
        if (recalcularImporte !== false) importe.value = formatearCentavos(aplicado);
        var total = centavos(importe.value);
        porId('reciboResumenTotal').textContent = dinero(total / 100);
        porId('reciboResumenAplicado').textContent = dinero(aplicado / 100);
        porId('reciboResumenDiferencia').textContent = dinero((total - aplicado) / 100);
    }
    function distribuirRecibo() {
        var importe = centavos(porId('reciboFormaImporte').value);
        if (importe <= 0) {
            porId('reciboError').textContent = 'Ingresá el importe que querés distribuir.';
            return;
        }
        var filas = Array.prototype.slice.call(document.querySelectorAll('#reciboFacturas tr'));
        var facturas = filas.map(function (fila) {
            var input = fila.querySelector('.cc-recibo-aplicar');
            return input ? {
                ComprobanteID: Number(input.getAttribute('data-id')),
                FechaVencimiento: input.getAttribute('data-vencimiento'),
                FechaEmision: input.getAttribute('data-emision'),
                SaldoCentavos: Number(input.getAttribute('data-pendiente-centavos') || 0)
            } : null;
        }).filter(Boolean);
        var aplicaciones = distribuirImportePorVencimiento(importe, facturas);
        var importesPorFactura = {};
        aplicaciones.forEach(function (aplicacion) { importesPorFactura[aplicacion.ComprobanteID] = aplicacion.ImporteCentavos; });
        filas.forEach(function (fila) {
            var check = fila.querySelector('.cc-recibo-check');
            var input = fila.querySelector('.cc-recibo-aplicar');
            if (!check || !input) return;
            var aplicado = importesPorFactura[Number(input.getAttribute('data-id'))] || 0;
            check.checked = aplicado > 0;
            input.disabled = aplicado <= 0;
            input.value = formatearCentavos(aplicado);
        });
        porId('reciboError').textContent = '';
        actualizarResumenRecibo(false);
    }
    function abrirNuevoRecibo() {
        var cliente = clienteActual();
        reciboEditandoId = null;
        reciboEditando = null;
        reciboOperacion = nuevaClave();
        porId('modalNuevoReciboTitulo').textContent = 'Registrar recibo';
        porId('modalNuevoReciboSubtitulo').classList.remove('d-none');
        seleccionarClienteFormulario('reciboCliente', cliente && cliente.ClienteID);
        limitarFecha('reciboFecha', 'maxDate', hoyIso());
        ponerFecha('reciboFecha', hoyIso());
        porId('reciboTipoComprobante').textContent = '';
        porId('reciboNumeroComprobante').value = '';
        porId('reciboFormaPago').value = 'Transferencia';
        porId('reciboReferencia').value = '';
        window.SGTL.limpiarError(porId('reciboReferencia'));
        actualizarReferenciaRecibo();
        porId('reciboFormaImporte').value = '0,00';
        porId('reciboObservaciones').value = '';
        porId('reciboError').textContent = '';
        var mensaje = porId('reciboMensaje');
        mensaje.className = 'alert alert-info py-2';
        mensaje.textContent = 'Podés escribir el importe o elegir comprobantes para que se calcule solo.';
        porId('modalNuevoRecibo').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = false; });
        window.SelectClientePredictivo.establecerDeshabilitado('reciboCliente', false);
        porId('reciboNumeroComprobante').readOnly = true;
        porId('reciboFormaImporte').readOnly = false;
        porId('btnDistribuirRecibo').classList.remove('d-none');
        var boton = porId('btnEmitirRecibo');
        boton.classList.remove('d-none'); boton.disabled = true;
        boton.innerHTML = '<i class="bi bi-check-circle me-1" aria-hidden="true"></i>Emitir recibo';
        porId('btnCerrarRecibo').textContent = 'Cancelar';
        cargarConfiguracionEmision('REC', {
            tipo: 'reciboTipoComprobante', letra: 'reciboLetra', sucursal: 'reciboSucursal', numero: 'reciboNumeroComprobante'
        }).then(function () {
            boton.disabled = false;
        }).catch(function (ex) {
            porId('reciboError').textContent = textoError(ex, 'No se pudo cargar la configuración del recibo. Probá de nuevo.');
        });
        cargarFacturasRecibo();
        porId('modalNuevoRecibo').classList.toggle('cc-solo-lectura', false);
        bootstrap.Modal.getOrCreateInstance(porId('modalNuevoRecibo')).show();
    }
    // Con transferencia o cheque la referencia es obligatoria: el asterisco sigue a la forma de pago y el error va
    // debajo del campo (§6.3).
    function referenciaReciboObligatoria() {
        var forma = porId('reciboFormaPago').value;
        return forma === 'Transferencia' || forma === 'Cheque';
    }
    function limpiarErrorReferenciaRecibo() {
        window.SGTL.limpiarError(porId('reciboReferencia'));
        if (porId('reciboError').textContent === 'Revisá los campos marcados.') porId('reciboError').textContent = '';
    }
    function actualizarReferenciaRecibo() {
        var obligatoria = referenciaReciboObligatoria();
        porId('reciboReferenciaObligatoria').classList.toggle('d-none', !obligatoria);
        if (!obligatoria || porId('reciboReferencia').value.trim()) limpiarErrorReferenciaRecibo();
    }
    function validarReferenciaRecibo() {
        if (referenciaReciboObligatoria() && !porId('reciboReferencia').value.trim()) {
            window.SGTL.marcarError(porId('reciboReferencia'), 'Ingresá la referencia de la transferencia o del cheque.');
            porId('reciboError').textContent = 'Revisá los campos marcados.';
            porId('reciboReferencia').focus();
            return false;
        }
        window.SGTL.limpiarError(porId('reciboReferencia'));
        return true;
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
        if (reciboEditandoId) {
            guardarEdicionRecibo();
            return;
        }
        var cliente = clienteReciboActual();
        var error = porId('reciboError');
        error.textContent = '';
        if (!token()) { error.textContent = window.SGTL.mensajeError({ status: 401 }, ''); return; }
        if (!cliente) { error.textContent = 'Seleccioná un cliente.'; return; }
        var fechaRecibo = porId('reciboFecha').value;
        var importeInvalido = primerMontoInvalido([
            { etiqueta: 'El importe del recibo', valor: porId('reciboFormaImporte').value }
        ].concat(camposAplicacionSeleccionados('#reciboFacturas', '.cc-recibo-check', '.cc-recibo-aplicar')));
        if (importeInvalido) { error.textContent = importeInvalido + ' no es válido.'; return; }
        var total = centavos(porId('reciboFormaImporte').value);
        var aplicaciones = aplicacionesRecibo();
        var aplicado = aplicaciones.reduce(function (suma, item) { return suma + centavos(item.Importe); }, 0);
        var forma = porId('reciboFormaPago').value;
        var referencia = porId('reciboReferencia').value.trim();
        if (!fechaRecibo) { error.textContent = 'Completá la fecha del recibo.'; return; }
        if (fechaRecibo > hoyIso()) { error.textContent = 'La fecha del recibo no puede ser futura.'; return; }
        if (total <= 0) { error.textContent = 'Ingresá un importe mayor que cero.'; return; }
        var excedePendiente = Array.prototype.some.call(document.querySelectorAll('.cc-recibo-aplicar'), function (input) {
            return !input.disabled && centavos(input.value) > centavos(input.getAttribute('data-pendiente'));
        });
        if (excedePendiente) { error.textContent = 'Un importe aplicado supera el saldo pendiente del comprobante.'; return; }
        if (aplicado > total) { error.textContent = 'El total aplicado no puede superar el total del recibo.'; return; }
        if (!validarReferenciaRecibo()) return;

        var listo = window.SGTL.procesando('#btnEmitirRecibo');
        apiPost('/recibos', {
            ClaveOperacion: reciboOperacion,
            ClienteID: cliente.ClienteID,
            Fecha: fechaRecibo,
            Letra: porId('reciboLetra').value || null,
            Sucursal: porId('reciboSucursal').value || null,
            Total: total / 100,
            FormaPago: forma,
            Referencia: referencia || null,
            ImporteFormaPago: total / 100,
            Observaciones: porId('reciboObservaciones').value.trim() || null,
            Aplicaciones: aplicaciones
        }).then(function (recibo) {
            listo();
            reciboOperacion = null;
            cerrarModalYNotificar('modalNuevoRecibo', recibo.Numero ? 'Recibo emitido: ' + recibo.Numero + '.' : 'Recibo emitido.');
            cargarCuenta();
        }).catch(function (ex) {
            listo();
            if (ex.status === 403) error.textContent = 'Tu usuario no tiene permiso para emitir recibos.';
            else error.textContent = textoError(ex, 'No se pudo emitir el recibo. Probá de nuevo.');
        });
    }
    function nombreTipoComprobante(tipo) {
        if (tipo === 'FAC') return 'factura';
        if (tipo === 'NC') return 'nota de crédito';
        if (tipo === 'ND') return 'nota de débito';
        return 'comprobante';
    }
    function nombreAccionEmision(tipo) {
        if (tipo === 'FAC') return 'Emitir comprobante directo';
        if (tipo === 'NC') return 'Emitir crédito';
        return 'Emitir Débito';
    }
    function recalcularComprobante() {
        if (comprobanteTipo === 'NC') return actualizarResumenNotaCredito();
        var neto = centavos(porId('cmpNeto').value);
        var porcentaje = Number(porId('cmpIvaPct').value || 0);
        var iva = ivaComprobanteFijo == null ? Math.round(neto * porcentaje / 100) : ivaComprobanteFijo;
        var otros = centavos(porId('cmpOtros').value);
        porId('cmpIvaImporte').value = formatearCentavos(iva);
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
    function renderizarFacturasNotaCredito() {
        var cuerpo = porId('cmpFacturasNC');
        cuerpo.innerHTML = facturasReferencia.map(function (item) {
            var vencimiento = item.FechaVencimiento || item.FechaEmision || '';
            return '<tr><td><input type="checkbox" class="form-check-input cc-nc-check"></td>' +
                '<td class="cc-document">' + escapar(item.Numero) + '</td><td>' + fecha(vencimiento) + '</td>' +
                '<td class="text-end">' + dinero(item.Total) + '</td><td class="text-end fw-bold">' + dinero(item.SaldoPendiente) + '</td>' +
                '<td class="text-end"><input type="text" inputmode="decimal" class="form-control form-control-sm text-end cc-allocation-input cc-nc-aplicar" ' +
                'data-id="' + Number(item.ComprobanteID) + '" data-pendiente-centavos="' + centavos(item.SaldoPendiente) + '" ' +
                'data-vencimiento="' + escapar(vencimiento) + '" data-emision="' + escapar(item.FechaEmision || '') + '" disabled value="0,00"></td></tr>';
        }).join('') || '<tr><td colspan="6" class="cc-empty">El cliente no tiene comprobantes pendientes.</td></tr>';
        cuerpo.querySelectorAll('.cc-nc-aplicar').forEach(enlazarMascaraMonto);
        actualizarResumenNotaCredito();
    }
    function aplicacionesNotaCredito() {
        var aplicaciones = [];
        document.querySelectorAll('#cmpFacturasNC tr').forEach(function (fila) {
            var check = fila.querySelector('.cc-nc-check');
            var input = fila.querySelector('.cc-nc-aplicar');
            if (check && input && check.checked && centavos(input.value) > 0) {
                aplicaciones.push({ ComprobanteID: Number(input.getAttribute('data-id')), Importe: centavos(input.value) / 100 });
            }
        });
        return aplicaciones;
    }
    function calcularComposicionNotaCredito(aplicaciones) {
        return aplicaciones.reduce(function (total, aplicacion) {
            var factura = facturasReferencia.find(function (item) { return Number(item.ComprobanteID) === aplicacion.ComprobanteID; });
            if (!factura) return total;
            var importe = centavos(aplicacion.Importe);
            var pendiente = centavos(factura.SaldoPendiente);
            if (importe <= 0 || pendiente <= 0) return total;
            var netoPendiente = centavos(factura.NetoPendiente);
            var otrosPendientes = centavos(factura.OtrosImpuestosPendiente);
            var neto = importe === pendiente ? netoPendiente : Math.min(importe, Math.round(netoPendiente * importe / pendiente));
            var otros = importe === pendiente ? otrosPendientes : Math.min(importe - neto, Math.round(otrosPendientes * importe / pendiente));
            total.neto += neto;
            total.otros += otros;
            total.iva += importe - neto - otros;
            total.total += importe;
            return total;
        }, { neto: 0, iva: 0, otros: 0, total: 0 });
    }
    function actualizarResumenNotaCredito() {
        var solicitado = centavos(porId('cmpImporteTotalNC').value);
        var aplicaciones = aplicacionesNotaCredito();
        var composicion = calcularComposicionNotaCredito(aplicaciones);
        porId('cmpNeto').value = formatearCentavos(composicion.neto);
        porId('cmpIvaImporte').value = formatearCentavos(composicion.iva);
        porId('cmpOtros').value = formatearCentavos(composicion.otros);
        porId('cmpTotal').textContent = dinero(composicion.total / 100);
        porId('cmpResumenNCTotal').textContent = dinero(solicitado / 100);
        porId('cmpResumenNCAplicado').textContent = dinero(composicion.total / 100);
        porId('cmpResumenNCDiferencia').textContent = dinero((solicitado - composicion.total) / 100);
        ivaComprobanteFijo = composicion.iva;
        return {
            neto: composicion.neto, iva: composicion.iva, otros: composicion.otros,
            total: composicion.total, aplicado: composicion.total, importeSolicitado: solicitado
        };
    }
    function distribuirNotaCredito() {
        var importe = centavos(porId('cmpImporteTotalNC').value);
        if (importe <= 0) {
            porId('cmpError').textContent = 'Ingresá el importe que querés distribuir.';
            return;
        }
        var filas = Array.prototype.slice.call(document.querySelectorAll('#cmpFacturasNC tr'));
        var facturas = filas.map(function (fila) {
            var input = fila.querySelector('.cc-nc-aplicar');
            return input ? {
                ComprobanteID: Number(input.getAttribute('data-id')),
                FechaVencimiento: input.getAttribute('data-vencimiento'),
                FechaEmision: input.getAttribute('data-emision'),
                SaldoCentavos: Number(input.getAttribute('data-pendiente-centavos') || 0)
            } : null;
        }).filter(Boolean);
        var aplicaciones = distribuirImportePorVencimiento(importe, facturas);
        var importesPorFactura = {};
        aplicaciones.forEach(function (aplicacion) { importesPorFactura[aplicacion.ComprobanteID] = aplicacion.ImporteCentavos; });
        filas.forEach(function (fila) {
            var check = fila.querySelector('.cc-nc-check');
            var input = fila.querySelector('.cc-nc-aplicar');
            if (!check || !input) return;
            var aplicado = importesPorFactura[Number(input.getAttribute('data-id'))] || 0;
            check.checked = aplicado > 0;
            input.disabled = aplicado <= 0;
            input.value = formatearCentavos(aplicado);
        });
        porId('cmpError').textContent = '';
        actualizarResumenNotaCredito();
    }
    function cargarFacturasReferencia(tipo, clienteId) {
        var grupoReferencia = porId('cmpReferenciaGrupo');
        var grupoAplicaciones = porId('cmpAplicacionesGrupo');
        facturasReferencia = [];
        grupoReferencia.classList.add('d-none');
        if (tipo !== 'NC') {
            grupoAplicaciones.classList.add('d-none');
            return Promise.resolve();
        }
        grupoAplicaciones.classList.remove('d-none');
        if (!clienteId) {
            porId('cmpFacturasNC').innerHTML = '<tr><td colspan="6" class="cc-empty">Seleccioná un cliente para ver sus comprobantes pendientes.</td></tr>';
            porId('btnEmitirComprobante').disabled = true;
            actualizarResumenNotaCredito();
            return Promise.resolve();
        }
        porId('cmpFacturasNC').innerHTML = '<tr><td colspan="6" class="cc-empty">Cargando comprobantes pendientes…</td></tr>';
        porId('btnEmitirComprobante').disabled = true;
        return apiGet('/clientes/' + clienteId + '/facturas-referencia').then(function (facturas) {
            var clienteActualFormulario = clienteComprobanteActual();
            if (comprobanteTipo !== 'NC' || !clienteActualFormulario || clienteActualFormulario.ClienteID !== clienteId) return;
            facturasReferencia = (facturas || []).filter(function (item) { return centavos(item.SaldoPendiente) > 0; });
            if (!facturasReferencia.length) {
                porId('cmpFacturasNC').innerHTML = '<tr><td colspan="6" class="cc-empty">No hay comprobantes con saldo pendiente.</td></tr>';
                porId('cmpMensaje').className = 'alert alert-warning py-2';
                porId('cmpMensaje').textContent = 'El cliente no tiene comprobantes con saldo para emitir una nota de crédito.';
                porId('btnEmitirComprobante').disabled = true;
                actualizarResumenNotaCredito();
                return;
            }
            renderizarFacturasNotaCredito();
            porId('btnEmitirComprobante').disabled = false;
        });
    }
    function cargarFacturasReferenciaLegado(tipo, clienteId) {
        var grupo = porId('cmpReferenciaGrupo');
        facturasReferencia = [];
        if (tipo !== 'NC') {
            grupo.classList.add('d-none');
            porId('cmpReferencia').innerHTML = '';
            return Promise.resolve();
        }
        grupo.classList.remove('d-none');
        porId('cmpReferenciaAyuda').textContent = 'El neto, el IVA y los otros impuestos se completan con el saldo del comprobante.';
        if (!clienteId) {
            porId('cmpReferencia').innerHTML = '<option value="">Seleccioná un cliente primero</option>';
            porId('btnEmitirComprobante').disabled = true;
            aplicarImportesFacturaReferencia();
            return Promise.resolve();
        }
        porId('cmpReferencia').innerHTML = '<option value="">Cargando…</option>';
        porId('btnEmitirComprobante').disabled = true;
        return apiGet('/clientes/' + clienteId + '/facturas-referencia').then(function (facturas) {
            var clienteActualFormulario = clienteComprobanteActual();
            if (comprobanteTipo !== 'NC' || !clienteActualFormulario || clienteActualFormulario.ClienteID !== clienteId) return;
            facturasReferencia = facturas.filter(function (item) { return centavos(item.SaldoPendiente) > 0; });
            porId('cmpReferencia').innerHTML = facturasReferencia.map(function (item) {
                return '<option value="' + Number(item.ComprobanteID) + '" data-pendiente="' + centavos(item.SaldoPendiente) + '">' +
                    escapar(item.Numero) + ' · ' + fecha(item.FechaEmision) + ' · Saldo ' + dinero(item.SaldoPendiente) + '</option>';
            }).join('');
            if (!facturasReferencia.length) {
                porId('cmpReferencia').innerHTML = '<option value="">No hay comprobantes con saldo pendiente</option>';
                porId('cmpMensaje').className = 'alert alert-warning py-2';
                porId('cmpMensaje').textContent = 'El cliente no tiene comprobantes con saldo para emitir una nota de crédito.';
                porId('btnEmitirComprobante').disabled = true;
                aplicarImportesFacturaReferencia();
                return;
            }
            aplicarImportesFacturaReferencia();
            porId('btnEmitirComprobante').disabled = false;
        });
    }
    function actualizarClienteComprobante() {
        if (comprobanteTipo !== 'NC') return;
        var cliente = clienteComprobanteActual();
        cargarFacturasReferencia('NC', cliente && cliente.ClienteID).catch(function (ex) {
            porId('cmpError').textContent = textoError(ex, 'No se pudieron cargar los comprobantes del cliente. Probá de nuevo.');
            porId('btnEmitirComprobante').disabled = true;
        });
    }
    function abrirNuevoComprobante(tipo) {
        var cliente = clienteActual();
        comprobanteDirecto = tipo === 'FAC';
        comprobanteTipo = comprobanteDirecto ? null : tipo;
        comprobanteOperacion = nuevaClave();
        var hoy = hoyIso();
        var nombreAccion = nombreAccionEmision(tipo);
        porId('cmpTitulo').textContent = nombreAccion;
        porId('cmpTipoComprobante').textContent = '';
        porId('cmpTipoSeleccion').innerHTML = '<option value="">Seleccioná un tipo</option>';
        porId('cmpTipoSeleccion').value = '';
        porId('cmpTipoSeleccion').disabled = false;
        porId('cmpLetra').innerHTML = '';
        porId('cmpSucursal').innerHTML = '';
        porId('cmpNumeroComprobante').value = '';
        porId('cmpTipoSeleccionGrupo').classList.toggle('d-none', !comprobanteDirecto);
        porId('cmpTipoFijoGrupo').classList.toggle('d-none', comprobanteDirecto);
        poblarClientesComprobante(cliente && cliente.ClienteID);
        ponerFecha('cmpFechaEmision', hoy); limitarFecha('cmpFechaEmision', 'maxDate', hoy);
        vencimientoComprobanteEditado = false;
        actualizarVencimientoPredeterminado();
        porId('cmpVencimientoGrupo').classList.toggle('d-none', tipo === 'NC');
        porId('cmpConcepto').value = '';
        porId('cmpIvaPct').querySelectorAll('.cc-iva-factura').forEach(function (opcion) { opcion.remove(); });
        porId('cmpNeto').value = '0,00'; porId('cmpIvaPct').value = '21'; porId('cmpOtros').value = '0,00';
        porId('cmpImporteTotalNC').value = '0,00';
        porId('cmpFacturasNC').innerHTML = '<tr><td colspan="6" class="cc-empty">Seleccioná un cliente para ver sus comprobantes pendientes.</td></tr>';
        porId('cmpSoloLecturaRelacion').classList.add('d-none');
        porId('cmpSoloLecturaRelacion').innerHTML = '';
        porId('cmpDetalleLectura').classList.add('d-none');
        porId('cmpDetalleLecturaCuerpo').innerHTML = '';
        porId('cmpAplicacionesLectura').classList.add('d-none');
        porId('cmpAplicacionesLecturaCuerpo').innerHTML = '';
        ivaComprobanteFijo = null;
        porId('cmpObservaciones').value = ''; porId('cmpError').textContent = '';
        var mensaje = porId('cmpMensaje');
        mensaje.className = 'alert alert-info py-2';
        mensaje.textContent = tipo === 'NC'
            ? 'Ingresá el importe y distribuí la nota de crédito entre los comprobantes pendientes.'
            : comprobanteDirecto ? 'Completá los datos para emitir el comprobante.'
                : 'Completá los datos para emitir la ' + nombreTipoComprobante(tipo) + '.';
        porId('modalNuevoComprobante').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = false; });
        window.SelectClientePredictivo.establecerDeshabilitado('cmpCliente', false);
        porId('cmpIvaImporte').readOnly = true;
        porId('cmpNumeroComprobante').readOnly = true;
        porId('cmpNeto').readOnly = tipo === 'NC';
        porId('cmpOtros').readOnly = tipo === 'NC';
        porId('cmpIvaPct').disabled = tipo === 'NC';
        var boton = porId('btnEmitirComprobante');
        boton.classList.remove('d-none'); boton.disabled = true;
        porId('btnCerrarComprobante').textContent = 'Cancelar';
        boton.innerHTML = '<i class="bi bi-check-circle me-1" aria-hidden="true"></i>' + nombreAccion;
        recalcularComprobante();
        var operacion = comprobanteOperacion;
        var vigente = function () { return comprobanteOperacion === operacion && !comprobanteDirecto && comprobanteTipo === tipo; };
        var carga = comprobanteDirecto ? cargarTiposComprobanteDirecto() : cargarConfiguracionEmision(tipo, {
            tipo: 'cmpTipoComprobante', letra: 'cmpLetra', sucursal: 'cmpSucursal', numero: 'cmpNumeroComprobante'
        }, null, vigente).then(function () {
            if (vigente()) return cargarFacturasReferencia(tipo, cliente && cliente.ClienteID);
        });
        var finalizacion = carga.then(function () {
            if (vigente() && !(tipo === 'NC' && !facturasReferencia.length)) boton.disabled = false;
        }).catch(function (ex) {
            if (comprobanteOperacion !== operacion) return;
            window.SGTL.avisoFormulario(porId('cmpError'), textoError(ex, 'No se pudo cargar la configuración del comprobante. Probá de nuevo.'));
            boton.disabled = true;
        });
        porId('modalNuevoComprobante').classList.toggle('cc-solo-lectura', false);
        bootstrap.Modal.getOrCreateInstance(porId('modalNuevoComprobante')).show();
        return finalizacion;
    }
    function emitirComprobante() {
        var cliente = clienteComprobanteActual();
        var error = porId('cmpError');
        error.textContent = '';
        if (!token()) { error.textContent = window.SGTL.mensajeError({ status: 401 }, ''); return; }
        if (comprobanteDirecto && (!comprobanteTipo || comprobanteTipo !== porId('cmpTipoSeleccion').value)) {
            window.SGTL.marcarError(porId('cmpTipoSeleccion'), 'Seleccioná un tipo de comprobante.');
            window.SGTL.avisoFormulario(error, 'Revisá los campos marcados.');
            return;
        }
        if (!comprobanteTipo) { error.textContent = 'No se pudo determinar el tipo de comprobante. Cerrá el formulario y probá de nuevo.'; return; }
        if (!cliente) { error.textContent = 'Seleccioná un cliente para emitir el comprobante.'; return; }
        var emision = porId('cmpFechaEmision').value;
        var vencimiento = comprobanteTipo === 'NC' ? null : porId('cmpFechaVencimiento').value;
        var referencia = null;
        var concepto = porId('cmpConcepto').value.trim();
        var importeInvalido = comprobanteTipo === 'NC'
            ? primerMontoInvalido([
                { etiqueta: 'El importe total de la nota de crédito', valor: porId('cmpImporteTotalNC').value }
            ].concat(camposAplicacionSeleccionados('#cmpFacturasNC', '.cc-nc-check', '.cc-nc-aplicar')))
            : primerMontoInvalido([
                { etiqueta: 'El importe neto', valor: porId('cmpNeto').value },
                { etiqueta: 'Otros impuestos', valor: porId('cmpOtros').value }
            ]);
        if (importeInvalido) { error.textContent = importeInvalido + ' no es válido.'; return; }
        var aplicaciones = comprobanteTipo === 'NC' ? aplicacionesNotaCredito() : [];
        var importes = recalcularComprobante();
        if (!emision) { error.textContent = 'Completá la fecha de emisión.'; return; }
        if (emision > hoyIso()) { error.textContent = 'La fecha de emisión no puede ser futura.'; return; }
        if (comprobanteTipo !== 'NC' && (!vencimiento || vencimiento < emision)) {
            error.textContent = 'El vencimiento debe ser igual o posterior a la emisión.'; return;
        }
        if (comprobanteTipo === 'NC' && !aplicaciones.length) { error.textContent = 'Seleccioná uno o más comprobantes para aplicar la nota de crédito.'; return; }
        if (!concepto) { error.textContent = 'Ingresá el concepto del comprobante.'; return; }
        if (importes.neto <= 0) { error.textContent = 'El importe neto debe ser mayor que cero.'; return; }
        if (importes.otros < 0) { error.textContent = 'Otros impuestos no puede ser negativo.'; return; }
        if (comprobanteTipo === 'NC') {
            if (importes.importeSolicitado <= 0) { error.textContent = 'Ingresá el importe total de la nota de crédito.'; return; }
            if (importes.aplicado !== importes.importeSolicitado) {
                error.textContent = 'El total aplicado debe coincidir con el importe de la nota de crédito.'; return;
            }
            var excedePendiente = Array.prototype.some.call(document.querySelectorAll('.cc-nc-aplicar'), function (input) {
                return !input.disabled && centavos(input.value) > Number(input.getAttribute('data-pendiente-centavos') || 0);
            });
            if (excedePendiente) { error.textContent = 'Un importe aplicado supera el saldo pendiente del comprobante.'; return; }
        }

        var listo = window.SGTL.procesando('#btnEmitirComprobante');
        return apiPost('/comprobantes', {
            ClaveOperacion: comprobanteOperacion, ClienteID: cliente.ClienteID, Tipo: comprobanteTipo,
            FechaEmision: emision, FechaVencimiento: vencimiento, ComprobanteReferenciaID: referencia,
            Concepto: concepto, Neto: importes.neto / 100, IvaPct: Number(porId('cmpIvaPct').value),
            Letra: porId('cmpLetra').value || null, Sucursal: porId('cmpSucursal').value || null,
            IVA: comprobanteTipo === 'NC' ? importes.iva / 100 : null,
            OtrosImpuestos: importes.otros / 100, Observaciones: porId('cmpObservaciones').value.trim() || null,
            Aplicaciones: comprobanteTipo === 'NC' ? aplicaciones : null
        }).then(function (comprobante) {
            listo();
            comprobanteOperacion = null;
            var nombre = comprobanteTipo === 'FAC' ? 'Factura emitida' :
                comprobanteTipo === 'NC' ? 'Nota de crédito emitida' :
                    comprobanteTipo === 'ND' ? 'Nota de débito emitida' : 'Comprobante emitido';
            cerrarModalYNotificar('modalNuevoComprobante', nombre + (comprobante.Numero ? ': ' + comprobante.Numero : '') + '.');
            cargarCuenta();
        }).catch(function (ex) {
            listo();
            if (ex.status === 403) error.textContent = 'Tu usuario no tiene permiso para emitir este comprobante.';
            else error.textContent = textoError(ex, 'No se pudo emitir el comprobante. Probá de nuevo.');
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
    function textoFiltroListado() {
        var cliente = clienteActual();
        var filtros = ['Cliente: ' + (cliente ? etiquetaCliente(cliente) : 'Todos')];
        filtros.push('Desde: ' + (porId('ccDesde').value ? fecha(porId('ccDesde').value) : 'Sin límite'));
        filtros.push('Hasta: ' + (porId('ccHasta').value ? fecha(porId('ccHasta').value) : 'Sin límite'));
        filtros.push('Estado: ' + (porId('ccEstado').selectedOptions[0].text || 'Todos'));
        filtros.push('Comprobante: ' + (porId('ccTipo').selectedOptions[0].text || 'Todos'));
        return filtros;
    }
    function cantidadListadoActual() {
        return vistaActual === 'pendientes' ? pendientesFiltrados().length : paginacionMovimientos.total;
    }
    function abrirExportacionCuenta() {
        var esPendiente = vistaActual === 'pendientes';
        var cantidad = cantidadListadoActual();
        porId('ccExportarResumen').textContent = (esPendiente ? 'Comprobantes sin relacionar' : 'Comprobantes de cuenta corriente') +
            ': ' + cantidad + '. ' + textoFiltroListado().join(' · ');
        bootstrap.Modal.getOrCreateInstance(porId('modalExportarCuenta')).show();
    }
    function parametrosMovimientosParaExportar() {
        var parametros = new URLSearchParams();
        ['Desde', 'Hasta', 'Tipo', 'Estado'].forEach(function (nombre) {
            var valor = porId('cc' + nombre).value;
            if (valor) parametros.set(nombre.toLowerCase(), valor);
        });
        parametros.set('page', '1');
        parametros.set('pageSize', '0');
        return parametros.toString();
    }
    function obtenerMovimientosParaExportar() {
        var cliente = clienteActual();
        var ruta = cliente
            ? '/clientes/' + cliente.ClienteID + '/cuenta-corriente?'
            : '/cuenta-corriente/movimientos?';
        return apiGet(ruta + parametrosMovimientosParaExportar()).then(function (resultado) {
            return resultado.items || [];
        });
    }
    function datosListadoPendientes() {
        var incluirCliente = esConsultaGeneral();
        var filas = pendientesFiltrados().map(function (item) {
            var fila = [item.Comprobante, fecha(item.FechaEmision), fecha(item.FechaVencimiento), dinero(item.ImporteOriginal),
                dinero(item.ImporteAplicado), dinero(item.SaldoPendiente), item.Situacion || '', item.Estado || ''];
            if (incluirCliente) fila.unshift(item.Cliente || '');
            return fila;
        });
        var cabecera = ['Comprobante', 'Emisión', 'Vencimiento', 'Importe original', 'Aplicado', 'Saldo pendiente', 'Situación', 'Estado'];
        if (incluirCliente) cabecera.unshift('Cliente');
        return { cabecera: cabecera, filas: filas, comprobantes: filas.length };
    }
    function datosListadoPendientesExcel() {
        var incluirCliente = esConsultaGeneral();
        var filas = pendientesFiltrados().map(function (item) {
            var fila = [item.Comprobante, fecha(item.FechaEmision), fecha(item.FechaVencimiento), Number(item.ImporteOriginal || 0),
                Number(item.ImporteAplicado || 0), Number(item.SaldoPendiente || 0), item.Situacion || '', item.Estado || ''];
            if (incluirCliente) fila.unshift(item.Cliente || '');
            return fila;
        });
        var cabecera = ['Comprobante', 'Emisión', 'Vencimiento', 'Importe original', 'Aplicado', 'Saldo pendiente', 'Situación', 'Estado'];
        if (incluirCliente) cabecera.unshift('Cliente');
        return { cabecera: cabecera, filas: filas, comprobantes: filas.length };
    }
    function datosListadoMovimientos(items) {
        var incluirCliente = esConsultaGeneral();
        var filas = items.reduce(function (acumulado, item) {
            var filaComprobante = ['Comprobante', fecha(item.Fecha), item.Comprobante, item.Concepto || '', dinero(item.Debe),
                dinero(item.Cancelado), dinero(item.Saldo), item.Estado || ''];
            if (incluirCliente) filaComprobante.splice(2, 0, item.Cliente || '');
            acumulado.push(filaComprobante);
            var saldoProgresivo = Number(item.Debe || 0);
            (item.Aplicaciones || []).forEach(function (aplicacion) {
                saldoProgresivo = Math.max(0, saldoProgresivo - Number(aplicacion.Importe || 0));
                var filaAplicacion = ['Aplicación', fecha(aplicacion.Fecha), aplicacion.Comprobante, aplicacion.Concepto || '', '—',
                    dinero(aplicacion.Importe), dinero(saldoProgresivo), aplicacion.Estado || 'Aplicado'];
                if (incluirCliente) filaAplicacion.splice(2, 0, aplicacion.Cliente || item.Cliente || '');
                acumulado.push(filaAplicacion);
            });
            return acumulado;
        }, []);
        var cabecera = ['Nivel', 'Fecha', 'Comprobante', 'Concepto', 'Total', 'Cancelado', 'Saldo', 'Estado'];
        if (incluirCliente) cabecera.splice(2, 0, 'Cliente');
        return { cabecera: cabecera, filas: filas, comprobantes: items.length };
    }
    function datosListadoMovimientosExcel(items) {
        var incluirCliente = esConsultaGeneral();
        var filas = items.reduce(function (acumulado, item) {
            var filaComprobante = ['Comprobante', fecha(item.Fecha), item.Comprobante, item.Concepto || '', Number(item.Debe || 0),
                Number(item.Cancelado || 0), Number(item.Saldo || 0), item.Estado || ''];
            if (incluirCliente) filaComprobante.splice(2, 0, item.Cliente || '');
            acumulado.push(filaComprobante);
            var saldoProgresivo = Number(item.Debe || 0);
            (item.Aplicaciones || []).forEach(function (aplicacion) {
                saldoProgresivo = Math.max(0, saldoProgresivo - Number(aplicacion.Importe || 0));
                var filaAplicacion = ['Aplicación', fecha(aplicacion.Fecha), aplicacion.Comprobante, aplicacion.Concepto || '', null,
                    Number(aplicacion.Importe || 0), saldoProgresivo, aplicacion.Estado || 'Aplicado'];
                if (incluirCliente) filaAplicacion.splice(2, 0, aplicacion.Cliente || item.Cliente || '');
                acumulado.push(filaAplicacion);
            });
            return acumulado;
        }, []);
        var cabecera = ['Nivel', 'Fecha', 'Comprobante', 'Concepto', 'Total', 'Cancelado', 'Saldo', 'Estado'];
        if (incluirCliente) cabecera.splice(2, 0, 'Cliente');
        return { cabecera: cabecera, filas: filas, comprobantes: items.length };
    }
    function estilosColumnasListado() {
        if (vistaActual === 'pendientes') {
            return esConsultaGeneral()
                ? {
                    0: { cellWidth: 35 }, 1: { cellWidth: 30 }, 2: { cellWidth: 18 }, 3: { cellWidth: 18 },
                    4: { halign: 'right', cellWidth: 23 }, 5: { halign: 'right', cellWidth: 23 },
                    6: { halign: 'right', cellWidth: 26 }, 7: { cellWidth: 'auto' }, 8: { cellWidth: 20 }
                }
                : {
                    0: { cellWidth: 35 }, 1: { cellWidth: 21 }, 2: { cellWidth: 21 },
                    3: { halign: 'right', cellWidth: 28 }, 4: { halign: 'right', cellWidth: 28 },
                    5: { halign: 'right', cellWidth: 30 }, 6: { cellWidth: 'auto' }, 7: { cellWidth: 22 }
                };
        }
        return esConsultaGeneral()
            ? {
                0: { cellWidth: 18 }, 1: { cellWidth: 18 }, 2: { cellWidth: 34 }, 3: { cellWidth: 28 },
                4: { cellWidth: 'auto' }, 5: { halign: 'right', cellWidth: 23 }, 6: { halign: 'right', cellWidth: 23 },
                7: { halign: 'right', cellWidth: 23 }, 8: { cellWidth: 21 }
            }
            : {
                0: { cellWidth: 22 }, 1: { cellWidth: 19 }, 2: { cellWidth: 34 }, 3: { cellWidth: 'auto' },
                4: { halign: 'right', cellWidth: 24 }, 5: { halign: 'right', cellWidth: 24 },
                6: { halign: 'right', cellWidth: 25 }, 7: { cellWidth: 23 }
            };
    }
    function generarListadoPdf(datos) {
        if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.jsPDF.API.autoTable) {
            throw new Error('No está disponible el generador de PDF.');
        }
        var doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        var ancho = doc.internal.pageSize.getWidth();
        var alto = doc.internal.pageSize.getHeight();
        var margen = 10;
        var titulo = vistaActual === 'pendientes' ? 'Listado de comprobantes sin relacionar' : 'Listado de cuenta corriente';
        var fechaGeneracion = new Date().toLocaleString('es-AR');
        var filtros = textoFiltroListado().join('   |   ');
        var lineasFiltros = doc.splitTextToSize(filtros, ancho - (margen * 2));
        var inicioTabla = 23 + (lineasFiltros.length * 4);

        doc.setProperties({ title: titulo, subject: 'Cuenta corriente de clientes' });
        doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(33, 37, 41);
        doc.text('Cuenta corriente de clientes', margen, 12);
        doc.setFontSize(10); doc.text(titulo, margen, 18);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(80);
        doc.text(lineasFiltros, margen, 23);
        doc.text('Comprobantes: ' + datos.comprobantes, ancho - margen, 12, { align: 'right' });
        doc.text('Generado: ' + fechaGeneracion, ancho - margen, 18, { align: 'right' });

        doc.autoTable({
            head: [datos.cabecera],
            body: datos.filas.length ? datos.filas : [datos.cabecera.map(function (_, indice) {
                return indice === 0 ? 'No hay comprobantes para los filtros seleccionados.' : '';
            })],
            startY: inicioTabla,
            margin: { left: margen, right: margen, bottom: 16 },
            styles: { fontSize: 7, cellPadding: 1.4, overflow: 'linebreak', valign: 'middle' },
            headStyles: { fillColor: [33, 37, 41], textColor: 255, halign: 'center', fontStyle: 'bold' },
            columnStyles: estilosColumnasListado(),
            didParseCell: function (info) {
                if (info.section === 'body' && String(info.cell.raw || '') === 'Aplicación') {
                    info.cell.styles.textColor = [90, 90, 90];
                }
            }
        });
        var paginas = doc.getNumberOfPages();
        for (var pagina = 1; pagina <= paginas; pagina += 1) {
            doc.setPage(pagina);
            doc.setDrawColor(210); doc.line(margen, alto - 11, ancho - margen, alto - 11);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100);
            doc.text('Cuenta corriente de clientes', margen, alto - 6);
            doc.text('Página ' + pagina + ' de ' + paginas, ancho - margen, alto - 6, { align: 'right' });
        }
        return doc;
    }
    function generarListadoExcel(datos) {
        if (!window.XLSX || !window.XLSX.utils) throw new Error('No está disponible el generador de Excel.');
        var titulo = vistaActual === 'pendientes' ? 'Listado de comprobantes sin relacionar' : 'Listado de cuenta corriente';
        var filas = [
            ['Cuenta corriente de clientes'],
            [titulo],
            ['Generado', new Date().toLocaleString('es-AR')],
            ['Filtros', textoFiltroListado().join(' | ')],
            [],
            datos.cabecera
        ].concat(datos.filas);
        var libro = window.XLSX.utils.book_new();
        var hoja = window.XLSX.utils.aoa_to_sheet(filas);
        hoja['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, datos.cabecera.length - 1) } }];
        hoja['!cols'] = datos.cabecera.map(function (cabecera, indice) {
            var maximo = String(cabecera).length;
            datos.filas.forEach(function (fila) { maximo = Math.max(maximo, String(fila[indice] == null ? '' : fila[indice]).length); });
            return { wch: Math.min(Math.max(maximo + 2, 12), 42) };
        });
        var columnasImporte = { 'Importe original': true, 'Aplicado': true, 'Saldo pendiente': true, 'Total': true, 'Cancelado': true, 'Saldo': true };
        datos.cabecera.forEach(function (cabecera, columna) {
            if (!columnasImporte[cabecera]) return;
            datos.filas.forEach(function (_, fila) {
                var celda = hoja[window.XLSX.utils.encode_cell({ r: fila + 6, c: columna })];
                if (celda && typeof celda.v === 'number') celda.z = '#,##0.00';
            });
        });
        window.XLSX.utils.book_append_sheet(libro, hoja, 'Listado');
        window.XLSX.writeFile(libro, 'listado-cuenta-corriente-' + fechaIsoLocal(new Date()) + '.xlsx');
    }
    function cambiarEstadoBotonesListado(ocupado, texto) {
        ['btnVistaPreviaListado', 'btnDescargarListadoExcel', 'btnDescargarListadoPdf'].forEach(function (id) {
            var boton = porId(id);
            boton.disabled = ocupado;
            if (ocupado) boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>' + texto;
        });
    }
    function restaurarBotonesListado() {
        porId('btnVistaPreviaListado').disabled = false;
        porId('btnVistaPreviaListado').innerHTML = '<i class="bi bi-printer me-1"></i>Vista previa e imprimir';
        porId('btnDescargarListadoExcel').disabled = false;
        porId('btnDescargarListadoExcel').innerHTML = '<i class="bi bi-file-earmark-excel me-1"></i>Exportar Excel';
        porId('btnDescargarListadoPdf').disabled = false;
        porId('btnDescargarListadoPdf').innerHTML = '<i class="bi bi-file-earmark-pdf me-1"></i>Exportar PDF';
    }
    function exportarListadoPdf(modo) {
        var ventanaPrevia = null;
        if (modo === 'vistaPrevia') ventanaPrevia = window.open('', '_blank');
        cambiarEstadoBotonesListado(true, 'Generando…');
        var datos = vistaActual === 'pendientes'
            ? Promise.resolve(datosListadoPendientes())
            : obtenerMovimientosParaExportar().then(datosListadoMovimientos);
        datos.then(function (listado) {
            var doc = generarListadoPdf(listado);
            if (modo === 'vistaPrevia') {
                if (!ventanaPrevia) {
                    var bloqueada = new Error('Ventana de vista previa bloqueada');
                    bloqueada.mensajeUsuario = 'El navegador bloqueó la vista previa. Permití las ventanas emergentes y probá de nuevo.';
                    throw bloqueada;
                }
                doc.autoPrint();
                ventanaPrevia.location.href = doc.output('bloburl');
            } else {
                doc.save('listado-cuenta-corriente-' + fechaIsoLocal(new Date()) + '.pdf');
            }
            bootstrap.Modal.getInstance(porId('modalExportarCuenta')).hide();
        }).catch(function (error) {
            if (ventanaPrevia && !ventanaPrevia.closed) ventanaPrevia.close();
            console.error(error);
            window.SGTL.toastError((error && error.mensajeUsuario) || 'No se pudo generar el PDF. Probá de nuevo.');
        }).finally(restaurarBotonesListado);
    }
    function exportarListadoExcel() {
        cambiarEstadoBotonesListado(true, 'Generando…');
        var datos = vistaActual === 'pendientes'
            ? Promise.resolve(datosListadoPendientesExcel())
            : obtenerMovimientosParaExportar().then(datosListadoMovimientosExcel);
        datos.then(function (listado) {
            generarListadoExcel(listado);
            bootstrap.Modal.getInstance(porId('modalExportarCuenta')).hide();
        }).catch(function (error) {
            console.error(error);
            window.SGTL.toastError((error && error.mensajeUsuario) || 'No se pudo generar el Excel. Probá de nuevo.');
        }).finally(restaurarBotonesListado);
    }

    function enlazarEventos() {
        ['cmpFechaEmision', 'cmpFechaVencimiento', 'reciboFecha'].forEach(prepararFecha);
        if (window.SGTL) {
            window.SGTL.rangoFechas('#ccFecha', {
                maxDate: 'today', onChange: sincronizarRango,
                // Con el rango completo busca al cerrar el calendario, como en viajes y proformas (§7.1).
                onClose: function (fechas) { if (fechas.length !== 1) { sincronizarRango(); cargarCuenta(1); } }
            });
            // La cruz deja la fecha "sin límite" (§1.3) y vuelve a buscar.
            filtrosCuenta = window.SGTL.filtros(['#ccCliente', '#ccFecha', '#ccEstado', '#ccTipo'], function () {
                window.SelectClientePredictivo.sincronizar('ccCliente');
                sincronizarRango();
                cargarCuenta(1);
            });
        }
        ['ccCliente', 'ccTipo', 'ccEstado'].forEach(function (id) {
            porId(id).addEventListener('change', function () { cargarCuenta(1); });
        });
        // El error de cada formulario va arriba (§5.1): cuando aparece, se sube para que se vea.
        ['cmpError', 'reciboError'].forEach(function (id) {
            var aviso = porId(id);
            new MutationObserver(function () {
                if (aviso.textContent) aviso.closest('.modal-body').scrollTop = 0;
            }).observe(aviso, { childList: true, characterData: true, subtree: true });
        });
        porId('busquedaCuentaForm').addEventListener('submit', function (evento) {
            evento.preventDefault();
            sincronizarRango();
            cargarCuenta(1);
        });
        porId('btnNuevoRecibo').addEventListener('click', abrirNuevoRecibo);
        porId('btnEmitirRecibo').addEventListener('click', emitirRecibo);
        porId('btnDistribuirRecibo').addEventListener('click', distribuirRecibo);
        porId('btnDistribuirNC').addEventListener('click', distribuirNotaCredito);
        porId('btnEmitirComprobante').addEventListener('click', emitirComprobante);
        porId('cmpTipoSeleccion').addEventListener('change', seleccionarTipoComprobanteDirecto);
        porId('cmpCliente').addEventListener('change', function () {
            actualizarClienteComprobante();
        });
        porId('reciboCliente').addEventListener('change', function () {
            cargarFacturasRecibo();
        });
        porId('cmpFechaEmision').addEventListener('change', actualizarVencimientoPredeterminado);
        porId('cmpFechaVencimiento').addEventListener('change', function () {
            vencimientoComprobanteEditado = true;
        });
        porId('cmpNeto').addEventListener('input', recalcularComprobante);
        porId('cmpIvaPct').addEventListener('change', recalcularComprobante);
        porId('cmpOtros').addEventListener('input', recalcularComprobante);
        porId('cmpReferencia').addEventListener('change', aplicarImportesFacturaReferencia);
        porId('cmpImporteTotalNC').addEventListener('input', actualizarResumenNotaCredito);
        porId('btnExportarCuenta').addEventListener('click', abrirExportacionCuenta);
        porId('btnVistaPreviaListado').addEventListener('click', function () { exportarListadoPdf('vistaPrevia'); });
        porId('btnDescargarListadoExcel').addEventListener('click', exportarListadoExcel);
        porId('btnDescargarListadoPdf').addEventListener('click', function () { exportarListadoPdf('descargar'); });
        porId('btnConfirmarEnvioComprobante').addEventListener('click', enviarComprobantePorEmail);
        porId('imprimirVistaPreviaComprobante').addEventListener('click', imprimirVistaPreviaComprobante);
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
                desplegar.closest('tr').classList.toggle('cc-parent-open', expandir);
                var icono = desplegar.querySelector('i');
                icono.classList.toggle('bi-chevron-down', !expandir);
                icono.classList.toggle('bi-chevron-up', expandir);
                desplegar.setAttribute('aria-label', (expandir ? 'Ocultar' : 'Mostrar') + ' comprobantes aplicados');
                return;
            }
            var boton = event.target.closest('button[data-accion]');
            if (!boton) return;
            var id = Number(boton.getAttribute('data-id'));
            var accion = boton.getAttribute('data-accion');
            if (accion === 'ver') verComprobante(id, boton.getAttribute('data-tipo'));
            else if (accion === 'editar') abrirEditarRecibo(id);
            else if (accion === 'pdf') abrirVistaPreviaComprobante(id);
            else if (accion === 'enviar') abrirEnvioComprobante(id);
            else if (accion === 'anular') anularReciboActual(id);
            else if (accion === 'eliminar') eliminarReciboActual(id);
        });
        porId('ccPagination').addEventListener('click', function (event) {
            var botonPagina = event.target.closest('button[data-page]');
            if (!botonPagina || botonPagina.disabled || botonPagina.closest('.disabled')) return;
            var pagina = Number(botonPagina.getAttribute('data-page'));
            if (!pagina || pagina === paginaActual) return;
            paginaActual = pagina;
            if (vistaActual === 'pendientes') {
                renderTabla();
                renderPaginacion();
            } else {
                cargarCuenta(paginaActual);
            }
        });
        porId('reciboFacturas').addEventListener('input', actualizarResumenRecibo);
        porId('reciboFacturas').addEventListener('change', function (event) {
            if (event.target.classList.contains('cc-recibo-check')) {
                var input = event.target.closest('tr').querySelector('.cc-recibo-aplicar');
                input.disabled = !event.target.checked;
                input.value = event.target.checked ? formatearCentavos(centavos(input.getAttribute('data-pendiente'))) : '0,00';
            }
            actualizarResumenRecibo();
        });
        porId('reciboFormaImporte').addEventListener('input', function () { actualizarResumenRecibo(false); });
        porId('reciboFormaPago').addEventListener('change', actualizarReferenciaRecibo);
        porId('reciboReferencia').addEventListener('input', function () {
            if (porId('reciboReferencia').value.trim()) limpiarErrorReferenciaRecibo();
        });
        porId('cmpFacturasNC').addEventListener('input', actualizarResumenNotaCredito);
        porId('cmpFacturasNC').addEventListener('change', function (event) {
            if (event.target.classList.contains('cc-nc-check')) {
                var input = event.target.closest('tr').querySelector('.cc-nc-aplicar');
                input.disabled = !event.target.checked;
                input.value = event.target.checked ? formatearCentavos(Number(input.getAttribute('data-pendiente-centavos') || 0)) : '0,00';
            }
            actualizarResumenNotaCredito();
        });
        ['reciboFormaImporte', 'cmpNeto', 'cmpOtros', 'cmpImporteTotalNC'].forEach(function (id) {
            enlazarMascaraMonto(porId(id));
        });
    }
    function inicializar() {
        if (inicializada) return;
        modalVistaPreviaComprobante = bootstrap.Modal.getOrCreateInstance(porId('modalVistaPreviaComprobante'));
        window.abrirVistaPreviaComprobante = abrirVistaPreviaComprobante;
        porId('modalVistaPreviaComprobante').addEventListener('hidden.bs.modal', limpiarVistaPreviaComprobante);
        inicializada = true; enlazarEventos(); mostrarCarga(); establecerRangoUltimos30Dias();
        ponerFecha('reciboFecha', hoyIso());
        cargarClientes().then(cargarCuenta).catch(mostrarError);
        apiGet('/facturacion-config/tipos-comprobante').then(agregarTiposFiltroCuenta).catch(function () {
            // El filtro conserva sus opciones básicas; la emisión volverá a consultar los tipos al abrirse.
        });
    }
    window.CuentaCorrienteUI = { inicializar: inicializar };
})(window, document);
