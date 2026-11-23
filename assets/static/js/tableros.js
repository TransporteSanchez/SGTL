(function () {
    'use strict';

    var CLAVE_PESTANA = 'sgtl-tableros-pestana';
    var favoritos = [];
    var guardando = false;

    function pedir(ruta, opciones) {
        return fetch(SGTL.api + ruta, opciones || { headers: SGTL.encabezados(), cache: 'no-store' }).then(function (respuesta) {
            return respuesta.json().catch(function () { return null; }).then(function (cuerpo) {
                if (respuesta.ok) return cuerpo;
                var error = new Error(SGTL.mensajeError({ status: respuesta.status, responseJSON: cuerpo || {} }, 'No se pudieron guardar los tableros.'));
                if (respuesta.status === 403 && cuerpo && cuerpo.mensaje) error.message = cuerpo.mensaje;
                throw error;
            });
        });
    }

    function esFavorito(id) {
        return favoritos.some(function (item) { return item.Tablero === id; });
    }

    function textoEstrella(titulo, marcada) {
        return marcada ? 'Sacar ' + titulo + ' del inicio' : 'Agregar ' + titulo + ' al inicio';
    }

    function estrella(tablero) {
        var marcada = esFavorito(tablero.id);
        return '<button type="button" class="btn btn-sm btn-outline-secondary" data-tablero="' + tablero.id + '" aria-pressed="' + marcada + '" aria-label="' +
            SGTL.escapar(textoEstrella(tablero.titulo, marcada)) + '">' +
            '<i class="bi ' + (marcada ? 'bi-star-fill text-warning' : 'bi-star') + '" aria-hidden="true"></i></button>';
    }

    function tarjeta(tablero) {
        var titulo = tablero.tituloId
            ? '<h2 class="card-title h5 mb-0" id="' + tablero.tituloId + '">' + SGTL.escapar(tablero.titulo) + '</h2>'
            : '<h2 class="card-title h5 mb-0">' + SGTL.escapar(tablero.titulo) + '</h2>';
        return '<div class="' + (tablero.tipo === 'kpi' ? 'col-12 col-sm-6 col-xl-3' : 'col-12') + '">' +
            '<article class="card h-100" data-tema="' + tablero.tema + '"><div class="card-header d-flex justify-content-between align-items-center gap-2">' +
            titulo + estrella(tablero) + '</div><div class="card-body">' + tablero.cuerpo + '</div></article></div>';
    }

    function armar(temas) {
        var pestanas = document.getElementById('tablerosPestanas');
        var paneles = document.getElementById('tablerosPaneles');
        var aviso = document.getElementById('tablerosMas');
        if (!temas.length) {
            pestanas.innerHTML = '';
            paneles.innerHTML = '<p class="text-muted text-center py-4">No tenés tableros para ver.</p>';
            if (aviso) aviso.classList.add('d-none');
            return;
        }
        if (aviso) aviso.classList.toggle('d-none', temas.length < 2);
        pestanas.innerHTML = temas.map(function (tema, i) {
            var cantidad = SGTLTableros.CATALOGO.filter(function (tablero) { return tablero.tema === tema.id; }).length;
            return '<li class="nav-item" role="presentation"><button class="nav-link' + (i === 0 ? ' active' : '') + '" id="tab-' + tema.id +
                '" data-bs-toggle="tab" data-bs-target="#pane-' + tema.id + '" type="button" role="tab" data-tema="' + tema.id +
                '" aria-controls="pane-' + tema.id + '" aria-selected="' + (i === 0) + '">' + SGTL.escapar(tema.texto) +
                ' <span class="text-muted">· ' + cantidad + '</span></button></li>';
        }).join('');
        paneles.innerHTML = temas.map(function (tema, i) {
            var delTema = SGTLTableros.CATALOGO.filter(function (tablero) { return tablero.tema === tema.id; });
            var indicadores = delTema.filter(function (tablero) { return tablero.tipo === 'kpi'; });
            var resto = delTema.filter(function (tablero) { return tablero.tipo !== 'kpi'; });
            return '<div class="tab-pane fade' + (i === 0 ? ' show active' : '') + '" id="pane-' + tema.id + '" role="tabpanel">' +
                (indicadores.length ? '<div class="row g-3 mb-3">' + indicadores.map(tarjeta).join('') + '</div>' : '') +
                '<div class="row g-3">' + resto.map(tarjeta).join('') + '</div></div>';
        }).join('');
        var guardada = '';
        try { guardada = localStorage.getItem(CLAVE_PESTANA) || ''; } catch (error) { guardada = ''; }
        var boton = document.getElementById('tab-' + guardada);
        if (boton) boton.click();
        pestanas.addEventListener('shown.bs.tab', function (evento) {
            try { localStorage.setItem(CLAVE_PESTANA, evento.target.getAttribute('data-tema')); } catch (error) { }
        });
        paneles.addEventListener('click', function (evento) {
            var estrellaBtn = evento.target.closest('[data-tablero]');
            if (estrellaBtn) cambiarFavorito(estrellaBtn);
        });
    }

    function cambiarFavorito(boton) {
        if (guardando) return;
        var id = boton.getAttribute('data-tablero');
        var tablero = SGTLTableros.POR_ID[id];
        if (!tablero) return;
        var marcada = boton.getAttribute('aria-pressed') === 'true';
        var lista = marcada
            ? favoritos.filter(function (item) { return item.Tablero !== id; })
            : favoritos.concat([{ Tablero: id }]);
        guardando = true;
        pedir('/tableros/favoritos', {
            method: 'PUT',
            headers: SGTL.encabezados({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                Favoritos: lista.map(function (item) {
                    return { Tablero: item.Tablero, X: item.X, Y: item.Y, Ancho: item.Ancho, Alto: item.Alto };
                })
            })
        }).then(function () {
            favoritos = lista;
            var icono = boton.querySelector('i');
            boton.setAttribute('aria-pressed', marcada ? 'false' : 'true');
            boton.setAttribute('aria-label', textoEstrella(tablero.titulo, !marcada));
            if (icono) icono.className = 'bi ' + (marcada ? 'bi-star' : 'bi-star-fill text-warning');
            SGTL.toastExito(marcada ? tablero.titulo + ' salió del inicio.' : tablero.titulo + ' se agregó al inicio.');
        }).catch(function (error) {
            SGTL.toastError(error.message);
        }).then(function () { guardando = false; });
    }

    function iniciar() {
        pedir('/tableros/favoritos').then(function (datos) {
            favoritos = (datos && datos.Favoritos) || [];
            var permitidos = (datos && datos.TemasPermitidos) || [];
            armar(SGTLTableros.TEMAS.filter(function (tema) { return permitidos.indexOf(tema.id) !== -1; }));
            SGTLDashboard.iniciar();
        }).catch(function (error) {
            document.getElementById('tablerosPaneles').innerHTML = '<p class="text-muted text-center py-4">' + SGTL.escapar(error.message) + '</p>';
        });
    }

    window.SGTLTablerosPagina = { iniciar: iniciar };
})();