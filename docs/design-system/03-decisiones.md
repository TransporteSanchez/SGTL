# Design system de SGTL — reglas

Reglas que valen para **todas las pantallas y todos los módulos**, también los de Facu (proformas, cuenta
corriente, facturación, e-mail, presupuestos) y Fede (WhatsApp), y para los mensajes de la API que se ven en
pantalla. Están aplicadas en todas las pantallas desde el 22/10/2026.

**Cómo usar este documento (personas e IA):**
- Lo que dice acá es lo vigente. Las fechas entre paréntesis dicen cuándo se decidió algo, no que esté a prueba.
- Si una pantalla existente no cumple una regla, **la regla gana**: no copies lo que ves en otra pantalla.
- Usá las funciones compartidas de la tabla de abajo; no escribas las tuyas.
- Lo que no está acá no se decidió: preguntale a Rocío antes de inventar un patrón. Si una pantalla necesita
  apartarse de una regla, se anota acá como excepción.
- Antes de commitear, revisá la lista de control de `AGENTS.md`.

**Funciones compartidas** (`assets/static/js/sgtl-ui.js`, `window.SGTL`; estilos en `assets/static/css/sgtl.css`):

| Para | Función |
|---|---|
| Avisos (§5.1) | `SGTL.toastExito(texto)`, `SGTL.toastError(texto)`; error dentro de un modal: `SGTL.avisoFormulario(aviso, texto)` |
| Texto de un error de la API (§9) | `SGTL.mensajeError(xhr, porDefecto)`; `$.ajax` como promesa: `SGTL.ajax(opciones, porDefecto)` |
| Confirmar (§5.2) | `SGTL.confirmar({ titulo, mensaje, verbo, peligro, motivo, accion })` |
| Guardando… (§8) | `SGTL.procesando(boton, texto)`: devuelve la función que lo restablece |
| Abrir y cerrar modales | `SGTL.modal(modal, 'show' / 'hide')` |
| Formularios (§6.3) | `SGTL.validador(reglas)`, `SGTL.revisarFormulario`, `SGTL.reiniciarFormulario`, `SGTL.marcarError`, `SGTL.limpiarError`; bloques: `.sgtl-bloque` + `.sgtl-bloque-titulo`; lo que no se edita: `.sgtl-dato-fijo` |
| Ver detalle (§6.2) | `.sgtl-dato` / `.sgtl-dato-etiqueta` / `.sgtl-dato-valor`; pie: `SGTL.textoRegistro(usuarioAlta, fechaAlta, usuarioModi, fechaModi)`; viaje: `SGTLDetalleViaje.abrir(viaje, { enlaceGestion })` (`viaje-detalle.js`) |
| Editar el cliente desde otra pantalla (§6.3) | `SGTLEditarCliente.abrir(id, { tipoBloqueado, alCerrar })` (`assets/static/js/cliente-editar.js`, el mismo modal de Gestionar clientes) |
| Elegir de una lista larga (cliente, chofer, §6.3) | `SelectClientePredictivo.inicializar(select, { placeholder, textoVacio, idCampo })` (`assets/static/js/select-cliente-predictivo.js`) |
| Botones de la fila (§1.4) | `SGTL.botonFila(accion, { id, texto, icono, datos, deshabilitado, motivo })`, `SGTL.accionesFila(botones)` |
| Cambiar estado (§1.4) | `SGTL.opcionesEstado`, `SGTL.estadoElegido` |
| Etiquetas de estado (§4) | `SGTL.estado(valor, texto, color)`; lo que acompaña al estado: `SGTL.conInfo(estado, SGTL.botonInfo(nivel, contenido, etiqueta))` |
| Tablas (§2) | `SGTL.tabla` (cargando, vacía, llenar y paginación) |
| Cruz de los filtros (§1.3) | `SGTL.filtros(campos, alBorrar)` |
| Fechas (§7.1, §7.2) | `SGTL.selectorFecha`, `SGTL.rangoFechas`, `SGTL.valorRango`, `SGTL.fecha`, `SGTL.leerFecha`, `SGTL.fechaISO` |
| Montos y km (§7.3) | `SGTL.monto`, `SGTL.km`; los que se escriben: `SGTL.enlazarMascaraMonto`, `SGTL.montoCentavos`, `SGTL.formatearMontoCentavos` |
| Exportar (§1.2) | `SGTL.descargarCSV` |
| Escapar texto en HTML | `SGTL.escapar` |

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
- **No hay botón "Limpiar" general** en ninguna pantalla.
- **Cada filtro se borra con su propia cruz:** campos de texto, fechas, desplegables y el
  buscador de clientes muestran una cruz a la derecha **solo cuando tienen valor**. La cruz deja
  el campo vacío (o en "Todos") y **vuelve a buscar sola**. No vuelve a un valor por defecto: en
  cuenta corriente, borrar la fecha deja "sin límite", no "últimos 30 días".
- Las casillas no llevan cruz. (El filtro de estado deja de ser casillas: ver §3.3.)
- **Enter en cualquier filtro busca**, en todas las pantallas.
- **Cuándo busca solo (22/10, opción A de Rocío):** los desplegables (estado, tipo, cliente,
  entidad…) buscan al elegir; el rango de fechas, al cerrar el calendario con las dos fechas; los
  campos de texto (número, nombre, DNI, dominio, referencia, texto libre) **no** buscan mientras se
  escribe: buscan con Enter o con "Buscar". Por eso **"Buscar" está siempre**: es la forma de
  buscar lo que se escribió, sirve en el celular (donde no se usa Enter) y vuelve a traer la lista
  con todos los filtros.
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
| Ver PDF | `bi-file-earmark-pdf` | `btn-outline-secondary` |
| Cambiar estado (presupuestos, viajes) | `bi-flag` | `btn-outline-secondary` |
| Siguiente paso del circuito (Marcar aceptada, Emitir factura, Generar viaje) | el de cada acción | `btn-outline-success` |
| Activar / Inactivar | `bi-toggle-on` (está activo) / `bi-toggle-off` (está inactivo) | `btn-outline-secondary` |
| Eliminar / Anular | `bi-trash` / `bi-x-circle` | `btn-outline-danger`, siempre la última |

- El tooltip dice la acción con verbo: "Ver detalle", "Editar", "Ver PDF", "Inactivar", "Eliminar".
- **El ojo de un documento** (proforma, factura, recibo, nota de crédito o débito) abre el documento completo en
  solo lectura: título "Ver proforma 0001-00000017", "Ver factura FAC-00000012"; solo "Cerrar" en el pie
  (gestionar proformas, listar proformas y cuenta corriente, 22/10).
- **"Ver PDF"** abre la vista previa del PDF dentro del sistema (no en una pestaña nueva): título "Ver PDF del
  presupuesto" / "Ver PDF del comprobante FAC-00000012", y el pie **Cerrar · Enviar por e-mail · Imprimir ·
  Descargar PDF** (este último, el principal). **"Enviar por e-mail" va en ese pie, no como botón de la fila**:
  así se ve lo que se manda y la fila no se llena de botones (presupuestos, cuenta corriente y proformas, 22/10).
  Si el módulo no envía por e-mail (proformas, por ahora), el pie es Cerrar · Imprimir · Descargar PDF.
- **Si una acción no se puede hacer en esa fila, aparece deshabilitada y el tooltip dice por
  qué** ("No es posible eliminar un chofer activo"). No se oculta: así todas las filas tienen los
  mismos botones en el mismo lugar.
- **Cambiar estado** (banderita, desde el 22/10): **mismo ícono, mismo color, mismo significado en todo el
  sistema.** Es gris porque es una acción de gestión: abre una ventana para elegir entre varios estados (para
  adelante, para atrás o rechazado). El **verde** queda solo para el paso puntual del circuito que se hace con un
  clic (Marcar aceptada, Emitir factura, Generar viaje), así hay uno solo por fila. Va antes del siguiente paso.
  Abre siempre la misma ventana "Cambiar estado del … #N" (`SGTL.opcionesEstado`): resumen, estado actual y
  los estados a los que puede pasar como tarjetas, cada una con su explicación; Cancelar + Guardar; si no se
  elige ninguno, "Elegí el estado nuevo.". Una tarjeta que no se puede elegir aparece gris con el motivo en rojo
  ("Para marcarlo, editá el viaje y cargá: N° entrega Rukas."). **Los datos que pide un estado van dentro de su
  tarjeta** y se ven solo al elegirla (en viajes, resultado, fecha y evidencia dentro de "Entregado"; con
  plataforma, resultado, fecha y evidencia opcionales dentro de "Listo para facturar"). Si esos datos se pueden corregir
  sin cambiar de estado (viaje ya entregado o listo para facturar), van arriba en "Datos de la entrega" y
  elegir un estado es opcional: volver a tocar la tarjeta elegida la desmarca. Si la fila no admite cambios
  (facturado, en una proforma emitida), la banderita queda deshabilitada con el motivo.
- El "siguiente paso" ocupa un solo lugar y cambia según el estado (en proformas: Marcar
  aceptada → Emitir factura). Si no hay siguiente paso, ese lugar queda deshabilitado con el
  motivo.
- No se usan: la "i" azul ni "Más detalles" (es el ojo), las flechas, el muñequito amarillo ni "Inactivar"
  con texto (es el interruptor o el siguiente paso, según corresponda).

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
- **Filas que se despliegan** (lo aplicado a una factura en cuenta corriente): las filas de adentro mantienen las
  mismas columnas; la fila abierta se resalta apenas, una barra azul a la izquierda une la fila con las suyas, el dato
  que identifica a cada una va corrido con ↳ y el resto en gris, y una línea más marcada cierra el grupo (22/10).
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
- **Menú vigente** (el título de cada pantalla es igual a su opción; la historia de los cambios está en el
  Apéndice A):

| Sección | Opciones |
|---|---|
| Dashboard | (ítem principal) |
| Choferes | Listar choferes · Gestionar choferes |
| Camiones | Listar camiones · Gestionar camiones |
| Viajes | Listar viajes · Gestionar viajes · Gestionar orígenes y destinos · Gestionar tarifas · Gestionar presupuestos |
| Clientes | Listar clientes · Gestionar clientes |
| Facturación | Listar proformas · Gestionar proformas · Gestionar cuenta corriente · Gestionar tipos de comprobante (solo administradores; se mudó desde Configuración el 22/10) |
| Configuración | Gestionar e-mail · Gestionar integración de WhatsApp · Gestionar contenido (toda la sección, solo administradores) |
| Usuarios | Listar usuarios · Gestionar usuarios · Gestionar grupos y permisos |
| Auditoría | (ítem principal) |
| Documentación | Consultar manual de usuario · Consultar informe de versión |

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
- **Mismo ancho para todos los campos** (22/10): cuatro por fila en pantalla de escritorio
  (`col-12 col-sm-6 col-lg-3`); solo el texto libre de auditoría ocupa el doble. "Buscar" usa lo
  que queda de la última fila (o una fila propia si no queda lugar).
- **Mismo orden en todas las pantallas** (22/10): 1) número o identificador (número, nombre,
  dominio, razón social); 2) cliente o persona; 3) fechas; 4) estado; 5) tipo y otros
  desplegables; 6) texto libre (referencia, origen o destino, detalle). Por ejemplo: proformas
  Número · Cliente · Fecha · Estado · Tipo · Usuario; viajes Número · Cliente · Fecha de inicio ·
  Fecha de fin · Estado · N° remito.
- **Listar y Gestionar de lo mismo tienen los mismos filtros** (choferes, camiones, clientes,
  viajes, usuarios, proformas). Los textos de ejemplo de cada campo son un dato posible ("jperez",
  "PF-00000010"), no el nombre del campo.
- **Pantallas con pestañas** (orígenes y destinos, tarifas, grupos y permisos): cada pestaña tiene
  sus filtros arriba de su tabla, y su botón de alta va al lado de "Buscar", a la derecha.
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
| Verde | Terminado bien o activo | Activo, Facturado / Facturada, Cancelado, Aplicado, Alta, Completa (resultado de la entrega, 22/10) |
| Rojo | Anulado, dado de baja, deuda o entrega rechazada | Anulada, Baja, Pendiente (deuda), Rechazo (resultado de la entrega, 21/10), Vencida (ITV, 21/10) |

- Un estado nuevo se ubica en una de estas filas por lo que significa; no se inventan colores.
- **Presupuestos:** Pendiente es esperar la respuesta del cliente, no una deuda: va en gris.
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
- **Lo que acompaña al estado en una tabla** (en qué proforma está un viaje, de qué presupuesto viene, qué falta
  para generar una proforma) va en un **ícono chico al lado del estado que abre un globito** al hacer clic, no en
  más etiquetas (pedido de Rocío, 22/10): `SGTL.conInfo(estado, SGTL.botonInfo(nivel, contenido, etiqueta))`. El
  ícono es liviano, sin fondo, y su color dice qué pasa: gris (`bi-info-circle`) si es solo información; naranja
  (`bi-clock`) si se espera a alguien (Rukas); rojo (`bi-exclamation-circle`) si falta resolver algo; verde
  (`bi-check-circle`) si está listo. Siempre con un texto adentro. Se cierra con otro clic o con Escape. Así están
  Gestionar viajes y Gestionar proformas.
- **Si lo que acompaña es otro estado** (el resultado de la entrega: "Parcial", "Con rechazo"), va como etiqueta
  debajo del estado, en su propio renglón (`<div class="mt-1">`), no una al lado de la otra (dashboard). En un título
  de modal van una al lado de la otra. Presupuestos todavía muestra "Viaje #N" debajo del estado: pendiente pasarlo
  al ícono (módulo de Facu).

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
- **Lo que se manda afuera al guardar se avisa antes, a la vista** (22/10, viajes): un aviso azul
  (`alert alert-info sgtl-aviso-whatsapp`, con el ícono de WhatsApp) junto al dato que lo dispara, con el nombre de
  quien lo recibe: "Al guardar, Martín Ledesma recibe la hoja de ruta por WhatsApp." Después de guardar, el toast
  dice si salió o no.
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
| Ver detalle | tooltip "Ver detalle"; título del modal "Ver detalle del camión"; en un documento, "Ver factura FAC-00000012" (§1.4) |
| Emitir comprobantes (cuenta corriente) | menú "Emitir comprobante": "Emitir factura directa", "Emitir factura desde proforma", "Emitir nota de crédito", "Emitir nota de débito"; el título de la ventana es la opción elegida; el pie, "Emitir factura" / "Emitir nota de crédito" |
| Pie de los modales | "Cancelar", "Guardar", "Eliminar", "Generar", "Emitir recibo", "Cerrar" |
| Acciones de la fila | "Inactivar", "Activar", "Ver PDF", "Editar recibo", "Anular recibo", "Marcar como aceptada", "Emitir factura", "Exportar" |
| Confirmación | "¿Eliminar el camión ABC123?" |

- "Registrar proforma" crea el borrador; "Generar" le asigna el número. "Registrar recibo" abre el
  formulario; el botón del pie es "Emitir recibo". "Emitir factura" (siguiente paso de una proforma) abre la
  ventana "Emitir factura".
- **Nada de sustantivos solos en botones ni títulos** ("Recibo", "Factura directa", "Tipos de comprobantes") ni
  de "Nuevo…" / "Nueva…".

### 6.2 Modales

- **Encabezado:** título `h5` (`modal-title`) y la cruz de Bootstrap (`btn-close`) siempre
  visible arriba a la derecha. Nada de íconos Feather (no se cargan y la cruz queda invisible).
- **Pie:** "Cancelar" gris claro (`btn btn-light-secondary`) y, a su derecha, el botón principal
  con el verbo: "Guardar" (`btn-primary`) en alta y edición, "Eliminar" / "Anular" en rojo
  (`btn-danger`), "Generar", "Emitir recibo". **Nunca "Confirmar".**
- **Un botón del pie que todavía no se puede usar** (22/10, primero en la proforma de Rukas) queda deshabilitado y
  su globito dice por qué ("Primero elegí el Excel de Rukas", "Para generar, resolvé las 3 diferencias"), como los de
  la fila (§1.4): va en un `span.sgtl-envoltura-deshabilitado`. Nada de notas grises en el pie explicándolo. Un botón
  que en ese paso no hace nada distinto de otro no se muestra ("Guardar borrador" mientras elegir el Excel ya lo
  guarda).
- **Detalle:** solo "Cerrar" en el pie, además de la cruz.
- **Cómo se arma un Ver detalle** (22/10, opción B de Rocío): con los mismos bloques que su formulario
  (`.sgtl-bloque` + `.sgtl-bloque-titulo`), en filas de a dos bloques que empiezan a la misma altura
  (`.sgtl-detalle-grilla`; uno ancho ocupa la fila con `.sgtl-detalle-ancho`) y en una columna en el celular. Cada dato
  lleva su nombre chico arriba y el valor en texto abajo (`.sgtl-dato`, `.sgtl-dato-etiqueta`, `.sgtl-dato-valor`); un
  dato vacío se ve "—". El estado va en el título, al lado del nombre ("Ver detalle del viaje #46" + la etiqueta), con
  las etiquetas informativas que correspondan. Abajo, en chico, quién lo registró y quién lo modificó
  (`SGTL.textoRegistro`). Así están viajes (`viaje-detalle.js`, el mismo en Listar y Gestionar viajes y en el
  dashboard), choferes, camiones, clientes y usuarios. Los documentos (proforma, comprobantes) siguen el §1.4.
- **Los formularios no se cierran con un clic afuera** (`data-bs-backdrop="static"`); Escape y la
  cruz sí los cierran. Los de detalle se cierran también con un clic afuera.
- **Tamaño según el contenido:** `modal-lg` para formularios comunes; `modal-xl` solo con mapa o
  tablas (viajes, presupuestos, proformas, Ver PDF); el tamaño por defecto para confirmaciones. Las ventanas de
  emisión de cuenta corriente (comprobante, recibo y factura desde proforma) son `modal-xl` y además tienen el
  mismo alto (`sgtl-modal-formulario`, 22/10).

### 6.3 Formularios

- **Obligatorios:** asterisco rojo al lado del nombre del campo (`<span class="text-danger">*</span>`).
- **"Guardar" siempre habilitado.** Al tocarlo con errores:
  - arriba del formulario, un aviso corto en rojo: "Revisá los campos marcados.";
  - cada campo con problema en rojo (`is-invalid`) con su mensaje debajo
    (`invalid-feedback`): "Completá el DNI.", "El DNI tiene que tener 7 u 8 números.";
  - el cursor va al primer campo con error.
- **Cada campo se valida al salir de él**, no en cada tecla, y el rojo se va apenas se corrige.
- **Opción vacía de los desplegables:** "Seleccioná un cliente" (voseo).
- **Listas largas** (cliente, chofer): el buscador compartido (`SelectClientePredictivo`), el mismo de los filtros.
  Al hacer clic muestra la lista completa, que se recorre con la rueda o las flechas (Enter elige); escribir
  filtra por cualquier parte del texto (nombre, apellido o DNI). No hace falta saberse el dato de memoria (22/10).
  Una etiqueta de la opción ("Rukas") se ve en la lista y, elegida, adentro del mismo campo, no debajo.
- **Ayudas:** el texto gris dentro del campo es un ejemplo ("30111222"); las instrucciones van
  debajo, en chico (`form-text`): "Sin puntos ni espacios".
- **Formularios largos** divididos en bloques con subtítulo, como el recibo ("Datos generales",
  "Forma de pago"). El subtítulo es uno solo para todo el sistema: `<section class="sgtl-bloque">` con
  `<div class="sgtl-bloque-titulo">` (chico, en negrita, con una línea fina debajo; viajes, 22/10). Cuenta corriente
  (`.cc-block-title`) y proformas (`.bloque-titulo`) todavía tienen su propia copia: pendiente pasarlas.
- **Lo que no se puede editar** (22/10, primero en viajes): **nunca un campo deshabilitado**; se ve como texto.
  Una caja blanca con borde se edita; un texto, no.
  - Si es un bloque entero (el recorrido de un viaje que ya salió), un recuadro gris con el resumen en texto en el
    lugar del bloque, con su subtítulo (`.sgtl-dato-fijo`).
  - Si es un campo suelto (el número de una proforma), su etiqueta y el valor en texto, como en Ver detalle.
  - Arriba, un aviso de una línea dice por qué: "Ya salió: solo se completa el número de remito." Lo editable
    sigue como campo, en su lugar de siempre.
  - Las demás pantallas todavía usan campos deshabilitados (el recibo de cuenta corriente): pendiente revisarlo.
- **Los datos de otra entidad dentro de un documento no se editan ahí** (22/10, primero el cliente en la proforma):
  se ven como texto (`.sgtl-dato-fijo`) con un enlace "Editar cliente". El enlace oculta el modal del documento, sin
  perder lo cargado, y abre la edición de esa entidad, la misma de su pantalla (`SGTLEditarCliente`). Guardar → toast
  y vuelve al documento con los datos nuevos; Cancelar → vuelve sin cambios. Lo que desde ahí cambiaría el documento
  abierto (el tipo de cliente) se ve como texto con el motivo. El aviso dice también qué más se actualizó: "Cliente
  actualizado. También se actualizaron sus datos en el borrador de proforma #23." (o "en 3 borradores de proforma").
  Sin permiso para editar esa entidad, el enlace queda deshabilitado con el motivo (§1.4).
- `form-label` con `for` en todos los campos (tocar el nombre lleva al campo).

---

## 7. Fechas y montos

La zona horaria (de dónde sale "la hora actual") es otro tema: §2 de `docs/PENDIENTES-SISTEMA.md`.
Esto define solo cómo se muestran y cómo se cargan.

### 7.1 Selector de fecha

- **Uno solo: flatpickr** (local, `assets/extensions/flatpickr/`) **en español**
  (`l10n/es.js`: semana desde el lunes), con `SGTL.selectorFecha` / `SGTL.rangoFechas`. No se usan
  daterangepicker, moment ni el `type="date"` del navegador.
  **Excepción (22/10):** moment sigue cargado solo en el dashboard, porque lo necesita FullCalendar 3
  (calendario de próximos viajes); no se usa para fechas propias.
- **Se ve y se escribe DD/MM/AAAA**; con hora, **DD/MM/AAAA HH:MM en 24 h, en un solo campo** (no fecha y
  hora por separado; presupuestos y viajes, 22/10). A la API se le sigue
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
- **Montos que se escriben** (importes de recibos, notas, comprobantes): `type="text" inputmode="decimal"`, nunca
  `type="number"`. Se escriben con coma o punto decimal y al salir del campo se acomodan a "1.234,56"
  (`SGTL.enlazarMascaraMonto`); se leen en centavos enteros con `SGTL.montoCentavos` para no perder centavos
  (idea de Facu, 22/10).
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
  tildes ("Razón social", "Sánchez", "Ocurrió"). **Los documentos van en minúscula dentro de un texto:** "la
  factura", "el recibo", "la nota de crédito", "la proforma", "el presupuesto" (no "la Factura" ni "la Nota de
  Crédito").
- **Títulos, botones y etiquetas sin punto final; los mensajes, con punto.**
- **Sin inglés a la vista:** "KM mínimo / KM máximo" (no "Min KM / Max KM"), "Alta" (no
  "Alta (INSERT)"), "Inicio de sesión" (no "Login"). En WhatsApp: "Token de acceso" e "ID del
  número de teléfono", con el nombre que usa Meta ("Access Token", "Phone Number ID") en la
  ayuda de abajo para poder encontrarlo. **Excepción:** "Dashboard" queda.
- **Nunca mostrar un error técnico** (excepciones, códigos como "IDX10223…"). El mensaje dice qué
  pasó y qué hacer. **Vale también para los mensajes de la API** que llegan a la pantalla: voseo, sin nombres
  de campos ("Seleccioná un cliente.", no "ClienteID es obligatorio."). Si la sesión venció: "Tu sesión venció. Volvé a iniciar sesión." y se lleva
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
- **Selector segmentado** (opciones excluyentes, como el período del dashboard): riel gris claro y la opción elegida
  como tarjeta blanca con el texto en el azul de las acciones; mide 40 px, como un campo. Clase `.sgtl-segmentado`
  con botones `btn btn-sm` y `aria-pressed` (22/10). No se usa un grupo de botones con borde para esto.
- **Paginador, menús desplegables, buscador de clientes, calendario, listas, barras de progreso y
  globitos de ayuda:** el mismo lenguaje (blanco, borde fino, sombra suave, esquinas redondeadas;
  días del calendario y rango en el azul de las acciones).
- **Pantalla nueva:** no lleva estilos propios de botones, avisos, pestañas ni tablas; usa las clases
  de Bootstrap/Mazer de siempre y `sgtl.css` les da este aspecto.

---

## Apéndice A — Cambios de nombre del menú

Historia: cómo se llamaba cada opción y cómo quedó. Lo vigente es la tabla de §3.1.

| Antes en el menú | Antes en el título | Quedó |
|---|---|---|
| Listar proformas | Listar proformas generadas | Listar proformas |
| Cuenta corriente | Cuenta Corriente de Clientes | Gestionar cuenta corriente |
| Configuración → Facturación | Configuración de Facturación | Gestionar tipos de comprobante (22/10, idea de Facu; antes "Gestionar facturación") |
| Configuración → E-mail | Configuración de E-mail | Gestionar e-mail |
| Configuración → Gestión de contenido | Gestionar contenido | Gestionar contenido |
| Configuración → Integración WhatsApp | Integración WhatsApp | Gestionar integración de WhatsApp |
| Auditoría | Auditoría del sistema | Auditoría (ítem principal, sin verbo; 20/10) |
| Viajes → Presupuestos | Gestionar presupuestos | Gestionar presupuestos (20/10) |
| Documentación → Manual de usuario | Manual de usuario | Consultar manual de usuario (20/10) |
| Documentación → Informe de versión | Informe de versión | Consultar informe de versión (20/10) |

