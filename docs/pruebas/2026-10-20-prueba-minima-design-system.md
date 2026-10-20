# Reporte de pruebas — Prueba mínima design system 20/10 — 20/10/2026

> **Ojo:** esta prueba **no se hizo en la VM** (problemas con el navegador y Cursor). Se corrió en la Mac
> contra una API en memoria, con datos inventados. Sirve de control, pero falta la prueba en la VM con la base.

## Entorno
- Rama / commit: `rocionuvoli` @ `4854f44` Front: íconos de Bootstrap centrados en el login y el dashboard
- API: en memoria en `http://127.0.0.1:50222` (sin base, sin SQL). En la Mac no corre IIS ni .NET.
- Front: `http://127.0.0.1:5502` (servidor estático de Python, no Live Server)
- Alcance: la "Prueba mínima en la VM (20/10)" de la §10 de `docs/PENDIENTES-SISTEMA.md`

## Resumen
6 pasos: 2 OK y 4 FALLA. Fallas nuevas: F1 (fecha un día antes al reeditar un camión) y F2
(`cargarEstilosContenido is not a function` en Gestionar facturación). F3 y F4 ya estaban anotadas.
El alta, la edición, la inactivación y la eliminación del camión de prueba funcionaron.

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | Login y Dashboard | Login admin, íconos y pestaña | OK | Íconos de usuario, candado y ojo visibles. Entra al Dashboard. Pestaña "Dashboard · SGTL". Consola vacía en ese primer ingreso. |
| 2 | Menú completo | Abrir cada ítem | FALLA | Los 24 ítems están en infinitivo y cada uno abre su pantalla. Consola: PerfectScrollbar en casi todas (F3). En Gestionar facturación, además, `cargarEstilosContenido is not a function` (F2). |
| 3 | Camiones, clientes, usuarios, grupos, tarifas, orígenes y destinos, auditoría, contenido | Cargar tabla con datos, sin errores | FALLA | No quedan en "Cargando…" y muestran filas. La consola repite PerfectScrollbar (F3). Los datos no son los de la base. |
| 4 | Gestionar camiones | Alta ZZ999ZZ / PRUEBA, editar, inactivar, eliminar | FALLA | Los cuatro toasts salen y el camión desaparece. Al reabrir la edición, la fecha de compra 2024-01-01 se ve 31/12/2023 y la ITV 2025-06-01 se ve 31/05/2025 (F1). |
| 5 | Clientes, usuarios, tarifas | Lápiz y Cancelar | OK | El modal abre con datos y Cancelar lo cierra. Los grupos no se vieron porque el usuario de la simulación era admin. |
| 6 | Viajes, proformas, cuenta corriente | Abrir | FALLA | Cargan. En Gestionar viajes, además de PerfectScrollbar: `Cannot read properties of null (reading 'innerHTML')` en simple-datatables.js:8 (F4). |

## Fallas

### F1 — Al editar un camión, la fecha queda un día antes
- Gravedad: Media
- Dónde: Gestionar camiones, modal Editar camión, fechas de compra e ITV
- Pasos: registrar un camión con compra 01/01/2024 e ITV 01/06/2025, guardar y volver a abrir el lápiz.
- Obtenido: compra 31/12/2023 e ITV 31/05/2025. La API falsa devolvía `"2024-01-01"`.
- Causa: `ponerFecha` hacía `new Date("2024-01-01")`, que es medianoche UTC y en Argentina cae el día anterior.

### F2 — Gestionar facturación: `cargarEstilosContenido is not a function`
- Gravedad: Media
- Dónde: `configuracion-facturacion.html`, línea 86
- Obtenido: la pantalla abre, pero el pie queda "2024 © Integra Analistas" y la consola marca el error. `window.applyStyles` sí existe.

### F3 — PerfectScrollbar en la consola de casi todas las pantallas
- Gravedad: Baja. `Uncaught Error: no element is specified to initialize PerfectScrollbar`. Ya anotada como F16.

### F4 — Gestionar viajes: simple-datatables lee `innerHTML` de null
- Gravedad: Baja. Ya anotada (F12 / F2 de la ronda del 18/10).

## Datos de prueba
Camiones 2 y 3 (ZZ999ZZ, PRUEBA), solo en la memoria de la API falsa; al cerrar no quedaba ninguno. No se escribió nada en `Transporte_Sanchez`.

## Seguimiento (Mac, 20/10)
- **F1 — corregida** en `gestion-camiones.html`: `ponerFecha` arma la fecha como día local. Con la API real
  probablemente no pasaba (devuelve `"2024-01-01T00:00:00"`, sin zona, que el navegador toma como hora local),
  pero ahora anda con los dos formatos. Verificado en el navegador con zona America/Cordoba: antes 31/12/2023, ahora 01/01/2024.
- **F2 — no es de esta tanda y no se reprodujo en el código:** `assets/static/gestionContenido.js` define
  `window.cargarEstilosContenido` (línea 21) desde el commit `4a84bb2` de Facu, y la pantalla lo carga antes de llamarla.
  Que `applyStyles` exista y `cargarEstilosContenido` no indica que el navegador usó una copia vieja del archivo
  (el servidor estático de Python no evita la caché). Verificar en la VM con Ctrl+F5.
- **F3 y F4:** ya anotadas, no son de esta tanda.

## Segunda pasada (Mac, 20/10, servidor de prueba sin caché)
- **F1:** con la API devolviendo `"2024-01-01"` y `"2025-06-01"` (fecha sin hora, el caso del reporte), Editar camión
  muestra 01/01/2024 y 01/06/2025. Corregida.
- **F2:** no se reproduce. En Gestionar facturación `cargarEstilosContenido` existe, se aplica el pie configurado y la
  consola solo muestra PerfectScrollbar (F3). En el primer intento de esta pasada el servidor estático cortó varias
  conexiones (`ERR_CONNECTION_RESET`) y `sgtl-ui.js` y `header.js` no llegaron a cargarse; con una recarga anduvo.
  Lo más probable es que en la prueba haya pasado lo mismo con `gestionContenido.js` (o que estuviera en caché):
  es del servidor de prueba, no del código.
- **Recorrida:** las 11 pantallas de la tanda cargan `SGTL`, muestran la pantalla y ninguna tabla queda en "Cargando…";
  Dashboard, cuenta corriente, e-mail, WhatsApp, manual e informe de versión también abren con su título nuevo.
