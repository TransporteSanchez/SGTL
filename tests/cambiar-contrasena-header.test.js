const assert = require('assert');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const header = fs.readFileSync(path.join(raiz, 'views', 'header.html'), 'utf8');
const scriptHeader = fs.readFileSync(path.join(raiz, 'assets', 'static', 'js', 'header.js'), 'utf8');
const login = fs.readFileSync(path.join(raiz, 'Login.html'), 'utf8');

assert.ok(header.includes('id="cambiarContrasenaBtn"'), 'el menú debe identificar la acción de cambiar contraseña');

// La ventana se arma desde header.js la primera vez que se abre y va directo al body (queda encima del fondo oscuro).
assert.ok(scriptHeader.includes('function crearModalContrasena'), 'el encabezado debe armar la ventana de cambiar contraseña');
assert.ok(scriptHeader.includes('document.body.appendChild'), 'la ventana debe ir en el body, fuera de la barra superior');
assert.ok(scriptHeader.includes('id="contrasenaActual"'), 'la ventana debe pedir la contraseña actual');
assert.ok(scriptHeader.includes('id="contrasenaNueva"'), 'la ventana debe pedir la contraseña nueva');
assert.ok(scriptHeader.includes('id="contrasenaRepetida"'), 'la ventana debe pedir que se repita la nueva');
assert.ok(scriptHeader.includes('autocomplete="current-password"'), 'el campo actual debe permitir el gestor de contraseñas');
assert.ok(scriptHeader.includes('autocomplete="new-password"'), 'los campos nuevos deben permitir el gestor de contraseñas');
assert.ok(scriptHeader.includes("repetida === valor('contrasenaNueva')"), 'el navegador debe bloquear confirmaciones distintas');
assert.ok(scriptHeader.includes('api/Usuarios/CambiarContrasena'), 'el formulario debe usar el endpoint seguro');
assert.ok(scriptHeader.includes('ContrasenaActual:'), 'el cuerpo debe incluir la contraseña actual');
assert.ok(scriptHeader.includes('ContrasenaNueva:'), 'el cuerpo debe incluir la contraseña nueva');
assert.ok(!scriptHeader.includes('Nombre_Usuario:'), 'el navegador no debe enviar el usuario para cambiar la contraseña');
assert.ok(scriptHeader.includes("'Authorization': 'Bearer '"), 'el pedido debe incluir el bearer token');
assert.ok(scriptHeader.includes('respuesta.status === 401'), 'una sesión inválida debe tratarse explícitamente');
assert.ok(scriptHeader.includes("['token', 'username', 'nombre', 'apellido', 'userRole']"), 'cerrar la sesión debe limpiar la sesión local');

assert.ok(!login.includes("getElementById('password').value.trim()"), 'el login no debe modificar lo escrito en la contraseña');
assert.ok(!login.includes('Enviando solicitud a la API de login con:'), 'el login no debe imprimir el cuerpo con la contraseña');
assert.ok(!login.includes('errorData.Nombre_Usuario'), 'el login no debe esperar errores que revelen el usuario');
assert.ok(!login.includes('errorData.Contraseña'), 'el login no debe esperar errores que revelen la contraseña');

console.log('OK: el encabezado ofrece un cambio de contraseña seguro y el login no expone credenciales.');
