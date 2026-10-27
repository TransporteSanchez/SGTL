# Viajes: el flujo completo y sus huecos

Revisión del punto 22 de la §41 de `docs/PENDIENTES-SISTEMA.md` (Rocío, 26/10: "que no haya huecos en el cambio de
estado, edición, proceso completo hacia adelante y hacia atrás; el profesor suele probar casos borde"). Hecha el 27/10
leyendo el código (`ViajesController`, `HojaDeRutaController`, `ProformasController`, `ComprobantesController`,
`PresupuestosController` y las pantallas), con lo que quedó de los puntos 3, 28, 33, 35 y 36 y la §43.

Los diagramas para la presentación siguen en `docs/negocio/FLUJOS-VIAJES-Y-PROFORMAS.md`. Este documento es la referencia
de **qué hace hoy el sistema** en cada caso y **qué falta resolver**.

---

## 1. Estados

| Cliente | Ida | Vuelta atrás |
|---|---|---|
| **Directo** | Registrado → En viaje → Entregado → Facturado | De a un paso: Entregado → En viaje → Registrado. Facturado → Entregado solo con la nota de crédito |
| **Con plataforma (Rukas)** | Registrado → Listo para facturar → Facturado | Listo para facturar → Registrado. Facturado → Listo para facturar solo con la nota de crédito |
| **Los dos** | Registrado → **Cancelado** (no se hizo; con motivo, fuera de una proforma) | Cancelado → Registrado, si el camión y el chofer están libres y el presupuesto del que salió no generó otro viaje |

- **Quién mueve cada paso:**
  - Registrado → En viaje: el chofer desde su hoja de ruta, **solo el día del viaje** (punto 33), o administración desde
    "Estado y entrega" (sin control de fecha).
  - En viaje → Entregado: el chofer o administración, con resultado (Completa, Parcial o Rechazo), fecha de entrega y la
    evidencia (obligatoria en los directos).
  - Registrado → Listo para facturar (Rukas): administración a mano (con los tres números y tarifa) o solo, al generar
    la proforma de Rukas.
  - → Facturado: solo la factura (no se elige a mano). ← Facturado: solo la nota de crédito, que además anula la
    proforma y libera los viajes.
- **Volver atrás** borra el resultado y la fecha de entrega; la evidencia y los gastos quedan.
- **En una proforma Generada o Aceptada** el viaje no cambia de estado ni se edita: se anula la proforma.

## 2. Qué se puede hacer según dónde está el viaje

| Situación | Editar | Eliminar | Gastos (chofer / administración) |
|---|---|---|---|
| **Registrado** sin proforma | Todo. Cambiar chofer, recorrido o fecha reenvía la hoja de ruta por WhatsApp. Camión y chofer no pueden estar ocupados (§43). La vuelta y el precio los decide el orden del día (§43) | Sí, con la confirmación de lo que pasa con los otros viajes del día | No / No |
| **En viaje** | Solo los números (remito, transporte, entrega), falso flete y estadía | No | Sí / No |
| **Entregado** | Igual que En viaje | No | Hasta 2 días después de la entrega / Sí |
| **Listo para facturar** (Rukas) | Además, la tarifa y los km (para que coincidan con Rukas), si no está en una proforma generada | No | Hasta 2 días después del fin / Sí |
| En un **borrador** de proforma | Según su estado | No (primero se quita del borrador) | Según su estado |
| En una proforma **Generada o Aceptada** | No: se anula la proforma | No | Según su estado |
| **Facturado** | No: nota de crédito | No | No / No |
| **Cancelado** | No (se vuelve a Registrado) | No: queda en el listado | No / No |
| **Generado desde un presupuesto aceptado** | Cliente, recorrido, km y tarifa fijos (son los del presupuesto) | No | Según su estado |

- **Precio para revisar** (§43): un viaje que ya salió, o de un presupuesto, al que le cambia el orden del día no se toca
  solo: se decide en el viaje (Actualizar o Mantener el precio) o con su proforma o su nota.
- **Galpón** (punto 28): cada viaje sale del galpón vigente el día de su inicio; al cambiar el galpón se elige el de los
  que no salieron. Los que salieron conservan el suyo.

## 3. Lo que se controla al cargar o editar

- Fin posterior al inicio y no antes de lo que tarda el viaje según Google (punto 36; sin la ruta de Google, km a mano,
  no hay control de horas).
- Camión y chofer libres en ese horario, contra otros viajes y presupuestos aceptados (§43).
- Chofer obligatorio en los directos (con plataforma, opcional).
- Tarifa de la tabla vigente el día del inicio, con el orden del día (§43, §34).
- Fecha de entrega no anterior al inicio.

---

## 4. Huecos encontrados

### 4.1 Para corregir (no hace falta decidir nada) — corregidos el 27/10

| # | Qué pasa hoy | Qué propongo |
|---|---|---|
| A | **La fecha de entrega podía ser futura** en "Estado y entrega" (la hoja de ruta ya lo controlaba). | **Hecho:** no posterior a hoy, en la pantalla (el calendario no deja elegir días futuros y debajo del campo: "No puede ser posterior a hoy.") y en la API. |
| B | **Eliminar un viaje Registrado con gastos** (los cargó en viaje y después se volvió atrás) daba un error técnico. | **Hecho:** Eliminar deshabilitado con el motivo "No se puede eliminar el viaje: tiene gastos cargados" (la API lo controla igual). |
| C | **La evidencia se podía adjuntar en Registrado**, y al eliminar el viaje quedaba suelta o daba error. | **Hecho:** en un directo, desde que salió (se sube al entregarlo); con plataforma, desde el día del viaje. Al eliminar un Registrado, una evidencia vieja se borra con él. |

### 4.2 Para decidir (negocio)

| # | Caso | Qué pasa hoy | Opciones |
|---|---|---|---|
| D | **Entrega con Rechazo o Parcial** | Queda Entregado como cualquiera, entra en la proforma y se cobra el precio completo. | 1) Se cobra igual (el viaje se hizo). 2) El Rechazo se cobra como "sin carga" o con otro porcentaje (se junta con el punto 10). 3) Lo decide administración en la proforma, línea por línea. |
| E | **Se cancela un viaje generado desde un presupuesto aceptado** | No se podía eliminar ("generado desde un presupuesto aceptado") ni cancelar: quedaba Registrado para siempre. | **Decidido y hecho (27/10): estado "Cancelado"** para todo viaje que no se hizo (sección 5). |
| F | **Se rompe el camión o cambia el chofer con el viaje en curso** | En viaje no se cambian camión ni chofer: hay que volver a Registrado, editarlo (al chofer nuevo le llega la hoja de ruta) y volver a iniciarlo. | 1) Dejarlo así (y explicarlo en el manual). 2) Permitir cambiarlos en viaje con un motivo que queda en Auditoría. |
| G | **Administración inicia un viaje de otro día** | Se puede (el chofer no, punto 33). | 1) Dejarlo así: administración corrige. 2) Avisar con una confirmación ("El viaje es del 30/10/2026. ¿Iniciarlo igual?"). |

### 4.3 Ya anotados que tocan este flujo

- **Punto 10, viaje sin carga (falso flete):** hoy se marca en cualquier estado; la propuesta es un estado final "Sin
  carga" desde En viaje (se junta con D).
- **Punto 11, estadía:** hoy se carga a mano; la propuesta es que salga de las horas que registra el chofer.
- **Punto 34, viajes pasados abiertos:** para la presentación, que los viajes viejos queden cerrados (Registrado con
  fecha pasada = "Quedó sin iniciar", En viaje pasado = "Entrega sin registrar").

---

## 5. Viaje cancelado (caso E, 27/10)

Decisiones de Rocío (maqueta `.claude/maquetas/viajes/cancelado.html`):

- **Desde Registrado**, con **motivo obligatorio**, y fuera de una proforma (de un borrador, primero se quita). Se elige en
  Cambiar estado (la banderita); no hay un botón nuevo. Etiqueta **roja**, como lo anulado.
- **Deja de contar** en el camión y el chofer ocupados, el orden del día (los otros viajes del día se acomodan como al
  eliminarlo), las proformas (Traer viajes no lo trae, no se suma a mano y en el Excel de Rukas va a "Para revisar"), los
  costos, el tablero y la hoja de ruta (pasa a Anteriores, sin botones). Si su precio estaba para revisar, queda resuelto.
- **Sigue en el listado**, filtrable, con el motivo, la fecha y el usuario en el globito y en Ver detalle (sin costo).
- **Vuelve a Registrado** si el camión y el chofer están libres; recupera su lugar en el orden del día.
- **Eliminar** queda solo para un viaje cargado por error (Registrado y que no venga de un presupuesto).
- **Presupuesto:** sigue Aceptado, en amarillo, con el ícono "El viaje #N que se generó con este presupuesto está
  cancelado: …" y "Generar viaje" habilitado. El viaje nuevo reemplaza al cancelado en el presupuesto; el cancelado
  guarda de qué presupuesto salió (`VIAJES.Cancelado_Presupuesto_ID`) y ya no se reactiva.
- **Falta decidir:** el aviso por WhatsApp al chofer (módulo de Fede). **"Sin carga"** (falso flete, desde En viaje) se
  ve con el punto 10.

---

## 6. Cómo se probó cada parte

Los cambios del 27/10 (orden del día, camión ocupado, iniciar en su día, gastos con tope, horas de Google, galpón) tienen
sus pasos de prueba en la §43 y en los puntos 28, 33, 35 y 36 de la §41 de `docs/PENDIENTES-SISTEMA.md`, y pruebas de Node
en `tests/orden-del-dia.test.js`, `tests/hoja-de-ruta.test.js`, `tests/control-interno.test.js` y
`tests/presupuestos-mapa-horarios.test.js`. Los huecos A–C y el estado Cancelado, en `tests/viajes-flujo.test.js`.
