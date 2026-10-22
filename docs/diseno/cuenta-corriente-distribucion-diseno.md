# Plan de implementación — Distribución de Recibos y Notas de Crédito

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir distribuir automáticamente Recibos y Notas de Crédito corrientes entre Facturas pendientes por vencimiento, y mostrar los importes editables con formato argentino.

**Architecture:** `CUENTA_CORRIENTE_APLICACIONES` será la única relación entre una NC corriente y sus Facturas; no se creará otra tabla. El frontend compartirá el algoritmo FIFO y la máscara monetaria, mientras que la API recalculará y validará las aplicaciones, los importes impositivos y la concurrencia dentro de su transacción actual. Las NC cancelatorias de Proforma conservarán su referencia única y su flujo de liberación de viajes.

**Tech Stack:** HTML estático, JavaScript ES5 con Bootstrap, Web API 2 sobre .NET Framework 4.8, SQL Server/Azure SQL y pruebas Node.js con `assert`/`vm`.

**Spec:** `docs/diseno/cuenta-corriente-diseno.md` (§9).

## Global Constraints

- Todo texto de pantalla y error debe usar español rioplatense y voseo.
- No ejecutar SQL contra la base compartida; la migración será nueva, idempotente y versionada en `database/cuenta-corriente/`.
- No regenerar el EDMX ni incorporar secretos o cadenas de conexión.
- La Mac modifica código; la VM Windows compila la API y realiza las pruebas manuales.
- No introducir dependencias de JavaScript ni cambiar el formato numérico que recibe la API: los JSON deben enviar números con hasta dos decimales.
- Una NC con `ProformaID` sigue siendo una cancelación total de una sola Factura y no debe habilitar distribución múltiple.

## Review Focus

- Un importe vacío, negativo, con más de dos decimales o con separadores ambiguos debe informar error y no transformarse silenciosamente en cero. Se prueba en la Tarea 1.
- Facturas con el mismo vencimiento deben distribuirse siempre por fecha de emisión y luego ID, independientemente del orden de respuesta de la API. Se prueba en la Tarea 1.
- Un Recibo puede conservar saldo sin imputar; una NC corriente no puede emitirse con diferencia ni exceder el saldo de una Factura. Se prueba en las Tareas 2 y 4.
- Si se cambia de cliente mientras carga una grilla, la respuesta anterior no debe mostrar ni distribuir Facturas de otro cliente. Se prueba en la Tarea 4.
- La NC cancelatoria de Proforma no debe aceptar varias aplicaciones ni liberar viajes ante una imputación parcial. Se prueba en la Tarea 2.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `assets/static/js/sgtl-ui.js` | Parsear, formatear y enlazar la máscara de importes en formato argentino. |
| `assets/static/js/cuenta-corriente-clientes.js` | Algoritmo FIFO, grillas de aplicaciones, resúmenes y payloads de Recibo/NC. |
| `cuenta-corriente-clientes.html` | Botones Distribuir, grilla de NC y campos de importe que aceptan formato argentino. |
| `WebApi_TransporteSanchez/Controllers/ComprobantesController.cs` | Contrato, validación, cálculo de componentes, idempotencia e inserción de varias aplicaciones de NC. |
| `database/cuenta-corriente/10_notas_credito_multiples_aplicaciones.sql` | Relajar de forma controlada el CHECK que hoy obliga una referencia única para NC. |
| `database/cuenta-corriente/03_verificacion_posterior.sql` | Diagnóstico coherente con NC de una o varias Facturas. |
| `tests/montos-y-distribucion.test.js` | Casos puros de parseo/formato monetario y distribución FIFO. |
| `tests/notas-credito-multiples.test.js` | Contrato y protecciones de backend/migración de NC múltiple. |
| `tests/emision-comprobantes.test.js` | Estructura de formularios y payload de NC/Recibo. |

### Task 1: Utilidades monetarias y algoritmo FIFO

**Files:**
- Create: `tests/montos-y-distribucion.test.js`
- Modify: `assets/static/js/sgtl-ui.js:412-765`
- Modify: `assets/static/js/cuenta-corriente-clientes.js:60-75`

**Interfaces:**
- Produces `window.SGTL.montoCentavos(valor) -> number | null`, que acepta `1.234,56`, `1234,56` y valores numéricos, y rechaza vacío, negativos o más de dos decimales.
- Produces `window.SGTL.formatearMontoCentavos(centavos) -> string`, por ejemplo `123456 -> '1.234,56'`.
- Produces `window.SGTL.enlazarMascaraMonto(elemento)`, que normaliza el valor al perder foco sin cambiar el valor lógico.
- Produces `distribuirImportePorVencimiento(importeCentavos, facturas) -> Aplicacion[]`, donde cada factura contiene `ComprobanteID`, `FechaVencimiento`, `FechaEmision` y `SaldoCentavos`; cada salida contiene `ComprobanteID` e `ImporteCentavos`.
- Consumes los helpers de SGTL desde el adaptador local `centavos(valor)` de Cuenta Corriente.

- [x] **Step 1: Escribir la prueba fallida de importes y FIFO**

  Crear `tests/montos-y-distribucion.test.js` cargando las funciones puras con `vm`. Incluir estas aserciones:

  ```js
  assert.strictEqual(montoCentavos('1.234,56'), 123456);
  assert.strictEqual(formatearMontoCentavos(123456), '1.234,56');
  assert.strictEqual(montoCentavos('1.234,567'), null);
  assert.deepStrictEqual(
      distribuirImportePorVencimiento(50000000, facturas),
      [
          { ComprobanteID: 2, ImporteCentavos: 20000000 },
          { ComprobanteID: 1, ImporteCentavos: 20000000 },
          { ComprobanteID: 3, ImporteCentavos: 10000000 }
      ]
  );
  ```

  El fixture debe llegar desordenado, tener vencimientos distintos y un empate de vencimiento para demostrar los desempates definidos en la especificación.

- [x] **Step 2: Ejecutar la prueba para verificar que falla**

  Run: `& 'C:\Program Files\nodejs\node.exe' tests/montos-y-distribucion.test.js`

  Expected: falla porque no existen las funciones de máscara ni `distribuirImportePorVencimiento`.

- [x] **Step 3: Implementar los helpers monetarios y la distribución**

  Agregar en `assets/static/js/sgtl-ui.js` las tres funciones públicas. El parser debe eliminar separadores de miles válidos, aceptar coma o punto decimal cuando no sea ambiguo y devolver `null` ante un formato inválido; no usar `parseFloat` sobre texto con punto de miles. La máscara debe operar sobre `input[type=text][inputmode=decimal]`, permitir la edición y formatear con dos decimales al perder foco.

  En `assets/static/js/cuenta-corriente-clientes.js`, hacer que `centavos` delegue al parser compartido y agregar la función pura FIFO. Ordenar por `FechaVencimiento`, `FechaEmision` y `ComprobanteID`; aplicar `Math.min(saldo, restante)` y no generar filas por importe cero.

- [x] **Step 4: Ejecutar las pruebas unitarias de utilidades**

  Run: `& 'C:\Program Files\nodejs\node.exe' tests/montos-y-distribucion.test.js`

  Expected: PASS, incluyendo el caso de fechas iguales y el rechazo de tres decimales.

### Task 2: Contrato, persistencia y validación de NC múltiple

**Files:**
- Create: `tests/notas-credito-multiples.test.js`
- Create: `database/cuenta-corriente/10_notas_credito_multiples_aplicaciones.sql`
- Modify: `WebApi_TransporteSanchez/Controllers/ComprobantesController.cs:19-37, 140-175, 327-366, 523-824`
- Modify: `database/cuenta-corriente/03_verificacion_posterior.sql:85-87`

**Interfaces:**
- Produces `AplicacionComprobanteRequest { int ComprobanteID; decimal Importe; }` y `EmitirComprobanteRequest.Aplicaciones` para `POST /api/comprobantes`.
- Produces una validación normalizada de NC corriente: Facturas `FAC` emitidas, del mismo cliente, sin repetidos, con saldo suficiente y cuya suma coincide con el total de la NC. `FacturaReferenciaDto` incorporará `FechaVencimiento` para que la interfaz pueda ordenar por vencimiento.
- Produces componentes de NC calculados en servidor desde cada aplicación: neto, IVA y otros impuestos de la porción pendiente de la Factura.
- Consumes `CUENTA_CORRIENTE_APLICACIONES` como relación canónica y mantiene `ComprobanteReferenciaID` únicamente en la NC cancelatoria de Proforma.

- [x] **Step 1: Escribir las pruebas fallidas del contrato de NC múltiple**

  Crear `tests/notas-credito-multiples.test.js` leyendo los fuentes C#/SQL. Debe exigir el DTO `Aplicaciones`, validación de suma, bloqueo por cliente/saldo/repetido, inserción en bucle en `CUENTA_CORRIENTE_APLICACIONES`, comparación de aplicaciones al reintentar y la migración `10` que permita NC sin referencia única. Incluir aserciones de que el camino `ProformaID` exige exactamente una Factura y conserva la cancelación total.

- [x] **Step 2: Ejecutar la prueba para verificar que falla**

  Run: `& 'C:\Program Files\nodejs\node.exe' tests/notas-credito-multiples.test.js`

  Expected: FAIL porque el request actual solo admite `ComprobanteReferenciaID` y la NC inserta una única aplicación.

- [x] **Step 3: Implementar la migración idempotente y el contrato**

  Crear `database/cuenta-corriente/10_notas_credito_multiples_aplicaciones.sql`. Debe localizar y recrear idempotentemente `CK_CC_COMP_Referencia` para permitir que una NC corriente tenga ambos campos de referencia nulos, manteniendo la FK y permitiendo las referencias FAC existentes de NC/ND. No modificar `02_modelo_incremental.sql`.

  En `ComprobantesController.cs`, agregar el DTO, exponer `FechaVencimiento` en la consulta de Facturas de referencia y normalizar `Aplicaciones` antes de abrir la transacción. Para una NC corriente, prohibir referencia única y exigir de una a 200 aplicaciones. Dentro de la transacción serializable, bloquear y releer cada Factura con `LeerFacturaReferencia`, validar cliente/estado/saldo/fecha y obtener sus componentes pendientes. Calcular la composición de cada importe parcial sobre esa composición pendiente, redondear a dos decimales y garantizar que neto + IVA + otros sea igual al importe aplicado. El encabezado, detalle y movimiento deben usar los totales calculados, no los importes que llegue a proponer el navegador.

  Para una NC con `ProformaID`, conservar el contrato actual de una referencia y cancelación total; generar internamente su única aplicación para no romper el emisor de Factura desde Proforma. Insertar todas las aplicaciones normalizadas en un bucle parametrizado. Ampliar la comprobación de `ClaveOperacion` para comparar también las aplicaciones vigentes del comprobante existente antes de devolver un reintento exitoso.

  Ajustar `03_verificacion_posterior.sql`: cuando una NC tiene referencia, esta debe coincidir con su única aplicación; cuando no la tiene, sus aplicaciones vigentes deben ser del mismo cliente y sumar el total de la NC.

- [x] **Step 4: Ejecutar las pruebas del contrato**

  Run: `& 'C:\Program Files\nodejs\node.exe' tests/notas-credito-multiples.test.js`

  Expected: PASS. La migración debe aparecer como archivo nuevo; no se ejecuta contra la base compartida.

- [ ] **Step 5: Preparar la verificación en VM**

  Compilar en la VM Windows y probar: NC de $500.000 contra tres Facturas de $200.000; dos canceladas y la tercera por $100.000. Verificar también que una NC de Proforma con movimiento previo siga siendo rechazada y que una cancelación total libere los viajes correspondientes.

### Task 3: Distribución y máscara en Recibos

**Files:**
- Modify: `cuenta-corriente-clientes.html:299-340`
- Modify: `assets/static/js/cuenta-corriente-clientes.js:633-778, 1239-1318`
- Modify: `tests/emision-comprobantes.test.js`

**Interfaces:**
- Consumes `distribuirImportePorVencimiento`, `SGTL.montoCentavos`, `SGTL.formatearMontoCentavos` y `SGTL.enlazarMascaraMonto` de la Tarea 1.
- Produces `aplicacionesRecibo() -> [{ ComprobanteID, Importe }]` normalizado desde la grilla.
- Produces el control `#btnDistribuirRecibo`, que distribuye el importe de `#reciboFormaImporte` sin emitir el recibo.

- [x] **Step 1: Escribir las pruebas fallidas de la pantalla de Recibo**

  Extender `tests/emision-comprobantes.test.js` para exigir `btnDistribuirRecibo`, los campos de importe como texto decimal con máscara y la llamada desde el evento del botón a la función de distribución. Verificar que la función conserva la posibilidad de saldo sin aplicar y que la grilla continúa enviando solo filas marcadas con importe positivo.

- [x] **Step 2: Ejecutar la prueba para verificar que falla**

  Run: `& 'C:\Program Files\nodejs\node.exe' tests/emision-comprobantes.test.js`

  Expected: FAIL porque el modal no contiene el botón y los importes son `type=number` sin máscara.

- [x] **Step 3: Implementar la interacción de Recibo**

  En la cabecera de “Imputación a comprobantes”, agregar `#btnDistribuirRecibo`. Transformar `#reciboFormaImporte` y los importes por fila a `type=text`, `inputmode=decimal` y máscara centralizada. Al cargar Facturas, conservar el control contra cambios de cliente y generar los datos de fecha/saldo que necesita la función FIFO.

  Implementar `distribuirRecibo()` para leer el importe en centavos, limpiar selecciones anteriores, aplicar el resultado FIFO, marcar filas y actualizar el resumen. No sustituir la edición manual: al marcar/desmarcar o escribir un importe, limitarlo al saldo de esa fila y recalcular total aplicado/diferencia. `emitirRecibo` debe seguir enviando números decimales y puede aceptar una diferencia positiva como crédito sin aplicar.

- [x] **Step 4: Ejecutar las pruebas de Recibo**

  Run: `& 'C:\Program Files\nodejs\node.exe' tests/montos-y-distribucion.test.js; & 'C:\Program Files\nodejs\node.exe' tests/emision-comprobantes.test.js`

  Expected: PASS. El caso $500.000 sobre tres saldos de $200.000 debe dejar $100.000 en la tercera fila.

### Task 4: Grilla, distribución y emisión de NC corriente

**Files:**
- Modify: `cuenta-corriente-clientes.html:245-290`
- Modify: `assets/static/js/cuenta-corriente-clientes.js:779-950, 1239-1318`
- Modify: `tests/emision-comprobantes.test.js`
- Modify: `tests/recibos-asociados.test.js`

**Interfaces:**
- Consumes `facturasReferencia`, `distribuirImportePorVencimiento` y las utilidades monetarias de la Tarea 1.
- Consumes el contrato `Aplicaciones[]` de `POST /api/comprobantes` de la Tarea 2.
- Produces `aplicacionesNotaCredito() -> [{ ComprobanteID, Importe }]` y `actualizarResumenNotaCredito()`.
- Produces los controles `#cmpImporteTotalNC`, `#btnDistribuirNC`, `#cmpFacturasNC` y su resumen, visibles solo para NC corriente.

- [x] **Step 1: Escribir las pruebas fallidas de NC corriente**

  Extender `tests/emision-comprobantes.test.js` para exigir que una NC normal use la grilla múltiple, envíe `Aplicaciones` y no `ComprobanteReferenciaID`; exigir que una NC de Proforma conserve la referencia única. En `tests/recibos-asociados.test.js`, agregar una NC con dos aplicaciones y comprobar que ambas se identifiquen como créditos aplicados en la grilla de cuenta corriente. Agregar el caso de respuesta tardía de otro cliente, verificando que no reemplace la grilla activa.

- [x] **Step 2: Ejecutar las pruebas para verificar que fallan**

  Run: `& 'C:\Program Files\nodejs\node.exe' tests/emision-comprobantes.test.js; & 'C:\Program Files\nodejs\node.exe' tests/recibos-asociados.test.js`

  Expected: FAIL porque la NC actual usa un único `<select>` y no construye `Aplicaciones`.

- [x] **Step 3: Implementar el formulario de NC corriente**

  Reemplazar el selector único por un bloque exclusivo de NC con importe total, botón Distribuir, tabla de Factura/vencimiento/original/saldo/aplicar y resumen total-aplicado-diferencia. Mantener oculto ese bloque en FAC/ND y mantener sin cambios el formulario cancelatorio que se abre desde Proformas.

  Al cargar Facturas para NC, filtrar saldos positivos, verificar que el cliente y tipo sigan vigentes antes de renderizar y ordenar solo para distribuir. El botón debe usar el total ingresado, rellenar en FIFO y dejar los valores editables. La emisión debe rechazar localmente cero aplicaciones, importes por encima de cada saldo o diferencia distinta de cero; calcular la composición mostrada de la NC a partir de las aplicaciones y enviar ese resumen junto con `Aplicaciones`. Aplicar la máscara a `cmpNeto` y `cmpOtros` para FAC/ND y a `cmpImporteTotalNC`/valores aplicados para NC.

- [x] **Step 4: Ejecutar la regresión completa y control de calidad**

  Run:

  ```powershell
  $node = 'C:\Program Files\nodejs\node.exe'; Get-ChildItem 'tests' -Filter '*.test.js' | Sort-Object Name | ForEach-Object { & $node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }; git diff --check
  ```

  Expected: todos los archivos `*.test.js` terminan en `OK:` y `git diff --check` no informa errores.

- [ ] **Step 5: Verificar manualmente en la VM**

  Compilar la API y ejecutar el script `10` únicamente mediante el procedimiento autorizado del equipo. Probar Recibo y NC con el escenario FIFO de tres Facturas de $200.000, edición manual posterior, importes `1.234,56`, excedente de Recibo y rechazo de NC con excedente. Confirmar también el flujo de NC cancelatoria de Proforma.

## Revisión del plan

- **Cobertura de especificación:** las Tareas 1, 3 y 4 cubren máscara, botón y distribución; la Tarea 2 cubre el modelo múltiple, reglas de servidor, auditoría e idempotencia; la Tarea 4 cubre la regresión y el recorrido VM.
- **Consistencia de interfaces:** la distribución devuelve centavos para evitar redondeos de JavaScript; los adaptadores de Recibo y NC convierten a decimales solo al generar JSON. La API recibe `Aplicaciones[]` y vuelve a validar todos sus valores.
- **Riesgos cubiertos:** los cinco casos de Review Focus tienen una prueba asignada en las tareas indicadas.
- **Proporción:** no se agregan nuevas tablas ni dependencias; la migración solo ajusta el CHECK existente y el uso de aplicaciones ya está consolidado en el módulo.
