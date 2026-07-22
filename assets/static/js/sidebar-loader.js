function markActiveSidebarItem() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
  
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  
    sidebar.querySelectorAll('.sidebar-item').forEach((el) => el.classList.remove('active'));
    sidebar.querySelectorAll('.submenu-item').forEach((el) => el.classList.remove('active'));
  
    const activeLinks = sidebar.querySelectorAll('a[href]');
    let activeLink = null;
  
    activeLinks.forEach((link) => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (href && href !== '#' && href === currentPage && !activeLink) {
        activeLink = link;
      }
    });
  
    if (!activeLink) return;
  
    const submenuItem = activeLink.closest('.submenu-item');
    if (submenuItem) submenuItem.classList.add('active');
  
    const sidebarItem = activeLink.closest('.sidebar-item');
    if (sidebarItem) sidebarItem.classList.add('active');
  }
  
  function buildFallbackSidebarHtml() {
    return `
  <div class="sidebar-wrapper active">
      <div class="sidebar-header position-relative">
          <div class="d-flex justify-content-between align-items-center">
              <div class="logo">
                  <a href="index.html">
                      <img src="./assets/compiled/svg/ts-logo-text.svg" alt="Logo" style="width: 240px; height: 160px">
                  </a>
              </div>
              <div class="sidebar-toggler x">
                  <a href="#" class="sidebar-hide d-xl-none d-block">
                      <i class="bi bi-x bi-middle"></i>
                  </a>
              </div>
          </div>
      </div>
      <div class="sidebar-menu">
          <ul class="menu">
              <li class="sidebar-item"><a href="index.html" class="sidebar-link"><i class="bi bi-grid-fill"></i><span>Dashboard</span></a></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-file-earmark-person"></i><span>Choferes</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-choferes.html" class="submenu-link">Listar choferes</a></li><li class="submenu-item"><a href="gestion-choferes.html" class="submenu-link">Gestionar choferes</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-truck"></i><span>Camiones</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-camiones.html" class="submenu-link">Listar camiones</a></li><li class="submenu-item"><a href="gestion-camiones.html" class="submenu-link">Gestionar camiones</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-calendar-check"></i><span>Viajes</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-viajes.html" class="submenu-link">Listar viajes</a></li><li class="submenu-item"><a href="gestion-viajes.html" class="submenu-link">Gestionar viajes</a></li><li class="submenu-item"><a href="gestion-origenes-destinos.html" class="submenu-link">Gestionar orígenes y destinos</a></li><li class="submenu-item"><a href="gestion-tarifas.html" class="submenu-link">Gestionar tarifas</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-person-workspace"></i><span>Clientes</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-clientes.html" class="submenu-link">Listar clientes</a></li><li class="submenu-item"><a href="gestion-clientes.html" class="submenu-link">Gestionar clientes</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-file-earmark-medical"></i><span>Facturación</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-facturas.html" class="submenu-link">Listar facturas</a></li><li class="submenu-item"><a href="gestion-facturacion.html" class="submenu-link">Gestionar facturas</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-people-fill"></i><span>Usuarios</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-usuarios.html" class="submenu-link">Listar usuarios</a></li><li class="submenu-item"><a href="gestion-usuarios.html" class="submenu-link">Gestionar usuarios</a></li><li class="submenu-item"><a href="gestion-gruposypermisos.html" class="submenu-link">Gestionar grupos y permisos</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-file-earmark-richtext"></i><span>Documentación</span></a><ul class="submenu"><li class="submenu-item"><a href="#" class="submenu-link">Manual de usuario</a></li><li class="submenu-item"><a href="#" class="submenu-link">Otros</a></li></ul></li>
              <li class="sidebar-item"><a href="gestion-contenido.html" class="sidebar-link" id="gestionarContenidoBtn"><i class="bi bi-columns"></i><span>Gestionar contenido</span></a></li>
          </ul>
      </div>
  </div>`;
  }
  
  function applySidebar(sidebarRoot, html) {
    sidebarRoot.innerHTML = html;
    markActiveSidebarItem();
  
    if (typeof window.initializeSidebar === 'function') {
      window.initializeSidebar();
    }
  }
  
  function loadSidebar() {
    return new Promise((resolve, reject) => {
      const sidebarRoot = document.getElementById('sidebar');
      if (!sidebarRoot) {
        resolve();
        return;
      }
  
      // Always render immediately from local template to guarantee
      // menu availability regardless of hosting mode (file:// or http://).
      applySidebar(sidebarRoot, buildFallbackSidebarHtml());
      resolve();
    });
  }
  
  window.loadSidebar = loadSidebar;
  
  if (document.readyState !== 'loading') {
    loadSidebar().catch((err) => console.error(err));
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      loadSidebar().catch((err) => console.error(err));
    });
  }