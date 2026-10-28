const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'ComprobantesController.cs'), 'utf8');

function bloque(desde, hasta) {
    const inicio = fuente.indexOf(desde);
    const fin = fuente.indexOf(hasta, inicio + desde.length);
    assert.ok(inicio >= 0 && fin > inicio, 'faltan los límites de ' + desde);
    return fuente.slice(inicio, fin);
}

function probarDatosPersistidos() {
    const buscar = bloque('private static ComprobanteExistente BuscarPorClave(', 'private static bool CoincideEncabezado(');
    const consulta = buscar.match(/const string sql = @"([\s\S]*?)";/);
    assert.ok(consulta, 'falta la consulta de reintento por clave');
    const sql = consulta[1]
        .replace(/SELECT TOP \(1\)/g, 'SELECT')
        .replace(/WITH \(UPDLOCK,HOLDLOCK\)/g, '')
        .replace(/dbo\./g, '')
        .replace(/ORDER BY d\.Orden\)/g, 'ORDER BY d.Orden LIMIT 1)')
        .replace(/ORDER BY cp\.ComprobanteProforma_ID DESC\)/g, 'ORDER BY cp.ComprobanteProforma_ID DESC LIMIT 1)');

    const db = new DatabaseSync(':memory:');
    try {
        db.exec(`
            CREATE TABLE COMPROBANTES (
                Comprobante_ID INTEGER,ClienteID INTEGER,Tipo TEXT,NumeroCorrelativo INTEGER,
                FechaEmision TEXT,FechaVencimiento TEXT,Letra TEXT,Sucursal TEXT,
                ComprobanteReferenciaID INTEGER,Concepto TEXT,Observaciones TEXT,
                Neto NUMERIC,IVA NUMERIC,OtrosImpuestos NUMERIC,Total NUMERIC,ClaveOperacion TEXT
            );
            CREATE TABLE COMPROBANTES_DETALLE (ComprobanteID INTEGER,Orden INTEGER,IvaPct NUMERIC);
            CREATE TABLE COMPROBANTES_PROFORMAS
                (ComprobanteProforma_ID INTEGER,ComprobanteID INTEGER,ProformaID INTEGER,Vigente INTEGER);
            INSERT INTO COMPROBANTES VALUES
                (101,5,'FC',12,'2026-10-20','2026-11-20','A','0001',NULL,'Factura',NULL,100,21,0,121,'original'),
                (202,5,'CI',20,'2026-10-27',NULL,'A','0001',101,'Crédito cancelatorio',NULL,100,21,0,121,'reintento');
            INSERT INTO COMPROBANTES_DETALLE VALUES (202,1,21);
            INSERT INTO COMPROBANTES_PROFORMAS VALUES (1,101,7,0);
        `);
        const guardado = db.prepare(sql).get({ '@clave': 'reintento' });
        assert.strictEqual(guardado.IvaPct, 21, 'se recupera el porcentaje guardado en el renglón del crédito');
        assert.strictEqual(guardado.ProformaID, 7, 'se recupera la proforma histórica de la deuda referenciada');
    } finally {
        db.close();
    }
}

function probarCoincidenciaDeReintento() {
    const metodos = bloque('private static bool CoincideEncabezado(', 'private static bool CoincideReintentoNotaCreditoCorriente(')
        .replace(/private static bool/g, 'public static bool');
    const codigo = `using System;
public static class ReintentoPrueba {
    public class ComprobanteExistente {
        public int ClienteID; public string Tipo; public DateTime FechaEmision; public DateTime? FechaVencimiento;
        public int? ReferenciaID; public int? ProformaID; public string Concepto; public string Letra;
        public string Sucursal; public string Observaciones; public decimal Neto; public decimal IVA;
        public decimal OtrosImpuestos; public decimal Total; public decimal? IvaPct;
    }
    public class EmitirComprobanteRequest {
        public int ClienteID; public string Tipo; public int? ComprobanteReferenciaID; public int? ProformaID;
        public string Concepto; public string Letra; public string Sucursal; public string Observaciones;
        public decimal Neto; public decimal IVA; public decimal OtrosImpuestos; public decimal IvaPct;
    }
    ${metodos}
}`;
    const script = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition $env:SGTL_TEST_CODIGO
$actual = [ReintentoPrueba+ComprobanteExistente]::new()
$actual.ClienteID = 5
$actual.Tipo = 'CI'
$actual.FechaEmision = [DateTime]::new(2026,10,27)
$actual.ReferenciaID = 101
$actual.ProformaID = 7
$actual.Concepto = 'Crédito cancelatorio'
$actual.Letra = 'A'
$actual.Sucursal = '0001'
$actual.Neto = 100
$actual.IVA = 21
$actual.Total = 121
$actual.IvaPct = 21
$resultados = foreach ($caso in (ConvertFrom-Json $env:SGTL_TEST_CASOS)) {
    $pedido = [ReintentoPrueba+EmitirComprobanteRequest]::new()
    $pedido.ClienteID = 5
    $pedido.Tipo = 'CI'
    $pedido.ComprobanteReferenciaID = 101
    $pedido.ProformaID = $caso.proforma
    $pedido.Concepto = 'Crédito cancelatorio'
    $pedido.Letra = 'A'
    $pedido.Sucursal = '0001'
    $pedido.Neto = 100
    $pedido.IVA = 21
    $pedido.IvaPct = $caso.porcentaje
    [ReintentoPrueba]::Coincide($actual,$pedido,[DateTime]::new(2026,10,27),$null,[decimal]21,[decimal]121)
}
ConvertTo-Json -InputObject @($resultados) -Compress
`;
    const casos = [
        { proforma: 7, porcentaje: 21 },
        { proforma: 7, porcentaje: 0 },
        { proforma: 9, porcentaje: 21 },
        { proforma: null, porcentaje: 21 }
    ];
    const ejecucion = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
        encoding: 'utf8',
        env: { ...process.env, SGTL_TEST_CODIGO: codigo, SGTL_TEST_CASOS: JSON.stringify(casos) }
    });
    assert.strictEqual(ejecucion.status, 0, ejecucion.stderr || ejecucion.stdout);
    assert.deepStrictEqual(JSON.parse(ejecucion.stdout.trim()), [true, false, false, false],
        'solo un pedido con el mismo porcentaje y la misma proforma es un reintento idempotente');
}

function probarPorcentajeDelOriginal() {
    const emitir = fuente.slice(fuente.indexOf('public IHttpActionResult Emitir('));
    const declaracion = emitir.match(/decimal porcentajeIvaPendiente\s*=\s*[\s\S]*?;/);
    const condicion = emitir.match(/if\s*\((request\.Neto != netoPendiente[\s\S]*?total != referencia\.Pendiente)\)/);
    assert.ok(declaracion && condicion, 'falta la validación de composición del crédito cancelatorio');
    const codigo = `using System;
public static class PorcentajePrueba {
    public class Pedido { public decimal Neto; public decimal IvaPct; public decimal OtrosImpuestos; }
    public class Referencia { public decimal Pendiente; }
    private static decimal Redondear(decimal valor) { return decimal.Round(valor, 2, MidpointRounding.AwayFromZero); }
    public static bool Acepta(Pedido request, decimal netoPendiente, decimal ivaPendiente,
        decimal otrosPendientes, decimal iva, decimal total, Referencia referencia) {
        ${declaracion[0]}
        return !(${condicion[1]});
    }
}`;
    const script = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition $env:SGTL_TEST_CODIGO
$resultados = foreach ($caso in (ConvertFrom-Json $env:SGTL_TEST_CASOS)) {
    $pedido = [PorcentajePrueba+Pedido]::new()
    $pedido.Neto = [decimal]$caso.neto
    $pedido.IvaPct = [decimal]$caso.porcentaje
    $referencia = [PorcentajePrueba+Referencia]::new()
    $referencia.Pendiente = $pedido.Neto + [decimal]$caso.iva
    [PorcentajePrueba]::Acepta($pedido,$pedido.Neto,[decimal]$caso.iva,[decimal]0,
        [decimal]$caso.iva,$referencia.Pendiente,$referencia)
}
ConvertTo-Json -InputObject @($resultados) -Compress
`;
    const casos = [
        { neto: '100', iva: '21', porcentaje: '21' },
        { neto: '100', iva: '21', porcentaje: '0' },
        { neto: '300', iva: '62.99', porcentaje: '21' },
        { neto: '300', iva: '62.99', porcentaje: '20.99' }
    ];
    const ejecucion = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
        encoding: 'utf8',
        env: { ...process.env, SGTL_TEST_CODIGO: codigo, SGTL_TEST_CASOS: JSON.stringify(casos) }
    });
    assert.strictEqual(ejecucion.status, 0, ejecucion.stderr || ejecucion.stdout);
    assert.deepStrictEqual(JSON.parse(ejecucion.stdout.trim()), [true, false, true, false],
        'el IVA exacto permanece y el porcentaje se valida contra el comprobante original');
}

probarDatosPersistidos();
probarCoincidenciaDeReintento();
probarPorcentajeDelOriginal();
console.log('OK: reintento y porcentaje exacto del crédito cancelatorio');
