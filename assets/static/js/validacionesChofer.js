const equivalenciasCamposChofer = {
    nombre: ['#altaNombre', '#editarNombre'],
    apellido: ['#altaApellido', '#editarApellido'],
    dni: ['#altaDNI', '#editarDNI'],
    cuil: ['#altaCUIL', '#editarCUIL'],
    celular: ['#altaCelular', '#editarCelular'],
    telefono: ['#altaTelefono', '#editarTelefono'],
    email: ['#altaEmail', '#editarEmail'],
    provincia: ['#altaProvincia', '#editarProvincia'],
    localidad: ['#altaLocalidad', '#editarLocalidad'],
    calle: ['#altaCalle', '#editarCalle'],
    alturaCalle: ['#altaCalleAltura', '#editarCalleAltura'],
    nombreUsuario: ['#altaNombreUsuario', '#editarNombreUsuario'],
    contrasena: ['#altaContrasena', '#editarContrasena']
};

const camposRequeridosChofer = {
    alta: [
        '#altaNombre', '#altaApellido', '#altaDNI', '#altaCUIL',
        '#altaCelular', '#altaProvincia', '#altaLocalidad', '#altaCalle',
        '#altaEmail', '#altaNombreUsuario', '#altaContrasena'
    ],
    edicion: [
        '#editarNombre', '#editarApellido', '#editarDNI', '#editarCUIL',
        '#editarCelular', '#editarProvincia', '#editarLocalidad', '#editarCalle'
    ]
};


const reglasValidacionChofer = {
    dni: {
        error: {
            alta: '#altaDNI-error',
            editar: '#editarDNI-error'
        },
        regex: /^[0-9]{7,8}$/,
        mensaje: 'El DNI debe incluir entre 7 y 8 caracteres.',
        min: 7,
        max: 8,
        soloNumeros: true
    },
    cuil: {
        error: {
            alta: '#altaCUIL-error',
            editar: '#editarCUIL-error'
        },
        regex: /^[0-9]{11}$/,
        mensaje: 'El CUIL debe incluir 11 caracteres.',
        min: 11,
        max: 11,
        soloNumeros: true
    },
    celular: {
        error: {
            alta: '#altaCelular-error',
            editar: '#editarCelular-error'
        },
        regex: /^[0-9]{10}$/,
        mensaje: 'El teléfono debe incluir 10 dígitos.',
        min: 10,
        max: 10,
        soloNumeros: true
    },
    telefono: {
        error: {
            alta: '#altaTelefono-error',
            editar: '#editarTelefono-error'
        },
        regex: /^[0-9]{10}$/,
        mensaje: 'El teléfono debe incluir 10 dígitos.',
        min: 10,
        max: 10,
        soloNumeros: true
    },
    email: {
        error: {
            alta: '#altaEmail-error',
            editar: '#editarEmail-error'
        },
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        mensaje: 'Revisá el e-mail: tiene que tener @ y un dominio.',
        max: null,
        soloNumeros: false
    },
    nombre: {
        regex: /^[A-Za-záéíóúÁÉÍÓÚñÑ\s´]+$/,
        mensaje: 'Solo se permiten letras y espacios.',
        min: 1,
        max: 50,
        soloNumeros: false
    },
    apellido: {
        regex: /^[A-Za-záéíóúÁÉÍÓÚñÑ\s´]+$/,
        mensaje: 'Solo se permiten letras y espacios.',
        min: 1,
        max: 50,
        soloNumeros: false
    },
    nombreUsuario: {
        error: { alta: '#altaNombreUsuario-error', editar: '#editarNombreUsuario-error' },
        regex: /^[A-Za-z0-9_]{1,50}$/,
        mensaje: 'Usá solo letras, números y guion bajo.',
        min: 1,
        soloNumeros: false
    },
    contrasena: {
        error: { alta: '#altaContrasena-error', editar: '#editarContrasena-error' },
        regex: /^(?=.*[A-Za-z])(?=.*[0-9]).{8,20}$/,
        mensaje: 'Tiene que tener de 8 a 20 caracteres, con al menos una letra y un número.',
        min: 8,
        soloNumeros: false
    }
};

