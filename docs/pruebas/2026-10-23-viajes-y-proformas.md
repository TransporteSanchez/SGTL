# Reporte de pruebas — Viajes y proformas (§24 y §25) — 23/10/2026

## Entorno
- Rama / commit: rocionuvoli @ 6ba727a Proformas: "Sin viaje relacionado en SGTL" en el control de Rukas (git status limpio)
- API: http://localhost:50222/api (OK)
- Front: Live Server puerto **5500** (no 5502)
- Navegador integrado, recarga sin caché al empezar. Las medidas de 1366 y 1100 px se tomaron emulando el ancho de la ventana; la pantalla del panel mide 683 px.
- Alcance pedido: lo nuevo de §24 y §25 de `docs/PENDIENTES-SISTEMA.md` (partes 1 a 4 del pedido de Rocío; la 5 solo con OK).

## Resumen
42 pruebas: 35 OK, 6 fallas, 1 no probada (usuario sin permiso, ítem 22). Con OK de Rocío se generó el borrador 990100 (PF-00000011) y tomó los datos de la ficha de QUICKFOOD. No hay fallas graves; las más visibles:
- F1: el paso actual de Registrar proforma casi no se ve (por el color guardado en Gestión de contenido).
- F2: en el control de Rukas, "Sin viaje relacionado en SGTL" se parte en dos renglones a 1366 y a 1100 la tabla se desplaza 16 px al costado.
- F3: el chofer dice "(opcional)" pero queda marcado con error.

Precondición de la parte 4: los viajes 25 y 26 estaban en el borrador #39 (Rukas 990120, de FGODOY). Rocío los sacó y se siguió.

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | gestion-viajes · Registrar viaje | Cliente con flechas, Enter y escribiendo | OK | La primera flecha marca "Seleccioná un cliente" (la opción vacía); Enter ahí no elige nada. Ver mejoras. |
| 1 | gestion-viajes · Registrar viaje | Etiqueta "Rukas" adentro del campo y en la lista, sin "(Rukas)" en el nombre | OK | |
| 1 | gestion-viajes · Registrar viaje | Sin cliente, origen y destino dicen "Elegí el cliente" | OK | |
| 1 | gestion-viajes · Registrar viaje | Chofer: escribir parte del DNI filtra; aviso de WhatsApp debajo con el nombre | OK | "2062" → Pai, Gabriel Gustavo. Ícono del aviso a la altura del primer renglón. |
| 1 | gestion-viajes · Registrar viaje | Camión: solo activos | OK (parcial) | Los 4 camiones de la base están activos: no hay uno inactivo con qué comprobar que se excluye. |
| 1 | gestion-viajes · Registrar viaje | Tarifa: arranca en Por km con el importe | OK | "$ 13.685,00 neto · $ 850,00 por km × 16,1 km" (Planta 1 → Depósito 1). |
| 1 | gestion-viajes · Registrar viaje | "Fija" sin tarifa fija → aviso amarillo | OK | Aviso con enlace a Gestionar tarifas. |
| 1 | gestion-viajes · Registrar viaje | Guardar vacío → error por campo y "Revisá los campos marcados." | OK | Errores en cliente, inicio, fin, camión y chofer. Ver F3. |
| 1 | gestion-viajes · Registrar viaje | Clic afuera no cierra | OK | `data-bs-backdrop="static"`. Salí con Cancelar. |
| 2 | gestion-viajes · Editar | Viaje En viaje (#33): lo fijo en recuadros grises, solo el remito editable | OK | Aviso "Ya salió: solo se completa el número de remito…". |
| 2 | gestion-viajes · Editar | Rukas en Listo para facturar (#25): tarifa y km editables, sin "+" | OK | Los "+" de origen y destino están ocultos. Línea gris "Esta ruta tiene tarifa fija de $ 200.000,00." |
| 2 | gestion-viajes · Editar | De presupuesto (#28): aviso con el número | OK | "El cliente, el recorrido, los km y la tarifa son los del presupuesto #1." El importe va en el bloque Tarifa, no en el aviso. |
| 3 | gestion-viajes · Columna Estado | Ícono gris y globito de una línea (borrador, proforma emitida, presupuesto) | OK | "En el borrador de proforma #N.", "En la proforma PF-00000006, aceptada.", "Generado desde el presupuesto #N." |
| 3 | gestion-viajes · Columna Estado | Etiquetas centradas y alineadas | OK | Medido: la etiqueta queda centrada en la celda con ícono o sin él; el ícono queda a la misma altura. |
| 4 | gestion-viajes · Botones deshabilitados | Viaje facturado (#12) y en proforma (#14, #15, #25, #26): el globito dice qué hacer | OK | Ver F6 (nombre accesible). |
| 5 | Ver detalle del viaje | Desde Gestionar viajes (también #12 facturado) | OK | Bloques en filas alineadas a 1366 px; fechas con hora; importe; pie "Cerrar". |
| 5 | Ver detalle del viaje | Desde Listar viajes | OK | |
| 5 | Ver detalle del viaje | Desde el dashboard (tabla y calendario) | OK | "Abrir en Gestionar viajes" aparece en uno no facturado (#31) y no en uno facturado (#11). |
| 6 | Gestionar / Listar viajes | Km con coma | OK | "67,5", "17,4". |
| 7 | listado-choferes · Ver detalle | Estado en el título, bloques, pie | OK con falla | Ver F5 (teléfono vacío sin "—"). |
| 7 | listado-camiones · Ver detalle | Ídem | OK | |
| 7 | listado-clientes · Ver detalle | Ídem | OK | |
| 7 | listado-usuarios · Ver detalle | Ídem | FALLA | Ver F4: no tiene el pie con alta y modificación. |
| 8 | presupuestos | Aceptado con el ícono gris "Generó el viaje #N." y sin "Viaje #N" debajo | OK | Presupuestos 1, 3, 4 y 5; estados alineados con ícono y sin él. |
| 9 | gestion-clientes | Registrar cliente directo de prueba | OK | Toast "Cliente registrado." (Cliente_ID 6). |
| 10 | gestion-facturacion · Registrar proforma | Datos del cliente como texto en recuadro gris, sin campos | OK | |
| 10 | gestion-facturacion · Registrar proforma | "Editar cliente": tipo de cliente como texto con el motivo | OK | "Desde una proforma no se cambia: hacelo en Gestionar clientes." |
| 10 | gestion-facturacion · Registrar proforma | Cambiar el teléfono y guardar | OK | Toast "Cliente actualizado."; la proforma vuelve con 1145550102 y la línea sigue. Tarda unos 2 s en reaparecer y vuelve arriba de todo (ver mejoras). |
| 10 | gestion-facturacion · Registrar proforma | "Editar cliente" y Cancelar: vuelve sin aviso | OK | |
| 10 | gestion-facturacion · Registrar proforma | Guardar como borrador | OK | Borrador #40, $ 302.500,00. |
| 11 | gestion-clientes · Editar | Toast "Cliente actualizado. También se actualizaron sus datos en el borrador de proforma #40." | OK | Dos renglones; ícono y cruz a la altura del primero (medido: renglón 1 a y=40, cruz a y=41). La API devuelve `{Borradores:1, BorradorID:40}`. |
| 11 | gestion-facturacion | El borrador tiene el e-mail nuevo | OK | facturacion@example.com |
| 12 | Ver PDF del borrador #40 | E-mail, "Ciudad" con provincia y CP, sin "Contacto" | OK | "Ciudad: Pilar, Buenos Aires (CP 1629)". Pie: Cerrar · Imprimir · Descargar PDF (sin "Enviar por e-mail"; ver mejoras). |
| 13 | gestion-auditoria | "Datos del cliente actualizados desde su ficha" para el borrador | OK | PROFORMAS Proforma_ID=40: "…desde su ficha (Cliente_ID=6)", uno por cada edición desde Gestionar clientes. |
| 14 | Registrar proforma → QUICKFOOD | Paso 2: fila compacta del cliente con "Editar cliente"; abrir y cancelar | OK | Un renglón a 1366. Cancelar vuelve sin aviso. Ver F1 (paso actual casi invisible). |
| 14 | Registrar proforma → QUICKFOOD | Elegir `proforma-rukas-diferencias (PROFORMA NRO 990100).xlsx` | OK | Se creó el borrador #41. El archivo se cargó con el `input` de archivo, como si se eligiera. |
| 15 | Control de Rukas | Cliente arriba, franja del Excel con "Volver a controlar" y "Reemplazar Excel" | OK | |
| 15 | Control de Rukas | Resumen en un renglón con puntos de color; cada parte lleva a su grupo | OK | "Para revisar" desplaza hasta su grupo. |
| 15 | Control de Rukas | Título del grupo en gris claro y qué hacer al lado | OK | |
| 15 | Control de Rukas | Resultado en un renglón; 990099 "Sin viaje relacionado en SGTL" | FALLA | Ver F2: se parte en dos renglones. |
| 15 | Control de Rukas | Tarifa en gris debajo del importe de SGTL en "Importe distinto" | OK | "17,4 km × $ 850" |
| 15 | Control de Rukas | "Generar proforma" deshabilitado con el motivo | OK | "Para generar, resolvé las 3 diferencias" |
| 15 | Control de Rukas | "Abrir viaje": ícono centrado y abre `gestion-viajes.html?viaje=N` en otra pestaña | OK | Desfase del ícono 0 px; `target=_blank`. Abriendo `?viaje=25` se abre "Editar viaje #25". |
| 15 | Control de Rukas | A 1366 y 1100 px la tabla entra sin desplazarse | FALLA (1100) | 1366 OK (1253 px en 1253). 1100: 1003 px en 987 (ver F2). |
| 16 | Control de Rukas | "Volver a controlar" → toast "Control actualizado." | OK | |
| 17 | Reclamo | Solo los dos "Importe distinto" → "Esperando a Rukas" con "Reclamado el … Ver reclamo" | OK | Toast "Reclamo guardado."; "Reclamado el 23/10/2026: cuando Rukas lo corrija, reemplazá el Excel. Ver reclamo". |
| 17 | gestion-facturacion · listado | Ícono rojo por el "Sin viaje" | OK | Globito: "Corregir en SGTL · 1" (punto rojo) y "Esperando a Rukas · 2 desde el 23/10/2026" (punto azul). |
| 18 | Reemplazar Excel | Excel corregido: se cierra el reclamo, todo coincide, "Lista para generar"; ícono verde en el listado | OK | Toast "Excel reemplazado."; "Lista para generar: los 2 transportes coinciden"; "Generar proforma" habilitado (no lo toqué). |
| 19 | Ojo del borrador | Fila del cliente sin "Editar cliente" | OK | Título "Ver proforma de Rukas 990100", pie Cerrar · Ver PDF, sin campos editables. |
| 20 | gestion-viajes | Viajes 25 y 26: ícono gris "En el borrador de proforma #41" y tacho deshabilitado con el motivo | OK | "Está en el borrador de proforma #41: sacalo del borrador para eliminarlo" |
| 21 | Generar borrador 990100 | Datos de la ficha de QUICKFOOD | OK | Con OK de Rocío. La confirmación va en el pie ("¿Generar la proforma de Rukas 990100? Se le asigna número y queda aceptada, lista para facturar." · Cancelar · Generar). Toast "Proforma generada: PF-00000011.". La proforma queda Aceptada y sus `Cli_*` coinciden con la ficha del cliente 2: QUICKFOOD S.A. · Quickfood · 30504131889 · Responsable Inscripto · Av. Malvinas 1200 · Córdoba, Córdoba · CP vacío · 351454334 · quickfoodsa@gmail.com · Contacto vacío. Los viajes 25 y 26 quedan "Listo para facturar" en PF-00000011 (pasan a Facturado recién con la factura, `database/viajes/01_facturado_solo_con_factura.sql`; el instructivo de la VM todavía dice que pasan al generar). |
| 22 | Usuario sin permiso | "Editar cliente" deshabilitado con el motivo | NO PROBADO | El login lo hace Rocío. |
| — | Íconos | Títulos, menú, avisos, botones de fila | OK | Medido en Gestionar viajes: menú, título, botones con texto y botones de fila con desfase 0 px. El ícono del título se ve gris muy claro (misma causa que F1). |
| — | Consola | Errores en las pantallas recorridas | OK con notas | Solo 404 esperables: `api/TarifasFijas/PorRuta` (ruta sin tarifa fija) y `api/DashboardLayout?username=RNUVOLI` (dashboard). Ver mejoras. |

## Fallas (una sección por falla, la más grave primero)

### F1 — El paso actual de Registrar proforma casi no se ve
- Gravedad: Media (no bloquea, pero el paso en el que estás es lo que menos se lee)
- Dónde: gestion-facturacion → Registrar proforma con un cliente de Rukas, indicador de pasos ("2 Excel de Rukas")
- Pasos para reproducir: 1. Registrar proforma. 2. Elegir QUICKFOOD. 3. Mirar los pasos arriba.
- Esperado: el paso actual en el color de la marca, con el número blanco en un círculo de color.
- Obtenido: texto y círculo en `rgb(228, 238, 248)` sobre blanco: casi invisibles. El número (blanco) tampoco se ve.
- Consola / red: sin errores.
- Causa probable: `assets/static/gestionContenido.js:63` pone `--sgtl-marca` con el color de fondo guardado en Gestión de contenido (`GestionContenido/1`), que hoy es `#e4eef8` (celeste muy claro). `sgtl.css:251-258` usa `--sgtl-marca` para el texto y el círculo de `.sgtl-pasos > .actual`. Con el valor por defecto (`#435ebe`) se vería bien. Lo mismo hace que el ícono del título de cada pantalla se vea gris claro (`--sgtl-marca-oscuro` = `#bbc3cb`). Decidir si el color configurable puede ser tan claro o si los pasos usan otro color.

### F2 — Control de Rukas: "Sin viaje relacionado en SGTL" en dos renglones y la tabla no entra a 1100 px
- Gravedad: Baja (cosmético)
- Dónde: gestion-facturacion → borrador Rukas 990100 → tabla del control, columna Resultado
- Pasos para reproducir: 1. Cargar `proforma-rukas-diferencias (PROFORMA NRO 990100).xlsx` en QUICKFOOD. 2. Ver la fila 990099 a 1366 px de ancho. 3. Achicar a 1100 px.
- Esperado: el resultado en un renglón y la tabla sin desplazarse al costado a 1366 ni a 1100.
- Obtenido: a 1366 la celda mide 221 px y se parte en "Sin viaje relacionado en" / "SGTL" (la fila queda de 70 px). A 1100 la tabla mide 1003 px y hay 987 disponibles: 16 px de desplazamiento al costado; el resultado también se parte (Resultado 176 px). Los "Importe distinto" entran en un renglón.
- Consola / red: sin errores.
- Causa probable: la columna Resultado no tiene `white-space: nowrap` (la celda tiene `white-space: normal`) y el texto nuevo es más largo que el anterior ("Sin viaje en SGTL"). El resultado tiene un `title` nativo ("No hay un viaje de este cliente con el N° 990099…") en lugar del globito del sistema.

### F3 — Chofer "(opcional)" pero marcado con error
- Gravedad: Baja
- Dónde: gestion-viajes → Registrar viaje, campo Chofer
- Pasos para reproducir: 1. Registrar viaje. 2. Guardar con todo vacío (el chofer queda con "Seleccioná un chofer."). 3. Elegir un cliente de Rukas (Distribuidora del Sur S.A.).
- Esperado: al pasar a "(opcional)", el error del chofer desaparece.
- Obtenido: la etiqueta dice "Chofer (opcional)" y el campo sigue en rojo con "Seleccioná un chofer." hasta que se elige uno.
- Consola / red: sin errores.
- Causa probable: `gestion-viajes.html:1055-1056` (`aplicarReglasTipoCliente`) cambia la regla `reglasViaje.chofer.requerido` pero no limpia el error ya mostrado.

### F4 — Ver detalle del usuario sin alta ni modificación
- Gravedad: Baja
- Dónde: listado-usuarios → Ver detalle
- Pasos para reproducir: 1. Listar usuarios. 2. Ojo del primero (amontenegro).
- Esperado: pie con "Registrado por … el … · Modificado por …", como choferes, camiones y clientes (§24).
- Obtenido: solo "Datos del usuario" y "Grupos y pantallas que ve"; no hay pie.
- Consola / red: sin errores.
- Causa probable: `listado-usuarios.html` no usa `SGTL.textoRegistro` (en `listado-clientes.html:338` sí). La API ya devuelve `Fecha_Alta` (`UsuariosController.cs:105`).

### F5 — Teléfono particular vacío sin "—" en Ver detalle del chofer
- Gravedad: Baja (cosmético)
- Dónde: listado-choferes → Ver detalle (Facundo Godoy)
- Esperado: "—" en los vacíos.
- Obtenido: "Teléfono particular" sin valor.
- Causa probable: `listado-choferes.html:410` pone `chofer.TelefonoFijo` sin recortar; la base devuelve 10 espacios (columna de largo fijo), así que el `::before` con "—" (que solo aparece si está vacío) no aparece. Con `.trim()` se resolvería; puede pasar con otras columnas de largo fijo (por ejemplo `Dominio` viene "ABC123    ").

### F6 — Nombre accesible de los botones bloqueados repite el motivo
- Gravedad: Baja (lector de pantalla)
- Dónde: gestion-viajes, lápiz de un viaje facturado o en proforma emitida
- Obtenido: `aria-label` = "Viaje facturado: para corregirlo, …: viaje facturado: para corregirlo, …" (el motivo dos veces y sin "Editar"). Los otros botones dicen "Cambiar estado: …" y "Eliminar: …".
- Causa probable: `gestion-viajes.html:573`: `tituloEditar` es el motivo cuando está bloqueado y se pasa como `texto` a `SGTL.botonFila('editar', …)`. En Gestionar proformas pasa algo parecido: el botón deshabilitado de la fila del borrador se llama "Primero generá la proforma".

## Mejoras sugeridas
- **Buscador de cliente:** la opción vacía "Seleccioná un cliente" aparece en la lista y es la primera a la que llega la flecha. Al hacer clic en un campo con un cliente elegido, lo que se escribe se suma al nombre ("QUICKFOOD S.A.sur" → "No hay clientes que coincidan."); seleccionar el texto al enfocar ayudaría.
- **"Completar números de remito y entrega"** (botón de la fila) abre un modal titulado "Editar viaje #N": el §3.1 pide que el botón y el título digan lo mismo.
- **Editar cliente desde la proforma:** la proforma vuelve unos 2 s después del toast, y vuelve arriba de todo y no donde estaba "Editar cliente".
- **"Responsable Inscripto"** con I mayúscula en la proforma, el PDF y la fila de Rukas; en Ver detalle del cliente dice "Responsable inscripto" (§9).
- **CUIT sin guiones** en el buscador de cliente de la proforma ("30715893424") y en el PDF; en el recuadro sale con guiones.
- **Ver PDF de un borrador** tiene Cerrar · Imprimir · Descargar PDF, sin "Enviar por e-mail" (§1.4). Si es a propósito para los borradores, anotarlo en el design system.
- **Registrar proforma propia:** el título muestra la etiqueta "Borrador" antes de guardar (en la de Rukas se sacó hasta que existe).
- **P. unit. de las líneas de la proforma** es `type="number"` (§7.3 pide texto con máscara). Módulo de Facu.
- **Subtítulos del modal de cliente** ("Datos fiscales", "Contacto") en azul y más grandes que `.sgtl-bloque-titulo` de viajes.
- **Globito del borrador de Rukas:** "Esperando a Rukas" lleva punto azul; en el §24 se habla de naranja para lo que espera a Rukas.
- **404 en la consola:** `api/TarifasFijas/PorRuta` responde 404 cuando la ruta no tiene tarifa fija y `api/DashboardLayout` cuando el usuario no tiene diseño guardado. Se ven en rojo en la consola aunque no son errores; podrían devolver 200 vacío.
- **Datos:** los viajes 14 y 15 están "Registrado" pero en la proforma PF-00000006 aceptada; el viaje #28 (presupuesto #1) tiene 520 km contra 17,4 km de Google. Los choferes "Fede Prueba" y "CLAUDE", y la calle "Calle Prueba" de Distribuidora del Sur, se ven en pantalla (la tesis).

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre que se le puso | Qué se hizo |
|---|---|---|---|---|
| Gestionar clientes | CLIENTES | 6 | Logística Pampeana S.R.L. (CUIT 30-71589342-4, nombre comercial "Logística Pampeana") | Alta. Directo, Responsable inscripto, Chacabuco 650, Pilar (Buenos Aires), CP 1629. Teléfono 1145550101 → 1145550102 (inventado; los clientes no reciben WhatsApp, solo el celular del chofer). E-mail administracion@example.com → administracion.pilar@example.com → facturacion@example.com. |
| Gestionar proformas | PROFORMAS, PROFORMA_DETALLE | 40 | Borrador propio de Logística Pampeana S.R.L. | Alta como borrador, una línea "Flete · Traslado Planta Pilar a Depósito Córdoba Norte", 1 viaje × $ 250.000, IVA 21 % (total $ 302.500,00). Sus datos de cliente se actualizaron solos 2 veces. |
| Gestionar proformas | PROFORMAS, PROFORMA_PLATAFORMA_LINEA, PROFORMA_ADJUNTO, PROFORMAS_VIAJES | 41 | Borrador Rukas 990100 de QUICKFOOD S.A. | Alta al elegir `proforma-rukas-diferencias (PROFORMA NRO 990100).xlsx`. Reclamo del 23/10/2026 sobre 990001 y 990002. Excel reemplazado por `proforma-rukas-corregido (PROFORMA NRO 990100).xlsx` (reclamo cerrado). Tiene los viajes 25 y 26. **Generada con OK de Rocío: PF-00000011, Aceptada, $ 53.941,80** (consumió ese número de la secuencia PF-). |
| — | AUDITORIA | — | — | Registros automáticos de lo anterior (alta y 3 modificaciones del cliente 6, alta y modificaciones de las proformas 40 y 41). |

QUICKFOOD no se editó: se abrió "Editar cliente" y se canceló. Los viajes no se guardaron: todos se cerraron con Cancelar. Rocío sacó los viajes 25 y 26 del borrador #39 antes de la parte 4.

## SQL de limpieza propuesto (NO ejecutado)
- **PF-00000011 (#41)** ya no es borrador: se limpia **anulándola desde Gestionar proformas** (así libera los viajes 25 y 26 y deja su auditoría, como PF-00000010). El número PF-00000011 no se recupera. No propongo SQL para ella.
- **Borrador #40**: lo más simple es eliminarlo desde Gestionar proformas (tacho "Eliminar borrador"). Si se prefiere por SQL, el bloque copia lo que hace `ProformasController` al eliminar un borrador.
- **Cliente 6**: después de eliminar el borrador #40.

```sql
BEGIN TRAN;

-- Borrador de prueba #40 (solo si sigue en Borrador)
DELETE FROM dbo.PROFORMAS_VIAJES
WHERE ProformaID IN (SELECT Proforma_ID FROM dbo.PROFORMAS
                     WHERE Proforma_ID = 40 AND ClienteID = 6 AND Estado = 'Borrador');
SELECT @@ROWCOUNT AS viajes_liberados;   -- esperado: 0 (no tiene viajes)

DELETE FROM dbo.PROFORMA_DETALLE
WHERE Proforma_ID IN (SELECT Proforma_ID FROM dbo.PROFORMAS
                      WHERE Proforma_ID = 40 AND ClienteID = 6 AND Estado = 'Borrador');
SELECT @@ROWCOUNT AS lineas_detalle;     -- esperado: 1

DELETE FROM dbo.PROFORMAS
WHERE Proforma_ID = 40 AND ClienteID = 6 AND Estado = 'Borrador';
SELECT @@ROWCOUNT AS proformas;          -- esperado: 1

-- Cliente de prueba (solo si ya no tiene proformas ni viajes)
DELETE FROM dbo.CLIENTES
WHERE Cliente_ID = 6
  AND Razon_Social = N'Logística Pampeana S.R.L.'
  AND CUIT_Cliente = '30715893424'
  AND NOT EXISTS (SELECT 1 FROM dbo.PROFORMAS WHERE ClienteID = 6)
  AND NOT EXISTS (SELECT 1 FROM dbo.VIAJES WHERE ClienteID = 6);
SELECT @@ROWCOUNT AS clientes;           -- esperado: 1

-- COMMIT; o ROLLBACK;
```

## Seguimiento (Mac, 23/10)

Análisis del reporte en la Mac. Lo que ya resolvieron los commits del 23/10 a la mañana (después de `6ba727a`, el
commit probado):
- **F6** (nombre accesible): `f2bc239` pasó todos los motivos a "No se puede {acción}: {qué le pasa}" y el lector de
  pantalla lee ese texto (§26 de `docs/PENDIENTES-SISTEMA.md`). Se verifica en la próxima prueba.
- **Subtítulos del modal de cliente:** `3a3fa65` y `c831e1c` los pasaron a `.sgtl-bloque-titulo` (§27).

Lo demás (F1 a F5, las mejoras y la limpieza), con lo que decidió Rocío: §28 de `docs/PENDIENTES-SISTEMA.md`.
