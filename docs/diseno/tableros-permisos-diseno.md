# Permisos por sección de Tableros

Pedido de Facu, 28/10/2026: una tarjeta Tableros en Permisos por grupo, con Viajes, Flota,
Choferes y Facturación. La casilla principal selecciona las cuatro, con el mismo estado parcial
que las demás tarjetas. Facu eligió asignarlas desde cero: el permiso general anterior deja de dar acceso.

Se reutilizan MENU y GRUPOS_MENU y su catálogo automático en GruposController. Una tabla nueva
duplicaría el mecanismo de permisos existente. Las cuatro claves son «Tableros de viajes»,
«Tableros de flota», «Tableros de choferes» y «Tableros de facturación»; se agrupan bajo Tableros.
En la tarjeta se ven los nombres de las pestañas; en el detalle del usuario llevan el prefijo Tableros.

Los permisos de los distintos grupos se suman. Un administrador ve las cuatro secciones y un
chofer conserva su acceso exclusivo a Hojas de ruta. Al menos una sección permite abrir Tableros.
Las pestañas y los favoritos del dashboard muestran únicamente los temas permitidos, también al
restablecer o recuperar un diseño viejo. Guardar favoritos conserva los de secciones temporalmente
restringidas. La API controla el tema al guardar y el permiso específico al consultar facturación.
Si no puede leer los permisos, no muestra tableros como alternativa.

No se cambian los permisos operativos de viajes, camiones, choferes ni cuenta corriente. No se
ejecuta SQL contra la base compartida ni se modifica el EDMX. El catálogo se completa con el
mecanismo existente al abrir Permisos por grupo; después se asignan las cuatro casillas a mano.
