window.applyStyles = function applyStyles(logoUrl, colorFondo, colorBotonesMenu, contenidoPiePagina) {
    const logoElement = document.querySelector('.sidebar-header .logo img');
    if (logoElement) {
        logoElement.src = logoUrl || './assets/compiled/svg/ts-logo-text.svg';
    }
    const favicon = document.querySelector('link[rel="shortcut icon"]') || document.createElement('link');
    favicon.rel = 'shortcut icon';
    favicon.href = logoUrl || './assets/compiled/svg/ts-icon.svg';
    document.head.appendChild(favicon);
    // Color de fondo general
    document.body.style.backgroundColor = colorFondo || '#198754';
    // Aplicar color **solo** al sidebar-link activo
    const activeSidebarLinks = document.querySelectorAll('.sidebar-item.active .sidebar-link');
    activeSidebarLinks.forEach(link => {
        link.style.backgroundColor = colorBotonesMenu || '#198754'; // Color de fondo para el activo
        link.style.color = '#fff'; // Texto blanco
    });
    // Aplicar estilos dinámicos para que el color también funcione con cambios de clase
    const dynamicStyle = document.createElement('style');
    dynamicStyle.innerHTML = `
        /* Estilos solo para el enlace activo */
        .sidebar-item.active .sidebar-link {
            background-color: ${colorBotonesMenu || '#198754'} !important;
            color: #fff !important;
            font-weight: bold;
            border-radius: 5px;
        }
        /* Hover en el enlace activo */
        .sidebar-item.active .sidebar-link:hover {
            background-color: ${colorBotonesMenu || '#156a3e'} !important;
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
            color: ${colorBotonesMenu || '#198754'} !important;
        }
        /* Hover en botón hamburguesa */
        .burger-btn:hover i {
            color: ${colorBotonesMenu || '#156a3e'} !important;
        }
        /* Hover en submenu-link */
        .submenu-item .submenu-link:hover {
            color: ${colorBotonesMenu || '#198754'} !important;
        }
        /* Aplica color al submenu-item activo */
        .submenu-item.active .submenu-link {
            color: ${colorBotonesMenu || '#198754'} !important;
            font-weight: bold;
        }
    `;
    document.head.appendChild(dynamicStyle);
    // Configuración del contenido en el pie de página
    const footerContentElement = document.querySelector('.footer p');
    if (footerContentElement) {
        footerContentElement.innerHTML = contenidoPiePagina || '2024 &copy; Integra Analistas';
    }
    console.log("Color del menú aplicado a .sidebar-item.active .sidebar-link y .submenu-item.active .submenu-link:", colorBotonesMenu);
}
window.SGTL_CONTENIDO_DEFAULT = {
    logo: './assets/compiled/svg/ts-logo-text.svg',
    favicon: './assets/compiled/svg/ts-icon.svg',
    fondo: '#435ebe',
    menu: '#435ebe',
    pie: 'SGTL | un producto de Integra Analistas'
};
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
    return '#' + canales.map(function (n) { return ('0' + n.toString(16)).slice(-2); }).join('');
}
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
    return fetch(SGTL.api + '/GestionContenido/1', {
        cache: 'no-store',
        headers: SGTL.encabezados({ Accept: 'application/json' })
    }).then(function (respuesta) {
        if (!respuesta.ok) throw new Error('No se pudo cargar la apariencia.');
        return respuesta.json();
    }).then(function (datos) {
        var marca = window.SGTL_CONTENIDO_DEFAULT;
        var fondo = datos.ColorFondo || marca.fondo;
        var menu = datos.ColorBotonesMenu || marca.menu;
        var acento = colorDeAcento(fondo, menu);
        var logo = document.querySelector('.sidebar-header .logo img');
        var pie = document.querySelector('.footer p');
        var favicon = document.querySelector('link[rel="shortcut icon"]');
        if (logo) logo.src = datos.Logo || marca.logo;
        if (favicon) favicon.href = marca.favicon;
        if (pie) pie.innerHTML = datos.ContenidoPiePagina || marca.pie;
        document.documentElement.style.setProperty('--sgtl-marca', acento);
        document.documentElement.style.setProperty('--sgtl-marca-oscuro', oscurecerColor(acento));
        document.body.style.backgroundColor = aclararColor(fondo, 0.93);
    });
};
var MAX_LOGO_BYTES = 1024 * 1024;
window.leerArchivoLogo = function (input, alLeer) {
    var archivo = input.files && input.files[0];
    if (!archivo) return;
    var extensionOk = /\.(png|svg|jpe?g|webp|ico)$/i.test(archivo.name);
    var tiposOk = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!extensionOk && tiposOk.indexOf(archivo.type) === -1) {
        SGTL.toastError('Ese formato no sirve para el logo. Elegí un .png, .svg, .jpg, .webp o .ico.');
        input.value = '';
        return;
    }
    if (archivo.size > MAX_LOGO_BYTES) {
        SGTL.toastError('El archivo supera 1 MB. Elegí una imagen más liviana.');
        input.value = '';
        return;
    }
    var lector = new FileReader();
    lector.onload = function (evento) { alLeer(evento.target.result, archivo.name); };
    lector.onerror = function () { SGTL.toastError('No se pudo leer el archivo. Probá con otro.'); };
    lector.readAsDataURL(archivo);
};
window.tamanioLogo = function (dataUri) {
    var base64 = String(dataUri).split(',')[1] || '';
    return Math.max(1, Math.round(base64.length * 3 / 4 / 1024)) + ' KB';
};