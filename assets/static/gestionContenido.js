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

        /* ✅ Nuevo: Aplica color al submenu-item activo */
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

