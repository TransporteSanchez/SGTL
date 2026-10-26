# Instrucciones para cualquier IA que trabaje en SGTL

Este archivo lo leen solos Codex, Cursor, Copilot y Claude Code (Claude lo incluye desde `CLAUDE.md`).
**Leelo entero antes de cambiar algo.** Vale para todo el equipo (Rocío, Facu, Fede) y para todos los
módulos, sin excepciones.

## El proyecto

- **Front:** páginas HTML estáticas en la raíz (`gestion-*.html`, `listado-*.html`, …) con jQuery y Bootstrap 5
  (plantilla Mazer). JS compartido en `assets/static/js/`.
- **API:** `WebApi_TransporteSanchez/`, ASP.NET Web API 2 (.NET Framework 4.8) en `http://localhost:50222/api`.
- **Base:** Azure SQL **compartida por todo el equipo**. Lo que se escribe ahí lo ven todos.
- **Pendientes:** `docs/PENDIENTES-SISTEMA.md` es la lista única.

## Antes de empezar

1. **Traé la rama actualizada** (`git pull`). Si tu rama es vieja, vas a copiar pantallas que ya cambiaron.
2. Si vas a tocar una pantalla, un texto o un mensaje de la API, **leé entero
   `docs/design-system/03-decisiones.md`** (ver la sección siguiente).

## Design system: obligatorio en todo

- **Toda pantalla nueva o tocada sigue `docs/design-system/03-decisiones.md`.** Vale para todos los módulos
  (viajes, proformas, cuenta corriente, facturación, presupuestos, e-mail, WhatsApp, usuarios…) y también para
  los textos que devuelve la API y se ven en pantalla. No es solo estilo: incluye botones, verbos, voseo,
  mayúsculas, avisos, confirmaciones, modales, formularios, fechas y montos.
- **Si una pantalla existente no cumple una regla, la regla gana.** No copies lo que ves en otra pantalla ni en
  una rama vieja: fijate en el documento.
- **Usá las funciones de `assets/static/js/sgtl-ui.js` (`window.SGTL`)** y los estilos de
  `assets/static/css/sgtl.css`. No escribas tu propio aviso, confirmación, etiqueta de estado, tooltip, selector
  de fecha, formato de montos ni validación. La tabla de funciones está al principio del design system.
- **Si algo no está decidido en el documento, preguntá** antes de inventar un patrón nuevo.
- Si cambiás una regla (con el OK de Rocío), actualizá el documento y esta lista en el mismo commit.

### Lista de control antes de commitear

Revisá cada punto contra tus cambios (pedile a tu IA: "Revisá los cambios con la lista de control de
AGENTS.md"):

1. **Botones de la fila:** solo ícono con tooltip y `aria-label`, con `SGTL.botonFila` / `SGTL.accionesFila`,
   en el orden Ver detalle · Editar · Ver PDF · Cambiar estado · Siguiente paso · Activar/Inactivar ·
   Eliminar/Anular. **Lo que no se puede hacer queda deshabilitado con el motivo, no se esconde.** El motivo es siempre
   "No se puede {acción} {sobre qué}: {qué le pasa a esta fila}" ("No se puede eliminar el chofer: está activo"), sin
   órdenes ni reglas sueltas como "Primero…" o "Solo se…" (la regla va solo si el motivo es el tipo de la fila: "No se
   puede editar la factura: solo se editan los recibos"); vale también para el pie de un modal. Fuera de las filas,
   los botones llevan texto ("Editar cliente", "Reemplazar Excel"), no solo un ícono. (§1.4, §1.6)
2. **"Ver PDF"** abre la vista previa dentro del sistema con el pie Cerrar · Enviar por e-mail · Imprimir ·
   Descargar PDF. "Enviar por e-mail" va ahí, no como botón de la fila. **El ojo** de un documento lo abre
   completo, en solo lectura. (§1.4)
3. **Verbos en infinitivo:** el botón que abre un modal y el título del modal dicen lo mismo ("Registrar
   recibo", "Emitir comprobante directo"). Nada de "Nuevo…", "Alta" ni sustantivos solos. Las opciones del menú
   empiezan con verbo ("Gestionar…", "Listar…") y el título de la pantalla es igual a la opción. (§3.1, §6.1)
4. **Pie de los modales:** Cancelar + el verbo ("Guardar", "Eliminar", "Emitir recibo"). **Nunca
   "Confirmar".** Los formularios llevan `data-bs-backdrop="static"`; los de detalle, solo "Cerrar", armados con los
   bloques de su formulario (`.sgtl-dato`, estado en el título). (§6.2)
5. **Avisos con `SGTL.toastExito` / `SGTL.toastError`**; el error de un modal abierto, dentro del modal con
   `SGTL.avisoFormulario` (si alcanza a varias cosas, una línea con el total y la lista agrupada como `detalle`, no "el
   primero y N más"). **Nunca `alert()`.** (§5.1)
6. **Confirmaciones con `SGTL.confirmar`** (con motivo si hace falta). **Nunca `confirm()` ni `prompt()`.** (§5.2)
7. **Formularios con `SGTL.validador`:** asterisco rojo en lo obligatorio, `form-label` con `for`, el error
   debajo de cada campo y "Revisá los campos marcados." arriba. Los largos, en bloques con `.sgtl-bloque-titulo`
   (nunca un `h6` ni un subtítulo con estilo propio); lo
   que no se puede editar se ve como texto (`.sgtl-dato-fijo`), nunca como campo deshabilitado. (§6.3)
8. **Textos:** voseo ("Completá", "Seleccioná", "Probá de nuevo"), **mayúscula solo al principio** (también
   "la factura", "el recibo", "la nota de crédito", "la proforma" dentro de un texto), títulos y botones sin
   punto, mensajes con punto, sin inglés a la vista, "km" en minúscula y sin "s" ("130 km", §7.3). **Nunca un error
   técnico** en pantalla ni en los mensajes de la API. Excepción: "Emitir Débito" en Cuenta corriente. (§9)
9. **Estados con `SGTL.estado`** (etiqueta de color según su significado); no inventes colores. Lo que acompaña al
   estado en una tabla (en qué proforma está, qué falta resolver) va en el ícono que abre un globito
   (`SGTL.botonInfo`), no en más etiquetas. (§4)
10. **Fechas con `SGTL.selectorFecha` / `SGTL.rangoFechas`:** se ven DD/MM/AAAA (con hora, DD/MM/AAAA HH:MM) y
    a la API va AAAA-MM-DD. Nunca `type="date"`. (§7.1, §7.2)
11. **Montos:** se muestran con `SGTL.monto` ("$ 1.234,56"); los que se escriben son
    `type="text" inputmode="decimal"` con `SGTL.enlazarMascaraMonto` y se leen con `SGTL.montoCentavos`. Nunca
    `type="number"` para plata. (§7.3)
12. **Tablas con `SGTL.tabla`:** rayadas, alineadas por tipo de dato, "Cargando…" mientras busca y el texto de
    sin resultados del sistema. Si una tabla permite ordenar, se hace clic en el encabezado con
    `SGTL.tabla.habilitarOrden`: primer clic ascendente, segundo descendente. El orden se aplica antes de paginar y
    también al exportar. (§2)
13. **Filtros:** cada uno con su cruz (`SGTL.filtros`), "Buscar" siempre, Enter busca. (§1.3, §3.3)
14. **Íconos solo de Bootstrap Icons**, con `aria-hidden="true"`. Sin estilos propios de botones, avisos ni
    tablas en la pantalla. (§11, §12)

## Reglas del repo

- **Nunca correr SQL contra la base compartida.** Los cambios de esquema van como script nuevo, idempotente, en
  `database/<módulo>/NN_descripcion.sql`; los datos se proponen dentro de `BEGIN TRAN … ROLLBACK` para que los
  corra Rocío.
- **No regenerar el EDMX** ("Update Model from Database"): las columnas nuevas se usan con SQL directo.
- **Pantalla nueva: menú y permiso.** Antes de hacerla, definí con Rocío en qué sección del menú va, en qué lugar y
  quién la puede abrir; si no está claro, preguntá. Al terminar, entrá como admin y como un usuario que no lo es, y
  comparalo con las pantallas hermanas. Cómo se hace:
  - **Menú:** `buildFallbackSidebarHtml` en `assets/static/js/sidebar-loader.js`, la tabla del §3.1 del design system y
    `OPCIONES_DEL_MENU` en `assets/static/js/permisos-menu.js` (el texto con el que se ve el permiso en Grupos y
    permisos y en Ver detalle del usuario).
  - **Solo administradores:** dentro de Configuración (la sección entera es de admins) o con `.solo-admin` en otra
    sección; el archivo va en las dos listas de páginas de configuración de `sidebar-loader.js` (mandan al inicio a
    quien no es admin) y la API rechaza a quien no es admin al guardar. Igual va al catálogo de Grupos y permisos, en su
    sección, para que estén todas las pantallas (decisión de Rocío, 23/10; tildarlo no da acceso, y qué hacer con esos
    permisos está pendiente de ver con Facu).
  - **Con permiso de grupo** (Gestionar grupos y permisos): el nombre en `CatalogoMenuPermisos` y
    `MenuPrincipalPorPermiso` (`GruposController.cs`), la clave en `MENU_TO_PAGE` (`sidebar-loader.js`) y, si guarda
    datos, que la API controle el permiso.
- **Los datos de la empresa no se escriben en el código** (nombre, CUIT, domicilio, teléfono, e-mail, logo): salen de
  Configuración → Gestionar empresa (`api/empresa`; en un PDF, `SGTLEmpresa.obtener` de `empresa-datos.js` con la fecha
  de emisión del documento). En un documento va el logo de la empresa, nunca el del sistema (`GestionContenido`).
- **`Web.config` tiene la cadena de conexión con contraseña:** no la copies, no la muestres y no agregues otros
  secretos al repo.
- **Fechas y horas:** la hora sale de tres lugares distintos (base en UTC, API en hora local, navegador en UTC).
  Antes de guardar o comparar fechas, leé la §2 de `docs/PENDIENTES-SISTEMA.md`.
- **Pruebas:** `tests/` tiene pruebas de Node (`node tests/<archivo>.test.js`, tienen que imprimir `OK`). Si tu
  cambio modifica algo que una prueba controla, actualizá la prueba a la decisión nueva; no la borres.
- **Commits** en español con el formato `Módulo: qué cambió` (ej. `Viajes: km a mano solo si Google falla`), uno
  por tema. Al terminar un pendiente, actualizalo en `docs/PENDIENTES-SISTEMA.md` en el mismo commit, con cómo
  probarlo.

## Documentación

- **Toda la documentación va en `docs/`.** En la raíz solo quedan `AGENTS.md` y `CLAUDE.md`.
- **Antes de crear, mover o renombrar un `.md`, leé `docs/README.md`**: dice en qué carpeta va cada documento,
  cómo se nombra y qué índice actualizar. Si no encaja en ninguna carpeta, preguntá.
