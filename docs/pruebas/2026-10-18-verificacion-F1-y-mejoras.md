# Reporte de pruebas — Verificación F1 y mejoras del §13 — 18/10/2026

> Reporte de la sesión de pruebas de la VM, copiado tal cual salvo el SQL de limpieza, que se
> reemplazó por el SQL único de las tres rondas del 18/10 (ver §13 de `docs/PENDIENTES-SISTEMA.md`).
> El de la VM consultaba `PRESUPUESTOS.OrigenID` / `DestinoID`, columnas que no existen (el origen
> y el destino del presupuesto van dentro de `Datos`, en JSON).

## Entorno
- Rama / commit: rocionuvoli @ 4635408 "Docs: mejoras de la ronda del 18/10 listas para probar" (igual a `origin/rocionuvoli`, `git status` limpio)
- API: http://localhost:50222/api (OK)
- Front: Live Server puerto **5500**
- Alcance pedido: F1 (ítem 12) y mejoras del §13 de `docs/PENDIENTES-SISTEMA.md`, pruebas A–F.
- Navegador integrado: el panel mide unos 462 px de ancho, así que ese fue el "ancho normal". La prueba angosta se hizo emulando 400 px. Desde la sección E el panel quedó en segundo plano (`document.hidden = true`), las capturas salían viejas y las verificaciones se hicieron leyendo el DOM.

## Resumen
De 31 pruebas, 29 dieron OK, D3 se verificó solo por código (por decisión de Rocío) y **1 falla**. **F1 está corregida**: el alta rápida de origen/destino anda en gestion-viajes, que no tiene `window.bootstrap`, y en presupuestos, y no hay errores de `bootstrap`. Los bloqueos del viaje generado desde presupuesto, los textos del design system, el aviso de cambios sin guardar en proformas y los títulos de pestaña funcionan. La falla es de severidad media: en gestion-viajes el aviso rojo "Completá o revisá: …" aparece arriba del modal, fuera de la vista, y el usuario que tocó Guardar abajo no ve nada (C4).

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| A1 | gestion-viajes | "+" de Origen con cliente PRUEBA-CLAUDE 17/10 | OK | Modal "Registrar origen", cliente precargado (readonly), opciones "Seleccioná una provincia" / "Seleccioná una localidad", pie Cancelar + Guardar |
| A2 | gestion-viajes | Crear origen "PRUEBA-CLAUDE 18/10 B" | OK | Origen **ID 7**, queda elegido y vuelve el modal del viaje (1 backdrop) |
| A3 | gestion-viajes | "+" de Destino → Cancelar → abrir otra vez y crear | OK | "Registrar destino". Cancelar vuelve al viaje y conserva el origen. Destino **ID 8**, queda elegido |
| A4 | gestion-viajes | Cancelar el viaje sin guardar | OK | 0 modales, 0 backdrops, no se creó viaje |
| A5 | gestion-viajes | Tooltips y consola | OK | `title` / `aria-label` "Registrar origen" / "Registrar destino". Ningún mensaje con "bootstrap" (`window.bootstrap` = undefined: es el caso corregido) |
| B1 | gestion-viajes | Editar #31 (generado desde presupuesto) | OK | Cliente, origen, destino, los dos "+", radios de tipo de tarifa, km y "Recalcular" deshabilitados. El aviso amarillo dice exactamente el texto esperado, con "presupuesto #5". Los combos `tarifaFijaId` / `tarifaKmId` quedan habilitados pero están ocultos: no se pueden tocar |
| B2 | gestion-viajes | #31: fecha fin 12:00 → 13:00, remito PC1810-2 → PC1810-3, Guardar | OK | Toast verde "Viaje guardado.", sin `alert`. Al reabrirlo y en la API: km 15 y TarifaKmID 5 sin cambios, fin 22/10 13:00, remito PC1810-3, sigue Registrado |
| B3 | gestion-viajes | Editar viaje común en Registrado | OK | **#28 no sirve**: también viene de un presupuesto (#1) y muestra el aviso de presupuesto. Se probó con **#24** (QUICKFOOD): todo habilitado salvo los km (de solo lectura por diseño), sin aviso. Cancelar |
| B4 | gestion-viajes | Editar #26 (Listo para facturar) | OK | Aviso "El viaje está Listo para facturar: solo podés completar los números de remito, transporte SAP y entrega Rukas…". "+", cliente, recorrido, fechas, camión y chofer bloqueados. Solo quedan editables transporte, remito y carga. Cancelar |
| C1 | gestion-viajes | Pie del modal, normal y a 400 px | OK | "Cancelar" y "Guardar" (no "Confirmar"). A 400 px los dos muestran el texto completo (88 y 84 px, sin recorte) |
| C2 | gestion-viajes | Botón mientras guarda | OK | "Guardando…" deshabilitado y después vuelve a "Guardar" |
| C3 | gestion-viajes | Alta QUICKFOOD sin chofer, remito PC1810-B | OK | Toast "Viaje registrado.". Viaje **#32** (Sede Quilmes → Sede Banfield, 25/10 08:00–12:00, camión ABC123, tarifa km #5, 17,4 km). Se guarda sin chofer porque QUICKFOOD es cliente con plataforma (Rukas) |
| C4 | gestion-viajes | Guardar con campos faltantes | **FALLA** | El texto sale bien ("Completá o revisá: Cliente, Origen, Destino, Chofer, Camión, Fecha de inicio, Fecha de fin, Tipo de tarifa."), pero queda fuera de la vista. Ver F1 |
| C5 | gestion-viajes | Eliminar #32 (con OK de Rocío) | OK | Modal "¿Eliminar el viaje #32?" / "No se puede deshacer.", pie Cancelar + Eliminar (`btn-danger`). Toast "Viaje eliminado.". En la API ya no existe |
| C6 | gestion-viajes | Intentar eliminar #31 (con OK de Rocío) | OK | El botón está habilitado. La API responde 409 y el mensaje "No se puede eliminar un viaje generado desde un presupuesto aceptado." sale **dentro** del modal, que no se cierra. Cancelar. El #31 sigue existiendo |
| C7 | gestion-viajes | Exportar CSV con filtro sin resultados (N° 99999) | OK | Toast rojo "No hay viajes para exportar con los filtros elegidos.", sin descarga |
| C8 | gestion-viajes | Título de pestaña | OK | "Gestionar viajes · Transporte Sánchez" |
| D1 | presupuestos | "+" de origen y destino → Cancelar | OK | "Registrar origen" / "Registrar destino", cliente precargado. Cancelar vuelve a "Nuevo presupuesto" con el cliente intacto. Se cerró sin guardar |
| D2 | presupuestos | Opción vacía de tipo de tarifa | OK | "Seleccioná una tarifa" |
| D3 | presupuestos | Generar viaje | OK (solo código) | Por decisión de Rocío no se generó. En el HTML servido no existe ningún modal "Viaje generado" (quedan `modalPresupuesto`, `modalVistaPresupuesto`, `modalGenerarViaje`, `modalEnviarPresupuesto`). El único aviso es `aviso('mensaje', 'Viaje #' + r.ViajeID + ' generado.')` en `assets/static/js/presupuestos.js:128` |
| E1 | gestion-facturacion | Nueva proforma QUICKFOOD 01/07–31/10 → Traer viajes | OK, con observación | "Se agregaron 2 viajes." (V25, V26). Las advertencias que siguen todavía dicen "viaje(s)": "No se trajeron 3 viaje(s) sin número de remito… 12 viaje(s) ya están incluidos en otra proforma…". Ver mejoras |
| E2 | gestion-facturacion | Cancelar con líneas | OK | No se cierra. Dentro del modal y a la vista aparece "Tenés cambios sin guardar. Si cerrás, se pierden." con "Seguir editando" / "Descartar cambios" |
| E3 | gestion-facturacion | Seguir editando, cruz y Escape | OK | "Seguir editando" saca el aviso y las 2 líneas siguen. La cruz muestra el mismo aviso. Escape también, con el foco dentro del modal (ver mejoras sobre el foco) |
| E4 | gestion-facturacion | Descartar cambios y reabrir | OK | Se cierra. "Nueva proforma" vuelve vacía: sin cliente ni fechas, 0 líneas, sin mensaje |
| E5 | gestion-facturacion | Nueva proforma sin tocar → Cancelar | OK | Cierra directo, sin aviso |
| E6 | gestion-facturacion | Ver PF-00000007 (Generada) → cerrar | OK | "Ver proforma PF-00000007". Cierra directo con Cancelar y con la cruz, sin aviso |
| F1 | gestion-contenido | Título de pestaña | OK | "Gestionar contenido · Transporte Sánchez" |
| — | Todas | Consola | OK | Solo aparecen los errores conocidos: F16 (PerfectScrollbar en `app.js`, 404 de `api/DashboardLayout`) y F12 (simple-datatables sin `#table1`). Nada de `bootstrap`, `SGTL` ni "is not defined" |

## Fallas

### F1 — El aviso "Completá o revisá" del viaje queda fuera de la vista
- Gravedad: Media (el usuario toca Guardar y parece que no pasa nada; hay alternativa: subir a mano)
- Dónde: gestion-viajes, modal Registrar/Editar viaje, botón Guardar
- Pasos para reproducir: 1. "Registrar viaje". 2. Sin completar nada, bajar hasta el pie (pasando el mapa) y tocar "Guardar".
- Esperado: el aviso rojo se ve, o el modal sube hasta él y marca los campos que faltan.
- Obtenido: el aviso aparece arriba de todo en el modal (`top` ≈ −1240 px con el modal scrolleado 1325 px). El scroll queda abajo, el foco se queda en Guardar y ningún campo se marca (`.is-invalid`: 0). Si después se completa un campo, el aviso sigue mostrando la lista vieja hasta el próximo Guardar.
- Consola / red: sin errores y sin llamadas a la API (la validación es local).
- Causa probable: `gestion-viajes.html:881` `mostrarAlertaModal(msg)` solo hace `$('#alertaCompletaCampos').html(msg).show()`, sin scroll ni foco. La llama `guardarViaje()` (línea 1291) y también los errores de la API (línea 1309). En proformas el aviso equivalente sí queda a la vista. Sin corregir.

## Mejoras sugeridas
- **Proformas, "viaje(s)" en las advertencias (Facu):** el mensaje principal ya usa singular/plural, pero las advertencias que arma la API (`Proformas/PrellenarViajes`) siguen con "viaje(s)". Faltaría lo mismo del lado del controller.
- **Proformas, foco después de "Seguir editando":** el botón se oculta y el foco queda en el `body`, así que un Escape inmediato no hace nada. Convendría devolver el foco al modal. Baja.
- **Proformas en modo Ver:** el pie dice "Cancelar", pero ahí no hay nada que cancelar; correspondería "Cerrar". Además `traerViajes()` sigue usando `alert()` para validar (`gestion-facturacion.html:588-590, 608`). Módulo de Facu.
- **Viajes, chofer con asterisco:** el label "Chofer asignado *" se muestra siempre, pero para clientes Rukas no es obligatorio (`gestion-viajes.html:1283`). Podría mostrar el asterisco solo cuando aplica.
- **Viajes, botón Eliminar en viajes de presupuesto:** en el #31 está habilitado y solo después de confirmar se avisa que no se puede. Se podría deshabilitar con tooltip, como el de los viajes que ya salieron. Además, cuando aparece el error, el modal sigue mostrando "No se puede deshacer." y el botón Eliminar activo.
- **Viajes, combos en "usted":** "Seleccione un cliente / origen / destino / camión" deberían ir en voseo ("Seleccioná…"), como en el modal de alta rápida.
- **Presupuestos y proformas, títulos de pestaña** con el formato viejo: "Transporte Sanchez - Gestionar presupuestos" / "… - Gestionar proformas" (sin tilde y con guion). El botón y el modal dicen "Nuevo presupuesto" / "Nueva proforma" en lugar de infinitivo. Módulos de Facu: avisar antes.
- **Presupuestos:** el aviso de viaje generado usa un `aviso()` propio en vez de `SGTL.toastExito`.
- **Altura en blanco** (ya reportado en la ronda anterior): `AlturaCalle` se guarda como 10 espacios.

## Datos de prueba creados o modificados
| Pantalla | ID | Qué se hizo |
|---|---|---|
| gestion-viajes → alta rápida | ORIGEN 7 | Creado: "PRUEBA-CLAUDE 18/10 B", cliente 5, Córdoba / Córdoba |
| gestion-viajes → alta rápida | DESTINO 8 | Creado: "PRUEBA-CLAUDE 18/10 B", cliente 5, Córdoba / Villa María |
| gestion-viajes | VIAJE 31 | Modificado (B2): Fecha_Fin 22/10/2026 12:00 → 13:00; Num_Remito PC1810-2 → PC1810-3. No se borró (C6 rechazado por la API) |
| gestion-viajes | VIAJE 32 | Creado en C3 (QUICKFOOD, remito PC1810-B, sin chofer) y **eliminado en C5**. Ya no existe |

No se guardaron ni generaron proformas: solo se trajeron viajes al modal y se descartaron. No se generaron viajes desde presupuestos ni se cambiaron estados ni choferes. Quedan de la verificación anterior (`2026-10-18-verificacion-F1-alta-rapida.md`) el **ORIGEN 6** y el **DESTINO 7** "PRUEBA-CLAUDE 18/10 B".

## SQL de limpieza
Reemplazado por el SQL único de las tres rondas del 18/10: ver §13 de `docs/PENDIENTES-SISTEMA.md`.
