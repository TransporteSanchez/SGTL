/*
   Viajes superpuestos (28/10/2026, Rocío): SOLO LECTURA, no cambia nada.

   Lista los pares de viajes con el mismo camión o el mismo chofer en horarios que se pisan, con la misma regla que usa la
   API para "Camión ocupado" y "Chofer ocupado" (Viajes/Ocupacion.cs, §43 de docs/PENDIENTES-SISTEMA.md): el inicio de uno
   antes del fin del otro y el fin después del inicio, sin contar los cancelados. Los que aparecen se cargaron antes de
   ese control: al editarlos, la pantalla da el error de ocupado. Se corrigen con la limpieza de datos (§41, punto 21).

   Cómo correrlo: SSMS, base Transporte_Sanchez, tal cual.
*/
SET NOCOUNT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54920, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

SELECT N'Camión' AS Que, a.CamionID AS Recurso_ID, a.Viaje_ID AS Viaje, b.Viaje_ID AS Choca_con,
       a.Fecha_Inicio AS Inicio, a.Fecha_Fin AS Fin, b.Fecha_Inicio AS Inicio_otro, b.Fecha_Fin AS Fin_otro,
       ISNULL(a.Estado, N'Registrado') AS Estado, ISNULL(b.Estado, N'Registrado') AS Estado_otro
FROM dbo.VIAJES a
JOIN dbo.VIAJES b ON b.CamionID = a.CamionID AND b.Viaje_ID > a.Viaje_ID
     AND b.Fecha_Inicio < a.Fecha_Fin AND b.Fecha_Fin > a.Fecha_Inicio
WHERE a.CamionID > 0 AND ISNULL(a.Estado, N'') <> N'Cancelado' AND ISNULL(b.Estado, N'') <> N'Cancelado'
UNION ALL
SELECT N'Chofer', a.ChoferID, a.Viaje_ID, b.Viaje_ID,
       a.Fecha_Inicio, a.Fecha_Fin, b.Fecha_Inicio, b.Fecha_Fin,
       ISNULL(a.Estado, N'Registrado'), ISNULL(b.Estado, N'Registrado')
FROM dbo.VIAJES a
JOIN dbo.VIAJES b ON b.ChoferID = a.ChoferID AND b.Viaje_ID > a.Viaje_ID
     AND b.Fecha_Inicio < a.Fecha_Fin AND b.Fecha_Fin > a.Fecha_Inicio
WHERE a.ChoferID > 0 AND ISNULL(a.Estado, N'') <> N'Cancelado' AND ISNULL(b.Estado, N'') <> N'Cancelado'
ORDER BY Inicio;
