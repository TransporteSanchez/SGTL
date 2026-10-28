const assert = require('assert');
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'cuenta-corriente',
    '03_verificacion_posterior.sql'), 'utf8');
const consultas = sql.split(';').map(consulta => consulta.trim());

// Una consulta que exige igualdad marcaría como inconsistente un crédito emitido
// y todavía disponible para imputar, incluso si sus aplicaciones son válidas.
const credito = consultas.find(consulta => consulta.includes('ON a.ComprobanteCreditoID = c.Comprobante_ID AND a.Vigente = 1'));
assert.ok(credito, 'debe auditar los importes aplicados de los créditos emitidos');
assert.match(credito, /WHERE c\.Estado = 'EMITIDO' AND c\.Impacto = 'C'/);
assert.match(credito, /HAVING COALESCE\(SUM\(a\.Importe\),0\) > c\.Total$/,
    'un crédito corriente puede quedar sin aplicar o parcialmente aplicado; solo es inválido exceder su total');

// El cancelatorio de una proforma sigue siendo una operación por el total de
// una única deuda, a diferencia del crédito corriente.
const cancelatorio = consultas.find(consulta => consulta.includes('COUNT(CASE WHEN a.Vigente=1 THEN 1 END) AS AplicacionesVigentes'));
assert.ok(cancelatorio, 'debe auditar por separado los créditos cancelatorios');
assert.match(cancelatorio, /WHERE c\.Estado = 'EMITIDO' AND c\.Impacto = 'C' AND c\.ComprobanteReferenciaID IS NOT NULL/);
assert.match(cancelatorio, /COUNT\(CASE WHEN a\.Vigente=1 THEN 1 END\) <> 1/);
assert.match(cancelatorio, /SUM\(CASE WHEN a\.Vigente=1 THEN a\.Importe ELSE 0 END\),0\) <> c\.Total/);

const notaCorriente = consultas.find(consulta => consulta.includes("WHERE c.Tipo = 'NC' AND c.ComprobanteReferenciaID IS NULL"));
if (notaCorriente) {
    assert.match(notaCorriente, /HAVING COALESCE\(SUM\(CASE WHEN a\.Vigente=1 THEN a\.Importe ELSE 0 END\),0\) > c\.Total$/,
        'una nota corriente también puede conservar saldo para imputar');
}

// Un cliente puede tener crédito a favor mientras aún no lo imputa.
assert.doesNotMatch(sql, /HAVING\s+SUM\(CASE WHEN Impacto = 'D' THEN Importe ELSE -Importe END\) < 0/,
    'el saldo a favor de un cliente no es una inconsistencia');

console.log('OK: auditoría de créditos sin imputar y cancelatorios');
