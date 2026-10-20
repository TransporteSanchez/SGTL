const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'static', 'js', 'cuenta-corriente-clientes.js'), 'utf8');

function extraerFuncion(nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.notStrictEqual(inicio, -1, 'falta la función ' + nombre);
    const apertura = fuente.indexOf('{', inicio);
    let nivel = 0;
    for (let i = apertura; i < fuente.length; i += 1) {
        if (fuente[i] === '{') nivel += 1;
        if (fuente[i] === '}') nivel -= 1;
        if (nivel === 0) return fuente.slice(inicio, i + 1);
    }
    throw new Error('no se pudo extraer ' + nombre);
}

function renderizarFacturaConCreditoAplicado(tipo) {
    const tabla = { innerHTML: '' };
    const cabecera = { innerHTML: '' };
    const sandbox = {
        movimientos: [{
            ComprobanteID: 25,
            Fecha: '2026-10-12',
            Comprobante: 'FAC-00000004',
            Concepto: 'Servicio de prueba',
            Debe: 226925.82,
            Cancelado: 200000,
            Saldo: 26925.82,
            Estado: 'Parcial',
            Aplicaciones: [{
                ComprobanteID: 26,
                Fecha: '2026-10-12',
                Tipo: tipo,
                Comprobante: tipo + '-00000004',
                Concepto: tipo === 'REC' ? 'Cobranza de 2 comprobantes' : 'Nota de crédito aplicada',
                Importe: 200000,
                Estado: 'Aplicado'
            }]
        }],
        porId: function (id) { return id === 'ccTablaCabecera' ? cabecera : tabla; },
        esConsultaGeneral: function () { return false; },
        fecha: function (valor) { return valor; },
        escapar: function (valor) { return String(valor || ''); },
        dinero: function (valor) { return '$ ' + Number(valor || 0).toFixed(2); },
        badgeEstado: function (estado) { return estado; },
        botonDetalle: function () { return ''; }
    };

    vm.runInNewContext(extraerFuncion('renderMovimientos'), sandbox,
        { filename: 'cuenta-corriente-clientes.js' });
    sandbox.renderMovimientos();
    return tabla.innerHTML;
}

['REC', 'NC'].forEach(function (tipo) {
    const tabla = renderizarFacturaConCreditoAplicado(tipo);
    assert.match(tabla, /<tr class="cc-application-row cc-credit-application-row d-none"/,
        'un comprobante de crédito ' + tipo + ' aplicado debe identificarse para recibir el sombreado visual');
});
console.log('OK: los Recibos y las NC asociadas se distinguen en la tabla');
