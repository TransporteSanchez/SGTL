# Reporte de pruebas — Ronda 2, parte Q (adicionales del viaje directo, §60) — 28/10/2026

> Reporte de la sesión de la VM, con `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md` (ronda 2, parte Q). Seguimiento en la
> §60 de `docs/PENDIENTES-SISTEMA.md`.

## Entorno
- Rama / commit: rocionuvoli @ 11cf7e2 "Pendientes: main pasa con la parte Q y la reprueba corta" (`git pull` al día, `git status` limpio).
- API: http://localhost:50222/api — OK. DLL compilada a las 23:24 del 28/10, después del último cambio de C# (`dc3e581`, 22:56; después solo cambiaron documentos). No hizo falta recompilar.
- Front: Five Server, puerto 5502, abierto como `http://localhost:5502` en el navegador integrado. Login de admin (RNUVOLI) hecho por Rocío.
- Google: respondió (km y tiempo: "41,4 km · 34 min").
- Alcance pedido: la parte Q de la ronda 2 de `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md` (§60, pasos 2 a 9, más los extras y el cruce). La reprueba corta de la ronda 1 **no se rehizo**: ya estaba hecha a las 19:00 sobre `78d2ef5` (`2026-10-28-reprueba-ronda-1.md`, 15 OK y 1 NO PROBADO), y Rocío lo consulta con la Mac. Desde ese commit, el C# cambió solo en viajes y tarifas (`ViajesController`, `TarifarioController`, `OrdenDelDia`, `TarifarioCalculo`, `TarifarioImpacto`, `TarifarioRevisar`); no se tocaron los archivos de los arreglos de la §59.

## Resumen
Fueron 30 controles: 28 OK, 1 FALLA y 1 NO PROBADO en parte (el margen del control interno, porque falta el consumo de los camiones). **Los adicionales funcionan de punta a punta.** La carga anda bien, la cuenta da exacta ($ 476.273,00 + 3 módulos $ 289.731,00 + vuelta vacía 23 % $ 109.542,79 = $ 875.546,79) y el guardado también. Al volver a abrir el viaje y en Ver detalle (Gestionar y Listar) se ve todo bien. Los tres errores aparecen en la pantalla y también en la API, y la API calcula con la lista, no con lo que manda la pantalla. Un viaje con plataforma no muestra el bloque ni cambia al guardarlo. La vuelta vacía sale al pasar a Sin carga y vuelve la tarifa completa más la espera al volver a En viaje. Traer viajes trae el importe con los adicionales.

- **Falla (Media):** Auditoría no registra los adicionales ni el cambio de importe al editar un viaje (sí registra "Vuelta vacía quitada" al pasar a Sin carga).
- **Textos para mejorar (Baja):** el aviso de Sin carga dice "(60 % de la tarifa)" junto a un importe que incluye la espera. Además, falta un espacio en "$ 478.917,80sin IVA" en Completar el viaje.

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | §60 paso 2 | API compilada con lo último y Ctrl+F5 | OK | DLL 23:24 > último C# 22:56. |
| 2 | Registrar viaje [preparación] | Viaje directo nuevo para la prueba | OK | #54, Alimentos La Serena S.A., Planta Córdoba Norte → Depósito Villa Carlos Paz, 28/10 06:00 a 09:00, SNK178, Darío Quiroga (chofer 12). "Tarifas Alimentos La Serena · Chasis (2 ejes) 2018 o anterior, fija hasta 130 km, 1ª vuelta": $ 476.273,00. WhatsApp: "No se pudo enviar el WhatsApp al chofer. Avisale por otro medio." (sin el token del día; se anota una vez, no es falla). |
| 3 | §60 paso 3 | Bloque "Adicionales", "Agregar adicional" y la ayuda | OK | "Módulo de 6 hs: $ 96.577,00. La espera corre después de 12 hs de iniciado el servicio (18 hs si son más de 250 km). La vuelta vacía es un porcentaje del flete." En Registrar, antes de elegir el recorrido, la ayuda dice solo "La vuelta vacía es un porcentaje del flete.". |
| 4 | §60 paso 3 | Espera 6 a 12 hs con comentario + descarga + vuelta vacía 23 % | OK | "… 1ª vuelta: $ 476.273,00 · adicionales (3 módulos): $ 289.731,00 · vuelta vacía (23 %): $ 109.542,79" = **$ 875.546,79** (23 % de 476.273 = 109.542,79). La cantidad se oculta y aparece el porcentaje al elegir vuelta vacía (arranca en 10 %). |
| 5 | §60 paso 3 + extra | Guardar con doble clic | OK | **Un solo `PUT api/Viajes/54`**. "Viaje guardado.". |
| 6 | §60 paso 4 | Volver a abrirlo | OK | Las tres filas como se cargaron, con el comentario y el 23 %. |
| 7 | §60 paso 4 [cruce] | Ver detalle en Gestionar viajes y en Listar viajes | OK | Iguales: "Adicionales: Espera entre 6 y 12 hs · Esperó en planta por turno de descarga / Adicional por descarga / Vuelta vacía (23 % del flete)" y el mismo importe. Pie solo "Cerrar". |
| 8 | §60 paso 5 | Fila sin elegir, cantidad 0 y dos vueltas vacías | OK | Debajo de cada uno: "Adicional sin elegir: elegí uno o quitá la fila.", "Cantidad de 1 a 99.", "Vuelta vacía repetida: va una sola por viaje."; arriba, "Revisá los campos marcados." en rojo (`#b42318`). No sale el PUT. |
| 9 | §60 paso 5 (extra) | Letras en la cantidad ("x5") | OK | El campo las acepta, pero al guardar marca "Cantidad de 1 a 99." y no guarda. |
| 10 | §60 paso 5 (API) | Lista mal armada desde la consola (`PUT api/Viajes/54`) | OK | Todos 400 y no guarda: cantidad 0 → "Cantidad no permitida: tiene que ser de 1 a 99."; código inexistente → "Adicional desconocido: elegí uno de la lista."; dos vueltas vacías → "Vuelta vacía repetida: va una sola por viaje."; 15 % → "Porcentaje de la vuelta vacía no permitido: elegí uno de la lista."; comentario de 250 → "Comentario largo: hasta 200 caracteres."; JSON roto → "Adicionales sin leer: volvé a cargarlos.". Ver Mejoras: el de la cantidad no es igual al de la pantalla. |
| 11 | §60 (API) | La API calcula con la lista, no con lo que manda la pantalla | OK | Se mandó `Estadia_Modulos: 50` y `Vuelta_Vacia_Porcentaje: 70` con una lista de espera 6 a 12 hs + vuelta vacía 23 %: guardó 2 módulos y 23 % ($ 778.969,79). |
| 12 | §60 paso 6 | Quitar todos y guardar | OK | $ 476.273,00, sin adicionales (`Adicionales` vacío, `Estadia_Modulos` 0). "Viaje guardado.". |
| 13 | §60 paso 7 | Viaje con plataforma (#24, QUICKFOOD, Registrado): sin bloque | OK | `grupoEstadia` oculto. |
| 14 | §60 paso 7 | Guardar el #24 sin cambios: el importe no cambia | OK | Con el OK de Rocío. Antes y después, iguales todos los campos (importe $ 429.101,00). El PUT manda `Adicionales: null`. |
| 15 | §60 paso 7 | Viaje directo de antes con módulos de estadía (#50, solo abrir) | OK | En Editar: "Estadía (módulos de 6 hs) · 1 módulo", cantidad 1; se canceló sin guardar. Ver Mejoras: Ver detalle de ese viaje no muestra la lista. |
| 16 | §60 paso 8 [cruce] | En viaje → Cambiar estado → Sin carga: la tarjeta | OK | "Llegó al origen y no había carga. Se cobra el 60 % de la tarifa: $ 285.763,80. Se quita la vuelta vacía: no llegó al destino." Sin la vuelta vacía, la tarjeta no la menciona. Ver Mejoras: no dice que se suma la espera. |
| 17 | §60 paso 8 | Al guardar: el porcentaje sin carga más la espera | OK | $ 285.763,80 + $ 193.154,00 = **$ 478.917,80**. Aviso: "Viaje #54 sin carga. Se cobra $ 478.917,80 (60 % de la tarifa). Se quitó la vuelta vacía: no llegó al destino." (ver Mejoras). |
| 18 | §60 paso 8 | Ver detalle ya no lista la vuelta vacía | OK | Queda solo la espera con su comentario; la entrega dice "Sin carga", la fecha y la observación. |
| 19 | §60 paso 8 | Auditoría: "Vuelta vacía quitada" | OK | "Estado=En_viaje -> Sin_carga; Observación=…; Vuelta vacía quitada (23 %); Importe=478917.80". |
| 20 | §60 paso 8 | Agregar una vuelta vacía al viaje sin carga | OK | En pantalla, "Vuelta vacía de más: el viaje está sin carga." y no sale el PUT. La API también la rechaza (400, mismo texto). |
| 21 | §60 paso 8 | Volver a En viaje: la espera sigue y se cobra la tarifa completa | OK | "Había carga: vuelve a en viaje y se cobra la tarifa completa." → "Viaje #54 vuelve a en viaje. Se cobra $ 669.427,00." (476.273 + 193.154). La vuelta vacía no vuelve sola. |
| 22 | §60 paso 8 [cruce] | Registrar proforma → Traer viajes: el importe con los adicionales | OK | Con el OK de Rocío, el #54 se volvió a pasar a Sin carga (en En viaje no se trae). Línea "V54 · Viaje Planta Córdoba Norte -> Depósito Villa Carlos Paz · 28/10/2026 - Sin carga · $ 478.917,80". Se canceló con "Descartar cambios": ningún POST ni PUT. |
| 23 | §60 paso 9 | Design system del bloque a 1366 px | OK | "Agregar adicional" con texto e ícono; Quitar solo ícono (`bi-trash`, `aria-hidden`) con tooltip "Quitar adicional" y `aria-label`, también en las filas agregadas después; sin scroll horizontal. |
| 24 | §60 paso 9 | Design system del bloque a 390 px | OK | Cada fila ocupa el ancho (350 px), la lista arriba y cantidad, comentario y quitar abajo; sin scroll horizontal. |
| 25 | Extra | Cancelar el modal después de agregar un adicional | OK | Se agregó "Repaletizado" (el total pasó a $ 1.068.700,79) y se canceló: el viaje siguió con 3 adicionales y $ 875.546,79. Ver Mejoras: no avisa "Tenés cambios sin guardar". |
| 26 | Extra | Comentario de más de 200 caracteres | OK | Se escribieron 229: el campo se queda en 200 (`maxlength`). |
| 27 | Extra | Textos de la lista y de la ayuda | OK | Voseo ("Elegí un adicional", "elegí uno o quitá la fila"), sin inglés y con mayúscula solo al principio. |
| 28 | [cruce] | Margen estimado del control interno con el importe nuevo | NO PROBADO (en parte) | El control interno toma el importe nuevo (`api/Costos/Viajes/54` → `Importe: 875546.79`, después 478917.8), pero el margen no se calcula: "Falta el consumo del camión SNK178 (Gestionar camiones)." y "Falta el combustible estimado.". Ningún camión tiene consumo ni hay precio del gasoil: se carga en la ronda 4 (§37, paso 3). |
| 29 | Consola | Errores al usar las pantallas | OK | Solo los 400 de las llamadas de prueba hechas a mano desde la consola. |
| 30 | Auditoría | Agregar o quitar adicionales queda registrado | FALLA | F1: la modificación no muestra los adicionales ni el importe. |

## Fallas

### F1 — Auditoría no registra los adicionales ni el cambio de importe al editar un viaje
- Gravedad: Media (no se pierde nada, pero no queda rastro de quién cargó un adicional ni de cuánto cambió el importe; en la demo se puede mostrar la Auditoría del cambio de estado, que sí lo dice).
- Dónde: Gestionar viajes → Editar → Guardar; Auditoría → Ver detalle del movimiento.
- Pasos para reproducir:
  1. Editar el #54 y agregar espera 6 a 12 hs, descarga y vuelta vacía 23 %. Guardar ("Viaje guardado.").
  2. Auditoría → Modificación VIAJES Viaje_ID=54 → Ver detalle.
- Esperado: que figuren los adicionales (o al menos el importe de antes y el de después).
- Obtenido: solo `Distancia_KM "41.4                " → "41.4"`, `Num_Remito`, `Num_de_Carga` (espacios recortados, que no son cambios reales) y `Fecha_Modi`. Lo mismo al quitarlos todos ($ 875.546,79 → $ 476.273,00) y al guardar el #24 sin cambios. El alta dice `"Viaje_ID": "0"`.
- Consola / red: sin errores.
- Causa probable: `ViajesController.cs:503-512` (`GuardarImporte`) guarda `Importe`, `Importe_Detalle`, `Adicionales`, `Estadia_Modulos` y `Vuelta_Vacia_Porcentaje` con `ExecuteSqlCommand`, fuera del EDMX, así que `Sgtlauditcontext` no lo ve. El cambio a Sin carga sí lo registra porque arma el texto a mano (`ViajesController.cs:1110`). Las diferencias de espacios salen de las columnas `char` de `Distancia_KM`, `Num_Remito` y `Num_de_Carga`. Esto viene desde que el importe se guarda con SQL directo (§39), no lo trajo la §60. Sin corregir.

## Design system
- **Gestionar proformas → Registrar proforma (Facu, fuera del alcance de la parte Q):** en la línea que trae Traer viajes, "P. Unit." y "Desc.%" son `type="number"` y muestran `478917.8`. El punto 11 de la lista de control pide `type="text" inputmode="decimal"` con `SGTL.enlazarMascaraMonto`, y que se vea "$ 478.917,80".
- **Completar el viaje (#54 Sin carga), el importe fijo:** "$ 478.917,80sin IVA", sin espacio entre el monto y "sin IVA" (`#fijoTarifa`). En Editar (con `#tarifaInfo`) se ve bien.

## Mejoras sugeridas
- **Aviso de Sin carga con espera** (Gestionar viajes → Cambiar estado → Sin carga):
  - El aviso dice "Viaje #54 sin carga. Se cobra $ 478.917,80 (60 % de la tarifa).". $ 478.917,80 no es el 60 % de la tarifa: es el 60 % más la espera. Propuesta: "Viaje #54 sin carga. Se cobra $ 478.917,80: el 60 % de la tarifa más los adicionales.".
  - La tarjeta, antes de guardar, dice "Se cobra el 60 % de la tarifa: $ 285.763,80." y no menciona la espera. Propuesta: "Se cobra el 60 % de la tarifa ($ 285.763,80) más los adicionales ($ 193.154,00): $ 478.917,80.".
- **"Listo para facturar: se completan el remito y los adicionales."** aparece arriba de "Completar el viaje #54" estando **Sin carga**. Para la persona administrativa es confuso, porque el viaje no está en Listo para facturar. Propuesta: "Sin carga: se completan el remito y los adicionales.", o el estado que tenga.
- **Vuelta vacía en un viaje sin carga:** la lista la sigue ofreciendo y el error recién aparece al guardar. Propuesta: deshabilitarla en la lista con el motivo ("Vuelta vacía: el viaje está sin carga").
- **Mismo texto en la API y en la pantalla:** la cantidad dice "Cantidad de 1 a 99." en pantalla y "Cantidad no permitida: tiene que ser de 1 a 99." en la API. La §60 pide que sean iguales.
- **Ver detalle de un viaje viejo con estadía (#50):** en Editar aparece la fila "Estadía (módulos de 6 hs) · 1 módulo", pero Ver detalle no muestra la sección "Adicionales". La estadía está solo dentro del texto del importe ("estadía (1 módulo): $ 96.577,00"). Propuesta: listar "Estadía (módulos de 6 hs) · 1" también en el detalle.
- **"Estadía (módulos de 6 hs)" se ofrece en viajes nuevos.** La §60 dice que es para los viajes de antes. Propuesta: mostrarla solo si el viaje ya la tenía.
- **Cantidad en Ver detalle:** "Adicional por descarga" no muestra la cantidad. Con 1 no hace falta, pero con 2 o más conviene "Adicional por descarga × 2" (no se probó con más de 1).
- **Cancelar Editar viaje con cambios** cierra sin preguntar (Registrar proforma sí dice "Tenés cambios sin guardar. Si cerrás, se pierden."). No se guarda nada, así que está bien, pero los adicionales cargados se pierden sin aviso.
- **Escape en el calendario de "Cambiar estado"** cierra el modal entero, no solo el calendario, y se pierde lo cargado. No se guarda nada. Al volver a abrirlo, la fecha anterior seguía escrita.
- **Cantidad:** el campo acepta letras ("x5"), aunque las rechaza al guardar. Se podría filtrar al escribir, como la máscara de montos.
- **Comentario de 200 caracteres:** corta en silencio. Un contador ("200/200") o la ayuda "Hasta 200 caracteres" evitaría la sorpresa.

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre que se le puso | Qué se hizo |
|---|---|---|---|---|
| Gestionar viajes | VIAJES | 54 | Alimentos La Serena S.A. · Planta Córdoba Norte → Depósito Villa Carlos Paz · 28/10/2026 06:00–09:00 · SNK178 · Darío Quiroga | Creado a las 23:44 (RNUVOLI). Adicionales agregados, quitados y vueltos a cargar. Estados: Registrado → En viaje → Sin carga → En viaje → **Sin carga**. **Queda Sin carga** con la espera 6 a 12 hs, $ 478.917,80 y la observación "En planta avisaron que la carga se reprogramó para otro día.". |
| Gestionar viajes | VIAJES | 24 | QUICKFOOD S.A. (viaje existente) | Guardado sin cambios, con el OK de Rocío: solo cambiaron `Fecha_Modi` (28/10 23:48) y `Usu_Modi`. |
| Gestionar viajes | VIAJES | 50 | (viaje existente) | Solo se abrió Editar y Ver detalle; se canceló. |
| Registrar proforma | — | — | — | Se abrió dos veces y se descartó: no se creó nada. |
| Configuración de facturación | — | — | — | No se tocó. |

El #54 aparece en Gestionar viajes, en la tarjeta de Sin carga y en Traer viajes de Alimentos La Serena (octubre). **Si no tiene que verse en la demo del 29/10, conviene borrarlo antes** con el SQL de abajo.

## SQL de limpieza propuesto (NO ejecutado)
```sql
BEGIN TRAN;
-- El viaje de prueba de la parte Q: sin gastos, sin presupuesto, sin proforma.
SELECT Viaje_ID, ClienteID, Estado, Importe, Usu_Alta, Fecha_Alta
FROM dbo.VIAJES
WHERE Viaje_ID = 54 AND ClienteID = 7 AND Usu_Alta = 'RNUVOLI'
  AND Fecha_Alta >= '2026-10-28T23:40:00' AND OrigenID = 9 AND DestinoID = 9;

-- Tiene que dar 0 en las tres antes de borrar.
SELECT COUNT(*) AS Gastos FROM dbo.VIAJE_GASTOS WHERE Viaje_ID = 54;
SELECT COUNT(*) AS Presupuestos FROM dbo.PRESUPUESTOS WHERE ViajeID = 54;
SELECT COUNT(*) AS EnProforma FROM dbo.PROFORMAS_VIAJES WHERE ViajeID = 54;

DELETE FROM dbo.VIAJES
WHERE Viaje_ID = 54 AND ClienteID = 7 AND Usu_Alta = 'RNUVOLI'
  AND Fecha_Alta >= '2026-10-28T23:40:00' AND OrigenID = 9 AND DestinoID = 9;
SELECT @@ROWCOUNT; -- tiene que ser 1
-- COMMIT; o ROLLBACK;
```
El #24 no necesita limpieza.
