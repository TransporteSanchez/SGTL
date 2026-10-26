const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(raiz, 'assets/static/js/sgtl-ui.js'), 'utf8');
const columnas = ['numeroViaje', 'cliente', 'fechaInicio', 'fechaFin', 'origen', 'destino', 'numeroRemito', 'km'];

function scriptListado(archivo, marca) {
    const html = fs.readFileSync(path.join(raiz, archivo), 'utf8');
    const codigo = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
        .map(function (coincidencia) { return coincidencia[1]; })
        .find(function (contenido) { return contenido.includes(marca); });
    assert.ok(codigo, archivo + ': se encontró el script del listado');

    const encabezado = /<table\b[^>]*id="tablaViajes"[\s\S]*?<thead>([\s\S]*?)<\/thead>/.exec(html);
    assert.ok(encabezado, archivo + ': se encontró la tabla de viajes');
    const botones = [...encabezado[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)]
        .map(function (coincidencia) {
            const boton = /<button\b[^>]*data-sgtl-orden="([^"]+)"[^>]*>([\s\S]*?)<\/button>/.exec(coincidencia[1]);
            if (!boton) return null;
            const atributos = {};
            const th = {
                setAttribute: function (nombre, valor) { atributos[nombre] = valor; },
                removeAttribute: function (nombre) { delete atributos[nombre]; }
            };
            const icono = { className: '' };
            const nodo = {
                textContent: boton[2].replace(/<[^>]+>/g, '').trim(),
                getAttribute: function (nombre) { return nombre === 'data-sgtl-orden' ? boton[1] : atributos[nombre]; },
                setAttribute: function (nombre, valor) { atributos[nombre] = valor; },
                closest: function () { return th; },
                querySelector: function () { return icono; },
                addEventListener: function (evento, accion) { if (evento === 'click') this.alHacerClick = accion; },
                click: function () { assert.ok(this.alHacerClick, 'el encabezado responde al clic'); this.alHacerClick(); }
            };
            return { campo: boton[1], nodo };
        }).filter(Boolean);
    return { codigo, botones };
}

function prepararPantalla(archivo, marca) {
    const pagina = scriptListado(archivo, marca);
    const peticiones = [];
    const listas = [];
    const listos = [];
    const campos = new Map();
    const eventos = new Map();
    let paginacion;
    const cuerpo = { innerHTML: '' };
    const tabla = { querySelectorAll: function () { return pagina.botones.map(function (b) { return b.nodo; }); } };
    const document = {
        querySelector: function (selector) { return selector === '#tablaViajes' ? tabla : cuerpo; },
        addEventListener: function () {},
        documentElement: { hasAttribute: function () { return false; }, setAttribute: function () {} }
    };
    const window = {};
    vm.runInNewContext(ui, { window, document, Intl, setTimeout, clearTimeout }, { filename: 'sgtl-ui.js' });
    const SGTL = window.SGTL;
    SGTL.tabla.cargando = function () {};
    SGTL.tabla.vacia = function () {};
    SGTL.tabla.llenar = function () {};
    SGTL.tabla.paginacion = function (_selector, opciones) { paginacion = opciones; };
    SGTL.valorRango = function () { return {}; };
    SGTL.rangoFechas = function () {};
    SGTL.filtros = function () {};
    SGTL.procesando = function () { return function () {}; };
    SGTL.toastError = function () {};
    SGTL.ajax = function (opciones) {
        peticiones.push({ ...opciones.data });
        return Promise.resolve({ TotalRecords: 0, Results: [] });
    };
    SGTL.descargarCSV = function (_nombre, _titulos, filas) { listas.push(filas); };

    const $ = function (selector) {
        if (typeof selector === 'function') { listos.push(selector); return; }
        if (selector === document) return { ready: function (accion) { listos.push(accion); } };
        return {
            val: function (valor) {
                if (arguments.length) { campos.set(selector, valor); return this; }
                return campos.get(selector) || '';
            },
            on: function (evento, delegacion, accion) {
                if (typeof delegacion === 'function') eventos.set(selector + ':' + evento, delegacion);
                else if (typeof accion === 'function') eventos.set(selector + ':' + evento, accion);
                return this;
            },
            append: function () { return this; },
            text: function () { return this; },
            empty: function () { return this; },
            get: function () { return cuerpo; }
        };
    };
    $.ajax = function (opciones) {
        if (opciones.url.endsWith('/Clientes')) {
            return { done: function (accion) { accion([]); return this; } };
        }
        assert.ok(opciones.url.endsWith('/Viajes/Buscar'), archivo + ': la búsqueda usa la API de viajes');
        peticiones.push({ ...opciones.data });
        const respuesta = { TotalRecords: 0, Results: [] };
        if (opciones.success) opciones.success(respuesta);
        return Promise.resolve(respuesta);
    };
    const contexto = vm.createContext({
        $, SGTL, window, document, Promise, console,
        SelectClientePredictivo: { inicializar: function () {}, sincronizar: function () {} }
    });
    vm.runInContext(pagina.codigo, contexto, { filename: archivo });
    listos.forEach(function (accion) { accion(); });
    return { pagina, contexto, campos, eventos, peticiones, listas, paginacion: function () { return paginacion; } };
}

async function probar(archivo, marca, exportar) {
    const app = prepararPantalla(archivo, marca);
    assert.deepStrictEqual(app.pagina.botones.map(function (b) { return b.campo; }), columnas,
        archivo + ': las ocho columnas pedidas tienen encabezado ordenable');
    assert.ok(app.peticiones.length, archivo + ': carga la primera página');
    assert.strictEqual(app.peticiones.at(-1).orden, undefined, 'el orden inicial sigue a la API');

    for (const columna of columnas) {
        const boton = app.pagina.botones.find(function (b) { return b.campo === columna; }).nodo;
        boton.click();
        assert.strictEqual(app.peticiones.at(-1).orden, columna, archivo + ': ' + columna + ' ascendente');
        assert.strictEqual(app.peticiones.at(-1).direccion, 'asc');
        assert.strictEqual(app.peticiones.at(-1).page, 1, 'cambiar el orden vuelve a la primera página');
        boton.click();
        assert.strictEqual(app.peticiones.at(-1).orden, columna, archivo + ': ' + columna + ' descendente');
        assert.strictEqual(app.peticiones.at(-1).direccion, 'desc');
    }

    await new Promise(function (resolver) { setImmediate(resolver); });
    app.paginacion().alCambiarPagina(2);
    assert.strictEqual(app.peticiones.at(-1).page, 2, 'se puede avanzar de página');
    assert.strictEqual(app.peticiones.at(-1).orden, 'km', 'la página siguiente conserva el orden');
    assert.strictEqual(app.peticiones.at(-1).direccion, 'desc');

    app.campos.set('#clienteFiltroViaje', '17');
    const buscar = app.eventos.get('#busquedaViajeForm:submit');
    assert.ok(buscar, 'el formulario permite volver a buscar con un filtro');
    buscar({ preventDefault: function () {} });
    assert.strictEqual(app.peticiones.at(-1).page, 1, 'filtrar vuelve a la primera página');
    assert.strictEqual(String(app.peticiones.at(-1).clienteId), '17');
    assert.strictEqual(app.peticiones.at(-1).orden, 'km', 'filtrar conserva el orden');
    assert.strictEqual(app.peticiones.at(-1).direccion, 'desc');

    await app.contexto[exportar]();
    assert.strictEqual(app.peticiones.at(-1).page, 1);
    assert.strictEqual(app.peticiones.at(-1).pageSize, 0, 'exportar incluye todos los viajes filtrados');
    assert.strictEqual(app.peticiones.at(-1).orden, 'km', 'el CSV conserva el orden activo');
    assert.strictEqual(app.peticiones.at(-1).direccion, 'desc');
    assert.strictEqual(String(app.peticiones.at(-1).clienteId), '17');
}

Promise.all([
    probar('listado-viajes.html', 'function exportarViajes()', 'exportarViajes'),
    probar('gestion-viajes.html', 'function generarReporteCSV()', 'generarReporteCSV')
]).then(function () {
    console.log('OK: Listar y Gestionar viajes ordenan ocho columnas y conservan el orden al paginar, filtrar y exportar');
}).catch(function (error) { console.error(error); process.exitCode = 1; });
