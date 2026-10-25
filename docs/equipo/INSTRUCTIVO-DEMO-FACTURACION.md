# Instructivo para generar el juego de demo de facturación (para la VM)

Para la sesión de Claude Code que trabaja en la VM, **después** de la limpieza de la facturación de prueba
(`database/limpieza/04_borrar_facturacion_de_prueba.sql`, §38 de `docs/PENDIENTES-SISTEMA.md`). Las reglas de la sesión
y el formato del reporte son los de `docs/equipo/PRUEBAS-VM-CLAUDE.md`, **con una excepción que pidió Rocío para esta
tarea:** acá sí se generan proformas y se emiten comprobantes (consumen numeración), solo los de la lista de abajo y en ese
orden.

El objetivo es que la demo de la presentación tenga documentos que coincidan con sus viajes (los importes de la tabla de
tarifas) y que muestren cada parte del circuito. Todo se hace desde las pantallas, como lo haría la administración.

## 0. Antes de empezar

- Rocío ya corrió la limpieza y hizo el `COMMIT`. Ctrl+F5.
- Gestionar proformas y cuenta corriente tienen que estar vacías. Si hay algo, pará y avisale a Rocío.
- **No envíes nada por e-mail** (el de la VM no funciona) **ni cambies choferes o estados que manden WhatsApp.**
- Anotá cada número que salga (proformas, comprobantes, recibos): van en el reporte.
- En cada paso, compará el importe con el de los viajes (Ver detalle del viaje). Si algo no coincide, pará y anotalo.

## 1. Proforma propia completa (circuito entero)

Cliente **Alimentos La Serena S.A.**, viajes **43 y 44** (Entregado).

1. Gestionar proformas → Registrar proforma → el cliente → "Traer viajes": tienen que venir el 43 ($ 600.000,00) y el
   44 ($ 407.089,00). Guardar el borrador.
2. Generar proforma → tiene que salir **PF-00000001**. Neto $ 1.007.089,00, IVA 21 % $ 211.488,69, total
   **$ 1.218.577,69**.
3. Pasarla a Aceptada.
4. Emitir el comprobante de esa proforma → tiene que salir **FAC-00000001** por $ 1.218.577,69. Los viajes 43 y 44
   quedan Facturados.
5. Cuenta corriente → registrar un recibo que cancele FAC-00000001 entero (forma de pago: transferencia) → tiene que
   salir **REC-00000001**. El saldo del cliente queda en $ 0.

## 2. Proforma propia aceptada, sin comprobante

Cliente **Servicios Ambientales S.A.**, viaje **38** (Entregado, $ 429.101,00).

1. Registrar proforma → "Traer viajes" → el 38 → Guardar el borrador.
2. Generar → **PF-00000002**. Neto $ 429.101,00, IVA $ 90.111,21, total **$ 519.212,21**.
3. Pasarla a Aceptada. **No emitas el comprobante:** queda como el paso siguiente pendiente (también sirve para la
   parte C de las pruebas de tarifas).

## 3. Proforma de Rukas con su comprobante

Cliente **QUICKFOOD S.A.**, viajes **25 y 26** (Listo para facturar, N° de transporte 990001 y 990002).

1. Registrar proforma → QUICKFOOD → el Excel `docs/pruebas/datos/proforma-rukas-caso1-todo-ok (PROFORMA NRO 990110).xlsx`.
   Tienen que coincidir los dos: 990001 $ 429.101,00 (1ª vuelta) y 990002 $ 278.028,00 (2ª vuelta), más $ 15.000,00
   de adicional en el 990002.
2. Generar → **PF-00000003** (nace Aceptada). Neto $ 722.129,00, IVA $ 151.647,09, total **$ 873.776,09**.
3. Emitir el comprobante → **FAC-00000002** por $ 873.776,09. **No registres recibo:** queda con saldo pendiente en
   cuenta corriente.

## 4. Nota de crédito parcial (si la pantalla lo permite)

Sobre **FAC-00000002** (QUICKFOOD), una nota de crédito por **$ 50.000,00 de neto** (más IVA), con el motivo
"Bonificación acordada con el cliente". **Sin anular la proforma ni la factura entera.** Tiene que salir **NC-00000001**
y el saldo de QUICKFOOD baja en $ 60.500,00. Si la pantalla solo permite una nota de crédito que anula la factura entera,
**no la hagas** y anotalo.

## 5. Lo que queda sin tocar (para la presentación)

- El viaje **5** (Entregado, cliente directo) queda libre para registrar una proforma en vivo durante la presentación.
- Los viajes de QUICKFOOD 3, 4, 6, 7, 8, 9, 11 y 12 quedan en Listo para facturar (esperan su Excel de Rukas).
- Los viajes Registrados y En viaje quedan como están.

## 6. Al terminar

- Revisá en Tableros (Facturación) que lo facturado coincida con los comprobantes emitidos.
- El reporte, con el formato de `docs/equipo/PRUEBAS-VM-CLAUDE.md`: una fila por paso, cada número generado, cada
  importe comparado con sus viajes y lo que no se pudo hacer. Usá la mirada de usabilidad de la sección 1 de
  `docs/equipo/INSTRUCTIVO-PRUEBAS-TARIFAS.md` en cada pantalla.
- **No propongas SQL de limpieza:** estos documentos son la demo y se quedan.
