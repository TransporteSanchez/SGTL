# Seguridad de contraseñas

## Objetivo

Habilitar el cambio de contraseña desde el encabezado de todas las pantallas y
eliminar el almacenamiento y la comparación de contraseñas en texto plano.
Desde el 27/10/2026 también incluye el recupero desde el login mediante el
e-mail individual registrado por quien administra los usuarios.

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

El recupero por e-mail es una alternativa al ingreso con contraseña, no un
segundo factor. La gestión de usuarios controla el permiso al registrar o
modificar el correo, porque ese dato permite recuperar la cuenta.

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

## Recupero desde el login (27/10/2026)

`Login.html` muestra «Olvidé mi contraseña». El formulario pide el e-mail
registrado y `POST api/recupero-contrasena/solicitar` responde el mismo mensaje
para cuentas existentes, inexistentes, inactivas y solicitudes limitadas.
El trabajo SMTP se encola en ASP.NET; su duración no revela si existe la cuenta.
Una cola llena o un reinicio puede impedir una entrega: el usuario puede
volver a solicitarla. No se cambia ni bloquea la contraseña al solicitar.

El enlace lleva 32 bytes aleatorios en el fragmento `#recupero=…`, que no se
envía al servidor web. El login lo retira de la barra y del historial al cargar
y lo conserva solo en memoria. El servidor guarda su SHA-256, el usuario,
el e-mail, la versión de sesión y una huella de la contraseña vigente.
Vence en 20 minutos, calculados exclusivamente con UTC de SQL Server.
El consumo exige entrega marcada, cuenta activa, correo, versión y contraseña
sin cambios. Usa una transacción serializable y bloquea primero el usuario:
dos pedidos simultáneos no pueden consumir el mismo enlace. Completarlo
invalida todos los enlaces del usuario y aumenta su versión de sesión.
Un fallo SMTP deja el enlace inutilizable.

`POST api/recupero-contrasena/restablecer` recibe el enlace y la nueva contraseña
repetida. Conserva espacios, aplica `ContrasenasSeguras`, guarda PBKDF2 y registra
el recupero en auditoría sin contraseña ni enlace. El aviso posterior se envía
sin incluir la contraseña; si ese aviso falla, el cambio guardado se conserva.
No inicia sesión automáticamente. Las contraseñas y tokens no se incluyen en
trazas ni respuestas de solicitud.

La solicitud admite hasta tres enlaces por usuario por hora y una separación
de dos minutos entre solicitudes. La API también limita las peticiones por IP
y en total, con memoria acotada por proceso y hasta 32 trabajos pendientes.
El límite por cuenta queda persistido, incluso si falla el correo.

Los JWT nuevos incluyen `sgtl_version` y el identificador del usuario, para no
reutilizar sesiones si se elimina y vuelve a registrar un nombre. Los anteriores se consideran versión
cero. El manejador global rechaza el Bearer cuando la versión ya cambió o la
cuenta está inactiva. `GET api/sesion` permite que las páginas abiertas lo
comprueben al cargar, recuperar el foco y cada minuto; un 401 limpia la sesión
local y vuelve al login. Un problema de conexión no cierra una sesión y una
respuesta tardía no borra un login posterior. Esto no reemplaza el trabajo
pendiente de autorización general de los endpoints históricos (§40).

`USUARIOS.Email` admite nulo para conservar las cuentas anteriores; al registrar
o editar se exige un correo válido y único, normalizado a minúsculas. Se lee y
escribe con SQL parametrizado, sin regenerar el EDMX. Cambiar el correo, la
contraseña desde gestión, el rol o el estado invalida las sesiones anteriores.
Listar usuarios muestra el correo en el detalle. Las escrituras y la lectura
del detalle verifican el permiso vigente en la API, sin confiar en el rol o
el nombre enviados por el navegador. El administrador debe verificar que la
casilla pertenece a esa persona antes de asignarla; no se usan casillas compartidas.

Gestionar e-mail agrega «Perfil para recupero de contraseña». Hay que registrar
un perfil SMTP con conexión segura y asignarlo exclusivamente a
`RECUPERO_CONTRASENA`; se impide compartirlo en ambos sentidos, en la API y con
un disparador SQL. No se copian credenciales ni se elige un perfil automáticamente.
El asunto y cuerpo del recupero se generan para este circuito; la plantilla
general editable del perfil no reemplaza el enlace. La dirección del login se
configura explícitamente por un administrador, con HTTPS, sin consultas,
fragmentos ni credenciales. Para desarrollo se admite HTTP solo en localhost,
127.0.0.1 o ::1. Nunca se arma con el encabezado Host de la solicitud anónima.

**Antes de desplegar:** aplicar `database/seguridad/02_recupero_contrasena.sql`
después de seguridad 01, y `database/email/07_perfil_recupero_contrasena.sql`
después de e-mail 06. Configurar el perfil y la dirección real del login;
registrar los correos de usuarios. Los scripts se entregan sin ejecutar contra
la base compartida. El cambio requiere recompilar y desplegar la API junto
con los archivos estáticos. La prueba de entrega real y la revisión visual
en la VM siguen pendientes.
