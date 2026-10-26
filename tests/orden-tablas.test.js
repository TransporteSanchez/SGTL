const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'assets', 'static', 'js', 'sgtl-ui.js'), 'utf8');

function columna(campo, texto) {
    const atributosTh = {};
    const atributosBoton = { 'data-sgtl-orden': campo };
    const icono = { className: 'bi bi-arrow-down-up ms-1' };
    const th = {
        setAttribute: function (nombre, valor) { atributosTh[nombre] = valor; },
        removeAttribute: function (nombre) { delete atributosTh[nombre]; },
        getAttribute: function (nombre) { return atributosTh[nombre]; }
    };
    const boton = {
        textContent: texto,
        getAttribute: function (nombre) { return atributosBoton[nombre]; },
        setAttribute: function (nombre, valor) { atributosBoton[nombre] = valor; },
        querySelector: function (selector) { return selector === 'i' ? icono : null; },
        closest: function (selector) { return selector === 'th' ? th : null; },
        addEventListener: function (tipo, accion) { if (tipo === 'click') this.alHacerClick = accion; },
        click: function () { this.alHacerClick(); }
    };
    return { boton, th, icono };
}

const apellido = columna('apellidoNombre', 'Apellido y nombre');
const dni = columna('dni', 'DNI');
const fecha = columna('fechaAlta', 'Fecha de alta');
const botones = [apellido.boton, dni.boton, fecha.boton];
const tabla = {
    querySelectorAll: function (selector) {
        assert.strictEqual(selector, 'th button[data-sgtl-orden]');
        return botones;
    }
};
const window = {};
const document = {
    querySelector: function (selector) { return selector === '#tablaChoferes' ? tabla : null; },
    addEventListener: function () {},
    documentElement: { hasAttribute: function () { return false; }, setAttribute: function () {} }
};
vm.runInNewContext(fuente, { window, document, Intl, setTimeout, clearTimeout }, { filename: 'sgtl-ui.js' });

let cambios = 0;
const orden = window.SGTL.tabla.habilitarOrden('#tablaChoferes', function () { cambios += 1; });
assert.strictEqual(JSON.stringify(orden.parametros()), '{}', 'al entrar conserva el orden inicial de la API');
assert.strictEqual(apellido.th.getAttribute('aria-sort'), undefined, 'sin orden no se anuncia ninguna columna');

apellido.boton.click();
assert.strictEqual(JSON.stringify(orden.parametros()), '{"orden":"apellidoNombre","direccion":"asc"}');
assert.strictEqual(apellido.th.getAttribute('aria-sort'), 'ascending');
assert.strictEqual(apellido.icono.className, 'bi bi-arrow-up ms-1');
assert.strictEqual(apellido.boton.getAttribute('aria-label'), 'Ordenar por Apellido y nombre en orden descendente');

apellido.boton.click();
assert.strictEqual(JSON.stringify(orden.parametros()), '{"orden":"apellidoNombre","direccion":"desc"}');
assert.strictEqual(apellido.th.getAttribute('aria-sort'), 'descending');
assert.strictEqual(apellido.icono.className, 'bi bi-arrow-down ms-1');

dni.boton.click();
assert.strictEqual(JSON.stringify(orden.parametros()), '{"orden":"dni","direccion":"asc"}', 'otra columna empieza en ascendente');
assert.strictEqual(apellido.th.getAttribute('aria-sort'), undefined, 'solo una columna queda ordenada');
assert.strictEqual(dni.th.getAttribute('aria-sort'), 'ascending');
assert.strictEqual(fecha.th.getAttribute('aria-sort'), undefined);
assert.strictEqual(cambios, 3, 'cada cambio de orden pide una búsqueda nueva');

console.log('OK: los encabezados alternan ascendente y descendente e informan el orden activo');
