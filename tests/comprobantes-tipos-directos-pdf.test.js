const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'assets', 'static', 'js', 'factura-pdf.js'), 'utf8');

function preparar(factura) {
    const textos = [];
    let consultasEmpresa = 0;
    class Documento {
        constructor() {
            this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
            this.lastAutoTable = { finalY: 130 };
        }
        setTextColor() { return this; }
        setDrawColor() { return this; }
        setLineWidth() { return this; }
        setFillColor() { return this; }
        setFont() { return this; }
        setFontSize() { return this; }
        rect() { return this; }
        line() { return this; }
        text(valor) { textos.push(valor); return this; }
        getTextWidth(valor) { return String(valor).length; }
        splitTextToSize(valor) { return String(valor).split('\n'); }
        autoTable() { return this; }
        getNumberOfPages() { return 1; }
        setPage() { return this; }
        output(formato) { return formato === 'blob' ? { tipo: 'pdf' } : new ArrayBuffer(0); }
    }
    const sandbox = {
        window: {
            jspdf: { jsPDF: Documento },
            SGTLEmpresa: {
                obtener: function () {
                    consultasEmpresa += 1;
                    return Promise.resolve({ nombre: 'Transporte de prueba', lineas: [], logo: null });
                }
            }
        },
        localStorage: { getItem: function (clave) { return clave === 'token' ? 'token-de-prueba' : 'usuario'; } },
        fetch: function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve(factura); } }); },
        Promise, Date, Number, String, Array, Uint8Array
    };
    vm.runInNewContext(fuente, sandbox, { filename: 'factura-pdf.js' });
    return { pdf: sandbox.window.prepararComprobantePDF(19), textos, consultasEmpresa: () => consultasEmpresa };
}

function comprobante(tipo, descripcion) {
    return {
        Tipo: tipo, TipoDescripcion: descripcion, Numero: tipo + '-A-0001-00000019',
        FechaEmision: '2026-10-26', RazonSocial: 'Cliente de prueba', CUIT: '30-12345678-9',
        Domicilio: 'Calle 1', CondicionFiscal: 'Responsable inscripto',
        CondicionComercial: 'Contado', Concepto: 'Servicio', Neto: 100, Total: 121,
        Detalle: [], EstadoDocumental: 'Emitido', EstadoFinanciero: 'Pendiente'
    };
}

async function ejecutar() {
    const directo = preparar(comprobante('FC', 'Comprobante interno'));
    const pdfDirecto = await directo.pdf;
    assert.ok(directo.textos.includes('COMPROBANTE INTERNO'),
        'FC debe imprimir el título definido en TIPOS_COMPROBANTE');
    assert.strictEqual(pdfDirecto.nombreArchivo, 'Comprobante_interno_FC-A-0001-00000019.pdf',
        'el PDF de FC debe identificarse por su descripción y número');
    assert.strictEqual(directo.consultasEmpresa(), 1, 'el PDF debe obtener los datos de la empresa');

    const factura = preparar(comprobante('FAC', 'Factura interna'));
    const pdfFactura = await factura.pdf;
    assert.ok(factura.textos.includes('FACTURA'), 'FAC conserva su título de documento');
    assert.strictEqual(pdfFactura.nombreArchivo, 'Factura_FAC-A-0001-00000019.pdf',
        'FAC conserva su nombre de archivo');

    const sinDescripcion = preparar(comprobante('FC', ''));
    await assert.rejects(sinDescripcion.pdf, /no se puede imprimir/i,
        'un tipo desconocido sin descripción del catálogo no debe generar un PDF genérico');
    assert.strictEqual(sinDescripcion.consultasEmpresa(), 0,
        'un tipo inválido no debe iniciar la generación del documento');
    console.log('OK: PDF de comprobantes directos configurados y tipos existentes');
}

ejecutar().catch(function (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
});
