const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'assets/static/js/configuracion-facturacion.js'), 'utf8');

function iniciarPantalla(opciones) {
    opciones = opciones || {};
    const filas = {};
    const pedidos = [];
    const confirmaciones = [];
    const erroresConfirmacion = [];
    const erroresToast = [];
    const eventos = {};
    const eventosCampos = {};
    const controles = {};
    const datos = {
        sucursales: [
            { SucursalID: 1, Codigo: '0001', Nombre: 'Libre', Activa: true, PuedeEliminar: true },
            { SucursalID: 2, Codigo: '0002', Nombre: 'En uso', Activa: true, PuedeEliminar: false }
        ],
        numeradores: [
            { NumeradorID: 3, Nombre: 'Libre', UltimoNumero: 0, Activo: true, PuedeEliminar: true },
            { NumeradorID: 4, Nombre: 'En uso', UltimoNumero: 7, Activo: true, PuedeEliminar: false }
        ],
        tipos: [
            { FactTipo_ID: 31, Tipo: 'TMP', Descripcion: 'Temporal', Impacto: 'D', LetraPredeterminada: 'A', SucursalID: 1, NumeradorID: 3, Activo: true, PuedeEliminar: true, PuedeCambiarImpacto: true, PuedeCambiarSigla: true, PuedeCambiarLetra: true },
            { FactTipo_ID: 41, Tipo: 'FAC', Descripcion: 'Factura', Impacto: 'D', LetraPredeterminada: 'A', SucursalID: 2, NumeradorID: 4, Activo: true, PuedeEliminar: false, PuedeCambiarImpacto: false, PuedeCambiarSigla: false, PuedeCambiarLetra: false },
            { FactTipo_ID: 42, Tipo: 'FAC', Descripcion: 'Factura', Impacto: 'D', LetraPredeterminada: 'B', SucursalID: 1, NumeradorID: 3, Activo: true, PuedeEliminar: true, PuedeCambiarImpacto: false, PuedeCambiarSigla: false, PuedeCambiarLetra: true }
        ]
    };
    const document = {
        readyState: 'loading',
        getElementById: function (id) {
            if (!controles[id]) controles[id] = {
                value: '', checked: false, disabled: false, innerHTML: '',
                classList: {
                    clases: new Set(),
                    add: function (clase) { this.clases.add(clase); },
                    remove: function (clase) { this.clases.delete(clase); },
                    contains: function (clase) { return this.clases.has(clase); },
                    toggle: function (clase, activo) { if (activo) this.add(clase); else this.remove(clase); }
                },
                addEventListener: function (nombre, manejador) {
                    if (!eventosCampos[id]) eventosCampos[id] = {};
                    eventosCampos[id][nombre] = manejador;
                },
                querySelector: function () { return {}; }, focus: function () {}
            };
            return controles[id];
        },
        addEventListener: function (nombre, manejador) { eventos[nombre] = manejador; }
    };
    const SGTL = {
        tabla: {
            cargando: function () {}, vacia: function () {},
            llenar: function (selector, html) { filas[selector] = html; }
        },
        estado: function (valor) { return valor; },
        botonFila: function (accion, opciones) {
            return '<button data-accion="' + accion + '" data-id="' + opciones.id + '" data-tipo="' + opciones.datos.tipo + '"></button>';
        },
        accionesFila: function (botones) { return botones.join(''); },
        validador: function () { return { validarTodo: function () {} }; },
        reiniciarFormulario: function () {},
        revisarFormulario: function () { return true; },
        procesando: function () { return function () {}; },
        toastExito: function () {}, toastError: function (mensaje) { erroresToast.push(mensaje); },
        confirmar: function (opciones) {
            confirmaciones.push(opciones);
            return Promise.resolve().then(function () { return opciones.accion(); }).then(function () { return true; }, function (error) {
                erroresConfirmacion.push(error);
                return false;
            });
        }
    };
    const sandbox = {
        window: {}, document, SGTL,
        localStorage: { getItem: function () { return 'token-de-prueba'; } },
        fetch: function (url, opciones) {
            pedidos.push({ url, metodo: opciones.method || 'GET', cuerpo: opciones.body && JSON.parse(opciones.body) });
            if (opciones.method === 'DELETE' && url.endsWith('/numeradores/3') && sandbox.conflictoNumerador) {
                datos.numeradores[0].PuedeEliminar = false;
                return Promise.resolve({ ok: false, status: 409, text: function () {
                    return Promise.resolve(JSON.stringify({ error: 'No se puede eliminar el numerador: ya tiene relaciones.' }));
                } });
            }
            let respuesta = {};
            if (url.includes('/sucursales?')) respuesta = datos.sucursales;
            if (url.includes('/numeradores?')) respuesta = datos.numeradores;
            if (url.endsWith('/tipos-comprobante')) respuesta = datos.tipos;
            return Promise.resolve({ ok: true, text: function () { return Promise.resolve(JSON.stringify(respuesta)); } });
        },
        conflictoNumerador: opciones.conflictoNumerador === true
    };
    vm.runInNewContext(fuente, sandbox, { filename: 'configuracion-facturacion.js' });
    eventos.DOMContentLoaded();
    return { filas, pedidos, confirmaciones, erroresConfirmacion, erroresToast, eventos, eventosCampos, controles };
}

function clic(pantalla, accion, tipo, id) {
    pantalla.eventos.click({
        target: { closest: function () { return {
            getAttribute: function (nombre) { return { 'data-accion': accion, 'data-tipo': tipo, 'data-id': String(id) }[nombre]; }
        }; } }
    });
}

async function vaciarPromesas() {
    await new Promise(function (resolver) { setImmediate(resolver); });
    await new Promise(function (resolver) { setImmediate(resolver); });
}

async function probar() {
    const pantalla = iniciarPantalla();
    await vaciarPromesas();

    for (const cuerpo of ['#sucursalesBody', '#numeradoresBody']) {
        const botones = pantalla.filas[cuerpo].match(/data-accion="eliminar"/g) || [];
        assert.strictEqual(botones.length, 1, cuerpo + ': Eliminar solo debe aparecer en la fila sin relaciones');
    }
    assert.strictEqual((pantalla.filas['#tiposBody'].match(/data-accion="eliminar"/g) || []).length, 2,
        'FAC B libre se puede eliminar aunque FAC A tenga comprobantes');
    assert.match(pantalla.filas['#tiposBody'], /data-accion="editar" data-id="41" data-tipo="tipo"/);
    assert.match(pantalla.filas['#tiposBody'], /data-accion="editar" data-id="42" data-tipo="tipo"/);

    clic(pantalla, 'editar', 'tipo', 42);
    assert.strictEqual(pantalla.controles.tipoId.value, 42, 'Editar FAC B conserva el identificador de esa variante');
    assert.strictEqual(pantalla.controles.tipoCodigo.value, 'FAC');
    assert.strictEqual(pantalla.controles.tipoLetra.value, 'B');
    assert.strictEqual(pantalla.controles.tipoSucursal.value, 1, 'Editar B carga su propia sucursal');
    assert.strictEqual(pantalla.controles.tipoCodigo.disabled, false, 'La sigla fija no es un campo deshabilitado');
    assert.strictEqual(pantalla.controles.tipoLetra.disabled, false, 'La letra editable no es un campo deshabilitado');
    assert.strictEqual(pantalla.controles.tipoCodigoEditable.classList.contains('d-none'), true);
    assert.strictEqual(pantalla.controles.tipoLetraEditable.classList.contains('d-none'), false,
        'FAC B sin comprobantes permite editar su letra aunque FAC A tenga comprobantes');

    pantalla.controles.tipoDescripcion.value = 'Factura corregida';
    pantalla.eventosCampos.tipoCodigo.input();
    assert.strictEqual(pantalla.controles.tipoDescripcion.value, 'Factura corregida',
        'El autocompletado no pisa lo escrito al editar una variante');
    pantalla.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    const guardado = pantalla.pedidos.find(function (p) { return p.url.endsWith('/tipos-comprobante/42') && p.metodo === 'PUT'; });
    assert.ok(guardado, 'Editar FAC B actualiza solo la variante identificada por ID');
    assert.strictEqual(guardado.cuerpo.Tipo, 'FAC');
    assert.strictEqual(guardado.cuerpo.LetraPredeterminada, 'B');

    const alta = iniciarPantalla();
    await vaciarPromesas();
    alta.controles.tipoCodigo.value = 'TMP';
    alta.eventosCampos.tipoCodigo.input();
    assert.strictEqual(alta.controles.tipoDescripcion.value, 'Temporal',
        'Al dar de alta otra letra se reutiliza la descripción del código');
    assert.strictEqual(alta.controles.tipoImpacto.value, 'D',
        'Al dar de alta otra letra se reutiliza el impacto del código');
    assert.strictEqual(alta.controles.tipoImpactoEditable.classList.contains('d-none'), true,
        'El impacto compartido se muestra como dato fijo');
    alta.controles.tipoLetra.value = 'B';
    alta.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    const nuevaVariante = alta.pedidos.find(function (p) { return p.url.endsWith('/tipos-comprobante') && p.metodo === 'POST'; });
    assert.ok(nuevaVariante, 'La otra letra se crea por POST, sin editar la variante existente');
    assert.strictEqual(nuevaVariante.cuerpo.Tipo, 'TMP');
    assert.strictEqual(nuevaVariante.cuerpo.LetraPredeterminada, 'B');
    assert.strictEqual(nuevaVariante.cuerpo.Descripcion, 'Temporal');

    const casos = [
        ['sucursal', 2, '/sucursales/2/estado', 'Activa'],
        ['numerador', 4, '/numeradores/4/estado', 'Activo'],
        ['tipo', 42, '/tipos-comprobante/42/estado', 'Activo']
    ];
    for (const [tipo, id, ruta, campoEstado] of casos) {
        clic(pantalla, 'inactivar', tipo, id);
        await vaciarPromesas();
        const pedido = pantalla.pedidos.find(function (p) { return p.url.endsWith(ruta) && p.metodo !== 'GET'; });
        assert.ok(pedido, tipo + ': falta solicitud de inactivación');
        assert.strictEqual(pedido.metodo, 'PUT', tipo + ': Inactivar no debe borrar el registro');
        assert.deepStrictEqual(pedido.cuerpo, { [campoEstado]: false },
            tipo + ': cambiar el estado no debe sobrescribir otros campos');
    }

    for (const [tipo, id, ruta] of [
        ['sucursal', 1, '/sucursales/1'],
        ['numerador', 3, '/numeradores/3'],
        ['tipo', 31, '/tipos-comprobante/31'],
        ['tipo', 42, '/tipos-comprobante/42']
    ]) {
        const antes = pantalla.confirmaciones.length;
        clic(pantalla, 'eliminar', tipo, id);
        await vaciarPromesas();
        assert.strictEqual(pantalla.confirmaciones.length, antes + 1, tipo + ': debe confirmar la eliminación');
        assert.strictEqual(pantalla.confirmaciones[antes].verbo, 'Eliminar');
        if (tipo === 'tipo' && id === 42)
            assert.match(pantalla.confirmaciones[antes].titulo, /FAC.*B/,
                'La confirmación distingue la letra que se va a eliminar');
        assert.ok(pantalla.pedidos.some(function (p) { return p.url.endsWith(ruta) && p.metodo === 'DELETE'; }),
            tipo + ': debe solicitar el borrado físico');
    }
    const conflicto = iniciarPantalla({ conflictoNumerador: true });
    await vaciarPromesas();
    clic(conflicto, 'eliminar', 'numerador', 3);
    await vaciarPromesas();
    assert.strictEqual(conflicto.erroresConfirmacion.length, 1, 'el conflicto queda en el modal de confirmación');
    assert.strictEqual(conflicto.erroresConfirmacion[0].mensajeUsuario,
        'No se puede eliminar el numerador: ya tiene relaciones.');
    assert.strictEqual(conflicto.erroresToast.length, 0, 'no aparece un segundo aviso fuera del modal');
    assert.doesNotMatch(conflicto.filas['#numeradoresBody'].split('</tr>')[0], /data-accion="eliminar"/,
        'al actualizar la lista desaparece Eliminar del numerador relacionado');

    console.log('OK: eliminación de configuración de facturación');
}

probar().catch(function (error) { console.error(error); process.exitCode = 1; });
