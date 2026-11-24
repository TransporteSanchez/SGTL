(function () {
    'use strict';

    var logo = null;
    var logoGuardado = null;
    var logoCambio;

    function porId(id) { return document.getElementById(id); }

    function formatearCuit(valor) {
        var digitos = String(valor || '').replace(/\D/g, '').slice(0, 11);
        if (digitos.length <= 2) return digitos;
        if (digitos.length <= 10) return digitos.slice(0, 2) + '-' + digitos.slice(2);
        return digitos.slice(0, 2) + '-' + digitos.slice(2, 10) + '-' + digitos.slice(10);
    }

    function pedir(ruta, metodo, cuerpo) {
        return fetch(SGTL.api + ruta, {
            method: metodo || 'GET',
            headers: SGTL.encabezados(cuerpo ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' }),
            cache: 'no-store',
            body: cuerpo ? JSON.stringify(cuerpo) : undefined
        }).catch(function () {
            throw new Error('No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.');
        }).then(function (respuesta) {
            return respuesta.json().catch(function () { return null; }).then(function (datos) {
                if (respuesta.status === 404) return null;
                if (!respuesta.ok) throw new Error(SGTL.mensajeError({ status: respuesta.status, responseJSON: datos }, 'No se pudo completar la operación. Probá de nuevo.'));
                return datos;
            });
        });
    }

    function opciones(select, lista, id, texto, vacio, elegido) {
        select.innerHTML = '<option value="">' + vacio + '</option>' + lista.map(function (item) {
            return '<option value="' + item[id] + '">' + SGTL.escapar(item[texto]) + '</option>';
        }).join('');
        select.value = elegido || '';
    }

    function logoActual() {
        if (logoCambio === undefined) return logoGuardado;
        return logoCambio;
    }

    function mostrarLogo() {
        var actual = logoActual();
        var imagen = porId('empresaLogoPreview');
        var icono = porId('empresaLogoIcono');
        var quitar = porId('btnQuitarLogoEmpresa');
        var detalle;
        if (actual) {
            imagen.src = actual;
            imagen.classList.remove('d-none');
            icono.classList.add('d-none');
            quitar.classList.remove('d-none');
        } else {
            imagen.removeAttribute('src');
            imagen.classList.add('d-none');
            icono.classList.remove('d-none');
            quitar.classList.add('d-none');
        }
        if (logoCambio === null && logoGuardado) detalle = 'Sin guardar · va a salir el nombre.';
        else if (logoCambio) detalle = 'Sin guardar · ' + tamanioLogo(logoCambio);
        else if (actual) detalle = tamanioLogo(actual) + ' · sale en los documentos.';
        else detalle = 'Sin logo: en los documentos sale el nombre.';
        porId('empresaLogoDetalle').textContent = detalle;
    }

    function localidades(provincia, elegida) {
        var select = porId('empresaLocalidad');
        select.disabled = true;
        opciones(select, [], 'Loc_ID', 'Nombre_Localidad', 'Seleccioná una localidad');
        if (!provincia) return Promise.resolve();
        return pedir('/Provincias/' + provincia + '/Localidades').then(function (lista) {
            opciones(select, lista || [], 'Loc_ID', 'Nombre_Localidad', 'Seleccioná una localidad', elegida);
        });
    }

    function mostrar(datos) {
        porId('empresaRazonSocial').value = datos ? (datos.Razon_Social || '') : '';
        porId('empresaNombreComercial').value = datos ? (datos.Nombre_Comercial || '') : '';
        porId('empresaCuit').value = formatearCuit(datos ? datos.CUIT : '');
        porId('empresaCondIva').value = datos && datos.Cond_Fiscal ? String(datos.Cond_Fiscal) : '';
        porId('empresaCalle').value = datos ? (datos.Calle || '') : '';
        porId('empresaAltura').value = datos ? (datos.AlturaCalle || '') : '';
        porId('empresaCodigoPostal').value = datos ? (datos.CodigoPostal || '') : '';
        porId('empresaTelefono').value = datos ? (datos.Telefono || '') : '';
        porId('empresaEmail').value = datos ? (datos.Email || '') : '';
        logo = datos ? (datos.Logo || null) : null;
        logoGuardado = datos ? (datos.Logo || null) : null;
        logoCambio = undefined;
        mostrarLogo();
        porId('registroEmpresa').textContent = datos && datos.Fecha_Modi
            ? 'Última modificación: ' + SGTL.fecha(datos.Fecha_Modi, { hora: true }) + (datos.Usu_Modi ? ', ' + datos.Usu_Modi : '')
            : '';
        var provincia = datos && datos.ProvID ? String(datos.ProvID) : '';
        porId('empresaProvincia').value = provincia;
        return localidades(provincia, datos && datos.LocID ? String(datos.LocID) : '');
    }

    function cuerpo() {
        return {
            Razon_Social: porId('empresaRazonSocial').value,
            Nombre_Comercial: porId('empresaNombreComercial').value,
            CUIT: porId('empresaCuit').value,
            Cond_Fiscal: Number(porId('empresaCondIva').value),
            ProvID: Number(porId('empresaProvincia').value),
            LocID: Number(porId('empresaLocalidad').value),
            Calle: porId('empresaCalle').value,
            AlturaCalle: porId('empresaAltura').value,
            CodigoPostal: porId('empresaCodigoPostal').value,
            Telefono: porId('empresaTelefono').value,
            Email: porId('empresaEmail').value,
            Logo: logoActual()
        };
    }

    var reglas = SGTL.validador([
        { id: 'empresaRazonSocial', requerido: 'Completá la razón social.', max: 200 },
        { id: 'empresaNombreComercial', max: 100 },
        { id: 'empresaCuit', requerido: 'Completá el CUIT.', regex: /^\d{2}-\d{8}-\d$/, mensaje: 'El CUIT tiene que tener 11 números.' },
        { id: 'empresaCondIva', requerido: 'Seleccioná la condición de IVA.' },
        { id: 'empresaProvincia', requerido: 'Seleccioná una provincia.' },
        { id: 'empresaLocalidad', requerido: 'Seleccioná una localidad.' },
        { id: 'empresaCalle', requerido: 'Completá la calle.', max: 100 },
        { id: 'empresaAltura', requerido: 'Completá la altura.', max: 10 },
        { id: 'empresaCodigoPostal', max: 20 },
        { id: 'empresaTelefono', soloNumeros: true, max: 10 },
        { id: 'empresaEmail', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, mensaje: 'Revisá el e-mail: tiene que tener @ y un dominio.' }
    ]);

    document.addEventListener('DOMContentLoaded', function () {
        window.loadHeader().catch(function (error) { console.warn('No se pudo cargar el encabezado.', error); });
        window.loadFooter();
        fetch(SGTL.api + '/GestionContenido/1').then(function (respuesta) {
            if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
            return respuesta.json();
        }).then(function (contenido) {
            window.applyStyles(contenido.Logo, contenido.ColorFondo, contenido.ColorBotonesMenu, contenido.ContenidoPiePagina);
        }).catch(function (error) { console.warn('No se pudo cargar la apariencia de SGTL.', error); });

        pedir('/Provincias').then(function (lista) {
            opciones(porId('empresaProvincia'), lista || [], 'Prov_ID', 'Nombre_Provincia', 'Seleccioná una provincia');
            return pedir('/empresa');
        }).then(mostrar).catch(function (error) {
            SGTL.avisoFormulario('#avisoEmpresa', error.message);
        });

        porId('empresaProvincia').addEventListener('change', function () {
            localidades(porId('empresaProvincia').value, '').catch(function (error) {
                SGTL.toastError(error.message);
            });
        });
        porId('btnQuitarLogoEmpresa').addEventListener('click', function () {
            logoCambio = null;
            mostrarLogo();
        });
        porId('empresaLogoArchivo').addEventListener('change', function () {
            leerArchivoLogo(porId('empresaLogoArchivo'), function (datos) {
                logoCambio = datos;
                mostrarLogo();
            });
        });
        porId('formEmpresa').addEventListener('submit', function (evento) {
            evento.preventDefault();
            reglas.validarTodo();
            if (!SGTL.revisarFormulario('#formEmpresa', '#avisoEmpresa')) return;
            var listo = SGTL.procesando(porId('btnGuardarEmpresa'));
            pedir('/empresa', 'PUT', cuerpo()).then(function (datos) {
                if (datos && datos.SinCambios) SGTL.toastExito('No hubo cambios para guardar.');
                else SGTL.toastExito('Datos de la empresa guardados.');
                return pedir('/empresa').then(mostrar);
            }).catch(function (error) {
                SGTL.avisoFormulario('#avisoEmpresa', error.message);
            }).then(listo);
        });
        porId('empresaCuit').addEventListener('input', function () {
            this.value = formatearCuit(this.value);
        });
    });
})();