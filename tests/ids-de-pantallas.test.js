// Cada id que el JS de una pantalla busca (porId('x'), el('x'), getElementById('x')) tiene que existir en su HTML
// o en el HTML que arma el propio JS. Ataja errores como 'recibofacturas' por 'reciboFacturas' (merge del 22/10),
// que la pantalla mostraba como "No se pudieron cargar las facturas pendientes." sin nada en la consola.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const leer = function (archivo) { return fs.readFileSync(path.join(raiz, archivo), 'utf8'); };

const pantallas = [
    { html: 'cuenta-corriente-clientes.html', js: 'assets/static/js/cuenta-corriente-clientes.js' },
    { html: 'presupuestos.html', js: 'assets/static/js/presupuestos.js' }
];

pantallas.forEach(function (p) {
    const html = leer(p.html);
    const js = leer(p.js);
    const buscados = new Set();
    const patron = /(?:porId|\bel|getElementById)\(\s*'([A-Za-z][\w-]*)'\s*\)/g;
    let m;
    while ((m = patron.exec(js))) buscados.add(m[1]);
    const faltan = Array.from(buscados).filter(function (id) {
        const enHtml = html.indexOf('id="' + id + '"') !== -1;
        const armadoEnJs = js.indexOf('id="' + id + '"') !== -1 || js.indexOf("id='" + id + "'") !== -1;
        return !enHtml && !armadoEnJs;
    });
    assert.deepStrictEqual(faltan, [], p.js + ' busca ids que no existen en ' + p.html + ': ' + faltan.join(', '));
});

console.log('OK: los ids que busca cada pantalla existen en su HTML');
