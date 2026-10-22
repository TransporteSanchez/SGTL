function loadHeader() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "views/header.html");
    xhr.onload = function() {
      if (xhr.status === 200) {
        document.getElementById("header-container").innerHTML = xhr.responseText;

        // Configura la verificación de token y la información del usuario
        setupUserInfo();

        resolve(); // Resuelve la promesa cuando el header se ha cargado
      } else {
        console.error('Error al cargar el header:', xhr.statusText);
        reject(new Error('Error al cargar el header'));
      }
    };
    xhr.onerror = function() {
      console.error('Error de red al cargar el header.');
      reject(new Error('Error de red'));
    };
    xhr.send();
  });
}

// Función para verificar el token, cargar el nombre del usuario y configurar el botón de logout
function setupUserInfo() {
  const token = localStorage.getItem('token');
  const loadingRedirect = document.getElementById('loading-redirect');

  // Si no hay token, muestra el loading y redirige al login
  if (!token) {
    if (loadingRedirect) loadingRedirect.style.display = 'flex';
    window.location.replace('Login.html');
    return;
  }

  // Obtener y aplicar el color de fondo de la API `GestionContenido`
  loadDynamicBackgroundColor().then(menuColor => {
    // Si hay token, carga la información del usuario
    const nombre = localStorage.getItem('nombre');
    const apellido = localStorage.getItem('apellido');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userInitialsContainer = document.getElementById('userInitials'); 

    if (usernameDisplay && nombre && apellido) {
      usernameDisplay.textContent = `${nombre} ${apellido}`;

      // Generar iniciales
      const iniciales = (nombre[0] || "") + (apellido[0] || "");
      if (userInitialsContainer) {
        userInitialsContainer.textContent = iniciales.toUpperCase();

        // Aplicar estilos al contenedor de iniciales para que se vea como un ícono circular
        userInitialsContainer.style.display = 'flex';
        userInitialsContainer.style.alignItems = 'center';
        userInitialsContainer.style.justifyContent = 'center';
        userInitialsContainer.style.width = '40px';
        userInitialsContainer.style.height = '40px';
        userInitialsContainer.style.backgroundColor = menuColor || '#435ebe'; // Fondo dinámico desde la API o color por defecto
        userInitialsContainer.style.color = '#fff'; // Color del texto de las iniciales
        userInitialsContainer.style.borderRadius = '50%';
        userInitialsContainer.style.fontWeight = 'bold';
        userInitialsContainer.style.fontSize = '1rem';
      }
    } else {
      console.warn('Nombre de usuario no disponible en localStorage.');
    }
  }).catch(error => {
    console.error("Error al cargar el color de fondo dinámico:", error);
  });

  // "Cambiar contraseña" del menú del usuario: abre la ventana (se arma la primera vez).
  const cambiarContrasenaBtn = document.getElementById('cambiarContrasenaBtn');
  if (cambiarContrasenaBtn) {
    cambiarContrasenaBtn.addEventListener('click', function (event) {
      event.preventDefault();
      abrirCambioContrasena();
    });
  }

  // Configurar el botón de logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(event) {
      event.preventDefault();
      cerrarSesion();
    });
  } else {
    console.warn('Botón de logout no encontrado.');
  }
}

// Cierra la sesión: borra los datos del navegador, avisa a la API y vuelve al login.
// La API de logout solo confirma la operación; la sesión se conserva en el navegador.
function cerrarSesion() {
  const token = localStorage.getItem('token');
  ['token', 'username', 'nombre', 'apellido', 'userRole'].forEach(function (key) {
    localStorage.removeItem(key);
  });
  fetch('http://localhost:50222/api/logout', {
    method: 'POST',
    keepalive: true,
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }).catch(error => {
    console.error('Error al realizar la solicitud de logout:', error);
  });
  window.location.replace('Login.html');
}

// Función para cargar el color de fondo dinámico desde la API `GestionContenido`
function loadDynamicBackgroundColor() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:50222/api/GestionContenido/1", true);

    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          console.log("Color de fondo recibido desde la API:", data.ColorBotonesMenu);
          resolve(data.ColorBotonesMenu); // Devolver el color de fondo recibido
        } catch (e) {
          console.error("Error al parsear la respuesta JSON:", e);
          reject(e);
        }
      } else {
        console.error("Error al cargar la configuración de la API. Estado HTTP:", xhr.status);
        reject(new Error("Error en la carga de la API"));
      }
    };

    xhr.onerror = function() {
      console.error("Error de red al intentar conectar con la API GestionContenido.");
      reject(new Error("Error de red"));
    };

    xhr.send();
  });
}

// ===================== Cambiar contraseña =====================
// Usa el endpoint que ya existía (api/Usuarios/CambiarContrasena): pide la contraseña actual y la nueva,
// de 8 a 20 caracteres, con letras y números y distinta de la actual. Acá se validan las mismas reglas
// antes de mandarla, con los avisos y la validación del sistema (§5 y §6.3 del design system).
let formularioContrasena = null;

function crearModalContrasena() {
  const contenedor = document.createElement('div');
  contenedor.innerHTML =
    '<div class="modal fade" id="modalCambiarContrasena" tabindex="-1" aria-labelledby="tituloCambiarContrasena" aria-hidden="true" data-bs-backdrop="static">' +
    '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
    '<form id="formCambiarContrasena" novalidate autocomplete="off">' +
    '<div class="modal-header"><h5 class="modal-title" id="tituloCambiarContrasena">Cambiar contraseña</h5>' +
    '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
    '<div class="modal-body">' +
    '<div id="avisoCambiarContrasena" class="alert alert-light-danger color-danger d-none" role="alert"></div>' +
    '<div class="mb-3"><label for="contrasenaActual" class="form-label">Contraseña actual <span class="text-danger">*</span></label>' +
    '<input id="contrasenaActual" type="password" class="form-control" maxlength="50" autocomplete="current-password"></div>' +
    '<div class="mb-3"><label for="contrasenaNueva" class="form-label">Contraseña nueva <span class="text-danger">*</span></label>' +
    '<input id="contrasenaNueva" type="password" class="form-control" maxlength="20" autocomplete="new-password">' +
    '<div class="form-text">De 8 a 20 caracteres, con letras y números.</div></div>' +
    '<div><label for="contrasenaRepetida" class="form-label">Repetí la contraseña nueva <span class="text-danger">*</span></label>' +
    '<input id="contrasenaRepetida" type="password" class="form-control" maxlength="20" autocomplete="new-password"></div>' +
    '</div>' +
    '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cancelar</button>' +
    '<button type="submit" class="btn btn-primary" id="btnGuardarContrasena">Guardar</button></div>' +
    '</form></div></div></div>';
  document.body.appendChild(contenedor.firstChild);

  const valor = id => document.getElementById(id).value;
  formularioContrasena = SGTL.validador([
    { id: 'contrasenaActual', requerido: 'Completá la contraseña actual.' },
    {
      id: 'contrasenaNueva', requerido: 'Completá la contraseña nueva.',
      validar: function (nueva) {
        if (nueva.length < 8 || nueva.length > 20) return 'Tiene que tener de 8 a 20 caracteres.';
        if (!/[a-zA-Z]/.test(nueva) || !/[0-9]/.test(nueva)) return 'Tiene que tener letras y números.';
        if (nueva === valor('contrasenaActual')) return 'Tiene que ser distinta de la actual.';
        return '';
      }
    },
    {
      id: 'contrasenaRepetida', requerido: 'Repetí la contraseña nueva.',
      validar: function (repetida) { return repetida === valor('contrasenaNueva') ? '' : 'No coincide con la contraseña nueva.'; }
    }
  ]);
  document.getElementById('formCambiarContrasena').addEventListener('submit', guardarContrasena);
}

function abrirCambioContrasena() {
  if (!window.SGTL) return;
  if (!document.getElementById('modalCambiarContrasena')) crearModalContrasena();
  SGTL.reiniciarFormulario('#formCambiarContrasena', '#avisoCambiarContrasena');
  formularioContrasena.reiniciar();
  SGTL.modal('#modalCambiarContrasena', 'show');
}

function guardarContrasena(event) {
  event.preventDefault();
  formularioContrasena.validarTodo();
  if (!SGTL.revisarFormulario('#formCambiarContrasena', '#avisoCambiarContrasena')) return;

  const porDefecto = 'No se pudo cambiar la contraseña. Probá de nuevo.';
  const listo = SGTL.procesando('#btnGuardarContrasena');
  fetch('http://localhost:50222/api/Usuarios/CambiarContrasena', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') },
    body: JSON.stringify({
      Nombre_Usuario: localStorage.getItem('username') || '',
      ContrasenaActual: document.getElementById('contrasenaActual').value,
      ContrasenaNueva: document.getElementById('contrasenaNueva').value
    })
  }).then(function (respuesta) {
    if (respuesta.ok) {
      listo();
      SGTL.modal('#modalCambiarContrasena', 'hide');
      // Cierra la sesión para que se vuelva a entrar con la contraseña nueva (así se confirma que se la sabe).
      SGTL.toastExito('Contraseña cambiada. Volvé a iniciar sesión con la nueva.');
      setTimeout(cerrarSesion, 2500);
      return;
    }
    // Los 400 y 404 traen un texto para el usuario ("La contraseña actual es incorrecta."); el resto, no (§9).
    return respuesta.json().catch(function () { return {}; }).then(function (datos) {
      listo();
      const texto = (respuesta.status === 400 || respuesta.status === 404) && (datos.message || datos.Message);
      SGTL.avisoFormulario('#avisoCambiarContrasena', texto || porDefecto);
    });
  }, function () {
    listo();
    SGTL.avisoFormulario('#avisoCambiarContrasena', 'No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.');
  });
}
