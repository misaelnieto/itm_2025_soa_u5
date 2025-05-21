// src/models/Match.js
const mongoose = require("mongoose");

// Esquema para representar un Pokémon dentro de una batalla
const battlePokemonSchema = new mongoose.Schema({
  pokemonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pokemon', required: true },
  currentHp: { type: Number, required: true },
  // Movimientos restantes (PP)
  moves: [{
    moveIndex: { type: Number, required: true },
    ppLeft: { type: Number, required: true }
  }]
});

// Esquema para las acciones/movimientos realizados en una partida
const actionSchema = new mongoose.Schema({
  player: { type: String, required: true }, // Nombre del jugador
  move: { type: String, required: true },   // Nombre del movimiento
  target: { type: String, required: true }, // A quién afecta el movimiento
  damage: { type: Number, default: 0 },
  effectiveness: { type: String, default: 'normal' }, // 'not effective', 'normal', 'super effective'
  timestamp: { type: Date, default: Date.now }
});

// Esquema para partidas
const matchSchema = new mongoose.Schema({
  // Campo para el identificador de sala (roomId) que se genera en gameSocket.js
  roomId: { type: String, required: true, unique: true },
  
  // Jugadores
  players: [{
    username: { type: String, required: true },
    pokemon: [battlePokemonSchema]
  }],
    // Estado de la partida
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'completed', 'abandoned', 'opponentDisconnected'], 
    default: 'waiting' 
  },
  
  currentTurn: { type: String, default: null }, // Nombre del jugador que tiene el turno
  winner: { type: String, default: null },      // Nombre del ganador
  
  // Historial de acciones de la partida
  actions: [actionSchema],
  
  // Fechas de inicio y fin
  startedAt: { type: Date },
  endedAt: { type: Date }
}, { timestamps: true });

const Match = mongoose.model("Match", matchSchema);

module.exports = Match;
