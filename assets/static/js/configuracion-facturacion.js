(function (window, document) {
    'use strict';

    var API = 'http://localhost:50222/api/facturacion-config';
    var datos = { sucursales: [], numeradores: [], tipos: [] };

    function porId(id) { return document.getElementById(id); }
    function token() { try { return localStorage.getItem('token') || ''; } catch (e) { return ''; } }
    function escapar(valor) { return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function encabezados(contenido) {
        var resultado = { Accept: 'application/json' };
        if (contenido) resultado['Content-Type'] = 'application/json';
        if (token()) resultado.Authorization = 'Bearer ' + token();
        return resultado;
    }
    function solicitud(ruta, metodo, cuerpo) {
        return fetch(API + ruta, { method: metodo || 'GET', headers: encabezados(cuerpo !== undefined), body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) })
            .then(function (respuesta) { return respuesta.text().then(function (texto) {
                var json; try { json = texto ? JSON.parse(texto) : {}; } catch (e) { json = {}; }
                if (!respuesta.ok) throw new Error(json.error || json.Message || 'No se pudo completar la operación.');
                return json;
            }); });
    }
    function feedback(tipo, texto) {
        var aviso = porId('facturacionFeedback');
        aviso.className = 'alert alert-' + tipo;
        aviso.textContent = texto;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function estado(activo) { return SGTL.estado(activo ? 'Activo' : 'Inactivo'); }
    function opciones(items, campoId, etiqueta, valorSeleccionado) {
        return items.filter(function (item) { return item.Activa !== false && item.Activo !== false; }).map(function (item) {
            var valor = item[campoId];
            return '<option value="' + Number(valor) + '"' + (Number(valor) === Number(valorSeleccionado) ? ' selected' : '') + '>' + escapar(etiqueta(item)) + '</option>';
        }).join('');
    }
    function renderSucursales() {
        porId('sucursalesBody').innerHTML = datos.sucursales.map(function (item) {
            return '<tr><td>' + escapar(item.Codigo) + '</td><td>' + escapar(item.Nombre) + '</td><td>' + estado(item.Activa) + '</td><td class="text-end">' +
                '<button class="btn btn-sm btn-outline-primary me-1" data-accion="editar-sucursal" data-id="' + item.SucursalID + '">Editar</button>' +
                (item.Activa ? '<button class="btn btn-sm btn-outline-danger" data-accion="baja-sucursal" data-id="' + item.SucursalID + '">Desactivar</button>' : '') + '</td></tr>';
        }).join('') || '<tr><td colspan="4" class="text-center text-muted py-3">No hay sucursales cargadas.</td></tr>';
    }
    function renderNumeradores() {
        porId('numeradoresBody').innerHTML = datos.numeradores.map(function (item) {
            return '<tr><td>' + escapar(item.Nombre) + '</td><td>' + Number(item.UltimoNumero).toString().padStart(8, '0') + '</td><td>' + estado(item.Activo) + '</td><td class="text-end">' +
                '<button class="btn btn-sm btn-outline-primary me-1" data-accion="editar-numerador" data-id="' + item.NumeradorID + '">Editar</button>' +
                (item.Activo ? '<button class="btn btn-sm btn-outline-danger" data-accion="baja-numerador" data-id="' + item.NumeradorID + '">Desactivar</button>' : '') + '</td></tr>';
        }).join('') || '<tr><td colspan="4" class="text-center text-muted py-3">No hay numeradores cargados.</td></tr>';
    }
    function renderSelectoresTipo() {
        porId('tipoSucursal').innerHTML = '<option value="">Seleccionar</option>' + opciones(datos.sucursales, 'SucursalID', function (item) { return item.Codigo + ' · ' + item.Nombre; });
        porId('tipoNumerador').innerHTML = '<option value="">Seleccionar</option>' + opciones(datos.numeradores, 'NumeradorID', function (item) { return item.Nombre; });
    }
    function impacto(item) { return item.Impacto === 'C' ? 'Crédito' : 'Deuda'; }
    function renderTipos() {
        porId('tiposBody').innerHTML = datos.tipos.map(function (item) {
            return '<tr><td><strong>' + escapar(item.Tipo) + '</strong></td><td>' + escapar(item.Descripcion) + '</td><td>' + impacto(item) + '</td><td>' + escapar(item.LetraPredeterminada || '—') + '</td>' +
                '<td>' + escapar(item.Sucursal || '—') + '</td><td>' + escapar(item.Numerador || '—') + '</td><td>' + estado(item.Activo) + '</td><td class="text-end">' +
                '<button class="btn btn-sm btn-outline-primary me-1" data-accion="editar-tipo" data-id="' + escapar(item.Tipo) + '">Editar</button>' +
                (item.Activo ? '<button class="btn btn-sm btn-outline-danger" data-accion="baja-tipo" data-id="' + escapar(item.Tipo) + '">Desactivar</button>' : '') + '</td></tr>';
        }).join('') || '<tr><td colspan="8" class="text-center text-muted py-3">No hay tipos de comprobante cargados.</td></tr>';
    }
    function render() { renderSucursales(); renderNumeradores(); renderSelectoresTipo(); renderTipos(); }
    function resetSucursal() { porId('sucursalForm').reset(); porId('sucursalId').value = ''; porId('sucursalActiva').checked = true; }
    function resetNumerador() { porId('numeradorForm').reset(); porId('numeradorId').value = ''; porId('numeradorUltimo').value = '0'; porId('numeradorActivo').checked = true; }
    function sincronizarLetraTipo() {
        var esRecibo = porId('tipoCodigo').value.trim().toUpperCase() === 'REC';
        porId('tipoLetra').disabled = esRecibo;
        if (esRecibo) porId('tipoLetra').value = 'X';
        else if (porId('tipoLetra').value === 'X') porId('tipoLetra').value = 'A';
    }
    function resetTipo() {
        porId('tipoForm').reset();
        porId('tipoId').value = '';
        porId('tipoCodigo').disabled = false;
        porId('tipoImpacto').disabled = false;
        porId('tipoActivo').checked = true;
        porId('tipoImpacto').value = 'D';
        porId('tipoLetra').value = 'A';
        sincronizarLetraTipo();
    }
    function recargar(mensaje) {
        return Promise.all([
            solicitud('/sucursales?incluirInactivas=true'), solicitud('/numeradores?incluirInactivos=true'), solicitud('/tipos-comprobante')
        ]).then(function (resultado) {
            datos.sucursales = resultado[0] || []; datos.numeradores = resultado[1] || []; datos.tipos = resultado[2] || [];
            render(); if (mensaje) feedback('success', mensaje);
        }).catch(function (ex) { feedback('danger', ex.message || 'No se pudo cargar la configuración.'); });
    }
    function guardarSucursal(evento) {
        evento.preventDefault();
        var id = porId('sucursalId').value;
        var cuerpo = { Codigo: porId('sucursalCodigo').value.trim(), Nombre: porId('sucursalNombre').value.trim(), Activa: porId('sucursalActiva').checked };
        solicitud('/sucursales' + (id ? '/' + encodeURIComponent(id) : ''), id ? 'PUT' : 'POST', cuerpo)
            .then(function () { resetSucursal(); return recargar('Sucursal guardada correctamente.'); })
            .catch(function (ex) { feedback('danger', ex.message); });
    }
    function guardarNumerador(evento) {
        evento.preventDefault();
        var id = porId('numeradorId').value;
        var cuerpo = { Nombre: porId('numeradorNombre').value.trim(), UltimoNumero: Number(porId('numeradorUltimo').value || 0), Activo: porId('numeradorActivo').checked };
        solicitud('/numeradores' + (id ? '/' + encodeURIComponent(id) : ''), id ? 'PUT' : 'POST', cuerpo)
            .then(function () { resetNumerador(); return recargar('Numerador guardado correctamente.'); })
            .catch(function (ex) { feedback('danger', ex.message); });
    }
    function guardarTipo(evento) {
        evento.preventDefault();
        var id = porId('tipoId').value;
        var tipo = porId('tipoCodigo').value.trim().toUpperCase();
        var cuerpo = {
            Tipo: tipo,
            Descripcion: porId('tipoDescripcion').value.trim(),
            Impacto: porId('tipoImpacto').value,
            LetraPredeterminada: porId('tipoLetra').value,
            SucursalID: Number(porId('tipoSucursal').value || 0),
            NumeradorID: Number(porId('tipoNumerador').value || 0),
            Activo: porId('tipoActivo').checked
        };
        solicitud('/tipos-comprobante' + (id ? '/' + encodeURIComponent(id) : ''), id ? 'PUT' : 'POST', cuerpo)
            .then(function () { resetTipo(); return recargar('Tipo de comprobante ' + tipo + ' guardado correctamente.'); })
            .catch(function (ex) { feedback('danger', ex.message); });
    }
    function editarSucursal(id) {
        var item = datos.sucursales.filter(function (x) { return Number(x.SucursalID) === Number(id); })[0]; if (!item) return;
        porId('sucursalId').value = item.SucursalID; porId('sucursalCodigo').value = item.Codigo; porId('sucursalNombre').value = item.Nombre; porId('sucursalActiva').checked = item.Activa;
        porId('sucursalNombre').focus();
    }
    function editarNumerador(id) {
        var item = datos.numeradores.filter(function (x) { return Number(x.NumeradorID) === Number(id); })[0]; if (!item) return;
        porId('numeradorId').value = item.NumeradorID; porId('numeradorNombre').value = item.Nombre; porId('numeradorUltimo').value = item.UltimoNumero; porId('numeradorActivo').checked = item.Activo;
        porId('numeradorNombre').focus();
    }
    function editarTipo(id) {
        var item = datos.tipos.filter(function (x) { return x.Tipo === id; })[0]; if (!item) return;
        porId('tipoId').value = item.Tipo;
        porId('tipoCodigo').value = item.Tipo;
        porId('tipoCodigo').disabled = true;
        porId('tipoDescripcion').value = item.Descripcion || '';
        porId('tipoImpacto').value = item.Impacto;
        porId('tipoImpacto').disabled = true;
        porId('tipoLetra').value = item.LetraPredeterminada || (item.Tipo === 'REC' ? 'X' : 'A');
        porId('tipoSucursal').value = item.SucursalID || '';
        porId('tipoNumerador').value = item.NumeradorID || '';
        porId('tipoActivo').checked = item.Activo;
        sincronizarLetraTipo();
        porId('tipoDescripcion').focus();
    }
    function acciones(evento) {
        var boton = evento.target.closest('button[data-accion]'); if (!boton) return;
        var accion = boton.getAttribute('data-accion'), id = boton.getAttribute('data-id');
        if (accion === 'editar-sucursal') editarSucursal(id);
        else if (accion === 'editar-numerador') editarNumerador(id);
        else if (accion === 'editar-tipo') editarTipo(id);
        else if (accion === 'baja-sucursal' && window.confirm('¿Desactivar esta sucursal?')) solicitud('/sucursales/' + encodeURIComponent(id), 'DELETE').then(function () { return recargar('Sucursal desactivada.'); }).catch(function (ex) { feedback('danger', ex.message); });
        else if (accion === 'baja-numerador' && window.confirm('¿Desactivar este numerador?')) solicitud('/numeradores/' + encodeURIComponent(id), 'DELETE').then(function () { return recargar('Numerador desactivado.'); }).catch(function (ex) { feedback('danger', ex.message); });
        else if (accion === 'baja-tipo' && window.confirm('¿Desactivar este tipo de comprobante?')) solicitud('/tipos-comprobante/' + encodeURIComponent(id), 'DELETE').then(function () { return recargar('Tipo de comprobante desactivado.'); }).catch(function (ex) { feedback('danger', ex.message); });
    }
    function inicializar() {
        porId('sucursalForm').addEventListener('submit', guardarSucursal);
        porId('numeradorForm').addEventListener('submit', guardarNumerador);
        porId('tipoForm').addEventListener('submit', guardarTipo);
        porId('cancelarSucursal').addEventListener('click', resetSucursal);
        porId('cancelarNumerador').addEventListener('click', resetNumerador);
        porId('cancelarTipo').addEventListener('click', resetTipo);
        porId('tipoCodigo').addEventListener('input', function () { this.value = this.value.toUpperCase(); sincronizarLetraTipo(); });
        document.addEventListener('click', acciones);
        resetTipo(); recargar();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializar); else inicializar();
})(window, document);
