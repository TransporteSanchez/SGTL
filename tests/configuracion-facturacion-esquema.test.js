const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ruta = path.join(__dirname, '..', 'database', 'cuenta-corriente', '12_tipos_por_letra.sql');
assert.ok(fs.existsSync(ruta), 'falta la migración para configurar un código con varias letras');

const sql = fs.readFileSync(ruta, 'utf8').replace(/\/\*[\s\S]*?\*\/|--[^\r\n]*/g, '');

assert.match(sql, /SET\s+XACT_ABORT\s+ON\s*;/i, 'la migración debe revertirse ante un error');
assert.match(sql, /BEGIN\s+TRAN(?:SACTION)?\s*;/i, 'la migración debe ser atómica');
assert.match(sql, /IF\s+COL_LENGTH\s*\([^)]*FACTURACION_TIPOS_COMPROBANTE[^)]*FactTipo_ID[^)]*\)\s+IS\s+NULL[\s\S]*?ADD\s+FactTipo_ID\s+int\s+IDENTITY\s*\(\s*1\s*,\s*1\s*\)\s+NOT\s+NULL/i,
    'cada variante debe tener un identificador propio, también al migrar filas existentes');
assert.match(sql, /ADD\s+CONSTRAINT\s+PK_FACTURACION_TIPOS_COMPROBANTE\s+PRIMARY\s+KEY\s+(?:CLUSTERED\s+)?\(\s*FactTipo_ID\s*\)/i,
    'el identificador de configuración debe ser la clave primaria');
assert.match(sql, /ADD\s+CONSTRAINT\s+UQ_FACTURACION_TIPOS_COMPROBANTE_TipoLetra\s+UNIQUE\s+(?:NONCLUSTERED\s+)?\(\s*Tipo\s*,\s*LetraPredeterminada\s*\)/i,
    'solo debe bloquearse la combinación repetida de código y letra');
assert.match(sql, /DROP\s+INDEX\s+UX_CC_COMP_Numero\s+ON\s+dbo\.COMPROBANTES/i,
    'la unicidad anterior por código y correlativo bloquearía A y B con numeradores independientes');
assert.match(sql, /CREATE\s+UNIQUE\s+INDEX\s+UX_CC_COMP_Numero\s+ON\s+dbo\.COMPROBANTES\s*\(\s*Tipo\s*,\s*Letra\s*,\s*Sucursal\s*,\s*NumeroCorrelativo\s*\)\s*WHERE\s+NumeroCorrelativo\s+IS\s+NOT\s+NULL/i,
    'el número visible debe ser único por código, letra y sucursal');
assert.match(sql, /EXISTS\s*\([\s\S]*?FROM\s+dbo\.COMPROBANTES[\s\S]*?NumeroCorrelativo\s+IS\s+NOT\s+NULL[\s\S]*?Letra[\s\S]*?Sucursal[\s\S]*?\)\s*THROW/i,
    'antes de cambiar la unicidad deben detectarse comprobantes numerados sin letra o sucursal');

console.log('OK: esquema de tipos de comprobante por letra');
