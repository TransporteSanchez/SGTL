# Merge de `fedemontenegro` en `rocionuvoli` — 22/10/2026

Resumen para Fede (y para el equipo) de cómo quedó tu commit `1bd31d3` ("Correccion en codigo de area + campo
Nombre comercial Cliente"). Las decisiones las tomó Rocío; el detalle y cómo probar está en
`docs/PENDIENTES-SISTEMA.md` §22. No chocó con nada.

## Qué entró tal cual

- **Código de área de 4 dígitos** en `Services/WhatsApp/PhoneNumberHelper.cs`, con la lista de ENACOM y el área más
  larga primero, y el arreglo del "15" que se buscaba en cualquier parte del número.
- **Nombre comercial del cliente:** el campo en Gestionar clientes y en el detalle de Listar clientes, la API
  (`ClientesController.cs`) y que la proforma lo complete al elegir el cliente.
- **La columna en la base:** ya la habías creado.

## Qué cambió respecto de tu versión, y por qué

| Tema | Tu versión | Cómo quedó | Por qué |
|---|---|---|---|
| Script de la base | `database/09_nombre_comercial_clientes.sql` | `database/clientes/01_nombre_comercial_clientes.sql` (y el mensaje de la API que lo nombra) | Los scripts van en `database/<módulo>/NN_…`; el "09" se confundía con `database/cuenta-corriente/09_…` |
| Texto gris del campo | "Nombre de fantasía o marca comercial" | Ejemplo "Las Lomas" y, debajo, "Nombre de fantasía o marca, si es distinto de la razón social." | Design system §6.3: en el campo va un ejemplo; la instrucción, debajo |
| Abrir una proforma existente | Mostraba siempre el nombre comercial actual del cliente | Muestra el que quedó guardado en la proforma; el actual solo completa un borrador que no lo tiene | Una proforma generada tiene que verse igual que su PDF, aunque el cliente cambie de nombre |

## Para tener en cuenta

- **El design system vale para todos los módulos**, también WhatsApp. Si usás una IA (Codex, Cursor, Claude), lee sola
  `AGENTS.md` con la rama al día; antes de commitear, pedile "Revisá los cambios con la lista de control de AGENTS.md".
- **Contraseñas:** con el merge de Facu (`docs/equipo/merge-facugodoy-2026-10-22.md`) se guardan con hash. Un usuario que
  entra con la API nueva ya no entra con una versión vieja: traé la rama actualizada antes de probar.
- **Quedó pendiente:** que la auditoría registre los cambios de nombre comercial, código postal y tipo de cliente, que
  hoy se guardan con SQL directo y no quedan registrados.
