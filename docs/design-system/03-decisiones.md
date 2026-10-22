# Design system de SGTL — decisiones

Reglas que valen para **todas** las pantallas, nuevas o tocadas. Salen de repasar con Rocío
las propuestas de `01-relevamiento-codigo.md` (§6) con las capturas de la VM a la vista
(`docs/pruebas/2026-10-17-capturas-ui.md`). Si una pantalla necesita apartarse de una regla,
se anota acá como excepción.

Estado: **decidido** (17/10/2026), falta aplicarlo. Lo que no está acá no se decidió.

Proformas, cuenta corriente y configuración de facturación y e-mail son de **Facu**, y
WhatsApp de **Fede**: aplicar estas reglas en esas pantallas se coordina con ellos.

---

## 1. Botones

### 1.1 Botón de alta

- **Verde** (`btn btn-success`).
- **Ícono "+" y el verbo "Registrar" en infinitivo con lo que se crea:**
  `<i class="bi bi-plus-lg"></i> Registrar chofer`, "Registrar proforma", "Registrar recibo"
  (lista completa en §6.1). Nada de botones de alta solo con íconos, ni "Alta", ni "Nuevo…".
  Con el texto a la vista no lleva tooltip.
- **Arriba a la derecha, en la misma línea que el título de la pantalla.** Es el último botón de
  esa línea (el de más a la derecha).
- **Excepción, pantallas con pestañas** (tarifas, orígenes y destinos, grupos y permisos): el
  botón va dentro de cada pestaña, arriba a la derecha de su tabla, porque cada pestaña crea
  algo distinto.

### 1.2 Botón de exportar

- **Solo el ícono de descarga, gris con borde** (`btn btn-outline-secondary`,
  `<i class="bi bi-download"></i>`), con tooltip **"Exportar"** en todas las pantallas y
  `aria-label="Exportar"`. Es secundario: no lleva texto para no competir con el alta.
- **A la izquierda del botón de alta**, en la misma línea del título. Si la pantalla no tiene
  alta, queda él solo a la derecha.
- **Exporta todo lo que coincide con los filtros**, nunca solo la página que se está viendo.
- **Formato:** choferes, camiones, clientes y viajes bajan el CSV directo. Proformas y cuenta
  corriente siguen con su modal (Excel, PDF, imprimir). Pasar las primeras al modal queda para
  después.

### 1.3 Buscar y borrar filtros

- **"Buscar" gris claro con lupa** (`btn btn-light`, `<i class="bi bi-search"></i> Buscar`), al
  final del bloque de filtros, alineado a la derecha. No es la acción principal de la pantalla.
- **No hay botón "Limpiar" general.** Se saca de gestión de viajes, las dos de proformas,
  auditoría y cuenta corriente.
- **Cada filtro se borra con su propia cruz:** campos de texto, fechas, desplegables y el
  buscador de clientes muestran una cruz a la derecha **solo cuando tienen valor**. La cruz deja
  el campo vacío (o en "Todos") y **vuelve a buscar sola**. No vuelve a un valor por defecto: en
  cuenta corriente, borrar la fecha deja "sin límite", no "últimos 30 días".
- Las casillas no llevan cruz. (El filtro de estado deja de ser casillas: ver §3.3.)
- **Enter en cualquier filtro busca**, en todas las pantallas.
- La cruz se arma una sola vez en el JS compartido; las pantallas solo marcan qué campos son
  filtros. Bootstrap no la trae y no hace falta sumar librerías.

### 1.4 Acciones de cada fila

- **Solo ícono, chico, con borde y tooltip** (`btn btn-sm btn-outline-…`). Nada de botones con
  texto ("Editar", "Más detalles") ni rellenos de color en las filas.
- **Un ícono y un color por tipo de acción, siempre en este orden de izquierda a derecha:**

| Acción | Ícono | Clase |
|---|---|---|
| Ver detalle | `bi-eye` | `btn-outline-secondary` |
| Editar | `bi-pencil` | `btn-outline-primary` |
| Descargar PDF | `bi-file-earmark-pdf` | `btn-outline-secondary` |
| Cambiar estado (presupuestos; viajes, más adelante) | `bi-flag` | `btn-outline-secondary` |
| Siguiente paso del circuito (Estado y entrega, Marcar aceptada, Emitir factura) | el de cada acción | `btn-outline-success` |
| Activar / Inactivar | `bi-toggle-on` (está activo) / `bi-toggle-off` (está inactivo) | `btn-outline-secondary` |
| Eliminar / Anular | `bi-trash` / `bi-x-circle` | `btn-outline-danger`, siempre la última |

- El tooltip dice la acción con verbo: "Ver detalle", "Editar", "Inactivar", "Eliminar".
- **Si una acción no se puede hacer en esa fila, aparece deshabilitada y el tooltip dice por
  qué** ("No es posible eliminar un chofer activo"). No se oculta: así todas las filas tienen los
  mismos botones en el mismo lugar.
- **Cambiar estado** (banderita, en prueba desde el 22/10 en presupuestos): va antes del siguiente paso y abre la
  ventana "Cambiar estado", que muestra el estado actual y los estados a los que puede pasar como tarjetas, cada
  una con una línea que explica qué significa; Cancelar + Guardar. La idea es usar la misma ventana en viajes.
- El "siguiente paso" ocupa un solo lugar y cambia según el estado (en proformas: Marcar
  aceptada → Emitir factura). Si no hay siguiente paso, ese lugar queda deshabilitado con el
  motivo.
- Esto reemplaza: la "i" azul de los listados y "Más detalles" (pasan a ojo), las flechas,
  el muñequito amarillo, "Inactivar" con texto y la bandera (pasan a interruptor o a
  siguiente paso, según corresponda).

### 1.5 Tooltips

- Todo botón de solo ícono lleva tooltip con el globito de Bootstrap (no el `title` suelto del
  navegador) y `aria-label` con el mismo texto.
- Se inicializan una sola vez desde el JS compartido, también para las filas que se dibujan
  después; las pantallas no los inicializan por su cuenta.

---

## 2. Tablas

### 2.1 Cómo se ven

- **Rayada y con resaltado al pasar el mouse:** `table table-striped table-hover`.
- **Alineación según el tipo de dato:**
  - texto (nombres, razón social, origen, concepto) y códigos (DNI, CUIT, dominio, remito,
    número de proforma o comprobante): a la izquierda;
  - cantidades y montos (km, total, cancelado, saldo, tarifa): a la derecha (`text-end`);
  - fechas, estado y acciones: centrados (`text-center`);
  - el título de cada columna se alinea igual que su contenido.
- **Tablas anchas** (gestión de viajes): la columna de acciones queda **fija a la derecha** y
  siempre visible; lo que se desplaza hacia el costado son los datos. Fechas, números y estados
  no se parten en dos renglones (`text-nowrap`).

### 2.2 Qué muestran

- **Sin resultados, solo dos textos:**
  - pantallas con filtros: "No hay resultados para los filtros elegidos.";
  - pantallas sin filtros: "Todavía no hay … cargados." con lo que corresponda ("Todavía no hay
    tarifas fijas cargadas.").
  - Sin resultados, la paginación no se muestra.
- **Mientras busca:** una fila "Cargando…" centrada en gris dentro de la tabla, en todas las
  pantallas. Reemplaza lo que había hasta que llega la respuesta.
- **Un solo contador:** el de la paginación ("1-15 de 577"). Nada de "N resultados" aparte.
- **Paginación** (`PaginacionSGTL`) en toda tabla que pueda pasar de 15 filas, también tarifas,
  orígenes y destinos y grupos. Las tablas de configuración (facturación, e-mail) no se paginan.
- **Columnas:** si la pantalla filtra por estado, la tabla muestra la columna Estado. La columna
  de acciones siempre se titula "Acciones".

---

## 3. Encabezado de pantalla y filtros

### 3.1 Menú y título

- **Las subopciones del menú empiezan con un verbo en infinitivo** (pedido de la profesora). Los ítems
  principales sin subopciones (Dashboard, Auditoría) y los nombres de sección (Choferes, Configuración…)
  son sustantivos (cambio del 20/10). El **título de la pantalla es igual al ítem del menú**, con
  mayúscula solo al principio.
- Cambios de nombre (menú y título):

| Hoy en el menú | Hoy en el título | Pasa a |
|---|---|---|
| Listar proformas | Listar proformas generadas | Listar proformas |
| Cuenta corriente | Cuenta Corriente de Clientes | Gestionar cuenta corriente |
| Configuración → Facturación | Configuración de Facturación | Gestionar facturación |
| Configuración → E-mail | Configuración de E-mail | Gestionar e-mail |
| Configuración → Gestión de contenido | Gestionar contenido | Gestionar contenido |
| Configuración → Integración WhatsApp | Integración WhatsApp | Gestionar integración de WhatsApp |
| Auditoría | Auditoría del sistema | Auditoría (ítem principal, sin verbo; 20/10) |
| Viajes → Presupuestos | Gestionar presupuestos | Gestionar presupuestos (20/10) |
| Documentación → Manual de usuario | Manual de usuario | Consultar manual de usuario (20/10) |
| Documentación → Informe de versión | Informe de versión | Consultar informe de versión (20/10) |

- **Ítems principales:** "Dashboard" y "Auditoría" quedan sin verbo.
- Los permisos del menú se resuelven por el archivo de cada pantalla (`sidebar-loader.js`), no
  por el texto: renombrar no cambia quién ve qué.

### 3.2 Encabezado

- **Ícono de la sección del menú** a la izquierda del título, el mismo que tiene la sección en
  el menú (`bi-truck` en camiones, `bi-gear` en configuración).
- **Subtítulo de una línea en todas las pantallas**, que diga para qué sirve. Ejemplo: "Solo
  proformas ya generadas; los borradores están en Gestionar proformas".
- A la derecha, en la misma línea: exportar y después el alta (§1.1 y §1.2).
- **Pestaña del navegador:** nombre de la pantalla y la sigla del sistema: `<title>Gestionar choferes · SGTL</title>`. El login lleva el nombre completo: `SGTL · Sistema de Gestión de Transporte y Logística`. Transporte Sánchez es el cliente, no el sistema (cambio del 20/10; antes era "· Transporte Sánchez").

### 3.3 Filtros

- **Grilla a todo el ancho, sin recuadro propio** (la tarjeta ya es el recuadro): el texto
  arriba de cada campo (`form-label` con `for`), varios campos por fila, y "Buscar" al final de
  la última fila, a la derecha. Como auditoría.
- **Estado como desplegable** "Activo / Inactivo / Todos", con Activo elegido al entrar. La cruz
  lo pasa a "Todos" (§1.3). Reemplaza las dos casillas Activo / Inactivo.

---

## 4. Estados (etiquetas)

### 4.1 Un color, un significado

| Color | Significa | Estados |
|---|---|---|
| Gris | Inicial, borrador o inactivo | Registrado, Borrador, Inactivo, Inicio de sesión, Cierre de sesión |
| Azul | En curso | En viaje, Entregado, Generada, Modificación (auditoría) |
| Amarillo | Falta algo para cerrar | Listo para facturar, Aceptada (lista para facturar), Parcial, Km manual; en el dashboard (21/10): Atrasado, Sin salir, Sin cerrar, Sin proforma, Sin evidencia, Por vencer (ITV) |
| Verde | Terminado bien o activo | Activo, Facturado / Facturada, Cancelado, Aplicado, Alta |
| Rojo | Anulado, dado de baja, deuda o entrega rechazada | Anulada, Baja, Pendiente (deuda), Rechazo (resultado de la entrega, 21/10), Vencida (ITV, 21/10) |

- Un estado nuevo se ubica en una de estas filas por lo que significa; no se inventan colores.
- **Presupuestos (22/10, en prueba):** Pendiente es esperar la respuesta del cliente, no una deuda: va en gris.
  Aceptado va en amarillo mientras falta generar el viaje y en verde cuando ya se generó (con la etiqueta
  informativa "Viaje #N"); Rechazado, en rojo. Para estos casos `SGTL.estado(valor, texto, color)` recibe el color.
- El mapa vive en el JS compartido (una sola función que recibe el estado y devuelve la
  etiqueta); las pantallas no arman su propio mapa de colores.

### 4.2 Nombres

- Clientes muestra **Activo / Inactivo** (no Habilitado / Deshabilitado).
- Auditoría muestra **Inicio de sesión / Cierre de sesión** (no Login / Logout).
- Es solo lo que se ve: los valores guardados en la base no cambian.

### 4.3 Estilo

- **Colores suaves con bordes redondeados y el texto del mismo color**, como cuenta corriente
  hoy. Las clases `bg-light-*` de Mazer no sirven: ponen el texto casi negro y los estados se
  distinguen menos. Van en el CSS compartido, con estos colores (los verde, amarillo y rojo son
  los de cuenta corriente):

| Clase | Fondo | Texto |
|---|---|---|
| `badge rounded-pill estado-gris` | `#eef0f2` | `#5c636a` |
| `badge rounded-pill estado-azul` | `#e8ecf9` | `#435ebe` |
| `badge rounded-pill estado-amarillo` | `#fff3cd` | `#a36a00` |
| `badge rounded-pill estado-verde` | `#e8f6ef` | `#198754` |
| `badge rounded-pill estado-rojo` | `#fcebed` | `#dc3545` |

- **Etiquetas informativas** que no son un estado ("En PF-00000006" en viajes): blancas con borde
  gris, sin color (`badge rounded-pill bg-white text-dark border`).

---

## 5. Avisos y confirmaciones

### 5.1 Avisos

- **Éxito:** aviso arriba a la derecha (tarjeta blanca con tilde verde, §12) que **se va solo a los 4 segundos**. Texto corto,
  sin signos de exclamación: "Chofer guardado.", "Proforma generada: PF-00000010."
- **Error:** aviso arriba a la derecha (tarjeta blanca con ícono rojo, §12) que **no se va solo**: queda hasta que se cierra.
  Dice qué pasó y, si se sabe, qué hacer: "No se pudo guardar el chofer. Revisá la conexión y
  probá de nuevo."
- **Error con un modal abierto** (por ejemplo, el servidor rechaza el guardado): el mensaje va
  **dentro del modal**, arriba, en rojo, sin cerrarlo, para no perder lo cargado.
- **Nunca `alert()`.**
- Los mensajes fijos de ayuda dentro de la página o del modal ("Guardar no realiza ninguna
  prueba de conexión SMTP…") se quedan: son notas, no avisos.
- Una sola función compartida para los toasts (en el JS compartido), que no dependa de
  `window.bootstrap` (bug F5). Las pantallas no tienen su propio HTML ni su propia copia.

### 5.2 Confirmaciones

- **Un único modal de confirmación compartido**, nunca `confirm()` ni `prompt()`:
  - título con la pregunta concreta: "¿Eliminar el chofer Juan Pérez?";
  - una línea con la consecuencia: "No se puede deshacer.";
  - botones "Cancelar" (gris) y **el verbo de la acción** ("Eliminar", "Anular", "Generar",
    "Enviar"), en rojo si destruye o anula;
  - si hace falta un motivo (anular), se pide en un campo obligatorio dentro del mismo modal.
- **Qué pide confirmación:** solo lo que no se puede deshacer o tiene efectos afuera del
  sistema: eliminar, anular, generar proforma (consume un número), emitir factura, enviar por
  mail o WhatsApp.
- **Activar / inactivar no pide confirmación:** se hace y avisa con el toast de éxito.

---

## 6. Modales y formularios

### 6.1 Verbos

Todo botón, tooltip y título de modal dice la acción con **verbo en infinitivo**, igual que el
menú (§3.1). El título del modal es el mismo texto que el botón que lo abrió.

| Dónde | Texto |
|---|---|
| Botón de alta y título de su modal | "Registrar chofer", "Registrar camión", "Registrar viaje", "Registrar cliente", "Registrar usuario", "Registrar grupo", "Registrar origen" / "Registrar destino", "Registrar tarifa fija" / "Registrar tarifa por km", "Registrar proforma", "Registrar recibo", "Registrar configuración de e-mail" |
| Editar (tooltip y título del modal) | "Editar camión" |
| Ver detalle | tooltip "Ver detalle"; título del modal "Ver detalle del camión" |
| Pie de los modales | "Cancelar", "Guardar", "Eliminar", "Generar", "Emitir recibo", "Cerrar" |
| Acciones de la fila | "Inactivar", "Activar", "Descargar PDF", "Marcar como aceptada", "Emitir factura", "Exportar" |
| Confirmación | "¿Eliminar el camión ABC123?" |

- "Registrar proforma" crea el borrador; "Generar" le asigna el número. "Registrar recibo" abre el
  formulario; el botón del pie es "Emitir recibo".

### 6.2 Modales

- **Encabezado:** título `h5` (`modal-title`) y la cruz de Bootstrap (`btn-close`) siempre
  visible arriba a la derecha. Nada de íconos Feather (no se cargan y la cruz queda invisible).
- **Pie:** "Cancelar" gris claro (`btn btn-light-secondary`) y, a su derecha, el botón principal
  con el verbo: "Guardar" (`btn-primary`) en alta y edición, "Eliminar" / "Anular" en rojo
  (`btn-danger`), "Generar", "Emitir recibo". **Nunca "Confirmar".**
- **Detalle:** solo "Cerrar" en el pie, además de la cruz.
- **Los formularios no se cierran con un clic afuera** (`data-bs-backdrop="static"`); Escape y la
  cruz sí los cierran. Los de detalle se cierran también con un clic afuera.
- **Tamaño según el contenido:** `modal-lg` para formularios comunes; `modal-xl` solo con mapa o
  tablas (viajes, proformas, recibo); el tamaño por defecto para confirmaciones.

### 6.3 Formularios

- **Obligatorios:** asterisco rojo al lado del nombre del campo (`<span class="text-danger">*</span>`).
- **"Guardar" siempre habilitado.** Al tocarlo con errores:
  - arriba del formulario, un aviso corto en rojo: "Revisá los campos marcados.";
  - cada campo con problema en rojo (`is-invalid`) con su mensaje debajo
    (`invalid-feedback`): "Completá el DNI.", "El DNI tiene que tener 7 u 8 números.";
  - el cursor va al primer campo con error.
- **Cada campo se valida al salir de él**, no en cada tecla, y el rojo se va apenas se corrige.
- **Opción vacía de los desplegables:** "Seleccioná un cliente" (voseo).
- **Ayudas:** el texto gris dentro del campo es un ejemplo ("30111222"); las instrucciones van
  debajo, en chico (`form-text`): "Sin puntos ni espacios".
- **Formularios largos** divididos en bloques con subtítulo, como el recibo ("Datos generales",
  "Forma de pago").
- `form-label` con `for` en todos los campos (tocar el nombre lleva al campo).

---

## 7. Fechas y montos

La zona horaria (de dónde sale "la hora actual") es otro tema: §2 de `docs/PENDIENTES-SISTEMA.md`.
Esto define solo cómo se muestran y cómo se cargan.

### 7.1 Selector de fecha

- **Uno solo: flatpickr** (local, `assets/extensions/flatpickr/`) **en español**
  (`l10n/es.js`: semana desde el lunes). Se sacan daterangepicker y moment (CDN), y el
  `type="date"` del navegador de cuenta corriente.
  **Excepción (22/10):** moment sigue cargado solo en el dashboard, porque lo necesita FullCalendar 3
  (calendario de próximos viajes); no se usa para fechas propias.
- **Se ve y se escribe DD/MM/AAAA**; con hora, **DD/MM/AAAA HH:MM en 24 h**. A la API se le sigue
  mandando AAAA-MM-DD (`altInput: true`, `altFormat: 'd/m/Y'`, `dateFormat: 'Y-m-d'`): la API
  no cambia.
- **Rango en los filtros: un solo campo** "Desde y hasta" con `mode: 'range'` y `showMonths: 2`.
  Se ve "01/10/2026 a 17/10/2026". Al cerrar el calendario con las dos fechas elegidas, busca (como los
  desplegables, que buscan al elegir); también busca con Buscar o Enter. (Cambio del 22/10: antes no buscaba solo.)
  Se borra con la cruz (§1.3).
- Los textos de ayuda y los errores dicen DD/MM/AAAA (corrige R3).

### 7.2 Fechas en tablas y detalles

- Siempre **DD/MM/AAAA con ceros** ("05/07/2026", no "5/7/2026" ni "2026-07-05").
- Con hora: **"17/10/2026 21:29"** (24 h, sin "p. m."). En auditoría, con segundos:
  "17/10/2026 21:29:06".
- Una sola función de formato en el JS compartido.

### 7.3 Montos y cantidades

- **"$ 1.234,56":** `$`, espacio, puntos de miles, coma decimal, **siempre dos decimales**
  (`Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`). A la derecha en las
  tablas (§2.1).
- **Excepción:** los indicadores del tablero se redondean a pesos ("$ 133.103").
- **Km con coma decimal y un decimal:** "17,4".
- Una sola función de formato en el JS compartido.

---

## 8. Carga y guardado

- **Al entrar a una pantalla:** el indicador de carga de pantalla completa (`#loading-message`),
  con su estilo en el CSS compartido (hoy está copiado en cada `<style>`).
- **Mientras busca:** "Cargando…" dentro de la tabla (§2.2).
- **Al guardar** (o generar, emitir, enviar): el botón principal se deshabilita, muestra una
  ruedita (`spinner-border spinner-border-sm`) y el verbo en gerundio ("Guardando…",
  "Generando…", "Emitiendo…", "Enviando…") hasta que llega la respuesta. Mientras tanto,
  "Cancelar" y la cruz del modal también quedan deshabilitados. Evita el doble clic (F10).
- **Botones de las filas** (Inactivar, Marcar como aceptada…): deshabilitados mientras procesan.

---

## 9. Textos

- **Siempre voseo:** "Completá", "Seleccioná", "¿Querés eliminar…?", "Probá de nuevo". Nada de
  usted ("Seleccione", "Inténtelo", "¿Está seguro…?") ni tuteo ("deseas", "intenta").
- **Mayúscula solo al principio** ("Cuenta corriente de clientes", "Cambiar contraseña") y con
  tildes ("Razón social", "Sánchez", "Ocurrió").
- **Títulos, botones y etiquetas sin punto final; los mensajes, con punto.**
- **Sin inglés a la vista:** "KM mínimo / KM máximo" (no "Min KM / Max KM"), "Alta" (no
  "Alta (INSERT)"), "Inicio de sesión" (no "Login"). En WhatsApp: "Token de acceso" e "ID del
  número de teléfono", con el nombre que usa Meta ("Access Token", "Phone Number ID") en la
  ayuda de abajo para poder encontrarlo. **Excepción:** "Dashboard" queda.
- **Nunca mostrar un error técnico** (excepciones, códigos como "IDX10223…"). El mensaje dice qué
  pasó y qué hacer. Si la sesión venció: "Tu sesión venció. Volvé a iniciar sesión." y se lleva
  al login.

---

## 10. Pantallas chicas y modo oscuro

- **Adaptable, con prioridad en computadora.** Se prueba en cuatro anchos (con las herramientas
  del navegador):

| Ancho | Qué representa | Qué tiene que pasar |
|---|---|---|
| 1920 px | Escritorio | Todo a la vista; solo viajes se desplaza hacia el costado |
| 1366 px | Notebook común | Igual que escritorio |
| 768 px | Tablet vertical | Filtros en dos columnas, tablas con desplazamiento, modales casi a todo el ancho |
| 390 px | Celular | Todo se puede usar: filtros en una columna, tablas con desplazamiento, modales a pantalla completa, calendario de un mes |

- En celular el objetivo es que funcione, no que esté optimizado (las tablas no se convierten en
  tarjetas).
- Los tooltips no aparecen en pantallas táctiles: por eso todo botón de solo ícono lleva también
  `aria-label` (§1.5).
- **Modo oscuro: no.** Se sacan los estilos `theme-dark` sueltos de cuenta corriente.

---

## 11. Marca

- **Color de las acciones: el azul de Mazer** (`#435ebe`, `btn-primary`): Guardar, Editar,
  links, foco de los campos. El **verde** es para crear (`btn-success`, §1.1) y para el
  siguiente paso del circuito (§1.4).
- **El marco** usa los dos colores de Gestionar contenido (hoy verde azulado y verde oscuro):
  - el **color de fondo** es el color de la marca: la pantalla toma un tono muy claro de él y el
    color entero queda en una línea arriba de la barra (cambio del 22/10, §12); en el login pinta
    el panel de la izquierda;
  - el **color del menú** va en la opción elegida del menú, el círculo de las iniciales, el botón del
    login y el subrayado de las pestañas (también las de cuenta corriente, que tenían `#008c9e`).
- **Tipografía: Nunito en todo**, también en el login (cambiado el 22/10; antes Inter).
- **Íconos: solo Bootstrap Icons.** Se sacan Font Awesome (CDN, en login e inicio), Feather y
  Boxicons.
- **Gestionar contenido sigue igual:** logo, pie, color de fondo y color del menú. "Restablecer"
  vuelve a la marca SGTL: logo `assets/static/images/logo/sgtl-logo.png`, fondo `#435ebe` (antes `#e4eef8`: con el
  fondo claro de §12 conviene un color entero), menú `#435ebe` y
  pie `SGTL | un producto de Integra Analistas ®` (el logo se suma el 20/10). El ícono de la pestaña es siempre
  `sgtl-icono.png` (solo "SGTL"), aunque haya otro logo cargado.
  La barra de arriba (usuario y menú) queda en blanco, igual que el menú lateral.
  Debajo de cada color, la pantalla aclara dónde se usa.

---

## 12. Estilo visual

Decidido el 22/10 con el lienzo "Variantes visuales SGTL" (variante B). Todo está en
`assets/static/css/sgtl.css` (sección §12), que cada pantalla carga **después** de `app.css`;
`views/header.html` y `views/footer.html` son fragmentos y no vuelven a cargar la plantilla.
No cambia ningún color de acción (§1, §11) ni de estado (§4.3): cambia el peso.

- **Fondo:** tono muy claro del color de fondo de Gestionar contenido, con el color entero en una
  línea de 4 px arriba de la barra blanca.
- **Tarjetas:** esquinas de 14 px, borde casi invisible y sombra suave. El título de la pantalla
  (primera tarjeta) va en 1,4 rem y negrita fuerte; la bajada, en gris.
- **Tablas:** encabezado chico y gris sobre fondo gris claro, con mayúscula solo al principio (§9);
  filas más bajas, rayado suave y la tabla dentro de un recuadro con esquinas redondeadas.
- **Campos:** 40 px de alto, esquinas de 10 px, etiqueta chica en negrita y borde azul al escribir.
- **Botones:** mismos colores que §1, con menos peso:
  - los rellenos (crear, guardar, eliminar) quedan igual, con una sombra mínima;
  - los grises (`btn-light`, `btn-light-secondary`: Buscar, Cancelar) son blancos con borde fino;
  - los de borde (exportar, acciones de fila) tienen el borde suave y, al pasar el mouse, un fondo
    apenas teñido en lugar de rellenarse;
  - los de solo ícono (los que llevan `aria-label`, §1.5) son cuadrados de la altura de los campos
    (las acciones de fila, de 32 px) y el ícono va en el centro exacto.
- **Avisos dentro de la pantalla** (`.alert`): fondo apenas teñido, borde fino e ícono, con los
  colores de §4.3 (información azul, éxito verde, advertencia amarillo, error rojo).
- **Avisos arriba a la derecha y confirmación:** tarjeta blanca con ícono de color (§5); los modales
  tienen esquinas de 16 px, sin líneas entre título, cuerpo y pie, y el fondo de atrás apenas desenfocado.
- **Pestañas:** subrayadas con el color del menú, sin fondo y con mayúscula solo al principio.
- **Paginador, menús desplegables, buscador de clientes, calendario, listas, barras de progreso y
  globitos de ayuda:** el mismo lenguaje (blanco, borde fino, sombra suave, esquinas redondeadas;
  días del calendario y rango en el azul de las acciones).
- **Pantalla nueva:** no lleva estilos propios de botones, avisos, pestañas ni tablas; usa las clases
  de Bootstrap/Mazer de siempre y `sgtl.css` les da este aspecto.
