const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const raiz = path.join(__dirname, '..');
const leer = archivo => fs.readFileSync(path.join(raiz, archivo), 'utf8');

// Se ejecuta el coordinador C# real, sin conectarse a SQL ni SMTP.
const fuentes = ['ContrasenasSeguras.cs', 'RecuperoContrasena.cs'].map(nombre =>
    leer('WebApi_TransporteSanchez/Security/' + nombre).replace(/^using .*;\r?\n/gm, ''));
const csharp = `using System; using System.Linq; using System.Collections.Generic; using System.Net.Mail;
using System.Security.Cryptography; using System.Text; using System.Text.RegularExpressions;
using WebApi_TransporteSanchez.Security;
${fuentes.join('\n')}
public sealed class DepositoPrueba : IRepositorioRecupero {
 public string Hash, ClaveGuardada; public bool Enviado, Consumido; public int Creaciones, Consumos;
 public SolicitudRecupero Crear(string email,string hash) {
  Creaciones++; if(email!="persona@example.test") return null;
  Hash=hash; Enviado=false; Consumido=false;
  return new SolicitudRecupero { Email=email,UrlLogin="https://example.test/gestion/Login.html" };
 }
 public void MarcarEnviado(string hash) { if(hash!=Hash) throw new Exception(); Enviado=true; }
 public void Descartar(string hash) { Consumido=true; }
 public string Completar(string hash,string clave) {
  Consumos++; if(hash!=Hash || !Enviado || Consumido) return null;
  Consumido=true; ClaveGuardada=clave; return "persona@example.test";
 }
}
public sealed class CorreoPrueba : ICorreoRecupero {
 public string Enlace; public int Envios, Avisos; public bool FallarEnvio, FallarAviso;
 public void EnviarEnlace(string email,string enlace) { Envios++; if(FallarEnvio) throw new Exception(); Enlace=enlace; }
 public void NotificarCambio(string email) { Avisos++; if(FallarAviso) throw new Exception(); }
}
public static class PruebaRecupero {
 static void Exigir(bool bien,string mensaje) { if(!bien) throw new Exception(mensaje); }
 public static void Probar() {
  Exigir(RecuperoContrasena.NormalizarEmail(" Persona@Example.Test ")=="persona@example.test","Normalizar correo");
  foreach(var mal in new[]{"", "sin-correo", "Nombre <a@example.test>", "a@example.test\\r\\nBcc:x@example.test",new string('a',255)+"@example.test"}) {
   bool rechazo=false; try{RecuperoContrasena.NormalizarEmail(mal);}catch(ArgumentException){rechazo=true;} Exigir(rechazo,"Correo invalido");
  }
  foreach(var mal in new[]{"http://example.test/Login.html","https://example.test/Login.html?volver=otro","https://example.test/Login.html#otro","https://u:p@example.test/Login.html","javascript:alert(1)","//example.test/Login.html","https://example.test/otro.html"}) {
   bool rechazo=false;try{RecuperoContrasena.ValidarUrlLogin(mal);}catch(ArgumentException){rechazo=true;}Exigir(rechazo,"URL insegura");
  }
  Exigir(RecuperoContrasena.ValidarUrlLogin("http://localhost:5500/Login.html").StartsWith("http://localhost"),"Desarrollo local");
  var tokens=new HashSet<string>(); for(int i=0;i<100;i++){var t=RecuperoContrasena.NuevoToken();Exigir(RecuperoContrasena.EsTokenValido(t)&&tokens.Add(t),"Aleatoriedad y formato");}
  var db=new DepositoPrueba(); var mail=new CorreoPrueba();var servicio=new RecuperoContrasena(db,mail);string mensaje;
  servicio.Solicitar("nadie@example.test");Exigir(mail.Envios==0,"No enviar a desconocidos");
  servicio.Solicitar(" Persona@Example.Test ");var token=mail.Enlace.Split('=')[1];
  Exigir(db.Hash==RecuperoContrasena.Huella(token)&&db.Hash!=token,"Persistir solo huella");
  Exigir(db.ClaveGuardada==null&&db.Enviado,"Solicitar no cambia la clave");
  Exigir(!servicio.Restablecer(token,"Corta1","Corta1",out mensaje)&&db.Consumos==0,"Politica antes de consumir");
  Exigir(!servicio.Restablecer(token,"Nueva12345","Distinta123",out mensaje)&&db.Consumos==0,"Confirmacion antes de consumir");
  Exigir(!servicio.Restablecer("incorrecto","Nueva12345","Nueva12345",out mensaje)&&db.Consumos==0,"Rechazar token malformado");
  Exigir(servicio.Restablecer(token," Nueva12345 "," Nueva12345 ",out mensaje),"Restablecer");
  Exigir(ContrasenasSeguras.Verificar(" Nueva12345 ",db.ClaveGuardada),"Guardar hash y conservar espacios");
  Exigir(!ContrasenasSeguras.Verificar("Nueva12345",db.ClaveGuardada),"No recortar clave");
  Exigir(mail.Avisos==1,"Notificar cambio");
  Exigir(!servicio.Restablecer(token,"Otra12345","Otra12345",out mensaje),"No reutilizar");
  mail.FallarEnvio=true;bool fallo=false;try{servicio.Solicitar("persona@example.test");}catch{fallo=true;}
  Exigir(fallo&&db.Consumido&&!db.Enviado,"Fallo SMTP descarta el enlace");
  mail.FallarEnvio=false;servicio.Solicitar("persona@example.test");token=mail.Enlace.Split('=')[1];mail.FallarAviso=true;
  Exigir(servicio.Restablecer(token,"Otra12345","Otra12345",out mensaje),"Fallo del aviso no revierte el cambio");
 }
}`;
const compilado = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    "$ErrorActionPreference='Stop'; Add-Type -TypeDefinition $env:SGTL_TEST_RECUPERO; [PruebaRecupero]::Probar()"],
{ encoding: 'utf8', env: { ...process.env, SGTL_TEST_RECUPERO: csharp }, timeout: 90000 });
assert.strictEqual(compilado.status, 0, compilado.stderr || compilado.stdout);

// Las consultas reales se ejecutan en SQLite local; se adaptan solo locks y funciones de SQL Server.
const repositorio = leer('WebApi_TransporteSanchez/Security/RepositorioRecuperoSql.cs');
const consultas = [...repositorio.matchAll(/Comando\(cn, tx, @"([\s\S]*?)"/g)].map(m => m[1]);
const adaptar = sql => sql.replace(/dbo\./g, '').replace(/ WITH \([^)]*\)/g, '')
    .replace(/DATEADD\(hour,-1,SYSUTCDATETIME\(\)\)/g, '(10000-3600)')
    .replace(/DATEADD\(minute,-2,SYSUTCDATETIME\(\)\)/g, '(10000-120)')
    .replace(/SYSUTCDATETIME\(\)/g, '10000');
const db = new DatabaseSync(':memory:');
try {
    db.exec(`CREATE TABLE USUARIOS (Usuario_ID INTEGER PRIMARY KEY,Email TEXT,EstadoUsuario TEXT,VersionSesion INTEGER,Contraseña TEXT,Nombre_Usuario TEXT);
    CREATE UNIQUE INDEX UX_USUARIOS_Email ON USUARIOS(Email) WHERE Email IS NOT NULL;
    CREATE TABLE RECUPERO_CONTRASENA (TokenHash TEXT PRIMARY KEY,UsuarioID INT,Email TEXT,VersionSesion INT,ClaveHuella TEXT,Enviado INT,UsadoUtc INT,VenceUtc INT,CreadoUtc INT);
    INSERT INTO USUARIOS VALUES (1,'persona@example.test','Activo',0,'hash','persona'),(2,NULL,'Activo',0,'otra','otro');
    INSERT INTO RECUPERO_CONTRASENA VALUES ('enlace',1,'persona@example.test',0,'huella',1,NULL,10001,9990);`);
    const validar = db.prepare(adaptar(consultas.find(sql => sql.includes('SELECT Email, VersionSesion, ClaveHuella'))));
    assert.ok(validar.get({ token: 'enlace', id: 1 }));
    for (const [campo, valor] of [['Enviado', 0], ['UsadoUtc', 9999], ['VenceUtc', 10000]]) {
        db.prepare(`UPDATE RECUPERO_CONTRASENA SET ${campo}=?`).run(valor);
        assert.strictEqual(validar.get({ token: 'enlace', id: 1 }), undefined, campo + ' bloquea el consumo');
        db.exec('UPDATE RECUPERO_CONTRASENA SET Enviado=1,UsadoUtc=NULL,VenceUtc=10001');
    }
    assert.strictEqual(validar.get({ token: 'otro', id: 1 }), undefined);
    assert.strictEqual(validar.get({ token: 'enlace', id: 2 }), undefined);
    const activa = db.prepare(adaptar(consultas.find(sql => sql.includes('SELECT Email, Contraseña, VersionSesion'))));
    db.exec("UPDATE USUARIOS SET EstadoUsuario='Inactivo' WHERE Usuario_ID=1");
    assert.strictEqual(activa.get({ id: 1 }), undefined, 'no recuperar usuarios inactivos');
    assert.throws(() => db.exec("UPDATE USUARIOS SET Email='persona@example.test' WHERE Usuario_ID=2"), /UNIQUE/);
    const contar = consultas.filter(sql => sql.includes('SELECT COUNT(*)'));
    assert.strictEqual(db.prepare(adaptar(contar[0])).get({ id: 1 })['COUNT(*)'], 1);
    assert.strictEqual(db.prepare(adaptar(contar[1])).get({ id: 1 })['COUNT(*)'], 1);
} finally { db.close(); }

const fuente = leer('assets/static/js/login-recupero.js');
function interfaz(hash = '#recupero=' + 'A'.repeat(43)) {
    const elementos = new Map();
    const campo = id => {
        if (!elementos.has(id)) elementos.set(id, { value: '', eventos: {}, disabled: false,
            addEventListener(tipo, fn) { this.eventos[tipo] = fn; }, reset() {}, focus() {} });
        return elementos.get(id);
    };
    const solicitudes = [], avisos = [], modales = [], eliminadas = [];
    let reemplazada = null;
    const contexto = vm.createContext({ document: { getElementById: campo },
        window: { location: { hash, pathname: '/Login.html', search: '' }, history: { replaceState(a,b,url) { reemplazada = url; } } },
        localStorage: { removeItem: clave => eliminadas.push(clave) },
        SGTL: { validador: () => ({ validarTodo() {}, reiniciar() {} }), revisarFormulario: () => true,
            reiniciarFormulario() {}, procesando: () => () => {}, avisoFormulario: (id,texto) => avisos.push(texto),
            modal: (id,accion) => modales.push([id,accion]), toastExito: texto => avisos.push(texto) },
        fetch: (url,opciones) => new Promise(resolve => solicitudes.push({ url, opciones, resolve })) });
    vm.runInContext(fuente, contexto);
    const enviar = id => campo(id).eventos.submit({ preventDefault() {} });
    return { campo, solicitudes, avisos, modales, eliminadas, enviar, reemplazada: () => reemplazada };
}
(async function () {
    const ui = interfaz();
    assert.strictEqual(ui.reemplazada(), '/Login.html', 'el token desaparece del historial');
    assert.deepStrictEqual(ui.modales[0], ['#modalRestablecer', 'show']);
    ui.campo('recuperoNueva').value = ui.campo('recuperoRepetir').value = ' Nueva12345 ';
    const esperando = ui.enviar('formRestablecer');
    await ui.enviar('formRestablecer');
    assert.strictEqual(ui.solicitudes.length, 1, 'no enviar dos veces con doble clic');
    const post = ui.solicitudes[0];
    assert.strictEqual(JSON.parse(post.opciones.body).ContrasenaNueva, ' Nueva12345 ');
    assert.strictEqual(JSON.parse(post.opciones.body).Token, 'A'.repeat(43));
    assert.ok(!post.opciones.headers.Authorization, 'el enlace no usa una sesión previa');
    post.resolve({ ok: false, json: async () => ({ error: 'El enlace venció.' }) });
    await esperando;
    assert.strictEqual(ui.avisos.at(-1), 'El enlace venció.');
    assert.ok(!ui.modales.some(m => m[1] === 'hide'), 'un error conserva el formulario');
    const reintento = ui.enviar('formRestablecer');
    ui.solicitudes.at(-1).resolve({ ok: true, json: async () => ({ mensaje: 'Contraseña restablecida.' }) });
    await reintento;
    assert.ok(ui.eliminadas.includes('token'), 'el navegador descarta la sesión anterior');
    assert.deepStrictEqual(ui.modales.at(-1), ['#modalRestablecer', 'hide']);
    const pedir = interfaz('');
    pedir.campo('recuperoEmail').value = ' persona@example.test ';
    const solicitud = pedir.enviar('formRecupero');
    assert.strictEqual(JSON.parse(pedir.solicitudes[0].opciones.body).Email, 'persona@example.test');
    pedir.solicitudes[0].resolve({ ok: true, json: async () => ({ mensaje: 'Respuesta general.' }) });
    await solicitud;
    assert.strictEqual(pedir.avisos.at(-1), 'Respuesta general.');
    console.log('OK: recupero C# real, consultas locales, enlaces, SMTP simulado, doble clic y formularios.');
})().catch(error => { console.error(error); process.exitCode = 1; });
