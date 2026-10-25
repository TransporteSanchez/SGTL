# Reporte de pruebas — Tabla de tarifas, partes A y B (tanda 1 de la §39) — 25/10/2026

> Reporte de la sesión de la VM. Al copiarlo al repo se quitó un domicilio que puede ser el real de la empresa (§7 de
> `docs/README.md`). Seguimiento en la §39 de `docs/PENDIENTES-SISTEMA.md`.

## Entorno
- Rama / commit: rocionuvoli @ 19804b4 Tarifas: el 04 pasa a tarifa fija por banda los viajes que no vienen de un presupuesto (`git status` limpio)
- API: http://localhost:50222/api OK (la DLL se compiló a las 16:14, después del último commit con C#: 12077c7, 15:14)
- Front: servidor en el puerto **5500** (es Five Server, no el Live Server del 5502). Pantalla emulada a 1366 × 768
- Usuario: RNUVOLI (administrador). La sesión venció dos veces (dura alrededor de una hora) y Rocío volvió a iniciarla
- Alcance pedido: partes A y B de `docs/equipo/INSTRUCTIVO-PRUEBAS-TARIFAS.md`, los pasos 2 a 10 de "Probar en la VM" de la §34 y la mirada de usabilidad de la sección 1. La parte C no se empezó
- Permisos que dio Rocío en el chat: usar cualquier chofer (el WhatsApp de la VM no envía: la API responde "HTTP 401 Authentication Error"), eliminar la tabla "Próxima" de prueba, enviar el presupuesto a una dirección @example.com, aceptar un presupuesto y generar su viaje, pasar viajes de prueba a En viaje y pasar los viajes #43 y #44 a Entregado con una evidencia generada

## Resumen
La tabla de resultados tiene 43 filas: 32 OK, 6 OK con observaciones (F2, F4, F5 o una duda), 2 FALLA (B4 y B6, las dos por F1) y 3 NO PROBADO (el envío por e-mail, por la configuración de la VM; el caso 1 de Rukas, porque falta regenerar los Excel; y la parte C). Los importes cuadran en todos los casos: los ocho viajes, los dos presupuestos y el borrador dan lo mismo que la cuenta a mano, y se recalculan y vuelven bien en B2, B6 y B7. **Lo más grave (F1):** si se cambian los clientes o la fecha de una tabla y los importes no cambian, se guarda sin confirmación. Los viajes pasan de una tabla a otra sin aviso y sin quedar en la auditoría, también los facturados. Cuando la confirmación sí aparece, lista solo los viajes cuyo importe cambia. Al probar B4 así quedaron asignados por unos minutos a la tabla de prueba tres viajes reales de Servicios Ambientales S.A., uno de ellos facturado. **Ya lo deshice:** volvieron a "Tarifas a agosto 2026" con el mismo importe, el mismo detalle y la misma última modificación (ver "Datos de prueba"). Además: "Registrar tabla de tarifas" copia los valores de una tabla propia cuando es la más nueva (F2), y en el puerto 5500 la pantalla de viajes se recarga sola al guardar y se pierden los avisos (F3).

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | A1 · Gestionar tarifas | Texto, botón, columnas | OK | Columnas Nombre · Clientes · Vigencia · Estado · Viajes · Acciones. Mejoras de diseño en M14 y M27 |
| 2 | A1 | Clientes: "Todos los clientes", un cliente, "N clientes" con ⓘ | OK | Probé "2 clientes" sumando un 2º cliente de prueba sin viajes: el globito lista las dos razones sociales. Después lo saqué |
| 3 | A1 | Vigencia y estado | OK | "Desde el 01/08/2026" · "Del 01/01/2026 al 31/07/2026" · Vigente (verde), Anterior y Próxima (gris) |
| 4 | A1 / A8 | Eliminar deshabilitado con el motivo | OK | "No se puede eliminar la tabla de tarifas: la usan 23 viajes" (agosto), "… 6 viajes" (enero), "… 8 viajes" (la de prueba) |
| 5 | A2 · Editar agosto | Grilla como el PDF, valores, "Vigente hasta", "Modelos", aviso de arriba | OK | Valores del PDF (Balancín 2019: 581.492 / 407.089 / 631.568 / 663.370 / 2.594). A 1366 px no se corta ningún importe ni hay barra hacia el costado. Arriba: "La usan 23 viajes. Antes de guardar vas a ver qué importes cambian. Si es un aumento, registrá una tabla nueva." |
| 6 | A3 · Registrar | Viene con los valores de la más nueva, nombre y fecha vacíos, "Todos los clientes" | OK con F2 | Mientras la más nueva fue agosto, vino con agosto. Cuando la primera de la lista fue la tabla propia de prueba, copió los valores de esa tabla (F2) |
| 7 | A3 | Guardar vacío | OK | "Revisá los campos marcados.", "Completá el nombre.", "Completá desde cuándo vale.", el foco va al nombre. El aviso de arriba queda aunque ya se corrigió todo (M10) |
| 8 | A3 | 01/08/2026 con "Todos los clientes" | OK | "Ya hay una tabla para todos los clientes vigente desde el 01/08/2026 ("Tarifas a agosto 2026"). Elegí otra fecha o editá esa tabla." (M9) |
| 9 | A3 | "Solo algunos clientes" sin tildar ninguno | OK | "Elegí al menos un cliente.", pero también "Todavía no elegiste ningún cliente." (M11) |
| 10 | A3 | Bandas | OK | "Tiene que ser mayor que 130 km." y "Tiene que ser mayor que 190 km."; al cambiar una banda, la siguiente se revisa enseguida |
| 11 | A3 | Falso flete 0 y 150, horas 0, montos con letras | OK con F5 | "Tiene que ser más de 0 y hasta 100.", "Tiene que ser mayor que cero.". Con letras, la máscara borra todo lo escrito y dice "Completá el valor." (F5) |
| 12 | A3 / A8 | Valores fuera de orden: aviso amarillo que no impide guardar | OK | "Revisá estos valores" con el tipo y el modelo, arriba de las grillas. La tabla de diciembre se guardó con un valor fuera de orden ("Tabla de tarifas registrada.") (M17) |
| 13 | A4 · Gestionar clientes | Cliente de prueba | OK | "Logística Pampeana S.R.L." ya existe (ID 6, de la ronda del 23/10): usé "Alimentos La Serena S.A." (ID 7) |
| 14 | A4 | Tabla propia desde el 01/10/2026 con Balancín 2019, hasta 130 km 1ª vuelta en $ 600.000 | OK | Guardó directo ("Tabla de tarifas guardada."); en la lista figura con el nombre del cliente y agosto sigue en "Todos los clientes" |
| 15 | A5 · Gestionar viajes | Hasta 130 km 1ª vuelta y 2ª vuelta del mismo camión | OK | #43: 41,4 km → $ 600.000,00. #44: propone la 2ª ("El camión ya tiene el viaje #43 antes, ese mismo día.") → $ 407.089,00 |
| 16 | A5 | Hasta 190, hasta 250 y más de 250 km | OK | #45: 150,8 km → $ 631.568. #46: 231,6 km → $ 663.370. #47: 405,5 km → $ 663.370 + 155,5 × $ 2.594 = $ 1.066.737 (la cuenta a mano coincide) |
| 17 | A5 | Por km | OK | #48: 150,8 × $ 2.594 = $ 391.175,20 |
| 18 | A5 | Modelo 2018 o anterior y 2019 en adelante | OK | #49 Chasis 2017 → $ 476.273 (fila 2018 o anterior); los Balancín 2020 usan la fila 2019 en adelante |
| 19 | A5 | Falso flete y estadía | OK, con duda D1 | #50 Furgón 2022: $ 645.535 × 60 % = $ 387.321 + 1 módulo $ 96.577 = $ 483.898. El falso flete reemplaza la tarifa por el 60 %, no "se suma" como dice el instructivo |
| 20 | A5 | Cliente de prueba en septiembre y otro cliente en octubre | OK | En el formulario, sin guardar: los dos con "Tarifas a agosto 2026" ($ 581.492,00) |
| 21 | A5 / §34 paso 5 | Guardar y volver a abrir; detalle con "km" en minúscula | OK | Los 8 guardaron lo mismo que mostraba el formulario. Al reabrirlos, mismo importe. Ver detalle nombra la tabla ("41,4 km") |
| 22 | A6 · Presupuestos | Presupuesto con los datos de un viaje; Ver PDF | OK | #10 = $ 600.000,00, igual que el #43. Ver PDF: pie Cerrar · Enviar por e-mail · Imprimir · Descargar PDF, y el PDF con $ 600.000,00 (M21) |
| 23 | A7 · Proformas | Borrador con dos viajes; "Traer viajes" trae el importe guardado | OK, con duda D2 | Borrador #55 con V43 $ 600.000 y V44 $ 407.089, total $ 1.218.577,69. Para que "Traer viajes" los traiga tuve que pasarlos a Entregado con evidencia (con permiso de Rocío): el instructivo no lo dice |
| 24 | A8 | Próxima desde el 01/12/2026, agosto hasta el 30/11 y eliminarla | OK | "Próxima" en gris; agosto "Del 01/08/2026 al 30/11/2026". Confirmación: "No se puede deshacer. "Tarifas a agosto 2026" queda como la tabla vigente hasta que se cargue la próxima." → "Tabla de tarifas eliminada." y agosto vuelve a "Desde el 01/08/2026" |
| 25 | §34 paso 3 | Eliminar una tabla propia | OK | Con una propia de prueba sin viajes: "No se puede deshacer. Sus clientes vuelven a la tabla para todos los clientes." (M13) |
| 26 | B1 | Solo el nombre: guarda directo | OK | Sin confirmación; "Guardando…" con Cancelar y la cruz deshabilitados. Tardó entre 16 y 20 s (F8) |
| 27 | B2 | Confirmación, motivo obligatorio, aviso | OK | "¿Guardar los cambios de "Tarifas Alimentos La Serena"?", "Se recalculan · 2", #43 con "También en el borrador #55.", presupuesto #10 con "Reenviáselo si ya se lo mandaste.". Sin motivo: "Completá el motivo.". Con motivo: "Tabla de tarifas guardada. Se recalcularon 1 viaje y 1 presupuesto. Queda 1 para revisar." (M2) |
| 28 | B2 | Después: viaje, borrador y Auditoría | OK | #43 a $ 620.000 con su detalle; borrador V43 $ 620.000, total $ 1.242.777,69. Auditoría: TARIFARIOS con el motivo, y un registro por el viaje 43 y por el presupuesto 10 ("Importe recalculado por la corrección de la tabla …: $ 600.000,00 → $ 620.000,00") (M7) |
| 29 | B3 | Ícono rojo y aviso del presupuesto | OK | En la fila: "Cambió la tarifa: revisalo en Ver PDF.". En Ver PDF y Editar: "Cambió la tarifa: $ 600.000,00 → $ 620.000,00 · Reenviáselo al cliente con "Enviar por e-mail"." (M6) |
| 30 | B3 | Tarjeta fija en el Dashboard y en Tableros → Facturación | OK | Arriba de todo, sin estrella y sin controles en Personalizar; "Ver PDF para reenviarlo" abre su Ver PDF. En Tableros es la primera, arriba de "Costo por viaje"; la pestaña dice "Facturación · 6"; estrella llena y deshabilitada con "No se puede quitar del dashboard: está fijo para quien resuelve cambios de tarifa" (M5) |
| 31 | B3 | Enviar por e-mail y que salga de la tarjeta | NO PROBADO | El envío falla por la configuración de la VM: "No se pudo leer la contraseña del perfil SMTP. Volvé a guardarla en Configuración > Gestionar e-mail.". Lo que sí vi: con B7 (volver al importe) se resolvió solo y la tarjeta dice "No hay nada para revisar por cambios de tarifa." |
| 32 | B4 (1) | Sumar un cliente real a la tabla de prueba → confirmación con 'Pasa a "…"' | FALLA (F1) | Con Servicios Ambientales S.A. **guardó sin confirmación**: sus viajes 38 (facturado), 39 y 40 pasaron a la tabla de prueba. Lo deshice al momento. Repetido sin guardar, cambiando además un valor: la confirmación muestra 'Pasa a "Tarifas Alimentos La Serena".' solo en el #39 y no lista el 38 ni el 40 |
| 33 | B4 (2) | Agosto "Solo algunos clientes" → ayuda y confirmación (sin guardar) | OK, con F4 | Ayuda: 'Los demás clientes vuelven a "Tarifas a enero 2026".'. Confirmación: "Se recalculan · 10" con 'Pasa a "Tarifas a enero 2026".' e importe de enero, "No cambian: quedan para revisar · 10" ("Anulá PF-00000006 y generala de nuevo.", "Nota de crédito sobre FAC-…") y "No cambian · 5" (presupuestos aceptados). Cancelé. Los viajes 25 y 26 salen con FAC-00000010, que ya tiene su nota de crédito (F4) |
| 34 | B5 | Enero desde el 31/07/2026 | OK | Sin confirmación: "No se puede guardar la tabla de tarifas: 6 viajes quedarían sin tabla." · "QUICKFOOD S.A.: 5 viajes, del 21/07/2026 al 27/07/2026" · "distribuidora-powerful S.A.: 1 viaje, el 21/07/2026". Cerré sin guardar (M8) |
| 35 | B6 | Tabla de prueba desde el 15/10 → los del 1 al 14/10 'Pasa a "Tarifas a agosto 2026"' | FALLA (F1) | La confirmación lista solo el #43 ('Pasa a "Tarifas a agosto 2026". También en el borrador #55.'). Los #44, #45, #46 y #49 también pasaron a agosto, pero no aparecen. Guardado con motivo: "Se recalculó 1 viaje."; #43 a $ 581.492 y el borrador se actualizó. Al volver al 01/10, los cinco volvieron |
| 36 | B7 | Volver al valor de A4 | OK | "Se recalcularon 1 viaje y 1 presupuesto."; los 8 viajes, el borrador ($ 1.218.577,69) y el presupuesto ($ 600.000, sin ícono) quedaron como al principio y la tarjeta, vacía |
| 37 | §34 paso 2 | Enero "31/07/2026 · Después: Tarifas a agosto 2026"; agosto "Sin fecha de fin"; se actualiza al elegir la fecha | OK | |
| 38 | §34 paso 6 | Viaje de marzo con "Tarifas a enero 2026" | OK, con duda D3 | No hay viajes de marzo: los 6 de enero son del 21 al 27/07. El #7 dice "Tarifas a enero 2026" ($ 494.268 = agosto −15 %) y no nombra tarifas de antes. "Guardar sin cambios" lo hice en el #47 (uno mío): el importe no cambia |
| 39 | §34 paso 7 | Presupuestos de antes y uno nuevo por km aceptado → viaje | OK | Los aceptados tienen el mismo importe que su viaje (#1→28, #3→33, #4→29, #5→31, #9→42). #11 por km = $ 391.175,20 (igual que el #48); aceptado → "Generar viaje" → viaje #51 con $ 391.175,20 ("Presupuesto #11") |
| 40 | §34 paso 8 | Rukas caso 1 "Coincide" | NO PROBADO | Los Excel de `docs/pruebas/datos/` todavía no se regeneraron (§38 paso 8). "Traer viajes" sí trae el importe guardado (A7) |
| 41 | §34 paso 9 | "Costo por viaje" suma los importes guardados | OK | Trimestre: total $ 13.158.215 = suma de los 24 viajes del 01/08 al 25/10. Incluye mis 8 viajes ($ 4.720.110,20) |
| 42 | §34 paso 10 | Viaje en viaje + 1 módulo de estadía | OK | #46: $ 663.370 + $ 96.577 = $ 759.947; la tarifa queda fija (M16) |
| 43 | Parte C | — | NO PROBADO | No se empezó, como pidió Rocío |

## Fallas (la más grave primero)

### F1 — Cambiar los clientes o la fecha de una tabla mueve viajes de tabla sin confirmar ni listarlos
- Gravedad: **Alta**: cambia lo que ya vio el cliente (el detalle de un viaje facturado) sin avisar ni dejarlo en la auditoría
- Dónde: Gestionar tarifas → Editar → Clientes o "Vigente desde" → Guardar (`POST api/Tarifario/Impacto`, `PUT api/Tarifario/{id}`)
- Pasos para reproducir: 1. Editar una tabla con los mismos valores que la general (la de prueba es una copia de agosto salvo un valor). 2. Tildar un cliente que tiene viajes que usan otros valores de la tabla (Servicios Ambientales S.A.). 3. Guardar
- Esperado (instructivo B4 y B6): la confirmación con cada viaje y 'Pasa a "…"', y Cancelar sin cambios
- Obtenido: "Tabla de tarifas guardada." sin confirmación. Los viajes 38 (Facturado, en PF-00000012), 39 y 40 quedaron con `TarifarioID = 3` y el detalle "Tarifas Alimentos La Serena · …". El importe no cambió. No hay un registro de Auditoría por viaje (solo el de TARIFARIOS) ni una fila en TARIFARIO_CAMBIOS. Cuando sí cambia algún importe (B6 y el B4 repetido), la confirmación lista solo esos viajes: en B6 faltaron 4 de 5 y en B4 faltaron el 38 y el 40
- Consola / red: sin errores; `Impacto` devuelve `HayCambios = false`
- Causa probable: `WebApi_TransporteSanchez/Tarifas/TarifarioImpacto.cs:69-72`. `HayCambios` mira solo "Se recalculan" o "para revisar". Lo que "pasa a otra tabla … sin cambiar el importe" va a `SoloDetalle` y "se actualiza sin preguntar". `gestion-tarifas.html:757` guarda directo si `!impacto.HayCambios`, y `TarifarioImpacto.cs:590` no registra el cambio. Esa regla, pensada para "solo el nombre", también se aplica a los cambios de clientes y de fecha
- Ya deshecho: saqué a Servicios Ambientales de la tabla de prueba. Los viajes 38, 39 y 40 volvieron a `TarifarioID = 2`, con el mismo detalle y la misma última modificación (FGODOY 23/10 21:30, FMONTENEGRO 21/10 22:01, RNUVOLI 25/10 16:16)

### F2 — "Registrar tabla de tarifas" copia los valores de una tabla propia
- Gravedad: Media. Una tabla para todos puede salir con los valores de un cliente, y el único aviso es el nombre en el texto de arriba
- Dónde: Gestionar tarifas → Registrar tabla de tarifas
- Pasos: 1. Que la tabla más nueva de la lista sea una propia ("Tarifas Alimentos La Serena", desde el 01/10). 2. Registrar tabla de tarifas
- Esperado: los valores de la última tabla para todos (agosto), o a confirmar con Rocío
- Obtenido: "Viene con los valores de "Tarifas Alimentos La Serena": cambiá los que se actualizaron y elegí para qué clientes es." con "Todos los clientes" elegido y Balancín 2019 hasta 130 km 1ª vuelta en $ 600.000/620.000 (el valor del cliente)
- Causa probable: `gestion-tarifas.html:682`: `const base = id || (tarifarios[0] && tarifarios[0].Tarifario_ID);` toma la primera fila de la lista, sin mirar si es para todos

### F3 — En el puerto 5500 la pantalla de viajes se recarga sola al guardar y se pierden los avisos
- Gravedad: Media en la VM (entorno). Después de "Viaje registrado." el error "No se pudo enviar el WhatsApp al chofer. Avisale por otro medio." se ve 1 a 3 segundos y la página se recarga
- Dónde: Gestionar viajes → Registrar viaje → Guardar (también Editar si cambia el chofer, el recorrido o el inicio)
- Causa probable: la API escribe `WebApi_TransporteSanchez/App_Data/whatsapp.log` dentro de la carpeta que sirve el front. En el 5500 corre Five Server (`fiveserver.js`), que no lee `liveServer.settings.ignoreFiles` de `.vscode/settings.json` (ahí sí está `**/App_Data/**`) y recarga con cada cambio. En el 5502, con Live Server, no debería pasar

### F4 — Viajes cuyo comprobante ya tiene nota de crédito se tratan como facturados
- Gravedad: Media (hoy son datos de prueba de la §38, pero el criterio sirve igual para datos reales)
- Dónde: confirmación de B4 (agosto → "Solo algunos clientes")
- Obtenido: los viajes 25 y 26 (Listo para facturar, sin proforma vigente) en "No cambian: quedan para revisar" con "Nota de crédito sobre FAC-00000010.". Según la §38, FAC-00000010 es de la demo de Rukas y ya tiene su NC-00000003
- Causa probable: `TarifarioImpacto.cs:166-167`: busca el comprobante por `COMPROBANTES_DETALLE.Codigo = 'V' + Viaje_ID` sin descartar los que se compensaron con una nota de crédito

### F5 — Un monto con una letra se borra entero y dice "Completá el valor."
- Gravedad: Baja. Pasa en toda la tabla de tarifas y en todos los montos del sistema
- Pasos: en cualquier valor de la grilla o en "Módulo de estadía" escribir "12x" y salir del campo
- Obtenido: el campo queda vacío y aparece "Completá el valor." / "Completá el valor del módulo."
- Causa probable: `assets/static/js/sgtl-ui.js:652-655` (`enlazarMascaraMonto`): si `montoCentavos` no puede leerlo, pone `''`

### F6 — Un error pasajero de la base deja Gestionar clientes trabada
- Gravedad: Baja (fue una sola vez)
- Obtenido: "No se pudo cargar la pantalla. Revisá la conexión y probá de nuevo." aunque la lista de clientes ya había cargado. `GET api/GestionContenido/1` → 500 ("Tiempo de espera de la operación de espera agotado", SSL con Azure SQL); el reintento siguiente dio 200
- Causa probable: `gestion-clientes.html:171-190`: si falla la apariencia (logo y colores), se esconde toda la pantalla. Además, la respuesta 500 trae la excepción completa (se ve en la red)

### F7 — La sesión vencida lleva al login sin el aviso
- Gravedad: Baja. Pasó dos veces (alrededor de una hora después de entrar), al abrir una pantalla
- Esperado (§9 del design system): "Tu sesión venció. Volvé a iniciar sesión."
- Obtenido: el login vacío (`Login.html?volver=gestion-viajes.html`), sin mensaje

### F8 — Guardar una tabla tarda mucho
- Gravedad: Baja. Solo cambiar el nombre tardó 16 a 20 s (`POST Impacto` 5,5 s + `PUT` 11,5 s); registrar, 8 a 10 s (`POST api/Tarifario` 9,9 s). Hay "Guardando…" y no se puede hacer doble clic, pero parece colgado

### F9 — La API contesta datos sin iniciar sesión (fuera del alcance de tarifas)
- Gravedad: Media (seguridad)
- Obtenido: sin token, `GET api/Tarifario`, `api/Tarifario/3`, `api/Tarifario/Vigente`, `api/Viajes`, `api/Clientes` (con CUIT, teléfono y e-mail) y `api/Camiones` responden 200. `api/Tarifario/Revisar` sí responde 401

### F10 — Auditoría: en el filtro de entidades hay un nombre técnico
- Gravedad: Baja. En el desplegable "Entidad" aparecen "TARIFAS_KM_5551555D3C58DB88909880004487E060A6A5D4BBEEEFF74D6E6B8F1822700ACA" y "EmailServidor" (§1.2 de PENDIENTES ya había sacado los sufijos)

## Dudas y diferencias con el instructivo
- **D1 (A5):** "Falso flete y estadía (módulos): se suman al importe." El falso flete no se suma: reemplaza la tarifa por el 60 % ($ 645.535 → $ 387.321), como dice la §34. La estadía sí se suma.
- **D2 (A7):** para que "Traer viajes" traiga viajes de un cliente directo tienen que estar en **Entregado**, con evidencia obligatoria. El instructivo no lo dice y no lo pide en A5.
- **D3 (§34 paso 6):** "Abrir un viaje de marzo": no hay viajes de marzo. Los 6 de "Tarifas a enero 2026" son del 21 al 27/07.
- **D4 (§33, paso 2.1 de "Probar en la VM"):** dice que el aviso del presupuesto trae "la tabla, la fecha y el motivo". El aviso es el corto (antes → ahora y qué hacer), como en la decisión del 25/10. La tabla, la fecha y el motivo están en la tarjeta y en Auditoría. Conviene corregir el texto de la §33.
- **D5 (B3):** con el e-mail de la VM sin contraseña no se puede ver que enviar el presupuesto lo resuelva. Hace falta en otra máquina o arreglando Gestionar e-mail.
- **D6:** generar el viaje desde un presupuesto (#51) no le manda la hoja de ruta al chofer (no hay intento en `whatsapp.log`) y la ventana "Generar viaje" no avisa nada. Registrar un viaje directo sí la manda. ¿Es a propósito?
- **D7:** en el aviso de un viaje "En viaje" dice "Ya salió: solo se completa el número de remito.", pero también se cargan el falso flete y la estadía (§34). ¿Se cambia el texto?

## Mejoras sugeridas (de la que más molesta a la que menos)
En la tabla de resultados, "M3" es la mejora 3 de esta lista. Entre paréntesis, el punto de la sección 1 del instructivo: (1) se entiende, (2) largo, (3) confuso, (4) falta algo, (5) design system.

1. **Confirmación al cambiar clientes o fechas** (Gestionar tarifas → Editar → Guardar; B4 y B6). Texto actual: la lista muestra solo los viajes cuyo importe cambia ("Se recalculan · 1"). Problema: falta (4) y confunde (3), porque no se ve todo lo que pasa de tabla. Propuesta: pedir siempre confirmación cuando cambian los clientes o la fecha, y sumar un grupo gris "Cambian de tabla, mismo importe · N" con 'Pasa a "…"' en cada fila (ver F1).
2. **Aviso después de guardar** (B2). Texto actual: "Tabla de tarifas guardada. Se recalcularon 1 viaje y 1 presupuesto. Queda 1 para revisar." Problema: concordancia (5). Además "Queda 1 para revisar" no dice qué es y contradice la confirmación, donde el presupuesto estaba en "Se recalculan" (3). Propuesta: "Tabla de tarifas guardada. Se recalculó 1 viaje y 1 presupuesto; el presupuesto #10 queda para reenviar."
3. **"Qué hacer" del presupuesto en la confirmación** (B2 y B7). Texto actual: "Reenviáselo si ya se lo mandaste.", también cuando vuelve al importe que tenía (B7, y después se resuelve solo). Problema: ambiguo (3); el sistema sabe si se envió. Propuesta: "Mandáselo de nuevo: se lo enviaste el DD/MM." o "—" si nunca se envió; al volver al importe original, "Vuelve al importe que tenía.".
4. **Registrar tabla de tarifas** (A3, ver F2). Texto actual: "Viene con los valores de "Tarifas Alimentos La Serena": cambiá los que se actualizaron y elegí para qué clientes es." Problema: confuso (3) con "Todos los clientes" elegido. Propuesta: copiar de la última tabla para todos: "Viene con los valores de "Tarifas a agosto 2026", la última para todos los clientes: cambiá los que subieron."
5. **Tarjeta "Cambios de tarifa para revisar"** (Dashboard y Tableros). Texto actual: "Corrección del 25/10/2026: Corrección: la 1ª vuelta de Balancín 2019 estaba mal cargada." y "Hoy · 1 para revisar". Problema: falta la tabla (4), y "Hoy" parece "solo lo de hoy" (3). Propuesta: "Corrección de "Tarifas Alimentos La Serena" del 25/10/2026: <motivo>" y "Pendiente · 1". Vacía, la tarjeta muestra los títulos Documento · Importe · Qué hacer · Acciones sobre "No hay nada para revisar por cambios de tarifa.": dejar solo la frase (2).
6. **Aviso en Editar presupuesto** (B3). Texto actual: "Reenviáselo al cliente con "Enviar por e-mail"." Problema: ese botón no está en Editar (4). Propuesta: "Reenviáselo desde Ver PDF → Enviar por e-mail."
7. **Auditoría de la tabla** (B2). Texto actual: "… para los clientes 7. … Anterior Furgón: 586.896 / … Nuevo Balancín (3 ejes): 620.000 / … Recalculados: 1 viajes y 1 presupuestos; para revisar: 1." y "Valores anteriores: —". Problema: un ID en lugar del cliente (4). "Anterior/Nuevo" es el modelo, pero se lee como valor anterior/nuevo (3). No dice qué valor cambió (4). Concordancia (5). Propuesta: "para Alimentos La Serena S.A."; "2018 o anterior · Furgón: …"; una línea "Cambió: Balancín (3 ejes), 2019 en adelante, hasta 130 km, 1ª vuelta: $ 600.000 → $ 620.000"; "1 viaje y 1 presupuesto".
8. **Error de viajes sin tabla** (B5). Texto actual: "No se puede guardar la tabla de tarifas: 6 viajes quedarían sin tabla." Problema: no dice qué hacer (1) y no marca la fecha. Propuesta: sumar "Para que sigan con esta tabla, la fecha tiene que ser hasta el 21/07/2026." y marcar "Vigente desde" en rojo.
9. **Fecha repetida** (A3). Texto actual: "Ya hay una tabla para todos los clientes vigente desde el 01/08/2026 ("Tarifas a agosto 2026"). Elegí otra fecha o editá esa tabla." Problema: va arriba y no marca el campo. Además queda puesto aunque se cambie a "Solo algunos clientes" y ahí ya no vale (3). Propuesta: ponerlo debajo de "Vigente desde" y borrarlo cuando cambian la fecha o los clientes.
10. **"Revisá los campos marcados."** (A3). Problema: queda arriba aunque ya no hay campos marcados (3). Propuesta: sacarlo cuando no queda ninguno en rojo.
11. **Bloque Clientes** (A3 y A4). Texto actual: "Elegí al menos un cliente." y, debajo, "Todavía no elegiste ningún cliente."; "1 cliente elegido.". Problema: repite (2), y con la lista larga no se ve cuál está elegido (4). Propuesta: solo el error; "1 cliente elegido: Alimentos La Serena S.A." (o los primeros y "y N más"). El rojo cae en el buscador y no en la lista.
12. **Ayuda al pasar una general a algunos clientes** (B4). Texto actual: "Para estos clientes, esta tabla reemplaza a la de todos los clientes. Los demás clientes vuelven a "Tarifas a enero 2026"." Problema: en agosto, que es la de todos, "reemplaza a la de todos" confunde, y no avisa que los importes de los demás bajan (3). Propuesta: "Los demás clientes pasan a "Tarifas a enero 2026" (la anterior): sus viajes desde el 01/08/2026 se recalculan con esos valores."
13. **Eliminar una tabla propia** (§34 paso 3). Texto actual: "No se puede deshacer. Sus clientes vuelven a la tabla para todos los clientes." Problema: "sus clientes" y "la tabla para todos" no dicen cuáles (4). Propuesta: "No se puede deshacer. Lácteos Monte Grande S.R.L. vuelve a "Tarifas a agosto 2026"."
14. **Encabezado de Gestionar tarifas** (A1). Texto actual: dos párrafos ("Cargá la tabla de tarifas de la empresa: …" y "Cada tabla vale desde su fecha hasta que se cargue la siguiente. Una tabla propia de algunos clientes reemplaza para ellos a la de todos."). El botón "Registrar tabla de tarifas" queda abajo a la izquierda. Problema: el design system pide una línea (§3.2) y el botón a la derecha del título (§1.1); "tabla propia" es palabra técnica (3). Propuesta: "Cargá las tablas de tarifas de la empresa: cada una vale desde su fecha hasta que se cargue la siguiente." y el botón en la línea del título.
15. **Línea del importe en el viaje** (A5). Texto actual: "$ 483.898,00 neto · Tarifas Alimentos La Serena · Furgón, modelo 2019 en adelante · tarifa fija hasta 130 km, 1ª vuelta · $ 645.535,00 · falso flete 60 %: $ 387.321,00 · 1 módulo de estadía: $ 96.577,00". Problema: largo (2), el "$ 645.535,00" queda suelto y "neto" se puede no entender (3). Propuesta: "$ 483.898,00 sin IVA · Tarifas Alimentos La Serena · Furgón 2019 en adelante, fija hasta 130 km, 1ª vuelta: $ 645.535,00 · falso flete (60 %): $ 387.321,00 · estadía (1 módulo): $ 96.577,00".
16. **Viaje en viaje** (§34 paso 10). Texto actual: título "Completar números de remito y entrega del viaje #46" y aviso "Ya salió: solo se completa el número de remito. Si cambia el recorrido, registrá otro viaje.". Problema: contradice lo que se puede cargar (falso flete, estadía) (3). Propuesta: "Ya salió: se completan el remito, el falso flete y la estadía. Si cambia el recorrido, registrá otro viaje."
17. **Aviso "Revisá estos valores"** (A3). Texto actual: "Furgón, modelo 2018 o anterior: hasta 130 km, 2ª vuelta ($ 600.000,00) es más cara que hasta 130 km, 1ª vuelta ($ 586.896,00)." Problema: cuesta leerlo (3) y no marca las celdas en la grilla (4). Propuesta: "Furgón, 2018 o anterior: la 2ª vuelta hasta 130 km ($ 600.000,00) es más cara que la 1ª ($ 586.896,00)." y el borde amarillo en esos campos.
18. **Montos con letras** (A3, ver F5). Propuesta: no borrar lo escrito y decir "Escribí solo números (por ejemplo, 581.492,00)."
19. **Buscador de cliente y de chofer** (Gestionar viajes). Si se escribe "Alimentos" y se aprieta Enter con una sola coincidencia, no la elige y muestra "Elegí un cliente de la lista." (1). Propuesta: que Enter elija la única (o la primera) coincidencia.
20. **Traer viajes** (A7, módulo de Facu). Texto actual: "Se agregaron 2 viajes. Atención: No se trajeron 6 viajes que todavía no están en estado Entregado: #45, #46, #49, #47, #48, #50." Problema: "Atención:" y la mayúscula sobran (2, 5) y los números van desordenados. Propuesta: "Se agregaron 2 viajes. No se trajeron 6 que todavía no están entregados: #45, #46, #47, #48, #49 y #50."
21. **Presupuestos** (módulo de Facu). En el PDF: "41.4 km" con punto, "CUIT: 30719998883" sin guiones (el del prestador sí los tiene), "Email:", espacios al final ("Camión: ERS783    ", "(domicilio)      "), y el importe no aclara que es sin IVA. En el formulario: "Distancia (km)" muestra "41.4" (§7.3: "41,4"); "Importe calculado (ARS)"; la lista de choferes trae los inactivos (Dominguez, Villanueva, Lopez, Montenegro, Ferreyra); la ayuda del importe es larga ("Sale de la tabla de tarifas, con el tipo y el modelo del camión. Fija: por banda de km (más de 250, la de 250 más los km que pasan por el precio por km). Por km: todo el viaje."). Propuesta: "41,4 km", "CUIT 30-71999888-3", "E-mail", recortar los espacios, "Importe (sin IVA)", "Importe" y solo choferes activos, como en Generar viaje.
22. **Gestionar proformas** (módulo de Facu): "TOTAL GENERAL" en mayúsculas (§9) y el concepto "Viaje Planta Córdoba Norte -> Depósito Villa Carlos Paz" con "->" en lugar de "→".
23. **Datos de prueba visibles para la tesis:** los presupuestos #4 y #5 muestran el cliente "PRUEBA-CLAUDE 17/10 S.A." y el recorrido "PRUEBA-CLAUDE 18/10 → PRUEBA-CLAUDE 18/10" (quedaron guardados en el presupuesto de una ronda anterior). Sumarlos a la limpieza de la §38. Mis 8 viajes también suben el Dashboard ("Viajes 24, +380 %"; costo $ 13.158.215).
24. **Gestionar orígenes y destinos:** "Cliente" es un desplegable común; el design system pide el buscador compartido para las listas de clientes (§6.3).
25. **Horas:** el recálculo guarda la última modificación del viaje en UTC (el #43 quedó "20:06" a las 17:06) y Auditoría muestra 20:13 para las 17:13. Es el tema conocido de la §2, pero ahora también lo hace el recálculo de tarifas.
26. **Confirmación de B4 (2):** "No cambian · 5" incluye viajes del cliente elegido que siguen igual con la misma tabla (29, 31 y 42, de Distribuidora del Sur). Propuesta: no listar lo que no cambia nada (2).
27. **Columna Vigencia** (A1): va a la izquierda y el §2.1 pide las fechas centradas.

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre que se le puso | Qué se hizo |
|---|---|---|---|---|
| Gestionar clientes | CLIENTES | 7 | Alimentos La Serena S.A. (CUIT 30-71999888-3, administracion@example.com, tel. 1155550000) | Alta, directo |
| Gestionar clientes | CLIENTES | 8 | Lácteos Monte Grande S.R.L. (CUIT 30-71999877-8, compras@example.com, tel. 1155550001) | Alta, directo (sin viajes) |
| Orígenes y destinos | ORIGEN | 9 | Planta Córdoba Norte (Av. Juan B. Justo 5000, Córdoba), cliente 7 | Alta |
| Orígenes y destinos | DESTINO | 9, 10, 11, 12 | Depósito Villa Carlos Paz / Depósito Villa María / Depósito Río Cuarto / Depósito Rosario, cliente 7 | Alta |
| Gestionar tarifas | TARIFARIOS, TARIFARIO_VALORES, TARIFARIO_CLIENTES | 3 | Tarifas Alimentos La Serena (desde 01/10/2026, cliente 7) | Alta. Un rato tuvo también el cliente 8; B1 a B7. Quedó igual que al crearla (Balancín 2019, hasta 130 km 1ª vuelta $ 600.000) |
| Gestionar tarifas | TARIFARIOS | (creada y eliminada) | Tarifas a diciembre 2026 (para todos, desde 01/12/2026) | Alta y baja desde la pantalla (A8) |
| Gestionar tarifas | TARIFARIOS | 5 (creada y eliminada) | Tarifas Lácteos Monte Grande (desde 01/11/2026, cliente 8) | Alta y baja desde la pantalla |
| Gestionar tarifas | TARIFARIO_CAMBIOS / TARIFARIO_REVISAR | Tarifario_ID = 3 | Cambios de B2, B6 (ida y vuelta) y B7; un pendiente del presupuesto #10 ya resuelto | Los creó la app |
| Gestionar viajes | VIAJES | 43 a 50 | Cliente 7, remitos 0001-00045101 a 0001-00045108 | Alta. 43 y 44 en Entregado; 46 En viaje con 1 módulo de estadía; 47 guardado sin cambios |
| Gestionar viajes | VIAJE_EVIDENCIA | viajes 43 y 44 | remito-0001-00045101.png, remito-0001-00045102.png (imagen generada) | Alta |
| Gestionar presupuestos | PRESUPUESTOS | 10 | Cliente 7, Planta Córdoba Norte → Depósito Villa Carlos Paz, fija, $ 600.000 | Alta, pendiente. Recalculado a $ 620.000 y de vuelta a $ 600.000. El envío por e-mail falló (SMTP) |
| Gestionar presupuestos | PRESUPUESTOS | 11 | Cliente 7, → Depósito Villa María, por km, $ 391.175,20 | Alta, aceptado, generó el viaje 51 |
| Gestionar presupuestos | VIAJES | 51 | Viaje del presupuesto #11 (chofer Raúl Juarez) | Alta |
| Gestionar proformas | PROFORMAS, PROFORMA_DETALLE, PROFORMAS_VIAJES | 55 | Borrador del cliente 7 con V43 y V44 | Alta (borrador, sin número; no se generó) |
| (F1, sin querer) | VIAJES | 38, 39, 40 (Servicios Ambientales S.A.) | — | `TarifarioID` y `Importe_Detalle` pasaron a la tabla 3 y se volvieron a "Tarifas a agosto 2026" unos minutos después. El importe, `Fecha_Modi` y `Usu_Modi` no cambiaron. Quedan dos registros de Auditoría de TARIFARIOS (20:17:32 y 20:18:15 UTC) |
| Auditoría | Auditoría | — | Registros de TARIFARIOS 3, VIAJES 43 y PRESUPUESTOS 10 | La app los creó; se pueden dejar como historia |

Al terminar: agosto y enero con sus valores y fechas originales (nunca se guardaron cambios en ellas), sin tablas "Próxima" de prueba, el borrador #55 en borrador y la tarjeta en "No hay nada para revisar por cambios de tarifa.". La tabla de prueba no se puede eliminar desde la pantalla porque la usan los viajes 43 a 51.

## SQL de limpieza propuesto (NO ejecutado)
```sql
BEGIN TRAN;

-- 0. Revisar antes: tienen que salir solo mis datos
SELECT Viaje_ID, ClienteID, Num_Remito, Estado FROM dbo.VIAJES WHERE Viaje_ID BETWEEN 43 AND 51 AND ClienteID = 7;
SELECT Proforma_ID, ClienteID, Estado, Cli_RazonSocial FROM dbo.PROFORMAS WHERE Proforma_ID = 55;
SELECT Presupuesto_ID, Estado, ViajeID FROM dbo.PRESUPUESTOS WHERE Presupuesto_ID IN (10, 11) AND Datos LIKE N'%administracion@example.com%';

-- 1. Lo pendiente por cambios de tarifa de la tabla de prueba (TARIFARIO_REVISAR se borra en cascada con su cambio)
DELETE FROM dbo.TARIFARIO_REVISAR WHERE (Viaje_ID BETWEEN 43 AND 51 AND ClienteID = 7) OR Presupuesto_ID IN (10, 11) OR Proforma_ID = 55;
SELECT @@ROWCOUNT;
DELETE FROM dbo.TARIFARIO_CAMBIOS WHERE Tarifario_ID = 3 AND Tabla LIKE N'Tarifas Alimentos La Serena%';
SELECT @@ROWCOUNT;

-- 2. Borrador #55 (líneas, vínculo con los viajes y la proforma)
DELETE FROM dbo.PROFORMAS_VIAJES WHERE ProformaID = 55 AND ViajeID IN (43, 44);
SELECT @@ROWCOUNT;
DELETE FROM dbo.PROFORMA_DETALLE WHERE Proforma_ID = 55 AND Codigo IN ('V43', 'V44');
SELECT @@ROWCOUNT;
DELETE FROM dbo.PROFORMAS WHERE Proforma_ID = 55 AND ClienteID = 7 AND Estado = 'Borrador' AND Cli_RazonSocial = N'Alimentos La Serena S.A.';
SELECT @@ROWCOUNT;

-- 3. Presupuestos (el 11 apunta al viaje 51: va antes que los viajes)
DELETE FROM dbo.PRESUPUESTOS WHERE Presupuesto_ID IN (10, 11) AND Datos LIKE N'%administracion@example.com%';
SELECT @@ROWCOUNT;

-- 4. Viajes 43 a 51 y lo que cuelga de ellos
DELETE FROM dbo.VIAJE_EVIDENCIA WHERE Viaje_ID IN (43, 44);
SELECT @@ROWCOUNT;
DELETE FROM dbo.VIAJE_GASTOS WHERE Viaje_ID BETWEEN 43 AND 51;  -- tendría que dar 0
SELECT @@ROWCOUNT;
DELETE FROM dbo.VIAJES WHERE Viaje_ID BETWEEN 43 AND 51 AND ClienteID = 7;
SELECT @@ROWCOUNT;  -- 9

-- 5. Tabla de prueba (valores y clientes en cascada)
DELETE FROM dbo.TARIFARIOS WHERE Tarifario_ID = 3 AND Nombre = N'Tarifas Alimentos La Serena' AND Para_Todos = 0;
SELECT @@ROWCOUNT;

-- 6. Orígenes, destinos y clientes de prueba
DELETE FROM dbo.ORIGEN WHERE Origen_ID = 9 AND ClienteID = 7 AND Descripcion = N'Planta Córdoba Norte';
SELECT @@ROWCOUNT;
DELETE FROM dbo.DESTINO WHERE Destino_ID IN (9, 10, 11, 12) AND ClienteID = 7 AND Descripcion LIKE N'Depósito %';
SELECT @@ROWCOUNT;  -- 4
DELETE FROM dbo.CLIENTES WHERE Cliente_ID IN (7, 8) AND CUIT_Cliente IN ('30719998883', '30719998778');
SELECT @@ROWCOUNT;  -- 2

-- COMMIT; o ROLLBACK;
```
Nota: los nombres de columnas de VIAJES, PROFORMAS, ORIGEN, DESTINO y CLIENTES salen de lo que devuelve la API (`ClienteID`, `Cli_RazonSocial`, `Descripcion`, `CUIT_Cliente`). Si alguno cambia en la base, conviene correr primero el bloque 0. Para la parte C conviene **no** limpiar todavía: usa el borrador #55 y la tabla de prueba.
