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

## 10. Preguntas abiertas (para Facu / Claudia / equipo)

1. ¿El total de la factura de TS debe igualar siempre el de la proforma Marfrig, o se factura con tarifas SGTL y se registra la diferencia?
2. ¿El PDF de Marfrig es obligatorio para emitir factura en clientes Rukas?
3. ¿Para Rukas desaparece del todo “Generar proforma” propia en SGTL, o conviven un tiempo?
4. ¿Hay un PDF real de ejemplo para diseñar la extracción y los controles?
5. ¿Quién carga la proforma recibida en la práctica (Claudia / mesa) y en qué momento del flujo?

---

## 11. Referencias en el repo

- `RELEVAMIENTO-RUKAS-CLAUDIA.md` — cuestionario (plantilla; respuestas completas están en el Google Doc).
- `CHECKLIST-OPERACION-VIAJES.md` — flujo operativo actual Rukas vs directo.
- `docs/cuenta-corriente-diseno.md` — contrato proforma → factura.
- Google Doc: *Relevamiento Marfrig-Rukas → SGTL* (respuestas de Claudia).
