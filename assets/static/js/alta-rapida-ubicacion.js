(function (global) {
    'use strict';
    var api = 'http://localhost:50222/api', nodo, contexto, guardando = false, solicitudLocalidades = 0;
    function el(id) { return document.getElementById(id); }
    // En algunas páginas la plantilla registra Bootstrap solo en jQuery y no define window.bootstrap.
    function mostrarModal(elemento) { if (global.bootstrap && global.bootstrap.Modal) global.bootstrap.Modal.getOrCreateInstance(elemento).show(); else global.jQuery(elemento).modal('show'); }
    function ocultarModal(elemento) { if (global.bootstrap && global.bootstrap.Modal) global.bootstrap.Modal.getOrCreateInstance(elemento).hide(); else global.jQuery(elemento).modal('hide'); }
    function crear() {
        if (nodo) return;
        nodo = document.createElement('div'); nodo.className = 'modal fade'; nodo.id = 'modalAltaRapidaUbicacion'; nodo.tabIndex = -1; nodo.setAttribute('aria-labelledby', 'altaUbicacionTitulo'); nodo.setAttribute('aria-hidden', 'true');
        nodo.innerHTML = '<div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="altaUbicacionTitulo"></h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><form id="altaUbicacionForm"><div class="modal-body"><div id="altaUbicacionError" role="alert"></div><div class="mb-3"><label class="form-label" for="altaUbicacionCliente">Cliente</label><input id="altaUbicacionCliente" class="form-control" readonly></div><div class="mb-3"><label class="form-label" for="altaUbicacionDescripcion">Descripción *</label><input id="altaUbicacionDescripcion" class="form-control" required></div><div class="row"><div class="col-md-6 mb-3"><label class="form-label" for="altaUbicacionProvincia">Provincia *</label><select id="altaUbicacionProvincia" class="form-select" required><option value="">Seleccioná una provincia</option></select></div><div class="col-md-6 mb-3"><label class="form-label" for="altaUbicacionLocalidad">Localidad *</label><select id="altaUbicacionLocalidad" class="form-select" required disabled><option value="">Seleccioná una localidad</option></select></div><div class="col-md-8 mb-3"><label class="form-label" for="altaUbicacionCalle">Calle</label><input id="altaUbicacionCalle" class="form-control"></div><div class="col-md-4 mb-3"><label class="form-label" for="altaUbicacionAltura">Altura</label><input id="altaUbicacionAltura" class="form-control"></div></div></div><div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cancelar</button><button type="submit" id="altaUbicacionGuardar" class="btn btn-primary">Guardar</button></div></form></div></div>';
        document.body.appendChild(nodo);
        nodo.addEventListener('hide.bs.modal', function (e) { if (guardando) e.preventDefault(); });
        nodo.addEventListener('hidden.bs.modal', function () { solicitudLocalidades++; var anterior = contexto; contexto = null; if (anterior) { try { if (anterior.creado) anterior.alCrear(anterior.creado); } finally { mostrarModal(el(anterior.modalPadre)); } } });
        el('altaUbicacionProvincia').addEventListener('change', cargarLocalidades);
        el('altaUbicacionForm').addEventListener('submit', guardar);
    }
    function error(texto) { var caja = el('altaUbicacionError'); caja.className = texto ? 'alert alert-danger' : ''; caja.textContent = texto || ''; }
    function elegir(select, texto) { select.textContent = ''; var o = document.createElement('option'); o.value = ''; o.textContent = texto; select.appendChild(o); }
    function agregar(select, id, nombre) { var o = document.createElement('option'); o.value = id; o.textContent = nombre; select.appendChild(o); }
    function pedir(url, opciones) { return fetch(url, opciones).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }
    function cargarLocalidades() {
        var secuencia = ++solicitudLocalidades, provincia = el('altaUbicacionProvincia').value, lista = el('altaUbicacionLocalidad');
        elegir(lista, 'Seleccioná una localidad'); lista.disabled = true; error('');
        if (!provincia) return;
        pedir(api + '/Provincias/' + encodeURIComponent(provincia) + '/Localidades').then(function (datos) { if (secuencia !== solicitudLocalidades) return; (datos || []).forEach(function (l) { agregar(lista, l.Loc_ID, l.Nombre_Localidad); }); lista.disabled = false; }).catch(function () { if (secuencia === solicitudLocalidades) error('No se pudieron cargar las localidades. Volvé a seleccionar la provincia.'); });
    }
    function guardar(e) {
        e.preventDefault(); if (guardando || !contexto) return;
        var provincia = el('altaUbicacionProvincia'), localidad = el('altaUbicacionLocalidad');
        if (!localidad.value) { error('Seleccioná una localidad.'); return; }
        var dto = { Descripcion: el('altaUbicacionDescripcion').value.trim(), ClienteID: Number(contexto.clienteId), ProvID: Number(provincia.value), LocID: Number(localidad.value), Calle: el('altaUbicacionCalle').value.trim(), AlturaCalle: el('altaUbicacionAltura').value.trim(), Usu_Alta: localStorage.getItem('username') || 'sistema' };
        if (!dto.Descripcion || !dto.ProvID || !dto.LocID) { error('Completá descripción, provincia y localidad.'); return; }
        guardando = true; el('altaUbicacionGuardar').disabled = true; error('');
        pedir(api + '/' + contexto.tipo, {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(dto)}).then(function (r) {
            if (!r || !r.ID) throw new Error('No se recibió el identificador');
            dto[contexto.tipo + '_ID'] = r.ID; dto.NombreProvincia = provincia.options[provincia.selectedIndex].textContent; dto.NombreLocalidad = localidad.options[localidad.selectedIndex].textContent;
            contexto.creado = dto; guardando = false; el('altaUbicacionGuardar').disabled = false; ocultarModal(nodo);
        }).catch(function () { guardando = false; el('altaUbicacionGuardar').disabled = false; error('No se pudo guardar. Revisá los datos y la conexión con la API.'); });
    }
    function abrir(opciones) {
        if (!opciones.clienteId || contexto) return;
        crear(); contexto = opciones; el('altaUbicacionForm').reset(); el('altaUbicacionTitulo').textContent = 'Registrar ' + opciones.tipo.toLowerCase(); el('altaUbicacionCliente').value = opciones.clienteNombre; error('');
        elegir(el('altaUbicacionProvincia'), 'Cargando provincias...'); el('altaUbicacionProvincia').disabled = true; elegir(el('altaUbicacionLocalidad'), 'Seleccioná una localidad'); el('altaUbicacionLocalidad').disabled = true;
        pedir(api + '/Provincias').then(function (datos) { if (contexto !== opciones) return; elegir(el('altaUbicacionProvincia'), 'Seleccioná una provincia'); (datos || []).forEach(function (p) { agregar(el('altaUbicacionProvincia'), p.Prov_ID, p.Nombre_Provincia); }); el('altaUbicacionProvincia').disabled = false; }).catch(function () { if (contexto === opciones) error('No se pudieron cargar las provincias. Cerrá y volvé a intentar.'); });
        var padre = el(opciones.modalPadre); padre.addEventListener('hidden.bs.modal', function mostrar() { padre.removeEventListener('hidden.bs.modal', mostrar); mostrarModal(nodo); }); ocultarModal(padre);
    }
    global.AltaRapidaUbicacion = { abrir: abrir };
}(window));
