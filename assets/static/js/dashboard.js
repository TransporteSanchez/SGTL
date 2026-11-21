(function () {
    'use strict';
    var CLASE_VACIO = 'dash-calor-vacio';
    var CLASE_CERO = 'dash-calor-cero';
    var CLASE_TOTAL = 'dash-calor-total';
    var CLASE_POCO = 'dash-calor-poco';
    var MAPAS = ['calor-recorridos', 'calor-rechazos', 'calor-camiones', 'calor-ingresos', 'calor-choferes', 'calor-facturacion'];
    var PERIODOS = { mes: 1, trimestre: 3, semestre: 6, anio: 12 };
    var MINIMO_ENTREGAS = 3;
    var MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    var MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    var formatoEntero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
    var formatoUnDecimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
    var periodo = null;
    var pedido = 0;
    function nodo(id) { return document.getElementById(id); }
    function aviso(id, texto) { var destino = nodo(id); if (destino) destino.innerHTML = '<p class="text-muted text-center py-4 mb-0">' + SGTL.escapar(texto) + '</p>'; }
    function titulo(id, texto) { var destino = nodo(id); if (destino) destino.textContent = texto; }
    function visible(id) {
        var destino = nodo(id);
        var tarjeta = destino && destino.closest('[data-tema]');
        return !!(destino && (!tarjeta || !tarjeta.classList.contains('d-none')));
    }
    function inicioDia(fecha) { return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()); }
    function sumarDias(fecha, dias) { return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias); }
    function diasEntre(desde, hasta) { return Math.round((inicioDia(hasta) - inicioDia(desde)) / 86400000); }
    function lunes(fecha) { return sumarDias(inicioDia(fecha), -((inicioDia(fecha).getDay() + 6) % 7)); }
    function diaMes(fecha) { return String(fecha.getDate()).padStart(2, '0') + '/' + String(fecha.getMonth() + 1).padStart(2, '0'); }
    function sumarMeses(fecha, meses) {
        var resultado = new Date(fecha.getFullYear(), fecha.getMonth() + meses, 1);
        resultado.setDate(Math.min(fecha.getDate(), new Date(resultado.getFullYear(), resultado.getMonth() + 1, 0).getDate()));
        return resultado;
    }
    function leerFechaApi(valor) {
        var partes = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(valor || ''));
        return partes ? new Date(+partes[1], partes[2] - 1, +partes[3], +(partes[4] || 0), +(partes[5] || 0)) : null;
    }
    function leerKm(valor) {
        var texto = String(valor == null ? '' : valor).trim();
        return /^\d+([.,]\d+)?$/.test(texto) ? parseFloat(texto.replace(',', '.')) : 0;
    }
    function compacto(valor) {
        var absoluto = Math.abs(valor);
        if (absoluto >= 1e6) return formatoUnDecimal.format(absoluto / 1e6) + ' M';
        if (absoluto >= 1000) return formatoUnDecimal.format(absoluto / 1000) + ' mil';
        return formatoEntero.format(absoluto);
    }
    function montoCompacto(valor) { return (valor < 0 ? '−' : '') + '$ ' + compacto(Math.abs(valor)); }
    function cantidadViajes(n) { return formatoEntero.format(n) + (n === 1 ? ' viaje' : ' viajes'); }
    function kmTexto(valor) { return formatoEntero.format(valor); }
    function kmTotal(valor) { return kmTexto(valor) + ' km'; }
    function ceros(largo) { var lista = []; while (lista.length < largo) lista.push(0); return lista; }
    function suma(lista) { return lista.reduce(function (total, valor) { return total + valor; }, 0); }
    function sumarListas(filas, campo, largo) {
        return ceros(largo).map(function (_, indice) {
            return filas.reduce(function (total, fila) { return total + fila[campo][indice]; }, 0);
        });
    }
    function texto(valor) { return String(valor || '').trim(); }
    function calcularPeriodo(tipo, desde, hasta) {
        var hoy = inicioDia(new Date());
        var meses = PERIODOS[tipo];
        var actual = { tipo: tipo, hasta: meses ? hoy : inicioDia(hasta) };
        actual.desde = meses ? (meses === 1 ? sumarDias(sumarMeses(hoy, -1), 1) : new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1)) : inicioDia(desde);
        actual.porSemana = diasEntre(actual.desde, actual.hasta) < 62;
        return actual;
    }
    function armarColumnas(actual) {
        var siguiente = actual.porSemana ? function (fecha) { return sumarDias(fecha, 7); } : function (fecha) { return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1); };
        var primero = actual.porSemana ? lunes(actual.desde) : new Date(actual.desde.getFullYear(), actual.desde.getMonth(), 1);
        var lista = [];
        for (var fecha = primero; fecha <= actual.hasta; fecha = siguiente(fecha)) lista.push({ clave: SGTL.fechaISO(fecha), inicio: fecha, fin: sumarDias(siguiente(fecha), -1) });
        var varios = lista.length && lista[0].inicio.getFullYear() !== lista[lista.length - 1].inicio.getFullYear();
        var hoy = inicioDia(new Date());
        lista.forEach(function (grupo, indice) {
            if (actual.porSemana) {
                grupo.corto = diaMes(grupo.inicio);
                grupo.largo = 'Semana del ' + diaMes(grupo.inicio) + ' al ' + diaMes(grupo.fin);
            } else {
                grupo.corto = MESES[grupo.inicio.getMonth()] + (varios && (indice === 0 || grupo.inicio.getMonth() === 0) ? ' ' + String(grupo.inicio.getFullYear()).slice(2) : '');
                grupo.largo = MESES_LARGOS[grupo.inicio.getMonth()] + ' ' + grupo.inicio.getFullYear();
            }
            if (grupo.inicio <= hoy && hoy <= grupo.fin) grupo.largo += ' (en curso)';
        });
        return lista;
    }
    function claveGrupo(fecha) {
        var dia = periodo.porSemana ? lunes(fecha) : new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        return SGTL.fechaISO(dia);
    }
    function mostrarPeriodo() {
        var campo = nodo('periodoRango');
        var leyenda = nodo('periodoTexto');
        if (campo && campo._flatpickr) campo._flatpickr.setDate([periodo.desde, periodo.hasta], false);
        if (leyenda) leyenda.textContent = 'Del ' + SGTL.fecha(periodo.desde) + ' al ' + SGTL.fecha(periodo.hasta);
    }
    function elegirPeriodo(tipo, desde, hasta) {
        periodo = calcularPeriodo(tipo, desde, hasta);
        mostrarPeriodo();
        cargar();
    }
    function prepararPeriodo() {
        document.querySelectorAll('input[name="periodo"]').forEach(function (radio) {
            radio.addEventListener('change', function () { if (radio.checked) elegirPeriodo(radio.value); });
        });
        SGTL.rangoFechas('#periodoRango', {
            onClose: function (fechas) {
                if (fechas.length !== 2) { if (periodo) mostrarPeriodo(); return; }
                if (periodo && diasEntre(periodo.desde, fechas[0]) === 0 && diasEntre(periodo.hasta, fechas[1]) === 0) return;
                document.querySelectorAll('input[name="periodo"]').forEach(function (radio) { radio.checked = false; });
                elegirPeriodo('rango', fechas[0], fechas[1]);
            }
        });
    }
    function pedir(ruta, parametros) {
        var consulta = new URLSearchParams();
        Object.keys(parametros || {}).forEach(function (clave) { if (parametros[clave] != null && parametros[clave] !== '') consulta.set(clave, parametros[clave]); });
        return fetch(SGTL.api + ruta + (consulta.toString() ? '?' + consulta : ''), { headers: SGTL.encabezados(), cache: 'no-store' }).then(function (respuesta) {
            return respuesta.json().catch(function () { return null; }).then(function (cuerpo) {
                if (respuesta.ok) return cuerpo;
                var error = new Error(SGTL.mensajeError({ status: respuesta.status, responseJSON: cuerpo || {} }, 'No se pudo cargar.'));
                if (respuesta.status === 403 && cuerpo && cuerpo.mensaje) error.message = cuerpo.mensaje;
                throw error;
            });
        }, function () { throw new Error('No se pudo cargar.'); });
    }
    function aplicarTemas(temas) {
        document.querySelectorAll('[data-tema]').forEach(function (tarjeta) {
            tarjeta.classList.toggle('d-none', temas.indexOf(tarjeta.getAttribute('data-tema')) === -1);
        });
    }
    function grupoDe(viaje) {
        var estado = viaje.Estado || 'Registrado';
        if (estado === 'Registrado' || estado === 'En_viaje') return 'pendiente';
        if (estado === 'Sin_carga' || (estado === 'Facturado' && viaje.Falso_Flete)) return 'sinCarga';
        if (viaje.Resultado_Entrega === 'Rechazo') return 'rechazo';
        if (viaje.Resultado_Entrega === 'Parcial') return 'parcial';
        return 'entregado';
    }
    function prepararViaje(viaje) {
        viaje._fecha = leerFechaApi(viaje.Fecha_Inicio);
        viaje._km = Math.round(leerKm(viaje.Distancia_KM));
        viaje._grupo = grupoDe(viaje);
        viaje._clave = viaje._fecha ? claveGrupo(viaje._fecha) : '';
        return viaje;
    }
    function ranking(viajes, nombreDe) {
        var cuenta = {};
        viajes.forEach(function (viaje) { var nombre = nombreDe(viaje); cuenta[nombre] = (cuenta[nombre] || 0) + 1; });
        var nombres = Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a] || a.localeCompare(b); });
        var posicion = {};
        if (nombres.length > 8) {
            var resto = nombres.splice(7);
            resto.forEach(function (nombre) { posicion[nombre] = 7; });
            nombres.push('Otros (' + resto.length + ')');
        }
        nombres.forEach(function (nombre, indice) { if (posicion[nombre] === undefined) posicion[nombre] = indice; });
        return { nombres: nombres, lugar: function (viaje) { return posicion[nombreDe(viaje)]; } };
    }
    function origenDe(viaje) { return texto(viaje.Origen) || 'Sin origen'; }
    function destinoDe(viaje) { return texto(viaje.Destino) || 'Sin destino'; }
    function clienteDe(viaje) { return texto(viaje.Cliente) || 'Sin cliente'; }
    function dominioDe(viaje) { return texto(viaje.Dominio) || (viaje.CamionID ? 'Camión ' + viaje.CamionID : 'Sin camión'); }
    function choferDe(viaje) { return texto(viaje.Chofer) || (viaje.ChoferID ? 'Chofer ' + viaje.ChoferID : 'Sin chofer'); }
    function claseValor(valor, maximo, conDato, atenuada) {
        if (!conDato) return CLASE_VACIO;
        var extra = atenuada ? ' ' + CLASE_POCO : '';
        if (!(valor > 0)) return CLASE_CERO + extra;
        var paso = maximo > 0 ? Math.min(7, Math.floor(valor / maximo * 8)) : 0;
        return 'dash-calor-' + (paso + 1) + extra;
    }
    function mapaCalor(destino, opciones) {
        var conDato = opciones.conDato || function (fila, indice) { return fila.valores[indice] !== 0; };
        var totalFila = opciones.totalFila || function (fila) { return suma(fila.valores); };
        var totales = opciones.columnas.map(function (_, indice) {
            return opciones.totalColumna ? opciones.totalColumna(indice) : suma(opciones.filas.map(function (fila) { return fila.valores[indice]; }));
        });
        var general = opciones.totalGeneral !== undefined ? opciones.totalGeneral : suma(totales);
        var maximo = 0;
        opciones.filas.forEach(function (fila) { fila.valores.forEach(function (valor, indice) { if (conDato(fila, indice) && valor > maximo) maximo = valor; }); });
        function celda(fila, valor, indice) {
            var clase = claseValor(valor, maximo, conDato(fila, indice), opciones.atenuar && opciones.atenuar(fila, indice));
            return '<td class="' + clase + '" title="' + SGTL.escapar(opciones.globo(fila, indice, valor)) + '">' + SGTL.escapar(conDato(fila, indice) ? opciones.formato(valor) : '—') + '</td>';
        }
        var escala = '<span class="dash-escala-paso ' + CLASE_VACIO + '"></span><span>' + SGTL.escapar(opciones.sinDato) + '</span><span class="ms-2">Menos</span>';
        for (var paso = 1; paso <= 8; paso++) escala += '<span class="dash-escala-paso dash-calor-' + paso + '"></span>';
        destino.innerHTML = '<div class="table-responsive"><table class="dash-calor"><thead><tr><th scope="col" class="dash-calor-esquina">' +
            (opciones.esquina ? SGTL.escapar(opciones.esquina) : '<span class="visually-hidden">' + SGTL.escapar(opciones.encabezado) + '</span>') + '</th>' +
            opciones.columnas.map(function (columna) { return '<th scope="col" title="' + SGTL.escapar(columna.largo) + '">' + SGTL.escapar(columna.corto) + '</th>'; }).join('') +
            '<th scope="col" class="' + CLASE_TOTAL + '">Total</th></tr></thead><tbody>' +
            opciones.filas.map(function (fila) {
                return '<tr><th scope="row">' + SGTL.escapar(fila.nombre) + '</th>' + fila.valores.map(function (valor, indice) { return celda(fila, valor, indice); }).join('') +
                    '<td class="' + CLASE_TOTAL + '">' + SGTL.escapar(opciones.total(totalFila(fila))) + '</td></tr>';
            }).join('') + '</tbody><tfoot><tr><th scope="row">Total</th>' +
            totales.map(function (valor) { return '<td class="' + CLASE_TOTAL + '">' + SGTL.escapar(opciones.formato(valor)) + '</td>'; }).join('') +
            '<td class="' + CLASE_TOTAL + '">' + SGTL.escapar(opciones.total(general)) + '</td></tr></tfoot></table></div>' +
            '<div class="d-flex flex-wrap align-items-center gap-1 small text-muted mt-2" aria-hidden="true">' + escala +
            '<span>Más (hasta ' + SGTL.escapar(opciones.formato(maximo) + (opciones.unidad || '')) + ')</span></div>' +
            (opciones.nota ? '<p class="small text-muted mb-0 mt-2">' + SGTL.escapar(opciones.nota) + '</p>' : '');
    }
    function calorRecorridos(viajes) {
        if (!visible('calor-recorridos')) return;
        if (!viajes.length) { aviso('calor-recorridos', 'No hay viajes en el período.'); return; }
        var origenes = ranking(viajes, origenDe);
        var destinos = ranking(viajes, destinoDe);
        var filas = origenes.nombres.map(function (nombre) { return { nombre: nombre, valores: ceros(destinos.nombres.length), km: ceros(destinos.nombres.length) }; });
        viajes.forEach(function (viaje) {
            var fila = filas[origenes.lugar(viaje)];
            var indice = destinos.lugar(viaje);
            fila.valores[indice]++;
            fila.km[indice] += viaje._km;
        });
        var columnas = destinos.nombres.map(function (nombre) { return { corto: nombre, largo: nombre }; });
        mapaCalor(nodo('calor-recorridos'), {
            encabezado: 'Origen', esquina: 'Origen ↓ · destino →', columnas: columnas, filas: filas, sinDato: 'Sin viajes', unidad: ' viajes',
            formato: kmTexto, total: cantidadViajes,
            globo: function (fila, indice, valor) {
                return fila.nombre + ' → ' + columnas[indice].largo + ': ' + (valor ? cantidadViajes(valor) + ' · ' + kmTexto(fila.km[indice]) + ' km' : 'sin viajes');
            }
        });
    }
    function calorRechazos(viajes) {
        if (!visible('calor-rechazos')) return;
        var entregados = viajes.filter(function (viaje) { return viaje._grupo !== 'pendiente'; });
        if (!entregados.length) { aviso('calor-rechazos', 'No hay entregas en el período.'); return; }
        if (!entregados.some(function (viaje) { return viaje._grupo === 'rechazo'; })) { aviso('calor-rechazos', 'No hubo entregas con rechazo en el período.'); return; }
        var clientes = ranking(entregados, clienteDe);
        var destinos = ranking(entregados, destinoDe);
        var filas = clientes.nombres.map(function (nombre) { return { nombre: nombre, entregas: ceros(destinos.nombres.length), rechazos: ceros(destinos.nombres.length) }; });
        entregados.forEach(function (viaje) {
            var fila = filas[clientes.lugar(viaje)];
            var indice = destinos.lugar(viaje);
            fila.entregas[indice]++;
            if (viaje._grupo === 'rechazo') fila.rechazos[indice]++;
        });
        function porcentaje(rechazos, entregas) { return entregas ? Math.round(rechazos / entregas * 100) : 0; }
        filas.forEach(function (fila) { fila.valores = fila.entregas.map(function (entregas, indice) { return porcentaje(fila.rechazos[indice], entregas); }); });
        var columnas = destinos.nombres.map(function (nombre) { return { corto: nombre, largo: nombre }; });
        function porcentajeTexto(valor) { return formatoEntero.format(valor) + ' %'; }
        mapaCalor(nodo('calor-rechazos'), {
            encabezado: 'Cliente', esquina: 'Cliente ↓ · destino →', columnas: columnas, filas: filas, sinDato: 'Sin entregas',
            formato: porcentajeTexto, total: porcentajeTexto,
            conDato: function (fila, indice) { return fila.entregas[indice] > 0; },
            atenuar: function (fila, indice) { return fila.entregas[indice] < MINIMO_ENTREGAS; },
            totalFila: function (fila) { return porcentaje(suma(fila.rechazos), suma(fila.entregas)); },
            totalColumna: function (indice) { return porcentaje(suma(filas.map(function (fila) { return fila.rechazos[indice]; })), suma(filas.map(function (fila) { return fila.entregas[indice]; }))); },
            totalGeneral: porcentaje(entregados.filter(function (viaje) { return viaje._grupo === 'rechazo'; }).length, entregados.length),
            globo: function (fila, indice, valor) {
                var entregas = fila.entregas[indice];
                return fila.nombre + ' → ' + columnas[indice].largo + ': ' + (entregas ? fila.rechazos[indice] + ' de ' + entregas + (entregas === 1 ? ' entrega' : ' entregas') + ' con rechazo (' + valor + ' %)' : 'sin entregas');
            },
            nota: 'Sobre los viajes entregados del período. Las celdas más claras tienen menos de ' + MINIMO_ENTREGAS + ' entregas: el porcentaje puede engañar.'
        });
    }
    function filasPor(viajes, columnas, leerValor, leerId, leerNombre, sinAsignar) {
        var indice = {};
        var grupos = {};
        var sinValor = 0;
        columnas.forEach(function (columna, i) { indice[columna.clave] = i; });
        viajes.forEach(function (viaje) {
            var i = indice[viaje._clave];
            if (i === undefined) return;
            var valor = leerValor(viaje);
            if (valor === null) { sinValor++; return; }
            var id = leerId(viaje) || 0;
            var fila = grupos[id] || (grupos[id] = { nombre: id ? leerNombre(viaje) : sinAsignar, valores: ceros(columnas.length), viajes: ceros(columnas.length), km: ceros(columnas.length), total: 0 });
            fila.valores[i] += valor;
            fila.viajes[i]++;
            fila.km[i] += viaje._km;
            fila.total += valor;
        });
        var filas = Object.keys(grupos).map(function (clave) { return grupos[clave]; }).filter(function (fila) { return fila.total > 0; })
            .sort(function (a, b) { return b.total - a.total || a.nombre.localeCompare(b.nombre); });
        if (filas.length > 8) {
            var resto = filas.splice(7);
            filas.push({ nombre: 'Otros (' + resto.length + ')', valores: sumarListas(resto, 'valores', columnas.length), viajes: sumarListas(resto, 'viajes', columnas.length), km: sumarListas(resto, 'km', columnas.length) });
        }
        return { filas: filas, sinValor: sinValor };
    }
    function dibujar(id, tituloId, tituloTexto, armado, opciones) {
        if (!visible(id)) return;
        titulo(tituloId, tituloTexto);
        if (!armado.filas.length) { aviso(id, opciones.vacio); return; }
        mapaCalor(nodo(id), opciones);
    }
    function opcionesKm(encabezado, columnas, filas) {
        return {
            encabezado: encabezado, columnas: columnas, filas: filas, sinDato: 'Sin km', unidad: ' km', formato: kmTexto, total: kmTotal,
            globo: function (fila, indice, valor) {
                return fila.nombre + ' · ' + columnas[indice].largo + ': ' + (valor > 0 ? kmTotal(valor) + ' en ' + cantidadViajes(fila.viajes[indice]) : 'sin km');
            }
        };
    }
    function mapasDeViajes(viajes, columnas) {
        var semana = periodo.porSemana ? 'semana' : 'mes';
        var camiones = filasPor(viajes, columnas, function (viaje) { return viaje._km; }, function (viaje) { return viaje.CamionID; }, dominioDe, 'Sin camión');
        var choferes = filasPor(viajes, columnas, function (viaje) { return viaje._km; }, function (viaje) { return viaje.ChoferID; }, choferDe, 'Sin chofer');
        var ingresos = filasPor(viajes, columnas, function (viaje) {
            var importe = viaje.Importe == null || viaje.Importe === '' ? NaN : Number(viaje.Importe);
            return isFinite(importe) ? importe : null;
        }, function (viaje) { return viaje.CamionID; }, dominioDe, 'Sin camión');
        calorRecorridos(viajes);
        calorRechazos(viajes);
        dibujar('calor-camiones', 'titulo-kmcamionmes', 'Km por camión y por ' + semana, camiones, Object.assign(opcionesKm('Camión', columnas, camiones.filas), { vacio: 'No hay km cargados en el período.' }));
        dibujar('calor-choferes', 'titulo-kmchofermes', 'Km por chofer y por ' + semana, choferes, Object.assign(opcionesKm('Chofer', columnas, choferes.filas), { vacio: 'No hay km cargados en el período.' }));
        dibujar('calor-ingresos', 'titulo-ingresoscamionmes', 'Ingresos por camión y por ' + semana, ingresos, {
            vacio: ingresos.sinValor ? 'Los viajes del período no tienen el importe calculado.' : 'No hay viajes en el período.',
            encabezado: 'Camión', columnas: columnas, filas: ingresos.filas, sinDato: 'Sin viajes', formato: montoCompacto,
            total: function (valor) { return SGTL.monto(valor); },
            globo: function (fila, indice, valor) {
                if (!fila.viajes[indice]) return fila.nombre + ' · ' + columnas[indice].largo + ': sin viajes con importe';
                return fila.nombre + ' · ' + columnas[indice].largo + ': ' + SGTL.monto(valor) + ' en ' + cantidadViajes(fila.viajes[indice]) + (fila.km[indice] > 0 ? ' · ' + SGTL.monto(valor / fila.km[indice]) + ' por km' : '');
            },
            nota: 'El importe que calculó cada viaje con su tarifa, facturado o no.'
        });
    }
    function calorFacturacion(filasApi, columnas) {
        if (!visible('calor-facturacion')) return;
        titulo('titulo-facturacionmes', 'Facturación por cliente y por ' + (periodo.porSemana ? 'semana' : 'mes'));
        var indice = {};
        columnas.forEach(function (columna, posicion) { indice[columna.clave] = posicion; });
        var porCliente = {};
        (filasApi || []).forEach(function (fila) {
            var fecha = leerFechaApi(fila.Fecha);
            var posicion = fecha ? indice[claveGrupo(fecha)] : undefined;
            if (posicion === undefined) return;
            var cliente = porCliente[fila.ClienteID] || (porCliente[fila.ClienteID] = { nombre: texto(fila.Cliente) || 'Sin nombre', valores: ceros(columnas.length), extra: ceros(columnas.length), total: 0 });
            cliente.valores[posicion] += Number(fila.Total) || 0;
            cliente.extra[posicion] += Number(fila.Comprobantes) || 0;
            cliente.total += Number(fila.Total) || 0;
        });
        var filas = Object.keys(porCliente).map(function (clave) { return porCliente[clave]; }).sort(function (a, b) { return b.total - a.total || a.nombre.localeCompare(b.nombre); });
        if (!filas.length) { aviso('calor-facturacion', 'No hay comprobantes emitidos en el período.'); return; }
        if (filas.length > 8) {
            var resto = filas.splice(7);
            filas.push({ nombre: 'Otros (' + resto.length + ')', valores: sumarListas(resto, 'valores', columnas.length), extra: sumarListas(resto, 'extra', columnas.length) });
        }
        mapaCalor(nodo('calor-facturacion'), {
            encabezado: 'Cliente', columnas: columnas, filas: filas, sinDato: 'Sin facturar', formato: montoCompacto,
            total: function (valor) { return SGTL.monto(valor); },
            globo: function (fila, posicion, valor) {
                var comprobantes = fila.extra[posicion];
                return fila.nombre + ' · ' + columnas[posicion].largo + ': ' + (comprobantes ? SGTL.monto(valor) + ' en ' + comprobantes + (comprobantes === 1 ? ' comprobante' : ' comprobantes') : 'sin facturar');
            }
        });
    }
    function cargar() {
        var numero = ++pedido;
        var columnas = armarColumnas(periodo);
        var fechas = { fechaDesde: SGTL.fechaISO(periodo.desde), fechaHasta: SGTL.fechaISO(periodo.hasta) };
        MAPAS.forEach(function (id) { if (visible(id)) aviso(id, 'Cargando…'); });
        if (MAPAS.slice(0, 5).some(visible)) {
            pedir('/tableros/viajes', fechas).then(function (datos) {
                if (numero !== pedido) return;
                mapasDeViajes((Array.isArray(datos) ? datos : []).map(prepararViaje).filter(function (viaje) { return viaje._fecha; }), columnas);
            }).catch(function (error) {
                if (numero === pedido) MAPAS.slice(0, 5).forEach(function (id) { if (visible(id)) aviso(id, error.message); });
            });
        }
        if (visible('calor-facturacion')) {
            pedir('/tableros/facturacion', fechas).then(function (datos) {
                if (numero === pedido) calorFacturacion(Array.isArray(datos) ? datos : [], columnas);
            }).catch(function (error) { if (numero === pedido) aviso('calor-facturacion', error.message); });
        }
    }
    function iniciar() {
        prepararPeriodo();
        pedir('/tableros/favoritos').then(function (datos) {
            aplicarTemas((datos && datos.TemasPermitidos) || []);
            var marcado = document.querySelector('input[name="periodo"]:checked');
            elegirPeriodo(marcado ? marcado.value : 'trimestre');
        }).catch(function (error) { MAPAS.forEach(function (id) { aviso(id, error.message); }); });
    }
    window.SGTLDashboard = { iniciar: iniciar };
})();