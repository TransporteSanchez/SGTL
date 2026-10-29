# Limpieza de viajes antes de la reunión del 29/10

Para que lo que ve el profe en viajes parezca real y esté cerrado (§41, puntos 16, 21, 34 y 37 de
`docs/PENDIENTES-SISTEMA.md`). Lo hace Rocío; Claude ayuda a decidir con los resultados.

## Antes de empezar

- **Cuándo:** después de la prueba de viajes en la VM (ronda 2 de `docs/equipo/INSTRUCTIVO-PRUEBAS-28-10.md`), porque esa
  prueba también carga viajes que hay que limpiar, y con la API recompilada (con `database/viajes/04_…` corrido; si no,
  Gestionar viajes no carga).
- **La base es compartida:** avisarles a Facu y a Fede que se van a editar, cancelar y eliminar viajes, clientes y
  choferes.
- **WhatsApp:** cancelar un viaje con chofer, reactivarlo o cambiarle el chofer le manda un mensaje al chofer. Hacer la
  limpieza **sin el token del día** (vencido o sin cargar): el aviso "no se pudo enviar" es esperable y a nadie le llega
  nada.
- **Todo por pantalla**, salvo lo que la pantalla no deja: así pasa por los mismos controles y queda en Auditoría. El
  único SQL es el del viaje #11 (paso 4), dentro de `BEGIN TRAN … ROLLBACK`.
- **Los resultados de las consultas no se guardan en el repo** (tienen nombres de choferes y clientes).

## 1. Correr las consultas (solo lectura, SSMS, base Transporte_Sanchez)

1. `database/limpieza/05_relevar_viajes_para_la_demo.sql`: ocho tablas. La primera columna dice cuál es y la última,
   qué hacer con cada fila.
2. `database/verificacion/02_viajes_superpuestos.sql`: los pares de viajes con el mismo camión o chofer que se pisan.
3. `database/limpieza/01_relevar_datos_de_prueba.sql`: los textos con "prueba", "claude", "test"…

Si alguna fila no se entiende o no queda claro qué hacer, pasásela a Claude antes de tocar nada.

## 2. Camiones y precio del gasoil (tablas 7 y 8)

Primero, porque el tipo del camión cambia la tarifa y el consumo hace falta para el combustible y el margen de los viajes
que se cierren después.

- **Gestionar camiones → Editar** cada camión que diga "Falta…": el **tipo** (sin él no hay tarifa), el **kilometraje
  inicial con su fecha** y el **consumo** (litros cada 100 km). Con los datos reales de los camiones.
- **Gestionar camiones → Cambiar precio del gasoil**: el precio actual, desde hoy.
- **ITV vencida:** si la fecha real es otra, corregirla; si está vencida de verdad, dejarla (el dashboard la marca, y
  sirve para mostrarlo).

## 3. Clientes (tablas 4 y 5)

- **Distribuidora del Sur con plataforma** (punto 16): solo QUICKFOOD tiene que tenerla. Mirar sus viajes en la tabla 4:
  - Si son de prueba: cerrarlos en el paso 5 (eliminarlos o cancelarlos) y después **Editar cliente → Tipo: Directo**, o
    inactivar el cliente si no se va a usar.
  - **Antes de pasarlo a Directo, que no tenga viajes abiertos ni Listo para facturar:** el flujo cambia (con plataforma,
    Registrado → Listo para facturar; directo, Registrado → En viaje → Entregado) y quedarían en un estado que el directo
    no tiene. Si tiene, consultarlo con Claude.
- **distribuidora-powerful S.A.** (§38): **Editar cliente** con un nombre inventado y creíble, como los demás (por
  ejemplo, "Distribuidora Serrana S.R.L."). Sus viajes, comprobantes y recibos lo siguen teniendo. Cambiarle también el
  **e-mail** (hoy es la casilla personal de alguien del equipo: cualquier envío le llegaría) y el **CUIT** (armado con un
  DNI real) por unos inventados (§62, M8). Su viaje #5 está en la PF-00000005 de la ronda 3: se libera anulándola (§62).
- Los demás que la tabla 5 marque (empieza en minúscula, sin CUIT, inactivo con viajes abiertos) y los que a ojo no
  parezcan reales.

## 4. Choferes (tabla 6) y viajes superpuestos

- **Choferes con apellidos del equipo** (Montenegro, Godoy y los dos Pai): **Editar chofer** con nombre y apellido
  inventados y creíbles. Sus viajes los siguen teniendo. El chofer 12 (dquiroga) queda como está: es el de la demo.
- **Viajes superpuestos:** la tabla del punto 21 de la §41 de `docs/PENDIENTES-SISTEMA.md` (cinco viajes para editar y el
  SQL del #11). Al cambiar el camión el importe puede cambiar. Si alguno no se hizo, en lugar de cambiarle el camión o el
  chofer se cancela con motivo (un cancelado no cuenta como ocupado). Al terminar, la consulta 02 tiene que dar solo el
  par #5 y #6.

## 5. Viajes con fecha pasada sin cerrar (tabla 1)

Fila por fila, lo que dice `Que_hacer` (después del paso 4: un viaje superpuesto da "Camión ocupado" al editarlo):

- **Directo que se hizo:** Cambiar estado → **En viaje** (uno atrasado se puede iniciar) → Cambiar estado →
  **Entregado**, con la fecha de entrega (no futura), el resultado y la **evidencia** (obligatoria en los directos: una
  foto o un PDF del remito; para un viaje de prueba, un remito de ejemplo sin datos reales).
- **Directo que llegó y no había carga** (En viaje): Cambiar estado → **Sin carga**.
- **Directo En viaje que no se hizo:** Cambiar estado → **Registrado** y después, como cualquier viaje que no se hizo
  (abajo). Si tiene gastos del chofer, no se elimina: se cancela.
- **Con plataforma que se hizo:** Editar el viaje y completar el N° de transporte, el remito y el N° de entrega →
  Cambiar estado → **Listo para facturar**.
- **No se hizo:** si dice "eliminarlo", **Eliminar**; si no (viene de un presupuesto, tiene gastos del chofer o está en
  una proforma), Cambiar estado → **Cancelado** con un motivo real ("No se realizó.").
- **Está en una proforma:** se resuelve desde la proforma (si es un borrador, quitarlo de ahí). Si es una generada o
  aceptada, consultarlo con Claude.

## 6. Lo demás (tablas 2 y 3, textos de prueba)

- **Tabla 2, chofer o camión que no corresponde:** Editar viaje y asignarle uno activo (cambiar el camión puede cambiar el
  importe).
- **Tabla 3, sin importe:** lo que diga cada fila (cargar los km, elegir la tarifa o el tipo del camión, y guardar). Los
  facturados quedan como están.
- **Textos de prueba (consulta 01):** lo que sea de viajes, presupuestos (los #4 y #5, §40, punto 6), clientes o choferes,
  corregirlo por pantalla. Los de comprobantes van con la limpieza de la facturación (§38, después del cambio de Facu).

## 7. Al terminar

1. Volver a correr la consulta 05: las tablas 1 a 4 vacías, o solo con lo que se decidió dejar; las 7 y 8 sin "Falta…".
   La 02, solo el par #5 y #6.
2. Abrir Gestionar viajes, Listar viajes, el dashboard y Tableros y mirarlos como los va a ver el profe.
3. Contarle a Claude qué se hizo, para anotarlo en el punto 21 de la §41.

**Queda afuera:** la facturación de prueba (§38, después del cambio de Facu), el grupo de usuarios viejo
"PRUEBA-CLAUDE 20/10" y lo demás de usuarios (§59).
