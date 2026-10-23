# Relevamiento de los motivos de los botones deshabilitados — 23/10/2026

Rocío notó que los globitos de los botones deshabilitados (los que dicen por qué no se puede hacer una acción) estaban
escritos de maneras distintas en cada pantalla, y que algunos ni siquiera decían qué acción estaba bloqueada
("Primero generá la proforma" en el botón de emitir factura). Este documento junta lo que había, las opciones que se
miraron y cómo quedó cada texto. **La regla vigente está en el §1.4 de `docs/design-system/03-decisiones.md`.**

**Método:** búsqueda en el código de todos los `motivo` de `SGTL.botonFila`, de los `span.sgtl-envoltura-deshabilitado`
armados a mano y de las tarjetas de Cambiar estado (`SGTL.opcionesEstado`). Los mensajes que devuelve la API al
guardar no entran: son avisos con punto, no globitos.

---

## 1. Lo que había: 28 textos, seis formas

| Forma | Ejemplos | Qué fallaba |
|---|---|---|
| "Solo se…" (la regla general) | "Solo se editan los borradores" · "Solo se eliminan viajes en estado Registrado" · "Solo se editan presupuestos pendientes" · "Solo se editan los recibos" | Decía la regla, no qué le pasaba a esa fila; "Registrado" con mayúscula en medio del texto |
| "No es posible…" | "No es posible eliminar un chofer activo" (choferes y camiones) | El único con ese tono |
| "Primero…", sin la acción | "Primero generá la proforma" · "Primero marcala como aceptada en Gestionar proformas" · "Primero marcalo como aceptado" · "Primero elegí el Excel de Rukas" | No decía para qué; en el siguiente paso de proformas, el lector de pantalla tampoco nombraba la acción |
| Problema + consecuencia, en distinto orden | "Viaje facturado: para corregirlo, emití…" · "Está en la proforma X: para modificarlo, anulá la proforma" · "Se generó desde el presupuesto #12: no se puede eliminar" · "El recibo está anulado: no se puede editar" | Cada uno ordenaba distinto y algunos mandaban a hacer algo con consecuencias (anular, emitir una nota de crédito) |
| Solo el estado | "Facturada: FAC-00000012" · "Proforma anulada" · "Sin pasos pendientes" · "Ya se generó el viaje #31" | No decía qué acción estaba bloqueada |
| Permiso | "No tenés permiso para editar clientes" | — |

## 2. Opciones que se miraron

1. **"Para {acción}, {qué hacer}" / "No se puede {acción}: {por qué}".** Descartada: empuja a la persona a hacer algo
   (anular una proforma, emitir una nota de crédito) sin que sepa si es lo que quiere ni qué implica.
2. **Siempre "No se puede {acción}: {por qué}", con el arreglo después de punto y coma.** Larga y con el mismo problema.
3. **Dos renglones: la acción arriba y el motivo abajo.** Clara, pero cambia cómo se ven los globitos.
4. **"{Acción}: {por qué}" o "{Acción}: solo {cuándo se puede}".** No deja claro de entrada que no se va a poder.
5. **Elegida: "No se puede {acción} {sobre qué}: {qué le pasa a esta fila}".** Rocío quería algo corto, que al leerlo
   se sepa que no se puede y que diga qué acción es (muchos botones son solo un ícono). Toma lo bueno de "No es posible
   eliminar un chofer activo" y lo vuelve una plantilla que todos completan igual.

## 3. Cómo quedó cada texto

| Pantalla | Botón (cuándo) | Antes | Después |
|---|---|---|---|
| Gestionar choferes | Eliminar (activo) | No es posible eliminar un chofer activo | No se puede eliminar el chofer: está activo |
| Gestionar camiones | Eliminar (activo) | No es posible eliminar un camión activo | No se puede eliminar el camión: está activo |
| Gestionar viajes | Editar (facturado) | Viaje facturado: para corregirlo, emití la nota de crédito de su factura desde Cuenta corriente | No se puede editar el viaje: está facturado |
| Gestionar viajes | Cambiar estado (facturado) | *(el mismo)* | No se puede cambiar el estado: el viaje está facturado |
| Gestionar viajes | Eliminar (facturado) | *(el mismo)* | No se puede eliminar el viaje: está facturado |
| Gestionar viajes | Editar (en una proforma generada o aceptada) | Está en la proforma PF-…: para modificarlo, anulá la proforma | No se puede editar el viaje: está en la proforma PF-0001-00000012 |
| Gestionar viajes | Cambiar estado (en una proforma) | *(el mismo)* | No se puede cambiar el estado: el viaje está en la proforma PF-0001-00000012 |
| Gestionar viajes | Eliminar (en una proforma) | *(el mismo)* | No se puede eliminar el viaje: está en la proforma PF-0001-00000012 |
| Gestionar viajes | Eliminar (en un borrador de proforma) | Está en el borrador de proforma #23: sacalo del borrador para eliminarlo | No se puede eliminar el viaje: está en el borrador de proforma #23 |
| Gestionar viajes | Eliminar (vino de un presupuesto) | Se generó desde el presupuesto #12: no se puede eliminar | No se puede eliminar el viaje: viene del presupuesto #12 |
| Gestionar viajes | Eliminar (no está registrado) | Solo se eliminan viajes en estado Registrado | No se puede eliminar el viaje: está en viaje *(o "entregado", "listo para facturar")* |
| Gestionar viajes | Tarjeta "Listo para facturar" | Para marcarlo, editá el viaje y cargá: N° entrega Rukas. | No se puede marcar: falta cargar N° entrega Rukas. |
| Gestionar proformas | Editar (ya generada) | Solo se editan los borradores | No se puede editar la proforma: ya se generó *(anulada: "está anulada", reprueba del 23/10)* |
| Gestionar proformas | Siguiente paso (borrador) | Primero generá la proforma | No se puede marcar como aceptada: la proforma todavía es un borrador |
| Gestionar proformas | Siguiente paso (anulada) | Sin pasos pendientes | No se puede marcar como aceptada: la proforma está anulada |
| Gestionar y Listar proformas | Siguiente paso (facturada) | Facturada: FAC-00000012 | No se puede emitir la factura: ya se emitió FAC-00000012 |
| Gestionar proformas | Anular (anulada) | Proforma anulada | No se puede anular la proforma: ya está anulada |
| Gestionar proformas | Editar cliente (sin permiso) | No tenés permiso para editar clientes | No se puede editar el cliente: no tenés permiso |
| Listar proformas | Emitir factura (generada) | Primero marcala como aceptada en Gestionar proformas | No se puede emitir la factura: la proforma todavía no está aceptada |
| Listar proformas | Emitir factura (anulada) | Sin pasos pendientes | No se puede emitir la factura: la proforma está anulada |
| Proforma de Rukas | Generar proforma (sin Excel) | Primero elegí el Excel de Rukas | No se puede generar la proforma: falta elegir el Excel de Rukas |
| Proforma de Rukas | Generar proforma (con diferencias) | Para generar, resolvé las 3 diferencias | No se puede generar la proforma: hay 3 diferencias sin resolver |
| Proforma de Rukas | Generar proforma (Excel sin transportes) | El Excel no tiene transportes para generar | No se puede generar la proforma: el Excel no tiene transportes |
| Gestionar presupuestos | Editar (aceptado o rechazado) | Solo se editan presupuestos pendientes | No se puede editar el presupuesto: está aceptado *(o "rechazado")* |
| Gestionar presupuestos | Editar (con viaje) | Solo se editan presupuestos pendientes | No se puede editar el presupuesto: ya se generó el viaje #31 |
| Gestionar presupuestos | Cambiar estado (con viaje) | Ya se generó el viaje #31: el estado no cambia | No se puede cambiar el estado: ya se generó el viaje #31 |
| Gestionar presupuestos | Generar viaje (pendiente) | Primero marcalo como aceptado | No se puede generar el viaje: el presupuesto todavía no está aceptado |
| Gestionar presupuestos | Generar viaje (rechazado) | Primero marcalo como aceptado | No se puede generar el viaje: el presupuesto está rechazado |
| Gestionar presupuestos | Generar viaje (con viaje) | Ya se generó el viaje #31 | No se puede generar el viaje: ya existe el viaje #31 |
| Gestionar presupuestos | Eliminar (con viaje) | Ya tiene un viaje generado: no se puede eliminar | No se puede eliminar el presupuesto: ya se generó el viaje #31 |
| Gestionar cuenta corriente | Editar recibo (anulado) | El recibo está anulado: no se puede editar | No se puede editar el recibo: está anulado |
| Gestionar cuenta corriente | Editar recibo (factura, NC o ND) | Solo se editan los recibos | No se puede editar la factura: solo se editan los recibos *(o "la nota de crédito", "la nota de débito")* |
| Gestionar cuenta corriente | Ver PDF (comprobante sin tipo) | Este comprobante no tiene PDF | No se puede ver el PDF: este tipo de comprobante no tiene |
| Gestionar cuenta corriente | Anular recibo (factura) | Solo se anulan los recibos | No se puede anular la factura: se corrige con una nota de crédito |
| Gestionar cuenta corriente | Anular recibo (NC o ND) | Solo se anulan los recibos | No se puede anular la nota de crédito: solo se anulan los recibos *(o "la nota de débito")* |

**Lector de pantalla:** antes decía la acción y el motivo ("Eliminar: no es posible…"); como ahora el motivo ya nombra
la acción, lee el mismo texto del globito.

**Queda afuera:** los mensajes de la API al guardar (por ejemplo, "El viaje está facturado: para corregirlo emití la
nota de crédito…"). Son avisos, no globitos; si se quieren alinear, va aparte y hay que compilar la API.
