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

_Pendiente: los completa la Mac con el reporte de la VM._
