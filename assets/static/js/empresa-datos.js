(function (window) {
    'use strict';
    function cuitConGuiones(valor) {
        var digitos = String(valor == null ? '' : valor).replace(/\D/g, '');
        return digitos.length === 11 ? digitos.slice(0, 2) + '-' + digitos.slice(2, 10) + '-' + digitos.slice(10) : String(valor || '').trim();
    }
    function fechaApi(valor) {
        var partes = String(valor == null ? '' : valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
        return partes ? partes[0] : null;
    }
    function limpio(valor) {
        return String(valor == null ? '' : valor).trim();
    }
    function logoParaPdf(origen) {
        if (typeof origen !== 'string' || !origen.trim() || typeof window.Image !== 'function') return Promise.resolve(null);
        return new Promise(function (resolver) {
            var imagen = new window.Image();
            imagen.onload = function () {
                var ancho = imagen.naturalWidth || imagen.width;
                var alto = imagen.naturalHeight || imagen.height;
                if (!ancho || !alto) { resolver(null); return; }
                var escala = Math.min(1, 900 / ancho, 400 / alto);
                var lienzo = window.document.createElement('canvas');
                lienzo.width = Math.max(1, Math.round(ancho * escala));
                lienzo.height = Math.max(1, Math.round(alto * escala));
                try {
                    lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
                    resolver({ datos: lienzo.toDataURL('image/png'), ancho: lienzo.width, alto: lienzo.height });
                } catch (e) { resolver(null); }
            };
            imagen.onerror = function () { resolver(null); };
            imagen.src = origen;
        });
    }
    function medidaLogo(logo, anchoMaximo, altoMaximo) {
        var escala = Math.min(anchoMaximo / logo.ancho, altoMaximo / logo.alto);
        return { ancho: logo.ancho * escala, alto: logo.alto * escala };
    }
    function armar(datos) {
        var razon = limpio(datos.Razon_Social);
        var comercial = limpio(datos.Nombre_Comercial);
        var cuit = datos.CUIT ? cuitConGuiones(datos.CUIT) : '';
        var condicion = limpio(datos.Condicion_IVA);
        var calle = [limpio(datos.Calle), limpio(datos.AlturaCalle)].filter(Boolean).join(' ');
        var localidad = limpio(datos.Localidad);
        var provincia = limpio(datos.Provincia);
        var lugar = [localidad, provincia && provincia.toLowerCase() !== localidad.toLowerCase() ? provincia : ''].filter(Boolean).join(', ');
        var domicilio = [calle, lugar].filter(Boolean).join(', ') + (datos.CodigoPostal ? ' (CP ' + limpio(datos.CodigoPostal) + ')' : '');
        var telefono = limpio(datos.Telefono);
        var email = limpio(datos.Email);
        return {
            nombre: comercial || razon,
            razonSocial: razon,
            nombreComercial: comercial,
            cuit: cuit,
            condicionIva: condicion,
            domicilio: domicilio,
            telefono: telefono,
            email: email,
            logoOriginal: limpio(datos.Logo) || null,
            logo: null,
            lineas: [
                comercial && comercial !== razon ? razon : '',
                [cuit ? 'CUIT ' + cuit : '', condicion].filter(Boolean).join(' · '),
                domicilio,
                [telefono ? 'Tel. ' + telefono : '', email].filter(Boolean).join(' · ')
            ].filter(Boolean)
        };
    }
    function obtener(fecha) {
        var dia = fechaApi(fecha);
        var url = SGTL.api + '/empresa' + (dia ? '?fecha=' + encodeURIComponent(dia) : '');
        return fetch(url, { cache: 'no-store', headers: SGTL.encabezados({ Accept: 'application/json' }) })
            .then(function (respuesta) {
                return respuesta.json().catch(function () { return {}; }).then(function (datos) {
                    if (respuesta.status === 404) {
                        throw new Error('Todavía no están cargados los datos de la empresa. Completalos en Configuración → Gestionar empresa.');
                    }
                    if (!respuesta.ok || !datos || !datos.Razon_Social) throw new Error('sin datos');
                    var empresa = armar(datos);
                    return logoParaPdf(empresa.logoOriginal).then(function (logo) {
                        empresa.logo = logo;
                        return empresa;
                    });
                });
            }, function () { throw new Error('sin conexión'); })
            .catch(function (error) {
                if (error && /Gestionar empresa/.test(error.message)) throw error;
                throw new Error('No se pudieron leer los datos de la empresa para el PDF. Probá de nuevo.');
            });
    }
    window.SGTLEmpresa = { obtener: obtener, armar: armar, fechaApi: fechaApi, medidaLogo: medidaLogo };
})(window);