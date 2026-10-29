# Reporte de pruebas — Ronda 3 (facturación: E, F, G y P) — 28/10/2026 — INTERRUMPIDA

> Reporte de la sesión de la VM, con `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md`. Seguimiento en la §62 de
> `docs/PENDIENTES-SISTEMA.md`.

## Entorno
- Rama / commit: rocionuvoli @ 78d2ef5 "Pruebas: reporte de la ronda 1, reprueba y pendientes". API recompilada a las 18:22.
- API: http://localhost:50222/api — OK. Front: Five Server, puerto 5502. Admin RNUVOLI en `localhost:5502` (la sesión se renovó cuatro veces: vence a los 30 minutos).
- Alcance pedido: ronda 3 de `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md` (partes E, F, G y P), con el OK de Rocío antes de cada emisión, anulación o envío.
- Decisiones de Rocío:
  - Cuenta corriente con Logística Pampeana S.R.L. (cliente 6).
  - Proforma propia con distribuidora-powerful S.A. (cliente 3, su único viaje entregado, #5).
  - Sigla de prueba CR "Crédito comercial".
  - Se pueden consumir números e inactivar C, D y FC un rato.
  - Rukas con el Excel "caso1 todo ok (990110)".
  - E4 cambiando FC y volviéndolo a FC.
- **Por qué se cortó:** a las 21:40–21:42 (hora local), **FGODOY renombró siglas en la base compartida mientras se probaba**: C B → CA B, CA A → CI A, CI A → C A y **FC A → FI A** (sus 5 comprobantes pasaron a FI). Se vio al abrir "Emitir comprobante" de la PF-00000005, que ofrecía "D · Débito interno" preseleccionado y "FI · Comprobante interno". Rocío pidió cortar la ronda ahí (22:15 aprox.).

## Resumen
59 controles: **35 OK, 5 FALLA y 19 NO PROBADO**, la mayoría por el corte.

- **Parte F (cuenta corriente):** casi completa y funciona bien. Emisión directa, crédito, débito, crédito y recibo sin imputar, imputación acumulativa e idempotente, rechazos de la API (exceso, otro cliente, fechas, vínculos inválidos), anulación de un recibo imputado y tipos inactivos.
- **Parte G:** llegó hasta la proforma aceptada.
- **Parte E:** se registró la sigla de prueba y se probaron los conflictos; quedaron sin probar los cambios de sigla y letra con historia, Eliminar, Electrónico y E4.

Fallas nuevas:
- **G1:** "Generar proforma" consume el número **sin pedir confirmación**.
- **F10:** "Imputar crédito" **desaparece** en los créditos internos ya aplicados, en lugar de quedar deshabilitado con el motivo.
- **F1:** en Registrar recibo, tildar una deuda **pisa el importe escrito**.
- Un recibo anulado ofrece **"Eliminar recibo"**.
- Créditos y recibos con saldo aparecen como **"Pendiente"** (el estado rojo de las deudas).

El envío por e-mail falla por la misma causa que F2 de la ronda 1, ahora también en el perfil de Facturación.

## Resultados
| # | Parte / § | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | E1 §47 | Registrar numerador | OK | Vacío: "Completá el nombre." (ver DS1). "Numerador CR" con último 0 → "Numerador guardado.". |
| 2 | E1 §47 | Registrar tipo vacío | OK | "Revisá los campos marcados." + Completá la sigla / la descripción, Seleccioná una sucursal / un numerador. |
| 3 | E1 §47 | Sigla y letra ya configuradas (FC A) | OK | "Ya existe un tipo de comprobante con esa sigla y letra." debajo de Letra; no se pierde lo escrito. Al escribir una sigla existente, la descripción se completa sola. |
| 4 | E1 §47 | Registrar CR A (Crédito, 0001, Numerador CR) | OK | "Tipo de comprobante CR A guardado.", con Eliminar (sin relaciones). |
| 5 | E1 §47 | Otra letra de una sigla no electrónica conserva el impacto | OK | CR B (sucursal 0003): impacto como texto "Crédito" + "El impacto se comparte entre las letras de una misma sigla." y "Comprobante electrónico: No". |
| 6 | E1 §47 | Impacto editable sin comprobantes; fijo con historia | OK | CR: el campo Impacto se puede cambiar. FC A: "Impacto Deuda" como texto + "El impacto no se puede modificar porque este tipo ya tiene comprobantes.". |
| 7 | E1 §47 | Reglas de FAC, ND, NC y REC | OK | FAC con letra X: "Seleccioná la letra A o B." (en la pantalla). NC con Deuda: la API lo rechaza ("Las notas de crédito y los recibos tienen que generar crédito."), pero en un aviso suelto (DS2). |
| 8 | E1 §47 | Cambiar la sigla o la letra de un tipo con comprobantes | NO PROBADO | Corte. Facu lo estaba haciendo en ese momento (FC → FI). |
| 9 | E1 §47 | Conflictos al editar (letra con comprobantes, sigla existente) | NO PROBADO | Corte. |
| 10 | E2 | Eliminar: oculto en tipos con comprobantes | OK | Eliminar solo en C B, D B, FC B, CR A y CR B; oculto en C A, D A, FC A y REC X (excepción del design system). Eliminar uno sin relaciones y el rechazo de la API: NO PROBADO. |
| 11 | E3 | Marcar uno de prueba como electrónico | NO PROBADO | Corte (iba a ser CR). |
| 12 | E4 [cruce] | Cambiar la sigla de FC: viajes facturados y cambios para revisar | NO PROBADO | Corte; FC quedó como FI por un cambio de Facu. |
| 13 | F1 §44 | Tipos ofrecidos en Emitir comprobante directo | OK | Solo D y FC (deuda); C, CR y REC no. FC propone letra A, 0001 y N° 00000007; emisión 28/10, vencimiento 07/11. |
| 14 | F1 §44 | Doble clic en Emitir: un solo número | OK | Un solo `POST api/comprobantes` 201 → **FC-A-0001-00000007** ($ 121.000,00 = 100.000 + IVA 21 %). |
| 15 | F1 §44 | El número en la tabla, el detalle y el PDF | OK | "Ver comprobante FC-A-0001-00000007", "Ver PDF del comprobante FC-A-0001-00000007" (pie Cerrar · Imprimir · Descargar PDF). En el e-mail: NO PROBADO (no salió). |
| 16 | F1 | Emitir con el formulario vacío | OK | No emite; ver DS3 (no marca los campos). |
| 17 | F1 §44 | Recibo aplicado al FC | FALLA | **REC-X-0002-00000004** ($ 50.000, TRF 000452) aplicado: FC Parcial, saldo $ 71.000. Funciona, pero al tildar el FC el importe escrito ($ 50.000) pasó al saldo del FC ($ 121.000): F3. |
| 18 | F1 §44 / F2 §48 | Crédito corriente C aplicado al FC | OK | Propone C (A, 0001, N° 00000004); CR también en la lista. "Distribuir" aplica los $ 21.000 (neto 17.355,37 + IVA 3.644,63) → **C-A-0001-00000004**; saldo del FC $ 50.000. |
| 19 | F1 | Sucursal o numerador inactivos no se ofrecen | OK | Con el Numerador CR inactivo, Emitir crédito ofrece solo C. Sucursal inactiva: NO PROBADO. |
| 20 | F1 §44 | Ranking y tablero | NO PROBADO | No se llegó. |
| 21 | F2 §48 | Emitir Débito propone D | OK | D (A, 0001, N° 00000003) → **D-A-0001-00000003** "Gastos de estadía" $ 10.000 (IVA 0 %). |
| 22 | F2 §48 | Solo ND activo | NO PROBADO | ND no está configurado. |
| 23 | F2 §48 | Sin ningún tipo de crédito activo | OK | C A/B inactivos y Numerador CR inactivo: "No hay tipos de crédito activos para emitir.", Emitir deshabilitado (DS6). Reactivado. |
| 24 | F2 §48 | Sin ningún tipo de deuda activo | OK | FC y D inactivos: "No hay tipos de débito activos para emitir." y "No hay tipos de comprobante de deuda activos para emitir.". Reactivado (~20:31). |
| 25 | F3 §49 | IVA y total con centavos y con 0 | OK | Neto 1.234,56 + otros 50,50: con 21 %, IVA 259,26 y total 1.544,32; con 10,5 %, IVA 129,63 y total 1.414,69. Con 0, la pantalla no marca nada y Emitir sigue habilitado; la API lo rechaza (código: "El total del crédito debe ser mayor que cero."). No se emitió. |
| 26 | F3 §49 | Crédito sin imputar neto 1.000, IVA 21 %, otros 50 | OK | **C-A-0001-00000005** $ 1.260,00. En la tabla aparece "Pendiente" (F4). |
| 27 | F3 §49 | Imputar 400, sumar 200 y 660 a otra deuda | OK | El sistema manda el acumulado (`{51:400}` → `{51:600}` → `{51:600,54:660}`). Pasa a Parcial (saldo 860) y después a aplicado; los saldos bajan una vez. |
| 28 | F3 §49 | El mismo `PUT` repetido | OK | 200, sin duplicar (aplicado 1.260, saldo 0; los saldos de las deudas no cambiaron). |
| 29 | F3 §49 | Excederse, bajar una aplicación ya hecha, deuda de otro cliente | OK | 409 "El importe imputado supera el saldo disponible del comprobante."; 409 "Las imputaciones del comprobante cambiaron. Volvé a abrirlo para actualizar los importes."; el de otro cliente, con el recibo (fila 32). |
| 30 | F4 §52 | Recibo sin imputar $ 1.000 | OK | **REC-X-0002-00000005**, "Saldo sin imputar: $ 1.000,00", concepto "Cobranza sin imputación". En la tabla, "Pendiente" (F4). |
| 31 | F4 §52 | Imputar 400, 200 más y 400 a otra deuda | OK | "Recibo imputado." las tres veces, con el acumulado. |
| 32 | F4 §52 | Rechazos: deuda de otro cliente, fecha anterior, exceso | OK | 400 "Uno de los comprobantes de deuda no está emitido o no corresponde al cliente."; 400 "La fecha de imputación no puede ser anterior a la emisión del comprobante."; 409 de saldo. |
| 33 | F4 §52 | Editar la referencia de un recibo imputado | OK | "Recibo REC-X-0002-00000005 guardado."; fechas iguales (prueba débil: todo es del 28/10). |
| 34 | F4 §52 | Anular un recibo con imputaciones | FALLA | La confirmación se entiende ("…los comprobantes que cancelaba vuelven a tener saldo pendiente. No se puede deshacer.", motivo obligatorio). "Recibo anulado." y el FC y el D recuperan $ 600 y $ 400. Pero el recibo anulado ofrece **"Eliminar recibo" habilitado** (F5). |
| 35 | F4 §52 | Imputar desde dos pestañas a la vez | NO PROBADO | No quedó ningún crédito ni recibo propio con saldo (el REC-X-0002-00000003, de otra prueba, no se tocó). |
| 36 | F4 §52 | Usuario con `REC_EMITIR` sin `NC_EMITIR` | NO PROBADO | Hace falta armar permisos de cuenta corriente para un grupo. |
| 37 | F5 §53 | Débito vinculado | OK | **D-A-0001-00000004** "Recargo por pago fuera de término" $ 5.000, vinculado al FC-7: el FC no cambia (saldo $ 49.400); el detalle dice "Comprobante relacionado: FC-A-0001-00000007". PDF: NO PROBADO. |
| 38 | F5 §53 | Vínculos inválidos desde la API | OK | A un crédito y a otro cliente: 409 "Seleccioná un comprobante interno de deuda emitido del mismo cliente."; fecha anterior: 409 "La fecha del débito no puede ser anterior a la emisión del comprobante relacionado.". |
| 39 | F5 §53 | El selector con muchos comprobantes | NO PROBADO | El cliente tiene 4; ofrece también los ya cancelados (M4). |
| 40 | F6 §54 | "Cobranza sin imputación" con tilde | OK | En la tabla. En Ver recibo no se muestra el concepto; PDF y Excel: NO PROBADO. |
| 41 | F7 §45 | El sobre después de Ver PDF y el pie de Ver PDF sin el envío | OK | En todas las filas mirados; el formulario no muestra el perfil SMTP, sugiere el e-mail del cliente y no muestra "Incluir proforma" en un comprobante sin proforma. Confirmación: "¿Enviar el comprobante por e-mail?" / "Se enviará a integraanalistas@gmail.com con el comprobante adjunto.". |
| 42 | F7 §45 | Enviar el FC-7 a la casilla de prueba | FALLA | Conocida (F2 de la ronda 1): dentro del modal, "No se pudo leer la contraseña del perfil SMTP. Volvé a guardarla en Configuración > Gestionar e-mail."; conserva el destinatario. Afecta también al perfil de Facturación. |
| 43 | F7 §50 | "Incluir proforma" | NO PROBADO | No se llegó a emitir el comprobante de la proforma. |
| 44 | F8 §51 | Orden de las columnas | NO PROBADO | Queda para la parte D (ronda 5). |
| 45 | F9 | Comprobantes sin relacionar | OK | Aparecen las deudas con saldo y el recibo con saldo; el crédito y los recibos agotados o anulados no. |
| 46 | F10 | Botones de las filas | FALLA | Orden bien (Ver detalle · Editar · Ver PDF · Enviar · [Imputar] · Anular). Pero en C-4 y C-5 (créditos internos aplicados) **Imputar no aparece** (F2); en los créditos, Anular dice "se corrige con una nota de crédito" (F6). |
| 47 | G1 §46 | Registrar borrador y traer el viaje | OK | Período 01/07–31/07/2026: "Se agregó 1 viaje. Atención: 1 viaje entregado no tiene evidencia adjunta (recomendado): #5." Total $ 598.064,28. "Borrador guardado.". La fecha figura 29/10/2026 (eran las 22:08: §2, hora UTC). |
| 48 | G1 §46 | Generar la proforma | FALLA | Quedó **PF-00000005**, pero se generó al primer clic, sin confirmación (F1). |
| 49 | G1 §46 | Marcar aceptada | OK | "¿Marcar la proforma PF-00000005 como aceptada?" / "Queda lista para emitir la factura. No vuelve a Generada." → "Proforma aceptada.". |
| 50 | G1 §46 | Emitir el comprobante desde la proforma (FC preseleccionado) | NO PROBADO | Corte: FC ya era FI (cambio de Facu) y el modal preseleccionaba D. Se canceló sin emitir. |
| 51 | G1 §46 | Anular con el crédito cancelatorio (elegir entre C y CR) | NO PROBADO | Corte. |
| 52 | G2 [cruce] | Proforma con un viaje Sin carga | NO PROBADO | No hay viajes Sin carga (ronda 2), decidido por Rocío. |
| 53 | G3 §50 | Envío de proforma deshabilitado en borradores y anuladas | OK | "No se puede enviar la proforma: todavía es un borrador" y "No se puede enviar la proforma: está anulada" (PF-2). |
| 54 | G3 §50 | Enviar una proforma y el rechazo para un usuario sin acceso | NO PROBADO | Corte. |
| 55 | G4 | Proforma de Rukas | NO PROBADO | Corte. |
| 56 | G5 | Ranking y tableros | NO PROBADO | Corte. |
| 57 | P1 §29 | Ver, Editar y Registrar recibo | OK | "Ver recibo REC-X-0002-00000005" solo con Cerrar; "Editar recibo REC-X-0002-00000005" (sin " · ") con Cancelar · Guardar; Registrar recibo después de Ver recibo: limpio, Cancelar · Emitir recibo. Ver DS4. |
| 58 | P2 §38 | Proforma de Rukas con el adicional | NO PROBADO | Corte. |
| 59 | P3 [cruce] | Sin carga y Cancelado en la facturación | NO PROBADO | No hay viajes de prueba (ronda 2). |

## Fallas (la más grave primero)

### F1 — "Generar proforma" consume el número sin confirmación
- Gravedad: **Media**. Consume un número de la secuencia `PF-` (no se recupera) con un solo clic.
- Dónde: Gestionar proformas → Editar proforma (borrador) → "Generar proforma".
- Pasos para reproducir:
  1. Registrar un borrador con un viaje y guardarlo.
  2. Editarlo.
  3. Tocar "Generar proforma".
- Esperado: confirmación "¿Generar la proforma?" que diga que consume un número (§5.2 del design system: "generar proforma (consume un número)").
- Obtenido: PF-00000005 generada directamente.

### F2 — "Imputar crédito" desaparece en los créditos internos aplicados
- Gravedad: **Media** (design system y `AGENTS.md`).
- Dónde: Gestionar cuenta corriente, filas de C-A-0001-00000004 y C-A-0001-00000005 (aplicados por completo).
- Esperado: Imputar deshabilitado con "No se puede imputar el crédito: ya está aplicado por completo", como en el recibo REC-X-0002-00000004 y en el cancelatorio C-A-0001-00000002 ("…: ya cancela otro comprobante"). La regla: "En créditos internos y recibos sin saldo, anulados o cancelatorios, permanece deshabilitada con el motivo."
- Obtenido: la acción no está.

### F3 — En Registrar recibo, tildar una deuda pisa el importe escrito
- Gravedad: **Media**. Si no se mira el importe antes de emitir, el recibo sale por el saldo de la deuda y no por lo que se cobró.
- Dónde: Registrar recibo → Imputación a comprobantes.
- Pasos para reproducir:
  1. Cliente Logística Pampeana.
  2. Importe $ 50.000.
  3. Tildar el FC-A-0001-00000007 (saldo $ 121.000).
- Esperado: "Aplicar" sugiere hasta el importe del recibo ($ 50.000) y el importe se conserva (la §52 dice que no se borra el importe ingresado).
- Obtenido: "Aplicar" pasa a $ 121.000 y el importe del recibo a **$ 121.000**. Al corregir "Aplicar" a $ 50.000, el importe acompaña.

### F4 — Créditos y recibos con saldo aparecen como "Pendiente"
- Gravedad: **Baja**.
- Dónde: Gestionar cuenta corriente, columna Estado.
- Obtenido: C-A-0001-00000005 y REC-X-0002-00000005, sin aplicar, figuran "Pendiente", que es el estado rojo de una deuda (§4.1).
- Esperado: "Sin aplicar" / "Parcialmente aplicado" / "Aplicado" (§49; "Comprobantes sin relacionar" ya dice "Parcialmente imputado").

### F5 — Un recibo anulado ofrece "Eliminar recibo"
- Gravedad: **Media**: borrar un documento anulado le quita trazabilidad.
- Dónde: fila de REC-X-0002-00000005 (anulado).
- Obtenido: Editar, Enviar e Imputar deshabilitados con "…: está anulado", pero "Eliminar recibo" habilitado. No se tocó.
- Esperado: definirlo. Si un recibo anulado no se puede borrar, deshabilitado con el motivo.

### F6 — Motivo de Anular en un crédito: "se corrige con una nota de crédito"
- Gravedad: **Baja**.
- Dónde: filas de C-4, C-5, C-2 y también D-4.
- Obtenido: "No se puede anular el comprobante: se corrige con una nota de crédito". En un crédito no tiene sentido, y NC no está configurado (el crédito interno es C).
- Esperado: un motivo propio de cada tipo, o el nombre del tipo de crédito configurado.

## Design system
| # | Pantalla | Punto | Qué se ve | Qué pide la regla |
|---|---|---|---|---|
| DS1 | Gestionar tipos de comprobante → Numeradores | 7 (§6.3) | Guardar vacío: "Completá el nombre." sin "Revisá los campos marcados." (la tarjeta de Tipos sí lo muestra). | El aviso arriba en todos los formularios. |
| DS2 | Gestionar tipos de comprobante → Tipos | 5 (§5.1) | El rechazo de la API por un campo ("Las notas de crédito y los recibos tienen que generar crédito.") sale como aviso suelto arriba a la derecha y la pantalla no lo valida antes. | El error de un campo, debajo del campo. |
| DS3 | Cuenta corriente → Emitir comprobante directo, crédito y débito | 7 (§6.3) | Emitir arranca deshabilitado y con el formulario vacío no marca ningún campo ni muestra "Revisá los campos marcados." (solo el texto fijo "Completá los datos para emitir el comprobante."). | "Guardar siempre habilitado"; los campos con problema en rojo y el aviso arriba. |
| DS4 | Ver comprobante / Ver recibo | 4 y 7 (§6.2, §6.3) | Los datos en campos deshabilitados. En Ver recibo se leen las opciones de "Forma" y las columnas "Seleccionar" y "Aplicar". | El detalle con `.sgtl-dato` (texto); nunca campos deshabilitados. |
| DS5 | Emitir comprobante / recibo | 7 (§6.3) | "N° comprobante" en un campo de solo lectura. | Lo que no se edita, como texto. |
| DS6 | Emitir crédito / Débito sin tipos activos | 4 (§6.2) | Emitir deshabilitado sin globito; el motivo va en un aviso arriba. | Un botón del pie que no se puede usar lleva el globito con "No se puede emitir el crédito: …". |
| DS7 | Registrar proforma | 7 (§6.3) | Forma de pago, Plazo de pago, Validez, Observaciones y Otros impuestos con etiquetas sin `for`. | `form-label` con `for`. |
| DS8 | Gestionar proformas, filas facturadas | 1 (§1.4) | El siguiente paso dice cosas distintas: PF-4 "No se puede emitir el comprobante: ya se emitió FC-A-0001-00000006"; PF-1 y PF-3 "No se puede marcar como aceptada: la proforma está facturada". | En el lugar del siguiente paso, la acción de su ícono ("No se puede emitir el comprobante: ya se emitió …"). |

## Mejoras sugeridas
- **M1. Anular recibo:** la confirmación podría nombrar qué recupera saldo ("El FC-A-0001-00000007 recupera $ 600,00 y el D-A-0001-00000003, $ 400,00.").
- **M2. Importe en 0:** marcarlo en la pantalla al salir del campo (crédito, débito, comprobante directo), no solo en la API.
- **M3. Editar recibo deja cambiar la sucursal** de un recibo ya emitido (REC-X-0002-…). Revisar si debe ser un dato fijo.
- **M4. "Comprobante interno relacionado" (Emitir Débito):**
  - Hoy ofrece todas las deudas del cliente, también las canceladas, sin buscador.
  - Propuesta: con muchas, usar el buscador compartido (como cliente y chofer).
- **M5. Marcar aceptada:** dice "Queda lista para emitir la factura." → "Queda lista para emitir el comprobante." (el tipo puede ser FC, D u otro).
- **M6. Hora en UTC (§2):** la proforma registrada a las 22:08 figura con fecha 29/10/2026. A la noche, los documentos toman la fecha de mañana.
- **M7. API, coherencia del error:** "La fecha de imputación no puede ser anterior…" sale con la clave `Message`; los demás errores de la misma llamada usan `error`.
- **M8. distribuidora-powerful S.A.:** tiene como e-mail la casilla personal de alguien del equipo y un CUIT armado con un DNI real. Cualquier envío de sus documentos le llegaría a esa persona. Conviene cambiarlo en la limpieza (§41, punto 21).
- **M9. Coordinación:** la ronda 3 cambia la configuración compartida. Esta vez Facu renombraba siglas a la misma hora. Conviene acordar una franja sin cambios de configuración mientras se prueba.

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre / número | Qué se hizo |
|---|---|---|---|---|
| Gestionar tipos de comprobante | FACTURACION_NUMERADORES | 5 | Numerador CR | Alta (último 0). Inactivado y vuelto a activar. |
| Gestionar tipos de comprobante | FACTURACION_TIPOS_COMPROBANTE | 9 | CR A "Crédito comercial" (Crédito, 0001, Numerador CR) | Alta. Sin comprobantes. |
| Gestionar tipos de comprobante | FACTURACION_TIPOS_COMPROBANTE | 10 | CR B (0003, Numerador CR) | Alta. Sin comprobantes. Por esta relación, la sucursal 0003 "caja 2" ya no ofrece Eliminar. |
| Cuenta corriente (cliente 6) | COMPROBANTES | 51 | FC-A-0001-00000007 | $ 121.000 "Servicio de transporte octubre 2026". Saldo final $ 49.400. |
| Cuenta corriente (cliente 6) | COMPROBANTES | 52 | REC-X-0002-00000004 | $ 50.000 TRF 000452, aplicado al FC-7. |
| Cuenta corriente (cliente 6) | COMPROBANTES | 53 | C-A-0001-00000004 | $ 21.000 "Bonificación por demora en la entrega", aplicado al FC-7. |
| Cuenta corriente (cliente 6) | COMPROBANTES | 54 | D-A-0001-00000003 | $ 10.000 "Gastos de estadía". Saldo final $ 9.340. |
| Cuenta corriente (cliente 6) | COMPROBANTES | 55 | C-A-0001-00000005 | $ 1.260 sin imputar "Ajuste por diferencia de tarifa"; aplicado $ 600 al FC-7 y $ 660 al D-3. |
| Cuenta corriente (cliente 6) | COMPROBANTES | 56 | REC-X-0002-00000005 | $ 1.000 sin imputar (TRF 000498 BNA); imputado y después **anulado** ("Transferencia rechazada por el banco"). |
| Cuenta corriente (cliente 6) | COMPROBANTES | 57 | D-A-0001-00000004 | $ 5.000 "Recargo por pago fuera de término", vinculado al FC-7. |
| Cuenta corriente | (historial de envíos) | — | FC-A-0001-00000007 | Un intento de envío a integraanalistas@gmail.com que falló (SMTP). |
| Gestionar proformas | PROFORMAS / PROFORMAS_VIAJES | 60 | PF-00000005, distribuidora-powerful, $ 598.064,28 | Borrador → Generada → **Aceptada**, sin comprobante. **El viaje #5 queda reservado en esa proforma.** |

Logística Pampeana ya tenía, de otra prueba del 27/10: FC-A-0001-00000004 "**Comprobante interno de prueba**", D-A-0001-00000002 y REC-X-0002-00000003 (saldo $ 92.250). No se tocaron; los anoto para la limpieza.

### Configuración de facturación, antes y después
| Elemento | Antes (19:10, al empezar) | Después (22:15) |
|---|---|---|
| Sucursales | 0001 Administración, 0002 Caja central, 0003 "caja 2" (con Eliminar) | Iguales y activas; 0003 sin Eliminar (la usa CR B) |
| Numerador C / D / F / REC | 3 / 2 / 6 / 3 | 5 / 4 / 7 / 5 (por las emisiones) |
| Numerador CR | — | Nuevo, 0, activo |
| Tipos C A / C B | Activos | Activos (inactivados y reactivados a las ~20:30). En el medio, **Facu** los renombró C → CA → CI → C |
| Tipos D A / D B | Activos | Activos (inactivados y reactivados a las ~20:30) |
| Tipos FC A / FC B | Activos | Activos, pero ahora **FI A / FI B**: cambio de **FGODOY** a las 21:42, no de esta prueba |
| Tipo REC X | Activo | Igual |
| Tipos CR A / CR B | — | Nuevos, activos, no electrónicos |

## Limpieza propuesta (NO ejecutada)
**Por pantalla, con el OK de Rocío (recomendado):**
1. Gestionar proformas → PF-00000005 → "Anular proforma", para liberar el viaje #5 (la numeración PF ya se consumió).
2. Gestionar tipos de comprobante → Eliminar CR B y CR A (no tienen relaciones) y después el Numerador CR.
3. Pedirle a Facu que deje FC como estaba (FI → FC), si su cambio era de prueba.

**Comprobantes emitidos (IDs 51 a 57):** consumieron números de las secuencias C, D, F y REC. Borrarlos deja huecos y toca movimientos, aplicaciones y formas de pago. Propongo decidir con Facu si se dejan como datos de demo o se borran. Para mirarlos antes (solo lectura):

```sql
SELECT c.Comprobante_ID, c.Tipo, c.NumeroCorrelativo, c.Estado, c.FechaEmision, c.ClienteID
FROM dbo.COMPROBANTES c
WHERE c.Comprobante_ID BETWEEN 51 AND 57 AND c.ClienteID = 6;

SELECT a.Aplicacion_ID, a.ComprobanteCreditoID, a.ComprobanteDeudaID, a.Importe, a.Vigente
FROM dbo.CUENTA_CORRIENTE_APLICACIONES a
WHERE a.ComprobanteCreditoID BETWEEN 51 AND 57 OR a.ComprobanteDeudaID BETWEEN 51 AND 57;

SELECT m.Movimiento_ID, m.ComprobanteID, m.Tipo, m.Clase, m.Impacto, m.Importe
FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS m
WHERE m.ComprobanteID BETWEEN 51 AND 57;
```

## Qué falta de la ronda 3
- **E:** cambiar la sigla y la letra con historia (punto 8), conflictos (9), Eliminar sin relaciones y el rechazo de la API (10), Electrónico (11) y E4 (12). Conviene hacerlos cuando Facu termine y FC vuelva a ser FC.
- **F:** ranking y tablero (20), sucursal inactiva (19), dos pestañas (35), permisos REC/NC (36), PDF y Excel del concepto (40) y el orden (44, ronda 5).
- **G:** emitir y anular desde la PF-00000005 (50, 51), envío de proformas (54), Rukas (55) y ranking (56). G2 y P3, con la ronda 2.
- **P2:** proforma de Rukas con el adicional.
