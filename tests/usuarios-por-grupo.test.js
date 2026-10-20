const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(
    path.join(__dirname, '..', 'gestion-gruposypermisos.html'),
    'utf8'
);

const inicio = fuente.indexOf('function cargarUsuariosDeGrupo(');
const fin = fuente.indexOf('\n        $(document).ready', inicio);

assert.notStrictEqual(inicio, -1, 'debe existir la carga de usuarios por grupo');
assert.notStrictEqual(fin, -1, 'debe poder ejecutarse el bloque de usuarios sin cargar la página completa');

const usuarios = [
    { Usuario_ID: 1, Nombre_Usuario: 'mruiz', NombreCompleto: 'María Ruiz', Rol: 'operador', EsAdministrador: false, Asignado: true },
    { Usuario_ID: 2, Nombre_Usuario: 'lsoto', NombreCompleto: 'Lucas Soto', Rol: 'operador', EsAdministrador: false, Asignado: false },
    { Usuario_ID: 3, Nombre_Usuario: 'admin', NombreCompleto: 'Administrador General', Rol: 'admin', EsAdministrador: true, Asignado: false }
];

let htmlRenderizado = '';
let solicitudGuardado = null;
let mensajeModal = '';
let modalMostrado = false;
function crearJQueryDePrueba(selector) {
    const coleccion = {
        prop: function () { return coleccion; },
        val: function () { return '1'; },
        empty: function () {
            if (selector === '#contenedorUsuariosGrupo') htmlRenderizado = '';
            return coleccion;
        },
        html: function (contenido) {
            if (arguments.length && selector === '#contenedorUsuariosGrupo') htmlRenderizado = contenido;
            return coleccion;
        },
        off: function () { return coleccion; },
        on: function () { return coleccion; },
        text: function (contenido) {
            if (arguments.length && selector === '#mensajeUsuariosGrupoGuardados') mensajeModal = contenido;
            return coleccion;
        },
        modal: function (accion) {
            if (selector === '#modalUsuariosGrupoGuardados' && accion === 'show') modalMostrado = true;
            return coleccion;
        }
    };
    return coleccion;
}

crearJQueryDePrueba.ajax = function (opciones) {
    if (opciones.type === 'POST') {
        solicitudGuardado = opciones;
        opciones.success();
        return;
    }
    opciones.success(usuarios);
};

const sandbox = {
    $: crearJQueryDePrueba,
    API_BASE: 'http://localhost:50222/api',
    escapeHtml: function (texto) { return String(texto); },
    String: String,
    Array: Array,
    Object: Object,
    Set: Set,
    usuariosGrupoCache: [],
    usuariosSeleccionadosGrupo: new Set(),
    grupoUsuariosCargadoId: null,
    showToast: function () {}
};

vm.runInNewContext(fuente.slice(inicio, fin), sandbox, { filename: 'gestion-gruposypermisos.html' });
sandbox.cargarUsuariosDeGrupo(1);

assert.deepStrictEqual(Array.from(sandbox.usuariosSeleccionadosGrupo), [],
    'los integrantes actuales no deben quedar seleccionados para volver a enviarse');

const htmlUsuarioAsignado = sandbox.crearHtmlListaUsuariosGrupo([usuarios[0]]);
assert.ok(htmlUsuarioAsignado.includes('Asignado'),
    'un integrante actual debe identificarse como asignado');
assert.ok(!htmlUsuarioAsignado.includes('id="usr_1"'),
    'un integrante actual no debe ofrecer un check para volver a agregarlo');

const htmlUsuarioParaAgregar = sandbox.crearHtmlListaUsuariosGrupo([usuarios[1]]);
assert.ok(htmlUsuarioParaAgregar.includes('lista-usuarios-item'),
    'cada registro debe usar una fila que mantiene el check dentro del área con scroll');
assert.ok(htmlUsuarioParaAgregar.includes('id="usr_2"'),
    'un usuario no asignado debe conservar su check de incorporación');

const htmlUsuarioAdministrador = sandbox.crearHtmlListaUsuariosGrupo([usuarios[2]]);
assert.ok(htmlUsuarioAdministrador.includes('admin</span><span class="texto-rol-admin"> - Acceso total por rol; no requiere grupo.</span>'),
    'la aclaración del administrador debe mostrarse junto a su etiqueta de rol');
assert.ok(!htmlUsuarioAdministrador.includes('<small class="d-block text-muted">'),
    'la aclaración del administrador no debe crear una segunda línea');

assert.ok(htmlRenderizado.includes('txtBuscarUsuarioGrupo'),
    'la lista de usuarios debe tener un buscador predictivo');
assert.ok(htmlRenderizado.includes('lista-usuarios-grupo'),
    'la lista de usuarios debe estar contenida en un área con scroll');

assert.strictEqual(typeof sandbox.filtrarUsuariosGrupo, 'function',
    'la pantalla debe filtrar usuarios por lo que se escribe');
const coincidenciaPorNombre = sandbox.filtrarUsuariosGrupo(usuarios, 'maria');
assert.deepStrictEqual(Array.from(coincidenciaPorNombre, function (usuario) { return usuario.Usuario_ID; }), [1],
    'la búsqueda debe ignorar mayúsculas y tildes en el nombre');
const coincidenciaPorUsuario = sandbox.filtrarUsuariosGrupo(usuarios, 'lsoto');
assert.deepStrictEqual(Array.from(coincidenciaPorUsuario, function (usuario) { return usuario.Usuario_ID; }), [2],
    'la búsqueda debe encontrar coincidencias por nombre de usuario');

assert.strictEqual(typeof sandbox.actualizarSeleccionUsuariosGrupo, 'function',
    'la selección debe mantenerse separada de los usuarios visibles');
const seleccionInicial = new Set([2]);
const seleccionLuegoDeFiltrar = sandbox.actualizarSeleccionUsuariosGrupo(seleccionInicial, 2, true);
assert.deepStrictEqual(Array.from(seleccionLuegoDeFiltrar).sort(function (a, b) { return a - b; }), [2],
    'seleccionar un usuario filtrado no debe quitar los seleccionados que ya no se ven');

sandbox.usuariosSeleccionadosGrupo = seleccionLuegoDeFiltrar;
sandbox.grupoUsuariosCargadoId = '1';
sandbox.guardarUsuariosDeGrupo();
assert.deepStrictEqual(Array.from(sandbox.usuariosSeleccionadosGrupo), [],
    'al confirmar las incorporaciones se debe limpiar la selección pendiente');
assert.strictEqual(sandbox.usuariosGrupoCache[1].Asignado, true,
    'al confirmar las incorporaciones el usuario debe pasar a mostrarse como asignado');
assert.strictEqual(modalMostrado, true,
    'al confirmar las incorporaciones se debe mostrar una confirmación modal');
assert.ok(mensajeModal.includes('1 usuario'),
    'la confirmación debe informar cuántos usuarios se agregaron');
assert.deepStrictEqual(JSON.parse(solicitudGuardado.data).UsuarioIds.sort(function (a, b) { return a - b; }), [2],
    'al guardar se deben enviar también los usuarios que quedaron fuera de la búsqueda');

console.log('OK: la búsqueda de usuarios conserva las selecciones del grupo');
