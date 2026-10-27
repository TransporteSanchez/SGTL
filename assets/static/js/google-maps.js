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

    // Lo que tarda el viaje según Google (Rocío, 27/10, punto 36 de la §41): se ve junto a los km al cargar un viaje o un
    // presupuesto, y el fin no puede quedar antes (Google estima para un auto: un camión no llega antes). Si es más tiempo,
    // no se pide nada (las esperas van como estadía). Sin la ruta de Google (km a mano), no hay control.

    // La suma de los tramos de la ruta, en segundos (null si no hay).
    function segundosDeRuta(ruta) {
        if (!ruta || !ruta.legs || !ruta.legs.length) return null;
        var segundos = ruta.legs.reduce(function (t, l) { return t + (l.duration ? l.duration.value : 0); }, 0);
        return segundos > 0 ? segundos : null;
    }

    // "1 h 5 min", "45 min", "6 h" (como el tiempo estimado de los presupuestos).
    function textoDuracion(segundos) {
        var minutos = Math.round(segundos / 60), horas = Math.floor(minutos / 60), resto = minutos % 60;
        if (!horas) return resto + ' min';
        return horas + ' h' + (resto ? ' ' + resto + ' min' : '');
    }

    // El error debajo de Fin (§6.3, corto y empezando por el dato): '' si está bien. inicio y fin como los guarda el
    // campo ("AAAA-MM-DD HH:MM", con espacio o con T).
    function errorFin(inicio, fin, segundos) {
        if (!inicio || !fin || !segundos) return '';
        var desde = new Date(String(inicio).replace(' ', 'T')), hasta = new Date(String(fin).replace(' ', 'T'));
        if (isNaN(desde.getTime()) || isNaN(hasta.getTime())) return '';
        var llegada = new Date(desde.getTime() + Math.ceil(segundos / 60) * 60000);
        if (hasta >= llegada) return '';
        var dos = function (n) { return (n < 10 ? '0' : '') + n; };
        var hora = dos(llegada.getHours()) + ':' + dos(llegada.getMinutes()) + ' hs';
        var cuando = llegada.toDateString() === desde.toDateString() ? 'a las ' + hora
            : 'el ' + dos(llegada.getDate()) + '/' + dos(llegada.getMonth() + 1) + '/' + llegada.getFullYear() + ' a las ' + hora;
        return 'Fin no permitido: tiene que ser ' + cuando + ' o después (Google estima ' + textoDuracion(segundos) + ' de viaje).';
    }

    window.SGTLGoogleMaps = {
        cargar: cargar,
        alFallarAutenticacion: function (fn) { alFallarAuth.push(fn); },
        segundosDeRuta: segundosDeRuta,
        textoDuracion: textoDuracion,
        errorFin: errorFin
    };
})(window, document);
