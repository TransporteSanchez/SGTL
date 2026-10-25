# Instructivo de pruebas de la tabla de tarifas (para la VM)

Para la sesión de Claude Code que prueba en la VM. Cubre todo lo de tarifas subido el 24 y 25/10 (§33 y §34 de
`docs/PENDIENTES-SISTEMA.md`): la tabla de tarifas, el importe de viajes y presupuestos, qué pasa al cambiar una tabla
(valores, clientes, fechas), lo que queda para revisar y los avisos. **Las reglas de la sesión, los datos de prueba y el
formato del reporte son los de `docs/equipo/PRUEBAS-VM-CLAUDE.md`: leelo antes.**

Además de si funciona, **se pide una mirada de usabilidad** (sección 1): cada texto, aviso y pantalla se evalúa como lo
leería quien carga las tarifas en la empresa.

Hay tres partes. La A y la B usan una tabla y un cliente de prueba (no cambian importes de datos reales). La C cambia por
un rato la tabla de agosto, que usan viajes reales, y al final se deshace: **antes de la parte C, preguntale a Rocío.**

---

## 0. Antes de empezar (lo hace Rocío)

- Los scripts de la §39 corridos (`tarifas/02`, `tarifas/05`, `tableros/01`, `hoja-de-ruta/01`, `costos/01`, `tarifas/03`
  y, después de elegir el tipo de los camiones, `tarifas/04`).
- La VM en `rocionuvoli` con el último commit, la API recompilada y Ctrl+F5.
- Usuarios para la parte C: un administrador, uno que solo tenga el permiso de presupuestos y uno que solo tenga los de
  facturación (proformas, facturas o cuenta corriente). El login lo hace Rocío.
- Facu y Fede avisados de que durante la parte C cambian importes de viajes de agosto en adelante.

Anotá los importes que ves antes de cambiar algo: al final tienen que volver a ser los mismos.

---

## 1. La mirada de usabilidad (en todos los pasos)

En cada pantalla, aviso, confirmación, globito y mensaje de error, preguntate:

1. **¿Se entiende a la primera?** Pensá en la persona administrativa que recibe el PDF de tarifas y lo carga, no en quien
   programó la pantalla. ¿Sabe qué pasó y qué tiene que hacer después?
2. **¿Es largo?** ¿Hay una frase que sobra, que repite lo que ya dice otro lugar de la pantalla o que se puede decir con
   menos palabras?
3. **¿Es confuso o ambiguo?** Palabras técnicas ("general", "propia", "banda", "vigente"), fechas o importes que no se
   sabe a qué se refieren, dos textos que se contradicen o que nombran lo mismo de dos formas.
4. **¿Falta algo?** Un dato que obliga a ir a otra pantalla para entender, o una acción que no se encuentra.
5. **¿Cumple el design system?** Contra `docs/design-system/03-decisiones.md` y la lista de control de `AGENTS.md`:
   voseo, mayúscula solo al principio, "km" en minúscula, botones y motivos de deshabilitado, avisos y confirmaciones.

Cada observación va en "Mejoras sugeridas" del reporte con: **dónde** (pantalla y paso), **el texto actual** (copiado
tal cual), **qué problema tiene** (cuál de los cinco puntos) y **una propuesta concreta** (el texto o el cambio que
harías). Ordenalas de la que más molesta a la que menos. No corrijas nada: solo proponé.

---

## 2. Parte A — La tabla de tarifas

Seguí también los pasos 2 a 10 de "Probar en la VM" de la §34 (el 0, el 1 y el 4b son la preparación de Rocío). Lo que
sigue suma las variantes.

**A1. La lista (Gestionar tarifas).**
- Texto de arriba, botón "Registrar tabla de tarifas" y las columnas Nombre · Clientes · Vigencia · Estado · Viajes.
- Clientes: la tabla para todos dice "Todos los clientes" sin más; la de un cliente, su nombre; la de varios, "N clientes"
  con un ícono ⓘ que al hacer clic lista las razones sociales.
- Vigencia: "Desde el …" en la más nueva y "Del … al …" en las anteriores. Estado: Vigente, Anterior o Próxima.
- Botones de la fila: Editar · Eliminar, con el motivo cuando Eliminar está deshabilitado.

**A2. Ver y editar "Tarifas a agosto 2026" (sin guardar).**
- La grilla como el PDF: por modelo (2018 o anterior · 2019 en adelante), las tarifas fijas por banda de km (hasta 130 km
  con 1ª y 2ª vuelta, hasta 190, hasta 250) y aparte el bloque del precio por km con su explicación.
- "Vigente hasta" calculado (no se escribe); "Modelos" como texto. Arriba, "La usan N viajes. Antes de guardar vas a ver
  qué importes cambian. Si es un aumento, registrá una tabla nueva."
- Cerrar sin guardar.

**A3. Registrar tabla de tarifas: validaciones (sin guardar).**
- Viene con los valores de la tabla más nueva, el nombre y la fecha vacíos y "Todos los clientes".
- Guardar vacío: "Revisá los campos marcados." y el error debajo de cada campo.
- Fecha 01/08/2026 con "Todos los clientes": "Ya hay una tabla para todos los clientes vigente desde el 01/08/2026…".
- "Solo algunos clientes" sin tildar ninguno: "Elegí al menos un cliente.".
- Bandas: la segunda menor o igual que la primera → "Tiene que ser mayor que 130 km." (y lo mismo con la tercera).
- Falso flete 0 o más de 100, horas de estadía 0, montos con letras: cada uno con su error.
- Valores fuera de orden (la 2ª vuelta más cara que la 1ª, o una banda más barata que la anterior): aviso amarillo
  "Revisá estos valores", que **no impide guardar** ("Si están bien, se puede guardar igual.").
- Cancelar.

**A4. Una tabla propia de prueba.**
- Gestionar clientes: registrar un cliente de prueba verosímil (anotá su ID).
- Registrar tabla de tarifas "Tarifas Logística Pampeana" (o el nombre de tu cliente), desde el 01/10/2026, "Solo algunos
  clientes" con ese cliente. Subí un valor que vayas a usar, por ejemplo Balancín, modelo 2019 en adelante, hasta 130 km
  1ª vuelta. Guardar.
- En la lista: la tabla nueva con el nombre del cliente; la de agosto sigue diciendo "Todos los clientes".

**A5. Viajes del cliente de prueba** (si para registrar un viaje hace falta asignar chofer, preguntale a Rocío: puede
mandar un WhatsApp). Registrá viajes en octubre y revisá el importe y su detalle (nombra la tabla, "km" en minúscula):
- Hasta 130 km, 1ª vuelta: el valor que subiste en A4.
- Otro viaje del mismo camión el mismo día, después: la 2ª vuelta.
- Hasta 190 km y hasta 250 km.
- Más de 250 km: la tarifa hasta 250 km más los km de más por el precio por km.
- Tarifa por km: todos los km por el precio por km.
- Un camión modelo 2018 o anterior y uno 2019 en adelante: cada uno con su fila.
- Falso flete y estadía (módulos): el falso flete reemplaza la tarifa por su porcentaje (60 %) y la estadía se suma.
- Un viaje del cliente de prueba con fecha de septiembre: sale con "Tarifas a agosto 2026" (la propia empieza en octubre).
- Un viaje de otro cliente en octubre: sale con "Tarifas a agosto 2026".
- Hacé la cuenta a mano con los valores de la tabla y compará.

**A6. Presupuesto del cliente de prueba.** Registrar uno con los mismos datos que un viaje de A5: el mismo importe base.
Dejalo pendiente (lo usa la parte B). Ver PDF sin enviar.

**A7. Proforma propia en borrador** con dos viajes del cliente de prueba: "Traer viajes" trae el importe guardado de cada
uno. Para que los traiga, esos dos viajes tienen que estar en Entregado (con la evidencia, que es obligatoria). **No la
generes** (consume un número). Dejala en borrador (la usa la parte B).

**A8. Eliminar.**
- "Tarifas a agosto 2026": Eliminar deshabilitado con "No se puede eliminar la tabla de tarifas: la usan N viajes".
- La tabla de prueba: deshabilitado (la usan los viajes de A5).
- Registrar una tabla para todos desde el 01/12/2026: en la lista, Estado "Próxima", y agosto pasa a "Del 01/08/2026 al
  30/11/2026". Eliminarla: la confirmación dice que no se puede deshacer y que "Tarifas a agosto 2026" queda como la tabla
  vigente hasta que se cargue la próxima. Después, agosto vuelve a "Desde el 01/08/2026".

---

## 3. Parte B — Cambios en la tabla de prueba (no toca datos reales)

**B1. Solo el nombre.** Editar la tabla de prueba, cambiarle el nombre y Guardar: guarda directo, sin confirmación. Volver
a ponerle el nombre.

**B2. Corregir un valor que usan los viajes.** Editar la tabla de prueba, cambiar el valor de A4 y Guardar:
- La confirmación: "¿Guardar los cambios de …?", una línea y la lista por grupos ("Se recalculan · N"…), con el viaje o
  presupuesto, el cliente debajo, el importe nuevo con el de antes en gris y "Qué hacer" ("—" si no hay nada).
- El viaje en el borrador de A7 dice "También en el borrador #N."; el presupuesto de A6, "Reenviáselo si ya se lo
  mandaste.".
- Guardar sin motivo: no deja. Con motivo: el aviso dice cuántos se recalcularon.
- Después: el viaje con el importe nuevo y su detalle; en el borrador, la línea y el total nuevos; Auditoría con el cambio
  de la tabla, el motivo y un registro por viaje y presupuesto recalculado.

**B3. El presupuesto para reenviar.**
- Gestionar presupuestos: el ícono rojo en la fila ("Cambió la tarifa: revisalo en Ver PDF.") y el aviso en Ver PDF.
- Dashboard (como administrador): arriba de todo, la tarjeta fija "Cambios de tarifa para revisar" con el presupuesto y
  su acceso directo ("Ver PDF para reenviarlo"). En Tableros → Facturación, la misma tarjeta arriba de "Costo por viaje",
  con la estrella deshabilitada y su motivo (no se puede quitar).
- Enviar el presupuesto por e-mail a una dirección `@example.com`: deja de aparecer en la tarjeta y en la fila. Si el
  envío falla por la configuración de e-mail de la VM, anotalo y seguí.

**B4. Cambiar para quién es (sin guardar).**
- Editar la tabla de prueba y tildar también un cliente real que tenga viajes en octubre → Guardar: **siempre** aparece la
  confirmación, aunque ningún importe cambie. Todos sus viajes de octubre están en la lista con 'Pasa a "…"' y el nombre
  de la tabla de prueba: los de importe igual, en "Cambian de tabla, mismo importe", y los demás donde corresponda.
  **Cancelar.**
- Editar "Tarifas a agosto 2026" → "Solo algunos clientes" → elegir uno: la ayuda dice 'Los demás clientes vuelven a
  "Tarifas a enero 2026".'. Guardar: los viajes de los demás clientes desde el 01/08 dicen 'Pasa a "Tarifas a enero
  2026".' con el importe de enero. **Cancelar** (si se guarda, se recalculan viajes reales).

**B5. Un cambio que deja viajes sin tabla.** Editar "Tarifas a enero 2026", "Vigente desde" 31/07/2026 → Guardar: no se
abre la confirmación y arriba dice "No se puede guardar la tabla de tarifas: N viajes quedarían sin tabla." con la lista
por cliente (cuántos y de qué fechas, hasta 5 clientes). Cerrar sin guardar. Si no aparece el error (no hay viajes de
enero a julio), guarda directo: volvé a poner 01/01/2026 y anotalo.

**B6. Cambiar la fecha de la tabla de prueba.** "Vigente desde" 15/10/2026 → Guardar: **todos** los viajes del cliente de
prueba del 1 al 14/10 están en la confirmación con 'Pasa a "Tarifas a agosto 2026".' (los de importe igual, en "Cambian
de tabla, mismo importe"). Guardar con motivo: el aviso dice cuántos pasaron a otra tabla con el mismo importe, y
Auditoría tiene un registro por cada uno ("Pasa a la tabla de tarifas … con el mismo importe … por …"). Después volver al
01/10/2026: los mismos viajes vuelven a la tabla de prueba, también con confirmación.

**B7. Deshacer.** Volver a poner el valor de A4 que tenía antes de B2: los viajes, el borrador y el presupuesto vuelven a
los importes que anotaste.

---

## 4. Parte C — Lo que ya vio el cliente (datos reales; preguntale a Rocío antes)

Sirve para ver los viajes que no se recalculan: los que están en una proforma generada o aceptada y los que ya están en un
comprobante. Se cambia un valor de agosto y al final se vuelve al original.

**C1. Elegir los casos.** Con Rocío, un viaje de agosto en adelante en una proforma generada o aceptada y uno en un
comprobante. Anotá su tipo de camión, modelo, banda de km, importe y el valor de agosto que usan.

**C2. Cambiar el valor.** Editar "Tarifas a agosto 2026", subir ese valor (por ejemplo, $ 1.000 más) y Guardar:
- En la confirmación, esos dos en "No cambian: quedan para revisar", con "Anulá PF-… y generala de nuevo." y "Nota de
  débito sobre FAC-…."; los que no están en documentos enviados, en "Se recalculan".
- Motivo: "Prueba de cambios de tarifa (se deshace)". Guardar.

**C3. Dónde se ve lo que quedó para revisar.**
- Dashboard y Tableros → Facturación: la tarjeta con las dos filas y sus accesos ("Ver la proforma para anularla", "Ver
  detalle del viaje", "Marcar como resuelto").
- Gestionar viajes: el ícono del estado en rojo con "Cambió la tarifa: revisá el detalle del viaje." y el aviso en el
  detalle ("Cambió la tarifa: $ antes → $ nuevo" y qué hacer).
- Gestionar proformas (facturación): el ícono en la fila de la proforma y, en su detalle, el aviso con el botón "Anular
  proforma". **No anules la proforma.**
- "Marcar como resuelto" en el del comprobante: pide cómo se resolvió; con el texto, deja de aparecer.

**C4. Cada uno ve lo suyo.** Con el usuario que solo tiene presupuestos: la tarjeta no muestra la proforma ni el
comprobante (si no le queda nada para revisar, la tarjeta no aparece). Con el de facturación: sí los muestra, y no ve
presupuestos.

**C5. Otro cambio encima.** Editar agosto y poner otro valor distinto del original: el viaje de la proforma no se repite
en la tarjeta y el "antes" sigue siendo el importe original.

**C6. Volver al original.** Poner el valor original de agosto (mismo motivo): los viajes recalculados vuelven a los
importes que anotaste y lo que quedaba para revisar desaparece de la tarjeta, de los íconos y de los avisos.

---

## 5. Al terminar

- Todo como al empezar: agosto y enero con sus valores y fechas originales, sin tablas "Próxima" de prueba, la proforma
  de A7 en borrador y nada pendiente en la tarjeta (salvo lo que Rocío decida dejar).
- La tabla de prueba no se puede eliminar mientras la usen los viajes de A5: dejá todo en la lista de datos creados y en
  el SQL de limpieza propuesto (sin ejecutar), en orden: viajes y líneas del borrador, borrador, presupuesto, tabla de
  prueba y cliente.
- El reporte, con el formato de `docs/equipo/PRUEBAS-VM-CLAUDE.md`, una fila por paso (A1 a C6) y la sección "Mejoras
  sugeridas" con la mirada de la sección 1.
