# Datos de prueba

Archivos con **datos inventados** para probar en la VM. Nunca datos reales de clientes (ver `docs/README.md`).

## Proforma de plataforma (Rukas)

Mismo formato que el Excel de Rukas (§12 de `docs/negocio/PROFORMA-CLIENTES-RUKAS.md`). El N° de proforma sale del nombre del archivo.

### Demo del 29/10: viajes 14 y 24

**Desde el 29/10, los viajes 25 y 26 están facturados** (se completó el circuito con ellos): los archivos de más abajo ya
no se pueden importar sin anular ese comprobante. Para la reunión van estos cuatro, con los dos viajes de QUICKFOOD que
quedaron Listo para facturar en la limpieza del 29/10: **#14** (N° de transporte **990004**, 13/10/2026) y **#24**
(**990005**, 18/10/2026), los dos Sede Quilmes → Sede Banfield, 1ª vuelta, **$ 429.101** cada uno en SGTL. Sin
adicionales. Si cambian el camión, los km, la hora o los adicionales de esos viajes, el importe cambia y hay que
actualizar los Excel.

| Archivo | N° | Caso | Qué se ve y qué se hace |
|---|---|---|---|
| `proforma-rukas-demo-caso1-todo-ok (PROFORMA NRO 990210).xlsx` | 990210 | **Todo coincide** | Los 2 "Coincide", Generar proforma habilitado. Generar → Aceptada → emitir el comprobante: neto $ 858.202 + IVA $ 180.222,42 = **$ 1.038.424,42** |
| `proforma-rukas-demo-caso2-reclamo-a-rukas (PROFORMA NRO 990220).xlsx` | 990220 | **Rukas está mal: hay que reclamar** | El 990005 viene a $ 400.000 y SGTL da $ 429.101: "Importe distinto", en "Para revisar". Registrar reclamo, marcar el 990005 y guardar: "Esperando a Rukas" |
| `proforma-rukas-demo-caso2-reclamo-a-rukas-corregido (PROFORMA NRO 990220).xlsx` | 990220 | Rukas ya corrigió | Reemplazar Excel en el borrador 990220: el reclamo se cierra solo y los 2 "Coincide" |
| `proforma-rukas-demo-caso3-corregir-viaje-en-sgtl (PROFORMA NRO 990230).xlsx` | 990230 | **SGTL está mal: hay que corregir el viaje** | El Excel está bien. **Preparación:** en el viaje #24 cambiar el N° de transporte de 990005 a **990050** (simula un error de carga). Al importar: 990005 "Sin viaje relacionado". El ícono del camión abre Gestionar viajes: corregir el #24 a 990005 y guardar; al volver a la pestaña de la proforma se vuelve a controlar solo y quedan los 2 "Coincide". **Eliminar el borrador** al terminar |

**Orden para la reunión:** 1) caso 3 (importar, corregir el viaje, volver a controlar y eliminar el borrador); 2) caso 2
(importar, registrar el reclamo, reemplazar por el corregido, generar y emitir el comprobante). El caso 1 sirve para
probar el circuito antes de la reunión: si se genera, no se puede volver a usar con los mismos viajes, así que para
probarlo alcanza con importarlo, ver los 2 "Coincide" y eliminar el borrador.

### Archivos anteriores (viajes 25 y 26)

**Viajes que usan todos los archivos:** los dos viajes de prueba de QUICKFOOD (cliente con plataforma) con N° de transporte SAP **990001** y **990002** (viajes 25 y 26 en la VM), con remito y N° de entrega cargados. En SGTL, con la tabla de agosto 2026 (Liviano 2016, tarifa fija hasta 130 km), el 990001 da **$429.101** (1ª vuelta) y el 990002 **$278.028** (2ª vuelta: mismo camión, mismo día, más tarde). Actualizados el 25/10, después de `database/tarifas/04_…`; si cambian la tabla, el camión, los km o la hora de los viajes, hay que actualizar los Excel con el importe nuevo. Los dos con fecha 16.10.2026, ruta "SEDE QUILMES - SEDE BANFIELD" (la de los viajes; se ve en el control y en el concepto de la proforma) y descripción "DISTRIBUCION AMBA", sin textos de prueba.

**Un caso a la vez:** como todos los archivos usan los mismos dos viajes, y un viaje puede estar en una sola proforma, antes de pasar al caso siguiente hay que **eliminar el borrador** del anterior (libera los viajes). Si un caso se genera y se factura, para volver a usar los viajes hay que anular la factura con la nota de crédito.

### Casos para la demo (uno por situación)

| Archivo | N° | Caso | Qué se ve y qué se hace |
|---|---|---|---|
| `proforma-rukas-caso1-todo-ok (PROFORMA NRO 990110).xlsx` | 990110 | **Todo coincide** | 2 transportes, los 2 "Coincide", "Generar proforma" habilitado. Generar → Aceptada → emitir la factura: neto $722.129 ($707.129 de viajes + $15.000 de adicional) + IVA $151.647,09 = **$873.776,09** |
| `proforma-rukas-caso2-reclamo-a-rukas (PROFORMA NRO 990120).xlsx` | 990120 | **Rukas está mal: hay que reclamar** | El 990002 viene a $250.000 y SGTL da $278.028: "Importe distinto", en "Para revisar". La tarifa del viaje está bien, así que se toca "Registrar reclamo", se marca el 990002 (el motivo se arma solo) y se guarda: pasa a "Esperando a Rukas" y el listado lo muestra junto al estado. Cuando Marfrig corrige, se usa "Reemplazar Excel" con el archivo siguiente |
| `proforma-rukas-caso2-reclamo-a-rukas-corregido (PROFORMA NRO 990120).xlsx` | 990120 | Rukas ya corrigió | "Reemplazar Excel" en el borrador 990120: el reclamo se cierra solo, los 2 "Coincide", se puede generar |
| `proforma-rukas-caso3-corregir-viaje-en-sgtl (PROFORMA NRO 990130).xlsx` | 990130 | **SGTL está mal: hay que corregir el viaje** | El Excel está bien. **Preparación:** en el viaje 26 cambiar el N° de transporte SAP de 990002 a **990020** (simula un error de carga). Al importar: 990002 "Sin viaje relacionado", en "Para corregir en SGTL" (el aviso de viajes sin proforma se sacó del control el 22/10). El ícono del camión abre Gestionar viajes en otra pestaña: abrir el viaje 26, corregir el N° a 990002 y guardar. Al volver a la pestaña de la proforma se vuelve a controlar solo → los 2 "Coincide" |

**Orden sugerido para la demo** (los tres casos con los mismos viajes): 1) caso 3: importar, corregir el viaje, volver a controlar y **eliminar el borrador**; 2) caso 2: importar, registrar el reclamo, reemplazar por el corregido, **generar y emitir la factura**. El caso 1 sirve para una prueba rápida del circuito completo.

### Casos técnicos (validaciones)

| Archivo | N° | Qué prueba |
|---|---|---|
| `proforma-rukas-diferencias (PROFORMA NRO 990100).xlsx` | 990100 | 990001 y 990002 con importes inventados y 990099, que no existe en SGTL: "Importe distinto" en los dos primeros y "Sin viaje relacionado" en el tercero |
| `proforma-rukas-corregido (PROFORMA NRO 990100).xlsx` | 990100 | Versión corregida de la anterior, para "Reemplazar Excel": todo OK |
| `proforma-rukas-repetido (PROFORMA NRO 990101).xlsx` | 990101 | El transporte 990001 dos veces. Desde el 22/10 **se crea el borrador**: la segunda línea queda como "Repetido en el Excel", en "Para reclamar a Rukas" (viene marcada al registrar el reclamo) |
| `proforma-rukas-formato-invalido (PROFORMA NRO 990102).xlsx` | 990102 | Encabezados que no son los de Rukas: se rechaza al importar ("Este archivo no es el Excel de Rukas: falta la columna …") y no se crea nada |
