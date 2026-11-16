(function () {
    "use strict";
    var API = SGTL.api + "/WhatsAppConfig/1";
    function porId(id) { return document.getElementById(id); }
    function pedir(metodo, cuerpo) {
        return fetch(API, {
            method: metodo,
            headers: SGTL.encabezados(cuerpo ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" }),
            body: cuerpo ? JSON.stringify(cuerpo) : undefined
        }).catch(function () {
            throw new Error("No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.");
        }).then(function (respuesta) {
            return respuesta.json().catch(function () { return null; }).then(function (datos) {
                if (!respuesta.ok) throw new Error(SGTL.mensajeError({ status: respuesta.status, responseJSON: datos }, "No se pudo completar la operación. Probá de nuevo."));
                return datos;
            });
        });
    }
    function mostrar(datos) {
        porId("waEnabled").checked = !!datos.Enabled;
        porId("waPhoneNumberId").value = datos.PhoneNumberId || "";
        porId("waApiVersion").value = datos.ApiVersion || "";
        porId("waCountryCode").value = datos.DefaultCountryCode || "";
        porId("waTemplateName").value = datos.TemplateName || "";
        porId("waTemplateCancelado").value = datos.TemplateCancelado || "";
        porId("waTemplateDesasignado").value = datos.TemplateDesasignado || "";
        porId("waTemplateLanguage").value = datos.TemplateLanguage || "";
        porId("waAccessToken").value = "";
        porId("waTokenAyuda").textContent = datos.TieneToken
            ? "Hay un token guardado. Dejalo vacío para conservarlo."
            : "Todavía no hay un token guardado.";
        porId("waMeta").textContent = datos.Fecha_Modi
            ? "Última modificación: " + SGTL.fecha(datos.Fecha_Modi) + (datos.Usu_Modi ? ", " + datos.Usu_Modi : "")
            : "";
    }
    document.addEventListener("DOMContentLoaded", function () {
        var boton = porId("btnGuardarWhatsApp");
        window.loadHeader().catch(function (error) { console.warn("No se pudo cargar el encabezado.", error); });
        window.loadFooter();
        fetch(SGTL.api + "/GestionContenido/1").then(function (respuesta) {
            if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
            return respuesta.json();
        }).then(function (contenido) {
            window.applyStyles(contenido.Logo, contenido.ColorFondo, contenido.ColorBotonesMenu, contenido.ContenidoPiePagina);
        }).catch(function (error) { console.warn("No se pudo cargar la apariencia de SGTL.", error); });
        pedir("GET").then(mostrar).catch(function (error) {
            SGTL.toastError(error.message);
        });
        porId("whatsappForm").addEventListener("submit", function (evento) {
            evento.preventDefault();
            var listo = SGTL.procesando(boton);
            var cuerpo = {
                Enabled: porId("waEnabled").checked,
                AccessToken: porId("waAccessToken").value,
                PhoneNumberId: porId("waPhoneNumberId").value,
                ApiVersion: porId("waApiVersion").value,
                DefaultCountryCode: porId("waCountryCode").value,
                TemplateName: porId("waTemplateName").value,
                TemplateCancelado: porId("waTemplateCancelado").value,
                TemplateDesasignado: porId("waTemplateDesasignado").value,
                TemplateLanguage: porId("waTemplateLanguage").value
            };
            pedir("PUT", cuerpo).then(function (datos) {
                mostrar(datos);
                SGTL.toastExito("Configuración de WhatsApp guardada.");
            }).catch(function (error) {
                SGTL.toastError(error.message);
            }).then(listo);
        });
    });
})();
