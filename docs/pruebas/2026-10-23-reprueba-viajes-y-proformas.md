# Reporte de pruebas — Reprueba de viajes y proformas (§28, §26 y §27) — 23/10/2026

## Entorno
- Rama / commit: rocionuvoli @ aef6e4a Documentación: instructivo de la VM y cierre de los arreglos del reporte del 23/10 (git status limpio)
- API: http://localhost:50222/api (OK)
- Front: Live Server puerto **5500**
- Navegador integrado, Ctrl+F5 al empezar. Las medidas de 1366 y 1100 px se tomaron emulando el ancho de la ventana.
- Alcance pedido: reprueba del reporte del 23/10 (`docs/pruebas/2026-10-23-viajes-y-proformas.md`): §28 (arreglos), §26 (motivos de los botones deshabilitados) y §27 (subtítulos de las secciones).
- Usuarios: RNUVOLI para todo, salvo el punto 18, que se hizo con el usuario de prueba mledesma (sin permiso para Gestionar clientes).

## Resumen
22 puntos pedidos: los 22 dan OK. Hay 1 falla nueva (Media) que no estaba en el alcance: en Registrar viaje, Escape con la lista de clientes abierta cierra el modal entero.
Cinco casos de §26 y §27 no se pudieron ver porque no hay datos así en la base (ver "No probado").
Al empezar, PF-00000011 seguía Aceptada con los viajes 25 y 26; Rocío la anuló y se siguió.

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | gestion-facturacion · Registrar proforma (QUICKFOOD) | El paso actual se lee | OK | "2 Excel de Rukas" en `#435ebe` con número blanco. En Gestión de contenido sigue guardado `#e4eef8`: el arreglo actúa sin tocar la configuración. |
| 1 | Todas | Íconos de los títulos en color | OK | `rgb(55, 77, 156)` (antes gris claro). |
| 2 | Borrador Rukas 990100 (#42) | 990099 "Sin viaje relacionado" en un renglón | OK | Los dos "Importe distinto" también en un renglón. |
| 2 | Borrador Rukas 990100 (#42) | Globito del sistema al pasar el mouse | OK | Tooltip de Bootstrap con "No hay un viaje de este cliente con el N° 990099. Cargalo o corregí el N° en el viaje."; el `title` nativo desaparece al inicializarse. |
| 2 | Borrador Rukas 990100 (#42) | La tabla entra a 1366 y 1100 px | OK | 1366: 1253 px en 1253. 1100: 987 px en 987. |
| 3 | gestion-viajes · Registrar viaje | Guardar vacío y elegir cliente de Rukas: el chofer deja de estar en rojo | OK | Pasa a "(opcional)", sin `is-invalid` ni mensaje. |
| 4 | listado-usuarios · Ver detalle | Pie "Registrado el …" | OK | "Registrado el 20/10/2026 14:03". |
| 5 | listado-choferes · Ver detalle (Facundo Godoy) | "Teléfono particular" con "—" | OK | |
| 6 | Registrar viaje · cliente | La primera flecha llega a un cliente | OK | QUICKFOOD S.A.; la opción vacía ya no está en la lista. |
| 6 | Registrar viaje · cliente | Clic en el campo con un cliente elegido y escribir: reemplaza el nombre | OK | "Pamp" → Logística Pampeana S.R.L. |
| 6 | gestion-facturacion · filtro de cliente | Lo mismo en el filtro | OK con observación | Entrando con un clic, OK. Si se elige con Enter y se hace clic sin salir del campo, lo escrito se mete en el medio ("QUICKFOOD SPamp.A. · 30-50413188-9"). Ver mejoras. |
| 7 | gestion-viajes · viaje #33 en viaje | "Completar números de remito y entrega" abre el modal con ese título | OK | "Completar números de remito y entrega del viaje #33". Salí con Cancelar. |
| 8 | Borrador #40 · Editar cliente | Vuelve enseguida, en el mismo lugar, con el dato nuevo | OK | Con la proforma desplazada 90 px: vuelve a 90 px con el teléfono nuevo. **Tiempos:** 2,7 s desde el clic en Guardar; de eso, 2,2 s es el PUT `Clientes/6` (la API actualiza los borradores) y unos 0,5 s el cierre y la apertura de los modales. La relectura del cliente (GET) sale después de que la proforma ya está a la vista. |
| 9 | Borrador #40 | "Responsable inscripto" y CUIT con guiones | OK | En el recuadro gris y en la lista de clientes de la proforma ("Logística Pampeana S.R.L. · 30-71589342-4"). |
| 9 | Borrador #40 · buscador | Encuentra el CUIT con guiones y sin ellos | OK | "30-71589342" y "3071589342". |
| 9 | Borrador #40 · Ver PDF | CUIT con guiones y "Responsable inscripto" | OK | "CUIT: 30-71589342-4", "Cond. IVA: Responsable inscripto". |
| 9 | Borrador Rukas #42 | La fila del cliente dice "Responsable inscripto" | OK | |
| 10 | Registrar proforma propia | Sin la etiqueta "Borrador" en el título | OK | Cancelé sin guardar. |
| 11 | gestion-choferes / gestion-camiones | Tacho de uno activo | OK | "No se puede eliminar el chofer: está activo" / "…el camión: está activo". `aria-label` igual al globito. |
| 12 | gestion-viajes · facturado (#12) | Lápiz, banderita y tacho | OK | "No se puede editar el viaje: está facturado", "No se puede cambiar el estado: el viaje está facturado", "No se puede eliminar el viaje: está facturado". |
| 12 | gestion-viajes · en proforma aceptada (#14, #15 en PF-00000006) | Lápiz, banderita y tacho | OK | "…: está en la proforma PF-00000006" / "…: el viaje está en la proforma PF-00000006". |
| 12 | gestion-viajes · tachos | Borrador, presupuesto, en viaje / entregado | OK | #25 y #26: "No se puede eliminar el viaje: está en el borrador de proforma #42". #28: "…: viene del presupuesto #1". #38: "…: está entregado". El único viaje en viaje (#33) viene de un presupuesto y muestra ese motivo. |
| 13 | gestion-facturacion | Siguiente paso de un borrador | OK | "No se puede marcar como aceptada: la proforma todavía es un borrador". |
| 13 | gestion-facturacion | Lápiz de una aceptada | OK | "No se puede editar la proforma: ya se generó". |
| 13 | gestion-facturacion | Facturada y anulada | OK | Facturada: "No se puede emitir la factura: ya se emitió FAC-00000012". Anulada: "No se puede marcar como aceptada: la proforma está anulada" y "No se puede anular la proforma: ya está anulada". El globito se vio al pasar el mouse. |
| 14 | listado-facturas (Listar proformas) | Emitir factura de una no aceptada | OK (parcial) | Anuladas: "No se puede emitir la factura: la proforma está anulada"; facturadas: "…: ya se emitió FAC-…". No hay ninguna en estado Generada (ver "No probado"). |
| 15 | Borrador Rukas #42 | "Generar proforma" dice cuántas diferencias faltan | OK | "No se puede generar la proforma: hay 3 diferencias sin resolver" (`aria-label` igual). Sin Excel: "No se puede generar la proforma: falta elegir el Excel de Rukas". |
| 16 | presupuestos | Aceptado, pendiente y con viaje | OK (parcial) | Pendientes (6, 7, 8): "No se puede generar el viaje: el presupuesto todavía no está aceptado". Con viaje (1, 3, 4, 5): lápiz, banderita y tacho "…: ya se generó el viaje #N", camión "…: ya existe el viaje #N". Todos los aceptados tienen viaje: no se pudo ver el lápiz "…: está aceptado". |
| 17 | cuenta-corriente-clientes | Lápiz y anular de una factura | OK | "No se puede editar la factura: solo se editan los recibos" y "No se puede anular la factura: se corrige con una nota de crédito". Ver mejoras ("solo se…"). |
| 17 | cuenta-corriente-clientes | Lápiz de un recibo anulado | NO PROBADO | No aparece ningún recibo anulado, ni con el filtro Recibo y todas las filas. |
| 18 | gestion-facturacion como mledesma (sin Gestionar clientes) | "Editar cliente" deshabilitado con el motivo | OK | En el borrador propio #40 y en el de Rukas #42: "No se puede editar el cliente: no tenés permiso" (globito al pasar el mouse y `aria-label`). |
| 19 | Registrar chofer, camión, cliente, usuario (rol user: "Grupos *"), tarifa fija, tarifa por km y origen; Editar cliente desde la proforma | Subtítulos negros, 15 px, negrita, línea abajo, aire arriba | OK | Todos `.sgtl-bloque-titulo`: `rgb(29, 41, 57)`, 15 px, 700, borde inferior; 24 px de aire entre secciones. Todos cancelados. |
| 20 | Registrar proforma propia / ojo de Listar proformas | Ídem | OK | Propia: "Datos generales y del cliente", "Detalle de conceptos" (con "Traer viajes" y "Agregar línea"), "Totales" y "Condiciones comerciales". Ojo de PF-00000006: "Datos generales y cliente", "Transporte", "Conceptos", "Condiciones y observaciones", "Totales". |
| 20 | Borrador de Rukas | Los títulos que se ocultan siguen ocultos | OK | Los cuatro subtítulos de la proforma propia ocultos; "Condiciones comerciales" va con su botón desplegable de Rukas. |
| 21 | Cuenta corriente · Registrar recibo | Los tres pasos | OK | "1 · Datos generales", "2 · Forma de pago", "3 · Imputación a comprobantes" (con "Distribuir"). Cancelado. |
| 21 | Cuenta corriente · ojo de una factura | Conceptos y comprobantes aplicados | OK (parcial) | FAC-00000005: "Detalle del comprobante" OK; "Comprobantes aplicados" está oculto aunque la factura está Parcial con recibos aplicados (ver mejoras). "Trazabilidad" no se pudo abrir (ver "No probado"). |
| 22 | configuracion-email · Registrar configuración de e-mail | Subtítulos | OK | "Servidor y credenciales" y "Plantilla predeterminada" (esta con 8 px de aire; ver mejoras). |
| 22 | configuracion-whatsapp | Secciones | OK | "Cuenta de Meta" y "Plantilla aprobada" con el estilo nuevo; "Cuándo se envía" es título de tarjeta (`h6.card-title`), que según §27 se mantiene. |
| 22 | gestion-auditoria · Ver detalle del movimiento | "Valores anteriores" / "Valores nuevos" | OK | |
| — | Consola | Errores en las pantallas recorridas | OK | Sin errores ni respuestas 4xx en las pantallas de esta ronda (las de Live Server y la API). |

### No probado (no hay datos así en la base)
- §26 · Gestionar viajes: un viaje **en viaje que no venga de un presupuesto** ("…: está en viaje"). El único (#33) viene del presupuesto #3.
- §26 · Listar proformas: una proforma **Generada** ("…: la proforma todavía no está aceptada"). Las de Rukas pasan directo a Aceptada.
- §26 · Gestionar presupuestos: un **aceptado sin viaje** (lápiz "…: está aceptado").
- §26 · Cuenta corriente: un **recibo anulado** (lápiz "…: está anulado").
- §27 · Cuenta corriente: el detalle con **"Trazabilidad"**. Solo se abre para comprobantes que no son factura, recibo ni nota, y no hay ninguno. Por código (`cuenta-corriente-clientes.js:689`) usa `.sgtl-bloque-titulo`.
- §26 punto 3 (tarjeta "Listo para facturar" de un viaje de Rukas sin N° de entrega): no estaba en el pedido de esta ronda.

## Fallas (una sección por falla, la más grave primero)

### F1 — Escape con la lista de clientes abierta cierra el modal Registrar viaje
- Gravedad: Media (se pierde lo cargado; hay alternativa: no usar Escape)
- Dónde: gestion-viajes → Registrar viaje, campo Cliente (también afecta a los otros buscadores de `select-cliente-predictivo.js` dentro de un modal, por ejemplo Chofer)
- Pasos para reproducir: 1. Registrar viaje. 2. Clic en Cliente (se abre la lista). 3. Apretar Escape.
- Esperado: se cierra solo la lista y el modal sigue abierto con lo cargado.
- Obtenido: se cierran la lista y el modal entero.
- Consola / red: sin errores.
- Causa probable: `#ModalAltaViaje` tiene `data-bs-backdrop="static"` pero no `data-bs-keyboard="false"`, y el buscador no frena la propagación del Escape (`assets/static/js/select-cliente-predictivo.js`), así que Bootstrap lo toma como "cerrar modal". No estaba en el alcance; apareció al cerrar la lista con Escape en el punto 6.

## Mejoras sugeridas
- **Buscador de cliente (punto 6):** si se elige con Enter y después se hace clic en el mismo campo sin salir, el texto no se selecciona y lo que se escribe se inserta donde quedó el cursor ("QUICKFOOD SPamp.A."). El `mouseup` de `select-cliente-predictivo.js:198-204` solo selecciona si el clic es el que entra al campo. Podría seleccionar también cuando el campo ya tiene un cliente elegido.
- **"Solo se…" en cuenta corriente:** "No se puede editar la factura: **solo se editan los recibos**", "No se puede editar la nota de crédito/débito: **solo se editan los recibos**" y "No se puede anular la nota de crédito/débito: **solo se anulan los recibos**". La lista de control nueva de `AGENTS.md` (punto 1) pide no usar reglas sueltas como "Solo se…", pero §26 los da como esperados. Decidir cuál manda (por ejemplo "…: es una factura").
- **Lápiz de una proforma anulada:** dice "No se puede editar la proforma: ya se generó"; "…: está anulada" sería más preciso.
- **Aire arriba de algunos subtítulos:** "Plantilla predeterminada" (Registrar configuración de e-mail) tiene 8 px y "Totales" de la proforma propia 16 px; el resto, 24 px.
- **Ver factura (cuenta corriente):** con FAC-00000005 (Parcial, con REC-00000004 y REC-00000014 aplicados), el bloque "Comprobantes aplicados" queda oculto. Revisar si debería verse. El concepto de esa factura es "preubaaaa888" (dato de prueba a la vista).
- **Ver recibo:** el título dice "Ver recibo REC-00000004" con el subtítulo "Registrar cobranza e imputar facturas pendientes.", que es el del alta.
- **Registrar usuario:** Guardar tarda 4 a 5 s y mientras tanto el modal sigue abierto sin ninguna señal; con el viaje y el cliente aparece "Guardando…".
- **Editar cliente:** el PUT `Clientes/{id}` tarda unos 2 a 3 s (actualiza los borradores). Es la mayor parte de la espera del punto 8.

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre que se le puso | Qué se hizo |
|---|---|---|---|---|
| Gestionar proformas | PROFORMAS, PROFORMA_PLATAFORMA_LINEA, PROFORMA_ADJUNTO, PROFORMAS_VIAJES | 42 | Borrador Rukas 990100 de QUICKFOOD S.A. | Alta al elegir `proforma-rukas-diferencias (PROFORMA NRO 990100).xlsx` (toast "Borrador guardado: 3 transportes controlados."). Tiene los viajes 25 y 26. Sin reclamo ni reemplazo; se dejó como estaba. |
| Gestionar clientes / proforma | CLIENTES | 6 | Logística Pampeana S.R.L. | Teléfono 1145550102 → 1145550103 → 1145550104, desde "Editar cliente" del borrador #40. |
| Gestionar proformas | PROFORMAS | 40 | Borrador propio de Logística Pampeana S.R.L. | Sus datos de cliente se actualizaron solos con cada cambio de teléfono (2 registros en Auditoría). No se guardó nada más. |
| Gestionar usuarios | USUARIOS (y su relación con grupos) | 15 | mledesma — Martina Ledesma | Alta, rol user, activo, grupos Listados y Facturacion (sin Gestionar clientes), para el punto 18. La clave está en `C:\pruebas-sgtl\reportes\2026-10-24-usuario-prueba.txt`. |
| — | AUDITORIA | — | — | Registros automáticos de lo anterior. |

PF-00000011 la anuló Rocío antes de los puntos 2, 15 y 20. No se guardó ningún viaje, no se generó ni se eliminó nada.

## Limpieza propuesta (NO ejecutada)
1. **Borradores #42 y #40:** tacho "Eliminar borrador" en Gestionar proformas (libera los viajes 25 y 26).
2. **Usuario 15 (mledesma):** darlo de baja o inactivarlo en Gestionar usuarios (no conozco el nombre de la tabla de grupos por usuario para proponer el SQL). Borrar después `C:\pruebas-sgtl\reportes\2026-10-24-usuario-prueba.txt`.
3. **Cliente 6:** después de eliminar el borrador #40.

```sql
BEGIN TRAN;

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

- La VM fechó el reporte el 24/10 (y el archivo de la clave del usuario de prueba) porque el pedido le dio ese nombre
  por error: la reprueba es del 23/10.
- La falla nueva, las mejoras y la limpieza, con lo que decide Rocío: §29 de `docs/PENDIENTES-SISTEMA.md`.
