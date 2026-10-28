const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const raiz = path.join(__dirname, '..');
const fuente = fs.readFileSync(path.join(raiz, 'WebApi_TransporteSanchez/Controllers/ComprobantesController.cs'), 'utf8');
const migracion = fs.readFileSync(path.join(raiz, 'database/cuenta-corriente/17_debito_interno_referencia.sql'), 'utf8');
function bloque(marca) {
    const inicio = fuente.indexOf(marca);
    assert.ok(inicio >= 0, marca);
    let nivel = 0;
    for (let i = fuente.indexOf('{', inicio); i < fuente.length; i++) {
        if (fuente[i] === '{') nivel++;
        if (fuente[i] === '}' && --nivel === 0) return fuente.slice(inicio, i + 1);
    }
}
const codigo = `using System; using System.Linq;
public static class PruebaReferenciaDebito {
${bloque('private class FacturaReferencia')}
${bloque('private static bool EsTipoInterno(')}
${bloque('private static void ValidarReferenciaDebito(')}
public static void Probar() {
    var fecha=new DateTime(2026,10,27);
    var referencia=new FacturaReferencia { ClienteID=1, Tipo="FC", Estado="EMITIDO", FechaEmision=fecha,Total=100,Aplicado=100 };
    ValidarReferenciaDebito(referencia,1,fecha);
    referencia.Tipo="FI"; ValidarReferenciaDebito(referencia,1,fecha);
    foreach(var caso in new[]{"cliente","anulado","fecha","fiscal","credito","recibo","sin origen"}) {
        referencia=new FacturaReferencia { ClienteID=caso=="cliente" ? 2 : 1,Tipo="FC",Estado="EMITIDO",FechaEmision=fecha };
        if(caso=="anulado") referencia.Estado="ANULADO";
        if(caso=="fecha") referencia.FechaEmision=fecha.AddDays(1);
        if(caso=="fiscal") referencia.Tipo="FAC";
        if(caso=="credito") referencia.Tipo="NC";
        if(caso=="recibo") referencia.Tipo="REC";
        if(caso=="sin origen") referencia=null;
        bool rechazado=false;
        try { ValidarReferenciaDebito(referencia,1,fecha); } catch(InvalidOperationException) { rechazado=true; }
        if(!rechazado) throw new Exception("Debe rechazar "+caso);
    }
    foreach(var tipo in new[]{"FAC","NC","ND","REC",""}) if(EsTipoInterno(tipo)) throw new Exception("Tipo reservado");
}}
`;
const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    "$ErrorActionPreference='Stop'; Add-Type -TypeDefinition $env:SGTL_TEST_REFERENCIA_DEBITO; [PruebaReferenciaDebito]::Probar()"],
{ encoding: 'utf8', env: { ...process.env, SGTL_TEST_REFERENCIA_DEBITO: codigo } });
assert.strictEqual(r.status, 0, r.stderr || r.stdout);
const check = migracion.match(/ADD CONSTRAINT CK_CC_COMP_Referencia CHECK \(([\s\S]*?)\);/);
assert.ok(check);
const db = new DatabaseSync(':memory:');
try {
    db.exec(`PRAGMA foreign_keys=ON;
        CREATE TABLE COMPROBANTES (Comprobante_ID INTEGER PRIMARY KEY, ClienteID INT, Tipo TEXT, Impacto TEXT,
            ComprobanteReferenciaID INT, TipoReferencia TEXT, UNIQUE(Comprobante_ID,ClienteID),
            FOREIGN KEY(ComprobanteReferenciaID,ClienteID) REFERENCES COMPROBANTES(Comprobante_ID,ClienteID),
            CHECK(${check[1]}));
        INSERT INTO COMPROBANTES VALUES (1,1,'FC','D',NULL,NULL),(2,1,'FAC','D',NULL,NULL);`);
    const insertar = db.prepare('INSERT INTO COMPROBANTES VALUES (?,?,?,?,?,?)');
    insertar.run(3, 1, 'D', 'D', 1, 'FC');
    insertar.run(4, 1, 'D', 'D', null, null);
    insertar.run(5, 1, 'C', 'C', 1, 'FC');
    insertar.run(6, 1, 'ND', 'D', 2, 'FAC');
    for (const valores of [[7, 1, 'D', 'D', 2, 'FAC'], [8, 2, 'D', 'D', 1, 'FC'],
        [9, 1, 'REC', 'C', 1, 'FC'], [10, 1, 'FAC', 'D', 1, 'FC'], [11, 1, 'D', 'D', 11, 'D']]) {
        assert.throws(() => insertar.run(...valores), 'la restricción o FK rechaza una referencia inválida');
    }
} finally { db.close(); }
assert.match(migracion, /WITH CHECK ADD CONSTRAINT/);
assert.match(migracion, /IF EXISTS[\s\S]*DROP CONSTRAINT CK_CC_COMP_Referencia/);
assert.doesNotMatch(migracion, /(?:INSERT INTO|UPDATE|DELETE FROM) dbo\./i, 'la migración no modifica documentos existentes');
const emitir = fuente.slice(fuente.indexOf('public IHttpActionResult Emitir('), fuente.indexOf('public IHttpActionResult ImputarCredito('));
assert.match(emitir, /debitoReferenciado && !EsTipoInterno\(request\.Tipo\)/);
assert.match(emitir, /if \(debitoReferenciado\)[\s\S]*?LeerFacturaReferencia[\s\S]*?ValidarReferenciaDebito/);
assert.match(emitir, /P\("@tipoReferencia", referencia == null \? null : referencia\.Tipo\)/);
assert.match(fuente, /actual\.ReferenciaID == request\.ComprobanteReferenciaID/);
assert.match(emitir, /if \(impacto == "C"\)[\s\S]*?INSERT dbo\.CUENTA_CORRIENTE_APLICACIONES/,
    'el débito no se imputa ni reduce la deuda original');
console.log('OK: débito con referencia interna, validaciones de origen, restricción SQL y reintentos');
