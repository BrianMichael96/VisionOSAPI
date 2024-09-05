const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3000;

// Aumentar o limite de tamanho do corpo da solicitação
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Use a string de conexão do MongoDB Atlas armazenada em uma variável de ambiente
const mongoURI = process.env.MONGO_URI;
const dbName = 'loginDB';
let db;

// Conectar ao MongoDB
MongoClient.connect(mongoURI)
    .then(client => {
        db = client.db(dbName);
        console.log("Successfully connected to the database");

        // Iniciar o servidor após a conexão com o banco de dados
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Failed to connect to the database. Exiting now...', err);
        process.exit();
    });

// Endpoint para salvar/atualizar o estado de login e dados do usuário
app.post('/saveUserInformation', async (req, res) => {
    const userInfo = req.body;

    try {
        const collection = db.collection('userInformation');
        await collection.updateOne(
            {}, // Sem filtro específico para garantir que só haverá um documento
            { $set: userInfo }, // Atualizar ou inserir dados
            { upsert: true }
        );
        res.send({ success: true });
    } catch (error) {
        console.error('Error saving user information:', error);
        res.status(500).send({ success: false });
    }
});

// Endpoint para obter as informações do usuário
app.get('/getUserInformation', async (req, res) => {
    try {
        const collection = db.collection('userInformation');
        const userInfo = await collection.findOne({});
        if (userInfo) {
            res.send(userInfo);
        } else {
            res.status(404).send({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).send({ success: false });
    }
});

// Endpoint para limpar a coleção de usuários
app.delete('/clearUsers', async (req, res) => {
    try {
        const collection = db.collection('userInformation');
        await collection.deleteMany({});
        res.send({ success: true });
    } catch (error) {
        console.error('Error clearing users collection:', error);
        res.status(500).send({ success: false });
    }
});

// Endpoint para listar todos os usuários (apenas um neste caso)
app.get('/listUsers', async (req, res) => {
    try {
        const collection = db.collection('userInformation');
        const users = await collection.find({}).toArray();
        res.send(users);
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).send({ success: false });
    }
});

// Endpoint para atualizar um campo específico
app.patch('/updateUserField', async (req, res) => {
    const { fieldName, fieldValue } = req.body;

    try {
        const collection = db.collection('userInformation');
        await collection.updateOne(
            {},
            { $set: { [fieldName]: fieldValue } }
        );
        res.send({ success: true });
    } catch (error) {
        console.error('Error updating user field:', error);
        res.status(500).send({ success: false });
    }
});

// Endpoint para atualizar o PIN do usuário
app.patch('/updateUserPin', async (req, res) => {
    const { pin } = req.body;

    try {
        const collection = db.collection('userInformation');
        await collection.updateOne(
            {},
            { $set: { pin: pin } }
        );
        res.send({ success: true });
    } catch (error) {
        console.error('Error updating user pin:', error);
        res.status(500).send({ success: false });
    }
});
