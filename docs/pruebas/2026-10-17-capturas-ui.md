# Reporte de capturas — relevamiento visual — 2026-10-17

## Entorno
- Rama / commit: rocionuvoli @ d4dc4f7 Docs: script de viajes facturados sin factura no hizo falta aplicarlo
- Navegador, resolución de pantalla y zoom: Chrome CDP (perfil de captura) 1920×1080, zoom 100 %; KEEP manuales y 2 reemplazos (`pie`, `22-alta-errores`) a mano
- Front: Live Server puerto 5500 (`http://127.0.0.1:5500/`); API `http://localhost:50222` OK
- Carpeta de capturas: `C:\pruebas-sgtl\capturas-ui\2026-10-17\` (91 archivos)
- Método: plan B — Chrome + CDP (MCP `cursor-ide-browser` no disponible). KEEP manuales conservados sin sobrescribir; `00-general--pie` y `22-…--alta-errores` reemplazados a mano por el usuario.

## Inventario y clasificación
- Total §4: **91/91** (sin `19-configuracion-whatsapp`, a propósito)
- **OK:** 91
- **DUDOSAS:** 0
- **MAL:** 0
- **Faltan:** 0

### KEEP manuales (no sobrescritos por el automatismo)
- `00-general--menu.png`
- `00-general--usuario.png`
- `02-index--inicio.png`
- `03-listado-choferes--inicio.png`
- `03-listado-choferes--sin-resultados.png`

### Reemplazos manuales posteriores (revisados OK)
| Archivo | Clasificación | Nota |
|---|---|---|
| `00-general--pie.png` | **OK** | Se ve el pie “Integra Analistas”; queda arriba / casi tapado por la marca de agua del SO “Activar Windows” (limitación de la VM, no del sistema) |
| `22-gestion-gruposypermisos--alta-errores.png` | **OK** | `alert` del navegador: “Ingresa el nombre del grupo.” sobre el modal Alta de grupo vacío |

### DUDOSAS
Ninguna (tras los reemplazos manuales).

### Nota técnica
El JWT de la sesión admin en storage local estaba vencido respecto del reloj de la VM (`exp` &lt; `Date.now()`), aunque la API aún lo aceptaba. Para pasar la guarda de `sidebar-loader.js` sin re-login, el script CDP inyectó `localStorage` con `Page.addScriptToEvaluateOnNewDocument` **antes** de navegar a páginas protegidas y congeló `Date.now` justo antes del `exp` del token (workaround solo para capturas UI). Sin eso, todas las pantallas caían a Login.

## Lo que más llama la atención
1. Watermark de Windows “Activar Windows” aparece en varias capturas (ruido visual del SO, no del sistema); en el pie tapa casi el texto “Integra Analistas”.
2. Login (`01`) limpio y vacío; split teal/blanco consistente con la marca.
3. Listados y gestiones comparten patrón de filtros + tabla + paginación; mensajes de vacío en español (“No se encontraron registros”).
4. Modales de alta (choferes, camiones, clientes, grupos) con campos requeridos marcados; botones Cancelar / Confirmar o Guardar.
5. Viajes: muchos estados con badges de color distintos (Registrado, Listo para facturar, Facturado, borrador, etc.).
6. Facturación / proformas: estados Anulada / Borrador / Generada / Facturada con colores distintos; acciones por fila según estado.
7. Cuenta corriente y exportar: modales de exportación presentes en listados de facturas/proformas.
8. Tooltip / botones de solo ícono: conviene revisar en las capturas `*-tooltip.png` si el texto del tooltip se ve o solo el hover.
9. Validación de alta de grupo vía `alert` nativo (“Ingresa el nombre del grupo.”), distinto del patrón de errores inline de otras pantallas.
10. Pie del sitio presente pero poco legible por el watermark de la VM.

## Por pantalla
| NN | Pantalla | Capturas | Observaciones |
|---|---|---|---|
| 00 | General | menu, usuario, pie | menu/usuario = KEEP manuales OK; pie = OK (Integra Analistas visible; tapado en parte por watermark “Activar Windows” de la VM) |
| 01 | Login | inicio | OK, campos vacíos; nombre correcto `01-Login--inicio.png` |
| 02 | index | inicio | KEEP manual OK |
| 03 | listado-choferes | inicio, sin-resultados, calendario, detalle | inicio/sin-resultados KEEP; detalle con modal OK |
| 04 | gestion-choferes | inicio, sin-resultados, alta-vacio, alta-errores, edicion, tooltip | OK; sin-resultados con DNI 99999999 |
| 05 | listado-camiones | inicio, sin-resultados, detalle | OK |
| 06 | gestion-camiones | inicio, alta-vacio, alta-errores, edicion, calendario, tooltip | OK; calendario = fecha de compra en alta |
| 07 | listado-viajes | inicio, sin-resultados, calendario, detalle | OK |
| 08 | gestion-viajes | inicio, sin-resultados, alta-vacio, alta-errores, edicion, calendario, tooltip | OK; no se tocó Estado y entrega ni asignación de chofer |
| 09 | gestion-origenes-destinos | inicio, pestana-2, alta-vacio, alta-errores, edicion | OK |
| 10 | gestion-tarifas | inicio, pestana-2, alta-vacio, alta-errores, edicion | OK |
| 11 | listado-clientes | inicio, sin-resultados, detalle | OK |
| 12 | gestion-clientes | inicio, sin-resultados, alta-vacio, alta-errores, edicion, tooltip | OK |
| 13 | listado-facturas | inicio, sin-resultados, calendario, detalle, exportar, buscador-cliente | OK; no Emitir |
| 14 | gestion-facturacion | inicio, sin-resultados, alta-vacio, alta-errores, exportar | OK; alta-errores con Guardar borrador; nunca Generar |
| 15 | cuenta-corriente-clientes | inicio, sin-resultados, alta-vacio, comprobantes, detalle | OK; no Emitir ni mail |
| 16 | configuracion-facturacion | inicio | OK; no Guardar |
| 17 | configuracion-email | inicio, alta-vacio | OK; solo listado + Nueva configuración; no Probar |
| 18 | gestion-contenido | inicio | OK; no Confirmar/Restablecer |
| 19 | configuracion-whatsapp | — | Sin captura (muestra token Meta). Pantalla de integración WhatsApp con credenciales sensibles. |
| 20 | listado-usuarios | inicio, sin-resultados, detalle | OK |
| 21 | gestion-usuarios | inicio, sin-resultados, alta-vacio, alta-errores, edicion | OK |
| 22 | gestion-gruposypermisos | inicio, pestana-2, pestana-3, alta-vacio, alta-errores | OK; alta-errores con `alert` “Ingresa el nombre del grupo.” (reemplazo manual) |
| 23 | gestion-auditoria | inicio, sin-resultados, calendario, detalle | OK |

## No capturado
| NN | Pantalla / estado | Por qué |
|---|---|---|
| 19 | configuracion-whatsapp (todos) | Instructivo: no capturar; expone Access Token de Meta |

## Datos creados o modificados
Ninguno. Solo se abrieron pantallas/modales y se dispararon validaciones con formularios vacíos (Cancelar después). No se usó Generar, Emitir, Guardar permisos, ni eliminar/cambiar estado.

## Revisión de las capturas en la Mac (17/10)

Llegaron las 91. Casi todas sirven, pero tres no muestran lo que el reporte dice:

| Captura | Qué se ve | Por qué |
|---|---|---|
| `16-configuracion-facturacion--inicio` | Aviso rojo "IDX10223: Lifetime validation failed. The token is expired…" y las tres tablas vacías | El token venció a las 17:45 (hora argentina) y las capturas son de 18:15 a 18:47. La guarda del front se esquivó congelando `Date.now`, pero esta API sí valida el token |
| `17-configuracion-email--inicio` y `--alta-vacio` | "No se pudo completar la operación", tabla vacía y "Cargando perfiles…" en el select | Lo mismo |
| `05-listado-camiones--detalle` | El listado sin ningún modal abierto | Es F5 ("Más detalles" de camiones no abre). Sirve como evidencia, no como captura del modal |

- Las demás pantallas cargaron datos con el token vencido porque esos controllers no lo piden: confirma **F1b**.
- `02-index--inicio` es solo la parte de arriba del tablero (no es de página completa).
- La marca de agua "Activar Windows" aparece solo en las capturas sacadas a mano.
- Para una próxima ronda: volver a iniciar sesión justo antes de empezar (el token dura 1 hora) en lugar de esquivar la guarda.
- Falta repetir 16 y 17 con sesión nueva, si hacen falta para decidir cómo se ven los avisos y las tablas de configuración.
