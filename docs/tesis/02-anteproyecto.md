# Parte 2 — Anteproyecto

> Borrador del 20/10/2026. Reemplaza el anteproyecto de la V1.5 (2022), que describía un sistema
> pensado para una sola unidad y un solo cliente. Los alcances se escribieron **a partir del código
> subido** (rama `rocionuvoli`, igual a `main`, al 19/10/2026).

---

## Descripción general

El presente anteproyecto surge del relevamiento realizado en Transporte Sánchez, con el objetivo de
abordar los problemas detectados en el registro de los viajes, su facturación y el seguimiento de
los cobros.

Se propone el desarrollo de un sistema de información web, denominado **SGTL (Sistema de Gestión de
Transporte y Logística)**, que registre los viajes desde el pedido o el presupuesto hasta su
facturación y cobro, tanto para clientes que operan a través de una plataforma propia (como Rukas,
de Marfrig) como para clientes directos.

## Objetivo del proyecto

Desarrollar una herramienta que permita a Transporte Sánchez centralizar la gestión de sus viajes,
su facturación y su cuenta corriente con clientes, reduciendo los registros duplicados y los errores
de la carga manual, y que le dé un registro propio de toda su operación, independiente de la
plataforma de cada cliente.

## Objetivos del sistema

Diseñar un sistema de información que registre, controle y vincule los viajes, los presupuestos,
las proformas, los comprobantes y los cobros de la empresa en una sola plataforma, de modo que:

- cada viaje tenga su recorrido, su tarifa, su estado y su documentación de entrega;
- ningún viaje quede sin facturar ni se facture dos veces;
- las diferencias con la proforma del cliente se detecten antes de facturar;
- la dirección disponga de información actualizada para tomar decisiones.

## Impulsos

- La mayoría de los clientes son directos y no hay un registro propio de sus viajes: todo se lleva en
  planillas, correo y papel.
- Uno de los clientes (Marfrig) exige trabajar en su plataforma Rukas y liquida los viajes con una
  proforma que la empresa tiene que controlar antes de facturar.
- La empresa se planteó crecer (más unidades y nuevos clientes, según las metas de la V1.5), y
  atender clientes sin plataforma requiere un registro propio de los viajes.
- La facturación y el control de cobros se hacen a mano en planillas, con riesgo de errores y
  pérdidas.
- La comunicación con los choferes depende de mensajes informales.

## Necesidades

- Registrar en un solo lugar todos los viajes, con cliente, recorrido, camión, chofer y tarifa.
- Calcular la distancia y la tarifa de cada viaje sin estimaciones manuales.
- Seguir el estado de cada viaje y guardar la evidencia de la entrega.
- Controlar la proforma del cliente contra los viajes realizados y registrar los reclamos.
- Emitir proformas, facturas, notas de crédito y débito y recibos, y llevar la cuenta corriente de
  cada cliente.
- Avisar al chofer su hoja de ruta.
- Controlar quién accede a cada parte del sistema y qué cambió cada usuario.
- Disponer de indicadores para la dirección.

## Oportunidades

- El sistema es web y la base está en la nube (Azure SQL): no requiere servidor propio y se usa con
  los equipos que la empresa ya tiene.
- El diseño de "proforma de plataforma" es genérico: Rukas es la primera plataforma, y se pueden
  sumar otras con un lector nuevo del archivo que exporten.
- Contar con el registro propio de los viajes y la documentación de entrega permite ofrecer el mismo
  nivel de control a clientes directos y salir a buscar clientes nuevos.
- Cuando se integre la facturación electrónica de ARCA, la factura interna de SGTL pasa a ser la
  fiscal sin cambiar el circuito.

---

## Límites y alcances

### Alcances

#### Administración del sistema

- Ingreso con usuario y contraseña y cierre de sesión (token JWT).
- Usuarios, grupos y permisos por grupo sobre cada menú; permisos especiales para emitir y anular
  comprobantes y consultar la cuenta corriente.
- Auditoría automática de altas, bajas y modificaciones de todas las entidades, con pantalla de
  consulta y filtros.
- Personalización del logo, colores y pie de página (se usan también en los PDF).
- Manual de usuario en línea e informes de versión.

#### Flota, personal y clientes

- Camiones (dominio, marca, modelo, tipo, motor, chasis y equipo de frío) y choferes (DNI, CUIL,
  contacto y domicilio), con activación, desactivación y baja lógica.
- Clientes con CUIT, condición fiscal y domicilio, de tipo **directo** o **con plataforma**.
- Listados con filtros y exportación.

#### Recorridos y tarifas

- Orígenes y destinos con dirección y localidad del catálogo oficial (Georef), y alta rápida desde
  el viaje y el presupuesto.
- Tarifas fijas por recorrido y tarifas por kilómetro por período y rango de distancia.

#### Viajes

- Registro del viaje con ruta y distancia calculadas con Google Maps (km a mano solo si Google
  falla, con motivo auditado).
- Estados según el tipo de cliente y resultado de entrega con evidencia (foto o PDF).
- Números de referencia de la plataforma (transporte SAP, remito y número de entrega).
- Hoja de ruta del chofer: la recibe por WhatsApp y la ve en el celular con su usuario, donde inicia
  el viaje y registra la entrega con la foto o el PDF del remito.
- Reglas de edición y eliminación según el estado.

#### Presupuestos

- Presupuestos con estados Pendiente, Aceptado y Rechazado, PDF y envío por correo; generación del
  viaje desde el presupuesto aceptado.

#### Proformas y facturación

- Proforma propia: traer los viajes entregados del período, generar, aceptar y anular.
- Proforma de plataforma (Rukas): importar el Excel, control línea por línea, reclamo, reemplazo del
  Excel y generación con todo coincidente; guía de viajes sin proforma.
- Emisión de factura desde la proforma, notas de crédito y débito, anulación; PDF y envío por correo
  con historial.
- Configuración del emisor, sucursales, tipos de comprobante y numeración.

#### Cuenta corriente

- Cuenta corriente por cliente con saldos y vencimientos; recibos con formas de pago e imputación.

#### Información para la dirección

- Inicio con indicadores (camiones y choferes activos, evolución mensual de viajes, principales
  clientes, costo por viaje y calendario de viajes); exportación a PDF y Excel.

### Límites

- **No se conecta con ARCA.** La factura que emite SGTL es interna; la factura fiscal se sigue
  emitiendo en el sistema de ARCA. Es la que se carga en la plataforma del cliente.
- **No se conecta con Rukas.** El intercambio es manual: se cargan en SGTL los números de Rukas y se
  importa el Excel que Rukas exporta.
- **No se relevó cómo corrige Marfrig una proforma reclamada.** Se supone que corrige la misma
  proforma, que conserva su número, y en SGTL se reemplaza el Excel; si emitiera otra, se elimina el
  borrador y se importa la nueva. El supuesto sale de las acciones que se ven en la pantalla de Rukas.
- No hace seguimiento en tiempo real del camión ni monitoreo de temperatura de la carga.
- No gestiona el mantenimiento de las unidades, los gastos de viaje, los proveedores ni la
  liquidación de sueldos (estaban en los requerimientos de 2022 y quedan como evolutivos).
- No emite el remito: el remito es del cliente; SGTL guarda su número y su escaneo.
- Los avisos por WhatsApp son al chofer; no hay notificaciones al cliente.
- Funciona con conexión a internet.

### Evolutivos (versiones futuras)

Surgen de las pruebas y revisiones del sistema y de los requerimientos de 2022 que no entraron en esta versión.

- Integración con ARCA (factura electrónica con CAE).
- Seguridad: contraseñas guardadas con hash, token obligatorio en toda la API, cambio de contraseña
  con código por WhatsApp.
- Hora unificada en horario de Argentina en base, API y navegador.
- Reenviar la hoja de ruta por WhatsApp y avisar al chofer cuando se elimina el viaje.
- Autocompletar direcciones con Google Places y guardar coordenadas; desplegables con búsqueda.
- Mantenimiento de unidades con alertas de vencimientos (ITV, seguros, service de frío) y
  vencimientos de documentación del chofer.
- Gastos de viaje, proveedores y cuenta corriente de proveedores.
- Integración directa con plataformas de clientes (API) y otras plataformas además de Rukas.
- Seguimiento del viaje en tiempo real.

## Factibilidad

**Técnica.** La empresa cuenta con dos PC de escritorio con Windows 10 Pro, conexión a internet y
celulares de la flota corporativa (V1.5). SGTL es una aplicación web que se usa desde el navegador;
la base de datos está en Azure SQL y la API se publica en Azure App Service (directamente desde
Visual Studio, con la opción Publicar). No hace falta un servidor en la empresa: el equipamiento
actual alcanza.

**Económica.** No hace falta comprar hardware ni licencias: las herramientas de desarrollo son las que
ya usa el equipo. Los costos son mensuales y por uso: la base de datos y el alojamiento de la API en
Azure (con planes básicos de bajo costo), y las API de Google Maps y de WhatsApp Cloud, que tienen
un cupo gratuito mensual que alcanza para el volumen de viajes de una empresa con una unidad. A eso
se suma el tiempo de capacitación del personal. Los beneficios: menos tiempo en el
control de proformas y en la facturación, menos viajes sin facturar o con diferencias, y menos
errores de carga.

**Operativa.** El personal administrativo ya usa computadora, correo, planillas y la plataforma
Rukas, por lo que la adaptación es baja. El sistema mantiene la misma lógica de trabajo (viaje,
proforma, factura, cobro) y tiene manual en línea.

## Propuesta final

La implementación de SGTL le permitirá a Transporte Sánchez tener un registro propio y completo de
su operación, controlar lo que le paga cada cliente antes de facturar, ordenar su cuenta corriente
y atender clientes nuevos sin depender de la plataforma de un tercero, con información disponible
para la toma de decisiones.
