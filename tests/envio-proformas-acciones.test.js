const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const raiz = path.join(__dirname, '..');
const codigo = fs.readFileSync(path.join(raiz, 'assets/static/js/proforma-email.js'), 'utf8');
const pdf = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(raiz, 'assets/static/js/proforma-pdf.js'), 'utf8'), pdf);
assert.strictEqual(typeof pdf.window.generarProformaPDFParaEmail, 'function', 'el generador de PDF expone el adjunto de correo');
const tick = () => new Promise(setImmediate);
function funcion(fuente, nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.ok(inicio >= 0);
    let nivel = 0;
    for (let i = fuente.indexOf('{', inicio); i < fuente.length; i++) {
        if (fuente[i] === '{') nivel++;
        if (fuente[i] === '}' && --nivel === 0) return fuente.slice(inicio, i + 1);
    }
}
for (const archivo of ['gestion-facturacion.html', 'listado-facturas.html']) {
    const html = fs.readFileSync(path.join(raiz, archivo), 'utf8');
    const contexto = { SGTL: { botonFila(accion, opciones) { return { accion, ...opciones }; }, accionesFila(botones) { return botones; } } };
    vm.runInNewContext(funcion(html, 'accionesProforma'), contexto);
    for (const estado of ['Generada', 'Aceptada', 'Facturada', 'Anulada']) {
        const botones = contexto.accionesProforma({ Proforma_ID: 16, Estado: estado });
        const indice = botones.findIndex(b => b.accion === 'enviar');
        assert.strictEqual(botones[indice - 1].accion, 'pdf', archivo + ': el sobre sigue al PDF');
        assert.strictEqual(botones[indice].id, 16);
        assert.strictEqual(botones[indice].deshabilitado, estado === 'Anulada');
    }
    if (archivo.startsWith('gestion')) {
        assert.strictEqual(contexto.accionesProforma({ Proforma_ID: 1, Estado: 'Borrador' })
            .find(b => b.accion === 'enviar').deshabilitado, true);
    }
    assert.match(html, /proforma-email\.js/);
    assert.match(html, /data-accion="enviar"[^\n]+enviarProformaPorEmail/);
}
function entorno() {
    const nodos = {}, llamadas = [], avisos = [], exitos = [], pendientes = [];
    let aceptar = true, fallarPdf = false, pdfs = 0;
    const nodo = id => nodos[id] || (nodos[id] = { value: '', disabled: false, listeners: {},
        setAttribute() {}, addEventListener(e, fn) { this.listeners[e] = fn; },
        removeEventListener(e) { delete this.listeners[e]; } });
    const SGTL = {
        validador() { return { reiniciar() {}, validarTodo() { return true; } }; },
        reiniciarFormulario() {}, avisoFormulario(id, texto) { avisos.push(texto); },
        procesando(id) { nodo(id.slice(1)).disabled = true; return () => { nodo(id.slice(1)).disabled = false; }; },
        confirmar() { return Promise.resolve(aceptar); }, toastExito(texto) { exitos.push(texto); },
        modal(div, accion) { if (accion === 'hide' && div.listeners['hidden.bs.modal']) div.listeners['hidden.bs.modal'](); },
        ajax(opciones) {
            llamadas.push(opciones);
            return new Promise((resolve, reject) => pendientes.push({ resolve, reject }));
        }
    };
    const window = { generarProformaPDFParaEmail(id) {
        pdfs++; assert.strictEqual(id, 16);
        return fallarPdf ? Promise.reject(new Error('sin PDF')) : Promise.resolve({ PdfBase64: 'PDF-PROFORMA' });
    } };
    vm.runInNewContext(codigo, { SGTL, window, localStorage: { getItem() { return 'token-prueba'; } },
        document: { getElementById: nodo, createElement() { return nodo('modal'); }, body: { appendChild() {} } } });
    return { window, nodo, llamadas, avisos, exitos, pendientes, cancelar() { aceptar = false; },
        fallar() { fallarPdf = true; }, pdfs: () => pdfs };
}
(async () => {
    for (const caso of ['enviar', 'cancelar', 'fallar']) {
        const e = entorno();
        e.window.enviarProformaPorEmail(16);
        assert.strictEqual(e.nodo('envioProformaEnviar').disabled, true);
        assert.strictEqual(e.llamadas[0].headers.Authorization, 'Bearer token-prueba');
        e.pendientes.shift().resolve({ Numero: 'PF-16', DestinatarioSugerido: 'cliente@example.com', Configurado: true });
        await tick();
        assert.strictEqual(e.nodo('envioProformaDestino').value, 'cliente@example.com');
        e.nodo('envioProformaDestino').value = 'destino@example.com';
        if (caso === 'cancelar') e.cancelar();
        if (caso === 'fallar') e.fallar();
        e.nodo('envioProformaEnviar').listeners.click();
        e.nodo('envioProformaEnviar').listeners.click();
        await tick();
        if (caso === 'enviar') {
            assert.strictEqual(e.llamadas.length, 2);
            assert.strictEqual(e.llamadas[1].type, 'POST');
            assert.deepStrictEqual(JSON.parse(e.llamadas[1].data), { Destinatario: 'destino@example.com', PdfBase64: 'PDF-PROFORMA' });
            e.pendientes.shift().resolve({ mensaje: 'Proforma enviada.' });
            await tick();
            assert.deepStrictEqual(e.exitos, ['Proforma enviada.']);
            assert.strictEqual(e.pdfs(), 1, 'el doble clic no duplica el envío');
        } else {
            assert.strictEqual(e.llamadas.length, 1);
            assert.strictEqual(e.nodo('envioProformaEnviar').disabled, false);
            assert.strictEqual(e.avisos.length, caso === 'fallar' ? 1 : 0);
        }
    }
    const e = entorno();
    e.window.enviarProformaPorEmail(15);
    e.window.enviarProformaPorEmail(16);
    e.pendientes[1].resolve({ Numero: 'PF-16', DestinatarioSugerido: 'actual@example.com', Configurado: true });
    await tick();
    e.pendientes[0].resolve({ Numero: 'PF-15', DestinatarioSugerido: 'viejo@example.com', Configurado: false });
    await tick();
    assert.strictEqual(e.nodo('envioProformaDestino').value, 'actual@example.com');
    assert.strictEqual(e.nodo('envioProformaEnviar').disabled, false);
    e.window.enviarProformaPorEmail(17);
    e.pendientes[2].resolve({ Numero: 'PF-17', Configurado: false });
    await tick();
    assert.strictEqual(e.nodo('envioProformaEnviar').disabled, true);
    assert.strictEqual(e.avisos.length, 1);
    console.log('OK: acciones y envío de proformas, destinatario, cancelación, error y respuestas tardías');
})().catch(error => { console.error(error); process.exitCode = 1; });
