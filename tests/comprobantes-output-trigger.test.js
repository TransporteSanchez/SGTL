const assert = require('assert');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const migracion = fs.readFileSync(path.join(raiz, 'database', 'cuenta-corriente',
    '16_editar_identidad_tipos_comprobante.sql'), 'utf8');

assert.match(migracion,
    /CREATE OR ALTER TRIGGER dbo\.TR_CC_COMP_TipoReferencia\s+ON dbo\.COMPROBANTES\s+AFTER INSERT, UPDATE/i,
    'la migración 16 instala un trigger de inserción sobre COMPROBANTES');
assert.match(migracion, /ENABLE TRIGGER dbo\.TR_CC_COMP_TipoReferencia ON dbo\.COMPROBANTES/i,
    'la migración 16 deja habilitado el trigger de inserción');

const errores = [];
for (const archivo of ['ComprobantesController.cs', 'FacturasController.cs', 'RecibosController.cs']) {
    const fuente = fs.readFileSync(path.join(raiz, 'WebApi_TransporteSanchez', 'Controllers', archivo), 'utf8');
    const comandos = [...fuente.matchAll(/new SqlCommand\(@"([\s\S]*?)",\s*connection,\s*transaction\)/g)]
        .map(resultado => resultado[1]);
    const inserciones = comandos.filter(sql => /\bINSERT\s+dbo\.COMPROBANTES\s*\(/i.test(sql));
    assert.strictEqual(inserciones.length, 1, archivo + ': se esperaba una inserción de comprobante');

    const sql = inserciones[0];
    const salida = /\bOUTPUT\s+INSERTED\.Comprobante_ID\s+INTO\s+(@[A-Za-z_][A-Za-z_0-9]*)\b/i.exec(sql);
    if (!salida) {
        errores.push(archivo + ': OUTPUT INSERTED.Comprobante_ID debe usar INTO por el trigger de la migración 16');
        continue;
    }

    const tabla = salida[1];
    const nombreTabla = tabla.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const antesDelInsert = sql.slice(0, sql.search(/\bINSERT\s+dbo\.COMPROBANTES\s*\(/i));
    if (!new RegExp('\\bDECLARE\\s+' + nombreTabla + '\\s+TABLE\\s*\\(', 'i').test(antesDelInsert))
        errores.push(archivo + ': falta declarar la tabla de OUTPUT antes de insertar');
    if (!new RegExp('\\bSELECT\\s+[A-Za-z_][A-Za-z_0-9]*\\s+FROM\\s+' + nombreTabla + '\\b', 'i').test(sql))
        errores.push(archivo + ': falta devolver el ID desde la tabla de OUTPUT');
}

assert.deepStrictEqual(errores, [], 'los tres circuitos de emisión deben ser compatibles con el trigger de la migración 16');
console.log('OK: inserciones de comprobantes compatibles con el trigger de la migración 16');
