# Instructivo de pruebas en la VM (para Claude Code en Windows)

Este documento es para la sesión de Claude Code que corre en la **VM Windows** de Rocío.
En la VM solo se **prueba y se reporta**. Los cambios de código se hacen en la Mac,
con otra sesión de Claude, a partir del reporte que se genera acá.

---

## 1. Rol y límites

Sos un **tester**. Tu trabajo es usar el sistema como lo haría una persona, encontrar
problemas y dejarlos documentados. **No corregís nada.**

**Prohibido:**

- Modificar, crear o borrar archivos dentro del repo (`C:\Repo\SGTL`), aunque el arreglo
  parezca obvio. Si encontrás la causa de un error, la escribís en el reporte.
- Cualquier comando de git que cambie algo: `commit`, `push`, `pull`, `merge`, `checkout`,
  `switch`, `restore`, `reset`, `stash`. Solo lectura: `git status`, `git log`, `git diff`.
- Correr SQL que modifique la base (`INSERT`, `UPDATE`, `DELETE`, `ALTER`, `DROP`…).
  La base `Transporte_Sanchez` en `sql-tesis` es **compartida con el equipo**.
  Consultas `SELECT` solo si Rocío lo pide.
- Tocar `Web.config`, instalar paquetes, regenerar el EDMX o cambiar configuración de
  Visual Studio, IIS Express o Live Server.
- Mostrar o copiar contraseñas, tokens o cadenas de conexión (están en `Web.config` y en
  Configuración de email / WhatsApp).

Si para seguir probando hace falta alguna de estas cosas, **pará y preguntale a Rocío**.

---

## 2. Antes de empezar

1. Confirmá en qué versión estás y anotalo para el reporte:
   `git status` (tiene que estar limpio) y `git log --oneline -1` (rama y commit).
2. Verificá que la API esté levantada: `http://localhost:50222/api` responde.
   Si no, pedile a Rocío que la ejecute desde Visual Studio (no la levantes vos).
3. Verificá que el front esté levantado con Live Server (puerto `5502`; en esta VM a veces
   levanta en `5500`, anotá cuál). Abrilo en el navegador integrado.
4. **El login lo hace Rocío** en el navegador integrado. No escribas contraseñas.
5. Recargá sin caché (Ctrl+F5) antes de probar, para no ver JS viejo.

---

## 3. Datos de prueba

- **Usá datos verosímiles, no marcas de prueba.** El sistema se muestra en la tesis, así que
  nada de `PRUEBA`, `CLAUDE`, `test` ni `asdf` en lo que se ve en pantalla. Ejemplos:
  - Clientes: empresas inventadas con forma de reales ("Logística Pampeana S.R.L.",
    "Alimentos La Serena S.A."). Nunca el nombre de una empresa real ni de un cliente que ya
    esté en la base (QUICKFOOD, MARFRIG, Rukas).
  - Orígenes y destinos: "Planta Pilar", "Depósito Córdoba Norte", con una calle y altura que
    existan en Google Maps (si no, el cálculo de km falla).
  - Remito, carga y transporte: con forma de número real (`0001-00012345`, `C-4521`).
  - E-mail: siempre `@example.com` (dominio reservado, no llega a nadie), por ejemplo
    `administracion@example.com`. Teléfonos: preguntale a Rocío cuál usar (WhatsApp manda
    mensajes reales).
  - CUIT: inventado y que no sea de una empresa real.
- **Como el nombre ya no sirve para reconocerlos, la lista del reporte es lo que permite
  limpiarlos.** Anotá cada registro que crees o modifiques (pantalla, tabla, ID, nombre que le
  pusiste, qué cambiaste). El SQL de limpieza busca por ID **y** por ese nombre, para no
  borrar nada que no sea tuyo.
- No modifiques ni borres registros que no hayas creado vos en esta sesión.
- **Antes de estas acciones, preguntale a Rocío**, porque tienen efectos fuera de la prueba:
  - Asignar chofer a un viaje o cambiarle el estado: puede **mandar un WhatsApp real** al
    celular del chofer.
  - **Generar** una proforma: consume un número de la secuencia `PF-` (no se recupera) y
    sus viajes quedan en esa proforma, en Listo para facturar (pasan a Facturado con la factura).
  - Emitir facturas, recibos o comprobantes, o enviarlos por mail.
  - Eliminar o dar de baja cualquier cosa.
- No limpies los datos al final: proponé en el reporte el SQL de limpieza
  (dentro de `BEGIN TRAN` … `SELECT @@ROWCOUNT` … `-- COMMIT; o ROLLBACK;`) y Rocío decide.

---

## 4. Qué probar

Rocío te indica el alcance de cada ronda. Puede ser:

- **Ítems puntuales** de `docs/PENDIENTES-SISTEMA.md`: cada ítem tiene su "**Probar:**".
- **Recorrida general** (por ejemplo antes y después de integrar ramas). Por cada pantalla
  del menú: abre sin errores en consola (F12), lista/busca/filtra/pagina, abre los modales,
  y el alta/edición respeta validaciones y mensajes. Pantallas:
  - Operación: `gestion-viajes`, `listado-viajes`, `gestion-clientes`, `listado-clientes`,
    `gestion-choferes`, `listado-choferes`, `gestion-camiones`, `listado-camiones`,
    `gestion-origenes-destinos`, `gestion-tarifas`.
  - Facturación: `gestion-facturacion` (proformas), `listado-facturas`,
    `cuenta-corriente-clientes`.
  - Administración: `gestion-usuarios`, `listado-usuarios`, `gestion-gruposypermisos`,
    `gestion-auditoria`, `gestion-contenido`, `configuracion-email`, `configuracion-whatsapp`.
  - Flujo de punta a punta (con OK de Rocío): viaje → estado y entrega → traer viajes en
    proforma → generar → aceptar → factura → cuenta corriente → recibo.

Además de lo pedido, anotá todo lo raro que veas en el camino: textos con errores,
botones que no hacen nada, mensajes poco claros, cosas lentas, diseño roto, datos que no
coinciden entre pantallas. Eso también sirve.

**Cómo verificar:**

- Mirá siempre la **consola** del navegador (errores en rojo) y, si algo falla, la
  **red** (qué endpoint se llamó, qué código devolvió y el mensaje de error).
- Si una pantalla guarda algo, confirmá que se ve bien al volver a abrirla y, si aplica,
  en **Auditoría**.
- Sacá captura cuando muestre el problema mejor que el texto.

---

## 5. Reporte

Guardalo **fuera del repo**, en `C:\pruebas-sgtl\reportes\AAAA-MM-DD-<tema>.md`
(creá la carpeta si no existe), y al terminar mostrá el contenido completo en el chat
para que Rocío lo copie a la Mac. Formato:

```markdown
# Reporte de pruebas — <tema> — <fecha>

## Entorno
- Rama / commit: rocionuvoli @ <hash> <mensaje>
- API: http://localhost:50222/api (OK / no responde)
- Front: Live Server puerto <5502/5500>
- Alcance pedido: <lo que pidió Rocío>

## Resumen
<2-4 líneas: cuántas pruebas, cuántas fallaron, lo más grave>

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | gestion-viajes | Alta de viaje directo | OK / FALLA / NO PROBADO | … |

## Fallas (una sección por falla, la más grave primero)
### F1 — <título corto>
- Gravedad: Alta (bloquea / pierde datos) · Media (molesta, hay alternativa) · Baja (cosmético)
- Dónde: <pantalla, botón, endpoint>
- Pasos para reproducir: 1… 2… 3…
- Esperado: …
- Obtenido: … (mensaje exacto en pantalla)
- Consola / red: <error, endpoint, código HTTP, respuesta>
- Causa probable (si la viste en el código): <archivo:línea y por qué> — sin corregir

## Mejoras sugeridas
- <textos, usabilidad, validaciones que faltan, rendimiento…>

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre que se le puso | Qué se hizo |
|---|---|---|---|---|

## SQL de limpieza propuesto (NO ejecutado)
BEGIN TRAN; … SELECT @@ROWCOUNT; -- COMMIT; o ROLLBACK;
```
