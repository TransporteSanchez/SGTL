# Reporte de pruebas — Verificación F1: alta rápida de origen/destino — 18/10/2026

> Reporte de la sesión de pruebas de la VM, copiado tal cual. Seguimiento: §12 de
> `docs/PENDIENTES-SISTEMA.md`. El SQL de limpieza se revisó en la Mac: los nombres de tablas y
> columnas son correctos (`ORIGEN.Origen_ID`, `DESTINO.Destino_ID`, `VIAJES.OrigenID` / `DestinoID`).

## Entorno
- Rama / commit: rocionuvoli @ 4635408 "Docs: mejoras de la ronda del 18/10 listas para probar". Incluye `b4b12b5` "Viajes: alta rápida de origen/destino sin window.bootstrap" y los 6 commits posteriores. El árbol estaba limpio. No se hizo `pull`: el clon ya estaba al día con `origin/rocionuvoli`.
- API: http://localhost:50222/api (OK; `/api` solo devuelve 404 porque no tiene ruta, los endpoints responden 200)
- Front: Live Server puerto **5500** (5502 no responde)
- Alcance pedido: verificar F1 (ítem 12 de `docs/PENDIENTES-SISTEMA.md`): botones "+" de origen/destino en gestion-viajes y presupuestos, sin errores de `bootstrap`.

## Resumen
7 pruebas, las 7 **OK**. **F1 queda corregida.** En gestion-viajes `window.bootstrap` es `undefined`, justo el caso que fallaba. Ahora el modal abre por jQuery, crea el registro, lo deja elegido y vuelve al modal del viaje, siempre con un solo backdrop. En presupuestos `window.bootstrap` existe y el camino nativo también anda. No aparece ningún error de `bootstrap` en la consola.

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | gestion-viajes | Ctrl+F5 y JS nuevo | OK | `alta-rapida-ubicacion.js` servido ya trae el fallback `jQuery(...).modal('show')`. `typeof window.bootstrap` = `undefined`, `jQuery.fn.modal` existe |
| 2 | gestion-viajes | "Registrar viaje" → cliente → "+" de Origen | OK | Abre el modal con el cliente precargado (readonly) y 24 provincias. El título dice **"Registrar origen"**, no "Nuevo origen": el cambio es de un commit posterior y respeta el design system |
| 3 | gestion-viajes | Crear origen "PRUEBA-CLAUDE 18/10 B" | OK | `POST api/Origen` → 200 `{"ID":6}`. Queda elegido en el combo, vuelve el modal del viaje, 1 backdrop |
| 4 | gestion-viajes | Sin recargar: "+" de Destino → Cancelar | OK | Abre "Registrar destino" con la descripción vacía. Cancelar vuelve al viaje y el origen 6 se conserva |
| 5 | gestion-viajes | Sin recargar: "+" de Destino → crear "PRUEBA-CLAUDE 18/10 B" | OK | `POST api/Destino` → 200 `{"ID":7}`. Queda elegido, vuelve el modal del viaje. Se cerró el viaje con Cancelar **sin guardarlo**; quedan 0 modales y 0 backdrops |
| 6 | gestion-viajes | Editar viaje 26 (Listo para facturar) | OK | Los dos "+" quedan `disabled`, igual que los combos, con el aviso amarillo de Listo para facturar. Se cerró sin guardar |
| 7 | presupuestos | "Nuevo presupuesto" → cliente → "+" de origen → Cancelar | OK | Abre "Registrar origen" con el cliente precargado. Cancelar vuelve a "Nuevo presupuesto" con el cliente intacto. Se cerró el presupuesto sin guardar |
| 8 | Ambas | Consola sin "bootstrap is not defined" | OK | No hay ningún mensaje con "bootstrap". Solo aparecen los errores ya conocidos: F16 (PerfectScrollbar en `app.js`, 404 de `api/DashboardLayout`) y F12 (simple-datatables sin `#table1`) |

## Fallas
No hay fallas nuevas.

## Mejoras sugeridas
- **Altura vacía guardada como espacios:** en los registros nuevos `AlturaCalle` vuelve como `"          "` (10 espacios). La columna parece `char(10)`. Pasaba también en los registros del 17/10 (`"100       "`), así que no es de esta corrección. Convendría `NULL` o `varchar` + `Trim()` al leer. Baja.
- **Alta rápida fuera de la pantalla:** el origen/destino se crea en el momento, aunque después se cancele el viaje. Si el usuario abandona el alta, quedan ubicaciones sueltas. Es el comportamiento esperado de un alta rápida, pero conviene tenerlo presente.
- **Tooltip con el "+" deshabilitado:** en un viaje Listo para facturar el "+" deshabilitado conserva el tooltip "Registrar origen". Podría explicar por qué está bloqueado. Cosmético.
- **Botón y modal de presupuestos:** el botón y el modal dicen "Nuevo presupuesto", pero la regla del design system pide infinitivo ("Registrar presupuesto"). Es módulo de Facu: avisar antes de tocarlo.

## Datos de prueba creados o modificados
| Pantalla | ID | Qué se hizo |
|---|---|---|
| gestion-viajes → alta rápida de origen | ORIGEN 6 | "PRUEBA-CLAUDE 18/10 B", cliente 5 (PRUEBA-CLAUDE 17/10 S.A.), Córdoba / Córdoba |
| gestion-viajes → alta rápida de destino | DESTINO 7 | "PRUEBA-CLAUDE 18/10 B", cliente 5, Córdoba / Villa María |

No se guardó ningún viaje ni presupuesto, y no se modificó el viaje 26 (solo se abrió). El **Destino 6** "PRUEBA-CLAUDE 18/10" y el **Origen 5** son de la ronda anterior y los usa el viaje 31: no entran en esta limpieza.

## SQL de limpieza propuesto (NO ejecutado)
```sql
BEGIN TRAN;

-- Verificar que nadie los use (tiene que dar 0)
SELECT COUNT(*) AS ViajesQueLosUsan FROM VIAJES WHERE OrigenID = 6 OR DestinoID = 7;

DELETE FROM ORIGEN  WHERE Origen_ID  = 6 AND Descripcion = 'PRUEBA-CLAUDE 18/10 B';
SELECT @@ROWCOUNT AS OrigenesBorrados;   -- esperado: 1

DELETE FROM DESTINO WHERE Destino_ID = 7 AND Descripcion = 'PRUEBA-CLAUDE 18/10 B';
SELECT @@ROWCOUNT AS DestinosBorrados;   -- esperado: 1

-- COMMIT; o ROLLBACK;
```
