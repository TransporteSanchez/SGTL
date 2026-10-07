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
    function abrirEnvioComprobante() {
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
                mostrarFeedbackEnvio('warning', 'Un administrador debe seleccionar el perfil SMTP desde Configuración > E-mail > Perfil para Facturación.');
                return;
            }
            porId('envioComprobantePerfil').textContent = 'Se utilizará el Servicio ' + datos.Service + ' · ' + (datos.Perfil || datos.Remitente || 'perfil SMTP asignado') + '.';
            boton.disabled = false;
        }).catch(function (error) {
            porId('envioComprobantePerfil').textContent = 'No se pudo verificar la configuración de envío.';
            mostrarFeedbackEnvio('danger', error.message || 'No se pudo preparar el envío del comprobante.');
        });
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
    function actualizarSugerenciasClientes(campoId, sugerenciasId) {
        var textoBusqueda = porId(campoId).value.trim().toLowerCase();
        var coincidencias = textoBusqueda ? clientes.filter(function (item) {
            if (!item.EstadoCliente) return false;
            return String(item.RazonSocial || '').toLowerCase().indexOf(textoBusqueda) !== -1 ||
                String(item.CUIT || '').toLowerCase().indexOf(textoBusqueda) !== -1;
        }).slice(0, 10) : [];
        porId(sugerenciasId).innerHTML = coincidencias.map(function (item) {
            return '<option value="' + escapar(etiquetaCliente(item)) + '"></option>';
        }).join('');
    }
    function establecerClientePredictivo(campoId, clienteIdId, sugerenciasId, clienteId) {
        var cliente = clientes.find(function (item) {
            return item.ClienteID === Number(clienteId) && item.EstadoCliente;
        }) || null;
        porId(campoId).value = cliente ? etiquetaCliente(cliente) : '';
        porId(clienteIdId).value = cliente ? String(cliente.ClienteID) : '';
        actualizarSugerenciasClientes(campoId, sugerenciasId);
    }
    function clientePredictivoActual(campoId, clienteIdId) {
        var campo = porId(campoId);
        var valor = campo.value.trim();
        var id = Number(porId(clienteIdId).value || 0);
        var clientePorId = clientes.find(function (item) { return item.ClienteID === id && item.EstadoCliente; }) || null;
        if (clientePorId && valor === etiquetaCliente(clientePorId)) return clientePorId;
        var clientePorTexto = clientes.find(function (item) {
            return item.EstadoCliente && etiquetaCliente(item) === valor;
        }) || null;
        porId(clienteIdId).value = clientePorTexto ? String(clientePorTexto.ClienteID) : '';
        return clientePorTexto;
    }
    function sincronizarClientePredictivo(campoId, clienteIdId, sugerenciasId) {
        var cliente = clientePredictivoActual(campoId, clienteIdId);
        actualizarSugerenciasClientes(campoId, sugerenciasId);
        return cliente;
    }
    function clienteComprobanteActual() { return clientePredictivoActual('cmpCliente', 'cmpClienteId'); }
    function clienteReciboActual() { return clientePredictivoActual('reciboCliente', 'reciboClienteId'); }
    function poblarClientesComprobante(clienteId) {
        establecerClientePredictivo('cmpCliente', 'cmpClienteId', 'cmpClientesSugeridos', clienteId);
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
            select.innerHTML = '<option value="">Todos los clientes</option>' + clientes.filter(function (item) {
                return item.EstadoCliente;
            }).map(function (item) {
                return '<option value="' + item.ClienteID + '">' + escapar(item.RazonSocial + ' — ' + item.CUIT) + '</option>';
            }).join('');
            // La consulta siempre inicia sin cliente: el usuario puede limitarla desde el filtro.
            select.value = '';
            select.disabled = false;
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
                botonDetalle(item.ComprobanteID, item.Comprobante) + '</td></tr>';
            var saldoProgresivo = Number(item.Debe || 0);
            var filasAplicaciones = aplicaciones.map(function (aplicacion) {
                saldoProgresivo = Math.max(0, saldoProgresivo - Number(aplicacion.Importe || 0));
                aplicacion.Saldo = saldoProgresivo;
                return '<tr class="cc-application-row d-none" data-parent="' + Number(item.ComprobanteID) + '">' +
                    '<td></td><td>' + fecha(aplicacion.Fecha) + '</td>' +
                    (mostrarCliente ? '<td>' + escapar(aplicacion.Cliente || item.Cliente || '—') + '</td>' : '') + '<td class="cc-document cc-application-document">' +
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
                '<td class="text-center">' + botonDetalle(item.ComprobanteID, item.Comprobante) + '</td></tr>';
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
        var esComprobanteImprimible = ['FAC', 'REC', 'NC', 'ND'].indexOf(item.Tipo) !== -1 ||
            /^(FAC|REC|NC|ND)-/.test(String(item.Comprobante || ''));
        var esRecibo = item.Tipo === 'REC' || /^REC-/.test(String(item.Comprobante || ''));
        var estadoRecibo = String(item.EstadoComprobante || (String(item.Estado || '').toLowerCase() === 'anulado' ? 'ANULADO' : 'EMITIDO')).toUpperCase();
        porId('btnImprimirFactura').classList.toggle('d-none', !esComprobanteImprimible);
        porId('btnDescargarFactura').classList.toggle('d-none', !esComprobanteImprimible);
        porId('btnEnviarComprobanteMail').classList.toggle('d-none', !esComprobanteImprimible);
        porId('btnEditarRecibo').classList.toggle('d-none', !esRecibo || estadoRecibo !== 'EMITIDO');
        porId('btnAnularRecibo').classList.toggle('d-none', !esRecibo || estadoRecibo !== 'EMITIDO');
        porId('btnEliminarRecibo').classList.toggle('d-none', !esRecibo || estadoRecibo !== 'ANULADO');
        bootstrap.Modal.getOrCreateInstance(porId('modalDetalleComprobante')).show();
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
            if (String(recibo.Estado || '').toUpperCase() !== 'EMITIDO') throw new Error('Solo se pueden editar Recibos emitidos.');
            reciboEditandoId = Number(id);
            reciboEditando = recibo;
            reciboOperacion = null;
            porId('modalNuevoReciboTitulo').textContent = 'Editar recibo · ' + (recibo.Numero || '');
            porId('reciboFecha').max = hoyIso();
            porId('reciboFecha').value = String(recibo.Fecha || '').substring(0, 10);
            porId('reciboCliente').value = (recibo.RazonSocial || 'Cliente') + (recibo.CUIT ? ' — ' + recibo.CUIT : '');
            porId('reciboClienteId').value = String(recibo.ClienteID || '');
            porId('reciboTotal').value = Number(recibo.Total || 0).toFixed(2);
            var formaVisual = {
                TRANSFERENCIA: 'Transferencia', EFECTIVO: 'Efectivo', CHEQUE: 'Cheque', OTRO: 'Otro'
            }[String(recibo.FormaPago || '').toUpperCase()] || 'Transferencia';
            porId('reciboFormaPago').value = formaVisual;
            porId('reciboReferencia').value = recibo.Referencia || '';
            porId('reciboFormaImporte').value = Number(recibo.Total || 0).toFixed(2);
            porId('reciboObservaciones').value = recibo.Observaciones || '';
            porId('reciboCliente').disabled = true;
            porId('reciboFecha').disabled = false;
            porId('reciboTotal').readOnly = true;
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
            FormaPago: forma,
            Referencia: referencia || null,
            Observaciones: porId('reciboObservaciones').value.trim() || null
        }).then(function (recibo) {
            var mensaje = porId('reciboMensaje');
            mensaje.className = 'alert alert-success py-2';
            mensaje.textContent = (recibo.Numero || 'El Recibo') + ' se actualizó correctamente.';
            porId('modalNuevoRecibo').querySelectorAll('input,select,textarea').forEach(function (campo) { campo.disabled = true; });
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

    function anularReciboActual() {
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

    function eliminarReciboActual() {
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
                    '<td class="text-end"><input type="number" min="0" step="0.01" class="form-control form-control-sm text-end cc-allocation-input cc-recibo-aplicar" ' +
                    'data-id="' + Number(item.ComprobanteID) + '" data-pendiente="' + Number(item.SaldoPendiente) + '" disabled value="0.00"></td></tr>';
            }).join('') || '<tr><td colspan="6" class="cc-empty">El cliente no tiene Facturas pendientes.</td></tr>';
            actualizarResumenRecibo();
        }).catch(function (ex) {
            porId('reciboFacturas').innerHTML = '<tr><td colspan="6" class="cc-empty text-danger">' +
                escapar(ex.message || 'No se pudieron cargar las Facturas pendientes.') + '</td></tr>';
            actualizarResumenRecibo();
        });
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
        var cliente = clienteActual();
        reciboEditandoId = null;
        reciboEditando = null;
        reciboOperacion = nuevaClave();
        porId('modalNuevoReciboTitulo').textContent = 'Nuevo recibo';
        establecerClientePredictivo('reciboCliente', 'reciboClienteId', 'reciboClientesSugeridos', cliente && cliente.ClienteID);
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
        porId('cmpTitulo').textContent = 'Nueva ' + nombreTipoComprobante(tipo);
        poblarClientesComprobante(cliente && cliente.ClienteID);
        porId('cmpFechaEmision').value = hoy; porId('cmpFechaEmision').max = hoy;
        vencimientoComprobanteEditado = false;
        actualizarVencimientoPredeterminado();
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
        porId('cmpIvaImporte').readOnly = true;
        porId('cmpNeto').readOnly = tipo === 'NC';
        porId('cmpOtros').readOnly = tipo === 'NC';
        porId('cmpIvaPct').disabled = tipo === 'NC';
        var boton = porId('btnEmitirComprobante');
        boton.classList.remove('d-none'); boton.disabled = false;
        boton.innerHTML = '<i class="bi bi-check-circle me-1"></i>Emitir ' + (tipo === 'FAC' ? 'Factura' : tipo);
        recalcularComprobante();
        cargarFacturasReferencia(tipo, cliente && cliente.ClienteID).catch(function (ex) {
            porId('cmpError').textContent = ex.message || 'No se pudieron cargar las Facturas de referencia.';
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
        establecerRangoUltimos30Dias(); porId('ccCliente').value = ''; porId('ccTipo').value = '';
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
    function cambiarEstadoBotonesListado(ocupado, texto) {
        ['btnVistaPreviaListado', 'btnDescargarListadoPdf'].forEach(function (id) {
            var boton = porId(id);
            boton.disabled = ocupado;
            if (ocupado) boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>' + texto;
        });
    }
    function restaurarBotonesListado() {
        porId('btnVistaPreviaListado').disabled = false;
        porId('btnVistaPreviaListado').innerHTML = '<i class="bi bi-printer me-1"></i>Vista previa e imprimir';
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

    function enlazarEventos() {
        porId('ccCliente').addEventListener('change', function () { cargarCuenta(1); });
        porId('btnBuscarCuenta').addEventListener('click', function () { cargarCuenta(1); });
        porId('btnLimpiarCuenta').addEventListener('click', limpiarFiltros);
        porId('ccSoloPendientes').addEventListener('change', function () { cambiarVista(this.checked ? 'pendientes' : 'movimientos'); });
        porId('btnNuevoRecibo').addEventListener('click', abrirNuevoRecibo);
        porId('btnEmitirRecibo').addEventListener('click', emitirRecibo);
        porId('btnEmitirComprobante').addEventListener('click', emitirComprobante);
        porId('cmpCliente').addEventListener('input', function () {
            sincronizarClientePredictivo('cmpCliente', 'cmpClienteId', 'cmpClientesSugeridos');
        });
        porId('cmpCliente').addEventListener('change', function () {
            sincronizarClientePredictivo('cmpCliente', 'cmpClienteId', 'cmpClientesSugeridos');
            actualizarClienteComprobante();
        });
        porId('reciboCliente').addEventListener('input', function () {
            sincronizarClientePredictivo('reciboCliente', 'reciboClienteId', 'reciboClientesSugeridos');
        });
        porId('reciboCliente').addEventListener('change', function () {
            sincronizarClientePredictivo('reciboCliente', 'reciboClienteId', 'reciboClientesSugeridos');
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
        porId('btnExportarCuenta').addEventListener('click', abrirExportacionCuenta);
        porId('btnVistaPreviaListado').addEventListener('click', function () { exportarListadoPdf('vistaPrevia'); });
        porId('btnDescargarListadoPdf').addEventListener('click', function () { exportarListadoPdf('descargar'); });
        porId('btnImprimirFactura').addEventListener('click', function () {
            if (comprobanteActualId && window.imprimirComprobantePDF) window.imprimirComprobantePDF(comprobanteActualId);
        });
        porId('btnDescargarFactura').addEventListener('click', function () {
            if (comprobanteActualId && window.descargarComprobantePDF) window.descargarComprobantePDF(comprobanteActualId);
        });
        porId('btnEnviarComprobanteMail').addEventListener('click', function () {
            abrirEnvioComprobante();
        });
        porId('btnConfirmarEnvioComprobante').addEventListener('click', enviarComprobantePorEmail);
        porId('btnEditarRecibo').addEventListener('click', function () { abrirEditarRecibo(comprobanteActualId); });
        porId('btnAnularRecibo').addEventListener('click', anularReciboActual);
        porId('btnEliminarRecibo').addEventListener('click', eliminarReciboActual);
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
