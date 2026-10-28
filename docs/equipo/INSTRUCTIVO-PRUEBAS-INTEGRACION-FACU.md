# Instructivo de pruebas de la integración con Facu (para la VM)

Para la sesión de Claude Code que prueba en la VM. El 28/10 se integró `facugodoy` (39 commits del 26 al 28/10) en
`rocionuvoli`, encima de lo de viajes, tarifas, hoja de ruta y choferes de esos días. Antes de pasar todo a `main` y a las
ramas de Facu y Fede, esta tanda tiene que confirmar tres cosas:

1. **Que lo de Facu funciona**, incluidos los casos que no figuran en su "Probar": errores, permisos, doble clic, datos
   que faltan, lo que pasa en otra pantalla.
2. **Que las dos partes funcionan juntas**: los cruces entre lo de Facu y lo nuestro están en la parte H y marcados con
   **[cruce]** en las demás.
3. **Que todo cumple el design system** (`docs/design-system/03-decisiones.md` y la lista de control de `AGENTS.md`), con
   la mirada de usabilidad de la sección 1.

**Las reglas de la sesión, los datos de prueba y el formato del reporte son los de `docs/equipo/PRUEBAS-VM-CLAUDE.md`:
leelo antes.** Lo que Facu ya escribió para probar cada tema está en las §44 a §57 de `docs/PENDIENTES-SISTEMA.md`; acá se
remite a esas secciones y se agrega lo que falta.

La tanda es larga: se hace en **tres rondas**, cada una con su reporte. Si una ronda no termina en una sesión, el reporte
dice hasta dónde llegó.

| Ronda | Partes | Toca la base |
|---|---|---|
| 1 | A (compilación y pruebas automáticas), B (login, sesión y recupero), C (usuarios, grupos y permisos) | Usuarios y un grupo de prueba |
| 2 | D (orden de las tablas), H (cruces con lo nuestro), I (recorrida general) | Casi nada (lo de H, con OK de Rocío) |
| 3 | E (tipos de comprobante), F (cuenta corriente), G (proformas) | **Emite comprobantes y cambia la configuración de facturación: con OK de Rocío** |

Reportes: `C:\pruebas-sgtl\reportes\AAAA-MM-DD-integracion-facu-ronda-N.md`.

---

## 0. Antes de empezar (lo hace o lo confirma Rocío)

- **Scripts de Facu en la base.** La API integrada ya lee `USUARIOS.Email` y `USUARIOS.VersionSesion`: si
  `database/seguridad/02_recupero_contrasena.sql` no está corrido, **el login falla**. Rocío confirma con Facu cuáles corrió y
  corre los que falten, en este orden: `cuenta-corriente/11` a `17`, `seguridad/02` y `email/07`. El `cuenta-corriente/18`
  (corrige acentos de recibos viejos) y `documentacion/02` (manual) son de datos y terminan en ROLLBACK: se deciden aparte.
- La VM en `rocionuvoli` con el último commit (`git log --oneline -1`), la API **recompilada con Recompilar solución**
  (no alcanza con ejecutar) y Ctrl+F5 en el navegador.
- **Usuarios** (el login lo hace Rocío):
  - un administrador;
  - uno con rol Usuario que solo tenga "Listar usuarios";
  - uno con rol Usuario sin ningún permiso de usuarios;
  - uno con acceso a proformas y sin cuenta corriente;
  - la cuenta del chofer de prueba de `docs/equipo/INSTRUCTIVO-CUENTAS-CHOFERES.md`, si ya existe (si no, se crea en la
    parte H).
- **Recupero de contraseña:** un perfil SMTP de prueba cargado por Rocío en Gestionar e-mail (las credenciales las escribe
  ella) y una casilla real del equipo para recibir los enlaces (`@example.com` no recibe). Rocío dice cuál.
- **Ronda 3:** Rocío dice qué tipos de comprobante se pueden activar o desactivar, con qué cliente de prueba se emite y
  si los números que se consuman (FC, C, D, recibos) le sirven. Anotá **el estado inicial de cada tipo** que toques: al
  final tiene que quedar igual. Facu y Fede, avisados de que durante la ronda 3 cambia la configuración de facturación.

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
  e-mail · Cambiar estado · Siguiente paso · Activar/Inactivar · Eliminar/Anular. Lo que no se puede hacer queda
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

1. Recompilar la solución: **cero errores**. Copiá las advertencias nuevas que mencionen archivos de esta integración
   (`UsuariosController`, `AutenticacionController`, `ComprobantesController`, `RecuperoContrasenaController`,
   `Security\*Recupero*`, `ChoferesController`, `HojaDeRutaController`). En la Mac no se pueden compilar: **si hay
   errores, pará y pasáselos a Rocío.**
2. En una terminal, en `C:\Repo\SGTL`, correr cada `node tests\<archivo>.test.js`: todos tienen que imprimir `OK`. En la
   Mac no se pudieron correr estos once, que usan PowerShell y son de Facu: `comprobantes-tipos-directos-email`,
   `debito-interno-referencia-api`, `envio-proforma-adjuntos`, `orden-clientes-backend`, `orden-cuenta-corriente-backend`,
   `orden-proformas-backend`, `orden-viajes-backend`, `recibos-concepto-codificacion`, `recibos-imputacion-api`,
   `recupero-contrasena`, `reintento-credito-cancelatorio`. Por cada uno que falle, el mensaje completo.
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
6. **Chofer [cruce]:** con la cuenta del chofer, entrar desde el celular (390 px): va directo a Hojas de ruta. Con la
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
6. Datos creados: el usuario de prueba y el grupo, con ID y nombre para la limpieza.

---

## 3. Ronda 2

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

1. **Gestionar choferes, el usuario del chofer** (`docs/PENDIENTES-SISTEMA.md`, §41, puntos 30 y 31, pasos 6 a 8 del
   "Cómo probarlo"):
   - Registrar chofer: el E-mail con asterisco. Sin e-mail: "Completá el e-mail.". Con el de otro usuario: "Ese e-mail ya
     está registrado en otro usuario." debajo del campo.
   - Guardar con un e-mail nuevo: en Listar usuarios → Ver detalle, el usuario nuevo tiene ese e-mail, rol Chofer y su
     chofer. En Auditoría: "…, Email: ninguno -> …".
   - Editar un chofer viejo sin usuario: sin completar el acceso guarda aunque no tenga e-mail; completando el acceso,
     pide el e-mail.
   - Es el chofer de la demo: preguntale a Rocío qué celular usar y si este reemplaza al de
     `INSTRUCTIVO-CUENTAS-CHOFERES.md`.
2. **Viajes y facturación (ronda 3 o con OK de Rocío):**
   - Un viaje **Sin carga** en una proforma: al emitir el comprobante (FC u otro tipo de deuda configurado) pasa a
     Facturado.
   - Con el **crédito interno cancelatorio** de la §46 (no solo con la nota de crédito), vuelve a **Sin carga**, no a
     Entregado.
   - Un viaje Cancelado no aparece para traer a una proforma.
3. **Cambios para revisar con comprobantes que no son FAC:** si un viaje facturado con FC (o con otro tipo de deuda)
   queda para revisar por un cambio de tarifa, el aviso dice "Como está facturado en FC-A-…" con el número completo
   (letra y sucursal), en el viaje, en el dashboard y en el presupuesto. Se ajustó al integrar (`OrdenDelDia.cs`): conviene
   verlo una vez.
4. **Hojas de ruta** con la sesión de Facu: el chequeo de cada minuto no tiene que sacar al chofer mientras carga una
   entrega o un gasto con la sesión vigente. Dejala abierta 3 minutos en medio de un formulario y guardá.
5. **Presupuestos:** "Generar viaje" vuelve cuando el viaje del presupuesto está cancelado, también con la tabla ordenada
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

## 4. Ronda 3 (con OK de Rocío en cada paso que emite o envía)

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
2. **[cruce]** La proforma tiene que incluir **un viaje Sin carga** (si no hay uno de prueba, preguntale a Rocío). Ver
   la parte H, punto 2.
3. **§50, enviar la proforma por e-mail** desde Listar y Gestionar proformas: deshabilitado en borradores y anuladas con
   el motivo, y con un usuario sin acceso a proformas la API lo rechaza.
4. Una **proforma de plataforma** (Rukas): emitir y anular pasa igual que con una propia.
5. Ranking y tableros: el comprobante y el crédito se reflejan una sola vez.

---

## 5. Reporte

Con el formato de `docs/equipo/PRUEBAS-VM-CLAUDE.md` §5, uno por ronda, más:

- En "Resultados", una fila por punto de cada parte, con la sección de PENDIENTES (§44…§57) o **[cruce]**.
- Una sección **"Design system"** con los desvíos de la sección 1.2: pantalla, qué punto de la lista de control, qué se
  ve y qué pide la regla. Separada de "Fallas" y de "Mejoras sugeridas".
- En "Datos de prueba creados o modificados", también **la configuración de facturación que se tocó**, con su estado
  antes y después.
- Lo que no se pudo probar (falta el SMTP, un permiso que no se puede armar sin SQL, un tipo que Rocío no autorizó),
  como NO PROBADO y por qué.
