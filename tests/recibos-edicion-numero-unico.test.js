const assert = require('assert');
const fs = require('fs');
const path = require('path');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez',
    'Controllers', 'RecibosController.cs'), 'utf8');
const inicio = fuente.indexOf('[HttpPut]');
const fin = fuente.indexOf('[Route("recibos/{id:int}/anular")]', inicio);
assert.ok(inicio >= 0 && fin > inicio, 'se ubica la edición del recibo');
const editar = fuente.slice(inicio, fin);
assert.ok(editar.includes('[Route("recibos/{id:int}")]'), 'el caso corresponde al PUT de recibos');

assert.ok(/catch\s*\(SqlException ex\)\s*when\s*\(ex\.Number\s*==\s*2601\s*\|\|\s*ex\.Number\s*==\s*2627\)\s*\{\s*return Content\(HttpStatusCode\.Conflict,\s*new\s*\{\s*error\s*=\s*"Ya existe un recibo con la misma letra, sucursal y número\."\s*\}\);\s*\}/.test(editar),
    'editar un recibo devuelve 409 y un mensaje claro si su nuevo número ya existe');

console.log('OK: editar un recibo duplicado devuelve conflicto sin error técnico');
