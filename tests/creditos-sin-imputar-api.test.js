const assert = require('assert');
const fs = require('fs');
const path = require('path');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez',
    'Controllers', 'ComprobantesController.cs'), 'utf8');

assert.match(fuente, /class\s+ImputarCreditoRequest[\s\S]*?DateTime\?\s+Fecha[\s\S]*?List<AplicacionComprobanteRequest>\s+Aplicaciones/,
    'la imputación posterior requiere fecha y los importes acumulados por comprobante');
assert.match(fuente, /\[HttpPut\][\s\S]*?\[Route\("comprobantes\/\{id:int\}\/aplicaciones"\)\][\s\S]*?IHttpActionResult\s+ImputarCredito/,
    'falta la operación para imputar un crédito ya emitido');

const inicio = fuente.indexOf('public IHttpActionResult ImputarCredito(');
assert.ok(inicio > 0, 'falta implementar la imputación posterior');
const imputar = fuente.slice(inicio);
assert.match(imputar, /BeginTransaction\(IsolationLevel\.Serializable\)/,
    'las imputaciones deben validarse y guardarse en una transacción serializable');
assert.match(imputar, /ValidarAcceso\(connection, transaction,\s*credito\.Tipo == "REC" \? "REC_EMITIR" : "NC_EMITIR"/,
    'la imputación requiere el permiso de recibos o el de créditos según el comprobante');
assert.doesNotMatch(imputar, /credito\.Impacto != "C" \|\| credito\.Tipo == "REC"/,
    'un recibo de crédito admite imputaciones posteriores');
assert.match(imputar, /ComprobanteReferenciaID|ReferenciaID/,
    'el crédito cancelatorio no puede admitir imputaciones posteriores');
assert.match(imputar, /Estado\s*!=\s*"EMITIDO"/,
    'un crédito no emitido o anulado no admite imputaciones');
assert.match(imputar, /importeAplicado\s*>\s*credito\.Total/,
    'el total deseado no puede superar el importe del crédito');
assert.match(imputar, /actuales\.TryGetValue|actuales\.ContainsKey/,
    'la operación debe contrastar el estado deseado con las imputaciones vigentes');
assert.match(imputar, /factura\.ClienteID\s*!=\s*credito\.ClienteID/,
    'la deuda debe corresponder al mismo cliente');
assert.match(imputar, /incremento\s*>\s*factura\.Pendiente/,
    'solo el incremento se valida contra el saldo de la deuda');
assert.match(imputar, /FechaArgentina\(\)/,
    'la fecha de imputación no puede ser futura');
assert.match(imputar, /INSERT dbo\.CUENTA_CORRIENTE_APLICACIONES/,
    'debe guardar las nuevas imputaciones');
assert.match(imputar, /'IMPUTAR','COMPROBANTES'/,
    'la imputación debe quedar auditada');

const emitir = fuente.slice(fuente.indexOf('public IHttpActionResult Emitir('), inicio);
assert.match(emitir, /creditoSinAplicar\s*\?\s*Coincide\(/,
    'el reintento de emisión sin imputar debe comparar datos fijos, aunque el crédito ya tenga imputaciones');
assert.match(emitir, /notaCreditoCorriente\s*&&\s*!creditoSinAplicar\s*\?\s*0\s*:\s*cancelatorioProforma/,
    'el crédito sin imputar debe calcular IVA a partir del neto y el porcentaje');
assert.doesNotMatch(emitir, /creditoSinAplicar\s*&&\s*\(request\.IvaPct\s*!=\s*0/,
    'el crédito sin imputar debe admitir una alícuota de IVA');

console.log('OK: contrato de créditos internos sin imputar e imputación posterior');
