function apiDelEncabezado() {
  return window.SGTL ? SGTL.api : 'http://localhost:50222/api';
}

function loadHeader() {
  return fetch('views/header.html').then(respuesta => {
    if (!respuesta.ok) throw new Error('No se pudo cargar el encabezado.');
    return respuesta.text();
  }).then(html => {
    document.getElementById('header-container').innerHTML = html;
    setupUserInfo();
  });
}

function setupUserInfo() {
  const token = localStorage.getItem('token');

  if (!token) {
    document.getElementById('loading-redirect').style.display = 'flex';
    window.location.replace('Login.html');
    return;
  }

  mostrarUsuario();
  colorDelMenu().then(color => {
    if (color) document.getElementById('userInitials').style.backgroundColor = color;
  }, () => {});

  document.getElementById('logoutBtn').addEventListener('click', evento => {
    evento.preventDefault();
    ['token', 'username', 'nombre', 'apellido', 'userRole'].forEach(clave => localStorage.removeItem(clave));
    fetch(apiDelEncabezado() + '/logout', {
      method: 'POST',
      keepalive: true,
      headers: { Authorization: 'Bearer ' + token }
    }).catch(() => {});
    window.location.replace('Login.html');
  });
}

function mostrarUsuario() {
  const nombre = localStorage.getItem('nombre');
  const apellido = localStorage.getItem('apellido');
  if (!nombre || !apellido) return;

  const iniciales = document.getElementById('userInitials');
  document.getElementById('usernameDisplay').textContent = nombre + ' ' + apellido;
  iniciales.textContent = (nombre[0] + apellido[0]).toUpperCase();
  Object.assign(iniciales.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: window.SGTL_CONTENIDO_DEFAULT.menu,
    color: '#fff',
    borderRadius: '50%',
    fontWeight: 'bold',
    fontSize: '1rem'
  });
}

function colorDelMenu() {
  return fetch(apiDelEncabezado() + '/GestionContenido/1').then(respuesta => {
    if (!respuesta.ok) throw new Error('No se pudo cargar la apariencia.');
    return respuesta.json();
  }).then(contenido => contenido.ColorBotonesMenu);
}
