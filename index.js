require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT;

// Aumentar o limite de tamanho do corpo da solicitação
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Use a string de conexão do MongoDB Atlas armazenada em uma variável de ambiente
const mongoURI = process.env.MONGO_URI; // Definido na variável de ambiente
console.log('MongoDB URI:', mongoURI);
const dbName = 'loginDB';
let db;

// Criação do MongoClient com as opções da Stable API
const client = new MongoClient(mongoURI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function connectToDatabase() {
    try {
        // Conectar o cliente ao servidor
        await client.connect();
        // Enviar um ping para confirmar uma conexão bem-sucedida
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // Inicializar o banco de dados após a conexão
        db = client.db(dbName);
        
        // Iniciar o servidor após a conexão com o banco de dados
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database. Exiting now...', error);
        process.exit(1);
    }
}

connectToDatabase();

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
