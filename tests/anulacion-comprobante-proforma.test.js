const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const pagina = fs.readFileSync(path.join(raiz, 'gestion-facturacion.html'), 'utf8');
const fuente = fs.readFileSync(path.join(raiz, 'assets', 'static', 'js', 'anulacion-factura-proforma.js'), 'utf8');
const controlador = fs.readFileSync(path.join(raiz, 'WebApi_TransporteSanchez', 'Controllers', 'ComprobantesController.cs'), 'utf8');

function funcion(fuenteCompleta, nombre) {
    const inicio = fuenteCompleta.indexOf('function ' + nombre + '(');
    assert.ok(inicio >= 0, 'falta ' + nombre);
    const apertura = fuenteCompleta.indexOf('{', inicio);
    let nivel = 0;
    for (let indice = apertura; indice < fuenteCompleta.length; indice += 1) {
        if (fuenteCompleta[indice] === '{') nivel += 1;
        if (fuenteCompleta[indice] === '}') nivel -= 1;
        if (nivel === 0) return fuenteCompleta.slice(inicio, indice + 1);
    }
    throw new Error('No se pudo leer ' + nombre);
}

function probarAccionFila() {
    const sandbox = {
        SGTL: {
            botonFila: (accion, opciones) => ({ accion, ...opciones }),
            accionesFila: botones => botones
        }
    };
    vm.runInNewContext(funcion(pagina, 'accionesProforma'), sandbox);
    for (const numero of ['FC-A-0001-00000012', 'FAC-A-0001-00000013']) {
        const acciones = sandbox.accionesProforma({ Proforma_ID: 7, Estado: 'Facturada', FacturaID: 101, FacturaNumero: numero });
        const anular = acciones.find(accion => accion.accion === 'anular');
        assert.strictEqual(anular.texto, 'Anular comprobante',
            numero + ': el tooltip de la acción coincide con el título del modal');
        assert.strictEqual(anular.datos.tipo, 'factura',
            'la acción conserva el flujo de nota de crédito cancelatoria');
    }
}

function probarMensajesApi() {
    const mensajes = [
        'La proforma no tiene un comprobante vigente para anular.',
        'El comprobante vinculado no está emitido.',
        'El comprobante tiene movimientos en la cuenta corriente y no admite un crédito cancelatorio por el total.',
        'El crédito cancelatorio debe relacionarse con el comprobante de la proforma.',
        'El comprobante de referencia no es válido para este cliente.',
        'Los importes del comprobante cambiaron.',
        'El comprobante indicado no es el comprobante vigente de la proforma.'
    ];
    mensajes.forEach(mensaje => assert.ok(controlador.includes(mensaje),
        'la API debe explicar el caso de FC como comprobante: ' + mensaje));
}

function elemento() {
    const clases = new Set();
    return {
        value: '', textContent: '', innerHTML: '', className: '', disabled: false, readOnly: false,
        classList: {
            add(clase) { clases.add(clase); },
            remove(clase) { clases.delete(clase); },
            contains(clase) { return clases.has(clase); }
        },
        listeners: {},
        addEventListener(evento, handler) { this.listeners[evento] = handler; },
        querySelectorAll() { return []; }
    };
}

async function probarModalYNotaCredito() {
    const ids = [
        'modalAnularFactura', 'ncProformaNumero', 'ncMensaje', 'ncFormulario', 'ncCliente', 'ncCuit',
        'ncFactura', 'ncFechaFactura', 'ncImporte', 'ncTipoComprobante', 'ncLetra', 'ncSucursal',
        'ncNumeroComprobante', 'ncFechaEmision', 'ncObservaciones', 'ncResultado', 'btnConfirmarNC', 'btnCerrarNC'
    ];
    const campos = Object.fromEntries(ids.map(id => [id, elemento()]));
    campos.btnCerrarNCX = elemento();
    campos.ncLetra.value = 'A';
    campos.ncSucursal.value = '0001';
    const camposEditables = [campos.ncTipoComprobante, campos.ncLetra, campos.ncSucursal, campos.ncFechaEmision, campos.ncObservaciones];
    campos.ncFormulario.querySelectorAll = () => camposEditables;
    let modalAgregado = false;
    let htmlModal = '';
    const document = {
        getElementById(id) {
            if (id === 'modalAnularFactura' && !modalAgregado) return null;
            return campos[id] || null;
        },
        createElement() {
            const contenedor = elemento();
            Object.defineProperty(contenedor, 'innerHTML', {
                get() { return htmlModal; },
                set(valor) { htmlModal = valor; }
            });
            contenedor.firstElementChild = campos.modalAnularFactura;
            return contenedor;
        },
        body: { appendChild() { modalAgregado = true; } }
    };
    const solicitudes = [];
    const toasts = [];
    let responderPost;
    let responderGetAnterior;
    let resolverConfigAnterior;
    let retenerGetId = 0;
    let retenerConfiguracion = false;
    let errorConfiguracion;
    let errorCatalogo;
    let tiposCredito = [{ Tipo: 'CI', Descripcion: 'Crédito interno', Impacto: 'C' }];
    const configuraciones = [];
    const comprobante = {
        ProformaID: 7, ProformaNumero: 'PF-00000007', FacturaID: 101, FacturaTipo: 'FC',
        FacturaNumero: 'FC-A-0001-00000012', ClienteID: 5, Cliente: 'Cliente', CUIT: '20123456789',
        FechaFactura: '2026-10-20', Neto: 100, IVA: 21, IvaPct: 21, OtrosImpuestos: 0,
        Total: 121, Cancelable: true
    };
    const window = {
        ConfiguracionFacturacion: { cargar(tipo, controles, vigente) {
            configuraciones.push(tipo);
            if (tipo === 'NC') return Promise.reject(new Error('El tipo NC no tiene una configuración de facturación activa.'));
            if (retenerConfiguracion) {
                retenerConfiguracion = false;
                return new Promise(resolve => { resolverConfigAnterior = () => {
                    if (!vigente || vigente()) campos.ncNumeroComprobante.value = 'Configuración anterior';
                    resolve();
                }; });
            }
            return errorConfiguracion ? Promise.reject(errorConfiguracion) : Promise.resolve();
        } },
        crypto: { randomUUID() { return '11111111-1111-4111-8111-111111111111'; } },
        localStorage: { getItem() { return 'token-prueba'; } },
        SGTL: {
            avisoFormulario(aviso, texto) { aviso.textContent = texto; },
            monto(valor) { return '$ ' + Number(valor).toFixed(2).replace('.', ','); },
            escapar(valor) { return String(valor).replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caracter])); },
            toastExito(texto) { toasts.push(texto); }
        }
    };
    const sandbox = {
        window, document, localStorage: window.localStorage, Promise, Date, Intl, Math,
        fetch(url, opciones) {
            solicitudes.push({ url, opciones });
            if (opciones.method === 'POST') return new Promise(resolve => { responderPost = resolve; });
            if (url.endsWith('/facturacion-config/tipos-emision-credito')) return Promise.resolve({
                ok: !errorCatalogo, status: errorCatalogo ? 500 : 200,
                json() { return Promise.resolve(errorCatalogo ? { error: errorCatalogo } : tiposCredito); }
            });
            const id = Number((url.match(/\/proformas\/(\d+)\//) || [])[1]);
            if (id === retenerGetId) return new Promise(resolve => { responderGetAnterior = resolve; });
            return Promise.resolve({ ok: true, status: 200, json() {
                return Promise.resolve({ ...comprobante, ProformaID: id, ProformaNumero: 'PF-' + id });
            } });
        }
    };
    vm.runInNewContext(fuente, sandbox, { filename: 'anulacion-factura-proforma.js' });
    window.FacturacionProformaAnulacion.abrir(7);
    await new Promise(resolve => setImmediate(resolve));

    assert.match(htmlModal, /data-bs-backdrop="static"/, 'el formulario no se cierra al tocar fuera');
    assert.match(htmlModal, />Anular comprobante<\/h5>/, 'el título describe FAC y FC');
    assert.match(htmlModal, /id="btnConfirmarNC"[^>]*>[\s\S]*?Anular comprobante<\/button>/,
        'el botón principal coincide con la acción');
    assert.match(htmlModal, /id="btnCerrarNC"[^>]*>Cancelar<\/button>/,
        'antes de emitir la nota de crédito, el pie ofrece Cancelar');
    assert.match(htmlModal, /id="btnCerrarNCX"/, 'la cruz se puede bloquear durante la emisión');
    for (const id of ['ncCliente', 'ncCuit', 'ncFactura', 'ncFechaFactura', 'ncImporte', 'ncNumeroComprobante']) {
        assert.match(htmlModal, new RegExp('<output id="' + id + '" class="sgtl-dato-fijo'),
            id + ': el dato fijo se presenta como texto');
    }
    assert.match(htmlModal, /<select id="ncTipoComprobante" class="form-select"/,
        'el tipo de crédito se elige entre los configurados');
    assert.match(htmlModal, />Comprobante a anular<\/span>/);
    assert.match(htmlModal, />Fecha del comprobante<\/span>/);
    for (const id of ['ncTipoComprobante', 'ncLetra', 'ncSucursal', 'ncFechaEmision', 'ncObservaciones']) {
        assert.match(htmlModal, new RegExp('<label class="form-label" for="' + id + '">'),
            id + ': el campo editable tiene etiqueta asociada');
    }
    assert.ok(solicitudes[0].url.endsWith('/proformas/7/factura-cancelatoria'),
        'primero se consulta el comprobante vinculado');
    assert.ok(solicitudes.some(solicitud => solicitud.url.endsWith('/facturacion-config/tipos-emision-credito')),
        'se consultan los créditos configurados');
    assert.strictEqual(campos.ncTipoComprobante.value, 'CI', 'el único crédito se preselecciona');
    assert.deepStrictEqual(configuraciones, ['CI'], 'NC inactiva no bloquea el crédito interno activo');
    assert.strictEqual(campos.ncFactura.value, 'FC-A-0001-00000012');
    assert.strictEqual(campos.ncFechaFactura.value, '20/10/2026',
        'la fecha fija se ve en el formato del sistema');
    assert.strictEqual(campos.ncImporte.value, '$ 121,00',
        'el importe fijo usa el formato del sistema');
    assert.ok(!/factura/i.test(campos.ncMensaje.textContent),
        'el aviso del FC no debe llamarlo factura');
    assert.strictEqual(campos.btnConfirmarNC.disabled, false);

    campos.btnConfirmarNC.listeners.click();
    assert.strictEqual(campos.btnConfirmarNC.disabled, true, 'el botón principal se bloquea mientras emite');
    assert.strictEqual(campos.btnCerrarNC.disabled, true, 'Cancelar se bloquea mientras emite');
    assert.strictEqual(campos.btnCerrarNCX.disabled, true, 'la cruz se bloquea mientras emite');
    assert.ok(camposEditables.every(campo => campo.disabled), 'los campos se bloquean mientras emite');
    let cierreEvitado = false;
    campos.modalAnularFactura.listeners['hide.bs.modal']({ preventDefault() { cierreEvitado = true; } });
    assert.strictEqual(cierreEvitado, true, 'Escape no cierra el modal mientras emite');

    responderPost({ ok: true, status: 201, json() {
        return Promise.resolve({ Numero: 'CI-A-0001-00000020', Total: 121 });
    } });
    await new Promise(resolve => setImmediate(resolve));
    const post = solicitudes.find(solicitud => solicitud.opciones.method === 'POST');
    assert.ok(post, 'la anulación emite un crédito interno');
    const cuerpo = JSON.parse(post.opciones.body);
    assert.strictEqual(cuerpo.Tipo, 'CI');
    assert.strictEqual(cuerpo.ProformaID, 7);
    assert.strictEqual(cuerpo.ComprobanteReferenciaID, 101);
    assert.strictEqual(cuerpo.Concepto, 'Crédito interno cancelatorio de FC-A-0001-00000012');
    assert.deepStrictEqual([cuerpo.Neto, cuerpo.IVA, cuerpo.OtrosImpuestos], [100, 21, 0],
        'la composición se toma del comprobante original sin editar el importe');
    assert.deepStrictEqual(toasts, ['Comprobante anulado con un crédito cancelatorio por el total.']);
    assert.strictEqual(campos.ncFormulario.classList.contains('d-none'), true,
        'el formulario editable se oculta tras emitir la NC');
    assert.strictEqual(campos.ncResultado.classList.contains('d-none'), false,
        'el resultado queda visible tras emitir la NC');
    assert.strictEqual(campos.btnCerrarNC.textContent, 'Cerrar');
    assert.strictEqual(campos.btnCerrarNC.disabled, false, 'Cerrar vuelve a estar disponible');
    assert.strictEqual(campos.btnCerrarNCX.disabled, false, 'la cruz vuelve a estar disponible');
    cierreEvitado = false;
    campos.modalAnularFactura.listeners['hide.bs.modal']({ preventDefault() { cierreEvitado = true; } });
    assert.strictEqual(cierreEvitado, false, 'Escape vuelve a cerrar el modal cuando termina');

    window.FacturacionProformaAnulacion.abrir(7);
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(campos.ncFormulario.classList.contains('d-none'), false,
        'al reabrir se restaura el formulario');
    campos.btnConfirmarNC.listeners.click();
    responderPost({ ok: false, status: 409, json() {
        return Promise.resolve({ error: 'El comprobante tiene movimientos en cuenta corriente.' });
    } });
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(campos.btnCerrarNC.disabled, false, 'Cancelar se restaura si la API rechaza la NC');
    assert.strictEqual(campos.btnCerrarNCX.disabled, false, 'la cruz se restaura si la API rechaza la NC');
    assert.ok(camposEditables.every(campo => !campo.disabled), 'los campos se restauran para corregir el formulario');
    assert.strictEqual(campos.btnConfirmarNC.disabled, false, 'el usuario puede volver a intentar');

    errorConfiguracion = new Error('El tipo CI no tiene una configuración de facturación activa.');
    window.FacturacionProformaAnulacion.abrir(7);
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(campos.ncMensaje.textContent,
        'El tipo CI no tiene una configuración de facturación activa.',
        'se muestra el rechazo real de la configuración');
    assert.strictEqual(campos.ncFactura.value, 'FC-A-0001-00000012',
        'el comprobante sigue visible aunque falle la configuración del crédito');
    assert.strictEqual(campos.btnConfirmarNC.disabled, true);

    errorConfiguracion = null;
    errorCatalogo = 'No se pudieron cargar los tipos de crédito.';
    window.FacturacionProformaAnulacion.abrir(7);
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(campos.ncFactura.value, 'FC-A-0001-00000012',
        'el comprobante sigue visible aunque falle el catálogo de créditos');
    assert.strictEqual(campos.ncMensaje.textContent, errorCatalogo);
    assert.strictEqual(campos.btnConfirmarNC.disabled, true);

    errorCatalogo = null;
    tiposCredito = [
        { Tipo: 'CI', Descripcion: 'Crédito interno', Impacto: 'C' },
        { Tipo: 'CRE', Descripcion: 'Crédito especial', Impacto: 'C' }
    ];
    window.FacturacionProformaAnulacion.abrir(7);
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(campos.ncTipoComprobante.value, '',
        'con varios créditos no se presume cuál corresponde');
    assert.strictEqual(campos.btnConfirmarNC.disabled, true);
    campos.ncTipoComprobante.value = 'CRE';
    campos.ncTipoComprobante.listeners.change();
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(campos.btnConfirmarNC.disabled, false,
        'la elección explícita habilita la cancelación');
    assert.strictEqual(configuraciones[configuraciones.length - 1], 'CRE');
    campos.btnConfirmarNC.listeners.click();
    const creditoElegido = JSON.parse(solicitudes.filter(solicitud => solicitud.opciones.method === 'POST').slice(-1)[0].opciones.body);
    assert.strictEqual(creditoElegido.Tipo, 'CRE');
    assert.strictEqual(creditoElegido.Concepto, 'Crédito especial cancelatorio de FC-A-0001-00000012');
    responderPost({ ok: false, status: 409, json() { return Promise.resolve({ error: 'La operación cambió.' }); } });
    await new Promise(resolve => setImmediate(resolve));

    tiposCredito = [];
    window.FacturacionProformaAnulacion.abrir(7);
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(campos.ncFactura.value, 'FC-A-0001-00000012',
        'sin tipos de crédito también permanece visible el comprobante');
    assert.match(campos.ncMensaje.textContent, /No hay tipos de crédito activos/);
    assert.strictEqual(campos.btnConfirmarNC.disabled, true);

    tiposCredito = [{ Tipo: 'CI', Descripcion: 'Crédito interno', Impacto: 'C' }];
    retenerGetId = 8;
    window.FacturacionProformaAnulacion.abrir(8);
    window.FacturacionProformaAnulacion.abrir(9);
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(campos.ncProformaNumero.textContent, 'Proforma PF-9');
    responderGetAnterior({ ok: true, status: 200, json() {
        return Promise.resolve({ ...comprobante, ProformaID: 8, ProformaNumero: 'PF-8' });
    } });
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(campos.ncProformaNumero.textContent, 'Proforma PF-9',
        'la respuesta GET anterior no altera el modal nuevo');

    retenerGetId = 0;
    retenerConfiguracion = true;
    window.FacturacionProformaAnulacion.abrir(8);
    await new Promise(resolve => setImmediate(resolve));
    window.FacturacionProformaAnulacion.abrir(9);
    await new Promise(resolve => setImmediate(resolve));
    resolverConfigAnterior();
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(campos.ncProformaNumero.textContent, 'Proforma PF-9',
        'la configuración anterior no altera el modal nuevo');
    assert.notStrictEqual(campos.ncNumeroComprobante.value, 'Configuración anterior');

    campos.btnConfirmarNC.listeners.click();
    window.FacturacionProformaAnulacion.abrir(10);
    await new Promise(resolve => setImmediate(resolve));
    responderPost({ ok: true, status: 201, json() {
        return Promise.resolve({ Numero: 'CI-A-0001-00000021', Total: 121 });
    } });
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(campos.ncProformaNumero.textContent, 'Proforma PF-10',
        'la respuesta POST anterior no altera el modal nuevo');
    assert.strictEqual(campos.ncFormulario.classList.contains('d-none'), false);
    assert.strictEqual(campos.ncResultado.classList.contains('d-none'), true);
    assert.strictEqual(toasts.length, 1, 'la respuesta POST anterior no avisa sobre el modal nuevo');
}

probarAccionFila();
probarMensajesApi();
probarModalYNotaCredito().then(() => console.log('OK: anulación de comprobante desde proforma'))
    .catch(error => { console.error(error.stack || error); process.exitCode = 1; });
