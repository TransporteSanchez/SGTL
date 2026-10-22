// Registrar y editar un cliente (§6.2, §6.3): el mismo modal en Gestionar clientes y en la proforma ("Editar
// cliente", §25 de docs/PENDIENTES-SISTEMA.md, 22/10). Los datos del cliente se corrigen acá, no en la proforma: al
// guardar, la API actualiza sus proformas en borrador y el aviso lo dice.
// Uso: SGTLEditarCliente.abrir(id | null, { tipoBloqueado: 'motivo', alCerrar: function (resultado) { } })
//   tipoBloqueado: el tipo de cliente se ve como texto con ese motivo (desde una proforma no se cambia).
//   resultado: null si se canceló; si se guardó, { esAlta, id, borradores, borradorID }.
// Va después de jQuery, app.js, sgtl-ui.js y clientes.js (formatearCUIT, CONDICIONES_IVA, estadoCliente…).
(function (window, document) {
  'use strict';

  var API = 'http://localhost:50222/api';
  var enEdicion = null;
  var original = null;
  var provincias = null;
  var formulario = null;
  var opciones = {};
  var resultado = null;

  var REGLAS = [
    { id: 'clienteRazonSocial', requerido: 'Completá la razón social.' },
    {
      id: 'clienteCuit', requerido: 'Completá el CUIT.',
      regex: /^[0-9]{2}-[0-9]{8}-[0-9]$/, mensaje: 'El CUIT tiene que tener 11 números.'
    },
    { id: 'clienteCondFiscal', requerido: 'Seleccioná la condición de IVA.' },
    { id: 'clienteTelefono', requerido: 'Completá el teléfono.', soloNumeros: true, max: 10 },
    {
      id: 'clienteEmail', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      mensaje: 'Revisá el e-mail: tiene que tener @ y un dominio, como nombre@correo.com.'
    },
    { id: 'clienteProvincia', requerido: 'Seleccioná una provincia.' },
    { id: 'clienteLocalidad', requerido: 'Seleccioná una localidad.' },
    { id: 'clienteCalle', requerido: 'Completá la calle.' },
    { id: 'clienteAltura', requerido: 'Completá la altura.' },
    { id: 'clienteCodigoPostal', max: 20 }
  ];

  var MARCADO =
    '<div class="modal fade" id="modalCliente" tabindex="-1" aria-labelledby="modalClienteTitulo" aria-hidden="true" data-bs-backdrop="static">' +
    '<div class="modal-dialog modal-dialog-centered modal-lg modal-fullscreen-sm-down"><div class="modal-content">' +
    '<div class="modal-header"><h5 class="modal-title" id="modalClienteTitulo">Registrar cliente</h5>' +
    '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>' +
    '<div class="modal-body">' +
    '<div id="avisoCliente" class="alert alert-light-danger color-danger" style="display: none;" role="alert"></div>' +
    '<div class="d-flex flex-wrap gap-4 mb-4" id="datosEdicionCliente">' +
    '<div><span class="text-muted me-1">Estado:</span><span id="estadoActualCliente"></span></div>' +
    '<div><span class="text-muted me-1">Fecha de alta:</span><span id="fechaAltaCliente"></span></div></div>' +
    '<form class="form" id="formCliente" novalidate>' +
    '<h6 class="mb-3">Datos fiscales</h6><div class="row g-3 mb-4">' +
    '<div class="col-12 col-md-8"><label for="clienteRazonSocial" class="form-label">Razón social <span class="text-danger">*</span></label>' +
    '<input type="text" id="clienteRazonSocial" class="form-control" placeholder="Distribuidora Norte S.A." autocomplete="off"><div class="invalid-feedback"></div></div>' +
    '<div class="col-12 col-md-4"><label for="clienteCuit" class="form-label">CUIT <span class="text-danger">*</span></label>' +
    '<input type="text" inputmode="numeric" id="clienteCuit" class="form-control" placeholder="30-71234567-8" autocomplete="off"><div class="invalid-feedback"></div></div>' +
    '<div class="col-12"><label for="clienteNombreComercial" class="form-label">Nombre comercial</label>' +
    '<input type="text" id="clienteNombreComercial" class="form-control" placeholder="Las Lomas" autocomplete="off" maxlength="100">' +
    '<div class="form-text">Nombre de fantasía o marca, si es distinto de la razón social.</div><div class="invalid-feedback"></div></div>' +
    '<div class="col-12 col-md-6"><label for="clienteCondFiscal" class="form-label">Condición de IVA <span class="text-danger">*</span></label>' +
    '<select id="clienteCondFiscal" class="form-select"><option value="">Seleccioná una condición</option>' +
    '<option value="1">Responsable inscripto</option><option value="2">Monotributista</option><option value="3">Exento</option></select>' +
    '<div class="invalid-feedback"></div></div>' +
    '<div class="col-12 col-md-6"><label for="clienteTipo" class="form-label">Tipo de cliente</label>' +
    '<select id="clienteTipo" class="form-select"><option value="Directo">Directo (sin sistema intermedio)</option>' +
    '<option value="Con_plataforma">Con plataforma (por ejemplo, Rukas)</option></select>' +
    // Desde una proforma el tipo no se cambia: se ve como texto con el motivo (§6.3).
    '<div id="clienteTipoFijo" class="d-none"><div class="sgtl-dato-valor" id="clienteTipoTexto"></div>' +
    '<div class="form-text" id="clienteTipoMotivo"></div></div>' +
    '<div class="invalid-feedback"></div></div></div>' +
    '<h6 class="mb-3">Contacto</h6><div class="row g-3 mb-4">' +
    '<div class="col-12 col-md-6"><label for="clienteTelefono" class="form-label">Teléfono <span class="text-danger">*</span></label>' +
    '<input type="text" inputmode="numeric" id="clienteTelefono" class="form-control" placeholder="3514123456" autocomplete="off">' +
    '<div class="invalid-feedback"></div><div class="form-text">Código de área sin 0 y número sin 15</div></div>' +
    '<div class="col-12 col-md-6"><label for="clienteEmail" class="form-label">E-mail</label>' +
    '<input type="email" id="clienteEmail" class="form-control" placeholder="nombre@correo.com" autocomplete="off"><div class="invalid-feedback"></div></div></div>' +
    '<h6 class="mb-3">Domicilio</h6><div class="row g-3">' +
    '<div class="col-12 col-md-6"><label for="clienteProvincia" class="form-label">Provincia <span class="text-danger">*</span></label>' +
    '<select id="clienteProvincia" class="form-select"></select><div class="invalid-feedback"></div></div>' +
    '<div class="col-12 col-md-6"><label for="clienteLocalidad" class="form-label">Localidad <span class="text-danger">*</span></label>' +
    '<select id="clienteLocalidad" class="form-select" disabled></select><div class="invalid-feedback"></div></div>' +
    '<div class="col-12 col-md-6"><label for="clienteCalle" class="form-label">Calle <span class="text-danger">*</span></label>' +
    '<input type="text" id="clienteCalle" class="form-control" placeholder="Av. Faraday" autocomplete="off"><div class="invalid-feedback"></div></div>' +
    '<div class="col-6 col-md-3"><label for="clienteAltura" class="form-label">Altura <span class="text-danger">*</span></label>' +
    '<input type="text" id="clienteAltura" class="form-control" placeholder="1234" autocomplete="off"><div class="invalid-feedback"></div></div>' +
    '<div class="col-6 col-md-3"><label for="clienteCodigoPostal" class="form-label">Código postal</label>' +
    '<input type="text" id="clienteCodigoPostal" class="form-control" placeholder="5000" autocomplete="postal-code"><div class="invalid-feedback"></div></div>' +
    '</div></form></div>' +
    '<div class="modal-footer"><button type="button" class="btn btn-light-secondary" data-bs-dismiss="modal">Cancelar</button>' +
    '<button type="button" class="btn btn-primary" id="btnGuardarCliente">Guardar</button></div>' +
    '</div></div></div>';

  function $id(id) { return document.getElementById(id); }
  function usuarioActual(porDefecto) { return localStorage.getItem('username') || porDefecto; }

  function cargarProvincias(select) {
    if (!provincias) {
      provincias = SGTL.ajax({ url: API + '/Provincias', type: 'GET' },
        'No se pudieron cargar las provincias. Revisá la conexión y probá de nuevo.');
      provincias.catch(function () { provincias = null; });
    }
    return provincias.then(function (lista) {
      select.innerHTML = '';
      select.appendChild(new Option('Seleccioná una provincia', ''));
      lista.forEach(function (provincia) { select.appendChild(new Option(provincia.Nombre_Provincia, provincia.Prov_ID)); });
    });
  }

  function cargarLocalidades(select, provinciaId) {
    select.innerHTML = '';
    select.appendChild(new Option('Seleccioná una localidad', ''));
    select.disabled = true;
    if (!provinciaId) return Promise.resolve();
    return SGTL.ajax({ url: API + '/Provincias/' + provinciaId + '/Localidades', type: 'GET' },
      'No se pudieron cargar las localidades. Revisá la conexión y probá de nuevo.').then(function (localidades) {
        localidades.forEach(function (localidad) { select.appendChild(new Option(localidad.Nombre_Localidad, localidad.Loc_ID)); });
        select.disabled = false;
      });
  }

  // Resuelve false si el CUIT ya es de otro cliente (y lo marca en el formulario).
  function verificarCUIT() {
    var campo = $id('clienteCuit');
    var cuit = campo.value.replace(/\D/g, '');
    if (cuit.length !== 11) return Promise.resolve(true);
    var url = enEdicion ? API + '/Clientes/ValidarCUIT/' + cuit + '/' + enEdicion : API + '/Clientes/ValidarCUIT/' + cuit;
    return SGTL.ajax({ url: url, type: 'GET' }, 'No se pudo verificar el CUIT. Probá de nuevo.').then(function (respuesta) {
      if (campo.value.replace(/\D/g, '') !== cuit) return true;
      if (respuesta && respuesta.codigo === 'CUIT_registrado') {
        campo.dataset.errorRemoto = enEdicion ? 'El CUIT ya está registrado con otro cliente.' : 'El CUIT ya está registrado.';
        SGTL.marcarError(campo, campo.dataset.errorRemoto);
        return false;
      }
      return true;
    });
  }

  function asegurarModal() {
    if (formulario) return;
    if (!$id('modalCliente')) {
      var nodo = document.createElement('div');
      nodo.innerHTML = MARCADO;
      document.body.appendChild(nodo.firstChild);
    }
    formulario = SGTL.validador(REGLAS);
    var cuit = $id('clienteCuit');
    cuit.addEventListener('input', function () { cuit.value = formatearCUIT(cuit.value); });
    cuit.addEventListener('blur', function () {
      if (!cuit.classList.contains('is-invalid')) verificarCUIT().catch(function () { });
    });
    var provincia = $id('clienteProvincia');
    provincia.addEventListener('change', function () {
      cargarLocalidades($id('clienteLocalidad'), provincia.value).catch(function (error) {
        SGTL.avisoFormulario('#avisoCliente', error.mensajeUsuario);
      });
    });
    $id('btnGuardarCliente').addEventListener('click', guardar);
    $('#modalCliente').on('shown.bs.modal', function () {
      if (!enEdicion) $('#clienteRazonSocial').trigger('focus');
    });
    // Al cerrarse (guardado o cancelado), avisa a quien lo abrió: la proforma vuelve a mostrarse.
    $('#modalCliente').on('hidden.bs.modal', function () {
      var alCerrar = opciones.alCerrar;
      var hecho = resultado;
      opciones = {};
      resultado = null;
      if (typeof alCerrar === 'function') alCerrar(hecho);
    });
  }

  // El tipo de cliente como campo o, desde una proforma, como texto con el motivo.
  function mostrarTipo() {
    var select = $id('clienteTipo');
    var bloqueado = !!opciones.tipoBloqueado;
    select.classList.toggle('d-none', bloqueado);
    $id('clienteTipoFijo').classList.toggle('d-none', !bloqueado);
    if (!bloqueado) return;
    var elegida = select.options[select.selectedIndex];
    $id('clienteTipoTexto').textContent = elegida ? elegida.textContent : '';
    $id('clienteTipoMotivo').textContent = opciones.tipoBloqueado;
  }

  function abrir(id, opcionesAbrir) {
    asegurarModal();
    opciones = opcionesAbrir || {};
    resultado = null;
    var esAlta = !id;
    enEdicion = esAlta ? null : id;
    original = null;
    SGTL.reiniciarFormulario('#formCliente', '#avisoCliente');
    formulario.reiniciar();
    $('#modalClienteTitulo').text(esAlta ? 'Registrar cliente' : 'Editar cliente');
    $('#datosEdicionCliente').toggleClass('d-none', esAlta);
    $('#estadoActualCliente, #fechaAltaCliente').empty();
    $('#clienteTipo').val('Directo');
    mostrarTipo();
    var provincia = $id('clienteProvincia');
    var localidad = $id('clienteLocalidad');
    var boton = $id('btnGuardarCliente');
    cargarLocalidades(localidad, '');
    boton.disabled = true;
    SGTL.modal('#modalCliente', 'show');

    if (esAlta) {
      cargarProvincias(provincia).then(function () { boton.disabled = false; }, function (error) {
        SGTL.avisoFormulario('#avisoCliente', error.mensajeUsuario);
      });
      return;
    }

    SGTL.ajax({ url: API + '/Clientes/' + id, type: 'GET' },
      'No se pudieron cargar los datos del cliente. Probá de nuevo.').then(function (data) {
        original = data;
        $('#clienteRazonSocial').val(data.Razon_Social || '');
        $('#clienteNombreComercial').val(data.Nombre_Comercial || '');
        $('#clienteCuit').val(formatearCUIT(data.CUIT_Cliente));
        $('#clienteCondFiscal').val(CONDICIONES_IVA[data.Cond_Fiscal] ? String(data.Cond_Fiscal) : '');
        $('#clienteTipo').val(data.Tipo_Cliente === 'Con_plataforma' ? 'Con_plataforma' : 'Directo');
        mostrarTipo();
        $('#clienteTelefono').val((data.Telefono || '').trim());
        $('#clienteEmail').val(data.Email || '');
        $('#clienteCalle').val(data.Calle || '');
        $('#clienteAltura').val((data.AlturaCalle || '').trim());
        $('#clienteCodigoPostal').val(data.CodigoPostal || '');
        $('#estadoActualCliente').html(SGTL.estado(estadoCliente(clienteActivo(data))));
        $('#fechaAltaCliente').text(fechaCliente(data.Fecha_Alta));
        return cargarProvincias(provincia).then(function () {
          provincia.value = data.ProvID || '';
          return cargarLocalidades(localidad, data.ProvID);
        }).then(function () {
          localidad.value = data.LocID || '';
          boton.disabled = false;
        });
      }).catch(function (error) {
        SGTL.modal('#modalCliente', 'hide');
        SGTL.toastError(error.mensajeUsuario);
      });
  }

  function datos() {
    var valor = function (id) { return $id(id).value.trim(); };
    return {
      Cliente_ID: enEdicion ? parseInt(enEdicion, 10) : 0,
      Razon_Social: valor('clienteRazonSocial'),
      Nombre_Comercial: valor('clienteNombreComercial'),
      CUIT_Cliente: valor('clienteCuit').replace(/\D/g, ''),
      Cond_Fiscal: parseInt(valor('clienteCondFiscal'), 10),
      Tipo_Cliente: valor('clienteTipo'),
      Telefono: valor('clienteTelefono'),
      Email: valor('clienteEmail'),
      ProvID: parseInt(valor('clienteProvincia'), 10),
      LocID: parseInt(valor('clienteLocalidad'), 10),
      Calle: valor('clienteCalle'),
      AlturaCalle: valor('clienteAltura'),
      CodigoPostal: valor('clienteCodigoPostal')
    };
  }

  // Lo que dice el aviso al guardar: si el cliente tiene borradores de proforma, que también se actualizaron.
  function mensajeGuardado(esAlta, respuesta) {
    if (esAlta) return 'Cliente registrado.';
    var cantidad = respuesta && respuesta.Borradores ? Number(respuesta.Borradores) : 0;
    if (cantidad === 1 && respuesta.BorradorID) {
      return 'Cliente actualizado. También se actualizaron sus datos en el borrador de proforma #' + respuesta.BorradorID + '.';
    }
    if (cantidad > 1) return 'Cliente actualizado. También se actualizaron sus datos en ' + cantidad + ' borradores de proforma.';
    return 'Cliente actualizado.';
  }

  async function guardar() {
    var esAlta = !enEdicion;
    var boton = $id('btnGuardarCliente');
    formulario.validarTodo();
    if (!SGTL.revisarFormulario('#formCliente', '#avisoCliente')) return;

    var listo = SGTL.procesando(boton, 'Guardando…');
    var respuesta = null;
    var guardado = false;
    try {
      if (!(await verificarCUIT())) {
        SGTL.revisarFormulario('#formCliente', '#avisoCliente');
        return;
      }
      var usuario = usuarioActual('Desconocido');
      var ahora = new Date().toISOString();
      var cliente = Object.assign(datos(), {
        Fecha_Alta: esAlta ? ahora : original.Fecha_Alta,
        Usu_Alta: esAlta ? usuario : original.Usu_Alta,
        Fecha_Modi: ahora,
        Usu_Modi: usuario
      });
      respuesta = await SGTL.ajax({
        url: esAlta ? API + '/Clientes' : API + '/Clientes/' + enEdicion,
        type: esAlta ? 'POST' : 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(cliente)
      }, 'No se pudo guardar el cliente. Revisá la conexión y probá de nuevo.');
      guardado = true;
    } catch (error) {
      SGTL.avisoFormulario('#avisoCliente', error.mensajeUsuario || 'No se pudo guardar el cliente. Probá de nuevo.');
    } finally {
      listo();
    }

    if (!guardado) return;
    SGTL.toastExito(mensajeGuardado(esAlta, respuesta));
    resultado = {
      esAlta: esAlta,
      id: enEdicion,
      borradores: respuesta && respuesta.Borradores ? Number(respuesta.Borradores) : 0,
      borradorID: respuesta && respuesta.BorradorID ? respuesta.BorradorID : null
    };
    setTimeout(function () { SGTL.modal('#modalCliente', 'hide'); }, 0);
  }

  window.SGTLEditarCliente = { abrir: abrir };
})(window, document);
