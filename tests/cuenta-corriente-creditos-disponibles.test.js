const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'CuentaCorrienteController.cs'), 'utf8');

function sqlDelMetodo(nombre, hasta, patron) {
    const metodo = fuente.split(nombre)[1]?.split(hasta)[0];
    assert.ok(metodo, `falta ${nombre}`);
    const sql = metodo.match(patron);
    assert.ok(sql, `falta la consulta de ${nombre}`);
    return sql[1];
}

// Se ejecutan las consultas del controlador en SQLite. Solo se traducen funciones de
// presentación y paginación de SQL Server, que no intervienen en los saldos.
function sqlEjecutable(sql) {
    return sql
        .replace(/dbo\./g, '')
        .replace(/ISNULL\(/g, 'IFNULL(')
        .replace(/COALESCE\(\(SELECT TOP \(1\)[\s\S]*?\)\) AS Origen/g, 'NULL AS Origen')
        .replace(/Tipo\+'-'\+Letra\+'-'\+Sucursal\+'-'\+RIGHT\('00000000'\+CONVERT\(varchar\(8\),NumeroCorrelativo\),8\) AS Comprobante/g, "'comprobante' AS Comprobante")
        .replace(/CONVERT\(date,GETDATE\(\)\)/g, "'2026-10-27'")
        .replace(/CONVERT\(varchar\(12\),DATEDIFF\(day,FechaVencimiento,'2026-10-27'\)\)/g,
            "CAST(julianday('2026-10-27')-julianday(FechaVencimiento) AS integer)")
        .replace(/\+' días'/g, "||' días'")
        .replace(/OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY/g, 'LIMIT @pageSize OFFSET @offset');
}

const db = new DatabaseSync(':memory:');
try {
    db.exec(`
        CREATE TABLE CLIENTES (Cliente_ID INTEGER PRIMARY KEY, Razon_Social TEXT, EstadoCliente INTEGER);
        CREATE TABLE COMPROBANTES (
            Comprobante_ID INTEGER PRIMARY KEY, ClienteID INTEGER, Tipo TEXT, NumeroCorrelativo INTEGER,
            Letra TEXT, Sucursal TEXT, Total NUMERIC, Estado TEXT, Impacto TEXT,
            ComprobanteReferenciaID INTEGER, FechaEmision TEXT, FechaVencimiento TEXT
        );
        CREATE TABLE CUENTA_CORRIENTE_MOVIMIENTOS (
            Movimiento_ID INTEGER PRIMARY KEY, ComprobanteID INTEGER, ClienteID INTEGER,
            FechaContable TEXT, Tipo TEXT, Concepto TEXT, Clase TEXT
        );
        CREATE TABLE CUENTA_CORRIENTE_APLICACIONES (
            ComprobanteDeudaID INTEGER, ComprobanteCreditoID INTEGER, Importe NUMERIC, Vigente INTEGER
        );
        INSERT INTO CLIENTES VALUES (1, 'Cliente uno', 1);
        INSERT INTO COMPROBANTES VALUES
            (1,1,'FC',1,'A','0001',200,'EMITIDO','D',NULL,'2026-10-20','2026-11-01'),
            (2,1,'C',2,'A','0001',80,'EMITIDO','C',NULL,'2026-10-21',NULL),
            (3,1,'C',3,'A','0001',30,'EMITIDO','C',NULL,'2026-10-22',NULL),
            (4,1,'C',4,'A','0001',50,'EMITIDO','C',1,'2026-10-23',NULL),
            (5,1,'REC',5,'X','0001',50,'EMITIDO','C',NULL,'2026-10-23',NULL),
            (6,1,'C',6,'A','0001',20,'EMITIDO','C',NULL,'2026-10-24',NULL),
            (7,1,'FC',7,'A','0001',20,'EMITIDO','D',NULL,'2026-10-20','2026-11-01'),
            (8,1,'C',8,'A','0001',25,'ANULADO','C',NULL,'2026-10-24',NULL),
            (9,1,'REC',9,'X','0001',25,'ANULADO','C',NULL,'2026-10-24',NULL);
        INSERT INTO CUENTA_CORRIENTE_APLICACIONES VALUES
            (1,2,40,1), (1,4,50,1), (7,6,20,1), (1,8,25,0);
        INSERT INTO CUENTA_CORRIENTE_MOVIMIENTOS VALUES
            (1,1,1,'2026-10-20','FC','Factura','EMISION'),
            (2,2,1,'2026-10-21','C','Crédito parcial','EMISION'),
            (3,3,1,'2026-10-22','C','Crédito libre','EMISION'),
            (4,4,1,'2026-10-23','C','Crédito cancelatorio','EMISION'),
            (5,5,1,'2026-10-23','REC','Recibo libre','EMISION'),
            (6,6,1,'2026-10-24','C','Crédito aplicado','EMISION'),
            (7,7,1,'2026-10-20','FC','Factura cancelada','EMISION'),
            (8,8,1,'2026-10-24','C','Crédito anulado','EMISION'),
            (9,9,1,'2026-10-24','REC','Recibo anulado','EMISION');
        ALTER TABLE COMPROBANTES ADD COLUMN Concepto TEXT;
        ALTER TABLE CUENTA_CORRIENTE_APLICACIONES ADD COLUMN Aplicacion_ID INTEGER;
        ALTER TABLE CUENTA_CORRIENTE_APLICACIONES ADD COLUMN FechaAplicacion TEXT;
        ALTER TABLE CUENTA_CORRIENTE_APLICACIONES ADD COLUMN ClienteID INTEGER;
        UPDATE CUENTA_CORRIENTE_APLICACIONES SET ClienteID=1;
    `);

    const pendientesSql = sqlEjecutable(sqlDelMetodo('private IHttpActionResult ConsultarPendientes', '\n        }\n    }\n}', /const string sql = @"([\s\S]*?)";/));
    const pendientes = db.prepare(pendientesSql).all({ clienteId: 1 });
    assert.deepStrictEqual(pendientes.map(x => x.ComprobanteID).sort((a, b) => a - b), [1, 2, 3, 5],
        'se ofrecen deudas, créditos internos y recibos con saldo, pero no cancelatorios ni créditos agotados');
    const creditoLibre = pendientes.find(x => x.ComprobanteID === 3);
    assert.deepStrictEqual([creditoLibre.Impacto, creditoLibre.ComprobanteReferenciaID, creditoLibre.EstadoComprobante,
        creditoLibre.ImporteOriginal, creditoLibre.ImporteAplicado, creditoLibre.SaldoPendiente, creditoLibre.Situacion],
        ['C', null, 'EMITIDO', 30, 0, 30, 'Sin imputar']);
    const creditoParcial = pendientes.find(x => x.ComprobanteID === 2);
    assert.deepStrictEqual([creditoParcial.ImporteAplicado, creditoParcial.SaldoPendiente, creditoParcial.Situacion],
        [40, 40, 'Parcialmente imputado']);

    const cte = sqlDelMetodo('private IHttpActionResult ConsultarMovimientos', 'var countParameters', /const string cte = @"([\s\S]*?)";/);
    const select = sqlDelMetodo('private IHttpActionResult ConsultarMovimientos', 'var items =', /string sql = cte \+ @"([\s\S]*?)";/);
    const movimientos = db.prepare(sqlEjecutable(cte + select)).all({
        clienteId: 1, desde: null, hasta: null, tipo: null, estado: null, offset: 0, pageSize: 50
    });
    assert.deepStrictEqual(movimientos.map(x => x.ComprobanteID).sort((a, b) => a - b), [1, 2, 3, 7, 9],
        'el listado principal muestra créditos con saldo sin duplicar los aplicados y conserva recibos anulados');
    const movimientoLibre = movimientos.find(x => x.ComprobanteID === 3);
    assert.deepStrictEqual([movimientoLibre.Impacto, movimientoLibre.ComprobanteReferenciaID,
        movimientoLibre.EstadoComprobante, movimientoLibre.Debe, movimientoLibre.Cancelado,
        movimientoLibre.Saldo, movimientoLibre.Estado],
        ['C', null, 'EMITIDO', 30, 0, 30, 'Pendiente']);
    const movimientoParcial = movimientos.find(x => x.ComprobanteID === 2);
    assert.deepStrictEqual([movimientoParcial.Debe, movimientoParcial.Cancelado, movimientoParcial.Saldo,
        movimientoParcial.Estado], [80, 40, 40, 'Parcial']);
    const reciboAnulado = movimientos.find(x => x.ComprobanteID === 9);
    assert.deepStrictEqual([reciboAnulado.Cancelado, reciboAnulado.Saldo, reciboAnulado.Estado],
        [25, 0, 'Anulado']);

    const sqlAplicaciones = sqlDelMetodo('private IHttpActionResult ConsultarMovimientos', 'foreach (var item in items)',
        /var aplicaciones = db\.Database\.SqlQuery<AplicacionCuentaDto>\(@"([\s\S]*?)", PEntero/);
    const aplicaciones = db.prepare(sqlEjecutable(sqlAplicaciones).replace(
        /credito\.Tipo\+'-'\+credito\.Letra\+'-'\+credito\.Sucursal\+'-'\+RIGHT\('00000000'\+CONVERT\(varchar\(8\),credito\.NumeroCorrelativo\),8\) AS Comprobante/g,
        "'comprobante' AS Comprobante"
    )).all({ clienteId: 1 });
    const creditoEnDeuda = aplicaciones.find(x => x.ComprobanteID === 2);
    assert.deepStrictEqual([creditoEnDeuda.Impacto, creditoEnDeuda.ComprobanteReferenciaID,
        creditoEnDeuda.SaldoPendiente], ['C', null, 40],
    'la fila hija de un crédito parcialmente aplicado informa el saldo real para imputarlo después');
} finally {
    db.close();
}

console.log('OK: créditos internos disponibles en cuenta corriente y pendientes');
