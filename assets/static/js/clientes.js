// Funciones compartidas por Gestionar clientes y Listar clientes.
// Va después de sgtl-ui.js. Usa los filtros #filtroCuit, #filtroRazonSocial, #fechaRango y #filtroEstado.
var API_CLIENTES = 'http://localhost:50222/api';

var CONDICIONES_IVA = { 1: 'Responsable inscripto', 2: 'Monotributista', 3: 'Exento' };

var TIPOS_CLIENTE = { Directo: 'Directo', Con_plataforma: 'Con plataforma' };

// "20301112223" → "20-30111222-3" (también mientras se escribe).
function formatearCUIT(valor) {
    var d = String(valor || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 10) return d.slice(0, 2) + '-' + d.slice(2);
    return d.slice(0, 2) + '-' + d.slice(2, 10) + '-' + d.slice(10);
}

// Fecha_Alta y Fecha_Modi se guardan con la hora UTC del navegador: se muestran 3 h antes
// (§2 de docs/PENDIENTES-SISTEMA.md).
function fechaCliente(valor) {
    if (!valor) return '';
    var fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return '';
    return SGTL.fecha(new Date(fecha.getTime() - 3 * 60 * 60 * 1000), { hora: true });
}

function estadoCliente(activo) {
    return activo ? 'Activo' : 'Inactivo';
}

function clienteActivo(registro) {
    var valor = registro.EstadoCliente;
    return valor === true || valor === 1 || String(valor).toLowerCase() === 'true';
}

// El filtro de estado muestra Activo / Inactivo; la API los llama Habilitado / Deshabilitado.
function filtrosBusquedaClientes() {
    var rango = SGTL.valorRango('#fechaRango');
    var estado = $('#filtroEstado').val();
    return {
        cuit: ($('#filtroCuit').val() || '').replace(/\D/g, ''),
        razonSocial: ($('#filtroRazonSocial').val() || '').trim(),
        fechaDesde: rango ? rango.desde : null,
        fechaHasta: rango ? rango.hasta : null,
        estadoCliente: estado === 'Activo' ? 'Habilitado' : estado === 'Inactivo' ? 'Deshabilitado' : ''
    };
}

var nombresUbicacionClientes = {};

function nombreUbicacionCliente(url, extraer) {
    if (!nombresUbicacionClientes[url]) {
        nombresUbicacionClientes[url] = SGTL.ajax({ url: url, type: 'GET' }).then(extraer, function () { return ''; });
    }
    return nombresUbicacionClientes[url];
}

function nombreProvinciaCliente(provId) {
    if (!provId) return Promise.resolve('');
    return nombreUbicacionCliente(API_CLIENTES + '/Provincias/' + provId, function (data) { return data.Nombre_Provincia || ''; });
}

function nombreLocalidadCliente(provId, locId) {
    if (!provId || !locId) return Promise.resolve('');
    return nombreUbicacionCliente(API_CLIENTES + '/Provincias/' + provId + '/Localidades?locId=' + locId, function (data) {
        return Array.isArray(data) && data.length ? data[0].Nombre_Localidad : '';
    });
}

// Exporta todo lo que coincide con los filtros, no solo la página visible (§1.2).
async function exportarClientes() {
    var listo = SGTL.procesando('#btnExportar');
    try {
        var data = await SGTL.ajax({
            url: API_CLIENTES + '/Clientes/Buscar',
            type: 'GET',
            data: Object.assign(filtrosBusquedaClientes(), { page: 1, pageSize: 0 })
        }, 'No se pudo exportar. Revisá la conexión y probá de nuevo.');
        var registros = data.Results || [];
        if (!registros.length) {
            SGTL.toastError('No hay clientes para exportar con los filtros elegidos.');
            return;
        }

        var filas = await Promise.all(registros.map(async function (r) {
            var c = await SGTL.ajax({ url: API_CLIENTES + '/Clientes/' + r.Cliente_ID, type: 'GET' });
            var nombres = await Promise.all([nombreProvinciaCliente(c.ProvID), nombreLocalidadCliente(c.ProvID, c.LocID)]);
            return [
                c.Cliente_ID, c.Razon_Social, formatearCUIT(c.CUIT_Cliente), CONDICIONES_IVA[c.Cond_Fiscal] || '',
                TIPOS_CLIENTE[c.Tipo_Cliente] || '', c.Telefono, c.Email,
                nombres[0], nombres[1], c.Calle, c.AlturaCalle ? String(c.AlturaCalle).trim() : '', c.CodigoPostal,
                estadoCliente(clienteActivo(c)), fechaCliente(c.Fecha_Alta), c.Usu_Alta,
                fechaCliente(c.Fecha_Modi), c.Usu_Modi
            ];
        }));

        SGTL.descargarCSV('Listado_Clientes.csv', [
            'ID', 'Razón social', 'CUIT', 'Condición de IVA', 'Tipo de cliente', 'Teléfono', 'E-mail',
            'Provincia', 'Localidad', 'Calle', 'Altura', 'Código postal',
            'Estado', 'Fecha de alta', 'Usuario de alta', 'Fecha de modificación', 'Usuario de modificación'
        ], filas);
    } catch (error) {
        SGTL.toastError(error.mensajeUsuario || 'No se pudo exportar. Probá de nuevo.');
    } finally {
        listo();
    }
}

// Filtros comunes: CUIT con guiones mientras se escribe, rango de fechas y cruz en cada campo.
function prepararFiltrosClientes(buscar) {
    $('#filtroCuit').on('input', function () { this.value = formatearCUIT(this.value); });
    SGTL.rangoFechas('#fechaRango');
    SGTL.filtros(['#filtroRazonSocial', '#filtroCuit', '#fechaRango', '#filtroEstado'], function () { buscar(1); });
    $('#busquedaClienteForm').on('submit', function (evento) {
        evento.preventDefault();
        buscar(1);
    });
    $('#btnExportar').on('click', exportarClientes);
}
