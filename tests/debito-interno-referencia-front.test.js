const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const fuente = fs.readFileSync(path.join(__dirname, '..', 'assets/static/js/cuenta-corriente-clientes.js'), 'utf8');
function funcion(nombre) {
    const inicio = fuente.indexOf('function ' + nombre + '(');
    assert.ok(inicio >= 0, nombre);
    let nivel = 0;
    for (let i = fuente.indexOf('{', inicio); i < fuente.length; i++) {
        if (fuente[i] === '{') nivel++;
        if (fuente[i] === '}' && --nivel === 0) return fuente.slice(inicio, i + 1);
    }
}
(async () => {
    const clases = new Set(['d-none']), campos = {};
    ['cmpReferencia', 'cmpReferenciaEtiqueta', 'cmpReferenciaAyuda', 'btnEmitirComprobante'].forEach(id => { campos[id] = {}; });
    campos.cmpReferenciaGrupo = { classList: { toggle(clase, ocultar) { if (ocultar) clases.add(clase); else clases.delete(clase); } } };
    const solicitudes = [];
    let cliente = 1;
    const c = { comprobanteTipo: 'D', comprobanteModo: 'debito', comprobanteOperacion: 'op', facturasReferencia: [], validadorVinculoDebito: null,
        porId: id => campos[id], clienteComprobanteActual: () => ({ ClienteID: cliente }), escapar: String,
        window: { SGTL: { limpiarError() {}, marcarError() {}, avisoFormulario() {} } },
        apiGet: ruta => new Promise((resolve, reject) => solicitudes.push({ ruta, resolve, reject })) };
    vm.createContext(c);
    vm.runInContext(['esTipoInterno', 'validarVinculoDebito', 'cargarReferenciaDebito', 'aplicarImportesFacturaReferencia'].map(funcion).join('\n'), c);
    c.window.SGTL.validador = reglas => ({ validarTodo() {
        return reglas.every(r => !r.validar(campos[r.id].value));
    } });
    c.window.SGTL.revisarFormulario = () => {};
    const primera = c.cargarReferenciaDebito(1);
    assert.strictEqual(clases.has('d-none'), false);
    assert.strictEqual(campos.cmpReferencia.value, '');
    solicitudes[0].resolve([{ ComprobanteID: 10, Tipo: 'FC', Numero: 'FC-1', FechaEmision: '2026-10-20', SaldoPendiente: 0 },
        { ComprobanteID: 11, Tipo: 'FAC', Numero: 'FAC-1' }]);
    await primera;
    assert.ok(campos.cmpReferencia.innerHTML.includes('FC-1'));
    assert.ok(!campos.cmpReferencia.innerHTML.includes('FAC-1'));
    assert.ok(campos.cmpReferencia.innerHTML.includes('Sin vincular'));
    c.aplicarImportesFacturaReferencia(); // En modo débito no debe copiar importes del FC.
    const vieja = c.cargarReferenciaDebito(1);
    cliente = 2;
    const nueva = c.cargarReferenciaDebito(2);
    solicitudes[2].resolve([{ ComprobanteID: 20, Tipo: 'FC', Numero: 'FC-2', FechaEmision: '2026-10-20' }]);
    await nueva;
    solicitudes[1].resolve([{ ComprobanteID: 10, Tipo: 'FC', Numero: 'FC-1' }]);
    await vieja;
    assert.ok(campos.cmpReferencia.innerHTML.includes('FC-2'));
    assert.ok(!campos.cmpReferencia.innerHTML.includes('FC-1'), 'no se ofrecen referencias del cliente anterior');

    Object.assign(campos, {
        cmpTipoSeleccion: { value: 'D' }, cmpError: {}, cmpFechaEmision: { value: '2026-10-27' },
        cmpFechaVencimiento: { value: '2026-11-06' }, cmpConcepto: { value: 'Ajuste de deuda' },
        cmpNeto: { value: '100,00' }, cmpOtros: { value: '0,00' }, cmpIvaPct: { value: '21' },
        cmpLetra: { value: 'A' }, cmpSucursal: { value: '0001' }, cmpObservaciones: { value: '' }
    });
    const emisiones = [];
    Object.assign(c, { token: () => 'sesion', hoyIso: () => '2026-10-27', primerMontoInvalido: () => null,
        recalcularComprobante: () => ({ neto: 10000, iva: 2100, otros: 0, total: 12100 }),
        apiPost(ruta, datos) { emisiones.push(datos); return Promise.resolve({ Numero: 'D-A-1' }); },
        cerrarModalYNotificar() {}, cargarCuenta() {} });
    c.window.SGTL.procesando = () => () => {};
    vm.runInContext(funcion('emitirComprobante'), c);
    campos.cmpReferencia.value = '20';
    await c.emitirComprobante();
    assert.strictEqual(emisiones[0].ComprobanteReferenciaID, 20);
    assert.strictEqual(emisiones[0].Neto, 100, 'se conserva el importe nuevo del débito');
    assert.strictEqual(emisiones[0].Aplicaciones, null);
    campos.cmpReferencia.value = '';
    await c.emitirComprobante();
    assert.strictEqual(emisiones[1].ComprobanteReferenciaID, null, 'vincular sigue siendo opcional');
    campos.cmpReferencia.value = '999';
    c.emitirComprobante();
    assert.strictEqual(emisiones.length, 2, 'rechaza referencias ajenas a la lista del cliente');
    campos.cmpReferencia.value = '20'; campos.cmpFechaEmision.value = '2026-10-19';
    c.emitirComprobante();
    assert.strictEqual(emisiones.length, 2, 'rechaza la emisión anterior al origen');
    c.comprobanteTipo = 'ND';
    await c.cargarReferenciaDebito(2);
    assert.strictEqual(clases.has('d-none'), true);
    assert.strictEqual(campos.cmpReferencia.value, '');
    console.log('OK: referencia opcional del débito, cambio de cliente, importes independientes y validaciones');
})().catch(e => { console.error(e); process.exitCode = 1; });
