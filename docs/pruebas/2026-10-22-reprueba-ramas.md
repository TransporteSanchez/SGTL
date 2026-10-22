# Reporte de pruebas — reprueba antes de pasar las ramas — 22/10/2026

## Resumen para decidir

**Los 8 puntos dieron OK.** El registro de recibos (el paso 8 de §23, que antes fallaba) ahora carga las facturas,
distribuye bien y emite. No apareció ningún error de JavaScript en la consola. No encontré fallas nuevas; abajo quedan
algunas mejoras chicas.

| # | Punto | Resultado |
|---|---|---|
| 1 | Registrar recibo: carga de facturas, Distribuir, Emitir y Editar recibo | OK. Se emitió el REC-00000014 con tu OK |
| 2 | Ver factura FAC-00000001 (letra, sucursal, IVA 21%, sin asteriscos); en Registrar recibo los asteriscos siguen | OK |
| 3 | Editar presupuesto N° 7: importe, ayuda de la tarifa y tiempo estimado | OK |
| 4 | Dashboard, Último mes: porcentajes con punto de miles | OK |
| 5 | Informe de versión 2.5: aviso en la página, sin el aviso rojo | OK |
| 6 | Menú: "Gestionar tipos de comprobante" en Facturación | OK |
| 7 | Grupos y permisos: el permiso nuevo en Facturación | OK |
| 8 | Proformas: Ver PDF como vista previa (fila y formulario, común y Rukas) | OK |

**Datos creados en esta ronda:**

| Pantalla | Tabla | ID | Qué es |
|---|---|---|---|
| Gestionar cuenta corriente | Comprobantes (recibo) | 32 | **REC-00000014**, distribuidora-powerful S.A. (cliente 3), 22/10/2026, Transferencia con referencia `TRF-00458213`, $ 100.000,00: aplica $ 26.925,82 a FAC-00000004 y $ 73.074,18 a FAC-00000005 |

Sigue en la base, de la prueba anterior, el presupuesto N° 7 (no se modificó en esta ronda).

## Entorno
- Rama / commit: rocionuvoli @ c778c0a Proformas: Ver PDF abre la vista previa, como presupuestos y cuenta corriente (`git status` limpio)
- API: http://localhost:50222/api (OK)
- Front: Live Server puerto 5500 (el 5502 no responde). Recargué sin caché (Ctrl+Shift+R) y confirmé que el JS que se sirve es el nuevo.
- Navegador: el integrado de Claude, sesión iniciada por Rocío (RNUVOLI), con la ventana en 1366 × 850
- Alcance pedido: 8 puntos de §21 y §23 de `docs/PENDIENTES-SISTEMA.md` (lista de Rocío)

## Resumen
8 pruebas, 0 fallas. La única escritura en la base fue el `POST /api/recibos` → 201 (REC-00000014). Los únicos errores rojos
de la consola son de red y ya conocidos: `GET /api/DashboardLayout` → 404 (la API todavía no lo tiene) y
`GET /api/Documentacion/versiones/4/pdf` → 404 (la 2.5 no tiene PDF, que es justo lo que prueba el punto 5).

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1a | Cuenta corriente → Registrar recibo | Elegir un cliente con facturas pendientes | OK | distribuidora-powerful S.A.: cargan FAC-00000004 ($ 26.925,82, vence 14/10), FAC-00000005 ($ 372.900,92, vence 14/10), FAC-00000007 ($ 309.760,00, vence 22/10) y FAC-00000012 ($ 82.280,00, vence 30/10) |
| 1b | Registrar recibo | Importe $ 100.000 + Distribuir | OK | FAC-00000004 → $ 26.925,82 (la cancela) y FAC-00000005 → $ 73.074,18; las otras en $ 0,00. Total, aplicado y diferencia: $ 100.000,00 / $ 100.000,00 / $ 0,00. Las que vencen el mismo día van por número |
| 1c | Registrar recibo | Emitir (con OK de Rocío) | OK | El primer intento no se envió: "Ingresá la referencia de la transferencia o del cheque." (ver Mejoras). Con la referencia `TRF-00458213`: `POST /api/recibos` → 201, el modal se cierra y en la lista aparece REC-00000014 "Cobranza de 2 comprobantes", aplicado a las dos facturas |
| 1d | Editar recibo REC-00000014 | Abrir y cerrar sin guardar | OK | "Editar recibo · REC-00000014" con cliente, número, referencia, $ 100.000,00 y las dos aplicaciones. Cancelar: sin PUT |
| 2a | Ver factura FAC-00000001 | Letra, sucursal, IVA y asteriscos | OK | Letra "A", sucursal "0001", IVA "21%" (IVA calculado $ 423.219,30). Sin asteriscos, ningún campo editable, solo "Cerrar". Igual al abrirla por segunda vez |
| 2b | Registrar recibo (después de la factura) | Los asteriscos siguen | OK | "Cliente *", "Fecha *", "Importe *". Cancelado |
| 3 | Editar presupuesto #7 | Importe, ayuda y tiempo | OK | Importe "$ 1.775.000,00"; ayuda "Tarifa por km #2: $ 2.500,00 por km × 710,0 km."; tiempo estimado "34 h". Cancelar: sin PUT; la fila sigue igual |
| 4 | Dashboard, Último mes | Porcentajes con punto de miles | OK | "+1.300 %", "+69.000 %", "+157.465 %" |
| 5 | Consultar informe de versión → 2.5 | Aviso en la página | OK | Al abrir la pantalla y al tocar el ojo de la 2.5: "Esta versión no tiene el informe cargado." en gris en la página, sin toast rojo |
| 6 | Menú | "Gestionar tipos de comprobante" | OK | Es la última opción de Facturación (Listar proformas · Gestionar proformas · Gestionar cuenta corriente · Gestionar tipos de comprobante). Configuración quedó con Gestionar e-mail · Gestionar contenido · Gestionar integración de WhatsApp. Al entrar solo se abre Facturación, con la opción marcada, y el título lleva el ícono de Facturación (`bi-file-earmark-medical`) |
| 7 | Grupos y permisos → Permisos por grupo | Permiso nuevo | OK | Facturación: Cuenta Corriente · Gestión de proformas · **Gestión de tipos de comprobante** · Listado de proformas. Configuración: E-mail · Gestión de contenido · Integración WhatsApp (ya no figura "Facturación"). No toqué ninguna casilla ni guardé |
| 8a | Listar proformas | Ver PDF desde la fila | OK | PF-00000004: "Ver PDF de la proforma PF-00000004", con visor y Cerrar · Imprimir · Descargar PDF. No hubo descarga directa |
| 8b | Gestionar proformas | Ver PDF desde la fila, común y Rukas | OK | PF-00000001 y PF-00000010 (Rukas 990100): las dos abren la vista previa con el mismo pie; al cerrar no queda ningún fondo oscuro |
| 8c | Gestionar proformas | Ver PDF desde el formulario, común y Rukas | OK | "Ver proforma PF-00000001" y "Ver proforma PF-00000010 · Rukas 990100" → "Ver PDF" abre la vista encima (z-index 1075, sobre el fondo de 1060). Al cerrarla queda el formulario con un solo fondo: se desplaza, responde a los clics y se cierra normalmente con su "Cerrar" (probado con clics reales en Rukas) |

## Fallas
Ninguna.

## Mejoras sugeridas
- **Registrar recibo, referencia:** con forma "Transferencia" la referencia es obligatoria ("Ingresá la referencia de la
  transferencia o del cheque."), pero la etiqueta no tiene asterisco y el error sale arriba, no debajo del campo (§6.3).
  Sugiero que el asterisco aparezca o desaparezca según la forma de pago.
- **Presupuestos, texto del mapa:** debajo del mapa todavía dice "Distancia: 710.0 km, de …" con punto; la ayuda de la
  tarifa ya dice "710,0 km".
- **Listar proformas:** PF-00000004 tiene el estado "Factura" y en Gestionar proformas, "Facturada".
- **Ver proforma:** la cruz del encabezado (`btn-close`) no tiene `aria-label`, y al cerrar la vista del PDF el foco no
  vuelve al formulario. Funciona igual; es de accesibilidad.
- **Grupos y permisos:** algunos textos no siguen §9: "Auditoria" (sin tilde) y "Cuenta Corriente" (con mayúscula). En la
  lista de grupos se ve "PRUEBA-CLAUDE 20/10", un dato de prueba visible para la tesis.
- **De la ronda anterior:** el toast de éxito del presupuesto N° 7, que anoté como "no lo vi", seguramente sí salió. Mi
  verificación buscaba la clase `.toast` y los avisos del sistema usan `.sgtl-toast`. En esta ronda lo corregí, pero
  tampoco llegué a capturar el toast del recibo (lo empecé a observar después de emitir). Conviene mirarlo a mano.

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre que se le puso | Qué se hizo |
|---|---|---|---|---|
| Gestionar cuenta corriente | Comprobantes (recibo; verificar el nombre de la tabla) | 32 | REC-00000014 · distribuidora-powerful S.A. (Cliente_ID 3) · 22/10/2026 · Transferencia `TRF-00458213` · $ 100.000,00 | Emitido; aplicado $ 26.925,82 a FAC-00000004 (ComprobanteID 8) y $ 73.074,18 a FAC-00000005 (ComprobanteID 9) |

Se abrieron sin guardar: Editar recibo 32, Editar presupuesto 7, Ver factura FAC-00000001, Registrar recibo (cancelado)
y la pestaña de permisos (según lo pedido, la API renombra sola el permiso en la base al abrirla). No se envió ningún
e-mail ni WhatsApp, y no se descargó ningún archivo.

## SQL de limpieza propuesto (NO ejecutado)
**Mejor anular el recibo desde el sistema** (botón "Anular recibo" de la fila de REC-00000014): así se revierten las
aplicaciones y las facturas 4 y 5 vuelven a su saldo, con auditoría. Borrarlo por SQL deja el número 14 salteado y obliga a
borrar primero las aplicaciones. Si igual preferís SQL, revisá los nombres de las tablas y columnas antes de correrlo (no
los verifiqué contra el esquema):

```sql
BEGIN TRAN;
-- 1) Aplicaciones del recibo
DELETE FROM dbo.COMPROBANTES_APLICACIONES
WHERE ComprobanteOrigen_ID = 32
  AND ComprobanteDestino_ID IN (8, 9);
SELECT @@ROWCOUNT;  -- tiene que dar 2
-- 2) El recibo
DELETE FROM dbo.COMPROBANTES
WHERE Comprobante_ID = 32
  AND Cliente_ID = 3
  AND NumeroComprobante LIKE '%00000014'
  AND Referencia = 'TRF-00458213';
SELECT @@ROWCOUNT;  -- tiene que dar 1
-- Revisar después el saldo de FAC-00000004 y FAC-00000005 si se guarda en una columna
-- COMMIT; o ROLLBACK;
```
