const isDesktop = (windowObj) => windowObj.innerWidth > 1200;

function setSubmenuState(item, open) {
  const submenu = item.querySelector('.submenu');
  if (!submenu) return;
  const links = submenu.querySelectorAll('.submenu-link');
  let totalHeight = 0;
  links.forEach((link) => {
    totalHeight += link.offsetHeight || 40;
  });
  // Usar scrollHeight (altura real del contenido) para no recortar el último ítem,
  // más un pequeño margen de seguridad.
  const alturaFinal = Math.max(totalHeight, submenu.scrollHeight) + 8;
  submenu.style.maxHeight = open ? `${alturaFinal}px` : '';
  submenu.classList.toggle('submenu-open', open);
  submenu.classList.toggle('submenu-closed', !open);
}

function initSubmenus(sidebarEl) {
  const sidebarItems = sidebarEl.querySelectorAll('.sidebar-item.has-sub');
  sidebarItems.forEach((item) => {
    setSubmenuState(item, item.classList.contains('active'));

    const link = item.querySelector('.sidebar-link');
    if (!link || link.dataset.boundClick === '1') return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const submenu = item.querySelector('.submenu');
      if (!submenu) return;
      const isOpen = submenu.classList.contains('submenu-open');
      setSubmenuState(item, !isOpen);
    });
    link.dataset.boundClick = '1';
  });
}

function ensureCollapseStyle() {
  if (document.getElementById('js-sidebar-collapse-style')) return;
  var st = document.createElement('style');
  st.id = 'js-sidebar-collapse-style';
  st.textContent = '#sidebar{transition:transform .3s ease;} #main{transition:margin-left .3s ease;} body.js-sidebar-collapsed #sidebar{transform:translateX(-110%);} body.js-sidebar-collapsed #main{margin-left:0 !important;}';
  document.head.appendChild(st);
}

function bindGlobalButtons() {
  // Delegación en document: funciona aunque el header (con .burger-btn) se cargue después por XHR.
  if (window.__sidebarButtonsBound) return;
  document.addEventListener('click', (e) => {
    const burger = e.target.closest && e.target.closest('.burger-btn');
    if (burger) {
      e.preventDefault();
      ensureCollapseStyle();
      if (isDesktop(window)) document.body.classList.toggle('js-sidebar-collapsed');
      return;
    }
    const hide = e.target.closest && e.target.closest('.sidebar-hide');
    if (hide) {
      e.preventDefault();
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;
      sidebar.classList.remove('active');
      sidebar.classList.add('inactive');
      const fondo = document.querySelector('.sidebar-backdrop');
      if (fondo) fondo.remove();
      document.body.style.overflowY = '';
    }
  });
  window.__sidebarButtonsBound = true;
}

function applyResponsiveState(sidebarEl) {
  if (!sidebarEl) return;
  if (isDesktop(window)) {
    sidebarEl.classList.add('active');
    sidebarEl.classList.remove('inactive');
    sidebarEl.classList.add('sidebar-desktop');
  } else {
    sidebarEl.classList.remove('sidebar-desktop');
  }
}

function initializeSidebar() {
  const sidebarEl = document.getElementById('sidebar');
  if (!sidebarEl) return;

  bindGlobalButtons();
  initSubmenus(sidebarEl);
  applyResponsiveState(sidebarEl);
}

window.initializeSidebar = initializeSidebar;

if (!window.__sidebarResizeBound) {
  window.addEventListener('resize', () => {
    initializeSidebar();
  });
  window.__sidebarResizeBound = true;
}

if (document.readyState !== 'loading') {
  initializeSidebar();
} else {
  window.addEventListener('DOMContentLoaded', initializeSidebar);
}