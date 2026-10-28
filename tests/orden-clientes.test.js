const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(raiz, 'assets/static/js/sgtl-ui.js'), 'utf8');
const compartido = fs.readFileSync(path.join(raiz, 'assets/static/js/clientes.js'), 'utf8');
const columnas = ['CUIT', 'Razón social', 'Fecha de alta', 'Estado', 'Acciones'];
const ordenables = ['cuit', 'razonSocial', 'fechaAlta'];

function datosPantalla(archivo) {
    const html = fs.readFileSync(path.join(raiz, archivo), 'utf8');
    const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
        .map(function (coincidencia) { return coincidencia[1]; })
        .find(function (codigo) { return codigo.includes('const COLUMNAS_CLIENTES = 5;'); });
    assert.ok(script, archivo + ': se encontró el script del listado');
    const thead = /<table\b[^>]*id="tablaClientes"[\s\S]*?<thead>([\s\S]*?)<\/thead>/.exec(html);
    assert.ok(thead, archivo + ': se encontró la tabla de clientes');
    const encabezados = [...thead[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)]
        .map(function (coincidencia) {
            const interior = coincidencia[1];
            const boton = /<button\b[^>]*data-sgtl-orden="([^"]+)"[^>]*>([\s\S]*?)<\/button>/.exec(interior);
            return {
                texto: interior.replace(/<[^>]+>/g, '').trim(),
                campo: boton ? boton[1] : null
            };
        });
    return { script, encabezados };
}

function crearBoton(encabezado) {
    const atributos = { 'data-sgtl-orden': encabezado.campo };
    const th = {
        setAttribute: function (nombre, valor) { atributos[nombre] = valor; },
        removeAttribute: function (nombre) { delete atributos[nombre]; }
    };
    const icono = { className: '' };
    return {
        campo: encabezado.campo,
        nodo: {
            textContent: encabezado.texto,
            getAttribute: function (nombre) { return atributos[nombre]; },
            setAttribute: function (nombre, valor) { atributos[nombre] = valor; },
            closest: function () { return th; },
            querySelector: function () { return icono; },
            addEventListener: function (evento, accion) { if (evento === 'click') this.alHacerClick = accion; },
            click: function () { assert.ok(this.alHacerClick, 'el encabezado responde al clic'); this.alHacerClick(); }
        }
    };
}

function prepararPantalla(archivo) {
    const pagina = datosPantalla(archivo);
    const botones = pagina.encabezados.filter(function (c) { return c.campo; }).map(crearBoton);
    const peticiones = [];
    const csv = [];
    const listos = [];
    const eventos = new Map();
    const campos = new Map([['#filtroEstado', 'Activo']]);
    let paginacion;
    const tabla = { querySelectorAll: function () { return botones.map(function (b) { return b.nodo; }); } };
    const document = {
        querySelector: function (selector) { return selector === '#tablaClientes' ? tabla : null; },
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
    SGTL.valorRango = function () { return null; };
    SGTL.rangoFechas = function () {};
    SGTL.filtros = function () {};
    SGTL.procesando = function () { return function () {}; };
    SGTL.toastError = function () {};
    SGTL.estado = function (estado) { return estado; };
    SGTL.accionesFila = function () { return 'ACCIONES'; };
    SGTL.botonFila = function () { return ''; };
    SGTL.descargarCSV = function (nombre, titulos, filas) { csv.push({ nombre, titulos, filas }); };
    SGTL.ajax = function (opciones) {
        if (opciones.url.endsWith('/Clientes/Buscar')) {
            peticiones.push({ ...opciones.data });
            const ids = opciones.data.pageSize === 0 ? [2, 1] : [1];
            return Promise.resolve({
                TotalRecords: 20,
                Results: ids.map(function (id) {
                    return { Cliente_ID: id, RazonSocial: 'Álamo SA', CUIT_Cliente: '30123456789',
                        Fecha_Alta: '2026-10-20T12:00:00', EstadoCliente: true };
                })
            });
        }
        const id = Number(/\/Clientes\/(\d+)$/.exec(opciones.url)?.[1]);
        assert.ok(id, archivo + ': la exportación solicita el detalle de cada cliente');
        return Promise.resolve({ Cliente_ID: id, Razon_Social: 'Álamo SA', CUIT_Cliente: '30123456789',
            Fecha_Alta: '2026-10-20T12:00:00', EstadoCliente: true, ProvID: 0, LocID: 0 });
    };

    const $ = function (selector) {
        if (typeof selector === 'function') { listos.push(selector); return; }
        return {
            val: function (valor) {
                if (arguments.length) { campos.set(selector, valor); return this; }
                return campos.get(selector) || '';
            },
            on: function (evento, delegacion, accion) {
                eventos.set(selector + ':' + evento, typeof delegacion === 'function' ? delegacion : accion);
                return this;
            }
        };
    };
    const contexto = vm.createContext({ $, SGTL, window, document, Promise, console, Date });
    vm.runInContext(compartido, contexto, { filename: 'clientes.js' });
    vm.runInContext(pagina.script, contexto, { filename: archivo });
    listos.forEach(function (accion) { accion(); });
    return { pagina, botones, contexto, campos, eventos, peticiones, csv,
        paginacion: function () { return paginacion; } };
}

async function probar(archivo) {
    const app = prepararPantalla(archivo);
    assert.deepStrictEqual(app.pagina.encabezados.map(function (c) { return c.texto; }), columnas,
        archivo + ': las cinco columnas están en el orden solicitado');
    assert.deepStrictEqual(app.botones.map(function (b) { return b.campo; }), ordenables,
        archivo + ': CUIT, Razón social y Fecha de alta permiten ordenar');

    const fila = app.contexto.filaCliente({ Cliente_ID: 1, RazonSocial: 'Álamo SA',
        CUIT_Cliente: '30123456789', Fecha_Alta: '2026-10-20T12:00:00', EstadoCliente: true });
    const celdas = [...fila.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(function (c) { return c[1]; });
    assert.strictEqual(celdas.length, 5, archivo + ': cada fila tiene cinco celdas');
    assert.match(celdas[0], /30-12345678-9/, 'CUIT es la primera celda');
    assert.match(celdas[1], /Álamo SA/, 'Razón social es la segunda celda');
    assert.match(celdas[2], /2026/, 'Fecha de alta es la tercera celda');
    assert.match(celdas[3], /Activo/, 'Estado es la cuarta celda');
    assert.match(celdas[4], /ACCIONES/, 'Acciones es la quinta celda');

    assert.ok(app.peticiones.length, archivo + ': carga la primera página');
    assert.strictEqual(app.peticiones.at(-1).orden, undefined, 'la primera carga conserva el orden inicial');
    for (const columna of ordenables) {
        const boton = app.botones.find(function (b) { return b.campo === columna; }).nodo;
        boton.click();
        assert.strictEqual(app.peticiones.at(-1).orden, columna, archivo + ': ' + columna + ' ascendente');
        assert.strictEqual(app.peticiones.at(-1).direccion, 'asc');
        assert.strictEqual(app.peticiones.at(-1).page, 1, 'cambiar el orden vuelve a la primera página');
        boton.click();
        assert.strictEqual(app.peticiones.at(-1).orden, columna, archivo + ': ' + columna + ' descendente');
        assert.strictEqual(app.peticiones.at(-1).direccion, 'desc');
    }

    await Promise.resolve();
    app.paginacion().alCambiarPagina(2);
    assert.strictEqual(app.peticiones.at(-1).page, 2, 'se puede avanzar de página');
    assert.strictEqual(app.peticiones.at(-1).orden, 'fechaAlta', 'la página siguiente conserva el orden');
    assert.strictEqual(app.peticiones.at(-1).direccion, 'desc');

    app.campos.set('#filtroRazonSocial', 'Álamo');
    const buscar = app.eventos.get('#busquedaClienteForm:submit');
    assert.ok(buscar, archivo + ': el formulario busca con el filtro');
    buscar({ preventDefault: function () {} });
    assert.strictEqual(app.peticiones.at(-1).page, 1, 'filtrar vuelve a la primera página');
    assert.strictEqual(app.peticiones.at(-1).razonSocial, 'Álamo');
    assert.strictEqual(app.peticiones.at(-1).orden, 'fechaAlta', 'filtrar conserva el orden');
    assert.strictEqual(app.peticiones.at(-1).direccion, 'desc');

    const exportar = app.eventos.get('#btnExportar:click');
    assert.ok(exportar, archivo + ': tiene exportación');
    await exportar();
    assert.strictEqual(app.peticiones.at(-1).pageSize, 0, 'el CSV incluye todos los resultados filtrados');
    assert.strictEqual(app.peticiones.at(-1).razonSocial, 'Álamo');
    assert.strictEqual(app.peticiones.at(-1).orden, 'fechaAlta', 'el CSV conserva el orden');
    assert.strictEqual(app.peticiones.at(-1).direccion, 'desc');
    assert.deepStrictEqual(Array.from(app.csv.at(-1).filas, function (filaCsv) { return filaCsv[0]; }), [2, 1],
        'el CSV conserva el orden de los resultados de la API');
}

Promise.all([probar('listado-clientes.html'), probar('gestion-clientes.html')]).then(function () {
    console.log('OK: Listar y Gestionar clientes ordenan tres columnas y conservan el orden al paginar, filtrar y exportar');
}).catch(function (error) { console.error(error); process.exitCode = 1; });
