# Flujo de trabajo Git — SGTL

Guía del circuito de ramas del proyecto. Objetivo: que el equipo trabaje sin
pisarse y que `master` quede siempre como versión final estable.

## Roles de cada rama

| Rama | Rol |
|------|-----|
| `master` | **Versión final / estable** (el entregable). Solo recibe cambios desde `main`, ya pulidos. |
| `main` | **Integración / desarrollo**. Acá se junta y revisa todo el trabajo del equipo. |
| `facugodoy`, `rocionuvoli`, etc. | Ramas personales donde cada uno sube su trabajo. |

Permisos para subir a `main`: **solo Rocío y agustinpai**.

---

## FACU — su rutina

**1. Al empezar el módulo (una vez):**

```bash
git checkout facugodoy
git pull origin facugodoy
```

**2. Cada vez que trabaja (guardar y subir):**

```bash
git add .
git commit -m "avance cuenta corriente: descripción"
git push origin facugodoy
```

**3. Cuando Rocío le avisa que actualizó su rama:**

```bash
git checkout facugodoy
git pull origin facugodoy
```

> Regla de Facu: `pull` al empezar -> `add/commit/push` para guardar -> `pull` cuando Rocío avisa.
>
> Nota: `git add .` está OK porque Facu NO toca `Web.config` (ahí está la
> conexión a la base). Si por algún motivo tuviera que tocarlo, avisar antes.

---

## ROCÍO — integrar lo de Facu a `main`

**1. Traer y revisar lo que subió Facu:**

```bash
git checkout facugodoy
git pull origin facugodoy
git log main..facugodoy --oneline     # ver qué commits nuevos hay
git diff main..facugodoy --stat       # ver qué archivos tocó
#   ...probar el módulo si se quiere...
```

**2. Si está OK, subirlo a `main`:**

```bash
git checkout main
git pull origin main
git merge facugodoy
git push origin main
```

> Variante (control fino): si querés integrar SOLO algunos archivos en vez de
> todo, en lugar del `merge` traés los archivos puntuales desde su rama:
>
> ```bash
> git checkout main
> git pull origin main
> git checkout facugodoy -- ruta/al/archivo1 ruta/al/archivo2
> git add .
> git commit -m "integrar modulo cuenta corriente"
> git push origin main
> ```

**3. Re-sincronizar la rama de Facu con `main`:**

```bash
git checkout facugodoy
git merge main
git push origin facugodoy
```

**4. Avisar a Facu** que haga `git pull origin facugodoy` (su paso 3).

> Importante: el `pull` de Facu recién trae algo nuevo DESPUÉS del paso 3.
> Con solo mergear a `main` (paso 2), la rama `facugodoy` no cambia sola.

---

## ROCÍO — trabajo propio de pulido

Para cambios chicos, directo en `main`:

```bash
git checkout main
git pull origin main
#   ...puliendo pantallas...
git add .
git commit -m "pulido: descripción"
git push origin main
```

---

## ROCÍO — cuando todo esté pulido: pasar a `master` (final)

```bash
git checkout master
git pull origin master
git merge main
git push origin master
git tag v1.0
git push origin v1.0
```

---

## ¿Hace falta sincronizar la rama de Facu con `main` seguido?

No hace falta constantemente, pero sí en **momentos clave**:

1. Si el módulo lleva varios días/semana.
2. Cuando en `main` entra algo que toca **archivos compartidos** que Facu también
   usa (ej. el menú `sidebar.js`, estilos globales, un controlador común).
3. **Antes** del merge final `facugodoy -> main`.

Para un módulo corto suele alcanzar con sincronizar **1 vez a mitad de camino** y
otra **antes del merge final**.

Riesgos de dejar la rama vieja mucho tiempo:

- Conflicto grande al final si ambos tocaron el mismo archivo.
- Trabajar sobre código viejo (ej. conexión a base desactualizada).
- Merge gigante y difícil de integrar de golpe.

---

## Si un merge marca conflicto

Pasa solo si dos personas tocaron el mismo archivo. Git lista los archivos en
conflicto; se abren, se elige qué queda, y luego:

```bash
git add archivo-resuelto
git commit
```

---

## Regla de oro para módulos nuevos

Arrancar siempre desde lo último de `main`. Si se crea una rama nueva:

```bash
git checkout main
git pull origin main
git checkout -b feature/nombre-del-modulo
```

---

## Mensaje corto para pasarle a Facu

> Facu, para trabajar en tu módulo usá siempre tu rama `facugodoy`:
>
> **Al empezar a trabajar (siempre arrancá con esto):**
> ```
> git checkout facugodoy
> git pull origin facugodoy
> ```
>
> **Para guardar y subir lo que vas haciendo:**
> ```
> git add .
> git commit -m "avance cuenta corriente"
> git push origin facugodoy
> ```
> (Cambiá el mensaje por lo que hiciste.)
>
> **Cuando yo te avise que actualicé tu rama:**
> ```
> git checkout facugodoy
> git pull origin facugodoy
> ```
>
> Subí todo tranquilo a `facugodoy`, que de pasarlo a `main` me encargo yo.
