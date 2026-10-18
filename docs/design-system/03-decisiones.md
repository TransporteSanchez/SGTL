# Design system de SGTL — decisiones

Reglas que valen para **todas** las pantallas, nuevas o tocadas. Salen de repasar con Rocío
las propuestas de `01-relevamiento-codigo.md` (§6) con las capturas de la VM a la vista
(`docs/pruebas/2026-10-17-capturas-ui.md`). Si una pantalla necesita apartarse de una regla,
se anota acá como excepción.

Estado: **en curso** (17/10/2026). Lo que no está acá todavía no se decidió.

---

## 1. Botones

### 1.1 Botón de alta

- **Verde** (`btn btn-success`).
- **Ícono "+" y texto con lo que se crea:** `<i class="bi bi-plus-lg"></i> Nuevo chofer`,
  "Nueva proforma", "Nuevo recibo". Nada de botones de alta solo con íconos ni "Alta" a secas.
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
| Siguiente paso del circuito (Estado y entrega, Marcar aceptada, Emitir factura) | el de cada acción | `btn-outline-success` |
| Activar / Inactivar | `bi-toggle-on` (está activo) / `bi-toggle-off` (está inactivo) | `btn-outline-secondary` |
| Eliminar / Anular | `bi-trash` / `bi-x-circle` | `btn-outline-danger`, siempre la última |

- El tooltip dice la acción con verbo: "Ver detalle", "Editar", "Inactivar", "Eliminar".
- **Si una acción no se puede hacer en esa fila, aparece deshabilitada y el tooltip dice por
  qué** ("No es posible eliminar un chofer activo"). No se oculta: así todas las filas tienen los
  mismos botones en el mismo lugar.
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

- **Todos los ítems del menú empiezan con un verbo en infinitivo** (pedido de la profesora). El
  **título de la pantalla es igual al ítem del menú**, con mayúscula solo al principio.
- Cambios de nombre (menú y título):

| Hoy en el menú | Hoy en el título | Pasa a |
|---|---|---|
| Listar proformas | Listar proformas generadas | Listar proformas |
| Cuenta corriente | Cuenta Corriente de Clientes | Gestionar cuenta corriente |
| Configuración → Facturación | Configuración de Facturación | Gestionar facturación |
| Configuración → E-mail | Configuración de E-mail | Gestionar e-mail |
| Configuración → Gestión de contenido | Gestionar contenido | Gestionar contenido |
| Configuración → Integración WhatsApp | Integración WhatsApp | Gestionar integración de WhatsApp |
| Auditoría | Auditoría del sistema | Consultar auditoría |

- **Excepción:** "Dashboard" queda como está.
- Los permisos del menú se resuelven por el archivo de cada pantalla (`sidebar-loader.js`), no
  por el texto: renombrar no cambia quién ve qué.

### 3.2 Encabezado

- **Ícono de la sección del menú** a la izquierda del título, el mismo que tiene la sección en
  el menú (`bi-truck` en camiones, `bi-gear` en configuración).
- **Subtítulo de una línea en todas las pantallas**, que diga para qué sirve. Ejemplo: "Solo
  proformas ya generadas; los borradores están en Gestionar proformas".
- A la derecha, en la misma línea: exportar y después el alta (§1.1 y §1.2).
- **Pestaña del navegador:** `<title>Gestionar choferes · Transporte Sánchez</title>` (con tilde).

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
| Amarillo | Falta algo para cerrar | Listo para facturar, Aceptada (lista para facturar), Parcial, Km manual |
| Verde | Terminado bien o activo | Activo, Facturado / Facturada, Cancelado, Aplicado, Alta |
| Rojo | Anulado, dado de baja o deuda | Anulada, Baja, Pendiente (deuda) |

- Un estado nuevo se ubica en una de estas filas por lo que significa; no se inventan colores.
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
