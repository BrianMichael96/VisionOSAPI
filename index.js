require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 8080;

// Aumentar o limite de tamanho do corpo da solicitação
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

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


// Endpoint para obter as informações do usuário
app.get('/getUserInformation', async (req, res) => {
    try {
        const collection = db.collection('userInformation');
        const users = await collection.find({}).toArray(); // Encontrar todos os usuários
        if (users.length > 0) {
            res.send(users); // Retornar a lista de usuários
        } else {
            res.status(404).send({ success: false, message: 'No users found' });
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



app.patch('/saveOrUpdateUserInformation/:userAlias', async (req, res) => {
    const userAlias = req.params.userAlias;
    const { contractPicture, pin, ...userInfo } = req.body;  // Extraímos contractPicture e pin

    try {
        const collection = db.collection('userInformation');

        // Atualiza os campos de userInfo (exceto contractPicture)
        const updateFields = { ...userInfo, pin }; // Garante que o pin sempre será atualizado ou mantido
        const unsetFields = {};  // Campos a serem removidos, como contractPicture

        // Se contractPicture for null ou undefined, removemos o campo
        if (contractPicture === null || contractPicture === undefined) {
            unsetFields.contractPicture = ""; // Remove o campo contractPicture
        } else {
            updateFields.contractPicture = contractPicture; // Atualiza contractPicture se houver valor
        }

        // Atualiza o documento, removendo contractPicture (se necessário) e atualizando pin
        await collection.updateOne(
            { userAlias: userAlias },
            {
                $set: updateFields,   // Atualiza os campos, incluindo o pin
                $unset: unsetFields   // Remove contractPicture se for null ou undefined
            },
            { upsert: true } // Insere o documento se ele não existir
        );

        res.send({ success: true });
    } catch (error) {
        console.error('Error saving or updating user information:', error);
        res.status(500).send({ success: false });
    }
});

app.get('/checkUser/:userAlias', async (req, res) => {
    const userAlias = req.params.userAlias;  // Pega o userAlias da URL

    try {
        const collection = db.collection('userInformation');
        const user = await collection.findOne({ userAlias: userAlias });  // Busca o usuário pelo userAlias

        if (user) {
            // Se o usuário for encontrado, retorna os dados
            res.send({ success: true, user });
        } else {
            // Se o usuário não for encontrado, retorna uma mensagem
            res.status(404).send({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error checking user:', error);
        res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
});



