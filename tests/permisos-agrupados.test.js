const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(
    path.join(__dirname, '..', 'gestion-gruposypermisos.html'),
    'utf8'
);

const inicio = fuente.indexOf('function cargarMenusDeGrupo(');
const fin = fuente.indexOf('\n        function cargarUsuariosDeGrupo(', inicio);

assert.notStrictEqual(inicio, -1, 'debe existir la carga de permisos del grupo');
assert.notStrictEqual(fin, -1, 'debe poder ejecutarse el bloque de permisos sin cargar la página completa');

const permisos = [
    { Menu_ID: 11, Menu_Nombre: 'Listado de choferes', Menu_Principal: 'Choferes', Asignado: true },
    { Menu_ID: 12, Menu_Nombre: 'Gestión de choferes', Menu_Principal: 'Choferes', Asignado: false },
    { Menu_ID: 21, Menu_Nombre: 'Listado de camiones', Menu_Principal: 'Camiones', Asignado: false }
];

let htmlRenderizado = '';
function crearJQueryDePrueba(selector) {
    const coleccion = {
        prop: function () { return coleccion; },
        val: function () { return '1'; },
        empty: function () { htmlRenderizado = ''; return coleccion; },
        off: function () { return coleccion; },
        on: function () { return coleccion; },
        find: function () { return coleccion; },
        each: function () { return coleccion; },
        html: function (contenido) {
            if (arguments.length) htmlRenderizado = contenido;
            return coleccion;
        }
    };
    return coleccion;
}

// SGTL.ajax devuelve una promesa; acá responde en el momento para poder revisar el resultado.
function respuestaInmediata(datos) {
    return {
        then: function (alResolver) { alResolver(datos); return { finally: function (alTerminar) { alTerminar(); } }; }
    };
}

const sandbox = {
    $: crearJQueryDePrueba,
    API: 'http://localhost:50222/api',
    SGTL: {
        ajax: function () { return respuestaInmediata(permisos); },
        escapar: function (texto) { return String(texto); }
    },
    String: String,
    Array: Array,
    Object: Object,
    Set: Set
};
sandbox.window = sandbox;

// Los textos de los permisos salen del archivo compartido (lo controla tests/permisos-menu.test.js).
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'static', 'js', 'permisos-menu.js'), 'utf8'),
    sandbox, { filename: 'permisos-menu.js' });
vm.runInNewContext(fuente.slice(inicio, fin), sandbox, { filename: 'gestion-gruposypermisos.html' });
sandbox.cargarMenusDeGrupo(1);

assert.ok(htmlRenderizado.includes('chk-menu-principal'),
    'cada menú principal debe renderizar su casilla de selección');
assert.ok(htmlRenderizado.includes('Choferes'),
    'los permisos de Choferes deben mostrarse bajo ese menú principal');
assert.ok(htmlRenderizado.includes('Camiones'),
    'los permisos de Camiones deben mostrarse bajo ese menú principal');

assert.strictEqual(typeof sandbox.agruparMenusPorPrincipal, 'function',
    'la pantalla debe agrupar los permisos recibidos por menú principal');
const grupos = sandbox.agruparMenusPorPrincipal(permisos);
assert.strictEqual(grupos.length, 2, 'deben generarse dos menús principales');
assert.strictEqual(grupos[0].Nombre, 'Choferes');
assert.strictEqual(grupos[0].Permisos.length, 2);

// Los permisos se ven con el texto del menú (§3.1), no con el nombre guardado en la base, y en el orden del menú.
assert.ok(htmlRenderizado.includes('>Listar choferes<') && htmlRenderizado.includes('>Gestionar choferes<'),
    'cada permiso debe verse con el texto de su opción del menú');
assert.ok(!htmlRenderizado.includes('Listado de choferes') && !htmlRenderizado.includes('Gestión de choferes'),
    'el nombre guardado en la base no debe verse');
const ordenados = sandbox.agruparMenusPorPrincipal([
    { Menu_ID: 2, Menu_Nombre: 'Auditoria', Menu_Principal: 'General' },
    { Menu_ID: 3, Menu_Nombre: 'Permiso viejo', Menu_Principal: 'General' },
    { Menu_ID: 1, Menu_Nombre: 'Dashboard', Menu_Principal: 'General' },
    { Menu_ID: 12, Menu_Nombre: 'Gestión de choferes', Menu_Principal: 'Choferes' },
    { Menu_ID: 11, Menu_Nombre: 'Listado de choferes', Menu_Principal: 'Choferes' }
]);
assert.deepStrictEqual(Array.from(ordenados[0].Permisos, function (permiso) { return permiso.Menu_ID; }), [1, 2, 3],
    'dentro de cada tarjeta, los permisos van en el orden del menú y los que no están en el menú, al final');
assert.deepStrictEqual(Array.from(ordenados[1].Permisos, function (permiso) { return permiso.Menu_ID; }), [11, 12],
    'Listar va antes que Gestionar, como en el menú');

const conTableros = sandbox.agruparMenusPorPrincipal([
    { Menu_ID: 1, Menu_Nombre: 'Dashboard', Menu_Principal: 'General' },
    { Menu_ID: 12, Menu_Nombre: 'Gestión de choferes', Menu_Principal: 'Choferes' },
    { Menu_ID: 34, Menu_Nombre: 'Tableros de facturación', Menu_Principal: 'Tableros' },
    { Menu_ID: 33, Menu_Nombre: 'Tableros de choferes', Menu_Principal: 'Tableros' },
    { Menu_ID: 32, Menu_Nombre: 'Tableros de flota', Menu_Principal: 'Tableros' },
    { Menu_ID: 31, Menu_Nombre: 'Tableros de viajes', Menu_Principal: 'Tableros' }
]);
assert.deepStrictEqual(Array.from(conTableros, g => g.Nombre), ['General', 'Tableros', 'Choferes'],
    'Tableros debe tener su tarjeta después de General');
assert.deepStrictEqual(Array.from(conTableros[1].Permisos, p => p.Menu_ID), [31, 32, 33, 34],
    'las secciones deben aparecer en el mismo orden que las pestañas');
const tarjetaTableros = sandbox.crearHtmlPermisos([conTableros[1]]);
['Viajes', 'Flota', 'Choferes', 'Facturación'].forEach(texto => {
    assert.ok(tarjetaTableros.includes('>' + texto + '</label>'), 'falta la casilla ' + texto);
});

assert.strictEqual(typeof sandbox.obtenerEstadoMenuPrincipal, 'function',
    'la pantalla debe calcular el estado visual de cada menú principal');
const sinSeleccion = sandbox.obtenerEstadoMenuPrincipal([
    { Asignado: false }, { Asignado: false }
]);
assert.strictEqual(sinSeleccion.checked, false);
assert.strictEqual(sinSeleccion.indeterminate, false);

const seleccionParcial = sandbox.obtenerEstadoMenuPrincipal([
    { Asignado: true }, { Asignado: false }
]);
assert.strictEqual(seleccionParcial.checked, false,
    'un menú con algunos permisos seleccionados no debe verse como seleccionado completo');
assert.strictEqual(seleccionParcial.indeterminate, true,
    'un menú con algunos permisos seleccionados debe verse en estado parcial');

const seleccionCompleta = sandbox.obtenerEstadoMenuPrincipal([
    { Asignado: true }, { Asignado: true }
]);
assert.strictEqual(seleccionCompleta.checked, true);
assert.strictEqual(seleccionCompleta.indeterminate, false);

const controlPrincipal = { checked: false, indeterminate: false };
const permisosDelGrupo = [{ checked: true }, { checked: false }];
const grupoInteractivo = {};
const eventos = {};

function coleccionInteractiva(elementos) {
    return {
        find: function (selector) {
            if (elementos[0] !== grupoInteractivo) return coleccionInteractiva([]);
            if (selector === '.chk-menu') return coleccionInteractiva(permisosDelGrupo);
            if (selector === '.chk-menu-principal') return coleccionInteractiva([controlPrincipal]);
            return coleccionInteractiva([]);
        },
        each: function (accion) {
            elementos.forEach(function (elemento, indice) { accion.call(elemento, indice, elemento); });
            return this;
        },
        prop: function (nombre, valor) {
            if (arguments.length === 1) return elementos[0] && elementos[0][nombre];
            elementos.forEach(function (elemento) { elemento[nombre] = valor; });
            return this;
        },
        closest: function () { return coleccionInteractiva([grupoInteractivo]); }
    };
}

const contenedorInteractivo = {
    off: function () { return contenedorInteractivo; },
    on: function (evento, selector, accion) {
        eventos[selector] = accion;
        return contenedorInteractivo;
    }
};

sandbox.$ = function (elemento) {
    if (elemento === grupoInteractivo) return coleccionInteractiva([grupoInteractivo]);
    if (elemento === controlPrincipal || permisosDelGrupo.includes(elemento)) return coleccionInteractiva([elemento]);
    return coleccionInteractiva([]);
};

sandbox.vincularSeleccionMenusPrincipales(contenedorInteractivo);
controlPrincipal.checked = true;
eventos['.chk-menu-principal'].call(controlPrincipal);
assert.deepStrictEqual(permisosDelGrupo.map(function (permiso) { return permiso.checked; }), [true, true],
    'al seleccionar el menú principal deben seleccionarse todos sus permisos');

permisosDelGrupo[0].checked = false;
eventos['.chk-menu'].call(permisosDelGrupo[0]);
assert.strictEqual(controlPrincipal.checked, false,
    'al deseleccionar un permiso el menú principal no debe verse completo');
assert.strictEqual(controlPrincipal.indeterminate, true,
    'al deseleccionar un permiso el menú principal debe quedar en estado parcial');

console.log('OK: los permisos se agrupan con los textos del menú y reflejan selección total o parcial');
