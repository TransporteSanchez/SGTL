const assert = require('assert');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const controlador = fs.readFileSync(
    path.join(raiz, 'WebApi_TransporteSanchez', 'Controllers', 'ComprobantesController.cs'), 'utf8');
const verificacion = fs.readFileSync(
    path.join(raiz, 'database', 'cuenta-corriente', '03_verificacion_posterior.sql'), 'utf8');
const migracionPath = path.join(raiz, 'database', 'cuenta-corriente', '10_notas_credito_multiples_aplicaciones.sql');

assert.match(controlador,
    /class\s+AplicacionComprobanteRequest[\s\S]*?int\s+ComprobanteID[\s\S]*?decimal\s+Importe/,
    'la API debe representar cada aplicación de una Nota de Crédito');
assert.match(controlador,
    /List<AplicacionComprobanteRequest>\s+Aplicaciones\s*\{\s*get;\s*set;\s*\}/,
    'el request de comprobante debe aceptar una lista de aplicaciones');
assert.match(controlador,
    /CoincidenAplicaciones\s*\(/,
    'un reintento con la misma clave debe comparar las aplicaciones persistidas');
assert.match(controlador,
    /CoincideReintentoNotaCreditoCorriente\s*\(/,
    'el reintento de una NC corriente debe comparar su encabezado sin recalcular saldos ya aplicados');
const indiceBuscarClave = controlador.indexOf('var existente = BuscarPorClave');
const indiceValidarSaldosNc = controlador.indexOf('else if (notaCreditoCorriente)');
assert.ok(indiceBuscarClave !== -1 && indiceValidarSaldosNc !== -1 && indiceBuscarClave < indiceValidarSaldosNc,
    'la idempotencia debe resolverse antes de validar saldos mutables de las Facturas');
assert.match(controlador,
    /Aplicaciones\.Any\(x\s*=>\s*x\s*==\s*null\s*\|\|\s*x\.ComprobanteID/,
    'una aplicación nula debe rechazarse como request inválido y no provocar un error interno');
assert.match(controlador,
    /foreach\s*\(var aplicacion in aplicacionesNotaCredito\)/,
    'la emisión debe persistir todas las aplicaciones de la NC');
assert.match(controlador,
    /request\.Tipo\s*==\s*"NC"[\s\S]*?request\.ProformaID\.HasValue[\s\S]*?aplicacionesNotaCredito\.Count\s*!=\s*1/,
    'una NC cancelatoria de Proforma debe seguir teniendo una única aplicación');
assert.match(controlador,
    /FechaVencimiento\s*\{\s*get;\s*set;\s*\}/,
    'las Facturas de referencia deben exponer vencimiento para ordenar la distribución');
assert.ok(fs.existsSync(migracionPath), 'debe existir la migración incremental para NC múltiples');

const migracion = fs.readFileSync(migracionPath, 'utf8');
assert.match(migracion, /DROP\s+CONSTRAINT\s+CK_CC_COMP_Referencia/i,
    'la migración debe reemplazar el CHECK que obliga la referencia única');
assert.match(migracion, /ComprobanteReferenciaID\s+IS\s+NULL\s+AND\s+TipoReferencia\s+IS\s+NULL/i,
    'la migración debe permitir una NC corriente sin referencia única');
assert.match(verificacion, /ComprobanteReferenciaID\s+IS\s+NOT\s+NULL/i,
    'la verificación debe conservar la regla de coincidencia para NC con referencia única');
assert.match(verificacion,
    /c\.ComprobanteReferenciaID\s+IS\s+NOT\s+NULL[\s\S]*?HAVING[\s\S]*?COUNT\s*\(CASE\s+WHEN\s+a\.Vigente\s*=\s*1\s+THEN\s+1\s+END\)\s*<>\s*1[\s\S]*?SUM\s*\(CASE\s+WHEN\s+a\.Vigente\s*=\s*1\s+THEN\s+a\.Importe/s,
    'la auditoría debe exigir una única aplicación vigente por el total para NC con referencia');
assert.match(verificacion, /SUM\s*\(CASE\s+WHEN\s+a\.Vigente=1\s+THEN\s+a\.Importe/i,
    'la verificación debe controlar que las NC múltiples se apliquen por su total');

console.log('OK: contrato de Notas de Crédito con aplicaciones múltiples');
