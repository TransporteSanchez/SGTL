const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'cuenta-corriente',
    '16_editar_identidad_tipos_comprobante.sql'), 'utf8');

assert.match(sql, /IF COL_LENGTH\(N'dbo\.TIPOS_COMPROBANTE', N'EsElectronico'\) IS NULL[\s\S]*?ADD EsElectronico bit NOT NULL[\s\S]*?DEFAULT \(0\) WITH VALUES/,
    'el indicador electrónico se agrega una sola vez y las filas existentes quedan en No');
assert.match(sql, /IF NOT EXISTS[\s\S]*?name=N'UQ_CC_COMP_Cliente'[\s\S]*?UNIQUE NONCLUSTERED \(Comprobante_ID,ClienteID\)/,
    'la autorreferencia debe poder validar comprobante y cliente sin depender de la sigla');

const relaciones = [
    ['FK_CC_COMP_Referencia', 'ComprobanteReferenciaID,ClienteID', 'COMPROBANTES', 'Comprobante_ID,ClienteID', false],
    ['FK_CC_CP_Factura', 'ComprobanteID,ClienteID,TipoFactura', 'COMPROBANTES', 'Comprobante_ID,ClienteID,Tipo', true],
    ['FK_CC_MOV_Comprobante', 'ComprobanteID,ClienteID,Tipo', 'COMPROBANTES', 'Comprobante_ID,ClienteID,Tipo', true],
    ['FK_CC_FP_Recibo', 'ComprobanteID,ClienteID,TipoRecibo', 'COMPROBANTES', 'Comprobante_ID,ClienteID,Tipo', true],
    ['FK_CC_NUM_Tipo', 'Tipo', 'TIPOS_COMPROBANTE', 'Tipo', true],
    ['FK_FACT_TIPO_Tipo', 'Tipo', 'TIPOS_COMPROBANTE', 'Tipo', true],
    ['FK_CC_COMP_Tipo', 'Tipo,Impacto', 'TIPOS_COMPROBANTE', 'Tipo,Impacto', true]
];
for (const [nombre, columnas, padre, columnasPadre, cascada] of relaciones) {
    const patron = new RegExp('ADD CONSTRAINT ' + nombre + '\\s+FOREIGN KEY \\(' + columnas + '\\)\\s+REFERENCES dbo\\.'
        + padre + ' \\(' + columnasPadre + '\\)' + (cascada ? '\\s+ON UPDATE CASCADE' : '(?!\\s+ON UPDATE CASCADE)'));
    assert.match(sql, patron, nombre + ' conserva las columnas esperadas y su acción de actualización');
    assert.match(sql, new RegExp('CHECK CONSTRAINT ' + nombre + ';'), nombre + ' queda habilitada y validada');
}
assert.match(sql, /BEGIN TRANSACTION;[\s\S]*?COMMIT TRANSACTION;[\s\S]*?BEGIN CATCH[\s\S]*?ROLLBACK TRANSACTION/,
    'la modificación de las relaciones es atómica');
assert.match(sql, /CREATE OR ALTER TRIGGER dbo\.TR_CC_COMP_TipoReferencia[\s\S]*?AFTER INSERT, UPDATE[\s\S]*?IF NOT \(UPDATE\(ComprobanteReferenciaID\) OR UPDATE\(TipoReferencia\) OR UPDATE\(ClienteID\)\) RETURN;[\s\S]*?c\.TipoReferencia<>referencia\.Tipo/,
    'la referencia valida su sigla cuando se escribe, sin bloquear la cascada intermedia de Tipo');
assert.match(sql, /ENABLE TRIGGER dbo\.TR_CC_COMP_TipoReferencia ON dbo\.COMPROBANTES/,
    'la validación de referencia queda activa también al repetir la migración');

// Modelo relacional mínimo de los siete enlaces de la migración. Comprueba que
// el tipo se propaga sin cambiar IDs y que la referencia a otro comprobante se
// puede corregir en la misma transacción.
const db = new DatabaseSync(':memory:');
try {
    db.exec(`
        PRAGMA foreign_keys=ON;
        CREATE TABLE tipos (id INTEGER PRIMARY KEY, tipo TEXT UNIQUE NOT NULL,
            impacto TEXT NOT NULL, electronico INTEGER NOT NULL DEFAULT 0,
            UNIQUE(tipo,impacto));
        CREATE TABLE configuraciones (id INTEGER PRIMARY KEY, tipo TEXT NOT NULL,
            letra TEXT NOT NULL, FOREIGN KEY(tipo) REFERENCES tipos(tipo) ON UPDATE CASCADE);
        CREATE TABLE numeradores (id INTEGER PRIMARY KEY, tipo TEXT NOT NULL,
            FOREIGN KEY(tipo) REFERENCES tipos(tipo) ON UPDATE CASCADE);
        CREATE TABLE comprobantes (id INTEGER PRIMARY KEY, cliente INTEGER NOT NULL,
            tipo TEXT NOT NULL, impacto TEXT NOT NULL, letra TEXT NOT NULL,
            sucursal TEXT NOT NULL, numero INTEGER NOT NULL, referencia INTEGER,
            tipo_referencia TEXT,
            UNIQUE(id,cliente), UNIQUE(id,cliente,tipo),
            UNIQUE(tipo,letra,sucursal,numero),
            FOREIGN KEY(tipo,impacto) REFERENCES tipos(tipo,impacto) ON UPDATE CASCADE,
            FOREIGN KEY(referencia,cliente) REFERENCES comprobantes(id,cliente));
        CREATE TABLE proformas (comprobante INTEGER, cliente INTEGER, tipo TEXT,
            FOREIGN KEY(comprobante,cliente,tipo) REFERENCES comprobantes(id,cliente,tipo) ON UPDATE CASCADE);
        CREATE TABLE movimientos (comprobante INTEGER, cliente INTEGER, tipo TEXT,
            FOREIGN KEY(comprobante,cliente,tipo) REFERENCES comprobantes(id,cliente,tipo) ON UPDATE CASCADE);
        CREATE TABLE formas_pago (comprobante INTEGER, cliente INTEGER, tipo TEXT,
            FOREIGN KEY(comprobante,cliente,tipo) REFERENCES comprobantes(id,cliente,tipo) ON UPDATE CASCADE);
        CREATE TRIGGER validar_referencia_insert AFTER INSERT ON comprobantes
        WHEN NEW.referencia IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM comprobantes r WHERE r.id=NEW.referencia
                AND r.cliente=NEW.cliente AND r.tipo=NEW.tipo_referencia)
        BEGIN SELECT RAISE(ABORT,'tipo de referencia incorrecto'); END;
        CREATE TRIGGER validar_referencia_update
        AFTER UPDATE OF referencia,tipo_referencia,cliente ON comprobantes
        WHEN NEW.referencia IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM comprobantes r WHERE r.id=NEW.referencia
                AND r.cliente=NEW.cliente AND r.tipo=NEW.tipo_referencia)
        BEGIN SELECT RAISE(ABORT,'tipo de referencia incorrecto'); END;
        INSERT INTO tipos (id,tipo,impacto) VALUES (1,'FC','D'),(2,'CI','C');
        INSERT INTO configuraciones VALUES (11,'FC','A'),(12,'FC','B');
        INSERT INTO numeradores VALUES (21,'FC');
        INSERT INTO comprobantes VALUES (101,9,'FC','D','A','0001',5,NULL,NULL);
        INSERT INTO comprobantes VALUES (102,9,'FC','D','B','0001',5,NULL,NULL);
        INSERT INTO comprobantes VALUES (103,9,'CI','C','A','0001',1,101,'FC');
        INSERT INTO proformas VALUES (101,9,'FC');
        INSERT INTO movimientos VALUES (101,9,'FC');
    `);
    db.exec('BEGIN TRANSACTION;');
    db.exec("UPDATE tipos SET tipo='FI' WHERE tipo='FC';");
    db.exec("UPDATE comprobantes SET tipo_referencia='FI' WHERE tipo_referencia='FC';");
    db.exec('COMMIT TRANSACTION;');
    assert.deepStrictEqual({ ...db.prepare('SELECT id,tipo FROM tipos WHERE id=1').get() }, { id: 1, tipo: 'FI' });
    assert.deepStrictEqual(db.prepare('SELECT id,tipo FROM configuraciones ORDER BY id').all().map(fila => ({ ...fila })),
        [{ id: 11, tipo: 'FI' }, { id: 12, tipo: 'FI' }]);
    assert.deepStrictEqual({ ...db.prepare('SELECT id,tipo FROM numeradores').get() }, { id: 21, tipo: 'FI' });
    assert.deepStrictEqual(db.prepare('SELECT id,tipo FROM comprobantes WHERE id IN (101,102) ORDER BY id').all().map(fila => ({ ...fila })),
        [{ id: 101, tipo: 'FI' }, { id: 102, tipo: 'FI' }]);
    assert.strictEqual(db.prepare('SELECT tipo_referencia FROM comprobantes WHERE id=103').get().tipo_referencia, 'FI');
    assert.strictEqual(db.prepare('SELECT tipo FROM proformas').get().tipo, 'FI');
    assert.strictEqual(db.prepare('SELECT tipo FROM movimientos').get().tipo, 'FI');
    assert.throws(() => db.exec("UPDATE comprobantes SET tipo_referencia='FC' WHERE id=103;"),
        /tipo de referencia incorrecto/, 'una referencia escrita con sigla distinta se rechaza');
    assert.strictEqual(db.prepare('SELECT tipo_referencia FROM comprobantes WHERE id=103').get().tipo_referencia, 'FI');
    assert.strictEqual(db.prepare('PRAGMA foreign_key_check').all().length, 0);
} finally {
    db.close();
}

console.log('OK: migración de identidad de tipos y cascada histórica');
