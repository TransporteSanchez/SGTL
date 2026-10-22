const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'static', 'js', 'sidebar-loader.js'),
    'utf8'
);
const inicio = fuente.indexOf('function buildFallbackSidebarHtml()');
const fin = fuente.indexOf('\n  // ===================== RBAC:', inicio);

assert.notStrictEqual(inicio, -1, 'debe existir el generador del menú lateral');
assert.notStrictEqual(fin, -1, 'debe poder aislarse el generador del menú lateral');

const sandbox = {};
vm.runInNewContext(fuente.slice(inicio, fin), sandbox, { filename: 'sidebar-loader.js' });

const menu = sandbox.buildFallbackSidebarHtml();

assert.match(
    menu,
    /href="configuracion-facturacion\.html" class="submenu-link">Gestionar tipos de comprobante<\/a>/,
    'Configuración muestra Gestionar tipos de comprobante (§3.1: verbo en infinitivo)'
);
assert.doesNotMatch(
    menu,
    /href="configuracion-facturacion\.html" class="submenu-link">Gestionar facturación<\/a>/,
    'Configuración no debe presentar esta pantalla como Gestionar facturación'
);

// Desde el 22/10 la opción es la última de Facturación (solo para administradores) y ya no está en Configuración.
const seccionFacturacion = menu.slice(menu.indexOf('<span>Facturación</span>'), menu.indexOf('</ul>', menu.indexOf('<span>Facturación</span>')));
const seccionConfiguracion = menu.slice(menu.indexOf('<span>Configuración</span>'), menu.indexOf('</ul>', menu.indexOf('<span>Configuración</span>')));
const opciones = seccionFacturacion.match(/class="submenu-link">[^<]*/g).map(function (o) { return o.replace('class="submenu-link">', ''); });
assert.strictEqual(opciones[opciones.length - 1], 'Gestionar tipos de comprobante',
    'Gestionar tipos de comprobante es la última opción de Facturación');
assert.match(seccionFacturacion, /<li class="submenu-item solo-admin"><a href="configuracion-facturacion\.html"/,
    'la opción sigue siendo solo para administradores');
assert.doesNotMatch(seccionConfiguracion, /configuracion-facturacion\.html/,
    'la opción ya no está en Configuración');
console.log('OK: Gestionar tipos de comprobante es la última opción de Facturación, solo para administradores.');
