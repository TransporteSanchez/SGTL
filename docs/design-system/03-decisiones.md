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
| Avisos (§5.1) | `SGTL.toastExito(texto)`, `SGTL.toastError(texto)`; error dentro de un modal: `SGTL.avisoFormulario(aviso, texto, detalle)` (`detalle`: lista opcional) |
| Texto de un error de la API (§9) | `SGTL.mensajeError(xhr, porDefecto)`; `$.ajax` como promesa: `SGTL.ajax(opciones, porDefecto)` |
| Confirmar (§5.2) | `SGTL.confirmar({ titulo, mensaje, verbo, peligro, motivo, detalle, ancho, accion })`; `motivo`: `{ etiqueta, obligatorio, placeholder, ayuda }` (`ayuda`: el texto gris de debajo, "Opcional. Queda en Auditoría.") |
| Guardando… (§8) | `SGTL.procesando(boton, texto)`: devuelve la función que lo restablece |
| Abrir y cerrar modales | `SGTL.modal(modal, 'show' / 'hide')` |
| Formularios (§6.3) | `SGTL.validador(reglas)`, `SGTL.revisarFormulario`, `SGTL.reiniciarFormulario`, `SGTL.marcarError`, `SGTL.limpiarError`; bloques: `.sgtl-bloque` + `.sgtl-bloque-titulo`; lo que no se edita: `.sgtl-dato-fijo` |
| Cerrar un formulario con cambios sin guardar (§6.2) | `SGTL.cambiosSinGuardar(modal, { activo })`: devuelve `{ limpiar, hayCambios }`; `limpiar()` al terminar de cargar los datos y antes de cerrar después de guardar |
| Ver detalle (§6.2) | `.sgtl-dato` / `.sgtl-dato-etiqueta` / `.sgtl-dato-valor`; pie: `SGTL.textoRegistro(usuarioAlta, fechaAlta, usuarioModi, fechaModi)`; viaje: `SGTLDetalleViaje.abrir(viaje, { enlaceGestion })` (`viaje-detalle.js`) |
| Editar el cliente desde otra pantalla (§6.3) | `SGTLEditarCliente.abrir(id, { tipoBloqueado, alCerrar })` (`assets/static/js/cliente-editar.js`, el mismo modal de Gestionar clientes) |
| Tabla con grupos y su resumen (§2.1) | Resumen arriba: `.sgtl-resumen` + `.sgtl-resumen-item` (con `.sgtl-info-punto rojo / amarillo / azul / verde`); título de cada grupo: `tr.sgtl-grupo` con la etiqueta del grupo y `.sgtl-grupo-ayuda` |
| Elegir de una lista larga (cliente, chofer, §6.3) | `SelectClientePredictivo.inicializar(select, { placeholder, textoVacio, idCampo })` (`assets/static/js/select-cliente-predictivo.js`) |
| Botones de la fila (§1.4) | `SGTL.botonFila(accion, { id, texto, icono, datos, deshabilitado, motivo })`, `SGTL.accionesFila(botones)` |
| Cambiar estado (§1.4) | `SGTL.opcionesEstado`, `SGTL.estadoElegido` |
| Etiquetas de estado (§4) | `SGTL.estado(valor, texto, color)`; lo que acompaña al estado: `SGTL.conInfo(estado, SGTL.botonInfo(nivel, contenido, etiqueta))` |
| Estado de un viaje (§4.1) | `SGTL.estadoViaje(estado)` (con su texto: "En_viaje" → "En viaje"; Cancelado en rojo, Sin carga en azul); los textos para un filtro: `SGTL.estadosViaje()` |
| Tablas (§2) | `SGTL.tabla` (cargando, vacía, llenar, paginación y `habilitarOrden`) |
| Cruz de los filtros (§1.3) | `SGTL.filtros(campos, alBorrar)` |
| Fechas (§7.1, §7.2) | `SGTL.selectorFecha`, `SGTL.rangoFechas`, `SGTL.valorRango`, `SGTL.fecha`, `SGTL.leerFecha`, `SGTL.fechaISO` |
| Montos y km (§7.3) | `SGTL.monto`, `SGTL.km`; los que se escriben: `SGTL.enlazarMascaraMonto`, `SGTL.montoCentavos`, `SGTL.formatearMontoCentavos` |
| Exportar (§1.2) | `SGTL.descargarCSV` |
| Datos de la empresa en un documento (§11) | `SGTLEmpresa.obtener(fechaDeEmision)` (`assets/static/js/empresa-datos.js`): `nombre` (el nombre comercial o la razón social), `lineas` (razón social, CUIT, domicilio, contacto) y `logo` (el de la empresa, listo para jsPDF, o `null`: va el nombre en texto); `SGTLEmpresa.medidaLogo` lo encaja sin deformarlo. Un documento ya emitido pasa su fecha de emisión; un borrador, `null` |
| Cambios para revisar (25/10 y 27/10, §33 y §43 de PENDIENTES) | `SGTLCambiosTarifa` (`assets/static/js/cambios-tarifa.js`): `cargar(filtro)` (solo lo que el usuario puede resolver), `de(lista, campo, id)`, `iconoPrecio(filas, etiqueta, opciones)` (el rojo de §4.3 al lado del estado, con el globito de `globo(filas, opciones)`: qué pasó y, en gris, dónde se resuelve), `aviso(filas, opciones)` (el amarillo de adentro: qué cambió y qué falta, §5.1), `avisoPrecio(contenedor, filas, opciones)` (el mismo aviso adentro del viaje o del presupuesto, con los botones para resolverlo ahí: "Actualizar el precio", "Mantener el precio", "Volver a Pendiente", "Ver la proforma") y `tarjetaFija(contenedor)` ("Cambios para revisar" en el dashboard: no se saca, desaparece si no hay nada y cada fila lleva a donde se corrige) |
| Precio por orden del día (27/10, §43 de PENDIENTES; §6.3) | `SGTLOrdenDelDia` (`assets/static/js/orden-del-dia.js`): `dibujar(contenedor, orden, { fecha, modo })` (el bloque del día y los avisos de lo que pasa al guardar, con lo que devuelve la API), `bloque(grupo, opciones)`, `avisos(lista)` y `textoGuardado(base, orden)` (el toast con lo que cambió en los otros viajes); estilos `.sgtl-dia` en `sgtl.css` |
| Control interno de los viajes (24/10) | Km al galpón de los orígenes y destinos: `SGTLGalpon.completar(opciones)` (`assets/static/js/galpon-km.js`, con Google Maps); el bloque "Recorrido completo y costo" de Ver detalle del viaje: `SGTLCostosViaje` (`assets/static/js/costos-viaje.js`, lo carga solo `viaje-detalle.js`) |
| Mostrar un permiso (§3.1) | `SGTLPermisos.texto(nombre)` (`assets/static/js/permisos-menu.js`): el texto de su opción del menú; `lista.sort(SGTLPermisos.comparar)` los ordena como el menú |
| Tableros del dashboard y de Tableros (§13) | `SGTLTableros` (`assets/static/js/tableros-catalogo.js`): el catálogo (`CATALOGO`, `TEMAS`), la tarjeta (`tarjeta(t, { estrella })`) y los favoritos (`leerFavoritos`, `guardarFavoritos`, `restablecer`); los datos los dibuja `dashboard.js`; estilos en `assets/static/css/tableros.css` |
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
- **Excepción, pantallas con pestañas** (orígenes y destinos, grupos y permisos): el
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
| Enviar por e-mail (comprobantes y proformas) | `bi-envelope` | `btn-outline-secondary` |
| Reenviar WhatsApp (viajes, en el lugar de los envíos) | `bi-whatsapp` | `btn-outline-secondary` |
| Cambiar estado (presupuestos, viajes) | `bi-flag` | `btn-outline-secondary` |
| Siguiente paso del circuito (Marcar aceptada, Emitir comprobante, Generar viaje) | el de cada acción | `btn-outline-success` |
| Activar / Inactivar | `bi-toggle-on` (está activo) / `bi-toggle-off` (está inactivo) | `btn-outline-secondary` |
| Eliminar / Anular | `bi-trash` / `bi-x-circle` | `btn-outline-danger`, siempre la última |

- El tooltip dice la acción con verbo: "Ver detalle", "Editar", "Ver PDF", "Enviar por e-mail", "Reenviar WhatsApp",
  "Inactivar", "Eliminar".
- **Reenviar WhatsApp** (viajes; Fede 26/10, Rocío 28/10): en Gestionar viajes, en el lugar de los envíos (después de
  Editar y antes de Cambiar estado). Siempre visible; habilitado solo con chofer y con el viaje Registrado o En viaje,
  que es cuando la hoja de ruta le sirve al chofer; si no, deshabilitado con el motivo. Pide confirmación (§5.2), que
  nombra al chofer, y reenvía la hoja de ruta aunque el envío automático del alta haya salido bien o haya fallado.
- **El ojo de un documento** (proforma, factura, recibo, nota de crédito o débito) abre el documento completo en
  solo lectura: título "Ver proforma 0001-00000017", "Ver factura FAC-00000012"; solo "Cerrar" en el pie
  (gestionar proformas, listar proformas y cuenta corriente, 22/10).
- **"Ver PDF"** abre la vista previa del PDF dentro del sistema (no en una pestaña nueva): título "Ver PDF del
  presupuesto" / "Ver PDF del comprobante FAC-00000012". Descargar PDF es el botón principal del pie.
- **En todos los comprobantes**, incluidos los tipos directos configurables y los recibos asociados, "Enviar por e-mail"
  va en la columna Acciones, después de "Ver PDF" (27/10). Abre el envío de ese comprobante. El pie de su vista previa
  es **Cerrar · Imprimir · Descargar PDF**; no incluye el envío.
- **En presupuestos**, "Enviar por e-mail" permanece en el pie de la vista previa:
  **Cerrar · Enviar por e-mail · Imprimir · Descargar PDF**.
- **En proformas**, "Enviar por e-mail" va después de "Ver PDF" en la columna Acciones de Listar y Gestionar
  proformas (27/10). Se puede enviar una proforma generada, aceptada o facturada; los borradores y las anuladas
  conservan la acción deshabilitada con el motivo. El pie del PDF sigue siendo **Cerrar · Imprimir · Descargar PDF**.
- **Al enviar un comprobante vinculado a una proforma**, el formulario muestra "Incluir proforma", marcado al abrir
  (27/10). Marcado, envía dos PDF separados; desmarcado, solo el comprobante. También contempla el vínculo histórico
  cuando se canceló el comprobante con un crédito y se anuló su proforma. Sin una proforma de origen vinculada,
  la casilla no aparece. La confirmación indica el destinatario y los documentos que se enviarán. El envío independiente
  de proformas utiliza el perfil de e-mail de Facturación y un asunto y cuerpo que identifican la proforma.
- **Si una acción no se puede hacer en esa fila, aparece deshabilitada y el tooltip dice por
  qué.** No se oculta: así todas las filas tienen los mismos botones en el mismo lugar.
- **Excepción en cuenta corriente (27/10):** «Imputar» solo aparece en créditos internos (tipos configurables de
  impacto crédito) y recibos. Se oculta en los demás tipos, incluidas facturas, débitos y notas de crédito.
  En créditos internos y recibos sin saldo, anulados o cancelatorios, permanece deshabilitada con el motivo.
- **Tooltip de Editar en cuenta corriente (27/10):** para los comprobantes que no son recibos dice únicamente
  «No se puede editar el comprobante». Los recibos anulados conservan «No se puede editar el recibo: está anulado».
- **Excepción en Gestionar tipos de comprobante (26/10):** en las tablas de sucursales,
  numeradores y tipos de comprobante, **Eliminar** solo aparece si el registro no tiene relaciones
  que impidan borrarlo. Cuando ya las tiene, el botón se oculta. La API vuelve a comprobar las
  relaciones al eliminar. Activar/Inactivar sigue siendo una acción distinta.
- **Cómo se escribe ese motivo** (23/10, Rocío, después de relevar los 28 textos que había, escritos de seis maneras:
  `docs/design-system/05-relevamiento-motivos-deshabilitados.md`). Una sola frase con la misma forma en todo el
  sistema, también en un botón del pie de un modal (§6.2) y en un enlace deshabilitado ("Editar cliente"):

  **"No se puede {acción} {sobre qué}: {qué le pasa a esta fila}"**, por ejemplo "No se puede eliminar el chofer: está activo".

  - **"No se puede" va primero:** se entiende de entrada que la acción no se va a poder hacer.
  - **La acción, con el verbo del botón y su objeto** ("eliminar el chofer", "emitir el comprobante", "cambiar el
    estado"): muchos botones son solo un ícono y la frase tiene que decir qué hacen. En el lugar del siguiente paso,
    aunque el circuito ya terminó, se nombra la acción de su ícono ("No se puede emitir el comprobante: ya se emitió
    FAC-00000012"); nunca un motivo suelto como "Primero generá la proforma" o "Sin pasos pendientes".
  - **El porqué dice qué le pasa a esa fila** (su estado, el documento en el que está, lo que le falta), no la regla
    general: "está activo", no "solo se eliminan los inactivos". Solo cuando el motivo es el tipo de la fila se dice
    la regla, salvo la excepción de Editar en cuenta corriente indicada arriba.
  - **No da órdenes** ("anulá la proforma", "emití una nota de crédito", "inactivalo"): destrabar algo puede tener
    consecuencias, y la persona lo decide sabiendo qué implica, desde la acción que corresponde. Lo que falta se dice
    como un hecho ("falta cargar N° entrega Rukas"). Los avisos que dejan algo pendiente sí dicen qué hace falta, con
    "es necesario que…" (§5.1).
  - **El número del otro documento, sí; el de la fila, no:** la proforma donde está el viaje, el presupuesto del que
    vino, la factura emitida, el viaje generado. El número de la fila ya se ve en la fila.
  - Minúscula después de los dos puntos, voseo y sin punto final (es un globito, como un título, §9). Lo que se ve
    como texto dentro de una ventana (la tarjeta de Cambiar estado) lleva punto.
  - El lector de pantalla lee lo mismo que el globito: `SGTL.botonFila` pone el motivo en el `aria-label`.

| Pantalla | Ejemplos |
|---|---|
| Choferes, camiones | No se puede eliminar el chofer: está activo |
| Viajes | No se puede editar el viaje: está en la proforma PF-0001-00000012 · No se puede eliminar el viaje: viene del presupuesto #12 · No se puede eliminar el viaje: está entregado · No se puede reenviar el WhatsApp: el viaje no tiene chofer asignado |
| Proformas | No se puede editar la proforma: ya se generó (o "está anulada") · No se puede marcar como aceptada: la proforma todavía es un borrador · No se puede emitir el comprobante: la proforma todavía no está aceptada |
| Proforma de Rukas (pie) | No se puede generar la proforma: hay 3 diferencias sin resolver |
| Presupuestos | No se puede generar el viaje: el presupuesto todavía no está aceptado |
| Cuenta corriente | No se puede editar el recibo: está anulado · No se puede anular la factura: se corrige con una nota de crédito |
| Sin permiso | No se puede editar el cliente: no tenés permiso |
- **Cambiar estado** (banderita, desde el 22/10): **mismo ícono, mismo color, mismo significado en todo el
  sistema.** Es gris porque es una acción de gestión: abre una ventana para elegir entre varios estados (para
  adelante, para atrás o rechazado). El **verde** queda solo para el paso puntual del circuito que se hace con un
  clic (Marcar aceptada, Emitir comprobante, Generar viaje), así hay uno solo por fila. Va antes del siguiente paso.
  Abre siempre la misma ventana "Cambiar estado del … #N" (`SGTL.opcionesEstado`): resumen, estado actual y
  los estados a los que puede pasar como tarjetas, cada una con su explicación; Cancelar + Guardar; si no se
  elige ninguno, "Elegí el estado nuevo.". Una tarjeta que no se puede elegir aparece gris con el motivo en rojo
  ("No se puede marcar: falta cargar N° entrega Rukas."). **Los datos que pide un estado van dentro de su
  tarjeta** y se ven solo al elegirla (en viajes, resultado, fecha y evidencia dentro de "Entregado"; con
  plataforma, resultado, fecha y evidencia opcionales dentro de "Listo para facturar"). Si esos datos se pueden corregir
  sin cambiar de estado (viaje ya entregado o listo para facturar), van arriba en "Datos de la entrega" y
  elegir un estado es opcional: volver a tocar la tarjeta elegida la desmarca. Si la fila no admite cambios
  (facturado, en una proforma emitida), la banderita queda deshabilitada con el motivo.
- El "siguiente paso" ocupa un solo lugar y cambia según el estado (en proformas: Marcar
  aceptada → Emitir comprobante). Si no hay siguiente paso, ese lugar queda deshabilitado con el
  motivo.
- No se usan: la "i" azul ni "Más detalles" (es el ojo), las flechas, el muñequito amarillo ni "Inactivar"
  con texto (es el interruptor o el siguiente paso, según corresponda).

### 1.5 Tooltips

- Todo botón de solo ícono lleva tooltip con el globito de Bootstrap (no el `title` suelto del
  navegador) y `aria-label` con el mismo texto.
- Se inicializan una sola vez desde el JS compartido, también para las filas que se dibujan
  después; las pantallas no los inicializan por su cuenta.

### 1.6 Fuera de las filas, con texto (22/10)

- **Solo ícono, únicamente en las acciones de cada fila de una tabla** (§1.4), donde se repiten en todas las filas y
  el espacio importa, y en herramientas que se entienden solas (exportar, recalcular la ruta). Llevan tooltip y
  `aria-label` (§1.5).
- **Cualquier otra acción lleva texto**, con ícono si ayuda: "Registrar viaje", "Traer viajes", "Volver a controlar",
  "Reemplazar Excel", "Editar cliente". En un celular los tooltips no aparecen y un ícono solo no se entiende; además,
  un lápiz solo se lee como "editar esto", aunque abra la edición de otra cosa (el cliente desde una proforma).

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
- **Tablas con grupos** (el control de la proforma de Rukas, pedido de Rocío, 22/10): las filas se agrupan por lo que
  hay que hacer con ellas.
  - Cada grupo empieza con una **fila de título** (`tr.sgtl-grupo`): fondo gris claro, una línea más marcada arriba
    (así se ve dónde empieza cada uno), la etiqueta del grupo con su color y la cantidad ("Para corregir en SGTL · 2")
    y, al lado, qué hacer, con la letra del texto y punto final (`.sgtl-grupo-ayuda`: "Corregí el viaje y volvé a
    controlar."). Lo que corresponde al grupo va ahí: "Reclamado el 21/10/2026: … Ver reclamo".
  - **El color va una sola vez, en ese título.** Cada fila dice qué pasa en texto, en un renglón y concreto ("Falta el
    remito", "Repetido en el Excel (filas 6 y 14)"), sin etiqueta de color; el texto completo, en el globito. Las
    filas que están bien dicen "Coincide" en gris, y su grupo va plegado si hay algo para resolver.
  - **Arriba de la tabla, un resumen en una línea de texto** (`.sgtl-resumen`): "**6 diferencias** ● 2 para corregir
    en SGTL ● 2 para revisar…", con un punto del color de cada grupo (`.sgtl-info-punto`); cada parte es un botón que
    lleva a su grupo (`.sgtl-resumen-item`). Lo que está bien no va en el mismo renglón que lo que falta resolver;
    si no hay nada para resolver, "● **Lista para generar**: los 12 transportes coinciden". A la derecha, solo la
    acción que sigue (por ejemplo, "Registrar reclamo").
  - Un dato que solo sirve en un caso va solo en ese caso: la tarifa con que se calculó el importe de SGTL aparece en
    gris debajo del importe únicamente cuando no coincide ("tarifa por km: 602,8 km × $ 2.594,00", "tarifa fija hasta
    130 km, 1ª vuelta").
- **Tablas anchas** (gestión de viajes): la columna de acciones queda **fija a la derecha** y
  siempre visible; lo que se desplaza hacia el costado son los datos. Fechas, números y estados
  no se parten en dos renglones (`text-nowrap`).

### 2.2 Qué muestran

- **Sin resultados, solo dos textos:**
  - pantallas con filtros: "No hay resultados para los filtros elegidos.";
  - pantallas sin filtros: "Todavía no hay … cargados." con lo que corresponda ("Todavía no hay
    camiones cargados.").
  - Sin resultados, la paginación no se muestra.
- **Mientras busca:** una fila "Cargando…" centrada en gris dentro de la tabla, en todas las
  pantallas. Reemplaza lo que había hasta que llega la respuesta.
- **Un solo contador:** el de la paginación ("1-15 de 577"). Nada de "N resultados" aparte. (La Hoja de ruta, que no
  tiene tabla ni paginación, muestra la cantidad en su selector: §10.)
- **Paginación** (`PaginacionSGTL`) en toda tabla que pueda pasar de 15 filas, también tarifas,
  orígenes y destinos y grupos. Las tablas de configuración (facturación, e-mail) no se paginan.
- **Columnas:** si la pantalla filtra por estado, la tabla muestra la columna Estado. La columna
  de acciones siempre se titula "Acciones".
- **Ordenación de tablas (26/10):** cuando una tabla permite ordenar, se elige con un clic o toque en el botón del
  encabezado de cada columna ordenable, con el texto de la columna y una flecha de Bootstrap Icons. No se agrega un
  selector de orden aparte. El primer clic ordena ascendente, el segundo descendente; al elegir otra columna empieza
  ascendente. `SGTL.tabla.habilitarOrden` actualiza la flecha y deja `aria-sort` solo en el encabezado activo; el
  `aria-label` del botón indica qué orden aplicará el siguiente clic. El orden se aplica a todos los resultados
  filtrados antes de paginar y se conserva al filtrar, cambiar de página y exportar. Hasta elegir una columna, se
  conserva el orden inicial de la pantalla.
  En Listar y Gestionar choferes se puede ordenar por DNI, apellido y nombre, o fecha de alta; en Listar y Gestionar
  camiones, por marca o fecha de alta. En Gestionar orígenes y destinos, ambas pestañas permiten ordenar por
  descripción, cliente, provincia o localidad. En Gestionar presupuestos, por número, fecha, cliente, ruta, km o
  importe. En Listar y Gestionar viajes, por número de viaje, cliente, fecha de inicio, fecha de fin, origen,
  destino, número de remito o cantidad de km. En Listar y Gestionar clientes, por CUIT, razón social o fecha de alta.
  En Listar y Gestionar proformas, por número, cliente, total, fecha o usuario; sus columnas se muestran en el orden
  Número, Cliente, Total, Fecha, Usuario, Estado, Acciones.
  En Gestionar cuenta corriente, la vista de movimientos permite ordenar por Cliente, Comprobante, Concepto, Fecha,
  Total, Cancelado o Saldo (27/10); Fecha va entre Concepto y Total. La API ordena los comprobantes principales antes
  de paginar; las aplicaciones permanecen debajo de su comprobante, en orden cronológico, para conservar el saldo
  progresivo. El mismo orden se usa en PDF y Excel. Con un cliente elegido, la columna Cliente no se muestra.
  Los recibos y los créditos internos emitidos con saldo disponible ofrecen el siguiente paso «Imputar recibo» o
  «Imputar crédito», con `bi-diagram-3` (27/10). El formulario tiene el mismo título que la acción y permite aplicar
  el saldo en partes a comprobantes del mismo cliente. En recibos, «Saldo sin imputar» muestra el remanente y la ayuda
  aclara que se puede emitir sin seleccionar deudas e imputar después.
  Las demás pantallas incorporan columnas ordenables cuando se definan.

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
| Tableros | (ítem principal: todos los tableros por tema; permisos de grupo independientes para Viajes, Flota, Choferes y Facturación, en la tarjeta Tableros de Permisos por grupo; §13) |
| Hojas de ruta | (ítem principal, nuevo 24/10, en plural desde el 27/10: la pantalla del chofer, pensada para el celular; permiso de grupo propio, que en la base sigue llamándose "Hoja de ruta", y un grupo de choferes que solo tiene ese; §10). El chofer entra directo desde el login y tiene el menú con el logo y solo esta opción, plegado al entrar (lo abre el botón de tres rayitas), sin la Documentación |
| Choferes | Listar choferes · Gestionar choferes |
| Camiones | Listar camiones · Gestionar camiones |
| Clientes | Listar clientes · Gestionar clientes |
| Viajes | Listar viajes · Gestionar viajes · Gestionar orígenes y destinos · Gestionar tarifas · Gestionar presupuestos |
| Facturación | Listar proformas · Gestionar proformas · Gestionar cuenta corriente · Gestionar tipos de comprobante (solo administradores; se mudó desde Configuración el 22/10) |
| Configuración | Gestionar e-mail · Gestionar integración de WhatsApp · Gestionar empresa (nueva, 23/10) · Gestionar contenido (toda la sección, solo administradores) |
| Usuarios | Listar usuarios · Gestionar usuarios · Gestionar grupos y permisos |
| Auditoría | (ítem principal) |
| Documentación | Consultar manual de usuario · Consultar informe de versión |

- **Ítems principales:** "Dashboard", "Tableros", "Hojas de ruta" y "Auditoría" quedan sin verbo.
- Los permisos del menú se resuelven por el archivo de cada pantalla (`sidebar-loader.js`), no
  por el texto: renombrar no cambia quién ve qué.
- **Los permisos se ven con el texto de su opción del menú** y en el mismo orden (23/10), en Gestionar grupos y
  permisos y en Listar usuarios → Ver detalle: "Listar choferes", "Gestionar cuenta corriente", "Auditoría". En la base
  siguen con su nombre de siempre ("Listado de choferes", "Cuenta Corriente"), que no se ve y no se renombra (pendiente
  a futuro). Los textos salen de `SGTLPermisos` (`assets/static/js/permisos-menu.js`): al agregar o renombrar una opción
  del menú, actualizar también `OPCIONES_DEL_MENU` ahí (`tests/permisos-menu.test.js` avisa si falta alguna o si no
  coincide con el menú).

### 3.2 Encabezado

- **Ícono de la sección del menú** a la izquierda del título, el mismo que tiene la sección en
  el menú (`bi-truck` en camiones, `bi-gear` en configuración).
- **Subtítulo de una línea en todas las pantallas**, que diga para qué sirve. Ejemplo: "Solo
  proformas ya generadas; los borradores están en Gestionar proformas".
- A la derecha, en la misma línea: exportar y después el alta (§1.1 y §1.2).
- **Pantallas de configuración con varias secciones** (Gestionar e-mail, Gestionar tipos de comprobante, Gestionar empresa
  desde el 24/10: datos para los documentos y galpón): una tarjeta
  con el título de la pantalla y una tarjeta por sección, con su título chico (`h6.card-title`) y una línea gris que dice
  para qué sirve. Cada sección guarda por su cuenta (su propio "Guardar" abajo a la derecha y, a la izquierda, "Última
  modificación: usuario · fecha"). Con una sola sección (Gestionar contenido, WhatsApp), el formulario
  va en la tarjeta del título, con el mismo pie.
- **Un formulario de configuración largo** puede ir en bloques lado a lado desde 992 o 1200 px, para que no quede todo
  uno debajo del otro (Gestionar empresa, 23/10: los datos fiscales en 2 × 2 con el logo al lado, y abajo domicilio y
  contacto). En tablet y celular, una columna.
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
- **Pantallas con pestañas** (orígenes y destinos, grupos y permisos): cada pestaña tiene
  sus filtros arriba de su tabla, y su botón de alta va al lado de "Buscar", a la derecha.
- **Estado como desplegable** "Activo / Inactivo / Todos", con Activo elegido al entrar. La cruz
  lo pasa a "Todos" (§1.3). Reemplaza las dos casillas Activo / Inactivo.

---

## 4. Estados (etiquetas)

### 4.1 Un color, un significado

| Color | Significa | Estados |
|---|---|---|
| Gris | Inicial, borrador o inactivo | Registrado, Borrador, Inactivo, Inicio de sesión, Cierre de sesión; en la tabla de tarifas (24/10): Anterior, Próxima |
| Azul | En curso | En viaje, Entregado, Sin carga (viaje, 27/10), Generada, Modificación (auditoría) |
| Amarillo | Falta algo para cerrar | Listo para facturar, Aceptada (lista para facturar), Parcial, Km manual; en el dashboard (21/10): Atrasado, Sin salir, Sin cerrar, Sin proforma, Sin evidencia, Por vencer (ITV) |
| Verde | Terminado bien o activo | Activo, Facturado / Facturada, Cancelado (comprobante pagado, en cuenta corriente), Aplicado, Alta, Completa (resultado de la entrega, 22/10), Vigente (tabla de tarifas, 24/10) |
| Rojo | Anulado, dado de baja, deuda o entrega rechazada | Anulada, Baja, Pendiente (deuda), Rechazo (resultado de la entrega, 21/10), Vencida (ITV, 21/10), Cancelado (viaje que no se hizo, 27/10) |

- Un estado nuevo se ubica en una de estas filas por lo que significa; no se inventan colores.
- **Presupuestos:** Pendiente es esperar la respuesta del cliente, no una deuda: va en gris.
  Aceptado va en amarillo mientras falta generar el viaje y en verde cuando ya se generó (con la etiqueta
  informativa "Viaje #N"); Rechazado, en rojo. Para estos casos `SGTL.estado(valor, texto, color)` recibe el color.
- **Viajes:** "Cancelado" es un viaje que no se hizo: va en rojo, como lo anulado (Rocío, 27/10). En cuenta corriente
  "Cancelado" es pagado y sigue en verde; por eso las pantallas de viajes usan `SGTL.estadoViaje`, que ya lo pone en rojo.
  Se cancela desde Cambiar estado, con motivo y solo desde Registrado; al cancelar se le avisa al chofer por WhatsApp y al
  reactivarlo se le reenvía la hoja de ruta (Fede, 28/10). Eliminar queda para un viaje cargado por error.
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
  (`bi-check-circle`) si está listo; si hay varias cosas a la vez, manda la más urgente (en proformas: el rojo si
  falta resolver algo, aunque también se espere a Rukas; el reloj, solo si esperar es lo único). Siempre con un texto
  adentro. Se cierra con otro clic o con Escape. Así están Gestionar viajes, Gestionar proformas y Gestionar
  presupuestos (el viaje que generó, 22/10).
- **Si lo que acompaña es otro estado** (el resultado de la entrega: "Parcial", "Con rechazo"), va como etiqueta
  debajo del estado, en su propio renglón (`<div class="mt-1">`), no una al lado de la otra (dashboard). En un título
  de modal van una al lado de la otra.

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
- **Error del login** (28/10, pedido del usuario): dentro del formulario, arriba de los campos, con
  `SGTL.avisoFormulario` y `alert alert-danger`, ícono y texto en negrita. La clase compartida
  `sgtl-aviso-animado` hace una sacudida de 380 ms al aparecer, una sola vez por intento; queda quieto
  después. Con `prefers-reduced-motion: reduce` se muestra sin animación. Lleva `role="alert"`.
  **Un error no se va solo** (Rocío, 28/10): queda hasta que se corrige el usuario o la contraseña (se va al escribir en
  cualquiera de los dos) y, si el próximo intento vuelve a fallar, aparece de nuevo. Solo se van solos los avisos de éxito.
  (`SGTL.avisoFormulario` todavía acepta `data-sgtl-duracion`, pero no se usa para errores.) El aviso de campos marcados
  conserva su comportamiento de validación, indicado abajo.
- **"Revisá los campos marcados." se va solo** cuando ya no queda ningún campo en rojo (25/10, `SGTL.avisoFormulario`).
  Un error de la API que es de un campo va debajo de ese campo, no arriba (por ejemplo, una fecha repetida).
- **Error que alcanza a varias cosas** (25/10, tarifas): una línea general con el total y, debajo, la lista agrupada por lo
  que sirve para corregirlo (`SGTL.avisoFormulario(aviso, texto, detalle)`), no "el primero y N más" ni una fila por cada
  cosa. Por ejemplo, al guardar una tabla de tarifas que dejaría viajes sin tabla: "No se puede guardar la tabla de
  tarifas: 4 viajes quedarían sin tabla." y, por cliente, "Distribuidora del Litoral S.A.: 3 viajes, del 20/10/2026 al
  23/10/2026". Hasta 5 renglones, los que más tienen primero, y al final "y N clientes más". Los renglones van sin punto.
- **Un aviso que deja algo pendiente** (27/10, Rocío; primero en el precio por orden del día) dice **qué pasa, por qué
  no se resuelve solo y qué hace falta**, hablándole a la persona con "es necesario que…": "Al guardar, el viaje #50
  queda como segundo del día y le corresponde $ 407.089,00. Como está entregado no se cambia solo, es necesario que
  revises ese viaje." Si lo que cambia lo ve el cliente, suma "es necesario que le avises al cliente" (o "que se lo
  envíes de nuevo"). El porqué va con "Como está…" (no "Al estar…": se repite el "al"). Vale para los avisos amarillos,
  las confirmaciones, los toasts y la línea gris del final de un globito ("Es necesario que lo revises en Ver detalle del
  viaje."). Los motivos de los botones deshabilitados siguen el §1.4: un hecho, sin "es necesario".
- **Adentro del documento, lo pendiente se resuelve ahí mismo** (27/10, "Precio para revisar"): el aviso amarillo arriba
  del detalle o del formulario, con el título en negrita ("Precio para revisar"), el texto con el tono de arriba y, debajo,
  botones chicos con texto para resolverlo ("Actualizar el precio" en azul, "Mantener el precio" en gris; "Ver la
  proforma" si se corrige en otro lado). Cada botón confirma (§5.2) y, al terminar, el toast dice cómo quedó y el detalle
  se vuelve a abrir con los datos nuevos (`SGTLCambiosTarifa.avisoPrecio`).
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
  - si hace falta un motivo (anular), se pide en un campo obligatorio dentro del mismo modal; si es opcional ("Mantener el
    precio"), el campo lleva un ejemplo adentro y, debajo, "Opcional. Queda en Auditoría.";
  - si la acción cambia otras cosas (guardar una tabla de tarifas recalcula viajes y presupuestos, §33 de PENDIENTES), el
    mensaje es **una sola línea que presenta la lista** ("Al guardar, pasa esto con los viajes y presupuestos de esta
    tabla.") y **la lista va dentro de la misma confirmación** (`detalle`, con `ancho: 'lg'`): una tabla con grupos (§2.1)
    según qué pasa con cada una ("Se recalculan · 5", "No cambian: quedan para revisar · 2", "Cambian de tabla, mismo
    importe · 3" con 'Pasa a "…"'), sin repetir en el mensaje
    las cantidades de los títulos. Cada fila: el dato principal con el segundo en gris debajo y, en "Qué hacer", solo lo
    que hay que saber o hacer, corto ("Anulá PF-00000006 y generala de nuevo.", "—" si no hay nada). La tabla se desplaza
    si es larga (`.sgtl-confirmar-lista`). Si no cambia nada más (ni un importe ni la tabla de un viaje o presupuesto: solo
    el nombre, por ejemplo), no se pide confirmación.
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
| Botón de alta y título de su modal | "Registrar chofer", "Registrar camión", "Registrar viaje", "Registrar cliente", "Registrar usuario", "Registrar grupo", "Registrar origen" / "Registrar destino", "Registrar tabla de tarifas", "Registrar proforma", "Registrar recibo", "Registrar configuración de e-mail" |
| Editar (tooltip y título del modal) | "Editar camión" |
| Ver detalle | tooltip "Ver detalle"; título del modal "Ver detalle del camión"; en un documento, "Ver factura FAC-00000012" (§1.4) |
| Emitir comprobantes (cuenta corriente) | menú "Emitir comprobante": "Emitir comprobante directo", "Emitir comprobante desde proforma", "Emitir crédito", "Emitir Débito". Directo, crédito y débito abren formularios con ese mismo título y botón principal; desde proforma lleva a Gestionar proformas, cuya acción y ventana dicen "Emitir comprobante" |
| Pie de los modales | "Cancelar", "Guardar", "Eliminar", "Generar", "Emitir recibo", "Cerrar" |
| Acciones de la fila | "Inactivar", "Activar", "Ver PDF", "Editar recibo", "Anular recibo", "Marcar como aceptada", "Emitir comprobante", "Exportar" |
| Confirmación | "¿Eliminar el camión ABC123?" |

- "Registrar proforma" crea el borrador; "Generar" le asigna el número. "Registrar recibo" abre el
  formulario; el botón del pie es "Emitir recibo". "Emitir comprobante" (siguiente paso de una proforma) abre la
  ventana "Emitir comprobante".
- **Emitir Débito interno (27/10):** ofrece «Comprobante interno relacionado» como selector opcional del mismo
  cliente, con «Sin vincular». Elegir un FC conserva los importes nuevos del débito; el vínculo se muestra en el
  detalle como dato de texto y en el PDF. Las fechas y la referencia se validan con las funciones compartidas.
- **Nada de sustantivos solos en botones ni títulos** ("Recibo", "Factura directa", "Tipos de comprobantes") ni
  de "Nuevo…" / "Nueva…".

### 6.2 Modales

- **Encabezado:** título `h5` (`modal-title`) y la cruz de Bootstrap (`btn-close`) siempre
  visible arriba a la derecha. Nada de íconos Feather (no se cargan y la cruz queda invisible).
- **Pie:** "Cancelar" gris claro (`btn btn-light-secondary`) y, a su derecha, el botón principal
  con el verbo: "Guardar" (`btn-primary`) en alta y edición, "Eliminar" / "Anular" en rojo
  (`btn-danger`), "Generar", "Emitir recibo". **Nunca "Confirmar".**
- **Un botón del pie que todavía no se puede usar** (22/10, primero en la proforma de Rukas) queda deshabilitado y
  su globito dice por qué con la misma frase que los de la fila (§1.4: "No se puede generar la proforma: falta elegir el
  Excel de Rukas", "No se puede generar la proforma: hay 3 diferencias sin resolver"): va en un
  `span.sgtl-envoltura-deshabilitado`. Nada de notas grises en el pie explicándolo. Un botón
  que en ese paso no hace nada distinto de otro no se muestra ("Guardar borrador" mientras elegir el Excel ya lo
  guarda).
- **Cerrar un formulario con cambios sin guardar** (25/10, decisión de Rocío sobre Gestionar proformas): no se cierra de
  una. Arriba del formulario, dentro del mismo modal, un aviso amarillo "Tenés cambios sin guardar. Si cerrás, se pierden."
  con "Seguir editando" (gris) y "Descartar cambios" (rojo). No se abre otra ventana encima: es como la confirmación de
  "Generar" de la proforma de Rukas, que también va dentro del modal. Es la función
  `SGTL.cambiosSinGuardar(modal, { activo })` (27/10, primero en Gestionar tarifas); Gestionar proformas todavía tiene
  su copia (`#avisoDescartarProforma`): pasarla a la función cuando se toque esa pantalla.
- **Detalle:** solo "Cerrar" en el pie, además de la cruz.
- **Cómo se arma un Ver detalle** (22/10, opción B de Rocío): con los mismos bloques que su formulario
  (`.sgtl-bloque` + `.sgtl-bloque-titulo`), en filas de a dos bloques que empiezan a la misma altura
  (`.sgtl-detalle-grilla`; uno ancho ocupa la fila con `.sgtl-detalle-ancho`) y en una columna en el celular. Cada dato
  lleva su nombre chico arriba y el valor en texto abajo (`.sgtl-dato`, `.sgtl-dato-etiqueta`, `.sgtl-dato-valor`); un
  dato vacío (también uno que llega solo con espacios) se ve "—". El estado va en el título, al lado del nombre ("Ver
  detalle del viaje #46" + la etiqueta), con las etiquetas informativas que correspondan. Abajo, en chico, quién lo
  registró y quién lo modificó (`SGTL.textoRegistro`; en usuarios, por ahora solo la fecha de alta: la API no manda el
  resto). Así están viajes (`viaje-detalle.js`, el mismo en Listar y Gestionar viajes y en el dashboard), choferes,
  camiones, clientes y usuarios. Los documentos (proforma, comprobantes) siguen el §1.4.
- **Los formularios no se cierran con un clic afuera** (`data-bs-backdrop="static"`); Escape y la
  cruz sí los cierran. Los de detalle se cierran también con un clic afuera.
- **Tamaño según el contenido:** `modal-lg` para formularios comunes; `modal-xl` solo con mapa o
  tablas (viajes, presupuestos, proformas, Ver PDF); el tamaño por defecto para confirmaciones. Las ventanas de
  emisión de cuenta corriente (comprobante, recibo y factura desde proforma) son `modal-xl` y además tienen el
  mismo alto (`sgtl-modal-formulario`, 22/10). Si la tabla de adentro no entra con aire, el modal puede ser más ancho
  que un `modal-xl`: `.sgtl-modal-ancho`, hasta 1440 px (la proforma de Rukas, 22/10).
- **Un archivo ya cargado** (el Excel de una proforma de Rukas) se ve en la misma franja con la que se eligió, con
  borde fino y fondo blanco (`.sgtl-zona-archivo.cargada`): ícono, nombre, qué trae y cuándo se cargó, y a la derecha lo
  que se hace con él ("Volver a controlar", "Reemplazar Excel").
- **Recuadro en lugar de franja** (`.sgtl-zona-archivo.sgtl-zona-recuadro`, 23/10, el logo de los documentos en
  Gestionar empresa): cuando el archivo va al lado de otro bloque. Mismos bordes y colores; la imagen (o el ícono), una
  línea de detalle y las acciones van centradas, en columna (`.sgtl-zona-imagen`, `.sgtl-zona-acciones`). Vacío dice qué
  pasa sin archivo ("Sin logo: sale el nombre en texto") y el botón es "Elegir logo"; cargado, "Reemplazar logo" y, al
  lado, el enlace rojo "Quitar logo". Lo elegido y todavía no guardado dice "Sin guardar".

### 6.3 Formularios

- **Obligatorios:** asterisco rojo al lado del nombre del campo (`<span class="text-danger">*</span>`).
- **"Guardar" siempre habilitado.** Al tocarlo con errores:
  - arriba del formulario, un aviso corto en rojo: "Revisá los campos marcados.";
  - cada campo con problema en rojo (`is-invalid`) con su mensaje debajo
    (`invalid-feedback`): "Completá el DNI.", "El DNI tiene que tener 7 u 8 números.";
  - el cursor va al primer campo con error.
- **El error debajo de un campo es corto** (26/10, Rocío): una línea si se puede. Si no es que falta o está mal escrito
  ("Completá el DNI."), **empieza por el dato y qué le pasa**, y después de los dos puntos lo justo para entenderlo:
  "Camión ocupado: viaje #45, de 08:00 hs a 11:30 hs.", "Chofer ocupado: …", "Fecha repetida: "Tarifas a agosto 2026"
  empieza el mismo día.". No repite el valor que ya se ve en el campo ni usa la frase de los motivos de los botones
  ("No se puede…", §1.4). Lo que necesita más (una lista, algo para cambiar en otro lado) va arriba, en el aviso del
  formulario (§5.1). Un choque entre campos (el camión y la hora del viaje) va debajo del dato que está ocupado, aparezca
  al elegirlo o al cambiar el otro.
- **Bloque del día** (27/10, precio por orden del día, §43 de PENDIENTES): lo que el sistema decide solo con otros
  registros se muestra, no se elige. Debajo de la tarifa, una línea gris dice por qué ("Se cobra como segundo viaje del
  día: ya está el viaje #44 a las 07:00 hs.") y, si hay otro viaje de ese cliente y recorrido ese día, el bloque
  (`.sgtl-dia`, hasta 560 px): una fila por viaje con el orden en un círculo (el de este viaje en azul, con la fila
  marcada), quién es con la etiqueta de lo que le pasa (§4.1: "Se actualiza" azul, "Para revisar" amarillo; en Ver
  detalle, su estado), la hora de inicio y el precio (con "antes $ …" o "le corresponde $ …" en gris). Debajo, el aviso de
  lo que va a pasar al guardar (§5.1). Lo dibuja `SGTLOrdenDelDia` con lo que devuelve la API.
- **Cada campo se valida al salir de él**, no en cada tecla, y el rojo se va apenas se corrige.
- **Opción vacía de los desplegables:** "Seleccioná un cliente" (voseo).
- **Listas largas** (cliente, chofer): el buscador compartido (`SelectClientePredictivo`), el mismo de los filtros. Enter
  elige la opción resaltada o, si lo escrito deja una sola, esa (25/10).
  Al hacer clic muestra la lista completa, que se recorre con la rueda o las flechas (Enter elige); escribir
  filtra por cualquier parte del texto (nombre, apellido o DNI). No hace falta saberse el dato de memoria (22/10).
  Una etiqueta de la opción ("Rukas") se ve en la lista y, elegida, adentro del mismo campo, no debajo.
- **Ayudas:** el texto gris dentro del campo es un ejemplo ("30111222"); las instrucciones van
  debajo, en chico (`form-text`): "Sin puntos ni espacios".
- **Formularios largos** divididos en bloques con subtítulo, como el recibo ("Datos generales",
  "Forma de pago"). El subtítulo es uno solo para todo el sistema: `<section class="sgtl-bloque">` con
  `<div class="sgtl-bloque-titulo">` (en negrita, con una línea fina debajo; viajes, 22/10). Mide 15 px, entre el título
  del modal (17,6 px) y la etiqueta de un campo (12,8 px): a 13 px se confundía con las etiquetas (Rocío, 23/10). Desde el 23/10 lo
  usan todos los formularios y detalles, también las secciones de una pantalla (e-mail, WhatsApp). **Nunca un `h6`**
  (la plantilla lo pinta de azul oscuro: así había quedado en choferes, camiones, clientes, usuarios, tarifas, orígenes
  y destinos, e-mail y auditoría) **ni un título de sección con estilo propio** (proformas y cuenta corriente tenían su
  copia). Si el subtítulo no va dentro de un `.sgtl-bloque`, el espacio de arriba lo da `mt-4` (o `mt-3` dentro de
  una columna, después de una tabla).
- **Grilla de valores** (la tabla de tarifas, 25/10): cuando los valores vienen de un documento (el PDF de tarifas de la
  empresa), la grilla tiene **la misma forma que el documento**, para cargarlos copiando fila por fila. Tarifas fijas: una
  tabla por modelo, la distancia en las filas y el tipo de camión en las columnas, con 1ª y 2ª vuelta solo en la primera
  banda. Lo que se usa distinto va en su propio bloque con una ayuda que dice cuándo se usa (las tarifas por km: "El
  precio por km se usa en dos casos: …"). Clase `.sgtl-grilla` (`table table-bordered align-middle`, la primera columna
  con `<col class="sgtl-grilla-fila">` y `--sgtl-grilla-columnas` con cuántas columnas de valores hay): columnas parejas
  que entran en un `.modal-xl`; más angosto, la grilla se desplaza hacia el costado en lugar de cortar los importes. El
  título que agrupa dos columnas va centrado; los demás, como su contenido (§2.1). Cada campo lleva un `aria-label` que
  dice qué valor es ("Furgón, modelo 2018 o anterior, hasta 130 km, 1ª vuelta").
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
  - **Dos tamaños de la misma pieza** (`htmlDatosCliente` en `gestion-facturacion.html`): completo en la proforma
    propia, cada dato con su nombre (razón social, CUIT, condición de IVA, domicilio, teléfono, e-mail); compacto en la
    de Rukas, donde lo principal es el Excel: una fila de cuatro columnas (Cliente · CUIT · Domicilio · Teléfono y
    e-mail) con el segundo dato en gris debajo (nombre comercial, condición de IVA, localidad y código postal, e-mail).
    Mismo recuadro, mismos nombres, mismo orden y el mismo "Editar cliente" (Rocío, 22/10).
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
- **Una hora sola dentro de un texto**, sin la fecha, lleva "hs" (sin punto): "de 08:00 hs a 11:30 hs" (Rocío, 26/10).
- Una sola función de formato en el JS compartido.

### 7.3 Montos y cantidades

- **"$ 1.234,56":** `$`, espacio, puntos de miles, coma decimal, **siempre dos decimales**
  (`Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`). A la derecha en las
  tablas (§2.1).
- **Excepción:** los indicadores del tablero se redondean a pesos ("$ 133.103").
- **Km con coma decimal y un decimal:** "17,4".
- **"km", en minúscula y sin "s"**, también en plural: "130 km", "17,4 km" (es el símbolo del kilómetro: no lleva
  plural ni punto). Nunca "Kms", "KM" ni "Km." en medio de un texto. Al principio de un título o etiqueta, con mayúscula
  como cualquier palabra (§9): "Km por mes", "Km recorridos" (Rocío, 25/10).
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
  Crédito"). La acción "Emitir Débito" de Cuenta corriente conserva la mayúscula pedida el 26/10,
  también en el título y el botón del formulario.
- **Títulos, botones y etiquetas sin punto final; los mensajes, con punto.**
- **Sin inglés a la vista:** "Alta" (no "Alta (INSERT)"), "Inicio de sesión" (no "Login"). En WhatsApp:
  "Token de acceso" e "ID del número de teléfono", con el nombre que usa Meta ("Access Token", "Phone Number ID") en la
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
- **Excepción: Hojas de ruta** (`hoja-de-ruta.html`, 24/10; la pidió Rocío para el celular del chofer). Es la única
  pantalla pensada primero para el celular:
  - **una tarjeta por viaje**, agrupadas por día con el subtítulo del sistema (`.sgtl-bloque-titulo`: "Hoy · sábado
    24/10/2026"): una columna en el celular y la tablet (hasta 760 px) y dos desde 1200 px, para no scrollear tanto
    (Rocío, 24/10). Arriba, un selector segmentado "Hoy y próximos · Anteriores" (§12) en lugar de filtros, con la
    cantidad de viajes de cada uno: "Hoy y próximos (6) · Anteriores (44)" (Rocío, 24/10). **Anteriores va por año**: al
    lado, "Año" con los años en que tiene viajes (arranca en el actual), y los viajes de a 30, del más nuevo al más
    viejo, con "Ver más viajes" al final; su cantidad es la del año elegido. El año cambia la lista al elegirlo, sin
    "Buscar": elige qué ver, como el período del dashboard;
  - **tarjetas cortas** (Rocío, 24/10), también en el celular: solo los datos que tienen valor, de a dos (de a tres desde
    576 px); el camión, solo con el dominio; "Ver mapa" y "Abrir en Google Maps" en un renglón, y los botones del pie
    lado a lado (en el celular se reparten el ancho);
  - **el chofer** (un usuario que solo tiene la Hoja de ruta) tiene el menú como todos, con el logo de SGTL, pero con
    solo "Hojas de ruta" y **plegado al entrar**: lo abre el botón de tres rayitas si quiere (Rocío, 24/10). No ve la
    Documentación. Entra directo desde el login o el enlace, y arriba sigue su nombre con Cambiar contraseña y Cerrar
    sesión. La oficina la ve en su menú, como siempre;
  - **los administradores y quien gestiona viajes** (Rocío, 27/10, punto 4 de la §41) eligen un chofer en un buscador
    ("Chofer", arriba) y ven su hoja de ruta **en solo lectura**: las mismas tarjetas, sin botones (los cambios se hacen
    en Gestionar viajes), y el subtítulo "Los viajes de {chofer}, para ver: los cambios se hacen en Gestionar viajes.".
    El enlace del WhatsApp les abre la del chofer de ese viaje;
  - en la tarjeta: horario, número de viaje y cliente, el estado (§4), el recorrido y los datos con `.sgtl-dato`. Un
    viaje de un día anterior que sigue en "Hoy y próximos" dice por qué con una etiqueta amarilla debajo del estado:
    "Quedó sin iniciar" o "Entrega sin registrar" (Rocío, 24/10; la oficina los ve en "Para revisar" como Sin salir y
    Atrasado). La **distancia** que ve el chofer es la del recorrido completo, la que hace de verdad: "Recorrido completo
    475,4 km" con "232,5 km de origen a destino" debajo en gris; sin los km al galpón, "Distancia" con "de origen a
    destino" (Rocío, 24/10). El **recorrido** (Rocío, 24/10): origen y destino con el mismo punto, unidos por una línea
    punteada, cada uno con su dirección debajo. Debajo, el **mapa con el recorrido dibujado**: abierto en el viaje que
    sigue (el que está en viaje o, si no hay, el primero de hoy) y con "Ver mapa" en los demás, para que la lista no sea
    un mapa tras otro; abierto, el mismo enlace dice "Ocultar mapa" y lo cierra. Con el
    galpón cargado, el mapa dibuja la vuelta completa (A galpón · B origen · C destino · D vuelta al galpón) y "Abrir en
    Google Maps" arranca desde donde está el chofer con lo que le falta, hasta el galpón (Rocío, 24/10);
  - las acciones van **abajo de la tarjeta y con texto** (§1.6): el siguiente paso en verde ("Iniciar
    viaje", "Registrar entrega") y "Reemplazar evidencia" con borde. La evidencia se sube al registrar la entrega
    (obligatoria), así que un viaje ya entregado solo ofrece reemplazarla; un viaje con plataforma no tiene botones (la
    entrega y el remito van a la plataforma). Lo que no se puede hacer queda deshabilitado con el motivo **escrito
    debajo** (§1.4), porque en el celular no hay globitos;
  - "Iniciar viaje" pide confirmación (§5.2) aunque no tiene efectos afuera: el chofer no lo puede deshacer (lo corrige
    la administración en Gestionar viajes). El texto (Rocío, 24/10): "¿Iniciar el viaje #53?" y solo el recorrido,
    "Planta Unquillo → Supermercado Río Cuarto.";
  - sin viajes: "No tenés viajes para hoy ni para los próximos días." o "No tenés viajes anteriores en 2026."
    (no hay filtros, §2.2);
  - las fotos de la evidencia se achican en el navegador (1600 px de lado, JPG) antes de subirlas;
  - "Cargar gasto" (control interno, 24/10) va en el pie de la tarjeta, con borde, en los viajes que ya empezaron; los
    gastos del viaje se ven en una **lista** (no en una tabla, que en el celular no entra) con "Ver ticket" y "Eliminar"
    con texto.
- Los tooltips no aparecen en pantallas táctiles: por eso todo botón de solo ícono lleva también
  `aria-label` (§1.5).
- **Modo oscuro: no.** Se sacan los estilos `theme-dark` sueltos de cuenta corriente.

---

## 11. Marca

- **Color de las acciones: el azul de Mazer** (`#435ebe`, `btn-primary`): Guardar, Editar,
  links, foco de los campos. El **verde** es para crear (`btn-success`, §1.1) y para el
  siguiente paso del circuito (§1.4).
- **El marco** usa los dos colores de la apariencia del sistema (Gestionar contenido):
  - el **color de fondo** es el color de la marca: la pantalla toma un tono muy claro de él y el
    color entero queda en una línea arriba de la barra (cambio del 22/10, §12); en el login pinta
    el panel de la izquierda. Si es tan claro que no se lee sobre blanco (contraste menor a 4,5, como el `#e4eef8` de
    antes), la línea, los íconos de los títulos, las pestañas y el paso actual toman el color del menú o, si tampoco se
    lee, el de fondo oscurecido (`gestionContenido.js`, 23/10);
  - el **color del menú** va en la opción elegida del menú, el círculo con las iniciales del usuario (arriba a la
    derecha; así lo dice la pantalla desde el 23/10), el botón del
    login y el subrayado de las pestañas (también las de cuenta corriente, que tenían `#008c9e`).
- **Tipografía: Nunito en todo**, también en el login (cambiado el 22/10; antes Inter).
- **Íconos: solo Bootstrap Icons.** Se sacan Font Awesome (CDN, en login e inicio), Feather y
  Boxicons.
- **SGTL es el sistema y la empresa lo usa** (Rocío, 23/10). Por eso hay dos pantallas en Configuración, cada una con su
  logo:
  - **Gestionar empresa** (`gestion-empresa.html`): los **datos de la empresa** que salen en los documentos (razón social,
    nombre comercial, CUIT, condición de IVA, domicilio, contacto) y el **logo para los documentos**. Ningún documento
    tiene el nombre de la empresa escrito: los PDF lo leen con `empresa-datos.js` (`SGTLEmpresa.obtener(fechaDeEmision)`).
    Sin logo de la empresa, el documento lleva el nombre en texto; nunca el de SGTL.
  - **Gestionar contenido** (`gestion-contenido.html`): la apariencia del sistema. El **logo del sistema** va en el menú y
    el login (la empresa puede poner el suyo si quiere ver su marca en el sistema), más el pie y los dos colores.
    Restablecer no cambia los documentos.
  - Los dos logos se ven como un archivo cargado (§6.2: el de la empresa en recuadro) con "Reemplazar logo"; ya no se
    pega una dirección web. "Restablecer"
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

- **Fondo:** tono muy claro del color de fondo de la apariencia del sistema (Gestionar contenido), con el color entero en una
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
    (las acciones de fila, de 32 px) y el ícono va en el centro exacto. La caja del ícono mide lo mismo que el
    ícono (`1em`): la plantilla le da 1rem fijo y, con otro tamaño de ícono, el dibujo quedaba corrido (22/10). Lo
    mismo dentro de un círculo (la zona del archivo, los pasos).
- **Avisos dentro de la pantalla** (`.alert`): fondo apenas teñido, borde fino e ícono, con los
  colores de §4.3 (información azul, éxito verde, advertencia amarillo, error rojo).
- **Avisos arriba a la derecha y confirmación:** tarjeta blanca con ícono de color (§5); con dos renglones o más, el
  ícono y la cruz quedan a la altura del primero (22/10), igual que en los avisos dentro de la pantalla; los modales
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

## 13. Tableros y gráficos (24/10)

Decidido por Rocío con la maqueta del 24/10. Lo usan el dashboard y la pantalla Tableros; el catálogo es uno solo
(`SGTLTableros`, tabla de funciones) y los estilos están en `assets/static/css/tableros.css`.

- **Pantalla Tableros:** todos los tableros en **pestañas por tema** (Viajes · Flota · Choferes · Facturación), con el
  mismo período que el dashboard. En cada pestaña, los indicadores en una fila y debajo el resto. Un tablero nuevo se
  agrega al catálogo, con su tema; no se arma una tarjeta suelta en una pantalla.
- **Permisos por tema** (Facu, 28/10): cada pestaña tiene su casilla en la tarjeta Tableros de Permisos por grupo. La
  tarjeta selecciona las cuatro y refleja la selección parcial, igual que las demás. Solo aparecen las pestañas y los
  favoritos de temas habilitados por los grupos del usuario; los administradores ven todo. El permiso general anterior
  deja de dar acceso y las cuatro secciones se asignan desde cero (§64 de `docs/PENDIENTES-SISTEMA.md`).
- **Estrella de favorito** (`.dash-estrella`): a la derecha del título de la tarjeta, después de "Hoy"/"Histórico".
  Llena y amarilla = está en el dashboard del usuario; vacía y gris = no. Tooltip "Agregar a mi dashboard" / "Quitar de
  mi dashboard". Se guarda al tocarla (toast con el nombre del tablero). En el dashboard se ve solo en Personalizar.
- **Dashboard:** muestra los favoritos del usuario; Personalizar los mueve, los agranda y los saca (la estrella), y
  "Agregar tableros" lleva a Tableros (deshabilitado con el motivo si no tiene el permiso). Quien todavía no eligió ve
  el dashboard de siempre; Restablecer vuelve a ese. Favoritos y lugar se guardan en la base, por usuario.
- **Alcance:** un tablero que no sigue el período lo dice en el título ("Hoy", "Histórico"), como desde el 21/10.
- **Comparar tres datos, nunca en 3D.** Dos formas:
  - **Mapa de calor** (dos categorías y un valor: km e ingresos por camión y por mes, facturación por cliente y por mes,
    recorridos origen × destino, rechazos por cliente y destino, antigüedad de la deuda): una tabla
    con el número en cada celda y el fondo en **un solo tono del azul de las acciones, de claro (poco) a oscuro (mucho)**
    (ocho pasos, `RAMPA_CALOR` en `dashboard.js`); sin dato, gris claro con "—"; un cero (o un negativo) con su número,
    en blanco. Última fila y última columna con los totales (en un porcentaje, el de la fila o la columna, no la suma),
    y debajo la escala ("Menos … Más (hasta …)") y, si hace falta, una nota de qué cuenta. El número va en azul oscuro
    sobre los pasos claros y en blanco sobre los oscuros. Si filas y columnas son de cosas distintas, la esquina lo dice
    ("Origen ↓ · destino →"). **Con pocos datos** (un % sobre menos de 3 entregas), la celda va más clara y la nota lo
    explica. Más de 8 filas o columnas: las 7 primeras y "Otros". En celular el nombre queda fijo y las celdas se
    desplazan.
  - **Gráficos chicos con la misma escala** (una categoría, el tiempo y un estado: viajes por cliente, mes y
    resultado): un gráfico por cliente con las barras apiladas en los colores del §4 (verde entregado, amarillo parcial,
    rojo con rechazo, gris pendiente), la leyenda arriba y, abajo, qué valor tiene la barra más alta. Los 6 primeros y
    "Otros clientes (n)".
  - Cada celda o barra tiene su globito con el detalle completo ("AB123CD · Agosto 2026: 7.559 km en 18 viajes").
- **Montos en un mapa de calor:** en la celda, abreviados ("$ 1,2 M", "$ 850 mil"); en el globito y en los totales,
  enteros con `SGTL.monto(valor, { sinDecimales: true })` (§7.3, excepción de los tableros).

---

## Apéndice A — Cambios de nombre del menú

Historia: cómo se llamaba cada opción y cómo quedó. Lo vigente es la tabla de §3.1.

| Antes en el menú | Antes en el título | Quedó |
|---|---|---|
| Listar proformas | Listar proformas generadas | Listar proformas |
| Cuenta corriente | Cuenta Corriente de Clientes | Gestionar cuenta corriente |
| Configuración → Facturación | Configuración de Facturación | Gestionar tipos de comprobante (22/10, idea de Facu; antes "Gestionar facturación") |
| Configuración → E-mail | Configuración de E-mail | Gestionar e-mail |
| Configuración → Gestión de contenido | Gestionar contenido | Gestionar contenido (23/10: solo la apariencia del sistema; ahora va después de Gestionar empresa) |
| — | — | Gestionar empresa (nueva, 23/10: datos y logo de la empresa para los documentos) |
| Configuración → Integración WhatsApp | Integración WhatsApp | Gestionar integración de WhatsApp |
| Auditoría | Auditoría del sistema | Auditoría (ítem principal, sin verbo; 20/10) |
| Viajes → Presupuestos | Gestionar presupuestos | Gestionar presupuestos (20/10) |
| Documentación → Manual de usuario | Manual de usuario | Consultar manual de usuario (20/10) |
| Documentación → Informe de versión | Informe de versión | Consultar informe de versión (20/10) |

