const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'static', 'js', 'sidebar-loader.js'),
    'utf8'
);

const inicio = fuente.indexOf("var API_PERM = 'http://localhost:50222/api';");
const fin = fuente.indexOf('\nfunction applySidebar(', inicio);

assert.notStrictEqual(inicio, -1, 'debe existir la configuración de permisos del menú');
assert.notStrictEqual(fin, -1, 'debe poder ejecutarse el flujo de permisos del menú');

async function obtenerPantallasPermitidas(menus) {
    let pantallas = null;
    const sandbox = {
        window: {
            location: { pathname: '/index.html', replace: function () {} }
        },
        document: { getElementById: function () { return null; } },
        localStorage: { getItem: function (clave) { return clave === 'username' ? 'operador' : ''; } },
        fetch: function () {
            return Promise.resolve({
                ok: true,
                json: function () { return Promise.resolve({ Rol: 'operador', Menus: menus }); }
            });
        },
        encodeURIComponent: encodeURIComponent,
        Promise: Promise,
        Array: Array,
        Object: Object,
        String: String,
        Error: Error
    };

    vm.runInNewContext(fuente.slice(inicio, fin), sandbox, { filename: 'sidebar-loader.js' });
    sandbox.filtrarSidebarPermisos = function (permitidas) { pantallas = permitidas; };
    sandbox.guardaAccesoPagina = function () {};
    sandbox.aplicarPermisos();
    await new Promise(function (resolver) { setImmediate(resolver); });
    return pantallas;
}

(async function () {
    const soloViajes = await obtenerPantallasPermitidas(['Gestión de viajes']);
    assert.ok(!soloViajes.includes('presupuestos.html'),
        'Gestionar viajes no debe conceder acceso a Presupuestos');

    const soloPresupuestos = await obtenerPantallasPermitidas(['Presupuestos']);
    assert.ok(soloPresupuestos.includes('presupuestos.html'),
        'el permiso Presupuestos debe conceder acceso a su pantalla');

    console.log('OK: Presupuestos requiere un permiso independiente de Viajes');
})().catch(function (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
});
