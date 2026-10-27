(function () {
    'use strict';
    var API = 'http://localhost:50222/api/Proformas/';
    var modal, validador, actual, secuencia = 0, enviando = false;
    function campo(id) { return document.getElementById(id); }
    function aviso(texto) { SGTL.avisoFormulario('#envioProformaAviso', texto); }
    function solicitar(id, datos) {
        return SGTL.ajax({ url: API + encodeURIComponent(id) + '/email',
            type: datos ? 'POST' : 'GET', contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + (localStorage.getItem('token') || '') },
            data: datos ? JSON.stringify(datos) : undefined
        }, 'No se pudo completar el envío de la proforma. Probá de nuevo.');
    }
    function crear() {
        var div = document.createElement('div');
        div.id = 'modalEnviarProforma';
        div.className = 'modal fade';
        div.tabIndex = -1;
        div.setAttribute('data-bs-backdrop', 'static');
        div.setAttribute('aria-labelledby', 'envioProformaTitulo');
        div.setAttribute('aria-hidden', 'true');
        div.innerHTML = '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
            '<div class="modal-header"><h5 class="modal-title" id="envioProformaTitulo">Enviar por e-mail</h5>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
            '<div class="modal-body"><div id="envioProformaAviso" class="d-none" role="alert"></div>' +
            '<div class="sgtl-dato mb-3"><div class="sgtl-dato-etiqueta">Proforma</div><div id="envioProformaNumero" class="sgtl-dato-valor"></div></div>' +
            '<label class="form-label" for="envioProformaDestino">Destinatario <span class="text-danger">*</span></label>' +
            '<input id="envioProformaDestino" type="email" maxlength="320" class="form-control" autocomplete="email" placeholder="cliente@empresa.com">' +
            '<div class="invalid-feedback"></div><div class="form-text">Se adjuntará el PDF de la proforma. Podés modificar el e-mail sugerido del cliente.</div></div>' +
            '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cancelar</button>' +
            '<button type="button" id="envioProformaEnviar" class="btn btn-primary">Enviar</button></div></div></div>';
        document.body.appendChild(div);
        modal = div;
        validador = SGTL.validador([{ id: 'envioProformaDestino', requerido: 'Completá el destinatario.',
            validar: function (valor, elemento) { return elemento.checkValidity() ? '' : 'Indicá una dirección de destino válida.'; }
        }]);
        campo('envioProformaEnviar').addEventListener('click', enviar);
        div.addEventListener('hidden.bs.modal', function () { secuencia += 1; });
    }
    function abrir(id) {
        if (enviando) return;
        if (!modal) crear();
        actual = Number(id);
        var version = ++secuencia;
        SGTL.reiniciarFormulario(modal, '#envioProformaAviso');
        validador.reiniciar();
        campo('envioProformaDestino').value = '';
        campo('envioProformaNumero').textContent = 'Cargando…';
        campo('envioProformaEnviar').disabled = true;
        SGTL.modal(modal, 'show');
        solicitar(actual).then(function (datos) {
            if (version !== secuencia) return;
            campo('envioProformaNumero').textContent = datos.Numero;
            campo('envioProformaDestino').value = datos.DestinatarioSugerido || '';
            campo('envioProformaEnviar').disabled = !datos.Configurado;
            if (!datos.Configurado) aviso('Un administrador tiene que elegir el perfil de facturación en Configuración > Gestionar e-mail.');
        }).catch(function (error) {
            if (version === secuencia) aviso(error.mensajeUsuario || 'No se pudo preparar el envío de la proforma. Probá de nuevo.');
        });
    }
    function enviar() {
        if (enviando || campo('envioProformaEnviar').disabled) return;
        if (!validador.validarTodo()) { SGTL.revisarFormulario(modal, '#envioProformaAviso'); return; }
        var id = actual, destino = campo('envioProformaDestino').value.trim();
        enviando = true;
        var listo = SGTL.procesando('#envioProformaEnviar', 'Enviando…');
        SGTL.confirmar({ titulo: '¿Enviar la proforma por e-mail?', verbo: 'Enviar',
            mensaje: 'Se enviará a ' + destino + ' con la proforma adjunta.'
        }).then(function (aceptado) {
            if (!aceptado) return null;
            return window.generarProformaPDFParaEmail(id).then(function (adjunto) {
                return solicitar(id, { Destinatario: destino, PdfBase64: adjunto.PdfBase64 });
            });
        }).then(function (resultado) {
            listo(); enviando = false;
            if (!resultado) return;
            modal.addEventListener('hidden.bs.modal', function notificar() {
                modal.removeEventListener('hidden.bs.modal', notificar);
                SGTL.toastExito(resultado.mensaje || 'Proforma enviada.');
            });
            SGTL.modal(modal, 'hide');
        }).catch(function (error) {
            listo(); enviando = false;
            aviso(error.mensajeUsuario || 'No se pudo enviar la proforma. Probá de nuevo.');
        });
    }
    window.enviarProformaPorEmail = abrir;
})();
