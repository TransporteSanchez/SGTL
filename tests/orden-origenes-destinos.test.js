const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'gestion-origenes-destinos.html'), 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(function (coincidencia) { return coincidencia[1]; })
    .find(function (contenido) { return contenido.includes('function filaOD('); });
assert.ok(script, 'se encontró la lógica real del listado');

const registros = [
    { Descripcion: 'Zorro', ClienteRazon: 'Acme', ClienteID: 1, NombreProvincia: 'Mendoza', NombreLocalidad: 'Rosario', Calle: 'Río', AlturaCalle: '10' },
    { Descripcion: 'Árbol', ClienteRazon: 'Zulu', ClienteID: 2, NombreProvincia: 'Tucumán', NombreLocalidad: 'Azul', Calle: 'Río', AlturaCalle: '20' },
    { Descripcion: 'Lima', ClienteRazon: 'Delta', ClienteID: 1, NombreProvincia: 'Buenos Aires', NombreLocalidad: 'Córdoba', Calle: 'Río', AlturaCalle: '30' },
    { Descripcion: 'Ñandú', ClienteRazon: 'Beta', ClienteID: 2, NombreProvincia: 'Salta', NombreLocalidad: 'Mendoza', Calle: 'Río', AlturaCalle: '40' },
    { Descripcion: 'Búho', ClienteRazon: 'Gamma', ClienteID: 1, NombreProvincia: 'Córdoba', NombreLocalidad: 'La Plata', Calle: 'Río', AlturaCalle: '50' }
];
const origenes = registros.map(function (registro, indice) { return { ...registro, Origen_ID: indice + 11 }; });
const destinos = registros.map(function (registro, indice) { return { ...registro, Destino_ID: indice + 101 }; }).reverse();

const cuerpos = {};
const paginadores = {};
const campos = {};
const ordenActivo = { origen: {}, destino: {} };
const SGTL = {
    escapar: function (valor) { return String(valor == null ? '' : valor); },
    botonFila: function (accion, opciones) { return `<button data-accion="${accion}" data-id="${opciones.id}" data-tipo="${opciones.datos.tipo}"></button>`; },
    accionesFila: function (acciones) { return acciones.join(''); },
    validador: function () { return {}; },
    filtros: function () {},
    ajax: function () { return Promise.resolve([]); },
    tabla: {
        cargar: function () {},
        cargando: function () {},
        vacia: function (selector) { cuerpos[selector] = ''; },
        llenar: function (selector, contenido) { cuerpos[selector] = contenido; },
        paginacion: function (selector, opciones) { paginadores[selector] = opciones; },
        habilitarOrden: function (selector) {
            const tipo = selector.endsWith('origen') ? 'origen' : 'destino';
            return { parametros: function () { return ordenActivo[tipo]; } };
        }
    }
};
function $(argumento) {
    if (typeof argumento === 'function') { argumento(); return; }
    return {
        on: function () { return this; },
        val: function () { return campos[argumento] || ''; }
    };
}
const contexto = vm.createContext({
    SGTL,
    $,
    SelectClientePredictivo: { inicializar: function () {}, sincronizar: function () {} },
    document: { getElementById: function () { return { appendChild: function () {} }; } },
    Option: function () {},
    localStorage: { getItem: function () { return null; } },
    console,
    setTimeout
});
vm.runInContext(script, contexto, { filename: 'gestion-origenes-destinos.html' });

function dibujar(tipo, pagina) {
    vm.runInContext(`dibujar('${tipo}', ${pagina})`, contexto);
}
function filtrar(tipo) {
    vm.runInContext(`aplicarFiltros('${tipo}')`, contexto);
}
function descripciones(tipo) {
    const filas = cuerpos[`#tabla_${tipo} tbody`].match(/<tr[\s\S]*?<\/tr>/g) || [];
    return filas.map(function (fila) {
        const primeraCelda = /<td[^>]*>([\s\S]*?)<\/td>/.exec(fila);
        assert.ok(primeraCelda, 'cada fila tiene una celda de descripción');
        return primeraCelda[1].trim();
    });
}

async function probar() {
    // Dejá completar la carga inicial; el test reemplaza únicamente las respuestas de la API.
    await new Promise(function (resolver) { setImmediate(resolver); });
    contexto.origenes = origenes;
    contexto.destinos = destinos;
    vm.runInContext('tablas.origen.datos = origenes; tablas.destino.datos = destinos;', contexto);
    vm.runInContext('tablas.origen.tamanio = 0; tablas.destino.tamanio = 0;', contexto);

    dibujar('origen', 1);
    dibujar('destino', 1);
    assert.deepStrictEqual(descripciones('origen'), ['Zorro', 'Árbol', 'Lima', 'Ñandú', 'Búho'], 'sin orden se conserva el orden de la API en orígenes');
    assert.deepStrictEqual(descripciones('destino'), ['Búho', 'Ñandú', 'Lima', 'Árbol', 'Zorro'], 'sin orden se conserva el orden de la API en destinos');

    const htmlFila = vm.runInContext('filaOD("origen", tablas.origen.datos[0])', contexto);
    assert.strictEqual((htmlFila.match(/<td\b/g) || []).length, 6, 'el ID no ocupa una celda');
    assert.ok(htmlFila.includes('data-accion="editar" data-id="11"'), 'el ID sigue disponible para editar');
    assert.ok(htmlFila.includes('data-accion="eliminar" data-id="11"'), 'el ID sigue disponible para eliminar');

    const casos = [
        { campo: 'descripcion', asc: ['Árbol', 'Búho', 'Lima', 'Ñandú', 'Zorro'] },
        { campo: 'cliente', asc: ['Zorro', 'Ñandú', 'Lima', 'Búho', 'Árbol'] },
        { campo: 'provincia', asc: ['Lima', 'Búho', 'Zorro', 'Ñandú', 'Árbol'] },
        { campo: 'localidad', asc: ['Árbol', 'Lima', 'Búho', 'Ñandú', 'Zorro'] }
    ];
    for (const tipo of ['origen', 'destino']) {
        for (const caso of casos) {
            ordenActivo[tipo] = { orden: caso.campo, direccion: 'asc' };
            dibujar(tipo, 1);
            assert.deepStrictEqual(descripciones(tipo), caso.asc, `${tipo}: ${caso.campo} ascendente`);
            ordenActivo[tipo] = { orden: caso.campo, direccion: 'desc' };
            dibujar(tipo, 1);
            assert.deepStrictEqual(descripciones(tipo), [...caso.asc].reverse(), `${tipo}: ${caso.campo} descendente`);
        }
    }

    ordenActivo.origen = { orden: 'descripcion', direccion: 'asc' };
    ordenActivo.destino = { orden: 'cliente', direccion: 'desc' };
    vm.runInContext('tablas.origen.tamanio = 2; tablas.destino.tamanio = 2;', contexto);
    dibujar('origen', 1);
    dibujar('destino', 1);
    assert.deepStrictEqual(descripciones('origen'), ['Árbol', 'Búho'], 'se ordena antes de paginar orígenes');
    assert.deepStrictEqual(descripciones('destino'), ['Árbol', 'Búho'], 'cada pestaña conserva su propio orden');
    dibujar('origen', 2);
    assert.deepStrictEqual(descripciones('origen'), ['Lima', 'Ñandú'], 'la página siguiente continúa el orden global');
    assert.strictEqual(paginadores['#paginacion_origen'].total, 5);

    campos['#fClienteOrigen'] = '1';
    campos['#fTextoOrigen'] = '';
    filtrar('origen');
    assert.deepStrictEqual(descripciones('origen'), ['Búho', 'Lima'], 'filtrar conserva el orden y vuelve a la primera página');
    assert.strictEqual(paginadores['#paginacion_origen'].pagina, 1);
    assert.strictEqual(paginadores['#paginacion_origen'].total, 3);
    assert.deepStrictEqual(descripciones('destino'), ['Árbol', 'Búho'], 'filtrar orígenes no cambia el listado de destinos');

    console.log('OK: orígenes y destinos ocultan ID y ordenan antes de paginar con filtros independientes');
}

probar().catch(function (error) { console.error(error); process.exitCode = 1; });
