function loadHeader() {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "views/header.html");
    xhr.onload = function () {
      if (xhr.status === 200) {
        var contenedor = document.getElementById("header-container");
        contenedor.innerHTML = xhr.responseText;
        moverModalCambioContrasenaAlBody(contenedor);
        setupUserInfo();
        resolve();
      } else {
        console.error('Error al cargar el encabezado:', xhr.statusText);
        reject(new Error('Error al cargar el encabezado'));
      }
    };
    xhr.onerror = function () {
      console.error('Error de red al cargar el encabezado.');
      reject(new Error('Error de red'));
    };
    xhr.send();
  });
}

function moverModalCambioContrasenaAlBody(contenedor) {
  if (!contenedor || !document.body) return;

  var modal = contenedor.querySelector('#cambiarContrasenaModal');
  if (modal && modal.parentNode !== document.body) {
    document.body.appendChild(modal);
  }
}

function limpiarSesionLocal() {
  ['token', 'username', 'nombre', 'apellido', 'userRole'].forEach(function (key) {
    localStorage.removeItem(key);
  });
}

function mostrarMensajeCambioContrasena(mensaje, tipo) {
  var contenedor = document.getElementById('mensajeCambioContrasena');
  if (!contenedor) return;

  contenedor.textContent = mensaje;
  contenedor.className = 'alert alert-' + tipo;
}

function cerrarModalCambioContrasena() {
  var modal = document.getElementById('cambiarContrasenaModal');
  if (modal && window.bootstrap && window.bootstrap.Modal) {
    window.bootstrap.Modal.getOrCreateInstance(modal).hide();
  }
}

function configurarCambioContrasena() {
  var formulario = document.getElementById('cambiarContrasenaForm');
  if (!formulario || formulario.dataset.configurado === 'true') return;

  formulario.dataset.configurado = 'true';
  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();

    var contrasenaActual = document.getElementById('contrasenaActual').value;
    var contrasenaNueva = document.getElementById('contrasenaNueva').value;
    var confirmacionContrasenaNueva = document.getElementById('confirmacionContrasenaNueva').value;
    var botonGuardar = document.getElementById('guardarContrasenaBtn');

    if (!contrasenaActual || !contrasenaNueva || !confirmacionContrasenaNueva) {
      mostrarMensajeCambioContrasena('Completá todos los campos.', 'danger');
      return;
    }

    if (contrasenaNueva !== confirmacionContrasenaNueva) {
      mostrarMensajeCambioContrasena('La confirmación no coincide con la nueva contraseña.', 'danger');
      return;
    }

    if (contrasenaNueva.length < 8 || contrasenaNueva.length > 20 ||
      !/[a-zA-Z]/.test(contrasenaNueva) || !/[0-9]/.test(contrasenaNueva)) {
      mostrarMensajeCambioContrasena('La nueva contraseña debe tener entre 8 y 20 caracteres e incluir al menos una letra y un número.', 'danger');
      return;
    }

    if (contrasenaActual === contrasenaNueva) {
      mostrarMensajeCambioContrasena('La nueva contraseña debe ser diferente de la actual.', 'danger');
      return;
    }

    var tokenActual = localStorage.getItem('token');
    if (!tokenActual) {
      limpiarSesionLocal();
      window.location.replace('Login.html');
      return;
    }

    botonGuardar.disabled = true;
    fetch('http://localhost:50222/api/Usuarios/CambiarContrasena', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + tokenActual
      },
      body: JSON.stringify({
        ContrasenaActual: contrasenaActual,
        ContrasenaNueva: contrasenaNueva
      })
    }).then(function (respuesta) {
      if (respuesta.status === 401) {
        limpiarSesionLocal();
        window.location.replace('Login.html');
        return null;
      }

      return respuesta.json().catch(function () { return {}; }).then(function (datos) {
        if (!respuesta.ok) {
          throw new Error(datos.message || 'No se pudo cambiar la contraseña.');
        }
        return datos;
      });
    }).then(function (datos) {
      if (!datos) return;

      formulario.reset();
      mostrarMensajeCambioContrasena(datos.message || 'Contraseña cambiada correctamente.', 'success');
      window.setTimeout(cerrarModalCambioContrasena, 900);
    }).catch(function (error) {
      mostrarMensajeCambioContrasena(error.message || 'No se pudo cambiar la contraseña.', 'danger');
    }).then(function () {
      botonGuardar.disabled = false;
    });
  });
}

function setupUserInfo() {
  var token = localStorage.getItem('token');
  var loadingRedirect = document.getElementById('loading-redirect');

  if (!token) {
    if (loadingRedirect) loadingRedirect.style.display = 'flex';
    window.location.replace('Login.html');
    return;
  }

  configurarCambioContrasena();

  loadDynamicBackgroundColor().then(function (menuColor) {
    var nombre = localStorage.getItem('nombre');
    var apellido = localStorage.getItem('apellido');
    var usernameDisplay = document.getElementById('usernameDisplay');
    var userInitialsContainer = document.getElementById('userInitials');

    if (usernameDisplay && nombre && apellido) {
      usernameDisplay.textContent = nombre + ' ' + apellido;
      var iniciales = (nombre[0] || '') + (apellido[0] || '');
      if (userInitialsContainer) {
        userInitialsContainer.textContent = iniciales.toUpperCase();
        userInitialsContainer.style.display = 'flex';
        userInitialsContainer.style.alignItems = 'center';
        userInitialsContainer.style.justifyContent = 'center';
        userInitialsContainer.style.width = '40px';
        userInitialsContainer.style.height = '40px';
        userInitialsContainer.style.backgroundColor = menuColor || '#435ebe';
        userInitialsContainer.style.color = '#fff';
        userInitialsContainer.style.borderRadius = '50%';
        userInitialsContainer.style.fontWeight = 'bold';
        userInitialsContainer.style.fontSize = '1rem';
      }
    }
  }).catch(function (error) {
    console.error('Error al cargar la configuración del encabezado:', error);
  });

  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (event) {
      event.preventDefault();
      limpiarSesionLocal();
      fetch('http://localhost:50222/api/logout', {
        method: 'POST',
        keepalive: true,
        headers: {
          Authorization: 'Bearer ' + token
        }
      }).catch(function (error) {
        console.error('Error al realizar la solicitud de cierre de sesión:', error);
      });
      window.location.replace('Login.html');
    });
  }
}

function loadDynamicBackgroundColor() {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost:50222/api/GestionContenido/1', true);

    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          resolve(data.ColorBotonesMenu);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Error en la carga de la API'));
      }
    };

    xhr.onerror = function () {
      reject(new Error('Error de red'));
    };

    xhr.send();
  });
}
