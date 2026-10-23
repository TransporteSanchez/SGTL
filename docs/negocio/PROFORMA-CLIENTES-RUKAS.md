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

## 10. Diseño acordado (actualizado el 19/10/2026 con la reunión del equipo; reemplaza el del 18/10)

**Implementado en `rocionuvoli` (etapas 1–4, 19/10), pendiente de la recorrida final.** Quedan preguntas a Claudia (§11) que no cambian el flujo de SGTL. Plan de desarrollo por etapas: `docs/diseno/proforma-rukas-diseno.md`.

**Factura interna, sin N° de Rukas (decidido por Rocío el 19/10, reemplaza la etapa 6):** SGTL no está conectado a ARCA, así que la **factura interna de SGTL cumple el rol de la factura fiscal**: es la que se carga en Rukas, y la proforma de Rukas termina en **Facturada**, igual que una propia. La factura real de ARCA queda fuera del sistema y SGTL no registra si se cargó en Rukas (es una tarea operativa, como mandar la factura por mail; si no se carga, Marfrig no paga y se ve en la cuenta corriente). Cuando SGTL se integre con ARCA, esa misma factura interna pasa a ser la fiscal (con CAE) y el circuito no cambia. Las columnas `Plataforma_Factura_*` (etapa 1) quedan sin usar, reservadas para esa integración.

**Diseño genérico (decidido el 19/10):** el módulo se arma para cualquier **plataforma** de un cliente (un sistema del cliente con el que hay que conciliar); Rukas es la primera. En la base de datos y en el código se habla de "proforma de plataforma" (`Tipo_Proforma = 'Plataforma'`, tabla `PLATAFORMAS`); en la pantalla, los textos muestran el nombre de la plataforma ("Excel de Rukas", "Reclamo en Rukas"). Lo propio de cada plataforma (formato del archivo y con qué dato del viaje se cruza) va en un "lector" por plataforma. Este documento describe el caso concreto de Rukas; los nombres técnicos y las pantallas están en `docs/diseno/proforma-rukas-diseno.md` (§3 y §4).

**Qué cambió el 19/10 (reunión del equipo y definiciones de Rocío):** con diferencias **la proforma no avanza**. Queda en **borrador** hasta que se corrige donde corresponda (SGTL o Rukas) y el control da todo OK; recién ahí se genera, y nace **Aceptada**. No existe "aceptar con observación": toda diferencia es un error de un lado o del otro. Si hay que reclamar a Marfrig, el borrador lleva la marca **"Reclamo en Rukas"**. Los **adicionales** se toman de Rukas sin comparar. Se factura con la factura interna de SGTL, sin registrar el N° de Rukas (ver la decisión de arriba).

### Premisas

1. **Los datos de Rukas se cargan en los viajes de SGTL a medida que se obtienen** (N° de transporte SAP, remito, N° de entrega), como hoy. Los viajes no se crean desde el Excel.
2. **La proforma la genera Transporte Sanchez en Rukas**, eligiendo transportes ya cerrados. Los importes los fija Marfrig (costos SAP) y TS los conforma antes, viaje por viaje, en Cierre de Reparto. *(A confirmar con Claudia; ver §12.)*
3. **Una proforma ya generada no la puede corregir TS:** con su perfil no aparecen modificar, quitar transportes ni anular. La corrección se le pide a Marfrig. *(A confirmar con Claudia.)* **Supuesto para la tesis (22/10):** Marfrig corrige la misma proforma, que conserva su N° (cambia el importe o saca el transporte), y en SGTL se usa "Reemplazar Excel". Se infiere de las acciones del perfil de Marfrig que aparecen en el código de la pantalla (§12); no está verificado con Marfrig.
4. **El Excel es la proforma.** Rukas agrupa los viajes por **tanda** (cada proforma es un conjunto de transportes), y el Excel que se exporta del detalle es la vista previa de esa proforma. Es la **única fuente**: no se usa el mail de Marfrig ni el PDF (el perfil de TS ni siquiera tiene el botón). SGTL controla esa tanda contra los mismos viajes cargados en SGTL para dejar cerrada la proforma.
5. **No hay API pública de Rukas.** La integración es manual: el Excel se exporta desde Rukas y se importa en SGTL.
6. **La factura de TS se emite por el total de Rukas más IVA.** Los importes de Rukas son **netos** (verificado el 19/10 con una factura real: neto = total de la proforma en Rukas, más IVA 21 %). Como solo se genera la proforma cuando no hay diferencias, ese neto coincide con el de SGTL (tarifas netas) más los adicionales de Rukas.
7. **El cliente Rukas ya está marcado:** `CLIENTES.Tipo_Cliente = 'Con_plataforma'` (se suma a qué plataforma pertenece, hoy siempre Rukas). Es lo que hace que el modal de proforma pida el Excel en lugar de "Traer viajes", y lo que hoy define qué números pide el viaje.
8. **Rukas no factura:** la factura la emite TS y la carga en Rukas, que la muestra en Cerrados con número y fecha. Para SGTL, esa factura es la interna (ver la decisión de arriba): no se registra el número de Rukas.
9. **No hay importes acordados por debajo de la tarifa** (confirmado por Rocío el 19/10): Rukas nunca paga menos de lo que da la tarifa por un acuerdo puntual. Lo único que puede haber de más son los adicionales, que vienen aparte. Por eso toda diferencia de importe es un error, y la proforma no avanza hasta corregirlo.

### Idea central

No se arma un módulo aparte: la proforma de SGTL pasa a tener **dos tipos**.

- **Propia:** la de hoy, para clientes directos. Sin cambios: Borrador → Generada → Aceptada → Facturada.
- **De plataforma (Rukas):** se crea **importando el Excel** de una proforma de Rukas, para clientes `Con_plataforma`. Para esos clientes **es la única forma**: todos sus viajes pasan por Rukas (confirmado por Rocío el 19/10), así que la proforma propia queda bloqueada.

**Es el mismo modal de siempre ("Registrar proforma"), que se adapta según el cliente** (decidido el 19/10): con un cliente Rukas, en lugar de "Traer viajes" pide el Excel; se ocultan los datos del servicio que no aplican y aparecen los bloques de Rukas (control, reclamo, factura en Rukas). Los botones son los mismos: "Guardar borrador" la primera vez es la importación y "Generar proforma" se habilita solo con el control en OK. Detalle bloque por bloque: §4 del plan.

La factura sale **con el flujo actual de Facu, sin cambios**: proforma `Aceptada` con conceptos y totales coherentes → factura. Cuenta corriente, anulación con nota de crédito y "viaje ya facturado" siguen igual.

### Estados de la proforma Rukas

**Borrador → Aceptada → Facturada** (y Anulada).

- **Borrador:** se crea al importar el Excel, tenga o no diferencias. Guarda el Excel, sus líneas y el resultado del control. No se puede facturar. Se puede volver a controlar, reemplazar el Excel, registrar un reclamo o eliminar.
- **Aceptada:** al tocar **"Generar"**, que solo se habilita con el control en OK. Le asigna el número PF y la deja Aceptada directamente: Marfrig ya la aceptó en Rukas, así que no hay paso "Generada" ni "Marcar como aceptada".
- **Facturada:** al emitir la factura, como hoy. Es el final del circuito en SGTL.
- **Anulada:** una Aceptada se puede anular antes de facturar; después, nota de crédito como hoy. Un borrador no se anula: se elimina.

### Flujo

0. **Antes de generar en Rukas (ayuda opcional):** SGTL muestra, por cliente, los viajes con los números cargados que todavía no están en ninguna proforma, con su N° de transporte, para usarlos de guía al tildar en Rukas. Es el único momento en que TS decide qué entra en la proforma, y así se evitan la mayoría de las diferencias.
1. **En Rukas:** generar la proforma y exportar el Excel (Proceso → detalle de la proforma → ícono de Excel).
2. **En SGTL, "Registrar proforma":** se elige el cliente (Rukas) y el Excel, y se toca "Guardar borrador". El N° de proforma de Rukas sale del nombre del archivo y se puede corregir. Se crea la proforma Rukas en **Borrador** con el Excel y sus líneas, y los viajes que coinciden quedan reservados para ella (un viaje no puede estar en dos proformas).
3. **Control línea por línea:** cada línea se cruza con los viajes de SGTL por `Num_Transporte` y queda con uno de los resultados de la tabla de casos. Por línea se ve: importe del viaje en Rukas, importe en SGTL, diferencia, adicionales de Rukas y la tarifa usada. Arriba, los totales y la cantidad de diferencias.
4. **Si hay diferencias, la proforma queda en borrador** y la pantalla marca qué está mal y qué hacer en cada caso. Se puede salir y volver cuando se haya resuelto:
   - **El problema es de SGTL** (tarifa, viaje): se corrige y, desde el borrador, **"Volver a controlar"**.
   - **El problema es de Rukas:** se reclama a Marfrig y se registra el reclamo en el borrador (ver "Reclamo en Rukas"). Cuando Marfrig corrige esa misma proforma, se exporta el Excel de nuevo y en el borrador se usa **"Reemplazar Excel"**, que vuelve a controlar. Si Marfrig la anula y genera otra (otro N°), se **elimina** el borrador y se importa la nueva.
5. **Todo OK** (solo casos 1 y 7) → **"Generar"**: número PF, estado **Aceptada**. En ese momento los viajes que seguían en Registrado pasan a Listo para facturar.
6. **Factura:** con el flujo actual. La proforma Rukas tiene **una línea de concepto por transporte** (importe del viaje + adicionales de Rukas). Los viajes pasan a `Facturado` al emitir la factura, como hoy.
7. **Cargar la factura en Rukas:** fuera de SGTL. Se sube la factura interna (en la tesis hace de fiscal). SGTL no lo registra: la proforma ya quedó Facturada en el paso 6.

### Reclamo en Rukas (decidido el 19/10)

No es un estado: es una **marca en el borrador** que dice que se está esperando una corrección de Marfrig. El borrador reclamado sigue siendo un borrador (no avanza ni se factura).

- **Dentro de la proforma:** botón **"Registrar reclamo"**, que abre el modal "Registrar reclamo" con fecha (hoy por defecto) y motivo obligatorio. La proforma muestra un bloque "Reclamo en Rukas" con fecha, motivo y quién lo registró (este dato sale de la auditoría), y el botón "Cerrar reclamo" por si se resuelve sin un Excel nuevo.
- **En el listado de proformas:** junto al estado del borrador, un ícono de admiración con el tooltip **"Reclamo pendiente en Rukas desde el 20/10"** (y el mismo texto como `aria-label`, porque en pantallas táctiles no hay tooltip). Se puede filtrar por reclamos pendientes.
- **Se cierra solo** al reemplazar el Excel, al eliminar el borrador o al generar. Queda en la auditoría.
- **Por línea (22/10):** al registrarlo se marcan los transportes reclamados, que pasan a "Esperando a Rukas" en el borrador y en el listado. Así se distingue lo que espera a Marfrig de lo que hay que corregir en SGTL (ver "Errores y de quién son" en el §4 del plan).

### Diferencia de importe: decide la persona

El sistema muestra las dos cifras y la tarifa usada; no puede saber quién tiene razón:

- si **SGTL está mal** → se corrige en SGTL y "Volver a controlar";
- si **Rukas está mal** → "Registrar reclamo", se reclama a Marfrig y, con la corrección, "Reemplazar Excel".

**"SGTL está mal" puede ser dos cosas distintas**, y la pantalla tiene que permitir distinguirlas (por eso muestra qué tarifa usó cada viaje). Las tarifas tienen vigencia y el viaje guarda cuál se le aplicó:

- **El valor de la tarifa está mal cargado** → se edita la tarifa en Tarifas. Arregla todos los viajes que la usan, que es lo correcto porque estaba mal.
- **Al viaje le asignaron otra tarifa** (otra banda de km u otro período) → se cambia la tarifa **del viaje**, no la de la tabla. Editar la tabla en este caso arreglaría un viaje y rompería los demás.

**Cuándo se puede corregir la tarifa y los km de un viaje Rukas (decidido el 19/10):** mientras el viaje no esté en una proforma **Aceptada o Facturada**: sin proforma o dentro de un **borrador** (como hoy en las propias), esté en Registrado o en Listo para facturar, sin cambiar el estado. Origen y destino siguen bloqueados una vez que el viaje salió. En la práctica:

1. **Con el borrador abierto** (lo normal): se corrige el viaje y "Volver a controlar". Nunca hace falta borrar nada.
2. **Proforma ya Aceptada, sin facturar** (el error apareció después, raro): se anula la proforma (libera los viajes), se corrige y se vuelve a importar.
3. **Ya facturada:** nota de crédito como hoy, se corrige y se vuelve a importar.

**Qué muestra cada línea:** importe de Rukas, importe de SGTL, diferencia, adicionales y la tarifa usada, por ejemplo "Tarifa fija #3 · CD Córdoba → Villa María · $528.747" o "Tarifa por km #5 · 17,4 km × $850".

**Comparación al peso:** el importe de SGTL se redondea a pesos enteros (los de Rukas ya vienen así) y tiene que coincidir exacto.

**Tipo de tarifa:** los viajes Rukas pueden usar tarifa fija o por km (decidido el 19/10). Rukas paga un importe fijo por ruta: con tarifa por km el importe de SGTL coincide solo si la tarifa está calibrada para eso; si no, el control lo marca y la persona lo resuelve.

### Reglas

- **No puede haber dos proformas Rukas vigentes** (borrador incluido) con el mismo N° y el mismo cliente. Para volver a cargar un Excel de una proforma que está en borrador se usa "Reemplazar Excel".
- "Reemplazar Excel" exige el mismo N° de proforma en Rukas; si el N° es otro, es otra proforma: se elimina el borrador y se importa.
- Un viaje sigue pudiendo estar en **una sola proforma** (regla actual de `PROFORMAS_VIAJES`), sea propia o Rukas, también en borrador.
- Después de una nota de crédito (la proforma queda anulada) se puede volver a importar el mismo Excel.
- En el listado, los reportes y el PDF, la proforma Rukas se distingue de la propia: muestra el tipo y el N° de Rukas.

### Tabla de casos (control línea por línea)

| # | Situación | Qué se hace | ¿Deja generar? |
|---|---|---|---|
| 1 | **Coincide:** mismo transporte, mismo importe de viaje | Nada | Sí |
| 2 | **Mismo transporte, importe distinto; Rukas está mal** | Registrar reclamo; con la corrección, Reemplazar Excel | No |
| 3 | **Mismo transporte, importe distinto; SGTL está mal** (tarifa mal cargada o mal asignada) | Corregir en SGTL y Volver a controlar | No |
| 4 | **En Rukas sí, y SGTL no encuentra el transporte** porque al viaje le falta el N° o está mal cargado, **o le falta el remito o el N° de entrega** | Corregir el viaje en SGTL y Volver a controlar | No |
| 5 | **En Rukas sí, y el viaje no existe en SGTL** | Cargar el viaje en SGTL y Volver a controlar | No |
| 6 | **El transporte ya está facturado o en otra proforma en SGTL** | Revisar: es un posible cobro doble | No |
| 7 | **En SGTL hay viajes del cliente que no están en esta proforma** | Nada: es lo normal (ver abajo). No se avisa en el control desde el 22/10 | **Sí** |
| 8 | **El archivo no es el Excel de Rukas** (otro archivo, formato distinto, vacío), cliente que no es `Con_plataforma`, o ese N° de proforma ya está en una proforma **no anulada** | Se rechaza al importar: no se crea el borrador. Si el N° ya está cargado, se ofrece abrirlo | No |
| 8-B | **El Excel es de Rukas pero trae un dato mal:** transporte repetido, o importe, fecha o N° ilegible en una fila (cambio del 22/10: antes se rechazaba todo el archivo) | Se crea el borrador igual; esa línea queda como "Repetido en el Excel" o "Dato mal en el Excel" para reclamar a Marfrig. Con la corrección, Reemplazar Excel | No |

Los casos 2 y 3 son la misma situación vista desde los dos lados: la pantalla muestra "importe distinto" y la persona elige la salida.

**Adicionales:** no se comparan (SGTL no los registra por viaje). Se muestran por línea y se suman a la proforma tal como vienen de Rukas.

**Viajes en "Registrado" (decidido el 19/10):** no hace falta pasarlos a mano a "Listo para facturar" antes de importar. Que el viaje esté en la tanda de Rukas ya confirma que está cerrado. Al **generar** la proforma (control OK), los viajes que seguían en Registrado pasan solos a **Listo para facturar**, y queda en la auditoría. Mientras la proforma está en borrador el viaje no cambia de estado. Para pasar, el viaje tiene que tener los tres números (transporte SAP, remito y entrega), igual que hoy al pasarlo a mano; si falta alguno, es el caso 4. Después sigue como cualquier viaje: Facturado al emitir la factura, y de vuelta a Listo para facturar si una nota de crédito anula la factura.

**Guía (paso 0):** para clientes Rukas cuentan los viajes con los números cargados que no están en ninguna proforma, estén en Registrado o en Listo para facturar.

**Caso 7.** Una proforma de Rukas es un lote: incluye solo los transportes que se tildaron al generarla. Que SGTL tenga más viajes es normal:

- El viaje **todavía está en Pendientes en Rukas** (sin cierre de reparto): va en la próxima proforma.
- **Ya está en otra proforma de Rukas** importada antes: SGTL lo sabe y no lo cuenta.
- **Se pasó tildarlo:** va en la próxima proforma, o se le pide a Marfrig que lo agregue.

Por eso SGTL **no lo frena ni lo avisa en el control** (decidido por Rocío el 22/10: el aviso "Hay N viajes de este cliente… que no están en ninguna proforma de Rukas" cargaba la pantalla y casi siempre es lo normal). Esos viajes se ven en la **guía del paso 0** ("N viajes sin proforma para tildar en Rukas"), antes de tildar en Rukas, que es cuando sirven para no olvidarse de ninguno. Un viaje de Marfrig que está en SGTL y no existe en Rukas casi no puede pasar (los transportes los crea Marfrig); si aparece, lo más probable es un error de carga en SGTL (por ejemplo, el N° de transporte mal cargado, que en el control se ve como "Sin viaje relacionado", en "Para corregir en SGTL": el viaje puede existir, pero nada lo une con ese transporte).

### Base de datos (script nuevo en `database/`)

- **`PROFORMAS`:**
  - `Tipo_Proforma` (`Propia` / `Plataforma`, default `Propia`) y a qué plataforma corresponde (tabla nueva `PLATAFORMAS`, hoy con Rukas).
  - N° de la proforma en la plataforma.
  - Reclamo en Rukas: fecha y motivo (con la fecha vacía no hay reclamo pendiente). Quién lo registró y el historial salen de la auditoría.
  - N° y fecha de la factura según Rukas, más quién y cuándo los cargó.
- **Tabla nueva de líneas importadas** (`PROFORMA_PLATAFORMA_LINEA`): referencia (para Rukas, el N° de transporte), fecha, ruta, importe del viaje, adicionales y, del control, `Viaje_ID`, importe según SGTL, tarifa usada y resultado (casos 1–6). Se guarda al importar y se recalcula con "Volver a controlar" y "Reemplazar Excel".
- **`PROFORMA_ADJUNTO`** para el Excel original (mismo patrón que `VIAJE_EVIDENCIA`); se reemplaza con "Reemplazar Excel". Más adelante, también el PDF de la factura.
- Conceptos en `PROFORMA_DETALLE` (se arman al generar) y viajes en `PROFORMAS_VIAJES` (se reservan al importar), como hoy.

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

1. ~~¿El total de la factura de TS debe igualar siempre el de la proforma Marfrig?~~ **Sí**, y desde el 19/10 con diferencias la proforma no avanza (queda en borrador), así que coincide con SGTL (§10).
2. ~~¿El PDF de Marfrig es obligatorio?~~ **No aplica:** la fuente es el Excel. El adjunto (el Excel original) se guarda solo.
3. ~~¿Para Rukas desaparece "Generar proforma" propia?~~ **Sí:** para clientes `Con_plataforma` el modal de proforma pide el Excel en lugar de "Traer viajes" (19/10).
4. ~~¿Hay un PDF real de ejemplo?~~ **Resuelto con el Excel real** (18/10, §12).
- ~~¿Qué pasa si el Excel tiene diferencias?~~ **La proforma no avanza** (reunión del 19/10): queda en **borrador** hasta corregir en SGTL ("Volver a controlar") o en Rukas ("Reemplazar Excel"). Si la diferencia es de importe, decide la persona.
- ~~¿Se puede aceptar igual, con una observación?~~ **No** (19/10): toda diferencia es un error de un lado o del otro, así que no hay caso legítimo para facturar algo que no coincide.
- ~~¿Cómo queda registrado un reclamo a Marfrig?~~ Con la marca **"Reclamo en Rukas"** en el borrador (fecha y motivo; el usuario sale de la auditoría) y un ícono de admiración en el listado con el tooltip "Reclamo pendiente en Rukas desde el …". No es un estado (19/10).
- ~~¿Se comparan los adicionales?~~ **No** (19/10): SGTL no los registra por viaje; se toman de Rukas.
- ~~¿Qué estados tiene la proforma Rukas?~~ **Borrador → Aceptada → Facturada** (19/10). "Generar" se habilita solo con el control OK y la deja Aceptada directamente, porque Marfrig ya la aceptó en Rukas.
- ~~¿Hay que marcar que el cliente es Rukas?~~ **Ya está:** `Tipo_Cliente = 'Con_plataforma'`.
- ~~¿Puede haber importes acordados por debajo de la tarifa (descuentos, rebajas puntuales)?~~ **No** (19/10): solo adicionales, que se suman aparte.
- ~~¿Un cliente Rukas puede tener viajes que no pasan por Rukas?~~ **No** (19/10): para esos clientes, la proforma propia se bloquea.
- ~~¿Hay que pasar a mano los viajes a "Listo para facturar" antes de importar?~~ **No** (19/10): pasan solos al generar la proforma.

Abiertas:

5. ¿Quién carga la proforma en SGTL en la práctica (Claudia / mesa) y en qué momento?
6. ¿Qué hace hoy Claudia cuando un importe no coincide? Por lo visto (§12), reclama en Cierre de Reparto antes de dar conformidad. Confirmarlo.
7. ¿"Generar proforma" en Rukas lo aprietan ellos o Marfrig? (premisa 2 de §10)
8. Con una proforma ya generada, ¿la corrige Marfrig a pedido? ¿Por mail o por ticket? ¿Cuánto tarda? (premisa 3 de §10) **Para la tesis queda como supuesto (22/10):** corrige la misma proforma y conserva el N°. Confirmarlo con Claudia es validación futura. En la recorrida del 22/10 no hubo tickets de soporte en Rukas: los reclamos no pasan por ahí.
9. ~~¿Dónde se guarda el N° de factura que se carga en Rukas?~~ **En ningún lado (decidido por Rocío el 19/10, reemplaza la decisión anterior del mismo día de guardar N° y fecha en la proforma):** la factura que se carga en Rukas es la interna de SGTL, que ya tiene su número; la de ARCA queda fuera del sistema. Al integrar ARCA, la factura interna pasa a ser la fiscal. Ver la decisión al principio del §10.

   *Recomendación anterior (18/10), descartada por ahora:* guardar el N° fiscal en la factura de SGTL para todos los clientes:
   - **Campos:** letra, punto de venta (5 dígitos), número (8 dígitos), fecha fiscal y CAE opcional. Con eso se arma el formato que pide Rukas.
   - **Carga manual** después de emitir en ARCA ("Registrar factura fiscal").
   - **Validaciones:** formato correcto y número que no se repita; opcional, el total fiscal, con aviso si no coincide con el de SGTL.
   - **"Cargada en Rukas"** se habilita solo con el N° fiscal cargado.
   - **Listado "Sin factura fiscal"** para que no se pase ninguna.
   - **Para qué sirve:** trazabilidad proforma Rukas → factura SGTL → factura fiscal → cobro, imputar los recibos, y dejar el campo listo para una futura conexión con ARCA, que lo completaría sola.
10. ¿Rukas ofrece API o exportación para integradores? Preguntar por ticket de soporte o vía Marfrig.
11. ~~¿Los importes de Rukas son netos (sin IVA)?~~ **Sí, son netos** (verificado el 19/10 en la factura `A00005-00000659` de la proforma 7450, cargada en Rukas): neto gravado $4.075.662,00 (= total de la proforma en Rukas) + IVA 21 % $855.889,02 = total $4.931.551,02. La factura fiscal tiene una sola línea, "PROFORMA 7450", por el neto.

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

### Recorrida del 22/10 (solo lectura)

Para saber cómo corrige Marfrig una proforma reclamada, se revisó el historial que ve Transporte Sanchez (Control Proformas, Búsqueda y Soporte → Tickets). Sin números reales:

- **Las dos proformas en Proceso no comparten transportes** y cubren períodos seguidos que no se pisan. No hay rastro de una proforma anulada y emitida de nuevo.
- **"Búsqueda" por N° de transporte** devuelve solo la proforma actual del transporte; no muestra anuladas.
- **Tickets de soporte: ninguno** (ni pendientes, ni abiertos, ni cerrados).
- **Cierre Reparto** tiene transportes pendientes de cierre: ahí se da conformidad a la tarifa y los adicionales, antes de la proforma.

**Conclusión:** con el perfil de Transporte Sanchez no se ve cómo corrige Marfrig, pero no hubo reclamos después de generar una proforma. Queda como supuesto para la tesis que Marfrig corrige la misma proforma (premisa 3 de §10).

### Qué cambia respecto de lo definido en §5–§10

1. **Quién genera la proforma.** En la pantalla del transportista está el botón "Generar proforma". O sea que, por lo visto, **TS la genera en Rukas** eligiendo transportes ya cerrados, pero **con los importes que fija Marfrig**. Claudia había dicho que "la arma Marfrig": puede ser que se refiera a que Marfrig pone los importes. **Hay que confirmarlo con ella.**
2. **El PDF no hace falta.** No se necesita PdfPig ni OCR. La fuente es la **exportación a Excel del detalle** (N° de transporte, fecha, ruta, importe, adicionales). Importar ese Excel en SGTL permite:
   - cruzar **línea por línea** con los viajes por `Num_Transporte`, en lugar de controlar solo el total;
   - detectar viajes que están en Rukas y no en SGTL, o al revés;
   - comparar el importe de Rukas con la tarifa de SGTL **por viaje**.
3. **Respaldo:** el adjunto pasa a ser opcional. Sirve para guardar el Excel exportado o la imagen de la factura que se sube a Rukas.
4. **Pregunta 6 (§11), respondida en parte:** los reclamos se hacen en Cierre de Reparto, antes de dar conformidad. Una proforma ya generada la corrige Marfrig (TS no tiene esas opciones). Falta saber qué hace Claudia en la práctica.
5. **Paso nuevo después de facturar en SGTL:** cargar la factura en Rukas. Es manual (sin API) y queda fuera de SGTL (decisión del 19/10 en §10).

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
