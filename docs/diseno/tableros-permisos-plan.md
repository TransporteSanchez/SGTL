# Plan de implementación: permisos por sección de Tableros

**Objetivo:** asignar por grupo las cuatro secciones de Tableros, desde cero.
**Diseño:** `docs/diseno/tableros-permisos-diseno.md`.
**Tecnología:** HTML, jQuery y Bootstrap existentes; Web API 2, .NET Framework 4.8 y pruebas Node.

## Restricciones

- Trabajar en facugodoy, la rama preparada por el usuario; sin ejecutar SQL contra la base compartida.
- Reutilizar las tarjetas y el catálogo de permisos; sin cambios de esquema ni de EDMX.
- El permiso general anterior no habilita ninguna sección. Administradores: acceso completo.

## Casos que deben cubrirse

- Una sola sección, varias secciones de distintos grupos y ninguna sección.
- Un favorito restringido no aparece por el diseño por defecto, el guardado ni el del navegador.
- Al guardar los favoritos visibles se conservan los restringidos.
- Si la pestaña recordada ya no está autorizada, se abre la primera permitida.
- Los permisos de proformas o cuenta corriente no sustituyen al de Tableros de facturación.

## Tarea 1: tarjeta y catálogo

- [x] Agregar casos a `tests/permisos-agrupados.test.js` y `tests/permisos-menu.test.js`; observar el fallo.
- [x] Agregar los cuatro nombres a GruposController, agruparlos bajo Tableros y excluir el permiso viejo.
- [x] Actualizar textos, orden, detalle del usuario y MENU_TO_PAGE; ejecutar las pruebas hasta obtener OK.

## Tarea 2: acceso por tema y favoritos

- [x] Agregar pruebas de comportamiento de pestañas, favoritos y resolución de permisos en C#; observar el fallo.
- [x] Centralizar los temas, sus permisos y las claves de favoritos en `Security/PermisosTableros.cs`.
- [x] Devolver TemasPermitidos con los favoritos, filtrar las lecturas y validar sus escrituras en TablerosController.
- [x] Aplicar los temas a pestañas y favoritos mediante tableros-catalogo.js; autorizar facturación con su permiso propio.
- [x] Ejecutar las pruebas de Tableros y permisos hasta obtener OK.

## Tarea 3: verificación y documentación

- [x] Actualizar las pruebas existentes que controlan el permiso general anterior.
- [x] Ejecutar la suite Node completa y compilar la API sin conectarse a la base.
- [x] Revisar con la lista de AGENTS.md y una revisión de código independiente.
- [x] Actualizar `docs/PENDIENTES-SISTEMA.md` con los pasos para asignar y probar los permisos.

## Resultado local (28/10/2026)

81 pruebas Node correctas; API compilada con MSBuild en carpeta temporal. En Chrome con datos simulados,
1366 y 390 px reales: tarjeta propia, selección total y parcial, usuario con Flota y administrador con cuatro
pestañas, sin desbordes. La revisión independiente encontró pérdida de favoritos antiguos al guardar otro
tema y ranking sin autorización: ambos corregidos con pruebas de regresión que primero fallaron.
También se comprobó que una personalización del servidor prevalece sobre un diseño antiguo sin migración pendiente.

Se conservó Restablecer como reinicio completo de la personalización, la tarjeta fija Cambios para revisar con sus
permisos operativos y los permisos existentes de las APIs operativas de viajes, camiones y choferes. Son alcances
distintos del guardado de favoritos y de las secciones de Tableros. La prueba con usuarios y grupos reales sigue
pendiente, según §66 de `docs/PENDIENTES-SISTEMA.md`.

Sin commit ni push en esta tarea: los cambios quedan disponibles para revisar en el espacio de trabajo.
