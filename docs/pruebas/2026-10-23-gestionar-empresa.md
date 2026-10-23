# Reporte de pruebas — Gestionar empresa (§30) — 23/10/2026

> Reporte de la sesión de la VM. Al copiarlo al repo se quitaron los datos reales de la empresa (nombre de la persona,
> CUIT y domicilio) y el e-mail del cliente (§7 de `docs/README.md`). Seguimiento en la §30 de
> `docs/PENDIENTES-SISTEMA.md`.

## Entorno
- Rama / commit: rocionuvoli @ 16b05c4 "Permisos: Gestión de empresa en el catálogo de Grupos y permisos". **No es la versión pedida (06a18e6):** el remoto está en 06a18e6 (`git ls-remote`), pero el pull no lo trajo a la VM. Rocío decidió probar igual con 16b05c4. Árbol limpio.
- API: http://localhost:50222/api (OK), compilada sobre 16b05c4.
- Front: Live Server puerto 5500 (el 5502 no responde).
- Base: `database/empresa/01_crear_empresa.sql` corrido por Rocío (paso 0).
- Usuarios: RNUVOLI (admin) y mledesma (no admin, para el paso 1). Los logins los hizo Rocío. La sesión de RNUVOLI venció una vez (dura 30 min) y Rocío volvió a entrar.
- Alcance pedido: §30 de `docs/PENDIENTES-SISTEMA.md`, pasos 1 a 9, con los cuidados de Rocío: no guardar en el paso 2; el paso 3 lo hace Rocío; en los pasos 5 y 6 dejar todo como estaba; Gestionar contenido igual que al empezar; solo Ver PDF de documentos que ya existen; e-mail solo a @example.com.
- Cómo se controlaron los PDF: un registro en la página anota cada texto y cada imagen que dibuja jsPDF. Así se comparó la imagen de cada PDF con el logo de la empresa (misma huella) y se confirmó que ninguno lleva el de SGTL. Además, captura de la vista previa.

## Resumen
29 pruebas en la tabla: 27 OK y 2 NO PROBADO. Además quedan NO PROBADOS los PDF sin logo de la factura, el recibo y el presupuesto. Ninguna falla es de la §30. Los datos y el logo de la empresa salen bien en la factura, el recibo, la proforma y el presupuesto. Cada documento pide la versión de su fecha de emisión, y ninguno sale con el logo de SGTL ni con datos de otra versión.
Lo más importante:
- (1) El envío por e-mail no se pudo probar: la API de la VM no puede leer la contraseña SMTP del perfil de presupuestos (F1, no es de la §30). El adjunto, en cambio, se armó con el logo y los datos correctos.
- (2) En Gestionar contenido, **Facu guardó un cambio a las 13:22:57, en medio de mi prueba, y mi "Restablecer" lo pisó**. A pedido de Rocío, al final volví a cargar sus valores (ver "Apariencia al final").

## Resultados
| # | Pantalla / ítem | Prueba | Resultado | Nota |
|---|---|---|---|---|
| 1 | Menú (admin) | Configuración: Gestionar e-mail · Gestionar integración de WhatsApp · Gestionar empresa · Gestionar contenido | OK | |
| 2 | Gestionar grupos y permisos → Permisos por grupo | En Configuración: E-mail, Gestión de contenido, Gestión de empresa, Integración WhatsApp | OK | En Administradores, "Gestión de empresa" está sin tildar (es nueva) y por eso Configuración también. No guardé nada. |
| 3 | Menú (mledesma, no admin) | Configuración no aparece | OK | |
| 4 | `gestion-empresa.html` escrita en la dirección (mledesma) | Manda al inicio, igual que `configuracion-email.html` | OK | Las dos (y `gestion-contenido.html`) pasan por `index.html` y terminan en Listar choferes, que es el inicio de mledesma. Gestionar empresa redirige antes de pedir `api/empresa`. |
| 5 | `PUT api/empresa` con mledesma | Rechazado por no ser admin | NO PROBADO | El permiso automático de esta sesión bloqueó el PUT de prueba (iba sin CUIT, así que no podía guardar nada). En el código, `EmpresaController.cs:217` devuelve 403 antes de validar. |
| 6 | Gestionar empresa, al entrar | Aviso amarillo "Faltan el CUIT y el domicilio…", razón social "Transporte Sánchez", recuadro "Sin logo: sale el nombre en texto" con "Elegir logo", "Todavía no se completaron." | OK | |
| 7 | Gestionar empresa a 1366 px | Datos fiscales en 2 × 2 con el logo al lado; abajo, domicilio y contacto lado a lado | OK | Medido con las posiciones de los bloques. A 683 px, una columna. |
| 8 | Guardar con los campos vacíos (sin guardar nada) | "Revisá los campos marcados.", cada error debajo de su campo y el cursor en Razón social | OK | No salió ningún PUT. Localidad no se marca mientras no hay provincia (está deshabilitada); con provincia elegida, "Seleccioná una localidad.". |
| 9 | Formatos (sin guardar) | CUIT "30-71" → "El CUIT tiene que tener 11 números."; e-mail sin dominio → "Revisá el e-mail: tiene que tener @ y un dominio, como nombre@correo.com."; teléfono con guion → el campo deja solo los números | OK | Recargué para descartar todo. |
| 10 | Paso 3 (lo hizo Rocío) | "Datos de la empresa guardados.", "Última modificación: RNUVOLI · 23/10/2026 12:57", el recuadro con el logo ("76 KB · sale en los documentos", "Reemplazar logo" y "Quitar logo") y se va el aviso amarillo | OK | Completó la versión 1 (Empresa_ID 1, sigue vigente desde 01/01/2000): no agregó otra. |
| 11 | Guardar otra vez sin tocar nada | "No había cambios para guardar." | OK | Sin versión nueva. |
| 12 | Ver PDF de la factura FAC-00000008 (15/10, cuenta corriente) | Logo de la empresa, "Transporte Sánchez", razón social, CUIT y condición de IVA, domicilio | OK | Pide `api/empresa?fecha=2026-10-15`. No hay renglón de contacto porque no se cargaron teléfono ni e-mail. Pie: Cerrar · Enviar por e-mail · Imprimir · Descargar PDF. |
| 13 | Ver PDF del recibo REC-00000003 (07/10) | Ídem | OK | `?fecha=2026-10-07`. |
| 14 | Ver PDF de la proforma PF-00000002 (07/10, generada) | Ídem | OK | `?fecha=2026-10-07`. Pie: Cerrar · Imprimir · Descargar PDF. Con logo, el nombre va chico, debajo (ver Mejoras). |
| 15 | Ver PDF del presupuesto #1 (17/10) | Ídem: logo arriba a la derecha, datos en "Prestador" | OK | `?fecha=2026-10-17`. |
| 16 | Enviar el presupuesto #1 por e-mail a administracion@example.com (con el OK de Rocío) | El adjunto con logo y datos | NO PROBADO | El adjunto que se armó para enviar tenía el logo y los datos correctos, pero el correo no salió. 1.º intento: 401, la sesión había vencido (F2). 2.º intento: 400 "No se pudo leer la contraseña del perfil SMTP…" (F1). El destinatario venía cargado con el e-mail del cliente y lo cambié antes de enviar. |
| 17 | Paso 5: cambiar un dato y Guardar | La factura de un día anterior sigue como antes; un borrador de proforma sale con el dato nuevo | OK | Cambié el **e-mail** (vacío → administracion@example.com) en lugar del teléfono: no había teléfono cargado y el instructivo pide preguntar qué teléfono usar. Versión 2. La factura FAC-00000008 (15/10) sale sin e-mail (versión 1) y el borrador de proforma #23, con el e-mail (versión 2). |
| 18 | Paso 5: dejar el dato como estaba | E-mail vacío otra vez | OK | Versión 3. |
| 19 | Paso 6: "Quitar logo" | El recuadro dice "Sin guardar · va a salir el nombre en texto" y el botón vuelve a "Elegir logo" | OK | |
| 20 | Paso 6: Guardar y ver los PDF | Nombre en texto, sin logo | OK | Versión 4. El borrador #23 y PF-00000011 (generada hoy) salen con "Transporte Sánchez" en grande y **ninguna imagen** (tampoco la de SGTL). PF-00000002 (07/10) sigue con el logo (versión 1), como corresponde. |
| 21 | Paso 6: volver a subir el logo | El mismo de Rocío | OK | Lo volví a cargar con "Reemplazar logo" desde una copia exacta tomada antes de quitarlo. Quedó idéntico, byte por byte (104.430 caracteres). Versión 5. |
| 22 | Gestionar contenido: textos | Solo la apariencia, con el subtítulo "…No cambian los documentos: sus datos y su logo están en Gestionar empresa."; bloques Logo del sistema · Colores · Pie de página; ayuda del menú con "el círculo con las iniciales del usuario (arriba a la derecha)" | OK | |
| 23 | Color del menú y Guardar | "Apariencia guardada." y se pinta enseguida | OK | `#198754`: la opción elegida del menú y el círculo de las iniciales cambian sin recargar. |
| 24 | "Reemplazar logo" (images.jpg, elegida por Rocío) y Guardar | Cambia el menú, no los PDF | OK | El menú muestra la imagen nueva; el ícono de la pestaña sigue siendo `sgtl-icono.png`; FAC-00000008 sigue con el logo de la empresa. |
| 25 | "Restablecer valores por defecto" | Confirmación con el texto de la empresa; vuelve a la marca SGTL; los PDF siguen con el logo de la empresa | OK | "¿Restablecer los valores por defecto?" / "El logo, el fondo, el menú y el pie vuelven a los de SGTL. Los datos y el logo de la empresa (Gestionar empresa) no cambian." / Cancelar · Restablecer. Toast "Valores por defecto restablecidos.". El presupuesto #1 sigue con el logo de la empresa. |
| 26 | Apariencia al final | Como al empezar | OK | Quedó como al empezar, pero mi restablecer pisó un cambio de Facu. A pedido de Rocío, al final volví a cargar los valores de Facu (ver "Apariencia al final"). |
| 27 | Auditoría, entidad EMPRESA | Filas con el antes y el después de lo que cambió, con el logo resumido | OK | 5 filas: Modificación Empresa_ID=1 y Alta de las 2 a la 5. Solo los campos que cambiaron; el logo, como "[logo image/png;base64, 104430 caracteres]". |
| 28 | Reclamo de Rukas | "no corresponde a ninguno de nuestros viajes" | OK | Borrador Rukas 990100 (Proforma_ID 42, QUICKFOOD), transporte 990099 "Sin viaje relacionado". En "Registrar reclamo", al marcarlo: "Transporte 990099: no corresponde a ninguno de nuestros viajes.". Cancelé sin guardar. |
| 29 | Consola y red | Sin errores propios de la §30 | OK | Solo: 404 de `api/DashboardLayout` (Dashboard, de antes), y el 401 y el 400 del envío por e-mail (F1 y F2). |

NO PROBADO también: la factura, el recibo y el presupuesto **sin** logo. No hay ninguno emitido hoy y lo emitido antes sigue con la versión 1, que tiene logo. La proforma sin logo sí se vio.

## Fallas (una sección por falla, la más grave primero)

### F1 — En la VM no se puede enviar un presupuesto por e-mail: la API no lee la contraseña SMTP
- Gravedad: Media. Bloquea el envío en la VM; se arreglaría volviendo a guardar la contraseña desde la VM. No es de la §30.
- Dónde: Gestionar presupuestos → Ver PDF → Enviar por e-mail; `POST api/Presupuestos/1/email` → 400.
- Pasos para reproducir:
  1. Ver PDF del presupuesto #1.
  2. Enviar por e-mail.
  3. Escribir administracion@example.com.
  4. Enviar.
- Esperado: "Presupuesto enviado a administracion@example.com.".
- Obtenido: dentro del modal, "No se pudo leer la contraseña del perfil SMTP. Volvé a guardarla en Configuración > Gestionar e-mail.". No salió ningún correo.
- Consola / red: `POST http://localhost:50222/api/Presupuestos/1/email` → 400 con ese texto.
- Causa probable: `EnviosPresupuestosController.cs:78` descifra la contraseña con `MachineKey.Unprotect`, y `Web.config` no tiene `<machineKey>`. La clave la genera cada máquina, así que una contraseña guardada desde la API de otra PC no se puede leer en la VM. Cifran y descifran igual `EnviosComprobantesController.cs:524` y `EmailServidorController.cs:503/511`: es probable que tampoco salgan en la VM los e-mails de facturas y recibos (no lo probé). Dos salidas: volver a guardar la contraseña desde la VM (sirve solo para la VM), o fijar un `<machineKey>` común para todo el equipo (es un secreto más en `Web.config`). Sin corregir.

### F2 — Con la sesión vencida, el envío avisa dentro del modal pero no lleva al login
- Gravedad: Baja.
- Dónde: Gestionar presupuestos → Enviar por e-mail; `POST api/Presupuestos/1/email` → 401.
- Pasos para reproducir:
  1. Dejar pasar los 30 minutos de la sesión.
  2. Abrir Enviar por e-mail.
  3. Enviar.
- Esperado (§9): "Tu sesión venció. Volvé a iniciar sesión." y llevar al login.
- Obtenido: el texto correcto dentro del modal, sin ir al login.
- Consola / red: 401 `{"error":"Tu sesión venció. Volvé a iniciar sesión."}`.
- Causa probable: `presupuestos.js:387-391` muestra cualquier error en `envioPresupuestoFeedback`, sin tratar el 401 aparte. Puede pasar en otras pantallas que llaman a la API con token. Sin corregir.

## Mejoras sugeridas
- **Proforma con logo:** el nombre comercial va chico, como un renglón más debajo del logo (`proforma-pdf.js:68`). En la factura, en cambio, va en grande al lado del logo. La decisión dice "El nombre comercial, si está, va en grande y la razón social debajo". Conviene compararlo con `.claude/maquetas/pdf-empresa/` (en la VM no está).
- **Auditoría de EMPRESA:** muestra ids (`Cond_Fiscal "1"`, `ProvID "5"`, `LocID` con su número). Se entendería más con "Responsable inscripto", "Córdoba" y el nombre de la localidad.
- **Provincias:** la lista trae 23 y falta la Ciudad Autónoma de Buenos Aires. Es la tabla PROVINCIAS, la misma de clientes. Una empresa con domicilio en CABA no se podría cargar.
- **Enviar por e-mail:** el destinatario viene cargado con el e-mail del cliente. Está bien para el uso real, pero en las pruebas hay que borrarlo cada vez.
- **Redirigir a quien no es admin:** antes de llegar a Listar choferes pasa por el Dashboard, que llega a disparar unas 12 consultas a la API.
- **PDF de la factura y el recibo:** "SIN VALIDEZ FISCAL" se sale apenas del recuadro de la "I", y el receptor dice "Condición fiscal:Responsable Inscripto" (falta el espacio y lleva mayúscula, §9). Es de antes de la §30.
- **Gestionar empresa:** el PUT tardó más de 3 segundos en algunos guardados. No molesta, porque el botón muestra "Guardando…".

## Versiones de EMPRESA que se crearon
Todas las guardó RNUVOLI el 23/10/2026. La versión 1 la completó Rocío en el paso 3; las demás, la sesión de la VM.

| Empresa_ID | Vigente desde | Guardada | Qué cambió | Quién |
|---|---|---|---|---|
| 1 | 01/01/2000 | 12:57:34 | Primera carga: los datos reales de la empresa (razón social, nombre comercial "Transporte Sánchez", CUIT, Responsable inscripto, domicilio en Córdoba) y el logo PNG (104.430 caracteres). Sin teléfono ni e-mail. Completó la fila del script (UPDATE), no agregó otra. | Rocío (paso 3) |
| 2 | 23/10/2026 | 13:10:54 | E-mail: vacío → administracion@example.com | VM (paso 5) |
| 3 | 23/10/2026 | 13:13:28 | E-mail: administracion@example.com → vacío | VM (paso 5, dejarlo como estaba) |
| 4 | 23/10/2026 | 13:14:13 | Logo: el de Rocío → sin logo | VM (paso 6) |
| 5 | 23/10/2026 | 13:15:31 | Logo: sin logo → el de Rocío, idéntico | VM (paso 6, dejarlo como estaba) |

**Cómo quedó:** la versión 5 (actual) es igual a lo que cargó Rocío. Los documentos de antes del 23/10 usan la versión 1, que tiene los mismos datos. Los de hoy y los borradores usan la 5, que da el mismo resultado.

## Apariencia al final (Gestionar contenido)
- **Antes de tocar nada:** logo `./assets/static/images/logo/sgtl-logo.png` (el de SGTL), fondo `#e4eef8`, menú `#435ebe`, pie "SGTL | un producto de Integra Analistas ®". Última modificación: RNUVOLI, 20/10 13:40. **No estaba en los valores de SGTL**, porque el fondo por defecto es `#435ebe`: por eso al final la cargué a mano.
- **Lo que guardé** (horas de acá; Auditoría las muestra en UTC, +3):
  - 13:16:24, menú `#198754`.
  - 13:22:39, logo `images.jpg`.
  - 13:23:30, Restablecer: todo SGTL, fondo `#435ebe`.
  - 13:23:55, fondo `#e4eef8`.
- **Cómo quedó:** logo de SGTL, fondo `#e4eef8`, menú `#435ebe`, pie "SGTL | un producto de Integra Analistas ®", igual que al empezar. Solo cambió la última modificación (RNUVOLI, 23/10 13:23).
- **Ojo, cambio de Facu pisado:** según Auditoría, FGODOY inició sesión a las 13:19:47 y a las **13:22:57** guardó la apariencia, entre mi "Reemplazar logo" y mi "Restablecer". Cambió:
  - Fondo: `#e4eef8` → `#6d8cab`.
  - Menú: `#198754` → `#2f89c1`.
  - Logo: mi `images.jpg` → el de SGTL.

  Medio minuto después, mi Restablecer y mi Guardar la dejaron como estaba antes de la prueba y pisaron esos colores.
- **Estado final, por pedido de Rocío:** a las **13:38:59** volví a cargar lo que había guardado Facu: logo de SGTL (`./assets/static/images/logo/sgtl-logo.png`), fondo `#6d8cab`, menú `#2f89c1` y el pie "SGTL | un producto de Integra Analistas ®", que Facu no había cambiado. Antes revisé que nadie hubiera tocado la apariencia después de mi guardado de las 13:23:55. Última modificación: RNUVOLI, 23/10 13:38.

## Datos de prueba creados o modificados
| Pantalla | Tabla | ID | Nombre que se le puso | Qué se hizo |
|---|---|---|---|---|
| Gestionar empresa | EMPRESA | 2, 3, 4, 5 | — (e-mail administracion@example.com en la 2) | Versiones agregadas en los pasos 5 y 6; la 5 deja todo como lo cargó Rocío. |
| Gestionar empresa | AUDITORIA | — | Entidad EMPRESA, Empresa_ID=2 a 5 | Las altas de esas versiones (historial, no se limpia). |
| Gestionar contenido | GESTION_CONTENIDO | 1 | — | Cinco guardados (ver arriba). Quedó con lo que había guardado Facu a las 13:22:57: fondo `#6d8cab`, menú `#2f89c1`, logo de SGTL. |
| Gestionar proformas | (control de ProformasPlataforma) | Proforma_ID 42 (Rukas 990100) | — | Abrirla para editar la vuelve a controlar sola (`POST …/42/Controlar`). No se guardó el borrador ni un reclamo. |
| — | — | — | — | No se envió ningún correo, no se emitió ni se generó ningún documento y no se cambiaron permisos. |

## SQL de limpieza propuesto (NO ejecutado)
Es opcional: la §30 dice que las versiones de más "no molestan". Si querés sacar las versiones intermedias 2 a 4, la 5 queda igual a la 1:
```sql
BEGIN TRAN;
DELETE FROM dbo.EMPRESA
WHERE Usu_Modi = 'RNUVOLI' AND Vigente_Desde = '2026-10-23'
  AND (   (Empresa_ID = 2 AND Email = 'administracion@example.com')
       OR (Empresa_ID = 3 AND Email IS NULL AND Logo IS NOT NULL)
       OR (Empresa_ID = 4 AND Logo IS NULL));
SELECT @@ROWCOUNT; -- tiene que dar 3
SELECT Empresa_ID, Vigente_Desde, Email, LEN(Logo) AS LargoLogo, Fecha_Modi FROM dbo.EMPRESA ORDER BY Empresa_ID;
-- COMMIT; o ROLLBACK;
```
