# Proforma de plataforma (Rukas) — qué hay que tocar y cómo lo desarrollamos

Plan de desarrollo del diseño acordado en el §10 de `docs/negocio/PROFORMA-CLIENTES-RUKAS.md`
(importar el Excel de la plataforma, control línea por línea, borrador hasta que todo coincide,
factura con el flujo actual). Fecha: 18/10/2026, actualizado el 19/10 con la reunión del equipo
y las definiciones de Rocío. **Todavía no empezó el desarrollo.**

**Diseño genérico (decidido el 19/10):** el módulo se arma para **cualquier plataforma de un
cliente** (un sistema del cliente con el que hay que conciliar). Rukas es la primera. En la base de
datos y en el código no aparece "Rukas": se habla de **plataforma**, y el nombre sale de una tabla.
En la pantalla, los textos muestran ese nombre ("Excel de Rukas", "Reclamo en Rukas"), así la
persona siempre sabe con qué sistema está trabajando.

---

## 1. Antes de escribir código

| # | Qué | Por qué | Quién |
|---|---|---|---|
| A | ~~Traer el commit nuevo de Facu~~ (`4a84bb2`, presupuestos) — **hecho el 18/10** (merge `0ddf948`, ver §12 de pendientes) | Tocaba los mismos archivos que vamos a tocar. | Rocío |
| B | ~~Confirmar si los importes de Rukas son netos~~ — **confirmado el 19/10: son netos.** En la factura `A00005-00000659` de la proforma 7450, el neto gravado ($4.075.662,00) es el total de Rukas y se suma IVA 21 % ($855.889,02). | Las líneas de la proforma de plataforma van con `IvaPct = 21` sobre el neto de Rukas, igual que las propias. El IVA se calcula sobre el total (`ComputarTotales` acumula sin redondear y redondea al final), así que coincide al centavo con la factura fiscal. | — |
| C | ~~Rama de trabajo~~ | Resuelto: todo en `rocionuvoli` (§2) | — |

**No queda nada que frene el arranque.** Las preguntas de Claudia (§11 del documento de negocio) tampoco: el flujo de SGTL es el mismo cualquiera sea la respuesta. Sí hay que tenerlas cerradas antes de pasar a `main`.

---

## 2. Rama y forma de trabajo

**Todo se desarrolla en `rocionuvoli`** (decisión de Rocío, 18/10). No se usan ramas aparte por tema.

- Cada etapa se commitea en `rocionuvoli`, se sube y se prueba en la VM; Rocío además la revisa a mano.
- `rocionuvoli` pasa a `main` solo con todo probado y OK, y con las dudas cerradas con Facu y Claudia. Mientras el módulo esté a medias, no se pasa `rocionuvoli` a `main`.

**Un commit por etapa** (ver §5), con el formato `Proformas: …`. Al terminar cada etapa se actualiza el ítem 6 de `docs/PENDIENTES-SISTEMA.md` con cómo probarla en la VM.

**Para no pisarse con Facu:** lo nuevo va en **archivos nuevos** (un controller, un lector por plataforma y un JS). En sus archivos (`ProformasController.cs`, `FacturasController.cs`, `gestion-facturacion.html`) solo se tocan los puntos de enganche, listados en §3. Si al traer cambios suyos hay conflictos, se revisan uno por uno con Rocío (`docs/equipo/FLUJO-GIT.md`).

---

## 3. Qué se toca

### Vocabulario

| Concepto | Nombre en base y código | Cómo se ve en pantalla |
|---|---|---|
| Tipo de cliente | `Tipo_Cliente`: `Directo` / `Con_plataforma` (ya existe) | Directo / Con plataforma |
| Plataforma del cliente | tabla `PLATAFORMAS` | Su nombre: "Rukas" |
| Tipo de proforma | `Tipo_Proforma`: `Propia` / `Plataforma` | Propia / Plataforma, con el nombre: "Rukas 7594" |
| Archivo importado | adjunto de la proforma | "Excel de Rukas" |
| Reclamo | `Plataforma_Reclamo_*` | "Reclamo en Rukas" |
| Factura cargada en la plataforma | `Plataforma_Factura_*` (sin usar: etapa 6 descartada el 19/10) | — |

### Base de datos — script nuevo `database/proformas-plataforma/01_plataformas_y_proformas.sql`

Idempotente. Todo lo nuevo es nullable o tiene default, así que **no rompe el código de Facu** aunque se corra antes de que él tenga los cambios. Sin tocar el EDMX: todo por SQL directo.

- **Tabla nueva `PLATAFORMAS`:** `Plataforma_ID`, `Nombre` ("Rukas"), `Codigo` ("RUKAS", el que usa el código para elegir el lector) y `Activa`. El script carga Rukas. No hay pantalla para administrarla: una plataforma nueva se carga por script, junto con su lector.
- **`CLIENTES`:** `PlataformaID` (nullable). Obligatorio cuando `Tipo_Cliente = 'Con_plataforma'`. Mientras exista una sola plataforma, se asigna sola y la pantalla de clientes no muestra nada nuevo; el selector aparece cuando haya más de una. El script asigna Rukas a los clientes que ya son `Con_plataforma`.
- **`PROFORMAS`, columnas nuevas:**
  - `Tipo_Proforma` (`Propia` / `Plataforma`, default `Propia`) y `PlataformaID`.
  - `Plataforma_Numero`: N° de la proforma en la plataforma.
  - `Plataforma_Reclamo_Fecha` y `Plataforma_Reclamo_Motivo` (decidido el 19/10: solo dos columnas). Con la fecha vacía no hay reclamo pendiente. Quién lo registró o lo cerró sale de `AUDITORIA`, igual que el historial. No se reutilizan `Observaciones` / `ObsComerciales` / `ObsLogisticas`: salen en el PDF y el formulario de la proforma comercial.
  - `Plataforma_Factura_Numero`, `Plataforma_Factura_Fecha` (N° y fecha de la factura según la plataforma), `Plataforma_Factura_Usuario`, `Plataforma_Factura_Carga` (quién y cuándo los cargó). **Sin usar:** la etapa 6 se descartó el 19/10 (la factura interna hace de fiscal; ver §10 del documento de negocio); quedan reservadas para la integración con ARCA.
- **Índice único filtrado:** (`ClienteID`, `PlataformaID`, `Plataforma_Numero`) para proformas de plataforma no anuladas (borrador incluido).
- **Tabla nueva `PROFORMA_PLATAFORMA_LINEA`:**
  - Lo que trae el archivo: `Proforma_ID`, `Orden`, `Referencia` (para Rukas, el N° de transporte), `Fecha`, `Ruta`, `Importe_Viaje`, `Adicionales`.
  - Lo que calcula el control: `Viaje_ID` (puede quedar vacío), `Importe_SGTL`, `Tarifa_Usada` (texto para mostrar), `Resultado` (casos 1–6 del §10) y `Detalle`. Se recalcula con "Volver a controlar" y "Reemplazar Excel".
- **Tabla nueva `PROFORMA_ADJUNTO`:** el archivo original importado (se reemplaza con "Reemplazar Excel"); más adelante, también el PDF de la factura. Mismo patrón que `VIAJE_EVIDENCIA`: nombre, tipo y `VARBINARY(MAX)`.
- **Sin estados nuevos:** la proforma de plataforma usa `Borrador`, `Aceptada`, `Facturada` y `Anulada`, que ya existen. No pasa por `Generada`: "Generar" la deja Aceptada directamente.

Rocío corre el script en la base compartida. La base es una sola, así que avisarle a Facu que aparecen columnas nuevas.

### API — archivos nuevos

**`Controllers/ProformasPlataformaController.cs`** (ruta `api/ProformasPlataforma`). SQL directo, como `ProformasController`. Es **igual para todas las plataformas**: el circuito no sabe cuál es.

| Endpoint | Qué hace |
|---|---|
| `POST Importar` | Recibe cliente, N° en la plataforma, nombre de archivo, archivo en base64 y las celdas como texto. Con el lector de la plataforma del cliente valida el archivo (caso 8: si falla, no crea nada). Crea la proforma de plataforma en `Borrador`, guarda líneas y adjunto, reserva los viajes que coinciden (`PROFORMAS_VIAJES`) y devuelve el control (casos 1–7). |
| `POST {id}/Controlar` | **Volver a controlar:** recalcula las líneas del borrador contra los viajes actuales (después de corregir algo en SGTL) y actualiza las reservas. |
| `POST {id}/ReemplazarArchivo` | Solo en borrador y con el mismo N° en la plataforma: reemplaza líneas y adjunto por los del archivo corregido y vuelve a controlar. Cierra el reclamo pendiente. |
| `PUT {id}/Condiciones` | "Guardar borrador" de un borrador ya importado: guarda las condiciones comerciales (forma y plazo de pago, validez, tiempo del servicio, observaciones, condiciones particulares). Solo en borrador, con la auditoría de `ProformasController.Editar` (decidido el 19/10). |
| `POST {id}/Reclamo` / `DELETE {id}/Reclamo` | "Registrar reclamo" (fecha y motivo obligatorio) y "Cerrar reclamo". Solo en borrador. Con auditoría. |
| `POST {id}/Generar` | Vuelve a controlar y, solo si todo está OK, asigna el número PF, pasa a `Aceptada`, arma los conceptos, pasa a Listo para facturar los viajes que seguían en Registrado (con auditoría) y cierra el reclamo si quedaba alguno. Si aparece una diferencia (alguien cambió un viaje en el medio), no genera y devuelve el control. |
| `GET ViajesSinProforma?clienteId=` | Viajes del cliente con los números cargados (Registrado o Listo para facturar) que no están en ninguna proforma. Guía antes de generar en la plataforma (paso 0) y aviso del caso 7. |
| Eliminar un borrador de plataforma | Con el `Borrar` actual (libera los viajes), más sus líneas y su adjunto. |

**Lectores, uno por plataforma** (por ejemplo `Plataformas/ILectorPlataforma.cs` y `Plataformas/LectorRukas.cs`). Es lo único propio de cada plataforma. El lector sabe:

- **el formato del archivo:** columnas y encabezados esperados, cómo vienen los importes y las fechas (para Rukas: coma de miles, `dd.MM.yyyy`), de dónde sale el N° de proforma (para Rukas, del nombre del archivo);
- **con qué dato del viaje se cruza cada línea:** para Rukas, `Num_Transporte`; otra plataforma podría usar el remito u otro número;
- **qué números necesita el viaje** para pasar a Listo para facturar: para Rukas, transporte SAP, remito y N° de entrega.

El controller elige el lector según `PLATAFORMAS.Codigo` del cliente. **Sumar una plataforma** = un registro en `PLATAFORMAS` + su lector (+ un campo en el viaje, si se cruza por un dato que hoy no existe).

**Cómo se arman los conceptos (`PROFORMA_DETALLE`):** al generar, una línea por cada línea del archivo, con precio = importe del viaje + adicionales (netos) e `IvaPct = 21` (1-B). El código es `V{Viaje_ID}`: como solo se genera con todo OK, cada línea tiene su viaje en SGTL. Así la reserva, el control de "ya facturado" y el paso a `Facturado` al emitir la factura funcionan sin cambios.

**Qué se compara:** el importe del viaje del archivo contra el importe de SGTL (tarifa del viaje, o presupuesto si lo hay, igual que "Traer viajes"), redondeado a pesos enteros y exacto. Los adicionales no se comparan. La respuesta incluye la tarifa usada por cada viaje (tipo, número, ruta o km × valor).

**Lectura del archivo:** la página de facturación **ya carga SheetJS** (`xlsx@0.18.5`), así que el navegador solo extrae las celdas como texto y las manda. **Las reglas** (encabezados, formatos, repetidos) **las aplica el lector en la API**. No hace falta agregar paquetes NuGet.

### Enganches en archivos existentes

- **`ProformasController.cs`:**
  - `Editar`, `Generar`, `Duplicar` y `PrellenarViajes` rechazan proformas de plataforma (tienen sus propios endpoints).
  - "Registrar proforma" **propia** para clientes `Con_plataforma`: **se bloquea** (todos sus viajes pasan por la plataforma, confirmado el 19/10).
  - El cálculo del importe SGTL de un viaje (tarifa fija, por km o presupuesto) se reutiliza desde `PrellenarViajes`, para que el control y "Traer viajes" den lo mismo.
  - `Listar`, `Obtener` y `Reporte` devuelven `Tipo_Proforma`, el nombre de la plataforma, `Plataforma_Numero`, y si hay reclamo pendiente.
- **`ViajesController.cs` / `gestion-viajes.html`:** permitir corregir tarifa y km de un viaje de cliente con plataforma que está sin proforma o en un borrador, también en "Listo para facturar".
- **`ClientesController.cs`:** devolver y guardar `PlataformaID` (asignación automática mientras haya una sola plataforma).
- **`FacturasController.cs`:** en principio, nada. La proforma llega `Aceptada` con conceptos y totales coherentes, que es lo que ya exige. Se verifica en la etapa 5.
- **`gestion-facturacion.html`:** el modal de proforma se adapta (ver §4). La lógica nueva va en `assets/static/js/proformas-plataforma.js`, que se engancha al modal existente, para que los cambios de Facu y los nuestros no choquen.

---

## 4. Pantallas (decidido el 19/10)

**Un solo modal, el de siempre ("Registrar proforma"), que se adapta según el cliente.** Para la persona, armar una proforma de plataforma es lo mismo de siempre (elegir cliente, completar, "Guardar borrador", "Generar proforma"), solo que en vez de traer viajes elige el archivo. Lo nuevo sigue el design system (`sgtl.css`, `sgtl-ui.js`) aunque el resto de la pantalla de Facu espere su pasada. En los textos, `{plataforma}` es el nombre que viene de `PLATAFORMAS` (hoy "Rukas").

### Rediseño del 22/10 (manda sobre lo que se contradiga más abajo)

Pedido de Rocío: el modal tenía mucho texto y los botones se perdían. Se acomodó sin sacar ninguna acción. Todo se hace desde `proformas-plataforma.js` (agrega y oculta piezas del modal de Facu y las devuelve al salir); las proformas propias no cambian.

- **Pasos:** al elegir un cliente con plataforma, el modal muestra 1 Cliente → 2 Excel de {plataforma} → 3 Control y generar.
- **Paso 1:** el cliente. Sus datos quedan en una línea ("Responsable Inscripto · dirección · teléfono") con **"Editar datos del cliente"**, que despliega los campos de siempre. El período no se muestra: sale del Excel.
- **Paso 2:** una zona para elegir o soltar el Excel, con una línea de ayuda. **Al elegirlo se importa y se controla solo** (no hace falta "Guardar borrador"); si el nombre del archivo no trae el N°, lo pide con un botón "Controlar". La guía de viajes sin proforma va plegada en una línea.
- **Paso 3:** barra del archivo (nombre, fecha, período, "Reemplazar Excel"); un aviso con cuántas diferencias hay y de quién son, con "Volver a controlar" y "Registrar / Editar / Cerrar reclamo" al lado; la tabla agrupada (ver abajo); los totales en una línea. "Abrir viaje" es un ícono por fila y la tarifa usada, un globito en el importe de SGTL.
- **Condiciones comerciales:** plegadas, con el resumen de forma y plazo de pago.
- **Pie:** el motivo por el que no se puede generar ("Para generar, resolvé las 3 diferencias") y la confirmación de "Generar" (en el lugar de los botones, donde se tocó).
- **Se vuelve a controlar solo** al abrir un borrador con el lápiz y al volver a la pestaña después de "Abrir viaje".
- **Listado:** junto al estado del borrador, su situación: "Corregir en SGTL (1) · Revisar (2) · Esperando a Rukas (1) desde el 21/10", o "Lista para generar". Reemplaza el ícono de admiración del reclamo.

### Errores y de quién son (22/10)

Todo Excel de la plataforma **se guarda como borrador, aunque venga con errores**, para que siempre haya un lugar al que volver. Solo se rechaza lo que no es un Excel de la plataforma (otro archivo, encabezados distintos, vacío): "Este archivo no es el Excel de Rukas: falta la columna …", y no se crea nada. Si el N° ya está cargado, el aviso ofrece "Abrir el borrador".

| Resultado | De quién es | En la tabla |
|---|---|---|
| Sin viaje en SGTL, faltan números, sin tarifa, N° repetido en SGTL | **SGTL** (se corrige el viaje) | "Para corregir en SGTL" |
| Repetido en el Excel, dato mal en el Excel (importe, fecha o N° ilegible) | **La plataforma** (la línea entra igual, marcada; el control no la cambia) | "Para reclamar a {plataforma}" |
| Importe distinto, ya facturado, en otra proforma | **Decide la persona** con la tarifa usada a la vista: corrige el viaje o lo reclama | "Para revisar" |
| Cualquiera de las anteriores, incluida en el reclamo | Se espera la corrección de la plataforma | "Esperando a {plataforma}" |

**Reclamo por línea:** "Registrar reclamo" lista las diferencias con casillas (vienen marcadas las del Excel) y arma el motivo con esos transportes; la persona lo puede editar. Las líneas marcadas pasan a "Esperando a {plataforma}" (`PROFORMA_PLATAFORMA_LINEA.Reclamada`, script `02_reclamo_por_linea.sql`). "Volver a controlar" no las toca; "Cerrar reclamo", "Reemplazar Excel" y "Generar" las liberan.

**Supuesto (22/10):** la plataforma corrige la misma proforma, que conserva su N° (cambia el importe o saca el transporte), y se usa "Reemplazar Excel". Sale de las acciones que se ven en el código de la pantalla de Rukas (§12 del documento de negocio); no está verificado con Marfrig. Si alguna vez emitiera otra con otro N°, se elimina el borrador y se importa la nueva.

### El modal, bloque por bloque

| Bloque | Cliente directo | Cliente con plataforma |
|---|---|---|
| **Encabezado** | Igual que hoy | Igual, con la etiqueta "{plataforma} 7594" al lado del estado |
| **Datos generales y del cliente** | Igual | Igual, más el campo **N° de proforma en {plataforma}** (se completa solo con el nombre del archivo; ayuda: "Sale del nombre del archivo; corregilo si hace falta"). El **período** se completa solo con la primera y la última fecha del archivo, y no se edita |
| **Datos del servicio** (tipo de servicio, origen, destino, carga, peso, vehículo…) | Igual | **Oculto** (una tanda tiene muchas rutas) |
| **Conceptos** ("Traer viajes", "Agregar línea", tabla) | Igual | **Reemplazado por "Excel de {plataforma}"** (ver abajo) |
| **Reclamo en {plataforma}** | — | Solo en borrador |
| **Totales** | Igual | El mismo bloque, con lo de la plataforma (viajes + adicionales + IVA) |
| **Condiciones comerciales** | Igual | Igual (forma y plazo de pago sirven para el vencimiento de la factura) |
| **Pie** | Cancelar · PDF · Guardar borrador · Generar proforma | **Los mismos botones** |

**Los botones del pie, con el mismo significado:**

- **Guardar borrador:** la primera vez guarda el archivo elegido y crea el borrador (esa es la importación; no hay un botón "Importar"). Después guarda los cambios, como siempre: en un borrador de plataforma se editan solo las condiciones comerciales (el cliente y los conceptos salen del archivo). Antes de "Generar" se guardan, como en la propia.
- **Generar proforma:** se habilita **solo con el control en OK**. Mientras no, debajo del resumen dice el motivo ("Para generar, corregí las 2 diferencias"), no como tooltip (en un botón deshabilitado no aparece). Pide confirmación porque consume un número PF: "¿Generar la proforma de {plataforma} 7594?" / "Se le asigna número y queda aceptada, lista para facturar." → Cancelar + Generar.
- **Cancelar / Cerrar** y el aviso de cambios sin guardar: igual que en las propias.
- **PDF:** igual, mostrando el tipo y el N° en la plataforma.

### Bloque "Excel de {plataforma}"

1. **Archivo — un solo control que cambia solo:**
   - **sin archivo** (proforma nueva): "Elegir Excel", solo `.xlsx`, con la ayuda de dónde exportarlo (para Rukas: "Proceso → detalle de la proforma → ícono de Excel"). Al elegirlo, vista previa ("12 transportes · Total {plataforma} $5.292.185") y control;
   - **con archivo** (borrador guardado): nombre del archivo y fecha, y el botón **"Reemplazar Excel"**. Valida que sea el mismo N°; si es otro, avisa que es otra proforma (eliminar el borrador e importar la nueva). No pide confirmación: el archivo anterior era el que estaba mal y queda en la auditoría.
   - Si el archivo es inválido (caso 8), el error sale **dentro del modal**, arriba, en rojo, diciendo qué está mal ("Falta la columna Importe Viajes").
2. **Resumen del control:** "12 transportes · 10 coinciden · **2 con diferencias**", con **"Volver a controlar"** y, si hay diferencias, **"Registrar reclamo"**.
3. **Tabla del control:** Transporte · Fecha · Ruta · Importe {plataforma} · Importe SGTL · Diferencia · Adicionales · Tarifa usada · Resultado.
   - las diferencias primero (el filtro "Ver solo diferencias" se **descartó** el 19/10: con tandas de 10 a 15 transportes, las diferencias ya se ven arriba);
   - **Resultado** con los colores del design system: verde "Coincide", rojo "Importe distinto" / "Sin viaje" / "Ya facturado", amarillo para avisos;
   - en cada diferencia, qué hacer en una línea ("Corregí la tarifa del viaje o registrá un reclamo") y el enlace **"Abrir viaje"**, que abre el viaje **en otra pestaña** para corregirlo sin perder el borrador;
   - "Tarifa usada": "Tarifa fija #3 · CD Córdoba → Villa María · $528.747" o "Tarifa por km #5 · 17,4 km × $850".
4. **Aviso del caso 7**, si corresponde.

### Bloque "Reclamo en {plataforma}"

- Sin reclamo: el botón "Registrar reclamo" del resumen abre el modal **"Registrar reclamo"** (fecha, hoy por defecto, y motivo obligatorio) → Cancelar + Guardar.
- Con reclamo: aviso amarillo con fecha y motivo, y el botón **"Cerrar reclamo"**. Mostrar quién lo registró se **descartó** el 19/10: el dato está en la auditoría (acción RECLAMO).

### Bloque "Factura en {plataforma}"

**Descartado el 19/10:** la factura interna de SGTL hace de factura fiscal y la proforma termina en Facturada; no se registra el N° de la factura en la plataforma (§10 del documento de negocio).

### Listado de proformas

- **N°:** "PF-00000123" con la etiqueta "{plataforma} 7594" al lado; un borrador de plataforma (todavía sin PF) muestra solo "{plataforma} 7594".
- **Reclamo pendiente:** junto al estado, ícono de admiración (`bi-exclamation-circle`, color de advertencia) con tooltip y `aria-label` "Reclamo pendiente en {plataforma} desde el dd/mm".
- **Filtros:** "Tipo" (Propia / Plataforma) y "Con reclamo pendiente".

### Textos

Mismos nombres en todos lados: "Excel de {plataforma}", "N° de proforma en {plataforma}", "Reclamo en {plataforma}". Verbos en infinitivo en los botones (Elegir Excel, Reemplazar Excel, Volver a controlar, Registrar reclamo, Cerrar reclamo, Generar) y voseo en las ayudas.

---

## 5. Etapas (cada una se prueba en la VM antes de seguir)

| Etapa | Qué incluye | Cómo se prueba en la VM |
|---|---|---|
| **1. Base** | Script `01_plataformas_y_proformas.sql` (tabla `PLATAFORMAS` con Rukas, `CLIENTES.PlataformaID`, columnas y tablas de proforma) | Rocío lo corre. Verificar columnas y tablas y que los clientes `Con_plataforma` quedaron con Rukas; volver a correrlo y que no falle (idempotente). Facturación de proformas propias sigue igual. |
| **2. Importar y controlar** | Lector de Rukas, `Importar`, `Controlar`, modal adaptado (bloque del Excel, control por línea, totales), eliminar borrador, y corregir tarifa y km de un viaje con plataforma sin proforma o en borrador | Importar **Excels de prueba** (ver §6): cada caso (coincide, importe distinto, transporte no encontrado, viaje inexistente, viaje ya facturado, archivo inválido). Corregir la tarifa de un viaje y "Volver a controlar". N° repetido rechazado. Eliminar un borrador libera los viajes. Un cliente directo ve el modal igual que antes |
| **3. Reclamo, reemplazar y generar** | `Reclamo`, `ReemplazarArchivo`, `Generar`, `Anular`, ícono y filtro de reclamo en el listado, bloqueos en los endpoints de proforma propia | Registrar y cerrar un reclamo; ícono y tooltip en el listado. Reemplazar el Excel por uno corregido (cierra el reclamo). "Generar" deshabilitado con diferencias; con todo OK queda `Aceptada` con número PF y los viajes en Listo para facturar. Anular y verificar que los viajes quedan libres |
| **4. Guía y avisos** | `ViajesSinProforma`: guía antes de generar en la plataforma y aviso del caso 7 | Viajes de prueba sin proforma aparecen en la guía y en el aviso; los de otra proforma no |
| **5. Factura** | Emitir la factura desde una proforma de plataforma con el flujo de Facu | Neto = total de la plataforma, más IVA 21 % (para la proforma 7450 daría $4.931.551,02, igual que la factura real); viajes pasan a `Facturado`; PDF de factura y de proforma se ven bien; NC cancelatoria libera los viajes y se puede volver a importar |
| ~~**6. N° de factura en la plataforma**~~ | **Descartada el 19/10:** la factura interna hace de fiscal y la proforma termina en Facturada (§10 del documento de negocio) | — |
| **7. Cierre** | Recorrida completa con la VM, reporte en `docs/pruebas/`, pendientes al día, revisión a mano de Rocío y paso de `rocionuvoli` a `main` | — |

Las etapas 2 y 3 son el núcleo (y se pueden probar en la misma ronda); con eso ya se puede mostrar el flujo completo en una demo (la factura de la etapa 5 debería funcionar sin cambios).

---

## 6. Datos de prueba

- **No usar el Excel real** (es de un cliente) ni subirlo al repo.
- Armar **Excels de prueba con el formato de Rukas** (§12 del documento de negocio) y datos inventados: uno todo OK (con adicionales), uno con importe distinto (y su versión corregida, para "Reemplazar Excel"), uno con transporte inexistente, uno con transporte repetido. Los genero yo.
- En la VM, un cliente de prueba `Con_plataforma` con viajes de prueba que tengan esos N° de transporte.
- Los Excel de prueba van en **`docs/pruebas/datos/`** (decidido el 19/10), con nombres que digan qué caso prueban (por ejemplo `proforma-rukas-ok.xlsx`, `proforma-rukas-importe-distinto.xlsx`).

---

## 7. Riesgos y cómo se cubren

| Riesgo | Cobertura |
|---|---|
| Rukas cambia el formato del Excel | El lector valida encabezados exactos y rechaza con un mensaje claro; no lee mal en silencio. Si cambia, se ajusta solo el lector. |
| Aparece otra plataforma | Un registro en `PLATAFORMAS` + su lector; el circuito, las pantallas y la base no cambian. |
| Conflictos con los cambios de Facu | Archivos nuevos para lo de plataforma; enganches acotados; la lógica del modal en un JS aparte. |
| No se puede compilar en la Mac | Cada etapa se revisa con cuidado y se dice qué probar en la VM; etapas chicas para que un error de compilación sea fácil de ubicar. |
| Las premisas de Claudia resultan distintas | Si Marfrig genera la proforma, cambia quién la exporta, no el resto del flujo. Si TS sí puede corregir en Rukas, en vez de reclamar se corrige allá y se reemplaza el Excel: el flujo de SGTL no cambia. |
| IVA mal interpretado (1-B) | Cerrado: confirmado con una factura real que los importes son netos. |
