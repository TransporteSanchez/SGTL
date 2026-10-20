# Parte 5 — Pruebas del sistema e implementación

> Borrador del 20/10/2026. Los casos y resultados salen de los reportes reales de `docs/pruebas/`
> (rondas del 17, 18 y 19/10/2026 en la máquina virtual). No se inventaron resultados: lo que no se
> ejecutó figura como **Pendiente**.

---

## Pruebas del sistema

La prueba del sistema verifica que SGTL cumpla los requerimientos funcionales y las reglas de negocio
relevadas. Se prepararon datos de prueba que recorren el circuito completo —desde el registro del
viaje o el presupuesto hasta la factura y su nota de crédito— y los controles de seguridad y
validación. Para la proforma de la plataforma se armaron archivos de Excel con el formato real de
Rukas, uno por caso.

### Responsables de testing

| Rol | Integrante | Responsabilidad |
|---|---|---|
| Tester | Rocío Nuvoli · Claudia Sánchez | Especificar los casos, preparar los datos, ejecutar las pruebas en la máquina virtual y registrar resultados y defectos. |
| Product Owner | Mariel Ferrando | Validar los resultados esperados según los requerimientos. |
| Desarrollo | Facundo Godoy · Federico Montenegro · Rocío Nuvoli | Corregir los defectos de su módulo y preparar la versión para la re-ejecución. |
| Scrum Master | Facundo Godoy | Cargar los defectos en el backlog, priorizarlos y seguir su resolución. |
| Analista funcional | Claudia Sánchez | Definir los casos a partir de las reglas del negocio (circuito de Rukas, proformas) y validar los resultados con la empresa. |

### Proceso de testing

Se aplicaron pruebas de sistema de **caja negra** en dos niveles:

- **Servicios (API):** solicitudes a los endpoints con datos válidos e inválidos, verificando la
  respuesta y el estado resultante en la base.
- **Interfaz:** recorrido de las pantallas en el navegador, verificando mensajes, restricciones,
  consola del navegador y lo que ve cada perfil.

Etapas:

1. Identificar los requerimientos y las reglas de negocio a verificar.
2. Especificar cada caso con sus datos y su resultado esperado.
3. Preparar el ambiente y los datos (marcados `PRUEBA-CLAUDE` para poder limpiarlos después).
4. Ejecutar los casos y registrar el resultado en un reporte por ronda.
5. Registrar los defectos en la lista de pendientes del proyecto, con gravedad y responsable.
6. Re-ejecutar los casos fallidos una vez corregidos.

**Ambiente de prueba:** máquina virtual Windows con Visual Studio (API compilada desde la rama
`rocionuvoli`, igual a `main`) e IIS Express; pantallas servidas con Live Server; base compartida en
Azure SQL; navegador Chrome. Cada ronda empieza con `git pull`, compilación y Ctrl+F5.

### Planificación del testing

| Actividad | Responsable | Fecha |
|---|---|---|
| Recorrida general de las 20 pantallas (línea base) | Tester | 17/10/2026 |
| Verificación de correcciones de seguridad y permisos | Tester | 17/10/2026 |
| Pruebas del merge de presupuestos y de la ronda de mejoras | Tester | 18/10/2026 |
| Pruebas por etapa de la proforma de plataforma y prueba mínima | Tester | 19/10/2026 |
| Pruebas del módulo de cuenta corriente durante su desarrollo | Desarrollo (Facundo Godoy) | 03/10 al 11/10/2026 |
| Corrección de defectos de seguridad (D01–D03) | Desarrollo | Próximo sprint |
| Re-ejecución de los casos fallidos | Tester | Cierre del próximo sprint |

**Criterio de entrada:** la versión compila sin errores y la base de prueba tiene los datos
preparados. **Criterio de salida:** todos los casos del circuito principal aprobados y ningún
defecto de gravedad alta abierto.

### Especificación de casos de prueba

| ID | Caso de prueba | Módulo · tipo | Datos de entrada | Resultado esperado |
|---|---|---|---|---|
| CP01 | Login con credenciales válidas | Acceso · Interfaz | Usuario de prueba | Ingresa al inicio |
| CP02 | La API no devuelve contraseñas | Seguridad · API | `GET /api/Usuarios/Buscar` y `/{id}/Detalles` | Respuestas sin el campo `Contraseña` |
| CP03 | Editar un usuario sin cambiar la contraseña | Usuarios · Interfaz | Usuario de prueba, contraseña vacía | Se guarda y conserva la contraseña anterior |
| CP04 | Permisos por grupo | Permisos · Interfaz | Los 5 grupos | Carga los menús de cada grupo; "Guardar permisos" habilitado solo con la lista cargada |
| CP05 | Menú según el grupo | Permisos · Interfaz | Usuario del grupo Listados | Ve solo los 6 "Listado de…" |
| CP06 | Acceso a la API sin token | Seguridad · API | Endpoint de viajes sin `Authorization` | HTTP 401 |
| CP07 | Alta de cliente con CUIT duplicado | Clientes · Interfaz | CUIT existente | "El CUIT ya está registrado." y no deja guardar |
| CP08 | CUIT con dígito verificador inválido | Clientes · Interfaz | 20-12345678-0 | Rechazo |
| CP09 | Dominio de camión mal formado o duplicado | Camiones · Interfaz | Dominio inválido / ABC123 existente | Mensaje de formato / aviso de duplicado |
| CP10 | Filtro de camiones por fecha de alta | Camiones · Interfaz | 27/07 – 27/07 | Lista los camiones dados de alta ese día |
| CP11 | Alta de viaje de cliente con plataforma sin chofer | Viajes · Interfaz | QUICKFOOD, Sede Quilmes → Sede Banfield | Se registra; distancia de Google (~17 km) y tarifa por km |
| CP12 | Guardar un viaje con campos faltantes | Viajes · Interfaz | Modal vacío | Lista de campos a completar, visible |
| CP13 | Editar un viaje Listo para facturar | Viajes · Interfaz | Viaje #26 | Solo se pueden completar los números de referencia |
| CP14 | Editar un viaje generado desde un presupuesto | Viajes · API | Viaje #31, cambiar km u origen | HTTP 409 con el motivo |
| CP15 | Eliminar un viaje generado desde un presupuesto | Viajes · API | Viaje #31 | HTTP 409; el viaje no se borra |
| CP16 | Alta rápida de origen y destino desde el viaje | Recorridos · Interfaz | "+" de origen con cliente elegido | Abre "Registrar origen" con el cliente; queda elegido al guardar |
| CP17 | Presupuesto: alta, aceptar y generar el viaje | Presupuestos · Interfaz | Cliente de prueba, 15 km, tarifa km #5 | Presupuesto $12.750; al aceptarlo, "Generar viaje" crea el viaje |
| CP18 | Proforma propia: traer viajes | Proformas · Interfaz | QUICKFOOD 01/07–31/10 | Trae solo los viajes habilitados y avisa los que no trajo y por qué |
| CP19 | Cerrar la proforma con cambios sin guardar | Proformas · Interfaz | Proforma con 2 líneas → Cancelar | Aviso "Tenés cambios sin guardar" con Seguir editando / Descartar |
| CP20 | Proforma de plataforma: archivo inválido o repetido | Plataforma · Interfaz | Excel con formato inválido; Excel con transporte repetido | Rechazo con el motivo; no se crea nada |
| CP21 | Proforma de plataforma: importe distinto | Plataforma · Interfaz | Excel 990120 | Línea "Importe distinto" (Rukas $12.500 / SGTL $14.790); Generar deshabilitado |
| CP22 | Registrar reclamo y reemplazar el Excel | Plataforma · Interfaz | Reclamo + Excel 990120 corregido | Ícono de reclamo en el listado; al reemplazar se cierra solo; 2 "Coincide" |
| CP23 | Proforma de plataforma: viaje mal cargado en SGTL | Plataforma · Interfaz | Excel 990130 con el viaje 26 a 990020 | "Sin viaje"; corregido el viaje y vuelto a controlar, 2 "Coincide" |
| CP24 | Generar y facturar la proforma de plataforma | Plataforma + Facturación | Excel 990100 corregido | PF Aceptada; factura neto $44.580 + IVA $9.361,80 = $53.941,80; viajes a Facturado |
| CP25 | Nota de crédito sobre la factura | Facturación · Interfaz | FAC-00000010 | NC por $53.941,80; proforma Anulada; viajes vuelven a Listo para facturar |
| CP26 | Reimportar después de la nota de crédito | Plataforma · Interfaz | Excel 990100 | Se vuelve a importar: 2 "Coincide" |
| CP27 | PDF de proforma propia y de plataforma | Proformas · Interfaz | PF-00000010 y una propia | Plataforma: "PROFORMA DE RUKAS" con N°; propia: "Datos del servicio" |
| CP28 | Consultar la cuenta corriente de un cliente | Cuenta corriente · Interfaz | Cliente con FAC-00000004 | Muestra los comprobantes con su detalle y saldo; abre "Nuevo recibo"; exporta |
| CP29 | WhatsApp al chofer al registrar el viaje | WhatsApp · Interfaz | Viaje con chofer de prueba | Llega la hoja de ruta; si falla, el viaje se guarda y avisa |
| CP30 | Auditoría de una modificación | Auditoría · Interfaz | Editar un camión | Registro `UPDATE` con entidad `CAMIONES` y valores anteriores y nuevos |
| CP31 | Emitir un recibo e imputarlo | Cuenta corriente · Interfaz | Cliente con factura pendiente, recibo por el total | Recibo emitido, factura cancelada y saldo del cliente actualizado |

### Ejecución del testing

| ID | Fecha | Ejecutó | Resultado obtenido | Estado |
|---|---|---|---|---|
| CP01 | 17/10/2026 | Rocío Nuvoli | Ingreso correcto | Aprobado |
| CP02 | 17/10/2026 | Claudia Sánchez | Al inicio de la ronda la API devolvía las contraseñas en texto (F1); corregido y re-ejecutado: sin el campo | Aprobado (re-ejecución) |
| CP03 | 17/10/2026 | Rocío Nuvoli | Se guardó con `Contraseña: ""` y el login posterior funcionó | Aprobado |
| CP04 | 17/10/2026 | Claudia Sánchez | Al inicio daba error 500 en todos los grupos (F3, dato nulo en `MENU`); corregido: los 5 grupos cargan con 200 | Aprobado (re-ejecución) |
| CP05 | 17/10/2026 | Rocío Nuvoli | El usuario del grupo Listados ve los mismos 6 menús antes y después | Aprobado |
| CP06 | 17/10/2026 | Claudia Sánchez | La mayoría de los endpoints responde sin token (solo facturación y correo lo validan) | **Fallido** |
| CP07 | 17/10/2026 | Rocío Nuvoli | "El CUIT ya está registrado." y Confirmar deshabilitado | Aprobado |
| CP08 | 17/10/2026 | Claudia Sánchez | Acepta el CUIT | **Fallido** |
| CP09 | 17/10/2026 | Rocío Nuvoli | Formato: OK; duplicado ABC123: no avisa | **Fallido** (duplicado) |
| CP10 | 17/10/2026 | Claudia Sánchez | 0 resultados con 2 camiones de ese día (desfase UTC) | **Fallido** |
| CP11 | 18/10/2026 | Rocío Nuvoli | Viaje #30, 17,4 km de Google, tarifa por km #5 ($14.790) | Aprobado |
| CP12 | 18/10/2026 | Claudia Sánchez | El texto es correcto pero queda fuera de la vista; corregido y verificado en la ronda siguiente | Aprobado (re-ejecución) |
| CP13 | 18/10/2026 | Rocío Nuvoli | Aviso de Listo para facturar; solo remito, transporte SAP y entrega editables | Aprobado |
| CP14 | 18/10/2026 | Claudia Sánchez | HTTP 409: "El cliente, la ruta, la distancia y la tarifa provienen de un presupuesto aceptado…" | Aprobado |
| CP15 | 18/10/2026 | Rocío Nuvoli | HTTP 409 "No se puede eliminar un viaje generado desde un presupuesto aceptado." | Aprobado |
| CP16 | 18/10/2026 | Claudia Sánchez | Primero fallaba (`bootstrap is not defined`); corregido: origen 7 y destino 8 creados y elegidos | Aprobado (re-ejecución) |
| CP17 | 18/10/2026 | Rocío Nuvoli | Presupuesto #5 por $12.750; aceptado; viaje #31 generado | Aprobado |
| CP18 | 18/10/2026 | Claudia Sánchez | Trajo #25 y #26 y avisó los excluidos (sin número, en otra proforma) | Aprobado |
| CP19 | 18/10/2026 | Rocío Nuvoli | Aviso dentro del modal; Seguir editando y Descartar funcionan | Aprobado |
| CP20 | 19/10/2026 | Claudia Sánchez | Rechazo con la columna que falta / transporte repetido; no se creó nada | Aprobado |
| CP21 | 19/10/2026 | Rocío Nuvoli | 990002 Rukas $12.500 / SGTL $14.790; Generar en gris | Aprobado |
| CP22 | 19/10/2026 | Claudia Sánchez | Ícono y tooltip; al reemplazar, reclamo cerrado y 2 "Coincide" | Aprobado |
| CP23 | 19/10/2026 | Rocío Nuvoli | "Sin viaje" y aviso; corregido, 2 "Coincide" | Aprobado |
| CP24 | 19/10/2026 | Claudia Sánchez | PF-00000010 → FAC-00000010 por $53.941,80; viajes 25 y 26 Facturados | Aprobado |
| CP25 | 19/10/2026 | Rocío Nuvoli | NC-00000003 por $53.941,80; PF Anulada; viajes en Listo para facturar | Aprobado |
| CP26 | 19/10/2026 | Claudia Sánchez | Proforma 30: 2 "Coincide", total $53.941,80 | Aprobado |
| CP27 | 19/10/2026 | Rocío Nuvoli | PDF correctos; en el borrador la fecha sale "—" (sin emisión) | Aprobado con observación |
| CP28 | 17/10/2026 | Claudia Sánchez | Desplegó FAC-00000004 con su detalle, abrió "Nuevo recibo" (sin emitir) y exportó; paginación correcta | Aprobado |
| CP29 | 18/10/2026 | Rocío Nuvoli | La hoja de ruta del viaje #31 llegó al chofer de prueba (confirmado por Federico Montenegro); un segundo envío de prueba también llegó | Aprobado |
| CP30 | 17/10/2026 | Claudia Sánchez | Entidad `CAMIONES` sin sufijo | Aprobado |
| CP31 | 03–11/10/2026 | Facundo Godoy | Recibo emitido e imputado; saldo actualizado (prueba de Facundo Godoy al desarrollar el módulo, Sprint 23) | Aprobado |

### Documentación del resultado

| Resultado | Casos | Porcentaje |
|---|---|---|
| Aprobados (incluye re-ejecuciones) | 26 | 84 % |
| Aprobados con observación | 1 | 3 % |
| Fallidos | 4 | 13 % |
| Total | 31 | 100 % |

#### Defectos registrados

| ID | Defecto | Gravedad | Caso | Acción |
|---|---|---|---|---|
| D01 | La mayoría de la API responde sin token y las contraseñas se guardan sin hash. | Alta | CP06 | Token obligatorio en todos los endpoints y hash de contraseñas (EV01). |
| D02 | La configuración de WhatsApp devuelve el token de acceso de Meta sin pedir sesión. | Alta | — | Ocultar el token y exigir sesión (coordinar con Federico). |
| D03 | La cadena de conexión con contraseña está en el repositorio. | Media | — | Sacarla del repositorio y rotar la contraseña (EV03). |
| D04 | Filtros por fecha comparan en UTC y la grilla muestra hora local. | Media | CP10 | Hora de Argentina en todo el sistema (EV02). |
| D05 | El CUIT no valida el dígito verificador. | Baja | CP08 | Agregar la validación. |
| D06 | El alta de camión no avisa el dominio duplicado. | Baja | CP09 | Validar como en choferes y clientes. |
| D07 | El detalle de listado de viajes muestra IDs en lugar de nombres. | Media | — | Mostrar nombres de cliente, chofer y camión. |
| D08 | Errores de consola de la plantilla (PerfectScrollbar) y 404 de `DashboardLayout` en el inicio. | Baja | — | Corregir la plantilla. |

Corregidos durante las rondas y verificados: contraseñas devueltas por la API (F1), error 500 en
permisos por grupo (F3), alta rápida de origen y destino (F1 del 18/10), aviso de campos faltantes
fuera de la vista (C4) y acciones activas en "Ver" de un borrador de plataforma (F1 del 19/10).

#### Observaciones

- Guardar permisos reescribe todas las filas del grupo aunque no cambie nada (~3 s).
- Las búsquedas distinguen tildes ("Juárez" no encuentra "Juarez").
- Algunos mensajes todavía salen con `alert()` del navegador en lugar de los avisos del sistema.
- El repositorio tiene una copia vieja del proyecto (`repositorio.zip`) que conviene quitar.

#### Conclusión

Se especificaron y ejecutaron 31 casos: 27 aprobados (uno con observación) y 4 fallidos. El
circuito principal funciona de punta a punta para los dos tipos de cliente: registro del viaje,
presupuesto, aviso al chofer por WhatsApp, proforma propia y de plataforma con su control,
factura, nota de crédito, reimportación y cobro en la cuenta corriente. Los defectos abiertos más importantes son de seguridad (D01 a D03) y son la prioridad
del próximo sprint; los casos fallidos se re-ejecutan al cerrarlo.

---

## Implementación

Este capítulo define el plan de puesta en marcha de SGTL en Transporte Sánchez: cómo se pasa de la
operatoria con planillas y Rukas al nuevo sistema, cómo se capacita al personal, cómo se instala y
cómo se acepta el producto. Retoma las tres etapas del plan de 2023 (inicial, migración de datos y
final) y las concreta con el sistema construido.

### Operación con el nuevo sistema

| Modalidad | Ventaja | Desventaja para Transporte Sánchez |
|---|---|---|
| Directo o global | Cambio rápido, sin doble carga. | Si algo falla en la facturación, se frena el cobro del mes. |
| En paralelo | Se comparan los resultados con las planillas. | Duplica la carga de una administración chica durante todo el período. |
| Gradual o encadenado | Cambio progresivo. | Los módulos dependen entre sí (viaje → proforma → factura). |
| Por subsistemas o modular | Se incorpora un área por vez y se capacita por perfil. | Hay que coordinar los módulos ya implementados con los pendientes. |

**Modalidad elegida: por subsistemas, con un mes en paralelo en la facturación.** El personal ya
trabaja con computadora y con Rukas, y el circuito está encadenado: incorporar los módulos en el
orden del proceso reduce el riesgo, y el paralelo de un cierre mensual permite comparar la factura
de SGTL con la que se arma hoy antes de dejar las planillas.

| Etapa | Módulos | Áreas |
|---|---|---|
| 1 | Usuarios y grupos, camiones, choferes, clientes, orígenes y destinos, tarifas | Administración |
| 2 | Viajes (con WhatsApp al chofer y mapa) y presupuestos | Administración y choferes |
| 3 | Proformas propias y de plataforma, facturación (un mes en paralelo con el circuito actual) | Administración |
| 4 | Cuenta corriente, recibos, tablero de inicio y auditoría | Administración impositiva y Dirección |

### Formación o capacitación

La capacitación se hace por perfil, en la empresa, con el sistema instalado y datos de prueba. El
material de apoyo es el **manual de usuario en línea** del sistema.

| Perfil | Participantes | Contenidos | Duración |
|---|---|---|---|
| Administrador | Claudia Sánchez | Usuarios, grupos, permisos, configuración de correo, WhatsApp y facturación, auditoría | 1 sesión de 2 h |
| Administración general | Encargada administrativa general | Camiones, choferes, clientes, recorridos, tarifas, viajes, presupuestos, proformas y facturación | 2 sesiones de 2 h |
| Administración impositiva | Encargada administrativa impositiva | Cuenta corriente, recibos, notas de crédito y débito | 1 sesión de 1 h |
| Dirección | Dueño | Tablero de inicio, listados y aprobación de presupuestos | 1 sesión de 1 h |
| Chofer | Choferes | Qué mensaje reciben por WhatsApp y cómo abrir la ruta | 15 minutos |

### Preparación de la instalación

- **Base de datos:** Azure SQL con un usuario propio de la aplicación (no el administrador) y la
  contraseña fuera del repositorio.
- **API:** Azure App Service con .NET Framework 4.8 y HTTPS.
- **Páginas:** publicadas en el mismo App Service, con la URL de la API de producción.
- **Integraciones:** clave de Google Maps restringida al dominio de producción; número y plantillas
  de WhatsApp aprobadas en Meta; cuenta de correo para los envíos.
- **Carga inicial:** usuarios y grupos del personal; camiones y choferes; clientes (con su tipo y
  plataforma); orígenes, destinos y tarifas vigentes; numeración de comprobantes y datos del emisor.
- **Limpieza:** borrar los datos de prueba (`PRUEBA-CLAUDE`) y el usuario de prueba, y corregir los
  defectos de seguridad D01 a D03 antes de cargar datos reales.

### Realización de la instalación

1. Crear el usuario de la aplicación en Azure SQL y correr los scripts de `database/` en orden.
2. Crear el App Service en Azure y publicar la API desde Visual Studio (Publicar → Azure App
   Service); configurar la cadena de conexión en la configuración del App Service, no en el código.
3. Publicar las páginas y apuntarlas a la API.
4. Configurar correo, WhatsApp y facturación desde las pantallas de Configuración.
5. Crear los usuarios con sus grupos y verificar el acceso de cada perfil.
6. Pruebas de humo: login, alta de viaje, proforma propia, importar una proforma de Rukas, factura y
   nota de crédito.
7. Verificar el respaldo automático de Azure SQL y hacer una prueba de restauración.

### Prueba de aceptación

La hace el personal de la empresa con el acompañamiento del equipo, con escenarios por perfil
basados en los casos de prueba:

- Administración general: registrar un viaje con chofer (llega el WhatsApp), pasarlo a Entregado con
  la evidencia y armar la proforma propia.
- Administración general: importar la proforma de Rukas del período, resolver una diferencia y
  facturar.
- Administración impositiva: registrar un recibo e imputarlo; emitir una nota de crédito.
- Dirección: consultar el tablero y aprobar un presupuesto.
- Administrador: crear un usuario con permisos limitados y verificar lo que ve.

Criterio de aceptación: todos los escenarios completados sin defectos de gravedad alta. El
resultado se registra en un acta firmada por la empresa y el equipo:

| Campo del acta | Contenido |
|---|---|
| Fecha y lugar | |
| Participantes por Transporte Sánchez | |
| Participantes por el equipo | |
| Escenarios ejecutados | |
| Resultado | Aceptado / Aceptado con observaciones / No aceptado |
| Observaciones y ajustes acordados | |
| Firmas | |

### Evaluación y ajuste

Período de estabilización de 30 días con una reunión semanal entre el equipo y la empresa. Las
incidencias se registran en el backlog y se priorizan. Indicadores:

- Viajes registrados en SGTL respecto de los de Rukas y las planillas (meta: 100 % al terminar el
  paralelo).
- Diferencias detectadas en el control de proformas y tiempo hasta resolverlas.
- Viajes entregados sin facturar con más de 30 días.
- Facturas vencidas sin cobrar.
- Incidencias abiertas por gravedad.

### Cronograma de implementación

Cronograma a partir de la aprobación:

| Período | Actividad | Responsables |
|---|---|---|
| Semana 1 | Correcciones de seguridad (D01 a D03), limpieza de datos de prueba | Desarrollo |
| Semana 2 | Creación del App Service, publicación y pruebas de humo | Rocío Nuvoli, Facundo Godoy |
| Semana 3 | Carga inicial, capacitación y puesta en marcha de las etapas 1 y 2 | Equipo y administración |
| Semanas 4 a 7 | Etapa 3 con un cierre mensual en paralelo | Administración y equipo |
| Semana 8 | Etapa 4, prueba de aceptación y acta | Equipo y empresa |
| Mes siguiente | Estabilización, evaluación y ajustes | Equipo y empresa |
