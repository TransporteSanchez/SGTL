# Diseño funcional-técnico — Módulo Proformas (v1)

**Proyecto:** Transporte Sánchez · **Ubicación:** dentro de *Gestionar facturas* (alta/edición/gestión); *Listar facturas* solo muestra proformas ya generadas.

---

## 1. El cambio conceptual (lo más importante)

Hoy una "proforma" es un **resumen automático**: se elige cliente + rango de fechas y el sistema suma los importes de los **viajes** de ese período. El detalle son los viajes, no hay estados, ni numeración, ni conceptos editables, ni PDF.

El requerimiento pide un **documento comercial completo**, tipo presupuesto/factura no fiscal, con:

- Conceptos editables línea por línea (código, descripción, cantidad, unidad, precio, descuento, IVA, subtotal).
- Bloques de datos generales, cliente, transporte, condiciones comerciales y observaciones.
- Estados con flujo y reglas de edición.
- Numeración automática `PF-00000001`.
- PDF profesional A4 con leyenda "DOCUMENTO SIN VALIDEZ FISCAL".
- Auditoría de todas las acciones.

**En la práctica es rehacer y ampliar el módulo**, reutilizando lo que ya existe (clientes, viajes, tarifas) como fuente de datos.

---

## 2. Estado actual vs. requerido (gap analysis)

| Aspecto | Hoy | Requerido | Brecha |
|---|---|---|---|
| Detalle | Viajes agregados del período | Conceptos editables (línea a línea) | **Alta** — nueva tabla de detalle |
| Numeración | `Proforma_ID` interno | `PF-00000001` secuencial | **Alta** — secuencia + formato |
| Estados | No hay | Borrador/Generada/Enviada/Aceptada/Rechazada/Anulada | **Alta** — máquina de estados |
| Datos generales | Fechas desde/hasta | Emisión, vencimiento, moneda, sucursal, estado | **Media** |
| Bloque cliente | Solo ClienteID + razón | Razón, nombre comercial, CUIT, cond. IVA, dir., ciudad, prov., CP, tel., email, contacto | **Media** — snapshot en la proforma |
| Bloque transporte | No hay | Tipo servicio, origen/destino, fechas, tipo carga, peso, volumen, bultos, vehículo, obs. logísticas | **Alta** — campos nuevos |
| Totales | Solo total | Subtotal, descuentos, neto, IVA, otros, total | **Alta** — cálculo por línea |
| Condiciones comerciales | No hay | Forma/plazo de pago, validez, tiempo, obs., cond. particulares | **Media** |
| Acciones | Ver, eliminar | Ver, editar, PDF, descargar, duplicar, cambiar estado, anular | **Alta** |
| PDF | No hay | A4 profesional, paginado, sin validez fiscal | **Alta** |
| Email | No existe en el sistema | Enviar PDF por email | **Alta (opcional)** — requiere SMTP |
| Auditoría | Parcial | Todas las operaciones | **Media** |

---

## 3. Modelo de datos propuesto

### 3.1 `PROFORMAS` (ampliar) — cabecera + snapshot
Campos nuevos sobre la tabla actual:

- **Identificación:** `Numero` (varchar 'PF-00000001'), `Estado` (varchar), `FechaEmision`, `FechaVencimiento`, `Moneda`, `Sucursal` (opcional).
- **Snapshot de cliente** (se copian al crear, para que el documento sea fiel aunque el cliente cambie después): `ClienteID`, `Cli_RazonSocial`, `Cli_NombreComercial`, `Cli_CUIT`, `Cli_CondIVA`, `Cli_Direccion`, `Cli_Ciudad`, `Cli_Provincia`, `Cli_CP`, `Cli_Telefono`, `Cli_Email`, `Cli_Contacto`.
- **Bloque transporte:** `TipoServicio`, `Origen`, `Destino`, `FechaCarga`, `FechaEntrega`, `TipoCarga`, `Peso`, `Volumen`, `Bultos`, `VehiculoRequerido`, `ObsLogisticas`.
- **Condiciones comerciales:** `FormaPago`, `PlazoPago`, `Validez`, `TiempoServicio`, `ObsComerciales`, `CondParticulares`.
- **Observaciones:** `Observaciones` (nvarchar max).
- **Totales:** `Subtotal`, `Descuentos`, `SubtotalNeto`, `IVA`, `OtrosImpuestos`, `TotalGeneral`.
- **Auditoría básica:** `Usu_Alta`, `Fecha_Alta`, `Usu_Modi`, `Fecha_Modi`.

> Los campos actuales `FechaDesde/FechaHasta/ImporteTotal/CantidadViajes` se mantienen o migran (se pueden reusar como período del servicio + total).

### 3.2 `PROFORMA_DETALLE` (nueva) — líneas de concepto
`Detalle_ID` (PK, identity), `Proforma_ID` (FK), `Orden`, `Codigo`, `Concepto`, `Descripcion`, `Cantidad`, `Unidad`, `PrecioUnitario`, `DescuentoPct`, `IvaPct`, `Subtotal`.

### 3.3 Numeración
Usar una **SEQUENCE de SQL Server** (o tabla contador con transacción) para garantizar unicidad y secuencia. El número se asigna **al pasar de Borrador a Generada** (los borradores pueden no numerarse todavía, o numerarse desde el vamos — ver decisión abierta).

### 3.4 Snapshot vs. vivo
Recomendación: **snapshot** de cliente y de las líneas en la proforma. Un documento comercial debe ser inmutable una vez emitido; si mañana cambia la dirección del cliente, la proforma histórica no debe cambiar.

---

## 4. Máquina de estados

```
Borrador ──generar──▶ Generada ──enviar──▶ Enviada ──▶ Aceptada
   │                     │                    │           (final: solo ver/duplicar)
   │                     └──────────────────► Rechazada
   └── (editable)                              
Cualquiera (excepto Aceptada) ──anular──▶ Anulada  (no se elimina el registro)
```

Reglas:
- **Borrador:** editable en todo.
- **Generada/Enviada:** ya no se edita el contenido; se puede cambiar de estado, duplicar, imprimir.
- **Aceptada:** solo ver o duplicar (inmutable).
- **Anulada:** queda como registro anulado (no se borra).
- **Duplicar:** crea una nueva en Borrador copiando todo (nuevo número al generar).

---

## 5. Backend (endpoints propuestos, patrón actual Web API)

- `GET  api/Proformas` — grilla con filtros (numero, cliente, desde, hasta, estado, usuario) + paginado.
- `GET  api/Proformas/{id}` — cabecera + detalle (para ver/editar).
- `POST api/Proformas` — crear (Borrador).
- `PUT  api/Proformas/{id}` — editar (solo Borrador).
- `POST api/Proformas/{id}/Generar` — asigna número y pasa a Generada (valida).
- `POST api/Proformas/{id}/Estado` — cambiar estado (Enviada/Aceptada/Rechazada).
- `POST api/Proformas/{id}/Anular` — anula.
- `POST api/Proformas/{id}/Duplicar` — duplica en Borrador.
- `GET  api/Proformas/{id}/Pdf` — genera y devuelve el PDF.
- `POST api/Proformas/{id}/Email` — envía el PDF (si se implementa email).
- `GET  api/Proformas/PrellenarDesdeViajes?clienteId=&desde=&hasta=` — trae los viajes del cliente en el período como líneas sugeridas (reutilización de datos).
- Cada operación relevante → **INSERT en AUDITORIA** (usuario, fecha, acción).

---

## 6. Frontend

### 6.1 Gestionar facturas (alta/edición) — 7 bloques
Formulario dividido en bloques (Datos generales, Cliente, Transporte, Detalle de conceptos, Totales, Condiciones comerciales, Observaciones), con:
- Autocompletado del cliente al seleccionarlo.
- Tabla de conceptos editable (agregar/eliminar/duplicar línea) con **recálculo automático** de subtotales y totales en tiempo real.
- Botones: Guardar borrador, Generar proforma, Cancelar, Imprimir, Descargar PDF, Enviar email.
- Validaciones visuales de obligatorios (cliente, al menos un concepto, total > 0, origen/destino).

### 6.2 Listar facturas — grilla
Solo proformas **ya generadas** (no borradores). Columnas: Número, Fecha, Cliente, Destino, Total, Estado, Usuario creador, Acciones (Ver, Imprimir, Descargar, Duplicar, Cambiar estado, Anular). Filtros arriba: Número, Cliente, Fecha desde/hasta, Estado, Usuario, Buscar, Limpiar.

---

## 7. PDF

**Generación en el navegador (HTML→PDF)** con una librería tipo jsPDF + jsPDF-AutoTable (la tabla de conceptos pagina sola repitiendo encabezados) o html2pdf para fidelidad visual. Documento A4 vertical, márgenes ~20 mm, encabezado con logo + "PROFORMA" + número/fecha/estado, datos de empresa, recuadro de cliente, datos del servicio, tabla de conceptos con **paginación automática conservando encabezados**, totales alineados a la derecha con el total destacado, bloque de condiciones comerciales, observaciones, y pie fijo con la leyenda **"DOCUMENTO SIN VALIDEZ FISCAL"** + fecha/hora de emisión + usuario + número de página.

Formatos: moneda AR `$ 1.234.567,89`, fechas `DD/MM/AAAA`. La info en pantalla y en PDF debe coincidir exactamente.

---

## 8. Decisiones

**Cerradas:**
1. **Conceptos:** híbrido — se pueden prellenar desde los viajes del cliente y además editar/agregar líneas manuales.
2. **PDF:** generado en el navegador a partir del HTML (jsPDF + AutoTable / html2pdf).
3. **Email:** fase futura (botón preparado, SMTP después).
4. **IVA:** por línea, con alícuota seleccionable (21 % / 10,5 % / exento).

**Propuestas por defecto (a confirmar) para el resto:**
5. **Datos de cliente faltantes** (nombre comercial, persona de contacto, condición IVA como texto): se **capturan en la proforma** (snapshot editable); la condición IVA se deriva de `Cond_Fiscal` con una tabla de mapeo simple. **No** se modifica la tabla CLIENTES por ahora.
6. **Bloque transporte** (tipo servicio, tipo carga, peso, volumen, bultos, vehículo, obs. logísticas): se **cargan a mano** en la proforma (no existen en VIAJES).
7. **Moneda/Sucursal:** solo **ARS**; se **omite Sucursal** (no hay sucursales hoy).
8. **Numeración:** el número `PF-…` se asigna al **Generar** (los borradores quedan "sin numerar" hasta ese momento).
---

## 9. Plan por fases sugerido

- **Fase 1 — Núcleo:** modelo de datos (PROFORMAS ampliada + PROFORMA_DETALLE + numeración + estados), backend CRUD + generar/estado/anular/duplicar, pantalla Gestionar facturas con los 7 bloques y cálculo automático, y Listar facturas con filtros. Auditoría de cada acción.
- **Fase 2 — PDF:** generación del documento A4 profesional con paginación y leyenda.
- **Fase 3 — Email (opcional):** envío del PDF por SMTP.

---

## 10. Mapeo a criterios de aceptación
Los 11 criterios del requerimiento quedan cubiertos por: Fase 1 (1–8, 11), Fase 2 (9, 10) y Fase 3 (parte del envío). El detalle fino se cierra al resolver las decisiones abiertas.