// Marca SGTL tomada de GESTION_CONTENIDO. Restablecer vuelve a estos valores.
window.SGTL_CONTENIDO_DEFAULT = {
    logo: './assets/compiled/svg/ts-logo-text.svg',
    favicon: './assets/compiled/svg/ts-icon.svg',
    fondo: '#e4eef8',
    menu: '#435ebe',
    pie: 'SGTL | un producto de Integra Analistas ®'
};

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
        logoElement.src = logoUrl || './assets/compiled/svg/ts-logo-text.svg';
    }

    const favicon = document.querySelector('link[rel="shortcut icon"]') || document.createElement('link');
    favicon.rel = 'shortcut icon';
    favicon.href = logoUrl || './assets/compiled/svg/ts-icon.svg';
    document.head.appendChild(favicon);

    var marca = window.SGTL_CONTENIDO_DEFAULT;
    var fondo = colorFondo || marca.fondo;
    var menu = colorBotonesMenu || marca.menu;
    document.body.style.backgroundColor = fondo;
    // Para lo que tiene que tapar el contenido con el mismo color de fondo (por ejemplo, la fila fija del tablero).
    document.documentElement.style.setProperty('--sgtl-fondo', fondo);

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

