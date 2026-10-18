# Proforma en clientes Rukas / Marfrig — resumen de definición

Documento para alinear equipo (y para retomar el diseño en otra conversación o con otra IA).
Fecha de esta nota: 15/10/2026. **Actualizada el 18/10/2026: el diseño vigente es el §10.** Los §5–§9 quedan como historia de la decisión (todavía hablan de leer el PDF, que se descartó).
Fuente operativa: respuestas de Claudia en el Doc *Relevamiento Marfrig-Rukas → SGTL*.

---

## 1. Qué dijo Claudia

- La **proforma** la arma **Marfrig**, la sube a Rukas y la envía por **mail**.
- La **factura** la hace **Transporte Sanchez** y la carga en Rukas.
- Son **dos documentos distintos**: proforma = Marfrig; factura = Transporte Sanchez.
- En el relevamiento marcó **“Ambos”**, no “solo SGTL”.
- Para armar lo interno mira en Rukas: remito, fecha, km, tarifa (y anotan también en Excel propio).

Cita resumida de Claudia:

> Son 2 cosas distintas: la proforma la arma Marfrig (la sube a Rukas y la envía por mail); la factura la hace Transporte Sanchez y la carga en Rukas.

---

## 2. Qué asume SGTL hoy

Hoy el módulo de Facturación modela:

**Proforma propia de Transporte Sanchez → Factura de Transporte Sanchez.**

Para clientes con plataforma (Rukas):

1. Se carga un **espejo del viaje** en SGTL (manual, sin API).
2. Estado: `Registrado` → `Listo_para_facturar` → `Facturado`.
3. En Facturación: “Traer viajes” → generar **proforma SGTL** → luego factura.

Eso **no coincide del todo** con la operación real descripta por Claudia: Transporte Sanchez **no emite** la proforma de Marfrig; la **recibe**. Lo que emite TS es la **factura**.

Para **clientes directos** (sin Rukas), la proforma propia de SGTL sí tiene sentido: SGTL es el único registro del viaje y del documento comercial previo a facturar.

---

## 3. Problema de valor del “espejo”

Si SGTL solo copia a mano lo que ya está en Rukas, la carga es **duplicada** y el beneficio es bajo (tener la info en un sistema propio / no depender 100% de Rukas).

El espejo justifica más esfuerzo si SGTL **concilia** la proforma recibida de Marfrig con los viajes/tarifas propias y recién ahí emite la factura de TS. Ahí el sistema aporta **control**, no solo archivo.

---

## 4. Definiciones de trabajo

| Concepto | Definición |
|---|---|
| **Proforma Marfrig** | Documento del cliente. Llega por mail / Rukas. No la emite Transporte Sanchez. |
| **Proforma recibida (SGTL)** | Registro en SGTL de esa proforma: n°, fecha, total, PDF adjunto, viajes vinculados, estado. |
| **Proforma propia (SGTL)** | La proforma actual del sistema. Se mantiene para **clientes directos** (sin Rukas). |
| **Factura TS** | Comprobante de Transporte Sanchez (módulo de cuenta corriente actual). Se emite desde la proforma recibida (Rukas) o desde la proforma propia (directos). |
| **Espejo de viaje** | Carga manual en SGTL de los datos útiles para facturar (cliente, origen/destino, remito, transporte SAP, N° entrega Rukas, tarifa, etc.). El PDF solo no alcanza. |
| **Valor buscado** | Conciliar Marfrig vs SGTL (totales, viajes, faltantes) **antes** de facturar. |

---

## 5. Opciones analizadas

### A — Rápida (mínima)

- Adjuntar el PDF de Marfrig como **respaldo**.
- Seguir facturando como hoy (proforma interna SGTL o flujo actual).

**Pros:** poco desarrollo, trazabilidad.  
**Contras:** sigue siendo carga manual; el PDF no controla nada.

### B — Proforma recibida (preferida)

- En SGTL, para clientes `Con_plataforma`, registrar la **proforma recibida** de Marfrig.
- Campos mínimos: n° Marfrig, fecha, total, PDF, viajes vinculados.
- Desde ahí emitir la **factura de Transporte Sanchez** (reutilizar flujo de cuenta corriente).
- Controles: total Marfrig vs total SGTL, viajes/remitos faltantes, diferencias → estado “Observada” con motivo.

**Pros:** alinea con Claudia; unifica documento del cliente + viajes + factura; da valor de conciliación.  
**Contras:** toca Facturación; quedan **dos caminos** hacia la factura (Rukas vs directo).

### B + lectura de PDF (mejora)

- Igual que B.
- Si el PDF es **digital con texto**, intentar autocompletar n° / total (p. ej. **PdfPig** en .NET).
- **OCR** (escaneos) solo más adelante: frágil y pesado para una primera versión.
- No depender de cloud/IA Document AI para el MVP.

**Pros:** menos tipeo, demo más sólida.  
**Contras:** sin un PDF de ejemplo real no se puede prometer extracción fiable.

### C — Sin proforma SGTL para Rukas

- Clientes plataforma: no “Generar proforma” en SGTL; solo “Emitir factura” (+ PDF opcional).
- Clientes directos: se mantiene proforma propia → factura.

**Pros:** muy fiel al negocio según Claudia.  
**Contras:** parte más el módulo; más decisión de producto/UI.

### Definición preferida por ahora

Ir por **B (proforma recibida)**, con lectura de PDF como mejora si hay tiempo y un PDF real de Marfrig.

**Actualización 18/10:** sigue siendo B, pero la proforma se trae **importando el Excel de Rukas** en lugar de leer un PDF. Ver §10 y §12.

---

## 6. Flujo propuesto (opción B)

1. **Alta** de proforma recibida: cliente (solo con plataforma), PDF, n° Marfrig, fecha, total.
2. **Vincular viajes** del período (`Listo_para_facturar`) — reutilizar “Traer viajes”.
3. **Panel de control / conciliación:**
   - Total Marfrig vs total calculado en SGTL (tarifas propias).
   - Viajes vinculados vs lo esperado / remitos y transporte SAP faltantes.
   - Resultado: OK / Diferencia / Falta dato.
4. **Resolución:**
   - Todo OK → aceptar y emitir **factura TS**.
   - Diferencias → estado **Observada** (motivo obligatorio).
   - Faltan datos → no deja facturar.
5. Viajes pasan a **Facturado**; el PDF de Marfrig queda de respaldo.

Para **clientes directos** no cambia el flujo actual: proforma propia SGTL → factura.

---

## 7. Datos mínimos vs opcionales

**Sí o sí (v1):**

- N° proforma Marfrig  
- Fecha  
- Total declarado  
- PDF adjunto  
- Viajes vinculados en SGTL (con remito + transporte SAP + tarifa)

**Opcionales / si el PDF lo trae y se puede leer:**

- Km totales  
- Desglose por remito / viaje  

Control más valioso aunque no se lean líneas: **total Marfrig vs total SGTL** + cobertura de viajes.

---

## 8. Alcance temporal sugerido

| Momento | Qué |
|---|---|
| **Demo inmediata** | No es bloqueante. El sistema actual funciona como proforma interna; el desvío es de modelo de negocio, no un bug. |
| **Semana próxima (MVP presentable)** | Proforma recibida + PDF + vincular viajes + controles (total / faltantes) + emitir factura TS. |
| **Si hay tiempo extra** | Extracción de texto con PdfPig cuando el PDF lo permita. |
| **Después** | OCR, matching automático línea PDF ↔ viaje, reglas finas de adicionales. |

Alinear con **Facu** (dueño de Facturación / cuenta corriente) antes de implementar.
Pedir a **Claudia** un **PDF de ejemplo** de proforma Marfrig (aunque con datos tapados) para diseñar campos y extracción.

---

## 9. Implicancias técnicas / de producto (resumen)

- Hoy: 1 proforma SGTL `Aceptada` → 1 factura (cuenta corriente). Hay que adaptar sin romper ese contrato.
- Nombrar bien en UI: “Proforma recibida (Marfrig)” vs “Proforma (propia)” para no confundir en tesis/demo.
- Origen de importes: ¿la factura copia el total Marfrig o recalcula con tarifas SGTL? Si difieren, el sistema debe **mostrar** la diferencia, no ocultarla.
- Lectura PDF: visor siempre; autocompletar solo si hay texto; OCR no es dependencia del MVP.
- Rukas sigue siendo el sistema **operativo** del viaje; SGTL gana en **facturación controlada + historial propio**.
- Comprobantes del diseño actual son comerciales internos (sin ARCA en el alcance documentado).

---

## 10. Diseño acordado (18/10/2026, reemplaza el del 15/10)

**Todavía no implementado.** Falta el OK de Facu (toca Facturación) y confirmar las premisas con Claudia (§11).

### Premisas

1. **La proforma la genera Transporte Sanchez en Rukas**, eligiendo transportes ya cerrados. Los importes los fija Marfrig (costos SAP) y TS los conforma antes, viaje por viaje, en Cierre de Reparto. *(A confirmar con Claudia; ver §12.)*
2. **Una proforma ya generada no la puede corregir TS:** con su perfil no aparecen modificar, quitar transportes ni anular. La corrección se le pide a Marfrig. *(A confirmar con Claudia.)*
3. **No hay API pública de Rukas.** La integración es manual: el **Excel del detalle** se exporta desde Rukas y se importa en SGTL. Del PDF no se lee nada (el perfil de TS ni siquiera tiene el botón).
4. **La factura de TS se emite por el total de Rukas.** Es lo que Marfrig paga y lo que se carga contra esa proforma. Si la tarifa de SGTL da otro importe, la diferencia queda registrada como aviso; la factura no la corrige.

### Idea central

No se arma un módulo aparte: la proforma de SGTL pasa a tener **dos tipos**.

- **Propia:** la de hoy, para clientes directos. Sin cambios: viajes → proforma → factura.
- **Rukas:** se crea **importando el Excel** de una proforma de Rukas, para clientes `Con_plataforma`. Reemplaza al botón "Generar proforma" propio para esos clientes.

La factura sale **con el flujo actual de Facu, sin cambios**: proforma `Aceptada` con conceptos y totales coherentes → factura. Cuenta corriente, anulación con nota de crédito y "viaje ya facturado" siguen igual.

### Flujo

0. **Antes de generar en Rukas (ayuda opcional):** SGTL muestra, por cliente, los viajes listos para facturar con su N° de transporte, para usarlos de guía al tildar en Rukas. Es el único momento en que TS decide qué entra en la proforma, y así se evitan la mayoría de las correcciones.
1. **En Rukas:** generar la proforma y exportar el Excel (Proceso → detalle de la proforma → ícono de Excel).
2. **En SGTL, "Importar proforma Rukas":** se elige el cliente y el archivo.
   - El N° de proforma de Rukas sale del nombre del archivo y se puede corregir.
   - Se valida el archivo (caso 8 de la tabla).
   - Se crea la proforma de tipo Rukas, con su número interno PF como cualquier otra, y se guardan el Excel original y las líneas.
3. **Control línea por línea:** cada línea se cruza con los viajes de SGTL por `Num_Transporte` y queda con uno de los resultados de la tabla de casos. Arriba, los totales: Rukas, SGTL y diferencia.
4. **Resolución:**
   - **Todo coincide** → **Aceptar**.
   - **Diferencias aceptables** (casos 2, 3 y 5) → **Aceptar con observación**: motivo obligatorio, queda en la auditoría.
   - **El error está en SGTL** (caso 4) → se corrige el viaje y se usa **Volver a controlar**, sin reimportar.
   - **El error está en Rukas** (casos 2 y 7, cuando corresponde corregir esta proforma) → **Pedir corrección a Marfrig**: la proforma pasa a `En corrección` con fecha, motivo y medio (mail o ticket), para que no quede olvidada.
     - Cuando Marfrig corrige la misma proforma → se baja el Excel de nuevo y se usa **Reimportar**: mismo N°, reemplaza las líneas y vuelve a controlar.
     - Si Marfrig la anula y genera otra (otro N°) → se **anula** la proforma en SGTL y se **importa** la nueva.
   - **Casos bloqueantes** (6 y 8) → no se puede aceptar, ni siquiera con observación.
5. **Factura:** con el flujo actual. La proforma Rukas tiene **una línea de concepto por transporte** (importe de viaje + adicionales de Rukas), así que el total es el de Rukas. Los viajes que coincidieron quedan vinculados y pasan a `Facturado` al emitir la factura, como hoy.
6. **Cargar en Rukas:** SGTL muestra el N° y la fecha de factura listos para copiar. Después de cargarla en Rukas, se marca **Cargada en Rukas** (fecha y usuario). Un listado muestra las facturas Rukas que faltan cargar. *(Ver pregunta 9 de §11: el N° que pide Rukas es el de la factura fiscal.)*

**Reglas:**

- **Reimportar** se puede solo hasta emitir la factura. Después, si algo cambia en Rukas, hace falta una nota de crédito, como hoy.
- **No puede haber dos proformas Rukas vigentes** con el mismo N° y el mismo cliente.
- Un viaje sigue pudiendo estar en **una sola proforma** (regla actual de `PROFORMAS_VIAJES`), sea propia o Rukas.

### Tabla de casos (control línea por línea)

| # | Situación | Qué se hace | ¿Frena la factura? |
|---|---|---|---|
| 1 | **Coincide:** mismo transporte, mismo importe | Nada | No |
| 2 | **Mismo transporte, importe distinto; Rukas está mal** (falta un adicional, tarifa equivocada) | Pedir corrección a Marfrig y reimportar, o aceptar con observación | Sí, hasta reimportar o aceptar con observación |
| 3 | **Mismo transporte, importe distinto; SGTL está mal** (tarifa vieja) | Aceptar con observación y, si corresponde, actualizar la tarifa en SGTL | No (se factura por el importe de Rukas) |
| 4 | **En Rukas sí, y SGTL no encuentra el transporte** porque al viaje le falta el N° o está mal cargado | Corregir el viaje en SGTL y volver a controlar | Sí, hasta corregirlo |
| 5 | **En Rukas sí, y el viaje no existe en SGTL** | Cargarlo en SGTL, o aceptar con observación "sin viaje en SGTL" | No, si se acepta con observación |
| 6 | **El transporte ya está facturado en SGTL** en otra proforma | Revisar: es un posible cobro doble | **Sí, siempre** |
| 7 | **En SGTL hay viajes del cliente que no están en esta proforma** | Aviso, no error (ver abajo) | **No** |
| 8 | **El archivo es inválido:** formato distinto, transporte repetido, cliente que no es `Con_plataforma`, o el N° ya está facturado en SGTL | Se rechaza al importar | Sí |

**Caso 7.** Una proforma de Rukas es un lote: incluye solo los transportes que se tildaron al generarla. Que SGTL tenga más viajes es normal:

- El viaje **todavía está en Pendientes en Rukas** (sin cierre de reparto): va en la próxima proforma.
- **Ya está en otra proforma de Rukas** importada antes: SGTL lo sabe y no lo cuenta.
- **Se pasó tildarlo:** recién ahí corresponde pedir la corrección a Marfrig, o dejarlo para la próxima proforma.

Por eso SGTL **avisa sin frenar**: "Hay N viajes de este cliente listos para facturar que no están en ninguna proforma de Rukas", con la fecha de cada uno. Un viaje de Marfrig que está en SGTL y no existe en Rukas casi no puede pasar (los transportes los crea Marfrig); si aparece, lo más probable es un error de carga en SGTL.

### Estados de la proforma Rukas

`Generada` (importada, en control) → `En corrección` (pedido a Marfrig) → `Generada` (reimportada) → `Aceptada` → `Facturada`. Desde cualquiera antes de `Facturada` se puede pasar a `Anulada`. Los estados `Borrador` y "enviada al cliente" no aplican.

### Base de datos (script nuevo en `database/`)

- **`PROFORMAS`:**
  - `Tipo_Proforma` (`Propia` / `Rukas`, default `Propia`).
  - N° de proforma Rukas.
  - Observación de aceptación.
  - Datos del pedido de corrección: fecha, motivo y medio.
  - Fecha y usuario de "Cargada en Rukas".
  - Revisar si `Estado` tiene alguna restricción que impida el valor nuevo `En corrección`.
- **Tabla nueva de líneas importadas** (por ejemplo `PROFORMA_RUKAS_LINEA`):
  - De la proforma: N° de transporte, fecha, ruta, importe de viaje y adicionales.
  - Del control: `Viaje_ID` encontrado (puede quedar vacío), importe según SGTL, resultado del control (casos 1–6) y observación.
  - Se reemplaza entera al reimportar.
- **`PROFORMA_ADJUNTO`** para el Excel original importado (mismo patrón que `VIAJE_EVIDENCIA`).
- Conceptos en `PROFORMA_DETALLE` y viajes en `PROFORMAS_VIAJES`, como hoy.

### Lectura del Excel

- Formato relevado con un archivo real: ver "Formato del Excel del detalle" en §12. Puntos clave:
  - `Importe Viajes` viene como texto con **coma de miles**.
  - `Fecha` viene como texto `dd.MM.yyyy`.
  - El N° de proforma solo está en el nombre del archivo.
- Librería .NET 4.8 para leer `.xlsx`: **DocumentFormat.OpenXml** o **ClosedXML** (las dos con licencia MIT). Hoy el proyecto no tiene ninguna. Se agrega por NuGet desde la VM.
- Si Rukas cambia el formato (columnas o encabezados), la importación lo rechaza con un mensaje claro en lugar de leer mal.

### Fuera de la v1

- Lectura de PDF y OCR: descartados (no hacen falta).
- Integración automática con Rukas: solo si Rukas ofrece una API para integradores (pregunta 10 de §11). No usar la API interna de su pantalla.
- Crear viajes en SGTL a partir de las líneas del Excel (el Excel no trae chofer ni camión).

---

## 11. Preguntas abiertas (para Facu / Claudia / equipo)

Respondidas o resueltas:

1. ~~¿El total de la factura de TS debe igualar siempre el de la proforma Marfrig?~~ **Sí:** se factura por el total de Rukas y la diferencia con la tarifa de SGTL queda como aviso (§10).
2. ~~¿El PDF de Marfrig es obligatorio?~~ **No aplica:** la fuente es el Excel. El adjunto (el Excel original) se guarda solo.
3. ~~¿Para Rukas desaparece "Generar proforma" propia?~~ **Sí:** para clientes `Con_plataforma` se reemplaza por "Importar proforma Rukas".
4. ~~¿Hay un PDF real de ejemplo?~~ **Resuelto con el Excel real** (18/10, §12).

Abiertas:

5. ¿Quién carga la proforma en SGTL en la práctica (Claudia / mesa) y en qué momento?
6. ¿Qué hace hoy Claudia cuando un importe no coincide? Por lo visto (§12), reclama en Cierre de Reparto antes de dar conformidad. Confirmarlo.
7. ¿"Generar proforma" en Rukas lo aprietan ellos o Marfrig? (premisa 1 de §10)
8. Con una proforma ya generada, ¿la corrige Marfrig a pedido? ¿Por mail o por ticket? ¿Cuánto tarda? (premisa 2 de §10)
9. El N° de factura que se carga en Rukas (formato `A00005-00000659`) es el de la **factura fiscal (ARCA)**. Los comprobantes de SGTL son internos y se numeran con un correlativo sin punto de venta. ¿Guardamos en SGTL el N° fiscal para la marca "Cargada en Rukas"? Ver con **Facu**.
10. ¿Rukas ofrece API o exportación para integradores? Preguntar por ticket de soporte o vía Marfrig.

---

## 12. Lo que muestra Rukas (relevado el 18/10/2026)

Recorrida de solo lectura por Rukas con el usuario de Transporte Sanchez (acceso dado por
Claudia), menú **Proforma → Control Proformas**. No se modificó nada. Acá no van números
reales de proformas, facturas ni importes.

### Circuito en Rukas (vista del transportista)

| Solapa | Qué hay |
|---|---|
| **Pendientes** | Transportes que salieron y todavía no tienen cierre de reparto. Columnas: fecha de salida, cierre de reparto, N° de transporte, empresa, ruta. |
| **Proforma** (Preliquidar) | Transportes cerrados y listos para proformar: N° de transporte, fecha, ruta, importe viajes y adicionales. Se tildan y el botón **Generar proforma** abre "Generación de Proforma": número (correlativo de Rukas), fecha, cantidad de viajes, total a facturar (viajes + adicionales). |
| **Proceso** | Proformas generadas que esperan la factura. Por cada una: N°, fecha, fecha de creación, cantidad de viajes, costo transporte, costo adicionales, total; botones de detalle, carga de factura e imágenes. |
| **Cerrados** | Proformas con factura cargada: además de lo anterior, fecha de cierre, **fecha y N° de factura** (formato `A00005-00000659`: letra + punto de venta de 5 dígitos + número de 8). |
| **Búsqueda** | Buscador por N° de proforma. |

**Carga de la factura de TS en Rukas:** primero se sube la imagen de la factura (JPG o PDF), después fecha y N° de factura y se confirma. Rukas le avisa por correo a Marfrig que se cargó la factura.

### Qué tiene una proforma de Rukas

- **No es un PDF:** es un registro dentro de Rukas. El detalle se ve en pantalla y se puede **exportar a Excel**.
- **Detalle por transporte:** una línea por viaje con **N° de transporte** (el que SGTL guarda como "N° de transporte SAP", `Num_Transporte`), fecha, ruta, importe del viaje y adicionales.
- **La tarifa va por ruta o banda de km**, con un importe fijo por banda (por ejemplo "CD CORDOBA - HASTA 130 KM"). No es km × tarifa.
- **Los importes los pone Marfrig** (costos SAP) y el transportista no los edita. Hay acciones de Marfrig como "copiar costos SAP" y un detalle por entrega con zona, peso / peso SAP y tarifa / $SAP.

### Diferencias y reclamos dentro de Rukas

El código de la pantalla tiene estas acciones, pero **con el perfil de Transporte Sanchez no se muestran**: van en solapas (Diferencias, Bloqueados, Anulados) o en menús que a TS le llegan vacíos. Serían del perfil de Marfrig:

- **Bloquear un transporte para proforma**, con observación, y desbloquearlo.
- **Anular un transporte**, con motivo obligatorio y comprobante adjunto (JPG o PDF). "Quitar anulación" lo devuelve a Pendientes.
- **Diferencia de número de entrega** entre SAP y TRF, con opción de actualizar la entrega.
- **Modificar una proforma generada:** agregar o quitar transportes.

TS sí tiene:

- **antes de generar la proforma**, elegir qué transportes cerrados entran;
- en los casos que Rukas habilita, **pasar un transporte pendiente a Preliquidar por excepción**, con justificación.

Según la capacitación de Rukas para empresas de transporte (septiembre 2025), en **Cierre de Reparto** TS carga los adicionales y **da conformidad del viaje, la tarifa y los adicionales**. Ese es el momento del reclamo, antes de la proforma.

### Qué cambia respecto de lo definido en §5–§10

1. **Quién genera la proforma.** En la pantalla del transportista está el botón "Generar proforma". O sea que, por lo visto, **TS la genera en Rukas** eligiendo transportes ya cerrados, pero **con los importes que fija Marfrig**. Claudia había dicho que "la arma Marfrig": puede ser que se refiera a que Marfrig pone los importes. **Hay que confirmarlo con ella.**
2. **El PDF no hace falta.** No se necesita PdfPig ni OCR. La fuente es la **exportación a Excel del detalle** (N° de transporte, fecha, ruta, importe, adicionales). Importar ese Excel en SGTL permite:
   - cruzar **línea por línea** con los viajes por `Num_Transporte`, en lugar de controlar solo el total;
   - detectar viajes que están en Rukas y no en SGTL, o al revés;
   - comparar el importe de Rukas con la tarifa de SGTL **por viaje**.
3. **Respaldo:** el adjunto pasa a ser opcional. Sirve para guardar el Excel exportado o la imagen de la factura que se sube a Rukas.
4. **Pregunta 6 (§11), respondida en parte:** los reclamos se hacen en Cierre de Reparto, antes de dar conformidad. Una proforma ya generada la corrige Marfrig (TS no tiene esas opciones). Falta saber qué hace Claudia en la práctica.
5. **Paso nuevo después de facturar en SGTL:** cargar la factura en Rukas. Esa carga sigue siendo manual (sin API), pero SGTL puede mostrar el N° y la fecha listos para copiar y marcar "Cargada en Rukas".

El diseño que sale de todo esto está en el §10.

### Formato del Excel del detalle

El botón de Excel del detalle (Proceso → Detalle Proforma) **arma el archivo en el navegador**, a partir de la misma tabla que se ve en pantalla. No hace ninguna acción en Rukas. Formato verificado con un archivo real (18/10/2026; el archivo **no se sube al repo**):

- **Nombre del archivo:** `MARFRIG - PROFORMA NRO <número>.xlsx`. **El N° de proforma solo figura en el nombre del archivo**: adentro no hay fila de título ni de totales.
- **Hoja única** `Sheet1`. **Fila 1 = encabezados**; desde la fila 2, una fila por transporte.

| Columna | Encabezado | Tipo de celda | Ejemplo de formato |
|---|---|---|---|
| A | `Transporte` | número | 6 dígitos |
| B | `Descripción Transporte` | texto | razón social del transportista |
| C | `Fecha` | **texto** | `14.09.2026` (`dd.mm.aaaa`) |
| D | `Ruta` | texto | `CD CORDOBA - HASTA 130 KM` |
| E | `Importe Viajes` | **texto** | `664,570` (coma = separador de miles, pesos enteros) |
| F | `Adicionales` | número | `0` |

**Cuidados al importar:**

- `Importe Viajes` viene como texto con **coma de miles**. Con cultura es-AR, `664,570` se leería como 664,57: hay que quitar las comas y tomarlo como entero.
- `Fecha` viene como texto: parsearla con el formato exacto `dd.MM.yyyy`.
- El total no viene en el archivo: se calcula sumando las columnas E y F.
- El N° de proforma se carga a mano o se toma del nombre del archivo.
- En la solapa Pendientes, el N° de transporte aparece con un prefijo (`ZQFV <número>`); en el Excel viene solo el número.
- En los listados de Rukas los importes aparecen como `ARS 5.292.185`, con punto de miles.

**PDF de Rukas:** el código de la pantalla tiene un botón para descargar la proforma en PDF (`PLV-…_pdf.php`), pero con el perfil de Transporte Sanchez no aparece. Ese es, probablemente, el PDF que Marfrig manda por mail.

---

## 13. Referencias en el repo

- `docs/negocio/RELEVAMIENTO-RUKAS-CLAUDIA.md` — cuestionario (plantilla; respuestas completas están en el Google Doc).
- `docs/negocio/CHECKLIST-OPERACION-VIAJES.md` — flujo operativo actual Rukas vs directo.
- `docs/diseno/cuenta-corriente-diseno.md` — contrato proforma → factura.
- Google Doc: *Relevamiento Marfrig-Rukas → SGTL* (respuestas de Claudia).
