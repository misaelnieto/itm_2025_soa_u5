const WebSocket = require('ws');
const GameLogic = require('./game');
const Player = require('../models/Player');
const Game = require('../models/Game');

const rooms = new Map();

function initWebSocket(wss) {
    wss.on('connection', (ws) => {
        console.log('Nueva conexión WebSocket establecida');
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                await handleMessage(ws, data);
            } catch (error) {
                console.error('Error al procesar mensaje:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Error interno del servidor'
                }));
            }
        });
        
        ws.on('close', () => {
            handleDisconnection(ws);
        });
    });
}

async function handleMessage(ws, data) {
    switch (data.type) {
        case 'create_room':
            await handleCreateRoom(ws, data);
            break;
        case 'join':
            await handleJoinRoom(ws, data);
            break;
        case 'move':
            await handleMove(ws, data);
            break;
        case 'new_game':
            await handleNewGame(ws);
            break;
        default:
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Tipo de mensaje no válido'
            }));
    }
}

async function handleCreateRoom(ws, data) {
    try {
        if (!data.username) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Nombre de usuario requerido'
            }));
            return;
        }

        // Crear o actualizar jugador
        let player = await Player.findOne({ username: data.username });
        if (!player) {
            player = await Player.create({ username: data.username });
        }

        const roomId = Math.random().toString(36).substring(7);
        const gameLogic = new GameLogic();
        
        // Crear juego en la base de datos
        const game = await Game.create({
            roomId,
            player1: player._id,
            status: 'waiting'
        });

        rooms.set(roomId, {
            game: gameLogic,
            dbGame: game,
            players: new Map(),
            status: 'waiting'
        });

        const room = rooms.get(roomId);
        room.players.set(1, {
            ws,
            username: data.username,
            playerId: player._id
        });

        ws.roomId = roomId;
        ws.playerNumber = 1;
        ws.username = data.username;
        ws.playerId = player._id;

        ws.send(JSON.stringify({
            type: 'room_created',
            roomId,
            gameState: {
                board: gameLogic.getBoard(),
                currentTurn: gameLogic.getCurrentPlayer()
            }
        }));
    } catch (error) {
        console.error('Error al crear sala:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Error al crear la sala'
        }));
    }
}

async function handleJoinRoom(ws, data) {
    try {
        const room = rooms.get(data.roomId);
        if (!room) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Sala no encontrada'
            }));
            return;
        }

        if (room.players.size >= 2) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'La sala está llena'
            }));
            return;
        }

        // Crear o actualizar jugador
        let player = await Player.findOne({ username: data.username });
        if (!player) {
            player = await Player.create({ username: data.username });
        }

        // Actualizar juego en la base de datos
        room.dbGame.player2 = player._id;
        room.dbGame.status = 'playing';
        await room.dbGame.save();

        room.players.set(2, {
            ws,
            username: data.username,
            playerId: player._id
        });

        ws.roomId = data.roomId;
        ws.playerNumber = 2;
        ws.username = data.username;
        ws.playerId = player._id;

        room.status = 'playing';

        // Notificar a ambos jugadores
        broadcastToRoom(data.roomId, {
            type: 'game_start',
            gameState: {
                board: room.game.getBoard(),
                currentTurn: room.game.getCurrentPlayer()
            }
        });
    } catch (error) {
        console.error('Error al unirse a la sala:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Error al unirse a la sala'
        }));
    }
}

async function handleMove(ws, data) {
    try {
        const room = rooms.get(ws.roomId);
        if (!room) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Sala no encontrada'
            }));
            return;
        }

        if (room.game.getCurrentPlayer() !== ws.playerNumber) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'No es tu turno'
            }));
            return;
        }

        const result = room.game.makeMove(data.column);
        if (!result) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Movimiento inválido'
            }));
            return;
        }

        // Registrar movimiento en la base de datos
        room.dbGame.moves.push({
            player: ws.playerNumber,
            column: data.column,
            row: result.row,
        });

        broadcastToRoom(ws.roomId, {
            type: 'move',
            row: result.row,
            column: result.column,
            player: result.player,
            gameState: {
                board: room.game.getBoard(),
                currentTurn: room.game.getCurrentPlayer()
            }
        });

        if (result.hasWon || result.isDraw) {
            // Actualizar el juego en la base de datos
            room.dbGame.status = 'finished';
            room.dbGame.endTime = new Date();
            if (result.hasWon) {
                room.dbGame.winner = ws.playerNumber;
            } else {
                room.dbGame.isDraw = true;
            }
            await room.dbGame.save();

            // Actualizar estadísticas de los jugadores
            if (result.hasWon) {
                await Player.findByIdAndUpdate(ws.playerId, {
                    $inc: { wins: 1, gamesPlayed: 1 },
                    lastPlayed: new Date()
                });
                const loserId = ws.playerNumber === 1 ? room.players.get(2).playerId : room.players.get(1).playerId;
                await Player.findByIdAndUpdate(loserId, {
                    $inc: { losses: 1, gamesPlayed: 1 },
                    lastPlayed: new Date()
                });
            } else if (result.isDraw) {
                // Actualizar ambos jugadores en caso de empate
                await Player.updateMany(
                    { _id: { $in: [room.players.get(1).playerId, room.players.get(2).playerId] } },
                    { $inc: { draws: 1, gamesPlayed: 1 }, lastPlayed: new Date() }
                );
            }

            broadcastToRoom(ws.roomId, {
                type: 'game_over',
                winner: result.hasWon ? ws.playerNumber : null,
                isDraw: result.isDraw,
                gameState: {
                    board: room.game.getBoard(),
                    currentTurn: room.game.getCurrentPlayer()
                }
            });
        } else {
            await room.dbGame.save();
        }
    } catch (error) {
        console.error('Error al procesar movimiento:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Error al procesar el movimiento'
        }));
    }
}

async function handleNewGame(ws) {
    try {
        const room = rooms.get(ws.roomId);
        if (!room) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Sala no encontrada'
            }));
            return;
        }

        room.game.reset();

        // Crear nuevo juego en la base de datos
        const newGame = await Game.create({
            roomId: ws.roomId,
            player1: room.players.get(1).playerId,
            player2: room.players.get(2).playerId,
            status: 'playing'
        });

        room.dbGame = newGame;

        broadcastToRoom(ws.roomId, {
            type: 'game_start',
            gameState: {
                board: room.game.getBoard(),
                currentTurn: room.game.getCurrentPlayer()
            }
        });
    } catch (error) {
        console.error('Error al crear nuevo juego:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Error al iniciar nuevo juego'
        }));
    }
}

async function handleDisconnection(ws) {
    if (!ws.roomId) return;

    const room = rooms.get(ws.roomId);
    if (!room) return;

    // Actualizar el estado del juego en la base de datos
    if (room.dbGame && room.dbGame.status === 'playing') {
        room.dbGame.status = 'finished';
        room.dbGame.endTime = new Date();
        if (room.players.size === 2) {
            // Si el otro jugador sigue en la sala, darle la victoria
            const winner = ws.playerNumber === 1 ? 2 : 1;
            room.dbGame.winner = winner;
            const winnerPlayer = room.players.get(winner);
            if (winnerPlayer) {
                await Player.findByIdAndUpdate(winnerPlayer.playerId, {
                    $inc: { wins: 1, gamesPlayed: 1 },
                    lastPlayed: new Date()
                });
            }
            await Player.findByIdAndUpdate(ws.playerId, {
                $inc: { losses: 1, gamesPlayed: 1 },
                lastPlayed: new Date()
            });
        }
        await room.dbGame.save();
    }

    room.players.delete(ws.playerNumber);

    if (room.players.size === 0) {
        rooms.delete(ws.roomId);
    } else {
        broadcastToRoom(ws.roomId, {
            type: 'player_disconnected',
            message: `${ws.username} se ha desconectado`
        });
    }
}

function broadcastToRoom(roomId, message) {
    const room = rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    room.players.forEach(({ws}) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
        }
    });
}

module.exports = initWebSocket;