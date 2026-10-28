# Reporte de pruebas — Ronda 1 (A, B y C) — 28/10/2026

> Reporte de la sesión de la VM, con `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md`. Seguimiento en la §59 de
> `docs/PENDIENTES-SISTEMA.md`.

## Entorno
- Rama / commit: rocionuvoli @ 3c37749 "Pruebas: los enlaces del recupero, a la casilla de Integra Analistas" (`git status` limpio; el `pull` lo pidió Rocío y no trajo nada nuevo).
- API: http://localhost:50222/api — OK. IIS Express levantado desde las 16:49; la DLL se compiló a las 16:49:05, después del último commit (16:41).
- Front: Five Server, puerto 5502 (`localhost:5502` y `127.0.0.1:5502`; solo escucha en 127.0.0.1).
- Navegador integrado de Claude, con dos sesiones: `localhost:5502` (admin RNUVOLI) y `127.0.0.1:5502` (mferreyra y después dquiroga). Los login los hizo Rocío.
- Alcance pedido: ronda 1 del `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md`: parte A (compilación y pruebas automáticas), parte B (login, sesión y recupero de contraseña) y parte C (usuarios, grupos, permisos y el usuario del chofer).
- Correo del recupero: casilla de Integra Analistas, la revisa Rocío.

## Resumen
Se hicieron 52 controles: 38 OK, 7 FALLA y 7 NO PROBADO (los puntos 12, 50 y 51 tienen además una parte NO PROBADA). La compilación da 0 errores y las 80 pruebas de Node y la de PowerShell dan OK.

Lo más grave:
- **F1.** Una sesión invalidada (cambio de e-mail, contraseña o usuario inactivo) **no vuelve al login** en el otro navegador. El 401 de la API llega sin los encabezados CORS y el front lo toma como un corte de conexión.
- **F2.** El **recupero no envía el correo desde la VM**: la VM no puede leer la contraseña SMTP del perfil 3, que se guardó desde otra máquina. Por eso todo lo que necesita el enlace quedó NO PROBADO.
- **F3.** La lista, la búsqueda y el detalle de usuarios responden **sin token**.

Usuarios, grupos, roles, permisos de `GET`/`PUT` y el alta del chofer con su usuario funcionan bien.

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | A1 | Recompilar la API | OK | MSBuild Rebuild (Debug) con salida en `C:\pruebas-sgtl\build`, sin tocar el bin de la API: **0 errores**, 1865 advertencias, todas CS1591 (falta el comentario XML), ninguna de otro tipo. De esas, 500 son de los archivos de esta tanda (ver "Advertencias" abajo). |
| 2 | A2 | `node tests\*.test.js` (80) | OK | 80/80 imprimen `OK`, incluidas las 11 de Facu que usan PowerShell. La VM no tiene Node en el PATH: se usó el de Visual Studio (v24.17.0). Tardan 263 s en total. |
| 3 | A3 | `tests\contrasenas-seguras.test.ps1` | OK | Sale con código 0 ("OK: hashes seguros, migración heredada y política verificados", con los acentos rotos en la consola de PowerShell 5.1). |
| 4 | §57 | Perfil de recupero asignado y dirección del login | OK | Perfil 3 "Recupero contraseña" (smtp.gmail.com:587, SSL y TLS 1.2); dirección `http://127.0.0.1:5502/Login.html`. Última modificación: FGODOY, 28/10 00:04. |
| 5 | §57 | Asignar Facturación a recupero y viceversa (pantalla) | OK | En recupero, los servicios 1 y 2 están deshabilitados ("Asignado a otro módulo"); en Facturación y Presupuestos, el 3. |
| 6 | §57 | Asignar perfiles cruzados desde la API | NO PROBADO | El control de permisos de la sesión no me dejó intentar ese `PUT` sobre la configuración compartida. En el código, el rechazo ocurre antes de escribir (`EmailServidorController.cs:228-233`). Lo puede hacer Rocío. |
| 7 | §57 / B4 | Solicitar el recupero → llega el enlace | FALLA | F2: no llega ningún correo. |
| 8 | B2 [cruce] | Error del login con contraseña mal | OK | "Usuario o contraseña incorrectos." en rojo arriba, con ícono, `role="alert"`. Se anima una vez (375 ms, `sgtl-aviso-entrada`) y sigue a la vista 14 s después. Se va al escribir en el usuario y vuelve, con la animación, en el siguiente intento fallido. |
| 9 | B2 | Login con los campos vacíos | OK | "Revisá los campos marcados." arriba; "Completá el usuario." y "Completá la contraseña." debajo; el foco va al usuario. Ver DS1. |
| 10 | B3 | Ojo de la contraseña | OK | Probado disparando los eventos en la página: muestra solo con el botón presionado (mouse, Enter, espacio); oculta al soltar, al salir del botón, al perder el foco y al cambiar de ventana; el botón derecho no la muestra. Ver DS3. |
| 11 | B4 | E-mail inexistente y existente con la misma respuesta | OK | En los dos casos: "Si el e-mail corresponde a una cuenta habilitada, vas a recibir las instrucciones para recuperar tu contraseña." |
| 12 | B4 | Doble clic en "Enviar enlace" | OK | Sale un solo `POST /api/recupero-contrasena/solicitar`. Que llegue un solo correo queda NO PROBADO (F2). |
| 13 | B4 | El enlace sirve una vez y vence a los 20 minutos | NO PROBADO | F2. |
| 14 | B4 | Mientras no se usa el enlace, la contraseña de antes sigue entrando | NO PROBADO | F2 (no hubo enlace). |
| 15 | B4 | Contraseña nueva que no cumple la regla o no coincide | OK | Probado con un enlace inventado del largo correcto. Corta: "Usá entre 8 y 20 caracteres, con al menos una letra y un número."; distinta: "Las contraseñas no coinciden.", debajo de cada campo. Con las dos válidas, un solo `POST` aunque haya doble clic, y "El enlace no es válido o venció. Solicitá un nuevo recupero de contraseña." (ver DS2). |
| 16 | B4 | Enlace inválido o recortado (`#recupero=abc`) | OK | Abre "Restablecer contraseña" con "El enlace no es válido o venció…". El fragmento se borra de la dirección al abrir. Ver DS2 y M1. |
| 17 | B4 | Texto del correo recibido | NO PROBADO | F2. En el código (`CorreoRecupero.cs`): asunto "Recuperar contraseña", voseo, sin contraseña, "El enlace vence en 20 minutos y se puede usar una sola vez." |
| 18 | B5 [cruce] | Sesión en dos navegadores: invalidarla en uno → el otro vuelve al login en menos de un minuto | FALLA | F1. Probado cambiándole el e-mail a mferreyra desde el admin (17:43:07): a las 17:44:48 seguía en Listar usuarios. |
| 19 | B5 | Después de entrar, vuelve a la pantalla donde estaba (`?volver=`) | OK | Con el vencimiento natural de la sesión del admin: `Login.html?volver=gestion-usuarios.html`; después del login volvió a Gestionar usuarios. Ver DS4: no avisa que la sesión venció. |
| 20 | B6 [cruce] | Chofer desde el celular (390 px) entra directo a Hojas de ruta | OK | dquiroga: va a `hoja-de-ruta.html`, el menú tiene solo "Hojas de ruta" y arranca plegado, sin desborde. "No tenés viajes para hoy ni para los próximos días." |
| 21 | B6 | Inactivar su chofer y tocar "Hoy y próximos" | OK | "Tu chofer quedó inactivo, así que se cerró tu sesión. Es necesario que hables con administración." y después el login. Ver F7. |
| 22 | B6 | Volver a entrar con el chofer inactivo | OK | "No se puede iniciar sesión: el chofer de este usuario está inactivo. Hablá con administración." Después se activó de nuevo ("Chofer activado."). |
| 23 | B6 | Inactivar el usuario del chofer → vuelve al login en menos de un minuto | FALLA | F1. Inactivado a las 17:49:09; a las 17:50:33 seguía en Hojas de ruta. Al tocar "Hoy y próximos": "No se pudo cargar tu hoja de ruta. Revisá la conexión y probá de nuevo." Después se activó ("Usuario activado."). |
| 24 | B6 | El chofer usa "Olvidé mi contraseña" | NO PROBADO | F2. |
| 25 | B7 | Auditoría: inicio de sesión y cambios de e-mail, sin contraseñas ni enlaces | OK | Inicio de sesión de RNUVOLI, mferreyra y dquiroga; e-mail de mferreyra (anterior → nuevo); dquiroga "ChoferID: ninguno -> 12, Email: ninguno -> … (usuario creado al registrar el chofer)". Contraseña como `***`, sin enlaces. |
| 26 | B7 | Auditoría: "Recupero de contraseña" con la etiqueta azul | NO PROBADO | F2 (no se completó ningún recupero). |
| 27 | B7 | Auditoría de grupos | FALLA | F5: el alta del grupo no se registra y los cambios de permisos y miembros figuran como "sistema". |
| 28 | B8 | Login y los dos formularios a 1920, 1366, 768 y 390 px | OK | Sin desborde horizontal. A 768 px se oculta el panel izquierdo y la tarjeta queda centrada; a 390 px los modales van a pantalla completa. Desvíos en DS1, DS2 y DS3. Medido con el DOM: a 1366 y 1920 el panel del navegador achica la captura. |
| 29 | C1 / §57 | Registrar usuario: e-mail obligatorio, inválido, repetido y bien | OK | Inválido: "Escribí un e-mail válido." al salir del campo. Repetido en mayúsculas (`INTEGRAANALISTAS+MFERREYRA@GMAIL.COM`): "Ese e-mail ya está registrado en otro usuario." debajo del campo y no se crea. Bien: usuario 18 creado con un solo `POST`. Ver DS5 y DS6. |
| 30 | C1 | Editar un usuario viejo sin e-mail (nviola, ID 13) | OK | No deja guardar ("Completá el e-mail.", sin llamar a la API). La ayuda dice por qué: "Usá un e-mail individual al que pueda acceder el usuario. Se utiliza para recuperar su contraseña." Se canceló sin guardar (ningún `PUT`). |
| 31 | C1 | Cambiar el e-mail de un usuario con sesión abierta en otro navegador | FALLA | F1 (es la misma prueba que el punto 18). |
| 32 | C2 [cruce] | Roles Administrador, Usuario y Chofer | OK | Usuario pide "Grupos *" (Disponibles/Asignados); Chofer pide "Chofer *" y no pide grupos; Administrador, ninguno de los dos. Ver DS5. |
| 33 | C2 | Editar el usuario del chofer (rjuarez) y cancelar | OK | Rol Chofer, "Juarez, Raúl (DNI 23433900)", sin grupos, "En Hojas de ruta ve solo los viajes de este chofer.". Sin e-mail. Se canceló. |
| 34 | C3 / §57 | Usuario que solo lista (mferreyra con "Listar usuarios") | OK | Ve Usuarios → Listar usuarios y el detalle de otro usuario. Escribir `gestion-usuarios.html` a mano lo manda al Dashboard. `GET api/Usuarios/13` → 200; `PUT api/Usuarios/18` (sus mismos datos) → 403 "No tenés permiso para acceder a los usuarios." |
| 35 | C3 / §57 | Usuario sin permisos de usuarios (mferreyra con solo "Dashboard") | OK | Menú: solo Dashboard y Documentación; Listar usuarios a mano → Dashboard. `GET api/Usuarios/13` y `/18`, `PUT /18` y `PUT EstadoUsuario/18` → 403 "No tenés permiso para acceder a los usuarios." |
| 36 | C3 | Lista, búsqueda y detalle sin permiso o sin token | FALLA | F3. |
| 37 | C3 | El mensaje que se ve, ¿se entiende? | OK | "No tenés permiso para acceder a los usuarios.": castellano y claro. Para un `PUT` sería más preciso "modificar" (mejora M11). |
| 38 | C4 | Usuarios por grupo: dos listas, búsqueda, "Todos", Deshacer y Guardar | OK | Con la búsqueda "pai", "Agregar todos" mueve solo esos dos; dice "2 cambios sin guardar." y habilita Guardar; "Deshacer cambios" vuelve todo. No se guardó. |
| 39 | C4 | Usuario con un solo grupo | OK | Quitar deshabilitado con "No se puede quitar el usuario: es su único grupo". La API también lo rechaza: "No se puede quitar a mferreyra del grupo: es su único grupo." |
| 40 | C4 | Agregar un administrador | OK | No aparece entre los disponibles. `POST Usuarios/Cambios` con el ID 2 → 400 "No se puede agregar un administrador al grupo: ya tiene acceso por su rol." |
| 41 | C4 [cruce] | Usuario con rol Chofer | OK | dquiroga y rjuarez no aparecen entre los disponibles ni entran con "Agregar todos". `POST api/Grupos/9/Usuarios/Cambios` con `AgregarIds: [19]` → 400 "No se puede agregar un chofer al grupo: con su rol ve solo Hojas de ruta." y no se guarda nada (el grupo 9 sigue solo con mferreyra). |
| 42 | C4 | Chofer que quedó en un grupo de antes | NO PROBADO | No hay casos: el grupo "Choferes" (8) tiene a Cgodoy y logan, los dos con rol Usuario. |
| 43 | C4 | Pestaña de permisos sin la columna ID | OK | Sin ID. Son 8 tarjetas (General, Choferes, Camiones, Clientes, Viajes, Facturación, Configuración, Usuarios), de a cuatro por fila desde 1200 px, con los textos del menú. |
| 44 | C4 | Listas a 1366 y 390 px | OK | 1366: lado a lado; 390: una debajo de la otra, sin desborde. |
| 45 | C5 | Menú y textos de los permisos | OK | Clientes entre Camiones y Viajes. En Grupos y permisos y en Ver detalle del usuario, los permisos con el texto del menú ("Listar choferes", "Listar usuarios"…). |
| 46 | C6 / §41 p. 6 | Registrar chofer: validaciones | OK | Guardar vacío marca todos los campos a la vez. Usuario propuesto `dquiroga`. Contraseña corta: "Tiene que tener de 8 a 20 caracteres, con letras y números." al salir del campo. Usuario existente: "Ya existe un usuario con ese nombre.". E-mail con asterisco; vacío: "Completá el e-mail."; el de otro usuario: "Ese e-mail ya está registrado en otro usuario." debajo del campo, sin crear nada. |
| 47 | C6 / §41 p. 6 | Guardar con e-mail nuevo | OK | Chofer 12 y usuario 19 (`dquiroga`, rol chofer, e-mail copiado). Ver detalle del usuario: e-mail, Rol "Chofer" y "Es chofer: ve solo Hojas de ruta, con los viajes de su chofer.". Auditoría como pide la §41. El aviso "Chofer registrado con el usuario …" lo vio Rocío al guardar; no quedó registrado en mis notas. |
| 48 | C6 / §41 p. 4 | Ver detalle del usuario chofer muestra su chofer | FALLA | F6 (Baja): no dice cuál es el chofer. |
| 49 | C6 / §41 p. 5 | Pasar el usuario de Chofer a Usuario con un grupo | OK | Se le quita el chofer. Auditoría: "ChoferID: 12 -> ninguno". No avisa antes (M4). Se volvió a dejar Chofer con el chofer 12: "ChoferID: ninguno -> 12", y lo sacó solo del grupo 9. |
| 50 | C6 / §41 p. 7 | Editar un chofer viejo sin usuario (Pereyra, ID 5) | OK | "Todavía no tiene usuario: completalo para que pueda entrar a Hojas de ruta. También hace falta su e-mail: con él recupera la contraseña.". Completando el acceso sin e-mail: "Completá el e-mail." sin llamar a la API. Se canceló; el chofer no cambió. "Si se dejan vacíos, guarda igual" queda NO PROBADO para no guardar un chofer real. |
| 51 | C6 / §41 p. 8 | Listar choferes → Ver detalle | OK | "Acceso al sistema: Usuario dquiroga, Activo". "Inactivar y eliminar un chofer de prueba con usuario" queda NO PROBADO: dquiroga es el chofer de la demo (decisión de Rocío). |
| 52 | C6 | Celular del chofer de prueba | OK | El de Rocío (no va en el reporte). **Reemplaza a rjuarez** como chofer de la demo y de las rondas 4 y 6 (Rocío, 28/10). |

### Advertencias de compilación de los archivos de esta tanda (todas CS1591)
Autenticacion 12 · Choferes 40 · Comprobantes 41 (+ EnviosComprobantes 11) · Costos 48 · HojaDeRuta 36 · RecuperoContrasena 10 · Tarifario 41 · Usuarios 51 · Viajes 119 · WhatsAppConfig 15 · `Security\CorreoRecupero` 3 · `Security\RecuperoContrasena` 22 · `Security\RepositorioRecuperoSql` 5 · `Security\SesionesRecupero` 8 · `Services\WhatsApp\*` 38. No hay ninguna advertencia de otro tipo (variables sin usar, código inalcanzable, etc.).

## Fallas (la más grave primero)

### F1 — Una sesión invalidada no vuelve al login (401 sin CORS)
- Gravedad: **Alta**. El cambio de e-mail, el recupero o cambio de contraseña y la inactivación del usuario no cierran las sesiones abiertas en otro navegador; el chofer inactivado sigue adentro y lee "Revisá la conexión".
- Dónde: verificación de sesión de `sidebar-loader.js` (`GET api/sesion`, al cargar, al recuperar el foco y cada minuto) y cualquier llamada con un token rechazado.
- Pasos para reproducir:
  1. Entrar como mferreyra en `127.0.0.1:5502` y como admin en `localhost:5502`.
  2. Como admin, cambiarle el e-mail a mferreyra (o inactivar el usuario dquiroga con su sesión abierta).
  3. Volver a la otra pestaña y esperar más de un minuto.
- Esperado: vuelve al login con "Tu sesión venció. Volvé a iniciar sesión." y con `?volver=`.
- Obtenido: sigue en la pantalla. En Hojas de ruta: "No se pudo cargar tu hoja de ruta. Revisá la conexión y probá de nuevo."
- Consola / red: `Access to fetch at 'http://localhost:50222/api/sesion' from origin 'http://127.0.0.1:5502' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.` y `GET api/sesion [FAILED: net::ERR_FAILED]`. Con la sesión de admin: un token inventado en `api/sesion` o `api/Choferes` → "Failed to fetch"; sin token → 401 legible ("Tu sesión venció…"); con un token válido → 200.
- Causa probable: el 401 que arma `SesionesRecuperoHandler` (`Security/SesionesRecupero.cs:77-85`, registrado en `App_Start/WebApiConfig.cs:19` después de `EnableCors`) sale sin `Access-Control-Allow-Origin`. Las respuestas de los controllers sí lo traen: sin token, el handler no actúa y el 401 de `VerificarSesion` se lee bien. El front (`sidebar-loader.js:61`) toma la falla de red como "Un corte de conexión no cierra la sesión." Sin corregir. La prueba `recupero-accesos.test.js` da OK porque simula la respuesta.

### F2 — El recupero no envía el correo desde la VM
- Gravedad: **Alta**. En la VM nadie puede recuperar la contraseña, y la pantalla dice igual que se envió (es a propósito, para no revelar cuentas), así que nadie se entera.
- Dónde: Olvidé mi contraseña → `POST api/recupero-contrasena/solicitar`; perfil SMTP 3.
- Pasos para reproducir:
  1. Login → Olvidé mi contraseña → el e-mail de mferreyra (casilla de Integra con `+mferreyra`) → Enviar enlace (17:34).
  2. Revisar la casilla de Integra Analistas (Recibidos, Enviados y Todos).
- Esperado: llega "Recuperar contraseña" con el enlace.
- Obtenido: no llega nada.
- Consola / red: el pedido responde 200 con el mensaje general. Con el OK de Rocío: `POST api/EmailServidor/3/probar` → **400 "No se pudo leer la contraseña SMTP protegida. Volvé a guardarla."** (no envió nada).
- Causa probable: la contraseña SMTP se guarda con `MachineKey.Protect` (`EmailServidorController.cs:540`) y se lee con `MachineKey.Unprotect` (`CorreoRecupero.cs:40`). El `Web.config` no tiene un `<machineKey>` fijo, así que la clave depende de la máquina: el perfil lo guardó FGODOY (28/10 00:04) desde la suya y la VM no puede descifrarlo. Como la base es compartida, solo envía la máquina que guardó la contraseña la última vez. Lo más probable es que los perfiles 1 (Facturación) y 2 (Presupuestos) tengan el mismo problema (no se probaron, para no mandar correos). En el recupero, el error queda solo en un `Trace.TraceWarning` (`RecuperoContrasenaController.cs:82`).
- Rocío decidió no volver a guardar la contraseña desde la VM (dejaría de andar en la máquina de Facu). Para seguir: guardar la contraseña desde la VM antes de la prueba, o fijar una `machineKey` común fuera del repo.

### F3 — Lista, búsqueda y detalle de usuarios sin control de permiso ni de sesión
- Gravedad: **Media**, de seguridad: expone datos de todos los usuarios sin iniciar sesión. La §57 dice que "la API controla los permisos de lectura y gestión".
- Dónde: `GET api/Usuarios`, `GET api/Usuarios/Buscar`, `GET api/Usuarios/{id}/Detalles`, `GET api/Usuarios/MenusPermitidos?username=`.
- Pasos para reproducir: desde la consola de cualquier página (o con mferreyra sin permisos), `fetch` a esas direcciones sin el encabezado `Authorization`.
- Esperado: 401 sin token y 403 sin permiso de usuarios, como `GET api/Usuarios/{id}`.
- Obtenido: 200.
  - `api/Usuarios`: los 17 usuarios, con ID, usuario, nombre, apellido, rol y estado.
  - `Buscar`: lo mismo, con los inactivos.
  - `{id}/Detalles`: grupos y permisos de cualquier usuario.
  - `MenusPermitidos?username=RNUVOLI`: `{"Rol":"admin"}`, o sea, dice quién es administrador.
- Causa probable: esos métodos no tienen `[AccesoUsuarios(false)]` (`UsuariosController.cs`: `Get()` línea 75, `Buscar` 232, `GetDetalles` 654-658, `MenusPermitidos` 192-194). Los que lo tienen (`Get(int)`, `Post`, `Put`, `Delete`, `PutEstadoUsuario`) funcionan bien. `MenusPermitidos` lo usa el login antes de tener la sesión armada: habría que pedirle el token o devolverlo junto con el login.

### F4 — Un error 500 devuelve el detalle técnico y la pantalla no avisa nada
- Gravedad: **Media**.
- Dónde: Gestionar choferes → Registrar chofer → Provincia (`GET api/Provincias/5/Localidades`), y `GET api/Choferes/ValidarDNI/…` (~17:30).
- Pasos para reproducir: pasó en un corte pasajero de la base (al reintentar, anduvo en 300 ms). Se reproduce con cualquier error de la base en ese endpoint.
- Esperado: un aviso en castellano ("No se pudieron cargar las localidades. Probá de nuevo.") y nada técnico en la respuesta.
- Obtenido: en pantalla, nada: Localidad queda gris y vacía. La respuesta trae `ExceptionMessage`, `ExceptionType` (`EntityCommandExecutionException`), el mensaje de SQL ("Error en el nivel del transporte… error: 19 - No se puede utilizar la conexión física") y el `StackTrace` con la ruta `C:\Repo\SGTL\…\ProvinciasController.cs:línea 148`. La llamada tardó 16,7 s.
- Causa probable: `ProvinciasController.cs:148` no captura el error y Web API devuelve el detalle completo a las llamadas locales. Sin corregir.

### F5 — Auditoría: los grupos no se registran y sus cambios figuran como "sistema"
- Gravedad: **Media**.
- Dónde: Gestionar grupos y permisos; Auditoría.
- Pasos para reproducir:
  1. Registrar el grupo "Coordinación de tráfico" (ID 9).
  2. Guardar sus permisos.
  3. Editar un usuario de ese grupo.
- Esperado: el alta del grupo con el usuario que lo hizo; los cambios de permisos y miembros con RNUVOLI.
- Obtenido:
  - El filtro de entidad de Auditoría no tiene GRUPOS y el alta del grupo 9 no aparece.
  - `GRUPOS_MENU` y `GRUPOS_USUARIOS` figuran con usuario **"sistema"**.
  - Cada guardado borra y vuelve a crear todo: guardar los permisos borró el 279 y creó el 280 y el 281; editar el e-mail de mferreyra borró su `GRUPOS_USUARIOS` 39 y creó el 40, aunque los grupos no cambiaron.
- Causa probable: no se vio en el código.

### F6 — Ver detalle del usuario chofer no dice cuál es su chofer
- Gravedad: **Baja**.
- Dónde: Listar usuarios → Ver detalle de dquiroga.
- Esperado: el chofer vinculado (instructivo C6: "rol Chofer y su chofer").
- Obtenido: solo "Es chofer: ve solo Hojas de ruta, con los viajes de su chofer."

### F7 — Chofer inactivado: queda la sesión guardada y aparece un error antes del aviso
- Gravedad: **Baja**.
- Dónde: Hojas de ruta, con el chofer inactivado en Gestionar choferes.
- Obtenido:
  - Antes del aviso se ve "No se pudo cargar tu hoja de ruta.".
  - Después de "…se cerró tu sesión…" y del login, el token y los datos siguen en `localStorage`: la sesión no se borra del navegador.
- Esperado: solo el aviso del chofer inactivo, y borrar la sesión del navegador antes de ir al login.

## Design system
| # | Pantalla | Punto de la lista de control | Qué se ve | Qué pide la regla |
|---|---|---|---|---|
| DS1 | Login | 7 (formularios, §6.3) | El error de cada campo queda **dentro** del recuadro del campo (`login.css` pinta el borde en `.input-group` y el `.invalid-feedback` está adentro) y el borde no se pone rojo: queda azul o gris, con una sombra rosada solo en el input. | El campo en rojo y el mensaje debajo. |
| DS2 | Login → Olvidé mi contraseña y Restablecer contraseña | 5 y 7 (§5.1, §6.3) | "Revisá los campos marcados." y "El enlace no es válido o venció…" salen como **texto negro común**: a `#avisoRecupero` y `#avisoRestablecer` les faltan las clases `alert alert-danger` (`Login.html:154` y `:177`). | El aviso corto en rojo arriba del formulario, como `#avisoLogin`. |
| DS3 | Login, ojo de la contraseña | 1 (§1.5) | Solo tiene `aria-label` ("Mantener presionado para ver la contraseña"); no tiene el globito. | Todo botón de solo ícono lleva el globito de Bootstrap y `aria-label`. |
| DS4 | Cualquier pantalla al vencer la sesión (30 min) | 8 (§9) | Va al login sin ningún aviso (`sidebar-loader.js:26-31`). | "Tu sesión venció. Volvé a iniciar sesión." y se lleva al login. |
| DS5 | Gestionar usuarios, Registrar o Editar con rol Usuario | 8 (§9, sin inglés) | "El rol **user** necesita al menos un grupo: define qué pantallas ve." | El rol en castellano: "El rol Usuario necesita…". |
| DS6 | Gestionar usuarios, Registrar usuario | 7 (§6.3) y 5 (§5.1) | Marca los errores **de a uno**: con el e-mail mal y la contraseña vacía, marcó solo el e-mail y la contraseña recién en el segundo Guardar. La contraseña corta o sin números no se valida en la pantalla: va a la API y vuelve **arriba del modal** ("La contraseña debe tener entre 8 y 20 caracteres.", "La contraseña debe incluir al menos una letra y un número."). | Todos los campos con problema marcados juntos; el error de la API que es de un campo, debajo del campo (Registrar chofer sí lo hace bien). |
| DS7 | Gestionar usuarios, Registrar o Editar usuario | 4 (§6.2) | Cancelar con datos cargados cierra de una, sin "Tenés cambios sin guardar". | `SGTL.cambiosSinGuardar` (la regla dice pasarlo a la función al tocar la pantalla). |
| DS8 | Gestionar choferes → Editar chofer sin usuario | 7 (§6.3) | Al completar el acceso, el e-mail pasa a ser obligatorio pero no muestra el asterisco. | Asterisco rojo en lo obligatorio. |

## Mejoras sugeridas
- **M1. Restablecer contraseña con un enlace inválido o vencido** (`Login.html`, modal "Restablecer contraseña").
  - Hoy: muestra "El enlace no es válido o venció. Solicitá un nuevo recupero de contraseña." y además los dos campos y el botón "Restablecer contraseña", que no van a funcionar.
  - Propuesta: con un enlace mal formado, mostrar solo el aviso y un botón "Solicitar otro enlace" que abra "Olvidé mi contraseña".
- **M2. Avisar cuando el recupero no puede enviar** (relacionado con F2).
  - Hoy: si falla el SMTP, solo queda un `Trace.TraceWarning`.
  - Propuesta: registrarlo en Auditoría, o mostrar en Gestionar e-mail "El último envío del recupero falló el … · Volvé a guardar la contraseña". También un botón "Enviar correo de prueba" en cada perfil: el endpoint `api/EmailServidor/{id}/probar` ya existe y detecta la contraseña que no se puede leer.
- **M3. Un solo texto para la regla de contraseña.** Hoy hay cuatro:
  - "Tiene que tener de 8 a 20 caracteres, con letras y números." (choferes);
  - "La contraseña debe tener entre 8 y 20 caracteres." y "La contraseña debe incluir al menos una letra y un número." (API de usuarios);
  - "Usá entre 8 y 20 caracteres, con al menos una letra y un número." (recupero);
  - "Entre 8 y 20 caracteres, con al menos una letra y un número." (ayuda del recupero).

  Propuesta: "Usá de 8 a 20 caracteres, con letras y números." en los tres lugares, validado en la pantalla.
- **M4. Avisar antes de pasar un chofer a Usuario** (Gestionar usuarios → Editar).
  - Hoy: se le quita el chofer sin aviso.
  - Propuesta: al elegir otro rol, una línea amarilla: "Al guardar, deja de estar vinculado a Quiroga, Darío y ya no ve su hoja de ruta."
- **M5. Choferes inactivos en la lista "Chofer"** (Gestionar usuarios).
  - Hoy: ofrece Dominguez, Villanueva, López, Montenegro y Ferreyra, que están inactivos y no pueden iniciar sesión.
  - Propuesta: listar solo los activos, o marcarlos "(inactivo)".
- **M6. Localidad con 504 opciones** (Registrar chofer, provincia Córdoba).
  - Hoy: un desplegable común de 504 opciones.
  - Propuesta: el buscador compartido (`SelectClientePredictivo`), como cliente y chofer.
- **M7. La sesión dura 30 minutos aunque se esté usando.**
  - Hoy: la del admin se cortó en medio de la prueba, sin aviso (ver DS4).
  - Propuesta: renovar el token mientras hay actividad, o avisar unos minutos antes.
- **M8. Correo de un dato inválido con dos textos distintos.**
  - Hoy: "Escribí un e-mail válido." (usuarios y recupero) y "Revisá el e-mail: tiene que tener @ y un dominio, como nombre@correo.com." (choferes).
  - Propuesta: unificarlos.
- **M9. Editar chofer no propone el nombre de usuario.** En Registrar chofer sí lo propone (inicial y apellido); al completar el acceso desde Editar, el campo queda vacío.
- **M10. Ejemplos con nombres del equipo.** Registrar usuario usa "Facundo", "Godoy" y "fgodoy" como ejemplos, y Gestionar choferes, "rjuarez". Propuesta: datos inventados ("Juan", "Pérez", "jperez"), como en los filtros.
- **M11. Mensaje de un `PUT` sin permiso.** "No tenés permiso para acceder a los usuarios." en un `PUT` → mejor "No tenés permiso para modificar usuarios." (`SesionesRecupero.cs:101`).
- **M12. Ruedita del login.** En la primera carga, `#loadingSpinner` quedó girando encima del campo Usuario unos segundos, mientras `api/GestionContenido/1` tardaba.
- **M13. Pruebas con los acentos rotos.**
  - `tests/impresion-comprobantes.test.js:137` imprime "impresiÃ³n … pestaÃ±a": el texto está guardado con doble codificación.
  - `tests/contrasenas-seguras.test.ps1` imprime "migraciÃ³n/polÃ­tica" en PowerShell 5.1: archivo UTF-8 sin BOM.
- **M14. Node en la VM.** Node no está instalado en la VM; las pruebas se corrieron con el que trae Visual Studio (`C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs`). Instalar Node LTS o anotarlo en `PRUEBAS-VM-CLAUDE.md`.
- **M15. `PRUEBAS-VM-CLAUDE.md` contradice a CLAUDE.md sobre `git pull`.** Su §1 prohíbe `git pull` en la VM, mientras que CLAUDE.md y el instructivo de hoy dicen que la VM hace `pull`. Conviene sacarlo de la lista de prohibidos.
- **Conocido, sin falla nueva (§2 de PENDIENTES, hora en UTC).** Auditoría muestra la hora en UTC (20:25 por 17:25). El chofer 12 guardó `Fecha_Alta` en UTC (20:25:17) y `Fecha_Modi` en hora local (17:46:49); el usuario 19, en hora local.

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre que se le puso | Qué se hizo |
|---|---|---|---|---|
| Gestionar grupos y permisos | GRUPOS | 9 | Coordinación de tráfico | Alta. Permisos: Dashboard (MenuID 1) y Listar usuarios (MenuID 14). |
| (permisos del grupo 9) | GRUPOS_MENU | 280, 281 | — | Quedaron al guardar los permisos; el 279 se borró solo. |
| Gestionar usuarios | USUARIOS | 18 | mferreyra (Mariana Ferreyra) | Alta con rol Usuario y grupo 9, e-mail de la casilla de Integra con `+mferreyra`. Después, e-mail cambiado a `+mferreyra2`. La contraseña la puso Rocío. |
| (grupos de mferreyra) | GRUPOS_USUARIOS | 40 | — | mferreyra en el grupo 9 (el 39 se borró solo al editarla). |
| Olvidé mi contraseña | RECUPERO_CONTRASENA | — | UsuarioID 18 | Un pedido a las 17:34; no se envió (F2), probablemente quedó descartado. |
| Gestionar choferes | CHOFERES | 12 | Darío Quiroga (DNI 31478259, CUIL 20314782594) | Alta: Córdoba, Av. Colón 1250, celular de Rocío, e-mail de la casilla de Integra con `+dquiroga`. Inactivado y activado. **Queda: es el chofer de la demo y reemplaza a rjuarez.** |
| (usuario del chofer) | USUARIOS | 19 | dquiroga | Alta con el chofer (rol Chofer). Inactivado y activado; pasado a Usuario con el grupo 9 y vuelto a Chofer con el chofer 12. **Queda.** La contraseña la puso Rocío. |
| (grupos de dquiroga) | GRUPOS_USUARIOS | 41 | — | Se creó al pasarlo a Usuario y se borró al volverlo a Chofer. |
| Gestionar usuarios | USUARIOS | 13 (nviola), 17 (rjuarez) | — | Solo se abrieron en Editar y se canceló; sin cambios. |
| Gestionar choferes | CHOFERES | 5 (Pereyra, Marcos) | — | Editar y Cancelar; sin cambios (última modificación 21/10, FMONTENEGRO). |
| Gestionar e-mail | — | perfil 3 | — | No se cambió nada. Se usó `POST api/EmailServidor/3/probar` (con OK de Rocío): falló al leer la contraseña y no envió. |
| Configuración de facturación | — | — | — | **No se tocó.** |

Datos con marcas de prueba de rondas anteriores (no se tocaron): **GRUPOS 7 "PRUEBA-CLAUDE 20/10"** (Gestionar grupos y permisos).

## SQL de limpieza propuesto (NO ejecutado)
Borra solo el usuario mferreyra y el grupo 9. El chofer 12 y el usuario dquiroga **no se borran** porque son los de la demo. `RECUPERO_CONTRASENA` y `TABLEROS_USUARIO` se borran solos con el usuario (`ON DELETE CASCADE`); igual se cuentan.

```sql
BEGIN TRAN;

-- Usuario de prueba mferreyra (ID 18)
SELECT Usuario_ID, Nombre_Usuario, Nombre, Apellido, Rol, Email
FROM dbo.USUARIOS WHERE Usuario_ID = 18 AND Nombre_Usuario = 'mferreyra';  -- tiene que dar 1 fila

DELETE gu FROM dbo.GRUPOS_USUARIOS gu
JOIN dbo.USUARIOS u ON u.Usuario_ID = gu.UsuarioID
WHERE u.Usuario_ID = 18 AND u.Nombre_Usuario = 'mferreyra';
SELECT @@ROWCOUNT AS GruposDeMferreyra;        -- esperado: 1

DELETE rc FROM dbo.RECUPERO_CONTRASENA rc
JOIN dbo.USUARIOS u ON u.Usuario_ID = rc.UsuarioID
WHERE u.Usuario_ID = 18 AND u.Nombre_Usuario = 'mferreyra';
SELECT @@ROWCOUNT AS RecuperosDeMferreyra;     -- esperado: 1

DELETE FROM dbo.USUARIOS WHERE Usuario_ID = 18 AND Nombre_Usuario = 'mferreyra';
SELECT @@ROWCOUNT AS UsuarioMferreyra;         -- esperado: 1

-- Grupo de prueba "Coordinación de tráfico" (ID 9)
DELETE gm FROM dbo.GRUPOS_MENU gm
JOIN dbo.GRUPOS g ON g.Grupo_ID = gm.GrupoID
WHERE g.Grupo_ID = 9 AND g.Grupo_Nombre = N'Coordinación de tráfico';
SELECT @@ROWCOUNT AS PermisosDelGrupo9;        -- esperado: 2

DELETE gu FROM dbo.GRUPOS_USUARIOS gu
JOIN dbo.GRUPOS g ON g.Grupo_ID = gu.GrupoID
WHERE g.Grupo_ID = 9 AND g.Grupo_Nombre = N'Coordinación de tráfico';
SELECT @@ROWCOUNT AS MiembrosDelGrupo9;        -- esperado: 0 (ya se borró con mferreyra)

DELETE gp FROM dbo.GRUPOS_PERMISOS gp
JOIN dbo.GRUPOS g ON g.Grupo_ID = gp.GrupoID
WHERE g.Grupo_ID = 9 AND g.Grupo_Nombre = N'Coordinación de tráfico';
SELECT @@ROWCOUNT AS PermisosCCDelGrupo9;      -- esperado: 0

DELETE FROM dbo.GRUPOS WHERE Grupo_ID = 9 AND Grupo_Nombre = N'Coordinación de tráfico';
SELECT @@ROWCOUNT AS Grupo9;                   -- esperado: 1

-- COMMIT; o ROLLBACK;
```

Para el grupo viejo "PRUEBA-CLAUDE 20/10" (ID 7), mirar primero qué tiene antes de decidir:

```sql
SELECT 'menus' AS que, COUNT(*) FROM dbo.GRUPOS_MENU WHERE GrupoID = 7
UNION ALL SELECT 'usuarios', COUNT(*) FROM dbo.GRUPOS_USUARIOS WHERE GrupoID = 7
UNION ALL SELECT 'permisos cc', COUNT(*) FROM dbo.GRUPOS_PERMISOS WHERE GrupoID = 7;
```

## Qué falta para cerrar la ronda 1
- Todo lo del correo del recupero (puntos 7, 13, 14, 17, 24 y 26, y que llegue un solo correo en el 12): con el perfil 3 guardado desde la VM, o con una `machineKey` común (F2).
- Volver a probar los puntos 18, 23 y 31 cuando se corrija F1.
- El punto 6 (perfiles cruzados desde la API), si Rocío lo autoriza.
- En la Mac: actualizar `docs/equipo/INSTRUCTIVO-CUENTAS-CHOFERES.md` con el chofer de la demo nuevo (dquiroga, chofer 12) en lugar de rjuarez.
