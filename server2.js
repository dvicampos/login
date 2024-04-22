const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de MongoDB Atlas
const mongoURI = 'mongodb+srv://rexxailabs:bmX0OM7YGEglDFyl@cluster0.pmf3vhf.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conexión a MongoDB Atlas exitosa'))
.catch(err => console.log(err));

// Definir un esquema y un modelo para los usuarios
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    privilegios: Number,
    autorizacion: Boolean
});

// username: rexxailabs@gmail.com
// pass: Mongo-123456789
// usercon: rexxailabs
// passcon: bmX0OM7YGEglDFyl

const User = mongoose.model('User', UserSchema);

// Configuración de middlewares
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword });
        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.redirect('/register');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            res.send('Inicio de sesión exitoso');
        } else {
            res.send('Credenciales inválidas');
        }
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
});

// Editar un usuario
app.get('/users/:id/edit', async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }
        // Renderizar una vista de edición de usuario, o redirigir a otra página según tu lógica
        res.render('editUser', { user });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al buscar el usuario');
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
