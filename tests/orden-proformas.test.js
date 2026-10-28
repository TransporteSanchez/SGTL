const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(raiz, 'assets/static/js/sgtl-ui.js'), 'utf8');
const columnas = ['Número', 'Cliente', 'Total', 'Fecha', 'Usuario', 'Estado', 'Acciones'];
const ordenables = ['numero', 'cliente', 'total', 'fecha', 'usuario'];

function pantalla(archivo) {
    const html = fs.readFileSync(path.join(raiz, archivo), 'utf8');
    const codigo = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
        .map(function (coincidencia) { return coincidencia[1]; })
        .find(function (script) { return script.includes("const API_FAC = 'http://localhost:50222/api';"); });
    assert.ok(codigo, archivo + ': existe el código de la grilla');
    const cabecera = /<table\b[^>]*id="tablaProformas"[\s\S]*?<thead><tr>([\s\S]*?)<\/tr><\/thead>/.exec(html);
    assert.ok(cabecera, archivo + ': la tabla tiene identificador para SGTL.tabla.habilitarOrden');
    const encabezados = [...cabecera[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)]
        .map(function (coincidencia) {
            const interior = coincidencia[1];
            const boton = /<button\b[^>]*data-sgtl-orden="([^"]+)"[^>]*>([\s\S]*?)<\/button>/.exec(interior);
            return { texto: interior.replace(/<[^>]+>/g, '').trim(), campo: boton ? boton[1] : null };
        });
    return { codigo, encabezados };
}

function boton(encabezado) {
    const atributos = { 'data-sgtl-orden': encabezado.campo };
    const th = {
        setAttribute: function (clave, valor) { atributos['th:' + clave] = valor; },
        removeAttribute: function (clave) { delete atributos['th:' + clave]; }
    };
    const icono = { className: '' };
    const nodo = {
        textContent: encabezado.texto,
        getAttribute: function (clave) { return atributos[clave]; },
        setAttribute: function (clave, valor) { atributos[clave] = valor; },
        closest: function () { return th; },
        querySelector: function () { return icono; },
        addEventListener: function (evento, accion) { if (evento === 'click') this.alHacerClick = accion; },
        click: function () { assert.ok(this.alHacerClick); this.alHacerClick(); }
    };
    return { campo: encabezado.campo, nodo, atributos };
}

function preparar(archivo, opciones) {
    const pagina = pantalla(archivo);
    const botones = pagina.encabezados.filter(function (h) { return h.campo; }).map(boton);
    const solicitudes = [];
    const exportaciones = [];
    const listos = [];
    const eventos = new Map();
    const nodos = new Map();
    let paginacion;
    const tabla = { querySelectorAll: function () { return botones.map(function (b) { return b.nodo; }); } };
    function nodo(id) {
        if (!nodos.has(id)) nodos.set(id, {
            value: '', innerHTML: '', textContent: '', style: { display: '' }, disabled: false,
            addEventListener: function () {},
            classList: { remove: function () {}, add: function () {} }
        });
        return nodos.get(id);
    }
    const document = {
        querySelector: function (selector) { return selector === '#tablaProformas' ? tabla : null; },
        getElementById: nodo,
        addEventListener: function (evento, accion) { if (evento === 'DOMContentLoaded') listos.push(accion); },
        documentElement: { hasAttribute: function () { return false; }, setAttribute: function () {} }
    };
    const window = {
        location: { search: '', pathname: '/' },
        ReportesProformas: { exportar: function (formato, datos) { exportaciones.push({ formato, datos }); } }
    };
    const $ = function (selector) {
        return {
            on: function (evento, delegacion, accion) {
                eventos.set(String(selector) + ':' + evento, typeof delegacion === 'function' ? delegacion : accion);
                return this;
            },
            modal: function () { return this; },
            val: function () { return ''; }
        };
    };
    $.ajax = function () { return { done: function (accion) { accion([]); return this; } }; };
    function fetch(url) {
        solicitudes.push(new URL(url));
        if (opciones && opciones.fetch) return opciones.fetch(url);
        return Promise.resolve({ ok: true, json: function () {
            return Promise.resolve({ items: [{ Proforma_ID: 7, Numero: 'PF-00000007', Cliente: 'Acme',
                Total: 345.67, Fecha: '2026-10-20T00:00:00', UsuarioCreador: 'facu',
                Estado: 'Aceptada' }], total: 30, totalPages: 2 });
        } });
    }
    vm.runInNewContext(ui, { window, document, Intl, setTimeout, clearTimeout }, { filename: 'sgtl-ui.js' });
    const SGTL = window.SGTL;
    SGTL.tabla.cargando = function () {};
    SGTL.tabla.vacia = function () {};
    SGTL.tabla.llenar = function (cuerpo, html) { cuerpo.innerHTML = html; };
    SGTL.tabla.paginacion = function (_selector, opciones) { paginacion = opciones; };
    SGTL.valorRango = function () { return null; };
    SGTL.rangoFechas = function () {};
    SGTL.selectorFecha = function () {};
    SGTL.filtros = function () {};
    SGTL.estado = function (estado) { return estado; };
    SGTL.accionesFila = function () { return 'ACCIONES'; };
    SGTL.botonFila = function () { return ''; };
    SGTL.toastError = function (error) { throw new Error(error); };
    const contexto = vm.createContext({ $, document, window, SGTL, fetch, URL, URLSearchParams,
        Promise, Date, console, setTimeout, clearTimeout,
        SelectClientePredictivo: { inicializar: function () {}, sincronizar: function () {} } });
    vm.runInContext(pagina.codigo, contexto, { filename: archivo });
    listos.forEach(function (accion) { accion(); });
    return { pagina, botones, solicitudes, exportaciones, nodos, eventos, contexto,
        paginacion: function () { return paginacion; } };
}

async function probarRespuestaAtrasada(archivo) {
    const pendientes = [];
    const app = preparar(archivo, {
        fetch: function () { return new Promise(function (resolver) { pendientes.push(resolver); }); }
    });
    assert.strictEqual(pendientes.length, 1, 'se inició la búsqueda inicial');
    app.botones[0].nodo.click();
    assert.strictEqual(pendientes.length, 2, 'ordenar inició una búsqueda nueva');
    function respuesta(numero) {
        return { ok: true, json: function () { return Promise.resolve({
            items: [{ Proforma_ID: numero, Numero: 'PF-' + numero, Cliente: 'Acme',
                Total: numero, Fecha: '2026-10-20T00:00:00', UsuarioCreador: 'facu', Estado: 'Aceptada' }],
            total: 1, totalPages: 1
        }); } };
    }
    pendientes[1](respuesta(2));
    await new Promise(function (resolver) { setImmediate(resolver); });
    assert.match(app.nodos.get('cuerpoProformas').innerHTML, /PF-2/);
    pendientes[0](respuesta(1));
    await new Promise(function (resolver) { setImmediate(resolver); });
    assert.match(app.nodos.get('cuerpoProformas').innerHTML, /PF-2/,
        archivo + ': una respuesta anterior no reemplaza la tabla ordenada');
}

async function probar(archivo) {
    const app = preparar(archivo);
    assert.deepStrictEqual(app.pagina.encabezados.map(function (h) { return h.texto; }), columnas,
        archivo + ': las siete columnas están en el orden solicitado');
    assert.deepStrictEqual(app.botones.map(function (b) { return b.campo; }), ordenables,
        archivo + ': solo las cinco primeras columnas son ordenables');
    assert.ok(app.solicitudes.length, archivo + ': se carga la primera página');
    assert.strictEqual(app.solicitudes.at(-1).searchParams.get('orden'), null,
        archivo + ': la carga inicial conserva el orden existente');

    for (const campo of ordenables) {
        const b = app.botones.find(function (item) { return item.campo === campo; });
        b.nodo.click();
        assert.strictEqual(app.solicitudes.at(-1).searchParams.get('orden'), campo, campo + ' ascendente');
        assert.strictEqual(app.solicitudes.at(-1).searchParams.get('direccion'), 'asc');
        assert.strictEqual(app.solicitudes.at(-1).searchParams.get('page'), '1');
        assert.strictEqual(b.atributos['th:aria-sort'], 'ascending');
        b.nodo.click();
        assert.strictEqual(app.solicitudes.at(-1).searchParams.get('orden'), campo, campo + ' descendente');
        assert.strictEqual(app.solicitudes.at(-1).searchParams.get('direccion'), 'desc');
        assert.strictEqual(b.atributos['th:aria-sort'], 'descending');
    }

    await new Promise(function (resolver) { setImmediate(resolver); });
    const fila = app.nodos.get('cuerpoProformas').innerHTML;
    const celdas = [...fila.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(function (c) { return c[1]; });
    assert.strictEqual(celdas.length, 7, archivo + ': la fila tiene siete celdas');
    assert.match(celdas[0], /PF-00000007/);
    assert.match(celdas[1], /Acme/);
    assert.match(celdas[2], /345,67/);
    assert.match(celdas[3], /20\/10\/2026/);
    assert.match(celdas[4], /facu/);
    assert.match(celdas[5], /Aceptada/);
    assert.match(celdas[6], /ACCIONES/);

    app.paginacion().alCambiarPagina(2);
    assert.strictEqual(app.solicitudes.at(-1).searchParams.get('page'), '2');
    assert.strictEqual(app.solicitudes.at(-1).searchParams.get('orden'), 'usuario');
    assert.strictEqual(app.solicitudes.at(-1).searchParams.get('direccion'), 'desc');

    app.nodos.get('fNumero').value = 'PF-00000007';
    const buscar = app.eventos.get('#busquedaProformaForm:submit');
    assert.ok(buscar, archivo + ': el formulario busca con filtros');
    buscar({ preventDefault: function () {} });
    assert.strictEqual(app.solicitudes.at(-1).searchParams.get('page'), '1');
    assert.strictEqual(app.solicitudes.at(-1).searchParams.get('numero'), 'PF-00000007');
    assert.strictEqual(app.solicitudes.at(-1).searchParams.get('orden'), 'usuario');

    await app.contexto.exportarReporteProformas('excel');
    await new Promise(function (resolver) { setImmediate(resolver); });
    const reporte = app.solicitudes.at(-1);
    assert.ok(reporte.pathname.endsWith('/Proformas/Reporte'), 'se exportan todos los resultados');
    assert.strictEqual(reporte.searchParams.get('pageSize'), '0');
    assert.strictEqual(reporte.searchParams.get('numero'), 'PF-00000007');
    assert.strictEqual(reporte.searchParams.get('orden'), 'usuario');
    assert.strictEqual(reporte.searchParams.get('direccion'), 'desc');
    assert.strictEqual(app.exportaciones.at(-1).formato, 'excel');
}

Promise.all([
    probar('listado-facturas.html'), probar('gestion-facturacion.html'),
    probarRespuestaAtrasada('listado-facturas.html'), probarRespuestaAtrasada('gestion-facturacion.html')
]).then(function () {
    console.log('OK: Listar y Gestionar proformas ordenan cinco columnas y conservan el criterio al paginar, filtrar y exportar');
}).catch(function (error) { console.error(error); process.exitCode = 1; });
