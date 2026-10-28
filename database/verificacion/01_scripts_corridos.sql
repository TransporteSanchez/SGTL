/*
   Qué scripts están corridos en la base (28/10/2026, Rocío): SOLO LECTURA, no cambia nada.

   Para saber, antes de una tanda de pruebas, si están corridos los scripts de la integración del 28/10: los de Facu
   (cuenta corriente 11 a 18, seguridad 02, e-mail 07 y documentación 02) y los nuestros del 27/10 (viajes 02 y 03, hoja de
   ruta 01 y 02). No mira una tabla de "scripts aplicados" (no existe): busca en la base lo que deja cada uno (una
   columna, una restricción, un disparador). Al sumar scripts nuevos, agregar su fila acá.

   Cómo correrlo (SSMS, base Transporte_Sanchez): ejecutar entero. Devuelve tres tablas:
     1. Un renglón por script: "Corrido", "Falta correrlo" o "A medias" (está una parte: revisar antes de seguir).
     2. Datos que ayudan a decidir: recibos con el acento mal escrito (script 18), qué manual está publicado
        (documentación 02), qué perfil manda el recupero de contraseña y cuántos usuarios tienen e-mail.
     3. Cómo están guardadas las restricciones de cuenta corriente, para revisarlas si algo da "A medias".
   Cuenta corriente 13, 14, 15 y 17 reescriben las mismas restricciones, cada uno sobre el anterior: correr solo los que
   dicen "Falta correrlo", en orden, y NUNCA volver a correr uno anterior a otro que ya está (el 13 o el 14 después del 15,
   el 15 después del 17): deja la versión vieja y deshace lo que agregó el posterior.
*/
SET NOCOUNT ON;

IF DB_NAME() <> N'Transporte_Sanchez'
    THROW 54900, 'Conectarse a la base Transporte_Sanchez antes de ejecutar.', 1;

-- Las definiciones de las restricciones que cambian de un script a otro. SQL Server las guarda reescritas (un NOT IN
-- puede quedar como NOT (... OR ...) o como <> ... AND <>): por eso se buscan los tipos que nombra cada versión
-- ('FAC', 'REC', 'ND') y no los operadores. Lo que nombra cada una:
--   CK_CC_MOV_Impacto     02: 'FAC' sin negar · 13: NOT/<> sin 'FAC' · 15: NOT/<> y 'FAC'
--   CK_CC_CP_Tipo         02: 'FAC' · 14: 'ND' sin 'FAC'
--   CK_CC_COMP_Referencia 02 y 10: sin 'REC' · 14: 'REC' sin Impacto · 15: Impacto sin 'FAC' · 17: Impacto y 'FAC'
DECLARE @MovImpacto nvarchar(max) = (SELECT definition FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.CUENTA_CORRIENTE_MOVIMIENTOS') AND name = N'CK_CC_MOV_Impacto');
DECLARE @CpTipo nvarchar(max) = (SELECT definition FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES_PROFORMAS') AND name = N'CK_CC_CP_Tipo');
DECLARE @CompReferencia nvarchar(max) = (SELECT definition FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.COMPROBANTES') AND name = N'CK_CC_COMP_Referencia');
DECLARE @CemModulo nvarchar(max) = (SELECT definition FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.CONFIGURACION_EMAIL_MODULO') AND name = N'CK_CEM_Modulo');

DECLARE @Scripts TABLE (Orden int, Script nvarchar(80), Encontrado int, Esperado int, Que_se_mira nvarchar(400));

INSERT INTO @Scripts (Orden, Script, Encontrado, Esperado, Que_se_mira)
SELECT 1, N'cuenta-corriente/11_ids_tipos_y_numeradores',
    CASE WHEN COLUMNPROPERTY(OBJECT_ID(N'dbo.TIPOS_COMPROBANTE'), N'TipoComp_ID', 'IsIdentity') = 1 THEN 1 ELSE 0 END +
    CASE WHEN COLUMNPROPERTY(OBJECT_ID(N'dbo.COMPROBANTES_NUMERADORES'), N'CompNum_ID', 'IsIdentity') = 1 THEN 1 ELSE 0 END,
    2, N'TIPOS_COMPROBANTE.TipoComp_ID y COMPROBANTES_NUMERADORES.CompNum_ID (autonumerados)'
UNION ALL SELECT 2, N'cuenta-corriente/12_tipos_por_letra',
    CASE WHEN COLUMNPROPERTY(OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE'), N'FactTipo_ID', 'IsIdentity') = 1 THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.FACTURACION_TIPOS_COMPROBANTE')
                      AND name = N'UQ_FACTURACION_TIPOS_COMPROBANTE_TipoLetra') THEN 1 ELSE 0 END,
    2, N'FACTURACION_TIPOS_COMPROBANTE.FactTipo_ID y la clave única por tipo y letra'
UNION ALL SELECT 3, N'cuenta-corriente/13_comprobantes_directos_configurables',
    CASE WHEN CHARINDEX(N'NOT', @MovImpacto) > 0 OR CHARINDEX(N'<>', @MovImpacto) > 0 THEN 1 ELSE 0 END,
    1, N'CK_CC_MOV_Impacto admite tipos de deuda que no son FAC ni ND (el 15 la vuelve a cambiar)'
UNION ALL SELECT 4, N'cuenta-corriente/14_comprobantes_desde_proforma_configurables',
    CASE WHEN CHARINDEX(N'''ND''', @CpTipo) > 0 AND CHARINDEX(N'''FAC''', @CpTipo) = 0 THEN 1 ELSE 0 END +
    CASE WHEN CHARINDEX(N'''REC''', @CompReferencia) > 0 THEN 1 ELSE 0 END,
    2, N'CK_CC_CP_Tipo admite otros tipos además de FAC y CK_CC_COMP_Referencia, referencias a otros tipos'
UNION ALL SELECT 5, N'cuenta-corriente/15_credito_interno_cancelatorio',
    CASE WHEN EXISTS (SELECT 1 FROM sys.triggers WHERE object_id = OBJECT_ID(N'dbo.TR_CC_MOV_ImpactoComprobante', N'TR') AND is_disabled = 0) THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM sys.triggers WHERE object_id = OBJECT_ID(N'dbo.TR_CC_COMP_ImpactoMovimientos', N'TR') AND is_disabled = 0) THEN 1 ELSE 0 END +
    CASE WHEN CHARINDEX(N'''FAC''', @MovImpacto) > 0 AND (CHARINDEX(N'NOT', @MovImpacto) > 0 OR CHARINDEX(N'<>', @MovImpacto) > 0) THEN 1 ELSE 0 END +
    CASE WHEN CHARINDEX(N'Impacto', @CompReferencia) > 0 THEN 1 ELSE 0 END,
    4, N'Los disparadores TR_CC_MOV_ImpactoComprobante y TR_CC_COMP_ImpactoMovimientos, y las restricciones de impacto y referencia'
UNION ALL SELECT 6, N'cuenta-corriente/16_editar_identidad_tipos_comprobante',
    CASE WHEN COL_LENGTH(N'dbo.TIPOS_COMPROBANTE', N'EsElectronico') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM sys.triggers WHERE object_id = OBJECT_ID(N'dbo.TR_CC_COMP_TipoReferencia', N'TR') AND is_disabled = 0) THEN 1 ELSE 0 END,
    2, N'TIPOS_COMPROBANTE.EsElectronico y el disparador TR_CC_COMP_TipoReferencia'
UNION ALL SELECT 7, N'cuenta-corriente/17_debito_interno_referencia',
    CASE WHEN CHARINDEX(N'Impacto', @CompReferencia) > 0 AND CHARINDEX(N'''FAC''', @CompReferencia) > 0 THEN 1 ELSE 0 END,
    1, N'CK_CC_COMP_Referencia admite un débito interno con referencia a otro comprobante interno'
UNION ALL SELECT 8, N'seguridad/02_recupero_contrasena',
    CASE WHEN COL_LENGTH(N'dbo.USUARIOS', N'Email') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN COL_LENGTH(N'dbo.USUARIOS', N'VersionSesion') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.USUARIOS') AND name = N'UX_USUARIOS_Email') THEN 1 ELSE 0 END +
    CASE WHEN OBJECT_ID(N'dbo.RECUPERO_CONTRASENA', N'U') IS NOT NULL THEN 1 ELSE 0 END,
    4, N'USUARIOS.Email y VersionSesion, el índice único del e-mail y la tabla RECUPERO_CONTRASENA. SIN ESTE, EL LOGIN FALLA'
UNION ALL SELECT 9, N'email/07_perfil_recupero_contrasena',
    CASE WHEN COL_LENGTH(N'dbo.CONFIGURACION_EMAIL_MODULO', N'UrlLogin') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN CHARINDEX(N'RECUPERO_CONTRASENA', @CemModulo) > 0 THEN 1 ELSE 0 END +
    CASE WHEN OBJECT_ID(N'dbo.TR_CEM_RecuperoExclusivo', N'TR') IS NOT NULL THEN 1 ELSE 0 END,
    3, N'CONFIGURACION_EMAIL_MODULO.UrlLogin, el módulo RECUPERO_CONTRASENA y el disparador que lo hace exclusivo'
UNION ALL SELECT 10, N'hoja-de-ruta/01_usuario_chofer (nuestro)',
    CASE WHEN COL_LENGTH(N'dbo.USUARIOS', N'ChoferID') IS NOT NULL THEN 1 ELSE 0 END,
    1, N'USUARIOS.ChoferID'
UNION ALL SELECT 11, N'hoja-de-ruta/02_rol_chofer (nuestro)',
    CASE WHEN NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.USUARIOS')
                          AND definition LIKE N'%Rol%' AND definition NOT LIKE N'%chofer%') THEN 1 ELSE 0 END,
    1, N'Ninguna restricción sobre USUARIOS.Rol rechaza ''chofer'' (las cuentas que faltan pasar, en la tabla 2)'
UNION ALL SELECT 12, N'viajes/02_viaje_cancelado (nuestro)',
    CASE WHEN COL_LENGTH(N'dbo.VIAJES', N'Cancelado_Motivo') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.VIAJES')
                          AND definition LIKE N'%Estado%' AND CHARINDEX(N'Cancelado', definition) = 0) THEN 1 ELSE 0 END,
    2, N'VIAJES.Cancelado_Motivo y que la restricción de estados admita Cancelado'
UNION ALL SELECT 13, N'viajes/03_viaje_sin_carga (nuestro)',
    CASE WHEN COL_LENGTH(N'dbo.VIAJES', N'Sin_Carga_Observacion') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.VIAJES')
                          AND definition LIKE N'%Estado%' AND CHARINDEX(N'Sin_carga', definition) = 0) THEN 1 ELSE 0 END,
    2, N'VIAJES.Sin_Carga_Observacion y que la restricción de estados admita Sin_carga';

SELECT Script,
       CASE WHEN Encontrado = Esperado THEN N'Corrido'
            WHEN Encontrado = 0 THEN N'Falta correrlo'
            ELSE N'A medias (' + CAST(Encontrado AS nvarchar(5)) + N' de ' + CAST(Esperado AS nvarchar(5)) + N'): revisar' END AS Estado,
       Que_se_mira
FROM @Scripts
ORDER BY Orden;

-- Los datos se leen con SQL dinámico: si falta una columna o una tabla, no se rompe todo el diagnóstico.
DECLARE @Datos TABLE (Orden int, Dato nvarchar(120), Valor nvarchar(max));

-- Script 18: recibos con "Cobranza sin imputación" mal escrito (el texto exacto que corrige ese script).
INSERT INTO @Datos
EXEC sys.sp_executesql N'
DECLARE @Incorrecto nvarchar(300) = N''Cobranza sin imputaci'' + NCHAR(195) + NCHAR(179) + N''n'';
SELECT 1, N''cuenta-corriente/18: recibos con el acento mal escrito'',
       CAST((SELECT COUNT(*) FROM dbo.COMPROBANTES WHERE Tipo = ''REC''
             AND Concepto COLLATE Latin1_General_100_BIN2 = @Incorrecto AND DATALENGTH(Concepto) = DATALENGTH(@Incorrecto)) AS nvarchar(10))
       + N'' comprobantes y ''
       + CAST((SELECT COUNT(*) FROM dbo.CUENTA_CORRIENTE_MOVIMIENTOS WHERE Tipo = ''REC'' AND Clase = ''EMISION''
             AND Concepto COLLATE Latin1_General_100_BIN2 = @Incorrecto AND DATALENGTH(Concepto) = DATALENGTH(@Incorrecto)) AS nvarchar(10))
       + N'' movimientos (si los dos son 0, no hace falta correrlo)'';';

-- Documentación 02: qué manual está publicado (el del script pesa 2.787.616 bytes).
IF OBJECT_ID(N'dbo.MANUAL_USUARIO', N'U') IS NOT NULL
    INSERT INTO @Datos
    EXEC sys.sp_executesql N'
SELECT 2, N''documentacion/02: manual publicado'',
       ISNULL((SELECT CASE WHEN DATALENGTH(Pdf) = 2787616 THEN N''La versión 0003 (el script ya está aplicado)''
                           ELSE N''Otro PDF, de '' + CAST(DATALENGTH(Pdf) AS nvarchar(20)) + N'' bytes (el script no está aplicado)'' END
               FROM dbo.MANUAL_USUARIO WHERE ManualUsuario_ID = 1), N''Ninguno'');';

-- E-mail 07: qué perfil manda el recupero de contraseña, desde qué casilla y a qué login lleva el enlace. Dice si tiene
-- contraseña guardada, nunca cuál es.
IF COL_LENGTH(N'dbo.CONFIGURACION_EMAIL_MODULO', N'UrlLogin') IS NOT NULL
   AND COL_LENGTH(N'dbo.EmailServidor', N'CredentialFromMailPassProtegida') IS NOT NULL
    INSERT INTO @Datos
    EXEC sys.sp_executesql N'
SELECT 3, N''Perfil de recupero de contraseña'',
       ISNULL((SELECT TOP (1) N''Perfil '' + CAST(m.[Service] AS nvarchar(10)) + N'' ('' + ISNULL(s.[Name], N''sin nombre'')
                   + N''): manda desde '' + ISNULL(s.CredentialFromMailAddres, N''(sin remitente)'')
                   + N'' por '' + ISNULL(s.SmtpHost, N''(sin servidor)'') + N'':'' + ISNULL(CAST(s.SmtpPort AS nvarchar(10)), N''?'')
                   + CASE WHEN s.UsaSsl = 1 THEN N'', con SSL'' ELSE N'', SIN SSL (el recupero no lo acepta)'' END
                   + CASE WHEN s.CredentialFromMailPassProtegida IS NULL THEN N'', SIN CONTRASEÑA GUARDADA'' ELSE N'''' END
                   + N''. El enlace lleva a '' + ISNULL(m.UrlLogin, N''(sin dirección)'')
               FROM dbo.CONFIGURACION_EMAIL_MODULO m
               LEFT JOIN dbo.EmailServidor s ON s.[Service] = m.[Service]
               WHERE m.Modulo = ''RECUPERO_CONTRASENA''),
              N''Sin asignar: hay que registrar un perfil y asignarlo en Gestionar e-mail'');';

-- Seguridad 02: cuántos usuarios activos tienen e-mail (sin e-mail no pueden recuperar la contraseña).
IF COL_LENGTH(N'dbo.USUARIOS', N'Email') IS NOT NULL
    INSERT INTO @Datos
    EXEC sys.sp_executesql N'
SELECT 4, N''Usuarios activos con e-mail'',
       CAST(SUM(CASE WHEN Email IS NOT NULL THEN 1 ELSE 0 END) AS nvarchar(10)) + N'' de '' + CAST(COUNT(*) AS nvarchar(10))
FROM dbo.USUARIOS WHERE EstadoUsuario = ''Activo'';';

-- Hoja de ruta 02: cuentas de choferes que siguen con rol user (las pasa el bloque de cambios de ese script).
IF COL_LENGTH(N'dbo.USUARIOS', N'ChoferID') IS NOT NULL
    INSERT INTO @Datos
    EXEC sys.sp_executesql N'
SELECT 5, N''hoja-de-ruta/02: cuentas de choferes con rol user'',
       CAST(COUNT(*) AS nvarchar(10)) + N'' (tienen que ser 0)''
FROM dbo.USUARIOS WHERE ChoferID IS NOT NULL AND LOWER(LTRIM(RTRIM(ISNULL(Rol, '''')))) = ''user'';';

SELECT Dato, Valor FROM @Datos ORDER BY Orden;

-- Cómo quedaron guardadas las restricciones que reescriben 13, 14, 15 y 17 (si algo da "A medias", pasar esta tabla).
SELECT OBJECT_NAME(parent_object_id) AS Tabla, name AS Restriccion, definition AS Definicion
FROM sys.check_constraints
WHERE name IN (N'CK_CC_MOV_Impacto', N'CK_CC_CP_Tipo', N'CK_CC_COMP_Referencia')
ORDER BY name;
