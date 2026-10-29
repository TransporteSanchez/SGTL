# Datos para la demo del 29/10: un caso por estado, con fechas que cierran

Para que el profe recorra el sistema y cada pantalla muestre un caso real de cada estado, con las fechas en orden
(viaje → entrega → proforma → comprobante → recibo). Es el punto 3 de la §64 de `docs/PENDIENTES-SISTEMA.md`. Lo hace
Rocío por pantalla; Claude ayuda a decidir con los resultados. Hoy es **jueves 29/10/2026**: las fechas de abajo salen de
ahí.

## 0. Antes de empezar

- **Primero la limpieza de viajes**, con `docs/equipo/INSTRUCTIVO-LIMPIEZA-VIAJES.md` (consultas `05`, `02` y `01`). Esta
  guía va después: lo que la limpieza cierra (viajes pasados sin cerrar, superpuestos, nombres de prueba) ya cuenta como
  caso si sus fechas cierran.
- **Lo demás de la §64, punto 3:** anular la PF-00000005 (libera el viaje #5); borrar CR B, CR A y el Numerador CR; los
  comprobantes 51 a 57 de Logística Pampeana y el FC-A-0001-00000004 "Comprobante interno de prueba", con Facu; borrar el
  grupo "PRUEBA-CLAUDE 20/10" (mirando antes qué tiene).
- **Sin el token de WhatsApp del día** (vencido o sin cargar): registrar un viaje con chofer le manda la hoja de ruta, y
  cancelarlo o cambiarle el chofer, un aviso. Sin token sale "no se pudo enviar" y a nadie le llega nada.
- **Base compartida:** avisarles a Facu y a Fede. Nadie cambia la configuración de facturación hasta la reunión.
- **No tocar los viajes 25 y 26 de QUICKFOOD** (990001 y 990002, 16/10, Listo para facturar): son los de la demo de Rukas
  con los Excel de `docs/pruebas/datos/README.md`. Si cambian el camión, los km o la hora, los Excel dejan de coincidir.
- **Datos verosímiles:** nombres, recorridos y motivos como los reales; nunca "prueba", "test" ni "Claude".

## 1. Correr la consulta 06 (solo lectura)

`database/limpieza/06_relevar_estados_y_fechas_para_la_demo.sql` (SSMS, base Transporte_Sanchez, tal cual). Devuelve siete
tablas; la última columna dice qué hacer:

1. **Estados:** cuántos hay de cada uno y cuántos hacen falta para la demo (la tabla de la sección 2). Lo que dice
   "Faltan N" es lo que se carga.
2. a 5. **Viajes, presupuestos, proformas y comprobantes que no cierran** (entrega futura o antes del inicio, cancelado
   sin motivo, facturado sin comprobante, proforma emitida antes de la entrega…). Se corrige lo que dice cada fila; lo que
   dice "consultarlo con Claude", pasárselo antes de tocar nada.
6. **Cuenta corriente por cliente:** qué cliente sirve para mostrar uno al día, uno con deuda y uno con deuda vencida.
7. **Numeración:** si algún número quedó con una fecha anterior a la de uno más bajo, y desde qué fecha se puede emitir lo
   próximo de cada serie sin desordenarla.

El resultado tiene nombres de clientes: no se guarda en el repo.

## 2. Los casos que tiene que haber

**Antes de cargar uno, fijate si ya hay uno que sirva** (tabla 1 de la 06 y Gestionar viajes): se carga solo lo que falta.
Para que el precio no cambie solo y no salga "Camión ocupado", los viajes nuevos van en días distintos o con camiones
distintos, salvo los dos de la 1ª y 2ª vuelta (V11 y V12). Cada viaje se registra con su fecha (se puede registrar con
fecha pasada) y se lleva a su estado con Cambiar estado.

### Viajes de clientes directos

| Caso | Estado final | Fechas | Cómo se llega |
|---|---|---|---|
| V1 | Facturado y cobrado | Viaje y entrega 01/10 | En una proforma facturada y con el recibo por el total (sección 3) |
| V2 | Facturado, con deuda vencida | Viaje y entrega 08/10 | Facturado, vencimiento antes de hoy y sin recibo, o con uno parcial (sección 3) |
| V3 | Facturado, con deuda al día | Viaje y entrega 19/10 | Facturado, con el vencimiento después de hoy (sección 3) |
| V4 | Entregado, en una proforma aceptada | Viaje y entrega 21/10 | Para emitir el comprobante en vivo |
| V5 | Entregado, en una proforma generada | Viaje y entrega 22/10 | Para mostrar Marcar como aceptada |
| V6 | Entregado, sin proforma, con adicionales | Viaje y entrega 23/10 | Con espera y descarga (§60). Queda libre para mostrar Traer viajes en un borrador |
| V7 | Entregado, en un borrador de proforma | Viaje y entrega 26/10 | El borrador queda sin generar |
| V8 | Sin carga | 24/10 | En viaje → Sin carga, con "Llegó al origen y no había mercadería para cargar." |
| V9 | Cancelado | 27/10 | Cambiar estado → Cancelado, con un motivo real ("El cliente postergó la carga.") |
| V10 | En viaje | Hoy, 29/10, de 07:00 a 15:00 hs | Cambiar estado → En viaje |
| V11 y V12 | Registrado, 1ª y 2ª vuelta | Mañana, 30/10, 08:00 y 14:00 hs | Mismo cliente, recorrido y camión, sin pisarse: el segundo sale como 2ª vuelta (§43) |
| V13 | Registrado, desde un presupuesto | 04/11 | Generado desde el presupuesto P2 |

Cada entregado lleva su fecha de entrega (no futura, no antes del inicio), el resultado y la evidencia (un remito de
ejemplo sin datos reales).

### Viajes de clientes con plataforma (QUICKFOOD)

| Caso | Estado final | Fechas | Cómo se llega |
|---|---|---|---|
| R1 y R2 | Listo para facturar | 16/10 | Los viajes 25 y 26, como están: la demo de Rukas los factura en vivo |
| R3 | Registrado | 31/10 | Registrar viaje, con un N° de transporte que no esté en los Excel (por ejemplo, 990003) |

### Presupuestos

| Caso | Estado | Para qué |
|---|---|---|
| P1 | Pendiente, para un viaje del 06/11 | Mostrar Aceptar o Rechazar |
| P2 | Aceptado, con el viaje V13 generado | Mostrar el presupuesto con su viaje |
| P3 | Aceptado, sin viaje, para el 05/11 | Generar el viaje en vivo |
| P4 | Rechazado | Mostrar el estado |

La fecha de alta de un presupuesto la pone el sistema (la de hoy): si se carga hoy, su viaje tiene que ser de hoy en
adelante.

### Proformas y comprobantes

Salen de los viajes de arriba: tres proformas facturadas (V1, V2 y V3), una aceptada (V4), una generada (V5) y un borrador
(V7). El comprobante de cada facturada, el recibo de V1 (total) y, si sirve, uno parcial de V2. En cuenta corriente quedan
así tres clientes: uno al día, uno con deuda al día y uno con deuda vencida (tabla 6 de la 06). Conviene que V1, V2 y V3
sean de tres clientes distintos.

## 3. Las fechas de la facturación: hay que elegir

**La proforma toma la fecha del día en que se genera**: la pantalla no deja elegirla. El comprobante y el recibo sí se
pueden emitir con fecha pasada (no futura), pero un comprobante anterior a su proforma no cierra. Además, la numeración
tiene que ir en el mismo orden que las fechas: si ya hay un FC-A del 28/10, uno nuevo con fecha 06/10 queda con un
número más alto y una fecha anterior (tabla 7 de la 06).

Por eso, con los resultados de las tablas 5 y 7, Rocío elige una de estas dos:

- **A. Facturación con fechas de estos días (recomendada para hoy, sin SQL).** Las proformas y los comprobantes nuevos, con
  fecha de hoy (o desde la que diga la tabla 7); los viajes siguen siendo de octubre, como si se facturara a fin de mes.
  El recibo de V1, también hoy. La **deuda vencida** sale de un comprobante que ya exista con el vencimiento pasado (tabla
  6); si no hay ninguno, se muestra la deuda al día y se cuenta cómo se ve una vencida. Lo que ya está emitido y cierra,
  queda.
- **B. Facturación desde cero, en orden de fechas.** Borrar toda la facturación de prueba y reiniciar la numeración, como
  el 25/10 (§38). El script `database/limpieza/04_…` es anterior a los cambios de Facu (tipos configurables, créditos y
  débitos internos, imputaciones): hay que rehacerlo y revisarlo con él. Después, generar las proformas de a una y,
  dentro de `BEGIN TRAN … ROLLBACK`, llevar su fecha a la del caso, antes de emitir cada comprobante con su fecha. Da una
  historia completa de octubre, pero lleva dos o tres horas y toca el módulo de Facu el día de la reunión.

## 4. Al terminar

1. Volver a correr la `05`, la `02` y la `06`. En la 06: la tabla 1 sin "Faltan", las 2 a 5 vacías y la 7 solo con el
   último número de cada serie.
2. Mirar las pantallas como el profe: el dashboard (Último mes y Trimestre), Gestionar y Listar viajes (un caso de cada
   estado, con los botones y los motivos de los deshabilitados), presupuestos, proformas, cuenta corriente de los tres
   clientes, Tableros y Auditoría.
3. Contarle a Claude qué quedó y con qué números (viajes, proformas, comprobantes), para armar los casos de prueba del
   profe (§64, punto 4) sobre esos datos.
