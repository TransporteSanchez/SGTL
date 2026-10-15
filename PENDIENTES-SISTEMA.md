# Pendientes a corregir en SGTL

Relevamiento del 14/10/2026, a partir de la prueba completa de Viajes en la VM y de la revisión posterior.

---

## 1. Cambios subidos a `rocionuvoli`, pendientes de probar en la VM

Para aplicarlos en la VM: `git pull` en la rama `rocionuvoli`, recompilar la API en Visual Studio y probar.

| # | Qué | Archivos | Cómo probarlo |
|---|---|---|---|
| 1.1 | **Proforma: fecha estimada de carga y de entrega obligatorias.** Se graban también en `FechaDesde` / `FechaHasta`, que en la base no admiten nulos; hoy, si quedan vacías, el guardado falla con un error genérico. Ahora el modal las marca con asterisco, no deja guardar, marca el campo en rojo y muestra "Por favor, completá todos los campos requeridos *". La API también lo valida y responde 400 con mensaje claro. | `gestion-facturacion.html`, `ProformasController.cs` | Nueva proforma → dejar las dos fechas vacías → Guardar borrador: aviso rojo y campos marcados. Completarlas → guarda normal. |
| 1.2 | **Auditoría: nombre de entidad sin sufijo.** Se grababa `VIAJES_7970…` en lugar de `VIAJES` (nombre interno de Entity Framework). | `Sgtlauditcontext.cs` | Editar un camión desde pantalla → en Auditoría, Entidad = `CAMIONES`. |
| 1.3 | **Viajes: campo de km en gris cuando no se puede editar.** | `gestion-viajes.html` | Abrir un viaje → el campo de km se ve gris salvo en modo de carga manual. |

**Sobre 1.2:** los 127 registros viejos con sufijo ya se corrigieron en la base el 14/10. Hasta que la API se recompile en la VM con este cambio, cada edición desde pantalla vuelve a grabar el sufijo. Después de recompilar, repetir esta corrección (dentro de transacción, revisar la cantidad antes del `COMMIT`):

```sql
BEGIN TRAN;
UPDATE AUDITORIA
SET Entidad = LEFT(Entidad, LEN(Entidad) - CHARINDEX('_', REVERSE(Entidad)))
WHERE LEN(Entidad) > 40 AND CHARINDEX('_', Entidad) > 0;
SELECT @@ROWCOUNT AS Filas_Actualizadas;
-- COMMIT;  o  ROLLBACK;
```

---

## 2. Hora guardada en UTC (3 horas adelantada)

**Prioridad alta, después de la presentación.**

El sistema toma la hora actual de tres lugares distintos:

| Quién pone la hora | Qué hora guarda | Dónde |
|---|---|---|
| La base (`GETDATE()` en Azure) | UTC, 3 h adelantada | Auditoría (todo), Proformas, cambio de estado y evidencia de Viajes, Cuenta corriente, Grupos, WhatsApp |
| La API (`DateTime.Now`) | Hora Argentina (la API corre en una PC de acá) | Alta/edición de viajes, bajas/activaciones de choferes, camiones y clientes |
| El navegador (`toISOString()`) | UTC | Alta/edición de choferes, camiones y clientes (esas pantallas restan 3 h al mostrar) |

**Qué implica:**

1. **Cuenta corriente:** desde las 21:00, lo que vence hoy aparece como vencido y los días vencidos suman uno de más.
2. **Proformas:** generada sin fecha de emisión después de las 21:00, queda con la fecha del día siguiente (y el listado filtra por esa fecha).
3. **Auditoría:** todas las horas 3 h adelantadas; después de las 21:00 también cambia el día.
4. **Viajes:** `Fecha_Modi` queda a veces en hora Argentina (edición) y a veces en UTC (cambio de estado).
5. **Choferes / Camiones:** las bajas y activaciones se ven 3 h atrasadas (se guardan en hora Argentina pero la pantalla igual resta 3 h).
6. **Riesgo a futuro:** si la API se publica en Azure, `DateTime.Now` también pasa a ser UTC.

Facturación (Facu) ya lo resolvió para la fecha de los comprobantes con `FechaArgentina()`.

**Plan propuesto:**

- **Etapa 1:** reemplazar `GETDATE()` por `CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'Argentina Standard Time' AS datetime)` en ~35 consultas de 11 archivos:
  CuentaCorriente (10), Proformas (9), Recibos (4), Viajes (3), Sgtlauditcontext (2), WhatsAppConfig (2), Grupos, GestionContenido, Facturas, Comprobantes y Autenticacion (1 cada uno).
  Toca módulos de Facu y Fede: avisarles antes.
- **Riesgo:** las consultas son texto dentro del código; un error de tipeo compila igual y recién falla al usar la pantalla. Probar cada flujo en la VM: proformas (crear, generar, estado, anular, duplicar), cuenta corriente, recibos, comprobantes, facturas, cambio de estado y evidencia de viajes, login, grupos, configuración de WhatsApp.
- **Registros viejos de Auditoría:** después del cambio, pasarlos a hora Argentina con un `UPDATE` (restar 3 h), revisado antes de confirmar.
- **Etapa 2 (opcional):** unificar Choferes, Camiones y Clientes (hoy guardan en UTC y restan al mostrar). Implica convertir datos existentes y tocar varias pantallas.

---

## 3. Otros hallazgos de la prueba en la VM

| # | Qué | Qué hacer |
|---|---|---|
| 3.1 | **Live Server recarga la página** cuando la API escribe `App_Data/whatsapp.log`, y se pierde lo que se estaba cargando. | Agregar en `.vscode/settings.json`: `"liveServer.settings.ignoreFiles": ["**/App_Data/**", "**/bin/**", "**/obj/**"]`. |
| 3.2 | **Puerto 5500 vs 5502.** `.vscode/settings.json` fija 5502, pero en la VM Live Server levantó en 5500. El Cursor de la VM agregó `127.0.0.1:5500` a las referencias permitidas de la clave de Google Maps. | Ver por qué la VM no toma 5502 (probablemente se abrió otra carpeta como raíz). Unificar en un puerto y dejar en la clave de Maps solo los necesarios. |
| 3.3 | **Contraseña de la base en `Web.config`, subida a git.** | Coordinar con el equipo: sacarla del repo (archivo local no versionado o variables de entorno) y **cambiar la contraseña** en Azure, porque la actual ya quedó en el historial. |
| 3.4 | **Direcciones que Google ubica mal** en Orígenes y destinos: "claros del bosque" lo ubica en Córdoba; "Sede Temperley" en Paso del Rey. | Es un tema de datos: corregir esas direcciones desde Orígenes y destinos. |
| 3.5 | **`bin/` y `obj/` aparecen como archivos nuevos en la VM.** En la Mac el `.gitignore` ya los ignora. | En la VM correr `git check-ignore -v WebApi_TransporteSanchez/bin` para ver por qué no los toma. |
| 3.6 | **Proforma: Cliente, Origen y Destino tienen asterisco** pero se pueden dejar vacíos al guardar un borrador; recién se exigen al generar. | Decidir si se validan también al guardar o si se aclara que son obligatorios para generar. |

---

## 4. Limpieza de datos de prueba en la VM

**Pendiente de OK.** El SQL que propuso la VM, para correr dentro de transacción (cantidades esperadas: 73 / 2 / 1):

```sql
BEGIN TRAN;
DELETE FROM AUDITORIA WHERE Auditoria_ID BETWEEN 373 AND 454
  AND (Usuario = 'PRUEBA-AUTO' OR (Usuario = 'RNUVOLI' AND Clave IN ('Viaje_ID=22', 'Viaje_ID=23')));
DELETE FROM PROFORMA_DETALLE WHERE Proforma_ID = 15;
DELETE FROM PROFORMAS WHERE Proforma_ID = 15 AND Observaciones LIKE 'PRUEBA-AUTO%';
-- Revisar cantidades → COMMIT;  o  ROLLBACK;
```

- El número PF-00000003 queda consumido en `SEQ_PROFORMA`.
- **No tocar** los registros de FGODOY (Auditoria_ID 400–403, 411, 416) ni los de RNUVOLI sobre el chofer 4 (367, 439).

Opcional: volver a correr en la VM las pruebas de WhatsApp de la regla 3 (`C:\pruebas-sgtl\prueba-viajes.ps1`, opciones `-SoloLimpieza` y `-SinLimpieza`; la sección 7 consume un número de proforma).

---

## 5. Pendientes generales

- **Orígenes y destinos:** autocompletado de direcciones con Google Places y guardado de coordenadas.
- **Merge `rocionuvoli` → `main`**, avisando a Fede y Facu.
- **Alertas de Dependabot** en GitHub (59).
- **Antes de presentar la tesis:** limpiar los registros de prueba para que queden solo usuarios reales.
