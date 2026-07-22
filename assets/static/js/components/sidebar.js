const isDesktop = (windowObj) => windowObj.innerWidth > 1200;

function setSubmenuState(item, open) {
  const submenu = item.querySelector('.submenu');
  if (!submenu) return;
  // The theme CSS uses max-height: var(--submenu-height) for open state.
  // Ensure it is always set, otherwise submenu remains visually closed.
  const links = submenu.querySelectorAll('.submenu-link');
  let totalHeight = 0;
  links.forEach((link) => {
    totalHeight += link.offsetHeight || 40;
  });
  // Usar scrollHeight (altura real del contenido) para no recortar el último ítem,
  // más un pequeño margen de seguridad.
  const alturaFinal = Math.max(totalHeight, submenu.scrollHeight) + 8;
  submenu.style.setProperty('--submenu-height', `${alturaFinal}px`);
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

function bindGlobalButtons() {
  document.querySelectorAll('.burger-btn').forEach((el) => {
    if (el.dataset.sidebarBound === '1') return;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;
      const open = sidebar.classList.contains('active');
      sidebar.classList.toggle('active', !open);
      sidebar.classList.toggle('inactive', open);
    });
    el.dataset.sidebarBound = '1';
  });

  document.querySelectorAll('.sidebar-hide').forEach((el) => {
    if (el.dataset.sidebarBound === '1') return;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;
      sidebar.classList.remove('active');
      sidebar.classList.add('inactive');
    });
    el.dataset.sidebarBound = '1';
  });
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