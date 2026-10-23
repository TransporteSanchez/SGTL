// Datos de la empresa en los documentos (Gestionar empresa, 23/10): los PDF no tienen el nombre escrito, lo leen de
// la API con la fecha de emisión del documento (la API guarda versiones) y, si no pueden, no se arman. El logo de los
// documentos es el de la empresa, no el del sistema: restablecer la apariencia no cambia los comprobantes.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const leer = function (archivo) { return fs.readFileSync(path.join(raiz, archivo), 'utf8'); };

function probarSinNombreEscrito() {
    ['assets/static/js/factura-pdf.js', 'assets/static/js/proforma-pdf.js', 'assets/static/js/presupuesto-pdf.js',
        'assets/static/js/proformas-plataforma.js'].forEach(function (archivo) {
        assert.ok(!/S[aá]nchez/i.test(leer(archivo)), archivo + ' no debe tener escrito el nombre de la empresa');
    });
    ['assets/static/js/factura-pdf.js', 'assets/static/js/proforma-pdf.js', 'assets/static/js/presupuesto-pdf.js'].forEach(function (archivo) {
        assert.ok(leer(archivo).indexOf('GestionContenido') === -1,
            archivo + ' no debe tomar el logo de la apariencia del sistema: el de los documentos es el de la empresa');
    });
}

function probarPantallasCarganLosDatos() {
    [['cuenta-corriente-clientes.html', 'factura-pdf.js'], ['gestion-facturacion.html', 'proforma-pdf.js'],
        ['listado-facturas.html', 'proforma-pdf.js'], ['presupuestos.html', 'presupuesto-pdf.js']].forEach(function (par) {
        const html = leer(par[0]);
        const datos = html.indexOf('assets/static/js/empresa-datos.js');
        const pdf = html.indexOf('assets/static/js/' + par[1]);
        assert.ok(datos !== -1, par[0] + ' tiene que cargar empresa-datos.js');
        assert.ok(datos < pdf, par[0] + ' tiene que cargar empresa-datos.js antes de ' + par[1]);
    });
}

function cargarEmpresa(fetchFalso) {
    const sandbox = { window: {}, fetch: fetchFalso };
    vm.runInNewContext(leer('assets/static/js/empresa-datos.js'), sandbox, { filename: 'empresa-datos.js' });
    return sandbox.window.SGTLEmpresa;
}

function probarArmado() {
    const empresa = cargarEmpresa(null);
    const completa = empresa.armar({
        Razon_Social: 'Logística Andina S.R.L.', Nombre_Comercial: 'Andina Cargas', CUIT: '30715893424',
        Condicion_IVA: 'Responsable inscripto', Calle: 'Av. Faraday', AlturaCalle: '1234 ', Localidad: 'Córdoba',
        Provincia: 'Córdoba', CodigoPostal: '5000', Telefono: '3514123456', Email: 'administracion@andina.com.ar'
    });
    assert.strictEqual(completa.nombre, 'Andina Cargas', 'con nombre comercial, va en grande el nombre comercial');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(completa.lineas)), [
        'Logística Andina S.R.L.',
        'CUIT 30-71589342-4 · Responsable inscripto',
        'Av. Faraday 1234, Córdoba (CP 5000)',
        'Tel. 3514123456 · administracion@andina.com.ar'
    ], 'debajo van la razón social, CUIT y condición, domicilio (sin repetir provincia y localidad iguales) y contacto');

    assert.strictEqual(empresa.armar({ Razon_Social: 'X', Logo: 'data:image/png;base64,AAAA' }).logoOriginal, 'data:image/png;base64,AAAA',
        'el logo de los documentos viene con los datos de la empresa');

    const soloNombre = empresa.armar({ Razon_Social: 'Logística Andina S.R.L.' });
    assert.strictEqual(soloNombre.nombre, 'Logística Andina S.R.L.', 'sin nombre comercial, va la razón social');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(soloNombre.lineas)), [],
        'mientras no se completen los datos, el documento sale solo con el nombre, sin renglones vacíos');
    assert.strictEqual(soloNombre.logoOriginal, null, 'sin logo de la empresa, el documento va sin logo (nunca el del sistema)');
}

async function probarFechaDeEmision() {
    const pedidos = [];
    const empresa = cargarEmpresa(function (url) {
        pedidos.push(url);
        return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ Razon_Social: 'Logística Andina S.R.L.' }); } });
    });
    await empresa.obtener('2026-10-05T00:00:00');
    await empresa.obtener(null);
    assert.ok(/\/empresa\?fecha=2026-10-05$/.test(pedidos[0]), 'un documento emitido pide los datos de su fecha de emisión: ' + pedidos[0]);
    assert.ok(/\/empresa$/.test(pedidos[1]), 'un borrador pide los datos actuales: ' + pedidos[1]);
}

async function probarErrores() {
    const sinCargar = cargarEmpresa(function () {
        return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
    });
    await assert.rejects(sinCargar.obtener(null), /Gestionar empresa/, 'sin datos cargados, dice dónde completarlos');

    const sinConexion = cargarEmpresa(function () { return Promise.reject(new TypeError('Failed to fetch')); });
    await assert.rejects(sinConexion.obtener(null), function (error) {
        assert.strictEqual(error.message, 'No se pudieron leer los datos de la empresa para el PDF. Probá de nuevo.');
        return true;
    }, 'sin conexión, el PDF no se arma y el aviso no es técnico');
}

function probarPantallas() {
    // Cada id que busca el JS de la pantalla existe en su HTML.
    [['gestion-empresa.html', 'Gestionar empresa'], ['gestion-contenido.html', 'Gestionar contenido']].forEach(function (par) {
        const html = leer(par[0]);
        const patron = /(?:getElementById|campoEmpresa)\(\s*'([A-Za-z][\w-]*)'\s*\)/g;
        const faltan = [];
        let m;
        while ((m = patron.exec(html))) {
            if (m[1] !== 'gestionarContenidoBtn' && html.indexOf('id="' + m[1] + '"') === -1) faltan.push(m[1]);
        }
        assert.deepStrictEqual(faltan, [], par[0] + ' busca ids que no existen: ' + faltan.join(', '));
        assert.ok(html.indexOf('<title>' + par[1] + ' · SGTL</title>') !== -1, par[0] + ': la pestaña del navegador dice ' + par[1]);
    });
    // Sin datos cargados (404, instalación nueva) la pantalla muestra el formulario vacío, no un error ni un aviso: los
    // campos obligatorios ya dicen qué falta, y el script no crea una empresa a medias.
    const empresaHtml = leer('gestion-empresa.html');
    assert.ok(empresaHtml.indexOf('Faltan el CUIT') === -1, 'Gestionar empresa no tiene el aviso de datos incompletos');
    assert.ok(/error\.xhr\.status === 404\) return \{\}/.test(empresaHtml), 'sin datos cargados, Gestionar empresa arranca con el formulario vacío');
    assert.ok(!/INSERT INTO dbo\.EMPRESA/.test(leer('database/empresa/01_crear_empresa.sql')), 'el script no crea una empresa a medias');

    // Los datos de la empresa y la apariencia van en pantallas separadas: cada una con su logo.
    assert.ok(leer('gestion-empresa.html').indexOf('Logo para los documentos') !== -1, 'Gestionar empresa tiene el logo de los documentos');
    assert.ok(leer('gestion-contenido.html').indexOf('empresaRazonSocial') === -1, 'Gestionar contenido no tiene los datos de la empresa');

    // Configuración: Gestionar e-mail · Gestionar integración de WhatsApp · Gestionar empresa · Gestionar contenido.
    const menu = leer('assets/static/js/sidebar-loader.js');
    const configuracion = menu.slice(menu.indexOf('configuracion-menu'), menu.indexOf('</ul>', menu.indexOf('configuracion-menu')));
    const opciones = (configuracion.match(/class="submenu-link"[^>]*>([^<]+)</g) || []).map(function (o) { return o.replace(/.*>/, '').replace('<', ''); });
    assert.deepStrictEqual(opciones, ['Gestionar e-mail', 'Gestionar integración de WhatsApp', 'Gestionar empresa', 'Gestionar contenido'],
        'el orden de Configuración es el que eligió Rocío');
    assert.strictEqual((menu.match(/'configuracion-whatsapp\.html', 'gestion-contenido\.html', 'gestion-empresa\.html'/g) || []).length, 2,
        'Gestionar empresa es solo de administradores, como el resto de Configuración (está en las dos listas)');
    assert.ok(/'gestion de empresa': 'gestion-empresa\.html'/.test(menu), 'el permiso "Gestión de empresa" apunta a la pantalla');
    const grupos = leer('WebApi_TransporteSanchez/Controllers/GruposController.cs');
    assert.ok(/"Integración WhatsApp", "Gestión de empresa"/.test(grupos) && /\{ "gestion de empresa", "Configuración" \}/.test(grupos),
        'Gestión de empresa está en el catálogo de Grupos y permisos, en Configuración, como E-mail y WhatsApp');
}

async function ejecutar() {
    probarSinNombreEscrito();
    probarPantallasCarganLosDatos();
    probarArmado();
    await probarFechaDeEmision();
    await probarErrores();
    probarPantallas();
    console.log('OK: los documentos toman los datos de la empresa de Gestionar empresa, con la fecha de emisión');
}

ejecutar().catch(function (error) {
    console.error(error);
    process.exit(1);
});
