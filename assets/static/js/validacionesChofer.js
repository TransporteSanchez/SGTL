// Campos del formulario de choferes (alta y edición). El id de cada campo en la pantalla es el
// prefijo del formulario ('alta' o 'editar') más el id de acá: altaDNI, editarDNI.
var LETRAS_CHOFER = /^[A-Za-záéíóúÁÉÍÓÚñÑ\s´]+$/;

var camposChofer = [
    { id: 'Nombre', requerido: 'Completá el nombre.', regex: LETRAS_CHOFER, mensaje: 'Usá solo letras y espacios.', max: 50, soloLetras: true },
    { id: 'Apellido', requerido: 'Completá el apellido.', regex: LETRAS_CHOFER, mensaje: 'Usá solo letras y espacios.', max: 50, soloLetras: true },
    { id: 'DNI', requerido: 'Completá el DNI.', regex: /^[0-9]{7,8}$/, mensaje: 'El DNI tiene que tener 7 u 8 números.', max: 8, soloNumeros: true },
    { id: 'CUIL', requerido: 'Completá el CUIL.', regex: /^[0-9]{11}$/, mensaje: 'El CUIL tiene que tener 11 números.', max: 11, soloNumeros: true },
    { id: 'Celular', requerido: 'Completá el teléfono celular.', regex: /^[0-9]{10}$/, mensaje: 'El teléfono celular tiene que tener 10 números.', max: 10, soloNumeros: true },
    { id: 'Telefono', regex: /^[0-9]{10}$/, mensaje: 'El teléfono particular tiene que tener 10 números.', max: 10, soloNumeros: true },
    { id: 'Email', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, mensaje: 'Revisá el e-mail: tiene que tener @ y un dominio, como nombre@correo.com.' },
    { id: 'Provincia', requerido: 'Seleccioná una provincia.' },
    { id: 'Localidad', requerido: 'Seleccioná una localidad.' },
    { id: 'Calle', requerido: 'Completá la calle.' },
    { id: 'CalleAltura' }
];
