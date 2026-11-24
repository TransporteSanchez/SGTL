(function () {
    'use strict';

    const AYUDA_CLAVE =
        'De 8 a 20 caracteres, con al menos una letra y un número.';

    const ERROR_CLAVE =
        'Tiene que tener de 8 a 20 caracteres, con al menos una letra y un número.';

    const el = id => document.getElementById(id);

    const textoRol = rol => ({
        admin: 'Administrador',
        user: 'Usuario',
        chofer: 'Chofer'
    })[String(rol || '').trim().toLowerCase()] || 'Sin rol';

    const pedir = (ruta, type = 'GET', datos) => SGTL.ajax({
        url: SGTL.api + '/Usuarios' + ruta,
        type: type,
        contentType: 'application/json',
        data: datos === undefined ? undefined : JSON.stringify(datos)
    }, 'No se pudo completar la operación de usuarios. Probá de nuevo.');

    let acceso;
    let gestionar;
    let validador;
    let cambiosModal;

    let pagina = 1;
    let tamanio = 15;
    let secuencia = 0;
    let editando = null;
    let abriendo = false;
    let guardando = false;

    let cache = new Map();
    let gruposOriginales = [];
    let versionOriginal = null;

    function filtros() {
        const datos = {
            nombreusuario: el('fUsuario').value.trim(),
            nombre: el('fNombre').value.trim(),
            apellido: el('fApellido').value.trim(),
            rol: el('fRol').value,
            EstadoUsuario: el('fEstado').value
        };

        for (const clave of Object.keys(datos)) {
            if (datos[clave] === '') {
                delete datos[clave];
            }
        }

        const rango = SGTL.valorRango('#fFecha');

        if (rango) {
            datos.desde = rango.desde;
            datos.hasta = rango.hasta;
        }

        return datos;
    }

    async function buscar(destino = 1) {
        const pedido = ++secuencia;

        SGTL.tabla.cargando('#filasUsuarios', 7);
        SGTL.tabla.paginacion('#paginacionUsuarios', { total: 0 });

        try {
            const parametros = new URLSearchParams(
                Object.assign(filtros(), {
                    page: destino,
                    pageSize: tamanio
                })
            );

            const datos = await pedir('/Buscar?' + parametros.toString());

            if (pedido !== secuencia) return;

            pagina = datos.Pagina;
            cache = new Map(datos.Results.map(u => [u.Usuario_ID, u]));

            SGTL.tabla.paginacion('#paginacionUsuarios', {
                total: datos.TotalRecords,
                pagina: pagina,
                tamanioPagina: tamanio,
                alCambiarPagina: buscar,
                alCambiarTamanio: valor => {
                    tamanio = valor;
                    buscar(1);
                }
            });

            if (!datos.Results.length) {
                SGTL.tabla.vacia('#filasUsuarios', 7);
                return;
            }

            SGTL.tabla.llenar('#filasUsuarios', datos.Results.map(u => {
                const acciones = [
                    SGTL.botonFila('ver', { id: u.Usuario_ID })
                ];

                const esAdmin = String(u.Rol || '')
                    .trim()
                    .toLowerCase() === 'admin';

                const operadorAdmin = String(acceso.Rol)
                    .trim()
                    .toLowerCase() === 'admin';

                if (gestionar && (operadorAdmin || !esAdmin)) {
                    acciones.push(
                        SGTL.botonFila('editar', { id: u.Usuario_ID })
                    );

                    if (u.Usuario_ID !== acceso.Usuario_ID) {
                        acciones.push(
                            SGTL.botonFila(
                                u.EstadoUsuario === 'Activo'
                                    ? 'inactivar'
                                    : 'activar',
                                { id: u.Usuario_ID }
                            )
                        );

                        acciones.push(
                            SGTL.botonFila('eliminar', {
                                id: u.Usuario_ID
                            })
                        );
                    }
                }

                return '<tr>' +
                    '<td>' + SGTL.escapar(u.Nombre_Usuario) + '</td>' +
                    '<td>' + SGTL.escapar(u.Nombre) + '</td>' +
                    '<td>' + SGTL.escapar(u.Apellido) + '</td>' +
                    '<td>' + SGTL.escapar(textoRol(u.Rol)) + '</td>' +
                    '<td class="text-center">' +
                    SGTL.estado(u.EstadoUsuario) +
                    '</td>' +
                    '<td class="text-center text-nowrap">' +
                    SGTL.fecha(u.Fecha_Alta) +
                    '</td>' +
                    '<td class="text-center">' +
                    SGTL.accionesFila(acciones) +
                    '</td>' +
                    '</tr>';
            }).join(''));
        } catch (error) {
            if (pedido !== secuencia) return;

            cache.clear();

            SGTL.tabla.vacia(
                '#filasUsuarios',
                7,
                'No se pudieron cargar los usuarios.'
            );

            SGTL.toastError(
                error.mensajeUsuario || 'No se pudieron cargar los usuarios.'
            );
        }
    }

    function actualizarRol() {
        const rol = el('usuarioRol').value;

        el('zonaGruposUsuario').classList.toggle(
            'd-none',
            rol !== 'user'
        );

        if (rol !== 'user') {
            SGTL.limpiarError('#gruposUsuario');
        }

        el('ayudaRol').textContent =
            rol === 'admin'
                ? 'Tiene acceso completo por su rol.'
                : rol === 'chofer'
                    ? 'Por ahora, este rol no tiene pantallas habilitadas.'
                    : rol === 'user'
                        ? 'Sus grupos determinan las pantallas que puede consultar o gestionar.'
                        : '';
    }

    async function abrirFormulario(id, boton) {
        if (!gestionar || abriendo || guardando) return;

        abriendo = true;
        const listo = SGTL.procesando(boton);

        try {
            const pedidos = [pedir('/Grupos')];

            if (id) {
                pedidos.push(
                    pedir('/' + id),
                    pedir('/' + id + '/Detalles')
                );
            }

            const datos = await Promise.all(pedidos);

            const catalogo = new Map(
                datos[0].map(g => [g.Grupo_ID, g])
            );

            if (id) {
                datos[2].Grupos.forEach(g => {
                    if (!catalogo.has(g.Grupo_ID)) {
                        catalogo.set(g.Grupo_ID, g);
                    }
                });
            }

            const gruposFormulario = Array.from(catalogo.values())
                .sort((a, b) =>
                    a.Grupo_Nombre.localeCompare(b.Grupo_Nombre)
                );

            SGTL.reiniciarFormulario('#formUsuario', '#avisoUsuario');
            validador.reiniciar();

            editando = id || null;
            gruposOriginales = id ? datos[2].GrupoIds.slice() : [];
            versionOriginal = id ? datos[1].VersionSesion : null;

            const u = id ? datos[1] : {
                Nombre: '',
                Apellido: '',
                Nombre_Usuario: '',
                Email: '',
                Rol: 'user',
                EstadoUsuario: 'Activo'
            };

            const ids = new Set(
                id ? datos[2].Grupos.map(g => g.Grupo_ID) : []
            );

            el('tituloModalUsuario').textContent =
                id ? 'Editar usuario' : 'Registrar usuario';
            el('usuarioNombre').value = u.Nombre || '';
            el('usuarioApellido').value = u.Apellido || '';
            el('usuarioCuenta').value = u.Nombre_Usuario || '';
            el('usuarioCuenta').disabled = !!id;
            el('usuarioEmail').value = u.Email || '';
            el('usuarioClave').value = '';
            el('ayudaClave').textContent = id
                ? 'Dejá el campo vacío para conservar la contraseña. ' + AYUDA_CLAVE
                : AYUDA_CLAVE;
            el('usuarioRol').value = String(u.Rol || '')
                .trim()
                .toLowerCase();
            el('usuarioRol').disabled = id === acceso.Usuario_ID;
            el('usuarioActivo').checked = u.EstadoUsuario === 'Activo';
            el('usuarioActivo').disabled = id === acceso.Usuario_ID;
            el('opcionesGruposUsuario').innerHTML =
                gruposFormulario.length
                    ? gruposFormulario.map(g =>
                        '<div class="col-12 col-md-6">' +
                        '<div class="form-check">' +
                        '<input type="checkbox" ' +
                        'class="form-check-input" ' +
                        'id="grupoUsuario' + g.Grupo_ID + '" ' +
                        'value="' + g.Grupo_ID + '"' +
                        (ids.has(g.Grupo_ID) ? ' checked' : '') +
                        '>' +
                        '<label class="form-check-label" ' +
                        'for="grupoUsuario' + g.Grupo_ID + '">' +
                        SGTL.escapar(g.Grupo_Nombre) +
                        '</label>' +
                        '</div>' +
                        '</div>'
                    ).join('')
                    : '<p class="text-muted mb-0">' +
                    'Todavía no hay grupos. Registrá un grupo antes de crear usuarios con rol Usuario.' +
                    '</p>';

            actualizarRol();
            cambiosModal.limpiar();

            SGTL.modal('#modalUsuario', 'show');
        } catch (error) {
            SGTL.toastError(
                error.mensajeUsuario || 'No se pudo abrir el formulario.'
            );
        } finally {
            listo();
            abriendo = false;
        }
    }

    async function guardar(evento) {
        evento.preventDefault();

        if (!gestionar || guardando) return;

        validador.validarTodo();

        const clave = el('usuarioClave').value;

        const grupos = Array.from(
            el('opcionesGruposUsuario').querySelectorAll('input:checked')
        ).map(c => Number(c.value));

        if (el('usuarioRol').value === 'user' && !grupos.length) {
            SGTL.marcarError(
                '#gruposUsuario',
                'Asigná al menos un grupo.'
            );
        }

        if (!SGTL.revisarFormulario('#formUsuario', '#avisoUsuario')) {
            return;
        }

        const datos = {
            Nombre: el('usuarioNombre').value.trim(),
            Apellido: el('usuarioApellido').value.trim(),
            Nombre_Usuario: el('usuarioCuenta').value.trim(),
            Email: el('usuarioEmail').value.trim(),
            Contraseña: clave,
            Rol: el('usuarioRol').value,
            EstadoUsuario: el('usuarioActivo').checked
                ? 'Activo'
                : 'Inactivo',
            GrupoIds: grupos,
            GrupoIdsOriginales: gruposOriginales.slice(),
            VersionSesionOriginal: versionOriginal
        };

        guardando = true;

        const listo = SGTL.procesando('#guardarUsuario');
        el('camposUsuario').disabled = true;

        try {
            const respuesta = await pedir(
                editando ? '/' + editando : '',
                editando ? 'PUT' : 'POST',
                datos
            );

            cambiosModal.limpiar();
            listo();

            SGTL.modal('#modalUsuario', 'hide');
            SGTL.toastExito(respuesta.message);

            if (respuesta.SesionRevocada) {
                SGTL.toastError(
                    SGTL.mensajeError(
                        { status: 401 },
                        'Volvé a iniciar sesión.'
                    )
                );

                return;
            }

            await buscar(pagina);
        } catch (error) {
            const dato = error.xhr && error.xhr.responseJSON;

            const campo = dato && (
                dato.code === 'usuario_duplicado'
                    ? 'usuarioCuenta'
                    : /^email_/.test(dato.code || '')
                        ? 'usuarioEmail'
                        : null
            );

            if (campo) {
                el(campo).dataset.errorRemoto = dato.message;
                SGTL.marcarError(el(campo), dato.message);
            }

            SGTL.avisoFormulario(
                '#avisoUsuario',
                error.mensajeUsuario || 'No se pudo guardar el usuario.'
            );
        } finally {
            el('camposUsuario').disabled = false;
            listo();
            guardando = false;
        }
    }

    async function verDetalle(id, boton) {
        if (abriendo || guardando) return;

        abriendo = true;
        const listo = SGTL.procesando(boton);

        try {
            const [u, detalle] = await Promise.all([
                pedir('/' + id),
                pedir('/' + id + '/Detalles')
            ]);

            const datos = [
                ['Usuario', u.Nombre_Usuario],
                ['Nombre', u.Nombre],
                ['Apellido', u.Apellido],
                ['Rol', textoRol(u.Rol)],
                ['E-mail', u.Email || 'Sin e-mail'],
                ['Fecha de alta', SGTL.fecha(u.Fecha_Alta)]
            ];

            const rol = String(u.Rol || '').trim().toLowerCase();

            let gruposHtml;

            if (rol === 'admin') {
                gruposHtml =
                    '<p class="mb-0">Tiene acceso completo por su rol.</p>';
            } else if (rol === 'chofer') {
                gruposHtml =
                    '<p class="mb-0">Por ahora, el rol Chofer no tiene pantallas habilitadas.</p>';
            } else if (detalle.Grupos.length) {
                gruposHtml = detalle.Grupos.map(g =>
                    '<div class="border rounded p-3 mb-2">' +
                    '<h4 class="h6">' +
                    SGTL.escapar(g.Grupo_Nombre) +
                    '</h4>' +
                    (
                        g.Menus.length
                            ? '<ul class="mb-0">' +
                            g.Menus.map(m =>
                                '<li>' + SGTL.escapar(m) + '</li>'
                            ).join('') +
                            '</ul>'
                            : '<p class="text-muted mb-0">' +
                            'Este grupo todavía no tiene permisos.' +
                            '</p>'
                    ) +
                    '</div>'
                ).join('');
            } else {
                gruposHtml =
                    '<p class="text-muted mb-0">Todavía no tiene grupos asignados.</p>';
            }

            el('detalleUsuario').innerHTML =
                '<dl class="row g-3">' +
                datos.map(d =>
                    '<div class="col-12 col-md-6">' +
                    '<dt>' + SGTL.escapar(d[0]) + '</dt>' +
                    '<dd class="mb-0 text-break">' +
                    SGTL.escapar(d[1]) +
                    '</dd>' +
                    '</div>'
                ).join('') +
                '<div class="col-12">' +
                '<dt>Estado</dt>' +
                '<dd class="mb-0">' +
                SGTL.estado(u.EstadoUsuario) +
                '</dd>' +
                '</div>' +
                '</dl>' +
                '<h3 class="h6">Grupos y permisos</h3>' +
                gruposHtml;

            SGTL.modal('#modalDetalleUsuario', 'show');
        } catch (error) {
            SGTL.toastError(
                error.mensajeUsuario || 'No se pudo cargar el detalle.'
            );
        } finally {
            listo();
            abriendo = false;
        }
    }

    async function accionFila(evento) {
        const boton = evento.target.closest('[data-accion]');

        if (!boton || guardando) return;

        const id = Number(boton.dataset.id);
        const u = cache.get(id);
        const accion = boton.dataset.accion;

        if (!u) return;

        if (accion === 'ver') {
            await verDetalle(id, boton);
            return;
        }

        if (!gestionar) return;

        if (accion === 'editar') {
            await abrirFormulario(id, boton);
            return;
        }

        if (accion === 'eliminar') {
            await SGTL.confirmar({
                titulo: 'Eliminar usuario',
                mensaje: '¿Querés eliminar el usuario ' +
                    u.Nombre_Usuario + '? No se puede deshacer.',
                verbo: 'Eliminar',
                peligro: true,
                accion: async () => {
                    await pedir('/' + id, 'DELETE');
                    SGTL.toastExito('Usuario eliminado.');
                    await buscar(pagina);
                }
            });

            return;
        }

        if (accion !== 'activar' && accion !== 'inactivar') return;

        const listo = SGTL.procesando(boton);

        try {
            await pedir('/EstadoUsuario/' + id, 'PUT', {
                EstadoUsuario: accion === 'activar'
                    ? 'Activo'
                    : 'Inactivo'
            });

            SGTL.toastExito(
                accion === 'activar'
                    ? 'Usuario activado.'
                    : 'Usuario inactivado.'
            );

            await buscar(pagina);
        } catch (error) {
            SGTL.toastError(
                error.mensajeUsuario || 'No se pudo cambiar el estado.'
            );
        } finally {
            listo();
        }
    }

    async function exportar() {
        const boton = el('exportarUsuarios');

        if (boton.disabled) return;

        const listo = SGTL.procesando(boton);

        try {
            const parametros = new URLSearchParams(
                Object.assign(filtros(), {
                    page: 1,
                    pageSize: 0
                })
            );

            const datos = await pedir('/Buscar?' + parametros.toString());

            SGTL.descargarCSV(
                'usuarios.csv',
                [
                    'Usuario',
                    'Nombre',
                    'Apellido',
                    'Rol',
                    'Estado',
                    'Fecha de alta'
                ],
                datos.Results.map(u => [
                    u.Nombre_Usuario,
                    u.Nombre,
                    u.Apellido,
                    textoRol(u.Rol),
                    u.EstadoUsuario,
                    SGTL.fecha(u.Fecha_Alta)
                ])
            );
        } catch (error) {
            SGTL.toastError(
                error.mensajeUsuario || 'No se pudo descargar el reporte.'
            );
        } finally {
            listo();
        }
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

            acceso = await pedir('/Acceso');
            gestionar = document.body.dataset.modo === 'gestionar';

            const permitido = gestionar
                ? acceso.PuedeGestionarUsuarios
                : acceso.PuedeListarUsuarios;

            if (!permitido) {
                el('errorInicial').textContent =
                    'No tenés permiso para acceder a esta pantalla.';

                el('errorInicial').classList.remove('d-none');
                return;
            }

            if (gestionar) {
                el('registrarUsuario').classList.remove('d-none');

                const roles = await pedir('/Roles');

                roles
                    .filter(r =>
                        r !== 'admin' ||
                        String(acceso.Rol).trim().toLowerCase() === 'admin'
                    )
                    .forEach(r => {
                        el('usuarioRol').appendChild(
                            new Option(textoRol(r), r)
                        );
                    });

                validador = SGTL.validador([
                    {
                        id: 'usuarioNombre',
                        requerido: 'Completá el nombre.',
                        max: 50
                    },
                    {
                        id: 'usuarioApellido',
                        requerido: 'Completá el apellido.',
                        max: 50
                    },
                    {
                        id: 'usuarioCuenta',
                        requerido: 'Completá el nombre de usuario.',
                        max: 50
                    },
                    {
                        id: 'usuarioEmail',
                        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        mensaje: 'Ingresá un e-mail válido.'
                    },
                    {
                        id: 'usuarioRol',
                        requerido: 'Seleccioná un rol.'
                    },
                    {
                        id: 'usuarioClave',

                        get requerido() {
                            return !editando || el('usuarioClave').value.length > 0
                                ? ERROR_CLAVE
                                : '';
                        },

                        validar: (valor, campo) => {
                            const clave = campo.value;

                            return (
                                clave.length < 8 ||
                                clave.length > 20 ||
                                !/[a-zA-Z]/.test(clave) ||
                                !/[0-9]/.test(clave)
                            )
                                ? ERROR_CLAVE
                                : '';
                        }
                    }
                ]);

                cambiosModal = SGTL.cambiosSinGuardar('#modalUsuario');

                el('formUsuario').addEventListener('submit', guardar);
                el('usuarioRol').addEventListener('change', actualizarRol);

                el('opcionesGruposUsuario').addEventListener('change', () => {
                    SGTL.limpiarError('#gruposUsuario');
                });

                el('registrarUsuario').addEventListener('click', evento => {
                    abrirFormulario(null, evento.currentTarget);
                });
            }
            el('filasUsuarios').addEventListener('click', accionFila);
            el('exportarUsuarios').addEventListener('click', exportar);
            el('filtrosUsuarios').addEventListener('submit', evento => {
                evento.preventDefault();
                buscar(1);
            });

            SGTL.rangoFechas('#fFecha', {
                onClose: fechas => {
                    if (fechas.length !== 1) buscar(1);
                }
            });

            SGTL.filtros([
                '#fUsuario',
                '#fNombre',
                '#fApellido',
                '#fRol',
                '#fEstado',
                '#fFecha'
            ], () => buscar(1));

            ['fRol', 'fEstado'].forEach(id => {
                el(id).addEventListener('change', () => buscar(1));
            });

            el('app').classList.remove('d-none');

            await buscar(1);
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