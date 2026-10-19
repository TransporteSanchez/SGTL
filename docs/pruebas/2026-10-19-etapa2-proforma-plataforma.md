# Reporte de pruebas — Etapa 2 proforma de plataforma (importar y controlar) — 2026-10-19

> Resumen del reporte de la sesión de pruebas de la VM (Cursor), hecho en la Mac. Seguimiento: ítem 6 de
> `docs/PENDIENTES-SISTEMA.md`.

## Entorno
- `rocionuvoli` @ `a8059c4`, API compilada y levantada, Live Server en 5500.
- El Excel se cargó asignándolo al input por código: el navegador integrado no deja abrir el diálogo de archivos. El evento `change` es el mismo.

## Resultados
| # | Prueba | Resultado | Nota |
|---|---|---|---|
| 0 | Preparar viajes 25 y 26 (QUICKFOOD) con N° de transporte 990001 y 990002 | OK | Solo cambió `Num_Transporte` |
| 1 | QUICKFOOD muestra "Excel de Rukas"; cliente directo, "Traer viajes" | OK | |
| 2 | Formato inválido y transporte repetido | OK | Error en rojo dentro del modal, no se crea borrador |
| 3 | Excel de diferencias → Guardar borrador → control | OK | Proforma 29. 990001 y 990002 "Importe distinto" (SGTL $14.790: tarifa por km #5 · 17,4 km × $850), 990099 "Sin viaje". Neto $615.000 + IVA $129.150 = $744.150 |
| 4 | "Abrir viaje #25" y "Volver a controlar" | OK con falla | El viaje abre en otra pestaña con la tarifa habilitada. **F1** |
| 5 | Importar de nuevo el mismo N° | OK | Rechazado: "ya está cargada (Borrador)" |
| 6 | Abrir el borrador desde el listado | OK | Mismo control |
| 7 | Eliminar el borrador | No probado | Sin OK; el borrador 29 se deja para la etapa 3 |
| 8 | Consola | OK | Sin errores nuevos |

## Fallas
**F1 — Después de "Volver a controlar" el modal no se cierra** (Alta). Cerrar y la cruz quedan deshabilitados y Escape no cierra hasta recargar. Causa: en el éxito, `volverAControlar` no llamaba a `listo()` de `SGTL.procesando`, que deja el modal marcado como "procesando". **Corregida** en la Mac.

## Mejoras sugeridas
- El N° de Rukas no se actualizaba al cambiar de archivo. **Corregida:** se reemplaza mientras no se haya escrito a mano.
- El rechazo por N° repetido sugiere "Reemplazar Excel", que llega en la etapa 3. Queda: es la salida correcta una vez que exista.
- "Generar proforma" deshabilitado sigue viéndose verde. Pendiente para la etapa 3, junto con Generar.
- El input de archivo muestra textos del navegador en inglés ("Choose File"). Es el control nativo; pendiente menor.
- En un viaje Listo para facturar, la distancia se cambia con "Recalcular", no a mano (solo si Google falla). Es así por diseño.

## Datos de prueba
- Viajes 25 y 26: `Num_Transporte` pasó de `PRUEBA-CLAUDE-1` / `PRUEBA-CLAUDE-2` a `990001` / `990002`.
- Proforma 29: borrador de plataforma QUICKFOOD, N° Rukas 990100, con los viajes 25 y 26 reservados.
- **Se dejan para probar la etapa 3:** reemplazar el Excel del borrador 29 por `proforma-rukas-corregido (PROFORMA NRO 990100).xlsx` y generar.

Limpieza, cuando ya no hagan falta: eliminar la proforma 29 desde el listado (libera los viajes) y devolver el `Num_Transporte` de los viajes 25 y 26 a sus valores anteriores. La sesión de pruebas propuso el SQL.
