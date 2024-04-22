const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');


const app = express();
const port = process.env.PORT || 3000;

const mongoURI = 'mongodb+srv://rexxailabs:bmX0OM7YGEglDFyl@cluster0.pmf3vhf.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conexión a MongoDB Atlas exitosa'))
.catch(err => console.log(err));

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    privilegios: Number,
    autorizacion: String
});

const User = mongoose.model('User', UserSchema);

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existeuser = await User.findOne({username})
        if(existeuser){
            return res.status(400).send('El nombre de usuario ya esya en uso')
        }
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
            const token = jwt.sign({ userId: user._id }, 'secreto', { expiresIn: '1h' });
            // res.json({ token });
            console.log(token)
            res.redirect('/users');
        } else {
            res.send('Credenciales inválidas');
        }
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
});

app.post('/users', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).send(newUser);
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al crear el usuario');
    }
});

// Ruta para mostrar la lista de usuarios
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.render('users', { users });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al obtener los usuarios');
    }
});

// Leer un usuario por su ID
app.get('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.send(user);
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al obtener el usuario');
    }
});

// Middleware para editar un usuario
app.get('/users/:id/edit', async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.render('editUser', { user });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al buscar el usuario');
    }
});


app.post('/users/:id/edit', async (req, res) => {
    const userId = req.params.id;
    const { username, password, privilegios, autorizacion } = req.body;

    try {
        // Obtener el usuario existente de la base de datos
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Construir el objeto con los datos actualizados
        const updatedData = {};
        if (username) {
            updatedData.username = username;
        }
        if (password) {
            // Encriptar la nueva contraseña si se proporciona
            updatedData.password = await bcrypt.hash(password, 10);
        }
        if (privilegios) {
            updatedData.privilegios = privilegios;
        }
        if (autorizacion) {
            updatedData.autorizacion = autorizacion;
        }

        // Actualizar el usuario con los datos actualizados
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });
        if (!updatedUser) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Redireccionar a la página de lista de usuarios después de la actualización
        res.redirect('/users');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al actualizar el usuario');
    }
});





// Eliminar un usuario
app.post('/users/:id/delete', async (req, res) => {
    const userId = req.params.id;
    try {
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.redirect('/users');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al eliminar el usuario');
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
