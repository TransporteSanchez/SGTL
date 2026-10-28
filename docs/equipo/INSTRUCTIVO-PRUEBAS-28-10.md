# Instructivo de pruebas del 28/10 (para la VM)

Para la sesión de Claude Code que prueba en la VM. Junta **todo lo que está subido a `rocionuvoli` y todavía no tiene un
reporte de prueba** (Rocío, 28/10):

- **La integración de Facu** (`facugodoy`, 39 commits del 26 al 28/10): §44 a §57 de `docs/PENDIENTES-SISTEMA.md`.
- **La integración de Fede** (`fedemontenegro`, WhatsApp en viajes): §58. Va aparte y al final.
- **Lo nuestro del 24 al 28/10 que no se probó:** el flujo de viajes con Cancelado y Sin carga (§41, puntos 10 y 22), el
  precio por orden del día con los camiones y choferes ocupados (§43), los textos y avisos de tarifas (§40, punto 7, y
  §41, puntos 12 a 14), el tiempo estimado de Google (§41, punto 36), la hoja de ruta del chofer (§36 y §41, puntos 4,
  30, 31, 33 y 35), el control interno y el galpón (§37 y §41, punto 28), las dos mejoras de cuenta corriente (§29) y los
  arreglos de la demo (§38).
- **Los adicionales del viaje directo** (esperas, descarga, repaletizado y vuelta vacía, como en Rukas; §60), hechos
  la noche del 28/10 para mostrarlos el 29/10: ronda 2, parte Q.

**Queda afuera:** la parte C de `docs/equipo/INSTRUCTIVO-PRUEBAS-TARIFAS.md` (lo que ya vio el cliente, tanda 2 de la §39),
que espera la limpieza y los documentos de demo de la §38.

Antes de pasar todo a `main` y a las ramas de Facu y Fede, esta tanda tiene que confirmar tres cosas:

1. **Que cada tema funciona**, incluidos los casos que no figuran en su "Probar": errores, permisos, doble clic, datos
   que faltan, lo que pasa en otra pantalla.
2. **Que las partes funcionan juntas**: los cruces entre temas están marcados con **[cruce]**.
3. **Que todo cumple el design system** (`docs/design-system/03-decisiones.md` y la lista de control de `AGENTS.md`), con
   la mirada de usabilidad de la sección 1.

**Las reglas de la sesión, los datos de prueba y el formato del reporte son los de `docs/equipo/PRUEBAS-VM-CLAUDE.md`:
leelo antes.** Lo que cada sección de `docs/PENDIENTES-SISTEMA.md` dice para probar se hace completo; acá se remite a esas
secciones y se agrega lo que falta.

Son **seis rondas**, cada una con su reporte, en orden de prioridad para la reunión del jueves 29/10 (Rocío puede
cambiarlo). Si una ronda no termina en una sesión, el reporte dice hasta dónde llegó.

| Ronda | Partes | Toca la base |
|---|---|---|
| 1 | A (compilación y pruebas automáticas), B (login, sesión y recupero), C (usuarios, grupos, permisos y el usuario del chofer) | Usuarios, un grupo y un chofer de prueba |
| 2 | K (flujo de viajes), L (precio por orden del día y ocupados), M (tarifas: textos y avisos; tiempo estimado), Q (adicionales del viaje) | Viajes y presupuestos de prueba; corrige la tabla de prueba |
| 3 | E (tipos de comprobante), F (cuenta corriente), G (proformas), P (lo que quedó de cuenta corriente y de la demo) | **Emite comprobantes y cambia la configuración de facturación: con OK de Rocío** |
| 4 | N (hoja de ruta del chofer), O (control interno y galpón) | Viajes de prueba, gastos y un cambio de galpón que se anula al final |
| 5 | D (orden de las tablas), H (cruces), I (recorrida general) | Casi nada (lo de H, con OK de Rocío) |
| 6 | J (WhatsApp en viajes, de Fede), aparte y al final | **Manda WhatsApp reales: con Rocío** |

Reportes: `C:\pruebas-sgtl\reportes\AAAA-MM-DD-pruebas-ronda-N.md`.

---

## 0. Antes de empezar (lo hace o lo confirma Rocío)

- **Scripts de Facu en la base.** La API integrada ya lee `USUARIOS.Email` y `USUARIOS.VersionSesion`: si
  `database/seguridad/02_recupero_contrasena.sql` no está corrido, **el login falla**. Rocío corre
  `database/verificacion/01_scripts_corridos.sql` (solo lectura): dice script por script si está corrido. Se corren
  **solo los que dicen "Falta correrlo"**, en este orden: `cuenta-corriente/11` a `17`, `seguridad/02` y `email/07`. **Nunca
  se vuelve a correr uno que ya está**: el 13, el 14, el 15 y el 17 reescriben las mismas restricciones, y correr uno viejo
  encima de uno nuevo (el 13 o el 14 después del 15) deshace lo que agregó el nuevo. Si alguno da "A medias", se le pasa a
  Claude la tercera tabla del diagnóstico antes de correr nada. El `cuenta-corriente/18` (corrige
  acentos de recibos viejos) y `documentacion/02` (manual) son de datos y terminan en ROLLBACK: se deciden aparte (el
  diagnóstico dice cuántos recibos tienen el acento mal y qué manual está publicado). Al final, el diagnóstico tiene que
  decir "Corrido" en todos. Al 28/10 ya lo dice, el manual 0003 está publicado y el 18 ya se aplicó (recibo 49 y su
  movimiento).
- **Scripts nuestros y de Fede.** Desde el 28/10 el diagnóstico mira también `whatsapp/02` (fila 14, ya corrido) y los
  nuestros del 24 al 27/10 que necesitan las rondas 2 y 4 (filas 15 a 20: `tarifas/02`, `05` y `06`, `tableros/01` y
  `costos/01` y `02`). Si alguno dice "Falta correrlo", se corre como dice su encabezado, **antes de recompilar**. Al
  28/10 están todos corridos (`tarifas/06` y `costos/02`, ese mismo día).
- **Adicionales del viaje (§60, la noche del 28/10):** `database/viajes/04_adicionales_del_viaje.sql`, fila 21 del
  diagnóstico. **Se corre antes de recompilar** (primero con `@Aplicar = 0`, después con `1`; al final, "OK" en las dos):
  la API nueva lee `VIAJES.Vuelta_Vacia_Porcentaje` y `VIAJES.Adicionales`, y sin ellas Gestionar viajes no carga.
- **§43, paso 1 (hecho el 28/10):** `database/tarifas/07_relevar_vueltas_por_recorrido.sql` dio un solo caso, el viaje
  #40 (Servicios Ambientales S.A.), guardado como 2ª vuelta y que con la regla nueva es 1ª. Rocío lo edita y lo guarda
  después de recompilar: pasa a 1ª y cambia su importe. Si en la ronda 2 aparece con otro importe que antes, es eso y no
  una falla. **Hecho el 28/10:** quedó como 1ª, con otro camión (el suyo estaba ocupado en ese horario).
- **Viajes superpuestos de antes del 27/10** (cargados antes del control de camión y chofer ocupados, §43): el mismo
  camión o el mismo chofer en dos viajes que se pisan. Al 28/10: #5 y #6 (julio, camión 2), #11 con #45, #46 (camión 2)
  y #12 (chofer 9), #36 y #47 (chofer 4), #41 y #51 (camión 2), #33 y #35 (camión 1) y #37 y #42 (chofer 11). Si al
  editar uno de esos aparece "Camión ocupado" o "Chofer ocupado", es el dato viejo y no una falla: anotalo y probá con
  otro viaje o con uno nuevo. Se corrigen con la limpieza de datos (§41, punto 21).
- **Script de Fede (para la ronda 6):** `database/whatsapp/02_plantillas_cancelado_y_desasignado.sql`; el diagnóstico lo
  mira en la fila 14. Sin él no abre Configuración de WhatsApp (el alta de un viaje sigue mandando la hoja de ruta). **Al
  28/10 ya está corrido** (las tres plantillas cargadas, en `es_AR`). En Meta
  tienen que estar aprobadas `viaje_cancelado` y `viaje_desasignado`: se revisa antes de la ronda 6 (sección 7).
- La VM en `rocionuvoli` con el último commit (`git log --oneline -1`), la API **recompilada con Recompilar solución**
  (no alcanza con ejecutar) y Ctrl+F5 en el navegador.
- **Five Server en el 5502** (desde el 28/10, como en la Mac y en la máquina de Facu): después del `pull`, cerrarlo y
  volverlo a abrir; abajo, en la barra de VS Code, tiene que decir 5502. El sistema se abre en `http://localhost:5502`
  y hay que volver a iniciar sesión una vez (la sesión se guarda por puerto).
- **Usuarios** (el login lo hace Rocío):
  - un administrador;
  - uno con rol Usuario que solo tenga "Listar usuarios";
  - uno con rol Usuario sin ningún permiso de usuarios;
  - uno con acceso a proformas y sin cuenta corriente;
  - la cuenta del chofer de prueba de `docs/equipo/INSTRUCTIVO-CUENTAS-CHOFERES.md`, si ya existe (si no, se crea en la
    parte C, punto 6).
- **Recupero de contraseña:** el recupero manda el correo con un perfil propio, que no puede ser el mismo de Facturación
  ni de Presupuestos (la API y la base lo impiden). Al 28/10 ya está asignado el perfil 3 ("Recupero contraseña"), que
  manda desde la cuenta de siempre (Integra Analistas, por Gmail), con SSL y con la contraseña guardada: **se usa ese**. El
  diagnóstico lo vuelve a mostrar.
  - Si algún día falta, Rocío registra en Configuración → Gestionar e-mail **un perfil nuevo con los mismos datos del que
    ya usan** (servidor, puerto, remitente, usuario y contraseña, que escribe ella), con "Conexión segura (SSL)" tildada, y
    lo elige en "Perfil SMTP asignado".
  - **La "Dirección del login" queda como está**, `http://127.0.0.1:5502/Login.html`: con la VM en el 5502, el enlace
    del correo abre su login (pide iniciar sesión aparte, porque `127.0.0.1` y `localhost` son dos direcciones para el
    navegador). Es una sola dirección para todo el equipo y es la que usa Facu.
  - El correo se abre **en la VM**: el enlace lleva a localhost y desde el celular no abre.
  - Los enlaces llegan a la casilla de Integra Analistas, que es la real del equipo (Rocío, 28/10; `@example.com` no
    recibe). Cada usuario necesita un e-mail distinto: se le agrega `+algo` antes de la arroba (`integraanalistas+admin@…`,
    `integraanalistas+lista@…`) y llegan todos a la misma casilla. Como el correo sale de esa misma cuenta, Gmail puede
    no ponerlo en Recibidos: si no aparece, buscalo en Enviados o en Todos, por el asunto o por el `+algo`.
  - Al 28/10, solo 1 de los 14 usuarios activos tiene e-mail. Los que no tienen entran igual, pero no pueden recuperar la
    contraseña y, al editarlos en Gestionar usuarios, el e-mail es obligatorio.
- **Google (km de un recorrido nuevo, tiempo estimado, mapas y km al galpón):** la clave de Google acepta
  `localhost:5502`. Con la VM en el 5502 y el sistema abierto como `http://localhost:5502`, tiene que andar. Si igual no
  responde (los km no se calculan o la consola dice `RefererNotAllowedMapError`), anotalo una vez como falla, seguí con
  los km a mano y no lo repitas en cada paso.
- **WhatsApp en las rondas 1 a 5:** registrar o editar un viaje con chofer intenta mandarle la hoja de ruta. Si el token
  del día no está, el aviso dice que no se pudo enviar: no es una falla, anotalo una vez. WhatsApp se prueba en la ronda 6.
- **Ronda 3:** Rocío dice qué tipos de comprobante se pueden activar o desactivar, con qué cliente de prueba se emite y
  si los números que se consuman (FC, C, D, recibos) le sirven. Anotá **el estado inicial de cada tipo** que toques: al
  final tiene que quedar igual. Facu y Fede, avisados de que durante la ronda 3 cambia la configuración de facturación.
- **Ronda 4:** Rocío dice qué kilometraje, fecha y consumo cargar en un camión y el precio del gasoil (§37, paso 3), y
  avisa al equipo que se va a probar un cambio de galpón que se anula al final.

---

## 1. Cómo mirar cada pantalla (en todas las partes)

### 1.1 Que funcione

Además del camino feliz de cada prueba, probá siempre estos casos y anotá qué pasa:

1. **Datos que faltan o están mal:** campos vacíos, un e-mail sin @, importes en 0 o negativos, fechas al revés, un
   texto muy largo. El error tiene que aparecer debajo del campo, sin perder lo escrito.
2. **Doble clic** en el botón que guarda, emite o envía: no tiene que hacerlo dos veces. Mirá en la red cuántas
   llamadas salen.
3. **Permisos:** la misma acción con un usuario que no la tiene. La pantalla no la ofrece (o la deshabilita con el
   motivo) y **la API la rechaza**: para probarlo, repetí la llamada desde la consola (F12) con `fetch` y el token de
   `localStorage`, **sin mostrar el token** en el reporte.
4. **Lo que cambia en otra pantalla:** después de guardar, mirá las pantallas que muestran ese dato (detalle, listado,
   PDF, cuenta corriente, auditoría, tableros). Tiene que coincidir en todas.
5. **Cancelar a mitad de camino:** cerrar el modal con cambios, cancelar una confirmación, volver atrás. No se guarda
   nada.
6. **Errores del servidor:** si algo falla, el mensaje tiene que decir qué pasó en castellano. **Nunca un error técnico**
   (nombres de tablas, "Exception", "SQL", códigos HTTP) ni un mensaje en inglés.
7. **Consola y red:** sin errores rojos al abrir y al usar cada pantalla.
8. **Ancho:** las pantallas nuevas o cambiadas, también a 1366, 768 y 390 px (modo celular).

### 1.2 Que cumpla el design system

Por cada pantalla o modal que toques, recorré la lista de control de `AGENTS.md` (los 14 puntos) y anotá cada desvío. Los
que más se escapan:

- **Botones de la fila:** solo ícono, con tooltip y `aria-label`, en el orden Ver detalle · Editar · Ver PDF · Enviar por
  e-mail (o Reenviar WhatsApp, en viajes) · Cambiar estado · Siguiente paso · Activar/Inactivar · Eliminar/Anular. Lo que no se puede hacer queda
  **deshabilitado con el motivo**, que dice "No se puede {acción} {sobre qué}: {qué le pasa a esta fila}". Las excepciones
  vigentes (Eliminar oculto en Gestionar tipos de comprobante; Imputar solo en créditos internos y recibos) están en
  `AGENTS.md`: cualquier otro botón escondido es un desvío.
- **Verbos:** el botón que abre un modal y el título del modal dicen lo mismo. Pie: Cancelar + el verbo. **Nunca
  "Confirmar".**
- **Avisos:** los de éxito se van solos; **los de error no** (quedan hasta que se corrige o se cierra). Nunca `alert()`,
  `confirm()` ni `prompt()` del navegador.
- **Textos:** voseo, mayúscula solo al principio ("la factura", "el recibo", "la nota de crédito"), títulos y botones sin
  punto, mensajes con punto, sin inglés a la vista.
- **Estados** con la etiqueta de color del sistema; **fechas** DD/MM/AAAA con el selector del sistema (nunca el
  calendario del navegador); **montos** "$ 1.234,56" y los que se escriben, con la máscara (nunca un campo numérico con
  flechitas).
- **Tablas:** rayadas, "Cargando…" mientras busca, el texto de sin resultados del sistema, los montos a la derecha.
- **Formularios:** asterisco rojo en lo obligatorio, "Revisá los campos marcados." arriba, lo que no se edita como texto
  y nunca como campo deshabilitado.

### 1.3 Que se entienda

Igual que en `docs/equipo/INSTRUCTIVO-PRUEBAS-TARIFAS.md` §1. En cada texto, aviso y mensaje, preguntate si se entiende a la
primera, si es largo, si es confuso o si falta algo, pensando en la persona administrativa que lo va a usar. Va a
"Mejoras sugeridas" con dónde está, el texto actual tal cual, qué problema tiene y una propuesta concreta.

---

## 2. Ronda 1

### Parte A — Compilación y pruebas automáticas

1. Recompilar la solución: **cero errores**. Copiá las advertencias nuevas que mencionen archivos de esta tanda
   (`UsuariosController`, `AutenticacionController`, `ComprobantesController`, `RecuperoContrasenaController`,
   `Security\*Recupero*`, `ChoferesController`, `HojaDeRutaController`, `ViajesController`, `CostosController`,
   `TarifarioController`, `WhatsAppConfigController`, `Services\WhatsApp\*`). En la Mac no se pueden compilar: **si hay
   errores, pará y pasáselos a Rocío.**
2. En una terminal, en `C:\Repo\SGTL`, correr cada `node tests\<archivo>.test.js`: todos tienen que imprimir `OK`. En la
   Mac no se pudieron correr estos once, que usan PowerShell y son de Facu: `comprobantes-tipos-directos-email`,
   `debito-interno-referencia-api`, `envio-proforma-adjuntos`, `orden-clientes-backend`, `orden-cuenta-corriente-backend`,
   `orden-proformas-backend`, `orden-viajes-backend`, `recibos-concepto-codificacion`, `recibos-imputacion-api`,
   `recupero-contrasena`, `reintento-credito-cancelatorio`. Por cada uno que falle, el mensaje completo. Los demás (69,
   entre ellos `viajes-flujo`, `orden-del-dia`, `hoja-de-ruta` y `control-interno`) dieron OK en la Mac el 28/10.
3. `tests\contrasenas-seguras.test.ps1`, si existe, con PowerShell.

### Parte B — Login, sesión y recupero de contraseña (§57 y lo nuestro)

1. **El "Probar en la VM" completo de la §57.** Necesita el perfil SMTP y la casilla de la sección 0.
2. **Error del login [cruce]:** con una contraseña mal, el aviso rojo aparece arriba, se mueve una vez y **no se va
   solo**; esperá 10 segundos para confirmarlo. Se va al escribir en el usuario o la contraseña, y vuelve a aparecer si
   el próximo intento falla. Con los campos vacíos: los errores debajo de cada campo y "Revisá los campos marcados.".
3. **El ojo de la contraseña:** la muestra solo mientras se mantiene presionado (mouse, Enter, espacio). Al soltar, al
   salir del botón o al cambiar de pestaña, se oculta.
4. **Olvidé mi contraseña:**
   - Un e-mail que no existe y uno que existe muestran **la misma respuesta**.
   - Doble clic en Enviar: llega un solo correo.
   - El enlace sirve una sola vez y vence a los 20 minutos (si no se puede esperar, anotalo como NO PROBADO).
   - Mientras no se usa el enlace, la contraseña de antes sigue entrando.
   - Una contraseña nueva que no cumple la regla, o que no coincide al repetirla: el error debajo del campo.
   - Mirá el texto del correo recibido: castellano, voseo, sin datos técnicos y sin la contraseña.
5. **Sesión en dos navegadores:** entrar con el mismo usuario en el navegador integrado y en otro. Cambiarle la
   contraseña desde el primero (o completar un recupero): el segundo vuelve al login al recuperar el foco o en menos de
   un minuto, con "Tu sesión venció. Volvé a iniciar sesión." o equivalente, y **después de entrar vuelve a la pantalla
   donde estaba** (`?volver=`).
6. **Chofer [cruce]:** con la cuenta del chofer (si no existe, hacé antes el punto 6 de la parte C), entrar desde el celular (390 px): va directo a Hojas de ruta. Con la
   sesión abierta:
   - Inactivar su chofer en Gestionar choferes (como admin, en otra ventana) y tocar "Hoy y próximos": "Tu chofer quedó
     inactivo, así que se cerró tu sesión. Es necesario que hables con administración." y después el login. Volver a
     entrar: "No se puede iniciar sesión: el chofer de este usuario está inactivo. Hablá con administración.". Activarlo
     de nuevo.
   - Inactivar **el usuario** del chofer en Gestionar usuarios: en menos de un minuto vuelve al login (la sesión de
     Facu). Activarlo de nuevo.
   - El chofer usa Olvidé mi contraseña con el e-mail que se le cargó en Gestionar choferes: llega el enlace y, después
     de cambiarla, entra directo a Hojas de ruta.
7. **Auditoría:** el inicio de sesión, el recupero ("Recupero de contraseña", etiqueta azul) y los cambios de e-mail, con
   el usuario que corresponde y **sin contraseñas ni enlaces**.
8. Design system del login y de los dos formularios de recupero, a 1920, 1366, 768 y 390 px.

### Parte C — Usuarios, grupos y permisos

1. **Gestionar usuarios (E-mail, §57):**
   - Registrar un usuario: E-mail obligatorio. Probá uno inválido, uno repetido (el de otro usuario, también con
     mayúsculas: `Admin@Example.com`) y uno bien.
   - Editar un usuario viejo **sin e-mail** (anotá cuál): no deja guardar sin e-mail. ¿Se entiende por qué lo pide?
   - Cambiar el e-mail de un usuario con sesión abierta en otro navegador: esa sesión vuelve al login.
2. **Roles [cruce]:** el rol dice Administrador, Usuario y Chofer.
   - Usuario pide grupos.
   - Chofer pide el chofer y no pide grupos.
   - Editar el usuario del chofer (rol Chofer, su chofer, su e-mail): Cancelar sin guardar.
3. **Permisos de la API (§57):**
   - Con el usuario que solo lista: Listar usuarios y su detalle andan; Gestionar usuarios no deja guardar, y la API
     rechaza un `PUT` de e-mail desde la consola.
   - Con el usuario sin permisos de usuarios, la API rechaza también leer el detalle (`GET api/Usuarios/{id}`).
   - El mensaje que se ve en cada caso, ¿está en castellano y se entiende?
4. **Grupos y permisos (commits del 26/10):**
   - La pestaña "Usuarios por grupo" con las dos listas, la búsqueda, los botones "Todos" (solo sobre lo filtrado) y
     Guardar.
   - Un usuario con un solo grupo no se puede quitar de ese grupo, deshabilitado con el motivo.
   - Agregar un administrador: lo rechaza.
   - **Usuario con rol Chofer [cruce]:** el chofer no tiene grupos (ve solo Hojas de ruta). No aparece entre los
     disponibles ni entra con "Agregar todos". Desde la consola, el `POST` de `api/Grupos/{id}/Usuarios/Cambios` con su ID
     en `AgregarIds` responde "No se puede agregar un chofer al grupo: con su rol ve solo Hojas de ruta." y no guarda
     nada (se corrigió el 28/10, antes de esta tanda). Si un chofer quedó en un grupo de antes, se ve entre los asignados y
     se puede quitar.
   - La pestaña de permisos con las cuatro tarjetas y sin la columna ID.
   - Las listas a 1366 y a 390 px.
5. **Menú:** Clientes entre Camiones y Viajes. En Grupos y permisos y en Ver detalle del usuario, los permisos se ven con
   el texto del menú.
6. **Gestionar choferes, el usuario del chofer** (§41, puntos 30 y 31: el "Cómo probarlo" completo, pasos 1 a 8; el 5b
   es el punto 4 de esta parte):
   - Registrar chofer: el E-mail con asterisco. Sin e-mail: "Completá el e-mail.". Con el de otro usuario: "Ese e-mail ya
     está registrado en otro usuario." debajo del campo.
   - Guardar con un e-mail nuevo: en Listar usuarios → Ver detalle, el usuario nuevo tiene ese e-mail, rol Chofer y su
     chofer. En Auditoría: "…, Email: ninguno -> …".
   - Editar un chofer viejo sin usuario: sin completar el acceso guarda aunque no tenga e-mail; completando el acceso,
     pide el e-mail.
   - Es el chofer de la demo y el de las rondas 4 y 6: preguntale a Rocío qué celular usar y si este reemplaza al de
     `docs/equipo/INSTRUCTIVO-CUENTAS-CHOFERES.md`.
7. Datos creados: el usuario de prueba, el grupo y el chofer, con ID y nombre para la limpieza.

---

## 3. Ronda 2 — Viajes

### Antes de la ronda 2: reprueba corta de la ronda 1 (§59)

Con la API recompilada (los arreglos del 28/10 tocan C#) y las dos sesiones de la ronda 1 (admin en `localhost:5502`,
mferreyra o dquiroga en `127.0.0.1:5502`):

1. **F1:** cambiarle el e-mail a mferreyra con su sesión abierta en la otra pestaña: en menos de un minuto vuelve al
   login, y después de entrar, a la pantalla donde estaba. Lo mismo inactivando el usuario de dquiroga (activarlo
   después). En la consola, ningún error de CORS.
2. **F7:** inactivar el chofer 12 con la sesión de dquiroga abierta y tocar "Hoy y próximos": solo el aviso del chofer
   inactivo, sin "No se pudo cargar tu hoja de ruta.". Después del login, en `localStorage` ya no está el token. Activarlo.
3. **F6:** Listar usuarios → Ver detalle de dquiroga: "Chofer: Quiroga, Darío (DNI …)". El de un usuario que no es chofer
   no muestra esa línea.
4. **M11:** con mferreyra (solo "Listar usuarios"), un `PUT api/Usuarios/18` desde la consola responde "No tenés permiso
   para modificar usuarios.".
5. **DS2:** Olvidé mi contraseña → Enviar enlace con el e-mail vacío: "Revisá los campos marcados." en rojo. Abrir
   `Login.html#recupero=abc`: el aviso del enlace inválido, en rojo.
6. **DS5:** Registrar usuario con rol Usuario: "El rol Usuario necesita al menos un grupo…".
7. **DS8:** Editar el chofer 5 (sin usuario): al escribir el nombre de usuario, E-mail muestra el asterisco; al borrarlo,
   se va. Cancelar.
8. **F4:** si en cualquier momento de la tanda una llamada da error 500, la respuesta no trae `ExceptionMessage` ni
   `StackTrace`. Si las localidades no cargan en Registrar chofer, el error va debajo de Localidad.
9. **F2:** si Rocío guardó la contraseña SMTP desde la VM, los puntos del correo de la ronda 1 (7, 12, 13, 14, 17, 24 y
   26). Si no, NO PROBADO.

Con viajes de prueba de un cliente directo y de uno con plataforma (Rukas), y con nombres creíbles (anotá ID y nombre de
lo que crees, para la limpieza). Con tarifa fija y recorridos de hasta 130 km para lo de la vuelta del día.

### Parte K — Flujo de viajes (§41, puntos 10 y 22)

1. **§41, punto 22, A a C** (el "Cómo probarlo" completo): la fecha de entrega no puede ser futura; un viaje con gastos
   del chofer que volvió a Registrado tiene Eliminar gris con "No se puede eliminar el viaje: tiene gastos cargados"; la
   evidencia de un directo no se adjunta en Registrado.
2. **§41, punto 22, E (Cancelado)**, pasos 2 a 7 (el 1 es el script, ya corrido). Además, con lo que cambió al integrar
   a Fede (§58):
   - En la fila no hay un botón "Cancelar": se cancela desde Cambiar estado (la banderita), con motivo.
   - Un viaje que viene de un presupuesto: Eliminar gris con "No se puede eliminar el viaje: viene del presupuesto #N". Desde
     la consola, `DELETE api/Viajes/{id}` de ese viaje responde "No se puede eliminar el viaje: viene del presupuesto
     #N.", y el de uno En viaje, "No se puede eliminar el viaje: está en viaje.".
   - El aviso por WhatsApp al cancelar y la hoja de ruta al reactivar ya están hechos: se miran en la ronda 6. Acá alcanza
     con que la opción Cancelado diga "Se le avisa al chofer por WhatsApp." si el viaje tiene chofer.
3. **§41, punto 10 (Sin carga)**, pasos 2 a 7 (el 1 es el script, ya corrido). El 4 (hoja de ruta) puede quedar para la
   ronda 4 y el 7 (nota de crédito) para la ronda 3, con OK de Rocío: anotá dónde se hizo cada uno.
4. **§41, punto 22, D, F y G**, pasos 1 a 3. En F, al cambiar el chofer de un viaje En viaje, el aviso del formulario
   dice además "y a … se le avisa que ya no tiene el viaje." (§58).
5. **[cruce] El flujo completo, para adelante y para atrás** (el profe prueba casos borde): un viaje directo Registrado →
   En viaje → Entregado (con evidencia) → Traer viajes en un borrador de proforma, y volver atrás paso a paso donde se
   pueda. Lo mismo con uno de Rukas (Registrado → Listo para facturar). En cada estado, anotá qué botones de la fila
   quedan habilitados y el motivo de los deshabilitados (orden: Ver detalle · Editar · Reenviar WhatsApp · Cambiar estado
   · Eliminar; Reenviar WhatsApp solo con chofer y en Registrado o En viaje).

### Parte L — Precio por orden del día y camiones y choferes ocupados (§43)

1. **§43, "Cómo probarlo en la VM", pasos 3 a 11** (el 1 y el 2 son de la preparación y la parte A).
2. **[cruce] Con Cancelado:** cancelar el primer viaje del día (en lugar de eliminarlo): la tarjeta Cancelado dice qué
   pasa con el precio del otro y, al guardar, el otro pasa a primero como al eliminarlo. Reactivar el cancelado: vuelve a
   su lugar y el otro, a segundo (o queda para revisar si ya salió).
3. **§41, punto 2 (la tarjeta "Cambios para revisar"):** con algo para revisar, la ven el administrador y quien puede
   resolverlo; un usuario sin Gestionar viajes no la ve. Sin nada para revisar, no aparece.

### Parte M — Tarifas: textos y avisos; tiempo estimado de Google

1. **§40, punto 7, pasos 1 a 6** (M1, M2, M3, M11 y M14, con los textos 12 a 14 de la §41). Con la tabla de prueba, no
   con las reales; si hace falta corregir una tabla con viajes, Rocío dice cuál.
2. **§41, punto 36 (tiempo estimado de Google)**, en Registrar viaje y en Registrar presupuesto. Si Google no responde, ver
   la sección 0.
3. Montos: escribir "12x" en un monto de Gestionar tarifas y en uno de cuenta corriente → "Escribí el importe como
   1.234,56." debajo, sin borrar lo escrito (F5 de la tanda 1).

### Parte Q — Adicionales del viaje de un cliente directo (§60)

Es lo que se muestra el 29/10: si la ronda 2 no termina, **esta parte va antes que la K, la L y la M**.

1. **§60, "Cómo probarlo en la VM", pasos 2 a 9** (el 1 es el script de la sección 0).
2. Además: doble clic en Guardar con adicionales (un solo PUT); cancelar el modal después de agregar uno (no se guarda);
   un comentario de más de 200 caracteres (el campo no deja escribir más); los textos de la lista y de la ayuda, con
   voseo y sin inglés.
3. **[cruce]** El viaje con adicionales en Listar viajes → Ver detalle (igual que en Gestionar viajes) y, en el mismo
   detalle, el margen estimado del control interno calculado con el importe nuevo.

---

## 4. Ronda 3 — Facturación (con OK de Rocío en cada paso que emite o envía)

### Parte E — Tipos de comprobante (Facturación → Gestionar tipos de comprobante)

1. **§47 completa**, con una sigla de prueba que Rocío autorice (no FAC, ND, NC ni REC).
2. **Eliminar (commit del 26/10):** una configuración sin relaciones se elimina; una con comprobantes no ofrece Eliminar
   (excepción del design system) y la API la rechaza desde la consola.
3. **Electrónico:** marcar uno de prueba bloquea todo, en pantalla con el motivo y en la API. **No marques un tipo real.**
4. **[cruce]** Cambiar la sigla o la letra de un tipo con comprobantes: los viajes facturados con esos comprobantes
   siguen viéndose Facturado en Gestionar viajes, y el aviso de cambios para revisar muestra el número nuevo.

### Parte F — Cuenta corriente

Hacé el "Probar en la VM" de cada sección, en este orden, y sumá lo de la sección 1:

1. **§44, emisión directa con tipos configurados**, más:
   - Una sucursal o un numerador inactivos no se ofrecen.
   - Doble clic en Emitir: un solo número.
   - El número que se ve en el detalle, el PDF, la tabla y el e-mail es el mismo, con letra y sucursal.
2. **§48, créditos y débitos internos directos.** El botón "Emitir Débito" con mayúscula es una excepción aceptada; el
   resto de los textos sigue el design system.
3. **§49, crédito sin imputar.** Revisá en particular el cálculo de IVA y otros impuestos con importes con centavos
   ($ 1.234,56) y con 0.
4. **§52, recibo sin imputar.** Además:
   - Anular un recibo con imputaciones posteriores: ¿qué pasa con las deudas? ¿Se entiende el aviso?
   - Imputar un recibo desde dos pestañas a la vez: no tiene que quedar aplicado de más.
5. **§53, débito vinculado**, más: el selector "Comprobante interno relacionado" con muchos comprobantes, ¿se puede usar?
6. **§54:** el concepto "Cobranza sin imputación" con su tilde en la tabla, el detalle, el PDF y el Excel.
7. **§45 y §50, envío por e-mail:** el sobre después de Ver PDF en todas las filas; el pie de Ver PDF sin el envío; la
   casilla "Incluir proforma". Los envíos van **solo a la casilla de prueba** de Rocío.
8. **§51, el orden:** si no se hizo en la parte D.
9. **Comprobantes sin relacionar:** los créditos y recibos con saldo aparecen; al agotarlos, desaparecen.
10. **Botones de las filas:** compará una factura, un recibo, una nota de crédito, un crédito interno, un débito y un
    tipo configurado. Orden, motivos de deshabilitado e Imputar solo donde corresponde.

### Parte G — Proformas

1. **§46, emitir el comprobante desde la proforma y anularlo con el crédito cancelatorio.** Es el circuito más largo:
   anotá cada número y cada estado en una tabla del reporte (proforma, comprobante, crédito, viajes, antes y después).
2. **[cruce]** La proforma tiene que incluir **un viaje Sin carga** (si no hay uno de prueba, preguntale a Rocío). Lo que
   tiene que pasar está en la parte H, punto 1: hacelo acá, con esta proforma.
3. **§50, enviar la proforma por e-mail** desde Listar y Gestionar proformas: deshabilitado en borradores y anuladas con
   el motivo, y con un usuario sin acceso a proformas la API lo rechaza.
4. Una **proforma de plataforma** (Rukas): emitir y anular pasa igual que con una propia.
5. Ranking y tableros: el comprobante y el crédito se reflejan una sola vez.

### Parte P — Lo que quedó de cuenta corriente y de la demo

1. **§29, "Probar en la VM (cuando Rocío lo pida)", pasos 1 a 3:** Ver recibo con solo "Cerrar" en el pie; Editar recibo
   con el título "Editar recibo REC-…" (sin " · ") y el pie Cancelar · Guardar; Registrar recibo con Cancelar · Emitir
   recibo, también después de haber abierto un Ver recibo. Si el REC-00000004 ya no existe, con otro recibo.
2. **§38, arreglos de la demo:** una proforma de Rukas nueva (con un Excel de `docs/pruebas/datos/` que Rocío elija) con
   el adicional en una línea aparte ("Adicional transporte …", sin código de viaje) y el total igual; el comprobante de esa
   proforma con las dos líneas; los textos del control de Rukas con centavos ("$ 429.101,00"); Tableros → Facturación
   con centavos y la tarjeta "Importe promedio por viaje".
3. **[cruce] Sin carga y Cancelado en la facturación:** si no se hizo en la ronda 2, el paso 7 del punto 10 de la §41 (la
   nota de crédito de una factura con un viaje sin carga lo devuelve a Sin carga). Un viaje Cancelado no aparece en Traer
   viajes.

---

## 5. Ronda 4 — Hoja de ruta del chofer y control interno

Con la cuenta del chofer de prueba de la parte C (rol Chofer) y viajes de prueba para ese chofer: uno de un cliente
directo para hoy, otro para mañana, uno de ayer sin iniciar y uno de Rukas. El chofer, desde el celular emulado (390 px);
administración, en la computadora.

### Parte N — Hoja de ruta del chofer (§36 y §41)

1. **§36, "Probar en la VM", pasos 4 a 11**, con lo que cambió desde que se escribió: el chofer no va en un grupo (tiene
   el rol Chofer y su usuario se crea desde Gestionar choferes: los pasos 2 y 3 son la parte C), el menú dice "Hojas de
   ruta" y el paso 11 es con `localhost:5502`. El 0 (script) y el 1 (compilar) ya están.
2. **Los ajustes A a F de la §36.**
3. **§41, punto 4 (Hojas de ruta para administración, en solo lectura):** pasos 1 a 4.
4. **§41, punto 33 (iniciar solo el día del viaje; gastos hasta 2 días después de la entrega; "Cargar gasto" de
   administración):** el "Cómo probarlo en la VM" completo.
5. **§41, punto 35 (el recorrido arranca en el galpón).** Si Google no responde, ver la sección 0.
6. **[cruce]** Un viaje cancelado en la ronda 2: en Anteriores, rojo, con "Este viaje se canceló." y sin botones. Uno
   En viaje → "Registrar sin carga" (§41, punto 10, paso 4), si no se hizo en la ronda 2.
7. **[cruce] La sesión de Facu:** el chequeo de cada minuto no tiene que sacar al chofer mientras carga una entrega o un
   gasto con la sesión vigente. Dejala abierta 3 minutos en medio de un formulario y guardá.

### Parte O — Control interno y galpón (§37 y §41, punto 28)

1. **§37, "Probar en la VM", pasos 3 a 8** (el 0 y el 1 ya están; el 2 lo hizo Rocío). En el 3, los valores que diga
   Rocío.
2. **§41, punto 28 (cambiar el galpón)**, pasos 2 y 3 (el 1 es el script). **Al final, "Anular cambio":** el galpón real
   queda como estaba.
3. **[cruce] Gastos y viajes que no se hacen:** un viaje directo con un gasto del chofer que volvió a Registrado tiene
   Eliminar gris; se puede cancelar, pero en Ver detalle del cancelado no se ven sus gastos. Es un hueco conocido
   (§40, punto 9): confirmalo, no es una falla nueva.

---

## 6. Ronda 5 — Orden de las tablas, cruces y recorrida

### Parte D — Ordenar desde los encabezados

En cada tabla: alternar dos veces cada encabezado ordenable (primer clic ascendente, segundo descendente, la flecha
cambia), cambiar de columna (arranca ascendente), ir a la página 2, filtrar y exportar (CSV, PDF o Excel, lo que tenga):
**el orden se conserva y abarca todos los resultados**, no solo la página. Con el lector de pantalla del navegador (o
mirando `aria-label` y `aria-sort`), el encabezado dice cómo se va a ordenar.

| Pantalla | Columnas ordenables | Además |
|---|---|---|
| Gestionar y Listar clientes | Las tres que tenga | Sin ID |
| Orígenes y destinos | Las que tenga | Sin ID, los filtros por separado |
| Gestionar presupuestos | Las seis | **[cruce]** un presupuesto cuyo viaje está cancelado sigue mostrando el ícono de info con el motivo |
| Gestionar y Listar viajes | Las ocho | **[cruce]** con viajes Cancelado y Sin carga: se ordenan bien, se ven con su color (rojo y azul) y el filtro de estado los trae. Km: 2, 10 y 100 ordenados como números, los vacíos al final |
| Gestionar y Listar proformas | Las cinco | Número vacío (borradores) al final |
| Gestionar cuenta corriente | Las siete | §51: las aplicaciones siguen debajo de su comprobante |
| Gestionar y Listar choferes | DNI, Apellido y nombre, Fecha de alta | §55: DNI por valor (7 y 8 dígitos) |
| Gestionar y Listar camiones | Marca, Fecha de alta | Sin ID |

### Parte H — Cruces con lo nuestro

1. **Viajes y facturación (si no se vio en la ronda 3, con OK de Rocío):**
   - Un viaje **Sin carga** en una proforma: al emitir el comprobante (FC u otro tipo de deuda configurado) pasa a
     Facturado.
   - Con el **crédito interno cancelatorio** de la §46 (no solo con la nota de crédito), vuelve a **Sin carga**, no a
     Entregado.
   - Un viaje Cancelado no aparece para traer a una proforma.
2. **Cambios para revisar con comprobantes que no son FAC:** si un viaje facturado con FC (o con otro tipo de deuda)
   queda para revisar por un cambio de tarifa, el aviso dice "Como está facturado en FC-A-…" con el número completo
   (letra y sucursal), en el viaje, en el dashboard y en el presupuesto. Se ajustó al integrar (`OrdenDelDia.cs`): conviene
   verlo una vez.
3. **Presupuestos:** "Generar viaje" vuelve cuando el viaje del presupuesto está cancelado, también con la tabla ordenada
   por otra columna.

### Parte I — Recorrida general

La recorrida de `docs/equipo/PRUEBAS-VM-CLAUDE.md` §4 (todas las pantallas del menú) con tres usuarios: administrador,
usuario con algunos grupos y chofer. En cada pantalla: abre sin errores en la consola, busca, filtra, pagina y abre sus
modales. Además:

- El menú de cada usuario muestra solo lo que le corresponde, y escribir a mano la dirección de una pantalla que no tiene
  lo devuelve al inicio (al chofer, a Hojas de ruta).
- La tarjeta "Cambios para revisar" del dashboard y los tableros cargan con los tipos de comprobante configurados.
- Gestionar e-mail: los tres perfiles (Facturación, Presupuestos y recupero de contraseña) dicen "Guardar" y, al guardar,
  "Guardando…". No deja asignar el mismo perfil a recupero y a otro uso.

---

## 7. Ronda 6 — WhatsApp en viajes (aparte y al final)

Se hace cuando las rondas 1 a 5 están OK (Rocío, 28/10), con Rocío presente: los mensajes son reales y el número de prueba
de Meta tiene un límite de mensajes por día, así que cada paso se hace una vez.

**Antes de empezar (Rocío, en Meta y en el sistema):**

- **Token del día.** El de prueba vence a las 24 horas: Rocío lo genera en Meta y lo pega en Configuración → Gestionar
  integración de WhatsApp → Guardar. La pantalla dice cuándo y quién guardó por última vez, y Auditoría registra el cambio
  de token (sin mostrarlo). Nadie lo pega en un chat ni en un reporte.
- **Plantillas aprobadas en Meta**, con el nombre, el idioma y las variables que dice la configuración: `viaje_asignado`
  (7), `viaje_cancelado` (6) y `viaje_desasignado` (6), en `es_AR`. Si el idioma de la plantilla en Meta no es el mismo, el
  envío falla.
- **Dos choferes de prueba con celulares del equipo** (el de Rocío, por lo menos), cargados en la lista de destinatarios
  del número de prueba de Meta: solo a esos números les llega. En CHOFERES el celular va con 10 dígitos (área sin 0 y
  número sin 15); el sistema lo arma como lo registra Meta (54, área, 15 y número).

### Parte J — WhatsApp en viajes (rama de Fede, §58)

Viajes de prueba nuevos, con los choferes de prueba de arriba y con el OK de Rocío antes de cada envío. Si un envío falla,
el viaje se guarda igual y el aviso dice "… Avisale por otro medio.": anotá el error de `App_Data/whatsapp.log` y seguí.
Cada envío queda en ese archivo con su plantilla.

1. **Configuración → Integración de WhatsApp:** abre y muestra las tres plantillas (`viaje_asignado`, `viaje_cancelado`,
   `viaje_desasignado`), con sus variables abajo (7, 6 y 6). Guardar conserva lo que había.
2. **La fila de Gestionar viajes:** Ver detalle · Editar · Reenviar WhatsApp · Cambiar estado · Eliminar. No hay botón
   "Cancelar". Reenviar WhatsApp habilitado solo con chofer y el viaje Registrado o En viaje; si no, deshabilitado con
   "No se puede reenviar el WhatsApp: el viaje está entregado" (o el estado que tenga) o "…: el viaje no tiene chofer
   asignado" (un viaje de Rukas sin chofer).
3. **Reenviar:** la confirmación nombra al chofer ("Se le envía a … la hoja de ruta del viaje #N."). Cancelar no manda
   nada; Reenviar dice "Se le envió la hoja de ruta al chofer por WhatsApp." y llega al celular.
4. **Cancelar** desde Cambiar estado: la opción Cancelado agrega "Se le avisa al chofer por WhatsApp."; con el motivo, "Viaje
   #N cancelado." y "Se le avisó al chofer por WhatsApp que el viaje se canceló.". Llega el mensaje de cancelado.
5. **Reactivar** ese viaje (Cambiar estado → Registrado): la opción dice "Se le reenvía la hoja de ruta al chofer por
   WhatsApp." y al guardar llega la hoja de ruta.
6. **Cambiar el chofer** de un viaje Registrado: antes de guardar, "Al guardar, … recibe la hoja de ruta por WhatsApp y a …
   se le avisa que ya no tiene el viaje."; al guardar, "Viaje guardado.", "Se avisó al chofer anterior por WhatsApp." y la
   hoja de ruta al nuevo. Repetir con un viaje En viaje (pide motivo). Para esto hacen falta los dos choferes de prueba.
7. **Eliminar** un viaje Registrado con chofer: la confirmación dice "No se puede deshacer. Se le avisa al chofer por
   WhatsApp que el viaje no se hace."; después de "Viaje eliminado." llega el aviso. **[cruce]** Un viaje con gastos del
   chofer (directo, que estuvo En viaje y volvió a Registrado) no se elimina y al chofer **no** le llega nada.
8. Lo que no cambió: registrar un viaje con chofer sigue mandando la hoja de ruta, y cancelar un viaje de un presupuesto
   sigue dejando "Generar viaje" habilitado en el presupuesto.

---

## 8. Reporte

Con el formato de `docs/equipo/PRUEBAS-VM-CLAUDE.md` §5, uno por ronda, más:

- En "Resultados", una fila por punto de cada parte, con la sección de PENDIENTES (§29, §36, §37, §40, §41, §43, §44 a §58) o **[cruce]**.
- Una sección **"Design system"** con los desvíos de la sección 1.2: pantalla, qué punto de la lista de control, qué se
  ve y qué pide la regla. Separada de "Fallas" y de "Mejoras sugeridas".
- En "Datos de prueba creados o modificados", también **la configuración de facturación que se tocó**, con su estado
  antes y después.
- Lo que no se pudo probar (falta el SMTP, un permiso que no se puede armar sin SQL, un tipo que Rocío no autorizó),
  como NO PROBADO y por qué.
