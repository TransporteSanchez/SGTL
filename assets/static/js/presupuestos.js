(function () {
    'use strict';
    var api = 'http://localhost:50222/api', clientes = [], origenes = [], destinos = [], registros = [], choferes = [];
    var actual = null, base = null, tarifa = null, secuencia = 0, revision = 0, timer, modal, guardando = false;
    var envioActual = null, enviando = false, secuenciaEnvio = 0, modalEnvio, modalViaje, presupuestoViaje = null, generandoViaje = false;
    var modalVista, urlVista = null, secuenciaVista = 0;
    var campos = ['id', 'email', 'fechaInicio', 'fechaFin', 'camionId', 'distancia', 'choferId', 'tipoTarifa', 'validez', 'pago', 'tiempo', 'condiciones'];
    function el(id) { return document.getElementById(id); }
    function aviso(id, texto, error) { el(id).className = texto ? 'alert alert-' + (error ? 'danger' : 'success') : ''; el(id).textContent = texto; }
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
            var s = el(cfg[0]); s.textContent = ''; opcion(s, '', 'Seleccione...'); s.disabled = !el('cliente').value;
            cfg[1].filter(function (x) { return String(x.ClienteID) === el('cliente').value; }).forEach(function (x) { opcion(s, x[cfg[2]], x.Descripcion); });
            if (cfg[3]) s.value = String(cfg[3]);
        });
    }
    function invalidarDocumento() { revision++; actual = null; }
    function reiniciar() {
        secuencia++; clearTimeout(timer); el('formulario').reset(); el('id').value = ''; el('importe').value = ''; tarifa = null; actual = null; base = null;
        opcionesRuta(); aviso('mensajeForm', '', false); el('tarifaInfo').textContent = 'Completá los datos y seleccioná el tipo de tarifa.';
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
        el('tarifaInfo').textContent = 'Calculando tarifa...';
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
                info.textContent = 'No se pudo calcular la tarifa. Revisá los datos y la conexión con la API.';
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
    function listar() { pedir(api + '/Presupuestos').then(function (items) { registros = items || []; dibujar(); }).catch(function () { aviso('mensaje', 'No se pudieron cargar los presupuestos. Verificá la API y la tabla PRESUPUESTOS.', true); }); }
    function dibujar() {
        var cuerpo = el('lista'), filtro = el('filtro').value.toLocaleLowerCase(); cuerpo.textContent = '';
        var items = registros.filter(function (p) { return [p.id, p.cliente, p.origen, p.destino].join(' ').toLocaleLowerCase().indexOf(filtro) >= 0; });
        if (!items.length) { var celda = cuerpo.insertRow().insertCell(); celda.colSpan = 10; celda.textContent = 'No hay presupuestos para mostrar.'; }
        items.forEach(function (p) {
            var tr = cuerpo.insertRow(); [p.id, p.fecha || '', p.cliente, p.origen, p.destino, p.distancia ? p.distancia + ' km' : '—', '$ ' + Number(p.importe || 0).toLocaleString('es-AR', {minimumFractionDigits: 2})].forEach(function (v) { tr.insertCell().textContent = v || ''; });
            var estadoCelda = tr.insertCell(), selector = document.createElement('select');
            selector.className = 'form-select form-select-sm'; selector.setAttribute('aria-label', 'Estado del presupuesto #' + p.id);
            ['Pendiente', 'Aceptado', 'Rechazado'].forEach(function (estado) { opcion(selector, estado, estado); }); selector.value = p.estado || 'Pendiente'; selector.disabled = !!p.viajeId;
            selector.onchange = function () { cambiarEstado(p, selector); }; estadoCelda.appendChild(selector);
            tr.insertCell().textContent = p.viajeId ? '#' + p.viajeId : '—';
            // Botones de la fila con el design system (§1.4): editar, PDF, e-mail, siguiente paso (generar viaje), eliminar.
            var td = tr.insertCell(); td.className = 'text-center';
            var conViaje = !!p.viajeId;
            var motivoGenerar = conViaje ? 'Ya se generó el viaje #' + p.viajeId : 'Solo se genera el viaje de un presupuesto aceptado';
            td.innerHTML = SGTL.accionesFila([
                SGTL.botonFila('editar', { id: p.id, deshabilitado: p.estado !== 'Pendiente' || conViaje, motivo: 'Solo se editan presupuestos pendientes sin viaje' }),
                SGTL.botonFila('pdf', { id: p.id, texto: 'Imprimir / PDF' }),
                SGTL.botonFila('enviar', { id: p.id }),
                SGTL.botonFila('siguiente', { id: p.id, texto: 'Generar viaje', icono: 'bi-truck', deshabilitado: p.estado !== 'Aceptado' || conViaje, motivo: motivoGenerar }),
                SGTL.botonFila('eliminar', { id: p.id, deshabilitado: conViaje, motivo: 'Ya tiene un viaje generado: no se puede eliminar' })
            ]);
            var acciones = { editar: function () { abrir(p); }, pdf: function () { imprimirPresupuesto(p); }, enviar: function () { abrirEnvio(p); },
                siguiente: function () { abrirGenerarViaje(p); }, eliminar: function () { eliminar(p); } };
            Array.prototype.forEach.call(td.querySelectorAll('[data-accion]'), function (boton) { boton.onclick = acciones[boton.getAttribute('data-accion')]; });
        });
    }
    function conservarOpcion(id, valor, texto) { if (!valor) return; var s = el(id); if (!Array.prototype.some.call(s.options, function (o) { return o.value === String(valor); })) opcion(s, valor, (texto || 'Registro ' + valor) + ' (histórico)'); s.value = String(valor); }
    function abrir(p) {
        reiniciar(); el('tituloModal').textContent = 'Editar presupuesto #' + p.id;
        campos.forEach(function (k) { if (el(k)) el(k).value = p[k] || ''; }); conservarOpcion('cliente', p.clienteId, p.cliente); opcionesRuta(p.origenId, p.destinoId);
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
                return pedir(api + '/Presupuestos/' + p.id, {method:'DELETE'}).catch(function () {
                    var error = new Error('eliminar'); error.mensajeUsuario = 'No se pudo eliminar el presupuesto. Probá de nuevo.'; throw error;
                });
            }
        }).then(function (eliminado) { if (eliminado) { aviso('mensaje', 'Presupuesto eliminado.', false); listar(); } });
    }
    function clientePresupuesto(p) { return clientes.find(function (c) { return String(c.Cliente_ID) === String(p.clienteId); }) || null; }
    function encabezadosEnvio() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }; }
    function cambiarEstado(p, selector) {
        var estado = selector.value; selector.disabled = true;
        pedir(api + '/Presupuestos/' + encodeURIComponent(p.id) + '/estado', { method: 'PUT', headers: encabezadosEnvio(), body: JSON.stringify({ Estado: estado }) }).then(function () {
            aviso('mensaje', 'Estado actualizado a ' + estado + '.', false); listar();
        }).catch(function (error) { selector.value = p.estado; selector.disabled = false; aviso('mensaje', (error.respuesta && (error.respuesta.error || error.respuesta.Message)) || 'No se pudo actualizar el estado.', true); listar(); });
    }
    function abrirGenerarViaje(p) {
        presupuestoViaje = p; el('tituloGenerarViaje').textContent = 'Generar viaje desde presupuesto #' + p.id; aviso('generarViajeFeedback', '', false);
        var selector = el('generarViajeChofer'); selector.textContent = ''; opcion(selector, '', 'Seleccioná un chofer');
        choferes.filter(function (c) { return (c.EstadoChofer || '').toLowerCase() === 'activo'; }).forEach(function (c) { opcion(selector, c.Chofer_ID, c.Apellido + ', ' + c.Nombre); });
        selector.value = p.choferId || ''; el('btnGenerarViaje').disabled = false; modalViaje.show();
    }
    el('formGenerarViaje').onsubmit = function (e) {
        e.preventDefault(); if (!presupuestoViaje || generandoViaje) return;
        generandoViaje = true; el('btnGenerarViaje').disabled = true;
        pedir(api + '/Presupuestos/' + encodeURIComponent(presupuestoViaje.id) + '/viaje', { method: 'POST', headers: encabezadosEnvio(), body: JSON.stringify({ ChoferID: Number(el('generarViajeChofer').value) }) }).then(function (r) {
            generandoViaje = false;
            modalViaje.hide(); aviso('mensaje', 'Viaje #' + r.ViajeID + ' generado.', false); listar();
        }).catch(function (error) {
            generandoViaje = false; el('btnGenerarViaje').disabled = false; aviso('generarViajeFeedback', (error.respuesta && (error.respuesta.error || error.respuesta.Message)) || 'No se pudo generar el viaje.', true); listar();
        });
    };
    function abrirEnvio(p) {
        var version = ++secuenciaEnvio; envioActual = null;
        el('tituloEnviarPresupuesto').textContent = 'Enviar presupuesto #' + p.id + ' por E-mail';
        el('envioPresupuestoDestino').value = ''; el('envioPresupuestoPerfil').textContent = 'Verificando perfil SMTP…';
        el('btnEnviarPresupuesto').disabled = true; el('btnEnviarPresupuesto').textContent = 'Enviar E-mail'; aviso('envioPresupuestoFeedback', '', false); modalEnvio.show();
        pedir(api + '/Presupuestos/' + encodeURIComponent(p.id) + '/email', { headers: encabezadosEnvio() }).then(function (r) {
            if (version !== secuenciaEnvio) return;
            if (!r.Configurado) { el('envioPresupuestoPerfil').textContent = 'No hay un perfil SMTP asignado a Presupuestos. Configuralo en Configuración > Gestionar e-mail.'; return; }
            envioActual = r; el('envioPresupuestoDestino').value = r.Presupuesto.email || '';
            el('envioPresupuestoPerfil').textContent = '';
            el('btnEnviarPresupuesto').disabled = false;
        }).catch(function (error) { if (version !== secuenciaEnvio) return; el('envioPresupuestoPerfil').textContent = ''; aviso('envioPresupuestoFeedback', (error.respuesta && (error.respuesta.error || error.respuesta.Message)) || 'No se pudo preparar el envío.', true); });
    }
    el('formEnviarPresupuesto').onsubmit = function (e) {
        e.preventDefault(); if (!envioActual || enviando) return;
        enviando = true; el('btnEnviarPresupuesto').disabled = true; el('btnEnviarPresupuesto').textContent = 'Enviando…'; aviso('envioPresupuestoFeedback', '', false);
        window.PresupuestoPDF.preparar(envioActual.Presupuesto, clientePresupuesto(envioActual.Presupuesto)).then(function (doc) {
            var pdf = doc.output('datauristring').split(',')[1];
            return pedir(api + '/Presupuestos/' + encodeURIComponent(envioActual.Presupuesto.id) + '/email', { method: 'POST', headers: encabezadosEnvio(), body: JSON.stringify({ Destinatario: el('envioPresupuestoDestino').value.trim(), PdfBase64: pdf, Version: envioActual.Version }) });
        }).then(function (r) {
            aviso('envioPresupuestoFeedback', r.mensaje || 'Presupuesto enviado.', false); el('btnEnviarPresupuesto').textContent = 'Enviado'; envioActual = null;
        }).catch(function (error) {
            aviso('envioPresupuestoFeedback', (error.respuesta && (error.respuesta.error || error.respuesta.Message)) || error.message || 'No se pudo enviar el presupuesto.', true);
            if (error.status === 409) { envioActual = null; el('btnEnviarPresupuesto').textContent = 'Volvé a abrir el envío'; }
            else { el('btnEnviarPresupuesto').disabled = false; el('btnEnviarPresupuesto').textContent = 'Reintentar'; }
        }).then(function () { enviando = false; });
    };
    el('nuevo').onclick = function () { reiniciar(); el('tituloModal').textContent = 'Registrar presupuesto'; modal.show(); };
    el('filtro').oninput = dibujar;
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
        e.preventDefault(); if (el('fechaFin').value < el('fechaInicio').value) { aviso('mensajeForm', 'La fecha de fin no puede ser anterior a la de inicio.', true); return; }
        if (!tarifa) { aviso('mensajeForm', 'Esperá el cálculo de una tarifa válida antes de guardar.', true); return; }
        if (guardando) return;
        var d = datos(), id = el('id').value, revisionGuardada = revision; guardando = true; el('guardar').disabled = true;
        pedir(api + '/Presupuestos' + (id ? '/' + id : ''), {method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(d)}).then(function (r) {
            d.id = r.id; el('id').value = r.id; base = d; actual = revision === revisionGuardada ? d : null;
            if (actual) {
                guardando = false;
                modal.hide(); aviso('mensaje', 'Presupuesto #' + r.id + ' guardado correctamente.', false);
            }
            else { aviso('mensajeForm', 'Presupuesto guardado. Hay cambios posteriores pendientes de guardar.', false); }
            listar();
        }).catch(function (error) { aviso('mensajeForm', (error.respuesta && (error.respuesta.error || error.respuesta.Message)) || 'No se pudo guardar el presupuesto.', true); }).then(function () { guardando = false; el('guardar').disabled = false; });
    };
    function imprimirPresupuesto(p) {
        if (!p) return;
        var version = ++secuenciaVista, marco = el('vistaPresupuestoDocumento'), descarga = el('descargarVistaPresupuesto');
        if (urlVista) { URL.revokeObjectURL(urlVista); urlVista = null; }
        marco.removeAttribute('src'); marco.style.display = 'none';
        descarga.removeAttribute('href'); descarga.classList.add('disabled'); descarga.setAttribute('aria-disabled', 'true');
        el('imprimirVistaPresupuesto').disabled = true;
        el('tituloVistaPresupuesto').textContent = 'Vista previa del presupuesto #' + p.id;
        el('vistaPresupuestoFeedback').className = ''; el('vistaPresupuestoFeedback').textContent = 'Preparando vista previa…';
        modalVista.show();
        window.PresupuestoPDF.preparar(p, clientePresupuesto(p)).then(function (doc) {
            if (version !== secuenciaVista) return;
            urlVista = URL.createObjectURL(doc.output('blob'));
            descarga.href = urlVista; descarga.download = 'Presupuesto_' + p.id + '.pdf'; descarga.classList.remove('disabled'); descarga.setAttribute('aria-disabled', 'false');
            marco.onload = function () {
                if (version !== secuenciaVista) return;
                el('vistaPresupuestoFeedback').textContent = ''; el('imprimirVistaPresupuesto').disabled = false;
            };
            marco.src = urlVista; marco.style.display = 'block';
        }).catch(function (error) { if (version === secuenciaVista) aviso('vistaPresupuestoFeedback', error.message || 'No se pudo generar el presupuesto.', true); });
    }
    modal = bootstrap.Modal.getOrCreateInstance(el('modalPresupuesto'));
    modalVista = bootstrap.Modal.getOrCreateInstance(el('modalVistaPresupuesto'));
    el('imprimirVistaPresupuesto').onclick = function () {
        try { var vista = el('vistaPresupuestoDocumento').contentWindow; vista.focus(); vista.print(); }
        catch (error) { aviso('vistaPresupuestoFeedback', 'Usá el botón de impresión del visor PDF.', true); }
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
        clientes.forEach(function (c) { opcion(el('cliente'), c.Cliente_ID, c.Razon_Social); });
        (r[3] || []).forEach(function (c) { opcion(el('camionId'), c.Camion_ID, c.Dominio); });
        choferes = r[4] || []; choferes.forEach(function (c) { opcion(el('choferId'), c.Chofer_ID, c.Apellido + ', ' + c.Nombre); });
        el('nuevo').disabled = false;
    }).catch(function () { aviso('mensaje', 'No se pudieron cargar los datos de clientes, rutas o camiones. Revisá la conexión con la API.', true); }).then(listar);
}());
