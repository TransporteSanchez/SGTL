(() => {
    'use strict';

    const CAMPOS = [
        ['Dominio', 'Dominio', 7], ['Marca', 'Marca', 50], ['Modelo', 'Modelo', 50],
        ['AñoModelo', 'Año del modelo', 4], ['Tipo', 'Tipo de camión', 50],
        ['NumMotor', 'Número de motor', 17], ['NumChasis', 'Número de chasis', 17],
        ['FechaCompra', 'Fecha de compra'], ['FechaITV', 'Fecha de ITV'],
        ['EquipoFrio', 'Equipo de frío', 50]
    ];

    const TIPOS = ['Furgón', 'Balancín (3 ejes)', 'Chasis (2 ejes)', 'Liviano'];
    const el = id => document.getElementById(id);
    const campo = clave => el('cm_' + clave);
    const texto = valor => String(valor ?? '').trim();
    const gestion = document.body.dataset.camiones === 'gestion';
    const comparador = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

    let registros = [], filtros = {}, pagina = 1, tamanio = 15, orden;
    let consulta = 0, detalle = 0, cargados = false, sesion = null, validador, cambios;

    function pedir(ruta, metodo, datos, mensaje) {
        const opciones = {
            url: SGTL.api + '/Camiones' + ruta,
            type: metodo,
            cache: false
        };

        if (datos !== undefined) Object.assign(opciones, {
            contentType: 'application/json',
            data: JSON.stringify(datos)
        });

        return SGTL.ajax(opciones, mensaje);
    }

    function instante(valor) {
        let iso = texto(valor);
        if (!iso) return null;

        // Las altas y modificaciones del front existente se guardan como instantes UTC.
        if (!/(Z|[+-]\d{2}:\d{2})$/i.test(iso)) iso += 'Z';

        const fecha = new Date(iso);
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }

    const fechaRegistro = valor => SGTL.fecha(instante(valor), { hora: true });
    const fechaDia = valor => SGTL.fecha(texto(valor).slice(0, 10));

    function cumple(c, f) {
        if (f.dominio && !texto(c.Dominio).toUpperCase().includes(f.dominio.toUpperCase())) return false;
        if (f.estado && c.EstadoCamion !== f.estado) return false;

        const fecha = SGTL.fechaISO(instante(c.Fecha_Alta));

        return !f.rango || Boolean(fecha && fecha >= f.rango.desde && fecha <= f.rango.hasta);
    }

    function ordenar(filas, criterio) {
        const clave = criterio.orden;
        const permitidos = ['Dominio', 'Marca', 'Modelo', 'Fecha_Alta', 'EstadoCamion'];

        return filas.slice().sort((a, b) => {
            if (!permitidos.includes(clave)) return b.Camion_ID - a.Camion_ID;

            const resultado = clave === 'Fecha_Alta'
                ? (instante(a.Fecha_Alta)?.getTime() || 0) - (instante(b.Fecha_Alta)?.getTime() || 0)
                : comparador.compare(texto(a[clave]), texto(b[clave]));

            return resultado * (criterio.direccion === 'desc' ? -1 : 1);
        });
    }

    const filtrados = () => ordenar(
        registros.filter(c => cumple(c, filtros)),
        orden.parametros()
    );

    const celda = (valor, clase = '') =>
        '<td class="' + clase + '">' + SGTL.escapar(texto(valor) || '—') + '</td>';

    function acciones(c) {
        if (!gestion) {
            return SGTL.accionesFila([
                SGTL.botonFila('ver', { id: c.Camion_ID })
            ]);
        }

        return SGTL.accionesFila([
            SGTL.botonFila('editar', { id: c.Camion_ID }),
            SGTL.botonFila(c.EstadoCamion === 'Activo' ? 'inactivar' : 'activar', {
                id: c.Camion_ID
            }),
            SGTL.botonFila('eliminar', {
                id: c.Camion_ID,
                deshabilitado: c.EstadoCamion !== 'Inactivo',
                motivo: 'Para eliminar el camión, primero tenés que inactivarlo.'
            })
        ]);
    }

    function dibujar() {
        if (!cargados) return;

        const filas = filtrados();
        const paginas = tamanio ? Math.max(1, Math.ceil(filas.length / tamanio)) : 1;
        pagina = Math.min(pagina, paginas);

        const visibles = tamanio
            ? filas.slice((pagina - 1) * tamanio, pagina * tamanio)
            : filas;

        el('btnDescargar').disabled = !cargados || !filas.length;

        SGTL.tabla.paginacion('#paginacionCamiones', {
            pagina,
            tamanioPagina: tamanio,
            total: filas.length,
            alCambiarPagina: valor => {
                pagina = valor;
                dibujar();
            },
            alCambiarTamanio: valor => {
                tamanio = valor;
                pagina = 1;
                dibujar();
            }
        });

        if (!visibles.length) {
            SGTL.tabla.vacia('#filasCamiones', 6);
            return;
        }

        SGTL.tabla.llenar('#filasCamiones', visibles.map(c =>
            '<tr>' +
            celda(c.Dominio) +
            celda(c.Marca) +
            celda(c.Modelo) +
            celda(fechaRegistro(c.Fecha_Alta), 'text-center text-nowrap') +
            '<td class="text-center">' + SGTL.estado(c.EstadoCamion) + '</td>' +
            '<td class="text-center text-nowrap">' + acciones(c) + '</td></tr>'
        ).join(''));
    }

    async function cargar() {
        const turno = ++consulta;
        cargados = false;
        el('btnDescargar').disabled = true;
        SGTL.tabla.cargando('#filasCamiones', 6);
        SGTL.tabla.paginacion('#paginacionCamiones', { total: 0 });

        try {
            let respuesta;

            try {
                respuesta = await pedir(
                    '', 'GET', undefined,
                    'No se pudieron cargar los camiones. Probá de nuevo.'
                );
            } catch (error) {
                if (error.xhr?.status !== 404) throw error;
                respuesta = [];
            }

            if (turno !== consulta) return;
            if (!Array.isArray(respuesta)) throw new Error('Respuesta de camiones inválida.');

            registros = respuesta;
            cargados = true;
            dibujar();
        } catch (error) {
            if (turno !== consulta) return;

            registros = [];

            SGTL.tabla.vacia('#filasCamiones', 6, 'No se pudieron cargar los camiones.');
            SGTL.toastError(
                error.mensajeUsuario || 'No se pudieron cargar los camiones. Probá de nuevo.'
            );
        }
    }

    function buscar() {
        filtros = {
            dominio: el('fDominio').value.trim(),
            estado: el('fEstado').value,
            rango: SGTL.valorRango('#fFecha')
        };

        pagina = 1;
        return cargar();
    }

    function crearDetalle() {
        document.body.insertAdjacentHTML('beforeend',
            '<div class="modal fade" id="cmDetalle" tabindex="-1" aria-labelledby="cmDetalleTitulo" aria-hidden="true">' +
            '<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">' +
            '<div class="modal-header"><h2 class="modal-title h5" id="cmDetalleTitulo">Detalle del camión</h2>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
            '<div class="modal-body"><div class="mb-3" id="cmDetalleEstado"></div><dl class="row g-3">' +
            CAMPOS.map(([clave, titulo]) =>
                '<div class="col-12 col-md-6"><dt>' + titulo +
                '</dt><dd class="mb-0 text-break" id="cd_' + clave + '"></dd></div>'
            ).join('') +
            '</dl><p id="cmDetalleRegistro" class="small text-muted"></p><h3 class="h6 mt-4">Choferes asignados</h3>' +
            '<div class="table-responsive"><table class="table align-middle"><thead><tr>' +
            '<th scope="col">Apellido</th><th scope="col">Nombre</th><th scope="col">DNI</th>' +
            '</tr></thead><tbody id="cmChoferes"></tbody></table></div></div>' +
            '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cerrar</button>' +
            '</div></div></div></div>'
        );

        el('cmDetalle').addEventListener('hidden.bs.modal', () => {
            detalle++;
        });
    }

    async function ver(id, boton) {
        const turno = ++detalle;
        const listo = SGTL.procesando(boton);

        try {
            const c = await pedir(
                '/' + id, 'GET', undefined,
                'No se pudo abrir el detalle. Probá de nuevo.'
            );

            if (turno !== detalle) return;

            CAMPOS.forEach(([clave]) => {
                el('cd_' + clave).textContent = clave.startsWith('Fecha')
                    ? fechaDia(c[clave])
                    : texto(c[clave]);
            });

            el('cmDetalleTitulo').textContent = 'Detalle del camión ' + texto(c.Dominio);
            el('cmDetalleEstado').innerHTML = SGTL.estado(c.EstadoCamion);
            el('cmDetalleRegistro').textContent = SGTL.textoRegistro(
                c.Usu_Alta,
                fechaRegistro(c.Fecha_Alta),
                c.Usu_Modi,
                fechaRegistro(c.Fecha_Modi)
            );

            SGTL.tabla.cargando('#cmChoferes', 3);
            SGTL.modal('#cmDetalle', 'show');

            try {
                const choferes = await pedir(
                    '/' + id + '/Chofer_Camion', 'GET', undefined,
                    'No se pudieron cargar los choferes asignados.'
                );

                if (turno !== detalle) return;

                if (!choferes.length) {
                    SGTL.tabla.vacia('#cmChoferes', 3, 'Todavía no hay choferes asignados.');
                } else {
                    SGTL.tabla.llenar('#cmChoferes', choferes.map(p =>
                        '<tr>' + celda(p.Apellido) + celda(p.Nombre) + celda(p.DNI) + '</tr>'
                    ).join(''));
                }
            } catch (error) {
                if (turno !== detalle) return;

                SGTL.tabla.vacia(
                    '#cmChoferes',
                    3,
                    error.xhr?.status === 404
                        ? 'Todavía no hay choferes asignados.'
                        : 'No se pudieron cargar los choferes asignados.'
                );
            }
        } catch (error) {
            if (turno === detalle) {
                SGTL.toastError(error.mensajeUsuario || 'No se pudo abrir el detalle.');
            }
        } finally {
            listo();
        }
    }

    function fechaNoFutura(nombre) {
        return valor => {
            const fecha = SGTL.leerFecha(valor);

            if (!fecha) return 'Ingresá una fecha válida con formato DD/MM/AAAA.';

            return fecha > new Date()
                ? 'La fecha de ' + nombre + ' no puede ser posterior a hoy.'
                : '';
        };
    }

    function crearEditor() {
        const controles = CAMPOS.map(([clave, titulo, max]) => {
            const fecha = clave.startsWith('Fecha');

            const control = clave === 'Tipo'
                ? '<select class="form-select" id="cm_Tipo" required><option value="">Seleccioná el tipo</option>' +
                TIPOS.map(tipo => '<option value="' + tipo + '">' + tipo + '</option>').join('') +
                '</select>'
                : '<input class="form-control" id="cm_' + clave + '"' +
                (max ? ' maxlength="' + max + '"' : '') +
                (fecha ? ' placeholder="DD/MM/AAAA" autocomplete="off"' : '') +
                (clave === 'AñoModelo' ? ' inputmode="numeric"' : '') +
                (clave !== 'EquipoFrio' ? ' required' : '') + '>';

            return '<div class="col-12 col-md-6"><label class="form-label" for="cm_' + clave + '">' +
                titulo +
                (clave !== 'EquipoFrio' ? ' <span class="text-danger" aria-hidden="true">*</span>' : '') +
                '</label>' + control + '<div class="invalid-feedback"></div>' +
                (clave === 'Tipo' ? '<div id="cmTipoAyuda" class="form-text"></div>' : '') +
                '</div>';
        }).join('');

        document.body.insertAdjacentHTML('beforeend',
            '<div class="modal fade" id="cmEditor" tabindex="-1" aria-labelledby="cmEditorTitulo" aria-hidden="true" data-bs-backdrop="static">' +
            '<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><form class="modal-content" id="cmForm" novalidate>' +
            '<div class="modal-header"><h2 class="modal-title h5" id="cmEditorTitulo"></h2>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
            '<div class="modal-body"><div class="alert alert-light-danger d-none" id="cmAviso" role="alert"></div>' +
            '<p id="cmCarga" class="text-muted d-none" role="status">Cargando datos…</p>' +
            '<div id="cmEstado" class="mb-3"></div><fieldset id="cmCampos"><div class="row g-3">' +
            controles +
            '</div></fieldset></div><div class="modal-footer">' +
            '<button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cancelar</button>' +
            '<button type="submit" class="btn btn-primary" id="cmGuardar">Guardar</button></div></form></div></div>'
        );

        ['FechaCompra', 'FechaITV'].forEach(clave => {
            SGTL.selectorFecha(campo(clave), { maxDate: 'today' });
        });

        const reglas = {
            Dominio: {
                mayusculas: true,
                regex: /^(?:[A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/,
                mensaje: 'Ingresá tres letras y tres números, o dos letras, tres números y dos letras.'
            },
            AñoModelo: {
                soloNumeros: true,
                regex: /^\d{4}$/,
                mensaje: 'Ingresá un año de cuatro números.',
                validar: valor => Number(valor) < 1 || Number(valor) > new Date().getFullYear()
                    ? 'El año debe ser válido y no puede ser posterior al actual.'
                    : ''
            },
            NumMotor: {
                mayusculas: true,
                regex: /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{8,17}$/,
                mensaje: 'Ingresá entre 8 y 17 caracteres, incluyendo letras y números.'
            },
            NumChasis: {
                mayusculas: true,
                regex: /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{17}$/,
                mensaje: 'Ingresá 17 caracteres, incluyendo letras y números.'
            },
            FechaCompra: { validar: fechaNoFutura('compra') },
            FechaITV: { validar: fechaNoFutura('ITV') }
        };

        validador = SGTL.validador(CAMPOS.map(([clave, , max]) => ({
            id: 'cm_' + clave,
            requerido: clave === 'EquipoFrio' ? '' : 'Completá este campo.',
            max,
            ...reglas[clave]
        })));

        cambios = SGTL.cambiosSinGuardar('#cmEditor');

        el('cmForm').addEventListener('submit', guardar);

        el('cmEditor').addEventListener('hidden.bs.modal', () => {
            sesion = null;
        });

        el('cmEditor').addEventListener('shown.bs.modal', () => {
            if (sesion?.lista) campo('Dominio').focus();
        });
    }

    async function editar(id = 0) {
        if (sesion) return;

        const actual = {
            id,
            original: null,
            lista: !id,
            guardando: false
        };

        sesion = actual;

        SGTL.reiniciarFormulario('#cmForm', '#cmAviso');
        validador.reiniciar();

        ['FechaCompra', 'FechaITV'].forEach(clave => {
            campo(clave)._flatpickr.clear(false);
        });

        el('cmEditorTitulo').textContent = id ? 'Editar camión' : 'Registrar camión';
        el('cmTipoAyuda').textContent =
            'El tipo y el año del modelo se usan para calcular la tarifa.';
        el('cmEstado').innerHTML = id ? '' : SGTL.estado('Activo');
        el('cmCarga').classList.toggle('d-none', !id);
        el('cmCampos').disabled = Boolean(id);
        el('cmGuardar').disabled = Boolean(id);

        cambios.limpiar();
        SGTL.modal('#cmEditor', 'show');

        if (!id) return;

        try {
            const c = await pedir(
                '/' + id, 'GET', undefined,
                'No se pudieron cargar los datos del camión.'
            );

            if (sesion !== actual) return;

            actual.original = c;

            CAMPOS.forEach(([clave]) => {
                if (clave.startsWith('Fecha')) {
                    campo(clave)._flatpickr.setDate(fechaDia(c[clave]), false);
                } else {
                    campo(clave).value = texto(c[clave]);
                }
            });

            if (!TIPOS.includes(texto(c.Tipo))) {
                campo('Tipo').value = '';
                el('cmTipoAyuda').textContent =
                    'Estaba cargado como "' + texto(c.Tipo) + '": elegí un tipo de la lista.';
            }

            el('cmEstado').innerHTML = SGTL.estado(c.EstadoCamion);
            actual.lista = true;
            el('cmCarga').classList.add('d-none');
            el('cmCampos').disabled = false;
            el('cmGuardar').disabled = false;

            cambios.limpiar();

            if (el('cmEditor').classList.contains('show')) campo('Dominio').focus();
        } catch (error) {
            if (sesion !== actual) return;

            cambios.limpiar();
            el('cmCarga').classList.add('d-none');

            SGTL.avisoFormulario(
                '#cmAviso',
                error.mensajeUsuario || 'No se pudieron cargar los datos del camión.'
            );
        }
    }

    async function guardar(evento) {
        evento.preventDefault();

        const actual = sesion;

        if (!actual?.lista || actual.guardando) return;

        validador.validarTodo();
        if (!SGTL.revisarFormulario('#cmForm', '#cmAviso')) return;

        const datos = Object.fromEntries(CAMPOS.map(([clave]) => [
            clave,
            clave.startsWith('Fecha')
                ? SGTL.fechaISO(SGTL.leerFecha(campo(clave).value))
                : campo(clave).value.trim()
        ]));

        const ahora = new Date().toISOString();
        const usuario = texto(localStorage.getItem('username')).slice(0, 20);

        Object.assign(datos, {
            Camion_ID: actual.id,
            EstadoCamion: actual.original?.EstadoCamion || 'Activo',
            Fecha_Alta: actual.original?.Fecha_Alta || ahora,
            Usu_Alta: actual.original?.Usu_Alta || usuario,
            Fecha_Modi: ahora,
            Usu_Modi: usuario
        });

        actual.guardando = true;
        el('cmCampos').disabled = true;

        const listo = SGTL.procesando('#cmGuardar');
        let guardado = false;

        try {
            await pedir(
                actual.id ? '/' + actual.id : '',
                actual.id ? 'PUT' : 'POST',
                datos,
                'No se pudo guardar el camión. Revisá los campos y probá de nuevo.'
            );

            guardado = true;
        } catch (error) {
            SGTL.avisoFormulario(
                '#cmAviso',
                error.mensajeUsuario || 'No se pudo guardar el camión.'
            );
        } finally {
            actual.guardando = false;
            el('cmCampos').disabled = false;
            listo();
        }

        if (guardado) {
            cambios.limpiar();
            SGTL.modal('#cmEditor', 'hide');
            SGTL.toastExito(actual.id ? 'Camión actualizado.' : 'Camión registrado.');
            await cargar();
        }
    }

    async function cambiarEstado(c, boton) {
        const nuevo = c.EstadoCamion === 'Activo' ? 'Inactivo' : 'Activo';
        const listo = SGTL.procesando(boton);

        try {
            await pedir('/EstadoCamion/' + c.Camion_ID, 'PUT', {
                EstadoCamion: nuevo,
                EstadoAnterior: c.EstadoCamion
            }, 'No se pudo cambiar el estado. Volvé a buscar y probá de nuevo.');

            SGTL.toastExito(nuevo === 'Activo' ? 'Camión activado.' : 'Camión inactivado.');
            await cargar();
        } catch (error) {
            SGTL.toastError(error.mensajeUsuario || 'No se pudo cambiar el estado.');
        } finally {
            listo();
        }
    }

    async function eliminar(c) {
        const hecho = await SGTL.confirmar({
            titulo: '¿Eliminar el camión ' + texto(c.Dominio) + '?',
            mensaje: 'El camión dejará de aparecer en los listados. No se puede deshacer.',
            verbo: 'Eliminar',
            peligro: true,
            accion: async () => {
                const vigente = await pedir(
                    '/' + c.Camion_ID, 'GET', undefined,
                    'No se pudo revisar el estado del camión.'
                );

                if (vigente.EstadoCamion !== 'Inactivo') {
                    const error = new Error('Estado del camión modificado.');
                    error.mensajeUsuario =
                        'El camión debe estar inactivo. Volvé a buscar para revisar su estado.';
                    throw error;
                }

                return pedir('/Eliminar/' + c.Camion_ID, 'PUT', {
                    Usu_Modi: texto(localStorage.getItem('username')).slice(0, 20)
                }, 'No se pudo eliminar el camión. Probá de nuevo.');
            }
        });

        if (hecho) {
            SGTL.toastExito('Camión eliminado.');
            await cargar();
        }
    }

    function csvSeguro(valor) {
        return typeof valor === 'string' && /^[\s]*[=+\-@]/.test(valor)
            ? "'" + valor
            : valor;
    }

    function descargar() {
        if (!cargados) return;

        const filas = filtrados();
        if (!filas.length) return;

        SGTL.descargarCSV(
            'camiones.csv',
            CAMPOS.map(([, titulo]) => titulo).concat([
                'Estado',
                'Fecha de alta',
                'Usuario de alta',
                'Fecha de modificación',
                'Usuario de modificación'
            ]),
            filas.map(c => CAMPOS.map(([clave]) =>
                clave.startsWith('Fecha') ? fechaDia(c[clave]) : texto(c[clave])
            ).concat([
                c.EstadoCamion,
                fechaRegistro(c.Fecha_Alta),
                c.Usu_Alta,
                fechaRegistro(c.Fecha_Modi),
                c.Usu_Modi
            ]).map(csvSeguro))
        );
    }
    async function inicializarApariencia() {
        const indicador = el('cargandoApariencia');

        try {
            const encabezado = window.loadHeader();
            window.loadFooter();

            const [contenido] = await Promise.all([
                SGTL.ajax({
                    url: SGTL.api + '/GestionContenido/1',
                    type: 'GET'
                }, 'No se pudo cargar la apariencia de SGTL.'),
                encabezado,
                window.loadSidebar()
            ]);

            const datos = contenido || {};
            const textoPie = datos.ContenidoPiePagina || window.SGTL_CONTENIDO_DEFAULT.pie;
            const contenedorPie = el('footer-container');

            window.applyStyles(
                datos.Logo,
                datos.ColorFondo,
                datos.ColorBotonesMenu,
                textoPie
            );

            if (!contenedorPie.querySelector('.footer p')) {
                const esperarPie = new MutationObserver(() => {
                    const parrafo = contenedorPie.querySelector('.footer p');
                    if (!parrafo) return;

                    esperarPie.disconnect();
                    parrafo.innerHTML = textoPie;
                });

                esperarPie.observe(contenedorPie, {
                    childList: true,
                    subtree: true
                });
            }

            indicador.classList.add('d-none');
            el('app').classList.remove('d-none');
        } catch {
            indicador.textContent =
                'No se pudo cargar la pantalla. Recargá la página para volver a intentar.';
        }
    }

    function iniciar() {
        inicializarApariencia();

        if (!gestion) crearDetalle();

        if (gestion) {
            crearEditor();
            el('btnRegistrar').addEventListener('click', () => editar());
        }

        orden = SGTL.tabla.habilitarOrden('#tablaCamiones', () => {
            pagina = 1;
            dibujar();
        });

        SGTL.rangoFechas('#fFecha', {
            onClose: fechas => {
                if (fechas.length !== 1) buscar();
            }
        });

        const filtrosUI = SGTL.filtros(
            ['#fDominio', '#fFecha', '#fEstado'],
            buscar
        );

        el('fDominio').addEventListener('input', () => {
            el('fDominio').value = el('fDominio').value
                .replace(/[^A-Za-z0-9]/g, '')
                .toUpperCase();

            filtrosUI.actualizar();
        });

        el('fEstado').addEventListener('change', buscar);

        el('formBuscar').addEventListener('submit', evento => {
            evento.preventDefault();
            buscar();
        });

        el('btnDescargar').addEventListener('click', descargar);

        el('filasCamiones').addEventListener('click', evento => {
            const boton = evento.target.closest('button[data-accion]');
            if (!boton || boton.disabled) return;

            const c = registros.find(
                camion => String(camion.Camion_ID) === boton.dataset.id
            );

            if (!c) return;

            if (!gestion && boton.dataset.accion === 'ver') {
                ver(c.Camion_ID, boton);
            } else if (gestion && boton.dataset.accion === 'editar') {
                editar(c.Camion_ID);
            } else if (gestion && ['activar', 'inactivar'].includes(boton.dataset.accion)) {
                cambiarEstado(c, boton);
            } else if (gestion &&
                boton.dataset.accion === 'eliminar' &&
                c.EstadoCamion === 'Inactivo') {
                eliminar(c);
            }
        });

        buscar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    } else {
        iniciar();
    }
})();