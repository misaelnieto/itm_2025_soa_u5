// src/utils/initData.js
const mongoose = require('mongoose');
const Pokemon = require('../models/Pokemon');

// Array de Pokémon iniciales
const initialPokemons = [
  {
    name: "Pikachu",
    type: {
      primary: "electric",
      secondary: null
    },    stats: {
      hp: 105, // Increased from 35
      attack: 55,
      defense: 40,
      specialAttack: 50,
      specialDefense: 50,
      speed: 90
    },
    level: 50,
    moves: [
      {
        name: "Thunderbolt",
        type: "electric",
        power: 90,
        accuracy: 100,
        pp: 15
      },
      {
        name: "Quick Attack",
        type: "normal",
        power: 40,
        accuracy: 100,
        pp: 30
      },
      {
        name: "Iron Tail",
        type: "steel",
        power: 100,
        accuracy: 75,
        pp: 15
      },
      {
        name: "Electro Ball",
        type: "electric",
        power: 80,
        accuracy: 100,
        pp: 10
      }
    ],
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
  },
  {
    name: "Charizard",
    type: {
      primary: "fire",
      secondary: "flying"
    },    stats: {
      hp: 234, // Increased from 78
      attack: 84,
      defense: 78,
      specialAttack: 109,
      specialDefense: 85,
      speed: 100
    },
    level: 50,
    moves: [
      {
        name: "Flamethrower",
        type: "fire",
        power: 90,
        accuracy: 100,
        pp: 15
      },
      {
        name: "Dragon Claw",
        type: "dragon",
        power: 80,
        accuracy: 100,
        pp: 15
      },
      {
        name: "Air Slash",
        type: "flying",
        power: 75,
        accuracy: 95,
        pp: 20
      },
      {
        name: "Earthquake",
        type: "ground",
        power: 100,
        accuracy: 100,
        pp: 10
      }
    ],
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png"
  },
  {
    name: "Blastoise",
    type: {
      primary: "water",
      secondary: null
    },    stats: {
      hp: 237, // Increased from 79
      attack: 83,
      defense: 100,
      specialAttack: 85,
      specialDefense: 105,
      speed: 78
    },
    level: 50,
    moves: [
      {
        name: "Hydro Pump",
        type: "water",
        power: 110,
        accuracy: 80,
        pp: 5
      },
      {
        name: "Ice Beam",
        type: "ice",
        power: 90,
        accuracy: 100,
        pp: 10
      },
      {
        name: "Flash Cannon",
        type: "steel",
        power: 80,
        accuracy: 100,
        pp: 10
      },
      {
        name: "Dark Pulse",
        type: "dark",
        power: 80,
        accuracy: 100,
        pp: 15
      }
    ],
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png"
  },
  {
    name: "Venusaur",
    type: {
      primary: "grass",
      secondary: "poison"
    },    stats: {
      hp: 240, // Increased from 80
      attack: 82,
      defense: 83,
      specialAttack: 100,
      specialDefense: 100,
      speed: 80
    },
    level: 50,
    moves: [
      {
        name: "Solar Beam",
        type: "grass",
        power: 120,
        accuracy: 100,
        pp: 10
      },
      {
        name: "Sludge Bomb",
        type: "poison",
        power: 90,
        accuracy: 100,
        pp: 10
      },
      {
        name: "Earth Power",
        type: "ground",
        power: 90,
        accuracy: 100,
        pp: 10
      },
      {
        name: "Sleep Powder",
        type: "grass",
        power: 0,
        accuracy: 75,
        pp: 15
      }
    ],
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png"
  },
  {
    name: "Mewtwo",
    type: {
      primary: "psychic",
      secondary: null
    },    stats: {
      hp: 318, // Increased from 106
      attack: 110,
      defense: 90,
      specialAttack: 154,
      specialDefense: 90,
      speed: 130
    },
    level: 50,
    moves: [
      {
        name: "Psychic",
        type: "psychic",
        power: 90,
        accuracy: 100,
        pp: 10
      },
      {
        name: "Shadow Ball",
        type: "ghost",
        power: 80,
        accuracy: 100,
        pp: 15
      },
      {
        name: "Aura Sphere",
        type: "fighting",
        power: 80,
        accuracy: 100,
        pp: 20
      },
      {
        name: "Ice Beam",
        type: "ice",
        power: 90,
        accuracy: 100,
        pp: 10
      }
    ],
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png"
  }
];

// Función para inicializar la base de datos con Pokémon
async function initializePokemonDatabase() {
  try {
    // Comprobar si ya hay Pokémon en la base de datos
    const count = await Pokemon.countDocuments();
    
    if (count === 0) {
      console.log("🌱 Inicializando base de datos con Pokémon");
      
      // Insertar todos los Pokémonwha
      await Pokemon.insertMany(initialPokemons);
      
      console.log(`✅ Base de datos inicializada con ${initialPokemons.length} Pokémon`);
    } else {
      console.log(`ℹ️ Base de datos ya tiene ${count} Pokémon, no es necesario inicializar`);
    }
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error);
  }
}

module.exports = { initializePokemonDatabase };
