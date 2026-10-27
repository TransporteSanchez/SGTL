const assert = require('assert');
const fs = require('fs');
const path = require('path');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez',
    'Controllers', 'ComprobantesController.cs'), 'utf8');
const inicio = fuente.indexOf('public IHttpActionResult Emitir(');
assert.ok(inicio >= 0, 'falta el endpoint de emisión de comprobantes');
const emitir = fuente.slice(inicio);

// Regresión: un tipo configurable de impacto C (p. ej. CI) no debe tratarse
// como deuda solo porque su sigla sea distinta de NC.
const indiceConfiguracion = emitir.indexOf('FacturacionComprobantesConfiguracion.Obtener(');
const indiceCreditoCorriente = emitir.indexOf('bool notaCreditoCorriente =');
assert.ok(indiceConfiguracion >= 0 && indiceCreditoCorriente > indiceConfiguracion,
    'el flujo de crédito corriente se decide después de leer el impacto configurado');
assert.match(emitir.slice(indiceConfiguracion, indiceCreditoCorriente),
    /(?:var|string)\s+impacto\s*=\s*configuracion\.Impacto\b|impacto\s*=\s*configuracion\.Impacto\b/,
    'el impacto del comprobante emitido debe venir de la configuración activa');
assert.match(emitir.slice(indiceCreditoCorriente),
    /bool\s+notaCreditoCorriente\s*=\s*impacto\s*==\s*"C"\s*&&\s*!cancelatorioProforma/,
    'CI debe usar la misma distribución corriente que NC, sin alterar el crédito cancelatorio');

const antesConfiguracion = emitir.slice(0, indiceConfiguracion);
assert.doesNotMatch(antesConfiguracion,
    /request\.Tipo\s*!=\s*"NC"\s*&&\s*request\.Aplicaciones\.Count\s*>\s*0/,
    'la API no debe rechazar las aplicaciones de CI antes de consultar su impacto');
assert.match(emitir.slice(indiceCreditoCorriente),
    /notaCreditoCorriente\s*&&\s*request\.Aplicaciones\.Count\s*==\s*0/,
    'un crédito interno corriente debe aplicarse a una o más deudas');
assert.match(emitir.slice(indiceCreditoCorriente),
    /else\s+if\s*\(notaCreditoCorriente\)[\s\S]*?CalcularComposicionAplicacion/,
    'el neto, IVA y otros impuestos de CI deben derivarse de las deudas aplicadas');
assert.match(emitir.slice(indiceCreditoCorriente),
    /notaCreditoCorriente\s*\?\s*CoincideReintentoNotaCreditoCorriente/,
    'el reintento de CI debe comparar las aplicaciones persistidas');
assert.match(emitir.slice(indiceCreditoCorriente),
    /if\s*\(impacto\s*==\s*"C"\)[\s\S]*?INSERT dbo\.CUENTA_CORRIENTE_APLICACIONES/,
    'el crédito interno debe registrar sus aplicaciones');

assert.match(emitir, /impacto\s*==\s*"C"\s*\?\s*"NC_EMITIR"/,
    'CI debe usar el permiso de emisión de crédito');
assert.match(emitir, /(?:impacto\s*==\s*"C"|notaCreditoCorriente\s*\|\|\s*cancelatorioProforma)\s*\?\s*null\s*:\s*request\.FechaVencimiento/,
    'el crédito corriente configurable no lleva vencimiento');

console.log('OK: créditos internos directos según impacto configurado');
