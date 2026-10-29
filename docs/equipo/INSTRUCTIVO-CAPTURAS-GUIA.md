# Instructivo: capturas para la guía del sistema (para la VM)

Para la sesión de Claude Code que trabaja en la VM. Son las capturas de la **guía del sistema**, una página para el
equipo y para la presentación con el profe, con lo clave de cada módulo. La guía ya tiene marcado el lugar de cada
captura con el mismo nombre de archivo que usa este instructivo.

Valen las reglas y el formato del reporte de `docs/equipo/PRUEBAS-VM-CLAUDE.md`. Esta ronda es **solo mirar y
capturar**: no se guarda nada.

---

## 1. Cuándo

**Después de dejar acomodada la base** (puntos 1 y 3 de la §64 de `docs/PENDIENTES-SISTEMA.md`): la sigla FC de vuelta
en su lugar y los datos de prueba limpios. Si al abrir una pantalla ves datos con marcas de prueba ("PRUEBA", "test",
nombres sin sentido), no la captures: anotala en el reporte y seguí con la próxima.

## 2. Reglas de esta ronda

- **No se guarda nada.** En los modales se completan los campos solo cuando la captura lo pide y se cierran con
  **Cancelar**. Nunca Guardar, Generar, Emitir, Registrar, Aceptar, Anular ni Eliminar.
- **Nada que mande mensajes:** no se reenvía WhatsApp, no se envía por e-mail y no se confirma un cambio de estado ni
  de chofer.
- **No se abre Gestionar integración de WhatsApp:** muestra el token de Meta.
- **Datos personales:** que no se vean DNI, teléfonos ni e-mails de choferes o de clientes reales. Si aparecen, elegí
  otra fila o recortá la captura. No captures Listar choferes ni Listar usuarios.
- El login lo hace Rocío. La captura del login se saca **antes** de escribir el usuario y la contraseña.
- Si una pantalla no tiene los datos que pide la captura (por ejemplo, ningún viaje En viaje), no los generes: usá lo
  que haya que muestre lo mismo, o dejala sin sacar, y anotalo en el reporte.

## 3. Preparación

1. `docs/equipo/PRUEBAS-VM-CLAUDE.md` §2: rama y commit, API y Five Server en el puerto 5502.
2. Navegador integrado con la ventana en **1440 × 900** y zoom al 100 %. Ctrl+F5 al entrar a cada pantalla.
3. Rocío entra con un usuario **admin**.
4. Carpeta: `C:\pruebas-sgtl\capturas-guia\` (creala si no existe). Formato PNG.
5. Captura solo el área de la página, sin la barra de Windows. Si se ve la marca de agua "Activar Windows", recortala.
6. Los datos de la demo son los de `docs/equipo/INSTRUCTIVO-DEMO-FACTURACION.md`: **Alimentos La Serena S.A.** (circuito
   completo: proforma, factura y recibo), **Servicios Ambientales S.A.** (proforma aceptada sin comprobante) y
   **QUICKFOOD S.A.** (proforma de Rukas con factura y nota de crédito). Los números pueden haber cambiado con la
   limpieza: buscalos por cliente.

## 4. Las capturas

El nombre del archivo tiene que ser exactamente el de la tabla: la guía las busca por ese nombre.

| Archivo | Pantalla | Cómo dejarla | Qué tiene que verse |
|---|---|---|---|
| `01-login.png` | Login | Antes de que Rocío entre, con los campos vacíos | El panel con el logo, usuario, contraseña y "Olvidé mi contraseña" |
| `02-grupos-y-permisos.png` | Usuarios → Gestionar grupos y permisos | Los permisos de un grupo con varios tildados (no Administradores ni uno de prueba). No tocar "Guardar permisos" | Los permisos agrupados por sección, con el texto del menú |
| `03-auditoria.png` | Auditoría | Rango de la última semana, sin otros filtros | Filas de Alta, Modificación, Baja e Inicio de sesión con sus etiquetas de color |
| `04-gestionar-tarifas.png` | Viajes → Gestionar tarifas | La tabla vigente, con sus precios a la vista. Si tiene Ver detalle, abrirlo; no Editar | Las bandas de km por tipo de camión y año del modelo |
| `05-gestionar-viajes.png` | Viajes → Gestionar viajes | Sin filtros o con el mes actual. Un globito abierto (el ícono al lado de un estado) | Viajes en varios estados: Registrado, En viaje, Entregado, Listo para facturar, Facturado y, si hay, Cancelado |
| `06-registrar-viaje.png` | Gestionar viajes → Registrar viaje | Alimentos La Serena S.A., un origen y un destino suyos, un día hábil próximo, un camión y un chofer libres. Esperar a que calcule. **Cancelar** | Los km, la tarifa calculada y la línea del primer o segundo viaje del día |
| `07-cambiar-estado-viaje.png` | Gestionar viajes → Cambiar estado (banderita) | Un viaje En viaje de un cliente directo; tocar la tarjeta Entregado para que se vean sus campos. **Cancelar.** Si no hay ninguno En viaje, uno Registrado | Las tarjetas con los estados posibles y los datos de la entrega |
| `08-detalle-viaje.png` | Gestionar viajes → Ver detalle (ojo) | Un viaje Entregado o Facturado de Alimentos La Serena S.A. Si no entra en una captura, una segunda: `08b-detalle-viaje.png` | Recorrido completo desde el galpón, tarifa, costo estimado y gastos |
| `09-hoja-de-ruta.png` | Hojas de ruta, como chofer | Rocío entra con el usuario del chofer de la demo en una ventana aparte, de **390 × 844** (celular). **No tocar** Iniciar, Registrar entrega ni Cargar gasto | "Hoy y próximos" con al menos un viaje: cliente, mapa y botones. Si no tiene viajes, anotalo |
| `10-gestionar-presupuestos.png` | Viajes → Gestionar presupuestos | Sin filtros | Presupuestos Pendiente, Aceptado y Rechazado; si hay, uno con la etiqueta "Viaje #N" |
| `11-gestionar-proformas.png` | Facturación → Gestionar proformas | Sin filtros | Las proformas de la demo en sus estados (aceptada, facturada y, si hay, un borrador) |
| `12-proforma-rukas-control.png` | Gestionar proformas → Ver detalle de la proforma de QUICKFOOD S.A. | Si hay un borrador de Rukas con diferencias, mejor ese (Ver detalle, sin Generar) | Las líneas del control con su resultado y el adicional |
| `13-emitir-comprobante.png` | Gestionar proformas → Emitir comprobante | La proforma aceptada de Servicios Ambientales S.A. **Cancelar, no Emitir** | El tipo propuesto (FC), letra, sucursal, próximo número y total |
| `14-cuenta-corriente.png` | Facturación → Gestionar cuenta corriente | Filtrada por QUICKFOOD S.A. | La factura, la nota de crédito, sus estados y el saldo |
| `15-registrar-recibo.png` | Gestionar cuenta corriente → Registrar recibo | QUICKFOOD S.A.; tildar la factura pendiente. **Cancelar, no Emitir recibo** | La distribución: Aplicar, el total aplicado y la Diferencia |
| `16-pdf-factura.png` | Gestionar cuenta corriente → Ver PDF | La factura de Alimentos La Serena S.A. Cerrar sin descargar ni enviar | La vista previa con el logo y los datos de la empresa |
| `18-dashboard.png` | Dashboard | Período del mes actual. No tocar Personalizar | Las tarjetas favoritas y los avisos |
| `19-tableros.png` | Tableros | La pestaña Facturación (o Viajes) con un mapa de calor a la vista. No tocar las estrellas | Un mapa de calor y algunas tarjetas |

La `17-whatsapp-chofer.png` no la saca la VM: es opcional y la saca Rocío desde su celular (el último mensaje de la
hoja de ruta que le llegó al chofer de la demo).

## 5. Al terminar

1. Reporte en `C:\pruebas-sgtl\reportes\AAAA-MM-DD-capturas-guia.md`, con el formato de `docs/equipo/PRUEBAS-VM-CLAUDE.md`:
   una fila por captura (OK, no se pudo y por qué, o qué datos se ven) y lo raro que hayas visto en el camino. Mostralo
   completo en el chat.
2. Rocío copia la carpeta `C:\pruebas-sgtl\capturas-guia\` a la Mac, en `.pruebas-locales/capturas-guia/` (git no la
   ve), y le avisa a la sesión de la Mac para que las sume a la guía. Antes de publicarlas, se revisan una por una.
3. Las capturas no van al repo.
