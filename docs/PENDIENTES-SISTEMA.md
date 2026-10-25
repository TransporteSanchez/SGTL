# Pendientes a corregir en SGTL

Relevamiento del 14/10/2026 (prueba de Viajes en la VM + revisión en la Mac).
**Última actualización de este documento: 24/10/2026.**

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
| 6 | Proforma de plataforma (Rukas): importar el Excel y conciliar | Etapas 1–4, filtro Tipo, PDF, condiciones editables, importe unificado e IVA de la API hechos; etapa 6 **descartada** (factura interna). **Prueba mínima OK en VM (19/10)**, con una falla baja (F1) corregida. **22/10: modal en pasos, el Excel se guarda siempre, reclamo por línea y situación en el listado** | **Pusheado** (`b4729e0`); la corrección de F1, en el commit siguiente; lo del 22/10 **sin pushear** | Verificar F1; lo del 22/10: **correr antes `02_reclamo_por_linea.sql`** y probar (ver §6) |
| 10 | Relevamiento visual y design system | Piloto en Choferes OK. **Aplicado en todas las pantallas:** las nuestras el 20/10; viajes y las de Facu y Fede el 22/10, junto con el estilo visual nuevo (§20). Sigue abierto R7 (§10) | **Pusheado** (piloto `020e892`; el resto, con §20) | Tanda del 20/10 (tabla en §10) y §20: probar en VM |
| 11 | Documentación ordenada en `docs/` + `docs/README.md` y `AGENTS.md` | Hecho (18/10) | **Pusheado** (`ae6288d`) | **OK en la práctica:** la VM usó `docs/equipo/PRUEBAS-VM-CLAUDE.md` en todas las rondas del 18/10 |
| 12 | Merge de presupuestos de Facu (`4a84bb2`) en `rocionuvoli` + botones "+" | Hecho (18/10); F1 corregida | **Pusheado** (`4635408`) | **OK en VM (18/10)**, F1 verificada (ver §12) |
| 13 | Mejoras de la ronda del 18/10 (viajes, presupuestos, proformas) | Primera tanda **OK en VM**; segunda tanda (C4 y mejoras del reporte) hecha | **Pusheado** (`bb418bc`) | Segunda tanda: en la ronda única (ver §13 y §14) |
| 14 | Merge de Documentación de Facu (`04a394b`): manual de usuario e informes de versión | Hecho (19/10); base verificada | **Pusheado** (`e3359ea`) | En la ronda única (ver §14) |
| 15 | Mejoras de la meet del 18/10: reenviar WhatsApp, aviso al eliminar viaje, cambiar contraseña con código por WhatsApp, sacar `repositorio.zip` | **No hecho** (solo anotado) | — | Ver §15 |
| 16 | Diagramas de los flujos para que Facu y Fede prueben y para la presentación con la profesora | **Primera versión hecha (19/10):** viajes y proformas (propia y Rukas) + instructivo de prueba y guion | Commit del 19/10 | Ver §16 |
| 17 | Pasar `rocionuvoli` a `facugodoy`, `fedemontenegro` y `main` | **Hecho (19/10):** las cuatro ramas iguales. `fedemontenegro` se pisó con el OK de Fede | **Pusheado** | Fede tiene que resetear su copia local (ver §17) |
| 18 | Merge de Facu del 20/10 (`e701a4f`): concepto obligatorio en proformas, recibos y comprobantes, permisos agrupados y usuarios por grupo | Hecho (20/10); Grupos y permisos con nuestro diseño y el comportamiento de Facu | **Pusheado** a las cuatro ramas (`2a23274`, 20/10, antes de terminar la prueba) | Script `database/menu/02_…` **aplicado (20/10)**. **Probado en parte (20/10):** lo probado OK; falla el modo oscuro de cuenta corriente (de antes); falta lo que genera numeración (ver §18) |
| 19 | Dashboard dinámico: período (último mes, trimestre, semestre, año o a mano), indicadores con comparación, gráficos de viajes y km, km por camión, últimos y próximos viajes, comparativa por mes, para revisar, ITV de camiones y km por chofer | Hecho en la Mac (21/10) con API falsa; `ResumenCosto` acepta fechas | **Pusheado** (`cc2dcac`, `b991c8f`, `200beaa`) | Recompilar la API y probar (ver §19) |
| 20 | Estilo visual nuevo (§12 del design system) en todas las pantallas: fondo claro con línea de color, tarjetas, tablas, campos, botones livianos, avisos, modales, pestañas, paginador, calendario | En curso (22/10): base aplicada a las 26 pantallas; viajes, proformas, cuenta corriente, Gestionar facturación, e-mail, WhatsApp, login, presupuestos, documentación y dashboard al día y repaso final hecho (22/10); falta probar en la VM. Los 4 temas que habían quedado sin tocar, resueltos el 22/10 (final de §20); las contraseñas sin cifrar se resuelven con el merge de Facu (§21) | **Pusheado** (22/10, con presupuestos, filtros y banderita) | Ver §20 |
| 21 | Merge de Facu del 22/10 (`e0779bf`): contraseñas con hash, cuenta corriente (Distribuir, NC sobre varias facturas, montos 1.234,56), mapa en presupuestos, observaciones unificadas en proformas | Hecho (22/10), conflictos resueltos uno por uno con Rocío: lógica de Facu, diseño nuestro. Scripts de la base ya corridos | Commit de merge en `rocionuvoli`, **sin push** | Ver §21 |
| 22 | Merge de Fede del 22/10 (`1bd31d3`): código de área de 4 dígitos para el WhatsApp del chofer y nombre comercial del cliente | Hecho (22/10), sin conflictos; tres ajustes aprobados por Rocío. Script ya corrido | Commit de merge en `rocionuvoli`, **sin push** | Ver §22 |
| 23 | Prueba mínima en la VM antes de pasar `rocionuvoli` a `facugodoy` y `fedemontenegro` | Hecha (22/10): primera vuelta con F1 (corregida) y reprueba con los 8 puntos OK | **Pusheado** (`c778c0a`; las tarjetas de cuenta corriente, `1a78bd8`) | **OK en VM (22/10)**; ramas pasadas: `facugodoy`, `fedemontenegro` y `main` en `36a92c8` (ver §23) |
| 24 | Viajes: registrar, editar y ver detalle; Ver detalle de choferes, camiones, clientes y usuarios con el mismo armado; ronda de observaciones (ícono de información, íconos alineados, proforma de Rukas) | Hecho en la Mac (22/10) con API simulada, con la propuesta aprobada por Rocío | **Pusheado** (`cea8407`, `72c1600`, `dd6034c`; la ronda de observaciones, `910ca32`, `3917181`, `c2bf14b`; la tercera vuelta de Rukas y lo que siguió, `3751c33` y los dos siguientes; 22/10) | **Probado en VM (23/10)**: OK salvo fallas leves, arreglos en §28 |
| 25 | Proformas: los datos del cliente no se editan en la proforma; "Editar cliente" abre la edición del cliente y actualiza los borradores | Hecho en la Mac (22/10) con API simulada; decidido por Rocío charlándolo con Facu | **Pusheado** (`b7e183d`, `eb6d96b`; 22/10) | **Compilado y probado en VM (23/10)**: OK, mejoras en §28 |
| 26 | Motivos de los botones deshabilitados con una sola frase en todas las pantallas: "No se puede {acción}: {qué le pasa a esta fila}" | Hecho en la Mac (23/10), con la estructura elegida por Rocío | **Pusheado** (`f2bc239`; 23/10) | **OK en VM (23/10)**; 5 casos sin datos para verlos (ver §26) |
| 27 | Subtítulos de las secciones de formularios y detalles con un solo estilo (`.sgtl-bloque-titulo`): sin `h6` azules ni copias propias | Hecho en la Mac (23/10), pedido de Rocío | **Pusheado** (`3a3fa65`, `c831e1c`; 23/10) | **OK en VM (23/10)** (ver §27) |
| 28 | Arreglos y mejoras del reporte de la VM del 23/10 (§24 y §25) | Hecho en la Mac (23/10), aprobado por Rocío; probado con la API simulada | **Pusheado** (`e7649d0` a `aef6e4a`; 23/10) | **OK en VM (23/10)**, los 10 pasos (ver §28) |
| 29 | Falla y mejoras de la reprueba del 23/10 | Hecho en la Mac (23/10), aprobado por Rocío | **Pusheado** (`cfe08c5` a `a1e2b8a`; 23/10); las dos mejoras de cuenta corriente, **pusheadas** (`054cc38`) | **OK en VM (23/10)**; las dos mejoras, sin probar (ver §29) |
| 30 | Gestionar empresa (nueva): datos y logo de la empresa que salen en los PDF, con versiones por fecha; Gestionar contenido queda con la apariencia sola (logo del sistema) | Hecho en la Mac (23/10) con API simulada, con el diseño y las decisiones de Rocío | **Pusheado** (`cdbcd76`, `16b05c4`; 23/10) | **Correr antes `database/empresa/01_crear_empresa.sql`**, recompilar la API y probar (ver §30) |
| 31 | Tarifas: no se superponen (fijas y por km), el neto es ruta + vuelta vacío, el viaje toma la tarifa de su fecha de inicio, orígenes del cliente (lo encontró Facu) | Hecho en la Mac (23/10) con API simulada, con las decisiones de Rocío; datos de la base revisados y corregidos (23/10) | **Pusheado** (`1ca5d87` a `4ee7ef3`; 23/10) | **OK en VM (23/10)** (ver §32) |
| 32 | Pasar `rocionuvoli` a `facugodoy`, `fedemontenegro` y `main` antes de la reunión con la profe | **Hecho (23/10)** a pedido de Rocío, avance directo (ninguna tenía nada propio): de `36a92c8` a esta misma versión, las cuatro ramas iguales. `main` pasó sin probar, por decisión de Rocío | **Pusheado** | **OK en VM (23/10)**: compila y 33 de 33 OK; dos fallas fuera de la ronda (ver §32) |
| 33 | Editar una tarifa que ya usan viajes: cuándo se puede, qué se recalcula y a quién se avisa (lo planteó Facu) | **En parte resuelto con el §34 (24/10):** el viaje guarda su importe, así que editar una tarifa ya no cambia los viajes calculados. Queda para charlar con Facu el "Recalcular" de varios viajes y el aviso al cliente | — | Con el §34 |
| 34 | Tabla de tarifas por tipo de camión ("Tarifas a agosto 2026"): tarifa fija por banda de km (con 1ª y 2ª vuelta; más de 250 km, la de 250 más el excedente por km) o tarifa por km, por tipo y modelo de camión; falso flete y estadía; tabla general o propia de algunos clientes; el viaje guarda su importe. Reemplaza las tarifas fijas por recorrido y las bandas por km | Hecho en la Mac (24/10) con API simulada, con las decisiones de Rocío y Claudia | Commits del 24/10, **sin push** | **Correr antes `database/tarifas/02_…` y `03_…`**, recompilar y probar (ver §34) |
| 35 | Tableros: pantalla nueva con todos los tableros por tema (Viajes, Flota, Choferes, Facturación), gráficos de tres datos (km e ingresos por camión y mes, viajes por cliente, mes y resultado, recorridos origen × destino, rechazos por cliente y destino, facturación por cliente y mes, antigüedad de la deuda) y deuda vencida; favoritos con estrella que se ven en el dashboard y se acomodan, guardados en la base por usuario | Hecho en la Mac (24/10) con API simulada, con las decisiones de Rocío; permiso de grupo propio | **Pusheado** (`eb17fb6`, `3b3a65a`, `58a9366`; 24/10) | **Correr antes `database/tableros/01_…`**, recompilar la API y probar (ver §35) |
| 36 | Hoja de ruta del chofer: entra con su usuario desde el celular, ve sus viajes, inicia el viaje y registra la entrega con la evidencia; el chofer de cada usuario se elige en Gestionar usuarios | Hecho en la Mac (24/10) con API simulada, con las decisiones de Rocío | **Pusheado** (`4ab8e02` a `53c388c`; 24/10, junto con los tableros); los ajustes del 24/10 (menú del chofer, tarjetas cortas, recorrido completo, Anteriores por año), commiteados **sin push** | **Correr antes `database/hoja-de-ruta/01_usuario_chofer.sql`**, recompilar y probar (ver §36, también los ajustes A a F) |
| 37 | Control interno de los viajes: recorrido completo desde el galpón, kilometraje de los camiones, combustible estimado, margen y los gastos que rinde el chofer con su ticket | Hecho en la Mac (24/10) con API simulada (y Google Maps de verdad), con las decisiones de Rocío | Commit del 24/10, **sin push** | **Correr antes `database/costos/01_galpon_kilometraje_y_gastos.sql`**, recompilar y probar (ver §37) |

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

## 6. Proforma Rukas (clientes Rukas / Marfrig) — ETAPAS 1–4 HECHAS (6 DESCARTADA); PRUEBA MÍNIMA OK EN VM (19/10)

No es un bug de las pruebas: es un **rediseño de negocio** detectado al contrastar SGTL con las respuestas de Claudia.

- Documento: `docs/negocio/PROFORMA-CLIENTES-RUKAS.md`. **Diseño vigente: §10, actualizado el 19/10 con la reunión del equipo.**
- Resumen del §10:
  - Para clientes `Con_plataforma`, se **importa el Excel** exportado de Rukas y SGTL lo **controla línea por línea** contra los viajes (por N° de transporte).
  - Al importar se crea un **borrador**. **Si hay diferencias, no avanza:** se corrige en SGTL ("Volver a controlar") o se reclama a Marfrig (marca "Reclamo en Rukas", ícono en el listado) y se reemplaza el Excel. Si el importe no coincide, decide la persona. No hay "aceptar con observación".
  - Con todo OK, **"Generar"** la deja **Aceptada** y pasa los viajes a Listo para facturar; los **adicionales** se toman de Rukas sin comparar.
  - Se factura con el flujo actual de Facu; la proforma termina en Facturada. La factura interna hace de fiscal (no hay ARCA): no se registra el N° de Rukas (decidido el 19/10).
  - Los clientes directos no cambian.
  - **Diseño genérico:** "proforma de plataforma", con Rukas como primera plataforma (tabla `PLATAFORMAS` y un lector por plataforma). Un solo modal de proforma que se adapta según el cliente. Plan, base de datos y pantallas: `docs/diseno/proforma-rukas-diseno.md`.
- 18/10: recorrida de solo lectura por Rukas y formato del Excel relevado con un archivo real (§12).
- **Premisas del diseño, a confirmar con Claudia** (preguntas 7 y 8 del §11):
  - [ ] ¿"Generar proforma" en Rukas lo aprietan ellos o Marfrig? Si lo hace Marfrig, revisar el flujo.
  - [ ] Con una proforma ya generada, ¿quién la corrige? Con el perfil de Transporte Sanchez **no hay opción de modificar, quitar transportes ni anular** una proforma en Proceso (revisado en el código de la pantalla); serían funciones de Marfrig. ¿Se lo piden a Marfrig por mail o por ticket? ¿Cuánto tarda?
- [ ] **Con Facu:** OK al diseño (toca Facturación: `ProformasController` y `gestion-facturacion.html`, filtro Tipo, PDF de proforma). El N° de factura de Rukas ya no se guarda (pregunta 9 del §11, decidido el 19/10).
- [x] **IVA:** los importes de Rukas son **netos** (verificado el 19/10 con la factura `A00005-00000659` de la proforma 7450: neto = total de Rukas, más IVA 21 %). La factura de SGTL suma el IVA como en las propias.
- **Diseño cerrado (19/10).** Plan por etapas en `docs/diseno/proforma-rukas-diseno.md`.
- [x] **Etapa 1 — base de datos** (19/10, sin push). **Corrida en la base el 19/10: OK** (Rukas en `PLATAFORMAS`; 2 clientes `Con_plataforma` con Rukas y 2 `Directo` sin plataforma; 10 proformas, todas `Propia`; las dos tablas nuevas creadas). `database/proformas-plataforma/01_plataformas_y_proformas.sql`. Crea `PLATAFORMAS` (con Rukas), `CLIENTES.PlataformaID` (asigna Rukas a los `Con_plataforma`), las columnas de proforma de plataforma en `PROFORMAS` (tipo, plataforma, N°, reclamo, factura en la plataforma), el índice único por N° y las tablas `PROFORMA_PLATAFORMA_LINEA` y `PROFORMA_ADJUNTO`. Todo admite vacío o tiene default: las proformas existentes quedan como `Propia` y nada de lo actual cambia. Sin restricción de "plataforma obligatoria" en clientes hasta que la pantalla la mande (etapa 2). **Probar:** Rocío lo corre en SSMS (base compartida: avisar a Facu y Fede). Al final muestra la verificación: Rukas en `PLATAFORMAS`; los clientes `Con_plataforma` con Rukas; todas las proformas `Propia`; las dos tablas nuevas existen. Correrlo una segunda vez no tiene que fallar. Después, en la VM: registrar y editar una proforma propia y un cliente, como siempre (no cambia nada).
- [x] **Etapa 2 — importar y controlar** (19/10). **Probada en VM el 19/10: OK con una falla (F1, el modal no se cerraba después de "Volver a controlar"), corregida junto con el autocompletado del N°** (reporte: `docs/pruebas/2026-10-19-etapa2-proforma-plataforma.md`). Quedan para la etapa 3 el borrador 29 (Rukas 990100) y los viajes 25/26 con N° 990001/990002, para probar "Reemplazar Excel" con `proforma-rukas-corregido` y generar.
- [x] **Etapa 3 — reclamo, reemplazar y generar** (19/10). **Probada en VM el 19/10: el flujo cierra (PF-00000010 → FAC-00000010 por $53.941,80, igual al esperado; viajes a Facturado). Tres fallas de pantalla corregidas: el modal quedaba "procesando", la fecha del reclamo en UTC y el globo del reclamo flotando** (reporte: `docs/pruebas/2026-10-19-etapa3-proforma-plataforma.md`). Falta verificar esas correcciones. **Limpieza:** anular FAC-00000010 con la nota de crédito cancelatoria. API (`ProformasPlataformaController`): `{id}/ReemplazarArchivo` (mismo N°; cierra el reclamo), `{id}/Reclamo` y `{id}/Reclamo/Cerrar`, `{id}/Generar` (vuelve a controlar; solo con todo OK: número PF, conceptos `V{viaje}` con IVA 21 %, estado **Aceptada**, viajes en Registrado → Listo para facturar, con auditoría). `ProformasController`: el listado devuelve tipo, plataforma, N° y reclamo; **"Registrar proforma" propia rechazada para clientes con plataforma**. Pantalla: "Reemplazar Excel" junto al archivo, "Registrar reclamo" (formulario dentro del bloque: fecha y motivo) y bloque "Reclamo en Rukas" con "Cerrar reclamo", "Generar proforma" habilitado solo con todo OK (gris si no) y confirmación dentro del modal; en el listado, etiqueta "Rukas 990100" junto al N° e ícono de admiración con tooltip si hay reclamo pendiente.
  - **Diferencias con el diseño:** el reclamo y la confirmación de generar van **dentro del modal de la proforma** (no en un segundo modal encima), como el aviso de cambios sin guardar. Falta el filtro "Con reclamo pendiente" del listado (lo hago si hace falta; hoy el ícono ya lo marca).
  - **Probar en VM** (recompilar; Ctrl+F5). Usar el borrador 29 (Rukas 990100) y los viajes 25/26: (1) Abrir el borrador → "Registrar reclamo" → fecha de hoy y motivo "PRUEBA-CLAUDE 19/10" → Guardar: aparece "Reclamo en Rukas desde el …" y, en el listado, el ícono con el tooltip. (2) "Cerrar reclamo" y volver a registrarlo. (3) "Reemplazar Excel" con `proforma-rukas-corregido (PROFORMA NRO 990100).xlsx`: el reclamo se cierra solo, 2 transportes, los 2 "Coincide", "Generar proforma" se pone verde. (4) Reemplazar con `…diferencias…`/`…repetido…` de otro N° (990101): error "es de la proforma 990101 y este borrador es la 990100". (5) "Generar proforma" → confirmación dentro del modal → Generar: mensaje "Proforma generada: PF-…", queda **Aceptada** con N° PF y etiqueta "Rukas 990100" en el listado; los viajes 25/26 siguen en Listo para facturar (si alguno estaba en Registrado, pasa). (6) Emitir la factura de esa proforma con el flujo de siempre: neto $29.580 + $15.000 de adicional = $44.580 + IVA 21 % ($9.361,80) = **$53.941,80**; los viajes 25/26 pasan a Facturado. (7) "Registrar proforma" con QUICKFOOD por la API vieja no tiene que ser posible (el modal ya pide el Excel). **Ojo:** (5) y (6) consumen un N° PF y generan una factura de prueba: pedir OK; después se anulan con nota de crédito. API: `Plataformas/LectoresPlataforma.cs` (lector de Rukas) y `ProformasPlataformaController.cs` (`Importar`, `{id}/Controlar`, `{id}`, `Cliente/{id}`). `ProformasController`: devuelve `Tipo_Proforma` y no deja editar, generar ni duplicar una proforma de plataforma. `ViajesController` / `gestion-viajes.html`: en un viaje de cliente con plataforma en Listo para facturar, fuera de una proforma generada o aceptada, se pueden corregir tarifa y km; `gestion-viajes.html?viaje=N` abre ese viaje. Pantalla: el modal de proforma se adapta al elegir un cliente con plataforma (`proformas-plataforma.js`, con `sgtl-ui.js`): pide el Excel y el N°, "Guardar borrador" lo importa, y muestra el control por línea, los totales, los avisos y "Volver a controlar". Excel de prueba en `docs/pruebas/datos/`.
  - **Todavía no (etapa 3):** "Generar" (queda deshabilitado), "Reemplazar Excel", "Registrar reclamo", el ícono y el filtro en el listado, y bloquear la proforma propia para clientes con plataforma. Los datos de la cabecera de un borrador de plataforma no se editan después de importar (se cargan al importar).
  - **Probar en VM** (recompilar la API; Ctrl+F5): preparar dos viajes de prueba de QUICKFOOD con N° de transporte SAP 990001 y 990002 (con remito y N° de entrega). (1) Registrar proforma → QUICKFOOD: en vez de "Traer viajes" aparece "Excel de Rukas"; con un cliente directo, el modal es el de siempre. (2) Elegir `proforma-rukas-formato-invalido…` → Guardar borrador → error dentro del modal con la columna que falta; con `…repetido…` → error de transporte repetido; no se crea nada. (3) Con `…diferencias…`: vista previa "3 transportes · Total Rukas $615.000", N° 990100 completado solo, Guardar borrador → toast y control: 990001 y 990002 "Importe distinto" (con el importe de SGTL y la tarifa usada), 990099 "Sin viaje"; "Generar" deshabilitado con "Para generar, corregí las 3 diferencias". Totales: neto $615.000 + IVA. (4) "Abrir viaje #N" abre el viaje en otra pestaña; cambiarle la tarifa (si está en Listo para facturar se puede) y "Volver a controlar". (5) Volver a importar el mismo Excel → "ya está cargada (Borrador)". (6) Abrir el borrador desde el listado: muestra el control. (7) Eliminar el borrador: los viajes 990001/990002 quedan libres. Anotar los importes de SGTL que muestra el control para armar el Excel "todo OK".
- [x] **Etapa 4 — guía y aviso del caso 7** (19/10, sin probar en VM). API: `GET api/ProformasPlataforma/ViajesSinProforma?clienteId=` devuelve los viajes del cliente en Registrado o Listo para facturar, con el N° de transporte cargado, que no están en ninguna proforma no anulada (ni reservados ni como línea `V{id}`), con lo que les falta (remito, N° de entrega). El aviso del caso 7 del control usa la misma lista y sale solo en borrador. Pantalla: al elegir un cliente con plataforma en "Registrar proforma", debajo del Excel aparece "Viajes sin proforma (N) · guía para generar la proforma en Rukas" (desplegable) con N° de transporte, fecha, ruta, estado, lo que falta y "Abrir viaje #N".
  - **Diferencia con el diseño:** la guía también muestra los viajes con el N° de transporte que tienen incompleto el remito o el N° de entrega, marcados en rojo ("Le falta: remito."), para completarlos antes de importar; si no, el control los frenaría (caso 4).
  - **Probar en VM** (recompilar; Ctrl+F5): (1) Registrar proforma → QUICKFOOD: debajo del Excel, "Viajes sin proforma (N)"; desplegarlo: están los viajes de QUICKFOOD con N° de transporte en Registrado o Listo para facturar que no están en ninguna proforma; **no** están los 25/26 (facturados en FAC-00000010) ni los de un borrador. (2) A un viaje de la lista sacarle el remito: aparece "Le falta: remito." y el texto de completar los números. (3) "Abrir viaje #N" abre el viaje en otra pestaña. (4) Con un cliente directo no aparece la guía. (5) Importar un Excel de prueba: si quedan viajes de la guía fuera del archivo, el control muestra el aviso amarillo "Hay N viajes de este cliente con el N° de transporte SAP cargado que no están en ninguna proforma de Rukas: #… Si no los tildaste en Rukas, van en la próxima proforma." y "Generar" no se frena por eso.
- [x] **Importe de SGTL en un solo lugar** (19/10, sin probar en VM). El cálculo (presupuesto aceptado; si no, tarifa fija; si no, tarifa por km × km) estaba repetido en `ProformasController.PrellenarViajes` ("Traer viajes") y `ProformasPlataformaController.ImporteSgtl` (control). Ahora los dos usan `ProformasController.CargarTarifas` + `ImporteViaje`. Sin cambios de comportamiento salvo uno: en el control, un presupuesto con importe negativo cuenta como inválido ("Sin tarifa"), como ya pasaba en "Traer viajes".
  - **Probar en VM** (recompilar): (1) Proforma propia de un cliente directo → "Traer viajes" en un rango con viajes Entregados: trae las mismas líneas e importes que antes (uno con tarifa fija, uno por km y, si hay, uno con presupuesto aceptado). (2) En un borrador de plataforma, "Volver a controlar": "Importe SGTL" y "Tarifa usada" iguales a los de antes.

- [x] **Filtro "Tipo" en el listado y totales con el IVA de la API** (19/10, sin probar en VM). `ProformasController.Listar`/`Reporte`: parámetro `tipo` (`Propia`, `Plataforma`, `Reclamo`). Pantalla: filtro **Tipo** en Gestionar proformas: Todos / Propia / Plataforma / Con reclamo pendiente (también se aplica al exportar el listado, con "Tipo: …" en el resumen). El IVA y el total del modal de una proforma de plataforma los calcula la API (`ControlDto.Iva`/`Total`), con la misma cuenta que se guarda y se factura. **Diferencia con el diseño:** "Tipo" y "Con reclamo pendiente" son un solo filtro.
  - **Probar en VM** (recompilar; Ctrl+F5): (1) Filtro Tipo → "Con reclamo pendiente" → Buscar: solo los borradores de plataforma con reclamo; "Plataforma": solo las de Rukas; "Propia": ninguna de Rukas. Limpiar vuelve a Todos. (2) Exportar listado con el filtro: el resumen dice "Tipo: …". (3) Totales del modal de PF-00000010: IVA $9.361,80 y total $53.941,80.
- [x] ~~**Etapa 6 — N° de factura en la plataforma**~~ **Descartada (decidido por Rocío el 19/10).** Se llegó a hacer (bloque "Factura en Rukas", ícono y filtro "Sin N° de factura", corregir con auditoría) y se sacó antes de subir: SGTL no está conectado a ARCA, así que la **factura interna hace de factura fiscal**; es la que se carga en Rukas, y la proforma termina en **Facturada** como una propia. La factura real de ARCA queda fuera del sistema y SGTL no registra la carga en Rukas (si falta, Marfrig no paga y se ve en la cuenta corriente). Al integrar ARCA, la factura interna pasa a ser la fiscal y el circuito no cambia. Las columnas `Plataforma_Factura_*` quedan sin usar (no hace falta script). Detalle: §10 y pregunta 9 del §11 de `docs/negocio/PROFORMA-CLIENTES-RUKAS.md`.
- [x] **Condiciones comerciales editables en un borrador de plataforma** (19/10, sin probar en VM). Antes, después de importar el Excel el borrador quedaba en solo lectura (aunque el listado mostraba el lápiz "Editar"), y la forma y el plazo de pago, que la factura usa como "Condición de venta", solo se corregían eliminando el borrador y volviendo a importar (se perdía el reclamo). Ahora sigue el criterio de la proforma propia de Facu: abierto con el lápiz (no con "Ver"), en borrador se editan forma de pago, plazo de pago, validez, tiempo del servicio, observaciones comerciales y condiciones particulares; "Guardar borrador" los guarda (`PUT api/ProformasPlataforma/{id}/Condiciones`, auditoría `UPDATE` "Edicion de proforma (Borrador): condiciones comerciales") y cierra con "Borrador guardado."; "Generar" los guarda antes de generar. El cliente y los conceptos no se editan (salen del Excel). Lo que se escribe en el reclamo no cuenta como cambio sin guardar.
  - **Probar en VM** (recompilar; Ctrl+F5): (1) Lápiz "Editar" de un borrador de Rukas: forma de pago, plazo y demás condiciones editables; cliente, datos del cliente y Excel no. "Guardar borrador" visible y el pie dice Cancelar. (2) Cambiar forma y plazo de pago → Guardar borrador: "Borrador guardado."; al volver a abrirlo, están los valores nuevos; en Auditoría, `UPDATE` de PROFORMAS con "condiciones comerciales". (3) Cambiar una condición y Cancelar: aviso de cambios sin guardar. (4) Registrar un reclamo y cerrar el modal: **no** aparece el aviso de cambios sin guardar. (5) "Ver" (ojo) del mismo borrador: todo en solo lectura y sin Guardar borrador. (6) Cambiar el plazo de pago y Generar sin guardar: la proforma generada y su factura tienen el plazo nuevo ("Condición de venta"). (7) Una proforma propia en borrador se edita y guarda como siempre.
- [x] ~~**"Ver solo diferencias" y quién registró el reclamo**~~ **Descartados (decidido por Rocío el 19/10).** El filtro no hace falta con tandas de 10 a 15 transportes (las diferencias ya salen primero); quién registró el reclamo está en la auditoría (acción RECLAMO).
- [x] **Excel por caso para la demo** (19/10). En `docs/pruebas/datos/`: `caso1-todo-ok` (990110), `caso2-reclamo-a-rukas` y su `-corregido` (990120), `caso3-corregir-viaje-en-sgtl` (990130, con la preparación de cambiar el N° de transporte del viaje 26). Todos usan los viajes 25/26 (990001/990002): un caso a la vez. Detalle y orden sugerido para la demo: `docs/pruebas/datos/README.md`.
- [x] **Prueba mínima en la VM (19/10): OK** (reporte: `docs/pruebas/2026-10-19-prueba-minima-proforma-plataforma.md`). Compila sin errores; funcionan la nota de crédito y la reimportación (etapa 5), los tres casos, el reclamo, las condiciones editables, el filtro y el PDF. **F1 (baja), corregida en la Mac:** en "Ver" de un borrador de plataforma seguían activos Reemplazar Excel, Cerrar reclamo y Volver a controlar; ahora en Ver no aparecen esos botones, ni Registrar reclamo ni Generar. **Probar F1:** Ver (ojo) de un borrador de Rukas: sin esos botones; con el lápiz, están. **Datos de la demo listos:** PF-00000010 anulada con NC-00000003 (no revertir), viajes 25 y 26 en Listo para facturar con 990001/990002, ningún borrador de Rukas. Las pruebas por etapa de más arriba quedan cubiertas por esta, salvo generar con condiciones sin guardar (consume un N° PF).
- [x] **Swagger daba error 500** (reportado por Facu el 20/10): "Conflicting schemaIds: Duplicate schemaIds detected for types ProformasPlataformaController+UsuarioDto and ProformasController+UsuarioDto". Solo afectaba a la página de Swagger (`/swagger/ui/index`); la API andaba. Se renombró la clase del controller de plataforma a `UsuarioPlataformaDto` (el JSON que manda el front no cambia). Revisado: no hay otros nombres de clase repetidos en la API. **Probar:** recompilar y abrir `http://localhost:50222/swagger/ui/index`: carga la lista de endpoints, incluido `ProformasPlataforma`.
- [x] **PDF con el tipo y el N° de la plataforma** (19/10, sin probar en VM). **PDF de la proforma** (`proforma-pdf.js`): en una de plataforma, en lugar de "Datos del servicio" sale "PROFORMA DE RUKAS" con el N° en Rukas y el período; un borrador (sin N° PF) dice "N°: Borrador" y lista las líneas del Excel con el mismo formato que tendrán los conceptos; el archivo se llama `Proforma_Rukas_990100.pdf` mientras no tenga N° PF. `ProformasController.Obtener` devuelve el nombre de la plataforma y el N°. **Listado exportado** (PDF y Excel): el número sale como "PF-00000010 (Rukas 990100)". **PDF de la factura** (Facu): no se tocó; ya muestra "Rukas 990100" en cada línea porque copia la descripción del concepto. Si se quiere el N° de Rukas también en la cabecera de la factura, es un cambio en `factura-pdf.js` / `ComprobantesController` (coordinar con Facu).
  - **Probar en VM** (Ctrl+F5; recompilar por `Obtener` y `Reporte`): (1) Descargar PDF de PF-00000010 desde el listado: recuadro "PROFORMA DE RUKAS" con "N° de proforma en Rukas: 990100", período; los conceptos con "Transporte 990001 · …" y "Rukas 990100"; totales $53.941,80. (2) PDF de un borrador de plataforma: "N°: Borrador", las líneas del Excel y archivo `Proforma_Rukas_<N°>.pdf`. (3) PDF de una proforma propia: igual que antes ("Datos del servicio"). (4) Exportar listado (PDF y Excel): las de Rukas con "(Rukas …)" junto al número. (5) PDF de FAC-00000010: cada línea dice "Rukas 990100".
- [x] **Modal de Rukas en pasos, el Excel se guarda siempre y reclamo por línea** (22/10, sin probar en VM). Pedido de Rocío: el modal tenía mucho texto y los botones se perdían. No se sacó ninguna acción; las proformas propias no cambian. Diseño: "Rediseño del 22/10" y "Errores y de quién son" en el §4 de `docs/diseno/proforma-rukas-diseno.md`.
  - **Pantalla** (`proformas-plataforma.js` y `sgtl.css`; el HTML de Facu no se tocó): con un cliente con plataforma, pasos 1 Cliente → 2 Excel de Rukas → 3 Control y generar. Datos del cliente en una línea con "Editar datos del cliente"; el período sale del Excel. **Al elegir el Excel se importa y se controla solo** (si el nombre no trae el N°, lo pide). Guía de viajes sin proforma y condiciones comerciales plegadas; totales en una línea. En el control (segunda vuelta del 22/10, para sacar texto y avisos): el cliente y el archivo quedan en los pasos; una línea con las etiquetas de estado del design system por grupo (las mismas de la tabla y del listado; llevan a su grupo), el reclamo y el aviso de viajes fuera de la proforma (abren un panel); las acciones juntas a la derecha; tabla agrupada en Para corregir en SGTL / Para revisar / Para reclamar a Rukas / Esperando a Rukas / Coinciden (plegadas); tarifa usada en un globito; "Abrir viaje" como ícono. El motivo para no generar y la confirmación de "Generar" van en el pie. Al abrir un borrador con el lápiz y al volver de "Abrir viaje" se vuelve a controlar solo.
  - **Errores (caso 8 partido):** solo se rechaza lo que no es un Excel de Rukas. Un transporte repetido o un dato ilegible en una fila entran como línea "Repetido en el Excel" / "Dato mal en el Excel" para reclamar (`LectoresPlataforma.cs`). Si el N° ya está cargado, el aviso ofrece "Abrir el borrador".
  - **Reclamo por línea:** "Registrar reclamo" lista las diferencias con casillas y arma el motivo; las marcadas pasan a "Esperando a Rukas". Script nuevo `database/proformas-plataforma/02_reclamo_por_linea.sql` (columna `Reclamada`).
  - **Listado:** junto al estado del borrador, etiquetas "Corregir en SGTL · n" (roja), "Revisar · n" y "Reclamar a Rukas · n" (amarillas), "Esperando a Rukas · n desde el dd/mm" (azul) o "Lista para generar" (verde); reemplazan el ícono de admiración. Toca `ProformasController.Listar` (de Facu, con OK de Rocío): avisarle.
  - **Ajuste al estilo visual nuevo (§12 del design system, 22/10):** la zona del Excel pasa a una franja (ícono, qué archivo va y "Elegir archivo"), así el paso 2 entra sin desplazar; el reclamo y los viajes fuera de la proforma se abren como avisos del sistema (`.alert`, amarillo y azul); tabla, totales, pasos y el formulario del reclamo con los bordes, radios y colores de §12. Títulos como el resto de las proformas: "Editar proforma de Rukas 990210" / "Ver proforma …". Elegir el cliente o el Excel ya no dispara "Tenés cambios sin guardar" (sí editar los datos del cliente o las condiciones). **Probar además:** (8) Registrar proforma → QUICKFOOD → Cancelar: cierra sin el aviso de cambios sin guardar; cambiar el teléfono del cliente y Cancelar: aparece el aviso. (9) Lápiz de un borrador de Rukas: título "Editar proforma de Rukas …"; ojo: "Ver proforma de Rukas …".
  - **Supuesto para la tesis:** Marfrig corrige la misma proforma y conserva el N° (premisa 3 y pregunta 8 del documento de negocio; anteproyecto, "Límites").
  - Probado en la Mac con una API simulada (datos inventados): pasos, importación al elegir, archivo que no es de Rukas, N° ya cargado, nombre sin N°, reclamo por línea, volver a controlar, reemplazar, confirmación de generar, Ver/Editar, vuelta a un cliente directo y ancho de celular.
  - **Probar en VM. Antes:** Rocío corre `02_reclamo_por_linea.sql` en SSMS (sin la columna, la API nueva falla al leer las líneas y el listado de proformas sale vacío). **Corrido el 22/10: OK** (columna `Reclamada` creada; las 4 líneas existentes en 0). Recompilar; Ctrl+F5. (1) Registrar proforma con un cliente directo: igual que antes. Cambiar a QUICKFOOD: pasos, cliente en una línea ("Editar datos del cliente" despliega los campos), zona del Excel, guía y condiciones plegadas, "Generar" gris con el motivo en el pie. Volver a un directo: todo como antes. (2) Elegir `proforma-rukas-formato-invalido…`: aviso "Este archivo no es el Excel de Rukas…" y no se crea nada. (3) Elegir `proforma-rukas-repetido…`: se crea el borrador solo; la segunda línea 990001 en "Para reclamar a Rukas". Elegir el mismo archivo otra vez desde Registrar proforma: "ya está cargada como borrador" con "Abrir el borrador", que lo abre. Registrar reclamo: la línea viene marcada y el motivo armado → Guardar → "Esperando a Rukas (1)"; en el listado, la situación junto a Borrador. Cerrar reclamo y eliminar el borrador. (4) Caso 3 de la demo (`docs/pruebas/datos/README.md`): 990002 en "Para corregir en SGTL"; el ícono abre Gestionar viajes en otra pestaña; corregir el N°, guardar y volver: se controla solo y queda todo OK. Eliminar el borrador. (5) Caso 2: 990002 en "Para revisar"; Registrar reclamo marcando el 990002; Editar reclamo; Reemplazar Excel con el corregido → todo OK y "Generar" verde. "Generar" → confirmación en el pie → Cancelar vuelve a los botones. (Generar de verdad consume un N° PF: pedir OK.) (6) Ver (ojo) de un borrador: sin acciones y "Ver datos del cliente". (7) En DevTools a 390 px: el modal se usa y la tabla se desplaza hacia el costado.
---

## 7. Checklist operativo inmediato

1. [ ] Desde la Mac: `git push origin rocionuvoli` (sube `98ffe56` = Live Server + CLAUDE.md).
2. [x] `docs/negocio/PROFORMA-CLIENTES-RUKAS.md` commiteado junto con este documento.
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
| F16 | Errores de consola: PerfectScrollbar "no element is specified" en casi todas las pantallas (`app.js`); `GET api/DashboardLayout?username=…` da 404 en el dashboard | Baja | Ya (visto en la prueba del 18/10, `docs/pruebas/2026-10-18-merge-presupuestos-facu.md`) | Plantilla (`assets/compiled/js/app.js`), `index.html` |

**Mejoras sugeridas** (voseo, títulos de pestaña, formatos de fecha, validaciones al escribir, búsquedas sin tildes, 404 como "sin datos", etc.): ver la sección "Mejoras sugeridas" del reporte.

**Para la próxima ronda en la VM:** probar altas, ediciones y bajas requiere aprobar el permiso de escritura cuando Claude lo pida (los datos van con nombres verosímiles y se anotan por ID en el reporte; ver `docs/equipo/PRUEBAS-VM-CLAUDE.md` §3). En la VM Live Server levanta en **5500** (ver 3.2).

**Script de F3:** `database/menu/01_menu_principal_not_null.sql` (SSMS, base `Transporte_Sanchez`, backup previo, avisar al equipo porque `MENU` es compartida).
1. Ejecutarlo tal cual (`@Aplicar = 0`): solo muestra el diagnóstico (menús con NULL, grupos que los tienen, posible duplicado "Gestión de contenido").
2. Si está bien, poner `@Aplicar = 1` y ejecutarlo de nuevo: pasa los NULL a 0, deja la columna `NOT NULL` con `DEFAULT 0` (para que no se repita con altas manuales) y muestra la verificación (tres "OK").
3. El código no lee el valor de `Menu_Principal` (la API da de alta menús con 0), así que el cambio no altera el menú lateral ni los permisos.

**Diagnóstico corrido el 17/10:** la columna admite NULL y no tiene default; un solo menú con NULL: **23 "Configuracion WhatsApp"**, sin grupos asignados (lo cargaron a mano). Al volver a funcionar la pestaña de permisos, la API lo renombra a "Integración WhatsApp" o, si ese ya existe, lo unifica y lo borra (`AsegurarCatalogoMenuPermisos`). Además existen **17 "Gestión de contenido"** y **19 "Gestion de contenido"**, cada uno con 1 grupo: para el menú lateral son lo mismo (compara sin tildes), pero en "Permisos por grupo" aparecen dos casillas. Pendiente: unificarlos en 17 (sumarlo a los renombres de `AsegurarCatalogoMenuPermisos` o con un script).

Si aparecen "Gestion de contenido" y "Gestión de contenido" como dos menús distintos, **no borrar ninguno todavía**: pasar el resultado del diagnóstico para decidir cuál queda (el menú lateral usa el nombre para habilitar la pantalla).

---

## 9. Merge de `facugodoy` (35894cc) en `rocionuvoli` — RESUELTO, SIN PUSH NI PRUEBA EN VM (17/10)

Respaldo de la rama antes del merge: `respaldo/pre-merge-facu`. Resumen para Facu (antes vs. ahora y por qué): **`docs/equipo/merge-facugodoy-2026-10-17.md`**.
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
- ~~Correr `database/viajes/01_facturado_solo_con_factura.sql`~~ — diagnóstico corrido el 17/10: **ningún viaje para corregir** (los 8 viajes en Facturado tienen factura vigente). No hizo falta aplicarlo.
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

## 10. Relevamiento visual y design system — APLICADO EN TODAS LAS PANTALLAS (22/10), FALTA PROBAR EN VM

Las pantallas se ven y se comportan distinto según la etapa en que se hicieron (avisos, fechas, colores de estado, tono, botones). El objetivo es definir un design system y aplicarlo a todo.

1. [x] Relevamiento por código de las 23 pantallas (17/10, actualizado con el merge de Facu): `docs/design-system/01-relevamiento-codigo.md`. Incluye las decisiones a tomar (D1–D17).
2. [x] Capturas en la VM (17/10): 91 capturas en `.pruebas-locales/capturas-ui/2026-10-17/` (fuera de git) y reporte en `docs/pruebas/2026-10-17-capturas-ui.md`. Configuración de facturación y de e-mail salieron con error por token vencido, y alta, errores y exportar de Gestionar proformas se sacaron en el listado: repetirlas solo si hacen falta.
3. [x] Repaso con Rocío de las decisiones D1–D17, una por una, con las capturas a la vista (17/10). Quedaron en `docs/design-system/03-decisiones.md`.
4. [x] CSS y JS de interfaz compartidos (`assets/static/css/sgtl.css`, `assets/static/js/sgtl-ui.js`) y regla en `CLAUDE.md` que apunta a `docs/design-system/03-decisiones.md` (17/10).
5. [x] Piloto en Choferes hecho en la Mac (17/10) y **OK en la VM** (17/10, commit `020e892`, Live Server 5500): 11 ítems, el único "FAIL" era el checklist (la cruz de Estado deja Todos, como dice §3.3). Quedó el chofer de prueba ID 10 (abajo).
6. [x] Aplicar el design system al resto de las pantallas (anotado el 18/10). **20/10: hechas las nuestras salvo viajes** (ver "Tanda del 20/10" abajo). **22/10: viajes y las pantallas de Facu y Fede, con el estilo visual nuevo (ver §20).** Reglas en `docs/design-system/03-decisiones.md`. Solo frente: HTML/JS + menú. No tocar API, numeración, SMTP, token de WhatsApp ni PDF. Cada pantalla pasa a `SGTL` (toasts, confirmación, cruz de filtros, badges, botones de fila, fechas/montos). Menú y título iguales, en infinitivo. Se sacan `alert()` / `confirm()` / `prompt()`, el botón Limpiar y "Confirmar" en el pie de los modales.

**Probar en la VM (piloto Choferes):** solo `gestion-choferes` y `listado-choferes`. Seguí `docs/equipo/PRUEBAS-VM-CLAUDE.md`. Hard refresh (Ctrl+F5). En consola no tiene que aparecer `SGTL is not defined` ni `camposChofer is not defined`. Creá un chofer de prueba (`PRUEBA-CLAUDE` + fecha) y no toques choferes que no hayas creado. No elimines nada sin preguntarle a Rocío. No asignes el chofer a un viaje (puede mandar WhatsApp).

| # | Pantalla | Qué hacer | Esperado |
|---|---|---|---|
| 1 | Gestionar choferes | Abrir la pantalla | Título "Gestionar choferes", botón verde **Registrar chofer**, ícono de exportar a la izquierda (tooltip "Exportar"), filtros DNI / rango de fechas / Estado (default Activo) + **Buscar** |
| 2 | Gestionar choferes | Cruz de cada filtro (mouse real, no script) | Limpia ese campo y vuelve a buscar. Estado pasa a **Todos** (no vuelve a Activo: §1.3 y §3.3) |
| 3 | Gestionar choferes | Rango de fechas: abrir el calendario | flatpickr, dos meses, lunes primero, " a " entre fechas |
| 4 | Gestionar choferes | **Registrar chofer** | Modal título "Registrar chofer", pie Cancelar + Guardar, X visible. Clic afuera no cierra. Guardar vacío: "Completá…" / "Seleccioná…". DNI corto: "El DNI tiene que tener 7 u 8 números." |
| 5 | Gestionar choferes | Alta válida (`PRUEBA-CLAUDE` + fecha) | Spinner en Guardar, toast verde ~4 s, **el modal se cierra**, la tabla se refresca. Abrir de nuevo el alta: el form está vacío |
| 6 | Gestionar choferes | Editar el chofer de prueba (lápiz) | Modal "Editar chofer", Cancelar + Guardar. Cambiá un dato, Guardar: toast, modal se cierra, el cambio se ve en la tabla |
| 7 | Gestionar choferes | Inactivar el de prueba | **Sin** modal de confirmación. Toast "Chofer inactivado." Badge Inactivo. Activar: toast "Chofer activado." |
| 8 | Gestionar choferes | Eliminar (tacho) del de prueba: **Cancelar** | Modal "¿Eliminar el chofer …?", "No se puede deshacer.", pie Cancelar + **Eliminar** (rojo), nunca "Confirmar". Cancelar: no borra |
| 9 | Gestionar choferes | Exportar con un filtro que deje más de una página (o sin filtro si hay >15) | Baja un CSV con **todas** las filas filtradas, no solo las 15 de la página. Mientras, el botón muestra spinner |
| 10 | Listado de choferes | Abrir, Buscar, ojo de una fila | Modal "Ver detalle del chofer", pie solo **Cerrar**, datos en texto (no inputs). Clic afuera sí cierra |
| 11 | Ambas | Consola (F12) en todo el recorrido | Sin errores rojos de JS (`SGTL`, `camposChofer`, `bootstrap`) |

**Resultado VM (17/10):** 1–11 OK. El reporte marcó el ítem 2 como falla porque el checklist decía "vuelve a Activo"; el código y la decisión dejan "Todos". El tacho deshabilitado en un chofer Activo ("No es posible eliminar un chofer activo") es la regla de §1.4. Nombre y apellido sacan guiones y números (`soloLetras`): `PRUEBA-CLAUDE` quedó `PRUEBACLAUDE`; la marca de prueba está en la calle.

Chofer de prueba, quedó **Inactivo** (no se eliminó ni se asignó a un viaje): ID **10**, DNI `30991710`, nombre `PRUEBACLAUDE CLAUDE`, calle `Calle PRUEBA-CLAUDE editada`. Para darlo de baja, en Gestionar choferes filtrá Estado = Inactivo y usá Eliminar (ya está inactivo, el tacho está habilitado). Si preferís SQL, baja lógica igual que el endpoint (no `DELETE`):

```sql
BEGIN TRAN;
UPDATE dbo.CHOFERES
SET EstadoChofer = 'Eliminado', Fecha_Modi = GETDATE(), Usu_Modi = 'PRUEBA-CLAUDE'
WHERE Chofer_ID = 10 AND DNI = '30991710' AND EstadoChofer <> 'Eliminado';
SELECT @@ROWCOUNT AS Filas;
SELECT Chofer_ID, Nombre, Apellido, DNI, EstadoChofer FROM dbo.CHOFERES WHERE Chofer_ID = 10;
-- COMMIT; o ROLLBACK;
```

### Tanda del 20/10 — hecha en la Mac, pendiente de probar en la VM

Pantallas: Listar / Gestionar camiones, Listar / Gestionar clientes, Listar / Gestionar usuarios, Gestionar grupos y permisos, Gestionar tarifas, Gestionar orígenes y destinos, Consultar auditoría, Gestionar contenido, Login y Dashboard. Solo frente: la API no cambia. Se probaron en la Mac contra una API falsa (sin base), así que falta verlas con datos reales.

Lo nuevo compartido: `SGTL.validador` (valida cada campo al salir), `SGTL.selectorFecha` / `leerFecha` / `fechaISO` (fechas DD/MM/AAAA en formularios) en `sgtl-ui.js`, y `assets/static/js/clientes.js` (lo que comparten las dos pantallas de clientes). En el menú: "Consultar auditoría" y "Gestionar contenido".

De paso quedaron corregidos R1 (CSV de clientes), R2 (`showErrorToast`), R3 (formato de fecha en camiones) y R6 (exportar camiones baja todo lo filtrado), y el filtro por nombre de usuario de Listar usuarios, que no se aplicaba (mandaba `Nombre_Usuario` y la API espera `nombreusuario`).

**Prueba mínima en la VM (20/10, antes de la presentación).** Solo esto; la tabla larga de abajo queda para después. Ctrl+F5 en cada pantalla y consola (F12) abierta: **no tiene que haber errores rojos**. No crear, editar ni eliminar datos salvo en el punto 4.

| # | Qué hacer | Esperado |
|---|---|---|
| 1 | Login con un usuario admin | Íconos de usuario, candado y ojo visibles; entra al Dashboard; pestaña "Dashboard · SGTL" |
| 2 | Abrir el menú completo | Todas las subopciones con verbo (Gestionar cuenta corriente, Gestionar e-mail, etc.); Dashboard y Auditoría sin verbo; cada uno abre su pantalla |
| 3 | Abrir, una por una: Gestionar y Listar camiones, Gestionar y Listar clientes, Gestionar y Listar usuarios, Grupos y permisos, Tarifas (las dos pestañas), Orígenes y destinos (las dos pestañas), Consultar auditoría, Gestionar contenido | Cada una carga su tabla con datos reales (no queda en "Cargando…" ni en el spinner) y sin errores en consola |
| 4 | Gestionar camiones: Registrar camión `PRUEBA` (dominio `ZZ999ZZ`), editarlo, inactivarlo y eliminarlo | Toasts verdes en cada paso; el camión desaparece al final |
| 5 | En Gestionar clientes, Gestionar usuarios y Tarifas: tocar el lápiz de una fila y después **Cancelar** | El modal se abre con los datos cargados (provincia/localidad, grupos, fechas DD/MM/AAAA) |
| 6 | Abrir Gestionar viajes, Gestionar proformas y Gestionar cuenta corriente | Cargan igual que antes (solo cambió el título o nada) |

Si algo falla: anotar pantalla, paso y el error de consola, y no seguir tocando.

**Resultado 20/10 (en la Mac con API falsa, no en la VM):** `docs/pruebas/2026-10-20-prueba-minima-design-system.md`. F1 (fecha de camión un día antes al editar) corregida; F2 (`cargarEstilosContenido` en Gestionar facturación) no se reprodujo en el código, parece caché del navegador: verificar con Ctrl+F5; F3 y F4 ya estaban anotadas. **Falta correr esta prueba en la VM.**

**Prueba completa (después de la presentación)** (Ctrl+F5 en cada pantalla; consola F12 sin errores rojos). Usá datos de prueba `PRUEBA-CLAUDE`; no elimines nada que no hayas creado.

| # | Pantalla | Qué hacer | Esperado |
|---|---|---|---|
| 1 | Todas las de la tanda | Abrir | Ícono de la sección + título + subtítulo; alta verde "Registrar …" arriba a la derecha (en tarifas y orígenes, dentro de cada pestaña); exportar solo ícono; filtros con cruz; Estado Activo / Inactivo / Todos; botones de fila solo ícono con tooltip |
| 2 | Gestionar camiones | Registrar camión vacío → Guardar | "Revisá los campos marcados." y cada campo en rojo con su mensaje. Fechas con calendario en DD/MM/AAAA |
| 3 | Gestionar camiones | Alta `PRUEBA`, editar, inactivar, eliminar el de prueba | Toasts "Camión registrado." / "guardado." / "inactivado." / "eliminado."; eliminar pide "¿Eliminar el camión …?"; tacho deshabilitado si está activo |
| 4 | Gestionar camiones | Exportar | CSV con todas las filas filtradas |
| 5 | Listar camiones | Ojo de una fila | "Ver detalle del camión" con datos en texto y chofer asignado; pie solo Cerrar |
| 6 | Gestionar clientes | Editar un cliente y Guardar sin cambios | "Cliente guardado." (el CUIT propio no da "ya registrado"); en alta, un CUIT existente marca "El CUIT ya está registrado." |
| 7 | Gestionar / Listar clientes | Filtro Razón social y CUIT; Exportar | Filtra; CSV con todos los datos (antes el botón no hacía nada) |
| 8 | Gestionar usuarios | Editar un usuario con rol user | Muestra sus grupos; asignar / quitar; Guardar → "Usuario guardado." Registrar con un nombre de usuario existente → error en ese campo |
| 9 | Listar usuarios | Filtrar por nombre de usuario; ojo | Filtra (antes no); detalle con rol, grupos y pantallas |
| 10 | Grupos y permisos | Registrar `PRUEBA-CLAUDE`, editarlo, eliminarlo; pestañas Permisos y Usuarios | Modal "Registrar grupo" / "Editar grupo"; confirmación al eliminar; "Guardar permisos" con ruedita y toast |
| 11 | Tarifas | Editar una tarifa fija, poner Hasta antes que Desde | "La fecha hasta no puede ser anterior a la fecha desde."; montos "$ 1.234,56" a la derecha |
| 12 | Tarifas | Eliminar una tarifa usada en viajes → Cancelar después de ver el error | El error de la API sale dentro del modal de confirmación |
| 13 | Orígenes y destinos | Editar un origen | Altura sin espacios de más; Guardar → "Origen guardado." |
| 14 | Consultar auditoría | Filtros, cruz de cada uno, ojo | Sin Limpiar; acciones "Alta" / "Modificación" / "Inicio de sesión" con color; fecha con segundos |
| 15 | Gestionar contenido | Guardar; Restablecer → Cancelar | "Cambios guardados."; Restablecer pide confirmación ("Restablecer", no "Confirmar") |
| 16 | Login y Dashboard | Abrir | Íconos de usuario, candado, ojo y del tablero visibles (ya no hay Font Awesome); en el login, "Ingresá tus credenciales para continuar." y el resto de los textos como estaban |

**Pestañas del navegador (20/10):** todas las pantallas, también las de Facu y Fede y el login, pasan a "Pantalla · SGTL" (el login: "SGTL · Sistema de Gestión de Transporte y Logística"). Solo cambia el texto de la pestaña; en las de Facu y Fede se mantuvo el nombre que ya tenían. **Probar en la VM:** abrir varias pantallas y mirar la pestaña.

**Colores y logo por defecto (20/10):**
- El menú por defecto es el azul de los botones (`#435ebe`) y el fondo `#e4eef8`. Rocío restableció los valores en Gestionar contenido el 20/10.
- El círculo de las iniciales se quedaba con el color viejo (verde) hasta recargar: ahora cambia junto con el menú al guardar o restablecer (`gestionContenido.js`). **Probar en la VM:** en Gestionar contenido, cambiar el color del menú y Guardar → el círculo cambia sin recargar.
- [x] **Logo de SGTL por defecto (20/10):** `assets/static/images/logo/sgtl-logo.png` (recortado del `logo_SGTL.svg` que pasó Rocío, sin el margen transparente). Lo usan el menú, el login, la vista previa de Gestionar contenido y `SGTL_CONTENIDO_DEFAULT.logo`. El ícono de la pestaña es `sgtl-icono.png` (solo la palabra SGTL, 128 × 128) en todas las pantallas, también el login; no cambia aunque haya otro logo guardado. Se sacaron los íconos viejos que traían las pantallas y `views/footer.html`. El logo guardado en la base (`GESTION_CONTENIDO.Logo`) le gana al de por defecto; **Restablecer ahora también vuelve el logo al de SGTL** (junto con fondo, menú y pie). **Probar en la VM:** login y menú con el logo nuevo, sin deformarse.

**Dashboard (20/10):**
- Las tarjetas de arriba (choferes, camiones, costo) arrancaban con 2 filas y escondían contenido; ahora 3 filas, relleno más chico y un alto mínimo por tarjeta. El gráfico y el calendario se ajustan al alto real (antes asomaba una barra de scroll).
- **La personalización no se guardaba:** la API no tiene `/api/DashboardLayout` (404). Además había un error en la pantalla (cada tarjeta quedaba registrada dos veces en gridstack) que hacía que se guardara el tamaño viejo. Ahora el diseño se guarda **en el navegador, por usuario**; si algún día se crea el endpoint en la API, tiene prioridad. **Limitación:** en otra computadora o navegador se ve el diseño por defecto.
- **Probar en la VM:** Personalizar → agrandar una tarjeta y ocultar el calendario → Guardar → F5: queda igual. Restablecer → vuelve al diseño por defecto.
- Calendario: siempre muestra el mes completo, sin scroll adentro. La tarjeta toma el alto que necesita el mes (4, 5 o 6 semanas) y se ajusta al cambiar de mes; por eso al personalizar no se puede achicar por debajo de eso. Títulos: "Viajes - Evolución mensual" y "Top clientes en facturación". **Probar en la VM:** pasar de mes con las flechas del calendario: se ve entero en cada mes y los viajes de un día con muchos muestran "+ más".
- La fila de "¡Bienvenido!" (con Widgets y Personalizar) queda fija debajo de la barra de arriba al bajar por el tablero, con el color de fondo configurado. **Probar en la VM:** bajar hasta el calendario: la fila sigue visible y las tarjetas pasan por detrás; en Personalizar, el panel de Widgets se abre por encima de las tarjetas.
- [ ] (Después) Endpoint `DashboardLayout` en la API + tabla, para que el diseño siga al usuario en cualquier computadora.

**Viajes, primera parte (20/10):** botones y etiquetas de estado con el design system en Gestionar y Listar viajes.
- Gestionar viajes: encabezado con ícono y subtítulo; "Registrar viaje" verde con texto y exportar solo ícono arriba a la derecha; botones de fila con `SGTL.botonFila` en el orden editar → estado y entrega (verde) → eliminar, con las mismas reglas y motivos de antes; estado con `SGTL.estado`; "En PF-…" como etiqueta informativa.
- Listar viajes: encabezado igual; **nueva columna Estado**; ojo para ver el detalle (antes "i" azul); **exportar anda** (antes llamaba a una función que no existía en esa pantalla, R1): baja todo lo filtrado.
- Falta de viajes: filtros (Limpiar, calendario viejo → flatpickr con cruz), los dos `confirm()` del modal de estado, la X de los modales (Feather) y el modal de detalle de Listar viajes. **Hecho el 22/10 (ver §20).**
- **Probar en la VM:** en Gestionar viajes, los colores de estado y que editar / estado y entrega / eliminar abran lo mismo que antes; en un viaje facturado o en proforma, los botones deshabilitados con su motivo. En Listar viajes, la columna Estado, el ojo y Exportar.

**Presupuestos, botones (20/10, pantalla de Facu, a pedido de Rocío):** los botones de la fila pasan a `SGTL.botonFila` en el orden editar → PDF → enviar por e-mail → generar viaje (verde) → eliminar, con las mismas reglas de habilitado y el motivo en el tooltip; eliminar usa la confirmación compartida (antes `confirm()`). La pantalla carga `sgtl.css` y `sgtl-ui.js`. Sin tocar: el desplegable de estado de la fila (Rocío, 20/10: queda como está; **verlo con Facu** si pasa a etiqueta de color — Pendiente gris, Aceptado verde, Rechazado rojo — con "Marcar como aceptado" / "Rechazar" como siguiente paso), los avisos propios (`aviso()`), filtros y modales. **Avisarle a Facu.** **Probar en la VM:** cada botón abre lo mismo que antes; en un presupuesto con viaje, editar, generar y eliminar deshabilitados con su motivo.

**Etiquetas de estado en proformas, facturación y e-mail (20/10, pantallas de Facu, a pedido de Rocío):** solo la pastilla. Borrador gris, Generada azul, Aceptada amarillo, Facturada verde, Anulada rojo (`SGTL.estado`); en facturación, Activo verde e Inactivo gris; en e-mail, el número de servicio queda blanco con borde y SSL/TLS usan Sí verde / No gris. La pastilla del título del modal de proforma (gestionar y listar) sale de la misma función que la tabla. No cambia la API, los filtros ni los pasajes de estado. El chip de plataforma y el resultado del Excel quedan como estaban. **En la Mac (20/10), con API simulada, se vio la grilla de Gestionar proformas (los cinco colores) y el modal en Borrador.** Falta mirar el resto de los modales, Listar proformas, Gestionar facturación y Gestionar e-mail. **Avisarle a Facu.** **Probar en la VM:** en Gestionar proformas y Listar proformas, cada estado en la grilla y al abrir el modal; en Gestionar facturación, una fila activa y una inactiva; en Gestionar e-mail, un Sí y un No de SSL y de TLS.

**Menú lateral: grupo de la pantalla actual cerrado (anotado el 20/10, sin hacer):**
- [ ] Rocío vio que al entrar, por ejemplo, a Gestionar proformas, el grupo Facturación aparece cerrado; al abrirlo, la opción está marcada. En la Mac no se reproduce: `markActiveSidebarItem` (`sidebar-loader.js`) marca la opción y `components/sidebar.js` abre su grupo (probado en 1366 y 1100 px, en Gestionar proformas, Listar proformas, Gestionar cuenta corriente y Gestionar camiones). Antes de tocar código, ver en la VM, después de `git pull` + Ctrl+F5, si el grupo está cerrado o si está abierto pero fuera de la vista (el menú es más alto que la pantalla). Si es lo segundo: que el menú baje solo hasta la opción activa al cargar. Si es lo primero: captura y revisar en la VM.

### Qué se aplicó en cada pantalla (referencia)

**22/10: no falta ninguna pantalla.** Lo de Facu y Fede y lo que faltaba de viajes se hizo el 22/10 con el estilo visual nuevo (ver §20). Las tablas de abajo quedan como referencia de qué cambió en cada una.

**Menú y títulos en infinitivo (§3.1): hechos en todas las pantallas el 20/10**, también las de Facu y Fede: Gestionar cuenta corriente, Gestionar facturación, Gestionar e-mail, Gestionar integración de WhatsApp, Listar proformas (título), Gestionar presupuestos, Consultar manual de usuario y Consultar informe de versión. Solo cambian el texto del menú, el título visible y la pestaña (y dos mensajes que nombraban "Configuración > E-mail"); el PDF de cuenta corriente pasó a "Cuenta corriente de clientes" el 22/10. Los permisos van por archivo, así que no cambia quién ve qué. **Probar en la VM:** con un usuario admin y uno user, el menú muestra lo mismo que antes con los nombres nuevos. Renombrar no cambia permisos (van por archivo).

| Hoy en el menú | Pasa a |
|---|---|
| Cuenta corriente | Gestionar cuenta corriente |
| Configuración → Facturación | Gestionar facturación |
| Configuración → E-mail | Gestionar e-mail |
| Configuración → Gestión de contenido | Gestionar contenido |
| Configuración → Integración WhatsApp | Gestionar integración de WhatsApp |
| Auditoría | Auditoría (queda sin verbo: es ítem principal, 20/10) |

Listar proformas y Gestionar proformas ya están en infinitivo. Dashboard no se renombra.

**Nuestras** (se pueden hacer sin avisar). **20/10: hechas todas menos viajes; viajes, el 22/10 (§20).** La tabla queda como referencia:

| Pantalla | Archivos | Qué cambia además de lo común |
|---|---|---|
| Consultar auditoría | `gestion-auditoria.html` | Título = menú; sacar Limpiar; "Alta (INSERT)" / Login / Logout → Alta / Inicio de sesión / Cierre de sesión |
| Gestionar contenido | `gestion-contenido.html` | "Confirmar" → Guardar / Restablecer; toasts `SGTL` (R2: `showErrorToast` no existe). Logo, pie y colores **no se tocan** |
| Listar / Gestionar camiones | `listado-camiones.html`, `gestion-camiones.html` | Igual que el piloto de choferes. Exportar todo lo filtrado (R6). Fechas DD/MM/AAAA (R3) |
| Listar / Gestionar clientes | `listado-clientes.html`, `gestion-clientes.html` | Igual que choferes. Habilitado/Deshabilitado → Activo/Inactivo. El CSV roto (R1) se arregla al pasar a `SGTL.descargarCSV` |
| Listar / Gestionar viajes | `listado-viajes.html`, `gestion-viajes.html` | Sacar Limpiar; daterangepicker → flatpickr rango; acciones de fila unificadas; `</script>` suelto (R5) |
| Listar / Gestionar usuarios | `listado-usuarios.html`, `gestion-usuarios.html` | "Alta" / "Más detalles" → Registrar usuario / Ver detalle (solo ícono) |
| Gestionar grupos y permisos | `gestion-gruposypermisos.html` | "Alta" → Registrar grupo; `confirm()` → `SGTL.confirmar`; paginar si pasa de 15 |
| Gestionar orígenes y destinos | `gestion-origenes-destinos.html` | "Nuevo origen" → Registrar origen / destino; paginar |
| Gestionar tarifas | `gestion-tarifas.html` | "Nueva tarifa…" → Registrar tarifa fija / por km; paginar |
| Login e inicio | `Login.html`, `index.html` | Nunito; solo Bootstrap Icons (sacar Font Awesome). Dashboard no se renombra |

**Facu** (avisar antes; unificar igual): solo frente, no la lógica. **20/10: las etiquetas de estado de proformas, facturación y e-mail ya usan el design system** (párrafo de arriba). **22/10: aplicado todo lo de esta tabla, con el OK de Rocío (ver §20).** Hay que avisarle a Facu qué cambió.

| Pantalla | Archivos | Qué cambia además de lo común |
|---|---|---|
| Listar proformas | `listado-facturas.html`, `reportes-proformas.js` | Título "Listar proformas"; exportar solo ícono (el modal Excel/PDF **se queda**); ~5 `alert()` → toasts |
| Gestionar proformas | `gestion-facturacion.html`, `facturacion-proforma.js`, `anulacion-factura-proforma.js` | "Nueva proforma" azul → "Registrar proforma" verde; "Confirmar eliminación" → Cancelar + Eliminar; ~17 `alert()` + `confirm()` → toasts / `SGTL.confirmar` (anular, generar, emitir) |
| Gestionar cuenta corriente | `cuenta-corriente-clientes.html`, `cuenta-corriente-clientes.js` | "Nuevo recibo" → Registrar recibo; fechas nativas → flatpickr; `alert`/`confirm`/`prompt` → toasts + confirmación con motivo; sacar `theme-dark`; pestaña activa al color del menú. Borrar la fecha = sin límite (no últimos 30 días) |
| Gestionar facturación | `configuracion-facturacion.html`, `configuracion-facturacion.js` | Título = menú; `confirm()` al desactivar → `SGTL.confirmar`. Las 3 tablas siguen sin paginar |
| Gestionar e-mail | `configuracion-email.html` | "Nueva configuración" → Registrar configuración de e-mail. La nota de SMTP se queda |
| Gestionar presupuestos | `presupuestos.html`, `presupuestos.js`, `presupuesto-pdf.js` | Ya tiene "Registrar presupuesto", "Registrar origen/destino" y "Guardar" (18/10). Falta: cargar `sgtl.css` / `sgtl-ui.js`, avisos propios → toasts `SGTL`, acciones de fila con `SGTL.botonFila`, eliminar con `SGTL.confirmar` |
| Manual de usuario e Informe de versión | `manual-usuario.html`, `informe-version.html`, `documentacion.js` | Pantallas nuevas de Facu (19/10). avisos con `SGTL` |

**Fede** (avisar antes; unificar igual). **22/10: aplicado, con el OK de Rocío (ver §20).** Hay que avisarle a Fede qué cambió.

| Pantalla | Archivos | Qué cambia además de lo común |
|---|---|---|
| Gestionar integración de WhatsApp | `configuracion-whatsapp.html` | Título = menú; avisos de página → toasts; labels "Token de acceso" / "ID del número de teléfono" (el nombre de Meta queda en la ayuda). El formulario y lo que guarda no cambian |

**No entra en esta pasada:** pasar el CSV de choferes/camiones/clientes/viajes al modal Excel/PDF (queda para después). R7 (viajes facturados en borrador #12) es de Facu, no es visual.

Bugs vistos en el relevamiento (no visuales). **Corregidos:** R1, R2, R3 y R6 el 20/10 (con la tanda de esa fecha), y R4 y R5 el 22/10. **Sigue abierto R7.**

| ID | Qué | Gravedad | Cuándo | Archivos |
|---|---|---|---|---|
| R1 | **Corregido (20/10).** El botón de reporte CSV no hace nada: llama a `generarReporteCSV()`, que no existe en esa página | Media | Ya (sigue igual después del merge) | `listado-viajes.html` (158), `gestion-clientes.html` (179) |
| R2 | **Corregido (20/10).** Gestión de contenido: `showErrorToast()` no existe; si falla la red al cargar o guardar, tira error y no avisa | Baja | Ya | `gestion-contenido.html` (299, 361) |
| R3 | **Corregido (20/10).** Camiones: el error de fecha pide "DD-MM-YYYY" pero el campo usa AAAA-MM-DD | Baja | Con la decisión de fechas (D11) | `gestion-camiones.html` (1082) |
| R4 | **Corregido (22/10, ver final de §20).** "Cambiar Contraseña" (encabezado) es un link que no hace nada. ("Documentación" del menú ya funciona desde el merge de Facu del 19/10) | Baja | Decidir si se implementan o se sacan | `views/header.html` (34), `sidebar-loader.js` (90) |
| R5 | **Corregido (22/10).** `</script>` suelto en el pie (inofensivo) | Baja | Con el piloto | `listado-viajes.html` (204) |
| R6 | **Corregido (20/10).** Exportar en camiones baja solo la página visible (15 filas), no todo lo filtrado, y no avisa. En choferes ya pide `pageSize: 0` (piloto 17/10); falta camiones | Media | Con el botón de exportar (decisión 1.2) | `gestion-camiones.html` (1620), `listado-camiones.html` (684) |
| R7 | Gestión de viajes: viajes **Facturado** (4, 6, 7, 8, 9, 11, 12, facturados con PF-00000002) aparecen "En borrador #12". La etiqueta muestra la proforma no anulada más nueva que incluye el viaje (`OUTER_APPLY_PROFORMA`), así que el borrador #12 los contiene, por `PROFORMAS_VIAJES` o por líneas `V{id}` en `PROFORMA_DETALLE`. Falta ver si se armó un borrador con viajes ya facturados (no debería poder) o si son líneas copiadas | Media | Revisar con la consulta de abajo; tocar proformas es de **Facu** | `ViajesController.cs` (194), proformas |

Consulta de solo lectura para R7 (la corre Rocío):

```sql
SELECT p.Proforma_ID, p.Numero, p.Estado, pv.ViajeID
FROM dbo.PROFORMAS p
LEFT JOIN dbo.PROFORMAS_VIAJES pv ON pv.ProformaID = p.Proforma_ID
WHERE p.Proforma_ID = 12;

SELECT Proforma_ID, Codigo FROM dbo.PROFORMA_DETALLE WHERE Proforma_ID = 12;
```

Para después: que choferes, camiones, clientes y viajes exporten con el mismo modal de Excel / PDF / imprimir que proformas y cuenta corriente (hoy bajan CSV).

---

## 11. Documentación ordenada en `docs/` — SUBIDO, PENDIENTE DE PROBAR EN LA VM (18/10)

Los `.md` que estaban sueltos en la raíz (y la guía de auditoría que estaba dentro de la API) pasaron a `docs/`, con `git mv`:

- `docs/PENDIENTES-SISTEMA.md` (este documento).
- `docs/equipo/`: `PROCEDIMIENTO-DESARROLLO-ROCIO.md`, `FLUJO-GIT.md`, `PRUEBAS-VM-CLAUDE.md`, `merge-facugodoy-2026-10-17.md`.
- `docs/negocio/`: `RELEVAMIENTO-RUKAS-CLAUDIA.md`, `PROFORMA-CLIENTES-RUKAS.md`, `CHECKLIST-OPERACION-VIAJES.md`.
- `docs/diseno/`: `cuenta-corriente-diseno.md` y `auditoria-integracion.md` (antes `WebApi_TransporteSanchez/LEEME-integracion-auditoria.md`; no estaba en el `.csproj`).
- `docs/design-system/` y `docs/pruebas/` quedan como estaban.

Se corrigieron todas las menciones a los nombres viejos (documentos, `CLAUDE.md` y comentarios en `sgtl-ui.js`, `gestion-choferes.html` y `listado-choferes.html`).

Reglas para que no vuelvan a quedar sueltos: `docs/README.md` (qué va en cada carpeta, cómo se nombra e índice). `CLAUDE.md` y el nuevo `AGENTS.md` (lo leen Cursor, Copilot y otras IA) avisan que hay que leerlo antes de crear un `.md`.

- [ ] Avisarles a Facu y Fede: la documentación ahora va en `docs/` y las reglas están en `docs/README.md`. Si usan una IA en el navegador (ChatGPT, Claude web), que le pasen ese archivo como contexto.
- [ ] Opcional: control automático (GitHub Action) que falle si aparece un `.md` nuevo en la raíz.

**Probar en la VM:** `git pull` y verificar que la sesión de pruebas encuentre `docs/equipo/PRUEBAS-VM-CLAUDE.md` (lo indica `CLAUDE.md`). No hay cambios de código: los cambios en HTML y JS son solo comentarios, no hace falta recompilar.

---

## 12. Merge de presupuestos de Facu (`4a84bb2`) en `rocionuvoli` — PUSHEADO Y PROBADO EN VM, CON 1 FALLA (18/10)

Antes de empezar con la proforma Rukas (§6) se trajo a `rocionuvoli` el commit nuevo de Facu (presupuestos, perfil de e-mail para presupuestos, alta rápida de origen/destino desde el viaje, estilos de Gestión de contenido), que tocaba los mismos archivos.

**Conflictos, revisados uno por uno con Rocío** (detalle en el mensaje del merge `0ddf948`):
- `ProformasController.cs` (Traer viajes): consulta de Rocío + precio desde presupuesto aceptado de Facu (si el viaje salió de un presupuesto, el importe es el del presupuesto).
- `ViajesController.cs`: reglas por estado y proforma de Rocío + bloqueo de Facu (un viaje de presupuesto no cambia cliente, ruta, km ni tarifa, y no se elimina).
- `configuracion-whatsapp.html`: queda la versión de Rocío (ya cargaba los estilos).
- `gestion-viajes.html`: reglas por tipo de cliente de Rocío + botones "+" de alta rápida de Facu.

**Corrección aparte:** los botones "+" de Facu quedaban habilitados en viajes que ya salieron (`bloquearDatosDelViaje` no los conocía). Ahora se deshabilitan junto con origen y destino.

**Antes de probar — la base:** *(verificado el 18/10: las tablas y columnas de presupuestos y el perfil de e-mail ya estaban; no hizo falta correr nada).* "Traer viajes", editar viaje y eliminar viaje ahora consultan `PRESUPUESTOS`; si la tabla no existe, fallan. Rocío verifica (consulta de solo lectura):

```sql
SELECT OBJECT_ID('dbo.PRESUPUESTOS') AS TablaPresupuestos,
       COL_LENGTH('dbo.PRESUPUESTOS','Estado') AS ColEstado,
       COL_LENGTH('dbo.PRESUPUESTOS','ViajeID') AS ColViajeID,
       OBJECT_DEFINITION(OBJECT_ID('dbo.CK_CEM_Modulo')) AS ModulosEmail;
```

Si algo da `NULL` (o `ModulosEmail` no incluye `PRESUPUESTOS`), correr los scripts de Facu en este orden: `database/presupuestos/01_crear_presupuestos.sql`, `database/presupuestos/02_estados_y_viaje_presupuestos.sql`, `database/email/06_perfil_presupuestos.sql` (antes estaban sueltos en `database/`). Son idempotentes.

**Probar en la VM** (después del push: `git pull` en `rocionuvoli` → recompilar la API → hard refresh). Rocío además lo revisa a mano; recién con todo OK pasa a `main`:
1. Proformas: "Traer viajes" funciona como antes (Rukas con números, directos Entregados, advertencias).
2. Viajes: editar uno Registrado (con "+" habilitados) y uno En viaje / Entregado ("+" deshabilitados junto con origen y destino); eliminar uno Registrado; no dejar eliminar uno que ya salió.
3. Registrar viaje: sin cliente los "+" están deshabilitados; con cliente Rukas se ven transporte SAP y entrega; con directo se ocultan.
4. Configuración → WhatsApp: carga con logo y colores y guarda como hoy.
5. Lo nuevo de Facu: Presupuestos (alta, aceptar → viaje) y su perfil de e-mail. Si hay un viaje de presupuesto: no deja cambiarle la ruta ni eliminarlo, y "Traer viajes" toma el importe del presupuesto.

**Resultado en la VM (18/10)** — reporte completo: `docs/pruebas/2026-10-18-merge-presupuestos-facu.md`. 22 pruebas: 17 OK, 1 falla, 2 no concluyentes, 2 sin datos.
- Funciona: Traer viajes (Rukas), la corrección nueva de los "+" en viajes que ya salieron, alta / edición / eliminación de viaje, todo Presupuestos (alta, "+", vista previa, aceptar, generar viaje), los bloqueos del viaje de presupuesto (editar ruta/km → 409; eliminar → 409), WhatsApp, Gestión de contenido, e-mail y menú.
- [x] **F1 — el "+" de alta rápida no abre en gestion-viajes** (`bootstrap is not defined` en `alta-rapida-ubicacion.js`, archivo de Facu). Corregido (`b4b12b5`): usa `window.bootstrap` si existe y si no jQuery. **OK en VM (18/10)**, 7 de 7 pruebas: crea origen y destino, los deja elegidos, se puede repetir sin recargar, un solo backdrop; en Presupuestos sigue andando. Reporte: `docs/pruebas/2026-10-18-verificacion-F1-alta-rapida.md`.
- [ ] No concluyentes: 1b (Traer viajes de cliente directo: no hay viajes disponibles) y 4k (el importe del presupuesto coincide con el de la tarifa). Para 4k hace falta un viaje de presupuesto con importe distinto de la tarifa, con remito y transporte SAP.
- [ ] **WhatsApp:** al generar el viaje #31 con el chofer de prueba "Prueba, Fede" pudo salir un mensaje real. Confirmar con Fede.
- [ ] **Limpieza:** el SQL actualizado es el de §13 ("Limpieza de las tres rondas del 18/10"); el del reporte quedó viejo porque los datos se renombraron el 21/10. Lo corre Rocío.
- F2 y F3 del reporte son anteriores al merge: F2 (simple-datatables en gestion-viajes) ya estaba como F12 en §8; F3 (PerfectScrollbar y 404 de `api/DashboardLayout`) queda como F16 en §8.
- Mejoras que salieron (no bloquean; detalle en el reporte):
  - Viaje de presupuesto: deshabilitar cliente, ruta, km y tarifa al editar, con aviso, en lugar de esperar el 409.
  - gestion-viajes: "Confirmar" → "Guardar", modal de eliminar sin voseo, `alert()` en lugar de toast, botones vacíos en pantallas chicas, falta Observaciones (entra en el design system, §10).
  - Presupuestos (Facu): toast + modal duplicados al generar viaje, "+" "Agregar origen" vs modal "Nuevo origen", PDF sin CUIT ni dirección del prestador.
  - Proformas (Facu): "Se agregaron 1 viaje(s)"; Cancelar descarta las líneas traídas sin preguntar.
  - **configuracion-whatsapp (Fede): el Access Token de Meta se ve entero en el formulario; enmascararlo como el secreto SMTP.**
  - gestion-contenido: título de la pestaña.

**Para hablar con Facu:**
- [ ] Sus scripts de presupuestos se movieron a `database/presupuestos/01_crear_presupuestos.sql` y `02_estados_y_viaje_presupuestos.sql` (convención `database/<módulo>/NN_descripcion.sql`). Avisarle para que su rama no los vuelva a crear en el lugar viejo. Ya estaban corridos en la base.
- [ ] El bloqueo al eliminar cuenta cualquier presupuesto vinculado al viaje, pero el mensaje dice "aceptado".
- [ ] La corrección de los botones "+" en viajes que ya salieron (su funcionalidad) y F1 (su `alta-rapida-ubicacion.js` no anda en páginas sin `window.bootstrap`).
- [ ] Las mejoras de Presupuestos y Proformas que salieron en la prueba.

---

## 13. Mejoras de la ronda del 18/10 — PUSHEADO; PRIMERA TANDA OK EN VM, SEGUNDA EN LA RONDA ÚNICA

Salieron del reporte `docs/pruebas/2026-10-18-merge-presupuestos-facu.md`. Rocío eligió hacerlas en esta ronda (criterio en `docs/equipo/PROCEDIMIENTO-DESARROLLO-ROCIO.md` §7). Quedan afuera: Observaciones en el viaje (pendiente de decidir si el negocio lo necesita), el PDF del presupuesto sin CUIT ni dirección del prestador (validar con Facu de dónde salen esos datos) y el Access Token de WhatsApp (Rocío decidió dejarlo como está).

- [x] **Viaje generado desde un presupuesto** (`ViajesController.cs`, `gestion-viajes.html`): al editarlo, cliente, origen, destino, "+", tipo de tarifa y Recalcular quedan deshabilitados, y la tarifa no se recalcula al cambiar fechas. Aviso: "Este viaje se generó desde el presupuesto #N, aceptado por el cliente: el cliente, el recorrido, los km y la tarifa son los del presupuesto y no se pueden cambiar. Podés modificar el chofer, el camión, las fechas y los números de referencia. Si cambia el recorrido, hace falta un presupuesto nuevo." La API devuelve `Presupuesto_ID` al abrir el viaje, y el rechazo al guardar usa el mismo texto. **Probar en VM (recompilar):** editar el viaje #31 → campos deshabilitados y aviso con el #5; cambiar chofer, fecha o remito y guardar → OK; editar un viaje común en Registrado → todo habilitado, sin aviso.
- [x] **gestion-viajes, design system (parcial)** (`gestion-viajes.html`): carga `sgtl.css` y `sgtl-ui.js`. Pie del modal "Cancelar" / "Guardar" con texto visible en todos los anchos (antes "Confirmar" y botones vacíos en pantallas chicas); "Guardando…" mientras guarda. Eliminar usa la confirmación compartida ("¿Eliminar el viaje #N?", error dentro del modal) y se quitó el modal propio sin voseo. Los `alert()` pasaron a toasts (guardado, eliminado, WhatsApp, reporte CSV, viaje facturado, error al cargar). Los errores técnicos de la API ya no se muestran. Falta: los dos `confirm()` del modal de estado (quitar evidencia y "¿Guardar igual?" sin evidencia), que quedan para la pasada completa del design system (§10). **Probar en VM:** registrar y editar un viaje (toast "Viaje registrado." / "Viaje guardado.", sin `alert`); con la ventana angosta, el pie muestra "Cancelar" y "Guardar"; eliminar un viaje Registrado de prueba (modal "¿Eliminar el viaje #N?", toast "Viaje eliminado."); intentar eliminar el #31 → el error de presupuesto sale dentro del modal; exportar CSV sin resultados → toast.
- [x] **Alta rápida de origen/destino y Presupuestos** (`alta-rapida-ubicacion.js`, `presupuestos.js`, `presupuestos.html`, `gestion-viajes.html`): los "+" de Viajes y de Presupuestos dicen "Registrar origen" / "Registrar destino", igual que el título del modal (antes "Agregar…" y "Nuevo…"); opciones con voseo ("Seleccioná una provincia", "Primero seleccioná un cliente", "Seleccioná una tarifa"). Al generar un viaje desde un presupuesto queda un solo aviso ("Viaje #N generado."): se quitó el modal "Viaje generado" con "ACEPTAR". **Probar en VM:** "+" en Viajes y en Presupuestos → título "Registrar origen"; generar un viaje desde un presupuesto aceptado → solo el aviso, sin modal (pide OK por el chofer/WhatsApp).
- [x] **Proformas: textos y cambios sin guardar** (`gestion-facturacion.html`, pantalla de Facu): "Se agregó 1 viaje." / "Se agregaron N viajes." (y lo mismo para los repetidos). Si el modal tiene cambios sin guardar (líneas traídas o agregadas, datos editados) y se cierra con Cancelar, la cruz o Escape, aparece dentro del modal "Tenés cambios sin guardar. Si cerrás, se pierden." con "Seguir editando" / "Descartar cambios" (sin un segundo modal encima). Ver o abrir una proforma sin tocar nada cierra directo. **Probar en VM:** Nueva proforma → Traer viajes → Cancelar → aviso; "Seguir editando" mantiene las líneas; "Descartar cambios" cierra. Guardar borrador cierra sin aviso. Ver una proforma generada y cerrar → sin aviso.
- [x] **Scripts de presupuestos y títulos de pestaña:** `database/presupuestos.sql` y `database/estados_presupuestos.sql` pasaron a `database/presupuestos/01_crear_presupuestos.sql` y `02_estados_y_viaje_presupuestos.sql` (con `git mv`; ya estaban corridos, no hay que correr nada). Títulos de pestaña "Gestionar contenido · Transporte Sánchez" y "Gestionar viajes · Transporte Sánchez" (antes "Sistema de gestión de viajes"). **Probar en VM:** solo ver los títulos de las pestañas.
- [x] **Presupuestos: verbos del design system** (`presupuestos.html`, `presupuestos.js`, de Facu): botón y título del modal "Registrar presupuesto" (antes "Nuevo presupuesto"), tooltip "Editar presupuesto", pie "Cancelar" / "Guardar" (antes "Guardar presupuesto"). Salió de la verificación de F1. **Probar en VM:** ver los textos; registrar y editar siguen andando.
- [ ] **Orígenes y destinos: altura vacía guardada como espacios** (`AlturaCalle` es `char(10)`; vuelve `"          "` o `"100       "`). Recortar al leer en `OrigenController` / `DestinoController`. Baja: no se ve en pantalla. Hacerlo con la pasada del design system de Orígenes y destinos.

**Resultado en la VM (18/10)** — reporte: `docs/pruebas/2026-10-18-verificacion-F1-y-mejoras.md`. 31 pruebas: 29 OK, 1 verificada solo por código (D3, sin generar viaje para no mandar WhatsApp) y **1 falla (C4)**: en gestion-viajes, el aviso "Completá o revisá: …" aparece arriba del modal, fuera de la vista, y no marca los campos.

**Limpieza de las tres rondas del 18/10 (SQL único, revisado en la Mac; lo corre Rocío).** Borra el presupuesto #5, el viaje #31 y las ubicaciones de prueba (origen 5, 6 y 7; destino 6, 7 y 8). El viaje #30 y el #32 ya se eliminaron desde la pantalla. Para volver a probar un viaje de presupuesto queda el #28 (presupuesto #1, datos del 17/10).

**Datos renombrados el 21/10 (Rocío corrió el SQL):** para que no aparezca "PRUEBA-CLAUDE" en pantalla, el cliente 5 pasó a "Distribuidora del Sur S.A.", los orígenes 5, 6 y 7 a "Planta 1/2/3", los destinos 6, 7 y 8 a "Depósito 1/2/3" y el `Num_Transporte` del viaje #31 a `T-00031`. El SQL de abajo ya busca esos nombres. El cliente 5 no se borra: también tiene el viaje #29. Los orígenes 6 y 7 y los destinos 7 y 8 no tienen calle; si la limpieza se demora, igual aparecen en los combos.

```sql
-- Controles previos (solo lectura)
SELECT Presupuesto_ID, Estado, ViajeID FROM dbo.PRESUPUESTOS WHERE Presupuesto_ID = 5;          -- ViajeID = 31
SELECT Viaje_ID, ClienteID, OrigenID, DestinoID, Num_Remito FROM dbo.VIAJES WHERE Viaje_ID = 31; -- ClienteID = 5, origen 5, destino 6
SELECT COUNT(*) AS EnProformas FROM dbo.PROFORMAS_VIAJES WHERE ViajeID = 31;                      -- 0
SELECT COUNT(*) AS EnDetalle   FROM dbo.PROFORMA_DETALLE WHERE LTRIM(RTRIM(Codigo)) = 'V31';      -- 0
SELECT Origen_ID, Descripcion  FROM dbo.ORIGEN  WHERE Origen_ID  IN (5, 6, 7);                    -- "Planta 1", "Planta 2", "Planta 3"
SELECT Destino_ID, Descripcion FROM dbo.DESTINO WHERE Destino_ID IN (6, 7, 8);                    -- "Depósito 1", "Depósito 2", "Depósito 3"
SELECT COUNT(*) AS OtrosViajes FROM dbo.VIAJES
 WHERE Viaje_ID <> 31 AND (OrigenID IN (5, 6, 7) OR DestinoID IN (6, 7, 8));                       -- 0

BEGIN TRAN;

DELETE FROM dbo.PRESUPUESTOS WHERE Presupuesto_ID = 5 AND ViajeID = 31;
SELECT @@ROWCOUNT AS PresupuestosBorrados;   -- 1

DELETE FROM dbo.VIAJE_EVIDENCIA WHERE Viaje_ID = 31;
SELECT @@ROWCOUNT AS EvidenciasBorradas;     -- 0

DELETE FROM dbo.VIAJES WHERE Viaje_ID = 31 AND ClienteID = 5;
SELECT @@ROWCOUNT AS ViajesBorrados;         -- 1

DELETE FROM dbo.ORIGEN WHERE (Origen_ID = 5 AND Descripcion = N'Planta 1')
                          OR (Origen_ID = 6 AND Descripcion = N'Planta 2')
                          OR (Origen_ID = 7 AND Descripcion = N'Planta 3');
SELECT @@ROWCOUNT AS OrigenesBorrados;       -- 3

DELETE FROM dbo.DESTINO WHERE (Destino_ID = 6 AND Descripcion = N'Depósito 1')
                           OR (Destino_ID = 7 AND Descripcion = N'Depósito 2')
                           OR (Destino_ID = 8 AND Descripcion = N'Depósito 3');
SELECT @@ROWCOUNT AS DestinosBorrados;       -- 3

-- COMMIT; o ROLLBACK;
```

Si algún control previo no da lo esperado, o algún `@@ROWCOUNT` no coincide, `ROLLBACK` y avisar. Los registros de auditoría quedan.
- [x] **Viajes: C4 + eliminar viajes de presupuesto + voseo** (`gestion-viajes.html`, `ViajesController.cs`): al tocar Guardar con datos faltantes, el modal sube hasta el aviso "Completá o revisá: …" y el aviso se renueva en cada intento (la marca en rojo por campo queda para la pasada completa del design system). La grilla trae `Presupuesto_ID`: en un viaje generado desde un presupuesto, "Eliminar" queda deshabilitado con el tooltip "Se generó desde el presupuesto #N: no se puede eliminar". Desplegables con voseo ("Seleccioná un cliente / camión / origen / destino"). **Probar en VM (recompilar):** Registrar viaje → bajar hasta el pie → Guardar sin datos → el modal sube y se ve el aviso; completar un campo y volver a Guardar → el aviso se actualiza. En la grilla, el #28 (de presupuesto) tiene "Eliminar" deshabilitado con ese tooltip; un viaje común en Registrado lo tiene habilitado.
- [x] **Proformas: advertencias de Traer viajes en singular/plural** (`ProformasController.cs`, `PrellenarViajes`): "No se trajo 1 viaje…" / "No se trajeron 3 viajes…", "1 viaje ya está incluido en otra proforma…", etc., sin "viaje(s)". **Probar en VM (recompilar):** Nueva proforma → QUICKFOOD → Traer viajes: las advertencias sin "viaje(s)".
- [x] **Proformas: modal** (`gestion-facturacion.html`, de Facu): en modo Ver el pie dice "Cerrar" (en edición sigue "Cancelar"); después de "Seguir editando" el foco vuelve al modal (Escape anda enseguida); las validaciones y errores de "Traer viajes" salen en el aviso del modal en lugar de `alert()`. Quedan otros `alert()` en la pantalla (reportes, abrir, cambiar estado, borrar, duplicar) para la pasada del design system de Proformas. **Probar en VM:** Ver una proforma → pie "Cerrar"; Editar un borrador → "Cancelar"; Traer viajes sin cliente o sin fechas → aviso amarillo en el modal, sin `alert`; Cancelar con cambios → "Seguir editando" → Escape vuelve a mostrar el aviso.
- [x] **Proformas y Presupuestos: "Registrar proforma" y títulos de pestaña** (de Facu): botón y título del modal "Registrar proforma" (antes "Nueva proforma"); pestañas "Gestionar proformas · Transporte Sánchez" y "Gestionar presupuestos · Transporte Sánchez". **Probar en VM:** ver los textos.
- [ ] **Presupuestos: avisos con `SGTL`** (pantalla de Facu): usa un `aviso()` propio en lugar de los toasts compartidos. Va con la pasada del design system de Presupuestos (cargar `sgtl-ui.js` y cambiar todos sus avisos). Avisarle a Facu.

---

## 14. Merge de Documentación de Facu (`04a394b`) en `rocionuvoli` — PUSHEADO (`e3359ea`), FALTA PROBAR EN VM (19/10)

Último commit de Facu (no va a subir más). Merge sin conflictos (`16bcc7c`). Módulo de **solo consulta**:
- `manual-usuario.html` e `informe-version.html` (menú Documentación, visibles para todos los usuarios activos sin depender de permisos);
- `DocumentacionController.cs` (`api/Documentacion`, valida la sesión; solo el número de versión es público);
- en el login, debajo del logo, la última versión (si no hay versiones cargadas no muestra nada).

**Los PDF no se cargan desde el sistema** (decisión de Rocío, 19/10): los carga alguien de sistemas directo en la base, en `MANUAL_USUARIO` (un solo registro, `ManualUsuario_ID = 1`) y `VERSIONES` (número, fecha y PDF de cada versión), hasta 10 MB cada uno.

Script movido a la convención: `database/documentacion.sql` → **`database/documentacion/01_crear_manual_y_versiones.sql`**.

**Antes de probar — la base** *(verificado el 19/10: las dos tablas existen, no hay tabla con el nombre viejo, y hay 1 manual y 3 versiones cargados; no hizo falta correr nada)* (consulta de solo lectura):

```sql
SELECT OBJECT_ID('dbo.MANUAL_USUARIO') AS TablaManual,
       OBJECT_ID('dbo.VERSIONES')      AS TablaVersiones,
       OBJECT_ID('dbo.ManualUsuario')  AS TablaNombreViejo;   -- tiene que dar NULL
SELECT COUNT(*) AS Manuales  FROM dbo.MANUAL_USUARIO;           -- solo si la tabla existe
SELECT COUNT(*) AS Versiones FROM dbo.VERSIONES;                -- solo si la tabla existe
```

Si `TablaManual` o `TablaVersiones` dan `NULL`, correr `database/documentacion/01_crear_manual_y_versiones.sql` (se puede correr más de una vez). Si `TablaNombreViejo` no da `NULL`, el script frena a propósito: avisar antes de seguir.

- [ ] Avisarle a Facu: los scripts van en `database/<módulo>/NN_descripcion.sql` y la documentación en `docs/` según `docs/README.md` (se movieron los de presupuestos y documentación).
- [ ] Design system de las dos pantallas nuevas: con la pasada de las pantallas de Facu (§10).

---

## 15. Mejoras de la meet del 18/10 — NO HECHAS (solo anotadas, 19/10)

Surgieron en la meet del equipo para ver cómo quedó el proyecto. Las de WhatsApp tocan el módulo de Fede: **avisarle antes de hacerlas**.

- [ ] **Viajes: acción "Reenviar WhatsApp"** (`gestion-viajes.html`, `ViajesController.cs`; módulo de Fede). Botón de fila en Gestionar viajes que le vuelve a mandar al chofer del viaje el mismo WhatsApp que se manda al confirmarlo. Sirve si el envío original falló o si hay que recordárselo. A definir: en qué estados se habilita (¿solo con chofer asignado y viaje no finalizado?), confirmación antes de mandar ("¿Reenviar el WhatsApp a <chofer>?") y que quede registrado el reenvío. Usa la plantilla que ya existe.
- [ ] **Viajes: avisar al chofer por WhatsApp cuando se elimina el viaje** (módulo de Fede). **No es para hacer ya.** Al eliminar un viaje que ya se le había avisado al chofer, mandarle automáticamente un mensaje de que el viaje no se hace. Necesita una **plantilla nueva aprobada en Meta** (los mensajes iniciados por la empresa solo salen con plantilla). Ver también qué pasa si se cambia el chofer de un viaje ya avisado (¿avisar al anterior?).
- [x] **Cambio de contraseña básico seguro, sin WhatsApp.** Resuelto el 22/10: el usuario autenticado cambia su propia contraseña desde el encabezado con contraseña actual, nueva y confirmación. La API toma la identidad del JWT, guarda hashes PBKDF2 y migra valores heredados al iniciar sesión correctamente. El script `database/seguridad/01_ampliar_contrasena_usuarios.sql` **ya está corrido** en `sql-tesis` (verificado por Rocío el 22/10). Con el merge (§21) queda nuestra ventana de cambiar contraseña, adaptada a esta API. Diseño: `docs/diseno/seguridad-contrasenas-diseno.md`.
- [ ] **Sacar `repositorio.zip` de la raíz del repo.** Revisado el 19/10: pesa ~50 MB, entró en el **primer commit (`62e45b5`, 20/07, autor "Agus")** y está en todas las ramas (`main`, `rocionuvoli`, `facugodoy`, `fedemontenegro`). Es una copia vieja del proyecto (6751 archivos: páginas, `assets/`, API con `bin/` y `obj/`) del 20/07; parece la versión inicial que después se subió suelta, pero no se comparó archivo por archivo con el repo actual. **Trae un `Web.config` con la cadena de conexión con contraseña** (y `models/appsettings.json` con una clave). Pasos:
  1. Confirmar con el equipo que nadie lo necesita.
  2. `git rm repositorio.zip` en `rocionuvoli` (commit `Repo: sacar repositorio.zip`) y agregar `*.zip` al `.gitignore` (salvo `assets/extensions/`, que tiene `summernote-0.8.20-dist.zip`; ver si ese también sobra).
  3. Borrarlo solo del último commit **no lo saca del historial**: la contraseña sigue visible en GitHub. Va junto con el 3.3 (password en `Web.config`): lo correcto es **cambiar la contraseña de la base en Azure** y, si se quiere, limpiar el historial (`git filter-repo`), que obliga a todo el equipo a volver a clonar. Decidirlo con el equipo.

---

## 16. Diagramas de los flujos — NO HECHO (anotado el 19/10)

Pedido de Rocío: cuando cierre la proforma de plataforma, armar los flujos en diagramas para que **Facu y Fede puedan probar** sabiendo qué recorrer, y como **soporte para la presentación con la profesora**.

- [x] **Primera versión (19/10), pedida por Rocío para la presentación del 20/10:** `docs/negocio/FLUJOS-VIAJES-Y-PROFORMAS.md` (diagramas Mermaid: mapa general, estados del viaje directo y Rukas, qué se puede hacer según el estado, proforma propia, proforma de Rukas con quién hace qué, decisiones, resultados del control y estados, y cómo se corrige cada error) y `docs/equipo/INSTRUCTIVO-PRUEBAS-VIAJES-Y-PROFORMAS.md` (paso a paso para Facu, Fede y Rocío, y guion de la presentación). De paso se corrigió la ayuda del estado Facturado en Gestionar viajes (decía que se marcaba al generar la proforma).
- [ ] Pendiente: diagramas de otros módulos (presupuestos, cuenta corriente, WhatsApp) si hacen falta; imágenes para las diapositivas si Rocío las pide.
- [ ] La proforma de Rukas ya tiene los casos y los Excel para recorrerla: `docs/pruebas/datos/README.md`.
- [ ] Para la tesis: aclarar en el diagrama que la factura es interna porque SGTL no está conectado a ARCA (§10 del documento de negocio).

---

## 17. Pasar `rocionuvoli` a las ramas del equipo y a `main` — DESPUÉS DE LA PRUEBA MÍNIMA (19/10)

Orden acordado con Rocío el 19/10: push de `rocionuvoli` → prueba mínima en la VM → con eso OK, actualizar las ramas → `main`. **Prueba mínima OK el 19/10** (`docs/pruebas/2026-10-19-prueba-minima-proforma-plataforma.md`).

- [x] **`main` y `facugodoy` actualizadas el 19/10** con `rocionuvoli` (fast-forward, sin conflictos; en `6dca512` y después con este registro). Facu y Fede pueden probar desde `main`.
- [x] **`fedemontenegro` pisada con `rocionuvoli` el 19/10, con el OK de Fede** (push forzado solo si seguía en `7c4b777`). Revisado antes: su módulo de WhatsApp ya estaba en `rocionuvoli` (`b5f1ab6`: mismos servicios y controller, pantalla en `configuracion-whatsapp.html`, `ViajesController` crea el envío sin `UnityConfig`). Se descartaron solo la carpeta `repositorio/` (copia vieja del proyecto con `Transporte_Sanchez.bak`, 68 MB) y `gestion-whatsapp.html`.
- [ ] **Fede: dejar su copia local igual a GitHub antes de seguir** (`git fetch origin`, `git checkout fedemontenegro`, `git reset --hard origin/fedemontenegro`, guardando antes lo que tenga sin commitear). Si pushea desde la copia vieja, vuelven `repositorio/` y el backup.
- [ ] El backup de la base sigue en el historial de GitHub (ya estaba pusheado): mismo tema que `repositorio.zip` (§15).
- **`fedemontenegro` tiene un commit propio** (`7c4b777` "Integracion con whatsapp", 12/10). Su contenido ya está integrado en `rocionuvoli` (`b5f1ab6`, pantalla en Configuración), pero el commit además trae la carpeta `repositorio/` con un backup de la base de 68 MB (`Transporte_Sanchez.bak`). Dejar la rama igual a `rocionuvoli` pisa ese commit: **pedirle OK a Fede** antes. El backup sigue en el historial de GitHub aunque se limpie la rama (mismo tema que `repositorio.zip`, §15).
- Avisarle a Facu antes: se tocaron `ProformasController`, `gestion-facturacion.html` (filtro Tipo) y el PDF de la proforma.
- `rocionuvoli` arrastra cosas ya pusheadas que esperaban la ronda única en la VM (ítems 13 y 14): con la prueba mínima se cubre lo principal; el resto queda a cargo de la prueba de Facu y Fede.

---

## 18. Merge de Facu del 20/10 (`e701a4f`) en `rocionuvoli` — HECHO, SIN PUSH NI PRUEBA EN VM (20/10)

Tres commits de Facu (`a9a9d4c`, `e64d127`, `e701a4f`) sobre nuestro `ec177a1`. Conflictos en dos archivos:
- `cuenta-corriente-clientes.html`: queda nuestro ícono de SGTL + el `sgtl.css` que agregó Facu.
- `gestion-gruposypermisos.html`: Facu la cambió sobre la pantalla vieja mientras la rediseñábamos (`76f611f`). Queda **nuestro diseño** (`SGTL.ajax`, toasts, sin `alert()` ni modal de éxito) con **lo de Facu adentro**: permisos agrupados por menú con una casilla que marca todo el grupo, buscador de usuarios, y la pestaña Usuarios **solo agrega** (como su API). Botón "Agregar al grupo". Los estilos de la lista pasaron de `sgtl.css` a la página. Sus tests `tests/usuarios-por-grupo.test.js` y `tests/permisos-agrupados.test.js` se adaptaron (no se pudieron correr: en la Mac no hay Node).

**La base — aplicado el 20/10:** `database/menu/02_presupuestos_para_grupos_con_viajes.sql`. Diagnóstico: ningún menú fuera del catálogo de la API, ninguno del catálogo faltante (Presupuestos ya existía); solo el grupo **Administradores** (ID 1) tenía Gestión de viajes sin Presupuestos. Se le dio el permiso y la verificación dio 0. Facu sacó la regla del menú lateral que dejaba entrar a Presupuestos con Gestión de viajes; el script le da el permiso Presupuestos a esos grupos. El diagnóstico también lista los menús que la API no reconoce (ver el último pendiente).

**Prueba en la VM del 20/10** (`docs/pruebas/2026-10-20-merge-facu.md`, sobre `d415083`). Las cuatro ramas ya se habían pasado a `rocionuvoli` (`2a23274`, con la documentación de la tesis de `main`), con el OK de Rocío, antes de terminar la prueba.
- **OK:** concepto obligatorio al guardar y al generar (también con solo espacios); "Solo pendientes" con los recibos "Sin imputar" al final; aplicaciones de REC y NC en celeste (modo claro); las dos pestañas de Grupos y permisos (menos el alta); los 7 tests de `tests/` (con el Node de Cursor). Sin errores de consola.
- **FALLA (de antes del merge):** el modo oscuro de toda la pantalla de cuenta corriente no se aplica. Sus 14 reglas usan `body.theme-dark`, pero `initTheme.js` pone `data-bs-theme="dark"` en `<html>`. Arreglo: cambiar el selector por `[data-bs-theme="dark"]` (pantalla de Facu: avisarle).
- **Falta probar** (generan numeración o tocan datos reales; con OK de Rocío): aceptar y facturar con concepto vacío, el vencimiento a 10 días, emitir recibo y comprobante con los toasts, "Parcialmente imputado", el alta de un usuario al grupo y Presupuestos con `aguspaidw4` (no admin del grupo Administradores; el login lo hace Rocío).
- **Datos de prueba:** grupo `PRUEBA-CLAUDE 20/10` (id 7) con el permiso Dashboard. Dejarlo hasta probar el alta de usuarios; el SQL de limpieza está en el reporte (si se agrega un usuario, sumar el `DELETE` de `GRUPOS_USUARIOS`).

**Cómo probar en la VM** (recompilar la API: cambiaron `ProformasController`, `CuentaCorrienteController` y `GruposController`):
- [ ] Proformas: guardar una proforma con una línea sin concepto → el campo queda en rojo con "Completá el concepto de cada línea de la proforma." y no guarda. Lo mismo al aceptarla y al facturarla.
- [ ] Facturar una proforma: el vencimiento propone emisión + 10 días; si se cambia la emisión, se mueve; si se tocó el vencimiento a mano, no.
- [ ] Cuenta corriente: emitir un recibo y un comprobante → el modal se cierra y aparece el toast "Se generó el Recibo …" / "Se generó la Factura …".
- [ ] Cuenta corriente con "Solo pendientes": un recibo sin imputar aparece al final como "Sin imputar"; al abrir una factura, las aplicaciones de recibos y NC se ven en celeste.
- [ ] Grupos y permisos → Permisos: los permisos salen en tarjetas por menú (General, Choferes, …); la casilla del menú marca y desmarca todo, y queda a medias si hay algunos. Guardar y volver a elegir el grupo.
- [ ] Grupos y permisos → Usuarios: los que ya están salen con "En el grupo" y sin casilla; los admin, sin casilla. Buscar, tildar alguno, borrar la búsqueda (sigue tildado) y "Agregar al grupo" → toast "Se agregó 1 usuario al grupo." y pasa a "En el grupo". Sin nada tildado, el botón queda deshabilitado.
- [ ] Un usuario (no admin) de un grupo con Gestión de viajes sigue viendo Presupuestos (después del script).
- [ ] Si hay Node en la VM: `node tests/<archivo>.test.js` para cada test de `tests/` (tienen que imprimir `OK`).

**Para la ronda con Facu (decisiones de Rocío del 20/10: queda su versión mientras ande; analizar a futuro si se cambia):**
- [ ] **Usuarios por grupo solo agrega** (`POST api/Grupos/{id}/Usuarios` ya no saca a nadie). Para sacar a alguien hay que editar el usuario en Gestionar usuarios. Ver si conviene que la pestaña también permita sacar.
- [ ] **La API crea menús sola** (`AsegurarCatalogoMenuPermisos`): al abrir Permisos por grupo da de alta en `MENU` cada nombre de su catálogo que no encuentra. Si en la base un menú tiene otro nombre (Facu agregó alias como "Gestionar viajes" y "Consultar auditoría" en `sidebar-loader.js`), queda duplicado. Diagnóstico del 20/10 (script `02`): hoy todos los menús de la base coinciden con el catálogo, así que no se crea ningún duplicado. Queda para analizar si conviene un script fijo en lugar de que lo haga la API.
- [ ] Preguntarle a Facu: el vencimiento de la factura ya no usa `FechaVencimientoSugerida` de la API (que puede venir de las condiciones del cliente) sino emisión + 10 días fijo. ¿Fue a propósito?
- [ ] En "Solo pendientes", el saldo de un recibo sin imputar sale en rojo como si fuera deuda: ¿mostrarlo distinto?
- [ ] Avisarle a Facu que Usuarios y grupos no es su módulo y que la pantalla ya tenía el design system: se pasó su lógica a nuestro diseño.
- [ ] Carpeta `tests/` nueva (Node, leen el código fuente como texto): ver con `docs/README.md` si se documenta y cómo se corren.

## 19. Dashboard dinámico — PUSHEADO, FALTA PROBAR EN VM (21/10)

Pedido de Rocío (21/10): filtros, gráficos, últimos viajes, próximos viajes aparte del calendario, comparativa de meses, entregados / pendientes / entregados con rechazo, filtro desde y hasta (último mes, trimestral, semestral), km por mes y en qué camiones se distribuyó, y ver qué más se puede sumar.

**Qué cambió** (`index.html`, `assets/static/js/dashboard.js` nuevo, `ViajesController.cs`, `sgtl-ui.js`):
- **Período**, arriba a la derecha: Último mes / Trimestre / Semestre / Año, o un rango a mano en "Desde y hasta" (se aplica al elegir las dos fechas). Recuerda el último botón elegido (en el navegador). Todo se compara con el período anterior y debajo del título se ven las dos fechas.
  - Último mes: los 30/31 días hasta hoy. Trimestre, semestre y año arrancan el 1° del mes (los meses del gráfico quedan completos, salvo el actual). El anterior es el mismo rango corrido esa cantidad de meses; en un rango a mano, la misma cantidad de días justo antes. Hasta 2 meses, los gráficos y la comparativa van por semana; más largo, por mes.
- **Indicadores del período:** Viajes (% contra el anterior), Entregados (% de los viajes), Pendientes de entrega (en viaje / sin salir), Entregados con rechazo (% de los entregados y cantidad de parciales), Km recorridos (% contra el anterior), Costo por viaje (ahora del período, con el total y su %).
  - **Cómo se cuenta cada viaje:** Registrado y En viaje = pendiente. Entregado, Listo para facturar y Facturado = entregado, separado por el resultado de la entrega: Rechazo, Parcial o completo. Con plataforma (Rukas) el resultado es opcional: sin resultado cuenta como entregado completo.
- **Gráficos:** Viajes por mes (barras apiladas entregado / parcial / con rechazo / pendiente, con el total arriba), Km por mes y Km por camión (los 8 con más km; el resto en "Otros"). Colores del §4 del design system; se pasaron por el validador de daltonismo (separación OK; el amarillo y el gris tienen poco contraste, por eso van con leyenda, total y la tabla comparativa).
- **Listas:** Últimos viajes del período (8), Próximos viajes (desde hoy y sin entregar, con fecha y hora, recorrido, cliente, camión y chofer; no depende del período) y Comparativa por mes (viajes, variación contra el mes anterior, entregados, parciales, con rechazo, pendientes y km, con el total del período).
- **Detalle de un viaje:** el ojo de Últimos viajes o un clic en Próximos viajes o en el calendario abre "Ver detalle del viaje N° …", con el enlace "Abrir en Gestionar viajes" (no aparece si el viaje está facturado, porque no se puede editar).
- **Calendario:** pide solo los viajes del mes que se ve (antes traía todos), cada viaje con el color de su estado y clic para el detalle. "Hoy" y "+2 más" en castellano (`locale/es.js` es de otra versión de FullCalendar). Resuelve la parte del calendario de ADM-08 (`docs/design-system/04-relevamiento-funcional.md`).
- Las tarjetas que no siguen el período lo dicen: Choferes y Camiones activos "Hoy", Top clientes en facturación "Histórico" (es de cuenta corriente, de Facu: sin fechas).
- **Correcciones:** Camiones activos mostraba siempre total / total; ahora cuenta los "Activo". El botón "Widgets" se veía aunque no se estuviera personalizando. En celular dos tarjetas de la misma fila quedaban una encima de la otra (gridstack): ahora van en orden; en celular no se muestra "Personalizar" y la fila del período no queda fija.
- El diseño personalizado se guarda con otra clave (`sgtl-dashboard-v2-<usuario>`): quien haya guardado uno antes ve el diseño por defecto una vez.
- Design system: "Rechazo" (resultado de la entrega) pasa a rojo en `SGTL.estado` (§4.1 de `docs/design-system/03-decisiones.md`).
- **API:** `GET api/Viajes/ResumenCosto` acepta `fechaDesde` y `fechaHasta` (opcionales, filtran por Fecha_Inicio igual que Buscar); sin fechas responde como antes. **Hasta recompilar la API, Costo por viaje muestra el total histórico en cualquier período.**

**Segunda tanda (21/10, pedida por Rocío): Para revisar e ITV de camiones.** Dos tarjetas nuevas debajo de los indicadores. No dependen del período ("Hoy").
- **Para revisar:** viajes con algo pendiente, de cualquier fecha. Arriba, un resumen por motivo ("2 atrasados · 13 sin salir · …"); un viaje puede tener más de un motivo. Orden: lo más urgente primero y, dentro de cada motivo, lo más viejo. El ojo abre el detalle.
  - **Atrasado:** En viaje y ya pasó la fecha de fin.
  - **Sin salir** (directos): Registrado con la fecha de inicio anterior a hoy.
  - **Sin cerrar** (con plataforma): Registrado con la fecha de fin anterior a hoy; falta marcarlo Listo para facturar (el seguimiento está en Rukas).
  - **Sin proforma:** Entregado o Listo para facturar hace más de 7 días (fecha de entrega o, si no hay, de fin) y en ninguna proforma, ni en borrador. Los 7 días están en `DIAS_SIN_PROFORMA` de `dashboard.js`.
  - **Sin evidencia** (directos): Entregado sin el adjunto de la entrega. Facturado ya no cuenta, porque ahí no se puede adjuntar.
  - Pide a la API solo los viajes En viaje, Registrado (hasta ayer), Entregado y Listo para facturar: los facturados no se traen.
- **ITV de camiones:** camiones activos con la ITV vencida (rojo) o que vence en los próximos 30 días (amarillo), con cuándo vence, marca, modelo y fecha del último control. Si no hay ninguno, dice cuál es el próximo vencimiento. **`FechaITV` es la fecha del último control** (Gestionar camiones no deja cargar una fecha futura): el vencimiento se calcula **a los 12 meses**. Si algún camión tiene otro plazo, cambiar `MESES_VIGENCIA_ITV` en `dashboard.js` (o agregar el vencimiento al camión).
- Etiquetas nuevas en `SGTL.estado` (§4.1 de `docs/design-system/03-decisiones.md`): Atrasado, Sin salir, Sin cerrar, Sin proforma, Sin evidencia y Por vencer en amarillo; Vencida en rojo.
- De paso: los ejes abreviados dicen "5 mil" (antes "5 K" y "12,5 k" mezclados) y el número de la barra más larga de Km por camión ya no se corta en pantallas angostas.
- Visto en la prueba: los enlaces del sistema salen verdes (`a` de `assets/compiled/css/app.css`), aunque el §11 del design system dice azul. Afecta a todas las pantallas; no se tocó.

**Tercera tanda (21/10, pedida por Rocío): Km por chofer.** Tarjeta nueva, igual a Km por camión: km del período por chofer, los 8 con más km y el resto en "Otros". Los viajes sin chofer (con plataforma se puede asignar después) van juntos en gris como "Sin chofer"; un chofer inactivo aparece igual (en el globito dice "Inactivo").
- En las dos tarjetas (camión y chofer) cada barra dice "7.559 km · 18 viajes". Si no entra (celular), solo los km; los viajes y el % del total quedan en el globito.
- Diseño por defecto: Km por mes y Km por camión en una fila, Km por chofer y Top clientes en la siguiente, y Últimos viajes a todo el ancho.
- Si alguien ya guardó su diseño, las tarjetas que se agreguen después aparecen al final (antes podían quedar encimadas).

Probado en la Mac con una API falsa (viajes inventados, sin base) a 1366 y 390 px: los cuatro períodos, un rango a mano, detalle desde las tres listas, calendario, Personalizar (ocultar, guardar, recargar, y un diseño guardado sin la tarjeta nueva), las tarjetas de Para revisar e ITV con casos de cada motivo y Km por chofer con viajes sin chofer y un chofer inactivo. Falta con datos reales.

**Cómo probar en la VM** (`git pull` → recompilar la API → Ctrl+F5 en el dashboard):
- [ ] Al entrar: Trimestre marcado, debajo del título "Del 01/08/2026 al … · comparado con el 01/05/2026 al …", todas las tarjetas con datos y sin errores nuevos en la consola (los de F16 siguen).
- [ ] Último mes, Semestre y Año: cambian los números, los gráficos (por semana en Último mes) y la comparativa. Al recargar queda el último elegido.
- [ ] "Desde y hasta" con un rango a mano: ningún botón marcado; Viajes coincide con Listar viajes filtrado por esa fecha de inicio.
- [ ] Entregados = Entregado + Listo para facturar + Facturado del período; con rechazo = resultado Rechazo (comparar con Gestionar viajes).
- [ ] Costo por viaje cambia con el período (si no cambia, la API no se recompiló).
- [ ] Camiones activos coincide con los camiones Activo de Gestionar camiones.
- [ ] Próximos viajes: de hoy en adelante y sin entregar; clic → detalle; "Abrir en Gestionar viajes" abre ese viaje para editar.
- [ ] Calendario: colores por estado; clic en un viaje → detalle; al pasar de mes trae los viajes de ese mes.
- [ ] Personalizar: ocultar una tarjeta, Guardar, F5 → sigue oculta; Restablecer vuelve al diseño por defecto.
- [ ] F12 a 390 px: tarjetas en una columna, en orden, sin Personalizar.
- [ ] Para revisar: cada viaje listado cumple su motivo (abrirlo en Gestionar viajes y mirar estado, fechas, proforma y evidencia). Al revés: pasar uno a En viaje, o meterlo en una proforma, y recargar → sale de la lista.
- [ ] Para revisar con muchos viajes viejos: si aparecen viajes de prueba antiguos, sirve para decidir la limpieza (§4).
- [ ] ITV de camiones: comparar con la fecha de ITV de cada camión activo en Gestionar camiones (vence a los 12 meses). Confirmar con Rocío si el plazo es de 12 meses para todos.
- [ ] Km por chofer: con Último mes, los km de un chofer coinciden con la suma de sus viajes en Gestionar viajes. Los viajes sin chofer aparecen como "Sin chofer".

**Ideas para sumar** (pedido de "ver qué más tiene valor"; Rocío decide). Hechas el 21/10: Para revisar, ITV de camiones y Km por chofer (ver arriba). Quedan:
- [ ] **Rechazos por cliente o por destino**: dónde se concentran. Solo frente.
- [x] **Facturación del período y deuda vencida**: hecho el 24/10 como tableros nuevos (facturación por cliente y por mes, deuda vencida por cliente), ver §35. Es cuenta corriente: avisarle a Facu.
- [ ] **Uso de la flota**: % de camiones con al menos un viaje en el período y días sin viajes de cada uno. Solo frente.
- [ ] **Exportar la comparativa** a CSV con el botón de exportar del design system.
- [ ] **Km cargados a mano** en el período (auditoría `KM_MANUAL`): control de calidad del dato. Necesita un endpoint.

**Ajustes de Rocío (22/10, commit "Dashboard: período como selector segmentado, su texto debajo y lista de widgets
que se desplaza"), falta probar en la VM:**
- **Período:** los botones Último mes / Trimestre / Semestre / Año pasan a un selector segmentado (opción A de las
  tres que vio Rocío): riel gris claro y el elegido como tarjeta blanca con el texto en azul. Queda como estilo
  compartido `.sgtl-segmentado` (§12 del design system). Los botones de esa fila (Personalizar, Widgets, Restablecer,
  Cancelar, Guardar) pasan al alto normal: todo mide 40 px, como el campo de fechas.
- **Texto del período** ("Del … al … · comparado con …"): pasa de debajo de "¡Bienvenido!" a la derecha, debajo de
  los botones del período, porque explica lo que se eligió ahí. El título queda a la altura de los botones. En
  celular va todo a la izquierda, uno debajo del otro.
- **Personalizar → Widgets:** la lista era más larga que la pantalla y la rueda movía las tarjetas de atrás. Ahora
  ocupa como mucho el alto visible debajo del botón y se desplaza sola; al llegar al final, la pantalla no se mueve.
- [ ] Probar en la VM (Ctrl+F5): el período se ve como selector y el elegido cambia al tocar otro; con un rango a mano
  en "Desde y hasta", ninguno queda marcado. El texto del período queda debajo de los botones, a la derecha, y cambia
  al elegir otro período. Personalizar → Widgets: con la rueda sobre la lista se llega hasta
  "Calendario de viajes" y las tarjetas de atrás no se mueven; achicar la ventana con la lista abierta la acomoda.

---

## 20. Estilo visual nuevo en todas las pantallas — PUSHEADO (`1015f66`), FALTA PROBAR EN VM (22/10)

Decidido por Rocío el 22/10 con el lienzo "Variantes visuales SGTL" (variante B, encabezados con mayúscula solo
al principio, botones livianos, componentes iguales). Reglas en `docs/design-system/03-decisiones.md` §12 (y
cambios en §5.1 y §11). Pedido: **que quede aplicado en todas las pantallas, sin nada distinto.**

**Base (commit "Interfaz: estilo visual nuevo en todas las pantallas"):**
- `assets/static/css/sgtl.css`: sección §12 con el estilo de todos los componentes y los avisos de arriba a la
  derecha como tarjeta blanca con ícono.
- `views/header.html` y `views/footer.html` pasan a ser fragmentos: antes traían `<head>` con `app.css` e
  `iconly.css`, que se cargaban dos veces más en cada pantalla y pisaban `sgtl.css`.
- `sgtl.css` se suma en Gestionar integración de WhatsApp, Manual de usuario e Informe de versión, y en
  cuenta corriente pasa a cargarse después de `app.css` (estaba antes y la plantilla lo pisaba).
- `gestionContenido.js`: el color de fondo pinta la pantalla en un tono muy claro y entero en la línea de
  arriba; "Restablecer" vuelve a fondo `#435ebe`. Gestionar contenido aclara dónde se usa cada color.
- Login en Nunito (§11).

**Cómo probar en la VM** (`git pull` → Ctrl+F5 en cada pantalla; no hace falta recompilar la API):
- [ ] Las 26 pantallas: fondo casi blanco con una línea de color arriba, tarjeta blanca con sombra suave, título
  grande. Consola (F12) sin errores nuevos.
- [ ] Encabezado: nombre, iniciales y menú de usuario (Cambiar contraseña / Cerrar sesión) funcionan igual.
- [ ] Gestionar contenido: cambiar el color de fondo y Guardar → cambia el tono del fondo y la línea; cambiar el
  color del menú → cambia la opción del menú, las iniciales y las pestañas (Tarifas, Orígenes y destinos,
  Grupos, Cuenta corriente). Restablecer → azul de SGTL. Volver a dejar los colores de Transporte Sánchez.
- [ ] Una tabla con muchas filas (Gestionar viajes): paginador con borde, flechas cuadradas, "1-15 de N".
- [ ] Un alta y una edición (por ejemplo camiones): modal sin líneas, Cancelar blanco con borde, Guardar azul;
  aviso de éxito arriba a la derecha como tarjeta blanca con tilde verde.
- [ ] Un error (guardar con un dato mal): aviso blanco con ícono rojo, queda hasta cerrarlo.
- [ ] Eliminar (Cancelar en la confirmación): modal con fondo desenfocado, Eliminar en rojo.
- [ ] Calendario de un filtro de fechas: tarjeta flotante, rango en azul.
- [ ] Login: tipografía igual al resto del sistema.

**Menú y modales (commit "Interfaz: Bootstrap disponible en todas las pantallas"):** la plantilla (`app.js`) se
cortaba al iniciar PerfectScrollbar porque el menú todavía no estaba armado, y por eso no dejaba disponible
`window.bootstrap`: en las pantallas sin jQuery (e-mail, WhatsApp, documentación) los modales y tooltips del
sistema no abrían, y la consola mostraba "no element is specified to initialize PerfectScrollbar" en casi todas.
Se deja de cargar PerfectScrollbar (nunca llegaba a aplicarse) y, en Cuenta corriente y Gestionar facturación, el
menú se arma después de `app.js` como en el resto: antes la plantilla le sumaba su propio clic y los submenús del
menú lateral no abrían.
- [ ] Cuenta corriente y Gestionar facturación: tocar "Choferes" en el menú abre el submenú; tocarlo otra vez lo
  cierra.
- [ ] Cualquier pantalla (F12): sin el error de PerfectScrollbar. El menú se desplaza con la rueda si no entra.
- [ ] Botón de las tres rayas: esconde y muestra el menú igual que antes.

**Viajes (commit "Viajes: design system en gestionar y listar"):** filtros en una fila con su cruz (sin Limpiar),
rango de fechas con flatpickr (sin `daterangepicker` ni `moment`), mismo buscador de clientes que proformas,
tabla con texto a la izquierda, fechas centradas, km a la derecha y Acciones fija a la derecha, "Cargando…",
"No hay resultados…" y paginador oculto sin resultados. Las dos confirmaciones nativas (quitar evidencia y
entregar sin evidencia) pasan a la confirmación del sistema; guardar el estado avisa con un toast. Listar viajes:
detalle "Ver detalle del viaje" en texto y con nombres (antes mostraba números de ID), pie con Cerrar. Se sacan el
script de ejemplo de simple-datatables (error en consola), el `</script>` suelto (R5) y la cruz de Feather de los
modales (quedaba vacía). Un modal de confirmación sobre otro modal queda arriba y, al cerrarse, el de abajo sigue
funcionando (`sgtl-ui.js`).
- [ ] Gestionar viajes: cada filtro (número, fechas, estado, cliente, referencia) muestra la cruz con valor; la cruz
  lo vacía y vuelve a buscar; Enter busca. El rango de fechas busca al elegir las dos fechas.
- [ ] Cliente: escribir parte del nombre filtra la lista; elegir uno busca. Igual en Listar viajes.
- [ ] Tabla con muchas columnas: al desplazarla hacia el costado, Acciones queda fija a la derecha.
- [x] ~~Entregado sin evidencia → "¿Guardar la entrega sin evidencia?"~~: desde el 22/10 la evidencia es obligatoria
  en los directos y ya no pregunta (ver "Viajes: evidencia obligatoria…" al final del §20).
- [ ] Quitar evidencia de un viaje que tenga (con plataforma, o directo que no esté entregado; en un directo entregado
  no aparece desde el 22/10): confirmación "¿Quitar la evidencia…?", Quitar → toast.
- [ ] Exportar en Gestionar y en Listar viajes: baja el CSV con todo lo filtrado.
- [ ] Listar viajes → ojo de una fila: "Ver detalle del viaje" con cliente, origen, destino, chofer y camión por
  nombre; pie Cerrar.

**Proformas (commit "Proformas: design system en gestionar y listar", pantallas de Facu, con el OK de Rocío del
22/10):** Registrar proforma en verde, Exportar solo ícono, filtros en una fila con su cruz y sin Limpiar, un solo
filtro "Fecha" (Desde y hasta) en lugar de Desde / Hasta en AAAA-MM-DD, sin el contador "N resultados" aparte.
Acciones de cada fila con los botones del design system, en el mismo orden y deshabilitadas con el motivo cuando
no aplican: ver, editar, PDF, siguiente paso (Marcar aceptada → Emitir factura) y anular / eliminar. Los 14 + 5
`alert()` / `confirm()` y los modales propios ("Operación realizada", "Confirmar eliminación", "Cambiar estado")
pasan a los avisos y la confirmación del sistema. Fechas del modal (período, carga, entrega) en DD/MM/AAAA con
calendario (siguen guardando AAAA-MM-DD). Modales "Emitir factura" y "Anular factura": calendario del sistema,
textos con mayúscula solo al principio y con tildes. PDF: errores con el aviso del sistema.
- [ ] Gestionar proformas: cada fila muestra 5 botones; en un borrador, Editar y Eliminar habilitados y el siguiente
  paso deshabilitado ("Primero generá la proforma"); en una Generada, Marcar aceptada → confirmación → toast.
- [ ] Una Aceptada → Emitir factura: modal "Emitir factura", fechas DD/MM/AAAA, vencimiento a 10 días. **Solo con
  datos de prueba: consume numeración real.**
- [ ] Anular una proforma Generada: confirmación con el texto de qué pasa → toast "Proforma anulada.".
- [ ] Eliminar un borrador: confirmación → toast "Borrador eliminado.".
- [ ] Registrar proforma: guardar sin cliente → aviso rojo dentro del modal; fechas con calendario.
- [ ] Proforma de Rukas (cliente con plataforma): el período se ve en DD/MM/AAAA después de importar el Excel.
- [ ] Filtro Fecha: elegir un rango busca; la cruz lo borra. Exportar (ícono) abre el modal de Excel / PDF.
- [ ] Listar proformas: ver, PDF y Emitir factura (solo en Aceptadas); el detalle se titula "Ver proforma …".

**Cuenta corriente (commit "Cuenta corriente: design system en la pantalla y sus modales", pantalla de Facu, con
el OK de Rocío del 22/10):** encabezado con Exportar solo ícono, "Emitir comprobante" gris (con "Emitir factura
directa", "Emitir nota de crédito", etc.) y "Registrar recibo" en verde. Filtros con su cruz y sin Limpiar; un solo
filtro "Fecha" (Desde y hasta, entra con los últimos 30 días; la cruz lo deja sin límite) en lugar de los dos
`type="date"`; Buscar gris. Tabla rayada, fechas y estado centrados, estados con las etiquetas del sistema (§4),
ojo gris de "Ver detalle" y Acciones fija a la derecha. Sin el modo oscuro suelto (§10). Los `prompt()`, `confirm()`
y `alert()` de anular y eliminar recibo pasan a la confirmación del sistema (anular pide el motivo dentro del
mismo modal); emitir, guardar y enviar por e-mail avisan con un toast y bloquean Cancelar mientras procesan. Los
errores de los formularios van arriba, en rojo, y no muestran textos técnicos (§9). Fechas de los modales
(emisión, vencimiento, fecha del recibo) en DD/MM/AAAA con calendario (siguen mandando AAAA-MM-DD a la API).
Textos con mayúscula solo al principio ("recibo", "factura", "nota de crédito") y "Seleccioná un cliente".
También: el paginador compartido no se ocultaba sin resultados en ninguna pantalla (`sgtl-ui.js`).
- [ ] Entrar: Fecha muestra los últimos 30 días ("DD/MM/AAAA a DD/MM/AAAA"); la tabla carga. La cruz de Fecha
  muestra todos los comprobantes ("sin límite"). Comprobante y Estado financiero buscan al elegir.
- [ ] Un filtro sin resultados: "No hay resultados para los filtros elegidos." y sin paginador. Lo mismo en
  Gestionar viajes y Gestionar proformas.
- [ ] Una factura con recibo o NC aplicados: la flecha despliega las aplicaciones (celeste) y la columna Acciones
  conserva el color de la fila.
- [ ] Pestaña "Comprobantes sin relacionar": marca la casilla "Solo comprobantes sin relacionar" (y al revés).
- [ ] Registrar recibo: título "Registrar recibo", fecha de hoy en DD/MM/AAAA, Emitir sin cliente → "Seleccioná
  un cliente." arriba en rojo. **Emitir de verdad solo con datos de prueba: consume numeración.** Al emitir:
  toast "Recibo emitido: REC-…".
- [ ] Ojo de un recibo emitido → Editar recibo → cambiar la referencia → Guardar → toast "Recibo … guardado.".
- [ ] Ojo de un recibo emitido → Anular recibo: confirmación encima del detalle con "Motivo de la anulación";
  Anular sin motivo → "Completá el motivo."; con motivo → toast "Recibo anulado." (solo datos de prueba).
- [ ] Un recibo anulado → Eliminar recibo: confirmación → toast "Recibo eliminado." (solo datos de prueba).
- [ ] Emitir comprobante → Emitir nota de crédito: título y botón dicen "Emitir nota de crédito"; sin cliente, la
  factura relacionada dice "Seleccioná un cliente primero".
- [ ] Ojo de una factura → Enviar por e-mail: el botón muestra "Generando PDF…" y "Enviando…"; al terminar se cierra
  y avisa "Comprobante enviado a …" (con un correo de prueba).
- [ ] Exportar (ícono): modal "Exportar" con Vista previa, Excel y PDF; los tres bajan lo filtrado.

**Gestionar facturación (commit "Configuración: design system en Gestionar facturación", pantalla de Facu):**
las filas de sucursales, numeradores y tipos de comprobante usan los botones del sistema (lápiz y el interruptor
Activar / Inactivar, sin confirmación, §5.2) en lugar de "Editar" / "Desactivar" con texto y `confirm()`; el
interruptor también reactiva (vuelve a guardar el registro con Activo). El aviso fijo de arriba pasa a toasts. Los
formularios validan como el resto (campo en rojo con "Completá el código.") en lugar del globito del navegador,
con asterisco rojo y "Seleccioná una sucursal". Tablas rayadas con Estado y Acciones centrados, "Todavía no hay …
cargadas." y errores sin textos técnicos.
- [ ] Guardar una sucursal sin datos: Código y Nombre en rojo con su mensaje; el cursor va a Código.
- [ ] Interruptor de una sucursal activa → toast "Sucursal inactivada." y la etiqueta pasa a Inactivo; otra vez →
  "Sucursal activada.". Igual con un numerador y un tipo de comprobante (con datos de prueba).
- [ ] Lápiz de un tipo de comprobante: carga el formulario con el código bloqueado; la cruz gris lo limpia.
- [ ] Guardar con un código repetido: toast rojo con el mensaje de la API.

**Gestionar e-mail (commit "Configuración: design system en Gestionar e-mail", pantalla de Facu):** "Registrar
configuración de e-mail" en verde (antes "Nueva configuración"), mismo título en el modal. Filas con lápiz, "Probar
conexión" (sobre) y tacho, Acciones fija a la derecha. Avisos con toasts; eliminar con la confirmación del sistema
(se saca el modal propio); el formulario valida como el resto (la contraseña es obligatoria solo al registrar).
"Probar conexión": el resultado bueno cierra el modal y avisa con un toast; el error queda dentro del modal. Las
asignaciones a facturación y presupuestos muestran una nota con el perfil asignado y avisan con un toast al
guardar. Textos con mayúscula solo al principio y sin errores técnicos. Antes se cargaba `sgtl.css` antes que
`iconly.css` y no se cargaba `sgtl-ui.js`.
- [ ] Registrar configuración de e-mail → Guardar vacío: "Revisá los campos marcados." y los cinco campos en rojo.
- [ ] Lápiz: "Editar configuración de e-mail", contraseña sin asterisco ("Dejá este campo vacío para conservarla");
  Guardar → toast "Configuración de e-mail guardada.".
- [ ] Sobre de una fila → "Probar conexión" con un e-mail propio: toast "Correo de prueba enviado a …". Con un
  servidor mal cargado: el error queda dentro del modal.
- [ ] Tacho de un perfil asignado: la confirmación muestra el motivo de la API dentro del modal ("No se puede
  eliminar este perfil…").
- [ ] Asignar a facturación sin elegir perfil: el desplegable en rojo; con perfil → toast y la nota se actualiza.

**Gestionar integración de WhatsApp (commit "Configuración: design system en WhatsApp", pantalla de Fede, con el
OK de Rocío del 22/10):** "Token de acceso" e "ID del número de teléfono" con el nombre de Meta en la ayuda (§9);
guardar con la ruedita y un toast en lugar del aviso fijo; la última modificación en DD/MM/AAAA HH:MM; sin el
detalle técnico de la excepción en los errores; carga `sgtl-ui.js`; sin el ancho máximo ni los colores propios.
- [ ] Entrar: carga la configuración actual; "Última modificación" en DD/MM/AAAA HH:MM · usuario.
- [ ] Guardar → toast "Configuración de WhatsApp guardada.". Con la API apagada → toast rojo "No se pudo conectar…".

**Login (commit "Login: avisos y errores como el resto del sistema"):** el aviso rojo propio (Bootstrap 5.1 por
CDN, solo para eso) pasa al aviso del sistema; "Completá el usuario." / "Completá la contraseña." con el campo en
rojo; "Entrar" muestra la ruedita mientras valida. Si no carga la apariencia (logo y colores) ya no avisa "Ocurrió
un error al iniciar sesión": el login sigue con la marca SGTL y solo avisa si no hay conexión. Se sacan dos
`console.log` que mostraban en la consola el usuario con la contraseña y la respuesta con el token.
- [ ] Entrar vacío: los dos campos en rojo con su mensaje y el cursor en Usuario.
- [ ] Usuario o contraseña incorrectos: el mensaje de la API debajo del campo (igual que antes).
- [ ] Con la API apagada: aviso rojo arriba a la derecha "No se pudo conectar con el servidor…".
- [ ] F12 al entrar: la consola ya no muestra la contraseña.

**Presupuestos (commit "Presupuestos: design system en la pantalla y sus modales"):** avisos de la pantalla con
toasts (antes un aviso fijo arriba de la tabla) y errores de cada modal arriba, dentro del modal; tabla rayada con
fecha DD/MM/AAAA centrada, km e importe a la derecha, "Cargando…" y "Todavía no hay presupuestos cargados." / "No
hay resultados…"; Acciones fija a la derecha. Filtro con su cruz. Fechas y horas de inicio y fin con el calendario
del sistema (DD/MM/AAAA HH:MM; siguen guardando AAAA-MM-DDTHH:MM). El formulario valida como el resto, con asterisco
rojo y "Seleccioná un cliente" (antes "Seleccione"). "Ver PDF" en lugar de "Imprimir / PDF", con Imprimir y Descargar
PDF en el pie; "Enviar por e-mail" cierra el modal y avisa con un toast; Generar viaje pide el chofer en rojo.
Botones "+" de alta rápida con el ícono del sistema. `sgtl-ui.js`: el error de un campo con calendario se ve en el
campo visible, y el de un campo con botón (input-group) va debajo del grupo. API: "Completá cliente, origen y
destino." e "Ingresá un importe válido." (antes "Complete" / "Ingrese"); **hay que recompilar la API**.
- [ ] Registrar presupuesto → Guardar vacío: "Revisá los campos marcados." y cada campo obligatorio en rojo,
  también las dos fechas.
- [ ] Fechas: el calendario elige día y hora; se ven DD/MM/AAAA HH:MM. Con tarifa por km, cambiar una fecha recalcula.
- [ ] Editar un presupuesto pendiente: las fechas aparecen cargadas en DD/MM/AAAA HH:MM; Guardar → toast.
- [ ] Ojo de PDF: "Ver PDF del presupuesto #N" con Imprimir y Descargar PDF.
- [ ] Sobre: "Enviar por e-mail el presupuesto #N"; Enviar con un correo de prueba → se cierra y avisa.
- [ ] Cambiar el estado a Aceptado → toast; Generar viaje sin chofer → el desplegable en rojo; con chofer → toast
  "Viaje #N generado." (**solo con datos de prueba: crea un viaje real**).

**Documentación (commit "Documentación: design system en manual e informe de versión"):** los errores ya no
muestran textos técnicos (antes el manual podía mostrar "Cannot read properties of undefined…") y van con el aviso
del sistema; "Cargando…" en gris; fechas con la función del sistema. Informe de versión: tabla rayada, Fecha
centrada y columna "Acciones" con el ojo "Ver informe" (antes un botón con texto en "Documento"). "Descargar PDF"
azul con ícono. Cargan `sgtl-ui.js`.
- [ ] Consultar manual de usuario: "Publicado el DD/MM/AAAA." y el PDF a la vista; Descargar PDF baja el archivo.
- [ ] Consultar informe de versión: la lista con el ojo; tocar otra versión cambia el PDF de abajo.
- [ ] Con la API apagada: aviso rojo arriba a la derecha, sin textos en inglés.

**Dashboard (commit "Dashboard: opción activa del menú y restos de la plantilla"):** la opción "Dashboard" del menú
no se marcaba nunca como activa (el logo, que también apunta a `index.html`, se llevaba la marca; arreglado en
`sidebar-loader.js`). Se saca el botón "Toggle navigation" que solo tenía esta pantalla y el borde punteado de
"Personalizar" pasa al azul del sistema. `moment` queda solo porque lo usa FullCalendar 3 (§7.1).
- [ ] Dashboard: la opción "Dashboard" del menú aparece marcada.
- [ ] El calendario de próximos viajes se ve y cambia de mes; Personalizar → bordes punteados azules.

**Repaso final (22/10):**
- Proformas (commit "Proformas: últimos detalles del design system"): modal "Exportar" sin ícono en el título y
  Excel en gris (el verde es solo para crear, §11), igual que en cuenta corriente; "Agregar línea" gris con borde;
  duplicar y quitar línea con el globito del sistema; "Descartar cambios" en rojo; "Seleccioná un cliente"; el
  formulario de la proforma no se cierra con un clic afuera (§6.2); la fecha del reclamo de Rukas con calendario.
- Viajes (commit "Viajes: fechas del modal en DD/MM/AAAA"): inicio, fin y entrega se veían y escribían
  AAAA-MM-DD; ahora DD/MM/AAAA (HH:MM) con el calendario en español, y quedan bloqueadas junto con el resto del
  formulario cuando el viaje no se puede editar.
- Rango de fechas (commit "Interfaz: el rango de fechas busca al cerrarlo"): cuenta corriente era la única
  pantalla donde elegir el rango no buscaba; ahora busca al cerrar el calendario como viajes, proformas y el
  dashboard (§7.1 actualizado: **cambio de la decisión del 17/10, a confirmar por Rocío**).
- [ ] Gestionar proformas → Exportar: título "Exportar", Excel gris y PDF azul. Igual en Listar proformas.
- [ ] Registrar proforma: clic afuera del modal no lo cierra; Escape o la cruz sí (con el aviso de cambios sin
  guardar si los hay).
- [ ] Rukas → Registrar reclamo: la fecha se elige con el calendario y se ve DD/MM/AAAA.
- [ ] Gestionar viajes → Registrar viaje: fechas de inicio y fin en DD/MM/AAAA HH:MM; editar un viaje existente
  las muestra igual; con tarifa por km, cambiar una fecha recalcula. Cambiar estado (banderita): fecha de entrega DD/MM/AAAA.
- [ ] Cuenta corriente: elegir un rango en Fecha y cerrar el calendario → busca.
- Títulos (commit "Interfaz: ícono de la sección en el título de cada pantalla"): §3.2 pedía el ícono de la
  sección del menú a la izquierda del título y solo lo tenían tres pantallas de configuración, con íconos
  distintos (sobre, recibo, WhatsApp). Ahora las 24 pantallas con menú lo tienen, igual al del menú (engranaje en
  configuración).
- [ ] Recorrer el menú: cada título lleva el mismo ícono que su sección del menú.
- Barra de arriba (commit "Interfaz: se saca el botón oculto de la plantilla"): 15 pantallas traían un botón de
  Mazer ("Toggle navigation", en inglés) que nunca se mostraba; se saca de todas, como en el dashboard.
- [ ] El botón de las tres rayas y el menú de usuario siguen funcionando en cualquier pantalla.

### Quedó sin tocar en el repaso del 22/10 — RESUELTO EL MISMO 22/10 (FALTA PROBAR EN VM); LAS CONTRASEÑAS, CON EL MERGE DE FACU (§21)

- [x] **Mensajes de la API de Facu con mayúscula en el medio** (§9 del design system), por ejemplo "Solo se pueden
  anular Recibos emitidos.". **Hecho (22/10, commit "Facturación: mensajes de la API como el resto del sistema",
  pedido por Rocío; módulo de Facu: avisarle):** 80 mensajes en `RecibosController.cs`, `ComprobantesController.cs`,
  `FacturasController.cs`, `FacturacionConfiguracionController.cs`, `EnviosPresupuestosController.cs` y
  `EnviosComprobantesController.cs`: mayúscula solo al principio ("recibo", "factura", "nota de crédito"), voseo
  ("No tenés permiso…", "Volvé a abrirla…" en lugar de "No tiene…", "Vuelva…"), tildes ("crédito", "válido"), sin
  nombres de campos técnicos ("ClaveOperacion es obligatoria." → "Falta la clave de la operación…",
  "FechaEmision y FechaVencimiento…" → "Completá la fecha de emisión y la de vencimiento."), "No se guardó ningún
  cambio." en lugar de "Ningún cambio fue confirmado." y las rutas del menú nuevas ("Configuración > Gestionar
  e-mail"). Los textos que se guardan en la base (conceptos, auditoría) no se tocaron. Además, Gestionar
  facturación devolvía el texto de cualquier excepción: ahora solo los de validación; un código repetido dice "Ya
  existe un registro con ese código." y el resto, "No se pudo completar la operación. Probá de nuevo.".
  **Hay que recompilar la API.**
  - [ ] Probar en la VM: en cuenta corriente, Registrar recibo de un cliente de prueba, marcar una factura y poner
    una fecha anterior a la de esa factura → Emitir: la API lo rechaza (no se emite nada) y arriba del formulario
    sale "La fecha del recibo no puede ser anterior al comprobante aplicado." En Gestionar facturación, registrar
    una sucursal con un código que ya existe → toast con el mensaje de la API (o "Ya existe un registro con ese
    código."), nunca un texto técnico.
- [x] **SheetJS (`xlsx@0.18.5`) tenía vulnerabilidades conocidas** (contaminación de prototipo al leer un archivo y
  una expresión regular que se puede trabar). **Hecho (22/10, commit "Interfaz: SheetJS 0.20.3 en una copia
  local"):** se copió la 0.20.3 de `cdn.sheetjs.com` a `assets/extensions/sheetjs/xlsx.full.min.js` (decisión de
  Rocío: copia local, como flatpickr) y `cuenta-corriente-clientes.html`, `gestion-facturacion.html` y
  `listado-facturas.html` la cargan de ahí. En la Mac: exportar el Excel de cuenta corriente y leer el Excel de
  Rukas de `docs/pruebas/datos/` funcionan igual.
  - [ ] Probar en la VM: Exportar → Excel en cuenta corriente y en las dos pantallas de proformas; en un borrador
    de Rukas, importar uno de los Excel de `docs/pruebas/datos/` (con datos de prueba).
- [x] **"Cambiar contraseña" del menú de usuario no hacía nada** (R4 de §10). **Hecho (22/10, commit "Usuarios:
  ventana para cambiar la contraseña"):** la API ya tenía `POST api/Usuarios/CambiarContrasena` (usuario,
  contraseña actual y nueva: de 8 a 20 caracteres, con letras y números, distinta de la actual) y faltaba la
  pantalla. Ahora la opción abre "Cambiar contraseña" (actual, nueva y repetir), con las mismas reglas, la
  validación del sistema. Al terminar avisa "Contraseña cambiada. Volvé a iniciar sesión con la nueva." y a los
  2,5 segundos cierra la sesión (decisión de Rocío, 22/10: así se confirma que se sabe la nueva; una sesión abierta
  en otra computadora sigue hasta que vence el token). La API pasa sus mensajes a voseo ("tiene que tener…"):
  **hay que recompilar**. El código por WhatsApp (§15) sigue como mejora para después.
  - [ ] Probar en la VM: menú del usuario → Cambiar contraseña → Guardar vacío (los tres campos en rojo); una
    nueva corta o sin números (mensaje debajo del campo); actual incorrecta ("La contraseña actual es
    incorrecta." arriba del formulario); con datos correctos → toast, vuelve solo al login y se entra con la
    nueva. **Usar un usuario de prueba**, no el de Rocío ni los del equipo.
- [x] **Las contraseñas se guardan sin cifrar** (hallazgo del 22/10, seguridad). **Resuelto con el merge de Facu del 22/10
  (§21): hash PBKDF2, falta probar en la VM.** `USUARIOS.Contraseña` tiene el
  texto tal cual: el login y el cambio de contraseña lo comparan directo en la consulta. Lo correcto es guardar un
  hash con sal (por ejemplo PBKDF2, que trae .NET Framework) y comparar el hash. Implica: cambiar el login, el
  alta y edición de usuarios y el cambio de contraseña; un script en `database/usuarios/` y un paso para pasar las
  contraseñas actuales a hash (o pedir a cada uno que la cambie). Es trabajo aparte, conviene hablarlo con el
  equipo antes de la entrega.
- [x] **El filtro de Presupuestos no tenía botón "Buscar"** (filtraba mientras se escribía). **Hecho (22/10,
  commit "Presupuestos: filtro con Buscar, como el resto"):** decisión de Rocío, igual que las demás pantallas:
  filtra con Buscar o Enter y se borra con la cruz.
  - [ ] Probar en la VM: escribir parte de un cliente no filtra hasta tocar Buscar o Enter; la cruz vuelve a
    mostrar todos; un texto que no está → "No hay resultados para los filtros elegidos.".

### Presupuestos: filtros, paginación y cambio de estado (22/10) — APROBADO POR ROCÍO Y PUSHEADO, FALTA PROBAR EN VM

Commit "Presupuestos: filtros, paginación y cambiar estado con la banderita". Pedido de Rocío: que la pantalla
siga la misma estructura que las demás. Rocío lo simuló en la Mac con la API falsa y aprobó la banderita (22/10).
- **Filtros:** Número (exacto), Cliente (buscador de clientes), Fecha (rango), Estado y Origen o destino, con
  Buscar y la cruz en cada uno (antes había un solo campo que buscaba en todo). **Paginación** de a 15.
- **Estado como etiqueta de color:** Pendiente gris (espera la respuesta; no es deuda), Aceptado amarillo hasta
  generar el viaje y verde después, Rechazado rojo; el viaje generado va como etiqueta "Viaje #N" debajo del estado
  (antes había un desplegable de estado dentro de la tabla y una columna Viaje).
- **Botones de cada fila:** Editar · Ver PDF · Cambiar estado (banderita, nuevo) · Generar viaje · Eliminar.
  "Enviar por e-mail" pasa al pie de "Ver PDF" (como en el detalle de cuenta corriente), así son cinco botones
  como en proformas y la tabla entra a 1366 px. Origen y destino van en una columna "Ruta".
- **Ventana "Cambiar estado":** resumen del presupuesto, estado actual y los estados posibles como tarjetas con
  su explicación; Cancelar + Guardar; si no se elige ninguno, "Elegí el estado nuevo.". Usa el mismo
  `PUT Presupuestos/{id}/estado` de antes. Propuesta para usar después en viajes.
- [ ] Probar en la VM: filtrar por cada campo; cambiar un presupuesto Pendiente a Aceptado (toast "Presupuesto #N
  aceptado.") y después Generar viaje (**con datos de prueba: crea un viaje real**); uno Aceptado sin viaje
  puede volver a Pendiente; uno con viaje tiene la banderita deshabilitada; Ver PDF → Enviar por e-mail abre el
  envío.

### Filtros iguales en todas las pantallas (22/10) — PUSHEADO, FALTA PROBAR EN VM

Commit "Interfaz: filtros iguales en todas las pantallas". Revisión de las 18 pantallas con filtros y regla
elegida por Rocío (opción A), escrita en §1.3 y §3.3 del design system:
- **Cuándo busca solo:** los desplegables buscan al elegir y el rango de fechas al cerrar el calendario; el texto,
  con Enter o Buscar. **Buscar queda en todas.** Se suman al comportamiento: estado en choferes, camiones,
  clientes y usuarios; entidad y acción en auditoría; tipo en las dos de proformas; rango en choferes, camiones,
  clientes y auditoría.
- **Mismos filtros en Listar y Gestionar:** Gestionar choferes suma Nombre y Apellido; Gestionar usuarios, Nombre
  y Apellido; Listar viajes, Número, Estado y N° remito; Listar proformas, Tipo (usan la misma API).
- **Mismo orden:** número o identificador → cliente o persona → fechas → estado → tipo → texto libre (proformas
  Número · Cliente · Fecha · Estado · Tipo · Usuario; viajes Número · Cliente · Fecha de inicio · Fecha de fin ·
  Estado · N° remito; cuenta corriente Cliente · Fecha · Estado financiero · Comprobante; auditoría Usuario ·
  Fecha · Entidad · Acción · Buscar en el detalle).
- **Mismo ancho:** cuatro campos por fila en todas (antes había de 2, 3 y 4 columnas mezclados).
- **Textos:** "Número" (antes "Número de viaje"); ejemplos en lugar del nombre del campo ("jperez", "PF-00000010").
- **Cuenta corriente:** se saca la casilla "Solo comprobantes sin relacionar" (repetía la pestaña).
- **Orígenes y destinos y Tarifas** (ya tenían paginación) suman filtros en cada pestaña: Cliente y Descripción o
  dirección; tarifas fijas Cliente, Vigencia (vigentes en algún día del rango) y Origen o destino; tarifas por km
  Vigencia y Km del viaje (las que cubren esa distancia). "Registrar …" va al lado de Buscar, como en Grupos.
- **Rango de fechas a 1280 px:** "DD/MM/AAAA a DD/MM/AAAA" no entraba completo; en pantallas de menos de 1366 px
  la letra del rango elegido se achica apenas (`sgtl.css`).
- [ ] Probar en la VM, en cada pantalla con filtros: elegir un estado o un tipo busca solo; escribir en un campo
  de texto no busca hasta Enter o Buscar; elegir un rango busca al cerrar el calendario; cada cruz borra y busca.
- [ ] Gestionar choferes y Gestionar usuarios: Nombre y Apellido filtran. Listar viajes: Número, Estado y
  N° remito filtran. Listar proformas: Tipo filtra.
- [ ] Orígenes y destinos: filtrar por cliente y por una parte de la dirección (sin tildes también encuentra).
  Tarifas fijas: cliente, vigencia y origen o destino; tarifas por km: escribir 250 muestra solo las que cubren
  250 km.
- [ ] A 1280 px (o con el navegador más angosto) el rango de fechas elegido se lee completo.

### Banderita gris en viajes (22/10) — commit "Viajes: banderita de estado en gris, como en presupuestos" (`006bdce`), PUSHEADO, FALTA PROBAR EN VM

Decisión de Rocío: la banderita (cambiar estado) es gris en todo el sistema; el verde queda para el paso puntual
del circuito (Marcar aceptada, Emitir factura, Generar viaje), uno por fila. En Gestionar viajes la banderita era
verde: pasa a gris con el botón compartido de presupuestos. Sigue abriendo el mismo modal "Estado y entrega del
viaje"; rehacerlo con la ventana de tarjetas de presupuestos queda para cuando se normalice viajes.
- [ ] Gestionar viajes: la banderita de cada fila es gris (tooltip "Cambiar estado") y abre la ventana de tarjetas
  (sección siguiente).
- [x] Pasar el modal "Estado y entrega del viaje" a la ventana de tarjetas: hecho en la sección siguiente.

### Viajes: "Cambiar estado" con la ventana de tarjetas (22/10) — commit "Viajes: cambiar estado con la ventana de tarjetas" (`7bd5ffe`), PUSHEADO, FALTA PROBAR EN VM

El modal "Estado y entrega del viaje" (desplegable de estado + campos sueltos) pasa a la misma ventana "Cambiar
estado" de presupuestos (§1.4 del design system). Misma API de antes (`POST Viajes/{id}/Estado` y
`Viajes/{id}/Evidencia`); no hay cambios en C# ni en la base.
- **Tarjetas:** solo el estado anterior y el siguiente del circuito del viaje (directo: Registrado · En viaje ·
  Entregado; con plataforma: Registrado · Listo para facturar), cada uno con su explicación. Facturado no aparece
  (lo pone la factura).
- **Entregado (directo):** resultado, fecha y evidencia van dentro de la tarjeta y se ven al elegirla. Resultado
  y fecha obligatorios, marcados en rojo con su mensaje; la fecha no puede ser anterior al inicio del viaje: en
  el calendario esos días aparecen grises y no se eligen; escrita a mano, queda en rojo con "No puede ser anterior
  al inicio del viaje (DD/MM/AAAA)." (antes se borraba sin aviso). La evidencia pasa a obligatoria en el commit siguiente (sección siguiente).
- **Listo para facturar (con plataforma):** resultado y fecha **opcionales** dentro de la tarjeta (lo que diga
  Rukas; el dashboard los usa para "Parcial" y "Con rechazo"). **Evidencia opcional (nuevo):** antes no se
  ofrecía; la ayuda aclara que la constancia ya está en Rukas y se adjunta para tener el viaje completo en SGTL.
  No pregunta "¿Guardar sin evidencia?" ni el dashboard la reclama. Si al viaje le falta
  N° transporte SAP, remito, N° entrega Rukas o tarifa, la tarjeta aparece gris con lo que falta (antes se veía
  recién al guardar).
- **Viaje ya entregado (o ya listo para facturar):** arriba aparece "Datos de la entrega" para completarlos o
  corregirlos (o adjuntar la evidencia después) sin cambiar el estado; "Pasa a" es opcional. Si elige volver a
  un estado anterior, los campos quedan grises y **se borran el resultado y la fecha** (antes quedaban guardados
  en un viaje que volvía a En viaje o a Registrado). La evidencia no se borra.
- **Banderita:** tooltip "Cambiar estado"; deshabilitada con el motivo si el viaje está facturado o en una
  proforma emitida (antes abría el modal y la API lo rechazaba).
- **Avisos:** "Viaje #N en viaje.", "Viaje #N entregado.", "Viaje #N listo para facturar.", "Viaje #N vuelve a
  registrado.", "Datos de la entrega del viaje #N guardados.".
- **Listar viajes:** el detalle suma "Evidencia de la entrega" con el enlace "Ver evidencia adjunta".
- [ ] Probar en la VM con un viaje directo **de prueba**: Registrado → En viaje; En viaje → Entregado sin
  completar nada (resultado, fecha y evidencia en rojo, "Revisá los campos marcados."); completar y adjuntar una
  foto o PDF; abrirlo de nuevo: "Datos de la entrega" arriba, cambiar la fecha y guardar sin
  elegir estado; elegir En viaje y volver a tocarla (se desmarca); volver a En viaje y ver en Listar viajes que el
  resultado y la fecha quedaron vacíos.
- [ ] Viaje con plataforma de prueba: sin N° entrega Rukas la tarjeta "Listo para facturar" está gris con el
  motivo; con los números, pasa con o sin resultado, fecha y evidencia (todo opcional; con evidencia aparece el
  clip en la tabla y el enlace en Listar viajes); abrirlo de nuevo muestra
  "Datos de la entrega" arriba; vuelve a Registrado y el resultado queda vacío. Un viaje facturado tiene la
  banderita deshabilitada.
- [ ] Listar viajes → Ver detalle de un viaje con evidencia: el enlace la abre.
- [ ] Fecha de entrega: en el calendario, los días anteriores al inicio del viaje están grises y no se pueden
  elegir; escribir a mano uno de esos días y salir del campo → queda escrito, en rojo, con el motivo.

### Viajes: evidencia obligatoria al entregar un viaje directo (22/10) — commit "Viajes: evidencia obligatoria al entregar un viaje directo" (`e40db60`), PUSHEADO, FALTA COMPILAR Y PROBAR EN VM

Decisión de Rocío (cierra la pregunta 4 de `docs/design-system/04-relevamiento-funcional.md`): en un viaje directo
SGTL es la única constancia de la entrega; sin el adjunto, "Entregado" depende solo de que alguien lo marque. La
evidencia es el remito: firmado con el resultado (completa o parcial) o, en un rechazo, con la nota del cliente
("no recibo conforme"). Es obligatoria con **cualquier resultado**, también Rechazo. Con plataforma sigue opcional.
- **API (`ViajesController`, hay que compilar):** `POST Viajes/{id}/Estado` rechaza pasar (o dejar) un viaje
  directo en Entregado sin evidencia: "Para marcar el viaje como entregado adjuntá la evidencia de la entrega
  (remito firmado o con la nota de rechazo).". `DELETE Viajes/{id}/Evidencia` no deja quitarla de un directo
  entregado ("…para cambiarla, subí otra."); subir otra la reemplaza, como antes. La pantalla sube la evidencia
  antes de cambiar el estado, así que la API ya la encuentra.
- **Pantalla:** la evidencia lleva `*` y se marca en rojo si falta ("Adjuntá el remito firmado (o con la nota de
  rechazo)."); ayuda "Foto o PDF del remito firmado, o con la nota de rechazo."; se va la pregunta "¿Guardar la
  entrega sin evidencia?"; en un directo entregado no está "Quitar" (dice "Para cambiarla, elegí otro archivo.").
- **Viajes ya entregados sin evidencia:** siguen así hasta que alguien los abra; para corregirles algo hay que
  adjuntarla. El dashboard los sigue marcando "Sin evidencia". Para ver cuántos hay (solo lectura):
  ```sql
  SELECT v.Viaje_ID, c.Razon_Social, v.Fecha_Inicio, v.Fecha_Entrega
  FROM VIAJES v LEFT JOIN CLIENTES c ON c.Cliente_ID = v.ClienteID
  WHERE v.Estado = 'Entregado' AND ISNULL(c.Tipo_Cliente, 'Directo') <> 'Con_plataforma'
    AND NOT EXISTS (SELECT 1 FROM VIAJE_EVIDENCIA e WHERE e.Viaje_ID = v.Viaje_ID)
  ORDER BY v.Viaje_ID;
  ```
  **Corrida por Rocío el 22/10: uno solo**, el #38 (Servicios Ambientales S.A., 21/10/2026, Completa, sin remito,
  chofer Godoy, Facundo, sin proforma): se completa desde la banderita. Ninguno quedó en una proforma emitida
  (ahí la banderita está deshabilitada y no se podría adjuntar), así que no hace falta habilitar la evidencia
  en esos casos. De ahora en adelante no puede pasar: un directo no llega a Entregado sin evidencia.
- **Facturación (de Facu, sin tocar):** esos viajes viejos todavía entran en "Traer viajes". Si se quiere, Facu
  puede sumar un aviso "sin evidencia"; hablarlo con él.
- [ ] **Preguntar a Claudia:** cuando una entrega se rechaza, ¿el remito vuelve igual (con la firma o una nota
  del cliente, tipo "no recibo conforme") o vuelve otro papel? Si a veces no vuelve nada, decidir si el rechazo
  queda como excepción.
- [ ] Probar en la VM (recompilar la API; Ctrl+F5), con un viaje directo **de prueba** en En viaje: elegir
  Entregado y Guardar sin adjuntar: la evidencia en rojo con su mensaje, no guarda. Con resultado Rechazo, fecha y
  una foto: guarda ("Viaje #N entregado.") y aparece el clip.
- [ ] Abrirlo de nuevo: no está "Quitar", la ayuda dice "Para cambiarla, elegí otro archivo."; elegir otro archivo
  y guardar lo reemplaza (el enlace abre el nuevo).
- [x] Viaje #38 (directo entregado sin evidencia): abrir la banderita, cambiar la fecha sin adjuntar → evidencia
  en rojo; adjuntar una imagen o PDF → guarda y aparece el clip. **Probado por Rocío en la VM el 22/10: OK.** Ya no
  queda ningún directo entregado sin evidencia.
- [ ] Un viaje con plataforma: la evidencia sigue opcional y "Quitar" está.

---

## 21. Merge de Facu del 22/10 (`e0779bf`) en `rocionuvoli` — HECHO, SIN PUSH NI PRUEBA EN VM (22/10)

Cuatro commits de Facu (`4edf511`, `634a097`, `9ead168`, `e0779bf`) armados sobre `e44f9b6` (21/10), antes del estilo
visual y del design system en sus pantallas. Chocaron 14 archivos; Rocío decidió cada punto. Criterio: **la lógica de
Facu, el diseño nuestro**. Resumen para el equipo: `docs/equipo/merge-facugodoy-2026-10-22.md`.

**La base — ya aplicado, nada para correr:**
- `database/seguridad/01_ampliar_contrasena_usuarios.sql` (contraseña de 50 a 255): ya estaba corrido (`max_length` 510,
  verificado por Rocío el 22/10). Hay 11 usuarios activos y 1 inactivo (FFAVARO, no se usa: con el merge ya no entra).
- `database/cuenta-corriente/10_notas_credito_multiples_aplicaciones.sql`: **corrido por Rocío el 22/10** (la restricción
  `CK_CC_COMP_Referencia` ya no exige una factura de referencia en toda NC).

**Ojo, base compartida:** cada usuario que entra con la API nueva queda con la contraseña en hash y desde ahí **no entra
con una API sin este merge** (`main`, `fedemontenegro`, la VM antes del pull). FGODOY ya está así. Avisarle a Fede y
pasar el merge a las ramas del equipo juntas.

**Decisiones de Rocío (22/10):**
1. **Seguridad (de Facu):** contraseñas con hash PBKDF2 que se convierten solas al entrar; el login dice siempre
   "Usuario o contraseña incorrectos." y solo deja entrar a usuarios activos; la API de cambio de contraseña toma el
   usuario del token; alta y edición de usuarios con la regla de 8 a 20 caracteres. **La ventana de cambiar contraseña
   es la nuestra** (cierra la sesión al cambiarla), adaptada a su API: no manda el usuario y con la sesión vencida va al
   login. Se sacó la de Facu de `views/header.html`.
2. **Cuenta corriente:** de Facu, "Distribuir" en recibo y NC (por vencimiento), NC sobre varias facturas, montos
   1.234,56 (`SGTL.montoCentavos` y compañía en `sgtl-ui.js`), arreglo del menú lateral. **Botones de la fila: cuatro
   en todas** (Ver detalle · Editar · Ver PDF · Anular o Eliminar), deshabilitados con el motivo; "Enviar por e-mail"
   en el pie de Ver PDF, como en presupuestos. **El ojo abre la vista completa de Facu** en solo lectura, sin agregarle
   nada (el detalle chico queda solo para tipos que no sean factura, recibo o nota). Textos y títulos nuestros (§6.1);
   ventanas de emisión extra grandes y con el alto del recibo, como las dejó Facu; anular y eliminar con la
   confirmación del sistema; sus mensajes nuevos, en pantalla y en la API, con minúscula ("factura", "nota de crédito").
3. **Presupuestos:** mapa de Google y km automáticos (de Facu). **Sin la distancia de Google no se guarda** (opción A),
   con dos mensajes: si no encuentra la dirección, "Corregí la dirección en Orígenes y destinos para poder guardar el
   presupuesto."; si falla Google, "Probá de nuevo más tarde". **Fecha y hora en un solo campo** (el nuestro, §7.1), no
   los campos de hora separados de Facu; el tiempo estimado se calcula solo con inicio y fin (de Facu).
4. **Facturación:** proformas propias y de Rukas con un solo campo "Observaciones" (las observaciones comerciales y
   condiciones particulares viejas se ven ahí; el tiempo del servicio deja de verse: había una sola proforma con ese
   dato y era de prueba); el PDF de la factura lista sus proformas; la pantalla pasa a **"Gestionar tipos de
   comprobante"** (idea de Facu, con verbo por §3.1) en el menú, el título, la pestaña y el mensaje de la API; la
   ventana "Emitir factura" desde una proforma queda con nuestro título y el tamaño de Facu.

**Pruebas automáticas:** las 15 de JavaScript de `tests/` pasan; la de PowerShell (`contrasenas-seguras.test.ps1`)
queda para la VM. En la Mac no hay Node: se corrieron con el JavaScriptCore de macOS
y un adaptador mínimo (fuera del repo); antes se comprobó que con ese adaptador pasan todas en la rama de Facu. Se
adaptaron a las decisiones de arriba: `cambiar-contrasena-header`, `emision-comprobantes`, `impresion-comprobantes`,
`recibos-asociados`, `presupuestos-mapa-horarios`, `facturacion-proforma` y `tipos-comprobantes-menu`. **La API no se
pudo compilar en la Mac.**

**Cómo probar en la VM** (`git pull` → **recompilar la API**: cambiaron `AutenticacionController`, `UsuariosController`,
`ComprobantesController`, `FacturasController`, `ProformasController`, `ProformasPlataformaController` y
`FacturacionConfiguracionController`; se agregó `Security/ContrasenasSeguras.cs` y se borró `LoginController.cs` → Ctrl+F5):
- [ ] La API compila sin errores.
- [ ] Login con usuario o contraseña mal → "Usuario o contraseña incorrectos." (no dice cuál). Entrar con un usuario
  de prueba → entra; volver a entrar → entra. En la base su contraseña empieza con `PBKDF2-SHA256$` (consulta de solo
  lectura: `SELECT Nombre_Usuario, LEFT(Contraseña, 14) FROM dbo.USUARIOS WHERE Nombre_Usuario = '<usuario>';`).
- [ ] Cambiar contraseña (menú del usuario): la actual mal → aviso dentro de la ventana; una nueva sin números → error
  en el campo; bien → toast "Contraseña cambiada. Volvé a iniciar sesión con la nueva." y vuelve al login; entra con la nueva.
- [ ] Gestionar usuarios: alta con contraseña "abc" → mensaje de 8 a 20 caracteres con letras y números; editar sin
  tocar la contraseña → la conserva.
- [ ] Cuenta corriente, botones de la fila: en una factura, Ver detalle y Ver PDF activos, Editar y Anular grises con el
  motivo; en un recibo emitido, los cuatro activos; en uno anulado, Eliminar en lugar de Anular. Mismo lugar en todas
  las filas, también en las aplicaciones desplegadas.
- [ ] El ojo de una factura, una NC y un recibo → la vista completa en solo lectura ("Ver factura FAC-…"), fechas
  DD/MM/AAAA, solo Cerrar. Después, "Emitir factura directa" abre el formulario vacío y editable.
- [ ] Ver PDF → "Ver PDF del comprobante FAC-…" con Cerrar · Enviar por e-mail · Imprimir · Descargar PDF; "Enviar por
  e-mail" cierra el PDF y abre el envío.
- [ ] Editar recibo desde la fila → abre el recibo. Anular → confirmación del sistema con motivo → "Recibo anulado.".
  Eliminar uno anulado → "Recibo eliminado.".
- [ ] Registrar recibo de un cliente de prueba con varias facturas: importe 500000 → al salir del campo "500.000,00";
  Distribuir → reparte desde la que vence primero; se puede corregir a mano.
- [ ] Emitir nota de crédito → grilla de facturas con saldo e importe total; Distribuir y emitir sobre dos facturas → baja
  el saldo de las dos. La NC que anula la factura de una proforma sigue como antes (una factura, por el total).
- [ ] Menú lateral en Cuenta corriente y Gestionar tipos de comprobante: tocar "Choferes" abre el submenú y otra vez lo
  cierra (es el mismo punto de §20).
- [ ] Presupuestos: elegir origen y destino → el mapa dibuja la ruta y completa la distancia (no se escribe); el tiempo
  estimado sale de inicio y fin; con una dirección que Google no encuentra → el mensaje en rojo bajo el mapa y no guarda
  (la distancia en rojo con "Falta la distancia…"); editar un presupuesto viejo → vuelve a calcular la ruta.
- [ ] Generar viaje desde un presupuesto → el viaje tiene los km de Google.
- [ ] Configuración: "Gestionar tipos de comprobante" en el menú, el título y la pestaña.
- [ ] Proforma propia y de Rukas: Condiciones comerciales con Forma de pago, Plazo, Validez y Observaciones; guardar y
  ver el PDF. Una proforma vieja con observaciones comerciales las muestra en Observaciones.
- [ ] PDF de una factura de varias proformas: lista las proformas.
- [ ] Emitir factura desde una proforma: ventana extra grande con el título "Emitir factura".
- [ ] Si hay Node en la VM: `node tests/<archivo>.test.js` para cada archivo de `tests/` (tienen que imprimir `OK`).
- [ ] PowerShell: `tests/contrasenas-seguras.test.ps1` (hash y verificación de contraseñas).

**Ajuste de Rocío después del merge (22/10, commit "Cuenta corriente: lo aplicado a una factura se ve como un grupo
al desplegarla"):** al desplegar una factura, sus recibos y notas aplicados parecían una fila más (solo los
distinguía el celeste). Ahora (opción A de las tres que vio Rocío) la factura abierta se resalta, una barra azul a la
izquierda une la factura con lo aplicado, el número aplicado va corrido con la fecha, el cliente y el concepto en gris,
y una línea más marcada cierra el grupo. Las columnas no cambian y el celeste se mantiene.
- [ ] Probar en la VM (Ctrl+F5): desplegar una factura con un recibo y una NC aplicados → se ven agrupados con la
  barra; plegarla → la factura vuelve a verse como las demás; con varias desplegadas, cada grupo se cierra con su línea.

**Pendientes que salieron del merge (no son para ahora):**
- [ ] **Fechas previstas y reales** (charla con Rocío del 22/10). Hoy la hora del viaje se carga al registrarlo y, si
  cambia, hay que editarla. Propuesta: en presupuestos, solo fechas (la hora no cambia el precio: la tarifa usa los km y
  la fecha para la vigencia) y la hora se pide al generar el viaje; en viajes, "Salida prevista" y "Llegada prevista"
  (como ya dice el dashboard), que es lo que recibe el chofer por WhatsApp; y lo real lo registra el sistema al cambiar
  de estado: salida real al pasar a En viaje y entrega real con hora al marcar Entregado. Toca presupuestos, viajes, API,
  base y el WhatsApp de Fede, y conviene resolver antes la §2 (de dónde sale la hora). Decidirlo con el equipo.
- [ ] **Presupuestos: km a mano si Google falla** (opción B), como en viajes, con motivo que pase al viaje generado.
  Hoy, sin la distancia de Google no se guarda.
- [x] **Proformas: "Ver PDF" con vista previa.** Gestionar y Listar proformas bajaban el PDF directo ("Descargar PDF").
  **Hecho (22/10, commit "Proformas: Ver PDF abre la vista previa, como presupuestos y cuenta corriente", con el OK de
  Rocío; módulo de Facu):** el botón de la fila y el "Ver PDF" del formulario de la proforma abren la ventana "Ver PDF de
  la proforma …" con Cerrar · Imprimir · Descargar PDF (`proforma-pdf.js`, `verProformaPDF`); desde el formulario queda
  encima de él. El detalle de Listar proformas queda solo con Cerrar (§6.2). No hace falta recompilar.
  - [x] Probar en la VM (Ctrl+F5): en Listar y en Gestionar proformas, Ver PDF de una proforma generada → vista previa
    con su número en el título; Imprimir y Descargar PDF funcionan. Abrir una proforma y tocar "Ver PDF" en el
    formulario → la vista queda encima; al cerrarla, el formulario sigue abierto y se puede usar. Una de Rukas también.
    **OK en la reprueba (22/10)** (PF-00000001, PF-00000004 y PF-00000010 de Rukas).
- [ ] **Proformas: enviar por e-mail** (no existe hoy; solo hay envío de facturas y presupuestos). Iría en el pie de Ver
  PDF, como en presupuestos. Necesita API y elegir el perfil de correo. **Verlo con Facu** (decisión de Rocío, 22/10).
- [x] **Documentación para cualquier IA. Hecho (22/10, commit "Documentación: AGENTS.md como entrada al design
  system para cualquier IA").** Pedido de Rocío: que cualquier IA del equipo (Facu usa Codex; puede pasar a Claude o
  Cursor) siga el design system completo.
  - `AGENTS.md` (lo leen solos Codex, Cursor, Copilot y Claude): el design system es obligatorio en todos los
    módulos, sin excepciones, con una lista de control de 14 puntos para revisar antes de commitear.
  - `CLAUDE.md` incluye `AGENTS.md` con `@AGENTS.md`; lo que es solo del circuito de Rocío queda marcado como tal y
    se sacó la excepción "avisar a Rocío antes de aplicar estas reglas" en los módulos de Facu y Fede.
  - `docs/design-system/03-decisiones.md`: en presente ("aplicado", no "falta aplicarlo"), tabla de funciones de
    `window.SGTL`, menú vigente, y las reglas que faltaban (el ojo abre el documento, Ver PDF con Enviar en el pie,
    documentos en minúscula, montos que se escriben, mensajes de la API, fecha y hora en un campo). La historia de
    los nombres del menú pasó al Apéndice A.
  - `docs/equipo/FLUJO-GIT.md`: después de un cambio grande, actualizar `facugodoy` y `fedemontenegro` antes de que
    sigan; con IA, `pull` antes de empezar y la lista de control antes de commitear.
  - [ ] Probarlo con Facu: con su rama actualizada, abrir Codex en el repo y preguntarle "¿Qué reglas tenés que
    seguir para cambiar una pantalla?". Tiene que nombrar `docs/design-system/03-decisiones.md` y la lista de
    control de `AGENTS.md`.

---

## 22. Merge de Fede del 22/10 (`1bd31d3`) en `rocionuvoli` — HECHO, SIN PUSH NI PRUEBA EN VM (22/10)

Un commit de Fede sobre `2a23274` (20/10). No chocó con nada (ni con el merge de Facu, §21). Rocío lo revisó punto por
punto. Resumen para el equipo: `docs/equipo/merge-fedemontenegro-2026-10-22.md`.

**La base — ya aplicado:** la columna `CLIENTES.Nombre_Comercial` (nvarchar(100)) ya existe; Fede corrió el script
(`COL_LENGTH` 200, verificado por Rocío el 22/10). El script pasó a `database/clientes/01_nombre_comercial_clientes.sql`
(estaba suelto en `database/` con un "09" que se confundía con el de cuenta corriente); no hay que volver a correrlo.

**Decisiones de Rocío (22/10):**
1. **WhatsApp, código de área (de Fede, tal cual):** `PhoneNumberHelper.cs` reconoce las áreas de 4 dígitos (lista de
   ENACOM) y arma bien el número para Meta: 3541 57-0360 → 54 3541 15 570360 (antes salía 54 354 15 1570360). La lista
   no se verificó área por área: si a un chofer le falta su área, el número sale como antes.
2. **Nombre comercial del cliente (de Fede):** campo opcional en Gestionar clientes, detalle de Listar clientes y API.
   Ajustes: el script en `database/clientes/` (y el mensaje de la API que lo nombra), y en el campo un ejemplo ("Las
   Lomas") con la instrucción debajo (§6.3).
3. **Proformas (pantalla de Facu):** al elegir el cliente se completa su nombre comercial (de Fede). Al abrir una
   proforma se muestra **el nombre que quedó guardado en ella**; el actual del cliente solo completa un borrador que no
   lo tiene (Fede mostraba siempre el actual, y una proforma generada podía verse distinta de su PDF).

**Cómo probar en la VM** (`git pull` → recompilar la API: cambiaron `ClientesController` y `PhoneNumberHelper` → Ctrl+F5):
- [ ] Gestionar clientes: registrar un cliente de prueba con nombre comercial → se guarda; editarlo y borrarlo → queda
  vacío. El campo muestra el ejemplo "Las Lomas" y la ayuda debajo. Listar clientes → Ver detalle muestra el nombre
  comercial (o "—").
- [ ] Gestionar proformas: registrar una proforma y elegir ese cliente → se completa el nombre comercial. Cambiar el
  nombre comercial del cliente y volver a abrir una proforma **generada** de ese cliente → sigue mostrando el de la
  proforma. Un **borrador** sin nombre comercial → muestra el actual del cliente.
- [ ] WhatsApp: asignar un viaje directo a un chofer de prueba con área de 4 dígitos (por ejemplo 3541…) → en
  `App_Data/whatsapp.log` el número sale como 54 + área de 4 + 15 + 6 dígitos. Uno de Córdoba capital (351…) y uno de
  CABA (11…) siguen saliendo igual que antes.

**Pendiente que salió del merge:**
- [ ] **Auditoría de los campos de clientes que se guardan con SQL directo** (nombre comercial, código postal y tipo de
  cliente): la auditoría solo registra lo que pasa por `SaveChanges`, así que esos cambios no quedan registrados.
  Sumarlos a mano a `AUDITORIA` al guardar el cliente.

---

## 23. Prueba mínima antes de pasar `rocionuvoli` a las ramas del equipo — OK EN VM; RAMAS PASADAS (22/10)

Para confirmar que lo pusheado el 21 y 22/10 (dashboard, estilo visual, merges de Facu y Fede, ajustes) anda en la VM
**antes** de actualizar `facugodoy` y `fedemontenegro`. Son unos 20 minutos y no reemplazan las listas completas de
§19 a §22. Versión: `rocionuvoli` en `5e8f679` o posterior.

**Ya hecho en la Mac (22/10):** las 25 pantallas del menú cargan sin errores de JavaScript con una API falsa (se
comprobó que el método detecta un error puesto a propósito) y pasan las 15 pruebas de `tests/`. La API (C#) no se
pudo compilar: es el riesgo principal.

**Lo hace Rocío** (la sesión de la VM no hace `pull`, no compila ni escribe contraseñas):
- [ ] 1. `git pull` en `rocionuvoli`, compilar la API en Visual Studio: **sin errores**. Cambiaron los controllers de
  autenticación, usuarios, comprobantes, facturas, proformas, proformas de plataforma, configuración de facturación y
  clientes, y `PhoneNumberHelper`; se agregó `Security/ContrasenasSeguras.cs` y se borró `LoginController.cs`. También
  está sin compilar `ViajesController` (`ResumenCosto` del dashboard, 21/10).
- [ ] 2. Ejecutar la API y Live Server; Ctrl+F5.
- [ ] 3. Entrar con tu usuario → entra. Desde ese momento tu contraseña queda con hash y solo entrás con una API de
  este merge en adelante. Con una contraseña mal → "Usuario o contraseña incorrectos." (no dice si el usuario existe).
- [ ] 4. Con un **usuario de prueba** (no el de todos los días): Cambiar contraseña → toast y vuelve al login; entra
  con la nueva.

**La sesión de la VM (o Rocío)**, siguiendo `docs/equipo/PRUEBAS-VM-CLAUDE.md` (reporte en
`docs/pruebas/AAAA-MM-DD-prueba-minima-ramas.md`):
- [ ] 5. **Recorrer el menú completo** (25 opciones): cada pantalla abre y carga datos, y en la consola (F12) no hay
  errores rojos de JavaScript. Anotar cualquiera con la pantalla y el texto.
- [ ] 6. Dashboard: el período se ve como selector; elegir Trimestre → cambian el texto de abajo y los números.
  Personalizar → Widgets → bajar con la rueda hasta "Calendario de viajes"; Cancelar.
- [ ] 7. Cuenta corriente: cuatro botones por fila (los que no aplican, grises con el motivo); el ojo de una factura
  abre la vista completa; Ver PDF de una factura abre la vista previa con "Enviar por e-mail" en el pie (no enviar);
  desplegar una factura con aplicados → grupo con la barra azul.
- [ ] 8. **Con OK de Rocío (consume un número de recibo):** Registrar recibo a un cliente de prueba con facturas
  pendientes, importe y Distribuir → reparte desde la que vence primero; Emitir → toast. Anotar el recibo.
- [ ] 9. Presupuestos: Registrar presupuesto con un cliente de prueba, origen y destino → el mapa dibuja la ruta y
  completa los km; el tiempo estimado se calcula con las fechas; Guardar. Anotar el presupuesto.
- [ ] 10. Gestionar viajes: abre; la banderita de un viaje abre la ventana de tarjetas (Cancelar, sin cambiar nada).
- [ ] 11. Gestionar clientes: está el campo "Nombre comercial". Configuración: la opción se llama "Gestionar tipos de
  comprobante".

**Si fallan el 1, el 3 o el 5, no se pasan las ramas:** se corrige primero en la Mac. Lo demás se anota y Rocío decide.

**Resultado del 22/10** (Rocío y la sesión de la VM, sobre `64bb048`; reporte en
`docs/pruebas/2026-10-22-prueba-minima-ramas.md`): la API compiló, el login anduvo y las 25 pantallas abren sin errores
de JavaScript (se cumple la regla de corte). Pasos 6, 7, 9, 10 y 11 OK.
- [x] **F1 (alta), paso 8: Registrar recibo no cargaba las facturas pendientes.** Error mío en el merge `aea9740`: al
  pasar a minúscula los mensajes de Facu, el id `reciboFacturas` quedó `recibofacturas` y el error se tragaba en el
  `catch`. **Corregido (22/10, commit "Cuenta corriente: Registrar recibo vuelve a cargar las facturas pendientes")**,
  con una prueba nueva (`tests/ids-de-pantallas.test.js`) que controla que cada id que busca el JS de cuenta corriente y
  presupuestos exista en su HTML. Visto en la Mac con la API falsa: cargan las facturas y Distribuir reparte desde la que
  vence primero.
  - [x] Repetir el paso 8 en la VM (con OK de Rocío: consume un número de recibo). También abrir Editar recibo.
    **OK en la reprueba (22/10):** se emitió el REC-00000014 y Editar recibo abre bien.
- [ ] **F2 (media): el PDF del manual de usuario no carga** (la API tarda 29 s y devuelve 500). No es de este push
  (`DocumentacionController` sin cambios desde el 18/10). Para ver si el PDF guardado es muy grande:
  `SELECT DATALENGTH(Pdf) FROM dbo.MANUAL_USUARIO WHERE ManualUsuario_ID = 1;` (solo lee). Módulo de Facu.
- [ ] **F3 (media): los informes de versión 2.5 y 2.00 no tienen PDF cargado** (404). Faltan los PDF de `Version_ID` 3
  y 4 (Facu). El aviso dice "Probá de nuevo" y reintentar no sirve.
- [ ] **Limpieza:** el presupuesto N° 7 (dato de prueba de la VM; el SQL corregido está al final del reporte) y los
  choferes de prueba que se ven en las listas ("CLAUDE, PRUEBACLAUDE" y "Prueba, Fede").

**Mejoras del reporte que Rocío pidió hacer ya (22/10, commit "Interfaz: ajustes de la prueba mínima: montos,
tiempo estimado, porcentajes y avisos"):**
- Presupuestos: el importe calculado se ve "$ 1.775.000,00" y la ayuda "$ 2.500,00 por km × 710,0 km" (§7.3); lo que
  se guarda no cambia. El tiempo estimado va en horas y minutos ("34 h", "10 h 30 min"), no "34:00".
- Dashboard: los porcentajes llevan separador de miles ("+69.000 %").
- Botones de fila deshabilitados (todo el sistema, `SGTL.botonFila`): el lector de pantalla dice la acción y el motivo
  ("Editar recibo: solo se editan los recibos"); el globito sigue mostrando el motivo.
- Cuenta corriente: la vista de solo lectura no muestra los asteriscos de obligatorio.
- Documentación: si una versión o el manual no tienen PDF cargado, se dice en la página ("Esta versión no tiene el
  informe cargado.") en lugar de "No se pudo cargar el PDF. Probá de nuevo.".
- [x] Probar en la VM (Ctrl+F5): un presupuesto nuevo (importe, ayuda y tiempo estimado con el formato nuevo);
  Dashboard con Último mes (porcentajes grandes con punto de miles); cuenta corriente, ver una factura (sin asteriscos)
  y registrar recibo (con asteriscos); Consultar informe de versión → 2.5 (el aviso nuevo). **OK en la reprueba (22/10)**,
  con el presupuesto N° 7 abierto para editar.

**Quedan del reporte:**
- [x] **Cuenta corriente, vista de la factura: letra y sucursal "—".** No era un dato faltante: `COMPROBANTES` guarda
  `Letra` y `Sucursal`, pero la vista usa la API del PDF (`FacturasController`, `comprobantes/{id}`), que no las traía.
  **Hecho (22/10, commit "Cuenta corriente: la vista de la factura muestra letra, sucursal y % de IVA", con el OK de
  Rocío; módulo de Facu, avisarle):** la consulta suma `Letra` y `Sucursal`, y la vista muestra el % de IVA cuando todas
  las líneas tienen el mismo (sin detalle, sale de IVA ÷ neto si da 0, 10,5, 21 o 27 %; si no, "—"). **Hay que
  recompilar la API.**
  - [x] Probar en la VM: ver la FAC-00000001 → letra, sucursal y "21%"; una factura de proforma con líneas de distinto IVA
    → "—". El PDF de la factura sale igual que antes. **OK en la reprueba (22/10)**: letra "A", sucursal "0001" y "21%";
    el caso de IVA distinto no se probó.
- [x] **Viajes:** km con punto en las tablas ("67.5") y Gestionar viajes sin "Ver detalle". **Hecho (22/10) en el
  trabajo de viajes (§24):** km con coma en las dos tablas y el ojo primero en cada fila de Gestionar viajes.
- [ ] **F2, PDF del manual:** después de lo demás.

**Cambio pedido por Rocío antes de repetir la prueba (22/10, commit "Facturación: Gestionar tipos de comprobante pasa
de Configuración a Facturación"):** la opción pasa a ser la última de Facturación y **sigue siendo solo de
administradores** (quién es admin se define en Gestionar usuarios → Rol). En el menú va marcada `solo-admin`: un
usuario que no es admin no la ve aunque su grupo tenga el permiso, y si entra por la dirección vuelve al dashboard. La
API sigue exigiendo admin para modificar. En Grupos y permisos, el permiso "Facturación" (que estaba en el grupo
Configuración y confundía) pasa al grupo Facturación como **"Gestión de tipos de comprobante"**: la API lo renombra sola
al abrir los permisos, conservando el mismo permiso y sus asignaciones. Título con el ícono de Facturación y el mensaje
de la API con la ruta nueva. **Hay que recompilar la API** (`GruposController`, `FacturacionConfiguracionController`).
- [x] Probar en la VM: como admin, Facturación termina en "Gestionar tipos de comprobante" y Configuración ya no la
  tiene; al entrar, el menú abre Facturación con la opción marcada. Gestionar grupos y permisos → Permisos: en
  Facturación aparece "Gestión de tipos de comprobante" y ya no hay "Facturación" en Configuración (los grupos que lo
  tenían lo siguen teniendo). Con un usuario que no es admin: no ve la opción. **OK en la reprueba (22/10)** como admin;
  lo del usuario que no es admin lo mira Rocío a mano (hay que escribir la contraseña).
- [x] **Pendiente (decisión de Rocío, 22/10): pasar todos los permisos a los nombres del menú** ("Gestionar choferes",
  "Listar viajes", "Gestionar cuenta corriente"…), como pide §3.1 del design system. Hoy el catálogo de Grupos y
  permisos usa "Gestión de…", "Listado de…". Implica: renombrar los 23 en `GruposController` conservando las
  asignaciones (la API ya sabe hacerlo), que `sidebar-loader.js` (`MENU_TO_PAGE`) y la API de presupuestos
  (`EnviosPresupuestosController`, que da acceso por nombre: "Gestion de viajes" o "Presupuestos") acepten los nombres
  nuevos y los viejos, y hacerlo cuando las ramas de todos estén al día (una API vieja vuelve a crear los nombres viejos
  como permisos vacíos al abrir Grupos y permisos).
  **Hecho (23/10, pedido de Rocío), pusheado (`9f4e018`), solo pantalla:** en lugar de renombrar en la base,
  Gestionar grupos y permisos muestra cada permiso con el texto de su opción del menú y en el mismo orden
  (`OPCIONES_DEL_MENU`, hoy en `assets/static/js/permisos-menu.js`; §3.1 del design system).
  Los nombres de la base no cambian, así que no hace falta recompilar, ni coordinar las ramas, ni tocar
  `MENU_TO_PAGE`, `EnviosPresupuestosController` ni los controllers de Facu que dan acceso por nombre. Un permiso que
  no está en la lista se ve con su nombre, al final de su tarjeta. `tests/permisos-menu.test.js` controla que cada
  permiso del catálogo de la API tenga su texto y que coincida con el menú lateral, en el mismo orden.
  - [ ] Probar en la VM (`pull` y Ctrl+F5, sin recompilar): Gestionar grupos y permisos → Permisos, elegir un grupo.
    Cada tarjeta dice lo mismo que el menú y en su orden: General: Dashboard · Auditoría; Choferes: Listar choferes ·
    Gestionar choferes; Viajes: Listar viajes · Gestionar viajes · Gestionar orígenes y destinos · Gestionar tarifas ·
    Gestionar presupuestos; Facturación: Listar proformas · Gestionar proformas · Gestionar cuenta corriente ·
    Gestionar tipos de comprobante; Configuración: Gestionar e-mail · Gestionar integración de WhatsApp · Gestionar
    empresa · Gestionar contenido; Usuarios: Listar usuarios · Gestionar usuarios · Gestionar grupos y permisos.
    Tildar o destildar uno, Guardar permisos y volver a elegir el grupo: queda como se guardó, y un usuario de ese
    grupo ve en el menú lo mismo que antes (los permisos son los mismos).
  **Listar usuarios → Ver detalle, igual. Hecho (23/10, pedido de Rocío), sin push, solo pantalla:** "Grupos y
  pantallas que ve" mostraba los nombres de la base ("Gestión de viajes", "Listado de clientes", "Presupuestos"), por
  orden alfabético. Ahora muestra los textos del menú y en su orden. La lista de textos pasó a un archivo compartido
  por las dos pantallas, `assets/static/js/permisos-menu.js` (`SGTLPermisos`), con su prueba
  (`tests/permisos-menu.test.js`).
  - [ ] Probar en la VM (`pull` y Ctrl+F5, sin recompilar): Listar usuarios → el ojo de un usuario que esté en un
    grupo con varias pantallas. En "Grupos y pantallas que ve", cada pantalla dice lo mismo que el menú y va en su
    orden (por ejemplo: Dashboard, Listar viajes, Gestionar viajes, Gestionar presupuestos, Listar clientes). Y
    Gestionar grupos y permisos → Permisos sigue igual que en el punto de arriba.
- [ ] **Pendiente a futuro (decisión de Rocío, 23/10): normalizar en la base los nombres de los permisos con los del
  menú**, en infinitivo, para que todo quede igual y la pantalla no tenga que traducirlos. Es más trabajo, pero hay que
  hacerlo en algún momento. Hoy la tabla `MENU` sigue con "Listado de…", "Gestión de…", "Presupuestos", "Cuenta
  Corriente", "E-mail", "Integración WhatsApp", "Grupos y permisos" y "Auditoria" (sin tilde); "Dashboard" y "Auditoría"
  quedan sin verbo, como en el menú. Qué implica (relevado el 23/10):
  - **Renombrar los 24 conservando `Menu_ID` y las asignaciones:** en `GruposController`, los nombres nuevos en
    `CatalogoMenuPermisos` y `MenuPrincipalPorPermiso`, y los viejos en `renombres` (`AsegurarCatalogoMenuPermisos` ya
    sabe renombrar y unificar si coexisten). O un script idempotente en `database/menu/03_…`, que se ve antes de
    correrlo. Recompilar la API.
  - **Lo que da acceso por nombre**, que tiene que aceptar los dos nombres mientras dure el cambio: `MENU_TO_PAGE` en
    `sidebar-loader.js` (ya tiene algunas claves nuevas: "gestionar viajes", "gestionar presupuestos", "gestionar
    empresa", "consultar auditoria") y `EnviosPresupuestosController` (el SQL de la línea 42 pide 'Gestion de viajes' o
    'Presupuestos'; sumar 'Gestionar viajes' y 'Gestionar presupuestos').
  - **Dónde se ven los nombres:** Gestionar grupos y permisos y Listar usuarios → Ver detalle (`bloqueGrupo` en
    `listado-usuarios.html`, con `api/Usuarios/{id}/Detalles`). Hoy las dos los traducen con `SGTLPermisos`
    (`permisos-menu.js`), que después sobra o queda solo para el orden. `api/Usuarios/MenusPermitidos` devuelve el
    nombre para el menú y no cambia.
  - **Pruebas que nombran permisos:** `permisos-menu`, `permisos-agrupados`, `permisos-presupuestos` y
    `empresa-documentos`.
  - **Cuándo:** con las ramas de todos al día y avisando a Facu y Fede (la base es compartida). Una API vieja, al abrir
    Grupos y permisos, vuelve a crear los nombres viejos como permisos vacíos, y ahí aparecerían repetidos.
- [ ] **Pendiente: permisos que no dan acceso.** En Grupos y permisos se pueden tildar E-mail, Gestión de contenido,
  Integración WhatsApp, Gestión de empresa (sumado el 23/10, decisión de Rocío, para que el catálogo quede unificado; ver
  §30) y Gestión de tipos de comprobante, pero esas pantallas son solo de administradores: tildarlos no le da acceso a
  nadie. Marcarlos como "solo administradores" o sacarlos del listado. Catálogo de Facu: **verlo con él, todos juntos**.

**Reprueba del 22/10** (la sesión de la VM sobre `c778c0a`; reporte en `docs/pruebas/2026-10-22-reprueba-ramas.md`):
**los 8 puntos OK** y sin errores de JavaScript. Se emitió el REC-00000014 (distribuidora-powerful S.A., $ 100.000,00,
aplicado a FAC-00000004 y FAC-00000005). Después se subió "Cuenta corriente: las tres tarjetas del resumen tienen la
misma altura" (`1a78bd8`, solo visual): lo mira Rocío a mano.
- Mejoras que dejó el reporte (Rocío eligió hacer primero las tres más chicas, 22/10):
  - [x] **Hecho (22/10, commit "Interfaz: mejoras de la reprueba: km del mapa, foco de Ver PDF y referencia del
    recibo"), sin recompilar:**
    - Cuenta corriente, Registrar y Editar recibo: la referencia lleva asterisco solo con Transferencia o Cheque, y si
      falta, el error sale debajo del campo con "Revisá los campos marcados." arriba (§6.3). Al pasar a Efectivo u
      Otro, o al escribirla, el rojo se va. Módulo de Facu: solo pantalla.
    - Presupuestos: el texto del mapa y el aviso de "no hay tarifa" muestran los km con coma ("710,0 km").
    - Proformas: la cruz del formulario tiene `aria-label`, y al cerrar la vista del PDF el foco vuelve a lo que la
      abrió (el "Ver PDF" del formulario o el botón de la fila).
    - [ ] Probar en la VM (Ctrl+F5): Registrar recibo con Transferencia y sin referencia → asterisco, error debajo del
      campo y aviso arriba; cambiar a Efectivo → se van el asterisco y el error; cancelar sin emitir. Presupuestos:
      registrar uno sin guardar → "Distancia: 710,0 km, de …". Proformas: abrir una, "Ver PDF", cerrar con la cruz →
      el formulario sigue abierto con el foco en su "Ver PDF".
  - [x] PF-00000004 dice "Factura" en Listar proformas y "Facturada" en Gestionar. **Cerrado (22/10): no era una
    falla.** Las dos pantallas usan la misma API, la misma regla de estado y la misma etiqueta, y nada guarda "Factura"
    como estado. Rocío lo miró a mano y en las dos dice "Facturada": fue una lectura equivocada de la VM.
  - [x] "Auditoria" y "Cuenta Corriente" en Grupos y permisos: van con el renombre de permisos de arriba. **Hecho
    (23/10):** se ven "Auditoría" y "Gestionar cuenta corriente" (se prueba con el punto de arriba).
  - [ ] Limpieza: el grupo "PRUEBA-CLAUDE 20/10" (eliminarlo desde Gestionar grupos y permisos, después de ver que no
    tenga usuarios reales).

**Después de la prueba:** actualizar `facugodoy` y `fedemontenegro` con `rocionuvoli` (en la Mac, con el OK de Rocío)
y mandarles este mensaje. **Hecho (22/10):** `facugodoy`, `fedemontenegro` y `main` quedaron en `36a92c8`, sin conflictos
(ninguno había subido nada después de los merges).

> Facu, Fede: ya están sus ramas actualizadas con todo lo nuevo: el estilo visual y el design system en todas las
> pantallas, y los merges de los dos del 22/10. Antes de seguir:
> 1. Traigan su rama (`git pull` en `facugodoy` / `fedemontenegro`), recompilen la API y hagan Ctrl+F5.
> 2. Las contraseñas ahora se guardan con hash: cuando entren con la API nueva, su usuario ya no entra con una
>    versión vieja. Trabajen siempre con la rama al día.
> 3. Si usan IA (Codex, Cursor, Claude): con la rama al día lee sola `AGENTS.md`, que manda seguir el design system
>    (`docs/design-system/03-decisiones.md`) en todos los módulos. Antes de commitear, pídanle: "Revisá los cambios
>    con la lista de control de AGENTS.md".
> 4. Cómo quedaron sus cambios y por qué: Facu en `docs/equipo/merge-facugodoy-2026-10-22.md` y Fede en
>    `docs/equipo/merge-fedemontenegro-2026-10-22.md`. Facu: después del merge toqué tu módulo en tres cosas: la vista
>    de la factura en cuenta corriente muestra letra, sucursal y % de IVA (cambió `FacturasController`); "Ver PDF" de
>    proformas abre la vista previa, como presupuestos (sin "Enviar por e-mail" todavía, lo vemos juntos); y "Gestionar
>    tipos de comprobante" pasó a ser la última opción de Facturación, con el permiso renombrado a "Gestión de tipos de
>    comprobante" en Grupos y permisos.
> 5. Prueben los flujos con el diseño nuevo y avísenme lo que vean. Queda para después (no son errores):
>    - el formulario de alta de viaje y la proforma de Rukas: los estoy ajustando yo;
>    - para charlar entre todos: fechas previstas y reales en presupuestos y viajes, y si en presupuestos se pueden
>      cargar los km a mano cuando Google falla.

---

## 24. Viajes: registrar, editar y ver detalle — PUSHEADO, PROBADO EN VM (23/10): ARREGLOS EN §28

Pedido de Rocío: mejorar registrar un viaje, editarlo y su detalle. Se relevaron los tres modales con una API simulada
(datos inventados) y Rocío aprobó la propuesta con capturas en tres vueltas. Commits en `rocionuvoli`: `cea8407`
"Viajes: registrar y editar en bloques, con importe y errores por campo", `72c1600` "Viajes y datos maestros: Ver
detalle con los bloques del formulario" y `dd6034c` "Viajes: km con coma en las tablas de Gestionar y Listar viajes".
**Sin cambios en C# ni en la base:** en la VM alcanza con `git pull` y Ctrl+F5.

**Decisiones de Rocío (22/10):**
- Chofer y cliente se eligen de una lista que se recorre o se filtra escribiendo (el buscador de los filtros): no hace
  falta saberse el DNI o el apellido.
- Rukas se dice una vez: etiqueta "Rukas" en la lista y debajo del cliente, sin "(Rukas)" en el nombre. Los números
  conservan su nombre ("N° transporte SAP", "N° entrega Rukas") porque dicen de dónde sale el dato.
- El aviso de WhatsApp va a la vista, debajo del chofer y con su nombre.
- Tarifa: "Por km" elegida por defecto; si la ruta tiene tarifa fija, una línea gris lo dice; sin tarifa, aviso
  amarillo (no rojo con un enlace verde).
- Lo que no se puede editar se ve como texto, nunca como campo deshabilitado: un bloque entero, en un recuadro gris;
  un campo suelto, su etiqueta y el valor. Anotado en el §6.3 del design system junto con el subtítulo de bloque.
- Ver detalle con los bloques del formulario (opción B) en viajes y también en choferes, camiones, clientes y
  usuarios. Anotado en el §6.2.
- Camión: solo los activos. Resultado de la entrega: Completa verde, Parcial amarillo, Rechazo rojo.
- El aviso de cambios sin guardar queda para decidirlo en todos los flujos (abajo).

**Qué cambió:**
- **Registrar / Editar viaje** (`gestion-viajes.html`): cuatro bloques con subtítulo (Recorrido · Fechas, camión y
  chofer · Tarifa · Números de referencia) y la ruta a la derecha (km grandes con coma, dirección corta, Recalcular como
  ícono; si Google falla, distancia y motivo ahí mismo). Tarifa con el importe neto y su cálculo ("$ 576.665,00 neto ·
  $ 1.450,00 por km × 397,7 km"); al editar, el importe guardado (o el del presupuesto). Errores en cada campo con
  "Revisá los campos marcados." arriba; el modal no se cierra con un clic afuera. Al editar: título "Editar viaje #N"
  con el estado y las etiquetas, lo fijo como recuadro gris y un aviso de una línea ("Ya salió: solo se completa el
  número de remito."). Se corrigieron los "+" de origen y destino, que quedaban habilitados en un viaje de Rukas listo
  para facturar. Lo que se manda a la API es igual que antes.
- **Buscador compartido** (`select-cliente-predictivo.js`): flechas y Enter, texto de "sin resultados" y etiqueta por
  opción. Las flechas y Enter llegan también a los filtros de cliente de las demás pantallas (proformas, cuenta
  corriente, tarifas, orígenes y destinos, presupuestos): no cambia qué hacen.
- **Ver detalle del viaje** (`viaje-detalle.js` nuevo): uno solo para Listar viajes, Gestionar viajes (el ojo, primero
  en la fila) y el dashboard (con "Abrir en Gestionar viajes"). Recorrido con direcciones, fechas con hora, importe,
  entrega con su etiqueta, números de Rukas solo en esos clientes y quién lo registró y lo modificó.
- **Ver detalle de choferes, camiones, clientes y usuarios:** el mismo armado (estado en el título, bloques en dos
  columnas, cada dato con su nombre arriba; los vacíos con "—"). Mismos datos; la fecha de alta pasa al pie con el
  usuario y la última modificación.
- **Tablas de viajes:** km con coma ("402,3").

**Probar en la VM** (Ctrl+F5, sin recompilar):
- [ ] 1. Registrar viaje: elegir el cliente de la lista (probar flechas y Enter, y escribir parte del nombre); los de
  Rukas tienen la etiqueta y no "(Rukas)" en el nombre. Chofer: clic → lista de activos por apellido; escribir parte del
  DNI filtra; al elegirlo aparece el aviso azul "Al guardar, … recibe la hoja de ruta por WhatsApp.". Camión: no
  aparecen los inactivos.
- [ ] 2. Tarifa: arranca en Por km con el importe; si la ruta tiene fija, la línea gris lo dice; elegir Fija en una
  ruta sin tarifa fija → aviso amarillo con el enlace a Gestionar tarifas; Guardar → error en rojo en la tarifa.
- [ ] 3. Guardar con todo vacío → cada campo con su error y "Revisá los campos marcados." arriba; un clic afuera no
  cierra el modal.
- [ ] 4. **Con OK de Rocío (crea un viaje real y le manda WhatsApp al chofer):** registrar un viaje de prueba → toast
  "Viaje registrado." y el del WhatsApp.
- [ ] 5. Editar uno En viaje: recorrido, fechas/camión/chofer y tarifa como recuadros grises, solo el remito editable,
  aviso "Ya salió: …". Uno de Rukas en Listo para facturar: tarifa y km editables, sin "+". Uno generado desde un
  presupuesto (el #28; el #31 si todavía no se borró): aviso azul con el número del presupuesto y su importe.
- [ ] 6. `gestion-viajes.html?viaje=N` (desde el control de la proforma de Rukas) sigue abriendo el viaje.
- [ ] 7. Ver detalle del viaje desde Listar viajes, desde Gestionar viajes (también en un facturado) y desde el
  dashboard (clic en un viaje de la tabla o del calendario, con "Abrir en Gestionar viajes").
- [ ] 8. Ver detalle en Listar choferes, camiones, clientes y usuarios: estado en el título, bloques, tablas de camión
  y chofer asignados como antes, pie con alta y modificación.
- [ ] 9. Las tablas de Gestionar y Listar viajes muestran los km con coma.
- [ ] 10. Un filtro de cliente de otra pantalla (Gestionar proformas o cuenta corriente) sigue andando, ahora también
  con flechas y Enter.
- [ ] 11. En el celular (o la ventana angosta): el modal de viaje a pantalla completa y los detalles en una columna.

**Pendientes que dejó este trabajo:**
- [ ] **Cambios sin guardar en todos los flujos** (decisión de UX de Rocío): hoy solo proformas avisa, dentro del modal,
  y no convence cómo se ve. Ver si va adentro o como un modal sobre otro, y aplicarlo igual en todos los formularios.
- [ ] **Lo que no se edita, en otras pantallas:** Registrar proforma (número y condición de IVA como campos de solo
  lectura) y el recibo de cuenta corriente (cliente deshabilitado). Pasarlos a texto (§6.3). Módulo de Facu: coordinar.
- [ ] **Subtítulo de bloque compartido:** proformas (`.bloque-titulo`) y cuenta corriente (`.cc-block-title`) tienen su
  propia copia; pasarlas a `.sgtl-bloque-titulo`. Módulo de Facu.
- [ ] **Auditoría, "Ver detalle del movimiento":** quedó con su armado (es un visor técnico con los valores anteriores
  y nuevos). Decidir si pasa a bloques.
- [ ] **Fechas en el celular:** el selector usa el del teléfono y se ve "06:00 a. m." (flatpickr en modo móvil), en
  todo el sistema; el §7.1 pide 24 h.
- [ ] **Mensajes de la API de viajes sin voseo** ("Debe seleccionar un cliente.", `ViajesController.ValidarViaje`). La
  pantalla los frena antes, así que casi no se ven; corregirlos la próxima vez que se toque el controller.
- [ ] **Las tablas de viajes no entran en una notebook** (Gestionar y Listar viajes; Rocío lo dejó para más adelante el
  22/10). En 1366 px de ancho la tabla mide 1621 px y hay 956 disponibles: Destino, Número de remito, Km y Estado quedan
  fuera y hay que desplazar hacia el costado (Acciones queda fija). Las demás tablas del sistema entran. Se debe a las
  10 columnas en una sola línea (`.sgtl-tabla-ancha` no deja partir ningún texto); el lugar del ícono de información
  suma unos 50 px. Propuesta medida con la API simulada, que entra en 1366 y holgada en 1440:
  - 7 columnas: **Número** · Cliente · **Fecha** (una sola si empieza y termina el mismo día; si no, abajo en gris "al
    19/10/2026") · **Recorrido** (origen arriba y "→ destino" abajo, como el bloque del formulario) · **Km** · Estado ·
    Acciones.
  - Cliente y Recorrido pueden ir en dos renglones (tres con nombres largos); fechas, números, estado y botones no se
    parten (§2.1). En pantallas más chicas, Acciones sigue fija a la derecha.
  - El número de remito sale de la tabla: se sigue buscando con el filtro y se ve en Ver detalle, como el N° transporte
    SAP y el N° entrega Rukas.
  - Descartado: dejar el remito como columna (igual no entra y las filas quedan de 3 o 4 renglones). Posible: el remito
    en gris debajo del cliente (entra, pero suma un renglón).
  - Para decidir con Rocío: si el remito sale o va debajo del cliente, y en qué resolución se muestra en la defensa (en
    un proyector de 1280 entra al límite). Al hacerlo, actualizar "Tablas anchas" en el §2.1 del design system.


### Ronda de observaciones de Rocío (22/10) — PUSHEADO (`910ca32`, `3917181`, `c2bf14b`), PROBADO EN VM (23/10)

Rocío recorrió viajes y la proforma de Rukas en la simulación y fue pidiendo ajustes. **Sin C#:** `pull` y Ctrl+F5.

**Qué cambió:**
- **Columna Estado** (Gestionar viajes y Gestionar proformas): lo que acompaña al estado va en un ícono que abre un
  globito de una línea (`SGTL.botonInfo` / `SGTL.conInfo`, §4.3), no en más etiquetas. Viajes: gris ("En el borrador
  de proforma #23.", "En la proforma PF-00000014, aceptada.", "Generado desde el presupuesto #12."). Proformas de
  Rukas: borde rojo si falta resolver algo, naranja si se espera a Rukas, verde si está lista para generar. Las
  etiquetas quedan centradas y a la misma altura en todas las filas, con el ícono después.
- **Botones deshabilitados con el motivo de qué hacer** (como el tacho): viaje facturado → "para corregirlo, emití la
  nota de crédito de su factura desde Cuenta corriente"; en una proforma emitida → "anulá la proforma"; en un borrador
  → el tacho dice "sacalo del borrador para eliminarlo". Se sacó el clip de evidencia de la tabla (no se podía tocar).
- **Registrar viaje:** la etiqueta "Rukas" va adentro del campo de cliente (y en la lista); origen y destino sin
  cliente dicen "Elegí el cliente".
- **Ver detalle** (viajes, choferes, camiones, clientes y usuarios): los bloques van en filas que empiezan a la misma
  altura. Dashboard: en últimos viajes, el resultado de la entrega debajo del estado.
- **Íconos:** alineados con el texto en todo el sistema (la plantilla los bajaba con `vertical-align: sub`); en los
  avisos de varias líneas, el ícono a la altura de la primera; en los círculos (zona del Excel, pasos), centrados.
- **Proforma de Rukas, segunda vuelta** (detalle en `docs/diseno/proforma-rukas-diseno.md`): Rukas adentro del campo
  de cliente, de dónde se exporta el Excel en el ícono de información, un solo texto en la zona del archivo, sin
  "Guardar borrador" ni "Borrador" en el título hasta que existe, "Generar proforma" deshabilitado con el motivo en su
  globito (§6.2), en el paso 3 un recuadro gris con cliente, Excel ("Reemplazar" al lado) y período, ayudas de los
  grupos más cortas y, en la guía de viajes sin proforma, el ícono rojo con lo que le falta al viaje.

**Probar en la VM** (Ctrl+F5):
- [ ] 1. Gestionar viajes: un viaje en un borrador de proforma, uno en una proforma emitida y uno de un presupuesto
  muestran el ícono gris al lado del estado; el globito dice una sola línea; las etiquetas de estado quedan alineadas
  en toda la columna.
- [ ] 2. Pasar el mouse por el lápiz, la banderita y el tacho deshabilitados de un viaje facturado y de uno en una
  proforma: dicen qué hacer.
- [ ] 3. Registrar viaje con un cliente de Rukas: la etiqueta adentro del campo; sin cliente, origen y destino dicen
  "Elegí el cliente".
- [ ] 4. Ver detalle de un viaje, un chofer, un camión, un cliente y un usuario: bloques alineados en filas.
- [ ] 5. Gestionar proformas: el borrador de Rukas con el ícono de color al lado del estado y su globito.
- [ ] 6. Registrar proforma con un cliente de Rukas: Rukas adentro del campo, el globito del Excel, "Generar
  proforma" deshabilitado con "Primero elegí el Excel de Rukas", el ícono del Excel centrado en su círculo. Abrir el
  borrador: recuadro gris arriba de la tabla y "Generar proforma" con "Para generar, resolvé las N diferencias".
- [ ] 7. En pantalla completa, los íconos de los títulos, del menú y de los avisos quedan a la altura del texto (sobre
  todo el aviso de WhatsApp al elegir el chofer).


### Control de la proforma de Rukas, tercera vuelta (22/10) — PUSHEADO (`3751c33`), PROBADO EN VM (23/10): ARREGLOS EN §28

Rocío revisó todos los casos del control con capturas y fue pidiendo ajustes (detalle en
`docs/diseno/proforma-rukas-diseno.md`, "Tercera vuelta"). **Sin C#:** `pull` y Ctrl+F5.

**Qué cambió:** el cliente arriba y el Excel en su franja con "Volver a controlar" y "Reemplazar Excel"; el resumen en
un renglón con puntos de color; el color solo en el título de cada grupo, con qué hacer al lado; cada resultado en un
renglón y concreto; la tarifa en gris solo en "Importe distinto"; sin el aviso de viajes fuera de la proforma (caso 7
del documento de negocio actualizado); el modal más ancho y más espacio entre columnas. Además, en todo el sistema, el
ícono de los botones de solo ícono queda en el centro exacto (la caja del ícono mide lo mismo que el ícono) y las reglas
nuevas están en el design system (§1.6, §2.1, §6.2, §12) y en la lista de control de AGENTS.md.

**Probar en la VM** (Ctrl+F5):
- [ ] 1. Abrir un borrador de Rukas con diferencias: arriba el cliente y la franja del Excel; el resumen en un renglón;
  tocar cada parte del resumen lleva a su grupo.
- [ ] 2. Cada grupo con su título en gris claro, la etiqueta de color y qué hacer al lado; las filas sin etiquetas de
  color, con el resultado en un renglón ("Falta el remito", "Repetido en el Excel (filas …)").
- [ ] 3. Un "Importe distinto": debajo del importe de SGTL, la tarifa en gris. Las demás filas, sin ícono de tarifa.
- [ ] 4. Registrar un reclamo: la fila pasa a "Esperando a Rukas" y el título dice "Reclamado el …" con "Ver reclamo".
- [ ] 5. Un borrador que coincide entero: "Lista para generar" y las filas con "Coincide" en gris.
- [ ] 6. En la notebook (1366) y en una ventana más angosta (1100), la tabla entra sin desplazarse hacia el costado.
- [ ] 7. Los botones de las filas de otras pantallas (viajes, proformas, clientes) siguen con el ícono centrado.

### Presupuestos, avisos de dos renglones y "Sin viaje relacionado en SGTL" (22/10) — PUSHEADO (22/10), PROBADO EN VM (23/10): ARREGLOS EN §28

Tres pedidos de Rocío después de la tercera vuelta. **Sin C#:** `pull` y Ctrl+F5.

- **Gestionar presupuestos** (pantalla de Facu, **avisarle**): el viaje que generó el presupuesto pasa de la etiqueta
  "Viaje #N" debajo del estado al ícono gris de información al lado ("Generó el viaje #N."), como en Gestionar
  viajes (§4.3). Solo cambia cómo se ve.
- **Avisos arriba a la derecha** (todo el sistema): con dos renglones, el ícono y la cruz quedan a la altura del
  primero, no en el medio (§12).
- Design system: en §4.3, si hay varias cosas a la vez manda el ícono más urgente (en proformas, el rojo aunque
  también se espere a Rukas; el reloj, solo si esperar es lo único).
- **Control de Rukas:** el resultado "Sin viaje en SGTL" pasa a **"Sin viaje relacionado en SGTL"**: el viaje puede
  estar cargado, pero sin el N° de transporte o con otro, y por eso no se une con la línea. Solo cambia el texto.

**Probar en la VM** (Ctrl+F5):
- [ ] 1. Caso 3 del instructivo (3.4): el 990002 dice "Sin viaje relacionado en SGTL", en un renglón y sin cortar la
  tabla.
- [ ] 2. Gestionar presupuestos: un presupuesto aceptado con viaje muestra "Aceptado" y el ícono gris; el globito dice
  "Generó el viaje #N."; los estados quedan alineados en toda la columna, con ícono o sin él.
- [ ] 3. Un aviso largo (por ejemplo, editar un cliente con un borrador de proforma): el ícono verde y la cruz a la
  altura del primer renglón.
- [ ] 4. Gestionar proformas: un borrador de Rukas que espera a Rukas y además tiene algo para corregir muestra el
  ícono rojo; uno que solo espera, el reloj naranja de borde.

**Para más adelante** (Rocío, 22/10: "no me cierran las opciones"):
- [ ] **Ayudar a encontrar el viaje de un "Sin viaje relacionado".** La causa más común es un viaje del cliente
  cargado sin el N° de transporte SAP (o con otro). La lista de viajes sin proforma que arma la API (`Avisos`,
  `ViajesSinProforma`) trae solo los que tienen el N° cargado, así que justo esos no aparecen. Se probaron y se
  descartaron: los viajes sin proforma al lado del título del grupo (se mezclaba con "Falta el remito"), solo el del
  mismo día (depende de que la fecha coincida justo) y todos debajo del resultado (pueden ser muchos). Quedó propuesto,
  sin decidir: un ícono de información al lado del resultado con hasta 5 viajes del cliente sin proforma, con fecha
  igual o anterior a la del transporte, los más cercanos primero, sin N° o con un N° que no está en el Excel ("#26 ·
  15/10/2026 · sin N° de transporte SAP"). Necesita cambiar la API (`ProformasPlataformaController`) y compilar.

---

## 25. Proformas: datos del cliente desde el cliente, no desde la proforma — PUSHEADO (`b7e183d`, `eb6d96b`), COMPILADO Y PROBADO EN VM (23/10): MEJORAS EN §28

Rocío lo decidió el 22/10, mientras lo charlaba con Facu (la proforma y la factura son su módulo: **coordinarlo con
él antes de hacerlo**). Hoy, en la proforma propia, la razón social, el nombre comercial, el CUIT, la dirección y el
teléfono son campos libres desde el módulo original (`194da0e`, 28/07); solo la condición IVA es de solo lectura (Facu,
15/10, la API la toma del cliente). En la de Rukas los despliega "Editar datos del cliente". Lo que se cambia ahí queda
solo en esa proforma y **la factura toma esos datos de la proforma** (`FacturasController.LeerProforma`): un CUIT
corregido a mano en la proforma sale en la factura aunque la ficha del cliente diga otro. No había ninguna definición
escrita sobre esto.

**Decisiones:**
- **En la proforma no se edita ningún dato del cliente:** se ven como texto (§6.3), en la propia y en la de Rukas.
- **"Editar cliente"** (botón en la proforma): oculta el modal de la proforma, sin perder lo cargado, y abre el de
  editar cliente, el mismo de Gestionar clientes, con todos sus datos editables salvo el **tipo de cliente**
  (directo / Rukas), que desde una proforma queda deshabilitado con el motivo: cambiaría el circuito de la proforma
  abierta. Guardar → toast verde y vuelve a la proforma con los datos nuevos. Cancelar → vuelve sin cambios ni aviso.
- **Los borradores muestran siempre los datos actuales del cliente;** la copia queda fija al generar la proforma. Al
  editar el cliente (desde la proforma o desde Gestionar clientes) se actualizan todos sus borradores, propios y de
  Rukas. Las proformas generadas, aceptadas o facturadas y las facturas no cambian.
- **Avisos** (§5.1, toast verde):
  - sin borradores: "Cliente actualizado.";
  - con uno: "Cliente actualizado. También se actualizaron sus datos en el borrador de proforma #23.";
  - con varios: "Cliente actualizado. También se actualizaron sus datos en 3 borradores de proforma.";
  - desde la proforma, el borrador abierto cuenta como uno más; en una proforma nueva todavía sin guardar, solo
    "Cliente actualizado.".
- **Una proforma generada (o aceptada) con un dato del cliente mal:** se corrige el cliente, se anula la proforma y se
  genera una nueva, que toma los datos corregidos. Una generada no vuelve a borrador (la única transición es Generada →
  Aceptada). Así la factura puede seguir tomando los datos de la proforma.

**Qué cambió** (probado en la Mac con una API simulada; el C# no se pudo compilar acá):
- **API** (`ProformasController.cs`, al final: `DatosClienteProforma`): lee la ficha del cliente (razón social,
  nombre comercial, CUIT, condición IVA, calle y altura, localidad, provincia, código postal, teléfono y e-mail) y la
  corta al largo de las columnas `Cli_*` de `PROFORMAS`. La usan:
  - guardar, editar y duplicar una proforma propia: los `Cli_*` salen del cliente, no de la pantalla (antes solo la
    condición IVA);
  - leer una proforma (`GET api/Proformas/{id}`): un borrador muestra siempre los datos actuales del cliente; una
    generada, los que quedaron;
  - generar (propia y de Rukas): la copia queda fija con la ficha de ese momento;
  - importar el Excel de Rukas (`ProformasPlataformaController.Importar`);
  - editar un cliente (`ClientesController`, PUT): copia la ficha a todos sus borradores, propios y de Rukas, deja un
    registro en Auditoría por borrador y devuelve `{ Borradores, BorradorID }` para el aviso. Si eso falla, el cliente
    queda guardado igual (los borradores toman los datos al abrirlos o al generarlos).
  - "Contacto" queda vacío: el cliente no tiene ese dato.
- **Editar cliente compartido** (`assets/static/js/cliente-editar.js`, `SGTLEditarCliente.abrir`): el mismo modal y
  las mismas validaciones en Gestionar clientes (que ya no tiene su copia) y en la proforma. Arma el aviso: "Cliente
  actualizado." / "… También se actualizaron sus datos en el borrador de proforma #23." / "… en 3 borradores de
  proforma.". Desde la proforma, el tipo de cliente se ve como texto: "Desde una proforma no se cambia: hacelo en
  Gestionar clientes."
- **Proforma propia** (`gestion-facturacion.html`): los seis campos del cliente quedan ocultos y se ven en un recuadro
  gris (razón social y nombre comercial, CUIT, condición de IVA, domicilio con localidad y código postal, teléfono y
  e-mail) con "Editar cliente". El enlace oculta la proforma sin perder lo cargado ni el aviso de cambios sin guardar,
  abre la edición y vuelve con los datos nuevos. En "Ver", sin el enlace. Sin permiso para Gestionar clientes, el
  enlace queda deshabilitado con el motivo (`sidebar-loader.js`: `window.sgtlPuedeEntrar`).
- **Proforma de Rukas** (`proformas-plataforma.js`): los datos del cliente en una fila compacta (Cliente · CUIT ·
  Domicilio · Teléfono y e-mail, con el segundo dato en gris), siempre a la vista: en el paso 2 debajo del campo y en
  el paso 3 en el recuadro gris, arriba del Excel y el período. "Editar cliente" en el paso 2 y en un borrador; en
  solo lectura, la fila sin el enlace. La proforma propia mantiene cada dato con su nombre (pedido de Rocío, 22/10).
- **PDF de la proforma** (`proforma-pdf.js`): "Ciudad" con la provincia y el código postal; sin "Contacto".

**Probar en la VM** (`pull`, **compilar la API** y Ctrl+F5):
- [ ] 1. Registrar proforma con un cliente directo: los datos del cliente se ven como texto en el recuadro gris, sin
  campos. Agregar una línea, tocar "Editar cliente", cambiar el teléfono y guardar → toast "Cliente actualizado." (o
  con sus borradores), la proforma vuelve con el teléfono nuevo y la línea sigue ahí. Cancelar en el cliente vuelve
  sin aviso.
- [ ] 2. En la edición abierta desde la proforma, el tipo de cliente se ve como texto con el motivo.
- [ ] 3. Gestionar clientes: registrar uno (el tipo se elige) y editar uno con dos borradores de proforma → "Cliente
  actualizado. También se actualizaron sus datos en 2 borradores de proforma."; abrir esos borradores: tienen los datos
  nuevos. Una proforma generada del mismo cliente no cambia.
- [ ] 4. Proforma de Rukas: en el paso 2, la fila compacta del cliente con "Editar cliente" debajo del campo; en el
  paso 3 de un borrador, la misma fila arriba del Excel y el período; con el ojo (solo lectura), la fila sin el
  enlace. Editar el cliente desde el paso 3: la fila se actualiza sola.
- [ ] 5. Guardar y generar un borrador y emitir su factura: la factura sale con los datos de la ficha del cliente.
- [ ] 6. "Ver PDF" de un borrador: e-mail y "Ciudad" con el código postal; sin "Contacto".
- [ ] 7. Con un usuario sin permiso para Gestionar clientes: "Editar cliente" deshabilitado con el motivo.
- [ ] 8. Auditoría: al editar un cliente con borradores, un registro por borrador ("Datos del cliente actualizados
  desde su ficha").

**Para charlar con Facu (pendiente del 22/10):** el **tipo de cliente** tampoco se frena desde Gestionar clientes. Si
un cliente con viajes sin facturar pasa de directo a Rukas, o al revés, esos viajes quedan en un circuito que ya no le
corresponde. Se podría dejar deshabilitado, con el motivo, mientras tenga viajes sin facturar o proformas abiertas.

---

## 26. Motivos de los botones deshabilitados — PUSHEADO (`f2bc239`), OK EN VM (23/10)

Rocío notó que cada pantalla explicaba distinto por qué un botón estaba deshabilitado, y que algunos globitos no decían
qué acción estaba bloqueada ("Primero generá la proforma" en el botón de emitir factura). Se relevaron los 28 textos
(`docs/design-system/05-relevamiento-motivos-deshabilitados.md`, con el antes y el después de cada uno) y Rocío eligió
una sola forma, que quedó en el §1.4 del design system y en la lista de control de `AGENTS.md`:
**"No se puede {acción} {sobre qué}: {qué le pasa a esta fila}"** ("No se puede eliminar el chofer: está activo"). Sin
órdenes ("anulá la proforma"): la persona decide sabiendo qué implica.

- **Pantallas:** Gestionar choferes y camiones, Gestionar viajes (botones de la fila y la tarjeta "Listo para
  facturar"), Gestionar y Listar proformas (también "Editar cliente" sin permiso), proforma de Rukas ("Generar
  proforma" del pie), Gestionar presupuestos y Gestionar cuenta corriente. Solo cambian textos: nada de lógica ni de la
  API. Presupuestos y cuenta corriente son de Facu, pero es design system (no cambia cómo funcionan).
- **Eliminar un viaje que no está registrado** dice su estado ("está en viaje", "está entregado", "está listo para
  facturar") en lugar de "ya salió" (pedido de Rocío).
- **Lector de pantalla** (`SGTL.botonFila` y "Generar proforma" de Rukas): lee el mismo texto del globito, porque ya
  nombra la acción.

**Probar en la VM** (sin C#: `pull` y Ctrl+F5). Pasar el mouse por cada botón gris y leer el globito:
- [ ] 1. Gestionar choferes y camiones: el tacho de uno activo → "No se puede eliminar el chofer: está activo" / "…el
  camión: está activo".
- [ ] 2. Gestionar viajes: en un viaje facturado, lápiz, banderita y tacho → "No se puede editar el viaje: está
  facturado", "No se puede cambiar el estado: el viaje está facturado", "No se puede eliminar el viaje: está
  facturado". En uno de una proforma generada, lo mismo con "está en la proforma PF-…". El tacho de uno en un borrador
  ("está en el borrador de proforma #N"), de uno que vino de un presupuesto ("viene del presupuesto #N") y de uno en
  viaje o entregado ("está en viaje" / "está entregado").
- [ ] 3. Gestionar viajes → Cambiar estado de un viaje entregado de Rukas sin N° de entrega: la tarjeta "Listo para
  facturar" dice "No se puede marcar: falta cargar N° entrega Rukas.".
- [ ] 4. Gestionar proformas: un borrador (siguiente paso: "No se puede marcar como aceptada: la proforma todavía es un
  borrador"), una generada (lápiz: "No se puede editar la proforma: ya se generó"), una facturada (siguiente paso: "No
  se puede emitir la factura: ya se emitió FAC-…") y una anulada (siguiente paso y anular).
- [ ] 5. Listar proformas: una generada → "No se puede emitir la factura: la proforma todavía no está aceptada".
- [ ] 6. Proforma de Rukas: al registrarla, "Generar proforma" → "No se puede generar la proforma: falta elegir el
  Excel de Rukas"; en un borrador con diferencias → "…: hay N diferencias sin resolver".
- [ ] 7. Gestionar presupuestos: uno aceptado (lápiz: "No se puede editar el presupuesto: está aceptado"), uno
  pendiente (camión: "No se puede generar el viaje: el presupuesto todavía no está aceptado") y uno con viaje (lápiz,
  banderita, camión y tacho con "ya se generó el viaje #N" / "ya existe el viaje #N").
- [ ] 8. Gestionar cuenta corriente: en una factura, lápiz → "No se puede editar la factura: solo se editan los
  recibos" y anular → "No se puede anular la factura: se corrige con una nota de crédito"; en un recibo anulado, lápiz
  → "No se puede editar el recibo: está anulado".
- [ ] 9. Con un usuario sin permiso para Gestionar clientes, "Editar cliente" en una proforma → "No se puede editar el
  cliente: no tenés permiso".

---

## 27. Subtítulos de las secciones con un solo estilo — PUSHEADO (`3a3fa65`, `c831e1c`), OK EN VM (23/10)

Rocío vio que algunos modales tenían los subtítulos de sus secciones en azul y otros en negro. Los títulos de los
modales ya eran todos iguales; los subtítulos tenían cuatro estilos: `h6` (la plantilla Mazer los pinta de azul oscuro,
`#25396f`) en choferes, camiones, clientes, usuarios, tarifas, orígenes y destinos, e-mail y auditoría; `.bloque-titulo`
en proformas; `.cc-block-title` en cuenta corriente, y `.sgtl-bloque-titulo` (el del design system) en viajes y los
Ver detalle. Ahora los 48 subtítulos de esas 13 pantallas usan `.sgtl-bloque-titulo` (negro, chico, negrita, con
una línea fina abajo), y las copias de CSS de proformas y cuenta corriente se borraron. También las secciones de la
pantalla de WhatsApp. Regla en el §6.3 del design system y en el punto 7 de la lista de control de `AGENTS.md`.

- Quedan `h6` solo en títulos de tarjetas (dashboard, configuración) y en el encabezado: no son secciones.
- Proformas: `proformas-plataforma.js` buscaba la clase vieja para ocultar los títulos en la proforma de Rukas; se
  cambió a la nueva.
- **Tamaño:** pasa de 13 a 15 px (Rocío, 23/10, después de ver Registrar viaje con los dos). A 13 px casi no se
  distinguía de la etiqueta de un campo (12,8 px, también en negrita).

**Probar en la VM** (sin C#: `pull` y Ctrl+F5). Abrir cada formulario y ver que los subtítulos sean negros, chicos,
con su línea abajo y con aire arriba:
- [ ] 1. Registrar chofer, camión, cliente (también "Editar cliente" desde una proforma), usuario (con rol user: "Grupos
  *"), tarifa fija y por km, origen o destino.
- [ ] 2. Registrar proforma (Detalle de conceptos con sus dos botones, Totales, Condiciones comerciales), una de Rukas
  (los títulos que se ocultan siguen ocultos) y el ojo de Listar proformas.
- [ ] 3. Cuenta corriente: Registrar recibo (1 · Datos generales, 2 · Forma de pago, 3 · Imputación con su botón), el
  ojo de una factura con conceptos y comprobantes aplicados, y el detalle con "Trazabilidad".
- [ ] 4. Gestionar e-mail (Registrar configuración), Gestionar integración de WhatsApp y el detalle de un registro de
  auditoría (Valores anteriores / Valores nuevos).

---

## 28. Arreglos del reporte de la VM del 23/10 (§24 y §25) — PUSHEADO (`e7649d0` a `aef6e4a`), OK EN VM (23/10)

Reporte: `docs/pruebas/2026-10-23-viajes-y-proformas.md`. De 42 pruebas, 35 OK, 6 fallas leves y 1 sin probar; con el OK
de Rocío se generó el borrador 990100 (PF-00000011) y tomó los datos de la ficha de QUICKFOOD. Rocío aprobó el 23/10
los arreglos y las mejoras de abajo.

**Ya resuelto antes del reporte** (commits del 23/10 a la mañana, posteriores a `6ba727a`, el probado; se prueban con
§26 y §27): F6, el lector de pantalla que repetía el motivo de los botones deshabilitados (`f2bc239`), y los
subtítulos del modal de cliente en azul (`3a3fa65`, `c831e1c`).

**Arreglos y mejoras:**
- [x] **F1. El paso actual de Registrar proforma casi no se ve** (hecho 23/10). En Gestión de contenido está guardado un color de
  fondo casi blanco (`#e4eef8`), y el sistema usa ese color para la línea de arriba, los íconos de los títulos, las
  pestañas y el paso actual. Si el color elegido no se lee sobre blanco, esos detalles toman el color del menú (o, si
  tampoco se lee, el mismo color más oscuro). El fondo de la pantalla sigue con el color elegido. Además, "Restablecer" en
  Gestionar contenido deja la marca nueva (`#435ebe`): el `#e4eef8` guardado es el color de antes del 22/10.
- [x] **F2. "Sin viaje relacionado en SGTL" en dos renglones y la tabla del control 16 px más ancha a 1100 px** (hecho 23/10). El
  resultado pasa a "Sin viaje relacionado" (el grupo ya dice "Para corregir en SGTL"), el texto completo va en el
  globito del sistema (no en el del navegador) y, entre 992 y 1199 px, un poco menos de espacio entre columnas.
- [x] **F3. El chofer queda en rojo aunque ya diga "(opcional)"** (hecho 23/10). Al pasar a opcional se vuelve a validar el campo.
- [x] **F4. Ver detalle del usuario sin pie** (hecho 23/10). Pie "Registrado el …" con la fecha de alta, que la API ya manda. Quién lo
  registró y la última modificación necesitan cambiar el C# (`UsuariosController`, GET por id): queda para después.
- [x] **F5. Datos vacíos sin "—"** (hecho 23/10) (la base guarda columnas de largo fijo con espacios, como el teléfono fijo del
  chofer). Un dato con solo espacios se ve vacío, con su "—", en todos los Ver detalle.
- [x] **Buscador de cliente** (`select-cliente-predictivo.js`, hecho 23/10): la opción vacía ("Seleccioná un cliente", "Todos") no va
  en la lista, y al hacer clic en un campo con un cliente elegido se selecciona el texto, para que lo que se escribe
  lo reemplace.
- [x] **"Completar números de remito y entrega"** abre el modal con ese mismo título (§3.1), no "Editar viaje #N"
  (hecho 23/10).
- [x] **Volver de "Editar cliente" a la proforma** (hecho 23/10): aparece enseguida, sin esperar a que se relean los datos del
  cliente, y en el mismo lugar en el que estaba.
- [x] **"Responsable inscripto"** con mayúscula solo al principio (§9, hecho 23/10) en la proforma: el recuadro, la fila de Rukas y
  el PDF. Lo que se guarda no cambia. La factura, los recibos y los comprobantes (módulo de Facu) siguen como están.
- [x] **CUIT con guiones** en la lista de clientes de la proforma y en el PDF (hecho 23/10). El buscador encuentra el
  CUIT con guiones o sin ellos.
- [x] **Registrar proforma propia:** el título sin la etiqueta "Borrador" hasta que se guarda (hecho 23/10), como en la de Rukas.
- [x] **El PDF de un borrador no tiene "Enviar por e-mail":** queda así. Ya estaba en el §1.4 del design system: las
  proformas todavía no se envían por e-mail, así que su pie es Cerrar · Imprimir · Descargar PDF.
- [x] **Instructivo de la VM** (`docs/equipo/PRUEBAS-VM-CLAUDE.md`, hecho 23/10): generar una proforma deja sus viajes en Listo para
  facturar (pasan a Facturado con la factura), no en Facturado.

**Quedan como están o para después:**
- El punto azul de "Esperando a Rukas" en el globito del listado: es el color de ese grupo en el control; el naranja es
  solo el ícono del listado.
- Precio unitario de las líneas de la proforma con la máscara de montos (§7.3): **hablarlo con Facu**, porque cambia
  cómo se leen los montos en sus cálculos (`facturacion-proforma.js`).
- Los 404 de `api/TarifasFijas/PorRuta` y `api/DashboardLayout` en la consola: C# en dos controllers y no se ven en
  pantalla (ver F16).
- No se pudo probar que el camión inactivo no aparece (no hay ninguno inactivo). El usuario sin permiso (§25, paso 7)
  se prueba con el paso 9 de §26.

**Limpieza (la hace Rocío):**
- **Ya:** anular PF-00000011 desde Gestionar proformas. Está aceptada, lista para facturar, y tiene los viajes 25 y 26,
  que usan todos los Excel de prueba.
- **Después de la reprueba:** el borrador #40 (tacho) y el cliente 6, "Logística Pampeana S.R.L." (SQL del reporte,
  revisado). Sirven para probar los arreglos de la proforma.
- **Antes de la defensa** (no son de esta prueba): los choferes "Fede Prueba" (consultarlo con Fede: puede tener su
  celular para el WhatsApp) y "CLAUDE", y la "Calle Prueba" de Distribuidora del Sur, se ven en pantalla. Los viajes 14
  y 15 están en Registrado dentro de PF-00000006, aceptada: ver si hace falta corregirlos. El viaje #28 tiene 520 km
  porque así vino del presupuesto #1 (de Facu).
- **Avisarle a Facu:** su borrador #39 (Rukas 990120) quedó sin los viajes 25 y 26.

**Probar en la VM** (sin C#: `pull` y Ctrl+F5):
- [ ] 1. Registrar proforma con un cliente de Rukas: el paso actual (número y nombre) se lee; los íconos de los títulos
  de las pantallas se ven en color.
- [ ] 2. Borrador de Rukas con el 990100: "Sin viaje relacionado" en un renglón, con el globito del sistema al pasar el
  mouse; a 1100 px la tabla entra sin desplazarse hacia el costado.
- [ ] 3. Registrar viaje → Guardar vacío → elegir un cliente de Rukas: el chofer deja de estar en rojo.
- [ ] 4. Listar usuarios → Ver detalle: pie "Registrado el …".
- [ ] 5. Ver detalle del chofer Facundo Godoy: el teléfono particular con "—".
- [ ] 6. Registrar viaje: con la flecha, la primera opción de la lista es un cliente; clic en el campo con un cliente
  elegido y escribir: lo escrito reemplaza el nombre. Lo mismo en un filtro de cliente (Gestionar proformas).
- [ ] 7. Gestionar viajes: el botón "Completar números de remito y entrega" de un viaje en viaje abre el modal con ese
  título.
- [ ] 8. Borrador #40: desplazar un poco la proforma, "Editar cliente", cambiar un dato y guardar: la proforma vuelve
  enseguida y en el mismo lugar, con el dato nuevo.
- [ ] 9. El mismo borrador y su PDF: "Responsable inscripto" y el CUIT con guiones (también en la lista de clientes de
  la proforma, que lo encuentra escribiendo el CUIT con guiones o sin ellos); en una de Rukas, la fila del cliente
  igual.
- [ ] 10. Registrar proforma propia: el título sin la etiqueta "Borrador" hasta guardar.

---

## 29. Reprueba del 23/10: una falla nueva y mejoras — PUSHEADO (`cfe08c5` a `a1e2b8a`), OK EN VM (23/10); DOS MEJORAS DE CUENTA CORRIENTE SIN PUSH NI PRUEBA

Reporte: `docs/pruebas/2026-10-23-reprueba-viajes-y-proformas.md`. Los 22 puntos pedidos (§28, §26 y §27) dan OK. No se
pudieron ver, porque no hay datos así en la base: un viaje en viaje que no venga de un presupuesto, una proforma
Generada en Listar proformas, un presupuesto aceptado sin viaje, un recibo anulado y el detalle con "Trazabilidad" de
cuenta corriente.

**Falla:**
- [x] **F1. Escape con la lista de un buscador abierta cierra el modal entero** (hecho 23/10) (Registrar viaje: cliente, chofer). El
  buscador (`select-cliente-predictivo.js`) no frena el Escape y Bootstrap lo toma como "cerrar". Propuesta: con la
  lista abierta, Escape cierra solo la lista; con la lista cerrada, sigue cerrando el modal como siempre.

**Mejoras** (con la recomendación):
- [x] **Buscador** (hecho 23/10): si se elige con Enter y después se hace clic en el mismo campo, el texto no se selecciona y lo
  escrito se mete en el medio ("QUICKFOOD SPamp.A."). Seleccionar el texto en cada clic mientras haya uno elegido.
  Hacerla ya.
- [x] **"Solo se…" en cuenta corriente** (hecho 23/10) ("No se puede editar la factura: solo se editan los recibos"): el §1.4 del
  design system ya lo permite cuando el motivo es el tipo de la fila, pero la lista de control de `AGENTS.md` dice "sin
  'Solo se…'" sin la excepción. Sumar la excepción a `AGENTS.md`; los textos quedan. Hacerla ya.
- [x] **Lápiz de una proforma anulada:** dice "ya se generó"; que diga "está anulada" (hecho 23/10).
- [x] **Aire arriba de dos subtítulos** (hecho 23/10): "Plantilla predeterminada" (Registrar configuración de e-mail, 8 px) y
  "Totales" (proforma propia, 16 px), con 24 px como el resto. Hacerla ya.
- [x] **Ver recibo** (hecho 23/10) muestra el subtítulo del alta ("Registrar cobranza e imputar facturas pendientes."): sacarlo al ver
  y al editar. Solo texto (módulo de Facu). Hacerla ya.
- [ ] **Ver factura sin "Comprobantes aplicados":** ese bloque muestra lo que cancela el comprobante (sirve en notas de
  crédito y débito); los recibos aplicados a una factura no están en esa lista. Mostrarlos sería algo nuevo en el
  módulo de Facu: hablarlo con él.
- [x] **Registrar usuario tarda 4 a 5 s "sin señal":** medido en la VM (23/10, `docs/pruebas/2026-10-23-reprueba-29.md`):
  el botón muestra "Guardando…" todo el tiempo y la demora es el POST (3,9 s). La causa es el hash de la contraseña:
  PBKDF2-SHA256 con 600.000 iteraciones (`Security/ContrasenasSeguras.cs`, lo que recomienda OWASP), que en .NET
  Framework 4.8 lleva unos segundos; pasa también al iniciar sesión. Bajar las iteraciones es una decisión de
  seguridad del merge de Facu (§21): **hablarlo con él** si molesta.
- [ ] **Guardar un cliente tarda 2 a 3 s** (el PUT actualiza los borradores, uno por uno, con su registro en
  Auditoría). Se puede acelerar en el C# (`DatosClienteProforma.ActualizarBorradores`): dejarlo para después.

**Limpieza (la hace Rocío):**
- **Ya:** los borradores #42 (Rukas 990100, con los viajes 25 y 26) y #40 con el tacho; después, el cliente 6 con el
  SQL del reporte (revisado).
- **El usuario de prueba mledesma (15):** inactivarlo desde Gestionar usuarios; sirve para la próxima prueba de
  permisos. Borrar el archivo con su clave en la VM (`C:\pruebas-sgtl\reportes\2026-10-24-usuario-prueba.txt`).
- **Antes de la defensa:** el concepto "preubaaaa888" de FAC-00000005, además de lo anotado en §28.
- **El usuario de prueba lfernandez (16, admin), de la reprueba de la §29:** inactivarlo ya (es administrador) y borrar
  el archivo con su clave en la VM (`C:\pruebas-sgtl\reportes\2026-10-23-usuario-prueba-29.txt`).

**Probar en la VM** (sin C#: `pull` y Ctrl+F5). Rocío aprobó el 23/10 la falla y las mejoras marcadas "hacerla ya":
- [x] 1. Registrar viaje: abrir la lista de clientes y apretar Escape: se cierra la lista y el modal sigue abierto,
  con lo cargado. Otra vez Escape (con la lista cerrada): ahora sí se cierra el modal. Lo mismo con el chofer.
- [x] 2. Elegir un cliente con Enter y, sin salir del campo, hacer clic en él y escribir: lo escrito reemplaza el
  nombre. En Registrar viaje y en el filtro de cliente de Gestionar proformas.
- [x] 3. Gestionar proformas: el lápiz de una anulada dice "No se puede editar la proforma: está anulada".
- [x] 4. Registrar configuración de e-mail ("Plantilla predeterminada") y Registrar proforma ("Totales"): el mismo
  espacio arriba del subtítulo que en las demás secciones.
- [x] 5. Cuenta corriente: Ver recibo y Editar recibo sin el subtítulo "Registrar cobranza e imputar facturas
  pendientes."; Registrar recibo lo sigue mostrando.

**Resultado en la VM (23/10):** los 6 puntos OK (`docs/pruebas/2026-10-23-reprueba-29.md`). Salieron dos mejoras más,
de cuenta corriente (módulo de Facu, solo texto), para decidir:
- [x] **Pie de "Ver recibo":** dice "Cancelar"; en un modal de solo lectura va "Cerrar" (§6.2), como en Ver factura
  (hecho 23/10).
- [x] **Título de "Editar recibo":** "Editar recibo · REC-00000004", con un punto que no lleva "Ver recibo REC-00000004"
  ni los demás títulos ("Ver factura FAC-00000012", "Editar viaje #47"). Sacarle el " · " (hecho 23/10).

**Probar en la VM** (cuando Rocío lo pida; sin C#: `pull` y Ctrl+F5):
- [ ] 1. Cuenta corriente: Ver recibo REC-00000004 → el pie dice solo "Cerrar".
- [ ] 2. Editar recibo de uno emitido → título "Editar recibo REC-…" (sin " · ") y pie Cancelar · Guardar. Salir con
  Cancelar.
- [ ] 3. Registrar recibo → pie Cancelar · Emitir recibo, también después de haber abierto un Ver recibo.

---

## 30. Gestionar empresa: los datos y el logo de la empresa en los documentos — PUSHEADO (`cdbcd76`, `16b05c4`), FALTA PROBAR EN VM (23/10)

Pedido de Rocío (23/10), charlado con Facu. Hasta ahora el único dato de la empresa era "Transporte Sánchez" escrito en
los PDF (factura, proforma y presupuesto), sin CUIT, domicilio ni contacto, y el logo de los documentos era el de la
apariencia del sistema: con "Restablecer", todos los comprobantes salían con el de SGTL. Ahora los datos y el logo de
la empresa se cargan en Configuración → **Gestionar empresa** y los documentos los leen de ahí.

**Decisiones de Rocío:**
- **SGTL es el sistema y la empresa lo usa:** dos pantallas en Configuración, en este orden: Gestionar e-mail ·
  Gestionar integración de WhatsApp · **Gestionar empresa** (nueva: datos fiscales, logo para los documentos, domicilio y
  contacto) · **Gestionar contenido** (se queda con su nombre y solo la apariencia: logo del sistema, colores y pie). No va
  en Facturación porque los datos de la empresa también salen en los presupuestos (Viajes). Se probaron antes "todo
  junto en una pantalla" (idea de Facu) y pestañas; con dos logos en la misma pantalla no quedaba claro cuál cambiar.
- **Dos logos:** el **logo de la empresa** (opcional) sale solo en los documentos; sin él, el nombre en texto, nunca el
  de SGTL. El **logo del sistema** va en el menú y el login; si la empresa quiere su marca en el sistema, lo cambia en
  Gestionar contenido y no toca los documentos. El de la empresa arranca vacío (no se copia el de la apariencia: no se
  sabe si es el de SGTL).
- **Diseño de Gestionar empresa** (maqueta aprobada: `.claude/maquetas/gestion-empresa.html`, no se commitea): los datos
  fiscales en 2 × 2 con el logo en un recuadro al lado, y abajo domicilio y contacto lado a lado.
- **Un documento ya emitido conserva los datos y el logo con que se emitió**, como ya pasa con los del cliente: la tabla
  guarda versiones con la fecha desde la que valen, y cada PDF pide la de su fecha de emisión. Lo que se emita después de
  guardar (y los borradores) sale con los datos nuevos.
- **Nada escrito en el código:** se sacó "Transporte Sánchez" de los tres PDF y del texto del reclamo a Rukas ("no
  corresponde a ninguno de nuestros viajes"). Si no se pueden leer los datos, el PDF no se arma y avisa. Queda como
  regla en `AGENTS.md`.
- Obligatorios: razón social, CUIT, condición de IVA y domicilio (provincia, localidad, calle y altura). El nombre
  comercial, si está, va en grande y la razón social debajo (ejemplos en `.claude/maquetas/pdf-empresa/`: con logo, sin
  logo y sin logo ni nombre comercial).
- En Gestionar contenido, la ayuda del color del menú dice "el círculo con las iniciales del usuario (arriba a la
  derecha)" (antes "el círculo de las iniciales", que no se entendía).

**Qué se hizo:**
- `database/empresa/01_crear_empresa.sql`: tabla `EMPRESA` (columnas como en `CLIENTES`, más `Logo`). Idempotente. La
  primera versión del script creaba una fila con solo "Transporte Sánchez" (vigente desde el 01/01/2000), que Rocío
  completó con la primera carga; desde el reporte de la VM la tabla arranca vacía (ver abajo).
- `GruposController.cs`: el permiso "Gestión de empresa" en el catálogo, en Configuración.
- `EmpresaController.cs` (nuevo, sumado al `.csproj`): `GET api/empresa` (los actuales) y `GET api/empresa?fecha=AAAA-MM-DD`
  (los que valían ese día), sin sesión como `GestionContenido`; `PUT api/empresa` solo administradores, valida igual que
  la pantalla (también formato y tamaño del logo), no agrega versión si no cambió nada y deja la auditoría (entidad
  `EMPRESA`, con el antes y el después; el logo, resumido).
- `gestion-empresa.html` (nueva) y `gestion-contenido.html` (solo la apariencia, con el diseño nuevo: bloques, el logo
  como archivo cargado con "Reemplazar logo", sin el campo de dirección web que quedaba deshabilitado). Las dos leen el
  logo con `leerArchivoLogo` (`gestionContenido.js`). Estilo del recuadro: `.sgtl-zona-recuadro` en `sgtl.css`.
- `assets/static/js/empresa-datos.js` (nuevo, `SGTLEmpresa.obtener(fecha)`), usado por `factura-pdf.js` (también
  recibos y notas), `proforma-pdf.js` y `presupuesto-pdf.js`; lo cargan cuenta corriente, Gestionar y Listar proformas
  y presupuestos. Los tres dejaron de leer `GestionContenido` y muestran el logo de la empresa sin deformarlo (la
  proforma, además, antes no mostraba un logo que no fuera una imagen subida).
- Menú (`sidebar-loader.js`): el orden nuevo y Gestionar empresa entre las pantallas solo de administradores. Design
  system: §3.1, §3.2, §6.2 (recuadro), §11, §12, apéndice A y la tabla de funciones.
- `tests/empresa-documentos.test.js` (nuevo): los PDF sin el nombre escrito ni el logo de la apariencia, cada pantalla
  con `empresa-datos.js`, cómo se arman los renglones, que cada documento pida su fecha, los ids de las dos pantallas y
  el orden del menú.

**Para tener en cuenta:**
- **El orden importa:** sin el script, la API no encuentra la tabla y **los PDF no se arman**. Correrlo antes de probar
  (y avisar a Facu y Fede, porque la base es compartida y sus ramas también van a necesitar este código).
- **Módulo de Facu:** los tres PDF son suyos. En la factura se sacó el renglón "Documento interno de gestión comercial"
  para hacer lugar a CUIT, domicilio y contacto (siguen "NO VÁLIDO COMO COMPROBANTE FISCAL" y "DOCUMENTO DE USO INTERNO").
  Contárselo, y también que al final quedaron dos pantallas en lugar de "todo junto".
- La versión se elige por día: si se cambian los datos, lo emitido **ese mismo día** antes del cambio sale con los
  datos nuevos. La proforma generada usa su `FechaEmision`, que hoy se guarda en UTC (§2): después de las 21 h puede
  tomar el día siguiente.
- **Permisos** (revisados el 23/10, pedido de Rocío; desde ahora es regla para toda pantalla nueva en `AGENTS.md`):
  Gestionar empresa funciona igual que Gestionar e-mail. Solo la ven y la abren los administradores: el menú esconde
  Configuración entera, la página manda al inicio a quien no es admin (está en las dos listas de `sidebar-loader.js`,
  que mira el rol guardado y el que devuelve la API) y `PUT api/empresa` también rechaza a quien no es admin. Leer los
  datos no pide permiso, como `GestionContenido`: todos los usuarios arman PDF. En Grupos y permisos aparece "Gestión de
  empresa" en Configuración, junto a E-mail, Gestión de contenido e Integración WhatsApp (decisión de Rocío, para que
  quede unificado): como esos, tildarlo **no da acceso**, porque la sección es solo de administradores. Queda en el
  pendiente "permisos que no dan acceso" para verlo con Facu, todos juntos. La API lo crea sola en la base la primera vez
  que se abre Grupos y permisos (`GruposController`, sin script). El de Gestionar contenido sigue llamándose "Gestión de
  contenido". Un PDF con logo pesa unos 400 KB (la imagen va sin comprimir, como
  antes con el de la apariencia).
- `views/sidebar-active.html` (del primer commit, no lo carga ninguna pantalla) todavía dice "Transporte Sanchez" en el
  título: se puede borrar cuando se limpie el repo.

**Probar en la VM** (con C#: `pull`, recompilar la API y Ctrl+F5):
- [ ] 0. Rocío corre `database/empresa/01_crear_empresa.sql` en SSMS: al final muestra la fila 1 "Transporte Sánchez".
- [ ] 1. Configuración: Gestionar e-mail · Gestionar integración de WhatsApp · Gestionar empresa · Gestionar contenido.
  Con un usuario que no es admin, Configuración no aparece y escribir `gestion-empresa.html` en la dirección lo manda al
  inicio (igual que `configuracion-email.html`). Gestionar grupos y permisos → Permisos: en Configuración aparecen
  Gestionar e-mail, Gestionar integración de WhatsApp, Gestionar empresa y Gestionar contenido (con los textos del
  menú desde el 23/10; en la base siguen E-mail, Integración WhatsApp, Gestión de empresa y Gestión de contenido).
- [ ] 2. Gestionar empresa: el aviso amarillo "Faltan el CUIT y el domicilio…", la razón social cargada, el recuadro
  "Sin logo: sale el nombre en texto" con "Elegir logo" y "Todavía no se completaron.". Guardar con los campos vacíos:
  "Revisá los campos marcados.", cada error debajo de su campo y el cursor en el primero.
- [ ] 3. Completar los datos reales, elegir el logo de Transporte Sánchez (el recuadro dice "Sin guardar") y Guardar:
  "Datos de la empresa guardados.", "Última modificación: usuario · fecha y hora", el recuadro con el logo y se va el
  aviso amarillo. Guardar otra vez sin tocar nada: "No había cambios para guardar.".
- [ ] 4. Ver PDF de una factura ya emitida (cuenta corriente), de un recibo, de una proforma generada y de un
  presupuesto: salen el logo, el nombre, CUIT y condición de IVA, domicilio y contacto recién cargados (la primera carga
  vale también para los documentos viejos). Enviar uno por e-mail: el adjunto también.
- [ ] 5. Cambiar un dato (por ejemplo, el teléfono) y Guardar: el PDF de una factura de un día anterior sigue con el
  teléfono de antes; un borrador de proforma, con el nuevo. Después dejar el dato como estaba (queda otra versión, no
  molesta).
- [ ] 6. "Quitar logo" y Guardar: los PDF salen con el nombre en texto, sin logo. Después volver a subirlo.
- [ ] 7. Gestionar contenido: solo la apariencia, con el subtítulo que dice que no cambia los documentos. Cambiar el
  color del menú y Guardar ("Apariencia guardada.", se pinta enseguida); "Reemplazar logo" con otro PNG y Guardar: cambia
  el menú, **no** los PDF. "Restablecer valores por defecto" pide confirmación (dice que los datos y el logo de la
  empresa no cambian) y vuelve a la marca SGTL: los PDF siguen con el logo de la empresa.
- [ ] 8. Auditoría: filas de `EMPRESA` con el antes y el después de lo que cambió (el logo, resumido).
- [ ] 9. Proforma de Rukas con un transporte que no es nuestro: el reclamo dice "no corresponde a ninguno de nuestros
  viajes".

**Resultado en la VM (23/10):** `docs/pruebas/2026-10-23-gestionar-empresa.md`. 27 de 29 OK, 2 sin probar (el `PUT` con un
usuario que no es admin, que la sesión de la VM no pudo mandar, y el envío por e-mail, por F1). Ninguna falla de la §30:
cada PDF pide la versión de su fecha, ninguno sale con el logo de SGTL y Gestionar contenido no toca los documentos.
Rocío hizo la primera carga con los datos reales (versión 1); la VM creó las versiones 2 a 5 y dejó la 5 igual a la 1.
En Gestionar contenido, la VM pisó sin querer un cambio que Facu guardó en medio de la prueba y después lo volvió a
cargar: quedó como lo dejó Facu (fondo `#6d8cab`, menú `#2f89c1`).

**Hecho después del reporte (23/10), con el OK de Rocío o porque lo pide el design system:**
- [x] **Sin el aviso "Faltan el CUIT y el domicilio…"** (no se entendía: CUIT y domicilio son obligatorios). Solo aparecía
  entre el script y la primera carga. El script ya no crea una empresa con solo el nombre: la tabla arranca vacía,
  Gestionar empresa muestra el formulario vacío ("Todavía no se cargaron.") y los PDF no se arman y dicen "Todavía no
  están cargados los datos de la empresa. Completalos en Configuración → Gestionar empresa.". La primera carga vale
  también para los documentos de antes (la API usa la versión más vieja). En la base del equipo no cambia nada.
- [x] **Proforma con logo:** el nombre comercial va en grande al lado del logo y la razón social debajo, como en la
  factura (antes iba chico, como un renglón más).
- [x] **F2 (presupuestos, sesión vencida):** con un 401, además del aviso, lleva al login (§9).
- [x] **PDF de la factura y el recibo** (de antes de la §30): "Condición fiscal: Responsable inscripto" con el espacio y
  la mayúscula solo al principio (§9); "SIN VALIDEZ FISCAL" en dos renglones, dentro del recuadro de la "I"; y el pie
  "Generado: DD/MM/AAAA HH:MM" en 24 h, sin "p. m." (§7.2).

**Decidido por Rocío (23/10):**
- [ ] **F1, contraseña SMTP en la VM — pendiente para ver con Facu (módulo de e-mail).** No está roto: la API cifra la
  contraseña con la clave de la PC donde corre (`MachineKey`, sin `<machineKey>` en `Web.config`) y la base es
  compartida, así que solo puede mandar e-mails la PC que guardó la contraseña por última vez. Con un solo servidor (el
  sistema en producción) no pasaría. Propuesta para Facu: una clave común para todo el equipo, guardada fuera de git
  (por ejemplo, un archivo de configuración aparte que no se commitea). Mientras tanto, para mandar e-mails desde la VM
  (por ejemplo, en la presentación), volver a guardar la contraseña desde la VM en Gestionar e-mail, sabiendo que
  después la PC de Facu no va a poder mandar hasta que la vuelva a guardar él.
- [x] **CABA en Provincias** (hecho 23/10). Verificado en la base con dos consultas de solo lectura: `PROVINCIAS` tiene
  23 y no está CABA, ni como provincia ni como localidad, y ningún barrio porteño quedó cargado por error en otra
  provincia (los que coinciden son localidades reales: Saavedra y San Nicolás de los Arroyos en Buenos Aires, Nueva
  Pompeya en Chaco…). `database/localidades/02_agregar_caba.sql` agrega la provincia "Ciudad Autónoma de Buenos Aires"
  con la Ciudad y sus 48 barrios como localidades (idempotente, con diagnóstico primero). La lista de provincias de la
  API pasa a orden alfabético (`ProvinciasController`), para que CABA no quede al final. Sirve para clientes, choferes,
  orígenes, destinos y la empresa.
- [ ] **Auditoría de EMPRESA con códigos** (`Cond_Fiscal "1"`, `ProvID "5"`, `LocID`): pendiente. Toda la auditoría
  muestra códigos; si se mejora, que sea para todas las tablas (nombres en lugar de ids).
- [ ] **Quien no es admin, al entrar a una pantalla de Configuración**, pasa por el Dashboard (unas 12 consultas) antes de
  llegar a su inicio: pendiente, baja. Mandarlo directo a su primera pantalla permitida (`sidebar-loader.js`).
- Sin cambios: el destinatario del e-mail viene con el del cliente (está bien para el uso real) y el guardado de la
  empresa tarda unos 3 s (Azure y la auditoría; el botón muestra "Guardando…").

**Limpieza:** no hace falta. Las versiones 2 a 4 son del mismo día que la 5 y la API siempre toma la última del día,
así que ningún documento las usa; quedan como historial, igual que en Auditoría.

**Reprueba en la VM** (con C#: `pull`, recompilar la API y Ctrl+F5; no hay que correr nada en la base):
- [ ] 1. Gestionar empresa: sin el aviso amarillo; los datos de Rocío y "Última modificación: …".
- [ ] 2. Ver PDF de una proforma generada: el logo y, a su derecha, "Transporte Sánchez" en grande con la razón social
  debajo; abajo, CUIT y condición de IVA y domicilio.
- [ ] 3. Ver PDF de una factura y de un recibo: "Condición fiscal: Responsable inscripto" (con espacio, "inscripto" en
  minúscula), "SIN VALIDEZ" y "FISCAL" en dos renglones dentro del recuadro de la "I", y el pie "Generado: DD/MM/AAAA
  HH:MM" en 24 h.
- [ ] 4. Presupuestos con la sesión vencida (más de 30 minutos): Enviar por e-mail → "Tu sesión venció. Volvé a iniciar
  sesión." y, enseguida, el login.
- [ ] 5. CABA: `database/localidades/02_agregar_caba.sql` **ya está corrido** (Rocío, 23/10: provincia con `Prov_ID` 24
  y 49 localidades agregadas). En Gestionar empresa, Registrar
  cliente y Registrar origen, la lista de provincias va en orden alfabético con "Ciudad Autónoma de Buenos Aires" entre
  Chubut y Córdoba, y al elegirla aparecen la Ciudad y los barrios (Palermo, Recoleta…). No guardar nada.

---

## 31. Tarifas: vigencias, neto y fecha del viaje — PUSHEADO (`1ca5d87` a `4ee7ef3`), OK EN VM (23/10)

Lo encontró Facu (23/10): Gestionar tarifas dejaba registrar, para QUICKFOOD Sede Quilmes → Sede Banfield, la tarifa
#5 (01/10/2026 al 31/12/2026) aunque ya estaba la #4 (20/10/2026 al 31/10/2026). Con dos tarifas vigentes el mismo día,
el viaje toma una sin avisar. También preguntó para qué están "Valor de ruta" y "Valor de vuelta vacío" si el sistema
usa el neto. Al revisarlo aparecieron tres cosas más, que Rocío decidió el mismo día.

**Decisiones de Rocío (23/10):**
- **Vigencias:** un cliente no puede tener dos tarifas fijas del mismo recorrido vigentes el mismo día.
- **El neto lo calcula el sistema: ruta + vuelta vacío.** El precio de una ruta se arma así. Si con un cliente se negocia
  no cobrarle la vuelta, es siempre igual para ese cliente en esa ruta: su tarifa lleva vuelta vacío en 0 (no hace
  falta que el viaje elija). Hasta ahora el sistema usaba solo el neto, escrito a mano, y ruta y vuelta no se usaban:
  la #5 de Facu (ruta $150.000, vuelta $35.000, neto $0) le daba $0 a un viaje.
- **El viaje toma la tarifa vigente en su fecha de inicio**, la fija y la por km. Antes la fija buscaba la vigente
  **hoy** (un viaje del 28/10 cargado el 02/11 tomaba la de noviembre) y, si no había, la más reciente aunque estuviera
  vencida; la por km pedía que todo el viaje entrara en la vigencia (un viaje del 31/12 al 01/01 quedaba sin tarifa).
- **Tarifas por km sin superponerse**, como las fijas. Cada banda va de **más del mínimo hasta el máximo inclusive**
  ("hasta 100 km"), así se encadenan con el mismo número (0 a 100, 100 a 500): un viaje de 100 km va a la primera y
  no queda hueco para los decimales (con 0 a 100 y 101 a 500, uno de 100,5 km no tenía tarifa).
- Los datos que ya están en la base se revisan y se corrigen con estas reglas (script abajo).

**Qué se hizo:**
- `TarifasController.cs`:
  - Fija: rechaza la que comparte al menos un día con otra del mismo cliente, origen y destino (al editar no se compara
    consigo misma; una que empieza el día siguiente se puede cargar). "Este cliente ya tiene la tarifa fija #4 para el
    mismo recorrido, del 20/10/2026 al 31/10/2026. Cambiá las fechas para que no se superpongan o editá esa tarifa."
  - Fija: guarda **neto = ruta + vuelta vacío** (no lee el neto que llega). La ruta tiene que ser mayor que cero y la
    vuelta, cero o más. Los mensajes de cliente, origen y destino vacíos, en voseo (§9).
  - Km: rechaza la que comparte al menos un día y su banda se pisa con otra (que se toquen en el borde está bien). "Ya
    está la tarifa por km #7, del 01/01/2026 al 31/12/2026, para más de 100 y hasta 1.000 km. Cambiá las fechas o los
    km…". El valor por km tiene que ser mayor que cero y el máximo, mayor que el mínimo.
- `TarifasFijasController.cs` (`PorRuta`): recibe `fecha` (AAAA-MM-DD, el inicio del viaje; sin fecha, hoy) y devuelve
  la vigente ese día; si no hay, 404.
- `TarifasKmController.cs` (`Calcular`): la vigente en la fecha de inicio, con la banda de más del mínimo hasta el
  máximo inclusive.
- `gestion-tarifas.html`: ruta y vuelta vacío obligatorios, como montos (§7.3: "150.000,00", con máscara, ya no
  `type="number"`); el neto se ve como texto y se actualiza al escribir ("Ruta + vuelta vacío, sin IVA"); ayuda "0 si a
  este cliente no se le cobra la vuelta en esta ruta". Origen y destino muestran solo los del cliente elegido ("Elegí el
  cliente" hasta elegirlo, como en Gestionar viajes): antes se podía cargar una tarifa con el origen de otro cliente,
  que ningún viaje encuentra. Tarifa por km: valor como monto y obligatorio, ayuda de las bandas debajo de los km, y el
  filtro "Km del viaje" con el mismo borde.
- `gestion-viajes.html` y `presupuestos.js` (módulo de Facu, con el OK de Rocío): la tarifa fija se busca con la fecha
  de inicio y se vuelve a buscar al cambiarla; sin inicio, "Completá el inicio para buscar la tarifa fija."; sin tarifa
  ese día, "No hay tarifa fija de esta ruta para el 15/02/2027. Elegí Por km o cargala en Gestionar tarifas." (en
  presupuestos, con el enlace). En presupuestos, "Tarifa fija #4, vigente el 28/10/2026." en lugar de "Se utiliza la
  tarifa vigente o la más reciente…".
- **Fecha escrita a mano** (de antes, se vio al probar): si se escribía la fecha y se hacía clic afuera, el calendario
  la guardaba sin avisar el cambio y la tarifa no se recalculaba (pasaba también con la por km). En viajes y
  presupuestos ahora se revisa al cerrar el calendario. Las demás pantallas no dependen de eso para calcular nada.
- `database/tarifas/01_revisar_tarifas.sql` (nuevo): muestra lo que no cumple las reglas (fijas cuyo neto no es ruta
  + vuelta, superpuestas, con origen o destino de otro cliente; por km todas juntas, superpuestas y con huecos entre
  bandas) con la cantidad de viajes de cada una. Con `@Aplicar = 1` corrige solo lo que no cambia importes: las fijas
  con solo el neto cargado pasan ese neto a la ruta (deja la transacción abierta para COMMIT o ROLLBACK).
- Probado en la Mac con una API simulada con la misma lógica (datos inventados): superposición de fijas y por km,
  borde de las bandas, neto en vivo, alta y edición, orígenes por cliente, y en viajes y presupuestos la tarifa del
  28/10, del 02/11 y el aviso sin tarifa, también con la fecha escrita a mano.

**Para tener en cuenta:**
- **El viaje no guarda el importe, lo lee de la tarifa.** Cambiar el neto de una tarifa (o guardarla de nuevo con
  ruta + vuelta distinto del neto viejo) cambia el importe de todos sus viajes, también en el detalle del viaje y en el
  costo del dashboard; las proformas y facturas ya emitidas no. Por eso el script no toca las que no suman: se deciden
  una por una.
- Una tarifa con solo el neto cargado se abre con ruta $0,00 y no se puede guardar hasta completar la ruta. En la base
  del equipo no quedó ninguna (ver abajo).
- Los viajes ya cargados conservan su tarifa; lo nuevo vale al registrar o al cambiar fechas, ruta o tipo de tarifa.
- La API de viajes no controla que la tarifa elegida sea la de la fecha (la elige la pantalla). Se puede sumar si hace
  falta.
- `tests/` no tiene pruebas de tarifas y en la Mac no hay Node: no se agregó una prueba.
- **Contarle a Facu:** la respuesta a su mensaje, y que presupuestos ahora busca la tarifa fija con la fecha de inicio.

**Datos revisados y corregidos (23/10):** Rocío corrió el script (`@Aplicar = 0`): ninguna fija "se corrige sola",
ninguna con origen o destino de otro cliente y ninguna por km superpuesta. Con su OK corrió este cambio (`BEGIN TRAN`,
8 filas, `Usu_Modi` "script tarifas 01"), que no cambia el importe de ningún viaje:
- Fijas (las tres de prueba y sin viajes): **#1** ruta 120.000 y vuelta 130.000 (sumaban 250.001,09 con neto 250.000);
  **#4** vuelta 50.000 (sumaba 150.500 con neto 200.000); **#5** desde el 01/11/2026 y neto 185.000 (tenía neto 0 y se
  pisaba con la #4). Quedan la #4 en octubre ($ 200.000) y la #5 en noviembre y diciembre ($ 185.000), que sirven para
  probar el cambio de tarifa por fecha. **Contarle a Facu** (eran sus pruebas).
- Por km: los mínimos pasan al máximo de la banda anterior (#5 1→0, #4 21→20, #3 101→100, #2 501→500, #1 901→900).
  Con la regla nueva, un viaje de 21 km exactos quedaba sin tarifa; los km enteros caen en la misma banda que antes y
  ya no hay huecos para los decimales (un viaje de 20,5 km no tenía tarifa). El viaje guarda su tarifa y su importe es
  valor por km × km, así que cambiar la banda no cambia importes.
- **Para más adelante:** las bandas de 0 a 100 km (#5 y #4) valen solo en 2026; desde el 01/01/2027 un viaje de menos
  de 100 km no tiene tarifa por km hasta que se carguen las de 2027 (las de más de 100 km valen hasta fin de 2027).
- Con el código que hoy está en la VM (sin estos commits), los datos corregidos dan lo mismo que antes: cada km entero
  cae en la misma banda (la de banda más angosta, como antes) y un viaje cargado en octubre sigue tomando la fija #4.

**Pendiente después de la presentación: valores más reales (decidido por Rocío el 23/10, no tocar antes de presentar).**
Los valores cargados son de prueba (850 $/km para viajes cortos, y el precio por km sube con la distancia, cuando en
la realidad baja). Se le pidieron a Claudia los reales; si no llegan, propuesta estimada con la referencia de granos de
FADEEAC de marzo de 2026 (por tonelada: ~$25.389 a 100 km, ~$77.700 a 500 km, ~$148.417 a 1.500 km; para un semi de
28 t, ~7.100, 4.350 y 2.770 $/km) y la suba de costos del año. Sin IVA:

| Tarifa | Banda | Hoy | Propuesta | Ejemplo |
|---|---|---|---|---|
| km #5 | 0 a 20 km | $ 850 | $ 8.000 (y hasta el 31/12/2027) | 15 km → $ 120.000 |
| km #4 | 20 a 100 km | $ 1.000 | $ 6.500 (y hasta el 31/12/2027) | 60 km → $ 390.000 |
| km #3 | 100 a 500 km | $ 1.800 | $ 5.200 | 300 km → $ 1.560.000 |
| km #2 | 500 a 900 km | $ 2.500 | $ 4.200 | 700 km → $ 2.940.000 |
| km #1 | 900 a 3694 km | $ 4.000 | $ 3.400 | 1.200 km → $ 4.080.000 |
| fija #5 | Quilmes → Banfield, nov. y dic. | $ 185.000 | $ 210.000 (157.500 + 52.500) | más cara que octubre ($ 200.000), no más barata |

- Fijas #1 y #2 (QUICKFOOD Sede 1 → VAFOOD): ajustar según la distancia entre las sedes (sacarla de las localidades o
  del promedio de km de los viajes de esa ruta).
- **Cómo aplicarlo:** primero ver cuántos viajes de cada tarifa están facturados o en una proforma no anulada
  (`PROFORMAS_VIAJES` + `PROFORMAS.Estado`), porque el viaje lee el importe de la tarifa. Si se pisan los valores, sus
  26 viajes muestran el importe nuevo en el detalle y el dashboard (las facturas y proformas emitidas no cambian; los
  borradores de Rukas muestran diferencias). Si no se quiere eso, cerrar las tarifas actuales el día anterior y cargar
  las nuevas desde el día siguiente. `UPDATE` con `BEGIN TRAN`, guardas por ID y valor actual, `Usu_Modi` "script
  tarifas 02" (varchar 20) y `-- COMMIT; o ROLLBACK;`.
- Con cualquier tabla por bandas, un viaje apenas más largo que un borde puede salir más barato (100 km a $ 6.500 =
  $ 650.000; 101 km a $ 5.200 = $ 525.200): los valores propuestos dejan esa baja pareja, ~20 % en cada borde.
- Después, actualizar en los pasos de la VM de abajo los importes (paso 7: la #5 pasa a $ 210.000; paso 8: 50 km ×
  $ 6.500 = $ 325.000).

**Probar en la VM** (con C#: `pull`, recompilar la API y Ctrl+F5):
- [x] 0. Revisar y corregir los datos con `database/tarifas/01_revisar_tarifas.sql`: hecho por Rocío el 23/10 (arriba).
- [ ] 1. Gestionar tarifas → Registrar tarifa fija: Origen y Destino dicen "Elegí el cliente"; al elegir QUICKFOOD
  aparecen solo sus orígenes y destinos. Ruta 150000 → al salir, "150.000,00"; vuelta 35000 → el neto dice
  "$ 185.000,00" mientras se escribe.
- [ ] 2. QUICKFOOD, Sede Quilmes → Sede Banfield, del 15/10/2026 al 25/10/2026 → Guardar: dentro del modal, "Este cliente
  ya tiene la tarifa fija #4 para el mismo recorrido, del 20/10/2026 al 31/10/2026. Cambiá las fechas…". No se crea nada.
- [ ] 3. Mismo recorrido, del 01/01/2027 al 31/01/2027 (empieza el día siguiente a que termina la #5) → "Tarifa
  registrada." con $ 185.000,00 en la tabla. Después, eliminarla.
- [ ] 4. Ruta vacía o 0 → "Completá el valor de ruta." / "Tiene que ser mayor que cero."; vuelta vacía → "Completá el
  valor de vuelta vacío (0 si no se cobra)."; vuelta 0 → se puede.
- [ ] 5. Editar una tarifa de otro recorrido y Guardar sin cambios: "Tarifa guardada." (no se compara consigo misma).
- [ ] 6. Tarifas por km → Registrar del 01/01/2026 al 31/12/2026, $ 1.500 por km, de 50 a 200 km → error que nombra la
  #3 (más de 100 y hasta 500 km) o la #4 (más de 20 y hasta 100). De 3694 a 5000 km (empieza en el máximo de la #1) →
  se guarda; después, eliminarla. Km del viaje: escribir 100 muestra la #4 y no la #3; escribir 100,5 muestra la #3.
- [ ] 7. Gestionar viajes → Registrar viaje, QUICKFOOD, Sede Quilmes → Sede Banfield, tarifa Fija: sin inicio, "Completá
  el inicio para buscar la tarifa fija."; inicio 28/10/2026 → $ 200.000,00 (#4); 02/11/2026 → $ 185.000,00 (#5);
  15/02/2027 → el aviso amarillo "No hay tarifa fija de esta ruta para el 15/02/2027…". Escribir la fecha a mano y
  hacer clic afuera también cambia la tarifa. No guardar.
- [ ] 8. Por km, con la distancia a mano en 50 km: del 31/12/2026 23:00 al 01/01/2027 06:00 → "$ 50.000,00 neto ·
  $ 1.000,00 por km × 50,0 km" (#4; antes quedaba sin tarifa porque la #4 termina el 31/12). Con 21 km → la #4 (antes
  de corregir las bandas no tenía). No guardar.
- [ ] 9. Gestionar presupuestos → Registrar presupuesto, tipo Fija, mismo recorrido: sin inicio, "Completá la fecha de
  inicio para buscar la tarifa fija."; con inicio, "Tarifa fija #…, vigente el DD/MM/AAAA." No guardar.
- [ ] 10. Editar un viaje ya cargado con tarifa fija: abre con su importe de siempre; cambiarle el inicio a otro mes
  busca la tarifa de ese día. Cancelar.

---

## 32. Ramas del equipo y `main` al día con `rocionuvoli` — PUSHEADO (23/10), OK EN VM (23/10)

A pedido de Rocío, antes de la reunión con la profe: `facugodoy` y `fedemontenegro` pasan de `36a92c8` (22/10, 15:00) a
`739e567`, avance directo (59 commits, ninguna tenía commits nuevos). Enseguida Rocío pidió pasar también `main`, para
que queden todas iguales: las cuatro ramas quedan en el commit de esta nota. **`main` pasó sin probar**, por decisión de
Rocío (la regla era pasar a `main` solo lo probado). Les llega lo de §24 a §31: viajes y Ver detalle con el mismo armado, motivos de los botones deshabilitados,
datos del cliente que se editan en el cliente (proformas), estética de la proforma de Rukas, Gestionar empresa aparte de
Gestionar contenido, textos del menú en Grupos y permisos y en Ver detalle del usuario, CABA con sus barrios y tarifas.
En la base no tienen que correr nada (scripts de empresa, CABA y tarifas ya aplicados); sí recompilar la API.

**A diferencia de la §23, se pasó sin la prueba mínima en la VM.** C# que todavía no se compiló: el ajuste de
`EmpresaController` después del reporte (`57834a6`), el orden de `ProvinciasController` (`3ced596`) y las tres partes
de tarifas. Si no compila, arreglarlo en `rocionuvoli` y volver a pasarlo.

**Probar en la VM, por prioridad** (`pull`, recompilar, Ctrl+F5; detalle en §29, §30, §31 y en Grupos y permisos de §21):
- [ ] 1. La API compila sin errores.
- [ ] 2. Tarifas: Registrar tarifa fija con QUICKFOOD → solo sus orígenes; ruta + vuelta muestra el neto. Quilmes →
  Banfield del 15/10 al 25/10 → error que nombra la #4. Registrar viaje con tarifa Fija en esa ruta: inicio 28/10 →
  $ 200.000; 02/11 → $ 185.000.
- [ ] 3. Presupuestos: Registrar, tipo Fija, Quilmes → Banfield, inicio 28/10 → "Tarifa fija #4, vigente el 28/10/2026.".
- [ ] 4. Gestionar empresa: sin el aviso amarillo, con los datos de Rocío.
- [ ] 5. PDF: proforma generada con el logo y "Transporte Sánchez" grande a su derecha, razón social debajo. Factura y
  recibo: "Condición fiscal: Responsable inscripto" y el pie "Generado: DD/MM/AAAA HH:MM" en 24 h.
- [ ] 6. CABA: Registrar cliente → provincia entre Chubut y Córdoba, con los barrios. No guardar.
- [ ] 7. Grupos y permisos → Permisos y Listar usuarios → Ver detalle: los mismos textos que el menú y en su orden.
- [ ] 8. Cuenta corriente: Ver recibo con solo "Cerrar"; Editar recibo con el título "Editar recibo REC-…" (sin " · ").

**Si algo falla en la VM y no hay tiempo:** volver a `git checkout 36a92c8` (lo que tenían antes) y recompilar; los
datos de la base corregidos hoy funcionan con esa versión.

**Resultado en la VM (23/10):** `docs/pruebas/2026-10-23-ramas-y-tarifas.md`. La API compila y las 33 pruebas dieron OK
(tarifas fijas y por km, tarifa del viaje y del presupuesto según la fecha de inicio, también escrita a mano, Gestionar
empresa, los PDF, CABA, permisos y recibos). Sin datos de prueba nuevos. Salieron, fuera de esta ronda:
- [x] **F1 (media): en los modales no se puede escribir la hora en el calendario** — HECHO (24/10), FALTA PROBAR EN VM.
  El foco saltaba a la cruz del modal: el calendario se agrega al `body`, fuera del modal, y el control de foco de
  Bootstrap 5.3 lo devuelve al modal. Arreglo en `sgtl-ui.js` (`SGTL.selectorFecha` y `SGTL.rangoFechas`): el foco
  dentro del calendario no le llega a Bootstrap. El calendario sigue en el `body` (agregarlo al modal lo desacomodaba
  cuando el modal tiene scroll). Probado en la Mac con un modal igual al de Registrar viaje: sin el arreglo el foco
  terminaba en la cruz; con el arreglo se escribe la hora, Tab pasa a los minutos, Enter cierra el calendario y el modal
  sigue abierto.
  **Probar en la VM** (sin C#: `pull` y Ctrl+F5): Registrar viaje → Inicio → elegir un día → clic en la hora, escribir
  `08`, Tab, `45`, Enter: el campo dice "DD/MM/AAAA 08:45" y el modal sigue abierto. Lo mismo en Fin y en Registrar
  presupuesto. Cancelar sin guardar.
- [ ] **F2 (media, módulo de Facu): recibo REC-00000013 con "Total aplicado" y "Diferencia" distintos** en Ver ($ 871.200 y
  $ 0), Editar ($ 900.000 y $ 0) y el PDF ($ 0 y $ 0); lo imputado es $ 871.200 y quedan $ 28.800 sin imputar.
  `cuenta-corriente-clientes.js` (782-783 y 866-867) y `api/comprobantes/{id}` (ImporteAplicado y SaldoPendiente en 0).
- Mejoras para decidir: aviso de error del modal fuera de la vista si el modal tiene scroll; en Registrar presupuesto,
  "Elegí el cliente" en origen y destino e importe como texto; Ver y Editar recibo con campos deshabilitados (Facu); PDF
  de factura "Sin Proformas asociadas." (mayúscula) y en la proforma "->" y "Datos del servicio" con "—" (Facu); "Rol:
  user" en inglés en Ver detalle del usuario; CABA en el medio de sus barrios; `console.log` de `gestionContenido.js`;
  `DirectionsService` de Google Maps deprecado (avisan con 12 meses).
- Datos de prueba que se ven en pantalla: grupo "PRUEBA-CLAUDE 20/10", choferes "Prueba, Fede" y "CLAUDE, PRUEBACLAUDE",
  usuario "usuarioprueba" y conceptos de comprobantes ("asd asd", "pruebaaa", "preubaaaa888", "Factura de prueba Test",
  "NC prueba", "Pruebaa", "dfgdgh"). Varios ya estaban anotados para limpiar antes de la tesis.

**Limpieza de datos de prueba antes de la reunión con la profe (23/10):**
- [x] Corrido por Rocío (`BEGIN TRAN`, 3 filas, `Usu_Modi` "script limpieza"): chofer 9 "Fede Prueba" → **Federico
  Montenegro** (lo demás de su perfil es real: celular, e-mail, Diamante 3322); chofer 10 (de las pruebas de Claude del
  17/10) → **Lucas Ferreyra**, San Martín 1250; usuario 6 "usuarioprueba" → **Martina Gómez**, usuario **`mgomez`** (la
  contraseña no cambió). Los dos choferes siguen inactivos.
- [ ] **Después de la reunión (decisión de Rocío):** los textos de prueba de los comprobantes. El relevamiento
  (`database/limpieza/01_relevar_datos_de_prueba.sql`, solo lectura) mostró conceptos "NC prueba", "preubaaaa888",
  "Pruebaa", "pruebaaa", condiciones "asd asd" y "asdasd", y "Calle Prueba 100" en 7 domicilios, entre otros (falta
  ver la lista completa). Se corrigen solo textos, sin tocar importes, con un `UPDATE` dentro de `BEGIN TRAN`.
- [ ] Para Facu: Registrar presupuesto muestra choferes inactivos en el selector de chofer.
- [ ] **Demo de Rukas:** eliminar el borrador #42 (Rukas 990100) desde Gestionar proformas; tiene los viajes 25 y 26
  (990001 y 990002), que usan todos los Excel de `docs/pruebas/datos/`. Están en Listo para facturar con la tarifa #5
  ($ 850 × 17,4 km = $ 14.790, lo que esperan los Excel) y no hay proformas con 990120 ni 990130. **No cambiar los
  valores de las tarifas por km antes de la demo:** cambiaría el importe que comparan los Excel.

---

## 33. Editar una tarifa que ya usan viajes — PARA CHARLAR CON FACU (23/10)

Lo planteó Facu (23/10): "no debería dejarte editar tarifas que estén en curso, porque ya hay viajes que las usan;
debería pedirte que cierres esa vigencia y generes una nueva con el nuevo valor, y ahí recalcular todo". Rocío: hay que
armar bien el flujo, porque no es tan simple como permitir o no permitir. Puede hacer falta editar justamente para
corregir un error (lo que se decidió para Rukas). No se decidió ni se cambió nada.

**Cómo funciona hoy:**
- Gestionar tarifas deja **editar todo** de una tarifa en cualquier momento: valores, vigencia, cliente y recorrido.
  Desde el 23/10 controla que no se superponga con otra (§31). **Eliminar** sí se rechaza si algún viaje la usa.
- **El viaje no guarda su importe:** guarda qué tarifa usa (`TarifaFijaID` o `TarifaKmID`) y el importe se calcula cada
  vez (fija: el neto; por km: valor por km × km). Editar el valor de una tarifa cambia el importe de **todos** sus
  viajes en el detalle del viaje, en el dashboard y en "Traer viajes".
- Lo que ya se emitió **no cambia**: las líneas de una proforma propia guardan su precio al traer los viajes, y las
  facturas, sus importes. En un borrador de Rukas, "Volver a controlar" toma el importe nuevo y puede aparecer
  "Importe distinto".
- Cambiarle la vigencia, el cliente o el recorrido a una tarifa en uso deja viajes con una tarifa que ya no les
  corresponde (el viaje conserva el ID).
- Lo decidido para Rukas (`docs/negocio/PROFORMA-CLIENTES-RUKAS.md`, "SGTL está mal"): si **el valor estaba mal
  cargado**, se edita la tarifa y se arreglan todos los viajes que la usan, "que es lo correcto porque estaba mal"; si
  **al viaje le asignaron otra tarifa**, se cambia la del viaje, no la de la tabla.

**Dos casos distintos, que el flujo tiene que separar:**
1. **Cambio de precio** (aumento, nueva negociación): no tiene que tocar lo hecho. Se cierra la vigencia de la tarifa
   (hasta el día anterior) y se carga otra desde el día del cambio (la propuesta de Facu). Los viajes viejos siguen con
   la anterior y los nuevos toman la nueva por su fecha de inicio (§31).
2. **Corrección de un error** (el valor se cargó mal): sí tiene que arreglar los viajes que la usan, salvo lo ya
   emitido.

**24/10: en parte resuelto con el §34.** Rocío eligió la "opción de fondo" de abajo: el viaje guarda su importe al calcular
su tarifa (columnas `Importe_Base` e `Importe` en `VIAJES`). Editar una tarifa fija, por km o del tarifario ya no cambia
los viajes calculados; un viaje toma el valor nuevo cuando se edita cambiando lo que define su tarifa (tipo de tarifa,
camión, km, inicio o vuelta). Quedan para charlar con Facu: el "Recalcular" de varios viajes juntos cuando una tarifa
estaba mal cargada, y si hay que avisarle al cliente.

**Para decidir:**
- [ ] ¿Se bloquea editar el valor, la vigencia, el cliente o el recorrido de una tarifa con viajes, y se ofrece
  "Cerrar vigencia y registrar una nueva"? ¿O se deja editar con una confirmación que diga a qué viajes afecta: N sin
  proforma (cambian su importe), M en borrador (se recalculan) y K en una proforma generada o facturados (no cambian;
  la diferencia iría con una nota de crédito o de débito)? ¿Se pide el motivo y queda en la auditoría?
- [ ] "Recalcular todo" al cerrar una vigencia: ¿qué viajes pasan a la tarifa nueva? Propuesta: los que empiezan desde
  la fecha nueva y no están en una proforma generada ni facturados. ¿Automático o con un botón que muestre la lista?
- [ ] "Tarifa en curso": ¿vigente hoy, o con viajes en un estado determinado (por ejemplo, En viaje)?
- [ ] ¿Hay que avisarle al cliente cuando cambia una tarifa o se corrige un viaje ya informado? ¿Desde el sistema
  (e-mail) o por fuera?
- [ ] Opción de fondo: que el viaje **guarde su importe** al asignarle la tarifa (como las líneas de proforma). Editar una
  tarifa dejaría de cambiar los viajes hechos, y corregir un error sería un "Recalcular" explícito sobre los viajes
  elegidos. Es más cambio (columna nueva en `VIAJES` con script, y que viajes, dashboard, "Traer viajes" y el control
  de Rukas lean el importe guardado), pero hace el resto más simple y predecible.
- Depende de esto la forma de cargar los valores reales de las tarifas (§31, "valores más reales"): pisar los valores o
  cerrar las vigencias y cargar nuevas.

---

## 34. Tabla de tarifas por tipo de camión (agosto 2026) — HECHO EN LA MAC (24/10), FALTA CORRER LOS SCRIPTS, COMPILAR Y PROBAR EN VM

Pedido de Rocío (24/10), para la presentación del jueves 29/10: adaptar las tarifas a la tabla que dio la empresa
("Tarifas a agosto 2026", PDF), que usan siempre para calcular cuánto cobrar un viaje. El precio sale del **tipo de
camión** (Furgón, Balancín (3 ejes), Chasis (2 ejes) o Liviano), del **año del modelo** (2018 o anterior, o 2019 en
adelante) y de los **km de ida**, con una de dos tarifas, más dos adicionales.

**Decisiones de Rocío, charladas con Claudia (24/10):**
- **Tarifa fija:** el precio por viaje de la banda de km, por tipo y modelo de camión: hasta 130 km (un valor para la 1ª
  vuelta del día y otro, más barato, para la 2ª), más de 130 y hasta 190, y más de 190 y hasta 250. **Si el viaje pasa los
  250 km, la fija de 250 más los km que pasan × el precio por km** (como lo calculan ellos). Ejemplo, Balancín 2019:
  600 km → $ 663.370 + 350 × $ 2.594 = $ 1.571.270.
- **Tarifa por km:** todo el viaje × el precio por km de la categoría (la "larga distancia" del PDF): 600 km →
  $ 1.556.400. Se elige a mano cuando prefieren cobrar así.
- **No hay precios acordados por cliente y recorrido:** todo sale de la tabla. Las tarifas fijas por recorrido y las bandas
  por km de antes (eran de prueba) dejan de cargarse; quedan en la base para los viajes que ya las usan.
- La 2ª vuelta es el segundo viaje del mismo camión en el mismo día (solo con fija y hasta 130 km). El sistema la propone
  si el camión ya tiene un viaje que empieza antes ese día, y se puede cambiar.
- **Falso flete:** el camión fue al origen a cargar, no había carga y volvió: se cobra el 60 % del viaje. **Estadía:** casi
  no se usa; va a mano en el viaje (módulos de 6 hs a $ 96.577).
- Una tabla por PDF: fijas, por km, bandas y adicionales se cargan juntos, con la misma vigencia (desde su fecha hasta que
  se cargue la siguiente). Valores sin IVA. El año de corte y los límites de las bandas son datos de cada tabla.
- **El viaje guarda su importe** (la "opción de fondo" del §33): cambiar la tabla no cambia los viajes ya calculados.
- Presupuestos (módulo de Facu) calcula igual que viajes: lo hace Claude ahora y Rocío le avisa a Facu.
- **Tabla general y tablas propias (24/10, segunda vuelta):** cada tabla es para todos los clientes (la del PDF, Marfrig
  incluido, y también los que se den de alta después) o solo para algunos clientes, que se eligen de una lista con
  buscador. Para esos clientes, su tabla propia reemplaza a la general (por ejemplo, otro cliente con sus propios
  valores): así se "saca" un cliente de la general sin destildarlo en ningún lado. Una general y una propia pueden estar
  vigentes al mismo tiempo, cada una con sus versiones. Para un viaje vale la propia de su cliente vigente en el inicio; si
  no tiene (o empieza después), la general. Falta saber si el PDF es de Marfrig ("ZQPA" parece un código de SAP): si lo
  es, se carga como general o como propia de Marfrig, sin cambiar nada del sistema.

**Qué se hizo:**
- `database/tarifas/02_tarifario_por_vehiculo.sql` (idempotente): tablas `TARIFARIOS` (una fila por tabla: nombre,
  vigente desde, para todos o no, año de corte, bandas, estadía y falso flete), `TARIFARIO_VALORES` (8 filas por tabla:
  antigüedad × tipo, con las tres bandas fijas, la 2ª vuelta y el precio por km) y `TARIFARIO_CLIENTES` (los clientes de
  una tabla propia), y en `VIAJES` las columnas `TarifarioID`, `Tarifa_Modo`
  (`Fija` o `Km`), `Vuelta`, `Estadia_Modulos`, `Falso_Flete`, `Importe_Base`, `Tarifa_Detalle`, `Importe` e
  `Importe_Detalle` (con default o vacías: el código viejo sigue andando).
- `database/tarifas/03_cargar_tarifario_agosto_2026.sql`: primero muestra; con `@Aplicar = 1` (transacción abierta para
  COMMIT o ROLLBACK) carga la tabla de agosto 2026, pasa al nombre de la tabla el tipo de los camiones que se puede
  deducir del texto ("furgón", "balancín", "chasis", "liviano"; los demás se eligen en Gestionar camiones) y les guarda a
  los viajes que ya existen **el mismo importe que muestran hoy**. Ningún monto cambia: la demo de Rukas sigue en
  $ 14.790 en los viajes 25 y 26 mientras no se editen.
- API: `Tarifas/TarifarioCalculo.cs` (nuevo, un solo cálculo para viajes, presupuestos y la tabla) y
  `TarifarioController.cs` (nuevo: listar, ver, registrar, editar, eliminar si ningún viaje la usa, la vigente y
  `Calcular` con `tarifa=fija|km`), los dos en el `.csproj`. `ViajesController`: calcula el importe al guardar (no toma
  el de la pantalla) y lo guarda con su modo; la base se recalcula solo si cambia fija/por km, el camión, los km, el
  inicio o la vuelta; falso flete y estadía se cargan en cualquier estado antes de facturar.
  `ProformasController.ImporteViaje` ("Traer viajes" y el control de Rukas) y el costo del dashboard leen primero el
  importe guardado. `CamionesController` rechaza un tipo que no es de la tabla. `PresupuestosController` (Facu): el viaje
  que genera un presupuesto nuevo queda con la tabla, su modo, la vuelta y el importe del presupuesto (los presupuestos de
  antes siguen funcionando con su tarifa).
- `gestion-tarifas.html`: solo la tabla de tarifas (ya no hay pestañas de fijas por recorrido ni de bandas por km): la
  lista de tablas (para qué clientes —"Todos los clientes, salvo …, que tienen tabla propia" o los de la propia—,
  vigencia y estado: Vigente, Anterior o Próxima) y el formulario como el PDF, con los bloques Datos, Clientes (todos o
  solo algunos, con buscador), Bandas de km, Tarifas fijas (una grilla por modelo), Tarifas por km y Adicionales. La API
  no deja dos generales que empiecen el mismo día, ni dos propias de un mismo cliente. "Registrar tabla de tarifas" viene
  con los valores de la más nueva, para cambiar solo los que subieron.
- `gestion-viajes.html`: Tarifa con **Fija** (elegida de entrada) y **Por km**, las dos de la tabla. Vuelta (con fija y
  hasta 130 km, con la propuesta y por qué), falso flete y módulos de estadía (la estadía no aparece en clientes con
  plataforma: los adicionales vienen de Rukas). La línea del importe muestra la cuenta. Un viaje de antes conserva su
  tarifa vieja (lo dice debajo) hasta que se cambie el camión, los km o el inicio, o se elija Fija o Por km. En un viaje
  que ya salió, la tarifa queda fija y se pueden cargar falso flete y estadía. `viaje-detalle.js`: el importe guardado.
- `presupuestos.html` y `presupuestos.js` (Facu): el tipo de tarifa (fija o por km) calcula con la tabla, con el camión;
  aparece "Vuelta del día" cuando corresponde y se recalcula al cambiar el camión.
- `gestion-camiones.html`: el tipo es una lista con los cuatro de la tabla; un camión con un tipo escrito antes pide
  elegirlo ("Estaba cargado como …").
- Design system §4.1: Vigente (verde), Anterior y Próxima (gris), para la tabla de tarifas.
- `tests/tarifario.test.js` (nuevo): tipos iguales en API, camiones y tarifas; valores de agosto con la suba de la tabla
  (detecta un número mal copiado); fija con excedente y por km; que viajes y presupuestos usen la tabla y que el viaje
  guarde el importe. Los tests de `tests/` dan OK (con el Node de Cursor).
- Probado en la Mac con una API simulada con la misma lógica (Balancín 2019): fija 100 km → $ 581.492 (1ª) y $ 407.089
  (2ª, propuesta); 200 km → $ 663.370; 600 km → $ 1.571.270; por km 600 km → $ 1.556.400 y 100 km → $ 259.400 (sin
  vuelta); falso flete y estadía; un viaje de antes guardado sin cambios sigue en $ 220.000 y al cambiarle el camión pasa
  a la tabla; presupuestos con fija (2ª vuelta propuesta) y por km; camión sin tipo de la tabla → aviso con el enlace.

**Para tener en cuenta:**
- **El orden importa:** correr `02` antes de recompilar la API. Sin las columnas nuevas, la API nueva no puede listar ni
  abrir viajes, ni generar el viaje de un presupuesto. Avisarles a Facu y Fede (base compartida).
- **Rukas:** el control compara el importe guardado del viaje (con el falso flete, si tiene) con el importe del viaje de
  Rukas; los adicionales de Rukas se siguen tomando sin comparar. Si la tabla es la de Marfrig, el importe de un viaje
  nuevo tendría que coincidir con el de Rukas.
- **Falso flete y el estado del viaje:** no hubo entrega, pero el viaje sigue el circuito de siempre. Queda para la
  revisión de los flujos de viajes (¿qué estado y qué evidencia lleva?).
- No hay un "Recalcular" de varios viajes juntos: cada viaje se recalcula al editarlo cambiando su tarifa (ver §33).
- El importe del viaje se guarda por SQL directo: la auditoría del viaje no lo muestra. La de la tabla sí (entidad
  `TARIFARIOS`, con un resumen de los valores). Las dos usan `GETDATE()` (UTC, §2).
- **Como si siempre hubiera estado la tabla (decisión de Rocío, 25/10):** las tarifas de antes eran de prueba. Se sacaron
  `TarifasController`, `TarifasFijasController` y `TarifasKmController` (y del `.csproj`), y todo lo que las leía
  (viajes, Ver detalle, proformas, el control de Rukas, el dashboard, presupuestos y `TarifarioCalculo`). Ahora el importe
  sale solo de lo que el viaje guardó con la tabla. `database/tarifas/04_viajes_con_la_tabla_de_tarifas.sql` deja los
  datos igual:
  - Los viajes facturados o en una proforma emitida conservan el importe facturado ("Importe facturado").
  - Los generados desde un presupuesto conservan el del presupuesto.
  - Los de antes del 01/08/2026 (no hay tabla) conservan el suyo ("Importe anterior a la tabla de tarifas").
  - El resto se recalcula con la tabla, con fija o por km según lo que tenía y la vuelta según el camión ese día.
  - Todos quedan con la tabla y sin `TarifaFijaID` ni `TarifaKmID`. Los presupuestos pasan a la tabla general y
    conservan su importe. Se borran las filas de `TARIFAS_FIJAS` y `TARIFAS_KM`; las tablas quedan vacías porque el EDMX
    las incluye y no se regenera.
- **Demo de Rukas:** los viajes 25 y 26 (990001 y 990002) se recalculan con la tabla y dejan de dar $ 14.790. El script
  muestra sus importes nuevos: con esos importes hay que regenerar los Excel de `docs/pruebas/datos/` (pasárselos a
  Claude).
- Los "valores más reales" de la §31 ya no hacen falta.

**Probar en la VM** (con C#):
- [ ] 0. Rocío corre `database/tarifas/02_tarifario_por_vehiculo.sql` (al final, todo "OK"). Después
  `03_cargar_tarifario_agosto_2026.sql` tal cual: revisar la lista de camiones (los "Elegir en Gestionar camiones") y los
  viajes que guardan importe; con `@Aplicar = 1`, si las cantidades coinciden, `COMMIT`.
- [ ] 1. `pull`, recompilar la API y Ctrl+F5. Gestionar viajes lista los viajes (hasta correr `04`, los de antes no se
  pueden editar: no tienen tabla).
- [ ] 2. Gestionar tarifas: solo la lista de tablas, con "Tarifas a agosto 2026", desde el 01/08/2026, Vigente. Editar:
  los valores iguales al PDF (fijas por modelo y por km). Cancelar.
- [ ] 3. Registrar tabla de tarifas: viene con los valores de agosto y el nombre y la fecha vacíos, "Todos los clientes"
  elegido. Fecha 01/08/2026 → "Ya hay una tabla para todos los clientes vigente desde el 01/08/2026…". Elegir "Solo algunos
  clientes" sin tildar ninguno → "Elegí al menos un cliente.". Tildar un cliente de prueba, cambiar un valor y Guardar: en
  la lista, la propia con ese cliente y la general con "Salvo …, que tiene tabla propia". Un viaje de ese cliente sale con
  la propia (el detalle del importe la nombra) y uno de otro cliente, con la general. Después, eliminar la propia.
- [ ] 4. Gestionar camiones: a los camiones que el script no pudo deducir, elegirles el tipo.
- [ ] 4b. Rocío corre `database/tarifas/04_viajes_con_la_tabla_de_tarifas.sql` tal cual: revisar qué pasa con cada viaje
  (conserva o se recalcula, con el importe de hoy y el nuevo), que la columna "Falta" esté vacía, los importes nuevos de la
  demo de Rukas y los presupuestos con tarifa vieja. Con `@Aplicar = 1`, si las cantidades coinciden, `COMMIT` (al final,
  "Viajes con tarifa vieja" tiene que dar 0).
- [ ] 5. Registrar viaje de un cliente directo con un camión de tipo y año conocidos: Fija viene elegida; comparar con el
  PDF a 100 km (1ª vuelta; 2ª si el camión ya tiene un viaje antes ese día), 200 km y más de 250 km (la de 250 más el
  excedente). Por km: todo el viaje. Falso flete → 60 %; 1 módulo de estadía → + $ 96.577. Guardar y volver a abrir:
  el mismo importe.
- [ ] 6. Abrir un viaje facturado: el importe facturado, con "Importe facturado". Uno recalculado: el importe de la tabla,
  con su detalle. Guardar sin cambios no cambia el importe. Ver detalle igual.
- [ ] 7. Presupuestos: Registrar presupuesto con fija y con por km: el mismo importe que el viaje. Aceptarlo y generar el
  viaje: el viaje tiene el importe del presupuesto.
- [ ] 8. Proformas: "Traer viajes" trae el importe guardado de cada viaje; con los Excel regenerados, el caso 1 de Rukas
  (`docs/pruebas/datos/`) da "Coincide".
- [ ] 9. Dashboard: "Costo por viaje" suma los importes guardados (cambia por los viajes recalculados).
- [ ] 10. Un viaje en viaje: cargarle 1 módulo de estadía y guardar: se suma, la tarifa no cambia.

---

## 35. Tableros: todos los tableros por tema, gráficos de tres datos y favoritos en el dashboard — PUSHEADO (24/10), FALTA CORRER EL SCRIPT, COMPILAR Y PROBAR EN VM

Pedido de Rocío para el jueves 29/10 (segundo profesor): llevar los tableros del dashboard a una pantalla general
agrupada por tema, sumar gráficos que comparen tres datos (sin 3D) y que cada usuario marque favoritos que ve en su
dashboard y acomoda. Decisiones de Rocío con la maqueta del 24/10: pestañas por tema; estrella amarilla; en el
dashboard la estrella solo en Personalizar; "Tableros" como ítem principal debajo de Dashboard, **con permiso de grupo
propio**; entran km por camión y por mes, viajes por cliente, mes y resultado, y facturación y deuda (de solo lectura
de cuenta corriente, **avisarle a Facu**).

**Qué cambió:**
- **Pantalla nueva `tableros.html`** (menú → Tableros): el mismo período que el dashboard y cuatro pestañas:
  - **Viajes (13):** Viajes, Entregados, Pendientes de entrega, Entregados con rechazo, Para revisar, Próximos viajes,
    Viajes por mes, **Viajes por cliente, mes y resultado**, **Recorridos más usados**, **Rechazos por cliente y
    destino** (nuevos), Últimos viajes, Comparativa por mes, Calendario.
  - **Flota (7):** Camiones activos, Km recorridos, ITV de camiones, Km por mes, Km por camión, **Km por camión y por
    mes** e **Ingresos por camión y por mes** (nuevos).
  - **Choferes (2):** Choferes activos, Km por chofer.
  - **Facturación (5):** Costo por viaje, Top clientes en facturación, **Deuda vencida por cliente**, **Facturación por
    cliente y por mes** y **Antigüedad de la deuda** (nuevos).
  - Cada tarjeta tiene la **estrella**: la suma al final del dashboard o la saca, y se guarda en el momento (toast).
    Recuerda la última pestaña (en el navegador).
- **Gráficos de tres datos** (con el skill de visualización: colores validados, un solo tono para cantidades, sin 3D):
  - **Km por camión y por mes** y **Facturación por cliente y por mes**: mapa de calor (tabla con el número en cada
    celda, azul más oscuro = más), totales por fila y columna y la escala abajo. Más de 8 filas: 7 y "Otros". Con
    Último mes van por semana.
  - **Viajes por cliente, mes y resultado:** un gráfico chico por cliente (los 6 con más viajes y "Otros clientes"),
    todos con la misma escala, con las barras apiladas en entregado / parcial / con rechazo / pendiente y el % de
    rechazo de cada cliente.
  - **Deuda vencida por cliente** ("Hoy"): vencido y por vencer por cliente, de mayor a menor, con desde cuándo debe.
  - Facturación = facturas y notas de débito emitidas menos notas de crédito, por fecha de emisión (la cuenta de "Top
    clientes"). Deuda = lo emitido menos lo aplicado, de clientes activos (la cuenta del saldo de cuenta corriente), con
    el día de hoy de Argentina. Sin permiso de cuenta corriente o de proformas, esas dos tarjetas dicen "No tenés permiso
    para ver la facturación."
- **Dashboard (`index.html`):** muestra los **favoritos** del usuario, que se guardan **en la base** (antes, solo en el
  navegador: `api/DashboardLayout` nunca existió). Quien todavía no eligió ve el dashboard de siempre. Personalizar mueve
  y agranda (como antes) y saca tableros con la estrella; "Widgets" pasa a ser **"Agregar tableros"** (lleva a Tableros;
  sin el permiso, deshabilitado con el motivo). Restablecer vuelve al de siempre. Si alguien saca todos, el dashboard lo
  dice y ofrece Agregar tableros o Restablecer. El diseño que alguien haya guardado en el navegador antes de esto se
  usa hasta que guarde (ahí pasa a la base).
- **API:** `TablerosController` nuevo (en el `.csproj`): `GET/PUT/DELETE api/tableros/favoritos` (el usuario sale del
  token), `GET api/tableros/facturacion?fechaDesde&fechaHasta` y `GET api/tableros/deuda` (solo lectura de
  `COMPROBANTES` y `CUENTA_CORRIENTE_APLICACIONES`; no toca `CuentaCorrienteController`). Permiso "Tableros" en
  `GruposController` (catálogo y sección General).
- **Base:** `database/tableros/01_crear_tableros_favoritos.sql` (idempotente): `TABLEROS_USUARIO` (quién ya eligió),
  `TABLEROS_FAVORITOS` (tablero, orden y lugar en la grilla) y el permiso "Tableros" en `MENU`. No se lo da a ningún
  grupo: se tilda en Gestionar grupos y permisos. Al borrar un usuario se borran sus favoritos.
- **Código:** el catálogo de tableros (`assets/static/js/tableros-catalogo.js`) lo usan las dos pantallas; `dashboard.js`
  dibuja solo los tableros que están en la pantalla (y no pide datos que nadie usa); estilos en
  `assets/static/css/tableros.css`. Design system: §3.1 (menú) y §13 nuevo (tableros, estrella, mapa de calor, gráficos
  chicos). Prueba nueva: `tests/tableros.test.js`.
- De paso: en "Km por camión" y "Km por chofer", con la tarjeta angosta el eje tiene menos marcas (los números se
  pisaban).

**Segunda tanda (24/10, pedida por Rocío: "el profe pidió mucho de tres datos"),** cuatro mapas de calor más:
- **Ingresos por camión y por mes** (Flota): el importe que calculó cada viaje con su tarifa (§34), facturado o no;
  en el globito, también el importe por km. Los viajes sin importe no se suman y la nota dice cuántos son. **Necesita
  los scripts de tarifas (§34)**: sin ellos, los viajes no tienen importe y la tarjeta lo dice.
- **Recorridos más usados** (Viajes): origen × destino × viajes del período, con los km en el globito.
- **Rechazos por cliente y destino** (Viajes): qué % de las entregas del período fue con rechazo. Las celdas con menos
  de 3 entregas van más claras (el % puede engañar); los totales son el % de cada cliente y de cada destino.
- **Antigüedad de la deuda** (Facturación, "Hoy"): cliente × al día / vencido hace 1-30, 31-60, 61-90 y más de 90 días
  × monto. `api/tableros/deuda` devuelve los cuatro tramos (misma cuenta que la deuda vencida); un solo pedido para
  las dos tarjetas de deuda.
- El mapa de calor ahora admite porcentajes, celdas con pocos datos y una nota (§13 del design system).

Probado en la Mac con una API simulada (16 clientes, 5 camiones, viajes inventados), a 1366 y 375 px: las cuatro
pestañas, Último mes (por semana), Trimestre y Año (12 meses), estrella (agregar y sacar, se guarda y el dashboard la
muestra al final), Personalizar (sacar, mover, Guardar, recargar, Cancelar), dashboard vacío y Restablecer, el diseño
viejo del navegador, la API sin las tablas (el dashboard queda como siempre y la estrella avisa el error), sin permiso
de facturación y un usuario sin el permiso Tableros (sin menú, la pantalla manda al inicio y "Agregar tableros" queda
deshabilitado). `node tests/tableros.test.js` y las demás pruebas: OK. **Falta con datos reales y el C# compilado.**

**Probar en la VM** (con C#):
- [ ] 0. Rocío corre `database/tableros/01_crear_tableros_favoritos.sql` (dice qué creó y la verificación da 0 · 0 · 1).
- [ ] 1. `pull`, **recompilar la API** (hay un controller nuevo) y Ctrl+F5. `node tests/tableros.test.js` → OK.
- [ ] 2. Dashboard: igual que antes (los mismos tableros y en el mismo lugar) y sin errores nuevos en la consola.
- [ ] 3. Menú → Tableros (como admin): cuatro pestañas; el período cambia los números y los gráficos de todas.
  Km por camión y por mes: los totales por camión coinciden con "Km por camión" del mismo período.
- [ ] 4. Facturación → Facturación por cliente y por mes: el total de un cliente en un mes coincide con sus facturas y
  notas de débito menos notas de crédito de ese mes en Gestionar cuenta corriente. Deuda vencida: lo vencido de un
  cliente coincide con su "Deuda vencida" en cuenta corriente. Antigüedad de la deuda: la suma de los cuatro tramos
  vencidos de un cliente es su "Vencido" de Deuda vencida, y "Al día", su "Por vencer".
- [ ] 4b. Flota → Ingresos por camión y por mes: el total de un camión en un mes coincide con la suma de los importes de
  sus viajes en Gestionar viajes (con los scripts de tarifas corridos). Viajes → Recorridos más usados: el total de un
  recorrido coincide con Listar viajes filtrado por ese origen y destino. Rechazos por cliente y destino: abrir una
  celda con rechazo y comparar con los viajes de ese cliente a ese destino.
- [ ] 5. Tocar la estrella de "Km por camión y por mes": toast y estrella llena. En SSMS, una fila en
  `TABLEROS_USUARIO` y los favoritos en `TABLEROS_FAVORITOS`. Ir al dashboard: la tarjeta está al final.
- [ ] 6. Personalizar: sacar una tarjeta con la estrella, mover otra, Guardar → "Dashboard guardado.". F5 → quedó así.
  Abrir el sistema en otro navegador con el mismo usuario: el mismo dashboard.
- [ ] 7. Restablecer → el dashboard de siempre (y las filas del usuario se borran de las dos tablas).
- [ ] 8. Con un usuario que no es admin: sin el permiso, Tableros no está en el menú y escribir `tableros.html` lleva al
  inicio; en Personalizar, "Agregar tableros" deshabilitado con "No se puede abrir Tableros: no tenés permiso". Tildarle
  "Tableros" a su grupo en Gestionar grupos y permisos (aparece en General, debajo de Dashboard) → ahora entra. Si el
  grupo no tiene cuenta corriente ni proformas, las tarjetas de facturación dicen que no tiene permiso.
- [ ] 9. F12 a 390 px: Tableros en una columna, las pestañas se desplazan de costado y el mapa de calor también (con el
  nombre fijo).

**Para tener en cuenta:**
- **Avisarle a Facu:** los dos tableros de facturación leen sus tablas (`COMPROBANTES`, `CUENTA_CORRIENTE_APLICACIONES`)
  desde `TablerosController`, de solo lectura, con sus mismas cuentas. Si él cambia cómo se calcula el saldo, hay que
  cambiarlo también acá.
- "Top clientes en facturación" sigue siendo histórico y sin token (`CuentaCorrienteController`, de Facu).
- Ideas que siguen abiertas del §19: rechazos por cliente o destino, uso de la flota, exportar la comparativa, km
  cargados a mano. Cada una sería un tablero más del catálogo, en su pestaña.
- **Favoritos de entrada según el grupo** (idea de Rocío, 24/10, pendiente): hoy quien todavía no eligió favoritos ve
  el dashboard de siempre, con todas las tarjetas. La idea es que de entrada tenga los tableros que corresponden a su
  grupo. Dos formas, a decidir: (a) automática, los tableros que sus permisos le dejan ver (los de facturación, con
  cuenta corriente o proformas; los de viajes, con viajes); (b) que un administrador elija los favoritos de cada grupo
  en Gestionar grupos y permisos (tabla nueva, por ejemplo `TABLEROS_GRUPO`). Con varios grupos, todos los de sus
  grupos. Cuando el usuario elige los suyos, mandan los suyos.

---

## 36. Hoja de ruta del chofer: el chofer usa el sistema desde el celular — PUSHEADO (24/10), AJUSTES DEL 24/10 SIN PUSH; FALTA CORRER EL SCRIPT, COMPILAR Y PROBAR EN VM

Pedido de Rocío para el jueves 29/10 (presentación ante el segundo profesor). Antes el chofer no usaba el sistema:
solo recibía la hoja de ruta por WhatsApp. **Decisiones de Rocío (24/10):** alcance completo (ver, iniciar el viaje,
registrar la entrega y subir la evidencia desde el celular); el chofer es un usuario más, en un grupo que solo abre la
Hoja de ruta, y su cuenta apunta a su ficha de Gestionar choferes (el vínculo es del usuario: no todo chofer tiene
cuenta); opción propia en el menú, con permiso de grupo; la hoja de ruta por WhatsApp sigue y se le suma el enlace al
sistema (módulo de Fede: ver abajo).

**Qué se hizo:**
- **Base:** `database/hoja-de-ruta/01_usuario_chofer.sql` agrega `USUARIOS.ChoferID` (vacío = no es chofer), la FK a
  `CHOFERES` y un índice único (un chofer, una sola cuenta). Idempotente: con `@Aplicar = 0` dice qué falta; con 1 lo
  aplica. No cambia datos y el EDMX no se toca (SQL directo).
- **API:** `HojaDeRutaController` (nuevo, sumado al `.csproj`):
  - `GET api/HojaDeRuta?vista=proximos|anteriores`: los viajes del chofer de la sesión. "Hoy y próximos": los que
    terminan hoy o después, el que está en viaje y los de clientes directos que quedaron sin salir; "Anteriores": el
    resto, por año (ver los ajustes del 24/10). El "hoy" es el de la Argentina (`AT TIME ZONE` en el SQL), no la hora de la máquina.
  - `POST …/Viajes/{id}/Iniciar`, `POST …/Viajes/{id}/Entrega` (resultado y fecha), `POST` y `GET …/Viajes/{id}/Evidencia`:
    controlan que el viaje sea del chofer y que le toque ese paso; el cambio lo hace `ViajesController` (mismas reglas,
    auditoría y mensajes que Gestionar viajes), con el usuario del token como autor. **Para el chat de viajes:** usa
    `ViajesController.CambiarEstado`, `SubirEvidencia` y `DescargarEvidencia` con sus DTO; si cambian de firma, la API
    no compila hasta ajustar `HojaDeRutaController`.
  - `GET …/Choferes` y `GET` / `PUT …/Usuarios/{id}/Chofer`: el vínculo de Gestionar usuarios (administradores o
    permiso "Gestión de usuarios").
  - **Seguridad:** todas las acciones exigen el token (sin él, 401) y el chofer sale del token (`USUARIOS.ChoferID`
    del usuario que inició sesión), nunca de un parámetro: un chofer no ve ni toca los viajes de otro (404). El resto
    de la API sigue como estaba (CP06).
- **Pantalla** `hoja-de-ruta.html` + `assets/static/js/hoja-de-ruta.js`, pensada para el celular (excepción del §10 del
  design system): una tarjeta por viaje, agrupadas por día; "Hoy y próximos · Anteriores"; el recorrido con dos puntos
  iguales unidos por una línea (pedido de Rocío); camión, números del viaje y evidencia.
  - **Mapa** (Rocío, 24/10): el viaje que sigue (en viaje o, si no hay, el primero de hoy) muestra el mapa con el
    recorrido dibujado, con la misma clave y el mismo cargador que Gestionar viajes (`google-maps.js`); los demás tienen
    "Ver mapa". Debajo, "Abrir en Google Maps" (el mismo enlace del WhatsApp) para manejar con la app. La clave solo
    acepta `localhost:5502`: desde otro puerto el mapa dice "No se pudo cargar el mapa: abrilo en Google Maps.".
  - Cliente directo: "Iniciar viaje" (con confirmación) y "Registrar entrega" (resultado, fecha con hoy por defecto y la
    evidencia, obligatoria); ya entregado, solo "Reemplazar evidencia" (Rocío: un viaje pasado nunca ofrece "Subir
    evidencia"; uno entregado sin evidencia, de antes del 22/10, no tiene botón y la carga la oficina).
  - Cliente con plataforma: **solo ver** (Rocío, 24/10: el chofer manda el remito al bot de WhatsApp de Rukas y la
    entrega queda registrada ahí). La API también rechaza la evidencia del chofer en esos viajes.
  - Las fotos se achican a 1600 px en JPG antes de subirlas (una de 5,3 MB quedó en 715 KB); el PDF va tal cual.
  - En una proforma emitida, el paso queda deshabilitado con el motivo escrito debajo.
  - `hoja-de-ruta.html?viaje=48` marca ese viaje (y lo busca en Anteriores si ya pasó): es lo que abriría el enlace del
    WhatsApp.
  - Cubre en parte VIA-09 (`docs/design-system/04-relevamiento-funcional.md`): el viaje que nace de un presupuesto no
    manda el WhatsApp, pero el chofer lo ve igual en su hoja de ruta.
- **Gestionar usuarios:** campo "Chofer" en Registrar y Editar usuario (bloque Acceso, debajo de Rol), con el buscador
  compartido; lista los choferes sin usuario (y el del usuario). Se guarda después del usuario: si falla, el usuario queda guardado y el modal lo dice
  (en el alta pasa a "Editar usuario" para no duplicarlo).
- **Menú y permiso:** "Hoja de ruta" es un ítem principal, después de Tableros (`sidebar-loader.js`,
  `permisos-menu.js` y el catálogo de `GruposController`, en la sección General).
- **Login:** un usuario que tiene la Hoja de ruta y no el Dashboard entra directo a su hoja de ruta. Con la sesión
  vencida, el login vuelve a la pantalla que se pidió (`Login.html?volver=…`, solo pantallas del sistema): así el
  enlace del WhatsApp lleva al viaje.
- **Prueba:** `tests/hoja-de-ruta.test.js` (qué ve y puede hacer el chofer, que la API saque el chofer del token y que
  el login no vuelva a otra dirección). Las 21 pruebas pasan; en la Mac se corrieron con el Node que trae VS Code:
  `ELECTRON_RUN_AS_NODE=1 "/Applications/Visual Studio Code.app/Contents/MacOS/Code" tests/<archivo>.test.js`.
- **Documentos:** tesis (partes 2, 4 y 5: el chofer usa el sistema, su relación en el DER y la capacitación) y design
  system (§3.1 y la excepción del §10).

**Ajustes del 24/10, después de verla Rocío** (commit aparte; cambian `HojaDeRutaController.cs` y `CostosController.cs`:
**recompilar**):
- **Recorrido completo para el chofer:** con el galpón cargado (§37), el mapa dibuja galpón → origen → destino → galpón
  (letras A a D) y "Abrir en Google Maps" arranca desde donde está el chofer con lo que le falta: sin salir, origen →
  destino → galpón; en viaje, destino → galpón. La API manda el galpón y los km al galpón. Sin galpón, como antes.
- **La distancia que ve el chofer** es la del recorrido completo, la que hace de verdad: "Recorrido completo 475,4 km" y
  debajo, en gris, "232,5 km de origen a destino" (Rocío eligió esta entre tres maquetas). Sin los km al galpón (no hay
  galpón o todavía no se calcularon), "Distancia 232,5 km" con "de origen a destino" debajo.
- **"Iniciar viaje"** pregunta "¿Iniciar el viaje #53?" con solo el recorrido ("Planta Unquillo → Supermercado Río
  Cuarto.").
- **"Ver mapa" y "Ocultar mapa":** el mismo enlace abre el mapa y, abierto, lo cierra (también el del viaje que sigue).
- **Por qué sigue un viaje de otro día:** "Hoy y próximos" incluye los viajes directos de días anteriores que no se
  iniciaron o que siguen en viaje (para que el chofer no los pierda de vista). Ahora lo dice una etiqueta amarilla
  debajo del estado: "Quedó sin iniciar" o "Entrega sin registrar".
- **Anteriores por año:** para cuando el chofer junte años de viajes, "Anteriores" tiene al lado "Año" (los años con
  viajes y el actual; arranca en el actual) y trae los viajes de a 30, del más nuevo al más viejo, con "Ver más viajes"
  al final (`GET api/HojaDeRuta?vista=anteriores&anio=2026&cantidad=30`, que devuelve `Anios` y `Hay_Mas`). Antes eran
  los últimos 30 días.
- **Cuántos viajes hay:** el selector dice "Hoy y próximos (6) · Anteriores (44)"; la de Anteriores es la del año
  elegido. La API los cuenta con las mismas condiciones que cada lista (`Cantidad_Proximos` y `Cantidad_Anteriores`).
- **Pantalla grande:** dos columnas de tarjetas desde 1200 px.
- **Tarjetas más cortas, también en el celular:** solo los datos que tienen valor (de a dos; de a tres desde 576 px), el
  camión solo con el dominio, "Ver mapa" y "Abrir en Google Maps" en un renglón y los botones del pie lado a lado. A
  390 px, una tarjeta pasó de unos 650 a 420 px de alto.
- **El menú del chofer:** un usuario que solo tiene la Hoja de ruta tiene el menú con el logo de SGTL y solo "Hoja de
  ruta", plegado al entrar; el botón de tres rayitas lo abre. No ve la Documentación (Manual e Informe de versión, que el
  resto de los usuarios sigue viendo). `Login.html` lo marca al entrar y `sidebar-loader.js` lo confirma con los
  permisos.
- **Arreglo del menú en el celular (todas las pantallas, commit aparte "Menú: …"):** el botón de tres rayitas
  oscurecía la pantalla pero el menú no aparecía, y la cruz lo cerraba dejando la pantalla oscura y sin scroll. El
  plegado de `components/sidebar.js` ahora es solo de la computadora (más de 1200 px); en el celular lo maneja la
  plantilla.

**Probar en la VM los ajustes** (después de los pasos de abajo, con el script de §37 corrido y el galpón cargado):
- [ ] A. Un viaje del chofer de ayer, sin iniciar: aparece en "Hoy y próximos" con la etiqueta amarilla "Quedó sin
  iniciar". Uno en viaje que llegaba ayer: "Entrega sin registrar".
- [ ] B. Las cantidades del selector coinciden con las tarjetas de cada vista (Anteriores, con "Ver más viajes" hasta el
  final) y cambian al iniciar o entregar un viaje de un día anterior. Con viajes de otro año, elegirlo en "Año".
- [ ] C. Un viaje con el galpón y los km al galpón calculados (abrir antes su Ver detalle como admin): "Recorrido
  completo" con el total y "… de origen a destino" debajo; el mapa con A a D. Uno sin km al galpón: "Distancia".
- [ ] D. "Ver mapa" abre el mapa y "Ocultar mapa" lo cierra, también en el viaje que arranca con el mapa abierto.
- [ ] E. Entrar como chofer → menú plegado; el botón lo abre con el logo y solo "Hoja de ruta". Escribir
  `manual-usuario.html` en la barra → vuelve a la hoja de ruta.
- [ ] F. F12 a 390 px, en cualquier pantalla y con cualquier usuario: el botón de tres rayitas abre el menú; la cruz y
  tocar afuera lo cierran y se puede volver a scrollear. Como admin en la computadora: el menú de siempre, y el botón
  lo pliega y lo vuelve a abrir.

**Probado en la Mac** con una API simulada, a 390 px y a 1366 px: login del chofer → hoja de ruta; iniciar viaje;
registrar entrega con una foto grande; viaje en una proforma con el paso deshabilitado; viaje con plataforma;
el mapa con el recorrido de verdad (la API simulada en el puerto 5502, que es el que acepta la clave) y "Ver mapa";
Anteriores sin "Subir evidencia"; enlace `?viaje=` sin sesión → login → vuelve al viaje marcado; admin sin chofer → aviso; Gestionar
usuarios: asignar, quitar y el error de un chofer que ya tiene usuario. **La API no se compiló** (en la Mac no se puede).

**Probar en la VM:**
- [ ] 0. Rocío corre `database/hoja-de-ruta/01_usuario_chofer.sql`: primero tal cual (dice "Falta" en las tres), después
  con `@Aplicar = 1` ("Listo: …"). Correrlo otra vez: "Ya está" en las tres.
- [ ] 1. `pull`, **recompilar la API** (controller nuevo `HojaDeRutaController.cs`; cambió `GruposController.cs`) y
  Ctrl+F5. `node tests/hoja-de-ruta.test.js` → OK.
- [ ] 2. Como admin, Gestionar grupos y permisos: registrar el grupo "Choferes" y tildarle solo "Hoja de ruta" (está en
  General).
- [ ] 3. Gestionar usuarios → Registrar usuario: rol user, grupo Choferes y en "Chofer" un chofer de prueba (nombres
  creíbles). Editar otro usuario: ese chofer ya no aparece en la lista. Editar el nuevo: muestra su chofer.
- [ ] 4. Gestionar viajes: registrar para ese chofer un viaje de cliente directo para hoy, otro para mañana y uno de un
  cliente con plataforma.
- [ ] 5. Cerrar sesión y entrar con el usuario chofer: va directo a la Hoja de ruta con el menú plegado; el botón de tres
  rayitas lo abre con el logo y solo "Hoja de ruta". Escribir `index.html` en la barra lleva de vuelta a la hoja de ruta.
- [ ] 6. F12 a 390 px: el viaje de hoy → "Iniciar viaje" → confirmar → En viaje. "Registrar entrega" sin completar →
  errores debajo de cada campo y "Revisá los campos marcados."; con resultado y una foto → "Viaje #N entregado." y
  "Ver evidencia" la muestra. "Abrir en Google Maps" abre el recorrido.
- [ ] 7. Como admin, Gestionar viajes: el viaje está Entregado con la evidencia; Auditoría muestra el cambio de estado y
  la evidencia con el usuario del chofer.
- [ ] 8. El viaje en viaje (o el primero de hoy) muestra el mapa con el recorrido; los demás, "Ver mapa", que lo
  despliega ("Ocultar mapa" lo cierra). El viaje con plataforma no tiene botones. "Anteriores" arranca en el año actual (si el chofer tiene viajes
  de otro año, elegirlo en "Año") y ningún viaje dice "Subir evidencia": los entregados con evidencia, "Reemplazar
  evidencia".
- [ ] 9. Seguridad: en Swagger o Postman, `GET http://localhost:50222/api/HojaDeRuta` sin `Authorization` → 401. Con
  el token del chofer (sale del `localStorage` del navegador), `POST api/HojaDeRuta/Viajes/{id}/Iniciar` de un viaje
  de otro chofer → 404 "Ese viaje no está en tu hoja de ruta.".
- [ ] 10. Como admin sin chofer asignado, Hoja de ruta: el aviso "Tu usuario no tiene un chofer asignado…".
- [ ] 11. Cerrar sesión y abrir `http://localhost:5502/hoja-de-ruta.html?viaje={id}` → login con el chofer → vuelve al
  viaje, marcado.
- [ ] 12. Al terminar, borrar los viajes y el usuario de prueba (por ID y nombre) y quitarle el chofer al usuario.

**Para coordinar con Fede (WhatsApp, su módulo; no se tocó nada):** Rocío eligió sumarle a la hoja de ruta por
WhatsApp el enlace al sistema. Haría falta: en la plantilla de Meta, un botón con URL dinámica (o una variable más) que
termine en `hoja-de-ruta.html?viaje={id}`; en `ViajeWhatsAppDispatcher` mandar el número del viaje (el payload ya lo
tiene: `ViajeId`) y la dirección pública del sistema (un dato nuevo en Gestionar integración de WhatsApp). La plantilla
nueva la tiene que aprobar Meta. **Ojo:** desde el celular del chofer el enlace anda recién cuando el sistema esté
publicado; hoy el front y la API corren en `localhost`.

**Queda para después:**
- La sesión dura 30 minutos (`JwtConfig.ExpirationMinutes`, para todos): el chofer va a tener que volver a entrar
  seguido. Ver si conviene una sesión más larga para los choferes.
- Volver un paso atrás desde el celular: hoy, si el chofer se equivoca, lo corrige la oficina en Gestionar viajes.
- **Avisar la entrega de un viaje con plataforma** ("marcarlo como entregado para dejar avisado", idea de Rocío del
  24/10): ese flujo no tiene estado Entregado (pasa de Registrado a Listo para facturar), así que es un cambio del flujo
  de viajes con plataforma. Decidirlo con la revisión de los flujos de viajes.
- Un caso de prueba nuevo en la tesis (parte 5) con el resultado de la VM.
- **Estadísticas del chofer** (idea de Rocío, 24/10): que vea las suyas. Propuesta: un resumen corto arriba de la hoja
  de ruta (este mes: viajes entregados, km del recorrido completo, gastos rendidos), no un dashboard aparte: el chofer
  no tiene Dashboard ni Tableros y usa el celular. Solo lo suyo, sin compararlo con otros choferes. Sale de lo que ya
  hay (`VIAJES`, `VIAJE_GASTOS` y los km al galpón del §37), con el chofer del token.
- En el celular, la fecha de entrega usa el calendario del teléfono (flatpickr en modo móvil, como en todo el sistema:
  ya anotado en "Fechas en el celular" del §24).

---

## 37. Control interno de los viajes: recorrido completo, kilometraje, combustible estimado y gastos del chofer — HECHO EN LA MAC (24/10), FALTA CORRER EL SCRIPT, COMPILAR Y PROBAR EN VM

Idea de Rocío (24/10) para tener control interno de cada viaje. El viaje real no es solo de A a B: el camión sale del
galpón, va vacío al origen a buscar la carga, la lleva al destino y vuelve vacío al galpón. Ese recorrido no estaba en
ningún lado, ni lo que cuesta. **Decisiones de Rocío (24/10):** el galpón se carga aparte en Gestionar empresa (no es el
domicilio fiscal); todo se ve en Ver detalle del viaje; el precio del gasoil se carga en Gestionar camiones; el chofer
carga gastos en todos sus viajes desde que empiezan; el chofer no carga kilómetros a mano (sale de Google Maps).

**Qué se hizo:**
- **Base:** `database/costos/01_galpon_kilometraje_y_gastos.sql` crea `GALPON`; `ORIGEN.Km_Galpon` y
  `DESTINO.Km_Galpon` (km del galpón al origen y del destino al galpón); `CAMIONES.Km_Inicial`, `Fecha_Km_Inicial` y
  `Consumo_L_100km`; `PRECIOS_GASOIL` (precio por litro con su fecha desde) y `VIAJE_GASTOS` (lo que rinde el chofer,
  con el ticket). Idempotente, con diagnóstico (`@Aplicar = 0`). No cambia datos.
- **Recorrido completo** = km al galpón del origen + km del viaje + km al galpón del destino. Los tramos al galpón se
  guardan una vez por origen y por destino (no viaje por viaje), así sirve para los viajes viejos, los nuevos y los de
  plataforma. Los calcula el navegador con Google Maps (`assets/static/js/galpon-km.js`: la clave de Google es del
  navegador), cuando faltan: al guardar el galpón (todos, con el avance a la vista), al entrar a Gestionar camiones (en
  segundo plano) y al abrir el detalle de un camión o de un viaje (solo los que faltan). Si cambia el galpón, se borran y
  se vuelven a calcular.
- **API:** `CostosController` (nuevo, en el `.csproj`): galpón, km al galpón, precio del gasoil, kilometraje del
  camión, costo del viaje y el ticket de un gasto. Todo pide el token. El galpón lo cambia solo un administrador; el
  gasoil y el kilometraje, administradores o "Gestión de camiones"; el costo de un viaje y los tickets, administradores o
  permiso de viajes (el chofer no los ve). Los gastos del chofer van en `HojaDeRutaController` (ver, cargar, eliminar y
  el ticket), con el chofer del token.
- **Gestionar empresa:** pasa a dos secciones (§3.2 del design system): "Datos para los documentos" (lo de siempre) y
  "Galpón" (provincia, localidad, calle y altura), cada una con su Guardar.
- **Gestionar camiones:** arriba de la tabla, "Precio del gasoil: $ … el litro desde …" y "Cambiar precio del gasoil"
  (con los precios anteriores: cada viaje usa el de su fecha). En Registrar y Editar camión, el bloque "Kilometraje y
  consumo": el kilometraje del tablero, su fecha y los litros cada 100 km (se guarda después del camión).
- **Listar camiones → Ver detalle:** "Kilometraje de hoy" = el inicial + el recorrido completo de cada viaje entregado
  desde esa fecha (Entregado, Listo para facturar o Facturado), y el consumo.
- **Ver detalle del viaje** (Listar y Gestionar viajes, dashboard): bloque "Recorrido completo y costo" con los tres
  tramos y el total, el combustible estimado (km × consumo del camión × gasoil a la fecha del viaje), los gastos del
  chofer con "Ver ticket" y el margen estimado: importe del viaje − combustible estimado − los demás gastos (el
  combustible rendido se compara con el estimado, no se resta dos veces). Lo dibuja `costos-viaje.js`, que
  `viaje-detalle.js` carga solo.
- **Hoja de ruta (chofer):** "Cargar gasto" (combustible con los litros, peaje, comida u otro; importe, fecha, detalle
  y la foto o el PDF del ticket, que se achica como la evidencia) y la lista de sus gastos del viaje, con "Ver ticket" y
  "Eliminar" (con confirmación). En una lista y no en una tabla: en el celular una tabla no entra.
- **Pruebas:** `tests/control-interno.test.js` (permisos de cada acción, el script, el margen y que cada pantalla cargue
  lo suyo) y `tests/hoja-de-ruta.test.js` (cuándo se puede cargar un gasto). Las 22 pasan.
- **Documentos:** design system (§3.2 y §10) y tesis (partes 2, 4 y 5).

**Probado en la Mac** con la API simulada en el puerto 5502 (el que acepta la clave de Google, así los km son de
verdad): guardar el galpón → "7 de 7" calculados (por ejemplo, galpón → Depósito Ferreyra 15,7 km); cambiar el precio
del gasoil; kilometraje y consumo de un camión (y el aviso si falta la fecha); Ver detalle del camión (245.000 km +
2.975,5 km de 4 viajes); Ver detalle de un viaje (824,2 km, combustible, gastos, margen); cargar un gasto con una foto de
4 MB (subió de 925 KB) y eliminar otro, a 390 px. **La API no se compiló** (en la Mac no se puede).

**Probar en la VM:**
- [ ] 0. Rocío corre `database/costos/01_galpon_kilometraje_y_gastos.sql` (primero tal cual, después con
  `@Aplicar = 1`). El importe del viaje es de `database/tarifas/02_…` (§34): sin ese script el detalle sale sin margen.
- [ ] 1. `pull`, **recompilar la API** (controller nuevo `CostosController.cs`; cambió `HojaDeRutaController.cs`) y
  Ctrl+F5. `node tests/control-interno.test.js` → OK.
- [ ] 2. Gestionar empresa → Galpón: la dirección real del galpón → Guardar → "Galpón guardado." y debajo "Calculando
  los km al galpón… N de M" hasta "Se calcularon los km al galpón de M de M orígenes y destinos.".
- [ ] 3. Gestionar camiones: "Cambiar precio del gasoil" con el precio de hoy. Editar el camión: el kilometraje del
  tablero de hoy, la fecha y el consumo (pedirle a la empresa el consumo real). Sin la fecha → "Completá la fecha del
  kilometraje.".
- [ ] 4. Listar camiones → Ver detalle: "Kilometraje y consumo" con el kilometraje de hoy.
- [ ] 5. Listar viajes → Ver detalle de un viaje entregado: "Recorrido completo y costo" con los tres tramos (comparar
  uno con Google Maps a mano), el combustible estimado y el margen.
- [ ] 6. Como chofer (§36): "Cargar gasto" de combustible con litros y una foto → la tarjeta dice "1 · $ …"; "Ver
  ticket" la muestra; "Eliminar" pide confirmación. Como admin, el gasto aparece en Ver detalle del viaje.
- [ ] 7. Seguridad: con el token del chofer, `GET api/Costos/Viajes/{id}` → 403; sin token → 401.
- [ ] 8. Auditoría: el galpón, el gasoil, el kilometraje y los gastos quedan registrados con su usuario.

**Queda para después:**
- **Viajes encadenados:** si desde un destino el camión va directo al origen del siguiente (la 2ª vuelta del día), el
  recorrido cuenta igual la vuelta al galpón. Se podría mirar el viaje siguiente del mismo camión.
- **Peajes estimados:** Google no los da bien en la Argentina; por ahora salen de los tickets.
- **Tableros:** kilometraje por camión, % de km en vacío y margen por cliente o por ruta (para el chat de tableros).
- **Adicionales que se pueden facturar al cliente** (Rocío, 24/10): algo nuevo aparte.
- Que la oficina pueda cargar o corregir un gasto (hoy los carga el chofer desde la hoja de ruta).
- Cuando el sistema se publique, sumar el dominio a la clave de Google Maps (hoy acepta solo `localhost:5502`).
