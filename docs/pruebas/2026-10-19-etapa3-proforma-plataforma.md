# Reporte de pruebas — Etapa 3 proforma de plataforma (reclamo, reemplazar y generar) — 2026-10-19

> Resumen del reporte de la sesión de pruebas de la VM (Cursor), hecho en la Mac. Seguimiento: ítem 6 de `docs/PENDIENTES-SISTEMA.md`.

## Entorno
`rocionuvoli` @ `99457ad`, API compilada, Live Server 5500. El Excel se cargó por código (el navegador integrado no abre el diálogo de archivos).

## Resultados
| # | Prueba | Resultado | Nota |
|---|---|---|---|
| 1 | "Volver a controlar" y cerrar (F1 de la etapa 2) | OK | Corregido |
| 2 | Registrar, cerrar y volver a registrar el reclamo; ícono y tooltip en el listado | OK con fallas | F1 y F2 |
| 3 | Reemplazar con el Excel de otro N° (990101) | OK | "El archivo es de la proforma 990101 y este borrador es la 990100…" |
| 4 | Reemplazar con `proforma-rukas-corregido` | OK con falla | Reclamo cerrado solo, 2 de 2 coinciden, Generar habilitado; total $53.941,80. F1 |
| 5 | Generar | OK en datos, falla en pantalla | PF-00000010, Aceptada, etiqueta Rukas 990100; viajes 25/26 a Listo para facturar. No apareció el mensaje y el modal quedó en "Generando…" (F1) |
| 6 | Emitir la factura con el flujo de Facu | **OK** | **FAC-00000010 por $53.941,80**, A 0002-00000010. Viajes 25/26 en Facturado |
| 7 | Registrar proforma con QUICKFOOD | OK | Pide el Excel |
| 8 | Consola | OK | Sin errores nuevos |

## Fallas (corregidas en la Mac el 19/10)
- **F1 — El modal quedaba en "procesando"** después de registrar o cerrar el reclamo, reemplazar el Excel y generar (Alta). En el éxito no se llamaba a `listo()` de `SGTL.procesando`. Al generar, la proforma se generaba igual, pero el modal no se cerraba ni mostraba el mensaje.
- **F2 — La fecha del reclamo venía en UTC** (Media): después de las 21 h proponía el día siguiente. Ahora usa la fecha local. "Importado el" y la fecha de la proforma generada salen de `GETDATE()` de la base (UTC); eso es el tema general de fechas (§2 de pendientes) y no se cambió acá.
- **F3 — El globo del reclamo quedaba flotando** al redibujar el listado (Baja). Ahora se cierran los tooltips antes de redibujar.

## Datos de prueba
Proforma 29 → **PF-00000010** (Aceptada, facturada con **FAC-00000010**, comprobante 17). Viajes 25 y 26 en Facturado. **Limpieza:** anular la factura con la nota de crédito cancelatoria desde Gestionar proformas (botón "Anular Factura a proforma"). La proforma queda anulada y los viajes se liberan. El N° PF-00000010 queda consumido. No borrar nada a mano.
