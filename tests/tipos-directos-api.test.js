const assert = require('assert');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers');
const configuracion = fs.readFileSync(path.join(raiz, 'FacturacionConfiguracionController.cs'), 'utf8');
const comprobantes = fs.readFileSync(path.join(raiz, 'ComprobantesController.cs'), 'utf8');
const recibos = fs.readFileSync(path.join(raiz, 'RecibosController.cs'), 'utf8');
const cuenta = fs.readFileSync(path.join(raiz, 'CuentaCorrienteController.cs'), 'utf8');

function bloque(fuente, inicio, fin) {
    const desde = fuente.indexOf(inicio);
    assert.ok(desde >= 0, 'Falta ' + inicio);
    const hasta = fin ? fuente.indexOf(fin, desde + inicio.length) : fuente.length;
    assert.ok(hasta > desde, 'Falta el cierre de ' + inicio);
    return fuente.slice(desde, hasta);
}

const opciones = bloque(configuracion, 'Route("tipos-emision-directa")', 'Route("emision/{tipo}")');
assert.match(opciones, /t\.Impacto\s*=\s*'D'/, 'la lista directa debe incluir solo comprobantes que generan deuda');
assert.match(opciones, /c\.Activo\s*=\s*1/, 'la lista directa debe exigir una configuración activa');
assert.match(opciones, /n\.Activo\s*=\s*1/, 'un numerador inactivo impide ofrecer el tipo');
assert.match(opciones, /s\.Activa\s*=\s*1/, 'una sucursal inactiva impide ofrecer el tipo');
assert.match(opciones, /t\.Tipo\s*<>\s*'ND'/, 'la nota de débito conserva su formulario propio');

const emision = bloque(configuracion, 'public IHttpActionResult Emision(');
assert.match(emision, /tipo\s*=\s*CodigoTipo\(tipo\)/, 'la configuración de emisión debe admitir FC');
assert.match(emision, /FROM dbo\.FACTURACION_TIPOS_COMPROBANTE cfg[\s\S]*?WHERE cfg\.Tipo=@tipo/, 'solo se ofrecen sucursales vinculadas al tipo configurado');
const obtener = bloque(configuracion, 'public static ConfiguracionEmisionComprobante Obtener(', 'public static void ValidarDatos(');
assert.match(obtener, /n\.UltimoNumero\s*<\s*99999999/, 'no se elige una variante con numerador agotado');
assert.match(emision, /n\.UltimoNumero\s*<\s*99999999/, 'las opciones de letra y sucursal descartan numeradores agotados');
const validarDatos = bloque(configuracion, 'public static void ValidarDatos(', 'public static int SiguienteNumero(');
assert.match(validarDatos, /sucursal\s*!=\s*configuracion\.SucursalPredeterminada/, 'el guardado rechaza una sucursal distinta de la vinculada al tipo y letra');

const emitir = bloque(comprobantes, 'public IHttpActionResult Emitir(');
assert.match(emitir, /request\.Tipo\.Length\s*>\s*3/, 'el código debe respetar la longitud del catálogo');
assert.match(emitir, /request\.Tipo\.Any\(/, 'el código debe respetar los caracteres del catálogo');
assert.match(emitir, /request\.Tipo\s*==\s*"NC"\s*\?\s*"NC_EMITIR"\s*:\s*request\.Tipo\s*==\s*"ND"\s*\?\s*"ND_EMITIR"\s*:\s*"FAC_EMITIR"/, 'los tipos directos de deuda usan el permiso de emisión directa');
assert.match(emitir, /configuracion\.Impacto\s*!=\s*impacto/, 'la API impide emitir con un impacto distinto del catálogo');

assert.ok(!/deuda\.Tipo\s*!=\s*"FAC"/.test(recibos), 'el recibo admite cualquier comprobante emitido de deuda');
assert.match(cuenta, /comp\.Impacto\s*=\s*'D'/, 'el ranking de clientes incluye deuda de tipos personalizados');

const referencias = bloque(comprobantes, 'public IHttpActionResult ListarFacturasReferencia(', '[HttpGet]');
assert.match(referencias, /c\.Impacto\s*=\s*'D'/, 'un crédito corriente puede aplicarse sobre FC y otros comprobantes de deuda');
assert.match(referencias, /Numero\(\(string\)reader\["Tipo"\]/, 'la referencia conserva el código real del comprobante');

console.log('OK: emisión directa de tipos configurados en la API');
