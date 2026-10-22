# Seguridad de contraseñas

## Objetivo

Habilitar el cambio de contraseña desde el encabezado de todas las pantallas y
eliminar el almacenamiento y la comparación de contraseñas en texto plano,
sin incorporar WhatsApp, correo, códigos de un solo uso ni recuperación de
cuenta.

## Alcance

- El usuario autenticado puede cambiar su propia contraseña desde el menú de
  usuario.
- La autenticación y todas las escrituras de contraseñas pasan a usar hashes
  seguros.
- Las contraseñas heredadas se migran al iniciar sesión correctamente, sin
  obligar a un restablecimiento masivo.
- El endpoint de cambio toma la identidad exclusivamente del token JWT válido.

No se modifica el esquema general de permisos ni se agregan factores de
autenticación externos.

## Situación actual

El enlace del encabezado no tiene evento ni modal. La API de inicio de sesión
y la de cambio comparan el campo `USUARIOS.Contraseña` en texto plano. Además,
el cambio actual recibe el nombre de usuario desde el cuerpo del pedido y el
inicio de sesión diferencia errores de usuario y contraseña.

Existe una ruta histórica `POST api/login/login` que también compara texto
plano y no es usada por la interfaz actual. Debe retirarse para no conservar
un acceso inseguro en paralelo.

## Diseño elegido

### Protección de contraseñas

Se incorpora `ContrasenasSeguras`, una utilidad sin acceso a base de datos
que provee:

- `CrearHash(string contrasena)`: genera una sal aleatoria de 16 bytes y un
  hash PBKDF2-HMAC-SHA256 de 32 bytes con 600.000 iteraciones.
- `Verificar(string contrasena, string valorGuardado)`: valida hashes actuales
  en tiempo constante. Para permitir la transición, compara valores heredados
  en texto plano también en tiempo constante.
- `EsHashVigente(string valorGuardado)`: identifica el formato
  `PBKDF2-SHA256$iteraciones$sal$hash`.
- `CumplePolitica(string contrasena, out string mensaje)`: centraliza la regla
  vigente: entre 8 y 20 caracteres, al menos una letra y un número.

No se registran ni devuelven la contraseña, la sal ni el hash en respuestas,
auditoría, trazas ni consola del navegador.

### Datos y transición

Antes de desplegar el código se debe ejecutar manualmente un script nuevo que
amplía `dbo.USUARIOS.Contraseña` a `NVARCHAR(255)`. No se ejecuta SQL desde la
aplicación ni desde el asistente.

El metadato de `WebApi_TransporteSanchez/SGTL.edmx` se ajusta manualmente de
50 a 255 caracteres en sus definiciones de almacenamiento y de modelo. No se
regenera el EDMX.

Cuando un usuario con valor heredado inicia sesión con la contraseña correcta,
la API reemplaza ese valor por el hash PBKDF2 en la misma operación. Si la
contraseña es incorrecta, no se modifica nada. Las altas, las ediciones que
incluyan contraseña y los cambios de contraseña almacenan directamente el
hash.

### Inicio de sesión

`POST api/login` busca al usuario por nombre, verifica la contraseña con
`ContrasenasSeguras` y responde un único `401` con el mensaje genérico
“Usuario o contraseña incorrectos.” para cualquier credencial inválida. Ya no
consulta si una contraseña coincide con otro usuario ni revela cuál campo
falló.

La ruta histórica `POST api/login/login` se elimina junto con su controlador,
porque la interfaz no la usa y permitiría mantener validaciones en texto
plano.

### Cambio de contraseña

`POST api/Usuarios/CambiarContrasena` recibe únicamente:

```json
{
  "ContrasenaActual": "…",
  "ContrasenaNueva": "…"
}
```

Requiere `Authorization: Bearer <token>`. El servidor valida firma, emisor,
audiencia y vencimiento del JWT existente y obtiene el usuario del claim
`NameIdentifier`; el nombre de usuario jamás se toma del navegador. Si el
token no es válido o venció, responde `401`. Si la contraseña actual no
coincide, responde un mensaje genérico y no modifica datos. Si el cambio es
correcto, actualiza el hash y registra una auditoría `CAMBIO_CONTRASENA` sin
valores sensibles.

### Interfaz

`views/header.html` incluye un único modal accesible con los campos
“Contraseña actual”, “Nueva contraseña” y “Repetí la nueva contraseña”.
`assets/static/js/header.js` lo inicializa inmediatamente después de cargar
el encabezado, valida la confirmación y la política antes de enviar el pedido,
y manda el token existente en el encabezado `Authorization`.

Al completar el cambio, se limpia el formulario, se cierra el modal y se
informa el resultado. Ante un `401`, se eliminan los datos locales de sesión y
se vuelve al inicio de sesión. La sesión vigente se conserva después de un
cambio exitoso.

`Login.html` adapta su mensaje para mostrar el error genérico que devuelve la
API y deja de escribir la solicitud de inicio de sesión en la consola, porque
incluye una contraseña. El navegador conserva exactamente lo escrito en los
campos de contraseña: no aplica `trim()` ni otra transformación.

## Verificación y despliegue

- Pruebas automatizadas para hashes, verificación correcta e incorrecta,
  política, migración progresiva y contrato del encabezado.
- Compilación de la solución y ejecución de la suite de pruebas JavaScript.
- Prueba manual: cambiar contraseña desde dos pantallas distintas; comprobar
  que la clave anterior deja de funcionar y la nueva permite iniciar sesión.
- Ejecutar el script de esquema primero en un ambiente controlado y conservar
  respaldo aprobado de la base antes de producción.
