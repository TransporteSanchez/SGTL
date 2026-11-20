(function () {
    'use strict';

    var logo = null;
    var formatos = { 'image/png': 1, 'image/jpeg': 1, 'image/svg+xml': 1, 'image/webp': 1, 'image/x-icon': 1, 'image/vnd.microsoft.icon': 1 };

    function porId(id) { return document.getElementById(id); }

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

    function mostrarLogo() {
        var imagen = porId('empresaLogoPreview');
        var icono = porId('empresaLogoIcono');
        var quitar = porId('btnQuitarLogoEmpresa');
        if (logo) {
            imagen.src = logo;
            imagen.classList.remove('d-none');
            icono.classList.add('d-none');
            quitar.classList.remove('d-none');
            porId('empresaLogoDetalle').textContent = 'Este logo sale en los documentos.';
        } else {
            imagen.removeAttribute('src');
            imagen.classList.add('d-none');
            icono.classList.remove('d-none');
            quitar.classList.add('d-none');
            porId('empresaLogoDetalle').textContent = 'Sin logo: en los documentos sale el nombre.';
        }
    }

    function localidades(provincia, elegida) {
        var select = porId('empresaLocalidad');
        select.disabled = true;
        opciones(select, [], 'Loc_ID', 'Nombre_Localidad', 'Elegí una localidad');
        if (!provincia) return Promise.resolve();
        return pedir('/Provincias/' + provincia + '/Localidades').then(function (lista) {
            opciones(select, (lista || []).slice().sort(function (a, b) {
                return a.Nombre_Localidad.localeCompare(b.Nombre_Localidad);
            }), 'Loc_ID', 'Nombre_Localidad', 'Elegí una localidad', elegida);
            select.disabled = false;
        });
    }

    function mostrar(datos) {
        porId('empresaRazonSocial').value = datos ? (datos.Razon_Social || '') : '';
        porId('empresaNombreComercial').value = datos ? (datos.Nombre_Comercial || '') : '';
        porId('empresaCuit').value = datos ? (datos.CUIT || '') : '';
        porId('empresaCondIva').value = datos && datos.Cond_Fiscal ? String(datos.Cond_Fiscal) : '';
        porId('empresaCalle').value = datos ? (datos.Calle || '') : '';
        porId('empresaAltura').value = datos ? (datos.AlturaCalle || '') : '';
        porId('empresaCodigoPostal').value = datos ? (datos.CodigoPostal || '') : '';
        porId('empresaTelefono').value = datos ? (datos.Telefono || '') : '';
        porId('empresaEmail').value = datos ? (datos.Email || '') : '';
        logo = datos ? (datos.Logo || null) : null;
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
            Logo: logo
        };
    }

    var reglas = SGTL.validador([
        { id: 'empresaRazonSocial', requerido: 'Completá la razón social.', max: 200 },
        { id: 'empresaNombreComercial', max: 100 },
        { id: 'empresaCuit', requerido: 'Completá el CUIT.', validar: function (valor) { return valor.replace(/\D/g, '').length === 11 ? '' : 'El CUIT tiene que tener 11 números.'; } },
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
            opciones(porId('empresaProvincia'), (lista || []).slice().sort(function (a, b) {
                return a.Nombre_Provincia.localeCompare(b.Nombre_Provincia);
            }), 'Prov_ID', 'Nombre_Provincia', 'Elegí una provincia');
            return pedir('/empresa');
        }).then(mostrar).catch(function (error) {
            SGTL.avisoFormulario('#avisoEmpresa', error.message);
        });

        porId('empresaProvincia').addEventListener('change', function () {
            localidades(porId('empresaProvincia').value, '').catch(function (error) {
                SGTL.toastError(error.message);
            });
        });
        porId('btnLogoEmpresa').addEventListener('click', function () { porId('empresaLogoArchivo').click(); });
        porId('btnQuitarLogoEmpresa').addEventListener('click', function () { logo = null; mostrarLogo(); });
        porId('empresaLogoArchivo').addEventListener('change', function () {
            var archivo = porId('empresaLogoArchivo').files[0];
            porId('empresaLogoArchivo').value = '';
            if (!archivo) return;
            if (!formatos[archivo.type]) { SGTL.toastError('Ese formato no sirve para el logo. Elegí un PNG, JPG, SVG, WEBP o ICO.'); return; }
            if (archivo.size > 1024 * 1024) { SGTL.toastError('El logo supera 1 MB. Elegí una imagen más liviana.'); return; }
            var lector = new FileReader();
            lector.onload = function () {
                logo = String(lector.result || '');
                if (logo.length > 1500000) { logo = null; SGTL.toastError('El logo supera 1 MB. Elegí una imagen más liviana.'); }
                mostrarLogo();
            };
            lector.readAsDataURL(archivo);
        });
        porId('formEmpresa').addEventListener('submit', function (evento) {
            evento.preventDefault();
            SGTL.avisoFormulario('#avisoEmpresa', '');
            if (!reglas.validarTodo()) return;
            var listo = SGTL.procesando(porId('btnGuardarEmpresa'));
            pedir('/empresa', 'PUT', cuerpo()).then(function (datos) {
                if (datos && datos.SinCambios) SGTL.toastExito('No hubo cambios para guardar.');
                else SGTL.toastExito('Datos de la empresa guardados.');
                return pedir('/empresa').then(mostrar);
            }).catch(function (error) {
                SGTL.avisoFormulario('#avisoEmpresa', error.message);
            }).then(listo);
        });
    });
})();