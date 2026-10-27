// Hoja de ruta del chofer (24/10): lo que ve y puede hacer el chofer, que la API saque el chofer del token y que el
// login vuelva solo a una pantalla del sistema.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const leer = function (archivo) { return fs.readFileSync(path.join(raiz, archivo), 'utf8'); };

// ---------------------------------------------------------------- Pantalla (assets/static/js/hoja-de-ruta.js)

const sandbox = { String: String, Number: Number, Math: Math, Date: Date, Promise: Promise, document: {} };
sandbox.window = sandbox;
vm.runInNewContext(leer('assets/static/js/hoja-de-ruta.js'), sandbox, { filename: 'hoja-de-ruta.js' });
const H = sandbox.SGTLHojaDeRuta;

assert.strictEqual(H.tituloDia('2026-10-24T06:00:00', '2026-10-24T00:00:00'), 'Hoy · sábado 24/10/2026');
assert.strictEqual(H.tituloDia('2026-10-25T06:00:00', '2026-10-24T00:00:00'), 'Mañana · domingo 25/10/2026');
assert.strictEqual(H.tituloDia('2026-10-23T06:00:00', '2026-10-24T00:00:00'), 'Ayer · viernes 23/10/2026');
assert.strictEqual(H.tituloDia('2026-10-26T06:00:00', '2026-10-24T00:00:00'), 'Lunes 26/10/2026');

const grupos = H.agruparPorDia([
    { Viaje_ID: 1, Fecha_Inicio: '2026-10-24T06:00:00' },
    { Viaje_ID: 2, Fecha_Inicio: '2026-10-24T15:00:00' },
    { Viaje_ID: 3, Fecha_Inicio: '2026-10-25T05:00:00' }
]);
assert.strictEqual(grupos.length, 2, 'un grupo por día de inicio');
assert.strictEqual(grupos[0].viajes.length, 2);

assert.strictEqual(H.horario({ Fecha_Inicio: '2026-10-24T06:00:00', Fecha_Fin: '2026-10-24T14:30:00' }), '06:00 a 14:30');
assert.strictEqual(H.horario({ Fecha_Inicio: '2026-10-24T22:00:00', Fecha_Fin: '2026-10-25T06:15:00' }), '22:00 a 06:15 del 25/10/2026',
    'si termina otro día, se dice qué día');

function viaje(cambios) {
    return Object.assign({ Viaje_ID: 48, Estado: 'Registrado', Tipo_Cliente: 'Directo', Tiene_Evidencia: false, EnProforma_Estado: '', EnProforma_Numero: '' }, cambios);
}
let a = H.accionesDe(viaje({}));
assert.strictEqual(a.paso.accion, 'iniciar', 'un directo registrado se inicia');
assert.strictEqual(a.paso.motivo, '');
assert.strictEqual(a.reemplazar, false, 'antes de salir no se carga evidencia');
a = H.accionesDe(viaje({ Estado: 'En_viaje' }));
assert.strictEqual(a.paso.accion, 'entregar', 'un directo en viaje registra la entrega (con la evidencia, obligatoria)');
a = H.accionesDe(viaje({ Estado: 'Entregado', Tiene_Evidencia: true }));
assert.strictEqual(a.paso, null);
assert.strictEqual(a.reemplazar, true, 'entregado: solo puede reemplazar la evidencia');
assert.ok(a.ver);
a = H.accionesDe(viaje({ Estado: 'Entregado', Tiene_Evidencia: false }));
assert.ok(a.paso === null && a.reemplazar === false, 'un viaje pasado nunca ofrece subir evidencia (la carga la oficina)');
a = H.accionesDe(viaje({ Estado: 'Facturado', Tiene_Evidencia: true }));
assert.ok(a.paso === null && a.reemplazar === false, 'facturado: ya no se toca');
a = H.accionesDe(viaje({ Tipo_Cliente: 'Con_plataforma' }));
assert.ok(a.paso === null && a.reemplazar === false, 'con plataforma: el chofer solo mira (la entrega va a Rukas)');
assert.ok(/plataforma del cliente/.test(a.nota));
a = H.accionesDe(viaje({ Tipo_Cliente: 'Con_plataforma', Estado: 'Listo_para_facturar', Tiene_Evidencia: true }));
assert.strictEqual(a.reemplazar, false);
a = H.accionesDe(viaje({ EnProforma_Estado: 'Generada', EnProforma_Numero: 'PF-00000014' }));
assert.strictEqual(a.paso.motivo, 'No se puede iniciar el viaje: está en la proforma PF-00000014',
    'lo que no se puede hacer queda deshabilitado con el motivo (§1.4)');

// Gastos (control interno): desde el día que empieza el viaje, también con plataforma y entregado; no facturado.
// Por qué un viaje de otro día sigue en "Hoy y próximos" (Rocío, 24/10).
assert.strictEqual(H.atraso({ Estado: 'Registrado', Tipo_Cliente: 'Directo', Fecha_Inicio: '2026-10-23T06:00:00' }, '2026-10-24T00:00:00'), 'Quedó sin iniciar');
assert.strictEqual(H.atraso({ Estado: null, Tipo_Cliente: 'Directo', Fecha_Inicio: '2026-10-23T06:00:00' }, '2026-10-24T00:00:00'), 'Quedó sin iniciar',
    'un viaje viejo sin estado cuenta como Registrado');
assert.strictEqual(H.atraso({ Estado: 'Registrado', Tipo_Cliente: 'Directo', Fecha_Inicio: '2026-10-24T06:00:00' }, '2026-10-24T00:00:00'), '',
    'uno de hoy todavía no está atrasado');
assert.strictEqual(H.atraso({ Estado: 'En_viaje', Tipo_Cliente: 'Directo', Fecha_Inicio: '2026-10-22T22:00:00', Fecha_Fin: '2026-10-23T06:00:00' },
    '2026-10-24T00:00:00'), 'Entrega sin registrar');
assert.strictEqual(H.atraso({ Estado: 'En_viaje', Tipo_Cliente: 'Directo', Fecha_Inicio: '2026-10-23T22:00:00', Fecha_Fin: '2026-10-24T06:00:00' },
    '2026-10-24T00:00:00'), '', 'en viaje y llega hoy: no está atrasado');
assert.strictEqual(H.atraso({ Estado: 'Registrado', Tipo_Cliente: 'Con_plataforma', Fecha_Inicio: '2026-10-23T06:00:00' }, '2026-10-24T00:00:00'), '',
    'con plataforma, nada (lo sigue la plataforma)');
assert.strictEqual(H.atraso({ Estado: 'Entregado', Tipo_Cliente: 'Directo', Fecha_Inicio: '2026-10-23T06:00:00' }, '2026-10-24T00:00:00'), '');

// Iniciar, solo el día del viaje (Rocío, 27/10, punto 33 de la §41).
assert.strictEqual(H.accionesDe(viaje({ Fecha_Inicio: '2026-10-24T15:00:00' }), '2026-10-24T00:00:00').paso.motivo, '', 'hoy: se inicia');
assert.strictEqual(H.accionesDe(viaje({ Fecha_Inicio: '2026-10-30T05:00:00' }), '2026-10-24T00:00:00').paso.motivo,
    'No se puede iniciar el viaje: es del 30/10/2026. Si sale hoy, es necesario que administración corrija la fecha y la hora',
    'otro día: deshabilitado, con que administración corrija la fecha');
assert.ok(/^No se puede iniciar el viaje: era del 22\/10\/2026\./.test(H.accionesDe(viaje({ Fecha_Inicio: '2026-10-22T05:00:00' }), '2026-10-24T00:00:00').paso.motivo),
    'uno de un día anterior tampoco se inicia');

// Gastos del chofer (punto 33): desde que inicia el viaje y hasta 2 días después de la entrega; con plataforma, desde el
// día del viaje hasta 2 días después del fin. Después, administración.
const hoy = '2026-10-24T00:00:00';
assert.strictEqual(H.motivoGasto({ Estado: 'Registrado', Fecha_Inicio: '2026-10-24T05:00:00' }, hoy), null, 'sin salir: no se muestra');
assert.strictEqual(H.puedeCargarGasto({ Estado: 'En_viaje', Fecha_Inicio: '2026-10-24T05:00:00' }, hoy), true, 'en viaje: sí');
assert.strictEqual(H.puedeCargarGasto({ Estado: 'Entregado', Fecha_Inicio: '2026-10-21T06:00:00', Fecha_Entrega: '2026-10-22T00:00:00' }, hoy), true,
    'entregado hace 2 días: todavía rinde');
assert.strictEqual(H.motivoGasto({ Estado: 'Entregado', Fecha_Inicio: '2026-10-20T06:00:00', Fecha_Entrega: '2026-10-21T00:00:00' }, hoy),
    'No se puede cargar el gasto: pasaron más de 2 días de la entrega. Si te falta rendir algo, es necesario que se lo pases a administración',
    'pasado el tope: deshabilitado con el motivo');
assert.strictEqual(H.puedeCargarGasto({ Estado: 'Registrado', Tipo_Cliente: 'Con_plataforma', Fecha_Inicio: '2026-10-24T05:00:00', Fecha_Fin: '2026-10-24T12:00:00' }, hoy), true,
    'con plataforma: desde el día del viaje');
assert.ok(/pasaron más de 2 días del viaje/.test(H.motivoGasto({ Estado: 'Listo_para_facturar', Tipo_Cliente: 'Con_plataforma', Fecha_Inicio: '2026-10-20T05:00:00', Fecha_Fin: '2026-10-21T12:00:00' }, hoy)));
assert.strictEqual(H.motivoGasto({ Estado: 'Facturado', Fecha_Inicio: '2026-10-16T06:00:00' }, hoy), null, 'facturado: no se muestra');
assert.strictEqual(H.motivoGasto({ Estado: 'Facturado', Fecha_Inicio: '2026-10-16T06:00:00' }, hoy, 'eliminar'), 'No se puede eliminar el gasto: el viaje ya está facturado');

// Recorrido completo para el chofer: la navegación arranca donde está y termina en el galpón.
const galpon = 'Av. Circunvalación 1500, Córdoba, Córdoba, Argentina';
const lugares = { Origen_Direccion: 'Av. San Martín 2100, Unquillo, Córdoba', Destino_Direccion: 'Bv. Oroño 1200, Rosario, Santa Fe', Maps_Url: 'https://maps/viejo' };
function parametros(url) {
    const q = {};
    url.split('?')[1].split('&').forEach(function (par) { const p = par.split('='); q[p[0]] = decodeURIComponent(p[1]); });
    return q;
}
let enlace = parametros(H.enlaceNavegacion(Object.assign({ Estado: 'Registrado' }, lugares), galpon));
assert.strictEqual(enlace.origin, galpon, 'sin salir: arranca en el galpón, aunque el chofer esté en otro lado (punto 35, 27/10)');
assert.strictEqual(enlace.waypoints, 'Av. San Martín 2100, Unquillo, Córdoba, Argentina|Bv. Oroño 1200, Rosario, Santa Fe, Argentina');
assert.strictEqual(enlace.destination, galpon, 'termina en el galpón');
enlace = parametros(H.enlaceNavegacion(Object.assign({ Estado: 'En_viaje' }, lugares), galpon));
assert.strictEqual(enlace.waypoints, 'Bv. Oroño 1200, Rosario, Santa Fe, Argentina', 'en viaje: falta el destino y la vuelta');
enlace = parametros(H.enlaceNavegacion(Object.assign({ Estado: 'Entregado' }, lugares), galpon));
assert.strictEqual(enlace.origin, galpon, 'un viaje terminado muestra la vuelta entera desde el galpón');
assert.strictEqual(H.enlaceNavegacion(Object.assign({ Estado: 'Registrado' }, lugares), null), 'https://maps/viejo',
    'sin galpón cargado, el enlace de siempre');
assert.strictEqual(H.kmRecorridoCompleto({ Distancia_KM: '402.3', Km_Ida: 12.4, Km_Vuelta: 398 }), 812.7);
assert.strictEqual(H.kmRecorridoCompleto({ Distancia_KM: '402,3', Km_Ida: null, Km_Vuelta: 398 }), null, 'sin un tramo no hay total');

// El mapa abierto va en el viaje que está en viaje o, si no hay, en el primero de hoy sin salir.
assert.strictEqual(H.viajeQueSigue([
    { Viaje_ID: 49, Estado: 'Registrado', Fecha_Inicio: '2026-10-23T06:00:00' },
    { Viaje_ID: 52, Estado: 'En_viaje', Fecha_Inicio: '2026-10-24T05:30:00' },
    { Viaje_ID: 53, Estado: 'Registrado', Fecha_Inicio: '2026-10-24T15:00:00' }
], '2026-10-24T00:00:00'), 52);
assert.strictEqual(H.viajeQueSigue([
    { Viaje_ID: 49, Estado: 'Registrado', Fecha_Inicio: '2026-10-23T06:00:00' },
    { Viaje_ID: 53, Estado: 'Registrado', Fecha_Inicio: '2026-10-24T15:00:00' }
], '2026-10-24T00:00:00'), 53, 'sin ninguno en viaje, el primero de hoy');
assert.strictEqual(H.viajeQueSigue([{ Viaje_ID: 54, Estado: 'Registrado', Fecha_Inicio: '2026-10-25T05:00:00' }], '2026-10-24'), null,
    'si hoy no hay viajes, ninguno abierto');

assert.strictEqual(H.problemaDelArchivo({ name: 'remito.jpg', type: 'image/jpeg', size: 9 * 1024 * 1024 }), '',
    'una foto grande se achica antes de subirla');
assert.strictEqual(H.problemaDelArchivo({ name: 'remito.pdf', type: 'application/pdf', size: 6 * 1024 * 1024 }), 'El PDF no puede pesar más de 5 MB.');
assert.strictEqual(H.problemaDelArchivo({ name: 'remito.docx', type: 'application/msword', size: 1000 }), 'Tiene que ser una foto (JPG, PNG o WEBP) o un PDF.');
assert.strictEqual(H.problemaDelArchivo({ name: 'IMG_0001.HEIC', type: '', size: 2000000 }), '', 'la foto del iPhone se convierte a JPG');

// ---------------------------------------------------------------- API (HojaDeRutaController.cs)

const api = leer('WebApi_TransporteSanchez/Controllers/HojaDeRutaController.cs');
const acciones = api.split('[Http').slice(1);
assert.ok(acciones.length >= 8, 'debe poder leerse cada acción del controller');
acciones.forEach(function (accion) {
    const ruta = (/Route\("([^"]*)"\)/.exec(accion) || [])[1];
    const parametros = (/public [^(]+\(([^)]*)\)/.exec(accion) || [])[1];
    assert.ok(ruta !== undefined && parametros !== undefined, 'debe poder leerse la firma de cada acción');
    assert.ok(/ValidarSesion\(/.test(accion.slice(0, accion.indexOf('\n        }\n'))), 'cada acción valida el token: ' + ruta);
    // Las del chofer: la hoja de ruta y sus viajes. El chofer sale del token, nunca de un parámetro.
    if (ruta === '' || /^Viajes\//.test(ruta)) {
        const nombres = parametros.split(',').map(function (p) { return p.trim().split(/\s+/).pop(); });
        assert.ok(!nombres.some(function (n) { return /chofer/i.test(n); }), 'el chofer nunca llega como parámetro: ' + ruta + ' (' + parametros + ')');
    }
});
['EntregaChoferDto', 'EvidenciaChoferDto'].forEach(function (dto) {
    const cuerpo = api.slice(api.indexOf('public class ' + dto), api.indexOf('}', api.indexOf('public class ' + dto)));
    assert.ok(cuerpo.length > 20 && !/ChoferID|Chofer_ID/.test(cuerpo), dto + ' no trae el chofer: sale del token');
});
// El chofer de la sesión; otro, solo quien ve todas las hojas de ruta (punto 4 de la §41, abajo).
assert.ok(/WHERE v\.ChoferID = @chofer/.test(api) && /int\? choferVisto = sesion\.Chofer_ID;/.test(api) && /P\("@chofer", choferVisto\.Value\)/.test(api),
    'la hoja de ruta filtra por el chofer de la sesión');
const subir = api.slice(api.indexOf('public async Task<IHttpActionResult> SubirEvidencia('), api.indexOf('public async Task<IHttpActionResult> VerEvidencia('));
assert.ok(/EsConPlataforma\(v\.Tipo_Cliente\)/.test(subir) && /EstadoEnViaje/.test(subir) && /EstadoEntregado/.test(subir),
    'el chofer sube evidencia solo en viajes directos en viaje o entregados');
assert.ok(leer('WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj').includes('Controllers\\HojaDeRutaController.cs'),
    'el controller tiene que estar en el proyecto para compilarse');

// ---------------------------------------------------------------- Login: vuelve solo a una pantalla del sistema

const login = leer('Login.html');
const inicio = login.indexOf('function pantallaDeVuelta(');
const fin = login.indexOf('\n        }\n', inicio);
assert.ok(inicio !== -1 && fin !== -1, 'debe existir pantallaDeVuelta en el login');
function volverCon(busqueda) {
    const caja = { URLSearchParams: URLSearchParams, String: String, window: { location: { search: busqueda } } };
    vm.runInNewContext(login.slice(inicio, fin + 10), caja, { filename: 'Login.html' });
    return caja.pantallaDeVuelta();
}
assert.strictEqual(volverCon('?volver=' + encodeURIComponent('hoja-de-ruta.html?viaje=48')), 'hoja-de-ruta.html?viaje=48');
assert.strictEqual(volverCon('?volver=' + encodeURIComponent('https://otro.sitio/robar')), '', 'nunca otra dirección');
assert.strictEqual(volverCon('?volver=' + encodeURIComponent('//otro.sitio')), '');
assert.strictEqual(volverCon('?volver=Login.html'), '', 'no vuelve al login');
assert.strictEqual(volverCon(''), '');

// ---------------------------------------------------------------- Menú y permiso

const menu = leer('assets/static/js/sidebar-loader.js');
assert.ok(menu.includes('<a href="hoja-de-ruta.html" class="sidebar-link"><i class="bi bi-signpost-split"></i><span>Hojas de ruta</span>'),
    'Hojas de ruta es un ítem principal del menú (en plural desde el 27/10)');
assert.ok(menu.includes("'hoja de ruta': 'hoja-de-ruta.html'"), 'el permiso "Hoja de ruta" abre la pantalla');
assert.ok(menu.includes("'Login.html?volver=' + encodeURIComponent("), 'con la sesión vencida, el login sabe adónde volver');
// El chofer (solo tiene la Hoja de ruta): el menú con el logo y solo la Hoja de ruta, plegado al entrar y que se abre con el
// botón de tres rayitas; sin Documentación (Rocío, 24/10).
assert.ok(/function plegarMenu\(\) \{[\s\S]*?document\.body\.classList\.add\('js-sidebar-collapsed'\);/.test(menu) &&
    menu.includes('if (soloHojaDeRuta) marcarSoloHojaDeRuta(true);'),
    'el menú del chofer arranca plegado');
assert.ok(!menu.includes('sgtl-sin-menu'), 'el chofer tiene el menú (con el logo), no se esconde');
// En el celular el menú lo abre la plantilla: el plegado de la computadora no lo puede volver a esconder.
const plegado = leer('assets/static/js/components/sidebar.js');
assert.ok(plegado.includes('@media (min-width: 1201px){body.js-sidebar-collapsed #sidebar{transform:translateX(-110%);}'),
    'el plegado es solo de la computadora');
assert.ok(plegado.includes("if (isDesktop(window)) document.body.classList.toggle('js-sidebar-collapsed');") &&
    plegado.includes("if (window.sidebar && typeof window.sidebar.hide === 'function') window.sidebar.hide();"),
    'en el celular el botón abre el menú y la cruz lo cierra con el fondo oscuro');
assert.ok(/permitidas\.every\(function \(p\) \{ return p === 'hoja-de-ruta\.html'; \}\)/.test(menu) &&
    menu.includes("if (!soloHojaDeRuta) permitidas.push('manual-usuario.html', 'informe-version.html');"),
    'el chofer no ve la Documentación; los demás usuarios sí');
assert.ok(login.includes("localStorage.setItem('sgtlSoloHojaDeRuta', '1')"), 'el login marca al chofer para que el menú no aparezca ni un momento');

// ---------------------------------------------------------------- Cuántos viajes hay en cada vista (Rocío, 24/10)

// Se cuentan con las mismas condiciones que la lista (y sin su tope); Anteriores, las del año elegido.
assert.ok(api.includes('"SELECT ISNULL(SUM(CASE WHEN " + pendiente + " THEN 1 ELSE 0 END), 0) AS Proximos, "') &&
    api.includes('"ISNULL(SUM(CASE WHEN NOT " + pendiente + " AND " + delAnio + " THEN 1 ELSE 0 END), 0) AS Anteriores "') &&
    api.includes('" AND NOT " + pendiente + " AND " + delAnio + " ORDER BY v.Fecha_Inicio DESC, v.Viaje_ID DESC"'),
    'las cantidades usan las mismas condiciones que cada vista');

// Anteriores por año (arranca en el actual) y de a 30, con "Ver más viajes" (Rocío, 24/10).
assert.ok(/public IHttpActionResult Get\(string vista = null, int\? anio = null, int\? cantidad = null, int\? choferId = null, int\? viajeId = null\)/.test(api) &&
    /anio\.Value <= hoy\.Year \? anio\.Value : hoy\.Year/.test(api), 'Anteriores se pide por año; sin año (o uno que no tiene sentido), el actual');
assert.ok(/Math\.Min\(cantidad \?\? AnterioresPorPagina, AnterioresMaximo\)/.test(api) && api.includes('"SELECT TOP (" + (tope + 1) + ") v.Viaje_ID,') &&
    /var hayMas = filas\.Count > tope;/.test(api), 'trae de a 30 (con tope) y avisa si quedan más');
assert.ok(/if \(!anios\.Contains\(hoy\.Year\)\) anios\.Add\(hoy\.Year\);/.test(api), 'el año actual siempre se puede elegir');
const pantallaJs = leer('assets/static/js/hoja-de-ruta.js');
// La distancia que ve el chofer: la del recorrido completo, con la de origen a destino debajo (Rocío, 24/10).
assert.ok(pantallaJs.includes("return dato('Recorrido completo', esc(SGTL.km(total)) + ' km<div class=\"suave\">' + esc(deOrigenADestino) + ' de origen a destino</div>');") &&
    pantallaJs.includes("if (total == null) return dato('Distancia', esc(deOrigenADestino) + (deOrigenADestino ? '<div class=\"suave\">de origen a destino</div>' : ''));"),
    'el chofer ve el recorrido completo y, aclarada, la distancia de origen a destino');
// "Ver mapa" lo abre y "Ocultar mapa" lo cierra; la etiqueta amarilla dice por qué sigue un viaje de otro día.
assert.ok(pantallaJs.includes("(abierto ? 'Ocultar mapa' : 'Ver mapa')") && pantallaJs.includes('var abrir = !mapaAbierto(v);'),
    'el mismo enlace abre y cierra el mapa');
assert.ok(pantallaJs.includes("if (atrasado) html += '<div class=\"mt-1\">' + SGTL.estado(atrasado, atrasado, 'amarillo') + '</div>';"),
    'la etiqueta del atraso es amarilla, debajo del estado');
assert.ok(pantallaJs.includes("if (estado.anio) datos.anio = estado.anio;") && pantallaJs.includes("estado.cantidad += ANTERIORES_POR_PAGINA;") &&
    pantallaJs.includes('data-accion="ver-mas">Ver más viajes</button>'), 'la pantalla pide el año elegido y "Ver más viajes" trae 30 más');
assert.ok(/Cantidad_Proximos = cantidades\.Proximos, Cantidad_Anteriores = cantidades\.Anteriores/.test(api), 'la API manda las dos cantidades');
const pantallaHtml = leer('hoja-de-ruta.html');
assert.ok(pantallaHtml.includes('Hoy y próximos<span data-cantidad-de="proximos"></span>') &&
    pantallaHtml.includes('Anteriores<span data-cantidad-de="anteriores"></span>'), 'el selector tiene lugar para las cantidades');
assert.ok(leer('assets/static/js/hoja-de-ruta.js').includes("var cantidades = { proximos: data.Cantidad_Proximos, anteriores: data.Cantidad_Anteriores };"),
    'la pantalla muestra la cantidad de cada vista');

// Hojas de ruta (Rocío, 27/10, punto 4 de la §41): los administradores y quien gestiona viajes ven la de cualquier chofer,
// en solo lectura; el chofer, solo la suya.
assert.ok(/public bool PuedeVerTodas \{ get \{ return EsAdmin \|\| GestionaViajes; \} \}/.test(api) && /N'Gestión de viajes', N'Gestion de viajes'/.test(api),
    'ven todas: los administradores y quien gestiona viajes');
const getHoja = api.slice(api.indexOf('public IHttpActionResult Get(string vista'), api.indexOf('// POST api/HojaDeRuta/Viajes/{id}/Iniciar'));
assert.ok(/if \(!sesion\.PuedeVerTodas\) throw new AccesoDenegadoException\("No tenés permiso para ver la hoja de ruta de otro chofer\."\);/.test(getHoja),
    'el chofer no pide la de otro');
assert.ok(/Solo_Lectura = soloLectura/.test(getHoja) && !/sesion\.Chofer_ID\.Value/.test(getHoja), 'la de otro, en solo lectura, con su chofer');
['Iniciar', 'Entrega', 'SinCarga'].forEach(function (accion) {
    const tramo = api.slice(api.indexOf('Route("Viajes/{id:int}/' + accion + '")'));
    assert.ok(/ViajeDelChofer\(db, ChoferDe\(sesion\), id\)/.test(tramo.slice(0, 1500)), accion + ': solo con los viajes propios');
});
assert.ok(/v = ViajeParaVer\(db, sesion, id\);/.test(api.slice(api.indexOf('public async Task<IHttpActionResult> VerEvidencia('))), 'la evidencia se puede ver');
const pantallaHoja = leer('assets/static/js/hoja-de-ruta.js');
assert.ok(/var a = estado\.soloLectura \? \{ paso: null, sinCarga: null, reemplazar: false, nota: '' \} : accionesDe\(v, estado\.hoy\);/.test(pantallaHoja),
    'en solo lectura, sin botones');
assert.ok(/<span>Hojas de ruta<\/span>/.test(leer('assets/static/js/sidebar-loader.js')) && /\['hoja de ruta', 'Hojas de ruta'\]/.test(leer('assets/static/js/permisos-menu.js')) &&
    /"Hoja de ruta",/.test(leer('WebApi_TransporteSanchez/Controllers/GruposController.cs')), '"Hojas de ruta" a la vista; el permiso guardado no cambia');

console.log('OK: la hoja de ruta muestra y deja hacer lo que corresponde, solo con los viajes del chofer de la sesión (y las de todos, para ver)');
