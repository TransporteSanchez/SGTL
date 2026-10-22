const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const fuente = fs.readFileSync(path.join(raiz, 'assets', 'static', 'js', 'cuenta-corriente-clientes.js'), 'utf8');
const pagina = fs.readFileSync(path.join(raiz, 'cuenta-corriente-clientes.html'), 'utf8');

function extraerFuncion(nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.notStrictEqual(inicio, -1, 'falta la función ' + nombre);
    const apertura = fuente.indexOf('{', inicio);
    let nivel = 0;
    for (let i = apertura; i < fuente.length; i += 1) {
        if (fuente[i] === '{') nivel += 1;
        if (fuente[i] === '}') nivel -= 1;
        if (nivel === 0) return fuente.slice(inicio, i + 1);
    }
    throw new Error('no se pudo extraer ' + nombre);
}

function probarCierreYAviso() {
    const modal = {
        listeners: {},
        addEventListener: function (evento, handler) { this.listeners[evento] = handler; },
        removeEventListener: function (evento) { delete this.listeners[evento]; }
    };
    const llamadas = [];
    const sandbox = {
        porId: function (id) {
            assert.strictEqual(id, 'modalPrueba');
            return modal;
        },
        window: {
            SGTL: {
                modal: function (elemento, accion) {
                    llamadas.push(['modal', elemento, accion]);
                    elemento.listeners['hidden.bs.modal']();
                },
                toastExito: function (mensaje) { llamadas.push(['toast', mensaje]); }
            }
        }
    };

    vm.runInNewContext(extraerFuncion('cerrarModalYNotificar'), sandbox,
        { filename: 'cuenta-corriente-clientes.js' });
    sandbox.cerrarModalYNotificar('modalPrueba', 'Se generó la Factura FAC-00000001 correctamente.');

    assert.deepStrictEqual(llamadas, [
        ['modal', modal, 'hide'],
        ['toast', 'Se generó la Factura FAC-00000001 correctamente.']
    ], 'debe cerrar primero el formulario y luego informar el número del comprobante');
}

function probarFlujosYDependencias() {
    const recibo = extraerFuncion('emitirRecibo');
    const comprobante = extraerFuncion('emitirComprobante');
    const altaRecibo = extraerFuncion('abrirNuevoRecibo');
    const altaComprobante = extraerFuncion('abrirNuevoComprobante');
    assert.match(recibo, /cerrarModalYNotificar\('modalNuevoRecibo'/,
        'al emitir un Recibo debe cerrar su formulario y mostrar el aviso flotante');
    assert.match(recibo, /recibo\.Numero/,
        'el aviso del Recibo debe informar el número generado');
    assert.match(comprobante, /cerrarModalYNotificar\('modalNuevoComprobante'/,
        'al emitir Factura, NC o ND debe cerrar su formulario y mostrar el aviso flotante');
    assert.match(comprobante, /'Factura'[\s\S]*'Nota de crédito'[\s\S]*'Nota de débito'[\s\S]*comprobante\.Numero/,
        'el aviso debe identificar Factura, NC o ND e informar su número generado');
    assert.match(altaRecibo, /modalNuevoReciboTitulo'\)\.textContent = 'Registrar recibo'/,
        'el formulario de recibo se titula igual que su botón (§6.1)');
    assert.match(altaComprobante, /cmpTitulo'\)\.textContent = tipo === 'FAC' \? 'Emitir factura directa' : 'Emitir ' \+ nombreTipoComprobante\(tipo\)/,
        'los formularios de factura, NC y ND se titulan igual que su opción del menú (§6.1)');
    assert.match(pagina, /assets\/static\/css\/sgtl\.css/,
        'Cuenta Corriente debe cargar los estilos de los avisos flotantes');
    assert.match(pagina, /assets\/static\/js\/sgtl-ui\.js[\s\S]*assets\/static\/js\/cuenta-corriente-clientes\.js/,
        'Cuenta Corriente debe cargar SGTL antes de usar el aviso flotante');
}

function probarAccionesPorTipoDeComprobante() {
    // Botones de cada fila (§1.4 del design system): los mismos cuatro en todas, en este orden;
    // lo que no se puede hacer queda deshabilitado con el motivo.
    const sandbox = {
        window: {
            SGTL: {
                botonFila: function (accion, opciones) {
                    return { accion: accion, texto: opciones.texto || '', deshabilitado: !!opciones.deshabilitado };
                },
                accionesFila: function (botones) { return botones; }
            }
        }
    };
    vm.runInNewContext([extraerFuncion('tipoComprobante'), extraerFuncion('estadoRecibo'), extraerFuncion('accionesComprobante')].join('\n'),
        sandbox, { filename: 'cuenta-corriente-clientes.js' });
    function botones(item) {
        return JSON.parse(JSON.stringify(sandbox.accionesComprobante(Object.assign({ ComprobanteID: 7 }, item)))).map(function (b) {
            return b.accion + (b.deshabilitado ? ' (deshabilitado)' : '');
        });
    }

    assert.deepStrictEqual(botones({ Tipo: 'FAC', EstadoComprobante: 'EMITIDO' }),
        ['ver', 'editar (deshabilitado)', 'pdf', 'anular (deshabilitado)'],
    'una factura se ve y tiene PDF; editar y anular quedan deshabilitados');
    assert.deepStrictEqual(botones({ Tipo: 'REC', EstadoComprobante: 'EMITIDO' }),
        ['ver', 'editar', 'pdf', 'anular'],
    'un recibo emitido se puede editar y anular');
    assert.deepStrictEqual(botones({ Tipo: 'REC', EstadoComprobante: 'ANULADO' }),
        ['ver', 'editar (deshabilitado)', 'pdf', 'eliminar'],
    'un recibo anulado no se edita ni se vuelve a anular: se elimina');
    ['NC', 'ND'].forEach(function (tipo) {
        assert.deepStrictEqual(botones({ Tipo: tipo, EstadoComprobante: 'EMITIDO' }),
            ['ver', 'editar (deshabilitado)', 'pdf', 'anular (deshabilitado)'],
        tipo + ' no se edita ni se anula');
    });
    assert.deepStrictEqual(botones({ Comprobante: 'REC-00000004', Estado: 'Aplicado' }),
        ['ver', 'editar', 'pdf', 'anular'],
    'un recibo aplicado a una factura conserva sus acciones');
}

function crearClase() {
    const clases = {};
    return {
        add: function (nombre) { clases[nombre] = true; },
        remove: function (nombre) { delete clases[nombre]; },
        toggle: function (nombre, activo) { if (activo) clases[nombre] = true; else delete clases[nombre]; },
        contains: function (nombre) { return !!clases[nombre]; }
    };
}

function crearCampo() {
    return { value: '', textContent: '', innerHTML: '', disabled: false, readOnly: false, className: '', classList: crearClase() };
}

function probarFormularioDeFacturaSoloLectura() {
    const ids = [
        'cmpTitulo', 'cmpMensaje', 'cmpCliente', 'cmpFechaEmision', 'cmpFechaVencimiento', 'cmpTipoComprobante',
        'cmpLetra', 'cmpSucursal', 'cmpNumeroComprobante', 'cmpConcepto', 'cmpNeto', 'cmpIvaPct',
        'cmpIvaImporte', 'cmpOtros', 'cmpTotal', 'cmpObservaciones', 'cmpVencimientoGrupo',
        'cmpReferenciaGrupo', 'cmpAplicacionesGrupo', 'cmpSoloLecturaRelacion', 'cmpDetalleLectura',
        'cmpDetalleLecturaCuerpo', 'cmpAplicacionesLectura', 'cmpAplicacionesLecturaCuerpo',
        'cmpError', 'btnEmitirComprobante', 'btnCerrarComprobante'
    ];
    const campos = {};
    ids.forEach(function (id) { campos[id] = crearCampo(); });
    const camposFormulario = [campos.cmpCliente, campos.cmpFechaEmision, campos.cmpFechaVencimiento,
        campos.cmpTipoComprobante, campos.cmpLetra, campos.cmpSucursal, campos.cmpNumeroComprobante,
        campos.cmpConcepto, campos.cmpNeto, campos.cmpIvaPct, campos.cmpIvaImporte, campos.cmpOtros,
        campos.cmpObservaciones];
    campos.modalNuevoComprobante = {
        querySelectorAll: function () { return camposFormulario; },
        classList: crearClase()
    };
    let modalAbierto = false;
    const sandbox = {
        porId: function (id) { return campos[id]; },
        fechaIsoLocal: function (valor) { return String(valor).substring(0, 10); },
        ponerFecha: function (id, valor) { campos[id].value = valor || ''; },
        centavos: function (valor) { return Math.round(Number(valor || 0) * 100); },
        formatearCentavos: function (valor) { return '$' + Number(valor).toFixed(2); },
        dinero: function (valor) { return '$ ' + Number(valor).toFixed(2); },
        escapar: function (valor) { return String(valor == null ? '' : valor); },
        nombreTipoComprobante: function () { return 'Factura directa'; },
        bootstrap: { Modal: { getOrCreateInstance: function () { return { show: function () { modalAbierto = true; } }; } } },
        window: { SelectClientePredictivo: { sincronizar: function () {}, establecerDeshabilitado: function () {} } }
    };
    vm.runInNewContext(extraerFuncion('tipoComprobante') + '\n' + extraerFuncion('porcentajeIvaLectura') + '\n' + extraerFuncion('presentarComprobanteSoloLectura'), sandbox,
        { filename: 'cuenta-corriente-clientes.js' });
    sandbox.presentarComprobanteSoloLectura({
        ComprobanteID: 17, Tipo: 'FAC', Numero: 'FAC-00000017', ClienteID: 4, RazonSocial: 'Cliente SA', CUIT: '30-12345678-9',
        FechaEmision: '2026-10-22T00:00:00', FechaVencimiento: '2026-11-01T00:00:00', Letra: 'A', Sucursal: '0001',
        Concepto: 'Servicio de transporte', Neto: 1000, IVA: 210, OtrosImpuestos: 10, Total: 1220,
        Observaciones: 'Pago a 30 días', Detalle: [{ Concepto: 'Servicio de transporte', Cantidad: 1, Unidad: 'Viaje', Total: 1220 }],
        ProformaNumero: 'PF-00000002', ComprobantesCancelados: []
    });

    assert.strictEqual(campos.cmpTitulo.textContent, 'Ver Factura directa FAC-00000017',
        'la consulta debe identificar la factura abierta, como "Ver proforma N" en proformas');
    assert.strictEqual(campos.cmpFechaEmision.value, '2026-10-22', 'la fecha va al selector de fechas (§7.1)');
    assert.ok(camposFormulario.every(function (campo) { return campo.disabled; }),
        'todos los campos del formulario de consulta deben quedar deshabilitados');
    assert.ok(campos.btnEmitirComprobante.classList.contains('d-none'),
        'la consulta no puede mostrar la acción de emitir');
    assert.match(campos.cmpDetalleLecturaCuerpo.innerHTML, /Servicio de transporte/,
        'la consulta debe mostrar el detalle del comprobante');
    assert.ok(modalAbierto, 'la consulta debe abrir el formulario en modo solo lectura');
    assert.match(campos.cmpIvaPct.innerHTML, />21%</,
        'sin % en las líneas, el IVA sale de IVA ÷ neto cuando da una alícuota válida (210 / 1000 = 21%)');
    assert.ok(campos.modalNuevoComprobante.classList.contains('cc-solo-lectura'),
        'en solo lectura no se muestran los asteriscos de obligatorio');
}

function probarDistribucionDeRecibo() {
    const distribuir = extraerFuncion('distribuirRecibo');
    const fifo = extraerFuncion('distribuirImportePorVencimiento');
    const formato = extraerFuncion('formatearCentavos');
    const importe = { value: '500.000,00' };
    const error = { textContent: '' };
    const filas = [
        filaRecibo(3, '2026-11-30', '2026-10-03', 20000000),
        filaRecibo(2, '2026-10-15', '2026-10-02', 20000000),
        filaRecibo(1, '2026-10-15', '2026-10-01', 20000000)
    ];
    let resumenActualizado = false;
    const sandbox = {
        porId: function (id) {
            if (id === 'reciboFormaImporte') return importe;
            if (id === 'reciboError') return error;
            return null;
        },
        document: { querySelectorAll: function () { return filas; } },
        centavos: function (valor) {
            return Math.round(Number(String(valor).replace(/\./g, '').replace(',', '.')) * 100);
        },
        window: {
            SGTL: { formatearMontoCentavos: function (centavos) {
                return (centavos / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } }
        },
        actualizarResumenRecibo: function () { resumenActualizado = true; }
    };
    vm.runInNewContext(fifo, sandbox, { filename: 'cuenta-corriente-clientes.js' });
    vm.runInNewContext(formato, sandbox, { filename: 'cuenta-corriente-clientes.js' });
    vm.runInNewContext(distribuir, sandbox, { filename: 'cuenta-corriente-clientes.js' });
    sandbox.distribuirRecibo();

    assert.deepStrictEqual(filas.map(function (fila) {
        return { id: Number(fila.input.getAttribute('data-id')), marcado: fila.check.checked, valor: fila.input.value };
    }), [
        { id: 3, marcado: true, valor: '100.000,00' },
        { id: 2, marcado: true, valor: '200.000,00' },
        { id: 1, marcado: true, valor: '200.000,00' }
    ], 'debe distribuir por vencimiento y dejar una aplicación parcial en la última Factura');
    assert.ok(resumenActualizado, 'debe recalcular los totales después de distribuir');
    assert.match(pagina, /id="btnDistribuirRecibo"/, 'el formulario debe ofrecer el botón Distribuir');
    assert.match(pagina, /id="reciboFormaImporte"\s+type="text"\s+inputmode="decimal"/,
        'el importe del Recibo debe aceptar la máscara argentina');
}

function filaRecibo(id, vencimiento, emision, saldoCentavos) {
    const check = { checked: false };
    const input = {
        disabled: true,
        value: '0,00',
        getAttribute: function (nombre) {
            return {
                'data-id': String(id),
                'data-pendiente': String(saldoCentavos / 100),
                'data-pendiente-centavos': String(saldoCentavos),
                'data-vencimiento': vencimiento,
                'data-emision': emision
            }[nombre];
        }
    };
    return {
        check: check,
        input: input,
        querySelector: function (selector) {
            return selector === '.cc-recibo-check' ? check : input;
        }
    };
}

function probarDistribucionDeNotaCredito() {
    const distribuir = extraerFuncion('distribuirNotaCredito');
    const fifo = extraerFuncion('distribuirImportePorVencimiento');
    const formato = extraerFuncion('formatearCentavos');
    const importe = { value: '500.000,00' };
    const error = { textContent: '' };
    const filas = [
        filaNotaCredito(3, '2026-11-30', '2026-10-03', 20000000),
        filaNotaCredito(2, '2026-10-15', '2026-10-02', 20000000),
        filaNotaCredito(1, '2026-10-15', '2026-10-01', 20000000)
    ];
    let resumenActualizado = false;
    const sandbox = {
        porId: function (id) {
            if (id === 'cmpImporteTotalNC') return importe;
            if (id === 'cmpError') return error;
            return null;
        },
        document: { querySelectorAll: function () { return filas; } },
        centavos: function (valor) {
            return Math.round(Number(String(valor).replace(/\./g, '').replace(',', '.')) * 100);
        },
        window: {
            SGTL: { formatearMontoCentavos: function (centavos) {
                return (centavos / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } }
        },
        actualizarResumenNotaCredito: function () { resumenActualizado = true; }
    };
    vm.runInNewContext(fifo, sandbox, { filename: 'cuenta-corriente-clientes.js' });
    vm.runInNewContext(formato, sandbox, { filename: 'cuenta-corriente-clientes.js' });
    vm.runInNewContext(distribuir, sandbox, { filename: 'cuenta-corriente-clientes.js' });
    sandbox.distribuirNotaCredito();

    assert.deepStrictEqual(filas.map(function (fila) {
        return { id: Number(fila.input.getAttribute('data-id')), marcado: fila.check.checked, valor: fila.input.value };
    }), [
        { id: 3, marcado: true, valor: '100.000,00' },
        { id: 2, marcado: true, valor: '200.000,00' },
        { id: 1, marcado: true, valor: '200.000,00' }
    ], 'la NC debe distribuir su importe por vencimiento y permitir una última aplicación parcial');
    assert.ok(resumenActualizado, 'la NC debe recalcular su resumen después de distribuir');
    assert.match(pagina, /id="cmpImporteTotalNC"/, 'la NC debe permitir ingresar el importe a acreditar');
    assert.match(pagina, /id="btnDistribuirNC"/, 'la NC debe ofrecer el botón Distribuir');
    assert.match(pagina, /id="cmpFacturasNC"/, 'la NC debe mostrar una grilla de Facturas aplicables');
}

function filaNotaCredito(id, vencimiento, emision, saldoCentavos) {
    const check = { checked: false };
    const input = {
        disabled: true,
        value: '0,00',
        getAttribute: function (nombre) {
            return {
                'data-id': String(id),
                'data-pendiente-centavos': String(saldoCentavos),
                'data-vencimiento': vencimiento,
                'data-emision': emision
            }[nombre];
        }
    };
    return {
        check: check,
        input: input,
        querySelector: function (selector) {
            return selector === '.cc-nc-check' ? check : input;
        }
    };
}

probarCierreYAviso();
probarFlujosYDependencias();
probarAccionesPorTipoDeComprobante();
probarFormularioDeFacturaSoloLectura();
probarDistribucionDeRecibo();
probarDistribucionDeNotaCredito();
console.log('OK: cierre y aviso al emitir comprobantes');
