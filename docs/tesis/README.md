# Borrador de la tesis (documentación del proyecto)

Borrador del documento de la tecnicatura, armado el 20/10/2026 con la estructura del documento de
ejemplo (RebootIT, v3.0). Cuando esté revisado, el texto se pasa al Word con el membrete Cervantes
(base: `Trabajo Integrador Sistemas V1.5.docx`, en el Drive del equipo).

**Fuente de verdad:** el código de la rama `rocionuvoli` (igual a `main`) al 19/10/2026. Lo de la
empresa sale de la V1.5 (2024); los sprints 2023 del TP de Sistemas IV; los de 2024–2026 se
reconstruyeron del historial de git.

## Partes

| Archivo | Contenido | Estado |
|---|---|---|
| `docs/tesis/01-analisis-organizacional.md` | Historial de revisión, introducción, qué se toma de la V1.5, secciones nuevas (ambiente, procesos, problemas, requerimientos) | Borrador |
| `docs/tesis/02-anteproyecto.md` | Descripción, objetivos, impulsos, necesidades, oportunidades, alcances, límites, evolutivos, factibilidad, propuesta | Borrador |
| `docs/tesis/03-metodologia-y-sprints.md` | Propuesta metodológica, Sprint 0, backlog, velocidad, sprints 1 a 24 | Borrador |
| `docs/tesis/04-arquitectura-y-diseno.md` | Actores, arquitectura, despliegue, ambiente, estados, DER | Borrador |
| `docs/tesis/05-pruebas-e-implementacion.md` | Prueba del sistema (30 casos con resultados reales) e implementación | Borrador |
| `docs/tesis/06-fuentes-bibliografia-anexos.md` | Fuentes, bibliografía, actas y correcciones pendientes | Borrador |

## Para confirmar antes de pasar al Word

Resuelto el 20/10: los commits de "Agus" (julio 2026) son de Rocío; la empresa sigue con un solo
camión y el mismo personal; la mayoría de los clientes son directos y Marfrig/Rukas son los menos;
Claudia Sánchez cubre lo administrativo; roles 2024–2026: Product Owner Mariel Ferrando, Scrum Master Facundo Godoy, analista funcional Claudia Sánchez, desarrollo Rocío, Fede y Facu, testing Rocío y Claudia; la competencia se describe por tipo (no se encontraron
nombres en fuentes públicas).

También resuelto: las pausas no llevan motivo; los sprints 21 y 24 quedan como sprints intensivos de
dos semanas; producción en Azure App Service (publicada desde Visual Studio); factibilidad
económica en términos cualitativos; testers Rocío y Claudia alternando casos; CP29 aprobado
(confirmado por Fede); CP28 con la consulta del 17/10 y CP31 (recibo) con las pruebas de Facu.

Pendiente:

1. **Detalles menores:** si los cinco grupos del sistema coinciden con los actores (parte 4); el orden
   del backlog pendiente (parte 3) y quién de la empresa es el administrador del sistema (parte 5).
   Resuelto el 28/10: un presupuesto aceptado o rechazado vuelve a Pendiente mientras no generó el viaje;
   la revisión del Sprint 24 tiene las mejoras acordadas en la tutoría del 20/10 (reenvío de WhatsApp,
   recupero de contraseña por correo y seguir con las pruebas).
2. **Puntos de las historias nuevas (HU54 a HU73):** revisarlos con el equipo; de ellos salen los totales
   de los sprints 24 y 25, la tabla de velocidad y el gráfico.

## Word (versión principal)

`docs/tesis/SGTL-Documentacion-Transporte-Sanchez.docx` es el documento final de la tesis, con el
membrete de Cervantes, las imágenes de la V1.5 y las correcciones hechas a mano. Al lado está su PDF.

- **Los cambios se hacen en el Word**, no en los `.md`. Los `.md` quedan como borrador de origen y
  referencia (el Word se generó desde ellos el 20/10/2026, pero después se editó a mano: regenerarlo
  pisaría esas ediciones).
- **Versión 2.1 (28/10/2026):** el Word cuenta todo lo incorporado hasta el 28/10 (cierre del Sprint 24,
  Sprint 25 en curso, requerimientos RF01 a RF38, diagramas de estados y DER nuevos, rondas de prueba
  posteriores y defectos D09 y D10). Los `.md` quedaron en la 2.0: no se actualizaron.
- Los diagramas se dibujan con Mermaid. Si se cambia uno, reemplazar la imagen en el Word y revisar que
  el título siga en la misma página que el diagrama.
- Quien lo cambie: abrirlo, actualizar la tabla de contenido (clic derecho → Actualizar campo →
  Actualizar toda la tabla), guardarlo, exportar el PDF (Archivo → Guardar como → PDF) y commitear
  los dos archivos juntos (`Docs: …`).
- Word no se puede fusionar: antes de editarlo, hacer `git pull` y avisar al equipo, para que no lo
  cambien dos personas a la vez.
