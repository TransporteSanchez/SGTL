const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const raiz = path.join(__dirname, '..');
const archivo = path.join(raiz, 'WebApi_TransporteSanchez', 'Controllers', 'ProformasOrdenSql.cs');
assert.ok(fs.existsSync(archivo), 'la API debe poder resolver el orden sin consultar la base');

const columnas = [
    ['numero', 'PROFORMAS.Numero'],
    ['cliente', "ISNULL(PROFORMAS.Cli_RazonSocial,'')"],
    ['total', 'ISNULL(PROFORMAS.TotalGeneral,ISNULL(PROFORMAS.ImporteTotal,0))'],
    ['fecha', 'ISNULL(PROFORMAS.FechaEmision,PROFORMAS.FechaCreacion)'],
    ['usuario', "ISNULL(PROFORMAS.Usu_Alta,'')"]
];
const casos = columnas.flatMap(function ([orden]) {
    return [{ orden, direccion: 'asc' }, { orden, direccion: 'desc' }];
}).concat([
    { orden: null, direccion: null },
    { orden: 'otraColumna', direccion: 'asc' },
    { orden: 'numero; DROP TABLE PROFORMAS', direccion: 'asc' },
    { orden: 'numero', direccion: 'otraDireccion' }
]);

const script = `
$ErrorActionPreference = 'Stop'
Add-Type -Path $env:SGTL_TEST_PROFORMAS_ORDEN_CS
$casos = ConvertFrom-Json $env:SGTL_TEST_PROFORMAS_CASOS
$resultados = foreach ($caso in $casos) {
    [WebApi_TransporteSanchez.Controllers.ProformasOrdenSql]::Obtener($caso.orden, $caso.direccion)
}
ConvertTo-Json -InputObject @($resultados) -Compress
`;
const ejecucion = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8',
    env: { ...process.env, SGTL_TEST_PROFORMAS_ORDEN_CS: archivo, SGTL_TEST_PROFORMAS_CASOS: JSON.stringify(casos) }
});
assert.strictEqual(ejecucion.status, 0, ejecucion.stderr || ejecucion.stdout);
const resultados = JSON.parse(ejecucion.stdout.trim());
assert.strictEqual(resultados.length, casos.length);

columnas.forEach(function ([campo, expresion], indice) {
    ['ASC', 'DESC'].forEach(function (direccion, offset) {
        const sql = resultados[indice * 2 + offset];
        assert.ok(sql.startsWith(' ORDER BY '), campo + ': produce ORDER BY');
        assert.ok(sql.includes(expresion + ' ' + direccion), campo + ': usa el dato mostrado y la direccion correcta');
        assert.ok(sql.endsWith(', PROFORMAS.Proforma_ID DESC'), campo + ': desempata siempre por ID');
    });
});
assert.ok(resultados[0].includes('CASE WHEN PROFORMAS.Numero IS NULL THEN 1 ELSE 0 END'),
    'los borradores sin numero quedan al final');
resultados.slice(columnas.length * 2).forEach(function (sql) {
    assert.strictEqual(sql, ' ORDER BY PROFORMAS.Proforma_ID DESC',
        'un criterio desconocido conserva el orden inicial y no entra al SQL');
});

const controlador = fs.readFileSync(path.join(raiz, 'WebApi_TransporteSanchez', 'Controllers', 'ProformasController.cs'), 'utf8');
const listar = controlador.slice(controlador.indexOf('public IHttpActionResult Listar('), controlador.indexOf('[Route("Reporte")]'));
const reporte = controlador.slice(controlador.indexOf('public IHttpActionResult Reporte('), controlador.indexOf('private class ListItem'));
assert.match(listar, /string orden\s*=\s*null,\s*string direccion\s*=\s*null/,
    'el listado acepta criterio y direccion');
assert.match(reporte, /string orden\s*=\s*null,\s*string direccion\s*=\s*null/,
    'el reporte acepta criterio y direccion');
assert.match(listar, /ProformasOrdenSql\.Obtener\(orden,\s*direccion\)\s*\+\s*" OFFSET @off/,
    'el listado ordena todos los resultados antes de paginar');
assert.match(reporte, /where\s*\+\s*ProformasOrdenSql\.Obtener\(orden,\s*direccion\)/,
    'la exportacion usa el mismo orden que el listado');

console.log('OK: la API ordena proformas por cinco columnas antes de paginar y tambien al exportar');
