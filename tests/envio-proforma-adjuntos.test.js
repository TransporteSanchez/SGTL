const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.join(__dirname, '..');
const fuente = fs.readFileSync(path.join(raiz, 'WebApi_TransporteSanchez/Controllers/EnviosComprobantesController.cs'), 'utf8');
function bloque(marca) {
    const inicio = fuente.indexOf(marca);
    assert.ok(inicio >= 0, marca);
    let nivel = 0;
    for (let i = fuente.indexOf('{', inicio); i < fuente.length; i++) {
        if (fuente[i] === '{') nivel++;
        if (fuente[i] === '}' && --nivel === 0) return fuente.slice(inicio, i + 1);
    }
    throw new Error('Bloque sin cierre: ' + marca);
}
const codigo = `using System; using System.Linq; using System.Text; using System.Web;
using MimeKit; using MimeKit.Utils;
public static class PruebaAdjuntos {
const int MaximoBytesPdf = 10 * 1024 * 1024;
${bloque('private class PerfilSmtp')}
${bloque('private class ComprobanteCorreo')}
${bloque('private static MimeMessage ConstruirMensaje(')}
${bloque('private static string AplicarPlantilla(')}
${bloque('private static string NombreArchivo(')}
${bloque('private static byte[] DecodificarPdf(')}
${bloque('private static void ValidarProforma(')}
static void Revisar(bool bien, string mensaje) { if (!bien) throw new Exception(mensaje); }
public static void Probar() {
    var perfil = new PerfilSmtp { Remitente="emisor@example.com", NombrePerfil="Facturacion",
        CuerpoHtml="<p>Comprobante {{NUMERO_COMPROBANTE}} para {{CLIENTE}}</p>" };
    var documento = new ComprobanteCorreo { Numero="FC-X-1", Cliente="Cliente & prueba",
        ProformaNumero="PF-16", Estado="Generada" };
    byte[] comprobante = Encoding.ASCII.GetBytes("%PDF-1.4 comprobante");
    byte[] proforma = Encoding.ASCII.GetBytes("%PDF-1.4 proforma");
    var uno = ConstruirMensaje(perfil,documento,"cliente@example.com","Comprobante","Comprobante_FC-X-1.pdf",comprobante,null,false);
    Revisar(uno.Attachments.Count()==1,"Sin proforma debe existir un adjunto.");
    var dos = ConstruirMensaje(perfil,documento,"cliente@example.com","Comprobante","Comprobante_FC-X-1.pdf",comprobante,proforma,false);
    var adjuntos = dos.Attachments.Cast<MimePart>().ToArray();
    Revisar(adjuntos.Length==2,"Deben existir dos documentos separados.");
    Revisar(adjuntos[0].FileName=="Comprobante_FC-X-1.pdf" && adjuntos[1].FileName=="Proforma_PF-16.pdf","Nombres de adjuntos incorrectos.");
    for (int i=0;i<2;i++) using(var contenido=new System.IO.MemoryStream()) {
        adjuntos[i].Content.DecodeTo(contenido);
        Revisar(contenido.ToArray().SequenceEqual(i==0 ? comprobante : proforma),"El contenido del PDF cambió.");
        Revisar(adjuntos[i].ContentType.MimeType=="application/pdf","Tipo de adjunto incorrecto.");
    }
    Revisar(dos.HtmlBody.Contains("Cliente &amp; prueba"),"Hay que escapar al cliente en HTML.");
    var sola=ConstruirMensaje(perfil,documento,"cliente@example.com","Proforma","Proforma_PF-16.pdf",proforma,null,true);
    Revisar(sola.Attachments.Count()==1 && sola.HtmlBody.Contains("la proforma"),"El envío independiente debe identificar la proforma.");
    foreach(var estado in new[]{"Generada","Aceptada","Facturada"}) { documento.Estado=estado; ValidarProforma(documento); }
    foreach(var estado in new[]{"Borrador","Anulada"}) {
        documento.Estado=estado; bool rechazo=false;
        try { ValidarProforma(documento); } catch(InvalidOperationException) { rechazo=true; }
        Revisar(rechazo,"No se puede enviar " + estado);
    }
    foreach(var invalido in new[]{"", "no es base64", Convert.ToBase64String(Encoding.ASCII.GetBytes("no es un pdf"))}) {
        bool rechazo=false; try { DecodificarPdf(invalido); } catch(ArgumentException) { rechazo=true; }
        Revisar(rechazo,"No se puede enviar un PDF inválido.");
    }
    Revisar(DecodificarPdf(Convert.ToBase64String(proforma)).SequenceEqual(proforma),"El PDF válido debe conservarse.");
}}
`;
const script = `
$ErrorActionPreference='Stop'
foreach ($dependencia in @('System.Buffers.4.5.1/lib/net461/System.Buffers.dll',
    'System.Memory.4.5.5/lib/net461/System.Memory.dll',
    'System.Runtime.CompilerServices.Unsafe.6.0.0/lib/net461/System.Runtime.CompilerServices.Unsafe.dll')) {
    [void][Reflection.Assembly]::LoadFrom((Join-Path $env:SGTL_TEST_RAIZ ('packages/' + $dependencia)))
}
$mime=Join-Path $env:SGTL_TEST_RAIZ 'packages/MimeKit.2.11.0/lib/net48/MimeKit.dll'
[void][Reflection.Assembly]::LoadFrom($mime)
Add-Type -TypeDefinition $env:SGTL_TEST_ADJUNTOS -ReferencedAssemblies @('System.dll','System.Core.dll','System.Web.dll',$mime)
[PruebaAdjuntos]::Probar()
`;
const resultado = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8', env: { ...process.env, SGTL_TEST_RAIZ: raiz, SGTL_TEST_ADJUNTOS: codigo }
});
assert.strictEqual(resultado.status, 0, resultado.stderr || resultado.stdout);
assert.match(fuente, /request\.ProformaID != comprobante\.ProformaID/, 'el servidor verifica el vínculo de la proforma');
// Prueba la consulta real de origen con vínculos actuales e históricos, sin usar la base compartida.
const { DatabaseSync } = require('node:sqlite');
const lectura = fuente.slice(fuente.indexOf('private static ComprobanteCorreo LeerComprobante('),
    fuente.indexOf('private static PerfilSmtp LeerPerfilFacturacion('));
const consulta = lectura.match(/OUTER APPLY \((SELECT TOP \(1\)[\s\S]*?)\) pf/);
assert.ok(consulta, 'el envío consulta la proforma de origen del comprobante');
const sqlOrigen = consulta[1].replace('TOP (1)', '').replace(/dbo\./g, '')
    .replace(/c\.Comprobante_ID/g, '@id') + ' LIMIT 1';
const db = new DatabaseSync(':memory:');
try {
    db.exec(`CREATE TABLE PROFORMAS (Proforma_ID INTEGER, Numero TEXT, Estado TEXT);
        CREATE TABLE COMPROBANTES_PROFORMAS
            (ComprobanteProforma_ID INTEGER, ComprobanteID INTEGER, ProformaID INTEGER, Vigente INTEGER);
        INSERT INTO PROFORMAS VALUES (2,'PF-00000002','Anulada'),(4,'PF-00000004','Aceptada');
        INSERT INTO COMPROBANTES_PROFORMAS VALUES (1,101,2,0),(2,102,4,1);`);
    const origen = db.prepare(sqlOrigen);
    assert.deepStrictEqual({ ...origen.get({ '@id': 101 }) }, { ProformaID: 2, ProformaNumero: 'PF-00000002' },
        'el comprobante cancelado conserva la proforma original aunque el vínculo no esté vigente y la proforma esté anulada');
    assert.deepStrictEqual({ ...origen.get({ '@id': 102 }) }, { ProformaID: 4, ProformaNumero: 'PF-00000004' },
        'el comprobante nuevo conserva su propia proforma');
    assert.strictEqual(origen.get({ '@id': 103 }), undefined, 'sin origen no se ofrece una proforma ajena');
} finally { db.close(); }
assert.match(fuente, /pdf\.Length \+ pdfProforma\.Length > MaximoBytesPdf/, 'se limita el tamaño combinado');
console.log('OK: MIME con comprobante, comprobante y proforma, y proforma independiente; PDF y estados válidos');
