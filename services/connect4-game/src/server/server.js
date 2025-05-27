const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const cors = require('cors');
const { connectDB } = require('./database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 8090;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../client')));

// Conectar a MongoDB
connectDB();

// Rutas básicas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Rutas REST
app.post('/api/backend-connect4', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Se requiere un nombre de usuario' });
    }
    res.json({ message: 'Conexión exitosa' });
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