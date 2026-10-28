const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'gestion-gruposypermisos.html'), 'utf8');
const inicio = fuente.indexOf('let usuariosGrupoCache');
const fin = fuente.indexOf('\n        $(function () {', inicio);
assert.ok(inicio >= 0 && fin > inicio, 'debe poder ejecutarse la lógica de asignación');

const usuarios = [
    { Usuario_ID: 1, Nombre_Usuario: 'mruiz', NombreCompleto: 'María Ruiz', Rol: 'user', EsAdministrador: false, Asignado: true, PuedeQuitar: true },
    { Usuario_ID: 2, Nombre_Usuario: 'lsoto', NombreCompleto: 'Lucas Soto', Rol: 'user', EsAdministrador: false, Asignado: false, PuedeQuitar: false },
    { Usuario_ID: 3, Nombre_Usuario: 'amolina', NombreCompleto: 'Ana Molina', Rol: 'user', EsAdministrador: false, Asignado: false, PuedeQuitar: false },
    { Usuario_ID: 4, Nombre_Usuario: 'admin', NombreCompleto: 'Administrador', Rol: 'admin', EsAdministrador: true, Asignado: false, PuedeQuitar: false },
    { Usuario_ID: 5, Nombre_Usuario: 'jlopez', NombreCompleto: 'Juan López', Rol: 'user', EsAdministrador: false, Asignado: true, PuedeQuitar: false }
];

const selector = {
    html() { return this; },
    text() { return this; },
    prop() { return this; },
    addClass() { return this; },
    removeClass() { return this; },
    val() { return ''; }
};
const valores = { '#selectGrupoUsuarios': '1', '#buscarDisponiblesGrupo': '', '#buscarAsignadosGrupo': '' };
const contexto = vm.createContext({
    $: (id) => Object.assign({}, selector, {
        val: function (valor) {
            if (arguments.length) { valores[id] = valor; return this; }
            return valores[id] || '';
        }
    }),
    SGTL: { escapar: String },
    API: 'http://localhost:50222/api',
    localStorage: { getItem: () => 'token-de-prueba' }
});
vm.runInContext(fuente.slice(inicio, fin), contexto, { filename: 'gestion-gruposypermisos.html' });
vm.runInContext(`
    usuariosGrupoCache = ${JSON.stringify(usuarios)};
    usuariosGrupoOriginalIds = new Set([1, 5]);
    usuariosGrupoEdicionIds = new Set([1, 5]);
    grupoUsuariosCargadoId = '1';
    busquedasUsuariosGrupo = { disponibles: '', asignados: '' };
`, contexto);

function ejecutar(codigo) {
    return JSON.parse(vm.runInContext('JSON.stringify(' + codigo + ')', contexto));
}

assert.deepStrictEqual(
    ejecutar("usuariosVisiblesGrupo('disponibles').map(u => u.Usuario_ID)"),
    [2, 3],
    'los disponibles excluyen a asignados y administradores'
);
assert.deepStrictEqual(
    ejecutar("usuariosVisiblesGrupo('asignados').map(u => u.Usuario_ID)"),
    [1, 5],
    'la lista de asignados muestra solo integrantes del grupo'
);

vm.runInContext("busquedasUsuariosGrupo.disponibles = 'lucas'", contexto);
valores['#buscarDisponiblesGrupo'] = 'lucas';
assert.deepStrictEqual(
    ejecutar("usuariosVisiblesGrupo('disponibles').map(u => u.Usuario_ID)"),
    [2],
    'la búsqueda de disponibles limita únicamente esa lista'
);
vm.runInContext("moverUsuariosVisiblesGrupo('agregar')", contexto);
assert.deepStrictEqual(
    ejecutar('Array.from(usuariosGrupoEdicionIds).sort((a, b) => a - b)'),
    [1, 2, 5],
    'agregar todos los visibles no incorpora usuarios ocultos por el filtro'
);

vm.runInContext("busquedasUsuariosGrupo.asignados = 'maria'", contexto);
valores['#buscarAsignadosGrupo'] = 'maria';
assert.deepStrictEqual(
    ejecutar("usuariosVisiblesGrupo('asignados').map(u => u.Usuario_ID)"),
    [1],
    'la búsqueda de asignados ignora tildes y no cambia la de disponibles'
);
vm.runInContext("moverUsuariosVisiblesGrupo('quitar')", contexto);
assert.deepStrictEqual(
    ejecutar('cambiosUsuariosGrupo()'),
    { AgregarIds: [2], QuitarIds: [1] },
    'el guardado prepara solo las altas y bajas pendientes'
);

vm.runInContext('cambiarAsignacionUsuarioGrupo(5, false)', contexto);
assert.deepStrictEqual(
    ejecutar('Array.from(usuariosGrupoEdicionIds).sort((a, b) => a - b)'),
    [2, 5],
    'no se puede quitar al usuario de su único grupo'
);
vm.runInContext('cambiarAsignacionUsuarioGrupo(2, false)', contexto);
assert.deepStrictEqual(
    ejecutar('cambiosUsuariosGrupo()'),
    { AgregarIds: [], QuitarIds: [1] },
    'un alta pendiente se puede deshacer antes de guardar'
);

vm.runInContext("usuariosGrupoEdicionIds = new Set([1, 5]); busquedasUsuariosGrupo = { disponibles: '', asignados: '' }", contexto);
valores['#buscarDisponiblesGrupo'] = 'lucas';
vm.runInContext("moverUsuariosVisiblesGrupo('agregar')", contexto);
assert.deepStrictEqual(
    ejecutar('Array.from(usuariosGrupoEdicionIds).sort((a, b) => a - b)'),
    [1, 2, 5],
    'el lote aplica lo escrito en el buscador aunque todavía no se haya pulsado Buscar'
);

async function probarGuardado() {
    vm.runInContext('cambiarAsignacionUsuarioGrupo(1, false)', contexto);
    let solicitudGuardado = null;
    contexto.SGTL.procesando = () => () => {};
    contexto.SGTL.toastExito = () => {};
    contexto.SGTL.ajax = (opciones) => {
        if (opciones.type === 'POST') {
            solicitudGuardado = opciones;
            return Promise.resolve({ UsuariosAgregados: 1, UsuariosQuitados: 1 });
        }
        return Promise.resolve(usuarios.map(usuario => Object.assign({}, usuario, {
            Asignado: usuario.Usuario_ID === 2 || usuario.Usuario_ID === 5
        })));
    };
    await vm.runInContext('guardarUsuariosDeGrupo()', contexto);
    assert.strictEqual(solicitudGuardado.url, 'http://localhost:50222/api/Grupos/1/Usuarios/Cambios');
    assert.deepStrictEqual(JSON.parse(solicitudGuardado.data), { AgregarIds: [2], QuitarIds: [1] },
        'guardar envía solo los movimientos pendientes');
    assert.strictEqual(solicitudGuardado.headers.Authorization, 'Bearer token-de-prueba',
        'el guardado acredita la sesión');
    assert.deepStrictEqual(ejecutar('cambiosUsuariosGrupo()'), { AgregarIds: [], QuitarIds: [] },
        'tras guardar se recarga la asignación real y se limpian los cambios');
}

// El chofer no tiene grupos (Rocío, 28/10): con su rol ve solo Hojas de ruta. No se ofrece para agregar ni entra con
// "Agregar todos"; si quedó en el grupo desde antes del rol Chofer, se ve entre los asignados y se puede quitar.
async function probarChofer() {
    const conChoferes = usuarios.concat([
        { Usuario_ID: 6, Nombre_Usuario: 'rjuarez', NombreCompleto: 'Raúl Juárez', Rol: 'chofer', EsAdministrador: false, EsChofer: true, Asignado: false, PuedeQuitar: false },
        { Usuario_ID: 7, Nombre_Usuario: 'gferreyra', NombreCompleto: 'Gustavo Ferreyra', Rol: 'chofer', EsAdministrador: false, EsChofer: true, Asignado: true, PuedeQuitar: true }
    ]);
    contexto.SGTL.ajax = () => Promise.resolve(conChoferes.map(usuario => Object.assign({}, usuario)));
    valores['#buscarDisponiblesGrupo'] = '';
    valores['#buscarAsignadosGrupo'] = '';
    await vm.runInContext("cargarUsuariosDeGrupo('1')", contexto);
    assert.deepStrictEqual(ejecutar('usuariosGrupoCache.map(u => u.Usuario_ID)'), [1, 2, 3, 5, 7],
        'al cargar quedan afuera los administradores y los choferes que no están en el grupo');
    assert.deepStrictEqual(ejecutar("usuariosVisiblesGrupo('disponibles').map(u => u.Usuario_ID)"), [2, 3],
        'el chofer no se ofrece para agregar');
    assert.deepStrictEqual(ejecutar("usuariosVisiblesGrupo('asignados').map(u => u.Usuario_ID)"), [1, 5, 7],
        'el chofer que quedó en el grupo se ve para quitarlo');

    vm.runInContext(`usuariosGrupoCache = ${JSON.stringify(conChoferes)};`, contexto);
    assert.strictEqual(ejecutar('cambiarAsignacionUsuarioGrupo(6, true)'), false, 'un chofer no se agrega aunque llegue a la lista');
    vm.runInContext("moverUsuariosVisiblesGrupo('agregar')", contexto);
    assert.ok(!ejecutar('usuariosGrupoEdicionIds.has(6)'), '"Agregar todos" no incorpora al chofer');
    vm.runInContext('cambiarAsignacionUsuarioGrupo(7, false)', contexto);
    assert.deepStrictEqual(ejecutar('cambiosUsuariosGrupo()'), { AgregarIds: [2, 3], QuitarIds: [7] },
        'el chofer de antes se puede quitar');
    assert.ok(!ejecutar("usuariosVisiblesGrupo('disponibles').map(u => u.Usuario_ID)").includes(7),
        'y al quitarlo no pasa a disponibles');
    assert.strictEqual(ejecutar('cambiarAsignacionUsuarioGrupo(7, true)'), true, 'Deshacer lo puede volver a dejar como estaba');

    const api = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'GruposController.cs'), 'utf8');
    assert.ok(/if \(usuariosAgregar\.Any\(u => EsChofer\(u\.Rol\)\)\)/.test(api) &&
        /"No se puede agregar un chofer al grupo: con su rol ve solo Hojas de ruta\."/.test(api) &&
        /\.Where\(u => !EsAdministrador\(u\.Rol\) && !EsChofer\(u\.Rol\)\)/.test(api) && /EsChofer = EsChofer\(u\.Rol\),/.test(api),
        'la API rechaza al chofer en los dos guardados y lo marca en la lista');
}

probarGuardado().then(probarChofer).then(() => {
    console.log('OK: usuarios por grupo mueve y guarda solo los usuarios visibles elegidos');
}).catch(error => {
    console.error(error);
    process.exitCode = 1;
});
