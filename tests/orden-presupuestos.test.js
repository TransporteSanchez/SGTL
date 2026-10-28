const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'assets', 'static', 'js', 'presupuestos.js'), 'utf8');

function extraerFuncion(nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    if (inicio === -1) return '';
    const apertura = fuente.indexOf('{', inicio);
    let nivel = 0;
    for (let indice = apertura; indice < fuente.length; indice += 1) {
        if (fuente[indice] === '{') nivel += 1;
        if (fuente[indice] === '}') nivel -= 1;
        if (nivel === 0) return fuente.slice(inicio, indice + 1);
    }
    throw new Error('No se pudo extraer ' + nombre);
}

const filas = [];
const cuerpo = {
    insertRow: function () {
        const fila = {
            celdas: [],
            insertCell: function () {
                const celda = { textContent: '', querySelectorAll: function () { return []; } };
                this.celdas.push(celda);
                return celda;
            }
        };
        filas.push(fila);
        return fila;
    }
};
const campos = {
    fNumero: { value: '' }, fCliente: { value: '' }, fEstado: { value: '' }, fRuta: { value: '' }
};
let paginacion;
let criterio = {};
const SGTL = {
    tabla: {
        paginacion: function (_selector, opciones) { paginacion = opciones; },
        llenar: function () { filas.length = 0; },
        vacia: function () { filas.length = 0; }
    },
    valorRango: function () { return null; },
    fecha: function (valor) { return valor; },
    km: function (valor) { return valor; },
    monto: function (valor) { return valor; },
    conInfo: function (estado) { return estado; },
    accionesFila: function () { return ''; },
    botonFila: function () { return ''; }
};
const contexto = vm.createContext({
    SGTL,
    registros: [], filtrosAplicados: {}, paginaActual: 1, tamanioPagina: 15,
    ordenPresupuestos: { parametros: function () { return criterio; } },
    el: function (id) { return id === 'lista' ? cuerpo : campos[id]; },
    cambiosDe: function () { return []; },
    etiquetaEstado: function () { return ''; }
});
vm.runInContext([
    extraerFuncion('sinTildes'),
    extraerFuncion('cumpleFiltros'),
    extraerFuncion('viajeCancelado'),
    extraerFuncion('textoViajeCancelado'),
    extraerFuncion('ordenarPresupuestos'),
    extraerFuncion('dibujar'),
    extraerFuncion('buscar')
].join('\n'), contexto, { filename: 'presupuestos.js' });

function numeros() { return filas.map(function (fila) { return Number(fila.celdas[0].textContent); }); }
function dibujar(datos, orden, tamanio) {
    contexto.registros = datos;
    contexto.filtrosAplicados = {};
    contexto.paginaActual = 1;
    contexto.tamanioPagina = tamanio;
    criterio = orden;
    contexto.dibujar();
    return numeros();
}

const muestra = [
    { id: 21, fecha: '2026-04-03', cliente: 'Zulu', clienteId: 1, origen: 'Mendoza', destino: 'Bahía', distancia: '2', importe: '1000', estado: 'Pendiente' },
    { id: 3, fecha: '2026-01-09', cliente: 'Álamo', clienteId: 2, origen: 'Córdoba', destino: 'La Plata', distancia: '12', importe: '20', estado: 'Pendiente' },
    { id: 12, fecha: '2026-10-01', cliente: 'beta', clienteId: 2, origen: 'Mendoza', destino: 'Azul', distancia: '1.5', importe: '200', estado: 'Pendiente' },
    { id: 7, fecha: '2026-02-01', cliente: 'Ñandú', clienteId: 1, origen: 'Azul', destino: 'Rosario', distancia: '30', importe: '5', estado: 'Pendiente' }
];

assert.deepStrictEqual(dibujar(muestra, {}, 0), [21, 3, 12, 7], 'sin ordenar conserva el orden recibido');
const casos = [
    { columna: 'numero', ascendente: [3, 7, 12, 21] },
    { columna: 'fecha', ascendente: [3, 7, 21, 12] },
    { columna: 'cliente', ascendente: [3, 12, 7, 21] },
    { columna: 'ruta', ascendente: [7, 3, 12, 21] },
    { columna: 'km', ascendente: [12, 21, 3, 7] },
    { columna: 'importe', ascendente: [7, 3, 12, 21] }
];
casos.forEach(function (caso) {
    assert.deepStrictEqual(dibujar(muestra, { orden: caso.columna, direccion: 'asc' }, 0), caso.ascendente,
        caso.columna + ' ascendente');
    assert.deepStrictEqual(dibujar(muestra, { orden: caso.columna, direccion: 'desc' }, 0), [...caso.ascendente].reverse(),
        caso.columna + ' descendente');
});

const muchos = Array.from({ length: 17 }, function (_valor, indice) {
    const id = 17 - indice;
    return { id, fecha: '2026-01-01', cliente: 'Cliente ' + id, clienteId: id <= 8 ? 1 : 2,
        origen: 'Rosario', destino: 'Córdoba', distancia: String(id), importe: String(id), estado: 'Pendiente' };
});
assert.deepStrictEqual(dibujar(muchos, { orden: 'numero', direccion: 'asc' }, 15),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'se ordenan los 17 registros antes de paginar');
paginacion.alCambiarPagina(2);
assert.deepStrictEqual(numeros(), [16, 17], 'la segunda página continúa el orden global');

criterio = { orden: 'numero', direccion: 'desc' };
campos.fCliente.value = '1';
contexto.buscar();
assert.deepStrictEqual(numeros(), [8, 7, 6, 5, 4, 3, 2, 1], 'el filtro conserva el orden activo');
assert.strictEqual(paginacion.pagina, 1, 'buscar vuelve a la primera página');

console.log('OK: presupuestos ordena las seis columnas antes de paginar y conserva el orden al filtrar');
