# Proforma Rukas — qué hay que tocar y cómo lo desarrollamos

Plan de desarrollo del diseño acordado en el §10 de `docs/negocio/PROFORMA-CLIENTES-RUKAS.md`
(importar el Excel de Rukas, control línea por línea, factura por el total de Rukas).
Fecha: 18/10/2026. **Propuesta: todavía no empezó el desarrollo.**

---

## 1. Antes de escribir código

| # | Qué | Por qué | Quién |
|---|---|---|---|
| A | **Traer a la rama el commit nuevo de Facu** (`4a84bb2`, presupuestos, en `origin/facugodoy`) | Toca `ProformasController.cs`, `ViajesController.cs` y `gestion-viajes.html`, los mismos archivos que vamos a tocar. Integrarlo antes evita conflictos después. | Rocío |
| B | **Confirmar si los importes de Rukas son netos (sin IVA)** | SGTL arma la proforma con IVA 21 % por línea (`IvaPct = 21`) y compara netos. Si Rukas da netos, la factura es total de Rukas + IVA; si da importes con IVA, se compara distinto. Una forma de verlo: la factura `A00005-00000659` de la proforma cerrada 7450, ¿es por el total de Rukas o por ese total × 1,21? | Rocío / Claudia |
| C | **Rama de trabajo** (ver §2) | — | Rocío |

Las preguntas 7 y 8 de Claudia y el OK de Facu (§11 del documento de negocio) **no frenan el arranque**: el diseño ya contempla las dos salidas. Sí hay que tenerlas cerradas antes de pasar a `main`.

---

## 2. Rama y forma de trabajo

**Recomendación: una rama propia del tema, `rocionuvoli-proforma-rukas`, creada desde `rocionuvoli`.**

- Mientras esto está a medio hacer, `rocionuvoli` puede seguir pasando a `main` otras cosas ya probadas (design system, correcciones), sin arrastrar un módulo incompleto.
- La VM hace `git checkout rocionuvoli-proforma-rukas` + `pull` para probar cada etapa.
- Cuando todo está probado y cerrado con Facu y Claudia: merge a `rocionuvoli` y de ahí a `main`, como siempre.
- Si preferís trabajar directo en `rocionuvoli`, también funciona. La condición es no pasar `rocionuvoli` a `main` hasta terminar esto.

**Un commit por etapa** (ver §4), con el formato `Proformas: …`. Al terminar cada etapa se actualiza el ítem 6 de `docs/PENDIENTES-SISTEMA.md` con cómo probarla en la VM.

**Para no pisarse con Facu:** lo nuevo va en **archivos nuevos** (un controller y un JS propios de Rukas). En sus archivos (`ProformasController.cs`, `FacturasController.cs`, `gestion-facturacion.html`) solo se tocan los puntos de enganche mínimos, listados en §3.

---

## 3. Qué se toca

### Base de datos — script nuevo `database/proformas-rukas/01_proforma_rukas.sql`

Idempotente. Todo lo nuevo es nullable o tiene default, así que **no rompe el código de Facu** aunque se corra antes de que él tenga los cambios.

- **`PROFORMAS`, columnas nuevas:**
  - `Tipo_Proforma` (`Propia` / `Rukas`, default `Propia`).
  - `Rukas_Numero`.
  - `Rukas_Obs_Aceptacion`.
  - `Rukas_Correccion_Fecha`, `Rukas_Correccion_Motivo`, `Rukas_Correccion_Medio`.
  - `Rukas_Cargada_Fecha`, `Rukas_Cargada_Usuario` (se usan en la etapa 6).
- **Índice único filtrado:** (`ClienteID`, `Rukas_Numero`) para proformas Rukas no anuladas.
- **Tabla nueva `PROFORMA_RUKAS_LINEA`:**
  - Lo que trae el Excel: `Proforma_ID`, `Orden`, `Num_Transporte`, `Fecha`, `Ruta`, `Importe_Viaje`, `Adicionales`.
  - Lo que calcula el control: `Viaje_ID` (puede quedar vacío), `Importe_SGTL`, `Resultado` (casos 1–6 del §10) y `Detalle`.
- **Tabla nueva `PROFORMA_ADJUNTO`:** el Excel original importado. Mismo patrón que `VIAJE_EVIDENCIA`: nombre, tipo y `VARBINARY(MAX)`.
- **Estado nuevo `En_correccion`:** `PROFORMAS.Estado` no tiene restricción en la base; los estados válidos están en el código.

Rocío corre el script en la base compartida. La base es una sola, así que avisarle a Facu que aparecen columnas nuevas.

### API — archivo nuevo `Controllers/ProformasRukasController.cs`

SQL directo, como `ProformasController`, sin tocar el EDMX. Ruta `api/ProformasRukas`:

| Endpoint | Qué hace |
|---|---|
| `POST Importar` | Recibe cliente, N° Rukas, nombre de archivo, archivo en base64 y las celdas del Excel como texto. Valida (caso 8), crea la proforma con tipo Rukas, estado `Generada` y número PF de la secuencia, guarda líneas y adjunto, reserva los viajes encontrados (`PROFORMAS_VIAJES`), arma los conceptos y devuelve el control. |
| `POST {id}/Reimportar` | Igual, sobre la misma proforma: reemplaza líneas, conceptos y adjunto. Solo en `Generada` o `En_correccion`. |
| `GET {id}/Control` | **Volver a controlar:** recalcula los resultados contra los viajes actuales, sin reimportar. Devuelve líneas, totales (Rukas / SGTL / diferencia) y avisos del caso 7. |
| `POST {id}/Aceptar` | Pasa a `Aceptada`. Con casos 6 u 8 rechaza; con casos 2, 4 o 5 pendientes exige observación. |
| `POST {id}/PedirCorreccion` | Pasa a `En_correccion` con fecha, motivo y medio. |
| `GET ViajesSinProforma?clienteId=` | Viajes del cliente listos para facturar que no están en ninguna proforma. Sirve de guía antes de generar en Rukas (paso 0) y para el aviso del caso 7. |
| `POST {id}/CargadaEnRukas` | Etapa 6, depende del N° fiscal. |

**Cómo se arman los conceptos (`PROFORMA_DETALLE`):** una línea por transporte, con precio = importe de viaje + adicionales de Rukas y `IvaPct` según lo que salga de 1-B.
- Si el transporte coincidió con un viaje, el código es `V{Viaje_ID}`. Así la reserva, el control de "ya facturado" y el paso a `Facturado` al emitir la factura funcionan sin cambios.
- Si no hay viaje en SGTL (caso 5), el código es `RK{N° transporte}`.

**Lectura del Excel:** la página de facturación **ya carga SheetJS** (`xlsx@0.18.5`), así que el navegador solo extrae las celdas como texto y las manda. **Las reglas** (encabezados exactos, coma de miles, fecha `dd.MM.yyyy`, transportes repetidos) **se aplican en la API**, que es la que decide. No hace falta agregar paquetes NuGet.

### Enganches en archivos existentes (mínimos)

- **`ProformasController.cs`:**
  - `EstadosValidos` y `Anular` aceptan `En_correccion`.
  - `Editar`, `Generar`, `Duplicar` y `PrellenarViajes` rechazan proformas de tipo Rukas, que no se editan a mano.
  - "Nueva proforma" propia, para clientes `Con_plataforma`: pregunta 3 del §11. Primero se avisa; el bloqueo queda para cuando esté todo probado.
  - `Listar` y `Obtener` devuelven `Tipo_Proforma` y `Rukas_Numero`.
- **`FacturasController.cs`:** en principio, nada. La proforma Rukas llega `Aceptada` con conceptos y totales coherentes, que es lo que ya exige. Se verifica en la etapa 5.
- **`gestion-facturacion.html`:**
  - Botón **"Importar proforma Rukas"** junto a "Nueva proforma", más el modal con el mismo título.
  - Columna o marca de tipo en el listado.
  - Carga de un JS nuevo `assets/static/js/proformas-rukas.js`, donde va toda la lógica de pantalla de este módulo.
  - Es pantalla de Facu: avisarle antes, y decidir si se aplica el design system (`sgtl-ui.js`) solo a lo nuevo.

---

## 4. Etapas (cada una se prueba en la VM antes de seguir)

| Etapa | Qué incluye | Cómo se prueba en la VM |
|---|---|---|
| **1. Base** | Script `01_proforma_rukas.sql` | Rocío lo corre. Verificar columnas y tablas; volver a correrlo y que no falle (idempotente). Facturación de proformas propias sigue igual. |
| **2. Importar y controlar (API + pantalla)** | `Importar`, `Control`, modal de importación, vista de control con resultados por línea y totales | Importar un **Excel de prueba** (ver §5) y ver cada caso: coincide, importe distinto, transporte no encontrado, viaje ya facturado, archivo inválido |
| **3. Resolver** | `Aceptar` (con y sin observación), `PedirCorreccion`, `Reimportar`, `Anular`, y los bloqueos en los endpoints de proforma propia | Aceptar una sin diferencias; aceptar con observación; pedir corrección → reimportar un Excel corregido → aceptar; anular y verificar que los viajes quedan libres |
| **4. Guía y avisos** | `ViajesSinProforma`: guía antes de generar en Rukas y aviso del caso 7 en la vista de control | Viajes de prueba sin proforma aparecen en la guía y en el aviso; los de otra proforma no |
| **5. Factura** | Emitir la factura desde una proforma Rukas con el flujo de Facu | Total = Rukas (+ IVA según 1-B); viajes pasan a `Facturado`; PDF de factura y de proforma se ven bien; NC cancelatoria libera los viajes |
| **6. N° fiscal y "Cargada en Rukas"** | **Al final, con Facu** (pregunta 9 del §11): N° fiscal en la factura, marca "Cargada en Rukas", listado de pendientes de cargar | Se define cuando se cierre con Facu |
| **7. Cierre** | Recorrida completa con la VM, reporte en `docs/pruebas/`, pendientes al día, merge a `rocionuvoli` → `main` | — |

Las etapas 2 y 3 son el núcleo; con eso ya se puede mostrar el flujo completo en una demo (la factura de la etapa 5 debería funcionar sin cambios).

---

## 5. Datos de prueba

- **No usar el Excel real** (es de un cliente) ni subirlo al repo.
- Armar un **Excel de prueba con el mismo formato** (§12 del documento de negocio) y datos inventados: N° de transporte que coincidan con viajes de prueba, uno con importe distinto, uno inexistente, uno repetido. Lo genero yo.
- En la VM, un cliente de prueba `Con_plataforma` con viajes de prueba que tengan esos N° de transporte.
- **A definir:** dónde se guarda el Excel de prueba en el repo. Ninguna carpeta actual encaja (`docs/README.md` dice que se pregunte antes de crear una nueva); una opción es `docs/pruebas/datos/`.

---

## 6. Riesgos y cómo se cubren

| Riesgo | Cobertura |
|---|---|
| Rukas cambia el formato del Excel | La API valida encabezados exactos y rechaza con un mensaje claro; no lee mal en silencio. |
| Conflictos con los cambios de Facu | Archivos nuevos para lo de Rukas; enganches mínimos; traer su commit antes de empezar (1-A). |
| No se puede compilar en la Mac | Cada etapa se revisa con cuidado y se dice qué probar en la VM; etapas chicas para que un error de compilación sea fácil de ubicar. |
| Las premisas de Claudia resultan distintas | Si Marfrig genera la proforma, cambia quién la exporta, no el resto del flujo. Si TS sí puede corregir en Rukas, "Pedir corrección a Marfrig" pasa a ser "Corregir en Rukas"; es un cambio de textos. |
| IVA mal interpretado (1-B) | Se confirma antes de la etapa 2; el `IvaPct` de los conceptos depende de eso. |
