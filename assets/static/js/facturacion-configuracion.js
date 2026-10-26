(function (window, document) {
    'use strict';

    var API = 'http://localhost:50222/api/facturacion-config';
    var cambiosLetra = new WeakMap();
    function token() {
        try { return localStorage.getItem('token') || ''; } catch (e) { return ''; }
    }

    function encabezados() {
        var resultado = { Accept: 'application/json' };
        var jwt = token();
        if (jwt) resultado.Authorization = 'Bearer ' + jwt;
        return resultado;
    }

    function escapar(valor) {
        return String(valor == null ? '' : valor).replace(/[&<>\"']/g, function (caracter) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[caracter];
        });
    }

    function mensajeError(respuesta) {
        return respuesta.json().catch(function () { return {}; }).then(function (datos) {
            if (respuesta.ok) return datos;
            var error = (datos && (datos.error || (datos.errores || []).join('\n'))) ||
                'No se pudo cargar la configuración de emisión.';
            throw new Error(error);
        });
    }

    function campo(id) { return id ? document.getElementById(id) : null; }

    function cargar(tipo, controles) {
        controles = controles || {};
        return fetch(API + '/emision/' + encodeURIComponent(tipo), { headers: encabezados() })
            .then(mensajeError)
            .then(function (datos) {
                var descripcion = datos && typeof datos.Descripcion === 'string' ? datos.Descripcion.trim() : '';
                if (!descripcion) throw new Error('No se pudo cargar el tipo de comprobante. Probá de nuevo.');
                var tipoControl = campo(controles.tipo);
                var letra = campo(controles.letra);
                var sucursal = campo(controles.sucursal);
                var numero = campo(controles.numero);

                if (tipoControl) {
                    if ('value' in tipoControl) tipoControl.value = descripcion;
                    else tipoControl.textContent = descripcion;
                }
                if (letra) {
                    letra.innerHTML = (datos.Letras || ['A', 'B']).map(function (valor) {
                        var seleccionada = valor === datos.LetraPredeterminada ? ' selected' : '';
                        return '<option value="' + escapar(valor) + '"' + seleccionada + '>' + escapar(valor) + '</option>';
                    }).join('');
                    letra.value = datos.LetraPredeterminada || '';
                    letra.disabled = datos.Tipo === 'REC';
                }
                if (sucursal) {
                    sucursal.innerHTML = (datos.Sucursales || []).map(function (item) {
                        var seleccionada = item.Codigo === datos.SucursalPredeterminada ? ' selected' : '';
                        return '<option value="' + escapar(item.Codigo) + '"' + seleccionada + '>' +
                            escapar(item.Codigo) + ' · ' + escapar(item.Nombre) + '</option>';
                    }).join('');
                    sucursal.value = datos.SucursalPredeterminada || '';
                }
                if (numero) {
                    numero.value = datos.ProximoNumero || '';
                    numero.readOnly = true;
                }
                if (letra) {
                    var anterior = cambiosLetra.get(letra);
                    if (anterior) letra.removeEventListener('change', anterior);
                    cambiosLetra.delete(letra);
                    if (Array.isArray(datos.Configuraciones) && datos.Configuraciones.length) {
                        var aplicarLetra = function () {
                            var configuracion = datos.Configuraciones.filter(function (item) { return item.Letra === letra.value; })[0];
                            if (!configuracion) return;
                            if (sucursal) sucursal.value = configuracion.SucursalPredeterminada || '';
                            if (numero) numero.value = configuracion.ProximoNumero || '';
                        };
                        letra.addEventListener('change', aplicarLetra);
                        cambiosLetra.set(letra, aplicarLetra);
                        aplicarLetra();
                    }
                }
                return datos;
            });
    }

    window.ConfiguracionFacturacion = { cargar: cargar };
})(window, document);
