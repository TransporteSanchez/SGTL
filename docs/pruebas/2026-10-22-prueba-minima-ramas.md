# Reporte de pruebas — prueba mínima antes de pasar las ramas — 22/10/2026

> Generado por la sesión de Claude en la VM y guardado tal cual. **F1 corregido en la Mac el mismo 22/10** (ver
> `docs/PENDIENTES-SISTEMA.md` §23): el id `recibofacturas` se había roto al pasar a minúscula los mensajes de Facu en el
> merge `aea9740`.

## Resumen para decidir

| Paso | Resultado |
|---|---|
| 1. Compilar la API | Lo hizo Rocío (la API compiló y respondió durante toda la prueba) |
| 2. API y Live Server | Lo hizo Rocío (Live Server en el **5500**) |
| 3. Entrar con tu usuario | Lo hizo Rocío: entró (en Auditoría figura "Inicio de sesión" de RNUVOLI a las 16:41). No se probó la contraseña incorrecta |
| 4. Cambiar contraseña con un usuario de prueba | Lo hizo Rocío (no lo vi) |
| **5. Recorrer el menú (25 opciones)** | **OK con observaciones**: las 25 pantallas abren y cargan sus datos, **sin errores de JavaScript**. Fallan los PDF de Documentación (F2 y F3): el problema está en los datos o en la base, no en el código de este push (`DocumentacionController` no cambia desde el 18/10) |
| 6. Dashboard | OK |
| 7. Cuenta corriente | OK |
| **8. Registrar recibo** | **FALLA (F1, alta)**: después de elegir el cliente no carga las facturas pendientes, así que no se puede distribuir. No se emitió nada |
| 9. Registrar presupuesto | OK: se guardó el presupuesto N° 7 |
| 10. Gestionar viajes, banderita | OK |
| 11. Nombre comercial y tipos de comprobante | OK |

**Regla de corte (si fallan el 1, el 3 o el 5, no se pasan las ramas):** según la regla, **se cumple**. El 1 y el 3 los hizo
Rocío y anduvieron, y el 5 no tiene errores de JavaScript ni pantallas rotas por el código nuevo.
**Pero el paso 8 falla por un error que entró en el merge de Facu del 22/10** (`aea9740`): no está en `e0779bf` ni en
`rocionuvoli` antes del merge. Se arregla con un carácter. Mi recomendación es corregirlo en la Mac antes de pasar las
ramas, porque si no, Facu recibe el registro de recibos roto. Lo decide Rocío.

## Entorno
- Rama / commit: rocionuvoli @ 64bb048 Documentación: prueba mínima antes de pasar las ramas al equipo (`git status` limpio)
- API: http://localhost:50222/api (OK)
- Front: Live Server puerto 5500 (el 5502 no responde)
- Navegador: el integrado de Claude, sesión iniciada por Rocío (usuario RNUVOLI)
- Alcance pedido: pasos 5 a 11 de la §23 de `docs/PENDIENTES-SISTEMA.md`

## Resumen
30 pruebas: 25 pantallas del paso 5 más los pasos 6 a 11. Falla 1 paso (el 8, alta) y hay 2 problemas de datos en
Documentación (media). En la consola no hay errores de JavaScript. Los únicos errores rojos son de red: el 404 conocido de
`DashboardLayout`, los 404 de los PDF de versiones y el 500 del PDF del manual.

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 5.1 | Dashboard | Abre y carga | OK | 404 de `GET /api/DashboardLayout`: conocido, la API todavía no lo tiene (comentario en `index.html:701`) |
| 5.2 | Listar choferes | Abre y carga | OK | 5 filas |
| 5.3 | Gestionar choferes | Abre y carga | OK | 5 filas |
| 5.4 | Listar camiones | Abre y carga | OK | 4 filas |
| 5.5 | Gestionar camiones | Abre y carga | OK | 4 filas |
| 5.6 | Listar viajes | Abre y carga | OK | 15 filas |
| 5.7 | Gestionar viajes | Abre y carga | OK | 15 filas |
| 5.8 | Gestionar orígenes y destinos | Abre y carga | OK | 8 filas |
| 5.9 | Gestionar tarifas | Abre y carga | OK | 3 filas |
| 5.10 | Gestionar presupuestos | Abre y carga | OK | 5 filas (antes de la prueba) |
| 5.11 | Listar clientes | Abre y carga | OK | 4 filas |
| 5.12 | Gestionar clientes | Abre y carga | OK | 4 filas |
| 5.13 | Listar proformas | Abre y carga | OK | 8 filas |
| 5.14 | Gestionar proformas | Abre y carga | OK | 12 filas |
| 5.15 | Gestionar cuenta corriente | Abre y carga | OK | 24 movimientos |
| 5.16 | Gestionar tipos de comprobante | Abre y carga | OK | Sucursales, numeradores y tipos |
| 5.17 | Gestionar e-mail | Abre y carga | OK | 2 servidores y sus asignaciones |
| 5.18 | Gestionar contenido | Abre y carga | OK | |
| 5.19 | Gestionar integración de WhatsApp | Abre y carga | OK | |
| 5.20 | Listar usuarios | Abre y carga | OK | 11 filas |
| 5.21 | Gestionar usuarios | Abre y carga | OK | 11 filas |
| 5.22 | Gestionar grupos y permisos | Abre y carga | OK | 6 grupos |
| 5.23 | Auditoría | Abre y carga | OK | 15 filas |
| 5.24 | Consultar manual de usuario | Abre y muestra el PDF | FALLA (F2) | Muestra "Publicado el 20/10/2026." pero el PDF no aparece: la API tarda unos 29 s y devuelve 500 |
| 5.25 | Consultar informe de versión | Abre y muestra el PDF | FALLA (F3) | La lista carga (2.5, 2.00, 1.00), pero 2.5 y 2.00 no tienen PDF: 404 y "No se pudo cargar el PDF. Probá de nuevo." |
| 6 | Dashboard | Período como selector; Trimestre cambia el texto y los números; Personalizar → Widgets → bajar con la rueda hasta "Calendario de viajes"; Cancelar | OK | Último mes: "Del 23/09/2026 al 22/10/2026", 14 viajes. Trimestre: "Del 01/08/2026 al 22/10/2026 · comparado con el 01/05/2026 al 22/07/2026", 15 viajes y 1.384 km. La lista de widgets baja con la rueda hasta "Calendario de viajes"; Cancelar no guarda nada |
| 7a | Cuenta corriente | Cuatro botones por fila, los que no aplican grises con el motivo | OK | Facturas: Ver detalle · Editar (gris, "Solo se editan los recibos") · Ver PDF · Anular (gris, "Solo se anulan los recibos"). Recibos: los cuatro habilitados |
| 7b | Cuenta corriente | El ojo de una factura abre la vista completa | OK | "Ver factura FAC-00000001", en solo lectura (ningún campo se puede editar), con el pie "Cerrar" |
| 7c | Cuenta corriente | Ver PDF con "Enviar por e-mail" en el pie | OK | "Ver PDF del comprobante FAC-00000001" muestra el PDF; el pie es Cerrar · Enviar por e-mail · Imprimir · Descargar PDF. **No se envió nada** |
| 7d | Cuenta corriente | Desplegar una factura con aplicados → grupo con la barra azul | OK | FAC-00000001 y REC-00000001 quedan agrupadas, con la barra azul de 3 px (`#435ebe`) en la factura y en lo aplicado |
| 8 | Cuenta corriente | Registrar recibo a distribuidora-powerful S.A. con $ 100.000 y Distribuir | FALLA (F1) | "No se pudieron cargar las facturas pendientes." No se llegó a Distribuir ni a Emitir |
| 9 | Presupuestos | Registrar presupuesto con mapa, km, tiempo estimado y Guardar | OK | El mapa dibuja la ruta y completa 710 km; tiempo estimado "34:00"; importe 1.775.000 ($ 2.500 por km); se guardó el N° 7 |
| 10 | Gestionar viajes | La banderita abre la ventana de tarjetas; Cancelar | OK | "Cambiar estado del viaje #39", tarjeta "En viaje"; Cancelar y el viaje sigue en Registrado |
| 11 | Clientes y Configuración | "Nombre comercial" en el formulario; la opción se llama "Gestionar tipos de comprobante" | OK | Visto en "Registrar cliente" (cancelado sin guardar) y en el menú |

## Fallas (una sección por falla, la más grave primero)

### F1 — Registrar recibo no carga las facturas pendientes del cliente
- Gravedad: **Alta** (bloquea el registro de recibos con imputación)
- Dónde: Gestionar cuenta corriente → Registrar recibo → Cliente
- Pasos para reproducir: 1. Abrir Gestionar cuenta corriente. 2. Registrar recibo. 3. Elegir el cliente
  "distribuidora-powerful S.A." (tiene 4 facturas pendientes).
- Esperado: la tabla lista FAC-00000004, FAC-00000005, FAC-00000007 y FAC-00000012 para poder distribuir el importe.
- Obtenido: la tabla dice "No se pudieron cargar las facturas pendientes." y arriba sale "No se pudieron cargar las
  facturas pendientes. Probá de nuevo."
- Consola / red: `GET /api/clientes/3/comprobantes-pendientes` → **200 OK** con las 4 facturas y un recibo. En la consola no
  aparece nada, porque el `catch` se traga el error.
- Causa (vista en el código): `assets/static/js/cuenta-corriente-clientes.js:948` dice
  `porId('recibofacturas')`, con la **f minúscula**, pero el id es `reciboFacturas`. Esa línea devuelve `null` y el
  `.querySelectorAll` tira un TypeError, que el `catch` de la línea 950 muestra como error de carga. Lo confirmé en la
  página: `document.getElementById('recibofacturas')` da `null` y `getElementById('reciboFacturas')` existe. La línea entró
  en el **merge `aea9740`** (22/10, facturación de Facu); no está en `e0779bf` (rama de Facu) ni en el primer padre del
  merge. Probablemente pase lo mismo al editar un recibo, porque usa la misma función. Sin corregir.
- Por qué no lo detectaron las pruebas de la Mac: al tragarse el error no queda nada en la consola, y con la API falsa
  seguramente no se eligió un cliente dentro del modal.

### F2 — El manual de usuario no muestra el PDF (la API tarda 29 s y devuelve 500)
- Gravedad: Media (el manual no se puede leer, pero no bloquea la operación)
- Dónde: Documentación → Consultar manual de usuario; `GET /api/Documentacion/manual/pdf`
- Pasos para reproducir: 1. Abrir "Consultar manual de usuario". 2. Esperar.
- Esperado: el PDF del manual en el visor, con "Descargar PDF".
- Obtenido: "Cargando…" durante unos 29 s; después queda "Publicado el 20/10/2026." sin el PDF (el aviso de error
  desaparece solo).
- Consola / red: `GET /api/Documentacion/manual/pdf` → **500** a los 28,8 s y a los 29,6 s (lo probé dos veces), con
  `{"message":"No se pudo procesar la documentación. Verificá la conexión y la instalación de las tablas."}`. El pedido de
  los datos del manual (`GET /api/Documentacion/manual`) responde enseguida.
- Causa probable: en `DocumentacionController.cs:127-130`, el `SELECT Pdf FROM dbo.MANUAL_USUARIO` con `ExecuteScalar` se
  corta a los 30 s (el tiempo por defecto de `SqlCommand`). Puede ser un PDF muy grande guardado en la base (Azure lento) o
  un bloqueo sobre esa columna. No es del código de este push: el controller no cambia desde `04a394b` (18/10). Para
  confirmarlo, Rocío puede correr
  `SELECT DATALENGTH(Pdf) FROM dbo.MANUAL_USUARIO WHERE ManualUsuario_ID = 1;` (solo lectura; yo no la corrí). Además, el
  texto del 500 es técnico para quien usa el sistema (§9).

### F3 — Los informes de versión 2.5 y 2.00 no tienen PDF
- Gravedad: Media (dato faltante; la versión 1.00 no se probó)
- Dónde: Documentación → Consultar informe de versión; `GET /api/Documentacion/versiones/4/pdf` y `/versiones/3/pdf`
- Pasos para reproducir: 1. Abrir "Consultar informe de versión" (intenta mostrar la 2.5 sola). 2. Tocar el ojo de la 2.00.
- Esperado: el PDF de cada versión.
- Obtenido: 404 en las dos y el aviso "No se pudo cargar el PDF. Probá de nuevo." cada vez.
- Causa: `DocumentacionController.cs:131` devuelve 404 cuando la columna `Pdf` de `dbo.VERSIONES` es NULL. Faltan cargar
  los PDF de `Version_ID` 3 y 4. Mejora: con un 404 el mensaje debería decir que la versión no tiene informe cargado, no
  "Probá de nuevo", porque reintentar no sirve.

## Mejoras sugeridas
- **Presupuestos, importe calculado:** se ve `1775000.00` y la ayuda dice "$ 2500 por km × 710.0 km". Tendría que verse con
  `SGTL.monto` ("$ 1.775.000,00", "$ 2.500") y la distancia con coma ("710,0 km") (§7.3). La lista de presupuestos sí lo
  muestra bien ("710,0", "$ 1.775.000,00").
- **Listar y Gestionar viajes:** los km se ven con punto ("67.5"); en presupuestos se ven con coma ("707,5").
- **Presupuestos, tiempo estimado:** "34:00" se puede leer como una hora del día; sería más claro "34 h" o "1 día y 10 h".
- **Presupuestos, e-mail:** al elegir el cliente se completa solo con su e-mail real (una dirección de Gmail). Lo cambié a
  `administracion@example.com` antes de guardar. Ojo si alguien después toca "Enviar por e-mail" en un presupuesto de prueba.
- **Presupuestos, chofer:** la lista muestra "CLAUDE, PRUEBACLAUDE" y "Prueba, Fede": son datos de prueba visibles para la
  tesis (§3 del instructivo). Conviene renombrarlos o inactivarlos.
- **Presupuestos, guardar:** después de Guardar, el modal se cerró y el presupuesto apareció en la lista, pero no llegué a
  ver el toast de éxito (lo revisé a los 4 s). Conviene mirarlo a mano.
- **Dashboard:** con la ventana angosta (unos 690 px), el botón "Personalizar" queda fuera de la pantalla y no se puede
  usar. Con 1366 px se ve bien.
- **Dashboard:** porcentajes como "+69000 %" y "+157465 %" (Último mes, porque el mes anterior casi no tiene datos) no
  llevan separador de miles y sorprenden. Sugiero "+69.000 %" o "Sin datos del período anterior" cuando la base es casi 0.
- **Cuenta corriente, ver factura FAC-00000001:** Letra, Sucursal e IVA se ven "—" aunque el IVA calculado es
  $ 423.219,30. Además, la vista de solo lectura muestra asteriscos de obligatorio, que ahí no hacen falta.
- **Cuenta corriente, botones grises:** el `aria-label` del botón deshabilitado es el motivo ("Solo se editan los
  recibos") y no la acción. Para un lector de pantalla podría ser "Editar: solo se editan los recibos".
- **Gestionar viajes:** la fila tiene Editar · Cambiar estado · Eliminar, sin "Ver detalle" (§1.4). Si es a propósito, ignorar.
- **Menú:** "Auditoría" es la única opción que no empieza con verbo (§6.1); por ejemplo, "Consultar auditoría".

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre que se le puso | Qué se hizo |
|---|---|---|---|---|
| Gestionar presupuestos | Presupuestos (dbo.PRESUPUESTOS, verificar el nombre) | 7 | distribuidora-powerful S.A. · claros del bosque → Sede Temperley · 22/10/2026 · 710 km · $ 1.775.000,00 · e-mail administracion@example.com · validez "15 días" · pago "Transferencia bancaria a 30 días" · camión ERS783 · inicio 27/10/2026 08:00 · fin 28/10/2026 18:00 | Alta (estado Pendiente) |

No se creó ni se emitió ningún recibo (el paso 8 se cortó antes de Distribuir). No se envió ningún e-mail ni WhatsApp, y
no se cambió el estado de ningún viaje.

## SQL de limpieza propuesto (NO ejecutado)
Revisá los nombres de la tabla y de las columnas antes de correrlo (no los verifiqué contra el esquema):

```sql
BEGIN TRAN;
DELETE FROM dbo.PRESUPUESTOS
WHERE Presupuesto_ID = 7
  AND Cliente_ID = 3
  AND Email = 'administracion@example.com'
  AND CAST(FechaCreacion AS date) = '2026-10-22';
SELECT @@ROWCOUNT;  -- tiene que dar 1
-- COMMIT; o ROLLBACK;
```

Rocío decide si lo borra o lo deja como dato de muestra.

**Corrección hecha en la Mac (22/10):** `dbo.PRESUPUESTOS` no tiene `Cliente_ID` ni `Email`: guarda el presupuesto como JSON en
`Datos` (`database/presupuestos/01_crear_presupuestos.sql`). El SQL de arriba fallaría. Este es el que corresponde:

```sql
BEGIN TRAN;
DELETE FROM dbo.PRESUPUESTOS
WHERE Presupuesto_ID = 7
  AND Estado = 'Pendiente'
  AND ViajeID IS NULL
  AND Datos LIKE '%administracion@example.com%'
  AND CAST(FechaAlta AS date) = '2026-10-22';
SELECT @@ROWCOUNT;  -- tiene que dar 1
-- COMMIT; o ROLLBACK;
```
