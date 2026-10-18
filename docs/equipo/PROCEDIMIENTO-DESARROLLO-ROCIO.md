# Procedimiento de desarrollo — Rocío (Mac + VM Windows)

Cómo trabaja Rocío: se programa en la **Mac** (Cursor) y se compila / prueba en una
**máquina virtual Windows** (Visual Studio, SSMS, front). Complementa a `docs/equipo/FLUJO-GIT.md`.

## Reglas

- **Mac = único lugar donde se cambia código y se hacen commits.**
- **VM = solo baja ramas (`pull`) y prueba.** Nunca commitear ni pushear desde la VM:
  si hace falta corregir algo, se corrige en la Mac y se vuelve a bajar.
- Se prueba desde la rama personal **`rocionuvoli`**. A `main` solo pasa lo ya probado.
- La base (`Transporte_Sanchez` en `sql-tesis`) es **compartida** con el equipo: los
  scripts SQL se corren una sola vez, con backup previo, y se avisa al equipo.

---

## 1. Mac — trabajar y subir la rama de prueba

```bash
git switch rocionuvoli
#   ...cambios en Cursor...
git add <archivos>
git commit -m "descripción"
git push origin rocionuvoli
```

Si hay trabajo nuevo de Facu en `main`, integrarlo antes (ver `docs/equipo/FLUJO-GIT.md`):

```bash
git fetch origin
git switch rocionuvoli
git merge origin/main      # resolver conflictos en la Mac, nunca en la VM
git push origin rocionuvoli
```

## 2. VM Windows — bajar la rama

En la carpeta del repo clonado en la VM (Git Bash o terminal de Visual Studio):

```bash
git status                 # tiene que estar limpio; si hay cambios, ver "Problemas" abajo
git fetch origin
git switch rocionuvoli     # la primera vez la crea siguiendo a origin/rocionuvoli
git pull origin rocionuvoli
git log --oneline -3       # confirmar que el último commit es el que se subió desde la Mac
```

## 3. VM — base de datos (solo si el cambio trae scripts SQL)

1. Backup de la base (o confirmar que hay uno reciente).
2. En SSMS, conectado a `sql-tesis`, elegir la base **Transporte_Sanchez**.
3. Correr los scripts nuevos **en el orden numérico**, cada uno completo (F5).
   Son idempotentes: si ya estaban aplicados, no hacen nada.
4. Verificar con la consulta de control que acompañe al cambio.

> No hacer "Update Model from Database" en el EDMX: las columnas nuevas se usan por
> SQL directo y regenerar el modelo rompe las altas (ver comentarios de los scripts).

## 4. VM — compilar y levantar el back

1. Abrir `WebApi_TransporteSanchez.sln` en Visual Studio.
2. Clic derecho en la solución → **Restore NuGet Packages** (necesario cuando
   cambia `packages.config`, p. ej. MailKit).
3. **Build → Rebuild Solution**. Tiene que terminar sin errores.
4. Ejecutar (IIS Express). La API queda en `http://localhost:50222/api`.

## 5. VM — abrir el front y probar

1. Abrir la carpeta del repo en VS Code y levantar **Live Server** (puerto `5502`).
2. Entrar a la app y forzar recarga sin caché (**Ctrl + F5**) para no ver JS viejo.
3. Probar lo que se cambió + una pasada rápida por las pantallas vecinas
   (si se tocó viajes: viajes, clientes, facturación).

Si algo falla: anotar el error (mensaje de la pantalla, consola del navegador F12,
salida de Visual Studio), **corregir en la Mac**, commit + push, y repetir desde el paso 2.

## 6. Mac — cuando todo está probado: pasar a `main`

```bash
git fetch origin
git switch main
git pull origin main
git merge rocionuvoli
git push origin main

# mantener la rama de Facu al día (ver docs/equipo/FLUJO-GIT.md, paso 3)
git switch facugodoy
git pull origin facugodoy
git merge main
git push origin facugodoy
git switch rocionuvoli
```

Avisar a Facu que haga `git pull origin facugodoy`.

---

## 7. Después de cada ronda de pruebas: errores, mejoras y limpieza

Acordado con Rocío el 18/10/2026. Vale para cualquier IA que analice un reporte de pruebas.
La idea es resolver en el momento todo lo que se pueda y no acumular pendientes.

**Errores.** Se analizan y se propone la corrección: causa, cambio y cómo probarlo en la VM.
Se aplica cuando Rocío la aprueba, en un commit por tema, y se actualizan los pendientes.

**Mejoras, también las de módulos de Facu o Fede.** Se suman a la ronda actual. Para cada una
se plantea:

- **qué hay hoy y qué se propone**;
- **qué implica**: archivos que toca, si hace falta script en la base y qué hay que probar;
- **la recomendación**: hacerla ya, dejarla pendiente o **validarla antes con Facu o Fede**,
  con el motivo. Por ejemplo, si cambia una decisión de su módulo o algo que ellos están
  tocando en su rama.

Rocío decide cuáles se hacen. Las que no, quedan en `docs/PENDIENTES-SISTEMA.md` con el
motivo y con quién hay que hablarlas.

**Limpieza de datos de prueba.** Al terminar de analizar un reporte, recordarle a Rocío la
limpieza y clasificar cada dato:

- **conviene limpiar ya**: datos que ensucian pantallas o reportes, que pueden confundir otra
  prueba o que tienen efectos reales (por ejemplo, un viaje con chofer asignado);
- **no molestan / conviene dejarlos**: datos que sirven para la próxima prueba (por ejemplo,
  para verificar una corrección) o que no se ven en ningún lado.

El SQL va revisado, dentro de `BEGIN TRAN` … `SELECT @@ROWCOUNT` … `-- COMMIT; o ROLLBACK;`, y lo
corre Rocío.

## Problemas frecuentes

- **`git switch` / `git pull` en la VM falla con "Your local changes ... would be overwritten"
  sobre archivos de `bin/` u `obj/`.** Son salidas de compilación de una versión vieja en la
  que git todavía las seguía. Descartarlas y reintentar (el Rebuild las vuelve a generar):
  `git restore WebApi_TransporteSanchez/bin WebApi_TransporteSanchez/obj`.
- **En PowerShell, correr los comandos de git de a uno.** Si se pegan varios juntos y uno
  falla, los siguientes se ejecutan igual sobre la rama equivocada.

- **`git pull` en la VM dice que hay cambios locales.** Ver con `git status` qué archivos son.
  Si son cambios que Visual Studio hizo solo (p. ej. `.csproj`, `Web.config`), descartarlos:
  `git restore <archivo>`. Si es algo que importa, pasarlo a mano a la Mac y commitearlo allá.
- **La API compila pero da error "Invalid column name / Invalid object name".**
  Falta correr algún script SQL del cambio en la base.
- **Los cambios del front no aparecen.** Recarga sin caché (Ctrl + F5) o abrir en ventana privada.
- **Error de paquetes al compilar.** Restore NuGet Packages y volver a hacer Rebuild.
