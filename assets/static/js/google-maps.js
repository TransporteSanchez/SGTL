(function (window, document) {
    'use strict';

    // Clave de navegador: en Google Cloud esta restringida a las APIs de Maps del proyecto y a los sitios
    // http://127.0.0.1:5502/* y http://localhost:5502/*. Si el front se sirve desde otro host o puerto hay que agregarlo ahi.
    var API_KEY = 'AIzaSyDLmcAK6pkkh-OaRz7xCietaKcqSmMDnNc';
    var carga = null;
    var alFallarAuth = [];

    // Google llama a esta funcion global cuando rechaza la clave (sitio no permitido, API deshabilitada, etc.).
    window.gm_authFailure = function () {
        alFallarAuth.forEach(function (fn) { try { fn(); } catch (e) { } });
    };

    function cargar() {
        if (window.google && window.google.maps && window.google.maps.importLibrary) return Promise.resolve(window.google.maps);
        if (carga) return carga;
        carga = new Promise(function (resolve, reject) {
            var callback = '__sgtlGoogleMapsListo';
            window[callback] = function () { delete window[callback]; resolve(window.google.maps); };
            var s = document.createElement('script');
            s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(API_KEY)
                + '&language=es&region=AR&loading=async&callback=' + callback;
            s.async = true;
            s.onerror = function () { carga = null; reject(new Error('No se pudo descargar Google Maps.')); };
            document.head.appendChild(s);
        });
        return carga;
    }

    window.SGTLGoogleMaps = {
        cargar: cargar,
        alFallarAutenticacion: function (fn) { alFallarAuth.push(fn); }
    };
})(window, document);
