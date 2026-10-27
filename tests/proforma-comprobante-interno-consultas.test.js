const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const controladores = path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers');
const proformas = fs.readFileSync(path.join(controladores, 'ProformasController.cs'), 'utf8');
const comprobantes = fs.readFileSync(path.join(controladores, 'ComprobantesController.cs'), 'utf8');
const viajes = fs.readFileSync(path.join(controladores, 'ViajesController.cs'), 'utf8');

function seccion(fuente, desde, hasta) {
    const inicio = fuente.indexOf(desde);
    const fin = fuente.indexOf(hasta, inicio + desde.length);
    assert.ok(inicio >= 0 && fin > inicio, 'faltan los límites de ' + desde);
    return fuente.slice(inicio, fin);
}

function sqlVerbatim(seccionFuente) {
    const sql = seccionFuente.match(/@"([\s\S]*?)"/);
    assert.ok(sql, 'falta la consulta SQL');
    return sql[1];
}

function paraSqlite(sql) {
    return sql.replace(/WITH\s*\(UPDLOCK,HOLDLOCK\)/g, '')
        .replace(/SELECT TOP \(1\)/g, 'SELECT')
        .replace(/ISNULL\(/g, 'IFNULL(')
        .replace(/'V'\s*\+\s*CONVERT\(varchar\(11\),\s*(v\.Viaje_ID|@viajeId)\)/g, "('V' || CAST(CAST($1 AS INTEGER) AS TEXT))")
        .replace(/CONVERT\(varchar\(11\),\s*(v\.Viaje_ID|@viajeId)\)/g, 'CAST(CAST($1 AS INTEGER) AS TEXT)');
}

const db = new DatabaseSync(':memory:');
db.exec(`
    ATTACH DATABASE ':memory:' AS dbo;
    CREATE TABLE dbo.PROFORMAS (Proforma_ID INTEGER, Numero TEXT, Cli_RazonSocial TEXT, Estado TEXT);
    CREATE TABLE dbo.COMPROBANTES (
        Comprobante_ID INTEGER, Tipo TEXT, Impacto TEXT, Estado TEXT, ClienteID INTEGER,
        NumeroCorrelativo INTEGER, Letra TEXT, Sucursal TEXT, FechaEmision TEXT,
        RazonSocial TEXT, CUIT TEXT, Neto INTEGER, IVA INTEGER, OtrosImpuestos INTEGER, Total INTEGER
    );
    CREATE TABLE dbo.COMPROBANTES_PROFORMAS (ProformaID INTEGER, ComprobanteID INTEGER, Vigente INTEGER);
    CREATE TABLE dbo.CUENTA_CORRIENTE_APLICACIONES (ComprobanteDeudaID INTEGER, Vigente INTEGER, Importe INTEGER);
    CREATE TABLE dbo.VIAJES (Viaje_ID INTEGER);
    CREATE TABLE dbo.PROFORMAS_VIAJES (ProformaID INTEGER, ViajeID INTEGER);
    CREATE TABLE dbo.PROFORMA_DETALLE (Proforma_ID INTEGER, Codigo TEXT);
    INSERT INTO dbo.PROFORMAS VALUES
        (1,'PF-1','Cliente','Facturada'),(2,'PF-2','Cliente','Facturada'),
        (3,'PF-3','Cliente','Aceptada'),(4,'PF-4','Cliente','Aceptada'),
        (5,'PF-5','Cliente','Aceptada'),(6,'PF-6','Cliente','Facturada');
    INSERT INTO dbo.COMPROBANTES VALUES
        (101,'FC','D','EMITIDO',7,12,'A','0001','2026-10-27','Cliente','20123456789',100,21,0,121),
        (102,'FAC','D','EMITIDO',7,13,'A','0001','2026-10-27','Cliente','20123456789',100,21,0,121),
        (103,'NC','C','EMITIDO',7,14,'A','0001','2026-10-27','Cliente','20123456789',100,21,0,121),
        (104,'FC','D','ANULADO',7,15,'A','0001','2026-10-27','Cliente','20123456789',100,21,0,121),
        (105,'FC','D','EMITIDO',7,16,'A','0001','2026-10-27','Cliente','20123456789',100,21,0,121),
        (106,'FC','D','EMITIDO',7,17,'B','0002','2026-10-27','Cliente','20123456789',100,21,0,121);
    INSERT INTO dbo.COMPROBANTES_PROFORMAS VALUES
        (1,101,1),(2,102,1),(3,103,1),(4,104,1),(5,105,0),(6,106,1);
    INSERT INTO dbo.CUENTA_CORRIENTE_APLICACIONES VALUES (106,1,50);
    INSERT INTO dbo.VIAJES VALUES (1),(2),(3),(4),(5),(6);
    INSERT INTO dbo.PROFORMAS_VIAJES VALUES (1,1),(2,2),(3,3),(4,4),(5,5);
    INSERT INTO dbo.PROFORMA_DETALLE VALUES (6,'V6');
`);

function probarEstadoProformas() {
    const estado = seccion(proformas, 'private static bool TieneFacturaVigente(', '[HttpPost]');
    const consulta = paraSqlite(sqlVerbatim(estado));
    const buscar = db.prepare(consulta);
    assert.deepStrictEqual([1, 2, 3, 4, 5, 6].map(id => buscar.get({ '@id': id })['COUNT(*)']),
        [1, 1, 0, 0, 0, 1], 'solo los comprobantes de deuda emitidos con vínculo vigente bloquean la proforma');

    const filtros = seccion(proformas, 'private static StringBuilder CrearFiltroListado(', '[HttpGet]');
    const consultas = [...filtros.matchAll(/where\.Append\(@"([\s\S]*?)"\)/g)].map(item => paraSqlite(item[1]));
    const facturadas = consultas.find(sql => sql.includes(' AND EXISTS (SELECT 1'));
    const aceptadas = consultas.find(sql => sql.includes(' AND Estado=@est AND NOT EXISTS'));
    assert.ok(facturadas && aceptadas, 'los filtros incluyen el vínculo vigente');
    assert.deepStrictEqual(db.prepare('SELECT Proforma_ID FROM dbo.PROFORMAS WHERE 1=1 ' + facturadas + ' ORDER BY Proforma_ID')
        .all().map(row => row.Proforma_ID), [1, 2, 6], 'Facturada incluye FC y FAC vigentes');
    assert.deepStrictEqual(db.prepare('SELECT Proforma_ID FROM dbo.PROFORMAS WHERE 1=1 ' + aceptadas + ' ORDER BY Proforma_ID')
        .all({ '@est': 'Aceptada' }).map(row => row.Proforma_ID), [3, 4, 5], 'Aceptada excluye las proformas emitidas');

    const listado = seccion(proformas, 'string sql =', 'var items = db.Database.SqlQuery<ListItem>');
    const reporte = seccion(proformas, 'string sqlProformas =', 'var proformas = db.Database.SqlQuery<ReporteProformaItem>');
    assert.match(listado, /cp\.Vigente=1 AND c\.Impacto='D' AND c\.Estado='EMITIDO'/,
        'el listado reconoce el comprobante FC emitido y conserva su número');
    assert.match(reporte, /cp\.Vigente=1 AND c\.Impacto='D' AND c\.Estado='EMITIDO'/,
        'el reporte muestra Facturada para FC emitido');
}

function probarCancelatoria() {
    const validar = seccion(comprobantes, 'private static bool EsFacturaVigenteDeProforma(', 'private static ComprobanteExistente BuscarPorClave(');
    const buscar = db.prepare(paraSqlite(sqlVerbatim(validar)));
    assert.deepStrictEqual([1, 2, 3, 4, 5, 6].map(id => buscar.get({ '@proforma': id, '@factura': id + 100 })['COUNT(*)']),
        [1, 1, 0, 0, 0, 1], 'la NC cancelatoria acepta FC y FAC vigentes, no créditos ni anulados');

    const obtener = seccion(comprobantes, 'public IHttpActionResult ObtenerFacturaCancelatoria(', '[HttpPost]');
    const consulta = paraSqlite(sqlVerbatim(obtener)) + '\nLIMIT 1';
    const fila = db.prepare(consulta).get({ '@proforma': 1 });
    assert.ok(fila, 'la consulta encuentra el FC vinculado');
    assert.strictEqual(fila.Tipo, 'FC', 'la respuesta conserva la sigla del comprobante interno');
    assert.strictEqual(fila.Aplicado, 0, 'sin aplicaciones admite la cancelación completa');
    assert.strictEqual(db.prepare(consulta).get({ '@proforma': 6 }).Aplicado, 50,
        'una aplicación previa sigue bloqueando la cancelación completa');
    assert.match(obtener, /FacturaNumero\s*=\s*Numero\(factura\.Tipo,\s*factura\.Letra,\s*factura\.Sucursal,\s*factura\.NumeroCorrelativo\)/,
        'el número de la cancelatoria muestra FC, no un prefijo FAC fijo');
    const emision = comprobantes.slice(comprobantes.indexOf('public IHttpActionResult Emitir('));
    assert.ok(/P\("@tipoReferencia",\s*referencia == null \? null : referencia\.Tipo\)/.test(emision),
        'la nota de crédito referencia el tipo real FC del comprobante vinculado');
}

function probarViajes() {
    const expresion = viajes.match(/private const string SQL_FACTURADA =([\s\S]*?);/);
    assert.ok(expresion, 'falta el estado facturado de la grilla');
    const partes = [...expresion[1].matchAll(/"((?:\\.|[^"\\])*)"/g)]
        .map(item => JSON.parse('"' + item[1] + '"'));
    const sqlGrilla = paraSqlite(partes.join(''));
    const grilla = db.prepare('SELECT ' + sqlGrilla + ' AS Facturada FROM dbo.VIAJES v WHERE v.Viaje_ID=@viajeId');
    assert.deepStrictEqual([1, 2, 3, 4, 5, 6].map(id => grilla.get({ '@viajeId': id }).Facturada),
        [1, 1, 0, 0, 0, 1], 'la grilla reconoce viajes de FC y FAC, no créditos, anulados o vínculos cancelados');

    const bloqueo = seccion(viajes, 'private static bool EstaVinculadoAProformaFacturada(', '// GET: api/Viajes');
    const consulta = paraSqlite(sqlVerbatim(bloqueo));
    const bloqueado = db.prepare(consulta);
    assert.deepStrictEqual([1, 2, 3, 4, 5, 6].map(id => {
        const fila = bloqueado.get({ '@viajeId': id });
        return fila[Object.keys(fila)[0]];
    }),
        [1, 1, 0, 0, 0, 1], 'el bloqueo de edición usa la misma regla para FC y FAC');
}

try {
    probarEstadoProformas();
    probarCancelatoria();
    probarViajes();
    console.log('OK: proformas, cancelación y viajes reconocen comprobantes internos vinculados');
} finally {
    db.close();
}
