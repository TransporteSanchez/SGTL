(() => {
    'use strict';

    const instancias = new WeakMap();
    const badge = 'badge rounded-pill bg-white text-dark border';
    let contador = 0;

    const resolver = objetivo => typeof objetivo === 'string'
        ? document.getElementById(objetivo) : objetivo;
    const normalizar = texto => String(texto || '').normalize('NFD')
        .replace(/[\u0300-\u036f-]/g, '').toLowerCase().trim();
    const crear = (tag, clase, datos = {}) =>
        Object.assign(document.createElement(tag), { className: clase }, datos);
    const atributos = (el, datos) =>
        Object.entries(datos).forEach(([nombre, valor]) => el.setAttribute(nombre, valor));
    const cambio = el => el.dispatchEvent(new Event('change', { bubbles: true }));

    function inicializar(objetivo, configuracion) {
        const select = resolver(objetivo);
        if (!select || select.tagName !== 'SELECT') return null;
        const existente = instancias.get(select);
        if (existente) {
            existente.actualizar(configuracion);
            return existente;
        }

        const opciones = Object.assign({}, configuracion);
        const caja = crear('div', 'cliente-select-predictivo');
        const campo = crear('input', 'form-control', {
            type: 'text', autocomplete: 'off',
            id: opciones.idCampo || 'sgtlClienteBuscar' + (++contador)
        });
        const marca = crear('span', badge + ' cliente-select-predictivo-etiqueta d-none');
        const lista = crear('div', 'cliente-select-predictivo-menu d-none', {
            id: campo.id + 'Opciones'
        });
        atributos(campo, {
            role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false',
            'aria-controls': lista.id,
            'aria-label': select.getAttribute('aria-label') || opciones.placeholder || 'Buscar cliente'
        });
        atributos(lista, { role: 'listbox' });
        Array.from(select.labels || []).forEach(label => { label.htmlFor = campo.id; });
        caja.append(campo, marca, lista);
        select.after(caja);
        select.classList.add('d-none');
        select.tabIndex = -1;
        atributos(select, { 'aria-hidden': 'true' });

        let botones = [], activa = -1;

        function cerrar() {
            lista.classList.add('d-none');
            campo.setAttribute('aria-expanded', 'false');
            campo.removeAttribute('aria-activedescendant');
            activa = -1;
        }
        function etiquetar(texto) {
            marca.textContent = texto || '';
            marca.classList.toggle('d-none', !texto);
            campo.classList.toggle('con-etiqueta', !!texto);
        }
        function refrescar() {
            const opcion = select.options[select.selectedIndex];
            campo.value = opcion?.value ? opcion.textContent.trim() : '';
            campo.placeholder = opciones.placeholder || 'Buscá un cliente';
            campo.disabled = select.disabled;
            etiquetar(opcion?.value ? opcion.getAttribute('data-etiqueta') : '');
            cerrar();
        }
        function elegir(valor) {
            const anterior = select.value;
            select.value = valor;
            refrescar();
            if (select.value !== anterior) cambio(select);
            cambio(campo);
            campo.focus();
            campo.select();
            cerrar();
        }
        function resaltar(indice) {
            if (!botones.length) return;
            activa = Math.max(0, Math.min(indice, botones.length - 1));
            botones.forEach((boton, i) => boton.classList.toggle('activa', i === activa));
            campo.setAttribute('aria-activedescendant', botones[activa].id);
            botones[activa].scrollIntoView({ block: 'nearest' });
        }
        function dibujar(texto) {
            if (select.disabled) return cerrar();
            const consulta = normalizar(texto);
            const coincidencias = Array.from(select.options).filter(opcion =>
                opcion.value !== '' && !opcion.disabled &&
                !(opcion.parentElement?.tagName === 'OPTGROUP' && opcion.parentElement.disabled) &&
                normalizar(opcion.textContent).includes(consulta)
            );
            lista.replaceChildren();
            activa = -1;
            campo.removeAttribute('aria-activedescendant');
            botones = coincidencias.map((opcion, i) => {
                const etiqueta = opcion.getAttribute('data-etiqueta');
                const boton = crear('button', etiqueta ? 'con-etiqueta' : '', {
                    type: 'button', tabIndex: -1, id: lista.id + '_' + i
                });
                atributos(boton, { role: 'option', 'aria-selected': String(opcion.selected) });
                boton.append(crear('span', '', { textContent: opcion.textContent }));
                if (etiqueta) boton.append(crear('span', badge, { textContent: etiqueta }));
                boton.addEventListener('click', () => elegir(opcion.value));
                lista.append(boton);
                return boton;
            });
            if (!botones.length) {
                lista.append(crear('div', 'cliente-select-predictivo-vacio', {
                    textContent: opciones.textoVacio || 'No hay clientes que coincidan.'
                }));
            }
            lista.classList.remove('d-none');
            campo.setAttribute('aria-expanded', 'true');
        }

        campo.addEventListener('focus', () => {
            campo.select();
            dibujar(select.value ? '' : campo.value);
        });
        campo.addEventListener('mousedown', evento => {
            if (document.activeElement === campo && !select.value) return;
            evento.preventDefault();
            campo.focus();
            campo.select();
            dibujar(select.value ? '' : campo.value);
        });
        campo.addEventListener('input', () => {
            const texto = campo.value, anterior = select.value;
            select.value = '';
            etiquetar('');
            if (anterior) cambio(select);
            campo.value = texto;
            dibujar(texto);
        });
        campo.addEventListener('keydown', evento => {
            const abierta = !lista.classList.contains('d-none');
            if (evento.key === 'Escape' && abierta) {
                evento.preventDefault();
                evento.stopPropagation();
                cerrar();
            } else if (evento.key === 'Tab') cerrar();
            else if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
                evento.preventDefault();
                if (!abierta) dibujar(select.value ? '' : campo.value);
                const paso = evento.key === 'ArrowDown' ? 1 : -1;
                resaltar(activa < 0 ? (paso === 1 ? 0 : botones.length - 1) : activa + paso);
            } else if (evento.key === 'Enter' && abierta) {
                const indice = activa >= 0 ? activa :
                    (campo.value.trim() && botones.length === 1 ? 0 : -1);
                if (indice < 0) {
                    cerrar();
                    return;
                }
                evento.preventDefault();
                evento.stopPropagation();
                botones[indice].click();
            }
        });
        lista.addEventListener('mousedown', evento => evento.preventDefault());
        caja.addEventListener('focusout', evento => {
            if (!caja.contains(evento.relatedTarget)) cerrar();
        });
        document.addEventListener('mousedown', evento => {
            if (!caja.contains(evento.target)) cerrar();
        });
        select.addEventListener('change', refrescar);

        const instancia = {
            actualizar(nuevas) { Object.assign(opciones, nuevas); refrescar(); },
            sincronizar: refrescar,
            establecerDeshabilitado(valor) { select.disabled = Boolean(valor); refrescar(); }
        };
        instancias.set(select, instancia);
        refrescar();
        return instancia;
    }

    function sincronizar(objetivo) {
        const select = resolver(objetivo);
        if (select) instancias.get(select)?.sincronizar();
    }
    function establecerDeshabilitado(objetivo, valor) {
        const select = resolver(objetivo);
        if (!select) return;
        select.disabled = Boolean(valor);
        sincronizar(select);
    }

    window.SelectClientePredictivo = { inicializar, sincronizar, establecerDeshabilitado };
})();