// Los permisos se prueban ejecutando el catálogo y el armado real de pestañas, sin llamar a la base compartida.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const raiz = path.join(__dirname, '..');
const leer = archivo => fs.readFileSync(path.join(raiz, archivo), 'utf8');

function crearEntorno(respuesta, opciones = {}) {
    const elementos = {};
    const errores = [];
    const redirecciones = [];
    const almacen = { 'sgtl-dashboard-v2-': opciones.disenoViejo || null };
    const contexto = {
        String, Object, JSON, Promise, console,
        localStorage: {
            getItem: clave => almacen[clave] || null,
            setItem: (clave, valor) => { almacen[clave] = valor; },
            removeItem: clave => { delete almacen[clave]; }
        },
        location: { replace: url => redirecciones.push(url) },
        document: {
            getElementById: id => elementos[id] || (elementos[id] = { innerHTML: '', addEventListener() {} }),
            querySelector: () => null
        },
        SGTL: {
            escapar: texto => String(texto),
            toastError: texto => errores.push(texto),
            ajax: solicitud => {
                if (opciones.error) return Promise.reject({ mensajeUsuario: 'No se pudieron cargar los tableros.' });
                if (solicitud.type === 'PUT') {
                    respuesta.Personalizado = true;
                    respuesta.Favoritos = JSON.parse(solicitud.data).Favoritos;
                }
                return Promise.resolve(respuesta);
            }
        }
    };
    contexto.window = contexto;
    vm.runInNewContext(leer('assets/static/js/tableros-catalogo.js'), contexto);
    const pagina = leer('tableros.html');
    vm.runInNewContext(pagina.slice(pagina.indexOf('var CLAVE_PESTANA ='), pagina.indexOf('// La última pestaña')), contexto);
    return { contexto, T: contexto.SGTLTableros, elementos, errores, redirecciones };
}

async function probar() {
    let e = crearEntorno({ TemasPermitidos: ['flota'], Personalizado: false, Favoritos: [] });
    let favoritos = await e.T.leerFavoritos();
    assert.deepStrictEqual(Array.from(favoritos.lista, t => t.id), ['kpikm', 'camiones', 'itv', 'kmmes', 'kmcamion'],
        'el diseño inicial debe contener solo tableros de Flota');
    assert.deepStrictEqual(Array.from(e.T.temasPermitidos(), t => t.id), ['flota']);
    await e.contexto.armarTableros();
    assert.ok(e.elementos.tablerosPestanas.innerHTML.includes('id="tab-flota"'));
    assert.ok(!e.elementos.tablerosPestanas.innerHTML.includes('id="tab-viajes"'));
    assert.ok(!e.elementos.tablerosPaneles.innerHTML.includes('costo-promedio-texto'));

    e = crearEntorno({ TemasPermitidos: ['choferes', 'viajes'], Personalizado: true,
        Favoritos: [{ Tablero: 'kmchofer' }, { Tablero: 'facturacionmes' }, { Tablero: 'kpiviajes' }] });
    favoritos = await e.T.leerFavoritos();
    assert.deepStrictEqual(Array.from(favoritos.lista, t => t.id), ['kmchofer', 'kpiviajes'],
        'un favorito guardado de una sección restringida no debe dibujarse');
    assert.deepStrictEqual(Array.from(e.T.temasPermitidos(), t => t.id), ['viajes', 'choferes'],
        'el orden de los permisos no debe alterar el orden de las pestañas');

    e = crearEntorno({ TemasPermitidos: ['choferes'], Personalizado: false, Favoritos: [] }, {
        disenoViejo: JSON.stringify({ items: [{ id: 'facturacionmes' }, { id: 'kmchofer' }], hidden: [] })
    });
    favoritos = await e.T.leerFavoritos();
    assert.ok(favoritos.lista.length > 0 && favoritos.lista.every(t => e.T.tablero(t.id).tema === 'choferes'),
        'el diseño viejo del navegador tampoco debe permitir recuperar secciones restringidas');

    const permisosCambiantes = { TemasPermitidos: ['flota'], Personalizado: false, Favoritos: [] };
    e = crearEntorno(permisosCambiantes, {
        disenoViejo: JSON.stringify({ items: [{ id: 'camiones' }, { id: 'topclientes' }], hidden: [] })
    });
    favoritos = await e.T.leerFavoritos();
    await e.T.guardarFavoritos(favoritos.lista);
    permisosCambiantes.TemasPermitidos.push('facturacion');
    favoritos = await e.T.leerFavoritos();
    assert.ok(favoritos.lista.some(t => t.id === 'topclientes'),
        'guardar Flota debe conservar el favorito antiguo de Facturación pendiente de migrar y recuperarlo al devolver el permiso');

    e = crearEntorno({ TemasPermitidos: ['flota', 'facturacion'], Personalizado: true, Favoritos: [] }, {
        disenoViejo: JSON.stringify({ items: [{ id: 'topclientes' }], hidden: [] })
    });
    favoritos = await e.T.leerFavoritos();
    assert.strictEqual(favoritos.lista.length, 0,
        'una personalización del servidor ya elegida prevalece sobre un diseño antiguo sin migración parcial');

    e = crearEntorno({ TemasPermitidos: [], Personalizado: false, Favoritos: [] });
    assert.strictEqual(await e.contexto.armarTableros(), false);
    assert.deepStrictEqual(e.redirecciones, ['index.html'], 'sin secciones no se puede abrir Tableros por URL');
    const inicio = leer('index.html');
    vm.runInNewContext(inicio.slice(inicio.indexOf('function botonAgregar('), inicio.indexOf('function mostrarVacio(')), e.contexto);
    assert.ok(e.contexto.botonAgregar().includes('aria-disabled="true"'),
        'sin secciones, Agregar tableros debe quedar deshabilitado aunque el menú lateral todavía esté cargando');

    e = crearEntorno(null, { error: true });
    favoritos = await e.T.leerFavoritos();
    assert.strictEqual(favoritos.lista.length, 0, 'un error de permisos nunca debe mostrar el diseño completo como alternativa');
    assert.strictEqual(e.T.temasPermitidos().length, 0);
    assert.strictEqual(e.errores.length, 1, 'el error se debe informar con el aviso compartido');

    const sidebar = leer('assets/static/js/sidebar-loader.js');
    const menus = {};
    vm.runInNewContext(sidebar.slice(sidebar.indexOf('var MENU_TO_PAGE ='), sidebar.indexOf('function normalizaPerm(')), menus);
    ['viajes', 'flota', 'choferes', 'facturacion'].forEach(tema => {
        assert.strictEqual(menus.MENU_TO_PAGE['tableros de ' + tema], 'tableros.html', 'cualquier sección habilita la pantalla');
    });
    assert.strictEqual(menus.MENU_TO_PAGE.tableros, undefined, 'el permiso general anterior ya no da acceso');

    const dashboard = leer('assets/static/js/dashboard.js');
    const consultaRanking = [];
    const contextoRanking = {
        el: () => ({}),
        pedir: url => { consultaRanking.push({ url, token: false }); return { done: () => ({ fail() {} }) }; },
        pedirConSesion: url => { consultaRanking.push({ url, token: true }); return { done: () => ({ fail() {} }) }; }
    };
    vm.runInNewContext(dashboard.slice(dashboard.indexOf('function cargarTopClientes('), dashboard.indexOf('// ---------------------------------------------------------------- Para revisar')), contextoRanking);
    contextoRanking.cargarTopClientes();
    assert.deepStrictEqual(consultaRanking, [{ url: '/tableros/top-clientes-facturacion', token: true }],
        'el ranking debe consultar el endpoint protegido de Tableros con la sesión');

    // Ejecutar la resolución C# real, con grupos controlados y sin dependencias de SQL ni de Entity Framework.
    const helper = path.join(raiz, 'WebApi_TransporteSanchez', 'Security', 'PermisosTableros.cs');
    const script = `
$ErrorActionPreference = 'Stop'
Add-Type -Path '${helper.replace(/'/g, "''")}'
$p = [WebApi_TransporteSanchez.Security.PermisosTableros]
$resultado = @{
  Admin = @($p::TemasPara($true, $false, [string[]]@()))
  Chofer = @($p::TemasPara($false, $true, [string[]]@('Tableros de viajes')))
  Viejo = @($p::TemasPara($false, $false, [string[]]@('Tableros')))
  Operativos = @($p::TemasPara($false, $false, [string[]]@('Gestión de viajes', 'Cuenta Corriente', 'Gestión de proformas')))
  Varios = @($p::TemasPara($false, $false, [string[]]@('Tableros de choferes', ' TABLEROS DE FACTURACION ', 'Tableros de choferes')))
  Flota = @($p::TablerosPara([string[]]@('flota')))
  Tema = $p::TemaDeTablero('facturacionmes')
  Desconocido = $p::TemaDeTablero('inventado')
  Todos = @($p::TablerosPara([string[]]@('viajes', 'flota', 'choferes', 'facturacion')) | ForEach-Object {
    @{ Id = $_; Tema = $p::TemaDeTablero($_) }
  })
}
$resultado | ConvertTo-Json -Compress
`;
    const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8' });
    assert.strictEqual(r.status, 0, r.stdout + r.stderr);
    const resultado = JSON.parse(r.stdout.trim());
    assert.deepStrictEqual(resultado.Admin, ['viajes', 'flota', 'choferes', 'facturacion']);
    assert.deepStrictEqual(resultado.Chofer, []);
    assert.deepStrictEqual(resultado.Viejo, []);
    assert.deepStrictEqual(resultado.Operativos, []);
    assert.deepStrictEqual(resultado.Varios, ['choferes', 'facturacion']);
    assert.deepStrictEqual(resultado.Flota.sort(), ['camiones', 'kpikm', 'itv', 'kmmes', 'kmcamion', 'kmcamionmes', 'ingresoscamionmes'].sort());
    assert.strictEqual(resultado.Tema, 'facturacion');
    assert.strictEqual(resultado.Desconocido, null);
    assert.strictEqual(resultado.Todos.length, e.T.CATALOGO.length, 'el catálogo de la API y el de tarjetas deben coincidir');
    resultado.Todos.forEach(tablero => {
        assert.strictEqual(e.T.tablero(tablero.Id).tema, tablero.Tema, 'la API debe autorizar cada tarjeta por el mismo tema que la pantalla');
    });

    // Ejecutar la consulta real de borrado con los parámetros autorizados; no debe borrar favoritos restringidos.
    const controlador = leer('WebApi_TransporteSanchez/Controllers/TablerosController.cs');
    const borrado = controlador.match(/new SqlCommand\("(DELETE FROM dbo\.TABLEROS_FAVORITOS[^"\n]+)" \+ parametros \+ "([^"\n]+)"/);
    assert.ok(borrado, 'el guardado debe reemplazar solo las claves autorizadas');
    const db = new DatabaseSync(':memory:');
    try {
        db.exec(`ATTACH DATABASE ':memory:' AS dbo;
            CREATE TABLE dbo.TABLEROS_FAVORITOS (Usuario_ID INTEGER, Tablero TEXT);
            INSERT INTO dbo.TABLEROS_FAVORITOS VALUES (1, 'camiones'), (1, 'topclientes'), (2, 'camiones');`);
        const parametros = { '@usuario': 1 };
        const nombres = resultado.Flota.map((id, i) => { parametros['@tablero' + i] = id; return '@tablero' + i; });
        db.prepare(borrado[1] + nombres.join(', ') + borrado[2]).run(parametros);
        assert.deepStrictEqual(db.prepare('SELECT Usuario_ID, Tablero FROM dbo.TABLEROS_FAVORITOS ORDER BY Usuario_ID').all()
            .map(f => [f.Usuario_ID, f.Tablero]), [[1, 'topclientes'], [2, 'camiones']],
            'guardar Flota debe conservar el favorito de Facturación y los de otro usuario');
    } finally { db.close(); }
    console.log('OK: Tableros respeta los permisos por sección en pestañas, favoritos y API');
}
probar().catch(error => { console.error(error); process.exitCode = 1; });
