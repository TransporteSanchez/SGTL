const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'WebApi_TransporteSanchez', 'Controllers', 'FacturasController.cs'), 'utf8');
const inicio = fuente.indexOf('public IHttpActionResult ObtenerComprobante(');
const fin = fuente.indexOf('public IHttpActionResult ConsultarFacturacion(', inicio);
assert.ok(inicio >= 0 && fin > inicio, 'falta la consulta del detalle del comprobante');
const metodo = fuente.slice(inicio, fin);
const sqlServidor = metodo.match(/const string sql = @"([\s\S]*?)";/);
assert.ok(sqlServidor, 'falta la consulta principal del detalle');
const sql = sqlServidor[1];

const estado = sql.match(/CASE WHEN c\.Estado='ANULADO'[\s\S]*?END AS EstadoFinanciero/);
const aplicado = sql.match(/COALESCE\(a\.ImporteAplicado,0\) AS ImporteAplicado/);
const saldo = sql.match(/,\s*([^\r\n]+) AS SaldoPendiente,/);
const suma = sql.match(/OUTER APPLY \(SELECT SUM\(ap\.Importe\) AS ImporteAplicado\s+FROM dbo\.CUENTA_CORRIENTE_APLICACIONES ap\s+WHERE ([\s\S]*?)\) a/);
assert.ok(estado && aplicado && saldo && suma, 'faltan el estado, el aplicado, el saldo o la suma del detalle');

// SQLite ejecuta las expresiones originales con la suma correlacionada en lugar de OUTER APPLY.
const sumaSql = '(SELECT SUM(ap.Importe) FROM CUENTA_CORRIENTE_APLICACIONES ap WHERE ' + suma[1] + ')';
const expresiones = [estado[0], aplicado[0], saldo[1] + ' AS SaldoPendiente']
    .map(parte => parte.replace(/a\.ImporteAplicado/g, sumaSql));
const consulta = 'SELECT c.Comprobante_ID, ' + expresiones.join(', ') + ' FROM COMPROBANTES c ORDER BY c.Comprobante_ID';

const db = new DatabaseSync(':memory:');
try {
    db.exec(`
        CREATE TABLE COMPROBANTES (Comprobante_ID INTEGER, Tipo TEXT, Impacto TEXT, Estado TEXT, Total NUMERIC);
        CREATE TABLE CUENTA_CORRIENTE_APLICACIONES
            (ComprobanteDeudaID INTEGER, ComprobanteCreditoID INTEGER, Importe NUMERIC, Vigente INTEGER);
        INSERT INTO COMPROBANTES VALUES
            (1,'FC','D','EMITIDO',121),
            (2,'CI','C','EMITIDO',121),
            (3,'NC','C','EMITIDO',50),
            (4,'REC','C','EMITIDO',90),
            (5,'FAC','D','EMITIDO',100),
            (6,'CI','C','EMITIDO',40),
            (7,'CI','C','ANULADO',40);
        INSERT INTO CUENTA_CORRIENTE_APLICACIONES VALUES
            (1,2,121,1),
            (5,3,20,1),
            (5,4,10,1),
            (5,7,15,0);
    `);
    const filas = db.prepare(consulta).all();
    const datos = filas.map(fila => [fila.Comprobante_ID, fila.EstadoFinanciero, fila.ImporteAplicado, fila.SaldoPendiente]);
    assert.deepStrictEqual(datos.slice(0, 6), [
        [1, 'Cancelado', 121, 0],
        [2, 'Aplicado', 121, 0],
        [3, 'Parcialmente aplicado', 20, 30],
        [4, 'Parcialmente aplicado', 10, 80],
        [5, 'Parcial', 30, 70],
        [6, 'Sin aplicar', 0, 40]
    ], 'el PDF y el detalle calculan el aplicado desde el lado correcto, solo con aplicaciones vigentes');
    assert.deepStrictEqual(datos[6].slice(0, 3), [7, 'Anulado', 0],
        'un crédito anulado conserva su estado documental y no cuenta aplicaciones inactivas');
} finally {
    db.close();
}

console.log('OK: estado financiero y aplicaciones de deudas y créditos en el detalle');
