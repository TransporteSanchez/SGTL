# Instrucciones para asistentes de IA — SGTL

Este archivo lo leen Cursor, Copilot, Codex y otras herramientas. Claude Code lee
`CLAUDE.md`, que tiene las reglas completas del proyecto: leelo también.

## Documentación

- **Toda la documentación va en `docs/`.** No crees archivos `.md` en la raíz del repo
  ni dentro de las carpetas de código.
- **Antes de crear, mover o renombrar un documento, leé `docs/README.md`**: ahí está en
  qué carpeta va cada tipo de documento, cómo se nombra y el índice que hay que actualizar.
- Si un documento no encaja en ninguna carpeta, preguntá antes de crear una nueva.
- Los pendientes del sistema están en `docs/PENDIENTES-SISTEMA.md` (lista única).

## Reglas básicas

- Textos de pantalla, mensajes y documentos en español rioplatense (voseo: "Completá…").
- Nunca correr SQL contra la base compartida. Los cambios de esquema van como script nuevo
  en `database/<módulo>/NN_descripcion.sql`.
- No regenerar el EDMX de la API ("Update Model from Database").
- `Web.config` tiene la cadena de conexión con contraseña: no copiarla, mostrarla ni
  agregar otros secretos al repo.
- Commits en español con el formato `Módulo: qué cambió`.
