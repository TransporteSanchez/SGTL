const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const raiz = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(raiz, 'assets/static/js/sgtl-ui.js'), 'utf8');
const fuente = fs.readFileSync(path.join(raiz, 'assets/static/js/cuenta-corriente-clientes.js'), 'utf8');
const campos = ['cliente', 'comprobante', 'concepto', 'fecha', 'total', 'cancelado', 'saldo'];
function extraer(nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.ok(inicio >= 0, nombre);
    let nivel = 0;
    for (let i = fuente.indexOf('{', inicio); i < fuente.length; i++) {
        if (fuente[i] === '{') nivel++;
        if (fuente[i] === '}' && --nivel === 0) return fuente.slice(inicio, i + 1);
    }
}
function crearBoton(campo, texto) {
    const atributos = { 'data-sgtl-orden': campo }, th = {}, icono = {};
    return { campo, texto, th, icono, textContent: texto,
        getAttribute: n => atributos[n], setAttribute(n, v) { atributos[n] = v; },
        closest: () => ({ setAttribute(n, v) { th[n] = v; }, removeAttribute(n) { delete th[n]; } }),
        querySelector: () => icono, addEventListener(e, fn) { this[e] = fn; } };
}
async function probar() {
    let botones = [], general = true;
    const nodos = { ccTablaCuerpo: { innerHTML: '' } };
    const peticiones = [], errores = [];
    ['Desde', 'Hasta', 'Tipo', 'Estado'].forEach(c => { nodos['cc' + c] = { value: '' }; });
    nodos.ccTablaCabecera = { set innerHTML(html) {
        botones = [...html.matchAll(/data-sgtl-orden="([^"]+)">([^<]+)/g)].map(m => crearBoton(m[1], m[2]));
    } };
    const tabla = { querySelectorAll: () => botones };
    const document = { querySelector: s => s === '#ccTabla' ? tabla : null, addEventListener() {},
        documentElement: { hasAttribute() { return false; }, setAttribute() {} } };
    const window = {};
    vm.runInNewContext(ui, { window, document, Intl, setTimeout, clearTimeout });
    const items = [
        { ComprobanteID: 1, Cliente: 'Zeta', Comprobante: 'FAC-1', Concepto: 'Z', Fecha: '2026-10-01', Debe: 100, Cancelado: 20, Saldo: 80,
            Aplicaciones: [{ ComprobanteID: 4, Comprobante: 'REC-4', Fecha: '2026-10-02', Importe: 20 }] },
        { ComprobanteID: 2, Cliente: 'Alfa', Comprobante: 'FAC-2', Concepto: 'A', Fecha: '2026-09-30', Debe: 2, Cancelado: 0, Saldo: 2 },
        { ComprobanteID: 3, Cliente: 'Medio', Comprobante: 'FAC-3', Concepto: 'M', Fecha: '2026-10-03', Debe: 10, Cancelado: 4, Saldo: 6 }
    ];
    const propiedades = { cliente: 'Cliente', comprobante: 'Comprobante', concepto: 'Concepto', fecha: 'Fecha', total: 'Debe', cancelado: 'Cancelado', saldo: 'Saldo' };
    const c = { window, URLSearchParams, paginaActual: 1, tamanioPagina: 2, secuenciaCargaCuenta: 0, ordenMovimientos: null,
        movimientos: [], pendientes: [], resumen: null, paginacionMovimientos: {},
        esConsultaGeneral: () => general, clienteActual: () => general ? null : { ClienteID: 7 },
        porId: id => nodos[id], fecha: v => v, escapar: v => v, dinero: v => String(v),
        badgeEstado: () => '', accionesComprobante: () => '', mostrarCarga() {}, mostrarError: e => errores.push(e),
        renderTodo() { c.renderMovimientos(); },
        apiGet(ruta) {
            peticiones.push(ruta);
            if (!ruta.includes('?')) return Promise.resolve(ruta.endsWith('pendientes') ? [] : {});
            const parametros = new URLSearchParams(ruta.split('?')[1]);
            const filas = items.slice();
            const campo = parametros.get('orden'), sentido = parametros.get('direccion') === 'desc' ? -1 : 1;
            if (campo) filas.sort((a, b) => {
                const va = a[propiedades[campo]], vb = b[propiedades[campo]];
                return (typeof va === 'number' ? va - vb : va.localeCompare(vb)) * sentido || a.ComprobanteID - b.ComprobanteID;
            });
            const tamanio = Number(parametros.get('pageSize')), inicio = (Number(parametros.get('page')) - 1) * tamanio;
            return Promise.resolve({ items: tamanio ? filas.slice(inicio, inicio + tamanio) : filas, total: filas.length, totalPages: 2 });
        }
    };
    vm.createContext(c);
    vm.runInContext(['agregarOrdenMovimientos', 'parametrosMovimientos', 'cargarCuenta', 'encabezadoMovimiento',
        'renderMovimientos', 'parametrosMovimientosParaExportar', 'obtenerMovimientosParaExportar',
        'datosListadoMovimientos', 'datosListadoMovimientosExcel'].map(extraer).join('\n'), c);
    const tick = () => new Promise(setImmediate);
    const ultima = () => new URLSearchParams(peticiones.filter(r => r.includes('?')).at(-1).split('?')[1]);
    await c.cargarCuenta();
    assert.strictEqual(ultima().has('orden'), false, 'al entrar conserva el orden inicial');
    assert.deepStrictEqual(botones.map(b => b.campo), campos);
    for (const campo of campos) {
        for (const direccion of ['asc', 'desc']) {
            botones.find(b => b.campo === campo).click();
            await tick();
            assert.strictEqual(ultima().get('orden'), campo);
            assert.strictEqual(ultima().get('direccion'), direccion);
            assert.strictEqual(ultima().get('page'), '1');
            const activo = botones.find(b => b.campo === campo);
            assert.strictEqual(activo.th['aria-sort'], direccion === 'asc' ? 'ascending' : 'descending');
            assert.strictEqual(activo.icono.className, 'bi bi-arrow-' + (direccion === 'asc' ? 'up' : 'down') + ' ms-1');
            assert.strictEqual(botones.filter(b => b.th['aria-sort']).length, 1);
        }
    }
    await c.cargarCuenta(2);
    assert.strictEqual(ultima().get('orden'), 'saldo');
    assert.strictEqual(ultima().get('direccion'), 'desc');
    assert.strictEqual(ultima().get('page'), '2');
    nodos.ccTipo.value = 'FAC';
    await c.cargarCuenta(1);
    assert.strictEqual(ultima().get('tipo'), 'FAC');
    assert.strictEqual(ultima().get('orden'), 'saldo');
    const exportados = await c.obtenerMovimientosParaExportar();
    assert.strictEqual(ultima().get('pageSize'), '0');
    assert.strictEqual(ultima().get('direccion'), 'desc');
    assert.deepStrictEqual(exportados.map(x => x.ComprobanteID), [1, 3, 2]);
    for (const funcion of ['datosListadoMovimientos', 'datosListadoMovimientosExcel']) {
        const datos = c[funcion](exportados);
        const comprobante = datos.cabecera.indexOf('Comprobante');
        assert.deepStrictEqual(Array.from(datos.filas, f => f[comprobante]), ['FAC-1', 'REC-4', 'FAC-3', 'FAC-2'],
            'la exportación conserva los grupos y el orden de los comprobantes principales');
    }
    const posicionPadre = nodos.ccTablaCuerpo.innerHTML.indexOf('FAC-1');
    assert.ok(nodos.ccTablaCuerpo.innerHTML.indexOf('REC-4') > posicionPadre, 'las aplicaciones permanecen con su comprobante');
    general = false;
    await c.cargarCuenta(1);
    assert.ok(peticiones.some(r => r.startsWith('/clientes/7/cuenta-corriente?')));
    assert.deepStrictEqual(botones.map(b => b.campo), campos.slice(1), 'con un cliente, se oculta solo su columna');
    assert.strictEqual(ultima().get('orden'), 'saldo');
    assert.deepStrictEqual(errores, []);

    const solicitudes = [];
    c.apiGet = ruta => new Promise((resolve, reject) => solicitudes.push({ ruta, resolve, reject }));
    const vieja = c.cargarCuenta(1), nueva = c.cargarCuenta(2);
    solicitudes[3].resolve({});
    solicitudes[4].resolve({ items: [items[2]], total: 3, totalPages: 2 });
    solicitudes[5].resolve([]);
    await nueva;
    solicitudes[0].resolve({});
    solicitudes[1].resolve({ items: [items[0]], total: 3, totalPages: 2 });
    solicitudes[2].resolve([]);
    await vieja;
    assert.strictEqual(c.movimientos[0].ComprobanteID, 3, 'una respuesta anterior no reemplaza el orden o la página actual');
    console.log('OK: siete encabezados ordenables con flechas, filtros, paginación, exportaciones y grupos de aplicaciones');
}
probar().catch(error => { console.error(error); process.exitCode = 1; });
