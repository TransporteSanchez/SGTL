# Instructivo para preparar las cuentas de los choferes (para la VM)

Para la sesión de Claude Code que trabaja en la VM. Las reglas de la sesión y el formato del reporte son los de
`docs/equipo/PRUEBAS-VM-CLAUDE.md`, **con una excepción que pidió Rocío para esta tarea (25/10):** acá sí se registran un
grupo, un chofer y un usuario, y **quedan en la base** (no se limpian al final): son el chofer de la demo de la hoja de
ruta (§36 de `docs/PENDIENTES-SISTEMA.md`).

El chofer usa el sistema con una cuenta de usuario propia, con el **rol Chofer**, que apunta a su ficha de Gestionar
choferes y solo abre Hojas de ruta (desde el 27/10: antes era rol user con el grupo "Choferes"; ver
`database/hoja-de-ruta/02_rol_chofer.sql`). Hoy se hace **una sola cuenta, de prueba**; las de los choferes reales
quedan para otro día, a partir del relevamiento de la parte 1.

## 0. Antes de empezar

- `git log --oneline -1` y anotalo. La API y Five Server levantados; Ctrl+F5. El login como admin lo hace Rocío.
- Tienen que estar corridos `database/hoja-de-ruta/01_usuario_chofer.sql`, `database/hoja-de-ruta/02_rol_chofer.sql`,
  `database/seguridad/02_recupero_contrasena.sql` (el e-mail de los usuarios) y
  `database/costos/01_galpon_kilometraje_y_gastos.sql` (preparación de la §39). Si Gestionar usuarios no muestra el campo
  "Chofer" al elegir el rol Chofer en Registrar usuario, o dice que no se pudieron cargar los choferes, pará y avisale a
  Rocío.
- **No asignes viajes ni cambies estados:** eso manda WhatsApp y es de la tanda 3 (§39).
- **No escribas contraseñas.** En el paso 3.2 la contraseña la escribe Rocío, y el login con el chofer también.
- Galpón (lo cargó Rocío el 25/10), solo mirar: Configuración → Gestionar empresa → sección Galpón muestra la dirección y
  quién la modificó. **No toques Guardar.** Anotá en el reporte si se ve bien.

## 1. Relevamiento de los choferes (solo lectura)

1. Listar choferes → Estado: **Todos** → Buscar. Recorré todas las páginas.
2. Gestionar usuarios → Registrar usuario → Rol **Chofer** → abrí el buscador "Chofer": lista solo los choferes que
   **todavía no tienen cuenta**. Anotá cuáles aparecen y **Cancelar** (no guardes nada).
3. En el chat, armale a Rocío una tabla con cada chofer: ID, nombre y apellido, estado, si ya tiene cuenta y si parece de
   prueba (nombres con PRUEBA, CLAUDE, "Prueba, Fede" o parecidos). Al final, cuántos activos reales hay sin cuenta.
4. **En el reporte, sin datos personales de los choferes reales** (`docs/README.md`, regla 7): de los reales, solo ID,
   estado y si tiene cuenta; nada de nombre, DNI, CUIL ni teléfono. De los de prueba sí va el nombre, para la limpieza.

## 2. El grupo "Choferes" (ya no hace falta)

Desde el 27/10 el chofer no usa grupos: con el rol Chofer ve solo Hojas de ruta. Este paso queda por si se arma una cuenta
como antes; **saltealo** salvo que Rocío diga otra cosa.

Configuración → Gestionar grupos y permisos.

1. Pestaña Grupos: si ya hay un grupo "Choferes", no registres otro y pasá al punto 2. Si no, **Registrar grupo** →
   nombre "Choferes" → Guardar.
2. Pestaña Permisos → grupo Choferes → tildá **solo "Hoja de ruta"** (está en General) → Guardar permisos. Si el grupo
   ya existía con otros permisos, pará y preguntale a Rocío antes de sacárselos.
3. Volvé a elegir el grupo: tiene que quedar tildado solo "Hoja de ruta".

## 3. Un chofer de prueba con su cuenta

### 3.1 El chofer (con su usuario, desde el 28/10)

1. **Pará y preguntale a Rocío qué celular usar** (código de área y número). Ese número recibe el WhatsApp de cada viaje
   que se le asigne en la tanda 3: tiene que ser uno del equipo.
2. Gestionar choferes → Registrar chofer, con datos verosímiles (§3 de `docs/equipo/PRUEBAS-VM-CLAUDE.md`): un nombre y un
   apellido comunes que no estén ya en la lista de la parte 1, DNI y CUIL inventados que cumplan el formato, el celular de
   Rocío, e-mail `@example.com` (es obligatorio: se copia a su usuario y no puede ser el de otro usuario) y un domicilio que
   exista. En "Acceso al sistema", el nombre de usuario se propone solo
   (dejalo así, salvo que Rocío diga otro) y la contraseña **la escribe Rocío**. Guardar → "Chofer registrado con el
   usuario …". Anotá el ID del chofer y el usuario.

### 3.2 La cuenta (ya no hace falta)

Desde el 28/10 la cuenta se crea con el chofer (3.1). Este paso queda para revisar que quedó bien: Gestionar usuarios →
Editar ese usuario → rol Chofer, con su chofer y sin grupos. Cancelar. Si el chofer se registró antes del 28/10 sin
usuario, se le crea desde Gestionar choferes → Editar chofer → "Acceso al sistema".

### 3.2.1 La cuenta como se hacía antes (solo si Rocío lo pide)

### 3.2 La cuenta

1. Gestionar usuarios → **Registrar usuario**:
   - Nombre y apellido: los del chofer.
   - Nombre de usuario: inicial del nombre y apellido, en minúscula, como los otros (`fgodoy`). Si ya existe, preguntale a
     Rocío.
   - Contraseña: **la escribe Rocío** (de 8 a 20 caracteres, con letras y números). Ella se la anota.
   - Rol **Chofer**, Activo (no pide grupos).
   - Chofer: el de 3.1 (tiene que aparecer en la lista). Sin elegirlo, "Seleccioná el chofer." debajo.
2. Guardar → aviso verde. Puede tardar unos segundos (es el cifrado de la contraseña). Anotá el ID del usuario.
3. Editar ese usuario: rol Chofer y su chofer, sin grupos. Cancelar.
4. Registrar usuario otra vez → el desplegable "Chofer" ya no lo lista. Cancelar.
5. Auditoría: el alta del usuario y el cambio de chofer ("ChoferID: ninguno -> …") con el usuario de Rocío.

### 3.3 Entrar como chofer

1. Rocío cierra sesión y entra con la cuenta nueva.
2. Tiene que ir **directo a Hojas de ruta**, con el menú plegado. El botón de tres rayitas lo abre con el logo y solo
   "Hojas de ruta".
3. Como todavía no tiene viajes: "No tenés viajes para hoy ni para los próximos días.". Anteriores: "No tenés viajes
   anteriores en 2026.".
4. Escribí `index.html` en la barra de direcciones → vuelve a la Hoja de ruta.
5. F12: sin errores rojos. Probalo también a 390 px (modo celular).
6. Rocío cierra sesión y vuelve a entrar como admin.

## 4. Reporte

Con el formato de `docs/equipo/PRUEBAS-VM-CLAUDE.md`, en `C:\pruebas-sgtl\reportes\AAAA-MM-DD-cuentas-choferes.md`. En
"Datos de prueba creados o modificados" van el grupo, el chofer y el usuario con sus ID y nombres, marcados **"queda para
la demo, no limpiar"**, así que no hace falta SQL de limpieza para ellos. Sumá el relevamiento de la parte 1 (sin datos
personales de los reales) y lo que haya salido raro en el camino.
