# Reporte de pruebas — Juego de demo de facturación — 25/10/2026

> Reporte de la sesión de la VM, con `docs/equipo/INSTRUCTIVO-DEMO-FACTURACION.md` después de la limpieza de la §38. Al
> copiarlo al repo se quitaron los CUIT, un e-mail de cliente y el nombre de otra persona usuaria (§7 de `docs/README.md`).

## Entorno
- Rama / commit: rocionuvoli @ abe3398 Limpieza: el 04 no vuelve a borrar si ya se limpió, salvo que se pida a propósito
  (`git status` limpio al empezar y al terminar).
- API: http://localhost:50222/api (OK: IIS Express responde).
- Front: Five Server, puerto 5500, en el navegador integrado (ancho angosto, unos 470 px: se ve el diseño de celular).
- Usuario: **rnuvoli** (Rocio Nuvoli). Al abrir estaba la sesión de otra persona usuaria; Rocío cerró sesión y entró como
  rnuvoli antes de generar nada.
- Alcance pedido: `docs/equipo/INSTRUCTIVO-DEMO-FACTURACION.md`, pasos 1 a 6, en orden. Con permiso de Rocío para generar
  proformas, emitir comprobantes y registrar el recibo y la nota de crédito, **solo los del instructivo**. Sin e-mails y sin
  tocar choferes ni estados que manden WhatsApp.

## Resumen
Se hizo todo el instructivo y **todos los números e importes salieron como se esperaba**: PF-00000001, PF-00000002 y
PF-00000003; FAC-00000001 y FAC-00000002; REC-00000001 y NC-00000001. Cada importe coincide con el de sus viajes y con la
tabla del instructivo. Tableros (Facturación) cuadra con los comprobantes. No se mandó ningún e-mail ni WhatsApp y no hubo
errores en la consola.

Encontré una falla media: el enlace "Ver la cuenta corriente del cliente" no filtra por el cliente. También anoté mejoras
de usabilidad y del design system en las pantallas usadas. La más importante: el adicional de Rukas no se ve como
concepto propio.

**Cómo se cargó el Excel de Rukas:** el navegador integrado no tiene selector de archivos. Por eso se le pasó a la zona
"Arrastralo acá o elegilo" el mismo archivo del repo (`docs/pruebas/datos/proforma-rukas-caso1-todo-ok (PROFORMA NRO
990110).xlsx`, servido por Five Server), simulando que se arrastra y se suelta. La pantalla lo leyó e importó por su
camino normal; el resultado es el mismo que elegirlo a mano.

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | Entorno | Commit, git, API, front, usuario | OK | abe3398; repo limpio; API y Five Server responden; usuario rnuvoli |
| 2 | §0 Gestionar proformas | Tiene que estar vacía | OK | "No hay resultados para los filtros elegidos.", sin filtros puestos |
| 3 | §0 Gestionar cuenta corriente | Tiene que estar vacía | OK | Saldo actual $ 0,00, sin comprobantes |
| 4 | Viajes 43, 44, 38, 25, 26 | Importe y estado antes de empezar | OK | 43: $ 600.000,00, Entregado · 44: $ 407.089,00, Entregado · 38: $ 429.101,00, Entregado · 25 (990001): $ 429.101,00, Listo para facturar · 26 (990002): $ 278.028,00, Listo para facturar · ninguno en una proforma |
| 5 | §1.1 Registrar proforma (Alimentos La Serena S.A.) | Período 01/10 al 25/10/2026, Traer viajes, Guardar borrador | OK | Trajo solo V43 $ 600.000,00 y V44 $ 407.089,00, más el aviso de 8 viajes no entregados (#45 a #52, que no se agregaron). "Borrador guardado.", Proforma_ID 56 |
| 6 | §1.2 Generar proforma | Número e importes | OK | **PF-00000001**. Neto $ 1.007.089,00 · IVA $ 211.488,69 · total **$ 1.218.577,69** (igual que el instructivo y que la suma de los viajes) |
| 7 | §1.3 Marcar aceptada | Confirmación y estado | OK | "¿Marcar la proforma PF-00000001 como aceptada?" → "Proforma aceptada." |
| 8 | §1.4 Emitir factura | Número, importe y viajes | OK | **FAC-00000001**, Factura A, sucursal 0002, $ 1.218.577,69, emisión 25/10/2026, vencimiento 04/11/2026. PF-00000001 pasó a Facturada. Viajes 43 y 44 → Facturado, con el mismo importe |
| 9 | §1.5 Registrar recibo | Cancelar FAC-00000001 entera por transferencia | OK | **REC-00000001** (letra X, sucursal 0001), referencia "TRF 0458-20261025", $ 1.218.577,69 imputados a FAC-00000001. "Recibo emitido: REC-00000001.". Saldo de La Serena **$ 0,00**; FAC-00000001 Cancelado |
| 10 | §2.1 Registrar proforma (Servicios Ambientales S.A.) | Traer viajes, Guardar borrador | OK | Trajo solo V38 $ 429.101,00 ("Se agregó 1 viaje."). Proforma_ID 57 |
| 11 | §2.2 Generar proforma | Número e importes | OK | **PF-00000002**. Neto $ 429.101,00 · IVA $ 90.111,21 · total **$ 519.212,21** |
| 12 | §2.3 Marcar aceptada, sin comprobante | Estado | OK | Aceptada, sin factura. El viaje 38 sigue Entregado, en PF-00000002 |
| 13 | §3.1 Registrar proforma QUICKFOOD con el Excel caso 1 | Control contra los viajes | OK | "Lista para generar: los 2 transportes coinciden". 990001: Rukas $ 429.101 = SGTL $ 429.101 · 990002: Rukas $ 278.028 = SGTL $ 278.028 + adicional $ 15.000. Borrador Proforma_ID 58 (Rukas 990110) |
| 14 | §3.2 Generar proforma | Número, estado e importes | OK | Confirmación en el pie → **PF-00000003**, nace Aceptada. Neto $ 722.129,00 · IVA $ 151.647,09 · total **$ 873.776,09**. Viajes 25 y 26 en PF-00000003 |
| 15 | §3.3 Emitir factura | Número, importe y viajes | OK | **FAC-00000002**, Factura A, sucursal 0002, $ 873.776,09, vencimiento 04/11/2026. Viajes 25 y 26 → Facturado. Sin recibo: queda con saldo |
| 16 | §4 Nota de crédito parcial | $ 50.000 de neto más IVA sobre FAC-00000002 | OK | La pantalla sí permite una nota parcial (se carga el total con IVA, ver mejora 3). Total a acreditar $ 60.500,00 → neto **$ 50.000,00** + IVA $ 10.500,00, aplicado a FAC-00000002. **NC-00000001** (A, sucursal 0002), concepto "Bonificación acordada con el cliente" |
| 17 | §4 Saldo de QUICKFOOD | Tiene que bajar $ 60.500,00 | OK | $ 873.776,09 → **$ 813.276,09**. FAC-00000002 Parcial (cancelado $ 60.500,00). Ni la proforma ni la factura se anularon |
| 18 | §5 Lo que queda sin tocar | Viaje 5 y viajes de QUICKFOOD | OK | Viaje 5: Entregado, sin proforma. Viajes 3, 4, 6, 7, 8, 9, 11 y 12 (QUICKFOOD): Listo para facturar, sin proforma |
| 19 | §6 Tableros → Facturación | Lo facturado coincide con los comprobantes | OK | Top clientes: La Serena $ 1.218.577,69 · QUICKFOOD $ 813.276,09 (FAC-00000002 menos NC-00000001). Octubre: total $ 2.031.854 (= $ 2.031.853,78 redondeado). Deuda: QUICKFOOD $ 813.276 por vencer, nada vencido |
| 20 | Consola | Errores en las pantallas usadas | OK | Sin errores en Gestionar proformas, Gestionar cuenta corriente ni Tableros |
| 21 | Enlace "Ver la cuenta corriente del cliente" | Abrir la cuenta del cliente desde la factura emitida | FALLA | Ver F1 |

## Fallas

### F1 — "Ver la cuenta corriente del cliente" no filtra por el cliente
- Gravedad: Media (molesta en la demo; se elige el cliente a mano).
- Dónde: Gestionar proformas → Emitir factura → mensaje de éxito → "Ver la cuenta corriente del cliente"
  (`cuenta-corriente-clientes.html?clienteId=N`).
- Pasos para reproducir: 1. Abrí `cuenta-corriente-clientes.html?clienteId=2` (la dirección que arma ese enlace para
  QUICKFOOD). 2. Mirá el filtro Cliente y la grilla. 3. Tocá "Registrar recibo".
- Esperado: la cuenta corriente filtrada por QUICKFOOD y el recibo con el cliente ya elegido.
- Obtenido: el filtro queda en "Todos los clientes", la grilla muestra FAC-00000001 (La Serena) y FAC-00000002 (QUICKFOOD),
  y el saldo es el de todos. En "Registrar recibo" el cliente queda en "Seleccioná un cliente".
- Consola / red: sin errores.
- Causa probable: `assets/static/js/facturacion-proforma.js:273` arma el enlace con `?clienteId=`, pero
  `assets/static/js/cuenta-corriente-clientes.js` nunca lee `location.search`: solo usa `URLSearchParams` para armar
  pedidos a la API (líneas 501 y 1524). No lo corregí.

## Mejoras sugeridas
(De la que más molesta a la que menos. Formato: dónde · texto actual · problema · propuesta.)

1. **El adicional de Rukas no se ve en la proforma ni en la factura.** Gestionar proformas → PF-00000003 → detalle.
   Actual: dos líneas, "Transporte 990001 · SEDE QUILMES - SEDE BANFIELD" por $ 429.101,00 y "Transporte 990002 · SEDE
   QUILMES - SEDE BANFIELD" por **$ 293.028,00** (los $ 278.028 del viaje más los $ 15.000 de adicional sumados en la
   misma línea). Problema: falta algo (punto 4). El cliente ve un 990002 por $ 293.028 que no coincide con su tarifa, y
   el adicional no aparece por ningún lado. Propuesta: una línea aparte "Adicional transporte 990002" por $ 15.000,00, o
   al menos la descripción "Incluye adicional de $ 15.000,00". No abrí el PDF de la factura para ver cómo sale.
2. **No hay confirmación al generar una proforma propia y sí en la de Rukas.** Registrar o Editar proforma (propia) →
   "Generar proforma". Hoy genera directo y consume un PF- que no se recupera; la de Rukas pide "¿Generar la proforma de
   Rukas 990110? Se le asigna número y queda aceptada, lista para facturar.". Problema: las dos hacen lo mismo y se
   comportan distinto (punto 5). Propuesta: `SGTL.confirmar` "¿Generar la proforma? Se le asigna el número y ya no se
   puede editar." con el verbo "Generar".
3. **La nota de crédito se carga con IVA incluido.** Emitir nota de crédito → "Importe total a acreditar". Para "$ 50.000
   de neto más IVA" hubo que calcular a mano $ 60.500,00; el neto se completa solo y no se puede escribir. Problema: falta
   algo (punto 4); la administración piensa la bonificación en neto. Propuesta: poder escribir el neto (o elegir "neto" o
   "total") y que el total y la distribución se calculen solos.
4. **El número de la factura emitida queda abajo.** Emitir factura → después de emitir. Arriba dice "Factura emitida.",
   pero "FAC-00000001 · $ 1.218.577,69" queda debajo de todo el formulario (con la pantalla angosta hay que bajar). El
   recibo y la nota de crédito sí lo dicen en el aviso ("Recibo emitido: REC-00000001."). Propuesta: "Factura emitida:
   FAC-00000001." arriba (o en el aviso) y los botones Imprimir y Descargar PDF en el pie. Además, contra el design system
   (§6.2 y §6.3), en `facturacion-proforma.js:101-130`:
   - el modal no tiene `data-bs-backdrop="static"`;
   - el pie dice "Cerrar" en lugar de "Cancelar" + "Emitir factura";
   - Tipo de comprobante, N° comprobante y Total a facturar son campos de solo lectura, no texto (`.sgtl-dato-fijo`).
5. **El aviso de "Traer viajes" es amarillo aunque salga bien, y la lista viene desordenada.** Registrar proforma → Traer
   viajes. Actual: "Se agregaron 2 viajes. Atención: No se trajeron 8 viajes que todavía no están en estado Entregado:
   #45, #46, #49, #47, #48, #50, #51, #52.", todo en una alerta amarilla. Con un solo viaje, "Se agregó 1 viaje." también
   sale en amarillo. Problemas: puntos 1 y 3. Propuesta: el éxito aparte y la advertencia ordenada: "Se agregaron 2
   viajes." + "8 viajes del período no se trajeron porque todavía no se entregaron: 45, 46, 47, 48, 49, 50, 51 y 52."
6. **En la cuenta corriente, la fila del recibo o de la nota muestra el saldo de la factura.** Grilla de Gestionar cuenta
   corriente → desplegar FAC-00000002. La fila de NC-00000001 dice "Saldo $ 813.276,09" y la de REC-00000001 "$ 0,00".
   Parece que la nota de crédito tiene saldo propio (punto 3). Propuesta: "—" en la columna Saldo de las filas aplicadas,
   o una columna "Saldo de la factura después".
7. **Ver nota de crédito NC-00000001** (y el resto de los "Ver" de la cuenta corriente). Es el formulario de emitir con
   los campos deshabilitados. Arriba dice "Generación manual para la cuenta corriente." y "Consulta de solo lectura. Los
   datos del comprobante no se pueden modificar.". Problemas: punto 2 (los dos textos sobran) y punto 5 (§6.2: el
   detalle va con bloques `.sgtl-dato` y solo "Cerrar"). Propuesta: detalle como texto, con el estado en el título.
8. **Campos que no se editan se ven como campos.** Contra §6.3:
   - Registrar recibo: "Tipo de comprobante" (input deshabilitado con "Recibo") y "N° comprobante" (solo lectura).
   - Emitir nota de crédito: "Importe neto *" e "IVA calculado", de solo lectura. El asterisco rojo en un campo que no se
     puede escribir confunde.

   Propuesta: mostrarlos con `.sgtl-dato-fijo`.
9. **Montos con `type="number"` en el detalle de la proforma propia.** `gestion-facturacion.html:695-698`: Cant., P.
   Unit. y Desc.% usan `type="number"` (§7.3: nunca para plata). Propuesta: `type="text" inputmode="decimal"` con
   `SGTL.enlazarMascaraMonto` para P. Unit.
10. **Montos sin centavos o redondeados.**
    - Control de Rukas: "Importe Rukas", "Importe SGTL" y "Adicionales" se ven "$ 429.101" y "$ 15.000", sin ",00".
    - Tableros → Facturación: "Facturación por cliente y por mes" muestra "$ 1.218.578" y "$ 2.031.854" junto a "Top
      clientes" con "$ 1.218.577,69". En la demo puede parecer que no cuadra por 31 centavos.

    Propuesta: `SGTL.monto` ("$ 1.234,56") en las tablas, y redondeo solo en los ejes y las etiquetas de los gráficos.
11. **"Costo por viaje" en Tableros → Facturación.** Actual: "Costo por viaje $ 567.464 · Total $ 18.158.840". Es el
    importe promedio que se le cobra al cliente: el total es el de "Ingresos por camión". Problema: punto 3 ("costo"
    hace pensar en lo que le cuesta a la empresa). Propuesta: "Importe promedio por viaje".
12. **El selector de cliente muestra el CUIT de dos formas.** En Gestionar proformas, "QUICKFOOD S.A. · (CUIT con
    guiones)"; en Gestionar cuenta corriente, "QUICKFOOD S.A. — (CUIT sin guiones)". Propuesta: el mismo formato (con
    guiones) y el mismo separador en las dos.
13. **Flecha ASCII en el concepto de los viajes.** Concepto de las líneas traídas: "Viaje Planta Córdoba Norte -> Depósito
    Villa Carlos Paz". La guía de viajes de Rukas usa "→". Propuesta: "→" también acá (o "a": "Viaje de Planta Córdoba
    Norte a Depósito Villa Carlos Paz").
14. **Sucursal propuesta distinta en cada comprobante.** La factura y la nota de crédito proponen "0002 · Caja central"; el
    recibo, "0001 · Administración". En la lista hay "0003 · caja 2", con minúscula (dato de Configuración → facturación).
    No sé si es a propósito: lo anoto para que Rocío lo decida.
15. **Documentación: estado de los viajes de una proforma propia.** `docs/equipo/PRUEBAS-VM-CLAUDE.md` §3 dice que, al
    generar una proforma, sus viajes "quedan en esa proforma, en Listo para facturar". En la práctica, los viajes 43, 44 y
    38 siguieron en **Entregado** con la proforma Generada y Aceptada (enlazados a la proforma), y pasaron a Facturado
    con la factura. Propuesta: corregir el instructivo (o el sistema, si lo que vale es el texto).

**Datos raros vistos (no son míos, no los toqué):**
- Gestionar cuenta corriente → selector de cliente: "distribuidora-powerful S.A." parece un dato de prueba. Va a aparecer
  en la demo.
- QUICKFOOD S.A. tiene cargado un e-mail @gmail.com (se ve en el recuadro del cliente de la proforma). No es
  `@example.com`: si en la demo alguien usa "Enviar por e-mail", el destinatario sugerido es un gmail que podría existir.

## Datos de prueba creados o modificados
Son los documentos de la demo: **se quedan** (pedido del instructivo).

| Pantalla | Tabla | ID | Nombre que se le puso | Qué se hizo |
|---|---|---|---|---|
| Gestionar proformas | PROFORMAS (+ PROFORMA_DETALLE, PROFORMAS_VIAJES) | 56 | PF-00000001 · Alimentos La Serena S.A. · viajes 43 y 44 | Registrada, generada, aceptada y facturada |
| Gestionar proformas | PROFORMAS (+ PROFORMA_DETALLE, PROFORMAS_VIAJES) | 57 | PF-00000002 · Servicios Ambientales S.A. · viaje 38 | Registrada, generada y aceptada (sin comprobante) |
| Gestionar proformas | PROFORMAS (+ PROFORMA_PLATAFORMA_LINEA, PROFORMA_ADJUNTO, PROFORMAS_VIAJES) | 58 | PF-00000003 · QUICKFOOD S.A. · Rukas 990110 · viajes 25 y 26 | Importada del Excel caso 1, generada (nace Aceptada) y facturada |
| Gestionar proformas → Emitir factura | COMPROBANTES (+ COMPROBANTES_PROFORMAS, CUENTA_CORRIENTE_MOVIMIENTOS) | 35 | FAC-00000001 · $ 1.218.577,69 | Emitida desde PF-00000001 |
| Gestionar cuenta corriente → Registrar recibo | COMPROBANTES (+ RECIBOS_FORMAS_PAGO, CUENTA_CORRIENTE_APLICACIONES) | 36 | REC-00000001 · transferencia "TRF 0458-20261025" · $ 1.218.577,69 | Emitido e imputado entero a FAC-00000001 |
| Gestionar proformas → Emitir factura | COMPROBANTES (+ COMPROBANTES_PROFORMAS, CUENTA_CORRIENTE_MOVIMIENTOS) | 37 | FAC-00000002 · $ 873.776,09 | Emitida desde PF-00000003 (sin recibo) |
| Gestionar cuenta corriente → Emitir nota de crédito | COMPROBANTES (+ CUENTA_CORRIENTE_APLICACIONES) | 38 | NC-00000001 · "Bonificación acordada con el cliente" · $ 60.500,00 | Emitida y aplicada a FAC-00000002 (neto $ 50.000 + IVA $ 10.500) |
| (por las facturas) | VIAJES | 43, 44, 25, 26 | — | Pasaron a Facturado; mismo importe |
| (por PF-00000002) | VIAJES | 38 | — | Queda en PF-00000002 (Aceptada), sigue Entregado |

Numeración consumida: PF 1 a 3, FAC 1 y 2, REC 1, NC 1. No se envió nada por e-mail, no se tocaron choferes ni estados
de viaje y no se cambiaron estrellas de Tableros (solo hubo lecturas de `api/tableros/favoritos`).

## SQL de limpieza propuesto (NO ejecutado)
No corresponde: estos documentos son la demo y se quedan (`INSTRUCTIVO-DEMO-FACTURACION.md` §6).
