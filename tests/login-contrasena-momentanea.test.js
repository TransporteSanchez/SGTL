const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'Login.html'), 'utf8');
const botonHtml = /<(button|span)\b([^>]*\bid="togglePassword"[^>]*)>([\s\S]*?)<\/\1>/.exec(html);
assert.ok(botonHtml, 'el login muestra el control para ver la contraseña');
assert.strictEqual(botonHtml[1], 'button', 'el control se puede usar con teclado');
assert.match(botonHtml[2], /\btype="button"/, 'presionar el ojo no envía el formulario');
assert.match(botonHtml[2], /\baria-label="[^"]+"/, 'el control anuncia su función');
assert.doesNotMatch(botonHtml[2], /\bonclick=/, 'el clic no deja la contraseña visible');

const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(function (coincidencia) { return coincidencia[1]; })
    .find(function (codigo) { return codigo.includes('window.onload = loadContent;'); });
assert.ok(script, 'se encontró el script del login');

function emisor() {
    const eventos = new Map();
    return {
        addEventListener: function (tipo, accion) {
            if (!eventos.has(tipo)) eventos.set(tipo, []);
            eventos.get(tipo).push(accion);
        },
        emitir: function (tipo, detalles) {
            const evento = Object.assign({ preventDefault: function () { this.prevenido = true; } }, detalles);
            (eventos.get(tipo) || []).forEach(function (accion) { accion(evento); });
            return evento;
        }
    };
}

const clases = new Set(['bi', 'bi-eye']);
const ojo = { classList: {
    add: function (nombre) { clases.add(nombre); },
    remove: function (nombre) { clases.delete(nombre); }
} };
// El usuario y la contraseña escuchan lo que se escribe para sacar el error del login (Rocío, 28/10).
const clave = Object.assign(emisor(), { type: 'password' });
const usuario = emisor();
const boton = emisor();
const ventana = emisor();
const documento = Object.assign(emisor(), {
    hidden: false,
    getElementById: function (id) {
        return { togglePassword: boton, username: usuario, password: clave, eyeIcon: ojo, loginForm: formulario }[id];
    }
});
const formulario = emisor();
const contexto = vm.createContext({
    window: ventana,
    document: documento,
    fetch: function () { return new Promise(function () {}); },
    Promise,
    console
});
vm.runInContext(script, contexto, { filename: 'Login.html' });

function oculto(mensaje) {
    assert.strictEqual(clave.type, 'password', mensaje);
    assert.ok(clases.has('bi-eye'), 'el ojo vuelve a su ícono inicial');
    assert.ok(!clases.has('bi-eye-slash'), 'el ícono de contraseña visible se quita');
}

function visible(mensaje) {
    assert.strictEqual(clave.type, 'text', mensaje);
    assert.ok(clases.has('bi-eye-slash'), 'el ícono indica que la contraseña se está mostrando');
}

oculto('la contraseña empieza oculta');
boton.emitir('pointerdown', { button: 0, pointerType: 'mouse' });
visible('presionar con el mouse muestra la contraseña');
ventana.emitir('pointerup');
oculto('soltar el mouse la oculta incluso fuera del botón');
boton.emitir('click');
oculto('el clic no alterna la visibilidad');

boton.emitir('pointerdown', { button: 0, pointerType: 'touch' });
visible('mantener presionado con el dedo la muestra');
ventana.emitir('pointercancel');
oculto('cancelar el toque la oculta');

boton.emitir('pointerdown', { button: 0 });
boton.emitir('pointerleave');
oculto('salir del botón la oculta');
boton.emitir('pointerdown', { button: 2 });
oculto('el clic derecho no la muestra');

for (const tecla of [' ', 'Enter']) {
    const presionar = boton.emitir('keydown', { key: tecla });
    visible('mantener ' + tecla + ' muestra la contraseña');
    assert.ok(presionar.prevenido, 'la tecla no desplaza ni envía el formulario');
    boton.emitir('keyup', { key: tecla });
    oculto('soltar ' + tecla + ' la oculta');
}

boton.emitir('keydown', { key: ' ' });
ventana.emitir('blur');
oculto('perder foco de la ventana la oculta');
boton.emitir('keydown', { key: ' ' });
documento.hidden = true;
documento.emitir('visibilitychange');
oculto('ocultar la pestaña oculta la contraseña');

console.log('OK: el login muestra la contraseña solo mientras se mantiene presionado el ojo');
