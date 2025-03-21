const Usuario = require('./models/Usuario');

// Crear un nuevo usuario
const crearUsuario = async () => {
    const usuario = new Usuario({
        username: 'admin',
        password: 'admin123'  // La contraseña se encriptará automáticamente
    });

    await usuario.save();
    console.log('Usuario creado');
};

crearUsuario();
