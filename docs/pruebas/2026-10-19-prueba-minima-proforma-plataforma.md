# Prueba mínima — proforma de plataforma antes de pasar a las ramas y a main — 2026-10-19

> Instrucciones para la sesión de la VM (Cursor). Seguimiento: ítems 6 y 17 de `docs/PENDIENTES-SISTEMA.md`. Cuando vuelva el reporte, los resultados se agregan al final de este archivo (lo hace la Mac).

## Instrucciones

```text
Rol: tester. No edites, no crees ni borres archivos del repo, no hagas commits y no corras SQL. Solo probá en la pantalla y reportá.
Seguí docs/equipo/PRUEBAS-VM-CLAUDE.md. Los Excel están en docs/pruebas/datos/ (leé el README.md de esa carpeta).

Objetivo: verificar lo mínimo antes de pasar rocionuvoli a las otras ramas y a main, y dejar los datos listos para la demo de mañana.
Si algo falla, anotalo y seguí con el paso siguiente, salvo en el paso 0.

0. Preparación
   git pull en rocionuvoli. Recompilá la API en Visual Studio. SI NO COMPILA, FRENÁ ACÁ y reportá el error exacto (archivo y línea).
   Levantá IIS Express y Live Server, iniciá sesión y hacé Ctrl+F5 en Gestionar proformas. Dejá la consola abierta.

1. Liberar los viajes de prueba (Rocío ya dio el OK)
   En Gestionar proformas, PF-00000010 (facturada con FAC-00000010) → botón "Anular Factura a proforma" → emitir la nota de crédito cancelatoria.
   Verificar: PF-00000010 queda Anulada, y los viajes 25 y 26 (990001/990002) quedan en Listo para facturar.

2. Volver a importar después de la nota de crédito (etapa 5)
   Registrar proforma → QUICKFOOD → "proforma-rukas-corregido (PROFORMA NRO 990100).xlsx" → Guardar borrador.
   Tiene que dejar importarla (no "ya está cargada") y dar los 2 "Coincide". NO generes. Eliminá el borrador.

3. Caso 2: reclamo a Rukas, condiciones y reemplazar
   a. Registrar proforma → QUICKFOOD. Debajo del Excel aparece "Viajes sin proforma (N)"; desplegada, están los viajes 25 y 26.
   b. Elegí "proforma-rukas-caso2-reclamo-a-rukas (PROFORMA NRO 990120).xlsx" → Guardar borrador: el 990002 da "Importe distinto" (Rukas $12.500, SGTL $14.790), y Generar queda en gris.
   c. Registrar reclamo (motivo "PRUEBA-CURSOR") → Guardar. En el listado aparece el ícono con el tooltip. El filtro Tipo "Con reclamo pendiente" la muestra.
   d. Cerrá el modal: NO tiene que aparecer el aviso de cambios sin guardar.
   e. Lápiz "Editar" del borrador: cambiá el plazo de pago → Guardar borrador → "Borrador guardado.". Volvé a abrirlo: está el plazo nuevo. "Ver" (ojo): todo en solo lectura.
   f. Reemplazar Excel con "proforma-rukas-caso2-reclamo-a-rukas-corregido (PROFORMA NRO 990120).xlsx": el reclamo se cierra solo, los 2 "Coincide", Generar en verde. Totales: IVA $9.361,80 y total $53.941,80.
   g. Botón PDF: "PROFORMA DE RUKAS", "N°: Borrador", N° en Rukas 990120 y las 2 líneas.
   h. NO generes. Eliminá el borrador.

4. Caso 3: corregir el viaje en SGTL
   a. Abrí el viaje 26 y cambiá el N° de transporte SAP de 990002 a 990020. Guardá.
   b. Registrar proforma → QUICKFOOD → "proforma-rukas-caso3-corregir-viaje-en-sgtl (PROFORMA NRO 990130).xlsx" → Guardar borrador: el 990002 da "Sin viaje", y el aviso amarillo menciona el viaje #26.
   c. En el viaje 26, volvé a poner 990002 y guardá. En el borrador, "Volver a controlar": los 2 "Coincide".
   d. Eliminá el borrador.

5. Lo que no es de Rukas
   a. Registrar proforma con un cliente directo → "Traer viajes" en un rango con viajes: trae líneas con importe, como antes. Cancelar y descartar (no guardes).
   b. Descargá el PDF de una proforma propia: igual que siempre ("Datos del servicio").
   c. Exportar listado (PDF) con el filtro Tipo "Plataforma": PF-00000010 sale como "PF-00000010 (Rukas 990100)".

6. Estado final (tiene que quedar así para la demo)
   - Ningún borrador de Rukas (990100, 990110, 990120, 990130).
   - Viajes 25 y 26 en Listo para facturar, con N° de transporte 990001 y 990002.
   - Consola sin errores nuevos.

Reporte: tabla con # / prueba / OK o falla / nota, más las fallas con pasos y captura. Rocío lo trae a la Mac y se agrega en la sección "Resultados" de este archivo.
```

## Resultados

> Resumen del reporte de la sesión de la VM (Cursor), hecho en la Mac.

**Entorno:** `rocionuvoli` @ `b4729e0`, API compilada (Rebuild Debug, 0 errores, solo warnings CS1591), Live Server en el puerto 5500, usuario RNUVOLI. El Excel se cargó por código (el navegador integrado no abre el diálogo de archivos).

**Resumen:** compila, y funcionan la anulación de FAC-00000010, la reimportación después de la nota de crédito (etapa 5), los tres casos de Rukas y el PDF de plataforma. Quedaron los datos de la demo. Una falla baja (F1). No se generó ninguna proforma nueva.

| # | Prueba | Resultado | Nota |
|---|---|---|---|
| 0 | Pull, compilación, login | OK | 0 errores |
| 1 | Anular FAC-00000010 con nota de crédito | OK | NC-00000003 por $53.941,80. PF-00000010 Anulada; viajes 25 y 26 en Listo para facturar |
| 2 | Reimportar 990100 después de la nota de crédito | OK | Proforma 30: 2 "Coincide", IVA $9.361,80, total $53.941,80. Eliminada |
| 3a | Viajes sin proforma de QUICKFOOD | OK | "Viajes sin proforma (2)": #25 (990001) y #26 (990002) |
| 3b | Caso 2: importe distinto (990120) | OK | 990002 Rukas $12.500 / SGTL $14.790; Generar en gris |
| 3c | Registrar reclamo | OK | Ícono y tooltip en el listado; filtro "Con reclamo pendiente" la muestra |
| 3d | Cerrar el modal después del reclamo | OK | Sin aviso de cambios sin guardar |
| 3e | Editar el plazo de pago y Ver | OK con falla | "Borrador guardado." y el plazo queda; en Ver, F1 |
| 3f | Reemplazar por el Excel corregido | OK | Reclamo cerrado solo, 2 "Coincide", Generar en verde; neto $44.580, IVA $9.361,80, total $53.941,80 |
| 3g | PDF del borrador | OK | "PROFORMA DE RUKAS", "N°: Borrador", N° 990120 y las 2 líneas; total $53.941,80. "Fecha:" sale "—" (sin fecha de emisión) |
| 3h | Eliminar el borrador | OK | Proforma 31 eliminada |
| 4a–4d | Caso 3: viaje 26 a 990020, importar 990130, corregir y volver a controlar | OK | "Sin viaje" y aviso del #26; corregido, 2 "Coincide" y el aviso desaparece. Proforma 32 eliminada |
| 5a | Cliente directo, Traer viajes | OK | No muestra el Excel; avisos claros (no había viajes libres) |
| 5b | PDF de proforma propia | OK | "DATOS DEL SERVICIO", sin el bloque de Rukas |
| 5c | Exportar listado con Tipo "Plataforma" | OK | "Filtros: Tipo: Plataforma" y "PF-00000010 (Rukas 990100)" |
| 6 | Estado final para la demo | OK | Única Rukas: PF-00000010 Anulada; sin borradores 9901xx; viajes 25 (990001) y 26 (990002) en Listo para facturar |

### Fallas

- **F1 — En "Ver" de un borrador de plataforma siguen activos "Reemplazar Excel", "Cerrar reclamo" y "Volver a controlar"** (Baja). Desde Ver, Reemplazar Excel llegó a reemplazar el archivo. Causa: `mostrarControl` arma esos botones para cualquier borrador, sin mirar el modo lectura. **Corregida en la Mac el 19/10:** en Ver no aparecen esos botones, ni "Registrar reclamo" ni "Generar proforma" (como en la propia, donde Ver oculta Guardar y Generar).

### Mejoras sugeridas

- En el PDF de un borrador, "Fecha:" sale "—" porque todavía no tiene fecha de emisión. Pasa lo mismo en un borrador propio (es el PDF de Facu): queda como está.

### Datos de prueba

NC-00000003 (anula FAC-00000010; PF-00000010 Anulada) es **el estado de la demo: no revertir**. Viajes 25 y 26 en Listo para facturar con 990001 y 990002 (el 26 se cambió a 990020 y se volvió a dejar). Proformas 30, 31 y 32 (Rukas 990100, 990120 y 990130): creadas y eliminadas por pantalla, sin generar. No hace falta SQL de limpieza.
