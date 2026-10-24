// Km al galpón de los orígenes y destinos (control interno, 24/10). El recorrido completo de un viaje es galpón → origen
// → destino → galpón: los tramos al galpón dependen solo del origen y del destino, así que se calculan una vez por lugar
// con Google Maps (la clave es del navegador, por eso lo hace la pantalla) y se guardan en la API (api/Costos/KmGalpon).
// Uso: SGTLGalpon.completar() calcula todos los que faltan; SGTLGalpon.completar({ origen: 10, destino: 20 }) solo esos.
// alAvanzar(hechos, total) avisa el progreso. Devuelve { calculados, fallidos, total, sinGalpon }. Nunca rechaza.
// Va después de jQuery, sgtl-ui.js y google-maps.js.
(function (window) {
  'use strict';

  var API = 'http://localhost:50222/api';
  var PAUSA_MS = 250;   // Google limita las consultas seguidas: van de a una.
  var todos = null;     // un solo cálculo completo a la vez

  function encabezados() {
    var token = '';
    try { token = localStorage.getItem('token') || ''; } catch (e) { }
    return { Authorization: 'Bearer ' + token };
  }

  function esperar(ms) { return new Promise(function (listo) { setTimeout(listo, ms); }); }

  function distancia(servicio, desde, hasta) {
    return new Promise(function (listo, fallo) {
      servicio.route({ origin: desde, destination: hasta, travelMode: 'DRIVING' }, function (resultado, estado) {
        var ruta = estado === 'OK' && resultado && resultado.routes && resultado.routes[0];
        if (!ruta) { fallo(new Error(estado || 'sin ruta')); return; }
        var metros = (ruta.legs || []).reduce(function (suma, tramo) { return suma + (tramo.distance ? tramo.distance.value : 0); }, 0);
        listo(Math.round(metros / 100) / 10);
      });
    });
  }

  function calcular(opciones) {
    var datos = {};
    if (opciones.origen) datos.origen = opciones.origen;
    if (opciones.destino) datos.destino = opciones.destino;
    var resultado = { calculados: 0, fallidos: 0, total: 0, sinGalpon: false };
    return window.SGTL.ajax({ url: API + '/Costos/KmGalpon/Pendientes', type: 'GET', data: datos, headers: encabezados() })
      .then(function (r) {
        if (!r || !r.Galpon) { resultado.sinGalpon = true; return resultado; }
        var pendientes = r.Pendientes || [];
        resultado.total = pendientes.length;
        if (!pendientes.length || !window.SGTLGoogleMaps) return resultado;
        return window.SGTLGoogleMaps.cargar()
          .then(function () { return window.google.maps.importLibrary('routes'); })
          .then(function (rutas) {
            var servicio = new rutas.DirectionsService();
            var hechos = 0;
            return pendientes.reduce(function (cadena, lugar) {
              return cadena.then(function () {
                var esOrigen = lugar.Tipo === 'Origen';
                return distancia(servicio, esOrigen ? r.Galpon : lugar.Direccion, esOrigen ? lugar.Direccion : r.Galpon)
                  .then(function (km) {
                    return window.SGTL.ajax({
                      url: API + '/Costos/KmGalpon', type: 'PUT', contentType: 'application/json', headers: encabezados(),
                      data: JSON.stringify({ Tipo: lugar.Tipo, ID: lugar.ID, Km: km })
                    });
                  })
                  .then(function () { resultado.calculados++; }, function () { resultado.fallidos++; })
                  .then(function () {
                    hechos++;
                    if (typeof opciones.alAvanzar === 'function') opciones.alAvanzar(hechos, pendientes.length);
                    return esperar(PAUSA_MS);
                  });
              });
            }, Promise.resolve()).then(function () { return resultado; });
          });
      })
      .catch(function () { return resultado; });
  }

  function completar(opciones) {
    opciones = opciones || {};
    if (opciones.origen || opciones.destino) return calcular(opciones);
    if (!todos) todos = calcular(opciones).then(function (r) { todos = null; return r; });
    return todos;
  }

  window.SGTLGalpon = { completar: completar };
})(window);
