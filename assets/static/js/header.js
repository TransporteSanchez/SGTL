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

  // Configurar el botón de logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(event) {
      event.preventDefault();

      // La API de logout solo confirma la operación; la sesión se conserva en el navegador.
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
    });
  } else {
    console.warn('Botón de logout no encontrado.');
  }
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
