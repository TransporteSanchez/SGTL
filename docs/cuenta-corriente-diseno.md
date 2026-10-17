# Cuenta Corriente de Clientes — diseño inicial

Estado: modelo instalado y verificado en la base de desarrollo `Transporte_Sanchez` el 03/10/2026.
Base de referencia: script de estructura de SGTL entregado el 12/09/2026.
Plataforma existente: .NET Framework 4.8, Web API 2, EF6 y SQL Server/Azure SQL.
No incluye integración con ARCA ni autoriza cambios sobre una base compartida.

## 1. Alcance

- Moneda única ARS; comprobantes comerciales internos sin validez fiscal.
- Una Factura por una Proforma completa en estado `Aceptada`.
- NC siempre asociada y totalmente aplicada a una Factura pendiente.
- ND independiente o referenciada a una Factura; constituye su propia deuda cobrable.
- Recibo con una o varias formas de pago, completamente aplicado a Facturas/ND.
- Sin anticipos, saldo a favor, facturación parcial ni combinación de Proformas.
- Fecha de vencimiento obligatoria para deudas emitidas: FAC y ND.
- La Proforma no modifica Cuenta Corriente. No facturar automáticamente Proformas históricas.
- No migrar los ejemplos del frontend como operaciones reales.
- Datos antiguos Viaje–Proforma no se reconstruyen automáticamente a partir de códigos `V123`.

## 2. Entidades y relaciones

| Tabla | Clave primaria | Relaciones y función |
|---|---|---|
| TIPOS_COMPROBANTE | Tipo | FAC/ND = D; NC/REC = C. Catálogo cerrado para MVP. |
| COMPROBANTES_NUMERADORES | Tipo | Último correlativo confirmado por tipo. |
| COMPROBANTES | Comprobante_ID | FK Cliente, Tipo, usuarios y Factura de referencia opcional; NC requiere referencia. |
| COMPROBANTES_DETALLE | Detalle_ID | FK Comprobante y línea original de Proforma opcional. Copia histórica de conceptos. |
| COMPROBANTES_PROFORMAS | ComprobanteProforma_ID | FK compuestas garantizan misma cuenta y tipo FAC. Una Proforma por Factura. |
| CUENTA_CORRIENTE_MOVIMIENTOS | Movimiento_ID | FK Comprobante; emisión y reverso. No persiste saldo resultante. |
| CUENTA_CORRIENTE_APLICACIONES | Aplicacion_ID | FK compuestas a crédito C y deuda D del mismo cliente. Conserva anulaciones. |
| RECIBOS_FORMAS_PAGO | FormaPago_ID | FK compuesta a REC del mismo cliente. |
| PROFORMAS_VIAJES | ProformaID + ViajeID | Relación explícita y exclusiva: un viaje queda reservado por una sola Proforma. |
| PERMISOS | Permiso_ID | Código único por operación. |
| GRUPOS_PERMISOS | GrupoID + PermisoID | Grupos existentes; FK usuario que asigna. |

Tipos e impacto redundantes en ciertas FK son discriminadores controlados por CHECK/FK:
no deben recibirse libremente del navegador ni representar dos fuentes independientes de negocio.

### Cambios en tablas existentes

- `CLIENTES.EstadoCliente bit NOT NULL DEFAULT 1`: todos los existentes quedan activos.
  Desactivar bloquea FAC/ND nuevas. Debe permitir consultar y cobrar deuda previa,
  emitir NC correctivas y anular operaciones según permisos.
- `PROFORMAS.VersionCuentaCorriente rowversion`: token de concurrencia.
- `UNIQUE (Proforma_ID, ClienteID)` para FK que impide facturar a otro cliente.
- No agregar saldo en CLIENTES. Al emitir una Factura vigente, actualizar `PROFORMAS.Estado` a `Facturada` y bloquear la edición de la Proforma y de sus viajes vinculados.
- No alterar en esta instalación campos legacy NOT NULL, estados ni la secuencia PF.
- No asignar permisos a ningún grupo ni cambiar MENU automáticamente.

## 3. Estados y datos históricos

Documental: `BORRADOR -> EMITIDO -> ANULADO`. Solo BORRADOR se edita.
No se admite anulación documental de un borrador: descartar por una operación separada
que no borre un comprobante emitido ni sus vínculos.

No persistir el estado financiero; calcularlo según tipo:

- FAC/ND: Pendiente, Parcialmente cancelado, Cancelado.
- REC/NC: Sin aplicar, Parcialmente aplicado, Aplicado.
- ANULADO se muestra como tal, sin un estado financiero activo.

En el MVP REC/NC se emiten completamente aplicados. La maqueta actual muestra estados
de deuda en Recibos/NC; cambiar esas etiquetas al conectar el backend.

Guardar razón social, CUIT, domicilio, condiciones y conceptos como snapshot.
Cambios posteriores del Cliente o las tarifas no alteran comprobantes emitidos.
IDs de usuario con FK para operaciones nuevas; fecha/hora de registro en UTC
`datetime2(3)`. Fechas comerciales son `date`, interpretadas en horario argentino.

## 4. Saldo y consultas

Saldo actual = SUM(movimientos D) - SUM(movimientos C).
Incluir originales y reversos: no excluir originales porque su comprobante fue anulado.
Una aplicación no genera un segundo movimiento contable.

Saldo deuda emitida = Total - SUM(aplicaciones vigentes a la deuda).
Disponible crédito emitido = Total - SUM(aplicaciones vigentes desde el crédito).
Una ND referenciada no aumenta el Total ni el saldo individual de la Factura original.

Para la consulta por período:

1. Obtener saldo anterior de todos los movimientos previos a Desde.
2. Obtener movimientos del período ordenados por FechaContable, Movimiento_ID.
3. Acumular saldo anterior + débitos - créditos.
4. Tipo y estado solo filtran filas visibles; no reescriben el saldo real.
5. Cabecera = saldo actual sin filtros. Exportación respeta los mismos filtros que la grilla.

Vencida = FAC/ND EMITIDA, pendiente > 0 y vencimiento < fecha comercial actual.
Próximo vencimiento incluye vencimiento de hoy. Movimientos de fecha futura no
se admiten en MVP; fechas retroactivas requieren política y pruebas antes de habilitarse.
Saldo histórico financiero de comprobantes al corte requiere considerar también las
fechas de aplicaciones y anulaciones; no confundirlo con saldo actual.

## 5. Índices y controles de base de datos

- Número único por Tipo, solo si no es NULL. Los borradores no consumen numeración.
- `ClaveOperacion` UNIQUE en la cabecera, enviada como UUID por operación lógica.
- Una relación vigente por Proforma mediante índice único filtrado.
- Una relación Proforma por Factura en MVP.
- Un movimiento EMISION y, como máximo, un REVERSO por comprobante.
- Un solo reverso por movimiento original.
- Importe positivo en movimientos, aplicaciones y medios de pago.
- Importes monetarios `decimal(18,2)`; porcentajes `decimal(5,2)`.
- Totales de cabecera y detalle cumplen sus igualdades aritméticas locales.
- Fecha de vencimiento >= emisión; emisión y anulación exigen datos de auditoría.
- Índices de consulta por Cliente/Fecha y por créditos/deudas aplicados.
- Sin eliminación en cascada en las tablas nuevas. FK a línea de Proforma protege
  su eliminación; además la relación de Factura bloquea eliminar la Proforma.

No agregar una UNIQUE a `PROFORMAS.Numero` sin revisar antes duplicados históricos.
`SEQ_PROFORMA` no aparece en la exportación; verificar su existencia, no reiniciarla.

## 6. Reglas obligatorias de servicio (no resueltas por CHECK/FK)

La estructura no constituye un backend operativo. Nunca emitir mediante INSERT manual.

- Validar token, usuario activo y permiso; no confiar en Usuario enviado por el frontend.
- Bloquear modificaciones/eliminación de emitidos y de sus detalles/medios.
- FAC debe tener una Proforma Aceptada, sus conceptos y total facturados íntegramente.
- PROFORMAS_VIAJES debe contener viajes del mismo cliente; comprobar que un viaje no
  se facture dos veces mediante diferentes Proformas vigentes.
- Vincular detalle original a la Proforma efectivamente facturada y no a otra.
- Referencia NC debe coincidir con la Factura destino de su aplicación.
- Aplicaciones solo entre comprobantes EMITIDOS; suma por deuda <= Total.
- Suma por crédito <= Total y, al emitir REC/NC, exactamente igual a Total.
- Suma de formas de pago = Total REC; REC no tiene detalle de venta ni impuestos.
- Total movimiento de emisión = Total comprobante; reverso mismo importe que original.
- Un comprobante no se puede anular dos veces ni quedar sin su reverso.
- Ninguna emisión/anulación puede dejar saldo negativo en MVP.
- Guardar auditoría esencial en la misma transacción: un fallo revierte la operación.
  El contexto actual de auditoría tolera fallos; no reutilizarlo sin revisar este requisito.

### Importes y redondeo

Usar decimal en C#; nunca aceptar Total calculado por JavaScript como autoridad.
El código actual de Proformas redondea totales agregados y líneas por separado.
Esto puede producir diferencias de centavos. Antes de emitir, recomputar y validar
cabecera/detalle contra la Proforma aceptada. Si difieren, rechazar y diagnosticar:
no modificar silenciosamente la Proforma ni agregar un impuesto o concepto ficticio.
Definir y probar una única política de redondeo al implementar servicios.

### Concurrencia y numeración

Todas las escrituras de una operación usan el mismo contexto/conexión y transacción.
Para FAC: bloquear Proforma antes de comprobar si tiene factura, comprobar rowversion,
crear borrador/vínculo, recomputar, emitir y crear movimiento como unidad atómica.

Para REC/NC: bloquear filas de todos los créditos/deudas afectados en orden estable
de ID y mantener bloqueos hasta commit; recalcular pendientes dentro del bloqueo.
No basta leer saldo y luego llamar SaveChanges. rowversion solo sirve si se compara
y actualiza el registro correspondiente.

Numerador: incrementar la fila del tipo con un UPDATE dentro de esa transacción,
obteniendo INSERTED.UltimoNumero con OUTPUT. El bloqueo de escritura serializa ese
numerador; rollback deshace su incremento. Nunca SELECT MAX + 1 ni número frontend.
Todos los servicios deben usar el mismo orden de bloqueos y reintento acotado de deadlock.
Límite de ocho dígitos; reportar agotamiento sin reiniciar. Formatear Tipo + '-' + D8 en DTO.

ClaveOperacion: al reintentar, devolver el comprobante existente solo si coincide la
solicitud lógica, cliente y operación, y el usuario tiene permiso. Una misma clave
con contenido distinto debe producir conflicto. Es necesario implementar comparación
de payload normalizado o huella persistida al construir el backend.

### Anulaciones

- Una Factura vinculada a una Proforma se cancela exclusivamente mediante una NC por el total, sin movimientos previos sobre esa deuda; la Proforma conserva el estado `Facturada`.
- Una Proforma puede borrarse mientras esté en `Borrador` o `Generada`, sin Factura vinculada. Al borrarla se liberan sus viajes.
- FAC/ND con aplicaciones vigentes: rechazar; anular primero los créditos implicados.
- Anular REC/NC: marcar sus aplicaciones no vigentes y reabrir la deuda, en la misma
  transacción que el reverso, estado ANULADO y auditoría.
- Anular FAC sin aplicaciones: reverso y desactivar vínculo Proforma; permite refacturar.
- FAC con ND referenciadas emitidas: rechazar hasta resolver/anular esas ND.
- Un NC aplicada no libera automáticamente una Proforma para volver a facturar.
- No eliminar originales ni reactivar vínculos/aplicaciones anuladas.

## 7. Contratos iniciales de API

| Método y ruta | Entrada / salida |
|---|---|
| GET /api/clientes/{id}/cuenta-corriente | Desde, Hasta, Tipo, Estado, página; saldo anterior, actual, filas y total. |
| GET /api/clientes/{id}/saldo | SaldoActual, DeudaVencida, ProximoVencimiento, Moneda, FechaConsulta. |
| GET /api/clientes/{id}/comprobantes-pendientes | FAC/ND con original, aplicado, pendiente, vencimiento y estado calculado. |
| GET /api/comprobantes/{id} | Cabecera, detalle, Proforma, viajes, aplicaciones y auditoría. |
| GET /api/proformas/{id}/facturacion | Facturable, MotivoBloqueo, FacturaVigente, versión. |
| GET /api/proformas/{id}/factura-cancelatoria | Factura vinculada, cliente, importes fijos y si admite la cancelación total. |
| POST /api/facturas/desde-proforma/{id} | ClaveOperacion, VersionProforma, FechaEmision, FechaVencimiento, Observaciones. |
| DELETE /api/Proformas/{id} | Borra una Proforma aún no aceptada y sin Factura; libera sus viajes. |
| POST /api/recibos | ClaveOperacion, ClienteID, Fecha, Total, FormasPago[], Aplicaciones[]. |
| POST /api/notas-credito | ClaveOperacion, FacturaID, Fecha, Motivo, Conceptos[]; aplicación automática a esa FAC. |
| POST /api/notas-debito | ClaveOperacion, ClienteID, FacturaReferenciaID opcional, fechas y Conceptos[]. |
| POST /api/comprobantes/{id}/anular | Version, Motivo; una sola anulación efectiva. |

DTO separados de entidades y controllers. Usuario y número se resuelven en servidor.
Total en Recibo se valida; conceptos/IVA se recomputan en servidor.
AplicacionDto = ComprobanteDeudaID + Importe.
FormaPagoDto = Forma + Referencia + Banco opcional + FechaOperacion opcional + Importe.
Errores 400 por datos inválidos, 401/403 por autenticación/permisos y 409 por concurrencia
o clave reutilizada con otro contenido. No devolver SQL ni credenciales en errores.

## 8. Integración y pruebas

1. Ejecutar SOLO `01_verificacion_previa.sql` en una copia de desarrollo y revisar resultados.
2. Confirmar alcance, base destino, coherencia de Proformas y numerador PF.
3. Modelo instalado en `Transporte_Sanchez`; `02_modelo_incremental.sql` permanece
   deshabilitado por defecto para evitar una ejecución accidental o una reinstalación.
4. Verificación posterior completada: catálogos, FK, índices y diagnósticos correctos.
5. Implementar acceso específico por SQL parametrizado, sin modificar manualmente archivos
   generados del EDMX ni habilitar inicialización automática de la base.
6. Implementar identidad/permisos y servicios transaccionales. Mantener auditoría SGTL.
7. FAC + consultas; luego REC + aplicaciones, NC/ND y anulaciones.
8. Sustituir datos demo, mensajes y permisos temporales del frontend solo al conectar API.

Pruebas pendientes obligatorias en SQL Server y servicios:

- Instalación abortada sin confirmación; instalación completa y rollback ante fallo DDL.
- Segunda instalación rechazada sin tocar objetos existentes.
- FK rechaza aplicación entre clientes, dirección incorrecta y forma de pago en FAC.
- Dos FAC simultáneas sobre una Proforma: solo una confirma.
- Numeradores concurrentes únicos; rollback no confirma comprobante ni correlativo.
- FAC 100.000 + FAC 50.000 - REC 80.000 - NC 10.000 = saldo 60.000.
- Dos cobros simultáneos de 70.000 sobre deuda 100.000: el segundo se rechaza/recalcula.
- REC distribuido entre FAC y ND, pagos mixtos, importe inválido y no finito en DTO.
- Anular REC reabre deuda; anular NC la restituye; FAC aplicada no se anula.
- Reintento de ClaveOperacion igual no duplica; payload distinto devuelve 409.
- Redondeo por concepto, IVA, cambios posteriores del cliente y tarifas.
- Filtros no alteran saldo histórico, saldo anterior ni cabecera actual.
- Usuario sin permiso no emite; cliente inactivo admite cobrar deuda previa.

No se incluyen triggers de negocio ni stored procedures en esta propuesta.
CHECK/FK no garantizan sumatorias entre filas, estados relacionados o inmutabilidad.
Esos controles deben probarse en servicios antes de habilitar el módulo.
