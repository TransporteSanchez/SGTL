const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const fuente = fs.readFileSync(path.join(raiz, 'assets/static/js/configuracion-facturacion.js'), 'utf8');
const html = fs.readFileSync(path.join(raiz, 'configuracion-facturacion.html'), 'utf8');
const ids = new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g), function (match) { return match[1]; }));

const tipos = [
    { FactTipo_ID: 1, Tipo: 'D', Descripcion: 'Débito interno', Impacto: 'C', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: true, PuedeCambiarImpacto: true },
    { FactTipo_ID: 2, Tipo: 'D', Descripcion: 'Débito interno', Impacto: 'C', LetraPredeterminada: 'B', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: true, PuedeCambiarImpacto: true },
    { FactTipo_ID: 3, Tipo: 'C', Descripcion: 'Crédito interno', Impacto: 'C', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: true, PuedeCambiarImpacto: true },
    { FactTipo_ID: 4, Tipo: 'FAC', Descripcion: 'Factura', Impacto: 'D', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: false, PuedeCambiarImpacto: false },
    { FactTipo_ID: 5, Tipo: 'TMP', Descripcion: 'Tipo usado', Impacto: 'C', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: false, PuedeCambiarImpacto: false },
    { FactTipo_ID: 6, Tipo: 'OT', Descripcion: 'Tipo antiguo', Impacto: 'C', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: false }
];

function iniciarPantalla(escenario) {
    escenario = escenario || {};
    const controles = {}, eventos = {}, eventosCampos = {}, pedidos = [], errores = [];
    const datosTipos = tipos.map(function (item) { return Object.assign({}, item); });
    const document = {
        readyState: 'loading',
        getElementById: function (id) {
            if (!ids.has(id)) return null;
            if (!controles[id]) controles[id] = {
                value: '', checked: false, textContent: '',
                classList: {
                    clases: new Set(),
                    toggle: function (clase, presente) { if (presente) this.clases.add(clase); else this.clases.delete(clase); },
                    contains: function (clase) { return this.clases.has(clase); }
                },
                addEventListener: function (nombre, manejador) {
                    if (!eventosCampos[id]) eventosCampos[id] = {};
                    eventosCampos[id][nombre] = manejador;
                },
                querySelector: function () { return {}; }, focus: function () {}
            };
            if (!Object.prototype.hasOwnProperty.call(controles[id], 'innerHTML')) {
                let contenido = '';
                Object.defineProperty(controles[id], 'innerHTML', {
                    get: function () { return contenido; },
                    set: function (html) {
                        contenido = html;
                        if (id === 'tipoSucursal' || id === 'tipoNumerador') this.value = '';
                    }
                });
            }
            return controles[id];
        },
        addEventListener: function (nombre, manejador) { eventos[nombre] = manejador; }
    };
    const SGTL = {
        tabla: { cargando: function () {}, vacia: function () {}, llenar: function () {} },
        estado: function (valor) { return valor; },
        botonFila: function () { return ''; }, accionesFila: function () { return ''; },
        validador: function () { return { validarTodo: function () {} }; },
        revisarFormulario: function () { return true; }, reiniciarFormulario: function () {},
        procesando: function () { return function () {}; },
        toastExito: function () {}, toastError: function (mensaje) { errores.push(mensaje); }
    };
    vm.runInNewContext(fuente, {
        window: {}, document, SGTL,
        localStorage: { getItem: function () { return 'token-de-prueba'; } },
        fetch: function (url, opciones) {
            const metodo = opciones.method || 'GET';
            pedidos.push({ url, metodo, cuerpo: opciones.body ? JSON.parse(opciones.body) : null });
            if (escenario.emisionConcurrente && metodo === 'PUT' && url.endsWith('/tipos-comprobante/1')) {
                datosTipos.filter(function (item) { return item.Tipo === 'D'; }).forEach(function (item) { item.PuedeCambiarImpacto = false; });
                return Promise.resolve({ ok: false, status: 409, text: function () {
                    return Promise.resolve(JSON.stringify({ error: 'No se puede cambiar el impacto del tipo de comprobante: tiene comprobantes asociados.' }));
                } });
            }
            let respuesta = {};
            if (url.includes('/sucursales?')) respuesta = [{ SucursalID: 10, Codigo: '0001', Nombre: 'Administración', Activa: true, PuedeEliminar: false }];
            if (url.includes('/numeradores?')) respuesta = [{ NumeradorID: 20, Nombre: 'Numerador', UltimoNumero: 0, Activo: true, PuedeEliminar: false }];
            if (url.endsWith('/tipos-comprobante')) respuesta = datosTipos;
            return Promise.resolve({ ok: true, text: function () { return Promise.resolve(JSON.stringify(respuesta)); } });
        }
    }, { filename: 'configuracion-facturacion.js' });
    eventos.DOMContentLoaded();
    return { controles, eventos, eventosCampos, pedidos, errores };
}

function editar(pantalla, id) {
    pantalla.eventos.click({ target: { closest: function () { return {
        getAttribute: function (atributo) { return { 'data-accion': 'editar', 'data-tipo': 'tipo', 'data-id': String(id) }[atributo]; }
    }; } } });
}

async function vaciarPromesas() {
    await new Promise(function (resolver) { setImmediate(resolver); });
    await new Promise(function (resolver) { setImmediate(resolver); });
}

async function probar() {
    const pantalla = iniciarPantalla();
    await vaciarPromesas();

    editar(pantalla, 1);
    assert.strictEqual(pantalla.controles.tipoImpacto.value, 'C', 'la edición muestra el impacto actual');
    assert.strictEqual(pantalla.controles.tipoImpactoEditable.classList.contains('d-none'), false,
        'un tipo personalizado sin comprobantes permite elegir el impacto');
    assert.strictEqual(pantalla.controles.tipoImpactoFijo.classList.contains('d-none'), true);
    pantalla.controles.tipoImpacto.value = 'D';
    pantalla.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    const guardado = pantalla.pedidos.find(function (pedido) { return pedido.url.endsWith('/tipos-comprobante/1') && pedido.metodo === 'PUT'; });
    assert.ok(guardado, 'guardar envía la variante editada');
    assert.strictEqual(guardado.cuerpo.Impacto, 'D', 'el PUT envía el impacto corregido');

    editar(pantalla, 4);
    assert.strictEqual(pantalla.controles.tipoImpactoEditable.classList.contains('d-none'), true,
        'una factura conserva el impacto fijo');
    assert.strictEqual(pantalla.controles.tipoImpactoFijo.classList.contains('d-none'), false);
    assert.match(pantalla.controles.tipoImpactoMotivo.textContent, /fijo/i,
        'el formulario explica por qué no se puede cambiar la factura');

    editar(pantalla, 5);
    assert.strictEqual(pantalla.controles.tipoImpactoEditable.classList.contains('d-none'), true,
        'un tipo con comprobantes conserva el impacto fijo');
    assert.match(pantalla.controles.tipoImpactoMotivo.textContent, /comprobantes/i,
        'el formulario explica por qué no se puede cambiar un tipo usado');

    pantalla.eventosCampos.cancelarTipo.click();
    pantalla.controles.tipoCodigo.value = 'D';
    pantalla.eventosCampos.tipoCodigo.input();
    assert.strictEqual(pantalla.controles.tipoImpacto.value, 'C',
        'al registrar la otra letra se mantiene el impacto compartido');
    assert.strictEqual(pantalla.controles.tipoImpactoEditable.classList.contains('d-none'), true,
        'registrar otra letra de la misma sigla no cambia su impacto');

    const nuevoFijo = iniciarPantalla();
    await vaciarPromesas();
    nuevoFijo.controles.tipoCodigo.value = 'NC';
    nuevoFijo.eventosCampos.tipoCodigo.input();
    assert.strictEqual(nuevoFijo.controles.tipoImpacto.value, 'C',
        'una sigla fija sin variante visible conserva el impacto correcto');
    assert.strictEqual(nuevoFijo.controles.tipoImpactoEditable.classList.contains('d-none'), true);

    editar(pantalla, 6);
    assert.strictEqual(pantalla.controles.tipoImpactoEditable.classList.contains('d-none'), true,
        'sin el dato de editabilidad, el impacto queda protegido');
    assert.doesNotMatch(pantalla.controles.tipoImpactoMotivo.textContent, /comprobantes/i,
        'sin el dato de editabilidad no se atribuye la restricción a comprobantes inexistentes');

    const conflicto = iniciarPantalla({ emisionConcurrente: true });
    await vaciarPromesas();
    editar(conflicto, 1);
    assert.strictEqual(conflicto.controles.tipoSucursal.value, 10);
    assert.strictEqual(conflicto.controles.tipoNumerador.value, 20);
    conflicto.controles.tipoImpacto.value = 'D';
    conflicto.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    assert.match(conflicto.errores[0], /tiene comprobantes asociados/i,
        'el rechazo por una emisión concurrente se comunica con el motivo de la API');
    assert.strictEqual(conflicto.controles.tipoImpacto.value, 'C',
        'tras el conflicto se recupera el impacto que sigue guardado');
    assert.strictEqual(conflicto.controles.tipoImpactoEditable.classList.contains('d-none'), true,
        'tras el conflicto el impacto pasa a dato fijo');
    assert.match(conflicto.controles.tipoImpactoMotivo.textContent, /comprobantes/i);
    assert.strictEqual(conflicto.controles.tipoSucursal.value, 10,
        'la recarga conserva la sucursal elegida para la variante');
    assert.strictEqual(conflicto.controles.tipoNumerador.value, 20,
        'la recarga conserva el numerador elegido para la variante');
    console.log('OK: edición del impacto de tipos de comprobante en la pantalla');
}

probar().catch(function (error) { console.error(error); process.exitCode = 1; });
