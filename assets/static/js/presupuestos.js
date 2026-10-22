(function () {
    'use strict';
    var api = 'http://localhost:50222/api', clientes = [], origenes = [], destinos = [], registros = [], choferes = [];
    var actual = null, base = null, tarifa = null, secuencia = 0, revision = 0, timer, modal, guardando = false;
    var envioActual = null, enviando = false, secuenciaEnvio = 0, modalEnvio, modalViaje, presupuestoViaje = null, generandoViaje = false;
    var modalVista, urlVista = null, secuenciaVista = 0;
    // Filtros aplicados (§1.3: se aplican con Buscar, Enter o la cruz) y paginación del listado (§2.2).
    var filtrosAplicados = {}, paginaActual = 1, tamanioPagina = 15, presupuestoEstado = null;
    var campos = ['id', 'email', 'fechaInicio', 'fechaFin', 'camionId', 'distancia', 'choferId', 'tipoTarifa', 'validez', 'pago', 'tiempo', 'condiciones'];
    function el(id) { return document.getElementById(id); }
    // Avisos (§5.1): los resultados van en toasts; el error de un modal queda arriba, dentro del modal.
    function aviso(id, texto, error) {
        if (id === 'mensaje') { if (texto) SGTL[error ? 'toastError' : 'toastExito'](texto); return; }
        if (texto && !error) { SGTL.avisoFormulario('#' + id, ''); SGTL.toastExito(texto); return; }
        SGTL.avisoFormulario('#' + id, texto);
    }
    // Texto del error para el usuario (§9): "error" ya viene redactado; el "Message" de Web API solo cuando
    // rechaza un dato (400, 404 o 409).
    function textoError(error, porDefecto) {
        var r = error && error.respuesta;
        if (r && r.error) return r.error;
        if (r && r.Message && [400, 404, 409].indexOf(error.status) !== -1) return r.Message;
        if (typeof r === 'string' && error.status === 400) return r;
        return porDefecto;
    }
    // Fecha y hora con flatpickr (§7.1): se ve DD/MM/AAAA HH:MM y el campo guarda AAAA-MM-DDTHH:MM, como antes.
    function prepararFechaHora(id) {
        SGTL.selectorFecha(el(id), { enableTime: true, time_24hr: true, dateFormat: 'Y-m-d\\TH:i', altInput: true, altFormat: 'd/m/Y H:i' });
    }
    function ponerFechaHora(id, valor) {
        var fp = el(id)._flatpickr;
        if (!fp) { el(id).value = valor || ''; return; }
        if (valor) fp.setDate(valor, false); else fp.clear(false);
    }
    function pedir(url, opciones) { return fetch(url, opciones).then(function (r) {
        return r.text().then(function (t) {
            var contenido = null;
            try { contenido = t ? JSON.parse(t) : null; } catch (e) { if (r.ok) throw e; }
            if (!r.ok) { var error = new Error('HTTP ' + r.status); error.status = r.status; error.respuesta = contenido; throw error; }
            return contenido;
        });
    }); }
    function opcion(select, valor, texto) { var o = document.createElement('option'); o.value = valor; o.textContent = texto; select.appendChild(o); }
    function nombre(id) { var s = el(id); return s.selectedIndex > 0 ? s.options[s.selectedIndex].textContent : ''; }
    function opcionesRuta(origenId, destinoId) {
        el('agregarOrigenPresupuesto').disabled = !el('cliente').value;
        el('agregarDestinoPresupuesto').disabled = !el('cliente').value;
        [['origenId', origenes, 'Origen_ID', origenId], ['destinoId', destinos, 'Destino_ID', destinoId]].forEach(function (cfg) {
            var s = el(cfg[0]); s.textContent = ''; opcion(s, '', cfg[0] === 'origenId' ? 'Seleccioná un origen' : 'Seleccioná un destino'); s.disabled = !el('cliente').value;
            cfg[1].filter(function (x) { return String(x.ClienteID) === el('cliente').value; }).forEach(function (x) { opcion(s, x[cfg[2]], x.Descripcion); });
            if (cfg[3]) s.value = String(cfg[3]);
        });
    }
    function invalidarDocumento() { revision++; actual = null; }
    function reiniciar() {
        secuencia++; clearTimeout(timer); SGTL.reiniciarFormulario('#formulario', '#mensajeForm'); formulario.reiniciar();
        ponerFechaHora('fechaInicio', ''); ponerFechaHora('fechaFin', ''); el('id').value = ''; el('importe').value = ''; tarifa = null; actual = null; base = null;
        opcionesRuta(); el('tarifaInfo').textContent = 'Completá los datos y seleccioná el tipo de tarifa.';
    }
    function calcular() {
        var version = ++secuencia, tipo = el('tipoTarifa').value, url, params;
        tarifa = null; el('importe').value = '';
        if (!tipo) { el('tarifaInfo').textContent = 'Seleccioná un tipo de tarifa.'; return; }
        if (tipo === 'fija') {
            if (!el('cliente').value || !el('origenId').value || !el('destinoId').value) { el('tarifaInfo').textContent = 'Seleccioná cliente, origen y destino para buscar la tarifa fija.'; return; }
            params = new URLSearchParams({clienteId: el('cliente').value, origenId: el('origenId').value, destinoId: el('destinoId').value}); url = '/TarifasFijas/PorRuta?';
        } else {
            if (!el('fechaInicio').value || !el('fechaFin').value || !(Number(el('distancia').value) > 0)) { el('tarifaInfo').textContent = 'Completá las fechas y los kilómetros para calcular la tarifa.'; return; }
            if (el('fechaFin').value < el('fechaInicio').value) { el('tarifaInfo').textContent = 'La fecha de fin no puede ser anterior a la de inicio.'; return; }
            params = new URLSearchParams({fechaInicio: el('fechaInicio').value, fechaFin: el('fechaFin').value, km: el('distancia').value}); url = '/TarifasKm/Calcular?';
        }
        el('tarifaInfo').textContent = 'Calculando tarifa…';
        pedir(api + url + params.toString()).then(function (r) {
            if (version !== secuencia) return;
            var importe = Number(tipo === 'fija' ? r.ValorFijoNeto : r.MontoCalculado);
            if (!Number.isFinite(importe) || importe < 0) throw new Error('Importe inválido');
            tarifa = {tipo: tipo, id: tipo === 'fija' ? r.TarifaFija_ID : r.TarifaKm_ID, valorKm: tipo === 'km' ? r.ValorKm : null, importe: importe.toFixed(2)};
            el('importe').value = tarifa.importe;
            el('tarifaInfo').textContent = tipo === 'fija' ? 'Tarifa fija #' + tarifa.id + '. Se utiliza la tarifa vigente o la más reciente registrada para la ruta.' : 'Tarifa por km #' + tarifa.id + ': $ ' + r.ValorKm + ' por km × ' + el('distancia').value + ' km.';
        }).catch(function (error) {
            if (version !== secuencia) return;
            var info = el('tarifaInfo');
            if (tipo === 'km' && error.status === 404 && error.respuesta && error.respuesta.Mensaje) {
                info.textContent = 'No hay una tarifa por km vigente para las fechas seleccionadas y ' + el('distancia').value + ' km. Registrá una tarifa que cubra ese período y distancia en ';
                var enlace = document.createElement('a'); enlace.href = 'gestion-tarifas.html'; enlace.target = '_blank'; enlace.rel = 'noopener'; enlace.textContent = 'Gestionar tarifas'; info.appendChild(enlace); info.appendChild(document.createTextNode('.'));
            } else if (tipo === 'fija' && error.status === 404) {
                info.textContent = 'No hay una tarifa fija registrada para el cliente y la ruta seleccionados.';
            } else {
                info.textContent = 'No se pudo calcular la tarifa. Revisá los datos y probá de nuevo.';
            }
        });
    }
    function solicitarCalculo() { secuencia++; tarifa = null; el('importe').value = ''; clearTimeout(timer); timer = setTimeout(calcular, 250); }
    function datos() {
        var d = Object.assign({}, base || {}); campos.forEach(function (k) { d[k] = el(k).value; });
        d.clienteId = el('cliente').value; d.cliente = nombre('cliente'); d.origenId = el('origenId').value; d.origen = nombre('origenId'); d.destinoId = el('destinoId').value; d.destino = nombre('destinoId');
        d.camion = nombre('camionId'); d.chofer = nombre('choferId'); d.importe = tarifa.importe; d.tarifaId = tarifa.id; d.valorKm = tarifa.valorKm;
        if (!d.fecha) d.fecha = new Date().toLocaleDateString('en-CA'); return d;
    }
    function listar() {
        pedir(api + '/Presupuestos').then(function (items) { registros = items || []; dibujar(); }).catch(function () {
            SGTL.tabla.vacia('#lista', 8, 'No se pudieron cargar los presupuestos.');
            aviso('mensaje', 'No se pudieron cargar los presupuestos. Probá de nuevo.', true);
        });
    }
    function sinTildes(texto) { return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(); }
    function cumpleFiltros(p) {
        var f = filtrosAplicados;
        if (f.numero && String(p.id) !== String(Number(f.numero))) return false;
        if (f.cliente && String(p.clienteId) !== f.cliente) return false;
        if (f.estado && p.estado !== f.estado) return false;
        var fecha = String(p.fecha || '').substring(0, 10);
        if (f.fecha && (fecha < f.fecha.desde || fecha > f.fecha.hasta)) return false;
        if (f.ruta && sinTildes(p.origen + ' ' + p.destino).indexOf(f.ruta) === -1) return false;
        return true;
    }
    // Etiqueta de estado (§4.1): Pendiente es esperar la respuesta del cliente (gris, no es deuda); Aceptado
    // es amarillo mientras falta generar el viaje y verde cuando ya se generó; Rechazado, rojo.
    function etiquetaEstado(p) {
        var estado = p.estado || 'Pendiente';
        var color = estado === 'Rechazado' ? 'rojo' : estado === 'Aceptado' ? (p.viajeId ? 'verde' : 'amarillo') : 'gris';
        return SGTL.estado(estado, estado, color);
    }
    function dibujar() {
        var cuerpo = el('lista');
        var items = registros.filter(cumpleFiltros);
        var totalPaginas = tamanioPagina ? Math.max(1, Math.ceil(items.length / tamanioPagina)) : 1;
        if (paginaActual > totalPaginas) paginaActual = totalPaginas;
        SGTL.tabla.paginacion('#paginacion', {
            pagina: paginaActual, tamanioPagina: tamanioPagina, total: items.length,
            alCambiarPagina: function (pagina) { paginaActual = pagina; dibujar(); },
            alCambiarTamanio: function (tamanio) { tamanioPagina = tamanio; paginaActual = 1; dibujar(); }
        });
        if (!items.length) { SGTL.tabla.vacia(cuerpo, 8, registros.length ? '' : 'Todavía no hay presupuestos cargados.'); return; }
        if (tamanioPagina) items = items.slice((paginaActual - 1) * tamanioPagina, paginaActual * tamanioPagina);
        SGTL.tabla.llenar(cuerpo, '');
        items.forEach(function (p) {
            var tr = cuerpo.insertRow();
            // Número, fecha (centrada), cliente, ruta, km e importe (a la derecha), §2.1. Origen y destino van en
            // una sola columna para que la tabla entre en una notebook sin desplazarse hacia el costado.
            [[p.id, ''], [SGTL.fecha(p.fecha), 'text-center text-nowrap'], [p.cliente, ''], [(p.origen || '—') + ' → ' + (p.destino || '—'), ''],
             [p.distancia ? SGTL.km(p.distancia) : '—', 'text-end text-nowrap'], [SGTL.monto(p.importe || 0), 'text-end text-nowrap']].forEach(function (v) {
                var celda = tr.insertCell(); celda.textContent = v[0] || ''; if (v[1]) celda.className = v[1];
            });
            var estadoCelda = tr.insertCell();
            // El viaje generado va como etiqueta informativa junto al estado, igual que "En PF-…" en viajes (§4.3).
            estadoCelda.className = 'text-center';
            estadoCelda.innerHTML = etiquetaEstado(p) + (p.viajeId ? '<div class="mt-1"><span class="badge rounded-pill bg-white text-dark border">Viaje #' + Number(p.viajeId) + '</span></div>' : '');
            // Botones de la fila (§1.4), en el orden del circuito: editar, PDF (con imprimir y e-mail adentro),
            // cambiar estado (banderita), siguiente paso (generar viaje) y eliminar. Lo que no se puede hacer queda
            // deshabilitado con el motivo.
            var td = tr.insertCell(); td.className = 'text-center text-nowrap';
            var conViaje = !!p.viajeId;
            var motivoGenerar = conViaje ? 'Ya se generó el viaje #' + p.viajeId : 'Primero marcalo como aceptado';
            td.innerHTML = SGTL.accionesFila([
                SGTL.botonFila('editar', { id: p.id, deshabilitado: p.estado !== 'Pendiente' || conViaje, motivo: 'Solo se editan presupuestos pendientes' }),
                SGTL.botonFila('pdf', { id: p.id, texto: 'Ver PDF' }),
                SGTL.botonFila('estado', { id: p.id, deshabilitado: conViaje, motivo: 'Ya se generó el viaje #' + p.viajeId + ': el estado no cambia' }),
                SGTL.botonFila('siguiente', { id: p.id, texto: 'Generar viaje', icono: 'bi-truck', deshabilitado: p.estado !== 'Aceptado' || conViaje, motivo: motivoGenerar }),
                SGTL.botonFila('eliminar', { id: p.id, deshabilitado: conViaje, motivo: 'Ya tiene un viaje generado: no se puede eliminar' })
            ]);
            var acciones = { editar: function () { abrir(p); }, pdf: function () { imprimirPresupuesto(p); },
                estado: function () { abrirCambioEstado(p); }, siguiente: function () { abrirGenerarViaje(p); }, eliminar: function () { eliminar(p); } };
            Array.prototype.forEach.call(td.querySelectorAll('[data-accion]'), function (boton) { boton.onclick = acciones[boton.getAttribute('data-accion')]; });
        });
    }
    function conservarOpcion(id, valor, texto) { if (!valor) return; var s = el(id); if (!Array.prototype.some.call(s.options, function (o) { return o.value === String(valor); })) opcion(s, valor, (texto || 'Registro ' + valor) + ' (histórico)'); s.value = String(valor); }
    function abrir(p) {
        reiniciar(); el('tituloModal').textContent = 'Editar presupuesto #' + p.id;
        campos.forEach(function (k) { if (el(k)) el(k).value = p[k] || ''; }); ponerFechaHora('fechaInicio', p.fechaInicio); ponerFechaHora('fechaFin', p.fechaFin);
        conservarOpcion('cliente', p.clienteId, p.cliente); opcionesRuta(p.origenId, p.destinoId);
        conservarOpcion('origenId', p.origenId, p.origen); conservarOpcion('destinoId', p.destinoId, p.destino); conservarOpcion('camionId', p.camionId, p.camion); conservarOpcion('choferId', p.choferId, p.chofer);
        base = Object.assign({}, p); actual = Object.assign({}, p); if (p.tarifaId && p.tipoTarifa && p.importe !== undefined) { tarifa = {tipo: p.tipoTarifa, id: p.tarifaId, valorKm: p.valorKm, importe: String(p.importe)}; el('importe').value = p.importe; el('tarifaInfo').textContent = 'Importe guardado con el presupuesto. Se recalculará si modificás los datos de la tarifa.'; }
        else { el('tarifaInfo').textContent = 'Presupuesto anterior: completá los datos del viaje y seleccioná una tarifa para actualizarlo.'; }
        modal.show();
    }
    function eliminar(p) {
        SGTL.confirmar({
            titulo: '¿Eliminar el presupuesto #' + p.id + '?',
            mensaje: 'No se puede deshacer.',
            verbo: 'Eliminar',
            peligro: true,
            accion: function () {
                return pedir(api + '/Presupuestos/' + p.id, {method:'DELETE'}).catch(function (falla) {
                    var error = new Error('eliminar'); error.mensajeUsuario = textoError(falla, 'No se pudo eliminar el presupuesto. Probá de nuevo.'); throw error;
                });
            }
        }).then(function (eliminado) { if (eliminado) { aviso('mensaje', 'Presupuesto #' + p.id + ' eliminado.', false); listar(); } });
    }
    function clientePresupuesto(p) { return clientes.find(function (c) { return String(c.Cliente_ID) === String(p.clienteId); }) || null; }
    function encabezadosEnvio() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }; }
    // Cambiar estado (banderita): una ventana con los estados a los que puede pasar, cada uno con lo que significa.
    var ESTADOS = {
        Pendiente: { texto: 'Vuelve a esperar la respuesta del cliente y se puede editar.', aviso: 'vuelve a pendiente', color: 'gris' },
        Aceptado: { texto: 'El cliente lo aceptó. Queda listo para generar el viaje.', aviso: 'aceptado', color: 'amarillo' },
        Rechazado: { texto: 'El cliente no lo aceptó. Queda guardado como rechazado.', aviso: 'rechazado', color: 'rojo' }
    };
    function abrirCambioEstado(p) {
        presupuestoEstado = p;
        var actual = p.estado || 'Pendiente';
        el('tituloEstadoPresupuesto').textContent = 'Cambiar estado del presupuesto #' + p.id;
        el('estadoPresupuestoResumen').textContent = p.cliente + ' · ' + p.origen + ' → ' + p.destino + ' · ' + SGTL.monto(p.importe || 0);
        el('estadoPresupuestoActual').innerHTML = etiquetaEstado(p);
        SGTL.opcionesEstado('#estadoPresupuestoOpciones', 'estadoPresupuestoNuevo', Object.keys(ESTADOS).filter(function (e) { return e !== actual; }).map(function (e) {
            return { valor: e, etiqueta: SGTL.estado(e, e, ESTADOS[e].color), texto: ESTADOS[e].texto };
        }));
        SGTL.avisoFormulario('#avisoEstadoPresupuesto', '');
        SGTL.modal('#modalEstadoPresupuesto', 'show');
    }
    el('estadoPresupuestoOpciones').addEventListener('change', function () { SGTL.avisoFormulario('#avisoEstadoPresupuesto', ''); });
    el('formEstadoPresupuesto').addEventListener('submit', function (evento) {
        evento.preventDefault();
        var p = presupuestoEstado, estado = SGTL.estadoElegido('#estadoPresupuestoOpciones');
        if (!p) return;
        if (!estado) { el('estadoPresupuestoOpciones').classList.add('is-invalid'); SGTL.avisoFormulario('#avisoEstadoPresupuesto', 'Elegí el estado nuevo.'); return; }
        var listo = SGTL.procesando('#btnGuardarEstadoPresupuesto');
        pedir(api + '/Presupuestos/' + encodeURIComponent(p.id) + '/estado', { method: 'PUT', headers: encabezadosEnvio(), body: JSON.stringify({ Estado: estado }) }).then(function () {
            listo(); SGTL.modal('#modalEstadoPresupuesto', 'hide');
            SGTL.toastExito('Presupuesto #' + p.id + ' ' + ESTADOS[estado].aviso + '.'); listar();
        }).catch(function (error) {
            listo(); SGTL.avisoFormulario('#avisoEstadoPresupuesto', textoError(error, 'No se pudo cambiar el estado. Probá de nuevo.'));
        });
    });
    function abrirGenerarViaje(p) {
        presupuestoViaje = p; el('tituloGenerarViaje').textContent = 'Generar viaje del presupuesto #' + p.id; aviso('generarViajeFeedback', '', false);
        SGTL.limpiarError(el('generarViajeChofer'));
        var selector = el('generarViajeChofer'); selector.textContent = ''; opcion(selector, '', 'Seleccioná un chofer');
        choferes.filter(function (c) { return (c.EstadoChofer || '').toLowerCase() === 'activo'; }).forEach(function (c) { opcion(selector, c.Chofer_ID, c.Apellido + ', ' + c.Nombre); });
        selector.value = p.choferId || ''; el('btnGenerarViaje').disabled = false; modalViaje.show();
    }
    el('formGenerarViaje').onsubmit = function (e) {
        e.preventDefault(); if (!presupuestoViaje || generandoViaje) return;
        if (!el('generarViajeChofer').value) { SGTL.marcarError(el('generarViajeChofer'), 'Seleccioná un chofer.'); el('generarViajeChofer').focus(); return; }
        SGTL.limpiarError(el('generarViajeChofer'));
        generandoViaje = true; var listo = SGTL.procesando('#btnGenerarViaje');
        pedir(api + '/Presupuestos/' + encodeURIComponent(presupuestoViaje.id) + '/viaje', { method: 'POST', headers: encabezadosEnvio(), body: JSON.stringify({ ChoferID: Number(el('generarViajeChofer').value) }) }).then(function (r) {
            generandoViaje = false; listo();
            modalViaje.hide(); aviso('mensaje', 'Viaje #' + r.ViajeID + ' generado.', false); listar();
        }).catch(function (error) {
            generandoViaje = false; listo(); aviso('generarViajeFeedback', textoError(error, 'No se pudo generar el viaje. Probá de nuevo.'), true); listar();
        });
    };
    function abrirEnvio(p) {
        var version = ++secuenciaEnvio; envioActual = null;
        el('tituloEnviarPresupuesto').textContent = 'Enviar por e-mail el presupuesto #' + p.id;
        el('envioPresupuestoDestino').value = ''; SGTL.limpiarError(el('envioPresupuestoDestino')); el('envioPresupuestoPerfil').textContent = 'Verificando el perfil SMTP…';
        el('btnEnviarPresupuesto').disabled = true; el('envioPresupuestoFeedback').className = 'alert alert-light-danger color-danger d-none'; aviso('envioPresupuestoFeedback', '', false); modalEnvio.show();
        pedir(api + '/Presupuestos/' + encodeURIComponent(p.id) + '/email', { headers: encabezadosEnvio() }).then(function (r) {
            if (version !== secuenciaEnvio) return;
            if (!r.Configurado) {
                el('envioPresupuestoPerfil').textContent = '';
                el('envioPresupuestoFeedback').className = 'alert alert-light-warning color-warning';
                el('envioPresupuestoFeedback').textContent = 'No hay un perfil SMTP asignado a presupuestos. Un administrador lo asigna en Configuración > Gestionar e-mail.';
                return;
            }
            envioActual = r; el('envioPresupuestoDestino').value = r.Presupuesto.email || '';
            el('envioPresupuestoPerfil').textContent = '';
            el('btnEnviarPresupuesto').disabled = false;
        }).catch(function (error) { if (version !== secuenciaEnvio) return; el('envioPresupuestoPerfil').textContent = ''; aviso('envioPresupuestoFeedback', textoError(error, 'No se pudo preparar el envío. Probá de nuevo.'), true); });
    }
    el('formEnviarPresupuesto').onsubmit = function (e) {
        e.preventDefault(); if (!envioActual || enviando) return;
        var destino = el('envioPresupuestoDestino');
        if (!destino.value.trim() || !destino.checkValidity()) { SGTL.marcarError(destino, destino.value.trim() ? 'Escribí un e-mail válido.' : 'Completá el destinatario.'); destino.focus(); return; }
        SGTL.limpiarError(destino);
        enviando = true; var listo = SGTL.procesando('#btnEnviarPresupuesto', 'Enviando…'); aviso('envioPresupuestoFeedback', '', false);
        window.PresupuestoPDF.preparar(envioActual.Presupuesto, clientePresupuesto(envioActual.Presupuesto)).then(function (doc) {
            var pdf = doc.output('datauristring').split(',')[1];
            return pedir(api + '/Presupuestos/' + encodeURIComponent(envioActual.Presupuesto.id) + '/email', { method: 'POST', headers: encabezadosEnvio(), body: JSON.stringify({ Destinatario: el('envioPresupuestoDestino').value.trim(), PdfBase64: pdf, Version: envioActual.Version }) });
        }).then(function (r) {
            enviando = false; listo(); envioActual = null;
            modalEnvio.hide(); SGTL.toastExito(r.mensaje || 'Presupuesto enviado.');
        }).catch(function (error) {
            enviando = false; listo();
            aviso('envioPresupuestoFeedback', textoError(error, 'No se pudo enviar el presupuesto. Probá de nuevo.'), true);
            // 409: el presupuesto cambió desde que se abrió el envío; hay que volver a abrirlo.
            if (error.status === 409) { envioActual = null; el('btnEnviarPresupuesto').disabled = true; }
        });
    };
    el('nuevo').onclick = function () { reiniciar(); el('tituloModal').textContent = 'Registrar presupuesto'; modal.show(); };
    // El filtro se aplica con Buscar, Enter o la cruz, como en el resto de las pantallas (§1.3).
    // Filtros como en el resto (§1.3 y §3.3): Buscar o Enter aplican; los desplegables buscan al elegir y el
    // rango de fechas al cerrar el calendario; cada campo se borra con su cruz.
    function buscar() {
        var rango = SGTL.valorRango('#fFecha');
        filtrosAplicados = {
            numero: el('fNumero').value.trim(), cliente: el('fCliente').value, estado: el('fEstado').value,
            fecha: rango, ruta: sinTildes(el('fRuta').value.trim())
        };
        paginaActual = 1; dibujar();
    }
    el('busquedaPresupuestoForm').addEventListener('submit', function (evento) { evento.preventDefault(); buscar(); });
    SGTL.rangoFechas('#fFecha', { onClose: function (fechas) { if (fechas.length !== 1) buscar(); } });
    SGTL.filtros(['#fNumero', '#fCliente', '#fFecha', '#fEstado', '#fRuta'], function () { SelectClientePredictivo.sincronizar('fCliente'); buscar(); });
    SelectClientePredictivo.inicializar('fCliente', { placeholder: 'Todos los clientes' });
    ['fCliente', 'fEstado'].forEach(function (id) { el(id).addEventListener('change', buscar); });
    el('fNumero').addEventListener('input', function () { this.value = this.value.replace(/[^0-9]/g, ''); });
    prepararFechaHora('fechaInicio'); prepararFechaHora('fechaFin');
    // Validación del formulario (§6.3): cada campo en rojo con su mensaje.
    var formulario = SGTL.validador([
        { id: 'cliente', requerido: 'Seleccioná un cliente.' },
        { id: 'email', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, mensaje: 'Escribí un e-mail válido.' },
        { id: 'origenId', requerido: 'Seleccioná un origen.' },
        { id: 'destinoId', requerido: 'Seleccioná un destino.' },
        { id: 'fechaInicio', requerido: 'Completá la fecha y hora de inicio.' },
        { id: 'fechaFin', requerido: 'Completá la fecha y hora de fin.',
            validar: function (valor) { return el('fechaInicio').value && valor < el('fechaInicio').value ? 'La fecha de fin no puede ser anterior a la de inicio.' : ''; } },
        { id: 'camionId', requerido: 'Seleccioná un camión.' },
        { id: 'distancia', requerido: 'Completá la distancia.', validar: function (valor) { return Number(valor) > 0 ? '' : 'La distancia tiene que ser mayor que cero.'; } },
        { id: 'tipoTarifa', requerido: 'Seleccioná un tipo de tarifa.' }
    ]);
    el('cliente').onchange = function () { var c = clientes.find(function (x) { return String(x.Cliente_ID) === el('cliente').value; }); el('email').value = c && c.Email || ''; opcionesRuta(); solicitarCalculo(); };
    ['agregarOrigenPresupuesto', 'agregarDestinoPresupuesto'].forEach(function (id) {
        el(id).addEventListener('click', function () {
            var tipo = id === 'agregarOrigenPresupuesto' ? 'Origen' : 'Destino';
            AltaRapidaUbicacion.abrir({ tipo: tipo, clienteId: el('cliente').value, clienteNombre: nombre('cliente'), modalPadre: 'modalPresupuesto', alCrear: function (registro) {
                var origenActual = el('origenId').value, destinoActual = el('destinoId').value;
                if (tipo === 'Origen') { origenes.push(registro); origenActual = registro.Origen_ID; }
                else { destinos.push(registro); destinoActual = registro.Destino_ID; }
                opcionesRuta(origenActual, destinoActual);
                el('distancia').value = '';
                el(tipo === 'Origen' ? 'origenId' : 'destinoId').dispatchEvent(new Event('change', { bubbles: true }));
            }});
        });
    });
    ['origenId','destinoId','fechaInicio','fechaFin','distancia','tipoTarifa'].forEach(function (k) { el(k).addEventListener('change', solicitarCalculo); });
    el('distancia').addEventListener('input', solicitarCalculo);
    el('formulario').addEventListener('input', invalidarDocumento); el('formulario').addEventListener('change', invalidarDocumento);
    el('formulario').onsubmit = function (e) {
        e.preventDefault(); if (guardando) return;
        formulario.validarTodo();
        if (!SGTL.revisarFormulario('#formulario', '#mensajeForm')) return;
        if (!tarifa) { aviso('mensajeForm', 'Esperá el cálculo de una tarifa válida antes de guardar.', true); return; }
        var d = datos(), id = el('id').value, revisionGuardada = revision; guardando = true; var listo = SGTL.procesando('#guardar');
        pedir(api + '/Presupuestos' + (id ? '/' + id : ''), {method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(d)}).then(function (r) {
            d.id = r.id; el('id').value = r.id; base = d; actual = revision === revisionGuardada ? d : null;
            guardando = false; listo();
            if (actual) { modal.hide(); aviso('mensaje', 'Presupuesto #' + r.id + ' guardado.', false); }
            else { aviso('mensajeForm', 'Presupuesto #' + r.id + ' guardado. Hay cambios posteriores sin guardar.', false); }
            listar();
        }).catch(function (error) { guardando = false; listo(); aviso('mensajeForm', textoError(error, 'No se pudo guardar el presupuesto. Probá de nuevo.'), true); });
    };
    function errorVista(texto) { var aviso = el('vistaPresupuestoFeedback'); aviso.className = 'alert alert-light-danger color-danger'; aviso.textContent = texto; }
    var presupuestoVista = null;
    function imprimirPresupuesto(p) {
        if (!p) return;
        presupuestoVista = p;
        var version = ++secuenciaVista, marco = el('vistaPresupuestoDocumento'), descarga = el('descargarVistaPresupuesto');
        if (urlVista) { URL.revokeObjectURL(urlVista); urlVista = null; }
        marco.removeAttribute('src'); marco.style.display = 'none';
        descarga.removeAttribute('href'); descarga.classList.add('disabled'); descarga.setAttribute('aria-disabled', 'true');
        el('imprimirVistaPresupuesto').disabled = true;
        el('tituloVistaPresupuesto').textContent = 'Ver PDF del presupuesto #' + p.id;
        el('vistaPresupuestoFeedback').className = 'text-center text-muted py-4'; el('vistaPresupuestoFeedback').textContent = 'Preparando el PDF…';
        modalVista.show();
        window.PresupuestoPDF.preparar(p, clientePresupuesto(p)).then(function (doc) {
            if (version !== secuenciaVista) return;
            urlVista = URL.createObjectURL(doc.output('blob'));
            descarga.href = urlVista; descarga.download = 'Presupuesto_' + p.id + '.pdf'; descarga.classList.remove('disabled'); descarga.setAttribute('aria-disabled', 'false');
            marco.onload = function () {
                if (version !== secuenciaVista) return;
                el('vistaPresupuestoFeedback').className = 'd-none'; el('vistaPresupuestoFeedback').textContent = ''; el('imprimirVistaPresupuesto').disabled = false;
            };
            marco.src = urlVista; marco.style.display = 'block';
        }).catch(function () { if (version === secuenciaVista) errorVista('No se pudo generar el PDF del presupuesto. Probá de nuevo.'); });
    }
    modal = bootstrap.Modal.getOrCreateInstance(el('modalPresupuesto'));
    modalVista = bootstrap.Modal.getOrCreateInstance(el('modalVistaPresupuesto'));
    // "Enviar por e-mail" va en el pie del PDF (como en el detalle de cuenta corriente): cierra la vista y abre el envío.
    el('enviarVistaPresupuesto').onclick = function () {
        var p = presupuestoVista; if (!p) return;
        el('modalVistaPresupuesto').addEventListener('hidden.bs.modal', function abrirLuego() {
            el('modalVistaPresupuesto').removeEventListener('hidden.bs.modal', abrirLuego); abrirEnvio(p);
        });
        modalVista.hide();
    };
    el('imprimirVistaPresupuesto').onclick = function () {
        try { var vista = el('vistaPresupuestoDocumento').contentWindow; vista.focus(); vista.print(); }
        catch (error) { errorVista('No se pudo imprimir desde acá. Usá el botón de impresión del visor del PDF.'); }
    };
    el('modalVistaPresupuesto').addEventListener('hidden.bs.modal', function () {
        secuenciaVista++; var marco = el('vistaPresupuestoDocumento'); marco.onload = null; marco.removeAttribute('src');
        if (urlVista) { URL.revokeObjectURL(urlVista); urlVista = null; }
    });
    el('modalPresupuesto').addEventListener('hide.bs.modal', function (e) { if (guardando) e.preventDefault(); });
    modalEnvio = bootstrap.Modal.getOrCreateInstance(el('modalEnviarPresupuesto'));
    modalViaje = bootstrap.Modal.getOrCreateInstance(el('modalGenerarViaje'));
    el('modalGenerarViaje').addEventListener('hide.bs.modal', function (e) { if (generandoViaje) e.preventDefault(); });
    el('modalEnviarPresupuesto').addEventListener('hide.bs.modal', function (e) { if (enviando) e.preventDefault(); else secuenciaEnvio++; });
    if (window.loadHeader) window.loadHeader(); if (window.loadFooter) window.loadFooter();
    Promise.resolve(window.loadSidebar ? window.loadSidebar() : null).then(function () {
        return pedir(api + '/GestionContenido/1');
    }).then(function (configuracion) {
        if (configuracion && typeof window.applyStyles === 'function') window.applyStyles(configuracion.Logo, configuracion.ColorFondo, configuracion.ColorBotonesMenu, configuracion.ContenidoPiePagina);
    }).catch(function () { console.warn('No se pudo cargar la configuración de contenido.'); });
    el('nuevo').disabled = true;
    Promise.all([pedir(api + '/Clientes'), pedir(api + '/Origen'), pedir(api + '/Destino'), pedir(api + '/Camiones'), pedir(api + '/Choferes').catch(function () { return []; })]).then(function (r) {
        clientes = r[0] || []; origenes = r[1] || []; destinos = r[2] || [];
        clientes.forEach(function (c) { opcion(el('cliente'), c.Cliente_ID, c.Razon_Social); opcion(el('fCliente'), c.Cliente_ID, c.Razon_Social); });
        SelectClientePredictivo.sincronizar('fCliente');
        (r[3] || []).forEach(function (c) { opcion(el('camionId'), c.Camion_ID, c.Dominio); });
        choferes = r[4] || []; choferes.forEach(function (c) { opcion(el('choferId'), c.Chofer_ID, c.Apellido + ', ' + c.Nombre); });
        el('nuevo').disabled = false;
    }).catch(function () { aviso('mensaje', 'No se pudieron cargar los clientes, las rutas o los camiones. Probá de nuevo.', true); }).then(listar);
}());
