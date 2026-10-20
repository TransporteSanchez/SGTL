# Pruebas en la VM — merge de Facu del 20/10 (ítem 18)

## Versión probada

- Rama `rocionuvoli`, commit `d415083` (`Docs: script de Presupuestos aplicado en la base`). `git status` limpio al empezar.
- API en `http://localhost:50222/api` (IIS Express). `GET /api/Grupos` respondió 200. No se recompiló en esta ronda: ya estaba recompilada.
- Front en `http://127.0.0.1:5500/` (Live Server). El puerto 5502 no respondía. La recarga se hizo abriendo de nuevo cada pantalla; `Page.reload` con caché ignorada no llegó a ejecutarse.
- Login: RNUVOLI, rol admin.
- `database/menu/02` no se corrió (ya estaba aplicado).
- Node no está en el PATH de la VM. Los tests se corrieron con el `node.exe` v24.5.0 que trae Cursor.

## Resultado por punto

### 1. Concepto obligatorio en proformas — OK al guardar y al generar; NO PROBADO al aceptar y al facturar

**OK.** En Gestionar proformas, Registrar proforma, cliente Servicios Ambientales S.A. (Directo), una línea sin concepto:

- Guardar borrador deja el concepto en rojo (`is-invalid`, borde `rgb(220, 53, 69)`) y muestra «Completá el concepto de cada línea de la proforma.». No hay POST. El id de la proforma sigue vacío.
- Generar proforma con el concepto vacío muestra el mismo mensaje y tampoco hace POST.
- Un concepto de solo espacios («   ») frena igual.

Se canceló el modal y se descartaron los cambios. No se creó ninguna proforma.

**NO PROBADO** aceptar o facturar con concepto vacío. De las 11 proformas, ninguna está Generada o Aceptada con un concepto vacío. La única con concepto vacío es PF-00000007 (id 22), Anulada. La pantalla ya no deja guardar ni generar así, y facturar además exige estado Aceptada. No se tocó la anulada ni la generada de otro usuario (PF-00000006, FGODOY).

### 2. Vencimiento al facturar una proforma — NO PROBADO

No hay ninguna proforma Aceptada. Abrir «Emitir Factura desde Proforma» sin emitir exige ese estado. No se generó ni se aceptó una proforma (generar consume un número PF-).

### 3. Emitir recibo y comprobante — NO PROBADO

No se emitió ningún recibo ni comprobante. Hay que confirmarlo antes de generar numeración.

### 4. Solo pendientes y aplicaciones en celeste — OK en claro; FALLA el modo oscuro; «Parcialmente imputado» no se vio

**OK.** En Gestionar cuenta corriente, «Mostrar solo comprobantes pendientes» pasa a la pestaña Comprobantes sin relacionar (1–15 de 15). Las facturas y la nota de débito van primero. Al final quedan los recibos sin aplicar, con la situación «Sin imputar»:

- REC-00000005 a REC-00000008 y REC-00000011, cliente PRUEBA-CLAUDE 17/10 S.A.
- REC-00000009, QUICKFOOD S.A.
- REC-00000010, Servicios Ambientales S.A.

Al abrir FAC-00000001 se ve REC-00000001, y al abrir FAC-00000002 se ve NC-00000001. Esas filas tienen la clase `cc-credit-application-row` y fondo `rgb(224, 242, 254)` (`#e0f2fe`).

**NO PROBADO** el texto «Parcialmente imputado». En el listado actual todos los recibos sin relacionar tienen aplicado $ 0,00. No hay uno aplicado en parte y no se creó.

**FALLA** el modo oscuro. El CSS de la página pinta esas filas en `#19384a` solo con `body.theme-dark`. El tema de la app (`initTheme.js`) pone `data-bs-theme` en el `<html>` y no agrega `theme-dark`. Con `data-bs-theme="dark"` el fondo de la fila sigue en `rgb(224, 242, 254)`. Al agregar a mano la clase `theme-dark` el fondo pasa a `rgb(25, 56, 74)` y el texto del comprobante a `rgb(167, 216, 245)`. En esta pantalla no hay interruptor de tema (`#toggle-dark` no está). Se sacó la clase y el atributo al terminar; no quedó guardado en `localStorage`.

### 5. Permisos por grupo — OK

Grupo de prueba creado: **PRUEBA-CLAUDE 20/10**, id 7. Toast «Grupo registrado.».

Pestaña Permisos, ocho tarjetas: General, Choferes, Camiones, Viajes, Clientes, Facturación, Configuración, Usuarios.

- La casilla Choferes marca Gestión y Listado. Al destildar solo Listado, el padre queda a medias (`indeterminate`, sin `checked`). Un clic desde ese estado marca todo; otro clic deja todo destildado.
- Se guardó solo Dashboard. Al pasar a Administrativos y volver al grupo 7, Dashboard seguía tildado y General a medias.
- Se volvió a guardar (Dashboard) y el aviso fue «Permisos guardados.».
- Estado final del grupo 7, confirmado por `GET /api/Grupos/7/Menus`: solo Dashboard (Menu_ID 1).

### 6. Usuarios por grupo — OK en la lista; NO PROBADO el alta

En el grupo 7, sin usuarios asignados:

- Los admin salen con la insignia «admin» y sin casilla: Csanchez, FGODOY, FMONTENEGRO, RNUVOLI.
- El resto tiene casilla. Nadie muestra «En el grupo» porque el grupo está vacío.
- Sin nada tildado, «Agregar al grupo» está deshabilitado. El resumen dice «Mostrando 12 de 12. 0 están en el grupo; 0 tildados para agregar.».
- Buscar «maria» muestra «No hay usuarios que coincidan con la búsqueda.». Ningún usuario tiene tilde en el nombre. Buscar «Agustín» encuentra a aguspaidw4 (Agustin Nicolas Pai).
- Con ese usuario tildado, al borrar la búsqueda la casilla sigue marcada, el botón se habilita y el resumen dice «1 tildado para agregar.». Se destildó de nuevo. No se agregó a nadie.

**NO PROBADO** el toast «Se agregó 1 usuario al grupo.» y el paso a «En el grupo».

### 7. Presupuestos para un usuario no admin — NO PROBADO

En el grupo Administradores (id 1) hay un usuario no admin: **aguspaidw4** (rol `user`, `Asignado` true). El resto de asignados a ese grupo no aparece en el listado de usuarios. No se inició sesión con aguspaidw4, así que no se vio si Presupuestos le sale en el menú. Con RNUVOLI (admin) el ítem «Gestionar presupuestos» sí está en el lateral.

### 8. Tests de Node — OK

Cada archivo de `tests/` imprimió OK y salió con código 0:

- `cuenta-corriente-pendientes.test.js`
- `emision-comprobantes.test.js`
- `facturacion-proforma.test.js`
- `permisos-agrupados.test.js`
- `permisos-presupuestos.test.js`
- `recibos-asociados.test.js`
- `usuarios-por-grupo.test.js`

Leen el código fuente; no pegan a la API.

## Consola

En proformas, grupos y cuenta corriente no se capturó ningún error de JavaScript después de instalar el listener. El listener se colgó con la página ya cargada, así que no cubre errores de la carga inicial.

## Registros creados o modificados

- Grupo id 7, nombre `PRUEBA-CLAUDE 20/10`.
- `GRUPOS_MENU` de ese grupo: una fila, MenuID 1 (Dashboard).
- No se crearon proformas, facturas, recibos ni vínculos de usuario.

## SQL de limpieza

No se ejecutó. Revisar los `@@ROWCOUNT` antes de confirmar.

```sql
BEGIN TRAN;

DELETE FROM dbo.GRUPOS_MENU
WHERE GrupoID = 7;

SELECT @@ROWCOUNT AS menus_borrados; -- esperado: 1

DELETE FROM dbo.GRUPOS
WHERE Grupo_ID = 7
  AND Grupo_Nombre = 'PRUEBA-CLAUDE 20/10';

SELECT @@ROWCOUNT AS grupos_borrados; -- esperado: 1

-- COMMIT; o ROLLBACK;
```
