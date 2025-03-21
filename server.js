// Importar módulos necesarios
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/historialClinico', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Definir esquema de pacientes
const pacienteSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    edad: Number,
    genero: String,
    sintomas: String,
    antecedentes: String,
    patologias: String,
    diagnostico: String,
    tratamiento: String
});
const Paciente = mongoose.model('Paciente', pacienteSchema);

// Definir esquema de usuarios
const usuarioSchema = new mongoose.Schema({
    username: String,
    password: String, // Almacena la contraseña de manera segura (encriptada)
});
const Usuario = mongoose.model('Usuario', usuarioSchema);

// Configurar middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Configuración de sesión
app.use(session({
    secret: 'secreto123', // Cambia esto por algo más seguro
    resave: false,
    saveUninitialized: true
}));

// Middleware para verificar si el usuario está autenticado
const verificarSesion = (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect('/login'); // Redirige a la página de login si no está autenticado
    }
    next(); // Si está autenticado, continúa con la siguiente ruta
};

// Rutas
app.get('/index', verificarSesion, (req, res) => {
    res.render('index');
});

// Ruta para ver todos los pacientes (protegida)
app.get('/pacientes', verificarSesion, async (req, res) => {
    const search = req.query.search || ''; // Asegurar que `search` siempre tenga un valor
    let pacientes;

    if (search) {
        pacientes = await Paciente.find({
            $or: [
                { nombre: new RegExp(search, 'i') },
                { apellido: new RegExp(search, 'i') }
            ]
        });
    } else {
        pacientes = await Paciente.find();
    }

    res.render('pacientes', { pacientes, search }); // Pasar `search` a la vista
});

// Ruta para ver los detalles de un paciente (protegida)
app.get('/paciente/:id', verificarSesion, async (req, res) => {
    const paciente = await Paciente.findById(req.params.id);
    if (!paciente) {
        return res.status(404).send('Paciente no encontrado');
    }
    res.render('detalle', { paciente }); // Renderiza la vista detalle.ejs
});

// Ruta para crear un nuevo paciente
app.get('/nuevo', verificarSesion, (req, res) => {
    res.render('formulario', { paciente: {} }); // Renderiza la vista formulario.ejs
});

// Ruta para editar un paciente existente
app.get('/editar/:id', verificarSesion, async (req, res) => {
    const paciente = await Paciente.findById(req.params.id);
    if (!paciente) {
        return res.status(404).send('Paciente no encontrado');
    }
    res.render('formulario', { paciente }); // Renderiza la vista formulario.ejs con datos del paciente
});

// Ruta para guardar un paciente (nuevo o editado)
app.post('/guardar', verificarSesion, async (req, res) => {
    const { id, nombre, apellido, edad, genero, sintomas, antecedentes, patologias, diagnostico, tratamiento } = req.body;
    if (id) {
        // Editar un paciente existente
        await Paciente.findByIdAndUpdate(id, { nombre, apellido, edad, genero, sintomas, antecedentes, patologias, diagnostico, tratamiento });
    } else {
        // Crear un nuevo paciente
        await Paciente.create({ nombre, apellido, edad, genero, sintomas, antecedentes, patologias, diagnostico, tratamiento });
    }
    res.redirect('/pacientes'); // Redirige a la lista de pacientes
});

// Ruta de login
app.get('/login', (req, res) => {
    res.render('login'); // Renderiza la vista login.ejs
});


// Ruta para procesar el login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const usuario = await Usuario.findOne({ username });
    
    if (!usuario) {
        return res.status(400).send('Usuario o contraseña incorrectos');
    }

    // Comparar la contraseña encriptada con la ingresada
    const esValido = await bcrypt.compare(password, usuario.password);
    if (!esValido) {
        return res.status(400).send('Usuario o contraseña incorrectos');
    }

    // Iniciar sesión
    req.session.usuario = usuario.username;
    res.redirect('/index'); // Redirige a la página principal si la autenticación es exitosa
});

// Ruta para registrar un nuevo usuario (solo una vez para crear un usuario admin)
app.post('/registro', async (req, res) => {
    const { username, password } = req.body;

    // Encriptar la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = new Usuario({
        username,
        password: hashedPassword
    });

    await nuevoUsuario.save();
    res.redirect('/login'); // Redirige al login después de registrar el usuario
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy(); // Elimina la sesión
    res.redirect('/login'); // Redirige al login
});

// Ruta de error para rutas no definidas
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// Iniciar servidor en el puerto 3000
app.listen(3000, () => {
    console.log('Servidor en http://localhost:3000');
});
