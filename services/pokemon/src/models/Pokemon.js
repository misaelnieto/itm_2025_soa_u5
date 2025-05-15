// src/models/Pokemon.js
const mongoose = require("mongoose");

// Esquema para los movimientos del Pokémon
const moveSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  power: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  pp: { type: Number, required: true }, // Puntos de poder
});

// Esquema para Pokémon
const pokemonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    primary: { type: String, required: true },
    secondary: { type: String, default: null }
  },
  stats: {
    hp: { type: Number, required: true },
    attack: { type: Number, required: true },
    defense: { type: Number, required: true },
    specialAttack: { type: Number, required: true },
    specialDefense: { type: Number, required: true },
    speed: { type: Number, required: true }
  },
  level: { type: Number, default: 50 },
  moves: [moveSchema],
  image: { type: String, default: null }
}, { timestamps: true });

const Pokemon = mongoose.model("Pokemon", pokemonSchema);

module.exports = Pokemon;
