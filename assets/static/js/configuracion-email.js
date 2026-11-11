(() => {
    "use strict";

    const API = SGTL.api + "/EmailServidor";
    const porId = id => document.getElementById(id);

    async function pedir(ruta = "", { method = "GET", body, aceptar404 = false } = {}) {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Iniciá sesión para gestionar e-mail.");

        const headers = { Accept: "application/json", Authorization: "Bearer " + token };
        if (body !== undefined) headers["Content-Type"] = "application/json";

        let respuesta;
        try {
            respuesta = await fetch(API + ruta, {
                method,
                headers,
                body: body === undefined ? undefined : JSON.stringify(body)
            });
        } catch {
            throw new Error("No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.");
        }

        if (respuesta.status === 401) throw new Error("Tu sesión no es válida. Volvé a iniciar sesión.");
        if (respuesta.status === 204 || (aceptar404 && respuesta.status === 404)) return null;

        const datos = await respuesta.json().catch(() => null);
        if (!respuesta.ok) {
            const errores = Object.values(datos?.ModelState || {}).flat().filter(Boolean);
            throw new Error(errores.join(" ") || datos?.error || datos?.Message ||
                "No se pudo completar la operación. Probá de nuevo.");
        }
        return datos;
    }

    function aviso(elemento, tipo, mensaje) {
        elemento.classList.remove("alert-success", "alert-danger", "alert-warning", "alert-info");
        elemento.textContent = mensaje || "";
        elemento.classList.toggle("d-none", !mensaje);
        if (mensaje) elemento.classList.add("alert-" + tipo);
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const tabla = porId("emailConfigTableBody");
        const formPerfil = porId("emailConfigForm");
        const formPrueba = porId("emailTestForm");
        const clave = porId("emailClave");
        const nuevo = porId("btnNuevaConfiguracion");
        nuevo.disabled = true;

        if (!window.bootstrap?.Modal) {
            tabla.replaceChildren();
            SGTL.toastError("No se pudo cargar la pantalla. Recargala y probá de nuevo.");
            return;
        }

        const modalPerfil = prepararModal("emailConfigModal", "btnGuardarConfiguracion", "emailFormFeedback");
        const modalPrueba = prepararModal("emailTestModal", "btnEnviarPrueba", "emailTestFeedback");

        const asignaciones = Array.from(document.querySelectorAll("form[data-modulo]"), form => ({
            form,
            ruta: "/asignaciones/" + encodeURIComponent(form.dataset.modulo),
            selector: form.elements.namedItem("Service"),
            boton: form.querySelector('button[type="submit"]'),
            feedback: form.querySelector("[data-feedback]"),
            cargada: false,
            guardando: false
        }));

        let perfiles = [];
        let idEdicion = null;
        let idPrueba = null;
        let cargandoEdicion = false;

        function prepararModal(idModal, idBoton, idFeedback) {
            const elemento = porId(idModal);
            const boton = porId(idBoton);
            return {
                instancia: window.bootstrap.Modal.getOrCreateInstance(elemento),
                boton,
                feedback: idFeedback ? porId(idFeedback) : null
            };
        }

        async function operarEnModal(modal, operacion) {
            if (modal.boton.disabled) return;
            const listo = SGTL.procesando(modal.boton);
            aviso(modal.feedback);
            let completada = false;
            try {
                await operacion();
                completada = true;
            } catch (error) {
                aviso(modal.feedback, "danger", error.message);
            } finally {
                listo();
                if (completada) modal.instancia.hide();
            }
        }

        function renderizarPerfiles() {
            const filas = perfiles.map(perfil => {
                const fila = document.createElement("tr");
                const servidor = perfil.SmtpHost
                    ? perfil.SmtpHost + (perfil.SmtpPort ? ":" + perfil.SmtpPort : "")
                    : "—";
                const modos = { StartTls: "STARTTLS", SslOnConnect: "TLS desde la conexión" };

                for (const valor of [
                    perfil.Service, perfil.Name, perfil.CredentialFromMailAddres, servidor,
                    modos[perfil.ModoSeguridad] || "Revisar configuración",
                    perfil.TienePassword ? "Guardada" : "Sin guardar"
                ]) {
                    fila.insertCell().textContent = valor ?? "—";
                }

                const acciones = fila.insertCell();
                acciones.className = "text-end";
                acciones.innerHTML = SGTL.accionesFila([
                    SGTL.botonFila("editar", { id: perfil.Es_id }),
                    SGTL.botonFila("enviar", { id: perfil.Es_id, texto: "Enviar prueba", icono: "bi-send" }),
                    SGTL.botonFila("eliminar", { id: perfil.Es_id })
                ]);
                return fila;
            });

            tabla.replaceChildren(...filas);
            porId("emailConfigTable").classList.toggle("d-none", perfiles.length === 0);
            porId("emailEmptyState").classList.toggle("d-none", perfiles.length > 0);
        }

        function ajustarAsignacion(asignacion) {
            const { selector, boton, cargada, guardando } = asignacion;
            selector.disabled = !cargada || guardando || perfiles.length === 0;
            boton.disabled = selector.disabled || !selector.value;
        }

        async function cargarPerfiles() {
            const datos = await pedir();
            if (!Array.isArray(datos)) throw new Error("No se pudieron cargar los perfiles SMTP.");

            perfiles = datos;
            renderizarPerfiles();

            for (const asignacion of asignaciones) {
                const { selector } = asignacion;
                const valor = selector.value;
                selector.replaceChildren(new Option("Seleccioná un perfil", ""));
                for (const perfil of perfiles) {
                    selector.add(new Option(perfil.Service + " · " + (perfil.Name || "Sin nombre"), String(perfil.Service)));
                }
                selector.value = perfiles.some(perfil => String(perfil.Service) === valor) ? valor : "";
                ajustarAsignacion(asignacion);
            }
        }

        async function cargarAsignacion(asignacion) {
            try {
                const datos = await pedir(asignacion.ruta, { aceptar404: true });
                asignacion.selector.value = datos ? String(datos.Service) : "";
                asignacion.cargada = true;
                if (!datos) aviso(asignacion.feedback, "info", "Todavía no hay un perfil asignado.");
            } catch (error) {
                aviso(asignacion.feedback, "danger", error.message);
            } finally {
                ajustarAsignacion(asignacion);
            }
        }

        for (const asignacion of asignaciones) {
            asignacion.selector.addEventListener("change", () => ajustarAsignacion(asignacion));
            asignacion.form.addEventListener("submit", async evento => {
                evento.preventDefault();
                if (asignacion.boton.disabled) return;

                const service = Number(asignacion.selector.value);
                const listo = SGTL.procesando(asignacion.boton);
                asignacion.guardando = true;
                ajustarAsignacion(asignacion);
                aviso(asignacion.feedback);

                try {
                    const datos = await pedir(asignacion.ruta, { method: "PUT", body: { Service: service } });
                    asignacion.selector.value = String(datos?.Service ?? service);
                    SGTL.toastExito("Se guardó la asignación.");
                } catch (error) {
                    SGTL.toastError(error.message);
                } finally {
                    listo();
                    asignacion.guardando = false;
                    ajustarAsignacion(asignacion);
                }
            });
        }

        function abrirPerfil(perfil = null) {
            formPerfil.reset();
            idEdicion = perfil?.Es_id ?? null;
            porId("emailConfigModalTitle").textContent = perfil ? "Editar perfil SMTP" : "Registrar perfil SMTP";
            clave.value = "";
            clave.required = !perfil;
            porId("emailPasswordInfo").textContent = perfil
                ? perfil.TienePassword
                    ? "Contraseña guardada. Dejá este campo vacío para conservarla."
                    : "El perfil todavía no tiene una contraseña guardada."
                : "Ingresá la contraseña para registrar el perfil.";

            if (perfil) {
                for (const campo of ["Name", "SmtpHost", "SmtpPort", "ModoSeguridad",
                    "CredentialFromMailAddres", "Asunto", "CuerpoHtml"]) {
                    formPerfil.elements.namedItem(campo).value = perfil[campo] ?? "";
                }
            }

            aviso(modalPerfil.feedback);
            modalPerfil.instancia.show();
        }

        async function refrescarTrasCambio(mensaje) {
            SGTL.toastExito(mensaje);
            try {
                await cargarPerfiles();
            } catch {
                SGTL.toastError("No se pudo actualizar la lista. Recargá la página.");
            }
        }

        nuevo.addEventListener("click", () => abrirPerfil());
        porId("emailConfigModal").addEventListener("hidden.bs.modal", () => { clave.value = ""; });

        tabla.addEventListener("click", async evento => {
            const boton = evento.target.closest("button[data-accion]");
            if (!boton || cargandoEdicion) return;

            const id = Number(boton.dataset.id);
            const ruta = "/" + id;
            if (boton.dataset.accion === "editar") {
                cargandoEdicion = true;
                const listo = SGTL.procesando(boton);
                nuevo.disabled = true;
                try {
                    const perfil = await pedir(ruta);
                    if (!perfil) throw new Error("No se pudo leer el perfil SMTP.");
                    abrirPerfil(perfil);
                } catch (error) {
                    SGTL.toastError(error.message);
                } finally {
                    nuevo.disabled = false;
                    listo();
                    cargandoEdicion = false;
                }
            } else if (boton.dataset.accion === "enviar") {
                idPrueba = id;
                formPrueba.reset();
                aviso(modalPrueba.feedback);
                modalPrueba.instancia.show();
            } else if (boton.dataset.accion === "eliminar") {
                const perfil = perfiles.find(item => item.Es_id === id);
                const eliminado = await SGTL.confirmar({
                    titulo: perfil?.Name ? "¿Eliminar el perfil SMTP «" + perfil.Name + "»?" : "¿Eliminar este perfil SMTP?",
                    mensaje: "No se puede deshacer.",
                    verbo: "Eliminar",
                    peligro: true,
                    accion: () => pedir(ruta, { method: "DELETE" }).catch(error => {
                        error.mensajeUsuario = error.message;
                        throw error;
                    })
                });
                if (eliminado) await refrescarTrasCambio("Se eliminó el perfil SMTP.");
            }
        });

        formPerfil.addEventListener("submit", evento => {
            evento.preventDefault();
            operarEnModal(modalPerfil, async () => {
                const body = Object.fromEntries(new FormData(formPerfil));
                for (const campo of ["Name", "SmtpHost", "CredentialFromMailAddres", "Asunto"]) {
                    body[campo] = body[campo].trim();
                }
                body.SmtpPort = Number(body.SmtpPort);
                const editando = idEdicion !== null;
                if (editando && !body.CredentialFromMailPass.trim()) delete body.CredentialFromMailPass;

                await pedir(editando ? "/" + idEdicion : "", { method: editando ? "PUT" : "POST", body });
                clave.value = "";
                await refrescarTrasCambio(editando ? "Se actualizó el perfil SMTP." : "Se registró el perfil SMTP.");
            });
        });

        formPrueba.addEventListener("submit", evento => {
            evento.preventDefault();
            if (idPrueba === null) return;

            operarEnModal(modalPrueba, async () => {
                const destino = porId("emailPrueba").value.trim();
                const datos = await pedir("/" + idPrueba + "/probar", {
                    method: "POST",
                    body: { EmailDestino: destino }
                });
                SGTL.toastExito(datos?.mensaje || "Se envió el correo de prueba.");
            });
        });

        if (typeof window.loadHeader === "function") {
            window.loadHeader().catch(error => console.warn("No se pudo cargar el encabezado.", error));
        }
        if (typeof window.loadFooter === "function") window.loadFooter();
        fetch(SGTL.api + "/GestionContenido/1")
            .then(respuesta => {
                if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
                return respuesta.json();
            })
            .then(contenido => {
                window.applyStyles(
                    contenido.Logo,
                    contenido.ColorFondo,
                    contenido.ColorBotonesMenu,
                    contenido.ContenidoPiePagina
                );
            })
            .catch(error => console.warn("No se pudo cargar la apariencia de SGTL.", error));

        try {
            await cargarPerfiles();
            await Promise.all(asignaciones.map(cargarAsignacion));
            nuevo.disabled = false;
        } catch (error) {
            tabla.replaceChildren();
            SGTL.toastError(error.message);
        }
    });
})();