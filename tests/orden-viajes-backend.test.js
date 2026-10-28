const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const archivo = path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'ViajesOrdenSql.cs');
assert.ok(fs.existsSync(archivo), 'la API debe tener un mapeo de orden ejecutable sin consultar la base');

const columnas = [
    ['numeroViaje', 'v.Viaje_ID'],
    ['cliente', "ISNULL(c.Razon_Social,'')"],
    ['fechaInicio', 'v.Fecha_Inicio'],
    ['fechaFin', 'v.Fecha_Fin'],
    ['origen', "ISNULL(o.Descripcion,'')"],
    ['destino', "ISNULL(d.Descripcion,'')"],
    ['numeroRemito', "LTRIM(RTRIM(ISNULL(v.Num_Remito,'')))"],
    ['km', 'TRY_CONVERT(decimal']
];
const casos = columnas.flatMap(function ([orden]) {
    return [{ orden, direccion: 'asc' }, { orden, direccion: 'desc' }];
}).concat([
    { orden: null, direccion: null },
    { orden: 'otraColumna', direccion: 'asc' },
    { orden: 'cliente; DROP TABLE VIAJES', direccion: 'asc' },
    { orden: 'cliente', direccion: 'otraDireccion' }
]);

const script = `
$ErrorActionPreference = 'Stop'
Add-Type -Path $env:SGTL_TEST_VIAJES_ORDEN_CS
$casos = ConvertFrom-Json $env:SGTL_TEST_VIAJES_CASOS
$resultados = foreach ($caso in $casos) {
    [WebApi_TransporteSanchez.Controllers.ViajesOrdenSql]::Obtener($caso.orden, $caso.direccion)
}
ConvertTo-Json -InputObject @($resultados) -Compress
`;
const ejecucion = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8',
    env: { ...process.env, SGTL_TEST_VIAJES_ORDEN_CS: archivo, SGTL_TEST_VIAJES_CASOS: JSON.stringify(casos) }
});
assert.strictEqual(ejecucion.status, 0, ejecucion.stderr || ejecucion.stdout);
const resultados = JSON.parse(ejecucion.stdout.trim());
assert.strictEqual(resultados.length, casos.length);

columnas.forEach(function ([campo, expresion], indice) {
    ['ASC', 'DESC'].forEach(function (direccion, offset) {
        const sql = resultados[indice * 2 + offset];
        assert.ok(sql.startsWith(' ORDER BY '), campo + ': la consulta tiene ORDER BY');
        assert.ok(sql.includes(expresion + (campo === 'km' ? '' : ' ' + direccion)), campo + ': usa su columna y ' + direccion);
        assert.ok(sql.includes(' ' + direccion), campo + ': respeta la dirección');
        if (campo !== 'numeroViaje') assert.ok(sql.endsWith(', v.Viaje_ID DESC'), campo + ': desempata para paginar sin saltos');
    });
});
assert.ok(resultados[columnas.findIndex(function (columna) { return columna[0] === 'km'; }) * 2].includes('REPLACE'),
    'los km guardados como texto se convierten a número aceptando coma decimal');
resultados.slice(columnas.length * 2).forEach(function (sql) {
    assert.strictEqual(sql, ' ORDER BY v.Viaje_ID DESC', 'un criterio desconocido conserva el orden inicial y no entra al SQL');
});

console.log('OK: la API ordena ocho columnas con whitelist, km numéricos y desempate estable');
