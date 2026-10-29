// Tableros (24/10): el catálogo que comparten el dashboard y la pantalla Tableros, y lo que necesita la pantalla nueva
// (menú, permiso, controller y script de la base).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const leer = function (archivo) { return fs.readFileSync(path.join(raiz, archivo), 'utf8'); };

const sandbox = { String: String, Object: Object, JSON: JSON, localStorage: { getItem: function () { return null; } } };
sandbox.window = sandbox;
vm.runInNewContext(leer('assets/static/js/tableros-catalogo.js'), sandbox, { filename: 'tableros-catalogo.js' });
const T = sandbox.SGTLTableros;

// Cada tablero: clave única (es lo que se guarda en la base), con tema, título, tipo y tamaño.
const temas = T.TEMAS.map(function (t) { return t.id; });
const claves = new Set();
const formatoClave = /^[a-z0-9-]{1,40}$/;   // el mismo que valida TablerosController
T.CATALOGO.forEach(function (t) {
    assert.ok(!claves.has(t.id), 'el tablero "' + t.id + '" está repetido en el catálogo');
    claves.add(t.id);
    assert.ok(formatoClave.test(t.id), 'la clave "' + t.id + '" no la acepta la API');
    assert.ok(temas.indexOf(t.tema) !== -1, '"' + t.id + '" tiene un tema que no existe: ' + t.tema);
    assert.ok(t.titulo && /^[A-ZÁÉÍÓÚÑ]/.test(t.titulo) && !/\.$/.test(t.titulo), '"' + t.id + '": título con mayúscula al principio y sin punto');
    assert.ok(['kpi', 'grafico', 'lista', 'natural'].indexOf(t.tipo) !== -1, '"' + t.id + '": tipo desconocido');
    assert.ok(t.w >= 1 && t.w <= 12 && t.h >= t.minH, '"' + t.id + '": tamaño en la grilla inválido');
});
temas.forEach(function (tema) {
    assert.ok(T.CATALOGO.some(function (t) { return t.tema === tema; }), 'el tema "' + tema + '" no tiene tableros');
});

// El diseño por defecto (quien todavía no eligió) usa solo tableros del catálogo, sin repetir y dentro de la grilla.
const enDefecto = new Set();
T.DISENO_POR_DEFECTO.forEach(function (it) {
    assert.ok(claves.has(it.id), 'el diseño por defecto usa "' + it.id + '", que no está en el catálogo');
    assert.ok(!enDefecto.has(it.id), '"' + it.id + '" está dos veces en el diseño por defecto');
    enDefecto.add(it.id);
    assert.ok(it.x >= 0 && it.x + it.w <= 12, '"' + it.id + '" se sale de las 12 columnas');
});

// Los gráficos de tres datos pedidos por Rocío (24/10, en dos tandas) están en el catálogo.
['kmcamionmes', 'clientesmes', 'facturacionmes', 'deudavencida', 'ingresoscamionmes', 'recorridos', 'rechazos', 'deudaantiguedad'].forEach(function (id) {
    assert.ok(claves.has(id), 'falta el tablero "' + id + '"');
});

// Cada id que busca dashboard.js existe en alguna tarjeta del catálogo o en las dos pantallas.
const tarjetas = T.CATALOGO.map(function (t) { return t.cuerpo + ' id="' + (t.tituloId || '') + '"' + (t.alcance && t.alcance.id ? ' id="' + t.alcance.id + '"' : ''); }).join('\n');
const tablero = leer('assets/static/js/dashboard.js');
const buscados = new Set();
const patron = /(?:\bel|\bhay|\bponer|\bponerHtml|getElementById)\(\s*'([A-Za-z][\w-]*)'/g;
let m;
while ((m = patron.exec(tablero))) buscados.add(m[1]);
['index.html', 'tableros.html'].forEach(function (pantalla) {
    const html = leer(pantalla);
    const faltan = Array.from(buscados).filter(function (id) {
        return tarjetas.indexOf('id="' + id + '"') === -1 && html.indexOf('id="' + id + '"') === -1;
    });
    assert.deepStrictEqual(faltan, [], 'dashboard.js busca ids que no están en el catálogo ni en ' + pantalla + ': ' + faltan.join(', '));
    assert.ok(html.indexOf('assets/static/js/tableros-catalogo.js') < html.indexOf('assets/static/js/dashboard.js'),
        pantalla + ' tiene que cargar tableros-catalogo.js antes que dashboard.js');
    assert.ok(html.indexOf('assets/static/css/tableros.css') !== -1, pantalla + ' tiene que cargar tableros.css');
});

// Pantalla nueva: en el menú debajo de Dashboard, con su permiso de grupo, y la API con su controller y su script.
const menu = leer('assets/static/js/sidebar-loader.js');
assert.ok(menu.indexOf('href="tableros.html"') > menu.indexOf('href="index.html"'), 'Tableros va en el menú debajo de Dashboard');
['viajes', 'flota', 'choferes', 'facturacion'].forEach(tema => {
    assert.ok(menu.includes("'tableros de " + tema + "': 'tableros.html'"), 'falta el acceso por sección en MENU_TO_PAGE');
});
const grupos = leer('WebApi_TransporteSanchez/Controllers/GruposController.cs');
assert.ok(grupos.includes('"Tableros de viajes", "Tableros de flota", "Tableros de choferes", "Tableros de facturación"'),
    'el catálogo debe contener las cuatro secciones de Tableros');
assert.ok(/\{ "tableros de viajes", "Tableros" \}/.test(grupos), 'las secciones deben agruparse en su tarjeta Tableros');
assert.ok(leer('WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj').indexOf('Controllers\\TablerosController.cs') !== -1,
    'TablerosController.cs tiene que estar en el .csproj (si no, la API no lo compila)');
const controlador = leer('WebApi_TransporteSanchez/Controllers/TablerosController.cs');
assert.ok(controlador.indexOf('@"^[a-z0-9-]{1,40}$"') !== -1, 'la API valida las claves con el mismo formato que esta prueba');
assert.ok(controlador.indexOf('Request.Headers.Authorization') !== -1, 'el usuario sale del token, no de un parámetro');
// La antigüedad de la deuda sale de los tramos que devuelve api/tableros/deuda.
['Vencida1a30', 'Vencida31a60', 'Vencida61a90', 'VencidaMas90'].forEach(function (campo) {
    assert.ok(controlador.indexOf(campo) !== -1, 'api/tableros/deuda tiene que devolver ' + campo);
    assert.ok(tablero.indexOf("'" + campo + "'") !== -1, 'dashboard.js tiene que mostrar ' + campo);
});
const script = leer('database/tableros/01_crear_tableros_favoritos.sql');
['TABLEROS_USUARIO', 'TABLEROS_FAVORITOS', "N'Tableros'"].forEach(function (texto) {
    assert.ok(script.indexOf(texto) !== -1, 'el script de la base tiene que crear ' + texto);
});

console.log('OK: los tableros comparten el catálogo y la pantalla Tableros tiene menú, permiso, API y script');
