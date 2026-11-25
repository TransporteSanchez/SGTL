(function sessionGuard() {
  var page = (window.location.pathname.split('/').pop() || '').toLowerCase();
  if (page === 'login.html' || page === '') return;

  var token = null, username = null;
  try { token = localStorage.getItem('token'); username = localStorage.getItem('username'); } catch (e) { }

  function tokenVencido(t) {
    if (!t) return true;
    try {
      var payload = t.split('.')[1];
      if (!payload) return true;
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4) payload += '=';
      var datos = JSON.parse(decodeURIComponent(escape(atob(payload))));
      if (!datos.exp) return false;                 
      return (datos.exp * 1000) <= Date.now();       
    } catch (e) {
      return true;                                   
    }
  }

  if (!token || !username || tokenVencido(token)) {
    irAlLogin();
    return;
  }

  var paginasSoloAdmin = ['gestion-contenido.html', 'configuracion-email.html', 'configuracion-facturacion.html', 'configuracion-whatsapp.html', 'gestion-empresa.html'];
  if (paginasSoloAdmin.indexOf(page) !== -1 && !esAdmin()) window.location.replace('index.html');
})();

function irAlLogin() {
  ['token', 'username', 'userRole', 'nombre', 'apellido'].forEach(function (k) {
    try { localStorage.removeItem(k); } catch (e) { }
  });
  window.location.replace('Login.html');
}

function markActiveSidebarItem() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
  
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  
    sidebar.querySelectorAll('.sidebar-item').forEach((el) => el.classList.remove('active'));
    sidebar.querySelectorAll('.submenu-item').forEach((el) => el.classList.remove('active'));
  
    const activeLinks = sidebar.querySelectorAll('.sidebar-item a[href]');
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
  
  function esAdmin() {
    return normalizaPerm(localStorage.getItem('userRole')) === 'admin';
  }
  
  function buildFallbackSidebarHtml() {
    var soloAdmin = esAdmin() ? '' : ' d-none';
    return `
  <div class="sidebar-wrapper active">
      <div class="sidebar-header position-relative">
          <div class="d-flex justify-content-between align-items-center">
              <div class="logo">
                  <a href="index.html">
                    <img src="./assets/static/images/logo/sgtl-logo.png" alt="Logo de SGTL" style="width: 220px; max-width: 100%; height: auto;">
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
              <li class="sidebar-item"><a href="tableros.html" class="sidebar-link"><i class="bi bi-bar-chart-line"></i><span>Tableros</span></a></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-file-earmark-person"></i><span>Choferes</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-choferes.html" class="submenu-link">Listar choferes</a></li><li class="submenu-item"><a href="gestion-choferes.html" class="submenu-link">Gestionar choferes</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-truck"></i><span>Camiones</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-camiones.html" class="submenu-link">Listar camiones</a></li><li class="submenu-item"><a href="gestion-camiones.html" class="submenu-link">Gestionar camiones</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-person-workspace"></i><span>Clientes</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-clientes.html" class="submenu-link">Listar clientes</a></li><li class="submenu-item"><a href="gestion-clientes.html" class="submenu-link">Gestionar clientes</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-calendar-check"></i><span>Viajes</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-viajes.html" class="submenu-link">Listar viajes</a></li><li class="submenu-item"><a href="gestion-viajes.html" class="submenu-link">Gestionar viajes</a></li><li class="submenu-item"><a href="gestion-origenes-destinos.html" class="submenu-link">Gestionar orígenes y destinos</a></li><li class="submenu-item"><a href="gestion-tarifas.html" class="submenu-link">Gestionar tarifas</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-file-earmark-medical"></i><span>Facturación</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-proformas.html" class="submenu-link">Listar proformas</a></li><li class="submenu-item"><a href="gestion-proformas.html" class="submenu-link">Gestionar proformas</a></li><li class="submenu-item${soloAdmin}"><a href="configuracion-facturacion.html" class="submenu-link">Gestionar tipos de comprobante</a></li></ul></li>
              <li class="sidebar-item has-sub${soloAdmin}"><a href="#" class="sidebar-link"><i class="bi bi-gear"></i><span>Configuración</span></a><ul class="submenu"><li class="submenu-item"><a href="configuracion-email.html" class="submenu-link">Gestionar e-mail</a></li><li class="submenu-item"><a href="configuracion-whatsapp.html" class="submenu-link">Gestionar WhatsApp</a></li><li class="submenu-item"><a href="gestion-empresa.html" class="submenu-link">Gestionar empresa</a></li><li class="submenu-item"><a href="gestion-contenido.html" class="submenu-link" id="gestionarContenidoBtn">Gestionar contenido</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-people-fill"></i><span>Usuarios</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-usuarios.html" class="submenu-link">Listar usuarios</a></li><li class="submenu-item"><a href="gestion-usuarios.html" class="submenu-link">Gestionar usuarios</a></li><li class="submenu-item"><a href="gestion-gruposypermisos.html" class="submenu-link">Gestionar grupos y permisos</a></li></ul></li>
              <li class="sidebar-item"><a href="gestion-auditoria.html" class="sidebar-link"><i class="bi bi-clipboard-data"></i><span>Auditoría</span></a></li>
          </ul>
      </div>
  </div>`;
  }
  
var API_PERM = 'http://localhost:50222/api';
var MENU_TO_PAGE = {
  'dashboard': 'index.html',
  'tableros de viajes': 'tableros.html',
  'tableros de flota': 'tableros.html',
  'tableros de choferes': 'tableros.html',
  'tableros de facturacion': 'tableros.html',
  'listado de choferes': 'listado-choferes.html',
  'gestion de choferes': 'gestion-choferes.html',
  'listado de camiones': 'listado-camiones.html',
  'gestion de camiones': 'gestion-camiones.html',
  'listado de viajes': 'listado-viajes.html',
  'gestion de viajes': 'gestion-viajes.html',
  'gestion de origenes y destinos': 'gestion-origenes-destinos.html',
  'gestion de tarifas': 'gestion-tarifas.html',
  'listado de clientes': 'listado-clientes.html',
  'gestion de clientes': 'gestion-clientes.html',
  'listado de proformas': 'listado-proformas.html',
  'gestion de proformas': 'gestion-proformas.html',
  'listado de usuarios': 'listado-usuarios.html',
  'gestion de usuarios': 'gestion-usuarios.html',
  'grupos y permisos': 'gestion-gruposypermisos.html',
  'auditoria': 'gestion-auditoria.html'
};

function normalizaPerm(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

var permisosAplicados = false;
function aplicarPermisos() {
  if (permisosAplicados) return;
  var username = null;
  try { username = localStorage.getItem('username'); } catch (e) { }
  if (!username) return; 
  permisosAplicados = true;
  fetch((window.SGTL ? SGTL.api : API_PERM) + '/Usuarios/MenusPermitidos', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } })
    .then(function (r) { if (r.status === 401) irAlLogin(); if (!r.ok) throw new Error('perm'); return r.json(); })
    .then(function (data) {
      var rol = normalizaPerm(data.Rol);
      if (rol === 'admin') return;
      var permitidas = (data.Menus || []).map(function (m) { return MENU_TO_PAGE[normalizaPerm(m)]; }).filter(Boolean);
      filtrarSidebarPermisos(permitidas);
      guardaAccesoPagina(permitidas);
    })
    .catch(function () { });
}

function filtrarSidebarPermisos(permitidas) {
  var sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.querySelectorAll('.submenu-item').forEach(function (li) {
    var a = li.querySelector('a.submenu-link');
    var href = a ? (a.getAttribute('href') || '').toLowerCase() : '';
    if (href && href !== '#' && permitidas.indexOf(href) === -1) { li.style.display = 'none'; }
  });
  sidebar.querySelectorAll('.sidebar-item').forEach(function (item) {
    if (item.classList.contains('has-sub')) {
      var visibles = Array.prototype.filter.call(item.querySelectorAll('.submenu-item'), function (li) { return li.style.display !== 'none'; });
      if (!visibles.length) { item.style.display = 'none'; }
    } else {
      var a = item.querySelector('a.sidebar-link');
      var href = a ? (a.getAttribute('href') || '').toLowerCase() : '';
      if (href && href !== '#' && permitidas.indexOf(href) === -1) { item.style.display = 'none'; }
    }
  });
}

function guardaAccesoPagina(permitidas) {
  var actual = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (!actual || actual === 'login.html') return;
  if (permitidas.indexOf(actual) !== -1) return; 
  if (permitidas.length) { window.location.replace(permitidas[0]); }
  else { alert('No tenés pantallas asignadas. Contactá al administrador.'); }
}

function applySidebar(sidebarRoot, html) {
    sidebarRoot.innerHTML = html;
    markActiveSidebarItem();
  
    if (typeof window.initializeSidebar === 'function') {
      window.initializeSidebar();
    }
    aplicarPermisos();
  }
  
  function loadSidebar() {
    return new Promise((resolve, reject) => {
      const sidebarRoot = document.getElementById('sidebar');
      if (!sidebarRoot || sidebarRoot.querySelector('.sidebar-wrapper')) {
        resolve();
        return;
      }
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