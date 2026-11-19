(() => {
    'use strict';
    const campos = [
        ['Razon_Social', 'Razón social', 'text', true], ['CUIT_Cliente', 'CUIT', 'text', true],
        ['Cond_Fiscal', 'Condición fiscal', [[1, 'Responsable inscripto'], [2, 'Monotributista'], [3, 'Exento']], true],
        ['Tipo_Cliente', 'Tipo de cliente', [['Directo', 'Directo'], ['Con_plataforma', 'Con plataforma']], true],
        ['Email', 'E-mail', 'email', false], ['Telefono', 'Teléfono', 'text', true],
        ['ProvID', 'Provincia', [], true], ['LocID', 'Localidad', [], true],
        ['Calle', 'Calle', 'text', true], ['AlturaCalle', 'Altura', 'text', true],
        ['CodigoPostal', 'Código postal', 'text', false]
    ];
    const validaciones = {
        CUIT_Cliente: {
            regex: /^\d{2}-\d{8}-\d$/,
            mensaje: 'Ingresá un CUIT de 11 dígitos.'
        },
        Email: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            mensaje: 'Revisá el e-mail.'
        },
        Telefono: {
            regex: /^\d{1,10}$/,
            mensaje: 'Ingresá hasta 10 números, sin espacios ni guiones.',
            soloNumeros: true,
            max: 10
        }
    };
    const porId = id => document.getElementById(id), campo = clave => porId('ce_' + clave);
    const valor = clave => campo(clave).value.trim(), digitos = texto => String(texto ?? '').replace(/\D/g, '');
    const formatoCUIT = texto => {
        const d = digitos(texto).slice(0, 11);
        return d.length > 10 ? d.slice(0, 2) + '-' + d.slice(2, 10) + '-' + d.slice(10)
            : d.length > 2 ? d.slice(0, 2) + '-' + d.slice(2) : d;
    };
    const get = (ruta, mensaje) => SGTL.ajax({ url: SGTL.api + ruta, type: 'GET' }, mensaje);
    const avisar = error => SGTL.avisoFormulario('#ceAviso', error.mensajeUsuario || 'No se pudo completar la operación. Probá de nuevo.');
    const bloquear = estado => { porId('ceCampos').disabled = estado; porId('ceGuardar').disabled = estado; };
    const marcarCUIT = mensaje => {
        campo('CUIT_Cliente').dataset.errorRemoto = mensaje;
        SGTL.marcarError(campo('CUIT_Cliente'), mensaje);
        return false;
    };
    let modal, validador, sesion = null;

    function crear() {
        if (modal) return;
        const html = campos.map(([clave, titulo, tipo, requerido]) => {
            const id = 'ce_' + clave;
            const control = Array.isArray(tipo)
                ? '<select class="form-select" id="' + id + '"><option value="">Seleccioná una opción</option>' +
                tipo.map(([v, t]) => '<option value="' + v + '">' + t + '</option>').join('') + '</select>'
                : '<input class="form-control" id="' + id + '" type="' + tipo + '"' +
                (clave === 'CUIT_Cliente' ? ' inputmode="numeric" placeholder="XX-XXXXXXXX-X"' : '') +
                (clave === 'Telefono' ? ' maxlength="10" inputmode="numeric" autocomplete="tel"' : '') +
                (clave === 'CodigoPostal' ? ' maxlength="20" autocomplete="postal-code"' : '') + '>';
            return '<div class="col-12 col-md-6"><label class="form-label" for="' + id + '">' +
                titulo + (requerido ? ' <span class="text-danger">*</span>' : '') + '</label>' + control +
                '<div class="invalid-feedback"></div>' +
                (clave === 'Tipo_Cliente' ? '<div id="ceMotivo" class="form-text d-none"></div>' : '') + '</div>';
        }).join('');
        document.body.insertAdjacentHTML('beforeend',
            '<div class="modal fade" id="ceModal" tabindex="-1" aria-labelledby="ceTitulo" aria-hidden="true">' +
            '<div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content">' +
            '<div class="modal-header"><h5 id="ceTitulo" class="modal-title"></h5>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
            '<div class="modal-body"><div id="ceAviso" class="alert alert-light-danger d-none" role="alert"></div>' +
            '<form id="ceForm" novalidate><fieldset id="ceCampos"><div class="row g-3">' + html +
            '</div></fieldset></form></div><div class="modal-footer">' +
            '<button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cancelar</button>' +
            '<button type="submit" form="ceForm" id="ceGuardar" class="btn btn-primary">Guardar</button></div></div></div></div>');
        modal = porId('ceModal');
        campo('CUIT_Cliente').addEventListener('input', () => { campo('CUIT_Cliente').value = formatoCUIT(valor('CUIT_Cliente')); });
        validador = SGTL.validador(campos.map(([clave, , , requerido]) => ({
            id: 'ce_' + clave, requerido: requerido ? 'Completá este campo.' : '', ...validaciones[clave]
        })));
        porId('ceForm').addEventListener('submit', guardar);
        campo('ProvID').addEventListener('change', () => {
            const actual = sesion;
            if (actual?.lista && !actual.guardando) localidades(actual).catch(error => {
                if (sesion === actual && error.turno === actual.turnoLocal) avisar(error);
            });
        });
        campo('CUIT_Cliente').addEventListener('blur', () => {
            const actual = sesion, cuit = digitos(valor('CUIT_Cliente'));
            if (actual?.lista && !actual.guardando && validador.validar('ce_CUIT_Cliente')) {
                verificarCUIT(actual, cuit).catch(error => {
                    if (sesion === actual && cuit === digitos(valor('CUIT_Cliente'))) avisar(error);
                });
            }
        });
        $(modal).on('hidden.bs.modal', evento => {
            if (evento.target !== modal) return;
            const anterior = sesion;
            sesion = null;
            if (typeof anterior?.opciones.alCerrar === 'function') anterior.opciones.alCerrar(anterior.resultado);
        });
    }

    function llenar(clave, lista, id, texto, seleccionado = '') {
        campo(clave).replaceChildren(new Option('Seleccioná una opción', ''));
        lista.forEach(item => campo(clave).add(new Option(item[texto], item[id])));
        campo(clave).value = String(seleccionado ?? '');
    }
    async function localidades(actual, seleccion = '') {
        const provincia = valor('ProvID'), turno = ++actual.turnoLocal;
        porId('ceGuardar').disabled = true;
        campo('LocID').disabled = true;
        llenar('LocID', [], '', '');
        try {
            const lista = provincia ? await get('/Provincias/' + provincia + '/Localidades',
                'No se pudieron cargar las localidades. Probá de nuevo.') : [];
            if (sesion !== actual || turno !== actual.turnoLocal) return;
            llenar('LocID', lista, 'Loc_ID', 'Nombre_Localidad', seleccion);
            campo('LocID').disabled = !provincia;
            porId('ceGuardar').disabled = !actual.lista;
        } catch (error) { error.turno = turno; throw error; }
    }
    async function verificarCUIT(actual, cuit) {
        const vigente = () => sesion === actual && cuit === digitos(valor('CUIT_Cliente'));
        try {
            const respuesta = await get('/Clientes/ValidarCUIT/' + cuit + (actual.id ? '/' + actual.id : ''),
                'No se pudo verificar el CUIT. Probá de nuevo.');
            if (!vigente()) return false;
            if (respuesta?.codigo === 'CUIT_registrado') return marcarCUIT(respuesta.mensaje || 'El CUIT ya está registrado.');
            if (!['CUIT_permitido', 'CUIT_no_registrado'].includes(respuesta?.codigo)) throw new Error('Respuesta de CUIT desconocida.');
            delete campo('CUIT_Cliente').dataset.errorRemoto;
            SGTL.limpiarError(campo('CUIT_Cliente'));
            return true;
        } catch (error) {
            if (vigente() && error.xhr?.responseJSON?.codigo === 'cuit_invalido') return marcarCUIT(error.mensajeUsuario);
            throw error;
        }
    }
    async function guardar(evento) {
        evento.preventDefault();
        const actual = sesion;
        if (!actual?.lista || actual.guardando || porId('ceGuardar').disabled) return;
        validador.validarTodo();
        if (!SGTL.revisarFormulario('#ceForm', '#ceAviso')) return;
        const datos = Object.fromEntries(campos.map(([clave]) => [clave, valor(clave)]));
        ['Cond_Fiscal', 'ProvID', 'LocID'].forEach(clave => { datos[clave] = Number(datos[clave]); });
        datos.CUIT_Cliente = digitos(datos.CUIT_Cliente);
        if (actual.opciones.tipoBloqueado) datos.Tipo_Cliente = actual.original.Tipo_Cliente || 'Directo';
        actual.guardando = true;
        porId('ceCampos').disabled = true;
        const listo = SGTL.procesando(porId('ceGuardar'));
        try {
            if (!await verificarCUIT(actual, datos.CUIT_Cliente)) {
                SGTL.revisarFormulario('#ceForm', '#ceAviso');
                return;
            }
            const usuario = localStorage.getItem('username') || 'Desconocido', ahora = new Date().toISOString();
            Object.assign(datos, {
                Cliente_ID: actual.id || 0, Fecha_Alta: actual.id ? actual.original.Fecha_Alta : ahora,
                Usu_Alta: actual.id ? actual.original.Usu_Alta : usuario, Fecha_Modi: ahora, Usu_Modi: usuario
            });
            const respuesta = await SGTL.ajax({
                url: SGTL.api + '/Clientes' + (actual.id ? '/' + actual.id : ''),
                type: actual.id ? 'PUT' : 'POST', contentType: 'application/json', data: JSON.stringify(datos)
            }, 'No se pudo guardar el cliente. Probá de nuevo.');
            actual.resultado = {
                esAlta: !actual.id, id: actual.id || respuesta?.Cliente_ID || null,
                borradores: Number(respuesta?.Borradores) || 0, borradorID: respuesta?.BorradorID || null
            };
            SGTL.toastExito(actual.id ? 'Cliente actualizado.' : 'Cliente registrado.');
        } catch (error) { avisar(error); }
        finally { actual.guardando = false; porId('ceCampos').disabled = false; listo(); }
        if (actual.resultado) SGTL.modal(modal, 'hide');
    }
    async function abrir(id, opciones = {}) {
        crear();
        if (sesion) return;
        const actual = { id: id ? Number(id) : null, opciones, resultado: null, lista: false, turnoLocal: 0 };
        if (actual.id !== null && (!Number.isInteger(actual.id) || actual.id <= 0)) {
            SGTL.toastError('El cliente seleccionado no es válido.');
            if (typeof opciones.alCerrar === 'function') opciones.alCerrar(null);
            return;
        }
        sesion = actual;
        SGTL.reiniciarFormulario('#ceForm', '#ceAviso');
        validador.reiniciar();
        campo('Tipo_Cliente').disabled = !!opciones.tipoBloqueado;
        campo('LocID').disabled = true;
        campo('Tipo_Cliente').value = 'Directo';
        porId('ceMotivo').textContent = opciones.tipoBloqueado || '';
        porId('ceMotivo').classList.toggle('d-none', !opciones.tipoBloqueado);
        porId('ceTitulo').textContent = actual.id ? 'Editar cliente' : 'Registrar cliente';
        bloquear(true);
        const mostrada = new Promise(resolve => $(modal).one('shown.bs.modal', resolve));
        SGTL.modal(modal, 'show');
        try {
            const [original, provincias] = await Promise.all([
                actual.id ? get('/Clientes/' + actual.id, 'No se pudo cargar el cliente. Probá de nuevo.') : {},
                get('/Provincias', 'No se pudieron cargar las provincias. Probá de nuevo.')
            ]);
            if (sesion !== actual) return;
            actual.original = original;
            campos.forEach(([clave]) => { campo(clave).value = String(original[clave] ?? ''); });
            campo('CUIT_Cliente').value = formatoCUIT(original.CUIT_Cliente);
            campo('Tipo_Cliente').value = original.Tipo_Cliente || 'Directo';
            llenar('ProvID', provincias, 'Prov_ID', 'Nombre_Provincia', original.ProvID);
            await localidades(actual, original.LocID);
            if (sesion !== actual) return;
            actual.lista = true;
            bloquear(false);
        } catch (error) {
            if (sesion === actual) {
                SGTL.toastError(error.mensajeUsuario || 'No se pudo cargar el formulario. Probá de nuevo.');
                await mostrada;
                if (sesion === actual) SGTL.modal(modal, 'hide');
            }
        }
    }
    window.SGTLEditarCliente = { abrir };
})();