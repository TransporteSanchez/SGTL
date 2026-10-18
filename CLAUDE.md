# SGTL — Sistema de Gestión de Transporte (Transporte Sánchez)

Proyecto de tesis. Equipo: Rocío (integra y pule), Facu (`facugodoy`: facturación,
cuenta corriente, recibos, comprobantes), Fede (`fedemontenegro`: WhatsApp).

## Estructura

- **Front:** páginas HTML estáticas en la raíz (`gestion-*.html`, `listado-*.html`),
  con jQuery + Bootstrap. JS compartido en `assets/static/js/`. Se sirve con Live Server
  (puerto `5502`, ver `.vscode/settings.json`).
- **API:** `WebApi_TransporteSanchez/` — ASP.NET Web API 2, .NET Framework 4.8.
  Corre en IIS Express en `http://localhost:50222/api`. Mezcla Entity Framework (EDMX)
  con SQL directo en texto dentro de los controllers.
- **Base:** Azure SQL `sql-tesis`, base `Transporte_Sanchez`, **compartida con el equipo**.
  Scripts versionados en `database/<módulo>/NN_descripcion.sql`, numerados e idempotentes.
- **Auditoría:** se captura sola en `Sgtlauditcontext.cs` (los controllers usan ese contexto).

## Cómo se trabaja (ver `docs/equipo/PROCEDIMIENTO-DESARROLLO-ROCIO.md` y `docs/equipo/FLUJO-GIT.md`)

- **La Mac es el único lugar donde se cambia código y se commitea.** La VM Windows solo
  hace `pull`, compila en Visual Studio y prueba. En la Mac no se puede compilar la API:
  los cambios en C# se revisan con cuidado y al terminar se dice **qué probar en la VM**.
- **Si esta sesión corre en la VM Windows** (repo en `C:\Repo\SGTL`): solo probás y
  reportás, sin cambiar nada. Seguí `docs/equipo/PRUEBAS-VM-CLAUDE.md`.
- Rama de trabajo: `rocionuvoli`. A `main` pasa solo lo probado; `master` es la versión final.
- Un commit por tema, mensaje en español con el formato `Módulo: qué cambió`
  (ej. `Viajes: km a mano solo si Google falla`). No pushear sin que Rocío lo pida.

## Reglas

- **Nunca correr SQL contra la base desde acá.** Los cambios de esquema van como script
  nuevo en `database/`. Los `UPDATE`/`DELETE` de datos se proponen dentro de
  `BEGIN TRAN` … `SELECT @@ROWCOUNT` … `-- COMMIT; o ROLLBACK;` para que Rocío los corra.
- **No regenerar el EDMX** ("Update Model from Database"): las columnas nuevas se usan
  por SQL directo y regenerarlo rompe las altas.
- **`Web.config` tiene la cadena de conexión con contraseña.** No copiarla, mostrarla ni
  agregar otros secretos al repo.
- Antes de tocar módulos de Facu o Fede, avisar a Rocío para que coordine con ellos.
- Textos de pantalla y mensajes de error en español rioplatense (voseo: "Completá…").
- **Design system:** las pantallas nuevas o tocadas siguen `docs/design-system/03-decisiones.md`.
  Estilos en `assets/static/css/sgtl.css` y funciones en `assets/static/js/sgtl-ui.js`
  (`window.SGTL`: toasts, confirmación, tooltips, estados, botones de fila, cruz de filtros,
  fechas, montos, carga). No copies HTML ni JS de avisos, confirmaciones o badges en la
  pantalla. El botón que abre un modal y el título del modal dicen lo mismo, en infinitivo
  ("Registrar camión"); el pie es Cancelar + el verbo ("Guardar", "Eliminar"), nunca
  "Confirmar". Proformas, cuenta corriente, facturación, e-mail (Facu) y WhatsApp (Fede):
  avisar a Rocío antes de aplicar estas reglas.
- **Fechas:** hoy la hora sale de tres lugares distintos (base en UTC, API en hora local,
  navegador en UTC); ver sección 2 de `docs/PENDIENTES-SISTEMA.md` antes de agregar código
  que guarde o compare fechas.

## Documentación

Toda la documentación va en `docs/`; en la raíz solo quedan `CLAUDE.md` y `AGENTS.md`.
**Antes de crear, mover o renombrar un `.md`, leé `docs/README.md`**: dice en qué carpeta
va cada tipo de documento, cómo se nombra y qué índice actualizar. Los reportes de prueba
van en `docs/pruebas/AAAA-MM-DD-tema.md`.

## Pendientes

`docs/PENDIENTES-SISTEMA.md` es la lista única de pendientes. Al terminar un ítem, actualizarlo
ahí (moverlo a "subido, pendiente de probar en la VM" con cómo probarlo) en el mismo commit.
