# Reporte de pruebas — Reprueba corta de la ronda 1 (§59) — 28/10/2026

> Reporte de la sesión de la VM, con `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md` (sección 3, "Antes de la ronda 2").
> Seguimiento en la §59 de `docs/PENDIENTES-SISTEMA.md`. Sigue valiendo para el código posterior a `78d2ef5`: lo que se
> cambió después no toca login, sesión, usuarios, choferes ni la hoja de ruta.

## Entorno
- Rama / commit: rocionuvoli @ 78d2ef5 "Pruebas: reporte de la ronda 1, reprueba y pendientes" (`git status` limpio; el `pull` ya estaba al día).
- API: http://localhost:50222/api — OK. **Recompilada** con MSBuild `Rebuild` de la solución en su salida normal (como "Recompilar solución"); DLL de las 18:22:22. IIS Express la tomó sola.
- Front: Five Server, puerto 5502. Dos sesiones en el navegador integrado: admin RNUVOLI en `localhost:5502`; mferreyra y después dquiroga en `127.0.0.1:5502`. Los login los hizo Rocío.
- Alcance pedido: la reprueba corta del principio de la sección 3 de `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md` (§59). El punto 9 (correo del recupero) queda NO PROBADO, como pidió Rocío.

## Resumen
16 controles: 15 OK y 1 NO PROBADO (F2, el correo). Compila con 0 errores y las 80 pruebas de Node y la de PowerShell dan OK. **Todos los arreglos de la §59 funcionan:**
- **F1:** al cambiar el e-mail o inactivar el usuario, la otra sesión vuelve al login en 4 o 5 segundos, sin errores de CORS.
- **F7:** el chofer inactivado ve solo su aviso y el token se borra.
- F6, M11, DS2, DS5, DS8 y F4 quedan como pedía la §59.

Sigue pendiente lo que la §59 ya dejaba para después: al volver al login no aparece "Tu sesión venció…" (DS4).

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | Compilación | Recompilar la solución | OK | **0 errores**, 1866 advertencias, todas CS1591 (falta el comentario XML). La única nueva respecto de la ronda 1: `UsuariosController.UsuariosDto.Chofer`. |
| 2 | Pruebas automáticas | 80 `node tests\*.test.js` y `contrasenas-seguras.test.ps1` | OK | 80/80 imprimen `OK`; la de PowerShell sale con 0 (Node de Visual Studio). |
| 3 | F1 | Cambiarle el e-mail a mferreyra con su sesión abierta en la otra pestaña | OK | Guardado a las 18:50:19 (`integraanalistas+mferreyra2@…` → `integraanalistas+mferreyra@gmail.com`). Al traer la pestaña al frente, a las 18:50:24 fue a `Login.html?volver=listado-usuarios.html%3Festado%3DActivo` y el token ya no estaba. `GET api/sesion` → 401 legible. |
| 4 | F1 | Después de entrar, vuelve a la pantalla donde estaba | OK | Desde `Login.html?volver=listado-usuarios.html%3Festado%3DActivo`, al entrar mferreyra volvió a Listar usuarios con el filtro. |
| 5 | F1 | Inactivar el usuario dquiroga con su sesión abierta | OK | Inactivado a las 18:52:15; a las 18:52:19 fue a `Login.html?volver=hoja-de-ruta.html`, sin token. Después se activó ("Usuario activado."). |
| 6 | F1 | En la consola, ningún error de CORS | OK | Solo el 401 esperado y el 403 de M11. Antes (ronda 1) salía "blocked by CORS policy". |
| 7 | F7 | Inactivar el chofer 12 con dquiroga adentro y tocar "Hoy y próximos" | OK | Mensajes: "Cargando…" y "Tu chofer quedó inactivo, así que se cerró tu sesión. Es necesario que hables con administración."; ya no aparece "No se pudo cargar tu hoja de ruta.". En el login, `localStorage` sin token ni usuario. Activado de nuevo a las 18:59:41. |
| 8 | F6 | Listar usuarios → Ver detalle de dquiroga | OK | Muestra "Chofer: Quiroga, Darío" con su DNI. En mferreyra (no es chofer) esa línea está oculta. También en rjuarez, con su chofer y DNI. |
| 9 | M11 | `PUT api/Usuarios/18` con mferreyra (solo "Listar usuarios") | OK | 403 "No tenés permiso para modificar usuarios." (se mandaron sus mismos datos; nada cambió). |
| 10 | DS2 | Olvidé mi contraseña → Enviar enlace vacío | OK | "Revisá los campos marcados." en rojo (texto `#b42318` sobre `#fdf1f2`) y "Completá el e-mail." debajo; no llama a la API. |
| 11 | DS2 | `Login.html#recupero=abc` | OK | "El enlace no es válido o venció. Solicitá un nuevo recupero de contraseña." en rojo. Siguen los campos y el botón: es M1, pendiente según la §59. |
| 12 | DS5 | Registrar usuario con rol Usuario | OK | "El rol Usuario necesita al menos un grupo: define qué pantallas ve." |
| 13 | DS8 | Editar el chofer 5 (sin usuario) | OK | Al escribir el nombre de usuario, "E-mail *"; al borrarlo, vuelve a "E-mail". Se canceló sin guardar. |
| 14 | F4 | Un error 500 no trae detalle técnico | OK | `GET api/Usuarios/Buscar?…&page=-1&pageSize=-5` (solo lectura) → 500 `{"Message":"Error."}`, sin `ExceptionMessage` ni `StackTrace`. |
| 15 | F4 | Localidades que no cargan en Registrar chofer | OK | Simulado en el navegador (la llamada de localidades desviada a una dirección inexistente): "Localidades sin cargar: volvé a elegir la provincia." debajo de Localidad, en rojo. Se canceló sin guardar. |
| 16 | F2 | Puntos del correo de la ronda 1 (7, 12, 13, 14, 17, 24 y 26) | NO PROBADO | Por pedido de Rocío: la contraseña SMTP no se guardó desde la VM. |

## Fallas
Ninguna nueva.

## Design system
- **DS4 (pendiente según la §59, sigue igual):** al volver al login por una sesión rechazada o vencida no aparece "Tu sesión venció. Volvé a iniciar sesión." (§9). Se ve en los puntos 3 y 5.

## Mejoras sugeridas
- **Paginación negativa:** `api/Usuarios/Buscar?page=-1&pageSize=-5` responde 500. Conviene responder 400 o tomar la página 1. Es una llamada que la pantalla no hace (Baja).
- **`api/Choferes/ValidarDNI/abc`** responde "El DNI no se encuentra registrado, es válido." con letras. La pantalla valida el formato antes; la API también podría hacerlo (Baja).

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre | Qué se hizo |
|---|---|---|---|---|
| Gestionar usuarios | USUARIOS | 18 | mferreyra | E-mail vuelto a `integraanalistas+mferreyra@gmail.com` (estaba en `…+mferreyra2@…` desde la ronda 1). |
| Gestionar usuarios | USUARIOS | 19 | dquiroga | Inactivado y activado. Queda Activo. |
| Gestionar choferes | CHOFERES | 12 | Darío Quiroga | Inactivado y activado. Queda Activo. |
| Configuración de facturación | — | — | — | No se tocó. |

No se creó ningún registro nuevo.

## SQL de limpieza propuesto (NO ejecutado)
El mismo de la ronda 1 (`2026-10-28-pruebas-ronda-1.md`), para cuando terminen todas las rondas (mferreyra 18 y grupo 9). Esta reprueba no agregó datos.
