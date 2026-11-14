(function () {
    "use strict";
    var API = SGTL.api + "/WhatsAppConfig/1";
    function porId(id) { return document.getElementById(id); }
    function aviso(tipo, mensaje) {
        var elemento = porId("whatsappAviso");
        elemento.classList.remove("alert-success", "alert-danger");
        elemento.textContent = mensaje || "";
        elemento.classList.toggle("d-none", !mensaje);
        if (mensaje) elemento.classList.add(tipo === "ok" ? "alert-success" : "alert-danger");
    }
    function pedir(metodo, cuerpo) {
        return fetch(API, {
            method: metodo,
            headers: SGTL.encabezados(cuerpo ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" }),
            body: cuerpo ? JSON.stringify(cuerpo) : undefined
        }).then(function (respuesta) {
            return respuesta.json().catch(function () { return null; }).then(function (datos) {
                if (respuesta.status === 401) throw new Error("Tu sesión no es válida. Volvé a iniciar sesión.");
                if (!respuesta.ok) throw new Error((datos && (datos.mensaje || datos.Message)) || "No se pudo completar la operación. Probá de nuevo.");
                return datos;
            });
        }).catch(function (error) {
            if (error && error.message) throw error;
            throw new Error("No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.");
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
        pedir("GET").then(mostrar).catch(function (error) {
            aviso("error", error.message);
        });
        porId("whatsappForm").addEventListener("submit", function (evento) {
            evento.preventDefault();
            aviso();
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
                aviso("error", error.message);
            }).then(listo);
        });
    });
})();
