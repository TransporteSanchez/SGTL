/* =====================================================================
   02_reclamo_por_linea.sql
   Proforma de plataforma (Rukas): el reclamo marca qué líneas se reclaman.
   Diseño: docs/diseno/proforma-rukas-diseno.md (§4, "Errores y de quién son").

   - PROFORMA_PLATAFORMA_LINEA.Reclamada: la línea está incluida en el reclamo
     pendiente en la plataforma ("Esperando a Rukas"). "Volver a controlar" no
     la toca; "Cerrar reclamo", "Generar" y "Reemplazar Excel" la dejan en 0.

   Hay que correrlo ANTES de subir la API que lo usa: el control lee todas las
   columnas de la línea.
   Idempotente: se puede correr más de una vez.

   Ejecutar en SSMS conectado a la base Transporte_Sanchez (compartida: avisar al equipo).
   ===================================================================== */

SET NOCOUNT ON;
GO

IF DB_NAME() <> N'Transporte_Sanchez'
BEGIN
    RAISERROR('Ejecutar este script en la base Transporte_Sanchez.', 16, 1);
    SET NOEXEC ON;
END
GO

IF OBJECT_ID(N'dbo.PROFORMA_PLATAFORMA_LINEA', N'U') IS NULL
BEGIN
    RAISERROR('Falta PROFORMA_PLATAFORMA_LINEA (script 01_plataformas_y_proformas.sql).', 16, 1);
    SET NOEXEC ON;
END
GO

IF COL_LENGTH('dbo.PROFORMA_PLATAFORMA_LINEA', 'Reclamada') IS NULL
    ALTER TABLE dbo.PROFORMA_PLATAFORMA_LINEA
        ADD Reclamada bit NOT NULL CONSTRAINT DF_PPL_Reclamada DEFAULT (0);
GO

/* ---------------------------------------------------------------------
   Verificación (solo lectura)
   --------------------------------------------------------------------- */
SELECT COL_LENGTH('dbo.PROFORMA_PLATAFORMA_LINEA', 'Reclamada') AS ColumnaReclamada;   -- no NULL

SELECT Reclamada, COUNT(*) AS Lineas
  FROM dbo.PROFORMA_PLATAFORMA_LINEA
 GROUP BY Reclamada;                                  -- todas en 0
GO

SET NOEXEC OFF;
GO
