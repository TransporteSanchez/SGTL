# Pendientes a corregir en SGTL

Relevamiento del 14/10/2026 (prueba de Viajes en la VM + revisión en la Mac).
**Última actualización de este documento: 28/10/2026.**

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
| 3.2 | Puerto Live Server 5500 vs 5502 | **Hecho (28/10):** la VM pasa al 5502 (`port` en `fiveserver.config.js`), como Live Server en la Mac y en la máquina de Facu | **Pusheado** (28/10) | Reabrir Five Server después del `pull`: tiene que decir 5502; el enlace del recupero y Google andan en la VM |
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
| 15 | Mejoras de la meet del 18/10: reenviar WhatsApp, cancelar/eliminar con WA, cambio de chofer con WA, cambiar contraseña con código por WhatsApp, sacar `repositorio.zip` | Parcial: lo de WhatsApp en viajes lo hizo Fede y se integró el 28/10 (§58); faltan las plantillas en Meta, el código por WhatsApp y el zip | Merge de `fedemontenegro` (28/10) | Ver §15 y §58 |
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
| 33 | Editar una tabla de tarifas que ya usan viajes: qué se recalcula, qué no y cómo se avisa (lo planteó Facu) | **Hecho en la Mac (25/10):** se recalcula lo que el cliente no vio, con confirmación y motivo; lo demás queda para revisar con íconos, avisos y el tablero "Cambios de tarifa para revisar". Tarjeta fija en el dashboard, por permisos y con acceso directo a corregir. Falta la parte del comprobante (módulo de Facu, después de su cambio) | **Pusheado** (25/10) | Correr `database/tarifas/05_…`, compilar y probar los pasos 1 a 3 (ver §33) |
| 34 | Tabla de tarifas por tipo de camión ("Tarifas a agosto 2026" y, para enero a julio, "Tarifas a enero 2026"): tarifa fija por banda de km (con 1ª y 2ª vuelta; más de 250 km, la de 250 más el excedente por km) o tarifa por km, por tipo y modelo de camión; falso flete y estadía; tabla general o propia de algunos clientes; el viaje guarda su importe. Reemplaza las tarifas fijas por recorrido y las bandas por km | Hecho en la Mac (24 y 25/10) con API simulada, con las decisiones de Rocío y Claudia | **Pusheado** (24 y 25/10) | **Correr `database/tarifas/02_…` y `03_…`**, recompilar, elegir el tipo de los camiones, correr `04_…` y probar (ver §34) |
| 35 | Tableros: pantalla nueva con todos los tableros por tema (Viajes, Flota, Choferes, Facturación), gráficos de tres datos (km e ingresos por camión y mes, viajes por cliente, mes y resultado, recorridos origen × destino, rechazos por cliente y destino, facturación por cliente y mes, antigüedad de la deuda) y deuda vencida; favoritos con estrella que se ven en el dashboard y se acomodan, guardados en la base por usuario | Hecho en la Mac (24/10) con API simulada, con las decisiones de Rocío; permiso de grupo propio | **Pusheado** (`eb17fb6`, `3b3a65a`, `58a9366`; 24/10) | **OK en VM (25 y 26/10)**, sin fallas; dudas y mejoras para decidir (ver §39) |
| 36 | Hoja de ruta del chofer: entra con su usuario desde el celular, ve sus viajes, inicia el viaje y registra la entrega con la evidencia; el chofer de cada usuario se elige en Gestionar usuarios | Hecho en la Mac (24/10) con API simulada, con las decisiones de Rocío | **Pusheado** (`4ab8e02` a `53c388c` y los ajustes del 24/10: menú del chofer, tarjetas cortas, recorrido completo, Anteriores por año) | **Correr antes `database/hoja-de-ruta/01_usuario_chofer.sql`**, recompilar y probar (ver §36, también los ajustes A a F). Antes, el grupo y la cuenta del chofer de prueba con `docs/equipo/INSTRUCTIVO-CUENTAS-CHOFERES.md`; las cuentas de los choferes reales, el 26/10 |
| 37 | Control interno de los viajes: recorrido completo desde el galpón, kilometraje de los camiones, combustible estimado, margen y los gastos que rinde el chofer con su ticket | Hecho en la Mac (24/10) con API simulada (y Google Maps de verdad), con las decisiones de Rocío | **Pusheado** (24/10) | **Correr antes `database/costos/01_galpon_kilometraje_y_gastos.sql`**, recompilar y probar (ver §37). **Galpón cargado por Rocío (25/10)** |
| 38 | Documentos de prueba y tabla de tarifas "como si siempre hubiera estado": `database/tarifas/04_…` rehecho (todos los viajes y presupuestos con la tabla de su fecha, sin leyendas) y tabla de enero 2026 para los viajes viejos; falta limpiar la facturación de prueba y regenerar los documentos de la demo; tesis al modelo de la tabla | **Tabla de enero y `04` hechos (25/10).** La limpieza y los documentos, **después del cambio de Facu** ("comprobante" en lugar de "factura") | **Pusheado** (25/10) | Correr los scripts con la §34; la limpieza, después de Facu (ver §38) |
| 40 | Después de la ronda de pruebas, con prioridad (Rocío, 25/10): seguridad de la API y del JWT, e-mail desde la VM, hoja de ruta al generar un viaje desde un presupuesto, texto de la plantilla de WhatsApp (Fede), mejoras de presupuestos y proformas para cuando Facu suba lo suyo, limpieza de textos de prueba viejos, las dudas y mejoras del reporte de Tableros (26/10, después de los cambios de tarifas), los gastos del chofer en un viaje que no se hace (28/10), los textos y la estética de Restablecer contraseña, dónde va el precio del gasoil y que se distingan las tarjetas de Tableros que se comparan con el período anterior y la columna `ChofCamID` de VIAJES, sin uso (28/10) | Anotado; el WhatsApp al cancelar (punto 8) quedó hecho con Fede (§58) | — | Ver §40 |
| 41 | Listado de Rocío del 26/10: lo de tarifas (vuelta vacío, 1ª y 2ª vuelta automáticas y camión ocupado, importar el Excel, falso flete como estado, estadía con las horas, textos), lo de antes del jueves 29/10 (datos como reales, flujo de viajes, menú) y lo de después | Anotado | — | Ver §41 |
| 42 | Tabla de tarifas dinámica (tipos de camión, modelos y bandas por tabla), con `main` como plan B | **Propuesta con maqueta (26/10)**, guardada: va al final, después de las mejoras | — | Ver §42 |
| 43 | Precio por orden del día (primer y segundo viaje del mismo cliente y recorrido, 1ª y 2ª vuelta automáticas), "Precio para revisar" y camión o chofer ocupado | **Hecho en la Mac (27/10)** con API simulada, como la maqueta aprobada; toca presupuestos (Facu) | **Pusheado** (27/10) | `06` aplicado y `07` relevado (28/10): solo el viaje 40 cambia de vuelta y se actualiza al editarlo. Ronda 2 de `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md` (§43) |
| 44 | Emitir comprobantes directos con tipos de deuda configurados, como FC | Hecho en código (26/10); falta aplicar la migración y probar en VM | Incluido en `facugodoy` (27/10) | Correr `database/cuenta-corriente/13_comprobantes_directos_configurables.sql`, recompilar y probar (§44) |
| 46 | Emitir comprobantes internos desde proformas y cancelarlos con un crédito interno | Migraciones 14 y 15 aplicadas y crédito cancelatorio emitido desde proforma según el usuario (27/10); faltan los otros recorridos en VM | Incluido en `facugodoy` (27/10) | Probar una factura y un recibo, y revisar el resto de §46 |
| 47 | Editar la identidad de tipos de comprobante y marcar los electrónicos | Migración 16 aplicada según el usuario (27/10); falta probar en VM | Incluido en `facugodoy` (27/10) | Corregir una sigla y una letra con historial, y comprobar el bloqueo electrónico (§47) |
| 48 | Emitir créditos y débitos internos directos desde cuenta corriente | Corregido en código (27/10); falta desplegar y probar en VM | Incluido en `facugodoy` (27/10) | Recompilar la API, recargar y emitir con C y D activos, aunque NC y ND estén inactivos (§48) |
| 49 | Emitir créditos internos sin imputar e imputarlos después | Hecho en código (27/10); falta desplegar y probar en VM | Incluido en `facugodoy` (27/10) | Emitir C con saldo libre e imputarlo parcial y sucesivamente a comprobantes internos de deuda (§49) |
| 50 | Enviar comprobantes con su proforma y enviar proformas por e-mail | Hecho en código (27/10); falta probar entrega real por SMTP | Incluido en `facugodoy` (27/10) | Recompilar, recargar y comprobar uno o dos PDF según la casilla, y el envío desde Listar y Gestionar proformas (§50) |
| 51 | Ordenar las columnas de cuenta corriente | Hecho en código (27/10); pruebas locales OK | Incluido en `facugodoy` (27/10) | Recargar y alternar las siete columnas; comprobar filtros, paginación, aplicaciones, PDF y Excel (§51) |
| 52 | Imputar recibos después de emitirlos | Hecho en código (27/10); pruebas locales OK | Incluido en `facugodoy` (27/10) | Emitir un recibo sin deudas y usar «Imputar recibo» parcial y sucesivamente (§52) |
| 53 | Vincular un débito interno con un FC | Hecho en código (27/10); migración 17 pendiente de aplicar | Incluido en `facugodoy` (27/10) | Aplicar el script 17 y emitir un D relacionado con un FC del mismo cliente (§53) |
| 54 | Acentos en el concepto de recibos sin imputar | Texto de emisión corregido; script 18 aplicado el 28/10 (recibo 49) | Incluido en `facugodoy` (27/10) | Recompilar, emitir un recibo y revisar el 49 (§54) |
| 55 | Ordenar columnas en choferes y camiones | Hecho en código; API compilada y pruebas locales OK | Incluido en `facugodoy` (27/10) | Ordenar, paginar y exportar desde Gestionar y Listar (§55) |
| 56 | Versionar las variantes del manual y el script del PDF | Archivos incluidos; carga del PDF pendiente de revisión y ejecución | Incluido en `facugodoy` (27/10) | Revisar los Word y el resultado del script antes de aplicar (§56) |
| 57 | Recuperar contraseña desde el login por e-mail | Implementado en código; scripts de esquema y configuración pendientes | Incluido en `facugodoy` (28/10) | Aplicar seguridad 02 y e-mail 07, configurar el perfil exclusivo y probar la entrega real (§57) |
| 59 | Ronda 1 de pruebas del 28/10 (login, sesión, recupero, usuarios, grupos y el usuario del chofer) | **Probada** (`docs/pruebas/2026-10-28-pruebas-ronda-1.md`): 38 OK, 7 fallas, 7 no probados. Arreglos F1, F4, F6, F7, DS2, DS5, DS8 y M11 hechos el 28/10 | Commits del 28/10 | Reprueba corta antes de la ronda 2 (instructivo del 28/10, §3) y lo del correo cuando se guarde la contraseña SMTP (§59) |
| 58 | WhatsApp en viajes (Fede): reenviar la hoja de ruta, avisar al cancelar, eliminar, reactivar y cambiar el chofer | **Integrado el 28/10**, subido, pendiente de probar en la VM; faltan las plantillas en Meta | Merge de `fedemontenegro` en `rocionuvoli` (28/10) | `whatsapp/02` aplicado (28/10); recompilar y la ronda 6 de `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md`, aparte y al final (§58) |
| 60 | Adicionales del viaje de un cliente directo, como en Rukas: esperas, descarga y repaletizado (módulos de la tabla de tarifas) y vuelta vacía (un porcentaje del flete que elige administración) | **Hecho en la Mac (28/10)** con API simulada: versión reducida para mostrarla el 29/10 | Commits del 28/10 | `database/viajes/04_adicionales_del_viaje.sql` **aplicado por Rocío (28/10, "OK" en las dos)**; recompilar y la parte Q de la ronda 2 de `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md` (§60) |
| 61 | Pasar `rocionuvoli` a `main`, `facugodoy` y `fedemontenegro` | **`facugodoy` y `fedemontenegro` pasados (28/10)**, con la VM compilando sin errores y sin probar la ronda 2 (cambio de Rocío). `main`, cuando la reprueba corta y la ronda 2 den OK; las rondas 3 a 6 quedan anotadas para después | **Pusheado** a `rocionuvoli`, `facugodoy` y `fedemontenegro` (28/10) | La reprueba corta y la ronda 2 de `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md`; después, `main` (§61) |
| 62 | Ronda 3 de pruebas del 28/10 (facturación: tipos de comprobante, cuenta corriente y proformas) | **Interrumpida** (`docs/pruebas/2026-10-28-pruebas-ronda-3.md`): 35 OK, 5 fallas, 19 no probados; Facu renombró siglas (FC → FI) mientras se probaba. Causas y propuestas en §62, para que decida Rocío. **Hechos en la Mac (28/10): la proforma sin FC no propone otro tipo, el importe escrito del recibo no cambia al tildar (F3), Generar proforma pide confirmación (F1), los textos de Anular (F6), "emitir el comprobante" (M5) y los `for` de la proforma (DS7).** Quedan F2 (mirar los datos), F4 y F5 (con Facu) y DS1 a DS6 y DS8 (después del 29/10) | Commits del 28/10, sin push | Los arreglos (§62, cada "Cómo probarlo"); lo que falta de la ronda 3, cuando FC vuelva a FC (§62) |
| 63 | Tipo de comprobante predeterminado por uso (proforma, débito, crédito), para que renombrar una sigla no cambie qué se propone al emitir | **Propuesta (28/10)**, para ver con Facu después del 29/10: es su módulo y cambia la base | — | Ver §63 |

**Tanda de pruebas del 28/10:** todo lo subido que no tiene reporte (las integraciones de Facu y Fede, §44 a §58, y lo nuestro del 24 al 28/10: §29, §36, §37, §38, §40 punto 7, §41 y §43) se prueba con `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md`, en seis rondas. Queda afuera la tanda 2 de tarifas (§39), que espera la limpieza de la §38.

**Tanda de `facugodoy` del 27/10:** cambios pendientes incluidos en commits por tema; API compilada y 76 pruebas Node correctas. Los scripts SQL se versionaron sin ejecutarlos; las pruebas en VM y las aplicaciones de base indicadas en cada sección siguen pendientes.

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
| 3.2 | Puerto 5500 vs 5502 | **Hecho (28/10):** todos en el 5502 (`fiveserver.config.js`). Queda limpiar los referrers de la clave Maps | Baja |
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

## 15. Mejoras de la meet del 18/10 — LAS DE WHATSAPP EN VIAJES, INTEGRADAS (28/10, §58); EL RESTO, ANOTADO

Surgieron en la meet del equipo para ver cómo quedó el proyecto. Las de WhatsApp tocan el módulo de Fede: **avisarle antes de hacerlas**.

- [x] **Viajes: acción "Reenviar WhatsApp"** (Fede, 27/10; `gestion-viajes.html`, `ViajesController.cs`). Botón de fila al lado de los envíos; confirma, nombra al chofer y llama a `POST /api/Viajes/{id}/WhatsApp`. Solo con chofer y con el viaje Registrado o En viaje (Rocío, 28/10). Integrado el 28/10: ver §58.
- [x] **Viajes: WhatsApp al cancelar, eliminar y cambiar el chofer** (Fede, 27/10). El Cancelado es el nuestro del 27/10 (desde Cambiar estado, con motivo y reactivación): Fede había hecho otro en paralelo y al integrar quedó el nuestro con sus avisos. Plantilla `viaje_cancelado` al cancelar o eliminar; al reactivar, la hoja de ruta de nuevo; al cambiar el chofer, `viaje_desasignado` al anterior y `viaje_asignado` al nuevo. Script `database/whatsapp/02_plantillas_cancelado_y_desasignado.sql`. **Falta en Meta:** crear y aprobar las plantillas `viaje_cancelado` y `viaje_desasignado`, con **6 variables** cada una (nombre del chofer, N° de viaje, origen, destino, fecha y hora de inicio, como dice Configuración de WhatsApp), (el script ya está corrido, 28/10). Ver §58.
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
- `gestion-gruposypermisos.html`: Facu la cambió sobre la pantalla vieja mientras la rediseñábamos (`76f611f`). En ese merge quedó **nuestro diseño** (`SGTL.ajax`, toasts, sin `alert()` ni modal de éxito) con **lo de Facu adentro**: permisos agrupados por menú con una casilla que marca todo el grupo y un buscador de usuarios. En ese momento la pestaña Usuarios solo agregaba integrantes; se amplió el 26/10 (ver pendiente resuelto abajo). Sus tests `tests/usuarios-por-grupo.test.js` y `tests/permisos-agrupados.test.js` se adaptaron (no se pudieron correr: en la Mac no hay Node).

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
- [ ] Grupos y permisos → Usuarios: elegí un grupo, buscá en Disponibles y usá "Agregar todos"; comprobá que los ocultos por el filtro no se mueven. Repetí con "Quitar todos" en Asignados. Deshacé y repetí con acciones individuales; Guardar debe conservar los cambios al volver a elegir el grupo. Un usuario cuyo único grupo es el elegido debe mostrar Quitar deshabilitado con el motivo. Los administradores no aparecen en las listas.
- [ ] Un usuario (no admin) de un grupo con Gestión de viajes sigue viendo Presupuestos (después del script).
- [ ] Si hay Node en la VM: `node tests/<archivo>.test.js` para cada test de `tests/` (tienen que imprimir `OK`).

**Para la ronda con Facu (decisiones de Rocío del 20/10: queda su versión mientras ande; analizar a futuro si se cambia):**
- [x] **Usuarios por grupo permite agregar y quitar** (26/10): dos listas con búsquedas independientes, acciones individuales y por todos los visibles, Deshacer cambios y Guardar. `POST api/Grupos/{id}/Usuarios/Cambios` aplica las altas y bajas pendientes; el `POST /Usuarios` conserva su semántica aditiva y ambos requieren sesión y permiso. La API impide quitar el último grupo de un usuario común, también al eliminar un grupo. Probar con el paso "Grupos y permisos → Usuarios" de arriba y `node tests/usuarios-por-grupo.test.js`.
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
no aplican: ver, editar, PDF, siguiente paso (Marcar aceptada → Emitir comprobante) y anular / eliminar. Los 14 + 5
`alert()` / `confirm()` y los modales propios ("Operación realizada", "Confirmar eliminación", "Cambiar estado")
pasan a los avisos y la confirmación del sistema. Fechas del modal (período, carga, entrega) en DD/MM/AAAA con
calendario (siguen guardando AAAA-MM-DD). Modales "Emitir comprobante" y "Anular factura": calendario del sistema,
textos con mayúscula solo al principio y con tildes. PDF: errores con el aviso del sistema.
- [ ] Gestionar proformas: cada fila muestra 5 botones; en un borrador, Editar y Eliminar habilitados y el siguiente
  paso deshabilitado ("Primero generá la proforma"); en una Generada, Marcar aceptada → confirmación → toast.
- [ ] Una Aceptada → Emitir comprobante: modal "Emitir comprobante", fechas DD/MM/AAAA, vencimiento a 10 días. **Solo con
  datos de prueba: consume numeración real.**
- [ ] Anular una proforma Generada: confirmación con el texto de qué pasa → toast "Proforma anulada.".
- [ ] Eliminar un borrador: confirmación → toast "Borrador eliminado.".
- [ ] Registrar proforma: guardar sin cliente → aviso rojo dentro del modal; fechas con calendario.
- [ ] Proforma de Rukas (cliente con plataforma): el período se ve en DD/MM/AAAA después de importar el Excel.
- [ ] Filtro Fecha: elegir un rango busca; la cruz lo borra. Exportar (ícono) abre el modal de Excel / PDF.
- [ ] Listar proformas: ver, PDF y Emitir comprobante (solo en Aceptadas); el detalle se titula "Ver proforma …".

**Cuenta corriente (commit "Cuenta corriente: design system en la pantalla y sus modales", pantalla de Facu, con
el OK de Rocío del 22/10):** encabezado con Exportar solo ícono, "Emitir comprobante" gris (con "Emitir comprobante
directo", "Emitir comprobante desde proforma", "Emitir crédito" y "Emitir Débito") y "Registrar recibo" en verde. Filtros con su cruz y sin Limpiar; un solo
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
- [ ] Emitir comprobante → Emitir crédito: título y botón dicen "Emitir crédito"; sin cliente, la
  factura relacionada dice "Seleccioná un cliente primero".
- [ ] Sobre de una factura → Enviar por e-mail: el botón muestra "Generando PDF…" y "Enviando…"; al terminar se cierra
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
- [ ] Lápiz de un tipo no electrónico: carga sigla y letra para editar, aunque ya tenga comprobantes; el impacto solo se puede corregir si no hay comprobantes. Los datos fijos muestran el motivo. Cancelar limpia el formulario.
- [ ] Guardar con el mismo código y la misma letra: toast rojo con el mensaje de la API; con otra letra, se registra una segunda configuración.

**Eliminar configuraciones sin relaciones (26/10):** en Gestionar tipos de comprobante, las filas de sucursales,
numeradores y tipos muestran Eliminar solo cuando la API permite el borrado físico. Inactivar conserva el registro.
Una sucursal no se borra si está asignada a un tipo o figura por código en un comprobante; un numerador no se borra
si está asignado a un tipo; un tipo con comprobantes tampoco se borra. La configuración propia del tipo y su
fila en `COMPROBANTES_NUMERADORES` se eliminan junto con él cuando no tiene comprobantes. La API vuelve a
comprobar las relaciones al recibir Eliminar; si aparecieron mientras la pantalla estaba abierta, responde con un
motivo y la lista se actualiza.
El código de una sucursal que figura en comprobantes ya no se puede cambiar, para conservar esa relación histórica.
La base actual no guarda el ID del numerador en cada comprobante: una asignación pasada que ya se quitó no se puede
reconstruir desde esos documentos.
- [x] Prueba local de la pantalla: visibilidad de Eliminar, Inactivar con PUT y conflicto por relación nueva
  (`node tests/configuracion-facturacion-eliminar.test.js`).
- [x] Compilación de la API y 32 pruebas de Node sin errores. El interruptor usa una ruta de estado que no cambia
  los demás campos: inactivar un numerador no retrocede su último número si hubo una emisión después de cargar la lista.
- [ ] Probar en VM con registros de prueba: crear una sucursal y un numerador sin uso (ambos muestran Eliminar);
  crear un tipo que los use (desaparece Eliminar de ambos y aparece en el tipo); eliminar el tipo sin comprobantes
  (vuelve Eliminar en la sucursal y el numerador); eliminar ambos y comprobar que no reaparezcan al recargar.
- [ ] Verificar con un tipo que ya tenga comprobantes: no muestra Eliminar. Inactivar y reactivar siguen cambiando
  solo el estado. Una sucursal que figure en un comprobante no ofrece Eliminar ni permite cambiar su código.
- [ ] Riesgo anterior, separado de este cambio: al guardar el formulario completo de un numerador abierto antes
  de una emisión, se puede enviar un `UltimoNumero` viejo. Proteger el correlativo sin impedir su edición deliberada.

**Tipos de comprobante por letra (26/10):** un mismo código puede tener configuraciones A y B separadas. La
descripción y el impacto pertenecen al código; cada letra tiene su propia sucursal, numerador y estado. La emisión
usa la configuración y el próximo número de la letra elegida. `TIPOS_COMPROBANTE` conserva un código único y sus
relaciones históricas; la nueva migración `database/cuenta-corriente/12_tipos_por_letra.sql` cambia la clave de
`FACTURACION_TIPOS_COMPROBANTE` y la unicidad del número visible. **No se ejecuta automáticamente contra la base
compartida.** Las pantallas, el PDF, los correos y las respuestas de la API muestran el identificador completo,
por ejemplo `FAC-B-0002-00000012`, para distinguir correlativos iguales.
- [ ] Rocío: revisar y ejecutar `12_tipos_por_letra.sql` en la base compartida antes de probar la pantalla nueva.
- [ ] En VM: registrar FAC B con el código FAC existente, la misma descripción e impacto, y otro numerador;
  comprobar que FAC A y FAC B aparecen en filas distintas. Repetir FAC B debe mostrar el error de código y letra.
- [ ] Editar, inactivar y eliminar una variante sin comprobantes: solo debe cambiar esa letra. Una variante con
  comprobantes propios no ofrece Eliminar; la otra sí, salvo comprobantes históricos sin letra.
- [ ] Emitir comprobantes de prueba A y B: el formulario debe mostrar el próximo número del numerador elegido para
  cada letra y la API debe registrarlos sin mezclar configuraciones, aun si ambos correlativos coinciden. Al asignar
  un numerador, comprobar que su próximo correlativo no exista ya para ese código, letra y sucursal.

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
  "Enviar por e-mail" pasa al pie de "Ver PDF", así son cinco botones
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
   1.234,56 (`SGTL.montoCentavos` y compañía en `sgtl-ui.js`), arreglo del menú lateral. **Botones de la fila: cinco
   en todas** (Ver detalle · Editar · Ver PDF · Enviar por e-mail · Anular o Eliminar), deshabilitados con el motivo;
   la ubicación del envío se actualizó el 27/10 (§42). **El ojo abre la vista completa de Facu** en solo lectura,
   sin agregarle nada (el detalle chico queda solo para tipos que no sean factura, recibo o nota). Textos y títulos
   nuestros (§6.1);
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
- [ ] Cuenta corriente, botones de la fila: en una factura, Ver detalle, Ver PDF y Enviar por e-mail activos, Editar y
  Anular grises con el motivo; en un recibo emitido, los cinco activos; en uno anulado, Enviar por e-mail deshabilitado
  y Eliminar en lugar de Anular. Mismo lugar en todas las filas, también en las aplicaciones desplegadas.
- [ ] El ojo de una factura, una NC y un recibo → la vista completa en solo lectura ("Ver factura FAC-…"), fechas
  DD/MM/AAAA, solo Cerrar. Después, "Emitir comprobante directo" abre el formulario vacío y editable.
- [ ] Comparar las descripciones de FAC, NC, ND y REC en Gestionar tipos de comprobante con el campo "Tipo de
  comprobante" de Emitir comprobante directo, Emitir crédito, Emitir Débito y Registrar recibo. También deben coincidir
  al ver un comprobante o recibo existente y al editar un recibo con REC activo; no hace falta emitir para comprobarlo.
- [ ] Ver PDF → "Ver PDF del comprobante FAC-…" con Cerrar · Imprimir · Descargar PDF; el sobre de la fila abre el envío.
- [ ] Editar recibo desde la fila → abre el recibo. Anular → confirmación del sistema con motivo → "Recibo anulado.".
  Eliminar uno anulado → "Recibo eliminado.".
- [ ] Registrar recibo de un cliente de prueba con varias facturas: importe 500000 → al salir del campo "500.000,00";
  Distribuir → reparte desde la que vence primero; se puede corregir a mano.
- [ ] Emitir crédito → grilla de facturas con saldo e importe total; Distribuir y emitir sobre dos facturas → baja
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
- [ ] Emitir comprobante desde una proforma: ventana extra grande con el título "Emitir comprobante".
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
- [ ] 7. Cuenta corriente: cinco botones por fila (los que no aplican, grises con el motivo); el ojo de una factura
  abre la vista completa; Ver PDF de una factura abre la vista previa sin "Enviar por e-mail" en el pie; el sobre está
  en Acciones (no enviar);
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
- [ ] 3. Cuenta corriente: Registrar recibo (Datos generales, Forma de pago, Imputación a comprobantes con su botón), el
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

## 33. Editar una tabla de tarifas que ya usan viajes — PUSHEADO (25/10); FALTA CORRER EL SCRIPT 05, COMPILAR Y PROBAR EN VM

Lo planteó Facu (23/10): "no debería dejarte editar tarifas que estén en curso, porque ya hay viajes que las usan;
debería pedirte que cierres esa vigencia y generes una nueva con el nuevo valor, y ahí recalcular todo". Con el §34 el
viaje guarda su importe y editar una tabla dejó de cambiar los viajes calculados, pero corregir un valor mal cargado
dejaba esos viajes con el error. Rocío (25/10): es algo que el profesor puede preguntar; editar una tarifa tiene que
impactar en los viajes, con un orden claro de qué se toca, qué no y a quién se avisa.

**Decisión de Rocío (25/10). Principio: se recalcula solo lo que el cliente todavía no vio; lo que ya vio se corrige con
un documento. Antes de guardar, la pantalla muestra qué cambia y qué no.**

- **Dos motivos, dos botones:** un aumento es "Registrar tabla de tarifas" desde la fecha en que empieza (queda la
  historia); corregir un error es "Editar" la misma tabla. Los dos impactan igual.
- **Qué pasa con cada cosa** (viajes y presupuestos de esa tabla, o que pasan a esa tabla o salen de ella):

  | Qué | Qué pasa | Por qué |
  |---|---|---|
  | Viajes sin proforma (Registrado, En viaje, Entregado, Listo para facturar) | Se recalculan | El cliente todavía no vio el importe |
  | Viajes en un borrador de proforma | Se recalculan y su línea del borrador propio se actualiza (si el precio de la línea es el del viaje); en un borrador de Rukas, "Volver a controlar" ya toma el importe nuevo | El borrador no se mandó |
  | Viajes en una proforma generada o aceptada | No cambian: quedan para revisar. Al anular la proforma, sus viajes se recalculan | El cliente ya la recibió: se anula y se genera de nuevo |
  | Viajes facturados | No cambian: quedan para revisar | La diferencia va con una nota de crédito o de débito (módulo de Facu) |
  | Viajes de un presupuesto aceptado | No cambian | El precio lo aceptó el cliente |
  | Presupuestos pendientes | Se recalculan y quedan para reenviar | Si ya se le mandó, hay que reenviárselo |
  | Presupuestos aceptados o rechazados | No cambian | Ya tienen respuesta del cliente |

- **Qué cambio dispara qué:** valores, bandas, año de corte, falso flete o estadía → los viajes de esa tabla; vigencia o
  clientes → también los que pasan a otra tabla o vienen de otra; solo el nombre → nada; registrar una tabla nueva → los
  viajes ya cargados que empiezan desde su fecha (por ejemplo, los programados).
- **Al guardar:** si algo cambia, una confirmación con una línea ("Al guardar, pasa esto con los viajes y presupuestos de
  esta tabla."), la lista agrupada con las cantidades en los títulos y, en cada fila, solo qué hacer ("Anulá
  PF-00000006 y generala de nuevo.", "Nota de débito sobre FAC-00000015.", "—"; Rocío, 25/10: el resumen repetía la
  tabla), y el **motivo, obligatorio**, que queda en la auditoría (de la tabla y de cada viaje recalculado). Después, el
  aviso con lo que se recalculó y lo que queda para revisar.
- **Cómo se avisa lo que queda para revisar:**
  - **En la fila**, al lado del estado, el ícono rojo de "falta resolver algo" (§4.3 del design system) con un texto
    corto: "Cambió la tarifa: revisalo en Ver PDF." (presupuesto), "Cambió la tarifa de 2 viajes: revisá el detalle de
    la proforma.", "Cambió la tarifa: revisá el detalle del viaje.". Si la fila ya tiene un ícono, queda uno solo, el
    rojo, con los dos textos.
  - **Adentro, en todos los lugares donde se abre el documento** (detalle y edición), un aviso amarillo arriba, **corto**
    (Rocío, 25/10: el largo se perdía): el importe de antes y el de ahora, y qué hacer ("Cambió la tarifa: $ 905.000,00 →
    $ 1.493.616,40" / "Para corregirla, anulala y generala de nuevo."). De dónde salió (tabla, fecha y motivo) va en el
    tablero y en la auditoría. Presupuesto → en Ver PDF (su pie ya tiene "Enviar por e-mail") y en Editar; proforma → en
    Ver detalle, con cada viaje; viaje → en Ver detalle.
  - **Viaje facturado:** el aviso principal va en el comprobante (Facturación / cuenta corriente: ícono y detalle con
    "Corresponde una nota de crédito por $ X"), y en el viaje una referencia al comprobante. El comprobante es módulo de
    Facu: se hace después de su cambio de "comprobante" (§38) o lo hace él.
  - **Tablero "Cambios de tarifa para revisar"** (Tableros → Facturación, se puede marcar como favorito): cada documento
    con su cliente, la diferencia, qué hacer y el cambio que lo causó; "Marcar como resuelto" para lo resuelto por fuera.
  - **Se resuelve solo:** el presupuesto, al enviarlo por e-mail; la proforma, al anularla. El viaje facturado, a mano
    (la nota la emite el módulo de Facu).
  - Al cliente no se le manda nada solo: el aviso es el documento (presupuesto reenviado, proforma nueva, nota de crédito
    o de débito). Lo que se recalcula solo es lo que el cliente todavía no vio.

**Orden de trabajo (antes del jueves, en este orden para que quede andando lo más importante):**
1. Confirmación con el impacto, recálculo y motivo (Gestionar tarifas y API).
2. Registro de lo que queda para revisar, íconos en las filas y avisos adentro (presupuestos, proformas, viajes) y el
   recálculo al anular una proforma.
3. El tablero.

**Para contarle a Facu:** responde a su planteo; toca Presupuestos (el ícono, el aviso y que el envío por e-mail resuelva
lo pendiente) y la parte del comprobante es de su módulo.

**Paso 1 — HECHO EN LA MAC (25/10), SIN PUSH; FALTA CORRER EL SCRIPT, COMPILAR Y PROBAR EN VM:**
- `database/tarifas/05_cambios_de_tarifa.sql` (idempotente): `TARIFARIO_CAMBIOS` (cada guardado que cambió algo: tabla,
  tipo, motivo, fecha, usuario y cuántos viajes y presupuestos se recalcularon) y `TARIFARIO_REVISAR` (lo que quedó para
  revisar, con el importe anterior y el nuevo, y cuándo, quién y cómo se resolvió). **Correrlo antes de compilar.**
- `Tarifas/TarifarioImpacto.cs` (nuevo, en el `.csproj`): calcula con las tablas como quedan al guardar qué pasa con cada
  viaje y presupuesto (la tabla de arriba) y lo aplica en la misma transacción: actualiza los viajes, la línea del borrador
  propio (si tiene el precio del viaje) y sus totales, y los presupuestos pendientes; registra el cambio y lo que queda
  para revisar. Si un viaje ya estaba para revisar con el mismo importe corregido, no se repite. Un cambio que no mueve
  importes (solo el nombre) actualiza el detalle sin preguntar.
- `TarifarioCalculo`: la cuenta de la base y de los adicionales quedó en `BaseConTabla` y `SumarAdicionales`, sin leer la
  base; la usan el viaje, el presupuesto y el recálculo (los mismos importes: probado con los casos de la §34).
- `TarifarioController`: `POST api/Tarifario/Impacto?id=N` (qué pasaría, sin guardar) y el guardado pide `Motivo` si algún
  importe cambia; la auditoría registra la tabla con el motivo y cada viaje y presupuesto recalculado ("Importe
  recalculado por la corrección de la tabla …: $ a → $ b").
- `gestion-tarifas.html`: al guardar pide el impacto; si algo cambia, la confirmación (§5.2) con una línea, la lista
  agrupada (Se recalculan / No cambian: quedan para revisar / No se pueden recalcular / No cambian) y el motivo; si no,
  guarda directo. El aviso dice qué se recalculó y cuántos quedan para revisar. El texto de arriba del formulario ahora
  dice que antes de guardar se ve qué se recalcula, y que un aumento va como tabla nueva. `SGTL.confirmar` acepta
  `detalle` y `ancho`.
- Compilado en la Mac con un proyecto de prueba (C# 7.3, como la VM) y probado sin base con casos armados: viaje sin
  proforma, en borrador propio y de Rukas, en proforma generada, en comprobante, de presupuesto aceptado, camión sin tipo,
  presupuesto pendiente, solo el nombre y tabla nueva desde octubre. En el navegador, con la API simulada.

**Probar en la VM (paso 1):**
- [ ] 0. Correr `database/tarifas/05_cambios_de_tarifa.sql` (al final, "OK" y "OK"). `pull`, recompilar, Ctrl+F5.
- [ ] 1. Gestionar tarifas → Editar la tabla de agosto: arriba dice cuántos viajes la usan y que antes de guardar se ve qué
  se recalcula. Cambiar solo el nombre y Guardar: guarda directo, sin confirmación. Volver a ponerle el nombre.
- [ ] 2. Cambiar un valor que usen viajes (por ejemplo, el de su tipo y modelo hasta 130 km, 1ª vuelta) y Guardar: aparece
  "¿Guardar los cambios de …?" con una línea y la lista (las cantidades en los títulos de los grupos; en "Qué hacer", algo
  corto o "—"). Revisar que cada viaje esté en su grupo según su documento
  (sin proforma o en borrador: se recalcula; en una proforma generada o aceptada, o en un comprobante: para revisar; de un
  presupuesto aceptado: no cambia). Guardar sin motivo: "Completá el motivo.". Con motivo: el aviso dice cuántos se
  recalcularon y cuántos quedan para revisar.
- [ ] 3. Abrir un viaje recalculado: el importe nuevo con su detalle. Uno para revisar: el importe de antes. En un borrador
  de proforma propia, la línea del viaje y el total con el importe nuevo.
- [ ] 4. Auditoría: el cambio de la tabla con el motivo y un registro por cada viaje recalculado.
- [ ] 5. Volver a poner el valor original (mismo motivo): los viajes vuelven a su importe. Lo que había quedado para
  revisar (proformas, comprobantes y presupuestos) desaparece de la tarjeta y de los avisos, porque el documento ya tiene
  el importe de la tabla; en la base queda resuelto con "La tarifa volvió al importe…". Si en vez de volver se corrige a
  otro importe, queda uno solo para revisar con el importe de antes del primer cambio, sin repetirse.
- [ ] 6. Cambiar para quién es (§34, 25/10), **sin guardar**: Editar "Tarifas a agosto 2026" → "Solo algunos clientes" →
  elegir uno. La ayuda dice 'Los demás clientes vuelven a "Tarifas a enero 2026".'. Guardar: en la confirmación, los viajes
  y presupuestos de los demás clientes desde el 01/08 dicen 'Pasa a "Tarifas a enero 2026".' con el importe de enero (los
  de proformas enviadas o comprobantes, en "quedan para revisar"). **Cancelar** (si se guarda, se recalculan de verdad).
- [ ] 7. Editar "Tarifas a enero 2026" y poner "Vigente desde" 31/07/2026 → Guardar: no se abre la confirmación y arriba
  dice "No se puede guardar la tabla de tarifas: N viajes quedarían sin tabla." con la lista por cliente (cuántos y de qué
  fechas; hasta 5 clientes y "y N clientes más"). Cerrar sin guardar. (Si no hay ningún viaje ni presupuesto de enero a julio, guarda directo: volver a poner 01/01/2026.) (Lo de "la única para todos" no se ve con la base actual, que tiene dos generales: se probó con la
  API simulada.)

**Paso 2 — HECHO EN LA MAC (25/10), SIN PUSH; FALTA COMPILAR Y PROBAR EN VM:**
- `Tarifas/TarifarioRevisar.cs` (nuevo, en el `.csproj`): lo pendiente con el cambio que lo causó y qué hacer ("Reenviáselo
  al cliente…", "Anulá la proforma … y generala de nuevo…", "Corresponde una nota de crédito por $ X sobre el comprobante
  …"); marcarlo como resuelto; y al anular una proforma, recalcular sus viajes pendientes con la tabla vigente (con su
  registro en la auditoría) y darlos por resueltos. Si el script 05 no se corrió, no hace nada.
- API: `GET api/Tarifario/Revisar` (todo, o `?presupuestoId=`, `?proformaId=`, `?viajeId=`),
  `POST api/Tarifario/Revisar/{id}/Resolver` y `POST api/Tarifario/Revisar/Presupuesto/{id}/Enviado`.
- `ProformasController.Anular` (una línea): llama al recálculo y el mensaje suma "Se recalculó 1 viaje con la tarifa
  corregida." **Toca proformas: contarle a Facu.**
- `assets/static/js/cambios-tarifa.js` (nuevo, `SGTLCambiosTarifa`, con `fetch` porque Presupuestos no carga jQuery).
- **Presupuestos** (módulo de Facu): ícono rojo "Cambió la tarifa: revisalo en Ver PDF." al lado del estado; el aviso en
  Ver PDF (arriba del documento, no adentro) y en Editar; al enviarlo por e-mail, queda resuelto.
- **Proformas**: ícono rojo "Cambió la tarifa de N viajes: revisá el detalle de la proforma." y el aviso en el detalle,
  con cada viaje (en la proforma → con la tabla corregida).
- **Viajes**: el ícono de la fila pasa a rojo y suma "Cambió la tarifa: revisá el detalle del viaje."; Ver detalle (todas
  las pantallas que lo usan) muestra el aviso arriba, con el comprobante y la nota que corresponde. Listar viajes muestra
  el aviso en Ver detalle, pero no el ícono en la fila.
- Probado en el navegador con la API simulada: guardar un cambio deja un presupuesto, un viaje en proforma y uno en un
  comprobante para revisar; cada pantalla muestra su ícono y su aviso.

**Probar en la VM (paso 2), después del paso 1:**
- [ ] 1. Con un cambio guardado que dejó cosas para revisar: Gestionar presupuestos → el presupuesto pendiente recalculado
  tiene el ícono rojo; el globito dice "Cambió la tarifa: revisalo en Ver PDF.". Ver PDF y Editar: el aviso amarillo con
  "Cambió la tarifa: $ antes → $ nuevo" y qué hacer (el aviso corto del 25/10; la tabla, la fecha y el motivo están en la
  tarjeta y en Auditoría).
- [ ] 2. Enviarlo por e-mail desde Ver PDF: después del envío, el ícono ya no está.
- [ ] 3. Gestionar proformas → la proforma generada o aceptada con un viaje para revisar tiene el ícono rojo; Ver detalle:
  el aviso con el viaje y los dos importes. Anular la proforma: el aviso del éxito dice que se recalculó el viaje; Ver
  detalle del viaje: el importe nuevo. Generar otra proforma con ese viaje: trae el importe nuevo.
- [ ] 4. Gestionar viajes → un viaje en un comprobante para revisar: ícono rojo; Ver detalle: el aviso con el comprobante
  y "Corresponde una nota de crédito (o de débito) por $ X". (Se marca como resuelto desde el tablero, paso 3.)

**Paso 3 — HECHO EN LA MAC (25/10), SIN PUSH; FALTA PROBAR EN VM:**
- **Tarjeta fija "Cambios de tarifa para revisar"** (decisión de Rocío, 25/10): arriba del dashboard, sin estrella y sin
  poder sacarla; y en Tableros → Facturación, primera (arriba de "Costo por viaje"), con la estrella marcada y deshabilitada ("No se puede quitar del
  dashboard: está fijo para quien resuelve cambios de tarifa"). No está en el catálogo de favoritos. La ve siempre quien
  puede resolver algo (la pestaña la cuenta solo entonces); si no hay nada, dice "No hay nada para revisar por cambios de
  tarifa.". La arma `cambios-tarifa.js` (`tarjetaFija`); la llaman `index.html` y `tableros.html`.
- **Cada uno ve lo suyo** (también en los íconos y avisos de las pantallas): la API toma el usuario del token y devuelve los
  presupuestos a quien tiene el permiso "Presupuestos", y las proformas y los comprobantes a quien tiene "Gestión de
  proformas", "Gestión de facturas" o "Cuenta Corriente"; los administradores, todo. `GET api/Tarifario/Revisar/Alcance`
  dice qué ve. Resolver controla el mismo permiso. Quien solo tiene "Gestión de tarifas" no ve la tarjeta (no puede
  resolver nada): el impacto de lo que cambió lo ve en la confirmación al guardar la tabla (Rocío, 25/10).
- **Cada fila lleva a donde se corrige:** presupuesto → `presupuestos.html?presupuesto=N` abre su Ver PDF (con "Enviar por
  e-mail"; al enviarlo, queda resuelto); proforma → `gestion-facturacion.html?proforma=N` abre su detalle, y el aviso trae
  **"Anular proforma"** (al anularla, sus viajes se recalculan y queda resuelto); viaje en un comprobante → Ver detalle
  del viaje y **"Marcar como resuelto"** (con cómo se resolvió), porque la nota de crédito o de débito se emite en cuenta
  corriente y todavía no avisa sola (§38).
- Probado en el navegador con la API simulada: la tarjeta, los tres enlaces, "Anular proforma" y Marcar como resuelto.

**Probar en la VM (paso 3):**
- [ ] 1. Entrar como administrador: arriba del dashboard, "Cambios de tarifa para revisar" con lo que quedó del paso 1, sin
  estrella. En Personalizar no se puede mover ni sacar. En Tableros → Facturación es la primera (arriba de "Costo por
  viaje"), la pestaña la cuenta y la
  estrella está marcada y deshabilitada: al pasar el mouse, "No se puede quitar del dashboard: …".
- [ ] 2. Con un usuario que solo tiene "Presupuestos": la tarjeta muestra solo los presupuestos; en Gestionar viajes, los
  viajes para revisar no tienen el ícono rojo. Con uno que solo tiene "Gestión de proformas" o "Cuenta Corriente": solo
  las proformas y los comprobantes. Con uno sin esos permisos: no hay tarjeta.
- [ ] 3. Presupuesto: Ver PDF para reenviarlo → abre Gestionar presupuestos con su Ver PDF; enviarlo → sale de la tarjeta.
- [ ] 4. Proforma: Ver la proforma → abre su detalle con el aviso y "Anular proforma" → la confirmación de anular. Anularla:
  sale de la tarjeta y el viaje queda con el importe nuevo.
- [ ] 5. Viaje en un comprobante: Ver detalle (con el aviso) y Marcar como resuelto sin escribir cómo: "Completá el
  motivo."; con el texto: sale de la tarjeta.

## 34. Tabla de tarifas por tipo de camión (agosto 2026) — PUSHEADO (24 y 25/10); FALTA CORRER LOS SCRIPTS, COMPILAR Y PROBAR EN VM

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
  **Corregido por Rocío el 26/10:** la 2ª vuelta depende del cliente, el origen y el destino, no del camión (§43).
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
- **Cambiar para quién es una tabla ya cargada (Rocío, 25/10):** se puede (de todos a algunos clientes, sacar o agregar
  clientes, o de algunos a todos). Cada viaje y presupuesto toma la tabla que le queda con la regla de arriba: si agosto
  pasa a ser solo de un cliente, los demás vuelven a "Tarifas a enero 2026" (la general anterior), y la confirmación lo dice
  en cada fila ('Pasa a "Tarifas a enero 2026".'), con el importe nuevo. Dos límites, como al eliminar: la única tabla para
  todos los clientes no puede pasar a algunos (en el formulario se ve "Todos los clientes" como texto y la ayuda dice qué hacer: "Para que algunos clientes tengan
  otros valores, registrá una tabla solo para ellos."), y no
  se guarda un cambio (de clientes o de fecha) que deje un viaje o un presupuesto sin tabla: "No se puede guardar la tabla
  de tarifas: 4 viajes quedarían sin tabla." y debajo, por cliente, cuántos y de qué fechas ("Distribuidora del Litoral
  S.A.: 3 viajes, del 20/10/2026 al 23/10/2026"; hasta 5 clientes, §5.1 del design system). Al elegir "Solo algunos
  clientes" en una tabla que era para todos, la ayuda dice a qué tabla vuelven los demás.

**Qué se hizo:**
- `database/tarifas/02_tarifario_por_vehiculo.sql` (idempotente): tablas `TARIFARIOS` (una fila por tabla: nombre,
  vigente desde, para todos o no, año de corte, bandas, estadía y falso flete), `TARIFARIO_VALORES` (8 filas por tabla:
  antigüedad × tipo, con las tres bandas fijas, la 2ª vuelta y el precio por km) y `TARIFARIO_CLIENTES` (los clientes de
  una tabla propia), y en `VIAJES` las columnas `TarifarioID`, `Tarifa_Modo`
  (`Fija` o `Km`), `Vuelta`, `Estadia_Modulos`, `Falso_Flete`, `Importe_Base`, `Tarifa_Detalle`, `Importe` e
  `Importe_Detalle` (con default o vacías: el código viejo sigue andando).
- `database/tarifas/03_cargar_tablas_de_tarifas_2026.sql`: primero muestra; con `@Aplicar = 1` (transacción abierta para
  COMMIT o ROLLBACK) carga las dos tablas generales de 2026 y pasa al nombre de la tabla el tipo de los camiones que se
  puede deducir del texto ("furgón", "balancín", "chasis", "liviano"; los demás se eligen en Gestionar camiones), sin
  cambiar quién modificó el camión. **"Tarifas a enero 2026"** (desde el 01/01/2026, para los viajes de enero a julio):
  los valores de agosto con un 15 % menos, redondeados a pesos (estadía $ 82.090), y lo demás igual (decisión de Rocío,
  25/10). **"Tarifas a agosto 2026"** (desde el 01/08/2026): la del PDF. También muestra si hay viajes de antes del
  01/01/2026 (no tendrían tabla).
- API: `Tarifas/TarifarioCalculo.cs` (nuevo, un solo cálculo para viajes, presupuestos y la tabla) y
  `TarifarioController.cs` (nuevo: listar, ver, registrar, editar, eliminar si ningún viaje la usa, la vigente y
  `Calcular` con `tarifa=fija|km`), los dos en el `.csproj`. `ViajesController`: calcula el importe al guardar (no toma
  el de la pantalla) y lo guarda con su modo; la base se recalcula solo si cambia fija/por km, el camión, los km, el
  inicio o la vuelta; falso flete y estadía se cargan en cualquier estado antes de facturar.
  `ProformasController.ImporteViaje` ("Traer viajes" y el control de Rukas) y el costo del dashboard leen primero el
  importe guardado. `CamionesController` rechaza un tipo que no es de la tabla. `PresupuestosController` (Facu): el viaje
  que genera un presupuesto queda con la tabla, su modo, la vuelta y el importe del presupuesto.
- `gestion-tarifas.html`: la lista de tablas (para qué clientes —"Todos los clientes, salvo …, que tienen tabla
  propia" o los de la propia—, vigencia y estado: Vigente, Anterior o Próxima) y el formulario, con los bloques Datos,
  Clientes (todos o solo algunos, con buscador), Bandas de km, Tarifas fijas, Tarifas por km y Adicionales. **Grilla
  como el PDF (25/10, decisión de Rocío con la maqueta):** las tarifas fijas, una tabla por modelo con la distancia en
  las filas y el tipo de camión en las columnas (1ª y 2ª vuelta solo en "Hasta 130 km"); la tarifa por km, aparte, con
  los modelos en las filas y la ayuda "El precio por km se usa en dos casos" (todo el viaje con tarifa por km; los km que
  pasan de la última banda con tarifa fija). Clase compartida `.sgtl-grilla` en `sgtl.css` (design system §6.3). La API
  no deja dos generales que empiecen el mismo día, ni dos propias de un mismo cliente. **Vigente hasta** (Rocío, 25/10):
  no se carga ni se guarda; es el día antes de la tabla siguiente del mismo alcance, así nunca queda un día sin tabla ni
  se desacomoda si la siguiente cambia de fecha. El formulario lo muestra como texto al lado de "Vigente desde" ("30/09/2026
  · Después: Tarifas a octubre 2026" o "Sin fecha de fin · Hasta que se cargue la próxima"). **Eliminar** (Rocío, 25/10):
  solo si no la usa ningún viaje ni un presupuesto pendiente o aceptado sin viaje (sin la tabla no se podría generar el
  viaje), y si no es la única para todos los clientes; si no, el botón queda deshabilitado con el motivo. Al eliminarla,
  la anterior ocupa su lugar ("No se puede deshacer. "Tarifas a octubre 2026" queda como la tabla vigente hasta que se
  cargue la próxima." o, si había una siguiente, "… se extiende hasta el 30/11/2026."): nunca queda un día sin tabla. "Registrar tabla de tarifas" viene
  con los valores de la más nueva, para cambiar solo los que subieron.
- `gestion-viajes.html`: Tarifa con **Fija** (elegida de entrada) y **Por km**, las dos de la tabla. Vuelta (con fija y
  hasta 130 km, con la propuesta y por qué), falso flete y módulos de estadía (la estadía no aparece en clientes con
  plataforma: los adicionales vienen de Rukas). La línea del importe muestra la cuenta. En un viaje que ya salió, la
  tarifa queda fija y se pueden cargar falso flete y estadía. `viaje-detalle.js`: el importe guardado.
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
  vuelta); falso flete y estadía; presupuestos con fija (2ª vuelta propuesta) y por km; camión sin tipo de la tabla →
  aviso con el enlace.

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
  sale solo de lo que el viaje guardó con la tabla. `database/tarifas/04_viajes_con_la_tabla_de_tarifas.sql` (rehecho el
  25/10, §38) deja los datos igual, **sin ningún texto sobre las tarifas de antes**:
  - **Todos** los viajes y presupuestos se calculan con la tabla vigente en su inicio (enero o agosto 2026), con la misma
    cuenta que la API, también los facturados.
  - Presupuestos: con su tarifa (fija o por km), su camión, sus km y su vuelta (si no tiene, 2ª si el camión ya tiene un
    viaje antes ese día).
  - Viajes generados desde un presupuesto aceptado: el importe recalculado del presupuesto ("Presupuesto #N", como
    cualquier viaje de un presupuesto).
  - El resto: con la tarifa fija por banda, aunque antes tuvieran una por km (Rocío, 25/10, al ver el diagnóstico: la fija
    es la principal del PDF y las de km de antes eran de prueba), con la vuelta según el camión ese día; los que ya tienen
    la tabla conservan fija o por km. Falso flete y
    estadía, si los tienen, se suman.
  - Todos quedan con la tabla y sin `TarifaFijaID` ni `TarifaKmID`, sin cambiar la fecha ni el usuario de la última
    modificación (se ven en Ver detalle). Se borran las filas de `TARIFAS_FIJAS` y `TARIFAS_KM`; las tablas quedan vacías
    porque el EDMX las incluye y no se regenera.
  - Hasta la limpieza de la §38, las proformas y comprobantes de prueba guardan los importes de antes y no coinciden con
    sus viajes.
- **Demo de Rukas:** los viajes 25 y 26 (990001 y 990002) se recalculan con la tabla y dejan de dar $ 14.790: con la
  tarifa fija, $ 429.101 (1ª vuelta) y $ 278.028 (2ª vuelta). **Hecho (25/10):** `04` aplicado por Rocío y los Excel de
  `docs/pruebas/datos/` y el instructivo de viajes y proformas actualizados con esos importes (en el caso 2, Rukas paga
  $ 250.000 el 990002).
- Los "valores más reales" de la §31 ya no hacen falta.
- **Modelos (Rocío, 25/10):** la empresa separa siempre "2018 o anterior" y "2019 en adelante" por su flota, así que el año
  no se edita: Gestionar tarifas lo muestra como texto en "Bandas de km y modelos" y cada tabla lo guarda (`Anio_Corte`,
  Registrar lo copia de la anterior). **Mejora futura, si aparece un tercer grupo** (por ejemplo, otro precio para camiones
  2026 en adelante): cambiar la marca de sí o no de `TARIFARIO_VALORES` (`Modelo_Nuevo`) por "desde qué año de modelo"
  vale cada fila y elegir el grupo del año más alto que no supere el modelo del camión; toca `TarifarioCalculo`,
  `TarifarioImpacto`, los scripts `02`, `03` y `04`, la grilla (una por grupo, con agregar y quitar) y el texto del detalle.
  Los viajes ya calculados no cambian (guardan su importe) y el grupo nuevo entraría en una tabla nueva.

**Probar en la VM** (con C#):
- [ ] 0. Rocío corre `database/tarifas/02_tarifario_por_vehiculo.sql` (al final, todo "OK") y
  `05_cambios_de_tarifa.sql` (§33; "OK" y "OK"). Después
  `03_cargar_tablas_de_tarifas_2026.sql` tal cual: revisar la lista de camiones (los "Elegir en Gestionar camiones") y que
  "Viajes antes del 01/01/2026" dé 0 (si no, avisar a Claude); con `@Aplicar = 1`, si las cantidades coinciden (2 tablas,
  16 filas de valores), `COMMIT`.
- [ ] 1. `pull`, recompilar la API y Ctrl+F5. Gestionar viajes lista los viajes (hasta correr `04`, los de antes no se
  pueden editar y no muestran importe).
- [ ] 2. Gestionar tarifas (en "Bandas de km y modelos", "Modelos: 2018 o anterior · 2019 en adelante" como texto): solo
  la lista de tablas, con "Tarifas a agosto 2026" (desde el 01/08/2026, Vigente) y
  "Tarifas a enero 2026" (desde el 01/01/2026, Anterior). Editar la de enero: "Vigente hasta" dice 31/07/2026 y "Después:
  Tarifas a agosto 2026" (no se carga: es el día antes de la siguiente); en la de agosto, "Sin fecha de fin". En Registrar,
  al elegir "Vigente desde" se actualiza solo. Bandas: tercera igual a la segunda → "Tiene que ser mayor que 190 km."; si
  se cambia una banda, la siguiente se revisa enseguida. Poner "hasta 190 km" más barata que "hasta 130 km" (o la 2ª
  vuelta más cara que la 1ª): arriba de las grillas, "Revisá estos valores" con el tipo y el modelo; se puede guardar
  igual. Editar la de agosto: las tarifas fijas se ven como el PDF
  (distancia en las filas, tipos en las columnas, 1ª y 2ª vuelta solo hasta 130 km) y con sus mismos valores; abajo, la
  tarifa por km aparte, con la ayuda de los dos casos. Ningún importe cortado y sin barra hacia el costado en una
  pantalla de 1366 px. Borrar un valor y Guardar: "Revisá los campos marcados." y "Completá el valor." debajo de ese
  campo. Cancelar.
- [ ] 3. Registrar tabla de tarifas: viene con los valores de agosto y el nombre y la fecha vacíos, "Todos los clientes"
  elegido. Fecha 01/08/2026 → "Ya hay una tabla para todos los clientes vigente desde el 01/08/2026…". Elegir "Solo algunos
  clientes" sin tildar ninguno → "Elegí al menos un cliente.". Tildar un cliente de prueba, cambiar un valor y Guardar: en
  la lista, la propia con ese cliente (si son varios, "N clientes" y el ícono que dice cuáles) y la general con "Todos los
  clientes", sin más (25/10). Un viaje de ese cliente sale con
  la propia (el detalle del importe la nombra) y uno de otro cliente, con la general. Después, eliminar la propia: la confirmación dice "Sus clientes vuelven a la tabla para todos los clientes.".
  Eliminar la de agosto: deshabilitado ("la usan N viajes"). Registrar una general desde el 01/12/2026 y eliminarla:
  "Tarifas a agosto 2026" queda como la tabla vigente hasta que se cargue la próxima.
- [ ] 4. Gestionar camiones: a los camiones que el script no pudo deducir, elegirles el tipo.
- [ ] 4b. Rocío corre `database/tarifas/04_viajes_con_la_tabla_de_tarifas.sql` (el rehecho del 25/10) tal cual: revisar
  el resumen (cuántos viajes y presupuestos, el total de hoy y el nuevo), cada viaje y cada presupuesto con su importe de
  hoy y el nuevo, que la columna "Falta" esté vacía y los importes nuevos de la demo de Rukas (pasárselos a Claude). Con
  `@Aplicar = 1`, si las cantidades coinciden, `COMMIT` (al final, "Viajes sin la tabla" tiene que dar 0). Después, en
  Gestionar viajes, volver a poner 990002 como N° de transporte SAP del viaje 26 (quedó en 990020 de la prueba del caso 3
  de Rukas).
- [ ] 5. Registrar viaje de un cliente directo con un camión de tipo y año conocidos: Fija viene elegida; comparar con el
  PDF a 100 km (1ª vuelta; 2ª si el camión ya tiene un viaje antes ese día), 200 km y más de 250 km (la de 250 más el
  excedente). Por km: todo el viaje. Falso flete → 60 %; 1 módulo de estadía → + $ 96.577. Guardar y volver a abrir:
  el mismo importe.
- [ ] 6. Abrir un viaje de julio (los de "Tarifas a enero 2026" son del 21 al 27/07): el importe de esa tabla, con su
  detalle; uno de agosto en adelante, el de
  "Tarifas a agosto 2026". Ninguno dice nada de tarifas de antes. Guardar sin cambios no cambia el importe. Ver detalle
  igual, con la misma última modificación que tenía.
- [ ] 7. Presupuestos: los de antes muestran el importe de la tabla de su fecha y su viaje generado, el mismo. Registrar
  presupuesto con fija y con por km: el mismo importe que el viaje. Aceptarlo y generar el viaje: el viaje tiene el
  importe del presupuesto.
- [ ] 8. Proformas: "Traer viajes" trae el importe guardado de cada viaje; con los Excel regenerados, el caso 1 de Rukas
  (`docs/pruebas/datos/`) da "Coincide".
- [ ] 9. Dashboard: "Importe promedio por viaje" (antes "Costo por viaje") suma los importes guardados (cambia por los viajes recalculados).
- [ ] 10. Un viaje en viaje: cargarle 1 módulo de estadía y guardar: se suma, la tarifa no cambia.

---

## 35. Tableros: todos los tableros por tema, gráficos de tres datos y favoritos en el dashboard — PUSHEADO (24/10), OK EN VM (25 Y 26/10)

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
- [x] 0. Rocío corre `database/tableros/01_crear_tableros_favoritos.sql` (dice qué creó y la verificación da 0 · 0 · 1).
- [x] 1. `pull`, **recompilar la API** (hay un controller nuevo) y Ctrl+F5. `node tests/tableros.test.js` → OK.
- [x] 2. Dashboard: igual que antes (los mismos tableros y en el mismo lugar) y sin errores nuevos en la consola.
- [x] 3. Menú → Tableros (como admin): cuatro pestañas; el período cambia los números y los gráficos de todas.
  Km por camión y por mes: los totales por camión coinciden con "Km por camión" del mismo período.
- [x] 4. Facturación → Facturación por cliente y por mes: el total de un cliente en un mes coincide con sus facturas y
  notas de débito menos notas de crédito de ese mes en Gestionar cuenta corriente. Deuda vencida: lo vencido de un
  cliente coincide con su "Deuda vencida" en cuenta corriente. Antigüedad de la deuda: la suma de los cuatro tramos
  vencidos de un cliente es su "Vencido" de Deuda vencida, y "Al día", su "Por vencer".
- [x] 4b. Flota → Ingresos por camión y por mes: el total de un camión en un mes coincide con la suma de los importes de
  sus viajes en Gestionar viajes (con los scripts de tarifas corridos). Viajes → Recorridos más usados: el total de un
  recorrido coincide con Listar viajes filtrado por ese origen y destino. Rechazos por cliente y destino: abrir una
  celda con rechazo y comparar con los viajes de ese cliente a ese destino.
- [x] 5. Tocar la estrella de "Km por camión y por mes": toast y estrella llena. En SSMS, una fila en
  `TABLEROS_USUARIO` y los favoritos en `TABLEROS_FAVORITOS`. Ir al dashboard: la tarjeta está al final.
- [x] 6. Personalizar: sacar una tarjeta con la estrella, mover otra, Guardar → "Dashboard guardado.". F5 → quedó así.
  Abrir el sistema en otro navegador con el mismo usuario: el mismo dashboard.
- [x] 7. Restablecer → el dashboard de siempre (y las filas del usuario se borran de las dos tablas).
- [x] 8. Con un usuario que no es admin: sin el permiso, Tableros no está en el menú y escribir `tableros.html` lleva al
  inicio; en Personalizar, "Agregar tableros" deshabilitado con "No se puede abrir Tableros: no tenés permiso". Tildarle
  "Tableros" a su grupo en Gestionar grupos y permisos (aparece en General, debajo de Dashboard) → ahora entra. Si el
  grupo no tiene cuenta corriente ni proformas, las tarjetas de facturación dicen que no tiene permiso.
- [x] 9. F12 a 390 px: Tableros en una columna, las pestañas se desplazan de costado y el mapa de calor también (con el
  nombre fijo).

**Probado en la VM (25 y 26/10, sobre `04d0be6` y `d3169f5`):** `docs/pruebas/2026-10-26-tableros.md`. Sin fallas: los
tableros cuadran con cuenta corriente, los viajes y Listar viajes, y la estrella, Personalizar, Restablecer, los permisos
y el celular funcionan. Sin probar: una celda con rechazo (no hay ninguno en la base), otro navegador (el diseño sale de
la base) y el aviso "no tenés permiso" de facturación (no hay un usuario sin cuenta corriente ni proformas). Dudas D1 y D2
y mejoras M4, M7 a M10, M12 y M13 de Tableros: en la §40, punto 7.

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

## 36. Hoja de ruta del chofer: el chofer usa el sistema desde el celular — PUSHEADO (24/10, con los ajustes); FALTA CORRER EL SCRIPT, COMPILAR Y PROBAR EN VM

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
  (letras A a D) y "Abrir en Google Maps" sin salir arranca en el galpón (galpón → origen → destino → galpón, punto 35 de
  la §41, 27/10); en viaje, desde donde está el chofer, destino → galpón. La API manda el galpón y los km al galpón. Sin
  galpón, como antes.
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

**Cuentas de los choferes (Rocío, 25/10):** cada chofer necesita su propia cuenta (Gestionar usuarios → Registrar
usuario, rol user, grupo "Choferes" y su ficha en "Chofer"). No alcanza con sumarlo a un grupo ni se puede hacer por SQL:
la contraseña la cifra la API.
- [ ] **Ahora, con Claude de la VM:** `docs/equipo/INSTRUCTIVO-CUENTAS-CHOFERES.md`: relevamiento de los choferes (cuáles
  son reales, cuáles de prueba y cuáles ya tienen cuenta), el grupo "Choferes" con solo "Hoja de ruta" (paso 2 de arriba)
  y un chofer de prueba con su cuenta, que **queda para la demo** (paso 3 de arriba). Sin viajes todavía: esos son la
  tanda 3.
- [ ] **26/10: las cuentas de todos los choferes reales**, a partir del relevamiento: una por chofer activo, con su
  contraseña (cada chofer recibe su usuario y su contraseña). Si son muchos, ver con Claude un atajo para crearlas
  juntas. Desde el celular del chofer anda recién cuando el sistema esté publicado (hoy todo corre en `localhost`).

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

## 37. Control interno de los viajes: recorrido completo, kilometraje, combustible estimado y gastos del chofer — PUSHEADO (24/10); FALTA CORRER EL SCRIPT, COMPILAR Y PROBAR EN VM

Idea de Rocío (24/10) para tener control interno de cada viaje. El viaje real no es solo de A a B: el camión sale del
galpón, va vacío al origen a buscar la carga, la lleva al destino y vuelve vacío al galpón. Ese recorrido no estaba en
ningún lado, ni lo que cuesta. **Decisiones de Rocío (24/10):** el galpón se carga aparte en Gestionar empresa (no es el
domicilio fiscal); todo se ve en Ver detalle del viaje; el precio del gasoil se carga en Gestionar camiones; el chofer
carga gastos en todos sus viajes desde que empiezan (cambiado el 27/10: desde que inicia el viaje y hasta 2 días después
de la entrega, y después administración; ver el punto 33 de la §41); el chofer no carga kilómetros a mano (sale de
Google Maps).

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
- [x] 2. **Hecho por Rocío (25/10).** Gestionar empresa → Galpón: la dirección real del galpón → Guardar → "Galpón
  guardado." y debajo "Calculando los km al galpón… N de M" hasta "Se calcularon los km al galpón de M de M orígenes y
  destinos.".
- [ ] 3. Gestionar camiones: "Cambiar precio del gasoil" con el precio de hoy. Editar el camión: el kilometraje del
  tablero de hoy, la fecha y el consumo (pedirle a la empresa el consumo real). Sin la fecha → "Completá la fecha del
  kilometraje.". **Falta en los 4 camiones (25/10):** ninguno tiene kilometraje, fecha ni consumo; sin eso, Ver detalle
  del viaje no estima el combustible ni el margen.
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

---

## 38. Documentos de prueba y tabla de tarifas "como si siempre hubiera estado" — TABLA DE ENERO Y `04` PUSHEADOS (25/10); LA LIMPIEZA, DESPUÉS DEL CAMBIO DE FACU

**Pedido de Rocío (25/10):** el sistema tiene que verse y funcionar como si siempre hubiera tenido la tabla de tarifas
(§34): sin leyendas ni rastros de las tarifas de antes (fija por cliente y recorrido, y bandas por km, que eran de
prueba), con todos los viajes calculados con la tabla, también los ya incluidos en documentos. Para que viajes y documentos
coincidan, los documentos de prueba se borran y se vuelven a generar desde el sistema.

**Cambio de Facu antes de la limpieza:** la profe pidió que en el sistema **no se use la palabra "factura"**: solo
"comprobante". Facu cambia los textos y la nomenclatura (hoy `FAC`). La limpieza y la regeneración de documentos se hacen
**después** de que Facu suba ese cambio y se pase a `rocionuvoli`, porque tocan los mismos comprobantes, tipos y
numeración. Lo de tarifas también se alinea: "facturado" en este relevamiento y en los comentarios de los scripts.

**Relevamiento del 25/10** (`database/limpieza/02_documentos_afectados_por_tarifas.sql`, solo lectura, corrido por
Rocío). Documentos que incluyen viajes y cambiarían con la tabla, **20 en total: 10 proformas y 10 comprobantes**:

| Grupo | Proformas | Comprobantes | Qué son |
|---|---|---|---|
| Con comprobante y cobradas | PF-00000001, PF-00000002, PF-00000004, PF-00000012 | FAC-00000001, FAC-00000006, FAC-00000012, FAC-00000015 · REC-00000001, REC-00000003 | Proformas propias con 15 viajes; los dos recibos cancelan solo esos comprobantes |
| Aceptada sin comprobante | PF-00000006 | — | Viajes 10, 13, 14 y 15 |
| Historia de la demo de Rukas | PF-00000008 a PF-00000011 (anuladas) | FAC-00000009 y FAC-00000010, cada uno con su nota de crédito (NC-00000002 y NC-00000003) | Pruebas de generar y anular con los viajes 25 y 26 |
| Borrador | #52 | — | Borrador de Rukas con el viaje 25 |

- **Presupuestos:** 8 (5 aceptados, los 5 con viaje generado, y 3 pendientes). También se recalculan con la tabla.
- **Comprobantes sin viajes:** 24 (9 FAC, 1 NC, 1 ND y 13 REC). No cambian con la tabla, pero son de prueba (textos como
  "asd asd").
- **Dato raro:** los viajes 3, 4, 6, 7 y 8 están en dos proformas con comprobante (PF-00000001 y PF-00000002), de antes de
  la regla "un viaje en una sola proforma". Al regenerar, cada viaje va en una sola.

**Decisión de Rocío (25/10, a la noche): opción B y antes del cambio de Facu**, porque él todavía no empezó y así la demo
del jueves tiene documentos que coinciden con sus viajes. Condiciones: el OK de Facu (son datos de su módulo; revisa el
script antes de que se corra), que nadie esté probando con esos documentos mientras se corre, y que su cambio a
"comprobante" convierta los comprobantes que existan (lo necesita igual). La limpieza es solo de datos: lo que se genere
sale con `FAC` y los textos de hoy. Pasos:
1. Rocío corre `database/limpieza/03_relevar_facturacion_de_prueba.sql` (solo lectura) y le pasa a Claude las siete
   partes: documentos, tablas que dependen, referencias sin clave foránea, viajes en documentos y libres, numeración
   (`SEQ_PROFORMA` y `FACTURACION_NUMERADORES`), disparadores y auditoría.
2. Claude arma `database/limpieza/04_borrar_facturacion_de_prueba.sql` y el guion de demo para la VM; Facu revisa el
   script. **Relevamiento del 25/10 a la noche:** 18 proformas (propias y de Rukas, ids 8 a 55) y 34 comprobantes (15 FAC,
   3 NC, 1 ND, 15 REC). Dependen: detalle, vínculo con proformas, movimientos y aplicaciones de cuenta corriente, formas
   de pago de recibos e historial de e-mails (de los comprobantes); detalle, viajes, Excel adjuntos y líneas de Rukas (de
   las proformas). Sin disparadores ni referencias sueltas. Viajes facturados que vuelven: 3, 4, 6, 7, 8, 9, 11 y 12 (con
   plataforma → Listo para facturar) y 5 y 38 (directos → Entregado). Numeración: `SEQ_PROFORMA` en 12 y
   `FACTURACION_NUMERADORES` FAC 15, NC 3, ND 1, REC 15. Los números internos (el "#" del borrador) no se reinician, para
   no mezclar la historia de Auditoría.
3. Con Facu y Fede avisados, Rocío lo corre y hace `COMMIT`; la VM genera el juego de demo desde las pantallas con
   `docs/equipo/INSTRUCTIVO-DEMO-FACTURACION.md`: Alimentos La Serena (viajes 43 y 44) con PF-00000001, FAC-00000001 y
   REC-00000001; Servicios Ambientales (viaje 38) con PF-00000002 aceptada sin comprobante; QUICKFOOD con el Excel del
   caso 1 (viajes 25 y 26), PF-00000003 y FAC-00000002 sin cobrar; una nota de crédito parcial sobre FAC-00000002 si la
   pantalla lo permite; y el viaje 5 libre para registrar una proforma en vivo. El diagnóstico del `04` coincidió con el
   relevamiento (18 proformas, 34 comprobantes, 10 viajes que vuelven).
   **Limpieza aplicada por Rocío el 25/10 a la noche, con `COMMIT`:** 18 proformas y 34 comprobantes borrados con todo lo
   que dependía de ellos, 10 viajes facturados de vuelta a Listo para facturar o Entregado, numeración en 0 y un registro
   en Auditoría; sin transacciones abiertas.
   **Juego de demo generado por la VM el 25/10** (`docs/pruebas/2026-10-25-demo-facturacion.md`): PF-00000001 a 00000003,
   FAC-00000001 y 00000002, REC-00000001 y NC-00000001, todos con el importe esperado y coincidiendo con sus viajes;
   Tableros cuadra. Una falla (el enlace "Ver la cuenta corriente del cliente" no filtra por el cliente) y 15 mejoras;
   las de presupuestos, proformas propias, comprobantes y cuenta corriente van a la lista de Facu (§40, punto 5).
   **Arreglos de la demo hechos en la Mac (25/10), sin probar en la VM:** la proforma de Rukas pone el adicional en una
   línea aparte ("Adicional transporte 990002", sin código de viaje) y el transporte con el importe de su viaje; el control
   de Rukas y sus textos ("Importe distinto…") con centavos ("$ 429.101,00"); en Tableros, los totales y el globito de
   "Facturación por cliente y por mes" y la deuda por cliente con centavos (las celdas del mapa, compactas); la tarjeta
   "Costo por viaje" pasa a llamarse "Importe promedio por viaje"; y el instructivo de la VM dice que los viajes de una
   proforma propia siguen Entregado hasta la factura. PF-00000003 queda como está (decisión de Rocío): el arreglo se ve
   en la próxima proforma de Rukas. **Probar en la VM:** una proforma de Rukas nueva (por ejemplo, en vivo con el caso 2
   corregido o el caso 3) con el adicional aparte y el total igual; la factura de esa proforma con las dos líneas;
   Tableros → Facturación con centavos y el nombre nuevo.
   **26/10: Facu borró los comprobantes de la demo** para su cambio de dejar de usar facturas (D3 de Tableros, en la
   §39): el juego de demo se vuelve a generar después de su cambio.
   **Antes de la presentación:** el cliente "distribuidora-powerful S.A." (viaje 5 y otros) tiene un nombre que no parece
   real; cambiarlo en Gestionar clientes por uno creíble (el relevamiento de textos de prueba no lo detecta).

**Opciones (Rocío decide; Claude recomienda la B para la defensa):**
- **A. Lo mínimo:** borrar y regenerar desde el sistema la cadena de las proformas con comprobante (4 proformas, 4
  comprobantes y 2 recibos) y la aceptada; borrar la historia de la demo de Rukas (4 proformas anuladas, 2 comprobantes y
  2 NC) y el borrador #52. Quedan huecos en la numeración (los nuevos toman PF-00000013, …) y siguen los 24 comprobantes
  de prueba sin viajes.
- **B. Limpieza completa de la facturación de prueba:** borrar todas las proformas y los 34 comprobantes de prueba,
  reiniciar la numeración y generar desde el sistema un juego de demo coherente (por ejemplo, una proforma propia con su
  comprobante y su recibo, una de Rukas y una nota de crédito). Todo arranca en 1, sin huecos, sin textos de prueba y con
  los importes de la tabla.

**Antes del jueves 29/10** (no depende de Facu):
1. **Hecho: tabla anterior** para los viajes de antes del 01/08/2026: "Tarifas a enero 2026", desde el 01/01/2026 (hasta que
   empieza la de agosto), para todos los clientes. Los precios de antes no se podían copiar (eran por recorrido o por km,
   sin tipo ni modelo de camión): son los de agosto con un 15 % menos, redondeados a pesos, como si en agosto hubiera
   habido un aumento (decisión de Rocío, 25/10). Va en `database/tarifas/03_cargar_tablas_de_tarifas_2026.sql` (antes
   `03_cargar_tarifario_agosto_2026.sql`, sin correr), que ya no les guarda a los viajes el importe de antes y no cambia
   quién modificó los camiones.
2. **Hecho: `database/tarifas/04_viajes_con_la_tabla_de_tarifas.sql` rehecho:** todos los viajes y presupuestos (aceptados,
   pendientes y rechazados) con la tabla de su fecha, también los facturados, sin grupos que conservan el importe y **sin
   leyendas**. Los viajes de un presupuesto toman el importe recalculado del presupuesto. No cambia la fecha ni el usuario
   de la última modificación. Hasta la limpieza, los comprobantes de prueba no coinciden con sus viajes (se borran
   después). Mientras no se corra, los viajes viejos no se pueden editar con la API nueva (no tienen tabla).
3. Correr `02`, `03`, elegir el tipo de los camiones y correr el `04`; probar con los pasos de la §34. Si la demo de Rukas
   se muestra el jueves, pasarle a Claude los importes nuevos de los viajes 25 y 26 (los muestra el `04`) para regenerar
   los Excel antes (paso 8).

**Después del cambio de Facu:**
4. Pasar el cambio de Facu a `rocionuvoli` (conflictos de a uno con Rocío).
5. Ajustar `02_documentos_afectados_por_tarifas.sql` a los tipos y nombres nuevos y volver a relevar. La búsqueda
   de `Tarifas/TarifarioImpacto.cs` (§33) ya reconoce los comprobantes de deuda vinculados a la proforma, incluido FC;
   conserva la búsqueda histórica de FAC por el código del viaje.
5b. **Aviso en el comprobante (§33):** el ícono rojo en su fila y el aviso en su detalle con los viajes y "Corresponde
   una nota de crédito por $ X" (módulo de Facu: lo hace él o se coordina). Hoy el aviso está en el viaje y en la tarjeta
   del dashboard. Y que **emitir la nota de crédito o de débito sobre ese comprobante lo resuelva solo** (como reenviar
   el presupuesto o anular la proforma), con un enlace directo desde la tarjeta: así "Marcar como resuelto" deja de hacer
   falta.
6. **Script de limpieza** (lo arma Claude, lo corre Rocío con `BEGIN TRAN`): borra las proformas y los comprobantes
   elegidos con todo lo que depende de ellos (detalle, cuenta corriente, aplicaciones, vínculos con los viajes y con las
   proformas); los viajes que quedaron sin documento vuelven a Listo para facturar (con plataforma) o Entregado
   (directos); con la opción B, reinicia la numeración. Primero un diagnóstico de solo lectura.
7. **Generar desde las pantallas** los documentos de la demo, con los importes de la tabla; cada viaje en una sola
   proforma.
8. **Demo de Rukas — hecho (25/10):** los Excel de `docs/pruebas/datos/` con los importes de la tabla (990001 $ 429.101,
   990002 $ 278.028), la fecha (16/10), la ruta de los viajes ("SEDE QUILMES - SEDE BANFIELD") y sin "PRUEBA TRANSPORTE".
9. **Tesis:** pasar al modelo de la tabla de tarifas el RF12 (`01-analisis-organizacional.md`), el anteproyecto
   (`02-anteproyecto.md`), la arquitectura (`04-arquitectura-y-diseno.md`) y el CP11 (`05-pruebas-e-implementacion.md`, hoy
   "tarifa por km #5, $ 14.790"), con la palabra "comprobante". La HU26 de la tabla de sprints (`03-metodologia-y-sprints.md`,
   "Tarifas fijas y por km"): a decidir; Claude recomienda dejarla, porque cuenta lo que se hizo en ese sprint, y sumar el
   cambio como una mejora posterior.
10. Probar en la VM: la demo completa (viaje → proforma → comprobante → recibo, y Rukas).

**Decisiones pendientes:**
- [x] Tabla anterior: los valores de agosto con un 15 % menos (Rocío, 25/10).
- [ ] Opción A o B, y qué casos de la demo se regeneran.
- [ ] Módulos de estadía: proponerlos con el inicio y el fin del viaje, o a mano (§34).
- [ ] Tesis: la HU26.

---

## 39. Ronda de pruebas en la VM de lo subido el 24 y 25/10 — PLANIFICADA (25/10)

Todo lo de §33 a §37 está pusheado (`rocionuvoli` @ `a3fb22c` o posterior) y no tiene reporte de prueba. La API nueva
necesita las columnas y tablas de los scripts, así que **la preparación se hace una sola vez y al principio**; las pruebas
van **por tandas**, una por tema y con su propio reporte en `docs/pruebas/`, para que una falla de un tema se corrija en
la Mac sin frenar los demás. Las tandas van en orden de prioridad para el jueves 29/10.

**Preparación (Rocío; base compartida: avisar al equipo antes):**
1. SSMS, base `Transporte_Sanchez`, en este orden (cada uno es idempotente y termina con su verificación "OK"):
   `database/tarifas/02_tarifario_por_vehiculo.sql` → `database/tarifas/05_cambios_de_tarifa.sql` →
   `database/tableros/01_crear_tableros_favoritos.sql` → `database/hoja-de-ruta/01_usuario_chofer.sql` →
   `database/costos/01_galpon_kilometraje_y_gastos.sql`.
2. `database/tarifas/03_cargar_tablas_de_tarifas_2026.sql` tal cual: revisar los camiones "Elegir en Gestionar camiones"
   y que "Viajes antes del 01/01/2026" dé 0 (si no, avisar a Claude en la Mac). Después `@Aplicar = 1` y `COMMIT`.
3. VM: `git pull` en `rocionuvoli` (anotar el commit), recompilar la API en Visual Studio, Live Server y Ctrl+F5.
4. Gestionar camiones: elegir el tipo de los camiones que el `03` no pudo deducir. **Hecho (Rocío lo revisó en la base el
   25/10):** los 4 camiones están activos, con un tipo de la tabla y el año del modelo, y ningún viaje quedó sin importe.
5. `database/tarifas/04_viajes_con_la_tabla_de_tarifas.sql` tal cual: la columna "Falta" vacía, revisar el resumen y
   anotar los importes nuevos de la demo de Rukas (viajes 25 y 26: pasárselos a Claude para los Excel). Después
   `@Aplicar = 1` y `COMMIT`.

**Tandas (cada una con la sesión de Claude de la VM, según `docs/equipo/PRUEBAS-VM-CLAUDE.md`):**

**Orden (Rocío, 25/10, después de la reprueba de la tanda 1):** la tanda 2 pasa al final. Hoy las proformas y los comprobantes
de prueba guardan los importes de antes del `04`, así que lo que la parte C prueba (los viajes que ya están en una proforma
enviada o en un comprobante) se mezclaría con esa diferencia: va después de la limpieza y la regeneración de documentos de la
§38 (que espera el cambio de Facu). Las tandas 3 a 6 nunca se probaron y van antes. Los arreglos de `d54fe21` se revisan
en una pasada corta al principio de la tanda siguiente.

**Ramas del equipo (25/10, decisión de Rocío):** `facugodoy` y `fedemontenegro` pasan a estar iguales a `rocionuvoli`
(avance directo, sin commits propios de ellos desde el 23/10), sin esperar todas las tandas: la base ya tiene los scripts
del 24 y 25/10 y el código anterior no funciona contra ella (las tarifas viejas quedaron vacías). Facu (cambiar
"factura" por "comprobante") y Fede (recupero de clave por WhatsApp y "Reenviar WhatsApp" en viajes) trabajan desde ahí.
`main` se actualiza cuando terminen las tandas 3 a 5 (a `main` pasa solo lo probado). **Otra vez al día el 25/10 a la
noche**, con la limpieza de la facturación de prueba, el juego de demo y sus arreglos: desde ahí avanzan los dos.
**`main` también, el 25/10 a la noche, por pedido de Rocío** (avance directo de `dfd6817` a `b6ebaf3`, 70 commits): las
cuatro ramas iguales. Entraron sin prueba en la VM la hoja de ruta (§36), el control interno (§37), las dos mejoras de
cuenta corriente (§29) y lo último de la demo (adicional de Rukas aparte, centavos, "Importe promedio por viaje");
tableros (§35) se estaba probando. Lo que salga de esas tandas se corrige en `rocionuvoli` y pasa a `main` después.

| Orden | Tanda | Qué | Pasos | Antes de probar |
|---|---|---|---|---|
| 1 | 1 | Tabla de tarifas y sus cambios con datos de prueba (§34 y §33) | Partes A y B de `docs/equipo/INSTRUCTIVO-PRUEBAS-TARIFAS.md` (todas las variantes y la mirada de usabilidad) | **Hecha y reprobada (25/10)** |
| 2 | 4 | Tableros (§35), con la pasada corta de los arreglos de `d54fe21` al principio | Del 2 en adelante (el 0 y el 1 ya están hechos) | **Hecha (25 y 26/10)** |
| 3 | 3 | Hoja de ruta del chofer (§36) | Todos, con los ajustes A a F | El grupo "Choferes" y la cuenta del chofer de prueba, con `docs/equipo/INSTRUCTIVO-CUENTAS-CHOFERES.md` (su celular es uno del equipo: le llega el WhatsApp); preguntar antes de lo que manda WhatsApp |
| 4 | 5 | Control interno de los viajes (§37) | Todos | La dirección del galpón en Gestionar empresa → Galpón: **cargada por Rocío (25/10)** |
| 5 | 6 | Dos mejoras de cuenta corriente (§29) | Las de "cuando Rocío lo pida" | — |
| 6 | 2 | Lo que ya vio el cliente: proformas enviadas y comprobantes (§33) | Parte C del mismo instructivo (cambia un valor de agosto y lo deshace) | La limpieza y los documentos nuevos de la §38; el OK de Rocío y avisar a Facu y Fede. Usuarios: admin, uno solo con "Gestionar presupuestos" y uno solo con "Gestionar proformas" |

**Tanda 1 — hecha en la VM (25/10, sobre `19804b4`):** `docs/pruebas/2026-10-25-tarifas-tanda-1.md`. 43 pruebas: 32 OK, 6 OK
con observaciones, 2 fallas (las dos por F1) y 3 no probadas (e-mail de la VM, Excel de Rukas sin regenerar en ese commit,
parte C). Los importes cuadran en todos los casos. Fallas: **F1** (alta: cambiar clientes o fecha mueve viajes de tabla
sin confirmar ni registrar), F2 (Registrar copia una tabla propia), F4 (viajes con la factura ya compensada por una nota de
crédito se tratan como facturados), F8 (guardar tarda 10 a 20 s); fuera de tarifas: F3 (Five Server recarga la pantalla
de viajes), F5 (la máscara de montos borra lo escrito), F6 (Gestionar clientes se traba si falla la apariencia), F7 (sesión
vencida sin aviso), F9 (la API responde sin token), F10 (nombres técnicos en el filtro de Auditoría). Además, 7 dudas y 27
mejoras para que decida Rocío.

**Arreglos de la tanda 1 hechos en la Mac (25/10), sin probar en la VM:**
- **F1:** lo que pasa a otra tabla con el mismo importe (al cambiar los clientes o la fecha, o con una tabla nueva igual a
  la anterior) ya no se guarda sin preguntar: la confirmación tiene el grupo gris "Cambian de tabla, mismo importe · N"
  con 'Pasa a "…"' en cada fila, pide el motivo, el aviso dice cuántos "pasaron a otra tabla con el mismo importe" y
  Auditoría tiene un registro por viaje y presupuesto ("Pasa a la tabla de tarifas "…" con el mismo importe ($ …) por …").
  Cambiar solo el nombre sigue guardando directo. Compilado y probado en la Mac (arnés y API simulada).
- **F2:** Registrar tabla de tarifas copia la última tabla para todos los clientes, aunque la más nueva sea una propia.
- **F4:** un viaje cuenta como "en un comprobante" solo si está Facturado (o su proforma, Facturada): los de una factura ya
  compensada con una nota de crédito vuelven a Listo para facturar y se recalculan como cualquiera.
- **D1 a D4:** corregidos el instructivo (falso flete, viajes en Entregado para "Traer viajes", B4 y B6 con el grupo nuevo)
  y la §33 y la §34 (el aviso corto del presupuesto; viaje de julio en vez de marzo).
- **Probar en la VM:** B4 y B6 del instructivo (siempre con confirmación, todos los viajes en la lista); Registrar con la
  tabla de prueba primera en la lista ("Viene con los valores de "Tarifas a agosto 2026"…"); agosto → "Solo algunos
  clientes" sin guardar: los viajes 25 y 26 ya no dicen "Nota de crédito sobre FAC-00000010.".

**Mejoras de la tanda 1 hechas en la Mac (25/10, "sí a lo recomendado"), sin probar en la VM:**
- Gestionar tarifas: encabezado en una línea con "Registrar tabla de tarifas" a la derecha (M14); Vigencia centrada (M27);
  Registrar dice 'Viene con los valores de "…", la última para todos los clientes: cambiá los que subieron.' (M4); "1
  cliente elegido: Alimentos La Serena S.A." (o los primeros y "y N más"), sin "Todavía no elegiste…", y el rojo en la
  lista (M11); al pasar una general a algunos: 'Vale solo para los clientes que elijas. Los demás clientes pasan a "…", la
  anterior: sus viajes desde el … se calculan con esos valores.' (M12); eliminar una propia: '… vuelve a "Tarifas a agosto
  2026".' con los nombres (M13); "Revisá estos valores" con una frase por regla ("la 2ª vuelta hasta 130 km (…) es más
  cara que la 1ª (…)") y las dos celdas con borde amarillo (M17).
- Errores al guardar: la fecha repetida va debajo de "Vigente desde" y se va al cambiar la fecha o los clientes (M9); los
  viajes sin tabla siguen arriba con la lista y, debajo del campo, qué cambiar ("Para que no queden sin tabla, tiene que
  empezar el dd/mm/aaaa o antes." o "volvé a elegir esos clientes.") (M8).
- "Revisá los campos marcados." se va solo cuando ya no queda ningún campo en rojo, en todas las pantallas (M10,
  `SGTL.avisoFormulario`).
- Confirmación: un viaje de presupuesto aceptado solo aparece si con el cambio le correspondería otra tabla (M26); un
  presupuesto que vuelve al importe que tenía dice "Vuelve al importe que tenía." (M3, en parte; saber si se envió queda
  para después). Aviso al guardar: "El presupuesto #10 queda para reenviar." / "N viajes que ya vio el cliente quedan para
  revisar." (M2).
- Auditoría de la tabla: "Cambió: …" con cada valor en palabras ("Balancín (3 ejes), 2019 en adelante, hasta 130 km, 1ª
  vuelta: $ 600.000,00 → $ 620.000,00"), los clientes por su nombre y las filas como "2018 o anterior · Furgón" (M7).
- Tarjeta: 'Corrección de "Tarifas a agosto 2026" del …: motivo.', "Pendiente · 1" / "Pendientes · N" en lugar de "Hoy", y
  vacía, la frase sola, sin los títulos (M5). Editar presupuesto: "Reenviáselo desde Ver PDF → Enviar por e-mail." (M6).
- Viajes: la línea del importe dice "sin IVA" y "Furgón 2019 en adelante, fija hasta 130 km, 1ª vuelta: $ … · falso
  flete (60 %): $ … · estadía (1 módulo): $ …" (M15; el mismo texto en la API, en la pantalla y en el `04`); el aviso de un
  viaje que ya salió: "Ya salió: se completan el remito, el falso flete y la estadía. Si cambia el recorrido, registrá otro
  viaje." (M16); en los buscadores de cliente y chofer, Enter elige la única coincidencia (M19, en todas las pantallas).
- **Para que los viajes ya guardados muestren el texto nuevo (M15):** Rocío vuelve a correr
  `database/tarifas/04_viajes_con_la_tabla_de_tarifas.sql` (tal cual: "Falta" vacía y los importes nuevos iguales a los de
  hoy; después `@Aplicar = 1` y `COMMIT;`). Solo cambia el texto del detalle: los importes quedan iguales.
- Quedan para después: M24 (buscador de clientes en Gestionar orígenes y destinos) y M25 (la hora del recálculo en UTC,
  con la §2).
- **Probar en la VM:** lo de arriba, pantalla por pantalla, con la misma mirada de usabilidad.

**Reprueba de la tanda 1 — hecha en la VM (25/10, sobre `6123630`):** `docs/pruebas/2026-10-25-tarifas-tanda-1-reprueba.md`.
29 pruebas: 21 OK, 6 OK con observaciones de texto y 2 no probadas (el 5502, que en la VM no existe, y lo que necesita la
parte C). **Sin fallas: F1, F2, F3 (en el 5500) y F4 resueltas**, y las mejoras se ven como se pidieron. Quedan M-a a M-h
(textos y errores que no se van solos), D3 (un viaje facturado que cambia de tabla) y D4 (el aviso de cambios sin guardar
de proformas) para decidir. D1 (instructivo) y D2 (en la VM el front es Five Server en el 5500; el 5502 de Live Server
ya quedó probado con 1.4) corregidos.

**Arreglos de la reprueba hechos en la Mac (25/10, "hacé todo como recomendás"), sin probar en la VM:**
- Tarifas: el error de fecha repetida y el de viajes sin tabla se van al cambiar la fecha, los clientes o "Todos / Solo
  algunos" (M-a, M-b); "Antes de guardar vas a ver qué pasa con cada uno." (M-c); "Se recalculó 1 viaje y 1 presupuesto." /
  "Se recalcularon 2 viajes…" (M-d); con cuatro clientes se nombran los cuatro (M-g); registrar guarda los valores y los
  clientes de una sola vez (M-h).
- Auditoría: sin "S.A..", sin contadores en 0, y en el viaje 'Pasa a "…": $ antes → $ ahora, por la corrección de la
  tabla de tarifas "…". Motivo: ….' (M-e); el filtro y la lista muestran la entidad sin el sufijo técnico de Entity
  Framework ("TARIFAS_KM", F10).
- D3: un viaje en una proforma enviada o en un comprobante que cambiaría de tabla con el mismo importe queda con su tabla,
  en "No cambian", con "Ya está en FAC-…: queda con su tabla.".
- D4: el aviso "Tenés cambios sin guardar" dentro del modal queda como patrón del design system (§6.2).
- Viajes: el título de un viaje que ya salió es "Completar el viaje #46" (M-f; también el globito del botón de la fila).
- F5: un monto mal escrito ("12x") ya no se borra: queda para que la validación diga "Escribí el importe como 1.234,56."
  (en todas las pantallas). F6: si falla la carga de la apariencia (logo y colores), la pantalla se usa igual (las 18
  pantallas que la cargaban así).
- **Probar en la VM:** B4 y B5 (los errores se van al cambiar), B6 con un viaje facturado del cliente de prueba si hay
  (si no, con la parte C), el aviso al guardar, Auditoría (un cambio de tabla y su filtro "Entidad"), un viaje En viaje
  (título), "12x" en un monto de tarifas y de cuenta corriente, y registrar una tabla (tiempo).

**Tanda 4 (Tableros) — hecha en la VM (25 y 26/10, sobre `04d0be6` y `d3169f5`):** `docs/pruebas/2026-10-26-tableros.md`.
39 pruebas: 32 OK, 3 OK con observaciones y 4 no probadas; **sin fallas**. La pasada corta de `d54fe21` dio todo como se
pidió: los errores se van solos, el aviso concuerda en singular y plural, Auditoría dice 'Pasa a "…"' y registrar tarda
3,3 s con un solo registro. Tableros: ver §35.
- **Dudas D1 y D2 y mejoras M1 a M16:** anotadas en la §40, punto 7. Rocío las ve después de sus cambios de tarifas.
- **D3, antes del 29/10:** el 26/10 la base no tiene ningún comprobante emitido (`api/dashboard/top-clientes-facturacion`
  cuenta todos los `EMITIDO`, sin filtrar por usuario, y da `[]`), aunque la demo del 25/10 generó FAC-00000001 y
  00000002, REC-00000001 y NC-00000001 después de la limpieza. **Causa (Rocío, 26/10): Facu borró comprobantes en la base
  para su cambio de dejar de usar facturas.** El juego de demo se vuelve a generar cuando su cambio esté en
  `rocionuvoli` y él diga que no borra más (con el instructivo actualizado a lo suyo). Preguntarle a Facu:
  - qué borró (solo comprobantes, o también proformas, movimientos de cuenta corriente y numeradores) y si vuelve los
    viajes a su estado: si quedaron en Facturado sin comprobante (43, 44, 25 y 26 de la demo), tarifas los trata como "ya
    vio el cliente" (`Tarifas/TarifarioImpacto.cs:448`) y la proforma no deja volver a facturarlos;
  - cómo quedan los tipos y los estados: tarifas busca `COMPROBANTES.Tipo = 'FAC'` (`TarifarioImpacto.cs:170`) y los
    estados Facturado y Facturada; Tableros suma `Tipo IN ('FAC', 'ND', 'NC')` (`TablerosController.cs:332`). Si cambian,
    hay que cambiarlos acá en el mismo merge, o esos tableros y la detección de "ya está en un comprobante" quedan vacíos
    sin dar error.
  Para ver qué quedó en la base, Rocío puede correr este diagnóstico (solo lectura) y pasarle el resultado a Claude:
  ```sql
  SELECT N'Comprobantes' AS Que, Tipo, Estado, COUNT(*) AS Cantidad,
         MIN(NumeroCorrelativo) AS Primero, MAX(NumeroCorrelativo) AS Ultimo
  FROM dbo.COMPROBANTES GROUP BY Tipo, Estado;
  SELECT N'Proformas' AS Que, Estado, COUNT(*) AS Cantidad FROM dbo.PROFORMAS GROUP BY Estado;
  SELECT Nombre, UltimoNumero FROM dbo.FACTURACION_NUMERADORES;
  SELECT Viaje_ID, Estado FROM dbo.VIAJES WHERE Viaje_ID IN (5, 25, 26, 38, 43, 44);
  SELECT Fecha, Usuario, Accion, Entidad, Clave, LEFT(Valores_Nuevos, 300) AS Detalle, Origen
  FROM dbo.AUDITORIA
  WHERE Clave = N'Limpieza de prueba'
     OR (Fecha >= '2026-10-25T23:00'
         AND (Entidad LIKE N'COMPROBANTE%' OR Entidad LIKE N'PROFORMA%' OR Entidad LIKE N'CUENTA_CORRIENTE%'))
  ORDER BY Fecha;
  ```
- **Seguridad:** `api/Grupos/{id}/Menus` le responde a un usuario que no es admin (sumado a la §40, punto 1).
- **Limpieza:** desde las pantallas, destildar Dashboard y Tableros del grupo Facturacion (4) y eliminar "Tarifas
  Logística Pampeana" (tabla 7, sin viajes), o con el SQL del reporte. **No correr el SQL de limpieza de la tanda 1**: borra
  el cliente 7 (Alimentos La Serena) con los viajes 43 y 44, que son parte de la demo.

**28/10:** las tandas 3, 5 y 6 pasan a `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md` (rondas 4 y 3); la 2 sigue esperando la §38.

**Tandas 3, 5, 6 y 2 en pausa (Rocío, 26/10):** después de Tableros surgieron cambios y mejoras de tarifas que van
primero. La hoja de ruta (§36), el control interno (§37) y las dos mejoras de cuenta corriente (§29) ya están en `main`
sin probar; se retoman después de los cambios de tarifas, antes del 29/10.

**F3 de la tanda 1 (25/10):** `fiveserver.config.js` en la raíz le dice a Five Server (el 5500 de la VM) que no recargue
por `App_Data`, `bin`, `obj`, `.vs` y `.vscode`, como ya hace Live Server (5502) con `.vscode/settings.json`. **Probar en la
VM en los dos puertos** (Rocío quiere que funcione en los dos): reiniciar el servidor después del `pull`, registrar un
viaje con chofer y Guardar: la pantalla no se recarga y el aviso del WhatsApp queda a la vista.

**Al terminar cada tanda:** la VM muestra el reporte, Rocío lo pasa a la Mac, Claude lo guarda en
`docs/pruebas/2026-10-AA-<tema>.md`, corrige lo que haga falta y lo pushea antes de la tanda siguiente (o al final, si no
bloquea).

---

## 40. Después de la ronda de pruebas, con prioridad — ANOTADO (25/10)

Decisiones de Rocío al leer el reporte de la tanda 1 (`docs/pruebas/2026-10-25-tarifas-tanda-1.md`). **Se ven apenas
cierren las pruebas de la §39**, antes que lo demás.

- [ ] **1. Seguridad de la API y del JWT (F9 de la tanda 1; sigue a F1b de la §8).** Sin token responden 200, entre otros,
  `GET api/Tarifario`, `api/Tarifario/{id}`, `api/Tarifario/Vigente`, `api/Viajes`, `api/Clientes` (con CUIT, teléfono y
  e-mail) y `api/Camiones`; `api/Tarifario/Revisar` sí da 401. Con la sesión de un usuario que no es admin,
  `api/Grupos/{id}/Menus` le muestra los permisos de cualquier grupo (Tableros, 26/10). Hay que revisar, además:
  - un solo control del token para toda la API (hoy cada controller lo valida a su manera: `UsuarioDelToken` en Tableros,
    `AlcanceDelToken` en Tarifario, facturación y e-mail por su lado) y que el front mande `Authorization` siempre;
  - dónde vive la clave con la que se firma el JWT (hoy en el código, `JwtConfig.cs`): pasarla fuera de git, como la cadena
    de conexión, y cambiarla;
  - cuánto dura la sesión (en la VM venció a la hora) y que al vencer el login diga "Tu sesión venció. Volvé a iniciar
    sesión." (F7 de la tanda 1);
  - que un error 500 no devuelva la excepción completa (F6 de la tanda 1: se ve en la red). **Hecho el 28/10** para toda la
    API (`IncludeErrorDetailPolicy.Never`, F4 de la ronda 1 del 28/10, §59).
  Toca los controllers de todos: **coordinar con Facu y Fede** antes de cambiarlos.
  **Ronda 1 del 28/10 (§59):** F3, `api/Usuarios`, `Usuarios/Buscar`, `Usuarios/{id}/Detalles` y
  `Usuarios/MenusPermitidos?username=` responden sin token (la lista de usuarios, sus grupos y quién es administrador);
  arreglarlo pide mandar el token desde Gestionar y Listar usuarios y desde el menú de todas las pantallas
  (`sidebar-loader.js`), y que `MenusPermitidos` tome el usuario del token. DS4 y M7: al vencer la sesión (30 minutos,
  aunque se esté usando) va al login sin avisar; avisar "Tu sesión venció. Volvé a iniciar sesión." y renovarla mientras
  hay actividad.
- [ ] **2. E-mail desde la VM (D5 de la tanda 1; F1 del 23/10).** En la VM, enviar un presupuesto dice "No se pudo leer la
  contraseña del perfil SMTP. Volvé a guardarla en Configuración > Gestionar e-mail.". Causa conocida: la API cifra la
  contraseña con la clave de la PC que la guardó (`MachineKey`) y la base es compartida. Rocío pide **resolverlo o
  investigarlo de nuestro lado** para que funcione en cualquier PC del equipo (una clave común fuera de git, o la que
  proponga Facu, que es el módulo de e-mail). Sin esto no se puede probar que reenviar un presupuesto resuelva lo
  pendiente por un cambio de tarifa (B3 de la tanda 1). **El 28/10 volvió a pasar con el recupero de contraseña** (F2 de
  la ronda 1, §59): el perfil 3 lo guardó Facu desde su máquina y la VM no puede leerlo, así que el correo no sale (y la
  pantalla dice igual que se envió). Mientras tanto, la contraseña de los tres perfiles se vuelve a guardar desde la
  máquina que va a mandar los correos. Sumar M2: avisar cuando un envío falla (Auditoría o Gestionar e-mail) y un botón
  "Enviar correo de prueba" por perfil (`api/EmailServidor/{id}/probar` ya existe).
- [ ] **3. Generar un viaje desde un presupuesto le manda la hoja de ruta al chofer (D6 de la tanda 1).** Hoy no la manda
  ni la ventana "Generar viaje" avisa nada; registrar el viaje desde Gestionar viajes sí. Decisión de Rocío: tiene que
  ser igual que registrarlo a mano, con el aviso azul "Al guardar, … recibe la hoja de ruta por WhatsApp." (§5.1 del
  design system) y el toast de si salió o no. Es el módulo de presupuestos (Facu) y el envío es de WhatsApp (Fede).
- [ ] **4. Pedido a Fede: texto en la plantilla de WhatsApp de viajes.** Sumarle al mensaje que recibe el chofer que puede
  gestionar todo lo del viaje (iniciarlo, registrar la entrega con la evidencia, cargar los gastos) entrando a su Hoja de
  ruta en el sistema. Es una plantilla de Meta: el cambio la tiene que volver a aprobar Meta.
- [ ] **5. Cuando Facu suba lo nuevo de presupuestos y proformas (mejoras de la tanda 1, para no olvidarlas):**
  - M20, Traer viajes: "Se agregaron 2 viajes. No se trajeron 6 que todavía no están entregados: #45, #46, #47, #48, #49 y
    #50." (sin "Atención:", sin mayúscula en el medio y los números en orden).
  - M21, Presupuestos: en el PDF, "41,4 km" con coma, el CUIT del cliente con guiones, "E-mail", sin espacios al final de
    los datos y el importe "sin IVA"; en el formulario, la distancia con coma (§7.3), "Importe" en lugar de "Importe
    calculado (ARS)", solo choferes activos (como en Generar viaje) y una ayuda del importe más corta.
  - M22, Gestionar proformas: "Total general" (no en mayúsculas, §9) y "→" en lugar de "->" en el concepto del viaje.
  - D6 (punto 3 de esta lista): generar un viaje desde un presupuesto manda la hoja de ruta.
  - Del juego de demo (25/10, `docs/pruebas/2026-10-25-demo-facturacion.md`): F1, "Ver la cuenta corriente del cliente"
    (`?clienteId=`) no filtra por el cliente ni lo elige en Registrar recibo; confirmación con `SGTL.confirmar` al generar
    una proforma propia (la de Rukas ya la tiene); la nota de crédito, que se pueda escribir el neto; "Factura emitida:
    FAC-…" arriba y el modal de emitir con `data-bs-backdrop="static"`, "Cancelar" + "Emitir comprobante" y lo fijo como texto;
    el aviso de "Traer viajes" con el éxito aparte y la lista ordenada; en cuenta corriente, "—" en el saldo de las filas
    aplicadas; "Ver" de los comprobantes como detalle (§6.2); campos fijos como texto en recibo y nota de crédito (§6.3);
    sin `type="number"` en el detalle de la proforma (§7.3); el CUIT del selector de clientes con el mismo formato en
    proformas y cuenta corriente; "→" en el concepto de los viajes.
- [ ] **6. Limpieza de textos de prueba de rondas viejas (M23 de la tanda 1).** Los presupuestos #4 y #5 muestran el cliente
  "PRUEBA-CLAUDE 17/10 S.A." y el recorrido "PRUEBA-CLAUDE 18/10 → PRUEBA-CLAUDE 18/10", que quedaron copiados en el
  presupuesto. Tienen viaje (#29 y #31), así que no se borran: se corrigen los datos copiados con el nombre actual del
  cliente y del recorrido (SQL con `BEGIN TRAN`, lo corre Rocío). Antes de la presentación, volver a correr
  `database/limpieza/01_relevar_datos_de_prueba.sql` (solo lectura) y corregir todo lo que salga. Desde el 25/10, la VM
  usa solo datos con forma de reales (§3 de `docs/equipo/PRUEBAS-VM-CLAUDE.md`, que manda sobre los documentos viejos).
- [ ] **7. Dudas y mejoras del reporte de Tableros (26/10, `docs/pruebas/2026-10-26-tableros.md`).** Rocío las ve
  después de cerrar sus cambios de tarifas (decisión del 26/10). Recomendación de Claude entre paréntesis.
  **M1, M2, M3, M11 y M14: hechas (27/10), subidas, pendientes de probar en la VM** (junto con los textos 12 a 14 de la
  §41 y los errores de campo cortos del §6.3 del design system). Recompilar la API y, en Gestionar tarifas:
  1. Registrar tabla de tarifas: cambiar un valor y tocar Cancelar o la cruz → arriba, "Tenés cambios sin guardar. Si
     cerrás, se pierden." con "Seguir editando" y "Descartar cambios"; abrir y cerrar sin tocar nada → cierra directo;
     guardar → cierra sin el aviso (M1, `SGTL.cambiosSinGuardar`).
  2. Textos: "Clientes en particular"; "Se aplica a todos los clientes, también a los que se carguen después, salvo los
     que tienen una tabla propia." / "Se aplica solo a los clientes que elijas, en lugar de la tabla para todos los
     clientes."; Registrar: 'Precargada con los valores de "…", la última para todos los clientes: cambiá los que se
     actualizaron y elegí a qué clientes se aplica.'; el subtítulo dice "se aplica desde su fecha".
  3. Errores cortos debajo del campo: fecha 01/08/2026 para todos → 'Fecha repetida: "Tarifas a agosto 2026" empieza el
     mismo día.'; editar enero con "Vigente desde" 31/07/2026 → "Fecha no permitida: tiene que ser el 21/07/2026 o
     antes." y, si quedan clientes afuera, "Faltan clientes: volvé a elegir los que quedarían sin tabla."
  4. M3: editar "Tarifas a enero 2026" → "Clientes en particular" → "Los demás clientes quedan sin tabla del 01/01/2026 al
     31/07/2026: sus viajes de esas fechas no se pueden calcular."
  5. M2 y M11: corregir un valor de la tabla de prueba (con motivo) → en Auditoría, la tabla dice "Se recalculó 1 viaje."
     (con la concordancia) y el viaje que pasa a la misma tabla, 'Pasa a "…" por su corrección: $ … → $ ….'
  6. M14: a 990 px (F12), el nombre ocupa todo el ancho y "Vigente desde" y "Vigente hasta" van de a dos, sin cortar la
     fecha; las bandas y los adicionales, también de a dos.
  - D1. El paso 4b de la §35 pide Listar viajes filtrado por origen, destino o camión, y no tiene esos filtros (cambiar el
    texto del paso; los filtros, con M8).
  - D2. La deuda de un cliente con un recibo sin imputar se ve distinta en cuenta corriente (saldo negativo) y en Tableros
    (debe por comprobante). Las dos cuentas están bien (en el globito de Tableros, "Tiene $ … cobrados sin imputar";
    avisarle a Facu, son sus tablas).
  - Tarifas y Auditoría (hacerlas juntas, son chicas salvo M5): M1, aviso "Tenés cambios sin guardar" al cerrar Registrar o
    Editar tabla, como en proformas (§6.2); M2, "Se recalculó 1 viaje. 4 viajes pasaron a otra tabla con el mismo
    importe." en el registro de la tabla (`TarifarioController.cs`, `Cuentas`, que no concuerda); M3, "Los demás clientes
    quedan sin tabla del 01/01/2026 al 31/07/2026: sus viajes de esas fechas no se pueden calcular."; M5, nombres para
    personas en el filtro y las columnas Entidad y Registro de Auditoría ("Configuración de e-mail", "Viaje #52"); M11,
    'Pasa a "…" por su corrección: $ … → $ ….' cuando es la misma tabla que se corrigió; M14, los tres campos de "Datos" en
    dos filas por debajo de 992 px.
  - Tableros (chicas, solo de pantalla): M4, una línea de ayuda en Personalizar ("Arrastrá una tarjeta por el título…");
    M7, "No hubo entregas con rechazo en el período." en vez de la grilla en 0 %; M9, "Hoy · 2 con deuda vencida"; M10,
    `SGTL.confirmar` antes de Restablecer y el aviso "Dashboard restablecido."; M12, que el total del mapa de km dé con las
    celdas; M13, un degradé o una flecha en el riel de pestañas en el celular.
  - M8, "Ver los viajes" desde la celda del mapa de calor (para después: necesita los filtros nuevos de Listar viajes, D1).
  - M16, Listar viajes: "Km" en lugar de "Cantidad de KM" (§7.3).
  - De Facu (sumar a su lista del punto 5): M6, el importe mal escrito en Registrar recibo, con "Escribí el importe como
    1.234,56." debajo del campo; M15, un saldo negativo dice "Saldo a favor del cliente" y no "Saldo deudor".
- [x] **8. Pedido a Fede: avisarle al chofer por WhatsApp que se canceló su viaje (27/10).** **Hecho por Fede e integrado el
  28/10 (§58):** se avisa desde `CambiarCancelado` y, al reactivar, se le reenvía la hoja de ruta. Falta dar de alta en Meta
  `viaje_cancelado` y `viaje_desasignado`. Lo que sigue es lo anotado el 27/10. Rocío lo deja pendiente: hace
  falta dar de alta en Meta una plantilla nueva para la cancelación (hoy hay una sola, `viaje_asignado`, y Gestionar
  integración de WhatsApp guarda un solo nombre de plantilla) y administrarla desde la integración de WhatsApp. Después,
  mandarla al cancelar un viaje si el chofer ya tenía la hoja de ruta. Texto de la maqueta: "Se canceló el viaje #47 del
  28/10/2026 (Planta Córdoba Norte → Depósito Villa Carlos Paz)." Del lado de viajes se llamaría desde `CambiarCancelado`
  (`ViajesController`); no se dejó nada armado. Con esto, ver también si al volverlo a Registrado se le reenvía la hoja de
  ruta. Mientras tanto, el chofer lo ve en su hoja de ruta (en Anteriores, en rojo, "Este viaje se canceló.").
- [ ] **9. Gastos del chofer en un viaje que no se hace (Rocío, 28/10, al integrar a Fede).** Hoy un gasto lo borra solo el
  chofer y en su período (directo: En viaje y hasta 2 días después de la entrega; Rukas: desde el día del viaje hasta 2 días
  después del fin, `Viajes/GastosDelViaje.cs`); administración puede cargar, no borrar. Quedan dos huecos:
  - Un viaje directo que estuvo En viaje, tiene gastos y volvió a Registrado **no se puede eliminar** ("tiene gastos
    cargados") y **nadie puede borrar esos gastos** (al chofer le dice "el viaje todavía no se inició"). La única vuelta es
    pasarlo a En viaje, que el chofer los borre y volverlo a Registrado.
  - **Se puede cancelar con gastos**, pero quedan guardados y nadie los ve: el cancelado no muestra costo en Ver detalle ni
    cuenta en costos, y nadie puede cargarlos ni borrarlos. Si eran reales, la plata desaparece de la vista.

  Propuesta para decidir después de las pruebas: (a) que administración pueda borrar un gasto desde Ver detalle con el viaje
  Registrado, con motivo y en la auditoría, para después poder eliminarlo; (b) que un cancelado siga mostrando sus gastos en
  Ver detalle (sin margen) y que la confirmación de cancelar avise que el viaje tiene gastos del chofer. Vías según lo que
  pasó: salió y no había carga, **Sin carga** (los gastos cuentan); se marcó En viaje por error, (a); no se hace pero el
  chofer ya gastó, cancelar con (b).
- [ ] **10. Restablecer contraseña: textos y estética (Rocío, 28/10, al verlo en la prueba de la VM).** El modal
  "Restablecer contraseña" del login (`Login.html`, `assets/static/js/login-recupero.js`; módulo de Facu, §57) no le
  parece lindo: lo siente chocante y distinto del resto. Revisar con la lista de control de `AGENTS.md` y el §12 del
  design system (estilo visual), compararlo con un modal de adentro del sistema (por ejemplo, Cambiar contraseña del
  encabezado, `assets/static/js/header.js`) y proponer cómo mejorarlo. Lo que vio:
  - **El tamaño del título** del modal ("subtítulo"), que no se ve como en los demás.
  - **"Repetir contraseña nueva"** suena raro. Además no coincide con Cambiar contraseña, que dice "Repetí la contraseña
    nueva": unificar los dos con un texto que se entienda (propuesta a decidir).
  - **El botón** "Restablecer contraseña": revisar que cumpla el design system y si se puede mejorar.
  Pista para revisar primero: `Login.html` carga `css/login.css` después de `sgtl.css` y tiene estilos propios en la
  página (los de la tarjeta del login); puede que alcancen también a los dos modales del recupero ("Olvidé mi
  contraseña" y "Restablecer contraseña") y por eso no se vean como los de adentro. Revisar también los dos modales
  juntos (lo mismo en "Olvidé mi contraseña") y el ojo para ver la contraseña, que el login tiene y el modal no. Como es
  del módulo de Facu, avisarle antes de cambiarlo.
  **Del reporte de la ronda 1 (28/10, §59):** DS1, el error de cada campo del login queda dentro del recuadro y el borde
  no se pone rojo (`css/login.css`); DS3, el ojo de la contraseña sin globito; M1, con un enlace inválido o vencido,
  mostrar solo el aviso y "Solicitar otro enlace" en lugar de los campos; M3, un solo texto para la regla de la contraseña
  (hoy hay cuatro: "Usá de 8 a 20 caracteres, con letras y números.", validado en la pantalla). DS2 (los avisos de los
  dos modales sin rojo) ya se arregló el 28/10.
- [ ] **11. Precio del gasoil: dónde va y cómo se carga (Rocío, 28/10).** Hoy está en Gestionar camiones, entre los filtros
  y la tabla: "Precio del gasoil: todavía no se cargó" y el botón "Cambiar precio del gasoil", separado de Reportes y
  Registrar camión. A Rocío le parece raro el lugar (es de los camiones, pero no es un camión), muy simple, y no sabía si
  después de cargarlo se ve el precio (sí: "Precio del gasoil: $ 1.250,00 el litro desde el 28/10/2026").
  **Cómo funciona hoy** (`CostosController.cs`, `PRECIOS_GASOIL`, §37): cada carga es un precio "desde" una fecha y no
  borra ni cambia los anteriores. Cada viaje usa el que valía en su fecha de inicio (el último "desde" hasta ese día; si
  hay dos con el mismo día, el último que se cargó), y Ver detalle lo dice ("… y el gasoil a $ … el litro desde el …").
  El combustible estimado no se guarda: se calcula al abrir el detalle. Por eso:
  - un precio nuevo desde hoy o desde una fecha futura no cambia nada de los viajes anteriores;
  - un precio con fecha pasada cambia el combustible y el margen estimados de los viajes desde esa fecha (sin avisar);
  - no se puede borrar ni editar un precio mal cargado: se corrige cargando otro con la misma fecha (queda el último).
  Lo puede cargar quien tiene Gestionar camiones; queda en Auditoría. La pantalla muestra el vigente hoy y el modal, los
  últimos 10 en una lista.
  **Propuesta para decidir:**
  - **Lugar:** pasarlo a Configuración → Gestionar empresa, junto al Galpón, en un bloque "Control interno": son los dos
    datos con los que se estima el costo de cada viaje y los dos funcionan "desde una fecha". Se vería como dato fijo
    (el vigente y, si hay, el que viene) con "Cambiar precio del gasoil", y los precios cargados en una tabla (desde,
    precio por litro, quién y cuándo). Ojo: Gestionar empresa es solo de administradores; hoy lo cambia también quien
    gestiona camiones (decidir quién). Ver detalle del viaje diría dónde cargarlo ("Falta el precio del gasoil…").
  - **Fecha pasada:** avisar antes de guardar cuántos viajes cambian su costo estimado ("Cambia el combustible estimado
    de 12 viajes desde el 01/10/2026."), como al cambiar el galpón.
  - **Corregir:** "Corregir" el último precio cargado (precio o fecha, con motivo y en Auditoría) en lugar de cargar otro
    con la misma fecha.
  Va con la ronda 4 de `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md` (§37, paso 3), que por ahora lo prueba donde está.
- [ ] **12. Tableros: que se distingan las tarjetas que se comparan con el período anterior (Rocío, 28/10).** Debajo del
  período dice "Del … al … · comparado con el … al …", pero solo tres tarjetas usan esa comparación: **Viajes**
  (`kpiviajes`), **Km recorridos** (`kpikm`) e **Importe promedio por viaje** (`costo`, que compara el importe total, no
  el promedio). Las demás del período (Entregados, Pendientes de entrega, Entregados con rechazo, gráficos, mapas de calor,
  facturación) muestran solo el período elegido y se ven iguales, así que no se sabe cuáles comparan. La tabla
  "Comparativa por mes / por semana" tampoco es esta comparación: cada fila va contra el mes o la semana anterior.
  Cómo se arma el período anterior: `calcularPeriodo` en `assets/static/js/dashboard.js` (rango a mano, los mismos días
  justo antes; botones, el mismo rango corrido esos meses y cortado en el mismo día que hoy).
  Hay que decidir con Rocío cómo se marcan (no está en el design system): por ejemplo, una etiqueta en el título como la de
  "Hoy" (`alcance` en `tableros-catalogo.js`) o que el texto del período diga cuáles se comparan. Vale en el dashboard y
  en Tableros; si es un patrón nuevo, sumarlo al §13 de `docs/design-system/03-decisiones.md`.
- [ ] **13. `VIAJES.ChofCamID`: columna sin uso (Rocío, 28/10, al mirar el viaje 53 en la base).** Es la columna 9 de
  `VIAJES`, entre `Fecha_Fin` y `TarifaFijaID`: del diseño original, cuando el viaje apuntaba a una fila de
  `CHOFER_CAMION`. Después se agregaron `ChoferID` y `CamionID` (columnas 17 y 18), que son las que usa el viaje.
  `ChofCamID` no está en el EDMX y nada del repo la lee ni la escribe, así que siempre queda en NULL y confunde al mirar la
  tabla. La tabla `CHOFER_CAMION` es el camino muerto del MAE-01 (`docs/design-system/04-relevamiento-funcional.md`):
  ninguna pantalla la carga; solo se lee en el detalle de Listar choferes y Listar camiones.
  **Para revisar después del 29/10:**
  1. Consultas de solo lectura: cuántos viajes tienen `ChofCamID` con dato (si hay, de cuándo son) y si tiene una
     restricción (clave foránea hacia `CHOFER_CAMION`, índice o valor por defecto) que haya que quitar antes.
  2. Si no se usa, un script idempotente en `database/viajes/` que borre la columna (primero la restricción), con
     `@Aplicar = 0 / 1` como los demás. Sin regenerar el EDMX (no la tiene).
  3. Decidir aparte qué hacer con `CHOFER_CAMION` (MAE-01): darle una pantalla o sacarla del detalle de los listados.
     La tesis la dibuja en el diagrama de datos (`docs/tesis/04-arquitectura-y-diseno.md`).

---

## 41. Listado de Rocío del 26/10: tarifas, antes del jueves 29/10 y para después — ANOTADO (26/10)

El jueves 29/10 no es la defensa: es la reunión con el profe para que vea el sistema (si está todo OK, puede servir
como presentación). Los números son los del listado de Rocío.

### Tarifas (se ven con la ronda de tarifas y la tabla dinámica)
- [ ] **1. Vuelta vacío en la tarifa por km.** Ya no existe: era de las tarifas de prueba de antes (ruta + vuelta vacío,
  §31). En la tabla nueva la tarifa por km es km de ida × precio por km (la "larga distancia" del PDF). **Preguntarle a
  Claudia** si ese precio ya contempla la vuelta; si no, la tabla dinámica puede tener "cobrar la vuelta vacía" por tabla.
  **28/10 (recorrida de Rukas y audios de Claudia):** en Rukas la vuelta vacía es un **adicional aparte**, un porcentaje
  del flete (10 % a 70 %), que normalmente ya viene cargado y Claudia puede corregir. Para los directos, ver el punto 11.
- [x] **2. Tarjeta "Cambios de tarifa para revisar".** Hecho con la §43 (27/10): se llama "Cambios para revisar", aparece
  solo si hay algo y a quien lo puede resolver; subido, pendiente de probar en la VM (§43, paso 6). Era: hoy está siempre en el dashboard (vacía dice "No hay nada para
  revisar por cambios de tarifa.") y ya se muestra según los permisos. Pedido: que aparezca solo cuando hay algo para
  revisar, y solo a quien tiene una acción para hacer (los administradores, sí).
- [x] **3. 1ª y 2ª vuelta automáticas.** Hecho como se decidió en la §43 (27/10): por cliente y recorrido, con camión y
  chofer ocupados; subido, pendiente de probar en la VM. Era: hoy el sistema propone la 2ª si el camión ya tiene un viaje antes ese día, pero se
  puede cambiar a mano; y **no hay ningún control de que un camión (o un chofer) no tenga dos viajes al mismo tiempo**.
  Pedido: la vuelta sale sola y no se edita (se ve como texto, con el viaje anterior del camión); el mismo camión en
  viajes que se superponen da error al elegirlo y al guardar. Casos borde a decidir: editar la hora o el camión de un
  viaje cambia la vuelta de otro (recalcularlo si el cliente no lo vio, como con un cambio de tabla); eliminar el primero
  del día pasa el segundo a 1ª; un viaje sin carga (punto 10) ¿cuenta como vuelta?; el 3º del día ¿cobra como 2ª?; un
  primer viaje de más de 130 km y uno corto después ¿el corto es 2ª?; viajes que cruzan la medianoche; viajes sin hora
  de fin (usar la duración de Google, punto 36); presupuestos sin camión o sin fecha.
- [ ] **9. Importar la tabla desde el Excel del PDF de tarifas.** Se puede (ya se lee el Excel de Rukas): se completa la
  grilla, la persona la revisa y guarda con las mismas validaciones. Falta el Excel real de la empresa para ver su
  formato. El aviso de valores que no suben ya existe ("Revisá estos valores": la 2ª vuelta más cara que la 1ª o una
  banda más barata que la anterior), y no impide guardar (decisión del 25/10).
- [x] **10. Falso flete → "Sin carga".** Hecho (27/10), subido, pendiente de probar en la VM (pasos abajo). Antes se podía
  marcar en cualquier estado antes de facturar, desde Gestionar viajes; el importe
  pasa a ser el 60 % de la tarifa (no se suma: la reemplaza), aunque el detalle se lee como un adicional. Pedido de
  Rocío: se sabe recién cuando el camión llega al origen y no hay carga, así que se marca solo con el viaje En viaje, lo
  puede marcar el chofer desde su hoja de ruta (con una observación) o un operador, el viaje se cierra con un estado
  final (sin remito) y para volver a ir se registra otro viaje. Cambiar la palabra "falso flete" (propuesta de Claude:
  estado "Sin carga", acción "Registrar sin carga", importe "Viaje sin carga (60 % de la tarifa)"). A decidir: si se
  factura como un viaje entregado (Traer viajes de proformas es de Facu: avisarle), qué pasa con los clientes con
  plataforma (¿Rukas lo paga?), los gastos del chofer y el recorrido completo (galpón → origen → galpón).
  **Cómo quedó (Rocío, 27/10: "no quiero usar la palabra falso flete"):** estado **"Sin carga"** (azul, como Entregado),
  desde En viaje (con plataforma, que no pasa por En viaje, desde Registrado), fuera de una proforma; vuelve al de antes
  si fue un error. Lo marca el chofer ("Registrar sin carga" en su hoja de ruta, con observación opcional) o administración
  (Cambiar estado, con la fecha y la observación). Se cobra el porcentaje de la tabla (la columna `Falso_Flete` de
  siempre) y el detalle dice "sin carga (60 %)"; la casilla del formulario ya no está. Traer viajes lo trae como un
  entregado, con "Sin carga" en la línea. Gastos del chofer, como en un entregado (hasta 2 días). Recorrido y kilometraje:
  galpón → origen → galpón. En la tabla de tarifas, "Viaje sin carga". Para volver a ir, otro viaje. Para Claudia:
  ¿Rukas lo paga? (lo que se cobra lo decide su Excel). `tests/viajes-flujo.test.js`. Cómo probarlo:
  1. **Antes de recompilar**, correr `database/viajes/03_viaje_sin_carga.sql` (primero con `@Aplicar = 0`: además de las
     restricciones, lista los viajes viejos con falso flete marcado en otro estado, para revisarlos; después `@Aplicar = 1`).
  2. Gestionar viajes, un viaje En viaje con tabla → banderita → tarjeta **Sin carga** (azul): "Se cobra el 60 % de la
     tarifa: $ …", la fecha (hoy) y la observación. Guardar: "Viaje #N sin carga. Se cobra $ … (60 % de la tarifa).", la
     fila en azul con el globito (lo que se cobra y la observación) y Ver detalle con el resultado "Sin carga".
  3. Banderita del mismo viaje → "En viaje": "Viaje #N vuelve a en viaje. Se cobra $ …" (completo).
  4. Hoja de ruta del chofer, un viaje En viaje: "Registrar sin carga" debajo de "Registrar entrega"; confirmar con una
     observación: "Viaje #N sin carga.", la etiqueta azul, "Recorrido completo … galpón → origen → galpón" y Cargar gasto.
  5. Registrar proforma → Traer viajes: el sin carga viene, con "- Sin carga" en la descripción y el 60 %.
  6. Editar un viaje: no está la casilla "Falso flete". Gestionar tarifas: el campo se llama "Viaje sin carga".
  7. Facturar una proforma con un viaje sin carga y emitir la nota de crédito de esa factura: el viaje vuelve a **Sin
     carga** (los demás, a Entregado o Listo para facturar, como siempre).
  - [ ] **Avisarle a Facu (Rocío):** el cambio de la nota de crédito está en su módulo (`ComprobantesController`, la nota
    de crédito cancelatoria de la factura de una proforma): un viaje con `Falso_Flete` y sin resultado de entrega vuelve
    a `Sin_carga` en lugar de `Entregado`. Lo hizo Claude el 27/10 a pedido de Rocío.
  - **28/10: solo en los clientes directos (Rocío, con la respuesta de Claudia).** En Rukas nunca pasó; si pasara, el
    valor se acuerda con ellos en la proforma. Con plataforma queda **pendiente**: para tener Sin carga, esos viajes
    tendrían que pasar por En viaje (y después por Entregado), y eso es definir de nuevo su flujo. Cambiar estado ya no
    ofrece Sin carga en un viaje con plataforma y la API lo rechaza ("No se puede marcar sin carga: lo sigue la plataforma
    del cliente."); uno que ya estaba sin carga puede volver a Registrado. La hoja de ruta del chofer ya no lo ofrecía con
    plataforma. Se sigue cobrando el porcentaje de la tabla de tarifas, que es obligatorio en cada tabla. La vuelta vacía
    queda como adicional aparte (§60). Subido, pendiente de probar en la VM: en Gestionar viajes, Cambiar estado de un
    viaje con plataforma Registrado ofrece Listo para facturar y Cancelado, sin Sin carga; el de un directo En viaje,
    Registrado, Entregado y Sin carga.
- [ ] **11. Los demás adicionales (estadía).** Hoy la estadía se carga a mano en módulos y se suma al importe. Los datos de
  la tabla "desde cuántas horas" (viajes cortos y largos) y "horas por módulo" se guardan pero **ningún cálculo los usa**.
  Propuesta: el chofer registra en su hoja de ruta la llegada y la salida del destino, y los módulos salen solos con esos
  datos de la tabla (el operador los puede corregir).
  **28/10, recorrida de Rukas (solo lectura) y audios de Claudia** (detalle en `docs/negocio/RELEVAMIENTO-RUKAS-CLAUDIA.md`,
  paso 12): para QUICKFOOD los adicionales se cargan en Rukas (Cierre Reparto), Marfrig los aprueba y llegan en el Excel de
  la proforma; Claudia agrega o corrige los que faltan. La lista es la misma tarifa de nuestra tabla: esperas por franja de
  horas (1 a 16 módulos de $ 96.577, un módulo cada 6 hs), descarga (1 módulo), descarga + espera y repaletizado (2),
  repaletizado + estadía (3), todos fijos × cantidad, y vuelta vacía del 10 % al 70 % del flete. Para los directos,
  Claudia trabaja igual y usa Rukas como parámetro.
  - **QUICKFOOD: no hace falta nada nuevo.** SGTL ya toma los adicionales del Excel tal como vienen, sin compararlos, en
    una línea aparte de la proforma, y en un viaje con plataforma no deja cargar la estadía (así no se cobra dos veces).
    Mejora posible: mostrar en Ver detalle del viaje el adicional que vino de Rukas.
  - **Directos: propuesta para después del 29/10.** Reemplazar la "estadía en módulos" por **adicionales del viaje como en
    Rukas**: la tabla de tarifas tiene la lista (nombre, fijo o porcentaje, valor; por defecto la de arriba, en módulos de
    estadía), y en el viaje se agregan uno o varios (adicional, cantidad, comentario) que se suman al importe, se ven en
    Ver detalle y van a la proforma en una línea aparte, como los de Rukas. La espera puede salir sola con las horas del
    chofer (la propuesta de arriba). Se junta con la tabla dinámica (§42).
  - **Respuestas de Rocío (28/10):** a los directos se les cobran los mismos adicionales con los mismos valores, así que la
    lista de la tabla puede ser la de Rukas tal cual; el porcentaje de la vuelta vacía lo elige administración en cada
    viaje, tomando como referencia cómo lo pone Rukas.
  - **Falso flete en Rukas: no aparece en ningún lado** de lo que ve Transporte Sánchez (Cierre Reparto, adicionales, Control
    Tráfico, Control Proformas, sobres, tickets; recorrida del 28/10). Lo más probable es que con QUICKFOOD no pase, porque
    programa los viajes con la carga asegurada. Preguntarle a Claudia si pasó alguna vez y cómo se pagó; según eso, ver si
    en SGTL "Sin carga" sigue disponible para los viajes con plataforma. **Respuesta de Claudia (28/10):** nunca pasó; si
    pasara, el valor se acuerda con Rukas en la proforma. Sin carga queda solo para los directos (punto 10, nota del 28/10).
  - **Directos, versión reducida hecha el 28/10 (§60)** para mostrarla el 29/10 (pedido de Rocío): la lista de Rukas fija
    en el código, cargada a mano en el viaje y sumada a su importe. Lo demás de la propuesta (la lista en la tabla de
    tarifas, la línea aparte en la proforma y la espera con las horas del chofer) sigue para después.
  - **Estadía, respuesta de Claudia (anotado el 28/10; detalle en el relevamiento, paso 12):** para QUICKFOOD la tarifa
    incluye 12 hs (18 hs si son más de 250 km) **desde la citación** (si llega antes, la citación; si llega tarde, la
    llegada) y después se paga un módulo cada 6 hs. Con los directos casi nunca se cobra (viajes en el día; a veces algo
    "de onda"), y el dueño la cuenta desde que llega a descargar. **Conclusión: no automatizarla por ahora**; en los
    directos sigue a mano (§60). Para calcularla sola más adelante faltan la hora de llegada al origen y la de fin de la
    descarga (hoy la entrega guarda solo el día): las podría registrar el chofer en la hoja de ruta y el sistema
    proponer la espera para que administración la confirme.
    - [ ] **Preguntarle a Claudia:** hasta cuándo corre (¿fin de la descarga, remito conformado?); si la citación es la hora
      de carga en el origen; y si las franjas de la espera de Rukas son las horas que pasan de las 12 o 18 incluidas (con
      el catálogo, 8 hs de más son "Espera entre 6 y 12 hs", 2 módulos, y menos de 1 h no se cobra).
    - [ ] **Textos (después, Rocío 28/10):** la ayuda del bloque Adicionales de Gestionar viajes ("La espera corre después de
      12 hs de iniciado el servicio…") y la del campo en Gestionar tarifas ("De iniciado el servicio, hasta…") dicen "de
      iniciado el servicio"; lo correcto es "desde la citación".
- [x] **12 y 13. Textos de para quién es la tabla.** Hechos (27/10), subidos, pendientes de probar en la VM (§40, punto
  7, paso 2). "Solo algunos clientes" → "Clientes en particular". En lugar de
  "Vale…" y "Para estos clientes, esta tabla reemplaza a la de todos los clientes.", propuesta: "Se aplica a todos los
  clientes, también a los que se carguen después, salvo los que tienen una tabla propia." y "Se aplica solo a los
  clientes que elijas, en lugar de la tabla para todos los clientes."
- [x] **14. Registrar tabla.** Hecho (27/10), subido, pendiente de probar en la VM (§40, punto 7, paso 2). En lugar de "Viene con los valores de…", propuesta: 'Precargada con los valores de
  "Tarifas a agosto 2026": cambiá los que se actualizaron y elegí a qué clientes se aplica.'

### Antes del jueves 29/10 (pedido de Rocío)
- [ ] **21 y 34. Datos como reales para el profe.** Limpiar todo lo que esté mal, sin sentido o con datos al azar (se suma
  a la §40, punto 6, y al cliente "distribuidora-powerful S.A." de la §38) y dejar cerrados los viajes pasados.
  **Viajes superpuestos — corregir antes del jueves 29/10 (Rocío, 28/10).** Cargados antes del control de camión y chofer
  ocupados (§43): el mismo camión o el mismo chofer en horarios que se pisan, y al editarlos la pantalla da "Camión
  ocupado" o "Chofer ocupado". El #40 ya se corrigió (otro camión, 28/10). Lo que se propuso con el detalle de cada viaje
  (la mayoría son datos de prueba repartidos al azar: el camión ERS783 el mismo día en Córdoba y en Quilmes):

  | Par | Qué hacer | Dónde |
  |---|---|---|
  | #11 con #46 (camión ERS783) y #12 (chofer Montenegro) | El fin del #11 (Sede Quilmes → Sede Banfield, del 06/10 12:00 al 10/10 12:00) está mal: pasa a 06/10/2026 16:00 (o el horario real) | SQL de abajo (es Listo para facturar: la pantalla no deja cambiar fechas) |
  | #11 con #45 | Al #45 (Alimentos La Serena, Registrado, 06/10 de 07:00 a 15:00) otro camión libre | Editar viaje |
  | #36 y #47 (chofer Juárez, 20/10) | Al #36 (distribuidora-powerful) otro chofer | Editar viaje |
  | #41 y #51 (camión ERS783, 23/10) | Al #41 (Distribuidora del Sur) otro camión; el #51 viene del presupuesto #11 y no se toca | Editar viaje |
  | #33 y #35 (camión ABC123, 26/10) | Al #35 (QUICKFOOD) otro camión; el #33 viene del presupuesto #3 y está En viaje | Editar viaje |
  | #37 y #42 (chofer Godoy, 27/10) | Al #37 (QUICKFOOD) otro chofer; el #42 viene del presupuesto #9 | Editar viaje |
  | #5 y #6 (julio, cerrados) | Nada: el #5 es de distribuidora-powerful y se va con su limpieza (§38) | — |

  Al cambiar el camión, el importe puede cambiar (la tarifa depende del tipo y el modelo). Si alguno no se hizo, en vez de
  cambiarle el camión o el chofer se cancela con motivo (un cancelado no cuenta como ocupado). SQL del #11 (no cambia el
  importe; no queda en Auditoría):
  ```sql
  BEGIN TRAN;
  UPDATE dbo.VIAJES
  SET Fecha_Fin = '2026-10-06T16:00:00', Usu_Modi = N'RNUVOLI', Fecha_Modi = GETDATE()
  WHERE Viaje_ID = 11 AND Fecha_Fin = '2026-10-10T12:00:00';
  SELECT @@ROWCOUNT AS Filas;   -- tiene que dar 1
  SELECT Viaje_ID, Fecha_Inicio, Fecha_Fin, Estado FROM dbo.VIAJES WHERE Viaje_ID = 11;
  -- COMMIT; o ROLLBACK;
  ```
  Al terminar, `database/verificacion/02_viajes_superpuestos.sql` (solo lectura) tiene que dar solo el par #5 y #6. Va con
  el resto de esta limpieza: choferes con nombres del equipo (Montenegro Federico, Godoy Facundo y dos Pai), el cliente
  distribuidora-powerful, Distribuidora del Sur con plataforma (punto 16) y los viajes con fecha pasada que siguen
  Registrados o En viaje.
  **Paso a paso (28/10):** `docs/equipo/INSTRUCTIVO-LIMPIEZA-VIAJES.md`, con la consulta de solo lectura
  `database/limpieza/05_relevar_viajes_para_la_demo.sql` (viajes pasados sin cerrar, chofer o camión que no corresponde,
  viajes sin importe, clientes con plataforma, clientes, choferes, camiones con lo que les falta y el precio del gasoil;
  incluye el punto 37). Se hace después de la prueba de viajes en la VM y sin el token de WhatsApp del día.
- [ ] **16. Distribuidora del Sur S.A. figura con plataforma (Rukas).** Solo QUICKFOOD tiene que tenerla. Ver qué viajes
  tiene y si conviene pasarlos a otro cliente o a QUICKFOOD; después, sacar el cliente o dejarlo como cliente común.
- [ ] **22. Toda la lógica del flujo de viajes, en todos los escenarios:** cambios de estado, edición y el proceso completo
  hacia adelante y hacia atrás, sin huecos (el profe suele probar casos borde). Las dudas, con Rocío. Incluye los puntos
  3, 10 y 33.
  **Revisado (27/10):** `docs/diseno/viajes-diseno.md` con el flujo como está hoy y los huecos. Para corregir (A–C): la
  fecha de entrega puede ser futura; eliminar un viaje con gastos da un error técnico; la evidencia se puede adjuntar en
  Registrado. Para decidir con Rocío (D–G): si el Rechazo o la entrega Parcial se cobran completos; qué pasa con un viaje
  de un presupuesto aceptado que se cancela (hoy queda colgado); cambiar camión o chofer con el viaje en curso; si
  administración puede iniciar un viaje de otro día sin aviso. **Decididos y hechos los cuatro (27/10), abajo.**
  **A–C corregidos (27/10), subidos, pendientes de probar en la VM** (`tests/viajes-flujo.test.js`). Cómo probarlo:
  recompilar. "Estado y entrega" de un viaje En viaje → Entregado: el calendario no deja elegir días futuros y, escrita
  a mano, "No puede ser posterior a hoy." debajo de la fecha. Un viaje que estuvo En viaje con un gasto del chofer y se
  volvió a Registrado: Eliminar gris con "No se puede eliminar el viaje: tiene gastos cargados". La evidencia de un
  directo no se adjunta en Registrado (la API lo rechaza); en uno de Rukas, desde el día del viaje.
  **E, estado Cancelado (27/10), subido, pendiente de probar en la VM** (decisiones de Rocío y maqueta
  `.claude/maquetas/viajes/cancelado.html`; `tests/viajes-flujo.test.js`). Un viaje que no se hizo pasa a Cancelado desde
  Registrado, con motivo, en lugar de eliminarse: queda en el listado en rojo y deja de contar en camión y chofer ocupados,
  el orden del día, las proformas (también el Excel de Rukas), los costos, el tablero y la hoja de ruta. Vuelve a
  Registrado. El presupuesto del que salió sigue Aceptado (amarillo, con el ícono que dice qué viaje se canceló) y vuelve a
  dejar "Generar viaje". El aviso por WhatsApp al chofer queda pendiente (necesita una plantilla nueva en Meta: §40, punto
  8); "Sin carga" queda para el punto 10.
  Cómo probarlo:
  1. **Antes de recompilar**, correr `database/viajes/02_viaje_cancelado.sql` en SSMS (primero con `@Aplicar = 0`: si
     dice "NO admite Cancelado" en alguna restricción, pasarle el resultado a Claude; después con `@Aplicar = 1`).
  2. Gestionar viajes, un viaje Registrado → banderita → tarjeta **Cancelado** (roja). Sin motivo: "Completá el motivo."
     debajo. Si hay otro viaje ese día del mismo cliente y recorrido, la tarjeta dice qué pasa con su precio. Guardar: el
     aviso "Viaje #N cancelado." (y lo que cambió en el otro), la fila en rojo con el globito "Cancelado el … por …: …",
     Editar y Eliminar grises con "No se puede … el viaje: está cancelado".
  3. Registrar otro viaje con el mismo camión en ese horario: ya no dice "Camión ocupado". Volver el cancelado a Registrado:
     "No se puede reactivar el viaje. Camión ocupado: …". Eliminar el otro y reactivarlo: "Viaje #N reactivado.".
  4. Filtro de estado "Cancelado" en Gestionar y Listar viajes. Ver detalle: el bloque Cancelación (motivo, cuándo y quién),
     sin costo ni margen. La hoja de ruta del chofer: en Anteriores, con la etiqueta roja y "Este viaje se canceló.".
  5. Un viaje En viaje: la banderita no ofrece Cancelado. Uno en un borrador de proforma: la tarjeta gris con el motivo.
  6. Generar un viaje desde un presupuesto aceptado y cancelarlo: en Presupuestos, Aceptado en amarillo con el ícono
     "El viaje #N que se generó con este presupuesto está cancelado: …" y "Generar viaje" habilitado; generarlo de nuevo.
     El cancelado sigue diciendo "Del presupuesto #…" y ya no se puede reactivar ("el presupuesto #… ya generó el viaje #…").
  7. Registrar proforma → Traer viajes: el cancelado no aparece. Rukas: si el Excel trae el N° de un cancelado, la línea
     va a "Para revisar" como "Viaje cancelado".
  **D, F y G (27/10), subidos, pendientes de probar en la VM** (decisiones de Rocío; `tests/viajes-flujo.test.js`). D: la
  entrega parcial o con rechazo se cobra completa, pero se ve. F: en viaje se cambian el camión y el chofer, con motivo y
  sin cambiar el precio. G: administración no inicia un viaje de un día futuro (uno atrasado sí). Cómo probarlo
  (recompilar):
  1. **D:** Registrar proforma de un cliente directo con un viaje entregado Parcial y otro con Rechazo → Traer viajes:
     "Los viajes #… (entrega parcial) y #… (con rechazo) se cobran completos. Si acordaste otra cosa con el cliente, cambiá
     el precio o el descuento de su línea." y, en cada línea, la etiqueta "Parcial" o "Con rechazo" (también al volver a
     abrir el borrador). Con Rukas no avisa nada.
  2. **F:** "Completar el viaje" de uno En viaje: las fechas como texto, el camión y el chofer como campos. Cambiar el
     camión: aparece "Motivo del cambio *" (sin completar, "Completá el motivo."); uno ocupado en ese horario, el error
     debajo. Cambiar el chofer: "Al guardar, … recibe la hoja de ruta por WhatsApp.". Guardar: el importe es el mismo, en
     Auditoría queda la modificación con el motivo y el viaje está en la hoja de ruta del chofer nuevo (y no en la del
     anterior). En Entregado no se pueden cambiar.
  3. **G:** un viaje Registrado de mañana → banderita: "En viaje" gris con "No se puede iniciar el viaje: es del …". Uno de
     ayer se inicia. Uno de Rukas de mañana: "Listo para facturar" gris con "No se puede marcar: el viaje es del …".
  - [ ] **Preguntarle a Claudia** cómo manejan hoy las entregas con rechazo y las parciales: si se cobran completas, con
    otro porcentaje o según el caso. Si hace falta, más adelante se automatiza una tarifa para esos casos (se junta con el
    punto 10, "Sin carga"); por ahora no se agrega nada.
- [ ] **23. Dashboard con muchos tableros:** analizar ofrecer, si la persona quiere, dividirlos por tema como en Tableros
  (todo junto o por pestañas).
- [ ] **26. Orden de los módulos en el menú,** el que Rocío charló con Facu (el menú está en `sidebar-loader.js`, §3.1 del
  design system y `permisos-menu.js`).

### Hoja de ruta, choferes y usuarios
- [x] **4.** "Hojas de ruta", en plural (puede haber varias). Que la vea solo el chofer asignado o un administrador.
  **Hecho (27/10), subido, pendiente de probar en la VM** (decisión de Rocío: los administradores y quien tiene Gestionar
  viajes, en solo lectura, con un buscador de chofer; `tests/viajes-flujo.test.js`). "Hojas de ruta" en el menú, el título
  y el texto del permiso (en la base el permiso sigue siendo "Hoja de ruta": los grupos no cambian). El chofer ve la suya
  como siempre y no puede pedir la de otro (la API responde que no tiene permiso). Cómo probarlo (recompilar):
  1. Entrar como administrador (sin chofer asignado): "Hojas de ruta" en el menú; la pantalla pide "Elegí un chofer para
     ver su hoja de ruta." con el buscador "Chofer". Elegir uno: sus viajes, con "Los viajes de …, para ver: los cambios
     se hacen en Gestionar viajes." y sin botones (ni Iniciar, ni Registrar entrega, ni Cargar gasto). Ver evidencia y los
     gastos se abren, sin Eliminar.
  2. Lo mismo con un usuario que no es administrador y tiene Gestionar viajes (y el permiso de Hojas de ruta).
  3. Abrir `hoja-de-ruta.html?viaje=N` como administrador: la del chofer de ese viaje, con el viaje marcado.
  4. Entrar como chofer: no ve el buscador, ve la suya con sus botones, como antes.
- [ ] **29.** Ver si "camiones asignados" en choferes funciona y para qué se usa.
- [x] **30 y 31.** Cómo se crea el usuario de un chofer: todo chofer necesita usuario para sus viajes; ver si se carga
  junto con el chofer o desde dónde conviene. Un chofer inactivo no puede iniciar sesión. Sacar de Gestionar usuarios la
  opción "¿es chofer?": alcanza con el grupo Choferes (si hace falta saber qué chofer es, buscar una forma mejor).
  **Rol Chofer (27/10), subido, pendiente de probar en la VM** (decisión de Rocío, opción A; `tests/hoja-de-ruta.test.js`).
  Los roles son Administrador (ve todo), Usuario (las pantallas de sus grupos) y Chofer (solo Hojas de ruta, con los
  viajes de su chofer, sin grupos), en castellano en pantalla (en la base siguen admin, user y chofer). Con el rol Chofer,
  Gestionar usuarios pide el chofer (obligatorio) y no pide grupos; ya no existe "No es chofer". Solo el rol Chofer tiene
  chofer (la API lo controla) y un chofer inactivo no inicia sesión ("No se puede iniciar sesión: el chofer de este
  usuario está inactivo. Hablá con administración."). **El usuario con el chofer (28/10), subido, pendiente de probar en la
  VM** (decisión de Rocío: obligatorio al registrar, lo crea quien gestiona choferes, al eliminar el chofer su usuario queda
  inactivo). Registrar chofer tiene el bloque "Acceso al sistema" (nombre de usuario y contraseña, obligatorios): el chofer
  y su usuario (rol Chofer, vinculado) se guardan en la misma transacción. El nombre se propone solo (inicial y apellido,
  sin tildes; si existe, con un número). En Editar chofer, si ya tiene usuario se ve como dato fijo; si no, se le puede
  crear. Ver detalle del chofer muestra su usuario. **El e-mail del chofer es el de su usuario (28/10, al integrar la
  rama de Facu)**: desde esa integración todo usuario tiene e-mail, que es con el que recupera la contraseña desde el
  login. Al crearle el usuario, el e-mail del chofer es obligatorio ("Completá el e-mail."), tiene que ser válido y no
  puede ser el de otro usuario ("Ese e-mail ya está registrado en otro usuario."), y se copia al usuario (Auditoría:
  "…, Email: ninguno -> …"). Al editar un chofer que ya tiene usuario, el e-mail sigue siendo opcional y no se copia.
  Cómo probarlo:
  1. Recompilar y correr `database/hoja-de-ruta/02_rol_chofer.sql` (diagnóstico; después el bloque de cambios y COMMIT):
     las cuentas de choferes (rol user con chofer) pasan al rol Chofer, sin grupos.
  2. Gestionar usuarios → Registrar usuario: el rol dice Administrador, Usuario y Chofer. Usuario pide grupos; Chofer
     pide "Chofer *" (sin elegirlo, "Seleccioná el chofer."); Administrador, ninguno de los dos.
  3. Entrar con la cuenta del chofer: directo a Hojas de ruta, con sus viajes. Con esa sesión abierta, inactivar su chofer
     en Gestionar choferes (desde otra ventana, como admin) y tocar "Hoy y próximos": el aviso "Tu chofer quedó inactivo,
     así que se cerró tu sesión. Es necesario que hables con administración." y, a los segundos, el login. Volver a
     entrar: el mensaje de chofer inactivo. Activarlo de nuevo.
  4. Listar usuarios → Ver detalle del chofer: Rol "Chofer" y "Es chofer: ve solo Hojas de ruta, con los viajes de su
     chofer.".
  5. Editar el chofer y pasarlo a Usuario con un grupo: se le quita el chofer (Auditoría: "ChoferID: … -> ninguno").
  5b. **Grupos y permisos → Usuarios por grupo (28/10, al integrar la rama de Facu):** un usuario con rol Chofer no
     aparece entre los disponibles ni entra con "Agregar todos", y la API lo rechaza ("No se puede agregar un chofer al
     grupo: con su rol ve solo Hojas de ruta."). Si quedó en un grupo de antes del rol Chofer, se ve entre los asignados y
     se puede quitar. Probar: elegir un grupo, buscar al chofer entre los disponibles (no está) y, desde la consola, mandar
     el `POST` de `Usuarios/Cambios` con su ID: el mensaje de arriba, sin guardar nada.
  6. Gestionar choferes → Registrar chofer: al completar nombre y apellido se propone el usuario (por ejemplo "rjuarez";
     si existe, "rjuarez2"). Sin contraseña: "Completá la contraseña." debajo; con una corta: "Tiene que tener de 8 a 20
     caracteres, con letras y números.". Con un usuario que ya existe: "Ya existe un usuario con ese nombre.". El e-mail
     tiene asterisco: sin él, "Completá el e-mail."; con el de otro usuario (mirarlo en Listar usuarios → Ver detalle),
     "Ese e-mail ya está registrado en otro usuario." debajo del campo. Guardar: "Chofer registrado con el usuario …";
     en Listar usuarios → Ver detalle, el usuario nuevo tiene ese e-mail. Entrar con él: directo a Hojas de ruta.
  7. Editar un chofer de antes, sin usuario: "Todavía no tiene usuario… También hace falta su e-mail…" con los dos
     campos (si se dejan vacíos, guarda igual aunque no tenga e-mail). Completarlos sin e-mail: "Completá el e-mail.".
     Con e-mail: "Chofer guardado. Se creó el usuario …". Editar uno con usuario: "Usuario … Activo" como dato fijo.
  8. Listar choferes → Ver detalle: "Acceso al sistema" con el usuario y su estado ("Todavía no tiene usuario." si no
     tiene). Inactivar y eliminar un chofer de prueba con usuario: en Gestionar usuarios, su usuario queda Inactivo.
- [ ] **32.** El chofer marca la entrega y sube el remito en nuestro sistema aunque el viaje sea de Rukas: ver si trae un
  riesgo (lo que manda es Rukas, que lo maneja un administrador). Poner un tope de días para cargar gastos en un viaje
  cerrado.
- [x] **33.** El chofer no puede iniciar un viaje sin fecha: el botón deshabilitado con un globito que diga que se
  comunique con administración para corregir la fecha y la hora. Tampoco puede cargar gastos en un viaje que todavía no
  arrancó (confirmar qué pasa En viaje). Buscar otros casos así.
  **Hecho (27/10), subido, pendiente de probar en la VM**, con lo que decidió Rocío ese día:
  - **Iniciar:** solo el día de la fecha de inicio (ni antes ni después). Si no, el botón queda gris con el motivo
    debajo: "No se puede iniciar el viaje: es del 30/10/2026. Si sale hoy, es necesario que administración corrija la
    fecha y la hora." ("era del …" si es de un día anterior). La API lo controla igual.
  - **Gastos del chofer:** desde que inicia el viaje (En viaje) y hasta **2 días después de registrar la entrega**; en
    Registrado no. Los de plataforma (Rukas), que no se inician en el sistema: desde el día del viaje hasta 2 días
    después del fin. Pasado el tope, "Cargar gasto" queda gris: "No se puede cargar el gasto: pasaron más de 2 días de
    la entrega. Si te falta rendir algo, es necesario que se lo pases a administración." Eliminar un gasto, igual.
  - **Administración** (quien gestiona viajes): "Cargar gasto" en Ver detalle del viaje → "Recorrido completo y costo",
    con el viaje Entregado o Listo para facturar (lo que el chofer no llegó a rendir); en los demás estados, gris con el
    motivo. Los gastos no van a la factura: solo cambian el margen. La regla está en un solo lugar de la API
    (`Viajes/GastosDelViaje.cs`).
  - **Cómo probarlo en la VM:** recompilar. Como chofer: un viaje de hoy se inicia; uno de mañana o de ayer sin iniciar
    muestra el motivo y no deja. Uno En viaje: "Cargar gasto" anda. Uno entregado hace 1 o 2 días: anda; hace 3 o más:
    gris con el motivo (también Eliminar en la lista de gastos). Como admin: Ver detalle de un viaje entregado →
    "Cargar gasto" → cargar uno con su ticket → toast, el detalle se vuelve a abrir con el gasto; en uno En viaje o
    Facturado, el botón gris con el motivo. Auditoría: el gasto con el usuario que lo cargó.
- [x] **35.** El recorrido completo empieza siempre en el galpón, no en la ubicación actual: el viaje se inicia en el
  galpón. **Hecho (27/10), subido, pendiente de probar en la VM:** en la hoja de ruta, "Abrir en Google Maps" de un viaje
  sin salir arranca en el galpón aunque el chofer esté en otro lado; en viaje sigue desde donde está, con lo que le
  falta. Cómo probarlo: entrar como chofer, abrir un viaje Registrado → "Abrir en Google Maps": el punto de partida es el
  galpón y después el origen, el destino y la vuelta al galpón; en uno En viaje, desde la ubicación actual al destino y
  al galpón.

### Viajes, camiones y control interno
- [ ] **8. Número de remito.** El formato "0001-00045108" es el de los comprobantes argentinos (punto de venta - número);
  lo puso Claude como ejemplo (`gestion-viajes.html`, sin validación, hasta 20 caracteres). Ver con Claudia cómo vienen
  los remitos (4 o 5 dígitos de punto de venta, con letra) y sumar una máscara que complete los ceros.
- [x] **28.** Cambiar la dirección del galpón afecta solo a los viajes que todavía no salieron o que se carguen después; o
  preguntar a cuáles aplicarlo (los registrados que no salieron, o solo los nuevos).
  **Hecho (27/10), subido, pendiente de probar en la VM**, con la maqueta `.claude/maquetas/galpon/cambiar-galpon.html`
  (variante A, elegida por Rocío): cada viaje sale de un galpón. En Gestionar empresa → Galpón se ven los galpones como
  texto (el actual, el que viene y los anteriores, con desde cuándo y cuántos viajes) y "Cambiar galpón" pide la
  dirección nueva y "Se usa desde"; debajo, los viajes que todavía no salieron con los dos galpones arriba (dirección y
  cuántos van a cada uno) y "Actual" o "Nuevo" en cada fila, propuesto por la fecha. Los que ya salieron conservan el
  suyo (su recorrido y su costo no cambian). Mientras haya uno nuevo que no empezó, "Cambiar galpón" queda gris con el
  motivo. Base: `database/costos/02_galpones_por_fecha.sql` (`GALPON.Vigente_Desde`, `GALPON_KM` con los km por galpón
  y `VIAJES.GalponID`, el galpón cuando no es el de la fecha). Ver detalle del viaje nombra su galpón ("Galpón (Av.
  Circunvalación 1500) → …"); la hoja de ruta y el kilometraje de los camiones usan el galpón de cada viaje.
  **Decidido por Rocío (27/10):** no se elige el galpón en Editar viaje (manejan un solo galpón a la vez: alcanza con la
  fecha y la lista al cambiarlo). En cambio, **el galpón nuevo, mientras no empezó, se corrige** ("Corregir galpón": la
  dirección o la fecha, con los viajes como están; si cambia la fecha, se vuelven a proponer) **o se anula** ("Anular
  cambio", con confirmación: los viajes siguen saliendo del actual). Corregir la dirección del galpón que ya está en uso
  no está en la pantalla (la API lo permite: PUT api/Costos/Galpon).
  Cómo probarlo en la VM:
  1. Correr `database/costos/02_galpones_por_fecha.sql` (primero con `@Aplicar = 0`, después con 1; todo "OK") antes de
     recompilar. **Aplicado el 28/10 por Rocío:** los cuatro "OK"; los km al galpón de 9 orígenes y 12 destinos quedaron
     copiados para el galpón actual.
  2. Gestionar empresa → Galpón: el actual con "Actual" y la cantidad de viajes. "Cambiar galpón" → dirección nueva y una
     fecha de dentro de unos días → la lista de los que no salieron, con "Actual" hasta ese día y "Nuevo" desde ese día;
     cambiar una fila y ver que los números de arriba cambian → "Cambiar galpón" → el aviso, la tarjeta con los dos y el
     botón gris con el motivo; abajo, "Calculando los km al galpón…".
     En el galpón que viene: "Corregir galpón" → los datos y los viajes como quedaron; cambiar la fecha → se vuelven a
     proponer → Guardar → "Galpón nuevo corregido…". "Anular cambio" → confirmar → queda solo el actual y "Cambiar
     galpón" vuelve a estar habilitado.
  3. Ver detalle de un viaje que ya salió: el galpón de siempre y su recorrido igual. Uno que pasó al nuevo: su galpón
     nombrado y los km al nuevo. Hoja de ruta (chofer): el mapa de ese viaje arranca en el galpón nuevo.
- [x] **36.** Mostrar las horas estimadas de Google junto a los km al cargar un viaje o presupuesto: si el destino queda
  antes de ese tiempo, error o advertencia; si queda mucho después, ver si se pide un motivo. Sirve también para el punto
  3 (viajes superpuestos).
  **Hecho (27/10), subido, pendiente de probar en la VM**, como decidió Rocío: junto a los km se ve lo que tarda según
  Google ("48,5 km · 1 h 5 min" en Registrar viaje; "(Google estima 1 h 5 min de viaje)" en presupuestos) y si el fin
  queda antes, error debajo de Fin que no deja guardar: "Fin no permitido: tiene que ser a las 06:05 hs o después
  (Google estima 1 h 5 min de viaje)." (con la fecha si llega otro día). Si es más tiempo, no se pide nada. Sin la ruta
  de Google (km a mano) no hay control; la API no lo controla (la duración la da Google en el navegador). Cómo probarlo
  en la VM (en el 5502, donde anda Google): Registrar viaje con origen y destino → al lado de los km, el tiempo; poner un
  fin anterior a inicio + ese tiempo → el error debajo de Fin y Guardar no deja; corregirlo → se va. Lo mismo en
  Registrar presupuesto.
- [ ] **37.** Kilometraje, consumo y combustible: hechos en la §37, sin probar en la VM. Faltan los datos: el kilometraje
  inicial, su fecha y el consumo de los 4 camiones, y el precio del gasoil (Gestionar camiones).

### Pantallas y menú
- [ ] **6.** Todos los submenús quedan abiertos y con la opción marcada cuando se está en esa pantalla.
- [ ] **7.** Los archivos HTML siguen con nombres viejos (`gestion-facturacion.html` es Gestionar proformas): renombrarlos
  con el nombre de la opción. Toca enlaces, menú y permisos de todos: coordinar con Facu y Fede.
- [ ] **19.** En Gestionar proformas, la etiqueta de Rukas con el número en la columna del número: pasarla al ícono de
  información junto al estado, y "—" mientras no tenga número.
- [ ] **24.** Ver si los modales tienen que mostrar todo sin desplazarse, para que no queden campos escondidos abajo.
- [ ] **27.** Autocompletar direcciones con Google en todas las pantallas que cargan direcciones (sigue a la §5).

### Seguridad, auditoría y equipo
- [ ] **5.** JWT y seguridad: ya está en la §40, punto 1 (la sesión vence rápido, la API responde sin token, la clave en el
  código).
- [ ] **17.** Revisar cómo se ve el detalle de Auditoría en todos los casos y sumar la IP. Lo consulta alguien de sistemas:
  está bien que muestre los valores de la base (decidir con eso la M5 de Tableros, §40 punto 7).
- [ ] **18.** En el circuito de unir los desarrollos de Facu y Fede, sumar pruebas después de cada merge con la misma
  mirada de usabilidad que las de Rocío (que se entienda, que no sea engorroso). Lo que salga, Rocío decide con la
  recomendación de Claude si lo mejora ella o lo vuelve a ver con ellos.

### Para más adelante
- [ ] **15.** Ver si los módulos de Facu y Fede explican los campos como viajes (ayudas debajo de los campos, avisos).
- [ ] **20.** Ver los logs de WhatsApp desde el sistema (en Auditoría o donde corresponda; hoy quedan en `whatsapp.log` de
  la API).
- [ ] **25.** Dónde se guarda si un cliente tiene plataforma (hoy solo QUICKFOOD): ver si se configura desde el sistema o
  está en el código, y si conviene sumarlo.
- [ ] **Placeholders con datos de ejemplo (Rocío, 28/10; no es urgente).** Muchos campos tienen, en gris adentro, un dato
  inventado que parece real: "Juan", "Pérez", "jperez", "3514123456", "30-71234567-8", "Av. Faraday", "AB123CD",
  "Distribuidora Norte", "Depósito Rosario". Rocío no sabe si está bien o si confunde (puede parecer un dato ya cargado o
  un dato verdadero) y si convendría un texto general ("Nombre del chofer", "Escribí el apellido") o nada. Otros
  muestran solo el formato ("DD/MM/AAAA", "1.250,00", "Desde y hasta"), que sirven y no tienen ese problema. El design
  system no tiene una regla sobre placeholders: decidir una (por ejemplo, solo el formato cuando hace falta, y lo demás
  en la etiqueta o en la ayuda de debajo), sumarla al §6.3 y aplicarla en todas las pantallas.

---

## 42. Tabla de tarifas dinámica — PROPUESTA GUARDADA, VA AL FINAL (26/10)

**Orden (Rocío, 26/10, después de ver la maqueta):** la propuesta queda guardada y es lo último que se hace; primero van
las mejoras (§40, punto 7, y los puntos 2 y 12 a 14 de la §41).

Pedido de Facu (26/10) y decisión de Rocío: cada tabla define su forma, sin tocar código. Va antes del jueves 29/10 junto
con los textos (§41, puntos 12 a 14), la tarjeta (punto 2) y la vuelta automática con el control de camión ocupado
(punto 3). El viaje sin carga y la estadía, después. Maqueta: `.claude/maquetas/tarifas/tabla-dinamica.html`.

**Qué cambia en la tabla:**
- **Tipos de camión:** un catálogo (`TIPOS_CAMION`) que se administra desde Gestionar camiones → "Tipos de camión", con
  sus mismos permisos (sin pantalla nueva en el menú). Cada tabla elige qué tipos tienen precio. Un tipo en uso se
  inactiva, no se elimina.
- **Modelos:** cero o más años de corte por tabla ("Desde 2015", "Desde 2021" → "2014 o anterior · 2015 a 2020 · 2021 en
  adelante"). Sin años, "Todos los modelos".
- **Bandas de km:** una o más, cada una "hasta N km" y con 1ª y 2ª vuelta o no. Después de la última, como hoy: la fija
  de la última banda más los km que pasan × el precio por km. La tarifa por km, igual.
- La grilla se arma sola (una por grupo de modelo, más la de tarifas por km). Las validaciones y "Revisá estos valores"
  pasan a valer para cualquier forma.

**Base aditiva (con `main` como plan B):** un script nuevo crea `TIPOS_CAMION`, `TARIFARIO_MODELOS`, `TARIFARIO_BANDAS`,
`TARIFARIO_TIPOS` y `TARIFARIO_PRECIOS` (un valor por tabla, tipo, modelo desde, banda —0 = por km— y vuelta) y copia ahí
las tablas que ya existen. No borra ni cambia `TARIFARIO_VALORES` ni las columnas de `TARIFARIOS`: mientras dure el plan
B, la API nueva también las escribe cuando la tabla tiene la forma de antes (dos grupos de modelo, tres bandas, vueltas
solo en la primera), así `main` sigue andando. Las tablas con otra forma son solo de prueba hasta el jueves (si se vuelve
a `main`, se eliminan antes). Después de la presentación, un script saca lo viejo.

**La vuelta automática y el camión ocupado** se separaron de esta propuesta y se hacen antes, con las mejoras: §43.

**Decisiones para el OK de Rocío:** dónde se administran los tipos; años de corte en lugar de rangos libres; y que una
tabla tenga al menos una banda (una tabla solo por km quedaría para después).

---

## 43. Precio por orden del día (1ª y 2ª vuelta automáticas) y camión ocupado — SUBIDO, PENDIENTE DE PROBAR EN LA VM (27/10)

**Hecho en la Mac (27/10)** con la API simulada y como la maqueta aprobada. Compila en la Mac (C# 7.3) y las pruebas de
Node dan OK (`tests/orden-del-dia.test.js`, nueva, y `tests/tarifario.test.js`).
- **API:** `Tarifas/OrdenDelDia.cs` (la regla, los textos y lo que se guarda para revisar) y `Viajes/Ocupacion.cs`
  (camión y chofer ocupados); `TarifarioCalculo`/`TarifarioImpacto` sin el cálculo por camión; `api/Tarifario/Calcular`
  devuelve el orden del día (`Orden`: la línea, el bloque y los avisos); en viajes, registrar, editar y eliminar acomodan
  a los otros y controlan el camión y el chofer, y `api/Viajes/Ocupado`, `{id}/AlEliminar`, `{id}/Orden` y `{id}/Precio`
  ("Actualizar el precio"; "Mantener el precio" es Resolver de `api/Tarifario/Revisar`); en presupuestos (Facu),
  `{id}/AlCambiarEstado`, aceptar con el camión o el chofer ocupado no deja, aceptar, rechazar, volver a Pendiente o
  eliminar acomodan a los otros, y con el precio para revisar no se genera el viaje.
- **Pantallas:** Registrar y Editar viaje (sin "Vuelta": la línea, el bloque del día, los avisos y el error de ocupado
  debajo del campo), Ver detalle del viaje (la línea y el bloque en Tarifa, y arriba el "Precio para revisar" con sus
  botones), la fila de Gestionar viajes, Presupuestos (la línea debajo del importe, las confirmaciones, el aviso con
  "Volver a Pendiente" y "Mantener el precio" en Ver PDF, Generar viaje deshabilitado con el motivo), Proformas (el
  globito) y la tarjeta "Cambios para revisar" del dashboard y de Tableros (antes "Cambios de tarifa para revisar"; ahora
  desaparece si no hay nada). Los avisos de cambios de tarifa pasaron al mismo tono (§5.1 del design system).
- **Dos decisiones chicas mías, para que Rocío las confirme:** en el formulario de presupuesto va solo la línea, sin el
  bloque (mientras está pendiente no mueve a los otros, y la confirmación de aceptarlo dice lo que pasa); y en
  presupuestos el globito dice "Es necesario que lo revises en Ver PDF." (no hay "Ver detalle del presupuesto").
- **Avisarle a Facu:** se tocaron `PresupuestosController.cs`, `presupuestos.js` y `presupuestos.html`, y el globito de
  `gestion-facturacion.html`.

**Cómo probarlo en la VM:**
1. **Antes de recompilar:** correr en SSMS `database/tarifas/06_precio_por_orden_del_dia.sql` (las tres filas "OK") y
   `database/tarifas/07_relevar_vueltas_por_recorrido.sql` (solo lectura). Pasarle a Claude el resultado del `07`: lo
   que tenga otra vuelta con la regla nueva no se cambia solo; se decide antes de seguir.
   **Hecho el 28/10 por Rocío:** el `06` dio las tres filas "OK" y el `07`, un solo caso: el viaje #40 (Servicios
   Ambientales S.A., Los Carolinos → San Vicente, 27/10/2026 15:00 hs, Registrado, solo en su grupo), guardado como 2ª
   vuelta ($ 333.350,00), que con la regla nueva es 1ª ("Se actualiza solo"). No cambia al recompilar: se recalcula al
   editarlo y guardarlo. **Rocío lo edita y lo guarda después de recompilar** (decisión del 28/10).
2. `git pull`, recompilar la API y recargar el navegador sin caché.
3. Registrar viaje con tarifa fija y un recorrido de hasta 130 km, un día sin otros viajes de ese cliente y recorrido:
   debajo de la tarifa, "Se cobra como primer viaje del día.", sin bloque.
4. Otro del mismo cliente, recorrido y día, **más temprano** y con otro camión: el bloque con los dos, el otro con
   "Se actualiza" y "antes $ …", y el aviso azul. Guardar: "Viaje registrado. El precio del viaje #N se actualizó a $ …".
   En Ver detalle de los dos, el bloque con 1º y 2º.
5. Uno más, **más tarde**: "Se cobra como segundo viaje del día: ya está el viaje #N a las HH:MM hs.", sin avisos.
6. Pasar el segundo a En viaje o Entregado y registrar otro más temprano: el viaje entregado con "Para revisar" y el aviso
   amarillo. Guardar: "… Es necesario que revises el precio del viaje #N.". En la fila, el ícono rojo con "Precio para
   revisar"; en el dashboard, la tarjeta "Cambios para revisar". En Ver detalle, probar "Mantener el precio" (con un
   motivo, y mirarlo en Auditoría) y, en otro caso, "Actualizar el precio" (el toast dice que hay que avisarle al cliente).
7. Eliminar el primero del día: la confirmación dice qué pasa con el otro (se actualiza solo o queda para revisar).
8. Camión ocupado: elegir un camión que ya tiene un viaje que se superpone → "Camión ocupado: viaje #N, de … hs a … hs."
   debajo de Camión; al cambiar la hora para que no se superponga, se va. Lo mismo con el chofer. Con el error, Guardar no
   deja.
9. Un viaje en una proforma generada al que le cambia el lugar: queda para revisar con "Ver la proforma"; al anular la
   proforma se recalcula con la vuelta nueva y deja de estar para revisar.
10. Presupuestos: con tarifa fija y recorrido corto, la línea debajo del importe (sin "Vuelta del día"). Aceptarlo con un
    viaje Registrado del mismo cliente, recorrido y día más tarde: la confirmación dice que ese viaje pasa a segundo y el
    toast, que se actualizó. Aceptar uno con el camión ocupado: "No se puede aceptar el presupuesto. Camión ocupado: …".
    Rechazarlo: el viaje vuelve a primero. Generar viaje con un chofer ocupado: el error debajo del chofer.
11. Gestionar tarifas: corregir una tabla que usan viajes con vuelta: el impacto se sigue viendo y guardando bien.

**Resumen que manda (27/10): `docs/diseno/vuelta-del-dia-diseno.md`**, con la regla, dónde se ve y todos los casos
(normales y borde) con su mensaje y lo que puede hacer la persona. **Maqueta aprobada por Rocío (27/10):**
`.claude/maquetas/tarifas/precio-para-revisar.html`, con cada lugar y los textos finales. Lo de abajo queda como historia de la decisión.
**Decisión final de Rocío (27/10):** en los viajes que ya salieron (y en los de un presupuesto aceptado), si un cambio
les toca el lugar, el precio lo decide la persona con "Actualizar el precio" o "Mantener el precio" (puede haber un
acuerdo con el cliente); mientras tanto quedan con "Precio para revisar", y al actualizar se recuerda avisarle al
cliente. Solo se actualizan solos los que todavía no salieron. Reemplaza lo de abajo donde se contradiga.

Pedido de Rocío (§41, punto 3). Se pensó con varias vueltas el 26/10: la versión con "para revisar" (avisos en
presupuestos, viajes y la tarjeta) se descartó por intrincada. Maqueta: `.claude/maquetas/tarifas/vuelta-del-dia.html`
(secciones A, B y D; muestra "el día del camión", que pasa a ser el del cliente y el recorrido; las E a G eran de la
versión descartada).

**Qué es la 2ª vuelta (Rocío, 26/10; corrige la §34):** depende del **cliente, el origen y el destino**, no del camión:
es el segundo viaje (o los siguientes) del mismo cliente, con el mismo origen y el mismo destino, el mismo día (el de la
fecha de inicio), solo con tarifa fija y hasta la primera banda (130 km). Da igual qué camión lo haga: dos viajes del
mismo recorrido a la misma hora con camiones distintos son uno 1ª y otro 2ª. **Hoy el código y el `04` la calculan por
camión** (`TarifarioCalculo.ViajeAnteriorDelDia`, también en `TarifarioImpacto`, y `database/tarifas/04_…` para los viajes
que ya estaban): hay que cambiarlo, y relevar con una consulta de solo lectura qué viajes guardados tienen otra vuelta
con la regla nueva antes de decidir qué hacer con ellos.

**Regla:**
- Por cliente, recorrido y día hay **un solo primer viaje** (1ª vuelta); los demás son **segundo viaje** (2ª vuelta, más
  barata). En pantalla se dice en palabras ("Primer viaje del día", "Segundo viaje del día"); "1ª vuelta" queda en la
  tabla de tarifas.
- El primer viaje es **el que empieza primero**, salvo que otro del grupo ya lo tenga **fijo**: ahí queda donde está y los
  demás van como segundo, aunque empiecen antes. La etiqueta puede no coincidir con las fechas, pero lo que se le cobra
  al cliente ese día por ese recorrido sí (Rocío: para el cliente es lo mismo).
- **Fijo:** un viaje que ya salió (En viaje o después), uno que está en una proforma o un comprobante, uno de un
  presupuesto aceptado y **un presupuesto aceptado que todavía no generó su viaje**: reserva su lugar (así nunca quedan
  dos primeros viajes al generarlo).
- Lo que no es fijo **rota solo** al registrar o editar un viaje (cliente, recorrido, hora o fecha) o eliminarlo, y al
  aceptar, rechazar, volver a Pendiente o eliminar un presupuesto. Cada cambio queda en Auditoría ("Pasa a segundo viaje
  del día: $ 581.492,00 → $ 407.089,00, porque el viaje #51 empieza antes."). Los de Rukas en Registrado sin proforma de
  Rukas rotan como cualquiera (siguen el orden de las fechas, como Rukas); con proforma, fijos.
- **No queda nada "para revisar"** por la vuelta.

**Excepciones aceptadas por Rocío (26/10):**
- Un viaje que empieza antes que un primer viaje fijo va como segundo.
- **Eliminar el primer viaje cuando el otro ya está fijo** (por ejemplo, nadie eliminó el #44 hasta el viernes y el #47
  ya se entregó): el otro queda como segundo viaje. La confirmación lo dice y dónde se puede cambiar, sin cambiarlo
  desde ahí: cambiar un viaje entregado desde la acción de eliminar otro es riesgoso (Rocío, 26/10). El cambio se hace
  en el mismo viaje: en Editar viaje (y en Ver detalle), mientras no esté en una proforma ni en un comprobante, un aviso
  amarillo "Es el único viaje de este cliente y recorrido ese día, pero se cobra como segundo viaje: $ 407.089,00. Como
  primer viaje serían $ 581.492,00." con el botón "Cobrar como primer viaje" (con su confirmación y Auditoría). En la fila
  de Gestionar viajes, el ícono azul junto al estado: "Se cobra como segundo viaje aunque es el único del día. Se puede
  cambiar en Editar viaje.". Si ya está en una proforma o facturado, se corrige como hoy (anular la proforma, nota de
  débito).
- Un presupuesto aceptado como segundo viaje cuyo viaje anterior se elimina: queda con el precio aceptado (a favor del
  cliente); la confirmación de eliminar lo dice.

**Camión y chofer ocupados (aparte de la vuelta):** el mismo camión, o el mismo chofer, en dos viajes (o un viaje y un
presupuesto aceptado) que se superponen, de inicio a fin, da error al elegirlo y al guardar, debajo del campo: "Camión
ocupado: viaje #45, de 08:00 hs a 11:30 hs." ("Chofer ocupado: …", "Camión ocupado: presupuesto #10, de …"; la fecha,
solo si es otro día). Si el choque aparece al cambiar la fecha con el camión ya elegido, el error va igual debajo de
Camión (§6.3 del design system).

**Lo que se ve (Rocío, 26/10: avisos breves, sin órdenes, con la situación y lo que le pasa al otro viaje, en todos los
lugares donde se decide o se mira):**
- Registrar y editar viaje (y presupuesto), y Ver detalle del viaje: un bloque con los viajes y presupuestos aceptados de
  ese cliente y recorrido ese día, en orden ("Alimentos La Serena S.A. · Planta Córdoba Norte → Depósito Villa Carlos
  Paz, el miércoles 28/10/2026"): horario, viaje o presupuesto, camión, "Primer viaje del día" / "Segundo viaje del día"
  y el precio. El que se carga, resaltado; los fijos, con por qué ("ya salió", "presupuesto aceptado"). En el detalle,
  el de ese viaje resaltado: así se ve después por qué se cobra como se cobra.
- Si al guardar cambia otro viaje, un aviso azul al lado: "Al guardar, el viaje #44 pasa a segundo viaje del día:
  $ 581.492,00 → $ 407.089,00." Sin ventana de confirmación (ya se ve). Toast: "Viaje registrado. El viaje #44 se
  actualizó a $ 407.089,00."
- Si este viaje va como segundo porque el primero es fijo, debajo de la tarifa: "Se cobra como segundo viaje del día: el
  viaje #50 (presupuesto aceptado) tiene el precio de primer viaje."
- Eliminar viaje (desde la fila o el detalle), si el otro rota solo: "No se puede deshacer. El viaje #47 pasa a primer
  viaje del día: $ 407.089,00 → $ 581.492,00." Si el otro es fijo: "No se puede deshacer. El viaje #47 queda como el único
  de este cliente y recorrido el 28/10/2026, pero ya se entregó: sigue cobrándose como segundo viaje ($ 407.089,00). Se
  puede cambiar en Editar viaje #47."
- Aceptar, rechazar, volver a Pendiente o eliminar un presupuesto aceptado: la confirmación dice qué viaje cambia ("Al
  rechazarlo, el viaje #51 pasa a primer viaje del día: $ 407.089,00 → $ 581.492,00.").

**Para Claudia:** si el 3º viaje del día del mismo recorrido cobra como 2ª; y si dos viajes del mismo recorrido con
camiones de distinto tipo (con otros valores en la tabla) se reparten igual la 1ª y la 2ª.

**Tono de los avisos (Rocío, 27/10, ya en el §5.1 del design system):** qué pasa, por qué no se resuelve solo y "es
necesario que…". Al hacer esto, pasar al mismo tono los avisos de cambios de tarifa que ya existen (`cambios-tarifa.js`:
"Reenviáselo al cliente…", "Para corregirla, anulala…"; Gestionar viajes: "Cambió la tarifa: revisá el detalle del
viaje.") y renombrar la tarjeta a "Cambios para revisar" (maqueta `.claude/maquetas/tarifas/precio-para-revisar.html`).

**Qué toca:** `TarifarioCalculo` y `TarifarioImpacto` (el orden del día por cliente y recorrido en lugar de
`ViajeAnteriorDelDia` por camión), `ViajesController` (la vuelta, la rotación, el camión y el chofer ocupados,
eliminar), una consulta nueva con los viajes del día del cliente y recorrido, `gestion-viajes.html` y `viaje-detalle.js`;
en el módulo de Facu, `PresupuestosController` (la reserva, generar el viaje, cambiar estado y eliminar) y
`presupuestos.js` ("Vuelta del día" pasa a texto y el bloque del día): **avisarle a Facu**. La §34 (y el design system,
si lo nombra) se corrige con la definición nueva.

---

## 44. Emisión directa con tipos de comprobante configurados — Hecho en código (26/10)

La emisión directa consultaba siempre FAC, aunque hubiera otro tipo de deuda activo, como FC. El formulario ahora permite elegir un tipo de deuda con configuración, sucursal y numerador activos; conserva las letras y la numeración de la variante elegida. El permiso para emitir estos tipos es `FAC_EMITIR`. La API comprueba el impacto del catálogo antes de guardar.

El comprobante emitido puede consultarse en cuenta corriente, imprimirse en PDF, enviarse por e-mail, imputarse con un recibo y acreditarse con una nota de crédito corriente. Los indicadores de facturación incluyen los tipos de deuda configurados. La emisión desde proforma también admite los tipos configurados desde el 27/10 (§46).

**Base:** Rocío debe ejecutar `database/cuenta-corriente/13_comprobantes_directos_configurables.sql` después de las migraciones previas. El script amplía la restricción de los movimientos de cuenta corriente; no se ejecutó contra la base compartida. Para usar un mismo código con letras A y B, aplicar también las migraciones 11 y 12 en su orden.

**Probar en la VM:** recompilar la API y recargar el navegador; con FC activo y sin FAC activo, abrir «Emitir comprobante directo», elegir FC y su letra, emitir y verificar número y movimiento. Revisar el detalle, PDF, envío por e-mail, saldo, ranking y tablero. Aplicar un recibo y una nota de crédito corriente sobre FC. Confirmar que un tipo de crédito, un numerador inactivo y una sucursal inactiva no se ofrecen en el selector.

---

## 45. Enviar comprobantes por e-mail desde la columna Acciones — Hecho en código (27/10)

En Gestionar cuenta corriente, "Enviar por e-mail" aparece después de "Ver PDF" en las acciones de todos los comprobantes, también en los tipos directos configurables y en los recibos asociados. La vista previa del comprobante queda con Cerrar · Imprimir · Descargar PDF. Los presupuestos conservan el envío en el pie de su vista previa. El envío de proformas se incorporó después (§50). Se actualizaron `AGENTS.md` y la §1.4 del design system con esta decisión.

El formulario de envío ya no muestra el servicio ni el nombre del perfil SMTP (27/10). Sigue comprobando la configuración antes de habilitar Enviar y avisa dentro del formulario si no hay un perfil asignado o falla la consulta.

**Probar en la VM:** recargar Gestionar cuenta corriente y revisar una factura, un recibo, una nota de crédito, una nota de débito y un tipo directo configurable (por ejemplo, FC), además de un recibo asociado dentro de una factura. En cada fila, comprobar que el sobre aparece después de Ver PDF, con tooltip y `aria-label`; abrir Ver PDF y verificar que su pie no tiene el envío. Tocar el sobre y comprobar que abre el formulario del comprobante elegido sin la leyenda del servicio o perfil SMTP; cancelar sin enviar. Si falta la configuración, comprobar que Enviar queda deshabilitado y aparece el aviso. Abrir un presupuesto y una proforma para verificar sus pies respectivos.

---

## 46. Emitir comprobantes internos desde proformas y cancelarlos — Hecho en código (27/10)

En el listado de Gestionar proformas, «Emitir comprobante» abre el modal con un selector de tipos de deuda configurados. Si FC está activo, aparece preseleccionado aunque FAC esté inactivo. El modal carga la letra, sucursal y próximo número de ese tipo. Si la configuración falla, muestra el motivo dentro del modal en vez de un aviso de conexión incorrecto.

La API de emisión vinculada recibe la sigla elegida, conserva los renglones, importes y datos de la proforma, registra el comprobante y el movimiento de cuenta corriente con esa sigla, y marca la proforma y sus viajes como facturados en una transacción. Las listas, la anulación cancelatoria, el PDF y la revisión de tarifas reconocen el comprobante interno vinculado. Los clientes anteriores que omiten la sigla siguen solicitando FAC.

La anulación consulta los tipos de crédito con configuración activa y permite elegir cuál emitir. Si solo hay uno (por ejemplo, crédito interno), lo propone; si hay varios, pide elegir. El crédito cancelatorio aplica **el total original** del comprobante de la proforma: el importe se ve como dato fijo, y la API rechaza importes parciales o alterados, aplicaciones previas y referencias a otro comprobante. Al emitirlo, registra una única aplicación, anula la proforma y libera los viajes. El ranking de facturación descuenta los créditos configurados, sin tratar los recibos como facturación.

**Base:** ejecutar `database/cuenta-corriente/14_comprobantes_desde_proforma_configurables.sql` después de 13 y luego `database/cuenta-corriente/15_credito_interno_cancelatorio.sql`. Amplían las restricciones de vínculo, referencia cancelatoria e impacto de los movimientos. El usuario informó que aplicó los scripts el 27/10; no se consultó ni modificó la base desde este trabajo.

**Corrección del 27/10:** la migración 16 incorpora un disparador `AFTER INSERT` en `COMPROBANTES`. SQL Server rechaza `OUTPUT INSERTED.Comprobante_ID` sin `INTO` al insertar en una tabla con ese disparador. La API ahora captura el identificador con `OUTPUT ... INTO` en la emisión directa, desde proforma y de recibos. Esta corrección requiere recompilar y desplegar la API; no necesita otra migración.

El usuario confirmó el 27/10 que pudo emitir el crédito cancelatorio desde la proforma después de aplicar los scripts y actualizar la API.

**Probar en la VM:** con FC activo y FAC inactivo, recompilar la API y recargar el navegador. Abrir una proforma aceptada y tocar «Emitir comprobante»: debe mostrar FC, su letra, sucursal y próximo número, el total de la proforma y las fechas. Emitir; comprobar número FC, todos los renglones, vínculo y estado Facturada en ambas pantallas de proformas, estado Facturado de sus viajes, movimiento en cuenta corriente y número de proforma en el PDF. Con crédito interno activo y NC inactiva, abrir «Anular comprobante»: debe mostrar el FC vinculado y su total fijo, proponer crédito interno, cargar su letra, sucursal y número, y emitir el crédito por el total exacto. Verificar que el crédito aparece aplicado al FC en cuenta corriente y en su PDF, que el PDF del FC conserva el número de proforma después de la anulación, que el ranking descuenta el crédito, que la proforma queda Anulada y que los viajes se liberan para otra proforma. Emitir también un recibo para comprobar las tres rutas de inserción. Con dos tipos de crédito activos, comprobar que pide elegir; sin ninguno, que muestra el motivo con los datos del FC visibles y no deja emitir. Si no hay tipos de deuda activos, el modal de emisión debe avisarlo sin mostrar un error de conexión. Revisar los cambios de tarifa de un viaje asociado a ese FC.

---

## 47. Editar tipos de comprobante y marcar los electrónicos — Hecho en código (27/10)

En Gestionar tipos de comprobante se pueden editar descripción, sigla, letra, sucursal, numerador y estado de un tipo no electrónico. La descripción y el impacto pertenecen a la sigla y se comparten entre sus letras A y B. Cambiar una sigla configurable actualiza todas sus letras, el numerador legado y la sigla de todos sus comprobantes históricos, movimientos y vínculos. Conserva los identificadores de catálogo, configuraciones y comprobantes. Cambiar la letra afecta solo la variante elegida y sus comprobantes, incluso los emitidos; la nueva combinación debe estar libre en la configuración y no puede tener comprobantes históricos propios, para conservar la secuencia del numerador. La API comprueba los conflictos dentro de la transacción y rechaza un formulario cuya identidad original cambió.

El indicador «Es comprobante electrónico» pertenece a la sigla y se comparte entre sus letras. Los tipos existentes comienzan sin marcar. Al marcarlo y guardar, quedan bloqueadas todas las modificaciones posteriores del tipo, incluida la incorporación de otra letra, el cambio de estado y la eliminación. La pantalla muestra el motivo en las acciones deshabilitadas. Esta preparación deja fijos los tipos que en el futuro se emitan mediante el WebService de ARCA; no conecta todavía con ARCA.

Las siglas FAC, ND, NC y REC tienen circuitos propios y permanecen fijas. FAC y ND son de deuda; NC y REC, de crédito. REC usa la letra X; los demás tipos usan A o B. El impacto de una sigla con comprobantes permanece fijo porque reclasificarlo cambiaría saldos, movimientos y aplicaciones históricas. Los datos que no se pueden editar se muestran como texto con el motivo.

**Base:** ejecutar `database/cuenta-corriente/16_editar_identidad_tipos_comprobante.sql` después de 15. Agrega el indicador electrónico y las cascadas necesarias para propagar la sigla conservando IDs. No se ejecutó contra la base compartida.

**Probar en la VM:** recompilar la API y recargar la pantalla. Con una sigla configurable que ya tenga comprobantes, cambiarla y comprobar ambas letras, el mismo identificador, la sigla en comprobantes emitidos y anulados, movimientos, vínculos con proformas y referencias de cancelación. Cambiar la letra de una variante con comprobantes y comprobar esos comprobantes, la numeración y los PDF. Intentar una letra ya configurada, una sigla existente y una letra con comprobantes anteriores: debe explicar el conflicto sin perder lo escrito. Con una sigla sin comprobantes, corregir también Impacto; con historial, Impacto queda fijo. Comprobar que FAC, ND, NC y REC mantienen sus reglas. Marcar un tipo de prueba como electrónico: todas sus letras deben mostrar la marca y bloquear edición, cambio de estado, eliminación y alta de otra letra, tanto en pantalla como en la API. Al agregar otra letra a una sigla no electrónica, el impacto debe conservar el valor de esa sigla.

---

## 48. Emitir créditos y débitos internos directos — Hecho en código (27/10)

«Emitir crédito» consulta los tipos de crédito activos y propone C si está disponible. «Emitir Débito» consulta los tipos de deuda activos, incluida ND, y propone D si está disponible. El catálogo todavía no distingue facturas internas de débitos internos: ambos tienen impacto de deuda. La API usa el impacto configurado: los créditos corrientes pueden aplicarse a comprobantes de deuda y requieren `NC_EMITIR`; D usa `FAC_EMITIR`, mientras ND conserva `ND_EMITIR`. No hace falta otro script SQL para este ajuste.

**Probar en la VM:** con C y D activos y NC y ND inactivos, recompilar la API y recargar Gestionar cuenta corriente. Emitir un comprobante de deuda para un cliente; abrir «Emitir crédito», comprobar que propone C con su letra, sucursal y próximo número, distribuir el importe sobre la deuda y emitir. Verificar el número C, el movimiento de crédito y la aplicación. Abrir «Emitir Débito», comprobar que propone D, cargar cliente, concepto, importe y vencimiento, emitir y verificar el número D y el nuevo saldo deudor. Con solo ND activo, comprobar que aparece en «Emitir Débito». Sin ningún tipo de crédito activo, el formulario de crédito debe mostrar el motivo y mantener «Emitir» deshabilitado; repetir sin ningún tipo de deuda activo para el débito.

---

## 49. Emitir créditos internos sin imputar e imputarlos después — Hecho en código (27/10)

«Emitir crédito» permite emitir el comprobante interno sin seleccionar una deuda. Para ese crédito se ingresan el neto, la alícuota de IVA y otros impuestos; el IVA y el total se calculan con esos datos y quedan fijos al emitir. El crédito queda con saldo disponible por su total y se muestra en cuenta corriente y en «Comprobantes sin relacionar». Desde su acción «Imputar crédito» se puede aplicarlo después, en partes y sobre uno o varios comprobantes internos de deuda del mismo cliente, hasta agotar el saldo de cada lado. El crédito cancelatorio de una proforma conserva su aplicación única por el total y no participa de esta imputación posterior.

La API guarda las imputaciones posteriores mediante `PUT /api/comprobantes/{id}/aplicaciones`: cada importe solicitado es el **total acumulado** del crédito aplicado a esa deuda, por lo que repetir exactamente la petición no duplica la aplicación. Rechaza deudas de otro cliente, importes que excedan el saldo del crédito o de la deuda, y modificaciones de aplicaciones ya registradas. El script de solo lectura `database/cuenta-corriente/03_verificacion_posterior.sql` ahora considera válido un crédito corriente sin aplicar o parcialmente aplicado; sigue denunciando sobreaplicaciones y exige que un cancelatorio emitido tenga una sola aplicación por su total. No se requiere migración nueva de la base.

**Probar en la VM:** recompilar la API y recargar Gestionar cuenta corriente. Con C activo, emitir un crédito sin deuda seleccionada con neto $ 1.000,00, IVA 21 % ($ 210,00) y otros impuestos $ 50,00; verificar el total $ 1.260,00, su desglose, número, movimiento, detalle, PDF y saldo disponible en ambas vistas de cuenta corriente. Crear dos comprobantes internos de deuda para el mismo cliente, cada uno con saldo suficiente. Imputar $ 400,00 al primero, volver a abrir «Imputar crédito» y agregar $ 200,00 para que esa deuda acumule $ 600,00; aplicar los $ 660,00 restantes al segundo. Verificar que el crédito pasa de «Sin aplicar» a «Parcialmente aplicado» y luego a «Aplicado», y que los saldos de ambas deudas bajan una sola vez. Repetir el mismo `PUT` y comprobar que no agrega otra aplicación; intentar exceder cualquiera de los saldos y usar una deuda de otro cliente: la API debe rechazarlo sin guardar cambios. Confirmar que una anulación de proforma sigue emitiendo su crédito cancelatorio por el total y con una sola aplicación.

---

## 50. Enviar el comprobante y su proforma por e-mail — Hecho en código (27/10)

Al enviar un comprobante desde cuenta corriente, si tiene una proforma vinculada (vigente o histórica), el formulario ofrece
«Incluir proforma», marcado al abrir, e identifica su número. Marcado envía dos PDF separados, comprobante y proforma;
desmarcado envía solo el comprobante. Sin vínculo, no se muestra la casilla. La API vuelve a comprobar el vínculo y el
estado antes del envío; si falla la generación o validación de alguno de los PDF, no envía el correo. El máximo total
de adjuntos es 10 MB. El historial conserva el comprobante y la auditoría registra también la proforma y su huella.

Listar y Gestionar proformas incorporan «Enviar por e-mail» después de «Ver PDF». Envía el PDF de la proforma generada,
aceptada o facturada con el perfil de Facturación, asunto y cuerpo propios de proforma, y registra la entrega en auditoría.
En borradores y anuladas, la acción queda deshabilitada. Ambos envíos sugieren el e-mail actual del cliente, permiten
cambiarlo y piden confirmación con el destinatario y los documentos. No requiere migración SQL.

**Verificación local:** API compilada con MSBuild; pruebas Node de acciones, adjuntos MIME reales, cancelación,
doble clic, respuestas tardías y error de PDF. No se enviaron correos ni se ejecutó SQL contra la base compartida.

**Probar en la VM:** recargar las tres pantallas con Ctrl+F5. Con un comprobante vinculado, abrir el sobre y comprobar
la casilla marcada y el número; enviar a un buzón de prueba y abrir los dos PDF recibidos. Repetir desmarcando la casilla
y con un comprobante sin proforma: llega solo el comprobante. Cancelar la confirmación: no se envía. Desde Listar y
Gestionar proformas, enviar una propia y una de plataforma: llega un PDF de proforma con su número y detalle completos.
Comprobar el bloqueo de borradores y anuladas, destinatario vacío o inválido, falta de perfil y fallo SMTP sin perder lo
escrito. Probar como admin y con un usuario con acceso a proformas; sin ese acceso, la API rechaza el envío independiente.
La entrega real por SMTP queda pendiente de esa prueba.

**Corrección del 27/10:** el envío inicialmente buscaba solo vínculos vigentes y excluía proformas anuladas, por eso
«Incluir proforma» no aparecía en un comprobante cancelado con un crédito. Ahora consulta el documento de origen
conservado en el vínculo histórico, igual que el detalle y el PDF del comprobante. El envío independiente de una
proforma anulada sigue bloqueado. Se agregó una prueba de la consulta real con datos locales: vínculo histórico con
proforma anulada, vínculo vigente y comprobante sin proforma. **Probar:** abrir el envío del comprobante cancelado;
debe aparecer la casilla marcada con la proforma original. Repetir con el comprobante nuevo y verificar que muestra
su propia proforma; en uno directo sin proforma, no debe aparecer.

---

## 51. Ordenar las columnas de cuenta corriente — Hecho en código (27/10)

La vista de movimientos de Gestionar cuenta corriente permite ordenar por Cliente, Comprobante, Concepto, Fecha,
Total, Cancelado y Saldo desde sus encabezados, con `SGTL.tabla.habilitarOrden`: primer clic ascendente, segundo
descendente y una columna nueva empieza ascendente. Conserva las flechas y el criterio al reconstruir los encabezados,
filtrar, cambiar de cliente y paginar. La API ordena todos los resultados antes de paginar, con un desempate estable;
los importes se ordenan como números y las fechas por su valor. Las aplicaciones permanecen debajo de su comprobante
en orden cronológico. PDF y Excel usan el mismo criterio sobre todos los resultados filtrados. Fecha permanece entre
Concepto y Total. No requiere migración SQL.

**Verificación local:** pruebas Node del orden de las siete columnas, direcciones, flechas, filtros, paginación,
exportaciones, respuestas tardías, SQL permitido y recibos anulados, con datos locales y sin consultar la base compartida.

**Probar en la VM:** recompilar la API y recargar con Ctrl+F5. Con todos los clientes, alternar dos veces cada encabezado;
probar importes como 2, 10 y 100 y fechas que crucen de mes. Cambiar de columna y comprobar que arranca ascendente.
Ir a la segunda página, filtrar y exportar PDF y Excel: deben conservar el criterio y considerar todos los resultados.
Elegir un cliente: se oculta su columna y se conserva el orden. Desplegar un comprobante con varias aplicaciones y
comprobar que siguen juntas y en orden cronológico, con sus saldos progresivos. Volver de Comprobantes sin relacionar
a Cuenta corriente y verificar que se mantiene el criterio.

---

## 52. Emitir recibos sin imputar e imputarlos después — Hecho en código (27/10)

El recibo se puede emitir sin elegir una deuda o aplicándolo parcialmente. La búsqueda de comprobantes no borra el
importe ingresado y el formulario identifica el «Saldo sin imputar». Los recibos emitidos con saldo aparecen en
Comprobantes y Comprobantes sin relacionar, con «Imputar recibo» como siguiente paso. La misma operación de créditos
internos admite agregar aplicaciones en partes a una o varias deudas del cliente, hasta agotar el saldo. Al agotarlo,
el recibo deja de mostrarse como disponible y permanece en las aplicaciones de las deudas.

`PUT /api/comprobantes/{id}/aplicaciones` exige `REC_EMITIR` para recibos y `NC_EMITIR` para otros créditos. Conserva
la transacción serializable, las validaciones de saldo y cliente y el contrato acumulativo: repetir exactamente la
petición no duplica importes. No modifica el total, la forma de pago ni los movimientos del documento emitido. Editar
el recibo conserva las fechas de sus aplicaciones; su emisión no puede quedar después de una imputación. Reintentar
la emisión de un recibo originalmente sin aplicar sigue reconociéndolo después de imputarlo. No requiere migración SQL.

**Verificación local:** pruebas de interfaz, consultas reales con SQLite local y método C# de imputación ejecutado
con persistencia y permisos simulados: aplicación parcial y sucesiva, reintento idempotente, recibo anulado, saldo
insuficiente, cliente distinto, fechas inválidas y reversión completa ante un error. Sin acceso a la base compartida.

**Probar en la VM:** emitir un recibo por $ 1.000,00 sin marcar comprobantes y verificar saldo disponible por ese total.
Desde «Imputar recibo», aplicar $ 400,00 a un comprobante interno, luego agregar $ 200,00 a la misma deuda y $ 400,00
a otra del mismo cliente. Verificar saldos parciales y finales, el recibo dentro de cada deuda y sus PDF. Repetir el
mismo `PUT`: no debe duplicar la aplicación. Probar deuda de otro cliente, recibo anulado, fecha anterior al recibo o
a la deuda y exceso de cualquiera de los saldos: debe rechazar sin guardar nada. Emitir también un recibo parcialmente
aplicado y completar después su saldo. Editar la referencia u observaciones de un recibo con imputaciones posteriores:
debe conservar sus fechas. Probar con un usuario con `REC_EMITIR` y sin `NC_EMITIR`, y verificar el rechazo inverso.

**Visibilidad de la acción (27/10):** por pedido del usuario, «Imputar» solo aparece en créditos internos y recibos.
En los demás tipos se oculta; dentro de esos dos circuitos, sigue deshabilitada con el motivo cuando no se puede
usar. Se actualizó la excepción en `AGENTS.md` y el design system. **Probar:** comparar un recibo y un crédito interno
con una factura y un débito; el ícono de imputación solo debe estar en los dos primeros, después del sobre.

---

## 53. Vincular el débito interno con un comprobante interno — Hecho en código (27/10)

Emitir Débito permite elegir opcionalmente un «Comprobante interno relacionado», como FC, del mismo cliente. La
opción vacía es «Sin vincular». No limita la selección al saldo pendiente del origen: el débito puede documentar un
cargo posterior sobre un comprobante ya pagado. Conserva los importes nuevos ingresados, suma su propio movimiento
de deuda y no modifica ni imputa el total del comprobante de origen. El vínculo queda en el detalle y el PDF.

La API vuelve a comprobar que ambos sean tipos internos, que el origen tenga impacto de deuda y esté emitido, que
sea del mismo cliente y que la fecha del débito no sea anterior. Usa la referencia existente por ID y su copia de
sigla, manteniendo los reintentos idempotentes y el permiso de emisión de deuda configurada. No cambia los circuitos
de crédito cancelatorio, recibos ni emisión directa sin referencia. La clasificación usa tipos configurables para
que corregir la sigla de FC no rompa la posibilidad de referenciarlo.

**Base:** Rocío debe aplicar `database/cuenta-corriente/17_debito_interno_referencia.sql` después de la migración 16.
Es idempotente; amplía el CHECK de referencias y conserva las FK y el disparador de la sigla. No modifica datos ni
importes existentes. El script no se ejecutó contra la base compartida.

**Verificación local:** API compilada y pruebas de referencia opcional, clientes, fechas, estado, tipos, respuestas
tardías, importes independientes, validaciones C# y restricción SQL ejecutada con SQLite local.

**Probar en la VM:** aplicar 17, recargar con Ctrl+F5 y abrir Emitir Débito. Con D activo, elegir cliente y FC relacionado,
cargar neto $ 100,00 e IVA 21 % y emitir. Verificar D por $ 121,00, referencia al FC en el detalle y PDF, aumento de
la deuda total del cliente en $ 121,00 y total original del FC sin cambios. Repetir «Sin vincular». Cambiar de cliente
y comprobar que no quedan opciones del anterior. Intentar un FC de otro cliente, un origen anulado o fiscal y una
fecha anterior al FC: debe rechazar sin emitir ni consumir número. Reintentar con la misma clave: debe devolver el
mismo D sin duplicar deuda; con otro vínculo y la misma clave, debe rechazar.

---

## 54. Corregir los acentos del concepto de recibos sin imputar — Código listo (27/10), datos corregidos (28/10)

La versión anterior de `RecibosController` tenía mal escrito el literal generado de «Cobranza sin imputación».
La fuente actual contiene el acento correcto; la página ya declara UTF-8. Recompilar la API evita volver a guardar
el texto incorrecto, pero no cambia los conceptos persistidos por versiones anteriores.

`database/cuenta-corriente/18_corregir_concepto_recibos.sql` propone corregir únicamente ese texto exacto en recibos
y sus movimientos de emisión. Utiliza caracteres Unicode por código, comparación binaria y largo exacto; conserva
conceptos personalizados, otros tipos de comprobante, reversos e importes. Muestra los registros afectados y sus
cantidades y termina con ROLLBACK. **Aplicado el 28/10 por Rocío:** corrigió el recibo 49 y su movimiento 47, y el
diagnóstico (`database/verificacion/01_scripts_corridos.sql`) da 0 y 0.

**Verificación local:** expresión C# real compilada para recibos con cero, una y dos aplicaciones; UPDATE reales
adaptados a SQLite en memoria con casos protegidos, idempotencia y reversión. Sin consultar la base compartida.

**Probar en la VM:** recompilar la API y emitir un recibo sin imputar: debe decir «Cobranza sin imputación». Después
revisar el recibo 49, ya corregido, en la cuenta corriente, el detalle, el PDF y el Excel. Los nombres de clientes y
los conceptos ingresados a mano deben conservarse.

---

## 55. Ordenar columnas de choferes y camiones — Hecho en código (27/10)

Gestionar y Listar choferes muestran DNI, Apellido y nombre, Fecha de alta, Estado y Acciones, sin ID. Las tres
primeras columnas permiten ordenar antes de paginar y exportar. Gestionar y Listar camiones ocultan ID, ubican Fecha
de alta después de Modelo y permiten ordenar Marca y Fecha de alta. Usan `SGTL.tabla.habilitarOrden` y los criterios
permitidos por la API. La compilación de la API y las 76 pruebas Node finalizaron correctamente.

**Probar en la VM:** en ambas vistas de cada módulo, alternar cada encabezado, cambiar de página y exportar CSV.
Verificar que se conserva el criterio, que DNI se ordena por su valor y que no aparece la columna ID.

---

## 56. Versionar los archivos del manual de usuario (27/10)

Se incluyen `docs/Manual_SGTL_actualizado.docx`, `docs/Manual_SGTL_portada_nueva.docx` y el script
`database/documentacion/02_reemplazar_manual_version_0003.sql`, que contiene el PDF propuesto para el manual.
El script termina con ROLLBACK: no se ejecutó ni se reemplazó el PDF de la base compartida durante esta sincronización.

**Probar:** revisar las dos variantes Word y, antes de aplicar el script por decisión de Rocío, verificar el tamaño,
la huella y la vista previa del PDF propuesto. Subir los archivos al repositorio no publica el manual en la aplicación.

---

## 57. Recuperar contraseña desde el login por e-mail — Hecho en código (27/10)

El login incorpora «Olvidé mi contraseña», que pide el e-mail registrado y envía un enlace de un solo uso,
válido por 20 minutos. La solicitud siempre devuelve la misma respuesta general y tiene límites por IP
y por cuenta. La contraseña actual sigue vigente hasta completar el recupero. Se guarda únicamente la
huella del enlace; al usarlo se aplica la política vigente, se guarda PBKDF2, se invalidan los demás enlaces
y las sesiones anteriores y se envía un aviso del cambio sin incluir la contraseña. Una pestaña abierta
comprueba la sesión al cargar, recuperar el foco y cada minuto.

Gestionar usuarios incorpora E-mail obligatorio al registrar o editar, válido y único; las cuentas existentes
sin correo conservan su acceso habitual. Listar usuarios lo muestra en el detalle. La API controla los
permisos de lectura y gestión. El correo se asigna desde gestión: quien lo carga debe verificar que la
casilla pertenece al usuario y que no es compartida. Cambiarlo invalida los enlaces y sesiones previos.
Gestionar e-mail permite asignar un perfil exclusivo de recupero, con conexión segura y la dirección real
del login. La API y la base impiden compartir ese perfil con Facturación o Presupuestos.

**Base:** Rocío debe aplicar `database/seguridad/02_recupero_contrasena.sql` después de seguridad 01 y
`database/email/07_perfil_recupero_contrasena.sql` después de e-mail 06. Son scripts idempotentes de
esquema; no cargan datos ni credenciales. **No se ejecutaron contra la base compartida.** No se regeneró el EDMX.
Recompilar la API y desplegarla junto con los archivos estáticos después de aplicar las migraciones.

**Configuración:** registrar un perfil SMTP nuevo en Gestionar e-mail y asignarlo a recupero. Cargar la URL
completa y accesible del login con HTTPS; solo en pruebas locales se acepta HTTP en localhost. La casilla
y las credenciales se cargan desde la pantalla, nunca en el código. El asunto, las instrucciones y el enlace
se generan automáticamente; la plantilla general del perfil no los reemplaza.

**Verificación local:** compilación de la API y pruebas del coordinador C# real con repositorio y correo
simulados; consultas reales adaptadas a SQLite local; pruebas de formularios, doble clic, política, correos
inválidos, fallo SMTP, consumo único, vencimiento, cuenta inactiva, permisos, exclusividad y versión de sesión.
Las 78 pruebas Node finalizaron correctamente. Se revisó la lista de control de AGENTS.md.
Sin consultar la base compartida ni enviar correos. La revisión visual no pudo ejecutarse porque no hay
navegador ni servicio de control de ventanas disponibles en este entorno.

**Probar en la VM:** después de aplicar los scripts, registrar el perfil seguro y su URL. Con un administrador,
registrar o editar un usuario con una casilla de prueba propia; comprobar el rechazo de correo inválido y
duplicado. Con un usuario que solo puede listar, abrir el detalle y comprobar que no puede cambiar el e-mail
desde la API. Con uno sin permiso de usuarios, comprobar el rechazo de la lectura del detalle y de la escritura.
Intentar asignar el perfil de Facturación a recupero y viceversa: debe rechazarlos sin cambiar asignaciones.
Solicitar el recupero desde el login: llega el enlace, conserva la contraseña actual hasta usarlo y no informa
si existe un e-mail desconocido. Probar claves que no coinciden y una que no cumple la política. Completar
con una válida: la anterior ya no entra, la nueva sí y llega el aviso. Una sesión de otro navegador debe volver
al login al recuperar el foco o dentro de un minuto; su Bearer anterior debe recibir 401. Volver a usar el
enlace, probar uno vencido, cambiar el e-mail y probar uno anterior, e inactivar la cuenta antes de usarlo:
ninguno debe permitir el cambio. Comprobar formularios en 1920, 1366, 768 y 390 px. La entrega SMTP real,
la ejecución de las migraciones y esta prueba en VM siguen pendientes.

**Unificación del 28/10:** los botones de los perfiles de Facturación, Presupuestos y recupero de contraseña
dicen «Guardar», siguiendo el criterio de configuración del design system. **Probar:** recargar Gestionar e-mail
con Ctrl+F5 y comprobar el mismo texto en los tres perfiles; al guardar, el botón muestra «Guardando…».

**Aviso del login (28/10):** el error de credenciales usa el aviso rojo compartido, con ícono y texto en negrita.
Una sacudida breve de 380 ms lo destaca al aparecer y respeta la preferencia de reducir movimiento. La regla queda
documentada en el design system y AGENTS.md. **Probar:** recargar el login con Ctrl+F5 e ingresar credenciales
incorrectas: el aviso debe aparecer arriba de los campos, animarse una vez y quedar quieto. Repetir el intento:
debe volver a animarse. El error de credenciales **no se va solo** (Rocío, 28/10, al integrar esta rama en
rocionuvoli: solo los avisos de éxito se van solos): queda hasta que se escribe en el usuario o la contraseña, y si el
próximo intento vuelve a fallar aparece de nuevo. Con movimiento reducido activado, debe aparecer sin animación. Los campos vacíos conservan
sus errores de validación y el aviso «Revisá los campos marcados.».

---

## 58. WhatsApp en viajes (rama de Fede) — INTEGRADO EL 28/10, PENDIENTE DE PROBAR EN LA VM

Fede subió a `fedemontenegro` un commit (`aae91a7`, 28/10) con el reenvío de la hoja de ruta y los avisos al chofer al
cancelar, eliminar y cambiar el chofer. Partió de la rama del 25/10, sin nuestro Cancelado del 27/10, e hizo uno propio: el
merge dio 19 trozos en conflicto (viajes, design system y `AGENTS.md`), que Rocío decidió uno por uno. Quedó:

- **Cancelado:** el nuestro (Cambiar estado, con motivo, reactivación y presupuesto). Sin el botón "Cancelar" de Fede.
  Al cancelar se le avisa al chofer (`viaje_cancelado`); al reactivar, se le reenvía la hoja de ruta (Rocío, 28/10).
- **Reenviar WhatsApp:** en la fila, en el lugar de los envíos (Ver detalle · Editar · Reenviar WhatsApp · Cambiar estado ·
  Eliminar), solo con chofer y con el viaje Registrado o En viaje; la API controla lo mismo. La confirmación nombra al
  chofer y el error queda dentro de ella. La regla del orden cambió en `AGENTS.md` y en el §1.4 del design system.
- **Cambio de chofer:** al anterior, `viaje_desasignado`; al nuevo, la hoja de ruta. También con el viaje en curso. El
  formulario lo dice antes de guardar.
- **Eliminar:** el aviso sale después de borrar (como lo mezcló git, salía antes del control de gastos). Los textos de la
  API, con el formato del design system ("No se puede eliminar el viaje: viene del presupuesto #12.").
- **Avisos que fallan:** terminan con "Avisale por otro medio.", como el que ya había.
- **Script de Fede:** el `UPDATE` del final pasó a `sp_executesql`: tal como estaba, la primera vez fallaba entero ("Invalid
  column name"), porque SQL Server compila el lote antes de agregar las columnas. El diagnóstico
  (`database/verificacion/01_scripts_corridos.sql`) lo mira en la fila 14.

**Aplicado el 28/10 por Rocío:** `database/whatsapp/02_plantillas_cancelado_y_desasignado.sql`, ya con el arreglo; la fila
1 de `WHATSAPP_CONFIG` tiene `viaje_asignado`, `viaje_cancelado` y `viaje_desasignado`, en `es_AR`. **Antes de probar:**
recompilar la API y Ctrl+F5. Las
plantillas `viaje_cancelado` y `viaje_desasignado` (6 variables) tienen que estar aprobadas en Meta: sin ellas cancelar,
eliminar y cambiar el chofer funcionan, pero el WhatsApp no sale y queda en `App_Data/whatsapp.log`. Avisarle a Fede lo que
cambió de su commit (el Cancelado, el lugar y los estados de Reenviar WhatsApp, el aviso después de borrar y el script).

**Probar en la VM:** la ronda 6 de `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md`, aparte y cuando el resto esté
OK (Rocío, 28/10), con el token del día, las plantillas aprobadas y choferes con celulares del equipo. En la Mac no se
compiló la API; las pruebas de Node de viajes dan OK.

---

## 59. Ronda 1 de pruebas del 28/10 (login, sesión, recupero, usuarios y el chofer) — PROBADA; ARREGLOS HECHOS, FALTA REPROBAR

Reporte: `docs/pruebas/2026-10-28-pruebas-ronda-1.md` (VM sobre `3c37749`). 52 controles: 38 OK, 7 fallas y 7 no probados.
La API compila sin errores y pasan las 80 pruebas de Node y la de PowerShell. Usuarios, roles, grupos, los permisos de
`GET`/`PUT` y el alta del chofer con su usuario funcionan. El chofer de la demo pasa a ser **dquiroga** (chofer 12),
con el celular de Rocío, en lugar de rjuarez.

**Arreglado el 28/10** (Rocío: "hacé los arreglos de 'hacer ya'"; ella le avisa a Facu de lo que toca de su módulo):
- **F1 (alta):** una sesión invalidada (cambio de e-mail o de contraseña, usuario inactivo) no volvía al login en el otro
  navegador. El rechazo del control de sesiones de Facu (`Security/SesionesRecupero.cs`) salía antes de que Web API sume el
  permiso de CORS (su handler se agrega al final), así que el navegador lo bloqueaba y la pantalla lo tomaba como un corte
  de conexión. Ahora el rechazo agrega `Access-Control-Allow-Origin` (la misma política de `WebApiConfig`). De paso, M11:
  un cambio sin permiso dice "No tenés permiso para modificar usuarios.".
- **F4:** un error 500 devolvía el detalle técnico (excepción, SQL, rutas del servidor). Ahora ninguno lo devuelve
  (`IncludeErrorDetailPolicy.Never` en `WebApiConfig.cs`). En Registrar o Editar chofer, si las localidades no cargan,
  el error va debajo de Localidad ("Localidades sin cargar: volvé a elegir la provincia.").
- **F6:** Ver detalle del usuario chofer (Listar usuarios) dice qué chofer tiene ("Chofer: Quiroga, Darío (DNI …)");
  `GET api/Usuarios/{id}` lo trae.
- **F7:** con el chofer inactivado, la hoja de ruta muestra solo el aviso (sin "No se pudo cargar tu hoja de ruta.") y
  cualquier sesión que la API rechaza (401) se borra del navegador antes de ir al login (`SGTL.mensajeError`).
- **DS2:** los avisos de "Olvidé mi contraseña" y "Restablecer contraseña" en rojo, como los de los demás modales.
- **DS5:** "El rol Usuario necesita al menos un grupo…" (decía "rol user").
- **DS8:** en Editar chofer, al completar el acceso, el E-mail muestra el asterisco.
- Docs: `docs/equipo/PRUEBAS-VM-CLAUDE.md` (la VM puede hacer `git pull`, M15; Node es el de Visual Studio, M14) y
  `docs/equipo/INSTRUCTIVO-CUENTAS-CHOFERES.md` (dquiroga).

**F2 (alta), sin código:** el correo del recupero no sale desde la VM porque la contraseña SMTP la guardó otra máquina
(§40, punto 2). Para el 29/10, Rocío guarda la contraseña de los tres perfiles de e-mail desde la máquina que va a mostrar
el sistema. De fondo: una clave común fuera del repo, con Facu.

**Queda pendiente (después de las pruebas):**
- F3 (usuarios sin token), DS4 y M7 (vencimiento de la sesión): §40, punto 1.
- F5: Auditoría de grupos: el alta del grupo no se registra, los cambios de permisos y miembros figuran como "sistema" y
  cada guardado borra y vuelve a crear todo (`GruposController.cs`; con Facu).
- DS1, DS3, M1 y M3 (login y recupero): §40, punto 10.
- DS6 y DS7 (Gestionar usuarios): todos los campos con problema marcados juntos, el error de la contraseña debajo del
  campo (validado en la pantalla) y "Tenés cambios sin guardar" al cancelar.
- M4 (avisar al pasar un chofer a Usuario: "Al guardar, deja de estar vinculado a …"), M5 (la lista "Chofer" de Gestionar
  usuarios ofrece choferes inactivos), M6 (Localidad con 504 opciones: el buscador compartido), M8 (dos textos para el
  e-mail inválido), M9 (Editar chofer no propone el nombre de usuario), M12 (la ruedita del login queda girando mientras
  carga la apariencia) y M13 (dos pruebas imprimen acentos rotos).
- M10 (ejemplos con nombres del equipo): con los placeholders (§41, Para más adelante).
- Hora en UTC en Auditoría y en `CHOFERES.Fecha_Alta`: §2.

**Probar en la VM:** la reprueba corta del principio de la ronda 2 de `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md`, y los
puntos del correo (7, 12, 13, 14, 17, 24 y 26) cuando la contraseña SMTP esté guardada desde la VM.

**Limpieza:** mferreyra (usuario 18) y el grupo "Coordinación de tráfico" (9) quedan hasta terminar todas las rondas (sirven
para probar permisos); después, con el SQL del reporte. El grupo viejo "PRUEBA-CLAUDE 20/10" (7) se borra antes del 29/10,
mirando primero qué tiene (consulta del reporte). El chofer 12 y dquiroga quedan: son los de la demo.

---

## 60. Adicionales del viaje de un cliente directo, como en Rukas — SUBIDO, PENDIENTE DE PROBAR EN LA VM (28/10)

Pedido de Rocío (28/10, para mostrarlo el 29/10): a los clientes directos se les cobran **los mismos adicionales que a
QUICKFOOD en Rukas, con los mismos valores**, y la vuelta vacía es un porcentaje del flete que elige administración
tomando a Rukas como referencia. Es la versión reducida de la propuesta del §41, punto 11 (la recorrida y la lista, en
`docs/negocio/RELEVAMIENTO-RUKAS-CLAUDIA.md`, paso 12).

**Cómo quedó:**
- En Registrar y Editar viaje, dentro del bloque Tarifa, **"Adicionales"** con "Agregar adicional". Cada fila: el
  adicional (una lista), la cantidad, un comentario opcional y Quitar adicional. Se cargan también con la tarifa ya fija
  (se conocen después del viaje), como la estadía de antes.
- **Fijos**, en módulos de estadía de la tabla de tarifas del viaje ($ 96.577 en "Tarifas a agosto 2026", un módulo
  cada 6 hs): espera por franja de horas (de 1 a 6 hs, 1 módulo; hasta de 72 a 96 hs, 16), adicional por descarga (1),
  descarga + espera (2), repaletizado (2) y repaletizado + estadía (3), por la cantidad. "Estadía (módulos de 6 hs)" es
  para los viajes de antes, que tenían los módulos cargados a mano: se ven así al editarlos.
- **Vuelta vacía**: 10, 20, 23, 30, 40, 45, 50, 60 o 70 % del flete (el importe de la tarifa, no el total con los otros
  adicionales). Una sola por viaje.
- **Un viaje sin carga no tiene vuelta vacía** (Rocío, 28/10): se cobra solo haber ido a buscar la carga, porque no llegó
  al destino. Al pasar a Sin carga, la vuelta vacía sale de la lista (la tarjeta lo avisa: "Se quita la vuelta vacía: no
  llegó al destino."; queda en Auditoría) y los demás adicionales siguen. En un viaje sin carga no se puede agregar ("Vuelta
  vacía de más: el viaje está sin carga.") y el cálculo nunca la suma. Si vuelve a En viaje, no vuelve sola: se agrega de
  nuevo si corresponde.
- El importe y su detalle: "… tarifa: $ … · adicionales (3 módulos): $ 289.731,00 · vuelta vacía (23 %): $ …". Antes
  decía "estadía (N módulos)"; los importes guardados conservan su texto hasta que se vuelven a calcular. Ver detalle
  del viaje (Gestionar y Listar viajes) muestra la lista, con el comentario.
- **Con plataforma no se ve**: los adicionales vienen de Rukas en el Excel de la proforma (la API rechaza una lista en
  esos viajes). La estadía que ya tuviera un viaje con plataforma se conserva.
- La API valida la lista (los mismos textos que la pantalla, debajo de cada campo) y calcula los módulos y el porcentaje
  con ella, no con lo que mande la pantalla. Los recálculos (orden del día, cambio de tabla de tarifas, revisar una
  proforma y Sin carga) conservan los adicionales.
- Base: `database/viajes/04_adicionales_del_viaje.sql` agrega `VIAJES.Vuelta_Vacia_Porcentaje` y `VIAJES.Adicionales`
  (la lista en JSON), fuera del EDMX; `VIAJES.Estadia_Modulos` pasa a ser el total de módulos de los fijos. El diagnóstico
  (`database/verificacion/01_scripts_corridos.sql`) lo mira en la fila 21.
- Archivos: `TarifarioCalculo.cs` (la lista, `LeerAdicionales` y la vuelta vacía en `SumarAdicionales`),
  `ViajesController.cs`, `OrdenDelDia.cs`, `TarifarioImpacto.cs`, `TarifarioRevisar.cs`, `TarifarioController.cs`,
  `gestion-viajes.html` y `viaje-detalle.js`; `tests/viajes-flujo.test.js` actualizado.
- Probado en la Mac con la API simulada: carga, importe (espera 6 a 12 hs con comentario, descarga y vuelta vacía 23 %:
  la cuenta da), guardado, volver a abrir, Ver detalle, los tres errores, el bloque oculto con plataforma y sin errores en
  la consola. 69 pruebas de Node OK. **El C# no se compiló en la Mac.**

**Para decidir después (con Claudia o con Facu):**
- En la proforma, los adicionales van **dentro del importe del viaje**, en su misma línea; la línea aparte, como los de
  Rukas, toca Traer viajes (Facu).
- La lista y los valores están en el código (`TarifarioCalculo.AdicionalesFijos` y `ADICIONALES` en la pantalla): que
  salgan de la tabla de tarifas va con la tabla dinámica (§42). Los presupuestos no tienen adicionales.
- La espera que salga sola con las horas que registra el chofer (§41, punto 11).

**Cómo probarlo en la VM:**
1. **Antes de recompilar**, correr `database/viajes/04_adicionales_del_viaje.sql` (primero con `@Aplicar = 0`, después
   con `1`): al final, "OK" en las dos. El diagnóstico dice "Corrido" en la fila 21. **Aplicado por Rocío el 28/10**
   ("OK" en las dos; 2 viajes con módulos de estadía, que se ven como "Estadía").
2. Recompilar la solución y Ctrl+F5.
3. Gestionar viajes → Editar un viaje directo con tabla de tarifas: debajo de la tarifa, "Adicionales", "Agregar
   adicional" y la ayuda ("Módulo de 6 hs: $ 96.577,00. La espera corre después de…"). Agregar "Espera entre 6 y 12 hs"
   con un comentario, "Adicional por descarga" y "Vuelta vacía" con 23 %: la línea del importe suma "adicionales (3
   módulos): $ 289.731,00" y "vuelta vacía (23 %)" (el 23 % de la tarifa). Guardar: "Viaje guardado.".
4. Volver a abrirlo: las tres filas como se cargaron. Ver detalle (también desde Listar viajes): "Adicionales" con la
   lista y el comentario, y el mismo importe.
5. Una fila sin elegir, una cantidad 0 y dos vueltas vacías: el error debajo de cada uno ("Adicional sin elegir…",
   "Cantidad de 1 a 99.", "Vuelta vacía repetida…") y "Revisá los campos marcados."; no guarda.
6. Quitar todos los adicionales y guardar: el importe vuelve a ser el de la tarifa sola.
7. Un viaje con plataforma: no hay bloque de adicionales y guardarlo no cambia su importe. Un viaje directo de antes con
   módulos de estadía: aparece como "Estadía (módulos de 6 hs)" con esa cantidad.
8. **[cruce]** Un viaje En viaje con una espera y vuelta vacía → Cambiar estado → Sin carga: la tarjeta dice "Se quita la
   vuelta vacía: no llegó al destino."; al guardar, el importe es el porcentaje sin carga más la espera, Ver detalle ya no
   lista la vuelta vacía y Auditoría dice "Vuelta vacía quitada". Editarlo y agregar una vuelta vacía: "Vuelta vacía de
   más: el viaje está sin carga.". Volver a En viaje: la espera sigue y se cobra la tarifa completa más la espera.
   Registrar proforma → Traer viajes: la línea del viaje trae el importe con los adicionales.
9. Design system del bloque (botón con texto, Quitar solo ícono con tooltip, textos con voseo) a 1366 y 390 px.

---

## 61. Pasar `rocionuvoli` a `main`, `facugodoy` y `fedemontenegro` — FACU Y FEDE PASADOS (28/10); `main` ESPERA LA RONDA 2

Rocío (28/10): "cuando la ronda 2 dé OK pasamos rocionuvoli a main, facugodoy y fedemontenegro, y anotamos en pendientes
las rondas que faltan". Así las cuatro ramas quedan iguales para la reunión del 29/10. **`main` pasa sin todas las
pruebas**, como en la §32 (la regla es pasar a `main` solo lo probado): lo que falta está abajo.

**Cambio de Rocío (28/10, a la noche), para no frenar a los chicos:** "Cuando la VM compile sin errores, pasá rocionuvoli
a facugodoy y fedemontenegro; main espera a la ronda 2." No quedaban scripts por correr (`viajes/04` aplicado por Rocío) y
la VM recompiló `dc3e581` con 0 errores. **`facugodoy` y `fedemontenegro` pasan por avance directo al commit de esta
nota** (no tenían commits propios; ninguno subió nada desde la mañana). Les llega sin probar en la VM lo de la ronda 2
(adicionales, sin carga, precio por orden del día y ocupados) y los arreglos de la ronda 3 (§62). Si la ronda 2 encuentra
algo, se arregla en `rocionuvoli` y se les vuelve a pasar.

**Condición para `main`:** la reprueba corta de la ronda 1 y la ronda 2 (K, L, M y Q) de
`docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md` OK en la VM, con `database/viajes/04_…` corrido antes de recompilar (ya está).
Si hay fallas, se arreglan en `rocionuvoli`, se reprueban y recién ahí se pasa.

**Al 28/10**, ninguna de las tres tiene commits que no estén en `rocionuvoli` (`facugodoy` está 70 atrás,
`fedemontenegro` 108 y `main` 109): pasan por avance directo, sin conflictos. Lo último de Facu (login, `5642c4e`) y de
Fede (WhatsApp en viajes, `aae91a7`) ya está integrado.

**Cómo se pasa (en la Mac):**
1. `git fetch origin` y, para cada rama, `git log rocionuvoli..origin/<rama>`. Si Facu o Fede subieron algo después, se
   integra primero en `rocionuvoli` (los conflictos, de a uno con Rocío) y se reprueba lo que toque.
2. Lo que esté sin commitear en la Mac se commitea antes; si no, queda afuera.
3. Listar los commits que salen, avance directo de las tres al mismo commit de `rocionuvoli` y push.
4. Avisarles a Facu y a Fede que hagan `pull` y recompilen (en la base no tienen que correr nada: los scripts ya están
   aplicados). A Facu, además: los arreglos de la §59 tocan su `Security/SesionesRecupero.cs` (F1) y `WebApiConfig.cs`
   (F4).
5. Anotar acá el commit y la fecha, y pasar esta sección a "PUSHEADO".

**Lo que llega a `main` sin probar** (para después del 29/10, en el orden del instructivo del 28/10):
- [ ] Ronda 3 (E, F, G y P): tipos de comprobante, cuenta corriente, proformas y lo que quedó de la demo; es la
  integración de Facu (§44 a §56). Emite comprobantes: con el OK de Rocío en cada paso. **Probada en parte el 28/10 e
  interrumpida** (§62): falta lo que dice "Qué falta" del reporte.
- [ ] Ronda 4 (N y O): hoja de ruta del chofer y control interno con el galpón (§36, §37 y §41).
- [ ] Ronda 5 (D, H e I): orden de las tablas, cruces y recorrida general.
- [ ] Ronda 6 (J): WhatsApp en viajes de Fede (§58), con Rocío porque manda mensajes reales; antes, las plantillas
  aprobadas en Meta.
- [ ] Los puntos del correo de la ronda 1 (7, 12, 13, 14, 17, 24 y 26 de la §59), cuando la contraseña SMTP esté guardada
  desde la máquina que manda el correo.

---

## 62. Ronda 3 de pruebas del 28/10 (facturación) — INTERRUMPIDA; PROPUESTAS PARA DECIDIR CON ROCÍO

Reporte: `docs/pruebas/2026-10-28-pruebas-ronda-3.md` (VM sobre `78d2ef5`). 59 controles: 35 OK, 5 fallas y 19 no
probados, la mayoría por el corte: a las 21:40, mientras se probaba, Facu renombró siglas en la base compartida (FC A →
FI A, con sus 5 comprobantes; las de C, ida y vuelta) y Rocío cortó la ronda. Cuenta corriente (parte F) funciona casi
entera: emisión directa, crédito, débito, crédito y recibo sin imputar, imputación acumulativa y repetida sin duplicar,
los rechazos de la API y la anulación de un recibo imputado.

**Lo urgente para el 29/10:**
- **Las siglas que cambió Facu:** fue una prueba (Rocío, 28/10), pero renombrar una sigla es un caso real. Facu vuelve
  FI a FC antes de la reunión. Emitir el comprobante desde una proforma preseleccionaba "D · Débito interno" porque
  `facturacion-proforma.js` busca la sigla `FC` y, si no estaba, elegía otro tipo de deuda.
  **Arreglo chico hecho en la Mac (28/10), falta probar en la VM:** sin FC no propone ninguno (salvo que haya uno solo) y
  el mensaje dice "La proforma está lista. Seleccioná el tipo de comprobante para emitir."; con FC, como antes. El
  arreglo de fondo, que no dependa de la sigla, es la §63.
  **Cómo probarlo:** Ctrl+F5 (es solo el front). Gestionar proformas → una aceptada → Emitir comprobante: FC elegido y
  Emitir habilitado, como siempre. Con el OK de Rocío, inactivar FC A y FC B un momento (como en la ronda 3, fila 24):
  el tipo queda en "Seleccioná un tipo", Emitir deshabilitado y el mensaje de arriba; al elegir otro tipo carga su letra,
  sucursal y número. Cancelar sin emitir y volver a activar FC.
- Que nadie cambie la configuración de facturación hasta la reunión (M9).
- La contraseña SMTP guardada desde la máquina que va a mostrar el sistema: falla también el perfil de Facturación
  (F2 de la §59).

**Fallas: causa y propuesta.** Son pantallas de Facu, salvo Generar proforma: Rocío decide y le avisa.
- **F1, Generar proforma sin confirmación.** `generarProforma` (`gestion-facturacion.html`) guarda y genera sin
  `SGTL.confirmar`; Marcar aceptada y Anular la tienen, y la de Rukas confirma en el pie. **Hecho en la Mac (28/10), falta
  probar en la VM:** "¿Generar la proforma?" / "Se le asigna el próximo número de proforma y deja de ser un borrador.",
  con Cancelar · Generar, encima del modal de la proforma. Visto con la API simulada: al cancelar no se guarda ni se
  genera y el modal sigue abierto. **Cómo probarlo** (Ctrl+F5): Editar un borrador → Generar proforma → aparece la
  confirmación; Cancelar → sigue el borrador abierto, sin número. Generar solo con el OK de Rocío (consume un número).
- **F3, el recibo pisa el importe.** Al tildar una deuda, Aplicar tomaba su saldo entero y `actualizarResumenRecibo`
  reescribía el importe con la suma de lo aplicado (también al escribir en Aplicar). Venía del código del 15/10; el diseño
  de Facu dice que el importe de la forma de pago es el monto a distribuir y que marcar o escribir a mano recalcula solo lo
  aplicado y la diferencia (`docs/diseno/cuenta-corriente-diseno.md` y `cuenta-corriente-distribucion-diseno.md`).
  **Hecho en la Mac (28/10), falta probar en la VM** (Rocío le avisa a Facu): mientras el importe no lo escribió el
  usuario (vacío o en 0), acompaña a lo tildado, como antes; escrito, queda fijo y Aplicar sugiere lo que falta
  distribuir, sin pasar del saldo de la deuda (si ya no falta nada, el saldo, y la diferencia lo muestra). Si se borra el
  importe, vuelve a acompañar desde el próximo tilde. "Distribuir" no cambia. `tildarDeudaRecibo` en
  `cuenta-corriente-clientes.js`; prueba en `tests/recibos-imputacion-front.test.js`.
  **Cómo probarlo** (Ctrl+F5; sin emitir, salvo que Rocío lo autorice), Registrar recibo de un cliente con deudas:
  1. Sin escribir el importe, tildar una deuda: Aplicar y el importe toman su saldo; destildarla: vuelven a 0.
  2. Escribir un importe menor que el saldo (como los $ 50.000 de la ronda 3) y tildar la deuda: Aplicar sugiere ese
     importe y el importe no cambia; Diferencia $ 0,00.
  3. Tildar otra deuda: Aplicar sugiere su saldo, la Diferencia queda negativa y Emitir recibo dice "El total aplicado no
     puede superar el total del recibo.".
  4. Escribir un importe mayor que el saldo: Aplicar toma el saldo y la Diferencia es lo que queda sin imputar.
  5. Editar a mano un Aplicar: el importe escrito no cambia. "Distribuir" reparte el importe por vencimiento, como antes.
- **F2, Imputar no aparece en C-4 y C-5.** En el código no falta: con un crédito aplicado (impacto C, saldo 0) el botón
  sale deshabilitado con "ya está aplicado por completo" (probado con la función de la pantalla). Solo desaparece si la
  fila llega sin impacto C. **Mirar los datos antes de tocar código** (consulta de abajo).
- **F6, Anular en créditos y deudas.** El botón dice "Anular recibo" y el motivo, "se corrige con una nota de crédito",
  aunque no haya NC. **Hecho en la Mac (28/10), falta probar en la VM:** el botón dice "Anular comprobante" (los recibos
  siguen con "Anular recibo"); en un crédito configurable, "No se puede anular el crédito: solo se anulan los recibos"; en
  una deuda configurable, "No se puede anular el comprobante: se corrige con un crédito". FAC, NC y ND quedan como
  estaban. **Cómo probarlo** (Ctrl+F5): Gestionar cuenta corriente de Logística Pampeana → el globito de Anular en el
  FC-7, el D-3 y el C-5 (este, desplegando las aplicaciones del FC-7).
- **F4, "Pendiente" en créditos y recibos con saldo.** Lo arma la API (`EstadoFinanciero` en
  `CuentaCorrienteController.cs`). Propuesta: "Sin imputar", "Parcialmente imputado" y "Aplicado", como en Comprobantes
  sin relacionar, revisando el filtro Estado. **Después del 29/10, con Facu.**
- **F5, Eliminar un recibo anulado.** No es nuevo: es así desde el merge de Facu del 22/10 (§21, "Eliminar uno anulado →
  'Recibo eliminado.'"). Si se quiere conservar los anulados (el número ya se consumió), se decide con Facu. **Dejarlo y
  preguntarle.**

**Design system (DS1 a DS8):** se aplica igual en las pantallas de Facu. **Hechos en la Mac (28/10), falta probar en la
VM:** M5 (Marcar aceptada dice "Queda lista para emitir el comprobante.": la profe no quiere "factura") y DS7 (todas las
etiquetas del formulario de la proforma con `for`, no solo las cinco del reporte; Otros impuestos también). **Cómo
probarlo** (Ctrl+F5): Marcar aceptada en una generada → leer la confirmación y cancelar; en Registrar proforma, hacer clic
en cada etiqueta: el cursor va a su campo.
**Después del 29/10:** DS1 a DS6 y DS8 (aviso arriba y errores debajo de cada campo, Ver comprobante y Ver recibo con
`.sgtl-dato`, el N° como texto, el globito de Emitir y el motivo del siguiente paso en proformas facturadas).

**Mejoras:** M1, M2, M3, M4 y M7, para después, a la lista de Facu (§40, punto 5). M6 es la §2 (hora UTC). M8, con la
limpieza (`docs/equipo/INSTRUCTIVO-LIMPIEZA-VIAJES.md`, paso 3). M9: antes de otra ronda de facturación, acordar con Facu
una franja sin cambios de configuración.

**Limpieza:**
- **Antes de la demo, por pantalla:** anular la PF-00000005 (reserva el viaje #5) y eliminar CR B, CR A y el
  Numerador CR (aparecen en Emitir crédito). Las siglas, con Facu.
- **Decidir con Facu:** los comprobantes 51 a 57 de Logística Pampeana (son verosímiles: pueden quedar para la demo) y el
  FC-A-0001-00000004 "Comprobante interno de prueba" del 27/10, que va con la limpieza de la facturación (§38).
- **No molesta:** el intento de envío que falló.

**Consulta de solo lectura para F2** (SSMS):

```sql
SELECT Comprobante_ID, Tipo, Letra, Impacto, ComprobanteReferenciaID, Estado, Total
FROM dbo.COMPROBANTES
WHERE Comprobante_ID IN (53, 55);
```

**Qué falta de la ronda 3:** lo de "Qué falta" del reporte. La parte E (puntos 8 a 12), cuando Facu confirme las siglas;
G2 y P3, después de la ronda 2.

---

## 63. Tipo de comprobante predeterminado por uso — PROPUESTA (28/10), PARA VER CON FACU DESPUÉS DEL 29/10

Rocío (28/10): "anotá la propuesta del tipo predeterminado en pendientes para verla con Facu después del jueves". Sale de la
ronda 3 (§62): Facu renombró FC a FI para probar y Emitir comprobante desde una proforma propuso "D · Débito interno".
Renombrar una sigla es un caso real, así que qué se propone al emitir no puede depender de la sigla. Para el 29/10 alcanza
con el arreglo chico de la §62 (sin FC, no se propone otro).

**Cómo está hoy (diseño de Facu, §44 a §48):**
- Cada sigla es una fila de `TIPOS_COMPROBANTE` con un ID fijo (`TipoComp_ID`), su descripción, su impacto (deuda o
  crédito) y "Es comprobante electrónico". Sus letras A y B son filas de `FACTURACION_TIPOS_COMPROBANTE`, con sucursal y
  numerador.
- Cambiar la sigla la cambia en cascada (`ON UPDATE CASCADE`) en comprobantes, movimientos, vínculos con proformas y
  numeradores, y conserva los ID. FAC, ND, NC y REC son fijas.
- Entre los tipos de deuda, nada distingue el comprobante del servicio de un débito; Facu lo anotó en la §48 ("El catálogo
  todavía no distingue facturas internas de débitos internos"). Por eso cada pantalla propone una sigla escrita en el
  código: la proforma, FC (`facturacion-proforma.js`, `tipoPropuesto`); Emitir crédito, C; y Emitir Débito, D (con ND si
  no hay D) (`cuenta-corriente-clientes.js`, al cargar los tipos).

**Propuesta:** en la sigla, como la descripción y el impacto, el dato **"Se propone en"**: Emitir desde una proforma,
Emitir Débito, Emitir crédito o ninguno. Como queda en la fila de la sigla, renombrarla no lo cambia.
1. **Base:** script nuevo `database/cuenta-corriente/19_…` (idempotente): una columna en `TIPOS_COMPROBANTE` que acepta
   solo esos tres usos, con un índice único filtrado (una sigla por uso), y la marca inicial en FC, D y C si existen.
2. **API** (`FacturacionConfiguracionController.cs`, con SQL directo, sin tocar el EDMX): los tres listados de tipos para
   emitir (`tipos-emision-directa`, `-debito` y `-credito`) dicen cuál es el predeterminado. Al guardar un tipo, el uso
   tiene que corresponder al impacto: la proforma y Débito, con una deuda; crédito, con un crédito. Como en los listados de
   hoy, ND no va en la proforma y REC no va en crédito.
3. **Pantallas:** Gestionar tipos de comprobante muestra y edita "Se propone en" (en el formulario y en el detalle del
   tipo). La proforma y los modales de crédito y Débito proponen el marcado; si no hay ninguno, "Seleccioná un tipo",
   salvo que haya un solo tipo.
4. **Pruebas:** `tests/facturacion-proforma.test.js` y las de cuenta corriente que hoy esperan FC, C y D; una nueva para
   la regla de la API.

**Para decidir con Facu:**
- Si "Se propone en" se puede cambiar en un tipo marcado como electrónico (hoy esa marca bloquea todo lo demás del tipo).
- Si lo hace él en `facugodoy` o se hace en `rocionuvoli` y le llega cuando se pasen las ramas.
- Si también sirve para Emitir comprobante directo (hoy ofrece todos los de deuda, D incluido, y no propone ninguno).

**Probar en la VM** (cuando esté hecho): correr el `19` antes de recompilar; marcar FC para la proforma, renombrarlo y ver
que se sigue proponiendo; quitarle la marca y ver "Seleccioná un tipo"; intentar marcar un crédito para Débito o dos siglas
para el mismo uso (la API lo rechaza con el error debajo del campo); lo mismo en Emitir crédito y Emitir Débito. Con eso
se completa también la E4 de la ronda 3 (cambiar la sigla de FC con viajes facturados).
