const assert = require('assert');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers');
const casos = [
    ['ComprobantesController.cs', 'request.Tipo', 1],
    ['FacturasController.cs', 'request.Tipo', 1],
    ['RecibosController.cs', '"REC"', 2]
];

for (const [archivo, tipo, cantidad] of casos) {
    const fuente = fs.readFileSync(path.join(raiz, archivo), 'utf8');
    const llamadas = [...fuente.matchAll(/FacturacionComprobantesConfiguracion\.Obtener\(connection,\s*transaction,\s*([^)]*)\)/g)]
        .map(function (coincidencia) { return coincidencia[1].replace(/\s+/g, ''); });
    assert.strictEqual(llamadas.length, cantidad, archivo + ': se revisan todas las emisiones y ediciones');
    llamadas.forEach(function (argumentos) {
        assert.strictEqual(argumentos, tipo + ',request.Letra',
            archivo + ': la configuración y el numerador deben elegirse por la letra solicitada');
    });
}

console.log('OK: comprobantes, facturas y recibos eligen la configuración de emisión por letra');
