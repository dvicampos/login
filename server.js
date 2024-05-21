const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

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

const gastoSchema = new mongoose.Schema({
    monto: String,
    gastos: String,
    tipo: String,
    tipoMonto: String,
    comentarios: String,
});


const User = mongoose.model('User', UserSchema);
const Gasto = mongoose.model('Gasto', gastoSchema);

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
// Ruta para mostrar la lista de gastos
app.get('/gastos', async (req, res) => {
    try {
        const gastos = await Gasto.find();
        res.render('gastos', { gastos });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al obtener los gastos');
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
// Leer un gasto por su ID
app.get('/gastos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const gasto = await Gasto.findById(id);
        if (!gasto) {
            return res.status(404).send('Gasto no encontrado');
        }
        res.send(gasto);
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al obtener el gasto');
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
// Middleware para editar un usuario
app.get('/gastos/:id/edit', async (req, res) => {
    const gastoId = req.params.id;
    try {
        const gasto = await Gasto.findById(gastoId);
        if (!gasto) {
            return res.status(404).send('Gasto no encontrado');
        }
        res.render('editGasto', { gasto });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al buscar el gasto');
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
app.post('/gastos/:id/edit', async (req, res) => {
    const gastoId = req.params.id;
    const { monto, gastos, tipo, tipoMonto, comentarios } = req.body;

    try {
        // Obtener el usuario existente de la base de datos
        const gasto = await Gasto.findById(gastoId);
        if (!gasto) {
            return res.status(404).send('Gasto no encontrado');
        }

        // Construir el objeto con los datos actualizados
        const updatedData = {};
        if (monto) {
            updatedData.monto = monto;
        }
        if (gastos) {
            // Encriptar la nueva contraseña si se proporciona
            updatedData.gastos = gastos
        }
        if (tipo) {
            updatedData.tipo = tipo;
        }
        if (tipoMonto) {
            updatedData.tipoMonto = tipoMonto;
        }
        if (comentarios) {
            updatedData.comentarios = comentarios;
        }

        // Actualizar el usuario con los datos actualizados
        const updatedGasto = await Gasto.findByIdAndUpdate(gastoId, updatedData, { new: true });
        if (!updatedGasto) {
            return res.status(404).send('Gasto no encontrado');
        }

        // Redireccionar a la página de lista de usuarios después de la actualización
        res.redirect('/gastos');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al actualizar el gastos');
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
// Eliminar un gastos
app.post('/gastos/:id/delete', async (req, res) => {
    const gastoId = req.params.id;
    try {
        const deletedGastos = await Gasto.findByIdAndDelete(gastoId);
        if (!deletedGastos) {
            return res.status(404).send('Gasto no encontrado');
        }
        res.redirect('/gastos');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error al eliminar el gastos');
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
