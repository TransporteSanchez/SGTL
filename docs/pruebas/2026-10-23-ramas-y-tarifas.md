# Reporte de pruebas — Ramas al día y tarifas (§32) — 23/10/2026

## Entorno
- Rama / commit: rocionuvoli @ dfd6817 Pendientes: main al día con rocionuvoli, las cuatro ramas iguales (`git status` limpio)
- API: http://localhost:50222/api (OK: recompilada por Rocío; todas las llamadas de las pantallas probadas dieron 200, salvo los 400 esperados)
- Front: Live Server puerto 5500
- Alcance pedido: pruebas de la §32 de `docs/PENDIENTES-SISTEMA.md` (detalle en §29, §30 y §31), puntos 1 a 8 del pedido de Rocío. Sin guardar nada.

## Resumen
33 pruebas, todas OK. Los puntos 1 a 5 (los urgentes) pasaron sin fallas: tarifas fijas y por km, tarifa del viaje según la fecha
(con calendario y escrita a mano), presupuestos, Gestionar empresa y los tres PDF. En el camino aparecieron dos fallas que
no son de esta ronda: en los modales no se puede escribir la hora en el calendario (F1, hay alternativa) y un recibo
muestra el "Total aplicado" distinto en Ver, Editar y el PDF (F2, módulo de Facu). Consola sin errores nuevos.

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | API | Compila y responde | OK | Recompilada por Rocío; las pantallas cargan sin errores de la API |
| 2 | Gestionar tarifas → Registrar tarifa fija | Origen y Destino sin cliente | OK | Los dos deshabilitados con "Elegí el cliente" |
| 3 | Registrar tarifa fija | Elegir QUICKFOOD | OK | Orígenes: Sede Quilmes, QUICKFOOD Sede 1. Destinos: Sede Banfield, VAFOOD S.R.L. Comparado con `api/Origen` y `api/Destino`: son justo los de QUICKFOOD |
| 4 | Registrar tarifa fija | Valor de ruta 150000 y vuelta vacío 35000 | OK | Al salir quedan "150.000,00" y "35.000,00"; "Valor fijo neto: $ 185.000,00 · Ruta + vuelta vacío, sin IVA" |
| 5 | Registrar tarifa fija | Quilmes → Banfield del 15/10/2026 al 25/10/2026 → Guardar | OK | Dentro del modal: "Este cliente ya tiene la tarifa fija #4 para el mismo recorrido, del 20/10/2026 al 31/10/2026. Cambiá las fechas para que no se superpongan o editá esa tarifa." (`POST api/Tarifas/Fijas` → 400, esperado). Cancelar |
| 6 | Registrar tarifa por km | 01/01/2026 al 31/12/2026, 1500, de 50 a 200 km → Guardar | OK | "Ya está la tarifa por km #3, del 20/06/2024 al 31/12/2027, para más de 100 y hasta 500 km. Cambiá las fechas o los km para que no se superpongan o editá esa tarifa." (400, esperado). El valor quedó "1.500,00". Cancelar |
| 7 | Tarifas por km | Filtro "Km del viaje" = 100 (Enter) | OK | Queda solo la #4 (20,0 a 100,0, 2026); no aparece la #3 (100 a 500) |
| 8 | Gestionar viajes → Registrar viaje | QUICKFOOD, Sede Quilmes → Sede Banfield, Fija, sin inicio | OK | "Completá el inicio para buscar la tarifa fija." Ruta de Google: 17,4 km |
| 9 | Registrar viaje | Inicio 28/10/2026 elegido en el calendario | OK | "$ 200.000,00 · neto · tarifa fija de la ruta" (tarifa #4). La hora quedó 12:00: no se puede escribir en el campo de hora del calendario (F1) |
| 10 | Registrar viaje | Cambiar a 02/11/2026 con clic en el calendario | OK | "$ 185.000,00" (tarifa #5) |
| 11 | Registrar viaje | Escribir a mano "28/10/2026 08:00" y clic en el título | OK | Pasa a "$ 200.000,00" (tarifa #4) |
| 12 | Registrar viaje | Escribir a mano "02/11/2026 08:00" y clic en el título | OK | Pasa a "$ 185.000,00" (tarifa #5). Sin chofer; salí con Cancelar |
| 13 | Gestionar presupuestos → Registrar presupuesto | QUICKFOOD, Quilmes → Banfield, Tarifa fija, sin fecha | OK | "Completá la fecha de inicio para buscar la tarifa fija." |
| 14 | Registrar presupuesto | Inicio 28/10/2026 08:00 | OK | "Tarifa fija #4, vigente el 28/10/2026." e importe "$ 200.000,00". Cancelar |
| 15 | Configuración → Gestionar empresa | Abrir | OK | Sin aviso amarillo; razón social, nombre comercial, CUIT, Responsable inscripto, Córdoba / Las Varillas, calle, altura y CP cargados (teléfono y e-mail vacíos); "Última modificación: RNUVOLI · 23/10/2026 13:15". No guardé |
| 16 | Gestionar proformas → Ver PDF de PF-00000006 (Aceptada) | Encabezado | OK | Logo y, a su derecha, "Transporte Sánchez" en grande con la razón social debajo; abajo "CUIT … · Responsable inscripto" y el domicilio. Pie: Cerrar · Imprimir · Descargar PDF (la proforma por e-mail no existe todavía, ya anotado) |
| 17 | Cuenta corriente → Ver PDF de FAC-00000008 | Condición fiscal, recuadro y pie | OK | "Condición fiscal: Responsable inscripto"; recuadro de la letra: "I", "INTERNO", "SIN VALIDEZ", "FISCAL" (renglones separados); pie "Generado: 23/10/2026 16:15 - Usuario: RNUVOLI" (24 h) |
| 18 | Cuenta corriente → Ver PDF de REC-00000013 | Ídem | OK | Mismo armado; "Condición fiscal: Monotributista" (ese cliente es monotributista; el formato es el pedido); pie "Generado: 23/10/2026 16:17 - Usuario: RNUVOLI" |
| 19 | Ver PDF de factura y recibo | Pie de la vista previa | OK | Cerrar · Enviar por e-mail · Imprimir · Descargar PDF. No envié nada |
| 20 | Gestionar clientes → Registrar cliente | Orden de provincias | OK | Alfabético: … Chaco, Chubut, **Ciudad Autónoma de Buenos Aires**, Córdoba, Corrientes … (igual en Gestionar empresa) |
| 21 | Registrar cliente | Elegir CABA | OK | 49 localidades: la Ciudad y 48 barrios (Agronomía … Palermo … Recoleta … Villa Urquiza). Cancelar |
| 22 | Grupos y permisos → Permisos por grupo | Administradores | OK | General: Dashboard · Auditoría; Choferes: Listar · Gestionar; Camiones: Listar · Gestionar; Viajes: Listar viajes · Gestionar viajes · Gestionar orígenes y destinos · Gestionar tarifas · Gestionar presupuestos; Clientes; Facturación: Listar proformas · Gestionar proformas · Gestionar cuenta corriente · Gestionar tipos de comprobante; Configuración: Gestionar e-mail · Gestionar integración de WhatsApp · Gestionar empresa · Gestionar contenido; Usuarios: Listar usuarios · Gestionar usuarios · Gestionar grupos y permisos. Igual que el menú y en su orden |
| 23 | Permisos por grupo | Listados y Administrativos | OK | Listados: tildados justo los seis "Listar …" (las secciones en parcial), coincide con `api/Grupos/5/Menus`. Administrativos: nada tildado, y la API devuelve 0 asignados. No guardé |
| 24 | Listar usuarios → Ver detalle de nviola | Grupos y pantallas que ve | OK | "Listados: Listar choferes · Listar camiones · Listar viajes · Listar clientes · Listar proformas · Listar usuarios" y "Proveedores: Listar viajes". Textos del menú, en su orden. Pie: Cerrar |
| 25 | Cuenta corriente → Ver recibo REC-00000013 | Pie | OK | Solo "Cerrar". Título "Ver recibo REC-00000013" |
| 26 | Cuenta corriente → Editar recibo REC-00000013 (emitido) | Título y pie | OK | "Editar recibo REC-00000013" sin " · "; pie Cancelar · Guardar; `data-bs-backdrop="static"`. Salí con Cancelar |
| 27 | Consola (F12) | Todas las pantallas probadas | OK | Sin errores nuevos. Solo los 400 esperados de los dos Guardar de tarifas y el 404 conocido de `api/DashboardLayout` en el Dashboard (F16). Warnings de Google Maps (ver mejoras) |
| 28 | Gestionar tarifas | Abrir, pestañas, tabla | OK | Tarifas fijas: 4 filas; por km: 5 bandas |
| 29 | Gestionar viajes | Abrir y Registrar viaje | OK | Cliente con buscador predictivo; ruta y km de Google OK |
| 30 | Gestionar presupuestos | Abrir y Registrar presupuesto | OK | Ruta de Google: 17,4 km |
| 31 | Gestionar proformas | Abrir y listar | OK | 14 proformas |
| 32 | Gestionar cuenta corriente | Abrir, desplegar FAC-00000013 | OK | Los recibos están en filas plegadas dentro de cada factura |
| 33 | Listar usuarios | Abrir y listar | OK | 13 usuarios |

## Fallas (una sección por falla, la más grave primero)

### F1 — En los modales no se puede escribir la hora en el calendario
- Gravedad: Media (molesta, hay alternativa: las flechas del calendario o escribir fecha y hora en el campo, que funciona bien)
- Dónde: Gestionar viajes → Registrar viaje → Inicio (y seguramente Fin y los de Registrar presupuesto, que usan el mismo selector; esos no los probé)
- Pasos para reproducir: 1. Registrar viaje. 2. Clic en Inicio y elegir un día. 3. Clic en el campo de la hora ("12") del calendario e intentar escribir.
- Esperado: el cursor queda en la hora y se puede escribir "08".
- Obtenido: el foco salta enseguida a la cruz del modal; no se puede escribir la hora. El calendario sigue abierto.
- Consola / red: sin errores. Registrando los eventos de foco: `focusin` en `.flatpickr-hour` e inmediatamente `focusin` en `.btn-close`.
- Causa probable: el calendario de flatpickr se agrega al `body`, fuera del `.modal`, y el bloqueo de foco de Bootstrap 5 devuelve el foco al modal cada vez que algo de afuera lo recibe. Se arreglaría en `SGTL.selectorFecha` (`assets/static/js/sgtl-ui.js`) haciendo que, dentro de un modal, el calendario se agregue al modal (`appendTo`) o sea `static`. Sin corregir.
- No es de esta ronda ni la vi anotada en `docs/`.

### F2 — Recibo REC-00000013: "Total aplicado" y "Diferencia" distintos en Ver, Editar y el PDF
- Gravedad: Media (dato confuso en pantalla y en el documento; no se pierde nada). Módulo de Facu: avisar antes de cambiar.
- Dónde: Gestionar cuenta corriente → recibo REC-00000013 (Servicios Ambientales S.A., $ 900.000,00, imputado $ 871.200,00 a FAC-00000013, observación "Diferencia de 28800.00 a imputar").
- Pasos para reproducir: 1. Desplegar FAC-00000013. 2. Ver detalle del recibo. 3. Editar recibo. 4. Ver PDF.
- Esperado: en los tres, aplicado $ 871.200,00 y diferencia (o saldo a imputar) $ 28.800,00.
- Obtenido:
  - Ver recibo: "Total recibo: $ 900.000,00 · Total aplicado: $ 871.200,00 · Diferencia: $ 0,00".
  - Editar recibo: "Total recibo: $ 900.000,00 · Total aplicado: $ 900.000,00 · Diferencia: $ 0,00".
  - PDF: "Aplicado: $ 0,00 · Saldo pendiente: $ 0,00".
- Consola / red: sin errores. `api/recibos/31` trae la aplicación de 871200; `api/comprobantes/31` trae `ImporteAplicado: 0` y `SaldoPendiente: 0`.
- Causa probable: `assets/static/js/cuenta-corriente-clientes.js:782-783` (Ver: suma las aplicaciones y deja la diferencia fija en 0) y `:866-867` (Editar: usa el total del recibo como aplicado y la diferencia fija en 0); el PDF usa `ImporteAplicado` y `SaldoPendiente` de la API, que para el recibo vienen en 0. Sin corregir.

## Mejoras sugeridas
- **Aviso de error del modal fuera de la vista:** en Registrar tarifa fija y por km, el error de superposición aparece arriba del modal; si
  el modal tiene scroll (ventana chica) y se toca Guardar desde abajo, no se ve nada hasta subir. `SGTL.avisoFormulario` podría llevar
  el aviso a la vista.
- **Superposición por km:** con 50 a 200 km nombra solo la #3 (100 a 500); también se superpone con la #4 (20 a 100). Está bien que
  nombre una; si se quiere, podría decir "y otra".
- **Registrar presupuesto:** Origen y Destino deshabilitados dicen "Seleccioná un origen/destino"; en tarifas y viajes dicen "Elegí el
  cliente". Y el importe calculado es un campo de solo lectura con "$ 200.000,00"; por la regla 7 lo que no se edita va como texto
  (`.sgtl-dato-fijo`).
- **Ver recibo / Editar recibo (Facu):** el cliente y los datos que no se editan se ven como campos deshabilitados (regla 7 y §6.2).
- **PDF de la factura (Facu):** "Sin Proformas asociadas." con "Proformas" en mayúscula (§9). En la proforma, el renglón dice
  "Viaje Sede Quilmes -> Sede Banfield" (con "->"; en cuenta corriente se usa "→") y "Datos del servicio" sale todo con "—".
- **Ver detalle del usuario:** "Rol: user", en inglés (§9).
- **CABA:** la localidad "Ciudad Autónoma de Buenos Aires" queda en el medio de los barrios (entre Chacarita y Coghlan); quizá conviene
  ponerla primera.
- **Consola:** Google Maps avisa que `DirectionsService` y `DirectionsRenderer` están deprecados desde el 25/02/2026 (siguen funcionando,
  con 12 meses de aviso antes de darlos de baja). Además hay muchos `console.log` de colores y contenido (`gestionContenido.js`) en
  todas las pantallas.
- **Datos de prueba a la vista (para la presentación):** grupo "PRUEBA-CLAUDE 20/10" en Grupos y permisos; choferes "Prueba, Fede" y
  "CLAUDE, PRUEBACLAUDE" en el selector de chofer de Registrar presupuesto; usuario "usuarioprueba"; comprobantes con conceptos
  "asd asd → asd", "pruebaaa", "preubaaaa888", "Factura de prueba Test", "NC prueba", "Pruebaa", "dfgdgh". Varios ya están anotados
  para limpiar antes de la tesis.

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre que se le puso | Qué se hizo |
|---|---|---|---|---|
| — | — | — | — | Ninguno. Los dos Guardar de tarifas terminaron en el error esperado (400) y todo lo demás se cerró con Cancelar o Cerrar. No se envió ningún e-mail ni WhatsApp |

## SQL de limpieza propuesto (NO ejecutado)
No hace falta: no se creó ni se modificó nada.
