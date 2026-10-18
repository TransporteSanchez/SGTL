# Instructivo: capturas para el relevamiento visual (agente de Cursor en la VM)

Ronda especial de la VM: **solo mirar y sacar capturas** de todas las pantallas en los mismos
estados, para comparar cómo se ven. Completa `01-relevamiento-codigo.md`, que dice qué se
encontró leyendo el código y qué conviene mirar en cada componente.

---

## 1. Reglas

- Valen las de `docs/equipo/PRUEBAS-VM-CLAUDE.md` §1 y §2 aunque esta sesión sea de Cursor: sos tester,
  no cambiás archivos ni git, no corrés SQL, el login lo hace Rocío.
- **Esta ronda no guarda nada.** No aprietes Confirmar, Guardar, Generar, Emitir ni Eliminar
  con datos cargados. Única excepción: apretar el botón principal de un alta con el formulario
  **vacío**, para ver los errores de validación. Si en alguna pantalla eso llega a guardar algo
  o no muestra error, pará y avisale a Rocío.
- **No abras** los modales de eliminar, anular, cambiar estado ni "Estado y entrega" del viaje.
  Sus textos ya están relevados en el código, y un clic de más borra datos o manda un WhatsApp
  real.
- **No toques** "Personalizar" / "Guardar" del inicio (guarda el diseño del tablero), "Guardar
  permisos" de grupos ni "Confirmar" / "Restablecer" de gestión de contenido.
- **Secretos y datos personales:**
  - **No captures `configuracion-whatsapp`**: muestra el Access Token de Meta en texto (F2).
    Describila en el reporte.
  - En `configuracion-email` capturá solo el listado y el modal "Nueva configuración" vacío.
  - Si en una captura aparece una contraseña o un token, borrala.
  - Las capturas tienen datos de clientes y choferes: no van al repo.

---

## 2. Preparación

1. `docs/equipo/PRUEBAS-VM-CLAUDE.md` §2: anotá rama y commit, verificá API y Live Server.
2. Usá el **navegador integrado de Cursor** para todas las pantallas. Rocío inicia sesión con un
   usuario **admin** (el menú Configuración solo aparece para admin).
3. Mismo tamaño de ventana para todas y zoom 100 %. Anotá el tamaño (por ejemplo 1920×1080).
4. Recargá sin caché al entrar a cada pantalla.
5. Carpeta: `C:\pruebas-sgtl\capturas-ui\AAAA-MM-DD\` (creala si no existe).
6. Sacá cada captura con la herramienta de captura del navegador de Cursor, pasándole el
   nombre de archivo del formato de abajo. Si la guarda en otra carpeta, al terminar mové todas
   a la carpeta del punto 5. Usá captura de página completa en los estados `inicio`.
7. Si no podés guardar capturas como archivo, pedile a Rocío que las saque ella con
   Win+Shift+S siguiendo la lista del §4, y vos armá el reporte.

**Nombre de cada archivo:** `NN-pantalla--estado.png`, con el número y el estado de las tablas
de abajo. Ejemplo: `04-gestion-choferes--alta-errores.png`.

---

## 3. Estados

| Estado | Qué es | Cómo llegar |
|---|---|---|
| `inicio` | La pantalla recién cargada, con datos | Entrar y sacar captura de página completa |
| `sin-resultados` | Mensaje de tabla vacía | Buscar algo que no existe (DNI `99999999`, texto `zzzz`, dominio `ZZ999ZZ`) |
| `alta-vacio` | Modal de alta recién abierto | Botón de alta / "Nuevo…", sin completar nada |
| `alta-errores` | Errores de validación | En ese modal, apretar el botón principal con todo vacío. Si sale un aviso del navegador (`alert`), capturalo igual. Después, Cancelar |
| `edicion` | Modal de edición | Editar el primer registro, sin cambiar nada. Cancelar |
| `detalle` | Modal de detalle | "Más detalles" u ojo del primer registro. Cerrar |
| `pestana-2`, `pestana-3` | Otras pestañas | Tocar cada pestaña |
| `calendario` | Selector de fecha abierto | Clic en un campo de fecha de los filtros (o del alta, donde se indica) |
| `tooltip` | Texto de un botón de solo ícono | Mouse encima del botón de alta o de una acción de la fila. Si no aparece nada, anotalo |

---

## 4. Pantallas

Orden del menú. "Cuidado" = lo que no hay que tocar en esa pantalla, además del §1.

| NN | Pantalla | Estados | Cuidado |
|---|---|---|---|
| 00 | General | `menu` (un submenú abierto), `usuario` (menú del usuario abierto), `pie` (final de cualquier pantalla con el pie a la vista) | — |
| 01 | Login.html | `inicio` (abrilo en otra pestaña, sin cerrar sesión) | No escribas usuario ni contraseña |
| 02 | index | `inicio` | No "Personalizar" ni "Guardar" |
| 03 | listado-choferes | `inicio`, `sin-resultados`, `calendario`, `detalle` | — |
| 04 | gestion-choferes | `inicio`, `sin-resultados`, `alta-vacio`, `alta-errores`, `edicion`, `tooltip` | No cambiar estado ni eliminar |
| 05 | listado-camiones | `inicio`, `sin-resultados`, `detalle` (puede no abrir por F5: anotalo) | — |
| 06 | gestion-camiones | `inicio`, `alta-vacio`, `alta-errores`, `edicion`, `calendario` (fecha de compra en el alta), `tooltip` | No cambiar estado ni eliminar |
| 07 | listado-viajes | `inicio`, `sin-resultados`, `calendario`, `detalle` | — |
| 08 | gestion-viajes | `inicio`, `sin-resultados`, `alta-vacio` (con el mapa), `alta-errores`, `edicion` (de un viaje Registrado), `calendario` (fecha de inicio en el alta), `tooltip` | No "Estado y entrega", no asignar chofer |
| 09 | gestion-origenes-destinos | `inicio`, `pestana-2`, `alta-vacio`, `alta-errores`, `edicion` | — |
| 10 | gestion-tarifas | `inicio`, `pestana-2`, `alta-vacio`, `alta-errores`, `edicion` | — |
| 11 | listado-clientes | `inicio`, `sin-resultados`, `detalle` | — |
| 12 | gestion-clientes | `inicio`, `sin-resultados`, `alta-vacio`, `alta-errores`, `edicion`, `tooltip` | No cambiar estado ni eliminar |
| 13 | listado-facturas | `inicio`, `sin-resultados`, `calendario`, `detalle`, `exportar` (modal "Exportar" abierto, sin exportar), `buscador-cliente` (escribir 2 letras en el filtro de cliente) | No "Emitir" |
| 14 | gestion-facturacion | `inicio`, `sin-resultados`, `alta-vacio`, `alta-errores` (con "Guardar borrador"), `exportar` | **Nunca "Generar"** (consume un número PF), ni Anular, ni Eliminar |
| 15 | cuenta-corriente-clientes | `inicio`, `sin-resultados`, `alta-vacio` ("Nuevo recibo"), `comprobantes` (menú "Comprobantes" abierto), `detalle` | No "Emitir", no enviar por mail |
| 16 | configuracion-facturacion | `inicio` | No "Guardar" ni desactivar |
| 17 | configuracion-email | `inicio`, `alta-vacio` ("Nueva configuración") | No editar, no "Probar" |
| 18 | gestion-contenido | `inicio` | No "Confirmar" ni "Restablecer" |
| 19 | configuracion-whatsapp | **Sin captura**: describila en el reporte | Muestra el token (F2) |
| 20 | listado-usuarios | `inicio`, `sin-resultados`, `detalle` | — |
| 21 | gestion-usuarios | `inicio`, `sin-resultados`, `alta-vacio`, `alta-errores`, `edicion` | No cambiar estado ni eliminar |
| 22 | gestion-gruposypermisos | `inicio`, `pestana-2` (con un grupo elegido), `pestana-3`, `alta-vacio`, `alta-errores` | No "Guardar permisos" ni guardar usuarios |
| 23 | gestion-auditoria | `inicio`, `sin-resultados`, `calendario`, `detalle` | — |

---

## 5. Qué mirar en cada pantalla

Anotá lo que veas, aunque parezca menor:

- Filtros, botones o columnas desalineados; espacios desparejos.
- Textos cortados, que se salen de su caja o que generan scroll horizontal.
- Botones de solo ícono sin texto ni tooltip.
- Colores, tamaños o posiciones que no coinciden con las otras pantallas.
- Mensajes de error o de vacío poco claros, en otro tono o en inglés.
- Fechas y montos: cómo se ven en la tabla y en los campos.
- Errores en rojo en la consola al abrir (mirala una vez por pantalla, después de capturar).

---

## 6. Reporte

Guardalo fuera del repo, en `C:\pruebas-sgtl\reportes\AAAA-MM-DD-capturas-ui.md`, y al terminar
mostralo completo en el chat. Formato:

```markdown
# Reporte de capturas — relevamiento visual — <fecha>

## Entorno
- Rama / commit: rocionuvoli @ <hash> <mensaje>
- Navegador, resolución de pantalla y zoom: …
- Front: Live Server puerto <5502/5500>
- Carpeta de capturas: C:\pruebas-sgtl\capturas-ui\<fecha>\ (<cantidad> archivos)

## Lo que más llama la atención
<las 10 cosas que más se notan, de la más visible a la menos>

## Por pantalla
| NN | Pantalla | Capturas | Observaciones |
|---|---|---|---|
| 03 | listado-choferes | inicio, sin-resultados, calendario, detalle | … |

## No capturado
| NN | Pantalla / estado | Por qué |
|---|---|---|

## Datos creados o modificados
Ninguno. (Si se guardó algo por error: pantalla, ID y qué pasó.)
```

---

## 7. Llevar las capturas a la Mac (Rocío)

Pasar a la Mac dos cosas, como te resulte más cómodo (carpeta compartida de la VM, arrastrar,
Drive), a cualquier lugar, y avisarle a la sesión de la Mac dónde quedaron:

- **La carpeta entera** `C:\pruebas-sgtl\capturas-ui\AAAA-MM-DD\` (todas las imágenes).
- **El reporte** `C:\pruebas-sgtl\reportes\AAAA-MM-DD-capturas-ui.md`.

En la Mac, las capturas van a `.pruebas-locales/capturas-ui/AAAA-MM-DD/` (excluida de git: no
se suben porque tienen datos de clientes y choferes) y el reporte a
`docs/pruebas/AAAA-MM-DD-capturas-ui.md` (sin imágenes ni datos sensibles: se commitea).
