const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.join(__dirname, '..');
const archivo = path.join(raiz, 'WebApi_TransporteSanchez/Controllers/CuentaCorrienteOrdenSql.cs');
const columnas = {
    cliente: 'Cliente', comprobante: 'Comprobante', concepto: 'Concepto', fecha: 'FechaContable', total: 'Total',
    cancelado: "CASE WHEN Tipo='REC' AND EstadoComprobante='ANULADO' THEN Total ELSE Cancelado END",
    saldo: "CASE WHEN Tipo='REC' AND EstadoComprobante='ANULADO' THEN 0 ELSE Saldo END"
};
const casos = Object.keys(columnas).flatMap(orden => ['asc', 'desc'].map(direccion => ({ orden, direccion })))
    .concat([{ orden: null }, { orden: 'otra', direccion: 'asc' },
        { orden: 'Total; DROP TABLE COMPROBANTES', direccion: 'asc' }, { orden: 'total', direccion: 'desc; SELECT 1' }]);
const script = `
$ErrorActionPreference = 'Stop'
Add-Type -Path $env:SGTL_TEST_ORDEN_CUENTA
$casos = ConvertFrom-Json $env:SGTL_TEST_CASOS_CUENTA
$resultados = foreach ($caso in $casos) {
    [WebApi_TransporteSanchez.Controllers.CuentaCorrienteOrdenSql]::Obtener($caso.orden, $caso.direccion)
}
ConvertTo-Json -InputObject @($resultados) -Compress
`;
const resultado = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8', env: { ...process.env, SGTL_TEST_ORDEN_CUENTA: archivo, SGTL_TEST_CASOS_CUENTA: JSON.stringify(casos) }
});
assert.strictEqual(resultado.status, 0, resultado.stderr || resultado.stdout);
const ordenes = JSON.parse(resultado.stdout.trim());
casos.forEach((caso, i) => {
    const esperado = i < 14 ? ' ORDER BY ' + columnas[caso.orden] + ' ' + caso.direccion.toUpperCase() + ',Movimiento_ID'
        : ' ORDER BY FechaContable,Movimiento_ID';
    assert.strictEqual(ordenes[i], esperado, 'orden seguro por el dato visible con desempate estable');
});
// Ejecuta los ORDER BY reales sobre datos locales; no usa la base compartida.
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');
db.exec(`CREATE TABLE Filtrados (Movimiento_ID INT, Cliente TEXT, Comprobante TEXT, Concepto TEXT, FechaContable TEXT,
    Total NUMERIC, Cancelado NUMERIC, Saldo NUMERIC, Tipo TEXT, EstadoComprobante TEXT);
    INSERT INTO Filtrados VALUES
    (1,'Zeta','FAC-10','Z','2026-10-01',100,0,100,'FAC','EMITIDO'),
    (2,'Alfa','FAC-20','A','2026-09-30',20,10,10,'FAC','EMITIDO'),
    (3,'Medio','REC-30','M','2026-10-02',50,0,50,'REC','ANULADO');`);
const esperados = { cliente: [2, 3, 1], comprobante: [1, 2, 3], concepto: [2, 3, 1], fecha: [2, 1, 3],
    total: [2, 3, 1], cancelado: [1, 2, 3], saldo: [3, 2, 1] };
Object.keys(columnas).forEach((campo, indice) => {
    for (const [desplazamiento, sentido] of [[0, 'asc'], [1, 'desc']]) {
        const orden = ordenes[indice * 2 + desplazamiento];
        const ids = db.prepare('SELECT Movimiento_ID FROM Filtrados' + orden).all().map(f => f.Movimiento_ID);
        const esperado = sentido === 'asc' ? esperados[campo] : esperados[campo].slice().reverse();
        assert.deepStrictEqual(ids, esperado, campo + ': ordena fechas, texto o importes según corresponda');
        const segunda = db.prepare('SELECT Movimiento_ID FROM Filtrados' + orden + ' LIMIT 1 OFFSET 1').get();
        assert.strictEqual(segunda.Movimiento_ID, esperado[1], 'se ordena el conjunto completo antes de paginar');
    }
});
db.close();
const controlador = fs.readFileSync(path.join(raiz, 'WebApi_TransporteSanchez/Controllers/CuentaCorrienteController.cs'), 'utf8');
assert.match(controlador, /FROM Filtrados" \+ CuentaCorrienteOrdenSql\.Obtener\(orden, direccion\) \+ @"\s*OFFSET/);
assert.strictEqual((controlador.match(/string orden = null, string direccion = null/g) || []).length, 2,
    'las consultas general y por cliente aceptan el criterio');
assert.match(controlador, /ConsultarMovimientos\(clienteId, desde, hasta, tipo, estado, page, pageSize, orden, direccion\)/);
assert.match(controlador, /ConsultarMovimientos\(null, desde, hasta, tipo, estado, page, pageSize, orden, direccion\)/);
assert.match(controlador, /ORDER BY a\.FechaAplicacion,a\.Aplicacion_ID/,
    'las aplicaciones mantienen su orden cronológico y el saldo progresivo');
console.log('OK: API de cuenta corriente ordena siete columnas, importes de recibos anulados y paginación segura');
