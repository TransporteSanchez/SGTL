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
| 10 | Relevamiento visual y design system | Piloto en Choferes OK. **20/10: aplicado a camiones, clientes, usuarios, grupos, tarifas, orígenes y destinos, auditoría, contenido, login y dashboard.** Faltan viajes y las pantallas de Facu y Fede (ver §10) | Piloto pusheado (`020e892`); tanda del 20/10 **sin pushear** | Tanda del 20/10: probar en VM (tabla en §10) |
| 11 | Documentación ordenada en `docs/` + `docs/README.md` y `AGENTS.md` | Hecho (18/10) | **Pusheado** (`ae6288d`) | **OK en la práctica:** la VM usó `docs/equipo/PRUEBAS-VM-CLAUDE.md` en todas las rondas del 18/10 |
| 12 | Merge de presupuestos de Facu (`4a84bb2`) en `rocionuvoli` + botones "+" | Hecho (18/10); F1 corregida | **Pusheado** (`4635408`) | **OK en VM (18/10)**, F1 verificada (ver §12) |
| 13 | Mejoras de la ronda del 18/10 (viajes, presupuestos, proformas) | Primera tanda **OK en VM**; segunda tanda (C4 y mejoras del reporte) hecha | **Pusheado** (`bb418bc`) | Segunda tanda: en la ronda única (ver §13 y §14) |
| 14 | Merge de Documentación de Facu (`04a394b`): manual de usuario e informes de versión | Hecho (19/10); base verificada | **Pusheado** (`e3359ea`) | En la ronda única (ver §14) |
| 15 | Mejoras de la meet del 18/10: reenviar WhatsApp, aviso al eliminar viaje, cambiar contraseña con código por WhatsApp, sacar `repositorio.zip` | **No hecho** (solo anotado) | — | Ver §15 |
| 16 | Diagramas de los flujos para que Facu y Fede prueben y para la presentación con la profesora | **Primera versión hecha (19/10):** viajes y proformas (propia y Rukas) + instructivo de prueba y guion | Commit del 19/10 | Ver §16 |
| 17 | Pasar `rocionuvoli` a `facugodoy`, `fedemontenegro` y `main` | **Hecho (19/10):** las cuatro ramas iguales. `fedemontenegro` se pisó con el OK de Fede | **Pusheado** | Fede tiene que resetear su copia local (ver §17) |
| 18 | Merge de Facu del 20/10 (`e701a4f`): concepto obligatorio en proformas, recibos y comprobantes, permisos agrupados y usuarios por grupo | Hecho (20/10); Grupos y permisos con nuestro diseño y el comportamiento de Facu | **Pusheado** a las cuatro ramas (`2a23274`, 20/10, antes de terminar la prueba) | Script `database/menu/02_…` **aplicado (20/10)**. **Probado en parte (20/10):** lo probado OK; falla el modo oscuro de cuenta corriente (de antes); falta lo que genera numeración (ver §18) |
| 19 | Dashboard dinámico: período (último mes, trimestre, semestre, año o a mano), indicadores con comparación, gráficos de viajes y km, km por camión, últimos y próximos viajes, comparativa por mes, para revisar, ITV de camiones y km por chofer | Hecho en la Mac (21/10) con API falsa; `ResumenCosto` acepta fechas | **Pusheado** (`cc2dcac`, `b991c8f`, `200beaa`) | Recompilar la API y probar (ver §19) |
| 20 | Estilo visual nuevo (§12 del design system) en todas las pantallas: fondo claro con línea de color, tarjetas, tablas, campos, botones livianos, avisos, modales, pestañas, paginador, calendario | En curso (22/10): base aplicada a las 26 pantallas; viajes, proformas, cuenta corriente, Gestionar facturación, e-mail, WhatsApp, login, presupuestos, documentación y dashboard al día; falta el repaso final (ver §20) | **Sin pushear** | Ver §20 |

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
  - **Supuesto para la tesis:** Marfrig corrige la misma proforma y conserva el N° (premisa 3 y pregunta 8 del documento de negocio; anteproyecto, "Límites").
  - Probado en la Mac con una API simulada (datos inventados): pasos, importación al elegir, archivo que no es de Rukas, N° ya cargado, nombre sin N°, reclamo por línea, volver a controlar, reemplazar, confirmación de generar, Ver/Editar, vuelta a un cliente directo y ancho de celular.
  - **Probar en VM. Antes:** Rocío corre `02_reclamo_por_linea.sql` en SSMS (sin la columna, la API nueva falla al leer las líneas). Recompilar; Ctrl+F5. (1) Registrar proforma con un cliente directo: igual que antes. Cambiar a QUICKFOOD: pasos, cliente en una línea ("Editar datos del cliente" despliega los campos), zona del Excel, guía y condiciones plegadas, "Generar" gris con el motivo en el pie. Volver a un directo: todo como antes. (2) Elegir `proforma-rukas-formato-invalido…`: aviso "Este archivo no es el Excel de Rukas…" y no se crea nada. (3) Elegir `proforma-rukas-repetido…`: se crea el borrador solo; la segunda línea 990001 en "Para reclamar a Rukas". Elegir el mismo archivo otra vez desde Registrar proforma: "ya está cargada como borrador" con "Abrir el borrador", que lo abre. Registrar reclamo: la línea viene marcada y el motivo armado → Guardar → "Esperando a Rukas (1)"; en el listado, la situación junto a Borrador. Cerrar reclamo y eliminar el borrador. (4) Caso 3 de la demo (`docs/pruebas/datos/README.md`): 990002 en "Para corregir en SGTL"; el ícono abre Gestionar viajes en otra pestaña; corregir el N°, guardar y volver: se controla solo y queda todo OK. Eliminar el borrador. (5) Caso 2: 990002 en "Para revisar"; Registrar reclamo marcando el 990002; Editar reclamo; Reemplazar Excel con el corregido → todo OK y "Generar" verde. "Generar" → confirmación en el pie → Cancelar vuelve a los botones. (Generar de verdad consume un N° PF: pedir OK.) (6) Ver (ojo) de un borrador: sin acciones y "Ver datos del cliente". (7) En DevTools a 390 px: el modal se usa y la tabla se desplaza hacia el costado.
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

## 10. Relevamiento visual y design system — EN CURSO

Las pantallas se ven y se comportan distinto según la etapa en que se hicieron (avisos, fechas, colores de estado, tono, botones). El objetivo es definir un design system y aplicarlo a todo.

1. [x] Relevamiento por código de las 23 pantallas (17/10, actualizado con el merge de Facu): `docs/design-system/01-relevamiento-codigo.md`. Incluye las decisiones a tomar (D1–D17).
2. [x] Capturas en la VM (17/10): 91 capturas en `.pruebas-locales/capturas-ui/2026-10-17/` (fuera de git) y reporte en `docs/pruebas/2026-10-17-capturas-ui.md`. Configuración de facturación y de e-mail salieron con error por token vencido, y alta, errores y exportar de Gestionar proformas se sacaron en el listado: repetirlas solo si hacen falta.
3. [x] Repaso con Rocío de las decisiones D1–D17, una por una, con las capturas a la vista (17/10). Quedaron en `docs/design-system/03-decisiones.md`.
4. [x] CSS y JS de interfaz compartidos (`assets/static/css/sgtl.css`, `assets/static/js/sgtl-ui.js`) y regla en `CLAUDE.md` que apunta a `docs/design-system/03-decisiones.md` (17/10).
5. [x] Piloto en Choferes hecho en la Mac (17/10) y **OK en la VM** (17/10, commit `020e892`, Live Server 5500): 11 ítems, el único "FAIL" era el checklist (la cruz de Estado deja Todos, como dice §3.3). Quedó el chofer de prueba ID 10 (abajo).
6. [ ] Aplicar el design system al resto de las pantallas (anotado el 18/10). **20/10: hechas las nuestras salvo viajes** (ver "Tanda del 20/10" abajo). Reglas en `docs/design-system/03-decisiones.md`. Solo frente: HTML/JS + menú. No tocar API, numeración, SMTP, token de WhatsApp ni PDF. Cada pantalla pasa a `SGTL` (toasts, confirmación, cruz de filtros, badges, botones de fila, fechas/montos). Menú y título iguales, en infinitivo. Se sacan `alert()` / `confirm()` / `prompt()`, el botón Limpiar y "Confirmar" en el pie de los modales.

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
- Falta de viajes: filtros (Limpiar, calendario viejo → flatpickr con cruz), los dos `confirm()` del modal de estado, la X de los modales (Feather) y el modal de detalle de Listar viajes.
- **Probar en la VM:** en Gestionar viajes, los colores de estado y que editar / estado y entrega / eliminar abran lo mismo que antes; en un viaje facturado o en proforma, los botones deshabilitados con su motivo. En Listar viajes, la columna Estado, el ojo y Exportar.

**Presupuestos, botones (20/10, pantalla de Facu, a pedido de Rocío):** los botones de la fila pasan a `SGTL.botonFila` en el orden editar → PDF → enviar por e-mail → generar viaje (verde) → eliminar, con las mismas reglas de habilitado y el motivo en el tooltip; eliminar usa la confirmación compartida (antes `confirm()`). La pantalla carga `sgtl.css` y `sgtl-ui.js`. Sin tocar: el desplegable de estado de la fila (Rocío, 20/10: queda como está; **verlo con Facu** si pasa a etiqueta de color — Pendiente gris, Aceptado verde, Rechazado rojo — con "Marcar como aceptado" / "Rechazar" como siguiente paso), los avisos propios (`aviso()`), filtros y modales. **Avisarle a Facu.** **Probar en la VM:** cada botón abre lo mismo que antes; en un presupuesto con viaje, editar, generar y eliminar deshabilitados con su motivo.

**Etiquetas de estado en proformas, facturación y e-mail (20/10, pantallas de Facu, a pedido de Rocío):** solo la pastilla. Borrador gris, Generada azul, Aceptada amarillo, Facturada verde, Anulada rojo (`SGTL.estado`); en facturación, Activo verde e Inactivo gris; en e-mail, el número de servicio queda blanco con borde y SSL/TLS usan Sí verde / No gris. La pastilla del título del modal de proforma (gestionar y listar) sale de la misma función que la tabla. No cambia la API, los filtros ni los pasajes de estado. El chip de plataforma y el resultado del Excel quedan como estaban. **En la Mac (20/10), con API simulada, se vio la grilla de Gestionar proformas (los cinco colores) y el modal en Borrador.** Falta mirar el resto de los modales, Listar proformas, Gestionar facturación y Gestionar e-mail. **Avisarle a Facu.** **Probar en la VM:** en Gestionar proformas y Listar proformas, cada estado en la grilla y al abrir el modal; en Gestionar facturación, una fila activa y una inactiva; en Gestionar e-mail, un Sí y un No de SSL y de TLS.

**Menú lateral: grupo de la pantalla actual cerrado (anotado el 20/10, sin hacer):**
- [ ] Rocío vio que al entrar, por ejemplo, a Gestionar proformas, el grupo Facturación aparece cerrado; al abrirlo, la opción está marcada. En la Mac no se reproduce: `markActiveSidebarItem` (`sidebar-loader.js`) marca la opción y `components/sidebar.js` abre su grupo (probado en 1366 y 1100 px, en Gestionar proformas, Listar proformas, Gestionar cuenta corriente y Gestionar camiones). Antes de tocar código, ver en la VM, después de `git pull` + Ctrl+F5, si el grupo está cerrado o si está abierto pero fuera de la vista (el menú es más alto que la pantalla). Si es lo segundo: que el menú baje solo hasta la opción activa al cargar. Si es lo primero: captura y revisar en la VM.

### Falta aplicar (retomar después)

**Menú y títulos en infinitivo (§3.1): hechos en todas las pantallas el 20/10**, también las de Facu y Fede: Gestionar cuenta corriente, Gestionar facturación, Gestionar e-mail, Gestionar integración de WhatsApp, Listar proformas (título), Gestionar presupuestos, Consultar manual de usuario y Consultar informe de versión. Solo cambian el texto del menú, el título visible y la pestaña (y dos mensajes que nombraban "Configuración > E-mail"); el PDF de cuenta corriente sigue titulado "Cuenta Corriente de Clientes". Los permisos van por archivo, así que no cambia quién ve qué. **Probar en la VM:** con un usuario admin y uno user, el menú muestra lo mismo que antes con los nombres nuevos. Renombrar no cambia permisos (van por archivo).

| Hoy en el menú | Pasa a |
|---|---|
| Cuenta corriente | Gestionar cuenta corriente |
| Configuración → Facturación | Gestionar facturación |
| Configuración → E-mail | Gestionar e-mail |
| Configuración → Gestión de contenido | Gestionar contenido |
| Configuración → Integración WhatsApp | Gestionar integración de WhatsApp |
| Auditoría | Auditoría (queda sin verbo: es ítem principal, 20/10) |

Listar proformas y Gestionar proformas ya están en infinitivo. Dashboard no se renombra.

**Nuestras** (se pueden hacer sin avisar). **20/10: hechas todas menos viajes**; la tabla queda como referencia:

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

**Facu** (avisar antes; unificar igual): solo frente, no la lógica. **20/10: las etiquetas de estado de proformas, facturación y e-mail ya usan el design system** (párrafo de arriba). El resto de esta tabla sigue pendiente.

| Pantalla | Archivos | Qué cambia además de lo común |
|---|---|---|
| Listar proformas | `listado-facturas.html`, `reportes-proformas.js` | Título "Listar proformas"; exportar solo ícono (el modal Excel/PDF **se queda**); ~5 `alert()` → toasts |
| Gestionar proformas | `gestion-facturacion.html`, `facturacion-proforma.js`, `anulacion-factura-proforma.js` | "Nueva proforma" azul → "Registrar proforma" verde; "Confirmar eliminación" → Cancelar + Eliminar; ~17 `alert()` + `confirm()` → toasts / `SGTL.confirmar` (anular, generar, emitir) |
| Gestionar cuenta corriente | `cuenta-corriente-clientes.html`, `cuenta-corriente-clientes.js` | "Nuevo recibo" → Registrar recibo; fechas nativas → flatpickr; `alert`/`confirm`/`prompt` → toasts + confirmación con motivo; sacar `theme-dark`; pestaña activa al color del menú. Borrar la fecha = sin límite (no últimos 30 días) |
| Gestionar facturación | `configuracion-facturacion.html`, `configuracion-facturacion.js` | Título = menú; `confirm()` al desactivar → `SGTL.confirmar`. Las 3 tablas siguen sin paginar |
| Gestionar e-mail | `configuracion-email.html` | "Nueva configuración" → Registrar configuración de e-mail. La nota de SMTP se queda |
| Gestionar presupuestos | `presupuestos.html`, `presupuestos.js`, `presupuesto-pdf.js` | Ya tiene "Registrar presupuesto", "Registrar origen/destino" y "Guardar" (18/10). Falta: cargar `sgtl.css` / `sgtl-ui.js`, avisos propios → toasts `SGTL`, acciones de fila con `SGTL.botonFila`, eliminar con `SGTL.confirmar` |
| Manual de usuario e Informe de versión | `manual-usuario.html`, `informe-version.html`, `documentacion.js` | Pantallas nuevas de Facu (19/10). avisos con `SGTL` |

**Fede** (avisar antes; unificar igual):

| Pantalla | Archivos | Qué cambia además de lo común |
|---|---|---|
| Gestionar integración de WhatsApp | `configuracion-whatsapp.html` | Título = menú; avisos de página → toasts; labels "Token de acceso" / "ID del número de teléfono" (el nombre de Meta queda en la ayuda). El formulario y lo que guarda no cambian |

**No entra en esta pasada:** pasar el CSV de choferes/camiones/clientes/viajes al modal Excel/PDF (queda para después). R7 (viajes facturados en borrador #12) es de Facu, no es visual.

Bugs vistos en el relevamiento (no visuales):

| ID | Qué | Gravedad | Cuándo | Archivos |
|---|---|---|---|---|
| R1 | El botón de reporte CSV no hace nada: llama a `generarReporteCSV()`, que no existe en esa página | Media | Ya (sigue igual después del merge) | `listado-viajes.html` (158), `gestion-clientes.html` (179) |
| R2 | Gestión de contenido: `showErrorToast()` no existe; si falla la red al cargar o guardar, tira error y no avisa | Baja | Ya | `gestion-contenido.html` (299, 361) |
| R3 | Camiones: el error de fecha pide "DD-MM-YYYY" pero el campo usa AAAA-MM-DD | Baja | Con la decisión de fechas (D11) | `gestion-camiones.html` (1082) |
| R4 | "Cambiar Contraseña" (encabezado) es un link que no hace nada. ("Documentación" del menú ya funciona desde el merge de Facu del 19/10) | Baja | Decidir si se implementan o se sacan | `views/header.html` (34), `sidebar-loader.js` (90) |
| R5 | `</script>` suelto en el pie (inofensivo) | Baja | Con el piloto | `listado-viajes.html` (204) |
| R6 | Exportar en camiones baja solo la página visible (15 filas), no todo lo filtrado, y no avisa. En choferes ya pide `pageSize: 0` (piloto 17/10); falta camiones | Media | Con el botón de exportar (decisión 1.2) | `gestion-camiones.html` (1620), `listado-camiones.html` (684) |

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
- [ ] **Cambiar contraseña con código por WhatsApp (doble factor).** Cómo está hoy (revisado en el código el 19/10):
  - En el menú del usuario (`views/header.html`), "Cambiar Contraseña" es un link a `#`: **no hay pantalla** y ningún JS llama a la API.
  - La API tiene `POST api/Usuarios/CambiarContrasena` (`UsuariosController.cs`): recibe usuario, contraseña actual y nueva, valida 8–20 caracteres con letras y números. Pero toma el **usuario del cuerpo del pedido, no de la sesión**, y devuelve "Usuario no encontrado" / "La contraseña actual es incorrecta" por separado (permite averiguar qué usuarios existen).
  - **Las contraseñas se guardan y comparan en texto plano** (`LoginController.cs` y `CambiarContrasena` comparan `Contraseña ==`). Es lo primero a resolver si se toca seguridad (guardar con hash), y conviene mencionarlo en la tesis.
  - Usuarios no tiene teléfono ni e-mail.

  Propuesta: (1) pantalla "Cambiar contraseña" desde el menú, para el usuario logueado, tomando el usuario de la sesión; (2) agregar teléfono (celular) al alta y edición de usuarios, con script nuevo en `database/usuarios/`; (3) al pedir el cambio, la API genera un código de 6 dígitos, lo guarda con vencimiento corto (ej. 10 minutos) e intentos limitados, y lo manda por WhatsApp con una **plantilla de autenticación nueva en Meta** (coordinar con Fede); (4) el cambio solo se aplica con contraseña actual + código válido. Definir qué pasa con los usuarios que ya existen y no tienen teléfono.
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

---

## 20. Estilo visual nuevo en todas las pantallas — EN CURSO, SIN PUSH (22/10)

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
- [ ] Estado y entrega de un viaje directo → Entregado sin evidencia → aparece "¿Guardar la entrega sin evidencia?"
  encima; Cancelar vuelve al modal (que sigue andando); "Guardar sin evidencia" guarda y avisa "Estado del viaje
  guardado.".
- [ ] Quitar evidencia de un viaje que tenga: confirmación "¿Quitar la evidencia…?", Quitar → toast.
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

