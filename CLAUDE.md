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

## Cómo se trabaja (ver `PROCEDIMIENTO-DESARROLLO-ROCIO.md` y `FLUJO-GIT.md`)

- **La Mac es el único lugar donde se cambia código y se commitea.** La VM Windows solo
  hace `pull`, compila en Visual Studio y prueba. En la Mac no se puede compilar la API:
  los cambios en C# se revisan con cuidado y al terminar se dice **qué probar en la VM**.
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
- **Fechas:** hoy la hora sale de tres lugares distintos (base en UTC, API en hora local,
  navegador en UTC); ver sección 2 de `PENDIENTES-SISTEMA.md` antes de agregar código
  que guarde o compare fechas.

## Pendientes

`PENDIENTES-SISTEMA.md` es la lista única de pendientes. Al terminar un ítem, actualizarlo
ahí (moverlo a "subido, pendiente de probar en la VM" con cómo probarlo) en el mismo commit.
