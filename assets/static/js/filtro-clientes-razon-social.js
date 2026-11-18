(() => {
    'use strict';

    const selector = document.getElementById('razonSocialClientesSelect');
    if (!selector) return;

    const predictivo = SelectClientePredictivo.inicializar(selector, {
        idCampo: 'txtRazonSocialBusqueda',
        placeholder: 'Ingresá parte de la razón social',
        textoVacio: 'No hay clientes que coincidan.'
    });

    const campo = document.getElementById('txtRazonSocialBusqueda');
    let cargaActual = 0;

    async function recargar() {
        const numeroCarga = ++cargaActual;
        const textoInicial = campo.value;

        predictivo.establecerDeshabilitado(true);
        campo.value = textoInicial;

        try {
            const clientes = await SGTL.ajax({
                url: SGTL.api + '/Clientes',
                type: 'GET'
            }, 'No se pudieron cargar las sugerencias de clientes.')
                .catch(error => {
                    // Este endpoint devuelve 404 cuando no hay clientes.
                    if (error.xhr?.status === 404) return [];
                    throw error;
                });

            if (numeroCarga !== cargaActual) return;

            if (!Array.isArray(clientes)) {
                throw new Error('La respuesta de clientes no es válida.');
            }

            const seleccionado = selector.value;
            const opciones = document.createDocumentFragment();

            opciones.append(new Option('Todos', ''));

            clientes.forEach(cliente => {
                const razonSocial = String(
                    cliente.Razon_Social || ''
                ).trim();

                if (cliente.Cliente_ID == null || !razonSocial) return;

                opciones.append(new Option(
                    razonSocial,
                    String(cliente.Cliente_ID)
                ));
            });

            selector.replaceChildren(opciones);
            selector.value = seleccionado;
        } catch (error) {
            if (numeroCarga !== cargaActual) return;

            SGTL.toastError(
                error.mensajeUsuario ||
                'No se pudieron cargar las sugerencias. Podés buscar escribiendo la razón social.'
            );
        } finally {
            if (numeroCarga === cargaActual) {
                const textoActual = campo.value;

                predictivo.establecerDeshabilitado(false);

                if (!selector.value) {
                    campo.value = textoActual;
                }

                campo.dispatchEvent(
                    new Event('change', { bubbles: true })
                );
            }
        }
    }

    // Sincroniza el select cuando se usa la cruz de limpiar de SGTL.
    document.addEventListener('click', evento => {
        const boton = evento.target.closest('.sgtl-filtro-borrar');
        const filtro = boton?.closest('.sgtl-filtro');

        if (!filtro?.contains(campo)) return;

        selector.value = '';
        SelectClientePredictivo.sincronizar(selector);
    }, true);

    window.FiltroRazonSocialClientes = { recargar };

    if (localStorage.getItem('token')) {
        recargar();
    }
})();