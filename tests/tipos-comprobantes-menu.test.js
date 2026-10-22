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

console.log('OK: Configuración identifica la pantalla como Gestionar tipos de comprobante.');
