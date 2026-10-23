# Datos de prueba

Archivos con **datos inventados** para probar en la VM. Nunca datos reales de clientes (ver `docs/README.md`).

## Proforma de plataforma (Rukas)

Mismo formato que el Excel de Rukas (§12 de `docs/negocio/PROFORMA-CLIENTES-RUKAS.md`). El N° de proforma sale del nombre del archivo.

**Viajes que usan todos los archivos:** los dos viajes de prueba de QUICKFOOD (cliente con plataforma) con N° de transporte SAP **990001** y **990002** (viajes 25 y 26 en la VM), con remito y N° de entrega cargados. En SGTL, cada uno da **$14.790** (tarifa por km #5: 17,4 km × $850, relevado el 19/10). Si cambia la tarifa #5 o los km, hay que regenerar los Excel con el importe nuevo.

**Un caso a la vez:** como todos los archivos usan los mismos dos viajes, y un viaje puede estar en una sola proforma, antes de pasar al caso siguiente hay que **eliminar el borrador** del anterior (libera los viajes). Si un caso se genera y se factura, para volver a usar los viajes hay que anular la factura con la nota de crédito.

### Casos para la demo (uno por situación)

| Archivo | N° | Caso | Qué se ve y qué se hace |
|---|---|---|---|
| `proforma-rukas-caso1-todo-ok (PROFORMA NRO 990110).xlsx` | 990110 | **Todo coincide** | 2 transportes, los 2 "Coincide", "Generar proforma" habilitado. Generar → Aceptada → emitir la factura: neto $44.580 ($29.580 de viajes + $15.000 de adicional) + IVA $9.361,80 = **$53.941,80** |
| `proforma-rukas-caso2-reclamo-a-rukas (PROFORMA NRO 990120).xlsx` | 990120 | **Rukas está mal: hay que reclamar** | El 990002 viene a $12.500 y SGTL da $14.790: "Importe distinto", en "Para revisar". La tarifa del viaje está bien, así que se toca "Registrar reclamo", se marca el 990002 (el motivo se arma solo) y se guarda: pasa a "Esperando a Rukas" y el listado lo muestra junto al estado. Cuando Marfrig corrige, se usa "Reemplazar Excel" con el archivo siguiente |
| `proforma-rukas-caso2-reclamo-a-rukas-corregido (PROFORMA NRO 990120).xlsx` | 990120 | Rukas ya corrigió | "Reemplazar Excel" en el borrador 990120: el reclamo se cierra solo, los 2 "Coincide", se puede generar |
| `proforma-rukas-caso3-corregir-viaje-en-sgtl (PROFORMA NRO 990130).xlsx` | 990130 | **SGTL está mal: hay que corregir el viaje** | El Excel está bien. **Preparación:** en el viaje 26 cambiar el N° de transporte SAP de 990002 a **990020** (simula un error de carga). Al importar: 990002 "Sin viaje relacionado en SGTL", en "Para corregir en SGTL" (el aviso de viajes sin proforma se sacó del control el 22/10). El ícono del camión abre Gestionar viajes en otra pestaña: abrir el viaje 26, corregir el N° a 990002 y guardar. Al volver a la pestaña de la proforma se vuelve a controlar solo → los 2 "Coincide" |

**Orden sugerido para la demo** (los tres casos con los mismos viajes): 1) caso 3: importar, corregir el viaje, volver a controlar y **eliminar el borrador**; 2) caso 2: importar, registrar el reclamo, reemplazar por el corregido, **generar y emitir la factura**. El caso 1 sirve para una prueba rápida del circuito completo.

### Casos técnicos (validaciones)

| Archivo | N° | Qué prueba |
|---|---|---|
| `proforma-rukas-diferencias (PROFORMA NRO 990100).xlsx` | 990100 | 990001 y 990002 con importes inventados y 990099, que no existe en SGTL: "Importe distinto" en los dos primeros y "Sin viaje relacionado en SGTL" en el tercero |
| `proforma-rukas-corregido (PROFORMA NRO 990100).xlsx` | 990100 | Versión corregida de la anterior, para "Reemplazar Excel": todo OK |
| `proforma-rukas-repetido (PROFORMA NRO 990101).xlsx` | 990101 | El transporte 990001 dos veces. Desde el 22/10 **se crea el borrador**: la segunda línea queda como "Repetido en el Excel", en "Para reclamar a Rukas" (viene marcada al registrar el reclamo) |
| `proforma-rukas-formato-invalido (PROFORMA NRO 990102).xlsx` | 990102 | Encabezados que no son los de Rukas: se rechaza al importar ("Este archivo no es el Excel de Rukas: falta la columna …") y no se crea nada |
