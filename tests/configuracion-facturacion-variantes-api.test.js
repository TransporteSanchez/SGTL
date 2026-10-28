const assert = require('assert');
const fs = require('fs');
const path = require('path');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'FacturacionConfiguracionController.cs'), 'utf8');

function bloque(desde, hasta) {
    const inicio = fuente.indexOf(desde);
    assert.ok(inicio >= 0, 'Falta ' + desde);
    const fin = hasta ? fuente.indexOf(hasta, inicio + desde.length) : fuente.length;
    assert.ok(fin > inicio, 'Falta el cierre de ' + desde);
    return fuente.slice(inicio, fin);
}

const obtener = bloque('public static ConfiguracionEmisionComprobante Obtener(', 'public static void ValidarDatos(');
assert.match(obtener, /string tipo,\s*string letra\s*=\s*null/, 'la configuración de emisión se busca por tipo y letra');
assert.match(obtener, /c\.LetraPredeterminada\s*=\s*@letra/, 'la letra solicitada selecciona su variante');

const validar = bloque('public static void ValidarDatos(', 'public static int SiguienteNumero(');
assert.match(validar, /letra\s*!=\s*configuracion\.LetraPredeterminada/, 'no se puede emitir con otra letra que la configurada');

const listar = bloque('public IHttpActionResult Tipos()', '[HttpPost, Route("tipos-comprobante")]');
assert.match(listar, /FactTipo_ID/, 'la lista identifica cada variante');
assert.match(listar, /comprobante\.Letra\s*=\s*c\.LetraPredeterminada/, 'la relación de un comprobante se comprueba por tipo y letra');

const crear = bloque('public IHttpActionResult CrearTipo(', '[HttpPut, Route(');
assert.match(crear, /WHERE Tipo=@tipo AND LetraPredeterminada=@letra/, 'se impide solo el mismo par código y letra');
assert.match(crear, /Ya existe un tipo de comprobante con esa sigla y letra/, 'el rechazo de un par repetido explica el conflicto');
assert.match(crear, /INSERT dbo\.TIPOS_COMPROBANTE/, 'el código nuevo se agrega al catálogo');
assert.match(crear, /INSERT dbo\.FACTURACION_TIPOS_COMPROBANTE/, 'la variante se agrega a la configuración');
const auditoriaAlta = crear.indexOf('Auditar(c, u, "ALTA"');
const confirmacionAlta = crear.indexOf('tx.Commit()');
assert.ok(auditoriaAlta >= 0 && auditoriaAlta < confirmacionAlta,
    'el alta y su auditoría se confirman en la misma transacción');
assert.match(crear.slice(auditoriaAlta, confirmacionAlta), /Auditar\(c, u, "ALTA",[\s\S]*?, tx\)/,
    'la auditoría del alta participa de la transacción');

assert.match(fuente, /Route\("tipos-comprobante\/\{id:int\}"\)/, 'edición y eliminación identifican la variante por ID');
assert.match(fuente, /Route\("tipos-comprobante\/\{id:int\}\/estado"\)/, 'el estado identifica la variante por ID');

const emision = bloque('public IHttpActionResult Emision(');
assert.match(emision, /Configuraciones\s*=/, 'emisión entrega configuración por letra');
assert.match(emision, /Letras\s*=/, 'emisión entrega únicamente las letras disponibles');

console.log('OK: variantes de tipos de comprobante en la API');
