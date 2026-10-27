// Precio por orden del día (§43 de PENDIENTES; docs/diseno/vuelta-del-dia-diseno.md, maqueta aprobada por Rocío el 27/10):
// arma el bloque con los viajes de ese cliente y recorrido ese día, la línea de debajo de la tarifa y los avisos de lo que
// va a pasar con los otros al guardar. Los datos y los textos vienen de la API ("Orden" de api/Tarifario/Calcular, o
// api/Viajes/{id}/Orden en Ver detalle): acá solo se dibujan. Lo usan Gestionar viajes, Ver detalle del viaje y presupuestos.
(function (window) {
  'use strict';
  if (window.SGTLOrdenDelDia) return;

  var esc = function (t) { return window.SGTL.escapar(t == null ? '' : String(t)); };

  // "el miércoles 28/10/2026" (fecha AAAA-MM-DD o con hora).
  function dia(fecha) {
    var texto = String(fecha || '').substring(0, 10);
    var partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    if (!partes) return '';
    var d = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
    return 'el ' + d.toLocaleDateString('es-AR', { weekday: 'long' }) + ' ' + window.SGTL.fecha(texto);
  }

  function quien(i, opciones) {
    if (i.Este) return (opciones.esteTexto || 'Este viaje') + (opciones.modo === 'detalle' && i.Id ? ' (#' + i.Id + ')' : '');
    return (i.Clase === 'Presupuesto' ? 'Presupuesto #' : 'Viaje #') + i.Id;
  }

  // Lo que le pasa, con las etiquetas del design system (§4.1): "Se actualiza" (azul, se acomoda solo), "Para revisar"
  // (amarillo: falta algo); si no cambia, el presupuesto aceptado (amarillo) y, en Ver detalle, el estado de cada viaje.
  function etiqueta(i, opciones) {
    if (i.Via === 'solo') return window.SGTL.estado('Se actualiza', 'Se actualiza', 'azul');
    if (i.Via) return window.SGTL.estado('Para revisar', 'Para revisar', 'amarillo');
    if (i.Clase === 'Presupuesto') return window.SGTL.estado('Aceptado', 'Aceptado', 'amarillo');
    if (opciones.modo === 'detalle' && i.Estado) return window.SGTL.estado(i.Estado);
    return '';
  }

  // Debajo de la hora, en gris, por qué no se mueve: "ya se entregó", "de un presupuesto aceptado".
  function nota(i, opciones) {
    if (i.Este || opciones.modo === 'detalle' || i.Clase === 'Presupuesto') return '';
    if (i.DePresupuesto) return ' · de un presupuesto aceptado';
    var estados = { En_viaje: ' · en viaje', Entregado: ' · ya se entregó', Listo_para_facturar: ' · listo para facturar', Facturado: ' · facturado' };
    return estados[i.Estado] || '';
  }

  function precio(i) {
    var monto = function (v) { return v == null ? '—' : window.SGTL.monto(v); };
    if (i.Via === 'solo' && i.ImporteNuevo != null) return esc(monto(i.ImporteNuevo)) + '<small>antes ' + esc(monto(i.Importe)) + '</small>';
    if (i.Via && i.ImporteNuevo != null) return esc(monto(i.Importe)) + '<small>le corresponde ' + esc(monto(i.ImporteNuevo)) + '</small>';
    return esc(monto(i.Importe));
  }

  // grupo: filas { Clase, Id, Este, Estado, DePresupuesto, Hora, Orden, Via, Importe, ImporteNuevo }. Vacío con menos de dos.
  // opciones: { fecha (del día), modo ('formulario' o 'detalle'), esteTexto ('Este viaje', 'Este presupuesto') }.
  function bloque(grupo, opciones) {
    opciones = opciones || {};
    if (!grupo || grupo.length < 2) return '';
    var filas = grupo.map(function (i) {
      return '<div class="sgtl-dia-fila' + (i.Este ? ' este' : '') + '">' +
        '<span class="sgtl-dia-orden" aria-label="' + (i.Orden === 1 ? 'Primer viaje del día' : 'Segundo viaje del día') + '">' + (i.Orden === 1 ? '1º' : '2º') + '</span>' +
        '<div class="sgtl-dia-quien">' + esc(quien(i, opciones)) + etiqueta(i, opciones) +
        '<small>' + esc(i.Hora) + esc(nota(i, opciones)) + '</small></div>' +
        '<div class="sgtl-dia-precio">' + precio(i) + '</div></div>';
    }).join('');
    return '<div class="sgtl-dia-titulo">Viajes de este cliente y recorrido ' + esc(dia(opciones.fecha)) + '</div>' +
      '<div class="sgtl-dia mb-2">' + filas + '</div>';
  }

  // Los avisos de antes de guardar: azul lo que se actualiza solo y amarillo lo que va a necesitar revisión (§5.1).
  function avisos(lista) {
    return (lista || []).map(function (a) {
      return '<div class="alert ' + (a.Tipo === 'warning' ? 'alert-warning' : 'alert-info') + ' py-2 mb-2 sgtl-dia-aviso" role="status">' + esc(a.Texto) + '</div>';
    }).join('');
  }

  // Todo junto en un contenedor: el bloque y, debajo, los avisos.
  function dibujar(contenedor, orden, opciones) {
    var el = typeof contenedor === 'string' ? document.querySelector(contenedor) : contenedor;
    if (!el) return;
    var html = orden ? bloque(orden.Grupo, opciones) + avisos(orden.Avisos) : '';
    el.innerHTML = html;
    el.classList.toggle('d-none', !html);
  }

  // Después de guardar: el toast con lo que cambió en los otros viajes ("El precio del viaje #44 se actualizó a $ …").
  function textoGuardado(base, orden) {
    if (!orden) return base;
    var partes = [base];
    (orden.Actualizados || []).forEach(function (a) {
      partes.push('El precio del viaje #' + a.Id + ' se actualizó a ' + window.SGTL.monto(a.Importe) + '.');
    });
    (orden.ParaRevisar || []).forEach(function (r) {
      partes.push('Es necesario que revises el precio del ' + (r.Clase === 'Presupuesto' ? 'presupuesto #' : 'viaje #') + r.Id + '.');
    });
    return partes.join(' ');
  }

  window.SGTLOrdenDelDia = { bloque: bloque, avisos: avisos, dibujar: dibujar, textoGuardado: textoGuardado };
})(window);
