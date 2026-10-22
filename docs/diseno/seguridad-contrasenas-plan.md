# Seguridad de contraseñas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Habilitar el cambio seguro de contraseña desde todas las pantallas y reemplazar las contraseñas en texto plano por hashes PBKDF2 con migración progresiva.

**Architecture:** Una utilidad pura centraliza la política, generación y verificación de hashes. Los controladores de autenticación y usuarios la usan para todos los puntos de escritura; el endpoint de cambio identifica al usuario desde el JWT validado. El encabezado común aporta el modal y consume ese endpoint, por lo que el comportamiento llega a todas las pantallas que cargan el encabezado.

**Tech Stack:** ASP.NET Web API 5 sobre .NET Framework 4.8, Entity Framework 6, SQL Server, JWT, PBKDF2-HMAC-SHA256, JavaScript ES5 y Bootstrap.

**Spec:** `docs/diseno/seguridad-contrasenas-diseno.md`

## Global Constraints

- Los textos de interfaz y respuestas permanecen en español rioplatense.
- No se regenera el EDMX; solo se ajustan manualmente los dos límites de longitud necesarios.
- No se ejecuta SQL contra la base compartida; el cambio de esquema queda como script nuevo en `database/seguridad/`.
- Ninguna contraseña real, hash, sal, token o cadena de conexión se registra, devuelve o documenta.
- No se implementan WhatsApp, correo, OTP, recuperación de cuenta ni cambios generales de permisos.

## Review Focus

- Token ausente, vencido o manipulado: el endpoint no cambia datos, devuelve `401` y la interfaz devuelve al login; se prueba en la tarea 2 y 3.
- Contraseña actual errónea: no actualiza el valor guardado ni revela si el usuario existe; se prueba en la tarea 2.
- Usuario heredado con contraseña válida: se migra una sola vez a hash y puede iniciar sesión; se prueba en la tarea 2.
- Alta o edición de usuario: toda contraseña nueva queda hasheada, sin reintroducir texto plano; se prueba en la tarea 2.
- Confirmación distinta o política inválida en el modal: no se realiza el pedido; se prueba en la tarea 3.

---

### Task 1: Base criptográfica y compatibilidad de datos

**Files:**
- Create: `WebApi_TransporteSanchez/Security/ContrasenasSeguras.cs`
- Modify: `WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj`
- Modify: `WebApi_TransporteSanchez/SGTL.edmx`
- Create: `database/seguridad/01_ampliar_contrasena_usuarios.sql`
- Test: `tests/contrasenas-seguras.test.ps1`

**Interfaces:**
- Produces: `ContrasenasSeguras.CrearHash(string)`, `Verificar(string, string)`, `EsHashVigente(string)` y `CumplePolitica(string, out string)`.
- Consumes: Ninguna interfaz de aplicación; usa solo primitivas criptográficas de .NET Framework 4.8.

- [ ] **Step 1: Write the failing test**

Crear `tests/contrasenas-seguras.test.ps1` que compile la utilidad esperada y compruebe que dos hashes generados para el mismo valor de prueba son distintos, ambos verifican, una clave incorrecta no verifica, un valor heredado se reconoce como no vigente y la política rechaza valores sin letras, sin números o fuera de 8–20 caracteres.

- [ ] **Step 2: Run test to verify it fails**

Run: `powershell -ExecutionPolicy Bypass -File tests/contrasenas-seguras.test.ps1`

Expected: FAIL porque `ContrasenasSeguras.cs` todavía no existe.

- [ ] **Step 3: Implement the hash utility and schema compatibility**

Crear `ContrasenasSeguras` con formato versionado `PBKDF2-SHA256$600000$sal$hash`, sal de 16 bytes, subclave de 32 bytes y comparación de tiempo constante. Agregar la utilidad al proyecto. Crear el script idempotente que amplía `dbo.USUARIOS.Contraseña` a `NVARCHAR(255)` y ajustar a 255 los `MaxLength` de almacenamiento y modelo de `USUARIOS.Contraseña` en el EDMX, sin regenerarlo.

- [ ] **Step 4: Run test to verify it passes**

Run: `powershell -ExecutionPolicy Bypass -File tests/contrasenas-seguras.test.ps1`

Expected: PASS, con todas las verificaciones criptográficas y de política correctas.

- [ ] **Step 5: Commit**

```powershell
git add WebApi_TransporteSanchez/Security/ContrasenasSeguras.cs WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj WebApi_TransporteSanchez/SGTL.edmx database/seguridad/01_ampliar_contrasena_usuarios.sql tests/contrasenas-seguras.test.ps1
git commit -m "Seguridad: proteger contraseñas de usuarios"
```

### Task 2: Autenticación y cambio de contraseña seguros

**Files:**
- Modify: `WebApi_TransporteSanchez/Controllers/AutenticacionController.cs`
- Modify: `WebApi_TransporteSanchez/Controllers/UsuariosController.cs`
- Delete: `WebApi_TransporteSanchez/Controllers/LoginController.cs`
- Modify: `WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj`
- Test: `tests/autenticacion-contrasenas.test.js`

**Interfaces:**
- Consumes: `ContrasenasSeguras` de la tarea 1 y los claims JWT existentes `NameIdentifier`.
- Produces: `POST api/login` con respuesta genérica para credenciales inválidas y `POST api/Usuarios/CambiarContrasena` autenticado con cuerpo `{ ContrasenaActual, ContrasenaNueva }`.

- [ ] **Step 1: Write the failing test**

Crear `tests/autenticacion-contrasenas.test.js` que verifique el contrato fuente: el login usa `ContrasenasSeguras`, ya no contiene `IsPasswordValid` ni compara `u.Contraseña ==`, el DTO de cambio no expone `Nombre_Usuario`, el endpoint valida el token y las altas/ediciones hashean una contraseña no vacía. También debe exigir que el controlador histórico no exista en el proyecto.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/autenticacion-contrasenas.test.js`

Expected: FAIL porque los controladores todavía comparan contraseñas en texto plano y el DTO acepta el usuario desde el cuerpo.

- [ ] **Step 3: Implement secure login, migration and change endpoint**

En `AutenticacionController`, buscar una sola vez el usuario por nombre, verificar con `ContrasenasSeguras` y devolver un único `401` para credenciales inválidas. Si el valor correcto es heredado, reemplazarlo atómicamente por el hash antes de emitir el token. Quitar el controlador y ruta histórica `api/login/login` del proyecto.

En `UsuariosController`, aplicar la política y `CrearHash` en altas, ediciones con contraseña y cambio. Reducir `CambiarContrasenaDto` a las dos claves, validar el bearer JWT igual que los controladores protegidos existentes, obtener el usuario del claim, rechazar usuarios inactivos y guardar únicamente el hash. Registrar `CAMBIO_CONTRASENA` sin información sensible.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/autenticacion-contrasenas.test.js; powershell -ExecutionPolicy Bypass -File tests/contrasenas-seguras.test.ps1`

Expected: PASS; el contrato no deja comparaciones en texto plano y la utilidad mantiene sus garantías.

- [ ] **Step 5: Commit**

```powershell
git add WebApi_TransporteSanchez/Controllers/AutenticacionController.cs WebApi_TransporteSanchez/Controllers/UsuariosController.cs WebApi_TransporteSanchez/Controllers/LoginController.cs WebApi_TransporteSanchez/WebApi_TransporteSanchez.csproj tests/autenticacion-contrasenas.test.js
git commit -m "Seguridad: asegurar autenticación y cambio de contraseña"
```

### Task 3: Modal común y mensajes seguros de la interfaz

**Files:**
- Modify: `views/header.html`
- Modify: `assets/static/js/header.js`
- Modify: `Login.html`
- Test: `tests/cambiar-contrasena-header.test.js`

**Interfaces:**
- Consumes: `POST api/Usuarios/CambiarContrasena` de la tarea 2 y el token guardado en `localStorage`.
- Produces: Botón funcional “Cambiar contraseña” y modal disponible en todas las páginas que cargan el encabezado.

- [ ] **Step 1: Write the failing test**

Crear `tests/cambiar-contrasena-header.test.js` que compruebe que el enlace tiene identificador funcional, el modal contiene actual/nueva/confirmación, el script envía solo `ContrasenaActual` y `ContrasenaNueva` con bearer token, bloquea confirmaciones distintas y limpia la sesión ante `401`. Debe comprobar también que `Login.html` no registra el cuerpo de inicio de sesión, no espera errores por campo de autenticación y no transforma lo escrito en el campo de contraseña.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/cambiar-contrasena-header.test.js`

Expected: FAIL porque el enlace actual apunta a `#` sin controlador ni modal.

- [ ] **Step 3: Implement the shared modal flow**

Agregar el modal al fragmento de encabezado y enlazarlo desde `setupUserInfo`. Validar en el navegador la confirmación y la política antes de usar `fetch`; mostrar mensajes inline accesibles, deshabilitar el envío mientras está en curso y no imprimir datos sensibles en consola. Al éxito, limpiar y cerrar; ante `401`, limpiar la sesión local y redirigir a `Login.html`. Adaptar el login al mensaje genérico de credenciales y eliminar el registro de la solicitud.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/cambiar-contrasena-header.test.js`

Expected: PASS; el flujo usa la sesión actual y no transmite un nombre de usuario ni expone la contraseña.

- [ ] **Step 5: Commit**

```powershell
git add views/header.html assets/static/js/header.js Login.html tests/cambiar-contrasena-header.test.js
git commit -m "Usuarios: habilitar cambio seguro de contraseña"
```

### Task 4: Verificación integral y documentación de cierre

**Files:**
- Modify: `docs/PENDIENTES-SISTEMA.md`
- Modify: `docs/README.md`

**Interfaces:**
- Consumes: Las tareas 1 a 3.
- Produces: Evidencia de pruebas y pendiente R4 actualizado sin introducir acciones externas.

- [ ] **Step 1: Run the full automated suite**

Run: `Get-ChildItem tests -Filter *.test.js | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }; powershell -ExecutionPolicy Bypass -File tests/contrasenas-seguras.test.ps1`

Expected: PASS para cada prueba JavaScript y para la prueba criptográfica.

- [ ] **Step 2: Compile the API**

Run: `msbuild WebApi_TransporteSanchez.sln /t:Build /p:Configuration=Debug /m`

Expected: Build succeeded, sin errores.

- [ ] **Step 3: Perform the manual acceptance check**

Aplicar el script únicamente en un entorno autorizado, iniciar sesión con un usuario de prueba heredado, confirmar la migración sin inspeccionar ni exponer secretos, cambiar la contraseña desde dos pantallas distintas, verificar que la anterior falla con mensaje genérico y la nueva funciona. Confirmar además el comportamiento ante una sesión vencida.

- [ ] **Step 4: Update traceability**

Marcar R4 como resuelto en `docs/PENDIENTES-SISTEMA.md`, reemplazar la propuesta de doble factor por la referencia a la implementación básica sin WhatsApp y conservar en `docs/README.md` los enlaces a este diseño y plan.

- [ ] **Step 5: Commit**

```powershell
git add docs/PENDIENTES-SISTEMA.md docs/README.md
git commit -m "Documentación: cerrar cambio seguro de contraseña"
```
