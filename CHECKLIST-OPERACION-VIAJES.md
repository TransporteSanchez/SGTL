# Checklist operativo — Gestión de viajes en SGTL

Guía corta para el equipo de la transportista. No hay API con Rukas: SGTL se mantiene **a mano**, con los datos que importan para el backoffice y para llegar a la proforma.

## Antes de empezar (una sola vez)

1. Ejecutar en SQL Server (base SGTL), en orden:
   - `WebApi_TransporteSanchez/06_viajes_estado_entrega.sql`
   - `WebApi_TransporteSanchez/07_clientes_tipo_y_evidencia.sql`
   - `WebApi_TransporteSanchez/08_viajes_num_transporte.sql`
2. En **Gestionar clientes**, revisar el **Tipo de cliente**:
   - `Con plataforma (Rukas)` → Quickfood / Marfrig (el script ya los marca si la razón social los nombra).
   - `Directo` → clientes sin sistema intermedio (valor por defecto).

---

## Clientes con plataforma (Quickfood / Marfrig + Rukas)

Rukas es del cliente: ahí se hacen la novedad, el cierre de reparto, el sobre, los adicionales y la conformidad. **SGTL no reemplaza nada de eso.** En SGTL solo queda el espejo del viaje para facturar.

| Paso | Dónde | Qué hacer |
|---|---|---|
| 1 | Rukas | Operar el viaje como siempre (novedad por WhatsApp o mesa, cierre de reparto, sobre). |
| 2 | SGTL · Gestión de viajes | Cuando el viaje está **planeado / con chofer asignado**: **Registrar viaje** (cliente, origen, destino, fechas, camión, chofer, tarifa). Los números se pueden dejar vacíos. |
| 3 | SGTL · Gestión de viajes | Cuando el camión carga en planta (en Rukas pasa a Despachados): editar el viaje y cargar **N° transporte SAP** y **Número de remito** (el del papel). |
| 4 | SGTL · Gestión de viajes | Cuando hay novedad de entrega en Rukas: cargar **N° entrega Rukas** (el # que pide el bot). |
| 5 | SGTL · Estado y entrega | Pasar el viaje a **Listo para facturar**. Opcional: resultado (Completa / Parcial / Rechazo) y fecha de entrega. |
| 6 | SGTL · Facturación | **Traer viajes** del cliente y período → revisar las advertencias (sin remito o transporte, sin tarifa, todavía en Registrado). |
| 7 | SGTL · Facturación | **Generar proforma** → los viajes incluidos pasan solos a **Facturado**. |

Reglas que aplica el sistema:

- Sin **N° transporte SAP**, **número de remito** y **N° entrega Rukas** el viaje no se puede marcar **Listo para facturar** (sí se puede guardar).
- Para buscar un viaje por lo que manda Marfrig, usar el filtro **N° remito / transporte / entrega**.
- Un viaje **Facturado** no se edita ni se elimina, y no se vuelve a traer a otra proforma.
- Si se **anula** la proforma, sus viajes vuelven a **Listo para facturar**.
- No hace falta reflejar en SGTL cada movimiento de Rukas (salidas, en viaje): solo lo necesario para facturar.

---

## Clientes directos (sin sistema intermedio)

Acá SGTL es el **único registro** del viaje, así que se sigue el viaje de punta a punta.

| Paso | Dónde | Qué hacer |
|---|---|---|
| 1 | SGTL · Gestión de viajes | **Registrar viaje** (mismos datos). El remito es opcional (si el cliente da uno, cargarlo). No se muestran N° transporte SAP ni N° entrega Rukas. |
| 2 | SGTL · Estado y entrega | Al salir: pasar a **En viaje**. |
| 3 | SGTL · Estado y entrega | Al entregar: pasar a **Entregado** con **resultado** y **fecha de entrega** (obligatorios) y adjuntar **evidencia** (foto o PDF del remito firmado / conforme; recomendado). |
| 4 | SGTL · Facturación | **Traer viajes**: solo entran los viajes **Entregados** con tarifa. |
| 5 | SGTL · Facturación | **Generar proforma** → los viajes pasan a **Facturado**. Si se anula, vuelven a **Entregado**. |

---

## Qué no se hace en SGTL

- Control Tráfico, bot de WhatsApp, sobres, adicionales o reclamos de Rukas.
- Numerar remitos: el remito lo emite el cliente / cargador; SGTL solo guarda su número.
