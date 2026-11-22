(function () {
    'use strict';

    const el = id => document.getElementById(id);
    const selectoresGrupo = ['grupoSeleccionado', 'grupoUsuariosSeleccionado'];

    const pedir = (ruta, type = 'GET', datos) => SGTL.ajax({
        url: SGTL.api + '/Grupos' + ruta,
        type: type,
        contentType: 'application/json',
        data: datos === undefined ? undefined : JSON.stringify(datos)
    }, 'No se pudo completar la operación de grupos. Probá de nuevo.');

    const iguales = (a, b) =>
        a.size === b.size &&
        Array.from(a).every(i => b.has(i));

    const normalizar = texto => String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    let grupos = [];
    let grupoId = 0;
    let edicionId = null;
    let ocupado = false;
    let cargado = false;
    let validacion;
    let cambiosModal;

    let menus = [];
    let originalesMenus = new Set();
    let elegidosMenus = new Set();

    let integrantes = [];
    let originalesUsuarios = new Set();
    let elegidosUsuarios = new Set();

    const paginas = {
        Grupos: 1,
        Disponibles: 1,
        Asignados: 1
    };

    const tamanios = {
        Grupos: 10,
        Disponibles: 10,
        Asignados: 10
    };

    function tabla(lado, filas, dibujar) {
        const tamanio = tamanios[lado] || filas.length || 1;

        paginas[lado] = Math.min(
            paginas[lado],
            Math.max(1, Math.ceil(filas.length / tamanio))
        );

        SGTL.tabla.paginacion('#paginacion' + lado, {
            total: filas.length,
            pagina: paginas[lado],
            tamanioPagina: tamanios[lado],
            alCambiarPagina: valor => {
                paginas[lado] = valor;
                renderizar();
            },
            alCambiarTamanio: valor => {
                tamanios[lado] = valor;
                paginas[lado] = 1;
                renderizar();
            }
        });

        const filasPagina = tamanios[lado] === 0
            ? filas
            : filas.slice(
                (paginas[lado] - 1) * tamanio,
                paginas[lado] * tamanio
            );

        if (!filasPagina.length) {
            SGTL.tabla.vacia('#filas' + lado, 2);
        } else {
            SGTL.tabla.llenar(
                '#filas' + lado,
                filasPagina.map(dibujar).join('')
            );
        }
    }

    function cambiosIntegrantes() {
        return {
            AgregarIds: Array.from(elegidosUsuarios)
                .filter(i => !originalesUsuarios.has(i)),
            QuitarIds: Array.from(originalesUsuarios)
                .filter(i => !elegidosUsuarios.has(i))
        };
    }

    function pendientes() {
        return !iguales(originalesMenus, elegidosMenus) ||
            !iguales(originalesUsuarios, elegidosUsuarios);
    }

    function puedeQuitar(usuario) {
        return !originalesUsuarios.has(usuario.Usuario_ID) ||
            usuario.PuedeQuitar;
    }

    function visibles(lado) {
        const asignados = lado === 'Asignados';

        const busqueda = normalizar(
            el('buscar' + lado).value.trim()
        );

        return integrantes
            .filter(u =>
                elegidosUsuarios.has(u.Usuario_ID) === asignados &&
                (asignados || u.PuedeAgregar)
            )
            .filter(u =>
                normalizar(
                    u.Nombre_Usuario + ' ' + u.NombreCompleto
                ).includes(busqueda)
            );
    }

    function sincronizarSelectoresGrupo() {
        selectoresGrupo.forEach(id => {
            el(id).value = grupoId ? String(grupoId) : '';
            el(id).disabled = ocupado;
        });
    }

    function renderizar() {
        const busquedaGrupo = normalizar(el('fGrupo').value.trim());

        tabla(
            'Grupos',
            grupos.filter(g =>
                normalizar(g.Grupo_Nombre).includes(busquedaGrupo)
            ),
            g => '<tr>' +
                '<td>' + SGTL.escapar(g.Grupo_Nombre) + '</td>' +
                '<td class="text-center text-nowrap">' +
                SGTL.accionesFila([
                    SGTL.botonFila('ver', {
                        id: g.Grupo_ID,
                        texto: 'Gestionar permisos por grupo',
                        icono: 'bi-sliders'
                    }),
                    SGTL.botonFila('editar', {
                        id: g.Grupo_ID
                    }),
                    SGTL.botonFila('eliminar', {
                        id: g.Grupo_ID
                    })
                ]) +
                '</td>' +
                '</tr>'
        );

        sincronizarSelectoresGrupo();
        el('registrarGrupo').disabled = ocupado;
        el('camposPermisos').disabled = ocupado || !cargado;
        el('camposIntegrantes').disabled = ocupado || !cargado;

        el('guardarPermisos').disabled =
            ocupado ||
            !cargado ||
            iguales(originalesMenus, elegidosMenus);

        const cambios = cambiosIntegrantes();
        const total = cambios.AgregarIds.length + cambios.QuitarIds.length;

        el('guardarIntegrantes').disabled =
            ocupado || !cargado || total === 0;

        el('deshacerIntegrantes').disabled =
            ocupado || !cargado || total === 0;

        el('cambiosIntegrantes').textContent = total
            ? cambios.AgregarIds.length + ' para agregar y ' +
            cambios.QuitarIds.length + ' para quitar.'
            : 'No hay cambios pendientes.';

        ['Disponibles', 'Asignados'].forEach(lado => {
            tabla(lado, visibles(lado), usuario => {
                const quitar = lado === 'Asignados';
                const permitido = !quitar || puedeQuitar(usuario);
                const motivo = 'No se puede quitar: es su único grupo.';

                return '<tr>' +
                    '<td class="text-break">' +
                    '<strong>' +
                    SGTL.escapar(usuario.Nombre_Usuario) +
                    '</strong>' +
                    '<small class="d-block text-muted">' +
                    SGTL.escapar(usuario.NombreCompleto) +
                    '</small>' +
                    (
                        !permitido
                            ? '<small class="d-block text-danger">' +
                            motivo +
                            '</small>'
                            : ''
                    ) +
                    '</td>' +
                    '<td class="text-end text-nowrap">' +
                    SGTL.botonFila(
                        quitar ? 'eliminar' : 'siguiente',
                        {
                            id: usuario.Usuario_ID,
                            texto: quitar ? 'Quitar' : 'Agregar',
                            icono: quitar
                                ? 'bi-dash-circle'
                                : 'bi-plus-circle',
                            deshabilitado: ocupado || !permitido,
                            motivo: ocupado
                                ? 'Esperá a que termine la operación.'
                                : motivo
                        }
                    ) +
                    '</td>' +
                    '</tr>';
            });
        });

        el('agregarTodos').disabled =
            ocupado || !cargado || !visibles('Disponibles').length;

        el('quitarTodos').disabled =
            ocupado ||
            !cargado ||
            !visibles('Asignados').some(puedeQuitar);
    }

    async function cargarGrupos() {
        grupos = await pedir('');

        const opciones =
            '<option value="">Seleccioná un grupo</option>' +
            grupos.map(g =>
                '<option value="' + g.Grupo_ID + '">' +
                SGTL.escapar(g.Grupo_Nombre) +
                '</option>'
            ).join('');

        selectoresGrupo.forEach(id => {
            el(id).innerHTML = opciones;
        });

        renderizar();
    }

    function dibujarPermisos() {
        if (!menus.length) {
            el('permisosGrupo').textContent = 'Todavía no hay permisos disponibles.';
            return;
        }

        const modulos = new Map([
            ['clientes', 'Clientes'],
            ['choferes', 'Choferes'],
            ['camiones', 'Camiones'],
            ['viajes', 'Viajes'],
            ['origenes y destinos', 'Viajes'],
            ['tarifas', 'Viajes'],
            ['hoja de ruta', 'Viajes'],
            ['proformas', 'Facturación'],
            ['facturacion', 'Facturación'],
            ['tipos de comprobante', 'Facturación'],
            ['presupuestos', 'Facturación'],
            ['cuenta corriente', 'Facturación'],
            ['usuarios', 'Usuarios'],
            ['grupos y permisos', 'Usuarios'],
            ['e-mail', 'Configuración'],
            ['whatsapp', 'Configuración'],
            ['integracion whatsapp', 'Configuración'],
            ['contenido', 'Configuración'],
            ['empresa', 'Configuración'],
            ['dashboard', 'Dashboard'],
            ['auditoria', 'Auditoría']
        ]);

        const agrupados = new Map();

        menus.forEach(menu => {
            const nombre = normalizar(menu.Menu_Nombre).trim()
                .replace(/^(listado de|gestion de|listar|gestionar)\s+/, '');

            const modulo = menu.EsTablero
                ? 'Tableros'
                : modulos.get(nombre) || 'Otros permisos';

            if (!agrupados.has(modulo)) agrupados.set(modulo, []);
            agrupados.get(modulo).push(menu);
        });

        const opcion = menu => {
            const nombre = String(menu.Menu_Nombre || '').trim()
                .replace(/^Listado de\s+/i, 'Listar ')
                .replace(/^Gesti[oó]n de\s+/i, 'Gestionar ');

            return '<div class="form-check">' +
                '<input type="checkbox" class="form-check-input" ' +
                'data-permiso="' + menu.Menu_ID + '" id="permiso' + menu.Menu_ID + '"' +
                (elegidosMenus.has(menu.Menu_ID) ? ' checked' : '') + '>' +
                '<label class="form-check-label" for="permiso' + menu.Menu_ID + '">' +
                SGTL.escapar(nombre) + '</label></div>';
        };

        const tarjetas = Array.from(agrupados)
            .sort(([a], [b]) => a.localeCompare(b, 'es'))
            .map(([nombre, permisos], indice) =>
                '<div class="col">' +
                '<section class="border rounded p-3 h-100" ' +
                'aria-labelledby="tituloModulo' + indice + '">' +
                '<div class="form-check mb-3">' +
                '<input type="checkbox" class="form-check-input" data-modulo ' +
                'id="moduloPermisos' + indice + '">' +
                '<label id="tituloModulo' + indice + '" ' +
                'class="form-check-label fw-semibold" ' +
                'for="moduloPermisos' + indice + '">' +
                SGTL.escapar(nombre) + '</label>' +
                '</div><div class="d-grid gap-2 ms-4">' +
                permisos.map(opcion).join('') +
                '</div></section></div>'
            );

        el('permisosGrupo').innerHTML =
            '<p class="text-muted small">' +
            'Marcá un módulo para seleccionar todos sus permisos. ' +
            'El guion indica que tiene una selección parcial.</p>' +
            '<div class="row row-cols-1 row-cols-md-2 row-cols-xl-5 g-3">' +
            tarjetas.join('') +
            '</div>';

        actualizarModulosPermisos();
    }

    function actualizarModulosPermisos() {
        el('permisosGrupo').querySelectorAll('[data-modulo]').forEach(modulo => {
            const opciones = Array.from(
                modulo.closest('section').querySelectorAll('[data-permiso]')
            );

            const seleccionados = opciones.filter(opcion =>
                elegidosMenus.has(Number(opcion.dataset.permiso))
            ).length;

            modulo.checked = seleccionados === opciones.length;
            modulo.indeterminate = seleccionados > 0 && seleccionados < opciones.length;
        });
    }

    function cambiarPermisos(evento) {
        const campo = evento.target;

        if (ocupado || !cargado || !campo.matches('[data-permiso], [data-modulo]')) {
            return;
        }

        const opciones = campo.matches('[data-modulo]')
            ? campo.closest('section').querySelectorAll('[data-permiso]')
            : [campo];

        opciones.forEach(opcion => {
            const id = Number(opcion.dataset.permiso);
            opcion.checked = campo.checked;

            if (campo.checked) {
                elegidosMenus.add(id);
            } else {
                elegidosMenus.delete(id);
            }
        });

        actualizarModulosPermisos();
        renderizar();
    }

    async function seleccionar(id) {
        if (ocupado) {
            sincronizarSelectoresGrupo();
            return;
        }

        if (pendientes()) {
            const descartar = await SGTL.confirmar({
                titulo: 'Descartar cambios pendientes',
                mensaje: 'Tenés cambios sin guardar. ¿Querés descartarlos y volver a cargar el grupo elegido?',
                verbo: 'Descartar',
                peligro: true
            });

            if (!descartar) {
                sincronizarSelectoresGrupo();
                return;
            }
        }

        grupoId = id;
        cargado = false;

        menus = [];
        integrantes = [];

        originalesMenus = new Set();
        elegidosMenus = new Set();
        originalesUsuarios = new Set();
        elegidosUsuarios = new Set();

        el('buscarDisponibles').value = '';
        el('buscarAsignados').value = '';

        paginas.Disponibles = 1;
        paginas.Asignados = 1;

        SGTL.avisoFormulario('#avisoGrupo', '');

        sincronizarSelectoresGrupo();
        el('permisosGrupo').textContent =
            id ? 'Cargando…' : 'Seleccioná un grupo.';

        if (!id) {
            renderizar();
            return;
        }

        ocupado = true;
        renderizar();

        SGTL.tabla.cargando('#filasDisponibles', 2);
        SGTL.tabla.cargando('#filasAsignados', 2);

        try {
            [menus, integrantes] = await Promise.all([
                pedir('/' + id + '/Menus'),
                pedir('/' + id + '/Usuarios')
            ]);

            originalesMenus = new Set(
                menus.filter(m => m.Asignado).map(m => m.Menu_ID)
            );

            elegidosMenus = new Set(originalesMenus);

            originalesUsuarios = new Set(
                integrantes
                    .filter(u => u.Asignado)
                    .map(u => u.Usuario_ID)
            );

            elegidosUsuarios = new Set(originalesUsuarios);

            dibujarPermisos();

            cargado = true;
        } catch (error) {
            grupoId = 0;

            el('permisosGrupo').textContent =
                'Seleccioná un grupo para volver a cargarlo.';

            SGTL.avisoFormulario(
                '#avisoGrupo',
                error.mensajeUsuario || 'No se pudo cargar el grupo.'
            );
        } finally {
            ocupado = false;
            renderizar();
        }
    }

    function mover(id, agregar) {
        if (ocupado || !cargado) return;

        const usuario = integrantes.find(u => u.Usuario_ID === id);

        if (!usuario) return;

        if (agregar ? !usuario.PuedeAgregar : !puedeQuitar(usuario)) {
            return;
        }

        if (agregar) {
            elegidosUsuarios.add(id);
        } else {
            elegidosUsuarios.delete(id);
        }
    }

    async function guardarPermisos() {
        if (
            ocupado ||
            !cargado ||
            iguales(originalesMenus, elegidosMenus)
        ) {
            return;
        }

        ocupado = true;

        const datos = {
            MenuIds: Array.from(elegidosMenus),
            MenuIdsOriginales: Array.from(originalesMenus)
        };

        const listo = SGTL.procesando('#guardarPermisos');

        renderizar();
        SGTL.avisoFormulario('#avisoGrupo', '');

        try {
            await pedir('/' + grupoId + '/Menus', 'POST', datos);

            originalesMenus = new Set(elegidosMenus);

            SGTL.toastExito('Permisos guardados.');
        } catch (error) {
            SGTL.avisoFormulario(
                '#avisoGrupo',
                error.mensajeUsuario || 'No se pudieron guardar los permisos.'
            );
        } finally {
            listo();
            ocupado = false;
            renderizar();
        }
    }

    async function guardarIntegrantes() {
        if (
            ocupado ||
            !cargado ||
            iguales(originalesUsuarios, elegidosUsuarios)
        ) {
            return;
        }

        ocupado = true;

        const datos = cambiosIntegrantes();
        const listo = SGTL.procesando('#guardarIntegrantes');

        renderizar();
        SGTL.avisoFormulario('#avisoGrupo', '');

        try {
            await pedir(
                '/' + grupoId + '/Usuarios/Cambios',
                'POST',
                datos
            );

            originalesUsuarios = new Set(elegidosUsuarios);

            SGTL.toastExito('Usuarios guardados.');
        } catch (error) {
            SGTL.avisoFormulario(
                '#avisoGrupo',
                error.mensajeUsuario || 'No se pudieron guardar los usuarios.'
            );
        } finally {
            listo();
            ocupado = false;
            renderizar();
        }
    }

    function abrirNombre(id) {
        if (ocupado) return;

        SGTL.reiniciarFormulario('#formGrupo', '#avisoNombreGrupo');
        validacion.reiniciar();

        edicionId = id || null;

        el('tituloModalGrupo').textContent =
            id ? 'Editar grupo' : 'Registrar grupo';

        el('nombreGrupo').value = id
            ? grupos.find(g => g.Grupo_ID === id).Grupo_Nombre
            : '';

        cambiosModal.limpiar();
        SGTL.modal('#modalGrupo', 'show');
    }

    async function guardarNombre(evento) {
        evento.preventDefault();

        if (ocupado) return;

        validacion.validarTodo();

        if (!SGTL.revisarFormulario('#formGrupo', '#avisoNombreGrupo')) {
            return;
        }

        ocupado = true;

        const listo = SGTL.procesando('#guardarNombreGrupo');

        el('camposGrupo').disabled = true;
        renderizar();

        try {
            await pedir(
                edicionId ? '/' + edicionId : '',
                edicionId ? 'PUT' : 'POST',
                {
                    Grupo_Nombre: el('nombreGrupo').value.trim()
                }
            );

            cambiosModal.limpiar();
            listo();

            SGTL.modal('#modalGrupo', 'hide');

            SGTL.toastExito(
                edicionId ? 'Grupo actualizado.' : 'Grupo registrado.'
            );

            try {
                await cargarGrupos();
            } catch (error) {
                SGTL.toastError(
                    'El grupo se guardó, pero no se pudo actualizar la lista. Volvé a cargar la pantalla.'
                );
            }
        } catch (error) {
            SGTL.avisoFormulario(
                '#avisoNombreGrupo',
                error.mensajeUsuario || 'No se pudo guardar el grupo.'
            );
        } finally {
            listo();
            el('camposGrupo').disabled = false;
            ocupado = false;
            renderizar();
        }
    }

    async function accionGrupo(evento) {
        const boton = evento.target.closest('[data-accion]');

        if (!boton || ocupado) return;

        const id = Number(boton.dataset.id);
        const grupo = grupos.find(g => g.Grupo_ID === id);

        if (!grupo) return;

        if (boton.dataset.accion === 'ver') {
            await seleccionar(id);

            if (grupoId === id && cargado) {
                window.bootstrap.Tab
                    .getOrCreateInstance(el('tabPermisos'))
                    .show();
            }

            return;
        }

        if (boton.dataset.accion === 'editar') {
            abrirNombre(id);
            return;
        }

        if (boton.dataset.accion !== 'eliminar') return;

        await SGTL.confirmar({
            titulo: 'Eliminar grupo',
            mensaje: '¿Querés eliminar el grupo ' +
                grupo.Grupo_Nombre +
                '? Se quitarán sus permisos y sus integrantes. No se puede deshacer.',
            verbo: 'Eliminar',
            peligro: true,
            accion: async () => {
                ocupado = true;
                renderizar();

                try {
                    await pedir('/' + id, 'DELETE');

                    if (grupoId === id) {
                        grupoId = 0;
                        cargado = false;
                        menus = [];
                        integrantes = [];

                        originalesMenus = new Set();
                        elegidosMenus = new Set();
                        originalesUsuarios = new Set();
                        elegidosUsuarios = new Set();

                        el('permisosGrupo').textContent =
                            'Seleccioná un grupo.';
                    }

                    SGTL.toastExito('Grupo eliminado.');

                    try {
                        await cargarGrupos();
                    } catch (error) {
                        SGTL.toastError(
                            'El grupo se eliminó, pero no se pudo actualizar la lista. Volvé a cargar la pantalla.'
                        );
                    }
                } finally {
                    ocupado = false;
                    renderizar();
                }
            }
        });
    }

    async function iniciar() {
        try {
            await Promise.all([
                window.loadHeader(),
                window.loadFooter()
            ]);

            try {
                const contenido = await SGTL.ajax({
                    url: SGTL.api + '/GestionContenido/1'
                });

                window.applyStyles(
                    contenido.Logo,
                    contenido.ColorFondo,
                    contenido.ColorBotonesMenu,
                    contenido.ContenidoPiePagina
                );
            } catch (error) {
                window.applyStyles();
                SGTL.toastError('No se pudo cargar la apariencia.');
            }

            const acceso = await SGTL.ajax({
                url: SGTL.api + '/Usuarios/Acceso'
            });

            if (!acceso.PuedeGestionarGrupos) {
                el('errorInicial').textContent =
                    'No tenés permiso para acceder a esta pantalla.';

                el('errorInicial').classList.remove('d-none');
                return;
            }

            validacion = SGTL.validador([
                {
                    id: 'nombreGrupo',
                    requerido: 'Completá el nombre del grupo.',
                    max: 100
                }
            ]);

            cambiosModal = SGTL.cambiosSinGuardar('#modalGrupo');

            el('formGrupo').addEventListener('submit', guardarNombre);

            el('registrarGrupo').addEventListener('click', () => {
                abrirNombre(null);
            });

            el('filasGrupos').addEventListener('click', accionGrupo);

            selectoresGrupo.forEach(id => {
                el(id).addEventListener('change', evento => {
                    seleccionar(Number(evento.target.value) || 0);
                });
            });

            el('guardarPermisos').addEventListener('click', guardarPermisos);
            el('guardarIntegrantes').addEventListener('click', guardarIntegrantes);

            el('deshacerIntegrantes').addEventListener('click', () => {
                elegidosUsuarios = new Set(originalesUsuarios);
                renderizar();
            });

            el('permisosGrupo').addEventListener('change', cambiarPermisos);

            ['Disponibles', 'Asignados'].forEach(lado => {
                el('buscar' + lado).addEventListener('input', () => {
                    paginas[lado] = 1;
                    renderizar();
                });

                SGTL.filtros(['#buscar' + lado], () => {
                    paginas[lado] = 1;
                    renderizar();
                });

                el('filas' + lado).addEventListener('click', evento => {
                    const boton = evento.target.closest('[data-accion]');

                    if (!boton) return;

                    mover(
                        Number(boton.dataset.id),
                        lado === 'Disponibles'
                    );

                    renderizar();
                });
            });

            el('agregarTodos').addEventListener('click', () => {
                visibles('Disponibles').forEach(u => {
                    mover(u.Usuario_ID, true);
                });

                renderizar();
            });

            el('quitarTodos').addEventListener('click', () => {
                visibles('Asignados').forEach(u => {
                    mover(u.Usuario_ID, false);
                });

                renderizar();
            });

            el('filtrosGrupos').addEventListener('submit', evento => {
                evento.preventDefault();
                paginas.Grupos = 1;
                renderizar();
            });

            SGTL.filtros(['#fGrupo'], () => {
                paginas.Grupos = 1;
                renderizar();
            });

            await cargarGrupos();

            el('app').classList.remove('d-none');
        } catch (error) {
            el('errorInicial').textContent =
                error.mensajeUsuario ||
                'No se pudo abrir la pantalla. Volvé a cargarla.';

            el('errorInicial').classList.remove('d-none');
        } finally {
            el('cargando').classList.replace('d-flex', 'd-none');
        }
    }

    document.addEventListener('DOMContentLoaded', iniciar);
})();