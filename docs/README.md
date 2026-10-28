# Documentación de SGTL

Toda la documentación del proyecto vive en esta carpeta. Este archivo dice **dónde va cada
documento** y sirve de índice. Vale para el equipo y para cualquier IA que trabaje en el repo
(Claude Code, Cursor, Copilot, etc.).

## Reglas

1. **En la raíz del repo no van documentos.** Ahí solo quedan `AGENTS.md` (la puerta de entrada para
   cualquier IA: Codex, Cursor, Copilot o Claude), `CLAUDE.md` (lo incluye y suma el circuito de Rocío) y, si
   algún día se agrega, un `README.md`.
2. Cada documento nuevo va en la carpeta que corresponda según la tabla de abajo.
   **Si no encaja en ninguna, preguntale a Rocío antes de crear una carpeta nueva.**
3. Al crear, mover o borrar un documento, **actualizá el índice de este archivo** en el
   mismo commit.
4. Para nombrar un documento desde otro, usá la ruta completa desde la raíz del repo entre
   comillas invertidas, por ejemplo `docs/equipo/FLUJO-GIT.md`. Así se encuentra con una
   búsqueda y no se rompe si el documento que lo cita cambia de carpeta.
5. Para mover un documento, usá `git mv` (conserva el historial) y buscá en todo el repo
   las menciones al nombre viejo para corregirlas.
6. Los documentos se escriben en español rioplatense.
7. Nada de contraseñas, cadenas de conexión, tokens ni datos personales de clientes o
   choferes. Las capturas de pantalla no se commitean.

## Qué va en cada carpeta

| Carpeta | Qué va | Nombre del archivo |
|---|---|---|
| `docs/` (primer nivel) | Solo `PENDIENTES-SISTEMA.md` (la lista única de pendientes) y este índice | — |
| `docs/equipo/` | Cómo trabaja el equipo: git, ramas, VM, procedimientos, resúmenes de merges | `TEMA.md`; resúmenes de merge: `merge-<rama>-AAAA-MM-DD.md` |
| `docs/negocio/` | Relevamientos y definiciones con el cliente, flujos operativos de la transportista | `TEMA.md` |
| `docs/diseno/` | Diseño técnico de un módulo: modelo de datos, contratos, cómo se integra | `<módulo>-diseno.md` o `<módulo>-integracion.md` |
| `docs/design-system/` | Reglas visuales y de interfaz (botones, modales, tablas, textos) | `NN-tema.md`, numerados |
| `docs/tesis/` | Borrador del documento de la tesis, por partes, antes de pasarlo al Word | `NN-parte.md`, numerados |
| `docs/pruebas/` | Reportes de prueba, uno por recorrida (por ejemplo, los que genera la VM) | `AAAA-MM-DD-tema.md` |
| `docs/pruebas/datos/` | Archivos de prueba con datos inventados (por ejemplo, Excel con el formato de Rukas). Nunca datos reales de clientes | `<módulo>-<caso>.<ext>` |

Los scripts SQL no son documentación: van en `database/<módulo>/NN_descripcion.sql`.

## Índice

### Pendientes

- `docs/PENDIENTES-SISTEMA.md` — lista única de pendientes y estado de cada uno.

### Archivos del manual de usuario

- `docs/Manual_SGTL_actualizado.docx` — versión de trabajo del manual de usuario.
- `docs/Manual_SGTL_portada_nueva.docx` — versión de trabajo con la portada nueva.
- El script para proponer la actualización del PDF está en `database/documentacion/02_reemplazar_manual_version_0003.sql`; termina con ROLLBACK para revisar antes de aplicarlo.

### Equipo

- `docs/equipo/PROCEDIMIENTO-DESARROLLO-ROCIO.md` — cómo se trabaja entre la Mac y la VM Windows.
- `docs/equipo/FLUJO-GIT.md` — circuito de ramas (`rocionuvoli`, `main`, `master`, ramas de Facu y Fede).
- `docs/equipo/INSTRUCTIVO-PRUEBAS-VIAJES-Y-PROFORMAS.md` — paso a paso para probar a mano viajes, proforma propia y proforma de Rukas (con los tres casos), y guion para la presentación.
- `docs/equipo/PRUEBAS-VM-CLAUDE.md` — instructivo para la sesión de IA que prueba en la VM.
- `docs/equipo/INSTRUCTIVO-DEMO-FACTURACION.md` — qué documentos de demo genera la VM después de la limpieza de la facturación de prueba (§38), con los importes que tiene que dar cada uno.
- `docs/equipo/INSTRUCTIVO-PRUEBAS-TARIFAS.md` — qué probar en la VM de la tabla de tarifas y sus cambios (§33 y §34), con todas las variantes y la mirada de usabilidad.
- `docs/equipo/INSTRUCTIVO-CUENTAS-CHOFERES.md` — relevamiento de los choferes, el grupo "Choferes" y una cuenta de chofer de prueba que queda para la demo de la hoja de ruta (§36).
- `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md` — qué probar en la VM de todo lo subido sin reporte al 28/10: las integraciones de Facu (§44 a §57) y Fede (§58) y lo nuestro del 24 al 28/10 (viajes, orden del día, tarifas, hoja de ruta, control interno), con los cruces y el design system, en seis rondas.
- `docs/equipo/merge-facugodoy-2026-10-17.md` — qué cambió con el merge de Facu (17/10/2026).
- `docs/equipo/merge-facugodoy-2026-10-22.md` — qué cambió con el merge de Facu (22/10/2026): contraseñas, cuenta corriente, presupuestos y facturación.
- `docs/equipo/merge-fedemontenegro-2026-10-22.md` — qué cambió con el merge de Fede (22/10/2026): código de área del WhatsApp y nombre comercial del cliente.

### Negocio

- `docs/negocio/RELEVAMIENTO-RUKAS-CLAUDIA.md` — cuestionario del relevamiento Marfrig + Rukas.
- `docs/negocio/PROFORMA-CLIENTES-RUKAS.md` — definición de la proforma para clientes Rukas / Marfrig.
- `docs/negocio/FLUJOS-VIAJES-Y-PROFORMAS.md` — diagramas de los flujos de viajes, proforma propia y proforma de Rukas, con todas las variantes (para la presentación y para probar).
- `docs/negocio/CHECKLIST-OPERACION-VIAJES.md` — guía operativa de gestión de viajes. Desactualizada en la facturación de Rukas.

### Diseño técnico

- `docs/diseno/cuenta-corriente-diseno.md` — cuenta corriente de clientes (módulo de Facu).
- `docs/diseno/cuenta-corriente-distribucion-diseno.md` — plan de distribución de Recibos y Notas de Crédito.
- `docs/diseno/auditoria-integracion.md` — cómo se registra la auditoría de altas, bajas y modificaciones.
- `docs/diseno/proforma-rukas-diseno.md` — proforma de plataforma (Rukas): base de datos, API, pantallas y plan de desarrollo por etapas.
- `docs/diseno/vuelta-del-dia-diseno.md` — primer y segundo viaje del día (1ª y 2ª vuelta): la regla, dónde se ve y todos los casos, normales y borde.
- `docs/diseno/viajes-diseno.md` — el flujo completo de los viajes como está hoy (estados, qué se puede hacer en cada situación, qué se controla), los huecos encontrados en la revisión del 27/10, para corregir o decidir, y cómo se manejan la estadía y los adicionales en los clientes directos y en Rukas (§7).
- `docs/diseno/seguridad-contrasenas-diseno.md` — cambio de contraseña, hashes seguros y recupero desde el login por e-mail, sin segundo factor.
- `docs/diseno/seguridad-contrasenas-plan.md` — plan de implementación y verificación del cambio seguro de contraseña.

### Design system

- `docs/design-system/01-relevamiento-codigo.md` — relevamiento visual de las pantallas por código.
- `docs/design-system/02-instructivo-capturas-vm.md` — cómo sacar las capturas en la VM.
- `docs/design-system/03-decisiones.md` — las reglas vigentes de todas las pantallas y módulos, con la tabla de funciones compartidas (`window.SGTL`). La lista de control para revisar antes de commitear está en `AGENTS.md`.
- `docs/design-system/04-relevamiento-funcional.md` — relevamiento de inconsistencias y mejoras de uso en las pantallas ya subidas (19/10/2026). No reemplaza los pendientes del §10.
- `docs/design-system/05-relevamiento-motivos-deshabilitados.md` — cómo estaban escritos los motivos de los botones deshabilitados, las opciones que se miraron y el antes y el después de cada texto (23/10/2026). La regla está en el §1.4 de las decisiones.

### Tesis

- `docs/tesis/README.md` — índice del borrador de la tesis y lo que falta confirmar.
- `docs/tesis/SGTL-Documentacion-Transporte-Sanchez.docx` — documento final de la tesis (versión principal; también en PDF).
- `docs/tesis/01-analisis-organizacional.md` — historial, introducción, empresa, problemas y requerimientos.
- `docs/tesis/02-anteproyecto.md` — objetivos, impulsos, alcances, límites, evolutivos y factibilidad.
- `docs/tesis/03-metodologia-y-sprints.md` — Scrum, Sprint 0, backlog y sprints 1 a 24.
- `docs/tesis/04-arquitectura-y-diseno.md` — actores, arquitectura, despliegue, estados y DER.
- `docs/tesis/05-pruebas-e-implementacion.md` — prueba del sistema e implementación.
- `docs/tesis/06-fuentes-bibliografia-anexos.md` — fuentes, bibliografía y anexos.

### Pruebas

- `docs/pruebas/2026-10-17-recorrida-general-pre-merge-facu.md` — recorrida general antes del merge con Facu.
- `docs/pruebas/2026-10-17-verificacion-F1-F3.md` — verificación de F1 (contraseñas) y F3 (permisos).
- `docs/pruebas/2026-10-17-capturas-ui.md` — reporte de capturas del relevamiento visual.
- `docs/pruebas/2026-10-18-merge-presupuestos-facu.md` — pruebas en la VM del merge de presupuestos de Facu y de los botones "+" de viajes.
- `docs/pruebas/2026-10-18-verificacion-F1-alta-rapida.md` — verificación en la VM de la corrección del "+" de alta rápida (F1).
- `docs/pruebas/2026-10-18-verificacion-F1-y-mejoras.md` — verificación en la VM de F1 y de las mejoras de la ronda del 18/10 (§13 de pendientes).
- `docs/pruebas/2026-10-19-etapa2-proforma-plataforma.md` — pruebas en la VM de la etapa 2 de la proforma de plataforma (importar y controlar).
- `docs/pruebas/2026-10-19-etapa3-proforma-plataforma.md` — pruebas en la VM de la etapa 3 de la proforma de plataforma (reclamo, reemplazar Excel y generar).
- `docs/pruebas/2026-10-19-prueba-minima-proforma-plataforma.md` — prueba mínima en la VM de la proforma de plataforma antes de pasar `rocionuvoli` a las ramas y a `main` (instrucciones y resultados).
- `docs/pruebas/2026-10-20-prueba-minima-design-system.md` — prueba mínima de la tanda del design system del 20/10 (hecha en la Mac con API falsa, no en la VM) y su seguimiento.
- `docs/pruebas/2026-10-20-merge-facu.md` — pruebas en la VM del merge de Facu del 20/10 (proformas, cuenta corriente, grupos y permisos).
- `docs/pruebas/2026-10-22-prueba-minima-ramas.md` — prueba mínima en la VM antes de pasar `rocionuvoli` a las ramas del equipo (dashboard, estilo visual y merges de Facu y Fede del 22/10).
- `docs/pruebas/2026-10-22-reprueba-ramas.md` — reprueba en la VM de la falla del recibo, las mejoras de la prueba mínima, la mudanza de "Gestionar tipos de comprobante" y "Ver PDF" de proformas.
- `docs/pruebas/2026-10-23-viajes-y-proformas.md` — pruebas en la VM de viajes (registrar, editar, detalle), los Ver detalle de datos maestros, la proforma de Rukas (tercera vuelta) y los datos del cliente en la proforma (§24 y §25).
- `docs/pruebas/2026-10-23-reprueba-viajes-y-proformas.md` — reprueba en la VM de los arreglos del reporte anterior (§28), los motivos de los botones deshabilitados (§26) y los subtítulos (§27): todo OK, con una falla nueva (Escape en el buscador).
- `docs/pruebas/2026-10-23-reprueba-29.md` — reprueba en la VM de lo que salió de la reprueba anterior (§29): todo OK; la demora de Registrar usuario es el hash de la contraseña.
- `docs/pruebas/2026-10-23-gestionar-empresa.md` — pruebas en la VM de Gestionar empresa (§30): datos y logo de la empresa en los PDF, versiones por fecha, Gestionar contenido y permisos. Todo OK; dos fallas fuera de la §30 (contraseña SMTP en la VM y sesión vencida al enviar un presupuesto).
- `docs/pruebas/2026-10-23-ramas-y-tarifas.md` — pruebas en la VM después de pasar `rocionuvoli` a las ramas del equipo y a `main` (§32): tarifas (§31), Gestionar empresa y PDF (§30), CABA, permisos y recibos. 33 de 33 OK; dos fallas fuera de la ronda (hora del calendario en los modales y totales de un recibo).
- `docs/pruebas/datos/README.md` — archivos de prueba con datos inventados (Excel con el formato de Rukas) y qué prueba cada uno.
