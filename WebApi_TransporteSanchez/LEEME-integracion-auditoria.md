# Sección de Auditoría — Guía de integración

Registra automáticamente **altas, bajas y modificaciones** de todas las entidades,
con **valores antes/después**, más **login/logout** (estos con un agregado manual de 1 línea).
La captura vive enteramente en el contexto de datos: los controllers casi no se tocan.

## Archivos

| Archivo | Dónde va en el proyecto |
|---|---|
| `01_crear_tabla_AUDITORIA.sql` | Ejecutar en SQL Server (base SGTL) |
| `SGTLAuditContext.cs` | Raíz del proyecto `WebApi_TransporteSanchez` (junto a los modelos) |
| `AuditoriaController.cs` | Carpeta `Controllers/` |
| `gestion-auditoria.html` | Carpeta del frontend (junto a las demás páginas) |
| `sidebar-loader.js` | Reemplaza `assets/static/js/sidebar-loader.js` (agrega el ítem "Auditoría") |

## Pasos

### 1. Base de datos
Ejecutá `01_crear_tabla_AUDITORIA.sql`. Crea la tabla `AUDITORIA`, sus índices y
registra el menú `Auditoria` para el RBAC. (Al final tiene, comentado, el INSERT
opcional para asignar el menú al grupo de administradores.)

### 2. Backend — copiar los 2 archivos .cs
Sumá `SGTLAuditContext.cs` y `Controllers/AuditoriaController.cs` al proyecto en
Visual Studio (que queden incluidos en el .csproj / "Include in Project").

### 3. Activar la captura automática — un solo Buscar y reemplazar
Los controllers hoy hacen `new DbContext(...)`. Para que la auditoría se dispare,
cambiá ese tipo por `SGTLAuditContext`:

- **Ctrl + Shift + H** (Reemplazar en archivos)
- Buscar:    `new DbContext(`
- Reemplazar: `new SGTLAuditContext(`
- Ámbito: **Solución entera** · Coincidir mayúsculas/minúsculas
- Reemplazar todo

Son ~90 usos en `Controllers/`. El argumento (connection string / `Cn()`) no cambia.
`SGTLAuditContext` está en el namespace `WebApi_TransporteSanchez`, que los
controllers ya importan, así que no hace falta agregar `using`.

> El `RegistrarEvento(...)` estático y el `DbContext` genérico interno del helper
> quedan intactos a propósito: no los reemplaces (solo cambian los `new DbContext`
> de los controllers). Si el reemplazo también tocara la línea interna del helper,
> revertí esa única ocurrencia dentro de `SGTLAuditContext.cs`.

### 4. (Opcional) Auditar login / logout
No pasan por SaveChanges, así que se registran con una línea. En el controller de
login, cuando la autenticación es correcta:

```csharp
SGTLAuditContext.RegistrarEvento(
    ConnectionStringHelper.GetConnectionString("SGTLEntities"),
    user.Nombre_Usuario, "LOGIN", "USUARIOS",
    "Usuario_ID=" + user.Usuario_ID, "Inicio de sesión");
```

Y análogo con `"LOGOUT"` en el logout.

### 5. Frontend
- Copiá `gestion-auditoria.html` a la carpeta del frontend.
- Reemplazá `assets/static/js/sidebar-loader.js` por el de esta carpeta
  (agrega el ítem **Auditoría** al menú y su mapeo RBAC).
- Verificá que la URL de la API en `gestion-auditoria.html` (`API_AUD`) coincida con
  la de las demás páginas (`http://localhost:50222/api`).

### 6. Permisos (RBAC)
En **Gestionar grupos y permisos**, asigná el menú **Auditoria** a los grupos que
deban verlo (típicamente solo administradores). Los usuarios `Rol = admin` ya lo ven
por acceso total.

## Cómo funciona

- `SGTLAuditContext` hereda de `DbContext` y sobrescribe `SaveChanges()`.
- Antes de guardar, recorre el `ChangeTracker`: por cada entidad Added/Modified/Deleted
  arma la acción, la clave primaria y los valores. En UPDATE guarda **solo los campos
  que cambiaron**.
- Después de guardar (para tener los IDs de identity), inserta las filas en `AUDITORIA`
  con SQL parametrizado. **La auditoría nunca rompe la operación principal**: si fallara,
  se ignora en silencio.
- El usuario se resuelve así: propiedad `UsuarioAuditoria` si el controller la setea →
  campo `Usu_Modi`/`Usu_Alta` del propio registro → contexto HTTP → `"sistema"`.
- **La tabla AUDITORIA no se audita** a sí misma y los campos sensibles
  (`Contraseña`, `Password`, etc.) se guardan como `***`.

## Notas
- `AUDITORIA` **no** necesita agregarse al `.edmx`: se lee y escribe con SQL directo.
- Para atribuir siempre el usuario correcto (no depender de `Usu_Modi`), podés setear
  `db.UsuarioAuditoria = <usuario>;` antes de `db.SaveChanges()` en los controllers,
  o dejar un `ActionFilter` global que complete `HttpContext.Current.Items["UsuarioAuditoria"]`.