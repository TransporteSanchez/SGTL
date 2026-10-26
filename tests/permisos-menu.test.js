const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function leer(archivo) {
    return fs.readFileSync(path.join(__dirname, '..', archivo), 'utf8');
}

// Los permisos se ven con el texto de su opción del menú (§3.1), no con el nombre guardado en la base.
const sandbox = { String: String };
sandbox.window = sandbox;
vm.runInNewContext(leer('assets/static/js/permisos-menu.js'), sandbox, { filename: 'permisos-menu.js' });
const SGTLPermisos = sandbox.SGTLPermisos;

assert.strictEqual(SGTLPermisos.texto('Listado de choferes'), 'Listar choferes');
assert.strictEqual(SGTLPermisos.texto('Gestión de choferes'), 'Gestionar choferes');
assert.strictEqual(SGTLPermisos.texto('Gestion de choferes'), 'Gestionar choferes', 'con o sin tilde');
assert.strictEqual(SGTLPermisos.texto('Auditoria'), 'Auditoría');
assert.strictEqual(SGTLPermisos.texto('Cuenta Corriente'), 'Gestionar cuenta corriente');
assert.strictEqual(SGTLPermisos.texto('Presupuestos'), 'Gestionar presupuestos');
assert.strictEqual(SGTLPermisos.texto('Integración WhatsApp'), 'Gestionar integración de WhatsApp');
assert.strictEqual(SGTLPermisos.texto('Permiso viejo'), 'Permiso viejo',
    'un permiso que no está en el menú se ve con su nombre');
assert.deepStrictEqual(
    Array.from(['Permiso viejo', 'Presupuestos', 'Listado de viajes', 'Gestión de viajes', 'Dashboard'].sort(SGTLPermisos.comparar)),
    ['Dashboard', 'Listado de viajes', 'Gestión de viajes', 'Presupuestos', 'Permiso viejo'],
    'se ordenan como el menú y los que no están en el menú van al final');

// Cada permiso del catálogo de la API tiene su texto, y los textos son los del menú lateral, en el mismo orden.
const controlador = leer('WebApi_TransporteSanchez/Controllers/GruposController.cs');
const bloqueCatalogo = controlador.slice(controlador.indexOf('CatalogoMenuPermisos ='),
    controlador.indexOf('};', controlador.indexOf('CatalogoMenuPermisos =')));
const catalogo = (bloqueCatalogo.replace(/\/\/.*$/gm, '').match(/"[^"]+"/g) || []).map(function (nombre) { return nombre.slice(1, -1); });
assert.ok(catalogo.length >= 20, 'debe poder leerse el catálogo de permisos de la API');
catalogo.forEach(function (nombre) {
    assert.notStrictEqual(SGTLPermisos.posicion(nombre), -1,
        `el permiso "${nombre}" del catálogo debe tener su texto del menú en permisos-menu.js`);
});
const menuLateral = leer('assets/static/js/sidebar-loader.js');
let posicionAnterior = -1;
catalogo.slice().sort(SGTLPermisos.comparar).forEach(function (nombre) {
    const texto = SGTLPermisos.texto(nombre);
    const posicion = menuLateral.indexOf('>' + texto + '<');
    assert.notStrictEqual(posicion, -1, `"${texto}" debe ser una opción del menú lateral`);
    assert.ok(posicion > posicionAnterior, `"${texto}" debe ir en el mismo orden que en el menú lateral`);
    posicionAnterior = posicion;
});

// Las dos pantallas que muestran permisos cargan el archivo compartido.
['gestion-gruposypermisos.html', 'listado-usuarios.html'].forEach(function (pagina) {
    const html = leer(pagina);
    const archivo = html.indexOf('assets/static/js/permisos-menu.js');
    assert.ok(archivo !== -1, pagina + ' tiene que cargar permisos-menu.js');
    assert.ok(archivo < html.indexOf('<!-- Carga de diseño y roles -->'), pagina + ' tiene que cargarlo antes de su código');
});

// Listar usuarios → Ver detalle: las pantallas de cada grupo con el texto del menú y en su orden.
const usuarios = leer('listado-usuarios.html');
const inicio = usuarios.indexOf('function bloqueGrupo(');
const fin = usuarios.indexOf('\n        function verDetalleUsuario(', inicio);
assert.ok(inicio !== -1 && fin !== -1, 'debe existir bloqueGrupo en Listar usuarios');
sandbox.SGTL = { escapar: function (texto) { return String(texto); } };
vm.runInNewContext(usuarios.slice(inicio, fin), sandbox, { filename: 'listado-usuarios.html' });
const bloque = sandbox.bloqueGrupo({
    Grupo_Nombre: 'Operaciones',
    // Como los manda la API: con el nombre de la base, por orden alfabético.
    Menus: ['Dashboard', 'Gestión de viajes', 'Listado de clientes', 'Listado de viajes', 'Presupuestos']
});
const textos = (bloque.match(/<li>[^<]*<\/li>/g) || []).map(function (li) { return li.slice(4, -5); });
assert.deepStrictEqual(textos, ['Dashboard', 'Listar clientes', 'Listar viajes', 'Gestionar viajes', 'Gestionar presupuestos'],
    'Ver detalle del usuario muestra las pantallas con el texto del menú y en su orden');

console.log('OK: los permisos se ven con los textos del menú en Grupos y permisos y en Ver detalle del usuario');
