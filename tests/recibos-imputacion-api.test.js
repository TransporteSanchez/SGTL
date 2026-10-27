const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.join(__dirname, '..');
const fuente = fs.readFileSync(path.join(raiz, 'WebApi_TransporteSanchez/Controllers/ComprobantesController.cs'), 'utf8');
const recibos = fs.readFileSync(path.join(raiz, 'WebApi_TransporteSanchez/Controllers/RecibosController.cs'), 'utf8');
function bloque(marca) {
    const inicio = fuente.indexOf(marca);
    assert.ok(inicio >= 0, marca);
    let nivel = 0;
    for (let i = fuente.indexOf('{', inicio); i < fuente.length; i++) {
        if (fuente[i] === '{') nivel++;
        if (fuente[i] === '}' && --nivel === 0) return fuente.slice(inicio, i + 1);
    }
}
// Ejecuta el método C# de producción con persistencia y permisos simulados en memoria.
// La conexión simulada no accede a SQL Server ni usa Web.config.
const codigo = `using System; using System.Linq; using System.Collections.Generic;
using System.Net; using System.Data; using System.Globalization;
public class PruebaImputar {
${bloque('public class AplicacionComprobanteRequest')}
${bloque('public class ImputarCreditoRequest')}
${bloque('private class CreditoImputable')}
${bloque('private class FacturaReferencia')}
${bloque('private static decimal Redondear(')}
public class IHttpActionResult { public int Status; public object Datos; }
class AccesoException : Exception { public HttpStatusCode StatusCode; public AccesoException() { StatusCode=HttpStatusCode.Forbidden; } }
class UsuarioSesion { public int UsuarioID=1; public string NombreUsuario="prueba"; }
class Aplicacion { public int Deuda; public decimal Importe; public DateTime Fecha; }
static CreditoImputable Credito;
static Dictionary<int,FacturaReferencia> Deudas;
static List<Aplicacion> Aplicaciones;
static HashSet<string> Permisos;
static int Auditorias;
static bool Token=true;
class SqlConnection : IDisposable {
    public SqlConnection(string cn) {} public void Open() {} public void Dispose() {}
    public SqlTransaction BeginTransaction(IsolationLevel nivel) { Revisar(nivel==IsolationLevel.Serializable,"Aislamiento"); return new SqlTransaction(this); }
}
class SqlTransaction : IDisposable {
    public SqlConnection Connection; List<Aplicacion> antes; int auditorias;
    public SqlTransaction(SqlConnection cn) { Connection=cn; antes=Aplicaciones.ToList(); auditorias=Auditorias; }
    public void Commit() { Connection=null; }
    public void Rollback() { Aplicaciones=antes; Auditorias=auditorias; Connection=null; }
    public void Dispose() { if(Connection!=null) Rollback(); }
}
class SqlParameter { public string Nombre; public object Valor; }
static SqlParameter P(string nombre,object valor) { return new SqlParameter { Nombre=nombre,Valor=valor }; }
class SqlCommand : IDisposable {
    public List<SqlParameter> Parameters=new List<SqlParameter>(); string sql;
    public SqlCommand(string texto, SqlConnection cn, SqlTransaction tx) { sql=texto; }
    public void Dispose() {}
    object Valor(string nombre) { return Parameters.Single(p=>p.Nombre==nombre).Valor; }
    public int ExecuteNonQuery() {
        if(sql.Contains("INSERT dbo.CUENTA_CORRIENTE_APLICACIONES")) {
            Aplicaciones.Add(new Aplicacion { Deuda=(int)Valor("@deuda"), Importe=(decimal)Valor("@importe"),Fecha=(DateTime)Valor("@fecha") });
        } else if(sql.Contains("INSERT dbo.AUDITORIA")) Auditorias++;
        else throw new Exception("La imputación no debe modificar el recibo, su forma de pago ni sus movimientos.");
        return 1;
    }
}
static string SqlConnectionString() { return "memoria"; }
string ObtenerNombreUsuarioToken() { if(!Token) throw new AccesoException(); return "prueba"; }
UsuarioSesion ValidarAcceso(SqlConnection cn,SqlTransaction tx,string permiso,string accion) {
    ObtenerNombreUsuarioToken(); if(!Permisos.Contains(permiso)) throw new AccesoException(); return new UsuarioSesion();
}
static CreditoImputable LeerCreditoImputable(SqlConnection cn,SqlTransaction tx,int id) { return id==10 ? Credito : null; }
static FacturaReferencia LeerFacturaReferencia(SqlConnection cn,SqlTransaction tx,int id) {
    FacturaReferencia deuda; if(!Deudas.TryGetValue(id,out deuda)) return null;
    deuda.Aplicado=Aplicaciones.Where(a=>a.Deuda==id).Sum(a=>a.Importe); return deuda;
}
static Dictionary<int,decimal> LeerAplicacionesVigentes(SqlConnection cn,SqlTransaction tx,int id) {
    return Aplicaciones.GroupBy(a=>a.Deuda).ToDictionary(g=>g.Key,g=>g.Sum(a=>a.Importe));
}
static DateTime FechaArgentina() { return new DateTime(2026,10,27); }
static string Numero(string tipo,string letra,string sucursal,int n) { return tipo+"-"+n; }
IHttpActionResult Content(HttpStatusCode codigo,object datos) { return new IHttpActionResult { Status=(int)codigo,Datos=datos }; }
IHttpActionResult BadRequest(string mensaje) { return Content(HttpStatusCode.BadRequest,mensaje); }
IHttpActionResult NotFound() { return Content(HttpStatusCode.NotFound,null); }
IHttpActionResult Ok(object datos) { return Content(HttpStatusCode.OK,datos); }
${bloque('public IHttpActionResult ImputarCredito(').replace('[FromBody] ', '')}
static void Revisar(bool bien,string mensaje) { if(!bien) throw new Exception(mensaje); }
static void Preparar(string tipo="REC") {
    Credito=new CreditoImputable { ComprobanteID=10, ClienteID=1, Tipo=tipo, Impacto="C", Estado="EMITIDO",Total=100,FechaEmision=new DateTime(2026,10,20) };
    Deudas=new Dictionary<int,FacturaReferencia>();
    for(int id=1;id<=3;id++) Deudas[id]=new FacturaReferencia { ComprobanteID=id,ClienteID=id==3 ? 2 : 1,Estado="EMITIDO",Tipo="FC",Total=200,FechaEmision=new DateTime(2026,10,22) };
    Aplicaciones=new List<Aplicacion>(); Permisos=new HashSet<string>(new[]{tipo=="REC" ? "REC_EMITIR" : "NC_EMITIR"}); Auditorias=0; Token=true;
}
static ImputarCreditoRequest Solicitud(decimal primero,decimal segundo=0,int otra=2) {
    var aplicaciones=new List<AplicacionComprobanteRequest>();
    if(primero>0) aplicaciones.Add(new AplicacionComprobanteRequest { ComprobanteID=1,Importe=primero });
    if(segundo>0) aplicaciones.Add(new AplicacionComprobanteRequest { ComprobanteID=otra,Importe=segundo });
    return new ImputarCreditoRequest { Fecha=new DateTime(2026,10,24),Aplicaciones=aplicaciones };
}
public static void Probar() {
    var api=new PruebaImputar();
    foreach(var tipo in new[]{"REC","C"}) {
        Preparar(tipo);
        Revisar(api.ImputarCredito(10,Solicitud(40)).Status==200,"Primera aplicación de "+tipo);
        Revisar(Aplicaciones.Count==1 && Aplicaciones[0].Importe==40,"Primera aplicación parcial");
        Revisar(api.ImputarCredito(10,Solicitud(40)).Status==200 && Aplicaciones.Count==1 && Auditorias==1,"Reintento idempotente");
        Revisar(api.ImputarCredito(10,Solicitud(60,30)).Status==200,"Aplicación acumulada a dos deudas");
        Revisar(Aplicaciones.Count==3 && Aplicaciones.Sum(a=>a.Importe)==90,"Solo se inserta el incremento");
        Revisar(api.ImputarCredito(10,Solicitud(70,40)).Status==409 && Aplicaciones.Sum(a=>a.Importe)==90,"No sobreaplicar el crédito o recibo");
        Revisar(api.ImputarCredito(10,Solicitud(60,40)).Status==200 && Aplicaciones.Sum(a=>a.Importe)==100,"Agotar el saldo restante");
        Revisar(Credito.Total==100 && Credito.FechaEmision==new DateTime(2026,10,20),"La imputación no cambia el comprobante emitido");
    }
    Preparar();
    Revisar(api.ImputarCredito(10,Solicitud(40,20,3)).Status==400 && Aplicaciones.Count==0 && Auditorias==0,"Otro cliente y reversión de toda la transacción");
    Deudas[1].Total=20;
    Revisar(api.ImputarCredito(10,Solicitud(30)).Status==409 && Aplicaciones.Count==0,"Saldo de la deuda insuficiente");
    Preparar(); var fecha=Solicitud(10); fecha.Fecha=new DateTime(2026,10,19);
    Revisar(api.ImputarCredito(10,fecha).Status==400,"Fecha anterior al recibo");
    fecha.Fecha=new DateTime(2026,10,21); Revisar(api.ImputarCredito(10,fecha).Status==400,"Fecha anterior a la deuda");
    fecha.Fecha=new DateTime(2026,10,28); Revisar(api.ImputarCredito(10,fecha).Status==400,"Fecha futura");
    Credito.Estado="ANULADO"; Revisar(api.ImputarCredito(10,Solicitud(10)).Status==409,"Recibo anulado");
    Preparar("C"); Credito.ReferenciaID=1;
    Revisar(api.ImputarCredito(10,Solicitud(10)).Status==400,"Crédito cancelatorio bloqueado");
    Preparar(); Permisos=new HashSet<string>(new[]{"NC_EMITIR"});
    Revisar(api.ImputarCredito(10,Solicitud(10)).Status==403 && Aplicaciones.Count==0,"NC_EMITIR no autoriza imputar recibos");
    Preparar("C"); Permisos=new HashSet<string>(new[]{"REC_EMITIR"});
    Revisar(api.ImputarCredito(10,Solicitud(10)).Status==403,"REC_EMITIR no autoriza imputar otros créditos");
}}
`;
const script = `$ErrorActionPreference='Stop'
Add-Type -TypeDefinition $env:SGTL_TEST_IMPUTACION -ReferencedAssemblies @('System.dll','System.Core.dll','System.Data.dll')
[PruebaImputar]::Probar()`;
const ejecucion = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8', env: { ...process.env, SGTL_TEST_IMPUTACION: codigo }
});
assert.strictEqual(ejecucion.status, 0, ejecucion.stderr || ejecucion.stdout);
const editar = recibos.slice(recibos.indexOf('public IHttpActionResult Editar('), recibos.indexOf('[Route("recibos/{id:int}/anular")]'));
assert.match(editar, /SELECT MIN\(a\.FechaAplicacion\)/, 'la fecha de emisión no puede ser posterior a una imputación');
assert.doesNotMatch(editar, /UPDATE dbo\.CUENTA_CORRIENTE_APLICACIONES SET FechaAplicacion/,
    'editar el recibo no reescribe las fechas de las imputaciones posteriores');
const reintento = recibos.slice(recibos.indexOf('private static bool CoincideReintento('), recibos.indexOf('[Route("recibos")]'));
assert.match(reintento, /if \(request\.Aplicaciones\.Count == 0\) return true/,
    'reintentar una emisión sin imputar no exige que el recibo siga sin aplicaciones');
assert.match(reintento, /ComprobanteDeudaID,SUM\(Importe\)/, 'los reintentos agrupan aplicaciones sucesivas a la misma deuda');
console.log('OK: recibos y créditos con imputación parcial, sucesiva e idempotente, permisos y reversión ante errores');
