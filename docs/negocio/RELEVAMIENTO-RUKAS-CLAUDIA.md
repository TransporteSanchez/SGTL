# Relevamiento operativo: Marfrig + Rukas → SGTL

**Para:** Claudia  
**De:** equipo SGTL / tesis Transporte Sanchez  

---

## Para qué pedimos tu ayuda

Estamos armando SGTL (sistema interno de Transporte Sanchez). Necesitamos confirmar **cómo trabajan hoy con Marfrig y Rukas**, para dos cosas:

1. **Ahora:** integrar ese proceso en SGTL (espejo manual, sin API) y llegar bien a la proforma.
2. **A futuro:** poder gestionar en SGTL viajes de clientes que no usan Rukas, y en la tesis explicar el valor del sistema.

Abajo está el **paso a paso que nosotros creemos** que hacen. En cada paso pedimos que marques si es correcto y completes lo que falte. No hace falta responder todo de una.

Cómo marcar: **Sí** / **No** / **Parcial** + un comentario si hace falta.

---

## Roles (visión nuestra)

- **Marfrig:** planifica la carga, entrega el remito en papel, registra ingreso/salida de planta, valida tarifas/adicionales/documentos, recibe el sobre físico.
- **Rukas:** tablero compartido (chofer/unidad, seguimiento, novedades WhatsApp o mesa, escaneos, sobres, conformidad de tarifa y adicionales). No genera el remito.
- **Transporte Sanchez:** ejecuta el viaje, carga en Rukas lo que pide el cliente, y arma la proforma/facturación interna en SGTL (no en Rukas).

¿Esta división te cierra?  
[ ] Sí    [ ] No    [ ] Parcial  
Comentario: ________________________________

¿La proforma/factura de Transporte Sanchez la arman en SGTL (u otro lado interno), o también en Rukas?  
[ ] Solo SGTL / interno  
[ ] Solo Rukas / Marfrig  
[ ] Ambos — detalle: ________________________________

---

# Flujo que creemos que hacen (Marfrig + Rukas)

---

## PASO 1 — Marfrig planifica y asigna la carga

**Qué creemos que pasa**  
Marfrig arma la planificación de carga y asigna el viaje/transporte a Transporte Sanchez.

**Quién**  
Marfrig.

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  
¿Cómo se enteran ustedes de esa asignación? (mail, Rukas, teléfono, otro)  
________________________________

---

## PASO 2 — Aviso para cargar chofer y unidad en Rukas

**Qué creemos que pasa**  
Llega un mail o aviso del estilo “Transportes planeados” pidiendo ingresar a Rukas y cargar chofer y unidad del viaje.

**Quién**  
Marfrig avisa → ustedes cargan en Rukas.

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  
¿Siempre llega mail, o a veces solo lo ven en Rukas?  
________________________________

---

## PASO 3 — Asignación de chofer y unidad (Rukas · Control Tráfico · Planeado)

**Qué creemos que pasa**  
En Rukas → Control Tráfico → estado **Planeado**, completan o confirman chofer y unidad (si Marfrig no lo dejó completo).

**Quién**  
Transporte Sanchez (mesa), a veces datos ya puestos por Marfrig.

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  
¿Quién asigna el chofer en la práctica: ustedes, Marfrig, o depende?  
________________________________

---

## PASO 4 — Ingreso a planta (pasa a Ingresado)

**Qué creemos que pasa**  
Cuando la unidad entra al centro de carga, el viaje pasa a **Ingresado**. Eso lo registra la operación de planta / Marfrig; ustedes no tienen un botón libre “poner Ingresado”.

**Quién**  
Marfrig / planta.

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  
¿Ustedes hacen algo en Rukas en este momento, o solo esperan?  
________________________________

---

## PASO 5 — Carga, documentación y Despachado

**Qué creemos que pasa**  
Se carga el camión. En planta les entregan la **documentación en papel** (remito / manifiesto). Cuando ya está cargado y figura el n° de transporte SAP, el viaje aparece como **Despachados** (esperando salida).

**Quién**  
Marfrig / planta entrega papeles y mueve el estado; ustedes reciben el remito físico.

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  

¿Quién genera / imprime el remito? (Marfrig, SAP, otro, no lo saben)  
________________________________

¿En ese momento anotan el n° de remito en algún lado? (solo Rukas / Excel / papel / SGTL / no)  
________________________________

---

## PASO 6 — Salida de planta (= “en viaje” / Salidos)

**Qué creemos que pasa**  
Cuando Marfrig registra la **salida** de la unidad, el viaje pasa a **Salidos**. Eso significa que ya está en viaje a destino. Ustedes **no** tienen un botón propio “marcar en viaje”: lo dispara la salida de Marfrig.

**Quién**  
Marfrig (F. Salida).

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  
¿Mirás Rukas varias veces al día para ver Salidos, o recién cuando hay que rendir?  
________________________________

---

## PASO 7 — Entrega en destino y firma del remito

**Qué creemos que pasa**  
El chofer entrega en el punto de destino. El cliente **firma / sella** el remito. Ahí recién existe el remito “conformado” que importa para el resto del flujo.

**Quién**  
Chofer + cliente destino.

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  
¿Pasa algo distinto si hay rechazo parcial o total? (contalo breve)  
________________________________

---

## PASO 8 — Aviso de entrega (novedad) — dos caminos

### Camino A — WhatsApp del chofer (preferido según la docu)

**Qué creemos que pasa**  
El chofer manda al bot de Rukas una **foto del remito firmado**. El bot pide confirmar el **# de entrega** (no el n° de remito) y si fue Completa / Parcial / Rechazo. Puede pedir nota o fotos extra. Queda una prenovedad en Rukas.

**Quién**  
Chofer + bot Rukas.

### Camino B — Mesa en Control Tráfico (si el chofer no avisó)

**Qué creemos que pasa**  
Mesa entra a Control Tráfico → **Salidos**, carga la novedad: fecha ARE + subir remito escaneado + guardar. Si llegó tarde, pide motivo.

**Quién**  
Mesa de Transporte Sanchez.

**Confirmación**  
¿Los dos caminos son así? [ ] Sí  [ ] No  [ ] Parcial  

En la práctica, ¿qué usan más?  
[ ] Casi siempre WhatsApp  
[ ] Mitad y mitad  
[ ] Casi siempre mesa  
[ ] Otro: ________________________________

¿Con la novedad el punto de entrega cambia de color en Rukas (gris → amarillo, etc.)?  
[ ] Sí  [ ] No  [ ] No me fijo / no sé  

---

## PASO 9 — Cierre de Reparto: revisar entregas y documentos

**Qué creemos que pasa**  
Entran a **Cierre de Reparto**. Revisan cada entrega/documento: fecha en el cliente, si fue completa o con devolución y motivo. Pueden corregir si la prenovedad venía mal.

**Quién**  
Mesa / quien rinde en Transporte Sanchez.

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  
¿Quién hace normalmente este cierre en la empresa?  
________________________________

---

## PASO 10 — Adjuntar escaneo del remito

**Qué creemos que pasa**  
Hay que **adjuntar el escaneo** del remito/factura conformada. Según la capacitación, es **requerido para avanzar**.

**Quién**  
Transporte Sanchez en Rukas.

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  
¿Siempre suben el escaneo, o a veces alcanza con la foto de WhatsApp?  
________________________________

---

## PASO 11 — Sobre lógico y despacho físico a Marfrig

**Qué creemos que pasa**  
Meten los documentos en un **sobre** lógico en Rukas (equivale al sobre físico). Cuando lo envían a Marfrig, **cierran y despachan** el sobre en el sistema. Eso puede ir en paralelo a adicionales y tarifa.

**Quién**  
Transporte Sanchez arma y manda; Marfrig recibe.

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  
¿Cada cuánto mandan sobres? ¿Quién los lleva/envía?  
________________________________

---

## PASO 12 — Adicionales y conformidad de tarifa

**Qué creemos que pasa**  
En paralelo pueden cargar **adicionales** (peaje, peón, etc.), disparar aprobación de Marfrig, reclamar o dar conformidad. También validan la **tarifa del viaje ($)** y dan conformidad o reclamo. Cuando está todo en orden, el viaje pasa a **Cerrados**; Marfrig puede pasarlo a **Controlados** al validar.

**Quién**  
Transporte Sanchez carga/confirma; Marfrig aprueba/controla.

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  
¿Qué tan seguido usan adicionales y reclamos de tarifa?  
[ ] Siempre  [ ] A veces  [ ] Casi nunca  

---

## PASO 13 — Después: liquidación Marfrig vs proforma interna

**Qué creemos que pasa**  
- En **Rukas/Marfrig:** conformidad de tarifa/adicionales y su proceso de liquidación/pago hacia ustedes.  
- En **SGTL (o interno):** arman la **proforma/factura** de Transporte Sanchez. Rukas no genera esa proforma.

**Confirmación**  
¿Es así? [ ] Sí  [ ] No  [ ] Parcial  

Hoy, para armar la proforma interna, ¿qué datos mirás o copiás desde Rukas?  
(remito, fechas, km, tarifa, chofer, n° entrega, otro)  
________________________________

¿Hay algo que hoy anotes en Excel / WhatsApp / papel porque Rukas o SGTL no te lo resuelven?  
________________________________

---

# Cómo pensamos usar esto en SGTL (corto plazo)

Sin API: alguien mira Rukas (o el papel) y carga en SGTL el espejo útil para facturar.

Datos que pensamos pedir en SGTL — ¿te servirían?

| Dato | ¿Lo usarías? |
|------|----------------|
| Número de remito | [ ] Sí [ ] No [ ] A veces |
| N° de entrega Rukas (hoy “n° de carga”) | [ ] Sí [ ] No [ ] A veces |
| Cliente, origen, destino, chofer, camión, km, tarifa | [ ] Sí [ ] No |
| Estado: Registrado → Listo para facturar → Facturado | [ ] Sí [ ] No [ ] Otro |
| Resultado entrega (completa/parcial/rechazo) | [ ] Sí [ ] No [ ] Más adelante |
| Foto del remito en SGTL (además de Rukas) | [ ] Sí [ ] No [ ] Más adelante |

¿En qué momento cargarías el viaje en SGTL?  
[ ] Cuando está planeado / asignado chofer  
[ ] Cuando sale de planta  
[ ] Cuando ya hay novedad de entrega en Rukas  
[ ] Recién cuando vas a facturar  
[ ] Otro: ________________________________

¿Te sirve ir marcando “en viaje” en SGTL, o alcanza con “listo para facturar” cuando ya entregaron?  
[ ] Quiero seguimiento en curso en SGTL  
[ ] Solo me importa lo final (listo / facturado)  
[ ] No sé / ver con el equipo  

Tres cosas que SGTL debería pedirte sí o sí para no trabar la proforma:  
1. ________________________________  
2. ________________________________  
3. ________________________________  

---

# A futuro (tesis): SGTL sin depender de Rukas

Hoy usan Rukas porque el cliente grande lo exige. A futuro queremos que Transporte Sanchez pueda gestionar en SGTL clientes **sin** plataforma intermedia (seguimiento + documentación + proforma).

¿Qué de lo que hace Rukas hoy te gustaría tener en un sistema propio? Marcá prioridad Alta / Media / Baja:

- [ ] Asignar chofer y camión — prioridad: _____  
- [ ] Ver viajes en planta / en ruta / entregados — prioridad: _____  
- [ ] Aviso de entrega con foto/evidencia — prioridad: _____  
- [ ] Resultado completa / parcial / rechazo — prioridad: _____  
- [ ] Guardar escaneo del remito — prioridad: _____  
- [ ] Emitir remito o comprobante propio — prioridad: _____  
- [ ] Adicionales (peaje, peón, demora…) — prioridad: _____  
- [ ] Control de tarifa antes de facturar — prioridad: _____  
- [ ] Paquete de documentación al cliente (tipo “sobre”) — prioridad: _____  
- [ ] WhatsApp automático tipo bot — prioridad: _____  

Para un cliente sin Rukas, ¿qué documentación mínima hay que emitir o guardar para cerrar y facturar?  
________________________________

¿Hay clientes hoy (además de Marfrig/Quickfood) que ya trabajan sin Rukas? ¿Cómo llevan esos viajes?  
________________________________

---

## Espacio libre

Cualquier cosa que falte o que siempre complique la operación:

________________________________  
________________________________  

¡Gracias! Con esto cerramos el diseño para que SGTL acompañe lo que ya hacen y abra el camino a gestionar todo desde Transporte Sanchez.
