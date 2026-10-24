// Hoja de ruta del chofer (24/10): lo que ve y puede hacer el chofer, que la API saque el chofer del token y que el
// login vuelva solo a una pantalla del sistema.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const leer = function (archivo) { return fs.readFileSync(path.join(raiz, archivo), 'utf8'); };

// ---------------------------------------------------------------- Pantalla (assets/static/js/hoja-de-ruta.js)

const sandbox = { String: String, Number: Number, Math: Math, Date: Date, Promise: Promise, document: {} };
sandbox.window = sandbox;
vm.runInNewContext(leer('assets/static/js/hoja-de-ruta.js'), sandbox, { filename: 'hoja-de-ruta.js' });
const H = sandbox.SGTLHojaDeRuta;

assert.strictEqual(H.tituloDia('2026-10-24T06:00:00', '2026-10-24T00:00:00'), 'Hoy · sábado 24/10/2026');
assert.strictEqual(H.tituloDia('2026-10-25T06:00:00', '2026-10-24T00:00:00'), 'Mañana · domingo 25/10/2026');
assert.strictEqual(H.tituloDia('2026-10-23T06:00:00', '2026-10-24T00:00:00'), 'Ayer · viernes 23/10/2026');
assert.strictEqual(H.tituloDia('2026-10-26T06:00:00', '2026-10-24T00:00:00'), 'Lunes 26/10/2026');

const grupos = H.agruparPorDia([
    { Viaje_ID: 1, Fecha_Inicio: '2026-10-24T06:00:00' },
    { Viaje_ID: 2, Fecha_Inicio: '2026-10-24T15:00:00' },
    { Viaje_ID: 3, Fecha_Inicio: '2026-10-25T05:00:00' }
]);
assert.strictEqual(grupos.length, 2, 'un grupo por día de inicio');
assert.strictEqual(grupos[0].viajes.length, 2);

assert.strictEqual(H.horario({ Fecha_Inicio: '2026-10-24T06:00:00', Fecha_Fin: '2026-10-24T14:30:00' }), '06:00 a 14:30');
assert.strictEqual(H.horario({ Fecha_Inicio: '2026-10-24T22:00:00', Fecha_Fin: '2026-10-25T06:15:00' }), '22:00 a 25/10/2026 06:15',
    'si termina otro día, se dice qué día');

function viaje(cambios) {
    return Object.assign({ Viaje_ID: 48, Estado: 'Registrado', Tipo_Cliente: 'Directo', Tiene_Evidencia: false, EnProforma_Estado: '', EnProforma_Numero: '' }, cambios);
}
let a = H.accionesDe(viaje({}));
assert.strictEqual(a.paso.accion, 'iniciar', 'un directo registrado se inicia');
assert.strictEqual(a.paso.motivo, '');
assert.strictEqual(a.evidencia, null, 'antes de salir no se carga evidencia');
a = H.accionesDe(viaje({ Estado: 'En_viaje' }));
assert.strictEqual(a.paso.accion, 'entregar', 'un directo en viaje registra la entrega');
a = H.accionesDe(viaje({ Estado: 'Entregado', Tiene_Evidencia: true }));
assert.strictEqual(a.paso, null);
assert.strictEqual(a.evidencia, 'reemplazar', 'entregado: puede cambiar la evidencia');
assert.ok(a.ver);
a = H.accionesDe(viaje({ Estado: 'Facturado', Tiene_Evidencia: true }));
assert.ok(a.paso === null && a.evidencia === null, 'facturado: ya no se toca');
a = H.accionesDe(viaje({ Tipo_Cliente: 'Con_plataforma' }));
assert.ok(a.paso === null && a.evidencia === 'subir', 'con plataforma: solo la evidencia');
assert.ok(/plataforma del cliente/.test(a.nota));
a = H.accionesDe(viaje({ EnProforma_Estado: 'Generada', EnProforma_Numero: 'PF-00000014' }));
assert.strictEqual(a.paso.motivo, 'No se puede iniciar el viaje: está en la proforma PF-00000014',
    'lo que no se puede hacer queda deshabilitado con el motivo (§1.4)');

assert.strictEqual(H.problemaDelArchivo({ name: 'remito.jpg', type: 'image/jpeg', size: 9 * 1024 * 1024 }), '',
    'una foto grande se achica antes de subirla');
assert.strictEqual(H.problemaDelArchivo({ name: 'remito.pdf', type: 'application/pdf', size: 6 * 1024 * 1024 }), 'El PDF no puede pesar más de 5 MB.');
assert.strictEqual(H.problemaDelArchivo({ name: 'remito.docx', type: 'application/msword', size: 1000 }), 'Tiene que ser una foto (JPG, PNG o WEBP) o un PDF.');
assert.strictEqual(H.problemaDelArchivo({ name: 'IMG_0001.HEIC', type: '', size: 2000000 }), '', 'la foto del iPhone se convierte a JPG');

// ---------------------------------------------------------------- API (HojaDeRutaController.cs)

const api = leer('WebApi_TransporteSanchez/Controllers/HojaDeRutaController.cs');
const acciones = api.split('[Http').slice(1);
assert.ok(acciones.length >= 8, 'debe poder leerse cada acción del controller');
acciones.forEach(function (accion) {
    const ruta = (/Route\("([^"]*)"\)/.exec(accion) || [])[1];
    const parametros = (/public [^(]+\(([^)]*)\)/.exec(accion) || [])[1];
    assert.ok(ruta !== undefined && parametros !== undefined, 'debe poder leerse la firma de cada acción');
    assert.ok(/ValidarSesion\(/.test(accion.slice(0, accion.indexOf('\n        }\n'))), 'cada acción valida el token: ' + ruta);
    // Las del chofer: la hoja de ruta y sus viajes. El chofer sale del token, nunca de un parámetro.
    if (ruta === '' || /^Viajes\//.test(ruta)) {
        const nombres = parametros.split(',').map(function (p) { return p.trim().split(/\s+/).pop(); });
        assert.ok(!nombres.some(function (n) { return /chofer/i.test(n); }), 'el chofer nunca llega como parámetro: ' + ruta + ' (' + parametros + ')');
    }
});
['EntregaChoferDto', 'EvidenciaChoferDto'].forEach(function (dto) {
    const cuerpo = api.slice(api.indexOf('public class ' + dto), api.indexOf('}', api.indexOf('public class ' + dto)));
    assert.ok(cuerpo.length > 20 && !/ChoferID|Chofer_ID/.test(cuerpo), dto + ' no trae el chofer: sale del token');
});
assert.ok(/WHERE v\.ChoferID = @chofer/.test(api) && /P\("@chofer", sesion\.Chofer_ID\.Value\)/.test(api),
    'la hoja de ruta filtra por el chofer de la sesión');
assert.ok(leer('WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj').includes('Controllers\\HojaDeRutaController.cs'),
    'el controller tiene que estar en el proyecto para compilarse');

// ---------------------------------------------------------------- Login: vuelve solo a una pantalla del sistema

const login = leer('Login.html');
const inicio = login.indexOf('function pantallaDeVuelta(');
const fin = login.indexOf('\n        }\n', inicio);
assert.ok(inicio !== -1 && fin !== -1, 'debe existir pantallaDeVuelta en el login');
function volverCon(busqueda) {
    const caja = { URLSearchParams: URLSearchParams, String: String, window: { location: { search: busqueda } } };
    vm.runInNewContext(login.slice(inicio, fin + 10), caja, { filename: 'Login.html' });
    return caja.pantallaDeVuelta();
}
assert.strictEqual(volverCon('?volver=' + encodeURIComponent('hoja-de-ruta.html?viaje=48')), 'hoja-de-ruta.html?viaje=48');
assert.strictEqual(volverCon('?volver=' + encodeURIComponent('https://otro.sitio/robar')), '', 'nunca otra dirección');
assert.strictEqual(volverCon('?volver=' + encodeURIComponent('//otro.sitio')), '');
assert.strictEqual(volverCon('?volver=Login.html'), '', 'no vuelve al login');
assert.strictEqual(volverCon(''), '');

// ---------------------------------------------------------------- Menú y permiso

const menu = leer('assets/static/js/sidebar-loader.js');
assert.ok(menu.includes('<a href="hoja-de-ruta.html" class="sidebar-link"><i class="bi bi-signpost-split"></i><span>Hoja de ruta</span>'),
    'Hoja de ruta es un ítem principal del menú');
assert.ok(menu.includes("'hoja de ruta': 'hoja-de-ruta.html'"), 'el permiso "Hoja de ruta" abre la pantalla');
assert.ok(menu.includes("'Login.html?volver=' + encodeURIComponent("), 'con la sesión vencida, el login sabe adónde volver');

console.log('OK: la hoja de ruta muestra y deja hacer lo que corresponde, solo con los viajes del chofer de la sesión');
