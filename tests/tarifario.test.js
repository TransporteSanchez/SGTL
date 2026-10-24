// Tarifario por tipo de camión (24/10): la tabla "Tarifas a agosto 2026". El precio del viaje sale del tipo de camión,
// el año del modelo, los km (por banda, con 1ª y 2ª vuelta en la primera) y los adicionales (falso flete y estadía).
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

function probarValoresDeAgosto() {
    const script = leer('database/tarifas/03_cargar_tarifario_agosto_2026.sql');
    const filas = [];
    script.replace(/\(@Id, ([01]), N'([^']+)',\s+(\d+), (\d+), (\d+), (\d+), (\d+)\)/g, function (_, nuevo, tipo, a, b, c, d, e) {
        filas.push({ nuevo: nuevo === '1', tipo: tipo, valores: [a, b, c, d, e].map(Number) });
    });
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
    assert.ok(/'2026-08-01', 2019, 130, 190, 250, 96577, 6, 12, 18, 60/.test(script),
        'vigente desde el 01/08/2026, corte 2019, bandas 130/190/250, estadía 96.577 por 6 hs, 12 y 18 hs, falso flete 60 %');
}

function probarViajeGuardaImporte() {
    const viajes = leer('WebApi_TransporteSanchez/Controllers/ViajesController.cs');
    assert.ok(/GuardarImporte\(db, viaje\.Viaje_ID, viajeDto, calculo\)/.test(viajes), 'el alta del viaje guarda el importe calculado por la API');
    assert.ok(/if \(calculo\.Ok\) GuardarImporte\(db, id,/.test(viajes), 'la edición del viaje guarda el importe');
    assert.ok(/WHEN v\.Importe IS NOT NULL THEN v\.Importe/.test(viajes), 'el costo del dashboard usa el importe guardado');

    const proformas = leer('WebApi_TransporteSanchez/Controllers/ProformasController.cs');
    const guardado = proformas.indexOf('t.Guardados.TryGetValue(viajeId');
    const presupuesto = proformas.indexOf('if (t.PresupuestoDatos.ContainsKey(viajeId))');
    assert.ok(guardado !== -1 && guardado < presupuesto, 'Traer viajes y el control de Rukas leen primero el importe guardado');

    const pantalla = leer('gestion-viajes.html');
    ['TarifarioID:', 'Vuelta:', 'Falso_Flete:', 'Estadia_Modulos:'].forEach(function (campo) {
        assert.ok(pantalla.indexOf(campo) !== -1, 'Registrar viaje manda ' + campo.replace(':', ''));
    });
    assert.ok(/id="tarifaTipoTarifario" value="tarifario" checked/.test(pantalla), 'Tarifario viene elegido al registrar un viaje');
    assert.ok(/id="opcionTarifaKm">/.test(pantalla) && /class="form-check d-none" id="opcionTarifaKm"/.test(pantalla),
        'Por km queda oculto: solo aparece en los viajes que ya la tienen');
}

function probarProyecto() {
    const csproj = leer('WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj');
    ['Controllers\\TarifarioController.cs', 'Tarifas\\TarifarioCalculo.cs'].forEach(function (archivo) {
        assert.ok(csproj.indexOf('<Compile Include="' + archivo + '" />') !== -1, archivo + ' tiene que estar en el .csproj');
    });
    const esquema = leer('database/tarifas/02_tarifario_por_vehiculo.sql');
    ['TarifarioID', 'Vuelta', 'Estadia_Modulos', 'Falso_Flete', 'Importe_Base', 'Tarifa_Detalle', 'Importe', 'Importe_Detalle'].forEach(function (c) {
        assert.ok(esquema.indexOf("COL_LENGTH('dbo.VIAJES', '" + c + "') IS NULL") !== -1, '02 agrega VIAJES.' + c + ' solo si falta');
    });
}

probarTiposIguales();
probarValoresDeAgosto();
probarViajeGuardaImporte();
probarProyecto();
console.log('OK: el tarifario por tipo de camión, sus valores de agosto 2026 y el importe guardado del viaje');
