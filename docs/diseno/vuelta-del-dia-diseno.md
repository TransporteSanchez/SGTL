# Primer y segundo viaje del día (1ª y 2ª vuelta): cómo se aplica

Resumen de lo decidido con Rocío el 26 y 27/10/2026 (la última decisión, del 27/10: en los viajes que ya salieron,
el precio lo decide la persona). Seguimiento en la §43 de `docs/PENDIENTES-SISTEMA.md`. **Maqueta
aprobada por Rocío el 27/10**, con todos los lugares y los textos finales: `.claude/maquetas/tarifas/precio-para-revisar.html`
(`vuelta-del-dia.html` quedó de una versión anterior). Si un texto de este documento no coincide con la maqueta, manda
la maqueta. **Manda sobre lo anotado antes**
(la §34 y las versiones del 26/10 con "para revisar").

## 1. La regla

- **Qué es:** en la tabla de tarifas, la tarifa fija hasta la primera banda (130 km) tiene dos precios: el del **primer
  viaje del día** (1ª vuelta) y el del **segundo viaje del día** (2ª vuelta, más barato).
- **Entre qué viajes se cuenta:** los del **mismo cliente, con el mismo origen y el mismo destino, el mismo día** (el de
  la fecha de inicio). **No importa el camión**: dos viajes del mismo recorrido con camiones distintos son uno primero y
  otro segundo. A ese conjunto le decimos "el grupo".
- **Solo hay un primer viaje por grupo.** Los demás son segundo viaje.
- **El primero es el que empieza más temprano.** Única excepción: un presupuesto aceptado (o el viaje que generó)
  reserva su lugar, y los viajes que se cargan después se acomodan alrededor de él.
- **No aplica** a los viajes por km ni a los de más de 130 km: no tienen primero ni segundo, y no cuentan para el grupo.
- **La vuelta no se elige:** la calcula el sistema al guardar. En pantalla se dice en palabras ("Primer viaje del día",
  "Segundo viaje del día"); "1ª vuelta" y "2ª vuelta" quedan solo en la tabla de tarifas.

### Qué pasa con el precio de los otros viajes del grupo

Cuando un cambio (registrar, editar o eliminar un viaje, o aceptar, rechazar o eliminar un presupuesto) le cambia el
lugar a otro viaje del grupo, su precio sigue una de estas tres vías:

| Se actualiza solo | Decide la persona: actualizar o mantener el precio | Se corrige con su documento |
|---|---|---|
| Un viaje en Registrado que todavía no salió y no viene de un presupuesto | Un viaje que ya salió (En viaje, Entregado o Listo para facturar) y todavía no está en una proforma generada ni en un comprobante. Si está en un borrador, al actualizarlo se actualiza también su línea | Un viaje en una proforma generada o aceptada: anularla y generarla de nuevo |
| Un presupuesto pendiente: su precio se calcula al guardarlo (no reserva lugar) | Un presupuesto aceptado que todavía no generó su viaje: actualizar es volverlo a Pendiente, y después enviárselo de nuevo | Un viaje facturado: nota de crédito o de débito |
| — | El viaje generado desde un presupuesto aceptado | — |

**El tono de los avisos (Rocío, 27/10):** qué pasa, por qué no se cambia solo y qué hace falta, hablándole a la
persona: "Al guardar, el viaje #50 queda como segundo del día y le corresponde $ 407.089,00. Como está entregado no se
cambia solo, es necesario que revises ese viaje." Si cambia un precio que ve el cliente, también "es necesario que le
avises al cliente" (o "que se lo envíes de nuevo").

**Por qué decide la persona (Rocío, 27/10):** puede haber un acuerdo con el cliente ("es un buen cliente, le respetamos
el precio") o puede corresponder aplicar la tabla. Mientras no decide, el viaje queda con su precio de antes y con
**"Precio para revisar"**. Si actualiza, el sistema le recuerda que es necesario avisarle al cliente del cambio.

Los viajes de Rukas siguen la misma tabla: en Registrado y sin proforma de Rukas, se actualizan solos; en Listo para
facturar, ya están en una proforma de Rukas.

Todo queda en Auditoría: lo que se actualizó solo ("Pasa a segundo viaje del día: $ 581.492,00 → $ 407.089,00, porque
el viaje #51 empieza antes."), lo que actualizó la persona y lo que decidió mantener (con el motivo, si lo escribió).

## 2. Dónde se ve

- **Registrar y editar viaje, y Ver detalle del viaje:** el **bloque del grupo**, corto para entenderlo de un vistazo
  (Rocío, 27/10): el título "Viajes de este cliente y recorrido el miércoles 28/10/2026" y una fila por viaje o
  presupuesto aceptado, en orden, con el orden en un círculo ("1º", "2º"; el de este viaje en azul y la fila resaltada
  con una línea a la izquierda), quién es ("Este viaje", "Viaje #44", "Presupuesto #10") con, al lado, una etiqueta del
  design system con lo que le pasa ("Se actualiza" en azul, "Para revisar" en amarillo, o su estado, como "Aceptado") y
  la hora de inicio debajo, y el precio, con "antes $ …" o "le corresponde $ …" debajo si cambia. Sin camión ni hora de
  fin. Del ancho de lo que tiene (hasta unos 560 px, no todo el modal), y el aviso de abajo, del mismo ancho.
  **Aparece solo cuando hay otro viaje (o un presupuesto aceptado) del mismo cliente y recorrido ese día** (Rocío,
  27/10); si es el único, alcanza con la línea debajo de la tarifa. Se actualiza al cambiar el cliente, el recorrido o
  la fecha.
- **Registrar y editar presupuesto:** el mismo bloque.
- **Debajo de la tarifa**, una línea con la vuelta de este viaje y por qué.
- **Al lado del bloque, un aviso azul** con lo que va a cambiar en otro viaje al guardar.
- **En las confirmaciones** de eliminar un viaje y de aceptar, rechazar, volver a Pendiente o eliminar un presupuesto.
- **Después de guardar**, en el toast.
- **Antes de guardar, un aviso amarillo** si el cambio va a dejar otro viaje con "Precio para revisar".
- **"Precio para revisar"** (casos B1 a B3), hasta que la persona decide: el ícono rojo junto al estado en la fila, con
  un globito con título, qué pasa y, en gris, dónde se cambia (como los de Rukas: "Falta resolver antes de generar"); y
  un aviso amarillo en Editar y en Ver detalle, con el mismo título, qué pasó y los botones "Actualizar el precio" y
  "Mantener el precio".

Ejemplos con Balancín (3 ejes) 2019, de "Tarifas a agosto 2026": primer viaje $ 581.492,00; segundo viaje $ 407.089,00.

## 3. Casos normales

| # | Situación | Qué hace el sistema | Mensaje y dónde se ve | Qué puede hacer la persona |
|---|---|---|---|---|
| N1 | Se registra el único viaje de ese cliente y recorrido en el día | Va como primer viaje | Sin bloque (es el único). Debajo de la tarifa: "Se cobra como primer viaje del día." | Nada: guardar |
| N2 | Se registra otro viaje del mismo grupo, **más tarde** | Va como segundo viaje | Bloque con los dos. Debajo de la tarifa: "Se cobra como segundo viaje del día: ya está el viaje #44 a las 07:00 hs." | Nada: guardar |
| N3 | Se registra un viaje **más temprano** que el primero, que todavía no salió | Rotan: el nuevo pasa a ser el primero y el otro, el segundo (se actualiza su precio) | Aviso azul, antes de guardar: "Al guardar, el viaje #44 pasa a segundo viaje del día: $ 581.492,00 → $ 407.089,00." Toast: "Viaje registrado. El viaje #44 se actualizó a $ 407.089,00." | Guardar, cancelar o cambiar la hora |
| N4 | Se edita la hora, la fecha, el cliente o el recorrido de un viaje que no salió (por ejemplo, para rotar dos viajes del mismo recorrido) | Se acomodan el grupo de antes y el nuevo | El mismo aviso azul, con cada viaje que cambia. Toast: "Viaje guardado. …" | Guardar o cancelar |
| N5 | Se elimina el primer viaje y el segundo todavía no salió | El segundo pasa a ser el primero | Confirmación: "¿Eliminar el viaje #44? No se puede deshacer. El viaje #47 pasa a primer viaje del día: $ 407.089,00 → $ 581.492,00." | Eliminar o cancelar |
| N6 | Dos viajes del mismo grupo **a la misma hora** (con camiones distintos) | El primero es el que se registró antes (el número más bajo) | Bloque con los dos, uno primero y otro segundo | Si conviene al revés, cambiar la hora de uno |
| N7 | Se arma o se edita un **presupuesto pendiente** | Su precio sale con los viajes y presupuestos aceptados del grupo | Bloque en el presupuesto y la línea debajo de la tarifa, como en el viaje | Guardar y enviarlo |
| N8 | Se **acepta** un presupuesto y en el grupo hay un viaje que no salió y empieza antes | El presupuesto reserva su lugar con el precio aceptado; el otro viaje se acomoda | Confirmación de Cambiar estado: "Al aceptarlo, el viaje #51 pasa a segundo viaje del día: $ 581.492,00 → $ 407.089,00." | Aceptar o cancelar |
| N9 | Se **genera el viaje** de un presupuesto aceptado | El viaje ocupa el lugar que ya reservaba, con el precio aceptado | Nada nuevo (el lugar ya estaba reservado) | — |
| N10 | Se **rechaza**, se vuelve a Pendiente o se elimina un presupuesto aceptado que todavía no generó su viaje | Libera su lugar; los viajes del grupo que no salieron se acomodan | Confirmación: "Al rechazarlo, el viaje #51 pasa a primer viaje del día: $ 407.089,00 → $ 581.492,00." | Confirmar o cancelar |

## 4. Casos borde

| # | Situación | ¿Flujo normal? | Qué hace el sistema | Mensaje y dónde se ve | Qué puede hacer la persona |
|---|---|---|---|---|---|
| B1 | Se registra (o se mueve) un viaje **más temprano** que el primero, y el primero **ya salió**. Por ejemplo, se carga tarde un viaje de la mañana y el #50 ya se entregó | No: carga tardía | El nuevo pasa a ser el primero (sigue el orden de las fechas). El #50 queda con su precio de primer viaje y con **Precio para revisar** | Aviso amarillo, antes de guardar: "Al guardar, el viaje #50 queda como segundo del día y le corresponde $ 407.089,00. Como está entregado no se cambia solo, es necesario que revises ese viaje." Toast: "Viaje registrado. Es necesario que revises el precio del viaje #50." Después, en el #50, el ícono y el aviso (ver B2) | En el #50: **Actualizar el precio** o **Mantener el precio**. Si ya está en una proforma o facturado, se corrige con su documento |
| B1b | Lo mismo, pero el primero es un **presupuesto aceptado** (o el viaje que generó) | Sí | El presupuesto conserva su lugar (lo reservó): el nuevo va como **segundo** aunque salga antes | Debajo de la tarifa: "Se cobra como segundo viaje del día: el presupuesto #10 (aceptado) tiene el precio de primer viaje." | Guardar |
| B2 | Se elimina el primer viaje cuando el segundo **ya salió**. Por ejemplo, el #44 no se hizo, nadie lo eliminó hasta el viernes y el #47 ya se entregó | No: se corrige tarde | El #47 queda con su precio de segundo viaje y con **Precio para revisar** | Confirmación: "**¿Eliminar el viaje #44?** No se puede deshacer. Al viaje #47 le corresponde el precio de primer viaje ($ 581.492,00), porque ahora es el único del día. Como está entregado no se cambia solo, es necesario que revises ese viaje." En la fila del #47, el ícono rojo junto al estado, con el globito: "**Precio para revisar** · Le correspondería el precio de primer viaje ($ 581.492,00): se eliminó el viaje #44. · *Es necesario que lo revises en Ver detalle del viaje.*" En Editar y Ver detalle del #47, el aviso amarillo, corto (Rocío, 27/10): "**Precio para revisar** · Ahora es el único viaje del día de este cliente y recorrido: le corresponde $ 581.492,00 en lugar de $ 407.089,00. Como está entregado no se cambia solo, es necesario que lo revises." (lo de avisarle al cliente va en la confirmación y en el toast de "Actualizar el precio") | **Actualizar el precio:** confirmación "¿Actualizar el precio del viaje #47? Pasa de $ 407.089,00 a $ 581.492,00. Después es necesario que le avises al cliente del precio nuevo." y toast "Precio del viaje #47 actualizado a $ 581.492,00. Es necesario que le avises al cliente." **Mantener el precio:** confirmación "¿Mantener el precio del viaje #47? Queda en $ 407.089,00." con un motivo opcional (por ejemplo, "acuerdo con el cliente") y toast "Precio del viaje #47 mantenido." En los dos casos el aviso y el ícono se van. Si ya está en una proforma, el aviso no tiene botones y dice "Como está en la proforma PF-… no se cambia solo, es necesario que la anules, la generes de nuevo y se la envíes otra vez al cliente."; si está facturado, "Como está facturado en FAC-… no se cambia solo, es necesario emitir una nota de débito." |
| B3 | Un presupuesto aceptado (o su viaje) iba como **segundo** y se elimina el viaje que iba primero | No | Queda con el precio que aceptó el cliente y con **Precio para revisar** | Confirmación de eliminar: "**¿Eliminar el viaje #44?** No se puede deshacer. Al presupuesto #10 le corresponde el precio de primer viaje ($ 581.492,00), porque ahora es el único del día. Como está aceptado no se cambia solo, es necesario que revises ese presupuesto." En la fila del presupuesto (o de su viaje), el ícono rojo con "**Precio para revisar**", como en B2; en el detalle, el aviso amarillo | Presupuesto sin viaje: **Volver a Pendiente** (se recalcula con el precio de primer viaje; es necesario que se lo envíes de nuevo al cliente) o **Mantener el precio**. Su viaje: **Actualizar el precio** (después es necesario que le avises al cliente) o **Mantener el precio** |
| B4 | Se mueve a otro día o a otro recorrido un viaje que ya salió o el de un presupuesto | No | Conserva su precio; en el grupo nuevo, los demás siguen estas mismas reglas (puede pasar B1 o B1b) | Como en B1 | — |
| B5 | El **mismo camión** en dos viajes, o en un viaje y un presupuesto aceptado, con horarios que se superponen | No: error de carga | No deja guardar. Es otro control, aparte de la vuelta | Debajo de Camión, al elegirlo o al cambiar el horario: "Camión ocupado: viaje #45, de 08:00 hs a 11:30 hs." (o "presupuesto #10"; con la fecha, si es otro día) | Elegir otro camión o cambiar el horario |
| B6 | El **mismo chofer** en dos viajes que se superponen | No: error de carga | No deja guardar | Debajo de Chofer: "Chofer ocupado: viaje #45, de 08:00 hs a 11:30 hs." | Elegir otro chofer o cambiar el horario |
| B7 | Viaje por km o de más de 130 km | Sí | No tiene primero ni segundo y no cuenta para el grupo | Ni el bloque ni la línea de la vuelta | — |
| B8 | Viaje que empieza un día y termina al siguiente | Sí | Cuenta para el día en que empieza | — | — |
| B9 | Un tercer viaje (o más) del mismo grupo | Sí | Va como segundo viaje | Como N2 | — (a confirmar con Claudia) |
| B10 | Viajes guardados antes de este cambio: el sistema les calculó la vuelta **por camión** | Es una sola vez | Antes de cambiar el cálculo, una consulta de solo lectura muestra qué viajes tendrían otra vuelta con la regla nueva | Lo ve Rocío en SSMS | Rocío decide qué hacer con cada uno (los que ya vio el cliente no se tocan) |

## 5. Para confirmar con Claudia

- Si el tercer viaje del día (y los siguientes) se cobra como segundo.
- Si dos viajes del mismo recorrido con camiones de distinto tipo (otros valores en la tabla) se reparten igual el
  primero y el segundo.
- Si un viaje por km del mismo recorrido cuenta como "primero" para uno con tarifa fija (hoy, B7: no cuenta).

## 6. Qué cambia en el código

- `Tarifas/TarifarioCalculo.cs` y `Tarifas/TarifarioImpacto.cs`: el orden del grupo (cliente, origen, destino y día) en
  lugar de `ViajeAnteriorDelDia`, que hoy busca por camión.
- `Controllers/ViajesController.cs`: la vuelta al guardar, la rotación del grupo, el camión y el chofer ocupados,
  eliminar, "Actualizar el precio" y "Mantener el precio"; una consulta nueva con el grupo de un viaje. Dónde se guarda
  lo que queda "para revisar": a definir al hacerlo (probablemente con `TARIFARIO_REVISAR`, que ya tiene el importe de
  antes y el nuevo, y cómo se resolvió).
- `gestion-viajes.html` y `assets/static/js/viaje-detalle.js`: el bloque del grupo, el aviso azul, la línea de la
  tarifa, el aviso amarillo antes de guardar, y el ícono y el aviso de "Precio para revisar".
- Módulo de Facu (**avisarle antes**): `Controllers/PresupuestosController.cs` (la reserva, generar el viaje, cambiar
  estado y eliminar) y `assets/static/js/presupuestos.js` ("Vuelta del día" deja de ser una opción y aparece el bloque).
- `database/`: la consulta de solo lectura de B10. No hacen falta columnas nuevas (el viaje ya guarda `Vuelta`).
