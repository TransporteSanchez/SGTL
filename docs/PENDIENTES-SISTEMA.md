# Pendientes a corregir en SGTL

Relevamiento del 14/10/2026 (prueba de Viajes en la VM + revisión en la Mac).
**Última actualización de este documento: 22/10/2026.**

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
| 24 | Viajes: registrar, editar y ver detalle; Ver detalle de choferes, camiones, clientes y usuarios con el mismo armado; ronda de observaciones (ícono de información, íconos alineados, proforma de Rukas) | Hecho en la Mac (22/10) con API simulada, con la propuesta aprobada por Rocío | **Pusheado** (`cea8407`, `72c1600`, `dd6034c`; la ronda de observaciones, `910ca32`, `3917181`, `c2bf14b`; la tercera vuelta de Rukas y lo que siguió, `3751c33` y los dos siguientes; 22/10) | Sin C#: `pull` y Ctrl+F5 (ver §24) |
| 25 | Proformas: los datos del cliente no se editan en la proforma; "Editar cliente" abre la edición del cliente y actualiza los borradores | Hecho en la Mac (22/10) con API simulada; decidido por Rocío charlándolo con Facu | **Pusheado** (`b7e183d`, `eb6d96b`; 22/10) | **Compilar la API** y probar (ver §25) |

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
- [ ] **Facturación del período y deuda vencida**: fechas en `dashboard/top-clientes-facturacion` y un total de saldo vencido. Es cuenta corriente: coordinar con Facu.
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
- [ ] **Pendiente (decisión de Rocío, 22/10): pasar todos los permisos a los nombres del menú** ("Gestionar choferes",
  "Listar viajes", "Gestionar cuenta corriente"…), como pide §3.1 del design system. Hoy el catálogo de Grupos y
  permisos usa "Gestión de…", "Listado de…". Implica: renombrar los 23 en `GruposController` conservando las
  asignaciones (la API ya sabe hacerlo), que `sidebar-loader.js` (`MENU_TO_PAGE`) y la API de presupuestos
  (`EnviosPresupuestosController`, que da acceso por nombre: "Gestion de viajes" o "Presupuestos") acepten los nombres
  nuevos y los viejos, y hacerlo cuando las ramas de todos estén al día (una API vieja vuelve a crear los nombres viejos
  como permisos vacíos al abrir Grupos y permisos).
- [ ] **Pendiente: permisos que no dan acceso.** En Grupos y permisos se pueden tildar E-mail, Gestión de contenido,
  Integración WhatsApp y Gestión de tipos de comprobante, pero esas pantallas son solo de administradores: tildarlos no
  le da acceso a nadie. Marcarlos como "solo administradores" o sacarlos del listado. Catálogo de Facu: verlo con él.

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
  - [ ] "Auditoria" y "Cuenta Corriente" en Grupos y permisos: van con el renombre de permisos de arriba.
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

## 24. Viajes: registrar, editar y ver detalle — PUSHEADO, FALTA PROBAR EN VM (22/10)

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


### Ronda de observaciones de Rocío (22/10) — PUSHEADO (`910ca32`, `3917181`, `c2bf14b`), FALTA PROBAR EN VM

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


### Control de la proforma de Rukas, tercera vuelta (22/10) — PUSHEADO (`3751c33`), FALTA PROBAR EN VM

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

### Presupuestos y avisos de dos renglones (22/10) — PUSHEADO (22/10), FALTA PROBAR EN VM

Dos pedidos de Rocío después de la tercera vuelta. **Sin C#:** `pull` y Ctrl+F5.

- **Gestionar presupuestos** (pantalla de Facu, **avisarle**): el viaje que generó el presupuesto pasa de la etiqueta
  "Viaje #N" debajo del estado al ícono gris de información al lado ("Generó el viaje #N."), como en Gestionar
  viajes (§4.3). Solo cambia cómo se ve.
- **Avisos arriba a la derecha** (todo el sistema): con dos renglones, el ícono y la cruz quedan a la altura del
  primero, no en el medio (§12).
- Design system: en §4.3, si hay varias cosas a la vez manda el ícono más urgente (en proformas, el rojo aunque
  también se espere a Rukas; el reloj, solo si esperar es lo único).

**Probar en la VM** (Ctrl+F5):
- [ ] 1. Gestionar presupuestos: un presupuesto aceptado con viaje muestra "Aceptado" y el ícono gris; el globito dice
  "Generó el viaje #N."; los estados quedan alineados en toda la columna, con ícono o sin él.
- [ ] 2. Un aviso largo (por ejemplo, editar un cliente con un borrador de proforma): el ícono verde y la cruz a la
  altura del primer renglón.
- [ ] 3. Gestionar proformas: un borrador de Rukas que espera a Rukas y además tiene algo para corregir muestra el
  ícono rojo; uno que solo espera, el reloj naranja de borde.

---

## 25. Proformas: datos del cliente desde el cliente, no desde la proforma — PUSHEADO (`b7e183d`, `eb6d96b`), FALTA COMPILAR Y PROBAR EN VM (22/10)

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
