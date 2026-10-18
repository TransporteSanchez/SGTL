# Reporte de pruebas — verificacion-F1-F3 — 17/10/2026

> Generado por Claude Code en la VM siguiendo `docs/equipo/PRUEBAS-VM-CLAUDE.md`. Resultados volcados en
> `docs/PENDIENTES-SISTEMA.md` §8. Capturas: en la VM, `C:\pruebas-sgtl\reportes\capturas\`.

## Entorno
- Rama / commit: rocionuvoli @ 85f688e Docs: script de MENU aplicado en la base (F3) — `git status` limpio, al día con `origin/rocionuvoli`
- API: http://localhost:50222/api (OK). Rocío confirmó que la recompiló en Visual Studio después del pull.
- Front: Live Server puerto 5500
- Alcance pedido: verificar F1 (contraseñas) y F3 (permisos por grupo) del §8 de `docs/PENDIENTES-SISTEMA.md`. Consola comparada con `docs/pruebas/2026-10-17-recorrida-general-pre-merge-facu.md`.
- Login: RNUVOLI (lo hizo Rocío). Usuario de prueba **PRUEBACLAUDE** (Usuario_ID 10, rol `user`, grupo Listados), creado por Rocío antes de la ronda.

## Resumen
Se hicieron 12 pruebas: **11 OK**. Queda 1 pendiente que le toca a Rocío: entrar con PRUEBACLAUDE para confirmar que la contraseña no cambió. Igual, la Auditoría ya muestra que la edición solo tocó `Apellido` y `Fecha_Modi`.
- **F1 corregido.** Ninguna respuesta de usuarios trae `Contraseña`. El modal muestra "Nueva contraseña" vacía con el texto de ayuda. El PUT manda `"Contraseña": ""` y responde 200.
- **F3 corregido.** Los 5 grupos cargan con 200. "Guardar permisos" arranca deshabilitado y se habilita cuando carga la lista. Guardar sin cambios muestra "Permisos guardados." y conserva las casillas.
- El menú 23 "Configuracion WhatsApp" **se borró unificado** con "Integración WhatsApp" (#21); no se renombró.
- Sin errores de consola nuevos.
- Observaciones nuevas: el guardado de permisos tarda ~3,3 s y reescribe todas las filas (12 registros de auditoría a nombre de `sistema` por cada guardado, aunque no cambie nada).

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | F1 · API | `GET /api/Usuarios/Buscar` (Activo y Activo,Inactivo) sin campo `Contraseña` | OK | Campos: `TotalRecords, Results, Usuario_ID, Nombre, Apellido, Nombre_Usuario, Fecha_Alta, Rol, EstadoUsuario` |
| 2 | F1 · API | `GET /api/Usuarios` sin `Contraseña` | OK | Mismos campos (sin `TotalRecords`) |
| 3 | F1 · API | `GET /api/Usuarios/{id}` para los 10 usuarios (IDs 1–10) | OK | 200, ninguno trae un campo de contraseña ni el texto "contraseña" |
| 4 | F1 · API | `GET /api/Usuarios/{id}/Detalles` (lo usa listado-usuarios), IDs 1–10 | OK | Campos: `EstadoUsuario, Grupos, Grupo_ID, Grupo_Nombre, Menus` |
| 5 | F1 · gestion-usuarios | "Editar" PRUEBACLAUDE sin guardar | OK | Label "Nueva contraseña", vacía, placeholder "Contraseña alfanumérica", ayuda visible "Dejá este campo vacío para conservar la contraseña actual.", Confirmar habilitado. Captura: `capturas/2026-10-17-F1-editar-usuario.jpg` |
| 6 | F1 · gestion-usuarios | Editar PRUEBACLAUDE: apellido CLAUDE → CLAUDEEDIT, contraseña vacía | OK | `PUT /api/usuarios/10` → 200. Aviso "Los datos del usuario se actualizaron exitosamente". El campo apellido no acepta el guion: "CLAUDE-EDIT" quedó "CLAUDEEDIT" |
| 7 | F1 · gestion-usuarios | Volver apellido a CLAUDE, contraseña vacía | OK | PUT capturado: claves `Nombre_Usuario, Nombre, Apellido, Contraseña, Rol, EstadoUsuario, Usu_Modi, GrupoIds`; **`Contraseña: ""`**. 200. La respuesta tampoco trae `Contraseña` |
| 8 | F1 · login | Entrar con PRUEBACLAUDE con la contraseña original | PENDIENTE (Rocío) | Auditoría de las 2 ediciones: solo `Apellido` y `Fecha_Modi` (no hay cambio de contraseña) |
| 9 | F3 · gestion-gruposypermisos | Recorrer los 5 grupos en "Permisos por grupo" | OK | `GET /api/Grupos/{1,2,4,5,6}/Menus` → 200, 22 menús. "Guardar permisos" deshabilitado mientras carga y habilitado al terminar (en el HTML arranca con `disabled`, línea 136) |
| 10 | F3 · catálogo de menús | Qué pasó con el menú 23 "Configuracion WhatsApp" | OK — **unificado y borrado** | Auditoría: `Baja MENU Menu_ID=23` por `sistema` (17/10, 16:40:52 en pantalla = ~13:40 hora local). No tenía grupos. "Integración WhatsApp" sigue como #21. Único repetido: "Gestion de contenido" #19 / "Gestión de contenido" #17 (ya conocido; los dos tildados en Administradores) |
| 11 | F3 · gestion-gruposypermisos | Grupo **Listados**: "Guardar permisos" sin cambiar casillas | OK | `POST /api/Grupos/5/Menus` → 200. Aviso "Permisos guardados." (aparece ~3,3 s después del clic, cuando responde el POST). Al recargar el grupo: mismas 6 casillas (menús 2, 4, 6, 10, 12, 14). Captura: `capturas/2026-10-17-F3-permisos-guardados.jpg` |
| 12 | F3 · menú lateral | Menú de RNUVOLI y permisos efectivos antes y después | OK | RNUVOLI: 31 opciones, idénticas a antes (`MenusPermitidos` = `{"Rol":"admin","Menus":[]}`: el admin no depende de grupos). PRUEBACLAUDE (grupo Listados): los mismos 6 "Listado de…" antes y después |
| 13 | Consola | gestion-usuarios, listado-usuarios, gestion-gruposypermisos | OK (sin errores nuevos) | Solo queda `no element is specified to initialize PerfectScrollbar` (F5, igual que en la recorrida). Desapareció el 500 de `Grupos/1/Menus` |

## Fallas
No hubo fallas en lo pedido.

## Observaciones nuevas (no bloquean)
### O1 — "Guardar permisos" reescribe todo el grupo y tarda ~3,3 s
- Cada guardado, aunque no cambie nada, borra las filas de `GRUPOS_MENU` del grupo y las vuelve a insertar con IDs nuevos.
  - Listados: 1–6 → 128–133 → 134–139 → 140–145, una vez por cada uno de los 3 guardados.
  - Son 12 registros de Auditoría por guardado, a nombre de **`sistema`** y no del usuario que guardó.
- El POST tardó 3,4 s, 3,3 s y ~3,3 s. Mientras tanto no hay indicador y el botón sigue habilitado (posible doble envío, igual que F10).
- Sugerencia:
  - Guardar solo la diferencia (altas y bajas reales).
  - Pasar el usuario a la auditoría.
  - Deshabilitar el botón mientras guarda.

### O2 — Editar un usuario recrea su fila en `GRUPOS_USUARIOS`
- Las dos ediciones de PRUEBACLAUDE (sin tocar grupos) hicieron Baja y Alta de `GRUPOS_USUARIOS` (17 → 18 → 19), auditadas como `sistema`. Es el mismo patrón que O1.

### O3 — El apellido no acepta guiones
- El campo apellido elimina el `-` mientras se escribe ("CLAUDE-EDIT" → "CLAUDEEDIT"). Apellidos compuestos con guion o apóstrofo no se pueden cargar. No probé espacios ni tildes.

### Lo que sigue igual (ya anotado en el §8)
- F1b: la API de usuarios responde sin token. Mis consultas de prueba se hicieron sin header `Authorization` y respondieron 200.
- F7: listado-usuarios sigue mandando `Nombre_Usuario` en lugar de `nombreusuario`.
- F8: Auditoría muestra +3 h. El alta de PRUEBACLAUDE figura 16:36:40, pero su `Fecha_Alta` guardada es 13:36:40.
- "Gestion de contenido" / "Gestión de contenido" duplicado (menús 19 y 17).

### Descartado
- Revisé si la Auditoría del alta de PRUEBACLAUDE guardaba la contraseña: el campo `Contraseña` aparece, pero **enmascarado como `***`** (`Sgtlauditcontext.cs`, `CamposSensibles`). Está bien.

## Datos de prueba creados o modificados
| Pantalla | ID | Qué se hizo |
|---|---|---|
| gestion-usuarios (Rocío) | USUARIOS 10 `PRUEBACLAUDE` + GRUPOS_USUARIOS 17 (grupo 5) | Alta hecha por Rocío antes de la ronda |
| gestion-usuarios | USUARIOS 10 | Apellido CLAUDE → CLAUDEEDIT → **CLAUDE** (quedó como estaba). Contraseña sin tocar |
| gestion-usuarios (efecto colateral) | GRUPOS_USUARIOS 17 → 18 → **19** | La API recreó la fila al editar (O2). Sigue en el grupo 5 |
| gestion-gruposypermisos | GRUPOS_MENU del grupo 5 (Listados) | 3 guardados sin cambios; filas recreadas, ahora IDs **140–145**, mismos menús (2, 4, 6, 10, 12, 14) |
| gestion-gruposypermisos (rutina de la API) | MENU 23 | Borrado por `AsegurarCatalogoMenuPermisos` al abrir la pantalla (esperado) |

## SQL de limpieza propuesto (NO ejecutado)
Los permisos y el apellido quedaron como estaban; lo único para limpiar es el usuario de prueba. **Sugerencia:** conservarlo hasta terminar las pruebas del merge con Facu (sirve para probar sin escribir contraseñas) y borrarlo antes de la tesis.

```sql
-- Revisar antes
SELECT Usuario_ID, Nombre_Usuario, Nombre, Apellido, Rol, EstadoUsuario FROM USUARIOS WHERE Usuario_ID = 10;
SELECT * FROM GRUPOS_USUARIOS WHERE UsuarioID = 10;   -- esperado: 1 fila (GrupoUsu_ID 19, GrupoID 5)

BEGIN TRAN;
DELETE FROM GRUPOS_USUARIOS WHERE UsuarioID = 10;
SELECT @@ROWCOUNT AS GruposUsuarios_Borrados;          -- esperado: 1
DELETE FROM USUARIOS WHERE Usuario_ID = 10 AND Nombre_Usuario = 'PRUEBACLAUDE';
SELECT @@ROWCOUNT AS Usuarios_Borrados;                -- esperado: 1
-- COMMIT;  o  ROLLBACK;
```

Opcional (ruido de auditoría de esta ronda, decide Rocío):
- 36 altas/bajas de `GRUPOS_MENU` del grupo 5 y 4 de `GRUPOS_USUARIOS` del usuario 10, todas del 17/10 a nombre de `sistema`. Si se quieren borrar, primero listar con
  `SELECT * FROM AUDITORIA WHERE Entidad IN ('GRUPOS_MENU','GRUPOS_USUARIOS') AND Usuario = 'sistema' AND Fecha >= '2026-10-17'`.
  Las columnas `Fecha`, `Usuario` y `Entidad` salen del `INSERT INTO AUDITORIA` de `WhatsAppConfigController.cs`. `Fecha` está en UTC: las de esta ronda caen entre 16:36 y 16:45. Revisar el resultado antes de armar el `DELETE`.

Capturas en `C:\pruebas-sgtl\reportes\capturas\`: `2026-10-17-F1-editar-usuario.jpg`, `2026-10-17-F3-permisos-guardados.jpg`.
