# Relevamiento visual y de UX — lectura de código — 17/10/2026

Primer paso para definir el design system de SGTL. Este documento releva **cómo está hecha
hoy cada pantalla** (22 HTML + encabezado, menú y pie compartidos) leyendo el código, sin
cambiar nada.

- **Qué no cubre:** cómo se ven renderizadas (alineaciones, espacios, cortes de texto,
  pantallas chicas). Eso sale de las capturas en la VM: ver `02-instructivo-capturas-vm.md`.
- **Qué falta sumar:** la lista de Rocío de lo que no le cierra como usuaria.
- **Después:** con las tres fuentes se arma `03-decisiones.md` (el design system en sí) y se
  aplica módulo por módulo, empezando por un piloto.

Ya se habían anotado observaciones visuales en la recorrida del 17/10
(`docs/pruebas/2026-10-17-recorrida-general-pre-merge-facu.md`, "Mejoras sugeridas"); acá
están integradas.

---

## 1. Conclusiones

1. **El problema es de estructura, no de detalle.** No hay CSS ni JS de interfaz compartido:
   `css/style.css` existe pero ninguna pantalla lo carga, y cada HTML trae su `<style>` y sus
   funciones de aviso copiadas de otra pantalla. Cada etapa copió lo que tenía a mano y lo
   adaptó, así que conviven tres "familias" visuales (§2).
2. **Lo más visible para el usuario** son cinco cosas: cómo avisa el sistema (cuatro
   mecanismos distintos), las fechas (tres selectores y seis formatos de muestra), los colores
   de estado (el mismo estado tiene distinto color según la pantalla), el tono de los textos
   (voseo, usted y tuteo, a veces en la misma pantalla) y los botones (el mismo botón cambia
   de color y tamaño según la etapa).
3. **La base está bien.** La plantilla Mazer (Bootstrap 5, Nunito, Bootstrap Icons) es la
   misma en todas las pantallas y ya hay piezas centralizadas: menú, encabezado y paginación.
   El design system se arma sobre eso, sin cambiar de plantilla.
4. **Aparecieron bugs que no son visuales** (§7), algunos ya anotados en `PENDIENTES-SISTEMA.md`.

---

## 2. Etapas y familias visuales

| Familia | Cuándo y quién (según git) | Pantallas | Rasgos |
|---|---|---|---|
| **1 — Original** | 2024-09 a 2025-04: Rocío, Facu y Fede | choferes, camiones, clientes, usuarios (gestión y listado), listado-viajes, gestion-viajes (base), grupos y permisos, gestión de contenido | Título "Gestionar X" / "Listar X" sin subtítulo. Filtros dentro de un `fieldset` con borde. "Buscar" gris, sin "Limpiar". Tabla rayada con todo centrado. Alta con botón verde de solo íconos. Modales con título `h4` y cruz de Feather. Toasts arriba a la derecha mezclados con `alert()`. Fechas con daterangepicker DD/MM/AAAA. |
| **2 — Julio 2026** | Commits "Agus" | proformas (gestión y listado), tarifas, orígenes y destinos, auditoría | Subtítulo gris bajo el título (proformas, auditoría). Filtros en grilla, "Buscar" azul chico + "Limpiar". Tabla con hover, texto a la izquierda, montos a la derecha, "Cargando…" en la tabla. Acciones con botones outline de colores. Avisos con `alert()` del navegador, incluso los de éxito. Fechas con flatpickr AAAA-MM-DD. Tarifas y orígenes copian los modales de la familia 1 y hablan de "usted". |
| **3 — Agosto a octubre 2026** | Facu (Fede en WhatsApp) | cuenta corriente, configuración de e-mail, integración WhatsApp | Título con ícono y subtítulo. Mensajes dentro de la página (`.alert`), sin `alert()` en e-mail y WhatsApp. Botones outline. Montos con `Intl` ARS. Fecha con el selector nativo del navegador. Colores propios (23 colores hex en cuenta corriente, incluido un modo oscuro que no existe en el resto). Botón "Guardando…" al guardar. |
| **Aparte** | — | Login, inicio | Login con paleta y tipografía propias (`css/login.css`: verde `#198754`, azul `#173d69`, Inter) y Font Awesome. Inicio con widgets movibles (Gridstack), Font Awesome y calendario. |

`gestion-viajes` es híbrida: base de la familia 1 con muchos cambios de octubre (19 commits
de Rocío): flatpickr en el modal, `alert()` para los avisos, cinco estados con color.

---

## 3. Lo que ya está compartido (conservarlo)

- **Plantilla Mazer** (`assets/compiled/css/app.css`): Bootstrap 5, tipografía Nunito,
  Bootstrap Icons, clases `btn-light-*` / `bg-light-*`. En `a651e48` se editó directamente
  este archivo (márgenes del submenú): conviene que los ajustes propios vayan en un CSS aparte.
- **Encabezado** (`views/header.html` + `assets/static/js/header.js`): nombre, iniciales y
  cerrar sesión.
- **Menú lateral** (`assets/static/js/sidebar-loader.js`): arma el menú, marca la pantalla
  activa y aplica permisos.
- **Paginación `PaginacionSGTL`** (en `sidebar-loader.js`): la usan 14 pantallas, con
  15 filas por página y selector "Filas por página". Es el mejor ejemplo de componente
  compartido que ya hay.
- **Pantalla de carga** `#loading-message` con spinner: está en todas, pero copiada en cada
  `<style>`.
- **Gestión de contenido** deja cambiar desde la aplicación el logo, el color de fondo, el
  color del menú y el texto del pie. **El design system tiene que decidir qué hacer con esto**
  (§6, D15).

---

## 4. Matriz por pantalla

"Rayada" = `table-striped`; "hover" = `table-hover`. "—" = no tiene.

| Pantalla | Fam. | Título | Botón de alta | Buscar / Limpiar | Tabla | Acciones por fila | Avisos | Confirmación | Fechas |
|---|---|---|---|---|---|---|---|---|---|
| listado-choferes | 1 | Listar choferes | — | gris / no | rayada, centrada | ícono "info" azul | toast de error | — | daterangepicker |
| gestion-choferes | 1 | Gestionar choferes | verde, solo íconos | gris / no | rayada, centrada | íconos azul / rojo / gris | toast de éxito + `alert()` | modal | daterangepicker |
| listado-camiones | 1 | Listar camiones | — | gris / no | rayada, centrada, sin estado | ícono "info" chico | toast de error + `alert()` | — | daterangepicker |
| gestion-camiones | 1 | Gestionar camiones | verde, solo íconos | gris / no | rayada, centrada | íconos azul / rojo / gris | toasts + `alert()` | modal | daterangepicker + flatpickr |
| listado-clientes | 1 | Listar clientes | — | gris / no | rayada, centrada, sin estado | ícono "info" | toast de error | — | daterangepicker |
| gestion-clientes | 1 | Gestionar clientes | verde, solo íconos | gris / no | rayada, centrada | íconos azul / rojo / amarillo-verde | toast de éxito | modal | daterangepicker |
| listado-usuarios | 1 | Listar usuarios | — | gris / no | rayada | "Más detalles" con texto | ninguno (error dentro del modal) | — | — |
| gestion-usuarios | 1 | Gestionar usuarios | verde, texto "Alta" | gris / no | rayada | botones con texto | toast de éxito + `alert()` | modal | — |
| gestion-gruposypermisos | 1 | Gestionar grupos y permisos | verde, texto "Alta" | gris / no | rayada, sin paginar | "Editar" / "Eliminar" chicos con texto | toast de éxito + `alert()` | `confirm()` | — |
| gestion-contenido | 1 | Gestionar contenido (`h4`) | — | — | — | — | toast de éxito | modal | — |
| listado-viajes | 1 | Listar viajes | — | gris / no | rayada, centrada, sin estado | ícono "info" chico, sin `title` | ninguno (errores solo en consola) | — | daterangepicker |
| gestion-viajes | 1* | Gestionar viajes | verde, solo íconos | gris / sí (gris) | rayada, centrada | íconos chicos | `alert()` (el toast está pero no se usa) | modal + `confirm()` | daterangepicker (filtros) + flatpickr (modal) |
| gestion-origenes-destinos | 2 | Gestionar orígenes y destinos | verde, "Nuevo origen" | — | rayada, sin paginar | íconos sin `title` | `alert()` | modal | — |
| gestion-tarifas | 2 | Gestionar tarifas | verde, "Nueva tarifa fija" | — | rayada, sin paginar | íconos sin `title` | `alert()` (el toast está pero no se usa) | modal | flatpickr |
| gestion-facturacion | 2 | Gestionar proformas + subtítulo | azul, "Nueva proforma" | azul chico / sí | hover, total a la derecha | íconos outline de 7 colores con `title` | `alert()` (21) | `confirm()` | flatpickr |
| listado-facturas | 2 | Listar proformas generadas + subtítulo | — | azul chico / sí | hover | ojo + PDF | `alert()` | — | flatpickr |
| gestion-auditoria | 2 | Auditoría del sistema + ícono + subtítulo | — | azul con ícono / sí | hover, a la izquierda, "Cargando…" | ojo outline | — | — | flatpickr |
| cuenta-corriente-clientes | 3 | Cuenta Corriente de Clientes + subtítulo | azul "Nuevo recibo" + dos outline | azul chico / sí (Limpiar primero) | hover, montos a la derecha | ojo outline | mensaje en página + `alert()` + `prompt()` | `confirm()` + `prompt()` | nativo del navegador |
| configuracion-email | 3 | Configuración de E-mail + ícono + subtítulo | verde, "Nueva configuración" | — | rayada + hover, sin paginar | íconos outline | mensaje en página | modal | — |
| configuracion-whatsapp | 3 | Integración WhatsApp + ícono + subtítulo | — (formulario con "Guardar") | — | — | — | mensaje en página | — | — |
| Login | — | Iniciar sesión | — | — | — | — | toast + error bajo el campo | — | — |
| index | — | ¡Bienvenido! (`h3`) | — | — | — | — | — | — | calendario |

---

## 5. Diferencias por componente

### 5.1 Encabezado de pantalla

- **Texto del título:** familia 1 usa verbo en infinitivo ("Gestionar choferes", "Listar
  camiones"); familias 2 y 3 mezclan con sustantivos ("Auditoría del sistema", "Cuenta
  Corriente de Clientes", "Integración WhatsApp").
- **Subtítulo:** solo en proformas, listado de proformas, auditoría, cuenta corriente,
  e-mail y WhatsApp.
- **Ícono en el título:** solo auditoría, e-mail y WhatsApp.
- **Nivel:** `h5` en casi todas; `h4` en gestión de contenido; `h3` en inicio.
- **Botones principales:** a la derecha de los filtros (familia 1), en la cabecera de la
  tarjeta (proformas, cuenta corriente, e-mail), dentro de cada pestaña (tarifas, orígenes) o
  al lado de "Buscar" (grupos).
- **Pestaña del navegador (`<title>`):** 12 pantallas dicen el genérico "Sistema de gestión
  de viajes"; Login y listado-viajes dicen "Sistema de Gestionar viajes"; el resto tiene el
  nombre propio. En todas falta la tilde de "Sánchez".

### 5.2 Botón de alta y de reporte

- **Verde con solo íconos** y tooltip (persona+, camión+, calendario+): choferes, camiones,
  clientes, viajes.
- **Verde con texto:** "Alta" (usuarios, grupos), "Nuevo origen", "Nueva tarifa fija",
  "Nueva configuración".
- **Azul con texto:** "Nueva proforma", "Nuevo recibo".
- **Reporte:** gris con solo ícono de descarga (familia 1) contra "Exportar listado" outline
  con texto (cuenta corriente).

### 5.3 Filtros y búsqueda

- **Maquetación:** `fieldset` con borde (gestión de la familia 1), filas `row`/`col` sueltas
  (listados, familias 2 y 3) o `d-flex` (listado-viajes). En listado-camiones las columnas
  suman más de 12 y se corren de renglón.
- **"Buscar":** gris normal (`btn-light`) en 10 pantallas; azul chico (`btn-primary btn-sm`)
  en proformas y cuenta corriente; azul normal con ícono en auditoría.
- **"Limpiar":** solo en gestion-viajes, proformas (las dos), auditoría y cuenta corriente.
  El orden cambia: Limpiar–Buscar (viajes, cuenta corriente) o Buscar–Limpiar (proformas,
  auditoría).
- **Cuándo busca:** siempre con el botón; además, según la pantalla, con Enter, al vaciar un
  campo o al aplicar el rango de fechas.
- **Labels:** con `form-label` y `for` en unas, sin `for` en otras (proformas, tarifas,
  orígenes, auditoría): tocar el texto no lleva al campo.

### 5.4 Tablas

- **Estilo:** rayada con todo centrado (familia 1); rayada sin centrar (usuarios, grupos,
  tarifas, orígenes: estas dos copiaron un CSS que apunta a `#tablaViajes` y no les aplica);
  hover con texto a la izquierda (familias 2 y 3); rayada + hover (e-mail).
- **Números y montos a la derecha:** solo proformas y cuenta corriente.
- **Sin resultados:** siete textos distintos: "No se encontraron registros", "Sin
  proformas.", "Sin registros", "Sin tarifas fijas cargadas", "No hay grupos.", "Sin
  movimientos para los filtros seleccionados.", "No hay comprobantes para los filtros
  seleccionados."
- **"Cargando…" dentro de la tabla:** solo proformas, auditoría y cuenta corriente; en el resto
  la tabla queda vacía hasta que llega la respuesta.
- **Columnas:** los listados de camiones, clientes y viajes no muestran el estado aunque
  se pueda filtrar por estado. La cabecera de acciones está vacía (usuarios), dice
  "Acciones" o dice "Ver" (listado de proformas).

### 5.5 Acciones por fila

- **Solo íconos con `title`:** gestión de la familia 1, proformas, auditoría, cuenta
  corriente, e-mail. En gestion-viajes el `title` está, pero en la VM se reportó que no se ve
  el tooltip: confirmar con las capturas.
- **Solo íconos sin `title`:** tarifas, orígenes y destinos, listado-viajes.
- **Botones con texto:** gestion-usuarios ("Editar", "Eliminar", "Activar/Inactivar"),
  grupos, listado-usuarios ("Más detalles").
- **Estilo:** sólidos (`btn-primary`, `btn-danger`) en familia 1, outline en familias 2 y 3;
  tamaño normal o chico según la pantalla.
- **"Cambiar estado":** gris con flechas (choferes, camiones), amarillo o verde con persona
  (clientes), gris con texto (usuarios), gris con bandera (viajes).

### 5.6 Estados (badges)

| Entidad | Estados y color de hoy |
|---|---|
| Choferes | Activo verde · Inactivo **rojo** |
| Usuarios | Activo verde · Inactivo **rojo** |
| Camiones | Activo verde · Inactivo **gris** |
| Clientes | **Habilitado** verde · **Deshabilitado** gris |
| Viajes | Registrado gris · En viaje celeste · Entregado azul · Listo para facturar amarillo · Facturado verde |
| Proformas | Borrador gris · Generada azul · Enviada celeste · Aceptada verde · Rechazada rojo · Anulada negro |
| Cuenta corriente | Pendiente rojo claro · Parcial amarillo claro · Cancelado / Aplicado verde claro (colores propios) |
| Auditoría | Alta verde · Modificación amarillo · Baja rojo · **Login** celeste · **Logout** gris · Km manual azul |

Problemas:
- **El mismo estado tiene dos colores:** "Inactivo" es rojo en choferes y usuarios, y gris en
  camiones.
- **El mismo concepto tiene dos nombres:** Activo/Inactivo contra Habilitado/Deshabilitado.
- **El rojo significa cosas distintas:** inactivo, rechazado, baja y deuda pendiente.
- **Hay dos estilos:** badges sólidos de Bootstrap en casi todo y pastel propio en cuenta
  corriente (Mazer ya trae `bg-light-*` para eso).
- **Inglés visible:** Login y Logout.

### 5.7 Modales

- **Tamaño del alta y la edición:** `modal-lg` (choferes, camiones, clientes, tarifas,
  orígenes), `modal-xl` (usuarios, viajes, proformas, e-mail, recibo) o el tamaño por defecto
  (grupos).
- **Título:** `h4` (familia 1, tarifas, orígenes) o `h5` (familias 2 y 3, confirmaciones).
- **Cruz para cerrar:** ícono Feather (`.close`, familia 1) o `btn-close` de Bootstrap (resto).
  En gestion-camiones están las dos.
- **Botón principal:** "Confirmar" (familia 1), "Guardar" (grupos, estado del viaje, e-mail),
  "Emitir", "Generar".
- **Eliminar:** en choferes, camiones, clientes y usuarios el botón que borra es **azul y dice
  "Confirmar"**; en viajes, tarifas y orígenes es **rojo y dice "Eliminar"**.
- **Cancelar:** `btn-light-secondary` en casi todos; `btn-light` en grupos.
- **Modales de detalle:** en los listados de la familia 1 no tienen pie (solo la cruz);
  auditoría y listado de proformas tienen "Cerrar".
- **Posición:** casi todos centrados; auditoría no.

### 5.8 Formularios y validación

- **Campos obligatorios:** asterisco rojo (familia 1, viajes), asterisco por CSS con clase
  `.req` (proformas), "Cliente *" escrito en el texto (cuenta corriente), `required` del
  navegador (e-mail) o nada (grupos, tarifas, orígenes, WhatsApp). En gestion-clientes el
  e-mail no tiene asterisco en el alta y sí en la edición.
- **Cómo se muestra el error:**
  - Banner rojo arriba ("Por favor, completá todos los campos requeridos *") + campo en rojo con
    mensaje debajo (`is-invalid`): familia 1, viajes, proformas.
  - Banner "Complete los campos: …": tarifas, orígenes.
  - `alert()`: grupos ("Ingresá el nombre del grupo.").
  - Texto rojo suelto: cuenta corriente.
  - Globo nativo del navegador: e-mail.
- **Opción vacía de los select:** "Seleccione…" (usted, la mayoría), "Seleccionar…"
  (proformas), "Seleccioná un perfil SMTP…" (e-mail).
- **Tipos de campo:** teléfono como `type="number"` en clientes (muestra flechitas y no
  admite espacios ni guiones).
- **Validación al escribir:** despareja (ya anotado en la recorrida del 17/10: dominio y
  usuario duplicados, DNI corto que deja Confirmar habilitado).

### 5.9 Avisos de éxito y error

| Mecanismo | Dónde |
|---|---|
| Toast de Bootstrap arriba a la derecha (verde o rojo, 3,5 a 5 s) | choferes, camiones, clientes, usuarios, grupos, contenido, listados (solo error), Login (error) |
| `alert()` del navegador | proformas (21), grupos (11), viajes (incluso "Viaje registrado correctamente."), tarifas, orígenes, cuenta corriente (7), PDF, y errores en choferes, camiones y usuarios |
| Mensaje dentro de la página (`.alert`) | e-mail, WhatsApp, cuenta corriente, emitir factura |
| Nada visible | listado-viajes (errores solo en consola), listado-usuarios |

- **La función de toast está copiada en cada pantalla:** `mostrarToastExito` aparece tres
  veces dentro de `gestion-choferes.html` y tres en `gestion-clientes.html`, y hay
  variantes `showToast`, `mostrarToastError` y `mostrar`.
- **Toasts que fallan:** en camiones, choferes y los listados tiran error porque
  `window.bootstrap` no está definido (F5 de `PENDIENTES-SISTEMA.md`). Usuarios y grupos ya
  lo esquivan.
- **Toast armado y sin usar:** en gestion-viajes y gestion-tarifas está el HTML del toast,
  pero avisan con `alert()`.

### 5.10 Confirmaciones

- **Modal de Bootstrap:** choferes, camiones, clientes, usuarios, viajes, tarifas, orígenes,
  contenido, e-mail.
- **`confirm()` del navegador:** eliminar grupo, anular proforma, evidencia del viaje,
  eliminar en cuenta corriente.
- **`prompt()` del navegador:** motivo de anulación en cuenta corriente.
- **Textos en tres tratamientos** para la misma pregunta: "¿Estás seguro que **querés**
  eliminar este chofer…?", "¿Estás seguro de que **deseas** cambiar el estado…?", "¿**Está**
  seguro que **desea** eliminar este viaje?".

### 5.11 Fechas

Además de lo visual, la hora tiene el problema de zona horaria del §2 de
`PENDIENTES-SISTEMA.md`. Acá se define solo **cómo se muestra y cómo se carga**.

- **Selectores:** daterangepicker + moment desde CDN (familia 1, filtros de viajes), flatpickr
  local (familia 2, modal de viajes, compra e ITV de camiones) y el nativo del navegador
  (cuenta corriente). Tarifas y orígenes cargan daterangepicker y moment sin usarlos.
- **Formato que se escribe:** DD/MM/AAAA (daterangepicker) contra AAAA-MM-DD (flatpickr, con
  el texto de ayuda "AAAA-MM-DD") contra el del navegador.
- **Formato que se muestra:** DD/MM/AAAA HH:MM (alta de choferes y camiones), D/M/AAAA sin
  ceros ("22/7/2026", clientes), DD/MM/AAAA (viajes, proformas, cuenta corriente),
  AAAA-MM-DD (tarifas), DD-MM-AAAA (CSV de camiones) y con hora en formato argentino
  (auditoría).
- **Mensaje contradictorio:** en gestion-camiones el error dice "(DD-MM-YYYY)" pero el campo
  usa AAAA-MM-DD (`gestion-camiones.html:1082` contra `:1733`).

### 5.12 Montos

- "$ 1.234,56" armado a mano con `toLocaleString('es-AR')` (proformas, PDF), con
  `Intl.NumberFormat` en ARS (cuenta corriente) o "$1.234" sin espacio (inicio).
- Alineados a la derecha solo en proformas y cuenta corriente.

### 5.13 Carga y "guardando"

- **Spinner de pantalla completa** al entrar: en todas, copiado en cada `<style>`.
- **"Cargando…" en la tabla:** solo familias 2 y 3.
- **Botón al guardar:** cuenta corriente y emitir factura cambian a "Guardando…" o
  "Emitiendo…"; e-mail y WhatsApp lo deshabilitan sin cambiar el texto; el resto no hace
  nada. Gestión de contenido oculta toda la pantalla mientras guarda. Sin bloqueo se puede
  hacer doble clic: el usuario "Cgodoy" duplicado (F10) salió de ahí.

### 5.14 Textos y tono

`CLAUDE.md` ya pide voseo; hoy se mezcla, a veces en la misma pantalla (gestion-choferes
tiene "completá", "deseas" e "Inténtelo").

- **Voseo:** "Completá todos los campos requeridos", "¿Querés eliminar…?", "Elegí un cliente
  primero.", "Escribí para buscar…".
- **Usted:** "Ingrese sus credenciales" (Login), "Seleccione un cliente" (casi todos los
  select), "¿Está seguro que desea eliminar…?" (viajes, tarifas, orígenes), "Complete los
  campos: …" (tarifas, orígenes), "Inténtelo de nuevo más tarde" (listados).
- **Tuteo:** "¿Estás seguro de que deseas…?" (choferes, usuarios, clientes), "intenta" en
  `alert()`, "Escribe el contenido del pie…" (contenido).
- **Inglés visible:** Login/Logout y "Alta (INSERT)" en auditoría, "Access Token" y "Phone
  Number ID" en WhatsApp, "Min KM / Max KM" en tarifas, "Dashboard" en el menú.
- **Mayúsculas:** "Cuenta Corriente de Clientes", "Cambiar Contraseña" (encabezado),
  "Registro de Cliente" (modal), contra "Gestionar choferes" en el resto.
- **Tildes:** "Razon Social", "Sanchez", "Ocurrio un error" (tarifas, orígenes).

### 5.15 Íconos, colores y tipografía

- **Íconos:** Bootstrap Icons en la aplicación; Font Awesome desde CDN en Login e inicio (y
  un `fa-check` suelto); además Feather y Boxicons en modales de la familia 1.
- **Tipografía:** Nunito (Mazer) en la aplicación; Inter en Login.
- **Colores:**
  - Primario de Mazer: azul `#435ebe`.
  - Login: verde `#198754` como acento y azul oscuro `#173d69`.
  - Cuenta corriente: verde azulado `#008c9e` en la pestaña activa.
  - Iniciales del usuario: `#007bff` si no hay color configurado.
  - Gestión de contenido: los colores de fondo y del menú se cambian desde la aplicación.
- **Verde = crear** en familias 1 y 2 y en e-mail; azul = crear en proformas y cuenta corriente.
- **Modo oscuro:** cuenta corriente trae estilos para tema oscuro, pero no hay forma de
  activarlo (el selector de `views/sidebar-active.html` no se usa).

### 5.16 Pie, encabezado y menú

- Pie: "2025 © Integra Analistas".
- Encabezado: "Cambiar Contraseña" es un link a `#` que no hace nada.
- Menú: "Documentación" tiene "Manual de usuario" y "Otros" que tampoco llevan a ningún lado.
- Ancho: todas las tarjetas ocupan el ancho completo con márgenes laterales, salvo las de
  configuración (máximo 1180 px).

---

## 6. Decisiones que tiene que tomar el design system

Para cada una se marca el **candidato**: lo mejor que ya existe en el sistema, para cambiar
lo menos posible. Son propuestas para discutir, no decisiones tomadas.

| # | Decisión | Candidato (de lo que ya hay) |
|---|---|---|
| D1 | Encabezado: texto del título, subtítulo, ícono, lugar de los botones principales | Título de auditoría y proformas: nombre + subtítulo corto + botón principal en la cabecera de la tarjeta |
| D2 | Botón de alta: color y texto | Azul primario con texto ("Nuevo chofer"), no solo íconos |
| D3 | Filtros: maquetación, botones y cuándo busca | Grilla `row g-2` de auditoría; "Buscar" azul + "Limpiar"; Enter busca |
| D4 | Tablas: estilo, alineación, vacío y carga | Hover; texto a la izquierda, números y montos a la derecha, estado y acciones centrados; un solo texto de vacío; "Cargando…" en la tabla |
| D5 | Acciones por fila: íconos o texto, colores, tamaño | Íconos chicos con tooltip y un color por tipo de acción, igual en todas |
| D6 | Estados: vocabulario, paleta y estilo | Un mapa único de colores por significado (verde = OK/activo, gris = inactivo/borrador, amarillo = pendiente, rojo = error/rechazo/baja, azul/celeste = en curso), con `bg-light-*` de Mazer o sólidos, uno solo |
| D7 | Modales: tamaños, título, cierre y botones | `h5` + `btn-close`; "Cancelar" gris a la izquierda; botón principal con verbo concreto ("Guardar", "Eliminar" en rojo); detalle con "Cerrar" |
| D8 | Formularios: obligatorios, errores, select vacío | Asterisco rojo; campo en rojo con mensaje debajo + banner arriba; "Seleccioná…"; labels con `for` |
| D9 | Avisos | Toast para éxito y para error, una sola función compartida; nunca `alert()` |
| D10 | Confirmaciones | Un modal compartido; nunca `confirm()` ni `prompt()`; las acciones destructivas en rojo |
| D11 | Fechas | Mostrar DD/MM/AAAA y HH:MM en 24 h; un solo selector (flatpickr, que ya está local y permite mostrar DD/MM/AAAA y mandar AAAA-MM-DD); sacar daterangepicker y moment |
| D12 | Montos | "$ 1.234,56" con `Intl` es-AR, a la derecha |
| D13 | Carga y guardado | Spinner de pantalla al entrar; "Cargando…" en la tabla; botón deshabilitado y "Guardando…" mientras guarda |
| D14 | Textos | Voseo, mayúscula solo al principio, sin inglés visible; `<title>` con el nombre de la pantalla |
| D15 | Marca: colores, tipografía, íconos y gestión de contenido | Solo Bootstrap Icons y Nunito; definir si el primario es el azul de Mazer o el verde del Login, y si gestión de contenido sigue cambiando colores o queda en logo y pie |
| D16 | ¿Se usa en celular o tablet? | Define cuánto esfuerzo poner en pantallas angostas |
| D17 | Modo oscuro | No (sacar los estilos sueltos de cuenta corriente) |

Para que el design system no se vuelva a dispersar:
- **CSS propio compartido** (por ejemplo `assets/static/css/sgtl.css`), cargado por todas las
  pantallas.
- **JS de interfaz compartido** con aviso, confirmación, carga y formato de fechas y montos,
  como ya se hizo con `PaginacionSGTL`.
- **Una regla en `CLAUDE.md`** que apunte a `03-decisiones.md`, para que Claude, Codex y
  Cursor lo lean antes de tocar una pantalla.

---

## 7. Bugs vistos de paso (no visuales)

Anotados también en `PENDIENTES-SISTEMA.md` §9.

| ID | Qué | Dónde |
|---|---|---|
| R1 | El botón de reporte CSV llama a `generarReporteCSV()`, que no existe en esa página: no hace nada y tira error en consola | `listado-viajes.html:158`, `gestion-clientes.html:179` |
| R2 | `showErrorToast()` no existe: si falla la red al cargar o guardar el contenido, tira error y no avisa | `gestion-contenido.html:299`, `:361` |
| R3 | El mensaje de error de fecha pide DD-MM-YYYY pero el campo usa AAAA-MM-DD | `gestion-camiones.html:1082` (y los de ITV) |
| R4 | "Cambiar Contraseña" (encabezado) y "Documentación" (menú) son links que no hacen nada | `views/header.html:34`, `sidebar-loader.js:90` |
| R5 | `</script>` suelto en el pie (inofensivo, el navegador lo ignora) | `listado-viajes.html:204` |

Ya estaban en pendientes: toasts y modales que fallan por `window.bootstrap` (F5) y el
detalle de listado-viajes con IDs en lugar de nombres (F6).
