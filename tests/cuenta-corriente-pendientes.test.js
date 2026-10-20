const assert = require('assert');
const fs = require('fs');
const path = require('path');

const fuente = fs.readFileSync(
    path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'CuentaCorrienteController.cs'),
    'utf8'
);

const inicio = fuente.indexOf('private IHttpActionResult ConsultarPendientes');
const fin = fuente.indexOf('\n        }\n    }\n}', inicio);
const consulta = fuente.slice(inicio, fin);

assert.notStrictEqual(inicio, -1, 'debe existir la consulta de comprobantes sin relacionar');
assert.match(
    fuente,
    /public\s+DateTime\?\s+FechaVencimiento\s*\{\s*get;\s*set;\s*\}/,
    'un recibo sin imputar no tiene fecha de vencimiento y debe poder materializarse'
);
assert.match(
    consulta,
    /ComprobanteCreditoID\s*=\s*c\.Comprobante_ID/,
    'los recibos se deben medir por sus imputaciones como crédito'
);
assert.match(
    consulta,
    /c\.Tipo\s*=\s*'REC'\s+AND\s+c\.Impacto\s*=\s*'C'/,
    'los recibos emitidos deben incluirse como comprobantes de crédito'
);
assert.match(
    consulta,
    /FROM\s+SinRelacionar\s+WHERE\s+Total\s*-\s*Aplicado\s*>\s*0/,
    'solo deben aparecer los recibos con un importe aún sin imputar'
);

console.log('OK: comprobantes sin relacionar incluyen recibos sin imputar');
