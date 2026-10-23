// Textos de los permisos (23/10). En la base, cada permiso sigue con su nombre de siempre ("Listado de choferes",
// "Gestión de viajes", "Cuenta Corriente"), que es la clave de los permisos en sidebar-loader.js y en la API: no se
// renombra (normalizarlo en la base es un pendiente a futuro). En pantalla se ve el texto de su opción del menú (§3.1)
// y en el mismo orden. Lo usan Gestionar grupos y permisos y Listar usuarios → Ver detalle.
// Uso: SGTLPermisos.texto('Listado de choferes') → 'Listar choferes'; lista.sort(SGTLPermisos.comparar) ordena los
// nombres como el menú. Al agregar o renombrar una opción del menú, actualizar OPCIONES_DEL_MENU
// (tests/permisos-menu.test.js avisa si falta alguna o si no coincide con el menú).
(function (window) {
    'use strict';

    // [nombre en la base, sin tildes ni mayúsculas; texto del menú], en el orden del menú.
    var OPCIONES_DEL_MENU = [
        ['dashboard', 'Dashboard'],
        ['listado de choferes', 'Listar choferes'], ['gestion de choferes', 'Gestionar choferes'],
        ['listado de camiones', 'Listar camiones'], ['gestion de camiones', 'Gestionar camiones'],
        ['listado de viajes', 'Listar viajes'], ['gestion de viajes', 'Gestionar viajes'],
        ['gestion de origenes y destinos', 'Gestionar orígenes y destinos'], ['gestion de tarifas', 'Gestionar tarifas'],
        ['presupuestos', 'Gestionar presupuestos'],
        ['listado de clientes', 'Listar clientes'], ['gestion de clientes', 'Gestionar clientes'],
        ['listado de proformas', 'Listar proformas'], ['gestion de proformas', 'Gestionar proformas'],
        ['cuenta corriente', 'Gestionar cuenta corriente'], ['gestion de tipos de comprobante', 'Gestionar tipos de comprobante'],
        ['e-mail', 'Gestionar e-mail'], ['integracion whatsapp', 'Gestionar integración de WhatsApp'],
        ['gestion de empresa', 'Gestionar empresa'], ['gestion de contenido', 'Gestionar contenido'],
        ['listado de usuarios', 'Listar usuarios'], ['gestion de usuarios', 'Gestionar usuarios'],
        ['grupos y permisos', 'Gestionar grupos y permisos'],
        ['auditoria', 'Auditoría']
    ];

    // Lugar del permiso en el menú, o -1 si no está en la lista.
    function posicion(nombre) {
        var clave = String(nombre == null ? '' : nombre).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        for (var i = 0; i < OPCIONES_DEL_MENU.length; i++) {
            if (OPCIONES_DEL_MENU[i][0] === clave) return i;
        }
        return -1;
    }

    // Un permiso que no está en la lista se ve con su nombre.
    function texto(nombre) {
        var lugar = posicion(nombre);
        return lugar === -1 ? String(nombre == null ? '' : nombre) : OPCIONES_DEL_MENU[lugar][1];
    }

    // Para ordenar nombres como el menú; los que no están en la lista van al final, por texto.
    function comparar(a, b) {
        var lugarA = posicion(a), lugarB = posicion(b);
        if (lugarA === -1) lugarA = OPCIONES_DEL_MENU.length;
        if (lugarB === -1) lugarB = OPCIONES_DEL_MENU.length;
        return lugarA === lugarB ? texto(a).localeCompare(texto(b)) : lugarA - lugarB;
    }

    window.SGTLPermisos = { texto: texto, posicion: posicion, comparar: comparar };
})(window);
