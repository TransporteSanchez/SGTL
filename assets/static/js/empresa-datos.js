// Datos de la empresa para los documentos (Gestionar empresa, 23/10). Los usan los PDF de factura (también recibo y
// notas de crédito y de débito), proforma y presupuesto: ninguno tiene el nombre de la empresa escrito.
// La API guarda versiones: un documento ya emitido pide los datos de su fecha de emisión (así conserva los datos con
// que se emitió, como los del cliente) y uno que todavía no se emitió (un borrador), los actuales.
// Uso: SGTLEmpresa.obtener('2026-10-23' | null).then(function (empresa) { empresa.nombre; empresa.lineas; empresa.logo; … })
// El logo es el de la empresa (Datos de la empresa), nunca el del sistema (Apariencia): restablecer la apariencia no
// cambia los documentos. Sin logo cargado, empresa.logo es null y el documento lleva el nombre en texto.
// Si no se pueden leer, rechaza con un Error cuyo message es el texto para el usuario: el PDF no se arma con datos
// inventados. Va antes de factura-pdf.js, proforma-pdf.js y presupuesto-pdf.js.
(function (window) {
    'use strict';

    var API = 'http://localhost:50222/api';

    // "30715893424" → "30-71589342-4"; si no tiene 11 números, como viene.
    function cuitConGuiones(valor) {
        var d = String(valor == null ? '' : valor).replace(/\D/g, '');
        return d.length === 11 ? d.slice(0, 2) + '-' + d.slice(2, 10) + '-' + d.slice(10) : String(valor || '').trim();
    }

    // "2026-10-23T00:00:00" → "2026-10-23"; null si no hay fecha.
    function fechaApi(valor) {
        var partes = String(valor == null ? '' : valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
        return partes ? partes[0] : null;
    }

    function limpio(valor) { return String(valor == null ? '' : valor).trim(); }

    // jsPDF trabaja bien con PNG: el logo (PNG, JPG, SVG, WebP o ICO) se pasa a PNG, de 900 x 400 como máximo para que
    // el PDF no pese de más. Devuelve { datos, ancho, alto } (para respetar sus proporciones) o null si no se puede leer.
    function logoParaPdf(origen) {
        if (typeof origen !== 'string' || !origen.trim() || typeof window.Image !== 'function') return Promise.resolve(null);
        return new Promise(function (resolver) {
            var imagen = new window.Image();
            imagen.onload = function () {
                var ancho = imagen.naturalWidth || imagen.width, alto = imagen.naturalHeight || imagen.height;
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

    // Medidas para dibujar el logo dentro de un recuadro de anchoMaximo x altoMaximo (mm) sin deformarlo.
    function medidaLogo(logo, anchoMaximo, altoMaximo) {
        var escala = Math.min(anchoMaximo / logo.ancho, altoMaximo / logo.alto);
        return { ancho: logo.ancho * escala, alto: logo.alto * escala };
    }

    // Lo que necesita un PDF, ya armado. "nombre" es lo que va en grande: el nombre comercial si está, si no la razón
    // social. "lineas" son los datos de debajo, en este orden y sin las vacías: la razón social (solo si arriba va el
    // nombre comercial), CUIT y condición de IVA, domicilio, y teléfono y e-mail.
    function armar(d) {
        var razon = limpio(d.Razon_Social);
        var comercial = limpio(d.Nombre_Comercial);
        var cuit = d.CUIT ? cuitConGuiones(d.CUIT) : '';
        var condicion = limpio(d.Condicion_IVA);
        var calle = [limpio(d.Calle), limpio(d.AlturaCalle)].filter(Boolean).join(' ');
        var localidad = limpio(d.Localidad);
        var provincia = limpio(d.Provincia);
        var lugar = [localidad, provincia && provincia.toLowerCase() !== localidad.toLowerCase() ? provincia : '']
            .filter(Boolean).join(', ');
        var domicilio = [calle, lugar].filter(Boolean).join(', ') + (d.CodigoPostal ? ' (CP ' + limpio(d.CodigoPostal) + ')' : '');
        var telefono = limpio(d.Telefono);
        var email = limpio(d.Email);
        return {
            nombre: comercial || razon,
            razonSocial: razon,
            nombreComercial: comercial,
            cuit: cuit,
            condicionIva: condicion,
            domicilio: domicilio,
            telefono: telefono,
            email: email,
            logoOriginal: limpio(d.Logo) || null,
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
        return fetch(API + '/empresa' + (dia ? '?fecha=' + dia : ''), { cache: 'no-store', headers: { Accept: 'application/json' } })
            .then(function (respuesta) {
                return respuesta.json().catch(function () { return {}; }).then(function (datos) {
                    if (respuesta.status === 404) {
                        throw new Error('Todavía no están cargados los datos de la empresa. Completalos en Configuración → Gestionar empresa.');
                    }
                    if (!respuesta.ok || !datos || !datos.Razon_Social) throw new Error('sin datos');
                    var empresa = armar(datos);
                    return logoParaPdf(empresa.logoOriginal).then(function (logo) { empresa.logo = logo; return empresa; });
                });
            }, function () { throw new Error('sin conexión'); })
            .catch(function (error) {
                if (error && /Gestionar empresa/.test(error.message)) throw error;
                throw new Error('No se pudieron leer los datos de la empresa para el PDF. Probá de nuevo.');
            });
    }

    window.SGTLEmpresa = { obtener: obtener, armar: armar, fechaApi: fechaApi, medidaLogo: medidaLogo };
})(window);
