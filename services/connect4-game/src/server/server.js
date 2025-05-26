const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 8090;

// Conectar a MongoDB
const mongoUrl = 'mongodb://127.0.0.1:27017/connect4';
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err);
    // No detenemos el servidor si falla la conexión a MongoDB
    // para permitir el juego sin persistencia de datos
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../client')));

// Rutas básicas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Ruta para el leaderboard
app.get('/leaderboard', async (req, res) => {
    try {
        const Player = require('../models/Player');
        const players = await Player.find()
            .sort({ wins: -1 })
            .limit(10);
        res.json(players);
    } catch (error) {
        console.error('Error al obtener leaderboard:', error);
        res.status(500).json({ error: 'Error al obtener leaderboard' });
    }
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('¡Algo salió mal!');
});

// Inicializar WebSocket
require('./websocket')(wss);

server.listen(PORT, () => {
    console.log(`Servidor Connect4 ejecutándose en el puerto ${PORT}`);
});