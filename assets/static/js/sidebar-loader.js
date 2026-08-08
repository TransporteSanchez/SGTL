// ===================== Guarda de sesión (validación de JWT) =====================
// Se ejecuta al cargar cualquier página que incluya este script (todas las protegidas).
// Login.html NO lo incluye, así que no hay riesgo de bucle de redirección.
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
      if (!datos.exp) return false;                 // sin claim exp: no afirmamos que venció
      return (datos.exp * 1000) <= Date.now();       // exp está en segundos
    } catch (e) {
      return true;                                   // token ilegible => inválido
    }
  }

  if (!token || !username || tokenVencido(token)) {
    ['token', 'username', 'userRole', 'nombre', 'apellido'].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) { }
    });
    window.location.replace('Login.html');
  }
})();

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
              <li class="sidebar-item"><a href="gestion-auditoria.html" class="sidebar-link"><i class="bi bi-clipboard-data"></i><span>Auditoría</span></a></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-file-earmark-richtext"></i><span>Documentación</span></a><ul class="submenu"><li class="submenu-item"><a href="#" class="submenu-link">Manual de usuario</a></li><li class="submenu-item"><a href="#" class="submenu-link">Otros</a></li></ul></li>
              <li class="sidebar-item"><a href="gestion-contenido.html" class="sidebar-link" id="gestionarContenidoBtn"><i class="bi bi-columns"></i><span>Gestionar contenido</span></a></li>
          </ul>
      </div>
  </div>`;
  }
  
  // ===================== RBAC: filtrado de menú + guarda de páginas =====================
var API_PERM = 'http://localhost:50222/api';
var MENU_TO_PAGE = {
  'dashboard': 'index.html',
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
  'listado de facturas': 'listado-facturas.html',
  'gestion de facturas': 'gestion-facturacion.html',
  'listado de usuarios': 'listado-usuarios.html',
  'gestion de usuarios': 'gestion-usuarios.html',
  'grupos y permisos': 'gestion-gruposypermisos.html',
  'gestion de contenido': 'gestion-contenido.html',
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
  if (!username) return; // sin usuario logueado, no filtramos (el header maneja el login)
  permisosAplicados = true;
  fetch(API_PERM + '/Usuarios/MenusPermitidos?username=' + encodeURIComponent(username))
    .then(function (r) { if (!r.ok) throw new Error('perm'); return r.json(); })
    .then(function (data) {
      var rol = normalizaPerm(data.Rol);
      if (rol === 'admin') { mantenerVisibleContenido(true); return; } // superadmin: acceso total
      var permitidas = (data.Menus || []).map(function (m) { return MENU_TO_PAGE[normalizaPerm(m)]; }).filter(Boolean);
      filtrarSidebarPermisos(permitidas);
      guardaAccesoPagina(permitidas);
      // El botón "Gestionar contenido" lo gobierna el RBAC. Algunas páginas lo ocultan
      // por su cuenta (adjustVisibilityBasedOnRole, admin-only); si el grupo tiene el
      // permiso, forzamos que quede visible pese a ese ocultamiento heredado.
      mantenerVisibleContenido(permitidas.indexOf('gestion-contenido.html') !== -1);
    })
    .catch(function () { /* fail-open: si el endpoint falla, no bloqueamos (evita brickear la app) */ });
}

// Mantiene la visibilidad del ítem "Gestionar contenido" acorde al RBAC, incluso si
// una página intenta ocultarlo más tarde (via style.display = 'none').
function mantenerVisibleContenido(permitido) {
  var btn = document.getElementById('gestionarContenidoBtn');
  if (!btn) return;
  var li = btn.closest ? btn.closest('.sidebar-item') : null;
  function fijar() {
    if (!permitido) return;
    if (btn.style.display === 'none') btn.style.display = '';
    if (li && li.style.display === 'none') li.style.display = '';
  }
  fijar(); // corrige el estado actual (por si ya fue ocultado)
  if (permitido && window.MutationObserver) {
    var obs = new MutationObserver(fijar);
    obs.observe(btn, { attributes: true, attributeFilter: ['style'] });
    if (li) obs.observe(li, { attributes: true, attributeFilter: ['style'] });
  }
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
  if (permitidas.indexOf(actual) !== -1) return; // tiene acceso a esta pantalla
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