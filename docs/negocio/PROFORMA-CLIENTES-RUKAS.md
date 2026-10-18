# Proforma en clientes Rukas / Marfrig — resumen de definición

Documento para alinear equipo (y para retomar el diseño en otra conversación o con otra IA).
Fecha de esta nota: 15/10/2026.
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

## 10. Diseño técnico acordado (15/10/2026, con Claude)

Bajada concreta de la opción B. **Todavía no implementado**: espera las respuestas de Claudia (§11) y el OK de Facu.

### Idea central

No se arma un módulo aparte: la proforma de SGTL pasa a tener **dos tipos**.

- **Propia** — la de hoy, para clientes directos. Sin cambios.
- **Recibida** — registra la proforma de Marfrig, para clientes `Con_plataforma`.

La factura de TS sale **con el flujo actual de Facu, sin cambios**: hoy exige una proforma `Aceptada` con conceptos y totales coherentes, y la recibida cumple ese contrato. Cuenta corriente, anulación y "viaje ya facturado" siguen igual.

### Base de datos (script nuevo en `database/`)

- `PROFORMAS`: columna `Tipo_Proforma` (`Propia` / `Recibida`, default `Propia`) + datos de Marfrig: N°, fecha y total declarado.
- Tabla nueva `PROFORMA_ADJUNTO` para el PDF de Marfrig (mismo patrón que `VIAJE_EVIDENCIA`: nombre, tipo, `VARBINARY(MAX)`).

### Flujo

1. Nueva proforma → si el cliente es `Con_plataforma`, el modal muestra el bloque **"Proforma recibida de Marfrig"** (N°, fecha, total, PDF).
2. **Traer viajes** como hoy (tarifas SGTL). Mejora deseable: elegirlos por N° de remito / transporte tal como figuran en la proforma de Marfrig, no solo por período.
3. **Panel de control:** total Marfrig vs total SGTL, diferencia, viajes sin remito / transporte.
4. **Registrar** (en lugar de "Generar"): asigna el número interno PF y pasa los viajes a **Facturado**.
5. Si los totales coinciden → **Aceptada** directo (no se "envía" a Marfrig) → factura TS.
6. Si **no coinciden** → estado **En reclamo** con motivo obligatorio. No se puede facturar hasta resolverlo:
   - Marfrig manda proforma corregida → se actualizan N°, total y PDF y se vuelve a controlar; o
   - se acepta igual, con motivo, por uno de estos caminos (**a definir según lo que hace hoy Claudia**):
     - (a) línea visible de ajuste "Diferencia según proforma Marfrig N° X", para que la factura iguale a Marfrig;
     - (b) facturar con tarifas SGTL y dejar la diferencia registrada.

**Por qué puede haber diferencias aunque los viajes sean los correctos:** tarifa Marfrig vs tarifa cargada en SGTL, km en viajes por kilómetro, adicionales / descuentos que viven en Rukas (rechazos, parciales, estadías), un viaje que Marfrig no incluyó o al revés. Ese control es el valor del módulo.

### Lectura del PDF (después, sin rediseño)

- El PDF ya queda guardado desde la v1 (`PROFORMA_ADJUNTO`).
- Se agrega un endpoint que lee el texto (PdfPig, NuGet) y devuelve **valores sugeridos** (N°, fecha, total, lista de remitos) para precompletar los mismos campos de la v1; la persona confirma.
- Si el PDF trae remitos, el mismo endpoint permite **preseleccionar los viajes**.
- Sin cambios de base ni del circuito de facturación. OCR solo si el PDF resulta ser un escaneo.
- Condición: que los campos de la v1 tengan la forma del PDF real → **el ejemplo de Claudia se necesita antes de implementar**. El PDF de ejemplo no se sube al repo (es documento de un cliente).

### Fuera de la v1

Lectura automática del PDF, OCR, matching línea por línea PDF ↔ viaje.

---

## 11. Preguntas abiertas (para Facu / Claudia / equipo)

1. ¿El total de la factura de TS debe igualar siempre el de la proforma Marfrig, o se factura con tarifas SGTL y se registra la diferencia?
2. ¿El PDF de Marfrig es obligatorio para emitir factura en clientes Rukas?
3. ¿Para Rukas desaparece del todo “Generar proforma” propia en SGTL, o conviven un tiempo?
4. ¿Hay un PDF real de ejemplo para diseñar la extracción y los controles? — **Pedido a Claudia el 15/10.**
6. ¿Qué hace hoy Claudia cuando el importe de la proforma de Marfrig no coincide con lo esperado (reclama, factura igual, ajusta)? — **Pedido a Claudia el 15/10.** Define la salida (a) / (b) del estado En reclamo (§10).
5. ¿Quién carga la proforma recibida en la práctica (Claudia / mesa) y en qué momento del flujo?

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

Rukas tiene estas acciones (algunas pueden ser solo para el perfil de Marfrig):

- **Bloquear un transporte para proforma**, con observación (y desbloquearlo después).
- **Anular un transporte**, con motivo obligatorio y comprobante adjunto (JPG o PDF). "Quitar anulación" lo devuelve a Pendientes.
- **Diferencia de número de entrega** entre SAP y TRF, con opción de actualizar la entrega.
- **Pasar a Preliquidar por excepción**, con justificación.
- **Modificar una proforma generada**: agregar o quitar transportes.

### Qué cambia respecto de lo definido en §5–§10

1. **Quién genera la proforma.** En la pantalla del transportista está el botón "Generar proforma". O sea que, por lo visto, **TS la genera en Rukas** eligiendo transportes ya cerrados, pero **con los importes que fija Marfrig**. Claudia había dicho que "la arma Marfrig": puede ser que se refiera a que Marfrig pone los importes. **Hay que confirmarlo con ella.**
2. **El PDF no hace falta.** No se necesita PdfPig ni OCR. La fuente es la **exportación a Excel del detalle** (N° de transporte, fecha, ruta, importe, adicionales). Importar ese Excel en SGTL permite:
   - cruzar **línea por línea** con los viajes por `Num_Transporte`, en lugar de controlar solo el total;
   - detectar viajes que están en Rukas y no en SGTL, o al revés;
   - comparar el importe de Rukas con la tarifa de SGTL **por viaje**.
3. **Respaldo:** el adjunto pasa a ser opcional. Sirve para guardar el Excel exportado o la imagen de la factura que se sube a Rukas.
4. **Pregunta 6 (§11), respondida en parte:** los reclamos se canalizan dentro de Rukas (bloqueo o anulación del transporte con motivo y comprobante, o modificación de la proforma). Falta saber qué hace Claudia en la práctica y si hay acuerdos por fuera del sistema.
5. **Paso nuevo después de facturar en SGTL:** cargar la factura en Rukas. Esa carga sigue siendo manual (sin API), pero SGTL puede mostrar el N° y la fecha listos para copiar y marcar "Cargada en Rukas".

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
