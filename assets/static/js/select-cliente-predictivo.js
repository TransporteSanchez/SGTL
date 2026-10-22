/* Selector de clientes con búsqueda predictiva.
 * Conserva el <select> original como fuente de valor para no modificar los
 * formularios, filtros ni llamadas existentes.
 * Sirve para cualquier lista (también choferes): opciones placeholder, textoVacio ("No hay choferes que
 * coincidan.") e idCampo (id del campo visible, para validarlo con SGTL.validador). Una <option> con
 * data-etiqueta="Rukas" muestra esa etiqueta en la lista. Flechas para moverse, Enter para elegir, Escape cierra.
 */
(function (window, document) {
    'use strict';

    var instancias = new WeakMap();
    var contador = 0;

    function normalizar(texto) {
        return String(texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase();
    }

    function resolverSelect(selectOId) {
        if (typeof selectOId === 'string') return document.getElementById(selectOId);
        return selectOId;
    }

    function agregarEstilos() {
        if (document.getElementById('estilos-select-cliente-predictivo')) return;
        var estilos = document.createElement('style');
        estilos.id = 'estilos-select-cliente-predictivo';
        estilos.textContent =
            '.cliente-select-predictivo{position:relative}' +
            '.cliente-select-predictivo-menu{position:absolute;z-index:1080;top:calc(100% + 2px);left:0;right:0;max-height:240px;overflow-y:auto;background:#fff;border:1px solid #ced4da;border-radius:.375rem;box-shadow:0 .5rem 1rem rgba(0,0,0,.15)}' +
            '.cliente-select-predictivo-menu button{display:block;width:100%;padding:.5rem .75rem;border:0;background:#fff;color:inherit;text-align:left}' +
            '.cliente-select-predictivo-menu button:hover,.cliente-select-predictivo-menu button:focus,.cliente-select-predictivo-menu button.activa{background:#f1f3f5;outline:0}' +
            '.cliente-select-predictivo-menu button.con-etiqueta{display:flex;align-items:center;justify-content:space-between;gap:.5rem}' +
            '.cliente-select-predictivo-menu .cliente-select-predictivo-vacio{padding:.5rem .75rem;color:#6c757d;font-size:.875rem}';
        document.head.appendChild(estilos);
    }

    function inicializar(selectOId, opciones) {
        var select = resolverSelect(selectOId);
        if (!select || select.tagName !== 'SELECT') return null;

        var existente = instancias.get(select);
        if (existente) {
            existente.actualizar(opciones);
            return existente;
        }

        agregarEstilos();
        opciones = opciones || {};
        contador += 1;

        var contenedor = document.createElement('div');
        contenedor.className = 'cliente-select-predictivo';
        var campo = document.createElement('input');
        campo.type = 'text';
        campo.id = opciones.idCampo || (select.id + '_busqueda_' + contador);
        campo.className = select.className || 'form-select';
        campo.autocomplete = 'off';
        campo.setAttribute('role', 'combobox');
        campo.setAttribute('aria-autocomplete', 'list');
        campo.setAttribute('aria-expanded', 'false');
        var lista = document.createElement('div');
        lista.className = 'cliente-select-predictivo-menu d-none';
        lista.setAttribute('role', 'listbox');
        lista.id = select.id + '_opciones_' + contador;
        campo.setAttribute('aria-controls', lista.id);
        contenedor.appendChild(campo);
        contenedor.appendChild(lista);

        select.insertAdjacentElement('afterend', contenedor);
        select.classList.add('d-none');
        select.tabIndex = -1;
        select.setAttribute('aria-hidden', 'true');

        var etiqueta = document.querySelector('label[for="' + select.id + '"]');
        if (etiqueta) etiqueta.htmlFor = campo.id;

        function obtenerOpciones() {
            return Array.prototype.slice.call(select.options).map(function (opcion) {
                return {
                    valor: opcion.value,
                    texto: opcion.textContent || '',
                    etiqueta: opcion.getAttribute('data-etiqueta') || '',
                    deshabilitada: opcion.disabled,
                    seleccionada: opcion.selected
                };
            });
        }

        var activa = -1;

        function botones() { return lista.querySelectorAll('button[role="option"]'); }

        // Resalta la opción a la que se llega con las flechas y la deja a la vista.
        function resaltar(indice) {
            var todos = botones();
            if (!todos.length) { activa = -1; return; }
            activa = Math.max(0, Math.min(indice, todos.length - 1));
            Array.prototype.forEach.call(todos, function (boton, i) { boton.classList.toggle('activa', i === activa); });
            todos[activa].scrollIntoView({ block: 'nearest' });
            campo.setAttribute('aria-activedescendant', todos[activa].id);
        }

        function mostrarLista(mostrar) {
            lista.classList.toggle('d-none', !mostrar);
            campo.setAttribute('aria-expanded', mostrar ? 'true' : 'false');
        }

        function sincronizar() {
            var seleccionada = select.options[select.selectedIndex];
            campo.value = seleccionada && seleccionada.value ? seleccionada.textContent : '';
            campo.placeholder = opciones.placeholder || 'Buscar cliente';
            campo.disabled = select.disabled;
        }

        function seleccionar(valor) {
            var previo = select.value;
            select.value = valor;
            sincronizar();
            mostrarLista(false);
            if (previo !== select.value) {
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        function renderizar(texto) {
            var consulta = normalizar(texto);
            var coincidencias = obtenerOpciones().filter(function (opcion) {
                return !opcion.deshabilitada && normalizar(opcion.texto).indexOf(consulta) !== -1;
            });
            lista.innerHTML = '';
            activa = -1;
            campo.removeAttribute('aria-activedescendant');

            if (!coincidencias.length) {
                var vacio = document.createElement('div');
                vacio.className = 'cliente-select-predictivo-vacio';
                vacio.textContent = opciones.textoVacio || 'No hay clientes que coincidan.';
                lista.appendChild(vacio);
            } else {
                coincidencias.forEach(function (opcion, i) {
                    var boton = document.createElement('button');
                    boton.type = 'button';
                    boton.id = lista.id + '_' + i;
                    boton.tabIndex = -1;
                    boton.setAttribute('role', 'option');
                    boton.setAttribute('aria-selected', opcion.seleccionada ? 'true' : 'false');
                    if (opcion.etiqueta) {
                        boton.classList.add('con-etiqueta');
                        var texto = document.createElement('span');
                        texto.textContent = opcion.texto;
                        var etiqueta = document.createElement('span');
                        etiqueta.className = 'badge rounded-pill bg-white text-dark border';
                        etiqueta.textContent = opcion.etiqueta;
                        boton.appendChild(texto);
                        boton.appendChild(etiqueta);
                    } else {
                        boton.textContent = opcion.texto;
                    }
                    boton.addEventListener('mousedown', function (evento) {
                        evento.preventDefault();
                        seleccionar(opcion.valor);
                    });
                    lista.appendChild(boton);
                });
            }
            mostrarLista(true);
        }

        campo.addEventListener('focus', function () {
            campo.select();
            renderizar('');
        });
        campo.addEventListener('input', function () {
            if (select.value) {
                select.value = '';
            }
            renderizar(campo.value);
        });
        campo.addEventListener('keydown', function (evento) {
            var abierta = !lista.classList.contains('d-none');
            if (evento.key === 'Escape') mostrarLista(false);
            if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
                evento.preventDefault();
                if (!abierta) renderizar(campo.value);
                resaltar(activa < 0 ? 0 : activa + (evento.key === 'ArrowDown' ? 1 : -1));
            }
            // Enter con una opción resaltada la elige; si no, sigue de largo (en los filtros, busca).
            if (evento.key === 'Enter' && abierta && activa >= 0) {
                evento.preventDefault();
                var elegida = botones()[activa];
                if (elegida) elegida.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            }
        });
        document.addEventListener('mousedown', function (evento) {
            if (!contenedor.contains(evento.target)) mostrarLista(false);
        });

        var instancia = {
            actualizar: function (nuevasOpciones) {
                opciones = nuevasOpciones || opciones || {};
                sincronizar();
            },
            sincronizar: sincronizar,
            establecerDeshabilitado: function (deshabilitado) {
                select.disabled = Boolean(deshabilitado);
                campo.disabled = Boolean(deshabilitado);
                if (deshabilitado) mostrarLista(false);
            }
        };
        instancias.set(select, instancia);
        sincronizar();
        return instancia;
    }

    function sincronizar(selectOId) {
        var select = resolverSelect(selectOId);
        var instancia = select && instancias.get(select);
        if (instancia) instancia.sincronizar();
    }

    function establecerDeshabilitado(selectOId, deshabilitado) {
        var select = resolverSelect(selectOId);
        var instancia = select && instancias.get(select);
        if (instancia) instancia.establecerDeshabilitado(deshabilitado);
    }

    window.SelectClientePredictivo = {
        inicializar: inicializar,
        sincronizar: sincronizar,
        establecerDeshabilitado: establecerDeshabilitado
    };
})(window, document);
