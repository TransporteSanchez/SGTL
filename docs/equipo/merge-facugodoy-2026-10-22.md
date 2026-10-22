# Merge de `facugodoy` en `rocionuvoli` — 22/10/2026

Resumen para Facu (y para el equipo) de cómo quedaron tus cuatro commits del 22/10 (`4edf511`, `634a097`,
`9ead168`, `e0779bf`) al juntarlos con lo último de `rocionuvoli`. Las decisiones las tomó Rocío; el detalle y
cómo probar está en `docs/PENDIENTES-SISTEMA.md` §21.

## Contexto

Tu rama arrancó en `e44f9b6` (21/10). Ese mismo 22/10 en `rocionuvoli` se aplicó el estilo visual nuevo y el
design system en todas las pantallas, también las tuyas (cuenta corriente, proformas, Gestionar facturación,
e-mail, presupuestos). Por eso chocaron 14 archivos. El criterio fue **tu lógica con nuestro diseño**: no se
descartó funcionalidad tuya; lo que cambió es cómo se ve y cómo se llama.

## Qué entró tal cual

- **Contraseñas con hash PBKDF2** (`Security/ContrasenasSeguras.cs`), que se convierten solas al iniciar sesión;
  login con un solo mensaje y solo usuarios activos; cambio de contraseña con el usuario del token; regla de 8 a 20
  caracteres en alta y edición de usuarios; `LoginController.cs` borrado.
- **Cuenta corriente:** Distribuir en recibo y nota de crédito, NC sobre varias facturas, montos 1.234,56 (las
  funciones nuevas de `sgtl-ui.js`), la vista completa del comprobante en solo lectura, la vista previa del PDF
  dentro de la aplicación y el arreglo del menú lateral en `components/sidebar.js`.
- **Presupuestos:** mapa de Google, km automáticos, no se guarda sin la distancia de Google, tiempo estimado
  automático.
- **Facturación:** un solo campo "Observaciones" en proformas propias y de Rukas; el PDF de la factura con sus
  proformas; la ventana "Emitir factura" desde una proforma, extra grande.
- **Scripts:** `database/seguridad/01` ya lo habías corrido; `database/cuenta-corriente/10` lo corrió Rocío el 22/10.
- **Tus pruebas de `tests/`:** pasan las 15 de JavaScript (algunas se adaptaron a lo de abajo); la de PowerShell
  (`contrasenas-seguras.test.ps1`) queda para la VM.

## Qué cambió respecto de tu versión, y por qué

| Tema | Tu versión | Cómo quedó | Por qué |
|---|---|---|---|
| Ventana de cambiar contraseña | Modal en `views/header.html` | La de `header.js` que ya estaba en `rocionuvoli`, adaptada a tu API (no manda el usuario; con 401 va al login) | Había dos ventanas para lo mismo; la nuestra sigue el design system y cierra la sesión al cambiar la contraseña, para confirmar que se sabe la nueva |
| Botones de la fila en cuenta corriente | De 3 a 5 según el tipo, escondiendo los que no aplican; Enviar antes de Editar; Imprimir con ícono de impresora | Cuatro en todas las filas: Ver detalle · Editar · Ver PDF · Anular o Eliminar. Lo que no se puede hacer queda gris con el motivo | Design system §1.4: mismos botones en el mismo lugar, en ese orden |
| Enviar por e-mail | Botón en la fila | En el pie de "Ver PDF", junto a Imprimir y Descargar | Igual que en presupuestos: se ve el PDF antes de mandarlo y la fila no tiene cinco botones |
| El ojo | Formulario completo en las facturas; detalle chico con un botón "Ver" en el resto | Tu vista completa en todas (el detalle chico queda solo para otros tipos) | Igual que en proformas: el ojo abre el documento |
| Textos de los botones y títulos | "Factura directa", "Recibo", "Registrar Recibo", "Registrar comprobante" | "Emitir factura directa", "Registrar recibo"; el título del modal igual al botón | §6.1: verbo en infinitivo; §9: mayúscula solo al principio |
| Mensajes nuevos | "la Factura", "la Nota de Crédito" | "la factura", "la nota de crédito" (también en la API) | §9; igual que el resto de los mensajes de tu API desde el 22/10 |
| Anular y eliminar recibo | `window.prompt` / `window.confirm` / `alert` | La confirmación del sistema, con el motivo dentro | §5.2: nunca `confirm()` ni `prompt()` |
| Fecha y hora en presupuestos | Fecha y hora en campos separados, la hora como texto HH:mm | Un solo campo con calendario, DD/MM/AAAA HH:MM | §7.1, igual que en viajes |
| Mensaje si Google no calcula la distancia | "Google no encontró… La distancia debe calcularse antes de guardar." | "Corregí la dirección en Orígenes y destinos para poder guardar el presupuesto." / "Probá de nuevo más tarde…" | Dice qué hacer en cada caso |
| Nombre de la pantalla de Configuración | "Tipos de comprobantes" | "Gestionar tipos de comprobante" | Tu idea (el nombre viejo no decía qué hace), con el verbo que pide §3.1 |
| Cuenta corriente: orden de los scripts | Truco de renombrar `#sidebar` alrededor de `app.js` | Mismo orden que el resto de las pantallas; tu arreglo de `sidebar.js` queda | Con tu arreglo y ese orden alcanza; se confirma en la VM |

## Después del merge (22/10)

- **`FacturasController`, `comprobantes/{id}`** (la API del PDF, que también usa tu vista en solo lectura) ahora devuelve
  `Letra` y `Sucursal`: la vista mostraba "—" porque esa consulta no las traía. La vista muestra además el % de IVA
  cuando todas las líneas tienen el mismo. El PDF no cambia.
- **Gestionar tipos de comprobante se mudó a Facturación** (última opción, pedido de Rocío). Sigue siendo solo de
  administradores. En Grupos y permisos, tu permiso "Facturación" (grupo Configuración) pasa al grupo Facturación como
  "Gestión de tipos de comprobante": la API lo renombra sola conservando las asignaciones (`GruposController`). Si el
  manual de usuario nombra la ruta vieja, hay que actualizarlo.
- **Proformas, Ver PDF:** el botón de PDF de Gestionar y Listar proformas (y el del formulario) ya no descarga directo:
  abre la vista previa "Ver PDF de la proforma …" con Cerrar · Imprimir · Descargar PDF, como presupuestos y cuenta
  corriente (`proforma-pdf.js`, `verProformaPDF`). El detalle de Listar proformas queda solo con Cerrar. Enviar la
  proforma por e-mail no existe todavía: lo vemos con vos.
- **Registrar recibo:** en el merge se había roto el id `reciboFacturas` (al pasar tus mensajes a minúscula) y no cargaban
  las facturas pendientes. Ya está corregido, con una prueba nueva (`tests/ids-de-pantallas.test.js`).

## Para tener en cuenta

- **Base compartida y contraseñas:** cada usuario que entra con la API nueva queda con hash y ya no entra con una
  API sin este merge. Fede tiene que traer el merge antes de seguir probando con esos usuarios.
- **El design system vale para todos los módulos.** Está en `docs/design-system/03-decisiones.md`; las funciones
  comunes, en `assets/static/js/sgtl-ui.js` (`window.SGTL`). `AGENTS.md`, que es lo que lee Codex, Cursor o
  Copilot al abrir el repo, pide seguirlo y trae una lista de control: antes de commitear, pedile a tu IA
  "Revisá los cambios con la lista de control de AGENTS.md".
- **Antes de empezar un tema, traé la rama actualizada**, así tu IA trabaja sobre las pantallas como están hoy.
- **Quedó para hablar con el equipo:** fechas previstas y reales en presupuestos y viajes (la hora del presupuesto no
  cambia el precio), y si en presupuestos se permite cargar los km a mano cuando Google falla, como en viajes.
