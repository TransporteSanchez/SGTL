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
    assert.ok(/conTabla \? \(object\)tarifario/.test(leer('WebApi_TransporteSanchez/Controllers/PresupuestosController.cs')),
        'el viaje que genera un presupuesto nuevo queda con la tabla de tarifas');

    const tarifas = leer('gestion-tarifas.html');
    assert.ok(tarifas.indexOf('tablaFijas') === -1 && tarifas.indexOf('tablaKm') === -1,
        'Gestionar tarifas ya no carga tarifas fijas por recorrido ni bandas por km: solo la tabla de tarifas');
}

function probarFijaConExcedente() {
    const calculo = leer('WebApi_TransporteSanchez/Tarifas/TarifarioCalculo.cs');
    assert.ok(/decimal excedente = km - t\.Km_Banda3;/.test(calculo) && /v\.Valor_Banda3 \+ Redondear\(v\.Valor_Km \* excedente\)/.test(calculo),
        'con tarifa fija, más de 250 km es la fija de 250 más el excedente por km');
    assert.ok(/if \(p\.PorKm\)[\s\S]{0,200}Redondear\(v\.Valor_Km \* km\)/.test(calculo), 'con tarifa por km, todo el viaje por km');
    // 600 km en un Balancín 2019 en adelante: fija 663.370 + 350 × 2.594 = 1.571.270; por km, 600 × 2.594 = 1.556.400.
    assert.strictEqual(663370 + 350 * 2594, 1571270);
    assert.strictEqual(600 * 2594, 1556400);
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
probarViajeGuardaImporte();
probarFijaConExcedente();
probarProyecto();
console.log('OK: la tabla de tarifas (fija con excedente y por km), sus valores de agosto 2026 y el importe guardado del viaje');
