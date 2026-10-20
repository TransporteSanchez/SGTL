# Documentación de SGTL

Toda la documentación del proyecto vive en esta carpeta. Este archivo dice **dónde va cada
documento** y sirve de índice. Vale para el equipo y para cualquier IA que trabaje en el repo
(Claude Code, Cursor, Copilot, etc.).

## Reglas

1. **En la raíz del repo no van documentos.** Ahí solo quedan `CLAUDE.md` y `AGENTS.md`
   (instrucciones para las IA) y, si algún día se agrega, un `README.md`.
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
| `docs/pruebas/` | Reportes de prueba, uno por recorrida (por ejemplo, los que genera la VM) | `AAAA-MM-DD-tema.md` |
| `docs/pruebas/datos/` | Archivos de prueba con datos inventados (por ejemplo, Excel con el formato de Rukas). Nunca datos reales de clientes | `<módulo>-<caso>.<ext>` |

Los scripts SQL no son documentación: van en `database/<módulo>/NN_descripcion.sql`.

## Índice

### Pendientes

- `docs/PENDIENTES-SISTEMA.md` — lista única de pendientes y estado de cada uno.

### Equipo

- `docs/equipo/PROCEDIMIENTO-DESARROLLO-ROCIO.md` — cómo se trabaja entre la Mac y la VM Windows.
- `docs/equipo/FLUJO-GIT.md` — circuito de ramas (`rocionuvoli`, `main`, `master`, ramas de Facu y Fede).
- `docs/equipo/PRUEBAS-VM-CLAUDE.md` — instructivo para la sesión de IA que prueba en la VM.
- `docs/equipo/merge-facugodoy-2026-10-17.md` — qué cambió con el merge de Facu (17/10/2026).

### Negocio

- `docs/negocio/RELEVAMIENTO-RUKAS-CLAUDIA.md` — cuestionario del relevamiento Marfrig + Rukas.
- `docs/negocio/PROFORMA-CLIENTES-RUKAS.md` — definición de la proforma para clientes Rukas / Marfrig.
- `docs/negocio/CHECKLIST-OPERACION-VIAJES.md` — guía operativa de gestión de viajes.

### Diseño técnico

- `docs/diseno/cuenta-corriente-diseno.md` — cuenta corriente de clientes (módulo de Facu).
- `docs/diseno/auditoria-integracion.md` — cómo se registra la auditoría de altas, bajas y modificaciones.
- `docs/diseno/proforma-rukas-diseno.md` — proforma de plataforma (Rukas): base de datos, API, pantallas y plan de desarrollo por etapas.

### Design system

- `docs/design-system/01-relevamiento-codigo.md` — relevamiento visual de las pantallas por código.
- `docs/design-system/02-instructivo-capturas-vm.md` — cómo sacar las capturas en la VM.
- `docs/design-system/03-decisiones.md` — las reglas que siguen las pantallas nuevas o tocadas.
- `docs/design-system/04-relevamiento-funcional.md` — relevamiento de inconsistencias y mejoras de uso en las pantallas ya subidas (19/10/2026). No reemplaza los pendientes del §10.

### Pruebas

- `docs/pruebas/2026-10-17-recorrida-general-pre-merge-facu.md` — recorrida general antes del merge con Facu.
- `docs/pruebas/2026-10-17-verificacion-F1-F3.md` — verificación de F1 (contraseñas) y F3 (permisos).
- `docs/pruebas/2026-10-17-capturas-ui.md` — reporte de capturas del relevamiento visual.
- `docs/pruebas/2026-10-18-merge-presupuestos-facu.md` — pruebas en la VM del merge de presupuestos de Facu y de los botones "+" de viajes.
- `docs/pruebas/2026-10-18-verificacion-F1-alta-rapida.md` — verificación en la VM de la corrección del "+" de alta rápida (F1).
- `docs/pruebas/2026-10-18-verificacion-F1-y-mejoras.md` — verificación en la VM de F1 y de las mejoras de la ronda del 18/10 (§13 de pendientes).
- `docs/pruebas/2026-10-19-etapa2-proforma-plataforma.md` — pruebas en la VM de la etapa 2 de la proforma de plataforma (importar y controlar).
- `docs/pruebas/2026-10-19-etapa3-proforma-plataforma.md` — pruebas en la VM de la etapa 3 de la proforma de plataforma (reclamo, reemplazar Excel y generar).
- `docs/pruebas/datos/README.md` — archivos de prueba con datos inventados (Excel con el formato de Rukas) y qué prueba cada uno.
