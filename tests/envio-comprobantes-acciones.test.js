const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const cuenta = fs.readFileSync(path.join(raiz, 'assets/static/js/cuenta-corriente-clientes.js'), 'utf8');
const ui = fs.readFileSync(path.join(raiz, 'assets/static/js/sgtl-ui.js'), 'utf8');
const pagina = fs.readFileSync(path.join(raiz, 'cuenta-corriente-clientes.html'), 'utf8');

function hastaLlaveFinal(fuente, inicio) {
    const apertura = fuente.indexOf('{', inicio);
    assert.notStrictEqual(apertura, -1, 'falta el bloque de código');
    let nivel = 0;
    for (let i = apertura; i < fuente.length; i += 1) {
        if (fuente[i] === '{') nivel += 1;
        if (fuente[i] === '}') nivel -= 1;
        if (nivel === 0) return i + 1;
    }
    throw new Error('El bloque de código no cierra');
}

function funcion(fuente, nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.notStrictEqual(inicio, -1, 'falta la función ' + nombre);
    return fuente.slice(inicio, hastaLlaveFinal(fuente, inicio));
}

function accionesReales() {
    const inicioAcciones = ui.indexOf('var ACCIONES = {');
    assert.notStrictEqual(inicioAcciones, -1, 'falta el catálogo de acciones');
    const catalogo = ui.slice(inicioAcciones, hastaLlaveFinal(ui, inicioAcciones)) + ';';
    const sandbox = { window: {} };
    vm.runInNewContext([
        funcion(ui, 'escapar'), catalogo, funcion(ui, 'botonFila'), funcion(ui, 'accionesFila'),
        'window.SGTL = { botonFila: botonFila, accionesFila: accionesFila };',
        funcion(cuenta, 'tipoComprobante'), funcion(cuenta, 'estadoRecibo'),
        funcion(cuenta, 'accionesComprobante')
    ].join('\n'), sandbox, { filename: 'acciones-comprobantes.js' });
    return sandbox.accionesComprobante;
}

function probarAccionesDeTodosLosTipos() {
    const acciones = accionesReales();
    const casos = [
        { Tipo: 'FAC', Comprobante: 'FAC-A-0001-00000001' },
        { Tipo: 'REC', Comprobante: 'REC-X-0001-00000002' },
        { Tipo: 'REC', Comprobante: 'REC-X-0001-00000003', Estado: 'Aplicado' },
        { Tipo: 'NC', Comprobante: 'NC-A-0001-00000004' },
        { Tipo: 'ND', Comprobante: 'ND-A-0001-00000005' },
        { Tipo: 'FC', Comprobante: 'FC-A-0001-00000006' }
    ];
    casos.forEach(function (caso, indice) {
        const id = indice + 1;
        const html = acciones(Object.assign({ ComprobanteID: id, EstadoComprobante: 'EMITIDO' }, caso));
        const pdf = html.indexOf('data-accion="pdf"');
        const enviar = html.indexOf('data-accion="enviar"');
        assert.ok(pdf >= 0 && enviar > pdf, caso.Comprobante + ': Enviar por e-mail debe ir después de Ver PDF');
        assert.match(html, new RegExp('<button[^>]+data-accion="enviar"[^>]+data-id="' + id + '"[^>]+aria-label="Enviar por e-mail"'),
            caso.Comprobante + ': la acción debe corresponder al comprobante de la fila');
    });

    const anulado = acciones({ ComprobanteID: 7, Tipo: 'REC', Comprobante: 'REC-X-0001-00000007',
        Estado: 'Anulado', EstadoComprobante: 'ANULADO' });
    assert.doesNotMatch(anulado, /data-accion="enviar"/, 'el recibo anulado no debe ofrecer un envío ejecutable');
    assert.match(anulado, /No se puede enviar el recibo por e-mail: está anulado[\s\S]*?<button[^>]*disabled[^>]*>[\s\S]*?bi-envelope/,
        'el recibo anulado conserva la acción deshabilitada y explica el motivo');
}

function probarPieDelVisor() {
    const inicio = pagina.indexOf('id="modalVistaPreviaComprobante"');
    const fin = pagina.indexOf('id="modalEnviarComprobanteEmail"', inicio);
    assert.ok(inicio >= 0 && fin > inicio, 'deben existir el visor y el formulario de envío');
    const visor = pagina.slice(inicio, fin);
    assert.doesNotMatch(visor, /Enviar por e-mail|enviarVistaPreviaComprobante/,
        'el visor del PDF no debe ofrecer el envío');
    assert.match(visor, /id="imprimirVistaPreviaComprobante"/, 'el visor conserva Imprimir');
    assert.match(visor, /id="descargarVistaPreviaComprobante"/, 'el visor conserva Descargar PDF');
}

async function probarClicEnFilaYEnvio() {
    const inicio = cuenta.indexOf("porId('ccTablaCuerpo').addEventListener('click', function (event) {");
    assert.notStrictEqual(inicio, -1, 'falta el manejo de acciones de la tabla');
    const escucha = cuenta.slice(inicio, hastaLlaveFinal(cuenta, inicio) + 2);
    const campos = {
        btnConfirmarEnvioComprobante: { disabled: true },
        envioComprobanteDestino: { value: '', checkValidity: function () { return true; } },
        envioComprobantePerfil: { textContent: '' },
        modalEnviarComprobanteEmail: {}
    };
    const solicitudes = [];
    const avisos = [];
    let alHacerClic;
    let modalAbierto = false;
    const sandbox = {
        comprobanteActualId: null,
        secuenciaEnvioComprobante: 0,
        porId: function (id) {
            if (id === 'ccTablaCuerpo') return { addEventListener: function (evento, fn) {
                assert.strictEqual(evento, 'click');
                alHacerClic = fn;
            } };
            return campos[id];
        },
        bootstrap: { Modal: { getOrCreateInstance: function () { return { show: function () { modalAbierto = true; } }; } } },
        ocultarFeedbackEnvio: function () {},
        mostrarFeedbackEnvio: function () { throw new Error('No se esperaba un error de envío'); },
        apiGet: function (ruta) {
            solicitudes.push(['GET', ruta]);
            return Promise.resolve({ DestinatarioSugerido: 'cliente@empresa.com', Configurado: true,
                Service: 1, Perfil: 'Facturación' });
        },
        apiPost: function (ruta, cuerpo) {
            solicitudes.push(['POST', ruta, cuerpo]);
            return Promise.resolve({ mensaje: 'Comprobante enviado.' });
        },
        cerrarModalYNotificar: function (modal, mensaje) { avisos.push([modal, mensaje]); },
        window: {
            SGTL: { procesando: function () { return function () {}; } },
            generarComprobantePDFParaEmail: function (id) {
                assert.strictEqual(id, 42, 'se adjunta el PDF del comprobante elegido');
                return Promise.resolve({ PdfBase64: 'JVBERi0=' });
            }
        }
    };
    vm.runInNewContext([
        funcion(cuenta, 'abrirEnvioComprobante'),
        funcion(cuenta, 'enviarComprobantePorEmail'),
        escucha
    ].join('\n'), sandbox, { filename: 'cuenta-corriente-clientes.js' });
    const boton = { getAttribute: function (nombre) { return { 'data-id': '42', 'data-accion': 'enviar' }[nombre]; } };
    alHacerClic({ target: { closest: function (selector) {
        return selector === 'button[data-accion]' ? boton : null;
    } } });
    await new Promise(setImmediate);
    assert.strictEqual(modalAbierto, true, 'el clic en Acciones abre el formulario de envío');
    assert.strictEqual(sandbox.comprobanteActualId, 42);
    assert.deepStrictEqual(solicitudes, [['GET', '/comprobantes/42/email']],
        'el formulario consulta la configuración de envío del comprobante elegido');
    assert.strictEqual(campos.envioComprobanteDestino.value, 'cliente@empresa.com');
    assert.strictEqual(campos.btnConfirmarEnvioComprobante.disabled, false);

    sandbox.enviarComprobantePorEmail();
    await new Promise(setImmediate);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(solicitudes[1])), ['POST', '/comprobantes/42/email',
        { Destinatario: 'cliente@empresa.com', PdfBase64: 'JVBERi0=' }],
    'el formulario conserva el envío del PDF adjunto al destinatario');
    assert.deepStrictEqual(avisos, [['modalEnviarComprobanteEmail', 'Comprobante enviado.']]);
}

async function probarRespuestaViejaNoReemplazaDestinatario() {
    const campos = {
        btnConfirmarEnvioComprobante: { disabled: true },
        envioComprobanteDestino: { value: '' },
        envioComprobantePerfil: { textContent: '' },
        modalEnviarComprobanteEmail: {}
    };
    const pendientes = new Map();
    const errores = [];
    const sandbox = {
        comprobanteActualId: null,
        secuenciaEnvioComprobante: 0,
        porId: function (id) { return campos[id]; },
        bootstrap: { Modal: { getOrCreateInstance: function () { return { show: function () {} }; } } },
        ocultarFeedbackEnvio: function () {},
        mostrarFeedbackEnvio: function (tipo, mensaje) { errores.push([tipo, mensaje]); },
        textoError: function (error) { return error.message; },
        apiGet: function (ruta) {
            return new Promise(function (resolve, reject) { pendientes.set(ruta, { resolve, reject }); });
        }
    };
    vm.runInNewContext(funcion(cuenta, 'abrirEnvioComprobante'), sandbox,
        { filename: 'cuenta-corriente-clientes.js' });

    sandbox.abrirEnvioComprobante(41);
    sandbox.abrirEnvioComprobante(42);
    pendientes.get('/comprobantes/42/email').resolve({ DestinatarioSugerido: 'b@empresa.com',
        Configurado: true, Service: 2, Perfil: 'Perfil B' });
    await new Promise(setImmediate);
    pendientes.get('/comprobantes/41/email').resolve({ DestinatarioSugerido: 'a@empresa.com',
        Configurado: true, Service: 1, Perfil: 'Perfil A' });
    await new Promise(setImmediate);
    assert.strictEqual(sandbox.comprobanteActualId, 42);
    assert.strictEqual(campos.envioComprobanteDestino.value, 'b@empresa.com',
        'la respuesta tardía del comprobante A no debe cambiar el destinatario de B');
    assert.match(campos.envioComprobantePerfil.textContent, /Perfil B/,
        'la respuesta tardía tampoco debe cambiar el perfil mostrado para B');
    assert.strictEqual(campos.btnConfirmarEnvioComprobante.disabled, false);

    sandbox.abrirEnvioComprobante(43);
    sandbox.abrirEnvioComprobante(44);
    pendientes.get('/comprobantes/44/email').resolve({ DestinatarioSugerido: 'd@empresa.com',
        Configurado: true, Service: 4, Perfil: 'Perfil D' });
    await new Promise(setImmediate);
    pendientes.get('/comprobantes/43/email').reject(new Error('falló la solicitud anterior'));
    await new Promise(setImmediate);
    assert.strictEqual(campos.envioComprobanteDestino.value, 'd@empresa.com');
    assert.match(campos.envioComprobantePerfil.textContent, /Perfil D/,
        'un error tardío de C no debe ocultar la configuración válida de D');
    assert.deepStrictEqual(errores, [], 'un error de la solicitud anterior no debe aparecer en el formulario actual');
}

(async function () {
    probarAccionesDeTodosLosTipos();
    probarPieDelVisor();
    await probarClicEnFilaYEnvio();
    await probarRespuestaViejaNoReemplazaDestinatario();
    console.log('OK: Enviar por e-mail en Acciones para todos los comprobantes');
})().catch(function (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
});
