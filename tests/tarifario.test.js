// Tabla de tarifas por tipo de camión (24/10, decisión de Rocío con Claudia): "Tarifas a agosto 2026". El precio del
// viaje sale del tipo de camión, el año del modelo y los km: tarifa fija por banda (con 1ª y 2ª vuelta en la primera; más
// de 250 km, la fija de 250 más el excedente por km) o tarifa por km (todo el viaje), más falso flete y estadía.
// El viaje guarda su importe: proformas, control de Rukas y dashboard leen el guardado, así que cambiar una tarifa
// no cambia los viajes ya calculados (§33 de PENDIENTES).
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const leer = function (archivo) { return fs.readFileSync(path.join(raiz, archivo), 'utf8'); };

const TIPOS = ['Furgón', 'Balancín (3 ejes)', 'Chasis (2 ejes)', 'Liviano'];

function probarTiposIguales() {
    const calculo = leer('WebApi_TransporteSanchez/Tarifas/TarifarioCalculo.cs');
    const lista = /TiposVehiculo = \{([^}]*)\}/.exec(calculo);
    assert.ok(lista, 'TarifarioCalculo.cs tiene que declarar los tipos de camión');
    assert.deepStrictEqual(lista[1].split(',').map(function (t) { return t.trim().replace(/"/g, ''); }), TIPOS,
        'los tipos de la API son los de la tabla');

    const camiones = leer('gestion-camiones.html');
    const select = /<select id="camionTipo"[\s\S]*?<\/select>/.exec(camiones);
    assert.ok(select, 'Gestionar camiones tiene el desplegable del tipo');
    const opciones = [];
    select[0].replace(/<option value="([^"]+)">/g, function (_, v) { opciones.push(v); });
    assert.deepStrictEqual(opciones, TIPOS, 'Gestionar camiones ofrece los mismos tipos, en el mismo orden');
    assert.ok(/<select id="camionTipo"/.test(camiones), 'el tipo del camión se elige de una lista, no se escribe');
    assert.ok(/TarifarioCalculo\.TipoValido\(camionDto\.Tipo\)/.test(leer('WebApi_TransporteSanchez/Controllers/CamionesController.cs')),
        'la API de camiones rechaza un tipo que no es de la tabla');

    const tarifas = leer('gestion-tarifas.html');
    assert.ok(tarifas.indexOf("const TIPOS_VEHICULO = ['Furgón', 'Balancín (3 ejes)', 'Chasis (2 ejes)', 'Liviano'];") !== -1,
        'Gestionar tarifas arma la grilla con los mismos tipos');
}

function filasDe(script, variable) {
    const filas = [];
    const patron = new RegExp('\\(' + variable + ", ([01]), N'([^']+)',\\s+(\\d+), (\\d+), (\\d+), (\\d+), (\\d+)\\)", 'g');
    script.replace(patron, function (_, nuevo, tipo, a, b, c, d, e) {
        filas.push({ nuevo: nuevo === '1', tipo: tipo, valores: [a, b, c, d, e].map(Number) });
    });
    return filas;
}

function probarValoresDeAgosto() {
    const script = leer('database/tarifas/03_cargar_tablas_de_tarifas_2026.sql');
    const filas = filasDe(script, '@Agosto');
    assert.strictEqual(filas.length, 8, 'la tabla de agosto 2026 tiene 8 filas: 4 tipos por 2 antigüedades');
    const balancinNuevo = filas.filter(function (f) { return f.nuevo && f.tipo === 'Balancín (3 ejes)'; })[0];
    assert.deepStrictEqual(balancinNuevo.valores, [581492, 407089, 631568, 663370, 2594], 'Balancín 2019 en adelante, como el PDF');
    // La de 2019 en adelante es la de 2018 más un 10 % (hasta 250 km, un 8 %; larga distancia, un 5 %): sirve para
    // detectar un número mal copiado.
    TIPOS.forEach(function (tipo) {
        const viejo = filas.filter(function (f) { return !f.nuevo && f.tipo === tipo; })[0].valores;
        const nuevo = filas.filter(function (f) { return f.nuevo && f.tipo === tipo; })[0].valores;
        nuevo.forEach(function (v, i) {
            const suba = v / viejo[i] - 1;
            const esperada = [0.10, 0.10, 0.10, 0.08, 0.05][i];
            assert.ok(Math.abs(suba - esperada) < 0.006, tipo + ': el valor ' + v + ' no sigue la suba de la tabla');
        });
    });
    assert.ok(/'2026-08-01', 1, 2019, 130, 190, 250, 96577, 6, 12, 18, 60/.test(script),
        'vigente desde el 01/08/2026 para todos los clientes, corte 2019, bandas 130/190/250, estadía 96.577 por 6 hs, 12 y 18 hs, falso flete 60 %');
}

// La de enero 2026 (decisión de Rocío, 25/10): para los viajes de enero a julio, los valores de agosto con un 15 % menos,
// redondeados a pesos, y lo demás igual.
function probarValoresDeEnero() {
    const script = leer('database/tarifas/03_cargar_tablas_de_tarifas_2026.sql');
    const agosto = filasDe(script, '@Agosto');
    const enero = filasDe(script, '@Enero');
    assert.strictEqual(enero.length, 8, 'la tabla de enero 2026 tiene 8 filas');
    enero.forEach(function (f, i) {
        assert.strictEqual(f.tipo, agosto[i].tipo, 'enero y agosto en el mismo orden');
        assert.strictEqual(f.nuevo, agosto[i].nuevo, 'enero y agosto en el mismo orden');
        assert.deepStrictEqual(f.valores, agosto[i].valores.map(function (v) { return Math.round(v * 0.85); }),
            f.tipo + (f.nuevo ? ' 2019 en adelante' : ' 2018 o anterior') + ': agosto con un 15 % menos');
    });
    assert.ok(/'2026-01-01', 1, 2019, 130, 190, 250, 82090, 6, 12, 18, 60/.test(script),
        'vigente desde el 01/01/2026 para todos los clientes, estadía 96.577 con un 15 % menos y lo demás como agosto');
    assert.ok(!/Fecha_Modi = @Ahora, Usu_Modi = @Usuario\s+FROM dbo\.CAMIONES/.test(script), '03 no cambia quién modificó el camión');
}

// La grilla de Gestionar tarifas tiene la forma del PDF (decisión de Rocío, 25/10): tarifas fijas con la distancia en las
// filas y el tipo de camión en las columnas (1ª y 2ª vuelta solo en la primera banda), y la tarifa por km aparte, con
// cuándo se usa.
function probarGrillaComoElPdf() {
    const tarifas = leer('gestion-tarifas.html');
    assert.ok(/<th scope="col" rowspan="2">Distancia<\/th>/.test(tarifas), 'las tarifas fijas tienen la distancia en las filas');
    assert.ok(/'<th scope="col" colspan="2">' \+ t \+ '<\/th>'/.test(tarifas), 'cada tipo de camión es una columna con 1ª y 2ª vuelta');
    assert.ok(/celda\(idValor\(nuevo, i, 'v1'\)\) \+ celda\(idValor\(nuevo, i, 'v2'\)\)/.test(tarifas), 'la 1ª y 2ª vuelta van en la primera banda');
    assert.ok(/banda\('b2'\)/.test(tarifas) && /banda\('b3'\)/.test(tarifas), 'las otras bandas tienen un valor por tipo');
    assert.ok(tarifas.indexOf('El precio por km se usa en dos casos:') !== -1, 'la tarifa por km va aparte y dice cuándo se usa');
    assert.ok(tarifas.indexOf('Viaje con tarifa por km: se cobran todos los km del viaje a este precio.') !== -1, 'primer caso de la tarifa por km');
    assert.ok(/'Viaje con tarifa fija de más de ' \+ km\(b3\)/.test(tarifas), 'el segundo caso usa la última banda cargada');
    const sinComentarios = tarifas.replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(sinComentarios.indexOf('PDF') === -1, 'la pantalla no nombra el PDF (solo los comentarios del código)');
    assert.ok(/table\.table\.sgtl-grilla \{/.test(leer('assets/static/css/sgtl.css')), 'la grilla usa la clase compartida de sgtl.css');
    // Vigente hasta (Rocío, 25/10): no se carga; es el día antes de la tabla siguiente del mismo alcance, o sin fecha de fin.
    assert.ok(/<div class="sgtl-dato-fijo" id="trHasta"/.test(tarifas) && tarifas.indexOf("'<div>Sin fecha de fin</div>") !== -1,
        'el formulario muestra hasta cuándo vale la tabla, como texto');
    assert.ok(tarifas.indexOf('id="trHasta"') !== -1 && !/<input[^>]+id="trHasta"/.test(tarifas), 'el hasta no es un campo para cargar');
    // Modelos (Rocío, 25/10): el año de corte no se edita; se muestra como texto y viaja con la tabla.
    assert.ok(tarifas.indexOf('id="trCorte"') === -1 && /<div class="sgtl-dato-fijo" id="trModelos"/.test(tarifas), 'el año de los modelos se ve como texto');
    assert.ok(/Anio_Corte: anioCorte,/.test(tarifas), 'el año de corte se guarda con la tabla');
    // Aviso que no impide guardar (Rocío, 25/10): la 2ª vuelta no más cara que la 1ª y cada banda no más barata que la anterior.
    assert.ok(/\[\['v2', 'v1', 'más cara'\], \['b2', 'v1', 'más barata'\], \['b3', 'b2', 'más barata'\]\]/.test(tarifas)
        && tarifas.indexOf('Si están bien, se puede guardar igual.') !== -1, 'avisa si los valores no suben como en el PDF');
    assert.ok(!/revisarValores\(\)[^;]*return false/.test(tarifas) && !/avisoValoresTarifario[\s\S]{0,200}revisarFormulario/.test(tarifas),
        'el aviso no bloquea el guardado');
}

// Editar o registrar una tabla (§33, decisión de Rocío del 25/10): antes de guardar, la API calcula qué viajes y
// presupuestos cambian; si algo cambia, la pantalla lo confirma con la lista y el motivo, que es obligatorio.
function probarImpactoAlGuardar() {
    const api = leer('WebApi_TransporteSanchez/Controllers/TarifarioController.cs');
    assert.ok(/\[Route\("api\/Tarifario\/Impacto"\)\]/.test(api), 'la API calcula el impacto sin guardar');
    assert.ok(/impacto\.HayCambios && motivo\.Length == 0/.test(api), 'la API pide el motivo si algún importe cambia');
    assert.ok(/TarifarioImpacto\.Aplicar\(cn, tx, impacto/.test(api), 'el guardado aplica el recálculo en la misma transacción');

    const impacto = leer('WebApi_TransporteSanchez/Tarifas/TarifarioImpacto.cs');
    ['"Generada"', '"Aceptada"', '"Borrador"', '"Facturada"', 'Presupuesto_ID.HasValue'].forEach(function (t) {
        assert.ok(impacto.indexOf(t) !== -1, 'TarifarioImpacto separa los viajes según su documento: ' + t);
    });
    assert.ok(/TarifarioCalculo\.BaseConTabla\(/.test(impacto) && /TarifarioCalculo\.SumarAdicionales\(/.test(impacto),
        'el recálculo usa la misma cuenta que un viaje nuevo');
    assert.ok(/<Compile Include="Tarifas\\TarifarioImpacto\.cs" \/>/.test(leer('WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj')),
        'TarifarioImpacto.cs está en el .csproj');

    const script = leer('database/tarifas/05_cambios_de_tarifa.sql');
    assert.ok(/CREATE TABLE dbo\.TARIFARIO_CAMBIOS/.test(script) && /CREATE TABLE dbo\.TARIFARIO_REVISAR/.test(script), '05 crea los cambios y lo que queda para revisar');

    const pantalla = leer('gestion-tarifas.html');
    assert.ok(pantalla.indexOf("'/Tarifario/Impacto?id='") !== -1, 'Gestionar tarifas pide el impacto antes de guardar');
    assert.ok(/motivo: \{ etiqueta: 'Motivo del cambio', obligatorio: true \}/.test(pantalla), 'la confirmación pide el motivo');
    assert.ok(/detalle: htmlImpacto\(/.test(pantalla), 'la confirmación muestra la lista de lo que cambia');
    assert.ok(/data-sgtl="detalle"/.test(leer('assets/static/js/sgtl-ui.js')), 'SGTL.confirmar puede mostrar una lista');
}

// Lo que queda para revisar (§33): ícono rojo en la fila y aviso adentro en presupuestos, proformas y viajes; se resuelve
// solo al reenviar el presupuesto o al anular la proforma (sus viajes se recalculan).
function probarParaRevisar() {
    const api = leer('WebApi_TransporteSanchez/Controllers/TarifarioController.cs');
    assert.ok(/\[Route\("api\/Tarifario\/Revisar"\)\]/.test(api), 'la API lista lo que queda para revisar');
    assert.ok(/\[Route\("api\/Tarifario\/Revisar\/\{id:int\}\/Resolver"\)\]/.test(api), 'se puede marcar como resuelto');
    assert.ok(/\[Route\("api\/Tarifario\/Revisar\/Presupuesto\/\{id:int\}\/Enviado"\)\]/.test(api), 'reenviar el presupuesto lo resuelve');
    assert.ok(/Tarifas\.TarifarioRevisar\.AlAnularProforma\(db, id, usu\)/.test(leer('WebApi_TransporteSanchez/Controllers/ProformasController.cs')),
        'al anular una proforma, sus viajes para revisar se recalculan');
    assert.ok(/OBJECT_ID\(N'dbo\.TARIFARIO_REVISAR', N'U'\)/.test(leer('WebApi_TransporteSanchez/Tarifas/TarifarioRevisar.cs')),
        'sin el script 05, anular una proforma sigue funcionando');
    assert.ok(/<Compile Include="Tarifas\\TarifarioRevisar\.cs" \/>/.test(leer('WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj')),
        'TarifarioRevisar.cs está en el .csproj');

    const modulo = leer('assets/static/js/cambios-tarifa.js');
    assert.ok(/botonInfo\('urgente'/.test(modulo) && /alert alert-warning/.test(modulo), 'ícono rojo en la fila y aviso amarillo adentro');
    assert.ok(!/SGTL\.ajax\(/.test(modulo), 'cambios-tarifa.js usa fetch: Presupuestos no carga jQuery');

    const presupuestos = leer('assets/static/js/presupuestos.js');
    assert.ok(presupuestos.indexOf("'Cambió la tarifa: revisalo en Ver PDF.'") !== -1, 'Presupuestos: el ícono manda a Ver PDF');
    assert.ok(/el\('vistaPresupuestoCambio'\)\.innerHTML = avisoCambio\(p\)/.test(presupuestos) && /el\('cambioTarifaPresupuesto'\)\.innerHTML = avisoCambio\(p\)/.test(presupuestos),
        'Presupuestos: el aviso en Ver PDF y en Editar');
    assert.ok(/SGTLCambiosTarifa\.presupuestoEnviado\(enviadoId\)/.test(presupuestos) && /\/Tarifario\/Revisar\/Presupuesto\/' \+ encodeURIComponent\(id\) \+ '\/Enviado'/.test(modulo),
        'Presupuestos: enviarlo por e-mail lo resuelve');
    assert.ok(/<script src="assets\/static\/js\/cambios-tarifa\.js"><\/script><script src="assets\/static\/js\/presupuestos\.js">/.test(leer('presupuestos.html')),
        'presupuestos.html carga el módulo antes de presupuestos.js');

    const proformas = leer('gestion-facturacion.html');
    assert.ok(proformas.indexOf("': revisá el detalle de la proforma.'") !== -1 && /SGTLCambiosTarifa\.aviso\(cambiosDeProforma\(p\.Proforma_ID\),\s+\{ enLaProforma: true/.test(proformas),
        'Proformas: ícono en la fila y aviso en el detalle');

    const viajes = leer('gestion-viajes.html');
    assert.ok(viajes.indexOf("'<div>Cambió la tarifa: revisá el detalle del viaje.</div>'") !== -1 && /botonInfo\(cambio\.length \? 'urgente' : 'info'/.test(viajes),
        'Viajes: el ícono pasa a rojo y suma el texto');
    assert.ok(/mostrarCambioTarifa\(viaje, numero\)/.test(leer('assets/static/js/viaje-detalle.js')), 'Ver detalle del viaje muestra el aviso');

    // Rocío, 25/10: cada uno ve lo que puede resolver, y la tarjeta es fija en el dashboard (sin estrella).
    const api2 = leer('WebApi_TransporteSanchez/Controllers/TarifarioController.cs');
    assert.ok(/\.Where\(f => alcance\.Ve\(f\.Tipo\)\)/.test(api2), 'la API devuelve solo lo que el usuario puede resolver');
    assert.ok(/PermisosPresupuestos = \{ "Presupuestos"/.test(api2) && /"Gestión de proformas"/.test(api2) && /"Cuenta Corriente"/.test(api2),
        'presupuestos con su permiso; proformas y comprobantes con los de facturación');
    assert.ok(/Authorization: 'Bearer '/.test(modulo), 'cambios-tarifa.js manda el token');
    assert.ok(leer('assets/static/js/tableros-catalogo.js').indexOf("id: 'cambiostarifa'") === -1, 'no está en el catálogo de favoritos');
    assert.ok(/SGTLCambiosTarifa\.tarjetaFija\(document\.getElementById\('cambiosTarifaFija'\)\)/.test(leer('index.html')), 'el dashboard la muestra fija');
    assert.ok(/SGTLCambiosTarifa\.tarjetaFija\(document\.getElementById\('cambiosTarifaTableros'\), \{ estrellaFija: true \}\)/.test(leer('tableros.html')),
        'en Tableros está en Facturación, con la estrella fija');
    assert.ok(/'No se puede quitar del dashboard: está fijo para quien resuelve cambios de tarifa'/.test(modulo) && /disabled aria-pressed="true"/.test(modulo),
        'la estrella fija está deshabilitada con el motivo (§1.4)');
    assert.ok(/get\('presupuesto'\)/.test(presupuestos) && /get\('proforma'\)/.test(proformas), 'cada fila lleva a donde se corrige');
    assert.ok(/texto: 'Anular proforma'/.test(proformas), 'el aviso de la proforma trae "Anular proforma"');
}

function probarViajeGuardaImporte() {
    const viajes = leer('WebApi_TransporteSanchez/Controllers/ViajesController.cs');
    assert.ok(/GuardarImporte\(db, viaje\.Viaje_ID, viajeDto, calculo\)/.test(viajes), 'el alta del viaje guarda el importe calculado por la API');
    assert.ok(/if \(calculo\.Ok\) GuardarImporte\(db, id,/.test(viajes), 'la edición del viaje guarda el importe');
    assert.ok(/" SELECT v\.Importe FROM VIAJES v"/.test(viajes), 'el costo del dashboard usa el importe guardado');

    const proformas = leer('WebApi_TransporteSanchez/Controllers/ProformasController.cs');
    const guardado = proformas.indexOf('t.Guardados.TryGetValue(viajeId');
    const presupuesto = proformas.indexOf('if (t.PresupuestoDatos.ContainsKey(viajeId))');
    assert.ok(guardado !== -1 && guardado < presupuesto, 'Traer viajes y el control de Rukas leen primero el importe guardado');

    const pantalla = leer('gestion-viajes.html');
    ['TarifarioID:', 'Tarifa_Modo:', 'Vuelta:', 'Falso_Flete:', 'Estadia_Modulos:'].forEach(function (campo) {
        assert.ok(pantalla.indexOf(campo) !== -1, 'Registrar viaje manda ' + campo.replace(':', ''));
    });
    assert.ok(/id="tarifaTipoFija" value="fija" checked/.test(pantalla), 'Fija viene elegida al registrar un viaje');
    assert.ok(/id="tarifaTipoKm" value="km"/.test(pantalla), 'Por km es la otra opción');
    assert.ok(pantalla.indexOf('TarifasFijas/PorRuta') === -1 && pantalla.indexOf('TarifasKm/Calcular') === -1,
        'Registrar viaje ya no busca tarifas fijas por recorrido ni las tarifas por km de antes');

    const presupuestos = leer('assets/static/js/presupuestos.js');
    assert.ok(presupuestos.indexOf("/Tarifario/Calcular?") !== -1, 'presupuestos calcula con la tabla de tarifas, como los viajes');
    assert.ok(presupuestos.indexOf('TarifasFijas/PorRuta') === -1 && presupuestos.indexOf('TarifasKm/Calcular') === -1,
        'presupuestos ya no usa las tarifas de antes');
    assert.ok(/crear\.Parameters\.AddWithValue\("@tarifario", tarifario\)/.test(leer('WebApi_TransporteSanchez/Controllers/PresupuestosController.cs')),
        'el viaje que genera un presupuesto queda con la tabla de tarifas');

    const tarifas = leer('gestion-tarifas.html');
    assert.ok(tarifas.indexOf('tablaFijas') === -1 && tarifas.indexOf('tablaKm') === -1,
        'Gestionar tarifas ya no carga tarifas fijas por recorrido ni bandas por km: solo la tabla de tarifas');
}

function probarFijaConExcedente() {
    const calculo = leer('WebApi_TransporteSanchez/Tarifas/TarifarioCalculo.cs');
    assert.ok(/decimal excedente = km - t\.Km_Banda3;/.test(calculo) && /v\.Valor_Banda3 \+ Redondear\(v\.Valor_Km \* excedente\)/.test(calculo),
        'con tarifa fija, más de 250 km es la fija de 250 más el excedente por km');
    assert.ok(/if \(porKm\)[\s\S]{0,200}Redondear\(v\.Valor_Km \* km\)/.test(calculo), 'con tarifa por km, todo el viaje por km');
    // 600 km en un Balancín 2019 en adelante: fija 663.370 + 350 × 2.594 = 1.571.270; por km, 600 × 2.594 = 1.556.400.
    assert.strictEqual(663370 + 350 * 2594, 1571270);
    assert.strictEqual(600 * 2594, 1556400);
}

// Tabla general (para todos) y tablas propias de algunos clientes, que para ellos reemplazan a la general (24/10).
function probarTablasPorCliente() {
    const esquema = leer('database/tarifas/02_tarifario_por_vehiculo.sql');
    assert.ok(/CREATE TABLE dbo\.TARIFARIO_CLIENTES/.test(esquema) && /Para_Todos\s+bit NOT NULL/.test(esquema), '02 crea el alcance de cada tabla');
    assert.ok(esquema.indexOf('UQ_TARIFARIOS_Vigente_Desde') === -1, 'una general y una propia pueden empezar el mismo día');
    const calculo = leer('WebApi_TransporteSanchez/Tarifas/TarifarioCalculo.cs');
    assert.ok(/ORDER BY t\.Para_Todos, t\.Vigente_Desde DESC/.test(calculo), 'la tabla propia del cliente gana sobre la general');
    assert.ok(/Vigente\(db, p\.FechaInicio, p\.ClienteID\)/.test(calculo), 'el cálculo usa el cliente del viaje');
    assert.ok(/ClienteID = v\.ClienteID/.test(leer('WebApi_TransporteSanchez/Controllers/ViajesController.cs')), 'el viaje pasa su cliente');
    assert.ok(/clienteId: \$\('#clienteSelect'\)\.val\(\) \|\| 0 \}/.test(leer('gestion-viajes.html')), 'Registrar viaje calcula con el cliente');
    assert.ok(/clienteId: el\('cliente'\)\.value/.test(leer('assets/static/js/presupuestos.js')), 'presupuestos calcula con el cliente');
    const pantalla = leer('gestion-tarifas.html');
    assert.ok(/id="trParaTodos" value="todos" checked/.test(pantalla) && /id="trParaAlgunos"/.test(pantalla),
        'Gestionar tarifas elige si la tabla es para todos o para algunos clientes');
}

// Como si siempre hubiera estado la tabla de tarifas (25/10): sin las tarifas fijas por recorrido ni las bandas por km de
// antes, ni sus endpoints; 04 pasa los viajes y presupuestos a la tabla y borra los datos viejos.
function probarSinTarifasViejas() {
    const csproj = leer('WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj');
    ['TarifasController', 'TarifasFijasController', 'TarifasKmController'].forEach(function (c) {
        assert.ok(csproj.indexOf('Controllers\\' + c + '.cs') === -1, c + ' ya no está en el .csproj');
        assert.ok(!fs.existsSync(path.join(raiz, 'WebApi_TransporteSanchez/Controllers/' + c + '.cs')), c + ' ya no existe');
    });
    ['WebApi_TransporteSanchez/Controllers/ViajesController.cs', 'WebApi_TransporteSanchez/Controllers/ProformasController.cs',
        'WebApi_TransporteSanchez/Controllers/ProformasPlataformaController.cs', 'WebApi_TransporteSanchez/Controllers/PresupuestosController.cs',
        'WebApi_TransporteSanchez/Tarifas/TarifarioCalculo.cs'].forEach(function (archivo) {
        assert.ok(!/TARIFAS_FIJAS|TARIFAS_KM/.test(leer(archivo)), archivo + ' no lee las tarifas viejas');
    });
    ['gestion-viajes.html', 'assets/static/js/viaje-detalle.js', 'assets/static/js/presupuestos.js'].forEach(function (archivo) {
        assert.ok(!/\/Tarifas\/(Fijas|Km)|TarifasFijas|TarifasKm|TarifaFijaID|TarifaKmID|tarifaId\b/.test(leer(archivo)), archivo + ' no usa las tarifas viejas');
    });
    // Como si siempre hubiera estado la tabla (decisión de Rocío, 25/10): todos los viajes y presupuestos con la tabla de
    // su fecha, sin textos sobre las tarifas de antes y sin cambiar quién los modificó.
    const migracion = leer('database/tarifas/04_viajes_con_la_tabla_de_tarifas.sql');
    assert.ok(/DELETE FROM dbo\.TARIFAS_FIJAS;/.test(migracion) && /DELETE FROM dbo\.TARIFAS_KM;/.test(migracion), '04 borra las tarifas viejas');
    assert.ok(/TarifaFijaID = NULL, TarifaKmID = NULL/.test(migracion), '04 saca la tarifa vieja de los viajes');
    assert.ok(/FROM dbo\.PRESUPUESTOS ps JOIN #Plan p ON p\.Clase = N'Presupuesto'/.test(migracion), '04 recalcula los presupuestos');
    ['Importe facturado', 'Importe anterior', 'Conserva', 'Tarifa fija #', 'Tarifa por km #'].forEach(function (texto) {
        assert.ok(migracion.indexOf(texto) === -1, '04 no deja textos sobre las tarifas de antes: ' + texto);
    });
    assert.ok(!/Usu_Modi|Fecha_Modi|FechaModificacion/.test(migracion), '04 no cambia la fecha ni el usuario de la última modificación');
}

// Eliminar una tabla (Rocío, 25/10): no si la usan viajes o presupuestos pendientes o aceptados, ni si es la única para
// todos los clientes; la anterior vuelve a valer (el "hasta" se calcula).
function probarEliminar() {
    const api = leer('WebApi_TransporteSanchez/Controllers/TarifarioController.cs');
    assert.ok(/if \(t\.Presupuestos > 0\)/.test(api) && /if \(t\.Unica_General\)/.test(api), 'la API no deja eliminar una tabla que usan presupuestos ni la única general');
    const pantalla = leer('gestion-tarifas.html');
    assert.ok(/function motivoNoEliminar\(t\)/.test(pantalla) && /deshabilitado: true, motivo: motivoNoEliminar\(t\)/.test(pantalla),
        'el botón Eliminar queda deshabilitado con el motivo');
    assert.ok(/'No se puede deshacer\.' \+ queQuedaAlEliminar\(t\)/.test(pantalla), 'la confirmación dice qué tabla vale en su lugar');
}

// Cambiar para quién es una tabla (§34, Rocío 25/10): los clientes que salen toman la tabla que les queda y la confirmación
// lo dice; la única para todos no pasa a algunos (como al eliminar) y no se guarda si un viaje o presupuesto se queda sin tabla.
function probarCambiarClientes() {
    const impacto = leer('WebApi_TransporteSanchez/Tarifas/TarifarioImpacto.cs');
    assert.ok(/private static string PasaA\(/.test(impacto) && /"Pasa a \\""/.test(impacto), 'la confirmación dice a qué tabla pasa el viaje');
    assert.ok(/item\.SinTablaEl = v\.Fecha_Inicio;/.test(impacto) && /item\.SinTablaEl = inicio;/.test(impacto), 'marca los viajes y presupuestos que se quedan sin tabla');
    const api = leer('WebApi_TransporteSanchez/Controllers/TarifarioController.cs');
    assert.ok(/No se puede pasar a solo algunos clientes: es la única tabla para todos los clientes\./.test(api), 'la única para todos no pasa a algunos');
    const enImpacto = api.slice(api.indexOf('public IHttpActionResult Impacto('), api.indexOf('private static TarifarioImpacto.TablaEditada Editada('));
    const enGuardar = api.slice(api.indexOf('private IHttpActionResult Guardar('), api.indexOf('Qué pasa con los viajes y presupuestos') + 400);
    [enImpacto, enGuardar].forEach(function (bloque) {
        assert.ok(/ErroresDeAlcance\(cn, /.test(bloque) && /ErroresSinTabla\(impacto, /.test(bloque), 'Impacto y Guardar controlan lo mismo antes de la confirmación');
    });
    const pantalla = leer('gestion-tarifas.html');
    assert.ok(/id="trAlcanceFijo"/.test(pantalla) && /unicaGeneral = !!\(fila && fila\.Unica_General\)/.test(pantalla), 'la única para todos muestra los clientes como texto');
    assert.ok(/Los demás clientes vuelven a "/.test(pantalla), 'la ayuda dice a qué tabla vuelven los demás clientes');
}

function probarProyecto() {
    const csproj = leer('WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj');
    ['Controllers\\TarifarioController.cs', 'Tarifas\\TarifarioCalculo.cs'].forEach(function (archivo) {
        assert.ok(csproj.indexOf('<Compile Include="' + archivo + '" />') !== -1, archivo + ' tiene que estar en el .csproj');
    });
    const esquema = leer('database/tarifas/02_tarifario_por_vehiculo.sql');
    ['TarifarioID', 'Tarifa_Modo', 'Vuelta', 'Estadia_Modulos', 'Falso_Flete', 'Importe_Base', 'Tarifa_Detalle', 'Importe', 'Importe_Detalle'].forEach(function (c) {
        assert.ok(esquema.indexOf("COL_LENGTH('dbo.VIAJES', '" + c + "') IS NULL") !== -1, '02 agrega VIAJES.' + c + ' solo si falta');
    });
}

probarTiposIguales();
probarValoresDeAgosto();
probarValoresDeEnero();
probarGrillaComoElPdf();
probarImpactoAlGuardar();
probarParaRevisar();
probarViajeGuardaImporte();
probarFijaConExcedente();
probarTablasPorCliente();
probarSinTarifasViejas();
probarEliminar();
probarCambiarClientes();
probarProyecto();
console.log('OK: la tabla de tarifas (fija con excedente y por km, general o propia de algunos clientes), sus valores de enero y agosto 2026 y el importe guardado del viaje');
