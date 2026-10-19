# Datos de prueba

Archivos con **datos inventados** para probar en la VM. Nunca datos reales de clientes (ver `docs/README.md`).

## Proforma de plataforma (Rukas) — etapa 2

Mismo formato que el Excel de Rukas (§12 de `docs/negocio/PROFORMA-CLIENTES-RUKAS.md`). El N° de proforma sale del nombre del archivo.

| Archivo | N° | Qué prueba |
|---|---|---|
| `proforma-rukas-diferencias (PROFORMA NRO 990100).xlsx` | 990100 | Transportes 990001 y 990002 (con un adicional de $15.000) con importes inventados, y 990099 que no existe en SGTL. Con los viajes de prueba preparados, da "Importe distinto" en los dos primeros y "Sin viaje" en el tercero |
| `proforma-rukas-repetido (PROFORMA NRO 990101).xlsx` | 990101 | El transporte 990001 dos veces: se rechaza al importar, no se crea el borrador |
| `proforma-rukas-formato-invalido (PROFORMA NRO 990102).xlsx` | 990102 | Encabezados que no son los de Rukas: se rechaza al importar, diciendo qué columna falta |

**Preparación:** dos viajes de prueba de un cliente Rukas (`Con_plataforma`) con N° de transporte SAP **990001** y **990002**, remito y N° de entrega cargados.

| `proforma-rukas-corregido (PROFORMA NRO 990100).xlsx` | 990100 | Versión corregida de la anterior, para **"Reemplazar Excel"** (etapa 3): 990001 y 990002 con el importe que da SGTL en la VM ($14.790: tarifa por km #5, 17,4 km × $850, relevado el 19/10) y el adicional de $15.000; sin el 990099. Con el borrador 990100 abierto, reemplazar por este archivo tiene que dar todo OK y habilitar Generar |

Si cambia la tarifa #5 o los km de los viajes de prueba, hay que regenerar el archivo corregido con el importe nuevo.
