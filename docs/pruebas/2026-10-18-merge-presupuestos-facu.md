# Reporte de pruebas — Merge presupuestos de Facu (4a84bb2) + botones "+" de viajes — 2026-10-18

> Reporte generado por la sesión de pruebas de la VM. Se copió tal cual, salvo el SQL de
> limpieza, corregido en la Mac (ver la nota en esa sección). Seguimiento: §12 de
> `docs/PENDIENTES-SISTEMA.md`.

## Entorno
- Rama / commit: rocionuvoli @ 3bb4fd6 Docs: proforma Rukas se desarrolla en rocionuvoli, sin rama aparte (git status limpio al empezar y al terminar)
- API: http://localhost:50222/api (OK)
- Front: Live Server puerto **5500** (el 5502 no responde)
- Navegador: navegador integrado de Claude, ventana angosta (~690 px de ancho)
- Alcance pedido: ítem 12 de docs/PENDIENTES-SISTEMA.md — merge del módulo de presupuestos de Facu (4a84bb2) en rocionuvoli + corrección de los "+" de viajes (pruebas 1 a 6 del pedido)

## Resumen
22 pruebas: 17 OK, 1 FALLA, 2 parciales / no concluyentes, 2 sin datos para probarlas.
Lo más grave: **en gestion-viajes el "+" de alta rápida de origen/destino no abre** (`ReferenceError: bootstrap is not defined` en `alta-rapida-ubicacion.js`). En presupuestos.html el mismo "+" anda bien.
La corrección nueva (los "+" bloqueados en viajes que ya salieron) funciona. Las protecciones del viaje que sale de un presupuesto (no se puede editar ni eliminar) funcionan.
Al generar el viaje #31 con el chofer "Prueba, Fede" y WhatsApp **habilitado**, puede haber salido un WhatsApp real: falta que Fede confirme si le llegó.

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1a | gestion-facturacion | Traer viajes, cliente Rukas (QUICKFOOD, 01/07–31/10) | OK | Trajo solo #25 y #26 (con remito y transporte SAP). Advertencias: "sin número de remito o de transporte SAP: #24, #28" y "12 viaje(s) ya están incluidos en otra proforma". No había viajes sin tarifa ni en Registrado con números para ver esas dos advertencias. |
| 1b | gestion-facturacion | Traer viajes, cliente directo (distribuidora-powerful) | NO PROBADO (sin datos) | El único viaje del cliente (#5) ya está en otra proforma: "No hay viajes disponibles… #5". No se pudo ver la regla de "solo Entregados" ni las advertencias de no entregados / sin evidencia. Servicios Ambientales no tiene viajes. |
| 1c | gestion-facturacion | Cerrar con Cancelar sin guardar | OK | No se guardó ni se generó nada. |
| 2a | gestion-viajes | "Registrar viaje" sin cliente: "+" deshabilitados | OK | |
| 2b | gestion-viajes | Al elegir cliente se habilitan los "+"; campos Rukas | OK | Con Rukas se ven "N° transporte SAP" y "N° entrega Rukas". Con un cliente directo se ocultan y se borran (había escrito "TMP123" y quedó vacío al volver a Rukas). |
| 2c | gestion-viajes | "+" de Origen con cliente Rukas → crear origen | **FALLA** | No abre ningún modal. Consola: `ReferenceError: bootstrap is not defined`. Ver F1. No se creó ningún origen desde esta pantalla. |
| 2d | gestion-viajes | Editar viaje Registrado (#28): "+" habilitados | OK | Cerrado con Cancelar. |
| 2e | gestion-viajes | Editar viaje Listo para facturar (#26): campos y "+" bloqueados | OK | Cliente, origen, destino, fechas, camión, chofer y tarifa deshabilitados, km de solo lectura, "Recalcular" deshabilitado, **"+" de origen y destino deshabilitados** (siguen así 3 s después de cargar). Aviso: "El viaje está Listo para facturar: solo podés completar los números de remito, transporte SAP y entrega Rukas…". No había viajes En viaje ni Entregado para probar esos estados. |
| 3a | gestion-viajes | Alta de viaje Rukas sin chofer | OK | Viaje **#30**: QUICKFOOD, Sede Quilmes → Sede Banfield, 20/10 08–12 h, ABC123, 17,4 km (Google), tarifa por km #5 ($14.790). La tarifa fija dice "No hay tarifa fija cargada para esa ruta". **El modal no tiene campo Observaciones**, así que la marca "PRUEBA-CLAUDE 18/10" quedó en N° transporte SAP. |
| 3b | gestion-viajes | Editar #30 cambiando solo el remito | OK | Remito "PC1810-1", PUT 200, se ve en la grilla. |
| 3c | gestion-viajes | Eliminar #30 (con OK de Rocío) | OK | DELETE 200, desaparece de la grilla. |
| 4a | presupuestos | Abrir pantalla y lista | OK | Lista 3 presupuestos previos. La consola no muestra errores propios de la pantalla. |
| 4b | presupuestos | Nuevo presupuesto con cliente de prueba, guardar | OK | Presupuesto **#5**, cliente "PRUEBA-CLAUDE 17/10 S.A." (#5), 22/10 08–12 h, ABC123, sin chofer, 15 km a mano, tarifa por km #5 → $12.750. Observación "PRUEBA-CLAUDE 18/10". Aviso "Presupuesto #5 guardado correctamente." |
| 4c | presupuestos | "+" de origen y destino del modal | OK | Abre "Nuevo origen" / "Nuevo destino" con el cliente precargado. Se crearon el origen **#5** y el destino **#6** "PRUEBA-CLAUDE 18/10", que quedan elegidos en el combo. |
| 4d | presupuestos | Vista previa / PDF | OK | La vista previa se ve bien: logo, datos del cliente, línea, total $12.750, datos del servicio y observaciones. No se tocó "Imprimir" (abre el diálogo de impresión) ni "Descargar PDF". No se envió mail. |
| 4e | presupuestos | Cambiar a Aceptado → se habilita "Generar viaje" | OK | "Estado actualizado a Aceptado.", "Editar" queda deshabilitado ("Solo se editan presupuestos pendientes sin viaje"). |
| 4f | presupuestos | Generar viaje (con OK de Rocío, chofer "Prueba, Fede" #9) | OK | Viaje **#31**. Aviso "Viaje #31 generado correctamente." y además un modal "Viaje generado" con botón "ACEPTAR". **WhatsApp está habilitado: confirmar con Fede si llegó el mensaje.** |
| 4g | gestion-viajes | Editar #31 cambiando km (Recalcular 15 → 16,1) | OK | PUT 409: "El cliente, la ruta, la distancia y la tarifa provienen de un presupuesto aceptado y no se pueden modificar en el viaje." |
| 4h | gestion-viajes | Editar #31 cambiando origen (→ Los Carolinos) | OK | PUT 409, mismo mensaje. |
| 4i | gestion-viajes | Editar #31 cambiando solo el remito | OK | Remito "PC1810-2", PUT 200. Al abrir conserva los 15 km del presupuesto ("la ruta de Google marca 16.1 km"). Después también se le cargó el N° transporte SAP para la prueba 4k. |
| 4j | gestion-viajes | Eliminar #31 (con OK de Rocío) | OK | DELETE 409 `{"error":"No se puede eliminar un viaje generado desde un presupuesto aceptado."}`. El viaje sigue en la grilla. El mensaje sale con `alert()` nativo. |
| 4k | gestion-facturacion | Traer viajes del cliente PRUEBA-CLAUDE 17/10 (01/10–31/10) | PARCIAL / NO CONCLUYENTE | Trae V31 con $12.750 (el importe del presupuesto) y avisa "#31 sigue en estado Registrado" y "#29 sin número". **Pero la tarifa da lo mismo** (850 × 15 km = 12.750), así que esta prueba no distingue entre importe del presupuesto e importe de la tarifa. Ver mejoras. Cerrado con Cancelar. |
| 5 | configuracion-whatsapp | Abre con logo y colores, carga datos | OK | Logo y color de fondo de Gestión de contenido. Carga Habilitado = sí y el resto de los campos. No se guardó nada. La consola solo muestra el error general de PerfectScrollbar (F3). |
| 6a | gestion-contenido | Abre sin errores, logo y colores | OK | Solo el error de PerfectScrollbar (F3). |
| 6b | configuracion-email | Abre, perfil nuevo para presupuestos | OK | Muestra "Perfil para Facturación" (Servicio 1) y "Perfil para Presupuestos" (Servicio 2 · Presupuestos), los dos asignados. Solo el error de PerfectScrollbar. |
| 6c | configuracion-facturacion | Abre sin errores, logo y colores | OK | Sin errores nuevos en consola. |
| 6d | menú lateral | "Presupuestos" dentro de Viajes | OK | Viajes → Listar viajes, Gestionar viajes, Gestionar orígenes y destinos, Gestionar tarifas, Presupuestos. |

## Fallas (una sección por falla, la más grave primero)

### F1 — El "+" de alta rápida de origen/destino no abre en gestion-viajes
- Gravedad: Media. La alta rápida no anda en Viajes; se puede usar Gestionar orígenes y destinos o el "+" de Presupuestos.
- Dónde: gestion-viajes → Registrar viaje / Editar → botones "+" junto a Origen y Destino (`#agregarOrigenViaje`, `#agregarDestinoViaje`).
- Pasos para reproducir: 1. Abrir gestion-viajes (Ctrl+F5). 2. "Registrar viaje". 3. Elegir un cliente (los "+" se habilitan). 4. Tocar el "+" de Origen.
- Esperado: se abre el modal "Nuevo origen" con el cliente precargado.
- Obtenido: no pasa nada en pantalla.
- Consola / red: `Uncaught ReferenceError: bootstrap is not defined at crear (assets/static/js/alta-rapida-ubicacion.js:9:42) at Object.abrir (alta-rapida-ubicacion.js:40:9) at HTMLButtonElement.<anonymous> (gestion-viajes.html:1488)`. No hay llamadas a la API. En gestion-viajes `typeof window.bootstrap` da `"undefined"`, aunque `jQuery.fn.modal` existe (Bootstrap 5.3.2). En presupuestos.html `window.bootstrap` sí existe, y ahí el mismo "+" funciona (4c).
- Causa probable: `alta-rapida-ubicacion.js` (viene de 4a84bb2) usa `bootstrap.Modal.getOrCreateInstance(...)` directo en las líneas 9, 11 y 43, sin el respaldo de jQuery. `app.js` no define `window.bootstrap` en esta página: `sgtl-ui.js:5` ya lo comenta y por eso usa jQuery cuando no existe. `facturacion-proforma.js:102` y `anulacion-factura-proforma.js:95` también lo verifican antes de usarlo. Además, en el primer intento el modal se crea en el DOM pero `modal` queda `undefined`. En el segundo intento `crear()` vuelve sin hacer nada, `contexto` queda asignado y la línea 43 vuelve a fallar. Desde ahí `abrir()` sale sin hacer nada (`if (... || contexto) return;`) hasta recargar la página. Sin corregir.

### F2 — Error de simple-datatables en gestion-viajes
- Gravedad: Baja (no se ve nada roto).
- Dónde: gestion-viajes, al cargar.
- Consola: `Uncaught TypeError: Cannot read properties of null (reading 'innerHTML') at new exports.DataTable (simple-datatables.js:8) at assets/static/js/pages/simple-datatables.js:1:17`.
- Causa probable: `gestion-viajes.html:392-393` incluye `pages/simple-datatables.js`, que busca una tabla que esta página no tiene. Probablemente es anterior al merge. Sin corregir.

### F3 — Error de PerfectScrollbar en casi todas las pantallas
- Gravedad: Baja (anterior al merge; no se ve nada roto).
- Dónde: gestion-facturacion, gestion-viajes, presupuestos, configuracion-whatsapp, gestion-contenido, configuracion-email (en configuracion-facturacion no aparece).
- Consola: `Uncaught Error: no element is specified to initialize PerfectScrollbar at Mr.init (assets/compiled/js/app.js:9:83217)`.
- Aparte: en el dashboard (index, después del login) `GET /api/DashboardLayout?username=RNUVOLI` devuelve 404.

## Mejoras sugeridas
- **Presupuestos / proforma (4k):** para validar de verdad que la proforma usa el importe del presupuesto hace falta un viaje generado cuyo importe sea **distinto** del de la tarifa vigente. Por ejemplo, el viaje #28 (presupuesto #1: $1.300.000 por 520 km, que no coincide con 850 × 520) si tuviera remito y transporte SAP. Ese viaje no lo creó esta sesión y no se tocó.
- **Viaje generado desde presupuesto:** al editarlo, cliente, origen, destino, km y tarifa están habilitados y recién al guardar sale el 409. Convendría deshabilitarlos con un aviso, como ya se hace con los viajes bloqueados (2e).
- **gestion-viajes, design system:** el botón para guardar el viaje dice "Confirmar" (debería decir "Guardar"). El modal de eliminar se titula "Confirmar eliminación", con el texto "¿Está seguro que desea eliminar este viaje?" (sin voseo). Los resultados de eliminar salen con `alert()` nativo (`gestion-viajes.html:1321-1322`) en vez de `SGTL` toast.
- **gestion-viajes, ancho chico:** en el pie del modal de viaje los botones Cancelar / Confirmar quedan como rectángulos vacíos. El texto tiene `d-none d-sm-block` y el ícono `bx` no se ve.
- **gestion-viajes:** el modal de viaje no tiene Observaciones, así que no hay dónde marcar un registro de prueba ni dejar notas del viaje.
- **Presupuestos (Facu, avisar antes de aplicar):** al generar un viaje aparecen a la vez un toast y un modal "Viaje generado" con botón "ACEPTAR" en mayúsculas (uno de los dos sobra). El botón "+" se llama "Agregar origen" y el modal "Nuevo origen" (la regla pide el mismo texto en infinitivo). En el PDF el prestador sale solo como "Transporte Sánchez", sin CUIT ni dirección.
- **Proformas (Facu):** "Se agregaron 1 viaje(s)" (podría ser "Se agregó 1 viaje"). Cancelar cierra el modal y descarta las líneas traídas sin preguntar.
- **configuracion-whatsapp:** el Access Token de Meta se muestra entero en texto plano en el formulario. Convendría enmascararlo, como el secreto SMTP.
- **gestion-contenido:** el título de la pestaña dice "Sistema de gestión de viajes".
- **Scripts:** `database/presupuestos.sql` y `database/estados_presupuestos.sql` (del merge) no siguen la convención `database/<módulo>/NN_descripcion.sql`.
- **Datos de prueba de otra ronda:** existen datos de una ronda anterior "PRUEBA-CLAUDE 17/10": cliente #5, viajes #25, #26 y #29, y probablemente #28 y los presupuestos #1 y #4. No se tocaron ni se incluyen en la limpieza.

## Datos de prueba creados o modificados
| Pantalla | ID | Qué se hizo |
|---|---|---|
| gestion-viajes | VIAJES #30 | Creado (QUICKFOOD, Quilmes → Banfield, 20/10, sin chofer, transporte SAP "PRUEBA-CLAUDE 18/10"), remito cambiado a "PC1810-1" y **eliminado** con OK de Rocío. No queda en la base (salvo la auditoría). |
| presupuestos (alta rápida) | ORIGEN #5 | Creado: "PRUEBA-CLAUDE 18/10", cliente #5, Buenos Aires / Quilmes, Rivadavia 100. |
| presupuestos (alta rápida) | DESTINO #6 | Creado: "PRUEBA-CLAUDE 18/10", cliente #5, Buenos Aires / Banfield, Maipú 200. |
| presupuestos | PRESUPUESTOS #5 | Creado (cliente #5, 15 km, $12.750, observación "PRUEBA-CLAUDE 18/10"), pasado a **Aceptado**, ViajeID = 31. |
| presupuestos → gestion-viajes | VIAJES #31 | Generado desde el presupuesto #5 con chofer #9 "Prueba, Fede" (puede haber mandado WhatsApp). Después: remito "PC1810-2" y transporte SAP "PRUEBA-CLAUDE 18/10". Estado Registrado, sin proforma. |

## SQL de limpieza propuesto (NO ejecutado)

> **Corregido en la Mac (18/10):** en la versión de la VM, el control de `PROFORMAS_VIAJES` usaba
> `Viaje_ID`, pero esa tabla llama a la columna `ViajeID` (la consulta habría fallado). Se agregó
> también el control de líneas `V31` en `PROFORMA_DETALLE`. Las claves foráneas que apuntan a
> `VIAJES` son `PRESUPUESTOS`, `PROFORMAS_VIAJES` y `VIAJE_EVIDENCIA`; `VIAJES` apunta a
> `ORIGEN` y `DESTINO`, por eso se borra primero el presupuesto, después el viaje y al final el
> origen y el destino.

```sql
-- Revisar antes: que los IDs sigan siendo los de esta prueba.
SELECT Presupuesto_ID, Estado, ViajeID FROM dbo.PRESUPUESTOS WHERE Presupuesto_ID = 5;
SELECT Viaje_ID, ClienteID, OrigenID, DestinoID, Num_Remito FROM dbo.VIAJES WHERE Viaje_ID = 31;
SELECT * FROM dbo.PROFORMAS_VIAJES WHERE ViajeID = 31;                         -- tiene que dar 0 filas
SELECT * FROM dbo.PROFORMA_DETALLE WHERE LTRIM(RTRIM(Codigo)) = 'V31';         -- tiene que dar 0 filas
SELECT Origen_ID, Descripcion FROM dbo.ORIGEN WHERE Origen_ID = 5;
SELECT Destino_ID, Descripcion FROM dbo.DESTINO WHERE Destino_ID = 6;

BEGIN TRAN;

-- 1) Presupuesto de prueba (primero, porque tiene FK a VIAJES)
DELETE FROM dbo.PRESUPUESTOS WHERE Presupuesto_ID = 5 AND ViajeID = 31;
SELECT @@ROWCOUNT AS presupuestos_borrados;   -- esperado 1

-- 2) Evidencia del viaje generado (si hubiera)
DELETE FROM dbo.VIAJE_EVIDENCIA WHERE Viaje_ID = 31;
SELECT @@ROWCOUNT AS evidencias_borradas;     -- esperado 0

-- 3) Viaje generado desde el presupuesto
DELETE FROM dbo.VIAJES WHERE Viaje_ID = 31 AND ClienteID = 5;
SELECT @@ROWCOUNT AS viajes_borrados;         -- esperado 1

-- 4) Origen y destino creados con el "+"
DELETE FROM dbo.ORIGEN  WHERE Origen_ID = 5  AND Descripcion = 'PRUEBA-CLAUDE 18/10';
SELECT @@ROWCOUNT AS origenes_borrados;       -- esperado 1
DELETE FROM dbo.DESTINO WHERE Destino_ID = 6 AND Descripcion = 'PRUEBA-CLAUDE 18/10';
SELECT @@ROWCOUNT AS destinos_borrados;       -- esperado 1

-- COMMIT; o ROLLBACK;
```
(El viaje #30 ya se eliminó desde la pantalla. Los registros de auditoría de estas operaciones quedan como están.)
