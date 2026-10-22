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
    return;
  }

  var paginasConfiguracion = [
    'configuracion-facturacion.html', 'configuracion-email.html',
    'configuracion-whatsapp.html', 'gestion-contenido.html'
  ];
  var rol = '';
  try { rol = localStorage.getItem('userRole') || ''; } catch (e) { }
  if (paginasConfiguracion.indexOf(page) !== -1 && rol.trim().toLowerCase() !== 'admin') {
    window.location.replace('index.html');
  }
})();

function markActiveSidebarItem() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
  
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  
    sidebar.querySelectorAll('.sidebar-item').forEach((el) => el.classList.remove('active'));
    sidebar.querySelectorAll('.submenu-item').forEach((el) => el.classList.remove('active'));
  
    // Solo los enlaces de las opciones: el logo también apunta a index.html y tapaba a Dashboard.
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
  
  function buildFallbackSidebarHtml() {
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
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-file-earmark-person"></i><span>Choferes</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-choferes.html" class="submenu-link">Listar choferes</a></li><li class="submenu-item"><a href="gestion-choferes.html" class="submenu-link">Gestionar choferes</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-truck"></i><span>Camiones</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-camiones.html" class="submenu-link">Listar camiones</a></li><li class="submenu-item"><a href="gestion-camiones.html" class="submenu-link">Gestionar camiones</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-calendar-check"></i><span>Viajes</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-viajes.html" class="submenu-link">Listar viajes</a></li><li class="submenu-item"><a href="gestion-viajes.html" class="submenu-link">Gestionar viajes</a></li><li class="submenu-item"><a href="gestion-origenes-destinos.html" class="submenu-link">Gestionar orígenes y destinos</a></li><li class="submenu-item"><a href="gestion-tarifas.html" class="submenu-link">Gestionar tarifas</a></li><li class="submenu-item"><a href="presupuestos.html" class="submenu-link">Gestionar presupuestos</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-person-workspace"></i><span>Clientes</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-clientes.html" class="submenu-link">Listar clientes</a></li><li class="submenu-item"><a href="gestion-clientes.html" class="submenu-link">Gestionar clientes</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-file-earmark-medical"></i><span>Facturación</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-facturas.html" class="submenu-link">Listar proformas</a></li><li class="submenu-item"><a href="gestion-facturacion.html" class="submenu-link">Gestionar proformas</a></li><li class="submenu-item"><a href="cuenta-corriente-clientes.html" class="submenu-link">Gestionar cuenta corriente</a></li></ul></li>
              <li class="sidebar-item has-sub configuracion-menu"><a href="#" class="sidebar-link"><i class="bi bi-gear"></i><span>Configuración</span></a><ul class="submenu"><li class="submenu-item"><a href="configuracion-facturacion.html" class="submenu-link">Gestionar facturación</a></li><li class="submenu-item"><a href="configuracion-email.html" class="submenu-link">Gestionar e-mail</a></li><li class="submenu-item"><a href="gestion-contenido.html" class="submenu-link" id="gestionarContenidoBtn">Gestionar contenido</a></li><li class="submenu-item"><a href="configuracion-whatsapp.html" class="submenu-link">Gestionar integración de WhatsApp</a></li></ul></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-people-fill"></i><span>Usuarios</span></a><ul class="submenu"><li class="submenu-item"><a href="listado-usuarios.html" class="submenu-link">Listar usuarios</a></li><li class="submenu-item"><a href="gestion-usuarios.html" class="submenu-link">Gestionar usuarios</a></li><li class="submenu-item"><a href="gestion-gruposypermisos.html" class="submenu-link">Gestionar grupos y permisos</a></li></ul></li>
              <li class="sidebar-item"><a href="gestion-auditoria.html" class="sidebar-link"><i class="bi bi-clipboard-data"></i><span>Auditoría</span></a></li>
              <li class="sidebar-item has-sub"><a href="#" class="sidebar-link"><i class="bi bi-file-earmark-richtext"></i><span>Documentación</span></a><ul class="submenu"><li class="submenu-item"><a href="manual-usuario.html" class="submenu-link">Consultar manual de usuario</a></li><li class="submenu-item"><a href="informe-version.html" class="submenu-link">Consultar informe de versión</a></li></ul></li>
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
  'gestionar viajes': 'gestion-viajes.html',
  'presupuestos': 'presupuestos.html',
  'gestionar presupuestos': 'presupuestos.html',
  'gestion de origenes y destinos': 'gestion-origenes-destinos.html',
  'gestion de tarifas': 'gestion-tarifas.html',
  'listado de clientes': 'listado-clientes.html',
  'gestion de clientes': 'gestion-clientes.html',
  'listado de proformas': 'listado-facturas.html',
  'gestion de proformas': 'gestion-facturacion.html',
  // Se mantienen las claves anteriores para instalaciones que todavía no actualizaron el catálogo.
  'listado de facturas': 'listado-facturas.html',
  'gestion de facturas': 'gestion-facturacion.html',
  'cuenta corriente': 'cuenta-corriente-clientes.html',
  'cuenta corriente de clientes': 'cuenta-corriente-clientes.html',
  'configuracion': 'configuracion-email.html',
  'configuración': 'configuracion-email.html',
  'facturacion': 'configuracion-facturacion.html',
  'facturación': 'configuracion-facturacion.html',
  'configuracion facturacion': 'configuracion-facturacion.html',
  'configuración facturación': 'configuracion-facturacion.html',
  'e-mail': 'configuracion-email.html',
  'email': 'configuracion-email.html',
  'integracion whatsapp': 'configuracion-whatsapp.html',
  'integración whatsapp': 'configuracion-whatsapp.html',
  'whatsapp': 'configuracion-whatsapp.html',
  'configuracion whatsapp': 'configuracion-whatsapp.html',
  'listado de usuarios': 'listado-usuarios.html',
  'gestion de usuarios': 'gestion-usuarios.html',
  'grupos y permisos': 'gestion-gruposypermisos.html',
  'gestion de contenido': 'gestion-contenido.html',
  'auditoria': 'gestion-auditoria.html',
  'consultar auditoria': 'gestion-auditoria.html'
};

function normalizaPerm(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

var PAGINAS_CONFIGURACION = [
  'configuracion-facturacion.html', 'configuracion-email.html',
  'configuracion-whatsapp.html', 'gestion-contenido.html'
];

function restringirConfiguracionAAdmin(rol) {
  var sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  var menu = sidebar.querySelector('.configuracion-menu');
  if (!menu) return;
  menu.style.display = normalizaPerm(rol) === 'admin' ? '' : 'none';
}

function esPaginaConfiguracion() {
  var actual = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  return PAGINAS_CONFIGURACION.indexOf(actual) !== -1;
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
      restringirConfiguracionAAdmin(rol);
      if (rol === 'admin') { mantenerVisibleContenido(true); return; } // superadmin: acceso total
      if (esPaginaConfiguracion()) {
        window.location.replace('index.html');
        return;
      }
      var permitidas = (data.Menus || []).map(function (m) { return MENU_TO_PAGE[normalizaPerm(m)]; }).filter(Boolean);
      // La documentación publicada está disponible para todos los usuarios activos.
      permitidas.push('manual-usuario.html', 'informe-version.html');
      // Compatibilidad temporal del prototipo frontend: hasta contar con un permiso
      // propio en base de datos, Cuenta Corriente acompaña los accesos de Facturación.
      if (permitidas.indexOf('listado-facturas.html') !== -1 || permitidas.indexOf('gestion-facturacion.html') !== -1) {
        permitidas.push('cuenta-corriente-clientes.html');
      }
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

// Mazer no deja partir los ítems del submenú y los nombres largos ("Gestionar integración de WhatsApp")
// quedan cortados. Va acá y no en sgtl.css porque el menú está en todas las pantallas y no todas cargan ese CSS.
function estilosMenu() {
    if (document.getElementById('sgtl-estilos-menu')) return;
    var estilo = document.createElement('style');
    estilo.id = 'sgtl-estilos-menu';
    estilo.textContent = '#sidebar .submenu .submenu-item .submenu-link { white-space: normal; line-height: 1.3; }';
    document.head.appendChild(estilo);
}

function applySidebar(sidebarRoot, html) {
    estilosMenu();
    sidebarRoot.innerHTML = html;
    var rol = '';
    try { rol = localStorage.getItem('userRole') || ''; } catch (e) { }
    restringirConfiguracionAAdmin(rol);
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
      if (sidebarRoot.dataset.sgtlLoaded === 'true' && sidebarRoot.querySelector('.sidebar-wrapper')) {
        resolve();
        return;
      }
  
      // Always render immediately from local template to guarantee
      // menu availability regardless of hosting mode (file:// or http://).
      applySidebar(sidebarRoot, buildFallbackSidebarHtml());
      sidebarRoot.dataset.sgtlLoaded = 'true';
      resolve();
    });
  }
  
  window.loadSidebar = loadSidebar;

  // Paginador unificado: las pantallas nuevas pueden invocar render directamente y
  // las pantallas existentes conservan sus eventos de navegación, con la misma
  // alineación y controles compactos.
  (function inicializarPaginacionSGTL() {
    if (window.PaginacionSGTL) return;

    var estilos = '\n' +
      '.sgtl-pagination{display:flex!important;justify-content:flex-end!important;align-items:center;gap:10px;margin-left:auto;padding:0;border:0;flex-wrap:wrap;font-size:.875rem;color:#1f2937}\n' +
      '.sgtl-pagination .sgtl-page-info{display:flex;align-items:center;gap:9px;white-space:nowrap;margin:0}\n' +
      '.sgtl-pagination .sgtl-page-size{min-width:70px;padding:0 18px 4px 0;border:0;border-bottom:1px solid #9ca3af;border-radius:0;background:transparent;color:#374151;cursor:pointer;appearance:auto}\n' +
      '.sgtl-pagination .sgtl-page-range{white-space:nowrap;margin:0 18px 0 4px;color:#111827}\n' +
      '.sgtl-pagination .sgtl-page-action{display:flex!important;margin:0}\n' +
      '.sgtl-pagination .sgtl-page-action .page-link{display:grid;place-items:center;width:32px;height:32px;padding:0;border:0!important;border-radius:50%;background:transparent!important;color:#94a3b8;font-size:1.35rem;box-shadow:none!important}\n' +
      '.sgtl-pagination .sgtl-page-action:not(.disabled) .page-link:hover{background:#f1f5f9!important;color:#475569}\n' +
      '.sgtl-pagination .sgtl-page-action.disabled .page-link{opacity:.55;pointer-events:none}\n' +
      '.sgtl-pagination .sgtl-page-number{display:none!important}\n' +
      '@media (max-width:575.98px){.sgtl-pagination{justify-content:center!important}.sgtl-pagination .sgtl-page-range{margin-right:2px}.sgtl-pagination .sgtl-page-info{width:100%;justify-content:center}}\n';
    var etiqueta = document.createElement('style');
    etiqueta.id = 'sgtl-pagination-styles';
    etiqueta.textContent = estilos;
    (document.head || document.documentElement).appendChild(etiqueta);

    function numero(valor, alternativo) {
      var resultado = Number(valor);
      return isFinite(resultado) ? resultado : alternativo;
    }

    function crearItem(clase, contenido) {
      var item = document.createElement('li');
      item.className = clase;
      item.innerHTML = contenido;
      return item;
    }

    function render(contenedor, opciones) {
      if (!contenedor) return;
      opciones = opciones || {};
      var total = Math.max(0, numero(opciones.total, 0));
      var tamanioSeleccionado = numero(opciones.tamanioPagina, 15);
      var tamanio = tamanioSeleccionado === 0 ? Math.max(total, 1) : Math.max(1, tamanioSeleccionado);
      var paginas = Math.max(1, Math.ceil(total / tamanio));
      var pagina = Math.min(paginas, Math.max(1, numero(opciones.pagina, 1)));
      var inicio = total ? ((pagina - 1) * tamanio) + 1 : 0;
      var fin = total ? Math.min(total, pagina * tamanio) : 0;
      var anterior = pagina <= 1;
      var siguiente = pagina >= paginas || !total;
      var opcionesTamanio = opciones.opcionesTamanio || [5, 10, 15, 0];
      var opcionesHtml = opcionesTamanio.map(function (opcion) {
        var valor = numero(opcion, 0);
        var seleccionada = valor === tamanioSeleccionado ? ' selected' : '';
        return '<option value="' + valor + '"' + seleccionada + '>' + (valor === 0 ? 'Todos' : valor) + '</option>';
      }).join('');

      contenedor.dataset.sgtlModern = 'true';
      contenedor.className = 'pagination sgtl-pagination mt-3 mb-0';
      contenedor.innerHTML = '';
      contenedor.appendChild(crearItem('sgtl-page-info',
        '<label>Filas por página: <select class="sgtl-page-size" aria-label="Filas por página">' + opcionesHtml + '</select></label>'));
      contenedor.appendChild(crearItem('sgtl-page-range', inicio + '-' + fin + ' de ' + total));
      contenedor.appendChild(crearItem('page-item sgtl-page-action ' + (anterior ? 'disabled' : ''),
        '<button class="page-link" type="button" data-page="' + (pagina - 1) + '" aria-label="Página anterior"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>'));
      contenedor.appendChild(crearItem('page-item sgtl-page-action ' + (siguiente ? 'disabled' : ''),
        '<button class="page-link" type="button" data-page="' + (pagina + 1) + '" aria-label="Página siguiente"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>'));
      if (typeof opciones.alCambiarPagina === 'function') {
        Array.prototype.forEach.call(contenedor.querySelectorAll('[data-page]'), function (control) {
          control.addEventListener('click', function (evento) {
            evento.preventDefault();
            if (control.closest('.disabled')) return;
            opciones.alCambiarPagina(Number(control.getAttribute('data-page')));
          });
        });
      }
      if (typeof opciones.alCambiarTamanio === 'function') {
        var selectorTamanio = contenedor.querySelector('.sgtl-page-size');
        selectorTamanio.addEventListener('change', function () {
          opciones.alCambiarTamanio(numero(selectorTamanio.value, tamanioSeleccionado));
        });
      }
    }

    window.PaginacionSGTL = { render: render };
  })();
  
  if (document.readyState !== 'loading') {
    loadSidebar().catch((err) => console.error(err));
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      loadSidebar().catch((err) => console.error(err));
    });
  }
