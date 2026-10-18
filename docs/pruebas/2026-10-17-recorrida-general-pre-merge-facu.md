# Reporte de pruebas — Recorrida general (foto antes del merge con Facu) — 17/10/2026

> Generado por Claude Code en la VM siguiendo `docs/equipo/PRUEBAS-VM-CLAUDE.md`. Copiado al repo como
> línea base para comparar después del merge de `facugodoy`. Los hallazgos están cargados
> en `docs/PENDIENTES-SISTEMA.md` §8. Capturas: en la VM, `C:\pruebas-sgtl\reportes\capturas\`.

## Entorno
- Rama / commit: rocionuvoli @ f4e3d20 Docs: instructivo de pruebas para Claude en la VM (solo probar y reportar) — `git status` limpio
- API: http://localhost:50222/api (OK — responde; la raíz `/api` da 404, que es lo normal)
- Front: Live Server puerto **5500** (5502 no responde)
- Alcance pedido: recorrida general de todas las pantallas (sección 4 del instructivo), sin el flujo de punta a punta. Foto del sistema antes de integrar la rama de Facu.
- Login: lo hizo Rocío (RNUVOLI). Navegador integrado, cada pantalla abierta en pestaña nueva para separar los errores de consola.

## Resumen
Se recorrieron las 19 pantallas del alcance más el dashboard: 20 pantallas y ~95 pruebas de listar, filtrar, paginar y abrir modales.
**No se guardó nada.** El permiso para tocar "Confirmar" en un alta fue denegado (escribe en la base compartida), así que todas las **altas, ediciones y bajas quedan NO PROBADAS**. Solo se revisaron las validaciones que se ven en el momento, sin enviar.
Hay 4 fallas de gravedad Alta:
- La API devuelve **sin token** las contraseñas en texto plano de todos los usuarios.
- La API devuelve **sin token** el Access Token de WhatsApp (Meta).
- **Permisos por grupo** da 500 en todos los grupos.
- Vista en el código, sin probar: se puede **anular una proforma ya facturada**.

Además, el error de consola "PerfectScrollbar", que aparece en casi todas las pantallas, no es cosmético: impide que se defina `window.bootstrap` y por eso rompe "Más detalles" en listado-camiones.

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | index (dashboard) | Abre, widgets, calendario | OK con observación | 404 en `GET /api/DashboardLayout?username=RNUVOLI` (ver Mejoras). "Top clientes en facturación" muestra "—" en los 3 |
| 2 | Todas salvo cuenta corriente | Consola al abrir | FALLA | `Uncaught Error: no element is specified to initialize PerfectScrollbar` → ver F5 |
| 3 | gestion-viajes | Listar (14 viajes) | OK | |
| 4 | gestion-viajes | Filtros: n°, fecha inicio, estado, cliente, remito/transporte/entrega | OK | Rango de fechas inclusive. "Limpiar" OK |
| 5 | gestion-viajes | Paginación 5/10/15/Todos, sig./ant. | OK | |
| 6 | gestion-viajes | Modal alta: cascada cliente → origen/destino, ruta Google, tarifa | OK con observación | Ruta Sede Quilmes → Sede Banfield = 2,9 km (dirección del destino mal cargada, ver F14) |
| 7 | gestion-viajes | Modal alta: Confirmar vacío (validaciones) | NO PROBADO | Permiso denegado (escribe en la base) |
| 8 | gestion-viajes | Modal edición viaje 24 (carga de datos) | OK | Cargó todo. "Chofer asignado" es obligatorio (*) en el alta y "(opcional)" en la edición |
| 9 | gestion-viajes | Modal Estado y entrega viaje 24 | OK (solo abrir) | Desde Registrado solo ofrece "Listo para facturar" (no En viaje / Entregado) |
| 10 | gestion-viajes | Modal eliminar (abrir y cancelar) | OK | Botones editar/eliminar deshabilitados en viajes Facturados |
| 11 | gestion-viajes | Consola | FALLA (baja) | `simple-datatables.js`: `Cannot read properties of null (reading 'innerHTML')` (F12) |
| 12 | listado-viajes | Listar, paginación | OK | |
| 13 | listado-viajes | Filtros fecha inicio y cliente (autocompletar) | OK con observación | Si se escribe el cliente sin elegir la sugerencia, el filtro se ignora sin aviso |
| 14 | listado-viajes | Modal "Detalles del viaje" | FALLA | Muestra IDs en vez de nombres; chofer/camión vacío (F6) |
| 15 | gestion-clientes | Listar, filtros CUIT / fecha alta / estado | OK | CUIT incompleto → "Formato de CUIT inválido (XX-XXXXXXXX-X)" |
| 16 | gestion-clientes | Modal alta: CUIT duplicado | OK | "El CUIT ya está registrado." y deshabilita Confirmar |
| 17 | gestion-clientes | Modal alta: CUIT con dígito verificador inválido (20-12345678-0) | FALLA (baja) | Lo acepta (F13) |
| 18 | gestion-clientes | Modal edición (carga) | OK | |
| 19 | gestion-clientes / listado-clientes | Consola | FALLA (baja) | `Cannot set properties of null (setting 'textContent')` en `usernameDisplay` (F12) |
| 20 | listado-clientes | Listar, filtros, paginación, "Más detalles" | OK con observación | QUICKFOOD: alta 24/3/2025 en la tabla y 23/03/2025 21:00 en el detalle (F8) |
| 21 | gestion-choferes | Listar, filtros DNI / fecha / activo-inactivo | OK | Inactivos: 2 (IDs 1 y 2); dashboard dice 6/8, coincide |
| 22 | gestion-choferes | Modal alta: DNI duplicado / DNI corto | OK con observación | Duplicado deshabilita Confirmar; DNI corto muestra el mensaje pero deja Confirmar habilitado |
| 23 | gestion-choferes | Modal edición (carga) | OK | |
| 24 | listado-choferes | Listar, filtros nombre/apellido/DNI, detalle | OK con observación | "Más detalles" abre, pero tira `bootstrap is not defined` (listado-choferes.html:770). Búsqueda sensible a tildes: "Juárez" no encuentra "Juarez" |
| 25 | gestion-camiones | Listar, filtros dominio / estado | OK | |
| 26 | gestion-camiones | Filtro fecha de alta 27/07–27/07 | FALLA | 0 resultados aunque la grilla muestra 2 camiones con alta 27/07 (F8) |
| 27 | gestion-camiones | Modal alta: dominio mal formado / duplicado | OK / FALLA (baja) | Formato: "El dominio debe tener el formato AA123CC o AAA123."; duplicado (ABC123) no avisa (choferes y clientes sí) |
| 28 | gestion-camiones | Modal edición (carga) | OK | |
| 29 | listado-camiones | Listar, filtros dominio / fecha | OK / FALLA | Mismo desfase de fechas que gestion-camiones |
| 30 | listado-camiones | "Más detalles" | FALLA | El modal no abre: `ReferenceError: bootstrap is not defined` (F5). Además 404 en `GET /api/Camiones/4/Chofer_Camion` |
| 31 | gestion-origenes-destinos | Listar orígenes (3) y destinos (4), pestañas | OK | Sin filtros ni paginación |
| 32 | gestion-origenes-destinos | Modal alta/edición, cascada provincia → localidad | OK | Sin asteriscos de obligatorio; altura con espacios de relleno ("245       ") |
| 33 | gestion-tarifas | Listar fijas (3) y por km (5) | FALLA (media) | Fijas #2 y #3 sin cliente, idénticas entre sí (F9) |
| 34 | gestion-tarifas | Modales alta/edición fija y km (carga) | OK con observación | Edición fija #3: el select Cliente queda en blanco |
| 35 | gestion-facturacion | Listar (8 proformas) | OK | |
| 36 | gestion-facturacion | Filtros estado / cliente / número / usuario / fechas | OK con observación | No existe la opción "Facturada" en el filtro de estado (F11); fechas invertidas → "Sin proformas." sin aviso |
| 37 | gestion-facturacion | Ver PF-00000002, editar borrador #23 (sin guardar), modal Cambiar estado | OK | |
| 38 | gestion-facturacion | Anular proforma Facturada | NO PROBADO (requiere OK) | Revisado en el código: lo permite (F4) |
| 39 | gestion-facturacion | Guardar / Generar / Duplicar / PDF | NO PROBADO | Fuera de alcance o requiere OK |
| 40 | listado-facturas | Listar (5 generadas), filtros, "Ver" | OK | La pantalla es "Listar proformas generadas"; no hay listado de facturas FAC en el menú |
| 41 | cuenta-corriente-clientes | Abre sin errores de consola | OK | Es la única pantalla sin el error de PerfectScrollbar |
| 42 | cuenta-corriente-clientes | KPIs vs grilla | OK | Saldo $1.236.239,24 y vencido $702.326,74 (3 comprobantes) coinciden con la suma de los saldos |
| 43 | cuenta-corriente-clientes | Filtros cliente / tipo / estado / solo pendientes / fechas | OK con observación | Fechas invertidas: grilla vacía sin aviso |
| 44 | cuenta-corriente-clientes | Desplegar FAC-00000004, detalle, modal Nuevo recibo (sin emitir), Exportar (sin descargar), paginación | OK | Exportar dice "Desde 17/09/2026 · Hasta 17/10/2026" aunque los filtros de fecha están vacíos |
| 45 | gestion-usuarios | Listar, filtro usuario, activo/inactivo | OK con observación | "Cgodoy" aparece 2 veces (F10) |
| 46 | gestion-usuarios | Respuesta de `GET /api/Usuarios/Buscar` | FALLA (alta) | Incluye el campo `Contraseña` en texto plano, también sin token (F1) |
| 47 | gestion-usuarios | Modal alta: usuario existente (RNUVOLI) | FALLA (baja) | No avisa al escribirlo (el control existe solo en la API) |
| 48 | gestion-usuarios | Modal edición (carga) | OK con observación | La contraseña viene precargada en el input |
| 49 | listado-usuarios | Filtros nombre / apellido | OK | |
| 50 | listado-usuarios | Filtro nombre de usuario | FALLA | No filtra: con "nuv" devuelve los 8 (F7) |
| 51 | listado-usuarios | "Más detalles" | OK con observación | En permisos aparecen "Gestion de contenido" y "Gestión de contenido" (duplicado con y sin tilde) |
| 52 | gestion-gruposypermisos | Grupos: listar, buscar, modales alta/edición | OK | |
| 53 | gestion-gruposypermisos | Permisos por grupo | FALLA (alta) | "Error al cargar permisos." — 500 en `GET /api/Grupos/{id}/Menus` para los 5 grupos (F3) |
| 54 | gestion-gruposypermisos | Usuarios por grupo | OK | |
| 55 | gestion-auditoria | Listar (491), filtros entidad / acción / fechas / texto, detalle, paginación | OK con observación | Horas +3 h: el login de hoy ~12:07 figura 15:07 (F8, ya conocido en §2) |
| 56 | gestion-contenido | Abre, carga logo / colores / pie | OK | No se guardó (configuración global). Pie: "2025 © Integra Analistas" |
| 57 | configuracion-email | Lista perfiles, modal edición (abrir/cerrar) | OK | Contraseña no se precarga. `/api/EmailServidor` sin token → 401 (bien) |
| 58 | configuracion-email | Probar conexión / Asignar / Guardar | NO PROBADO | Efecto externo |
| 59 | configuracion-whatsapp | Abre y carga configuración | FALLA (alta) | Access Token visible en input de texto y devuelto sin token por la API (F2) |
| 60 | Todas | Exportar CSV / PDF | NO PROBADO | Son descargas |
| 61 | Todas | Altas, ediciones, bajas, cambios de estado | NO PROBADO | Permiso denegado para escribir en la base compartida |

## Fallas (la más grave primero)

### F1 — La API devuelve las contraseñas de todos los usuarios, sin pedir sesión
- Gravedad: **Alta** (seguridad)
- Dónde: `GET /api/Usuarios/Buscar` (lo usan gestion-usuarios y listado-usuarios)
- Pasos para reproducir:
  1. Con o sin sesión, pedir `http://localhost:50222/api/Usuarios/Buscar?nombreusuario=&EstadoUsuario=Activo&page=1&pageSize=1` (yo lo hice sin header `Authorization`).
- Esperado: 401 sin token; nunca devolver la contraseña.
- Obtenido: 200 con los campos `Usuario_ID, Nombre, Apellido, Nombre_Usuario, Contraseña, Fecha_Alta, Rol, EstadoUsuario`. `Contraseña` viene en texto plano. **No copio ningún valor acá.**
- Causa probable:
  - `WebApi_TransporteSanchez/Controllers/UsuariosController.cs`: proyecta `Contraseña = u.Contraseña` en las líneas 97, 362 y 620.
  - El controller no valida token. En toda la API no hay `[Authorize]` ni filtro global: solo Comprobantes, Facturas, Recibos, EnviosComprobantes y EmailServidor validan el JWT a mano. Usuarios, Viajes, Choferes, Camiones, Clientes, Grupos, Auditoría, WhatsAppConfig, etc. responden a cualquiera.
  - Las contraseñas se guardan y comparan en texto plano (línea 1506: `u.Contraseña == value.ContrasenaActual`).
  - Además, gestion-usuarios precarga la contraseña en el modal de edición.
- Sugerencia: sacar `Contraseña` de las respuestas ya mismo. Después, autenticación en todos los controllers y hash de contraseñas. Como la base es compartida y las contraseñas quedaron expuestas en la red local, conviene cambiarlas.

### F2 — El Access Token de WhatsApp (Meta) se expone sin sesión y en texto visible
- Gravedad: **Alta** (seguridad) — módulo de Fede, coordinar
- Dónde: `GET /api/WhatsAppConfig/1` y `configuracion-whatsapp.html:51`
- Pasos para reproducir: 1. Pedir `http://localhost:50222/api/WhatsAppConfig/1` sin header de autorización. 2. Abrir Configuración → Integración WhatsApp.
- Esperado: 401 sin token. El token no debería volver al navegador, o debería volver enmascarado como en Email (`TienePassword`).
- Obtenido: 200 con `AccessToken` completo (307 caracteres, sin enmascarar). En la pantalla se ve en un `<input type="text">`.
- Causa probable: `WhatsAppConfigController.cs:49` (`Get`) no valida token y devuelve el campo tal cual. El input es `type="text"`.
- Sugerencia: mismo patrón que configuracion-email (no devolver el secreto; vacío = no cambiar). Si el token pudo haberse copiado, rotarlo en Meta.

### F3 — Permisos por grupo: 500 en todos los grupos
- Gravedad: **Alta** (bloquea la pantalla, con riesgo de perder datos)
- Dónde: Usuarios → Gestionar grupos y permisos → pestaña "Permisos por grupo"; `GET /api/Grupos/{id}/Menus`
- Pasos para reproducir: 1. Abrir gestion-gruposypermisos. 2. Pestaña "Permisos por grupo". 3. Cualquier grupo.
- Esperado: lista de menús con los tildados del grupo.
- Obtenido: "Error al cargar permisos." (captura: `capturas/2026-10-17-permisos-error.jpg`). **"Guardar permisos" sigue habilitado**: si alguien lo toca con la lista vacía, podría borrar los permisos del grupo. No lo probé.
- Consola / red: 500 en `/api/Grupos/1/Menus` y también en 2, 4, 5 y 6. Respuesta: `System.Data.ConstraintException: The 'Menu_Principal' property on 'MENU' could not be set to a 'null' value. You must set this property to a non-null value of type 'System.Int32'.`
- Causa probable:
  - Hay al menos una fila en `MENU` con `Menu_Principal = NULL`, y en el EDMX ese campo es `Int32` no nulo.
  - Rompe en `GruposController.cs:37` (`db.Set<MENU>().ToList()` dentro de `AsegurarCatalogoMenuPermisos`), que corre al entrar a `GetMenusPorGrupo` (línea 682).
  - El código propio inserta menús con `Menu_Principal = 0`, así que la fila con NULL vino por otro lado.
  - En Auditoría hay altas de MENU 20, 21 y 22 por "sistema" (06–07/10). Además, en listado-usuarios aparecen "Gestion de contenido" y "Gestión de contenido": la fila sin tilde es candidata.
  - El menú lateral (`MenusPermitidos`) no se ve afectado.
- Diagnóstico propuesto: ver el SQL al final (solo `SELECT` y un `UPDATE` para que Rocío decida).

### F4 — Se puede anular una proforma ya facturada (visto en el código, NO probado)
- Gravedad: **Alta** (inconsistencia de datos) — módulo de Facu, revisar en el merge
- Dónde: gestion-facturacion, botón "Anular" en PF-00000001 y PF-00000002 (estado Facturada, con FAC-00000001 y FAC-00000006); `POST /api/Proformas/{id}/Anular`
- Esperado: no permitir anular una proforma Facturada, o anular primero la factura o nota de crédito.
- Obtenido (código): `ProformasController.cs:476-477` solo bloquea "Aceptada" y "Anulada". Con "Facturada", la pasa a Anulada y en las líneas 480-485 devuelve sus viajes al estado previo a Facturado, mientras la factura sigue emitida en cuenta corriente. Esos viajes se podrían volver a facturar.
- Pasos para reproducir: no ejecutado (anular requiere OK de Rocío).

### F5 — `window.bootstrap` nunca se define: "Más detalles" de listado-camiones no abre
- Gravedad: **Media**
- Dónde:
  - Todas las pantallas que cargan `assets/compiled/js/app.js`, que son todas salvo cuenta corriente.
  - Visible en listado-camiones → botón "Más detalles".
- Pasos para reproducir: 1. Abrir listado-camiones. 2. Tocar "Más detalles" en cualquier camión.
- Esperado: abre "Detalles del camión".
- Obtenido: no pasa nada en pantalla. Consola: `Uncaught ReferenceError: bootstrap is not defined at Object.success (listado-camiones.html:505)`.
- Causa probable:
  - El final de `app.js` es `ft&&(window.sidebar=new Mr(ft)),window.bootstrap=Sr`. Como el sidebar se inyecta después por `sidebar-loader.js`, `new Mr` falla con `no element is specified to initialize PerfectScrollbar` y la asignación de `window.bootstrap` nunca se ejecuta.
  - Las pantallas que usan `bootstrap.Modal`/`Toast` sin chequear `window.bootstrap` fallan:
    - listado-camiones.html:503 y 711
    - listado-choferes.html:770 y 896 (el modal abre igual por otro camino, pero queda el error)
    - listado-clientes.html:880
    - gestion-camiones.html:1181, 1510 y 1647 (toasts de éxito y error)
    - gestion-choferes.html:957, 1459 y 1894 (toasts)
  - Riesgo no verificado: después de un guardado OK en camiones o choferes, el toast de éxito tira excepción y podría cortar el flujo (cerrar modal, refrescar grilla). gestion-usuarios y gestion-gruposypermisos ya tienen el "blindado".
- Sugerencia: arreglar el orden en `app.js` o inicializar el sidebar cuando exista, en lugar de parchar pantalla por pantalla.

### F6 — listado-viajes: el detalle muestra IDs en lugar de nombres
- Gravedad: Media
- Dónde: Viajes → Listar viajes → "Más detalles" (modal "Detalles del viaje")
- Pasos: 1. Abrir listado-viajes. 2. "Más detalles" en el viaje 14.
- Esperado: Origen "Sede Quilmes", Destino "Sede Banfield", Cliente "QUICKFOOD S.A.", tarifa con su valor, chofer y camión.
- Obtenido: Origen "3", Destino "4", Cliente "2", Tarifa por km "5", "Chofer / camión" vacío (captura: `capturas/2026-10-17-detalle-viaje-ids.jpg`).
- Causa probable: `listado-viajes.html:530-542` (`mostrarDetallesViaje`) usa `viaje.OrigenID`, `DestinoID`, `ClienteID` y `TarifaKmID`. Además lee `viaje.ChofCamID`, que no existe en la respuesta (vienen `ChoferID` y `CamionID`). La respuesta ya trae `Origen`, `Destino` y `Cliente` como texto.

### F7 — listado-usuarios: el filtro "Nombre de usuario" no filtra
- Gravedad: Media
- Pasos: 1. Listar usuarios. 2. Nombre de usuario = "nuv". 3. Buscar.
- Esperado: solo RNUVOLI.
- Obtenido: los 8 usuarios. Con nombre o apellido sí filtra.
- Causa probable: `listado-usuarios.html:277` manda `Nombre_Usuario`, pero `UsuariosController.cs:263` espera `nombreusuario`, así que se ignora. gestion-usuarios manda el nombre correcto y ahí funciona.

### F8 — Fechas: lo que se muestra no coincide con lo que se filtra (UTC, §2 de PENDIENTES)
- Gravedad: Media (ya conocido, "Etapa 2" del §2). Lo anoto con casos concretos para comparar después.
- gestion-camiones / listado-camiones: filtro fecha de alta 27/07/2026–27/07/2026 → "No se encontraron registros", aunque la grilla muestra SNK178 (27/07 22:39) y SNK278 (27/07 23:19).
  - El rango 21/07–21/07 trae ABC123, que se muestra con alta 20/07 23:54.
  - Request: `Camiones/Buscar?fechaDesde=2026-07-27&fechaHasta=2026-07-28` trae ambos.
  - La grilla resta 3 h y el filtro compara contra el valor UTC guardado. Pasa lo mismo con cualquier alta hecha después de las 21:00.
- listado-clientes: QUICKFOOD figura con alta "24/3/2025" en la grilla y "23/03/2025 21:00" en el detalle.
- Auditoría: el login de hoy (hora local ~12:07) figura a las 15:07; el alta del viaje 24 figura a las 13:41.

### F9 — Tarifas fijas #2 y #3 sin cliente (y duplicadas)
- Gravedad: Media (datos y validación)
- Dónde: Viajes → Gestionar tarifas → Tarifas fijas
- Obtenido:
  - #2 y #3 son idénticas: QUICKFOOD Sede 1 → VAFOOD S.R.L., 01/01–31/12/2026, $120.000. Las dos tienen la columna Cliente vacía.
  - Al editar #3, el select Cliente queda en blanco.
  - Como la búsqueda de tarifa del viaje (`TarifasFijas/PorRuta?clienteId=…`) filtra por cliente, esas tarifas nunca se van a encontrar.
  - El modal de alta no marca obligatorios.
- Observación: la tarifa por km vigente 2026 cubre solo de 1 a 100 km (#5 1–20, #4 21–100). Un viaje 2026 de más de 100 km no tendría tarifa por km.

### F10 — Usuario "Cgodoy" duplicado
- Gravedad: Media (datos)
- Obtenido: dos usuarios "Cgodoy" (Usuario_ID 8 y 9), mismo nombre, creados el 06/10/2026 a las 22:01:22 y 22:01:24 (doble envío). Aparecen 2 veces en gestion-usuarios, listado-usuarios y usuarios por grupo.
- Causa probable: el control de duplicado en la API (`UsuariosController.cs:920`) no alcanza con dos envíos simultáneos. Falta índice único en `Nombre_Usuario` y deshabilitar el botón al enviar.
  - El alta tampoco avisa en pantalla al escribir un usuario existente.

### F11 — Proformas: el filtro de estado no tiene "Facturada"
- Gravedad: Baja
- Dónde: `gestion-facturacion.html:258` (`ESTADOS`) y `listado-facturas.html:184` (`ESTADOS_GEN`). Hay 2 proformas en estado Facturada que no se pueden filtrar.

### F12 — Errores de consola menores al abrir
- Gravedad: Baja
- Se carga `assets/static/js/pages/simple-datatables.js` (busca `#table1`, que no existe) en:
  - gestion-viajes.html:392
  - gestion-clientes.html:506
  - gestion-origenes-destinos.html:246
  - gestion-tarifas.html:312
  - Error: `Cannot read properties of null (reading 'innerHTML')`.
- gestion-clientes.html:643 y listado-clientes.html (~459): `document.getElementById('usernameDisplay').textContent` corre antes de que se cargue el header → `Cannot set properties of null`.

### F13 — CUIT sin control de dígito verificador
- Gravedad: Baja (importa para facturación)
- `gestion-clientes.html:1483` `validarFormatoCUIT` solo valida el patrón `XX-XXXXXXXX-X`. Acepta 20-12345678-0, cuando el dígito correcto es 6.

### F14 — "Sede Banfield" está cargada con localidad Quilmes
- Gravedad: Baja (datos, mismo tipo que el 3.4 de PENDIENTES)
- Destino #4 "Sede Banfield": Buenos Aires / **Quilmes** / Saenz Peña 1052. Por eso la ruta Sede Quilmes → Sede Banfield da 2,9 km y el mapa avisa "Ubicación aproximada para el destino".
- Otros datos que no cierran:
  - "Sede Temperley" (destino #3) tiene localidad Morón (ya en 3.4).
  - El viaje 6 (QUICKFOOD) usa origen "claros del bosque" (de distribuidora-powerful) y destino "San Vicente" (de Servicios Ambientales).

## Mejoras sugeridas
- **Voseo:**
  - Login: "Ingrese sus credenciales…", "Ingrese su usuario/contraseña" (Login.html:106, 114, 124).
  - Selects "Seleccione un cliente / origen / destino / camión / localidad".
  - Eliminar: "¿Está seguro que desea eliminar…?".
  - `parsearError` de viajes: "Revise los datos e intente nuevamente".
- **Títulos de pestaña:**
  - listado-viajes y login dicen "Sistema de Gestionar viajes".
  - Clientes, choferes, camiones, usuarios, grupos y contenido usan el genérico "Sistema de gestión de viajes".
- **Formato de fechas inconsistente:**
  - Tarifas en ISO (2026-01-01).
  - Clientes sin cero ("22/7/2026").
  - Filtros de proformas y auditoría piden "AAAA-MM-DD".
- Encabezado "Razon Social" sin tilde (gestion-clientes, listado-clientes).
- **gestion-viajes:**
  - Los botones de solo ícono (nuevo, CSV, editar, eliminar) no tienen `title` ni tooltip.
  - El texto de tarifa queda en "Completá cliente, origen y destino…" aunque ya estén completos; recién cambia al elegir el tipo. Debería decir "Elegí el tipo de tarifa".
  - En la edición, "Tarifa por km asignada #5" muestra el ID y no el valor.
- **Validaciones al escribir que faltan o son desparejas:**
  - Dominio duplicado en el alta de camión.
  - Usuario duplicado.
  - DNI corto: muestra el error pero deja Confirmar habilitado.
- **Búsquedas:**
  - Distinguen tildes (Juárez ≠ Juarez).
  - Cliente escrito sin elegir la sugerencia se ignora (listado-viajes).
  - Fechas invertidas devuelven vacío sin aviso (proformas, cuenta corriente).
- **listado-viajes:** no tiene "Limpiar", ni columnas Cliente/Estado, ni filtro de estado. gestion-clientes no permite filtrar por razón social.
- **Orígenes y destinos:** sin asteriscos de obligatorio; altura con espacios de relleno (columna `CHAR`).
- **Endpoints que devuelven 404 como "sin datos" y ensucian la consola:**
  - `DashboardLayout` (usuario sin layout guardado)
  - `TarifasFijas/PorRuta`
  - `Camiones/{id}/Chofer_Camion`
  - Mejor 200 con vacío.
- **Datos que no coinciden entre pantallas:**
  - Condición fiscal "RI" en el detalle de cliente vs. texto completo en gestión.
  - Teléfono de QUICKFOOD con espacio final.
- **cuenta-corriente:** "Exportar listado" informa rango 17/09–17/10 aunque los filtros de fecha están vacíos.
- **Menú Facturación:** no hay listado de facturas FAC ("Listar proformas" apunta a `listado-facturas.html`). Revisar después del merge con Facu.
- Pie de página "2025 © Integra Analistas".
- listado-camiones todavía carga `momentjs/latest` y `npm/daterangepicker` sin versión fija (ya anotado en 1.7).

## Datos de prueba creados o modificados
| Pantalla | ID | Qué se hizo |
|---|---|---|
| — | — | **Ninguno.** No se guardó, editó ni eliminó nada. Solo lecturas (GET) y modales abiertos y cerrados sin confirmar. En Auditoría de hoy no hay movimientos de esta sesión además del login de Rocío. |

## SQL de limpieza propuesto (NO ejecutado)
No hace falta limpieza: no se crearon datos. Dejo **SQL de diagnóstico** para F3 y F10, para que Rocío lo corra si quiere:

```sql
-- F3: menús con Menu_Principal nulo (causa del 500 en Permisos por grupo)
SELECT * FROM MENU WHERE Menu_Principal IS NULL;
SELECT * FROM MENU WHERE Menu_Nombre LIKE 'Gesti%n de contenido';

-- Si se confirma que es eso, el código propio usa 0 para los menús nuevos:
BEGIN TRAN;
UPDATE MENU SET Menu_Principal = 0 WHERE Menu_Principal IS NULL;
SELECT @@ROWCOUNT AS Filas_Actualizadas;
-- COMMIT;  o  ROLLBACK;

-- F10: usuario duplicado (ver referencias antes de decidir nada; coordinar con quien lo creó)
SELECT Usuario_ID, Nombre_Usuario, Fecha_Alta, EstadoUsuario FROM USUARIOS WHERE Nombre_Usuario = 'Cgodoy';
SELECT * FROM GRUPOS_USUARIOS WHERE UsuarioID IN (8, 9);
```

Capturas en `C:\pruebas-sgtl\reportes\capturas\`: `2026-10-17-detalle-viaje-ids.jpg` (F6), `2026-10-17-permisos-error.jpg` (F3).
