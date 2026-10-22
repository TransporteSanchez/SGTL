const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'static', 'js', 'components', 'sidebar.js'),
    'utf8'
);
const paginaCuentaCorriente = fs.readFileSync(
    path.join(__dirname, '..', 'cuenta-corriente-clientes.html'),
    'utf8'
);

function ordenDeCarga(html, archivo) {
    const posicion = html.indexOf('src="' + archivo + '"');
    assert.notStrictEqual(posicion, -1, 'falta cargar ' + archivo);
    return posicion;
}

function crearListaClases(iniciales) {
    const clases = new Set(iniciales || []);
    return {
        add: function (clase) { clases.add(clase); },
        remove: function (clase) { clases.delete(clase); },
        contains: function (clase) { return clases.has(clase); },
        toggle: function (clase, forzar) {
            if (forzar === undefined) forzar = !clases.has(clase);
            if (forzar) clases.add(clase);
            else clases.delete(clase);
            return forzar;
        }
    };
}

function crearEscenario(conControladorDelTema, menuDisponibleAlCargar) {
    const eventosEnlace = [];
    let menuDisponible = menuDisponibleAlCargar !== false;
    const enlace = {
        dataset: {},
        offsetHeight: 40,
        addEventListener: function (tipo, manejador) {
            eventosEnlace.push({ tipo: tipo, manejador: manejador });
        }
    };
    const submenu = {
        classList: crearListaClases(),
        style: { setProperty: function () {} },
        scrollHeight: 40,
        querySelectorAll: function (selector) { return selector === '.submenu-link' ? [enlace] : []; }
    };
    const item = {
        classList: crearListaClases(),
        querySelector: function (selector) {
            return selector === '.submenu' ? submenu : selector === '.sidebar-link' ? enlace : null;
        },
        querySelectorAll: function (selector) {
            return selector === '.submenu-link' ? [enlace] : [];
        }
    };
    const sidebar = {
        classList: crearListaClases(),
        querySelectorAll: function (selector) {
            if (selector === '.sidebar-link') return menuDisponible ? [enlace] : [];
            return selector === '.sidebar-item.has-sub' && menuDisponible ? [item] : [];
        }
    };
    const document = {
        readyState: 'loading',
        head: { appendChild: function () {} },
        body: { classList: crearListaClases() },
        getElementById: function (id) { return id === 'sidebar' ? sidebar : null; },
        addEventListener: function () {},
        createElement: function () { return { style: {}, classList: crearListaClases(), addEventListener: function () {} }; }
    };
    const window = {
        innerWidth: 1280,
        addEventListener: function () {}
    };
    if (conControladorDelTema) window.sidebar = {};

    vm.runInNewContext(fuente, { window: window, document: document });
    menuDisponible = true;
    window.initializeSidebar();
    return eventosEnlace;
}

function ejecutar() {
    const app = ordenDeCarga(paginaCuentaCorriente, 'assets/compiled/js/app.js');
    const componente = ordenDeCarga(paginaCuentaCorriente, 'assets/static/js/components/sidebar.js');
    const cargador = ordenDeCarga(paginaCuentaCorriente, 'assets/static/js/sidebar-loader.js');
    assert.ok(
        app < componente && componente < cargador,
        'Cuenta Corriente debe cargar el menú con la misma secuencia que las otras pantallas'
    );
    assert.ok(
        crearEscenario(true).every(function (evento) { return evento.tipo !== 'click'; }),
        'el componente compartido no debe duplicar el clic si el tema ya controla el sidebar'
    );
    assert.strictEqual(
        crearEscenario(false).filter(function (evento) { return evento.tipo === 'click'; }).length,
        1,
        'el componente compartido debe controlar el clic cuando el tema no inicializó el sidebar'
    );
    assert.strictEqual(
        crearEscenario(true, false).filter(function (evento) { return evento.tipo === 'click'; }).length,
        1,
        'el componente compartido debe controlar el menú si el tema se inició antes de que éste se renderizara'
    );

    console.log('OK: el sidebar conserva un único controlador de submenús.');
}

ejecutar();
