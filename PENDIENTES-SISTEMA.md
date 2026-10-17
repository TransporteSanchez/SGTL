# Pendientes a corregir en SGTL

Relevamiento del 14/10/2026 (prueba de Viajes en la VM + revisión en la Mac).
**Última actualización de este documento: 17/10/2026.**

Rama de trabajo: `rocionuvoli`. Para ver qué falta subir: `git status` y `git log origin/rocionuvoli..HEAD`.

---

## Estado rápido (para retomar con Claude u otra IA)

| ID | Tema | Código / acción | Git | Probar en VM |
|---|---|---|---|---|
| 1.1 | Proforma: fechas carga/entrega obligatorias | Hecho | **Pusheado** (`a8c2c43`) | En pausa (ver 1.5) |
| 1.2 | Auditoría: entidad sin sufijo proxy EF | Hecho | **Pusheado** (`a8c2c43`) | **OK en VM (17/10)** |
| 1.2b | `UPDATE` de 127 entidades viejas en AUDITORIA | Hecho en Azure 14/10 | N/A (SQL) | — |
| 1.3 | Viajes: km en gris si readonly | Hecho | **Pusheado** (`a8c2c43`) | **OK en VM (17/10)** |
| 1.4 | Live Server: no recargar por `App_Data`/`bin`/`obj` | Hecho | **Pusheado** (`98ffe56`) | **OK en VM (17/10)** |
| 1.5 | Proforma: Cliente/Origen/Destino obligatorios al guardar borrador | **Reemplazado por el merge (§9 punto 4)**: solo Cliente obligatorio | — | Se prueba con el merge |
| 1.6 | Dependabot: quitar manifiestos npm de librerías no usadas (55 alertas) | Hecho | **Pusheado** (`739bca1`) | No requiere prueba (no se cargan) |
| 1.7 | Camiones / Choferes: jQuery local en lugar de jsdelivr `latest` (3.2.1) | Hecho | **Pusheado** (`19a0ea4`) | **OK en VM (17/10)** |
| 1.8 | API: Newtonsoft.Json 12.0.2 → 13.0.1 | Hecho | **Pusheado** (`11d2489`) | **OK en VM (17/10)**: compila, login y guardado de viajes |
| 2 | Hora UTC / Argentina (`GETDATE`) | **No hecho** | — | — |
| 3.2 | Puerto Live Server 5500 vs 5502 | **No hecho** | — | — |
| 3.3 | Password de DB en `Web.config` en git | **No hecho** | — | Coordinar equipo |
| 3.4 | Direcciones mal geocodificadas | **Corregido el 17/10** (ver F14 en §8) | — | Corregir en Orígenes/destinos |
| 3.5 | `bin`/`obj` untracked en la VM | **No hecho** | — | Diagnosticar en VM |
| 4 | Limpieza SQL datos de prueba VM | **No hecho** (falta OK) | — | SQL listo abajo |
| 5 | Generales (Places, merge, Dependabot, tesis) | **No hecho** | — | — |
| 8 | Hallazgos de la recorrida general del 17/10 (F1–F14) | **No hecho** | — | Ver §8 |
| 6 | Proforma recibida Marfrig/Rukas (rediseño) | Solo definición | Doc commiteado | Ver `PROFORMA-CLIENTES-RUKAS.md` |
| 10 | Relevamiento visual y design system | Relevamiento por código hecho; faltan capturas en la VM | Doc commiteado | Capturas: ver §10 |

**Cómo aplicar en la VM lo ya subido:** `git pull` en `rocionuvoli` → recompilar la API en Visual Studio → hard refresh del navegador.  
**Para 1.4:** primero `git push` desde la Mac, después pull en la VM y reiniciar Live Server.

---

## 1. Cambios ya hechos (código)

### 1.1 Proforma: fechas estimadas obligatorias — PUSHEADO

**Commit:** `a8c2c43`  
**Archivos:** `gestion-facturacion.html`, `ProformasController.cs`

`FechaCarga` / `FechaEntrega` del modal se graban también en `FechaDesde` / `FechaHasta`, que en Azure **no admiten nulos**. Si quedaban vacías, el INSERT fallaba con 500 genérico.

Ahora:
- Asterisco con clase `req` (mismo estilo que Cliente/Origen/Destino del modal).
- Al Guardar borrador / Generar: no envía, marca `is-invalid`, alerta arriba *"Por favor, completá todos los campos requeridos *"*.
- API: 400 con mensaje claro si falta alguna.

**Probar:** nueva proforma → fechas vacías → Guardar → aviso + bordes rojos → completar → guarda OK. Repetir con Generar (no debe consumir número si falla).

### 1.2 Auditoría: nombre de entidad sin sufijo — PUSHEADO

**Commit:** `a8c2c43`  
**Archivo:** `Sgtlauditcontext.cs`

Usa `ObjectContext.GetObjectType(...).Name` para guardar `VIAJES` / `CAMIONES` en lugar de `VIAJES_7970…`.

**1.2b Base:** el 14/10 se corrió el `UPDATE` de los 127 registros viejos (OK, COMMIT).  
Hasta recompilar la API en la VM, ediciones nuevas pueden volver a grabar sufijo. Si pasa, repetir:

```sql
BEGIN TRAN;
UPDATE AUDITORIA
SET Entidad = LEFT(Entidad, LEN(Entidad) - CHARINDEX('_', REVERSE(Entidad)))
WHERE LEN(Entidad) > 40 AND CHARINDEX('_', Entidad) > 0;
SELECT @@ROWCOUNT AS Filas_Actualizadas;
-- COMMIT;  o  ROLLBACK;
```

**Probar:** editar un camión → Auditoría → Entidad = `CAMIONES` sin código largo.

### 1.3 Viajes: km en gris — PUSHEADO

**Commit:** `a8c2c43`  
**Archivo:** `gestion-viajes.html`

`#distanciaKm[readonly]` con fondo `#e9ecef`.

**Probar:** abrir viaje → km gris; si pasa a carga manual → editable (fondo normal).

### 1.4 Live Server ignoreFiles — PUSHEADO

**Commit:** `98ffe56`  
**Archivo:** `.vscode/settings.json`

Ignora `App_Data`, `bin`, `obj`, `.vs` para que escribir `whatsapp.log` o recompilar no recargue la página.

**Probar (después del push):** reiniciar Live Server → formulario a medio cargar → envío WhatsApp o rebuild → la página no se recarga.

En el mismo commit `98ffe56` también está `CLAUDE.md` (reglas de trabajo del repo).

### 1.5 Proforma: Cliente, Origen y Destino obligatorios al guardar — PUSHEADO (`7f546cd`)

**Archivos:** `gestion-facturacion.html`, `ProformasController.cs`

Decisión del 15/10 (antes era el 3.6): el asterisco significa lo mismo en los 5 campos. Cliente, Origen y Destino se piden ya al guardar el borrador, igual que las fechas; antes se podían dejar vacíos y recién se exigían al generar. Sin cliente, el borrador no aparecía al filtrar por cliente, no podía traer viajes y su PDF salía sin datos del cliente.

- Modal: mismo aviso rojo y bordes en rojo que las fechas (el select de Cliente también).
- API (`Crear` / `Editar`): 400 con la lista de campos que faltan. `Generar` mantiene sus controles.
- Borradores viejos que ya estén incompletos: al editarlos piden completar esos campos antes de guardar.

**EN REVISIÓN (17/10):** al probar en la VM, Rocío prefiere que Origen, Destino y las fechas estimadas **no** sean obligatorios en el borrador, solo al generar. Se define junto con el merge de `facugodoy`, porque Facu cambió esta misma parte:
- Agregó "Fecha de Inicio / Fecha Fin" (`FechaEmision` / `FechaVencimiento`, también período de "Traer viajes"); `FechaDesde`/`FechaHasta` = esas fechas o, si faltan, carga/entrega. Si están todas vacías el guardado sigue fallando (la base no acepta nulos ahí).
- No valida nada al guardar el borrador.
- En **Generar** sacó Origen y Destino (pide cliente, conceptos y total).

Preguntas a cerrar en el merge: ¿Cliente obligatorio en borrador? (sin cliente no se pueden traer viajes ni filtrar). ¿Qué fecha usar si no se carga ninguna (propuesta: la del día)? ¿Origen y Destino se exigen al generar?

**Probar (cuando se redefina):** nueva proforma → dejar Cliente, Origen y Destino vacíos (con fechas cargadas) → Guardar borrador → aviso + los 3 en rojo → completar uno por uno → se va quitando el rojo → guarda OK. Repetir con Generar.

### 1.6 – 1.8 Alertas de Dependabot — PUSHEADO (17/10)

De las 60 alertas, solo 2 afectaban a la app; el resto venía de manifiestos de desarrollo de librerías de la plantilla. Un commit por corrección, para poder revertir una sola si falla.

- **1.6** Se quitaron los `package.json` / `package-lock.json` / `bower.json` de `rater-js`, `dayjs`, `datatables.net` y `datatables.net-bs5` (ninguna pantalla las carga; las grillas usan `simple-datatables`). Cierra 55 alertas. Sin efecto en pantalla.
- **1.7** `gestion-camiones.html`, `gestion-choferes.html`, `listado-choferes.html` cargaban `cdn.jsdelivr.net/jquery/latest` (= jQuery **3.2.1**, con XSS conocidos; Dependabot no lo ve). Choferes además cargaba jQuery dos veces. Ahora usan la copia local `assets/extensions/jquery/jqueryajax.js` (3.6.0), como el resto.
  **Probar:** en las 3 pantallas, abrir con Ctrl+F5 → consola (F12) sin errores → tooltips, selector de fechas, alta / edición / baja.
- **1.8** `packages.config`, `.csproj` y `bindingRedirect` de `Web.config` pasan a Newtonsoft.Json 13.0.1 (alerta alta: DoS con JSON muy anidado).
  **Probar:** en la VM, **Restore NuGet Packages** → **Rebuild Solution** → login + un par de pantallas que guarden (viajes, proformas). Si la API no arranca, revertir ese commit solo.

**Quedan abiertas:** 2 alertas medias del paquete NuGet `jQuery` 3.4.1 de la API (`WebApi_TransporteSanchez/Scripts/`, solo lo usan las vistas MVC de la API, no el front). Las 55 de los manifiestos se cierran solas cuando el cambio llegue a la rama por defecto del repo (`master`).

**Otros scripts sin versión fija** en esas 3 pantallas: `momentjs/latest` y `npm/daterangepicker` (jsdelivr). No tienen alertas hoy, pero conviene fijarles versión.

---

## 2. Hora guardada en UTC — NO HECHO

**Prioridad alta, después de la presentación.** Decisión del 14/10: no tocar antes de la demo.

El sistema toma la “hora actual” de tres lugares:

| Quién | Qué hora | Dónde |
|---|---|---|
| Base (`GETDATE()` en Azure) | UTC (+3 h vs AR) | Auditoría, Proformas, estado/evidencia Viajes, Cuenta corriente, Grupos, WhatsApp |
| API (`DateTime.Now`) | Argentina (API en PC local) | Alta/edición viajes; bajas/activaciones choferes/camiones/clientes |
| Navegador (`toISOString()`) | UTC | Altas/ediciones choferes/camiones/clientes (pantallas restan 3 h al mostrar) |

**Impacto:** cuenta corriente “vencida” desde las 21:00; proforma sin emisión post-21:00 con fecha del día siguiente; Auditoría 3 h adelantada; Viajes con `Fecha_Modi` inconsistente; riesgo si la API se publica en Azure.

Facturación ya usa `FechaArgentina()` para comprobantes.

**Plan:**
- **Etapa 1:** reemplazar `GETDATE()` por  
  `CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime)`  
  en ~35 usos / 11 archivos (CuentaCorriente 10, Proformas 9, Recibos 4, Viajes 3, Sgtlauditcontext 2, WhatsAppConfig 2, Grupos, GestionContenido, Facturas, Comprobantes, Autenticacion). Avisar a Facu y Fede.
- Probar flujo por flujo en la VM (las SQL van como texto: un typo compila igual).
- `UPDATE` de fechas viejas de Auditoría (restar 3 h) tras el cambio.
- **Etapa 2 (opcional):** unificar Choferes/Camiones/Clientes (hoy UTC + resta al mostrar).

---

## 3. Otros hallazgos VM — NO HECHOS

| # | Qué | Qué hacer | Criticidad demo |
|---|---|---|---|
| 3.2 | Puerto 5500 vs 5502 | Unificar; limpiar referrers de la clave Maps | Baja (funciona con 5500) |
| 3.3 | Password DB en `Web.config` en git | Sacar del repo + **rotar password Azure**. Repo GitHub **privado** → no urgente para demo | Media (seguridad) |
| 3.4 | “claros del bosque” → Córdoba; “Sede Temperley” → Paso del Rey | Corregir datos en Orígenes y destinos | Alta si se demuestran esos lugares |
| 3.5 | `bin`/`obj` como untracked en VM | En VM: `git check-ignore -v WebApi_TransporteSanchez/bin`. No commitear esas carpetas | Baja |

*(El ítem 3.1 era Live Server reload → resuelto como 1.4. El 3.6 (asteriscos de la proforma) → resuelto como 1.5.)*

---

## 4. Limpieza de datos de prueba en la VM — NO HECHO

**Falta OK explícito** antes de correr. Cantidades esperadas: 73 / 2 / 1.

```sql
BEGIN TRAN;
DELETE FROM AUDITORIA WHERE Auditoria_ID BETWEEN 373 AND 454
  AND (Usuario = 'PRUEBA-AUTO' OR (Usuario = 'RNUVOLI' AND Clave IN ('Viaje_ID=22', 'Viaje_ID=23')));
DELETE FROM PROFORMA_DETALLE WHERE Proforma_ID = 15;
DELETE FROM PROFORMAS WHERE Proforma_ID = 15 AND Observaciones LIKE 'PRUEBA-AUTO%';
-- Revisar cantidades → COMMIT;  o  ROLLBACK;
```

- PF-00000003 queda consumido en `SEQ_PROFORMA`.
- **No tocar** FGODOY (400–403, 411, 416) ni RNUVOLI chofer 4 (367, 439).

Opcional: re-pruebas WhatsApp regla 3 en VM (`C:\pruebas-sgtl\prueba-viajes.ps1`; sección 7 consume proforma).

---

## 5. Pendientes generales — NO HECHOS

- **Desplegables largos con búsqueda al escribir** (pedido por Rocío el 17/10). Donde la lista es larga, que además de elegir se pueda escribir para filtrar. Primer caso: **localidad** (con el listado oficial hay ~880 en Buenos Aires y ~500 en Córdoba) en Orígenes y destinos, Choferes y Clientes. Aplicar con el mismo criterio a cualquier otro desplegable que crezca: clientes, choferes, camiones, orígenes/destinos, tarifas. La plantilla ya trae `choices.js` en `assets/extensions/` (buscador dentro del select); usar el mismo componente en todas las pantallas para que se comporte igual.
- **Orígenes y destinos: autocompletar direcciones con Google Places y guardar coordenadas** (confirmado por Rocío el 17/10 como mejora a futuro). Evita direcciones mal ubicadas como las del 3.4 / F14: hoy se cargan a mano y Google las interpreta.
- Merge `rocionuvoli` → `main` (avisar Fede y Facu).
- Dependabot: 60 alertas revisadas el 17/10 → ver 1.6 – 1.8.
- Antes de la tesis: limpiar registros de prueba; usuarios “reales”.
- **API — silenciar advertencias "Falta el comentario XML" (CS1591).** El `.csproj` genera documentación XML (`DocumentationFile`, la usa Swagger) y el compilador avisa por cada miembro público sin `///`: son cientos y tapan advertencias que sí importan. Agregar `<NoWarn>1591</NoWarn>` en el `PropertyGroup` del `.csproj`. Sin efecto en el funcionamiento.
- **API — reinstalar los 30 paquetes NuGet marcados `targetFramework="net45"`.** El proyecto es .NET 4.8 y NuGet avisa "Algunos paquetes NuGet se instalaron con una plataforma de destino diferente…" (Microsoft.Bcl.*, Microsoft.IdentityModel.*, System.IdentityModel.Tokens.Jwt, etc.). Hoy compila y funciona igual. En la VM: Consola del Administrador de paquetes → `Update-Package -Reinstall -ProjectName WebApi_TransporteSanchez` → Rebuild y probar todo. Hacerlo **después del merge con Facu** y en un commit solo (toca `packages.config` y `.csproj`).
- **API — MailKit 2.11.1 / MimeKit 2.11.0 con vulnerabilidad moderada** (aviso de NuGet al restaurar, Dependabot no lo muestra). Actualizar implica pasar a 4.x (salto grande). Es el envío de mails de Facu (configuración de email y envío de comprobantes): hacerlo **con Facu, después del merge**.

---

## 6. Proforma recibida (clientes Rukas / Marfrig) — SOLO DEFINICIÓN

No es un bug de las pruebas: es un **rediseño de negocio** detectado al contrastar SGTL con las respuestas de Claudia.

- Resumen para compartir: `PROFORMA-CLIENTES-RUKAS.md`.
- Preferencia actual: opción **B** — registrar proforma **recibida** de Marfrig (PDF + datos + viajes) y emitir factura TS desde ahí; directos mantienen proforma propia.
- Lectura PDF (PdfPig) como mejora; OCR no para el MVP.
- Diseño técnico acordado el 15/10: ver §10 de `PROFORMA-CLIENTES-RUKAS.md` (proforma de tipo Recibida, estado En reclamo si no coinciden totales, factura con el flujo actual de Facu).
- Implementación: no empezada. Esperando de Claudia (pedido 15/10): PDF de ejemplo y qué hace hoy cuando no coinciden los importes. Después, alinear con Facu.

---

## 7. Checklist operativo inmediato

1. [ ] Desde la Mac: `git push origin rocionuvoli` (sube `98ffe56` = Live Server + CLAUDE.md).
2. [x] `PROFORMA-CLIENTES-RUKAS.md` commiteado junto con este documento.
3. [x] En la VM: `git pull`, recompilar API, reiniciar Live Server (17/10).
4. [x] Probar 1.2, 1.3, 1.4, 1.7, 1.8: OK (17/10). 1.1 y 1.5 en pausa hasta el merge.
5. [ ] Si reaparecen entidades con sufijo: SQL 1.2b.
6. [ ] Evitar en demo las direcciones 3.4 o corregirlas en datos.
7. [ ] Hora UTC (§2) y demás: después de la presentación.

---

## 8. Hallazgos de la recorrida general en la VM (17/10) — NO HECHOS

Recorrida de las 20 pantallas hecha por Claude en la VM, **antes del merge con Facu** (línea base para comparar después).
Reporte completo: `docs/pruebas/2026-10-17-recorrida-general-pre-merge-facu.md`. Verificación de F1 y F3: `docs/pruebas/2026-10-17-verificacion-F1-F3.md`.
Usuario de prueba **PRUEBACLAUDE** (Usuario_ID 10, grupo Listados): se conserva para las pruebas del merge; borrarlo antes de la tesis (SQL en el reporte de verificación). No se guardaron datos: altas, ediciones y bajas quedaron **sin probar**.

| ID | Qué | Gravedad | Cuándo | Archivos |
|---|---|---|---|---|
| F1 | La API devuelve las **contraseñas en texto plano** (`Usuarios/Buscar` y otros) y gestion-usuarios las precarga en el modal | **Alta** | **Hecho y OK en VM (17/10)**, commit `e8b889a`. Login con PRUEBACLAUDE después de editarlo: OK, la contraseña se conservó. Conviene que el equipo cambie sus contraseñas | `UsuariosController.cs` (97, 362, 620), `gestion-usuarios.html` (800) |
| F1b | La mayoría de la API **no pide token** (solo facturación y Email lo validan) y las contraseñas se guardan sin hash | **Alta** | Después del merge: cambio grande, el front casi nunca manda `Authorization` | Todos los controllers + pantallas |
| F2 | `WhatsAppConfig` devuelve el **Access Token de Meta** sin token y la pantalla lo muestra en texto | **Alta** | Coordinar con **Fede**; si se copió, rotar el token en Meta | `WhatsAppConfigController.cs`, `configuracion-whatsapp.html` |
| F3 | **Permisos por grupo da 500** en todos los grupos: fila de `MENU` con `Menu_Principal` NULL. "Guardar permisos" quedaba habilitado con la lista vacía (riesgo de borrar permisos) | **Alta** | **Hecho y OK en VM (17/10)**: pantalla (`d407c18`) + dato corregido en Azure con `database/menu/01_menu_principal_not_null.sql`. El menú 23 se borró unificado con "Integración WhatsApp" (#21) | Base (`MENU`), `gestion-gruposypermisos.html`, `GruposController.cs` |
| O1 | "Guardar permisos" borra y vuelve a insertar todas las filas del grupo aunque no cambie nada (~3,3 s, 12 registros de auditoría a nombre de `sistema` por guardado) y el botón sigue habilitado mientras guarda | Baja | Después del merge: guardar solo la diferencia, pasar el usuario a la auditoría, bloquear el botón mientras guarda | `GruposController.cs`, `gestion-gruposypermisos.html` |
| O2 | Editar un usuario borra y vuelve a crear su fila en `GRUPOS_USUARIOS` aunque no cambien los grupos (auditado como `sistema`) | Baja | Después del merge (mismo arreglo que O1) | `UsuariosController.cs` |
| O3 | El apellido (y nombre) de usuario no acepta guiones ni apóstrofos | Baja | Ya | `gestion-usuarios.html` |
| F4 | Se puede **anular una proforma Facturada** | Alta | **Resuelto en la rama de Facu** (reemplazó Anular por anular factura con nota de crédito). Verificar tras el merge | `ProformasController.cs` |
| F5 | `window.bootstrap` nunca se define (error PerfectScrollbar de `app.js`): "Más detalles" de listado-camiones no abre; toasts de camiones/choferes tiran error | Media | Ya | `assets/compiled/js/app.js` o `sidebar-loader.js` |
| F6 | listado-viajes: el detalle muestra IDs en vez de nombres y no muestra chofer/camión | Media | Ya | `listado-viajes.html` (530-542) |
| F7 | listado-usuarios: el filtro "Nombre de usuario" no filtra (parámetro mal nombrado) | Media | Ya | `listado-usuarios.html` (277) |
| F8 | Fechas: grilla resta 3 h pero el filtro compara en UTC (camiones, clientes, auditoría) | Media | Con el §2 | — |
| F9 | Tarifas fijas #2 y #3 sin cliente y duplicadas (nunca se encuentran al cargar un viaje); tarifa por km 2026 solo hasta 100 km | Media | **Hecho (17/10)** desde la pantalla: #2 con cliente QUICKFOOD (tenía ClienteID 1, que no existe) y #3 eliminada (duplicada, sin viajes). Pendiente: tarifa por km 2026 solo hasta 100 km | `gestion-tarifas.html` |
| F10 | Usuario "Cgodoy" duplicado (IDs 8 y 9, doble envío) | Media | **Dato corregido (17/10)** por SQL: se borró el usuario 9 y su grupo; queda el 8. Código (índice único + bloquear doble clic): pendiente | `UsuariosController.cs`, `gestion-usuarios.html` |
| F15 | Eliminar un usuario con grupo asignado falla con error de FK (`FK_GRUPOS_USUARIOS_USUARIOS`, mensaje técnico en inglés) | Media | **Hecho (17/10, sin push)**: la API quita antes sus asignaciones a grupos. **Probar en VM:** eliminar PRUEBACLAUDE al terminar las pruebas del merge (o un usuario de prueba nuevo) | `UsuariosController.cs` (Delete) |
| M1 | Menú "Gestión de contenido" duplicado (17 con tilde, 19 sin tilde) | Baja | **Dato corregido (17/10)** por SQL: se borró el 19 y su asignación (solo Administradores); queda el 17 | Base (`MENU`, `GRUPOS_MENU`) |
| F11 | Filtro de estado de proformas sin "Facturada" | Baja | **En el merge** (facturación de Facu) | `gestion-facturacion.html`, `listado-facturas.html` |
| F12 | Errores de consola: `simple-datatables.js` sin `#table1` y `usernameDisplay` antes del header | Baja | Ya | gestion-viajes / clientes / orígenes / tarifas, listado-clientes |
| F13 | CUIT sin control de dígito verificador | Baja | Ya (gestion-clientes choca con Facu: hacerlo después del merge) | `gestion-clientes.html` (1483) |
| F14 | Datos de direcciones: "Sede Banfield" con localidad Quilmes, "Sede Temperley" con Morón; viaje 6 con origen/destino de otros clientes | Baja | **Dato corregido (17/10)** por SQL, después de completar LOCALIDADES (225 → 3906 con `database/localidades/01_completar_localidades.sql`): Sede Temperley (destino 3) → Av. Hipólito Yrigoyen 10500, Temperley; Sede Banfield (destino 4) → Av. Adolfo Alsina 600, Banfield (direcciones de fantasía que existen en Google Maps); claros del bosque (origen 2) → Av. Celso Barrios 3609, Córdoba (real). Cierra también el 3.4. Viaje 6: no tocar (limpieza antes de la tesis). **Probar en VM:** viaje nuevo Sede Quilmes → Sede Banfield sin "Ubicación aproximada" y ~10–12 km | Orígenes y destinos |

**Mejoras sugeridas** (voseo, títulos de pestaña, formatos de fecha, validaciones al escribir, búsquedas sin tildes, 404 como "sin datos", etc.): ver la sección "Mejoras sugeridas" del reporte.

**Para la próxima ronda en la VM:** probar altas, ediciones y bajas requiere aprobar el permiso de escritura cuando Claude lo pida (los datos van marcados `PRUEBA-CLAUDE`). En la VM Live Server levanta en **5500** (ver 3.2).

**Script de F3:** `database/menu/01_menu_principal_not_null.sql` (SSMS, base `Transporte_Sanchez`, backup previo, avisar al equipo porque `MENU` es compartida).
1. Ejecutarlo tal cual (`@Aplicar = 0`): solo muestra el diagnóstico (menús con NULL, grupos que los tienen, posible duplicado "Gestión de contenido").
2. Si está bien, poner `@Aplicar = 1` y ejecutarlo de nuevo: pasa los NULL a 0, deja la columna `NOT NULL` con `DEFAULT 0` (para que no se repita con altas manuales) y muestra la verificación (tres "OK").
3. El código no lee el valor de `Menu_Principal` (la API da de alta menús con 0), así que el cambio no altera el menú lateral ni los permisos.

**Diagnóstico corrido el 17/10:** la columna admite NULL y no tiene default; un solo menú con NULL: **23 "Configuracion WhatsApp"**, sin grupos asignados (lo cargaron a mano). Al volver a funcionar la pestaña de permisos, la API lo renombra a "Integración WhatsApp" o, si ese ya existe, lo unifica y lo borra (`AsegurarCatalogoMenuPermisos`). Además existen **17 "Gestión de contenido"** y **19 "Gestion de contenido"**, cada uno con 1 grupo: para el menú lateral son lo mismo (compara sin tildes), pero en "Permisos por grupo" aparecen dos casillas. Pendiente: unificarlos en 17 (sumarlo a los renombres de `AsegurarCatalogoMenuPermisos` o con un script).

Si aparecen "Gestion de contenido" y "Gestión de contenido" como dos menús distintos, **no borrar ninguno todavía**: pasar el resultado del diagnóstico para decidir cuál queda (el menú lateral usa el nombre para habilitar la pantalla).

---

## 9. Merge de `facugodoy` (35894cc) en `rocionuvoli` — RESUELTO, SIN PUSH NI PRUEBA EN VM (17/10)

Respaldo de la rama antes del merge: `respaldo/pre-merge-facu`. Resumen para Facu (antes vs. ahora y por qué): **`docs/merge-facugodoy-2026-10-17.md`**.
La rama de Facu arrancó en `c40b518`, antes de todo el trabajo de Viajes/Rukas: muchas diferencias no son decisiones distintas sino código que él no vio.

**Ya resuelto en el merge:**
- Más de 30 archivos combinados solos (configuración de facturación, anulación de factura con nota de crédito, estado "Facturada", reportes de proformas, buscador de clientes, código postal, cuenta corriente, recibos, comprobantes, dashboard, scripts 04–09).
- `ClientesController.cs`: quedan los dos campos nuevos (tipo de cliente de Rocío + código postal de Facu).
- `ViajesController.cs` y `gestion-viajes.html`: quedan las reglas de estado de Rocío + el bloqueo de Facu para viajes con Factura vigente (no se editan ni eliminan). El dato "Facturada" se calcula en la misma consulta de la grilla (la versión de Facu hacía una consulta por viaje).
- Menú Configuración solo para admin (decisión de Facu, aceptada por Rocío).

**Decisiones de Rocío (17/10), aplicadas en `ProformasController.cs`, `gestion-facturacion.html`, `FacturasController.cs`, `ComprobantesController.cs`, `ViajesController.cs` y `gestion-viajes.html`:**
1. **Qué significa "Facturado" — DECIDIDO por Rocío (17/10):** el viaje pasa a **Facturado al emitir la factura**, no al generar la proforma. **Sin estado intermedio**: mientras está en una proforma conserva su estado (Listo para facturar / Entregado) y la pertenencia sale de la reserva de Facu (`PROFORMAS_VIAJES`):
   - La grilla de viajes muestra "En PF-xxxx" (dato calculado, como "Facturada").
   - Bloqueo: en una proforma **Generada o Aceptada** no se edita; en **Borrador** sí.
   - Al emitir la factura (FacturasController de Facu, misma transacción): viajes → **Facturado**.
   - Al anular la proforma o emitir la nota de crédito cancelatoria: viajes vuelven a Listo para facturar / Entregado y se libera la reserva.
   - **Datos existentes:** hay viajes en "Facturado" por proformas generadas **sin factura**; armar script (revisado antes de correr) para devolverlos a Listo para facturar / Entregado.
2. **Estados de la proforma — DECIDIDO por Rocío (17/10):** circuito de Facu, **Borrador → Generada → Aceptada → Facturada** (+ Anulada, según el punto 3). Se quitan Enviada y Rechazada. Sin impacto en datos: en la base hay 3 Borrador, 3 Generada y 2 Facturada (consulta del 17/10).
3. **Corregir una proforma con error — DECIDIDO por Rocío (17/10):**
   - **Borrador** (sin número) → **Eliminar** (lo de Facu: se borra).
   - **Generada** (ya tiene PF-xxxx) → **Anular**: queda como Anulada, no se borra (no deja huecos de numeración y queda registro si se envió al cliente).
   - **Aceptada sin factura** → **Anular** (por si el cliente se echa atrás antes de facturar).
   - **Facturada** → **nota de crédito** cancelatoria (lo de Facu).
   - En todos los casos se libera la reserva (`PROFORMAS_VIAJES`) y los viajes vuelven a Listo para facturar / Entregado. **Falta en el código de Facu:** hoy la nota de crédito no libera la proforma ni los viajes (quedan reservados y no se pueden volver a facturar) — comentárselo a Facu, es su módulo.
4. **Campos obligatorios y fechas — DECIDIDO por Rocío (17/10)** (reemplaza 1.1 y 1.5):
   - Borrador: solo **Cliente** obligatorio. Origen, destino y fechas estimadas de carga/entrega: opcionales.
   - Generar: cliente + al menos un concepto + total > 0 (Facu) + reglas de viajes de Rocío (Rukas con remito y N° de transporte, directos Entregados, sin viajes ya facturados).
   - **Período de los viajes** ("Fecha de Inicio / Fin" de la pantalla de Facu) se guarda en **FechaDesde / FechaHasta** (no admiten nulos: si no se carga, fecha del día). **FechaEmision** = la que se pone al generar; **FechaVencimiento** = vencimiento real de la proforma.
   - Motivo: en la versión de Facu el período se guardaba en FechaEmision / FechaVencimiento, y la factura toma la proforma como **vencimiento sugerido** (`FacturasController`, `FechaVencimientoSugerida`): con un período de septiembre la factura nacería vencida y la proforma figuraría emitida el día 1 del período.
5. Recomendación de base: reglas de Rocío para Traer viajes / Generar (Rukas con números, directos Entregados, advertencias) + reserva de Facu (`PROFORMAS_VIAJES`, un viaje en una sola proforma, también en borrador) + su estado Facturada y anulación con nota de crédito.

**Pendiente después del push:**
- Correr `database/viajes/01_facturado_solo_con_factura.sql` (primero `@Aplicar = 0`).
- Rebuild en la VM y prueba completa (ver abajo). Contarle a Facu con el resumen de `docs/`.
- Revisar 1.1 / 1.5 / F4 / F11 como cerrados por este merge.

**Probar en la VM (ronda con Claude, flujo de punta a punta con datos `PRUEBA-CLAUDE`):**
1. Proforma: guardar borrador solo con cliente; Traer viajes con período (advertencias Rukas / directos); Generar → número PF; los viajes **siguen** en su estado y en Gestión de viajes figuran "En PF-xxxx" con Editar deshabilitado.
2. Anular una Generada → Anulada, conserva el número, los viajes quedan libres (se pueden traer en otra proforma). Eliminar un borrador.
3. Aceptar → emitir factura → los viajes pasan a **Facturado**; la factura **no** nace vencida (vencimiento ≠ fin del período).
4. Nota de crédito cancelatoria de esa factura → proforma Anulada, viajes vuelven a Listo para facturar / Entregado y se pueden incluir en otra proforma.
5. Viajes: no se puede eliminar uno que está en un borrador; sí editarlo.
6. Clientes: alta y edición con tipo de cliente y código postal. Configuración → Facturación solo para admin.

**Base de datos: lista (17/10).** Verificado con una consulta de solo lectura: los scripts 04 a 08 de Facu ya estaban aplicados en `sql-tesis`; faltaba el **09** (restricción de tipos de comprobante, que es también el cambio del 02 para bases existentes): Rocío lo corrió y quedaron los 7 en APLICADO.

---

## 10. Relevamiento visual y design system — EN CURSO

Las pantallas se ven y se comportan distinto según la etapa en que se hicieron (avisos, fechas, colores de estado, tono, botones). El objetivo es definir un design system y aplicarlo a todo.

1. [x] Relevamiento por código de las 23 pantallas (17/10, actualizado con el merge de Facu): `docs/design-system/01-relevamiento-codigo.md`. Incluye las decisiones a tomar (D1–D17).
2. [ ] Capturas en la VM: `docs/design-system/02-instructivo-capturas-vm.md`. Pull en la VM → pedirle al agente de Cursor en la VM que siga el instructivo (login con usuario admin). No guarda datos. Después, pasar a la Mac la carpeta de capturas y el reporte (§7 del instructivo).
3. [ ] Repaso con Rocío de las decisiones D1–D17, una por una, con las capturas a la vista. Las que no dependen de cómo se ve (tono, avisos, confirmaciones, fechas, montos) se pueden decidir antes de tener las capturas.
4. [ ] Decisiones del design system (`docs/design-system/03-decisiones.md`), CSS y JS de interfaz compartidos, y regla en `CLAUDE.md`.
5. [ ] Piloto en un módulo, después el resto. Proformas, cuenta corriente y configuración (Facu) y WhatsApp (Fede): coordinando con ellos.

Bugs vistos en el relevamiento (no visuales):

| ID | Qué | Gravedad | Cuándo | Archivos |
|---|---|---|---|---|
| R1 | El botón de reporte CSV no hace nada: llama a `generarReporteCSV()`, que no existe en esa página | Media | Ya (sigue igual después del merge) | `listado-viajes.html` (158), `gestion-clientes.html` (179) |
| R2 | Gestión de contenido: `showErrorToast()` no existe; si falla la red al cargar o guardar, tira error y no avisa | Baja | Ya | `gestion-contenido.html` (299, 361) |
| R3 | Camiones: el error de fecha pide "DD-MM-YYYY" pero el campo usa AAAA-MM-DD | Baja | Con la decisión de fechas (D11) | `gestion-camiones.html` (1082) |
| R4 | "Cambiar Contraseña" (encabezado) y "Documentación" (menú) son links que no hacen nada | Baja | Decidir si se implementan o se sacan | `views/header.html` (34), `sidebar-loader.js` (90) |
| R5 | `</script>` suelto en el pie (inofensivo) | Baja | Con el piloto | `listado-viajes.html` (204) |
