# Parte 6 — Fuentes de información, bibliografía y anexos

> Borrador del 20/10/2026.

---

## Fuentes de información

| Fuente | Rol | Información obtenida |
|---|---|---|
| Claudia Sánchez | Administración de Transporte Sánchez | Circuito con Marfrig y Rukas, proformas y facturación (relevamiento de octubre 2026), validación de las reglas del negocio durante los sprints. |
| Jorge Roberto Sánchez | Dueño y chofer | Historia, organización y procesos de la empresa (relevamiento 2022, V1.5). |
| Encargadas administrativas | Administración general e impositiva | Funciones, procesos administrativos y controles (relevamiento 2022). |
| Plataforma Rukas | Sistema del cliente Marfrig | Pantallas de seguimiento y de proformas (recorrida de solo lectura del 18/10/2026) y formato del Excel de la proforma. |
| Documentación interna | Transporte Sánchez | Remitos, hojas de ruta, proformas y facturas (por ejemplo, la factura `A00005-00000659` usada para verificar el IVA). |
| Mariel Ferrando | Product Owner | Revisión del incremento y prioridades. |
| Docentes de la cátedra | Institución Cervantes | Revisiones del diseño de la base (Mario Barrionuevo, 2023) y de los avances. |

---

## Bibliografía

Formato: obra – autor – fecha de edición – editorial o publicador.

- Informática Aplicada – Asc. Jorge Peralta – 2020 – Institución Cervantes, Córdoba.
- Sistemas 1 – Ing. Fernando Loza – 2021 – Institución Cervantes, Córdoba.
- Sistemas 2 – Ing. Fernando Loza – 2021 – Institución Cervantes, Córdoba.
- AENS – Lic. Agustina B. Padilla – 2021 – Institución Cervantes, Córdoba.
- Procesos de Software, Unidad 1 – Sistemas 3 – Institución Cervantes, Córdoba.
- Módulo Sistemas 4 – Mgtr. Ing. Cecilia Savi – 2012 – Institución Cervantes, Córdoba.
- La Guía de Scrum – Ken Schwaber y Jeff Sutherland – noviembre de 2020 – Scrum.org.
- Ingeniería de software (9.ª edición) – Ian Sommerville – 2011 – Pearson Educación.
- Ingeniería del software: un enfoque práctico (7.ª edición) – Roger S. Pressman – 2010 – McGraw-Hill.
- Unified Modeling Language (UML) 2.5.1 – Object Management Group – 2017 – OMG.
- Documentación de ASP.NET Web API 2 y Entity Framework 6 – Microsoft – consultada en 2026 – learn.microsoft.com.
- Documentación de Azure SQL Database – Microsoft – consultada en 2026 – learn.microsoft.com.
- Documentación de la API de WhatsApp Cloud – Meta – consultada en 2026 – developers.facebook.com.
- Documentación de la API de Google Maps JavaScript – Google – consultada en 2026 – developers.google.com/maps.
- Bootstrap 5 – Bootstrap Team – consultada en 2026 – getbootstrap.com.
- API Georef de localidades – Gobierno de la Nación Argentina – consultada en 2026 – datos.gob.ar.

---

## Anexos

### Anexo A – Actas de relevamiento

**[Armar con las reuniones reales.]** Propuesta con lo que ya está documentado:

#### Acta de relevamiento N.º 1 – Análisis organizacional

- **Fecha:** junio de 2022
- **Participantes:** dueño y personal administrativo de Transporte Sánchez; equipo.
- **Objetivo:** conocer la organización, sus procesos y sus problemas.
- **Temas:** historia, funciones, procesos de transporte, mantenimiento, administrativo y gerencial.
- **Requerimientos:** registro de viajes y hojas de ruta, facturación, control de gastos, usuarios.
- **Conclusión:** desarrollar un sistema web para la gestión de viajes (anteproyecto de la V1.5).

#### Acta de relevamiento N.º 2 – Circuito con Marfrig y Rukas

- **Fecha:** 15/10/2026
- **Participantes:** Claudia Sánchez; equipo.
- **Objetivo:** confirmar cómo se trabaja con Marfrig a través de Rukas, del pedido a la factura.
- **Temas:** asignación de chofer y unidad en Rukas; ingreso y salida de planta; remito; aviso de
  entrega; escaneo del remito; sobre a Marfrig; adicionales; proforma de Rukas.
- **Requerimientos:** cargar en SGTL los números de Rukas (transporte SAP, remito, N° de entrega);
  estados Registrado → Listo para facturar → Facturado; controlar la proforma de Rukas contra los
  viajes.
- **Reglas de negocio:** los importes de Rukas son netos (IVA 21 % aparte); la factura interna de SGTL
  hace de factura fiscal porque SGTL no está conectado a ARCA.
- **Conclusión:** importar el Excel de la proforma de Rukas y controlarlo línea por línea (diseño de la proforma de plataforma).
- Se usó un cuestionario paso a paso del circuito, que Claudia respondió marcando cada paso.

#### Acta N.º 3 – Revisión del sistema con el equipo (meet del 18/10/2026)

- **Temas:** recorrida del sistema integrado.
- **Pedidos:** reenviar WhatsApp al chofer; avisar la baja del viaje; cambiar la contraseña con
  código por WhatsApp; sacar `repositorio.zip` del repositorio (§15 de pendientes).

### Anexo B – Correcciones pendientes

Resumen de lo que queda antes de la puesta en marcha (detalle en la lista de pendientes del proyecto):

| Origen | Corrección |
|---|---|
| Prueba del sistema | D01 a D08 (ver "Defectos registrados"). |
| Recorrida del 17/10 | Detalle de viajes con nombres; dominio duplicado; dígito verificador del CUIT; errores de consola de la plantilla. |
| Meet del 18/10 | Reenviar WhatsApp; aviso de baja del viaje; cambio de contraseña con código. |
| Design system | Aplicar las reglas al resto de las pantallas (hoy solo Choferes). |
| Datos | Limpiar los datos y el usuario de prueba antes de cargar datos reales. |

### Anexo C – Material de referencia en el repositorio del proyecto

- Diagramas de los flujos de viajes y proformas: `docs/negocio/FLUJOS-VIAJES-Y-PROFORMAS.md`.
- Instructivo de prueba y guion de la presentación: `docs/equipo/INSTRUCTIVO-PRUEBAS-VIAJES-Y-PROFORMAS.md`.
- Diseño de la proforma de plataforma: `docs/diseno/proforma-rukas-diseno.md`.
- Diseño de la cuenta corriente: `docs/diseno/cuenta-corriente-diseno.md`.
- Reportes de prueba: `docs/pruebas/`.
- Manual de usuario en línea: pantalla `manual-usuario.html`.
