const assert = require('assert');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const autenticacion = fs.readFileSync(
    path.join(raiz, 'WebApi_TransporteSanchez', 'Controllers', 'AutenticacionController.cs'),
    'utf8'
);
const usuarios = fs.readFileSync(
    path.join(raiz, 'WebApi_TransporteSanchez', 'Controllers', 'UsuariosController.cs'),
    'utf8'
);
const proyecto = fs.readFileSync(
    path.join(raiz, 'WebApi_TransporteSanchez', 'WebApi_TransporteSanchez.csproj'),
    'utf8'
);

function bloqueEntre(texto, inicio, fin) {
    const desde = texto.indexOf(inicio);
    const hasta = texto.indexOf(fin, desde);
    assert.notStrictEqual(desde, -1, 'debe existir el inicio del bloque ' + inicio);
    assert.notStrictEqual(hasta, -1, 'debe existir el fin del bloque ' + fin);
    return texto.slice(desde, hasta);
}

assert.ok(
    autenticacion.includes('using WebApi_TransporteSanchez.Security;'),
    'el inicio de sesión debe usar la utilidad de contraseñas seguras'
);
assert.ok(
    autenticacion.includes('ContrasenasSeguras.Verificar'),
    'el inicio de sesión debe verificar con PBKDF2 o con la migración heredada'
);
assert.ok(
    !autenticacion.includes('IsPasswordValid'),
    'el inicio de sesión no debe comprobar una contraseña contra otros usuarios'
);
assert.ok(
    !autenticacion.includes('user.Contraseña == userLogin.Contraseña'),
    'el inicio de sesión no debe comparar contraseñas en texto plano'
);
assert.ok(
    autenticacion.includes('General = "Usuario o contraseña incorrectos."'),
    'las credenciales inválidas deben informar un único mensaje genérico'
);

const dtoCambio = bloqueEntre(usuarios, 'public class CambiarContrasenaDto', '[HttpPost]');
assert.ok(!dtoCambio.includes('Nombre_Usuario'), 'el DTO de cambio no debe aceptar el usuario desde el navegador');
assert.ok(dtoCambio.includes('ContrasenaActual'), 'el DTO debe conservar la contraseña actual');
assert.ok(dtoCambio.includes('ContrasenaNueva'), 'el DTO debe conservar la nueva contraseña');

const inicioEndpointCambio = usuarios.indexOf('public IHttpActionResult CambiarContrasena');
assert.notStrictEqual(inicioEndpointCambio, -1, 'debe existir el endpoint de cambio de contraseña');
const endpointCambio = usuarios.slice(inicioEndpointCambio);
assert.ok(
    endpointCambio.includes('ObtenerNombreUsuarioToken'),
    'el cambio de contraseña debe obtener el usuario desde el token'
);
assert.ok(
    endpointCambio.includes('ContrasenasSeguras.Verificar'),
    'el cambio debe verificar la contraseña actual de forma segura'
);
assert.ok(
    endpointCambio.includes('ContrasenasSeguras.CrearHash'),
    'el cambio debe guardar un hash de la nueva contraseña'
);
assert.ok(
    !endpointCambio.includes('u.Contraseña == value.ContrasenaActual'),
    'el cambio no debe consultar contraseñas en texto plano'
);

assert.ok(
    usuarios.includes('Contraseña = ContrasenasSeguras.CrearHash(value.Contraseña)'),
    'el alta de usuario debe guardar hashes'
);
assert.ok(
    usuarios.includes('usuario.Contraseña = ContrasenasSeguras.CrearHash(value.Contraseña)'),
    'la edición con contraseña debe guardar hashes'
);
assert.ok(
    !usuarios.includes('usuario.Contraseña = value.Contraseña'),
    'la edición no debe reintroducir contraseñas en texto plano'
);

assert.ok(
    !fs.existsSync(path.join(raiz, 'WebApi_TransporteSanchez', 'Controllers', 'LoginController.cs')),
    'la ruta histórica de inicio de sesión debe retirarse'
);
assert.ok(
    !proyecto.includes('Controllers\\LoginController.cs'),
    'el proyecto no debe compilar el controlador histórico'
);

console.log('OK: la autenticación y el cambio de contraseña usan el contrato seguro.');
