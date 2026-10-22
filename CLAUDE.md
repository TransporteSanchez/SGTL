# SGTL — Sistema de Gestión de Transporte (Transporte Sánchez)

Las reglas comunes para cualquier IA y cualquier persona del equipo están en `AGENTS.md` (design system
obligatorio en todos los módulos, lista de control antes de commitear, base, EDMX, secretos, commits y
documentación):

@AGENTS.md

Lo que sigue es **solo para las sesiones de Rocío** (la Mac y la VM). Si esta sesión es de Facu o de Fede,
seguí `AGENTS.md` en tu rama y no apliques el circuito de abajo.

Proyecto de tesis. Equipo: Rocío (integra y pule), Facu (`facugodoy`: facturación,
cuenta corriente, recibos, comprobantes), Fede (`fedemontenegro`: WhatsApp).

## Estructura

- **Front:** se sirve con Live Server (puerto `5502`, ver `.vscode/settings.json`).
- **API:** corre en IIS Express. Mezcla Entity Framework (EDMX) con SQL directo en texto dentro de los
  controllers.
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
- No pushear sin que Rocío lo pida.

## Reglas de esta sesión

- **Nunca correr SQL contra la base desde acá.** Los `UPDATE`/`DELETE` de datos se proponen dentro de
  `BEGIN TRAN` … `SELECT @@ROWCOUNT` … `-- COMMIT; o ROLLBACK;` para que Rocío los corra.
- **Módulos de Facu o Fede:** antes de cambiar cómo funcionan (lógica, datos, API), avisar a Rocío para que
  coordine con ellos. El design system se aplica igual en esos módulos: ya está aplicado en todas sus
  pantallas y todo cambio nuevo lo sigue.
- Los reportes de prueba van en `docs/pruebas/AAAA-MM-DD-tema.md`.
- Al terminar un ítem de `docs/PENDIENTES-SISTEMA.md`, moverlo a "subido, pendiente de probar en la VM" con
  cómo probarlo, en el mismo commit.
