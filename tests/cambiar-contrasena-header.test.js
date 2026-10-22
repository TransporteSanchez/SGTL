const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const header = fs.readFileSync(path.join(raiz, 'views', 'header.html'), 'utf8');
const scriptHeader = fs.readFileSync(path.join(raiz, 'assets', 'static', 'js', 'header.js'), 'utf8');
const login = fs.readFileSync(path.join(raiz, 'Login.html'), 'utf8');

assert.ok(header.includes('id="cambiarContrasenaBtn"'), 'el menú debe identificar la acción de cambiar contraseña');
assert.ok(header.includes('id="cambiarContrasenaModal"'), 'el encabezado debe incluir el modal común');
assert.ok(header.includes('id="contrasenaActual"'), 'el modal debe pedir la contraseña actual');
assert.ok(header.includes('id="contrasenaNueva"'), 'el modal debe pedir la contraseña nueva');
assert.ok(header.includes('id="confirmacionContrasenaNueva"'), 'el modal debe pedir la confirmación');
assert.ok(header.includes('autocomplete="current-password"'), 'el campo actual debe permitir el gestor de contraseñas');
assert.ok(header.includes('autocomplete="new-password"'), 'los campos nuevos deben permitir el gestor de contraseñas');

assert.ok(scriptHeader.includes('function configurarCambioContrasena'), 'el encabezado debe inicializar el formulario cargado dinámicamente');
assert.ok(scriptHeader.includes('contrasenaNueva !== confirmacionContrasenaNueva'), 'el navegador debe bloquear confirmaciones distintas');
assert.ok(scriptHeader.includes('api/Usuarios/CambiarContrasena'), 'el formulario debe usar el endpoint seguro');
assert.ok(scriptHeader.includes('ContrasenaActual: contrasenaActual'), 'el cuerpo debe incluir la contraseña actual');
assert.ok(scriptHeader.includes('ContrasenaNueva: contrasenaNueva'), 'el cuerpo debe incluir la contraseña nueva');
assert.ok(!scriptHeader.includes('Nombre_Usuario:'), 'el navegador no debe enviar el usuario para cambiar la contraseña');
assert.ok(scriptHeader.includes("Authorization: 'Bearer ' + tokenActual"), 'el pedido debe incluir el bearer token');
assert.ok(scriptHeader.includes('respuesta.status === 401'), 'una sesión inválida debe tratarse explícitamente');
assert.ok(scriptHeader.includes("['token', 'username', 'nombre', 'apellido', 'userRole']"), 'un 401 debe limpiar la sesión local');

const modalPrueba = { parentNode: {} };
const cuerpoPrueba = {
  ultimoHijo: null,
  appendChild: function (elemento) {
    this.ultimoHijo = elemento;
    elemento.parentNode = this;
  }
};
const contenedorPrueba = {
  querySelector: function (selector) {
    return selector === '#cambiarContrasenaModal' ? modalPrueba : null;
  }
};
const contexto = { document: { body: cuerpoPrueba }, console: console };
vm.createContext(contexto);
vm.runInContext(scriptHeader, contexto);
vm.runInContext('moverModalCambioContrasenaAlBody(contenedorPrueba);', Object.assign(contexto, { contenedorPrueba: contenedorPrueba }));
assert.strictEqual(cuerpoPrueba.ultimoHijo, modalPrueba, 'el modal debe moverse fuera de la barra superior para quedar encima del fondo oscuro');

assert.ok(!login.includes("getElementById('password').value.trim()"), 'el login no debe modificar lo escrito en la contraseña');
assert.ok(!login.includes('Enviando solicitud a la API de login con:'), 'el login no debe imprimir el cuerpo con la contraseña');
assert.ok(!login.includes('errorData.Nombre_Usuario'), 'el login no debe esperar errores que revelen el usuario');
assert.ok(!login.includes('errorData.Contraseña'), 'el login no debe esperar errores que revelen la contraseña');

console.log('OK: el encabezado ofrece un cambio de contraseña seguro y el login no expone credenciales.');
