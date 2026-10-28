const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { DatabaseSync } = require('node:sqlite');
const leer = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const sesiones = leer('WebApi_TransporteSanchez/Security/SesionesRecupero.cs');
const sql = sesiones.match(/Comando\(cn, null, @"([\s\S]*?)"/)[1]
    .replace(/dbo\./g, '').replace(/COLLATE Latin1_General_CI_AI/g, 'COLLATE NOCASE');
const db = new DatabaseSync(':memory:');
try {
    db.exec(`CREATE TABLE USUARIOS (Usuario_ID INT, Nombre_Usuario TEXT,EstadoUsuario TEXT,VersionSesion INT,Rol TEXT);
    CREATE TABLE GRUPOS_USUARIOS(UsuarioID INT,GrupoID INT); CREATE TABLE GRUPOS_MENU(GrupoID INT,MenuID INT);
    CREATE TABLE MENU(Menu_ID INT,Menu_Nombre TEXT);
    INSERT INTO USUARIOS VALUES(1,'persona','Activo',0,'user'),(2,'admin','Activo',0,'admin');
    INSERT INTO MENU VALUES(1,'Listado de usuarios'),(2,'Gestion de usuarios');
    INSERT INTO GRUPOS_USUARIOS VALUES(1,1); INSERT INTO GRUPOS_MENU VALUES(1,1);`);
    const vigente = (nombre,version,permiso = null, usuarioId = null) => db.prepare(sql).get({ nombre, version, permiso, usuarioId })['COUNT(*)'] === 1;
    assert.ok(vigente('persona',0));
    assert.ok(vigente('persona',0,'Listado de usuarios'));
    assert.ok(!vigente('persona',0,'Gestion de usuarios'), 'listar no permite cambiar el correo de otra cuenta');
    assert.ok(vigente('admin',0,'Gestion de usuarios'));
    db.exec('UPDATE USUARIOS SET VersionSesion=1 WHERE Usuario_ID=1');
    assert.ok(!vigente('persona',0), 'el recupero invalida los JWT anteriores y los heredados sin versión');
    assert.ok(vigente('persona',1), 'un login nuevo usa la versión actual');
    assert.ok(vigente('persona',1,null,1));
    assert.ok(!vigente('persona',1,null,99), 'un nombre recreado no hereda la sesión de otro identificador');
    db.exec("UPDATE USUARIOS SET EstadoUsuario='Inactivo' WHERE Usuario_ID=1");
    assert.ok(!vigente('persona',1));
    db.exec("UPDATE USUARIOS SET EstadoUsuario='Activo' WHERE Usuario_ID=1; UPDATE GRUPOS_MENU SET MenuID=2 WHERE GrupoID=1;");
    assert.ok(vigente('persona',1,'Gestion de usuarios'));
    assert.ok(vigente('persona',1,'Listado de usuarios'), 'gestionar incluye leer el detalle');

    db.exec(`CREATE TABLE CONFIGURACION_EMAIL_MODULO(Modulo TEXT PRIMARY KEY,Service INT);
    INSERT INTO CONFIGURACION_EMAIL_MODULO VALUES('FACTURACION',1),('PRESUPUESTOS',1),('RECUPERO_CONTRASENA',2);`);
    const email = leer('WebApi_TransporteSanchez/Controllers/EmailServidorController.cs');
    const bloque = email.slice(email.indexOf('var conflictos ='), email.indexOf('if (conflictos > 0)'));
    const conflictoSql = [...bloque.matchAll(/"([^"\n]*)"/g)].map(m => m[1]).filter(t => !t.startsWith('@')).join('')
        .replace(/dbo\./g, '').replace(/ WITH \([^)]*\)/g, '');
    const conflicto = (service,modulo) => db.prepare(conflictoSql).get({ service, modulo })['COUNT(*)'];
    assert.ok(conflicto(1,'RECUPERO_CONTRASENA') > 0, 'recupero no puede tomar un perfil de otro módulo');
    assert.ok(conflicto(2,'FACTURACION') > 0, 'otro módulo no puede tomar el perfil exclusivo');
    assert.strictEqual(conflicto(2,'RECUPERO_CONTRASENA'), 0);
    assert.strictEqual(conflicto(1,'FACTURACION'), 0, 'las asignaciones históricas conservan su compatibilidad');
    assert.strictEqual(conflicto(3,'RECUPERO_CONTRASENA'), 0);
} finally { db.close(); }

// Se ejecuta la guarda real de todas las pantallas con respuestas de sesión simuladas.
const sidebar = leer('assets/static/js/sidebar-loader.js');
const guardia = sidebar.slice(sidebar.indexOf('(function sessionGuard()'), sidebar.indexOf('\nfunction markActiveSidebarItem'));
function navegador() {
    const datos = { token: 'cabecera.' + Buffer.from(JSON.stringify({ exp: 9999999999 })).toString('base64url') + '.firma', username: 'persona', userRole: 'user' };
    const eventos = {}, consultas = [], destinos = [];
    const contexto = vm.createContext({
        window: { location: { pathname: '/gestion-usuarios.html', search: '', replace: url => destinos.push(url) },
            addEventListener: (nombre,fn) => { eventos[nombre] = fn; }, setInterval: fn => { eventos.intervalo = fn; } },
        document: { hidden: false, addEventListener: (nombre,fn) => { eventos[nombre] = fn; } },
        localStorage: { getItem: clave => datos[clave], removeItem: clave => { delete datos[clave]; } },
        atob: texto => Buffer.from(texto, 'base64').toString('binary'), escape, decodeURIComponent, Date,
        fetch: (url, opciones) => new Promise(resolve => consultas.push({ url, opciones, resolve }))
    });
    vm.runInContext(guardia, contexto);
    return { datos, eventos, consultas, destinos };
}
const avanzar = () => new Promise(resolve => setImmediate(resolve));
(async function () {
    const ui = navegador();
    assert.strictEqual(ui.consultas[0].url, 'http://localhost:50222/api/sesion');
    assert.ok(ui.consultas[0].opciones.headers.Authorization.startsWith('Bearer '));
    ui.eventos.focus();
    assert.strictEqual(ui.consultas.length, 1, 'no consultar dos veces mientras hay una verificación pendiente');
    ui.consultas[0].resolve({ status: 503 }); await avanzar();
    assert.strictEqual(ui.destinos.length, 0, 'un corte de conexión conserva la sesión');
    ui.eventos.intervalo(); ui.consultas[1].resolve({ status: 401 }); await avanzar();
    assert.strictEqual(ui.datos.token, undefined);
    assert.ok(ui.destinos[0].startsWith('Login.html?volver='));
    const nueva = navegador();
    nueva.datos.token = 'sesion-nueva';
    nueva.consultas[0].resolve({ status: 401 }); await avanzar();
    assert.strictEqual(nueva.datos.token, 'sesion-nueva', 'una respuesta tardía no cierra otro login');
    assert.strictEqual(nueva.destinos.length, 0);
    console.log('OK: permisos de usuarios, versión de sesiones, perfil exclusivo y cierre en otros navegadores.');
})().catch(error => { console.error(error); process.exitCode = 1; });
