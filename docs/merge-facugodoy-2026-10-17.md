# Merge de `facugodoy` en `rocionuvoli` — 17/10/2026

Resumen para Facu (y para el equipo) de cómo quedó la integración de su commit
`35894cc` ("mejoras de facturacion y cuenta corriente") con el trabajo de Rocío en Viajes / Rukas.
Las decisiones las tomó Rocío; el detalle de cada punto está en `PENDIENTES-SISTEMA.md` §9.

## Contexto

La rama `facugodoy` arrancó en `c40b518`, antes del flujo de Viajes (estados Registrado → Listo
para facturar / Entregado, reglas Rukas vs. directos, km con Google, WhatsApp). Varias diferencias
no eran decisiones distintas sino código que no estaba en tu rama. La idea fue conservar todo lo
tuyo y sumar las reglas de viajes, cambiando solo lo que hacía falta para que cierre el circuito.

## Qué entró tal cual

- Configuración de facturación (sucursales, numeradores, tipos de comprobante) — pantalla solo admin.
- Estado **Facturada** de la proforma al emitir la factura.
- Anulación de factura con **nota de crédito cancelatoria**.
- Reserva de viajes por proforma (`PROFORMAS_VIAJES`, índice único: un viaje en una sola proforma, también en borrador).
- Eliminar proformas en borrador, reportes de proformas, buscador predictivo de clientes, código postal,
  mejoras de cuenta corriente / recibos / comprobantes / listado / dashboard.
- Menú Configuración solo para administradores.
- Scripts `database/cuenta-corriente/04` a `09`: verificados en `sql-tesis` el 17/10 (04–08 ya estaban;
  se corrió el **09**, que también aplica el cambio de restricción del 02 en bases existentes).

## Qué cambió respecto de tu versión, y por qué

| Tema | Antes (tu versión) | Ahora | Por qué |
|---|---|---|---|
| **Cuándo un viaje queda "Facturado"** | No se tocaba el estado del viaje (en la versión de Rocío pasaba a Facturado al **generar** la proforma) | Pasa a **Facturado al emitir la factura**, en la misma transacción de `FacturasController` | "Facturado" significa factura emitida, igual que el "Facturada" de la proforma. Sin estado intermedio: mientras está en una proforma el viaje conserva su estado y la pertenencia sale de tu reserva |
| **Bloqueo del viaje** | Solo con factura vigente | Además, no se edita ni cambia de estado si está en una proforma **Generada o Aceptada**; no se elimina si está en cualquier proforma | Una vez generada, el importe del viaje ya está en un documento emitido. En borrador se puede seguir editando |
| **Grilla de viajes** | — | Muestra "En PF-xxxx" (dato de la reserva). "Facturada" se calcula en la misma consulta de la grilla | Tu versión consultaba la base una vez por cada viaje de la grilla |
| **Traer viajes** | Trae cualquier viaje del cliente no reservado | Además aplica las reglas de negocio: clientes con plataforma (Rukas) solo con remito y N° de transporte; directos solo Entregados; sin viajes facturados ni sin tarifa. Devuelve `{ lineas, advertencias }` y la pantalla muestra las advertencias | Reglas del relevamiento con Claudia (`CHECKLIST-OPERACION-VIAJES.md`) |
| **Generar** | Cliente, conceptos y total | Lo mismo + las mismas reglas de viajes (Rukas con números, directos Entregados, sin facturados). Origen y destino **no** son obligatorios | Cada línea de viaje ya tiene su recorrido |
| **Eliminar / anular proforma** | Eliminar (borrado físico) en Borrador **y Generada**; Anular deshabilitado | **Borrador → Eliminar**. **Generada o Aceptada sin factura → Anular** (queda "Anulada", conserva el número y libera los viajes). Facturada → nota de crédito | Una Generada ya tiene número PF y pudo enviarse al cliente: borrarla deja un hueco de numeración sin registro |
| **Nota de crédito cancelatoria** | La proforma seguía Facturada y los viajes reservados: **nunca se podían volver a facturar** | Desvincula la factura (`COMPROBANTES_PROFORMAS.Vigente = 0`, con usuario, fecha y motivo), pasa la proforma a **Anulada**, devuelve los viajes a Listo para facturar / Entregado y libera la reserva | Si una factura se anula por error de importe, los viajes tienen que poder ir en una proforma nueva |
| **Reservas** | Una proforma en cualquier estado reservaba sus viajes | Una proforma **Anulada** ya no reserva | Consecuencia de anular |
| **Período de la proforma** | "Fecha de Inicio / Fin" se guardaban en `FechaEmision` / `FechaVencimiento` | Se guardan en **`FechaDesde` / `FechaHasta`** (si faltan, la fecha del día). Emisión se completa al generar; vencimiento queda como vencimiento | La factura toma el vencimiento de la proforma como vencimiento sugerido: con el período ahí, una factura de septiembre emitida en octubre nacía vencida, y la proforma figuraba emitida el día 1 del período |
| **Estados de la proforma** | Borrador → Generada → Aceptada → Facturada (sin Enviada / Rechazada) | **Igual** (Rocío tenía Enviada y Rechazada; se quitaron) | Sin datos en esos estados; Generada ya representa "esperando respuesta" |
| **Obligatorios del borrador** | Ninguno | Solo **Cliente** | Sin cliente no se pueden traer ni reservar viajes |

## Datos a corregir

`database/viajes/01_facturado_solo_con_factura.sql`: los viajes que quedaron en "Facturado" por
proformas generadas **sin factura** vuelven a Listo para facturar / Entregado (siguen reservados por
su proforma). Corre primero en modo diagnóstico.

## Archivos tocados en la resolución

`ProformasController.cs`, `FacturasController.cs` (marcar viajes al facturar), `ComprobantesController.cs`
(nota de crédito libera proforma y viajes), `ViajesController.cs`, `ClientesController.cs`,
`gestion-facturacion.html`, `gestion-viajes.html`, `gestion-clientes.html` (combinado solo).
