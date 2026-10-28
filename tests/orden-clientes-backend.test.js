const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const archivo = path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'ClientesOrden.cs');
assert.ok(fs.existsSync(archivo), 'la API debe tener un ordenamiento ejecutable sin consultar la base');

const casos = [
    { nombre: 'razón social ascendente', orden: 'razonSocial', direccion: 'asc', pagina: 1, tamanio: 5, esperado: [5, 2, 4, 3, 1] },
    { nombre: 'razón social descendente', orden: 'razonSocial', direccion: 'desc', pagina: 1, tamanio: 5, esperado: [1, 4, 3, 5, 2] },
    { nombre: 'CUIT ascendente', orden: 'cuit', direccion: 'asc', pagina: 1, tamanio: 5, esperado: [4, 3, 1, 5, 2] },
    { nombre: 'CUIT descendente', orden: 'cuit', direccion: 'desc', pagina: 1, tamanio: 5, esperado: [5, 2, 1, 4, 3] },
    { nombre: 'fecha ascendente', orden: 'fechaAlta', direccion: 'asc', pagina: 1, tamanio: 5, esperado: [5, 2, 1, 4, 3] },
    { nombre: 'fecha descendente', orden: 'fechaAlta', direccion: 'desc', pagina: 1, tamanio: 5, esperado: [4, 3, 1, 5, 2] },
    { nombre: 'segunda página ordenada', orden: 'fechaAlta', direccion: 'asc', pagina: 2, tamanio: 2, esperado: [1, 4] },
    { nombre: 'orden inicial', orden: null, direccion: null, pagina: 1, tamanio: 5, esperado: [5, 4, 3, 2, 1] },
    { nombre: 'criterio desconocido', orden: 'otraColumna', direccion: 'asc', pagina: 1, tamanio: 5, esperado: [5, 4, 3, 2, 1] },
    { nombre: 'criterio inyectado', orden: 'cuit; DROP TABLE CLIENTES', direccion: 'asc', pagina: 1, tamanio: 5, esperado: [5, 4, 3, 2, 1] },
    { nombre: 'dirección desconocida', orden: 'cuit', direccion: 'otraDireccion', pagina: 1, tamanio: 5, esperado: [5, 4, 3, 2, 1] }
];

const script = `
$ErrorActionPreference = 'Stop'
$stub = @'
namespace WebApi_TransporteSanchez {
    public class CLIENTES {
        public int Cliente_ID { get; set; }
        public string Razon_Social { get; set; }
        public string CUIT_Cliente { get; set; }
        public System.DateTime Fecha_Alta { get; set; }
    }
}
namespace WebApi_TransporteSanchez.Controllers {
    public static class ClientesOrdenPrueba {
        public static int[] Ejecutar(string orden, string direccion, int pagina, int tamanio) {
            var registros = new[] {
                new CLIENTES { Cliente_ID = 3, Razon_Social = "Beta", CUIT_Cliente = "30000000001", Fecha_Alta = new System.DateTime(2026, 10, 1) },
                new CLIENTES { Cliente_ID = 1, Razon_Social = "Zeta", CUIT_Cliente = "30000000002", Fecha_Alta = new System.DateTime(2026, 5, 3) },
                new CLIENTES { Cliente_ID = 5, Razon_Social = "Alfa", CUIT_Cliente = "30000000003", Fecha_Alta = new System.DateTime(2026, 1, 9) },
                new CLIENTES { Cliente_ID = 2, Razon_Social = "Alfa", CUIT_Cliente = "30000000003", Fecha_Alta = new System.DateTime(2026, 1, 9) },
                new CLIENTES { Cliente_ID = 4, Razon_Social = "Beta", CUIT_Cliente = "30000000001", Fecha_Alta = new System.DateTime(2026, 10, 1) }
            };
            return ClientesOrden.Aplicar(registros.AsQueryable(), orden, direccion)
                .Skip((pagina - 1) * tamanio).Take(tamanio)
                .Select(x => x.Cliente_ID).ToArray();
        }
    }
}
'@
$fuente = [System.IO.File]::ReadAllText($env:SGTL_TEST_CLIENTES_ORDEN_CS) + [Environment]::NewLine + $stub
Add-Type -TypeDefinition $fuente
$casos = ConvertFrom-Json $env:SGTL_TEST_CLIENTES_CASOS
$resultados = foreach ($caso in $casos) {
    [pscustomobject]@{
        nombre = $caso.nombre
        ids = @([WebApi_TransporteSanchez.Controllers.ClientesOrdenPrueba]::Ejecutar(
            $caso.orden, $caso.direccion, $caso.pagina, $caso.tamanio))
    }
}
ConvertTo-Json -InputObject @($resultados) -Compress -Depth 5
`;

const ejecucion = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8',
    env: {
        ...process.env,
        SGTL_TEST_CLIENTES_ORDEN_CS: archivo,
        SGTL_TEST_CLIENTES_CASOS: JSON.stringify(casos)
    }
});
assert.strictEqual(ejecucion.status, 0, ejecucion.stderr || ejecucion.stdout);
const resultados = JSON.parse(ejecucion.stdout.trim());
assert.strictEqual(resultados.length, casos.length);
casos.forEach(function (caso, indice) {
    assert.deepStrictEqual(resultados[indice].ids, caso.esperado, caso.nombre);
});

console.log('OK: la API ordena clientes antes de paginar, desempata por ID y conserva el orden inicial ante parámetros desconocidos');
