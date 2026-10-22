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
    var facturasReferencia = [];
    var ivaComprobanteFijo = null;
    var vencimientoComprobanteEditado = false;
    var paginaActual = 1;
    var paginacionMovimientos = { total: 0, totalPages: 0 };
    var tamanioPagina = 15;
    var modalVistaPreviaComprobante = null;
    var urlVistaPreviaComprobante = null;
    var secuenciaVistaPreviaComprobante = 0;

    function porId(id) { return document.getElementById(id); }

    function cargarConfiguracionEmision(tipo, controles, valoresActuales) {
        if (!window.ConfiguracionFacturacion || !window.ConfiguracionFacturacion.cargar) {
            return Promise.reject(new Error('No se cargó la configuración de Facturación.'));
        }
        return window.ConfiguracionFacturacion.cargar(tipo, controles).then(function (datos) {
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
        aviso.className = 'alert alert-' + tipo;
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
        var boton = porId('btnConfirmarEnvioComprobante');
        var destino = porId('envioComprobanteDestino');
        boton.disabled = true;
        destino.value = '';
        ocultarFeedbackEnvio();
        porId('envioComprobantePerfil').textContent = 'Verificando el perfil SMTP de Facturación…';
        bootstrap.Modal.getOrCreateInstance(porId('modalEnviarComprobanteEmail')).show();
        apiGet('/comprobantes/' + encodeURIComponent(comprobanteActualId) + '/email').then(function (datos) {
            destino.value = datos.DestinatarioSugerido || '';
            if (!datos.Configurado) {
                porId('envioComprobantePerfil').textContent = 'Facturación no tiene un perfil SMTP asignado.';
                mostrarFeedbackEnvio('warning', 'Un administrador debe seleccionar el perfil SMTP desde Configuración > Gestionar e-mail > Perfil para Facturación.');
                return;
            }
            porId('envioComprobantePerfil').textContent = 'Se utilizará el Servicio ' + datos.Service + ' · ' + (datos.Perfil || datos.Remitente || 'perfil SMTP asignado') + '.';
            boton.disabled = false;
        }).catch(function (error) {
            porId('envioComprobantePerfil').textContent = 'No se pudo verificar la configuración de envío.';
            mostrarFeedbackEnvio('danger', error.message || 'No se pudo preparar el envío del comprobante.');
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
        porId('tituloVistaPreviaComprobante').textContent = 'Vista previa del comprobante';
        feedback.className = 'text-muted';
        feedback.textContent = 'Preparando vista previa…';
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
            feedback.className = 'alert alert-danger';
            feedback.textContent = error && error.message ? error.message : 'No se pudo generar la vista previa del comprobante.';
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
        var destino = porId('envioComprobanteDestino').value.trim();
        var campoDestino = porId('envioComprobanteDestino');
        if (!destino || !campoDestino.checkValidity()) {
            campoDestino.reportValidity();
            return;
        }
        if (typeof window.generarComprobantePDFParaEmail !== 'function') {
            mostrarFeedbackEnvio('danger', 'No está disponible el generador de PDF del comprobante.');
            return;
        }
        var boton = porId('btnConfirmarEnvioComprobante');
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Generando PDF…';
        mostrarFeedbackEnvio('info', 'Generando el PDF y enviando el comprobante…');
        window.generarComprobantePDFParaEmail(comprobanteActualId).then(function (adjunto) {
            boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Enviando…';
            return apiPost('/comprobantes/' + encodeURIComponent(comprobanteActualId) + '/email', {
                Destinatario: destino,
                PdfBase64: adjunto.PdfBase64
            });
        }).then(function (resultado) {
            mostrarFeedbackEnvio('success', resultado.mensaje || 'Comprobante enviado correctamente.');
            boton.innerHTML = '<i class="bi bi-check-circle me-1"></i>Enviado';
        }).catch(function (error) {
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-send me-1"></i>Reintentar envío';
            mostrarFeedbackEnvio('danger', error.message || 'No se pudo enviar el comprobante.');
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
        porId('cmpFechaVencimiento').value = sumarDiasAFechaIso(porId('cmpFechaEmision').value, 10);
    }
    function esConsultaGeneral() { return !clienteActual(); }
    function claseEstado(estado) {
        if (estado === 'Cancelado' || estado === 'Aplicado') return 'cc-paid';
        if (estado === 'Parcial' || estado === 'Parcialmente aplicado') return 'cc-partial';
        return 'cc-pending';
    }
    function badgeEstado(estado) {
        return '<span class="badge rounded-pill ' + claseEstado(estado) + '">' + escapar(estado) + '</span>';
    }
    function tipoComprobante(item) {
        var tipo = String((item && item.Tipo) || '').toUpperCase();
        if (['FAC', 'REC', 'NC', 'ND'].indexOf(tipo) !== -1) return tipo;
        var coincidencia = /^(FAC|REC|NC|ND)-/.exec(String((item && item.Comprobante) || ''));
        return coincidencia ? coincidencia[1] : '';
    }
    function accionesDisponibles(item, relacionado) {
        var tipo = tipoComprobante(item);
        if (tipo === 'FAC') return relacionado
            ? ['ver-detalle', 'enviar-mail', 'imprimir']
            : ['ver-formulario', 'enviar-mail', 'imprimir'];
        if (tipo === 'REC') {
            var estado = String(item.EstadoComprobante || item.EstadoDocumental || item.Estado || 'EMITIDO').toUpperCase();
            return estado === 'ANULADO'
                ? ['ver-detalle', 'enviar-mail', 'imprimir', 'eliminar-recibo']
                : ['ver-detalle', 'enviar-mail', 'editar-recibo', 'imprimir', 'anular-recibo'];
        }
        return ['ver-detalle', 'enviar-mail', 'imprimir'];
    }
    function accionesComprobante(item, relacionado) {
        var tipo = tipoComprobante(item);
        var fabrica = window.SGTL && window.SGTL.botonFila;
        if (!fabrica) return '';
        var datos = { tipo: tipo, relacionado: relacionado ? 'true' : 'false' };
        var botones = accionesDisponibles(item, relacionado).map(function (accion) {
            if (accion === 'ver-formulario') return fabrica('ver', { id: item.ComprobanteID, texto: 'Ver', datos: Object.assign({}, datos, { modo: 'formulario' }) });
            if (accion === 'ver-detalle') return fabrica('ver', { id: item.ComprobanteID, texto: 'Ver detalle', datos: Object.assign({}, datos, { modo: 'detalle' }) });
            if (accion === 'enviar-mail') return fabrica('enviar', { id: item.ComprobanteID, texto: 'Enviar por mail', datos: datos });
            if (accion === 'editar-recibo') return fabrica('editar', { id: item.ComprobanteID, texto: 'Editar recibo', datos: datos });
            if (accion === 'imprimir') return fabrica('pdf', { id: item.ComprobanteID, texto: 'Imprimir', icono: 'bi-printer', datos: datos });
            if (accion === 'anular-recibo') return fabrica('anular', { id: item.ComprobanteID, texto: 'Anular recibo', datos: datos });
            return fabrica('eliminar', { id: item.ComprobanteID, texto: 'Eliminar recibo', datos: datos });
        });
        return window.SGTL.accionesFila ? window.SGTL.accionesFila(botones) : botones.join('');
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
            var opcionesClientes = clientes.filter(function (item) {
                return item.EstadoCliente;
            }).map(function (item) {
                return '<option value="' + item.ClienteID + '">' + escapar(item.RazonSocial + ' — ' + item.CUIT) + '</option>';
            }).join('');
            select.innerHTML = '<option value="">Todos los clientes</option>' + opcionesClientes;
            porId('cmpCliente').innerHTML = '<option value="">Seleccionar cliente</option>' + opcionesClientes;
            porId('reciboCliente').innerHTML = '<option value="">Seleccionar cliente</option>' + opcionesClientes;
            // La consulta siempre inicia sin cliente: el usuario puede limitarla desde el filtro.
            select.value = '';
            select.disabled = false;
            window.SelectClientePredictivo.inicializar(select, { placeholder: 'Todos los clientes' });
            window.SelectClientePredictivo.inicializar('cmpCliente', { placeholder: 'Seleccionar cliente' });
            window.SelectClientePredictivo.inicializar('reciboCliente', { placeholder: 'Seleccionar cliente' });
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
            '<th>Fecha</th>' + (mostrarCliente ? '<th>Cliente</th>' : '') + '<th>Comprobante</th><th>Concepto</th><th class="text-end">Total</th>' +
            '<th class="text-end">Cancelado</th><th class="text-end">Saldo</th>' +
            '<th>Estado</th><th class="text-center">Acciones</th></tr>';
        if (!movimientos.length) {
            porId('ccTablaCuerpo').innerHTML = '<tr><td colspan="' + (mostrarCliente ? 10 : 9) + '" class="cc-empty">No hay comprobantes para los filtros seleccionados.</td></tr>';
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
                '</td>' + (mostrarCliente ? '<td>' + escapar(item.Cliente || '—') + '</td>' : '') + '<td class="cc-document">' + escapar(item.Comprobante) + '</td><td>' + escapar(item.Concepto) +
                '</td><td class="cc-money">' + dinero(item.Debe) + '</td><td class="cc-money cc-credit">' +
                dinero(item.Cancelado) + '</td><td class="cc-money cc-debit fw-bold">' + dinero(item.Saldo) +
                '</td><td>' + badgeEstado(item.Estado) + '</td><td class="text-center">' +
                accionesComprobante(item, false) + '</td></tr>';
            var saldoProgresivo = Number(item.Debe || 0);
            var filasAplicaciones = aplicaciones.map(function (aplicacion) {
                saldoProgresivo = Math.max(0, saldoProgresivo - Number(aplicacion.Importe || 0));
                aplicacion.Saldo = saldoProgresivo;
                var claseCreditoAplicado = aplicacion.Tipo === 'REC' || aplicacion.Tipo === 'NC'
                    ? ' cc-credit-application-row' : '';
                return '<tr class="cc-application-row' + claseCreditoAplicado + ' d-none" data-parent="' + Number(item.ComprobanteID) + '">' +
                    '<td></td><td>' + fecha(aplicacion.Fecha) + '</td>' +
                    (mostrarCliente ? '<td>' + escapar(aplicacion.Cliente || item.Cliente || '—') + '</td>' : '') + '<td class="cc-document cc-application-document">' +
                    '<i class="bi bi-arrow-return-right me-2" aria-hidden="true"></i>' + escapar(aplicacion.Comprobante) +
                    '</td><td>' + escapar(aplicacion.Concepto || 'Aplicación a ' + item.Comprobante) + '</td>' +
                    '<td class="cc-money">—</td><td class="cc-money cc-credit">' + dinero(aplicacion.Importe) +
                    '</td><td class="cc-money fw-bold">' + dinero(saldoProgresivo) + '</td><td>' +
                    badgeEstado(aplicacion.Estado || 'Aplicado') + '</td><td class="text-center">' +
                    accionesComprobante(aplicacion, true) + '</td></tr>';
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
        porId('ccTablaCabecera').innerHTML = '<tr>' + (mostrarCliente ? '<th>Cliente</th>' : '') + '<th>Comprobante</th><th>Emisión</th><th>Vencimiento</th>' +
            '<th class="text-end">Importe original</th><th class="text-end">Aplicado</th><th class="text-end">Saldo pendiente</th>' +
            '<th>Situación</th><th>Estado</th><th class="text-center">Acciones</th></tr>';
        if (!filas.length) {
            porId('ccTablaCuerpo').innerHTML = '<tr><td colspan="' + (mostrarCliente ? 10 : 9) + '" class="cc-empty">No hay comprobantes sin relacionar para los filtros seleccionados.</td></tr>';
            return;
        }
        porId('ccTablaCuerpo').innerHTML = filas.map(function (item) {
            return '<tr>' + (mostrarCliente ? '<td>' + escapar(item.Cliente || '—') + '</td>' : '') + '<td class="cc-document">' + escapar(item.Comprobante) + '</td><td>' + fecha(item.FechaEmision) + '</td>' +
                '<td>' + fecha(item.FechaVencimiento) + '</td><td class="cc-money">' + dinero(item.ImporteOriginal) + '</td>' +
                '<td class="cc-money cc-credit">' + dinero(item.ImporteAplicado) + '</td><td class="cc-money cc-debit fw-bold">' +
                dinero(item.SaldoPendiente) + '</td><td>' + escapar(item.Situacion) + '</td><td>' + badgeEstado(item.Estado) + '</td>' +
                '<td class="text-center">' + accionesComprobante(item, false) + '</td></tr>';
        }).join('');
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
        if (window.PaginacionSGTL) {
            window.PaginacionSGTL.render(contenedor, {
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
            return;
        }
        // Fallback para páginas que se abran sin el cargador compartido.
        var inicio = total ? ((paginaActual - 1) * tamanioPagina) + 1 : 0;
        var fin = total ? Math.min(total, paginaActual * tamanioPagina) : 0;
        contenedor.innerHTML = '<li class="page-item me-auto">Filas por página: ' + tamanioPagina + '</li>' +
            '<li class="page-item"><span class="page-link border-0">' + inicio + '-' + fin + ' de ' + total + '</span></li>' +
            '<li class="page-item ' + (paginaActual <= 1 ? 'disabled' : '') + '"><button class="page-link" type="button" data-page="' +
            (paginaActual - 1) + '" aria-label="Página anterior"><i class="bi bi-chevron-left"></i></button></li>' +
            '<li class="page-item ' + (paginaActual >= totalPaginas || !total ? 'disabled' : '') + '"><button class="page-link" type="button" data-page="' +
            (paginaActual + 1) + '" aria-label="Página siguiente"><i class="bi bi-chevron-right"></i></button></li>';
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
    function abrirDetalle(id, relacionado) {
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
        var esComprobanteImprimible = ['FAC', 'REC', 'NC', 'ND'].indexOf(item.Tipo) !== -1 ||
            /^(FAC|REC|NC|ND)-/.test(String(item.Comprobante || ''));
        var botonVer = porId('btnVerComprobante');
        botonVer.classList.toggle('d-none', !relacionado || !esComprobanteImprimible);
        botonVer.setAttribute('data-id', String(comprobanteActualId));
        botonVer.setAttribute('data-tipo', tipoComprobante(item));
        bootstrap.Modal.getOrCreateInstance(porId('modalDetalleComprobante')).show();
    }

    function presentarComprobanteSoloLectura(comprobante) {
        var tipo = tipoComprobante(comprobante);
        porId('cmpTitulo').textContent = 'Ver ' + nombreTipoComprobante(tipo) + ' · ' + (comprobante.Numero || '');
        var mensaje = porId('cmpMensaje');
        mensaje.className = 'alert alert-info py-2';
        mensaje.textContent = 'Consulta de solo lectura. Los datos del comprobante no se pueden modificar.';
        var cliente = porId('cmpCliente');
        cliente.innerHTML = '<option value="' + Number(comprobante.ClienteID || 0) + '">' +
            escapar((comprobante.RazonSocial || 'Cliente') + (comprobante.CUIT ? ' — ' + comprobante.CUIT : '')) + '</option>';
        cliente.value = String(Number(comprobante.ClienteID || 0));
        window.SelectClientePredictivo.sincronizar(cliente);
        porId('cmpFechaEmision').value = fechaIsoLocal(new Date(comprobante.FechaEmision));
        porId('cmpFechaVencimiento').value = comprobante.FechaVencimiento ? fechaIsoLocal(new Date(comprobante.FechaVencimiento)) : '';
        porId('cmpTipoComprobante').value = nombreTipoComprobante(tipo);
        porId('cmpLetra').innerHTML = '<option value="' + escapar(comprobante.Letra || '') + '">' + escapar(comprobante.Letra || '—') + '</option>';
        porId('cmpLetra').value = comprobante.Letra || '';
        porId('cmpSucursal').innerHTML = '<option value="' + escapar(comprobante.Sucursal || '') + '">' + escapar(comprobante.Sucursal || '—') + '</option>';
        porId('cmpSucursal').value = comprobante.Sucursal || '';
        porId('cmpNumeroComprobante').value = comprobante.Numero || '';
        porId('cmpConcepto').value = comprobante.Concepto || '';
        porId('cmpNeto').value = formatearCentavos(centavos(comprobante.Neto));
        porId('cmpIvaPct').innerHTML = '<option value="">—</option>';
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
        bootstrap.Modal.getOrCreateInstance(porId('modalNuevoComprobante')).show();
    }

    function presentarReciboSoloLectura(recibo) {
        porId('modalNuevoReciboTitulo').textContent = 'Ver Recibo · ' + (recibo.Numero || '');
        porId('reciboFecha').value = fechaIsoLocal(new Date(recibo.Fecha));
        seleccionarClienteFormulario('reciboCliente', recibo.ClienteID);
        porId('reciboTipoComprobante').value = 'Recibo';
        porId('reciboLetra').innerHTML = '<option value="' + escapar(recibo.Letra || '') + '">' + escapar(recibo.Letra || '—') + '</option>';
        porId('reciboSucursal').innerHTML = '<option value="' + escapar(recibo.Sucursal || '') + '">' + escapar(recibo.Sucursal || '—') + '</option>';
        porId('reciboNumeroComprobante').value = recibo.Numero || recibo.NumeroComprobante || '';
        porId('reciboFormaPago').value = ({ TRANSFERENCIA: 'Transferencia', EFECTIVO: 'Efectivo', CHEQUE: 'Cheque', OTRO: 'Otro' })[String(recibo.FormaPago || '').toUpperCase()] || 'Otro';
        porId('reciboReferencia').value = recibo.Referencia || '';
        porId('reciboFormaImporte').value = formatearCentavos(centavos(recibo.Total));
        porId('reciboObservaciones').value = recibo.Observaciones || '';
        renderAplicacionesReciboEdicion(recibo.Aplicaciones);
        porId('reciboResumenTotal').textContent = dinero(recibo.Total);
        porId('reciboResumenAplicado').textContent = dinero((recibo.Aplicaciones || []).reduce(function (total, item) { return total + Number(item.Importe || 0); }, 0));
        porId('reciboResumenDiferencia').textContent = dinero(0);
        var mensaje = porId('reciboMensaje');
        mensaje.className = 'alert alert-info py-2';
        mensaje.textContent = 'Consulta de solo lectura. Los datos del Recibo no se pueden modificar.';
        porId('reciboError').textContent = '';
        porId('modalNuevoRecibo').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = true; });
        window.SelectClientePredictivo.establecerDeshabilitado('reciboCliente', true);
        porId('btnDistribuirRecibo').classList.add('d-none');
        porId('btnEmitirRecibo').classList.add('d-none');
        bootstrap.Modal.getOrCreateInstance(porId('modalNuevoRecibo')).show();
    }

    function abrirComprobanteSoloLectura(id, tipo) {
        var detalle = bootstrap.Modal.getInstance(porId('modalDetalleComprobante'));
        if (detalle) detalle.hide();
        if (tipo === 'REC') {
            apiGet('/recibos/' + Number(id)).then(presentarReciboSoloLectura).catch(function (ex) {
                window.SGTL.toastError(ex.message || 'No se pudo abrir el Recibo.');
            });
            return;
        }
        apiGet('/comprobantes/' + Number(id)).then(presentarComprobanteSoloLectura).catch(function (ex) {
            window.SGTL.toastError(ex.message || 'No se pudo abrir el comprobante.');
        });
    }

    function renderAplicacionesReciboEdicion(aplicaciones) {
        porId('reciboFacturas').innerHTML = (aplicaciones || []).map(function (item) {
            return '<tr><td><input type="checkbox" class="form-check-input" checked disabled></td>' +
                '<td class="cc-document">' + escapar(item.Comprobante) + '</td><td>' + fecha(item.FechaVencimiento) + '</td>' +
                '<td class="text-end">' + dinero(item.ImporteOriginal) + '</td><td class="text-end">—</td>' +
                '<td class="text-end fw-bold">' + dinero(item.Importe) + '</td></tr>';
        }).join('') || '<tr><td colspan="6" class="cc-empty">El Recibo no tiene comprobantes aplicados.</td></tr>';
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
            if (String(recibo.Estado || '').toUpperCase() !== 'EMITIDO') throw new Error('Solo se pueden editar Recibos emitidos.');
            reciboEditandoId = Number(id);
            reciboEditando = recibo;
            reciboOperacion = null;
            porId('modalNuevoReciboTitulo').textContent = 'Editar recibo · ' + (recibo.Numero || '');
            porId('reciboFecha').max = hoyIso();
            porId('reciboFecha').value = String(recibo.Fecha || '').substring(0, 10);
            seleccionarClienteFormulario('reciboCliente', recibo.ClienteID);
            var formaVisual = {
                TRANSFERENCIA: 'Transferencia', EFECTIVO: 'Efectivo', CHEQUE: 'Cheque', OTRO: 'Otro'
            }[String(recibo.FormaPago || '').toUpperCase()] || 'Transferencia';
            porId('reciboFormaPago').value = formaVisual;
            porId('reciboReferencia').value = recibo.Referencia || '';
            porId('reciboFormaImporte').value = Number(recibo.Total || 0).toFixed(2);
            porId('reciboObservaciones').value = recibo.Observaciones || '';
            window.SelectClientePredictivo.establecerDeshabilitado('reciboCliente', true);
            porId('reciboFecha').disabled = false;
            porId('reciboTipoComprobante').disabled = true;
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
            mensaje.innerHTML = '<i class="bi bi-info-circle me-2"></i>Podés modificar la fecha, forma de pago, referencia y observaciones. Las imputaciones y el importe se preservan.';
            var boton = porId('btnEmitirRecibo');
            boton.disabled = false;
            boton.classList.remove('d-none');
            boton.innerHTML = '<i class="bi bi-check-circle me-1"></i>Guardar cambios';
            bootstrap.Modal.getInstance(porId('modalDetalleComprobante')).hide();
            bootstrap.Modal.getOrCreateInstance(porId('modalNuevoRecibo')).show();
        }).catch(function (ex) {
            window.alert(ex.message || 'No se pudo cargar el Recibo.');
        });
    }

    function guardarEdicionRecibo() {
        var error = porId('reciboError');
        var fechaRecibo = porId('reciboFecha').value;
        var forma = porId('reciboFormaPago').value;
        var referencia = porId('reciboReferencia').value.trim();
        error.textContent = '';
        if (!fechaRecibo) { error.textContent = 'Completá la fecha del Recibo.'; return; }
        if (fechaRecibo > hoyIso()) { error.textContent = 'La fecha del Recibo no puede ser futura.'; return; }
        if ((forma === 'Transferencia' || forma === 'Cheque') && !referencia) {
            error.textContent = 'Ingresá la referencia de la transferencia o del cheque.'; return;
        }
        var boton = porId('btnEmitirRecibo');
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Guardando…';
        apiPut('/recibos/' + reciboEditandoId, {
            Fecha: fechaRecibo,
            Letra: porId('reciboLetra').value || null,
            Sucursal: porId('reciboSucursal').value || null,
            FormaPago: forma,
            Referencia: referencia || null,
            Observaciones: porId('reciboObservaciones').value.trim() || null
        }).then(function (recibo) {
            var mensaje = porId('reciboMensaje');
            mensaje.className = 'alert alert-success py-2';
            mensaje.textContent = (recibo.Numero || 'El Recibo') + ' se actualizó correctamente.';
            porId('modalNuevoRecibo').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = true; });
            window.SelectClientePredictivo.establecerDeshabilitado('reciboCliente', true);
            boton.classList.add('d-none');
            reciboEditandoId = null;
            reciboEditando = null;
            cargarCuenta(paginaActual);
        }).catch(function (ex) {
            boton.disabled = false;
            boton.innerHTML = '<i class="bi bi-check-circle me-1"></i>Guardar cambios';
            error.textContent = ex.message || 'No se pudo editar el Recibo.';
        });
    }

    function anularReciboActual(id) {
        if (id != null) comprobanteActualId = Number(id);
        if (!comprobanteActualId) return;
        var motivo = window.prompt('Indicá el motivo de anulación del Recibo:');
        if (motivo === null) return;
        if (!motivo.trim()) { window.alert('El motivo de anulación es obligatorio.'); return; }
        apiPost('/recibos/' + comprobanteActualId + '/anular', { Motivo: motivo.trim() }).then(function () {
            bootstrap.Modal.getInstance(porId('modalDetalleComprobante')).hide();
            cargarCuenta(paginaActual);
            window.alert('El Recibo fue anulado correctamente.');
        }).catch(function (ex) { window.alert(ex.message || 'No se pudo anular el Recibo.'); });
    }

    function eliminarReciboActual(id) {
        if (id != null) comprobanteActualId = Number(id);
        if (!comprobanteActualId) return;
        if (!window.confirm('El Recibo ya fue anulado. ¿Confirmás su eliminación definitiva?')) return;
        apiDelete('/recibos/' + comprobanteActualId).then(function () {
            bootstrap.Modal.getInstance(porId('modalDetalleComprobante')).hide();
            cargarCuenta(paginaActual);
            window.alert('El Recibo fue eliminado correctamente.');
        }).catch(function (ex) { window.alert(ex.message || 'No se pudo eliminar el Recibo.'); });
    }

    function cargarFacturasRecibo() {
        var cliente = clienteReciboActual();
        if (!cliente) {
            porId('reciboFacturas').innerHTML = '<tr><td colspan="6" class="cc-empty">Seleccioná un cliente para ver sus Facturas pendientes.</td></tr>';
            actualizarResumenRecibo();
            return Promise.resolve();
        }
        porId('reciboFacturas').innerHTML = '<tr><td colspan="6" class="cc-empty">Cargando Facturas pendientes…</td></tr>';
        return apiGet('/clientes/' + cliente.ClienteID + '/comprobantes-pendientes').then(function (comprobantes) {
            var clienteFormulario = clienteReciboActual();
            if (!clienteFormulario || clienteFormulario.ClienteID !== cliente.ClienteID) return;
            var facturasPendientes = (comprobantes || []).filter(function (item) { return item.Tipo === 'FAC'; });
            porId('reciboFacturas').innerHTML = facturasPendientes.map(function (item) {
                return '<tr><td><input type="checkbox" class="form-check-input cc-recibo-check" data-id="' + Number(item.ComprobanteID) + '"></td>' +
                    '<td class="cc-document">' + escapar(item.Comprobante) + '</td><td>' + fecha(item.FechaVencimiento) + '</td>' +
                    '<td class="text-end">' + dinero(item.ImporteOriginal) + '</td><td class="text-end fw-bold">' + dinero(item.SaldoPendiente) + '</td>' +
                    '<td class="text-end"><input type="text" inputmode="decimal" class="form-control form-control-sm text-end cc-allocation-input cc-recibo-aplicar" ' +
                    'data-id="' + Number(item.ComprobanteID) + '" data-pendiente="' + Number(item.SaldoPendiente) + '" ' +
                    'data-pendiente-centavos="' + centavos(item.SaldoPendiente) + '" data-vencimiento="' + escapar(item.FechaVencimiento || '') + '" ' +
                    'data-emision="' + escapar(item.FechaEmision || '') + '" disabled value="0,00"></td></tr>';
            }).join('') || '<tr><td colspan="6" class="cc-empty">El cliente no tiene Facturas pendientes.</td></tr>';
            porId('reciboFacturas').querySelectorAll('.cc-recibo-aplicar').forEach(enlazarMascaraMonto);
            actualizarResumenRecibo();
        }).catch(function (ex) {
            porId('reciboFacturas').innerHTML = '<tr><td colspan="6" class="cc-empty text-danger">' +
                escapar(ex.message || 'No se pudieron cargar las Facturas pendientes.') + '</td></tr>';
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
        porId('modalNuevoReciboTitulo').textContent = 'Registrar Recibo';
        seleccionarClienteFormulario('reciboCliente', cliente && cliente.ClienteID);
        porId('reciboFecha').max = hoyIso();
        porId('reciboFecha').value = hoyIso();
        porId('reciboTipoComprobante').value = 'Recibo';
        porId('reciboNumeroComprobante').value = '';
        porId('reciboFormaPago').value = 'Transferencia';
        porId('reciboReferencia').value = '';
        porId('reciboFormaImporte').value = '0,00';
        porId('reciboObservaciones').value = '';
        porId('reciboError').textContent = '';
        var mensaje = porId('reciboMensaje');
        mensaje.className = 'alert alert-info py-2';
        mensaje.innerHTML = '<i class="bi bi-info-circle me-2"></i>Podés ingresar el importe manualmente o seleccionar Facturas para calcularlo automáticamente.';
        porId('modalNuevoRecibo').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = false; });
        window.SelectClientePredictivo.establecerDeshabilitado('reciboCliente', false);
        porId('reciboTipoComprobante').disabled = true;
        porId('reciboNumeroComprobante').readOnly = true;
        porId('reciboFormaImporte').readOnly = false;
        porId('btnDistribuirRecibo').classList.remove('d-none');
        var boton = porId('btnEmitirRecibo');
        boton.classList.remove('d-none'); boton.disabled = true;
        boton.innerHTML = '<i class="bi bi-check-circle me-1"></i>Emitir recibo';
        cargarConfiguracionEmision('REC', {
            tipo: 'reciboTipoComprobante', letra: 'reciboLetra', sucursal: 'reciboSucursal', numero: 'reciboNumeroComprobante'
        }).then(function () {
            boton.disabled = false;
        }).catch(function (ex) {
            porId('reciboError').textContent = ex.message || 'No se pudo cargar la configuración del Recibo.';
        });
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
        if (reciboEditandoId) {
            guardarEdicionRecibo();
            return;
        }
        var cliente = clienteReciboActual();
        var error = porId('reciboError');
        error.textContent = '';
        if (!token()) { error.textContent = 'La sesión venció. Iniciá sesión nuevamente.'; return; }
        if (!cliente) { error.textContent = 'Seleccioná un cliente.'; return; }
        var fechaRecibo = porId('reciboFecha').value;
        var importeInvalido = primerMontoInvalido([
            { etiqueta: 'El importe del Recibo', valor: porId('reciboFormaImporte').value }
        ].concat(camposAplicacionSeleccionados('#reciboFacturas', '.cc-recibo-check', '.cc-recibo-aplicar')));
        if (importeInvalido) { error.textContent = importeInvalido + ' no es válido.'; return; }
        var total = centavos(porId('reciboFormaImporte').value);
        var aplicaciones = aplicacionesRecibo();
        var aplicado = aplicaciones.reduce(function (suma, item) { return suma + centavos(item.Importe); }, 0);
        var forma = porId('reciboFormaPago').value;
        var referencia = porId('reciboReferencia').value.trim();
        if (!fechaRecibo) { error.textContent = 'Completá la fecha del Recibo.'; return; }
        if (fechaRecibo > hoyIso()) { error.textContent = 'La fecha del Recibo no puede ser futura.'; return; }
        if (total <= 0) { error.textContent = 'Ingresá un importe mayor que cero.'; return; }
        var excedePendiente = Array.prototype.some.call(document.querySelectorAll('.cc-recibo-aplicar'), function (input) {
            return !input.disabled && centavos(input.value) > centavos(input.getAttribute('data-pendiente'));
        });
        if (excedePendiente) { error.textContent = 'Un importe aplicado supera el saldo pendiente del comprobante.'; return; }
        if (aplicado > total) { error.textContent = 'El total aplicado no puede superar el total del Recibo.'; return; }
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
            Letra: porId('reciboLetra').value || null,
            Sucursal: porId('reciboSucursal').value || null,
            Total: total / 100,
            FormaPago: forma,
            Referencia: referencia || null,
            ImporteFormaPago: total / 100,
            Observaciones: porId('reciboObservaciones').value.trim() || null,
            Aplicaciones: aplicaciones
        }).then(function (recibo) {
            reciboOperacion = null;
            cerrarModalYNotificar('modalNuevoRecibo', 'Se generó el Recibo ' + (recibo.Numero || '') + ' correctamente.');
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
        }).join('') || '<tr><td colspan="6" class="cc-empty">El cliente no tiene Facturas pendientes.</td></tr>';
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
            porId('cmpFacturasNC').innerHTML = '<tr><td colspan="6" class="cc-empty">Seleccioná un cliente para ver sus Facturas pendientes.</td></tr>';
            porId('btnEmitirComprobante').disabled = true;
            actualizarResumenNotaCredito();
            return Promise.resolve();
        }
        porId('cmpFacturasNC').innerHTML = '<tr><td colspan="6" class="cc-empty">Cargando Facturas pendientes…</td></tr>';
        porId('btnEmitirComprobante').disabled = true;
        return apiGet('/clientes/' + clienteId + '/facturas-referencia').then(function (facturas) {
            var clienteActualFormulario = clienteComprobanteActual();
            if (comprobanteTipo !== 'NC' || !clienteActualFormulario || clienteActualFormulario.ClienteID !== clienteId) return;
            facturasReferencia = (facturas || []).filter(function (item) { return centavos(item.SaldoPendiente) > 0; });
            if (!facturasReferencia.length) {
                porId('cmpFacturasNC').innerHTML = '<tr><td colspan="6" class="cc-empty">No hay Facturas con saldo pendiente.</td></tr>';
                porId('cmpMensaje').className = 'alert alert-warning py-2';
                porId('cmpMensaje').textContent = 'El cliente no tiene Facturas disponibles para emitir una Nota de Crédito.';
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
        porId('cmpReferenciaEtiqueta').textContent = 'Factura relacionada *';
        porId('cmpReferenciaAyuda').textContent = 'Neto, IVA y otros impuestos se completarán según el saldo de la Factura.';
        if (!clienteId) {
            porId('cmpReferencia').innerHTML = '<option value="">Seleccioná un cliente primero</option>';
            porId('btnEmitirComprobante').disabled = true;
            aplicarImportesFacturaReferencia();
            return Promise.resolve();
        }
        porId('cmpReferencia').innerHTML = '<option value="">Cargando Facturas…</option>';
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
    function actualizarClienteComprobante() {
        if (comprobanteTipo !== 'NC') return;
        var cliente = clienteComprobanteActual();
        cargarFacturasReferencia('NC', cliente && cliente.ClienteID).catch(function (ex) {
            porId('cmpError').textContent = ex.message || 'No se pudieron cargar las Facturas de referencia.';
            porId('btnEmitirComprobante').disabled = true;
        });
    }
    function abrirNuevoComprobante(tipo) {
        var cliente = clienteActual();
        comprobanteTipo = tipo;
        comprobanteOperacion = nuevaClave();
        var hoy = hoyIso();
        porId('cmpTitulo').textContent = 'Registrar ' + nombreTipoComprobante(tipo);
        poblarClientesComprobante(cliente && cliente.ClienteID);
        porId('cmpFechaEmision').value = hoy; porId('cmpFechaEmision').max = hoy;
        vencimientoComprobanteEditado = false;
        actualizarVencimientoPredeterminado();
        porId('cmpVencimientoGrupo').classList.toggle('d-none', tipo === 'NC');
        porId('cmpConcepto').value = '';
        porId('cmpIvaPct').querySelectorAll('.cc-iva-factura').forEach(function (opcion) { opcion.remove(); });
        porId('cmpNeto').value = '0,00'; porId('cmpIvaPct').value = '21'; porId('cmpOtros').value = '0,00';
        porId('cmpImporteTotalNC').value = '0,00';
        porId('cmpFacturasNC').innerHTML = '<tr><td colspan="6" class="cc-empty">Seleccioná un cliente para ver sus Facturas pendientes.</td></tr>';
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
            ? 'Ingresá el importe y distribuí la Nota de Crédito entre las Facturas pendientes.'
            : 'Completá los datos para emitir la ' + nombreTipoComprobante(tipo) + '.';
        porId('modalNuevoComprobante').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = false; });
        window.SelectClientePredictivo.establecerDeshabilitado('cmpCliente', false);
        porId('cmpIvaImporte').readOnly = true;
        porId('cmpTipoComprobante').readOnly = true;
        porId('cmpNumeroComprobante').readOnly = true;
        porId('cmpNeto').readOnly = tipo === 'NC';
        porId('cmpOtros').readOnly = tipo === 'NC';
        porId('cmpIvaPct').disabled = tipo === 'NC';
        var boton = porId('btnEmitirComprobante');
        boton.classList.remove('d-none'); boton.disabled = true;
        porId('btnCerrarComprobante').textContent = 'Cancelar';
        boton.innerHTML = '<i class="bi bi-check-circle me-1"></i>Emitir ' + (tipo === 'FAC' ? 'Factura' : tipo);
        recalcularComprobante();
        cargarConfiguracionEmision(tipo, {
            tipo: 'cmpTipoComprobante', letra: 'cmpLetra', sucursal: 'cmpSucursal', numero: 'cmpNumeroComprobante'
        }).then(function () {
            return cargarFacturasReferencia(tipo, cliente && cliente.ClienteID);
        }).then(function () {
            if (comprobanteTipo === tipo && !(tipo === 'NC' && !facturasReferencia.length)) boton.disabled = false;
        }).catch(function (ex) {
            porId('cmpError').textContent = ex.message || 'No se pudo cargar la configuración del comprobante.';
            boton.disabled = true;
        });
        bootstrap.Modal.getOrCreateInstance(porId('modalNuevoComprobante')).show();
    }
    function emitirComprobante() {
        var cliente = clienteComprobanteActual();
        var error = porId('cmpError');
        error.textContent = '';
        if (!token()) { error.textContent = 'La sesión venció. Iniciá sesión nuevamente.'; return; }
        if (!comprobanteTipo) { error.textContent = 'No se pudo determinar el tipo de comprobante.'; return; }
        if (!cliente) { error.textContent = 'Seleccioná un cliente para emitir el comprobante.'; return; }
        var emision = porId('cmpFechaEmision').value;
        var vencimiento = comprobanteTipo === 'NC' ? null : porId('cmpFechaVencimiento').value;
        var referencia = null;
        var concepto = porId('cmpConcepto').value.trim();
        var importeInvalido = comprobanteTipo === 'NC'
            ? primerMontoInvalido([
                { etiqueta: 'El importe total de la Nota de Crédito', valor: porId('cmpImporteTotalNC').value }
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
        if (comprobanteTipo === 'NC' && !aplicaciones.length) { error.textContent = 'Seleccioná una o más Facturas para aplicar la Nota de Crédito.'; return; }
        if (!concepto) { error.textContent = 'Ingresá el concepto del comprobante.'; return; }
        if (importes.neto <= 0) { error.textContent = 'El importe neto debe ser mayor que cero.'; return; }
        if (importes.otros < 0) { error.textContent = 'Otros impuestos no puede ser negativo.'; return; }
        if (comprobanteTipo === 'NC') {
            if (importes.importeSolicitado <= 0) { error.textContent = 'Ingresá el importe total de la Nota de Crédito.'; return; }
            if (importes.aplicado !== importes.importeSolicitado) {
                error.textContent = 'El total aplicado debe coincidir con el importe de la Nota de Crédito.'; return;
            }
            var excedePendiente = Array.prototype.some.call(document.querySelectorAll('.cc-nc-aplicar'), function (input) {
                return !input.disabled && centavos(input.value) > Number(input.getAttribute('data-pendiente-centavos') || 0);
            });
            if (excedePendiente) { error.textContent = 'Un importe aplicado supera el saldo pendiente de la Factura.'; return; }
        }

        var boton = porId('btnEmitirComprobante');
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Emitiendo…';
        apiPost('/comprobantes', {
            ClaveOperacion: comprobanteOperacion, ClienteID: cliente.ClienteID, Tipo: comprobanteTipo,
            FechaEmision: emision, FechaVencimiento: vencimiento, ComprobanteReferenciaID: referencia,
            Concepto: concepto, Neto: importes.neto / 100, IvaPct: Number(porId('cmpIvaPct').value),
            Letra: porId('cmpLetra').value || null, Sucursal: porId('cmpSucursal').value || null,
            IVA: comprobanteTipo === 'NC' ? importes.iva / 100 : null,
            OtrosImpuestos: importes.otros / 100, Observaciones: porId('cmpObservaciones').value.trim() || null,
            Aplicaciones: comprobanteTipo === 'NC' ? aplicaciones : null
        }).then(function (comprobante) {
            comprobanteOperacion = null;
            var nombre = comprobanteTipo === 'FAC' ? 'Factura' :
                comprobanteTipo === 'NC' ? 'Nota de Crédito' : 'Nota de Débito';
            cerrarModalYNotificar('modalNuevoComprobante', 'Se generó la ' + nombre + ' ' + (comprobante.Numero || '') + ' correctamente.');
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
        establecerRangoUltimos30Dias(); porId('ccCliente').value = ''; window.SelectClientePredictivo.sincronizar('ccCliente'); porId('ccTipo').value = '';
        porId('ccEstado').value = ''; porId('ccSoloPendientes').checked = false;
        cambiarVista('movimientos'); cargarCuenta(1);
    }
    function textoFiltroListado() {
        var cliente = clienteActual();
        var filtros = ['Cliente: ' + (cliente ? etiquetaCliente(cliente) : 'Todos')];
        filtros.push('Desde: ' + (porId('ccDesde').value ? fecha(porId('ccDesde').value) : 'Sin límite'));
        filtros.push('Hasta: ' + (porId('ccHasta').value ? fecha(porId('ccHasta').value) : 'Sin límite'));
        filtros.push('Comprobante: ' + (porId('ccTipo').selectedOptions[0].text || 'Todos'));
        filtros.push('Estado: ' + (porId('ccEstado').selectedOptions[0].text || 'Todos'));
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
        doc.text('Cuenta Corriente de Clientes', margen, 12);
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
            doc.text('Cuenta Corriente de Clientes', margen, alto - 6);
            doc.text('Página ' + pagina + ' de ' + paginas, ancho - margen, alto - 6, { align: 'right' });
        }
        return doc;
    }
    function generarListadoExcel(datos) {
        if (!window.XLSX || !window.XLSX.utils) throw new Error('No está disponible el generador de Excel.');
        var titulo = vistaActual === 'pendientes' ? 'Listado de comprobantes sin relacionar' : 'Listado de cuenta corriente';
        var filas = [
            ['Cuenta Corriente de Clientes'],
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
                if (!ventanaPrevia) throw new Error('El navegador bloqueó la ventana de vista previa. Permití las ventanas emergentes e intentá nuevamente.');
                doc.autoPrint();
                ventanaPrevia.location.href = doc.output('bloburl');
            } else {
                doc.save('listado-cuenta-corriente-' + fechaIsoLocal(new Date()) + '.pdf');
            }
            bootstrap.Modal.getInstance(porId('modalExportarCuenta')).hide();
        }).catch(function (error) {
            if (ventanaPrevia && !ventanaPrevia.closed) ventanaPrevia.close();
            alert(error && error.message ? error.message : 'No se pudo generar el listado PDF.');
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
            alert(error && error.message ? error.message : 'No se pudo generar el listado Excel.');
        }).finally(restaurarBotonesListado);
    }

    function enlazarEventos() {
        porId('ccCliente').addEventListener('change', function () { cargarCuenta(1); });
        porId('btnBuscarCuenta').addEventListener('click', function () { cargarCuenta(1); });
        porId('btnLimpiarCuenta').addEventListener('click', limpiarFiltros);
        porId('ccSoloPendientes').addEventListener('change', function () { cambiarVista(this.checked ? 'pendientes' : 'movimientos'); });
        porId('btnNuevoRecibo').addEventListener('click', abrirNuevoRecibo);
        porId('btnEmitirRecibo').addEventListener('click', emitirRecibo);
        porId('btnDistribuirRecibo').addEventListener('click', distribuirRecibo);
        porId('btnDistribuirNC').addEventListener('click', distribuirNotaCredito);
        porId('btnEmitirComprobante').addEventListener('click', emitirComprobante);
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
        porId('btnVerComprobante').addEventListener('click', function () {
            abrirComprobanteSoloLectura(this.getAttribute('data-id'), this.getAttribute('data-tipo'));
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
            var boton = event.target.closest('button[data-accion]');
            if (!boton) return;
            var id = Number(boton.getAttribute('data-id'));
            var tipo = boton.getAttribute('data-tipo');
            var accion = boton.getAttribute('data-accion');
            if (accion === 'ver') {
                if (boton.getAttribute('data-modo') === 'formulario') abrirComprobanteSoloLectura(id, tipo);
                else abrirDetalle(id, boton.getAttribute('data-relacionado') === 'true');
            } else if (accion === 'enviar') abrirEnvioComprobante(id);
            else if (accion === 'editar') abrirEditarRecibo(id);
            else if (accion === 'pdf') abrirVistaPreviaComprobante(id);
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
        porId('reciboFecha').value = hoyIso();
        cargarClientes().then(cargarCuenta).catch(mostrarError);
    }
    window.CuentaCorrienteUI = { inicializar: inicializar };
})(window, document);
