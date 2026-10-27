const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'static', 'js', 'cuenta-corriente-clientes.js'), 'utf8');
const controlador = fs.readFileSync(
    path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'CuentaCorrienteController.cs'), 'utf8');

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

function renderizarFacturaConCreditoAplicado(tipo, impacto) {
    const tabla = { innerHTML: '' };
    const cabecera = { innerHTML: '' };
    const sandbox = {
        ordenMovimientos: null,
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
                Impacto: impacto,
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
        window: {
            SGTL: {
                tabla: { habilitarOrden: function () { return { parametros: function () { return {}; } }; } },
                botonFila: function () { return ''; },
                accionesFila: function () { return ''; }
            }
        }
    };

    vm.runInNewContext([
        extraerFuncion('tipoComprobante'),
        extraerFuncion('estadoRecibo'),
        extraerFuncion('accionesComprobante'),
        extraerFuncion('encabezadoMovimiento'),
        extraerFuncion('renderMovimientos')
    ].join('\n'), sandbox,
        { filename: 'cuenta-corriente-clientes.js' });
    sandbox.renderMovimientos();
    return tabla.innerHTML;
}

[['REC', 'C'], ['NC', 'C'], ['CI', 'C']].forEach(function ([tipo, impacto]) {
    const tabla = renderizarFacturaConCreditoAplicado(tipo, impacto);
    assert.match(tabla, /<tr class="cc-application-row cc-credit-application-row[^"]* d-none"/,
        'un comprobante de crédito ' + tipo + ' aplicado debe identificarse para recibir el sombreado visual');
});
const tablaSinImpactoCredito = renderizarFacturaConCreditoAplicado('CI', 'D');
assert.doesNotMatch(tablaSinImpactoCredito, /<tr class="cc-application-row cc-credit-application-row/,
    'la sigla CI por sí sola no identifica una fila de crédito');
// La última aplicación de la factura cierra el grupo (pedido de Rocío del 22/10).
const tablaUltima = renderizarFacturaConCreditoAplicado('REC', 'C');
assert.match(tablaUltima, /<tr class="cc-application-row cc-credit-application-row cc-application-last d-none"/,
    'la última aplicación de una factura cierra su grupo');

const dto = controlador.slice(controlador.indexOf('public class AplicacionCuentaDto'),
    controlador.indexOf('public class PendienteCuentaDto'));
assert.match(dto, /public string Impacto\s*\{\s*get;\s*set;\s*\}/,
    'la API debe devolver el impacto de cada comprobante aplicado');
const inicioConsulta = controlador.indexOf('var aplicaciones = db.Database.SqlQuery<AplicacionCuentaDto>');
const consulta = controlador.slice(inicioConsulta, controlador.indexOf('foreach (var item in items)', inicioConsulta));
assert.match(consulta, /credito\.Impacto(?:\s+AS\s+Impacto)?\s*,/,
    'la consulta debe obtener el impacto del comprobante aplicado');

console.log('OK: los créditos aplicados se distinguen en la tabla por impacto');
