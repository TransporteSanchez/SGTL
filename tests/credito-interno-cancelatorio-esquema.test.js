const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ruta = path.join(__dirname, '..', 'database', 'cuenta-corriente', '15_credito_interno_cancelatorio.sql');
assert.ok(fs.existsSync(ruta), 'falta la migración incremental para el crédito interno cancelatorio');

const sql = fs.readFileSync(ruta, 'utf8').replace(/\/\*[\s\S]*?\*\/|--[^\r\n]*/g, '');
const auditoria = fs.readFileSync(path.join(__dirname, '..', 'database', 'cuenta-corriente',
    '03_verificacion_posterior.sql'), 'utf8');

function condicion(nombre) {
    const inicio = new RegExp('\\bADD\\s+CONSTRAINT\\s+' + nombre + '\\s+CHECK\\s*\\(', 'i').exec(sql);
    assert.ok(inicio, 'falta la nueva condición ' + nombre);
    let profundidad = 1;
    let fin = inicio.index + inicio[0].length;
    while (profundidad && fin < sql.length) {
        if (sql[fin] === '(') profundidad += 1;
        if (sql[fin] === ')') profundidad -= 1;
        fin += 1;
    }
    assert.strictEqual(profundidad, 0, nombre + ': la condición debe estar completa');
    return sql.slice(inicio.index + inicio[0].length, fin - 1);
}

function evaluarCheck(expresion, campos) {
    const javascript = expresion
        .replace(/\b([A-Za-z_]\w*)\s+NOT\s+IN\s*\(([^()]*)\)/gi,
            (_, columna, valores) => `![${valores}].includes(${columna})`)
        .replace(/\b([A-Za-z_]\w*)\s+IN\s*\(([^()]*)\)/gi,
            (_, columna, valores) => `[${valores}].includes(${columna})`)
        .replace(/\b([A-Za-z_]\w*)\s+IS\s+NOT\s+NULL\b/gi, '$1 !== null')
        .replace(/\b([A-Za-z_]\w*)\s+IS\s+NULL\b/gi, '$1 === null')
        .replace(/<>/g, '!==')
        .replace(/(?<![!<>=])=(?!=)/g, '===')
        .replace(/\bAND\b/gi, '&&')
        .replace(/\bOR\b/gi, '||');
    return new Function(...Object.keys(campos), `return Boolean(${javascript});`)(...Object.values(campos));
}

function probarMovimiento() {
    const expresion = condicion('CK_CC_MOV_Impacto');
    const admite = (tipo, clase, impacto) => evaluarCheck(expresion,
        { Tipo: tipo, Clase: clase, Impacto: impacto });

    for (const [tipo, clase, impacto, esperado] of [
        ['CI', 'EMISION', 'C', true], ['CI', 'REVERSO', 'D', true],
        ['FC', 'EMISION', 'D', true], ['FC', 'REVERSO', 'C', true],
        ['NC', 'EMISION', 'C', true], ['NC', 'EMISION', 'D', false],
        ['REC', 'EMISION', 'C', true], ['REC', 'EMISION', 'D', false],
        ['FAC', 'EMISION', 'D', true], ['FAC', 'EMISION', 'C', false],
        ['ND', 'EMISION', 'D', true], ['ND', 'EMISION', 'C', false],
        ['CI', 'OTRA', 'C', false], ['CI', 'EMISION', 'X', false]
    ]) {
        assert.strictEqual(admite(tipo, clase, impacto), esperado,
            `${tipo} ${clase} ${impacto}: impacto de movimiento incorrecto`);
    }
}

function probarReferencia() {
    const expresion = condicion('CK_CC_COMP_Referencia');
    const admite = (tipo, impacto, referenciaId, tipoReferencia, comprobanteId = 20) =>
        evaluarCheck(expresion, {
            Tipo: tipo, Impacto: impacto, ComprobanteReferenciaID: referenciaId,
            TipoReferencia: tipoReferencia, Comprobante_ID: comprobanteId
        });

    assert.strictEqual(admite('CI', 'C', null, null), true, 'el crédito sin referencia sigue siendo válido');
    assert.strictEqual(admite('CI', 'C', 10, 'FC'), true, 'CI puede cancelar un FC');
    assert.strictEqual(admite('NC', 'C', 10, 'FAC'), true, 'la NC conserva la referencia de FAC');
    assert.strictEqual(admite('ND', 'D', 10, 'FAC'), true, 'la nota de débito conserva su referencia');
    assert.strictEqual(admite('CI', 'C', null, 'FC'), false, 'la referencia requiere ambos campos');
    assert.strictEqual(admite('CI', 'C', 10, null), false, 'la referencia requiere el tipo real');
    assert.strictEqual(admite('CI', 'C', 20, 'FC'), false, 'un comprobante no se referencia a sí mismo');
    assert.strictEqual(admite('CI', 'C', 10, 'NC'), false, 'un crédito no referencia una NC');
    assert.strictEqual(admite('CI', 'C', 10, 'REC'), false, 'un crédito no referencia un recibo');
    assert.strictEqual(admite('CI', 'C', 10, 'ND'), false, 'un crédito no referencia una nota de débito');
    assert.strictEqual(admite('REC', 'C', 10, 'FC'), false, 'un recibo no usa la referencia cancelatoria');
    assert.strictEqual(admite('FC', 'D', 10, 'FAC'), false, 'un comprobante de deuda no usa la referencia cancelatoria');
}

function probarMigracionSegura() {
    assert.match(sql, /SET\s+XACT_ABORT\s+ON\s*;/i);
    assert.match(sql, /BEGIN\s+TRY[\s\S]*?BEGIN\s+TRANSACTION\s*;[\s\S]*?COMMIT\s+TRANSACTION\s*;[\s\S]*?BEGIN\s+CATCH[\s\S]*?ROLLBACK\s+TRANSACTION\s*;/i,
        'los cambios de ambas restricciones deben ser atómicos');
    for (const [tabla, nombre] of [
        ['CUENTA_CORRIENTE_MOVIMIENTOS', 'CK_CC_MOV_Impacto'],
        ['COMPROBANTES', 'CK_CC_COMP_Referencia']
    ]) {
        assert.match(sql, new RegExp('IF\\s+EXISTS\\s*\\([\\s\\S]*?sys\\.check_constraints[\\s\\S]*?'
            + nombre + '[\\s\\S]*?\\)\\s*ALTER\\s+TABLE\\s+dbo\\.' + tabla
            + '\\s+DROP\\s+CONSTRAINT\\s+' + nombre, 'i'),
        nombre + ': debe poder ejecutarse otra vez');
        assert.match(sql, new RegExp('ALTER\\s+TABLE\\s+dbo\\.' + tabla + '\\s+WITH\\s+CHECK\\s+ADD\\s+CONSTRAINT\\s+' + nombre, 'i'),
            nombre + ': los datos previos deben validarse al crear la restricción');
        assert.match(sql, new RegExp('ALTER\\s+TABLE\\s+dbo\\.' + tabla + '\\s+CHECK\\s+CONSTRAINT\\s+' + nombre, 'i'),
            nombre + ': la restricción debe quedar habilitada');
    }
    assert.doesNotMatch(sql, /DROP\s+CONSTRAINT\s+FK_|\b(?:INSERT\s+(?:INTO\s+)?dbo\.|UPDATE\s+dbo\.|DELETE\s+FROM\s+dbo\.|MERGE\s+dbo\.|TRUNCATE\s+TABLE\s+dbo\.)/i,
        'la migración no altera relaciones ni datos existentes');
}

function sentenciaTrigger(nombre, tabla, eventos) {
    const bloques = [...sql.matchAll(/EXEC\s*\(\s*N'((?:''|[^'])*)'\s*\)\s*;/gi)]
        .map(coincidencia => coincidencia[1].replace(/''/g, "'"));
    const texto = bloques.find(bloque => new RegExp('CREATE OR ALTER TRIGGER dbo\\.' + nombre, 'i').test(bloque));
    assert.ok(texto, nombre + ': debe crearse o actualizarse dentro de la transacción');
    assert.match(texto, new RegExp('CREATE OR ALTER TRIGGER dbo\\.' + nombre
        + '\\s+ON dbo\\.' + tabla + '\\s+AFTER ' + eventos, 'i'));
    assert.match(texto, /FROM\s+inserted\b/i, nombre + ': debe validar todas las filas modificadas');
    assert.match(texto, /AS\s+BEGIN\s+IF\s*\(ROWCOUNT_BIG\(\)\s*=\s*0\)\s+RETURN\s*;\s+SET NOCOUNT ON\s*;/i,
        nombre + ': el control de filas debe ir antes de SET NOCOUNT, que reinicia ROWCOUNT_BIG');
    assert.match(texto, /WITH\s*\(UPDLOCK\s*,\s*HOLDLOCK\)/i,
        nombre + ': debe serializar los cambios simultáneos de comprobante y movimiento');
    assert.match(texto, /\bTHROW\b/i, nombre + ': debe rechazar el cambio inválido');
    return texto;
}

function consultaDeExiste(texto) {
    const inicio = /IF\s+EXISTS\s*\(/i.exec(texto);
    assert.ok(inicio, 'el disparador debe consultar si hay una fila inválida');
    let nivel = 1;
    let fin = inicio.index + inicio[0].length;
    while (nivel && fin < texto.length) {
        if (texto[fin] === '(') nivel += 1;
        if (texto[fin] === ')') nivel -= 1;
        fin += 1;
    }
    assert.strictEqual(nivel, 0, 'la consulta del disparador debe estar completa');
    return texto.slice(inicio.index + inicio[0].length, fin - 1)
        .replace(/WITH\s*\(UPDLOCK\s*,\s*HOLDLOCK\)/gi, '');
}

function probarIntegridadDinamica() {
    const movimiento = sentenciaTrigger('TR_CC_MOV_ImpactoComprobante',
        'CUENTA_CORRIENTE_MOVIMIENTOS', 'INSERT\\s*,\\s*UPDATE');
    const comprobante = sentenciaTrigger('TR_CC_COMP_ImpactoMovimientos',
        'COMPROBANTES', 'UPDATE');
    assert.match(comprobante, /IF\s+NOT\s+UPDATE\s*\(Impacto\)\s+RETURN/i,
        'el guardia del comprobante debe comprobar sus movimientos cuando cambia el impacto');
    const previo = sql.slice(sql.indexOf('BEGIN TRANSACTION;'),
        sql.indexOf('CREATE OR ALTER TRIGGER'));
    assert.match(previo, /FROM\s+dbo\.CUENTA_CORRIENTE_MOVIMIENTOS\s+m[\s\S]*?JOIN\s+dbo\.COMPROBANTES\s+c[\s\S]*?m\.Clase\s*=\s*'EMISION'[\s\S]*?m\.Impacto\s*<>\s*c\.Impacto/i,
        'la migración debe detectar movimientos previos incoherentes antes de crear los disparadores');

    const db = new DatabaseSync(':memory:');
    try {
        db.exec(`
            ATTACH DATABASE ':memory:' AS dbo;
            CREATE TABLE dbo.COMPROBANTES (Comprobante_ID INTEGER, Impacto TEXT);
            CREATE TABLE dbo.CUENTA_CORRIENTE_MOVIMIENTOS (ComprobanteID INTEGER, Clase TEXT, Impacto TEXT);
            CREATE TEMP TABLE inserted (Comprobante_ID INTEGER, ComprobanteID INTEGER, Clase TEXT, Impacto TEXT);
            INSERT INTO dbo.COMPROBANTES VALUES (1,'D'),(2,'C');
            INSERT INTO dbo.CUENTA_CORRIENTE_MOVIMIENTOS VALUES
                (1,'EMISION','D'),(2,'EMISION','C'),(2,'REVERSO','D');
        `);
        const hayErrorMovimiento = db.prepare(consultaDeExiste(movimiento));
        const hayErrorComprobante = db.prepare(consultaDeExiste(comprobante));
        function cargarInsertados(filas) {
            db.exec('DELETE FROM inserted');
            const agregar = db.prepare('INSERT INTO inserted (Comprobante_ID,ComprobanteID,Clase,Impacto) VALUES (?,?,?,?)');
            filas.forEach(fila => agregar.run(...fila));
        }

        cargarInsertados([[null, 2, 'EMISION', 'C'], [null, 2, 'REVERSO', 'D']]);
        assert.strictEqual(hayErrorMovimiento.get(), undefined,
            'la emisión de CI con C y su reverso con D son válidos');
        cargarInsertados([[null, 1, 'EMISION', 'D'], [null, 2, 'EMISION', 'D']]);
        assert.ok(hayErrorMovimiento.get(), 'una emisión CI con D se rechaza también en un lote mixto');
        cargarInsertados([[null, 2, 'REVERSO', 'C']]);
        assert.ok(hayErrorMovimiento.get(), 'un reverso CI con C se rechaza');

        cargarInsertados([[1, null, null, 'D'], [2, null, null, 'C']]);
        assert.strictEqual(hayErrorComprobante.get(), undefined,
            'los comprobantes con impactos originales conservan sus movimientos');
        cargarInsertados([[1, null, null, 'D'], [2, null, null, 'D']]);
        assert.ok(hayErrorComprobante.get(),
            'cambiar a D el impacto del comprobante CI no puede dejar movimientos C vigentes');
    } finally {
        db.close();
    }
}

function probarAuditoriaDeCreditosReferenciados() {
    const inicio = auditoria.indexOf('SELECT c.Comprobante_ID, c.ComprobanteReferenciaID, c.Total,');
    assert.ok(inicio >= 0, 'falta la verificación de créditos con referencia');
    const consulta = auditoria.slice(inicio, auditoria.indexOf(';', inicio) + 1);
    const db = new DatabaseSync(':memory:');
    try {
        db.exec(`
            ATTACH DATABASE ':memory:' AS dbo;
            CREATE TABLE dbo.COMPROBANTES (
                Comprobante_ID INTEGER, Tipo TEXT, Impacto TEXT, ComprobanteReferenciaID INTEGER, Total INTEGER
            );
            CREATE TABLE dbo.CUENTA_CORRIENTE_APLICACIONES (
                ComprobanteCreditoID INTEGER, ComprobanteDeudaID INTEGER, Vigente INTEGER, Importe INTEGER
            );
            INSERT INTO dbo.COMPROBANTES VALUES
                (1,'CI','C',101,121),
                (2,'NC','C',102,60),
                (3,'ND','D',103,50),
                (4,'CI','C',104,70);
            INSERT INTO dbo.CUENTA_CORRIENTE_APLICACIONES VALUES
                (2,102,1,60),
                (4,999,1,70);
        `);
        const encontrados = db.prepare(consulta).all().map(fila => fila.Comprobante_ID).sort((a, b) => a - b);
        assert.deepStrictEqual(encontrados, [1, 4],
            'la auditoría detecta CI sin aplicación o aplicado a otra deuda y excluye NC correcta y ND');
    } finally {
        db.close();
    }
}

probarMovimiento();
probarReferencia();
probarMigracionSegura();
probarIntegridadDinamica();
probarAuditoriaDeCreditosReferenciados();
console.log('OK: esquema de crédito interno cancelatorio');
