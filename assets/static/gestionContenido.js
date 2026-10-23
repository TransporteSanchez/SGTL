// Marca SGTL tomada de GESTION_CONTENIDO. Restablecer vuelve a estos valores.
// El "color de fondo" es el color de la marca: la pantalla usa un tono muy claro de él y el color entero
// queda en la línea de arriba (§12 de docs/design-system/03-decisiones.md).
window.SGTL_CONTENIDO_DEFAULT = {
    logo: './assets/static/images/logo/sgtl-logo.png',
    favicon: './assets/static/images/logo/sgtl-icono.png',
    fondo: '#435ebe',
    menu: '#435ebe',
    pie: 'SGTL | un producto de Integra Analistas ®'
};

// Mezcla el color con blanco: con 0.93 queda un 7 % del color, apenas teñido.
function aclararColor(hex, cuanto) {
    var limpio = String(hex || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return '#f6f7fc';
    return '#' + [0, 2, 4].map(function (i) {
        var canal = parseInt(limpio.substr(i, 2), 16);
        return ('0' + Math.round(canal + (255 - canal) * cuanto).toString(16)).slice(-2);
    }).join('');
}

function oscurecerColor(hex) {
    var limpio = String(hex || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return '#364b98';
    var canales = [0, 2, 4].map(function (i) {
        return Math.max(0, Math.round(parseInt(limpio.substr(i, 2), 16) * 0.82));
    });
    return '#' + canales.map(function (n) {
        return ('0' + n.toString(16)).slice(-2);
    }).join('');
}

// Contraste con el blanco (1 a 21). Para texto chico hace falta 4,5 o más.
function contrasteConBlanco(hex) {
    var limpio = String(hex || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return 21;
    var luminancia = [0, 2, 4].reduce(function (suma, i, n) {
        var v = parseInt(limpio.substr(i, 2), 16) / 255;
        v = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        return suma + v * [0.2126, 0.7152, 0.0722][n];
    }, 0);
    return 1.05 / (luminancia + 0.05);
}

// El color de lo que va sobre blanco (línea de arriba, íconos de los títulos, pestañas, paso actual): el de fondo si se
// lee; si es muy claro (por ejemplo, #e4eef8), el del menú; si tampoco, el de fondo oscurecido hasta que se lea.
// El fondo de la pantalla sigue con el color elegido (reporte de la VM del 23/10, F1).
function colorDeAcento(fondo, menu) {
    if (contrasteConBlanco(fondo) >= 4.5) return fondo;
    if (contrasteConBlanco(menu) >= 4.5) return menu;
    var limpio = String(fondo || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return window.SGTL_CONTENIDO_DEFAULT.fondo;
    var canales = [0, 2, 4].map(function (i) { return parseInt(limpio.substr(i, 2), 16); });
    var oscuro = fondo;
    for (var factor = 0.95; factor > 0 && contrasteConBlanco(oscuro) < 4.5; factor -= 0.05) {
        oscuro = '#' + canales.map(function (c) { return ('0' + Math.round(c * factor).toString(16)).slice(-2); }).join('');
    }
    return oscuro;
}

window.cargarEstilosContenido = function () {
    return fetch('http://localhost:50222/api/GestionContenido/1', { cache: 'no-store' })
        .then(function (respuesta) {
            if (!respuesta.ok) throw new Error('No se pudo cargar la configuración de contenido.');
            return respuesta.json();
        }).then(function (datos) {
            window.applyStyles(datos.Logo, datos.ColorFondo, datos.ColorBotonesMenu, datos.ContenidoPiePagina);
        });
};

window.applyStyles = function applyStyles(logoUrl, colorFondo, colorBotonesMenu, contenidoPiePagina) {
    const logoElement = document.querySelector('.sidebar-header .logo img');
    if (logoElement) {
        logoElement.src = logoUrl || './assets/static/images/logo/sgtl-logo.png';
    }

    // El ícono de la pestaña es siempre el de SGTL: el logo completo no se lee a ese tamaño.
    const favicon = document.querySelector('link[rel="shortcut icon"]') || document.createElement('link');
    favicon.rel = 'shortcut icon';
    favicon.href = window.SGTL_CONTENIDO_DEFAULT.favicon;
    if (!favicon.parentNode) document.head.appendChild(favicon);

    var marca = window.SGTL_CONTENIDO_DEFAULT;
    var fondo = colorFondo || marca.fondo;
    var menu = colorBotonesMenu || marca.menu;
    var fondoClaro = aclararColor(fondo, 0.93);
    document.body.style.backgroundColor = fondoClaro;
    // Para lo que tiene que tapar el contenido con el mismo color de fondo (por ejemplo, la fila fija del tablero).
    document.documentElement.style.setProperty('--sgtl-fondo', fondoClaro);
    // Línea de arriba, íconos de los títulos, pestañas y paso actual (sgtl.css, §12): siempre un color que se lea.
    var acento = colorDeAcento(fondo, menu);
    document.documentElement.style.setProperty('--sgtl-marca', acento);
    document.documentElement.style.setProperty('--sgtl-marca-oscuro', oscurecerColor(acento));
    document.documentElement.style.setProperty('--sgtl-menu', menu);

    // El círculo de las iniciales lleva el color del menú; así cambia junto con él al guardar o restablecer.
    const iniciales = document.getElementById('userInitials');
    if (iniciales && iniciales.textContent.trim()) iniciales.style.backgroundColor = menu;

    // Aplicar color **solo** al sidebar-link activo
    const activeSidebarLinks = document.querySelectorAll('.sidebar-item.active .sidebar-link');
    activeSidebarLinks.forEach(link => {
        link.style.backgroundColor = menu; // Color de fondo para el activo
        link.style.color = '#fff'; // Texto blanco
    });

    // Aplicar estilos dinámicos para que el color también funcione con cambios de clase
    const dynamicStyle = document.getElementById('estilos-gestion-contenido') || document.createElement('style');
    dynamicStyle.id = 'estilos-gestion-contenido';
    dynamicStyle.innerHTML = `
        /* Estilos solo para el enlace activo */
        .sidebar-item.active .sidebar-link {
            background-color: ${menu} !important;
            color: #fff !important;
            font-weight: bold;
            border-radius: 5px;
        }

        /* Hover en el enlace activo */
        .sidebar-item.active .sidebar-link:hover {
            background-color: ${oscurecerColor(menu)} !important;
        }

        /* Estilos normales para los enlaces no activos */
        .sidebar-link {
            color: #ffffff;
            background-color: transparent;
        }

        /* Hover en enlaces normales */
        .sidebar-link:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        /* Botón hamburguesa */
        .burger-btn i {
            color: ${menu} !important;
        }

        /* Hover en botón hamburguesa */
        .burger-btn:hover i {
            color: ${oscurecerColor(menu)} !important;
        }

        /* Hover en submenu-link */
        .submenu-item .submenu-link:hover {
            color: ${menu} !important;
        }

        /* Aplica color al submenu-item activo */
        .submenu-item.active .submenu-link {
            color: ${menu} !important;
            font-weight: bold;
        }
    `;
    document.head.appendChild(dynamicStyle);

    // Configuración del contenido en el pie de página
    const footerContentElement = document.querySelector('.footer p');
    if (footerContentElement) {
        footerContentElement.innerHTML = contenidoPiePagina || marca.pie;
    }

    console.log("Color del menú aplicado a .sidebar-item.active .sidebar-link y .submenu-item.active .submenu-link:", colorBotonesMenu);
}

