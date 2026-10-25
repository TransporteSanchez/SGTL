# Instructivo — cómo probar viajes y proformas (incluida la proforma de Rukas)

Paso a paso para probar a mano los flujos de viajes y de proformas, pensado para quien no estuvo en el desarrollo.
Los diagramas de cada flujo están en `docs/negocio/FLUJOS-VIAJES-Y-PROFORMAS.md`: conviene mirarlos antes.
Al final hay un **guion para la presentación** con el orden sugerido y qué contar en cada paso.

**Actualizado al 19/10/2026** (rama `rocionuvoli`, igual a `main`, `facugodoy` y `fedemontenegro`).

---

## 0. Antes de empezar

### Preparar el entorno

1. `git pull` de tu rama (las cuatro están iguales).
2. Compilar la API en Visual Studio y levantarla (IIS Express, `http://localhost:50222/api`).
3. Abrir el front con Live Server (en la VM es el puerto 5500) e iniciar sesión.
4. Hacer **Ctrl+F5** en cada pantalla la primera vez, para que tome el JS nuevo.

### Reglas para no romper datos (la base es compartida)

- Lo que crees, nombralo con **PRUEBA** y tu nombre (por ejemplo, observaciones "PRUEBA-FACU").
- No modifiques ni elimines datos que no creaste.
- **WhatsApp:** al registrar un viaje con chofer asignado, se le manda la hoja de ruta por WhatsApp al teléfono del chofer. Usá un chofer de prueba con **tu** número, o un viaje de cliente Rukas sin chofer (ahí es opcional).
- Generar una proforma consume un número PF y emitir una factura queda en cuenta corriente: hacelo solo cuando la prueba lo pide, y anotá qué números usaste.

### Datos de prueba que ya existen

| Qué | Dónde | Para qué |
|---|---|---|
| **QUICKFOOD** | Cliente **con plataforma** (Rukas) | Viajes y proformas de Rukas |
| **Viajes 25 y 26** de QUICKFOOD | N° de transporte SAP **990001** y **990002**, con remito y N° de entrega, en **Listo para facturar**. En SGTL, con la tabla de agosto 2026 (Liviano 2016, tarifa fija hasta 130 km), el 25 da **$429.101** (1ª vuelta) y el 26 **$278.028** (2ª vuelta: mismo camión, mismo día, más tarde) | Los usan todos los Excel de prueba |
| Clientes **directos** | Por ejemplo, distribuidora-powerful y Servicios Ambientales | Viajes y proformas propias |
| **Excel de Rukas** | `docs/pruebas/datos/` (ver su `README.md`) | Un archivo por caso |

**Importante sobre los viajes 25 y 26:** un viaje puede estar en una sola proforma, así que los casos de Rukas se prueban **de a uno**. Después de cada caso, **eliminá el borrador** para liberar los viajes. Si un caso se genera y se factura, los viajes quedan Facturados y, para volver a usarlos, hay que anular la factura con nota de crédito.

---

## 1. Viajes

Pantalla: **Gestionar viajes**. Botones de cada fila: Editar (lápiz), **Cambiar estado** (banderita) y Eliminar (tacho).

### 1.1 Registrar un viaje de cliente directo

1. "Registrar viaje" → elegí un cliente **directo**, origen, destino y fechas.
2. Mirá la distancia: se calcula sola con el mapa.
3. Tarifa: probá **fija** (busca la de esa ruta y ese cliente; si no hay, lo dice) y **por km** (calcula según el período y los km).
4. Chofer: **obligatorio** para un cliente directo. Camión.
5. Guardar → toast de confirmación y, si hay chofer, el resultado del WhatsApp ("Se le envió la hoja de ruta…" o "la integración no está configurada").
6. En el listado queda **Registrado**.

### 1.2 Seguir un viaje directo hasta Entregado

1. Banderita "Cambiar estado" → tarjeta **En viaje** → Guardar.
2. Banderita → tarjeta **Entregado**: dentro de la tarjeta pide **resultado** (Completa / Parcial / Rechazo), **fecha de entrega** y **evidencia** (foto o PDF del remito firmado, o con la nota de rechazo). Sin eso no deja (quedan en rojo).
3. Con la evidencia adjunta aparece el clip en el listado. Si el viaje ya está entregado, la banderita muestra arriba "Datos de la entrega" para corregirlos o reemplazar la evidencia (no se puede quitar), sin cambiar el estado.
4. Probá saltear un paso (de Registrado directo a Entregado): no deja, se avanza o se vuelve de a uno.
5. Volvé a abrir "Editar": ahora solo se pueden cambiar los números (remito). El recorrido, el chofer y la tarifa quedan fijos porque el viaje ya salió.

### 1.3 Viaje de cliente con plataforma (Rukas)

1. "Registrar viaje" → **QUICKFOOD**. Fijate que aparecen los campos **N° de transporte SAP** y **N° de entrega**, y que el chofer pasa a **opcional**.
2. Guardalo **sin** los números (todavía no existen en la realidad): queda Registrado.
3. Banderita "Cambiar estado": la tarjeta **Listo para facturar** aparece gris y dice qué falta (N° de transporte SAP, remito, N° de entrega o tarifa).
4. Editá el viaje, cargá los tres números (de prueba, por ejemplo 990901) y volvé a intentar: ahora pasa a Listo para facturar.
5. Con el viaje en Listo para facturar, en "Editar" se pueden corregir la **tarifa y los km** (sirve para que coincida con Rukas); el resto queda fijo.
6. Al terminar, eliminalo si sigue Registrado, o avisale a Rocío cuál quedó.

### 1.4 Eliminar

- Un viaje **Registrado** sin proforma se elimina (pide confirmación).
- Uno que ya salió, que está en una proforma o que viene de un presupuesto aceptado: el tacho está deshabilitado y el tooltip dice por qué.

### 1.5 Viaje desde un presupuesto

1. En **Presupuestos**, un presupuesto en **Aceptado** → "Generar viaje".
2. En el viaje generado, el cliente, el recorrido, los km y la tarifa son los del presupuesto y no se pueden cambiar (lo avisa arriba del formulario). El importe que se factura es el del presupuesto.
3. Ese viaje no se puede eliminar.

---

## 2. Proforma propia (clientes directos)

Pantalla: **Facturación → Gestionar proformas**.

1. "Registrar proforma" → cliente **directo** → período → **Traer viajes**: trae los viajes **Entregados** con tarifa y libres. Debajo avisa cuáles no trajo y por qué (no entregado, sin tarifa, en otra proforma).
2. "Guardar borrador" → queda **Borrador**. En Gestionar viajes, los viajes muestran "En borrador #…".
3. "Generar proforma" → **Generada**, con N° PF. Los viajes ya no se editan ni cambian de estado.
4. "Marcar como aceptada" → **Aceptada**.
5. "Emitir factura" → la proforma queda **Facturada** y sus viajes pasan a **Facturado**.
6. Corregir:
   - Un borrador se edita (lápiz) o se elimina (tacho).
   - Una Generada o Aceptada se **anula** (conserva su número y libera los viajes).
   - Una Facturada: "Anular Factura a proforma" emite la **nota de crédito**, la proforma queda Anulada y los viajes vuelven a **Entregado**.
7. Probá "Registrar proforma" con **QUICKFOOD**: en lugar de "Traer viajes" pide el Excel de Rukas (para un cliente con plataforma no hay proforma propia).

---

## 3. Proforma de plataforma (Rukas) — lo nuevo

Misma pantalla: **Gestionar proformas**. Para un cliente con plataforma, el modal "Registrar proforma" es el mismo, pero en lugar de los conceptos muestra el bloque **"Excel de Rukas"**.

**Cómo se cargan los Excel en la prueba:** con el control "Excel de Rukas" del modal, eligiendo el archivo de `docs/pruebas/datos/`. El N° de proforma se completa solo con el nombre del archivo.

### 3.1 La guía (antes de generar en Rukas)

1. "Registrar proforma" → **QUICKFOOD**.
2. Debajo del Excel aparece **"Viajes sin proforma (N) · guía para generar la proforma en Rukas"**. Desplegala: están los viajes 25 y 26 con su N° de transporte, fecha, ruta y estado, y el enlace "Abrir viaje".
3. Para contar: es la lista que se usa para tildar los transportes al generar la proforma en Rukas, así se evitan diferencias.

### 3.2 Caso 1 — todo coincide

1. Elegí `proforma-rukas-caso1-todo-ok (PROFORMA NRO 990110).xlsx`: vista previa "2 transportes · Total Rukas $722.129" y N° 990110.
2. Al elegirlo se guarda el borrador (toast) y aparece el **control**: arriba "● Lista para generar: los 2 transportes coinciden" y las 2 filas con "Coincide" en gris, con el importe de Rukas y el de SGTL.
3. Totales: neto $722.129 (viajes $707.129 + adicional $15.000), IVA $151.647,09, total **$873.776,09**.
4. "Generar proforma" está en verde. Si querés probar el circuito completo: Generar → confirmación dentro del modal → queda **Aceptada** con N° PF y la etiqueta "Rukas 990110" en el listado → "Emitir factura" por $873.776,09 → viajes 25 y 26 en Facturado. **Esto consume un N° PF y una factura**: después, nota de crédito para liberar los viajes.
5. Si no generás: eliminá el borrador.

### 3.3 Caso 2 — Rukas está mal: reclamo

1. Elegí `proforma-rukas-caso2-reclamo-a-rukas (PROFORMA NRO 990120).xlsx` → Guardar borrador.
2. El 990002 está en el grupo **"Para revisar"** con "Importe distinto": Rukas $250.000, SGTL $278.028 y, en gris debajo del importe de SGTL, la tarifa usada (la fija hasta 130 km, 2ª vuelta). "Generar proforma" queda deshabilitado; su globito dice "Para generar, resolvé la diferencia".
3. La tarifa del viaje está bien, así que el error es de Rukas: **"Registrar reclamo"** → fecha (hoy) y motivo → Guardar. La fila pasa al grupo **"Esperando a Rukas"**, que dice "Reclamado el …" con "Ver reclamo".
4. Cerrá el modal. En el listado, junto al estado, aparece el **ícono de admiración** con el tooltip "Reclamo pendiente en Rukas desde el…". El filtro **Tipo → "Con reclamo pendiente"** la muestra.
5. Marfrig corrige: abrí el borrador (lápiz) → **"Reemplazar Excel"** → `proforma-rukas-caso2-reclamo-a-rukas-corregido (PROFORMA NRO 990120).xlsx`. El reclamo **se cierra solo**, los 2 "Coincide" y "Generar" se pone verde.
6. Generá (como en el caso 1) o eliminá el borrador.

### 3.4 Caso 3 — SGTL está mal: corregir el viaje

1. **Preparación:** en Gestionar viajes, editá el viaje **26** y cambiá el N° de transporte SAP de 990002 a **990020** (simula un error de carga).
2. Elegí `proforma-rukas-caso3-corregir-viaje-en-sgtl (PROFORMA NRO 990130).xlsx` → Guardar borrador.
3. El 990002 está en **"Para corregir en SGTL"** con "Sin viaje relacionado" (el globito dice "No hay un viaje de este cliente con el N° 990002"). El aviso de viajes fuera de la proforma se sacó del control el 22/10: el viaje #26, con el N° mal cargado, se ve en Gestionar viajes o en la guía del paso 2 de una proforma nueva.
4. Corregí el viaje 26 (volvé a poner **990002**) y, en el borrador, **"Volver a controlar"** (en la franja del Excel): "Lista para generar".
5. Eliminá el borrador (o generá).
6. Otra variante del mismo caso: en vez del N°, corregir la **tarifa** del viaje (en Listo para facturar se puede) y volver a controlar.

### 3.5 Validaciones del archivo (no se crea nada)

| Archivo | Qué tiene que pasar |
|---|---|
| `proforma-rukas-repetido (PROFORMA NRO 990101).xlsx` | Error dentro del modal: el transporte 990001 está repetido |
| `proforma-rukas-formato-invalido (PROFORMA NRO 990102).xlsx` | Error: dice qué columna falta o no es la de Rukas |
| Importar dos veces el mismo N° mientras el primero está en borrador | "La proforma … ya está cargada (Borrador). Abrila y usá Reemplazar Excel." |
| Reemplazar el Excel de un borrador por uno de **otro N°** | "El archivo es de la proforma … y este borrador es la …" |

### 3.6 Otras cosas del borrador de Rukas

- **Condiciones comerciales:** con el lápiz, en un borrador se pueden editar forma y plazo de pago, validez, etc. → "Guardar borrador" → "Borrador guardado.". La factura usa la forma y el plazo de pago como condición de venta.
- **Ver (ojo) vs. Editar (lápiz):** con el ojo todo es de solo lectura (sin Reemplazar Excel, Volver a controlar, reclamo ni Generar); con el lápiz están todas las acciones.
- **Abrir viaje #N:** en cada diferencia, abre el viaje en otra pestaña para corregirlo sin perder el borrador.
- **PDF:** el botón PDF muestra "PROFORMA DE RUKAS", el N° en Rukas y el período. Un borrador dice "N°: Borrador" y lista las líneas del Excel.
- **Listado:** etiqueta "Rukas 990120" junto al número; filtro **Tipo** (Propia / Plataforma / Con reclamo pendiente); al exportar el listado, las de Rukas salen como "PF-… (Rukas …)".

### 3.7 Factura y nota de crédito de una proforma de Rukas

1. Con una proforma de Rukas **Aceptada**: "Emitir factura" (el flujo de siempre). Neto = total de Rukas, más IVA 21 %. Los viajes pasan a Facturado. Cada línea de la factura dice "Rukas <N°>".
2. "Anular Factura a proforma" → nota de crédito: la proforma queda **Anulada** y los viajes vuelven a **Listo para facturar**.
3. Se puede **volver a importar el mismo Excel** (el N° de una proforma anulada se libera).

### 3.8 Al terminar

Dejá los datos como estaban:
- Ningún borrador de Rukas tuyo.
- Viajes 25 y 26 en **Listo para facturar** con **990001** y **990002**.
- Si generaste y facturaste, anulá la factura con nota de crédito y avisale a Rocío qué números usaste.

---

## 4. Guion para la presentación

Unos 10 a 15 minutos. Antes de empezar: datos como en 3.8, sesión iniciada, Gestionar viajes y Gestionar proformas abiertas en dos pestañas, y los Excel a mano.

| # | Qué mostrar | Qué contar |
|---|---|---|
| 1 | Diagrama general (§1 de `FLUJOS-VIAJES-Y-PROFORMAS.md`) | Dos tipos de cliente: directo (SGTL registra todo) y con plataforma (el cliente usa Rukas y SGTL concilia). La factura es interna porque no hay conexión con ARCA; al integrarla, el circuito no cambia |
| 2 | Gestionar viajes: registrar un viaje directo (1.1) | Tarifa automática (fija o por km), distancia con el mapa, WhatsApp al chofer con la hoja de ruta |
| 3 | Cambiar estado (1.2) | Se sigue de a un paso; para Entregado pide resultado, fecha y evidencia |
| 4 | Viaje de QUICKFOOD (1.3) | Los números de Rukas se cargan a medida que aparecen; sin ellos no pasa a facturar |
| 5 | Registrar proforma → QUICKFOOD → la guía (3.1) | Es la lista para tildar en Rukas y evitar diferencias |
| 6 | **Caso 3** (3.4): importar, "Sin viaje relacionado", corregir el viaje, Volver a controlar | Cuando el error es nuestro, se corrige en SGTL sin perder el borrador. Eliminar el borrador al terminar |
| 7 | **Caso 2** (3.3): importar, "Importe distinto" con la tarifa usada, Registrar reclamo, ícono en el listado, Reemplazar Excel | Cuando el error es de Rukas, se reclama y queda marcado; con la corrección se reemplaza y vuelve a controlar solo |
| 8 | Generar → Aceptada → Emitir factura ($873.776,09) | Solo se genera con todo OK; nace Aceptada porque Marfrig ya la aceptó en Rukas; la factura es la de siempre |
| 9 | PDF de la proforma y listado con el filtro Tipo | La proforma de Rukas se distingue en el listado, en el PDF y al exportar |
| 10 | (Si preguntan) Nota de crédito (3.7) y diagrama de correcciones (§5) | Cada error tiene su salida: borrador se edita, aceptada se anula, facturada con nota de crédito |

**Después de la presentación:** la factura del paso 8 queda emitida. Para volver a mostrar el flujo, anularla con nota de crédito (3.7).
