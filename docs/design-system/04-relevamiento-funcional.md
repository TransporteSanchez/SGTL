# Relevamiento funcional de pantallas — 19/10/2026

Lectura de las pantallas **ya subidas a `rocionuvoli`**, para anotar lo que no condice
entre módulos, lo que engaña al usuario y lo que se podría hacer mejor a nivel
operativo. No es un plan de implementación ni reemplaza `docs/PENDIENTES-SISTEMA.md`.

**Método:** código actual (HTML, JS y controllers). No es una recorrida en la VM ni
una sesión con Claudia. Donde un hallazgo ya está en pendientes o en el design
system, se marca **ya mapeado** y no se desarrolla como trabajo nuevo.

**Qué no cubre:** aplicar el design system al resto de las pantallas (eso ya está
cerrado en `docs/design-system/03-decisiones.md` y listado pantalla por pantalla en
el §10 de pendientes). Ese trabajo **hay que hacerlo igual**, además de lo de acá.

---

## 1. Cómo leer este documento

Cada hallazgo tiene un ID para poder citarlo después (`NAV-01`, `VIA-05`, etc.).

| Gravedad | Qué significa |
|---|---|
| **Alta** | Rompe una acción, contradice una regla ya decidida o muestra un dato falso. |
| **Media** | El usuario puede completar el trabajo, pero con fricción, datos incompletos o dos caminos distintos para lo mismo. |
| **Baja** | Pulido, consistencia o mejora de producto; no bloquea operación. |
| **Decisión** | No es un bug: hay que elegir cómo se quiere que funcione. |

Las mejoras son propuestas para analizar, no para hacer ya. Al final hay una
lista de **decisiones de producto** que conviene cerrar antes de bajar esto a
pendientes.

---

## 2. Lo que ya está mapeado (hacerlo igual, no es hallazgo nuevo)

La pasada visual del design system y varios bugs de las recorridas **siguen
pendientes**. Este relevamiento los da por conocidos. Se mencionan acá solo para
no reabrirlos como “descubrimiento”.

### 2.1 Design system — aplicar al resto (§10 de pendientes)

Piloto **OK en Choferes**. Falta el resto. Al aplicarlo, de yapa se corrigen
cosas que hoy se ven como problemas de uso: `alert()` / `confirm()`, botón
Limpiar, títulos que no coinciden con el menú, fechas en formatos distintos,
badges de estado de distinto color, CSV que baja solo 15 filas, “Confirmar” en
el pie de los modales, voseo mezclado con usted.

Eso **hay que hacerlo igual**, coordinando Facu y Fede en sus pantallas. No se
repite ítem por ítem acá. El detalle está en el §10 de
`docs/PENDIENTES-SISTEMA.md` y en `docs/design-system/03-decisiones.md`.

Al aplicarlo, conviene **no tapar** los hallazgos funcionales de este
documento: unificar botones no arregla, por ejemplo, que el listado de viajes
muestre IDs o que la ayuda de “Facturado” contradiga la regla de negocio.

### 2.2 Bugs y mejoras ya anotados en pendientes

| ID pendientes | Tema | Relación con este relevamiento |
|---|---|---|
| §2, F8 | Hora UTC / Argentina | Fechas en grillas, filtros y “vencida desde las 21:00”. No reabrir. |
| §5 | Desplegables con búsqueda (`choices.js`) | Localidad, clientes, choferes, camiones, OD, tarifas. Cubre parte de NAV/VIA/MAE. |
| §5 | Google Places en orígenes/destinos | Direcciones mal ubicadas y km. Cubre OD-03. |
| §6 etapas 4 y 6 | Guía de viajes sin proforma; N° de factura en Rukas | FAC-06 y FAC-29. Siguen en el plan de plataforma. |
| §6 etapa 3 | Filtro “Con reclamo pendiente” | FAC-08. Anotado como opcional. |
| §8 F1b, F2 | API sin token; Access Token de WhatsApp visible | ADM. Coordinar Facu/Fede. |
| §8 F5, F6, F7 | Bootstrap, detalle de listado-viajes, filtro login en listado-usuarios | VIA-01, NAV-04, ADM-40. |
| §8 F9, F13 | Tarifa km 2026 hasta 100 km; CUIT sin dígito verificador | TAR-01, MAE-CLI. |
| §8 F12, F16 | Errores de consola; DashboardLayout 404 | Dashboard. |
| §10 R1, R6 | CSV roto en listado-viajes y gestión-clientes; export camiones solo página visible | NAV-04. |
| §10 R4, §15 | “Cambiar contraseña” muerto; reenviar WhatsApp; aviso al eliminar viaje | ADM-07, VIA-10. |
| §13 | Observaciones en el viaje; altura OD con espacios | VIA-13, OD-04. Pendiente de decidir si el negocio lo necesita. |
| §8 O1–O3 | Guardar permisos reescribe todo; apellido sin guiones | ADM. |

---

## 3. Lectura rápida: ocho temas que más importan

Estos son los que, si se miran primero, ordenan el resto.

1. **Hay dos pantallas para cada entidad (Listar / Gestionar) y no se entiende
   para qué.** Solo el listado de choferes explica la diferencia. En viajes el
   listado no sirve para operar (sin estado, sin cliente, sin SAP/Rukas, detalle
   con IDs, CSV roto). El grupo “Listados” recibe una experiencia incompleta.
2. **La ayuda de “Facturado” en viajes contradice la regla ya decidida.** Dice
   que se marca al generar la proforma; el merge del 17/10 y el checklist dicen
   que pasa a Facturado **al emitir la factura**. Mientras tanto se ve “En
   PF-xxxx”. El botón de estado sigue habilitado con la proforma generada, y la
   API lo rechaza después.
3. **Chofer ↔ camión existe en la base y se muestra en los listados, pero no se
   puede asignar en ninguna gestión.** El texto de Listar choferes manda a
   Gestionar choferes “para cambiarlos”, y ahí no hay camiones. En el viaje,
   chofer y camión se eligen por separado, sin usar esa relación.
4. **El tipo de cliente (Directo / Con plataforma) es el eje del circuito y casi
   no se ve.** Está en la edición de clientes y en el combo de viajes (un
   “(Rukas)” al lado). No está en listados, no hay filtro, y el checklist pide
   revisarlo “antes de empezar”.
5. **Presupuestos está colgado de Viajes y no cierra el circuito.** Generar el
   viaje no manda WhatsApp (la gestión sí). No hay link al viaje. El menú no
   tiene permiso propio. El checklist operativo no lo menciona.
6. **Proforma propia y proforma de plataforma son dos circuitos en la misma
   pantalla.** Propia: Borrador → Generada → Aceptada → Facturada. Plataforma:
   Borrador → Aceptada (al generar). En Listar proformas no se ve Rukas ni
   reclamo. Faltan la guía de viajes sin proforma y el cierre con el N° de
   factura de Rukas (etapas 4 y 6, ya en el plan).
7. **El tablero y el login no reflejan el estado real del sistema.** “Camiones
   activos” cuenta todos. El gráfico de viajes mezcla años. El layout no se
   guarda (404). Un usuario inactivo puede entrar. El token vencido no corta la
   API (casi ningún endpoint lo pide).
8. **Casi no hay puentes entre pantallas.** De un viaje no se abre el cliente,
   de un presupuesto no se abre el viaje, de Listar no se abre Gestionar. La
   excepción útil es “Abrir viaje #N” en el control de Rukas.

---

## 4. Hallazgos detallados

### 4.1 Navegación: Listar vs Gestionar

El menú (`assets/static/js/sidebar-loader.js`) ofrece las dos entradas para
choferes, camiones, viajes, clientes, proformas y usuarios. Orígenes, tarifas,
presupuestos, cuenta corriente, grupos y auditoría tienen una sola.

| ID | Gravedad | Qué pasa hoy | Por qué importa | Mejora a analizar |
|---|---|---|---|---|
| **NAV-01** | Media / Decisión | Dos ítems de menú por entidad. Solo `listado-choferes.html` tiene subtítulo (“Consultá… para cambiarlos andá a Gestionar choferes”). El resto no orienta. | Quien tiene solo permiso de listados no ve alta/edición y no siempre entiende por qué. Quien opera entra al listado por costumbre y no encuentra las acciones. | Decidir si se mantienen dos pantallas. Si sí: subtítulo en todas (como choferes) + enlace “Gestionar este…”. Si no: una sola pantalla, con acciones según permiso. |
| **NAV-02** | Media | Los listados de viajes, camiones, clientes y usuarios **no tienen las mismas columnas ni los mismos filtros** que su gestión. Viajes es el caso más grave (ver VIA-01 a VIA-04). | El mismo viaje/cliente “se ve distinto” según por dónde se entre. | Alinear columnas y filtros operativos, o dejar el listado explícitamente como consulta pobre y no usarlo en operación. |
| **NAV-03** | Baja | Presupuestos se inyecta en el menú si el usuario tiene `gestion-viajes.html`, sin ítem propio en `MENU`. Cuenta corriente se inyecta si hay proformas. | El permiso de menú no coincide con lo que se ve. No se puede dar presupuestos sin viajes, ni al revés. | Permiso propio en el catálogo. |
| **NAV-04** | Alta | Botón de exportar en **Listar viajes** y **Gestionar clientes** llama a `generarReporteCSV()`, que **no existe** en esas páginas. En Listar camiones / Listar clientes / Gestionar viajes / Gestionar camiones sí está. | Expectativa rota: el botón está y no hace nada (error en consola). | **Ya mapeado R1.** Al pasar a `SGTL.descargarCSV` se arregla; no dejar el botón si la función no está. |
| **NAV-05** | Media | No hay puente Listar → Gestionar. Gestión de viajes ya abre un viaje con `?viaje=N` (lo usa la proforma de plataforma). Los listados no lo aprovechan. | Quien consulta no puede seguir a editar sin buscar de nuevo. | Botón “Gestionar este …” → `gestion-viajes.html?viaje=ID` (y el equivalente en las otras entidades). |

**Qué está bien:** la idea “consulta vs ABM” tiene sentido para un grupo Listados.
El problema no es tener dos pantallas, es que el listado de viajes (y en menor
medida clientes) no cumple ni como consulta.

---

### 4.2 Viajes

Pantallas: `gestion-viajes.html`, `listado-viajes.html`. Regla de negocio:
`docs/negocio/CHECKLIST-OPERACION-VIAJES.md` y merge §9 de pendientes.

| ID | Gravedad | Qué pasa hoy | Por qué importa | Mejora a analizar |
|---|---|---|---|---|
| **VIA-01** | Alta | En Listar viajes, “Más detalles” muestra `OrigenID`, `DestinoID`, `ClienteID`, `ChofCamID`, IDs de tarifa. La grilla sí muestra nombres de origen/destino. No hay chofer, camión ni estado. | Quien solo lista no ve el viaje real. | **Ya mapeado F6.** Completar el detalle con los mismos datos de gestión, o redirigir a gestionar. |
| **VIA-02** | Media | Gestión muestra cliente, SAP, entrega Rukas, estado, badge “En PF-xxxx”, evidencia. Listado: fechas, origen, destino, remito, km. Sin cliente, sin estado, sin referencias Rukas. | El checklist pide buscar por lo que manda Marfrig: eso solo existe en gestión. | Mismos filtros y columnas operativas en ambas, o documentar que operación es solo gestión. |
| **VIA-03** | Media | Filtros de gestión: N° viaje, estado, cliente (select), remito/transporte/entrega. Listado: rango de fechas + cliente autocomplete. Sin estado ni referencia. | Misma entidad, dos buscadores. El autocomplete del listado es mejor que el select de gestión cuando hay muchos clientes. | Unificar filtros; el select de cliente de gestión entra en §5 (búsqueda al escribir). |
| **VIA-04** | Alta | CSV de listado-viajes: ver NAV-04. | — | **Ya mapeado R1.** |
| **VIA-05** | Alta | Ayuda del estado Facturado: *“Incluido en una proforma generada (se marca solo al generarla).”* (`gestion-viajes.html`, `AYUDA_ESTADO`). Un comentario más abajo todavía dice que Facturado lo pone y lo saca la proforma. | Contradice la decisión del 17/10 y el checklist: Facturado **al emitir la factura**. Mientras está en PF generada/aceptada se ve “En PF-xxxx” y el viaje conserva Listo para facturar / Entregado. | Reescribir la ayuda y el comentario. Texto candidato: “Se marca solo al emitir la factura. Mientras está en una proforma generada o aceptada se ve En PF-xxxx y no se edita.” |
| **VIA-06** | Alta | Editar se deshabilita si el viaje está en proforma Generada/Aceptada o facturado, con tooltip. **Estado y entrega sigue siempre clickeable.** El modal solo se bloquea si el estado ya es Facturado. La API rechaza el cambio si está en PF emitida (`ViajesController`). | El usuario completa el modal y recién ahí ve el error. Editar ya avisaba. | Deshabilitar Estado con el mismo criterio y tooltip que Editar. Si está facturado, el texto actual del modal está bien. |
| **VIA-07** | Media | El combo de camión trae todos los no Eliminados, **incluye Inactivos**. `ValidarViaje` no lo rechaza. Choferes sí se buscan con otro criterio (autocomplete). | Se puede asignar un camión dado de baja operativa. | Filtrar `EstadoCamion == 'Activo'` o validar en API. |
| **VIA-08** | Baja | Cliente en gestión: select completo. En listado: autocomplete. Chofer en el modal: sí busca. Camión y origen/destino: no. | Inconsistente; con muchos clientes el select de filtro se hace largo. | **Ya mapeado §5** (choices.js). Mientras tanto, reutilizar el buscador de clientes de Facu. |
| **VIA-09** | Media | WhatsApp se manda al guardar un viaje nuevo (gestión). No hay reenvío. Generar viaje desde presupuesto **no llama** a la notificación (`PresupuestosController` `{id}/viaje`). | Si el envío falla, o si el viaje nació de un presupuesto, el chofer no tiene hoja de ruta hasta que alguien edite y vuelva a guardar. | **Reenvío ya mapeado §15.** El hueco del presupuesto es nuevo: o se notifica al generar, o se avisa “este viaje no se le mandó al chofer”. |
| **VIA-10** | Decisión | Evidencia: el checklist de directos la marca como recomendada. La UI pregunta con `confirm()` si falta; la API no la exige. | Coherente con “recomendado”, pero se pueden dejar directos Entregados sin constancia. | Decidir si se exige (API + UI) o se deja la recomendación, sin `confirm()` nativo cuando se unifique el design system. **Decidido el 22/10: obligatoria en directos, con cualquier resultado (API + pantalla).** |
| **VIA-11** | Baja | No hay campo Observaciones en el viaje (tampoco en el modelo que usa la pantalla). Proformas, facturas y recibos sí tienen. | No hay dónde dejar una nota operativa ni marcar un registro de prueba. | **Ya mapeado §13** como pendiente de decidir si el negocio lo necesita. |
| **VIA-12** | Media | El circuito Rukas oculta SAP / entrega y salta de Registrado a Listo para facturar. El directo va Registrado → En viaje → Entregado. Eso está bien y alineado al checklist. Lo que falla es el texto de Facturado (VIA-05) y el botón de estado (VIA-06). | — | No cambiar el flujo; sí los textos y bloqueos. |
| **VIA-13** | Baja | En un viaje Listo para facturar de cliente plataforma, la distancia se cambia con Recalcular, no a mano (salvo que Google falle). Es así por diseño (reporte 19/10). | Puede sorprender si se quiere corregir un km sin tocar Google. | Dejarlo; documentarlo en la ayuda del campo. |

**Qué está bien:** mostrar/ocultar campos según tipo de cliente; badge “En
PF-xxxx”; bloqueo de viajes de presupuesto (cliente, ruta, km, tarifa) con aviso;
deshabilitar Eliminar en viajes de presupuesto y en los que están en un
borrador; deep link `?viaje=N` desde Rukas.

---

### 4.3 Choferes, camiones, clientes, orígenes y tarifas

| ID | Gravedad | Qué pasa hoy | Por qué importa | Mejora a analizar |
|---|---|---|---|---|
| **MAE-01** | Alta | Existe `CHOFER_CAMION` (cédula incluida). Los **listados** de choferes y camiones la muestran en el detalle. **Ninguna gestión** la carga ni la edita: la API solo tiene GET. El subtítulo de Listar choferes dice “para cambiarlos andá a Gestionar choferes”. | Camino muerto. El usuario va a gestión a asignar camiones y no puede. En el viaje, chofer y camión se eligen por separado, así que esa tabla no opera. | O bien: ABM de asignación en choferes o camiones (y usarla al armar el viaje: al elegir chofer, filtrar camiones). O bien: sacar la mención de los listados y el subtítulo, y tratar la tabla como legado. |
| **MAE-02** | Media | Gestionar choferes filtra por DNI / fechas / estado. Listar choferes filtra por nombre / apellido / DNI. La API de búsqueda ya acepta nombre y apellido. | En gestión no se encuentra un chofer por nombre. | Mismos filtros en ambas (el piloto de design system no los unificó). |
| **MAE-03** | Media | Gestionar y Listar clientes filtran por CUIT, fechas y estado. La API `Clientes/Buscar` acepta `razonSocial` y la UI **no la manda**. | Operación cotidiana es buscar “Quickfood” / “Marfrig”, no el CUIT. | Campo razón social en ambas pantallas. |
| **MAE-04** | Alta | Tipo de cliente (Directo / Con plataforma) solo está en el alta/edición de gestión. Listado: ni columna ni detalle. Sin filtro. | El checklist lo pide revisar al empezar. Un error de tipo cambia todo el circuito del viaje y de la proforma. | Columna + detalle + filtro. En viajes ya se ve un “(Rukas)” en el combo; llevar eso a clientes. |
| **MAE-05** | Baja | Código postal (Facu) está en gestión y no en el detalle del listado. Condición fiscal en el detalle puede verse abreviada (“RI”) y en gestión en texto. | Mismo cliente, dos fichas. | Alinear el detalle del listado al GET de gestión. |
| **MAE-06** | Media | Teléfono de cliente es `type="number"`: flechitas, no admite espacios ni guiones, y un número largo se pisa con notación científica en algunos navegadores. | Dato de contacto difícil de cargar. | `type="tel"` con máscara o texto; validar dígitos al guardar. |
| **MAE-07** | Baja | CUIT: se valida el formato `XX-XXXXXXXX-X`, no el dígito verificador. | **Ya mapeado F13.** Hacerlo después del merge con Facu (la pantalla es compartida). | — |
| **MAE-08** | Media | Orígenes y destinos: una sola pantalla, sin filtros, sin paginación, carga todo. Tarifas: igual (dos pestañas, todo el listado). | Con muchas plantas o tarifas se hace impagable encontrar una ruta. Una tarifa huérfana (F9) se detecta tarde. | Filtro por cliente / descripción / vigencia; paginación (`PaginacionSGTL`). El design system ya pide paginar estas tablas (§2.2 de decisiones). |
| **MAE-09** | Media | Combo de camión en viajes incluye inactivos (VIA-07). Checkboxes Activo/Inactivo en camiones: si se destildan los dos, el filtro de estado se omite (queda “todos” sin decirlo). | Confunde con “no hay resultados”. | El design system ya pasa estado a desplegable Activo / Inactivo / Todos. Aplicarlo también acá (§10). |
| **MAE-10** | Baja | Altura de calle en OD es `char(10)`: vuelve con espacios. | **Ya mapeado §13.** Recortar al leer. | — |
| **MAE-11** | Media | Si no hay tarifa para la ruta, el viaje avisa. No dice *por qué* (cliente distinto en el origen, tarifa vencida, km fuera de banda). La banda 2026 de km llega a 100. | El operador no sabe si ir a tarifas o a OD. | **F9 ya mapeado** (dato). En UI: mensaje que cite cliente + origen + destino + vigencia, con enlace. |
| **MAE-12** | Decisión | No hay “Listar” de orígenes, tarifas ni presupuestos. Usuarios de solo consulta no tienen vista readonly. | Depende de si esos maestros los ve el grupo Listados. | Ocultar acciones por permiso en la misma pantalla, o no dar el menú. |

**Qué está bien:** el piloto de choferes (título, alta, cruz de filtros, toasts,
confirmación de baja, exportar todo lo filtrado). Es el modelo a copiar, no
solo visualmente: también en filtros y subtítulos.

---

### 4.4 Presupuestos

Pantalla de Facu: `presupuestos.html`. Avisar antes de tocar.

| ID | Gravedad | Qué pasa hoy | Por qué importa | Mejora a analizar |
|---|---|---|---|---|
| **PRE-01** | Media | Generar viaje desde un presupuesto aceptado crea el viaje y **no notifica por WhatsApp**. Guardar el mismo viaje en gestión sí notifica. | El chofer del presupuesto no recibe el aviso hasta un segundo guardado. Coordinar con Fede. | Llamar la misma notificación al generar, o un aviso explícito “el viaje se creó y no se le mandó al chofer”. |
| **PRE-02** | Baja | La columna Viaje muestra `#N` sin enlace. Gestión ya soporta `?viaje=N`. | Hay que copiar el número y buscarlo. | Link a `gestion-viajes.html?viaje=N`. |
| **PRE-03** | Media | Km del presupuesto se cargan a mano. En viajes se calculan con Google (o a mano si falla). Al generar, los km del presupuesto quedan fijos (correcto, §13). | La cotización y el viaje pueden nacer con km distintos si no se usa la misma ruta. | Reutilizar el cálculo de ruta en presupuesto, o una nota “estos km se copian al viaje y no se recalculan”. |
| **PRE-04** | Baja | Chofer es opcional al guardar el presupuesto y obligatorio al generar el viaje. | Paso extra correcto, si se entiende. Si el presupuesto ya tenía chofer, preseleccionarlo. | Preselección + validación. |
| **PRE-05** | Baja | Presupuestos no muestra tipo de cliente. Un presupuesto de Quickfood después exige SAP/Rukas en el viaje. | El comercial puede cotizar sin internalizar el circuito Rukas. | Badge Directo / Rukas en grilla y modal. |
| **PRE-06** | Baja | El checklist operativo de viajes no menciona presupuestos. | Queda un camino comercial huérfano en la guía. | Agregar un paso opcional: presupuesto aceptado → generar viaje → sigue el flujo directo o Rukas. |
| **PRE-07** | Baja | PDF del presupuesto: prestador “Transporte Sánchez” sin CUIT ni dirección. Avisos propios en lugar de `SGTL`. | **PDF: validar con Facu** de dónde salen esos datos (§13, quedó afuera a propósito). Avisos: van con la pasada del design system de Presupuestos. | — |

**Qué está bien:** no se puede editar ni borrar un presupuesto que ya generó
viaje; el viaje heredado no deja cambiar cliente/ruta/km/tarifa; “Traer viajes”
usa el importe del presupuesto aceptado.

Cuidado (ya visto en pruebas): para verificar de verdad el importe hace falta un
viaje cuyo presupuesto **no coincida** con la tarifa vigente. El #28 es un
candidato si se le cargan remito y transporte.

---

### 4.5 Proformas, facturación y cuenta corriente

Pantallas de Facu en su mayoría. Coordinar. El circuito propio está decidido en
el §9 de pendientes; el de plataforma, en `docs/negocio/PROFORMA-CLIENTES-RUKAS.md`
y `docs/diseno/proforma-rukas-diseno.md`.

| ID | Gravedad | Qué pasa hoy | Por qué importa | Mejora a analizar |
|---|---|---|---|---|
| **FAC-01** | Media | Proforma **propia**: Generar deja estado Generada. Emitir factura exige Aceptada. Hay un paso “Marcar como aceptada” en el medio. Plataforma: Generar deja **Aceptada** de una. | “Generé y no me deja facturar” es un malentendido esperable. Dos circuitos en el mismo modal. | Copy en el modal según tipo. Opcional: “Generar y aceptar” para propias, si el negocio no necesita el paso de revisión. |
| **FAC-02** | Media | Listar proformas (`listado-facturas.html`) no carga el JS de plataforma: sin badge “Rukas 990100”, sin ícono de reclamo, sin tipo. Gestión sí. | Quien entra por el listado no ve el trabajo de conciliación. El archivo se llama `listado-facturas` y lista proformas. | Reutilizar etiqueta/reclamo del listado de gestión. Renombrar el archivo queda para no romper favoritos (redirect). **Nombre de menú ya mapeado §10.** |
| **FAC-03** | Media | Filtro “Con reclamo pendiente”: no está. El ícono en gestión sí. Filtro por tipo (Propia / Plataforma): no está. | **Ya mapeado §6** como opcional. Tiene sentido operativo para la mesa. | Checkbox o filtro en la query. |
| **FAC-04** | Media | Guía “viajes con números cargados, todavía sin proforma” (`GET ViajesSinProforma`): diseñada, **no implementada**. | **Ya mapeado, etapa 4.** Es el paso 0 antes de armar la tanda en Rukas. | Seguir el plan. |
| **FAC-05** | Media | Cargar el N° de factura que figura en Rukas: diseñado, **no implementado**. | **Ya mapeado, etapa 6.** Sin esto, el cierre operativo de esas proformas queda a medias. | Seguir el plan. |
| **FAC-06** | Baja | En un borrador de plataforma abierto, todo el modal queda de solo lectura, también forma de pago y vencimiento. Esos datos viajan en el primer Importar. | Si hay que ajustar plazo antes de facturar, no hay cómo sin reimportar. | Dejar editables las condiciones comerciales del borrador, o documentar que se definen al importar. |
| **FAC-07** | Baja | Borrador propio: solo Cliente es obligatorio. Si no se carga período, se guarda **hoy–hoy** en `FechaDesde`/`FechaHasta` (no admiten nulos). “Traer viajes” puede no encontrar nada y no se entiende por qué. | Silencioso. La regla del §9 es correcta; falta el aviso. | Al guardar sin período, decir “se usó la fecha de hoy para el período”. Validar período al Traer viajes (ya se pide en pantalla). |
| **FAC-08** | Baja | Traer viajes arma líneas en el modal; no reserva en base hasta Guardar borrador. Cancelar pregunta si hay cambios (bien, §13). | Se puede perder el trabajo si no se guarda. | Tras Traer viajes, un aviso corto: “Guardá el borrador para reservar los viajes.” |
| **FAC-09** | Baja | Advertencias de Traer viajes listan IDs (“#31 sigue en Registrado”). En el control Rukas, la línea tiene “Abrir viaje #N”. | Hay que copiar el número y buscarlo. | Links `gestion-viajes.html?viaje=N` también en las advertencias de propias. |
| **FAC-10** | Media | Si un presupuesto aceptado tiene JSON de importe inválido, **todo** Traer viajes del período falla (excepción). | Un viaje malo tumba la tanda. | Omitir ese viaje y advertir con el #. |
| **FAC-11** | Baja | Export Excel/PDF de proformas: sin tipo ni N° de plataforma. | No se cruza con Rukas desde el archivo. | Columnas Tipo + N° plataforma. |
| **FAC-12** | Baja | Totales de IVA del control Rukas se calculan en JS (`Math.round`). El backend redondea al final sobre el acumulado. | Riesgo de 1 centavo de diferencia entre preview y factura. En el diseño se verificó que el backend coincide al centavo con la factura fiscal. | Mostrar en el modal los totales que devuelve la API, no recalcularlos. |
| **CC-01** | Media | “Limpiar” en cuenta corriente **vuelve a últimos 30 días**, no deja el rango vacío. El export, si las fechas están vacías, sí dice “Sin límite”. | El usuario cree ver todo el historial y exporta un mes. **El design system ya dice:** borrar la fecha = sin límite (§10 CC). Hoy Limpiar no cumple esa regla. | Vaciar `ccDesde`/`ccHasta` al limpiar; default 30 días solo al entrar. |
| **CC-02** | Baja | Saldo que se ve al expandir una factura es el saldo **de ese comprobante**, no el saldo de la cuenta. | Puede leerse como saldo contable. | Etiqueta “Saldo del comprobante”. |
| **CC-03** | Baja | Emitir FAC/NC/REC pide JWT; listar proformas no. Con sesión vencida la grilla sigue y emitir falla. | **Ya mapeado F1b.** En operación, validar sesión al abrir el modal de emitir. | — |

**Qué está bien:** no se puede registrar proforma propia para un cliente con
plataforma; reserva de viajes también en borrador; anular Generada/Aceptada
libera viajes; NC cancelatoria los libera (implementado, el texto viejo de
pendientes puede estar desactualizado); aviso de cambios sin guardar en el
modal; “Se agregó 1 viaje.” / “Se agregaron N viajes.”; enlace desde CC a
proformas aceptadas (`?estado=Aceptada`).

---

### 4.6 Inicio, login, usuarios, permisos y documentación

| ID | Gravedad | Qué pasa hoy | Por qué importa | Mejora a analizar |
|---|---|---|---|---|
| **ADM-01** | Alta | Login no mira `EstadoUsuario`. Un usuario inactivo entra. Documentación después exige Activo y falla. | Baja lógica que no baja la sesión. | Rechazar el login si no está Activo, con mensaje claro. |
| **ADM-02** | Alta | Casi ningún endpoint valida el JWT. El front redirige al login al **cambiar de página** si el token venció (30 min), pero los AJAX de la misma pestaña siguen andando. | **Ya mapeado F1b.** La sesión de la UI y la de la API no son la misma. | No reabrir acá; sí tenerlo en cuenta para la tesis. |
| **ADM-03** | Media | Usuario inactivo aparte (ADM-01). Mensajes de login distintos para “usuario no existe” y “contraseña incorrecta”. | Se puede averiguar qué logins existen. `CambiarContrasena` tiene el mismo patrón. | Mensaje genérico. **Cambiar contraseña ya mapeado §15.** |
| **ADM-04** | Baja | “Cambiar Contraseña” en el encabezado es un link a `#`. | **Ya mapeado R4 y §15.** | — |
| **ADM-05** | Media | Si falla `MenusPermitidos`, el menú se muestra **completo** (`catch` vacío). El GET de menús no exige que el caller sea ese usuario. | Fail-open + F1b. | Fail-closed para no admin; Bearer + coincidencia de usuario. |
| **ADM-06** | Media | Configuración (contenido, e-mail, WhatsApp, facturación) se reserva a `rol === 'admin'` en el front, **además** del permiso de grupo. Un User con permiso de “Gestionar contenido” ve el ítem y al entrar lo echan a inicio. | Dos reglas distintas (rol vs menú). | Una sola: o es siempre admin, o vale el permiso de grupo. El dashboard también oculta el botón de contenido por rol y el RBAC puede volver a mostrarlo. |
| **ADM-07** | Media | Widget “Camiones activos”: cuenta `data.length` (todos los no eliminados) y pinta la barra al 100 %. Choferes sí filtran `EstadoChofer == 'Activo'`. | Número falso. | Misma lógica que choferes, o renombrar a “Camiones cargados”. |
| **ADM-08** | Media | Gráfico de viajes: agrupa por mes 1–12 de **todos** los años. Calendario pide `GET /Viajes` completo y no abre el viaje al hacer clic. Layout: `DashboardLayout` **no existe** (404); guardar traga el error. | **F16 ya mapeado** (layout). El gráfico y el calendario son decorativos o engañosos. | Filtrar año corriente; click del calendario → `gestion-viajes.html?viaje=N`; quitar personalización o implementar la API. |
| **ADM-09** | Media | Listar usuarios manda el filtro de login como `Nombre_Usuario`; la API espera `nombreusuario`. El filtro no aplica. Gestión sí manda `nombreusuario`, pero no filtra por nombre/apellido. | **Ya mapeado F7.** Además, los filtros no coinciden entre listar y gestionar (mismo patrón NAV-02). | Corregir el nombre del parámetro; alinear filtros. |
| **ADM-10** | Baja | Nombre y apellido de usuario no aceptan guiones ni apóstrofos. | **Ya mapeado O3.** | — |
| **ADM-11** | Baja | Guardar permisos reescribe todas las filas; editar usuario recrea `GRUPOS_USUARIOS`. Auditoría queda a nombre de `sistema`. | **Ya mapeado O1, O2.** | — |
| **ADM-12** | Baja | Pie de página: `views/footer.html` dice 2024; restablecer contenido usa 2025; login tiene 2024 hardcodeado. El contenido se aplica con `innerHTML` (HTML libre). | Tres fuentes de verdad. Riesgo XSS si se compromete un admin. | Una fuente (gestión de contenido); sanitizar o solo texto. |
| **ADM-13** | Baja | Manual e informe de versión: visibles para todo usuario activo con sesión (decisión §14). Los PDF se cargan directo en la base, sin pantalla. | Correcto según lo decidido. Falta un panel de carga si alguna vez no se quiere entrar por SSMS. | Dejarlo; anotar para después de la tesis. |
| **ADM-14** | Baja | Auditoría: filtros útiles y completos. El filtro dice “Inicio de sesión” y el badge todavía puede decir “Login”. Usuario `sistema` en varios eventos. | El mapa de nombres ya está en el design system (§4.2). Usuario sistema es O1/O2. | Va con la pasada visual de auditoría. |

**Qué está bien:** Documentación exige sesión y muestra el PDF en un iframe;
versión actual en el login es pública a propósito; auditoría tiene typeahead de
usuario y busca en el detalle; tras F3, “Guardar permisos” no queda habilitado
con la lista vacía.

---

### 4.7 Cruces entre módulos (lo que el usuario espera y no está)

| ID | Gravedad | Qué pasa hoy | Mejora a analizar |
|---|---|---|---|
| **CRU-01** | Media | De un viaje no se abre el cliente, el origen, la tarifa ni la proforma (salvo el badge de texto “En PF-xxxx”). | Links: cliente → gestión clientes; PF → `gestion-facturacion` con ese número; presupuesto #N → presupuestos. |
| **CRU-02** | Baja | De un presupuesto no se abre el viaje (PRE-02). De un viaje de presupuesto el aviso cita el # pero no es link. | Mismo patrón `?viaje=` / `?presupuesto=`. |
| **CRU-03** | Media | “Traer viajes” y el control Rukas hablan de viajes por #. Solo Rukas tiene “Abrir viaje”. | Extender el enlace a advertencias de propias (FAC-09). |
| **CRU-04** | Baja | Búsquedas distinguen tildes (Juárez ≠ Juarez), salvo el buscador de clientes de Facu. | Al aplicar choices.js / el buscador predictivo, usar el mismo criterio sin tildes en todos. Ya anotado en la recorrida del 17/10. |
| **CRU-05** | Baja | Fechas invertidas (desde > hasta) en proformas y cuenta corriente devuelven vacío sin aviso. | Validar el rango al buscar. Entra fácil con flatpickr rango único del design system. |
| **CRU-06** | Decisión | Checklist de viajes y pantalla de presupuestos no se conocen. Rukas sigue siendo el sistema de tráfico; SGTL es espejo para facturar. | Actualizar `docs/negocio/CHECKLIST-OPERACION-VIAJES.md` cuando se cierren PRE-06 y el texto de Facturado. |

---

## 5. Lo que sí condice (para no “arreglarlo”)

Conviene no tocar estas cosas al leer el resto:

- **Dos flujos de viaje según tipo de cliente** (Rukas vs directo): campos,
  estados y reglas de “Traer viajes” / “Listo para facturar” están alineados al
  checklist.
- **Facturado recién al emitir la factura**, con “En PF-xxxx” mientras tanto:
  el código de API y la grilla de gestión lo hacen; lo que falla es el **texto
  de ayuda** (VIA-05).
- **Viaje de presupuesto bloqueado** en cliente/ruta/km/tarifa, con aviso.
- **Proforma de plataforma** pide Excel y no deja “Registrar proforma” propia
  para ese cliente.
- **Reserva de viajes** también en borrador; anular / NC los libera.
- **Configuración de facturación** sí se usa al emitir FAC/NC/REC (no es una
  pantalla muerta).
- **Piloto de choferes** es el modelo de interfaz a copiar.
- **Deep link** `gestion-viajes.html?viaje=N` ya existe y lo usa Rukas.

---

## 6. Decisiones de producto (cerrar antes de bajar a pendientes)

Estas no se “corrigen”: hay que elegir.

1. **¿Se mantienen Listar y Gestionar como dos pantallas?** Si sí, el listado
   tiene que ser una consulta de verdad (mismos datos, exportar, enlace a
   gestionar). Si no, se unifica y el permiso de grupo esconde las acciones.
2. **¿La tabla chofer–camión se usa o se retira de la UI?** Hoy se muestra y no
   se carga. Si se usa, el viaje debería filtrar camiones según el chofer (o al
   revés). Si no, hay que sacar la mención de los listados.
3. **¿El paso Generada → Aceptada de las proformas propias se queda?** En
   plataforma no existe. Si propias tampoco lo necesitan, un solo botón
   “Generar” que deje Aceptada. Si sí, hay que explicarlo en el modal.
4. **¿La evidencia de entrega en clientes directos es obligatoria o
   recomendada?** Decidido el 22/10: obligatoria, también en un rechazo (el remito con la
   nota del cliente). Falta confirmar con Claudia qué vuelve cuando hay rechazo.
5. **¿El viaje necesita Observaciones?** Anotado en §13, sin decisión.
6. **¿Presupuestos notifica al chofer al generar el viaje?** Hoy no. Coordinar
   con Fede (y con el reenvío del §15).
7. **¿Configuración es solo admin, o vale el permiso de grupo?** Hoy las dos
   reglas se pisan.
8. **¿El tablero se usa en la demo / en operación?** Si no, no invertir en
   widgets. Si sí, hay que corregir camiones activos, el gráfico por año y el
   404 del layout.

---

## 7. Prioridad sugerida para cuando se retome

No es un sprint. Es un orden de lectura para elegir qué baja a
`docs/PENDIENTES-SISTEMA.md`.

### Primero (engaña o rompe, y no espera al design system)

- VIA-05 — texto de Facturado (un string).
- VIA-06 — deshabilitar Estado y entrega con el mismo criterio que Editar.
- NAV-04 / R1 — botones de exportar que no hacen nada (o sacarlos).
- MAE-01 — copy de Listar choferes vs asignación chofer–camión (aunque el ABM
  quede para después).
- MAE-04 — tipo de cliente visible en listados.
- ADM-01 — no dejar entrar a un usuario inactivo.
- ADM-07 — widget de camiones activos.
- FAC-01 — copy del paso Generada → Aceptada.

### Junto con la pasada del design system (§10)

Ahí es barato unificar filtros Listar/Gestionar, subtítulos, paginar OD y
tarifas, cruz de filtros, toasts, y el Limpiar de cuenta corriente (CC-01).
No conviene hacer una pasada visual que deje los listados de viajes con IDs
(VIA-01 / F6).

### Con Facu

- Listar proformas con badge Rukas y reclamo (FAC-02).
- Filtro de reclamo (FAC-03, ya opcional en §6).
- Traer viajes: no tumbar todo el período por un JSON malo (FAC-10); links a
  viajes en advertencias (FAC-09).
- Presupuestos: link al viaje, aviso de WhatsApp, badge tipo cliente.

### Con Fede

- WhatsApp al generar viaje desde presupuesto (PRE-01).
- Reenvío y aviso al eliminar (§15, ya mapeado).
- Enmascarar Access Token (F2; Rocío el 18/10 decidió dejarlo, reconfirmar).

### Ya tiene plan (no mezclar)

- Proforma plataforma etapas 4 y 6 (guía + N° factura Rukas).
- Desplegables con búsqueda y Google Places (§5).
- Hora UTC (§2).
- F1b (token en la API).

---

## 8. Cómo seguir

1. Repasar las **ocho decisiones del §6** (aunque sea con un sí/no al margen).
2. Elegir un subconjunto del §7 y **recién ahí** pasarlo a
   `docs/PENDIENTES-SISTEMA.md`, con dueño (nuestras / Facu / Fede).
3. No mezclar este relevamiento con la pasada visual: el §10 se hace igual; lo
   de acá es extra, salvo los ítems “junto con el design system”.
4. Cuando se actualice el checklist de viajes, incluir presupuestos y el texto
   correcto de Facturado.

Este documento no se prueba en la VM: no hay cambios de código. Si al
recorrerlo en pantalla algo no coincide con lo escrito, gana la pantalla y se
corrige acá.
