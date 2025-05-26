const mongoose = require('mongoose');
const dbConfig = require('../config/db.config');

// Base de datos en memoria para pruebas
const inMemoryDB = {
    players: new Map(),
    games: new Map()
};

async function connectDB() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(dbConfig.url, {
            ...dbConfig.options,
            serverSelectionTimeoutMS: 5000, // Tiempo de espera para la selección del servidor
            socketTimeoutMS: 45000, // Tiempo de espera para las operaciones
        });
        
        console.log('MongoDB conectado exitosamente');

        mongoose.connection.on('error', err => {
            console.error('Error de MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB desconectado');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('Conexión a MongoDB cerrada');
            process.exit(0);
        });

    } catch (error) {
        console.error('Error al conectar con MongoDB:', error);
        process.exit(1);
    }
}

module.exports = {
    connectDB,
    db: inMemoryDB
};