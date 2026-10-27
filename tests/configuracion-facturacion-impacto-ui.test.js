const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const fuente = fs.readFileSync(path.join(raiz, 'assets/static/js/configuracion-facturacion.js'), 'utf8');
const html = fs.readFileSync(path.join(raiz, 'configuracion-facturacion.html'), 'utf8');
const ids = new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g), function (match) { return match[1]; }));

const tipos = [
    { FactTipo_ID: 1, Tipo: 'D', Descripcion: 'Débito interno', Impacto: 'C', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: true, PuedeCambiarImpacto: true, PuedeCambiarSigla: true, PuedeCambiarLetra: true, EsElectronico: false },
    { FactTipo_ID: 2, Tipo: 'D', Descripcion: 'Débito interno', Impacto: 'C', LetraPredeterminada: 'B', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: true, PuedeCambiarImpacto: true, PuedeCambiarSigla: true, PuedeCambiarLetra: true, EsElectronico: false },
    { FactTipo_ID: 3, Tipo: 'C', Descripcion: 'Crédito interno', Impacto: 'C', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: false, PuedeCambiarImpacto: false, PuedeCambiarSigla: false, PuedeCambiarLetra: false, EsElectronico: true },
    { FactTipo_ID: 4, Tipo: 'FAC', Descripcion: 'Factura', Impacto: 'D', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: false, PuedeCambiarImpacto: false, PuedeCambiarSigla: false, PuedeCambiarLetra: false, EsElectronico: true },
    { FactTipo_ID: 5, Tipo: 'TMP', Descripcion: 'Tipo usado', Impacto: 'C', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: false, PuedeCambiarImpacto: false, PuedeCambiarSigla: true, PuedeCambiarLetra: true, EsElectronico: false },
    { FactTipo_ID: 6, Tipo: 'OT', Descripcion: 'Tipo antiguo', Impacto: 'C', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: false },
    { FactTipo_ID: 7, Tipo: 'TMP', Descripcion: 'Tipo usado', Impacto: 'C', LetraPredeterminada: 'B', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: true, PuedeCambiarImpacto: false, PuedeCambiarSigla: true, PuedeCambiarLetra: true, EsElectronico: false },
    { FactTipo_ID: 8, Tipo: 'REC', Descripcion: 'Recibo', Impacto: 'C', LetraPredeterminada: 'X', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: true, PuedeCambiarImpacto: false, PuedeCambiarSigla: false, PuedeCambiarLetra: false, EsElectronico: false },
    { FactTipo_ID: 9, Tipo: 'UN', Descripcion: 'Único', Impacto: 'D', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: true, PuedeCambiarImpacto: true, PuedeCambiarSigla: true, PuedeCambiarLetra: true, EsElectronico: false },
    { FactTipo_ID: 10, Tipo: 'ELE', Descripcion: 'Electrónico', Impacto: 'D', LetraPredeterminada: 'A', SucursalID: 10, NumeradorID: 20, Activo: true, PuedeEliminar: true, PuedeCambiarImpacto: false, PuedeCambiarSigla: false, PuedeCambiarLetra: false, EsElectronico: true }
];

function iniciarPantalla(escenario) {
    escenario = escenario || {};
    const controles = {}, eventos = {}, eventosCampos = {}, pedidos = [], errores = [], filas = {}, confirmaciones = [];
    const datosTipos = tipos.map(function (item) { return Object.assign({}, item); });
    const document = {
        readyState: 'loading',
        getElementById: function (id) {
            if (!ids.has(id)) return null;
            if (!controles[id]) controles[id] = {
                value: '', checked: false, disabled: false, hidden: false, textContent: '', dataset: {},
                classList: {
                    clases: new Set(),
                    add: function (clase) { this.clases.add(clase); },
                    remove: function (clase) { this.clases.delete(clase); },
                    toggle: function (clase, presente) { if (presente) this.clases.add(clase); else this.clases.delete(clase); },
                    contains: function (clase) { return this.clases.has(clase); }
                },
                addEventListener: function (nombre, manejador) {
                    if (!eventosCampos[id]) eventosCampos[id] = {};
                    eventosCampos[id][nombre] = manejador;
                },
                querySelector: function () { return {}; }, focus: function () {}
            };
            if (!Object.prototype.hasOwnProperty.call(controles[id], 'innerHTML')) {
                let contenido = '';
                Object.defineProperty(controles[id], 'innerHTML', {
                    get: function () { return contenido; },
                    set: function (html) {
                        contenido = html;
                        if (id === 'tipoSucursal' || id === 'tipoNumerador') this.value = '';
                    }
                });
            }
            return controles[id];
        },
        addEventListener: function (nombre, manejador) { eventos[nombre] = manejador; }
    };
    const SGTL = {
        tabla: { cargando: function () {}, vacia: function () {}, llenar: function (selector, html) { filas[selector] = html; } },
        estado: function (valor) { return valor; },
        botonFila: function (accion, opciones) {
            return '<button data-id="' + opciones.id + '" data-accion="' + accion + '"' +
                (opciones.deshabilitado ? ' disabled title="' + opciones.motivo + '"' : '') + '></button>';
        },
        accionesFila: function (botones) { return botones.join(''); },
        validador: function (reglas) { return {
            validarTodo: function () {
                reglas.forEach(function (regla) {
                    if (regla.id !== 'tipoLetra' || typeof regla.validar !== 'function') return;
                    const campo = document.getElementById(regla.id);
                    const mensaje = regla.validar(campo.value, campo) || campo.dataset.errorRemoto;
                    if (mensaje) SGTL.marcarError(campo, mensaje); else SGTL.limpiarError(campo);
                });
            },
            reiniciar: function () { reglas.forEach(function (regla) { delete document.getElementById(regla.id).dataset.errorRemoto; }); }
        }; },
        marcarError: function (campo, mensaje) { campo.classList.add('is-invalid'); campo.error = mensaje; },
        limpiarError: function (campo) { campo.classList.remove('is-invalid'); campo.error = ''; },
        revisarFormulario: function (formulario, aviso) {
            const invalido = Object.values(controles).some(function (campo) { return campo.classList.contains('is-invalid'); });
            if (aviso) document.getElementById(aviso.slice(1)).textContent = invalido ? 'Revisá los campos marcados.' : '';
            return !invalido;
        },
        reiniciarFormulario: function () {
            Object.values(controles).forEach(function (campo) { campo.classList.remove('is-invalid'); campo.error = ''; });
        },
        confirmar: function (opciones) {
            if (!escenario.confirmacionPendiente) { confirmaciones.push({ opciones }); return Promise.resolve(true); }
            return new Promise(function (resolver) { confirmaciones.push({ opciones, resolver }); });
        },
        procesando: function () { return function () {}; },
        toastExito: function () {}, toastError: function (mensaje) { errores.push(mensaje); }
    };
    vm.runInNewContext(fuente, {
        window: {}, document, SGTL,
        localStorage: { getItem: function () { return 'token-de-prueba'; } },
        fetch: function (url, opciones) {
            const metodo = opciones.method || 'GET';
            pedidos.push({ url, metodo, cuerpo: opciones.body ? JSON.parse(opciones.body) : null });
            if (escenario.electronicoConcurrente && metodo === 'PUT' && url.endsWith('/tipos-comprobante/1')) {
                datosTipos.filter(function (item) { return item.Tipo === 'D'; }).forEach(function (item) {
                    item.PuedeCambiarImpacto = false;
                    item.PuedeCambiarSigla = false;
                    item.PuedeCambiarLetra = false;
                    item.EsElectronico = true;
                });
                return Promise.resolve({ ok: false, status: 409, text: function () {
                    return Promise.resolve(JSON.stringify({ error: 'No se puede modificar el tipo de comprobante: es electrónico.' }));
                } });
            }
            if (escenario.colision && metodo === 'PUT' && url.endsWith('/tipos-comprobante/1')) {
                return Promise.resolve({ ok: false, status: 409, text: function () {
                    return Promise.resolve(JSON.stringify({ error: 'Ya existe un tipo de comprobante con esa sigla.', codigo: 'TIPO_DUPLICADO' }));
                } });
            }
            if (escenario.colisionAlta && metodo === 'POST' && url.endsWith('/tipos-comprobante')) {
                return Promise.resolve({ ok: false, status: 409, text: function () {
                    return Promise.resolve(JSON.stringify({ error: 'Ya existe un tipo de comprobante con esa letra.', codigo: 'TIPO_DUPLICADO' }));
                } });
            }
            if (escenario.letraUsada && metodo === 'PUT' && url.endsWith('/tipos-comprobante/9')) {
                return Promise.resolve({ ok: false, status: 409, text: function () {
                    return Promise.resolve(JSON.stringify({ error: 'No se puede cambiar la letra: ya está usada por otro comprobante.', codigo: 'LETRA_USADA' }));
                } });
            }
            let respuesta = {};
            if (url.includes('/sucursales?')) respuesta = [{ SucursalID: 10, Codigo: '0001', Nombre: 'Administración', Activa: true, PuedeEliminar: false }];
            if (url.includes('/numeradores?')) respuesta = [{ NumeradorID: 20, Nombre: 'Numerador', UltimoNumero: 0, Activo: true, PuedeEliminar: false }];
            if (url.endsWith('/tipos-comprobante')) respuesta = datosTipos;
            return Promise.resolve({ ok: true, text: function () { return Promise.resolve(JSON.stringify(respuesta)); } });
        }
    }, { filename: 'configuracion-facturacion.js' });
    eventos.DOMContentLoaded();
    return { controles, eventos, eventosCampos, pedidos, errores, filas, confirmaciones };
}

function editar(pantalla, id) {
    pantalla.eventos.click({ target: { closest: function () { return {
        getAttribute: function (atributo) { return { 'data-accion': 'editar', 'data-tipo': 'tipo', 'data-id': String(id) }[atributo]; }
    }; } } });
}

async function vaciarPromesas() {
    await new Promise(function (resolver) { setImmediate(resolver); });
    await new Promise(function (resolver) { setImmediate(resolver); });
}

async function probar() {
    const pantalla = iniciarPantalla();
    await vaciarPromesas();
    const filaElectronica = pantalla.filas['#tiposBody'].split('</tr>').filter(function (fila) { return fila.includes('<strong>ELE</strong>'); })[0];
    assert.ok(filaElectronica, 'el tipo electrónico aparece en la lista');
    assert.match(filaElectronica, />Sí<\/td>/, 'la tabla distingue el tipo electrónico');
    assert.strictEqual((filaElectronica.match(/ disabled /g) || []).length, 3,
        'Editar, Cambiar estado y Eliminar quedan bloqueados para el tipo electrónico libre');
    assert.match(filaElectronica, /No se puede editar el tipo de comprobante: es electrónico/i);
    const motivosElectronicos = Array.from(filaElectronica.matchAll(/title="([^"]+)"/g), function (coincidencia) { return coincidencia[1]; });
    assert.strictEqual(motivosElectronicos.length, 3);
    motivosElectronicos.forEach(function (motivo) {
        assert.strictEqual(motivo.endsWith('.'), false, 'los motivos de acciones deshabilitadas no llevan punto final');
    });
    const filaUsada = pantalla.filas['#tiposBody'].split('</tr>').filter(function (fila) { return fila.includes('<strong>TMP</strong>'); })[0];
    assert.doesNotMatch(filaUsada, /data-accion="editar" disabled/,
        'un tipo no electrónico con comprobantes todavía se puede editar');

    editar(pantalla, 1);
    assert.strictEqual(pantalla.controles.tipoImpacto.value, 'C', 'la edición muestra el impacto actual');
    assert.strictEqual(pantalla.controles.tipoElectronico.checked, false);
    assert.strictEqual(pantalla.controles.tipoCodigoEditable.classList.contains('d-none'), false,
        'una sigla configurable sin comprobantes se puede corregir');
    assert.strictEqual(pantalla.controles.tipoLetraEditable.classList.contains('d-none'), false,
        'la letra de una variante sin comprobantes se puede corregir');
    pantalla.controles.tipoDescripcion.value = 'Descripción corregida';
    pantalla.controles.tipoImpacto.value = 'D';
    pantalla.controles.tipoCodigo.value = 'C';
    pantalla.eventosCampos.tipoCodigo.input();
    assert.strictEqual(pantalla.controles.tipoDescripcion.value, 'Descripción corregida',
        'escribir otra sigla durante la edición no reemplaza la descripción ingresada');
    assert.strictEqual(pantalla.controles.tipoImpacto.value, 'D',
        'escribir otra sigla durante la edición no reemplaza el impacto ingresado');
    assert.strictEqual(pantalla.controles.tipoCodigoEditable.classList.contains('d-none'), false,
        'la posibilidad de editar la sigla depende del registro original');
    assert.strictEqual(pantalla.controles.tipoImpactoEditable.classList.contains('d-none'), false,
        'la posibilidad de editar el impacto depende del registro original');
    pantalla.controles.tipoCodigo.value = 'REC';
    pantalla.eventosCampos.tipoCodigo.input();
    assert.strictEqual(pantalla.controles.tipoLetra.value, 'A',
        'escribir temporalmente REC no cambia la letra de la variante original');
    assert.strictEqual(pantalla.controles.tipoLetraEditable.classList.contains('d-none'), false,
        'la edición de letra tampoco depende de la sigla que se esté tecleando');
    pantalla.controles.tipoCodigo.value = 'DB';
    pantalla.eventosCampos.tipoCodigo.input();
    assert.strictEqual(pantalla.controles.tipoImpactoEditable.classList.contains('d-none'), false,
        'un tipo personalizado sin comprobantes permite elegir el impacto');
    assert.strictEqual(pantalla.controles.tipoImpactoFijo.classList.contains('d-none'), true);
    pantalla.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    const guardado = pantalla.pedidos.find(function (pedido) { return pedido.url.endsWith('/tipos-comprobante/1') && pedido.metodo === 'PUT'; });
    assert.ok(guardado, 'guardar envía la variante editada');
    assert.strictEqual(guardado.cuerpo.Impacto, 'D', 'el PUT envía el impacto corregido');
    assert.strictEqual(guardado.cuerpo.Tipo, 'DB', 'el PUT envía la nueva sigla');
    assert.strictEqual(guardado.cuerpo.LetraPredeterminada, 'A', 'renombrar una sigla conserva la letra de la variante');
    assert.strictEqual(guardado.cuerpo.TipoOriginal, 'D', 'el PUT identifica la sigla leída al iniciar la edición');
    assert.strictEqual(guardado.cuerpo.LetraOriginal, 'A', 'el PUT identifica la letra leída al iniciar la edición');
    assert.strictEqual(guardado.cuerpo.EsElectronico, false, 'el PUT conserva el tipo no electrónico');

    editar(pantalla, 9);
    pantalla.controles.tipoLetra.value = 'B';
    pantalla.controles.tipoElectronico.checked = true;
    pantalla.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    const letraCorregida = pantalla.pedidos.find(function (pedido) { return pedido.url.endsWith('/tipos-comprobante/9') && pedido.metodo === 'PUT'; });
    assert.ok(letraCorregida, 'guardar envía la variante con letra corregida');
    assert.strictEqual(letraCorregida.cuerpo.Tipo, 'UN');
    assert.strictEqual(letraCorregida.cuerpo.LetraPredeterminada, 'B', 'el PUT envía la nueva letra');
    assert.strictEqual(letraCorregida.cuerpo.TipoOriginal, 'UN');
    assert.strictEqual(letraCorregida.cuerpo.LetraOriginal, 'A');
    assert.strictEqual(letraCorregida.cuerpo.EsElectronico, true,
        'el formulario permite marcar electrónico un tipo antes de guardar');

    editar(pantalla, 4);
    assert.strictEqual(pantalla.controles.tipoImpactoEditable.classList.contains('d-none'), true,
        'una factura conserva el impacto fijo');
    assert.strictEqual(pantalla.controles.tipoImpactoFijo.classList.contains('d-none'), false);
    assert.match(pantalla.controles.tipoImpactoMotivo.textContent, /electrónico/i,
        'el formulario explica por qué no se puede cambiar la factura electrónica');
    assert.strictEqual(pantalla.controles.tipoCodigoEditable.classList.contains('d-none'), true,
        'la sigla de FAC se muestra fija');
    assert.strictEqual(pantalla.controles.tipoLetraEditable.classList.contains('d-none'), true);
    assert.match(pantalla.controles.tipoCodigoMotivo.textContent, /electrónico/i);
    assert.match(pantalla.controles.tipoLetraMotivo.textContent, /electrónico/i);

    editar(pantalla, 5);
    assert.strictEqual(pantalla.controles.tipoImpactoEditable.classList.contains('d-none'), true,
        'el impacto de un tipo con comprobantes sigue protegido');
    assert.strictEqual(pantalla.controles.tipoCodigoEditable.classList.contains('d-none'), false,
        'un tipo usado no electrónico permite corregir su sigla');
    assert.strictEqual(pantalla.controles.tipoLetraEditable.classList.contains('d-none'), false,
        'un tipo usado no electrónico permite corregir su letra');

    editar(pantalla, 7);
    assert.strictEqual(pantalla.controles.tipoCodigoEditable.classList.contains('d-none'), false,
        'el uso de otra letra no bloquea la sigla de un tipo no electrónico');
    assert.strictEqual(pantalla.controles.tipoLetraEditable.classList.contains('d-none'), false,
        'una variante sin comprobantes permite corregir su propia letra');

    editar(pantalla, 8);
    assert.strictEqual(pantalla.controles.tipoLetraEditable.classList.contains('d-none'), true,
        'la letra X del recibo permanece fija');
    assert.match(pantalla.controles.tipoLetraMotivo.textContent, /recibo/i);
    assert.ok(pantalla.controles.tipoLetraX, 'la opción X tiene un control propio para mostrarla solo en REC');
    assert.strictEqual(pantalla.controles.tipoLetraX.hidden, false, 'la opción X se muestra para REC');

    editar(pantalla, 9);
    assert.strictEqual(pantalla.controles.tipoLetraX.hidden, true, 'la opción X no se ofrece para tipos distintos de REC');
    pantalla.controles.tipoLetra.value = 'X';
    const pedidosAntesDeLetraInvalida = pantalla.pedidos.length;
    pantalla.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    assert.strictEqual(pantalla.pedidos.length, pedidosAntesDeLetraInvalida,
        'una letra X forzada en un tipo normal se rechaza antes de llegar a la API');
    assert.strictEqual(pantalla.controles.tipoLetra.classList.contains('is-invalid'), true,
        'la letra inválida se marca en su campo');
    assert.strictEqual(pantalla.controles.tipoAviso.textContent, 'Revisá los campos marcados.');

    pantalla.eventosCampos.cancelarTipo.click();
    pantalla.controles.tipoCodigo.value = 'D';
    pantalla.eventosCampos.tipoCodigo.input();
    assert.strictEqual(pantalla.controles.tipoImpacto.value, 'C',
        'al registrar la otra letra se mantiene el impacto compartido');
    assert.strictEqual(pantalla.controles.tipoImpactoEditable.classList.contains('d-none'), true,
        'registrar otra letra de la misma sigla no cambia su impacto');
    assert.strictEqual(pantalla.controles.tipoElectronico.checked, false);
    assert.strictEqual(pantalla.controles.tipoElectronicoEditable.classList.contains('d-none'), true,
        'la marca electrónica se comparte entre letras de una sigla existente');
    assert.strictEqual(pantalla.controles.tipoGuardar.disabled, false);
    pantalla.controles.tipoCodigo.value = 'C';
    pantalla.eventosCampos.tipoCodigo.input();
    assert.strictEqual(pantalla.controles.tipoElectronico.checked, true);
    assert.strictEqual(pantalla.controles.tipoGuardar.disabled, true,
        'no se puede agregar una letra a una sigla electrónica');
    assert.match(pantalla.controles.tipoGuardarMotivo.textContent, /electrónico/i);
    const antesDeAlta = pantalla.pedidos.length;
    pantalla.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    assert.strictEqual(pantalla.pedidos.length, antesDeAlta,
        'no se envía el alta de otra letra de una sigla electrónica');
    pantalla.controles.tipoCodigo.value = 'D';
    pantalla.eventosCampos.tipoCodigo.input();
    assert.strictEqual(pantalla.controles.tipoGuardar.disabled, false,
        'otra sigla no electrónica vuelve a permitir el alta');

    const nuevoFijo = iniciarPantalla();
    await vaciarPromesas();
    nuevoFijo.controles.tipoCodigo.value = 'NC';
    nuevoFijo.eventosCampos.tipoCodigo.input();
    assert.strictEqual(nuevoFijo.controles.tipoImpacto.value, 'C',
        'una sigla fija sin variante visible conserva el impacto correcto');
    assert.strictEqual(nuevoFijo.controles.tipoImpactoEditable.classList.contains('d-none'), true);

    editar(pantalla, 6);
    assert.strictEqual(pantalla.controles.tipoImpactoEditable.classList.contains('d-none'), true,
        'sin el dato de editabilidad, el impacto queda protegido');
    assert.doesNotMatch(pantalla.controles.tipoImpactoMotivo.textContent, /comprobantes/i,
        'sin el dato de editabilidad no se atribuye la restricción a comprobantes inexistentes');

    editar(pantalla, 10);
    assert.strictEqual(pantalla.controles.tipoElectronico.checked, true);
    assert.strictEqual(pantalla.controles.tipoElectronicoEditable.classList.contains('d-none'), true,
        'la marca electrónica guardada se muestra como dato fijo');
    for (const campo of ['tipoDescripcion', 'tipoSucursal', 'tipoNumerador', 'tipoActivo']) {
        assert.strictEqual(pantalla.controles[campo + 'Editable'].classList.contains('d-none'), true,
            campo + ' se muestra como dato fijo en un tipo electrónico');
        assert.strictEqual(pantalla.controles[campo + 'Fijo'].classList.contains('d-none'), false);
    }
    assert.match(pantalla.controles.tipoActivoTexto.innerHTML, /Activo/,
        'el estado fijo usa la etiqueta del sistema');
    assert.strictEqual(pantalla.controles.tipoGuardar.disabled, true,
        'Guardar queda bloqueado en el detalle de un tipo electrónico');
    const pedidosAntes = pantalla.pedidos.length;
    pantalla.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    assert.strictEqual(pantalla.pedidos.length, pedidosAntes,
        'el formulario no envía cambios de un tipo electrónico');

    const conflicto = iniciarPantalla({ electronicoConcurrente: true });
    await vaciarPromesas();
    editar(conflicto, 1);
    assert.strictEqual(conflicto.controles.tipoSucursal.value, 10);
    assert.strictEqual(conflicto.controles.tipoNumerador.value, 20);
    conflicto.controles.tipoImpacto.value = 'D';
    conflicto.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    assert.match(conflicto.errores[0], /es electrónico/i,
        'el rechazo por bloqueo concurrente se comunica con el motivo de la API');
    assert.strictEqual(conflicto.controles.tipoImpacto.value, 'C',
        'tras el conflicto se recupera el impacto que sigue guardado');
    assert.strictEqual(conflicto.controles.tipoImpactoEditable.classList.contains('d-none'), true,
        'tras el conflicto el impacto pasa a dato fijo');
    assert.match(conflicto.controles.tipoImpactoMotivo.textContent, /electrónico/i);
    assert.strictEqual(conflicto.controles.tipoCodigoEditable.classList.contains('d-none'), true,
        'la marca electrónica concurrente bloquea el cambio de sigla');
    assert.strictEqual(conflicto.controles.tipoLetraEditable.classList.contains('d-none'), true,
        'la marca electrónica concurrente bloquea el cambio de letra');
    assert.strictEqual(conflicto.controles.tipoSucursal.value, 10,
        'la recarga conserva la sucursal elegida para la variante');
    assert.strictEqual(conflicto.controles.tipoNumerador.value, 20,
        'la recarga conserva el numerador elegido para la variante');

    const colision = iniciarPantalla({ colision: true });
    await vaciarPromesas();
    editar(colision, 1);
    colision.controles.tipoCodigo.value = 'C';
    colision.controles.tipoLetra.value = 'B';
    colision.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    assert.strictEqual(colision.errores.length, 0, 'una sigla duplicada se informa en el campo, sin toast');
    assert.match(colision.controles.tipoCodigo.dataset.errorRemoto, /ya existe/i);
    assert.strictEqual(colision.controles.tipoCodigo.classList.contains('is-invalid'), true);
    assert.strictEqual(colision.controles.tipoAviso.textContent, 'Revisá los campos marcados.');
    assert.strictEqual(colision.controles.tipoCodigo.value, 'C',
        'una colisión conserva la nueva sigla para que se pueda corregir');
    assert.strictEqual(colision.controles.tipoLetra.value, 'B',
        'una colisión conserva la nueva letra para que se pueda corregir');

    const colisionAlta = iniciarPantalla({ colisionAlta: true });
    await vaciarPromesas();
    colisionAlta.controles.tipoCodigo.value = 'D';
    colisionAlta.eventosCampos.tipoCodigo.input();
    colisionAlta.controles.tipoLetra.value = 'A';
    colisionAlta.controles.tipoSucursal.value = 10;
    colisionAlta.controles.tipoNumerador.value = 20;
    colisionAlta.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    assert.strictEqual(colisionAlta.controles.tipoLetra.classList.contains('is-invalid'), true,
        'al agregar una variante repetida se marca la letra ocupada');
    assert.strictEqual(colisionAlta.controles.tipoCodigo.classList.contains('is-invalid'), false,
        'la sigla existente es válida al agregar otra variante');

    const letraUsada = iniciarPantalla({ letraUsada: true });
    await vaciarPromesas();
    editar(letraUsada, 9);
    letraUsada.controles.tipoLetra.value = 'B';
    letraUsada.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    assert.strictEqual(letraUsada.errores.length, 0, 'una letra usada se informa en el campo, sin toast');
    assert.match(letraUsada.controles.tipoLetra.dataset.errorRemoto, /letra/i);
    assert.strictEqual(letraUsada.controles.tipoLetra.classList.contains('is-invalid'), true);
    assert.strictEqual(letraUsada.controles.tipoAviso.textContent, 'Revisá los campos marcados.');
    assert.strictEqual(letraUsada.controles.tipoLetra.value, 'B',
        'un número histórico en la letra destino conserva la elección para corregirla');

    const confirmacion = iniciarPantalla({ confirmacionPendiente: true });
    await vaciarPromesas();
    editar(confirmacion, 9);
    confirmacion.controles.tipoElectronico.checked = true;
    confirmacion.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    await vaciarPromesas();
    assert.strictEqual(confirmacion.confirmaciones.length, 1, 'guardar como electrónico pide confirmación');
    assert.match(confirmacion.confirmaciones[0].opciones.mensaje, /no vas a poder modificar/i);
    assert.strictEqual(confirmacion.pedidos.filter(function (pedido) { return pedido.metodo === 'PUT'; }).length, 0,
        'el cambio irreversible espera la confirmación');
    confirmacion.confirmaciones[0].resolver(false);
    await vaciarPromesas();
    assert.strictEqual(confirmacion.pedidos.filter(function (pedido) { return pedido.metodo === 'PUT'; }).length, 0,
        'cancelar la confirmación no guarda');
    confirmacion.eventosCampos.tipoForm.submit({ preventDefault: function () {} });
    confirmacion.confirmaciones[1].resolver(true);
    await vaciarPromesas();
    assert.strictEqual(confirmacion.pedidos.filter(function (pedido) { return pedido.metodo === 'PUT'; }).length, 1,
        'aceptar la confirmación guarda el tipo electrónico');
    console.log('OK: edición de tipos de comprobante en la pantalla');
}

probar().catch(function (error) { console.error(error); process.exitCode = 1; });
